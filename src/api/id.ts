// O Hermes não tem crypto.randomUUID. Para ids locais (histórico, análise em foco) basta isto.
let contador = 0

export function gerarId(): string {
  contador = (contador + 1) % 1296
  return `${Date.now().toString(36)}-${contador.toString(36)}${Math.random().toString(36).slice(2, 8)}`
}
