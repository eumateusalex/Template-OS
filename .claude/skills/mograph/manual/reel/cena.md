# A cena do Reel

A composição do quadro vertical: o tipo de cena de cada frase do falado, a divisão da tela, onde o
rosto fica, a abertura, o zoom da câmera do rosto e as famílias do puro. O tempo (o gancho, a
cadência, o rosto que volta, a música, o loop) é `reel/ritmo.md`; a legenda de cada tipo é
`reel/legenda.md`; a moldura, a notificação, a vitrine e o selo no quadro são `reel/elemento.md`. A
escala e o motivo da câmera são de `comum.camera-e-luz.escala-da-camera` e
`comum.camera-e-luz.camera-com-motivo`; a passagem de uma cena para a outra, de `comum/transicao.md`.

**No plano**: cada cena diz o `tipo` (no falado, `legenda`, `legenda-interface`, `meia-tela`,
`tela-cheia`; no puro, `texto`, `pessoa`, `objeto`, `grafico`) e, quando a câmera do rosto anda, o
`zoom`. O `plano.mjs conferir` cobra o vocabulário, a trava da interface, o gancho, o rosto que volta
e os limites do zoom; o motor que monta e o script de cada cena moram no `cenas.md`.

## Os tipos de cena do falado

### reel.cena.tipo-por-frase
- **estado**: firme
- **quando**: toda frase do falado com motion. **Não quando**: o Reel puro, sem a gravação da pessoa (aí são as famílias, `reel.cena.familias-do-puro`)
- **regra**: cada frase da fala ganha um de quatro tipos de cena, escolhido pelo que a frase faz: a que conecta fica com o rosto, a que pede um sinal rápido ganha a interface pequena, a que explica divide a tela, a que mostra toma o quadro. O tipo que foge dos quatro leva a exceção escrita no plano
- **parâmetros**: quatro tipos; a escolha por frase, com o `porque` de cada cena; o tipo fora do vocabulário reprova (`plano.mjs`)
- **som**: nenhum
- **realiza**: `motor:tipo`

### reel.cena.legenda
- **estado**: firme
- **quando**: a frase que conecta: o gancho, a opinião, a transição, a chamada. **Não quando**: a frase que mostra a prova ou o número (aí é `reel.cena.tela-cheia`)
- **regra**: a pessoa em tela cheia, no fundo real da gravação, com a legenda; nada além da legenda e do gancho escrito tem texto. Quando a cena tem script, ele desenha por cima do rosto só a marca sem texto que volta, no mesmo tamanho e altura das outras cenas, sem subir nem escurecer a câmera
- **parâmetros**: a câmera em escala 1, sem filtro; o `plano.mjs` recusa `texto_tela` nela
- **som**: nenhum
- **realiza**: `motor:tipo=legenda`

### reel.cena.legenda-interface
- **estado**: proposta
- **quando**: a frase que pede um sinal rápido: os três itens de uma lista, o número, o antes e depois. **Não quando**: em qualquer peça antes de a pessoa escolher esta cena na prancha
- **regra**: a pessoa em tela cheia, escurecida e desfocada, e uma interface pequena na metade de baixo. É da mesma família do cartão sobre a câmera (`reel.cena.cartao-sobre-a-camera`), e o escurecido é parente do véu (`comum.mundo.foto-com-veu`), os dois recusados: só entra depois que a pessoa a vir renderizada na prancha ao lado da mesma frase em `reel.cena.meia-tela` e escolher, com `"interface_aprovada": true` no plano e a frase dela no `brief.md`
- **parâmetros** (30 qps): a câmera a `brightness(0.45) blur(12px)`; a interface do meio da zona + 20 px até a base da zona (no `reel`, de 900 a 1540 px); a legenda sobe para acima da interface; a troca de enquadramento entra em 14 q e sai em 10 q; sem a aprovação, o `plano.mjs` reprova
- **som**: o gesto da interface que entra (`pop` ou `notificacao`), pico no quadro em que ela pousa
- **realiza**: `motor:tipo=legenda-interface`; `motor:interface_aprovada`

