import { useEffect, useState, type ReactNode } from 'react'
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'
import { Image } from 'expo-image'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { cores, MARGEM, raios } from '../theme'

export type StatusMoldura = 'neutro' | 'saudavel' | 'problema'

const COR_ANEL: Record<StatusMoldura, string> = {
  neutro: cores.linha,
  saudavel: cores.folha500,
  problema: cores.cereja500,
}

/** Espessura do anel + folga (papel) entre anel e foto — o `ring-4 ring-offset-4` do coffea-web. */
const ANEL = 3
const FOLGA = 4

interface Props {
  uri: string
  rotuloAcessivel: string
  status?: StatusMoldura
  /** Largura ÷ altura, quando já é conhecida (evita um quadro vazio enquanto mede). */
  proporcao?: number
  /** Altura máxima da foto, em pontos. A largura acompanha a proporção real. */
  alturaMaxima: number
  /** Largura disponível; padrão: a tela menos as margens. */
  larguraDisponivel?: number
  /** Camadas sobre a foto (ex.: círculos do RF04), posicionadas em pontos da caixa da foto. */
  children?: (largura: number, altura: number) => ReactNode
  aoPressionar?: () => void
  dica?: string
}

/**
 * Mostra a foto na proporção real (retrato, paisagem ou quadrada) com o anel de status.
 * A caixa tem exatamente o tamanho da imagem, então sobreposições caem no lugar certo.
 */
export function MolduraImagem({
  uri,
  rotuloAcessivel,
  status = 'neutro',
  proporcao: proporcaoConhecida,
  alturaMaxima,
  larguraDisponivel,
  children,
  aoPressionar,
  dica,
}: Props) {
  const { width: larguraTela } = useWindowDimensions()
  const [proporcaoMedida, setProporcaoMedida] = useState<number | null>(null)
  const proporcao = proporcaoConhecida ?? proporcaoMedida ?? 3 / 4
  const disponivel = (larguraDisponivel ?? larguraTela - 2 * MARGEM) - 2 * (ANEL + FOLGA)
  const largura = Math.min(disponivel, alturaMaxima * proporcao)
  const altura = largura / proporcao

  const corAnel = useSharedValue(COR_ANEL[status])
  useEffect(() => {
    corAnel.value = withTiming(COR_ANEL[status], { duration: 500 })
  }, [status, corAnel])
  const estiloAnel = useAnimatedStyle(() => ({ borderColor: corAnel.value }))

  const conteudo = (
    <Animated.View style={[estilos.anel, estiloAnel]}>
      <View style={[estilos.foto, { width: largura, height: altura }]}>
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={300}
          accessible
          accessibilityLabel={rotuloAcessivel}
          onLoad={(e) => {
            if (!proporcaoConhecida && e.source.width > 0) setProporcaoMedida(e.source.width / e.source.height)
          }}
        />
        {children && (proporcaoConhecida || proporcaoMedida) ? children(largura, altura) : null}
      </View>
    </Animated.View>
  )

  if (!aoPressionar) return <View style={estilos.centro}>{conteudo}</View>
  return (
    <Pressable
      onPress={aoPressionar}
      accessibilityRole="button"
      accessibilityLabel={rotuloAcessivel}
      accessibilityHint={dica}
      style={({ pressed }) => [estilos.centro, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}
    >
      {conteudo}
    </Pressable>
  )
}

const estilos = StyleSheet.create({
  centro: { alignSelf: 'center' },
  anel: { borderWidth: ANEL, padding: FOLGA, borderRadius: raios.moldura + ANEL + FOLGA },
  foto: { borderRadius: raios.moldura, overflow: 'hidden', backgroundColor: cores.papel2 },
})
