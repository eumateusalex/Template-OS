# 02 · Catálogo de componentes

O catálogo dos componentes de interface do método, organizado como a biblioteca de um design system: cada
componente com nome, anatomia numerada, medidas em px de tela, variações vistas, onde aparece e como
reproduzir.

**A fonte que manda.** As folhas de variáveis publicadas do Permitly (claro) e do AgentPay (escuro):
[design-system-publicado.md](../01-sistema-visual/design-system-publicado.md). Os arquivos daqui citam o
token ao lado da medida quando os dois batem, e foram corrigidos para o token onde divergiam.

## Arquivos

| Arquivo | O que tem |
|---|---|
| [navegacao.md](navegacao.md) | sidebar, trilho de ícones, abas de topo em pílula, abas segmentadas, breadcrumb, barra inferior do celular, busca com atalho |
| [cartoes-e-kpis.md](cartoes-e-kpis.md) | cartão de KPI e 6 variantes, cartão aninhado, cartão com foto, cartão de destaque colorido, grade bento |
| [listas-e-tabelas.md](listas-e-tabelas.md) | tabela densa, linha com status, fila de decisão, lista com avatar, "precisa de você", linha do tempo, log de auditoria |
| [selos-chips-e-botoes.md](selos-chips-e-botoes.md) | selo de status, tints por severidade, chip de metadado, filtro, botões, toggle, avatares empilhados |
| [ia-e-agentes.md](ia-e-agentes.md) | painel de assistente, faixa de insight, nó e grafo, handoff, waterfall, política, confiança, humano no circuito, anomalia |
| [graficos.md](graficos.md) | gauge segmentado, barras, mapa de calor, donut segmentado, barra de progresso, sparkline e linha com faixa do normal |
| [mobile.md](mobile.md) | saudação, hero colorido, par de cartões, lista de próximos, grade de atalhos, stepper, folha inferior, progresso, botão de largura total |
| [formularios-e-config.md](formularios-e-config.md) | campo, seletor, checkbox, grupo de toggles, painel de regra, envio de arquivo, estados vazios |
| [sobreposicoes-e-cartoes-isolados.md](sobreposicoes-e-cartoes-isolados.md) | popup de decisão, popup de notificações, barra flutuante de seleção, cartão de recurso, cartão isolado, seletor −/+, antes e depois, tela de bloqueio com widget, cartão de kanban, cabeçalho com foto |

Recortes em [`../galeria/02-componentes/`](../galeria/02-componentes/) (50 imagens).

---

## Escala e método

- **Material**: 61 telas de produto examinadas em tamanho real, de 36 produtos (lista abaixo), mais 9 telas
  de complemento (AgentPay, app de bem-estar, cartões do PriorAuth, mapa do ctrl.ai). As contagens de
  frequência são sobre as 61 telas; as 9 de complemento entram como variação.
- **Desktop**: todos os painéis medidos são quadros de **1440 px** de largura exportados entre 2,44x e 2,55x.
  O fator de cada imagem foi calculado medindo a largura da janela em pixels (varredura de linha) e
  dividindo por 1440. Exemplos: FixTrack = 3590 px / 1440 = 2,49; OrchestrateIQ
  = 2,475; PriorAuth = 2,53; Ergond =
  2,55; AgentTrail = 2,54.
- **Recortes de perto** (a imagem mostra só um pedaço da tela): o fator vem de uma peça conhecida do mesmo
  produto (largura da sidebar, raio de cartão do design system). Permitly = 3,0 (as duas metades somam
  4318 px); AgentTrail de perto ≈ 3,0; AgentPay ≈ 2,7 (pelo raio de cartão 16 publicado); ctrl.ai ≈ 4.
- **Celular**: quadros de iPhone de **393 × 852 pt**, a ~3x. Medidas em pt.
- **Como medi**: Python + PIL + numpy. Varredura de linha e coluna para bordas e cores; para raio, um
  script que isola a forma pela cor, acha a borda reta e calcula o raio pelo ponto em que o canto encontra
  a reta. O script foi validado em círculos (devolve metade do diâmetro) antes de ser usado.
- **Marcas**: **[MEDIDO]** = varredura de pixel, erro ±1 px de tela; **[MEDIDO ±N]** = lido no recorte em
  tamanho real; **[OBSERVADO]** = contado nas telas; **[INFERIDO]** = dedução; **[CONFIRMADO]** = escrito
  na folha do design system publicado.

---

## Índice de componentes

