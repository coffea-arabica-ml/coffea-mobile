import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Image } from 'expo-image'
import * as Haptics from 'expo-haptics'
import { ArrowRight, CircleCheck, History, Trash2, TriangleAlert } from 'lucide-react-native'
import Animated, { FadeOut, LinearTransition, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import type { ItemHistorico } from '../api'
import { surgir } from '../components/animacoes'
import { Botao } from '../components/Botao'
import { formatarData } from '../components/formatos'
import { TelaHub, Titulo } from '../components/TelaHub'
import { Texto } from '../components/Texto'
import { useToast } from '../components/Toast'
import { estaSaudavel } from '../domain/analise'
import { resumoCurto } from '../domain/resumo'
import type { PropsAba } from '../navigation/tipos'
import { useHistorico } from '../state/Historico'
import { useSessaoAnalise } from '../state/SessaoAnalise'
import { cores, raios, sombras } from '../theme'

/** T10 — análises salvas; abrir uma leva ao Resumo técnico sem reprocessar. */
export function AbaHistorico({ navigation, route }: PropsAba<'Historico'>) {
  const { itens, carregar, excluir } = useHistorico()
  const { abrirAnalise, desvincularDoHistorico } = useSessaoAnalise()
  const avisar = useToast()
  const rolagem = useRef<ScrollView>(null)
  const posicoes = useRef(new Map<string, number>())
  const [abrindo, setAbrindo] = useState<string | null>(null)
  // O destaque do card recém-salvo vale só para esta visita à aba.
  const [destacado, setDestacado] = useState<string | undefined>(route.params?.destacar)

  useEffect(() => {
    const id = route.params?.destacar
    if (!id) return
    setDestacado(id)
    navigation.setParams({ destacar: undefined })
    // Espera o card entrar na lista antes de rolar até ele.
    const timer = setTimeout(() => {
      const y = posicoes.current.get(id)
      if (y !== undefined) rolagem.current?.scrollTo({ y: Math.max(0, y - 80), animated: true })
    }, 350)
    return () => clearTimeout(timer)
  }, [route.params?.destacar, navigation])

  useFocusEffect(useCallback(() => () => setDestacado(undefined), []))

  async function abrir(id: string) {
    setAbrindo(id)
    const carregada = await carregar(id)
    setAbrindo(null)
    if (!carregada) {
      avisar('Não foi possível abrir esta análise.')
      return
    }
    abrirAnalise(carregada)
    navigation.navigate('Resumo')
  }

  function confirmarExclusao(item: ItemHistorico) {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    Alert.alert('Excluir análise?', `“${item.titulo}” será removida do histórico deste aparelho. Não dá para desfazer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            // A análise em foco pode ser justamente a excluída: ela continua na tela e volta a poder ser salva.
            desvincularDoHistorico(item.id)
            await excluir(item.id)
            avisar(`“${item.titulo}” foi excluída.`)
          } catch {
            avisar('Não foi possível excluir agora. Tente de novo.')
          }
        },
      },
    ])
  }

  return (
    <TelaHub ref={rolagem}>
      <View style={estilos.topo}>
        <View style={estilos.topoTitulo}>
          <Titulo sobretitulo="Histórico">Análises salvas</Titulo>
        </View>
        {itens && itens.length > 0 ? (
          <Texto tipo="pequeno" cor={cores.tintaSuave} numeros>
            {itens.length === 1 ? '1 análise' : `${itens.length} análises`}
          </Texto>
        ) : null}
      </View>

      {itens === null ? (
        <Esqueleto />
      ) : itens.length === 0 ? (
        <Vazio aoComecar={() => navigation.navigate('Enviar')} />
      ) : (
        <View style={estilos.lista}>
          {itens.map((item, i) => (
            <Animated.View
              key={item.id}
              entering={surgir(Math.min(i, 8))}
              exiting={FadeOut.duration(200)}
              layout={LinearTransition.duration(260)}
              onLayout={(e) => posicoes.current.set(item.id, e.nativeEvent.layout.y)}
            >
              <Cartao
                item={item}
                destacado={item.id === destacado}
                carregando={abrindo === item.id}
                aoAbrir={() => void abrir(item.id)}
                aoExcluir={() => confirmarExclusao(item)}
              />
            </Animated.View>
          ))}
        </View>
      )}
    </TelaHub>
  )
}

interface PropsCartao {
  item: ItemHistorico
  destacado: boolean
  carregando: boolean
  aoAbrir: () => void
  aoExcluir: () => void
}

function Cartao({ item, destacado, carregando, aoAbrir, aoExcluir }: PropsCartao) {
  const saudavel = estaSaudavel(item.diagnostico)
  const Icone = saudavel ? CircleCheck : TriangleAlert
  const corStatus = saudavel ? cores.folha700 : cores.cereja700
  const resumo = resumoCurto(item.diagnostico)
  const data = formatarData(item.criadoEm, true)

  return (
    <View>
      <Pressable
        onPress={aoAbrir}
        onLongPress={aoExcluir}
        disabled={carregando}
        accessibilityRole="button"
        accessibilityLabel={`${item.titulo}: ${resumo}, ${data}`}
        accessibilityHint="Abre o resumo técnico desta análise"
        accessibilityActions={[{ name: 'delete', label: 'Excluir análise' }]}
        onAccessibilityAction={(e) => e.nativeEvent.actionName === 'delete' && aoExcluir()}
        style={({ pressed }) => [
          estilos.cartao,
          destacado && estilos.cartaoDestacado,
          pressed && { transform: [{ scale: 0.985 }] },
          carregando && { opacity: 0.7 },
        ]}
      >
        <View style={estilos.cartaoTexto}>
          <Texto tipo="tituloCartao" numberOfLines={1} style={estilos.cartaoTitulo}>
            {item.titulo}
          </Texto>
          <View style={estilos.status}>
            <Icone size={15} color={corStatus} />
            <Texto tipo="pequeno" cor={corStatus} numberOfLines={1} style={estilos.flex}>
              {resumo}
            </Texto>
          </View>
          <View style={estilos.rodapeCartao}>
            <Texto tipo="legenda" cor={cores.tintaFraca} numeros>
              {data}
            </Texto>
            {carregando ? <ActivityIndicator size="small" color={cores.folha700} /> : <ArrowRight size={15} color={cores.folha700} />}
          </View>
        </View>
        <View style={[estilos.miniaturaAnel, { borderColor: saudavel ? cores.folha500 : cores.cereja500 }]}>
          <Image source={{ uri: item.diagnostico.imagemUri }} style={estilos.miniatura} contentFit="cover" transition={200} recyclingKey={item.id} />
        </View>
      </Pressable>
      {/* Fora do cartão: um botão não pode ficar dentro de outro. */}
      <Pressable
        onPress={aoExcluir}
        accessibilityRole="button"
        accessibilityLabel={`Excluir ${item.titulo}`}
        hitSlop={8}
        style={({ pressed }) => [estilos.excluir, pressed && { backgroundColor: cores.cereja50 }]}
      >
        <Trash2 size={16} color={cores.tintaSuave} />
      </Pressable>
    </View>
  )
}

function Esqueleto() {
  const pulso = useSharedValue(0.5)
  useEffect(() => {
    pulso.value = withRepeat(withTiming(1, { duration: 700 }), -1, true)
  }, [pulso])
  const estilo = useAnimatedStyle(() => ({ opacity: pulso.value }))
  return (
    <View style={estilos.lista} accessible accessibilityLabel="Carregando histórico">
      {[0, 1, 2].map((i) => (
        <Animated.View key={i} style={[estilos.esqueleto, estilo]} />
      ))}
    </View>
  )
}

function Vazio({ aoComecar }: { aoComecar: () => void }) {
  return (
    <Animated.View entering={surgir(1)} style={estilos.vazio}>
      <View style={estilos.vazioIcone}>
        <History size={28} color={cores.folha600} />
      </View>
      <Texto tipo="tituloCartao" style={estilos.centro}>
        Nenhuma análise salva ainda
      </Texto>
      <Texto cor={cores.tintaSuave} style={estilos.centro}>
        Depois de analisar uma foto, use “Salvar análise” para guardá-la aqui e consultar quando quiser.
      </Texto>
      <Botao titulo="Fazer uma análise" variante="primario" icone={ArrowRight} iconeDepois aoPressionar={aoComecar} style={estilos.vazioBotao} />
    </Animated.View>
  )
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  centro: { textAlign: 'center' },
  topo: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  topoTitulo: { flex: 1 },
  lista: { gap: 14 },
  cartao: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 14,
    padding: 14,
    borderRadius: raios.cartao,
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.linha,
    boxShadow: sombras.cartao,
  },
  cartaoDestacado: { borderWidth: 2, borderColor: cores.folha500, backgroundColor: cores.folha50 },
  cartaoTexto: { flex: 1, gap: 6 },
  cartaoTitulo: { paddingRight: 4 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rodapeCartao: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 },
  miniaturaAnel: { alignSelf: 'center', padding: 2, borderWidth: 2, borderRadius: 20 },
  miniatura: { width: 84, height: 84, borderRadius: 16, backgroundColor: cores.papel2 },
  excluir: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.superficie,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: cores.linha,
    boxShadow: sombras.cartao,
  },
  esqueleto: { height: 116, borderRadius: raios.cartao, backgroundColor: cores.papel2 },
  vazio: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 44,
    borderRadius: raios.cartao,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: cores.linha,
  },
  vazioIcone: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.folha50,
    marginBottom: 6,
  },
  vazioBotao: { marginTop: 8 },
})
