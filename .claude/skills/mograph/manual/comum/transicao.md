# A transição

Como uma cena passa para a outra. O corte invisível é a regra: quase toda junção é um corte seco
escondido por alguma coisa (movimento, objeto carregado, desfoque casado, efeito que vira a cena),
ou nem corte há, porque o objeto continua.

**No plano**: cada cena diz com que transição sai (`transicao`: `corte`, `curva`, `zoom-dentro`,
`zoom-fora`, `continuidade`, `morph`, `foco`), em que eixo e sentido (`saida`) e, quando muda, em que
eixo a seguinte entra (`entrada`). O `regua-direcao.mjs transicoes` monta as costuras daí e conta os
tipos, o dissolver e o sentido. No falado, o motor das cenas faz o corte com a cena subindo (`y-`),
o corte de lado entre duas telas cheias (`x-` ou `x+`), a `continuidade` entre duas telas cheias
(`ferramentas/falado-extra.mjs`), o `zoom-dentro` do rosto para a tela cheia (com o `desfoque`
opcional de 4 a 24 px) e o `flash`; o plano não promete outra coisa.

## As regras de toda transição

### comum.transicao.corte-invisivel
- **estado**: firme
- **quando**: toda junção entre cenas. **Não quando**: —
- **regra**: a cena que sai acelera para dentro do corte; o corte é um quadro, sem fade; o primeiro quadro da próxima já está andando; e algo concreto é igual dos dois lados (o portador: o objeto na mesma posição, escala, cor e sentido), porque o olho segue objetos
- **parâmetros** (30 qps): a saída acelera nos últimos 3 a 8 quadros; a animação da próxima já tem 2 a 5 quadros andados no primeiro quadro dela (o movimento começa antes do corte, fora de vista), e no plano as cenas seguem encostadas (`comum.estrutura.cenas-encostadas`); o portador fica a até 2% do quadro da posição
- **som**: o gesto da transição escolhida
- **realiza**: `motor:transicao`

### comum.transicao.orcamento
- **estado**: firme
- **quando**: toda peça. **Não quando**: —
- **regra**: dois ou três tipos de transição por peça, repetidos; transição não é variedade. A continuidade e a transformação não contam no orçamento; a especial conta como um dos tipos
- **parâmetros**: 2 a 3 tipos; uma especial por peça, na virada do ato
- **som**: nenhum
- **realiza**: `motor:transicao`

### comum.transicao.vetor
- **estado**: firme
- **quando**: toda transição com movimento. **Não quando**: o corte seco entre cenas paradas na batida
- **regra**: como uma cena sai decide como a próxima entra: mesmo eixo, mesmo sentido, velocidade casada, e o corte no meio do movimento dos dois lados. Sair parando ou entrar do repouso é batida morta
- **parâmetros**: —
- **som**: nenhum
- **realiza**: `motor:saida`; `motor:entrada`

### comum.transicao.sentido-do-z
- **estado**: proposta
- **quando**: a transição que cresce ou encolhe. **Não quando**: —
- **regra**: no Z, o sentido é o sinal da escala: crescendo é empurrar, encolhendo é recuar. Sair recuando e entrar crescendo do pequeno é o erro comum, porque "crescer do pequeno" é a entrada padrão de qualquer elemento
- **parâmetros**: —
- **som**: nenhum
- **realiza**: `motor:saida`

### comum.transicao.corrente
- **estado**: proposta
- **quando**: toda peça: o sentido dominante. **Não quando**: —
- **regra**: a peça tem um sentido dominante; os outros sentidos são reservados e querem dizer algo: o Z para dentro é aprofundar, o Z para fora é chegada, a lateral (no vertical) ou a vertical (no horizontal) é mudança de contexto
- **parâmetros**: no 9:16 (`reel`), para cima, como a rolagem do feed; no 16:9 (`filme`), para a esquerda, o sentido da leitura
- **som**: nenhum
- **realiza**: `motor:saida`

### comum.transicao.sem-ida-e-volta
- **estado**: firme
- **quando**: dois cortes seguidos. **Não quando**: a virada de ato, com causa visível
- **regra**: nunca dois cortes seguidos em sentidos opostos: a ida e volta parece erro
- **parâmetros**: —
- **som**: nenhum
- **realiza**: `motor:saida`

## Os tipos

