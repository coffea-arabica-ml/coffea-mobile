import { createContext, use, useCallback, useRef, useState, type ReactNode } from 'react'
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native'
import Animated, { FadeInDown, FadeOutDown, LinearTransition } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Info } from 'lucide-react-native'
import { cores, curvas, fontes, raios, sombras } from '../theme'

interface Aviso {
  id: number
  texto: string
}

/** Altura aproximada da barra de abas, para o aviso aparecer logo acima dela. */
const ACIMA_DAS_ABAS = 76

const Contexto = createContext<((texto: string) => void) | null>(null)

/** Avisos curtos e não bloqueantes, também anunciados para leitores de tela. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const proximoId = useRef(0)
  const { bottom } = useSafeAreaInsets()

  const avisar = useCallback((texto: string) => {
    const id = ++proximoId.current
    setAvisos((atuais) => [...atuais.filter((a) => a.texto !== texto), { id, texto }].slice(-3))
    AccessibilityInfo.announceForAccessibility(texto)
    setTimeout(() => setAvisos((atuais) => atuais.filter((a) => a.id !== id)), 3800)
  }, [])

  return (
    <Contexto value={avisar}>
      {children}
      <View pointerEvents="none" style={[estilos.area, { bottom: bottom + ACIMA_DAS_ABAS }]}>
        {avisos.map((a) => (
          <Animated.View
            key={a.id}
            entering={FadeInDown.duration(300).easing(curvas.surgir)}
            exiting={FadeOutDown.duration(200)}
            layout={LinearTransition.duration(200)}
            style={estilos.aviso}
            accessibilityLiveRegion="polite"
          >
            <Info size={16} color={cores.folha300} />
            <Text style={estilos.texto}>{a.texto}</Text>
          </Animated.View>
        ))}
      </View>
    </Contexto>
  )
}

export function useToast() {
  const avisar = use(Contexto)
  if (!avisar) throw new Error('useToast precisa estar dentro de <ToastProvider>')
  return avisar
}

const estilos = StyleSheet.create({
  area: { position: 'absolute', left: 16, right: 16, alignItems: 'center', gap: 8 },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: 480,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: raios.pilula,
    backgroundColor: cores.folha900,
    boxShadow: sombras.flutuante,
  },
  texto: { flexShrink: 1, color: cores.branco, fontFamily: fontes.texto, fontSize: 14, lineHeight: 19 },
})
