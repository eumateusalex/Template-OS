# A estrutura

Como a peça se distribui no tempo: o ritmo, a pausa, os atos, o pico e o fim. A passagem de uma
cena para a outra é `comum/transicao.md`; a duração de cada movimento é `comum/movimento.md`.

**No plano**: cada cena diz a `funcao` (a parte da espinha, `roteiro.md` § 2), a `importancia` (de
1 a 3; o pico é a primeira em 3) e o `tempo_forte`; o topo diz a `virgula` (o instante da única
parada total). O `plano.mjs` confere a soma das cenas, a importância, o CTA e a vírgula; o
`regua-direcao.mjs` mede no render o estímulo (`estimulo`) e o quadro parado (`parado`).

## O ritmo

### comum.estrutura.algo-novo
- **estado**: firme
- **quando**: toda peça. **Não quando**: a vírgula e o fim resolvido, as duas paradas da peça
- **regra**: informação visual nova a cada 1,5 a 3 s (o corte, o enquadramento que troca, o texto ou o objeto novo, a frase nova da voz, o efeito que se ouve); o quadro inteiro só para na vírgula e no fim
- **parâmetros**: algo novo a cada 1,5 a 3 s; acima de 3 s sem nada novo a régua `estimulo` avisa, acima de 5 s reprova
- **som**: nenhum (o efeito que se ouve conta como algo novo)
- **realiza**: `mao`

### comum.estrutura.cenas-encostadas
- **estado**: firme
- **quando**: o motion puro. **Não quando**: o falado (lá a cena vai do começo da frase dela ao começo da seguinte, pelo corte)
- **regra**: as cenas se encostam e cobrem a duração sem buraco nem sobra: a próxima começa no quadro em que a anterior acaba, e os quadros vazios depois da saída se cortam. Atrasar uma cena empurra todas as seguintes
- **parâmetros** (30 qps): tolerância de 1 quadro entre o fim de uma e o começo da outra (a regra `soma` do `plano.mjs`)
- **som**: nenhum
- **realiza**: `motor:de`; `motor:ate`

## A pausa

### comum.estrutura.virgula
- **estado**: firme
- **quando**: logo antes do pico, uma vez por peça. **Não quando**: —
- **regra**: a vírgula dramática: o quadro inteiro para entre a ação e o resultado, e o som se cala com ele; o pico, o momento mais alto da peça, vem logo depois. É a única parada total da peça
- **parâmetros**: 0,3 a 0,75 s de quadro parado, até 1,5 s antes do pico; uma por peça (a régua `parado` reprova o parado acima de 0,75 s e avisa a segunda vírgula)
- **som**: `silencio` na vírgula, e o pico logo depois
- **realiza**: `motor:virgula`

## Os atos

### comum.estrutura.quadro-zero
- **estado**: proposta
- **quando**: toda peça. **Não quando**: —
- **regra**: quem assiste decide em 1 a 2 s se fica: o quadro 0 já se mexe, já diz o assunto e já está nítido (nada nasce desfocado no primeiro quadro: a abertura borrada lê como erro de render)
- **parâmetros**: o assunto dito até 2 s; o desfoque de movimento só depois de o quadro 0 assentar
- **som**: nenhum
- **realiza**: `mao`

### comum.estrutura.micro-cenas
- **estado**: proposta
- **quando**: o gancho ou a virada que resume muita coisa num segundo (o produto que se desenha antes de aparecer, a passagem de um produto para o outro). **Não quando**: como transição em toda cena; mais de uma vez na peça
- **regra**: uma rajada de seis micro-cenas dentro de um segundo, em traço preto e branco (a malha em wireframe, o contorno a lápis, a planta técnica, a silhueta), como se o próximo objeto fosse desenhado antes de chegar
- **parâmetros** (30 qps): seis cenas de 5 quadros, 1 s no total; uma vez por peça
- **som**: `riser` que acaba no último quadro da rajada
- **realiza**: `mao`

