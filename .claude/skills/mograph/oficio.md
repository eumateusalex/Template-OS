# O ofício · como o sênior trabalha

A peça correta e pobre (tudo dentro das réguas, nada que segure o olho) é o
defeito que este módulo existe para matar: o vídeo neutro e básico demais para
ser motion design, quando o que se quer é o trabalho de alguém sênior.

Este módulo diz **como trabalhar**: a ordem, a arte-chave, a prancha, as
conferências. **O que pôr na tela** (a regra de cada técnica, com os números,
o som e o que a realiza) mora no manual (`manual/README.md`), uma entrada por
técnica, e a peça cita o id. Número de fonte é ponto de partida: a peça mede e
a crítica confere.

## 1 · A ordem de trabalho

O sênior não começa pelo código. A ordem, e o que cada passo entrega:

| # | Passo | Sai |
|---|---|---|
| 1 | **a ideia**: o que o negócio tem de próprio (o objeto, o gesto, o momento de sucesso, a voz) e três ideias de tipos diferentes, cada uma numa frase que prevê o que acontece na tela; o teste de cobrir o logo (`roteiro.md`, "A ideia") | as três frases no `brief.md` e a escolhida com o porquê |
| 2 | **o quadro que alguém mandaria a um amigo** | uma linha no `brief.md`: o lugar, a luz, o objeto, a ação |
| 3 | **a arte-chave**: o quadro herói de cada direção como imagem (§ 2), na prancha (§ 3) | 1 imagem por direção, vista antes do código |
| 4 | **o som primeiro**: a trilha medida, com o tom, e o mapa de tempo (`comum.som.vem-primeiro`) | `som.json` com batidas, drop, tom e os quadros dos acertos |
| 5 | o plano frase a frase, com a importância, o componente, o som e **o id do manual de cada técnica** | o `plano.json` |
| 6 | o quadro herói construído primeiro, em código, perseguindo a arte-chave | o `snapshot` do herói ao lado da imagem |
| 7 | o resto da peça, cena a cena, pelo manual, pela biblioteca e pelo kit | a peça |
| 8 | as conferências (§ 4) | réguas verdes, crítico, determinismo |

## 2 · A arte-chave

O quadro herói nasce como imagem antes do código, para que o código persiga um
alvo rico e não invente a partir do vazio.

- **Motor**: o da `/gerar-imagem`, que decide qual (hoje o Nano Banana). O prompt
  descreve o lugar, a luz (de onde vem, a cor), o objeto principal e o material,
  a tipografia (família, peso, onde fica) e a cor de destaque da marca, **no
  formato da peça** (o `filme` em 16:9; o `reel` em 9:16).
- **A imagem é alvo, não ativo**: da imagem se tira a composição, a luz, a
  paleta exata (conta-gotas) e a escala de cada coisa; a letra, o logo e a
  interface são código (`comum.mundo.marca-em-codigo-por-cima`). A
  superfície que vem dela como placa segue `comum.mundo.placa-que-trabalha` e
  `comum.mundo.placa-reserva-a-legenda`.
- Uma imagem por direção da prancha; a escolhida vira a régua do quadro herói:
  o `snapshot` do herói vai ao lado dela na folha do crítico, e "não chega
  perto" é P1.

## 3 · A prancha

A prancha é onde a pessoa escolhe a direção de uma peça, vendo. Ela mora em
`direcoes/` na pasta da peça, e o `ferramentas/prancha.mjs` monta a página.

- **3 a 5 direções**, cada uma com uma letra, um nome de duas ou três
  palavras, um parágrafo do que ela é, a **minha crítica** (o que funciona, o
  que joga contra) e a recomendada marcada.
- **Antes das direções, a ideia** (`roteiro.md`, "A ideia"): três ideias de
  tipos diferentes, e três perguntas que dão tese às direções: o que o cliente
  final do nicho salva para si (a paleta nasce daí), que objeção o visual
  responde (o vídeo mostra a ação que a objeção nega), de que peça anterior do
  perfil esta se afasta. Duas direções que contam a mesma ideia com outra
  câmera são uma direção só.
- **As direções variam ideia, mundo e estrutura, nunca só cor**: a ideia (as três
  do passo anterior), o mundo (o chão, a luz, o material: `comum/mundo.md` e
  `comum/camera-e-luz.md` do manual), a câmera (parada × empurrando), a
  profundidade (plana × três camadas), o ritmo (cortes na batida × planos
  longos), o tipo de cena das frases-chave (no falado, a mesma frase em
  `meia-tela` e em `legenda-interface` enquanto a pessoa não escolher), e a cor de
  destaque dentro da paleta da marca. A técnica `proposta` que a direção usa vai
  sinalizada aqui, para a pessoa ver.
- **Antes do código, a arte-chave** (§ 2), e o código persegue a imagem; a
  prancha só em código cru já nasce pobre.
- Cada direção são **3 quadros parados** do mesmo instante (o gancho, a prova e
  o fecho), tirados pelo `snapshot` do motor; na direção que muda o movimento,
  uma tira de 12 quadros do momento que mostra a diferença, e na recomendada um
  trecho de 3 a 5 s com som (o teste de movimento).
- Toda direção respeita as entradas `recusado` do manual e a marca; a
  prancha não testa o que o manual já barra.
- A página abre no navegador, e a pergunta vem depois de a pessoa ver (a
  rodada 2 de `sabatina.md`). A escolha vai para o `brief.md` com a frase
  dela, e a direção escolhida entra no leque das próximas peças: uma
  linha em `acervo/direcoes.md`.

