---
name: video
description: A porta única de vídeo feito em código (motion, Reel animado, vinheta, lançamento, explicativo, remake de referência). Faz a mini-entrevista (motor HyperFrames ou Remotion, material, formato, voz), roda o método com quadros parados, som medido e crítico que não construiu, e entrega MP4 e legenda. Use para "faz um vídeo", "vídeo animado", "motion", "vinheta" ou /video. Vídeo gravado é /cortes.
---

# /video · o vídeo feito em código

Um pedido de vídeo vira um MP4 dirigido, não um HTML que se mexe. A diferença
entre os dois não está no motor: está no método (referência, batidas, quadros
parados aprovados antes da animação, som no pico medido, e um crítico que não
construiu a peça). Os melhores resultados de motion feitos com IA saem de HTML
puro, sem framework, e todos com o mesmo método.

**O que não é daqui:** vídeo gravado vira Reel pela `/cortes`; animação de site
ou de tela é `/motion` e `/gsap`.

## Onde ela roda

- A skill mora em `.claude/skills/video/`, e os comandos rodam da raiz do
  workspace (`node .claude/skills/video/ferramentas/...`).
- **O método, o texto e a estrutura valem para qualquer peça; a marca é do
  dono da peça.** A deste workspace mora em `.claude/skills/carrossel/marca/`
  (o `identidade/design-guide.md` roteia para lá): `tokens.css` (cores e fontes)
  e `marca.md` (logo, voz de narração e recusas visuais) <!-- caminho futuro: os dois nascem no /carrossel configurar -->. A voz do texto,
  o público e o CTA vêm da `_memoria/` (`empresa.md`, `escrita-publica.md`); a
  régua de texto é o `_memoria/escrita-publica.md`, e a de legenda, o
  `scripts/lib/legenda.js`.
- 🚨 **Sem marca configurada, não há vídeo.** O sinal é o mesmo de todas as
  skills visuais: o `marca/tokens.css` existe e não tem a linha <!-- caminho futuro: nasce no /carrossel configurar -->
  `ESTADO: nao-configurado`. Faltou: **parar e dizer ao usuário** que a marca
  ainda não foi configurada e que o conserto é `/carrossel configurar`. A
  máquina segura o mesmo: o `nova-peca.mjs` e o `marca.ts` do Remotion recusam.
  Vídeo na paleta de demonstração sai com cara de template, e refazer custa a
  peça inteira.
- Dois plugins de terceiro são opcionais, e a skill roda sem eles: o
  `hyperframes` (as skills oficiais do motor; sem ele, a mesma documentação sai
  do CLI) e o `watch` (lê um vídeo por link ou arquivo e devolve quadros com o
  tempo e a transcrição, para decompor uma referência; sem ele, `yt-dlp` e
  ffmpeg à mão). Como instalar cada um: `hyperframes.md`, "Os plugins
  opcionais".

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
   edição com cortes e planos novos, e a cor da marca trabalhando.
4. **A linguagem é escolha do usuário, e se escolhe vendo.** Registro claro ou
   escuro, textura de fundo (a grade técnica do kit, foto, plano de cor),
   personagem ou não: na primeira peça, e sempre que a linguagem for nova, a
   direção vai para o usuário como **prancha** (3 a 4 quadros parados de cada direção,
   lado a lado) antes de qualquer render. A escolha do usuário vira o campo
   "Linguagem" do roteiro e vale para as peças seguintes; uma recusa entra na
   hora no `marca/marca.md` (o documento dono) e não volta. <!-- caminho futuro: nasce no /carrossel configurar -->
5. **As contas vêm antes do código, e o roteiro é revisado quadro a quadro.** Peça
   construída antes de três contas que dava para fazer no papel volta em rodadas
   de revisão. Elas abrem toda peça, no `roteiro.md`:
   - **tempo:** cada legenda a ~3 palavras por segundo, inteira na tela por 1,2 s
     ou mais, somadas até caber na duração; o que não cabe vira frase única ou
     sai, antes da animação. Com narração, cada fala na janela da batida dela
     (`voz.md`);
   - **espaço:** a altura útil da zona segura do formato dividida entre os
     elementos, medida no quadro mais cheio (mais linhas de título, mais
     elementos ao mesmo tempo). Confira a zona segura na especificação atual da
     plataforma (no anúncio de Reels do Meta, de 270 a 1248 px de altura, numa
     tela de 1920);
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

Uma chamada de AskUserQuestion, com a recomendada primeiro. O que o pedido já
disse não se pergunta.

