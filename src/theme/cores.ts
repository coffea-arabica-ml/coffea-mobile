/**
 * Paleta do Cafélens — valores copiados do bloco `@theme` de coffea-web/src/index.css, para os dois
 * apps terem exatamente o mesmo tom. Mude uma cor aqui (e lá), nunca direto nos componentes.
 */
export const cores = {
  // Papel e tinta
  papel: '#f5f3ec',
  papel2: '#ece8dc',
  superficie: '#fffdf8',
  linha: '#dcd6c6',
  tinta: '#17231b',
  tintaSuave: '#4d5b51',
  tintaFraca: '#5f6a61',

  // Verde do logo Cafélens
  folha50: '#eef4ee',
  folha100: '#d7e7d8',
  folha300: '#8fbb95',
  folha500: '#3f8049',
  folha600: '#2f6b3b',
  folha700: '#245330',
  folha900: '#11281a',

  // Cereja: sinais encontrados e erros
  cereja50: '#fbefec',
  cereja100: '#f5d9d2',
  cereja500: '#c24a31',
  cereja600: '#a83c26',
  cereja700: '#86301f',

  // Categorias (base Okabe-Ito, segura para daltonismo) — sempre acompanhadas de número/texto
  catFerrugem: '#d55e00',
  catBichoMineiro: '#c99400',
  catCercosporiose: '#b8538f',
  catPhoma: '#0072b2',

  branco: '#ffffff',
} as const

export type Cor = (typeof cores)[keyof typeof cores]

/** `#rrggbb` + opacidade → `rgba(...)`, para véus e bordas translúcidas. */
export function comAlfa(hex: string, alfa: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alfa})`
}
