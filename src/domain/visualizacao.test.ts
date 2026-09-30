import type { DiagnosticoSucesso, FolhaDiagnostico } from '../api'
import { definirCenarioForcado, resolverCenario } from '../api/mock/resolverCenario'
import { variacaoVisualizacao } from './visualizacao'

const diag = (folhas: FolhaDiagnostico[]): DiagnosticoSucesso => ({ status: 'sucesso', imagemUri: '', folhas })

function doMock(nomeArquivo: string, cenario: Parameters<typeof definirCenarioForcado>[0] = null) {
  definirCenarioForcado(cenario)
  const r = resolverCenario({ nomeArquivo, semente: 42 })
  definirCenarioForcado(null)
  if (r.tipo !== 'sucesso') throw new Error('esperava sucesso')
  return diag(r.folhas)
}

describe('variacaoVisualizacao', () => {
  it('cobre as 4 variações da T7 com os dados do mock', () => {
    expect(variacaoVisualizacao(doMock('planta-cafe-doente.jpg'))).toBe('com_regioes')
    expect(variacaoVisualizacao(doMock('teste-quadrada.jpg'))).toBe('sem_regioes')
    expect(variacaoVisualizacao(doMock('x.jpg', 'varias_folhas_mistas'))).toBe('mista')
    expect(variacaoVisualizacao(doMock('planta-cafe-saudavel.jpg'))).toBe('saudavel')
  })

  it('lista vazia é saudável', () => {
    expect(variacaoVisualizacao(diag([]))).toBe('saudavel')
  })

  it('folhas saudáveis sem região não contam', () => {
    const folhas: FolhaDiagnostico[] = [
      { id: 'a', categoria: 'saudavel', severidade: 'saudavel' },
      { id: 'b', categoria: 'phoma', severidade: 'alta', regiao: { x: 0.5, y: 0.5, raio: 0.1 } },
    ]
    expect(variacaoVisualizacao(diag(folhas))).toBe('com_regioes')
  })
})
