import { ErroCancelado } from './cancelamento'
import { API_URL } from './config'
import type { ImagemLocal } from './imagem'

const TEMPO_LIMITE_MS = 30_000

/**
 * Adapter do `POST /diagnostico` do coffea-backend (contrato implementado no commit 0e33bce).
 * Devolve o JSON do contrato, ainda não normalizado: o sucesso é repassado como está (os extras
 * do modelo, como `confianca` e `detalhes`, ficam para o normalizador descartar).
 *
 * Códigos HTTP: 200 traz sucesso ou erro tipado do modelo; 413 e 415 viram o tipo pelo código;
 * nos demais não-OK (422, 500, 503), o `tipo` do corpo é repassado. A mensagem do corpo segue
 * junto — sem ela, fica vazia e a tela usa o próprio texto.
 *
 * A mensagem pode ir para a tela: aqui só se escreve texto para o usuário, em português, sem
 * código HTTP nem texto de exceção.
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
      // Falha de conexão: sem mensagem, a tela explica com o texto padrão (conexão ou servidor).
      const mensagem = estourou ? 'O servidor demorou demais para responder.' : ''
      return { status: 'erro', tipo: 'erro_desconhecido', mensagem }
    }

    const corpo: unknown = await resposta.json().catch(() => null)
    if (signal?.aborted) throw new ErroCancelado()
    const ehObjeto = typeof corpo === 'object' && corpo !== null
    const mensagem = ehObjeto && 'mensagem' in corpo && typeof corpo.mensagem === 'string' ? corpo.mensagem : ''

    if (resposta.status === 413) return { status: 'erro', tipo: 'arquivo_muito_grande', mensagem }
    if (resposta.status === 415) return { status: 'erro', tipo: 'formato_invalido', mensagem }

    if (!resposta.ok) {
      // Erros tipados vindos do backend (contrato) são repassados; o resto (ex.: HTML de um proxy) vira
      // erro desconhecido sem mensagem.
      if (ehObjeto && 'tipo' in corpo) return { ...corpo, status: 'erro' }
      return { status: 'erro', tipo: 'erro_desconhecido', mensagem: '' }
    }

    return corpo
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', repassarCancelamento)
  }
}
