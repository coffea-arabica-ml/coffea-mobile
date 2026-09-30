# Contrato de API — coffea-mobile (PROVISÓRIO, mock local)

> Os **tipos** abaixo são idênticos aos do `coffea-web` — copie de lá em vez de redigitar, pra não
> divergir por acidente. O que muda é a **implementação** do mock e da validação, porque o mobile lê
> arquivo de forma diferente do navegador.

Mesmo aviso do web: isto é uma suposição de trabalho, não uma especificação fechada pela Frente 6 nem
pela Frente 9. O backend real hoje devolve só `{ categoria, severidade }` (uma folha, sem lista, sem
localização) — o esqueleto atual do `coffea-mobile` já reflete exatamente esse formato antigo em
`src/api/diagnostico.ts`, o que confirma que ele precisa ser substituído, não estendido.

## Tipos (idênticos ao coffea-web)

```ts
// src/api/tipos.ts

export type CategoriaEstresse =
  | "saudavel"
  | "ferrugem"
  | "bicho_mineiro"
  | "cercosporiose"
  | "phoma";

export type NivelSeveridade =
  | "saudavel"
  | "muito_baixa"
  | "baixa"
  | "alta"
  | "muito_alta";

export type TipoErroUpload =
  | "planta_nao_identificada"
  | "formato_invalido"
  | "especie_incorreta"
  | "arquivo_muito_grande"
  | "baixa_confianca"
  | "erro_desconhecido";

export interface RegiaoFolha {
  x: number; // relativo (0 a 1), não pixel absoluto
  y: number;
  raio: number;
}

export interface FolhaDiagnostico {
  id: string;
  categoria: CategoriaEstresse;
  severidade: NivelSeveridade;
  regiao?: RegiaoFolha; // PROVISÓRIO — pode não vir preenchido
  comoCuidar?: string;
  comoPrevenir?: string;
}

export interface DiagnosticoSucesso {
  status: "sucesso";
  imagemUri: string; // no mobile é URI local (file://...), não uma URL de blob
  folhas: FolhaDiagnostico[];
}

export interface DiagnosticoErro {
  status: "erro";
  tipo: TipoErroUpload;
  mensagem: string;
}

export type DiagnosticoResponse = DiagnosticoSucesso | DiagnosticoErro;

export interface AnaliseSalva {
  id: string;
  titulo: string;
  criadoEm: string; // ISO date
  diagnostico: DiagnosticoSucesso;
}
```

## O que muda na implementação (vs. coffea-web)

| Aspecto | coffea-web | coffea-mobile |
|---|---|---|
| Origem da imagem | `File`/`Blob` do `<input>` ou `getUserMedia` | URI local (`file://...`) devolvida por `expo-image-picker` |
| Ler tamanho/bytes | `File.size`, leitura de magic bytes via `ArrayBuffer` | `expo-file-system` (`getInfoAsync` para tamanho; leitura de bytes só se for mesmo necessário replicar a checagem de magic bytes — ver nota abaixo) |
| Selecionar cenário de teste (dev) | `?cenario=` na URL | Não existe URL — usar uma tela/painel de dev (`src/dev/PainelCenarios.tsx`, só em `__DEV__`) com uma lista tocável de cenários |
| Variável de ambiente | `VITE_API_MODE`, `VITE_API_URL` | `EXPO_PUBLIC_API_MODE`, `EXPO_PUBLIC_API_URL` |
| Persistência do histórico | IndexedDB (`idb-keyval`) | `AsyncStorage` (metadados) + `expo-file-system` (imagem reduzida/miniatura) |

**Nota sobre validação de formato:** no web, validar o conteúdo real do arquivo (não só a extensão) é
importante porque um `<input type="file">` aceita literalmente qualquer arquivo que o usuário escolher.
No mobile, como a imagem sempre vem de `expo-image-picker` (câmera ou galeria do sistema), esse vetor de
ataque praticamente não existe — o picker já garante que é uma imagem de verdade. Ainda assim, mantenha
a validação de tamanho (10 MB) e o tipo `formato_invalido` no contrato, para robustez e para não deixar
a UI sem tratamento caso, no futuro, a imagem chegue por outro caminho (ex.: compartilhamento de arquivo
via intent do Android).

## Serviço mock (esqueleto)

```ts
// src/api/diagnostico.ts
import type { DiagnosticoResponse } from "./tipos";
import { resolverCenario } from "./mock/resolverCenario";

const ATRASO_SIMULADO_MS = 1500;

/**
 * Substitui a chamada real ao coffea-backend enquanto ele não estiver pronto.
 * Quando o backend real chegar, só esta função muda — a assinatura deve continuar igual.
 */
export async function enviarImagemParaDiagnostico(
  imagemUri: string,
  opcoes?: { signal?: AbortSignal; cenarioForcado?: string }
): Promise<DiagnosticoResponse> {
  await new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ATRASO_SIMULADO_MS);
    opcoes?.signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Cancelado", "AbortError"));
    });
  });

  return resolverCenario(imagemUri, opcoes?.cenarioForcado);
}
```

## Cenários calibrados (mesma lógica do coffea-web)

Reaproveite as mesmas imagens de teste do `coffea-web` (`teste-sem-planta.jpg`,
`teste-especie-incorreta.jpg`, `teste-baixa-qualidade.jpg`, `teste-arquivo-grande.png`,
`teste-retrato.jpg`, `teste-paisagem.jpg`, `teste-quadrada.jpg`, mais `planta-cafe-doente.jpg` e
`planta-cafe-saudavel.jpg`), copiadas para `src/assets/exemplos/` neste repositório. A resolução de
cenário por nome de arquivo conhecido → hash determinístico do arquivo (pra qualquer outra foto sempre
dar o mesmo resultado) é a mesma estratégia do web — só a leitura do arquivo muda (via
`expo-file-system` em vez de `File`/`FileReader`).

## Casos que a UI precisa suportar desde já

- Sucesso com 0, 1 ou N folhas problemáticas, com e sem `regiao`.
- Cada um dos 6 tipos de erro (`TipoErroUpload`).
- Cancelamento durante o carregamento (via `AbortSignal`).
- Latência simulada perceptível (a tela de carregamento precisa realmente aparecer).
