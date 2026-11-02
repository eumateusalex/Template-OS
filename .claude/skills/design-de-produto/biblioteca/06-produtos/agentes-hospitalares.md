# Painel de agentes hospitalares

**A série mais completa.** Tem o vídeo de referência do clique entre telas e a peça de
imagem que serve de modelo para a receita do shot.

| Campo | Valor |
|---|---|
| Nome | Painel de agentes hospitalares (legenda: o nome do produto e a categoria, gestão de agentes de IA) |
| Setor | observabilidade e gestão de agentes de IA em produção |
| Para quem | time de plataforma que roda vários agentes (o avatar diz "Platform Team · Owner · acme-ai"); nos vídeos a legenda põe o caso na governança hospitalar |
| Tema | claro, fundo da página `#F8F9FB`, cartões `#FFFFFF` **[MEDIDO]** |
| Plataforma | web desktop (1440) |
| Acento | azul `#2864E9` (aba ativa, rail ativo, botão principal) **[MEDIDO]** |
| Cores de status | verde `#30D08A`, roxo `#A279DF`, azul-claro `#8CB7FB`, amarelo `#F8D043` (cartão "Do first") **[MEDIDO]** |

## Navegação

Duas camadas, **as duas flutuando** como peças separadas sobre o fundo:

1. **Topo em pílulas**: logo em pílula própria à esquerda; pílula central com
   6 abas (Overview, Workflows, Live Map, Traces, Incidents, Insights), a ativa
   preenchida de azul; à direita, pílula "● Live" + seletor "30 min", pílula de
   busca e sino, e pílula do usuário com avatar em gradiente coral.
2. **Rail vertical só de ícones** à esquerda (≈66 px de largura em tela
   1440) **[MEDIDO]**, dividido em três ilhas: tema claro/escuro no alto,
   6 ícones de seção no meio (o ativo é um círculo azul cheio), ajuda e sair
   no pé.

![topo flutuante](../galeria/04-tipos-de-tela/dashboard-topo-flutuante.jpg)

## Módulos / telas

| Tela | O que tem |
|---|---|
| Overview "We found your system" | linha do tempo de agentes (5 linhas × 15 colunas de 15 s), barras de estado coloridas com pílula "Healthy/Pending", colunas hachuradas = tempo sem dado; embaixo 3 cartões: Next steps (cartão amarelo "Do first"), Detected (4 contadores com % de confiança), assistente "Welcome, [nome]" com orbe azul e perguntas sugeridas |
| Live Agent Map | grafo de agentes (nós = cartões com nome, chamadas e % sucesso; borda tracejada amarela = degradado, vermelha = falhando), filtros em pílula (Failures, Slow agents, High cost, Loops, Context loss), tabela "Live handoffs" e painel lateral do nó selecionado (6 KPIs, checklist de campos do handoff com o faltante em vermelho) |
| Trace | 6 KPIs no topo (Duration, Agents invoked, Tokens, Cost, Failed at, Root cause), waterfall de execução, fluxo de contexto entre agentes, painel "Invocation detail" com erro |
| Incident timeline | linha do tempo vertical com círculos verde/amarelo, "How this is ranked", economias aplicadas no trimestre |
| Overview com gauge | gauge "Health 94", 4 KPIs com sparkline, grafo "Live agent network" |
| Data Coverage | tela de cobertura de dados |
| Cartões soltos | cartões pequenos isolados em close (legenda: informação organizada, mesmo em cartões pequenos) |

![overview](../galeria/05-apresentacao/shot-4x3-cinza-sangria.jpg)
![live map](../galeria/06-produtos/live-map.jpg)
![trace](../galeria/06-produtos/trace-tela.jpg)

## Componentes-chave

- **Linha do tempo de agentes** com coluna "agora" em azul cheio e linha
  tracejada vertical descendo dela; barras de estado com ícone em círculo branco
  à esquerda e pílula de status branca à direita.
- **Célula hachurada** (listras diagonais cinza `#EAEAF2`) para "sem evento".
- **Cartão "Do first"** amarelo: a única superfície de cor chapada da tela,
  reservada para a ação prioritária.
