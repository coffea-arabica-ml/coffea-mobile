import { useState } from 'react'
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { File, Paths } from 'expo-file-system'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Check, FlaskConical, X } from 'lucide-react-native'
import { origemDoPacote, type OrigemImagem } from '../api'
import { CENARIOS, type CenarioId } from '../api/mock/cenarios'
import {
  definirAtrasoForcado,
  definirCenarioForcado,
  obterAtrasoForcado,
  obterCenarioForcado,
} from '../api/mock/resolverCenario'
import { Texto } from '../components/Texto'
import { useToast } from '../components/Toast'
import type { PropsRaiz } from '../navigation/tipos'
import { esquecerBoasVindas } from '../state/preferencias'
import { useSessaoAnalise } from '../state/SessaoAnalise'
import { comAlfa, cores, raios } from '../theme'

// Só em desenvolvimento: este módulo (e as fixtures abaixo) é carregado pela navegação apenas em
// __DEV__ e não entra no bundle de produção.
// teste-extensao-trocada.png é texto: o Metro recusa empacotá-lo como imagem ("unsupported file type").
// Por isso o conteúdo vem daqui — igual ao arquivo em src/assets/exemplos, compartilhado com o coffea-web —
// e é gravado no cache com o nome .png na hora do envio.
const TEXTO_EXTENSAO_TROCADA = `Este arquivo é um .txt disfarçado de .png, usado para testar a validação de
formato por conteúdo real do arquivo (magic bytes / content-type), não apenas
pela extensão do nome do arquivo. Se o coffea-web aceitar isso como imagem
válida, a validação está checando só a extensão — o que precisa ser corrigido.
`

function origemDeTexto(conteudo: string, nomeArquivo: string): OrigemImagem {
  const arquivo = new File(Paths.cache, nomeArquivo)
  if (arquivo.exists) arquivo.delete()
  arquivo.create()
  arquivo.write(conteudo)
  return { uri: arquivo.uri, nomeArquivo }
}

type Fixture = { nome: string; modulo: number } | { nome: string; texto: string }

const FIXTURES: Fixture[] = [
  { nome: 'teste-sem-planta.jpg', modulo: require('../assets/exemplos/teste-sem-planta.jpg') },
  { nome: 'teste-especie-incorreta.jpg', modulo: require('../assets/exemplos/teste-especie-incorreta.jpg') },
  { nome: 'teste-baixa-qualidade.jpg', modulo: require('../assets/exemplos/teste-baixa-qualidade.jpg') },
  { nome: 'teste-formato-gif.gif', modulo: require('../assets/exemplos/teste-formato-gif.gif') },
  { nome: 'teste-formato-webp.webp', modulo: require('../assets/exemplos/teste-formato-webp.webp') },
  { nome: 'teste-extensao-trocada.png', texto: TEXTO_EXTENSAO_TROCADA },
  { nome: 'teste-arquivo-grande.png', modulo: require('../assets/exemplos/teste-arquivo-grande.png') },
  { nome: 'teste-paisagem.jpg', modulo: require('../assets/exemplos/teste-paisagem.jpg') },
  { nome: 'teste-retrato.jpg', modulo: require('../assets/exemplos/teste-retrato.jpg') },
  { nome: 'teste-quadrada.jpg', modulo: require('../assets/exemplos/teste-quadrada.jpg') },
]

const ATRASOS = [
  { rotulo: 'Padrão (1,5–2,5 s)', valor: null },
  { rotulo: 'Rápido (300 ms)', valor: 300 },
  { rotulo: 'Lento (8 s)', valor: 8000 },
]

function Opcao({ rotulo, marcada, aoPressionar, mono }: { rotulo: string; marcada?: boolean; aoPressionar: () => void; mono?: boolean }) {
  return (
    <Pressable
      onPress={aoPressionar}
      accessibilityRole={marcada === undefined ? 'button' : 'radio'}
      accessibilityState={marcada === undefined ? undefined : { checked: marcada }}
      style={({ pressed }) => [estilos.opcao, (pressed || marcada) && { backgroundColor: comAlfa(cores.branco, 0.1) }]}
    >
      <View style={estilos.marca}>{marcada ? <Check size={15} color={cores.folha300} /> : null}</View>
      <Texto tipo="pequeno" cor={cores.branco} style={mono && estilos.mono}>
        {rotulo}
      </Texto>
    </Pressable>
  )
}

