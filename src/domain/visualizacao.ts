import type { DiagnosticoSucesso } from '../api'
import { problemasDe } from './analise'

/**
 * As 4 variações da Visualização avançada (T7). Enquanto o RF09 estiver pendente, `regiao` pode
 * faltar em todas, em algumas ou em nenhuma folha — a tela nunca pode quebrar por isso.
 */
export type VariacaoVisualizacao =
  /** (a) todos os problemas têm região: círculos + lista */
  | 'com_regioes'
  /** (b) nenhum tem região: só a lista, com nota explicando */
  | 'sem_regioes'
  /** (c) alguns têm: círculos só onde houver região */
  | 'mista'
  /** (d) nada identificado: foto e orientação de cuidado geral */
  | 'saudavel'

export function variacaoVisualizacao(diagnostico: DiagnosticoSucesso): VariacaoVisualizacao {
  const problemas = problemasDe(diagnostico)
  if (problemas.length === 0) return 'saudavel'
  const comRegiao = problemas.filter((f) => f.regiao).length
  if (comRegiao === problemas.length) return 'com_regioes'
  if (comRegiao === 0) return 'sem_regioes'
  return 'mista'
}
