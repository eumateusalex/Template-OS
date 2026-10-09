# Vídeo e movimento: como animar o trabalho

## O que é

24 vídeos de peças publicadas (um deles é GIF animado convertido pela plataforma). Quatro são repostagens de terceiros, então sobram **20 vídeos próprios**, **13 deles da fase de produto e da transição** (um é repostagem do mesmo vídeo). Cada vídeo foi medido com `ffprobe` (tamanho, quadros por segundo, duração, áudio) e decomposto em quadros a 10 por segundo; a diferença média de pixel entre quadros vizinhos mostra quando a imagem está parada, quando a câmera anda e quando há corte. Folhas de quadros (1 quadro a cada 1,5 s) serviram para ver o conteúdo.

## Ficha técnica dos vídeos **[MEDIDO]**

Em ordem de publicação.

| peça | tamanho | fps | duração | views | salvos | tipo |
|---|---|---:|---:|---:|---:|---|
| "👀" | 2880×2160 | 60 | 4,0 s | 398 | 2 | micro-interação |
| "Bento card Animation / How is it?🧐" | 2880×2160 | 60 | 5,1 s | 298 | 0 | micro-interação com brilho |
| (sem legenda) | 800×600 | 10 | 2,5 s | 608 | 3 | GIF |
| "IQram – Healthcare SaaS Dashboard" | 2880×2160 | 60 | 2,5 s | 575 | 4 | abrir modal |
| "AI agent monitoring.." | 1440×1210 | 30 | 8,0 s | 5.219 | 114 | montagem progressiva |
| **"Ai Agent for hospital governance."** | 1600×1200 | 60 | 8,0 s | **90.913** | 188 | clique entre telas |
| "Mental health mobile app" | 1600×1300 | 30 | 15,6 s | 1.406 | 7 | iPhone flutuante |
| "Delivery riding App design!" | 1600×1300 | 30 | 21,0 s | 1.502 | 14 | iPhone flutuante |
| "Know what your AI agents can do..." | 1600×1200 | 30 | 16,0 s | 1.757 | 17 | demonstração com cursor |
| "I turn shitty AI design into this grade interface..." | 1200×900 | 30 | 24,0 s | 11.704 | 171 | passeio com zoom no cursor |
| "Cool cards in motion!" | 1080×1350 | 30 | 15,0 s | 2.919 | 15 | cartão em loop |
| "A powerhouse for the marketing team..." | 1600×1200 | 30 | 32,6 s | 2.165 | 24 | passeio com zoom no cursor |
| "What should an agentic platform interface UI look like?..." | 1600×1200 | 60 | 8,0 s | 18.492 | 277 | clique entre telas (repostagem do "hospital governance") |

- **Nenhum vídeo de produto tem áudio** (sem faixa de som).
- **Formato:** 4:3 em 8 dos 10 (1600×1200, 1200×900, 2880×2160, 1440×1210 fica perto). Os outros: 1600×1300 (≈5:4, os dois de iPhone) e 1080×1350 (4:5, o cartão em loop). Nenhum 9:16 e nenhum 16:9.
- **Duração:** mediana de 8 s. Os curtos (2,5 a 8 s) são os que mais rendem.
- O vídeo de 18.492 views é o mesmo conteúdo do de 90.913, reexportado (md5 diferente, mesmas curvas de diferença quadro a quadro): o vídeo campeão volta 11 dias depois, com legenda nova.

Desempenho (13 peças com vídeo, contando o GIF e a repostagem): views medianas 1.757, salvos 15; índice relativo à semana 1,03 para views e **0,57 para salvos** **[MEDIDO]** (ver `08-conteudo-e-crescimento/legendas.md` para o método). O vídeo alcança como imagem, mas salva menos: quem guarda referência guarda imagem.

## Os seis tipos de vídeo

### 1. Clique entre telas (o mais forte)

![clique entre telas](../galeria/05-apresentacao/video-clique-entre-telas-orchestrateiq.jpg)

*Quadros a 0,5 s, 1,6 s, 2,6 s e 4,6 s de "Ai Agent for hospital governance." (90.913 views).*