/** Força cenários do mock e envia as fixtures `teste-*` pelo fluxo real (verificação incluída). */
export function PainelCenarios({ navigation }: PropsRaiz<'PainelCenarios'>) {
  const { enviarFoto } = useSessaoAnalise()
  const avisar = useToast()
  const [cenario, setCenario] = useState<CenarioId | null>(obterCenarioForcado)
  const [atraso, setAtraso] = useState<number | null>(obterAtrasoForcado)

  async function enviarFixture(fixture: Fixture) {
    const { nome } = fixture
    try {
      const origem = 'texto' in fixture ? origemDeTexto(fixture.texto, nome) : await origemDoPacote(fixture.modulo, nome)
      navigation.popTo('Hub', { screen: 'Enviar' })
      void enviarFoto(origem)
    } catch (e) {
      avisar(e instanceof Error ? e.message : `Não foi possível abrir ${nome}.`)
    }
  }

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <View style={estilos.cabecalho}>
        <View style={estilos.titulo}>
          <FlaskConical size={18} color={cores.folha300} />
          <Texto tipo="subtitulo" cor={cores.branco} accessibilityRole="header">
            Cenários do mock · DEV
          </Texto>
        </View>
        <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Fechar painel" hitSlop={10}>
          <X size={22} color={cores.branco} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={estilos.conteudo}>
        <Texto tipo="sobretitulo" cor={comAlfa(cores.branco, 0.6)}>
          Cenário
        </Texto>
        <View style={estilos.grupo}>
          <Opcao
            rotulo="Automático (pelo arquivo)"
            marcada={cenario === null}
            aoPressionar={() => {
              definirCenarioForcado(null)
              setCenario(null)
            }}
          />
          {CENARIOS.map((c) => (
            <Opcao
              key={c.id}
              rotulo={c.rotulo}
              marcada={cenario === c.id}
              aoPressionar={() => {
                definirCenarioForcado(c.id)
                setCenario(c.id)
              }}
            />
          ))}
        </View>

        <Texto tipo="sobretitulo" cor={comAlfa(cores.branco, 0.6)}>
          Latência
        </Texto>
        <View style={estilos.grupo}>
          {ATRASOS.map((a) => (
            <Opcao
              key={a.rotulo}
              rotulo={a.rotulo}
              marcada={atraso === a.valor}
              aoPressionar={() => {
                definirAtrasoForcado(a.valor)
                setAtraso(a.valor)
              }}
            />
          ))}
        </View>

        <Texto tipo="sobretitulo" cor={comAlfa(cores.branco, 0.6)}>
          Enviar fixture
        </Texto>
        <View style={estilos.grupo}>
          {FIXTURES.map((f) => (
            <Opcao key={f.nome} rotulo={f.nome} mono aoPressionar={() => void enviarFixture(f)} />
          ))}
        </View>

        <Texto tipo="sobretitulo" cor={comAlfa(cores.branco, 0.6)}>
          Tela inicial
        </Texto>
        <View style={estilos.grupo}>
          <Opcao rotulo="Mostrar agora (como “Sobre”)" aoPressionar={() => navigation.navigate('Sobre')} />
          <Opcao
            rotulo="Mostrar de novo na próxima abertura"
            aoPressionar={() => void esquecerBoasVindas().then(() => avisar('A tela inicial volta na próxima abertura do app.'))}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.tinta },
  cabecalho: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: comAlfa(cores.branco, 0.15),
  },
  titulo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  conteudo: { padding: 20, gap: 10 },
  grupo: { gap: 2, marginBottom: 16, borderRadius: raios.campo, overflow: 'hidden' },
  opcao: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, borderRadius: 10 },
  marca: { width: 18, alignItems: 'center' },
  mono: { fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }) },
})
