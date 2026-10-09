# FixTrack

**O produto "leve" de propósito.** 17 peças, 242.730 views, 2.738 salvos. Duas
peças passaram de 45 mil views ("Another masterpiece. Redesigned it." e
"AI-powered Property Maintenance product/platform Design. Pure Joy").

| Campo | Valor |
|---|---|
| Nome | FixTrack, "Property maintenance" (subtítulo no seletor da sidebar) |
| Setor | manutenção predial: chamados de inquilinos, ordens de serviço, prestadores |
| Para quem | administrador de imóveis e síndico; no app, o inquilino |
| Tema | claro; página `#FFFFFF`, moldura `#EDEDED` **[MEDIDO]** |
| Plataforma | web (dashboard) + mobile (app do inquilino, 3 telas) |
| Acento | verde-garrafa `#1F493B` (botão "New request", barras, linha do gráfico), coral `#E85F4C` (urgente) **[MEDIDO]** |
| Neutros quentes | trilho de barra `#F4EFE9`, pílula "Reassign" em bege `#C5A87F` sobre creme, nav ativo verde-claro `#D7E9E2` **[MEDIDO]** |

## Telas publicadas

<!--T:FixTrack-->
| # | views | salvos | salvos/1k | mídia | legenda |
|---|---:|---:|---:|---|---|
| 1 | 45.397 | 178 | 3,9 | 2 img | AI-powered Property Maintenance product/platform Design.  Pure Joy❤️ |
| 2 | 46.208 | 321 | 6,9 | 1 img | Another masterpiece. Redesigned it. |
| 3 | 17.553 | 145 | 8,3 | 3 img | Yoo🫡 |
| 4 | 11.704 | 171 | 14,6 | vídeo | I turn shitty AI design into this grade interface. Rate this, guys. Ho |
| 5 | 8.239 | 142 | 17,2 | 1 img | FixTrack, Property Maintenance, Simplified |
| 6 | 19.974 | 213 | 10,7 | vídeo | AI-powered Property Maintenance product/platform UXUI Design. Pure Joy |
| 7 | 5.731 | 47 | 8,2 | 1 img | Report page UI Design for Real Estate property maintenance platform. |
| 8 | 4.462 | 57 | 12,8 | 4 img | Property maintenance app - ui design |
| 9 | 10.645 | 178 | 16,7 | 2 img | Onboarding screens ui design.. |
| 10 | 17.090 | 274 | 16,0 | 1 img | Notification page UI design. |
| 11 | 1.171 | 8 | 6,8 | vídeo | (sem texto) |
| 12 | 2.105 | 30 | 14,3 | 1 img | Simple signin page. |
| 13 | 3.092 | 22 | 7,1 | 3 img | Mobile UI Design |
| 14 | 28.907 | 596 | 20,6 | vídeo | Fixtack Property management SAAS design. |
| 15 | 4.838 | 80 | 16,5 | 1 img | Notification page with a simple and minimal design. |
| 16 | 4.090 | 25 | 6,1 | 3 img | IOS Mobile app design for contractors. |
| 17 | 11.524 | 251 | 21,8 | vídeo | I designed this Fixtrack saas for Property management. |
| **total** | **242.730** | **2.738** | **11,3** | | |
<!--/T-->

## A frase que explica o design

À crítica de que a sidebar era "sloppy", a resposta:
*"I am wondering if you understand the industries! Fixtrack is for property
maintenance, not very high-tech client."*, remetendo ao design "data-heavy" dos
produtos técnicos, e depois *"I just tried to make sure you consider
industry-specific needs."*

Ou seja: a leveza é decisão de público, não falta de repertório. **[CONFIRMADO]**

## Navegação

Sidebar clara de ≈224 px (em tela 1440) **[MEDIDO: 273 px de 1.750 px de moldura]**:
seletor de workspace no topo (logo verde + "FixTrack / Property maintenance" +
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

![dashboard](../galeria/05-apresentacao/shot-4x3-cinza-cartao-inteiro-fixtrack.jpg)
![app](../galeria/06-produtos/fixtrack-app-inquilino.jpg)

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

## Performance

17 peças, **242.730 views, 2.738 salvos, 11,3 salvos/1k**. Nas cinco primeiras
(129.101 views, 957 salvos), a única peça com o nome na legenda fez 8.239 views; as
4 com gancho têm mediana de 31.475.

## Como reproduzir

- Moldura 1440, fundo branco, cartões brancos com borda `#EDEDED` 1 px,
  raio ≈16 px, gap ≈16 px.
- Primária `#1F493B`; perigo `#E85F4C`; trilho de barra `#F4EFE9`; nav ativo
  `#D7E9E2`.
- KPI: rótulo 12 px caixa alta cinza, número ≈30 px regular, unidade 14 px cinza.

## Mais telas da série

Nas 12 peças seguintes, sem mudar de produto, o FixTrack deixa de ser só o
dashboard e o app do inquilino e ganha **relatórios** (quatro KPIs com selo de
meta, linha de resposta e fechamento, pedidos por categoria, desempenho dos prestadores com nota),
**notificações** com a ação na própria linha (Review, Assign, Reassign) e as preferências em chave,
**entrar e onboarding** (metade verde-garrafa com a promessa "Every repair, one record." e três números
de prova; o passo "Add your first property" com prévia ao vivo e checklist) e o **app do técnico**
(hoje, aceitar o trabalho com a fala do inquilino entre aspas, o técnico a caminho, a câmera "BEFORE · 2
OF 3"). Os dois vídeos (o fluxo com cursor e as microinterações sobre bege) estão em
[../05-apresentacao/video-e-movimento.md](../05-apresentacao/video-e-movimento.md). As três telas do
técnico saíram três vezes em uma semana, com legendas diferentes.


![video fluxo pedido ao prestador fixtrack capa](../galeria/05-apresentacao/video-fluxo-pedido-ao-prestador-fixtrack-capa.jpg)
![relatorios fixtrack](../galeria/06-produtos/relatorios-fixtrack.jpg)
![mobile hoje tecnico fixtrack](../galeria/06-produtos/mobile-hoje-tecnico-fixtrack.jpg)
![mobile aceitar trabalho fixtrack](../galeria/06-produtos/mobile-aceitar-trabalho-fixtrack.jpg)
![mobile tecnico a caminho fixtrack](../galeria/06-produtos/mobile-tecnico-a-caminho-fixtrack.jpg)
![mobile camera foto antes fixtrack](../galeria/06-produtos/mobile-camera-foto-antes-fixtrack.jpg)
![entrar painel de marca fixtrack](../galeria/04-tipos-de-tela/entrar-painel-de-marca-fixtrack.png)
![onboarding primeiro imovel fixtrack](../galeria/04-tipos-de-tela/onboarding-primeiro-imovel-fixtrack.jpg)
![notificacoes fixtrack](../galeria/04-tipos-de-tela/notificacoes-fixtrack.jpg)
![video microinteracoes fixtrack capa](../galeria/05-apresentacao/video-microinteracoes-fixtrack-capa.jpg)
![mobile hoje tecnico repostagem fixtrack](../galeria/06-produtos/mobile-hoje-tecnico-repostagem-fixtrack.jpg)
![mobile camera foto antes repostagem fixtrack](../galeria/06-produtos/mobile-camera-foto-antes-repostagem-fixtrack.jpg)
![mobile aceitar trabalho repostagem fixtrack](../galeria/06-produtos/mobile-aceitar-trabalho-repostagem-fixtrack.jpg)
![video telas com cursor fixtrack capa](../galeria/05-apresentacao/video-telas-com-cursor-fixtrack-capa.jpg)