Frequência = em quantas das 61 telas o componente aparece, por inspeção visual **[OBSERVADO]**. Nas
linhas do fim, "fora das 61" = componente visto só nas telas de complemento ou nas séries mais recentes,
com o número de peças em que aparece.

| Componente | Família | Arquivo | Telas |
|---|---|---|---|
| Selo de status (tint + 700; escuro com borda 40%) | selos | [selos](selos-chips-e-botoes.md#1-selo-de-status) | 35 |
| Tints por severidade | selos | [selos](selos-chips-e-botoes.md#2-tints-por-severidade) | 35 |
| Linha com status | listas | [listas](listas-e-tabelas.md#2-linha-com-status) | 30 |
| Sidebar | navegação | [navegação](navegacao.md#1-barra-lateral-sidebar) | 28 |
| Cartão de KPI (número + unidade ao lado + selo de variação) | cartões | [cartões](cartoes-e-kpis.md#1-cartão-de-kpi) | 26 |
| Contador em pílula na sidebar | navegação | [navegação](navegacao.md#1-barra-lateral-sidebar) | 24 |
| Abas segmentadas | navegação | [navegação](navegacao.md#4-abas-segmentadas-segmented-control) | 22 |
| Cartão aninhado (raio desce um degrau por nível) | cartões | [cartões](cartoes-e-kpis.md#2-cartão-aninhado-cartão-dentro-de-cartão) | 20 |
| Grade bento | cartões | [cartões](cartoes-e-kpis.md#5-grade-bento) | 20 |
| Breadcrumb com selo de estado | navegação | [navegação](navegacao.md#5-trilha-de-navegação-breadcrumb) | 19 |
| Barra de progresso (linha, segmentos, tiques) | gráficos | [gráficos](graficos.md#5-barra-de-progresso) | 18 |
| Cartão de destaque colorido | cartões | [cartões](cartoes-e-kpis.md#4-cartão-de-destaque-colorido) | 16 |
| Barras (7 formas) | gráficos | [gráficos](graficos.md#2-barras) | 15 |
| Chip de filtro e seletor | selos | [selos](selos-chips-e-botoes.md#4-chip-de-filtro-e-seletor) | 15 |
| Busca (7 com atalho ⌘K, 8 sem) | navegação | [navegação](navegacao.md#7-busca-com-atalho) | 15 |
| Botão primário | botões | [selos](selos-chips-e-botoes.md#51-primário) | 14 medidos |
| Tabela densa | listas | [listas](listas-e-tabelas.md#1-tabela-densa) | 14 |
| Humano no circuito | IA | [IA](ia-e-agentes.md#8-humano-no-circuito-aprovar-corrigir-devolver) | 13 |
| Botão de seta ↗ no canto do cartão | botões | [selos](selos-chips-e-botoes.md#54-botão-de-ícone-) | 12 |
| Faixa de insight da IA (✦) | IA | [IA](ia-e-agentes.md#2-faixa-de-insight-da-ia) | 12 |
| Barra inferior do celular (5 com botão central) | navegação | [navegação](navegacao.md#6-barra-inferior-do-celular-bottom-nav) | 12 |
| Lista "precisa de você" | listas | [listas](listas-e-tabelas.md#5-lista-precisa-de-você-needs-attention) | 11 |
| Sparkline e linha | gráficos | [gráficos](graficos.md#6-sparkline-e-linha) | 11 |
| Nó de agente e grafo | IA | [IA](ia-e-agentes.md#3-nó-de-agente-e-grafo) | 10 |
| Lista com avatar | listas | [listas](listas-e-tabelas.md#4-lista-com-avatar) | 10 |
| Selo de confiança e estimativa | IA | [IA](ia-e-agentes.md#7-selo-de-confiança-e-estimativa) | 10 |
| Abas de topo em pílula | navegação | [navegação](navegacao.md#3-abas-de-topo-em-pílula) | 9 |
| Trilho de ícones | navegação | [navegação](navegacao.md#2-trilho-de-ícones-rail) | 9 |
| Chip de metadado com ícone | selos | [selos](selos-chips-e-botoes.md#3-chip-de-metadado-com-ícone) | 9 |
| Seletor de workspace no topo da sidebar | navegação | [navegação](navegacao.md#1-barra-lateral-sidebar) | 9 |
| Linha do tempo vertical | listas | [listas](listas-e-tabelas.md#6-linha-do-tempo-vertical) | 8 |
| Ponto de entrada "Ask [produto]" | IA | [IA](ia-e-agentes.md#1-painel-de-assistente-chat-com-orbe) | 8 |
| Cabeçalho "Good morning" (4 celular, 8 desktop) | mobile | [mobile](mobile.md#1-cabeçalho-com-saudação-good-morning) | 12 |
| Cartão hero colorido (celular) | mobile | [mobile](mobile.md#2-cartão-hero-colorido) | 7 |
| Estados vazios informativos (sem ilustração) | formulários | [formulários](formularios-e-config.md#7-estados-vazios) | 6 |
| Campo de texto | formulários | [formulários](formularios-e-config.md#1-campo-de-texto) | 6 |
| Lista de próximos (celular) | mobile | [mobile](mobile.md#4-lista-de-próximos) | 6 |
| Fila de decisão (queue) | listas | [listas](listas-e-tabelas.md#3-fila-de-decisão-queue) | 5 |
| Log de auditoria | listas | [listas](listas-e-tabelas.md#7-log-de-auditoria) | 5 |
| Cartão de política (Trigger → Conditions → Action) | IA | [IA](ia-e-agentes.md#6-cartão-de-política-trigger--conditions--action) | 5 |
| Gauge segmentado | gráficos | [gráficos](graficos.md#1-gauge-segmentado) | 5 |
| Toggle (e grupo de configuração) | selos / formulários | [selos](selos-chips-e-botoes.md#6-toggle) | 5 |
| Avatares empilhados | selos | [selos](selos-chips-e-botoes.md#7-avatares-empilhados) | 5 |
| Stepper | mobile | [mobile](mobile.md#6-stepper) | 5 |
| Botão destrutivo contornado | botões | [selos](selos-chips-e-botoes.md#55-destrutivo) | 4 |
| Par de decisão | botões | [selos](selos-chips-e-botoes.md#56-par-de-decisão) | 4 |
| Barra de progresso no celular | mobile | [mobile](mobile.md#8-barra-de-progresso-no-celular) | 4 |
| Painel de assistente com orbe | IA | [IA](ia-e-agentes.md#1-painel-de-assistente-chat-com-orbe) | 3 |
| Mapa de calor | gráficos | [gráficos](graficos.md#3-mapa-de-calor) | 3 |
| Donut segmentado | gráficos | [gráficos](graficos.md#4-donut-segmentado) | 3 |
| Grafo de handoff | IA | [IA](ia-e-agentes.md#4-grafo-de-handoff-passagem-entre-agentes) | 3 |
| Cartão de anomalia | IA | [IA](ia-e-agentes.md#9-cartão-de-anomalia) | 3 |
| Waterfall de execução | IA | [IA](ia-e-agentes.md#5-waterfall-de-execução) | 2 |
| Folha inferior | mobile | [mobile](mobile.md#7-folha-inferior-bottom-sheet) | 1 + 1 fora das 61 |
| Cartão com foto | cartões | [cartões](cartoes-e-kpis.md#3-cartão-com-foto) | 1 |
| Linha com "faixa do seu normal" | gráficos | [gráficos](graficos.md#6-sparkline-e-linha) | fora das 61: 1 |
| Popup de decisão centralizado | sobreposições | [sobreposições](sobreposicoes-e-cartoes-isolados.md#1-popup-de-decisão-centralizado) | fora das 61: 5 peças |
| Popup de notificações ancorado | sobreposições | [sobreposições](sobreposicoes-e-cartoes-isolados.md#2-popup-de-notificações-ancorado) | fora das 61: 1 |
| Barra flutuante de seleção | listas | [sobreposições](sobreposicoes-e-cartoes-isolados.md#3-barra-flutuante-de-seleção) | fora das 61: 1 |
| Cartão de recurso (ilustração + título + frase) | cartões | [sobreposições](sobreposicoes-e-cartoes-isolados.md#4-cartão-de-recurso-ilustração--título--frase) | fora das 61: 3 |
| Cartão isolado como peça | cartões | [sobreposições](sobreposicoes-e-cartoes-isolados.md#5-cartão-isolado-como-peça) | fora das 61: 4 trios |
| Seletor de quantidade (−/+) | formulários | [sobreposições](sobreposicoes-e-cartoes-isolados.md#6-seletor-de-quantidade--) | fora das 61: 2 |
| Comparador antes e depois | mídia | [sobreposições](sobreposicoes-e-cartoes-isolados.md#7-comparador-antes-e-depois) | fora das 61: 2 |
| Tela de bloqueio com widget e notificação acionável | mobile | [sobreposições](sobreposicoes-e-cartoes-isolados.md#8-tela-de-bloqueio-com-widget-e-notificação-acionável) | fora das 61: 5 produtos |
| Cartão de kanban | listas | [sobreposições](sobreposicoes-e-cartoes-isolados.md#9-cartão-de-kanban) | fora das 61: 2 |
| Cabeçalho com foto do objeto | cartões | [sobreposições](sobreposicoes-e-cartoes-isolados.md#10-cabeçalho-com-foto-do-objeto) | fora das 61: 2 |

---

## O que atravessa todos os componentes

1. **Um trio de cor por estado.** Sólido, tint e texto escuro. Selo é tint + texto 700; o sólido fica para o
   nível mais alto de um único item. No escuro, o selo ganha borda `border-40`: o NOME diz 40, a folha marca "solid", e o hex medido equivale a 40%
   sobre o painel **[MEDIDO]**.
2. **O raio é decisão de produto.** Produto claro e leve: painel 32, cartão 24, pílula nos controles.
   Produto escuro e denso: cartão 16, controle 8 a 12 **[CONFIRMADO + MEDIDO]**.
3. **Cartão dentro de cartão**, com o raio descendo um degrau por nível (8 ou 12, às vezes igual; medido,
   não é a fórmula concêntrica "interno = externo − recuo"), e profundidade por troca de superfície,
   não por sombra.
4. **A unidade fica ao lado do número**, e o número tem escala própria (Geist); ID, hora e dinheiro técnico
   vão em Geist Mono.
5. **Ilhas em vez de faixas**: barra de topo e trilho são cápsulas separadas sobre o fundo do app.
6. **Contagem literal**: gauge de 28 peças para 28 pedidos, donut de 10 peças para 10 documentos, barra de 7
   segmentos para 7 encomendas.
7. **A IA fala em faixa tint com ✦**, no pé do cartão, dizendo a conclusão; e toda estimativa vem com a base
   e a ressalva.
8. **O humano decide no ponto certo**: fila "Waiting on you", par "Correct / Confirm", "Hand back to agent".
9. **Vazio sem ilustração**: o estado vazio vira informação ("Nothing to fix on this run").
10. **Tile de ícone com o ícone na metade**, só nos tamanhos 24, 32, 40, 48 e 64 **[CONFIRMADO]**.

---

## Telas examinadas (61 + 9 de complemento)

| Produto | Telas |
|---|---|
| OrchestrateIQ | 9 |
| Permitly | 2 |
| Mongi | 3 |
| Ergond | 3 |
| FixTrack | 4 |
| AgentTrail | 8 |
| ctrl.ai | 3 (uma de complemento) |
| medspa | 2 |
| Mortgage Flow | 1 |
| Haulsight | 1 |
| ResolveAI | 1 |
| Rillo | 2 |
| Vero | 1 |
| Torin | 2 |
| Lepo | 2 |
| PriorAuth | 4 (três de complemento) |
| AgentPay | 2 (complemento) |
| Bem-estar em rosa | 3 (complemento) |
| Outros | Edu.ai, ComplianceFlow, Fino, CollectAI, Mental health, Caregiver, quotepilot, Automax, Sales Ask, Castle (contraste), AI Summary, Smart Task Boards, AI drafts, contractor |

**Contraste com o genérico.** O Castle ainda usa a linguagem genérica de SaaS: azul padrão, ativo com
barra, donut contínuo, botões pequenos. As telas do método trocam isso pelas cápsulas, os tints em trio, o
cartão aninhado e os gráficos de contagem literal **[OBSERVADO]**. Ver
[../09-do-generico-ao-produto/README.md](../09-do-generico-ao-produto/README.md).

## O que ficou incerto

- O fator de escala dos recortes de perto (AgentTrail, AgentPay, ctrl.ai, ResolveAI) vem de uma peça de
  referência, não da janela inteira. Erro possível de ±5% nessas medidas.
- AgentTrail e AgentPay são escuros, mas os hex medidos no AgentTrail (`#0c0c0e`, `#151517`, `#242328`,
  neutros) não são os tokens do AgentPay (`#08090B`, `#14171C`, `#232830`, azulados). São produtos
  diferentes ou o AgentTrail é anterior ao sistema publicado **[INFERIDO]**.
- As contagens de frequência são por inspeção visual das 61 telas; um componente pequeno pode ter escapado
  em telas de baixa resolução (Vero, Rillo, Edu.ai têm imagens de 1024 a 1200 px).
