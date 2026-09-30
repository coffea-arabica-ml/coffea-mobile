import type { DiagnosticoSucesso } from '../api'
import { agruparPorCategoria, problemasDe, type GrupoCategoria } from './analise'
import { CATEGORIAS } from '../content/categorias'
import { ROTULO_SEVERIDADE } from './severidade'

export interface ResumoTexto {
  /** Frase curta de status, exibida junto da imagem. */
  status: string
  titulo: string
  paragrafo: string
}

const folhas = (n: number) => (n === 1 ? '1 folha' : `${n} folhas`)

function juntar(itens: string[]): string {
  if (itens.length <= 1) return itens.join('')
  return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`
}

function descreverGrupo(grupo: GrupoCategoria): string {
  const nome = CATEGORIAS[grupo.categoria].nome.toLowerCase()
  const severidade = ROTULO_SEVERIDADE[grupo.severidadeMaxima].toLowerCase()
  if (grupo.folhas.length === 1) return `${nome} (severidade ${severidade})`
  return `${nome} em ${folhas(grupo.folhas.length)} (severidade até ${severidade})`
}

/** Texto do Resumo técnico. Funciona com 0, 1 ou N folhas, com ou sem folhas saudáveis na lista. */
export function resumirDiagnostico(diagnostico: DiagnosticoSucesso): ResumoTexto {
  const total = diagnostico.folhas.length
  const problemas = problemasDe(diagnostico)

  if (problemas.length === 0) {
    return {
      status: 'Nenhum sinal de estresse',
      titulo: 'A planta parece saudável',
      paragrafo:
        total > 1
          ? `Analisamos ${folhas(total)} e nenhuma apresentou manchas ou lesões associadas a estresses bióticos do cafeeiro.`
          : 'Não encontramos manchas ou lesões associadas a estresses bióticos do cafeeiro nesta foto.',
    }
  }

  const grupos = agruparPorCategoria(problemas)
  const inicio =
    total > problemas.length
      ? `Das ${folhas(total)} analisadas, ${problemas.length === 1 ? '1 apresenta' : `${problemas.length} apresentam`} sinais de estresse`
      : `Identificamos sinais de estresse em ${folhas(problemas.length)}`

  return {
    status: problemas.length === 1 ? '1 sinal de estresse' : `${problemas.length} sinais de estresse`,
    titulo: grupos.length === 1 ? `Sinais de ${CATEGORIAS[grupos[0].categoria].nome.toLowerCase()}` : 'Sinais de estresse encontrados',
    paragrafo: `${inicio}: ${juntar(grupos.map(descreverGrupo))}.`,
  }
}

/** Versão de uma linha, para os cards do histórico. */
export function resumoCurto(diagnostico: DiagnosticoSucesso): string {
  const problemas = problemasDe(diagnostico)
  if (problemas.length === 0) return 'Sem sinais de estresse'
  const grupos = agruparPorCategoria(problemas)
  if (problemas.length === 1) {
    return `${CATEGORIAS[problemas[0].categoria].nome} · severidade ${ROTULO_SEVERIDADE[problemas[0].severidade].toLowerCase()}`
  }
  return `${folhas(problemas.length)} com sinais · ${juntar(grupos.map((g) => CATEGORIAS[g.categoria].nome.toLowerCase()))}`
}
