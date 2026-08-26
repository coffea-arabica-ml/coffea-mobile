import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

type Resultado = {
  categoria: string
  severidade: string
}

type Props = {
  resultado: Resultado
  onNovaAnalise: () => void
}

export function TelaResultado({ resultado, onNovaAnalise }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Resultado</Text>
      <Text style={styles.texto}>Categoria: <Text style={styles.negrito}>{resultado.categoria}</Text></Text>
      <Text style={styles.texto}>Severidade: <Text style={styles.negrito}>{resultado.severidade}</Text></Text>
      <TouchableOpacity style={styles.botao} onPress={onNovaAnalise}>
        <Text style={styles.botaoTexto}>Analisar outra imagem</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  titulo: { fontSize: 22, fontWeight: '600' },
  texto: { fontSize: 16 },
  negrito: { fontWeight: 'bold' },
  botao: { backgroundColor: '#15803d', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 8, marginTop: 16 },
  botaoTexto: { color: '#fff', fontWeight: '600', fontSize: 16 },
})