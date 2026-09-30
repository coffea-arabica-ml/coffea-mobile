import { Pressable, StyleSheet, View } from 'react-native'
import Animated, { ZoomIn } from 'react-native-reanimated'
import type { FolhaDiagnostico, RegiaoFolha } from '../api'
import { CATEGORIAS } from '../content/categorias'
import { circuloNaFoto } from '../domain/geometria'
import { ROTULO_SEVERIDADE } from '../domain/severidade'
import { curvas } from '../theme'
import { NumeroFolha } from './LinhaFolha'

/** Menor círculo desenhado; o toque ainda ganha folga (hitSlop) até ~48 pt. */
const DIAMETRO_MINIMO = 36

interface Props {
  folha: FolhaDiagnostico & { regiao: RegiaoFolha }
  numero: number
  /** Tamanho da foto exibida (a caixa da MolduraImagem). */
  largura: number
  altura: number
  /** Posição na cascata de entrada. */
  ordem: number
  destacada: boolean
  outraDestacada: boolean
  aoPressionar: () => void
  aoDestacar: (ativo: boolean) => void
}

/** RF04 — círculo tocável, na cor da categoria e sempre com número (a cor nunca é o único sinal). */
export function CirculoFolha({ folha, numero, largura, altura, ordem, destacada, outraDestacada, aoPressionar, aoDestacar }: Props) {
  const info = CATEGORIAS[folha.categoria]
  const { centroX, centroY, diametro: bruto } = circuloNaFoto(folha.regiao, largura, altura)
  const diametro = Math.max(bruto, DIAMETRO_MINIMO)
  const folga = Math.max(0, (48 - diametro) / 2)

  return (
    <Animated.View
      entering={ZoomIn.duration(380).delay(250 + ordem * 80).easing(curvas.surgir)}
      style={[
        estilos.posicao,
        { left: centroX - diametro / 2, top: centroY - diametro / 2, width: diametro, height: diametro },
        destacada && estilos.acima,
      ]}
    >
      <Pressable
        onPress={aoPressionar}
        onPressIn={() => aoDestacar(true)}
        onPressOut={() => aoDestacar(false)}
        hitSlop={folga}
        accessibilityRole="button"
        accessibilityLabel={`Folha ${numero}: ${info.nome}, severidade ${ROTULO_SEVERIDADE[folha.severidade].toLowerCase()}`}
        accessibilityHint="Abre a folha ampliada, com como cuidar e como prevenir"
        style={[
          estilos.circulo,
          { borderRadius: diametro / 2, borderColor: info.cor },
          destacada && estilos.destacado,
          outraDestacada && estilos.apagado,
        ]}
      >
        <View style={estilos.numero}>
          <NumeroFolha numero={numero} cor={info.cor} tamanho={24} />
        </View>
      </Pressable>
    </Animated.View>
  )
}

const estilos = StyleSheet.create({
  posicao: { position: 'absolute' },
  acima: { zIndex: 2 },
  circulo: {
    flex: 1,
    borderWidth: 3,
    boxShadow: '0px 0px 0px 2px rgba(255, 255, 255, 0.9), 0px 4px 18px rgba(0, 0, 0, 0.35)',
  },
  destacado: { transform: [{ scale: 1.1 }], backgroundColor: 'rgba(255, 255, 255, 0.15)' },
  apagado: { opacity: 0.55 },
  numero: {
    position: 'absolute',
    top: -6,
    right: -6,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
})
