import { useEffect, useRef, useState } from 'react'
import { KeyboardAvoidingView, Pressable, StyleSheet, TextInput, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { BookmarkPlus } from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Botao } from '../components/Botao'
import { Texto } from '../components/Texto'
import { useToast } from '../components/Toast'
import type { PropsRaiz } from '../navigation/tipos'
import { useHistorico } from '../state/Historico'
import { useSessaoAnalise, type AnaliseAtual } from '../state/SessaoAnalise'
import { comAlfa, cores, curvas, fontes, raios, sombras } from '../theme'

const LIMITE_TITULO = 60

function tituloSugerido(analise: AnaliseAtual) {
  const quando = new Date(analise.realizadaEm).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
  return `Cafeeiro · ${quando}`
}

/** T9 — dar um título à análise antes de guardá-la no histórico deste aparelho. */
export function ModalSalvarAnalise({ navigation }: PropsRaiz<'SalvarAnalise'>) {
  const { analise, marcarComoSalva } = useSessaoAnalise()
  const { salvar } = useHistorico()
  const avisar = useToast()
  const { bottom } = useSafeAreaInsets()
  const campo = useRef<TextInput>(null)
  const [titulo, setTitulo] = useState(() => (analise ? tituloSugerido(analise) : ''))
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // O teclado abre sozinho; no Android o autoFocus às vezes chega antes do fim da transição.
  useEffect(() => {
    const timer = setTimeout(() => campo.current?.focus(), 300)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!analise) navigation.goBack()
  }, [analise, navigation])
  if (!analise) return null

  async function confirmar() {
    const limpo = titulo.trim()
    if (!limpo) {
      setErro('Dê um título para encontrar esta análise depois.')
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return
    }
    if (!analise) return
    setSalvando(true)
    try {
      const id = await salvar(analise, limpo)
      marcarComoSalva(id)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      avisar('Análise salva no histórico.')
      navigation.popTo('Hub', { screen: 'Historico', params: { destacar: id } })
    } catch {
      setErro('Não foi possível salvar agora. Tente de novo.')
      setSalvando(false)
    }
  }

  return (
    // Com o edge-to-edge (obrigatório no SDK 54) a janela do Android não encolhe com o teclado:
    // "padding" é o comportamento certo nas duas plataformas.
    <KeyboardAvoidingView style={estilos.tela} behavior="padding">
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => !salvando && navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Fechar sem salvar"
      />
      <Animated.View
        entering={FadeInDown.duration(320).easing(curvas.surgir)}
        style={[estilos.cartao, { marginBottom: Math.max(bottom, 12) }]}
        accessibilityViewIsModal
      >
        <View style={estilos.cabecalho}>
          <View style={estilos.icone}>
            <BookmarkPlus size={20} color={cores.folha700} />
          </View>
          <Texto tipo="tituloCartao" accessibilityRole="header">
            Salvar análise
          </Texto>
        </View>

        <View style={estilos.campoGrupo}>
          <Texto tipo="pequeno" peso="medio" nativeID="rotulo-titulo">
            Título da análise
          </Texto>
          <TextInput
            ref={campo}
            value={titulo}
            onChangeText={(texto) => {
              setTitulo(texto)
              setErro(null)
            }}
            autoFocus
            selectTextOnFocus
            maxLength={LIMITE_TITULO}
            returnKeyType="done"
            onSubmitEditing={() => void confirmar()}
            editable={!salvando}
            accessibilityLabelledBy="rotulo-titulo"
            accessibilityLabel="Título da análise"
            accessibilityHint={erro ?? undefined}
            placeholder="Ex.: Talhão 3 — pé perto da cerca"
            placeholderTextColor={cores.tintaFraca}
            cursorColor={cores.folha700}
            selectionColor={comAlfa(cores.folha500, 0.35)}
            style={[estilos.campo, erro ? estilos.campoErro : null]}
          />
          <Texto tipo="pequeno" cor={erro ? cores.cereja700 : cores.tintaFraca} accessibilityLiveRegion="polite">
            {erro ?? 'Ex.: “Talhão 3 — pé perto da cerca”. Fica guardada neste aparelho.'}
          </Texto>
        </View>

        <View style={estilos.acoes}>
          <Botao titulo="Cancelar" variante="fantasma" desabilitado={salvando} aoPressionar={() => navigation.goBack()} />
          <Botao titulo="Salvar" variante="primario" icone={BookmarkPlus} carregando={salvando} aoPressionar={() => void confirmar()} />
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  )
}

const estilos = StyleSheet.create({
  tela: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 12, backgroundColor: comAlfa(cores.tinta, 0.45) },
  cartao: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 480,
    gap: 20,
    padding: 22,
    borderRadius: 28,
    backgroundColor: cores.superficie,
    boxShadow: sombras.flutuante,
  },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.folha50,
  },
  campoGrupo: { gap: 8 },
  campo: {
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: raios.campo,
    borderWidth: 1.5,
    borderColor: cores.linha,
    backgroundColor: cores.papel,
    color: cores.tinta,
    fontFamily: fontes.texto,
    fontSize: 16,
  },
  campoErro: { borderColor: cores.cereja500 },
  acoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
})
