import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { AbaEnviar } from '../screens/AbaEnviar'
import { AbaHistorico } from '../screens/AbaHistorico'
import { AbaResumo } from '../screens/AbaResumo'
import { ModalSalvarAnalise } from '../screens/ModalSalvarAnalise'
import { TelaInicial } from '../screens/TelaInicial'
import { DetalheProblema } from '../screens/visualizacao/DetalheProblema'
import { VisualizacaoLista } from '../screens/visualizacao/VisualizacaoLista'
import { cores, fontes } from '../theme'
import { BarraAbas } from './BarraAbas'
import type { AbasParams, RaizParams, VisualizacaoParams } from './tipos'

const PilhaVisualizacao = createNativeStackNavigator<VisualizacaoParams>()

/** Aba "Visualização avançada": lista com círculos → Detalhe com push e gesto de voltar nativos. */
function NavegacaoVisualizacao() {
  return (
    <PilhaVisualizacao.Navigator screenOptions={{ contentStyle: { backgroundColor: cores.papel } }}>
      <PilhaVisualizacao.Screen name="VisualizacaoLista" component={VisualizacaoLista} options={{ headerShown: false }} />
      <PilhaVisualizacao.Screen
        name="DetalheProblema"
        component={DetalheProblema}
        options={{
          title: '',
          headerBackTitle: 'Foto inteira',
          headerTintColor: cores.folha700,
          headerStyle: { backgroundColor: cores.papel },
          headerShadowVisible: false,
          headerTitleStyle: { fontFamily: fontes.textoMedio, fontSize: 16, color: cores.tinta },
        }}
      />
    </PilhaVisualizacao.Navigator>
  )
}

const Abas = createBottomTabNavigator<AbasParams>()

/** Hub com as 4 seções: Histórico | Enviar foto | Resumo técnico | Visualização avançada. */
function Hub() {
  return (
    <Abas.Navigator
      initialRouteName="Enviar"
      backBehavior="history"
      tabBar={(props) => <BarraAbas {...props} />}
      screenOptions={{ headerShown: false, animation: 'fade', sceneStyle: { backgroundColor: cores.papel } }}
    >
      <Abas.Screen name="Historico" component={AbaHistorico} />
      <Abas.Screen name="Enviar" component={AbaEnviar} />
      <Abas.Screen name="Resumo" component={AbaResumo} />
      {/* Sair da aba volta a pilha para a lista: um Detalhe antigo não fica "preso" nela. */}
      <Abas.Screen name="Visualizacao" component={NavegacaoVisualizacao} options={{ popToTopOnBlur: true }} />
    </Abas.Navigator>
  )
}

const Raiz = createNativeStackNavigator<RaizParams>()

export function RaizNavegacao({ rotaInicial }: { rotaInicial: 'Inicial' | 'Hub' }) {
  return (
    <Raiz.Navigator
      initialRouteName={rotaInicial}
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.papel } }}
    >
      <Raiz.Screen name="Inicial" component={TelaInicial} options={{ animation: 'fade' }} />
      <Raiz.Screen name="Hub" component={Hub} options={{ animation: 'fade' }} />
      <Raiz.Screen name="Sobre" component={TelaInicial} options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
      <Raiz.Screen
        name="SalvarAnalise"
        component={ModalSalvarAnalise}
        options={{ presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } }}
      />
      {__DEV__ && (
        <Raiz.Screen
          name="PainelCenarios"
          // Carregado só em desenvolvimento: o require some do bundle de produção junto com as fixtures.
          getComponent={() => require('../dev/PainelCenarios').PainelCenarios}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      )}
    </Raiz.Navigator>
  )
}
