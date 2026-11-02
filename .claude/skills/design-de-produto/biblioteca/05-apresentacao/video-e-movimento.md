# Vídeo e movimento: como animar o trabalho

## O que é

24 vídeos de peças publicadas (um deles é GIF animado convertido pela plataforma). Quatro são repostagens de terceiros, então sobram **20 vídeos próprios**, **13 deles da fase de produto e da transição** (um é repostagem do mesmo vídeo). Cada vídeo foi medido com `ffprobe` (tamanho, quadros por segundo, duração, áudio) e decomposto em quadros a 10 por segundo; a diferença média de pixel entre quadros vizinhos mostra quando a imagem está parada, quando a câmera anda e quando há corte. Folhas de quadros (1 quadro a cada 1,5 s) serviram para ver o conteúdo.

## Ficha técnica dos vídeos **[MEDIDO]**

Em ordem de publicação.

| peça | tamanho | fps | duração | tipo |
| --- | --- | ---: | ---: | --- |
| só um emoji | 2880×2160 | 60 | 4,0 s | micro-interação |
| animação de cartão bento com a pergunta do que acharam | 2880×2160 | 60 | 5,1 s | micro-interação com brilho |
| (sem legenda) | 800×600 | 10 | 2,5 s | GIF |
| nome do produto e a categoria (painel SaaS de saúde) | 2880×2160 | 60 | 2,5 s | abrir modal |
| monitoramento de agentes de IA | 1440×1210 | 30 | 8,0 s | montagem progressiva |
| **agente de IA para governança hospitalar** | 1600×1200 | 60 | 8,0 s | clique entre telas |
| app de saúde mental | 1600×1300 | 30 | 15,6 s | iPhone flutuante |
| design de app de entregas | 1600×1300 | 30 | 21,0 s | iPhone flutuante |
| saber o que os agentes de IA conseguem fazer | 1600×1200 | 30 | 16,0 s | demonstração com cursor |
| o design ruim de IA que vira interface de primeira | 1200×900 | 30 | 24,0 s | passeio com zoom no cursor |
| cartões em movimento | 1080×1350 | 30 | 15,0 s | cartão em loop |
| uma potência para o time de marketing | 1600×1200 | 30 | 32,6 s | passeio com zoom no cursor |
| como deve ser a interface de uma plataforma de agentes | 1600×1200 | 60 | 8,0 s | clique entre telas (repostagem do vídeo de governança hospitalar) |

- **Nenhum vídeo de produto tem áudio** (sem faixa de som).
- **Formato:** 4:3 em 8 dos 10 (1600×1200, 1200×900, 2880×2160, 1440×1210 fica perto). Os outros: 1600×1300 (≈5:4, os dois de iPhone) e 1080×1350 (4:5, o cartão em loop). Nenhum 9:16 e nenhum 16:9.
- **Duração:** mediana de 8 s. Os curtos (2,5 a 8 s) são os que mais rendem.
- O último da lista é o mesmo conteúdo do vídeo de governança hospitalar, reexportado (md5 diferente, mesmas curvas de diferença quadro a quadro): o vídeo que funcionou volta dias depois, com legenda nova.

O vídeo alcança como imagem, mas se guarda menos como referência: quem guarda referência guarda imagem. **[OBSERVADO]**

## Os seis tipos de vídeo

### 1. Clique entre telas (o mais forte)

![clique entre telas](../galeria/05-apresentacao/video-clique-entre-telas.jpg)

*Quadros a 0,5 s, 1,6 s, 2,6 s e 4,6 s do vídeo de governança hospitalar.*

- **Enquadramento fixo:** a tela inteira do produto num cartão de raio grande, sobre fundo cinza-azulado em degradê vertical muito leve (topo `#F2F3F6`, base `#E6E7EC`) **[MEDIDO]** na amostra de pixel do quadro. Câmera não se move.
- **Ação:** o cursor do sistema clica numa aba do topo ("Traces"), a tela troca por fusão, o cursor clica numa linha, abre o detalhe, clica de novo, abre o próximo nível. São **5 telas em 8 segundos**.
- **Ritmo [MEDIDO]:** transições de ~0,5 s (dissolve), telas paradas de 1,3 a 2 s. Linha do tempo das diferenças: `oo...ooo.  .o........  ooooo.  ooooo.` (o = mudança, espaço = parado).
- **Por que funciona [INFERIDO]:** mostra que o produto é navegável (não é um shot solto) e cabe numa única volta do loop do feed, que repete o vídeo sem som.

### 2. Passeio com zoom no cursor

![zoom no cursor](../galeria/05-apresentacao/video-zoom-no-cursor.jpg)

*Quadros a 0,3 s, 1,9 s, 3,5 s e 5,8 s do vídeo do design ruim de IA que vira interface de primeira.*

- Começa com a tela inteira enquadrada (cartão com margem e sombra suave), **aproxima a câmera até onde o cursor vai clicar**, mostra o clique em tamanho grande, volta ao quadro inteiro e passa para a próxima tela. É o comportamento de gravadores de tela com zoom automático **[INFERIDO]** (zoom que segue o cursor, com curva suave).
- **Moldura:** fundo desfocado em degradê creme e verde-sálvia (cantos amostrados `#F2ECE5`, `#DEE6DC`, `#CDDED4`) **[MEDIDO]**; no topo, duas pílulas brancas de cada lado: à esquerda o nome do produto (app de manutenção predial, "Property maintenance") e à direita a categoria ("SaaS", "Product Design") **[OBSERVADO]**.
- **Ritmo [MEDIDO]:** o movimento de câmera ocupa quase todo o vídeo; cada aproximação ou afastamento dura 0,7 a 1,8 s, com pausas de 0,3 a 0,5 s. Cerca de um movimento a cada 2 s em 24 s.
- O mesmo desenho aparece no vídeo da potência para o time de marketing (32,6 s, painel escuro sobre fundo lilás desfocado).

