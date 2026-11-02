# 08 · Assistente contextual com perguntas sugeridas sobre o que está na tela

## O que é

Um bloco de assistente **dentro** da tela (card, botão no topo ou campo no pé de um card), que já
sabe o que a pessoa está vendo e abre com **perguntas prontas sobre aquele dado**, e não com
"Como posso ajudar?".

## Problema que resolve

O campo de chat vazio obriga a pessoa a saber o que perguntar. Troque isso por perguntas
escritas a partir do estado da tela, que funcionam como atalho para a explicação que a pessoa
provavelmente quer.

## Anatomia (painel de agentes hospitalares e vídeo)

![Assistente com perguntas](../galeria/03-padroes-de-ia/assistente-perguntas-sugeridas.jpg)

1. **Orbe** azul em gradiente radial (única ilustração da tela, ~60 px), no topo do card.
2. **Saudação em duas linhas, centralizada:** "Welcome, [nome] / What can I help with today?"
3. **Três ações rápidas** em pílulas com ícone: "Name workflows", "Explain graph", "Invite team".
   São as mesmas tarefas do card "Next steps" (padrão 02), agora executáveis pelo assistente.
4. **Rótulo de seção em caixa-alta pequena:** "ASK ABOUT WHAT WE FOUND".
5. **Duas perguntas sugeridas** em linhas com ícone de brilho e seta: "Why is validator_agent
   still pending?", "Which agent is most likely to fail first?". Ambas citam **uma entidade
   que está na tela** (validator_agent está "Pending" na linha do tempo acima).
6. **Campo "Ask me anything"** com "Attach", "Create", microfone, envio, e contador **"0/300"**.

Na versão de incidentes (quadro do vídeo), o assistente muda com o estado:

> "Welcome back, [nome] · **3 open incidents. Want the loop explained?**" com ações
> "Explain INC-2481", "Cost forecast", "Draft a fix".

![Assistente com incidente aberto](../galeria/03-padroes-de-ia/overview-welcome-back.jpg)

A saudação deixa de ser genérica e **resume o estado e oferece a próxima explicação**.

## Variações

| Produto | Forma | Texto |
|---|---|---|
| App de financiamento imobiliário | campo no pé do card "Action required" | placeholder "Ask what a mortgage term means…" (o assistente explica jargão, no lugar exato em que a pessoa trava) |
| App de frota | botão de destaque no topo, gradiente azul → verde | "✦ Ask [produto]" |
| CRM de receita, app de despesas com IA, painel de permissões de agentes | botão no topo, ao lado de busca | "Ask [produto]", "Ask [produto] ⌘K", "Ask Ctrl" |
| App de coaching de vendas (série anterior) | botão com persona | "Ask Coach Dean" |
| App de despesas com IA | busca e assistente fundidos | "Ask [produto] or search ⌘K" |
| Co-professor de IA | card de sugestão com "Why this?" sublinhado | a explicação é um link no próprio card |
| App da clínica de estética | card no pé da sidebar | "[produto] · 6 clients are due to rebook this week. Draft reminders? · Review list" (o assistente pergunta, não espera ser perguntado) |

## A regra por trás

O assistente quase nunca é a primeira coisa da tela. Ele vem **depois** do dado e do
próximo passo, na terceira coluna ou no topo direito. Quando ocupa a tela inteira (site de automação:
"Hi, There 👋 Choose a prompt below or write your own"), funciona menos que o
painel de agentes hospitalares, em que o assistente vem depois do dado. **[OBSERVADO]**

![Contraste: chat solto](../galeria/03-padroes-de-ia/chat-solto-contraste.jpg)

## Como reproduzir

1. Nunca abrir com o campo vazio sozinho. Abrir com: saudação curta + estado resumido em uma
   frase + 2 ou 3 ações + 2 perguntas sobre entidades visíveis.
2. As perguntas citam nome de coisa da tela (`validator_agent`, `INC-2481`) e terminam com "?".
3. Ícone de brilho (✦) nas perguntas e nas ações da IA, em toda a interface: é o marcador de
   "isto é IA".
4. Limite de caracteres visível ("0/300") no campo.
5. Nome do botão = "Ask" + nome do produto. Atalho ⌘K ao lado quando for global.

## Mais exemplos

Telas de outras séries que repetem ou estendem o padrão (fichas em [../06-produtos/](../06-produtos/README.md)).

- **App de financiamento imobiliário, linguagem simples** — o cartão "In plain English · What is underwriting?" com a explicação e um campo para perguntar outro termo, ao lado da etapa em que o termo aparece.
  ![app de financiamento imobiliário, linguagem simples](../galeria/03-padroes-de-ia/sua-solicitacao-em-linguagem-simples.jpg)

## Mais exemplos

Telas que repetem ou estendem o padrão (fichas em [../06-produtos/](../06-produtos/README.md)); uma linha por imagem.

- **App de coaching com compromissos** — app de coaching com compromissos escuro web: popup "Generate [produto]" com a fonte (Zoom, transcrição, notas), o que procurar e o aviso de consentimento.
  ![app de coaching com compromissos](../galeria/03-padroes-de-ia/gerar-resumo-da-sessao-escuro.jpg)
- **Produto de tema** — produto de tema no iPhone: "Explanation" com abas Quick/Step by step/Deep dive, por que B funciona e por que A enganou.
  ![produto de tema](../galeria/03-padroes-de-ia/explicacao-passo-a-passo-iphone.jpg)
- **App de coaching com compromissos** — app de coaching com compromissos escuro web: "Analyzing your session" com passos em andamento e "Found so far" preenchendo ao lado.
  ![app de coaching com compromissos](../galeria/03-padroes-de-ia/analisando-a-sessao-escuro.jpg)
- **App de coaching com compromissos** — app de coaching com compromissos escuro web: "Live session" gravando com compromissos anteriores, pauta, notas ao vivo e "Sounds like a commitment" com Ignore e Add.
  ![app de coaching com compromissos](../galeria/03-padroes-de-ia/sessao-ao-vivo-com-notas-escuro.jpg)
- **Produto de tema** — produto de tema no iPhone: a "Explanation" passo a passo de novo, com o toast "Flag sent" e Undo.
  ![produto de tema](../galeria/03-padroes-de-ia/explicacao-passo-a-passo-2-iphone.jpg)
- **Painel de inteligência de pagamentos** — painel de inteligência de pagamentos: "Ask [produto]" em chat com a resposta com gráfico, o que aconteceu, ações e números-chave ao lado.
  ![painel de inteligência de pagamentos](../galeria/03-padroes-de-ia/pergunte-ao-produto-com-grafico.jpg)
