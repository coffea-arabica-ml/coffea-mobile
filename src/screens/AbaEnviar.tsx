import { useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native'
import { Image } from 'expo-image'
import * as Haptics from 'expo-haptics'
import * as ImagePicker from 'expo-image-picker'
import {
  ArrowRight,
  CircleCheck,
  CloudOff,
  FileX2,
  Focus,
  RotateCcw,
  ScanSearch,
  SearchX,
  Sprout,
  Weight,
  type LucideIcon,
} from 'lucide-react-native'
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { LIMITES, origemDoPacote, type TipoErroUpload } from '../api'
import { surgir } from '../components/animacoes'
import { Botao } from '../components/Botao'
import { formatarBytes } from '../components/formatos'
import { IlustracaoEnquadramento } from '../components/IlustracaoEnquadramento'
import { MolduraImagem } from '../components/MolduraImagem'
import { RotuloStatus } from '../components/RotuloStatus'
import { origemDoPicker, SeletorImagem } from '../components/SeletorImagem'
import { TelaHub, Titulo } from '../components/TelaHub'
import { Texto } from '../components/Texto'
import { useToast } from '../components/Toast'
import { VarreduraLente } from '../components/VarreduraLente'
import { CAPTURA, ERROS } from '../content/textos'
import { estaSaudavel } from '../domain/analise'
import { resumirDiagnostico } from '../domain/resumo'
import type { PropsAba } from '../navigation/tipos'
import { useSessaoAnalise, type AnaliseAtual, type EstadoSessao, type FalhaAnalise } from '../state/SessaoAnalise'
import { comAlfa, cores, curvas, duracoes, raios } from '../theme'

const ICONES_ERRO: Record<TipoErroUpload, LucideIcon> = {
  planta_nao_identificada: SearchX,
  formato_invalido: FileX2,
  especie_incorreta: Sprout,
  arquivo_muito_grande: Weight,
  baixa_confianca: Focus,
  erro_desconhecido: CloudOff,
}

const EXEMPLOS = [
  { modulo: require('../assets/exemplos/planta-cafe-doente.jpg'), nome: 'planta-cafe-doente.jpg', rotulo: 'Com sinais' },
  { modulo: require('../assets/exemplos/planta-cafe-saudavel.jpg'), nome: 'planta-cafe-saudavel.jpg', rotulo: 'Saudável' },
] as const

/** Vibração e anúncio para leitores de tela quando o resultado chega (a análise pode levar segundos). */
function useRetornoDoResultado(estado: EstadoSessao) {
  const anterior = useRef(estado)
  useEffect(() => {
    const antes = anterior.current
    anterior.current = estado
    if (antes === estado) return
    if (estado.fase === 'sucesso' && antes.fase === 'enviando') {
      const saudavel = estaSaudavel(estado.analise.diagnostico)
      void Haptics.notificationAsync(saudavel ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning)
      AccessibilityInfo.announceForAccessibility(`Análise concluída. ${resumirDiagnostico(estado.analise.diagnostico).titulo}`)
    } else if (estado.fase === 'erro') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      AccessibilityInfo.announceForAccessibility(`Não foi possível analisar. ${ERROS[estado.erro.tipo].titulo}`)
    }
  }, [estado])
}

/** T2 a T5: estado vazio, carregamento, sucesso e erros — todos na mesma aba, como no web. */
export function AbaEnviar({ navigation }: PropsAba<'Enviar'>) {
  const { estado, enviarFoto } = useSessaoAnalise()
  const rolagem = useRef<ScrollView>(null)
  useRetornoDoResultado(estado)

  // Android pode encerrar o app enquanto a câmera está aberta (celulares com pouca memória):
  // ao voltar, a foto tirada fica pendente e é analisada aqui.
  useEffect(() => {
    if (Platform.OS !== 'android') return
    void ImagePicker.getPendingResultAsync().then((resultado) => {
      if (resultado && 'assets' in resultado && !resultado.canceled && resultado.assets?.[0]) {
        void enviarFoto(origemDoPicker(resultado.assets[0]))
      }
    })
  }, [enviarFoto])

  useEffect(() => {
    rolagem.current?.scrollTo({ y: 0, animated: true })
  }, [estado.fase])

  const chave = estado.fase === 'sucesso' ? `sucesso-${estado.analise.id}` : estado.fase

  return (
    <TelaHub ref={rolagem}>
      <View key={chave} style={estilos.bloco}>
        {estado.fase === 'vazia' && <EstadoVazio />}
        {estado.fase === 'enviando' && <EstadoEnviando previewUri={estado.previewUri} lento={estado.lento} />}
        {estado.fase === 'sucesso' && (
          <EstadoSucesso
            analise={estado.analise}
            aoAbrirResumo={() => navigation.navigate('Resumo')}
            aoAbrirVisualizacao={() => navigation.navigate('Visualizacao', { screen: 'VisualizacaoLista' })}
          />
        )}
        {estado.fase === 'erro' && <EstadoErro falha={estado} />}
      </View>
    </TelaHub>
  )
}

