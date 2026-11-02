# /cortes · o modo gravação: a gravação bruta vira um Reel

A pessoa grava a si mesma falando para a câmera, repetindo a frase até acertar, e
entrega o arquivo. Sai um Reel pronto: a fala limpa, a última tomada de cada frase,
a legenda, o som em faixas, a capa e o relatório do que foi trocado. Ela não edita
nada.

A forma é uma só: **a câmera em tela cheia**, punch-in em cada corte, a legenda e
o gancho escrito nas faixas livres do rosto. **Nada recorta o fundo nem sobrepõe
cartão à câmera**: o recorte quadro a quadro deforma a borda da cabeça, e o cartão
sobreposto tira o rosto do centro. O `scripts/reel-falado/teste-modelo.mjs` trava
as duas coisas.

**Com motion por cima** (a frase que vira meia tela, tela cheia de animação ou
interface), o Reel é da `/mograph`: os passos 0 a 7 daqui fazem o corte, a
legenda e o som, e a montagem das cenas é a dela (`.claude/skills/mograph/cenas.md`).

**O estilo vem do pedido.** A legenda, a trilha, o que aparece na tela: o que o
usuário trouxer quando pedir o vídeo. Sem pedido, vale o padrão (a legenda em duas
vozes, a ficha `duas-vozes` no modo frase, com trilha), e não se monta opção para
ele escolher.

Os motores moram em `scripts/reel-falado/`, um por passo, e cada um recusa o que
fere a régua. **Quem escolhe as tomadas e escreve os blocos de legenda, o gancho
e a capa é você, nesta conversa**; a máquina sugere, mede e recusa. Do passo 1 à
entrega leva perto de meia hora, alguns minutos dela de render.

**O que a máquina precisa**, além do que o modo cortes já pede (`ffmpeg`, a
transcrição): o `numpy` e o `scipy` do `scripts/requirements.txt`
(`python -m pip install -r scripts/requirements.txt`) e o HyperFrames, que roda
pelo `npx` (o `.claude/skills/video/hyperframes.md` diz como apontar o navegador
do render).

## 0 · A marca e o pedido de gravação

**A marca.** A legenda, o gancho e a capa saem na fonte de título e no acento da
marca, lidos de `.claude/skills/carrossel/marca/tokens.css` <!-- caminho futuro: o /marca configurar grava na primeira vez -->.
Se esse arquivo não existe ou ainda tem `ESTADO: nao-configurado`, **pare antes de
transcrever** e diga isso ao usuário, com as duas saídas: configurar a marca
(`/marca configurar`, uma vez) ou seguir na neutra (a Inter e um acento
amarelo, sem a marca), escolha dele. A montagem recusa sozinha se ninguém
escolher.

**O pedido de gravação.** Se a pessoa ainda vai gravar, mande isto antes (é o que
o código não conserta depois):

- em pé, celular na vertical, 1080p ou mais, olhando a lente o tempo todo
- **plano médio**, da cintura para cima, a cabeça no terço de cima: é o que deixa
  a legenda caber abaixo do queixo, até no anúncio (a zona dele acaba em 1248 px);
  de perto, a legenda só cabe acima da cabeça
- a primeira frase é a do problema de quem assiste, a mais forte, com a primeira
  palavra mais alta (a gravação que abre anunciando uma lista perde o gancho falado)
- errou: pare um segundo e repita a frase do começo, sem cortar a gravação
- se tiver microfone, grave nele também (o motor sincroniza sozinho)
- uns dois segundos de silêncio, olhando a lente, depois da última frase
- fala limpa na duração da função (`_memoria/marketing.md`, "Formatos": atenção e
  conexão de 20 a 45 s; autoridade, prova e conversão de 60 a 180 s); fundo liso e luz
  de janela no rosto ajudam

**A gravação já veio, e fere o pedido** (abaixo de 1080p, sem o silêncio no fim,
fala curta ou longa): siga, e diga isso na entrega, como decisão de regravar. Não
pare antes: o usuário quer ver o Reel.

## 1 · A pasta

A peça nasce em `rascunho/reel-<tema>/` <!-- caminho futuro: uma por peça -->, que
não se versiona (mídia é saída); só o final, a capa e o relatório sobem para
`saidas/falado-<tema>-<data>/` <!-- caminho futuro: idem -->. A pasta ganha o GSAP
local e a marca pela junção:

```bash
node .claude/skills/video/ferramentas/nova-peca.mjs reel-<tema> --em rascunho/reel-<tema> --com-marca
```

