// Superfície pública de src/api/ — telas e estado importam só daqui.
export type * from './types'
export { LIMITES, modoApi } from './config'
export { ehCancelamento } from './cancelamento'
export { gerarId } from './id'
export {
  verificarImagem,
  prepararImagem,
  descartarImagem,
  copiarParaCache,
  origemDoPacote,
  ehErroDiagnostico,
  type OrigemImagem,
  type ArquivoVerificado,
  type ImagemLocal,
  type ResultadoVerificacao,
} from './imagem'
export { enviarImagemParaDiagnostico, type OpcoesEnvio } from './diagnostico'
export {
  listarAnalises,
  obterAnalise,
  salvarAnalise,
  apagarAnalise,
  type ItemHistorico,
  type AnaliseCarregada,
} from './historico'
