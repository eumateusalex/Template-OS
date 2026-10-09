# comportamento.md — devolver ao clone o que a captura congelou

> Método provado na home do site-exemplo: o clone sai de **0
> animações** para **12**, com todos os números vindos de medição, e sem mexer
> um pixel na geometria final (Δaltura = 0px a 1280 e a 375).

---

## O que o ditto entrega de comportamento: nada

Medido nos dois lados, com duas fontes independentes:

| | Original | Clone recém-gerado |
|---|---|---|
| Animações no load | **27** | **0** |
| Animações vivas | 6 | 0 |
| Elementos mudando de estilo (rAF) | 1 | 0 |

E o código confirma: sem pasta `ditto/`, zero `@keyframes`, zero classe de
transição. **Não é degradação, é ausência.** A captura congela a página no
estado final e entrega isso.

---

## 🚨 Medir com TRÊS fontes, sempre

`scripts/inventario-movimento.mjs` mede por três vias de propósito:

| Fonte | Enxerga | Não enxerga |
|---|---|---|
| **A — Web Animations API** (`getAnimations`) | CSS e WAAPI, com duração, atraso e curva **exatos** | quem anima por rAF escrevendo estilo inline |
| **B — amostragem de estilo por rAF, página parada** | qualquer motor, no que roda sozinho | o que só acontece ao rolar |
| **C — geometria DURANTE o scroll** | comportamento de scroll de qualquer motor | trajetória fina (mede em passos, não por quadro) |

⚠️ **A amostragem por rAF roda a ~15fps** lendo 9 propriedades de 120 elementos
por quadro. Serve para "mexeu ou não mexeu". **Não serve** para medir trajetória
fina — para isso, encolher a watch-list.

💡 Sinal barato de corroboração: o fps da amostragem. No original deu 15fps (a
página gasta CPU animando) e no clone 50-61fps (não gasta).

---

## 🚨 A fonte C existe porque sem ela a conclusão sai ERRADA

Vale como aviso permanente, porque as duas primeiras fontes **concordam e as
duas são cegas para a mesma coisa**.

Contando animações antes e depois do scroll, o site-exemplo dá:

```
novas depois do scroll: 0
```

O que leva a registrar "zero animação de scroll" e dar o assunto por
encerrado. **Está errado.** Medindo a geometria **durante** o scroll:

| | Original | Clone |
|---|---|---|
| elementos que mexem ao rolar | **109 de 153** | 23 de 113 |
| **não voltam ao estado inicial** | **44** | **0** |

A nav colapsa, a barra de contato desliza, e nada disso aparece em
`getAnimations()` — porque o Framer anima por rAF em estilo inline, que a WAAPI
não registra **nem antes nem depois**. Contar animação nova jamais acharia isso.

**Regra:** para responder "existe comportamento de scroll?", medir **geometria
durante o scroll**. Contagem de animação não responde essa pergunta.

⚠️ Ao medir geometria no scroll, tratar `position: fixed` e `sticky` à parte:
eles mudam de posição **documental** por definição quando a página rola, e
contá-los assim acusa movimento em quem está parado na tela.

---

## Armar o coletor ANTES da página rodar

Animação de load **já acabou** quando a página termina de carregar. Ler
`getAnimations()` depois devolve só o que sobrou. O instrumento arma um coletor
por `addInitScript`, que roda antes de qualquer script da página.

No site-exemplo, o coletor acha 27 — uma leitura tardia mostra 6.

---

## CSS ou GSAP: o critério

Decidir **depois de medir**, nunca antes.

| O que a medição mostrou | Ferramenta |
|---|---|
| `opacity`, `filter`, `transform` com duração, atraso e curva fixos | **CSS** — `@keyframes` mais `animation-delay` |
| curva de mola vinda como `linear(...)` pré-amostrado | **CSS** — o `linear()` cola direto |
| scroll, `pin`, parallax, `scrub` | **GSAP** — `gsap-scrolltrigger` |
| sequência encadeada com passos que se sobrepõem | **GSAP** — `gsap-timeline` |
| trajetória por caminho, texto em pedaços, transição de layout | **GSAP** — `gsap-plugins` (MotionPath, SplitText, Flip) |
| curva desenhada à mão que não é bezier nem `linear()` | **GSAP** — `CustomEase` |

