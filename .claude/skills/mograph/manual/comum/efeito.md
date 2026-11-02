# O efeito

Brilho, luz, partícula, tremor, 3D e grão. Efeito é evento: tem causa na cena, nasce no quadro
dela e se gasta uma vez. O grão é a única camada que fica do começo ao fim; todo o resto, ligado o
filme inteiro, é papel de parede.

**No plano**: o efeito entra pela cena (o `componente` da biblioteca, ou a cena que constrói). Nenhuma
régua confere ainda a causa nem o gasto: quem confere é a leitura da prancha e do render. A régua
`parado` apaga o grão pela média, então o grão não salva o quadro parado.

## A regra de todo efeito

### comum.efeito.evento
- **estado**: firme
- **quando**: todo brilho, partícula, 3D, degradê de luz e transição por shader. **Não quando**: o grão (`comum.efeito.grao`) e a luz de janela (`comum.camera-e-luz.luz-de-janela`), que são luz e matéria do mundo, ligadas a peça inteira
- **regra**: o efeito tem causa (o toque, a batida, a palavra-chave, o número), nasce no quadro da causa e é gasto uma vez, ou uma vez por ato. Ligado o filme inteiro ou em toda cena é papel de parede, e reprova
- **parâmetros**: uma vez por peça, ou uma por ato
- **som**: nenhum (soa a causa)
- **realiza**: `mao`

## Os efeitos

### comum.efeito.brilho-no-pouso
- **estado**: proposta
- **quando**: o pouso do herói. **Não quando**: em mais de um objeto por quadro
- **regra**: o brilho nasce em volta do principal no quadro do pouso e decai; a cor do brilho é mais escura e mais saturada que o objeto
- **parâmetros**: pico de opacidade até 0,45; decai em 0,4 a 0,8 s
- **som**: nenhum (soa o pouso)
- **realiza**: `biblioteca:brilho-no-instante`; `registro:beat-accent`

### comum.efeito.brilho-na-chave
- **estado**: firme
- **quando**: a entrada da palavra-chave. **Não quando**: depois da entrada (nunca ligado); em mais de uma palavra por frase
- **regra**: o brilho nasce com a palavra-chave e some; uma chave por frase
- **parâmetros** (30 qps): some em 18 quadros
- **som**: nenhum (soa a entrada da chave)
- **realiza**: `biblioteca:palavra-em-duas-vozes`; `biblioteca:brilho-no-instante`

### comum.efeito.varredura-de-luz
- **estado**: proposta
- **quando**: o objeto da ideia, uma vez; a palavra-chave, uma vez. **Não quando**: repetida (vira "carregando")
- **regra**: uma faixa de luz diagonal atravessa o objeto uma vez; na palavra-chave, o reflexo lento
- **parâmetros**: no objeto, a faixa atravessa em 0,6 a 0,9 s; na palavra-chave, de 1,3 a 10 s
- **som**: nenhum
- **realiza**: `biblioteca:brilho-no-instante`; `registro:light-sweep-pass`; `registro:gloss-sweep`

### comum.efeito.vazamento-de-luz
- **estado**: proposta
- **quando**: o corte mais importante, a virada do ato. **Não quando**: em todo corte
- **regra**: uma luz vaza pelo quadro no corte e some, e a cena nova já está lá; conta como a transição especial da peça (`comum.transicao.especial`)
- **parâmetros** (30 qps): 8 a 14 quadros, na cor da marca ou quente; 1 por peça
- **som**: o da transição especial
- **realiza**: `biblioteca:luz-que-vaza-na-virada`; `registro:light-leak`; `registro:organic-light-leak-overlay`

### comum.efeito.aberracao-cromatica
- **estado**: proposta
- **quando**: o pico de velocidade (o zoom, o chicote). **Não quando**: em texto parado
- **regra**: as cores se separam nas bordas só no pico da velocidade, e voltam limpas
- **parâmetros** (30 qps): 1 a 3 px nas bordas, por 4 a 8 quadros
- **som**: o do movimento que a causa (`whoosh-curto`)
- **realiza**: `mao`

### comum.efeito.particula
- **estado**: proposta
- **quando**: o estouro que vira a próxima cena; a poeira na frente, desfocada. **Não quando**: sem a causa
- **regra**: poucas partículas, que nascem da causa e somem; a posição sai de uma semente, nunca do acaso (o determinismo do render)
- **parâmetros**: até 40 partículas; somem em 0,5 a 1 s; com semente, nunca `Math.random`
- **som**: nenhum (soa o estouro)
- **realiza**: `mao`

### comum.efeito.tremor-de-camera
- **estado**: proposta
- **quando**: o impacto. **Não quando**: em todo corte; em texto que se lê na hora
- **regra**: a câmera treme no impacto, com a amplitude caindo a zero, e assenta
- **parâmetros** (30 qps): 3 quadros; no golpe de título, até 20 quadros caindo a zero
- **som**: `impacto`, pico no primeiro quadro do tremor
- **realiza**: `biblioteca:tremor-no-impacto`; `registro:camera-shake`

