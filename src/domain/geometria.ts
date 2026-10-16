import type { RegiaoFolha } from '../api'

// Portado de coffea-web/src/domain/geometria.ts: lá o resultado era porcentagem de CSS; aqui são
// números para o layout do React Native (pixels da caixa da foto, ou frações do diâmetro da lente).

/** Círculo de uma região sobre a foto exibida em `largura` × `altura` pixels (caixa na proporção da foto). */
export function circuloNaFoto(regiao: RegiaoFolha, largura: number, altura: number) {
  // O raio do contrato é relativo à MENOR dimensão da imagem.
  const diametro = regiao.raio * 2 * Math.min(largura, altura)
  return { centroX: regiao.x * largura, centroY: regiao.y * altura, diametro }
}

/** Medidas do círculo da Visualização avançada (CirculoFolha.tsx desenha com estas mesmas). */
export const CIRCULO = {
  /** Menor círculo desenhado; o toque ainda ganha folga (hitSlop) até ~48 pt. */
  diametroMinimo: 36,
  borda: 3,
  /** Escala do círculo em destaque (a transformação é em torno do centro). */
  escalaDestaque: 1.1,
  /** NumeroFolha do selo e a borda branca em volta: o selo mede 24 + 2 · 2 = 28 pt. */
  selo: 24,
  bordaSelo: 2,
} as const

const RAIO_SELO = CIRCULO.selo / 2 + CIRCULO.bordaSelo // 14
/**
 * Distância mínima do centro do selo ampliado (raio 14 · 1,1 = 15,4) até a borda da foto. No canto
 * arredondado de 20 pt (raios.moldura), o selo cabe a partir de 20 − (20 − 15,4)/√2 ≈ 16,7; 18 dá folga.
 */
const MARGEM_SELO = 18

/**
 * Posição do selo numerado ({ left, top }) no referencial do Pressable do círculo. A conta, em cada eixo
 * da foto (largura × altura, em pontos):
 * - ponto a 45° = centro ± (diâmetro / 2) · √½ — o selo fica sobre o contorno, no alto à direita;
 * - limite = de (M + 0,1 · centro) / 1,1 até (extensão − M + 0,1 · centro) / 1,1, com M = MARGEM_SELO —
 *   assim, mesmo ampliado 1,1× em torno do centro do círculo (destaque), o selo fica a M da borda;
 * - o ponto limitado volta para o referencial do Pressable: − (centro − diâmetro / 2) − borda − meio selo.
 *   A borda entra porque o Yoga posiciona o filho absoluto a partir da face interna da borda do pai.
 */
export function seloDoCirculo(regiao: RegiaoFolha, largura: number, altura: number) {
  const { centroX, centroY, diametro: bruto } = circuloNaFoto(regiao, largura, altura)
  const diametro = Math.max(bruto, CIRCULO.diametroMinimo)
  const folga = CIRCULO.escalaDestaque - 1

  function eixo(centro: number, extensao: number, sentido: 1 | -1) {
    const alvo = centro + sentido * (diametro / 2) * Math.SQRT1_2
    const minimo = (MARGEM_SELO + folga * centro) / CIRCULO.escalaDestaque
    const maximo = (extensao - MARGEM_SELO + folga * centro) / CIRCULO.escalaDestaque
    const limitado = Math.min(Math.max(alvo, minimo), maximo)
    return limitado - (centro - diametro / 2) - CIRCULO.borda - RAIO_SELO
  }

  return { left: eixo(centroX, largura, 1), top: eixo(centroY, altura, -1) }
}

/** Posição e tamanho da foto dentro da lente, em frações do diâmetro da lente (1 = diâmetro). */
export interface Enquadramento {
  largura: number
  altura: number
  esquerda: number
  topo: number
}

const FRACAO_LENTE = 0.8
const ZOOM_MAXIMO = 8

/**
 * Enquadramento da lente do Detalhe: a região ocupa ~80% do círculo, com zoom máximo de 8×.
 * `largura`/`altura` são as dimensões naturais da foto (qualquer unidade, só a proporção importa).
 */
export function enquadramentoLente(regiao: RegiaoFolha, largura: number, altura: number): Enquadramento {
  const menor = Math.min(largura, altura)
  const raio = regiao.raio * menor
  // Tamanho da imagem em "lentes": a região (2·raio) deve medir FRACAO_LENTE da lente.
  const larguraEmLentes = Math.min((FRACAO_LENTE * largura) / (2 * raio), (ZOOM_MAXIMO * largura) / menor)
  const alturaEmLentes = larguraEmLentes * (altura / largura)
  return {
    largura: larguraEmLentes,
    altura: alturaEmLentes,
    esquerda: 0.5 - regiao.x * larguraEmLentes,
    topo: 0.5 - regiao.y * alturaEmLentes,
  }
}

/** A foto inteira cobrindo a lente (sem região, e ponto de partida do zoom até a folha). */
export function enquadramentoInteiro(largura: number, altura: number): Enquadramento {
  const menor = Math.min(largura, altura)
  const l = largura / menor
  const a = altura / menor
  return { largura: l, altura: a, esquerda: (1 - l) / 2, topo: (1 - a) / 2 }
}
