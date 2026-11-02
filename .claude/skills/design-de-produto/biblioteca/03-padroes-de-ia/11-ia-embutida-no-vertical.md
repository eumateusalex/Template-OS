# 11 · IA embutida no produto vertical, com nome e cor próprios

## O que é

No produto de nicho (licença solar, frota, clínica, cobrança, escola, caixa de pequeno negócio),
a IA não é uma seção: é uma **camada que aparece nos pontos de decisão do fluxo que já existe**,
sempre com o mesmo nome, o mesmo ícone de brilho e uma cor de destaque que só ela usa.

## Problema que resolve

Dono de empresa tradicional não quer "usar IA": quer a licença aprovada, a entrega no horário,
o cliente de volta. A IA do método entra **no vocabulário do ramo** e na tela que a pessoa já usa.

## Anatomia (painel de licenciamento solar)

![assistente de IA do licenciamento dentro do painel](../galeria/03-padroes-de-ia/assistente-de-ia-ranqueando.jpg)

A IA aparece em **quatro lugares** da mesma tela, sempre com o nome assistente de IA do licenciamento e o verde-limão
`#C6F048` (cor saturada dominante da imagem, 27.768 amostras; token da folha `lime/500
#C9F24C`, ver `../01-sistema-visual/design-system-publicado.md`):

1. **No pé da sidebar:** card limão "✦ [produto] · On · 128 projects" com um toggle (a IA pode
   ser desligada) e a linha "7 need attention ›".
2. **No topo da página:** chip limão ao lado da saudação "⚠ 7 projects need attention".
3. **Na tabela:** chip "✦ Ranked by [produto]" no cabeçalho, ao lado dos filtros. A IA é o
   critério de ordenação.
4. **Card escuro de insight:** "✦ assistente de IA do licenciamento · 6 min ago · 7 projects at risk of slipping ·
   ● 3 are missing required documents · ● 2 have unusual review delays · ● 2 may miss their
   install dates" + botão limão "Review risks".

No design system do mesmo produto, as frases de amostra da tipografia
já são a voz da IA: "[produto] reads the address and builds the requirement set.", "Austin
Energy requires battery documentation for this project.", "Main disconnect information
missing". **[OBSERVADO]**

## O mesmo desenho em outros verticais

| Produto (id) | Nome da IA | Cor/forma da IA | Onde entra no fluxo |
|---|---|---|---|
| App de frota | "Ask [produto]", "AI Actions 3", "AI forecast", "AI monitoring live" | botão em gradiente azul → verde; ícone de brilho azul | "Re-route saves $2,400" dentro do card do embarque crítico; "21 delivery windows at risk in the next 6 hours"; o motivo em uma frase: "I-35 congestion adds 52 min. Re-routing through Dallas North cuts the delay to 42 min and saves $2,400." |
| App da clínica de estética | Assistente de IA da clínica | card verde-claro no pé da sidebar; no app do cliente, item de aftercare "Day 2 check-in with [produto]" | "6 clients are due to rebook this week. Draft reminders?"; no painel, "✦ Open 6 Tue/Thu laser slots to lift Dr. Ortiz to ~75%" dentro do card de utilização |
| App de caixa | "[produto]'s read", "Drafted by [produto]", "[produto] · Forecast" | borda em gradiente pastel (pêssego → lilás → azul) e chip com o mesmo gradiente | leitura da fatura em atraso, rascunho do lembrete, previsão de caixa |
| Co-professor de IA | "AI suggestion" | card roxo `#3000BA` com chip limão e link "Why this?" | "2 lessons could benefit from differentiation · Year 8 Biology · Photosynthesis · 3 EAL · 2 SEN learners" + "Review suggestions" |
| App de autorização prévia | sem nome, só o evento | ícone de brilho em círculo lilás na lista de atividade | "AI review completed · Knee Arthroscopy · Maria Gonzal…"; e as "Approval odds" por caso |
| App de contas a receber | sem nome, ícone de brilho verde | frase em cinza embaixo de cada devedor | "Delay is 2.2x their normal pattern", "Third missed promise this quarter", "Usually pays 3 days after the due date" |
| Anotador por voz | Anotador por voz como sujeito das frases | selos verdes | "Where [produto] heard it", "How [produto] is doing across your 7 techs" |
| App de assinaturas | "we" | card branco com seção "WHY WE FLAGGED IT" | "These might do the same job · [assistente de IA] / [buscador de IA] · Both are general AI assistants with web search. Plenty of people pay for both on purpose — only you know." + "Keep both" / "Cancel [buscador de IA]" |
| App de financiamento imobiliário | sem nome, ícone de brilho roxo | campo e nota com brilho | "Ask what a mortgage term means…", "Only the September payslip an[d]… are left. Everything else is in." |
| Marketing | "AI found a pattern" | chip roxo translúcido | "Lifestyle photos beat white-background shots · Creatives showing the cap out on a walk generated 32% higher CTR than white-background product shots across your last 18 campaigns." com "18 campaigns analysed" |