### 3. Montagem progressiva do painel

![montagem progressiva](../galeria/05-apresentacao/video-montagem-progressiva.jpg)

*O vídeo do monitoramento de agentes de IA (a maior taxa entre os vídeos).*

A câmera começa perto do canto de cima à esquerda, com a interface vazia, e afasta enquanto os blocos entram um depois do outro (cabeçalho, título, a grade de agentes, as barras de estado, os cartões de baixo). Termina na tela inteira. É a animação "o painel se constrói na sua frente". Movimento lento: 61% dos quadros quase parados **[MEDIDO]**.

### 4. iPhone flutuante sobre degradê

![iPhone flutuante](../galeria/05-apresentacao/video-iphone-flutuante.jpg)

*O vídeo do app de entregas.*

Um iPhone de frente, sem sombra dura, centrado num fundo de degradê pastel desfocado (verde-limão, rosa e lilás), com a moldura aparecendo vazia no primeiro segundo e a tela acendendo. Depois a câmera aproxima e afasta do telefone, a tela rola e troca por deslize. Cortes secos em alguns pontos (15 picos de diferença em 21 s) **[MEDIDO]**. O de saúde mental usa degradê rosa e lilás e troca de tela por desfoque. Rendem pouco.

### 5. Cartão em loop (4:5)

![cartão em loop](../galeria/05-apresentacao/video-cartao-em-loop-4x5.jpg)

*O vídeo dos cartões em movimento, 1080×1350.*

Um único componente (um cartão de KPI com barras hachuradas) no centro de um fundo branco puro (`#FFFFFF`), ocupando ~78% da largura **[MEDIDO]**. O cartão troca de cor (cinza, coral, verde, limão, laranja), o número conta, as barras crescem, e a sequência se repete a cada 7,5 s. É o único vídeo vertical da amostra e o formato "componente sozinho" da imagem estática levado ao movimento.

### 6. Micro-interação curta

"Bento card Animation", "👀", "[produto] – Healthcare SaaS Dashboard": 2,5 a 5 s, em 2880×2160 a 60 fps, mostrando um hover, um brilho que passa pelo cartão, um modal que abre. Rende pouco: sem alcance já feito, o vídeo curto de detalhe não carrega a peça.

### Contraste: o vídeo genérico

- **Mosaico diagonal** (legenda que só pergunta o que acharam, 5 s): as seções de um site em cartões, numa grade inclinada que rola sem parar (a diferença entre quadros é alta em 100% do vídeo). É o "showcase de site" típico das plataformas de portfólio.

  ![mosaico diagonal](../galeria/05-apresentacao/video-mosaico-diagonal-site.jpg)

- **O vídeo do site do futuro**: repostagem de terceiro, com cortes rápidos; o alcance é do vídeo alheio e não ensina o método.

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
5. **Duração:** 8 s cabe o essencial (5 telas). Os dois vídeos de 8 s de clique entre telas funcionam muito melhor que os passeios de 24 e 32 s. A amostra é pequena (13 vídeos), então trate como ponto de partida, não como regra.
6. **Reaproveitar:** o vídeo que funcionou volta dias depois, com outra legenda (a pergunta de como deve ser a interface de uma plataforma de agentes, com a tela como resposta).

## Numa amostra mais recente: 21 vídeos de produto **[MEDIDO]**

