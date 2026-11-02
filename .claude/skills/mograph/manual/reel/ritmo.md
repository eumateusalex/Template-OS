# O ritmo do Reel

O tempo do vertical de feed: o gancho, a cadência dos cortes, o rosto que volta, a montagem na
música, a transição própria do feed, o loop e o som medidos em Reels decompostos. O que vale em
qualquer peça mora em `comum/estrutura.md` (algo novo a cada 1,5 a 3 s, o quadro zero, a vírgula, o
fim), `comum/transicao.md` (a corrente para cima no 9:16, o corte na batida) e `comum/som.md` (um som
por ação, o pico no acerto, o destaque e o final); aqui fica só o que o feed muda. A composição de
cada cena é `reel/cena.md`; o tempo da legenda é `reel/legenda.md`. No falado, o corte das tomadas e
o som são da `/cortes` (`.claude/skills/cortes/gravacao.md`).

**No plano**: a ordem dos `tipo` das cenas dá o gancho e o rosto que volta, que o `plano.mjs`
confere; a `transicao` e o `tempo_forte` dão a montagem na música; o `formato` dá o post do feed.

## O gancho e o rosto

### reel.ritmo.gancho-com-o-rosto
- **estado**: proposta
- **quando**: a primeira frase do falado. **Não quando**: a abertura com prova real, escolhida na prancha (`reel.cena.abertura-com-prova-real`); o Reel puro, que abre pelo `comum.estrutura.quadro-zero`
- **regra**: a primeira cena é a pessoa em tela cheia falando, com o gancho escrito: quem assiste decide em 1 a 2 s se fica, e o rosto falando é o que segura. A palavra do assunto vem dita e escrita no mesmo instante, antes dos 3 s
- **parâmetros**: a cena 1 é `legenda` (o `plano.mjs` avisa o contrário); o assunto dito e escrito até 3 s; dos 3 primeiros segundos vem quase metade do valor de uma campanha de vídeo (47%), dos 10 primeiros 74%
- **som**: nenhum
- **realiza**: `motor:tipo=legenda`

### reel.ritmo.rosto-que-volta
- **estado**: proposta
- **quando**: a ordem das cenas do falado. **Não quando**: o Reel puro, sem o rosto
- **regra**: a tela cheia é cara: vai na frase que mostra, nunca em duas frases seguidas que só conectam, e o rosto volta antes de o espectador esquecer quem fala. Conta como rosto a cena de legenda, a de interface e a meia tela
- **parâmetros**: o rosto volta pelo menos a cada 8 s (o `plano.mjs` avisa acima)
- **som**: nenhum
- **realiza**: `motor:tipo`

## A cadência

### reel.ritmo.cadencia-dos-cortes
- **estado**: proposta
- **quando**: medir a peça vertical de 15 a 60 s pela duração. **Não quando**: o respiro depois do pico (o `respiro` do plano)
- **regra**: o piso é `comum.estrutura.algo-novo`; no feed, quanto mais curta a peça, mais curta a troca. Entre 3 e 7 s a atenção cai: ali entra a troca mais forte do primeiro ato (o primeiro elemento, a primeira tela cheia). No miolo denso, os elementos chegam um por frase forte, e a última frase pode ficar sem nada
- **parâmetros**: 15 s com 8 a 12 cortes (um a cada 1,2 a 1,8 s); 30 s com 15 a 20 (um a cada 1,5 a 2 s); a queda de atenção entre 3 e 7 s; num Reel falado medido, 9 entradas de elemento entre 45 e 61 s (uma a cada ~1,8 s) e a última frase, de 2,5 s, sem nenhuma (números de blog e de uma peça só: ordem de grandeza)
- **som**: nenhum (cada elemento traz o som dele, `comum.som.um-por-acao`)
- **realiza**: `motor:de`; `motor:ate`

### reel.ritmo.montagem-na-batida
- **estado**: proposta
- **quando**: o Reel montado de planos curtos sobre a música (a viagem, o produto, o bastidor, os takes gerados). **Não quando**: o falado e o puro com voz, em que a voz manda no tempo
- **regra**: a montagem começa na virada da faixa, achada na onda; cada plano dura cerca de um segundo e muda o enquadramento (o recorte ou o zoom do próprio plano) na batida; o corte espera a ação do plano acontecer (a bandeira subir) antes de cair. A trilha medida antes do plano e o corte na batida são `comum.som.vem-primeiro` e `comum.transicao.corte-seco`
- **parâmetros** (30 qps): planos de 30 q, apertados a 27 q (0,9 s) para caber mais um; a peça de 15 s; o material gravado com folga de resolução para o recorte (`reel.cena.enquadramento-da-gravacao`)
- **som**: nenhum (é a trilha que manda)
- **realiza**: `motor:transicao=corte`; `motor:tempo_forte`