**No site-exemplo a resposta foi mista, e a divisão importa:**

- **A animação de ENTRADA é CSS.** As 27 eram `opacity` mais `filter: blur` com
  atraso escalonado e uma cúbica. Carregar biblioteca para isso é peso sem
  ganho, e as molas já chegam como `linear()` colável.
- **O comportamento de SCROLL sai sem GSAP, e sem perder nada.** Separados os
  três tipos, cada um tem uma ferramenta nativa que resolve melhor:
  - **alterna** → classe no `<body>` por limiar medido. Nada além de CSS.
  - **revela** → `IntersectionObserver`, que é exatamente para isso e custa
    ~40 linhas.
  - **scrub** → `animation-timeline: scroll()`, dentro de `@supports`, com um
    quadro-chave por degrau medido.

  Medido: nav, barra e cards do hero batendo com o original nos dois estados,
  com **zero biblioteca**. GSAP continua sendo a resposta quando aparecer
  sequência encadeada com passos que se sobrepõem, trajetória por caminho ou
  transição de layout — não para isto.

⚠️ "Este site não precisa de GSAP porque tem zero animação de scroll" é
**conclusão de medição cega** (ver a seção da fonte C). O critério vale; o que
erra é o dado que o alimenta.

Os módulos do GSAP são arquivos em `gsap/referencias/<nome>.md`, não skills.

---

## Casar o elemento do original com o do clone

O caminho estrutural (`div>div>div>div`) **não serve de seletor**. O que casa é
**geometria mais texto**, e funciona porque a altura do clone bate com a do
original (medido: 0px de diferença em 21 rotas).

`scripts/gera-entrada.mjs` faz assim:

1. lê a caixa `(x, y, w, h)` de cada elemento animado no original
2. procura no clone o elemento com a caixa mais próxima
3. **desempata por texto exato** — duas caixas iguais com textos diferentes não
   são o mesmo elemento
4. escreve a regra contra o `data-cid` do clone, que é seletor estável e já
   existe no código gerado

**Resultado medido:** 9 casamentos com erro de 0 a 1px e 3 com erro de 35 a 38px
que só fecharam pelo texto. Sem o desempate por texto, esses 3 teriam casado
errado ou ficado de fora.

⚠️ **Elemento de caixa 0×0 não casa com nada.** O instrumento os declara e pula,
em vez de forçar um casamento ruim.

⚠️ **Tolerância frouxa casa errado.** Por isso cada regra gerada carrega no
comentário a posição, o texto e o **erro em px** do casamento. Erro alto num
elemento sem texto é o primeiro suspeito quando algo animar no lugar errado.

---

## 🚨 Nenhum número se digita

Duração, atraso, curva e propriedade saem todos da medição. Se um valor estiver
errado, **o erro está na medição e é rastreável** — não é chute, e dá para
refazer.

O `entrada.css` gerado carrega, no topo, de onde veio e quantos elementos foram
medidos contra quantos casaram.

---

## `prefers-reduced-motion` é obrigatório

Mesmo quando o original não faz. Quem desativou animação recebe o **estado
final**, sem movimento — nunca a página invisível:

```css
@media (prefers-reduced-motion: reduce){
  [data-cid]{animation:none !important}
}
```

⚠️ Com `animation-fill-mode: both`, o elemento mostra o estado inicial durante o
atraso. Se o inicial for `opacity: 0`, desligar a animação **sem** essa regra
deixaria a página em branco.

---

## 🚨 Onde a camada mora: POR ROTA, nunca global

Cada rota tem os seus `entrada.css`, `scroll.css`, `hover.css` e
`geometria.css`, na pasta dela, importados pela `page.tsx` dela.