### reel.cena.meia-tela
- **estado**: firme
- **quando**: a frase que explica enquanto a pessoa continua presente. **Não quando**: a gravação com o rosto colado na borda de cima (sai cortado no cartão: `reel.cena.enquadramento-da-gravacao`)
- **regra**: a animação na metade de cima; a pessoa inteira, com o fundo real da gravação, dentro de um cartão de cantos redondos na metade de baixo. Ela entra no cartão inteira, nunca recortado do fundo (`reel.cena.pessoa-recortada-do-fundo`); a legenda encolhe junto com a câmera para caber no cartão
- **parâmetros** (30 qps): a animação do topo da zona ao meio dela − 20 px; o cartão do meio da zona + 20 px até a base (no `reel`, de 900 a 1540 px), raio de 40 px, a câmera a 0,75× (o `cartao_escala` da ficha), centrada no rosto; a legenda cabe no cartão com 40 px de folga de cada lado; a troca entra em 14 q e sai em 10 q
- **som**: nenhum (o som é o da animação que entra)
- **realiza**: `motor:tipo=meia-tela`

### reel.cena.tela-cheia
- **estado**: firme
- **quando**: a frase que mostra: a prova, o exemplo, o número que muda tudo. **Não quando**: em duas frases seguidas que só conectam (`reel.ritmo.rosto-que-volta`)
- **regra**: a animação toma o quadro; a voz e a palavra-chave dela continuam, e a cena deixa livre a faixa da legenda. A tela cheia traz o texto da tela (a palavra-chave ou o número), porque nela a legenda corrida some e quem vê sem som perde a frase
- **parâmetros**: o quadro inteiro, 1080 × 1920; a faixa da legenda livre (a `posicao_y` da ficha; a placa que reserva a faixa é `comum.mundo.placa-reserva-a-legenda`); até 4 palavras de `texto_tela`; o `plano.mjs` avisa a tela cheia sem `texto_tela`; o zoom da câmera do rosto não vale nela
- **som**: o gesto do que a animação faz
- **realiza**: `motor:tipo=tela-cheia`; `motor:texto_tela`

### reel.cena.interface-pequena
- **estado**: proposta
- **quando**: o aparelho, o ícone e a interface dentro de qualquer tipo de cena. **Não quando**: a letra que se lê, que segue `comum.tipografia.medidas`
- **regra**: o aparelho e o ícone têm o tamanho de objeto real no quadro, um pouco menores que o primeiro impulso; quem é grande é a composição (`comum.mundo.escala-e-hierarquia`). O iniciante faz tudo grande demais
- **parâmetros**: cerca de 25% menor que o primeiro desenho (est.). O aparelho inteiro dentro da zona do `reel` fica com uns 580 px de largura e a letra da interface com 19 px, abaixo do piso de 28 px do `check` da HyperFrames (`text_below_floor`): o aparelho inteiro só no plano aberto curto, que situa, e a leitura no plano fechado, com a câmera na parte da interface que conta e a letra acima do piso. A lista que passa da barra de baixo se recorta pelo `overflow` da própria lista, e a fila que já passou some, porque sob a barra o `check` acusa `text_occluded`; no plano fechado, o que sobe para baixo da frase da tela se esconde por máscara (nenhuma régua mede texto sobre texto). Medido numa peça de prova, ainda sem o olho de quem dirige
- **som**: nenhum
- **realiza**: `mao`

## A tela e o rosto

