import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'

type Props = {
  onImagemSelecionada: (uri: string) => void
}

export function TelaUpload({ onImagemSelecionada }: Props) {
  async function escolherImagem() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permissao.granted) {
      Alert.alert('Permissão necessária', 'Precisamos acessar suas fotos para continuar.')
      return
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    })

    if (!resultado.canceled) {
      onImagemSelecionada(resultado.assets[0].uri)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Envie a foto da folha</Text>
      <TouchableOpacity style={styles.botao} onPress={escolherImagem}>
        <Text style={styles.botaoTexto}>Escolher imagem</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  titulo: { fontSize: 20, fontWeight: '600', textAlign: 'center' },
  botao: { backgroundColor: '#15803d', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 8 },
  botaoTexto: { color: '#fff', fontWeight: '600', fontSize: 16 },
})