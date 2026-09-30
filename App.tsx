import { useEffect } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { arquivosDeFonte, cores, tipos } from './src/theme'

// A splash fica na tela até as fontes carregarem — sem "piscar" com a fonte do sistema.
void SplashScreen.preventAutoHideAsync().catch(() => {})
SplashScreen.setOptions({ fade: true, duration: 250 })

export default function App() {
  const [fontesCarregadas, erroFontes] = useFonts(arquivosDeFonte)
  const pronto = fontesCarregadas || erroFontes !== null

  useEffect(() => {
    if (pronto) void SplashScreen.hideAsync().catch(() => {})
  }, [pronto])

  if (!pronto) return null

  return (
    <View style={estilos.tela}>
      <StatusBar style="dark" />
      <Image source={require('./src/assets/logo-cafelens.png')} style={estilos.logo} />
      <Text style={[tipos.titulo, estilos.nome]}>Cafélens</Text>
    </View>
  )
}

const estilos = StyleSheet.create({
  tela: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: cores.papel },
  logo: { width: 72, height: 72 },
  nome: { color: cores.tinta },
})