25 peças de vídeo em dez dias, **21 vídeos diferentes** (4 saíram duas vezes com outra legenda).
O MP4 não acompanha a skill: de cada vídeo ficam a miniatura e três quadros (15%, 50% e 85% da duração),
lidos direto do player, no tamanho nativo do vídeo. 
| vídeo | tamanho | duração | o que mostra |
| --- | --- | ---: | --- |
| `video-telas-com-cursor-manutencao-predial` | 1600×1200 | 16 s | Vídeo do app de manutenção predial web (1600×1200) sobre fundo bege, as telas trocando pelo clique do cursor |
| `video-telas-integracao-de-empresas` | 1600×1200 | 24 s | Vídeo do painel de integração de empresas (1600×1200; "redesenho de produto SaaS"), telas trocando com o cursor |
| `video-faixa-de-celulares-licenciamento-solar` | 1600×1200 | 21,5 s | Vídeo do app iOS do painel de licenciamento solar (1600×1200; a legenda fala em app de energia solar com muito texto), na esteira de três celulares sobre degradê cinza |
| `video-telas-margem-de-servicos` | 1600×1200 | 23,1 s | Vídeo do painel de margem de serviços (1600×1200; a legenda o chama de "design system editorial para software de finanças"), telas trocando com o cursor |
| `video-faixa-de-celulares-autorizacao-previa` | 1600×1200 | 21,4 s | Vídeo do app do app de autorização prévia (1600×1200), esteira de três celulares sobre degradê cinza |
| `video-telas-escuro-auditoria-de-agentes` | 1600×1200 | 23,5 s | Vídeo do painel de auditoria de agentes escuro (1600×1200), telas trocando com o cursor |
| `video-clique-do-mapa-ao-trace-agentes-hospitalares` | 1600×1200 | 8 s | Vídeo do painel de agentes hospitalares (1600×1200) que navega com o cursor da visão geral até o detalhe do handoff |
| `video-telas-operacao-de-clinica` | 1600×1200 | 12,6 s | Vídeo do painel de operação de clínica (1600×1200), telas trocando com o cursor |
| `video-redesenho-assistente-reembolso` | 1600×1200 | 24,1 s | Vídeo do redesenho do assistente de reembolso (1600×1200; a legenda fala em produto feito com IA refeito) |
| `video-telas-com-cursor-recuperacao-de-garantia` | 1600×1200 | 23,8 s | Vídeo do app de recuperação de garantia web (1600×1200) sobre bege, telas trocando pelo clique |
| `video-telas-escuro-estudio-de-anuncios` | 1600×1200 | 23,8 s | Vídeo do estúdio de anúncios web escuro (1600×1200), telas trocando com o cursor |
| `video-direcao-recusada-licenciamento-solar` | 1600×1200 | 23,3 s | Vídeo da direção que o cliente recusou no redesenho do painel de licenciamento solar (1600×1200; o cliente chegou com um produto feito com IA e o redesenho explorou duas direções) |
| `video-telas` | 1600×1200 | 17,7 s | Vídeo do produto de retornos de serviço painel de retornos de serviço (1600×1200): telas inteiras que trocam com o cursor, sobre cinza |
| `video-faixa-de-celulares-escuro-pagamentos-de-agentes` | 1600×1200 | 21,4 s | O mesmo vídeo-esteira do app do painel de pagamentos de agentes em versão escura (1600×1200): três celulares sobre fundo preto, logo no canto e "MOBILE APP" |
| `video-lancamento-titulo-cinetico-agentes-hospitalares` | 1600×1200 | 15,1 s | Vídeo de lançamento do painel de agentes hospitalares (1600×1200; o primeiro quadro saiu em 960×720, com o player ainda na qualidade baixa) sobre fundo branco com degradê azul-lilás: o logo, a palavra do recurso em tipografia grande que entra letra a letra, prints flutuando em volta e o zoom no print do recurso |
| `video-faixa-de-celulares-pagamentos-de-agentes` | 1600×1200 | 21,4 s | Vídeo do app do painel de pagamentos de agentes (1600×1200; a legenda fala em gestão de assinaturas com agentes), mesma esteira de três celulares com logo e "MOBILE APP" |
| `video-faixa-de-celulares-[produto]` | 1000×750 | 21,4 s | Vídeo do app do paciente do app da clínica de estética (1000×750), na mesma esteira de três celulares sobre degradê cinza com logo e "MOBILE APP" |
| `video-faixa-de-celulares-contas-a-receber` | 1600×1200 | 12,8 s | Vídeo do app iOS do app de contas a receber (1600×1200): três celulares lado a lado sobre degradê cinza que deslizam para a esquerda como uma esteira, com o logo do produto no canto inferior esquerdo e "MOBILE APP" no direito |
| `video-microinteracoes-manutencao-predial` | 1600×1200 | 14 s | Vídeo de microinterações do app de manutenção predial (1600×1200) sobre fundo bege liso, um componente por vez no centro |
| `video-cartao-custo-por-aresta` | 1080×1350 | 22 s | Vídeo vertical 4:5 (1080×1350) de um cartão isolado que se transforma no lugar |
| `video-fluxo-pedido-ao-prestador-manutencao-predial` | 1200×900 | 24 s | Vídeo do app de manutenção predial (1200×900, tela inteira sobre fundo verde-claro desfocado, com selos SaaS e Product Design no topo) que percorre o produto clicando |

### Três formatos

1. **Esteira de três celulares** (app de contas a receber, app da clínica de estética, painel de pagamentos de agentes claro e escuro, painel de licenciamento solar, app de autorização prévia): três
   telas de celular lado a lado sobre degradê cinza (ou preto) que deslizam para a esquerda como uma
   esteira, sem cortes, com o logo do produto no canto inferior esquerdo e "MOBILE APP" em mono no direito.
   O último quadro repete o primeiro: o vídeo fecha em laço. Rendimento baixo:
   serve para mostrar o app inteiro, não para alcance.
2. **Telas com cursor sobre fundo liso** (app de manutenção predial, app de recuperação de garantia, painel de margem de serviços, painel de integração de empresas, painel de retornos de serviço, painel de operação de clínica, painel de auditoria de agentes,
   estúdio de anúncios, o redesenho do assistente de reembolso, a direção recusada do painel de licenciamento solar): a tela inteira sobre bege ou
   cinza, o cursor clica e a página troca. É o formato dos dois vídeos de referência da janela (a direção
   recusada do painel de licenciamento solar e o painel de margem de serviços): é o "clique entre telas" da ficha técnica, o padrão para apresentar produto web.
3. **Lançamento com título cinético** (painel de agentes hospitalares, 1600×1200): o logo, a palavra do recurso entrando
   letra a letra em tipografia grande, prints flutuando e um zoom com desfoque de movimento até o print.
   Mais: o **cartão que se transforma** (custo por aresta, 4:5, 22 s) e as **microinterações sobre bege**
   (app de manutenção predial: botão, cartão de nota de voz, seletor de período, um componente por vez no centro).

### Os quadros

