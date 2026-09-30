import { StyleSheet, View } from 'react-native'
import { CircleCheck, TriangleAlert } from 'lucide-react-native'
import { cores, raios } from '../theme'
import { Texto } from './Texto'

/** Rótulo de status junto da foto: a cor da moldura nunca é o único sinal. */
export function RotuloStatus({ saudavel, texto }: { saudavel: boolean; texto: string }) {
  const Icone = saudavel ? CircleCheck : TriangleAlert
  const cor = saudavel ? cores.folha700 : cores.cereja700
  return (
    <View style={[estilos.rotulo, { backgroundColor: saudavel ? cores.folha50 : cores.cereja50 }]}>
      <Icone size={16} color={cor} />
      <Texto tipo="pequeno" peso="medio" cor={cor}>
        {texto}
      </Texto>
    </View>
  )
}

const estilos = StyleSheet.create({
  rotulo: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: raios.pilula,
  },
})
