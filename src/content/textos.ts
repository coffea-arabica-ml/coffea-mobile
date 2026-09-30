import type { TipoErroUpload } from '../api'

/**
 * O que pedir para o usuário fotografar. Segue o RF09 (v4): planta inteira.
 * Se a pendência do RF09 mudar o escopo para uma folha por foto, troque só este bloco.
 */
export const CAPTURA = {
  alvo: 'a planta inteira',
  instrucao:
    'Fotografe a planta de café inteira, de frente e com boa luz. Cada folha visível será analisada separadamente.',
  dicas: ['Luz natural, sem contraluz', 'A planta ocupando a maior parte do quadro', 'Celular firme, foto nítida'],
}

export interface TextoErro {
  /** Frase curta dentro do card. */
  rotulo: string
  titulo: string
  explicacao: string
  sugestao: string
}

/** Os 6 estados de erro (RF03 + RF07) — mesmos do coffea-web, com as sugestões pensadas para o celular. */
export const ERROS: Record<TipoErroUpload, TextoErro> = {
  planta_nao_identificada: {
    rotulo: 'Nenhuma planta à vista',
    titulo: 'Não encontramos uma planta nesta foto',
    explicacao:
      'A imagem não parece mostrar um cafeeiro, ou a planta está pequena ou escondida demais para ser reconhecida.',
    sugestao: 'Aproxime-se até a planta ocupar a maior parte do quadro e tente de novo.',
  },
  formato_invalido: {
    rotulo: 'Formato não suportado',
    titulo: 'Esse arquivo não é uma foto que conseguimos ler',
    explicacao: 'O Cafélens analisa fotos JPG ou PNG — as da câmera e da galeria do celular já funcionam.',
    sugestao: 'Escolha outra foto na galeria ou tire uma nova pela câmera.',
  },
  especie_incorreta: {
    rotulo: 'Não parece ser café',
    titulo: 'Essa planta não parece ser um cafeeiro',
    explicacao:
      'Encontramos uma planta, mas ela não tem as características de Coffea arabica — e o modelo só foi treinado com folhas de café.',
    sugestao: 'Confira se a foto é do cafeeiro certo e envie novamente.',
  },
  arquivo_muito_grande: {
    rotulo: 'Arquivo grande demais',
    titulo: 'Essa foto passa do limite de 10 MB',
    explicacao: 'Arquivos muito grandes demoram para enviar e não melhoram o diagnóstico.',
    sugestao: 'Tire uma nova foto pela câmera do app — ela já sai num tamanho que funciona.',
  },
  baixa_confianca: {
    rotulo: 'Diagnóstico inconclusivo',
    titulo: 'Não conseguimos concluir o diagnóstico',
    explicacao:
      'A foto tem pouca chance de mostrar um cafeeiro que dê para diagnosticar — ela pode estar escura, tremida ou distante.',
    sugestao: 'Tente outra foto com luz natural, sem movimento e com a planta ocupando a maior parte do quadro.',
  },
  erro_desconhecido: {
    rotulo: 'Algo deu errado',
    titulo: 'Não foi possível analisar agora',
    explicacao: 'Tivemos um problema de conexão ou no servidor. Sua foto não tem nada de errado.',
    sugestao: 'Verifique sua internet e tente de novo em alguns instantes.',
  },
}

export const AVISO_AGRONOMICO = 'O Cafélens é uma ferramenta de apoio e não substitui a avaliação de um engenheiro agrônomo.'

export const AVISO_DEMONSTRACAO = {
  selo: 'Demonstração',
  explicacao: 'O modelo de diagnóstico ainda não está conectado: os resultados exibidos são simulados.',
}