Na neutra, sem o `--com-marca` (a pasta ganha só o `_vendor`), e a `peca.json`
do passo 5 leva `"marca": "neutra"`.

O `nova-peca` imprime "próximo: preencher roteiro.md": aqui não vale. O
`index.html` sai da montagem (passo 8), e o `roteiro.md` não se usa.
🚨 Peça se apaga só pelo `.claude/skills/video/ferramentas/apagar-peca.mjs`: a
junção `_marca` leva à marca do workspace, e `rm -rf` a atravessa.

## 2 · Transcrever e olhar

```bash
python scripts/transcrever.py <gravação> --saida <pasta>/transcricao.md --json <pasta>/palavras.json
ffmpeg -v error -i <gravação> -vf "fps=1/4,scale=240:-1,tile=8x5" -frames:v 1 <pasta>/folha.png
```

Na folha (não no `ffprobe`: o celular grava deitado com a rotação no metadado, e o
`ffprobe` mostra 1024x576 para um vídeo em pé): em pé ou deitado (deitado sai
recortado 9:16 do centro), a resolução real (abaixo de 1080 de largura amplia e
fica mole: vai como aviso), o fundo, e **a faixa do rosto**, do topo do cabelo ao
queixo, nas tomadas em que ele chega mais perto. Ela vai para a `peca.json` em px de
1920, já com o punch (um ponto em `y` vai para `672 + (y − 672) × punch`; o punch
padrão é 1,08, a origem em 35% da altura): `"rosto": { "cabelo_y": 520, "queixo_y": 1380 }`.
É ela que decide o lugar da legenda (passo 5).

## 3 · As tomadas

```bash
python scripts/reel-falado/tomadas.py sugerir <pasta>/palavras.json > <pasta>/sugestao.json
```

A sugestão agrupa as repetições pelo mesmo começo (as três primeiras palavras,
comparadas pelo radical), pelo mesmo ordinal ("terceiro", "quarto") ou pelas
palavras em comum, dentro de 90 s, e sugere a **última** de cada grupo. Ela vem
ordenada pela última tomada; confira a ordem pela fala. Leia cada grupo:

- **suspeita** é a última bem mais curta que as outras: ouça se ela acabou ou foi
  cortada no meio (pode ser só a versão mais enxuta, que a pessoa refinou)
- um "ok", um "pode ir?", um comentário depois da tomada: vai para `descartados`
- grupo errado (duas frases diferentes juntas, ou a mesma frase partida em dois
  grupos): corrija
- **contato visual**: tire uma tira de seis quadros de cada tomada escolhida (um
  quadro só confunde piscada com olhar desviado):

  ```bash
  ffmpeg -v error -ss <inicio> -t <duração> -i <gravação> -vf "fps=6/<duração>,scale=200:-1,tile=6x1" -frames:v 1 <pasta>/olhar-<n>.jpg
  ```

  a tomada que desvia o olhar da lente troca pela anterior, com a razão

Escreva `<pasta>/tomadas.json`, **na ordem em que as frases vão no Reel**:

```json
{ "frases": [ { "grupo": [0, 1], "escolhida": 1 },
              { "grupo": [7, 8, 9], "escolhida": 8, "troca": "a 9 desvia o olhar para o lado" } ],
  "descartados": [3] }
```

Todo segmento mora num grupo ou nos descartados; a escolhida é a última, ou leva a
razão em `troca`, que vai para o relatório.

```bash
python scripts/reel-falado/tomadas.py conferir <pasta>/palavras.json <pasta>/tomadas.json
```

## 4 · Cortar

```bash
python scripts/reel-falado/fala.py <gravação> <pasta>/palavras.json <pasta>/tomadas.json --saida <pasta> [--audio <microfone.wav>]
```

Sai `camera.mp4`, `voz.wav` e `cortes.json`. O motor mede o começo e o fim no som
real (40 ms de folga antes da primeira palavra, e mais 50 ms de som antes de cada
corte pelo J cut; quando duas tomadas estão coladas na gravação, a cauda da de
antes não entra na de depois), corta silêncio acima de 300 ms para 120 ms sem
deixar pedaço abaixo de 1,5 s (pedaço curto vira punch-in em cima de punch-in), mas
corta a pausa acima de 0,6 s mesmo com pedaço de 0,5 s (é ar morto; o enquadramento
não troca, o corte fica seco), emenda com cauda de 170 ms e dá 0,8 s de respiro
depois da última palavra com o quadro do fim da fala parado (depois dele, quem
grava costuma olhar para baixo e ir desligar a câmera), com um aviso quando a gravação acaba em cima
da palavra. A **pausa dramática** é a exceção pedida: `"pausa_depois": 0.6` na frase do
`tomadas.json` estica a frase no silêncio real que vem depois dela na gravação (a imagem
da pessoa e o ar da sala, nunca quadro parado), até 2 s; se a próxima fala chega antes, a
pausa encurta e avisa.
Leia os avisos; o que for limite da gravação vai para o usuário na entrega. Fala limpa
fora da faixa da função: siga e avise.

