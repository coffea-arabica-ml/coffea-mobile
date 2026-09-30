import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { FlatList, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { ChevronLeft, ChevronRight, HeartPulse, ShieldCheck, Stethoscope, type LucideIcon } from 'lucide-react-native'
import Animated from 'react-native-reanimated'
import type { FolhaDiagnostico } from '../../api'
import { surgir } from '../../components/animacoes'
import { Botao } from '../../components/Botao'
import { BotaoSalvarAnalise } from '../../components/BotaoSalvarAnalise'
import { Lente } from '../../components/Lente'
import { NumeroFolha } from '../../components/LinhaFolha'
import { MedidorSeveridade } from '../../components/MedidorSeveridade'
import { Texto } from '../../components/Texto'
import { CATEGORIAS } from '../../content/categorias'
import { AVISO_AGRONOMICO } from '../../content/textos'
import { problemasDe } from '../../domain/analise'
import type { PropsVisualizacao } from '../../navigation/tipos'
import { useExigeAnalise } from '../../navigation/useExigeAnalise'
import type { AnaliseAtual } from '../../state/SessaoAnalise'
import { cores, LARGURA_CONTEUDO, MARGEM, raios } from '../../theme'

/** T8 — um problema de perto: a folha ampliada, o que é, como cuidar e como prevenir. */
export function DetalheProblema({ navigation, route }: PropsVisualizacao<'DetalheProblema'>) {
  const analise = useExigeAnalise()
  const { width } = useWindowDimensions()
  const lista = useRef<FlatList<FolhaDiagnostico>>(null)
  const problemas = useMemo(() => (analise ? problemasDe(analise.diagnostico) : []), [analise])
  const indiceDaRota = problemas.findIndex((f) => f.id === route.params.folhaId)
  const [indice, setIndice] = useState(Math.max(0, indiceDaRota))
  // Só a folha que foi tocada abre com o zoom; as vizinhas já aparecem enquadradas.
  const [indiceTocado] = useState(indiceDaRota)

  // Folha que não existe mais nesta análise: volta para a lista.
  useEffect(() => {
    if (analise && indiceDaRota === -1) navigation.popToTop()
  }, [analise, indiceDaRota, navigation])

  useLayoutEffect(() => {
    navigation.setOptions({ title: problemas.length > 1 ? `Folha ${indice + 1} de ${problemas.length}` : '' })
  }, [navigation, indice, problemas.length])

  if (!analise || indiceDaRota === -1) return null

  function irPara(i: number) {
    lista.current?.scrollToIndex({ index: i, animated: true })
  }

  return (
    <FlatList
      ref={lista}
      data={problemas}
      keyExtractor={(f) => f.id}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      initialScrollIndex={indiceDaRota}
      getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
      onMomentumScrollEnd={(e) => {
        const novo = Math.round(e.nativeEvent.contentOffset.x / width)
        if (novo === indice || !problemas[novo]) return
        setIndice(novo)
        navigation.setParams({ folhaId: problemas[novo].id })
        void Haptics.selectionAsync()
      }}
      renderItem={({ item, index }) => (
        <PaginaFolha
          analise={analise}
          folha={item}
          numero={index + 1}
          total={problemas.length}
          largura={width}
          animarEntrada={index === indiceTocado}
          aoAnterior={index > 0 ? () => irPara(index - 1) : undefined}
          aoProxima={index < problemas.length - 1 ? () => irPara(index + 1) : undefined}
        />
      )}
    />
  )
}

interface PropsPagina {
  analise: AnaliseAtual
  folha: FolhaDiagnostico
  numero: number
  total: number
  largura: number
  animarEntrada: boolean
  aoAnterior?: () => void
  aoProxima?: () => void
}

function PaginaFolha({ analise, folha, numero, total, largura, animarEntrada, aoAnterior, aoProxima }: PropsPagina) {
  const info = CATEGORIAS[folha.categoria]
  const diametro = Math.min(largura * 0.7, 320)
  const secoes: { titulo: string; Icone: LucideIcon; texto: string }[] = [
    { titulo: 'O que é', Icone: Stethoscope, texto: info.sintomas },
    { titulo: 'Como cuidar', Icone: HeartPulse, texto: folha.comoCuidar ?? info.comoCuidar },
    { titulo: 'Como prevenir', Icone: ShieldCheck, texto: folha.comoPrevenir ?? info.comoPrevenir },
  ]

  return (
    <ScrollView style={{ width: largura }} contentContainerStyle={estilos.pagina}>
      <View style={estilos.lente}>
        <Lente
          uri={analise.diagnostico.imagemUri}
          rotuloAcessivel={`Folha ${numero} ampliada`}
          largura={analise.imagem.largura}
          altura={analise.imagem.altura}
          regiao={folha.regiao}
          cor={info.cor}
          diametro={diametro}
          animarEntrada={animarEntrada}
        />
        {!folha.regiao ? (
          <Texto tipo="pequeno" cor={cores.tintaFraca} style={estilos.centro}>
            Localização indisponível — mostrando a foto inteira.
          </Texto>
        ) : null}
      </View>

      <Animated.View entering={animarEntrada ? surgir(3) : undefined} style={estilos.grupo}>
        <View style={estilos.contagem}>
          <NumeroFolha numero={numero} cor={info.cor} tamanho={24} />
          <Texto tipo="sobretitulo" cor={cores.tintaSuave} numeros>
            Folha {numero} de {total}
          </Texto>
        </View>
        <Texto tipo="titulo" accessibilityRole="header">
          {info.nomeCompleto}
        </Texto>
        {info.agente ? (
          <Texto cor={cores.tintaSuave}>
            Causada pelo {info.tipoAgente}{' '}
            <Texto italico cor={cores.tintaSuave}>
              {info.agente}
            </Texto>
          </Texto>
        ) : null}
        <View style={estilos.severidade}>
          <Texto tipo="pequeno" cor={cores.tintaFraca}>
            Severidade estimada
          </Texto>
          <MedidorSeveridade nivel={folha.severidade} />
        </View>
      </Animated.View>

      {secoes.map(({ titulo, Icone, texto }, i) => (
        <Animated.View key={titulo} entering={animarEntrada ? surgir(4 + i) : undefined} style={estilos.secao}>
          <View style={estilos.secaoTitulo}>
            <Icone size={20} color={cores.folha600} />
            <Texto tipo="tituloCartao" accessibilityRole="header">
              {titulo}
            </Texto>
          </View>
          <Texto cor={cores.tintaSuave}>{texto}</Texto>
        </Animated.View>
      ))}

      {total > 1 ? (
        <View style={estilos.navegacao}>
          {aoAnterior ? (
            <Botao titulo={`Folha ${numero - 1}`} icone={ChevronLeft} variante="fantasma" rotuloAcessivel="Folha anterior" aoPressionar={aoAnterior} />
          ) : (
            <View />
          )}
          {aoProxima ? (
            <Botao titulo={`Folha ${numero + 1}`} icone={ChevronRight} iconeDepois variante="fantasma" rotuloAcessivel="Próxima folha" aoPressionar={aoProxima} />
          ) : null}
        </View>
      ) : null}

      <BotaoSalvarAnalise />
      <Texto tipo="legenda" cor={cores.tintaFraca}>
        {AVISO_AGRONOMICO}
      </Texto>
    </ScrollView>
  )
}

const estilos = StyleSheet.create({
  pagina: {
    width: '100%',
    maxWidth: LARGURA_CONTEUDO + 2 * MARGEM,
    alignSelf: 'center',
    paddingHorizontal: MARGEM,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 24,
  },
  lente: { gap: 18, paddingTop: 12, alignItems: 'center' },
  centro: { textAlign: 'center' },
  grupo: { gap: 10 },
  contagem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  severidade: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: raios.pilula,
    backgroundColor: cores.superficie,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: cores.linha,
  },
  secao: { gap: 8 },
  secaoTitulo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navegacao: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: cores.linha,
  },
})
