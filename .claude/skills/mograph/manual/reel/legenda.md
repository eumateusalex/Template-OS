# A legenda do Reel

A legenda da fala e a palavra-chave no vertical de feed: quando cada estilo entra, por quê, e os
números medidos em presets de título e legenda e em Reels decompostos.
A legenda renderizada é da `/cortes`: a gramática e o planejador estão em
`.claude/skills/cortes/legenda.md`, e cada estilo é uma ficha em `.claude/skills/cortes/reel/legendas/`.
Aqui fica o quando e o porquê; a ficha é o como, e a entrada aponta a ficha que a realiza.

As vozes, o tamanho e a medida do texto são de `comum.tipografia.duas-vozes` e
`comum.tipografia.medidas`; o brilho da chave é `comum.efeito.brilho-na-chave`; o reflexo lento na
chave é `comum.efeito.varredura-de-luz`; a linha que se compõe antes e só acende no lugar é
`comum.tipografia.linha-no-lugar-final`; a palavra entrando letra a letra é recusada
(`comum.tipografia.letra-por-letra`). A cor da chave é sempre o destaque do kit, por token.

**No plano**: o modo vai no campo `legenda` (`roteiro.md` § 3), a palavra atrás da cabeça no campo
`atras`, e a ficha na `peca.json` da `/cortes`.

## Qual legenda em cada cena

### reel.legenda.por-tipo-de-cena
- **estado**: firme
- **quando**: toda cena do falado. **Não quando**: o Reel puro, sem a fala de quem grava
- **regra**: com a pessoa na tela, a fala inteira nas duas vozes; quando a animação toma a tela, só a palavra-chave, no lugar que o rosto ou a animação deixam. A animação já carrega a palavra, e a frase inteira em cima disputa o olho
- **parâmetros**: `legenda` e `legenda-interface` em `L2`; `meia-tela` e `tela-cheia` em `L1`; o `plano.mjs conferir` avisa a cena com a pessoa em `L1` e a tela cheia em `L2`
- **som**: nenhum
- **realiza**: `motor:legenda`

### reel.legenda.bastidor-simples
- **estado**: proposta
- **quando**: o Reel de bastidor, a resposta rápida em selfie, a caixinha. **Não quando**: o Reel de vitrine, de cliente ou de venda, que pede as duas vozes
- **regra**: no bastidor a legenda é uma linha branca, sem chave, sem caixa e sem som, só com a sombra que a deixa ler sobre a imagem. O método completo é para o Reel que mostra trabalho; no bastidor ele pesa
- **parâmetros**: 2 a 5 palavras por bloco; branco seminegrito com sombra; a ficha `.claude/skills/cortes/reel/legendas/sombra.json` (72 px, peso 800, até 3 palavras, entrada por corte) é a que realiza
- **som**: nenhum
- **realiza**: `motor:legenda`

## As duas vozes no tempo da fala

### reel.legenda.cadencia-das-duas-vozes
- **estado**: firme
- **quando**: a legenda corrida em `L2`. **Não quando**: a cena em `L1`, que só tem a chave
- **regra**: o apoio é o ponteiro e a chave é a âncora: o apoio entra uma palavra por vez, no começo da palavra falada, e a chave entra no quadro em que é dita e segura a frase inteira enquanto o apoio troca embaixo ou em cima. Uma chave por frase, nunca duas na mesma tela (salvo a lista, que vira elemento); frase sem palavra de peso fica só no apoio. As vozes, a proporção e o encaixe são de `comum.tipografia.duas-vozes`
- **parâmetros** (30 qps): a fala corre a 2,5 a 4,0 palavras/s; o apoio de 43 a 69 px (mediana ~52), a chave de 105 a 217 px (mediana ~130), a razão de 2,0 a 3,6 (mediana 2,5); entre uma palavra de apoio e a seguinte, 2 a 13 q (as escadas dos presets); de 2 a 8 palavras de apoio na tela, até 5 por linha; a chave segura de 2,1 a 7,3 s (mediana ~4 s) e volta a cada 3 a 5 s; o apoio adianta 0 a 4 q da sílaba (a ficha usa 1 q)
- **som**: nenhum (o som da chave é de `reel.legenda.entrada-da-chave`)
- **realiza**: `motor:legenda`; `biblioteca:palavra-em-duas-vozes`; `registro:caption-editorial-emphasis`; `registro:caption-weight-shift`

