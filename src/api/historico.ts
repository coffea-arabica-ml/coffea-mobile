import AsyncStorage from '@react-native-async-storage/async-storage'
import { Directory, File, Paths } from 'expo-file-system'
import { gerarId } from './id'
import { regravarComoJpeg, type ImagemLocal } from './imagem'
import { normalizarSucesso } from './normalizar'
import type { AnaliseSalva, DiagnosticoSucesso, FolhaDiagnostico } from './types'

/*
 * Repositório do histórico (RF05). Fica no aparelho, sem login: metadados no AsyncStorage e as
 * imagens em arquivos no diretório de documentos do app.
 * TODO(frente-6): se o histórico passar a morar no backend, só este arquivo muda — as telas
 * continuam usando listarAnalises/obterAnalise/salvarAnalise/apagarAnalise.
 */

const CHAVE = 'cafelens:historico:v1'
const PASTA = 'analises'

/** Formato gravado no AsyncStorage. */
interface Registro {
  versao: 1
  id: string
  titulo: string
  criadoEm: string
  nomeArquivo: string
  folhas: FolhaDiagnostico[]
  /** Dimensões da foto reduzida gravada (as regiões são relativas, então não mudam). */
  largura: number
  altura: number
  tamanhoBytes: number
  semente: number
}

/** Item leve para a lista do histórico. */
export interface ItemHistorico {
  id: string
  titulo: string
  criadoEm: string
  /** Diagnóstico com `imagemUri` apontando para a miniatura. */
  diagnostico: DiagnosticoSucesso
}

export interface AnaliseCarregada {
  analise: AnaliseSalva
  /** Foto completa (reduzida para 1600 px), no formato usado pela sessão. */
  imagem: ImagemLocal
}

const pastaDe = (id: string) => new Directory(Paths.document, PASTA, id)
const fotoDe = (id: string) => new File(Paths.document, PASTA, id, 'foto.jpg')
const miniaturaDe = (id: string) => new File(Paths.document, PASTA, id, 'miniatura.jpg')

function ehRegistro(r: unknown): r is Registro {
  if (typeof r !== 'object' || r === null) return false
  const x = r as Partial<Registro>
  return (
    x.versao === 1 &&
    typeof x.id === 'string' &&
    typeof x.titulo === 'string' &&
    typeof x.criadoEm === 'string' &&
    Array.isArray(x.folhas) &&
    typeof x.largura === 'number' &&
    typeof x.altura === 'number'
  )
}

async function lerRegistros(): Promise<Registro[]> {
  try {
    const bruto = await AsyncStorage.getItem(CHAVE)
    const lista: unknown = bruto ? JSON.parse(bruto) : []
    return Array.isArray(lista) ? lista.filter(ehRegistro) : []
  } catch {
    return []
  }
}

// Leitura-modificação-escrita em fila: duas gravações seguidas não se sobrescrevem.
let fila: Promise<unknown> = Promise.resolve()
function alterarRegistros(alterar: (lista: Registro[]) => Registro[]): Promise<void> {
  const tarefa = fila.then(async () => {
    const lista = await lerRegistros()
    await AsyncStorage.setItem(CHAVE, JSON.stringify(alterar(lista)))
  })
  fila = tarefa.catch(() => {})
  return tarefa
}

function diagnosticoDe(r: Registro, imagemUri: string): DiagnosticoSucesso {
  // Passa pelo mesmo saneamento das respostas da API: registros antigos ou corrompidos não quebram a tela.
  return normalizarSucesso({ folhas: r.folhas }, imagemUri)
}

function itemDe(r: Registro): ItemHistorico {
  return { id: r.id, titulo: r.titulo, criadoEm: r.criadoEm, diagnostico: diagnosticoDe(r, miniaturaDe(r.id).uri) }
}

/** Remove pastas de imagens sem registro (ex.: o app foi fechado no meio de um salvamento). */
let limpezaFeita = false
function limparPastasOrfas(registros: Registro[]) {
  if (limpezaFeita) return
  limpezaFeita = true
  try {
    const raiz = new Directory(Paths.document, PASTA)
    if (!raiz.exists) return
    const ids = new Set(registros.map((r) => r.id))
    for (const item of raiz.list()) {
      if (item instanceof Directory && !ids.has(item.name)) item.delete()
    }
  } catch {
    // limpeza é só higiene; falhar aqui não pode impedir a lista de abrir
  }
}

// ---------- API pública ----------

export async function listarAnalises(): Promise<ItemHistorico[]> {
  const registros = await lerRegistros()
  limparPastasOrfas(registros)
  return registros.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)).map(itemDe)
}

/** Carrega uma análise salva com a foto completa, sem reprocessar. */
export async function obterAnalise(id: string): Promise<AnaliseCarregada | null> {
  const r = (await lerRegistros()).find((x) => x.id === id)
  if (!r) return null
  const foto = fotoDe(id)
  if (!foto.exists) return null
  return {
    analise: { id: r.id, titulo: r.titulo, criadoEm: r.criadoEm, diagnostico: diagnosticoDe(r, foto.uri) },
    imagem: {
      uri: foto.uri,
      largura: r.largura,
      altura: r.altura,
      nomeArquivo: r.nomeArquivo,
      tamanhoBytes: r.tamanhoBytes,
      semente: r.semente,
    },
  }
}

async function gravarReduzida(origem: string, ladoMaximo: number, compressao: number, destino: File) {
  const salva = await regravarComoJpeg(origem, ladoMaximo, compressao)
  new File(salva.uri).move(destino)
  return salva
}

export async function salvarAnalise(dados: {
  titulo: string
  diagnostico: DiagnosticoSucesso
  imagem: ImagemLocal
  realizadaEm: string
}): Promise<ItemHistorico> {
  const id = gerarId()
  const pasta = pastaDe(id)
  pasta.create({ intermediates: true, idempotent: true })
  try {
    // Foto reduzida para guardar (como no web) e uma miniatura para a lista.
    const foto = await gravarReduzida(dados.imagem.uri, 1600, 0.86, fotoDe(id))
    await gravarReduzida(fotoDe(id).uri, 360, 0.8, miniaturaDe(id))

    const registro: Registro = {
      versao: 1,
      id,
      titulo: dados.titulo.trim(),
      criadoEm: dados.realizadaEm,
      nomeArquivo: dados.imagem.nomeArquivo,
      folhas: dados.diagnostico.folhas,
      largura: foto.width,
      altura: foto.height,
      tamanhoBytes: dados.imagem.tamanhoBytes,
      semente: dados.imagem.semente,
    }
    await alterarRegistros((lista) => [registro, ...lista])
    return itemDe(registro)
  } catch (e) {
    try {
      pasta.delete()
    } catch {
      // a limpeza de órfãs cuida disso na próxima abertura
    }
    throw e
  }
}

export async function apagarAnalise(id: string): Promise<void> {
  await alterarRegistros((lista) => lista.filter((r) => r.id !== id))
  try {
    const pasta = pastaDe(id)
    if (pasta.exists) pasta.delete()
  } catch {
    // sem o registro a pasta vira órfã e é removida na próxima abertura
  }
}
