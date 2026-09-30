import { definirCenarioForcado, resolverCenario } from './resolverCenario'

const foto = (nomeArquivo: string, semente = 12345) => ({ nomeArquivo, semente })

describe('resolverCenario', () => {
  beforeEach(() => definirCenarioForcado(null))

  it('usa a resposta calibrada para fotos conhecidas', () => {
    const r = resolverCenario(foto('planta-cafe-doente.jpg'))
    expect(r.tipo).toBe('sucesso')
    if (r.tipo === 'sucesso') {
      expect(r.folhas.filter((f) => f.categoria !== 'saudavel').map((f) => f.categoria)).toEqual(['ferrugem', 'cercosporiose'])
    }
  })

  it('reconhece o nome sem depender de maiúsculas', () => {
    expect(resolverCenario(foto('PLANTA-CAFE-SAUDAVEL.JPG')).origem).toBe('arquivo: PLANTA-CAFE-SAUDAVEL.JPG')
  })

  it('mapeia as fixtures de erro do "modelo"', () => {
    expect(resolverCenario(foto('teste-sem-planta.jpg'))).toMatchObject({ erro: 'planta_nao_identificada' })
    expect(resolverCenario(foto('teste-especie-incorreta.jpg'))).toMatchObject({ erro: 'especie_incorreta' })
    expect(resolverCenario(foto('teste-baixa-qualidade.jpg'))).toMatchObject({ erro: 'baixa_confianca' })
  })

  it('simula o backend atual: 1 folha sem região', () => {
    const r = resolverCenario(foto('teste-quadrada.jpg'))
    expect(r.tipo === 'sucesso' && r.folhas).toEqual([{ id: 'folha-1', categoria: 'phoma', severidade: 'baixa' }])
  })

  it('é determinístico para fotos desconhecidas (mesma semente, mesmo resultado)', () => {
    expect(resolverCenario(foto('IMG_0042.jpg', 987654))).toEqual(resolverCenario(foto('IMG_0042.jpg', 987654)))
  })

  it('cenário forçado tem prioridade sobre o nome do arquivo', () => {
    definirCenarioForcado('erro:erro_desconhecido')
    expect(resolverCenario(foto('planta-cafe-doente.jpg'))).toMatchObject({ tipo: 'erro', erro: 'erro_desconhecido' })
  })

  it('cenário forçado sem folhas', () => {
    definirCenarioForcado('saudavel_sem_folhas')
    expect(resolverCenario(foto('qualquer.jpg'))).toMatchObject({ tipo: 'sucesso', folhas: [] })
  })

  it('ignora cenário forçado inexistente', () => {
    definirCenarioForcado('nao_existe' as never)
    expect(resolverCenario(foto('teste-sem-planta.jpg'))).toMatchObject({ erro: 'planta_nao_identificada' })
  })

  it('cenário misto tem folhas com e sem região', () => {
    definirCenarioForcado('varias_folhas_mistas')
    const r = resolverCenario(foto('x.jpg'))
    const problemas = r.tipo === 'sucesso' ? r.folhas.filter((f) => f.categoria !== 'saudavel') : []
    expect(problemas.some((f) => f.regiao)).toBe(true)
    expect(problemas.some((f) => !f.regiao)).toBe(true)
  })
})
