import type { RegiaoFolha } from '../api'

// Portado de coffea-web/src/domain/geometria.ts: lá o resultado era porcentagem de CSS; aqui são
// números para o layout do React Native (pixels da caixa da foto, ou frações do diâmetro da lente).

/** Círculo de uma região sobre a foto exibida em `largura` × `altura` pixels (caixa na proporção da foto). */
export function circuloNaFoto(regiao: RegiaoFolha, largura: number, altura: number) {
  // O raio do contrato é relativo à MENOR dimensão da imagem.
  const diametro = regiao.raio * 2 * Math.min(largura, altura)
  return { centroX: regiao.x * largura, centroY: regiao.y * altura, diametro }
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
