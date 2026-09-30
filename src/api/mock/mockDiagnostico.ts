import { esperar } from '../cancelamento'
import type { ImagemLocal } from '../imagem'
import { MENSAGENS_ERRO } from './cenarios'
import { obterAtrasoForcado, resolverCenario } from './resolverCenario'

/**
 * Substitui o coffea-backend enquanto ele não está pronto. Devolve o JSON "cru", como o
 * servidor devolveria — a normalização acontece em diagnostico.ts, igual ao modo http.
 */
export async function mockDiagnosticar(imagem: ImagemLocal, signal?: AbortSignal): Promise<unknown> {
  // Latência perceptível (1,5–2,5 s), estável por foto; o painel de dev força outro valor.
  const atraso = obterAtrasoForcado() ?? 1500 + (imagem.semente % 1000)
  await esperar(atraso, signal)

  const cenario = resolverCenario({ nomeArquivo: imagem.nomeArquivo, semente: imagem.semente })
  if (__DEV__) console.info(`[mock] ${imagem.nomeArquivo} → ${cenario.origem}`)

  if (cenario.tipo === 'erro') return { status: 'erro', tipo: cenario.erro, mensagem: MENSAGENS_ERRO[cenario.erro] }
  return { status: 'sucesso', imagemUri: imagem.uri, folhas: cenario.folhas }
}
