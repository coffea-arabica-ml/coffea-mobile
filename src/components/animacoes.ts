import { FadeInDown } from 'react-native-reanimated'
import { curvas, duracoes, PASSO_CASCATA } from '../theme'

/**
 * `surgir` do coffea-web: sobe 8 px enquanto aparece. `ordem` escalona os blocos em cascata.
 * Com "Remover animações" ligado no sistema, o Reanimated pula direto para o estado final.
 */
export function surgir(ordem = 0) {
  return FadeInDown.duration(duracoes.surgir)
    .delay(ordem * PASSO_CASCATA)
    .easing(curvas.surgir)
    .withInitialValues({ opacity: 0, transform: [{ translateY: 8 }] })
}