### reel.cena.zona-segura
- **estado**: firme
- **quando**: todo texto, logo e elemento-chave do quadro vertical. **Não quando**: o desenho decorativo e o chão, que podem sangrar (o `data-zona="livre"`)
- **regra**: o que importa fica dentro da zona do destino, porque o feed cobre o topo e a base com o nome, a legenda do post e os botões; a zona do anúncio é bem mais apertada embaixo que a do orgânico. A zona não se mede de novo na peça: é a do `formatos.json` da `/video`
- **parâmetros**: no `reel`, de 220 a 1540 px de altura e 65 px de cada lado (aproximada); no `anuncio-reels`, de 270 a 1248 px e 65 px (14% em cima, 35% embaixo, 6% nos lados; oficial); no `meta-feed-4x5` (1080 × 1350), de 81 a 1269 px (hipótese); a régua `zona` do `regua-direcao.mjs` mede a tinta de cada texto e forma a cada 0,1 s. O aparelho inteiro com a letra da interface legível não cabe na zona: a receita é a da `reel.cena.interface-pequena`
- **som**: nenhum
- **realiza**: `motor:formato`; `motor:destino`

### reel.cena.enquadramento-da-gravacao
- **estado**: proposta
- **quando**: a gravação da pessoa para o falado com motion. **Não quando**: a selfie crua de resposta, que é contraste de propósito
- **regra**: plano médio, da cintura para cima, com a cabeça no terço de cima e um palmo de ar acima dela, fundo liso. É o que põe a legenda no peito, o que faz o rosto caber no cartão da meia tela (que recorta a metade de baixo da gravação) e o que cabe na zona do anúncio. Gravar com folga de resolução dá o corte do zoom sem perder nitidez. O pedido de gravação é o da `/cortes`
- **parâmetros**: o queixo perto de 700 px de 1920; 1080p ou mais (4K dá o recorte do zoom sem perda); a zona do anúncio acaba em 1248 px
- **som**: nenhum
- **realiza**: `mao`

### reel.cena.rosto-no-circulo
- **estado**: proposta
- **quando**: a passagem do rosto em tela cheia para uma cena que precisa de espaço sem tirá-lo da tela (o rosto encolhe e a animação ocupa o resto), e a volta. **Não quando**: duas vezes seguidas; quando a frase pede o quadro inteiro (aí é `reel.cena.tela-cheia`)
- **regra**: em vez do corte seco, a gravação encolhe numa máscara circular em volta do rosto e assenta no centro ou num canto, e o espaço que sobra recebe a animação; depois o círculo cresce de volta à tela cheia. A máscara começa a fechar antes de a escala e a posição andarem; o círculo leva o fundo real junto, nunca recorta a pessoa. A curva acelera no meio e assenta sem passar do alvo
- **parâmetros** (30 qps): ~30 q na ida (os pontos-chave a 4 s e 5 s); a volta igual ou mais lenta (a volta rápida demais tropeça); o diâmetro final no tamanho do rosto (sem medida); o borrão de movimento nas bordas que andam (`comum.movimento.gramatica-do-borrao`)
- **som**: `whoosh-curto`, pico no meio da ida
- **realiza**: `curva:camera`; `mao`

## O zoom do falado

### reel.cena.zoom-de-enfase
- **estado**: proposta
- **quando**: a palavra que importa numa cena com o rosto. **Não quando**: a tela cheia, que cobre o rosto; com a legenda acima da cabeça já na tela
- **regra**: a câmera do rosto empurra sobre a palavra que importa e segura nela até a volta, nos limites de `comum.camera-e-luz.escala-da-camera`. Com a legenda acima da cabeça, o empurrão sobe o cabelo para a faixa dela (âncora no queixo) ou leva o objeto de baixo para a boca (âncora no alto): ali o que cabe é o zoom de transição, antes de a legenda entrar
- **parâmetros** (30 qps): chega em 5 q (padrão) e volta em 8 q (`quadros_volta`); a âncora em px de 1920 (`ancora_y`); acima de 1,2× o `plano.mjs` avisa (a exceção escrita aceita), acima de 2× reprova; a ênfase de 1,5 a 1,8×; com a legenda acima da cabeça, o cabelo já invade a faixa a 1,07×
- **som**: nenhum
- **realiza**: `motor:zoom`; `curva:rapida`

