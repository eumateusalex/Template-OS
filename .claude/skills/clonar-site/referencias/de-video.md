# Modo vídeo: o site que só existe em vídeo ou imagem

Quando a referência é um shot do Dribbble, do Behance ou do Muzli, uma gravação
de tela ou um print, **não há site para capturar**: o ditto não tem o que
fotografar. Aqui a página se refaz a partir dos quadros, com texto, cor, medida
e movimento medidos neles, e se prova contra eles. Nada do `SKILL.md` do clone
(ditto, rotas, as 7 dimensões) vale neste modo: este arquivo basta.

Um conceito de 25 s e 9 seções fecha com os blocos de texto no lugar e pior
diferença de 11 px a 1400. Cada passo abaixo e cada instrumento existe porque um
agente sem contexto tropeçou ali.

## Os caminhos

Todo comando abaixo usa duas variáveis, e nenhum usa `cd`:

```bash
S="<pasta da skill clonar-site>/scripts/video"
P="<pasta do projeto>"     # o destino sai da tabela do SKILL.md
```

O formato de cada arquivo da régua (`alvos.json`, `posicoes.json`,
`posicoes-mov.json`) está no cabeçalho do instrumento que o lê (`tinta.py`,
`fotografa.mjs`).

## A régua deste modo

| # | Dimensão | Instrumento | Reprova sozinho? | Fecha em |
|---|---|---|---|---|
| 1 | **Posição** de cada bloco de texto | `tinta.py comparar` | sim | nenhum bloco fora, nenhum par cego |
| 2 | **Peso da fonte** | a coluna `massa` do `comparar` | sim, em título | nenhum título mais de 8% fora; aviso em texto miúdo olhado no par |
| 3 | **Cor** | `tinta.py cores`, os dois lados | sim, em área chapada e traço grosso | nenhuma cor julgada fora; a de traço fino, declarada |
| 4 | **Olho**, em repouso | `prancha.py pares` e a lupa | não | cada seção com um par e a lupa de cada bloco, olhados |
| 5 | **Movimento** | `fotografa.mjs MODO=sequencia`, `tinta.py entrada`, `prancha.py movimento` | só o quadro 0 | nada que nasce já está na tela no quadro 0; cada par olhado |
| 6 | **Interação** que o vídeo mostra | `regua/interacao.mjs` do projeto | sim | abre por clique e por teclado; o que avança sozinho para |
| 7 | **Largura e movimento reduzido** | `confere-pagina.mjs` | sim | zero falha, da largura do celular à do corte |
| 8 | **Desempenho do movimento** | `npx motionscore <url> --agent` | não (fora do ciclo) | nenhum achado D com conserto barato; o resto, nomeado |

O `regua/conferir.sh` roda 1, 2, 3, 5, 6 e 7 num comando, para na primeira
vermelha e monta a prancha.

🚨 **"RÉGUA VERDE" não é "idêntico".** Ela prova o que a coluna "reprova
sozinho" diz, e mais nada. Fica para o olho, sempre: foto, ícone, a cor de texto
de traço fino, a curva e a duração de cada movimento, e se uma transição é por
rolagem, tempo ou clique. Fica fora do ciclo: o desempenho. Uma régua que só
mede posição deixa passar seis defeitos de uma vez: peso de fonte errado,
texto na tela antes de a seção entrar, título borrado com movimento reduzido,
quatro cores erradas, par de movimento que não foi gerado e conteúdo cortado
pelo próprio cartão a 1024 px. Cada um tem trava na lista acima. **As oito fecham, ou a que não fechou sai nomeada na entrega.**

🚨 **A régua tem de reprovar defeito plantado.** Troque a foto de uma seção pela
de outra e rode `tinta.py comparar`: tem de sair 1. Régua que nunca foi vista
vermelha não prova nada.

## O caminho

### 1. Nascer o projeto, achar a fonte, conferir que o site não existe

O projeto nasce **antes** da referência (o `create-next-app` recusa pasta que já
tem arquivo):

```bash
npx --yes create-next-app@latest "$P" --ts --tailwind --app --no-eslint --no-src-dir --import-alias "@/*" --use-npm --turbopack --yes
npm --prefix "$P" install motion
URL=<link do shot> DESTINO="$P/referencia" node "$S/acha-video.mjs"
```

