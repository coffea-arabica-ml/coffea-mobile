import { useState } from 'react'
import { TelaInicial } from './src/pages/TelaInicial'
import { TelaUpload } from './src/pages/TelaUpload'
import { TelaCarregando } from './src/pages/TelaCarregando'
import { TelaResultado } from './src/pages/TelaResultado'
import { TelaErro } from './src/pages/TelaErro'
import { diagnosticarFolha } from './src/api/diagnostico'

type Tela = 'inicial' | 'upload' | 'carregando' | 'resultado' | 'erro'

type Resultado = {
  categoria: string
  severidade: string
}

export default function App() {
  const [tela, setTela] = useState<Tela>('inicial')
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [erro, setErro] = useState('')

  async function handleImagemSelecionada(uri: string) {
    setTela('carregando')
    try {
      const resultado = await diagnosticarFolha(uri)
      setResultado(resultado)
      setTela('resultado')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro desconhecido ao analisar a imagem.')
      setTela('erro')
    }
  }

  if (tela === 'inicial') return <TelaInicial onIniciar={() => setTela('upload')} />
  if (tela === 'upload') return <TelaUpload onImagemSelecionada={handleImagemSelecionada} />
  if (tela === 'carregando') return <TelaCarregando />
  if (tela === 'resultado' && resultado) return <TelaResultado resultado={resultado} onNovaAnalise={() => setTela('upload')} />
  if (tela === 'erro') return <TelaErro mensagem={erro} onTentarNovamente={() => setTela('upload')} />

  return null
}