### reel.cena.zoom-de-transicao
- **estado**: proposta
- **quando**: o corte entre duas tomadas de rosto, para o corte não pular. **Não quando**: a tela cheia
- **regra**: a câmera nasce grande no quadro do corte e volta ao enquadramento logo no começo da cena; é o zoom que cabe com a legenda acima da cabeça, porque se desfaz antes de ela entrar
- **parâmetros** (30 qps): `quadros: 0` (nasce na escala); a volta em 6 q no começo do corte; a escala nos limites de `comum.camera-e-luz.escala-da-camera`
- **som**: nenhum
- **realiza**: `motor:zoom`; `curva:rapida`

### reel.cena.aproximacao-na-pausa
- **estado**: proposta
- **quando**: a pausa da fala numa cena com o rosto, para o quadro não parar. **Não quando**: a vírgula da peça (`comum.estrutura.virgula`)
- **regra**: um empurrão curto e lento segura a pausa da fala; é mais rápido que a respiração da câmera (`comum.camera-e-luz.camera-que-respira`) e não conta como ênfase
- **parâmetros** (30 qps): 1,04× em 18 q
- **som**: nenhum
- **realiza**: `motor:zoom`; `curva:rapida`

## A abertura e o material

### reel.cena.abertura-com-prova-real
- **estado**: proposta
- **quando**: a opção de abertura da prancha, quando há o que provar (a pessoa no computador, o celular na mão). **Não quando**: como padrão; a abertura que precisa do rosto falando no gancho (`reel.ritmo.gancho-com-o-rosto`)
- **regra**: de 1 a 2 s de filmagem de verdade, e a câmera entra pela tela do aparelho até ela virar o quadro, de onde o motion continua: dá prova antes do motion. O movimento é o `comum.transicao.zoom-atraves`
- **parâmetros**: a filmagem de ~1,2 s, crua e na mão; o empurrão de ~1,2 s, a tela de ~30% a 100% da largura
- **som**: `silencio` na filmagem e `whoosh-longo` no empurrão, pico quando a tela vira o quadro
- **realiza**: `registro:zoom-through-transition`; `registro:parallax-device-dive`

### reel.cena.horizontal-no-vertical
- **estado**: proposta
- **quando**: o material horizontal (o gerado, a gravação de tela, o vídeo de cliente) num Reel. **Não quando**: o material já vertical, ou o horizontal cujo assunto cabe no recorte (aí ele se recorta para encher o quadro)
- **regra**: o vídeo horizontal fica inteiro, na largura do quadro, e uma cópia dele, ampliada para cobrir o 9:16 e desfocada, faz a moldura atrás: o quadro vertical enche com a cor do próprio vídeo, sem barra preta. A cópia guarda a cor (o cinza apagado é a recusa `comum.estrutura.arco-de-cinza`), e o desfoque dela é fixo, nunca animado (`comum.transicao.desfoque-animado-no-corte`)
- **parâmetros** (30 qps): o 16:9 a 1080 × 608 px no meio do quadro; a cópia a ~3,2× para cobrir 1920 de altura (conta); a entrada do vídeo de baixo para cima em 20 q, com o borrão de movimento
- **som**: nenhum
- **realiza**: `mao`

## O motion puro

### reel.cena.familias-do-puro
- **estado**: proposta
- **quando**: toda cena do Reel puro, sem gravação. **Não quando**: o falado (aí são os quatro tipos, `reel.cena.tipo-por-frase`)
- **regra**: cada cena se organiza em volta de uma coisa só: a frase (a tipografia cinética, a palavra que muda), uma figura agindo (o personagem da marca, quando o workspace tem), um objeto real (o celular, o produto, o documento) ou o gráfico (a interface, o número, o fluxo)
- **parâmetros**: quatro famílias, o campo `tipo` (`texto`, `pessoa`, `objeto`, `grafico`); o vocabulário fora reprova (`plano.mjs`)
- **som**: nenhum
- **realiza**: `motor:tipo`