| Pergunta | Opções | Recomendada |
|---|---|---|
| **Motor** | HyperFrames (HTML + GSAP) · Remotion (React) | HyperFrames. Remotion quando a peça já existe nele ou precisa de legenda palavra a palavra do `@remotion/captions` |
| **Material** | só código · código com IA (`/gerar-imagem` para quadro, `scripts/gerar-video.js` para plano em vídeo; **custo dito antes**) · material real (gravação, print, foto) | só código |
| **Formato** | 9:16 · 1:1 · 16:9 · os três (reenquadrados da mesma linha do tempo, nunca cortados) | 9:16 |
| **Voz** | sem voz · a voz do usuário, gravada · voz artificial da ElevenLabs (plano gratuito: só para o que não se publica; `voz.md`) | sem voz, se não houver gravação |

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
| **P** | vinheta, peça até 10 s, sem texto de venda | roteiro curto, quadros parados, render, crítico. **Vinheta de abertura de Reel** tem de 1,5 a 3 s (10 s antes de cada Reel derruba a retenção): se o pedido disser mais, propor a curta e deixar o usuário escolher. Entrega só o MP4, sem legenda nem capa |
| **M** | Reel de 15 a 30 s com argumento | tudo do P, mais manifesto, batidas com "o que o espectador entende", som medido, revisor de comunicação e legenda |
| **G** | lançamento, explicativo longo, remake de referência | tudo do M, mais referência decomposta (`SPEC.md`), três direções em 3 a 5 cenas antes de escolher, e o animatic |

O que se pula fica em "Decisões" do `roteiro.md`, com o motivo e o risco.

## 3 · Onde a peça mora

- **Deste workspace:** `.claude/video/html/<nome>/`. O final vai para
  `saidas/<nome>/` <!-- caminho futuro: nasce por peça -->.
- **De projeto ou de cliente:** na pasta dele (o `CLAUDE.md` de lá diz qual), e o
  render é chamado de lá. O motor não precisa de `node_modules`: o CLI roda fixo
  pelo `npx`. O `--em` é obrigatório, e a peça define os tokens da marca do dono
  no `:root` (o aviso no `index.html` diz quais).
- **Remotion:** uma pasta por peça em `.claude/video/src/`, registrada no
  `Root.tsx` (as regras em `.claude/video/README.md`, o catálogo de técnicas em
  `.claude/skills/remotion/CATALOGO.md`). A marca chega pelo `src/marca.ts`, que
  o `ferramentas/marca-remotion.mjs` gera do `tokens.css`; rode-o de novo sempre
  que a marca mudar.