### comum.transicao.corte-seco
- **estado**: firme
- **quando**: o padrão: a transição não acrescenta sentido. **Não quando**: as duas cenas devem ler como um plano (aí é `continuidade`)
- **regra**: o corte seco, na batida da música ou 2 quadros antes; quando a voz manda, no começo da frase. Em vez do zoom que só enfeita, o corte
- **parâmetros** (30 qps): no quadro da batida ou 2 quadros antes
- **som**: nenhum, ou o acerto da trilha
- **realiza**: `motor:transicao=corte`

### comum.transicao.corte-na-curva
- **estado**: proposta
- **quando**: passar de cena na direção da corrente. **Não quando**: a cena seguinte começa parada
- **regra**: o herói sai acelerando, o corte cai no meio do movimento, e a próxima entra continuando e freia
- **parâmetros** (30 qps): a saída anda 12% do quadro; `power4.in` e `power4.out` espelhados; 0,6 s no total
- **som**: `whoosh-curto`, pico no quadro do corte
- **realiza**: `motor:transicao=curva`; `registro:cut-the-curve`

### comum.transicao.zoom-dentro
- **estado**: proposta
- **quando**: aprofundar a mesma ideia. **Não quando**: a ideia muda (é corte ou lateral)
- **regra**: sai crescendo e entra crescendo, com o desfoque no corte
- **parâmetros**: sai de 1 a 1,2; entra de 0,75 a 1; 10 px de desfoque no corte, nos elementos e não no contêiner (como no `comum.transicao.desfoque-casado`); 0,4 s
- **som**: `whoosh-curto`
- **realiza**: `motor:transicao=zoom-dentro`

### comum.transicao.zoom-fora
- **estado**: proposta
- **quando**: a chegada, o pagamento da peça; uma vez por peça. **Não quando**: no meio da peça
- **regra**: sai encolhendo e entra encolhendo do grande
- **parâmetros**: sai de 1 a 0,8; entra de 1,25 a 1; 0,7 s
- **som**: `whoosh-longo`
- **realiza**: `motor:transicao=zoom-fora`

### comum.transicao.continuidade
- **estado**: proposta
- **quando**: duas cenas que devem ler como um plano; é a preferida. **Não quando**: a troca de assunto (aí o corte marca a mudança)
- **regra**: o objeto é carregado de uma cena para a outra, nasce de dentro do anterior, ou volta para onde nasceu; o recipiente novo cresce em volta do objeto e o antigo assenta dentro dele. No puro de interface, plano-sequência: no máximo um corte seco por chão, e a troca de chão é o corte
- **parâmetros** (30 qps): o recipiente novo cresce de 0,8 a 1 em ~15 quadros; o antigo assenta a 0,6–0,75 dentro dele; o objeto carregado fica a até 2% do quadro da posição, na mesma escala e cor
- **som**: `whoosh-curto` ou nenhum
- **realiza**: `motor:transicao=continuidade`

### comum.transicao.transformacao
- **estado**: firme
- **quando**: o objeto é a ideia (o botão vira a conversa). **Não quando**: em corrente ("X vira Y vira o logo" é o tique mais gasto)
- **regra**: a primeira transformação da peça é livre; a segunda pede o motivo escrito
- **parâmetros**: o motivo da segunda em `excecoes` do plano (a regra `morph` do `plano.mjs`)
- **som**: `whoosh-curto` ou `pop`
- **realiza**: `motor:transicao=morph`

### comum.transicao.superficie-que-cresce
- **estado**: proposta
- **quando**: o elemento pequeno vira o grande da cena seguinte (a notificação vira o cartão, a bolha vira a tela). **Não quando**: os dois não têm a mesma matéria (o vidro não cresce em papel)
- **regra**: é uma superfície só, opaca, que cresce do lugar do pequeno até a forma do grande; o conteúdo novo acende por dentro dela depois que a forma quase assentou. Nunca o pequeno some enquanto o grande aparece por cima (o cruzamento de duas camadas deixa ver as duas)
- **parâmetros**: a forma cresce em ~0,6 s com a curva de pouso; o conteúdo novo acende a partir de ~0,87 s da troca; o raio da borda acompanha a forma
- **som**: `whoosh-curto` no crescimento, ou o `pop` do conteúdo que acende
- **realiza**: `motor:transicao=morph`; `mao`

