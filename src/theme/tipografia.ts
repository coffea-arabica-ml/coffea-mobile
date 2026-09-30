// Importa cada peso pelo subcaminho: o índice do pacote puxaria todos os 18 arquivos para o bundle.
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold'
import { InstrumentSans_400Regular } from '@expo-google-fonts/instrument-sans/400Regular'
import { InstrumentSans_400Regular_Italic } from '@expo-google-fonts/instrument-sans/400Regular_Italic'
import { InstrumentSans_500Medium } from '@expo-google-fonts/instrument-sans/500Medium'
import { InstrumentSans_600SemiBold } from '@expo-google-fonts/instrument-sans/600SemiBold'
import { InstrumentSans_700Bold } from '@expo-google-fonts/instrument-sans/700Bold'
import type { TextStyle } from 'react-native'

/**
 * Mesmas famílias do coffea-web: Fraunces nos títulos, Instrument Sans no texto.
 * No Android, `fontWeight` não troca o arquivo de uma fonte carregada — cada peso é uma família.
 */
export const fontes = {
  display: 'Fraunces_600SemiBold',
  texto: 'InstrumentSans_400Regular',
  textoItalico: 'InstrumentSans_400Regular_Italic',
  textoMedio: 'InstrumentSans_500Medium',
  textoSemi: 'InstrumentSans_600SemiBold',
  textoNegrito: 'InstrumentSans_700Bold',
} as const

/** Passado ao `useFonts`: as chaves são os nomes de família usados em `fontes`. */
export const arquivosDeFonte = {
  Fraunces_600SemiBold,
  InstrumentSans_400Regular,
  InstrumentSans_400Regular_Italic,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold,
}

/** Escala tipográfica — derivada das classes usadas no coffea-web (text-3xl, text-lg, text-sm…). */
export const tipos = {
  display: { fontFamily: fontes.display, fontSize: 40, lineHeight: 44, letterSpacing: -0.8 },
  titulo: { fontFamily: fontes.display, fontSize: 30, lineHeight: 35, letterSpacing: -0.5 },
  tituloCartao: { fontFamily: fontes.display, fontSize: 21, lineHeight: 27, letterSpacing: -0.2 },
  subtitulo: { fontFamily: fontes.display, fontSize: 18, lineHeight: 24 },
  corpoGrande: { fontFamily: fontes.texto, fontSize: 17, lineHeight: 26 },
  corpo: { fontFamily: fontes.texto, fontSize: 16, lineHeight: 24 },
  pequeno: { fontFamily: fontes.texto, fontSize: 14, lineHeight: 20 },
  legenda: { fontFamily: fontes.texto, fontSize: 12, lineHeight: 16 },
  sobretitulo: {
    fontFamily: fontes.textoMedio,
    fontSize: 12.5,
    lineHeight: 18,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  botao: { fontFamily: fontes.textoMedio, fontSize: 16, lineHeight: 20 },
} satisfies Record<string, TextStyle>

export type TipoTexto = keyof typeof tipos
