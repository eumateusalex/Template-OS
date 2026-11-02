# 03 · Confiança, verificação, cobertura e frescor explícitos

## O que é

Toda saída da IA vem acompanhada de **quanto ela tem certeza**, **o que ela checou**, **o que
ela não viu** e **de quando é o número**. Nenhum dado gerado por IA aparece "limpo", como se
fosse fato.

## Problema que resolve

O usuário não sabe distinguir o que a IA sabe do que a IA chutou. Sem isso, ou ele confia em
tudo (e erra) ou em nada (e refaz o trabalho). A resposta do método é tornar a incerteza um
**elemento de interface**, com a mesma hierarquia do dado.

## As quatro camadas, com exemplos reais

### 1. Confiança numérica ou em faixa

- "6 agents · **92% confidence**", "2 workflows · **88% confidence**" (painel de agentes hospitalares).
- Régua escrita de como a confiança é medida (Insights do painel de agentes hospitalares):
  > "HOW THIS IS RANKED · Confidence first, then monthly saving. Effort counts how many agents
  > and contracts a change touches."
  > "● High ≥1,000 runs, reproducible in replay · ● Medium ≥100 runs, or inferred from
  > topology · ● Low Pattern match — verify before acting"
- CRM de receita ao lado de cada campo derivado: barra curta + percentual ("96%", "99%", "71%", "84%")
  + a fonte ("Email", "Meeting", "Call").
- Painel de agentes de operação: regra de escalonamento "Confidence below 0.7 → human review".
- App de autorização prévia: "Approval odds" por caso, 78% / 61% / 47% / 66% / 54%, com barra segmentada em
  cor (verde, amarelo, laranja).
- App de caixa: "Buffer at risk · Oct 16 · **17% chance** of dipping"; gráfico com "$71.4K likely"
 .

![Régua de confiança](../galeria/03-padroes-de-ia/incident-timeline-ranking.jpg)

### 2. Estado de verificação (qualitativo)

- "9 handoffs · **2 unverified**" (painel de agentes hospitalares).
- "What [produto] checked": cinco verificações com estado individual, "Corroborated" em verde e
  "Not corroborated" em cinza, e o total "1 of 5 corroborated" (app de despesas com IA).
- Anotador por voz: selos "Clear audio", "Matches photo caption" (verdes) e "Said once" (cinza)
 . O "Said once" é o aviso de fonte única, sem alarme.
- Painel de auditoria de agentes: eventos "marked **UNVERIFIED**, which blocks Art. 12 requirement 5"
 ; manual evidence mostrado aos auditores "as 'supplied by
  workspace', never as automatic evidence".
- App de assinaturas: "3 charges we're not sure about · $47.99 a month · **not counted above**"
 . O que a IA não tem certeza fica fora do total.

![painel de auditoria de agentes: integração com eventos UNVERIFIED](../galeria/03-padroes-de-ia/integration-unverified.jpg)

![app de despesas com IA: o que a IA checou](../galeria/05-apresentacao/shot-perspectiva-inclinada.jpg)

### 3. O que a IA não sabe e se recusa a inventar

- CRM de receita, embaixo do registro do lead:
  > "Eight fields. Six were derived, one was pinned by a person, one is in conflict and one is
  > genuinely unknown. **CRM de receita does not fill in a blank with a guess.**"
- CRM de receita, no decision record: "How confident · Not applicable · CRM de receita does not report a confidence
  for a decision it declined to make."
- CRM de receita, campo "Competitor: —" com "No signal yet" à direita.
- Explicação do score: "Why the score is 91" lista os sinais com peso (+18, +14, +9, −6, −4) e
  fecha com "Fourteen signals were considered. The nine not shown moved the score by less than
  two points each."

![CRM de receita: record e score](../galeria/03-padroes-de-ia/record-score.jpg)

### 4. Cobertura e frescor do dado

A tela inteira de "Data coverage" do painel de agentes hospitalares existe para isso:

- Título "Data coverage", subtítulo "**What painel de agentes hospitalares has actually seen · and what it has
  not**".
- KPIs: "Coverage · 7 days 98.4% · 2h 41m of gaps", "Sampling 1:1 · below 2M spans / day",
  "Data freshness 2s · p95 ingest".
