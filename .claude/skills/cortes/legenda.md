# A legenda, o gancho escrito e a capa

O passo 5 do modo gravação (`gravacao.md`): depois do corte da fala (o passo 4) e antes do fato e do
som. Os números e a régua deste passo moram aqui; o resto do fluxo, no `gravacao.md`.

**`<pasta>/legenda.json`**: a fala escrita à mão, na ordem, em um de dois modos.

**As duas vozes (o modo frase, o padrão).** A fala vai em frases, cada uma com no
máximo uma `[chave]`:

```json
{ "correcoes": { "Bill": "bio" },
  "frases": ["toda semana eu [perco]", "dois clientes por causa disso", "e você nem [vê]"] }
```

- **a chave segura a frase**: entra no quadro em que é dita, 2,5 vezes maior que
  o apoio, na cor de destaque da marca (o `--accent` do `tokens.css`) e na mesma
  fonte de título, com um brilho que some em 18 quadros, e fica até a frase acabar
  (a mediana fica perto de 4 s). O material da chave é da ficha
  (`duas_vozes.chave.material`): `cor` (a cor chapada, o padrão), `titanio` (o
  metal grafite com o brilho que passa uma vez na entrada), `vidro` (a palavra
  numa pílula de vidro) ou `degrade` (das duas cores de destaque da marca); outro
  valor a montagem recusa
- **o apoio entra palavra por palavra**, 1 quadro antes da fala, pequeno e branco;
  o de antes da chave fica em cima dela e o de depois embaixo (o colchete); até 5
  palavras por linha
- **a chave é o substantivo ou o número que carrega a frase** (a perda, o
  produto, o valor), nunca palavra de ligação; chave em frases seguidas pode (é a
  gramática), e frase sem chave é só apoio
- a chave que não cabe em 900 px nem a 2 vezes o apoio é reprovada: troque por
  uma palavra mais curta
- as entradas são de 8 quadros com desfoque (o apoio sobe 18 px; a chave não
  sobe), nas curvas da `/mograph`, e a frase sai inteira em 2 quadros, acabando no quadro em
  que a próxima entra (no lugar único, as duas cruzando se embaralham); dita perto da próxima,
  a chave ainda fica 4 quadros nítida, e a próxima espera a saída acabar (nunca duas frases no lugar)
- as frases cobrem a fala inteira; a última fica até o último quadro (a chamada)

O planejador é o `scripts/reel-falado/legenda-duas-vozes.mjs`, e o `montar.mjs` o
chama quando o `legenda.json` tem `frases`.

**O modo bloco** (as fichas `marca`, `pilula` e `sombra`, quando o pedido traz um
desses estilos): os blocos escritos à mão, um por vez na tela.

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
  blocos (produto, número, benefício, a palavra da chamada), nunca só palavra de
  ligação (reprova); dois seguidos é o padrão que avisa, e a exceção da `peca.json`
  (`{"regra": "destaques-seguidos", "motivo": ...}`) o aceita; o nome de produto de várias palavras é um destaque
  só e sai num sublinhado só
- `~` no começo do bloco: ele conta no tempo mas não vai para a tela; usa-se só
  quando a captura de um fato (passo 6) já mostra a frase

Nos dois modos:

- a caixa é a de `_memoria/escrita-publica.md` (a linha `**Caixa:**`): com a
  minúscula, a montagem recusa a maiúscula no começo do bloco que não é sigla nem
  nome próprio; nome próprio e marca na forma deles. A peça de outra marca com
  caixa normal leva `"caixa": "normal"` na ficha, e a régua da minúscula não roda
  nela (o resto da régua roda)
- **a transcrição erra nome**: declare a correção, de uma ou várias palavras para
  uma ou várias (`"PG Speed": "PageSpeed"`); a montagem recusa a não declarada e
  para no primeiro desencontro (o que vem depois é cascata dele)

**`<pasta>/peca.json`**:

```json
{ "ficha": "duas-vozes", "rosto": { "cabelo_y": 520, "queixo_y": 1380 }, "destino": "reel",
  "gancho": "você perde cliente\nsem perceber", "capa": "o erro que custa\ndois clientes por semana",
  "capa_quadro": 3.9, "fatos": [] }
```

- **o `destino`** é o nome da zona no `.claude/skills/video/ferramentas/formatos.json`
  (`reel` sem ele; `anuncio-reels` no anúncio)
- **o gancho escrito** complementa o falado, não repete; até duas linhas; tem
  "seu" ou "você" e a perda; fica a um terço do topo até o fim da primeira frase
  (a régua dos quatro ganchos está no `.claude/skills/cortes/SKILL.md`)
