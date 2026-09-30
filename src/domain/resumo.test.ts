import type { DiagnosticoSucesso, FolhaDiagnostico } from '../api'
import { resumirDiagnostico, resumoCurto } from './resumo'

const diag = (folhas: Omit<FolhaDiagnostico, 'id'>[]): DiagnosticoSucesso => ({
  status: 'sucesso',
  imagemUri: '',
  folhas: folhas.map((f, i) => ({ id: String(i), ...f })),
})
const saudavel = { categoria: 'saudavel', severidade: 'saudavel' } as const

describe('resumirDiagnostico', () => {
  it('0 folhas: planta saudável sem citar contagem', () => {
    const r = resumirDiagnostico(diag([]))
    expect(r.titulo).toBe('A planta parece saudável')
    expect(r.paragrafo).not.toMatch(/\d/)
  })

  it('N folhas saudáveis', () => {
    expect(resumirDiagnostico(diag([saudavel, saudavel, saudavel])).paragrafo).toContain('Analisamos 3 folhas')
  })

  it('1 folha sem folhas saudáveis (formato do backend atual)', () => {
    const r = resumirDiagnostico(diag([{ categoria: 'ferrugem', severidade: 'alta' }]))
    expect(r.paragrafo).toBe('Identificamos sinais de estresse em 1 folha: ferrugem (severidade alta).')
    expect(r.titulo).toBe('Sinais de ferrugem')
  })

  it('N folhas mistas agrupa por categoria, mais grave primeiro', () => {
    const r = resumirDiagnostico(
      diag([
        { categoria: 'cercosporiose', severidade: 'baixa' },
        saudavel,
        { categoria: 'ferrugem', severidade: 'baixa' },
        { categoria: 'ferrugem', severidade: 'muito_alta' },
      ]),
    )
    expect(r.paragrafo).toBe(
      'Das 4 folhas analisadas, 3 apresentam sinais de estresse: ferrugem em 2 folhas (severidade até muito alta) e cercosporiose (severidade baixa).',
    )
    expect(r.status).toBe('3 sinais de estresse')
  })
})

describe('resumoCurto', () => {
  it('cobre 0, 1 e N problemas', () => {
    expect(resumoCurto(diag([saudavel]))).toBe('Sem sinais de estresse')
    expect(resumoCurto(diag([{ categoria: 'phoma', severidade: 'baixa' }]))).toBe('Phoma · severidade baixa')
    expect(
      resumoCurto(diag([{ categoria: 'phoma', severidade: 'baixa' }, { categoria: 'bicho_mineiro', severidade: 'alta' }])),
    ).toBe('2 folhas com sinais · bicho-mineiro e phoma')
  })
})
