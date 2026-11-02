---
name: video
description: Vídeo feito em código (Reel animado, vinheta, lançamento, explicativo, remake), com MP4 e legenda. Use para "faz um vídeo", "vídeo animado", "vinheta" ou /video. Motion dirigido é a /mograph; vídeo gravado é /cortes.
---

# /video · o vídeo feito em código

Um pedido de vídeo vira um MP4 dirigido, não um HTML que se mexe. A diferença
entre os dois não está no motor: está no método (referência, batidas, quadros
parados aprovados antes da animação, som no pico medido, e um crítico que não
construiu a peça). Os melhores resultados de motion feitos com IA saem de HTML
puro, sem framework, e todos com o mesmo método.

**O que não é daqui:** a direção de uma peça (a sabatina, a referência
decomposta, a prancha de direções, o plano de cada frase, a biblioteca de
comportamentos e a auditoria do construtor) é da `/mograph`, que produz por
aqui; vídeo gravado vira Reel pela `/cortes` (com motion por cima, pela
`/mograph`); animação de site ou de tela é `/motion` e `/gsap`.

## Onde ela roda

- A skill mora em `.claude/skills/video/`, e os comandos rodam da raiz do
  workspace (`node .claude/skills/video/ferramentas/...`).
- **O método, o texto e a estrutura valem para qualquer peça; a marca é do
  dono da peça.** A deste workspace mora em `identidade/marca.tokens.json` <!-- caminho futuro: o arquivo da marca nasce no /marca configurar -->
  (cor, fonte, curva, recusas) e `identidade/marca.md` (logo, voz de narração e <!-- caminho futuro: o arquivo da marca nasce no /marca configurar -->
  recusas visuais em prosa), os dois gravados pelo `/marca configurar`;
  o `scripts/marca/gerar.mjs` leva a marca ao `tokens.css` e ao `movimento.js`
  de `.claude/skills/carrossel/marca/` e ao `marca.ts` do Remotion. A voz do texto,
  o público e o CTA vêm da `_memoria/` (o público e a oferta em `oferta.md`, a voz em `escrita-publica.md`); a
  régua de texto é o `_memoria/escrita-publica.md`, e a de legenda, o
  `scripts/lib/legenda.js`.
