import { normalizarResposta } from './normalizar'

const LOCAL = 'file:///cache/foto.jpg'

describe('normalizarResposta', () => {
  it('descarta região fora de 0–1 sem descartar a folha', () => {
    const r = normalizarResposta(
      { status: 'sucesso', folhas: [{ id: 'a', categoria: 'ferrugem', severidade: 'alta', regiao: { x: 1.4, y: 0.2, raio: 0.1 } }] },
      LOCAL,
    )
    expect(r).toEqual({ status: 'sucesso', imagemUri: LOCAL, folhas: [{ id: 'a', categoria: 'ferrugem', severidade: 'alta' }] })
  })

  it('usa sempre a foto local, mesmo se o servidor devolver outra URL', () => {
    const r = normalizarResposta({ status: 'sucesso', imagemUrl: 'https://servidor/x.jpg', folhas: [] }, LOCAL)
    expect(r).toEqual({ status: 'sucesso', imagemUri: LOCAL, folhas: [] })
  })

  it('aceita folhas ausentes, ignora categorias desconhecidas e completa ids', () => {
    expect(normalizarResposta({ status: 'sucesso' }, LOCAL)).toEqual({ status: 'sucesso', imagemUri: LOCAL, folhas: [] })
    const r = normalizarResposta(
      { status: 'sucesso', folhas: [{ categoria: 'x' }, { categoria: 'phoma', severidade: 'baixa' }, { categoria: 'phoma', severidade: 'alta' }] },
      LOCAL,
    )
    expect(r.status === 'sucesso' && r.folhas.map((f) => f.id)).toEqual(['folha-2', 'folha-3'])
  })

  it('corrige ids duplicados', () => {
    const r = normalizarResposta(
      { status: 'sucesso', folhas: [{ id: 'a', categoria: 'phoma' }, { id: 'a', categoria: 'ferrugem' }] },
      LOCAL,
    )
    expect(r.status === 'sucesso' && r.folhas.map((f) => f.id)).toEqual(['a', 'a-2'])
  })

  it('mantém categoria e severidade coerentes', () => {
    const r = normalizarResposta(
      { status: 'sucesso', folhas: [{ id: 'a', categoria: 'saudavel', severidade: 'alta' }, { id: 'b', categoria: 'ferrugem', severidade: 'saudavel' }] },
      LOCAL,
    )
    expect(r.status === 'sucesso' && r.folhas.map((f) => f.severidade)).toEqual(['saudavel', 'muito_baixa'])
  })

  it('transforma lixo e tipos de erro desconhecidos em erro_desconhecido', () => {
    expect(normalizarResposta(null, LOCAL)).toMatchObject({ status: 'erro', tipo: 'erro_desconhecido' })
    expect(normalizarResposta({ status: 'erro', tipo: 'outro' }, LOCAL)).toMatchObject({ tipo: 'erro_desconhecido' })
    expect(normalizarResposta({ categoria: 'ferrugem' }, LOCAL)).toMatchObject({ tipo: 'erro_desconhecido' })
  })

  it('repassa os 6 erros do contrato', () => {
    expect(normalizarResposta({ status: 'erro', tipo: 'baixa_confianca', mensagem: ' x ' }, LOCAL)).toEqual({
      status: 'erro',
      tipo: 'baixa_confianca',
      mensagem: 'x',
    })
  })
})
