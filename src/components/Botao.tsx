import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import type { LucideIcon } from 'lucide-react-native'
import { comAlfa, cores, fontes, raios, sombras } from '../theme'

/** As mesmas 6 variantes do coffea-web (`classesBotao`). */
export type VarianteBotao = 'primario' | 'secundario' | 'fantasma' | 'claro' | 'destaque' | 'perigo'

const VARIANTES: Record<VarianteBotao, { fundo: string; fundoPressionado: string; texto: string; borda?: string; sombra?: string }> = {
  primario: { fundo: cores.folha700, fundoPressionado: cores.folha900, texto: cores.branco, sombra: sombras.botao },
  secundario: { fundo: cores.superficie, fundoPressionado: cores.folha50, texto: cores.tinta, borda: cores.linha },
  fantasma: { fundo: 'transparent', fundoPressionado: cores.folha50, texto: cores.folha700 },
  perigo: { fundo: cores.cereja600, fundoPressionado: cores.cereja700, texto: cores.branco, sombra: sombras.botao },
  destaque: { fundo: cores.branco, fundoPressionado: cores.folha50, texto: cores.folha900, sombra: sombras.flutuante },
  claro: { fundo: comAlfa(cores.branco, 0.12), fundoPressionado: comAlfa(cores.branco, 0.22), texto: cores.branco, borda: comAlfa(cores.branco, 0.28) },
}

interface Props {
  titulo: string
  aoPressionar: () => void
  variante?: VarianteBotao
  icone?: LucideIcon
  /** Ícone depois do texto (ex.: seta "continuar"). */
  iconeDepois?: boolean
  carregando?: boolean
  desabilitado?: boolean
  grande?: boolean
  /** Ocupa a largura disponível (padrão em telas estreitas). */
  expandir?: boolean
  rotuloAcessivel?: string
  dica?: string
  style?: StyleProp<ViewStyle>
}

export function Botao({
  titulo,
  aoPressionar,
  variante = 'secundario',
  icone: Icone,
  iconeDepois,
  carregando,
  desabilitado,
  grande,
  expandir,
  rotuloAcessivel,
  dica,
  style,
}: Props) {
  const v = VARIANTES[variante]
  const inativo = desabilitado || carregando
  const icone = carregando ? (
    <ActivityIndicator size="small" color={v.texto} />
  ) : Icone ? (
    <Icone size={grande ? 20 : 18} color={v.texto} strokeWidth={2} />
  ) : null

  return (
    <Pressable
      onPress={aoPressionar}
      disabled={inativo}
      accessibilityRole="button"
      accessibilityLabel={rotuloAcessivel ?? titulo}
      accessibilityHint={dica}
      accessibilityState={{ disabled: !!inativo, busy: !!carregando }}
      style={({ pressed }) => [
        estilos.base,
        grande && estilos.grande,
        expandir && estilos.expandir,
        {
          backgroundColor: pressed ? v.fundoPressionado : v.fundo,
          borderColor: v.borda ?? 'transparent',
          boxShadow: v.sombra,
          opacity: desabilitado ? 0.5 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      <View style={[estilos.conteudo, iconeDepois && estilos.invertido]}>
        {icone}
        <Text style={[estilos.texto, grande && estilos.textoGrande, { color: v.texto }]} numberOfLines={1}>
          {titulo}
        </Text>
      </View>
    </Pressable>
  )
}

const estilos = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: raios.pilula,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grande: { minHeight: 54, paddingHorizontal: 26 },
  expandir: { alignSelf: 'stretch' },
  conteudo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  invertido: { flexDirection: 'row-reverse' },
  texto: { fontFamily: fontes.textoMedio, fontSize: 15.5, lineHeight: 20 },
  textoGrande: { fontSize: 16.5 },
})
