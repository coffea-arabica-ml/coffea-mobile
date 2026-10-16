import { ErroCancelado } from './cancelamento'
import { httpDiagnosticar } from './http'
import type { ImagemLocal } from './imagem'

/** Resposta real do coffea-backend (0e33bce) para 20190831_163104.jpg, do BRACOT de treino (copiada do coffea-web). */
const RESPOSTA_REAL = {
  status: 'sucesso',
  folhas: [
    { id: 'folha-1', categoria: 'saudavel', severidade: 'saudavel', regiao: { x: 0.9054, y: 0.8257, raio: 0.1606 }, confianca: 0.1004, scoreDeteccao: 0.9336, caixa: [0.797, 0.6222, 0.9988, 0.9991], cortadaNaBorda: true },
    { id: 'folha-2', categoria: 'saudavel', severidade: 'saudavel', regiao: { x: 0.9297, y: 0.1209, raio: 0.1233 }, confianca: 0.3779, scoreDeteccao: 0.9286, caixa: [0.8319, 0.001, 0.9995, 0.2898], cortadaNaBorda: true },
    { id: 'folha-3', categoria: 'saudavel', severidade: 'saudavel', regiao: { x: 0.8903, y: 0.4788, raio: 0.1573 }, confianca: 0.3586, scoreDeteccao: 0.9281, caixa: [0.7697, 0.2913, 0.9996, 0.7076], cortadaNaBorda: true },
    { id: 'folha-4', categoria: 'ferrugem', severidade: 'muito_baixa', regiao: { x: 0.4903, y: 0.6606, raio: 0.1449 }, confianca: 0.9691, scoreDeteccao: 0.9011, caixa: [0.3808, 0.4716, 0.5858, 0.9068], cortadaNaBorda: false },
  ],
  detalhes: {
    plano: 'deteccao', regra: null, deteccoes: 10, abaixo_do_limiar: 0, cortadas_por_area: 0, cortadas_por_cor: 0,
    cortadas_por_fragmento: 2, cortadas_por_limite: 0, abaixo_da_confianca: 4, recorte: 'B', decisao: 'duas_etapas',
    decisao_configurada: 'por_caminho', limiar_saudavel: 0.083, limiar_doenca: 0.65,
    classificador: 'base_resnet50_bracol', detector: 'detector_base',
  },
}

/** Foto já preparada (JPEG reduzido no cache), com o nome original de uma foto de iPhone. */
const IMAGEM: ImagemLocal = {
  uri: 'file:///cache/ImageManipulator/foto.jpg',
  largura: 2048,
  altura: 1536,
  nomeArquivo: 'IMG_0001.HEIC',
  tamanhoBytes: 2_400_000,
  semente: 1,
}

/**
 * O FormData do React Native aceita `{ uri, name, type }` como arquivo; o do Node (ambiente do jest)
 * não. Este só registra o que foi anexado, para o teste conferir o que iria para o backend.
 */
class FormDataFalso {
  partes: [string, unknown][] = []
  append(nome: string, valor: unknown) {
    this.partes.push([nome, valor])
  }
}

const fetchOriginal = global.fetch
const FormDataOriginal = global.FormData

beforeEach(() => {
  global.FormData = FormDataFalso as unknown as typeof FormData
})

afterEach(() => {
  global.fetch = fetchOriginal
  global.FormData = FormDataOriginal
  jest.useRealTimers()
})

/** Responde com `status` e o corpo em texto; corpo vazio ou HTML fazem o `json()` falhar, como no fetch real. */
function responder(status: number, texto: string) {
  const fetchFalso = jest.fn(async (_url: string, _init: RequestInit) => ({
    status,
    ok: status >= 200 && status < 300,
    json: async () => JSON.parse(texto) as unknown,
  }))
  global.fetch = fetchFalso as unknown as typeof fetch
  return fetchFalso
}

/** Um fetch que só termina quando o sinal aborta (servidor que não responde). */
function fetchPendente() {
  global.fetch = jest.fn(
    (_url: string, init: RequestInit) =>
      new Promise((_, rejeitar) => init.signal?.addEventListener('abort', () => rejeitar(new Error('Aborted')))),
  ) as unknown as typeof fetch
}

