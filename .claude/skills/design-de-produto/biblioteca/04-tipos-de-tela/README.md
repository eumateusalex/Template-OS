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
**[MEDIDO]** (app de manutenção predial, painel de agentes hospitalares,
painel de agentes de operação). Mobile: tela de **390 px** (iPhone), fator medido
em cada imagem.

## Índice dos arquétipos

| # | Arquétipo | Arquivo | Onde aparece mais | Exemplo-âncora |
|---|---|---|---|---|
| 1 | Visão geral / dashboard | [dashboard.md](dashboard.md) | toda série de produto abre com ele | App de manutenção predial |
| 2 | Página de detalhe | [detalhe.md](detalhe.md) | lead, agente, evento, caso | Painel de agentes de operação "Ana", CRM de receita "Elena Varga" |
| 3 | Fila / lista | [fila-e-lista.md](fila-e-lista.md) | "Needs attention", Queue, Payables | Painel de licenciamento solar, app de despesas com IA Queue |
| 4 | Relatório / analytics | [relatorio.md](relatorio.md) | Reports, Revenue, Calibration, Insights | App da clínica de estética, CRM de receita Revenue |
| 5 | Mapa / grafo | [mapa-e-grafo.md](mapa-e-grafo.md) | agentes, frota, fluxo de automação | Painel de agentes hospitalares Live Map, app de frota |
| 6 | Configuração | [configuracao.md](configuracao.md) | política de agente, conta, onboarding de conta | Painel de agentes de operação Instructions/Policy, painel de gestão de imóveis Account & Settings |
| 7 | Trace / log | [trace-e-log.md](trace-e-log.md) | observabilidade e auditoria | Painel de agentes hospitalares Trace, painel de auditoria de agentes, CRM de receita Audit log |
| 8 | Home mobile | [home-mobile.md](home-mobile.md) | todo app | App de entregas, app da clínica de estética app, app de autorização prévia app |
| 9 | Fluxo mobile passo a passo | [fluxo-mobile.md](fluxo-mobile.md) | cancelar, cadastrar, pedir | App de assinaturas, app de cuidado pós-alta, app de manutenção predial app |
| 10 | Landing page / site de marketing | [landing-page.md](landing-page.md) | site de marketing e de cliente | Site de consultoria, site de energia solar, site de evento, site de gestão de vendas, site de vendas |
| 11 | Construtor (canvas de fluxo) | [construtor.md](construtor.md) | montar agente, automação, workflow | construtor do assistente de reembolso e construtor de agentes |

## As regras que valem para todos os tipos

