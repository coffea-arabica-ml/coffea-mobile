import { useNavigation } from '@react-navigation/native'
import { BookmarkCheck, BookmarkPlus } from 'lucide-react-native'
import type { StyleProp, ViewStyle } from 'react-native'
import { useSessaoAnalise } from '../state/SessaoAnalise'
import { Botao, type VarianteBotao } from './Botao'

/** "Salvar análise" (T9): abre o modal de título; depois de salva, vira um atalho para o histórico. */
export function BotaoSalvarAnalise({ variante = 'secundario', style }: { variante?: VarianteBotao; style?: StyleProp<ViewStyle> }) {
  const { analise } = useSessaoAnalise()
  const navigation = useNavigation()
  if (!analise) return null

  if (analise.salvaComoId) {
    return (
      <Botao
        titulo="Salva no histórico"
        icone={BookmarkCheck}
        variante="fantasma"
        dica="Abre o histórico"
        aoPressionar={() => navigation.navigate('Hub', { screen: 'Historico', params: { destacar: analise.salvaComoId } })}
        style={style}
      />
    )
  }

  return (
    <Botao
      titulo="Salvar análise"
      icone={BookmarkPlus}
      variante={variante}
      aoPressionar={() => navigation.navigate('SalvarAnalise')}
      style={style}
    />
  )
}
