# App de manutenção predial

**O produto "leve" de propósito.** As peças mais
completas: a que chama o redesenho de mais uma obra-prima e a que nomeia a categoria
(plataforma de manutenção predial com IA) e fecha em pura alegria.

| Campo | Valor |
|---|---|
| Nome | App de manutenção predial, "Property maintenance" (subtítulo no seletor da sidebar) |
| Setor | manutenção predial: chamados de inquilinos, ordens de serviço, prestadores |
| Para quem | administrador de imóveis e síndico; no app, o inquilino |
| Tema | claro; página `#FFFFFF`, moldura `#EDEDED` **[MEDIDO]** |
| Plataforma | web (dashboard) + mobile (app do inquilino, 3 telas) |
| Acento | verde-garrafa `#1F493B` (botão "New request", barras, linha do gráfico), coral `#E85F4C` (urgente) **[MEDIDO]** |
| Neutros quentes | trilho de barra `#F4EFE9`, pílula "Reassign" em bege `#C5A87F` sobre creme, nav ativo verde-claro `#D7E9E2` **[MEDIDO]** |

## A frase que explica o design

À crítica de que a sidebar era desleixada, a resposta
pergunta se o crítico entende de setor e lembra que o produto é de manutenção predial, para cliente
pouco técnico, remetendo ao design carregado de dados dos produtos técnicos; o crítico depois
diz que só queria lembrar as necessidades de cada setor.

Ou seja: a leveza é decisão de público, não falta de repertório. **[CONFIRMADO]**

## Navegação

Sidebar clara de ≈224 px (em tela 1440) **[MEDIDO: 273 px de 1.750 px de moldura]**:
seletor de workspace no topo (logo verde + "[produto] / Property maintenance" +
chevron), grupos MAIN (Dashboard, Requests com badge vermelho "12", Work orders,
Properties, Tenants), OPERATIONS (Contractors, Calendar, Reports), ACCOUNT
(Messages "3", Settings), cartão do usuário no pé. Item ativo: fundo verde-claro
com barra vertical verde-escura de 4 px à esquerda.

Topo do conteúdo: busca larga ("Search requests, units or tenants"), pilha de
4 avatares + botão "+", seletor "Last 30 days", "Filter", sino, botão verde
"+ New request".

## Módulos / telas

| Bloco (dashboard) | Conteúdo |
|---|---|
| Faixa de 4 KPIs | Open requests 28, Urgent 5, In progress 14, First response 42 min; cada um com rótulo em caixa alta + ícone, número grande + unidade cinza, pílula de variação e botão ↗ |
| Request pipeline | gauge de segmentos (verde → coral → amarelo) com "28 Open requests" no centro + lista de 4 estados com % |
| First response time | gráfico de linha com meta SLA tracejada, tooltip escuro verde, faixa vertical destacando junho |
| Needs attention | 3 chamados com ícone em quadrado arredondado, título "Water leak · Unit 204", quem e quando, pílula Urgent/Reassign/Waiting; botão "View all 12 flagged requests" |
| Today's schedule | 4 barras verticais por faixa horária, a mais cheia em coral |
| Contractor load | 3 prestadores com foto, % e barra de capacidade |

App do inquilino: mapa com rota do técnico e ETA "12 min",
formulário "How urgent is it?" em 3 opções de rádio grandes, botão coral
"Send request".

![dashboard](../galeria/05-apresentacao/shot-4x3-cinza-cartao-inteiro-2.jpg)
![app](../galeria/06-produtos/app-inquilino.jpg)

## Componentes-chave

- KPI com **número + unidade em palavra** ("28 Open", "5 Requests", "42 min avg"),
  nunca número nu.
- Pílula de variação com seta e cor de fundo suave (verde "↗ 12%", coral
  "↗ 2 new today", azul-acinzentado "6 on site").
