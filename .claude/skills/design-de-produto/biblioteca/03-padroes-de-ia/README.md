# 03 · Padrões de produto de IA

Como desenhar produto de IA no método. Esta seção não trata do visual genérico (cor, raio, sombra:
isso mora nas outras seções). Trata do **raciocínio de UX**: o que a tela faz a IA dizer, o que ela
deixa a IA fazer sozinha, e onde ela põe a pessoa no circuito.

Recortes: `../galeria/03-padroes-de-ia/` (206 arquivos). Os textos das telas estão em inglês porque
as telas são em inglês; as citações entre aspas são transcrição literal (inclusive os travessões
que aparecem dentro delas, que são do original).

---

## A tese, em uma frase

**A IA do método não conversa: ela trabalha dentro do produto, mostra o que fez, diz o quanto tem
certeza, e para no limite que alguém definiu.** A pessoa entra em três momentos só: para confirmar
o que a IA descobriu, para decidir o que passou do limite, e para desfazer.

A regra, em uma linha:

> O teste de verdade é saber quando o agente age sozinho e quando pede confirmação.

Tudo o que vem abaixo é a forma visual dessa frase. Ela tem até nome: a frase de amostra da folha de
tipografia do painel de pagamentos de agentes, repetida em todos os tamanhos, é **"Autonomy with boundaries"**, e o produto
que a acompanha divide cada pagamento em "Approved autonomously · Sent for human approval · Blocked
by policy".

---

## Os cinco princípios que atravessam todas as telas

1. **A IA é um colega com nome, não um chat.** Cada produto batiza a IA com o nome do produto
   (`[produto]`, `Ask [produto]`, `[produto]`, `[produto]'s read`, `[produto] proposes`, `Ask [produto]`,
   `Ask Ctrl`, `Ask Coach Dean`) e a põe dentro do fluxo de trabalho: numa coluna da tabela
   ("Ranked by [produto]"), num card da tela inicial, numa linha de ledger. O chat solto aparece
   uma vez só na amostra, no site de automação, e funciona menos que a IA posta dentro do fluxo. Depois
   dele, o chat solto some. **[OBSERVADO em 14 produtos]**
2. **Toda afirmação da IA vem com a régua ao lado.** Confiança ("92% confidence"), estado de
   verificação ("2 unverified", "Not corroborated", "Said once"), frescor ("6 min ago",
   "synced 12s ago") e o critério de ordenação ("Confidence first, then monthly saving",
   "Sorted by procedure date, then approval odds"). **[OBSERVADO em 11 produtos]**
3. **A IA age dentro de um limite escrito, e o limite aparece na tela.** "Within authority ✓",
   "Out of authority · agent escalated", "Authority ceiling by phase", "hold > €250",
   "deny-by-default". O limite não é configuração escondida: é conteúdo. **[OBSERVADO: painel de agentes de operação,
   painel de auditoria de agentes, painel de permissões de agentes, app de despesas com IA, CRM de receita]**
4. **Tudo que a IA fez deixa rastro legível por humano.** Trace com waterfall, linha do tempo de
   incidente, audit log append-only, "decision record" com "what it did / what it looked at /
   what rule applied / how confident / how to reverse it", hash encadeado, trecho de áudio de
   onde saiu o fato. **[OBSERVADO: painel de agentes hospitalares, painel de auditoria de agentes, CRM de receita, painel de agentes de operação, anotador por voz, app de caixa]**