- **Enquadramento fixo:** a tela inteira do produto num cartão de raio grande, sobre fundo cinza-azulado em degradê vertical muito leve (topo `#F2F3F6`, base `#E6E7EC`) **[MEDIDO]** na amostra de pixel do quadro. Câmera não se move.
- **Ação:** o cursor do sistema clica numa aba do topo ("Traces"), a tela troca por fusão, o cursor clica numa linha, abre o detalhe, clica de novo, abre o próximo nível. São **5 telas em 8 segundos**.
- **Ritmo [MEDIDO]:** transições de ~0,5 s (dissolve), telas paradas de 1,3 a 2 s. Linha do tempo das diferenças: `oo...ooo.  .o........  ooooo.  ooooo.` (o = mudança, espaço = parado).
- **Por que funciona [INFERIDO]:** mostra que o produto é navegável (não é um shot solto) e cabe numa única volta do loop do feed, que repete o vídeo sem som.

### 2. Passeio com zoom no cursor

![zoom no cursor](../galeria/05-apresentacao/video-zoom-no-cursor-fixtrack.jpg)

*Quadros a 0,3 s, 1,9 s, 3,5 s e 5,8 s de "I turn shitty AI design into this grade interface." (11.704 views, 171 salvos).*

- Começa com a tela inteira enquadrada (cartão com margem e sombra suave), **aproxima a câmera até onde o cursor vai clicar**, mostra o clique em tamanho grande, volta ao quadro inteiro e passa para a próxima tela. É o comportamento de gravadores de tela com zoom automático **[INFERIDO]** (zoom que segue o cursor, com curva suave).
- **Moldura:** fundo desfocado em degradê creme e verde-sálvia (cantos amostrados `#F2ECE5`, `#DEE6DC`, `#CDDED4`) **[MEDIDO]**; no topo, duas pílulas brancas de cada lado: à esquerda o nome do produto ("FixTrack", "Property maintenance") e à direita a categoria ("SaaS", "Product Design") **[OBSERVADO]**.
- **Ritmo [MEDIDO]:** o movimento de câmera ocupa quase todo o vídeo; cada aproximação ou afastamento dura 0,7 a 1,8 s, com pausas de 0,3 a 0,5 s. Cerca de um movimento a cada 2 s em 24 s.
- O mesmo desenho aparece em "A powerhouse for the marketing team." (32,6 s, painel escuro sobre fundo lilás desfocado).

### 3. Montagem progressiva do painel

![montagem progressiva](../galeria/05-apresentacao/video-montagem-progressiva-orchestrateiq.jpg)

*"AI agent monitoring.." (5.219 views, 114 salvos, 2,18% de salvos por view, a maior taxa entre os vídeos).*

A câmera começa perto do canto de cima à esquerda, com a interface vazia, e afasta enquanto os blocos entram um depois do outro (cabeçalho, título, a grade de agentes, as barras de estado, os cartões de baixo). Termina na tela inteira. É a animação "o painel se constrói na sua frente". Movimento lento: 61% dos quadros quase parados **[MEDIDO]**.

### 4. iPhone flutuante sobre degradê

![iPhone flutuante](../galeria/05-apresentacao/video-iphone-flutuante-mongi.jpg)

*"Delivery riding App design!" (1.502 views).*

Um iPhone de frente, sem sombra dura, centrado num fundo de degradê pastel desfocado (verde-limão, rosa e lilás), com a moldura aparecendo vazia no primeiro segundo e a tela acendendo. Depois a câmera aproxima e afasta do telefone, a tela rola e troca por deslize. Cortes secos em alguns pontos (15 picos de diferença em 21 s) **[MEDIDO]**. O de saúde mental ("Mental health mobile app") usa degradê rosa e lilás e troca de tela por desfoque. Rendem pouco (1.400 a 1.500 views, índice abaixo de 1).

### 5. Cartão em loop (4:5)

![cartão em loop](../galeria/05-apresentacao/video-cartao-em-loop-4x5.jpg)