function useAlturaFoto(fracao: number) {
  const { height } = useWindowDimensions()
  return Math.round(height * fracao)
}

function EstadoVazio() {
  const { enviarFoto } = useSessaoAnalise()
  const avisar = useToast()
  const [carregando, setCarregando] = useState<string | null>(null)

  async function usarExemplo(modulo: number, nome: string) {
    setCarregando(nome)
    try {
      await enviarFoto(await origemDoPacote(modulo, nome))
    } catch {
      avisar('Não foi possível abrir a foto de exemplo.')
    } finally {
      setCarregando(null)
    }
  }

  return (
    <>
      <Animated.View entering={surgir(0)} style={estilos.visor}>
        <View style={estilos.visorCirculo} />
        <IlustracaoEnquadramento altura={150} />
        <Texto tipo="pequeno" cor={cores.tintaSuave} style={estilos.centro}>
          {LIMITES.formatosRotulo}, até {LIMITES.tamanhoMaximoRotulo} · uma foto por vez
        </Texto>
      </Animated.View>

      <Animated.View entering={surgir(1)} style={estilos.grupo}>
        <Titulo sobretitulo="Novo diagnóstico">Envie uma foto do seu cafeeiro</Titulo>
        <Texto tipo="corpoGrande" cor={cores.tintaSuave}>
          {CAPTURA.instrucao}
        </Texto>
        <View style={estilos.dicas}>
          {CAPTURA.dicas.map((dica) => (
            <View key={dica} style={estilos.dica}>
              <CircleCheck size={17} color={cores.folha500} />
              <Texto tipo="pequeno">{dica}</Texto>
            </View>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={surgir(2)}>
        <SeletorImagem />
      </Animated.View>

      <Animated.View entering={surgir(3)} style={[estilos.grupo, estilos.divisoria]}>
        <Texto tipo="pequeno" cor={cores.tintaSuave}>
          Sem uma foto agora? Experimente com um exemplo:
        </Texto>
        <View style={estilos.exemplos}>
          {EXEMPLOS.map((ex) => (
            <Pressable
              key={ex.nome}
              onPress={() => void usarExemplo(ex.modulo, ex.nome)}
              disabled={carregando !== null}
              accessibilityRole="button"
              accessibilityLabel={`Analisar a foto de exemplo: planta ${ex.rotulo.toLowerCase()}`}
              style={({ pressed }) => [estilos.exemplo, pressed && { borderColor: cores.folha300, backgroundColor: cores.folha50 }]}
            >
              <Image source={ex.modulo} style={estilos.exemploFoto} contentFit="cover" />
              <View>
                <Texto tipo="pequeno" peso="medio">
                  {ex.rotulo}
                </Texto>
                <Texto tipo="legenda" cor={cores.tintaFraca}>
                  {carregando === ex.nome ? 'Abrindo…' : 'Exemplo'}
                </Texto>
              </View>
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </>
  )
}

/** Barra indeterminada (animação `barra` do web). */
function BarraProgresso() {
  const [largura, setLargura] = useState(0)
  const semMovimento = useReducedMotion()
  // Com "Remover animações", a barra fica parada num ponto visível em vez de deslizar.
  const progresso = useSharedValue(semMovimento ? 0.5 : 0)
  useEffect(() => {
    if (semMovimento) return
    progresso.value = withRepeat(withTiming(1, { duration: duracoes.barra, easing: curvas.suave }), -1, false)
  }, [progresso, semMovimento])
  const estilo = useAnimatedStyle(() => ({
    transform: [{ translateX: -largura / 3 + progresso.value * (largura + largura / 3) }],
  }))
  return (
    <View style={estilos.trilho} onLayout={(e) => setLargura(e.nativeEvent.layout.width)}>
      <Animated.View style={[estilos.barra, { width: largura / 3 }, estilo]} />
    </View>
  )
}

function EstadoEnviando({ previewUri, lento }: { previewUri: string; lento: boolean }) {
  const { cancelar } = useSessaoAnalise()
  const alturaFoto = useAlturaFoto(0.5)
  return (
    <>
      <Animated.View entering={surgir(0)}>
        <MolduraImagem uri={previewUri} rotuloAcessivel="Foto enviada, em análise" proporcao={4 / 5} alturaMaxima={alturaFoto}>
          {(largura, altura) => <VarreduraLente largura={largura} altura={altura} />}
        </MolduraImagem>
      </Animated.View>

      <Animated.View entering={surgir(1)} style={estilos.grupo} accessibilityLiveRegion="polite">
        <Titulo sobretitulo="Em análise" iconeSobretitulo={ScanSearch}>
          Analisando as folhas…
        </Titulo>
        <Texto tipo="corpoGrande" cor={cores.tintaSuave}>
          {lento
            ? 'Está levando mais tempo que o normal, mas continuamos trabalhando. Você pode aguardar ou cancelar.'
            : 'Estamos localizando cada folha e procurando sinais de estresse. Isso costuma levar poucos segundos.'}
        </Texto>
        <BarraProgresso />
      </Animated.View>

      <Animated.View entering={surgir(2)} style={estilos.esquerda}>
        <Botao titulo="Cancelar" variante="fantasma" aoPressionar={cancelar} dica="Interrompe a análise e volta ao estado anterior" />
      </Animated.View>
    </>
  )
}

function EstadoSucesso({
  analise,
  aoAbrirResumo,
  aoAbrirVisualizacao,
}: {
  analise: AnaliseAtual
  aoAbrirResumo: () => void
  aoAbrirVisualizacao: () => void
}) {
  const saudavel = estaSaudavel(analise.diagnostico)
  const resumo = resumirDiagnostico(analise.diagnostico)
  const alturaFoto = useAlturaFoto(0.52)
  return (
    <>
      <Animated.View entering={surgir(0)} style={estilos.grupoFoto}>
        <MolduraImagem
          uri={analise.diagnostico.imagemUri}
          rotuloAcessivel={`Foto analisada: ${resumo.status}`}
          status={saudavel ? 'saudavel' : 'problema'}
          proporcao={analise.imagem.largura / analise.imagem.altura}
          alturaMaxima={alturaFoto}
          aoPressionar={aoAbrirResumo}
          dica="Abre o resumo técnico"
        />
        <RotuloStatus saudavel={saudavel} texto={resumo.status} />
      </Animated.View>

      <Animated.View entering={surgir(1)} style={estilos.grupo}>
        <Titulo sobretitulo="Análise concluída">{resumo.titulo}</Titulo>
        <Texto tipo="corpoGrande" cor={cores.tintaSuave}>
          {resumo.paragrafo}
        </Texto>
      </Animated.View>

      <Animated.View entering={surgir(2)} style={estilos.acoes}>
        <Botao titulo="Ver resumo técnico" variante="primario" icone={ArrowRight} iconeDepois aoPressionar={aoAbrirResumo} />
        <Botao titulo="Visualização avançada" variante="fantasma" aoPressionar={aoAbrirVisualizacao} />
      </Animated.View>

      <Animated.View entering={surgir(3)} style={[estilos.grupo, estilos.divisoria]}>
        <Texto tipo="pequeno" cor={cores.tintaSuave}>
          Quer analisar outra planta?
        </Texto>
        <SeletorImagem enfase="discreto" />
      </Animated.View>
    </>
  )
}

function EstadoErro({ falha }: { falha: FalhaAnalise }) {
  const { tentarNovamente } = useSessaoAnalise()
  const { tipo, mensagem } = falha.erro
  const texto = ERROS[tipo]
  const Icone = ICONES_ERRO[tipo]
  const desconhecido = tipo === 'erro_desconhecido'
  const podeTentarDeNovo = desconhecido && falha.imagem !== null
  const detalhes = [falha.nomeArquivo, falha.tamanhoBytes !== null ? formatarBytes(falha.tamanhoBytes) : null].filter(Boolean).join(' · ')

  return (
    <>
      <Animated.View entering={surgir(0)} style={estilos.cartaoErro}>
        {falha.previewUri ? (
          <Image source={{ uri: falha.previewUri }} style={[StyleSheet.absoluteFill, estilos.fantasma]} contentFit="cover" blurRadius={4} />
        ) : null}
        <View style={estilos.iconeErro}>
          <Icone size={36} color={cores.cereja600} strokeWidth={1.6} />
        </View>
        <Texto tipo="tituloCartao" cor={cores.cereja700} style={estilos.centro}>
          {texto.rotulo}
        </Texto>
        <View style={estilos.arquivo}>
          <Texto tipo="legenda" cor={cores.tintaSuave} numberOfLines={1}>
            {detalhes}
          </Texto>
        </View>
      </Animated.View>

      <Animated.View entering={surgir(1)} style={estilos.grupo} accessibilityRole="alert">
        <Titulo sobretitulo="Não foi possível analisar">{texto.titulo}</Titulo>
        <Texto tipo="corpoGrande" cor={cores.tintaSuave}>
          {/* A verificação local diz qual formato recebeu (ex.: GIF); é mais útil que o texto genérico. */}
          {tipo === 'formato_invalido' && mensagem ? mensagem : texto.explicacao}
        </Texto>
        <Texto tipo="corpo" peso="medio">
          {texto.sugestao}
        </Texto>
      </Animated.View>

      <Animated.View entering={surgir(2)} style={estilos.acoes}>
        {podeTentarDeNovo ? (
          <Botao titulo="Tentar de novo" variante="primario" icone={RotateCcw} aoPressionar={tentarNovamente} dica="Reenvia a mesma foto" />
        ) : null}
        <SeletorImagem enfase={podeTentarDeNovo ? 'discreto' : 'principal'} />
      </Animated.View>
    </>
  )
}

const estilos = StyleSheet.create({
  bloco: { gap: 26 },
  grupo: { gap: 14 },
  grupoFoto: { gap: 16 },
  acoes: { gap: 12 },
  esquerda: { alignItems: 'flex-start', marginLeft: -12 },
  centro: { textAlign: 'center' },
  divisoria: { paddingTop: 22, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: cores.linha },
  visor: {
    aspectRatio: 4 / 3,
    maxHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 18,
    overflow: 'hidden',
    borderRadius: raios.cartao,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: cores.folha300,
    backgroundColor: comAlfa(cores.superficie, 0.7),
  },
  visorCirculo: {
    position: 'absolute',
    right: -70,
    bottom: -70,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: cores.folha50,
  },
  dicas: { gap: 9 },
  dica: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  exemplos: { flexDirection: 'row', gap: 12 },
  exemplo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 6,
    paddingRight: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: cores.linha,
    backgroundColor: cores.superficie,
  },
  exemploFoto: { width: 48, height: 48, borderRadius: 13 },
  trilho: { height: 6, maxWidth: 360, borderRadius: 3, overflow: 'hidden', backgroundColor: cores.papel2 },
  barra: { height: 6, borderRadius: 3, backgroundColor: cores.folha500 },
  cartaoErro: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 22,
    overflow: 'hidden',
    borderRadius: raios.cartao,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: cores.cereja500,
    backgroundColor: cores.superficie,
  },
  fantasma: { opacity: 0.14 },
  iconeErro: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.cereja50,
    boxShadow: `0px 0px 0px 8px ${comAlfa(cores.cereja50, 0.5)}`,
  },
  arquivo: { maxWidth: '100%', paddingHorizontal: 12, paddingVertical: 4, borderRadius: raios.pilula, backgroundColor: cores.papel },
})
