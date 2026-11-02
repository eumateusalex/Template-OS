# 05 · Governança: política Trigger → Conditions → Action, modo monitor e simulação

## O que é

A regra que limita o agente é desenhada como um **objeto de primeira classe**, com nome, versão,
dono, escopo e histórico, e lida como uma frase de três partes: **quando** acontece
(Trigger), **se** (Conditions), **então** (Action). Antes de valer, a regra roda em **modo
monitor** e a tela mostra o que ela **teria feito** ("would have held").

## Problema que resolve

Quem governa agente não é engenheiro: é compliance, jurídico, financeiro. Regra escrita em
código ou YAML não é auditável por essas pessoas. E ligar uma regra nova direto em produção
quebra fluxo que funcionava. A simulação responde "o que muda se eu ligar isso?" antes de ligar.

## Anatomia (painel de auditoria de agentes, a peça que pergunta o que está errado na tela)

![Política em três blocos](../galeria/03-padroes-de-ia/policy-trigger-conditions-action.jpg)

1. **Breadcrumb e estado:** "Policies › External Communication" + selo âmbar **"Monitor"**.
2. **Abas do objeto política:** Overview · Conditions · Exceptions · 2 · Versions · 2 ·
   Simulation. O contador vai na própria aba.
3. **Título + identificador de máquina:** "External Communication" + `pol_external · v2` em
   monoespaçada rosa.
4. **Frase-resumo com escopo e dono:** "Holds any outbound call to a host outside the approved
   allowlist · 6 agents · owner Ana Ruiz".
5. **Dois KPIs de impacto**, com rótulo em estilo de variável (`evaluations_30d`,
   `would_have_held`): "22,118 · 6 agents in scope" e "41 · 0.19% of evaluations · 3 agents"
   (o segundo em âmbar, a cor do modo monitor).
6. **O canvas da regra**, com fundo pontilhado e três blocos ligados por um conector
   vertical curto (ponto, linha, ponto):
   - **Trigger** (roxo): "Tool call · outbound HTTP · Any agent in scope makes a request to a
     host".
   - **Conditions** (rosa) com o modo de combinação em selo à direita "ALL MUST M[ATCH]":
     "#host not in allowlist · #payload contains customer_id · 2 conditions · allowlist has
     14 hosts".
   - **Action** (âmbar) com selo "MO[NITOR]": "**Would** hold for approval · notify owner ·
     In enforcing mode the request is held up to 15 minutes, then denie[d]".
7. **"Simulation · last 30 days"** com gráfico de volume logo abaixo.

Note o verbo condicional no bloco de ação. Enquanto a política está em monitor, **a interface
fala no condicional** ("Would hold", "would_have_held"). É o mesmo recurso do test console do
painel de agentes de operação ("Would act · within authority", "Would escalate").

## Cores do canvas **[MEDIDO]**

Cor saturada dominante do violeta de marca: `#786CF0`. O âmbar do monitor: família `#96722A`
a `#A87E30` nas bordas e fundos escuros. Cada bloco tem fundo tingido da própria cor (roxo
escuro, bordô, marrom) e um sub-card interno mais escuro com o texto branco. **[OBSERVADO]**

## A mesma regra, vista no evento (cadeia de decisão)

Quando a política dispara, o evento mostra a cadeia na mesma gramática de três cores
(painel de auditoria de agentes):

> "decision chain · ● Trigger · Customer requested refund · order #88213 · ● Policy ·
> Financial Action v2 · amount > €250 · ● Outcome · Held · waiting for approver"

