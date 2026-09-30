# Requisitos relevantes para o Frontend (baseado em Requisitos_CONSOLIDADO v4, 23/09/2026)

> Este documento é **compartilhado com o coffea-web** — os requisitos não mudam por plataforma, só a
> forma de implementar. Se este arquivo precisar de correção, corrija também no `coffea-web` (e
> vice-versa), para os dois não divergirem silenciosamente.

Fonte de verdade: documento-mestre da Frente 3. Este arquivo é um recorte, filtrado para o que a Frente
5 precisa implementar ou exibir. Em caso de dúvida, o documento original da Frente 3 prevalece.

## Requisitos Funcionais

| ID | Descrição | Prioridade | Observação para o front |
|---|---|---|---|
| RF01 | Classificar cada folha identificada na imagem da planta em: saudável, ferrugem, bicho-mineiro, phoma ou cercosporiose. | Essencial | Vem do backend/modelo; o front só exibe. |
| RF02 | Para cada folha classificada, estimar a severidade em escala ordinal: saudável, muito baixa, baixa, alta, muito alta. | Essencial | Vem do backend/modelo; o front só exibe. |
| RF03 | Permitir upload de imagem da planta e exibir o diagnóstico de cada folha em poucos segundos. Tratar 6 tipos de erro de upload (ver abaixo). | **Essencial — fluxo principal** | Isso é o que precisa funcionar primeiro, ponta a ponta, antes de qualquer coisa desejável. |
| RF04 | Exibir visualização explicativa: círculos tocáveis por categoria de estresse (não mapa de calor contínuo), cada um com cuidados e prevenção. Saída do modelo precisa ser localizável por folha e por categoria — **viabilidade ainda não confirmada pela Modelagem**. | Desejável | Construir de forma que degrade bem se `regiao` não vier preenchida (ver contrato mock). |
| RF05 | Manter histórico dos diagnósticos realizados por folha, consultável depois. | Desejável | Tela "Histórico", aba do hub; persistido localmente no dispositivo. |
| RF06 | Aceitar envio da imagem por câmera do dispositivo ou seleção de arquivo/galeria existente. Sempre uma imagem estática por vez (nunca vídeo contínuo). | Essencial | No mobile, os dois caminhos passam por `expo-image-picker` — não há distinção "desktop vs. celular" como no web. |
| RF07 | Sinalizar quando a imagem tiver baixa probabilidade de conter planta de café diagnosticável (confiança abaixo de limiar a definir pela Modelagem), sugerindo reenvio. | Desejável | Limiar exato ainda não definido — tratar como mais um estado/erro possível. |
| RF09 | Identificar individualmente cada folha visível na planta e gerar diagnóstico separado por folha, em vez de tratar múltiplas folhas como erro. | **Essencial (elevado de Desejável)** | ⚠️ Ver pendência técnica abaixo — ainda não confirmado como tecnicamente viável no prazo. |

## Requisitos Não Funcionais relevantes

| ID | Descrição | Prioridade |
|---|---|---|
| RNF02 | Resposta da demonstração (upload → diagnóstico) em até 5 segundos, em ambiente local. | Desejável |
| RNF03 | Detalhamento do RNF02: inferência por folha detectada em até 1s (com GPU) ou 2s (sem GPU). Sem garantia de GPU no ambiente de apresentação final. | Desejável |

## Os 6 tipos de erro de upload (RF03 + RF07)

O `coffea-web` resolveu uma divergência entre o Figma (que mostrava um 5º erro de baixa confiança) e o
documento de requisitos original (que só listava "erro desconhecido"): os dois foram mantidos, dando 6
estados no total. Siga a mesma lista aqui, para os dois apps tratarem erro do mesmo jeito:

1. **Nenhuma planta identificada** — a imagem não parece conter uma planta.
2. **Formato inválido** — arquivo não é uma imagem aceita. *(No mobile, via `expo-image-picker`, esse
   caso é bem mais raro que no web — a galeria/câmera do sistema já filtra pra imagens reais. Ainda
   assim, mantenha o tipo no contrato para consistência e para cobrir entradas fora do fluxo normal, como
   compartilhamento de arquivo via intent no Android.)*
3. **Espécie incorreta** — uma planta foi identificada, mas não é café.
4. **Arquivo acima do limite de tamanho** — upload excede o limite definido (10 MB, igual ao web).
5. **Baixa confiança (RF07)** — o modelo não tem confiança suficiente de que a imagem é diagnosticável.
6. **Erro desconhecido** — catch-all para falhas não previstas (rede, servidor, etc.).

## ⚠️ Pendência técnica crítica (RF09)

Mesma pendência do `coffea-web`: o dataset BRACOL só tem folhas recortadas individualmente, sem foto de
planta inteira nem anotação de localização de múltiplas folhas. Nenhuma frente confirmou ainda um
caminho técnico viável no prazo — pode virar mudança de escopo sujeita à aprovação do professor.

**Na prática para este repositório:** construa a UI de resultado assumindo uma **lista** de folhas (0,
1 ou N), nunca um objeto fixo. Não trave a Visualização avançada à existência de coordenadas — se
`regiao` vier ausente, degrade para uma lista simples de problemas identificados, sem tentar posicionar
círculos.
