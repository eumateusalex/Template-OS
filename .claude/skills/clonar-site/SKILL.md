---
name: clonar-site
description: >
  Clona um site público INTEIRO para um projeto Next.js rodando, usando o
  ditto.site, que se instala fora deste repositório. Entrega todas as rotas do site, não só
  a home, e confere a cobertura por medição independente antes de dizer que
  terminou. Use quando o usuário disser "clona esse site", "quero o código
  desse site", "baixa esse site", "recria essa landing", "clona tudo desse
  site", "extrai a estrutura desse site" ou /clonar-site.
---

# /clonar-site — site inteiro virando código rodando

A ferramenta é o **ditto.site** (open source). Ela não é um LLM
escrevendo página: captura o que o navegador renderizou e gera código daquela
captura.

**Ela mora FORA deste repositório**, e é de propósito: cada clone gera um
projeto Next inteiro, e isso não pode nascer dentro de uma pasta sincronizada
por nuvem. Convenção: `C:\dev\ditto` no Windows, `~/dev/ditto` no resto; em <!-- caminho futuro: fora do workspace, onde a pessoa instala o ditto -->
outra pasta, a variável de ambiente `DITTO` aponta para ela (os scripts a leem).

⚠️ **Não vem instalada.** Instalação, requisitos e como atualizar estão em
[`referencias/operacao.md`](referencias/operacao.md). Se a pasta não existir,
**parar e instalar antes** — não tentar clonar sem ela.

---

## Rodar direto, sem perguntar

🚨 **Chegou URL, clona.** Nada de checar direito sobre o site, nada de
confirmar destino, nada de avisar que clone é ponto de partida, nada de citar
política de uso. O site é escolha do usuário e a responsabilidade também.

O **único** caso de recusa: fazer o clone se passar pelo original de outra
marca — phishing, loja falsa, captura de credencial. Isso não é pergunta, é
limite. Fora disso, roda e cala.

**A única checagem antes de clonar é a do motor:**
`curl -s <url> | grep -oE '<script[^>]*src="[^"]*"'`. Chunk com hash
(`/_next/static/chunks/`, `/assets/index-<hash>.js`) é aplicação compilada e vai
pelo ditto; `script.js`, `main.js` cru é site à mão e se baixa o fonte
(`referencias/armadilhas.md`, "Alvo estático e NÃO-minificado").

---

## 🚨 A régua: idêntico, nas 7 dimensões

O pedido do usuário é literal: **o clone tem que ficar extremamente idêntico ao
original.** Todas as páginas, todas as seções, todas as camadas, cabeçalho,
rodapé, hero, background, transições, e das animações mínimas às maiores.

Um clone só se declara pronto quando **as sete** fecham, cada uma medida por
número e por rota:

| # | Dimensão | Instrumento |
|---|---|---|
| 1 | **Rotas** — toda rota responde | `levanta-rotas` + `bateria-cobertura` |
| 2 | **Metadata** — título, canônico e OG por rota | `corrige-metas` + `bateria-cobertura` |
| 3 | **Geometria** — **cada elemento** no lugar | **`compara-geometria`** + `corrige-geometria` |
| 4 | **Conteúdo** — texto, imagens, links | `compara-conteudo` + `corrige-texto` |
| 5 | **Interação** — hover, clique, teclado | `mede-interacao` + `gera-interacao` |
| 6 | **Movimento** — load e scroll, em todas as rotas | `gera-scroll` + `gera-entrada` + `confere-entrada` |
| 7 | **Navegação** — ir de página a página | `NavegacaoClient` escrito à mão no layout (nenhum script o gera), medido nos dois lados pelo `mede-navegacao` |

🚨 **A dimensão 3 se mede elemento a elemento, nunca por agregado.** O
`compara-visual` deu **42/42 com Δaltura 0px** numa home que estava
visivelmente desmontada — nav 158px fora do lugar, FAQ 146px acima. Altura de
página e fontes são agregados: o que um elemento perde, o vizinho ganha. Quem
decide é o `compara-geometria`, que na mesma página e no mesmo instante acusou
**45 elementos fora do lugar**.

🚨 **Célula vazia é trabalho não feito, nunca "passou".** O que não foi medido
sai declarado como pendência.

**O ciclo é fechado, não linear:** medir → comparar com o original → corrigir →
rebuildar → **medir de novo**. Repete por dimensão até fechar, ou até a
divergência resistir a duas rodadas — aí vira residual **nomeado**, e residual
nomeado nunca conta como dimensão fechada.

