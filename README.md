# Cafélens — app mobile (`coffea-mobile`)

Versão mobile (Expo / React Native) do Cafélens: fotografe um cafeeiro e veja, folha por folha, sinais
de ferrugem, bicho-mineiro, cercosporiose e phoma, com a severidade estimada. É o mesmo produto do
`coffea-web`, com navegação, câmera e armazenamento nativos.

Por padrão, o app roda contra um **mock local** (`src/api/mock/`): os resultados são simulados, e o selo
"Demonstração" no topo avisa isso. Ele também pode enviar a foto ao `coffea-backend` real, que roda o
modelo do `coffea-ml` (ver "Mock ou backend real"). Esse modo foi testado num Android em 16/10/2026 (ver
"Teste no celular contra o backend").

## Baixar o app

A versão `v1.0.0` está publicada como release, com dois APKs:

- [`cafelens-apresentacao.apk`](https://github.com/coffea-arabica-ml/coffea-mobile/releases/latest/download/cafelens-apresentacao.apk):
  envia a foto ao servidor do projeto, que roda o modelo real. Depende de internet e de o servidor estar no ar.
- [`cafelens-demonstracao.apk`](https://github.com/coffea-arabica-ml/coffea-mobile/releases/latest/download/cafelens-demonstracao.apk):
  modo demonstração, com resultados simulados, sem precisar de internet.

Só Android; no iPhone, use o site: <https://coffea-web.vercel.app>. Para instalar, o Android pede para permitir a
instalação de fontes desconhecidas. Página da release:
<https://github.com/coffea-arabica-ml/coffea-mobile/releases/latest>. Para gerar os APKs, veja "APK para a
apresentação".

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

Por padrão (`EXPO_PUBLIC_API_MODE=mock`) o app **não precisa** do backend. Para usar o `coffea-backend`
real (`POST /diagnostico`, com o modelo do `coffea-ml`):

1. Deixe os repositórios lado a lado (`coffea-arabica-ml/coffea-mobile`, `coffea-backend` e `coffea-ml`,
   com os pesos do modelo) e suba o backend conforme o README dele, **com `--host 0.0.0.0`** — sem isso,
   ele só aceita conexões do próprio PC. Ele escuta na porta 8000.
2. Espere `http://localhost:8000/`, no navegador do PC, mostrar `"carregado": true` no bloco `modelo`
   (alguns segundos; se vier `false`, o campo `motivo` diz por quê, e o diagnóstico responde 503).
3. Descubra o **IP local** do PC com `ipconfig`: o "Endereço IPv4" do adaptador da rede local (Wi-Fi ou
   cabo), não o de VirtualBox, WSL ou VPN. Não use `localhost`: o celular é outro aparelho.
4. Copie `.env.example` para `.env` e preencha, com o seu IP:
   ```
   EXPO_PUBLIC_API_MODE=http
   EXPO_PUBLIC_API_URL=http://<IP do PC>:8000
   ```
5. Libere a porta 8000 no firewall do Windows: siga a seção "Celular na mesma rede: firewall do Windows"
   do README do `coffea-backend` (regra só no perfil Privado, removida depois da apresentação).
6. Deixe o celular e o PC na **mesma rede** (o celular no Wi-Fi; o PC no Wi-Fi ou no cabo do mesmo
   roteador), sem isolamento de clientes (comum em rede de faculdade: um aparelho não enxerga o outro; nesse
   caso, use o hotspot do celular ou outra rede). Para conferir, abra `http://<IP do PC>:8000/` no navegador
   do celular.
7. Depois de mudar o `.env`, reinicie com `npx expo start -c`.

O `--tunnel` só leva o app ao celular; a chamada ao backend continua indo direto ao IP do PC. O backend faz
uma inferência por vez; com fila, o app mostra o aviso de demora. O APK do perfil `apresentacao` usa o
backend de produção (https://api.coffealab.tech) e foi testado no celular em 21/10/2026; o do perfil
`preview` continua no mock (ver "APK para a apresentação"). O contrato e os códigos HTTP estão em
`docs/frontend-reference/03-contrato-api-mock.md`.

## Teste no celular contra o backend (16/10/2026)

Android com o Expo Go 54; backend no PC com `fastapi run app/main.py --host 0.0.0.0`; celular na mesma rede.

- **Testado e funcionando:**
  - os exemplos embutidos;
  - uma foto real da galeria;
  - a câmera, em retrato, com os círculos coerentes com a foto;
  - erro de rede (modo avião): com a rede de volta, "Tentar de novo" voltou a funcionar;
  - 503 (backend com `COFFEA_CARREGAR_MODELO=0`): a mensagem do servidor, "O diagnóstico está indisponível no
    momento. Tente de novo mais tarde.", e o botão "Tentar de novo".
- **Não testado:** o TalkBack.
- **413 e 415:** o app não os gera. Ele barra no aparelho o que não é JPG, PNG ou HEIC ou passa de 10 MB
  (`verificarImagem`) e regrava toda foto como JPEG de até 2048 px antes do envio (`prepararImagem`, ambos em
  `src/api/imagem.ts`). Só os testes automatizados (`src/api/http.test.ts`) cobrem esses dois códigos.
- **Contagem de folhas:** na mesma foto (`20190831_163104.jpg`, do BRACOT de treino), o celular devolveu 5
  folhas, e o PC (com a original ou com a reduzida pelo Pillow), 4. A folha com ferrugem é a mesma, com a
  mesma posição e o mesmo tamanho. A diferença é uma folha saudável colada no corte do modelo, que pode
  aparecer ou sumir conforme a redução da foto (±1; visto em 2 de 6 fotos no PC e na 163104 no celular).

## Dicas para testar no celular

- `.env` com `EXPO_PUBLIC_API_MODE=http` e `EXPO_PUBLIC_API_URL=http://<IP do PC>:8000`. Nunca `localhost`.
- Use o IP do adaptador da rede local (Wi-Fi ou cabo), não o de VirtualBox, WSL ou VPN.
- Depois de mudar o `.env`, reinicie com `npx expo start -c`.
- *Dica, não testada por nós:* se o Expo anunciar o IP errado, defina o certo antes do start, no PowerShell:
  `$env:REACT_NATIVE_PACKAGER_HOSTNAME="<IP do PC>"`.
- *Dica, não testada por nós:* se o leitor de QR do Expo Go falhar, libere a permissão de câmera do Expo Go
  ou use "Enter URL manually".

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
npm test            # jest-expo: api/, domain/ e content/ (normalização, http, mock, formato, geometria, resumo, textos de erro)
```

Para conferir se o bundle compila sem precisar de celular:

```bash
npx expo export --platform android          # produção
npx expo export --platform android --dev    # desenvolvimento (com painel e fixtures)
```

## APK para a apresentação

O [`eas.json`](eas.json) gera APKs instaláveis, que não dependem do Expo Go:

- **`apresentacao`**: `EXPO_PUBLIC_API_MODE=http` e `EXPO_PUBLIC_API_URL=https://api.coffealab.tech`, o backend
  de produção. Este APK foi instalado e testado no celular contra esse backend em 21/10/2026.
- **`preview`**: o mock (`EXPO_PUBLIC_API_MODE=mock`), para demonstrar sem internet.

```bash
npx eas-cli login
npx eas-cli build --platform android --profile apresentacao   # ou --profile preview
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
   lente dá zoom na folha; deslize para a outra folha → Salvar → Histórico com o card destacado e o título
   "Cafeeiro · dd/mm hh:mm" inteiro → abrir de novo → excluir.
4. Exemplo **Saudável**: borda verde; Visualização mostra "Nenhum problema identificado".
5. Painel: cada um dos 6 erros forçados, os cenários "1 folha sem região" e "N folhas, algumas sem
   região", e as fixtures de formato/tamanho.
6. Latência de 8 s: o aviso de demora aparece aos 6 s; Cancelar volta ao estado anterior.
7. Câmera de verdade (inclusive negando a permissão) e uma foto da galeria. No Resumo, "Arquivo" mostra
   "Foto da câmera" na câmera e o nome do arquivo na galeria.
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

O time trabalha direto na `main` (decisão do gestor, 16/10/2026). Quem é de fora contribui com fork e pull request.
Antes, leia o [guia de contribuição](https://github.com/coffea-arabica-ml/.github/blob/main/CONTRIBUTING.md), o
[código de conduta](https://github.com/coffea-arabica-ml/.github/blob/main/CODE_OF_CONDUCT.md) e a
[política de segurança](https://github.com/coffea-arabica-ml/.github/blob/main/SECURITY.md).

Como citar: veja o [`CITATION.cff`](CITATION.cff).

## Licença e código-fonte

O projeto é software livre sob a [AGPL-3.0](LICENSE). O código está em
[github.com/coffea-arabica-ml](https://github.com/coffea-arabica-ml): `coffea-web`, `coffea-mobile`, `coffea-backend` e
`coffea-ml`. Os modelos foram treinados com conjuntos de dados sob licença CC BY 4.0, com créditos e citações em
[`coffea-ml/data/README.md`](https://github.com/coffea-arabica-ml/coffea-ml/blob/main/data/README.md). Os links no
rodapé da tela inicial (que também é o "Sobre") cumprem a seção 13 da AGPL (oferecer o código a quem usa o serviço).
