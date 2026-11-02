# 12 · A IA rascunha, o humano envia; tudo reversível; sandbox antes de publicar

Padrão acrescentado nesta pesquisa (não estava no briefing). Aparece em cinco produtos e fecha o
circuito do padrão 06: se a IA age dentro de um limite, o que ela fez precisa poder ser visto
antes, testado antes e desfeito depois.

## O que é

Três mecanismos de segurança, com interface própria:

1. **Rascunho:** a IA prepara a ação (e-mail, reembolso, mudança de estágio) e para no botão de
   envio, que é humano.
2. **Desfazer:** toda ação executada tem volta visível (toast com "Undo", reversão por prazo,
   "Hand back to agent").
3. **Sandbox:** mudança de instrução ou política é testada num console sem efeito colateral e
   numa suíte de regressão antes de ser publicada.

## Anatomia 1: rascunho (app de caixa)

![app de caixa: rascunho do lembrete](../galeria/03-padroes-de-ia/reminder-drafted.jpg)

- Tela "Reminder" com o contexto "Brightline Health · $12,000 · 22 days overdue · 2 reminders
  sent".
- **Segmentado de tom:** Friendly · **Firm** · Final. A IA escolheu "Firm" e explica no rodapé:
  "✦ Firm because the last two friendly reminders got no reply."
- **Chip "✦ Drafted by [produto]"** com gradiente, e "Edit" à direita.
- O e-mail inteiro visível (To, Subject "INV-1042 ($12,000) is 22 days past due", corpo, "Thanks,
  Maya"). **Assinado pela pessoa, não pela IA.**
- Toggle "Attach invoice PDF" e o CTA "Review & send". O verbo é "revisar e enviar", nunca
  "enviar" direto.
- Na ficha do cliente: "Automatic reminders · V1.1 · Off · **[produto] drafts, you send**". A frase
  do toggle desligado explica o modo em que a IA opera.

## Anatomia 2: desfazer

- App de caixa: toast escuro "✓ Reminder sent to Dana · Undo" sobre o histórico, e o botão principal
  vira "Reminded today" desabilitado. **[OBSERVADO]**
- App do técnico de campo: "sarah knows you're coming · we texted her an 8:55 –
  9:10 am window · ✓ notified 8:33 am · office updated · **undo**". A ação automática aconteceu,
  e o undo fica no mesmo card.
- CRM de receita (leitura parcial): "Every stage move CRM de receita makes can be reverted for
  thirty days. Reverting also pins the stage so CRM de receita will not move it again." **[OBSERVADO,
  imagem de 1024 px, texto pequeno]**
- CRM de receita decision record: "How to reverse it" como campo fixo (padrão 04).
- App de despesas com IA: "Every step is editable before it runs. Nothing has been actioned — this decision is
  held pending…".
- Painel de agentes de operação: "Hand back to agent" (padrão 06).

## Anatomia 3: sandbox e regressão (painel de agentes de operação)

![painel de agentes de operação: test console e regressão](../galeria/03-padroes-de-ia/agente-autoridade.jpg)

- Cabeçalho da ficha do agente: "Agents / Ana · `v3 draft · v2 live`" + "autosaved 1 min ago" +
  "Discard draft" + **"Publish v3"**.
- Instrução com diff: "v3 draft · 1 line changed", a linha nova em verde com "+".
- **"Test console · sandbox · no side-effects"**: conversa simulada em que a resposta do agente
  vem com o **veredito da política** em cima, em verde "Would act · within authority ✓" ou âmbar
  "Would escalate ⚠ above R$ 5,000", e embaixo a linha de trace "trace · rule "value above
  ceiling" · no fallback". Campo "Message the agent…".
- **"REGRESSION SUITE · 24 SCENARIOS":** "23 pass" (verde), "1 changed" (âmbar), "Run suite", e a
  explicação da mudança: ""Asks for a discount" now refuses instead of escalating — expected
  after v3 line change." + "9 of 11 paths covered · last run 10:42 · Marina".

## Quando usar

Rascunho: sempre que a IA fala **para fora** da empresa (cliente, fornecedor). Desfazer: sempre
que a IA age sozinha em algo visível para terceiro. Sandbox: sempre que a pessoa muda o
comportamento do agente. **[OBSERVADO em 5 produtos]**

## Como reproduzir

1. Ação externa da IA = rascunho com chip "✦ Drafted by {IA}", botão "Edit" e CTA "Review &
   send". Assinatura da pessoa.
2. Se a IA escolheu um tom ou uma variante, mostre as opções (segmentado) e **uma linha dizendo
   por que escolheu aquela**.
3. Ação automática executada = toast com "Undo" + o botão principal muda para o estado feito.
4. Versão de agente e de política no cabeçalho (`v3 draft · v2 live`), com "Discard draft" e
   "Publish v3".
5. Console de teste marcado "sandbox · no side-effects", com veredito da política em cada
   resposta, em condicional ("Would act", "Would escalate").
6. Suíte de regressão com contagem de passou / mudou e a frase que explica cada mudança como
   esperada ou não.

## Mais exemplos

Telas de outras séries que repetem ou estendem o padrão (fichas em [../06-produtos/](../06-produtos/README.md)).

- **App de locação residencial, rascunho esperando** — "[produto] AI is handling this chat" e o rascunho "Draft reply · Waiting for you" com o motivo da pausa e o par **Take Over / Approve Reply**.
  ![app de locação residencial, rascunho esperando](../galeria/03-padroes-de-ia/mobile-conversa-rascunho-aprovar.jpg)
