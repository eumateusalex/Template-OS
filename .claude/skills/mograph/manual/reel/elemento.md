# Reel · elemento

Os elementos que entram por cima no Reel vertical (1080×1920): a moldura da gravação, a vitrine
do antes e depois, a notificação, o selo, a pílula, o contador, o detalhe e a interface do
celular (busca, conversa, caixinha, botão). A peça é a de `comum/componentes.md` e a curva é a
de `comum/movimento.md`; aqui fica só o que o feed vertical muda: o tamanho no quadro, o lugar
em relação ao rosto e à legenda, o tempo e a ordem em que as camadas entram. O traço na
palavra (sublinhado, marca-texto, anel) é da legenda (`reel.legenda.traco-na-chave`), e o
tempo entre os elementos é do `reel/ritmo.md`; o tipo de cena, a divisão da tela e a zona segura são do `reel/cena.md`. Os presets de Reel não têm saída: a saída é
sempre a da peça (`comum.movimento.mola-da-interface`). Sobre a câmera, toda peça de interface
pede `motor:interface_aprovada` (`reel.cena.legenda-interface`); sem ela, o elemento vai em `meia-tela` ou `tela-cheia`, e o cartão sobreposto à câmera em tela cheia é recusado (`reel.cena.cartao-sobre-a-camera`).

## Moldura e cartão

### reel.elemento.moldura-da-gravacao
- **estado**: proposta
- **quando**: a gravação de tela, o print ou o vídeo de outro lugar entra no Reel como prova, sem tomar o quadro inteiro. **Não quando**: a peça é a pessoa falando sozinha (aí não há o que emoldurar); nem por cima da câmera em tela cheia (`reel.cena.cartao-sobre-a-camera`)
- **regra**: o conteúdo entra num cartão de canto arredondado com borda clara fina e sombra, com uma aba ou pílula de rótulo que quebra a borda de cima; dentro, um zoom lento quase parado mantém a imagem viva. O cartão fica no meio do quadro, longe da faixa de cima e da legenda de baixo
- **parâmetros** (30 qps): cartão de ~690×1200 px (est.) com borda de ~10 px e a aba em cima; o zoom de dentro vai de 1 a 0,928 em 200 q; a versão polaroide tem ~400 px de largura, inclinada −5,7°, na metade de baixo (y ~1250–1545), com a pílula quebrando a borda; entra pela curva `cartao` em 15 q (`comum.movimento.mola-da-interface`); dentro da zona segura (`reel.cena.zona-segura`)
- **som**: `whoosh-curto` no pouso do cartão; a aba sem som
- **realiza**: `motor:tipo`; `curva:cartao`; `css:foto-solta`; `mao`

### reel.elemento.fotos-em-cascata
- **estado**: proposta
- **quando**: várias fotos ou prints reais (resultado, bastidor, cliente) se empilham para mostrar volume. **Não quando**: há uma foto só, ou a foto é banco de imagem (`comum.componentes.foto-real-tratada`)
- **regra**: as fotos chegam uma a uma, crescendo de quase nada até o tamanho, cada uma com borda branca e inclinada de leve, a próxima por cima da anterior; a cascata segue a ordem da fala e acaba antes da frase seguinte
- **parâmetros** (30 qps): cada foto vai da escala 0,09–0,25 a 1 em 23–27 q; as entradas a 0, 13 e 31 q (cascata de ~13–18 q); inclinação de 4,9° e 9,7° (na figurinha, 5–12°); borda de 6–10 px; cada foto ~400 px de largura (est.); a curva da cascata é `comum.movimento.cascata-pela-importancia`
- **som**: `obturador` ou `pop` em cada pouso, um por foto
- **realiza**: `biblioteca:fotos-em-cascata`; `curva:pouso`; `css:foto-solta`

### reel.elemento.cartao-com-cursor
- **estado**: proposta
- **quando**: o Reel mostra um produto, um link ou uma oferta de cliente como coisa que se clica (o cartão do produto, o botão de assistir, o preço). **Não quando**: o cartão é só venda, sem caso por trás
- **regra**: o cartão entra deslizando, as linhas de dentro aparecem em cascata curta (título, valor, botão) e um cursor chega, para e clica; o clique é o fim da cena. O cursor é o do sistema, pequeno, e estaciona antes do clique (`comum.componentes.cursor-que-estaciona`)
- **parâmetros** (30 qps): os cartões deslizam em 14 q e 24 q; as linhas de dentro a 21, 25, 27 e 31 q, os botões em 24 q com quique; o clique troca três estados do cursor em 13–26 q; o cartão chega pela borda inclinado ~20° (capa); o valor entra pelo `reel.elemento.selo-de-valor`
- **som**: `clique` no clique do cursor; `whoosh-curto` no deslize do cartão
- **realiza**: `biblioteca:cursor-que-estaciona`; `biblioteca:clique-que-pula`; `curva:deslize`; `curva:quique`; `mao`

