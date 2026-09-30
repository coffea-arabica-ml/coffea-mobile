import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

/** Pilha raiz: tela inicial, o hub de abas e o que se sobrepõe a ele (modais). */
export type RaizParams = {
  /** T1 no primeiro acesso. */
  Inicial: undefined
  Hub: NavigatorScreenParams<AbasParams> | undefined
  /** A mesma T1, reaberta pelo logo como "Sobre o Cafélens". */
  Sobre: undefined
  /** T9 — card sobre o fundo escurecido. */
  SalvarAnalise: undefined
  /** Só em __DEV__. */
  PainelCenarios: undefined
}

export type AbasParams = {
  Historico: { destacar?: string } | undefined
  Enviar: undefined
  Resumo: undefined
  Visualizacao: NavigatorScreenParams<VisualizacaoParams> | undefined
}

export type VisualizacaoParams = {
  VisualizacaoLista: undefined
  DetalheProblema: { folhaId: string }
}

export type PropsRaiz<T extends keyof RaizParams> = NativeStackScreenProps<RaizParams, T>

export type PropsAba<T extends keyof AbasParams> = CompositeScreenProps<
  BottomTabScreenProps<AbasParams, T>,
  NativeStackScreenProps<RaizParams>
>

export type PropsVisualizacao<T extends keyof VisualizacaoParams> = CompositeScreenProps<
  NativeStackScreenProps<VisualizacaoParams, T>,
  PropsAba<'Visualizacao'>
>

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // Tipagem de useNavigation() sem precisar de genéricos em cada tela.
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RaizParams {}
  }
}
