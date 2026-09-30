// Contrato PROVISÓRIO entre o Cafélens e o coffea-backend — idêntico ao do coffea-web, exceto
// `imagemUri` (no celular a foto é um arquivo local). Fonte: docs/frontend-reference/03-contrato-api-mock.md.

export type CategoriaEstresse = 'saudavel' | 'ferrugem' | 'bicho_mineiro' | 'cercosporiose' | 'phoma'

export type NivelSeveridade = 'saudavel' | 'muito_baixa' | 'baixa' | 'alta' | 'muito_alta'

export type TipoErroUpload =
  | 'planta_nao_identificada'
  | 'formato_invalido'
  | 'especie_incorreta'
  | 'arquivo_muito_grande'
  /** RF07: a imagem tem baixa probabilidade de conter um cafeeiro diagnosticável. */
  | 'baixa_confianca'
  | 'erro_desconhecido'

/** Região aproximada da folha na imagem, usada pelos círculos tocáveis (RF04). */
export interface RegiaoFolha {
  /** Centro, relativo (0 a 1) à largura da imagem. */
  x: number
  /** Centro, relativo (0 a 1) à altura da imagem. */
  y: number
  /** PROVISÓRIO: raio relativo (0 a 1) à MENOR dimensão da imagem. */
  raio: number
}

export interface FolhaDiagnostico {
  id: string
  categoria: CategoriaEstresse
  severidade: NivelSeveridade
  /**
   * PROVISÓRIO — pode não vir preenchido. Se ausente, a Visualização avançada
   * degrada para uma lista simples, sem círculos posicionados.
   */
  regiao?: RegiaoFolha
  /** Texto de cuidado da categoria — se ausente, a UI usa o catálogo local. */
  comoCuidar?: string
  comoPrevenir?: string
}

export interface DiagnosticoSucesso {
  status: 'sucesso'
  /** URI local (file://) da foto analisada. */
  imagemUri: string
  /**
   * Nunca assuma tamanho fixo: pode vir com 0, 1 ou N folhas, e pode incluir
   * folhas saudáveis. "Problema" é qualquer folha com categoria diferente de 'saudavel'.
   */
  folhas: FolhaDiagnostico[]
}

export interface DiagnosticoErro {
  status: 'erro'
  tipo: TipoErroUpload
  mensagem: string
}

export type DiagnosticoResponse = DiagnosticoSucesso | DiagnosticoErro

export interface AnaliseSalva {
  id: string
  titulo: string
  criadoEm: string // ISO date
  diagnostico: DiagnosticoSucesso
}