![app de frota](../galeria/03-padroes-de-ia/critical-now.jpg)
![assistente de IA da clínica no app da clínica de estética](../galeria/03-padroes-de-ia/assistente-de-ia-na-clinica.jpg)

## Regras que se repetem

1. **Nome próprio para a IA**, derivado do produto (assistente de IA do licenciamento, assistente de IA da clínica, app de caixa), e o
   nome é o sujeito da frase ("[produto] reads…", "[produto] will update this insight…").
2. **Uma cor reservada para a IA** em cada produto (limão no painel de licenciamento solar, gradiente no app de frota e
   no app de caixa, roxo no co-professor de IA). A cor não é usada para outra coisa na tela. **[OBSERVADO em 5
   produtos]**
3. **Ícone de brilho (✦, quatro pontas, às vezes com um brilho menor)** marca toda saída de IA:
   chip, linha de insight, botão, evento de atividade. É o único ícone "mágico" da interface.
4. **A frase da IA é do ramo, não de IA**: "at risk of slipping", "missing required documents",
   "may miss their install dates", "due to rebook". Nenhuma tela diz "AI-powered insight".
5. **A IA quantifica em dinheiro ou tempo do negócio** ("Re-route saves $2,400", "You've saved
   3h 42m this week", "$184,500 across 8 cases that may miss their procedure date").
6. **A IA pode ser desligada** (toggle "[produto] · On").
7. **Respeita a decisão do dono**: app de assinaturas diz "Plenty of people pay for both on purpose — only you
   know" e oferece "Keep both" com o mesmo peso visual de "Cancel".

![app de caixa: read, rascunho e previsão](../galeria/03-padroes-de-ia/reminder-drafted.jpg)

## Quando usar

Em todo produto de nicho. É o padrão das peças que mais salvam: painel de licenciamento solar,
app de entregas/delivery (973), painel de agentes hospitalares (865). **[MEDIDO]**

## Como reproduzir

- Escolha o nome ("{Produto} AI" ou um nome curto) e a cor de IA; use-os em **todos** os pontos.
- Coloque a IA em quatro lugares no máximo: estado global (sidebar), alerta do topo, critério da
  lista, card de insight com CTA.
- Card de insight: `✦ {Nome} · {há quanto tempo}` / título com número e consequência / 3
  bullets com número / 1 botão com verbo ("Review risks").
- Toda frase da IA passa no teste: um dono do ramo entenderia sem saber que existe IA?

## Mais exemplos

Telas de outras séries que repetem ou estendem o padrão (fichas em [../06-produtos/](../06-produtos/README.md)).

- **App de serviço de campo, trabalho extra** — a nota de voz vira texto ("written up from your voice note") e o botão azul "price it with ai" precifica o serviço extra.
  ![app de serviço de campo, trabalho extra](../galeria/03-padroes-de-ia/mobile-trabalho-extra-preco-com-ia.jpg)
- **App de escala domiciliar, nota da visita** — o "Summary from your voice note" separado por campo (condição, pele, acompanhamento) antes da assinatura do paciente.
  ![app de escala domiciliar, nota da visita](../galeria/03-padroes-de-ia/mobile-resumo-da-nota-de-voz.png)
- **App de autorização prévia, evidências** — "Scan a paper document · The AI reads it and links it to the right requirement".
  ![app de autorização prévia, evidências](../galeria/03-padroes-de-ia/mobile-evidencias-clinicas.jpg)
- **App de assinaturas, preço que subiu** — "What [produto] noticed" com a base (bank data, 6 charges) e as saídas ("See cheaper ways to keep it" / "It's fine, keep it").
  ![app de assinaturas, preço que subiu](../galeria/03-padroes-de-ia/mobile-preco-subiu-o-que-notou.jpg)
- **App da clínica de estética, notificação** — o assistente de IA da clínica pergunta pelo dia 2 do pós-procedimento com resposta direta na notificação ("All good" / "Reply").
  ![app da clínica de estética, notificação](../galeria/03-padroes-de-ia/mobile-notificacoes.jpg)

## Mais exemplos

Telas que repetem ou estendem o padrão (fichas em [../06-produtos/](../06-produtos/README.md)); uma linha por imagem.

- **App de coaching com compromissos** — app de coaching com compromissos escuro no iPhone: "Voice summary" gravando 0:38, o que a IA ouviu e "AI is listening for" com chips.
  ![app de coaching com compromissos](../galeria/03-padroes-de-ia/resumo-de-voz-ouvindo-iphone.jpg)
- **App da cuidadora (marca não lida na folha)** — App da cuidadora no iPhone: "Visit notes" com nota de voz, resumo estruturado pela IA e assinatura do paciente.
  ![App da cuidadora (marca não lida na folha)](../galeria/03-padroes-de-ia/notas-da-visita-por-voz-iphone-cuidado-domiciliar.jpg)
- **Agente doméstico** — agente doméstico no iPhone: "Week ahead" com um conflito resolvido em um toque e a lista "[produto] will handle" com "Ask first" e "On its own".
  ![agente doméstico](../galeria/03-padroes-de-ia/semana-com-conflito-e-o-que-a-ia-faz-iphone.jpg)
- **Agente doméstico** — agente doméstico no iPhone: "9 things to handle, found in 31 school emails." com "Nothing sent, booked or paid" e a pilha por prazo.
  ![agente doméstico](../galeria/03-padroes-de-ia/coisas-achadas-nos-emails-iphone.jpg)
- **Anotador por voz** — anotador por voz escuro no iPhone: "Writing up the job" com a onda de áudio e os passos salvos, enviado, transcrito, lendo e redigindo.
  ![anotador por voz](../galeria/03-padroes-de-ia/escrevendo-o-servico-escuro-iphone.jpg)
- **App de manutenção predial (marca não lida na folha)** — App de manutenção predial no iPhone: "Finish job" com fotos depois, checklist com horário, nota de fechamento vinda da voz e "Complete job".
  ![App de manutenção predial (marca não lida na folha)](../galeria/03-padroes-de-ia/finalizar-servico-com-nota-de-voz-iphone-manutencao.jpg)
- **App de manutenção predial (marca não lida na folha)** — App de manutenção no iPhone: "Additional work" escrito a partir da nota de voz, estimativa, fotos de evidência e "Send for approval".
  ![App de manutenção predial (marca não lida na folha)](../galeria/03-padroes-de-ia/trabalho-extra-da-nota-de-voz-iphone-manutencao.jpg)
- **Anotador por voz** — anotador por voz escuro no iPhone: "Readings" com a dúvida "which did you say?" em chips e as medições antes e depois.
  ![anotador por voz](../galeria/03-padroes-de-ia/leituras-com-duvida-da-voz-escuro-iphone.jpg)
- **Anotador por voz** — anotador por voz escuro no iPhone: "Parts" com peças usadas, a ouvida no áudio com o minuto, escolha 1-pole/2-pole e "Confirm 3 parts".
  ![anotador por voz](../galeria/03-padroes-de-ia/pecas-ouvidas-no-audio-escuro-iphone.jpg)
- **Anotador por voz** — anotador por voz escuro no iPhone: a tela "Parts" de novo, com a peça ouvida no áudio e o toast "Coil clean removed" com Undo.
  ![anotador por voz](../galeria/03-padroes-de-ia/pecas-ouvidas-no-audio-2-escuro-iphone.jpg)
- **Anotador por voz** — anotador por voz escuro no iPhone: "Transcript" com falantes e horários, números destacados e "Heard forty-five five → wrote 45/5" com Change.
  ![anotador por voz](../galeria/03-padroes-de-ia/transcricao-com-correcao-do-que-ouviu-escuro-iphone.jpg)
- **App de cozinha com IA** — app de cozinha com IA: popup "Log waste" com item, quantidade, motivo em chips e "[produto] estimate" da foto com 86% de confiança.
  ![app de cozinha com IA](../galeria/03-padroes-de-ia/registrar-desperdicio-pela-foto.jpg)
- **App de cuidado domiciliar** — app de cuidado domiciliar: visita de Marguerite Holloway com "Visit note · AI structured", o alerta de follow-up recomendado, as palavras da cuidadora, EVV e trilha.
  ![app de cuidado domiciliar](../galeria/03-padroes-de-ia/visita-com-nota-estruturada-e-alerta.jpg)
