import { Text, type TextProps } from 'react-native'
import { cores, fontes, tipos, type TipoTexto } from '../theme'

interface Props extends TextProps {
  tipo?: TipoTexto
  cor?: string
  /** Números tabulares (datas, contagens, "Folha 2 de 3"), como no coffea-web. */
  numeros?: boolean
  /** Peso do texto corrido (Instrument Sans); títulos Fraunces ignoram. */
  peso?: 'regular' | 'medio' | 'semi' | 'negrito'
  italico?: boolean
}

const FAMILIA_POR_PESO = {
  regular: fontes.texto,
  medio: fontes.textoMedio,
  semi: fontes.textoSemi,
  negrito: fontes.textoNegrito,
} as const

export function Texto({ tipo = 'corpo', cor = cores.tinta, numeros, peso, italico, style, ...props }: Props) {
  return (
    <Text
      {...props}
      style={[
        tipos[tipo],
        { color: cor },
        peso && { fontFamily: FAMILIA_POR_PESO[peso] },
        italico && { fontFamily: fontes.textoItalico },
        numeros && { fontVariant: ['tabular-nums'] },
        style,
      ]}
    />
  )
}
