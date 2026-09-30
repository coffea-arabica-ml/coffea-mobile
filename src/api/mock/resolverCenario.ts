import type { FolhaDiagnostico, TipoErroUpload } from '../types'
import { CENARIOS, CENARIOS_POR_ARQUIVO, gerarFolhas, type CenarioId, type CenarioSucesso } from './cenarios'

// Controles do painel de dev (no web vinham de ?cenario= e ?atraso= na URL). Vivem em memória:
// um recarregamento completo do app volta ao automático.
let cenarioForcado: CenarioId | null = null
let atrasoForcado: number | null = null

export function definirCenarioForcado(cenario: CenarioId | null) {
  cenarioForcado = cenario && CENARIOS.some((c) => c.id === cenario) ? cenario : null
}

export function obterCenarioForcado(): CenarioId | null {
  return cenarioForcado
}

export function definirAtrasoForcado(ms: number | null) {
  atrasoForcado = ms !== null && Number.isFinite(ms) && ms >= 0 ? Math.round(ms) : null
}

export function obterAtrasoForcado(): number | null {
  return atrasoForcado
}

export interface EntradaMock {
  nomeArquivo: string
  /** Derivada do conteúdo da foto (md5): a mesma foto sempre gera o mesmo resultado. */
  semente: number
}

export type ResultadoCenario =
  | { tipo: 'sucesso'; folhas: FolhaDiagnostico[]; origem: string }
  | { tipo: 'erro'; erro: TipoErroUpload; origem: string }

function nomeBase(nome: string) {
  return nome.toLowerCase().replace(/\.[a-z0-9]+$/, '')
}

const SORTEAVEIS: CenarioSucesso[] = ['saudavel', 'uma_folha_com_regiao', 'varias_folhas', 'varias_folhas_mistas']

/** Ordem: cenário forçado → foto conhecida (exemplos/fixtures) → sorteio determinístico pela semente. */
export function resolverCenario({ nomeArquivo, semente }: EntradaMock): ResultadoCenario {
  const comIds = (folhas: Omit<FolhaDiagnostico, 'id'>[]) => folhas.map((folha, i) => ({ id: `folha-${i + 1}`, ...folha }))

  if (cenarioForcado) {
    const origem = `forçado: ${cenarioForcado}`
    if (cenarioForcado.startsWith('erro:')) return { tipo: 'erro', erro: cenarioForcado.slice(5) as TipoErroUpload, origem }
    return { tipo: 'sucesso', folhas: comIds(gerarFolhas(cenarioForcado as CenarioSucesso, semente)), origem }
  }

  const conhecido = CENARIOS_POR_ARQUIVO[nomeBase(nomeArquivo)]
  if (typeof conhecido === 'string') return { tipo: 'erro', erro: conhecido, origem: `arquivo: ${nomeArquivo}` }
  if (conhecido) return { tipo: 'sucesso', folhas: comIds(conhecido), origem: `arquivo: ${nomeArquivo}` }

  const cenario = SORTEAVEIS[semente % SORTEAVEIS.length]
  return { tipo: 'sucesso', folhas: comIds(gerarFolhas(cenario, semente)), origem: `sorteado: ${cenario}` }
}
