import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { comAlfa, cores, curvas, duracoes } from '../theme'

/** Borda enorme em volta do furo: escurece tudo fora da lente (o `box-shadow: 0 0 0 9999px` do web). */
const BORDA = 1400

/**
 * A "lente de campo" do carregamento: a foto escurece, uma lente circular passeia sobre ela e
 * uma linha de varredura sobe e desce. Só `transform`/`opacity`, tudo na thread de UI.
 */
export function VarreduraLente({ largura, altura }: { largura: number; altura: number }) {
  const diametro = Math.min(largura, altura) * 0.46
  const passeio = useSharedValue(0)
  const varredura = useSharedValue(0)

  useEffect(() => {
    // orbitar: três pontos da foto, ida e volta suave (3,2 s por volta, como no web)
    const perna = duracoes.orbitar / 3
    passeio.value = withRepeat(
      withSequence(
        withTiming(1, { duration: perna, easing: curvas.suave }),
        withTiming(2, { duration: perna, easing: curvas.suave }),
        withTiming(3, { duration: perna, easing: curvas.suave }),
      ),
      -1,
      false,
    )
    varredura.value = withRepeat(withTiming(1, { duration: duracoes.varrer / 2, easing: curvas.varrer }), -1, true)
  }, [passeio, varredura])

  // Centros da lente em frações da foto; o ponto 3 coincide com o 0 para a volta não "pular".
  const estiloLente = useAnimatedStyle(() => {
    const x = interpolate(passeio.value, [0, 1, 2, 3], [0.38, 0.64, 0.46, 0.38])
    const y = interpolate(passeio.value, [0, 1, 2, 3], [0.34, 0.46, 0.66, 0.34])
    return {
      transform: [{ translateX: x * largura - diametro / 2 }, { translateY: y * altura - diametro / 2 }],
    }
  })

  const estiloLinha = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(varredura.value, [0, 1], [altura * 0.06, altura * 0.88]) }],
  }))

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, estilos.veu]} />
      <Animated.View style={[estilos.origem, estiloLente]}>
        <View
          style={{
            position: 'absolute',
            left: -BORDA,
            top: -BORDA,
            width: diametro + 2 * BORDA,
            height: diametro + 2 * BORDA,
            borderRadius: diametro / 2 + BORDA,
            borderWidth: BORDA,
            borderColor: comAlfa(cores.folha900, 0.45),
          }}
        />
        <View style={[estilos.aro, { width: diametro, height: diametro, borderRadius: diametro / 2 }]} />
      </Animated.View>
      <Animated.View style={[estilos.linha, estiloLinha]} />
    </View>
  )
}

const estilos = StyleSheet.create({
  veu: { backgroundColor: comAlfa(cores.folha900, 0.12) },
  origem: { position: 'absolute', left: 0, top: 0 },
  aro: {
    borderWidth: 2,
    borderColor: comAlfa(cores.branco, 0.85),
    boxShadow: '0px 0px 18px rgba(255, 255, 255, 0.35)',
  },
  linha: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 2,
    backgroundColor: comAlfa(cores.branco, 0.8),
    boxShadow: '0px 0px 24px 6px rgba(255, 255, 255, 0.45)',
  },
})
