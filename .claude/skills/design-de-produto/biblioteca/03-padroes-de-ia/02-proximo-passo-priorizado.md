# 02 · Próximo passo priorizado

## O que é

Uma lista curta de ações que **só o humano pode fazer**, ordenada, com a primeira destacada
("Do first") e cada item explicando **por que** importa e **quanto custa** fazer. A IA já fez o
resto; esta lista é o que sobrou para a pessoa.

## Problema que resolve

Painel de dados responde "o que está acontecendo?", mas a pessoa quer saber "o que eu faço
agora?". Em uma linha: painel bom não mostra mais dado, ajuda a decidir
melhor. O próximo passo transforma o painel em lista de
decisões.

## Anatomia (painel de agentes hospitalares)

![Next steps com Do first](../galeria/03-padroes-de-ia/next-steps-do-first.jpg)

- **Título do card:** "Next steps" + botão "↗ View all".
- **Item 1 em destaque total:** fundo amarelo `#FFD33F` (medido), título "Name your workflows",
  razão "Runtime IDs are hard to read in an incident.", pílula "● Do first" no canto.
- **Metadado de esforço em pílulas brancas:** "2 workflows" (escopo) e "~2 min" (tempo), mais
  um grupo de avatares de agentes afetados com contador "6".
- **Itens 2 e 3 em card branco com borda:** "Set a cost budget · So anomaly detection has a
  baseline from day one." com pílulas "$0 / day" e "Sep 9"; "Invite your on-call · Incidents
  need an owner before the first one opens."

Repare na estrutura de cada item: **verbo no imperativo + objeto** no título, e **"so / because"
implícito** no subtítulo (o motivo, nunca a descrição).

## Medidas **[MEDIDO, fator ~2,47]**

- Card "Do first": 898 × 307 px no 4096, **~363 × 124 px**. Raio: o primeiro pixel amarelo da
  borda superior começa 35 px para dentro, o que corresponde a um raio de ~45 px no 4096,
  **~18 px** na tela.
- Cor do destaque: `#FFD33F` (amostra) e `#FCD23C` (cor dominante saturada da imagem, 10.141
  amostras). É a única área amarela da tela: o destaque vale por ser único.

## Variações (o mesmo padrão em cada vertical)

| Produto | Nome do bloco | Como prioriza | Ação |
|---|---|---|---|
| Painel de agentes hospitalares | "Next steps" | pílula "Do first" | título é a ação |
| Painel de licenciamento solar | "Needs attention · 7 projects flagged · updated 6 minutes ago" | chip "✦ Ranked by [produto]" na tabela, colunas Blocker / Risk / Due | "Review risks" |
| App de autorização prévia | "Attention required · Sorted by procedure date, then approval odds" | critério de ordenação escrito no subtítulo | "Review case" por linha |
| App de contas a receber | "Today's collection plan · 8 actions" | valor + risco (High / Medium) | a ação muda por linha: "Send escalation", "Call and confirm", "Send reminder" |
| App de frota | "Critical now · 8 shipments" | score de risco 0 a 100 com barras | "Review action" (amarelo) + "Open" |
| App de manutenção predial | "Needs attention" | Urgent / Reassign / Waiting | o selo já é a ação ("Reassign") |
| App de financiamento imobiliário | "Action required · 2 open · Two things need your attention. Everything else is with Michael." | só o que depende do cliente | "Upload" |
| App de entregas | card laranja "Needs you · 1 buyer hasn't confirmed · Rumana · Banani" | um item só, em cor quente | seta ↗ |
| App de caixa | tela inteira "Needs you" com "To do · 6 / Done · 14", agrupada em TODAY e THIS WEEK | tempo | "See plan", "Remind", "Reconnect", "Scan" |

![assistente de IA do licenciamento ranqueando](../galeria/03-padroes-de-ia/assistente-de-ia-ranqueando.jpg)
![app de caixa: Needs you](../galeria/03-padroes-de-ia/needs-you.jpg)

## Quando usar

Em **toda tela inicial** de produto com IA que foi examinada. Na tela inicial aparece
como card; em app móvel vira a tela inteira (app de caixa) ou um card de cor quente (app de entregas).
**[OBSERVADO em 9 produtos]**

## Regras que se repetem

