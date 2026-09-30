import { ehCancelamento, ErroCancelado } from './cancelamento'
import { modoApi } from './config'
import { httpDiagnosticar } from './http'
import type { ImagemLocal } from './imagem'
import { mockDiagnosticar } from './mock/mockDiagnostico'
import { normalizarResposta } from './normalizar'
import type { DiagnosticoResponse } from './types'

export interface OpcoesEnvio {
  /** Cancela o envio; a promessa rejeita com ErroCancelado e nenhuma resposta é produzida. */
  signal?: AbortSignal
}

/**
 * Ponto único de entrada do diagnóstico. A assinatura (Promise<DiagnosticoResponse>) é o
 * contrato com as telas: trocar mock ↔ backend real não pode mudar nada fora de src/api/.
 * Recebe a foto já verificada e preparada (ver imagem.ts). Erros esperados (rede, servidor,
 * modelo) viram `DiagnosticoErro`; só o cancelamento rejeita.
 */
export async function enviarImagemParaDiagnostico(
  imagem: ImagemLocal,
  opcoes: OpcoesEnvio = {},
): Promise<DiagnosticoResponse> {
  const { signal } = opcoes
  if (signal?.aborted) throw new ErroCancelado()

  try {
    const bruta = modoApi === 'http' ? await httpDiagnosticar(imagem, signal) : await mockDiagnosticar(imagem, signal)
    return normalizarResposta(bruta, imagem.uri)
  } catch (e) {
    if (ehCancelamento(e) || signal?.aborted) throw new ErroCancelado()
    return {
      status: 'erro',
      tipo: 'erro_desconhecido',
      mensagem: e instanceof Error ? e.message : 'Falha inesperada ao analisar a imagem.',
    }
  }
}