*"Cool cards in motion!" (2.919 views), 1080×1350.*

Um único componente (um cartão de KPI com barras hachuradas) no centro de um fundo branco puro (`#FFFFFF`), ocupando ~78% da largura **[MEDIDO]**. O cartão troca de cor (cinza, coral, verde, limão, laranja), o número conta, as barras crescem, e a sequência se repete a cada 7,5 s. É o único vídeo vertical da amostra e o formato "componente sozinho" da imagem estática levado ao movimento.

### 6. Micro-interação curta

"Bento card Animation", "👀", "IQram – Healthcare SaaS Dashboard": 2,5 a 5 s, em 2880×2160 a 60 fps, mostrando um hover, um brilho que passa pelo cartão, um modal que abre. Poucas views (298 a 575): sem alcance já feito, o vídeo curto de detalhe não carrega a peça.

### Contraste: o vídeo genérico

- **Mosaico diagonal** ("How is it?", 5 s): as seções de um site em cartões, numa grade inclinada que rola sem parar (a diferença entre quadros é alta em 100% do vídeo). É o "showcase de site" típico das plataformas de portfólio. 643 views.

  ![mosaico diagonal](../galeria/05-apresentacao/video-mosaico-diagonal-site.jpg)

- **"This is how product future website looks like"** (214.695 views): repostagem de terceiro, com cortes rápidos; o alcance é do vídeo alheio e não ensina o método.

## Tabela de decisão

| quero mostrar | tipo | duração | formato | fundo |
|---|---|---|---|---|
| que o produto tem fluxo | clique entre telas | 6 a 10 s | 4:3, 1600×1200, 60 fps | cinza claro liso ou degradê quase imperceptível |
| um fluxo com detalhe | passeio com zoom no cursor | 15 a 30 s | 4:3, 1200×900 ou 1600×1200 | degradê desfocado de duas cores da marca do produto, pílulas de nome e categoria no topo |
| a riqueza de um painel | montagem progressiva | ~8 s | 4:3 | cinza claro |
| um componente | cartão em loop | loop de 7 a 8 s | 4:5, 1080×1350 | branco |
| app mobile | iPhone flutuante | 15 a 20 s | ≈5:4, 1600×1300 | degradê pastel |

## Como reproduzir

1. **Gravação:** protótipo no Figma (ou a tela real) gravado com um gravador que faça zoom automático no clique e cursor suavizado (ou o zoom feito à mão num editor de vídeo) **[INFERIDO]**; sem áudio.
2. **Exportar** em 1600×1200, 30 ou 60 fps, H.264. Não usar vertical 9:16 para produto de desktop.
3. **Fundo:** para o clique entre telas, cinza `#EEEFF2` a `#E6E7EC` com o cartão da tela ocupando ~76% da largura e margem de ~12% dos lados. Para o passeio com zoom, fundo desfocado com as cores do produto e duas pílulas no topo (nome à esquerda, categoria à direita).
4. **Ritmo:** tela parada 1,5 a 2 s, transição de 0,4 a 0,6 s (dissolve) ou zoom de 0,8 a 1,5 s com curva suave de entrada e saída. Uma ação do cursor por tela.
5. **Duração:** 8 s cabe o essencial (5 telas). Os dois vídeos de 8 s de clique entre telas somam 109 mil views; os passeios de 24 e 32 s rendem de 2 mil a 12 mil. A amostra é pequena (13 vídeos), então trate como ponto de partida, não como regra.
6. **Reaproveitar:** o vídeo que funcionou volta dias depois, com outra legenda ("What should an agentic platform interface UI look like? Look at this one...").

## Numa amostra mais recente: 21 vídeos de produto **[MEDIDO]**

25 peças de vídeo em dez dias, **21 vídeos diferentes** (4 saíram duas vezes com outra legenda).
O MP4 não acompanha a skill: de cada vídeo ficam a miniatura e três quadros (15%, 50% e 85% da duração),
lidos direto do player, no tamanho nativo do vídeo. Quando o vídeo saiu duas vezes, a coluna de views
traz as duas peças.

