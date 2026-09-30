import { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'
import type { RegiaoFolha } from '../api'
import { enquadramentoInteiro, enquadramentoLente } from '../domain/geometria'
import { cores, curvas, duracoes, sombras } from '../theme'

const AnimatedImage = Animated.createAnimatedComponent(Image)

interface Props {
  uri: string
  rotuloAcessivel: string
  /** Dimensões naturais da foto (só a proporção importa). */
  largura: number
  altura: number
  /** Sem região, a lente mostra a foto inteira. */
  regiao?: RegiaoFolha
  cor: string
  diametro: number
  /**
   * Abre com a foto inteira e "dá zoom" até a folha — o equivalente nativo da View Transition
   * do coffea-web (o círculo tocado cresce até virar a lente).
   */
  animarEntrada?: boolean
}

/** A folha ampliada dentro de um círculo — só layout e transformação, sem recortar a imagem. */
export function Lente({ uri, rotuloAcessivel, largura, altura, regiao, cor, diametro, animarEntrada = false }: Props) {
  const inteiro = enquadramentoInteiro(largura, altura)
  const final = regiao ? enquadramentoLente(regiao, largura, altura) : inteiro
  const zoom = useSharedValue(animarEntrada && regiao ? 0 : 1)
  const entrada = useSharedValue(animarEntrada ? 0 : 1)

  useEffect(() => {
    if (!animarEntrada) return
    entrada.value = withTiming(1, { duration: duracoes.lente, easing: curvas.surgir })
    zoom.value = withDelay(120, withTiming(1, { duration: duracoes.lente * 1.6, easing: curvas.surgir }))
  }, [animarEntrada, entrada, zoom])

  const estiloFoto = useAnimatedStyle(() => {
    const t = zoom.value
    return {
      width: interpolate(t, [0, 1], [inteiro.largura, final.largura]) * diametro,
      height: interpolate(t, [0, 1], [inteiro.altura, final.altura]) * diametro,
      left: interpolate(t, [0, 1], [inteiro.esquerda, final.esquerda]) * diametro,
      top: interpolate(t, [0, 1], [inteiro.topo, final.topo]) * diametro,
    }
  })

  const estiloLente = useAnimatedStyle(() => ({
    opacity: entrada.value,
    transform: [{ scale: interpolate(entrada.value, [0, 1], [0.82, 1]) }],
  }))

  const circulo = { width: diametro, height: diametro, borderRadius: diametro / 2 }
  return (
    // Duas camadas: o anel (boxShadow) fica fora do recorte circular da foto.
    <Animated.View
      accessible
      accessibilityRole="image"
      accessibilityLabel={rotuloAcessivel}
      style={[
        estilos.anel,
        circulo,
        { boxShadow: `0px 0px 0px 6px ${cores.papel}, 0px 0px 0px 9px ${cor}, ${sombras.flutuante}` },
        estiloLente,
      ]}
    >
      <Animated.View style={[estilos.recorte, circulo]}>
        <AnimatedImage source={{ uri }} style={[estilos.foto, estiloFoto]} contentFit="fill" />
      </Animated.View>
    </Animated.View>
  )
}

const estilos = StyleSheet.create({
  anel: { alignSelf: 'center' },
  recorte: { overflow: 'hidden', backgroundColor: cores.papel2 },
  foto: { position: 'absolute' },
})