- **Leia `links para fora`.** Se o autor aponta o site no ar, o caminho é o clone
  normal (`fluxo-completo.md`). Com "nenhum", confirme que é conceito: a frase
  mais específica do vídeo entre aspas numa busca, o domínio da barra do navegador
  falso (muitas vezes o da agência) e a própria legenda do shot ("case",
  "concept", "UI/UX"). Shot de agência: abra a página de cases dela e o Behance, e compare a **paleta** que a página do shot
  declara com a dos shots vizinhos do mesmo autor (shot irmão do mesmo projeto
  tem a mesma paleta; nome parecido com paleta outra é outro trabalho). O curl
  no Dribbble recebe 202 (desafio anti-robô): leia pelo `acha-video.mjs`.
- Sai **2** quando o shot é só imagem: o layout se refaz, o movimento não. Diga
  isso ao usuário antes de começar.
- O Dribbble decide o shot pelo **número** e ignora o resto do endereço: número
  errado abre outro shot, sem erro. Confira o título impresso.
- 🚨 **As imagens do shot (`referencia/imagens/`) leem texto miúdo e nunca medem.**
  A imagem do shot pode ter o título 10 px à direita e uma faixa 26 px mais
  alta que o vídeo: é outro estado do desenho. Quem mede nela desloca a régua
  inteira sem perceber. **A medida é sempre do quadro do vídeo.**
- No `.gitignore` do projeto: `/referencia/*.mp4`, `/referencia/stills/`,
  `/referencia/pares/`, `/referencia/imagens/`, `/regua/fotos/`, `/regua/fotos-mov/`.

### 2. Folhas, moldura e quadros

```bash
bash "$S/quadros.sh" folhas "$P/referencia/original.mp4" "$P/referencia"
bash "$S/quadros.sh" cheio  "$P/referencia/original.mp4" "$P/referencia" 2.5
python -I "$S/tinta.py" moldura "$P/referencia/cheio_2.5.png"
bash "$S/quadros.sh" quadros "$P/referencia/original.mp4" "$P/referencia" 1400:876:100:194 2.0 5.0 9.667
```

- **A moldura** sai das bordas que o `moldura` lista. Qual delas é a página, você
  decide olhando o quadro: com navegador falso, o topo é a borda logo abaixo da
  barra; com cartão de cantos redondos, a de fora. Respiro branco com a mesma
  folga nos lados é **página** (padding do layout), não moldura.
- 🚨 **Corte só em número par.** O vídeo é yuv420 e o ffmpeg arredonda o ímpar
  calado; o `quadros.sh` recusa. Página de largura ímpar perde 1 px de um lado em
  qualquer corte par: tanto faz qual, desde que **o mesmo corte** valha para todos
  os quadros e vá para o `"corte"` do `alvos.json`.
- **A altura do corte não é janela de ninguém** quando o vídeo corta a página
  embaixo: é só onde o vídeo acaba. Ela serve de altura da janela na foto, e mais
  nada.
- **Um quadro por estado parado**, no instante em que a entrada acabou e a
  próxima mudança não começou. Estado é mais que seção: cada aba aberta, cada
  item de acordeão e cada passo de uma transição que para são quadros.
- 🚨 **Olhe as folhas atrás de transição entre seções.** O que acontece ENTRE dois
  quadros parados costuma ser a animação principal: hero que encolhe e vira faixa,
  seção que gruda no topo, cartão que troca de lugar. Se dois "quadros" mostram o
  mesmo elemento em tamanhos diferentes, é **um componente só** com dois estados,
  não duas seções (e duas seções empilhadas passariam na régua de posição).
  Anote os instantes de começo e fim: viram o par de movimento do passo 5.
