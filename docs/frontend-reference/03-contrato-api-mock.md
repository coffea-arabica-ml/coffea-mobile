# Contrato de API — coffea-mobile (coffea-backend real e mock local)

> Os **tipos** abaixo são idênticos aos do `coffea-web` (exceto `imagemUri`) — mantenha os dois em
> sincronia. O que muda é a **implementação** da verificação, da preparação da foto e do mock, porque o
> celular lê arquivos de forma diferente do navegador.

O `POST /diagnostico` do coffea-backend implementa este contrato desde o commit `0e33bce` (inferência
real do coffea-ml).

- **O que foi conferido:** em 16/10/2026, o `coffea-web` foi testado de ponta a ponta contra esse backend:
  o formato de sucesso, os erros tipados e os códigos HTTP descritos abaixo. O `src/api/` deste app foi
  ajustado da mesma forma e coberto por testes de unidade (`http.test.ts`, `diagnostico.test.ts`,
  `normalizar.test.ts`).
- **No celular:** em 16/10/2026, o app foi testado num Android (Expo Go 54) contra o backend no PC. A foto
  foi reduzida a até 2048 px e enviada como JPEG (`FormData { uri, name, type }`). Exemplos, galeria, câmera
  em retrato, erro de rede e 503 funcionaram. Não testado: o TalkBack. Detalhes no `README.md`.

O mock local (`src/api/mock/`) segue o mesmo contrato e continua sendo o modo padrão, para trabalhar sem
backend.

## Tipos (`src/api/types.ts`)

Estes são os tipos já normalizados, que as telas recebem:

```ts
export type CategoriaEstresse = 'saudavel' | 'ferrugem' | 'bicho_mineiro' | 'cercosporiose' | 'phoma'

export type NivelSeveridade = 'saudavel' | 'muito_baixa' | 'baixa' | 'alta' | 'muito_alta'

export type TipoErroUpload =
  | 'planta_nao_identificada'
  | 'formato_invalido'
  | 'especie_incorreta' // no contrato e no mock; o backend não produz (ver abaixo)
  | 'arquivo_muito_grande'
  | 'baixa_confianca' // RF07
  | 'erro_desconhecido'

export interface RegiaoFolha {
  x: number // centro, relativo (0 a 1) à largura da imagem
  y: number // centro, relativo (0 a 1) à altura da imagem
  raio: number // relativo (0 a 1) à MENOR dimensão da imagem (círculo de mesma área da folha)
}

export interface FolhaDiagnostico {
  id: string
  categoria: CategoriaEstresse
  severidade: NivelSeveridade
  regiao?: RegiaoFolha // o backend preenche, mas continua opcional (normalizador, mock, análises salvas)
  comoCuidar?: string // o backend não envia; a UI usa o catálogo local
  comoPrevenir?: string
}

export interface DiagnosticoSucesso {
  status: 'sucesso'
  imagemUri: string // no mobile é URI local (file://...); o backend não envia foto
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

## O que o coffea-backend devolve (conferido no coffea-web em 16/10/2026)

**Sucesso** (HTTP 200), por exemplo:

```json
{"status": "sucesso",
 "folhas": [{"id": "folha-4", "categoria": "ferrugem", "severidade": "muito_baixa",
             "regiao": {"x": 0.4903, "y": 0.6606, "raio": 0.1449},
             "confianca": 0.9691, "scoreDeteccao": 0.9011, "caixa": [0.3808, 0.4716, 0.5858, 0.9068],
             "cortadaNaBorda": false}],
 "detalhes": {"plano": "deteccao", "...": "..."}}