### reel.legenda.apoio-em-escada
- **estado**: proposta
- **quando**: a frase de apoio de 3 a 7 palavras com uma chave no fim, no título de seção ou no gancho. **Não quando**: a legenda corrida do Reel inteiro (cansa); a frase que não cabe em três degraus
- **regra**: cada palavra do apoio nasce no seu tempo e no seu lugar, um degrau abaixo e ao lado da anterior, e a chave fecha a escada embaixo, alinhada pela borda esquerda do apoio. A frase se lê como quem desce, e a chave é o chão
- **parâmetros** (30 qps): começos de 0, 3, 7, 13, 19, 25 q; 0, 3, 9, 15; 0, 7, 13, 25, 26, 42; 0, 2, 9, 19, 37, 45, 47; o apoio em itálico ou regular de 51 a 61 px, a chave de 127 a 194 px; na `/cortes`, o `legenda.json` pede a frase em `escada` (`.claude/skills/cortes/legenda.md`) e o degrau é o `encaixe.degrau_x_px` da ficha (60 px), com o `encaixe.alinha: "esquerda"`
- **som**: nenhum
- **realiza**: `motor:legenda`

## O lugar

### reel.legenda.lugar-pelo-rosto
- **estado**: proposta
- **quando**: toda legenda e toda chave de título no falado. **Não quando**: o Reel puro, em que o lugar é da composição
- **regra**: a legenda corrida fica na faixa do peito, abaixo do queixo; o título da seção fica na faixa acima da cabeça. Um lugar só por peça para a legenda corrida, nunca entre o cabelo e o queixo, e sempre dentro da zona do destino. A zona não se mede de novo: é a do `.claude/skills/video/ferramentas/formatos.json`, e o planejador da `/cortes` escolhe o lugar pelo `rosto` da `peca.json`
- **parâmetros**: a faixa do peito em y ≈ 1050 a 1300 px; a faixa da cabeça em y ≈ 350 a 600 px; o bloco encosta 40 px abaixo do queixo; a zona do `reel` vai de 220 a 1540 px, a do `anuncio-reels` de 270 a 1248 px (o `formatos.json`)
- **som**: nenhum
- **realiza**: `motor:legenda`

## A entrada e a saída

### reel.legenda.entrada-do-apoio
- **estado**: proposta
- **quando**: cada palavra do apoio na legenda corrida. **Não quando**: o título de seção, que entra por movimento (`reel.legenda.chave-de-secao`)
- **regra**: a palavra do apoio entra por opacidade e por um desfoque que limpa, subindo pouco: o desfoque que limpa é o movimento, e a linha não reflui (`comum.tipografia.linha-no-lugar-final`). É a exceção da legenda a `comum.movimento.entra-por-movimento`; o desfoque é só desta entrada e termina em zero (`comum.movimento.desfoque-em-toda-saida` segue valendo no resto)
- **parâmetros** (30 qps): 8 q; desfoque de 10 a 0 px; sobe até 18 px (medido: ~12 px em 7 q); curva `pouso`; até 2 q antes da fala. Os presets guardam 15 a 41 q (mediana 27) na subida e 22 a 28 q na subida com desfoque, mas a parte que se vê mexer acaba em 7 a 9 q
- **som**: nenhum
- **realiza**: `motor:legenda`; `curva:pouso`

### reel.legenda.entrada-da-chave
- **estado**: proposta
- **quando**: a palavra-chave da legenda corrida. **Não quando**: a chave do título de seção (`reel.legenda.chave-de-secao`)
- **regra**: a chave entra no lugar, sem subir e sem escala, por opacidade e um desfoque maior que o do apoio, no quadro em que é dita e depois do apoio que a prepara assentar; o brilho nasce com ela e some. O som e a entrada chegam uns quadros antes da sílaba: antecipa-se o toque, nunca se acelera a voz
- **parâmetros** (30 qps): 7 a 9 q (medidos: 7 a 8 q; a serifada, 8 e 9 q); desfoque de 14 a 0 px; curva `esse`; ~12 q depois de o apoio assentar; o brilho sobe até ~1 q depois da entrada e decai em 18 q (`comum.efeito.brilho-na-chave`)
- **som**: `pop`, pico no primeiro quadro da chave (o gesto de destaque de `comum.som.destaque-e-final`)
- **realiza**: `motor:legenda`; `curva:esse`; `biblioteca:brilho-no-instante`