| vídeo | tamanho | duração | peças (views / salvos) | o que mostra |
|---|---|---:|---|---|
| `video-telas-com-cursor-fixtrack` | 1600×1200 | 16 s | 11.524 / 251; 28.907 / 596 | Vídeo do FixTrack web (1600×1200) sobre fundo bege, as telas trocando pelo clique do cursor |
| `video-telas-bolton` | 1600×1200 | 24 s | 17.747 / 357 | Vídeo do Bolton (1600×1200; "redesenho de produto SaaS"), telas trocando com o cursor |
| `video-faixa-de-celulares-permitly` | 1600×1200 | 21,5 s | 3.324 / 57; 3.300 / 70 | Vídeo do app iOS do Permitly (1600×1200; a legenda fala em app de energia solar com muito texto), na esteira de três celulares sobre degradê cinza |
| `video-telas-margin` | 1600×1200 | 23,1 s | 78.239 / 2.134 | Vídeo do Margin (1600×1200; a legenda o chama de "design system editorial para software de finanças"), telas trocando com o cursor |
| `video-faixa-de-celulares-priorauth` | 1600×1200 | 21,4 s | 7.194 / 141; 1.591 / 19 | Vídeo do app do PriorAuth (1600×1200), esteira de três celulares sobre degradê cinza |
| `video-telas-escuro-agenttrail` | 1600×1200 | 23,5 s | 3.348 / 34 | Vídeo do AgentTrail escuro (1600×1200), telas trocando com o cursor |
| `video-clique-do-mapa-ao-trace-orchestrateiq` | 1600×1200 | 8 s | 2.888 / 44; 12.294 / 228 | Vídeo do OrchestrateIQ (1600×1200) que navega com o cursor da visão geral até o detalhe do handoff |
| `video-telas-cliniq` | 1600×1200 | 12,6 s | 5.754 / 96 | Vídeo do Cliniq (1600×1200), telas trocando com o cursor |
| `video-redesenho-assistente-reembolso` | 1600×1200 | 24,1 s | 5.951 / 93 | Vídeo do redesenho do "Refund Assistant" (1600×1200; a legenda fala em produto "vibe-coded" refeito) |
| `video-telas-com-cursor-clawback` | 1600×1200 | 23,8 s | 22.215 / 407 | Vídeo do Clawback web (1600×1200) sobre bege, telas trocando pelo clique |
| `video-telas-escuro-adstudio` | 1600×1200 | 23,8 s | 10.793 / 162 | Vídeo do AdStudio AI web escuro (1600×1200), telas trocando com o cursor |
| `video-direcao-recusada-permitly` | 1600×1200 | 23,3 s | 116.856 / 2.355 | Vídeo da direção que o cliente recusou no redesenho do Permitly (1600×1200; o cliente chegou com um produto "vibe-coded" e o redesenho explorou duas direções) |
| `video-telas-callbacks` | 1600×1200 | 17,7 s | 20.327 / 500 | Vídeo do produto de retornos de serviço "Callbacks" (1600×1200): telas inteiras que trocam com o cursor, sobre cinza |
| `video-faixa-de-celulares-escuro-agentpay` | 1600×1200 | 21,4 s | 2.732 / 17 | O mesmo vídeo-esteira do app do AgentPay em versão escura (1600×1200): três celulares sobre fundo preto, logo no canto e "MOBILE APP" |
| `video-lancamento-titulo-cinetico-orchestrateiq` | 1600×1200 | 15,1 s | 1.241 / 15 | Vídeo de lançamento do OrchestrateIQ (1600×1200; o primeiro quadro saiu em 960×720, com o player ainda na qualidade baixa) sobre fundo branco com degradê azul-lilás: o logo, a palavra do recurso em tipografia grande que entra letra a letra, prints flutuando em volta e o zoom no print do recurso |
| `video-faixa-de-celulares-agentpay` | 1600×1200 | 21,4 s | 2.521 / 19 | Vídeo do app do AgentPay (1600×1200; a legenda fala em gestão de assinaturas com agentes), mesma esteira de três celulares com logo e "MOBILE APP" |
| `video-faixa-de-celulares-medspa` | 1000×750 | 21,4 s | 3.610 / 38 | Vídeo do app do paciente do Medspa (1000×750), na mesma esteira de três celulares sobre degradê cinza com logo e "MOBILE APP" |
| `video-faixa-de-celulares-collectai` | 1600×1200 | 12,8 s | 2.355 / 17 | Vídeo do app iOS do CollectAI (1600×1200): três celulares lado a lado sobre degradê cinza que deslizam para a esquerda como uma esteira, com o logo do produto no canto inferior esquerdo e "MOBILE APP" no direito |
| `video-microinteracoes-fixtrack` | 1600×1200 | 14 s | 1.171 / 8 | Vídeo de microinterações do FixTrack (1600×1200) sobre fundo bege liso, um componente por vez no centro |
| `video-cartao-custo-por-aresta` | 1080×1350 | 22 s | 2.787 / 49 | Vídeo vertical 4:5 (1080×1350) de um cartão isolado que se transforma no lugar |
| `video-fluxo-pedido-ao-prestador-fixtrack` | 1200×900 | 24 s | 19.974 / 213 | Vídeo do FixTrack (1200×900, tela inteira sobre fundo verde-claro desfocado, com selos SaaS e Product Design no topo) que percorre o produto clicando |

