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

**O estilo vem do pedido.** A legenda, a trilha, o que aparece na tela: o que o
usuário trouxer quando pedir o vídeo. Sem pedido, vale o padrão (a ficha `marca`,
com trilha), e não se monta opção para ele escolher.

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
marca, lidos de `.claude/skills/carrossel/marca/tokens.css` <!-- caminho futuro: o /carrossel configurar grava na primeira vez -->.
Se esse arquivo não existe ou ainda tem `ESTADO: nao-configurado`, **pare antes de
transcrever** e diga isso ao usuário, com as duas saídas: configurar a marca
(`/carrossel configurar`, uma vez) ou seguir na neutra (a Inter e um acento
amarelo, sem a marca), escolha dele. A montagem recusa sozinha se ninguém
escolher.

**O pedido de gravação.** Se a pessoa ainda vai gravar, mande isto antes (é o que
o código não conserta depois):

- em pé, celular na vertical, 1080p ou mais, olhando a lente o tempo todo
- a primeira frase é a do problema de quem assiste, a mais forte, com a primeira
  palavra mais alta (a gravação que abre anunciando uma lista perde o gancho falado)
- errou: pare um segundo e repita a frase do começo, sem cortar a gravação
- se tiver microfone, grave nele também (o motor sincroniza sozinho)
- uns dois segundos de silêncio, olhando a lente, depois da última frase
- a fala limpa na duração de vídeo curto de `_memoria/marketing.md` ("Formatos");
  fundo liso e luz de janela no rosto ajudam

**A gravação já veio, e fere o pedido** (abaixo de 1080p, sem o silêncio no fim,
fala curta ou longa): siga, e diga isso na entrega, como decisão de regravar. Não
pare antes: o usuário quer ver o Reel.

## 1 · A pasta

A peça nasce em `rascunho/reel-<tema>/` <!-- caminho futuro: uma por peça -->, que
não se versiona (mídia é saída); só o final, a capa e o relatório sobem para
`saidas/reel-<tema>-<data>/` <!-- caminho futuro: idem -->. A pasta ganha o GSAP
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
queixo, em porcentagem da altura. É ela que decide a posição da legenda (passo 5).

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
grava costuma olhar para baixo e ir desligar a câmera), com um aviso quando a
gravação acaba em cima da palavra.
Leia os avisos; o que for limite da gravação vai para o usuário na entrega. Fala
limpa fora da duração de `_memoria/marketing.md`: siga e avise.

## 5 · A legenda, o gancho escrito e a capa

**`<pasta>/legenda.json`**: os blocos escritos à mão, na ordem da fala.

```json
{ "correcoes": { "Bill": "bio", "Insta Gram": "Instagram" },
  "blocos": ["toda semana", "eu perco", "[dois clientes]", "por causa disso"] }
```

