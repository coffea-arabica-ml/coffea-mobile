// Copiado de coffea-web/src/api/mock/cenarios.ts — mantenha os dois iguais: as mesmas fotos precisam
// gerar o mesmo resultado simulado nos dois apps.
import type { CategoriaEstresse, FolhaDiagnostico, NivelSeveridade, TipoErroUpload } from '../types'

export type CenarioSucesso =
  | 'saudavel'
  | 'saudavel_sem_folhas'
  | 'uma_folha_com_regiao'
  | 'uma_folha_sem_regiao'
  | 'varias_folhas'
  | 'varias_folhas_mistas'

export type CenarioId = CenarioSucesso | `erro:${TipoErroUpload}`

export const CENARIOS: { id: CenarioId; rotulo: string }[] = [
  { id: 'saudavel', rotulo: 'Planta saudável (N folhas saudáveis)' },
  { id: 'saudavel_sem_folhas', rotulo: 'Saudável, lista de folhas vazia' },
  { id: 'uma_folha_com_regiao', rotulo: '1 folha com região' },
  { id: 'uma_folha_sem_regiao', rotulo: '1 folha sem região (backend atual)' },
  { id: 'varias_folhas', rotulo: 'N folhas com região' },
  { id: 'varias_folhas_mistas', rotulo: 'N folhas, algumas sem região' },
  { id: 'erro:planta_nao_identificada', rotulo: 'Erro: nenhuma planta' },
  { id: 'erro:formato_invalido', rotulo: 'Erro: formato inválido' },
  { id: 'erro:especie_incorreta', rotulo: 'Erro: espécie incorreta' },
  { id: 'erro:arquivo_muito_grande', rotulo: 'Erro: arquivo grande' },
  { id: 'erro:baixa_confianca', rotulo: 'Erro: baixa confiança (RF07)' },
  { id: 'erro:erro_desconhecido', rotulo: 'Erro: desconhecido' },
]

export const MENSAGENS_ERRO: Record<TipoErroUpload, string> = {
  planta_nao_identificada: 'Nenhuma planta foi detectada na imagem.',
  formato_invalido: 'Formato de arquivo não suportado.',
  especie_incorreta: 'A planta detectada não é um cafeeiro.',
  arquivo_muito_grande: 'O arquivo excede o tamanho máximo permitido.',
  baixa_confianca: 'Confiança da detecção abaixo do limiar.',
  erro_desconhecido: 'Falha simulada no servidor (HTTP 500).',
}

type FolhaBase = Omit<FolhaDiagnostico, 'id'>

function f(categoria: CategoriaEstresse, severidade: NivelSeveridade, x?: number, y?: number, raio?: number): FolhaBase {
  return x === undefined || y === undefined || raio === undefined
    ? { categoria, severidade }
    : { categoria, severidade, regiao: { x, y, raio } }
}

const saudavel = (x?: number, y?: number, raio?: number) => f('saudavel', 'saudavel', x, y, raio)

/** Respostas calibradas à mão para as fotos conhecidas — os círculos caem sobre folhas reais. */
export const CENARIOS_POR_ARQUIVO: Record<string, FolhaBase[] | TipoErroUpload> = {
  'planta-cafe-doente': [
    f('ferrugem', 'alta', 0.742, 0.258, 0.115),
    f('cercosporiose', 'baixa', 0.259, 0.676, 0.105),
    saudavel(0.33, 0.1, 0.1),
    saudavel(0.7, 0.1, 0.1),
    saudavel(0.28, 0.43, 0.12),
    saudavel(0.75, 0.47, 0.12),
    saudavel(0.84, 0.63, 0.1),
    saudavel(0.4, 0.83, 0.1),
    saudavel(0.61, 0.83, 0.11),
  ],
  'planta-cafe-saudavel': [
    saudavel(0.3, 0.12, 0.1),
    saudavel(0.7, 0.12, 0.1),
    saudavel(0.27, 0.42, 0.12),
    saudavel(0.75, 0.43, 0.12),
    saudavel(0.26, 0.7, 0.11),
    saudavel(0.8, 0.68, 0.12),
    saudavel(0.6, 0.82, 0.1),
  ],
  'teste-retrato': [saudavel(0.3, 0.2, 0.12), saudavel(0.72, 0.3, 0.12), saudavel(0.4, 0.62, 0.12), saudavel(0.8, 0.8, 0.1)],
  'teste-paisagem': [
    f('cercosporiose', 'baixa', 0.81, 0.56, 0.12),
    f('cercosporiose', 'muito_baixa', 0.675, 0.72, 0.13),
    saudavel(0.25, 0.3, 0.16),
    saudavel(0.4, 0.73, 0.2),
    saudavel(0.63, 0.25, 0.16),
  ],
  'teste-quadrada': [f('phoma', 'baixa')],
  'teste-sem-planta': 'planta_nao_identificada',
  'teste-especie-incorreta': 'especie_incorreta',
  'teste-baixa-qualidade': 'baixa_confianca',
}

/** Gerador pseudoaleatório determinístico (mulberry32): mesma semente, mesmo resultado. */
export function criarAleatorio(semente: number) {
  let s = semente >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const PROBLEMAS: CategoriaEstresse[] = ['ferrugem', 'bicho_mineiro', 'cercosporiose', 'phoma']
const SEVERIDADES_PROBLEMA: NivelSeveridade[] = ['muito_baixa', 'baixa', 'alta', 'muito_alta']

/** Gera folhas plausíveis para um cenário sintético (fotos desconhecidas ou cenário forçado). */
export function gerarFolhas(cenario: CenarioSucesso, semente: number): FolhaBase[] {
  const aleatorio = criarAleatorio(semente)
  const entre = (min: number, max: number) => min + aleatorio() * (max - min)
  const escolher = <T,>(lista: readonly T[]) => lista[Math.floor(aleatorio() * lista.length)]
  const posicao = () => [entre(0.22, 0.78), entre(0.18, 0.82), entre(0.07, 0.12)] as const

  const saudaveis = (n: number) => Array.from({ length: n }, () => saudavel(...posicao()))
  const problema = (categoria: CategoriaEstresse, comRegiao = true) =>
    comRegiao ? f(categoria, escolher(SEVERIDADES_PROBLEMA), ...posicao()) : f(categoria, escolher(SEVERIDADES_PROBLEMA))

  switch (cenario) {
    case 'saudavel':
      return saudaveis(3 + Math.floor(aleatorio() * 5))
    case 'saudavel_sem_folhas':
      return []
    case 'uma_folha_com_regiao':
      return [problema(escolher(PROBLEMAS))]
    case 'uma_folha_sem_regiao':
      return [problema(escolher(PROBLEMAS), false)]
    case 'varias_folhas':
      return [
        problema('ferrugem'),
        problema('cercosporiose'),
        problema('bicho_mineiro'),
        problema(escolher(PROBLEMAS)),
        ...saudaveis(4),
      ]
    case 'varias_folhas_mistas':
      return [problema('ferrugem'), problema('phoma', false), problema('bicho_mineiro'), problema('cercosporiose', false), ...saudaveis(3)]
  }
}