**Não é preferência de organização, é obrigação:** o contador de `data-cid` do
ditto **reinicia em cada rota**. Verificado: `n61` existe nas 21 páginas,
apontando para elementos diferentes. Uma folha global aplicaria a regra da home
nas outras 20, animando o que não devia.

Como cada rota importa a SUA, o Next gera um bundle de CSS por rota e a colisão
nunca acontece. Conferido no build: a home carrega `337e...css` e `/terms`
carrega `789...css`.

⚠️ **Escrever o CSS não o liga.** O Next só inclui no bundle da rota o que a
`page.tsx` daquela rota importa; arquivo solto na pasta não entra em lugar
nenhum, e a camada some sem erro em lugar nenhum. Quem garante o import é o
`liga-css.mjs` — e ele cria o arquivo vazio quando falta, porque import de
arquivo ausente derruba o build inteiro.

**O JS, ao contrário, é global e genérico.** `public/scroll.js` serve as 21
rotas e não carrega dado de rota nenhuma: os limiares chegam por
`body { --ditto-limiares: "80 360" }` e os alvos de revelação por
`[data-cid] { --ditto-revelar: 1 }`, sempre do CSS da rota carregada. Gerado
por rota, ele seria sobrescrito pela última rota rodada (`armadilhas.md`,
"Runtime JS global não pode carregar dado de rota").

💡 E `public/` é copiado verbatim no build: nenhum minificador toca ali, então o
`linear()` de 80 pontos da mola do Framer chega íntegro — o que **não** vale
para o CSS importado, onde o minificador já invalidou um `linear()` e matou 2 de
12 animações caladamente.

---

## 🚨 Antes de medir interação: DESBLOQUEAR o clone

O ditto entrega um clone que **não recebe mouse**. Medir assim mede o bloqueio,
não o comportamento.

Medido na home do site-exemplo, antes do desbloqueio:

| | Original | Clone |
|---|---|---|
| respondem ao hover | 16 | 3 |
| respondem ao clique | 7 | **0** |
| travaram em timeout | 0 | **17** |

Duas causas, as duas em `scripts/corrige-interacao.mjs`:

1. **`::after` decorativo com `inset-0`** cobrindo seções inteiras. Pseudo-elemento
   participa do hit-testing.
2. **`pointer-events: none`** em interativos — e a marca costuma estar num
   **ancestral**, não no elemento.

Depois do desbloqueio: 0 timeouts, 0 mortos, e o caminho livre para reconstruir.

---

## Medir interação: cinco regras que decidem se a medição vale

1. **Evento REAL do navegador.** `page.hover()` e `page.click()`, nunca
   `el.click()` dentro do `evaluate` — evento sintético não aciona framework.
   Errei nisto e a duração saiu 0ms em tudo.
2. **Ida e volta separadas.** Entrar e sair do hover não são espelhos.
3. **Não assumir estado inicial.** No site-exemplo o primeiro item do FAQ começa
   ABERTO. Alternar duas vezes e guardar as duas fotos.
4. **Recalcular a posição antes de cada clique** — item que abre empurra o de
   baixo.
5. **Ler a pilha em CINCO pontos**, não só no centro: no centro de um card está
   a imagem, e testar só ali reprova card perfeitamente clicável.

⚠️ **Restaurar o estado depois de clique que abre modal.** Um clique em
"Contact" deixou o drawer aberto e contaminou 8 alvos seguidos.

---

## Reconstruir acordeão

Medido no site do exemplo: `height` de 52px (fechado) para 128–151px (aberto,
diferente por item), e **`deltaTextoDaPagina: 0`** — ou seja, **a resposta já
está no DOM**. Não falta conteúdo, falta o mecanismo.

O que o `gera-acordeao.mjs` monta:

- CSS com a altura medida de **cada** item e a duração medida
- JS que alterna uma **classe**, com `role="button"`, `tabindex` e
  `aria-expanded`

🚨 **Estado por classe, nunca por `animationend`**: aquele evento faz bubbling
(animação de filho derruba a classe cedo) e pode nem chegar (aba em segundo
plano).