- 🚨 **Sem marca configurada, não há vídeo.** O sinal é o mesmo de todas as
  skills visuais: o `scripts/marca/marca.mjs` (`lerMarca`) lê o
  `identidade/marca.tokens.json`, e o arquivo que falta, o molde copiado ou o <!-- caminho futuro: o arquivo da marca nasce no /marca configurar -->
  esquema quebrado dão a mesma frase ("a marca não está configurada: rode
  /marca"). Faltou: **parar e dizer ao usuário** que o conserto é
  `/marca configurar`. A máquina segura o mesmo: o `nova-peca.mjs`, o
  `marca-remotion.mjs`, o `marca.ts` do Remotion, o montador do reel falado e o
  `cortes.mjs` param com essa frase.
  Vídeo na paleta de demonstração sai com cara de template, e refazer custa a
  peça inteira.
- Dois plugins de terceiro são opcionais, e a skill roda sem eles: o
  `hyperframes` (as skills oficiais do motor; sem ele, a mesma documentação sai
  do CLI) e o `watch` (lê um vídeo por link ou arquivo e devolve quadros com o
  tempo e a transcrição, para decompor uma referência; sem ele, `yt-dlp` e
  ffmpeg à mão). Como instalar cada um: `hyperframes.md`, "Os plugins
  opcionais".
- **Num computador novo, primeiro a conferência do ambiente**:
  `node .claude/skills/video/ferramentas/ambiente.mjs` diz o que falta (ffmpeg,
  o Python da mixagem, a raiz de material, se houver) e o comando de cada falta.
  O material pesado (bancos de som, pacotes de componentes) mora fora do git,
  numa pasta por máquina; o que se aprende dele (os índices, as fichas) mora no git.

## 0 · O padrão, antes do primeiro rascunho

Seis coisas fazem uma peça voltar para retrabalho, e valem desde o primeiro
rascunho:

1. **Texto que qualquer um entende na primeira leitura.** Frase curta, uma ideia,
   com "você" e a perda; nada técnico sem traduzir. A régua é o
   `_memoria/escrita-publica.md`, e todo texto passa pela revisão de comunicação
   **antes** do render, não depois.
2. **O fecho mostra o valor de quem assina no problema do vídeo.** A última
   frase e a assinatura ligam o tema ao que o usuário (ou o produto) resolve.
   Nunca a frase de posicionamento solta, nunca CTA que manda a pessoa resolver
   com um terceiro ("pergunte a quem cuida do seu anúncio"): a régua da legenda
   (checagem 6b do `scripts/lib/legenda.js`) reprova esse CTA.
3. **Premium, não cru.** Fundo chapado com um objeto no meio parece cru. O vídeo
   tem camadas (foto real, ilustração ou personagem, profundidade, perspectiva),
   edição com cortes e planos novos, e a cor da marca trabalhando (o que é
   premium, medido, está no `.claude/skills/mograph/oficio.md` § 5, com a entrada do manual de cada sintoma). **A base é a
   da marca, o charme é dos componentes**: por cima do fundo e da letra da marca
   entram componentes com volume (quais, no `oficio.md` § 4 da `/mograph`), com
   luz, profundidade e som em cada ação. O ofício que separa o vídeo sênior do
   básico, com número, está em `.claude/skills/mograph/oficio.md`.
4. **A linguagem é escolha do usuário, e se escolhe vendo.** Registro claro ou
   escuro, textura de fundo (a grade técnica do kit, foto, plano de cor),
   personagem ou não: na primeira peça, e sempre que a linguagem for nova, a
   direção vai para o usuário como **prancha** (3 a 4 quadros parados de cada direção,
   lado a lado) antes de qualquer render. A escolha do usuário vira o campo
   "Linguagem" do roteiro e vale para as peças seguintes; uma recusa entra na
   hora no `identidade/marca.md` (o documento dono; a recusa que tem <!-- caminho futuro: o arquivo da marca nasce no /marca configurar -->
   identificador vai ao `recusas` do `identidade/marca.tokens.json`) e não volta. <!-- caminho futuro: os dois nascem no /marca configurar -->
   A peça dirigida tira a direção da prancha da `/mograph`; a peça sem direção
   nova (a vinheta, o P) segue a do pedido ou a do `brief.md` de uma peça
   anterior aprovada.
   **A estrutura narrativa é a de `.claude/skills/mograph/roteiro.md`** (o
   orgânico em seis partes, o anúncio, a peça com partes). **Componente de
   motion vem da biblioteca primeiro** (`.claude/skills/mograph/biblioteca.md`):
   o que o usuário aprovou se reusa, o registro aberto se instala, o pago se
   refaz pelo comportamento; do zero só o que não existe, e todo componente novo
   se registra.
5. **As contas vêm antes do código, e o roteiro é revisado quadro a quadro.** Peça
   construída antes de três contas que dava para fazer no papel volta em rodadas
   de revisão. Elas abrem toda peça, no `roteiro.md`:
   - **tempo:** cada texto na tela fica o tempo de leitura (a conta é a de
     `.claude/skills/mograph/roteiro.md`, "As contas": ~3 palavras por segundo,
     inteira na tela por 1,2 s ou mais), somados até caber na duração; o que não cabe vira frase única ou
     sai, antes da animação. Com narração, cada fala na janela da batida dela
     (`voz.md`);
   - **espaço:** a altura útil da zona segura do destino
     (`ferramentas/formatos.json`: Reels, anúncio de Reels, Shorts, TikTok,
     feed 4:5, quadrado e 16:9) dividida entre os elementos, medida no quadro
     mais cheio (mais linhas de título, mais elementos ao mesmo tempo). Confira
     a zona na especificação atual da plataforma quando ela mudar;
   - **história:** o `revisor-de-comunicacao` lê o storyboard (o que se vê e o que
     se lê em cada batida), não só a copy: é ali que aparece o "depois" sem a
     consequência mostrada.

   Depois das contas, os quadros parados dos momentos-chave, e só então o
   primeiro render inteiro.
6. **Com voz, a voz e a tela andam juntas, e o anúncio diz o que vende.** Três
   coisas fazem a peça narrada voltar: a voz que não diz o produto, a que fala de
   uma coisa com outra na tela (o preço, com o prazo na tela), e o intervalo entre
   as falas que faz quem assiste acelerar. A tela traz a palavra-chave, a voz a
   frase, presas pelo tempo de cada palavra; no anúncio, o produto se diz até os
   3 s e a oferta até os 8 s. O método está em `voz.md`, e a trava é a
   `ferramentas/regua-voz.mjs`.

**A estrutura que funciona num Reel de argumento (15 a 30 s):** o gancho com a
perda de quem assiste, a cena do problema acontecendo, a prova que mostra o furo,
a consequência, a virada com quem assina resolvendo, e a assinatura com o valor.
**Os componentes de motion não se copiam** de uma peça para outra: cada peça
monta os seus a partir das referências do pedido.

**Tema ou exemplo que o usuário traz é matéria-prima, não sugestão.** Se o pedido
vem com tema, referência, print ou vídeo de exemplo, ele entra decomposto no
roteiro (o que prende, o ritmo, o que se mostra) antes da primeira linha de código.

## 1 · A mini-entrevista

**Começa pelo estilo.** Todo pedido de vídeo cai num dos estilos de
`estilos.md` (o material, o destino, o quanto de edição, a legenda), e o estilo diz
quem atende, a estrutura e a pasta de entrega. Estilo de outra porta (o `falado`, o
`corte`) vai para ela; o que é desta porta segue para as
perguntas abaixo, sem repetir o que o estilo já resolveu.

Uma chamada de AskUserQuestion, com a recomendada primeiro. O que o pedido já
disse não se pergunta.

| Pergunta | Opções | Recomendada |
|---|---|---|
| **Motor** | HyperFrames (HTML + GSAP) · Remotion (React) | HyperFrames. Remotion quando a peça já existe nele ou precisa de legenda palavra a palavra do `@remotion/captions` |
| **Material** | só código · código com IA (`/gerar-imagem` para quadro, `scripts/gerar-video.js` para plano em vídeo; **custo dito antes**) · material real (gravação, print, foto) | só código |
| **Formato** | 9:16 · 4:5 · 1:1 · 16:9 · mais de um (reenquadrados da mesma linha do tempo, nunca cortados); cada um com a zona do destino em `ferramentas/formatos.json` | 9:16 |
| **Voz** | sem voz · a voz do usuário, gravada · voz artificial da ElevenLabs (plano gratuito: só para o que não se publica) (`voz.md`) | sem voz, se não houver gravação |

**De onde vem o vídeo filmado**, na ordem:

1. **Banco de licença comercial clara**, que é grátis e mais rápido que gerar
   (Pexels, Pixabay, Mixkit, Coverr), com a licença conferida na página do
   arquivo e anotada na tabela de ativos do `roteiro.md`.
2. **Gerado por IA** para o que o banco não tem: a cena específica da peça, o
   produto, o lugar, o impossível. O custo é dito antes. Depois de baixar, medir
   com `ffprobe` (a duração útil é a medida, não a pedida; plano de 24 qps entra
   como vídeo numa peça de 30) e olhar uma folha de quadros procurando o defeito
   de IA (a pessoa que fica translúcida, a mão que muda).
3. **YouTube Shorts, TikTok e Instagram são referência**, nunca material de
   peça pública: o vídeo é obra de outra pessoa. A exceção é o vídeo com licença
   Creative Commons declarada ou com autorização escrita do autor, com o crédito
   na legenda.

Voz de pessoa real só com a autorização dela, e esta skill não faz clonagem de
voz (`voz.md`).

**A marca não se pergunta, se deduz do lugar:** peça deste workspace usa a marca
de `.claude/skills/carrossel/marca/`; peça de projeto usa a marca do `CLAUDE.md`
do projeto; peça de cliente usa o guia do cliente. Na dúvida entre projeto e
cliente, perguntar.

**Nomeie o motor no primeiro prompt de construção.** Sozinho, o modelo ignora
Remotion e HyperFrames instalados e escreve um `index.html` qualquer com
Playwright.

## 2 · O tamanho

| Tamanho | Quando | O que roda (`metodo.md`) |
|---|---|---|
| **P** | vinheta, peça até 10 s, sem texto de venda | roteiro curto, quadros parados, render, crítico. **Vinheta de abertura de Reel** tem de 1,5 a 3 s (10 s antes de cada Reel derruba a retenção): se o pedido disser mais, propor a curta e deixar o usuário escolher. Vinheta de aula, live ou vídeo longo vai até 8 s, e o formato é o que o pedido disser. A vinheta não mede ritmo contra linguagem (`linguagens.md`). Entrega o MP4 com o `RELATORIO.md` e o `registro.json`, sem legenda nem capa |
| **M** | Reel com argumento, na duração da função (15 a 30 s no orgânico de argumento; até 180 s no de autoridade) | tudo do P, mais manifesto, batidas com "o que o espectador entende", som medido, revisor de comunicação e legenda |
| **G** | lançamento, explicativo longo, remake de referência | tudo do M, mais referência decomposta, a prancha de direções e o animatic (`metodo.md`, estados 3, 4 e 8) |

O que se pula fica em "Decisões" do `roteiro.md`, com o motivo e o risco.

## 3 · Onde a peça mora

- **Deste workspace:** `.claude/video/html/<nome>/`. O final vai para
  `saidas/<estilo>-<tema>-<AAAA-MM-DD>/` <!-- caminho futuro: nasce por peça -->, com o estilo de `estilos.md`.
- **De projeto ou de cliente:** na pasta dele (o `CLAUDE.md` de lá diz qual), e o
  render é chamado de lá. O motor não precisa de `node_modules`: o CLI roda fixo
  pelo `npx`. O `--em` é obrigatório, e a peça define os tokens da marca do dono
  no `:root` (o aviso no `index.html` diz quais).
- **Remotion:** uma pasta por peça em `.claude/video/src/`, registrada no
  `Root.tsx` (as regras em `.claude/video/README.md`, o catálogo de técnicas em
  `.claude/skills/remotion/CATALOGO.md` <!-- caminho futuro: o scripts/terceiros/instalar.mjs grava, com a peça remotion -->). A marca chega pelo `src/marca.ts` (cor,
  fonte, peso e a curva em `MOVIMENTO`), que o `scripts/marca/gerar.mjs` gera do
  `identidade/marca.tokens.json` junto com as outras saídas; o <!-- caminho futuro: o arquivo da marca nasce no /marca configurar -->
  `ferramentas/marca-remotion.mjs` faz o mesmo só para ele e confere com
  `--conferir`.

```bash
node .claude/skills/video/ferramentas/nova-peca.mjs <nome>                          # deste workspace, em .claude/video/html/
node .claude/skills/video/ferramentas/nova-peca.mjs <nome> --em <pasta>             # projeto ou cliente (só o GSAP, sem a marca daqui)
node .claude/skills/video/ferramentas/nova-peca.mjs <nome> --em <pasta> --com-marca # peça daqui fora do estúdio (teste em rascunho/)
node .claude/skills/video/ferramentas/apagar-peca.mjs <pasta>                       # a ÚNICA forma de apagar uma peça
node .claude/skills/video/ferramentas/marca-remotion.mjs                            # a marca no Remotion (src/marca.ts); --conferir só confere
```

A peça nasce com `index.html` (o esqueleto com as regras de render),
`roteiro.md`, `hyperframes.json`, `ativos/` e as junções. Se a peça baixa áudio
ou recorta imagem, copie `ferramentas/modelo-ativos.sh` para a pasta dela como
`ativos.sh` e preencha.

🚨 **Peça se apaga só pelo `apagar-peca.mjs`.** A junção `_marca` leva à marca do
workspace: `rm -rf` e o Explorer a atravessam e apagam o `tokens.css`, a logo e
as fontes. Vale também para esvaziar `rascunho/` quando houver peça lá dentro.

**O que da marca a peça alcança pela junção:** `_marca/tokens.css` (cores e
fontes), `_marca/logo/` e `_marca/fontes/`. Nunca `../` e nunca junção nova feita
à mão. Logo em PNG não cresce além de 1,5× do tamanho original: maior que isso,
pedir o vetor ao usuário.

## 4 · O fluxo

1. **Roteiro antes do código.** A linguagem da peça (`linguagens.md`: escolhida pela finalidade, com
   as faixas medidas dela abertas antes de dirigir) e o `roteiro.md` com manifesto (aberto pelo filme
   numa frase), a afirmação e a base dela, batidas em quadros com a fala (quando
   há voz), a coluna "o que o espectador entende", efeitos,
   origem dos ativos, as três contas da seção 0 (tempo, espaço, história) e, com
   narração, as falas com a janela de cada uma e a `regua-voz.mjs` verde (`voz.md`). Texto público segue `_memoria/escrita-publica.md`; o que
   se afirma em venda segue `_memoria/prova.md`. Copy longa de lançamento ou de
   anúncio sai antes pela `/copy` (e a oferta, pelo `/oferta`).
2. **Som, se houver:** `som.md`. O material do usuário primeiro, pelo índice dos pacotes; a música
   se escolhe medindo (`medir_audio.py musica` e `tom`), o recorte começa numa batida, o drop cai
   no momento principal. Com trilha tonal (golpe, drone, acorde, riser com nota), também
   `som-cinematografico.md`.
3. **Construir**, com as regras de `hyperframes.md` e `regras-de-movimento.md`.
4. **Conferir no motor:** `npx --yes hyperframes@0.8.207 check` dentro da pasta.
   Zero erro. Aviso só fica com o motivo escrito.
5. **Quadros parados antes do render:** `npx --yes hyperframes@0.8.207 snapshot
   --at <t1,t2,...> --no-end -o <previa>/quadros` nos momentos-chave, e olhar a folha. É
   aqui que aparece a frase cortada, o toque fora do botão, o fio que não diz
   nada. Não renderizar com defeito visto parado.
6. **Render:** `npx --yes hyperframes@0.8.207 render -o <previa>/<rodada>-a.mp4 --quality delivery --no-browser-gpu --workers 1` (o `<previa>` é o do `hyperframes.md`, "Onde o render grava"; o render por software e com um processo é o que o "Determinismo" do `hyperframes.md` pede para o par sair idêntico).
   Medir: `ffprobe` (quadros, duração), `medir_audio.py conferir` (−14 LUFS ±1,
   pico verdadeiro abaixo de −1 dBTP), cada efeito no quadro certo com
   `medir_audio.py acerto` (tolerância de 2 quadros; os comandos estão em
   `som.md`), e a régua `parado`:
   `node .claude/skills/mograph/ferramentas/parado.mjs <mp4> [--virgula <s>]`
   (os tetos da vírgula e do fim: `comum.estrutura.virgula` e `comum.estrutura.o-fim`, em `.claude/skills/mograph/manual/comum/estrutura.md`). Antes do render, o som
   dentro da música (`simula_mix.py --contexto`: o relevo de cada efeito e a batida); depois, o ritmo
   pela linguagem (`medir_ritmo.py <mp4> --linguagem <id>`). Os dois em `linguagens.md`, "Medir".
6b. **Director Pass**, na peça que veio da `/mograph`, pelo construtor, antes do crítico: as réguas de
   direção e a lista P0 a P3 já consertada (`.claude/skills/mograph/auditoria.md`).
7. **Crítico que não construiu:** `critico.md`. Dentro de um subagente, que não lança outro, o
   próprio agente aplica o prompt do crítico como lista e deixa o crítico independente pendente
   no relato (`critico.md`, "Quando a skill roda num subagente"). As folhas saem de
   `node .claude/skills/video/ferramentas/folhas.mjs <mp4> <pasta> --rapidos <t,...>`.
   Tamanho M ou G: o agente `revisor-de-comunicacao` em paralelo, com o texto na
   tela. Reprovou, conserta e manda a MESMA peça ao MESMO crítico, até todas as
   notas passarem de 8, com teto de três rodadas: na terceira ainda reprovada,
   as notas e as opções vão ao usuário (`critico.md`, "A rodada seguinte").
8. **Prova de determinismo** (tamanho M ou G): o par idêntico na mesma série, pela régua do
   `hyperframes.md` ("Determinismo"), que diz também o piso da peça com vidro ou desfoque.
9. **Entrega:** o MP4 e a capa em `saidas/<estilo>-<tema>-<AAAA-MM-DD>/`, a `LEGENDA.md`
   (conferida pelo `confereLegenda` de `scripts/lib/legenda.js`, depois o `humanizer`), o
   `RELATORIO.md` no modelo de `ferramentas/modelo-relatorio.md`, o `registro.json` conferido
   pelo `ferramentas/indice-videos.mjs` (`estilos.md`, "O registro da entrega"), e uma página
   que o usuário abre no navegador com o vídeo tocando, ao lado do roteiro e da legenda (o
   modelo é o `ferramentas/modelo-revisao.html`: troque cada `{{CAMPO}}`, e nenhum sobra). Vídeo dentro de grade leva `minmax(0, 1fr)` e
   `min-width: 0` nos filhos: sem isso o vídeo de 1080 alarga a grade e corta a
   coluna vizinha. Conferir a página em 1280 e 390 px. **Para no arquivo: não
   publica.** No P sem post próprio (a vinheta, o bumper, o laço), a entrega é o MP4, o
   `RELATORIO.md` e o `registro.json`: sem capa, sem `LEGENDA.md` e sem a página.

## 5 · Os módulos

| Arquivo | O que tem |
|---|---|
| `estilos.md` | os estilos de vídeo, quem atende cada um, a estrutura de cada estilo, os destinos, a legenda por estilo e a entrevista de abertura |
| `linguagens.md` | as linguagens (como a peça se mexe e soa), escolhidas pela finalidade, com as faixas medidas de ritmo, som e cor, o que abrir antes de dirigir e as duas réguas |
| `cor.md` | a correção e a gradação do material real (gravação, foto, banco), pelo grading do motor |
| `metodo.md` | os estados e os portões, por tamanho |
| `regras-de-movimento.md` | as regras com número e a lista de proibidos |
| `hyperframes.md` | o que o render quadro a quadro cobra, e as armadilhas medidas |
| `som.md` | música, efeitos, volume e o medidor |
| `som-cinematografico.md` | a trilha no tom: os tonais, os risers, o drop, a voz na frente |
| `voz.md` | a narração (a voz e a tela juntas, o anúncio que diz o que vende, tempo medido antes), a voz gravada do usuário, a ElevenLabs como alternativa e a regra da voz de outra pessoa |
| `critico.md` | o prompt do crítico e as folhas |
| `ferramentas/` | `nova-peca.mjs`, `apagar-peca.mjs`, `marca-remotion.mjs`, `folhas.mjs`, `falar.mjs` (a voz da ElevenLabs, sem expor a chave, com o tempo da fala e de cada palavra medido), `regua-voz.mjs` (a pausa, o silêncio e, no anúncio, o produto, a oferta e a chamada no tempo), `medir_audio.py` (música, efeito, acerto no mix, volume com pico verdadeiro, drop, e o tom pelo `tom.py`), `tonal.py` (o drone e o golpe no tom da faixa), `simula_mix.py`, `esvazia.py` e `confere_posicao.py` (o pico antes do render, o vazio antes do drop e a posição por correlação: o `som.md`), `capa.mjs` (as opções de capa num quadro parado e a folha com o recorte 3:4 da grade), `recorta_fundo.py` (ilustração sem o fundo branco), `medir_ritmo.py` e `linguagens.json` (ritmo, som e cor contra a faixa da linguagem), `plano_da_peca.py` (o perfil e a exceção do plano para as réguas Python), `ambiente.mjs` (o que a máquina tem e o que falta), `formatos.json` e `ficha-no-destino.mjs` (a zona de cada destino e a legenda dentro dela), `indice-videos.mjs`, `modelo-relatorio.md` e `modelo-revisao.html` (o registro, o relatório e a página da entrega), os modelos da peça (`modelo.html`, `modelo-roteiro.md`, `modelo-ativos.sh`) e a régua `teste.mjs` |

**Do que ela depende fora do workspace:** Node 22.7 ou mais, o ffmpeg e o ffprobe
no PATH, o Python com `numpy`, `scipy`, `Pillow`, `soundfile`, `soxr` e `pyloudnorm` (`scripts/requirements.txt`),
o headless shell do Playwright (o navegador do render do HyperFrames no Windows; ver `hyperframes.md`) e, só para
Remotion, `npm --prefix .claude/video install` uma vez. A régua confere tudo
menos o Chrome: `node .claude/skills/video/ferramentas/teste.mjs`.

## A régua de pronto

- [ ] marca fechada conferida antes do roteiro
- [ ] `check` com zero erro, e cada aviso restante explicado
- [ ] quadros parados olhados antes do render
- [ ] quadro 0 legível como capa, e a capa diz o assunto na grade do perfil
- [ ] a régua `parado` verde (nada parado acima de 0,75 s fora da vírgula, o fim até 1,4 s)
- [ ] no Reel, os quatro ganchos: o falado, o escrito (diferente do falado, em até duas linhas, a um terço do topo), o visual e o sonoro
- [ ] com voz, a `regua-voz.mjs` verde, e cada palavra-chave da tela entrando com a palavra dita
- [ ] texto lido no tamanho do celular (360 px), acento e cedilha certos
- [ ] o `simula_mix.py --contexto` sem efeito abaixo do piso do papel (ou a exceção no plano), e no
      regime travado os acertos na batida ou no começo da frase acima do acaso
- [ ] o `medir_ritmo.py --linguagem` sem aviso, ou cada aviso com o motivo no plano (o respiro declarado)
- [ ] `medir_audio.py conferir` verde (o pico verdadeiro abaixo de −1 dBTP; o integrado de −15 a −13 LUFS ou o motivo escrito), efeitos a até 2 quadros do alvo, e cada som com nota no tom da faixa ou o motivo escrito
- [ ] na entrega, o `RELATORIO.md` no modelo e o `registro.json` verde no `indice-videos.mjs conferir`
- [ ] crítico com todas as notas ≥ 8 (e, em M e G, o revisor de comunicação aprovando)
- [ ] em M e G, o par idêntico na mesma série (`hyperframes.md`, "Determinismo")
- [ ] entrega em `saidas/`, com a página de revisão; nada publicado
