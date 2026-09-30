import type { NivelSeveridade } from '../api'

export const ESCALA_SEVERIDADE: readonly NivelSeveridade[] = ['saudavel', 'muito_baixa', 'baixa', 'alta', 'muito_alta']

export const ROTULO_SEVERIDADE: Record<NivelSeveridade, string> = {
  saudavel: 'Saudável',
  muito_baixa: 'Muito baixa',
  baixa: 'Baixa',
  alta: 'Alta',
  muito_alta: 'Muito alta',
}

/** 0 (saudável) a 4 (muito alta). */
export function ordemSeveridade(nivel: NivelSeveridade): number {
  return ESCALA_SEVERIDADE.indexOf(nivel)
}

export function compararSeveridadeDesc(a: NivelSeveridade, b: NivelSeveridade): number {
  return ordemSeveridade(b) - ordemSeveridade(a)
}