- Chamado em **linguagem do problema** ("No heat · Unit 118", "Entry lock
  jammed · Unit 305"), não em ID.
- Botão ↗ (arrow-up-right) em quadrado de borda fina no canto de cada cartão:
  "abrir detalhe".

## O que é específico deste setor

- Densidade baixa: 9 blocos, 1 número grande por KPI, zero monoespaçada.
- Cor quente e terrosa (verde-garrafa, coral, creme) em vez do azul SaaS.
- Tudo é traduzido em lugar físico: unidade, propriedade, prestador com foto.

## Como reproduzir

- Moldura 1440, fundo branco, cartões brancos com borda `#EDEDED` 1 px,
  raio ≈16 px, gap ≈16 px.
- Primária `#1F493B`; perigo `#E85F4C`; trilho de barra `#F4EFE9`; nav ativo
  `#D7E9E2`.
- KPI: rótulo 12 px caixa alta cinza, número ≈30 px regular, unidade 14 px cinza.

## Mais telas da série

Nas 12 peças seguintes, sem mudar de produto, o app de manutenção predial deixa de ser só o
dashboard e o app do inquilino e ganha **relatórios** (quatro KPIs com selo de
meta, linha de resposta e fechamento, pedidos por categoria, desempenho dos prestadores com nota),
**notificações** com a ação na própria linha (Review, Assign, Reassign) e as preferências em chave,
**entrar e onboarding** (metade verde-garrafa com a promessa "Every repair, one record." e três números
de prova; o passo "Add your first property" com prévia ao vivo e checklist) e o **app do técnico**
(hoje, aceitar o trabalho com a fala do inquilino entre aspas, o técnico a caminho, a câmera "BEFORE · 2
OF 3"). Os dois vídeos (o fluxo com cursor e as microinterações sobre bege) estão em
[../05-apresentacao/video-e-movimento.md](../05-apresentacao/video-e-movimento.md). As três telas do
técnico saíram três vezes em uma semana, com legendas diferentes.


![video fluxo pedido ao prestador  capa](../galeria/05-apresentacao/video-fluxo-pedido-ao-prestador-capa.jpg)
![relatorios](../galeria/06-produtos/relatorios-tela.jpg)
![mobile hoje tecnico](../galeria/06-produtos/mobile-hoje-tecnico-2.jpg)
![mobile aceitar trabalho](../galeria/06-produtos/mobile-aceitar-trabalho.jpg)
![mobile tecnico a caminho](../galeria/06-produtos/mobile-tecnico-a-caminho.jpg)
![mobile camera foto antes](../galeria/06-produtos/mobile-camera-foto-antes.jpg)
![entrar painel de marca](../galeria/04-tipos-de-tela/entrar-painel-de-marca.png)
![onboarding primeiro imovel](../galeria/04-tipos-de-tela/onboarding-primeiro-imovel.jpg)
![notificacoes](../galeria/04-tipos-de-tela/notificacoes-tela.jpg)
![video microinteracoes  capa](../galeria/05-apresentacao/video-microinteracoes-capa.jpg)
![mobile hoje tecnico repostagem](../galeria/06-produtos/mobile-hoje-tecnico-repostagem.jpg)
![mobile camera foto antes repostagem](../galeria/06-produtos/mobile-camera-foto-antes-repostagem.jpg)
![mobile aceitar trabalho repostagem](../galeria/06-produtos/mobile-aceitar-trabalho-repostagem.jpg)
![video telas com cursor  capa](../galeria/05-apresentacao/video-telas-com-cursor-capa-2.jpg)

## Mais telas

- Dois vídeos de redesenho (o redesenho do SaaS feito com IA e a plataforma web).

Telas:

- App de manutenção predial: "Reports" com quatro KPIs, linhas de resposta e fechamento, pedidos por categoria e desempenho por prestador ![](../galeria/06-produtos/relatorios-tela.jpg)
- App de manutenção predial: prestador "Mike's Plumbing" com selos de licença e seguro, desempenho, serviços recentes e documentos com validade ![](../galeria/06-produtos/prestador-com-documentos.jpg)
- Capa do vídeo do app de manutenção predial sobre bege: o painel com o medidor de pedidos ![](../galeria/05-apresentacao/video-telas-com-cursor-capa-2.jpg)
- Quadro a 15%: "Requests" com o cursor ![](../galeria/05-apresentacao/video-telas-com-cursor-quadro-1-2.jpg)
- Quadro a 50%: o popup "Send the job to Mike's Plumbing" com a mensagem pronta ![](../galeria/05-apresentacao/video-telas-com-cursor-quadro-2-2.jpg)
- Quadro a 85%: "Live job" com etapas, fotos e o valor aprovado ![](../galeria/05-apresentacao/video-telas-com-cursor-quadro-3-2.jpg)
- App de manutenção predial: "Notifications" com a lista por dia e ação por linha, "Needs action" em vermelho e "Notify me about" com chaves ![](../galeria/04-tipos-de-tela/notificacoes-tela.jpg)
- App de manutenção predial: "Dashboard" com KPIs, o medidor semicircular de 28 pedidos, tempo de primeira resposta, precisa de atenção e carga dos prestadores ![](../galeria/06-produtos/painel-com-medidor-de-pedidos.jpg)
- Capa do vídeo da plataforma web do app de manutenção predial sobre fundo verde-claro desfocado ![](../galeria/05-apresentacao/video-fluxo-pedido-ao-prestador-capa.jpg)
- Quadro a 15%: o pedido "Water leak · Unit 204" com fotos e o cartão verde-escuro da IA ![](../galeria/05-apresentacao/video-fluxo-pedido-ao-prestador-quadro-1.jpg)
- Quadro a 50%: "Assign a contractor" com a lista ranqueada e o cartão do prestador ![](../galeria/05-apresentacao/video-fluxo-pedido-ao-prestador-quadro-2.jpg)
- Quadro a 85%: a tela inicial carregando os números ![](../galeria/05-apresentacao/video-fluxo-pedido-ao-prestador-quadro-3.jpg)
- Capa do vídeo do redesenho do app de manutenção predial: o painel com medidor semicircular e cartões ![](../galeria/05-apresentacao/video-redesenho-capa-2.jpg)
- Quadro a 15%: a lista de pedidos com "Smart triage is sorting 3 new requests" ![](../galeria/05-apresentacao/video-redesenho-quadro-1-2.jpg)
- Quadro a 50%: o filtro de prioridade aberto em zoom com o cursor em "High" ![](../galeria/05-apresentacao/video-redesenho-quadro-2-2.jpg)
- Quadro a 85%: "Smart triage sorted 3 new requests" e a tabela por SLA ![](../galeria/05-apresentacao/video-redesenho-quadro-3-2.jpg)