### comum.estrutura.historia-que-anda
- **estado**: proposta
- **quando**: o comercial, a peça que mostra o produto ou o serviço. **Não quando**: a peça com partes (três erros, quatro passos), que tem a espinha dela (`roteiro.md` § 1)
- **regra**: a peça conta uma coisa que acontece: cada cena é consequência da anterior, com o mesmo objeto atravessando (a caixa abre, o que sai dela cai na esteira, a esteira leva ao centro, o centro vira a marca), e não uma lista de planos soltos
- **parâmetros**: —
- **som**: nenhum
- **realiza**: `motor:transicao=continuidade`

## O pico e o fim

### comum.estrutura.orcamento-de-importancia
- **estado**: firme
- **quando**: toda peça. **Não quando**: —
- **regra**: cada cena tem importância de 1 a 3, e no máximo um quarto das cenas é 3: ênfase em tudo não destaca nada. O pico da peça é a primeira cena em 3
- **parâmetros**: até 25% das cenas em 3 (o `plano.mjs` reprova acima)
- **som**: nenhum
- **realiza**: `motor:importancia`

### comum.estrutura.pico-no-drop
- **estado**: proposta
- **quando**: a peça em que a trilha manda no tempo. **Não quando**: a voz manda no tempo (aí o pico cai na frase, com o `tempo_forte` `voz`)
- **regra**: o pico cai no drop medido da trilha, e a cena do pico revela ou pousa no tempo forte
- **parâmetros**: o drop do `som.json`; o `tempo_forte` do pico é `revela` ou `pousa` (o `plano.mjs` avisa o contrário)
- **som**: `impacto` no quadro do drop
- **realiza**: `motor:tempo_forte`

### comum.estrutura.o-fim
- **estado**: firme
- **quando**: a assinatura, em toda peça. **Não quando**: —
- **regra**: a peça acaba uma vez, e menor que o pico: a escala se gasta uma vez, e o maior tamanho da peça é o do pico. O CTA se constrói andando, em dois tempos (a frase que entra, depois a chamada), e se lê com o quadro vivo; só o último quadro resolvido fica parado
- **parâmetros**: o último quadro parado até 1,4 s (a régua `parado` avisa acima: é calibragem); as cenas de CTA somam até 25% da duração (o `plano.mjs` reprova acima)
- **som**: `golpe-tonal` no quadro que resolve
- **realiza**: `motor:funcao=CTA`

## Onde cortar

### comum.estrutura.regra-dos-seis
- **estado**: proposta
- **quando**: decidir onde cai cada corte. **Não quando**: decidir o que entra na peça (é a ordem do `metodo.md` da `/video`: a mensagem, a clareza, a verdade, a narrativa)
- **regra**: um corte se julga, em ordem, pela emoção (o que se sente muda?), pela história (a batida avança a ideia?), pelo ritmo (cai na batida?), pelo traço do olho (onde o olho estava e onde a coisa nova nasce), pelo plano 2D (o sentido da tela não espelha) e pelo espaço 3D (o objeto continua onde estava)
- **parâmetros**: —
- **som**: nenhum
- **realiza**: `mao`

## O que não entra

### comum.estrutura.balanco-em-laco
- **estado**: recusado
- **quando**: —
- **regra**: respirar, flutuar, pulsar e brilhar em laço para preencher tempo leem como vídeo à espera. A cena que termina de entrar com segundos sobrando é erro de plano: falta história, não falta movimento
- **parâmetros**: —
- **som**: —
- **realiza**: —

### comum.estrutura.arco-de-cinza
- **estado**: recusado
- **quando**: —
- **regra**: o primeiro ato cinza e apagado, com a cor da marca rasgando na virada: o mundo sem cor e o clima melancólico apagam a peça inteira, e não só o primeiro ato; a cor do mundo fica viva desde o primeiro quadro
- **parâmetros**: —
- **som**: —
- **realiza**: —
