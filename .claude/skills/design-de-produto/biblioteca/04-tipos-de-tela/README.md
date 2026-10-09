# 04 · Tipos de tela

## O que é esta seção

Os arquétipos de tela que se repetem de produto para produto. Cada arquivo dá o
esqueleto (grade, larguras em px da tela original, ordem dos blocos), a
hierarquia (o que o olho vê em 1º, 2º, 3º), a densidade e 2-3 exemplos recortados.

**Escala usada.** Quase todas as telas web são desenhadas em **1440 px** de
largura e exportadas dentro de uma moldura cinza em imagem de 4096 px. A moldura
da tela ocupa de 1.740 a 1.790 px na imagem reduzida a 2.000 de largura, ou seja,
**3.560 a 3.670 px na original**. Fator: **≈2,47 a 2,55 px de imagem por px de
tela**. Todas as medidas abaixo já estão convertidas para px de tela 1440
**[MEDIDO]** (FixTrack, OrchestrateIQ,
Ergond). Mobile: tela de **390 px** (iPhone), fator medido
em cada imagem.

## Índice dos arquétipos

| # | Arquétipo | Arquivo | Onde aparece mais | Exemplo-âncora |
|---|---|---|---|---|
| 1 | Visão geral / dashboard | [dashboard.md](dashboard.md) | toda série de produto abre com ele | FixTrack |
| 2 | Página de detalhe | [detalhe.md](detalhe.md) | lead, agente, evento, caso | Ergond "Ana", Vero "Elena Varga" |
| 3 | Fila / lista | [fila-e-lista.md](fila-e-lista.md) | "Needs attention", Queue, Payables | Permitly, Rillo Queue |
| 4 | Relatório / analytics | [relatorio.md](relatorio.md) | Reports, Revenue, Calibration, Insights | Medspa, Vero Revenue |
| 5 | Mapa / grafo | [mapa-e-grafo.md](mapa-e-grafo.md) | agentes, frota, fluxo de automação | OrchestrateIQ Live Map, Haulsight |
| 6 | Configuração | [configuracao.md](configuracao.md) | política de agente, conta, onboarding de conta | Ergond Instructions/Policy, Castle Account & Settings |
| 7 | Trace / log | [trace-e-log.md](trace-e-log.md) | observabilidade e auditoria | OrchestrateIQ Trace, AgentTrail, Vero Audit log |
| 8 | Home mobile | [home-mobile.md](home-mobile.md) | todo app | Mongi, Medspa app, PriorAuth app |
| 9 | Fluxo mobile passo a passo | [fluxo-mobile.md](fluxo-mobile.md) | cancelar, cadastrar, pedir | Torin, Care Circle, FixTrack app |
| 10 | Landing page / site de marketing | [landing-page.md](landing-page.md) | site de marketing e de cliente | Consul, Hulax, Meetzi, Torivo, Grovix |
| 11 | Construtor (canvas de fluxo) | [construtor.md](construtor.md) | montar agente, automação, workflow | construtor do "Refund Assistant" e Lioran.ai |

## As regras que valem para todos os tipos

