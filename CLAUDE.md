# Coffea Mobile (Cafélens) — Contexto do Projeto

> Leia este arquivo por completo antes de qualquer tarefa. Os documentos citados abaixo, em
> `docs/frontend-reference/`, só devem ser abertos quando a tarefa específica exigir aquele nível de
> detalhe (requisitos, telas, contrato de API ou design/assets).

> ⚠️ Expo muda API rápido entre versões. Antes de escrever qualquer código, confira a documentação
> versionada do SDK realmente instalado (`npx expo --version` / `package.json`) em
> https://docs.expo.dev/versions/latest/ — não assuma comportamento de versões anteriores de memória.

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
Todo texto visível no app deve usar "Cafélens". O `app.json` ainda está com `name`/`slug`
`coffea-mobile` — isso é só identificador técnico do build, não precisa virar "Cafélens" ali.

## Fase atual: SÓ o app mobile, sem depender do backend real

Mesmo modelo "em escada" do `coffea-web`: o `coffea-backend` ainda é um esqueleto com resposta
simulada, e a Frente 9 (Modelagem) não confirmou se a detecção individual de folhas (RF09) é viável no
prazo. **Por isso, este app também é construído inteiro contra um serviço mock local**, isolado em
`src/api/`, seguindo o contrato descrito em `docs/frontend-reference/03-contrato-api-mock.md`. Quando o
backend real estiver pronto, só essa pasta muda.

## Pendência crítica que afeta toda a Frente 5 (leia antes de decidir estrutura de dados)

Igual ao `coffea-web`: o RF09 foi elevado a Essencial na v4 dos Requisitos, mas o dataset BRACOL não
sustenta detecção de múltiplas folhas numa foto, e isso pode virar mudança de escopo sujeita a
aprovação do professor. O contrato mock trata a resposta como uma **lista de folhas** (0, 1 ou N), cada
uma com localização (`regiao`) **opcional** — nenhum componente deve supor que sempre existe uma
localização nem que sempre existe mais de uma folha.

## O que já existe neste repositório (esqueleto inicial, ago/2026 — não é a referência)

O código atual (`App.tsx`, `src/pages/Tela*.tsx`, `src/api/diagnostico.ts`) implementa 5 telas lineares
chamando um backend real que devolve `{ categoria, severidade }` — a versão **antiga** do protótipo da
Frente 4, de antes da v4 dos Requisitos. É o mesmo estágio em que o `coffea-web` estava antes de ser
reconstruído. **Trate como ponto de partida descartável, não como especificação**: nada dele precisa
ser preservado — nem a máquina de estado do `App.tsx`, nem o contrato de `diagnostico.ts`, nem o texto
das telas.

## Stack e stack decisions (já fixadas, não renegociar sem motivo forte)

- Expo SDK 54, React Native 0.81, React 19, TypeScript. `expo-image-picker` já instalado (câmera e
  galeria — RF06).
- Navegação: `@react-navigation/native` — abas (`@react-navigation/bottom-tabs`) para o hub, mais uma
  pilha (`@react-navigation/native-stack`) aninhada na aba "Visualização avançada" para o Detalhe do
  problema, e apresentação `modal` para Salvar análise. (Nenhuma dessas dependências está instalada
  ainda — precisa adicionar.)
- Estilo: `StyleSheet.create` nativo, como já está no esqueleto — não introduzir Tailwind/NativeWind
  sem necessidade.
- Ícones: `lucide-react-native` (equivalente ao `lucide-react` usado no `coffea-web`), que depende de
  `react-native-svg` (versão 12 a 15).
- Fontes: `@expo-google-fonts/fraunces` e `@expo-google-fonts/instrument-sans` + `expo-font`, mesmas
  famílias do `coffea-web`.
- Histórico local (RF05): `@react-native-async-storage/async-storage` para metadados, `expo-file-system`
  para persistir a imagem reduzida/miniatura no diretório de documentos do app.
- Variáveis de ambiente: prefixo `EXPO_PUBLIC_` (não `VITE_`, que é do web) —
  `EXPO_PUBLIC_API_MODE` (mock|http, padrão mock) e `EXPO_PUBLIC_API_URL`.

## Estrutura de pastas alvo

```
coffea-mobile/
├── src/
│   ├── screens/       # Telas do hub e sub-telas (ver 02-fluxo-de-telas.md)
│   ├── navigation/     # Configuração do React Navigation (abas + pilha + modal)
│   ├── api/            # diagnostico.ts, tipos, validação, mock (ver 03-contrato-api-mock.md)
│   ├── assets/         # logo, fundos, fotos de exemplo — copiados do coffea-web
│   ├── content/        # textos.ts, categorias.ts — mesma ideia do coffea-web
│   └── dev/            # painel de cenários do mock, só em __DEV__
├── App.tsx
├── app.json
└── package.json
```
`src/pages/` (nome atual) deixa de existir — vira `src/screens/`, seguindo a convenção comum em apps
Expo/React Navigation.

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
3. Cor, tipografia e motivo visual (lente/círculo) **são os mesmos do coffea-web** — não redesenhar do
   zero. Os valores exatos (hex, pesos de fonte) devem ser copiados de `coffea-web/src/index.css`
   (bloco `@theme`), não reconstruídos de memória.
4. **Exceção de comportamento (RF04):** visualização explicativa usa círculos tocáveis por categoria,
   não mapa de calor — isso vem do requisito da Frente 3, mantém-se independente de plataforma.
5. **Toda suposição sobre o formato de dados do backend fica isolada em `src/api/`.**
6. Este arquivo e os documentos de `frontend-reference/` são vivos — atualize-os se uma decisão mudar.
