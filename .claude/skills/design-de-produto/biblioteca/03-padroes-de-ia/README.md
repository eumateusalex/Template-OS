# 03 · Padrões de produto de IA

Como desenhar produto de IA no método. Esta seção não trata do visual genérico (cor, raio, sombra:
isso mora nas outras seções). Trata do **raciocínio de UX**: o que a tela faz a IA dizer, o que ela
deixa a IA fazer sozinha, e onde ela põe a pessoa no circuito.

Recortes: `../galeria/03-padroes-de-ia/` (83 arquivos). Os textos das telas estão em inglês porque
as telas são em inglês; as citações entre aspas são transcrição literal (inclusive os travessões
que aparecem dentro delas, que são do original).

---

## A tese, em uma frase

**A IA do método não conversa: ela trabalha dentro do produto, mostra o que fez, diz o quanto tem
certeza, e para no limite que alguém definiu.** A pessoa entra em três momentos só: para confirmar
o que a IA descobriu, para decidir o que passou do limite, e para desfazer.

A regra, em uma linha:

> "The real test is knowing when the agent should act on its own and when it should ask for
> confirmation."

Tudo o que vem abaixo é a forma visual dessa frase. Ela tem até nome: a frase de amostra da folha de
tipografia do AgentPay, repetida em todos os tamanhos, é **"Autonomy with boundaries"**, e o produto
que a acompanha divide cada pagamento em "Approved autonomously · Sent for human approval · Blocked
by policy".

---

## Os cinco princípios que atravessam todas as telas

1. **A IA é um colega com nome, não um chat.** Cada produto batiza a IA com o nome do produto
   (`Permit AI`, `Ask Haulsight`, `Flow Assist`, `Fino's read`, `rillo proposes`, `Ask vero`,
   `Ask Ctrl`, `Ask Coach Dean`) e a põe dentro do fluxo de trabalho: numa coluna da tabela
   ("Ranked by Permit AI"), num card da tela inicial, numa linha de ledger. O chat solto aparece
   uma vez só na amostra, no Automax: 1.378 views e 8 salvos, índice 0,72 contra a semana (a outra
   peça da série no mesmo dia teve 677 views, índice 0,35). Rendeu abaixo do típico, mas não foi o
   pior do lote: Salestrain teve 1.281 views, a Lora 623 (índice 0,26) e o AgentPay 682 (com poucas
   horas de vida). Depois dele, o chat solto some. **[OBSERVADO em 14 produtos]**; views e índice
   **[MEDIDO]** (índice = views divididas pela mediana das peças com mídia de três dias antes a três
   dias depois)
2. **Toda afirmação da IA vem com a régua ao lado.** Confiança ("92% confidence"), estado de
   verificação ("2 unverified", "Not corroborated", "Said once"), frescor ("6 min ago",
   "synced 12s ago") e o critério de ordenação ("Confidence first, then monthly saving",
   "Sorted by procedure date, then approval odds"). **[OBSERVADO em 11 produtos]**
3. **A IA age dentro de um limite escrito, e o limite aparece na tela.** "Within authority ✓",
   "Out of authority · agent escalated", "Authority ceiling by phase", "hold > €250",
   "deny-by-default". O limite não é configuração escondida: é conteúdo. **[OBSERVADO: Ergond,
   AgentTrail, Ctrl.ai, Rillo, Vero]**
4. **Tudo que a IA fez deixa rastro legível por humano.** Trace com waterfall, linha do tempo de
   incidente, audit log append-only, "decision record" com "what it did / what it looked at /
   what rule applied / how confident / how to reverse it", hash encadeado, trecho de áudio de
   onde saiu o fato. **[OBSERVADO: OrchestrateIQ, AgentTrail, Vero, Ergond, Lepo, Fino]**
