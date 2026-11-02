# As cenas

Como cada frase vira cena no motor: o campo `tipo`, a legenda, a câmera e o script que a
constrói. A decisão é por frase, no `plano.json` (`roteiro.md`), proposta por mim e ajustada por
a pessoa na página de planejamento. **O que cada cena é e por quê mora no manual** e se cita pelo id:
os tipos de cena, a divisão da tela, o zoom e a gravação em `manual/reel/cena.md`; a legenda em
`manual/reel/legenda.md`; a vitrine e os elementos em `manual/reel/elemento.md`; o gancho e o
rosto que volta em `manual/reel/ritmo.md`. O estado de cada regra (`firme`, `proposta`, `recusado`)
é o da entrada.

## O modo falado: os quatro tipos de cena

A pessoa grava falando para a câmera; cada frase ganha um `tipo`, pela `reel.cena.tipo-por-frase`:

| `tipo` | A entrada |
|---|---|
| `legenda` | `reel.cena.legenda` |
| `legenda-interface` | `reel.cena.legenda-interface` |
| `meia-tela` | `reel.cena.meia-tela` |
| `tela-cheia` | `reel.cena.tela-cheia` |

**A interface sobre a câmera** (o `legenda-interface`) só entra numa peça depois que a pessoa a
vir renderizada na prancha, ao lado da mesma frase em `meia-tela`, e escolher. Até lá o `plano.mjs`
a barra, salvo com `"interface_aprovada": true` no `plano.json`, posto depois da escolha, com a
frase dela no `brief.md`.

### A legenda em cada tipo de cena

O modo vai no campo `legenda` do plano (`roteiro.md` § 3), pela `reel.legenda.por-tipo-de-cena`, e
a gramática e o lugar são da `/cortes` (`.claude/skills/cortes/legenda.md`, o passo 5 do modo
gravação; o lugar sai do rosto). O `plano.mjs conferir` avisa a cena com ele em `L1` e a tela cheia
em `L2`.

**A palavra atrás da cabeça** (`reel.legenda.palavra-atras-da-cabeca`). No motor do falado é o
campo `atras` do `plano.json`: a cena (de legenda), a `dona` pequena e a `palavra`, o `em` e o
`ate` (o tempo de leitura conta), o `topo` em px, as frases da legenda que ela cobre
(`oculta_frase`) e o `recorte`, a pessoa sem o fundo do trecho do `camera.mp4` que começa em
`recorte.de` (`npx --yes hyperframes@0.8.207 remove-background <trecho.mp4> -o
ativos/recorte-atras.webm --quality best`). A montagem põe a palavra e o recorte no quadro da
câmera, e o `falado.js` faz a subida, o soco de 1,05 e a saída (`ferramentas/falado-extra.mjs`,
com a régua no `teste-falado-extra.mjs`). A palavra e a legenda dividem a faixa acima da cabeça,
então nunca ficam juntas: a montagem passa ao planejador da legenda a faixa ocupada (do `em` ao
`ate` mais a saída de 0,3 s), e a frase que cairia nela espera; as frases do `oculta_frase` não
empurram as seguintes. A palavra entra na primeira sílaba da `dona`, para a espera ficar curta.

**A mídia da cena** (o vídeo que a cena toca, o objeto 3D com transparência) vai no campo `midia`
da cena (`id`, `src`, `de`, `ate`, `x`, `y`, `w`): o HyperFrames só renderiza o `<video>` que está
no HTML, então a montagem o escreve, e o script da cena o pega pelo id (`m-<id>`) e o move (ou o
põe no palco dela, para andar com a câmera).

### O zoom do falado

A câmera do falado é o campo `zoom` da cena (`em`, `escala`, `ancora_y`, `quadros`, `curva`
`rapida` ou `lenta`, `volta`, `quadros_volta`; em lista quando são mais de um, um depois do
outro), feito pelo `falado.js`. Os três usos e os números são do manual:
`reel.cena.zoom-de-enfase`, `reel.cena.zoom-de-transicao` e `reel.cena.aproximacao-na-pausa`,
nos limites de `comum.camera-e-luz.escala-da-camera`.

### O script de cada cena

Cada cena de animação é um `cenas/<id>.js` na pasta da peça, que registra a
função dela com `CENA("<id>", function (el, c, api) { … })`: desenha dentro do
contêiner `el` (a região do tipo dela) e põe os movimentos na timeline
(`api.tl`), em tempo absoluto (`c.de + …`), com `api.q(quadros)` e a curva
`api.ease`. O que as cenas dividem mora em `cenas/_comum.js`, que a montagem
carrega antes delas.

**No motion puro** não há montador da skill: a peça é uma página HyperFrames da
`/video`, e o script das cenas é da peça. Duas coisas que o motor cobra e que,
esquecidas, custam um render: o registro da timeline (`window.__timelines.main`)
tem de estar num script **embutido** na página (o `check` não o vê em arquivo,
e o script de arquivo no corpo roda fora de ordem), e o plano entra embutido
também, para o script ler os tempos do `plano.json`. Quem faz isso é o
`ferramentas/montar-puro.mjs`, a partir do `fonte/pagina.html` da peça. O texto da
interface desenhada (a ficha, o endereço, o cabeçalho de uma conversa) vai sob
`data-texto="objeto"`; todo o resto que a cena escreve vai no `texto_tela` do
plano, e a régua `tela` confere.

```bash
node .claude/skills/mograph/ferramentas/montar-puro.mjs <pasta-da-peça> [--direcao A]
```

A cena `legenda` não pede script. Quando tem um, ele desenha no quadro inteiro,
por cima do rosto, e só a **marca sem texto que volta** (o marcador das partes
nascendo no gancho, no mesmo tamanho e altura das outras cenas): o contêiner não
sobe nem escurece a câmera, cada peça entra pelo script, e texto continua sendo
da legenda e do gancho escrito (o `plano.mjs` barra `texto_tela` nela).

## O motion puro: as quatro famílias de cena

Sem gravação, o `tipo` da cena é `texto`, `pessoa`, `objeto` ou `grafico`
(`reel.cena.familias-do-puro`).