### reel.legenda.saida-seca
- **estado**: proposta
- **quando**: o fim de cada frase da legenda. **Não quando**: a última frase, que fica até o último quadro (a chamada)
- **regra**: a legenda não tem saída animada: a frase inteira some de uma vez, acabando no quadro em que a próxima entra, e as duas nunca se cruzam no mesmo lugar. A chave dita perto da próxima ainda fica nítida uns quadros antes de sair
- **parâmetros** (30 qps): nenhum dos 77 presets tem animação de saída (as 254 animações são todas de entrada); nos Reels medidos a saída é um fade de 5 a 8 q; na `/cortes`, 2 q na curva `saida`, sem cruzar, e a chave fica 4 q nítida antes (a ficha `duas-vozes.json`)
- **som**: nenhum
- **realiza**: `motor:legenda`; `curva:saida`

## A palavra-chave com volume

### reel.legenda.chave-com-volume
- **estado**: proposta
- **quando**: a chave do título de seção, uma por cena. **Não quando**: a legenda corrida (a chave chapada basta e o volume em toda frase vira enfeite); a peça de tom sóbrio em que o brilho não entra
- **regra**: a chave ganha corpo com três camadas da mesma palavra: a sombra escura deslocada para baixo e para a direita, o brilho claro deslocado para cima e para a esquerda, e a cor do meio por cima; o brilho em volta nasce na entrada e decai, e um reflexo fino e inclinado atravessa a palavra uma vez, devagar (`comum.efeito.varredura-de-luz`). As três cores saem do mesmo token do destaque (o tom escuro, o claro e ele)
- **parâmetros**: a sombra desloca 1 a 4 px, o brilho 1 a 2 px; em código, `text-shadow: 3px 4px 0 <escura>, -1px -2px 0 <clara>`; o brilho em volta como `drop-shadow(0 0 22px <cor>)`, pico ~0,4, decaindo em 18 q; o reflexo é uma faixa de 0,7 a 3,9% da altura (13 a 75 px), inclinada −44° a −60°, borda suave 0,18 a 0,30, atravessando em 39 a 300 q (1,3 a 10 s). Registro da relação, não da cor: escura #190031 / clara #ffffff / meio #8e53f0; ou #003e39 / #93fff3 / #00ffe8. Na `/cortes`, o `duas_vozes.chave.material: "volume"` da ficha calcula a escura (cada canal × 0,2) e a clara (60% ao branco) da cor da chave, e o reflexo passa em `chave.volume.reflexo_q` (45 q)
- **som**: nenhum (soa a entrada da chave)
- **realiza**: `motor:legenda`; `biblioteca:brilho-no-instante`; `registro:light-sweep-pass`

### reel.legenda.voz-serifada
- **estado**: proposta
- **quando**: a peça cujo estilo pede a chave em serifa, como contraste com o apoio sem serifa. **Não quando**: uma chave serifada solta numa peça sem serifa (`comum.tipografia.chave-em-serifa`); a marca que não tem fonte serifada
- **regra**: a chave em serifa pesada contrasta com o apoio leve sem serifa, e a diferença de desenho faz o trabalho que a cor faz nas outras vozes: a chave pode ficar branca, com o destaque só no brilho. A chave entra pelo desfoque que limpa, sem deslocar, e o apoio fica alinhado pela borda esquerda dela. A serifa é a livre do estilo da peça, nunca a do pacote; o itálico do método vira opção a testar, não padrão
- **parâmetros** (30 qps): a chave de 127 px contra o apoio de 40 a 61 px (razão de 2,1 a 3,2); a chave entra em 8 a 9 q com desfoque; o apoio com desfoque, nas escadas de 0, 27, 35 q e 0, 23, 34 q; na `/cortes`, uma ficha com a serifa da marca (de licença aberta, em `_marca/fontes/`) na chave, com o apoio alinhado à esquerda
- **som**: nenhum
- **realiza**: `biblioteca:chave-em-serifa`; `motor:legenda`