- **video-telas-com-cursor-manutencao-predial**: ![capa](../galeria/05-apresentacao/video-telas-com-cursor-capa-2.jpg) ![quadro-1](../galeria/05-apresentacao/video-telas-com-cursor-quadro-1-2.jpg) ![quadro-2](../galeria/05-apresentacao/video-telas-com-cursor-quadro-2-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-telas-com-cursor-quadro-3-2.jpg)
- **video-telas-integracao-de-empresas**: ![capa](../galeria/05-apresentacao/video-telas-capa.jpg) ![quadro-1](../galeria/05-apresentacao/video-telas-quadro-1.jpg) ![quadro-2](../galeria/05-apresentacao/video-telas-quadro-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-telas-quadro-3.jpg)
- **video-faixa-de-celulares-licenciamento-solar**: ![capa](../galeria/05-apresentacao/video-faixa-de-celulares-capa-5.jpg) ![quadro-1](../galeria/05-apresentacao/video-faixa-de-celulares-quadro-1-5.jpg) ![quadro-2](../galeria/05-apresentacao/video-faixa-de-celulares-quadro-2-5.jpg) ![quadro-3](../galeria/05-apresentacao/video-faixa-de-celulares-quadro-3-5.jpg)
- **video-telas-margem-de-servicos**: ![capa](../galeria/05-apresentacao/video-telas-capa-4.jpg) ![quadro-1](../galeria/05-apresentacao/video-telas-quadro-1-4.jpg) ![quadro-2](../galeria/05-apresentacao/video-telas-quadro-2-4.jpg) ![quadro-3](../galeria/05-apresentacao/video-telas-quadro-3-4.jpg)
- **video-faixa-de-celulares-autorizacao-previa**: ![capa](../galeria/05-apresentacao/video-faixa-de-celulares-capa-6.jpg) ![quadro-1](../galeria/05-apresentacao/video-faixa-de-celulares-quadro-1-6.jpg) ![quadro-2](../galeria/05-apresentacao/video-faixa-de-celulares-quadro-2-6.jpg) ![quadro-3](../galeria/05-apresentacao/video-faixa-de-celulares-quadro-3-6.jpg)
- **video-telas-escuro-auditoria-de-agentes**: ![capa](../galeria/05-apresentacao/video-telas-escuro-capa-2.jpg) ![quadro-1](../galeria/05-apresentacao/video-telas-escuro-quadro-1-2.jpg) ![quadro-2](../galeria/05-apresentacao/video-telas-escuro-quadro-2-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-telas-escuro-quadro-3-2.jpg)
- **video-clique-do-mapa-ao-trace-agentes-hospitalares**: ![capa](../galeria/05-apresentacao/video-clique-do-mapa-ao-trace-capa.jpg) ![quadro-1](../galeria/05-apresentacao/video-clique-do-mapa-ao-trace-quadro-1.jpg) ![quadro-2](../galeria/05-apresentacao/video-clique-do-mapa-ao-trace-quadro-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-clique-do-mapa-ao-trace-quadro-3.jpg)
- **video-telas-operacao-de-clinica**: ![capa](../galeria/05-apresentacao/video-telas-capa-3.jpg) ![quadro-1](../galeria/05-apresentacao/video-telas-quadro-1-3.jpg) ![quadro-2](../galeria/05-apresentacao/video-telas-quadro-2-3.jpg) ![quadro-3](../galeria/05-apresentacao/video-telas-quadro-3-3.jpg)
- **video-redesenho-assistente-reembolso**: ![capa](../galeria/05-apresentacao/video-redesenho-assistente-reembolso-capa.jpg) ![quadro-1](../galeria/05-apresentacao/video-redesenho-assistente-reembolso-quadro-1.jpg) ![quadro-2](../galeria/05-apresentacao/video-redesenho-assistente-reembolso-quadro-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-redesenho-assistente-reembolso-quadro-3.jpg)
- **video-telas-com-cursor-recuperacao-de-garantia**: ![capa](../galeria/05-apresentacao/video-telas-com-cursor-capa.jpg) ![quadro-1](../galeria/05-apresentacao/video-telas-com-cursor-quadro-1.jpg) ![quadro-2](../galeria/05-apresentacao/video-telas-com-cursor-quadro-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-telas-com-cursor-quadro-3.jpg)
- **video-telas-escuro-estudio-de-anuncios**: ![capa](../galeria/05-apresentacao/video-telas-escuro-capa.jpg) ![quadro-1](../galeria/05-apresentacao/video-telas-escuro-quadro-1.jpg) ![quadro-2](../galeria/05-apresentacao/video-telas-escuro-quadro-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-telas-escuro-quadro-3.jpg)
- **video-direcao-recusada-licenciamento-solar**: ![capa](../galeria/05-apresentacao/video-direcao-recusada-capa.jpg) ![quadro-1](../galeria/05-apresentacao/video-direcao-recusada-quadro-1.jpg) ![quadro-2](../galeria/05-apresentacao/video-direcao-recusada-quadro-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-direcao-recusada-quadro-3.jpg)
- **video-telas**: ![capa](../galeria/05-apresentacao/video-telas-capa-2.jpg) ![quadro-1](../galeria/05-apresentacao/video-telas-quadro-1-2.jpg) ![quadro-2](../galeria/05-apresentacao/video-telas-quadro-2-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-telas-quadro-3-2.jpg)
- **video-faixa-de-celulares-escuro-pagamentos-de-agentes**: ![capa](../galeria/05-apresentacao/video-faixa-de-celulares-escuro-capa.jpg) ![quadro-1](../galeria/05-apresentacao/video-faixa-de-celulares-escuro-quadro-1.jpg) ![quadro-2](../galeria/05-apresentacao/video-faixa-de-celulares-escuro-quadro-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-faixa-de-celulares-escuro-quadro-3.jpg)
- **video-lancamento-titulo-cinetico-agentes-hospitalares**: ![capa](../galeria/05-apresentacao/video-lancamento-titulo-cinetico-capa.jpg) ![quadro-1](../galeria/05-apresentacao/video-lancamento-titulo-cinetico-quadro-1.jpg) ![quadro-2](../galeria/05-apresentacao/video-lancamento-titulo-cinetico-quadro-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-lancamento-titulo-cinetico-quadro-3.jpg)
- **video-faixa-de-celulares-pagamentos-de-agentes**: ![capa](../galeria/05-apresentacao/video-faixa-de-celulares-capa.jpg) ![quadro-1](../galeria/05-apresentacao/video-faixa-de-celulares-quadro-1.jpg) ![quadro-2](../galeria/05-apresentacao/video-faixa-de-celulares-quadro-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-faixa-de-celulares-quadro-3.jpg)
- **video-faixa-de-celulares-app da clínica de estética**: ![capa](../galeria/05-apresentacao/video-faixa-de-celulares-capa-3.jpg) ![quadro-1](../galeria/05-apresentacao/video-faixa-de-celulares-quadro-1-3.jpg) ![quadro-2](../galeria/05-apresentacao/video-faixa-de-celulares-quadro-2-3.jpg) ![quadro-3](../galeria/05-apresentacao/video-faixa-de-celulares-quadro-3-3.jpg)
- **video-faixa-de-celulares-contas-a-receber**: ![capa](../galeria/05-apresentacao/video-faixa-de-celulares-capa-2.jpg) ![quadro-1](../galeria/05-apresentacao/video-faixa-de-celulares-quadro-1-2.jpg) ![quadro-2](../galeria/05-apresentacao/video-faixa-de-celulares-quadro-2-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-faixa-de-celulares-quadro-3-2.jpg)
- **video-microinteracoes-manutencao-predial**: ![capa](../galeria/05-apresentacao/video-microinteracoes-capa.jpg) ![quadro-1](../galeria/05-apresentacao/video-microinteracoes-quadro-1.jpg) ![quadro-2](../galeria/05-apresentacao/video-microinteracoes-quadro-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-microinteracoes-quadro-3.jpg)
- **video-cartao-custo-por-aresta**: ![capa](../galeria/05-apresentacao/video-cartao-custo-por-aresta-capa.jpg) ![quadro-1](../galeria/05-apresentacao/video-cartao-custo-por-aresta-quadro-1.jpg) ![quadro-2](../galeria/05-apresentacao/video-cartao-custo-por-aresta-quadro-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-cartao-custo-por-aresta-quadro-3.jpg)
- **video-fluxo-pedido-ao-prestador-manutencao-predial**: ![capa](../galeria/05-apresentacao/video-fluxo-pedido-ao-prestador-capa.jpg) ![quadro-1](../galeria/05-apresentacao/video-fluxo-pedido-ao-prestador-quadro-1.jpg) ![quadro-2](../galeria/05-apresentacao/video-fluxo-pedido-ao-prestador-quadro-2.jpg) ![quadro-3](../galeria/05-apresentacao/video-fluxo-pedido-ao-prestador-quadro-3.jpg)