```

- **Extras ignorados:** `confianca`, `scoreDeteccao`, `caixa`, `cortadaNaBorda` (por folha) e `detalhes`.
  O normalizador os descarta, e eles não chegam às telas nem ao histórico.
- **Sem `imagemUrl`:** o backend não guarda fotos. O normalizador usa a foto local.
- **`regiao`:** o centro é o centroide da máscara da folha, relativo à largura e à altura. O raio é o do
  círculo de mesma área, dividido pela menor dimensão (`coffea-ml/model/inferencia.py`, função
  `regiao_da_folha`), limitado a [0,01; 0,5]. As dimensões são as da foto já com a orientação EXIF aplicada.
  No app, a foto enviada é o JPEG regravado pelo `expo-image-manipulator`. No teste no celular (16/10/2026),
  com a câmera em retrato, os círculos ficaram coerentes com a foto.
- **Uma foto de uma folha só** (recorte, como as do BRACOL) volta como 1 folha com raio perto de 0,5. O selo
  numerado do círculo fica dentro da foto mesmo nesse caso (`seloDoCirculo`, em `src/domain/geometria.ts`).
- **Contagem de folhas ±1:** uma folha saudável colada no corte do modelo pode aparecer ou sumir conforme a
  redução da foto. Na `20190831_163104.jpg`, o celular recebeu 5 folhas, e o PC, 4, com a mesma folha com
  ferrugem (ver `README.md`).

**Erro:** `{"status": "erro", "tipo": ..., "mensagem": ...}`, com a mensagem em português. Os erros do
modelo podem trazer também `detalhes` (ignorado).

| HTTP | `tipo` | quando | como `src/api/http.ts` trata |
|---|---|---|---|
| 200 | `planta_nao_identificada` | o modelo não achou folha de café utilizável | repassa |
| 200 | `baixa_confianca` | todas as folhas abaixo do corte (RF07), ou só pedaços de folha | repassa |
| 200 | `formato_invalido` | começa como JPG/PNG, mas não decodifica | repassa |
| 200 | `arquivo_muito_grande` | mais de 64 megapixels | repassa |
| 413 | `arquivo_muito_grande` | arquivo acima de 10 MB | tipo pelo código, mensagem do corpo |
| 415 | `formato_invalido` | não é JPG nem PNG (magic bytes) | tipo pelo código, mensagem do corpo |
| 422 | `formato_invalido` | sem o campo `imagem`, ou arquivo vazio | repassa o tipo do corpo |
| 503 | `erro_desconhecido` | modelo indisponível | repassa o tipo do corpo |
| 500 | `erro_desconhecido` | erro inesperado | repassa o tipo do corpo |

- **413 e 415 no app:** o app não os gera. Ele barra no aparelho o que não é JPG, PNG ou HEIC ou passa de
  10 MB, e envia sempre um JPEG de até 2048 px. Só os testes automatizados (`http.test.ts`) cobrem esses
  dois códigos.
- **`especie_incorreta` não é produzido:** não há dados de outras plantas para treinar essa recusa. Ele
  continua no contrato, no mock e na tela, para o caso de vir a ser produzido.
- **Sem corpo do contrato** (ex.: um proxy devolvendo HTML): o 413 e o 415 seguem pelo código; os demais viram
  `erro_desconhecido`. Em todos, a mensagem fica vazia e a tela usa o próprio texto.

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
compartilhamento via intent do Android) e as fixtures de dev precisam demonstrar os 6 erros. O que ela
barra não chega ao backend.

## Serviço (`src/api/`)

```ts
// Checagem rápida (milissegundos), antes de mostrar o carregamento: formato pelos magic bytes, depois 10 MB.
verificarImagem(origem: { uri: string; nomeArquivo?: string | null }): ResultadoVerificacao

// Decodifica e normaliza (JPEG, lado maior ≤ 2048 px). Roda durante o carregamento.
prepararImagem(arquivo: ArquivoVerificado): Promise<ImagemLocal | DiagnosticoErro>

