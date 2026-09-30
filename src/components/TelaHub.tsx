import { forwardRef, type ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { FlaskConical } from 'lucide-react-native'
import { modoApi } from '../api'
import { AVISO_DEMONSTRACAO } from '../content/textos'
import { cores, MARGEM, raios } from '../theme'
import { Logo } from './Logo'
import { Texto } from './Texto'
import { useToast } from './Toast'

/** Selo "Demonstração" enquanto o mock estiver ativo. Em dev, abre o painel de cenários. */
function SeloDemonstracao() {
  const navigation = useNavigation()
  const avisar = useToast()
  if (modoApi !== 'mock') return null
  return (
    <Pressable
      onPress={() => (__DEV__ ? navigation.navigate('PainelCenarios') : avisar(AVISO_DEMONSTRACAO.explicacao))}
      accessibilityRole="button"
      accessibilityLabel={`${AVISO_DEMONSTRACAO.selo}: ${AVISO_DEMONSTRACAO.explicacao}`}
      accessibilityHint={__DEV__ ? 'Abre o painel de cenários do mock' : undefined}
      hitSlop={8}
      style={({ pressed }) => [estilos.selo, pressed && { backgroundColor: cores.cereja100 }]}
    >
      <FlaskConical size={14} color={cores.cereja700} />
      <Texto tipo="legenda" peso="medio" cor={cores.cereja700}>
        {AVISO_DEMONSTRACAO.selo}
      </Texto>
    </Pressable>
  )
}

export function CabecalhoHub() {
  const navigation = useNavigation()
  return (
    <View style={estilos.cabecalho}>
      <Pressable
        onPress={() => navigation.navigate('Sobre')}
        accessibilityRole="button"
        accessibilityLabel="Cafélens — sobre o projeto"
        hitSlop={8}
        style={({ pressed }) => pressed && { opacity: 0.7 }}
      >
        <Logo tamanho="sm" />
      </Pressable>
      <SeloDemonstracao />
    </View>
  )
}

/** Sobretítulo + título grande (Fraunces) de cada seção do hub. */
export function Titulo({ children, sobretitulo }: { children: ReactNode; sobretitulo?: ReactNode }) {
  return (
    <View style={estilos.titulo}>
      {sobretitulo ? (
        <Texto tipo="sobretitulo" cor={cores.tintaSuave}>
          {sobretitulo}
        </Texto>
      ) : null}
      <Texto tipo="titulo" accessibilityRole="header">
        {children}
      </Texto>
    </View>
  )
}

interface PropsTela extends ScrollViewProps {
  children: ReactNode
}

/** Moldura das abas do hub: cabeçalho fixo com o logo e conteúdo rolável. */
export const TelaHub = forwardRef<ScrollView, PropsTela>(function TelaHub({ children, contentContainerStyle, ...props }, ref) {
  return (
    <SafeAreaView edges={['top']} style={estilos.tela}>
      <CabecalhoHub />
      <ScrollView
        ref={ref}
        {...props}
        contentContainerStyle={[estilos.conteudo, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  )
})

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.papel },
  cabecalho: {
    height: 56,
    paddingHorizontal: MARGEM,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: raios.pilula,
    backgroundColor: cores.cereja50,
    borderWidth: 1,
    borderColor: cores.cereja100,
  },
  conteudo: { paddingHorizontal: MARGEM, paddingTop: 8, paddingBottom: 40, gap: 24 },
  titulo: { gap: 10 },
})