### reel.elemento.cartao-do-valor
- **estado**: proposta
- **quando**: um número de resultado (faturamento, crescimento, porcentagem) precisa de um lugar próprio que pareça coisa de app, um cartão de banco ou de painel. **Não quando**: o número já é a legenda grande da cena (aí é `comum.componentes.contador-por-quadro` na própria legenda)
- **regra**: um cartão escuro de canto bem redondo, com o valor no alto à esquerda e um fio de luz que passa uma vez; o valor conta por quadro até o número e assenta, e as pílulas do período (dia, semana, mês) entram em cascata depois. A cor do cartão é token do kit, nunca o gradiente do preset
- **parâmetros** (30 qps): cartão ~460×315 px, raio ~45 px (est.); o contador sobe 100 valores em ~1,5 s (44,6 q); as pílulas a 5, 11 e 18 q; a variante do número que embaralha antes de assentar dura 25 q (NT07); cartão de ~500×190 px em y ~1110–1300 (NT07, capa); o fio de luz é `comum.efeito.varredura-de-luz`
- **som**: `contagem` enquanto conta, `registradora` no assento
- **realiza**: `biblioteca:contador-que-sobe-e-assenta`; `biblioteca:contador-por-quadro`; `ios:widget`; `mao`

## Antes e depois

### reel.elemento.vitrine-antes-e-depois
- **estado**: proposta
- **quando**: o Reel de cliente mostra o trabalho entregue (o site, a peça, o perfil) contra o que havia antes. **Não quando**: não há trabalho real ou falta a permissão do cliente; nem para comparar número (aí é gráfico)
- **regra**: dois cartões sobre um fundo claro liso, o "antes" menor e mais baixo, o "depois" maior e na frente, cada um com o rótulo numa pílula redonda logo acima do canto; a legenda e os elementos vão por cima do "depois". O "antes" pode ir reto ao lado ou inclinado atrás, e o "depois" pode ganhar uma borda da cor do destaque com brilho
- **parâmetros** (30 qps): o "antes" tem ~0,69–0,75 do tamanho do "depois" (AD04: ~347×617 contra ~506×900 px; AD06: sobreposto); o topo do "antes" fica ~120–190 px abaixo do topo do "depois"; os dois na faixa y ~400–1370; a pílula do rótulo tem altura de ~30–34 px, menor no "antes"; a sombra é uma cópia desfocada com opacidade 0,16–0,48; a variante empilhada põe o "depois" em cima (AD02), e a de três cartões vai sem rótulo (AD08); o foco circular que passa pelos cartões tem chaves a 0, 319, 720 e 998 q (AD02, AD09); a entrada é a de `comum.movimento.mola-da-interface`, o "antes" primeiro (os presets são estáticos)
- **som**: `whoosh-curto` na entrada do "depois"; `plim` no rótulo
- **realiza**: `biblioteca:vitrine-antes-e-depois`; `curva:cartao`; `mao`

## Notificação e selo

### reel.elemento.notificacao-do-reel
- **estado**: proposta
- **quando**: uma mensagem, um pedido ou um aviso de app conta um pedaço da história no meio da fala. **Não quando**: a notificação não diz nada que a fala não diga; nem sobre a câmera sem `motor:interface_aprovada`
- **regra**: a forma entra primeiro, crescendo do centro ou caindo de cima com mola, e o texto chega depois, subindo pouco; título em negrito e subtítulo regular com o mesmo respiro entre as linhas. A saída é mais rápida que a entrada, e o texto não entra por desfoque animado (`comum.movimento.desfoque-em-toda-saida`)
- **parâmetros** (30 qps): a forma cresce da escala 0,01 a 0,85–1 em 19–31 q (traduz para `esse` 19 q) ou cai com quique em 21–33 q (traduz para `molaTarde` 15 q); o texto entra 6–21 q depois da forma (NT01 9/15, NT09 17/27); a notificação do celular desce em 1 s e sai mais rápido (G5c); fica 3–5 s; ~430×110 px (est., NT05) a ~780×435 px no cartão grande (NT10, raio ~80); em y ~700–1400, fora do rosto; a peça é `comum.componentes.notificacao-de-vidro`
- **som**: `notificacao` no pouso da forma
- **realiza**: `ios:toast`; `biblioteca:notificacao-que-cresce-do-centro`; `biblioteca:notificacao-de-vidro-tocada`; `curva:esse`; `curva:molaTarde`; `registro:liquid-glass-notification`

