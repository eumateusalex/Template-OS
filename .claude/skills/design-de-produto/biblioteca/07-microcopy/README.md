# 07 · Microcopy de interface

O texto **dentro** das telas de referência: saudações, títulos, subtítulos, rótulos, estados,
botões, frases da IA e a linha cinza de metadado. É onde o método fica mais fácil de copiar e mais
fácil de errar, porque parece "só texto".

- Banco com **288 exemplos reais** classificados por função, com o recorte de origem quando há:
  [banco-de-frases.md](banco-de-frases.md).
- Recortes das telas citadas: `../galeria/03-padroes-de-ia/` (a mesma galeria da seção 03).
- Os padrões de IA que essas frases servem: `../03-padroes-de-ia/`.

Fonte: 24 produtos, lidos em tamanho real. Telas de 1024 px (parte
de Vero e Rillo) foram lidas com zoom e estão marcadas "leitura parcial" no banco.

---

## A tese

**Cada frase da tela responde uma pergunta que a pessoa faria em voz alta.** O título diz *o
quê*, o subtítulo diz *quanto e desde quando*, o selo diz *em que estado está*, o botão diz *o
que acontece se eu clicar*, e a frase da IA diz *por quê*. Texto nunca decora: não há slogan,
"Welcome to your dashboard", "Lorem ipsum" nem "Insights powered by AI" em nenhuma tela de
produto.

É a regra da homepage aplicada ao painel: "Every element
supports the same promise… The headline introduces it. The subheadline gives it context. The
CTA feels like the obvious next step."

---

## As regras

### Regra 1. Título curto, subtítulo que explica o dado **[MEDIDO no banco]**

