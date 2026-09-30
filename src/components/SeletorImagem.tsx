import { Alert, Linking, StyleSheet, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Camera, Images } from 'lucide-react-native'
import type { OrigemImagem } from '../api'
import { useSessaoAnalise } from '../state/SessaoAnalise'
import { Botao } from './Botao'

/** Converte o resultado do picker na origem usada pelo fluxo de análise. */
export function origemDoPicker(asset: ImagePicker.ImagePickerAsset): OrigemImagem {
  return { uri: asset.uri, nomeArquivo: asset.fileName }
}

interface Props {
  /** "principal" destaca a câmera; "discreto" usa dois botões secundários (reenvio abaixo da foto). */
  enfase?: 'principal' | 'discreto'
  /** Chamado depois que uma foto é escolhida (ex.: ir para a aba Enviar, onde o carregamento aparece). */
  aoEscolher?: () => void
}

/** Os dois caminhos do RF06 — câmera ou galeria — sempre uma foto estática por vez. */
export function SeletorImagem({ enfase = 'principal', aoEscolher }: Props) {
  const { enviarFoto } = useSessaoAnalise()

  function receber(resultado: ImagePicker.ImagePickerResult) {
    if (resultado.canceled || !resultado.assets[0]) return
    void enviarFoto(origemDoPicker(resultado.assets[0]))
    aoEscolher?.()
  }

  async function tirarFoto() {
    const permissao = await ImagePicker.requestCameraPermissionsAsync()
    if (!permissao.granted) {
      Alert.alert(
        'Permita o acesso à câmera',
        'Para fotografar o cafeeiro, o Cafélens precisa usar a câmera. Você também pode escolher uma foto da galeria.',
        permissao.canAskAgain
          ? [{ text: 'Entendi' }]
          : [
              { text: 'Agora não', style: 'cancel' },
              { text: 'Abrir Ajustes', onPress: () => void Linking.openSettings() },
            ],
      )
      return
    }
    // quality < 1 recomprime o JPEG da câmera: mesma resolução, arquivo bem abaixo dos 10 MB.
    receber(await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85 }))
  }

  async function escolherDaGaleria() {
    // O seletor de fotos do sistema não precisa de permissão de galeria (Android 13+ e iOS 14+).
    receber(
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        // No iOS, pede ao sistema a versão mais compatível (JPEG em vez de HEIC) quando possível.
        preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      }),
    )
  }

  return (
    <View style={estilos.linha}>
      <Botao
        titulo="Tirar foto"
        icone={Camera}
        variante={enfase === 'principal' ? 'primario' : 'secundario'}
        aoPressionar={() => void tirarFoto()}
        dica="Abre a câmera para fotografar o cafeeiro"
        style={estilos.botao}
      />
      <Botao
        titulo="Galeria"
        icone={Images}
        variante="secundario"
        aoPressionar={() => void escolherDaGaleria()}
        rotuloAcessivel="Escolher da galeria"
        dica="Escolhe uma foto já tirada"
        style={estilos.botao}
      />
    </View>
  )
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  botao: { flexGrow: 1, flexBasis: 140 },
})
