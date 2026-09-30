import AsyncStorage from '@react-native-async-storage/async-storage'

// Preferências locais do app (não têm relação com o backend, por isso ficam fora de src/api/).
const CHAVE_BOAS_VINDAS = 'cafelens:boas-vindas-vistas'

/** A tela inicial (T1) aparece só no primeiro acesso; depois fica em "Sobre o Cafélens". */
export async function jaViuBoasVindas(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(CHAVE_BOAS_VINDAS)) === '1'
  } catch {
    return false
  }
}

export async function marcarBoasVindasVistas(): Promise<void> {
  try {
    await AsyncStorage.setItem(CHAVE_BOAS_VINDAS, '1')
  } catch {
    // no pior caso, a tela inicial aparece de novo na próxima abertura
  }
}

/** Painel de dev: volta a mostrar a tela inicial na próxima abertura. */
export async function esquecerBoasVindas(): Promise<void> {
  await AsyncStorage.removeItem(CHAVE_BOAS_VINDAS)
}