- **Rolagem, tempo ou clique?** O vídeo não mostra o dedo. Sinais: o resto da
  página anda junto e na mesma velocidade → rolagem; a página está parada e só
  um elemento muda, em tempo redondo (1 s, 3 s) → tempo; muda logo depois de o
  cursor parar em cima de algo → clique. Máquina nenhuma decide isso: na dúvida,
  é escolha do usuário; pergunte, ou declare a que você adotou. **A mesma transição
  pode ser as duas coisas**: um leque pode fechar numa pilha enquanto a página
  rola, e a pilha só abre em cascata com a página já parada na seção
  seguinte (dispara na chegada e desfaz ao rolar de volta). Olhe quadro a quadro
  em volta da transição (`fps=10` e `tile=4x4` no trecho) antes de decidir.
- 🚨 **Cena presa (leque, pasta, cartão que encolhe) acompanha a rolagem, amortecida
  por mola; entrada (palavra, cartão que sobe, faixa que cresce) tem tempo próprio.**
  A transição da cena tem uma faixa de rolagem, e a mola (`useSpring` sobre o
  `useTransform` da rolagem, sem repique) tira o tranco: rolar devagar mostra a
  transição devagar, parar no meio deixa a cena no meio. Fase disparada por limiar
  ("toggleActions") faz a cena inteira saltar de uma vez, e isso reprova (não é uma
  transição leve com a rolagem); amarrar quadro a quadro sem mola dá o tranco. A
  entrada mede-se no vídeo: escolha um elemento que só rola (um título) e meça ele e o
  que se move ao lado; se o título parou e o cartão segue subindo, a subida é do
  cartão, com tempo dele.
- **Fluidez se prova filmando, não fotografando.** Foto parada passa verde com a cena
  saltando. Role o clone com a roda do mouse (pelo Lenis), fotografe sem parar e ponha
  a folha embaixo da do vídeo no mesmo trecho; o que salta, o que entra fora de ordem e
  o que fica sobreposto aparece ali. A skill não tem o filmador pela roda do
  mouse: ele se escreve no projeto. A varredura programada é o `fotografa.mjs`
  com `MODO=sequencia` e `rolarAte`, e o par com o vídeo, o `prancha.py movimento`.
  Para trajetória (avatares em onda), meça a mesma coisa nos dois com a
  mesma ferramenta, só nos quadros em que o vídeo está parado.
- **Ordem de entrada é medida, não suposta.** A pílula de @, a seta e o ícone entram
  DEPOIS do elemento principal da seção (0,4 a 1,3 s depois, por exemplo). Anote a
  ordem e o instante de cada um no `referencia/mapa.md`, e segure a entrada com um
  sinal (`quando`) de que a cena ASSENTOU (a mola passou de 0,97, a animação da faixa
  terminou), não com um atraso fixo a partir da rolagem.
- 🚨 **O fundo se mexe?** Aquarela, gradiente vivo ou vídeo atrás do hero
  passa por imagem parada. Tire o mapa de diferença de dois quadros sem
  interface (0 s e 2 s, por exemplo), testando escala de 1,00 a 1,04 e
  deslocamento de ±6 px: diferença que cresce sem casar com zoom nem
  deslocamento é fluxo próprio do fundo (uma aquarela que é vídeo vivo se faz
  com o quadro limpo de 0 s e uma distorção leve em WebGL, parada com
  movimento reduzido).
- Texto miúdo e o endereço da barra: recorte e amplie
  (`crop=...,scale=2700:-1:flags=lanczos`), ou leia nas imagens do shot.

### 3. Medir: texto, cor e fonte

1. **`regua/alvos.json`**, com a `largura` e o `corte` do vídeo e os blocos de
   texto de cada quadro (formato no cabeçalho do `tinta.py`):
   - a caixa é a região onde procurar, com folga, e o canto de cima à esquerda
     TEM de ser fundo;
   - **uma linha e um estilo por caixa.** Caixa de três linhas mede só a mais
     larga, e uma quebra de linha trocada passa. `tinta.py linhas <quadro> x0 y0
     x1 y1` corta as linhas (inclusive as de entrelinha apertada) e sugere a
     caixa de cada uma; `tinta.py colunas` corta dois estilos lado a lado
     ("Board:" e "CRM", números em fila). O `medir` acusa a caixa com mais de
     uma linha;
   - 🚨 **toda seção precisa de um bloco que só ela tem.** Logo e navegação
     existem iguais em todo quadro: com só eles, a foto da seção errada passa. O
     `comparar` reprova o par cego;
   - texto sobre foto mede mal (a foto vira "tinta"): prefira o que está sobre
     fundo chapado, e aperte a caixa quando não houver.