E no grafo de decisão de um evento bloqueado: Trigger → Agent decision
→ Policy evaluation ("PII Export Policy · v3 · Destination outside approved bound[ary] ·
volume > 1,000") → Risk classification ("High — PII leaving the approved b[oundary]"), com
"Mapped controls · Art. 12 — Record keeping · EU AI Act".

![Grafo de decisão bloqueada](../galeria/03-padroes-de-ia/decision-graph-blocked.jpg)

## Variações

| Produto | Onde a política aparece | Linguagem |
|---|---|---|
| Painel de auditoria de agentes | objeto próprio (Policies), com Versions, Exceptions e Simulation | Trigger / Conditions / Action |
| Painel de agentes de operação | dentro da ficha do agente: "INSTRUCTIONS / POLICY · v3 draft · 1 line changed" com a linha nova em verde ("+ Don't: negotiate price, approve limits, share internal scoring.") | Tone / Do / Don't + "Authority ceiling by phase" + "Escalation rules · 4" |
| Painel de permissões de agentes | Command Center: "Attempted restricted action · Blocked automatically · Sales Agent › [CRM] · 10:44 AM"; gráfico "Agent actions" com tooltip "Allowed 5,392 · Held 61 · Blocked 27" | três resultados fixos: Allowed, Held, Blocked |
| Painel de pagamentos de agentes | "Agent and policy" como coluna da tabela (cada agente mostra a política que o rege: "Marketing Agent · Marketing Spend v3", "Research Agent · Research APIs v1") | "Approved autonomously / Sent for human approval / Blocked by policy" |
| Painel de compliance de IA | "AI Activity · Every AI-assisted action detected on client work. Nothing becomes a compliance record…" com abas Needs Review 12 · In Progress 3 · Documented 231 · Unmatched | classificação em massa: "Classify as Low Risk", "Assign to matter" |
| CRM de receita | a regra aparece no decision record como código: `conflict.two_permitted_sources_disagree` | regra com nome legível por máquina + explicação humana |

![painel de pagamentos de agentes: política como coluna](../galeria/03-padroes-de-ia/overview-emergency.jpg)

## Autonomy with boundaries (painel de pagamentos de agentes)

Na folha de tipografia do design system do painel de pagamentos de agentes a frase de amostra
em todos os tamanhos é **"Autonomy with boundaries"**. É texto de amostra, não uma regra escrita;
a leitura de que ela resume os padrões 05 e 06 é **[INFERIDO]**. O produto que acompanha ("painel de pagamentos de agentes is a control layer between AI
agents and the payment network") mostra a fronteira em números: "Decision split · Today, so far
· 892 payments through the policy engine" dividido em **Approved autonomously 696 · 78%**,
**Sent for human approval 134 · 15%**, **Blocked by policy 62 · 7%**, numa barra de três
segmentos (azul, cinza escuro, vermelho). Ver padrão 06 para o detalhe.

## Quando usar

Em todo produto de **governança de agentes** (painel de auditoria de agentes, painel de permissões de agentes, painel de pagamentos de agentes, painel de compliance de IA) a
política é objeto próprio. Em produto de **operação** (painel de agentes de operação, CRM de receita) a política mora dentro da
ficha do agente ou do registro. **[OBSERVADO em 6 produtos]**

## Como reproduzir

1. Três blocos empilhados, cada um com cor fixa: Trigger (violeta), Conditions (rosa),
   Action (âmbar). Conector curto de ponto a ponto entre eles.
2. Cada bloco: rótulo com ícone na cor + sub-card com **frase em negrito** (a regra) e
   **frase cinza** (o escopo ou a consequência).
3. Selo de combinação nas condições ("ALL MUST MATCH" / "ANY").
4. Estado da política no topo: **Monitor** (âmbar) ou **Enforcing**. Em monitor, verbos no
   condicional.
5. Mostre o impacto antes de ligar: avaliações no período + quantas **teriam** sido retidas,
   em número e em percentual, e quantos agentes seriam afetados.
6. Identificador de máquina (`pol_external · v2`) ao lado do nome humano, sempre.
7. Dono nomeado ("owner Ana Ruiz"). Política sem dono não existe na interface.

## Mais exemplos

Telas de outras séries que repetem ou estendem o padrão (fichas em [../06-produtos/](../06-produtos/README.md)).

- **Assistente de reembolso, condição** — o popup de condição com a faixa *"Replayed against the last 50 runs, 47 would take Then and 3 would take Else"*: o efeito da regra aparece antes de salvar.
  ![assistente de reembolso, condição](../galeria/03-padroes-de-ia/popup-editar-condicao-replay-assistente-reembolso.jpg)
- **Construtor de agentes, publicar** — "Dry run · last 20 events" e a checagem antes de publicar ("1 of 5 blocking").
  ![construtor de agentes, publicar](../galeria/03-padroes-de-ia/construtor-com-simulacao.jpg)
- **Painel de auditoria de agentes, política** — Trigger, condições e ação em blocos, com a simulação "7 events would have been held" nos últimos 30 dias.
  ![painel de auditoria de agentes, política](../galeria/03-padroes-de-ia/politica-condicoes-simulacao-escuro.jpg)
- **Painel de agentes hospitalares, padrão de loop** — a regra de detecção em mono ("(caller → callee) pair repeats… total tokens > 50,000"), o limiar em slider (3 cycles) e "What changing it would have caught · last 7 days": 19 detecções e 11 falsos positivos num limiar, 4 e 0 no escolhido, 2 com o incidente INC-2479 perdido, 1 com 3 perdidos.
  ![painel de agentes hospitalares, padrão de loop](../galeria/03-padroes-de-ia/padrao-loop-de-delegacao.jpg)
- **Cartão de recurso "Replay on 30 days"** — "128 of 128 caught · 0 false blocks" e a frase "Test a contract against real history before it blocks anything.".
  ![Cartão de recurso "Replay on 30 days"](../galeria/02-componentes/cartao-recurso-replay-30-dias.jpg)
- **Painel de agentes de operação, IAM** — a matriz de permissões com a regra explicada, quem tem a permissão e a simulação "What if".
  ![painel de agentes de operação, IAM](../galeria/03-padroes-de-ia/matriz-permissoes-iam.jpg)

## Mais exemplos

Telas que repetem ou estendem o padrão (fichas em [../06-produtos/](../06-produtos/README.md)); uma linha por imagem.

- **Painel de permissões de agentes** — painel de permissões de agentes escuro: "What can this agent do?" com matriz ler/criar/editar/apagar por sistema e a mudança para "Approval".
  ![painel de permissões de agentes](../galeria/03-padroes-de-ia/permissoes-por-objeto-do-agente.jpg)
- **Painel de pagamentos de agentes** — painel de pagamentos de agentes escuro: "Describe a rule" em frase e a política gerada em campos com WHEN/AND/THEN/ELSE.
  ![painel de pagamentos de agentes](../galeria/03-padroes-de-ia/regra-escrita-vira-politica-escuro.jpg)
- **Painel de pagamentos de agentes** — painel de pagamentos de agentes escuro: "What [produto] understood" com os trechos da frase, o conflito com política ativa e "Not inferred" para confirmar.
  ![painel de pagamentos de agentes](../galeria/03-padroes-de-ia/o-que-a-ia-entendeu-da-regra-escuro.jpg)
- **Painel de pagamentos de agentes** — painel de pagamentos de agentes escuro: "New agent · Review and go live" com os passos em cartões, "Policy in plain English" e o pagamento de teste passando por cada checagem.
  ![painel de pagamentos de agentes](../galeria/03-padroes-de-ia/revisar-e-ativar-agente-com-teste-escuro.jpg)
- **Painel de pagamentos de agentes** — painel de pagamentos de agentes escuro: a tela "Review and go live" de novo, em quadro 4:3.
  ![painel de pagamentos de agentes](../galeria/03-padroes-de-ia/revisar-e-ativar-agente-com-teste-2-escuro.jpg)
- **Console de agentes de voz** — console de agentes de voz escuro: diagnóstico "Refund workflow failed" com o popup "Create test case" a partir da chamada e "Block deploy if this test fails".
  ![console de agentes de voz](../galeria/03-padroes-de-ia/criar-caso-de-teste-da-falha-escuro.jpg)
- **** — painel de auditoria de agentes escuro: "Connect agent · Step 1 of 3" com a origem do agente em cartões e "RECOMMENDED" no framework mais usado.
  ![](../galeria/03-padroes-de-ia/conectar-agente-escolher-origem-escuro.jpg)
