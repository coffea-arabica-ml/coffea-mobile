export type FormatoDetectado = 'jpeg' | 'png' | 'heic' | 'avif' | 'gif' | 'webp' | 'bmp' | 'pdf' | 'desconhecido'

export const NOMES_FORMATO: Record<FormatoDetectado, string> = {
  jpeg: 'JPEG',
  png: 'PNG',
  heic: 'HEIC',
  avif: 'AVIF',
  gif: 'GIF',
  webp: 'WEBP',
  bmp: 'BMP',
  pdf: 'PDF',
  desconhecido: 'desconhecido',
}

/** Marcas ISO-BMFF (`ftyp`) das fotos HEIC/HEIF que iPhones e alguns Androids gravam. */
const MARCAS_HEIF = ['heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'mif1', 'msf1']

function comeca(bytes: Uint8Array, assinatura: number[], deslocamento = 0) {
  return assinatura.every((b, i) => bytes[deslocamento + i] === b)
}

function texto(bytes: Uint8Array, inicio: number, fim: number) {
  return String.fromCharCode(...bytes.subarray(inicio, fim))
}

/** Identifica o formato pelo conteúdo real do arquivo (magic bytes), nunca pela extensão. */
export function detectarFormato(bytes: Uint8Array): FormatoDetectado {
  if (comeca(bytes, [0xff, 0xd8, 0xff])) return 'jpeg'
  if (comeca(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png'
  if (comeca(bytes, [0x47, 0x49, 0x46, 0x38])) return 'gif'
  if (comeca(bytes, [0x52, 0x49, 0x46, 0x46]) && comeca(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return 'webp'
  if (comeca(bytes, [0x66, 0x74, 0x79, 0x70], 4)) {
    const marca = texto(bytes, 8, 12)
    if (MARCAS_HEIF.includes(marca)) return 'heic'
    if (marca === 'avif' || marca === 'avis') return 'avif'
    return 'desconhecido'
  }
  if (comeca(bytes, [0x42, 0x4d])) return 'bmp'
  if (comeca(bytes, [0x25, 0x50, 0x44, 0x46])) return 'pdf'
  return 'desconhecido'
}

/**
 * JPG e PNG, como no coffea-web, mais HEIC — o formato padrão das fotos de iPhone, que o usuário
 * nem sabe que está usando. O HEIC é convertido para JPEG antes do envio.
 */
export function formatoAceito(formato: FormatoDetectado): boolean {
  return formato === 'jpeg' || formato === 'png' || formato === 'heic'
}