⚠️ Rodar depois do `load`, não na hidratação: mutar o DOM enquanto o React
hidrata compete com ele.

---

## 🚨 Reconstruir comportamento de scroll: são TRÊS coisas, não uma

Tratar tudo que muda ao rolar como se fosse um comportamento só produz um clone
visivelmente desmontado, mesmo com os números certos.

| tipo | reconhece-se por | reproduz-se com |
|---|---|---|
| **ALTERNA** | está na janela no topo (ou é `fixed`/`sticky`), tem dois estados, e **volta** ao repouso | classe no `<body>` por limiar medido |
| **REVELA** | está fora da janela no topo, **ou** muda e **não volta** | `IntersectionObserver` + estado oculto no CSS |
| **CONTÍNUO** | está na janela e assume 4+ valores ao longo da escada | `animation-timeline: scroll()`, um quadro-chave por degrau medido |

Medido no site-exemplo, na home: **15 alternam** (a nav e seus filhos a 80px, a
barra de contato a 360px, os cards do hero a 240px), **74 revelam**, **5 fazem
scrub**.

### Os quatro cuidados que decidem se funciona

1. **Comparar ESTILO COMPUTADO, não geometria.** Elemento `fixed`/`sticky` muda
   de posição documental por definição quando a página rola; comparar posição
   acusa movimento em quem está parado na tela.

2. **Limiar é por ELEMENTO.** No site-exemplo a nav troca a 80px e a barra a
   360px. Um limiar global aciona um dos dois na hora errada. O `scroll.js`
   liga uma classe por limiar (`ditto-y80`, `ditto-y360`).

3. **Contêiner não basta — escrever o estado de todo elemento que muda.**
   Forçar `width: 550px` só na nav não reproduz o layout interno dela: os
   filhos foram capturados no estado colapsado e continuam distribuídos como
   tal. Medido: "Work" caiu em 561.5 onde o original põe 593.6.

4. **Excluir o que muda por TEMPO.** Sem rolar nada, tirar duas fotos separadas
   no tempo: o que mudou, mudou por laço de animação. Sem este controle o
   marquee entra como "alterna a 160px" e passa a **saltar 2278px** na
   horizontal quando o scroll cruza esse ponto.

### E cada tipo se descobre comparando com a foto CERTA

- **quem alterna** aparece comparando o repouso com o **fundo da escada**;
- **quem revela** aparece comparando o repouso com a **página percorrida e de
  volta ao topo**.

Comparar quem alterna contra a página percorrida não acha nada — ele já voltou
ao repouso, e a barra de contato some de um relatório que diz ter varrido 1620
elementos.

### O que o `gera-scroll.mjs` monta

Uma classe no `<body>` por limiar **medido**, ligada por listener
`{ passive: true }`, mais o estado oculto de quem revela e as animações de quem
faz scrub. O `scroll.js` é **genérico**: os limiares chegam por
`body { --ditto-limiares: "80 360" }` e os alvos de revelação por
`[data-cid] { --ditto-revelar: 1 }`, ambos no CSS **da rota**. Assim um único
arquivo global serve as 21 rotas sem carregar dado de rota nenhuma.

🚨 **Escrever os dois estados, não só o rolado.** A captura congela a página num
instante — a nav do clone **nascia com 233px**, a largura do estado já
colapsado. Definir só o estado rolado não faz nada.

🚨 **Transform inteiro medido, nunca um `translateY` montado à mão.** O elemento
costuma ter `translateX` de centralização, e escrever só o Y apaga o X:
`matrix(1,0,0,1,-121.359,100)` virou `matrix(1,0,0,1,0,-71)`, deslocando 121px
na horizontal sem ninguém pedir.

### Resultado medido, home do site-exemplo

| | original | clone antes | clone depois |
|---|---|---|---|
| nav no topo | 549.95px | 232.5px | **549.94px** |
| nav rolada | 232.55px | 232.5px | **232.55px** |
| nav de volta ao topo | 549.95px | 232.5px | **549.94px** |
| barra no topo (yTela) | 938.94 | 838.95 | **938.95** |
| barra rolada | 838.94 | 838.95 | **838.95** |