| Tipo | Mediana de palavras | Máximo |
|---|---|---|
| Saudação | 3 ("Good morning, Sarah") | 4 |
| Título de página | 2 ("Data coverage", "Audit log") | 3 |
| Título de card | 2 ("Critical now", "Decision split") | 5 |
| Subtítulo de página | 12 | 24 |
| Subtítulo de card | 4,5 | 16 |
| Título de próximo passo | 3,5 ("Set a cost budget") | 6 |
| Motivo do próximo passo | 6 ("So anomaly detection has a baseline from day one.") | 9 |
| Botão | 2 ("Review risks") | 6 ("Ask Atlas to confirm a date") |
| Frase da IA (insight) | 18 | 45 (Fino's read) |

Contagem feita por script sobre as seções 1, 2, 3, 4, 7, 8 e 11 do banco.

Na tela, a diferença de tamanho é grande: no OrchestrateIQ o título "We found your system" tem
~36 px e o subtítulo ~12 px, uma razão de 3 para 1 (medido na altura de
tinta, fator ~2,47). O título carrega a ideia; o subtítulo, a prova.

### Regra 2. Número + contexto, sempre juntos

**13 de 20** subtítulos de card têm número (`7 projects flagged · updated 6 minutes ago`). Nos
KPIs, **todos** os 20 exemplos têm uma linha de contexto embaixo do valor, e ela é de um destes
quatro tipos:

| Tipo de contexto | Exemplo | Fonte |
|---|---|---|
| **Comparação** | "↑ 41% vs last week", "−1.8 pts fewer handoffs" | |
| **Causa** | "↑ $0.02 — driven by retries", "loops, retries, dropped context" | |
| **Consequência em dinheiro ou tempo** | "$18,600 prevented", "$9,240 held", "needs action today" | |
| **Condição** | "If all 7 are delivered", "at current growth rate" | |

Número sozinho não existe na interface do método. O contexto transforma o número em decisão: é o
"Good dashboards don't show more data. They help you make better decisions."

### Regra 3. O ponto médio "·" é a gramática do metadado

O banco tem **205 ocorrências** de "·". O ponto médio empilha atributos de uma
entidade em uma linha cinza, sempre na mesma ordem: **identidade · atributo · tempo ou estado**.

- "Support Agent · 9 Sep 10:48:02.117 UTC · Production"
- "Sarah Miller · reported 18 min ago"
- "INV-2841 · 18 days overdue"
- "Canva Enterprise · new vendor"

Regras de uso observadas:
1. Nunca vírgula, barra ou hífen para separar atributos (o "•" aparece duas vezes, em PriorAuth
   e Haulsight, com o mesmo papel).
2. Entre 2 e 4 atributos por linha; acima disso vira tabela.
3. A linha de metadado fica sempre **abaixo** do nome, em cinza, ~1 a 2 px menor.
4. O "·" também entra em título quando o título é composto: "Customer Support · Production",
   "Router Agent → Billing Agent". A seta "→" é reservada para **direção** (handoff, rota,
   mudança de estado: "Likelihood Possible → Likely").

### Regra 4. Frases completas quando a IA explica; fragmentos quando a tela rotula

- **Rótulo, selo, KPI e metadado:** fragmento, sem ponto final ("Needs you", "6 paused or in
  draft").
- **Explicação da IA, regra do sistema e aviso:** frase completa, com ponto final, sujeito e
  verbo ("Not every panel is live. Where a number is computed on a schedule, the product says
  so.").
- A mudança de registro sinaliza para a pessoa que ali há **raciocínio**, não dado.

### Regra 5. A IA fala na terceira pessoa, com nome, e mostra o raciocínio

- Sujeito explícito: "rillo cleared 148 on its own today", "vero does not fill in a blank with a
  guess", "Fino will update this insight when Brightline or Atlas replies or pays", "Permitly
  reads the address and builds the requirement set".
- Nome em minúscula quando o produto é minúsculo (rillo, vero). O nome é tratado como marca,
  não como pessoa.
- Estrutura do insight: **observação com número → comparação com o normal → recomendação**.
  "Brightline usually pays 9 days late, so 22 is unusual. On earlier invoices they paid within 4
  days of a reminder; this one has had two with no reply. A firm reminder today is the best next
  step."
- Quando decide, diz por quê em uma linha: "Firm because the last two friendly reminders got no
  reply."
- Quando não sabe, diz que não sabe: "Fino is unsure about these", "3 charges we're not sure
  about", "No signal yet", "genuinely unknown".
- Quando a decisão é do dono, devolve: "Plenty of people pay for both on purpose — only you
  know."

### Regra 6. O sistema diz o que **não** faz

É a assinatura mais rara e mais forte do método. Frases que declaram um limite do próprio produto:

- "Nothing was declared by hand."
- "vero does not report a confidence for a decision it declined to make."
- "Nothing has been actioned — this decision is held pending…"
- "…shown to auditors as 'supplied by workspace', never as automatic evidence."
- "own identity, never a person's"
- "Sampling is applied per rule, never globally…"
- "not counted above"

Molde: **afirmação + "never / not / nothing" + o que ficou protegido.** Serve para qualquer
produto que precise ganhar confiança.

### Regra 7. Verbos no condicional quando a ação ainda não aconteceu

"Would hold for approval", `would_have_held`, "Would act · within authority", "Would escalate",
"may miss their install dates", "Likely to miss the 4:00 PM delivery window", "Cash may dip below
your buffer around Oct 16". Condicional = simulação ou previsão; indicativo = fato registrado.
**[OBSERVADO em AgentTrail, Ergond, Permitly, Haulsight, Fino]**

### Regra 8. Botão = verbo + objeto do caso, e o botão muda com a linha

- "Review risks", "Review case", "Send escalation", "Call and confirm", "Send reminder", "Ask
  Atlas to confirm a date", "Cancel Perplexity".
- O objeto é o **nome real** quando cabe ("Cancel Perplexity", "Open incident INC-0001",
  "Share with [auditoria]", "Hand back to agent").
- O botão diz o que vai acontecer de fato: "Approve 2 of 3", "Review & send" (não "Send"),
  "Deny…" (as reticências avisam que abre confirmação).
- Depois da ação, o botão vira estado: "Reminded today" (desabilitado) + toast "Reminder sent to
  Dana · Undo".
- Link de navegação com seta e o destino: "Open approval center ›", "↗ View all", "View all 8 in
  Exceptions".
- **Nenhum** "Submit", "Click here", "Learn more", "Get started" nas telas de produto.
  **[OBSERVADO em 24 produtos]**

### Regra 9. Selo diz estado **e**, quando pode, a ação

- Estado puro, com ponto de cor: "● Live", "● Healthy", "● Critical".
- Estado que já é a ação: "Reassign", "Needs you", "Needs approval", "Review due".
- Estado com número: "3 overdue", "2 unverified", "7 pending", "22 days overdue".
- Estado com o motivo específico: "Synthetic receipt", "$404 over fare policy", "No receipt after
  6 days". **O selo nunca diz só "Flagged" ou "Warning".**
- Caixa-alta só em ambiente de auditoria (AgentTrail: "INTEGRITY FAILED", "HELD FOR APPROVAL",
  "CHAIN OK"). No resto, capitalização de frase.

### Regra 10. Rótulos em linguagem de pergunta humana

Onde outro produto poria "Details", escreva a pergunta:
"What it did", "What it looked at", "How to reverse it", "Why it matters", "What's behind it",
"Why the score is 91", "Why this account is quiet", "Where Lepo heard it", "Where it paid",
"Where it goes each month", "How long a stage takes", "How impact is scored", "How this is
ranked", "Why we flagged it", "Why this?".
**[OBSERVADO: 15 rótulos em 8 produtos]**

### Regra 11. Nomes reais, dados realistas, nada repetido

- **Pessoas com nome e sobrenome e papel:** "Dana Whitfield · Accounts payable", "Dr. Maya Chen ·
  Injector · $58.4k", "Marina (Purchasing)", "Alex Rivera · Operations manager".
- **Empresas plausíveis e variadas:** Northwind Systems, Halden Group, Brightline Health, Atlas
  Robotics, Luma Distribution, Aurora Supply Co., Harbell & Crane LLP. Marcas reais onde o
  realismo pede (Stripe, Salesforce, Anthropic PBC, Meta Ads, DigiCert, United Healthcare, Aetna).
- **Endereços e lugares reais:** "1254 Oak Street · Austin, TX 78704 · City of Austin",
  "Mirpur 10", "Lumière Soho · 142 Mercer St", rota "Dallas → Austin" com "I-35 congestion".
- **Ids com formato de sistema:** `tr_84921`, `sp_29184`, `AT-849302`, `PL-2841`, `INV-1042`,
  `txn_9f2c41ab`, `RK-041`, `EVP-0192`, `pol_external · v2`.
- **Números que fecham:** 696 + 134 + 62 = 892 no AgentPay; 78% + 15% + 7% = 100%. **[MEDIDO]**
- **Números "feios" de propósito:** $1,284,902.40, 92.4%, 3h 42m, 12.4 KB, 09:42:18.421. Número
  redondo parece inventado; evite.
- **Moeda e unidade do lugar:** R$ no Ergond (Brasil), ৳ no app de entregas de Bangladesh, € no
  AgentTrail, `µF` no Lepo.
- **Zero repetição entre linhas.** Contraste direto: no Salestrain (degrau genérico)
  a mesma linha "Carrie and David talk · 58m · 82%" aparece 7 vezes. Nas telas do método, nenhuma
  tabela examinada repete uma linha.

### Regra 12. Tempo sempre relativo **e** absoluto, conforme o uso

- Relativo onde a pessoa pergunta "há quanto tempo?": "reported 18 min ago", "updated 6 minutes
  ago", "2 min", "4m", "1d".
- Absoluto onde a pessoa vai auditar: "09:42:18.421", "9 Sep 10:48:02.117 UTC", "signed 10:47 UTC".
- Prazo em contagem regressiva quando há risco: "SLA 00:42", "expires in 12:40", "Today · in 1 h
  48 m".
- Frescor no cabeçalho de toda tela com dado vivo (Regra 2 da seção 03).

### Regra 13. Português? Não: inglês de produto, com capitalização de frase

Todas as telas são em inglês, com **sentence case** em título, card e botão ("Set a cost
budget", "Open approval center"). Title Case só em nome próprio de tela ou produto ("Live Agent
Map", "Open Agent Detail" aparece uma vez). Rótulo de seção pequeno em **caixa-alta com
espaçamento** ("NEEDS ATTENTION", "ASK ABOUT WHAT WE FOUND", "BLAST RADIUS · 24H"), e em
AgentTrail esse rótulo vai em monoespaçada minúscula ("decision chain", "other events in this
range · 13"). Para adaptar ao português, a regra que importa é a estrutura, não a língua: ver o
molde abaixo.

---

## Moldes prontos (com adaptação para português)

| Função | Molde | Exemplo da referência | Adaptação PT-BR |
|---|---|---|---|
| Saudação + resumo | `Good morning, {nome}` / `{N} {coisa} {estado}. {N} {outra} {estado}.` | "You've saved 3h 42m this week. Two lessons are ready for today." | "Bom dia, Carla" / "Você economizou 3h 42 esta semana. Duas propostas estão prontas para hoje." |
| Card de atenção | `{Título 2 palavras}` / `{N} {coisa} {estado} · updated {tempo} ago` | "Needs attention · 7 projects flagged · updated 6 minutes ago" | "Precisa de você · 7 pedidos parados · atualizado há 6 min" |
| KPI | `{rótulo}` / `{valor}` / `{comparação ou causa ou consequência}` | "Blocked this month · 23 · $18,600 prevented" | "Bloqueados no mês · 23 · R$ 18.600 evitados" |
| Próximo passo | `{Verbo} {objeto}` / `{motivo em uma frase}` / `{escopo} · {tempo}` | "Set a cost budget · So anomaly detection has a baseline from day one." | "Defina um teto de gasto · Assim o alerta de custo já nasce com referência." |
| Insight da IA | `{observação com número}. {comparação com o normal}. {recomendação}.` | Fino's read | "A Clínica Sol costuma pagar com 9 dias de atraso, então 22 é fora do padrão. O melhor passo hoje é um lembrete firme." |
| Limite do sistema | `{afirmação}. {Nothing/never} {o que ficou protegido}.` | "Everything below was inferred… Nothing was declared by hand." | "Tudo abaixo foi descoberto nos seus 412 atendimentos. Nada foi preenchido à mão." |
| Autoridade | `Agent {nome} · within authority ✓` / `Out of authority · agent escalated. {Pessoa} ({área}) joined.` | Ergond | "Agente Ana · dentro do limite ✓" / "Fora do limite · a Marina (Compras) assumiu a conversa." |
| Metadado | `{identidade} · {atributo} · {tempo}` | "Sarah Miller · reported 18 min ago" | "Sarah Miller · avisou há 18 min" |

⚠️ Na adaptação para o português, lembrar a régua de linguagem de balcão (`_memoria/escrita-publica.md`): falar com
"você", dizer o que se perde, sem jargão e sem travessão em texto que o público vê. Os moldes
acima já seguem isso; os originais em inglês têm travessão e ficam só como referência.

---

## Checklist de microcopy (antes de entregar uma tela)

- [ ] Título com até 3 palavras; subtítulo com número e contexto.
- [ ] Todo KPI com linha de comparação, causa, consequência ou condição.
- [ ] Metadado com "·", 2 a 4 atributos, na ordem identidade · atributo · tempo.
- [ ] Toda frase de IA com sujeito (o nome da IA), número, comparação e recomendação.
- [ ] Pelo menos uma frase de "o que o sistema não faz" onde houver risco de desconfiança.
- [ ] Condicional em simulação e previsão; indicativo em fato.
- [ ] Botão = verbo + objeto real; muda de estado depois do clique; tem "Undo" se agiu sozinho.
- [ ] Selo com o motivo específico, não "Warning".
- [ ] Rótulos de detalhe escritos como pergunta ("Why it matters").
- [ ] Nomes, empresas, endereços e ids realistas; nenhuma linha repetida; números que somam.
- [ ] Tempo relativo onde se pergunta "há quanto", absoluto onde se audita, contagem regressiva
      onde há prazo.
- [ ] Nenhum lorem ipsum, "Welcome to your dashboard", "Learn more", "Submit".

## O que as séries mais recentes acrescentam

54 frases (de 235 a 288 no banco), lidas nas telas das séries mais recentes. Cinco regras que elas
mostram com mais clareza que o resto do banco:

1. **A frase embaixo da saudação é um achado, não uma contagem.** *"Clawback found 6 new claims worth
   $4,960 in yesterday's jobs."* em vez de "12 active cases". O mesmo no subtítulo de relatório
   em serifa do Bench (*"Time to field ready fell 4.1 days this quarter. Interview scheduling is now
   the longest wait before a hire."*).
2. **Toda estimativa da IA traz a ressalva escrita**, curta e no pé do cartão: *"An estimate from the
   case information available. Not a guarantee."*; e todo texto gerado traz quem responde por ele:
   *"Review every statement against the source. You are responsible for what is submitted."*
3. **Dizer o que a pessoa NÃO precisa fazer.** *"You don't need to do anything for this stage. Michael
   will message you the moment something changes."* e *"We'll let you know the moment he arrives"*.
4. **A regra do agente em frase e em lista negativa**: *"Lora plans first, then asks, then does."*,
   a lista "Lora never" e *"Signing in gives Lora no access."*
5. **O efeito antes da ação, em número**: *"Replayed against the last 50 runs, 47 would take Then and 3
   would take Else."*, *"What changing it would have caught · last 7 days"*.

E duas vozes de marca na própria interface: **caixa minúscula** do começo ao fim no Quotepilot
("sarah knows you're coming", "price it with ai") e **título em serifa** no Clawback e no Bench.