5. **A tela abre dizendo o que fazer, não o que existe.** Saudação curta, uma frase com número e
   contexto ("7 projects need attention", "$184,500 across 8 cases that may miss their procedure
   date"), um card destacado com a próxima ação, e só depois o dado. **[OBSERVADO em 12 produtos]**

---

## Índice dos padrões

| # | Arquivo | Padrão | Produtos onde aparece |
|---|---|---|---|
| 01 | [01-ia-descobre-humano-confirma.md](01-ia-descobre-humano-confirma.md) | A IA descobre, o humano confirma | OrchestrateIQ, Lepo, Vero, Torin |
| 02 | [02-proximo-passo-priorizado.md](02-proximo-passo-priorizado.md) | Próximo passo priorizado ("Do first", "Needs attention") | OrchestrateIQ, Permitly, PriorAuth, CollectAI, Haulsight, FixTrack, Mortgage Flow, Mongi |
| 03 | [03-confianca-explicita.md](03-confianca-explicita.md) | Confiança, verificação, cobertura e frescor explícitos | OrchestrateIQ, Rillo, Vero, AgentTrail, Lepo, Torin, PriorAuth, ResolveAI |
| 04 | [04-rastreabilidade.md](04-rastreabilidade.md) | Rastreabilidade: trace, linha do tempo, audit log, hash, evidência | OrchestrateIQ, AgentTrail, Vero, Ergond, Lepo, Fino |
| 05 | [05-governanca-politica-simulacao.md](05-governanca-politica-simulacao.md) | Política Trigger → Conditions → Action, modo monitor e simulação "would have held" | AgentTrail, Ctrl.ai, AgentPay, Ergond, ComplianceFlow |
| 06 | [06-autoridade-escalonamento-handoff.md](06-autoridade-escalonamento-handoff.md) | A IA age dentro de um limite ("Autonomy with boundaries"); escalonamento e handoff para humano | Ergond, AgentPay, AgentTrail, Ctrl.ai, Rillo, ResolveAI |
| 07 | [07-fila-de-revisao-e-recibo.md](07-fila-de-revisao-e-recibo.md) | Fila de revisão ("Needs you") e o recibo do que a IA fez sozinha | Rillo, Fino, Ctrl.ai, ComplianceFlow, Ergond, Edu.ai |
| 08 | [08-assistente-contextual.md](08-assistente-contextual.md) | Assistente com perguntas sugeridas sobre o que está na tela | OrchestrateIQ, Mortgage Flow, Haulsight, Ctrl.ai, Vero, Rillo |
| 09 | [09-mapa-vivo-de-agentes.md](09-mapa-vivo-de-agentes.md) | Mapa vivo de agentes e inspetor de handoff | OrchestrateIQ, Ctrl.ai |
| 10 | [10-custo-por-agente.md](10-custo-por-agente.md) | Custo por agente, tokens e desperdício | OrchestrateIQ, Ctrl.ai, Rillo |
| 11 | [11-ia-embutida-no-vertical.md](11-ia-embutida-no-vertical.md) | IA embutida no produto vertical, com nome e cor próprios | Permitly, Haulsight, medspa, Fino, Edu.ai, PriorAuth, CollectAI, Lepo, Torin |
| 12 | [12-acao-reversivel-e-rascunho.md](12-acao-reversivel-e-rascunho.md) | A IA rascunha, o humano envia; tudo reversível; sandbox antes de publicar | Fino, Rillo, Vero, Ergond, contractor app |
| ✓ | [checklist-produto-de-ia.md](checklist-produto-de-ia.md) | Checklist prático para desenhar uma tela de produto de IA no método | todos |

O 12 (rascunho, desfazer e sandbox) aparece em cinco produtos e é o que fecha o circuito do
princípio 3. Dois padrões têm forma mais larga que o nome:

- **"Fila de revisão"** vem sempre acompanhada do seu avesso, o **recibo** do que a IA resolveu
  sozinha ("rillo cleared 148 on its own today", "Handled by Fino this week: 184 transactions
  categorized"). Por isso os dois estão no mesmo arquivo.
- **"Confiança explícita"** é mais largo que um percentual: inclui o que a IA **não** viu
  ("What OrchestrateIQ has actually seen · and what it has not"), o que ela **se recusa a
  preencher** ("vero does not fill in a blank with a guess") e a **idade** do número
  ("Not every panel is live"). Está tudo no 03.

---

## O inventário dos produtos de IA (o que foi examinado)

| Produto | O que é | Peças | Views da melhor peça |
|---|---|---|---|
| **OrchestrateIQ** | observabilidade e gestão de agentes (claro, azul) | 11 | 90.913 |
| **AgentTrail** | governança e auditoria de agentes (escuro, violeta) | 7 | 13.275 |
| **Ergond** | operação de agentes com autoridade e handoff (claro, azul petróleo e laranja) | 1 | 46.261 |
| **Ctrl.ai** | controle e governança de agentes (escuro, verde) | 2 | 2.176 |
| **AgentPay** | "control layer between AI agents and the payment network" (escuro, azul) | 1 + design system | 682 (ainda subindo na leitura) |
| **Vero** | inteligência de receita com IA (escuro e claro, verde) | 22 | 5.553 |
| **Rillo** | despesas e recibos com IA (claro, preto) | 17 | 5.907 |
| **Permitly** ("Permit AI") | licenças de energia solar (claro, verde-limão) | | 81.873 |
| **Haulsight** ("Ask Haulsight") | gestão de frota (claro, verde e amarelo) | | 13.342 |
| **medspa** ("Flow Assist") | clínica de estética, painel e app do cliente | 2 | 19.015 |
| **PriorAuth** | autorização prévia em clínicas | 1 | 4.467 |
| **CollectAI** | cobrança (fintech sóbria) | | 7.377 |
| **Fino** ("Fino's read") | caixa com IA para pequeno negócio de serviço | | 1.716 |
| **Edu.ai** | co-professor com IA | | 3.371 |
| **Lepo** | anotador de voz com IA para técnicos de campo | 2 | 5.311 |
| **Torin** | assinaturas e dinheiro (app) | 2 | 5.635 |
| **ResolveAI** | resolução de suporte com IA | | 9.648 |
| **ComplianceFlow** | registro de uso de IA em escritório de advocacia | | 1.400 |
| **Mortgage Flow** | jornada de financiamento imobiliário | 2 | 4.896 |
| **Marketing** (sem nome visível) | "AI found a pattern" em criativos | (vídeo) | 2.165 |
| **Automax** | automação de workflow (contraste: chat solto) | 1 | 1.378 |
| **Salestrain** | coaching de vendas com IA ("Ask Coach Dean") | série | 1.281 |

⚠️ **A legenda da peça não descreve a tela.** A peça mais vista da amostra
("Ai Agent for hospital governance", 90.913 views) é o vídeo do OrchestrateIQ, e o arquivo MP4 tem o
mesmo tamanho em bytes (2.059.577) e o mesmo pôster que o vídeo de outra peça ("What should an
agentic platform interface UI look like?"). A peça "AI agents that help to run the hospital
efficiently" também é a tela "We found your system" do OrchestrateIQ, e "Report/analytic page for an
AI-powered hospital management platform" é o painel do medspa (clínica de estética, não hospital).
**A mesma tela volta com legendas de nichos diferentes.** Para esta biblioteca, o que vale é a tela;
a legenda é isca de alcance. **[MEDIDO: bytes e md5 do pôster iguais]**

---

## O raciocínio por trás das telas

Cinco ideias de produto explicam cada escolha de tela de IA.

| Ideia | O que diz | Onde aparece no desenho de IA |
|---|---|---|
| **Onboarding é competência** | "Knowledge isn't the goal. Competence is." "Users experience success before they experience confusion." | O OrchestrateIQ não abre com tour: abre com **"We found your system"**, já com o sistema do usuário mapeado ("Setup complete · 3 of 3"). A primeira sessão entrega um resultado, não uma explicação. A primeira tarefa é pequena e tem duração ("Name your workflows · ~2 min"). Ver padrões 01 e 02. |
| **A homepage tem uma promessa** | "Every element supports the same promise." "Is this relevant to me?" em poucos segundos. | O topo de cada painel é uma promessa só: título curto + uma frase com número ("You've saved 3h 42m this week. Two lessons are ready for today."). O CTA do card é o passo óbvio seguinte ("Review risks", "Review suggestions"). Ver o README da seção 07. |
| **O churn mora na sessão final** | "Their behavior was telling you something much earlier." | A IA lê comportamento, não declaração: "Why this account is quiet" no Vero ("This is a communication gap, not a churn signal yet"), "Brightline usually pays 9 days late, so 22 is unusual" no Fino, "Delay is 2.2x their normal pattern" no CollectAI, "Sam captured 2 of 14 jobs" no Lepo. O padrão é **comparar com o normal daquela entidade**. Ver padrão 03. |
| **Fluxo com IA: 4 semanas viram 2** | "After AI generated the final direction, we spent only 3–4 hours refining, validating, and polishing." | É a mesma divisão de trabalho que o produto desenha: a IA gera a direção, o humano valida e refina. "AI gives us ideas and shitty design. And we need to make it production-ready" e "AI can match visuals, but not the thinking behind great UX". A série "Turn your UI AI slop into production-ready design" (62.896 views) é a vitrine disso. |
| **Empatia com o usuário real** | "8 out of 10 couldn't finish basic tasks." "Navigation reduced to 3 sections." | Os apps de cliente final (medspa, Mongi, contractor) têm poucas seções, rótulos em linguagem comum e um próximo passo por vez ("Tips unlock after your visit"). |

---

## Genérico × método

- **No genérico** a IA é um botão ("Try AI", "Ask Coach Dean") que abre um chat genérico ("Hi,
  There 👋 Choose a prompt below"), e os dados são repetidos (a mesma linha "Carrie and David talk ·
  58m · 82%" sete vezes no Salestrain). **[OBSERVADO]**
- **No método** a IA vira ator com nome dentro da tabela e do audit log, e cada linha tem dado
  próprio (Rillo e Vero). **[OBSERVADO em 40 peças de Rillo e Vero]**
- **No caso mais forte** (OrchestrateIQ, AgentTrail, Ergond, Ctrl.ai) o tema é governar agentes:
  autoridade, política, custo, evidência. É o que mais performa: as quatro peças de agente acima de
  30 mil views são deste tipo. **[MEDIDO]**

---

## Escala usada nas medidas desta seção

As telas de desktop chegam em 4096 px de largura com moldura cinza em volta. No OrchestrateIQ, o
contêiner do app vai de x=266 a x=3829 (3.563 px). Assumindo um frame de 1440 px de largura (o
padrão de vitrine), o fator é **~2,47**. **[INFERIDO: 1440 é a largura mais provável; o vídeo do
mesmo app tem 1440 px e o contêiner ocupa 1392 px nele]** Medidas com esse fator estão marcadas com
a tela de origem.