### reel.elemento.pilha-de-notificacoes
- **estado**: proposta
- **quando**: o volume é o argumento (os pedidos chegando, as mensagens acumulando). **Não quando**: há uma notificação só a contar
- **regra**: cópias da mesma notificação chegam uma a uma e se empilham na vertical com passo igual, cada nova empurrando a anterior; a pilha fica pronta antes da frase acabar
- **parâmetros** (30 qps): três cópias a 0, 25 e 51 q (passo de ~25 q), nas posições y −211, 0 e +208 em relação ao centro da pilha (NT05); cada uma entra como em `reel.elemento.notificacao-do-reel`
- **som**: `notificacao` em cada chegada, a terceira mais alta
- **realiza**: `biblioteca:notificacoes-que-se-acumulam`; `ios:pilha`; `curva:molaTarde`

### reel.elemento.selo-de-perfil
- **estado**: proposta
- **quando**: o Reel apresenta quem é (o cliente, o perfil, a conta) com foto, @ e número de seguidores. **Não quando**: o perfil é inventado ou de terceiro sem permissão
- **regra**: a foto redonda cresce primeiro, o nome e o número entram ao lado em cascata curta; o selo fica na metade de baixo, abaixo do queixo e acima da legenda
- **parâmetros** (30 qps): avatar de ~120–190 px, o @ em ~55 px e o número em ~46 px (NT06, est.); o selo inteiro em y ~1200–1385 (capa NT06); a forma de selo com um número cresce de 0,01 a 1 em 25–31 q (NT08, traduz para `esse`); o nome em cartão é o mesmo
- **som**: `pop` no avatar
- **realiza**: `curva:esse`; `curva:pouso`; `mao`

### reel.elemento.selo-de-valor
- **estado**: proposta
- **quando**: um valor em dinheiro aparece ao lado da fala, como etiqueta. **Não quando**: o número é o herói da cena (aí é `reel.elemento.cartao-do-valor`)
- **regra**: é `comum.componentes.selo-com-o-valor`; no Reel ele cola ao lado da palavra do valor na legenda e nunca cobre o rosto
- **parâmetros** (30 qps): o preset entra em 31–47 q, que se traduz para `molaTarde` 15 q; fica ~1–1,5 s
- **som**: `registradora` no pouso
- **realiza**: `biblioteca:selo-com-o-valor`; `curva:molaTarde`

### reel.elemento.pilula-do-reel
- **estado**: proposta
- **quando**: um rótulo curto (o cargo, a categoria, "clique aqui", "+100x") precisa ficar preso a outro elemento. **Não quando**: o rótulo é a legenda da fala (aí é `reel.legenda.chave-em-pilula`)
- **regra**: a pílula é `comum.componentes.pilula-de-acao`; no Reel ela quebra a borda do cartão ou da foto a que pertence, e a de ação leva a seta que entra depois. Pontinhos de "tem mais" entram em cascata ao lado dela
- **parâmetros** (30 qps): a pílula de ação entra em 9 q, a seta 4 q depois, e fica ~2 s; a pílula com três pontos entra com os pontos a 46, 51 e 59 q; altura de ~30–48 px (est.), raio total
- **som**: `pop` na pílula; `toque` na de ação
- **realiza**: `biblioteca:pilula-de-acao`; `biblioteca:pilula-com-icone-que-pousa`; `biblioteca:pontinhos-digitando`; `curva:pouso`

### reel.elemento.lista-que-se-marca
- **estado**: proposta
- **quando**: a fala enumera coisas (as provas, os erros, o que entra no serviço) e cada uma ganha um item na tela. **Não quando**: são mais de quatro itens (a cena vira texto demais para o celular)
- **regra**: as etiquetas entram uma a uma no ritmo da fala, e a que é o erro ganha a marca de errado em vermelho de sistema; na lista de provas, cada item recebe o certo ao entrar. A lista é `comum.componentes.lista-que-se-cumpre`
- **parâmetros** (30 qps): as etiquetas a 12, 21, 68 e 92 q, presas à fala (NT04); os itens da lista de provas a 0, 1, 2 e 4 q, quase juntos; o cartão de ação com o texto em cascata a 0, 3, 8 e 12 q (NT10); o vermelho é `--ios-vermelho`
- **som**: `check` em cada certo; `erro` na marca de errado
- **realiza**: `biblioteca:etiqueta-que-abre-da-linha`; `ios:lembretes`; `mao`