2. `python -I "$S/tinta.py" medir "$P/regua/alvos.json" "$P/referencia/stills"`
   dá largura e altura da tinta de cada bloco.
3. **Cores**, no mesmo arquivo, cada uma com `"original"` e `"foto"`:
   - fundo e área chapada com `"ponto"`; cor de texto com `"caixa"`;
   - 🚨 **cor de texto só se julga em traço grosso** (4 px ou mais: títulos). Em
     traço fino a borda suavizada domina, e o vídeo ainda puxa o tom para o
     cinza e para o fundo (ele guarda a cor em meia resolução): tinta escura de
     12 px sobre cartão azul sai lida `#5B6C68`. O `cores` escreve "n/c" nessas
     e não julga. Se a mesma cor existe numa área chapada (um botão, um selo),
     meça lá; se só existe em texto fino, vai declarada como lida no olho.
4. **A fonte**, pelo `ajusta-fonte.mjs` (o cabeçalho dele diz como):
   - **olhe antes**: sem-serifa, serifa ou mono? `FAMILIA=serifa` troca a lista.
     Título e corpo costumam ser de famílias diferentes: uma prova para cada;
   - `MODO=prova` desenha cada linha em cada candidata, do tamanho da tinta,
     embaixo do recorte do vídeo. **Escolha no olho**, pelas letras que mudam
     (a, g, y, t, R, q, $, 1);
   - com as finalistas, `PESOS=400,500,600` desenha cada peso (e avisa do peso
     que a fonte não tem). **O peso se chuta aqui e se mede no passo 5**, pela
     massa;
   - 🚨 **número não escolhe fonte.** Pela largura e altura, 12 grotescas dão o
     mesmo desvio; pelo formato pixel a pixel, a mesma fonte varia de 0,35 a
     0,68 entre textos. Só o olho separa;
   - `MODO=tamanho` dá o tamanho de cada texto, em px e rem (um estilo por linha).

### 4. Construir

| Arquivo | Leva |
|---|---|
| `lib/conteudo.ts` | **todo** texto, número, link e foto. Trocar a marca é editar só ele. Texto que o vídeo não mostra entra marcado. **Origem em outra língua e entrega em pt-BR**: `conteudo.en.ts` é o molde, com o texto do vídeo (é ele que a régua mede), `conteudo.pt.ts` é a tradução, os dois cumprem o mesmo tipo (`lib/tipo.ts`, o TypeScript reprova chave faltando) e o `conteudo.ts` escolhe por `NEXT_PUBLIC_IDIOMA` no build (`IDIOMA_REGUA=en` no `conferir.sh`). O português se confere pelas larguras e no olho |
| `app/globals.css` | os tokens de cor medidos, no `@theme` |
| `components/movimento.tsx` | copiado de `modelos/movimento.tsx` e ajustado ao vídeo |
| `components/pecas.tsx` | botão, marca, logos, ícones e avatares |
| `components/secoes/` | um arquivo por seção, **ou por componente que atravessa seções** |
| `public/img/` | as fotos |
| `regua/` | `conferir.sh` e `interacao.mjs` (de `modelos/`), `alvos.json`, `posicoes.json`, `posicoes-mov.json` |

- **A escala acompanha a janela.** Tudo em rem, e do desktop para cima 1 rem
  vale 16 px na largura do corte: `font-size: calc(100vw / (LARGURA / 16))`, que
  é `100vw / 87.5` para 1400 e `100vw / 105.125` para 1682.
  🚨 **O piso do `clamp` sai da conta, não do exemplo:** `1024 / (LARGURA / 16)`
  px, arredondado para baixo (11,7 para 1400; 9,7 para 1682). Piso maior que
  isso corta conteúdo entre 1024 px e a largura em que ele deixa de valer (o
  `confere-pagina` pega: "texto cortado pelo próprio cartão"). O teto é gosto
  (22 px segura telas largas).
