import { ErroCancelado } from './cancelamento'
import { enviarImagemParaDiagnostico } from './diagnostico'
import { httpDiagnosticar } from './http'
import type { ImagemLocal } from './imagem'
import { MENSAGENS_ERRO } from './mock/cenarios'
import { mockDiagnosticar } from './mock/mockDiagnostico'

jest.mock('./http', () => ({ httpDiagnosticar: jest.fn() }))
jest.mock('./mock/mockDiagnostico', () => ({ mockDiagnosticar: jest.fn() }))

const IMAGEM: ImagemLocal = {
  uri: 'file:///cache/foto.jpg',
  largura: 1600,
  altura: 1200,
  nomeArquivo: 'foto.jpg',
  tamanhoBytes: 500_000,
  semente: 1,
}

afterEach(() => {
  jest.resetAllMocks()
  jest.restoreAllMocks()
})

describe('enviarImagemParaDiagnostico', () => {
  it('exceção inesperada: vai para o console, e a tela recebe uma mensagem em português', async () => {
    // Vale para os dois modos (mock e http).
    const excecao = new TypeError('undefined is not a function')
    jest.mocked(httpDiagnosticar).mockRejectedValue(excecao)
    jest.mocked(mockDiagnosticar).mockRejectedValue(excecao)
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

    expect(await enviarImagemParaDiagnostico(IMAGEM)).toEqual({
      status: 'erro',
      tipo: 'erro_desconhecido',
      mensagem: 'Ocorreu uma falha inesperada ao analisar a foto.',
    })
    expect(consoleError).toHaveBeenCalledWith('[Cafélens] falha inesperada no diagnóstico', excecao)
  })

  it('cancelamento continua rejeitando, sem virar erro na tela', async () => {
    const controle = new AbortController()
    controle.abort()
    await expect(enviarImagemParaDiagnostico(IMAGEM, { signal: controle.signal })).rejects.toBeInstanceOf(ErroCancelado)

    jest.mocked(httpDiagnosticar).mockRejectedValue(new ErroCancelado())
    jest.mocked(mockDiagnosticar).mockRejectedValue(new ErroCancelado())
    await expect(enviarImagemParaDiagnostico(IMAGEM)).rejects.toBeInstanceOf(ErroCancelado)
  })

  it('o erro desconhecido do mock não traz código HTTP', () => {
    expect(MENSAGENS_ERRO.erro_desconhecido).not.toMatch(/HTTP|\d{3}/)
  })
})
