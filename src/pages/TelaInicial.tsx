import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

type Props = {
  onIniciar: () => void
}

export function TelaInicial({ onIniciar }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Diagnóstico de Estresses Bióticos em Café</Text>
      <Text style={styles.texto}>
        Envie uma foto de uma folha de café arábica e receba uma estimativa do tipo de estresse e da severidade.
      </Text>
      <TouchableOpacity style={styles.botao} onPress={onIniciar}>
        <Text style={styles.botaoTexto}>Começar</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  titulo: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  texto: { fontSize: 16, color: '#555', textAlign: 'center' },
  botao: { backgroundColor: '#15803d', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 8, marginTop: 12 },
  botaoTexto: { color: '#fff', fontWeight: '600', fontSize: 16 },
})