- **Elemento que atravessa seções** (o hero que vira faixa) é um componente só,
  dirigido pelo progresso da rolagem ou por tempo. Exemplo real e testado em
  `modelos/exemplo-hero-que-vira-faixa.tsx`: altura por `transform` e
  `clip-path` (nunca `height`), e o estilo sempre com as mesmas chaves.
  **Cartões que viajam entre seções** (leque que vira pilha e cascata, pilha que
  vira diagonal e grade) moram numa **cena presa**: uma trilha alta com um palco
  `sticky` de uma janela, e cada cartão com uma pose por fase (centro, giro,
  escala, opacidade, recorte), misturadas pela rolagem dentro da trilha. Cartão
  que muda de proporção (retrato na diagonal, paisagem na grade) não muda de
  tamanho: escala e `clip-path: inset(...)`.
- 🚨 **`useTransform(() => ...)` só acompanha o valor que leu na primeira
  vez.** Se a função sai cedo (a trilha ainda não montou) antes de ler o
  `scrollY`, a cena nunca mais se mexe, sem erro nenhum: leia o `scrollY.get()`
  na primeira linha.
- 🚨 **Texto apagado de propósito vai por cor, não por opacidade** (a roda de
  um celular, as palavras cinzas de uma frase que escurece). Opacidade baixa
  conta como texto escondido no `confere-pagina` (e para leitor de tela): use a
  cor já misturada no fundo.
- 🚨 **O que some de propósito leva `visibility: hidden`** no estado apagado
  (o conteúdo do hero depois que ele virou faixa). Só com opacidade zero, o botão
  invisível continua recebendo foco, e o `confere-pagina` reprova como texto preso.
- **Posição em rem absoluto é o que faz a régua fechar em poucos px, e não
  empilha sozinha.** Abaixo de 1024 px a página é **adaptação sua**, com custo
  próprio (umas 25 classes `max-lg:` e um `matchMedia` para desligar a
  transição). Faixa que corre de lado no celular leva `overflow-x-auto`. O vídeo
  só mostra o desktop: declare.
- **O original torto se reproduz.** Título 17 px fora do centro no vídeo fica
  17 px fora do centro aqui: a régua mede contra o vídeo, e "corrigir" o
  designer é mudar a referência dele. Declare o que achou torto.
- **Componente pronto antes de escrever**: procure no Magic UI e
  no shadcn pelo MCP. `modelos/movimento.tsx` já traz texto palavra por palavra,
  cartão que cresce, contagem e trilho. **Sem peça que sirva**, escreva em Motion
  puro e diga no README de onde nada veio.
- **O que avança sozinho para quando a pessoa escolhe** (aba, carrossel): é o
  comportamento certo, e é o que deixa a foto da régua cair no estado pedido.
  Nunca escreva parâmetro de URL ou código só para a régua medir.
- **Fotos** saem do próprio vídeo: recorte, e `delogo` do ffmpeg sobre o texto
  que estava em cima. Texto sobre foto que a tradução vai trocar sai **só pela
  tinta da letra** (máscara do que não tem cor, ou caixa inteira sobre fundo
  borrado) e se preenche pela vizinhança com a solução de Laplace (`scipy`
  esparso): o retângulo remendado aparece atrás do texto novo. Cartão que o
  vizinho cobre em todo quadro (leque, cascata) se endireita pelo ângulo medido
  e a parte coberta se estica da borda visível. A skill não tem essas duas
  ferramentas: o remendo e o endireitamento se escrevem no projeto. Foto com **primeiro plano na frente do conteúdo** (grama,
  pedra, mão) pede duas camadas: o fundo e uma máscara do primeiro plano, por
  cor ou por silhueta. É trabalho à mão, fica com dente e se declara. Todas
  ficam moles em tela grande: são marcação.
- **Logo, ícone de marca de terceiro e avatar** se redesenham em SVG ou se
  recortam do quadro. Parecidos, não iguais: declare.

🚨 Três heranças que passam pelo build verde e só a medida pega:
- `letter-spacing` em `em` no `body` é herdado **já em px**: o título grande fica
  solto. Vai em `*`, numa `@layer base`.
- `var()` dentro de um token do `@theme` resolve no `:root`: variável posta no
  componente não chega. A duração do trilho vai direto no elemento.
