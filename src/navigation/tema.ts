import { DefaultTheme, type Theme } from '@react-navigation/native'
import { cores, fontes } from '../theme'

/** Tema do React Navigation com as cores e fontes do Cafélens (cabeçalhos nativos, fundo das telas). */
export const temaNavegacao: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: cores.folha700,
    background: cores.papel,
    card: cores.papel,
    text: cores.tinta,
    border: cores.linha,
    notification: cores.cereja500,
  },
  fonts: {
    regular: { fontFamily: fontes.texto, fontWeight: '400' },
    medium: { fontFamily: fontes.textoMedio, fontWeight: '500' },
    bold: { fontFamily: fontes.textoSemi, fontWeight: '600' },
    heavy: { fontFamily: fontes.textoNegrito, fontWeight: '700' },
  },
}
