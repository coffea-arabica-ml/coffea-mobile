import type { RegiaoFolha } from '../api'
import { CIRCULO, circuloNaFoto, enquadramentoInteiro, enquadramentoLente, seloDoCirculo } from './geometria'

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

const RAIO_SELO = CIRCULO.selo / 2 + CIRCULO.bordaSelo // 14
const CANTO = 20 // raios.moldura: canto arredondado da foto na MolduraImagem

/** O círculo de raio `r` (pt) centrado em (x, y) cabe na foto de cantos arredondados? */
function cabe(x: number, y: number, r: number, largura: number, altura: number) {
  const cx = Math.min(Math.max(x, CANTO), largura - CANTO)
  const cy = Math.min(Math.max(y, CANTO), altura - CANTO)
  return x >= r && y >= r && x <= largura - r && y <= altura - r && Math.hypot(x - cx, y - cy) <= CANTO - r + 1e-9
}

/** Centro do selo no referencial da foto: canto do círculo + borda (face interna do Pressable) + left/top + meio selo. */
function centroDoSelo(regiao: RegiaoFolha, largura: number, proporcao: number) {
  const altura = largura / proporcao
  const { centroX, centroY, diametro: bruto } = circuloNaFoto(regiao, largura, altura)
  const diametro = Math.max(bruto, CIRCULO.diametroMinimo)
  const { left, top } = seloDoCirculo(regiao, largura, altura)
  const selo = {
    x: centroX - diametro / 2 + CIRCULO.borda + left + RAIO_SELO,
    y: centroY - diametro / 2 + CIRCULO.borda + top + RAIO_SELO,
  }
  return { altura, diametro, centro: { x: centroX, y: centroY }, selo }
}

const REGIOES: [string, RegiaoFolha][] = [
  ['21.jpg do BRACOL', { x: 0.505, y: 0.4957, raio: 0.4718 }],
  ['20190831_163104', { x: 0.4903, y: 0.6606, raio: 0.1449 }],
  ...[0, 1].flatMap((x) =>
    [0, 1].flatMap((y) => [0.5, 0.01].map((raio): [string, RegiaoFolha] => [`quina ${x},${y} raio ${raio}`, { x, y, raio }])),
  ),
  ['borda de cima', { x: 0.5, y: 0, raio: 0.1 }],
  ['borda direita', { x: 1, y: 0.5, raio: 0.1 }],
  ['borda de baixo', { x: 0.5, y: 1, raio: 0.2 }],
  ['borda esquerda', { x: 0, y: 0.5, raio: 0.3 }],
]
const LARGURAS = [343, 600] // foto num celular de 375 pt e num tablet
const PROPORCOES = [4 / 3, 3 / 4, 2, 1]

describe('seloDoCirculo', () => {
  it.each(REGIOES)('fica inteiro na foto, em repouso e ampliado pelo destaque: %s', (_, regiao) => {
    for (const largura of LARGURAS) {
      for (const proporcao of PROPORCOES) {
        const { altura, centro, selo } = centroDoSelo(regiao, largura, proporcao)
        const contexto = `${largura} pt, proporção ${proporcao}`
        expect([contexto, cabe(selo.x, selo.y, RAIO_SELO, largura, altura)]).toEqual([contexto, true])
        // O destaque amplia o Pressable (e o selo dentro dele) em torno do centro do círculo.
        const e = CIRCULO.escalaDestaque
        const ampliado = { x: centro.x + e * (selo.x - centro.x), y: centro.y + e * (selo.y - centro.y) }
        expect([`${contexto}, destaque`, cabe(ampliado.x, ampliado.y, RAIO_SELO * e, largura, altura)]).toEqual([
          `${contexto}, destaque`,
          true,
        ])
      }
    }
  })

  it.each([
    ['20190831_163104', { x: 0.4903, y: 0.6606, raio: 0.1449 }, 600, 4 / 3],
    ['21.jpg do BRACOL (uma folha só)', { x: 0.505, y: 0.4957, raio: 0.4718 }, 343, 3 / 4],
  ])('com espaço, fica sobre o contorno a 45° (no alto, à direita): %s', (_, regiao, largura, proporcao) => {
    const { diametro, centro, selo } = centroDoSelo(regiao, largura, proporcao)
    expect(selo.x - centro.x).toBeCloseTo((diametro / 2) * Math.SQRT1_2, 6)
    expect(centro.y - selo.y).toBeCloseTo((diametro / 2) * Math.SQRT1_2, 6)
  })
})
