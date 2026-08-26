import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'

export function TelaCarregando() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#15803d" />
      <Text style={styles.texto}>Analisando a imagem...</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  texto: { fontSize: 16, color: '#555' },
})