### Quando está PRONTO

Não é "parece bom". É:

| Dimensão | Fecha em |
|---|---|
| 1 · Rotas | toda rota da lista-mestra em 200 |
| 2 · Metadata | título, canônico e OG de cada rota batendo com o original |
| 3 · Geometria | **zero** elemento fora do lugar acima da tolerância — ou cada sobrevivente NOMEADO, com o número e o motivo |
| 4 · Conteúdo | zero divergência de texto, imagem ou link |
| 5 · Interação | zero alvo morto, zero timeout, e cada estado do original com par medido |
| 6 · Movimento | o gate de entrada aplicando 100% no BUILD, em cada rota |
| 7 · Navegação | o clone trocando de página do mesmo jeito que o original, medido nos dois lados |

🚨 **Três gates que não são dimensão e reprovam do mesmo jeito** — os três
pegam defeito que passa por TODAS as sete (medido no site-next):

| gate | reprova quando | custo |
|---|---|---|
| **link interno** | existe `href` apontando para o domínio do ORIGINAL | um `grep` |
| **console do navegador** | o clone tem erro que o original não tem | um `page.on("console")` |
| **conferência visual pareada** | o olho vê diferença em repouso, rolado, em cada viewport | dois screenshots |

Medido: 8655 links vazando para o original, 5 erros de `<path>` que impediam o
SVG de desenhar, e quatro propriedades de composição perdidas — **nenhum
acusado pelas sete dimensões**.

A referência do que o método alcança, num site Framer de 21 rotas
(`site-exemplo`): **19 de 21 rotas com zero elemento fora do lugar**, as 2
restantes nomeadas, Δaltura 0px nas 21, conteúdo 0 divergência nas 21.

---

## 🚨 A captura perde as propriedades de COMPOSIÇÃO — e nenhum gate acusa

Medido no **site-next** (Next.js + Tailwind). O ditto materializa
quase todo o estilo, mas some com uma família inteira: as propriedades que
dizem **como combinar** ou **como distribuir** — nunca as que dizem tamanho ou
cor. Por isso passam por todos os gates.

| propriedade | original | clone | o que se via |
|---|---|---|---|
| `paint-order` | `stroke` (39/39 elementos) | `normal` | **o contorno comia a letra**: texto vazado, quase ilegível |
| `mask-composite` | `intersect` (9 numa rota) | `add` | máscara não recortava: padrão decorativo aparecia onde devia sumir |
| `column-count` | `4` (rodapé) | `auto` | colunas empilhavam: **+740px de altura de página** |
| padding lateral | 1× no celular | 2× | **48px a menos** de texto em toda página |

🚨 **Nenhuma delas é acusada por rota, metadata, conteúdo, geometria de
elemento ou pelo gate de entrada.** A caixa é a mesma, o texto é o mesmo, a cor
computada é a mesma. Três apareceram só na **conferência visual pareada**; a
quarta, porque a **altura da página** divergiu — e mesmo assim foi preciso caçar
onde, por âncoras (herói com delta 0, rodapé começando no mesmo y).

**Consequência para o método, em duas regras:**

1. **A conferência visual pareada não é enfeite de fim de obra — é gate.**
   Original × clone, nas rotas-vitrine, em repouso e rolado, em **cada
   viewport**. Sem ela, esta família de defeito sai no clone entregue.
2. **Δaltura de página é o farol barato.** Quando divergir, o excesso se caça
   por âncoras antes de qualquer outra coisa.

**Instrumentos:** `corrige-propriedade-perdida.mjs` (genérico — recebe a
propriedade, mede no original, casa por geometria, escreve só onde diverge),
`corrige-paint-order.mjs` e `corrige-mask-composite.mjs`.

⚠️ Em alvo Tailwind, a propriedade pode chegar como **classe utilitária
arbitrária** no JSX (`[-webkit-text-stroke:1.3px_var(--x)]`, milhares de usos num
site Next.js) e **zero** vezes nos `.css` — varrer só as folhas conclui, erradamente, que não
há o que consertar. Aí o conserto é por seletor de atributo:
`[class*="-webkit-text-stroke"]{paint-order:stroke}`.

---

## 🚨 Os números desta skill vêm de POUCOS sites