- No Motion, tirar uma chave do `style` (ou `AnimatePresence initial={false}`
  num pai) deixa o filho preso no último valor ou sem entrada. A dimensão 5 e a
  7 pegam; a 1, nunca.

### 5. Provar

```bash
bash "$P/regua/conferir.sh"             # o ciclo inteiro, uns 2 min
bash "$P/regua/conferir.sh" --rapido    # só posição e peso, uns 40 s
PORTA=4518 bash "$P/regua/conferir.sh"  # outra porta
```

O `conferir.sh` (copiado de `modelos/`) derruba a porta, faz `next build` e
`next start` (nunca `next dev`), fotografa e prova na ordem 1, 2, 3, 5, 6, 7,
parando na primeira vermelha com "RÉGUA VERMELHA: <qual>". No fim monta a
prancha e repete o que ficou de fora. Os instrumentos também rodam soltos; o
cabeçalho de cada um diz como.

**O que cada arquivo do projeto diz à régua:**

- **`posicoes.json`** põe cada foto na mesma rolagem do quadro: o `y` é onde o
  topo do elemento aparece no quadro do vídeo. Estado que precisa de clique (a
  segunda aba) leva `"clicar"`. A janela da foto é a do corte (`QUADRO` lê do
  quadro; não há padrão).
- **`posicoes-mov.json`** tem uma posição por entrada e por transição, cada uma
  com `"video"` (o segundo do vídeo em que ela começa) e `"nasce"` (as caixas, em
  px da foto, do que entra: o título, pelo menos). A rolagem da foto é uns 40 px
  antes do repouso, para a entrada acontecer na tela. Transição ligada à
  rolagem leva `"rolarAte"`: as fotos varrem a rolagem em vez de esperar o tempo.
  Cada posição roda numa página nova (formato no cabeçalho do `fotografa.mjs`).
  🚨 **`rolarAte` é a rolagem absoluta da página**, não a distância a partir do
  `y`: um valor pequeno faz a varredura voltar para o topo. Leia o topo da trilha
  no navegador e some.
- **Cena presa na foto**: o `seletor` é a trilha (não o palco `sticky`, que não
  se move em linha reta) e o `y` é negativo: quanto já se rolou dentro dela.
- 🚨 **Entrada que dispara na montagem não é retida** pelo `fotografa.mjs`: ele
  segura só o IntersectionObserver até a foto 0. Título do hero que anima ao
  montar sai pronto no quadro 0 ("JÁ ESTAVA LÁ"). Faça o texto do topo entrar
  por `whileInView`: ao abrir é igual, e com a rolagem restaurada no meio da
  página ele não corre escondido.
- **`interacao.mjs`**, do molde em `modelos/`: clique **e** teclado, e saída 1.

**Como ler a saída:**

- **Posição**: tolerância de 12 px a 1400, na proporção da largura. A tabela de
  diferenças por lado (x0, x1, y0, y1) diz o que corrigir: os quatro iguais é
  deslocamento; x1 sozinho é tamanho, espaçamento ou quebra de linha.
- **Massa** é a tinta da foto sobre a do original. Cada 100 de peso de fonte
  mexe uns 12% nela. Título mais de 8% fora **reprova** ("PESO FORA"); suba ou
  desça o peso (`font-[550]` existe). Texto miúdo oscila ±20% com o borrão do
  vídeo e só avisa de 25% para cima. Bloco de contraste baixo (cinza-claro) sai
  "n/c": peso e cor dele se conferem na lupa.
- **Cor**: "COR FORA" é diferença de mais de 30 na soma dos canais.
- **Entrada**: "JÁ ESTAVA LÁ" é texto que nasce numa entrada e já aparece no
  quadro 0 dela. É a assinatura de entrada quebrada.
- **Página**: "texto cortado pelo próprio cartão" compara com a largura do
  corte; o que já sai cortado lá é desenho do original. "Preso" é o texto que
  continua borrado ou apagado depois de posto no meio da tela, com movimento
  reduzido, em qualquer parada da rolagem.

**O que só o olho fecha**, na `referencia/pares/comparacao.html`:

