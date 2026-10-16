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

  it('resposta real do backend: descarta os extras e usa a foto local', () => {
    // Folha da resposta do coffea-backend para 20190831_163104.jpg (BRACOT de treino).
    const r = normalizarResposta(
      {
        status: 'sucesso',
        folhas: [
          { id: 'folha-4', categoria: 'ferrugem', severidade: 'muito_baixa', regiao: { x: 0.4903, y: 0.6606, raio: 0.1449 }, confianca: 0.9691, scoreDeteccao: 0.9011, caixa: [0.3808, 0.4716, 0.5858, 0.9068], cortadaNaBorda: false },
        ],
        detalhes: { plano: 'deteccao', decisao: 'duas_etapas' },
      },
      LOCAL,
    )
    expect(r).toEqual({
      status: 'sucesso',
      imagemUri: LOCAL,
      folhas: [{ id: 'folha-4', categoria: 'ferrugem', severidade: 'muito_baixa', regiao: { x: 0.4903, y: 0.6606, raio: 0.1449 } }],
    })
  })

  it('transforma lixo e tipos de erro desconhecidos em erro_desconhecido, sem mensagem técnica', () => {
    const semMensagem = { status: 'erro', tipo: 'erro_desconhecido', mensagem: '' }
    expect(normalizarResposta(null, LOCAL)).toEqual(semMensagem)
    expect(normalizarResposta({ status: 'processando' }, LOCAL)).toEqual(semMensagem)
    expect(normalizarResposta({ status: 'erro', tipo: 'outro' }, LOCAL)).toEqual(semMensagem)
    expect(normalizarResposta({ categoria: 'ferrugem' }, LOCAL)).toEqual(semMensagem)
  })

  it('repassa os 6 erros do contrato', () => {
    expect(normalizarResposta({ status: 'erro', tipo: 'baixa_confianca', mensagem: ' x ' }, LOCAL)).toEqual({
      status: 'erro',
      tipo: 'baixa_confianca',
      mensagem: 'x',
    })
  })
})
