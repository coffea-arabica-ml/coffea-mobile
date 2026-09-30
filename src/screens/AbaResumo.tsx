import { StyleSheet, useWindowDimensions, View } from 'react-native'
import { ArrowRight } from 'lucide-react-native'
import Animated from 'react-native-reanimated'
import { surgir } from '../components/animacoes'
import { Botao } from '../components/Botao'
import { BotaoSalvarAnalise } from '../components/BotaoSalvarAnalise'
import { formatarData } from '../components/formatos'
import { LinhaFolha } from '../components/LinhaFolha'
import { MolduraImagem } from '../components/MolduraImagem'
import { RotuloStatus } from '../components/RotuloStatus'
import { SeletorImagem } from '../components/SeletorImagem'
import { TelaHub, Titulo } from '../components/TelaHub'
import { Texto } from '../components/Texto'
import { estaSaudavel, numerosDosProblemas, problemasDe } from '../domain/analise'
import { resumirDiagnostico } from '../domain/resumo'
import type { PropsAba } from '../navigation/tipos'
import { useExigeAnalise } from '../navigation/useExigeAnalise'
import { cores, raios, sombras } from '../theme'

/** T6 — resumo textual e ficha por folha, sem a complexidade da visualização avançada. */
export function AbaResumo({ navigation }: PropsAba<'Resumo'>) {
  const analise = useExigeAnalise()
  const { height } = useWindowDimensions()
  if (!analise) return null

  const { diagnostico } = analise
  const saudavel = estaSaudavel(diagnostico)
  const resumo = resumirDiagnostico(diagnostico)
  const problemas = problemasDe(diagnostico)
  const numeros = numerosDosProblemas(problemas)
  const saudaveis = diagnostico.folhas.length - problemas.length
  const abrirVisualizacao = () => navigation.navigate('Visualizacao', { screen: 'VisualizacaoLista' })

  return (
    <TelaHub key={analise.id}>
      <Animated.View entering={surgir(0)} style={estilos.grupoFoto}>
        <MolduraImagem
          uri={diagnostico.imagemUri}
          rotuloAcessivel={`Foto analisada: ${resumo.status}`}
          status={saudavel ? 'saudavel' : 'problema'}
          proporcao={analise.imagem.largura / analise.imagem.altura}
          alturaMaxima={Math.round(height * 0.42)}
          aoPressionar={abrirVisualizacao}
          dica="Abre a visualização avançada"
        />
        <RotuloStatus saudavel={saudavel} texto={resumo.status} />
      </Animated.View>

      <Animated.View entering={surgir(1)} style={estilos.grupo}>
        <Titulo sobretitulo="Resumo técnico">{resumo.titulo}</Titulo>
        <Texto tipo="corpoGrande" cor={cores.tintaSuave}>
          {resumo.paragrafo}
        </Texto>
      </Animated.View>

      {problemas.length > 0 && (
        // Sombra por fora, recorte por dentro: overflow hidden na mesma camada cortaria a sombra no iOS.
        <Animated.View entering={surgir(2)} style={estilos.cartaoSombra}>
          <View style={estilos.cartao}>
          <View style={estilos.cartaoCabecalho}>
            <Texto tipo="sobretitulo" cor={cores.tintaFraca} accessibilityRole="header">
              Diagnóstico por folha
            </Texto>
          </View>
          {problemas.map((folha, i) => (
            <View key={folha.id} style={i > 0 && estilos.separador}>
              <LinhaFolha
                numero={numeros.get(folha.id) ?? i + 1}
                folha={folha}
                rotulo="categoria"
                aoPressionar={() =>
                  navigation.navigate('Visualizacao', { screen: 'DetalheProblema', params: { folhaId: folha.id }, initial: false })
                }
              />
            </View>
          ))}
          {saudaveis > 0 && (
            <View style={estilos.saudaveis}>
              <Texto tipo="pequeno" cor={cores.folha700}>
                + {saudaveis === 1 ? '1 folha saudável' : `${saudaveis} folhas saudáveis`}
              </Texto>
            </View>
          )}
          </View>
        </Animated.View>
      )}

      <Animated.View entering={surgir(3)} style={estilos.meta}>
        <View style={estilos.metaItem}>
          <Texto tipo="pequeno" cor={cores.tintaFraca}>
            Analisada em
          </Texto>
          <Texto tipo="pequeno" numeros>
            {formatarData(analise.realizadaEm, true)}
          </Texto>
        </View>
        <View style={estilos.metaItem}>
          <Texto tipo="pequeno" cor={cores.tintaFraca}>
            Arquivo
          </Texto>
          <Texto tipo="pequeno" numberOfLines={1}>
            {analise.imagem.nomeArquivo}
          </Texto>
        </View>
      </Animated.View>

      <Animated.View entering={surgir(4)} style={estilos.acoes}>
        <Botao
          titulo={saudavel ? 'Ver orientações de cuidado' : 'Localizar na foto'}
          variante="primario"
          icone={ArrowRight}
          iconeDepois
          aoPressionar={abrirVisualizacao}
        />
        <BotaoSalvarAnalise />
      </Animated.View>

      <Animated.View entering={surgir(5)} style={[estilos.grupo, estilos.divisoria]}>
        <Texto tipo="pequeno" cor={cores.tintaSuave}>
          Nova análise
        </Texto>
        <SeletorImagem enfase="discreto" aoEscolher={() => navigation.navigate('Enviar')} />
      </Animated.View>
    </TelaHub>
  )
}

const estilos = StyleSheet.create({
  grupo: { gap: 14 },
  grupoFoto: { gap: 16 },
  acoes: { gap: 12 },
  divisoria: { paddingTop: 22, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: cores.linha },
  cartaoSombra: { borderRadius: raios.cartao, boxShadow: sombras.cartao },
  cartao: {
    overflow: 'hidden',
    borderRadius: raios.cartao,
    backgroundColor: cores.superficie,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: cores.linha,
  },
  cartaoCabecalho: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: cores.papel,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: cores.linha,
  },
  separador: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: cores.linha },
  saudaveis: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: cores.folha50,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: cores.linha,
  },
  meta: { flexDirection: 'row', gap: 16 },
  metaItem: { flex: 1, gap: 2 },
})
