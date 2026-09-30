import { useEffect } from 'react'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { useSessaoAnalise } from '../state/SessaoAnalise'

/**
 * Resumo, Visualização e Detalhe só existem com uma análise em foco. Se ela some (um novo envio
 * começou), a tela visível volta para a aba Enviar, onde o carregamento aparece.
 */
export function useExigeAnalise() {
  const { analise } = useSessaoAnalise()
  const navigation = useNavigation()
  const focada = useIsFocused()

  useEffect(() => {
    if (!analise && focada) navigation.navigate('Hub', { screen: 'Enviar' })
  }, [analise, focada, navigation])

  return analise
}
