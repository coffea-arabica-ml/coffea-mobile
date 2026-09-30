import { useEffect } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { CommonActions } from '@react-navigation/native'
import * as Haptics from 'expo-haptics'
import { FileText, History, ImagePlus, LoaderCircle, Lock, ScanSearch, type LucideIcon } from 'lucide-react-native'
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useToast } from '../components/Toast'
import { useSessaoAnalise } from '../state/SessaoAnalise'
import { cores, curvas, duracoes, fontes } from '../theme'
import type { AbasParams } from './tipos'

interface InfoAba {
  rotulo: string
  rotuloCurto: string
  Icone: LucideIcon
  /** Só libera depois de uma análise bem-sucedida. */
  exigeAnalise?: boolean
}

const ABAS: Record<keyof AbasParams, InfoAba> = {
  Historico: { rotulo: 'Histórico', rotuloCurto: 'Histórico', Icone: History },
  Enviar: { rotulo: 'Enviar foto', rotuloCurto: 'Enviar', Icone: ImagePlus },
  Resumo: { rotulo: 'Resumo técnico', rotuloCurto: 'Resumo', Icone: FileText, exigeAnalise: true },
  Visualizacao: { rotulo: 'Visualização avançada', rotuloCurto: 'Visualizar', Icone: ScanSearch, exigeAnalise: true },
}

export const AVISO_ABA_BLOQUEADA = 'Envie uma foto para liberar esta seção.'

interface PropsItem {
  info: InfoAba
  focada: boolean
  bloqueada: boolean
  processando: boolean
  aoPressionar: () => boolean | void
  aoSegurar: () => void
}

function ItemAba({ info, focada, bloqueada, processando, aoPressionar, aoSegurar }: PropsItem) {
  const tremor = useSharedValue(0)
  const ativo = useSharedValue(focada ? 1 : 0)
  const giro = useSharedValue(0)

  useEffect(() => {
    ativo.value = withTiming(focada ? 1 : 0, { duration: 220, easing: curvas.surgir })
  }, [focada, ativo])

  useEffect(() => {
    if (!processando) {
      cancelAnimation(giro)
      giro.value = 0
      return
    }
    giro.value = withRepeat(withTiming(360, { duration: 900, easing: Easing.linear }), -1, false)
  }, [processando, giro])

  const estiloTremor = useAnimatedStyle(() => ({ transform: [{ translateX: tremor.value }] }))
  const estiloPilula = useAnimatedStyle(() => ({ opacity: ativo.value, transform: [{ scaleX: 0.6 + 0.4 * ativo.value }] }))
  const estiloGiro = useAnimatedStyle(() => ({ transform: [{ rotate: `${giro.value}deg` }] }))

  function tocar() {
    // Aba bloqueada treme (mesma animação `tremer` do coffea-web).
    if (aoPressionar() === false) {
      const passo = duracoes.tremer / 4
      tremor.value = withSequence(
        withTiming(-4, { duration: passo }),
        withTiming(4, { duration: passo }),
        withTiming(-3, { duration: passo }),
        withTiming(0, { duration: passo }),
      )
    }
  }

  const Icone = bloqueada ? Lock : processando ? LoaderCircle : info.Icone
  const cor = bloqueada ? cores.tintaFraca : focada ? cores.folha700 : cores.tintaSuave

  return (
    <Pressable
      onPress={tocar}
      onLongPress={aoSegurar}
      accessibilityRole="tab"
      accessibilityLabel={bloqueada ? `${info.rotulo} — disponível depois de enviar uma foto` : info.rotulo}
      accessibilityState={{ selected: focada, disabled: bloqueada, busy: processando }}
      style={estilos.item}
    >
      <Animated.View style={[estilos.itemConteudo, estiloTremor]}>
        <View style={estilos.icone}>
          <Animated.View style={[StyleSheet.absoluteFill, estilos.pilula, estiloPilula]} />
          <Animated.View style={processando ? estiloGiro : undefined}>
            <Icone size={21} color={cor} strokeWidth={focada ? 2.2 : 1.9} />
          </Animated.View>
        </View>
        <Text
          style={[estilos.rotulo, { color: cor }, focada && { fontFamily: fontes.textoSemi }]}
          numberOfLines={1}
          maxFontSizeMultiplier={1.3}
        >
          {info.rotuloCurto}
        </Text>
      </Animated.View>
    </Pressable>
  )
}

/** Barra de abas do hub: Resumo e Visualização ficam com cadeado até existir uma análise. */
export function BarraAbas({ state, navigation }: BottomTabBarProps) {
  const { bottom } = useSafeAreaInsets()
  const { analise, estado } = useSessaoAnalise()
  const avisar = useToast()

  return (
    <View style={[estilos.barra, { paddingBottom: Math.max(bottom, 8) }]} accessibilityRole="tablist">
      {state.routes.map((rota, indice) => {
        const info = ABAS[rota.name as keyof AbasParams]
        const focada = state.index === indice
        const bloqueada = !!info.exigeAnalise && !analise
        const processando = rota.name === 'Enviar' && estado.fase === 'enviando'

        return (
          <ItemAba
            key={rota.key}
            info={info}
            focada={focada}
            bloqueada={bloqueada}
            processando={processando}
            aoPressionar={() => {
              if (bloqueada) {
                void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
                avisar(AVISO_ABA_BLOQUEADA)
                return false
              }
              const evento = navigation.emit({ type: 'tabPress', target: rota.key, canPreventDefault: true })
              if (!focada && !evento.defaultPrevented) {
                void Haptics.selectionAsync()
                navigation.dispatch({ ...CommonActions.navigate(rota), target: state.key })
              }
            }}
            aoSegurar={() => navigation.emit({ type: 'tabLongPress', target: rota.key })}
          />
        )
      })}
    </View>
  )
}

const estilos = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 6,
    backgroundColor: cores.superficie,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: cores.linha,
  },
  item: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  itemConteudo: { alignItems: 'center', gap: 3 },
  icone: { width: 58, height: 30, alignItems: 'center', justifyContent: 'center' },
  pilula: { borderRadius: 15, backgroundColor: cores.folha100 },
  rotulo: { fontFamily: fontes.textoMedio, fontSize: 11.5, lineHeight: 15 },
})
