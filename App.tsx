import { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ToastProvider } from './src/components/Toast'
import { RaizNavegacao } from './src/navigation/RaizNavegacao'
import { temaNavegacao } from './src/navigation/tema'
import { HistoricoProvider } from './src/state/Historico'
import { jaViuBoasVindas } from './src/state/preferencias'
import { SessaoAnaliseProvider } from './src/state/SessaoAnalise'
import { arquivosDeFonte } from './src/theme'

// A splash fica na tela até as fontes e a preferência de 1º acesso carregarem — sem "piscar".
void SplashScreen.preventAutoHideAsync().catch(() => {})
SplashScreen.setOptions({ fade: true, duration: 250 })

export default function App() {
  const [fontesCarregadas, erroFontes] = useFonts(arquivosDeFonte)
  const [rotaInicial, setRotaInicial] = useState<'Inicial' | 'Hub' | null>(null)

  useEffect(() => {
    void jaViuBoasVindas().then((viu) => setRotaInicial(viu ? 'Hub' : 'Inicial'))
  }, [])

  // Se uma fonte falhar, o app segue com a fonte do sistema em vez de travar na splash.
  if ((!fontesCarregadas && !erroFontes) || !rotaInicial) return null

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <SessaoAnaliseProvider>
          <HistoricoProvider>
            <NavigationContainer theme={temaNavegacao} onReady={() => void SplashScreen.hideAsync().catch(() => {})}>
              <StatusBar style="dark" />
              <RaizNavegacao rotaInicial={rotaInicial} />
            </NavigationContainer>
          </HistoricoProvider>
        </SessaoAnaliseProvider>
      </ToastProvider>
    </SafeAreaProvider>
  )
}
