import { StyleSheet, View } from 'react-native'
import type { NivelSeveridade } from '../api'
import { ESCALA_SEVERIDADE, ROTULO_SEVERIDADE, ordemSeveridade } from '../domain/severidade'
import { comAlfa, cores } from '../theme'
import { Texto } from './Texto'

// Mesmos tons do coffea-web, do mais leve (muito baixa) ao mais forte (muito alta).
const TONS = [cores.cereja100, cores.cereja100, comAlfa(cores.cereja500, 0.6), cores.cereja500, cores.cereja700]

/** Escala ordinal em 4 degraus (muito baixa → muito alta), sempre acompanhada do rótulo em texto. */
export function MedidorSeveridade({ nivel, compacto = false }: { nivel: NivelSeveridade; compacto?: boolean }) {
  const ordem = ordemSeveridade(nivel)
  const grave = ordem >= 3
  return (
    <View style={estilos.linha} accessible accessibilityLabel={`Severidade ${ROTULO_SEVERIDADE[nivel].toLowerCase()}`}>
      <View style={estilos.degraus}>
        {ESCALA_SEVERIDADE.slice(1).map((n, i) => (
          <View
            key={n}
            style={[
              estilos.degrau,
              { width: compacto ? 12 : 20, backgroundColor: i + 1 <= ordem ? TONS[ordem] : cores.papel2 },
            ]}
          />
        ))}
      </View>
      <Texto tipo="pequeno" numeros peso={grave ? 'semi' : undefined} cor={grave ? cores.cereja700 : cores.tinta}>
        {ROTULO_SEVERIDADE[nivel]}
      </Texto>
    </View>
  )
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  degraus: { flexDirection: 'row', gap: 2 },
  degrau: { height: 8, borderRadius: 4 },
})
