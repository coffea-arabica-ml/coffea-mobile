import { createContext, use, useCallback, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react'
import {
  descartarImagem,
  ehCancelamento,
  ehErroDiagnostico,
  enviarImagemParaDiagnostico,
  gerarId,
  prepararImagem,
  verificarImagem,
  type DiagnosticoErro,
  type DiagnosticoSucesso,
  type ImagemLocal,
  type OrigemImagem,
} from '../api'

/** A análise "em foco" no hub — recém-feita ou aberta do histórico. */
export interface AnaliseAtual {
  id: string
  diagnostico: DiagnosticoSucesso
  /** Foto preparada, necessária para salvar no histórico. */
  imagem: ImagemLocal
  realizadaEm: string
  /** Preenchido quando a análise já está no histórico. */
  salvaComoId?: string
}

export interface FalhaAnalise {
  erro: DiagnosticoErro
  /** Prévia da foto no card de erro; ausente quando o arquivo nem é uma imagem legível. */
  previewUri: string | null
  nomeArquivo: string
  tamanhoBytes: number | null
  /** Foto já preparada, para "Tentar de novo" reenviar sem pedir outra escolha. */
  imagem: ImagemLocal | null
}

type EstadoEstavel = { fase: 'vazia' } | { fase: 'sucesso'; analise: AnaliseAtual } | ({ fase: 'erro' } & FalhaAnalise)

export type EstadoSessao =
  | EstadoEstavel
  | { fase: 'enviando'; envio: number; previewUri: string; lento: boolean; anterior: EstadoEstavel }

type Acao =
  | { tipo: 'iniciar'; envio: number; previewUri: string }
  /** A foto preparada (JPEG) substitui a original na prévia e passa a ser a foto "em uso". */
  | { tipo: 'preparada'; envio: number; uri: string }
  | { tipo: 'lento' }
  | { tipo: 'concluir'; estado: EstadoEstavel }
  | { tipo: 'cancelar' }
  | { tipo: 'marcarSalva'; id: string | undefined }

function reducer(estado: EstadoSessao, acao: Acao): EstadoSessao {
  switch (acao.tipo) {
    case 'iniciar': {
      const anterior = estado.fase === 'enviando' ? estado.anterior : estado
      return { fase: 'enviando', envio: acao.envio, previewUri: acao.previewUri, lento: false, anterior }
    }
    case 'preparada':
      return estado.fase === 'enviando' && estado.envio === acao.envio ? { ...estado, previewUri: acao.uri } : estado
    case 'lento':
      return estado.fase === 'enviando' ? { ...estado, lento: true } : estado
    case 'concluir':
      return acao.estado
    case 'cancelar':
      return estado.fase === 'enviando' ? estado.anterior : estado
    case 'marcarSalva':
      return estado.fase === 'sucesso' ? { ...estado, analise: { ...estado.analise, salvaComoId: acao.id } } : estado
  }
}

/** Fotos preparadas que algum estado ainda referencia — as demais podem sair do cache. */
function fotosEmUso(estado: EstadoSessao, uris = new Set<string>()): Set<string> {
  if (estado.fase === 'enviando') {
    uris.add(estado.previewUri)
    fotosEmUso(estado.anterior, uris)
  } else if (estado.fase === 'sucesso') uris.add(estado.analise.imagem.uri)
  else if (estado.fase === 'erro' && estado.imagem) uris.add(estado.imagem.uri)
  return uris
}

const TEMPO_LENTO_MS = 6000

interface ContextoSessao {
  estado: EstadoSessao
  /** Resumo técnico e Visualização avançada só abrem com uma análise bem-sucedida. */
  analise: AnaliseAtual | null
  /** Câmera, galeria ou exemplo: verifica, prepara e envia a foto. */
  enviarFoto: (origem: OrigemImagem) => Promise<void>
  cancelar: () => void
  tentarNovamente: () => void
  abrirAnalise: (analise: AnaliseAtual) => void
  /** undefined desfaz a marca (a análise foi excluída do histórico). */
  marcarComoSalva: (id: string | undefined) => void
}

const Contexto = createContext<ContextoSessao | null>(null)

export function SessaoAnaliseProvider({ children }: { children: ReactNode }) {
  const [estado, dispatch] = useReducer(reducer, { fase: 'vazia' })
  const sequencia = useRef(0)
  const controlador = useRef<AbortController | null>(null)
  const fotosPreparadas = useRef(new Set<string>())

  // Apaga do cache as fotos preparadas que nenhum estado usa mais (fotos do histórico nunca são apagadas).
  useEffect(() => {
    const emUso = fotosEmUso(estado)
    for (const uri of fotosPreparadas.current) {
      if (!emUso.has(uri)) {
        descartarImagem(uri)
        fotosPreparadas.current.delete(uri)
      }
    }
  }, [estado])

  // Um temporizador de "está demorando" por envio.
  const envioAtual = estado.fase === 'enviando' ? estado.envio : null
  useEffect(() => {
    if (envioAtual === null) return
    const timer = setTimeout(() => dispatch({ tipo: 'lento' }), TEMPO_LENTO_MS)
    return () => clearTimeout(timer)
  }, [envioAtual])

  /** Envia uma foto já preparada; respostas de envios antigos (sequência vencida) são ignoradas. */
  const analisar = useCallback(async (imagem: ImagemLocal, minha: number, abort: AbortController) => {
    try {
      const resposta = await enviarImagemParaDiagnostico(imagem, { signal: abort.signal })
      if (minha !== sequencia.current) return
      if (resposta.status === 'sucesso') {
        const analise: AnaliseAtual = { id: gerarId(), diagnostico: resposta, imagem, realizadaEm: new Date().toISOString() }
        dispatch({ tipo: 'concluir', estado: { fase: 'sucesso', analise } })
      } else {
        const falha: FalhaAnalise = {
          erro: resposta,
          previewUri: imagem.uri,
          nomeArquivo: imagem.nomeArquivo,
          tamanhoBytes: imagem.tamanhoBytes,
          imagem,
        }
        dispatch({ tipo: 'concluir', estado: { fase: 'erro', ...falha } })
      }
    } catch (e) {
      // Cancelado: o estado já foi restaurado por cancelar() ou substituído por um novo envio.
      if (!ehCancelamento(e)) throw e
    }
  }, [])

  const enviarFoto = useCallback(
    async (origem: OrigemImagem) => {
      controlador.current?.abort()
      const minha = ++sequencia.current

      // Formato e tamanho são verificados antes do carregamento: o erro aparece na hora.
      const verificacao = verificarImagem(origem)
      if (!verificacao.ok) {
        const { erro, nomeArquivo, tamanhoBytes } = verificacao
        const previewUri = erro.tipo === 'formato_invalido' ? null : origem.uri
        dispatch({ tipo: 'concluir', estado: { fase: 'erro', erro, previewUri, nomeArquivo, tamanhoBytes, imagem: null } })
        return
      }

      const abort = new AbortController()
      controlador.current = abort
      dispatch({ tipo: 'iniciar', envio: minha, previewUri: verificacao.arquivo.uri })

      const preparada = await prepararImagem(verificacao.arquivo)
      if (!ehErroDiagnostico(preparada)) fotosPreparadas.current.add(preparada.uri)
      if (minha !== sequencia.current) {
        if (!ehErroDiagnostico(preparada)) descartarImagem(preparada.uri)
        return
      }
      if (ehErroDiagnostico(preparada)) {
        const { nomeArquivo, tamanhoBytes } = verificacao.arquivo
        dispatch({ tipo: 'concluir', estado: { fase: 'erro', erro: preparada, previewUri: null, nomeArquivo, tamanhoBytes, imagem: null } })
        return
      }
      dispatch({ tipo: 'preparada', envio: minha, uri: preparada.uri })
      await analisar(preparada, minha, abort)
    },
    [analisar],
  )

  const cancelar = useCallback(() => {
    sequencia.current++
    controlador.current?.abort()
    dispatch({ tipo: 'cancelar' })
  }, [])

  const imagemComErro = estado.fase === 'erro' ? estado.imagem : null
  const tentarNovamente = useCallback(() => {
    if (!imagemComErro) return
    controlador.current?.abort()
    const minha = ++sequencia.current
    const abort = new AbortController()
    controlador.current = abort
    dispatch({ tipo: 'iniciar', envio: minha, previewUri: imagemComErro.uri })
    void analisar(imagemComErro, minha, abort)
  }, [imagemComErro, analisar])

  const abrirAnalise = useCallback((analise: AnaliseAtual) => {
    sequencia.current++
    controlador.current?.abort()
    dispatch({ tipo: 'concluir', estado: { fase: 'sucesso', analise } })
  }, [])

  const marcarComoSalva = useCallback((id: string | undefined) => dispatch({ tipo: 'marcarSalva', id }), [])

  const valor = useMemo<ContextoSessao>(
    () => ({
      estado,
      analise: estado.fase === 'sucesso' ? estado.analise : null,
      enviarFoto,
      cancelar,
      tentarNovamente,
      abrirAnalise,
      marcarComoSalva,
    }),
    [estado, enviarFoto, cancelar, tentarNovamente, abrirAnalise, marcarComoSalva],
  )

  return <Contexto value={valor}>{children}</Contexto>
}

export function useSessaoAnalise(): ContextoSessao {
  const contexto = use(Contexto)
  if (!contexto) throw new Error('useSessaoAnalise precisa estar dentro de <SessaoAnaliseProvider>')
  return contexto
}