## 5 · A legenda, o gancho escrito e a capa

O passo inteiro (o `legenda.json` nas duas vozes ou em blocos, a ficha de estilo, o lugar pelo rosto,
o gancho escrito e a capa) está no `legenda.md`, ao lado deste arquivo. Ele fecha com o
`node scripts/reel-falado/montar.mjs <pasta> --conferir` verde.

## 6 · O fato com a fonte (só quando houver)

Leia a transcrição atrás de afirmação verificável: número, data, estudo, notícia,
"segundo fulano", "lançou". O "segundo" ordinal ("segundo, adicionar...") e o
produto nomeado não são fato.

- **sem fato**: nada entra na tela, e o relatório diz "sem fatos a conferir"
- **com fato**: busque, confira em duas fontes, capture a página real com o
  navegador (Playwright, na largura de celular), salve a captura na pasta e
  declare em `peca.json`:
  `{"frase": 3, "afirmacao": "...", "fontes": ["url", "url"], "captura": "fato-1.png"}`.
  A captura entra em tela cheia pelo tempo da frase, com a legenda por cima
- **a fala diverge das fontes**: a fala fica como está, o fato não entra na tela, e
  a divergência vai para o relatório, para o usuário decidir se regrava

## 7 · O som

`<pasta>/som.json`, com a régua e os medidores do `.claude/skills/video/som.md`
(os arquivos de som ficam na raiz da pasta da peça, ao lado do `som.json`):

```json
{ "musica": { "arquivo": "musica.wav", "batida": 0.15 },
  "efeitos": [],
  "riser": null }
```

- **trilha**: primeiro o material do usuário, pelo índice (`.claude/skills/video/som.md`,
  "Achar"), e o Mixkit de reserva, nas tags `lofi`, `corporate` ou `ambient`; para
  fala, sem melodia que dispute com a voz, de 90 a 120 BPM; meça a candidata pelo
  `.claude/skills/video/ferramentas/medir_audio.py` (modo `musica`) e use a
  primeira batida em `batida`. Ela cai no quadro 1, em −24 LUFS, num nível só.
  Ouvir é do usuário: a escolha pela medida é a proposta
- **efeitos**: um som por coisa que entra na tela (a chave da legenda entrando,
  com o som da família de interface no quadro dela, até 2 quadros antes da sílaba e
  nunca depois; o fato entrando), pelo pico, 10 dB abaixo da voz; de 5 a 7 famílias
  de som na peça, o que entra em sequência soa baixinho (a cascata), e a batida
  forte só 1 a 3 vezes
- **a cama de teclado** (contínua, por baixo de toda a legenda) entra só numa peça
  de teste, para o usuário ouvir; não é padrão
- **riser**: opcional, acabando na junção em que o gancho termina; sem `fim`, o
  motor lê o fim da primeira frase no `cortes.json`

```bash
python scripts/reel-falado/som.py <pasta> [--sem-musica]
```

Com trilha, sai também o `master-sem-trilha.wav`: se o usuário pedir a versão sem
trilha, ela sai do vídeo pronto sem outro render (passo 8).

## 8 · Montar e renderizar

**A cor da câmera vem antes da montagem.** A correção se mede na gravação crua; a gradação é o
look da linguagem (`falado-com-motion`; a `cor.md` da `/video` explica a ordem), e entra só
quando o usuário já viu o antes e depois e escolheu:

```bash
npx --yes hyperframes@0.8.207 media-treatment --project <pasta> --file index.html --selector '#camera' --analyze --json
```

O que a leitura pedir (exposição, contraste, temperatura, a pele) vai na `cor.correcao` da
`peca.json` (`{ "exposure": 0.1, "temperature": -0.05 }`, as chaves da família `correction`), e a
montagem grava o `data-color-grading` no `<video id="camera">`. O look entra com `"gradacao": true`
(o da linguagem) ou com as rodas escritas na `cor.gradacao`; `false` diz que não há look. Sem a
correção ou sem a decisão do look, a montagem avisa; chave ou valor fora da faixa reprova. No
falado com motion, a linguagem é a do `plano.json`, e a `peca.json` que diz outra reprova.