## Detalhe e objeto

### reel.elemento.adesivo-do-detalhe
- **estado**: proposta
- **quando**: um sinal pequeno (o cifrão, o raio, o certo) dá um acento perto da palavra, sem virar cena. **Não quando**: já há outro elemento na cena (um acento por vez)
- **regra**: o adesivo é pequeno, fica colado à palavra e entra com um quique curto ou subindo e aparecendo; o desenho é do kit ou o emoji do sistema, nunca o adesivo do pacote
- **parâmetros** (30 qps): 60–90 px (est.); o quique com chaves de y a 0, 6, 14 e 26 q (D01); a subida de ~173 px com a opacidade em 20 q (D02, traduz para `arranque` 20 q); o brilho no pouso é `comum.efeito.brilho-no-pouso`
- **som**: `plim` no pouso
- **realiza**: `curva:quique`; `curva:arranque`; `biblioteca:brilho-no-instante`; `ios:emoji`

### reel.elemento.objeto-ao-lado-da-palavra
- **estado**: proposta
- **quando**: um objeto (o celular, a moeda, o relógio) ilustra a palavra-chave da fala por um instante. **Não quando**: o objeto é o ícone ou o emoji de clip-art (recusados: `comum.componentes.icone-generico`)
- **regra**: o objeto entra com a palavra, ao lado dela e na mesma altura, e fica parado vivo até a frase sair; é o objeto 3D do kit (`comum.efeito.objeto-3d`) ou um emoji do sistema (`comum.componentes.emoji-do-sistema`), um por cena
- **parâmetros** (30 qps): o preset faz a entrada e depois o laço, em 2–4 s no total; o arquivo de entrada do kit dura 2,03 s (`comum.efeito.objeto-3d`); o emoji até 160 px
- **som**: `pop` na entrada
- **realiza**: `kit:3d`; `biblioteca:icone-3d-que-pousa`; `biblioteca:emoji-que-toca`; `biblioteca:objeto-3d-na-luz`; `ios:emoji`

### reel.elemento.flash-da-logo
- **estado**: proposta
- **quando**: a marca do cliente ou a própria aparece uma vez, no gancho ou no fecho. **Não quando**: a logo vira marca d'água fixa
- **regra**: um clarão curto antecede a logo, que aparece no lugar dele e fica um instante parada; depois sai seca
- **parâmetros** (30 qps): o clarão dura 3–6 q; a logo fica 1–1,5 s
- **som**: `impacto` no clarão
- **realiza**: `biblioteca:flash-antes-da-logo`

## Interface do celular

### reel.elemento.barra-de-busca
- **estado**: proposta
- **quando**: a fala é a pergunta que alguém digita no Google ou no app. **Não quando**: a busca não leva a nada na cena seguinte
- **regra**: é `comum.componentes.busca`; no Reel a barra abre da lupa até a largura, a lupa esmaece no fim, a digitação começa quando a barra assenta, e o toque leva à cena seguinte com a lupa encolhendo e a máscara crescendo até cobrir o quadro
- **parâmetros** (30 qps): a barra abre em 2 s (60 q); a lupa vai à opacidade 0,25 no fim; a digitação começa no assento (G4a); a barra na faixa de cima da cabeça (y ~350–600), com ≥ 65 px de lateral
- **som**: `tecla` em cada letra; `toque` no clique que leva adiante
- **realiza**: `ios:busca`; `biblioteca:busca-que-se-digita`; `biblioteca:barra-do-safari-que-carrega`

