import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

type Props = {
  mensagem: string
  onTentarNovamente: () => void
}

export function TelaErro({ mensagem, onTentarNovamente }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Algo deu errado</Text>
      <Text style={styles.texto}>{mensagem}</Text>
      <TouchableOpacity style={styles.botao} onPress={onTentarNovamente}>
        <Text style={styles.botaoTexto}>Tentar novamente</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  titulo: { fontSize: 22, fontWeight: '600', color: '#dc2626' },
  texto: { fontSize: 16, color: '#555', textAlign: 'center' },
  botao: { backgroundColor: '#15803d', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 8, marginTop: 12 },
  botaoTexto: { color: '#fff', fontWeight: '600', fontSize: 16 },
})