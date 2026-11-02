# Painel de auditoria de agentes e painel de pagamentos de agentes

Os dois produtos escuros de governança de agentes. Mesma família visual (e, segundo
a peça da folha de DS, **o mesmo design system escuro**, desenhado
para escalar, tokens em
[../01-sistema-visual/design-system-publicado.md](../01-sistema-visual/design-system-publicado.md)).

## Painel de auditoria de agentes

| Campo | Valor |
|---|---|
| Nome | Painel de auditoria de agentes (logo: losango branco em quadrado roxo) |
| Setor | governança, auditoria e compliance de agentes (EU AI Act, trilha com hash) |
| Para quem | compliance / segurança de empresa que usa agentes |
| Tema | escuro; fundo `#151515`-`#1B1B1B` **[MEDIDO]**, grade de pontos no canvas |
| Plataforma | web desktop |
| Acento | roxo `#7C6CF0`; status verde (VERIFIED, ACCEPTED), vermelho (Blocked, MISMATCH), âmbar (not yet anchored) |

### Navegação

Sidebar com grupos em **monoespaçada minúscula** ("Monitor", "Govern", "Prove"):
Overview, Agents, Activity / Risk (badge 3), Compliance, Policies / Evidence,
Integrations; no pé Audit log e Settings. Topo: breadcrumb "Activity > AT-849291"
com pílula vermelha "Blocked" e o agente à direita.

### Módulos

| Tela | Conteúdo |
|---|---|
| Evento (Decision graph) | abas Overview / Decision graph / Integrity / Controls; tabela chave-valor do evento; bloco Integrity com hashes em mono; controles mapeados (Art. 12, EU AI Act) e, à direita, a cadeia Trigger → Agent decision → Policy evaluation → Risk classification em cartões coloridos por etapa (roxo, lilás, vinho, âmbar) |
| Integridade | modal "INTEGRITY FAILED" com hash armazenado × recalculado e lista de eventos da faixa |
| Policies | condições como nós (Trigger, Condition, Action) e simulação de 30 dias |

![evento](../galeria/05-apresentacao/shot-4x3-escuro-sangria.jpg)

### O que funcionou

Os carrosséis de 3 imagens com legenda vazia ou mínima (o aviso de que entra no ar em breve, ou só o link)
funcionaram melhor que os que levam o nome do produto na legenda.

## Painel de pagamentos de agentes

| Campo | Valor |
|---|---|
| Nome | Painel de pagamentos de agentes (logo: ">|" branco em quadrado azul) |
| Setor | camada de controle entre agentes de IA e a rede de pagamento: gasto, aprovações, cartões, orçamentos |
| Tema | escuro |
| Acento | azul (logo, badge de aprovações "7"); botão de emergência em vermelho translúcido |
| Peças | o díptico cuja legenda apresenta a camada de controle entre agentes e rede de pagamento e chama a atenção para a interface, + folha de DS |

Sidebar em grupos AGENTS (Agents, Agent Network) / MONEY (Transactions, Approvals 7,
Cards and Wallets, Budgets) / RULES (Policies, Risk) / RECORD (Analytics, Audit Log)
e, no pé, **"Emergency controls"** em cartão vermelho translúcido. Conteúdo:
"Good morning, [nome]", KPIs "Total agent spend $84,420" e "Active agents 18 / 24",
stream "Agent activity" com agente, política em mono e merchant com logo real
(rede de anúncios, nuvem, provedor de modelo, CRM, provedor de modelo, editor de documentos).

![](../galeria/06-produtos/overview-tela.jpg)

## O que é específico deste setor

Prova e controle: hash, âncora de bloco, carimbo de tempo, versão de política,
botão de emergência. Escuro + mono + ID por toda parte comunicam "sistema de
registro". **[OBSERVADO]**

## Mais telas da série

Painel de auditoria de agentes: a política em blocos empilhados (Trigger, Condition 1 e 2, Action) com a
simulação dos últimos 30 dias, três cartões isolados (pesos por categoria com selo CHANGED, pacote de
evidências pronto com hash e "Share with [auditoria]", integração degradada com a correção sugerida), o
mapa de risco impacto × probabilidade e um vídeo das telas.


![politica condicoes simulacao escuro](../galeria/03-padroes-de-ia/politica-condicoes-simulacao-escuro.jpg)
![cartao pesos por categoria escuro](../galeria/02-componentes/cartao-pesos-por-categoria-escuro.jpg)
![cartao pacote de evidencias escuro](../galeria/03-padroes-de-ia/cartao-pacote-de-evidencias-escuro.jpg)
![cartao integracao degradada escuro](../galeria/03-padroes-de-ia/cartao-integracao-degradada-escuro.jpg)
![mapa de risco impacto probabilidade escuro](../galeria/03-padroes-de-ia/mapa-de-risco-impacto-probabilidade-escuro.jpg)
![video telas escuro  capa](../galeria/05-apresentacao/video-telas-escuro-capa-2.jpg)

