import { readFileSync } from 'fs'
import { join } from 'path'
import { detectarFormato, formatoAceito } from './formato'

const PASTA = join(__dirname, '..', 'assets', 'exemplos')
const cabecalho = (nome: string) => new Uint8Array(readFileSync(join(PASTA, nome)).subarray(0, 16))

/** Cabeçalho ISO-BMFF mínimo: tamanho da caixa + "ftyp" + marca. */
const ftyp = (marca: string) => new Uint8Array([0, 0, 0, 0x18, ...Buffer.from('ftyp'), ...Buffer.from(marca), 0, 0, 0, 0])

describe('detectarFormato', () => {
  it('reconhece as fotos de exemplo e as fixtures pelo conteúdo', () => {
    expect(detectarFormato(cabecalho('planta-cafe-doente.jpg'))).toBe('jpeg')
    expect(detectarFormato(cabecalho('teste-arquivo-grande.png'))).toBe('png')
    expect(detectarFormato(cabecalho('teste-formato-gif.gif'))).toBe('gif')
    expect(detectarFormato(cabecalho('teste-formato-webp.webp'))).toBe('webp')
  })

  it('não se deixa enganar pela extensão', () => {
    expect(detectarFormato(cabecalho('teste-extensao-trocada.png'))).toBe('desconhecido')
  })

  it('distingue HEIC (aceito) de AVIF e de vídeo', () => {
    expect(detectarFormato(ftyp('heic'))).toBe('heic')
    expect(detectarFormato(ftyp('mif1'))).toBe('heic')
    expect(detectarFormato(ftyp('avif'))).toBe('avif')
    expect(detectarFormato(ftyp('mp42'))).toBe('desconhecido')
  })
})

describe('formatoAceito', () => {
  it('aceita JPG, PNG e HEIC; recusa o resto', () => {
    expect(['jpeg', 'png', 'heic'].every((f) => formatoAceito(f as never))).toBe(true)
    expect(['gif', 'webp', 'avif', 'bmp', 'pdf', 'desconhecido'].some((f) => formatoAceito(f as never))).toBe(false)
  })
})
