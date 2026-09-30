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
| Fontes | `@fontsource-variable/fraunces`, `@fontsource-variable/instrument-sans` (CSS) | `@expo-google-fonts/*` + `expo-font`, carregadas com `useFonts` enquanto a splash segura a tela. Cada peso é importado pelo subcaminho (`@expo-google-fonts/fraunces/600SemiBold`) e é uma família própria (no Android, `fontWeight` não troca o arquivo) — ver `src/theme/tipografia.ts` |
| Ícones | `lucide-react` | `lucide-react-native` + `react-native-svg` |
| Cores/tokens | variáveis CSS em `@theme` | `src/theme/` — mesmos hex, sombras copiadas via `boxShadow` do RN (New Architecture), raio 24 |
| Animações | CSS + View Transitions | `react-native-reanimated` 4 com as mesmas durações e curvas (`src/theme/movimento.ts`): varredura da lente, zoom círculo → lente, tremida das abas bloqueadas, entrada `surgir` em cascata. Respeitam "Remover animações" do sistema |
| Imagens | `<img>` | `expo-image` (fade de entrada, fotos grandes); a moldura tem a proporção exata da foto, para os círculos caírem no lugar certo |

**Diferença conhecida:** as instâncias estáticas da Fraunces não têm o eixo `SOFT 100` que o web usa nos
títulos (serifas levemente mais "duras"). Se incomodar, dá para gerar uma instância com
`fonttools varLib.instancer` e carregar pelo `useFonts`.

## Assets

Copiados de `coffea-web/src/assets/` para `coffea-mobile/src/assets/` (mesmos arquivos):

- `logo-cafelens.png` (tem transparência)
- `fundo-1.jpg`, `fundo-2.jpg`, `fundo-3.jpg` — a landing usa o `fundo-1`
- `exemplos/planta-cafe-doente.jpg`, `exemplos/planta-cafe-saudavel.jpg` — "Experimente com um exemplo"
- `exemplos/teste-*` (as 10 fixtures) — só no painel de dev, fora do bundle de produção

Em `assets/` (raiz) ficam só os arquivos que o `app.json` usa, gerados a partir do logo em 30/09/2026:
`icon.png` (logo sobre o papel `#f5f3ec`), `adaptive-icon.png` (logo na zona segura),
`adaptive-icon-monochrome.png` (ícone temático do Android 13+), `splash-icon.png` (splash sobre
`#f5f3ec`) e `favicon.png`. Se a Frente 4 produzir ícones próprios, basta substituir os arquivos.

## O único ponto ainda não resolvido (igual ao web)

Textos agronômicos definitivos de "Como cuidar" e "Como prevenir" por categoria — seguem marcados
`TODO(frente-4)` também aqui, esperando validação de um especialista. Não é bloqueante para começar a
implementação.
