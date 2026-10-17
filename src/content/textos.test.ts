import type { TipoErroUpload } from '../api'
import { ERROS, explicacaoDoErro, rotuloDoArquivo, tituloSugerido } from './textos'

const COM_MENSAGEM: [TipoErroUpload, string][] = [
  ['arquivo_muito_grande', 'A imagem tem 8200 x 8200 pixels (67,2 megapixels); o limite é 64,0 megapixels.'],
  ['formato_invalido', 'O arquivo é GIF; aceitamos apenas JPG ou PNG.'],
  ['erro_desconhecido', 'O diagnóstico está indisponível no momento. Tente de novo mais tarde.'],
]

const DO_MODELO: TipoErroUpload[] = ['planta_nao_identificada', 'especie_incorreta', 'baixa_confianca']

describe('explicacaoDoErro (tela de erro)', () => {
  it.each(COM_MENSAGEM)('%s: mostra a mensagem quando ela existe', (tipo, mensagem) => {
    expect(explicacaoDoErro(tipo, mensagem)).toBe(mensagem)
  })

  it.each(COM_MENSAGEM)('%s: sem mensagem, usa a explicação padrão', (tipo) => {
    expect(explicacaoDoErro(tipo, '')).toBe(ERROS[tipo].explicacao)
  })

  it.each(DO_MODELO)('%s: a mensagem do backend não substitui o texto do Cafélens', (tipo) => {
    expect(explicacaoDoErro(tipo, 'Nenhuma folha de café foi encontrada.')).toBe(ERROS[tipo].explicacao)
  })
})

describe('ERROS', () => {
  it('arquivo_muito_grande: título neutro, que serve aos 10 MB e aos 64 megapixels', () => {
    expect(ERROS.arquivo_muito_grande.rotulo).toBe('Acima do limite')
    expect(ERROS.arquivo_muito_grande.titulo).toBe('Essa foto é grande demais')
  })

  it('erro_desconhecido: a sugestão não manda só verificar a internet', () => {
    expect(ERROS.erro_desconhecido.sugestao).toBe('Se o problema continuar, verifique sua conexão ou volte daqui a pouco.')
  })
})

describe('tituloSugerido (salvar análise)', () => {
  // Datas montadas no fuso local: o teste não depende do fuso da máquina.
  it('dia/mês e hora:minuto, curto para a linha única do card', () => {
    expect(tituloSugerido(new Date(2026, 9, 16, 17, 41).toISOString())).toBe('Cafeeiro · 16/10 17:41')
  })

  it('completa com zero à esquerda', () => {
    expect(tituloSugerido(new Date(2026, 0, 5, 7, 3).toISOString())).toBe('Cafeeiro · 05/01 07:03')
  })
})

describe('rotuloDoArquivo (campo "Arquivo" do Resumo)', () => {
  it('foto da câmera: não mostra o nome interno', () => {
    expect(rotuloDoArquivo({ nomeArquivo: '3f9c2a71-5b0e-4d8a-9e1f-0c6b7a2d4e58.jpg', daCamera: true })).toBe('Foto da câmera')
  })

  it.each([
    ['galeria', { nomeArquivo: 'IMG_20261016_174100.jpg', daCamera: false }],
    ['registro antigo do histórico, sem a marca', { nomeArquivo: 'IMG_20261016_174100.jpg' }],
  ])('%s: mostra o nome do arquivo', (_caso, imagem) => {
    expect(rotuloDoArquivo(imagem)).toBe('IMG_20261016_174100.jpg')
  })
})
