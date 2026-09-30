import { Pressable, StyleSheet, View } from 'react-native'
import { ChevronRight, MapPinOff } from 'lucide-react-native'
import type { FolhaDiagnostico } from '../api'
import { CATEGORIAS } from '../content/categorias'
import { ROTULO_SEVERIDADE } from '../domain/severidade'
import { cores, fontes } from '../theme'
import { MedidorSeveridade } from './MedidorSeveridade'
import { Texto } from './Texto'

/** Número da folha na cor da categoria — o mesmo número do círculo sobre a foto. */
export function NumeroFolha({ numero, cor, tamanho = 26 }: { numero: number; cor: string; tamanho?: number }) {
  return (
    <View style={[estilos.numero, { width: tamanho, height: tamanho, borderRadius: tamanho / 2, backgroundColor: cor }]}>
      <Texto style={[estilos.numeroTexto, { fontSize: tamanho * 0.48 }]} cor={cores.branco} numeros maxFontSizeMultiplier={1.2}>
        {numero}
      </Texto>
    </View>
  )
}

interface Props {
  numero: number
  folha: FolhaDiagnostico
  /** No Resumo mostra a categoria; na Visualização (já agrupada por categoria) mostra "Folha N". */
  rotulo: 'categoria' | 'folha'
  aoPressionar: () => void
  /** Destaca o círculo correspondente na foto enquanto a linha é tocada. */
  aoDestacar?: (ativo: boolean) => void
  destacada?: boolean
}

/** Uma folha com problema, tocável: abre o Detalhe dela. */
export function LinhaFolha({ numero, folha, rotulo, aoPressionar, aoDestacar, destacada }: Props) {
  const info = CATEGORIAS[folha.categoria]
  const semLocalizacao = !folha.regiao
  const titulo = rotulo === 'categoria' ? info.nome : `Folha ${numero}`

  return (
    <Pressable
      onPress={aoPressionar}
      onPressIn={() => aoDestacar?.(true)}
      onPressOut={() => aoDestacar?.(false)}
      accessibilityRole="button"
      accessibilityLabel={`Folha ${numero}: ${info.nome}, severidade ${ROTULO_SEVERIDADE[folha.severidade].toLowerCase()}${
        semLocalizacao ? ', sem localização na foto' : ''
      }`}
      accessibilityHint="Abre os detalhes, como cuidar e como prevenir"
      style={({ pressed }) => [estilos.linha, (pressed || destacada) && { backgroundColor: cores.folha50 }]}
    >
      <NumeroFolha numero={numero} cor={info.cor} />
      <View style={estilos.meio}>
        <Texto peso="medio" numberOfLines={1}>
          {titulo}
        </Texto>
        {semLocalizacao ? (
          <View style={estilos.semLocal}>
            <MapPinOff size={12} color={cores.tintaFraca} />
            <Texto tipo="legenda" cor={cores.tintaFraca}>
              sem localização na foto
            </Texto>
          </View>
        ) : null}
      </View>
      <MedidorSeveridade nivel={folha.severidade} compacto />
      <ChevronRight size={18} color={cores.tintaFraca} />
    </Pressable>
  )
}

const estilos = StyleSheet.create({
  numero: { alignItems: 'center', justifyContent: 'center' },
  numeroTexto: { fontFamily: fontes.textoNegrito, lineHeight: undefined },
  linha: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  meio: { flex: 1, gap: 2 },
  semLocal: { flexDirection: 'row', alignItems: 'center', gap: 4 },
})