- o **par em repouso** de cada estado, em tamanho real (clique abre o arquivo);
- a **lupa** de cada bloco medido, ampliada duas vezes, com o vídeo em cima:
  quebra de linha trocada, número menor e cor de texto fino aparecem aqui e não
  no par inteiro;
- o **par de movimento** de cada entrada, com o vídeo em cima nos mesmos
  instantes: a ordem, de onde cada coisa vem e quanto dura. Os tempos lidos na
  folha de 3 quadros por segundo são estimativa: declare.

**A curva se mede, não se estima** (o que a folha de 3 quadros por segundo não vê):

```bash
# o vídeo a 30 fps, no corte, e as caixas dos elementos num json {"caixas": {...}}
ffmpeg -nostdin -ss <t0> -t <dur> -i "$P/referencia/original.mp4" -vf "fps=30,crop=<corte>" "$P/referencia/q/q_%04d.png"
python -I "$S/curva.py" "$P/referencia/q" caixas.json 30
# o clone, em câmera lenta, com o tempo real no nome do quadro
LENTA=12 node "$S/grava.mjs" http://localhost:4517 "$P/referencia/g" 2.5
python -I "$S/curva.py" "$P/referencia/g" caixas.json nome
```

Sai, por elemento, o instante em que ele passa de 10%, 50% e 90% da tinta final e
quanto ainda estava abaixo do lugar (a subida). Compare o ritmo relativo (o intervalo
entre elementos e o 10%→90% de cada um), não o instante absoluto: o clone carrega e
hidrata antes de começar. Um título bem feito fecha em 21–22 px de subida contra
21–23 do vídeo, 0,34 s de 10% a 90% contra 0,34–0,37, uma palavra a cada 0,13 s.
⚠️ O primeiro quadro do arquivo costuma ser a capa (o estado final): tire-o. O
`grava.mjs` desacelera só a WAAPI (opacidade, transform, filtro do Motion); o que o
Motion anima em JavaScript sai no tempo errado, e a taxa nem sempre segura: grave três vezes e só confie no número que se repete.

**Desempenho** (dimensão 8, fora do ciclo): `npx --yes motionscore http://localhost:4517 --agent`.
Achado D com conserto barato se conserta (`width` e `height` animados viram
`transform` ou `clip-path`; trilho fora da tela pausa). O que não tem conserto
barato (altura de acordeão, "excess scroll listeners") sai nomeado.

### 6. Entregar

A página `referencia/pares/comparacao.html` abre no navegador do usuário. **O que não é igual se declara antes da entrega**, com o motivo:

- fotos tiradas do vídeo, e as máscaras feitas à mão;
- fontes escolhidas no olho, e o peso medido pela massa;
- cores que só existem em texto fino, lidas no olho;
- logos, ícones e avatares redesenhados;
- texto que o vídeo não mostra, marcado em `conteudo.ts`;
- transição cuja causa (rolagem, tempo, clique) foi escolha sua;
- tempos estimados na folha;
- celular e tablet, que são adaptação;
- o que não foi medido (hover, outros navegadores, o resto da página).

## Os instrumentos

Moram em `scripts/video/`. Cada cabeçalho diz uso, variáveis e saída.

| Instrumento | Responde |
|---|---|
| `acha-video.mjs` | onde está o vídeo do shot, se há site no ar, e as imagens para ler texto |
| `quadros.sh` | folhas, quadro cheio e quadros recortados, só em corte par |
| `tinta.py` | `moldura`, `linhas`, `colunas` e `medir` para montar o `alvos.json`; `comparar` (posição, peso, par cego), `cores` (os dois lados) e `entrada` (o quadro 0) para provar |
| `ajusta-fonte.mjs` | a prova visual de fonte e de peso, e o tamanho de cada texto |
| `fotografa.mjs` | a reconstrução nas mesmas posições: parada, em sequência ou varrendo a rolagem |
| `prancha.py` | os pares em tamanho real, a lupa de cada bloco, o par de movimento e a página de comparação |
| `confere-pagina.mjs` | larguras, texto cortado pelo cartão, movimento reduzido em cada parada, imagem quebrada e console |

Em `modelos/`: `movimento.tsx`, `conferir.sh`, `interacao.mjs` e
`exemplo-hero-que-vira-faixa.tsx`.