1. **O critério de ordenação é escrito**, não fica implícito: "Sorted by procedure date, then
   approval odds" ([produto]), "Ranked by assistente de IA do licenciamento" ([produto]), "Confidence first, then monthly
   saving" (painel de agentes hospitalares Insights).
2. **Um destaque por tela.** O item 1 ganha a cor de marca mais quente; os outros ficam neutros.
3. **O que não depende do usuário é dito como fora da lista:** "Everything else is with Michael"
   (app de financiamento imobiliário).
4. **A ação é específica da linha.** App de contas a receber troca o verbo do botão conforme o caso; nunca
   "Take action" genérico.
5. **Cada item tem custo de esforço visível** quando a ação é do usuário ("~2 min",
   "2 workflows") e **custo de não agir** quando o risco é de negócio ("$2,400 exposure",
   "Revenue at risk $184,500").

## Como reproduzir

```html
<section class="card">
  <header><h2>Next steps</h2><a class="btn-ghost">↗ View all</a></header>
  <article class="step step--first">              <!-- fundo de destaque único -->
    <span class="pill">● Do first</span>
    <h3>Name your workflows</h3>                    <!-- imperativo + objeto -->
    <p>Runtime IDs are hard to read in an incident.</p>  <!-- o motivo -->
    <ul class="meta"><li>2 workflows</li><li>~2 min</li></ul>  <!-- escopo e tempo -->
  </article>
  <article class="step"> … </article>              <!-- 2 a 3 itens no máximo -->
</section>
```

Tailwind: `rounded-[18px] bg-[#FFD33F] p-5` no item 1; `rounded-[18px] border border-zinc-200
bg-white p-5` nos demais; pílulas `rounded-full bg-white px-3 py-1.5 text-sm`.

## Mais exemplos

Telas de outras séries que repetem ou estendem o padrão (fichas em [../06-produtos/](../06-produtos/README.md)).

- **App de autorização prévia, detalhe do caso** — o cartão lima "Next best action · Request the imaging report from Dr. Wilson's office" com o botão do pedido, ao lado da chance de aprovação que esse documento destrava.
  ![app de autorização prévia, detalhe do caso](../galeria/03-padroes-de-ia/detalhe-do-caso-proxima-acao.jpg)
- **App de escala domiciliar, agenda** — "AI Copilot · 2 suggestions ready · Save 1.5 overtime hours and fill 1 open shift" e, aberta na grade, "Suggestion 1 of 3 · Move James's 2 PM visit to Maria" com o porquê e Apply / Skip.
  ![app de escala domiciliar, agenda](../galeria/03-padroes-de-ia/sugestao-da-ia-na-agenda.jpg)
- **Painel de retornos de serviço, causa raiz** — "Suggested action · Built from the 48 callbacks" com a ação em uma frase e o valor estimado.
  ![painel de retornos de serviço, causa raiz](../galeria/03-padroes-de-ia/causa-raiz-acao-sugerida.jpg)
- **App de locação residencial, contexto da conversa** — o cartão preto "Recommended action · Schedule Tour" com o horário já escolhido e o botão amarelo.
  ![app de locação residencial, contexto da conversa](../galeria/03-padroes-de-ia/mobile-folha-contexto-da-ia.png)

## Mais exemplos

Telas que repetem ou estendem o padrão (fichas em [../06-produtos/](../06-produtos/README.md)); uma linha por imagem.

- **App de cozinha com IA** — app de cozinha com IA: "What [produto] noticed" sobre o desperdício de frango com três números e "Apply to Tuesday's plan".
  ![app de cozinha com IA](../galeria/03-padroes-de-ia/o-que-a-ia-notou-desperdicio.jpg)
- **App de cozinha com IA** — app de cozinha com IA no iPhone: folha "Tomatoes are 12 kg short" com fornecedor, custo e "[produto] suggests 15 kg" antes de "Send request".
  ![app de cozinha com IA](../galeria/03-padroes-de-ia/sugestao-de-pedido-na-folha-iphone.jpg)
- **App de cuidado domiciliar** — app de cuidado domiciliar: "Today's route" no mapa e "[produto] suggests a new order" com os minutos poupados e a ordem das visitas.
  ![app de cuidado domiciliar](../galeria/03-padroes-de-ia/nova-rota-sugerida.jpg)
- **App de cuidado domiciliar** — app de cuidado domiciliar: "Live visits" com visita em risco, mapa ao vivo e o cartão sugerido "Reassign to Abena Ofori" ao lado de "Keep Davi".
  ![app de cuidado domiciliar](../galeria/03-padroes-de-ia/visitas-ao-vivo-com-reatribuicao.jpg)
