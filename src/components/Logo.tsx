import { Image, StyleSheet, Text, View } from 'react-native'
import { comAlfa, cores, fontes } from '../theme'

interface Props {
  tamanho?: 'sm' | 'md' | 'lg'
  /** Versão para fundos escuros: o símbolo ganha uma pastilha clara. */
  claro?: boolean
}

const TAMANHOS = {
  sm: { simbolo: 26, texto: 21 },
  md: { simbolo: 34, texto: 26 },
  lg: { simbolo: 52, texto: 42 },
}

export function Logo({ tamanho = 'md', claro = false }: Props) {
  const t = TAMANHOS[tamanho]
  return (
    <View style={estilos.linha} accessible accessibilityRole="image" accessibilityLabel="Cafélens">
      <View style={[estilos.pastilha, claro && estilos.pastilhaClara]}>
        <Image source={require('../assets/logo-cafelens.png')} style={{ width: t.simbolo, height: t.simbolo }} />
      </View>
      <Text style={[estilos.nome, { fontSize: t.texto, lineHeight: t.texto * 1.15 }, claro && { color: cores.branco }]}>
        Cafélens
      </Text>
    </View>
  )
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pastilha: { borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  pastilhaClara: { backgroundColor: comAlfa(cores.branco, 0.92), padding: 5 },
  nome: { fontFamily: fontes.display, color: cores.tinta, letterSpacing: -0.4 },
})
