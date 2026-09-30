# Fluxo de telas — coffea-mobile

O **conteúdo** de cada tela (o que ela mostra, os 6 estados de erro, as 4 variações da Visualização
avançada) é o mesmo do `coffea-web` — são o mesmo produto. O que muda aqui é só a **mecânica de
navegação e captura de imagem**, porque não existem URL, histórico de navegador nem `getUserMedia` num
app nativo.

## Estrutura de navegação

Hub de abas (`@react-navigation/bottom-tabs`) — Histórico | Enviar foto | Resumo técnico | Visualização
avançada. "Resumo técnico" e "Visualização avançada" ficam bloqueadas (abas desabilitadas, com aviso ao
tocar) até existir uma análise bem-sucedida na sessão atual — igual ao web, mas aqui é o comportamento
nativo de aba desabilitada, não uma barra de rodapé simulada por CSS.

Dentro da aba "Visualização avançada" fica uma pilha (`@react-navigation/native-stack`):
`VisualizacaoLista → DetalheProblema`, para o "toca no círculo → tela de detalhe com botão voltar"
funcionar com a transição e o gesto nativos de push/pop, em vez de uma transição CSS como no web.

"Salvar análise" é uma tela com `presentation: 'modal'` na pilha, empilhada por cima de onde o usuário
estiver (Resumo, Visualização ou Detalhe) — equivalente ao `<dialog>` do web, mas como modal nativo.

## Telas

### T1 — Inicial
- Apresentação do projeto, texto curto, botão "Começar diagnóstico" que leva à aba Enviar foto.

### T2 — Enviar foto (estado vazio)
- Ilustração/placeholder indicando onde a foto vai aparecer.
- Texto explicando o processo e o limite ("JPG ou PNG, até 10 MB").
- Dois botões: **Tirar foto** (`ImagePicker.launchCameraAsync`) e **Escolher da galeria**
  (`ImagePicker.launchImageLibraryAsync`). Sem distinção desktop/mobile como no web — aqui é sempre
  dispositivo nativo.
- "Experimentar com um exemplo", usando as fotos de exemplo copiadas de `coffea-web/src/assets/exemplos/`.

### T3 — Carregando
- A foto enviada aparece com uma animação de varredura (mesmo motivo visual "lente" do web, em
  Reanimated ou Animated da própria RN). Botão Cancelar aborta a chamada (`AbortController` funciona
  igual em React Native).

### T4 — Sucesso
- Foto com borda verde (sem problema) ou vermelha (problema encontrado), com rótulo em texto — nunca só
  a cor, por acessibilidade.
- Botões de reenvio abaixo da foto.

### T5 — Erro (6 estados)
- Mesmo card com ícone e mensagem específica por tipo de erro (ver `01-requisitos-frontend.md`).
- No erro "desconhecido", "Tentar de novo" reenvia a mesma imagem sem pedir escolha de novo.

### T6 — Resumo técnico
- Uma ficha por folha: categoria e severidade, com medidor ordinal.
- Ações: ir para Visualização avançada, Salvar análise, nova análise.

### T7 — Visualização avançada (4 variações, igual ao web)
- (a) Com regiões: círculos tocáveis numerados sobre a foto + lista por categoria.
- (b) Sem regiões: mesma informação, sem posicionamento (lista simples).
- (c) Mista: círculos só onde houver região.
- (d) Saudável: foto, "nada identificado", orientação de cuidado geral, botão Salvar.

### T8 — Detalhe de um problema
- Tela empilhada (push) a partir de um toque no círculo. Foto ampliada na região (lente), nome da
  categoria, sintomas, "Como cuidar", "Como prevenir". Botão voltar nativo do cabeçalho/gesto do sistema
  substitui a "miniatura clicável" do web.
- Navegação anterior/próxima entre folhas, quando houver mais de uma.
- Botão Salvar análise.

### T9 — Salvar análise (modal)
- Campo de título, botões Salvar/Cancelar. Teclado abre automaticamente ao focar o campo.

### T10 — Histórico
- Lista (não precisa ser grid de 2 colunas como no web — uma coluna rolável é mais natural em tela
  estreita) de cards: título, resumo curto, data, miniatura.
- Tocar num card abre o Resumo técnico daquela análise sem reprocessar.
- Excluir com confirmação (mesma decisão tomada no coffea-web, fora do protótipo original).
- Vazio: mensagem central + CTA para enviar uma foto.

## Diferenças deliberadas em relação ao coffea-web

- Navegação por abas nativas em vez de barra de rodapé simulada — resultado visual parecido, mecanismo
  diferente.
- Sem modal de webcam: no mobile a câmera é sempre nativa via `expo-image-picker`, não existe o caso
  "sem câmera, cai pro seletor de arquivo" do desktop do web (todo dispositivo mobile-alvo tem câmera).
- Grid de histórico vira lista de uma coluna, mais adequada a telas estreitas — mesma informação por
  card.

## Mapa de navegação (resumo)

```
T1 (inicial) → aba Enviar foto (T2, vazio)
  → [tira foto / escolhe da galeria] → T3 (carregando)
    → [sucesso] → T4 (confirmado)
        → aba Resumo técnico → T6
        → aba Visualização avançada → T7
            → [toca num círculo, push] → T8 (detalhe)
                → [Salvar análise, modal] → T9
                    → [confirma] → aba Histórico com o card novo
    → [erro] → T5 (uma das 6 variações) → [nova tentativa] → T3
  → aba Histórico (a qualquer momento) → T10
      → [toca num card salvo] → T6 (Resumo técnico daquela análise)
```
