export type ModoApi = 'mock' | 'http'

/** "mock" (padrão) usa src/api/mock; "http" chama o coffea-backend em EXPO_PUBLIC_API_URL. */
export const modoApi: ModoApi = process.env.EXPO_PUBLIC_API_MODE === 'http' ? 'http' : 'mock'

// TODO(frente-6): confirmar a URL real do coffea-backend quando estiver no ar
export const API_URL: string = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000'

export const LIMITES = {
  tamanhoMaximoBytes: 10 * 1024 * 1024,
  tamanhoMaximoRotulo: '10 MB',
  formatosRotulo: 'JPG ou PNG',
  /** Lado maior da foto enviada: o suficiente para o modelo, leve para enviar e guardar. */
  ladoMaximoEnvioPx: 2048,
} as const