Os comandos dos motores e os campos de cada arquivo da peça (`tomadas.json`, `legenda.json`, `peca.json`, `som.json`) estão no `scripts/reel-falado/README.md`. Com motion por cima, a montagem é a da `/mograph`
(`node .claude/skills/mograph/ferramentas/montar-falado.mjs <pasta>`, que roda
esta antes e põe as cenas): o `montar.mjs` sozinho, depois dela, regrava o
`index.html` sem as cenas.

```bash
node scripts/reel-falado/montar.mjs <pasta>
npx --yes hyperframes@0.8.207 check
npx --yes hyperframes@0.8.207 snapshot --at <t1,t2,...> --no-end -o <previa>/quadros
npx --yes hyperframes@0.8.207 render -o <previa>/final.mp4 --quality high --fps 30 --no-browser-gpu --workers 1
ffmpeg -v error -y -i <previa>/final.mp4 -i <pasta>/master-sem-trilha.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k <previa>/final-sem-trilha.mp4
npx --yes hyperframes@0.8.207 render -c compositions/capa.html -o <previa>/capa.mp4
ffmpeg -v error -y -i <previa>/capa.mp4 -frames:v 1 <previa>/capa.png
```

Os comandos do HyperFrames rodam dentro da pasta (o `<previa>` é o do `hyperframes.md`, "Onde o render grava"), com o navegador do render
apontado como manda o `.claude/skills/video/hyperframes.md` (cada render leva
1,5 min para um Reel de 40 s). A montagem gera o `index.html` e a capa a partir do
`.claude/skills/cortes/reel/index.html`, com o END e o quadro da capa escritos na
mídia, copia para a pasta o `.claude/skills/mograph/ferramentas/curvas.js` (as curvas
das entradas da legenda), e regrava os dois a cada montagem: mudança vai na `peca.json` ou na ficha.
A montagem recusa o som mixado para outro corte: se o passo 4 rodou de novo, rode o
passo 7 de novo. O enquadramento alterna nos cortes, mas não troca de novo antes de
1,5 s (`troca_min` na `peca.json`): o corte que cai antes fica seco. A última
legenda (a chamada) fica até o fim, pelo respiro.
**Os quadros parados se olham antes do render**, nos cortes de maior punch e nas
tomadas em que a pessoa chega mais perto da câmera: legenda sobre a boca ou o
queixo, gancho cortado, fato ilegível, bloco que quebrou em duas linhas (a conta de
largura da montagem é uma média; fonte de marca larga escapa dela). Olhe a capa a
360 px.

## 9 · Conferir

- `ffprobe`: os quadros do `final.mp4` batem com o END do `cortes.json`
- `ebur128`: o master entre −15 e −13 LUFS, pico até −1 dBTP (o AAC soma uns 0,2 dB
  ao do WAV)
- as folhas pelo `.claude/skills/video/ferramentas/folhas.mjs`, com `--rapidos` nos
  cortes (o `cortes` do `dados.js`)
- **o som dentro da trilha e o ritmo da linguagem**, as duas réguas da `/video`:

  ```bash
  python -I .claude/skills/video/ferramentas/simula_mix.py <pasta> --contexto
  python -I .claude/skills/video/ferramentas/medir_ritmo.py <previa>/final.mp4 --linguagem falado-com-motion --tomadas <pasta>/cortes.json
  ```

  o `--contexto` mede cada efeito do `som.json` contra a trilha (o relevo abaixo do piso do papel é
  efeito que não se ouve); o `medir_ritmo.py` confere o ritmo contra a faixa da linguagem e a cor de
  tomada para tomada (a vizinha que salta pegou outra luz: a correção dela vai na `peca.json`). Os
  dois avisam; o aviso que fica se diz ao usuário ou vira exceção escrita, com o motivo
- **o crítico que não construiu** (um subagente novo, `general-purpose`), com o
  prompt abaixo, e o `revisor-de-comunicacao` em paralelo com os blocos, o gancho e
  a capa; a mesma peça volta ao mesmo crítico até todas as notas do código
  passarem de 8, com teto de três rodadas (na terceira ainda reprovada, as notas
  e as opções vão ao usuário, como no `.claude/skills/video/critico.md`). Quem roda num subagente faz a autocrítica e escreve que o crítico
  independente está pendente (subagente não lança subagente)
