import { useState } from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'
import { MapPinOff, Sprout } from 'lucide-react-native'
import Animated from 'react-native-reanimated'
import type { FolhaDiagnostico, RegiaoFolha } from '../../api'
import { surgir } from '../../components/animacoes'
import { BotaoSalvarAnalise } from '../../components/BotaoSalvarAnalise'
import { CirculoFolha } from '../../components/CirculoFolha'
import { LinhaFolha } from '../../components/LinhaFolha'
import { MolduraImagem } from '../../components/MolduraImagem'
import { TelaHub, Titulo } from '../../components/TelaHub'
import { Texto } from '../../components/Texto'
import { AVISO_AGRONOMICO } from '../../content/textos'
import { CATEGORIAS } from '../../content/categorias'
import { agruparPorCategoria, numerosDosProblemas, problemasDe } from '../../domain/analise'
import { variacaoVisualizacao } from '../../domain/visualizacao'
import type { PropsVisualizacao } from '../../navigation/tipos'
import { useExigeAnalise } from '../../navigation/useExigeAnalise'
import type { AnaliseAtual } from '../../state/SessaoAnalise'
import { cores, raios, sombras } from '../../theme'

const comRegiao = (f: FolhaDiagnostico): f is FolhaDiagnostico & { regiao: RegiaoFolha } => f.regiao !== undefined

/**
 * T7 — RF04: círculos tocáveis por categoria sobre a foto.
 * Degrada para lista quando as folhas não trazem `regiao` (pendência do RF09).
 */
export function VisualizacaoLista({ navigation }: PropsVisualizacao<'VisualizacaoLista'>) {
  const analise = useExigeAnalise()
  const { height } = useWindowDimensions()
  const [destacada, setDestacada] = useState<string | null>(null)
  if (!analise) return null

  const { diagnostico } = analise
  const variacao = variacaoVisualizacao(diagnostico)
  if (variacao === 'saudavel') return <EstadoSaudavel analise={analise} alturaFoto={Math.round(height * 0.5)} />

  const problemas = problemasDe(diagnostico)
  const numeros = numerosDosProblemas(problemas)
  const semRegiao = problemas.filter((f) => !f.regiao).length
  const abrir = (folha: FolhaDiagnostico) => navigation.push('DetalheProblema', { folhaId: folha.id })
  const destacar = (id: string) => (ativo: boolean) => setDestacada(ativo ? id : null)

  return (
    <TelaHub key={analise.id}>
      <Animated.View entering={surgir(0)} style={estilos.grupoFoto}>
        <MolduraImagem
          uri={diagnostico.imagemUri}
          rotuloAcessivel="Foto analisada com as folhas afetadas marcadas"
          status="problema"
          proporcao={analise.imagem.largura / analise.imagem.altura}
          alturaMaxima={Math.round(height * 0.58)}
        >
          {(largura, altura) =>
            problemas.filter(comRegiao).map((folha, i) => (
              <CirculoFolha
                key={folha.id}
                folha={folha}
                numero={numeros.get(folha.id) ?? i + 1}
                largura={largura}
                altura={altura}
                ordem={i}
                destacada={destacada === folha.id}
                outraDestacada={destacada !== null && destacada !== folha.id}
                aoPressionar={() => abrir(folha)}
                aoDestacar={destacar(folha.id)}
              />
            ))
          }
        </MolduraImagem>
        {semRegiao < problemas.length ? (
          <Texto tipo="pequeno" cor={cores.tintaSuave} style={estilos.centro}>
            Toque em um círculo para ver o problema de perto.
          </Texto>
        ) : null}
      </Animated.View>

      <Animated.View entering={surgir(1)} style={estilos.grupo}>
        <Titulo sobretitulo="Visualização avançada">Problemas identificados</Titulo>
        {semRegiao > 0 ? (
          <View style={estilos.nota}>
            <MapPinOff size={16} color={cores.tintaSuave} style={estilos.notaIcone} />
            <Texto tipo="pequeno" cor={cores.tintaSuave} style={estilos.notaTexto}>
              {semRegiao === problemas.length
                ? 'A localização das folhas não está disponível para esta análise, então os problemas aparecem só em lista.'
                : `${semRegiao === 1 ? '1 folha não tem' : `${semRegiao} folhas não têm`} localização na foto e aparece${
                    semRegiao === 1 ? '' : 'm'
                  } só na lista.`}
            </Texto>
          </View>
        ) : null}
      </Animated.View>

      {agruparPorCategoria(problemas).map((grupo, i) => {
        const info = CATEGORIAS[grupo.categoria]
        return (
          <Animated.View key={grupo.categoria} entering={surgir(2 + i)} style={estilos.cartao}>
            <View style={estilos.cartaoCabecalho}>
              <View style={[estilos.ponto, { backgroundColor: info.cor }]} />
              <View style={estilos.cartaoTexto}>
                <Texto tipo="subtitulo" accessibilityRole="header">
                  {info.nome}
                </Texto>
                <Texto tipo="pequeno" cor={cores.tintaSuave}>
                  {info.sintomas}
                </Texto>
              </View>
            </View>
            <View style={estilos.linhas}>
            {grupo.folhas.map((folha) => (
              <View key={folha.id} style={estilos.separador}>
                <LinhaFolha
                  numero={numeros.get(folha.id) ?? 0}
                  folha={folha}
                  rotulo="folha"
                  destacada={destacada === folha.id}
                  aoDestacar={destacar(folha.id)}
                  aoPressionar={() => abrir(folha)}
                />
              </View>
            ))}
            </View>
          </Animated.View>
        )
      })}

      <BotaoSalvarAnalise />
      <Texto tipo="legenda" cor={cores.tintaFraca}>
        {AVISO_AGRONOMICO}
      </Texto>
    </TelaHub>
  )
}