describe('httpDiagnosticar', () => {
  it('envia a foto no campo "imagem" como { uri, name, type } e repassa o sucesso do contrato como está', async () => {
    const fetchFalso = responder(200, JSON.stringify(RESPOSTA_REAL))
    expect(await httpDiagnosticar(IMAGEM)).toEqual(RESPOSTA_REAL)

    const [url, init] = fetchFalso.mock.calls[0]
    expect(url).toMatch(/\/diagnostico$/)
    expect(init.method).toBe('POST')
    // Sem Content-Type manual: o fetch gera o boundary do multipart.
    expect(init.headers).toBeUndefined()
    expect((init.body as unknown as FormDataFalso).partes).toEqual([
      ['imagem', { uri: IMAGEM.uri, name: 'IMG_0001.jpg', type: 'image/jpeg' }],
    ])
  })

  it('repassa o erro tipado do modelo que vem com HTTP 200', async () => {
    const erro = { status: 'erro', tipo: 'baixa_confianca', mensagem: 'Encontramos folhas, mas o diagnóstico não ficou confiável.' }
    responder(200, JSON.stringify(erro))
    expect(await httpDiagnosticar(IMAGEM)).toEqual(erro)
  })

  it.each([
    [413, 'arquivo_muito_grande', 'A imagem passa de 10 MB. Envie uma foto menor.'],
    [415, 'formato_invalido', 'Formato não aceito. Envie uma foto em JPG ou PNG.'],
  ])('decide o tipo do %i pelo código e usa a mensagem do corpo', async (status, tipo, mensagem) => {
    responder(status, JSON.stringify({ status: 'erro', tipo, mensagem }))
    expect(await httpDiagnosticar(IMAGEM)).toEqual({ status: 'erro', tipo, mensagem })
  })

  it.each([
    [413, 'arquivo_muito_grande'],
    [415, 'formato_invalido'],
  ])('sem corpo, o %i chega com mensagem vazia (a tela usa o texto padrão)', async (status, tipo) => {
    responder(status, '')
    expect(await httpDiagnosticar(IMAGEM)).toEqual({ status: 'erro', tipo, mensagem: '' })
  })

  it.each([
    [422, 'formato_invalido', 'O arquivo enviado está vazio. Envie uma foto em JPG ou PNG.'],
    [500, 'erro_desconhecido', 'Erro inesperado no servidor. Tente de novo em instantes.'],
    [503, 'erro_desconhecido', 'O diagnóstico está indisponível no momento. Tente de novo mais tarde.'],
  ])('repassa o tipo do corpo no HTTP %i', async (status, tipo, mensagem) => {
    responder(status, JSON.stringify({ status: 'erro', tipo, mensagem }))
    expect(await httpDiagnosticar(IMAGEM)).toEqual({ status: 'erro', tipo, mensagem })
  })

  it('502 com HTML de proxy vira erro desconhecido sem mensagem (nada de "HTTP 502" na tela)', async () => {
    responder(502, '<html><body>Bad Gateway</body></html>')
    expect(await httpDiagnosticar(IMAGEM)).toEqual({ status: 'erro', tipo: 'erro_desconhecido', mensagem: '' })
  })

  it('falha de rede vira erro desconhecido, sem lançar e sem o texto da exceção', async () => {
    global.fetch = jest.fn(async () => Promise.reject(new TypeError('Network request failed'))) as unknown as typeof fetch
    expect(await httpDiagnosticar(IMAGEM)).toEqual({ status: 'erro', tipo: 'erro_desconhecido', mensagem: '' })
  })

  it('tempo limite de 30 s vira erro desconhecido com a mensagem de demora', async () => {
    jest.useFakeTimers()
    fetchPendente()
    const resposta = httpDiagnosticar(IMAGEM)
    jest.advanceTimersByTime(30_000)
    await expect(resposta).resolves.toEqual({
      status: 'erro',
      tipo: 'erro_desconhecido',
      mensagem: 'O servidor demorou demais para responder.',
    })
  })

  it('cancelamento rejeita com ErroCancelado', async () => {
    fetchPendente()
    const controle = new AbortController()
    const resposta = httpDiagnosticar(IMAGEM, controle.signal)
    controle.abort()
    await expect(resposta).rejects.toBeInstanceOf(ErroCancelado)
  })
})