## Mais vídeos

Cada vídeo abaixo tem a capa e três quadros (a 15%, 50% e 85% da duração), com o nome
`<vídeo>-capa` e `<vídeo>-quadro-N`; quando há mais de três quadros, o vídeo foi visto em mais de um
corte. Quase todos estão em 960×720.

| vídeo | tamanho | duração | o que mostra |
|---|---|---:|---|
| `video-redesenho-integracao-de-empresas` | 960×720 | 14,6 s | redesenho do painel de integração de empresas: o "Portfolio" com saúde da integração por empresa |
| `video-faixa-de-celulares-financiamento-imobiliario` | 960×720 | 21,4 s | app do app de financiamento imobiliário: esteira de três celulares sobre degradê cinza com o logo e "MOBILE APP" |
| `video-telas-escuro-erp-de-facilities` | 960×720 | 23,8 s | ERP de facilities escuro: tela escura ainda apagada (o vídeo abre no preto) |
| `video-clique-do-mapa-ao-trace-agentes-hospitalares` | 960×720 | 8 s | Painel de agentes hospitalares: tela clara vazia antes de a interface entrar |
| `video-primeira-execucao-agentes-hospitalares` | 856×720 | 8 s | primeira execução do painel de agentes hospitalares: tela branca vazia |
| `video-cozinha-suave-cozinha-com-ia` | 960×720 | 23,8 s | App de cozinha com IA sobre fundo azul-claro: "Today" |
| `video-contratos-contratos-e-sla` | 960×720 | 23,3 s | Painel de contratos e SLA: "Good morning, [nome]" com dinheiro em jogo e "Needs attention" |
| `video-faixa-de-celulares-contas-a-receber` | 960×720 | 12,8 s | app do app de contas a receber: esteira de três celulares sobre degradê cinza com a tela de bloqueio verde |
| `video-da-chamada-ao-sow-escopo-de-projeto` | 960×720 | 23,4 s | App de escopo de projeto: "Good afternoon, [nome]" com KPIs, "Needs you" e o medidor de confiança de preço |
| `video-telas-com-cursor-recuperacao-de-garantia` | 960×720 | 23,8 s | App de recuperação de garantia: "Good morning, [nome]" com o recuperado no mês em degradê azul e o que está em risco |
| `video-autorizacoes-autorizacao-previa` | 960×720 | 22 s | App de autorização prévia: "Good morning, Sarah" com o cartão verde de $184,500 e "Attention required" |
| `video-direcao-recusada-licenciamento-solar` | 960×720 | 23,3 s | redesenho do painel de licenciamento solar: "Good morning, [nome]" com foto da casa, "Needs attention" e o assistente de IA do licenciamento |
| `video-faixa-de-celulares-pagamentos-de-agentes` | 960×720 | 21,4 s | app do painel de pagamentos de agentes claro: esteira de três celulares (bloqueio, "Today", "Approvals") |
| `video-encaminhamentos` | 960×720 | 15,8 s | Painel de encaminhamento de pacientes: "Good morning, [nome]" com "12 at risk" em verde-claro, cartão lavanda e "Needs your attention" |
| `video-telas-com-cursor-manutencao-predial` | 960×720 | 16 s | App de manutenção predial sobre bege: o painel com o medidor de pedidos |
| `video-redesenho-assistente-reembolso` | 960×720 | 24,1 s | construtor de agente: tela clara vazia |
| `video-recuperacao-de-garantia-2-recuperacao-de-garantia` | 960×720 | 23,8 s | App de recuperação de garantia (outro arquivo): o início com o recuperado |
| `video-fluxo-pedido-ao-prestador-manutencao-predial` | 960×720 | 24 s | plataforma web do app de manutenção predial sobre fundo verde-claro desfocado |
| `video-depois-do-agente-escuro-auditoria-de-agentes` | 960×720 | 56,3 s | Painel de auditoria de agentes escuro sobre fundo lilás desfocado: "Good morning, [nome]!" com o modelo de governança e a atividade ao vivo |
| `video-integracao-integracao-de-empresas` | 960×720 | 83,1 s | Painel de integração de empresas: o "Portfolio" com saúde da integração e "Needs your attention" |
| `video-telas-margem-de-servicos` | 960×720 | 23,1 s | Painel de margem de serviços: "Overview" com a margem 34.0% e o cartão degradê |
| `video-redesenho-manutencao-predial` | 960×720 | 19,2 s | redesenho do app de manutenção predial: o painel com medidor semicircular e cartões |
| `video-campanhas-escuro-estudio-de-anuncios` | 960×720 | 37,6 s | Estúdio de anúncios escuro: "Good morning, [nome]" com padrão encontrado, desempenho criativo e os criativos da semana |
| `video-gestao-de-agentes-agentes-hospitalares` | 960×720 | 47 s | Painel de agentes hospitalares: visão geral com saúde 94, a rede de agentes ao vivo e custo por agente |
| `video-previsao-de-cozinha-cozinha-com-ia` | 960×720 | 74,3 s | App de cozinha com IA: "Today" com clientes esperados e preparo prioritário |
| `video-aquisicoes-integracao-de-empresas` | 960×720 | 59,5 s | vídeo das aquisições do painel de integração de empresas: o "Portfolio" com a tabela por empresa |
| `video-onboarding-de-fornecedor-escuro-homologacao-de-fornecedor` | 960×720 | 81,6 s | App de homologação de fornecedor escuro: "Needs attention" com 32 onboardings e as listas por bloqueio |