### comum.efeito.onda-do-toque
- **estado**: proposta
- **quando**: o toque do elemento vivo, uma vez por ação. **Não quando**: sem toque que a cause
- **regra**: dois anéis abrem do ponto tocado, um atrás do outro, e somem
- **parâmetros**: anéis de 3 px; de 40 px até R e até 0,72 R; 0,09 s entre eles; somem em 0,65 s
- **som**: `toque`, pico no quadro do toque
- **realiza**: `biblioteca:onda-do-toque`

### comum.efeito.objeto-3d
- **estado**: proposta
- **quando**: a ideia é física: o objeto que a frase nomeia e que ganha um momento seu (o dinheiro que chega, o cadeado que fecha, o check da tarefa). **Não quando**: como enfeite ou fundo; em duas batidas seguidas; o logo de rede social sem a frase nomear a rede
- **regra**: efeito é evento: um objeto herói por vez, que faz um evento (nasce, pousa, gira uma vez) e para, sobre o mundo e com sombra de contato, nunca solto no vazio. O arquivo `-in` é o evento; o `-loop` repete no lugar, e o laço que preenche tempo é a recusa `comum.estrutura.balanco-em-laco`. Os sete arquivos sem alfa trazem fundo próprio e entram como cena inteira
- **parâmetros**: 174 animações em WebM, 167 com alfa; os ícones em 1000 × 1000; o `-in` dura 2,03 s, o `-loop` de 4 a 11,17 s; os temas: o dinheiro (moeda, carteira, cédula que brilha, sobe, chove ou explode, cofre, porquinho, saco de dinheiro, cartão), a compra (carrinho, sacola, etiqueta, código de barras, presente, leilão, caminhão, aberto e fechado), o trabalho (maleta, pasta, contrato, agenda, calendário, bloco, caneta, clipe, engrenagem, ajuste, lupa, lixeira, disco, download, upload), a conversa (balão, envelope, megafone, telefone, microfone, antena, wi-fi, TV, tela, jornal, fone), a meta (alvo, foguete, gráfico, selo de qualidade, lâmpada, xadrez, aperto de mão), o sinal (check, feito, cancelar, errado, pare, cuidado, boia, guarda-chuva, escudo, cadeado, chave), o tempo (relógio, cronômetro), o lugar (alfinete, bandeira, mapa, bússola, globo, países), os objetos soltos (cérebro, olho, borboleta, holofote, xícara, folha, tomate, foto, a pessoa que anda) e 13 logos de redes e apps
- **som**: `pop` no quadro em que o objeto nasce, ou `registradora` no dinheiro; o pico no pouso
- **realiza**: `kit:3d`; `biblioteca:objeto-3d-na-luz`

### comum.efeito.grao
- **estado**: proposta
- **quando**: o filme inteiro, contra a faixa do degradê e a cara de render. **Não quando**: o grão pesado de "vintage"; a marca chapada de propósito
- **regra**: um grão fino cobre o quadro inteiro e troca em passos secos; é a única camada permitida do começo ao fim
- **parâmetros**: 3 a 6% de opacidade no modo normal; troca a 12 a 24 qps. No `soft-light`, o grão de 1 px simétrico (claro e escuro em torno do cinza do meio) em ~0,7%, com a semente pelo quadro para o render repetir igual; o de 2 px empelota e pesa o arquivo (39 MB contra 25 MB em 6 s de 1080p)
- **som**: nenhum
- **realiza**: `biblioteca:grao-de-pelicula`; `registro:grain-field`; `registro:grain-overlay`

### comum.efeito.esfera-de-vidro
- **estado**: proposta
- **quando**: a matéria de vidro que dá profundidade ao quadro claro e se mexe com a cena (boia, deriva, passa na frente). **Não quando**: parada atrás da marca, que é o papel de parede recusado (`comum.mundo.papel-de-parede`); mais de três no quadro; cortada pela borda
- **regra**: a esfera é vidro de verdade: o reflexo especular pequeno no alto, o miolo translúcido que deixa ver o fundo, o aro de luz por dentro da borda e nenhuma sombra flutuando embaixo. Ela inteira no quadro, nunca cortada pela borda; a de perto, mais rasa, ganha desfoque de foco. Enfeitando o fundo, ela é cenário: para ser assunto, ela age (estoura, se junta, carrega o olho)
- **parâmetros**: de 1 a 3 por quadro, de 160 a 210 px de diâmetro no 1920 × 1080; a de perto com desfoque de 12 px; a deriva de 10 a 26 px em linha reta e velocidade constante; a cor recolorida para o destaque da peça pela matiz em OKLCH, nunca pintada por cima
- **som**: nenhum (a esfera que age leva o gesto da ação: `pop` no estouro, `whoosh-longo` na que atravessa)
- **realiza**: `mao` (o sombreamento por pixel num canvas, quadro a quadro pelo tempo da linha do tempo; não há bloco no registro)

## O que não entra

### comum.efeito.glitch-e-hud-na-marca-sobria
- **estado**: recusado
- **quando**: —
- **regra**: o glitch, a linha de varredura, o laser verde e o HUD de ficção na marca sóbria: são ficção científica, que a marca sóbria não fala
- **parâmetros**: —
- **som**: —
- **realiza**: —
