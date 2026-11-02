# App de contas a receber

**Contas a receber que preveem quando o cliente paga.** A primeira peça está em
[outros-produtos.md](outros-produtos.md); a série tem 8 peças em nove dias, web e iOS. A frase da
legenda para o produto:
e se as faturas pudessem prever? Seguida da categoria, design de gestão de faturas.
**[CONFIRMADO]**

| Campo | Valor |
|---|---|
| Setor | cobrança B2B: faturas, promessas de pagamento, previsão de caixa, risco por cliente |
| Para quem | o financeiro de uma empresa média (Sarah Keller na web; outro nome no celular) |
| Tema | claro com neutros tingidos de verde; rail escuro de ícones com o ativo em verde (ver [../01-sistema-visual/cor.md](../01-sistema-visual/cor.md)) |
| Plataforma | web (fatura, cliente) + iOS (tela de bloqueio, Today, Promises, Cash) |
| Acento | verde vivo nos botões de ação ("Start collection plan", "Draft follow up") e no widget da tela de bloqueio |

## O que cada tela tem

- **Fatura (web)** — $42,800 "Paid 22 September · six days earlier than predicted", faixa verde
  do pagamento recebido, a linha do tempo do pagamento em seis passos, o cartão **"How the
  prediction did"** (janela prevista, data real, diferença, e a frase de que o sistema agora pesa
  mais as promessas registradas), os itens e o cliente com risco 58/100. Repostada dias depois.
  ![fatura](../galeria/04-tipos-de-tela/detalhe-fatura-vencida.jpg)
  ![fatura repostada](../galeria/04-tipos-de-tela/detalhe-fatura-vencida-repostagem.jpg)
- **Cliente (web)** — "Acme Corporation" com selo At risk, totais, comportamento de pagamento em
  três barras, faturas abertas com atraso, **"Collection risk 72 of 100"** com o que compõe a nota
  em barras, o cartão verde "What changed" (prazo médio de 28 para 41 dias) e "Tighten their
  workflow". Publicada inteira (4:3) e partida em díptico de retrato.
  ![cliente inteiro](../galeria/06-produtos/cliente-acme-inteiro.jpg)
  ![díptico esquerda](../galeria/05-apresentacao/diptico-cliente-esquerda.jpg)
  ![díptico direita](../galeria/05-apresentacao/diptico-cliente-direita.jpg)
- **iOS** — tela de bloqueio verde com o widget "$184,200 needs you" e notificações do produto
  (promessa detectada, pagamento recebido); Today com "Needs you today" e "Chase first"; Promises
  com a taxa cumprida 78%. E o vídeo-esteira de três celulares
  ([../05-apresentacao/video-e-movimento.md](../05-apresentacao/video-e-movimento.md)).
  ![bloqueio](../galeria/06-produtos/ios-tela-bloqueio-notificacoes.jpg)
  ![today](../galeria/06-produtos/ios-hoje-cobrar-primeiro.jpg)
  ![promessas](../galeria/06-produtos/ios-promessas.jpg)
  ![today repostada](../galeria/06-produtos/ios-hoje-repostagem.jpg)

## O que a série ensina

- **A previsão presta contas.** A tela da fatura paga não só registra o pagamento: mostra quanto
  a previsão errou e o que o sistema aprendeu. É o padrão de confiança explícita aplicado depois
  do fato ([../03-padroes-de-ia/03-confianca-explicita.md](../03-padroes-de-ia/03-confianca-explicita.md)).
- **Nota com composição** ("72 of 100" com cinco fatores em barra) em vez de semáforo solto.
- **Repostagem pesada**: as mesmas três telas de iOS saíram em três peças com legendas diferentes,
  em nove dias, e a fatura em duas.

## Mais telas

- Ganhou o celular (faturas por idade, caixa previsto, previsão de pagamento com 84%) e o plano de cobrança ranqueado com "How this was ranked".

Telas:

- Capa do vídeo do app do app de contas a receber: esteira de três celulares sobre degradê cinza com a tela de bloqueio verde ![](../galeria/05-apresentacao/video-faixa-de-celulares-capa-2.jpg)
- Quadro a 15%: "Today", a fatura com a previsão de pagamento e a conversa com o cliente ![](../galeria/05-apresentacao/video-faixa-de-celulares-quadro-1-2.jpg)
- Quadro a 50%: o cliente com risco 72 e o caixa previsto ![](../galeria/05-apresentacao/video-faixa-de-celulares-quadro-2-2.jpg)
- Quadro a 85%: o caixa, a tela de bloqueio e o "Today" de novo ![](../galeria/05-apresentacao/video-faixa-de-celulares-quadro-3-2.jpg)
- App de contas a receber no iPhone: "Invoices" com barra por idade da dívida, lista de atrasadas e o deslize com Snooze e Remind ![](../galeria/06-produtos/faturas-por-idade-iphone.jpg)
- App de contas a receber no iPhone: "Cash" com previsão de 8 semanas, alerta "October is $38,000 short" e lista por semana ![](../galeria/06-produtos/caixa-previsto-iphone.jpg)
- App de contas a receber no iPhone: fatura de $42,800 com "[produto] prediction · Likely paid 28 Sep to 2 Oct", 84% sure e a promessa detectada ![](../galeria/03-padroes-de-ia/previsao-de-pagamento-iphone.jpg)
- App de contas a receber: cliente Alderney Ceramics com quatro KPIs, comportamento de pagamento, "Collection risk 72" com os fatores e "What changed" ![](../galeria/06-produtos/cliente-com-risco-de-cobranca.jpg)
- App de contas a receber: "Good morning, [nome]" com recebíveis $620,400 em quatro estados e "Collection health 87%" ![](../galeria/06-produtos/bom-dia-recebiveis.jpg)
- App de contas a receber: barras mensais de recebido x aberto e o estado vazio "Nothing to chase today" ![](../galeria/06-produtos/nada-para-cobrar-hoje-estado-vazio.jpg)
- App de contas a receber: popup "Record a payment" com valor, data, método, chaves e a nota do app de contas a receber sobre o que muda ![](../galeria/06-produtos/popup-registrar-pagamento.jpg)
- App de contas a receber: "Today's collection plan" com a fila ranqueada por valor recuperável, a ação por linha e "How this was ranked" ![](../galeria/03-padroes-de-ia/plano-de-cobranca-ranqueado.jpg)