### comum.transicao.foco-que-troca
- **estado**: proposta
- **quando**: a transição que se quer ver, de um plano para o outro. **Não quando**: mais de uma vez na peça
- **regra**: o foco troca de plano à vista; o texto que se precisa ler nunca fica borrado
- **parâmetros**: no máximo uma por peça; pico de 10 px em texto e 18 a 20 px em superfície cheia
- **som**: nenhum, ou `whoosh-longo` baixo
- **realiza**: `motor:transicao=foco`; `biblioteca:foco-que-troca`; `registro:rack-focus`

### comum.transicao.nasce-da-tela-e-volta
- **estado**: proposta
- **quando**: interface: o widget, o cartão, o item que sai do aparelho. **Não quando**: não há aparelho na cena
- **regra**: o objeto sai do aparelho com escala 0 e voa até o lugar; na troca, volta pelo mesmo caminho, mais rápido do que veio
- **parâmetros**: a ida em 0,6 s (`voo`); a volta em 0,42 a 0,46 s (`rapida`), a escala a 0 em 0,2 s; a saída é 65 a 75% da entrada
- **som**: `pop` na ida, `whoosh-curto` na volta
- **realiza**: `biblioteca:nasce-da-tela-e-volta`; `curva:voo`; `curva:rapida`

### comum.transicao.efeito-vira-a-cena
- **estado**: proposta
- **quando**: trocar o chão (o claro para o escuro) com causa: o botão clicado, o estouro. **Não quando**: sem causa na cena que sai
- **regra**: o efeito ou o objeto cresce até cobrir o quadro e vira o chão da próxima: o botão clicado que cresce na cor da marca, o cartão que vira a próxima tela, o estouro que vira o fundo
- **parâmetros** (30 qps): o estouro cresce de 0,37 a 0,81 da largura em 5 quadros; o disco cresce 1,5 a 2,2× a cada 0,05 s até cobrir
- **som**: `clique` na causa e `whoosh-curto` na cobertura
- **realiza**: `biblioteca:objeto-que-cresce-e-vira-o-chao`; `biblioteca:cartao-que-vira-a-proxima-cena`

### comum.transicao.cartao-que-gira-e-troca
- **estado**: proposta
- **quando**: a mesma coisa em outro estado (o cartão, o produto que troca de cor). **Não quando**: duas coisas diferentes
- **regra**: o cartão gira em Y e troca de face no meio do giro, quando está de perfil
- **parâmetros** (30 qps): a troca no quadro em que o giro passa de 90°
- **som**: `whoosh-curto`
- **realiza**: `biblioteca:cartao-que-gira-e-troca`

### comum.transicao.desfoque-casado
- **estado**: proposta
- **quando**: a troca calma. **Não quando**: o texto da cena que sai ainda precisa ser lido
- **regra**: a saída termina borrada e a entrada começa mais borrada, e foca. O filtro fica só nos elementos que saem e entram, nunca no contêiner das cenas, com `snap: 'x,y'` e `filter: 'none'` assim que foca (o determinismo, em `.claude/skills/video/hyperframes.md`)
- **parâmetros** (30 qps): até 18 px na saída; a entrada foca em 4 a 8 quadros
- **som**: `whoosh-longo` baixo, ou nenhum
- **realiza**: `mao`

### comum.transicao.chicote
- **estado**: proposta
- **quando**: mudança de lugar. **Não quando**: duas vezes seguidas
- **regra**: o quadro chicoteia no eixo, com o borrão de movimento no pico da velocidade
- **parâmetros**: 0,3 a 0,4 s; o borrão no eixo com pico no meio; curva `chicote`
- **som**: `whoosh-curto`, pico no meio do chicote
- **realiza**: `curva:chicote`; `registro:whip-pan`

### comum.transicao.zoom-atraves
- **estado**: proposta
- **quando**: entrar na tela do celular, na letra, num "buraco"; a abertura com 1 a 2 s de filmagem real e o empurrão para dentro da tela. **Não quando**: não há o buraco
- **regra**: a câmera entra pelo buraco até ele ser o quadro, e a próxima nasce dele
- **parâmetros**: sai em escala de 1 a 6–14; entra de 0,55 a 1; na abertura, a tela vai de ~30% a 100% da largura em ~1,2 s
- **som**: `whoosh-longo`
- **realiza**: `registro:zoom-through-transition`; `registro:parallax-device-dive`