- "Coverage by source": barras por fonte (framework de agentes · Production, framework de agentes · Staging) com as
  lacunas em laranja.
- "Sampling rules · Sampling is applied per rule, never globally, so a sampled workspace still
  keeps every failure and every anomaly." Linhas "Failed runs · always kept · 1:1",
  "Successful runs under 2s · sampled · 1:20", "Health-check traffic · dropped · 0:1".
- "Freshness · **Not every panel is live. Where a number is computed on a schedule, the product
  says so.**" Linhas "Live Agent Map · 2s lag · streaming", "Cost attribution · provider
  billing lag · 15 minutes", "Insights & advisor · needs a full window to rank · 6 hours".

![Data coverage e freshness](../galeria/03-padroes-de-ia/data-coverage-freshness.jpg)

E, em escala menor, o frescor aparece em quase todo cabeçalho: "updated 6 minutes ago"
(painel de licenciamento solar), "[produto] · 6 min ago", "synced 12s ago" (app de frota), "Last updated 2 min ago"
(painel de permissões de agentes), "Last synced Sep 9, 5:02 PM" (app de caixa), "streaming · last 60 s" (painel de agentes hospitalares Live Map).

## Comparar com o normal daquela entidade

A confiança no método quase nunca é abstrata: a IA compara o caso com **o histórico do próprio caso**.

