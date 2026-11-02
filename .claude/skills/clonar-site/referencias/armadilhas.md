# As armadilhas medidas

> Referência por defeito: cada entrada diz o **sintoma** (o que se vê), a
> **causa**, o **conserto** e **como conferir** que o conserto pegou. Só entra
> aqui o que foi medido num clone, com a prova reproduzível; bug herdado de
> outra instalação não entra, porque conserto cego vira o próprio bug.
>
> A maior parte vem de sites Framer, e uma parte de sites Next.js + Tailwind e
> de sites feitos à mão. Classe de defeito muda com a origem do site: ao clonar
> uma origem nova, medir de novo do zero, e a classe nova entra aqui no mesmo
> formato.

🚨 **Se o clone está errado e você não sabe por onde começar, não é aqui que se
entra**: é em [`diagnostico.md`](diagnostico.md), que tem a triagem de sintoma
para classe de defeito. Este arquivo é a prova de cada uma, para consultar
depois de saber o que se procura.

---

## O índice, por tipo de falha

| Seção | Procure aqui quando |
|---|---|
| 1 · Rotas, coleção e metadata | falta rota, rota tem outro nome, título ou canônico errado, pasta sobrescrita |
| 2 · Conteúdo e links que a captura perde | texto ou link some, link manda para o original, o clone chama terceiro, alvo não é app compilado |
| 3 · Valores congelados no instante da captura | altura que não acompanha a janela, elemento no estado rolado, botão no meio do hover, trilho fora de fase |
| 4 · Caixas colapsadas e propriedades perdidas | elemento some sem buraco, vizinho deslocado sem culpa, ícone vazio, desenho errado com caixa certa |
| 5 · Tipografia | linhas a mais ou a menos, bloco inteiro empurrado, deriva que cresce ao longo do texto |
| 6 · Cascata e entrega do CSS | regra está no build e não aplica, valor de uma rota aparece em outra, animação morre no build |
| 7 · Interação: clique, hover e estados | nada responde ao mouse, hover errado, menu não abre, controle de modal fechado clicável |
| 8 · Animação, laço e runtime JS | entrada ou revelação não toca, marquee parado, contador comendo texto, runtime duplicando conteúdo |
| 9 · Hidratação e navegação | página monta e desmonta, link morto, troca de página seca, elemento que pisca a cada clique |
| 10 · Imagens e peso | página mais pesada que o original, imagem errada com desenho certo |
| 11 · Quando a medição mente | número bom com clone errado, número ruim com clone certo, resultado que muda sozinho |
| 12 · Quando o conserto piora | conserto que quebra o que funcionava, camada que some na rodada seguinte |
| 13 · Servidor, portas e processos | 404 em rota que existe, medição de outro site, processo que some |
| 14 · Shell, arquivos e edição | arquivo corrompido ou vazio, lixo dentro do CSS gerado, rota que vira caminho |