### comum.transicao.push-de-tela
- **estado**: proposta
- **quando**: trocar de tela dentro do aparelho. **Não quando**: fora do aparelho
- **regra**: a tela nova empurra a velha, que anda menos (o parallax da navegação do iOS)
- **parâmetros**: a nova anda 500 px e a velha 150, em 0,46 s (`camera`); sombra de 16% na borda da nova
- **som**: `rolagem` baixo, ou nenhum
- **realiza**: `biblioteca:push-de-tela`; `curva:camera`

### comum.transicao.flash
- **estado**: proposta
- **quando**: o corte para a logo ou para a revelação. **Não quando**: em toda troca
- **regra**: um quadro de luz cobre o corte e revela o que vem
- **parâmetros**: —
- **som**: `obturador` ou `impacto`
- **realiza**: `motor:transicao=flash`; `registro:flash-through-white`; `biblioteca:flash-antes-da-logo`

### comum.transicao.especial
- **estado**: proposta
- **quando**: a virada do ato, uma vez por peça. **Não quando**: na troca comum
- **regra**: uma transição de shader do registro ou o efeito que vira a próxima cena (o brilho que inunda, o objeto que cresce até ser a tela); conta como um dos tipos e precisa de portador
- **parâmetros**: uma por peça
- **som**: `whoosh-longo` ou `riser` que acaba no corte
- **realiza**: `registro:transitions-*`

### comum.transicao.tela-dividida
- **estado**: proposta
- **quando**: ritmo de esporte, várias ações ao mesmo tempo. **Não quando**: a peça de uma ideia só
- **regra**: o quadro se divide em três faixas que entram em sequência, e o chicote leva para fora
- **parâmetros**: 3 faixas
- **som**: `whoosh-curto` por faixa
- **realiza**: `mao`

### comum.transicao.abertura-radial-de-pixels
- **estado**: proposta
- **quando**: troca de fundo estilizada, na virada. **Não quando**: marca sóbria
- **regra**: o fundo novo abre do centro em pixels, com meio pixel de brilho, e as linhas somem por opacidade
- **parâmetros**: —
- **som**: `glitch` baixo ou `whoosh-curto`
- **realiza**: `mao`

### comum.transicao.corte-pelo-objeto
- **estado**: proposta
- **quando**: juntar duas gerações de vídeo, ou dois takes, sem pular. **Não quando**: o objeto não gira nem passa pela câmera
- **regra**: o corte seco cai no quadro em que o objeto gira ou cobre a câmera, e o take seguinte continua o giro
- **parâmetros**: —
- **som**: `whoosh-curto`
- **realiza**: `biblioteca:corte-pelo-objeto`

### comum.transicao.fusao-do-tempo
- **estado**: firme
- **quando**: só no estilo `documental`: passar o tempo (a noite que vira manhã). **Não quando**: em qualquer outro estilo
- **regra**: a fusão curta entre duas cenas, com a causa escrita no campo `causa` da cena que sai; a régua `transicoes` a aceita só assim
- **parâmetros**: ~0,5 s
- **som**: nenhum
- **realiza**: `motor:transicao`

## O que não entra

### comum.transicao.dissolver
- **estado**: recusado
- **quando**: —
- **regra**: o dissolver (crossfade) não tem portador e o olho perde o fio; fora do `documental` (`comum.transicao.fusao-do-tempo`), nunca
- **parâmetros**: —
- **som**: —
- **realiza**: —

### comum.transicao.glitch-e-particula-na-troca
- **estado**: recusado
- **quando**: —
- **regra**: o glitch e a partícula como transição de troca comum: são cara de trailer
- **parâmetros**: —
- **som**: —
- **realiza**: —

### comum.transicao.desfoque-animado-no-corte
- **estado**: recusado
- **quando**: —
- **regra**: o desfoque gaussiano que anda de 3 a 0 px sobre o clipe inteiro para esconder a emenda: o filtro no vídeo que escala, ou no contêiner que segura as cenas seguintes, diverge entre renders (o determinismo do motor). A troca borrada é o `comum.transicao.desfoque-casado`, com o filtro só nos elementos que acabam no corte
- **parâmetros**: —
- **som**: —
- **realiza**: —

### comum.transicao.virada-para-a-noite
- **estado**: recusado
- **quando**: —
- **regra**: a saída em giro em que o fundo claro vira noite: a noite fica fora do mundo da peça (`comum.mundo.noite`)
- **parâmetros**: —
- **som**: —
- **realiza**: —
