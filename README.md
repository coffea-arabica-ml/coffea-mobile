# Cafélens — app mobile (`coffea-mobile`)

Versão mobile (Expo / React Native) do Cafélens: fotografe um cafeeiro e veja, folha por folha, sinais
de ferrugem, bicho-mineiro, cercosporiose e phoma, com a severidade estimada. É o mesmo produto do
`coffea-web`, com navegação, câmera e armazenamento nativos.

Enquanto o `coffea-backend` e o modelo não estão prontos, o app roda contra um **mock local**
(`src/api/mock/`) — os resultados são simulados, e o selo "Demonstração" no topo avisa isso.

## Stack

Expo **SDK 54** (React Native 0.81, React 19, TypeScript), React Navigation 7, Reanimated 4,
expo-image, expo-image-picker, expo-image-manipulator, expo-file-system e AsyncStorage.
Detalhes e decisões em [`CLAUDE.md`](CLAUDE.md) e em [`docs/frontend-reference/`](docs/frontend-reference/).

## Rodando no celular (Android)

O Expo Go das lojas só abre o SDK mais recente, e este projeto usa o SDK 54. Por isso:

1. No celular Android, instale o **Expo Go 54** pelo APK oficial: abra
   <https://expo.dev/go?sdkVersion=54&platform=android&device=true> e baixe o arquivo (o Android vai pedir
   para permitir a instalação de fontes desconhecidas).
2. No computador:

   ```bash
   npm install
   npx expo start
   ```

   Use sempre `npx expo`: o `expo-cli` global é legado e não funciona com o SDK 54.
3. Com o celular e o computador na **mesma rede Wi-Fi**, leia o QR code com o Expo Go 54. Se a rede
   bloquear a conexão (rede da faculdade, por exemplo), rode `npx expo start --tunnel`.

## Mock ou backend real

Copie `.env.example` para `.env` se quiser mudar o modo:

- `EXPO_PUBLIC_API_MODE=mock` (padrão): não precisa do backend.
- `EXPO_PUBLIC_API_MODE=http`: envia a foto para `EXPO_PUBLIC_API_URL`. Use o **IP local** da máquina
  que roda o `coffea-backend` (descubra com `ipconfig`), nunca `localhost` — o celular é outro aparelho.
  Rode o backend com `--host 0.0.0.0`.

Depois de mudar o `.env`, reinicie o `npx expo start`.

## Painel de cenários (só em desenvolvimento)

Toque no selo **Demonstração** no topo do app para:

- forçar qualquer um dos 12 cenários do mock (6 de sucesso e os 6 erros);
- mudar a latência (300 ms ou 8 s, para ver o aviso de demora);
- enviar as fixtures `teste-*` pelo fluxo real — GIF, WebP, `.png` falso e o arquivo de 19 MB são barrados
  pela verificação de verdade;
- rever a tela inicial.

O painel e as fixtures não entram no APK de produção.

## Scripts

```bash
npm run typecheck   # tsc --noEmit
npm test            # jest-expo: api/ e domain/ (normalização, mock, formato, geometria, resumo)
```

Para conferir se o bundle compila sem precisar de celular:

```bash
npx expo export --platform android          # produção
npx expo export --platform android --dev    # desenvolvimento (com painel e fixtures)
```

## APK para a apresentação

O perfil `preview` do [`eas.json`](eas.json) gera um APK instalável, que não depende do Expo Go:

```bash
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

O build roda na nuvem da Expo (conta gratuita basta). No fim, o EAS mostra um link/QR para baixar o APK.
O pacote Android é `com.coffeaarabicaml.cafelens` — troque em `app.json` **antes** do primeiro build, se
o time preferir outro.

## Roteiro de verificação no celular

1. 1º acesso: a tela inicial aparece; "Começar diagnóstico" leva à aba Enviar. Reabra o app: ele vai
   direto ao hub. Tocar no logo reabre a tela como "Sobre".
2. Abas Resumo e Visualizar com cadeado antes da primeira análise; tocar treme, vibra e avisa.
3. Exemplo **Com sinais**: carregamento com a lente passeando → borda cereja → Resumo com 2 problemas e
   7 folhas saudáveis → Visualização com os círculos sobre as folhas manchadas → tocar num círculo: a
   lente dá zoom na folha; deslize para a outra folha → Salvar → Histórico com o card destacado → abrir
   de novo → excluir.
4. Exemplo **Saudável**: borda verde; Visualização mostra "Nenhum problema identificado".
5. Painel: cada um dos 6 erros forçados, os cenários "1 folha sem região" e "N folhas, algumas sem
   região", e as fixtures de formato/tamanho.
6. Latência de 8 s: o aviso de demora aparece aos 6 s; Cancelar volta ao estado anterior.
7. Câmera de verdade (inclusive negando a permissão) e uma foto da galeria.
8. Feche o app por completo e abra de novo: o histórico e as miniaturas continuam lá.
9. Com o TalkBack ligado: os círculos são lidos como "Folha 1: Ferrugem, severidade alta".
10. Com "Remover animações" ligado e com a fonte do sistema no máximo.

## Estrutura

```
src/api/         contrato, verificação e preparação da foto, mock, adapter http, histórico
src/domain/      regras puras (resumo, severidade, geometria dos círculos e da lente)
src/content/     textos e catálogo das categorias
src/theme/       cores, tipografia, sombras e movimento (os mesmos do coffea-web)
src/state/       análise em foco e histórico
src/components/  UI reutilizável
src/navigation/  pilhas, abas e tipos das rotas
src/screens/     as telas T1–T10
src/dev/         painel de cenários (só em desenvolvimento)
```

## Contribuindo

Mesmas regras do coffea-web: branch por tarefa, commits no imperativo, PR obrigatório antes de merge na
`main`.
