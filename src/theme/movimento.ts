import { Easing } from 'react-native-reanimated'

/**
 * Durações e curvas copiadas das keyframes do coffea-web (`--animate-*` em index.css).
 * As animações do Reanimated respeitam "Remover animações" do sistema por padrão (ReduceMotion.System).
 */
export const duracoes = {
  surgir: 500,
  varrer: 2400,
  orbitar: 3200,
  tremer: 350,
  barra: 1600,
  respirar: 28_000,
  /** Zoom do círculo até a lente do Detalhe (equivalente à View Transition do web). */
  lente: 450,
} as const

export const curvas = {
  surgir: Easing.bezier(0.2, 0.8, 0.2, 1),
  varrer: Easing.bezier(0.45, 0, 0.55, 1),
  suave: Easing.inOut(Easing.ease),
} as const

/** Intervalo entre elementos que entram em cascata. */
export const PASSO_CASCATA = 60