Painel de pagamentos de agentes: o modal "New wallet" escuro (publicado duas vezes) e os dois vídeos-esteira do app
(claro e escuro). Ver [../05-apresentacao/video-e-movimento.md](../05-apresentacao/video-e-movimento.md).

![nova carteira](../galeria/03-padroes-de-ia/modal-nova-carteira-agente-escuro.jpg)

## Mais telas

### Painel de pagamentos de agentes

### Painel de auditoria de agentes

- O painel de pagamentos de agentes voltou com regra escrita em frase que vira política, revisão do agente com pagamento de teste, pagamento bloqueado com a trilha e o incidente de laço de compra.
- O painel de auditoria de agentes ganhou "Connect agent" com a origem do agente em cartões e o vídeo do que acontece depois que o agente faz o que não devia (decisão, política, pausa, pacote de auditoria).

Telas:

- Capa do vídeo do app do painel de pagamentos de agentes claro: esteira de três celulares (bloqueio, "Today", "Approvals") ![](../galeria/05-apresentacao/video-faixa-de-celulares-capa.jpg)
- Quadro a 15%: aprovações, o pedido de $1,800 e a confirmação com Face ID ![](../galeria/05-apresentacao/video-faixa-de-celulares-quadro-1.jpg)
- Quadro a 50%: a trilha da decisão, "Agents" e o agente de marketing ![](../galeria/05-apresentacao/video-faixa-de-celulares-quadro-2.jpg)
- Quadro a 85%: "Controls" com "Pause all agents" e a volta ao início ![](../galeria/05-apresentacao/video-faixa-de-celulares-quadro-3.jpg)
- Painel de auditoria de agentes escuro: "Connect agent · Step 1 of 3" com a origem do agente em cartões e "RECOMMENDED" no framework mais usado ![](../galeria/03-padroes-de-ia/conectar-agente-escolher-origem-escuro.jpg)
- Capa do vídeo do painel de auditoria de agentes escuro sobre fundo lilás desfocado: "Good morning, [nome]!" com o modelo de governança e a atividade ao vivo ![](../galeria/05-apresentacao/video-depois-do-agente-escuro-capa.jpg)
- Quadro a 15%: a decisão do agente com a avaliação da política e o risco, e o resultado "Blocked · policy owner notified" ![](../galeria/05-apresentacao/video-depois-do-agente-escuro-quadro-1.jpg)
- Quadro a 50%: o agente pausado com chamadas recusadas desde a pausa e "Resume agent" ![](../galeria/05-apresentacao/video-depois-do-agente-escuro-quadro-2.jpg)
- Quadro a 85%: pacotes de auditoria por norma com "Generating now" e a lista de checagens ![](../galeria/05-apresentacao/video-depois-do-agente-escuro-quadro-3.jpg)
- Painel de pagamentos de agentes escuro: "Describe a rule" em frase e a política gerada em campos com WHEN/AND/THEN/ELSE ![](../galeria/03-padroes-de-ia/regra-escrita-vira-politica-escuro.jpg)
- Painel de pagamentos de agentes escuro: "What [produto] understood" com os trechos da frase, o conflito com política ativa e "Not inferred" para confirmar ![](../galeria/03-padroes-de-ia/o-que-a-ia-entendeu-da-regra-escuro.jpg)
- Painel de pagamentos de agentes escuro: "New agent · Review and go live" com os passos em cartões, "Policy in plain English" e o pagamento de teste passando por cada checagem ![](../galeria/03-padroes-de-ia/revisar-e-ativar-agente-com-teste-escuro.jpg)
- Painel de pagamentos de agentes escuro: a tela "Review and go live" de novo, em quadro 4:3 ![](../galeria/03-padroes-de-ia/revisar-e-ativar-agente-com-teste-2-escuro.jpg)
- Painel de pagamentos de agentes escuro: pagamento de $4,800 "Blocked" com "Why this was blocked", a trilha da decisão, por que o agente pediu e "What [produto] suggests" ![](../galeria/03-padroes-de-ia/pagamento-bloqueado-com-trilha-escuro.jpg)
- Painel de pagamentos de agentes escuro: incidente "$840.00 Research Agent retry loop" com gasto em degraus, rastro de controle e "Turn this into a rule" ![](../galeria/04-tipos-de-tela/incidente-de-gasto-com-rastro-escuro.jpg)
- Painel de pagamentos de agentes escuro: popup "Import agents from the SDK" com agentes marcáveis e a nota de que nada pode gastar ainda ![](../galeria/02-componentes/popup-importar-agentes-escuro.jpg)
- Painel de pagamentos de agentes escuro: o pagamento de $4,800 bloqueado de novo, em 4:3 ![](../galeria/03-padroes-de-ia/pagamento-bloqueado-com-trilha-2-escuro.jpg)
