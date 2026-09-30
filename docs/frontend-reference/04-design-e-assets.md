# Design e assets — coffea-mobile

A identidade visual **é a mesma do coffea-web** — mesma marca, duas plataformas. Nada aqui é decisão
nova; é a mesma decisão, com outra forma de carregar.

## Identidade (herdada do coffea-web, não redesenhar)

- Conceito "lente de campo": o círculo da marca Cafélens e os círculos do RF04 viram o motivo visual do
  app — foto, círculos numerados, detalhe como lente ampliada.
- Paleta: base de papel quente + verde do logo, vermelho-cereja para "sinais encontrados", cores de
  categoria pensadas pra daltonismo (cada círculo tem número, a cor nunca é o único sinal).
  **Os valores hex exatos devem ser copiados de `coffea-web/src/index.css` (bloco `@theme`)** — não
  foram reproduzidos aqui de memória, pra evitar um tom levemente diferente entre os dois apps.
- Tipografia: Fraunces (títulos) + Instrument Sans (texto), números tabulares.
- Landing escura com foto de fundo em tela cheia; resto do app claro, pra leitura ao sol.

## Como carregar cada coisa no Expo (diferente do web, mesmo resultado)

| Item | coffea-web | coffea-mobile |
|---|---|---|
| Fontes | `@fontsource-variable/fraunces`, `@fontsource-variable/instrument-sans` (CSS) | `@expo-google-fonts/fraunces` + `@expo-google-fonts/instrument-sans` + `expo-font`, carregadas com `useFonts` antes de renderizar a árvore principal |
| Ícones | `lucide-react` | `lucide-react-native` (precisa de `react-native-svg`, versão 12 a 15, como peer dependency) |
| Cores/tokens | variáveis CSS em `@theme` | constantes TS num `src/theme.ts` (ou `useColorScheme` se o app ganhar modo escuro) — copiar os mesmos valores hex |
| Animações | CSS + View Transitions | `Animated` ou `react-native-reanimated` para a varredura da lente e as transições de tela |

## Assets a copiar do coffea-web (mesmos arquivos, não refazer)

De `coffea-web/src/assets/` para `coffea-mobile/src/assets/`:

- `logo-cafelens.png`
- `fundo-1.jpg`, `fundo-2.jpg`, `fundo-3.jpg`
- `exemplos/planta-cafe-doente.jpg`, `exemplos/planta-cafe-saudavel.jpg`
- `exemplos/teste-*` (os 10 arquivos de teste — ver `03-contrato-api-mock.md`)

Os ícones do app (`assets/icon.png`, `assets/adaptive-icon.png`, `assets/splash-icon.png`,
`assets/favicon.png`) já existem no esqueleto do Expo com os placeholders padrão — esses sim precisam
ser refeitos com a marca Cafélens (o `logo-cafelens.png` como base), porque não têm equivalente no
coffea-web (o navegador não usa ícone de app/splash screen do jeito que um app instalado usa).

## O único ponto ainda não resolvido (igual ao web)

Textos agronômicos definitivos de "Como cuidar" e "Como prevenir" por categoria — seguem marcados
`TODO(frente-4)` também aqui, esperando validação de um especialista. Não é bloqueante para começar a
implementação.