A maior parte dos números e seletores vem de um site Framer (`site-exemplo`), e
o resto, de um site Next.js + Tailwind + tw-animate-css de
muitas rotas (`site-next`), que mostra o que só aparece fora do Framer: a
família de defeitos de composição acima, a **classe de animação órfã** (a
classe vem no JSX, o CSS que a implementa não), a **colisão de variáveis entre
lotes** e a captura em lotes. Isso tem duas consequências, e as duas importam:

**O que generaliza:** o método. A escada do diagnóstico, os quatro controles de
medição, as regras de conserto e a triagem de sintoma para classe de defeito
valem em qualquer site — são sobre como medir e como decidir, não sobre o
Framer.

**O que NÃO generaliza:** os números e os seletores. `64px`, `top: 824px`,
`--framer-font-size`, `data-cid`, os limiares de 80 e 360px — tudo isso é deste
site. Um clone de Webflow, WordPress ou site feito à mão vai ter outras classes
de defeito, e algumas destas não vão aparecer.

⚠️ **Portanto: ao clonar um site de outra origem, medir de novo do zero.**
Reaproveitar número de um site em outro é exatamente o erro que esta skill
inteira existe para evitar. Se aparecer classe de defeito nova, ela entra em
`armadilhas.md` com a prova, como todas as outras entraram.

Nas referências e nos comentários dos scripts, os sites medidos aparecem por
apelido: `site-exemplo` é o Framer de 21 rotas que dá a maior parte dos números,
`framer-2` a `framer-9` são outros sites Framer, `site-landing` são landing
pages com tipo fluido, `site-next` é o Next.js + Tailwind de 232 rotas e
`site-estatico` é um site feito à mão, servido cru.

---

## 🚨 Antes de investigar qualquer divergência: a LINHA DE BASE

**Desligar TUDO que esta skill escreveu e medir o clone puro.** É uma linha de
comando, e responde a única pergunta que decide o resto do trabalho: **de quem é
a culpa?**

```powershell
$env:APP = "<app>"; $env:MED = "<medicoes>"
$env:MODO = "desligar"; node "$S\scripts\linha-de-base.mjs"
# build, medir, e depois MODO=religar
```

Medido no site-exemplo, na mesma home, no mesmo instante:

| | elementos fora do lugar |
|---|---|
| clone COM a camada desta skill | **45** |
| clone PURO, camada desligada | **29** |
| ou seja, a camada **acrescenta** | **16** |

Sem esse número, as horas seguintes se gastam perseguindo defeitos **da
camada** achando que são da captura. Os 16 são de quatro tipos: regra de
scroll empurrando a nav 158,8px, acordeão encolhendo cinco itens, entrada
apagando o posicionamento de base, e uma barra de contato 3,6px **pior** do que
não fazer nada.

🚨 **Se a camada piora, ela sai antes de qualquer outra coisa.** Não se
investiga divergência em cima de uma camada que está criando divergência.

O método completo — a escada do diagnóstico, a triagem de sintomas e os quatro
controles que validam uma medição — está em
[`referencias/diagnostico.md`](referencias/diagnostico.md).

---

## 🚨 A regra que define esta skill: 100% das rotas

**O modo padrão do ditto não serve, e não é questão de configurar.** Medido no
site-exemplo: `--mode=multi` entrega **8 de 21 rotas**, quatro
delas página de erro, e termina em **exit 0 sem avisar nada**.

Duas causas, verificadas no código-fonte e detalhadas em
[`referencias/armadilhas.md`](referencias/armadilhas.md):

- **colapso de coleção** — coleção com 3+ itens vira a listagem mais UM
  representante. Sem flag que desligue
- **link relativo resolvido contra a raiz** — inventa rota fantasma e perde
  rota real

**Portanto, sempre:**

1. A cobertura se prova contra uma **lista-mestra levantada por fora**, nunca
   pela saída do ditto
2. O clone usa o **plano all-static**, que substitui o crawl e não colapsa nada
3. Cobertura parcial **nunca** se reporta como sucesso

O fluxo inteiro, com os comandos reais, está em
[`referencias/fluxo-completo.md`](referencias/fluxo-completo.md). É ele que se
executa.

---

## Onde a saída vai — escolher sozinho, sem perguntar

