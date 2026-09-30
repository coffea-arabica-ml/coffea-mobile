// O Hermes não tem DOMException, e o AbortSignal do React Native não tem `reason`, `timeout`,
// `any` nem `throwIfAborted` — por isso o cancelamento usa um erro e helpers próprios.

/** Única exceção que `enviarImagemParaDiagnostico` lança: o usuário cancelou. */
export class ErroCancelado extends Error {
  constructor() {
    super('Análise cancelada.')
    this.name = 'AbortError'
  }
}

/** Compara pelo nome: `instanceof` com subclasses de Error não é confiável em todo transpilador. */
export function ehCancelamento(erro: unknown): boolean {
  return erro instanceof Error && erro.name === 'AbortError'
}

/** Espera `ms` milissegundos; rejeita com ErroCancelado se o sinal abortar antes. */
export function esperar(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new ErroCancelado())
      return
    }
    const aoAbortar = () => {
      clearTimeout(timer)
      reject(new ErroCancelado())
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', aoAbortar)
      resolve()
    }, ms)
    signal?.addEventListener('abort', aoAbortar)
  })
}
