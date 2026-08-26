import { useState } from 'react'
import { TelaInicial } from './src/pages/TelaInicial'
import { TelaUpload } from './src/pages/TelaUpload'
import { TelaCarregando } from './src/pages/TelaCarregando'
import { TelaResultado } from './src/pages/TelaResultado'
import { TelaErro } from './src/pages/TelaErro'

type Tela = 'inicial' | 'upload' | 'carregando' | 'resultado' | 'erro'

type Resultado = {
  categoria: string
  severidade: string
}

export default function App() {
  const [tela, setTela] = useState<Tela>('inicial')
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [erro] = useState('')

  function handleImagemSelecionada(_uri: string) {
    setTela('carregando')
    // TODO (Frente 6): trocar isso pela chamada real ao coffea-backend
    setTimeout(() => {
      setResultado({ categoria: 'Ferrugem', severidade: 'Baixa' })
      setTela('resultado')
    }, 1500)
  }

  if (tela === 'inicial') return <TelaInicial onIniciar={() => setTela('upload')} />
  if (tela === 'upload') return <TelaUpload onImagemSelecionada={handleImagemSelecionada} />
  if (tela === 'carregando') return <TelaCarregando />
  if (tela === 'resultado' && resultado) return <TelaResultado resultado={resultado} onNovaAnalise={() => setTela('upload')} />
  if (tela === 'erro') return <TelaErro mensagem={erro} onTentarNovamente={() => setTela('upload')} />

  return null
}