/** Variação (d): nada identificado — a foto, a confirmação e a orientação de cuidado geral. */
function EstadoSaudavel({ analise, alturaFoto }: { analise: AnaliseAtual; alturaFoto: number }) {
  const cuidado = CATEGORIAS.saudavel
  return (
    <TelaHub key={analise.id}>
      <Animated.View entering={surgir(0)}>
        <MolduraImagem
          uri={analise.diagnostico.imagemUri}
          rotuloAcessivel="Foto analisada, sem problemas identificados"
          status="saudavel"
          proporcao={analise.imagem.largura / analise.imagem.altura}
          alturaMaxima={alturaFoto}
        />
      </Animated.View>
      <Animated.View entering={surgir(1)} style={estilos.grupo}>
        <Titulo sobretitulo="Visualização avançada">Nenhum problema identificado</Titulo>
        <Texto tipo="corpoGrande" cor={cores.tintaSuave}>
          A análise não encontrou padrões de estresse biótico nas folhas desta foto. O que foi observado está dentro do
          esperado para uma planta saudável.
        </Texto>
      </Animated.View>
      <Animated.View entering={surgir(2)} style={estilos.cuidado}>
        <View style={estilos.cuidadoTitulo}>
          <Sprout size={20} color={cores.folha700} />
          <Texto tipo="tituloCartao" cor={cores.folha700} accessibilityRole="header">
            Como continuar cuidando
          </Texto>
        </View>
        <Texto>{cuidado.comoCuidar}</Texto>
        <Texto>{cuidado.comoPrevenir}</Texto>
      </Animated.View>
      <Animated.View entering={surgir(3)}>
        <BotaoSalvarAnalise variante="primario" />
      </Animated.View>
    </TelaHub>
  )
}

const estilos = StyleSheet.create({
  grupo: { gap: 14 },
  grupoFoto: { gap: 14 },
  centro: { textAlign: 'center' },
  nota: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: raios.campo, backgroundColor: cores.papel2 },
  notaIcone: { marginTop: 2 },
  notaTexto: { flex: 1 },
  cartao: {
    borderRadius: raios.cartao,
    backgroundColor: cores.superficie,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: cores.linha,
    boxShadow: sombras.cartao,
  },
  cartaoCabecalho: { flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 14 },
  cartaoTexto: { flex: 1, gap: 4 },
  ponto: { width: 12, height: 12, borderRadius: 6, marginTop: 6 },
  linhas: { overflow: 'hidden', borderBottomLeftRadius: raios.cartao, borderBottomRightRadius: raios.cartao },
  separador: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: cores.linha },
  cuidado: {
    gap: 10,
    padding: 20,
    borderRadius: raios.cartao,
    backgroundColor: cores.folha50,
    borderWidth: 1,
    borderColor: cores.folha100,
  },
  cuidadoTitulo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
})