// Ponto único de entrada do diagnóstico. Nunca lança erro esperado; só rejeita com ErroCancelado.
enviarImagemParaDiagnostico(imagem: ImagemLocal, opcoes?: { signal?: AbortSignal }): Promise<DiagnosticoResponse>
```

- `EXPO_PUBLIC_API_MODE=mock` (padrão) usa `src/api/mock/`. Com `http`, `src/api/http.ts` envia a foto no
  campo `imagem` como `FormData { uri, name, type }` (sem `Content-Type` manual, para o boundary do
  multipart) para `EXPO_PUBLIC_API_URL/diagnostico` e repassa o contrato acima. O tempo limite é de 30 s, com
  um controlador próprio; falha de rede e tempo limite viram `erro_desconhecido`. Como subir o backend:
  `README.md`, "Mock ou backend real".
- Toda resposta, mock ou real, passa por `src/api/normalizar.ts` (copiado do web): coordenadas fora de 0–1
  descartam só a região, categorias desconhecidas são ignoradas, ids duplicados são corrigidos e campos fora do
  contrato são descartados. `imagemUri` é sempre a foto local: uma URL devolvida pelo servidor não serviria
  offline nem no histórico.
- **Mensagens na tela:** a tela de erro mostra a `mensagem` em `formato_invalido`, `arquivo_muito_grande` e
  `erro_desconhecido`; nos demais tipos, usa o texto do Cafélens (`explicacaoDoErro`, em
  `src/content/textos.ts`). Por isso, toda mensagem que `src/api/` produz é escrita para o usuário, em
  português, sem código HTTP nem texto de exceção — a exceção vai para o `console.error`. Sem mensagem (ex.:
  falha de conexão), a tela usa o texto padrão do tipo.
- As telas importam apenas de `src/api/index.ts`.
- **Histórico (RF05):** `src/api/historico.ts` — `listarAnalises`, `obterAnalise` (sem reprocessar),
  `salvarAnalise` e `apagarAnalise`. O app guarda as análises no aparelho (AsyncStorage, com as imagens em
  `Paths.document`). O coffea-backend tem um histórico (`GET /diagnosticos`), que o app não usa.

## Cenários calibrados (mesma lógica do coffea-web)

`src/api/mock/cenarios.ts` é cópia do web — mantenha os dois iguais. Ordem de resolução:

1. **Cenário forçado** pelo painel de dev: `saudavel`, `saudavel_sem_folhas`, `uma_folha_com_regiao`,
   `uma_folha_sem_regiao`, `varias_folhas`, `varias_folhas_mistas` e `erro:<tipo>`. Fica em memória até
   recarregar o app.
2. **Fotos conhecidas, pelo nome do arquivo:** `planta-cafe-doente` (ferrugem + cercosporiose, com
   círculos calibrados), `planta-cafe-saudavel` e `teste-retrato` (saudável), `teste-paisagem` (N folhas
   com região), `teste-quadrada` (1 folha sem região) e `teste-sem-planta`, `teste-especie-incorreta` e
   `teste-baixa-qualidade` (os erros correspondentes). As fotos de exemplo e as fixtures do painel levam o
   nome certo; fotos da galeria usam o nome original quando o sistema informa.
3. **Qualquer outra foto:** cenário de sucesso sorteado pela semente (md5).

Latência de 1,5–2,5 s, estável por foto; o painel força 300 ms ou 8 s (para ver o aviso de demora).
As fixtures de formato e tamanho (`teste-formato-*`, `teste-extensao-trocada.png`,
`teste-arquivo-grande.png`) são barradas pela verificação real, não pelo mock. A
`teste-extensao-trocada.png` é texto e o Metro se recusa a empacotá-la como imagem: o painel grava o
mesmo conteúdo no cache com esse nome na hora do envio.

As respostas do mock para as fixtures são roteiro de teste da tela, não o que o modelo devolve: no teste do
coffea-web contra o backend real, por exemplo, `teste-sem-planta` e `teste-baixa-qualidade` voltaram como
sucesso, e `teste-especie-incorreta`, como `baixa_confianca`.

## Casos que a UI suporta

- Sucesso com 0, 1 ou N folhas problemáticas, com e sem `regiao` (as 4 variações da T7).
- Cada um dos 6 tipos de erro (`TipoErroUpload`).
- Cancelamento durante o carregamento (via `AbortSignal`), voltando ao estado anterior.
- Latência perceptível (a tela de carregamento realmente aparece) e aviso depois de ~6 s — que também aparece
  quando o backend está com fila (ele faz uma inferência por vez).

O teste do coffea-web com o backend real não produziu sucesso com 0 folhas (uma imagem cinza lisa, gerada para
o teste, voltou como `planta_nao_identificada`), nem folha sem `regiao`. Esses dois casos continuam cobertos
pelo mock.
