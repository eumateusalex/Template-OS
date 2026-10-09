# Checklist: desenhar uma tela de produto de IA no método

Use na ordem. Cada item tem o padrão de origem entre parênteses. Se um item não se aplica,
escreva por quê; não pule em silêncio.

---

## Antes de desenhar: as quatro perguntas

- [ ] **O que a IA faz sozinha, o que ela propõe e o que ela nunca faz?** Escreva as três listas.
      É a "Autonomy with boundaries" do AgentPay e o "Mandate & scope" do Ergond. (05, 06)
- [ ] **Qual é o limite, em número e unidade?** (R$ 5.000, 15 minutos, 1.000 registros.) (06)
- [ ] **Quem decide quando passa do limite, pelo nome e pela área?** (06)
- [ ] **Qual a frase que um dono do ramo entende sem saber que existe IA?** Ex.: "7 projects at
      risk of slipping", não "AI detected anomalies". (11)

## Topo da tela

- [ ] Saudação curta com o primeiro nome ("Good morning, Sarah"). (07-microcopy)
- [ ] **Uma frase** com número + contexto + consequência logo abaixo ("$184,500 across 8 cases
      that may miss their procedure date"). Uma promessa por tela. (02)
- [ ] Frescor do dado no cabeçalho ("updated 6 minutes ago", "synced 12s ago"). (03)
- [ ] Estado global da IA visível e desligável quando fizer sentido ("Permit AI · On ·
      128 projects", "18 agents active", "AI monitoring live"). (11)

## O que fazer agora

- [ ] Card de próximo passo com **um** item destacado ("Do first") e no máximo três itens. (02)
- [ ] Cada item: verbo + objeto no título, **motivo** no subtítulo, escopo e tempo em pílulas
      ("2 workflows · ~2 min"). (02)
- [ ] O critério de ordenação escrito ("Sorted by procedure date, then approval odds",
      "Ranked by Permit AI"). (02, 03)
- [ ] O que não depende do usuário dito como fora ("Everything else is with Michael"). (02)

## Toda saída da IA

- [ ] Nome da IA + ícone de brilho ✦ + cor reservada, sempre os mesmos. (11)
- [ ] Confiança ou estado de verificação ao lado de todo dado derivado ("92% confidence",
      "2 unverified", "Not corroborated", "Said once"). (03)
- [ ] Se há faixas de confiança, a régua escrita na tela. (03)
- [ ] O que a IA não sabe fica em branco com "No signal yet". **Nunca palpite.** (03)
- [ ] Comparação com o normal daquela entidade ("2.2x their normal pattern"). (03)
- [ ] Explicação do score com sinais e pesos, e quantos sinais ficaram de fora. (03)
- [ ] Painel que não é ao vivo diz a cadência ("Cost attribution · 15 minutes"). (03)

## Quando a IA age

- [ ] Rótulo de autoridade em cada ação ("within authority ✓"). (06)
- [ ] Ação externa sai como rascunho: "Drafted by {IA}" + "Edit" + "Review & send", assinada
      pela pessoa. (12)
- [ ] Se a IA escolheu tom ou variante, as opções visíveis e uma linha com o porquê. (12)
- [ ] Ação automática executada tem "Undo" no próprio card ou toast. (12)
- [ ] Linhas de ação do agente no histórico, separadas dos balões de conversa ("⚡ Agent action ·
      OCR insurance-2026.pdf · 4 fields extracted"). (04)

## Quando a IA para

- [ ] Faixa de escalonamento com quem entrou e a hora ("Out of authority · agent escalated.
      Marina (Purchasing) joined the thread. 14:07"). (06)
- [ ] Retenção com prazo e padrão de silêncio = negar ("Expires as a denial in 12:40 if nobody
      acts. Approvers: Maya Kapoor, Sarah Chen."). (06)
- [ ] Campo de resposta muda de dono ("Write as Marina · the agent is paused") e existe "Hand
      back to agent". (06)
- [ ] Fila com recibo na mesma frase ("12 decisions need you. rillo cleared 148 on its own
      today…"). (07)
- [ ] Cada item da fila com o **motivo específico** em selo e o medidor de evidência. (07)
- [ ] Proposta da IA numerada, com "Nothing has been actioned" e "Every step is editable before
      it runs". (07, 12)
- [ ] Ação em massa diz o que vai acontecer de fato ("Approve 2 of 3") e explica a exceção. (07)

## Rastro

- [ ] Todo evento com id em mono, hora com segundos, ator (IA ou pessoa, mesma coluna), ação em
      frase, objeto, resultado com cor (Applied, Held, Stopped, Reverted). (04)
- [ ] Registro de decisão com: What it did / What it looked at / What rule applied / How
      confident / How to reverse it. (04)
- [ ] Erro técnico em dupla: nome da exceção + frase humana. (04)
- [ ] Fonte do fato acessível no original (trecho de áudio, documento, evento). (01, 04)
- [ ] Texto de máquina (id, hash, hora, dinheiro, versão) em monoespaçada; texto humano em
      sans. (04; tokens em `../01-sistema-visual/design-system-publicado.md`: Geist Mono)

## Governança (produto de agentes)

- [ ] Política como objeto: nome humano + id de máquina + versão + dono + escopo. (05)
- [ ] Leitura em três blocos coloridos: Trigger → Conditions → Action, com "ALL MUST MATCH". (05)
- [ ] Modo monitor antes de valer, com a interface no condicional ("Would hold",
      "would_have_held 41 · 0.19%"). (05)
- [ ] Barra de decisões em três segmentos: autônomo / humano / bloqueado, com contagem e %. (06)
- [ ] Botão de emergência sempre visível, vermelho contido. (06)
- [ ] Custo por agente com causa do aumento e ação ("driven by retries", "Investigate"). (10)
- [ ] Mapa de agentes com estado pela borda (tracejada = problema) e anomalia escrita na
      aresta. (09)
- [ ] Mudança de instrução testada em sandbox ("no side-effects") e suíte de regressão antes do
      "Publish". (12)

## Dado de exemplo (vale para o mockup também)

- [ ] Nomes de pessoas, empresas, endereços e ids realistas e **todos diferentes** entre linhas
      (nada de "Carrie and David talk" sete vezes). (07-microcopy)
- [ ] Números com casa decimal plausível e soma que fecha (696 + 134 + 62 = 892). **[MEDIDO:
      a soma do AgentPay fecha]**
- [ ] Nenhum lorem ipsum, nenhum "Lorem Agent", nenhum "$0,000".

## Teste final (três perguntas)

1. A pessoa sabe **o que fazer agora** nos primeiros 5 segundos? ("Is this relevant to me?")
2. A pessoa sai da primeira sessão **mais capaz**, não só mais informada? ("Competence is")
3. Está claro **quando o agente agiu sozinho e quando pediu confirmação**?