---

## 🚨 O princípio que evita "consertar" o que já estava certo

**O instrumento ACRESCENTA o que falta, não reescreve o que já está lá.**

A captura acerta muita coisa. Quando um gerador escreve por cima o valor
absoluto medido no original, ele troca um acerto por um palpite bem medido — e
às vezes perde.

Dois casos medidos no site-exemplo:

- **Acordeão:** escrever `height: 52px` (o fechado do original) por cima do
  clone, que tem 81px para o mesmo item fechado, encolhe cinco itens e
  **sobe o FAQ inteiro 146px**. O certo é tirar do original só o **delta**
  entre os dois estados e ancorar a altura absoluta no que o clone já tem — e
  descobrir qual estado o clone tem comparando, não supondo.
- **Geometria estática:** escrever `left` e `right` juntos num elemento de
  largura automática **esmaga a caixa** — 4.9px de desvio viram 160.8px.

Daí as duas regras do `corrige-geometria.mjs`: guardar o que foi proposto e
conferir na rodada seguinte, e tratar **sumir do casamento como piorar** — é a
regressão mais perigosa, porque se disfarça de sucesso.

---

## 🚨 Toda regra gerada mora dentro da faixa em que foi medida

`width: 549.953px` medido a 1280px, escrito solto, vale também a 375px. O clone
fica **idêntico no desktop e quebrado no telefone**, e isso não aparece em
nenhuma medição feita numa largura só.

```css
@media (min-width: 1024px) { /* o que foi medido a 1280 */ }
```

As bordas seguem os breakpoints que o próprio ditto gera (md=768, lg=1024), e o
arquivo se costura por marcadores para a passada do celular não apagar a do
desktop.

⚠️ `:hover` pede mais: `and (hover: hover) and (pointer: fine)`. Sem isso o
estado de hover gruda no primeiro toque e só sai quando o dedo toca noutro
lugar.

---

## ⚠️ Duas camadas não podem escrever a mesma propriedade

`entrada.css` e `scroll.css` escrevem os dois `opacity` e `transform`. No mesmo
elemento, quem ganha depende da ordem de import — que não é decisão de ninguém,
é acaso.

**Divisão de território:** a entrada cuida do que anima ao **carregar**; a
revelação cuida do que anima ao **aparecer na tela**. O `gera-entrada.mjs` lê o
`scroll.css` da rota e cede os cids que ele já reivindicou.

---

## 🚨 Dimensão 7: navegação de página a página

Medido nos dois lados, clicando em "Blog" a partir da home:

| | original | clone antes | clone depois |
|---|---|---|---|
| evento `load` dispara | não | **SIM** | não |
| objeto injetado sobrevive ao clique | SIM | **não** | SIM |
| URL troca em | 286ms | recarga completa | 248ms |

O original navega **client-side**. O clone recarregava o documento inteiro, e
isso produz duas diferenças que se veem: o flash branco entre as páginas, e a
animação de ENTRADA reexecutando a cada navegação — no original ela roda uma
vez só, porque o documento é o mesmo.

**O conserto NÃO é trocar `<a>` por `next/link`.** São 21 arquivos de até 460KB
de JSX gerado por máquina, e a troca exige parear cada `<a>` com o `</a>` dele;
um erro de pareamento corrompe a página inteira. Interceptar o clique num
componente cliente no layout entrega a mesma navegação do App Router, toca um
arquivo só, e é reversível apagando o componente.

🚨 **E aí aparece o efeito colateral que quase passa batido:** sem documento
novo, os `<script>` do layout rodam **uma vez só**. A partir da segunda rota
visitada, nada de scroll, nada de acordeão. O defeito é traiçoeiro porque a
primeira página funciona perfeitamente.

Por isso os dois runtimes expõem `window.__dittoLigar()` e
`window.__dittoAcordeao()`, são **idempotentes**, e o componente de navegação os
chama depois de cada troca de rota.

