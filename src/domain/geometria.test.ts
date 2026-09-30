import { circuloNaFoto, enquadramentoInteiro, enquadramentoLente } from './geometria'

describe('circuloNaFoto', () => {
  it('usa a menor dimensão para o raio', () => {
    // Foto retrato 300×450: raio 0.1 da menor dimensão (300) → diâmetro 60.
    expect(circuloNaFoto({ x: 0.5, y: 0.2, raio: 0.1 }, 300, 450)).toEqual({ centroX: 150, centroY: 90, diametro: 60 })
  })
})

describe('enquadramentoLente', () => {
  it('a região ocupa 80% da lente e fica centralizada', () => {
    const regiao = { x: 0.742, y: 0.258, raio: 0.115 }
    const e = enquadramentoLente(regiao, 1024, 1536)
    const diametroRegiaoEmLentes = regiao.raio * 2 * (1024 / 1024) * e.largura
    expect(diametroRegiaoEmLentes).toBeCloseTo(0.8)
    // O centro da região cai no centro da lente.
    expect(e.esquerda + regiao.x * e.largura).toBeCloseTo(0.5)
    expect(e.topo + regiao.y * e.altura).toBeCloseTo(0.5)
  })

  it('limita o zoom a 8× em regiões minúsculas', () => {
    const e = enquadramentoLente({ x: 0.5, y: 0.5, raio: 0.01 }, 1000, 1000)
    expect(e.largura).toBeCloseTo(8)
  })
})

describe('enquadramentoInteiro', () => {
  it('cobre a lente com a foto inteira, centralizada', () => {
    expect(enquadramentoInteiro(1024, 1536)).toEqual({ largura: 1, altura: 1.5, esquerda: 0, topo: -0.25 })
  })
})