Os nomes de seção citados entre aspas por outros arquivos ("Runtime JS global
não pode carregar dado de rota", "Regra que DISPUTA com utilitária do
Tailwind", "Alvo estático e NÃO-minificado") continuam sendo títulos de entrada.

---

## 1 · Rotas, coleção e metadata

### 🚨 A pasta de saída vem do domínio do meio, não do subdomínio

- **Sintoma:** dois sites da mesma plataforma clonados no mesmo `--out`, e o
  segundo sobrescreve o primeiro, sem aviso.
- **Causa:** a função `siteName()` de `compiler/src/cli.ts` tira `www.`, corta o
  TLD e pega o rótulo seguinte. Todo site hospedado em plataforma
  (`framer.website`, `framer.app`, `vercel.app`, `netlify.app`, `webflow.io`)
  colapsa no nome da plataforma:

  ```
  https://example.com/                 ->  example
  https://algum-site.framer.website/   ->  framer
  https://x.framer.app/                ->  framer
  https://blog.example.co.uk/          ->  example
  ```

- **Conserto (padrão desta skill):** dar ao `--out` um caminho absoluto já
  nomeado por nós e aceitar a pasta interna que o ditto cria. Isso elimina a
  colisão e mantém o caminho estável entre rodadas, que é o que o reuso de
  captura precisa.

  ```bash
  --out="<clones>/<nome-que-eu-escolhi>"
  # resultado: <clones>/<nome-que-eu-escolhi>/<siteName>/{app,.clone}
  ```

- **Conferir:** a pasta `<nome-que-eu-escolhi>` existe e só ela mudou.

### ⚠️ `--out` aceita caminho com espaço

- **Sintoma esperado e falso:** medo de que caminho com espaço (o comum no
  Windows) quebre o clone.
- **Fato:** o clone cai exatamente no destino pedido. Não precisa de caminho
  curto nem de outro desvio.

### 🚨 O colapso de coleção: a falha calada que importa

- **Sintoma:** o modo `--mode=multi` descobre muitas rotas, seleciona menos da
  metade e termina em exit 0 sem um único erro sobre as que ficaram de fora:

  ```
  {"event":"crawl_done","paths":25}
  {"event":"plan","discovered":25,"selected":12,"collections":1}
  ```

- **Causa:** em `compiler/src/crawl/routeTemplates.ts`, coleção com **3 ou mais
  itens** sob o mesmo segmento vira "a listagem mais **um** representante"
  (`instances[0]`). Par de 2 itens é reproduzido inteiro. **Não existe flag que
  desligue**: `--max-collection` limita a listagem, não expande a coleção.
- **Conserto:** o clone nunca se declara completo pela saída do ditto, e sim
  pela **lista-mestra** medida por fora (`scripts/levanta-rotas.mjs`), com cada
  rota clonada explicitamente.
- **Conferir:** `scripts/bateria-cobertura.mjs` com a lista-mestra responde 200
  em todas.

### ⚠️ O mesmo conteúdo pode responder em dois caminhos

- **Sintoma:** o crawl descobre mais rotas que o sitemap (`/projects/x` **e**
  `/x`), e a matriz de cobertura acusa rota sobrando ou faltando.
- **Causa:** o original responde nas duas formas.
- **Conserto:** reconhecer o par como alias; alias não é rota faltando nem rota
  sobrando.
- **Conferir:** as duas URLs devolvem o mesmo título e o mesmo conteúdo no
  original.

### O ditto SANITIZA slug com percent-encoding e parênteses

- **Sintoma:** `corrige-metas.mjs` (ou outro instrumento por rota) diz
  "page.tsx não existe (rota não foi clonada?)" em rotas que foram clonadas.
- **Causa:** o ditto reescreve o slug: `%E2%80%99` vira `-E2-80-99` e os
  parênteses somem (`...-(antes-da-crise)` vira `...-antes-da-crise`).
- **Conserto:** renomear a pasta da rota para o slug **decodificado** (o App
  Router casa URL percent-encoded com nome decodificado de pasta; apóstrofo
  tipográfico e aspas curvas valem em nome de pasta no Windows) e reescrever os
  hrefs internos para a forma do sitemap do original. Parêntese no meio do
  segmento não vira route group; só segmento inteiramente `(assim)`.
- **Conferir:** toda rota da lista-mestra acha a sua `page.tsx`, e a navegação
  pelos links internos chega nela.

### Pasta com acento ou unicode nos instrumentos

- **Sintoma:** numa rota com `%E2%80%99` ou acento no slug, um instrumento por
  rota (metas, entrada, interação, acordeão, scroll, geometria) aborta com
  "status 1" ou declara a rota "não clonada", em silêncio, enquanto as outras
  passam.
- **Causa:** a rota vem percent-encoded (é assim que existe no original), e a
  pasta no disco tem o caractere literal.
- **Conserto:** decodificar cada segmento da rota (`decodeURIComponent`) antes
  de montar o caminho em disco.
- **Conferir:** a rodada lista cada rota com o seu resultado, inclusive a de
  slug com acento.

### 🚨 Toda rota herda a metadata da home, inclusive o `canonical`

- **Sintoma:** o `<title>` de posts e páginas internas é o da home, e todas as
  rotas declaram `"alternates": { "canonical": "/" }`. Num site publicado isso
  basta para o buscador tratar o site inteiro como uma página só; junto vão a
  `description` e o `openGraph`.
- **Causa:** o ditto declara metadata **só** em `src/app/layout.tsx`; nenhuma
  `page.tsx` exporta a sua.
- **Conserto (obrigatório antes de publicar):**

  ```bash
  ORIGINAL=<url> APP=<pasta>/app ROTAS=<rotas.json> node scripts/corrige-metas.mjs
  ```

  Ele colhe título, descrição, canônico e OpenGraph de cada rota no original e
  escreve `export const metadata` na `page.tsx` correspondente. É idempotente e
  pula, com motivo declarado, página que seja client component (o Next não
  aceita metadata ali).
- **Conferir:** `bateria-cobertura.mjs` compara o título de cada rota com o do
  original. Título repetido de propósito no original (várias rotas com o mesmo
  `<title>`) não é defeito; a comparação canoniza espaço e entidade antes de
  julgar.

---

## 2 · Conteúdo e links que a captura perde

### 🚨 Links internos absolutos: o clone manda o visitante embora

- **Sintoma:** o clone abre, renderiza igual, passa em cobertura, metadata,
  geometria, conteúdo e animação, e **no primeiro clique leva o visitante para o
  site original**.
- **Causa:** o ditto materializa link interno como URL absoluta para o domínio
  do original (`href="https://<domínio-do-original>/..."`), em milhares de
  ocorrências espalhadas por todas as páginas num site grande. O
  `NavegacaoClient` não salva: ele só intercepta absoluto quando o origin bate
  com o da página, e o do original nunca bate com o do servidor local.
- **Conserto:** `corrige-links-absolutos.mjs`. As menções que sobram (canônico,
  OpenGraph, JSON-LD) ficam de propósito: metadata aponta para o original.
- **Conferir:** `grep -c 'href="https://<domínio-do-original>' ` no JSX dá zero
  fora da metadata, e um clique em link interno fica no servidor local.

### 🚨 Menu suspenso: o conteúdo do painel fechado não vem

- **Sintoma:** `compara-conteudo` reprova todas as rotas com os mesmos textos e
  links ausentes, repetidos em cada página.
- **Causa:** no original os itens do menu existem no DOM com caixa 0×0 (painel
  fechado); no clone eles **não existem**. É perda de conteúdo e de link em
  todas as páginas.
- **Conserto:** devolver os itens (texto e href) num bloco sem área no layout,
  com `width: 0; height: 0; overflow: hidden` (ver "A camada pode PIORAR a
  geometria", na seção 12). O gatilho do painel pode ser **hover**, não clique:
  o hover leva `aria-expanded` a `true` e o clique FECHA, daí o
  `ACAO=hover` do `captura-estado.mjs`. O que o instrumento capturar com o
  painel "aberto" se confere antes de injetar: elementos novos que vêm de uma
  demo em laço são ruído, não estado.
- **Conferir:** `compara-conteudo` passa a bater nos textos e links do menu.

### 🚨 A lista de CMS vem toda carregada: busca, filtro e carregar mais somem

- **Sintoma:** a página de listagem do clone mostra todos os itens de uma vez,
  o campo de busca tem `value=""` fixo e não aceita texto, e não há filtro nem
  "carregar mais".
- **Causa:** a captura é feita depois de rolar, com tudo já carregado, e a
  lógica da consulta não vem.
- **Conserto:** ler a consulta no código publicado da página (tamanho de
  página, `CONTAINS(Title, busca)`, categoria, o gatilho invisível que carrega
  mais com `rootMargin` e de novo depois de cada página, o bloco de "lista
  vazia") e reproduzir num runtime com os dados da coleção. A busca procura no
  campo da COLEÇÃO, que pode diferir do texto do cartão.
- **Conferir:** uma prova que percorre busca, filtro e paginação nos dois lados
  e compara os mesmos slugs em cada passo.

### ⚠️ Badge de plataforma NÃO é conteúdo do site

- **Sintoma:** toda rota reprova no `compara-conteudo` por um texto do tipo
  "Create a free website with Framer..." com link para a plataforma.
- **Causa:** site em plano grátis de Framer, Wix, Webflow e afins recebe um selo
  fixo da hospedagem. Reproduzi-lo seria carregar publicidade de terceiro.
- **Conserto:** vira residual declarado, nunca defeito. O `compara-conteudo.mjs`
  tem a lista `RUIDO_PLATAFORMA` e filtra antes de comparar.
- **Conferir:** quem separa o selo do rodapé real é a posição: ruído de
  plataforma fica em `position: fixed`, o rodapé fica no fim do documento.

### Conteúdo por data congela no clone

- **Sintoma:** o rodapé do clone mostra o ano anterior ao do original.
- **Causa:** o original recalcula o ano; a captura grava o que estava na hora.
  Todo clone de site com ano no rodapé nasce com essa divergência, e ela volta a
  cada virada de ano.
- **Conserto:** `corrige-texto.mjs`, ou reproduzir o cálculo do original.
- **Conferir:** comparar texto por posição (seção 11, "Comparar texto por
  CONJUNTO") acusa a divergência na coordenada certa.

### 🚨 Alvo estático e NÃO-minificado: o ditto é o instrumento errado

- **Sintoma:** o site não é aplicação compilada: são poucos arquivos servidos
  crus (`index.html`, `styles.css`, `script.js`), com CSS escrito à mão e
  comentários do autor.
- **Causa:** o ditto foi feito para vencer bundle React/Next minificado e
  Tailwind gerado, reconstruindo do DOM renderizado. Aqui ele reconstruiria por
  aproximação o que dá para **baixar exato**, e destruiria os comentários.
- **Conserto:** triagem antes de subir a API:

  ```bash
  curl -s https://alvo.exemplo/ | grep -oE '<script[^>]*src="[^"]*"'
  ```

  | O que aparece | Diagnóstico |
  |---|---|
  | `/_next/static/chunks/<hash>.js`, `/assets/index-<hash>.js` | aplicação compilada → **ditto** |
  | `script.js?v=<hash>`, `main.js`, `app.js` | site à mão → **baixar o fonte** |

  Confirma-se com `curl -s .../script.js | head -40`: bloco de comentário humano
  é fonte, não build.
- **Conferir:** com o fonte em mãos, a fidelidade é **provada por md5**: segunda
  coleta independente e hash arquivo a arquivo, todos iguais. O resto da régua
  continua igual (cobertura, geometria nas larguras, console pareado,
  conferência visual): muda o motor de captura, não o método.

### 🚨 O clone chama servidor de TERCEIRO em runtime, e nenhum gate pega

- **Sintoma:** nenhum. Rotas, metadata, geometria, conteúdo e console passam, e
  não há `href` vazando, mas cada teste do formulário cria um lead falso no CRM
  do dono, dispara o pixel de anúncio dele ou manda mensagem para o WhatsApp
  dele.
- **Causa:** a requisição não está no HTML; é `fetch` em runtime, que só
  acontece depois do formulário preenchido até o fim. O gate de link procura
  link, e isto não é link.
- **Conserto:** neutralizar os destinos de terceiro (endpoint de lead, pixel,
  `wa.me`) no clone.
- **Conferir:** `scripts/gate-vazamento.mjs` intercepta `page.on("request")`,
  percorre o fluxo até o fim e reprova por host:

  ```
  CLONE=http://127.0.0.1:8082 PROIBIDOS=dominio1,dominio2 node gate-vazamento.mjs
  ```

  🚨 **Percurso parcial não fecha este gate:** o `fetch` mora no último passo, e
  um caminhador que para antes dá "0 proibidos" que não vale nada. O instrumento
  declara `chegou ao envio: SIM/NÃO`, e sem o SIM a célula fica vazia. Clicar "na
  primeira opção visível" pega o card que está SAINDO da transição (dois cards
  coexistem por alguns ms); o teclado (Enter, e A/B/C para escolha) evita a
  disputa.

### Site grande: a API in-memory morre, e a captura vira lotes

- **Sintoma:** job com centenas de rotas derruba a API muitos minutos depois de
  `running`, sem stack.
- **Causa e conserto, por modo de morte** (`clona-em-lotes.mjs`):
  1. job in-memory grande demais para a memória livre → lotes pequenos, API
     reciclada por lote;
  2. os assets binários são URLs servidas pela API in-memory → o `unpack` roda
     DENTRO da sessão do lote, antes de derrubar a API;
  3. tarefa de fundo morta por prazo do harness → driver desacoplado, log em
     arquivo;
  4. reusar API sobrevivente de tentativa anterior → 404 (store de outro
     processo) ou BUSY; o `clona-em-lotes.mjs` sobe a API dele numa porta livre
     (sem `API=` no ambiente), para se a porta pedida tiver dono e só derruba o
     filho que ele mesmo subiu: **nunca matar processo por porta**;
  5. BOM do PowerShell 5.1 em `Out-File -Encoding utf8` quebra o `JSON.parse`.
- **Conferir:** `junta-lotes.mjs` termina com todas as rotas da lista-mestra.

### 🚨 Colisão de variáveis entre lotes

- **Sintoma:** depois de juntar os lotes, boa parte do site pinta com as cores
  erradas, e nenhuma medição acusa (geometria mede caixa, não cor).
- **Causa:** o ditto numera as cores por ordem de descoberta **dentro da
  captura**, e cada lote descobre em ordem diferente: `--clr-11` é uma cor num
  lote e outra no seguinte. Muitos nomes comuns entre lotes têm valor diferente.
- **Conserto:** renomear por lote não serve, porque as variáveis alimentam o
  `@theme` do Tailwind, que gera as classes. O `escopa-variaveis-por-rota.mjs`
  mantém o nome e escopa o valor: união dos nomes no `globals.css` e bloco
  `[data-rota="<slug>"]` no CSS da rota. Funciona porque custom property que
  referencia outra resolve **no ponto de uso**.
- **Conferir:** a junção também lista aliases de tema e `@font-face` que só um
  lote tinha; sem eles, classes utilitárias não existiriam e fontes não
  carregariam em rotas que passam por toda medição de rota e conteúdo. E a fusão
  é **arquivo a arquivo, nunca pasta a pasta**: as rotas de uma mesma seção caem
  em lotes diferentes, e copiar a pasta do primeiro perde metade delas, calado.

---
## 3 · Valores congelados no instante da captura

A família inteira tem a mesma raiz: **valor derivado virando constante**. O
ditto grava o valor resolvido no instante e na janela da captura, e o que no
original depende da janela, do tempo ou do estado vira número fixo.

### 🚨 O ditto CONGELA tamanho relativo ao viewport (`100vh` vira px)

- **Sintoma:** o hero (ou um overlay, uma seção de altura cheia) tem a mesma
  altura em qualquer janela, e o estrago aparece **longe do culpado**: tudo
  abaixo do hero desce ou sobe em bloco, ou o modal centrado dentro de um
  overlay curto sobe metade da diferença, e a geometria acusa os elementos do
  modal, nunca o overlay (que não tem texto e nem entra no casamento).

  | viewport | original | clone |
  |---|---|---|
  | 700 | 700px | **800px** |
  | 900 | 900px | **800px** |
  | 1100 | 1100px | **800px** |

- **Causa:** `height: 100vh` sai como px da janela de captura (`h-200` = 800px).
  No Framer o ditto ainda **fabrica** variantes responsivas que não existem no
  original (`md:max-lg:h-[...]`, `2xl:h-270`) para um hero que é `100vh` liso em
  toda largura. Como o hero está no topo, a diferença cascateia para a página
  inteira.
- **Conserto:** `corrige-viewport.mjs`, que só escreve `Nvh` quando a razão
  tamanho/viewport é a MESMA em várias alturas medidas. Ele ancora por texto: a
  **imagem** dentro do hero congela junto e precisa da mesma regra, estendida à
  mão pelo cid da `img`. Quando o elemento já tem classe do Tailwind para a
  altura, a entrega é por classe (`aplica-altura-classe.mjs`, ver seção 6).
- **Conferir:** 🚨 medir a altura do elemento variando a **ALTURA** da janela
  com a largura fixa. Se acompanha (700→700, 900→900), é `100vh`. Variar só a
  largura engana: com a janela travada em 900, o hero dá 900 em toda largura e
  parece `height: 900px` fixo.

### 🚨 Altura AFIM congelada: `h = a + b·viewport`

- **Sintoma:** seção que mede 997/1197/1397px nas janelas 700/900/1100 (razão
  variável, inclinação constante), e o `corrige-viewport` a recusa. Várias seções
  assim em sequência somam uma cascata que empurra a página inteira.
- **Causa:** conteúdo fixo (`a`) somado a filho(s) de altura proporcional à
  janela, congelados nos px da captura. A recusa do modo padrão é CERTA: não é
  proporção pura.
- **Conserto:**
  - inclinação exatamente 1 (um filho `100vh`): `corrige-vh-afim.mjs` mede três
    janelas, escreve `100vh` no filho congelado E `calc(a·px + 100vh)` na caixa
    da seção (as duas congelam), com `!important`, porque a classe utilitária do
    clone tem a mesma especificidade;
  - inclinação qualquer: `corrige-viewport.mjs` com `AJUSTE=linear` (opt-in)
    aceita a reta pelos extremos com TODO ponto do meio dentro da tolerância,
    escreve `calc(a·px + (100b)vh)` e trata |b| < 0.02 como fixo.
- **Três armadilhas na aplicação:**
  1. a âncora pode subir para o nível errado: a regra do neto cai no filho e o
     neto fica sem regra (degrau interno). Conferir o EMPILHAMENTO depois;
  2. seção com `overflow: clip` engole o crescimento do filho: a regra tem de
     subir até quem clipa;
  3. contêiner flex `justify-center` esconde o resto: cards congelados dentro de
     um contêiner já corrigido centralizam com folga nas pontas. Devolver
     `100vh` a cada card zera a folga sozinho; não escrever offset.
- **Conferir:** as alturas nas três janelas batem com o original, e a regra não
  vaza para a faixa do celular (o envelope de largura vale aqui também).

### O ditto congela margem automática em px

- **Sintoma:** um `span` alinhado à direita fica deslocado por uma distância
  exata e redonda.
- **Causa:** `margin-left: auto` vira `ml-[<px da captura>]`.
- **Conserto:** devolver `margin-left: auto`. O `corrige-geometria.mjs` só
  procura causa em ancestral, e esta é no próprio elemento: quando não se
  escreve, fica declarado.
- **Conferir:** o deslocamento do original é `largura do pai − largura do
  elemento`, e o do clone passa a ser o mesmo.

### 🚨 A captura pode congelar o elemento no estado JÁ ROLADO

- **Sintoma:** a nav do clone nasce colapsada; escrever só a regra do estado
  rolado não faz nada.
- **Causa:** a captura gravou o elemento no estado final de um comportamento de
  scroll.
- **Conserto:** escrever os DOIS estados: o de repouso na regra base e o rolado
  na classe.

  ```css
  [data-cid="n4"]{width:550px;transition:width 74ms ...}
  body.ditto-rolado [data-cid="n4"]{width:233px}
  ```

- **Conferir:** vale para qualquer reconstrução de estado, não só scroll:
  conferir em que estado a captura congelou antes de decidir o que escrever.

### 🚨 Botão hover-swap congelado no MEIO do hover

- **Sintoma:** o botão cujo texto desliza numa janela de clip no hover nasce
  largo demais, com o rótulo deslocado, ou com a janela de clip aberta.
- **Causa:** a captura pega o quadro do meio do hover. É classe recorrente no
  Framer, e tem **variante por breakpoint**: corrigir o repouso só na `@media`
  do desktop deixa a variante do celular congelada, em todas as rotas, invisível
  para o agregado de altura.
- **Conserto:** medir o repouso no original, botão a botão e em cada faixa
  (`mede-hover-swap.mjs`), e a curva do hover por rAF (ida e volta têm curvas
  diferentes; as duas viram `linear()` com os pontos amostrados,
  `gera-hover-swap.mjs`). Entregar por `<style>` JSX ou `public/`, porque o
  minificador invalida `linear()` (seção 6).
- **Conferir:** a geometria a 375 e a 1280 com o rótulo no lugar.

### ⚠️ O `:hover` vem com valor capturado NO MEIO da animação

- **Sintoma:** no CSS gerado aparece `[data-cid=n1318]:hover{filter:blur(4.65735px);opacity:.0685304}`,
  que não é estado de hover que alguém projetou.
- **Causa:** o elemento foi flagrado no meio da animação de entrada e gravado
  como estado de hover.
- **Conserto:** depois que o `hover.css` medido existe, as regras `:hover` cruas
  do `ditto.css` saem. Elas não ficam inofensivas por baixo: sem
  `(hover: hover)` valem sozinhas no TOQUE (o hover gruda com o valor do meio) e
  em toda largura onde a regra medida não chega.
- **Conferir:** comparar o hover contra o original antes de confiar no que veio.

### 🚨 A captura congela um INSTANTE de laço e de corrente de variantes

- **Sintoma:** algo que no original anda sozinho (cartão que balança, pulso de
  um selo "disponível", onda de três pontos) está parado no clone. Nenhuma régua
  de estado parado vê.
- **Causa:** a captura fotografa um instante. No Framer, o laço é
  `__framer__loop` e a corrente de variantes agenda a próxima com atraso
  (`L(() => N("…"), 400)`).
- **Conserto:** varrer o código publicado por `__framer__loop` e por `L(()=>N(`
  e reproduzir com o tempo do código (keyframes ou runtime).
- **Conferir:** `inventario-movimento.mjs` nos dois lados; a régua de bordas às
  vezes acha o elemento por ele estar girado diferente ("sem par pela caixa").

### 🚨 A projeção de layout congelada (`scaleX` nos pais) espreme ou estica o texto

- **Sintoma:** a frase de um componente que muda de largura sozinho (um ciclo
  de palavras) sai espremida ou esticada em algumas larguras ou em quase todas
  as rotas, e as réguas de texto e de borda passam.
- **Causa:** o Framer anima a largura por projeção de layout: muda a largura de
  uma vez e corrige com `scaleX` no pai e o inverso nos filhos, que se anulam. A
  captura congela essas escalas em classes (`transform-[matrix(0.89,0,0,1,…)]`
  por faixa), pais e filho juntos. Em algumas faixas o inverso não fecha já na
  captura; e escrever o transform do filho sem mexer nos pais desfaz o inverso.
- **Conserto:** sem transform nos invólucros (o repouso do original), a largura
  da caixa escrita em px pelo runtime e animada pela mola do componente.
- **Conferir:** `scripts/sonda-escala-congelada.mjs`, produto das escalas (sem a
  rotação) de todo texto contra o original, em toda rota e largura. Repetir
  depois de qualquer conserto que escreva transform num filho.

### 🚨 Variante por BREAKPOINT não vem na captura

- **Sintoma:** um componente que no celular é outra variante (barra de contato
  aberta com rótulos à mostra) aparece no clone com a variante do desktop.
- **Causa:** a captura grava uma variante; os `overrides` por breakpoint ficam
  no código.
- **Conserto:** ler os `overrides` por breakpoint no código e dar ao runtime uma
  faixa por item (`media` e o estado fora dela). 🚨 **O limite é da PÁGINA, não
  do componente:** o mesmo componente pode abrir abaixo de 992px numa rota e
  abaixo de 768px em outra. Medir o limite em cada tipo de página
  (`setViewportSize` descendo largura a largura), e o remendo para quando
  aparecer rota sem limite medido.
- **Conferir:** `scripts/sonda-bordas.mjs` nas larguras intermediárias (800px
  pega a faixa entre os dois limites).

### 🚨 Painel capturado como RETRATO inline numa largura só

- **Sintoma:** um painel (contato, drawer) abre fora da tela no celular, os
  campos perdem o contorno e o `required`.
- **Causa:** o painel foi capturado como HTML com estilo computado inline a
  1280px; o contorno do campo no Framer é `::after`, que estilo inline não
  carrega.
- **Conserto:** reconstruir em JSX com uma folha de valores medidos por faixa e
  o movimento lido no código (deslocamento e mola do painel, mola do fundo).
- **Conferir:** abrir o painel nas três larguras, nos dois lados.

### 🚨 O transform capturado de um trilho é FASE, não repouso

- **Sintoma:** os itens de um marquee ficam todos deslocados pelo mesmo valor o
  tempo todo, com a velocidade certa; ou uma seção de altura cheia aparece
  **VAZIA**, com o único slide sobrevivente parado fora do enquadramento
  (`transform-[matrix(1,0,0,1,-6400,0)]` na `<ul>`). Rotas, metadata e conteúdo
  passam (o texto ESTÁ na página), e a geometria acusa só poucos elementos com
  `dx` grande, fácil de confundir com resíduo de laço.
- **Causa:** a captura grava o deslocamento do trilho no milissegundo da foto.
  O runtime do marquee parte desse x0 e o mantém para sempre; o carrossel fica
  parado nele.
- **Conserto:** a fase de repouso se mede **logo depois do load** (na página
  assentada o trilho já andou), e o trilho parte dela (`fase-marquee.mjs`). No
  carrossel, o deslocamento sai da medição: largura do slide × posição do slide
  sobrevivente entre os filhos. O envoltório do trilho costuma vir com altura
  congelada também (ver "A cadeia de alturas congeladas", seção 4).
- **Conferir:** ⚠️ ao terminar as dimensões medidas, ABRIR o clone e o original
  lado a lado nas seções de altura cheia. Seção vazia é invisível para todo gate
  que conta elemento, porque o elemento está lá.

### 🚨 Contador congelado em voo

- **Sintoma:** os números de um contador no clone não batem com os do original
  em repouso, e o site responsivo traz DUAS variantes do mesmo bloco com
  números diferentes entre si.
- **Causa:** a captura saiu no meio da contagem. Dois valores para o mesmo dado
  só acontecem se o dado estava mudando quando a foto saiu; a variante oculta
  fica no valor de partida porque nunca entrou em tela.
- **Conserto:** o valor de PARTIDA é o que está no HTML do original (não zero),
  e o runtime reproduz a contagem (ver "O contador PAUSA fora da tela", seção 8).
- **Conferir:** `mede-contador.mjs` no original lê partida e chegada.

---

## 4 · Caixas colapsadas e propriedades perdidas

### 🚨 A cadeia de alturas congeladas: cada conserto revela o próximo

- **Sintoma:** **todas as seções batem de altura e a página não bate**; ou o
  rodapé fica inalcançável (os links dele dão timeout de hover no Playwright
  porque ele não consegue rolar até lá, e a geometria não acusa nada, porque a
  caixa do rodapé está na posição certa); ou conteúdo que muda de tamanho
  (acordeão, cartões que pousam, lista filtrada) transborda ou deixa a página
  curta demais.
- **Causa:** a captura grava altura fixa em px (e às vezes em `rem`) na grade,
  na seção, no `<main>`, no embrulho da página e no wrapper raiz (com
  `overflow: clip`). É uma FILA de contêineres travados, um dentro do outro.
  Enquanto o conteúdo está errado do mesmo jeito que o contêiner, o número
  fecha; devolver altura a um elo (um `100vh`, um afim) é o que faz o conteúdo
  passar do que o elo de fora comporta, e só então o defeito seguinte aparece.
  Consertar o de fora primeiro também não resolve: `height: auto` no `<main>`
  reproduz a altura errada enquanto o de dentro continua curto.
- **Conserto:** liberar a cadeia (`height: auto`, linhas da grade pelo
  conteúdo) com os instrumentos `corrige-altura-congelada.mjs`,
  `corrige-altura-main.mjs` e `corrige-altura-raiz.mjs`. Elemento com `h-full`
  passa a ordem para o ancestral: corrigir a folha não adianta, e devolver
  `height: 100%` ao pai restaura a estrutura sem cravar pixel.
- **Conferir:**
  - medir de novo depois de CADA conserto, mesmo que pareça local;
  - a prova de `height: auto` é **conjunta** na cadeia inteira (soltar um nível
    por vez mede errado, porque o ancestral travado corta o resultado);
  - reconhecer `px` e `rem`, ou o instrumento passa direto dizendo "nada a
    fazer";
  - depois de devolver qualquer altura, remedir o `scrollHeight` contra o fundo
    real do conteúdo, e provar que o estado capturado continua idêntico.

### 🚨 Coluna flex com quebra e altura congelada joga o filho para o lado

- **Sintoma:** rótulo e valor que no original ficam empilhados aparecem lado a
  lado no clone, um deles dezenas de px à direita. A geometria acusa os textos,
  e nenhum deles é o culpado.
- **Causa:** o contêiner é `flex-direction: column` **com `flex-wrap: wrap`** e
  altura fixa. Uma fração de px a mais no conteúdo (um line-height arredondado,
  uma altura congelada um fio menor) estoura a altura, o wrap dispara e o
  segundo bloco quebra para uma nova coluna:

  ```
  original   21.8 + 12 (gap) + 22.8 = 56.6  → cabe → EMPILHA
  clone      22.0 + 12 (gap) + 22.8 = 56.8  → NÃO cabe → WRAP
  ```

- **Conserto:** tirar a altura congelada da coluna, ou devolver o line-height
  exato (`corrige-line-height.mjs`, seção 5).
- **Conferir:** `scripts/sonda-coluna-quebrada.mjs` (coluna com filho fora do
  eixo do primeiro, só no clone), nas larguras do projeto. Achar à mão pede
  descer a árvore e somar as alturas dos filhos contra a do pai.

### 🚨 A captura COLAPSA um slot para 0×0 e tira o conteúdo dele do fluxo

- **Sintoma:** em cards repetidos, vários elementos com **exatamente o mesmo
  `dx`** (ou `dy`), `dw` zero (mudaram de lugar, não de tamanho), deslocados pela
  largura de um irmão que mede **0×0** no clone. O título começa debaixo da
  própria miniatura; ou, num flex `justify-content: center` de altura fixa, o
  ícone desce e o texto sobe, e a geometria acusa o texto perfeito.
- **Causa:** o slot da miniatura ou do ícone vira 0×0 (`basis-full` sem largura,
  `aspect-square` sobre zero, ou o wrapper interno sem tamanho) e o conteúdo
  passa a ser pintado por cima com `position: absolute`. A linha perde quem a
  sustentava. Um defeito desses, repetido em todos os cards de todas as rotas de
  um tipo, pode responder pela maior parte dos elementos fora do lugar do site.
- **Conserto:** devolver a ESTRUTURA, não compensar o sintoma: tamanho no slot
  (`width/height` do original, ou `min-width/min-height` no seletor do slot com
  imagem). ⚠️ O corretor por cópia de propriedade **não acha isto**: do lado do
  original, o `padding-left` da coluna de texto é igual ao do clone; não há
  valor divergente para copiar, há diferença de estrutura, e a correção se
  sintetiza a partir da medição.
- **Conferir:** entre dois consertos que fecham o número, ganha o que devolve a
  estrutura. `margin-left` na coluna de texto pode dar contagem MENOR e deixar a
  imagem desalinhada do texto dentro de cada card, visível; o tamanho no slot
  deixa o card internamente certo. Contagem de fora do lugar é bom termômetro e
  péssimo juiz. ⚠️ `:has(> img)` é filho direto: se a imagem está dois níveis
  abaixo, a regra está no build, o instrumento confirma presença, e ela é
  inerte. Conferir que o seletor CASA.

### O alinhamento do contêiner reparte a folga

- **Sintoma:** depois de devolver a estrutura, sobra um deslocamento
  **uniforme** de metade de uma folga na lista inteira; ou desvios de mesmo
  módulo e sinais opostos (texto +N, imagem −N) dentro de um contêiner
  `justify-between`.
- **Causa:** a captura escreveu `justify-content: center` onde o original
  alinha ao topo (a folga vira metade em cima, metade embaixo); ou
  `align-items: center` no pai encolhe uma `section` ou um `div` que no original
  ocupa a largura toda, e o `justify-between` reparte a diferença nos dois lados.
- **Conserto:** devolver o alinhamento do original, ou `width: 100%` no elemento
  encolhido (`corrige-largura-secao.mjs` para `section`; a mesma regra vale para
  `div`, provada no navegador antes de escrever).
- **Conferir:** a aritmética da caixa aponta o suspeito: contêiner menos
  conteúdo, dividido por dois. O culpado não está entre os acusados. ⚠️ Nenhum
  corretor por cópia de valor acha isso, porque `justify-content` é palavra-chave:
  não há delta numérico.

### 🚨 Caixa que nasce em ZERO porque o conteúdo é absoluto

- **Sintoma:** logo, imagem ou assinatura some sem deixar buraco óbvio: fica um
  risco de poucos px, a geometria acusa o vizinho errado ou reporta o elemento
  como "só no original".
- **Causa:** o ditto emite invólucro que declara só proporção
  (`aspect-[3.39583/1]`) ou só altura (`h-5 block relative`), cujo único filho é
  `absolute`. Filho absoluto não empurra caixa: o invólucro fica com
  `width: 0px`, a imagem dentro é `w-full`, e some.
- **Conserto:** `corrige-caixa-colapsada.mjs`. O número vem, sem consultar o
  original, da proporção que a própria imagem declara mais a altura que o
  invólucro já tem (`aspect-[auto_140/20]` com altura 20 dá 140).
  - ⚠️ **Proporção é do RECORTE, não da caixa:** quando a largura que ela dá
    quase preenche o pai (menos de 3% de diferença), a caixa foi feita para
    preencher, e a regra é `w-full`; escrever o número deixaria uma faixa de
    fundo aparecendo num `object-cover`.
  - ⚠️ **Colapso circular:** invólucro com `basis-full` dentro de um pai que
    encolhe para o conteúdo fica em zero com o pai, cada um esperando a medida
    do outro. Quem quebra o círculo é o elemento **mais interno que não é
    absoluto** e tem altura própria. Elemento `absolute` com `left` e `right`
    definidos fica de fora: a largura dele vem do ancestral posicionado.
- **Conferir:** contar caixas de largura zero com imagem dentro, nos dois lados.

### O ditto perde a LARGURA de elemento decorativo vazio

- **Sintoma:** um crachá ou botão alguns px mais estreito, e a acusação cai no
  PAI.
- **Causa:** elemento sem texto e sem filhos (um pontinho, uma barra) tem
  `width` e `height` no original; o ditto emite só a altura, e sem conteúdo a
  caixa colapsa.
- **Conserto:** `corrige-caixa-vazia.mjs`, que casa elemento sem texto pelo
  ANCESTRAL com texto mais próximo e só usa índice de filho DENTRO de um par já
  casado. ⚠️ Escrever o valor DECLARADO, não o renderizado: um pontinho que
  pulsa com `transform: scale` mede menos que a largura real.
- **Conferir:** a largura computada (não a caixa) bate com o original.

### Botão de menu (hambúrguer) com `width: 0`

- **Sintoma:** as três linhas do hambúrguer existem, com cor e tamanho certos, e
  não aparecem; a sonda que só olha se o elemento está no DOM aprova.
- **Causa:** o `<button>` saiu da captura com `width: 0` e as linhas
  (`position: absolute`) ficam ancoradas numa caixa de largura zero.
- **Conserto:** largura medida no original, com seletor **estável entre
  rotas** no CSS global (`name`, `aria-label`, `data-framer-name`), porque o
  `data-cid` reinicia por rota e regra por cid precisaria de uma cópia por rota.
- **Conferir:** recorte do controle lado a lado com o original.

### 🚨 O ditto DESTRÓI toda propriedade CSS customizada do estilo inline

- **Sintoma:** um título enorme renderiza com 12px; não aparece em contagem de
  rota, metadata nem altura de página (o pai tem altura fixa), e aparece no olho
  na hora. Não é caso de borda: atinge elementos em todas as rotas.
- **Causa:** ao converter HTML em JSX, o ditto camelCasa a chave do estilo e
  **come um dos hífens**:

  ```
  original:  style="--framer-font-size: 296.14px"
  clone:     style={{ "-FramerFontSize": "296.14px" }}
  ```

  `-FramerFontSize` não é propriedade CSS nem customizada (essa precisa de dois
  hífens), e o navegador descarta a declaração, calado.
- **Conserto:** `corrige-variaveis-css.mjs`, em duas camadas: devolve a variável
  (`--framer-font-size`) **e** escreve a propriedade real (`fontSize`). Só a
  variável restaura um valor que ninguém lê, porque a regra que a consumia
  morava na folha do construtor, que a captura não trouxe.
- **Conferir:** zero chaves `"-[A-Z]` no estilo inline do JSX.

### A família que nenhum gate pega: propriedades de COMPOSIÇÃO

O ditto materializa quase todo o estilo computado e some com as propriedades
que dizem **como combinar** ou **como distribuir**. A caixa fica igual, o texto
igual, a cor igual, e o resultado errado. `corrige-propriedade-perdida.mjs`
trata a família; os casos medidos:

- **`paint-order`.** *Sintoma:* texto com `-webkit-text-stroke` ilegível, com o
  contorno comendo o interior das letras. *Causa:* o original usa
  `paint-order: stroke` (contorno primeiro, preenchimento por cima) e o clone
  fica no `normal`. *Conserto:* `corrige-paint-order.mjs`. Em alvo Tailwind o
  contorno chega como classe arbitrária no JSX
  (`[-webkit-text-stroke:1.3px_var(--color-022)]`) e zero vezes nos `.css`, então
  varrer folha por folha conclui que não há nada a fazer; o conserto é por
  seletor de atributo, porque a classe carrega o nome da propriedade:
  `[class*="-webkit-text-stroke"] { paint-order: stroke }`. *Conferir:* contar
  elementos com contorno e com `paint-order: stroke` nos dois lados.
- **`mask-composite`.** *Sintoma:* uma grade decorativa cobre o topo do herói
  que no original é liso. *Causa:* o original usa `intersect` (a camada de
  desvanecimento recorta as outras) e o clone `add` (somam, e a opaca vence).
  🚨 É **seletivo por rota**: medir só a home conclui "sem defeito".
  *Conserto:* `corrige-mask-composite.mjs`. *Conferir:* contar os valores por
  rota nos dois lados.
- **`column-count`.** *Sintoma:* altura de página divergindo em centenas de px,
  com herói e início do rodapé no mesmo `y` e o rodapé com a mesma altura nos
  dois lados. *Causa:* as colunas do rodapé são 4 no original e `auto` no clone,
  e empilham. *Conserto:* devolver o valor. *Conferir:* largura das colunas do
  rodapé.
- **Padding lateral duplicado no celular.** *Sintoma:* a 375px os blocos de
  texto ficam 48px mais estreitos e o `<h1>` quebra numa linha a mais. *Causa:*
  `px-6` materializado no contêiner da página E no filho que já o tinha.
  *Conserto:* tirar a duplicata. *Conferir:* só aparece medindo no celular; a
  1280px não existe.

**A regra que essas impõem:** a conferência visual pareada é GATE, não enfeite
(seção 11), e Δaltura de página é o farol barato: quando divergir, caçar o
excesso por âncoras (topo, meio, rodapé) antes de qualquer outra coisa.

### O ditto perde `font-variant-numeric`, e número tabular vira proporcional

- **Sintoma:** um número estreito demais e o vizinho (o "+" ao lado)
  deslocado exatamente a mesma distância.
- **Causa:** com `tabular-nums` todo dígito tem a mesma largura; sem a
  propriedade, a largura depende de quais dígitos são.
- **Conserto:** devolver a propriedade **só onde o original declara**. Há motivo
  funcional além da fidelidade: número que anima precisa de dígito de largura
  fixa, senão a caixa pula a cada quadro da contagem.
- **Conferir:** `getComputedStyle(el).fontVariantNumeric` nos dois lados.

### `0.xxx` vira `1.xxx` no `<style>` inline

- **Sintoma:** anéis ou camadas de um SVG que no original são translúcidos e
  pulsam aparecem sólidos e parados, sem erro no build.
- **Causa:** erro de conversão: `opacity: 0.11` vira `opacity:1.11`, e opacidade
  maior que 1 é limitada a 1.
- **Conserto:** devolver o valor do original.
- **Conferir:** varrer sempre `opacity:1.[0-9]` depois de clonar; valor maior que
  1 em opacidade é defeito de conversão, nunca intenção.

### `\n` literal dentro do `d=` do SVG: o caminho não desenha

- **Sintoma:** o `<svg>` ocupa o espaço certo e o desenho não aparece; o console
  mostra `Error: <path> attribute d: Expected path command, "…138\n…"`.
  Nenhuma medição de DOM acusa.
- **Causa:** o ditto preserva a quebra de linha do HTML de origem como a
  sequência LITERAL `\` + `n` na string JSX. Em SVG, quebra real é separador
  válido; `\n` não é, e o parser aborta.
- **Conserto:** `corrige-svg-path.mjs`.
- **Conferir:** zero erros de `<path>` no console. **Ler o console do navegador é
  gate barato**, e pega o que medição de DOM não pega.

### `clip-path` com data URI truncada

- **Sintoma:** `ERR_INVALID_URL` no console por `clipPath: url("data:image/gif")`.
- **Causa:** a captura cortou a data URI no meio. No original o elemento tem
  outro clip (ex.: `inset(50%)`); o truncado é lixo da conversão.
- **Conserto:** remover; o visual não muda (URL inválida não aplica clip).
- **Conferir:** varrer `data:image/[a-z]*"` sem `;base64,` depois de clonar.

### 🚨 Ícone via `<use href="#id">` referenciando símbolo que não veio

- **Sintoma:** setas de botão, checks e outros ícones renderizam VAZIOS. O
  `<use>` ocupa a caixa certa, com opacity 1, visível e na posição do original:
  nenhuma medição de rota, metadata, conteúdo ou geometria acusa.
- **Causa:** o Framer desenha ícones como `<svg><use href="#id"></svg>` e injeta
  por JS um sprite oculto no `<body>` com os `<svg id>` de verdade. A captura
  traz os `<use>` e não o sprite: o id fica órfão. Variante: o sprite vem, mas os
  `<svg>` do símbolo trazem a classe `w-0 h-0` do Tailwind, e a cópia que o
  `<use>` faz herda o CSS do símbolo; a régua de órfãos dá zero e o ícone não
  aparece.
- **Conserto:** `recupera-simbolos-svg.mjs` copia cada `<svg id>` do original para
  um sprite oculto único no `layout.tsx` (os ids são os mesmos em todas as
  rotas), com os símbolos SEM classe, dentro do `<div>` com o estilo inline do
  original. O stroke usa `var(--x, rgb(0,0,0))`, então desenha sem as variáveis
  do Framer.
- **Conferir:** contar `<use>` órfãos (`!document.getElementById(id)`) **e**
  olhar o recorte de cada tipo de controle (botão primário, botão de menu, card)
  lado a lado. 🚨 A régua de "idêntico" tem um teto que a geometria não vê: o
  CONTEÚDO do ícone.

### ⚠️ Ícone que troca de DESENHO na variante

- **Sintoma:** no hover, o ícone do original muda (envelope que abre, calendário
  que ganha o visto) e o do clone não; a caixa é a mesma, nenhuma régua de caixa
  vê.
- **Causa:** muda o `d` do `<path>`.
- **Conserto:** os dois desenhos no SVG, alternados pela classe do estado
  (`display`), em vez da propriedade CSS `d`, que nem todo navegador suporta.
- **Conferir:** recorte do ícone nos dois estados, nos dois lados.

### Largura de item copiada do molde: o vizinho paga

- **Sintoma:** depois de reconstruir itens de um trilho a partir de um molde, o
  avatar (ou outro vizinho) anda meia diferença para o lado.
- **Causa:** as larguras FIXAS do molde são do item que a captura pegou; no
  original cada item é dimensionado pelo conteúdo.
- **Conserto:** medir a caixa de CADA descendente do item no original, em ordem
  de documento, e reescrever as classes de largura e altura por índice, com
  guarda de contagem (casar por índice quando as estruturas diferem é pior que
  não mexer). É o que o `reconstroi-trilho.mjs` faz.
- **Conferir:** geometria dos itens reconstruídos.

---

## 5 · Tipografia

### O ditto ARREDONDA todo tamanho de fonte fracionário

- **Sintoma:** vários elementos com o MESMO `dy` rígido e `dx=0`, logo abaixo de
  um elemento com `dh` positivo do mesmo tamanho. O culpado aparece na lista com
  `dy=0` e `dh>0`; os acusados estão certos.
- **Causa:** site com escala de tipo **fluida** (`clamp()`, `vw`) computa
  `font-size` fracionário, e o ditto arredonda para o inteiro acima, levando o
  `line-height` junto (15.5→16, 20.48→21, 25.575→26). Meio pixel muda o ponto de
  quebra: um parágrafo ganha uma linha e empurra tudo abaixo. A classe aparece
  em site de tipo fluido e não em site de tipo fixo: é exemplo de defeito que
  muda com a origem.
- **Conserto:** `mede-tipografia.mjs` e `corrige-tipografia.mjs` (ou
  `aplica-tipografia-classe.mjs`, quando o elemento já tem classe do Tailwind
  para a propriedade: seção 6).
- **O controle que autoriza escrever:** px fixo onde o original é fluido é
  inventar número. Antes de cada regra o instrumento confirma que o valor do
  original é o MESMO em várias larguras, ou seja, que a escala **trava** naquela
  faixa. Se de 768 para cima a escala ainda varia, a faixa certa é
  `min-width: 1280px`, não `768px`; e a classe vai com o prefixo da faixa medida
  (`xl:`, não o `lg:` de hábito), senão escreve valor errado entre 1024 e 1280.
  **Quem não trava sai declarado ("ainda fluida") e não é escrito.**
- **Conferir:** remedir a geometria da rota depois do build.

### 🚨 O ditto congela LINE-HEIGHT SEM UNIDADE em px arredondado

- **Sintoma:** deriva **crescente** ao longo de um texto longo (poucos px no
  começo de um artigo, mais no fim; dezenas num FAQ), e o `corrige-tipografia`
  recusa a maioria dos elementos dizendo "ainda fluida: valor fixo seria chute".
- **Causa:** o original define `line-height` como razão; o navegador resolve
  razão × font-size em cada largura, e o ditto grava o valor resolvido,
  arredondado:

  ```
  largura   font-size   original (1.4)   clone
    1280       36          50.4px        50px
    1440       32          44.8px        50px
     375       28          39.2px        39px
  ```

  A recusa está certa, e a leitura errada seria a do operador: ela não
  significa "não tem conserto", significa que a resposta não é um VALOR, é uma
  RAZÃO.
- **Conserto:** `corrige-line-height-razao.mjs`, que escreve a razão sem `@media`
  de propósito (razão vale em qualquer largura; px por faixa acertaria só nos
  pontos medidos). Elementos gêmeos por breakpoint com o mesmo texto se agrupam
  por chave, e a regra se escreve quando TODOS os candidatos do original
  concordam (ver "Gêmeo por breakpoint", seção 11).
- **Conferir:** a razão lh/fs do original é constante em todas as larguras
  (costuma ser número de design system: 1.2, 1.25, 1.4, 1.5); depois do
  conserto, a deriva some ao longo do texto.

### 0,2px de line-height viram 18px na tela

- **Sintoma:** label e valor lado a lado em vez de empilhados, alguns px a
  dezenas de px fora do lugar, com font-size idêntico nos dois lados.
- **Causa:** o line-height saiu arredondado (`21.76px` → `22px`) mesmo com o
  font-size batendo; dentro de uma coluna flex com wrap e altura fixa, a fração
  dispara o wrap (ver "Coluna flex com quebra", seção 4).
- **Conserto:** `corrige-line-height.mjs` mede o line-height computado dos dois
  lados por casamento de texto e devolve o do original, em **razão sem unidade**
  quando o font-size coincide, para a regra sobreviver a mudança de tamanho.
- **Conferir:** 🚨 fração perdida não é ruído: é bomba-relógio de layout. Ela só
  cobra onde cruza um limite (um wrap, uma quebra de linha, um `max-height`), e
  aí o efeito é dezenas de vezes maior que a causa. A régua é "diferença
  NENHUMA", não "diferença visível".

### 0,08px de fonte mudam a contagem de LINHAS

- **Sintoma:** parágrafo com a mesma largura e o mesmo texto, e `dh` de uma
  linha inteira.
- **Causa:** fonte um fio maior no original (18,08px contra 18px) quebra o texto
  numa linha a mais.
- **Conserto:** `mede-tipografia` e `aplica-tipografia-classe`.
- **Conferir:** contagem de linhas do parágrafo nos dois lados.

### ⚠️ Corrigir tipografia em TODA rota regride o texto longo

- **Sintoma:** a camada de tipografia aplicada em todas as rotas conserta as
  rotas que o gate acusava e quebra as que estavam em zero (blogs, artigos).
- **Causa:** o arredondamento afeta o site inteiro, mas só bate no gate onde o
  texto é longo e acumula; o line-height corrigido muda o ponto de quebra de
  linha do texto longo e desloca as seções seguintes.
- **Conserto:** aplicar a tipografia SÓ nas rotas onde o gate acusa. "Camada que
  piora sai" vale mesmo quando a camada está "correta".
- **Conferir:** total de fora do lugar antes e depois, por rota.

### No celular, a escala do Framer é fluida

- **Sintoma:** `aplica-tipografia-classe` com valor fixo em `max-md:` não fecha
  o celular.
- **Causa:** a escala tipográfica do Framer é fluida no celular (o valor muda
  entre 375 e 414); valor fixo é chute fora da largura medida.
- **Conserto:** respeitar o aviso "ainda FLUIDA" do `mede-tipografia`; a
  divergência do celular costuma ser estrutural (seção 11, "O clone fecha numa
  largura só").
- **Conferir:** o valor do original em 375 e em 414.

---
## 6 · Cascata e entrega do CSS

### 🚨 Regra que DISPUTA com utilitária do Tailwind não entra na cascata

- **Sintoma:** a regra gerada está no bundle (ou no `<style>` inline), com
  `!important`; a `@media` casa (`matchMedia` dá true); a folha está viva e
  parseada (a regra aparece em `sheet.cssRules`); o seletor casa
  (`el.matches(...)` dá true); e o valor computado continua o do clone. Às vezes
  de forma que parece não determinística: a mesma regra aplica numa rota e não
  na outra, ou aplica em parte dos hovers.
- **Causa:** o que decide não é a entrega, é se a propriedade **disputa com uma
  classe do Tailwind** que o elemento já tem. O `CSS.getMatchedStylesForNode` do
  CDP lista, para aquela propriedade, só a utilitária dentro de
  `@layer utilities`; a regra gerada nem aparece entre as casadas. A disputa é
  **por elemento, não por folha**: numa mesma regra que lista vários cids, quem
  tem a utilitária (ex.: `leading-[1.625rem]`) no `className` perde e quem não
  tem ganha. Tirar a classe do elemento faz o valor cair para o herdado, nunca
  para o da regra; o mesmo texto CSS injetado num `<style>` em tempo de execução
  aplica na hora. Descartados por medição: meta viewport, build velho, folha
  desabilitada e aninhamento de `@media`.
- **Contraste que fecha o diagnóstico:** regra para propriedade que o elemento
  NÃO tem (uma largura que faltava, sem `!important`) aplica de primeira, na
  mesma entrega. Quem perde é só quem tenta sobrescrever uma classe que já está
  lá.
- **Conserto: entregar como CLASSE, não como regra.** O clone já é Tailwind:
  a altura medida vira `lg:h-[96vh]` no `className` do próprio elemento, nasce
  dentro de `@layer utilities`, na mesma disputa, e a variante mais específica
  ganha (`aplica-altura-classe.mjs`, que lê o `viewport.css` do
  `corrige-viewport`; `aplica-tipografia-classe.mjs` para tipografia). A classe
  antiga **não se remove**: ela continua valendo abaixo da faixa, onde a captura
  do celular já estava certa. Dobrar o seletor (`[data-cid][data-cid]`), subir
  especificidade ou empilhar `!important` não resolve.
- **Conferir:** antes de escrever regra CSS para uma propriedade, perguntar se
  o elemento já tem classe do Tailwind para ela. Se tiver, a entrega é por
  classe; se não, o CSS gerado funciona, pelo caminho que a medição aprovar,
  import (`liga-css`) ou inline (`entrega-inline`), remedindo depois do build.

### 🚨 O caminho de entrega MUDA O RESULTADO

- **Sintoma:** a mesma regra de geometria mede diferente entregue por `import` e
  entregue inline; ou uma folha importada inteira não aplica no celular.
- **Causa:** cada caminho entra na cascata de um jeito (ver a entrada acima), e
  uma folha importada que perde a disputa fica inerte sem erro.
- **Conserto:** `entrega-inline.mjs` põe cada folha gerada num `<style>` dentro
  do `layout.tsx` da rota, e o caminho se escolhe por camada, medindo. Não há
  caminho universalmente melhor: há o que a medição aprovar.
- **Conferir:** ⚠️ com uma camada inerte, o instrumento que a escreve pode
  registrar "melhora" que não existe. Sempre confirmar que a camada APLICOU (o
  `confere-entrada.mjs` faz isso para animação; para o resto, remedir depois do
  build).

### ⚠️ Escrever o CSS não o LIGA

- **Sintoma:** a camada some sem erro em lugar nenhum.
- **Causa:** o Next só inclui no bundle da rota o que a `page.tsx` **daquela
  rota** importa. Arquivo solto na pasta não entra.
- **Conserto:** `liga-css.mjs` importa a folha na `page.tsx` e cria um arquivo
  vazio (com um comentário dizendo por quê) quando ela falta: import de arquivo
  ausente derruba o build inteiro.
- **Conferir:** a regra aparece no CSS servido da rota.

### 🚨 `data-cid` COLIDE entre rotas: CSS gerado tem que ser escopado

- **Sintoma:** a animação (ou a correção) da home aparece em outras rotas,
  aplicada a elementos que não têm nada a ver; ou, na navegação sem recarregar,
  o título da página de chegada fica invisível, a entrelinha errada, os cartões
  fora, e a régua de navegação passa porque só confere que a troca foi pelo
  cliente.
- **Causa:** o contador do gerador reinicia a cada rota: `data-cid="n61"` existe
  em todas as páginas. Uma folha ligada no `layout.tsx` raiz vale em todas. E o
  escopo pelo import só vale na carga direta: na navegação pelo cliente, o Next
  **mantém as folhas da página anterior**, e as regras dela acertam os `n…` da
  página nova.
- **Conserto:** o escopo vem de ONDE o CSS é importado, não do seletor: gravar a
  folha na pasta da rota e importá-la na `page.tsx` dela (o mesmo padrão do
  `ditto.css`); o Next gera um bundle de CSS por rota e a regra da home não
  alcança as outras. Para a navegação: mapa "rota → folhas" gerado depois do
  build (lendo o `<link rel="stylesheet">` de cada HTML do `out/`) e, num
  `useLayoutEffect` do pathname, só as folhas da rota nova ligadas
  (`link.disabled`).
- **Conferir:** rota sem animação mede zero animações e a home mantém as suas;
  o `confere-entrada.mjs` acusa cid com mais de uma ocorrência na mesma rota.
  Para a navegação, clicar de uma página para outra e comparar cada texto da
  chegada (caixa e opacidade) com a mesma página aberta direto. Seletor gerado
  tem que ser provado único no escopo onde é aplicado, nunca presumido.

### 🚨 `<style>` no layout de uma rota-PAI vaza para todas as rotas-filhas

- **Sintoma:** dois elementos com valores TROCADOS entre si (`dh=-9` num cid e
  `dh=+9` no outro) em todas as rotas filhas, com os arquivos fonte das duas
  rotas certos.
- **Causa:** o App Router aninha layouts (`app/layout` → `app/projetos/layout` →
  `app/projetos/x/layout` → `page`), e o `<style>` do layout do pai vale dentro do
  filho, onde o mesmo cid é outro elemento.
- **Conserto:** correção que pode ir por CLASSE vai por classe, porque a classe
  mora no elemento e não vaza (tirar a folha de tipografia do `FOLHAS=` do
  `entrega-inline` quando ela já vai por `aplica-tipografia-classe`). ⚠️ Rota-pai
  com folha que não pode virar classe continua sendo risco: ou o CSS dela desce
  para as filhas, ou ela só vale por import.
- **Conferir:** valor de A aparecendo em B e o de B em A é a assinatura de
  colisão de cid, não de tipografia errada. Comentário por regra no CSS gerado
  (o texto do elemento) faz a troca saltar aos olhos.

### 🚨 A home não tem layout próprio: o grupo `(inicio)`

- **Sintoma:** a home fica de fora da entrega inline; ou uma correção da home
  parece feita e não chega à tela.
- **Causa:** `src/app/layout.tsx` é o layout RAIZ e vale para todas as rotas;
  embutir o CSS da home ali vazaria para as outras (e o cid colide). A saída é o
  grupo de rotas `src/app/(inicio)/`, que serve `/` sem mudar a URL e aceita um
  `layout.tsx` só dele. Mas aí todo instrumento que escreve folha por rota e não
  sabe do grupo grava em `src/app/<folha>.css`: recria o arquivo, ninguém o
  importa, e a correção parece feita.
- **Conserto:** o `entrega-inline.mjs` cria o grupo e move a `page.tsx` e as
  folhas da home uma vez só. **Todo instrumento que escreve ou lê folha por rota
  procura o grupo PRIMEIRO** (`gera-entrada`, `gera-marquee`,
  `aplica-altura-classe` e os outros).
- **Conferir:** nenhum `src/app/*.css` órfão fora do grupo depois da rodada.

### 🚨 O minificador do Next INVALIDA `linear()` e mata a animação calado

- **Sintoma:** parte dos elementos animados não anima;
  `getComputedStyle(el).animationName` dá `none`. Build em exit 0, sem aviso, sem
  erro de console.
- **Causa:** molas do Framer chegam pré-amostradas como `linear()` de dezenas de
  pontos. O minificador corta o `%` do primeiro stop
  (`linear(0 0%, ...)` vira `linear(0 0,...)`), `0 0` não é posição válida, e o
  navegador descarta a declaração `animation` inteira. Só aparece quando o CSS
  sai de `public/` (copiado verbatim) para dentro do pipeline do Next: mudar de
  onde o CSS é servido muda quem o processa.
- **Conserto:** escrever o primeiro stop **sem posição** (o padrão já é 0%):

  ```css
  linear(0, 0.0063 1.26%, ...)     /* sobrevive ao minificador */
  ```

- **Conferir:** `confere-entrada.mjs` é obrigatório: compara o que o CSS fonte
  promete com o que o navegador entrega no build e reprova regra que não aplicou.

### 🚨 Regra gerada sem `@media` quebra o celular sem aparecer em medição nenhuma

- **Sintoma:** clone idêntico no desktop e quebrado no telefone.
- **Causa:** `width: 549.953px` medido a 1280px e escrito solto vale também a
  375px. Não aparece em nenhuma medição feita numa largura só.
- **Conserto:** toda regra gerada sai dentro da faixa em que foi medida, nas
  bordas que o ditto usa (md=768, lg=1024), e o arquivo se costura por
  marcadores para a passada do celular não apagar a do desktop:

  ```css
  /* @ditto-scroll-inicio faixa=(min-width: 1024px) */
  @media (min-width: 1024px) { /* o que foi medido a 1280 */ }
  /* @ditto-scroll-fim faixa=(min-width: 1024px) */
  ```

  ⚠️ `:hover` pede `(hover: hover) and (pointer: fine)`, senão o estado gruda no
  primeiro toque. E o hover **não leva faixa de largura**: quem decide é o
  ponteiro. Preso a `(min-width: 992px)`, o clone fica sem hover no tablet e no
  celular com mouse (o `gera-interacao` não põe a faixa por padrão). Marcador de
  alvo de runtime (`--ditto-contador: 1` e afins) também fica **fora** de
  `@media`: não é regra visual de uma largura.
- **Conferir:** medir nas três larguras (seção 11, "O clone fecha numa largura
  só").

### ⚠️ Duas camadas escrevendo a MESMA propriedade brigam em silêncio

- **Sintoma:** o resultado de uma camada muda conforme a ordem de import.
- **Causa:** `entrada.css` e `scroll.css` escrevem `opacity` e `transform`; no
  mesmo elemento, quem ganha depende da ordem, que é acaso.
- **Conserto:** divisão de território: a entrada cuida do que anima ao
  **carregar**; a revelação por scroll, do que anima ao **aparecer na tela**. O
  `gera-entrada.mjs` lê o `scroll.css` da rota e cede os cids que ele já
  reivindicou.
- **Conferir:** nenhum cid com regra nas duas folhas.

### 🚨 Duas camadas fazendo a MESMA troca somam

- **Sintoma:** um elemento anda o dobro no hover (a seta desliza 32px onde o
  original desliza 16).
- **Causa:** uma folha tirada do código do componente já fazia a troca, e o
  gerador de variante mediu a mesma troca como mudança de posição.
- **Conserto:** antes de gravar uma camada nova, procurar regra do mesmo nó nas
  outras (`grep 'nNNN"'`).
- **Conferir:** a amplitude da troca nos dois lados.

### 🚨 A sombra do Tailwind tem quatro camadas na frente, e o estado com outra lista salta

- **Sintoma:** a sombra de um botão some no primeiro quadro do hover em vez de
  desvanecer, e a varredura de hover (estado final) passa.
- **Causa:** `shadow-[…]` compõe a lista com quatro camadas transparentes (anel e
  sombra interna do Tailwind) antes da sua. A regra de `:hover` escrevia a lista
  do original, sem elas; o navegador casa as camadas pela posição e, com `inset`
  de um lado e não do outro, não interpola.
- **Conserto:** as mesmas quatro camadas `rgba(0,0,0,0) 0 0 0 0` na frente de
  toda regra de estado desse elemento. E a curva medida pode trazer o ATRASO
  variável do original gravado: ajustar duração e curva e começar na hora.
- **Conferir:** série quadro a quadro da sombra nos dois lados.

### 🚨 Classe de estado no `<body>` revisa o estilo da página inteira

- **Sintoma:** engasgo de vários quadros justo quando o cabeçalho começa a
  recolher.
- **Causa:** regras como `body.ditto-nav-recolhida [data-cid="n6"]` fazem o
  Chromium revisar TODO elemento com `data-cid` quando a classe do `<body>` muda
  (a invalidação guarda o nome do atributo, não o valor). Mover a regra para o
  contêiner não basta se a classe de mesmo nome continuar no `<body>`: a regra
  `.X [data-cid]` vale para qualquer ancestral.
- **Conserto:** a classe só no contêiner ou no próprio elemento, e no `<body>` um
  ATRIBUTO sem regra, para quem lê.
- **Conferir:** alternar a classe 20 vezes com `offsetWidth` no meio, contra uma
  classe de controle, e comparar o tempo.

### 🚨 CSS Nesting quebra todo varredor de CSSOM que não o conhece

- **Sintoma:** o instrumento diz "0 regras casam" numa página cheia delas, e a
  célula vazia parece aprovação; o diagnóstico aponta "a folha não carregou",
  que é falso.
- **Causa:** um varredor que faz `if (regra.cssRules) { descer(); continue; }`
  para separar `@media` de regra comum pula TODAS as regras comuns: com CSS
  Nesting, `CSSStyleRule` também expõe `.cssRules` (lista vazia, que é truthy).
- **Conserto:** grupo se reconhece pela AUSÊNCIA de `selectorText`:

  ```js
  if (!rr.selectorText) { if (rr.cssRules) descer(rr.cssRules); continue; }
  ```

- **Conferir:** o varredor acha uma regra plantada de propósito.

### Seletor de atributo: o arquivo vem SEM aspas, o CSSOM devolve COM

- **Sintoma:** a regra "não foi gerada", procurando de um jeito, e "não existe",
  procurando de outro, com ela presente o tempo todo.
- **Causa:** o minificador serve `[data-cid=n77]`; o CSSOM reserializa como
  `[data-cid="n77"]`.
- **Conserto:** para "esta regra casa com este elemento?", não comparar texto de
  seletor: perguntar ao navegador com `el.matches(regra.selectorText)`.
- **Conferir:** o mesmo teste nos dois formatos dá o mesmo resultado.

### Especificidade tem que EMPATAR entre instrumentos

- **Sintoma:** a regra de um instrumento novo perde em silêncio para a de outro.
- **Causa:** o `corrige-tipografia.mjs` escreve com `[data-cid=X][data-cid]`; um
  seletor simples com `!important` perde para ele.
- **Conserto:** usar a mesma forma de seletor da camada com quem se divide a
  propriedade.
- **Conferir:** o valor computado depois do build.

### Crase dentro de template literal derruba o build

- **Sintoma:** build em exit 1 depois de gerar `<style>{`...`}</style>`.
- **Causa:** comentário CSS com `palavra` entre crases fecha a string e quebra o
  JSX.
- **Conserto:** sem crase em comentário de CSS embutido em JSX.
- **Conferir:** o build.

---

## 7 · Interação: clique, hover e estados

### 🚨 O `::after` decorativo do ditto ENGOLE todo clique da seção

- **Sintoma:** a página parece perfeita e **nada responde ao mouse**: hover e
  clique não fazem nada, o FAQ não abre, e o Playwright trava em timeout. O
  screenshot fica perfeito, a geometria bate, o conteúdo bate.
- **Causa:** o ditto gera pseudo-elementos decorativos em `section`, `nav` e
  afins (`after:content-[''] after:block after:absolute after:inset-0`), e
  pseudo-elemento participa do hit-testing: ele cobre a seção e intercepta o
  ponteiro. O log do Playwright diz `<section ...> intercepts pointer events`.
- **Conserto:** `scripts/corrige-interacao.mjs`; não muda nada visualmente:

  ```css
  [data-cid]::before,
  [data-cid]::after { pointer-events: none; }
  ```

- **Conferir:** só medir **interação com evento real** encontra
  (`mede-interacao.mjs`, nos dois lados).

### 🚨 O gerador marca link de navegação como `pointer-events: none`

- **Sintoma:** links da navegação mortos, que no original respondem a hover; o
  Playwright fica segundos em timeout e reporta "Timeout exceeded" quando a
  verdade é "este elemento nunca vai aceitar evento". `elementsFromPoint`
  ignora elemento com `pointer-events: none`, então quem aparece no topo é um
  ancestral vivo e o teste de contenção passa.
- **Causa:** a marca `pointer-events: none` vem no link ou num **ancestral**
  dele.
- **Conserto:** reativar só o que é interativo, com seletor no interativo, onde
  quer que esteja a marca (`pointer-events` herda, mas valor explícito no filho
  sobrepõe o do pai):

  ```css
  a[href], button, [role="button"] { pointer-events: auto; }
  ```

  Uma regra como `a.pointer-events-none{...}` não casa nada quando a classe está
  no `<p>` em volta. ⚠️ Não reativar em massa: container decorativo com
  `pointer-events-none` costuma estar assim de propósito.
- **Conferir:** olhar só o `getComputedStyle` do **próprio** elemento. Um
  detector que sobe a cadeia procurando `none` reprova o conserto correto, e
  instrumento que reprova conserto correto é tão caro quanto conserto que não
  funciona.

### ⚠️ Não confundir isso com camada de breakpoint duplicada

- **Hipótese medida como falsa:** um `<section>` de página inteira no topo da
  pilha sugere camadas de breakpoint duplicadas no DOM. Medidos os dois lados,
  a estrutura é idêntica e não há duplicata de posição: o `<section>` no topo é
  o hospedeiro do `::after` decorativo acima.

### Desbloquear interação demais é tão errado quanto de menos

- **Sintoma:** controles de um modal FECHADO respondem ao mouse no clone; no
  original estão mortos.
- **Causa:** a regra larga do `corrige-interacao.mjs` revive todo interativo.
- **Conserto:** `corrige-inercia.mjs` procura no original camada com
  `pointer-events: none` **e** `opacity: 0` (assinatura de camada fechada, não de
  decoração) que contenha interativo, e devolve a inércia ao clone.
- **Conferir:** alvos, cobertos e mortos iguais nos dois lados. Fidelidade não é
  "tudo clicável", é "clicável onde o original é"; nenhuma medição de geometria
  acusa, porque a caixa está no lugar.

### Gatilho de estado: `closest()` devolve o filho, não o container

- **Sintoma:** o menu nunca abre, sem erro, com o script carregado e `abrir()`
  funcionando quando chamado à mão.
- **Causa:** o gatilho é um `<div data-cid="n14">` com um `<button>` dentro; o
  clique cai no button, e `closest("a,button,…,[data-cid=n14]")` devolve o BUTTON
  (o mais próximo), cujo cid não está na lista. O gatilho também nem sempre é `<a>`
  ou `<button>`: pode ser um `div` mudo.
- **Conserto:** procurar CADA cid com `closest('[data-cid="x"]')` **antes** do
  casamento por texto; casa clique em qualquer descendente.
- **Conferir:** clique real em cada descendente do gatilho abre o estado.

### 🚨 No hover, `none` também é valor

- **Sintoma:** o link da página atual muda de cor no hover e **mantém o
  sublinhado** que no original some. A contagem de alvos com hover bate, porque
  a regra existe; falta uma declaração dentro dela.
- **Causa:** um gerador que descarta todo valor de hover igual a `none`. Para
  `transform`, `filter` e `box-shadow` a proteção faz sentido (escrever `none`
  apagaria a base que posiciona o elemento); para `text-decoration-line`, `none`
  **é** o estado de hover.
- **Conserto:** no instrumento, `none` se descarta em toda propriedade menos em
  `textDecorationLine`; regenerar o `hover.css` a partir da medição que já
  existe.
- **Conferir:** comparar, alvo por alvo, as PROPRIEDADES que mudam nos dois lados
  (não a contagem de alvos): a regra `text-decoration-line:none` aparece no mesmo
  número de links que a medição do original contou.

### 🚨 Hover "sem curva medida" sai instantâneo

- **Sintoma:** ícones sobem e links trocam de cor de uma vez, onde o original
  anima; a varredura de hover (estado final) passa. Variante: o original tem
  muitos alvos com hover e o clone reproduz poucos, nenhum com transição.
- **Causa:** o `mede-interacao` fotografa o repouso e o hover depois de um
  intervalo, e o `gera-interacao` escreve `:hover` sem `transition` quando não
  tem a curva (`sem curva medida`).
- **Conserto:** `mede-hover-curva.mjs` amostra a curva por rAF, com IDA
  (`pointerover`) e VOLTA (`pointerout`) separadas (têm durações e curvas
  diferentes), e declara o regime: `transicao`, `instantaneo` (≤2 quadros: o fiel
  é não escrever transition) ou `continuo` (laço, nunca vira transition). Ou ler
  a transição no código (`whileHover: {y: -5, transition: ...}`). A VOLTA, quando
  o elemento não tem transição própria, é a padrão do Framer: **mola 0,4s,
  rebote 0,2** (a padrão do Motion, 500/25, passa do ponto bem mais que o
  original). Componente repetido (o rodapé) leva a curva medida numa rota para as
  outras. Valor de hover capturado no meio da mola (−5,07 no lugar de −5) se
  escreve exato.
- **Conferir:** série quadro a quadro da ida e da volta nos dois lados (seção
  11, "Prova pelo ESTADO FINAL").

### 🚨 Um hover, várias transições: cada elemento anda pela do componente dono

- **Sintoma:** num cartão, a imagem amplia rápido demais no hover enquanto a
  seta parece certa.
- **Causa:** o hover do cartão move elementos de componentes diferentes (o
  cartão: tween com uma curva; o ícone: mola sem rebote), e uma mola só para o
  item todo erra os outros.
- **Conserto:** a transição de cada elemento é a do componente que o contém.
- **Conferir:** série de cada elemento do hover, separada.

### ⚠️ Hover que só existe numa variante

- **Sintoma:** cartões que voam reagem ao cursor no clone durante o voo; no
  original, só pousados.
- **Causa:** `enabledGestures: { <variante>: { hover: true } }` no código.
- **Conserto:** a marca do cursor e o hover ligados ao estado pousado.
- **Conferir:** hover durante e depois do voo, nos dois lados.

### 🚨 `getComputedStyle` de `right`/`top` num posicionado devolve o valor USADO

- **Sintoma:** uma barra que no hover devia encolher com o conteúdo fica na
  largura de repouso.
- **Causa:** o original tem `left: 50%` e `right: auto`; o instrumento leu
  `right: 397px` (o valor usado) e gravou como lei. Com `left` e `right` presos,
  `width: auto` não segue o conteúdo.
- **Conserto:** inset lido do computado em elemento posicionado não é
  declaração; conferir no CSS do original antes de virar regra.
- **Conferir:** a largura no hover acompanha o original.

### 🚨 Escrever a altura ABSOLUTA do original quebra o que a captura acertou

- **Sintoma:** depois de gerar o acordeão, os itens encolhem e o FAQ inteiro
  sobe.
- **Causa:** o original e o clone não têm a mesma altura para o item fechado
  (fonte, padding), e forçar a do original encolhe os itens que a captura tinha
  acertado.
- **Conserto:** o que o original tem de único e confiável é o **DELTA** entre os
  dois estados. A altura absoluta vem do clone, do estado que ele já tem, e o
  outro sai do delta. Qual estado o clone tem **não se supõe**: compara-se a
  altura dele com as duas do original e fica-se com a mais próxima. O estado
  inicial também se mede (o primeiro item pode nascer ABERTO). Princípio geral:
  o instrumento acrescenta o que falta, não reescreve o que já está certo.
- **Conferir:** `gera-acordeao.mjs` e a geometria do FAQ com cada item aberto e
  fechado.

---
## 8 · Animação, laço e runtime JS

### 🚨 Runtime JS global não pode carregar dado de rota

- **Sintoma:** o comportamento de uma rota some quando outra é gerada (o
  acordeão da home deixa de abrir depois de gerar o do FAQ, o item que nasce
  aberto nasce fechado); ou, pior, o runtime **destrói conteúdo** em outras
  rotas: um telefone vira um número qualquer, um endereço vira número, um card
  inteiro de uma grade some, o rodapé perde textos e links.
- **Causa:** `public/*.js` é um arquivo só para todas as rotas. Gerado por rota,
  a última rota rodada sobrescreve as outras. E um runtime que traz lista de cid
  (`CIDS = ["n120","n130"]`) e os procura no documento inteiro acha esses cids
  em outras rotas, onde são outra coisa (o cid colide); um
  `el.textContent = String(n)` **apaga a subárvore inteira** do elemento.
- **O dano se disfarça de outro defeito:** o card comido faz a grade se
  reorganizar e a geometria acusa "troca de coluna"; o `compara-conteudo` acusa
  "texto faltando", sugerindo captura incompleta. A aritmética fecha o
  diagnóstico: quando um texto vira um número que é uma FRAÇÃO exata dos dígitos
  do texto original, é um contador fotografado em voo escrevendo no lugar
  errado.
- **Conserto:** o JS lê tudo do CSS da rota que está carregada, e fica genérico:

  ```css
  body { --ditto-limiares: "80 240 360" }   /* quais posições ligam ditto-yNNN */
  [data-cid="n212"] { --ditto-revelar: 1 }  /* quem revela ao entrar na tela */
  ```

  O mesmo para `--ditto-acordeao`, `--ditto-contador`, `--ditto-ticker-vel`. O
  marcador fica fora de `@media`.
- **Conferir:** varrer `public/*.js` procurando lista de cid dentro do runtime.
  Guarda por rota (`location.pathname`), guarda de conjunto completo (todos os
  alvos presentes) e guarda por nó são as três defesas quando um runtime ainda
  precisa de lista.

### 🚨 CUSTOM PROPERTY É HERDADA: o runtime genérico trata a subárvore como alvo

- **Sintoma:** texto duplicado dentro do próprio elemento
  (`"thethethethe milemilemil"`), milhares de elementos "só no clone" e "fora do
  lugar" numa faixa de letreiro, com `dw=dh=0` e `dx` enorme (tamanho certo,
  posição errada = casamento cruzado entre cópias). 🚨 O HTML buildado está
  LIMPO: a corrupção é 100% de runtime, e nenhum gate de build acusa.
- **Causa:** o marcador é declarado só no trilho, mas custom property herda por
  padrão: todo descendente devolve o mesmo valor em `getComputedStyle`, e o
  runtime duplica cada nível aninhado por cima do anterior.
- **Conserto de raiz:** registrar todo marcador como não herdável:

  ```css
  @property --ditto-ticker-vel { syntax: "<number>"; inherits: false; initial-value: 0 }
  ```

  E o cinto, no runtime: só o alvo MAIS EXTERNO vale
  (`candidatos.filter(el => nenhum ancestral está em candidatos)`). Vale para
  TODOS os marcadores (`--ditto-revelar` herdado transforma todo descendente de um
  alvo revelado em alvo).
- **Conferir:** número de trilhos e de nós por item iguais aos do original.

### Guard global "roda uma vez" mata o segundo arquivo quando há um por rota

- **Sintoma:** o carrossel da segunda rota nunca monta, sem erro.
- **Causa:** o runtime abre com `if (window.__dittoCarrossel) return`. Com um
  arquivo POR ROTA no layout, o primeiro script seta a flag e o segundo retorna
  antes de se registrar.
- **Conserto:** a idempotência real vem do marcador por trilho
  (`data-carrossel`) e do registro numa lista; guard global de arquivo único é
  veneno para runtime multi-arquivo.
- **Conferir:** o registro tem uma entrada por arquivo carregado.

### Nome de global com HÍFEN quebra a hidratação de TODAS as rotas

- **Sintoma:** React error #418 em toda rota e o movimento morto (carrosséis e
  marquee mudos), sem nada apontando para a causa.
- **Causa:** `window.__ditto${NOME}` montado sem sanear: `NOME` "menu-mobile" vira
  `window.__dittoMenu-mobile = ...`, e hífen é subtração em JS. O `<script>` mora
  no `layout.tsx` global, então derruba a hidratação em todas as rotas.
- **Conserto:** sanear `NOME` para camelCase antes de interpolar em
  identificador.
- **Conferir:** **todo JS gerado passa por `node --check` antes de confiar no
  build**: o Next empacota sem reclamar.

### 🚨 `to { transform: none }` num keyframe APAGA o transform de base

- **Sintoma:** depois da animação de entrada, o elemento anda na horizontal
  sem ninguém pedir.
- **Causa:** o keyframe compartilhado termina em `transform: none`, e com
  `animation-fill-mode: both` esse `none` fica valendo para sempre; num site de
  construtor o transform de base costuma ser a centralização do elemento.
- **Conserto:** quando o elemento já tem transform (ou filter), keyframe PRÓPRIO
  que **compõe** com a base:

  ```css
  @keyframes dittoEntrada_n1322{
    from{opacity:0;transform:matrix(1,0,0,1,-121.359,100) translateY(20px)}
    to  {opacity:1;transform:matrix(1,0,0,1,-121.359,100)}
  }
  ```

- **Conferir:** a matriz computada no fim da animação é a de repouso do original.

### 🚨 `transform: translateY(...)` SOBRESCREVE o translateX que já existia

- **Sintoma:** ao reproduzir um estado de scroll, a barra desloca na horizontal
  e o Y também fica errado.

  ```
  original repouso:  matrix(1, 0, 0, 1, -121.359, 100)
  original rolado:   matrix(1, 0, 0, 1, -121.359,   0)   <- só o Y muda
  CSS errado:        transform: translateY(-71px)
  resultado:         matrix(1, 0, 0, 1,        0, -71)   <- perdeu o X
  ```

- **Causa:** elemento posicionado carrega um `translateX` de centralização, e um
  `translateY` sozinho o apaga.
- **Conserto:** guardar e aplicar o `transform` INTEIRO medido, nos dois estados.
  Nunca montar deslocamento à mão a partir da diferença de posição.
- **Conferir:** as duas matrizes do clone iguais às do original.

### 🚨 Esconder por JS depois do load pisca; esconder por CSS sem JS deixa em branco

- **Sintoma:** o estado oculto da revelação pisca visível antes de esconder; ou,
  sem JS, o conteúdo fica escondido para sempre.
- **Conserto:** uma classe posta pelo JS na **primeira linha**, com o `<script>`
  no topo do `<body>` e **sem `defer`**:

  ```js
  document.documentElement.classList.add("ditto-js");
  ```

  ```css
  html.ditto-js [data-cid="n212"]:not(.ditto-revelado){opacity:0;transform:translateY(20px)}
  ```

  Com JS, o oculto vale já no primeiro quadro, inclusive para quem está visível
  no topo; sem JS, nada fica escondido. No `prefers-reduced-motion`, desligar
  animação **sem** devolver o estado final deixa em tela o estado oculto, e a
  regra que devolve mira **só os alvos de revelação** (um
  `transform: none !important` em `[data-cid]` inteiro apaga a centralização da
  nav).
- **Conferir:** carregar com e sem JS, e com movimento reduzido.

### 🚨 Rede de segurança que revela TUDO mata a própria revelação

- **Sintoma:** todos os alvos de revelação aparecem juntos alguns segundos
  depois do load, e dali em diante rolar não anima mais nada.
- **Causa:** a rede de segurança (para nada ficar oculto para sempre se o
  `IntersectionObserver` não disparar: aba em segundo plano, elemento de altura
  zero) revelava todos os alvos num prazo fixo.
- **Conserto:** a rede resgata só o que **já deveria estar visível** (topo acima
  da borda inferior da janela) e segue vigiando o resto.
- **Conferir:** sem rolar, depois do prazo, os alvos abaixo da dobra seguem
  ocultos e revelam ao rolar, igual ao original.

### 🚨 O runtime de scroll fica no `public/` mas NÃO linkado no layout

- **Sintoma:** a animação de revelação simplesmente não acontece: geometria
  passa (elemento no lugar final, visível), console limpo. Na página servida,
  `html.className` é `""` e nenhum script fora dos chunks carrega.
- **Causa:** o `gera-scroll.mjs` escreve `public/scroll.js` e o `scroll.css`, mas
  ligar o `<script>` no layout é passo à parte. Sem ele, `html.ditto-js` nunca
  entra e o oculto nunca ativa.
- **Conserto:** `<script src="/scroll.js" />` no TOPO do `<body>`, SEM `defer`
  (roda antes do paint). Os outros runtimes (menu, marquee) também precisam do
  link, e esses podem ser `defer`.
- **Conferir:** `document.documentElement.className` contém `ditto-js` na página
  servida.

### 🚨 O que muda ao rolar é de TRÊS tipos, e tratar como um só quebra

| tipo | como se reconhece | como se reproduz |
|---|---|---|
| **ALTERNA** | está na janela no topo (ou é `fixed`/`sticky`), dois estados, e **volta** ao repouso | classe no `<body>` por limiar medido |
| **REVELA** | está fora da janela no topo, **ou** muda e não volta | `IntersectionObserver` + estado oculto no CSS |
| **CONTÍNUO** | está na janela e assume 4+ valores ao longo da escada | animação guiada por scroll (`animation-timeline`) ou tabela medida |

- **Sintoma de errar o tipo:** REVELA tratado como ALTERNA desfaz a entrada toda
  vez que a página volta ao topo; CONTÍNUO tratado como ALTERNA salta entre dois
  valores; ALTERNA tratado como REVELA deixa a nav sem colapsar.
- 🚨 **`fixed`/`sticky` NUNCA é REVELA:** elemento ancorado na tela já está lá.
  Uma barra fixa que nasce alguns px abaixo da janela cai no grupo errado pelo
  critério de janela e, comparada repouso contra repouso, some do relatório.
- **Limiar é por elemento**, não do site: a nav troca num ponto e a barra em
  outro.
- **Conferir:** cada tipo se vê com a foto certa (seção 11, "Comparar o repouso
  com a foto ERRADA").

### 🚨 TRANSFORM LIGADO À ROLAGEM (scrub): o defeito que NENHUM gate enxerga

- **Sintoma:** um cartão que no original entra torto e endireita conforme
  atravessa a janela, ou blocos que entram com escala e assentam, ficam parados
  no clone, e a geometria dá **zero fora do lugar**.
- **Causa:** a captura congela o elemento no estado de PARTIDA. O
  `compara-geometria` volta ao TOPO antes de fotografar, onde o elemento ainda não
  entrou na janela: o original está no mesmo estado inicial em que a captura
  congelou o clone, e os dois batem.
- **Conserto:** `gera-scrub.mjs`. A saída é uma **tabela medida** (posição do topo
  na janela → matriz completa), nunca uma fórmula: o runtime interpola entre as
  amostras travando nas pontas. Se a curva sair linear, é conclusão da medição,
  não premissa. ⚠️ `transform: none` é a matriz IDENTIDADE, não amostra
  inválida: descartá-lo tira o estado de CHEGADA da tabela. ⚠️ Dois runtimes não
  escrevem a mesma propriedade: o pareamento descarta quem estiver em laço ou
  marcado `data-marquee`/`data-carrossel`.
- **Separar rolagem, relógio e acaso:** duas leituras **sem rolar nada**. O que
  muda com a página parada anda pelo relógio (ou pelo acaso) e não é scrub. Uma
  camada de textura cujo transform salta de forma errática com a página parada,
  sem repetir estado, não se reconstrói por medição: vai declarada como
  residual. ⚠️ **Assentar ANTES de julgar:** o parallax do Framer tem inércia e
  segue deslizando por mais de um segundo depois da rolagem; com espera curta o
  teste de laço pega o rastro e declara "anda sozinho" quase tudo. Com ~1,4s de
  assentamento a separação sai certa.
- **Conferir:** comparar o transform de cada elemento **no topo** com o transform
  **quando entra na janela**, nos dois lados; elementos que mudam no original e
  zero no clone denunciam a classe.

### 🚨 `IntersectionObserver` no trilho de um marquee nunca dispara

- **Sintoma:** os filhos duplicam, a animação existe em `getAnimations()`, e nada
  anda (ticker mudo), mesmo com a seção à vista; às vezes só numa rota (a que tem
  o trilho muito transladado).
- **Causa:** o observer cruza os **dois eixos**, e o trilho de um marquee vive
  deslocado para fora da janela na horizontal (e recortado pelo
  `overflow: hidden` do pai): nunca intersecta.
- **Conserto:** observar o ancestral visível, subindo do trilho até achar quem
  cruza a janela na horizontal:

  ```js
  var vigiado = ul;
  for (var g = 0; g < 6 && vigiado.parentElement; g++) {
    var cx = vigiado.getBoundingClientRect();
    if (cx.right > 0 && cx.left < innerWidth) break;
    vigiado = vigiado.parentElement;
  }
  ```

  ⚠️ E o passo do laço se mede ANTES de duplicar os filhos: depois, por
  `offsetLeft`, pode dar zero (os `<li>` têm largura 0 e quem carrega o conteúdo é
  o filho interno). O `scrollWidth` do trilho antes da duplicação é o ciclo.
  Iniciar no `window.load` mais 2×rAF: no `DOMContentLoaded` o trilho abaixo da
  dobra pode ter `scrollWidth` 0 e a duplicação sai cedo. As cópias levam
  `aria-hidden` (senão viram "só no clone" na geometria).
- **Conferir:** o transform do trilho muda em duas leituras com a seção à vista.

### 🚨 Laço de trilho PAUSA fora da janela, e o runtime tem que pausar também

- **Sintoma:** um bloco inteiro de itens de trilho fica centenas de px fora do
  lugar, e o número SOBE quando o conserto entra.
- **Causa:** o original pausa o que está fora da tela (ao voltar, o trilho está
  onde parou, não no repouso). Um laço reconstruído rodando SEMPRE anda durante
  todo o protocolo de medição (velocidade × duração do protocolo). E antes, com
  os elementos em movimento, o controle de deriva os excluía da conta: contagem
  menor por exclusão não é fidelidade maior, é defeito escondido.
- **Conserto:** pausa fora da janela e repouso medido no original. Alternar
  `animation-play-state` reproduz a pausa mas não controla quanto andou em cada
  quadro, e o erro acumula; o original anima por rAF, integrando posição quadro a
  quadro, e reproduzir com integração por quadro (`gsap.ticker`, com a curva
  medida como easing) zera a classe. O GSAP core vai verbatim em `public/`, fora
  do minificador, e o runtime se cala se `window.gsap` não existir.
- **Conferir:** medir se o laço PAUSA ou RESETA fora da janela (rolar até longe,
  voltar, ler a posição); os itens do trilho no lugar depois do protocolo inteiro.

### Velocidade de laço se mede em REGIME, nunca nos primeiros segundos

- **Sintoma:** o marquee do clone anda bem mais devagar que o original.
- **Causa:** o trilho do original ACELERA na partida: quanto mais curta a janela
  de medição, mais devagar ele parece.
- **Conserto:** velocidade por trilho, via variável medida
  (`--ditto-marquee-vel`), nunca global; medir a segunda metade de uma janela
  longa (dezenas de segundos) e confirmar por **deslocamento total**, a medida
  menos ruidosa.
- **Conferir:** ⚠️ curva "certa demais" é sinal de reconstrução, não de
  fidelidade: o clone com WAAPI `linear` mede variação quase zero, o original
  oscila. A média acumulada é a que se compara.

### Ticker: período por assinatura de CONTEÚDO e reparo pelo conjunto saudável

- **Sintoma:** o laço do ticker repete na hora errada, ou mostra um item
  mutilado e um buraco no meio da sequência.
- **Causa:** itens de mesma largura enganam o detector de período por largura; e
  a captura MUTILA o meio da sequência (derruba item de cauda, come um título).
- **Conserto:** período por assinatura de conteúdo (texto + `src`), com teto em
  `len-2` (não `len/2`), porque o trilho capturado tem menos de dois períodos
  inteiros. Reconstruir o laço a partir do CONJUNTO SAUDÁVEL que o próprio clone
  contém; entre as janelas candidatas, vence a de MAIOR texto total (assinaturas
  distintas não provam saúde: a janela que começa no item mutilado também é
  "distinta"). Fileira de itens de larguras diferentes: `censo-trilhos.mjs`.
- **Conferir:** a sequência do clone igual à do original, item a item.

### 🚨 Carrossel ou fileira MUTILADA: o slide fora da janela não existe no DOM

- **Sintoma:** dos depoimentos ou cards do time do original sobram alguns no
  clone, ou um slide inteiro de uma seção sticky some (cada rota congela num
  instante diferente). Nenhuma medição de rota, metadata ou altura acusa: o slide
  ausente não desloca ninguém. Variante: o trilho tem os itens, mas começa no
  item errado e com menos cópias que o original.
- **Causa:** a captura fotografa um instante e materializa só o que estava perto
  da janela.
- **Conserto:** `gera-slides.mjs` (censo no original, clonagem do slide-modelo do
  PRÓPRIO clone, que já tem as classes certas, e textos, imagens e diffs de estilo
  devolvidos por medição) ou `reconstroi-trilho.mjs`. Três armadilhas dentro do
  conserto:
  1. no clone o trilho pode ter UM filho só (é o defeito): a heurística de "2+
     irmãos parecidos" não acha o trilho no lado doente; sobe-se o número de
     níveis MEDIDO no original;
  2. parar no primeiro nível que parece trilho casa par nome/cargo em vez do
     card: fica-se com o nível MAIS ALTO que ainda parece trilho, com teto de 85%
     da janela para não casar as seções da página;
  3. o slide-modelo pode estar DUPLICADO por breakpoint (o dobro de textos e
     imagens do original): aplicar por módulo, e declarar os diffs de estilo à
     parte (índice de nó não sobrevive à duplicação).
- **Conferir:** censo de itens visíveis e no DOM nos dois lados.

### O original NÃO virtualiza esvaziando: ele esconde com `visibility`

- **Sintoma:** depois de reconstruir todos os slides, dezenas de elementos "só
  no clone", na conta exata de slides × elementos por slide.
- **Causa:** hipótese errada de que o construtor virtualiza. Os itens estão
  completos no DOM do original; o que muda é `visibility: hidden` no PRIMEIRO
  FILHO de cada item fora da janela corrente ±1, com o item em
  `display: contents`.
- **Conserto:** reproduzir a ocultação, não só os itens (`reconstroi-trilho.mjs`).
  Carrossel manual: o runtime imita a virtualização do original, nasce com os
  slots e preenche ±2 do corrente; materializar TODOS piora a geometria.
- **Conferir:** uma sonda que filtra `display`/`visibility` conta os slides
  visíveis nos dois lados (a que não filtra confirma a hipótese errada).

### Carrossel manual: passo e mola se medem clicando

- **Sintoma:** o carrossel do clone não responde às setas, ou anda com outro
  passo.
- **Causa:** carrossel que não anda sozinho com a página parada é manual; o passo
  e a mola das setas não vêm na captura.
- **Conserto:** `captura-slides.mjs` clica os controles no original e mede passo
  e mola, com guarda de rota e registro aditivo (o cid reinicia por rota). A caixa
  útil é a UNIÃO dos rects dos filhos quando o trilho mede zero. A escolha do
  trilho segue o teste de autonomia (seção 11, "O instrumento clica um carrossel
  e mede OUTRO").
- **Conferir:** passo e duração por clique iguais nos dois lados.

### 🚨 O contador PAUSA fora da tela e RETOMA de onde parou

- **Sintoma:** o contador do clone já está no número final quando se chega a
  ele, e o do original ainda está contando; na comparação, os dois nem casam.
- **Causa:** o tempo que conta é o tempo EM TELA, como no laço do marquee:
  rolando a página, os contadores do original congelam e ficam ali
  indefinidamente; ao voltar à tela, retomam e assentam em pouco mais de um
  segundo.
- **Conserto:** `gera-contador.mjs`: o runtime acumula o tempo decorrido só com o
  elemento visível, e parte do valor do HTML do original (seção 3, "Contador
  congelado em voo").
- **Conferir:** `mede-contador.mjs` rolando ida e volta nos dois lados.

### E o fallback silencioso, que é o pior de todos

- **Sintoma:** o conteúdo revela visivelmente mais rápido que no original, em
  todas as rotas, e nenhum gate acusa, porque a regra aplica: só está errada.
- **Causa:** `const dur = durMedida || 400`: a medição de duração falhou (o
  cabeçalho do CSS saiu com "duração medida: 0ms") e o número inventado entrou
  calado.
- **Conserto:** quando a medição falhar, gritar e exigir `DUR_FALLBACK` medido;
  nunca cair num número inventado calado. O instrumento aborta em vez de gerar
  com número chutado.
- **Conferir:** 🚨 só se descobre comparando a MEDIÇÃO dos dois lados
  (`getAnimations()` no original contra o clone: duração e keyframes), não
  olhando o clone. Gate prova que o navegador obedeceu, não que o número é o
  certo.

### 🚨 O `gera-entrada` REALIMENTA a própria animação e o desvio se EMPILHA

- **Sintoma:** depois de uma rodada de conserto que "não tocou em geometria", a
  geometria PIORA: um bloco de elementos animados com o mesmo `dy`, só em `dy`,
  exatamente o `translateY` da rodada anterior.
- **Causa:** o instrumento lê o `transform` e o `filter` de base no clone para
  compor o keyframe, e com `animation-fill-mode: both` o estado final da animação
  É o estilo computado. Na segunda rodada, ele lê o próprio `to{}` da anterior
  como base.
- **Conserto:** antes de ler caixa e base, desligar a animação de todos os
  `[data-cid]` por estilo inline (`el.style.animation = "none"`), forçar o reflow,
  medir e restaurar. Estilo inline vence a folha, então neutraliza qualquer
  `entrada.css` anterior sem apagar arquivo.
- **Conferir:** rodar o instrumento duas vezes seguidas dá o mesmo arquivo. Vale
  para todo instrumento que lê estilo computado do clone para escrever CSS no
  clone: **medir sempre com a própria camada desligada** (a ideia da
  `linha-de-base.mjs`, por elemento).

### Duração que a WAAPI reporta não é sempre a da entrada

- **Sintoma:** os links do menu dão timeout no hover num clone em que o
  original responde; ou elementos ficam presos invisíveis depois da entrada; ou
  a entrada sai muito mais borrada que o véu leve do original.
- **Causa:** a WAAPI devolve também o que não é entrada. Um laço lido errado
  (texto rolante da nav) reporta duração de 10.000ms e, escrito como
  `animation ... both`, deixa o elemento eternamente "animando", nunca estável.
  O coletor roda alguns segundos e pega demos em laço na fase de SAÍDA
  (`opacity 1→0`, blur aumentando). E um padrão fixo de estado inicial
  (`blur(10px)`) erra o site que abre com `blur(1.5px)`.
- **Conserto:** o `gera-entrada.mjs` tem teto de duração (`MAX_DUR`), declara e
  pula quem sai, e tira o estado inicial do offset 0 dos keyframes medidos, nunca
  de um padrão.
- **Conferir:** a lista de entradas do clone contra o inventário do original;
  nenhuma geometria acusa o estado inicial errado, porque a caixa final é a
  mesma.

### Animação: a classe vem, o CSS não

- **Sintoma:** as classes `motion-safe:animate-in`, `fade-in`, `slide-in-*` estão
  no JSX, quem revisa o código conclui que a entrada está implementada, e nada
  anima. Nenhuma medição acusa.
- **Causa:** em alvo Tailwind com tw-animate-css, o `@keyframes` e as regras
  dessas classes não vêm.
- **Conserto:** reproduzir o CSS **do próprio original**: os `@keyframes`, os
  easings que ele sobrescreve do Tailwind, as variantes `motion-safe:`/`data-*`, e
  os `@property` de ângulo (sem eles o gradiente cônico não anima, porque tipo
  não registrado não interpola). ⚠️ Elementos com `animate-in` sem
  `motion-safe:ease-out` deixam `--tw-ease` indefinido e a curva efetiva é a
  keyword `ease`: aplicar `ease-out` deixa diferente. E `--tw-enter-*` não têm
  `@property`, logo **herdam**: é comportamento a replicar, não bug.
- **Conferir:** número de `@keyframes` e animações vivas iguais nos dois lados.

### 🚨 Animação de entrada pelo WAAPI fica pendente até o próximo quadro

- **Sintoma:** depois de uma rolagem, com quadros lentos, elementos do clone
  entram centenas de ms depois do original.
- **Causa:** `element.animate(…)` nasce "pendente" e só começa a contar (inclusive
  o atraso) quando o navegador entrega um quadro. O Motion fixa a hora de início
  na criação.
- **Conserto:** `animacao.startTime = document.timeline.currentTime` logo depois do
  `animate`. **Mas não durante uma View Transition:** com a tela congelada, a
  entrada corre escondida e a página chega com tudo pronto. Um sinal global
  enquanto a transição roda resolve.
- **Conferir:** série da entrada logo depois de rolar, nos dois lados.

### 🚨 Entrada com gatilho de visibilidade dentro de caixa que cresce espera a borda chegar

- **Sintoma:** links de um menu de celular entram com atrasos maiores no
  original do que os do código.
- **Causa:** cada link é um efeito de entrada com `__framer__threshold: 0.5`, e a
  barra que cresce corta o que passa da borda: o link de baixo só fica 50%
  visível mais tarde.
- **Conserto:** atraso = atraso do código + instante em que a caixa revela o meio
  do elemento (pela mola da altura); a conta prevê cada link com folga de um
  quadro do observador. E quem anima a altura não anima o espaçamento junto
  (animar `row-gap` faz os links subirem, o que o original não faz).
- **Conferir:** série da entrada de cada link nos dois lados.

### 🚨 Efeito com gatilho no PRÓPRIO elemento que nasce fora da tela nunca dispara

- **Sintoma:** uma barra que devia aparecer ao rolar nunca aparece, em largura
  nenhuma.
- **Causa:** foi gravada como "aparecer quando 50% dela estiver na tela", e ela
  nasce abaixo da janela. No código, `__framer__targets: [{ ref, … }]`: quem
  dispara é a seção de referência.
- **Conserto:** gatilho pela referência do código.
- **Conferir:** rolar até a seção de referência e ver o efeito nos dois lados.

### 🚨 Animar o tamanho REAL refaz o layout de filhos e irmãos

- **Sintoma:** conteúdo centralizado dentro de uma caixa que cresce parte fora do
  lugar; o irmão depois de um botão que alarga é empurrado em dobro.
- **Causa:** o runtime anima a largura de verdade; o Framer anima a caixa por
  projeção. O irmão é empurrado pelo layout E pelo próprio deslize.
- **Conserto:** pôr todas as caixas que crescem no tamanho de partida ao mesmo
  tempo, medir onde o layout deixa cada nó em relação ao pai e descontar esse
  desvio do deslize (ele some na mesma proporção do tamanho).
- **Conferir:** filme quadro a quadro da animação nos dois lados.

### ⚠️ Teto de passo por quadro na mola de um script faz o movimento atrasar

- **Sintoma:** com a máquina carregada, um cursor ou elemento com mola anda mais
  devagar que o relógio e, em câmera lenta, para no meio do caminho.
- **Causa:** a mola integra com `dt = min(0,064, …)`; com quadros espaçados ela
  perde tempo. A do Framer é calculada pelo tempo.
- **Conserto:** teto alto (0,5s), em passos de 1ms para a conta continuar estável.
- **Conferir:** a série sob carga acompanha o original.

### Elemento devolvido ao JSX que perde a regra vira item do flex

- **Sintoma:** conteúdo centralizado de um link deslocado em 1-2px depois de uma
  rodada do gerador.
- **Causa:** um elemento (a linha que cresce sob um link) foi devolvido ao JSX
  numa rodada; a rodada seguinte do gerador, que reescreve o arquivo, não o casou
  e não escreveu regra. O `<div>` sem estilo entra no flex do link e ganha o
  `gap`.
- **Conserto:** a regra tirada do código do componente num arquivo próprio, fora
  do arquivo que o gerador reescreve.
- **Conferir:** depois de cada rodada do gerador, todo elemento devolvido ao JSX
  tem regra.

---

## 9 · Hidratação e navegação

### 🚨 Mutar o `<html>` antes da hidratação REGENERA a árvore e apaga TUDO

- **Sintoma:** a página funciona por alguns segundos e depois desmonta: a
  classe `ditto-js` some, os trilhos voltam ao número original de filhos, os nós
  viram outros objetos. Em produção, sem erro legível no console (o React minifica
  para o código #418).
- **Causa:** o `<html>` pertence ao React no App Router. Encontrando um atributo
  que não renderizou, ele declara falha e regenera a árvore inteira no cliente.
  O servidor de desenvolvimento dá o texto completo e o diff aponta o atributo
  (`- className="ditto-js"`).
- **Conserto:** `suppressHydrationWarning` no `<html>` **e** no `<body>` (os dois
  elementos que os runtimes marcam; é a mesma marca que o `next-themes` exige).
  O erro cai da variante fatal ("this tree will be regenerated") para a inócua
  ("won't be patched up"). ⚠️ Ele **não cobre os descendentes**: todo runtime que
  muta o DOM (duplicar filhos, trocar texto, pôr classe em elemento comum) roda
  **depois** da hidratação, num efeito de componente cliente, nunca no evento
  `load` (o `load` pode disparar segundos antes de a hidratação terminar).
- **Conferir:** um carimbo no nó e leituras em pontos fixos do tempo mostram o
  mesmo objeto antes e depois da hidratação.

### 🚨 A hidratação do React APAGA a classe que gateia a revelação

- **Sintoma:** os alvos de revelação nascem visíveis e a animação não toca;
  rota, metadata, conteúdo, geometria e até o `confere-entrada` passam (a entrada
  é outra camada).
- **Causa:** a classe `html.ditto-js` existe no parse e some por volta de 400ms,
  quando o React reconcilia o `<html>`.
- **Conserto:** um `MutationObserver` no `documentElement` que devolve a classe
  no mesmo quadro em que ela some (junto com o `suppressHydrationWarning`
  acima).
- **Conferir:** a classe presente alguns segundos depois do load.

### Mutar o DOM antes da hidratação do NÓ que se muta

- **Sintoma:** #418 numa rota em algumas cargas e não em outras.
- **Causa:** o runtime reconstrói um trilho (`innerHTML`) antes de o React
  hidratar aquele nó. Esperar "algum nó" hidratar não basta: o React hidrata
  progressivamente, e um trilho no fim da página ainda não foi processado quando
  o primeiro filho do body já tem `__reactFiber$`.
- **Conserto:** esperar a chave `__reactFiber$`/`__reactProps$` aparecer **no
  próprio elemento** que será mutado, com teto de tempo para não travar em
  documento sem React.
- **Conferir:** corrida se prova com repetição (dezenas de cargas): zero cargas
  com erro **e** o runtime agindo em todas. "Limpo" sem provar que o runtime agiu
  é falso positivo.

### 🚨 Interceptar o clique e o router não navegar deixa o link MORTO

- **Sintoma:** clicar em qualquer link interno do clone não faz nada: URL,
  título e conteúdo parados. Sem erro, sem pedido de payload.
- **Causa:** o componente de navegação client-side cancela o clique e chama
  `router.push`. No export estático, o push não navega em rota cujo slug tem
  caractere não-ASCII: a pasta tem o caractere literal e o href vem
  percent-encoded, e a rota não casa no manifesto.
- **Conserto:** decodificar o pathname antes do push e, sobretudo, a **TRAVA**:
  agendar, ANTES do push, um `setTimeout` de 700ms que compara o pathname e cai
  para `location.href` se nada mudou. Agendado depois, o `router.push` lança e o
  timeout nunca existe. Interceptar sem garantir chegada é pior do que não
  interceptar.
- **Conferir:** `mede-navegacao.mjs` (a dimensão 7) clica e confere URL, título e
  conteúdo em cada salto.

### 🚨 A troca de página do Framer é uma View Transition, e a captura não a leva

- **Sintoma:** o original anima a troca de página (a velha congela, sobe e some,
  a nova é revelada por uma máscara em degradê); o clone troca de uma vez.
  Nenhuma régua de página assentada vê.
- **Causa:** o original usa `document.startViewTransition`, com um
  `<style id="view-transition-styles">` injetado durante a troca.
- **Conserto:** o clique interceptado abre a mesma transição com esse CSS, e a
  promessa se resolve no `useLayoutEffect` da rota nova (o mesmo que liga as
  folhas dela), com prazo de 4s para a tela não congelar.
- **Conferir:** embrulhar `document.startViewTransition` no original e clicar
  (conta as chamadas); capturar o CSS por `MutationObserver`.

### Transição de PÁGINA: medir exige o coletor armado ANTES do clique

- **Sintoma:** ponto cego: um clone pode cortar seco onde o original dissolve, e
  nenhum gate acusa.
- **Causa:** medir o mecanismo (documento novo × client-side) esperando segundos
  depois do clique lê tudo depois que qualquer fade terminou; e o
  `inventario-movimento` nunca navega.
- **Conserto:** `mede-transicao-pagina.mjs`: em navegação client-side o documento
  PERSISTE, então um `evaluate` iniciado antes do clique continua rodando durante
  a troca. Uma marca plantada por `addInitScript` distingue documento novo (aí há
  flash, e isso se declara). ⚠️ Não guardar referência de nó (o React destrói a
  árvore): cada quadro reidentifica os filhos por marca incremental, e o quadro em
  que uma marca some e outra nasce é o swap.
- **Conferir:** o veredito pode ser "não tem transição", e aí reproduzir
  fielmente é NÃO escrever transição: é um número no relatório, não uma suposição.

### 🚨 O que mora fora da página no original não entra de novo a cada clique

- **Sintoma:** um elemento fixo (um cartão no canto) some e volta com a animação
  de entrada a cada navegação no clone; no original, chega pronto pelo clique.
- **Causa:** no original ele é montado uma vez; no clone cada rota tem a sua
  cópia.
- **Conserto:** marcar o elemento (`data-ditto-persiste`); o runtime de efeitos o
  põe no estado final quando a rota mudou, e a regra de partida dele vale só
  antes da primeira navegação (`html:not(.ditto-navegou)`), senão ele pisca nos
  quadros entre a rota montar e o runtime agir.
- **Conferir:** medir a CHEGADA pelo clique nos dois lados, não só a carga.

### ⚠️ Servidor de medição sem cache faz a foto piscar na navegação pelo clique

- **Sintoma:** a imagem do cabeçalho some por centenas de ms a cada troca de
  página no clone servido localmente.
- **Causa:** o `serve-clone` mandava `no-store` em tudo (para build velho não ser
  medido como novo); na navegação pelo cliente, cada `<img>` baixa de novo.
  Defeito que host nenhum teria.
- **Conserto:** arquivo com o conteúdo no nome (`/_next/static/`, mídia com hash)
  vai com cache imutável; o resto segue sem cache.
- **Conferir:** navegar pelo clique e olhar a rede: a mídia com hash vem do
  cache.

---

## 10 · Imagens e peso

### 🚨 O `sizes` que a captura guarda é o do servidor, e o Framer o reescreve depois

- **Sintoma:** a página do clone pesa bem mais que a do original; nenhuma régua
  visual vê, porque a imagem maior desenha igual.
- **Causa:** o Framer reescreve o `sizes` de cada `<img>` depois de montar (uma
  expressão por faixa). A captura guarda o do HTML do servidor, maior, e o
  navegador escolhe uma variante grande demais do `srcset`.
- **Conserto:** o `sizes` vivo do original, lido nas três faixas, casado pelo id
  da imagem no Framer (o mapa `storedAs → url` da captura) e, na falta, pelo
  `alt`. Depois disso, a sobra é de formato (o CDN do Framer serve AVIF; a captura
  guarda JPEG e PNG): WebP nas mesmas dimensões, com nome novo.
- **Conferir:** o peso por tipo nos dois lados, COM compressão (o servidor de
  medição não comprime e o host do original sim; sem descontar, o HTML do clone
  parece muitas vezes maior). ⚠️ `naturalWidth` de imagem com `srcset` vem
  dividida pela densidade escolhida: não serve para dizer se o arquivo é pequeno
  demais.

### Assets da captura reusada

- **Sintoma:** no clone multi que reusa uma captura, fotos e fontes das rotas
  que não são a de entrada aparecem quebradas.
- **Causa:** o código de cada rota referencia `/assets/cloned/...`, mas só os
  binários da captura reusada foram baixados; o endpoint de arquivos da API dá
  404 para binário de captura reusada, e o job é descartado logo depois.
- **Conserto:** `recupera-assets.mjs` materializa os binários referenciados e
  ausentes (o nome do arquivo local é o hash da URL de origem).
- **Conferir:** zero imagens quebradas no `confere-pareado.mjs`.

---
## 11 · Quando a medição mente

A regra que atravessa a seção: **antes de comparar dois lados, medir quanto
CADA lado varia sozinho**, e desconfiar tanto do número que melhora muito de
repente quanto do que piora. E antes de medir ou estimar movimento, ler a regra
no código publicado do original (os `.mjs` que a página carrega): medida sem a
regra do código aprova curva errada.

### 🚨 Agregado passa enquanto a página está desmontada

- **Sintoma:** `compara-visual.mjs` dá todas as medições com Δaltura = 0px numa
  home visivelmente errada (nav fora do lugar, FAQ deslocado, cards tortos).
- **Causa:** altura de página, marcos de seção e fontes são **agregados**, e
  agregado não muda quando um elemento anda para o lado: o que um perde, o
  vizinho ganha.
- **Conserto:** fidelidade visual se mede **elemento a elemento**, com
  `compara-geometria.mjs`. O `compara-visual.mjs` serve de detector grosso
  (altura de página, fonte que não carregou), nunca de prova de idêntico.
- **Conferir:** a mesma página, no mesmo instante, nos dois instrumentos.

### 🚨 Casar elemento por ÍNDICE entre duas fotos da MESMA página

- **Sintoma:** um laudo com cara de verdade (a barra muda de cor para o azul
  padrão de link e de largura ao rolar), e centenas de "elementos que revelam ao
  rolar" que não existem.
- **Causa:** entre duas fotos, um carrossel reordenou os próprios filhos; a
  contagem bate, mas daquele ponto em diante todo índice aponta para o vizinho.
- **Conserto:** carimbar cada elemento UMA vez (`data-dp`) e ler o carimbo nas
  fotos seguintes. Elemento sem carimbo entrou depois e fica de fora, que é o
  certo.
- **Conferir:** a contagem de mudanças cai para o que é real, e os recusados por
  erro de casamento quase zeram.

### 🚨 Comparar o repouso com a foto ERRADA esconde comportamento inteiro

- **Sintoma:** um elemento que alterna ao rolar some de um relatório que diz ter
  varrido a página inteira.
- **Causa:** cada tipo de mudança pede uma foto de destino: **quem alterna** se
  vê comparando o repouso com o **fundo da escada** (rolada e parada lá); **quem
  revela**, com a **página percorrida e de volta ao topo**. Quem alterna,
  comparado contra a página percorrida, já voltou ao repouso e dá zero.
- **Conserto:** as duas fotos, cada tipo na sua (`mede-scroll.mjs`).
- **Conferir:** os três tipos aparecem no relatório (seção 8, "O que muda ao
  rolar é de TRÊS tipos").

### 🚨 Animação em LAÇO vira falso comportamento de scroll e falsa regressão

- **Sintoma:** um marquee aparece com `translateX(2278px)` num degrau e `none`
  no outro, e o instrumento conclui "alterna no limiar de 160px" (escrever isso
  faz o marquee saltar). No comparador de geometria, a mesma rota no mesmo build
  dá números diferentes em duas rodadas seguidas, e uma correção que funcionou
  aparece como piora.
- **Causa:** o elemento mudou porque o tempo passou, não por causa do scroll nem
  do conserto (um rotador de palavras, um marquee).
- **Conserto:** sem rolar nem tocar em nada, tirar duas fotos separadas no
  tempo. O que mudou sozinho é laço, sai da conta e vai declarado à parte.
- **Conferir:** a diferença menor que a variação própria do original não é
  diferença, é ruído.

### `DERIVA_MS` curto não enxerga laço de cadência lenta

- **Sintoma:** itens de um marquee lento entram como "fora do lugar" quando a
  foto pega outra fase.
- **Causa:** o controle de deriva do `compara-geometria` amostra ~1,6s por
  padrão; um marquee que pisa a cada 4-6s fica parado nessa janela e passa por
  estático.
- **Conserto:** página com trilho contínuo pede `DERIVA_MS=8000`.
- **Conferir:** os itens do trilho saem da conta como laço.

### Laço que PAUSA fora da janela não deriva entre duas fotos do mesmo lugar

- **Sintoma:** marquees declarados ESTÁTICOS pelo detector de deriva.
- **Causa:** o detector tirava a segunda foto sem sair do lugar, e o Framer
  pausa todo trilho fora da tela.
- **Conserto:** entre as fotos, **visitar a página** (rolar por faixas) e
  **voltar ao MESMO y**: o parallax volta ao lugar e só o que depende do tempo se
  mexeu.
- **Conferir:** os trilhos aparecem como laço no relatório.

### 🚨 O controle de laço tem de valer também para imagem

- **Sintoma:** todos os logos de um marquee reconstruído e rodando entram na
  conta, um por um.
- **Causa:** o detector guarda a chave `tipo|texto`, e para imagem o texto é a
  caixa (`122x36`); o desvio carrega um texto enfeitado para o relatório
  (`img 122x36 <arquivo>`), e `laco.has(d.texto)` dá falso sempre.
- **Conserto:** guardar no desvio a chave CRUA e comparar por ela.
- **Conferir:** uma imagem em laço plantada sai da conta.

### Fase de laço se DESCONTA, não se perdoa em bloco

- **Sintoma:** tirar os itens de um trilho da conta esconde um logo trocado de
  lugar dentro do trilho.
- **Causa:** perdão em bloco não separa fase de arranjo.
- **Conserto:** mediana do dx por trilho (agrupado por faixa de y, porque uma
  página tem vários), subtraída de cada item. Itens todos com o mesmo dx são
  **arranjo perfeito e relógio diferente**; o que sobra depois do desconto
  continua na conta, e a fase vai impressa no relatório.
- **Conferir:** um item trocado de lugar plantado no trilho continua acusado.

### 🚨 O piso de ruído se MEDE, comparando o original com ele mesmo

- **Sintoma:** contagem atribuída a "fase de animação" que é defeito real.
- **Causa:** sem controle, escreve-se "residual de animação" em cima de trabalho
  não feito.
- **Conserto:** `ORIGINAL=<site> CLONE=<o mesmo site>` no `compara-geometria`
  mede o piso de cada rota e largura.
- **Conferir:** o que passa do piso é defeito.

### 🚨 CONTADOR: o texto é a IDENTIDADE, e um número que sobe não tem par

- **Sintoma:** um desvio enorme num elemento que está certo; contadores como "só
  no original" e "só no clone"; o sufixo `+` ao lado com alguns px de desvio.
- **Causa:** o comparador casa texto pelo conteúdo. O contador não casa (números
  diferentes), **rouba par alheio** (o contador congelado em `3` casa com outro
  `3` da página, meia página abaixo) e **arrasta o vizinho** (números de larguras
  diferentes).
- **Conserto, no comparador:** teto de distância para casar texto (um par a meia
  página não é par); **texto instável** (o que muda entre duas fotos sai da conta,
  declarado); e **posição instável** (mesmo elemento, mesma posição, outro texto),
  porque o conjunto de textos não basta quando há homônimo legítimo.
- **Conferir:** esperar mais não resolve; o contador do original pode seguir
  mudando segundos depois do assentamento.

### 🚨 Voltar ao topo COM UM SALTO não é a mesma coisa que rolar de volta

- **Sintoma:** desvio grande em elementos que estão certos, convidando a
  "consertar" o que já está bom.
- **Causa:** `window.scrollTo(0)` vindo do rodapé é um evento só; o framework do
  original lê direção de scroll e não registra aquilo como "subiu ao topo", e a
  nav fica colapsada.
- **Conserto:** o protocolo de assentamento desce em degraus **e sobe em
  degraus**, e espera ~1,8s no fim. Estado ambíguo dos dois lados é pior que não
  medir.
- **Conferir:** a nav do original expandida no topo depois do protocolo.

### 🚨 Rolagem se prova descendo E subindo

- **Sintoma:** o efeito desfaz, fica ou para no meio ao subir de volta, e as
  réguas que só provam a descida e o estado parado passam.
- **Conserto:** rolar de volta e comparar parada a parada:
  `scripts/sonda-ida-volta.mjs`.
- **Conferir:** ruído conhecido: laços e o cabeçalho que reage à direção na
  virada do fim da página (um evento a mais ou a menos com a máquina carregada,
  nos dois lados). Reproduzir antes de consertar.

### 🚨 Medir clique sem restaurar o estado contamina TODO o resto

- **Sintoma:** a partir de um alvo, todos os seguintes saem "COBERTO por div..."
  com timeout, cada um esperando segundos por um fracasso garantido.
- **Causa:** um clique abriu um drawer que **não fecha** com um segundo clique no
  mesmo botão (fecha no X), e ele cobre o resto.
- **Conserto, as duas defesas juntas:**
  1. ler a pilha ANTES do hover: se o alvo não está no topo em
     `elementsFromPoint`, registrar o motivo e pular;
  2. recarregar a página depois de todo clique que muda o estado (comparar o
     tamanho do texto do body antes e depois) e re-marcar os alvos.
  ⚠️ Não confiar no "clica de novo para fechar": muitos overlays abrem por um
  elemento e fecham por outro.
- **Conferir:** o número de alvos medidos é o de alvos marcados.

### 🚨 `el.click()` dentro do `evaluate` NÃO aciona framework

- **Sintoma:** a duração da transição sai 0ms em todos os itens; o framework não
  respondeu.
- **Causa:** `el.click()` no `page.evaluate` é `MouseEvent` sintético.
- **Conserto:** armar o gravador por `evaluate` e disparar o clique do lado do
  Playwright, que produz evento real:

  ```js
  await page.evaluate(() => { /* arma o rAF que grava a altura */ });
  await page.click('[data-acord="1"]');   // evento real
  await page.waitForTimeout(2100);
  const d = await page.evaluate(() => window.__acord);
  ```

  E medir a duração **da primeira à última mudança**, não do clique à última: o
  atraso até a transição começar não é parte dela.
- **Conferir:** o instrumento aborta quando a duração sai zero, em vez de gerar
  com número chutado.

### 🚨 Clicar por COORDENADA em página animada gera falso negativo

- **Sintoma:** o instrumento de navegação diz "não chegou" num clone em que a
  navegação funciona (sonda direta prova a URL mudando), e o original parado
  passa.
- **Causa:** com laço vivo e revelação, a caixa lida por `evaluate` fica
  obsoleta entre a leitura e o clique, e o ponteiro cai fora do link.
- **Conserto:** clicar por locator do Playwright, que espera acionabilidade, com
  `:visible` obrigatório: o ditto emite gêmeos por breakpoint com o MESMO href, e
  o `.first()` cru pega o gêmeo oculto, que nunca fica acionável.
- **Conferir:** clone e original passam no mesmo percurso.

### ⚠️ Casar elemento por texto sozinho pega o ancestral errado

- **Sintoma:** a medição de acordeão clica no lugar errado.
- **Causa:** vários ancestrais começam com o mesmo texto do item, e o primeiro
  que casa costuma ser um container grande que não muda de altura.
- **Conserto:** filtrar também pela **altura medida** (fechada ou aberta, ±3px):

  ```js
  const alvo = candidatos.find((e) => {
    const h = Math.round(e.getBoundingClientRect().height);
    return Math.abs(h - fechada) <= 3 || Math.abs(h - aberta) <= 3;
  });
  ```

- **Conferir:** o elemento clicado muda de altura.

### 🚨 Gêmeo por breakpoint quebra casamento por (tag + texto)

- **Sintoma:** um bloco inteiro (o FAQ) sai sem conserto.
- **Causa:** o ditto emite o mesmo conteúdo duas vezes, um por faixa, com o outro
  em `display: none`. Descartar chave repetida (o reflexo seguro) descarta os
  dois.
- **Conserto:** agrupar por chave e escrever quando TODOS os candidatos do
  original concordam no valor, aplicando a regra a todos os gêmeos.
- **Conferir:** os dois gêmeos recebem a regra.

### 🚨 Casar pela CAIXA erra quando dois elementos têm a mesma caixa

- **Sintoma:** um bloco recebe a borda de outro elemento da mesma caixa e o
  contorno some numa largura; ou a régua acusa borda invisível (alfa 0) e faz
  parecer artefato o que é defeito.
- **Causa:** um bloco com contorno de 1px e o elemento de dentro com borda
  transparente têm a mesma caixa.
- **Conserto:** onde houver empate de caixa, conferir no original quem é quem
  pelo caminho estrutural e escrever a regra com a razão.
- **Conferir:** `scripts/sonda-bordas.mjs` ignora alfa 0 e aceita qualquer
  elemento da caixa empatada; toda explicação de "é do instrumento" se confere
  nas TRÊS larguras antes de entrar no relatório.

### 🚨 Comparar texto por CONJUNTO chama de "ausente" o que é "diferente"

- **Sintoma:** "texto ausente: © <ano> Nome do Dono", parecendo rodapé perdido.
- **Causa:** num `Set`, um texto some e outro sobra; casando por posição, o
  rodapé está na mesma coordenada e o que diverge é o ano.
- **Conserto:** casar texto por posição PRIMEIRO (mesma coordenada, texto outro =
  divergência), e só chamar de ausente o que não tem par de posição nenhum.
- **Conferir:** o relatório diz "diferente" com os dois textos.

### ⚠️ Ler atributo HTML com `["']` nas duas pontas trunca no apóstrofo

- **Sintoma:** a descrição gravada para em "Built with Framer" num texto que
  segue com "'s powerful CMS...". Sem erro.
- **Causa:** `content=["']([^"']*)["']` aceita qualquer aspa e para no primeiro
  apóstrofo do texto.
- **Conserto:** ler até a MESMA aspa que abriu, por backreference:
  `content=(["'])((?:(?!\1).)*)\1`.
- **Conferir:** um texto com apóstrofo sai inteiro.

### 🚨 Comparar valor REESCRITO em runtime lê os dois lados em estágios diferentes

- **Sintoma:** título divergente num clone byte a byte idêntico (md5 conferido);
  o clone aparece como o lado ERRADO, quando está adiantado.
- **Causa:** o script do site reescreve `document.title`. O clone em localhost
  roda o JS antes da leitura; o original vem pela rede e ainda não rodou. A
  diferença medida é a latência. Vale para todo campo que o JS pode reescrever
  (texto de marca vindo de um `config`, ano do rodapé, contador, o que vier de
  `init()`).
- **Conserto:** ancorar os dois lados no mesmo ponto do ciclo de vida, mesmo
  `waitUntil` e mesmo assentamento: `scripts/confere-pareado.mjs`
  (`ASSENTA=3500`), que além do título compara contagem de elementos, imagens
  quebradas, altura, animações vivas, SVGs, fonte, fundo e console.
- **Conferir:** título, contagem de elementos e animações vivas iguais.

### 🚨 `grep` no HTML cru não acha marca PARTIDA entre tags

- **Sintoma:** a varredura por um nome dá zero e o nome continua visível na tela.
- **Causa:** a palavra está partida por tag para estilizar uma sílaba
  (`<b>Mar<i class="or">ca</i>X</b>`), e a mesma palavra aparece partida com tags
  diferentes em lugares diferentes.
- **Conserto:** varrer o texto que o usuário VÊ, com as tags removidas antes:

  ```bash
  sed -e 's/<[^>]*>//g' index.html | sed 's/&nbsp;/ /g' > texto-puro.txt
  grep -oiF "MarcaX" texto-puro.txt | wc -l
  ```

- **Conferir:** serve para qualquer varredura de conteúdo por texto.

### 🚨 Prova pelo ESTADO FINAL aprova curva de animação que é lixo

- **Sintoma:** o hover passa na prova com curvas que crescem ícone a ícone, quase
  só zeros e um salto no fim, onde o código do original diz mola curta com
  rebote.
- **Causa:** a prova comparava só o estado assentado.
- **Conserto:** a curva sai do código, e o TEMPO se prova por série quadro a
  quadro nos dois lados.
- **Conferir:** a série do clone sobre a do original.

### 🚨 Filme por print e medida em tempo real com a máquina ocupada são grossos demais

- **Sintoma:** velocidade de letreiro medida em tempo real abaixo da que o
  código diz; mola de fração de segundo julgada com poucos quadros.
- **Causa:** print a cada ~300ms e screencast do CDP (poucos quadros por segundo
  com a máquina ocupada) não julgam movimento curto.
- **Conserto:** câmera lenta pelo relógio da página (`performance.now`,
  `Date.now`, o carimbo do rAF e os `setTimeout`) mais `Animation.setPlaybackRate`
  do CDP: um filme prova o desenho, as séries provam o tempo.
- **Conferir:** a velocidade medida na câmera lenta bate com a do código.

### ⚠️ Em câmera lenta, a entrega dos eventos vira dezenas de ms

- **Sintoma:** a mesma série dá o clone atrás numa rodada e à frente na outra.
- **Causa:** a 0,1 da velocidade, 3ms reais de atraso na entrega de um clique ou
  giro de roda viram 30ms no relógio da página.
- **Conserto:** contar o tempo a partir do primeiro evento que CHEGA à página
  (listener em captura).
- **Conferir:** repetir a série antes de chamar de defeito: folga que muda de lado
  é ruído.

### ⚠️ Temporizador agendado ANTES da câmera lenta dispara logo e inventa uma troca

- **Sintoma:** a série mostra o clone trocando duas vezes seguidas no começo.
- **Causa:** o `setTimeout` foi agendado no relógio normal e dispara logo depois
  de ligar a câmera lenta.
- **Conserto:** ligar a câmera lenta, esperar um ciclo inteiro no relógio lento,
  e só então gravar.
- **Conferir:** a primeira troca da série cai no tempo do código.

### 🚨 Em câmera lenta a HORA do hover do original varia por rodada

- **Sintoma:** a metade do caminho do hover no original cai em horas diferentes
  a cada rodada; o clone é estável.
- **Causa:** o Framer dispara o hover em hora variável sob o relógio desacelerado.
- **Conserto:** a câmera lenta separa com segurança só uma coisa: o clone salta
  (50% em ≤20ms) e o original anima (50% em ≥60ms). A curva fina vem do código.
- **Conferir:** onde a série de um alvo se repete entre rodadas, ela prova.

### ⚠️ Rolagem pela roda com rolagem suave passa do alvo

- **Sintoma:** a navegação do clone "reabre" no filme por causa do instrumento,
  e a posição de partida difere entre os lados.
- **Causa:** com rolagem suave (Lenis), rolar pela roda até um Y e corrigir
  olhando o `scrollY` (que em câmera lenta chega atrasado) passa do alvo e rola de
  volta.
- **Conserto:** número fixo de giros e, para a posição de partida, terminar com um
  `scrollTo` exato.
- **Conferir:** `scrollY` de partida igual nos dois lados.

### ⚠️ Opacidade de `display: contents` não chega aos filhos

- **Sintoma:** a sonda acusa links "invisíveis" que a foto mostra idênticos.
- **Causa:** a sonda multiplicava a opacidade da cadeia e contava um
  `display: contents` com opacidade 0.
- **Conserto:** pular `display: contents` na conta de opacidade efetiva.
- **Conferir:** a sonda concorda com a foto.

### 🚨 Média de diferença de pixels esconde desenho errado

- **Sintoma:** diferença média pequena num filme em que o desenho está errado
  (um avatar escorrega, um rótulo cai em cima do texto).
- **Conserto:** filme se OLHA (folha com os quadros-chave lado a lado); o número
  só serve para achar onde olhar.
- **Conferir:** a folha de quadros revisada a olho.

### 🚨 A régua de efeitos só prova o que ela mesma achou

- **Sintoma:** títulos que no original entram palavra por palavra ficam parados
  no clone, e a prova do gerador passa.
- **Causa:** o levantamento das regras de texto rodou quando a pasta de módulos
  ainda não tinha os módulos daquelas páginas, e a prova (estado de partida igual)
  só olhava os elementos que o gerador tinha achado.
- **Conserto:** baixar o módulo de TODA rota (os `modulepreload` do HTML) antes
  de ler o código. Regerar tudo com um gerador cujo casamento envelheceu não
  serve (ele descarta a rota inteira por uma falha): remendo focado no que falta,
  com prova própria.
- **Conferir:** `scripts/sonda-partida.mjs` compara o DESENHO de partida sem saber
  de efeito: original sem JavaScript contra clone sem JavaScript com a classe de
  JS ligada; quem começa escondido de um lado e não do outro.

### 🚨 A MESMA rota mede diferente sozinha e dentro de um lote

- **Sintoma:** o melhor número da rodada ("4 fora do lugar") numa rota que,
  medida sozinha, dá centenas; `pares` despenca entre rodadas.
- **Causa:** o lado que encolhe é o ORIGINAL: um bloco com centenas de `<span>`
  de uma letra não chega a renderizar antes da colheita quando a rota é a
  primeira de uma sequência de navegações. O clone, servido do disco, colhe quase
  o mesmo nos dois casos; é a assimetria que denuncia.
- **Conserto:** medir a rota suspeita SOZINHA e comparar o total colhido
  (`pares + soNoOriginal`) com o piso de ruído dela.
- **Conferir:** 🚨 célula quase vazia não é aprovação, e número que MELHORA muito
  de repente merece a mesma desconfiança que número que piora.

### 🚨 Clone servindo NADA passa no gate com "0 fora do lugar em 0 casados"

- **Sintoma:** o gate aprova com `casados=0`, `só no original` alto e
  `altura clone=900` (a altura da janela, tamanho da página de erro).
- **Causa:** o servidor do clone morreu no meio da bateria (ou foi derrubado por
  outra sessão); o comparador mede contra `ERR_CONNECTION_REFUSED`, casa zero e
  acha zero fora do lugar.
- **Conserto:** o `compara-geometria.mjs` recusa toda rota com `pares === 0` e
  sai com **código 3**, listando as rotas mudas. Um comparador precisa falhar
  quando não conseguiu comparar, não só quando encontrou diferença.
- **Conferir:** conferir o servidor ANTES de cada bateria longa (seção 13).

### 🚨 O instrumento clica um carrossel e mede OUTRO

- **Sintoma:** passo de slide minúsculo (a deriva do laço entre dois cliques),
  "slides" que são logos SVG com texto vazio, e um runtime inteiro de mentira.
  Nenhuma guarda pega: o passo passa do mínimo e o ciclo "fecha".
- **Causa:** escolher o trilho como o primeiro `<ul>` do documento com pai
  `overflow: hidden` e transform próprio (`uls[0]`) pega um marquee de logos logo
  acima do carrossel, e as setas achadas por `aria-label` dentro do raio de busca
  são as do carrossel.
- **Conserto:** o teste obrigatório é **AUTONOMIA**: trilho que anda sozinho com
  a página parada é marquee e sai da disputa. ⚠️ O teste rola até cada candidato
  antes de amostrar (o Framer pausa laço fora da janela, e medir do topo declara
  "parado" justamente o marquee). O instrumento imprime a escolha:

  ```
  candidato [0] y=8842 itens=45 setas=par a 522px · ANDA SOZINHO (marquee)
  candidato [1] y=8934 itens=20 setas=par a 430px · parado
  trilho escolhido: [1]
  ```

- **Conferir:** ler a escolha impressa antes de confiar no resultado.

### ⚠️ `mede-carrossel` é cego a marquee que está fora da janela

- **Sintoma:** "nada a medir" numa página com um marquee de logos abaixo da
  dobra.
- **Causa:** o `mede-carrossel.mjs` amostra com a página PARADA, e o marquee fora
  da janela pausa.
- **Conserto:** quem pega é o `gera-marquee.mjs`, que ROLA até cada trilho antes
  de amostrar. À mão: rolar até o trilho e amostrar o transform por alguns
  segundos; se anda, é marquee.
- **Conferir:** o inventário de movimento lista o trilho.

### ⚠️ Medir o clone DEPOIS de já ter mexido nele contamina a comparação

- **Sintoma:** o gerador conclui que um elemento "já está pronto" e o pula.
- **Causa:** o clone tinha um conserto anterior (errado) aplicado.
- **Conserto:** antes de remedir para regerar, desfazer o conserto anterior,
  rebuildar e só então medir. O lado a medir fica no estado natural
  (`linha-de-base.mjs`).
- **Conferir:** a linha de base é do clone cru, não de um híbrido.

### 🚨 TRANSFORM ligado à rolagem e a geometria no topo

O comparador fotografa no topo: tudo o que só muda quando entra na janela bate
nos dois lados ali. Ver seção 8, "TRANSFORM LIGADO À ROLAGEM".

### 🚨 O CLONE FECHA NUMA LARGURA SÓ: o celular é outra frente inteira

- **Sintoma:** depois de fechar todas as rotas com zero fora do lugar a 1280px, a
  mesma medição a 375px devolve centenas de elementos fora do lugar. Não é
  regressão: o clone não tinha sido medido nessa largura.
- **Causa:** todo o método (geometria, tipografia, alturas, trilhos) e o gate
  final rodam a 1280 por padrão; alguns instrumentos nem trocam de largura (a
  lista está no `../scripts/LEIA-ME.md`, "Uma LARGURA fechada não é o clone
  fechado"). O `checkup.mjs` imprime a largura no cabeçalho da matriz, mas uma
  matriz verde numa largura só parece uma matriz verde.
- **O que não explica (testado e descartado):** a altura de janela congelada nas
  janelas da captura (`max-md:h-203`, `md:max-lg:h-256`) corrige o herói e quase
  não mexe no total; as larguras sem prefixo que a skill escreve não mudam a
  altura da página; a tipografia com `FAIXA=max-md` não fecha. A divergência do
  celular é **estrutural**: altura da página diferente e centenas de elementos
  deslocados em bloco pelo mesmo valor, a assinatura de contêineres mais curtos
  empilhados.
- **Conserto:** o ciclo inteiro rodado a 375px, com os mesmos instrumentos e a
  mesma disciplina do desktop, não um remendo.
- **Conferir:** o relatório final diz em QUE largura a matriz fechou e declara as
  outras como não medidas, que é diferente de declará-las boas.

### A conferência visual pareada é GATE, não enfeite

- **Sintoma:** defeitos que passam por rota, metadata, conteúdo, geometria de
  elemento e gate de entrada (propriedades de composição, seção vazia, ícone
  vazio, curva errada).
- **Conserto:** abrir clone e original lado a lado, em recortes por seção e por
  tipo de controle, nas larguras do projeto (`compara-visual.mjs` para as
  imagens; o olho para o julgamento). Δaltura de página é o farol barato: quando
  divergir, caçar o excesso por âncoras.
- **Conferir:** o console pareado também é gate barato (seção 4, "`\n` literal
  dentro do `d=`").

### Nem todo erro de console é defeito do clone

- **Sintoma:** erros no console do clone.
- **Causa:** às vezes o erro é do próprio site original, reproduzido fielmente
  (ex.: `<svg> attribute preserveAspectRatio: "true"`).
- **Conserto:** medir os DOIS lados antes de caçar; consertar o erro do original
  afastaria o clone dele.
- **Conferir:** a lista de erros por rota nos dois lados.

### Duas falhas de gate que se dissolvem na investigação

- **Sintoma:** o gate de entrada reprova uma rota com "0/1" ou "sem resultado".
- **Causa:** uma pasta sem `page.tsx` (só diretório com subpastas de rota)
  recebe um CSS que nenhuma página importa, e o arquivo órfão conta como promessa
  não cumprida; ou a rota não tem animação de entrada no original e o arquivo só
  tem cabeçalho.
- **Conserto:** os dois arquivos saem; nenhum é defeito de animação.
- **Conferir:** antes de "consertar" uma falha de gate, descobrir se há o que
  consertar.

### `networkidle` nunca dispara em site com conexão viva

- **Sintoma:** todas as rotas reprovam com
  `Timeout 60000ms ... waiting until "networkidle"`.
- **Causa:** o site mantém conexão aberta (analytics, stream), e a rede nunca
  fica ociosa.
- **Conserto:** a variável `ESPERA`/`NAVEGA` nos instrumentos (o padrão segue
  `networkidle`, para não mudar alvo nenhum) e um tempo de assentamento, senão
  mede a página antes de renderizar.
- **Conferir:** a rota mede com o conteúdo renderizado.

### Playwright: `viewportSize` em `newPage()` é IGNORADO calado

- **Sintoma:** duas sondas "provam" que o original mede outra altura de página
  que o instrumento, e horas se perdem caçando divergência de protocolo.
- **Causa:** `browser.newPage({ viewportSize: {...} })` não é a opção (o nome é
  `viewport`), e o Playwright não avisa: a página abre em 1280×720.
- **Conserto:** `newContext({ viewport })` ou `newPage({ viewport })`.
- **Conferir:** ler `page.viewportSize()` antes de medir.

### 🚨 Instrumento novo herda as armadilhas dos antigos: leia-as ANTES

- **Sintoma:** um instrumento novo repete numa tacada lições que esta página já
  documenta.
- **Conserto:** antes de escrever instrumento, conferir pelo menos: o arquivo
  ACUMULA (seção 12), a especificidade EMPATA (seção 6), mede com a própria
  camada desligada (seção 8), falha quando não comparou (acima), declara em vez
  de cair em número inventado (seção 8, "fallback silencioso").
- **Conferir:** rodar o instrumento duas vezes seguidas e numa rota sem alvo.

---

## 12 · Quando o conserto piora

### 🚨 Corrigir pode PIORAR, e o instrumento tem que perceber sozinho

- **Sintoma:** um elemento que estava alguns px fora do lugar passa a estar
  muito fora, ou some do casamento e a rodada seguinte lê "nada a relatar".
- **Causa:** escrever `left` junto com `right` num elemento de largura automática
  determina a largura pelos dois lados e **esmaga a caixa**. O valor está certo;
  o efeito, não.
- **Conserto, as duas regras em `corrige-geometria.mjs`:**
  1. guardar o que foi proposto e, na rodada seguinte, conferir alvo por alvo; o
     que piorou vai para lista negra e nunca mais é proposto;
  2. **sumir do casamento conta como piorar**: é a regressão que se disfarça de
     sucesso.
- **Conferir:** a lista negra tem o alvo, e a rodada seguinte não o propõe.

### 🚨 O arquivo de correção ACUMULA: reescrever do zero apaga o que funcionou

- **Sintoma:** uma correção que funcionava some na rodada seguinte, num vaivém
  sem fim.
- **Causa:** a regra que funcionou para de ser proposta, porque o elemento não
  está mais fora do lugar, justamente por causa dela.
- **Conserto:** o estado guarda toda regra viva; o CSS é a união delas menos a
  lista negra.
- **Conferir:** a regra da rodada anterior continua no arquivo.

### 🚨 Gerador que PULA o que "já tem" e REESCREVE o arquivo apaga regras

- **Sintoma:** depois de uma rodada, centenas de bordas faltando.
- **Causa:** o gerador rodou contra uma bancada que ainda tinha o arquivo antigo:
  pulou o que "o clone já tinha" (por causa do arquivo) e reescreveu o arquivo sem
  isso.
- **Conserto:** bancada com o arquivo esvaziado, ou saída num arquivo extra só com
  o que falta (`ARQ=bordas-extra.css`, importado depois). Cópia antes de qualquer
  rodada que reescreve.
- **Conferir:** a contagem de regras não cai entre rodadas.

### 🚨 Gerar arquivo GLOBAL numa rota destrói o que outra rota já tinha

- **Sintoma:** depois de propagar a todas as rotas, a nav da home, que estava
  certa, para; cada rota reportou só `0/1 casados`.
- **Causa:** o `scroll.js` é único. Nas rotas em que o casamento não fecha, o
  gerador reescreve o arquivo mesmo assim: `Math.min(...[])` dá `Infinity`, o
  template sai `var LIMIAR = ;`, e o JS quebrado apaga o acerto da home.
- **Conserto:** gerador que escreve arquivo global **não escreve nada** quando não
  tem o que escrever:

  ```js
  if (!casadosOk.length) process.exit(0);          // não toca no arquivo
  if (!Number.isFinite(limiar)) process.exit(1);   // valor inválido nunca sai
  ```

- **Conferir:** depois de propagar, **remedir uma rota que já estava certa**. Se
  regrediu, o gerador está escrevendo onde não devia.

### A camada pode PIORAR a geometria: bloco oculto com caixa 1×1

- **Sintoma:** ao devolver conteúdo que a captura perdeu, os elementos viram
  "só no CLONE" na geometria.
- **Causa:** a receita clássica de "visually hidden" (1×1 com `clip`) dá caixa;
  no original esses itens têm caixa 0×0.
- **Conserto:** `width: 0; height: 0; overflow: hidden`: presente no DOM (conta
  como conteúdo e como link), sem caixa (não entra na geometria). A régua é o
  original, não a convenção que parece boa.
- **Conferir:** os itens contam no `compara-conteudo` e não aparecem no
  `compara-geometria`.

### Contagem de fora do lugar é termômetro, não juiz

- **Sintoma:** entre dois consertos, o de número melhor deixa um defeito que se
  vê.
- **Conserto:** ganha o que devolve a ESTRUTURA, não o que melhora o número (seção
  4, "A captura COLAPSA um slot").
- **Conferir:** olhar o resultado dos dois antes de escolher.

### Correção que funciona cria defeito novo em quem depende do tamanho antigo

- **Sintoma:** depois de devolver altura a seções, o rodapé fica cortado ou
  inalcançável.
- **Causa:** um contêiner de fora travado no tamanho antigo (seção 4, "A cadeia
  de alturas congeladas").
- **Conserto:** liberar o elo seguinte da cadeia.
- **Conferir:** depois de devolver qualquer altura, remedir o `scrollHeight`
  contra o fundo real do conteúdo.

---

## 13 · Servidor, portas e processos

### 🚨 A porta de servir é DISPUTADA: medir sem conferir a identidade mede outro site

- **Sintoma:** catástrofe plausível no gate (milhares de elementos "só no
  clone", rotas em branco com altura igual à janela, Δaltura enorme); ou dezenas
  de 404 em rotas cujo HTML existe no disco e o Node lê sem erro, com `/`
  respondendo 200 e outras rotas não.
- **Causa:** outra sessão tomou a porta e serve OUTRO clone; servidores antigos
  continuam vivos, e o novo morre com `EADDRINUSE` num log que ninguém olha.
- **Conserto:** antes de toda rodada de medição, conferir a identidade do
  servidor (o título da raiz batendo com o site) e servir em porta incomum. O
  `serve-clone.mjs` falha com mensagem explícita e `exit 2` quando a porta tem
  dono.
- **Conferir:** não basta a porta responder 200: o dono do listener é um PID que
  a própria sessão criou.

### ⚠️ Matar processo por porta atinge as sessões IRMÃS

- **Sintoma:** o clone de outra sessão quebra no meio.
- **Causa:** uma API ocupada que parece órfã pode ser de outra sessão.
- **Conserto:** **nunca matar processo por porta.** Subir a própria API e o
  próprio servidor em porta própria (`PORT=`, `PORTA=`) e, antes de usar, conferir
  que o dono do listener é um PID desta sessão; uma irmã pode já ter tomado a
  porta escolhida.
- **Conferir:** `netstat -ano` mostra o PID esperado na porta.

### ⚠️ Encerrar a sessão NÃO mata o servidor que ela subiu

- **Sintoma:** subir o mesmo serviço falha com exit 1 (porta ocupada) enquanto
  o `curl` responde 200: quem responde é o processo antigo.
- **Causa:** servidores de API e estáticos continuam escutando depois do aviso
  de encerramento das tarefas de fundo.
- **Conserto:** antes de acusar defeito, conferir quem tem a porta:

  ```powershell
  netstat -ano | Select-String ":8787|:8080"
  taskkill /PID <n> /F     # só se for um PID desta sessão
  ```

- **Conferir:** o PID dono da porta é o recém-criado.

### 🚨 Processo em segundo plano morre com a sessão

- **Sintoma:** operários longos, provas e servidores morrem juntos quando a
  sessão reconecta; só o log diz onde pararam.
- **Conserto:** gravar cedo, por rota, e manter o ponto de retomada num arquivo de
  continuação; ao voltar, conferir os processos antes de tudo.
- **Conferir:** o arquivo de continuação diz a última rota concluída.

### 🚨 A API local é ASSÍNCRONA: `POST` devolve `queued` e volta na hora

- **Sintoma:** o segundo passo bate em
  `BUSY: another clone is already running — wait for it to finish` e o primeiro
  se perde.
- **Causa:** `POST /v1/clones` responde `{"jobId":"...","status":"queued"}` na
  hora e o trabalho segue em segundo plano; o reuso de captura exige
  `status === "succeeded"`.
- **Conserto:** esperar com `GET /v1/clones/<jobId>` até `succeeded`, e só então
  buscar `GET /v1/clones/<jobId>/result`. É o que o `scripts/clona-completo.mjs`
  faz.
- **Conferir:** o resultado de cada passo antes do seguinte.

### ⚠️ O script `dev:api:stable` que a mensagem de erro manda usar NÃO existe

- **Sintoma:** a mensagem de `BUSY` sugere `npm run dev:api:stable`, e o comando
  falha.
- **Fato:** o script não existe nos `scripts` da raiz nem do workspace
  `@cloner/api`. O que existe:

  | Comando | O que faz |
  |---|---|
  | `npm run dev:api` | `tsx watch`: hot-reload, que **mata o Playwright** no meio do clone |
  | `npm run start --workspace @cloner/api` | `tsx` puro, **sem watch**: é este que se usa |

### ⚠️ O harness de validação não se provisiona sozinho

- **Sintoma:** a suíte imprime `harness npm install failed in <ditto>\compiler\.harness`
  e **pula** o teste de verificação sem falhar; `--validate` não roda.
- **Conserto:** `npm install` dentro de `compiler/.harness` do ditto, sozinho
  (ele falha quando disputa lock do npm com outro processo).
- **Conferir:** a suíte roda o teste de verificação.

### 🚨 `npm run dev` respondendo 200 não prova que o dev funciona

- **Sintoma:** o HTML da rota vem 200 e os pedaços do Next (`main-app.js`,
  `page.css`) dão 404; sem `main-app.js` não há hidratação.
- **Causa:** o dev era um processo antigo, e cada `next build` reescreveu a
  `.next` que ele usava (os dois dividem a pasta); o dev novo nem subiu (porta
  ocupada).
- **Conserto:** build só com o dev fechado.
- **Conferir:** a prova do editável abre a página no navegador, lista toda
  resposta ≥ 400 e confere que o dev de agora é o processo dono da porta.

---

## 14 · Shell, arquivos e edição

### 🚨 No PowerShell, saída em stderr NÃO é falha

- **Sintoma:** um clone bem-sucedido imprime no meio
  `node.exe : ... CategoryInfo : NotSpecified ... NativeCommandError`.
- **Causa:** o PowerShell embrulha cada linha de stderr do executável em
  `ErrorRecord`. Um `git clone` bem-sucedido produz o mesmo ruído.
- **Conserto:** julgar pelo exit code e pelo evento `done`, nunca pela presença
  desse texto.

### ⚠️ `| Out-String` esconde o progresso de comando longo

- **Sintoma:** o log fica com 0 bytes durante a execução, e varredura travada
  fica indistinguível de varredura lenta.
- **Causa:** `| Out-String` (e filtrar com `Select-String`) segura toda a saída
  até o comando acabar.
- **Conserto:** deixar a saída fluir quando o comando for longo; filtrar depois,
  lendo o arquivo.

### `Select-Object -First` no pipeline do PowerShell MATA o instrumento no meio

- **Sintoma:** exit 255, as últimas rotas não são medidas e o JSON não é gravado,
  parecendo defeito do instrumento.
- **Causa:** `... | Select-Object -First 30` encerra o pipeline quando enche a
  cota e derruba o processo.
- **Conserto:** `-Last`, ou capturar tudo numa variável (ou arquivo) e filtrar
  depois.

### 🚨 Variável reservada do shell escreve LIXO dentro do arquivo gerado

- **Sintoma:** uma regra some do CSS buildado (o acordeão de uma rota morto, o de
  outra vivo), sem quebrar o build; no fonte aparece uma linha com o diretório do
  usuário no meio do CSS.
- **Causa:** no PowerShell, `$home` é variável automática somente leitura:
  `$home = @"...CSS..."@` falha e o `Add-Content` grava o valor antigo. O parser de
  CSS engasga e descarta a regra seguinte, calado.
- **Conserto:** não usar `$home`, `$input`, `$args`, `$error`, `$host`, `$pwd` como
  nome de variável; nomes do domínio (`$bloco`, `$regras`).
- **Conferir:** conferir o BUILD, não o fonte; e varrer a camada por lixo de shell
  (`C:\\Users`, `System.Object`, `System.String` não aparecem em CSS legítimo).

### 🚨 Edição em lote com `perl -pi` corrompe acento nos instrumentos

- **Sintoma:** comentários e saída de vários instrumentos com dupla codificação
  (`o clone estÃ¡ completo`); o código roda, então não há erro, só um discreto
  `Wide character in print`.
- **Causa:** substituição cujo texto tem caractere fora de latin-1 faz o Perl ler
  os bytes UTF-8 como latin-1 e regravá-los como UTF-8.
- **Conserto:** editar `.mjs` desta pasta com a ferramenta de edição, um arquivo
  por vez; nada de `perl -pi`, `sed -i` ou substituição em lote em arquivo com
  acento. Para reverter arquivo misto, `iconv` não serve: tratar caractere por
  caractere (code point ≤ 0xFF volta a ser aquele byte, acima disso preserva os
  bytes UTF-8).
- **Conferir:** `grep -l "Ã" scripts/*.mjs` vazio.

### 🚨 Abrir o arquivo para escrita ANTES de ter o conteúdo pronto o apaga

- **Sintoma:** um instrumento vira arquivo vazio, sem mensagem dizendo que sumiu.
- **Causa:** `open(p, "w").write(s)` esvazia o arquivo ao abrir; se o encode
  estoura no `write`, fica zero bytes.
- **Conserto:** montar o conteúdo INTEIRO em memória e só então abrir para
  escrita, ou escrever num temporário e renomear. Para arquivo com acento e
  emoji, a ferramenta de edição do agente, que falha sem destruir o arquivo.
- **Conferir:** tamanho do arquivo depois da edição.

### 🚨 O escape que corrompe CAMINHO do Windows

- **Sintoma:** uma instrução de documento com caminho do Windows que não roda, e
  ninguém vê por quê.
- **Causa:** numa string comum do Python, `\a` é caractere de sino (0x07), e o
  mesmo vale para `\b`, `\f`, `\v`, `\t`, `\n`; caminho do Windows é barra
  invertida seguida de letra.
- **Conserto:** string crua (`r"..."`) ou a ferramenta de edição do agente, que
  não interpreta escape.
- **Conferir:** nenhum arquivo de texto da skill pode conter caractere de
  controle além de tab e quebra de linha; a varredura pega a classe inteira:

  ```python
  for ch in open(p, encoding="utf-8").read():
      if ord(ch) < 32 and ord(ch) not in (9, 10, 13):
          print("controle", hex(ord(ch)), "em", p)
  ```

  Rodar em toda a skill depois de qualquer edição em massa: zero ocorrências.

### ⚠️ `existsSync(caminho)` não distingue arquivo de pasta

- **Sintoma:** `ROTAS="/"` (só a home) estoura com `EISDIR`.
- **Causa:** instrumentos que aceitam `ROTAS=` como arquivo JSON ou lista separada
  por vírgula decidiam por `existsSync(r)`, e a raiz do disco existe.
- **Conserto:** exigir arquivo: `if (existsSync(r) && statSync(r).isFile())`.
- **Conferir:** `ROTAS="/"` mede a home.

### 🚨 No Git Bash, `ROTAS=/` vira caminho do Windows e a rota some

- **Sintoma:** a bateria mede uma rota chamada `C:/Program Files/Git/` e responde
  `0/1`, sem estourar: falha calada que parece defeito do clone.
- **Causa:** o MSYS converte `/` no caminho do Git antes do Node ver; aí
  `existsSync` dá true, `isFile()` dá false, e o carregador cai no `split(",")`.
  ⚠️ `MSYS_NO_PATHCONV=1` não resolve: desliga a conversão para tudo, e o próprio
  caminho `/c/Users/...` do script deixa de ser traduzido.
- **Conserto:** gerar a `rotas.json` de verdade com o `levanta-rotas.mjs` e passar
  o arquivo, também em site de rota única: a lista-mestra é o contrato.
- **Conferir:** a tabela da bateria lista rotas, não caminhos.