- **a capa** diz o assunto na grade do perfil, com a mesma régua do gancho
  ("você/seu" e a perda); o `\n` quebra a linha onde você quer, e o
  `capa_quadro` é o segundo do Reel cujo quadro vai atrás (sem ele, o meio da
  primeira frase): escolha um quadro no meio de uma frase, longe das emendas do
  `cortes.json` e de gesto borrado. Sai como PNG à parte, nunca como o quadro 0
- **a marca**: sem o campo, a da pasta (`<pasta>/_marca/tokens.css`, pela junção do passo 1);
  `"marca": "neutra"` só quando o usuário escolheu seguir sem a marca
- os exemplos acima não são desta gravação: escreva os da peça
- todo texto público passa pela `humanizer` antes

**Confira a legenda já aqui**, sem gravar nada:

```bash
node scripts/reel-falado/montar.mjs <pasta> --conferir
```

**O lugar da legenda.** A ficha de estilo mora em
`.claude/skills/cortes/reel/legendas/`: a padrão é a
`.claude/skills/cortes/reel/legendas/duas-vozes.json`; no modo bloco há a `marca`
(a fonte de título da marca, branco com contorno preto e o destaque sublinhado no
acento), a `pilula` (preto sobre caixa branca) e a `sombra` (branco limpo com
sombra). Duas faixas mandam no lugar juntas:

- **a zona do destino** (o `formatos.json`): no Reel orgânico o Instagram cobre
  ~220 px em cima e ~380 px embaixo (nome, legenda do post, botões), e o bloco
  termina até 1540; no anúncio, até 1248
- **o rosto** (o `rosto` da `peca.json`, já com o punch): um ponto da fonte em `y`
  vai para `672 + (y − 672) × punch` (o punch padrão é 1,08, a origem em 35% da
  altura); com o queixo em 71% da altura (1363 px), o queixo vai a ~1418

No modo frase, o planejador decide: o bloco encosta 40 px abaixo do queixo; se o
bloco mais alto da peça não couber até a base da zona, a legenda inteira sobe para
acima da cabeça (a faixa de título); se não couber nos dois, reprova, e o conserto
é diminuir o punch (`"punch": 1.04`) ou partir a frase. **Um lugar só por peça**:
a legenda que pula entre o peito e a cabeça cansa. Entre o cabelo e o queixo, nunca.

No modo bloco, a `posicao_y` da ficha é o **topo** do bloco em pixels de 1920, e a
regra é a mesma, à mão: se a janela entre o queixo e a base da zona couber o bloco
(~85 px numa linha; topo até ~1450 no Reel), use-a; se não couber, diminua o punch
antes de aceitar a legenda sobre o queixo; a boca nunca. Para mudar a posição,
copie a ficha para a pasta com a `posicao_y` nova e aponte `"ficha": "minha-ficha.json"`.

### Copiar o estilo de legenda de um vídeo de referência

Pedido: *"copia o estilo da legenda desse outro vídeo"*.

1. Baixe a referência (`yt-dlp`) e extraia os quadros dos momentos com legenda.
2. Meça o que dá para ver: a altura da letra sobre a altura do quadro (vezes 1920 é
   o `tamanho`), a posição, a cor pelo pixel, o contorno e a sombra, a caixa de
   fundo (`fundo`), se o texto sai todo em maiúscula (`caixa`: `maiuscula` ou
   `normal`), quantas palavras por bloco, como o destaque aparece (cor, itálico,
   sublinhado, `escala` do tamanho) e como o bloco entra (`corte`, `sobe`,
   `desfoque`, `pop`). Legenda em duas vozes (a palavra forte grande e o resto
   pequeno) copia-se no bloco `duas_vozes` da ficha, a partir da `duas-vozes.json`.
3. Escreva a ficha nova em `.claude/skills/cortes/reel/legendas/<nome>.json`, com a
   `origem` dizendo de onde veio. Copiar um estilo é escrever uma ficha, sem mexer
   em código. A `fonte` é o nome da família (`"Roboto"`) ou `"marca"` para a fonte
   de título da marca; cor e peso aceitam os tokens da marca (`var(--accent)`).
4. Monte com a ficha nova sem tocar a `peca.json`
   (`node scripts/reel-falado/montar.mjs <pasta> --ficha <nome>`) e tire o quadro da
   peça ao lado do quadro da referência, no mesmo instante
   (`npx --yes hyperframes@0.8.207 snapshot --at <t> --against <referência>`); mostre
   ao usuário antes do render inteiro.
5. Fonte que o workspace não tem: use a mais próxima disponível e diga qual seria a
   certa. Estilo que bate no que a marca evita (o "O que evitar" de
   `_memoria/escrita-publica.md` e as "Recusas visuais" do `marca.md` da marca:
   caixa alta, tarja, peça que grita): copie, porque é pedido do usuário, e avise
   antes.

**Comparar estilos**, só quando o usuário pedir: monte com cada ficha pelo
`--ficha`, tire o `snapshot` dos mesmos três instantes com legenda, e junte numa
imagem só.
