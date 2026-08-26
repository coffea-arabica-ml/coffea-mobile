# coffea-mobile

Versão mobile (React Native / Expo) do mesmo projeto do coffea-web.

## Stack
Expo (SDK 54, template blank-typescript) + expo-image-picker.

## Rodando localmente
\`\`\`bash
npm install
cp .env.example .env
# edite EXPO_PUBLIC_API_URL com o IP local de quem roda o coffea-backend
npx expo start
\`\`\`

⚠️ Não use "localhost" no `.env` — o celular é outro aparelho. Use o IP
local (via `ipconfig`) e rode o backend com `--host 0.0.0.0`. Celular e
computador precisam estar na mesma rede Wi-Fi.

## Estrutura
- `src/pages` — as mesmas 5 telas do coffea-web, em React Native
- `src/api` — chamada ao backend

## Contribuindo
Mesmas regras do coffea-web: branch por tarefa, commits no imperativo,
PR obrigatório antes de merge na `main`.