**Como se renderiza:** uma composição só, com as cenas dos três instantes (2 s
cada) e a direção numa variável (`window.DIR`); o montador da peça escreve o
`index.html` uma vez por letra, e o `snapshot` tira os três quadros no fim de
cada cena (no tamanho M, um quadro por direção: o gancho). No puro, o
`montar-puro.mjs --modelo fonte/prancha.html --direcao <letra>`; no falado, a
letra vai no `estilo.direcao` do `plano.json`, e o `montar-falado.mjs` monta de
novo.

```bash
node .claude/skills/mograph/ferramentas/prancha.mjs <pasta-da-peça>/direcoes
```

## 4 · As conferências

As réguas de máquina continuam (`auditoria.md`, com a `parado` e a `cromo`);
estas somam o que o sênior confere antes de chamar alguém:

1. **O herói contra a arte-chave**: o `snapshot` do quadro herói ao lado da
   imagem; composição, luz e escala perto, ou volta.
2. **Cada quadro numa frase**: antes de julgar, descreva cada quadro da folha em
   uma frase; a que começa com "um cartão sobre uma cor chapada" é um quadro de slide.
3. **Sem som, por um olho novo**: um subagente que não construiu lê a folha
   sem o roteiro e diz a mensagem; se não diz, a imagem não conta a história.
4. **Som no quadro e no tom**: cada efeito a até 1 quadro do acerto
   (`medir_audio.py acerto`); os sons com altura no tom (`comum.som.no-tom`);
   o drop com 4 a 5 dB de contraste.
5. **Ao lado da referência**: o crítico põe o quadro herói da peça ao lado do
   quadro equivalente da referência que a pessoa trouxe (sem uma, a referência
   de nível em `_memoria/preferencias.md`); "aguenta lado a lado?" é nota
   (`lente-do-critico.md`).
6. **O teste da imagem**: cada cena tem componente com volume ou matéria
   (`comum.mundo.seis-camadas`, `comum.componentes.charme-premium`); cena só de
   texto e forma chapada é P1.
7. **Cada técnica citada**: toda cena do `plano.json` diz os ids do manual que
   usa, e nenhum é de outro formato nem `recusado`.

## 5 · O que denuncia o básico

O "premium" que se pede é a coluna do meio, cena a cena; o crítico dá 8 quando
há tudo, e o cru (o fundo chapado com um objeto no meio, tudo entrando em fade)
e o correto e pobre reprovam igual (`lente-do-critico.md`). A terceira coluna é
onde a regra mora.

| O básico | O sênior | As entradas |
|---|---|---|
| fundo chapado por cena | o chão com matéria, a mesma lógica de luz no filme | `comum.mundo.chao-com-materia`, `comum.mundo.seis-camadas` |
| a luz sem fonte, o objeto solto no vazio | a luz com direção e a sombra de contato no que pousa | `comum.camera-e-luz.luz-com-direcao` |
| a cena numa camada só | duas camadas ou mais, com parallax quando a câmera anda | `comum.camera-e-luz.tres-planos` |
| tudo entrando em fade com subida | entrada por movimento, de maior ou de fora, cada papel com a sua curva | `comum.movimento.entra-por-movimento`, `comum.movimento.curva-por-papel` |
| uma curva e uma duração em tudo | 3 ou mais curvas, durações por família | `comum.movimento.variedade` |
| texto num tamanho e num peso | duas vozes, a palavra-chave 2,5× maior | `comum.tipografia.duas-vozes`, `comum.tipografia.medidas` |
| a cena só de texto e forma cinza | o componente com volume: ícone 3D, foto, objeto, interface | `comum.componentes.charme-premium`, `comum.efeito.objeto-3d`, `comum.componentes.foto-real-tratada` |
| o brilho e o degradê ligados sempre | o efeito no quadro da causa, uma vez | `comum.efeito.evento`, `comum.mundo.papel-de-parede` |
| a trilha e três efeitos | um som por ação, do kit, no tom, o silêncio antes do pico | `comum.som.um-por-acao`, `comum.som.familias`, `comum.som.do-kit`, `comum.som.no-tom`, `comum.som.silencio-antes-do-pico` |
| o corte parado, entre poses | o corte no movimento, ou o objeto que continua | `comum.transicao.corte-invisivel`, `comum.transicao.continuidade` |
| a transição como variedade | dois ou três tipos, repetidos | `comum.transicao.orcamento` |
| cada coisa nasce do nada | cada coisa nasce de dentro ou em volta da anterior | `comum.transicao.continuidade`, `comum.estrutura.historia-que-anda` |
| a câmera parada, ou andando sem razão | a câmera com motivo; fora dele, o empurrão lento, a deriva ou o mundo vivo | `comum.camera-e-luz.camera-com-motivo`, `comum.camera-e-luz.camera-que-respira` |
| tudo no centro, do mesmo tamanho | o principal grande, quase sangrando; o apoio nas bordas | `comum.mundo.escala-e-hierarquia`, `comum.mundo.tres-objetos` |
| a espera que balança em laço | uma vírgula antes do pico; o resto anda | `comum.estrutura.virgula`, `comum.estrutura.balanco-em-laco` |
| ênfase em tudo | no máximo 25% das cenas com importância 3 | `comum.estrutura.orcamento-de-importancia` |
| o fim que se arrasta | o fim acaba uma vez, menor que o pico | `comum.estrutura.o-fim` |
| o rótulo no canto, o contador "02 / 04" | nada que o espectador não precise | `comum.componentes.elemento-que-volta` |
| o quadro que ninguém mandaria | o quadro herói nomeado antes e construído primeiro | § 1 e § 2 |