⚠️ O que o interceptador NÃO pega, e cada motivo é um jeito conhecido de
irritar quem usa: link externo, alvo em outra aba, `download`, âncora na mesma
página, clique com Ctrl/Cmd/Shift/Alt, botão do meio, e clique que outro
handler já tratou.

---

## 🚨 O estado que só existe depois do clique

O ditto fotografa **um** estado. Drawer, modal, menu de celular, carrinho
lateral: nada disso está no clone.

Medido no site-exemplo: clicar em "Contact" cria **76 elementos** e acrescenta
**342 caracteres** — um painel fixo de 540×900 com formulário de orçamento. E
nenhuma medição de rota, metadata, conteúdo ou geometria acusa a falta, porque
no estado fechado a página está certa.

O `captura-estado.mjs` resolve capturando o subtree novo com o **estilo
computado de cada nó embutido inline**. Estilo inline, não classe: o painel é
estilizado pela folha do construtor, que a captura não trouxe — copiar o HTML
com as classes originais entrega um esqueleto sem estilo nenhum.

⚠️ Ele entra no clone como **overlay escondido**, fora do fluxo. Assim não pode
mexer na geometria que já foi medida e fechada.

⚠️ E as imagens de dentro dele se **baixam**: deixar o `src` apontando para o
CDN da origem funciona hoje e quebra no dia em que o site sair do ar — sem
aviso, num painel que ninguém abre todo dia.

---

## Conferir refazendo a medição

Não olhar e achar bonito. Rodar de novo o `inventario-movimento.mjs` **no
clone** e comparar com o do original:

```
antes:   0 animações no load
depois: 12 animações no load
```

E rodar o `compara-visual.mjs` de novo: **animar não pode mudar a geometria
final**. No site-exemplo deu Δaltura = 0px nos dois viewports depois da camada
entrar.

⚠️ A contagem bruta não é comparável entre os lados: o original registra **uma
animação por propriedade** (`opacity` e `filter` separadas no mesmo elemento) e
o keyframe gerado anima as duas juntas. Comparar **elementos animados**, não
animações.

---

## Se a medição pedir GSAP: como ele entra num clone estático

A skill `gsap` documenta só instalação por npm, porque o público dela é app com
bundler. Aqui o clone é `output: "export"` e os runtimes moram em `public/`,
fora do build — então a decisão precisa estar escrita, e é esta:

**GSAP entra como GLOBAL, por arquivo LOCAL em `public/`, nunca por CDN.**

```html
<script src="/gsap.min.js" defer></script>
<script src="/ScrollTrigger.min.js" defer></script>
<script src="/revelacao.js" defer></script>
```

Os três motivos, na ordem que importa:

1. **CDN é dependência de rede que o clone não controla.** O clone tem que abrir
   igual daqui a um ano, offline, numa pasta servida por `serve-clone.mjs`. Um
   `<script>` que não responde não degrada: apaga o comportamento inteiro.
2. **Bundle não serve porque o runtime não passa pelo build.** O padrão desta skill
   é runtime em `public/`, lido pelo navegador como está — inclusive porque o
   minificador de CSS **invalida `linear()` calado**, e é por isso que curva
   medida mora fora do bundle.
3. **Licença.** GSAP é gratuito, plugins
   incluídos: não há token nem `.npmrc` privado para versionar junto.

**O runtime espera o global e degrada com elegância** — o molde está em
`gera-revelacao-texto.mjs:308-357`: `if (!window.gsap) return false`, retentativa
curta, e se o GSAP não chegar o elemento **fica no estado de repouso do
original** em vez de sumir. Nunca deixar conteúdo escondido esperando uma
biblioteca.

🚨 **E o GSAP só entra se a medição pedir.** O critério é a tabela acima:
duração e curva fixas resolvem em CSS, e mola pré-amostrada cola direto como
`linear()`. No framer-5 a medição pediu **zero GSAP** — inclusive a transição
de página, que o `mede-transicao-pagina.mjs` provou não existir (3 saltos, troca
seca). Carregar 70KB de biblioteca para reproduzir o que não existe é o oposto
de fidelidade.