### Três formatos

1. **Esteira de três celulares** (CollectAI, Medspa, AgentPay claro e escuro, Permitly, PriorAuth): três
   telas de celular lado a lado sobre degradê cinza (ou preto) que deslizam para a esquerda como uma
   esteira, sem cortes, com o logo do produto no canto inferior esquerdo e "MOBILE APP" em mono no direito.
   O último quadro repete o primeiro: o vídeo fecha em laço. Rendimento baixo (de 1.591 a 7.194 views):
   serve para mostrar o app inteiro, não para alcance.
2. **Telas com cursor sobre fundo liso** (FixTrack, Clawback, Margin, Bolton, Callbacks, Cliniq, AgentTrail,
   AdStudio, o redesenho do "Refund Assistant", a direção recusada do Permitly): a tela inteira sobre bege ou
   cinza, o cursor clica e a página troca. É o formato dos dois vídeos mais vistos da janela (116.856 e
   78.239 views): é o "clique entre telas" da ficha técnica, o padrão para apresentar produto web.
3. **Lançamento com título cinético** (OrchestrateIQ, 1600×1200): o logo, a palavra do recurso entrando
   letra a letra em tipografia grande, prints flutuando e um zoom com desfoque de movimento até o print.
   Mais: o **cartão que se transforma** (custo por aresta, 4:5, 22 s) e as **microinterações sobre bege**
   (FixTrack: botão, cartão de nota de voz, seletor de período, um componente por vez no centro).

### Os quadros

