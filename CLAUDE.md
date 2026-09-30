# Coffea Mobile (Cafélens) — Contexto do Projeto

> Leia este arquivo por completo antes de qualquer tarefa. Os documentos citados abaixo, em
> `docs/frontend-reference/`, só devem ser abertos quando a tarefa específica exigir aquele nível de
> detalhe (requisitos, telas, contrato de API ou design/assets).

> ⚠️ Expo muda API rápido entre versões. Antes de escrever qualquer código, confira a documentação
> versionada do SDK realmente instalado — **SDK 54**: https://docs.expo.dev/versions/v54.0.0/ — ou,
> melhor ainda, os tipos em `node_modules/<pacote>/build/*.d.ts`. Não assuma comportamento de outras
> versões de memória.

## O que é o projeto

Sistema acadêmico (UNIFRAN) que recebe uma foto de uma planta de café inteira, identifica cada folha
visível e classifica o estresse biótico de cada uma — saudável, ferrugem, bicho-mineiro, cercosporiose
ou phoma — com estimativa de severidade (saudável, muito baixa, baixa, alta, muito alta), via
aprendizado por transferência. Prazo final do projeto: **06/11/2026**.

Este é o app **mobile** (`coffea-mobile`) da Frente 5. Existe um irmão **web** (`coffea-web`), já
completo, que implementa o mesmo produto no navegador. Os dois compartilham os mesmos requisitos
(Frente 3) e a mesma decisão de design (Frente 4) — a ideia é que pareçam a mesma marca em duas
plataformas, não dois produtos diferentes.

O nome voltado ao usuário é **Cafélens** (não "coffea" — esse é só o nome técnico dos repositórios).
Todo texto visível no app usa "Cafélens", inclusive o `name` do `app.json`, que aparece sob o ícone,
nos pedidos de permissão e na lista de apps recentes. O `slug` (`coffea-mobile`) e o
`package`/`bundleIdentifier` (`com.coffeaarabicaml.cafelens`) são identificadores técnicos.

## Fase atual: app completo contra o mock local, sem depender do backend real

Mesmo modelo "em escada" do `coffea-web`: o `coffea-backend` ainda é um esqueleto com resposta
simulada, e a Frente 9 (Modelagem) não confirmou se a detecção individual de folhas (RF09) é viável no
prazo. **Por isso o app é construído inteiro contra um serviço mock local**, isolado em `src/api/`,
seguindo o contrato de `docs/frontend-reference/03-contrato-api-mock.md`. Quando o backend real
estiver pronto, só essa pasta muda (o adapter `http.ts` já existe e converte o formato atual).

## Pendência crítica que afeta toda a Frente 5 (leia antes de decidir estrutura de dados)

Igual ao `coffea-web`: o RF09 foi elevado a Essencial na v4 dos Requisitos, mas o dataset BRACOL não
sustenta detecção de múltiplas folhas numa foto, e isso pode virar mudança de escopo sujeita a
aprovação do professor. O contrato trata a resposta como uma **lista de folhas** (0, 1 ou N), cada
uma com localização (`regiao`) **opcional** — nenhum componente supõe que sempre existe uma
localização nem que sempre existe mais de uma folha (ver `src/domain/visualizacao.ts`).

## SDK, Expo Go e como rodar (decidido em 30/09/2026)

- O projeto **fica no Expo SDK 54** (RN 0.81, React 19.1), mesmo com o SDK 57 já estável e o 58 em
  beta. Não atualize o SDK sem combinar com o time.