- até 4 palavras (o `max_palavras` da ficha `marca`), 5 quando a alternativa é
  bloco curto; **cada bloco faz sentido lido sozinho** ("que a", "com que", "do
  Google" sozinhos não dizem nada); a máquina recusa o que passar do teto
- a chamada do fim fica até o último quadro: deixe nela o que a pessoa tem que
  fazer ("link da [bio]"), não só a última palavra
- `[colchetes]` no destaque: uma ou duas palavras de peso a cada dois ou três
  blocos (produto, número, benefício, a palavra da chamada), nunca dois seguidos,
  nunca só palavra de ligação; o nome de produto de várias palavras é um destaque
  só e sai num sublinhado só
- `~` no começo do bloco: ele conta no tempo mas não vai para a tela; usa-se só
  quando a captura de um fato (passo 6) já mostra a frase
- a caixa é a de `_memoria/escrita-publica.md` (a linha `**Caixa:**`): com a
  minúscula, a montagem recusa a maiúscula no começo do bloco que não é sigla nem
  nome próprio; nome próprio e marca na forma deles
- **a transcrição erra nome**: declare a correção, de uma ou várias palavras para
  uma ou várias (`"PG Speed": "PageSpeed"`); a montagem recusa a não declarada e
  para no primeiro desencontro (o que vem depois é cascata dele)

**`<pasta>/peca.json`**:

```json
{ "ficha": "marca", "gancho": "você perde cliente\nsem perceber", "capa": "o erro que custa\ndois clientes por semana",
  "capa_quadro": 3.9, "fatos": [] }
```

- **o gancho escrito** complementa o falado, não repete; até duas linhas; tem
  "seu" ou "você" e a perda; fica a um terço do topo até o fim da primeira frase
  (a régua dos quatro ganchos está no `.claude/skills/cortes/SKILL.md`)
- **a capa** diz o assunto na grade do perfil, com a mesma régua de balcão do
  gancho ("você/seu" e a perda); o `\n` quebra a linha onde você quer, e o
  `capa_quadro` é o segundo do Reel cujo quadro vai atrás (sem ele, o meio da
  primeira frase): escolha um quadro no meio de uma frase, longe das emendas do
  `cortes.json` e de gesto borrado. Sai como PNG à parte, nunca como o quadro 0
- **a marca**: sem o campo, a da pasta (`<pasta>/_marca/tokens.css`, pela junção do passo 1);
  `"marca": "neutra"` só quando o usuário escolheu seguir sem a marca
- os exemplos acima não são desta gravação: escreva os da peça
- todo texto público passa pela `humanizer` antes

**Confira os blocos já aqui**, sem gravar nada:

```bash
node scripts/reel-falado/montar.mjs <pasta> --conferir
```

**A posição da legenda.** A ficha de estilo mora em
`.claude/skills/cortes/reel/legendas/`: a padrão é a
`.claude/skills/cortes/reel/legendas/marca.json` (a fonte de título da marca,
branco com contorno preto e o destaque sublinhado no acento), e há a `pilula`
(preto sobre caixa branca) e a `sombra` (branco limpo com sombra). A `posicao_y` é
o **topo** do bloco, em pixels de 1920. Duas faixas mandam nela juntas:

- **o Instagram** cobre ~220 px em cima e ~380 px embaixo (nome, legenda do post,
  botões): o bloco tem que terminar até 1540, então o topo vai até ~1450
- **o rosto**, que o punch-in aumenta: um ponto da fonte em `y` vai para
  `672 + (y − 672) × punch` (o punch padrão é 1,08, a origem em 35% da altura).
  Com o queixo em 71% da altura (1363 px), o queixo vai a ~1418 no punch

Se a janela entre o queixo e 1450 couber o bloco (~85 px numa linha), use-a. Se
não couber, diminua o punch na `peca.json` (`"punch": 1.04`) antes de aceitar a
legenda sobre o queixo; a boca nunca. Para mudar a posição, copie a ficha para a
pasta com a `posicao_y` nova e aponte `"ficha": "minha-ficha.json"`.

### Copiar o estilo de legenda de um vídeo de referência

Pedido: *"copia o estilo da legenda desse outro vídeo"*.

1. Baixe a referência (`yt-dlp`) e extraia os quadros dos momentos com legenda.
2. Meça o que dá para ver: a altura da letra sobre a altura do quadro (vezes 1920 é
   o `tamanho`), a posição, a cor pelo pixel, o contorno e a sombra, a caixa de
   fundo (`fundo`), se o texto sai todo em maiúscula (`caixa`: `maiuscula` ou
   `normal`), quantas palavras por bloco, como o destaque aparece (cor, itálico,
   sublinhado, `escala` do tamanho) e como o bloco entra (`corte`, `sobe`, `pop`).
3. Escreva a ficha nova em `.claude/skills/cortes/reel/legendas/<nome>.json`, com a
   `origem` dizendo de onde veio. Copiar um estilo é escrever uma ficha, sem mexer
   em código. A `fonte` é o nome da família (`"Roboto"`) ou `"marca"` para a fonte
   de título da marca; cor e peso aceitam os tokens da marca (`var(--accent)`).
4. Monte com a ficha nova sem tocar a `peca.json`
   (`node scripts/reel-falado/montar.mjs <pasta> --ficha <nome>`) e tire o quadro da
   peça ao lado do quadro da referência, no mesmo instante
   (`npx --yes hyperframes@0.8.96 snapshot --at <t> --against <referência>`); mostre
   ao usuário antes do render inteiro.
5. Fonte que o workspace não tem: use a mais próxima disponível e diga qual seria a
   certa. Estilo que bate no que a marca evita (o "O que evitar" de
   `_memoria/escrita-publica.md` e as "Recusas visuais" do `marca.md` da marca:
   caixa alta, tarja, peça que grita): copie, porque é pedido do usuário, e avise
   antes.

**Comparar estilos**, só quando o usuário pedir: monte com cada ficha pelo
`--ficha`, tire o `snapshot` dos mesmos três instantes com legenda, e junte numa
imagem só.

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

- **trilha**: do Mixkit, nas tags `lofi`, `corporate` ou `ambient` (trilha para
  fala, sem melodia que dispute com a voz), de 90 a 120 BPM; meça a candidata pelo
  `.claude/skills/video/ferramentas/medir_audio.py` (modo `musica`) e use a
  primeira batida em `batida`. Ela cai no quadro 1, em −24 LUFS, num nível só.
  Ouvir é do usuário: a escolha pela medida é a proposta
- **efeitos**: no Reel falado, quase nenhum; só onde há evento visual (o fato
  entrando), pelo pico, 10 dB abaixo da voz
- **riser**: opcional, acabando na junção em que o gancho termina; sem `fim`, o
  motor lê o fim da primeira frase no `cortes.json`

```bash
python scripts/reel-falado/som.py <pasta> [--sem-musica]
```

Com trilha, sai também o `master-sem-trilha.wav`: se o usuário pedir a versão sem
trilha, ela sai do vídeo pronto sem outro render (passo 8).

## 8 · Montar e renderizar

```bash
node scripts/reel-falado/montar.mjs <pasta>
npx --yes hyperframes@0.8.96 check
npx --yes hyperframes@0.8.96 snapshot --at <t1,t2,...> --no-end -o <pasta>/quadros
npx --yes hyperframes@0.8.96 render -o <pasta>/final.mp4 --quality high --fps 30
ffmpeg -v error -y -i <pasta>/final.mp4 -i <pasta>/master-sem-trilha.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k <pasta>/final-sem-trilha.mp4
npx --yes hyperframes@0.8.96 render -c compositions/capa.html -o <pasta>/capa.mp4
ffmpeg -v error -y -i <pasta>/capa.mp4 -frames:v 1 <pasta>/capa.png
```

Os comandos do HyperFrames rodam dentro da pasta, com o navegador do render
apontado como manda o `.claude/skills/video/hyperframes.md` (um Reel de 40 s leva
perto de 1,5 min de render). A montagem gera o `index.html` e a capa a partir do
`.claude/skills/cortes/reel/index.html`, com a marca no `<head>`, o END e o quadro
da capa escritos na mídia, e regrava os dois a cada montagem: mudança vai na
`peca.json` ou na ficha. Na neutra, a fonte vem do Google Fonts: o render precisa
de internet. A montagem recusa o som mixado para outro corte: se o passo 4 rodou de
novo, rode o passo 7 de novo. O enquadramento alterna nos cortes, mas não troca de
novo antes de 1,5 s (`troca_min` na `peca.json`): o corte que cai antes fica seco.
A última legenda (a chamada) fica até o fim, pelo respiro.
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
- **o crítico que não construiu** (um subagente novo, `general-purpose`), com o
  prompt abaixo, e o `revisor-de-comunicacao` em paralelo com os blocos, o gancho e
  a capa; a mesma peça volta ao mesmo crítico até todas as notas do código
  passarem de 8, com teto de três rodadas (na terceira ainda reprovada, as notas
  e as opções vão ao usuário, como no `.claude/skills/video/critico.md`). Quem roda num subagente faz a autocrítica e escreve que o crítico
  independente está pendente (subagente não lança subagente)
- conserto nas tomadas volta ao passo 4 e repete o 7 (o som sai do corte); conserto
  na legenda, no gancho, na capa ou na ficha volta só ao 8

> Você é um editor de vídeo exigente e NÃO montou este Reel. Comece reprovando.
> Leia o `relatorio.md`, o `legenda.json`, a `peca.json` e abra todas as imagens das
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

Em `saidas/reel-<tema>-<data>/` <!-- caminho futuro: nasce na entrega -->: o `final.mp4`, o `final-sem-trilha.mp4` (se houve
trilha) e a `capa.png`, o `relatorio.md` da montagem e a legenda do post, escrita
pela `humanizer`, no tom de `_memoria/escrita-publica.md`, e conferida pela régua
de legenda, da raiz do projeto:

```bash
node -e "const {confereLegenda}=require('./scripts/lib/legenda.js');console.log(JSON.stringify(confereLegenda(require('fs').readFileSync(process.argv[1],'utf8'))))" <legenda.txt>
```

Na mensagem ao usuário, primeiro o vídeo; depois, numa lista curta, só o que é
decisão dele e o código não resolve: o que regravar se a gravação ficou abaixo do
pedido. **Para no arquivo**: publicar é outro pedido.

## A régua de pronto

- [ ] a marca configurada, ou a neutra escolhida pelo usuário
- [ ] a conferência das tomadas verde, com cada troca e cada descarte escritos
- [ ] os avisos do corte lidos e, se houver, ditos ao usuário
- [ ] a montagem verde e o `check` sem erro
- [ ] os quadros parados olhados: nada sobre a boca ou os olhos, legenda fora da
      faixa do Instagram e numa linha, gancho e legenda legíveis a 360 px
- [ ] os quadros do vídeo iguais ao END, o master na régua
- [ ] o crítico com todas as notas do código em 8 ou mais, e a comunicação sem pendência
- [ ] na pasta de entrega: o vídeo, a capa, o relatório e a legenda; nada publicado