- conserto nas tomadas volta ao passo 4 e repete o 7 (o som sai do corte); conserto
  na legenda, no gancho, na capa ou na ficha volta só ao 8

> Você é um editor de vídeo exigente e NÃO montou este Reel. Comece reprovando.
> Leia o `RELATORIO.md`, o `legenda.json`, a `peca.json` e abra todas as imagens das
> folhas e a capa. Dê nota de 1 a 10, com uma linha de motivo, para: o gancho nos
> 2 primeiros segundos (escrito, visual e falado); as emendas (pulo de imagem,
> palavra comida, dois punch-in em menos de 1,5 s); a legenda (lida a 360 px,
> blocos que fazem sentido sozinhos, destaque no lugar certo, **nunca sobre a boca
> ou os olhos**, fora da faixa do Instagram de ~220 px em cima e ~380 px embaixo);
> o gancho escrito e a capa (dizem o assunto, "você/seu" e a perda); a clareza da
> fala para quem não é do ramo; o ritmo; a marca (só as cores da marca, nada que
> grita); o acabamento (capa, respiro, fim); o valor no fecho. Separe o que é
> **limite da gravação** (resolução, fala sem gancho, duração, fim cortado): isso
> não entra na nota, vai como decisão de regravar. Depois, os 3 a 5 maiores
> problemas, com o segundo, o que está errado e o conserto (no `legenda.json`, na
> `peca.json`, na ficha ou nas tomadas). Última linha: "VEREDITO: APROVA" só com
> todas as notas em 8 ou mais; senão, "VEREDITO: REPROVA".

## 10 · Entregar

Em `saidas/falado-<tema>-<data>/` <!-- caminho futuro: nasce na entrega --> (o estilo do `estilos.md` da `/video`): o `final.mp4`, o `final-sem-trilha.mp4` (se houve
trilha) e a `capa.png`, o `RELATORIO.md` da montagem e a legenda do post, escrita
pela `humanizer`, no tom de `_memoria/escrita-publica.md`, e conferida pela régua
de legenda, da raiz do projeto:

```bash
node -e "const {confereLegenda}=require('./scripts/lib/legenda.js');console.log(JSON.stringify(confereLegenda(require('fs').readFileSync(process.argv[1],'utf8'))))" <legenda.txt>
```

Na peça de outra marca (a ficha com `"caixa": "normal"`), a legenda do post passa também pela
régua da legenda daquela marca, que o guia de voz dela aponta: o convite, o teto e o que ela nunca
diz são dela, e a régua deste workspace não os conhece.

**O pacote editável** vai junto, para o usuário mexer à mão depois do render: o corte
escondido que volta puxando a borda do trecho, a câmera e a voz vinculadas, a trilha
numa faixa que se apaga e a altura da legenda no painel Variables. Ele sai da peça
montada e abre no Studio (o que o Studio faz, medido, no `hyperframes.md` da `/video`):

```bash
node .claude/skills/mograph/ferramentas/editavel.mjs <pasta-da-peça> --saida saidas/falado-<tema>-<data>/editavel
npx --yes hyperframes@0.8.207 preview saidas/falado-<tema>-<data>/editavel
```

Na mensagem ao usuário, primeiro o vídeo; depois, numa lista curta, só o que é decisão
dele e o código não resolve: o que regravar se a gravação ficou abaixo do pedido. **Para no arquivo**: publicar é outro pedido.

## A régua de pronto

- [ ] a marca configurada, ou a neutra escolhida pelo usuário
- [ ] a conferência das tomadas verde, com cada troca e cada descarte escritos
- [ ] os avisos do corte lidos e, se houver, ditos ao usuário
- [ ] a montagem verde e o `check` sem erro
- [ ] os quadros parados olhados: nada sobre a boca ou os olhos, legenda fora da
      faixa do Instagram e numa linha, gancho e legenda legíveis a 360 px
- [ ] os quadros do vídeo iguais ao END, o master na régua
- [ ] a câmera com a correção medida e o look decidido (sem os avisos de cor da montagem)
- [ ] o `simula_mix.py --contexto` e o `medir_ritmo.py --linguagem falado-com-motion --tomadas`
      rodados, e cada aviso que ficou dito ao usuário ou com a exceção escrita
- [ ] o crítico com todas as notas do código em 8 ou mais, e a comunicação sem pendência
- [ ] na pasta de entrega: o vídeo, a capa, o relatório, a legenda e o pacote editável; nada publicado
