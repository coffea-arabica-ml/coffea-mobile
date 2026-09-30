# Contrato de API — coffea-mobile (PROVISÓRIO, mock local)

> Os **tipos** abaixo são idênticos aos do `coffea-web` (exceto `imagemUri`) — mantenha os dois em
> sincronia. O que muda é a **implementação** da verificação, da preparação da foto e do mock, porque o
> celular lê arquivos de forma diferente do navegador.

Mesmo aviso do web: isto é uma suposição de trabalho, não uma especificação fechada pela Frente 6 nem
pela Frente 9. O backend real hoje devolve só `{ categoria, severidade }` (uma folha, sem lista, sem
localização); o adapter `src/api/http.ts` converte esse formato em uma lista de 1 folha sem região.

## Tipos (`src/api/types.ts`)

```ts
export type CategoriaEstresse = 'saudavel' | 'ferrugem' | 'bicho_mineiro' | 'cercosporiose' | 'phoma'

export type NivelSeveridade = 'saudavel' | 'muito_baixa' | 'baixa' | 'alta' | 'muito_alta'

export type TipoErroUpload =
  | 'planta_nao_identificada'
  | 'formato_invalido'
  | 'especie_incorreta'
  | 'arquivo_muito_grande'
  | 'baixa_confianca' // RF07
  | 'erro_desconhecido'

export interface RegiaoFolha {
  x: number // centro, relativo (0 a 1) à largura da imagem
  y: number // centro, relativo (0 a 1) à altura da imagem
  raio: number // PROVISÓRIO: relativo (0 a 1) à MENOR dimensão da imagem
}

export interface FolhaDiagnostico {
  id: string
  categoria: CategoriaEstresse
  severidade: NivelSeveridade
  regiao?: RegiaoFolha // PROVISÓRIO — pode não vir preenchido
  comoCuidar?: string
  comoPrevenir?: string
}

export interface DiagnosticoSucesso {
  status: 'sucesso'
  imagemUri: string // no mobile é URI local (file://...), não uma URL de blob
  folhas: FolhaDiagnostico[] // 0, 1 ou N; pode incluir folhas saudáveis
}

export interface DiagnosticoErro {
  status: 'erro'
  tipo: TipoErroUpload
  mensagem: string
}

export type DiagnosticoResponse = DiagnosticoSucesso | DiagnosticoErro

export interface AnaliseSalva {
  id: string
  titulo: string
  criadoEm: string // ISO date
  diagnostico: DiagnosticoSucesso
}
```

## O que muda na implementação (vs. coffea-web)

| Aspecto | coffea-web | coffea-mobile |
|---|---|---|
| Origem da imagem | `File`/`Blob` do `<input>` ou `getUserMedia` | URI local (`file://...`) do `expo-image-picker`; exemplos e fixtures viram `file://` via `expo-asset` |
| Ler tamanho/bytes | `File.size`, magic bytes via `ArrayBuffer` | API nova do `expo-file-system` (SDK 54): `new File(uri).size` e `new File(uri).open().readBytes(16)`. O antigo `getInfoAsync` foi para `expo-file-system/legacy` e não é usado |
| Formatos aceitos | JPG e PNG | JPG, PNG **e HEIC/HEIF** (padrão das fotos de iPhone) — o HEIC é convertido para JPEG antes do envio |
| Preparação da foto | não há (envia o arquivo) | toda foto aceita é decodificada e regravada em JPEG com lado maior de até 2048 px (`expo-image-manipulator`); se não decodificar → `formato_invalido` |
| Semente do sorteio do mock | nome + tamanho + data do arquivo | md5 do arquivo original (`File.md5`) — mesma foto, mesmo resultado |
| Cenário de teste (dev) | `?cenario=` e `?atraso=` na URL | painel `src/dev/PainelCenarios.tsx` (só em `__DEV__`), aberto tocando no selo "Demonstração" |
| Cancelamento | `AbortSignal` + `DOMException` | `AbortSignal` + `ErroCancelado` próprio (`src/api/cancelamento.ts`): o Hermes não tem `DOMException`, e o `AbortSignal` do RN não tem `timeout`/`any`/`throwIfAborted` |
| Variável de ambiente | `VITE_API_MODE`, `VITE_API_URL` | `EXPO_PUBLIC_API_MODE`, `EXPO_PUBLIC_API_URL` |
| Histórico | IndexedDB (`idb-keyval`) | AsyncStorage (`cafelens:historico:v1`) + arquivos em `Paths.document/analises/<id>/` (foto de 1600 px e miniatura de 360 px) |

