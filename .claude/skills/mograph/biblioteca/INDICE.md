# A biblioteca de comportamentos

> Gerado por `ferramentas/biblioteca.mjs indice` a partir de `catalogo.json`. Não se edita à mão.

## Visto, sem decisão

| Comunica | Comportamento | Id | Família | Motores |
|---|---|---|---|---|
| a espera que faz a pessoa desistir | a página em esqueleto com a barra de carga que anda e trava; na perda, a página sobe e vai embora | `pagina-que-nao-termina-de-carregar` | STANDARD | regra:stat-bars-and-fills |
| a frase inteira cabe na leitura, e o ritmo da música vira o ritmo da leitura | a frase do gancho se monta uma palavra por batida, empilhada em linhas grandes; a cada batida o fundo inteiro troca de cor e as palavras já na tela trocam a cor com ele; a última palavra leva o degradê da marca | `frase-empilhada-na-batida` | HERO | — |
| a ideia chegou: leia isto agora | a frase sobe de dentro de uma linha invisível, palavra por palavra, e assenta | `frase-que-sobe-da-linha` | STANDARD | regra:waterfall-entry, regra:kinetic-type-beats |
| a lista vira ritmo: cada passo tem um nome e uma prova na tela | três palavras curtas entram uma por batida como adesivo (bloco de cor com a palavra, inclinado, de 1,45 a 1) acima do site, e o fundo atrás troca de cor junto; a parte do site que a palavra nomeia sobe ou cresce dentro do cartão | `adesivo-da-palavra-com-fundo-na-batida` | STANDARD | — |
| a marca assina | um retângulo de luz forte acende de 3 a 6 q, a logo branca entra logo depois e o quadro escurece | `flash-antes-da-logo` | HERO | — |
| a mesma ideia, mais funda; a troca de chão com causa | o objeto do fim da cena cresce até cobrir o quadro, e a cor dele vira o chão da cena seguinte | `objeto-que-cresce-e-vira-o-chao` | CAMERA | registro:iris-reveal, registro:zoom-through-transition |
| a mudança de um valor: antes e depois | o número sai rolando e o novo assenta no lugar | `numero-que-vira-outro` | STANDARD | regra:vertical-spring-ticker, regra:discrete-text-sequence |
| a nota que o cliente vê | as estrelas da avaliação enchem da esquerda até a nota, a última pela metade | `estrelas-que-enchem` | MICRO | registro:star-rating-fill |
| a oferta ou o aviso como coisa que chega no celular de quem assiste | a notificação do iOS no vidro do iOS (desfoque 20 px, saturação 180%, branco a 62% e a borda acesa) sobe 40 px sobre a foto e assenta; uma faixa de luz a atravessa uma vez; no verbo da ação (clique, toque) ela afunda 3% e escurece, como sob o dedo, e volta | `notificacao-de-vidro-tocada` | STANDARD | registro:liquid-glass-notification |
| a página que não carrega é a nota baixa: a medida vira a experiência de quem abre | a barra de endereço do Safari no pé da tela, com o cadeado e o endereço; a linha azul de carregamento anda com a medida da cena, na mesma curva, e trava onde a medida trava, pulsando uma vez fraca | `barra-do-safari-que-carrega` | STANDARD | — |
| a palavra é uma coisa: o canal, o objeto | a palavra-chave numa pílula com o ícone do assunto, que pousa com a mola tarde | `pilula-com-icone-que-pousa` | STANDARD | — |
| a palavra está no mesmo espaço da pessoa; peso de capa de revista | a palavra grande (Inter 900) sobe de trás da cabeça de quem fala: só o contorno da cabeça se recorta, e a pessoa fica no fundo real dela | `texto-atras-da-pessoa` | HERO | proprio:falado-atras (o campo "atras" do plano.json; ferramentas/falado-extra.mjs e falado.js, montado pelo montar-falado.mjs), registro:caption-parallax-layers |
| a palavra que tem objeto vira coisa (demora vira despertador) | o emoji oficial (160 px, no tamanho dele) pousa ao lado da cabeça na palavra que tem objeto e treme duas vezes (8° em 2 quadros), como o despertador tocando; sai mais curto que entrou | `emoji-que-toca` | MICRO | — |
| a pessoa do outro lado: o que ela procurou antes de ver o resultado | o campo de busca da interface se digita uma letra a cada 2 quadros, com o cursor piscando antes e sumindo quando a página responde, e um clique de tecla por letra (dois cliques alternados, o espaço mudo) | `busca-que-se-digita` | MICRO | registro:typed-prompt |
| acompanhar um número no tempo, sem prometer que ele sobe | a linha do gráfico se desenha no ritmo da fala, com altos e baixos, e o ponto de agora acende no fim | `linha-que-anda-com-a-voz` | STANDARD | regra:svg-path-draw, regra:chart-scrub-readout |
| alguém (o Google, a máquina) está lendo isto | uma barra fina varre o texto de um lado ao outro, como quem lê | `leitura-que-varre` | STANDARD | regra:css-marker-patterns |
| alguém está respondendo | três bolinhas de 9 px sobem em onda (−3·max(0, sin(9t − 0,9j)) px) até 0,42 s antes da mensagem chegar | `pontinhos-digitando` | MICRO | — |
| alguém está usando de verdade | o cursor anda em curva, para antes do alvo, aperta (0,71 a 0,9) e o alvo responde 1 quadro depois (0,63 a 0,81), sem anel | `cursor-que-estaciona` | MICRO | — |
| aqui foi tocado | dois anéis de 3 px abrem do ponto tocado, de 40 px a R e a 0,72 R, com 0,09 s entre eles, e somem em 0,65 s | `onda-do-toque` | MICRO | — |
| aqui: este é o momento | o brilho nasce no quadro em que o objeto ou a palavra pousa, e decai em meio segundo; ou uma faixa de luz atravessa uma vez | `brilho-no-instante` | MICRO | registro:beat-accent, registro:gloss-sweep, registro:text-shimmer, registro:light-sweep-pass |
| bateu: isto pesa | a câmera treme 3 quadros no impacto e assenta | `tremor-no-impacto` | MICRO | registro:camera-shake, registro:beat-accent |
| chegou uma coisa nova | o cartão da notificação cresce do centro (escala 0,01 a 1) e o texto entra depois | `notificacao-que-cresce-do-centro` | STANDARD | — |
| deu errado, não pode | o objeto chacoalha de lado poucas vezes, como a cabeça que diz não | `tremor-do-nao` | MICRO | — |
| é a mesma coisa, agora em outro estado | o cartão gira em Y no próprio eixo e, no meio do giro (de perfil), troca de face: a notificação vira o chip, o botão vira a logo, a roupa troca | `cartao-que-gira-e-troca` | CAMERA | — |
| é a mesma coisa, continuando | o objeto que sai e o que entra estão no mesmo lugar, do mesmo tamanho, e o corte cai no meio do movimento | `corte-pelo-objeto` | CAMERA | registro:match-cut, registro:text-match-cut, registro:type-match-cut, registro:cut-the-curve |
| é esta | um traço à mão se desenha em volta da palavra | `anel-a-mao` | MICRO | — |
| esta é a palavra que importa | um traço se desenha embaixo da palavra no instante em que ela é dita | `sublinhado-que-se-desenha` | MICRO | regra:css-marker-patterns, regra:svg-path-draw |
| esta é a palavra que importa | na mesma frase, a palavra-chave entra grande (2,0 a 3,6 vezes o apoio, mediana 2,5), pesada e no azul da marca, e o resto fica pequeno e branco na mesma família (Inter 4); a chave segura a frase inteira enquanto o apoio entra palavra por palavra | `palavra-em-duas-vozes` | STANDARD | registro:caption-editorial-emphasis, registro:caption-weight-shift, registro:variable-font-flex |
| esta é a palavra que importa, com tom de revista | a palavra-chave numa serifa livre (Instrument Serif, OFL), branca, sem recorte; o azul só no brilho | `chave-em-serifa` | STANDARD | — |
| este saiu, este entrou | a ficha perde a cor do avatar para o cinza em 0,35 s e ganha um véu de 58% (apaga), ou o véu sai de 55 a 0% em 0,3 s (acende) | `ficha-que-apaga-e-acende` | MICRO | — |
| excesso: coisa demais chegando | as notificações caem uma sobre a outra, cada vez mais rápido, até lotar | `notificacoes-que-se-acumulam` | HERO | regra:spring-pop-entrance, regra:overwhelm-surround |
| filmado, não renderizado | um grão fino cobre o quadro inteiro e muda a cada 2 quadros | `grao-de-pelicula` | MICRO | registro:grain-field, registro:grain-overlay |
| foi descartado | o objeto sobe um pouco e cai acelerando, encolhendo de 46 a 30 e girando | `queda-com-gravidade` | STANDARD | — |
| foi tocado, e respondeu | o botão afunda 6% em 2 quadros e volta com mola; o cartão tocado desce 18 px em 0,16 s e volta com mola em 0,55 s | `clique-que-pula` | MICRO | — |
| isto acontece no celular de quem assiste | o celular entra de baixo, desacelera e pousa no centro, com a tela já viva | `celular-que-chega-e-pousa` | CAMERA | regra:device-surface-showcase, regra:spring-pop-entrance |
| isto acontece no celular do seu cliente | o celular de verdade, em 3D, gira para a câmera com a tela viva e a luz correndo no vidro | `aparelho-real-em-3d` | HERO | registro:vfx-iphone-device, registro:ios26-liquid-glass |
| isto é real e tem valor | o objeto da ideia em 3D gira devagar sob uma luz que corre pela superfície e pousa | `objeto-3d-na-luz` | HERO | registro:product-turntable, registro:extruded-logo, registro:glass-hero |
| isto vem do app e volta para ele | o objeto sai do aparelho com escala 0 e voa até o lugar; na troca, volta pelo mesmo caminho | `nasce-da-tela-e-volta` | STANDARD | — |
| leia já | a palavra do gancho entra inteira em 2 a 4 quadros, sem letra por letra | `chave-em-2-quadros` | MICRO | — |
| nada que valha o defeito | a pessoa da gravação recortada do fundo real e colada sobre outro fundo | `pessoa-recortada-do-fundo-real` | STANDARD | — |
| o app mudou de tela | a tela nova entra de lado, de x 750 para 250, e a velha anda só 150 px (o parallax), com sombra de 16% na borda da nova | `push-de-tela` | CAMERA | — |
| o atendimento acontecendo (ou não acontecendo) | as mensagens chegam uma a uma e empurram as de cima, como na conversa de verdade | `conversa-que-sobe` | STANDARD | regra:dynamic-content-sequencing, regra:agent-progress-theater |
| o lugar ou a coisa de que a frase fala, com volume | o ícone oficial do app pousa com sombra de contato e a luz passa por ele uma vez | `icone-3d-que-pousa` | STANDARD | proprio:falado-midia (o campo "midia" da cena no plano.json do falado; ferramentas/falado-extra.mjs), registro:badge-pop |
| o nome disto é (o rótulo que explica o principal) | uma linha curta se estica e abre uma etiqueta com o nome ou o número | `etiqueta-que-abre-da-linha` | MICRO | regra:anchored-layout-expand |
| o número é medido, não enfeite | o número troca um valor por quadro, em passos que diminuem, e o valor de dado termina quebrado | `contador-por-quadro` | MICRO | — |
| o que falta ou está errado numa coisa que parece pronta, medido no lugar | duas guias finas se desenham ao longo do próprio caminho e cruzam o quadro, o vão entre elas fica tracejado, e a etiqueta da medida pousa dentro dele | `guia-que-mede-o-vao` | STANDARD | regra:svg-path-draw |
| o que fazer agora | a ação final pousa numa pílula com seta, que afunda uma vez como um botão tocado | `pilula-de-acao` | STANDARD | registro:cta-close, registro:cta-lockup, registro:gesture-tap |
| o que todo mundo pensa está errado; o certo é isto | a palavra errada é riscada por um traço que corre, e a certa entra no lugar | `palavra-riscada-e-trocada` | STANDARD | regra:css-marker-patterns, regra:svg-path-draw |
| o site é o que acende o negócio no meio dos outros: o símbolo vira a coisa | a câmera mergulha no cubo aceso da colmeia (escala 7, a colmeia desfoca atrás) e a tela do site nasce de dentro dele, opaca, do tamanho do cubo, crescendo até o lugar | `mergulho-no-cubo-que-vira-tela` | CAMERA | — |
| o site leva à conversa: a causa e o efeito na mesma tela | o toque no botão do WhatsApp (afunda a 0,95, anel azul que abre) e os balões da conversa nascem do botão, pequenos, e sobem até o lugar deles, a pergunta e depois a resposta | `baloes-que-nascem-do-botao` | MICRO | — |
| o tamanho de algo, medido | o número conta de zero até o valor e freia no fim, sem passar | `contador-que-sobe-e-assenta` | HERO | regra:counting-dynamic-scale, regra:dataviz-countup |
| o trabalho mudou isto | dois cartões: o antes menor e inclinado atrás, o depois maior na frente, o rótulo numa pílula em cima | `vitrine-antes-e-depois` | STANDARD | — |
| olhe aqui, agora | a câmera dá um salto de 1 quadro (de 56 a 77% do caminho) e completa com uma cauda de 9 a 18 q | `estalo-de-camera` | CAMERA | — |
| olhe para cá agora | o foco sai de um plano e vai para o outro: o de frente desfoca e o de trás nítida | `foco-que-troca` | CAMERA | regra:depth-of-field-blur, registro:rack-focus, registro:focus-rack |
| onde estamos na explicação, e que ela acabou | o marcador das partes (1, 2, 3) volta a cada parte enchendo a seguinte, e fecha completo | `partes-que-enchem` | STANDARD | regra:stat-bars-and-fills, regra:discrete-text-sequence |
| profundidade: estamos entrando na cena | a câmera avança devagar e as camadas andam em velocidades diferentes (frente, meio, fundo) | `camera-que-empurra-em-camadas` | CAMERA | regra:viewport-change, regra:multi-phase-camera, regra:camera-journey |
| quanto custa, quanto se perde | o número que dói pousa num selo que passa um pouco do tamanho e volta, com brilho curto | `selo-com-o-valor` | STANDARD | registro:spring-pop, registro:count-up, registro:number-pop-in |
| tem prova, e é muita | fotos com borda branca de 6 a 10 px, inclinadas 5 a 12°, crescem do canto (0,09 a 0,25 → 1), uma depois da outra | `fotos-em-cascata` | STANDARD | — |
| tudo o que acontece tem um toque | um agente único que dá causa ao efeito: toca (escala 100 → 70 em 2 q e volta com mola em 0,3 s), liga, desenha a linha, abre a onda; espera no fim da legenda e some em 0,17 s entre cenas | `elemento-vivo` | STANDARD | — |
| uma ação simples resolve | o dedo ou o cursor toca, o botão afunda no mesmo quadro, e o toque dispara a próxima coisa | `toque-que-dispara` | MICRO | regra:cursor-click-ripple, regra:physics-press-reaction, regra:press-release-spring |
| uma coisa leva à outra | o objeto da cena cresce e se transforma no quadro da cena seguinte, sem corte | `cartao-que-vira-a-proxima-cena` | CAMERA | regra:card-morph-anchor, regra:scale-swap-transition, regra:cta-morph-press |
| uma coisa liga a outra | a linha se desenha de 0 a 100% puxada pelo elemento vivo | `linha-desenhada-pelo-agente` | STANDARD | — |
| velocidade real, não de computador | o que anda rápido borra no sentido do movimento, como numa câmera de verdade | `borrao-de-obturador` | MICRO | registro:motion-blur, registro:echo-trail |
| virou: agora é outra parte | uma luz quente vaza pelo quadro no corte e some, e a cena nova já está lá | `luz-que-vaza-na-virada` | STANDARD | registro:light-leak, registro:organic-light-leak-overlay, registro:editorial-flash-overlay, registro:flash-through-white |

