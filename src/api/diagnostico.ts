export type ResultadoDiagnostico = {
  categoria: string
  severidade: string
}

// TODO (Frente 6): confirmar a URL real do coffea-backend quando estiver no ar
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000'

export async function diagnosticarFolha(uri: string): Promise<ResultadoDiagnostico> {
  const formData = new FormData()
  formData.append('imagem', {
    uri,
    name: 'folha.jpg',
    type: 'image/jpeg',
  } as any)

  const resposta = await fetch(`${API_URL}/diagnostico`, {
    method: 'POST',
    body: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  if (!resposta.ok) {
    throw new Error('Não foi possível analisar a imagem. Tente novamente.')
  }

  return resposta.json()
}