- **video-telas-com-cursor-fixtrack**: ![capa](../galeria/05-apresentacao/video-telas-com-cursor-fixtrack-capa.jpg) ![quadro-1](../galeria/05-apresentacao/video-telas-com-cursor-fixtrack-quadro-1.jpg) ![quadro-2](../galeria/05-apresentacao/video-telas-com-cursor-fixtrack-quadro-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-telas-com-cursor-fixtrack-quadro-3.jpg)
- **video-telas-bolton**: ![capa](../galeria/05-apresentacao/video-telas-bolton-capa.jpg) ![quadro-1](../galeria/05-apresentacao/video-telas-bolton-quadro-1.jpg) ![quadro-2](../galeria/05-apresentacao/video-telas-bolton-quadro-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-telas-bolton-quadro-3.jpg)
- **video-faixa-de-celulares-permitly**: ![capa](../galeria/05-apresentacao/video-faixa-de-celulares-permitly-capa.jpg) ![quadro-1](../galeria/05-apresentacao/video-faixa-de-celulares-permitly-quadro-1.jpg) ![quadro-2](../galeria/05-apresentacao/video-faixa-de-celulares-permitly-quadro-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-faixa-de-celulares-permitly-quadro-3.jpg)
- **video-telas-margin**: ![capa](../galeria/05-apresentacao/video-telas-margin-capa.jpg) ![quadro-1](../galeria/05-apresentacao/video-telas-margin-quadro-1.jpg) ![quadro-2](../galeria/05-apresentacao/video-telas-margin-quadro-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-telas-margin-quadro-3.jpg)
- **video-faixa-de-celulares-priorauth**: ![capa](../galeria/05-apresentacao/video-faixa-de-celulares-priorauth-capa.jpg) ![quadro-1](../galeria/05-apresentacao/video-faixa-de-celulares-priorauth-quadro-1.jpg) ![quadro-2](../galeria/05-apresentacao/video-faixa-de-celulares-priorauth-quadro-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-faixa-de-celulares-priorauth-quadro-3.jpg)
- **video-telas-escuro-agenttrail**: ![capa](../galeria/05-apresentacao/video-telas-escuro-agenttrail-capa.jpg) ![quadro-1](../galeria/05-apresentacao/video-telas-escuro-agenttrail-quadro-1.jpg) ![quadro-2](../galeria/05-apresentacao/video-telas-escuro-agenttrail-quadro-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-telas-escuro-agenttrail-quadro-3.jpg)
- **video-clique-do-mapa-ao-trace-orchestrateiq**: ![capa](../galeria/05-apresentacao/video-clique-do-mapa-ao-trace-orchestrateiq-capa.jpg) ![quadro-1](../galeria/05-apresentacao/video-clique-do-mapa-ao-trace-orchestrateiq-quadro-1.jpg) ![quadro-2](../galeria/05-apresentacao/video-clique-do-mapa-ao-trace-orchestrateiq-quadro-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-clique-do-mapa-ao-trace-orchestrateiq-quadro-3.jpg)
- **video-telas-cliniq**: ![capa](../galeria/05-apresentacao/video-telas-cliniq-capa.jpg) ![quadro-1](../galeria/05-apresentacao/video-telas-cliniq-quadro-1.jpg) ![quadro-2](../galeria/05-apresentacao/video-telas-cliniq-quadro-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-telas-cliniq-quadro-3.jpg)
- **video-redesenho-assistente-reembolso**: ![capa](../galeria/05-apresentacao/video-redesenho-assistente-reembolso-capa.jpg) ![quadro-1](../galeria/05-apresentacao/video-redesenho-assistente-reembolso-quadro-1.jpg) ![quadro-2](../galeria/05-apresentacao/video-redesenho-assistente-reembolso-quadro-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-redesenho-assistente-reembolso-quadro-3.jpg)
- **video-telas-com-cursor-clawback**: ![capa](../galeria/05-apresentacao/video-telas-com-cursor-clawback-capa.jpg) ![quadro-1](../galeria/05-apresentacao/video-telas-com-cursor-clawback-quadro-1.jpg) ![quadro-2](../galeria/05-apresentacao/video-telas-com-cursor-clawback-quadro-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-telas-com-cursor-clawback-quadro-3.jpg)
- **video-telas-escuro-adstudio**: ![capa](../galeria/05-apresentacao/video-telas-escuro-adstudio-capa.jpg) ![quadro-1](../galeria/05-apresentacao/video-telas-escuro-adstudio-quadro-1.jpg) ![quadro-2](../galeria/05-apresentacao/video-telas-escuro-adstudio-quadro-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-telas-escuro-adstudio-quadro-3.jpg)
- **video-direcao-recusada-permitly**: ![capa](../galeria/05-apresentacao/video-direcao-recusada-permitly-capa.jpg) ![quadro-1](../galeria/05-apresentacao/video-direcao-recusada-permitly-quadro-1.jpg) ![quadro-2](../galeria/05-apresentacao/video-direcao-recusada-permitly-quadro-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-direcao-recusada-permitly-quadro-3.jpg)
- **video-telas-callbacks**: ![capa](../galeria/05-apresentacao/video-telas-callbacks-capa.jpg) ![quadro-1](../galeria/05-apresentacao/video-telas-callbacks-quadro-1.jpg) ![quadro-2](../galeria/05-apresentacao/video-telas-callbacks-quadro-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-telas-callbacks-quadro-3.jpg)
- **video-faixa-de-celulares-escuro-agentpay**: ![capa](../galeria/05-apresentacao/video-faixa-de-celulares-escuro-agentpay-capa.jpg) ![quadro-1](../galeria/05-apresentacao/video-faixa-de-celulares-escuro-agentpay-quadro-1.jpg) ![quadro-2](../galeria/05-apresentacao/video-faixa-de-celulares-escuro-agentpay-quadro-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-faixa-de-celulares-escuro-agentpay-quadro-3.jpg)
- **video-lancamento-titulo-cinetico-orchestrateiq**: ![capa](../galeria/05-apresentacao/video-lancamento-titulo-cinetico-orchestrateiq-capa.jpg) ![quadro-1](../galeria/05-apresentacao/video-lancamento-titulo-cinetico-orchestrateiq-quadro-1.jpg) ![quadro-2](../galeria/05-apresentacao/video-lancamento-titulo-cinetico-orchestrateiq-quadro-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-lancamento-titulo-cinetico-orchestrateiq-quadro-3.jpg)
- **video-faixa-de-celulares-agentpay**: ![capa](../galeria/05-apresentacao/video-faixa-de-celulares-agentpay-capa.jpg) ![quadro-1](../galeria/05-apresentacao/video-faixa-de-celulares-agentpay-quadro-1.jpg) ![quadro-2](../galeria/05-apresentacao/video-faixa-de-celulares-agentpay-quadro-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-faixa-de-celulares-agentpay-quadro-3.jpg)
- **video-faixa-de-celulares-medspa**: ![capa](../galeria/05-apresentacao/video-faixa-de-celulares-medspa-capa.jpg) ![quadro-1](../galeria/05-apresentacao/video-faixa-de-celulares-medspa-quadro-1.jpg) ![quadro-2](../galeria/05-apresentacao/video-faixa-de-celulares-medspa-quadro-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-faixa-de-celulares-medspa-quadro-3.jpg)
- **video-faixa-de-celulares-collectai**: ![capa](../galeria/05-apresentacao/video-faixa-de-celulares-collectai-capa.jpg) ![quadro-1](../galeria/05-apresentacao/video-faixa-de-celulares-collectai-quadro-1.jpg) ![quadro-2](../galeria/05-apresentacao/video-faixa-de-celulares-collectai-quadro-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-faixa-de-celulares-collectai-quadro-3.jpg)
- **video-microinteracoes-fixtrack**: ![capa](../galeria/05-apresentacao/video-microinteracoes-fixtrack-capa.jpg) ![quadro-1](../galeria/05-apresentacao/video-microinteracoes-fixtrack-quadro-1.jpg) ![quadro-2](../galeria/05-apresentacao/video-microinteracoes-fixtrack-quadro-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-microinteracoes-fixtrack-quadro-3.jpg)
- **video-cartao-custo-por-aresta**: ![capa](../galeria/05-apresentacao/video-cartao-custo-por-aresta-capa.jpg) ![quadro-1](../galeria/05-apresentacao/video-cartao-custo-por-aresta-quadro-1.jpg) ![quadro-2](../galeria/05-apresentacao/video-cartao-custo-por-aresta-quadro-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-cartao-custo-por-aresta-quadro-3.jpg)
- **video-fluxo-pedido-ao-prestador-fixtrack**: ![capa](../galeria/05-apresentacao/video-fluxo-pedido-ao-prestador-fixtrack-capa.jpg) ![quadro-1](../galeria/05-apresentacao/video-fluxo-pedido-ao-prestador-fixtrack-quadro-1.jpg) ![quadro-2](../galeria/05-apresentacao/video-fluxo-pedido-ao-prestador-fixtrack-quadro-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-fluxo-pedido-ao-prestador-fixtrack-quadro-3.jpg)