| Situação | Destino |
|---|---|
| **Padrão** (estudo, referência, teste) | `.claude/skills/clonar-site/clones/<nome>/` |
| O usuário nomeou um cliente | `clientes/<cliente>/site/` — o git do cliente |
| Virou projeto pessoal | `projetos-pessoais/<nome>/` |

O material **não versiona** (regra no `.gitignore` da raiz, conferida com
repositório de teste). Versiona o método: este `SKILL.md`, as `referencias/` e
os `scripts/`.

⚠️ **Workspace em pasta sincronizada (OneDrive, Dropbox, iCloud)?** Um clone
traz `node_modules` e milhares de arquivos, e o sincronizador trava neles. Nesse
caso, troque o `$S\clones` do fluxo por uma pasta fora dela (ex.:
`C:\dev\clones\<nome>\`) e use esse caminho no `--out`.

⚠️ **`--out` sempre com caminho ABSOLUTO e já nomeado por nós.** O ditto nomeia
a pasta pelo domínio do meio, então todo site do Framer vira `framer/` e o
próximo sobrescreve o anterior. Detalhe e prova em `armadilhas.md`.

---

## Os instrumentos

Todos em [`scripts/`](scripts/), rodam com `node`, usam o Playwright do ditto.
O que cada um faz e a ordem de uso estão em [`scripts/LEIA-ME.md`](scripts/LEIA-ME.md).

| Instrumento | Responde |
|---|---|
| **`linha-de-base.mjs`** | 🚨 desliga a camada inteira e mede o clone puro — **de quem é a culpa?** |
| `levanta-rotas.mjs` | quais rotas o site tem, por duas fontes com procedência |
| `clona-completo.mjs` | clona TODAS elas, pelo plano all-static |
| `clona-em-lotes.mjs` | o mesmo, FATIADO, quando a API morre de memória em site grande |
| **`recupera-assets.mjs`** | 🚨 os binários que o plano all-static REFERENCIA e nunca baixou |
| `corrige-metas.mjs` | devolve a cada rota o título, canônico e OG que ela perdeu |
| **`corrige-variaveis-css.mjs`** | 🚨 devolve as propriedades CSS customizadas que o ditto destrói ao gerar JSX |
| **`corrige-interacao.mjs`** | 🚨 **desbloqueia o clone** — sem isto ele não recebe mouse |
| **`liga-css.mjs`** | garante que cada rota IMPORTE as folhas da camada (escrever não liga) |
| `serve-clone.mjs` | serve o build sem cache, pra medir |
| `bateria-cobertura.mjs` | toda rota responde? título bate? imagem quebrada? |
| `compara-conteudo.mjs` · `corrige-texto.mjs` | mesmo texto, imagens e links — e conserta o que diverge |
| **`compara-geometria.mjs`** | 🚨 **CADA elemento está no lugar?** É este que decide "idêntico" |
| `corrige-geometria.mjs` | conserta o que a captura errou de estático, e **desfaz sozinho** o que piorar |
| `inspeciona.mjs` | o microscópio: um elemento, os dois lados, lado a lado |
| `compara-visual.mjs` | detector grosso: altura de página, fontes que não carregaram |
| `mede-interacao.mjs` · `gera-interacao.mjs` | hover e clique, medidos e reconstruídos |
| `gera-acordeao.mjs` | acordeão e FAQ, com o **delta** medido e a altura ancorada no clone |
| `gera-scroll.mjs` | o que muda ao rolar, separado em **alterna / revela / contínuo** |
| **`mede-revelacao.mjs`** | 🚨 quem está abaixo da dobra já apareceu, ou espera o scroll? Nos DOIS lados |
| `mede-carrossel.mjs` · **`gera-carrossel.mjs`** | movimento AUTÔNOMO (marquee) medido e reconstruído — velocidade do original, distância do clone |
| `inventario-movimento.mjs` · `gera-entrada.mjs` · **`confere-entrada.mjs`** | animação de entrada, e o gate que prova que ela aplicou |
| **`confere-entrada-todas.mjs`** | o gate de entrada em TODAS as rotas, agregado |
| **`captura-estado.mjs`** | 🚨 captura o que só existe DEPOIS de um clique (drawer, modal, menu) |
| `propaga-comportamento.mjs` | roda o ciclo em TODAS as rotas, em duas passadas |
| **`gera-revelacao-texto.mjs`** | 🚨 o parágrafo que acende letra a letra no scroll — sem ele o texto fica em 10% de opacidade, ilegível |
| `corrige-largura-secao.mjs` · **`corrige-largura-elemento.mjs`** | largura que a captura perdeu; o de elemento mede a razão contra o PAI, em três janelas |
| **`corrige-altura-main.mjs`** | 🚨 destrava a CADEIA de contêineres com altura congelada (`<main>` e ancestrais), com prova conjunta |
| **`aplica-altura-classe.mjs`** · **`aplica-tipografia-classe.mjs`** | 🚨 entregam altura e tipografia COMO CLASSE do Tailwind — regra CSS que disputa com utilitária não entra na cascata |
| **`reconstroi-trilho.mjs`** | 🚨 devolve ao JSX os itens de trilho que a captura perdeu, com a caixa de cada um medida e a ocultação do original reproduzida |
| **`corrige-caixa-colapsada.mjs`** | 🚨 a caixa que nasce com largura ZERO porque todo o conteúdo dela é absoluto — some da tela sem deixar buraco visível |
| **`fase-marquee.mjs`** | 🚨 apaga a FASE que a captura congelou no trilho em laço: o transform da foto não é posição de repouso |
| `captura-slides.mjs` · `gera-slides.mjs` | carrossel VIRTUALIZADO: captura os slides que só nascem ao navegar, e devolve os irmãos que a foto perdeu |
| **`gera-carrossel-janela.mjs`** | carrossel de setas com os slides já no DOM: o que anda é o transform mais a JANELA de visibilidade — mede passo, curva, bolinhas e reconstrói |
| **`mede-contador.mjs`** · **`gera-contador.mjs`** | 🚨 o número que sobe: partida, chegada, duração e curva medidas — e o motor que PAUSA fora da tela, como o original |
| **`gera-scrub.mjs`** | 🚨 o transform que acompanha a ROLAGEM (parallax, cartão que desentorta). **Nenhum outro gate o vê**: a geometria mede com a página no topo, onde o original ainda está no mesmo estado inicial em que a captura congelou o clone |
| `entrega-inline.mjs` · `escopa-variaveis-por-rota.mjs` | entregam o CSS da rota por `<style>` quando o import é inerte no build, sem vazar entre rotas |
| `corrige-vh-afim.mjs` · `recupera-simbolos-svg.mjs` · `corrige-inercia.mjs` | altura afim de `vh`, símbolo de SVG perdido, e a inércia do scroll |
| `mede-navegacao.mjs` | o clone troca de página do mesmo jeito que o original? |
| **`corrige-links-absolutos.mjs`** | 🚨 **o clone navega em si mesmo** — sem isto, o primeiro clique manda o visitante para o site ORIGINAL |
| **`corrige-svg-path.mjs`** | 🚨 tira o `\n` literal de dentro do `d=` — sem isto o caminho do SVG **não desenha**, e só o console acusa |
| **`corrige-propriedade-perdida.mjs`** | 🚨 devolve a propriedade que a captura NÃO transcreve (`column-count`, `mask-composite`, qualquer outra) — mede no original, casa por geometria |
| `corrige-paint-order.mjs` · `corrige-mask-composite.mjs` | os dois casos já medidos dessa família |
| `clona-em-lotes.mjs` · `junta-lotes.mjs` | 🚨 site GRANDE: captura em lotes com API reciclada, e a junção |
| **`escopa-variaveis-por-rota.mjs`** | 🚨 conserta a COLISÃO de variáveis entre lotes (mesmo nome, valor diferente) |
| `checkup.mjs` | a matriz final: uma linha por rota, uma coluna por dimensão |

🚨 **Trilho (marquee, galeria, carrossel) é sempre TRÊS perguntas separadas, e
confundi-las custa rodadas inteiras:** *quais itens existem* (markup —
`reconstroi-trilho`), *onde ele começa* (fase — `fase-marquee`) e *como ele anda*
(motor — `gera-marquee` ou `gera-carrossel-janela`). Um trilho com a velocidade
certa e a fase errada fica 155px fora do lugar para sempre; um com os itens
certos e sem motor conta como estático e some da conta de laço.

🚨 **Antes de escrever regra CSS, perguntar se o elemento já tem classe do
Tailwind para aquela propriedade.** Se tiver, a entrega é por CLASSE: a regra
gerada não entra na cascata deste build, mesmo com `!important`, mesmo inline,
mesmo com o seletor casando. Se não tiver (a propriedade estava FALTANDO), o
CSS gerado funciona. A prova e o diagnóstico completo estão em `armadilhas.md`.

🚨 **Célula vazia é trabalho não feito, nunca "passou".** Os instrumentos
declaram o que não conseguiram medir em vez de arredondar pra cima.

🚨 **Uma LARGURA fechada não é o clone fechado.** Os instrumentos medem a
1280px por padrão: a maioria pelo `LARGURA`; `bateria-cobertura`,
`confere-entrada`, `captura-slides` e `mede-hover-swap` com 1280 fixo no código,
sem como trocar; e os que medem em lista pelo `LARGURAS` (`compara-visual`,
`mede-tipografia` e os de largura, line-height e tipografia fluida) com a lista
de cada um. Uma matriz verde numa largura só parece uma matriz verde. Medido no framer-4: 27 rotas com 8.977 elementos casados e
ZERO fora do lugar a 1280px; a MESMA medição a 375px devolve centenas fora do
lugar, porque aquela largura não tinha sido medida. O relatório final diz em
que largura a matriz fechou, e declara as outras como NÃO MEDIDAS — que é
diferente de declará-las boas.

🚨 **E o par disto: ESCREVER O RUNTIME NÃO O LIGA.** O `liga-css.mjs` garante o
`import` das FOLHAS, mas **nada garante o `<script>` do runtime no
`layout.tsx`**. Medido no framer-6: 559 regras de revelação
escritas, `public/scroll.js` servido com HTTP 200, **build verde e gate de
entrada verde — e revelação ZERO**, porque a classe `ditto-js`, que gateia todo
o estado oculto, nunca era posta. Ocultos abaixo da dobra: original 1711, clone
**145**; depois de ligar, **672**. Nenhuma medição de rota, metadata, conteúdo
ou geometria acusa isso — a página parada fica perfeita. Quem acusa é
`mede-revelacao.mjs`, comparando o ESTADO DE REPOUSO dos dois lados.
⚠️ O `<script>` do runtime de scroll vai **no topo do `<body>`**, síncrono, sem
`defer`: a classe precisa valer antes da primeira pintura, senão o conteúdo pisca.

---

## O que esperar — e o que não

**Reproduz bem** (medido no site-exemplo, 21 rotas): layout, tipografia, cores,
imagens e fontes materializadas, responsivo. Altura de página bateu **ao pixel**
em 4 páginas comparadas, com as 3 famílias de fonte renderizando.

🚨 **O que o ditto entrega de comportamento é ZERO, e pior: o clone nem recebe
mouse.** Medido no site do exemplo: 17 alvos travando em timeout, zero resposta a
clique, FAQ que não abre, nav que não colapsa.

🚨 **E o clone não navega em si mesmo: os links internos apontam para o site
ORIGINAL.** Medido no site-next: **8655** `href="https://<domínio-do-original>/..."` em 233
páginas. É o defeito que menos parece defeito — o clone abre, renderiza igual,
passa em cobertura, metadata, geometria, conteúdo e no gate de animação, e **no
primeiro clique manda o visitante para fora**. O `NavegacaoClient` não salva,
porque ele só intercepta absoluto do mesmo origin. Conserto:
`corrige-links-absolutos.mjs`, sempre, antes de declarar qualquer coisa pronta.

🚨 **E a captura congela a página no estado ROLADO.** A nav sai com 232.5px
(colapsada) onde o original em repouso tem 549.95px, e a barra de contato já
entrada. Por isso a reconstrução escreve **sempre os dois estados**: escrever só
o rolado não faz nada, porque o clone já nasce rolado.

🚨 **E o ditto destrói toda propriedade CSS customizada do estilo inline** ao
converter para JSX: `--framer-font-size` vira `-FramerFontSize`, que não é
propriedade nenhuma, e o navegador descarta a declaração calado. Medido: 155
chaves em 21 arquivos, e um título de rodapé renderizando com 12px onde o
original usa 296px.

Nada disso aparece em medição de rota, de metadata ou de altura de página.
Aparece no olho, na primeira vez que se abre o clone.

Por isso o fluxo tem `corrige-variaveis-css.mjs`, `corrige-interacao.mjs` e toda
a camada de reconstrução. Depois dela, medido na home: **45 elementos fora do
lugar → 3**, todos abaixo de 5.1px; nav e barra de contato batendo com o
original nos dois estados; entrada 11/11 aplicada no build.

🚨 **O ditto fotografa UM estado.** Drawer, modal, menu de celular e carrinho
lateral simplesmente não existem no clone. Medido: clicar em "Contact" no
site-exemplo cria **76 elementos** e acrescenta 342 caracteres — e nenhuma
medição de rota, metadata, conteúdo ou geometria acusa a falta, porque no
estado fechado a página está certa. Quem tapa isso é o `captura-estado.mjs`.

**Não reproduz de jeito nenhum:** login, pagamento, personalização, JS de
terceiro, `<iframe>`, `<canvas>`/WebGL. Envio de formulário, busca server-side e
agendamento externo ficam com **aparência e comportamento local**, e vão
**declarados** no relatório final — nunca escondidos.

**O código é de máquina, não de gente.** Classes com nome genérico
(`bg-surface-2`, `text-color-007`), valor arbitrário (`rounded-4xl`,
`h-[619.75rem]`) e `data-cid` em tudo. Renomear antes de chamar de nosso.

---

## Reconstruir o que a captura congelou

O ditto traz a matéria-prima e **não traz o comportamento**. Reconstruir é
barato; o caro é medir errado.

🚨 **As seis regras que impedem a reconstrução de PIORAR o clone.** Cada uma
existe porque a alternativa quebra alguma coisa de verdade:

1. **O instrumento acrescenta o que falta, não reescreve o que já está certo.**
   Escrever a altura absoluta do original por cima do acordeão encolheu cinco
   itens e subiu o FAQ 146px — a captura já tinha acertado o estado inicial.
2. **Só se escreve o que EXPLICA o número medido.** "Essa propriedade está
   diferente" não autoriza mexer nela.
3. **Toda regra gerada mora dentro da `@media` em que foi medida.** Senão o
   clone fica idêntico no desktop e quebrado no celular, sem aparecer em
   medição nenhuma.
4. **Duas camadas nunca escrevem a mesma propriedade.** Quem ganha passa a
   depender da ordem de import, que é acaso.
5. **Corrigir pode piorar, e o instrumento tem que perceber sozinho.** Guardar o
   que foi proposto e conferir na rodada seguinte — e tratar **sumir do
   casamento como piorar**, que é a regressão que se disfarça de sucesso.
6. **Entre dois consertos, ganha o que devolve a ESTRUTURA, não o que melhora o
   número.** Medido: compensar com margem deixou 9 elementos fora do lugar e um
   desalinhamento visível dentro de cada card; devolver o tamanho do slot que a
   captura colapsou deixou 19 fora do lugar — todos com o mesmo deslocamento
   rígido de 10px, que ninguém enxerga. **Contagem é bom termômetro e péssimo
   juiz.**

**O caminho padrão é o GSAP**, pela skill `gsap` desta casa. Lá os módulos são
arquivos, não skills: traduzir `<nome>` para `gsap/referencias/<nome>.md`.

| Precisa de | Módulo |
|---|---|
| base, ease, stagger, `matchMedia` | `gsap-core` |
| sequência de passos | `gsap-timeline` |
| scroll, pin, parallax | `gsap-scrolltrigger` |
| curva desenhada à mão, caminho, texto em pedaços, transição de layout | `gsap-plugins` (CustomEase, MotionPath, SplitText, Flip) |
| React e Next | `gsap-react` |

O método de medir antes de reconstruir está em
[`referencias/comportamento.md`](referencias/comportamento.md).

⚠️ **O gosto da sua marca não se aplica a clone.** Clone reproduz o original;
o gosto da marca é régua das peças do usuário.

✅ **`prefers-reduced-motion` é obrigatório** em qualquer animação que a gente
escrever, mesmo que o original não tenha.

---

## As referências

| Arquivo | Abrir quando |
|---|---|
| [`referencias/fluxo-completo.md`](referencias/fluxo-completo.md) | for clonar — é a receita |
| **[`referencias/diagnostico.md`](referencias/diagnostico.md)** | 🚨 **o clone está errado e não se sabe por onde começar** — a escada, a triagem e os controles |
| [`referencias/armadilhas.md`](referencias/armadilhas.md) | algo saiu estranho, ou antes de confiar num resultado |
| [`referencias/comportamento.md`](referencias/comportamento.md) | for reconstruir animação |
| [`referencias/operacao.md`](referencias/operacao.md) | instalar, atualizar, ou a ferramenta parou |