```bash
node .claude/skills/video/ferramentas/nova-peca.mjs <nome>                          # deste workspace, em .claude/video/html/
node .claude/skills/video/ferramentas/nova-peca.mjs <nome> --em <pasta>             # projeto ou cliente (só o GSAP, sem a marca daqui)
node .claude/skills/video/ferramentas/nova-peca.mjs <nome> --em <pasta> --com-marca # peça daqui fora do estúdio (teste em rascunho/)
node .claude/skills/video/ferramentas/apagar-peca.mjs <pasta>                       # a ÚNICA forma de apagar uma peça
node .claude/skills/video/ferramentas/marca-remotion.mjs                            # a marca no Remotion (src/marca.ts)
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

1. **Roteiro antes do código.** O `roteiro.md` com manifesto (aberto pelo filme
   numa frase), a afirmação e a base dela, batidas em quadros com a fala (quando
   há voz), a coluna "o que o espectador entende", efeitos,
   origem dos ativos, as três contas da seção 0 (tempo, espaço, história) e, com
   narração, as falas com a janela de cada uma e a `regua-voz.mjs` verde (`voz.md`). Texto público segue `_memoria/escrita-publica.md`; o que
   se afirma em venda segue `_memoria/prova.md`. Copy longa de lançamento ou de
   anúncio sai antes pela `/copy` (e a oferta, pelo `/oferta`).
2. **Som, se houver:** `som.md`. A música se escolhe medindo (`medir_audio.py
   musica`), o recorte começa numa batida, o drop cai no momento principal.
3. **Construir**, com as regras de `hyperframes.md` e `regras-de-movimento.md`.
4. **Conferir no motor:** `npx --yes hyperframes@0.8.96 check` dentro da pasta.
   Zero erro. Aviso só fica com o motivo escrito.
5. **Quadros parados antes do render:** `npx --yes hyperframes@0.8.96 snapshot
   --at <t1,t2,...> --no-end -o <pasta>` nos momentos-chave, e olhar a folha. É
   aqui que aparece a frase cortada, o toque fora do botão, o fio que não diz
   nada. Não renderizar com defeito visto parado.
6. **Render:** `npx --yes hyperframes@0.8.96 render -o <arquivo>.mp4 --quality delivery`.
   Medir: `ffprobe` (quadros, duração), `ebur128` (−14 LUFS ±1, pico abaixo de −1 dB)
   e cada efeito no quadro certo com `medir_audio.py acerto` (tolerância de 2
   quadros; os comandos estão em `som.md`).
7. **Crítico que não construiu:** `critico.md`. As folhas saem de
   `node .claude/skills/video/ferramentas/folhas.mjs <mp4> <pasta> --rapidos <t,...>`.
   Tamanho M ou G: o agente `revisor-de-comunicacao` em paralelo, com o texto na
   tela. Reprovou, conserta e manda a MESMA peça ao MESMO crítico, até todas as
   notas passarem de 8, com teto de três rodadas: na terceira ainda reprovada,
   as notas e as opções vão ao usuário (`critico.md`, "A rodada seguinte").
8. **Prova de determinismo** (tamanho M ou G): dois renders, e o PSNR entre eles
   de 50 dB para cima (`hyperframes.md`, "Determinismo").
9. **Entrega:** o MP4 e a capa em `saidas/<nome>/`, a `LEGENDA.md` (conferida pelo
   `confereLegenda` de `scripts/lib/legenda.js`, depois o `humanizer`), e uma
   página `index.html` que o usuário abre no navegador com o vídeo tocando, ao
   lado do roteiro e da legenda. Vídeo dentro de grade leva `minmax(0, 1fr)` e
   `min-width: 0` nos filhos: sem isso o vídeo de 1080 alarga a grade e corta a
   coluna vizinha. Conferir a página em 1280 e 390 px. **Para no arquivo: não
   publica.**

## 5 · Os módulos

| Arquivo | O que tem |
|---|---|
| `metodo.md` | os estados e os portões, por tamanho |
| `regras-de-movimento.md` | as regras com número e a lista de proibidos |
| `hyperframes.md` | o que o render quadro a quadro cobra, e as armadilhas medidas |
| `som.md` | música, efeitos, volume e o medidor |
| `voz.md` | a narração (a voz e a tela juntas, o anúncio que diz o que vende, tempo medido antes), a voz gravada do usuário, a ElevenLabs como alternativa e a regra da voz de outra pessoa |
| `critico.md` | o prompt do crítico e as folhas |
| `ferramentas/` | `nova-peca.mjs`, `apagar-peca.mjs`, `marca-remotion.mjs`, `folhas.mjs`, `falar.mjs` (a voz da ElevenLabs, sem expor a chave, com o tempo da fala e de cada palavra medido), `regua-voz.mjs` (a pausa, o silêncio e, no anúncio, o produto, a oferta e a chamada no tempo), `medir_audio.py` (música, efeito e acerto no mix), `recorta_fundo.py` (ilustração sem o fundo branco), os modelos (`modelo.html`, `modelo-roteiro.md`, `modelo-ativos.sh`) e a régua `teste.mjs` |

**Do que ela depende fora do workspace:** Node 22.7 ou mais, o ffmpeg e o ffprobe
no PATH, o Python com `numpy` e `Pillow` (`medir_audio.py`, `recorta_fundo.py`),
o headless shell do Playwright (o navegador do render do HyperFrames no Windows; ver `hyperframes.md`) e, só para
Remotion, `npm --prefix .claude/video install` uma vez. A régua confere tudo
menos o Chrome: `node .claude/skills/video/ferramentas/teste.mjs`.

## A régua de pronto

- [ ] marca fechada conferida antes do roteiro
- [ ] `check` com zero erro, e cada aviso restante explicado
- [ ] quadros parados olhados antes do render
- [ ] quadro 0 legível como capa, e a capa diz o assunto na grade do perfil; nenhum trecho parado acima de ~3 s
- [ ] no Reel, os quatro ganchos: o falado, o escrito (diferente do falado, em até duas linhas, a um terço do topo), o visual e o sonoro
- [ ] com voz, a `regua-voz.mjs` verde, e cada palavra-chave da tela entrando com a palavra dita
- [ ] texto lido no tamanho do celular (360 px), acento e cedilha certos
- [ ] volume entre −15 e −13 LUFS, pico abaixo de −1 dB, efeitos a até 2 quadros do alvo
- [ ] crítico com todas as notas ≥ 8 (e, em M e G, o revisor de comunicação aprovando)
- [ ] em M e G, dois renders com PSNR de 50 dB para cima entre eles
- [ ] entrega em `saidas/`, com a página de revisão; nada publicado