1. **Uma tela, uma pergunta.** O título da tela é uma frase do usuário ("We found
   your system", "Good morning, Sarah", "Needs attention", "Your trends") e o
   primeiro bloco responde a ela. **[OBSERVADO]** em 40+ telas de produto.
2. **A saudação é título de dashboard.** "Good morning, Sarah / Emma /
   James & Sarah" abre Permitly, PriorAuth, Edu.ai, Medspa app, Mortgage Flow,
   AgentPay e Contractor app, sempre seguida de uma linha com o número que importa
   hoje ("7 projects need attention", "42 active authorization cases").
3. **Cartões brancos sem sombra sobre fundo cinza-claro** (`#EFEEF4`, `#F5F5F5`,
   `#F8F9FB`); a separação vem da cor de fundo e de borda 1 px, não de elevação.
   Confirmado no DS: *"Panels sit flat on the canvas"*.
4. **Um bloco em cor chapada por tela** (o KPI principal preto no Permitly, o
   cartão "Do first" amarelo no OrchestrateIQ, "Revenue at risk" verde no
   PriorAuth). É o que o olho vê primeiro.
5. **A IA tem um lugar fixo**: cartão próprio, com ícone de brilho, texto em frase
   e um botão ("Review risks", "Review the draft", "Review suggestions"). Nunca
   espalhada pela tela.
6. **Densidade segue o público**, não o tipo de tela. Ver a tabela leve × denso em
   [../06-produtos/README.md](../06-produtos/README.md).

## Distribuição observada (séries de produto)

Contagem feita nas telas principais das 22 primeiras séries de produto
([../06-produtos/](../06-produtos/)), uma por peça de imagem única ou por tela
distinta nos carrosséis **[OBSERVADO, contagem aproximada]**:

| Arquétipo | Telas | Observação |
|---|---:|---|
| Dashboard / overview | ≈35 | o campeão de views em quase toda série |
| Fila / lista / tabela | ≈20 | maior salvos/1k |
| Detalhe | ≈15 | quase sempre com painel lateral |
| Relatório / analytics | ≈12 | Vero, Rillo, Medspa, Lepo, Castle |
| Home mobile | ≈15 | Mongi, Torin, Medspa, PriorAuth, Care Circle |
| Fluxo mobile | ≈10 | Torin, Care Circle, FixTrack, Mongi |
| Mapa / grafo | ≈8 | agentes e frota |
| Trace / log | ≈8 | OrchestrateIQ, AgentTrail, Vero |
| Configuração | ≈6 | Ergond, Castle, AgentTrail Policies |
| Landing | ≈90, antes das séries | quase zero depois que as séries de produto começam |

## Mais exemplos

Telas de séries mais recentes que servem de exemplo para cada arquétipo (as fichas estão em
[../06-produtos/](../06-produtos/README.md)):

| Arquétipo | Exemplos | O que acrescentam |
|---|---|---|
| Dashboard | Clawback (título serifado + frase do que o sistema achou), Margin (cascata do porquê), Ctrl.ai Command Center, CareOps (agenda como dashboard) | a frase embaixo da saudação deixa de ser contagem e vira achado: *"Clawback found 6 new claims worth $4,960 in yesterday's jobs."* |
| Detalhe | CollectAI (fatura paga com "How the prediction did"), PriorAuth (caso com "Next best action"), Clawback (prontidão do claim 88%) | o detalhe diz o que falta para seguir, em porcentagem e em lista |
| Fila / lista | Clawback Claims (barra flutuante de seleção), PriorAuth em kanban de seis colunas, Bolton Issues em kanban, Quotepilot messages, FacilityOS Technicians | **kanban** aparece como variação da fila quando a etapa importa mais que a data |
| Relatório | FixTrack Reports, LeaseFlow Analytics (funil hachurado), Bench (subtítulo-conclusão em serifa), Haulsight (exceções), ResolveAI Analytics | o subtítulo do relatório é a conclusão escrita |
| Configuração | Clawback Settings (popup de convite com papéis), FixTrack notificações com preferências em chave, Rillo onboarding em cartões | a escolha vem com a frase do que acontece |
| Home mobile | FixTrack técnico, CareOps cuidador, Clawback técnico, Medspa paciente, PriorAuth, Mortgage Flow, AdStudio iOS | o cartão do topo é a próxima coisa a fazer, não o resumo |
| Fluxo mobile | Lora (onboarding com a regra do agente), Clawback (detalhamento de mão de obra → enviado), Mortgage Flow (folha de envio) | a confirmação final mostra o efeito acumulado ("Your evidence this year $18,420") |
| Landing | OrchestrateIQ em quadrado 4096×4096 | volta pontual ao site, agora com o print do produto logo abaixo do título |
| Construtor | ver [construtor.md](construtor.md) | arquétipo próprio |

![landing orchestrateiq](../galeria/04-tipos-de-tela/landing-mapa-de-agentes-orchestrateiq.jpg)
![tabela de agentes](../galeria/04-tipos-de-tela/tabela-de-agentes-orchestrateiq.jpg)
![kanban priorauth](../galeria/04-tipos-de-tela/pipeline-de-autorizacoes-kanban-priorauth.jpg)
![centro de comando](../galeria/04-tipos-de-tela/centro-de-comando-escuro-ctrl-ai.jpg)
![agenda mortgage flow](../galeria/04-tipos-de-tela/agenda-reuniao-mortgageflow.jpg)
![notificações fixtrack](../galeria/04-tipos-de-tela/notificacoes-fixtrack.jpg)
![entrar fixtrack](../galeria/04-tipos-de-tela/entrar-painel-de-marca-fixtrack.png)
![onboarding fixtrack](../galeria/04-tipos-de-tela/onboarding-primeiro-imovel-fixtrack.jpg)
![ajuda medspa](../galeria/04-tipos-de-tela/central-de-ajuda-medspa.jpg)
![assinaturas medspa](../galeria/04-tipos-de-tela/assinaturas-e-retencao-medspa.jpg)