### reel.elemento.conversa-animada
- **estado**: proposta
- **quando**: a história se conta por mensagens (o cliente que pediu, o lead que sumiu, a resposta que demorou). **Não quando**: a conversa é de pessoa real sem permissão, ou o print tem dado de terceiro
- **regra**: é `comum.componentes.conversa` (e `comum.componentes.whatsapp` quando é o app); no Reel o fundo atrás se desfoca para a conversa ganhar foco e volta ao sair, o topo entra primeiro e cada mensagem depois, com tempo de leitura, sem quique; a hora nas mensagens e o "online" que some contam a demora
- **parâmetros** (30 qps): cada parte (o nome e cada mensagem) entra em ~1 s, vinda da lateral com saída lenta e sem quique (G4c); o balão cresce primeiro e a opacidade vem um pouco depois (G3a); raio do balão ~15 e da janela 30–35 (G3a, nas unidades do quadro de lá); a cena inteira dura ~10 s (G4c); o passo entre as mensagens não está medido
- **som**: `notificacao` em cada mensagem que chega; `tecla` no "digitando"
- **realiza**: `ios:conversa`; `ios:bolha`; `ios:digitando`; `css:zap`; `css:fone`; `biblioteca:conversa-que-sobe`; `biblioteca:pontinhos-digitando`; `curva:saida`

### reel.elemento.caixinha-de-perguntas
- **estado**: proposta
- **quando**: a fala responde a uma pergunta do público, e a pergunta aparece como a caixinha dos stories. **Não quando**: a pergunta é inventada e passada por pergunta de seguidor
- **regra**: a caixa abre na horizontal a partir do centro, rápida, e a pergunta aparece dentro dela logo depois; entra no meio da fala, na faixa de cima, e sai para o lado. A cor é token do kit; as palavras da pergunta podem entrar uma a uma, com a palavra-chave no destaque
- **parâmetros** (30 qps): altura de ~190 e raio ~35 (G5a, nas unidades do quadro de lá); abre em 1 s; o texto em 5 q; sai em 1 s para o lado (G5a); as palavras uma a uma a 2, 12, 23, 33 e 45 q, uma delas no destaque; fica fixa na faixa de cima quando a pergunta guia o Reel inteiro
- **som**: `pop` na abertura
- **realiza**: `curva:rapida`; `curva:saida`; `mao`

### reel.elemento.botao-interruptor
- **estado**: proposta
- **quando**: a fala liga ou desliga uma coisa (a automação, o aviso, o modo), e o gesto vira um interruptor de sistema. **Não quando**: o botão não muda nada na cena
- **regra**: o círculo corre de um lado ao outro e a trilha só troca de cor no fim do movimento, do cinza para o verde de sistema; o vermelho é para o que é ruim. Um par de interruptores, um ligando e outro desligando, anda junto
- **parâmetros** (30 qps): o círculo corre em ~20 q (G5b); a cor troca no fim do movimento; o verde é `--ios-verde`, o vermelho `--ios-vermelho`, o cinza `--ios-cinza-secundario`
- **som**: `clique` na chegada do círculo
- **realiza**: `ios:ajustes`; `biblioteca:toque-que-dispara`; `biblioteca:onda-do-toque`; `curva:rapida`

### reel.elemento.post-no-celular
- **estado**: proposta
- **quando**: o Reel mostra um post, um perfil ou uma página do cliente como ela aparece no celular. **Não quando**: o print é de outro aparelho que não o do mockup
- **regra**: o celular entra rápido, passa um pouco e assenta, com sombra embaixo; dentro vai o print do mesmo aparelho, e o post fica no tamanho real do celular, não esticado. A peça é `comum.componentes.iphone-de-verdade`
- **parâmetros** (30 qps): o celular entra em 1 s, rápido com um pico e parada (G5d); o post é 1080×1350 dentro da tela; o raio dos botões ~15 (G5d, nas unidades do quadro de lá)
- **som**: `whoosh-curto` na entrada
- **realiza**: `biblioteca:celular-que-chega-e-pousa`; `css:fone`; `curva:pouso`

### reel.elemento.baloes-que-sobem
- **estado**: proposta
- **quando**: um gesto de app (o pagamento, a curtida, o envio) solta vários balões ou ícones que sobem juntos. **Não quando**: o gesto é sério demais para festa
- **regra**: os balões nascem do botão e sobem em movimento contínuo; a opacidade chega só depois que o movimento começou, e todos usam a mesma curva copiada. A saída vai por um pai que leva o grupo inteiro
- **parâmetros** (30 qps): os balões sobem em ~1 s; a opacidade em ≤ 5 q depois do início do movimento (G1); a escala vai a 148% em 3 q no toque do botão (G3a)
- **som**: `pop` em cada balão, o primeiro mais alto
- **realiza**: `biblioteca:baloes-que-nascem-do-botao`; `curva:arranque`