### reel.legenda.chave-de-secao
- **estado**: proposta
- **quando**: o título de uma parte do Reel, o gancho escrito, a palavra que resume o momento. **Não quando**: a legenda corrida; mais de uma por cena
- **regra**: a chave vira título de seção na faixa acima da cabeça e chega por movimento, ao contrário da legenda corrida: vem de lado, passa um pouco e volta, ou chega maior e treme até assentar. Na exceção do título-bomba ela chega a ocupar a largura, e o apoio vira uma etiqueta pequena ao lado
- **parâmetros** (30 qps): a chave segura 3,8 a 4,4 s; a entrada de lado em 10 a 12 q, `x` 80 → 0 px, opacidade nos 4 primeiros q, curva `batida` (estimada; o arquivo do preset guarda 23 a 58 q, mediana 46); a de tremor, escala 1,25 → 1 na `quique` com giro de ±4° caindo a zero em 9 q (12 q no total, est.); a subida medida à mão: sobe 238 px, passa 38 e volta em 15 q; o título-bomba tem 4,6 a 5,6 vezes o apoio; na `/cortes`, o `legenda.json` pede a frase em `secao` com a entrada `lado` ou `tremor` (`.claude/skills/cortes/legenda.md`), e o planejador a põe na faixa acima da cabeça
- **som**: `whoosh-curto`, pico no quadro em que a chave passa do lugar
- **realiza**: `motor:legenda`; `curva:batida`; `curva:quique`

## O que marca a chave

### reel.legenda.traco-na-chave
- **estado**: proposta
- **quando**: a palavra que a fala aponta, quando a cor e o tamanho já não bastam ou a ficha é de uma voz só. **Não quando**: em toda frase; dois traços na mesma palavra (o sublinhado com o anel); a palavra de ligação
- **regra**: um traço se desenha na chave enquanto ela é dita, de um destes quatro jeitos e um só por peça: o sublinhado que cresce embaixo, o marca-texto que cresce atrás, a faixa que varre a palavra de um lado ao outro, ou o anel à mão em volta. O traço é da cor do destaque e acaba antes de a frase sair
- **parâmetros** (30 qps): o sublinhado cresce de 1 a ~240 px em 76 q (8 → 84 q) e assenta; o marca-texto cresce de 63 a 421 px de largura em 88 q, com cantos de ~11 px; a faixa varre em 80 q; o anel se desenha em 12 q (medido no Reel); na `/cortes`, o `duas_vozes.chave.traco: { "tipo": ... }` da ficha pede o tipo, e o traço acaba 4 q antes de a chave sair
- **som**: nenhum
- **realiza**: `biblioteca:sublinhado-que-se-desenha`; `biblioteca:anel-a-mao`; `motor:legenda`

### reel.legenda.chave-em-pilula
- **estado**: proposta
- **quando**: a palavra ou o bloco que precisa ler sobre fundo agitado, ou a etiqueta curta ao lado do título. **Não quando**: a legenda corrida inteira em pílulas; a chamada do fim, que é `comum.componentes.pilula-de-acao`
- **regra**: a palavra entra dentro de uma caixa de cor de cantos redondos: a caixa nasce primeiro e o texto chega logo depois, e a caixa pode ter um brilho em volta. A caixa é a branca da ficha de bloco ou a pílula de vidro da chave, nunca a cor do assunto
- **parâmetros** (30 qps): o texto entra 6 a 21 q depois da caixa; a caixa cresce com mola em ~15 q (`molaTarde`, est.); o brilho da pílula em néon; a ficha `.claude/skills/cortes/reel/legendas/pilula.json` (preto sobre branco, 66 px, até 3 palavras, entrada `pop`) e o material `vidro` da chave (o `duas_vozes.chave.material` do `legenda.json` da peça, `.claude/skills/cortes/legenda.md`)
- **som**: `pop`, pico no quadro em que a caixa assenta
- **realiza**: `motor:legenda`; `curva:molaTarde`

## A palavra atrás da cabeça

### reel.legenda.palavra-atras-da-cabeca
- **estado**: proposta
- **quando**: o momento mais forte do falado, uma vez por Reel. **Não quando**: mais de uma vez (vira truque); a gravação com a câmera tremida ou o cabelo que se confunde com o fundo
- **regra**: a palavra grande sobe de trás da cabeça de quem fala: só o contorno da cabeça se recorta, e a pessoa fica no fundo real. Não é a pessoa recortada do fundo, que segue recusada. A palavra e a legenda dividem a faixa acima da cabeça, então nunca ficam juntas: a frase que cairia nela espera, e a palavra entra na primeira sílaba da palavra que a anuncia. Como montar no motor é do `cenas.md`
- **parâmetros**: Inter 900; o soco de 1,05 e a saída de 0,3 s; nos Reels medidos a palavra fica de 4,4 a 7,3 s e mora na faixa da cabeça (y ≈ 350 a 600 px)
- **som**: nenhum
- **realiza**: `motor:atras`; `biblioteca:texto-atras-da-pessoa`; `registro:caption-parallax-layers`
