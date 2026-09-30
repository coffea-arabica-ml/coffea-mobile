import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { apagarAnalise, gerarId, listarAnalises, obterAnalise, salvarAnalise, type ItemHistorico } from '../api'
import type { AnaliseAtual } from './SessaoAnalise'

interface ContextoHistorico {
  /** null enquanto carrega. */
  itens: ItemHistorico[] | null
  salvar: (analise: AnaliseAtual, titulo: string) => Promise<string>
  /** Carrega uma análise salva no formato da sessão, sem reprocessar. */
  carregar: (id: string) => Promise<AnaliseAtual | null>
  excluir: (id: string) => Promise<void>
}

const Contexto = createContext<ContextoHistorico | null>(null)

export function HistoricoProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ItemHistorico[] | null>(null)

  useEffect(() => {
    let ativo = true
    void listarAnalises().then((lista) => {
      if (ativo) setItens(lista)
    })
    return () => {
      ativo = false
    }
  }, [])

  const salvar = useCallback(async (analise: AnaliseAtual, titulo: string) => {
    const item = await salvarAnalise({
      titulo,
      diagnostico: analise.diagnostico,
      imagem: analise.imagem,
      realizadaEm: analise.realizadaEm,
    })
    setItens((atuais) => [item, ...(atuais ?? [])])
    return item.id
  }, [])

  const carregar = useCallback(async (id: string): Promise<AnaliseAtual | null> => {
    const carregada = await obterAnalise(id)
    if (!carregada) return null
    return {
      id: gerarId(),
      diagnostico: carregada.analise.diagnostico,
      imagem: carregada.imagem,
      realizadaEm: carregada.analise.criadoEm,
      salvaComoId: carregada.analise.id,
    }
  }, [])

  const excluir = useCallback(async (id: string) => {
    await apagarAnalise(id)
    setItens((atuais) => (atuais ?? []).filter((i) => i.id !== id))
  }, [])

  const valor = useMemo(() => ({ itens, salvar, carregar, excluir }), [itens, salvar, carregar, excluir])
  return <Contexto value={valor}>{children}</Contexto>
}

export function useHistorico(): ContextoHistorico {
  const contexto = use(Contexto)
  if (!contexto) throw new Error('useHistorico precisa estar dentro de <HistoricoProvider>')
  return contexto
}
