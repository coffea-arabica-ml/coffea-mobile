import { ErroCancelado } from './cancelamento'
import { API_URL } from './config'
import type { ImagemLocal } from './imagem'

const TEMPO_LIMITE_MS = 30_000

/**
 * Adapter do coffea-backend. Devolve um JSON no formato do contrato (ainda não normalizado).
 *
 * TODO(frente-6): hoje o backend responde só `{ categoria, severidade }` (uma folha, sem região).
 * Esse formato é convertido abaixo para uma lista de 1 folha; quando o backend passar a devolver
 * o contrato completo (`{ status, folhas }`), ele é repassado como está.
 */
export async function httpDiagnosticar(imagem: ImagemLocal, signal?: AbortSignal): Promise<unknown> {
  const formData = new FormData()
  // No React Native, arquivo em FormData é { uri, name, type }. Não definir Content-Type à mão:
  // o fetch precisa gerar o boundary do multipart sozinho.
  const nome = imagem.nomeArquivo.replace(/\.[a-z0-9]+$/i, '') + '.jpg'
  formData.append('imagem', { uri: imagem.uri, name: nome, type: 'image/jpeg' } as unknown as Blob)

  // Sem AbortSignal.timeout/any no RN: um controlador próprio junta o cancelamento e o tempo limite.
  const controlador = new AbortController()
  let estourou = false
  const timer = setTimeout(() => {
    estourou = true
    controlador.abort()
  }, TEMPO_LIMITE_MS)
  const repassarCancelamento = () => controlador.abort()
  signal?.addEventListener('abort', repassarCancelamento)

  try {
    let resposta: Response
    try {
      resposta = await fetch(`${API_URL}/diagnostico`, { method: 'POST', body: formData, signal: controlador.signal })
    } catch {
      if (signal?.aborted) throw new ErroCancelado()
      const mensagem = estourou ? 'O servidor demorou demais para responder.' : 'Não foi possível conectar ao servidor.'
      return { status: 'erro', tipo: 'erro_desconhecido', mensagem }
    }

    if (resposta.status === 413) return { status: 'erro', tipo: 'arquivo_muito_grande', mensagem: 'HTTP 413' }
    if (resposta.status === 415) return { status: 'erro', tipo: 'formato_invalido', mensagem: 'HTTP 415' }

    const corpo: unknown = await resposta.json().catch(() => null)
    if (signal?.aborted) throw new ErroCancelado()

    if (!resposta.ok) {
      // Erros tipados vindos do backend (contrato) são repassados; o resto vira erro desconhecido.
      if (typeof corpo === 'object' && corpo !== null && 'tipo' in corpo) return { status: 'erro', ...corpo }
      return { status: 'erro', tipo: 'erro_desconhecido', mensagem: `HTTP ${resposta.status}` }
    }

    if (typeof corpo === 'object' && corpo !== null && !('status' in corpo) && 'categoria' in corpo) {
      const legado = corpo as { categoria: unknown; severidade: unknown }
      return {
        status: 'sucesso',
        folhas: [{ id: 'folha-1', categoria: legado.categoria, severidade: legado.severidade }],
      }
    }

    return corpo
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', repassarCancelamento)
  }
}