- O Expo Go das lojas só abre o SDK mais recente. Para desenvolver, instale o **Expo Go 54** por APK
  no Android (link em https://expo.dev/go?sdkVersion=54&platform=android&device=true). **Alvo:
  Android primeiro**; iOS não pode quebrar, mas não é verificado.
- A apresentação usa um **APK próprio** (perfil `preview` do `eas.json`), que não depende do Expo Go.
- Nesta máquina de desenvolvimento não há emulador: a verificação local é `npm run typecheck`,
  `npm test` e `npx expo export --platform android` (com e sem `--dev`). O resto é no celular.
- Use `npx expo …` — o `expo-cli` global instalado na máquina é legado e não suporta o SDK 54.

## Stack e decisões (já fixadas, não renegociar sem motivo forte)

- Expo SDK 54, React Native 0.81, React 19, TypeScript estrito. New Architecture ligada.
- Navegação: React Navigation 7 — pilha raiz (`native-stack`) com a tela inicial, o hub de abas
  (`bottom-tabs`, barra própria em `navigation/BarraAbas.tsx`), a pilha aninhada da Visualização
  (lista → detalhe) e os modais (Sobre, Salvar análise, painel de dev).
- Estilo: `StyleSheet.create` nativo com os tokens de `src/theme/` — sem Tailwind/NativeWind.
- Ícones: `lucide-react-native` + `react-native-svg`.
- Fontes: `@expo-google-fonts/fraunces` e `@expo-google-fonts/instrument-sans`, importadas **peso a
  peso pelo subcaminho** (`@expo-google-fonts/fraunces/600SemiBold`) — o índice do pacote puxaria
  todos os pesos para o bundle. As instâncias são estáticas: não há o eixo `SOFT 100` do web.
- Animação: `react-native-reanimated` 4 (+ `react-native-worklets`); o `babel-preset-expo` já
  configura o plugin. As animações respeitam "Remover animações" do sistema.
- Imagens: `expo-image` (exibição), `expo-image-manipulator` (normaliza a foto para JPEG de até
  2048 px — inclusive HEIC do iPhone — e gera foto reduzida/miniatura do histórico).
- Histórico local (RF05): `@react-native-async-storage/async-storage` para metadados e
  `expo-file-system` (API nova: `File`, `Directory`, `Paths`) para as imagens em `Paths.document`.
- Também: `expo-haptics`, `expo-linear-gradient`, `expo-splash-screen`, `expo-asset`.
- Testes: `jest-expo`, só para lógica pura (`src/api`, `src/domain`).
- Variáveis de ambiente: `EXPO_PUBLIC_API_MODE` (mock|http, padrão mock) e `EXPO_PUBLIC_API_URL`.
- Hermes não tem `DOMException` nem `crypto.randomUUID`, e o `AbortSignal` do RN não tem
  `timeout`/`any`/`throwIfAborted`: use `src/api/cancelamento.ts` e `src/api/id.ts`.

## Estrutura de pastas

```
coffea-mobile/
├── src/
│   ├── api/          # ÚNICO lugar que conhece o formato do backend e a leitura de arquivos:
│   │                 # tipos, verificação (magic bytes/10 MB), preparação da foto, normalização,
│   │                 # adapter http, mock/ (cenários) e histórico. Telas importam só de api/index.ts
│   ├── domain/       # regras puras: análise, severidade, resumo, geometria, variação da T7
│   ├── content/      # textos.ts (microcopy, 6 erros) e categorias.ts (TODO frente-4)
│   ├── theme/        # cores (hex do coffea-web), tipografia, sombras, movimento
│   ├── state/        # SessaoAnalise (análise em foco), Historico, preferências locais
│   ├── components/   # UI reutilizável (MolduraImagem, Lente, CirculoFolha, SeletorImagem, Toast…)
│   ├── navigation/   # pilhas, abas, barra de abas, tipos das rotas, useExigeAnalise
│   ├── screens/      # TelaInicial, AbaEnviar, AbaResumo, AbaHistorico, ModalSalvarAnalise,
│   │                 # visualizacao/ (VisualizacaoLista, DetalheProblema)
│   ├── dev/          # PainelCenarios — só em __DEV__, fora do bundle de produção
│   └── assets/       # logo, fundos, fotos de exemplo e fixtures teste-* (copiados do coffea-web)
├── assets/           # só ícone, ícone adaptativo/monocromático, splash e favicon (app.json)
├── App.tsx           # fontes + splash + providers + NavigationContainer
├── app.json
└── eas.json          # perfil "preview" gera o APK da apresentação
```
Pastas em inglês, identificadores em português (mesma convenção do coffea-web).

## Documentos de referência

| Arquivo | Quando abrir |
|---|---|
| `docs/frontend-reference/01-requisitos-frontend.md` | Dúvida sobre o que é obrigatório vs. desejável, ou sobre os 6 tipos de erro — **idêntico ao do coffea-web**, é o mesmo produto |
| `docs/frontend-reference/02-fluxo-de-telas.md` | Implementar ou revisar qualquer tela, navegação ou estado visual |
| `docs/frontend-reference/03-contrato-api-mock.md` | Mexer em `src/api/`, tipos de dados, ou no serviço mock |
| `docs/frontend-reference/04-design-e-assets.md` | Precisar de cor, fonte, ícone ou imagem — a identidade visual é a mesma do coffea-web, só muda como é carregada |

## Regras não negociáveis

1. **Fluxo essencial (RF03) vem antes do desejável (RF04/RF05).**
2. **O coffea-web é referência de comportamento, não de código.** Onde os dois produtos precisam se
   comportar igual (o que cada tela mostra, os 6 estados de erro, o contrato de dados), siga o
   `coffea-web`. Onde a plataforma exige outra coisa (navegação, câmera, armazenamento local,
   tipografia), decida o equivalente nativo — não tente portar código React DOM/Vite diretamente.
   Módulos puros (tipos, normalização, cenários do mock, resumo) foram copiados e devem continuar
   iguais nos dois repositórios.
3. Cor, tipografia e motivo visual (lente/círculo) **são os mesmos do coffea-web** — não redesenhar do
   zero. Os valores exatos ficam em `src/theme/`, copiados de `coffea-web/src/index.css` (`@theme`).
4. **Exceção de comportamento (RF04):** visualização explicativa usa círculos tocáveis por categoria,
   não mapa de calor — isso vem do requisito da Frente 3, mantém-se independente de plataforma.
5. **Toda suposição sobre o formato de dados do backend fica isolada em `src/api/`.**
6. Este arquivo e os documentos de `frontend-reference/` são vivos — atualize-os se uma decisão mudar.