### reel.cena.uma-forma-que-atravessa
- **estado**: proposta
- **quando**: o Reel puro de interface que mostra vários recursos ou estados em pouco tempo (de 8 a 15 s), na família `grafico`. **Não quando**: os estados não têm parentesco de forma (aí é a troca por cena), ou o falado
- **regra**: um elemento só, e nada corta: cada estado é o mesmo elemento mudando de tamanho, de raio e de cor, e o conteúdo de dentro troca com um desfoque curto, com entrada e saída próprias para não se sobrepor. O cursor causa cada troca, com clique e arraste de verdade; a câmera enquadra cada estado até ele encher o quadro; o último quadro é o primeiro, com o cursor no mesmo lugar e na mesma velocidade, para o laço não tropeçar
- **parâmetros**: de 8 a 12 estados, um acontecimento por batida (120 BPM, 7 compassos ≈ 14 s); fundo cinza quente claro, componente preto e branco ou um acento só; a mola da interface (`comum.movimento.mola-da-interface`) e nenhum `bounce`; o valor que muda de alvo várias vezes é a soma de uma mola por mudança, que segue função do tempo e preserva a velocidade; as duas bordas do indicador em molas diferentes, a da frente adiantada. Medido na referência: movimento mediano 0,0106, 7% de segundos calmos, 4,8 eventos/s, nenhum corte, fecho de 0,9 s
- **som**: `clique` em cada troca causada pelo cursor, pelo pico medido
- **realiza**: `motor:transicao=morph`; `biblioteca:cursor-que-estaciona`; `curva:cartao`

### reel.cena.interface-curta
- **estado**: proposta
- **quando**: o Reel puro de interface de 6 a 8 s, um recurso só, na família `grafico`. **Não quando**: vários recursos de 8 a 15 s (aí é a `reel.cena.uma-forma-que-atravessa`), ou o falado
- **regra**: um elemento muda de estado sem corte, e o único corte duro é a entrada do cartão de marca; a música entra no primeiro quadro e não para; o gancho é o objeto no primeiro estado, com o primeiro gesto perto de 1 s, nunca o recurso pronto; a peça se lê sem som e nasce em 9:16
- **parâmetros**: em 7 s, 1 s de entrada, uns 4,5 s de gestos (4 a 5 estados, uma troca por segundo) e o cartão de 1,2 a 1,5 s; o primeiro som antes de 0,2 s; de 3 a 5 eventos sonoros por segundo. Medido em 8 peças de interface com som, de 10 a 15 s (mediana 11,9 s): 1,5 corte por peça, música nas 8, o primeiro som aos 0,14 s, o cartão final em 6 (mediana de 2 s), 3,65 eventos/s, -10,4 LUFS. A duração de 6 a 8 s e o cartão no piso são escala própria: nenhuma referência medida tem menos de 10 s, e só uma é vertical
- **som**: a `cama` contínua desde o primeiro quadro; o `clique` no gesto que o cursor causa, pelo pico medido. Nas referências o som não segue a ação (a razão do movimento nos golpes contra o acaso é 1,07): o efeito no gesto é escolha de ofício, não prática medida
- **realiza**: `motor:transicao=morph`; `biblioteca:cursor-que-estaciona`

## O que não entra

### reel.cena.pessoa-recortada-do-fundo
- **estado**: recusado
- **quando**: —
- **regra**: a pessoa da gravação recortada do fundo real e colada sobre outro fundo: o contorno do recorte deforma a cabeça e lê como erro. Na meia tela ela entra inteira no cartão, com o fundo da gravação; a palavra atrás da cabeça recorta só o contorno e a deixa no fundo real (`reel.legenda.palavra-atras-da-cabeca`)
- **parâmetros**: —
- **som**: —
- **realiza**: —

### reel.cena.cartao-sobre-a-camera
- **estado**: recusado
- **quando**: —
- **regra**: o cartão sobreposto à câmera em tela cheia, com a pessoa por baixo: a sobreposição disputa o rosto e esconde quem fala. A interface sobre a câmera é da mesma família e só entra pela escolha da pessoa na prancha (`reel.cena.legenda-interface`)
- **parâmetros**: —
- **som**: —
- **realiza**: —