- **Orbe de assistente** (esfera azul com gradiente) + saudação em 2 linhas
  centralizadas + chips de ação + perguntas sugeridas com ícone de brilho roxo.
- **Pílula de confiança** ("92% confidence", "2 unverified") sob cada contador:
  a IA diz o quanto tem certeza.
- **Cartões destacados ao lado da tela** (a composição do shot de Traces): a linha do
  tempo do incidente, com bolinha verde ou âmbar e hora em coluna, e o "How this is
  ranked", que explica o critério da IA (High ≥1.000 runs, Medium ≥100, Low "verify
  before acting") e soma a economia já aplicada ("−$312 / mo").

![cartões destacados do trace](../galeria/06-produtos/card-destacado.jpg)

## O que é específico deste setor

O produto responde "o que meus agentes estão fazendo agora e onde quebrou".
Por isso quase toda tela tem **tempo** (linha do tempo, waterfall, "streaming ·
last 60 s") e **causa raiz nomeada** ("Context loss · authorization_scope").
Vocabulário técnico de verdade (handoff, context KB, tokens, framework de agentes, modelo de linguagem)
aparece sem explicação: o público é engenheiro. **[OBSERVADO]**

## Como reproduzir

- Tela 1440 × 1080, fundo `#F8F9FB`, cartões brancos com raio ≈24 px e
  padding ≈24-32 px, sem sombra (ou sombra muito difusa só no orbe).
- Topo em pílulas brancas de altura ≈48 px, raio total; aba ativa `#2864E9`
  com texto branco.
- Rail de ícones de 64-68 px em ilhas brancas arredondadas.
- Título da tela em ≈36-40 px, peso regular (não bold), subtítulo cinza ≈14 px.
- Status: verde `#30D08A`, roxo `#A279DF`, azul `#8CB7FB`, amarelo `#F8D043`,
  vermelho só para falha.

## Mais telas da série

Nas 14 peças seguintes (mais 2 de cartões de recurso no mesmo traço), o painel de agentes hospitalares ganha a
**landing quadrada** (4096×4096), com o título da observabilidade do espaço entre os agentes, a
comparação de contexto do handoff Router → Billing campo a campo, o padrão
"Delegation loop" com a regra de detecção e o limiar, o popup de notificações, a tabela de agentes, o
trace com a cascata de execução, o mapa vivo, o Cost Intelligence apresentado sobre cena cinza com
formas em perspectiva, e dois vídeos (o de lançamento com título cinético e o de clique do mapa ao
trace). Três cartões de recurso isolados (Cost per edge, Replay on 30 days, Loop detection) viram peça
própria e um deles, vídeo de 4:5.


![landing mapa de agentes](../galeria/04-tipos-de-tela/landing-mapa-de-agentes.jpg)
![comparacao de contexto handoff](../galeria/03-padroes-de-ia/comparacao-de-contexto-handoff.jpg)
![padrao loop de delegacao](../galeria/03-padroes-de-ia/padrao-loop-de-delegacao.jpg)
![popup notificacoes](../galeria/02-componentes/popup-notificacoes.jpg)
![video lancamento titulo cinetico  capa](../galeria/05-apresentacao/video-lancamento-titulo-cinetico-capa.jpg)
![video clique do mapa ao trace  capa](../galeria/05-apresentacao/video-clique-do-mapa-ao-trace-capa.jpg)
![shot sobre cena cinza custos](../galeria/05-apresentacao/shot-sobre-cena-cinza-custos.jpg)
![tabela de agentes](../galeria/04-tipos-de-tela/tabela-de-agentes.jpg)
![mapa vivo de agentes](../galeria/06-produtos/mapa-vivo-de-agentes.jpg)
![trace cascata de execucao](../galeria/03-padroes-de-ia/trace-cascata-de-execucao.jpg)

## Mais telas

- Ganhou "Coordination Health", o incidente "Infinite Delegation Loop" com causa raiz e linha do tempo, e o mapa ao vivo com replay, e o vídeo do sistema de gestão de agentes.

Telas:

- Capa do vídeo do painel de agentes hospitalares: tela clara vazia antes de a interface entrar ![](../galeria/05-apresentacao/video-clique-do-mapa-ao-trace-capa.jpg)
- Quadro a 15%: a visão geral com saúde 94 e a rede de agentes ![](../galeria/05-apresentacao/video-clique-do-mapa-ao-trace-quadro-1.jpg)
- Quadro a 50%: o mapa ao vivo carregando ![](../galeria/05-apresentacao/video-clique-do-mapa-ao-trace-quadro-2.jpg)
- Quadro a 85%: o trace "Router Agent → Billing Agent" com "Context comparison" ![](../galeria/05-apresentacao/video-clique-do-mapa-ao-trace-quadro-4.jpg)
- Capa do vídeo da primeira execução do painel de agentes hospitalares: tela branca vazia ![](../galeria/05-apresentacao/video-primeira-execucao-capa.jpg)
- Quadro a 15%: "We found your system" entrando ![](../galeria/05-apresentacao/video-primeira-execucao-quadro-1.jpg)
- Quadro a 50%: os agentes achados com a linha do tempo montando ![](../galeria/05-apresentacao/video-primeira-execucao-quadro-2.jpg)
- Quadro a 85%: "Next steps", "Detected" e o assistente "What can I help with today?" ![](../galeria/05-apresentacao/video-primeira-execucao-quadro-3.jpg)
- Painel de agentes hospitalares: "Agents" com cinco KPIs e a tabela de agentes com papel, sucesso, latência, custo, anomalias e status ![](../galeria/06-produtos/agentes-em-tabela.jpg)
- Painel de agentes hospitalares: "Workflows" vazio com "No workflows yet", o que conectar e os conectores ![](../galeria/04-tipos-de-tela/fluxos-estado-vazio.jpg)
- Painel de agentes hospitalares: "Live Agent Map" com o grafo, o agente de cobrança crítico e o handoff com o campo que faltou ![](../galeria/06-produtos/mapa-vivo-de-agentes.jpg)
- Painel de agentes hospitalares: trace "Router Agent → Billing Agent" com "Context comparison" campo a campo, a análise e "Nothing to fix on this run" ![](../galeria/03-padroes-de-ia/comparacao-de-contexto-handoff.jpg)
- Painel de agentes hospitalares: "Coordination Health" com cartões de padrão de falha (Delegation loop, Context loss, handoff, bloat) e ocorrências ![](../galeria/04-tipos-de-tela/saude-da-coordenacao-entre-agentes.jpg)
- Capa do vídeo do painel de agentes hospitalares: visão geral com saúde 94, a rede de agentes ao vivo e custo por agente ![](../galeria/05-apresentacao/video-gestao-de-agentes-capa.jpg)
- Quadro a 15%: "Live Agent Map" com o agente de cobrança selecionado ![](../galeria/05-apresentacao/video-gestao-de-agentes-quadro-1.jpg)
- Quadro a 50%: "Context comparison" do handoff com o campo que faltou e "Create fix" ![](../galeria/05-apresentacao/video-gestao-de-agentes-quadro-2.jpg)
- Quadro a 85%: a lista de incidentes com KPIs e "Investigate" ![](../galeria/05-apresentacao/video-gestao-de-agentes-quadro-3.jpg)
- Metade esquerda do díptico do painel de agentes hospitalares: incidente "Infinite Delegation Loop" com KPIs, o caminho da falha e "Root cause analysis" ![](../galeria/05-apresentacao/diptico-incidente-esquerda.jpg)
- Metade direita do díptico do painel de agentes hospitalares: "Write postmortem" e a linha do tempo do incidente com horários ![](../galeria/05-apresentacao/diptico-incidente-direita.jpg)
- Shot em retrato 4:5 com a tela pequena no cinza: "Live Agent Map" do painel de agentes hospitalares ![](../galeria/05-apresentacao/retrato-4x5-mapa-de-agentes.jpg)
- Shot em retrato 4:5: o trace com "Execution waterfall" do painel de agentes hospitalares ![](../galeria/05-apresentacao/retrato-4x5-trace.jpg)
- Painel de agentes hospitalares: "Live Agent Map" com o replay do incidente na régua de tempo, o grafo com o laço de 17 ciclos e o handoff com o campo que faltou ![](../galeria/04-tipos-de-tela/mapa-ao-vivo-com-replay.jpg)
