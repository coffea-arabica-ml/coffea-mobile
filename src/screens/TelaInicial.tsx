import { useCallback, useEffect } from 'react'
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { setStatusBarStyle } from 'expo-status-bar'
import { ArrowRight, X } from 'lucide-react-native'
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { surgir } from '../components/animacoes'
import { Botao } from '../components/Botao'
import { Logo } from '../components/Logo'
import { Texto } from '../components/Texto'
import { AVISO_AGRONOMICO } from '../content/textos'
import type { PropsRaiz } from '../navigation/tipos'
import { marcarBoasVindasVistas } from '../state/preferencias'
import { comAlfa, cores, curvas, duracoes, fontes, MARGEM } from '../theme'

const PASSOS = [
  { titulo: 'Fotografe a planta', texto: 'Uma foto do cafeeiro inteiro, pela câmera ou da galeria.' },
  { titulo: 'A IA examina cada folha', texto: 'Cada folha visível é localizada e classificada em poucos segundos.' },
  { titulo: 'Receba o diagnóstico', texto: 'Tipo de estresse, severidade e orientações de cuidado.' },
]

/** T1 — apresenta o Cafélens. No 1º acesso é a porta de entrada; depois, reaparece como "Sobre". */
export function TelaInicial({ navigation, route }: PropsRaiz<'Inicial' | 'Sobre'>) {
  const comoSobre = route.name === 'Sobre'
  const { width, height } = useWindowDimensions()

  // Fundo escuro: barra de status clara só enquanto esta tela está visível.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light')
      return () => setStatusBarStyle('dark')
    }, []),
  )

  // "respirar": zoom lentíssimo da foto de fundo (28 s, ida e volta), como na landing do web.
  const respiro = useSharedValue(0)
  useEffect(() => {
    respiro.value = withRepeat(withTiming(1, { duration: duracoes.respirar, easing: curvas.suave }), -1, true)
  }, [respiro])
  const estiloFundo = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(respiro.value, [0, 1], [1.04, 1.12]) },
      { translateX: interpolate(respiro.value, [0, 1], [0, -0.015 * width]) },
    ],
  }))

  function comecar(aba: 'Enviar' | 'Historico') {
    if (comoSobre) {
      navigation.popTo('Hub', { screen: aba })
      return
    }
    void marcarBoasVindasVistas()
    navigation.reset({ index: 0, routes: [{ name: 'Hub', params: { screen: aba } }] })
  }

  const lente = Math.min(width * 0.36, 170)

  return (
    <View style={estilos.tela}>
      <Animated.View style={[StyleSheet.absoluteFill, estiloFundo]}>
        <Image source={require('../assets/fundo-1.jpg')} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition={{ left: '72%', top: '50%' }} />
      </Animated.View>
      <LinearGradient
        colors={[comAlfa(cores.folha900, 0.25), comAlfa(cores.folha900, 0.55), comAlfa(cores.folha900, 0.96), cores.folha900]}
        locations={[0, 0.3, 0.62, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* A lente — o motivo visual do Cafélens — pousada sobre os frutos da foto. */}
      <Animated.View
        entering={surgir(2)}
        pointerEvents="none"
        style={[estilos.lente, { width: lente, height: lente, borderRadius: lente / 2, top: height * 0.15, right: width * 0.1 }]}
      >
        <View style={estilos.haste} />
      </Animated.View>

      <SafeAreaView style={estilos.area} edges={['top', 'bottom']}>
        <View style={estilos.cabecalho}>
          <Logo tamanho="sm" claro />
          {comoSobre ? (
            <Pressable
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              hitSlop={10}
              style={({ pressed }) => [estilos.fechar, pressed && { backgroundColor: comAlfa(cores.branco, 0.25) }]}
            >
              <X size={20} color={cores.branco} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView contentContainerStyle={[estilos.conteudo, { minHeight: height * 0.78 }]} showsVerticalScrollIndicator={false}>
          <View style={estilos.chamada}>
            <Animated.View entering={surgir(0)}>
              <Texto tipo="sobretitulo" cor={cores.folha300}>
                Diagnóstico de cafeeiros por imagem
              </Texto>
            </Animated.View>
            <Animated.View entering={surgir(1)}>
              <Texto tipo="display" cor={cores.branco} accessibilityRole="header">
                Da folha ao diagnóstico, em segundos.
              </Texto>
            </Animated.View>
            <Animated.View entering={surgir(2)}>
              <Texto tipo="corpoGrande" cor={comAlfa(cores.branco, 0.82)}>
                O Cafélens encontra sinais de ferrugem, bicho-mineiro, cercosporiose e phoma em cada folha do cafeeiro —
                antes que eles comprometam a lavoura. Sem equipamento especial, sem conhecimento técnico.
              </Texto>
            </Animated.View>
            <Animated.View entering={surgir(3)} style={estilos.acoes}>
              <Botao titulo="Começar diagnóstico" icone={ArrowRight} iconeDepois variante="destaque" grande aoPressionar={() => comecar('Enviar')} />
              <Botao titulo="Ver histórico" variante="claro" grande aoPressionar={() => comecar('Historico')} />
            </Animated.View>
          </View>

          <Animated.View entering={surgir(5)} style={estilos.passos}>
            <Texto tipo="sobretitulo" cor={comAlfa(cores.branco, 0.6)} accessibilityRole="header">
              Como funciona
            </Texto>
            {PASSOS.map((passo, i) => (
              <View key={passo.titulo} style={estilos.passo}>
                <Texto style={estilos.numero} numeros>
                  {i + 1}
                </Texto>
                <View style={estilos.passoTexto}>
                  <Texto peso="medio" cor={cores.branco}>
                    {passo.titulo}
                  </Texto>
                  <Texto tipo="pequeno" cor={comAlfa(cores.branco, 0.68)}>
                    {passo.texto}
                  </Texto>
                </View>
              </View>
            ))}
          </Animated.View>

          <View style={estilos.rodape}>
            <Texto tipo="legenda" cor={comAlfa(cores.branco, 0.5)}>
              Projeto de pesquisa aplicada da UNIFRAN — Estimativa de Severidade e Classificação de Estresses Bióticos em
              Folhas de <Texto tipo="legenda" italico cor={comAlfa(cores.branco, 0.5)}>Coffea arabica</Texto> via Aprendizado
              por Transferência.
            </Texto>
            <Texto tipo="legenda" cor={comAlfa(cores.branco, 0.5)}>
              {AVISO_AGRONOMICO}
            </Texto>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.folha900, overflow: 'hidden' },
  area: { flex: 1 },
  cabecalho: {
    height: 56,
    paddingHorizontal: MARGEM,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fechar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: comAlfa(cores.branco, 0.14),
  },
  lente: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: comAlfa(cores.branco, 0.65),
    boxShadow: '0px 0px 0px 1px rgba(255, 255, 255, 0.15), 0px 0px 60px rgba(255, 255, 255, 0.14)',
  },
  haste: {
    position: 'absolute',
    bottom: -14,
    left: '50%',
    width: 1.5,
    height: 22,
    backgroundColor: comAlfa(cores.branco, 0.65),
  },
  conteudo: { paddingHorizontal: MARGEM + 4, paddingBottom: 24, justifyContent: 'flex-end', gap: 40 },
  chamada: { gap: 18 },
  acoes: { gap: 12, marginTop: 10 },
  passos: { gap: 16, paddingTop: 26, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: comAlfa(cores.branco, 0.2) },
  passo: { flexDirection: 'row', gap: 16 },
  numero: { fontFamily: fontes.display, fontSize: 30, lineHeight: 32, color: cores.folha300, width: 22 },
  passoTexto: { flex: 1, gap: 2 },
  rodape: { gap: 6 },
})