1. **Uma tela, uma pergunta.** O título da tela é uma frase do usuário ("We found
   your system", "Good morning, Sarah", "Needs attention", "Your trends") e o
   primeiro bloco responde a ela. **[OBSERVADO]** em 40+ telas de produto.
2. **A saudação é título de dashboard.** "Good morning, Sarah / Emma /
   James & Sarah" abre painel de licenciamento solar, app de autorização prévia, co-professor de IA, app da clínica de estética app, app de financiamento imobiliário,
   painel de pagamentos de agentes e app do técnico de campo, sempre seguida de uma linha com o número que importa
   hoje ("7 projects need attention", "42 active authorization cases").
3. **Cartões brancos sem sombra sobre fundo cinza-claro** (`#EFEEF4`, `#F5F5F5`,
   `#F8F9FB`); a separação vem da cor de fundo e de borda 1 px, não de elevação.
   Confirmado no DS: *"Panels sit flat on the canvas"*.
4. **Um bloco em cor chapada por tela** (o KPI principal preto no painel de licenciamento solar, o
   cartão "Do first" amarelo no painel de agentes hospitalares, "Revenue at risk" verde no
   app de autorização prévia). É o que o olho vê primeiro.
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
| Dashboard / overview | ≈35 | a tela de abertura em quase toda série |
| Fila / lista / tabela | ≈20 | a que mais vira referência |
| Detalhe | ≈15 | quase sempre com painel lateral |
| Relatório / analytics | ≈12 | CRM de receita, app de despesas com IA, app da clínica de estética, anotador por voz, painel de gestão de imóveis |
| Home mobile | ≈15 | App de entregas, app de assinaturas, app da clínica de estética, app de autorização prévia, app de cuidado pós-alta |
| Fluxo mobile | ≈10 | App de assinaturas, app de cuidado pós-alta, app de manutenção predial, app de entregas |
| Mapa / grafo | ≈8 | agentes e frota |
| Trace / log | ≈8 | Painel de agentes hospitalares, painel de auditoria de agentes, CRM de receita |
| Configuração | ≈6 | Painel de agentes de operação, painel de gestão de imóveis, painel de auditoria de agentes Policies |
| Landing | ≈90, antes das séries | quase zero depois que as séries de produto começam |

## Mais exemplos

Telas de séries mais recentes que servem de exemplo para cada arquétipo (as fichas estão em
[../06-produtos/](../06-produtos/README.md)):

| Arquétipo | Exemplos | O que acrescentam |
|---|---|---|
| Dashboard | App de recuperação de garantia (título serifado + frase do que o sistema achou), painel de margem de serviços (cascata do porquê), painel de permissões de agentes Command Center, app de escala domiciliar (agenda como dashboard) | a frase embaixo da saudação deixa de ser contagem e vira achado: *"[produto] found 6 new claims worth $4,960 in yesterday's jobs."* |
| Detalhe | App de contas a receber (fatura paga com "How the prediction did"), app de autorização prévia (caso com "Next best action"), app de recuperação de garantia (prontidão do claim 88%) | o detalhe diz o que falta para seguir, em porcentagem e em lista |
| Fila / lista | App de recuperação de garantia Claims (barra flutuante de seleção), app de autorização prévia em kanban de seis colunas, painel de integração de empresas Issues em kanban, app de serviço de campo messages, ERP de facilities Technicians | **kanban** aparece como variação da fila quando a etapa importa mais que a data |
| Relatório | App de manutenção predial Reports, app de locação residencial Analytics (funil hachurado), app de contratação de técnicos (subtítulo-conclusão em serifa), app de frota (exceções), suporte com IA Analytics | o subtítulo do relatório é a conclusão escrita |
| Configuração | App de recuperação de garantia Settings (popup de convite com papéis), app de manutenção predial notificações com preferências em chave, app de despesas com IA onboarding em cartões | a escolha vem com a frase do que acontece |
| Home mobile | App de manutenção predial técnico, app de escala domiciliar cuidador, app de recuperação de garantia técnico, app da clínica de estética paciente, app de autorização prévia, app de financiamento imobiliário, estúdio de anúncios iOS | o cartão do topo é a próxima coisa a fazer, não o resumo |
| Fluxo mobile | Agente doméstico (onboarding com a regra do agente), app de recuperação de garantia (detalhamento de mão de obra → enviado), app de financiamento imobiliário (folha de envio) | a confirmação final mostra o efeito acumulado ("Your evidence this year $18,420") |
| Landing | Painel de agentes hospitalares em quadrado 4096×4096 | volta pontual ao site, agora com o print do produto logo abaixo do título |
| Construtor | ver [construtor.md](construtor.md) | arquétipo próprio |

![landing](../galeria/04-tipos-de-tela/landing-mapa-de-agentes.jpg)
![tabela de agentes](../galeria/04-tipos-de-tela/tabela-de-agentes.jpg)
![kanban](../galeria/04-tipos-de-tela/pipeline-de-autorizacoes-kanban.jpg)
![centro de comando](../galeria/04-tipos-de-tela/centro-de-comando-escuro.jpg)
![agenda mortgage flow](../galeria/04-tipos-de-tela/agenda-reuniao.jpg)
![notificações](../galeria/04-tipos-de-tela/notificacoes-tela.jpg)
![entrar](../galeria/04-tipos-de-tela/entrar-painel-de-marca.png)
![onboarding](../galeria/04-tipos-de-tela/onboarding-primeiro-imovel.jpg)
![ajuda app da clínica de estética](../galeria/04-tipos-de-tela/central-de-ajuda.jpg)
![assinaturas app da clínica de estética](../galeria/04-tipos-de-tela/assinaturas-e-retencao.jpg)

## Mais exemplos

Telas que servem de exemplo para cada arquétipo (fichas em
[../06-produtos/](../06-produtos/README.md)):

| Arquétipo | Exemplos novos | O que acrescentam |
|---|---|---|
| Mapa / grafo | Painel de agentes hospitalares "Live Agent Map" com replay na régua de tempo; painel de permissões de agentes "Agent map" escuro com a camada de política no centro | o mapa ganha **tempo**: a régua de eventos deixa rever o incidente e o grafo mostra o laço de 17 ciclos |
| Trace / log | Console de agentes de voz (chamada com a onda marcada e o erro da API na transcrição; versões com diff das instruções), painel de pagamentos de agentes (incidente de gasto em degraus com o rastro de controle), app de cartas de cobrança (linha do tempo do caso) | o log vira **diff** e **degrau**: a mudança e o gasto aparecem como forma, não só como linha |
| Dashboard | Painel de agentes hospitalares "Coordination Health" (cartões por tipo de falha) | o painel de saúde é organizado por **padrão de falha**, não por agente |
| Fila / lista | App de locação residencial "AI Leasing Inbox" (a conversa com a IA atendendo); app de cuidado domiciliar e app de escala domiciliar (escala por pessoa e hora, com a linha "Needs cover" em vermelho tracejado e o cartão "2 suggestions ready") | a escala por pessoa e hora aparece no app de escala domiciliar, no app de cuidado domiciliar e, antes, no app de escala de plantão: candidata a arquétipo próprio se repetir |
| Detalhe | App de contratação de técnicos "Compare finalists" (colunas por candidato, o recomendado em verde) | comparação lado a lado como detalhe de decisão |
| Configuração | Painel de inteligência de pagamentos integrações em cartões com "Sync health"; app de consultoria com IA o método do assistente em passos arrastáveis; app de cozinha com IA entrar por link, "Check your email" e código do tablet | a entrada da cozinha tem **dois caminhos** (link por e-mail para o chef, código de 4 dígitos para o cozinheiro no tablet) |
| Landing | Painel de auditoria de agentes escura, "Every action your AI agents take, sealed as evidence." | o produto no herói, logo abaixo do título |
| Estado vazio | Painel de agentes hospitalares "Workflows" com "No workflows yet" e os conectores; painel de contratos e SLA "Import a contract" com "How it works" em três passos ao lado da área de soltar | o vazio explica o que acontece depois de agir, não só pede a ação |
| Calendário | App da clínica de estética "Calendar" do dia por profissional com o atendimento aberto ao lado e o toast "Appointment booked" com Undo | o detalhe do evento abre ao lado, sem sair do dia |

![mapa com replay](../galeria/04-tipos-de-tela/mapa-ao-vivo-com-replay.jpg)
![mapa](../galeria/04-tipos-de-tela/mapa-de-agentes-escuro.jpg)
![chamada](../galeria/04-tipos-de-tela/chamada-com-transcricao-escuro.jpg)
![versões](../galeria/04-tipos-de-tela/versoes-do-agente-com-diff-escuro.jpg)
![incidente](../galeria/04-tipos-de-tela/incidente-de-gasto-com-rastro-escuro.jpg)
![linha do tempo](../galeria/04-tipos-de-tela/linha-do-tempo-do-caso.jpg)
![coordenação](../galeria/04-tipos-de-tela/saude-da-coordenacao-entre-agentes.jpg)
![caixa de entrada](../galeria/04-tipos-de-tela/caixa-de-entrada-com-ia-atendendo.jpg)
![agenda](../galeria/04-tipos-de-tela/agenda-por-cuidadora-com-detalhe.jpg)
![agenda  2](../galeria/04-tipos-de-tela/agenda-por-cuidadora-com-detalhe-2.jpg)
![falta de cobertura](../galeria/04-tipos-de-tela/agenda-com-falta-de-cobertura.jpg)
![agenda](../galeria/03-padroes-de-ia/agenda-sugestoes-prontas.jpg)
![finalistas](../galeria/04-tipos-de-tela/comparar-finalistas.jpg)
![integrações](../galeria/04-tipos-de-tela/integracoes-em-cartoes.jpg)
![método](../galeria/04-tipos-de-tela/metodo-em-passos-do-assistente.jpg)
![login](../galeria/04-tipos-de-tela/login-por-link.jpg)
![email](../galeria/04-tipos-de-tela/confira-seu-email.jpg)
![tablet](../galeria/04-tipos-de-tela/codigo-do-tablet.jpg)
![landing](../galeria/04-tipos-de-tela/landing-escura.jpg)
![fluxos vazio](../galeria/04-tipos-de-tela/fluxos-estado-vazio.jpg)
![importar contrato](../galeria/04-tipos-de-tela/importar-contrato-com-como-funciona.jpg)
![calendário app da clínica de estética](../galeria/04-tipos-de-tela/calendario-de-atendimentos-com-painel.jpg)