## O feed

### reel.ritmo.feed-que-rola
- **estado**: proposta
- **quando**: a transição que mostra a presença da pessoa (o perfil, a página, o canal) e leva ao vídeo seguinte; uma vez por peça. **Não quando**: o perfil ou a página não são dela; o print que não existe (nunca a interface da rede redesenhada, `comum.componentes.interface-de-produto-real`)
- **regra**: a gravação encolhe num círculo sobre a foto do perfil num print de página inteira (`reel.cena.rosto-no-circulo`); o print rola para cima como o feed, sem ir até o fim, e um contêiner leva o print e dá o zoom até o quadro escurecer, onde emenda o próximo vídeo. A rolagem segue a corrente do vertical (`comum.transicao.corrente`); o contêiner é o `comum.camera-e-luz.camera-virtual`
- **parâmetros** (30 qps): a rolagem em ~30 q, acelerando no meio e assentando, com o borrão de movimento (`comum.movimento.gramatica-do-borrao`); o zoom do contêiner em ~30 q; o print de página inteira (um de referência tinha 1237 × 8000 px, não conferido), a captura real (`captura` nos `ativos` do plano)
- **som**: `rolagem`, pico no meio da rolagem; `whoosh-curto` no zoom, pico no quadro escuro
- **realiza**: `curva:camera`; `mao`

### reel.ritmo.loop-do-feed
- **estado**: proposta
- **quando**: o post animado do feed (1080 × 1350) e o Reel puro curto, que o feed repete sozinho. **Não quando**: a peça que fecha numa assinatura (`comum.estrutura.o-fim`); repetir a animação dentro da peça para encher a duração, que lê como espera (`comum.estrutura.balanco-em-laco`)
- **regra**: o último quadro emenda no primeiro, sem salto: a peça termina no estado em que começa, e a repetição do feed vira continuação. A peça se constrói em camadas que entram uma depois da outra (a imagem que entra de lado e assenta, o título, a chamada), cada uma no tempo de leitura dela
- **parâmetros** (30 qps): 1080 × 1350, 15 s (450 q); na referência, o título aparece em 15 q, a imagem entra de lado em ~30 q acelerando no começo e assentando, com borrão de movimento; a emenda a até 1 q do quadro 0 (o estilo `laco` da `/video` faz o mesmo para o cartão do site, `.claude/skills/video/estilos.md`)
- **som**: nenhum (a trilha recortada para emendar no quadro 0, `comum.som.final-da-faixa`)
- **realiza**: `motor:formato=meta-feed-4x5`; `mao`

## O som do método

### reel.ritmo.cama-de-teclado
- **estado**: proposta
- **quando**: uma peça de teste do falado, para a pessoa ouvir. **Não quando**: como padrão; o tom sóbrio em que o teclado contínuo soa barulho
- **regra**: um teclado baixo e contínuo por baixo de toda a legenda, do primeiro ao último quadro, como a cama da fala; os outros sons do método (a entrada, o destaque, a logo, a surpresa, o valor) são os de `comum.som.um-por-acao` e `comum.som.destaque-e-final`, e o toque se antecipa sem acelerar a voz (`comum.som.pico-no-acerto`)
- **parâmetros**: o arquivo do método vem a −29 a −31 LUFS, ~15 dB abaixo de uma voz normalizada; o teste a ~−22 dB da voz; o Reel inteiro (27 s no painel medido)
- **som**: `cama` (o teclado contínuo), do quadro 0 ao fim
- **realiza**: `kit:som`

### reel.ritmo.fecho-do-falado
- **estado**: proposta
- **quando**: a última frase do falado. **Não quando**: o Reel que fecha no CTA com a chamada em dois tempos (aí é `comum.estrutura.o-fim`, que segue valendo)
- **regra**: a última frase volta ao rosto sem elemento novo, só a pessoa, a legenda e, na peça com partes, o elemento que volta inteiro (`comum.componentes.elemento-que-volta`); quando a marca assina, a logo entra pelo `reel.elemento.flash-da-logo` e o quadro escurece até o fim. O fim é menor que o pico
- **parâmetros** (30 qps): a última frase sem elemento (2,5 s no Reel medido); da logo ao fim, o quadro escurecendo
- **som**: o da logo (`reel.elemento.flash-da-logo`); `riser`, pico no último quadro
- **realiza**: `motor:tipo=legenda`
