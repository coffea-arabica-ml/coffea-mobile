import { Asset } from 'expo-asset'
import { File, Paths } from 'expo-file-system'
import { ImageManipulator, SaveFormat, type ImageRef } from 'expo-image-manipulator'
import { LIMITES } from './config'
import { detectarFormato, formatoAceito, NOMES_FORMATO, type FormatoDetectado } from './formato'
import type { DiagnosticoErro } from './types'

/** Foto como chegou (câmera, galeria, exemplo ou fixture), antes de qualquer verificação. */
export interface OrigemImagem {
  uri: string
  /** Nome original, quando o sistema informa; nos exemplos e fixtures, o nome do arquivo. */
  nomeArquivo?: string | null
}

/** Passou pela checagem rápida: formato aceito e dentro do limite de tamanho. */
export interface ArquivoVerificado {
  uri: string
  nomeArquivo: string
  tamanhoBytes: number
  formato: FormatoDetectado
}

/** Foto pronta para análise: decodificada e regravada em JPEG, com lado maior de até 2048 px. */
export interface ImagemLocal {
  uri: string
  largura: number
  altura: number
  nomeArquivo: string
  /** Tamanho do arquivo original, em bytes. */
  tamanhoBytes: number
  /** Derivada do conteúdo do arquivo original: a mesma foto sempre gera o mesmo resultado simulado. */
  semente: number
}

export type ResultadoVerificacao =
  | { ok: true; arquivo: ArquivoVerificado }
  /** Nome e tamanho acompanham o erro para o card mostrar qual arquivo foi recusado. */
  | { ok: false; erro: DiagnosticoErro; nomeArquivo: string; tamanhoBytes: number | null }

function erro(tipo: DiagnosticoErro['tipo'], mensagem: string): DiagnosticoErro {
  return { status: 'erro', tipo, mensagem }
}

export function ehErroDiagnostico(valor: unknown): valor is DiagnosticoErro {
  return typeof valor === 'object' && valor !== null && (valor as { status?: unknown }).status === 'erro'
}

function nomeDaUri(uri: string): string {
  return decodeURIComponent(uri.split(/[\\/]/).pop() ?? '') || 'foto'
}

function lerCabecalho(arquivo: File): Uint8Array {
  const leitor = arquivo.open()
  try {
    return leitor.readBytes(16)
  } finally {
    leitor.close()
  }
}

/**
 * Checagem rápida (milissegundos), feita antes de mostrar o carregamento — mesma ordem do
 * coffea-web: formato pelo conteúdo, depois tamanho. O backend também valida; isto só responde na hora.
 */
export function verificarImagem(origem: OrigemImagem): ResultadoVerificacao {
  const nomeArquivo = origem.nomeArquivo?.trim() || nomeDaUri(origem.uri)
  let arquivo: File
  let formato: FormatoDetectado
  try {
    arquivo = new File(origem.uri)
    formato = detectarFormato(lerCabecalho(arquivo))
  } catch {
    return { ok: false, erro: erro('formato_invalido', 'Não foi possível abrir o arquivo escolhido.'), nomeArquivo, tamanhoBytes: null }
  }
  const tamanhoBytes = arquivo.size

  if (!formatoAceito(formato)) {
    const mensagem =
      formato === 'desconhecido'
        ? 'O arquivo não é uma imagem reconhecida.'
        : `O arquivo é ${NOMES_FORMATO[formato]}; aceitamos apenas ${LIMITES.formatosRotulo}.`
    return { ok: false, erro: erro('formato_invalido', mensagem), nomeArquivo, tamanhoBytes }
  }

  if (tamanhoBytes > LIMITES.tamanhoMaximoBytes) {
    const mensagem = `O arquivo excede o limite de ${LIMITES.tamanhoMaximoRotulo}.`
    return { ok: false, erro: erro('arquivo_muito_grande', mensagem), nomeArquivo, tamanhoBytes }
  }

  return { ok: true, arquivo: { uri: arquivo.uri, nomeArquivo, tamanhoBytes, formato } }
}

/** FNV-1a de 32 bits. */
export function hashTexto(texto: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function sementeDe(arquivo: ArquivoVerificado): number {
  try {
    const md5 = new File(arquivo.uri).md5
    if (md5) return parseInt(md5.slice(0, 8), 16) >>> 0
  } catch {
    // sem md5, cai no nome + tamanho
  }
  return hashTexto(`${arquivo.nomeArquivo}|${arquivo.tamanhoBytes}`)
}

/**
 * Reduz a imagem para caber em `ladoMaximo` e grava como JPEG no cache.
 * Decodifica uma única vez: a redução parte do bitmap já carregado.
 */
export async function regravarComoJpeg(uri: string, ladoMaximo: number, compressao: number) {
  const refs: ImageRef[] = []
  try {
    const original = await ImageManipulator.manipulate(uri).renderAsync()
    refs.push(original)
    let final = original
    if (Math.max(original.width, original.height) > ladoMaximo) {
      final = await ImageManipulator.manipulate(original)
        .resize(original.width >= original.height ? { width: ladoMaximo } : { height: ladoMaximo })
        .renderAsync()
      refs.push(final)
    }
    return await final.saveAsync({ format: SaveFormat.JPEG, compress: compressao })
  } finally {
    // Libera os bitmaps na hora, sem esperar o coletor de lixo (fotos de 12 MP ocupam ~48 MB).
    for (const ref of refs) ref.release()
  }
}

/**
 * Decodifica e normaliza a foto: JPEG (converte HEIC), lado maior de até 2048 px.
 * Leva até ~1 s em fotos grandes — roda durante o carregamento.
 */
export async function prepararImagem(arquivo: ArquivoVerificado): Promise<ImagemLocal | DiagnosticoErro> {
  const semente = sementeDe(arquivo)
  try {
    const salva = await regravarComoJpeg(arquivo.uri, LIMITES.ladoMaximoEnvioPx, 0.9)
    return {
      uri: salva.uri,
      largura: salva.width,
      altura: salva.height,
      nomeArquivo: arquivo.nomeArquivo,
      tamanhoBytes: arquivo.tamanhoBytes,
      semente,
    }
  } catch {
    // Cabeçalho válido, mas conteúdo corrompido ou truncado.
    return erro('formato_invalido', 'Não foi possível abrir a imagem — o arquivo pode estar corrompido.')
  }
}

/**
 * Copia uma foto (ex.: a do histórico) para o cache, para ela continuar existindo depois que o
 * original for apagado. Devolve a nova URI.
 */
export function copiarParaCache(uri: string): string {
  const destino = new File(Paths.cache, `cafelens-${Date.now().toString(36)}.jpg`)
  new File(uri).copy(destino)
  return destino.uri
}

/** Apaga uma foto preparada que ninguém mais usa. Só mexe no cache: fotos do histórico ficam. */
export function descartarImagem(uri: string): void {
  try {
    if (!uri.startsWith(Paths.cache.uri)) return
    const arquivo = new File(uri)
    if (arquivo.exists) arquivo.delete()
  } catch {
    // o sistema limpa o cache sozinho de qualquer forma
  }
}

/** Foto empacotada no app (exemplos, fixtures de dev) como arquivo local, pronta para o mesmo fluxo. */
export async function origemDoPacote(modulo: number, nomeArquivo: string): Promise<OrigemImagem> {
  const [asset] = await Asset.loadAsync(modulo)
  if (!asset?.localUri) throw new Error(`Não foi possível carregar ${nomeArquivo}.`)
  return { uri: asset.localUri, nomeArquivo }
}