**Sobre a validação de formato:** no web ela é importante porque um `<input type="file">` aceita
qualquer arquivo. No mobile a foto vem quase sempre do `expo-image-picker`, mas a verificação é a mesma
(magic bytes → 10 MB → decodificação): a imagem pode chegar por outro caminho no futuro (ex.:
compartilhamento via intent do Android) e as fixtures de dev precisam demonstrar os 6 erros.

## Serviço (`src/api/`)

```ts
// Checagem rápida (milissegundos), antes de mostrar o carregamento: formato pelos magic bytes, depois 10 MB.
verificarImagem(origem: { uri: string; nomeArquivo?: string | null }): ResultadoVerificacao

// Decodifica e normaliza (JPEG, lado maior ≤ 2048 px). Roda durante o carregamento.
prepararImagem(arquivo: ArquivoVerificado): Promise<ImagemLocal | DiagnosticoErro>

// Ponto único de entrada do diagnóstico. Nunca lança erro esperado; só rejeita com ErroCancelado.
enviarImagemParaDiagnostico(imagem: ImagemLocal, opcoes?: { signal?: AbortSignal }): Promise<DiagnosticoResponse>
```

- `EXPO_PUBLIC_API_MODE=mock` (padrão) usa `src/api/mock/`. Com `http`, `src/api/http.ts` envia
  `FormData { uri, name, type }` (sem `Content-Type` manual, para o boundary do multipart), com tempo
  limite de 30 s; 413 → `arquivo_muito_grande`, 415 → `formato_invalido`.
- Toda resposta, mock ou real, passa por `src/api/normalizar.ts` (copiado do web). `imagemUri` é sempre a
  foto local: uma URL devolvida pelo servidor não serviria offline nem no histórico.
- As telas importam apenas de `src/api/index.ts`.
- **Histórico (RF05):** `src/api/historico.ts` — `listarAnalises`, `obterAnalise` (sem reprocessar),
  `salvarAnalise` e `apagarAnalise`. Se o histórico passar para o backend (Frente 6), só esse arquivo muda.

## Cenários calibrados (mesma lógica do coffea-web)

`src/api/mock/cenarios.ts` é cópia do web — mantenha os dois iguais. Ordem de resolução:

1. **Cenário forçado** pelo painel de dev: `saudavel`, `saudavel_sem_folhas`, `uma_folha_com_regiao`,
   `uma_folha_sem_regiao`, `varias_folhas`, `varias_folhas_mistas` e `erro:<tipo>`. Fica em memória até
   recarregar o app.
2. **Fotos conhecidas, pelo nome do arquivo:** `planta-cafe-doente` (ferrugem + cercosporiose, com
   círculos calibrados), `planta-cafe-saudavel` e `teste-retrato` (saudável), `teste-paisagem` (N folhas
   com região), `teste-quadrada` (1 folha sem região, como o backend atual) e `teste-sem-planta`,
   `teste-especie-incorreta` e `teste-baixa-qualidade` (os erros correspondentes). As fotos de exemplo e
   as fixtures do painel levam o nome certo; fotos da galeria usam o nome original quando o sistema
   informa.
3. **Qualquer outra foto:** cenário de sucesso sorteado pela semente (md5).

Latência de 1,5–2,5 s, estável por foto; o painel força 300 ms ou 8 s (para ver o aviso de demora).
As fixtures de formato e tamanho (`teste-formato-*`, `teste-extensao-trocada.png`,
`teste-arquivo-grande.png`) são barradas pela verificação real, não pelo mock. A
`teste-extensao-trocada.png` é texto e o Metro se recusa a empacotá-la como imagem: o painel grava o
mesmo conteúdo no cache com esse nome na hora do envio.

## Casos que a UI suporta

- Sucesso com 0, 1 ou N folhas problemáticas, com e sem `regiao` (as 4 variações da T7).
- Cada um dos 6 tipos de erro (`TipoErroUpload`).
- Cancelamento durante o carregamento (via `AbortSignal`), voltando ao estado anterior.
- Latência simulada perceptível (a tela de carregamento realmente aparece) e aviso depois de ~6 s.