### O que estes vídeos ensinam

1. **Use telas com cursor como o vídeo padrão do web**, com zoom no detalhe (o filtro de prioridade do
   app de manutenção predial, o plano de ação do painel de integração de empresas, a comparação de contexto do painel de agentes hospitalares, o popup "Send proposal" do
   app de escopo de projeto). Para app, use a **esteira de três celulares** (app de financiamento imobiliário, app de contas a receber, painel de pagamentos de agentes).
2. **Mostre de novo o vídeo que já funciona**, em outro fundo ou com outro corte, em vez de fazer um
   novo do zero para a mesma série.
3. **Dê ao fundo uma cor de ambiente**: app de cozinha com IA, app de manutenção predial e painel de auditoria de agentes aparecem sobre azul-claro,
   verde-claro e lilás desfocados.
4. **Faça da primeira execução um vídeo**: o painel de agentes hospitalares mostra "We found your system" montando a
   linha do tempo dos agentes achados e termina no assistente ("What can I help with today?").
5. **Vídeo sem tela não entra**: colagem de fotos em movimento não ensina produto.

### Os quadros

- **video-redesenho-integracao-de-empresas**: ![capa](../galeria/05-apresentacao/video-redesenho-capa.jpg) ![quadro](../galeria/05-apresentacao/video-redesenho-quadro-1.jpg) ![quadro](../galeria/05-apresentacao/video-redesenho-quadro-2.jpg) ![quadro](../galeria/05-apresentacao/video-redesenho-quadro-3.jpg)
- **video-faixa-de-celulares-financiamento-imobiliario**: ![capa](../galeria/05-apresentacao/video-faixa-de-celulares-capa-4.jpg) ![quadro](../galeria/05-apresentacao/video-faixa-de-celulares-quadro-1-4.jpg) ![quadro](../galeria/05-apresentacao/video-faixa-de-celulares-quadro-2-4.jpg) ![quadro](../galeria/05-apresentacao/video-faixa-de-celulares-quadro-3-4.jpg)
- **video-telas-escuro-erp-de-facilities**: ![capa](../galeria/05-apresentacao/video-telas-escuro-capa-3.jpg) ![quadro](../galeria/05-apresentacao/video-telas-escuro-quadro-1-3.jpg) ![quadro](../galeria/05-apresentacao/video-telas-escuro-quadro-2-3.jpg) ![quadro](../galeria/05-apresentacao/video-telas-escuro-quadro-3-3.jpg)
- **video-clique-do-mapa-ao-trace-agentes-hospitalares**: ![capa](../galeria/05-apresentacao/video-clique-do-mapa-ao-trace-capa.jpg) ![quadro](../galeria/05-apresentacao/video-clique-do-mapa-ao-trace-quadro-1.jpg) ![quadro](../galeria/05-apresentacao/video-clique-do-mapa-ao-trace-quadro-2.jpg) ![quadro](../galeria/05-apresentacao/video-clique-do-mapa-ao-trace-quadro-4.jpg)
- **video-primeira-execucao-agentes-hospitalares**: ![capa](../galeria/05-apresentacao/video-primeira-execucao-capa.jpg) ![quadro](../galeria/05-apresentacao/video-primeira-execucao-quadro-1.jpg) ![quadro](../galeria/05-apresentacao/video-primeira-execucao-quadro-2.jpg) ![quadro](../galeria/05-apresentacao/video-primeira-execucao-quadro-3.jpg)
- **video-cozinha-suave-cozinha-com-ia**: ![capa](../galeria/05-apresentacao/video-cozinha-suave-capa.jpg) ![quadro](../galeria/05-apresentacao/video-cozinha-suave-quadro-1.jpg) ![quadro](../galeria/05-apresentacao/video-cozinha-suave-quadro-2.jpg) ![quadro](../galeria/05-apresentacao/video-cozinha-suave-quadro-3.jpg)
- **video-contratos-contratos-e-sla**: ![capa](../galeria/05-apresentacao/video-contratos-capa.jpg) ![quadro](../galeria/05-apresentacao/video-contratos-quadro-1.jpg) ![quadro](../galeria/05-apresentacao/video-contratos-quadro-2.jpg) ![quadro](../galeria/05-apresentacao/video-contratos-quadro-3.jpg)
- **video-faixa-de-celulares-contas-a-receber**: ![capa](../galeria/05-apresentacao/video-faixa-de-celulares-capa-2.jpg) ![quadro](../galeria/05-apresentacao/video-faixa-de-celulares-quadro-1-2.jpg) ![quadro](../galeria/05-apresentacao/video-faixa-de-celulares-quadro-2-2.jpg) ![quadro](../galeria/05-apresentacao/video-faixa-de-celulares-quadro-3-2.jpg)
- **video-da-chamada-ao-sow-escopo-de-projeto**: ![capa](../galeria/05-apresentacao/video-da-chamada-ao-sow-capa.jpg) ![quadro](../galeria/05-apresentacao/video-da-chamada-ao-sow-quadro-1.jpg) ![quadro](../galeria/05-apresentacao/video-da-chamada-ao-sow-quadro-2.jpg) ![quadro](../galeria/05-apresentacao/video-da-chamada-ao-sow-quadro-3.jpg)
- **video-telas-com-cursor-recuperacao-de-garantia**: ![capa](../galeria/05-apresentacao/video-telas-com-cursor-capa.jpg) ![quadro](../galeria/05-apresentacao/video-telas-com-cursor-quadro-1.jpg) ![quadro](../galeria/05-apresentacao/video-telas-com-cursor-quadro-2.jpg) ![quadro](../galeria/05-apresentacao/video-telas-com-cursor-quadro-3.jpg)
- **video-autorizacoes-autorizacao-previa**: ![capa](../galeria/05-apresentacao/video-autorizacoes-capa.jpg) ![quadro](../galeria/05-apresentacao/video-autorizacoes-quadro-1.jpg) ![quadro](../galeria/05-apresentacao/video-autorizacoes-quadro-2.jpg) ![quadro](../galeria/05-apresentacao/video-autorizacoes-quadro-3.jpg)
- **video-direcao-recusada-licenciamento-solar**: ![capa](../galeria/05-apresentacao/video-direcao-recusada-capa.jpg) ![quadro](../galeria/05-apresentacao/video-direcao-recusada-quadro-1.jpg) ![quadro](../galeria/05-apresentacao/video-direcao-recusada-quadro-4.jpg) ![quadro](../galeria/05-apresentacao/video-direcao-recusada-quadro-5.jpg)
- **video-faixa-de-celulares-pagamentos-de-agentes**: ![capa](../galeria/05-apresentacao/video-faixa-de-celulares-capa.jpg) ![quadro](../galeria/05-apresentacao/video-faixa-de-celulares-quadro-1.jpg) ![quadro](../galeria/05-apresentacao/video-faixa-de-celulares-quadro-2.jpg) ![quadro](../galeria/05-apresentacao/video-faixa-de-celulares-quadro-3.jpg)
- **video-encaminhamentos**: ![capa](../galeria/05-apresentacao/video-encaminhamentos-capa.jpg) ![quadro](../galeria/05-apresentacao/video-encaminhamentos-quadro-1.jpg) ![quadro](../galeria/05-apresentacao/video-encaminhamentos-quadro-2.jpg) ![quadro](../galeria/05-apresentacao/video-encaminhamentos-quadro-3.jpg)
- **video-telas-com-cursor-manutencao-predial**: ![capa](../galeria/05-apresentacao/video-telas-com-cursor-capa-2.jpg) ![quadro](../galeria/05-apresentacao/video-telas-com-cursor-quadro-1-2.jpg) ![quadro](../galeria/05-apresentacao/video-telas-com-cursor-quadro-2-2.jpg) ![quadro](../galeria/05-apresentacao/video-telas-com-cursor-quadro-3-2.jpg)
- **video-redesenho-assistente-reembolso**: ![capa](../galeria/05-apresentacao/video-redesenho-assistente-reembolso-capa.jpg) ![quadro](../galeria/05-apresentacao/video-redesenho-assistente-reembolso-quadro-1.jpg) ![quadro](../galeria/05-apresentacao/video-redesenho-assistente-reembolso-quadro-2.jpg) ![quadro](../galeria/05-apresentacao/video-redesenho-assistente-reembolso-quadro-3.jpg)
- **video-recuperacao-de-garantia-2-recuperacao-de-garantia**: ![capa](../galeria/05-apresentacao/video-recuperacao-de-garantia-2-capa.jpg) ![quadro](../galeria/05-apresentacao/video-recuperacao-de-garantia-2-quadro-1.jpg) ![quadro](../galeria/05-apresentacao/video-recuperacao-de-garantia-2-quadro-2.jpg) ![quadro](../galeria/05-apresentacao/video-recuperacao-de-garantia-2-quadro-3.jpg)
- **video-fluxo-pedido-ao-prestador-manutencao-predial**: ![capa](../galeria/05-apresentacao/video-fluxo-pedido-ao-prestador-capa.jpg) ![quadro](../galeria/05-apresentacao/video-fluxo-pedido-ao-prestador-quadro-1.jpg) ![quadro](../galeria/05-apresentacao/video-fluxo-pedido-ao-prestador-quadro-2.jpg) ![quadro](../galeria/05-apresentacao/video-fluxo-pedido-ao-prestador-quadro-3.jpg)
- **video-depois-do-agente-escuro-auditoria-de-agentes**: ![capa](../galeria/05-apresentacao/video-depois-do-agente-escuro-capa.jpg) ![quadro](../galeria/05-apresentacao/video-depois-do-agente-escuro-quadro-1.jpg) ![quadro](../galeria/05-apresentacao/video-depois-do-agente-escuro-quadro-2.jpg) ![quadro](../galeria/05-apresentacao/video-depois-do-agente-escuro-quadro-3.jpg)
- **video-integracao-integracao-de-empresas**: ![capa](../galeria/05-apresentacao/video-integracao-capa.jpg) ![quadro](../galeria/05-apresentacao/video-integracao-quadro-1.jpg) ![quadro](../galeria/05-apresentacao/video-integracao-quadro-2.jpg) ![quadro](../galeria/05-apresentacao/video-integracao-quadro-3.jpg)
- **video-telas-margem-de-servicos**: ![capa](../galeria/05-apresentacao/video-telas-capa-4.jpg) ![quadro](../galeria/05-apresentacao/video-telas-quadro-1-4.jpg) ![quadro](../galeria/05-apresentacao/video-telas-quadro-2-4.jpg) ![quadro](../galeria/05-apresentacao/video-telas-quadro-3-4.jpg)
- **video-redesenho-manutencao-predial**: ![capa](../galeria/05-apresentacao/video-redesenho-capa-2.jpg) ![quadro](../galeria/05-apresentacao/video-redesenho-quadro-1-2.jpg) ![quadro](../galeria/05-apresentacao/video-redesenho-quadro-2-2.jpg) ![quadro](../galeria/05-apresentacao/video-redesenho-quadro-3-2.jpg)
- **video-campanhas-escuro-estudio-de-anuncios**: ![capa](../galeria/05-apresentacao/video-campanhas-escuro-capa.jpg) ![quadro](../galeria/05-apresentacao/video-campanhas-escuro-quadro-1.jpg) ![quadro](../galeria/05-apresentacao/video-campanhas-escuro-quadro-2.jpg) ![quadro](../galeria/05-apresentacao/video-campanhas-escuro-quadro-3.jpg)
- **video-gestao-de-agentes-agentes-hospitalares**: ![capa](../galeria/05-apresentacao/video-gestao-de-agentes-capa.jpg) ![quadro](../galeria/05-apresentacao/video-gestao-de-agentes-quadro-1.jpg) ![quadro](../galeria/05-apresentacao/video-gestao-de-agentes-quadro-2.jpg) ![quadro](../galeria/05-apresentacao/video-gestao-de-agentes-quadro-3.jpg)
- **video-previsao-de-cozinha-cozinha-com-ia**: ![capa](../galeria/05-apresentacao/video-previsao-de-cozinha-capa.jpg) ![quadro](../galeria/05-apresentacao/video-previsao-de-cozinha-quadro-1.jpg) ![quadro](../galeria/05-apresentacao/video-previsao-de-cozinha-quadro-2.jpg) ![quadro](../galeria/05-apresentacao/video-previsao-de-cozinha-quadro-3.jpg)
- **video-aquisicoes-integracao-de-empresas**: ![capa](../galeria/05-apresentacao/video-aquisicoes-capa.jpg) ![quadro](../galeria/05-apresentacao/video-aquisicoes-quadro-1.jpg) ![quadro](../galeria/05-apresentacao/video-aquisicoes-quadro-2.jpg) ![quadro](../galeria/05-apresentacao/video-aquisicoes-quadro-3.jpg)
- **video-onboarding-de-fornecedor-escuro-homologacao-de-fornecedor**: ![capa](../galeria/05-apresentacao/video-onboarding-de-fornecedor-escuro-capa.jpg) ![quadro](../galeria/05-apresentacao/video-onboarding-de-fornecedor-escuro-quadro-1.jpg) ![quadro](../galeria/05-apresentacao/video-onboarding-de-fornecedor-escuro-quadro-2.jpg) ![quadro](../galeria/05-apresentacao/video-onboarding-de-fornecedor-escuro-quadro-3.jpg)
