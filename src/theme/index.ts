export { cores, comAlfa, type Cor } from './cores'
export { fontes, arquivosDeFonte, tipos, type TipoTexto } from './tipografia'
export { duracoes, curvas, PASSO_CASCATA } from './movimento'

/** Mesmas sombras do coffea-web (`--shadow-*`), via `boxShadow` do RN (New Architecture). */
export const sombras = {
  cartao: '0px 1px 2px rgba(23, 35, 27, 0.04), 0px 8px 24px -12px rgba(23, 35, 27, 0.18)',
  flutuante: '0px 12px 40px -12px rgba(17, 40, 26, 0.35)',
  botao: '0px 6px 16px -8px rgba(17, 40, 26, 0.6)',
} as const

export const raios = {
  /** `--radius-cartao` (1.5rem). */
  cartao: 24,
  moldura: 20,
  campo: 16,
  pilula: 999,
} as const

/** Margem lateral padrão das telas. */
export const MARGEM = 20