- "Delay is 2.2x their normal pattern" / "Third missed promise this quarter" (app de contas a receber).
- "Brightline usually pays 9 days late, so 22 is unusual." (app de caixa's read).
- "Days late, last 9 paid + this one · Dashed = expected" com a barra tracejada da previsão
  (app de caixa, tela do cliente app de caixa de estúdio Robotics).
- "First meals claim from this cardholder in 14 months." (app de despesas com IA, "Historical pattern").
- "Usage is healthy. The silence is not about the product." (CRM de receita, Halden Group,
 , leitura parcial em imagem de 1024 px). **[OBSERVADO]**

## Medidas e cores **[MEDIDO]**

- Chip de confiança do painel de agentes hospitalares: **~124 × 23 px**, fundo `#EFF7FA`, texto ~12 px, ícone
  de checkbox antes do número.
- App de despesas com IA: estado "Corroborated" com ponto verde + texto verde; "Not corroborated" em cinza, sem
  ponto vermelho. **A falta de prova não é pintada como erro**, é neutra. **[OBSERVADO]**
- Anotador por voz: selos verdes sólidos para prova positiva, contorno cinza para prova fraca.

## Quando usar

Sempre que um número foi **derivado, previsto ou classificado** pela IA. Dado que veio pronto de
um sistema (valor de fatura, data de emissão) não leva chip de confiança. **[OBSERVADO em
8 produtos]**

## Como reproduzir

1. Ao lado de todo dado derivado: `{valor} · {confiança}` ou um selo de verificação.
2. Se houver faixas, **escreva a régua** uma vez na tela ("High ≥1,000 runs…").
3. Quando a IA não sabe, mostre "—" e uma frase: "No signal yet". Nunca preencha com palpite.
4. Diga o que ficou **fora da conta** ("not counted above").
5. Explique scores com a lista de sinais e pesos, e diga quantos sinais ficaram de fora e por
   quê.
6. Todo painel que não é ao vivo diz a idade do número e a cadência de atualização.
7. Compare com o padrão da própria entidade ("2.2x their normal pattern") antes de comparar com
   a média geral.

```html
<span class="conf" title="6 of 6 agents seen in ≥100 runs">
  <svg class="i-check-square"/> 92% confidence
</span>
<!-- .conf{display:inline-flex;gap:6px;align-items:center;height:23px;padding:0 10px;
          border-radius:999px;background:#EFF7FA;color:#475467;font-size:12px} -->
```

## Mais exemplos

Telas de outras séries que repetem ou estendem o padrão (fichas em [../06-produtos/](../06-produtos/README.md)).

- **App de autorização prévia, chance de aprovação** — "Approval odds 78%" com régua de barrinhas, "AI estimate", o checklist de critérios e a ressalva *"An estimate from the case information available. Not a guarantee."*; na versão em moldura lilás, a base: 214 casos semelhantes, 87% aprovados, confiança Medium.
  ![app de autorização prévia, chance de aprovação](../galeria/03-padroes-de-ia/cartao-chance-de-aprovacao.png)
- **App de autorização prévia, revisão da IA** — a estimativa com a base de casos semelhantes e o nível de confiança escrito.
  ![app de autorização prévia, revisão da IA](../galeria/03-padroes-de-ia/cartao-revisao-de-autorizacao-ia.png)
- **App de contas a receber, fatura paga** — o cartão "How the prediction did": janela prevista, data real, diferença ("6 days early") e o que o modelo passou a pesar mais. A previsão presta contas depois do fato.
  ![app de contas a receber, fatura paga](../galeria/04-tipos-de-tela/detalhe-fatura-vencida.jpg)
- **Assistente de reembolso, nó de classificação** — a confiança como regra: "if confidence is below 70% → Route to Human handoff", e o teste do nó com "intent Refund, confidence 96%".
  ![assistente de reembolso, nó de classificação](../galeria/03-padroes-de-ia/painel-no-classificar-intencao-assistente-reembolso.jpg)

## Mais exemplos

Telas que repetem ou estendem o padrão (fichas em [../06-produtos/](../06-produtos/README.md)); uma linha por imagem.

- **App de cozinha com IA** — app de cozinha com IA: previsão de 312 clientes para amanhã, um ponto por cliente ao longo do dia, "What is driving it" e mudanças de demanda por prato.
  ![app de cozinha com IA](../galeria/03-padroes-de-ia/previsao-de-clientes-com-motivos.jpg)
- **App de contas a receber** — app de contas a receber no iPhone: fatura de $42,800 com "[produto] prediction · Likely paid 28 Sep to 2 Oct", 84% sure e a promessa detectada.
  ![app de contas a receber](../galeria/03-padroes-de-ia/previsao-de-pagamento-iphone.jpg)
- **Painel de contratos e SLA** — painel de contratos e SLA no iPhone: "Service credit $12,500" com o porquê (contrato diz 99.9%, aconteceu 99.2%) e a leitura da IA com confiança.
  ![painel de contratos e SLA](../galeria/03-padroes-de-ia/credito-de-servico-com-motivo-iphone.jpg)
- **App de escopo de projeto** — app de escopo de projeto: proposta "Guilder · SaaS UX redesign" com esforço estimado por etapa, capacidade da equipe e preço recomendado com "How the price was built".
  ![app de escopo de projeto](../galeria/03-padroes-de-ia/esforco-e-preco-recomendado.jpg)
- **App de consultoria com IA** — app de consultoria com IA: "Growth framework assessment" com os números do cliente, a restrição principal "Activation", evidência e foco recomendado.
  ![app de consultoria com IA](../galeria/03-padroes-de-ia/avaliacao-com-restricao-principal.jpg)
- **App de caixa** — app de caixa no iPhone: "Profit & loss" com lucro de agosto e o cartão "Why it changed" antes das linhas.
  ![app de caixa](../galeria/03-padroes-de-ia/lucro-com-por-que-mudou-iphone.jpg)
- **App de cozinha com IA** — app de cozinha com IA no iPhone: "[produto] recommends 37 kg" de frango, "Why 37 kg" em primeira pessoa, no que se baseou e "Approve 37 kg".
  ![app de cozinha com IA](../galeria/03-padroes-de-ia/recomendacao-com-porque-iphone.jpg)
- **App de fatura eletrônica** — app de fatura eletrônica: exceção "VAT number mismatch" com a evidência lado a lado, "Why this failed", três caminhos de resolução e o toast de aceite.
  ![app de fatura eletrônica](../galeria/03-padroes-de-ia/divergencia-com-evidencia-e-caminhos.jpg)
- **App de fatura eletrônica** — app de fatura eletrônica: exceções por motivo e o cartão "Pattern [produto] AI learned" com a correção sugerida.
  ![app de fatura eletrônica](../galeria/03-padroes-de-ia/padrao-que-a-ia-aprendeu.jpg)
- **App de cozinha com IA** — app de cozinha com IA web: a previsão de 312 clientes de novo, com "What is driving it" e mudanças de demanda.
  ![app de cozinha com IA](../galeria/03-padroes-de-ia/previsao-de-clientes-com-motivos-2.jpg)
- **Estúdio de anúncios** — estúdio de anúncios escuro no iPhone: anúncio "Corgi cap, big smile" com CTR, ROAS e gasto, e "Why it works" com o peso de cada fator pela IA.
  ![estúdio de anúncios](../galeria/03-padroes-de-ia/por-que-o-anuncio-funciona-iphone-escuro.jpg)
- **Estúdio de anúncios** — estúdio de anúncios escuro no iPhone: "Insight · Open on the dog's face" com 85% de confiança, CTR por primeiro quadro e "Apply to 8 videos".
  ![estúdio de anúncios](../galeria/03-padroes-de-ia/padrao-com-confianca-e-aplicar-iphone-escuro.jpg)
- **App de painéis solares** — app de painéis solares: "Assessment review" com fotos da visita e "Panel reading" lido da foto com 97% de confiança e checagens de risco.
  ![app de painéis solares](../galeria/03-padroes-de-ia/leitura-do-quadro-pela-foto.jpg)
- **App de escopo de projeto** — app de escopo de projeto no iPhone: "Suggested price $23,500" com alta confiança, "Why this price", horas por escopo e "Resolve 1 risk to approve".
  ![app de escopo de projeto](../galeria/03-padroes-de-ia/preco-sugerido-com-risco-iphone.jpg)
- **App de escopo de projeto** — app de escopo de projeto no iPhone: folha "Timeline risk" com o prazo do cliente contra projetos parecidos e a recomendação de estender.
  ![app de escopo de projeto](../galeria/03-padroes-de-ia/risco-de-prazo-com-recomendacao-iphone.jpg)
- **App de manutenção preditiva** — app de manutenção preditiva: diferença +$1,030 (42% acima), linhas marcadas, "[produto] AI review" com "Request quotes" e "Draft reply".
  ![app de manutenção preditiva](../galeria/03-padroes-de-ia/fatura-acima-da-referencia.jpg)
- **App de consultoria com IA** — app de consultoria com IA: a "Growth framework assessment" de novo, com "Activation" como restrição principal.
  ![app de consultoria com IA](../galeria/03-padroes-de-ia/avaliacao-com-restricao-principal-2.jpg)
- **App de cozinha com IA** — app de cozinha com IA: "Forecast vs actual" com acerto 91%, tabela por item, "What [produto] learned" e "Tomorrow's prep intelligence".
  ![app de cozinha com IA](../galeria/03-padroes-de-ia/previsto-x-real-e-o-que-aprendeu.jpg)
- **App de fatura eletrônica** — app de fatura eletrônica: a exceção "VAT number mismatch" de novo.
  ![app de fatura eletrônica](../galeria/03-padroes-de-ia/divergencia-com-evidencia-e-caminhos-2.jpg)
- **App de coaching com compromissos** — app de coaching com compromissos escuro: painel "Extracted · AI" com meta, compromissos e bloqueio, cada um com o minuto e o nível de confiança.
  ![app de coaching com compromissos](../galeria/03-padroes-de-ia/extraido-com-confianca-escuro.jpg)
- **App de coaching com compromissos** — app de coaching com compromissos escuro: cartão "Possible pattern · Pricing confidence keeps coming up" com Explore e "Not a pattern", e o bloqueio lido pela IA.
  ![app de coaching com compromissos](../galeria/03-padroes-de-ia/padrao-possivel-com-confianca-escuro.jpg)
- **App de cozinha com IA** — app de cozinha com IA: "Forecast vs actual" com "What [produto] learned" de novo, em 4:3.
  ![app de cozinha com IA](../galeria/03-padroes-de-ia/previsto-x-real-e-o-que-aprendeu-2.jpg)
- **App de consultoria com IA** — app de consultoria com IA: a "Growth framework assessment" mais uma vez, em 4:3.
  ![app de consultoria com IA](../galeria/03-padroes-de-ia/avaliacao-com-restricao-principal-3.jpg)
- **App de caixa de estúdio (marca lida no botão)** — app de caixa de estúdio no iPhone: "Cash forecast" com "80% chance you stay above your $60K buffer", a faixa de incerteza e o motivo de a faixa estar mais larga.
  ![app de caixa de estúdio (marca lida no botão)](../galeria/03-padroes-de-ia/chance-de-ficar-acima-do-colchao-iphone-escuro.jpg)