- **App de locação residencial** — app de locação residencial: colunas de intenção, próxima ação ("AI is replying", "Review AI reply", "Take over chat"), agente e status.
  ![app de locação residencial](../galeria/03-padroes-de-ia/proxima-acao-do-agente-por-lead.jpg)
- **App de cuidado domiciliar** — app de cuidado domiciliar: popup "Missed visit" com o que o sistema viu, o motivo em chips e a ação sugerida de remarcar com outra cuidadora.
  ![app de cuidado domiciliar](../galeria/03-padroes-de-ia/visita-perdida-com-proximo-passo.jpg)
- **Anotador por voz** — anotador por voz escuro no iPhone: "Next steps" com sugestões marcadas no tempo do áudio (vazamento, troca, plano) e Skip.
  ![anotador por voz](../galeria/03-padroes-de-ia/proximos-passos-sugeridos-escuro.jpg)
- **App de locação residencial** — app de locação residencial: lead Sarah Mitchell com etapas, "AI summary" em amarelo, chips de intenção e atividade com rascunho esperando aprovação.
  ![app de locação residencial](../galeria/03-padroes-de-ia/lead-com-resumo-da-ia.jpg)
- **App de contas a receber** — app de contas a receber: "Today's collection plan" com a fila ranqueada por valor recuperável, a ação por linha e "How this was ranked".
  ![app de contas a receber](../galeria/03-padroes-de-ia/plano-de-cobranca-ranqueado.jpg)
- **App de locação residencial** — app de locação residencial no iPhone: lead com "AI summary" em amarelo, intenção alta e "AI suggested next action · Schedule a tour" com horários.
  ![app de locação residencial](../galeria/03-padroes-de-ia/lead-com-resumo-e-proxima-acao-iphone.jpg)
- **App de cozinha com IA** — app de cozinha com IA: "Inventory" com o popup "Mark an alternative ingredient", a melhor opção marcada e "What this covers".
  ![app de cozinha com IA](../galeria/03-padroes-de-ia/ingrediente-alternativo-com-o-que-cobre.jpg)
- **App de cuidado domiciliar** — app de cuidado domiciliar: o popup "Missed visit" de novo.
  ![app de cuidado domiciliar](../galeria/03-padroes-de-ia/visita-perdida-com-proximo-passo-2.jpg)
- **App de locação residencial** — app de locação residencial: aplicação de Daniel Okafor 83% com checklist e o cartão amarelo "Missing information detected" com a mensagem sugerida.
  ![app de locação residencial](../galeria/03-padroes-de-ia/informacao-faltando-detectada.jpg)
- **App de manutenção preditiva** — app de manutenção preditiva: "Insights" com lista de previsões e custos, o detalhe "HVAC invoices" com 94% de confiança, "Why [produto] flagged this" e ação recomendada.
  ![app de manutenção preditiva](../galeria/03-padroes-de-ia/insight-com-por-que-e-acao-recomendada.jpg)
- **App de cuidado domiciliar** — app de cuidado domiciliar: "Live visits" com a reatribuição sugerida de novo.
  ![app de cuidado domiciliar](../galeria/03-padroes-de-ia/visitas-ao-vivo-com-reatribuicao-2.jpg)
- **Painel de inteligência de pagamentos** — painel de inteligência de pagamentos: "Insights" com KPIs, lista por impacto e o detalhe "+$21,600" com "Why [produto] suggests this" e ação recomendada.
  ![painel de inteligência de pagamentos](../galeria/03-padroes-de-ia/insights-com-acao-recomendada.jpg)
- **Painel de retornos de serviço** — painel de retornos de serviço: "Incorrect diagnosis" com 48 retornos, falhas por categoria e filial e "Suggested action · Built from the 48 callbacks" com "Create action".
  ![painel de retornos de serviço](../galeria/03-padroes-de-ia/causa-raiz-com-acao-sugerida-2.jpg)
- **App de consultoria com IA** — app de consultoria com IA: o assistente responde à queda de conversão com "Step 1 · Diagnose the conversion drop", três áreas e "Recommended next step" com o porquê.
  ![app de consultoria com IA](../galeria/03-padroes-de-ia/passo-do-metodo-com-proximo-passo.jpg)