- **App de locação residencial, renovação** — "AI suggestion · Send both options together" com o porquê, ao lado das duas ofertas prontas.
  ![app de locação residencial, renovação](../galeria/03-padroes-de-ia/renovacao-conversa-sugestao-ia.jpg)
- **Assistente de reembolso, fluxo gerado** — "Generated 12 seconds ago · Not saved yet" com Regenerate / Edit on canvas / Accept flow.
  ![assistente de reembolso, fluxo gerado](../galeria/03-padroes-de-ia/fluxo-gerado-aceitar-ou-editar-assistente-reembolso.jpg)
- **App de locação residencial, follow-up da visita** — "AI follow-up · Sends when completed" com a mensagem pronta e Send follow-up / Edit.
  ![app de locação residencial, follow-up da visita](../galeria/03-padroes-de-ia/mobile-visita-follow-up-da-ia.jpg)
- **App de recuperação de garantia, provável garantia** — "Likely under warranty" com o porquê e a lista do que capturar, na versão do app que o cliente recusou.
  ![app de recuperação de garantia, provável garantia](../galeria/03-padroes-de-ia/mobile-provavel-garantia-capturar.jpg)

## Mais exemplos

Telas que repetem ou estendem o padrão (fichas em [../06-produtos/](../06-produtos/README.md)); uma linha por imagem.

- **Painel de licenciamento solar** — painel de licenciamento solar no iPhone: rastreio da licença com janela de revisão atrasada, etapas e o follow-up redigido pelo assistente de IA do licenciamento para revisar.
  ![painel de licenciamento solar](../galeria/03-padroes-de-ia/follow-up-redigido-pela-ia-iphone.jpg)
- **App de consultoria com IA** — app de consultoria com IA: Knowledge com o toast escuro "Conflict resolved · The advisor now follows the 2024 playbook" e a tabela de fontes.
  ![app de consultoria com IA](../galeria/03-padroes-de-ia/conflito-resolvido-toast.jpg)
- **Anotador por voz** — anotador por voz escuro no iPhone: fatura "Draft — not sent" de $748.28 com itens do livro de preços e "Approve invoice".
  ![anotador por voz](../galeria/03-padroes-de-ia/fatura-rascunho-nao-enviada-escuro-iphone.jpg)
- **App de homologação de fornecedor** — app de homologação de fornecedor escuro: popup "Send reminder · drafted by AI" com a mensagem, o tom explicado, "Remind again in 2 days" e Schedule/Send now.
  ![app de homologação de fornecedor](../galeria/03-padroes-de-ia/lembrete-redigido-pela-ia-escuro.jpg)
- **App de caixa** — app de caixa no iPhone: "Reminder" com tom Friendly/Firm/Final, e-mail "Drafted by [produto]" e "Review & send".
  ![app de caixa](../galeria/03-padroes-de-ia/lembrete-de-cobranca-redigido-iphone.jpg)
- **App de locação residencial** — app de locação residencial no iPhone: visita marcada "Tuesday 22", a unidade com foto e "AI follow-up" com Send e Edit.
  ![app de locação residencial](../galeria/03-padroes-de-ia/visita-com-follow-up-da-ia-iphone.jpg)
- **App de homologação de fornecedor** — app de homologação de fornecedor escuro no iPhone: folha "Nudge Margo" com a mensagem redigida pela IA, a base dela e "Remind again in 2 days".
  ![app de homologação de fornecedor](../galeria/03-padroes-de-ia/cutucar-com-mensagem-redigida-iphone-escuro.jpg)
- **App de homologação de fornecedor** — app de homologação de fornecedor escuro: o popup "Send reminder · drafted by AI" de novo.
  ![app de homologação de fornecedor](../galeria/03-padroes-de-ia/lembrete-redigido-pela-ia-2-escuro.jpg)
- **App de homologação de fornecedor** — app de homologação de fornecedor escuro: "Security review" com o popup "Request clarification" com a pergunta redigida pela IA, prazo e "Pause approval until answered".
  ![app de homologação de fornecedor](../galeria/03-padroes-de-ia/pedir-esclarecimento-redigido-escuro.jpg)
- **App de cuidado domiciliar** — app de cuidado domiciliar: "The day is rebuilt" com três substituições aprovadas, "undo is available until 9:02 AM", cobertura antes e depois e o que cada pessoa vê.
  ![app de cuidado domiciliar](../galeria/03-padroes-de-ia/dia-refeito-com-desfazer.jpg)
- **App de cuidado domiciliar** — app de cuidado domiciliar: "The day is rebuilt" com as visitas reatribuídas, cobertura antes e depois, o que foi atualizado sozinho e o que cada pessoa vê.
  ![app de cuidado domiciliar](../galeria/03-padroes-de-ia/dia-refeito-com-desfazer-2.jpg)
- **App de cuidado domiciliar** — app de cuidado domiciliar no iPhone: "The day is rebuilt" com cada visita aceita ou esperando, "Updated on its own" e Undo ao lado de Done.
  ![app de cuidado domiciliar](../galeria/03-padroes-de-ia/dia-refeito-com-desfazer-iphone.jpg)
- **App de locação residencial** — app de locação residencial no iPhone: visita de Sarah Mitchell com a unidade em foto e "AI follow-up · Sends when completed" com Send e Edit.
  ![app de locação residencial](../galeria/03-padroes-de-ia/visita-com-follow-up-da-ia-2-iphone.jpg)
- **App de cuidado domiciliar** — app de cuidado domiciliar: "The day is rebuilt" com a cobertura antes e depois, quadro a quadro (primeira saída).
  ![app de cuidado domiciliar](../galeria/03-padroes-de-ia/dia-refeito-com-desfazer-3.jpg)