5. **A tela abre dizendo o que fazer, não o que existe.** Saudação curta, uma frase com número e
   contexto ("7 projects need attention", "$184,500 across 8 cases that may miss their procedure
   date"), um card destacado com a próxima ação, e só depois o dado. **[OBSERVADO em 12 produtos]**

---

## Índice dos padrões

| # | Arquivo | Padrão | Produtos onde aparece |
|---|---|---|---|
| 01 | [01-ia-descobre-humano-confirma.md](01-ia-descobre-humano-confirma.md) | A IA descobre, o humano confirma | Painel de agentes hospitalares, anotador por voz, CRM de receita, app de assinaturas |
| 02 | [02-proximo-passo-priorizado.md](02-proximo-passo-priorizado.md) | Próximo passo priorizado ("Do first", "Needs attention") | Painel de agentes hospitalares, painel de licenciamento solar, app de autorização prévia, app de contas a receber, app de frota, app de manutenção predial, app de financiamento imobiliário, app de entregas |
| 03 | [03-confianca-explicita.md](03-confianca-explicita.md) | Confiança, verificação, cobertura e frescor explícitos | Painel de agentes hospitalares, app de despesas com IA, CRM de receita, painel de auditoria de agentes, anotador por voz, app de assinaturas, app de autorização prévia, suporte com IA |
| 04 | [04-rastreabilidade.md](04-rastreabilidade.md) | Rastreabilidade: trace, linha do tempo, audit log, hash, evidência | Painel de agentes hospitalares, painel de auditoria de agentes, CRM de receita, painel de agentes de operação, anotador por voz, app de caixa |
| 05 | [05-governanca-politica-simulacao.md](05-governanca-politica-simulacao.md) | Política Trigger → Conditions → Action, modo monitor e simulação "would have held" | Painel de auditoria de agentes, painel de permissões de agentes, painel de pagamentos de agentes, painel de agentes de operação, painel de compliance de IA |
| 06 | [06-autoridade-escalonamento-handoff.md](06-autoridade-escalonamento-handoff.md) | A IA age dentro de um limite ("Autonomy with boundaries"); escalonamento e handoff para humano | Painel de agentes de operação, painel de pagamentos de agentes, painel de auditoria de agentes, painel de permissões de agentes, app de despesas com IA, suporte com IA |
| 07 | [07-fila-de-revisao-e-recibo.md](07-fila-de-revisao-e-recibo.md) | Fila de revisão ("Needs you") e o recibo do que a IA fez sozinha | App de despesas com IA, app de caixa, painel de permissões de agentes, painel de compliance de IA, painel de agentes de operação, co-professor de IA |
| 08 | [08-assistente-contextual.md](08-assistente-contextual.md) | Assistente com perguntas sugeridas sobre o que está na tela | Painel de agentes hospitalares, app de financiamento imobiliário, app de frota, painel de permissões de agentes, CRM de receita, app de despesas com IA |
| 09 | [09-mapa-vivo-de-agentes.md](09-mapa-vivo-de-agentes.md) | Mapa vivo de agentes e inspetor de handoff | Painel de agentes hospitalares, painel de permissões de agentes |
| 10 | [10-custo-por-agente.md](10-custo-por-agente.md) | Custo por agente, tokens e desperdício | Painel de agentes hospitalares, painel de permissões de agentes, app de despesas com IA |
| 11 | [11-ia-embutida-no-vertical.md](11-ia-embutida-no-vertical.md) | IA embutida no produto vertical, com nome e cor próprios | Painel de licenciamento solar, app de frota, app da clínica de estética, app de caixa, co-professor de IA, app de autorização prévia, app de contas a receber, anotador por voz, app de assinaturas |
| 12 | [12-acao-reversivel-e-rascunho.md](12-acao-reversivel-e-rascunho.md) | A IA rascunha, o humano envia; tudo reversível; sandbox antes de publicar | App de caixa, app de despesas com IA, CRM de receita, painel de agentes de operação, contractor app |
| ✓ | [checklist-produto-de-ia.md](checklist-produto-de-ia.md) | Checklist prático para desenhar uma tela de produto de IA no método | todos |

O 12 (rascunho, desfazer e sandbox) aparece em cinco produtos e é o que fecha o circuito do
princípio 3. Dois padrões têm forma mais larga que o nome:

- **"Fila de revisão"** vem sempre acompanhada do seu avesso, o **recibo** do que a IA resolveu
  sozinha ("[produto] cleared 148 on its own today", "Handled by app de caixa this week: 184 transactions
  categorized"). Por isso os dois estão no mesmo arquivo.
- **"Confiança explícita"** é mais largo que um percentual: inclui o que a IA **não** viu
  ("What [produto] has actually seen · and what it has not"), o que ela **se recusa a
  preencher** ("[produto] does not fill in a blank with a guess") e a **idade** do número
  ("Not every panel is live"). Está tudo no 03.

---

## O inventário dos produtos de IA (o que foi examinado)

| Produto | O que é | Peças |
|---|---|---|
| **Painel de agentes hospitalares** | observabilidade e gestão de agentes (claro, azul) | 11 |
| **Painel de auditoria de agentes** | governança e auditoria de agentes (escuro, violeta) | 7 |
| **Painel de agentes de operação** | operação de agentes com autoridade e handoff (claro, azul petróleo e laranja) | 1 |
| **Painel de permissões de agentes** | controle e governança de agentes (escuro, verde) | 2 |
| **Painel de pagamentos de agentes** | camada de controle entre os agentes de IA e a rede de pagamento (escuro, azul) | 1 + design system |
| **CRM de receita** | inteligência de receita com IA (escuro e claro, verde) | 22 |
| **App de despesas com IA** | despesas e recibos com IA (claro, preto) | 17 |
| **Painel de licenciamento solar** (assistente de IA do licenciamento) | licenças de energia solar (claro, verde-limão) | |
| **App de frota** ("Ask [produto]") | gestão de frota (claro, verde e amarelo) | |
| **App da clínica de estética** (assistente de IA da clínica) | clínica de estética, painel e app do cliente | 2 |
| **App de autorização prévia** | autorização prévia em clínicas | 1 |
| **App de contas a receber** | cobrança (fintech sóbria) | |
| **App de caixa** ("[produto]'s read") | caixa com IA para pequeno negócio de serviço | |
| **Co-professor de IA** | co-professor com IA | |
| **Anotador por voz** | anotador de voz com IA para técnicos de campo | 2 |
| **App de assinaturas** | assinaturas e dinheiro (app) | 2 |
| **Suporte com IA** | resolução de suporte com IA | |
| **Painel de compliance de IA** | registro de uso de IA em escritório de advocacia | |
| **App de financiamento imobiliário** | jornada de financiamento imobiliário | 2 |
| **Marketing** (sem nome visível) | "AI found a pattern" em criativos | (vídeo) |
| **Site de automação** | automação de workflow (contraste: chat solto) | 1 |
| **App de coaching de vendas** | coaching de vendas com IA ("Ask Coach Dean") | série |

⚠️ **A legenda da peça não descreve a tela.** A mesma tela volta com legendas de nichos
diferentes (o painel de uma clínica de estética apresentado como relatório de hospital, o mesmo vídeo
com duas legendas de produto). Para esta biblioteca, o que vale é a tela; a legenda é isca de alcance.

---

## O raciocínio por trás das telas

Cinco ideias de produto explicam cada escolha de tela de IA.

| Ideia | O que diz | Onde aparece no desenho de IA |
|---|---|---|
| **Onboarding é competência** | O objetivo não é conhecimento, é competência; o usuário tem sucesso antes de ter confusão. | O painel de agentes hospitalares não abre com tour: abre com **"We found your system"**, já com o sistema do usuário mapeado ("Setup complete · 3 of 3"). A primeira sessão entrega um resultado, não uma explicação. A primeira tarefa é pequena e tem duração ("Name your workflows · ~2 min"). Ver padrões 01 e 02. |
| **A homepage tem uma promessa** | Todo elemento sustenta a mesma promessa, e o visitante responde em poucos segundos se aquilo é para ele. | O topo de cada painel é uma promessa só: título curto + uma frase com número ("You've saved 3h 42m this week. Two lessons are ready for today."). O CTA do card é o passo óbvio seguinte ("Review risks", "Review suggestions"). Ver o README da seção 07. |
| **O churn mora na sessão final** | O comportamento já avisava muito antes. | A IA lê comportamento, não declaração: "Why this account is quiet" no CRM de receita ("This is a communication gap, not a churn signal yet"), "Brightline usually pays 9 days late, so 22 is unusual" no app de caixa, "Delay is 2.2x their normal pattern" no app de contas a receber, "Sam captured 2 of 14 jobs" no anotador por voz. O padrão é **comparar com o normal daquela entidade**. Ver padrão 03. |
| **Fluxo com IA: 4 semanas viram 2** | Depois que a IA gerou a direção final, bastaram 3 a 4 horas para refinar, validar e dar acabamento. | É a mesma divisão de trabalho que o produto desenha: a IA gera a direção, o humano valida e refina. A IA dá ideia e design ruim, e cabe ao designer deixá-lo pronto para produção; ela imita o visual, não o raciocínio de UX. A série do design ruim gerado por IA que vira design pronto para produção é a vitrine disso. |
| **Empatia com o usuário real** | 8 em cada 10 não terminavam tarefa básica; a navegação caiu para 3 seções. | Os apps de cliente final (app da clínica de estética, app de entregas, contractor) têm poucas seções, rótulos em linguagem comum e um próximo passo por vez ("Tips unlock after your visit"). |

---

## Genérico × método

- **No genérico** a IA é um botão ("Try AI", "Ask Coach Dean") que abre um chat genérico ("Hi,
  There 👋 Choose a prompt below"), e os dados são repetidos (a mesma linha "Carrie and David talk ·
  58m · 82%" sete vezes no app de coaching de vendas). **[OBSERVADO]**
- **No método** a IA vira ator com nome dentro da tabela e do audit log, e cada linha tem dado
  próprio (app de despesas com IA e CRM de receita). **[OBSERVADO em 40 peças de app de despesas com IA e CRM de receita]**
- **No caso mais forte** (painel de agentes hospitalares, painel de auditoria de agentes, painel de agentes de operação, painel de permissões de agentes) o tema é governar agentes:
  autoridade, política, custo, evidência. É o caso que mais se repete nas peças de
  referência. **[OBSERVADO]**

---

## Escala usada nas medidas desta seção

As telas de desktop chegam em 4096 px de largura com moldura cinza em volta. No painel de agentes hospitalares, o
contêiner do app vai de x=266 a x=3829 (3.563 px). Assumindo um frame de 1440 px de largura (o
padrão de vitrine), o fator é **~2,47**. **[INFERIDO: 1440 é a largura mais provável; o vídeo do
mesmo app tem 1440 px e o contêiner ocupa 1392 px nele]** Medidas com esse fator estão marcadas com
a tela de origem.
