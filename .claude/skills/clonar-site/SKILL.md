---
name: clonar-site
description: "Clona site inteiro em Next.js, com cobertura medida; o que só existe em vídeo ou imagem (Dribbble) se reconstrói dos quadros. Use para \"clona esse site\", \"recria essa landing\", \"quero o código desse site\" ou /clonar-site."
---

# /clonar-site — site inteiro virando código rodando

> 🚨 **Primeiro: o site existe no ar?** Link de Dribbble, Behance ou Muzli, vídeo,
> gravação de tela ou print **não é site**: pare aqui e abra
> [`referencias/de-video.md`](referencias/de-video.md). Ele é completo sozinho
> (régua, instrumentos, caminho); nada abaixo desta linha vale naquele modo.
> O resto deste arquivo é o clone de site publicado, pelo ditto.

A ferramenta é o **ditto.site** (open source). Ela não é um LLM
escrevendo página: captura o que o navegador renderizou e gera código daquela
captura.

**Ela mora FORA deste repositório**, e é de propósito: cada clone gera um
projeto Next inteiro, e isso não pode nascer dentro de uma pasta sincronizada
por nuvem. Convenção: `~/dev/ditto` (no PowerShell, `$HOME\dev\ditto`); em <!-- caminho futuro: fora do workspace, onde a pessoa instala o ditto -->
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
| 3 | **Geometria** — **cada elemento** no lugar, e o que a caixa não mostra | **`compara-geometria`** + `corrige-geometria`; borda, escala, coluna e sombra: `sonda-bordas`, `sonda-escala-congelada`, `sonda-coluna-quebrada`, `sonda-sombra-repouso` |
| 4 | **Conteúdo** — texto, imagens, links | `compara-conteudo` + `corrige-texto` |
| 5 | **Interação** — hover, clique, teclado | `mede-interacao` + `gera-interacao` |
| 6 | **Movimento** — load e scroll, em todas as rotas | `gera-scroll` + `gera-entrada` + `confere-entrada`; entrada que nenhum gerador achou: `sonda-partida`; descendo e subindo: `sonda-ida-volta` |
| 7 | **Navegação** — ir de página a página | `NavegacaoClient` escrito à mão no layout (nenhum script o gera), medido nos dois lados pelo `mede-navegacao`; a transição da troca (View Transition do Framer), pelo `sonda-transicao-pagina` |

🚨 **A dimensão 3 se mede elemento a elemento, nunca por agregado.** O
`compara-visual` pode dar **todas as medições com Δaltura 0px** numa página
visivelmente desmontada (nav e FAQ fora do lugar). Altura de página e fontes são
agregados: o que um elemento perde, o vizinho ganha. Quem decide é o
`compara-geometria`, que na mesma página e no mesmo instante acusa **cada
elemento fora do lugar**.

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
pegam defeito que passa por TODAS as sete:

| gate | reprova quando | custo |
|---|---|---|
| **link interno** | existe `href` apontando para o domínio do ORIGINAL | um `grep` |
| **console do navegador** | o clone tem erro que o original não tem | um `page.on("console")` |
| **conferência visual pareada** | o olho vê diferença em repouso, rolado, em cada viewport | dois screenshots |

Links internos vazando para o original (aos milhares num site grande), erros de
`<path>` que impedem o SVG de desenhar e propriedades de composição perdidas
passam pelas sete dimensões: **só esses três gates os acusam**.

O que o método alcança num site Framer: quase todas as rotas com zero elemento
fora do lugar, as restantes nomeadas com a causa, Δaltura 0px e conteúdo sem
divergência em todas. Rota que não fecha sai declarada, nunca escondida.

---

## 🚨 A captura perde as propriedades de COMPOSIÇÃO — e nenhum gate acusa

Vale sobretudo para alvo Next.js + Tailwind. O ditto materializa
quase todo o estilo, mas some com uma família inteira: as propriedades que
dizem **como combinar** ou **como distribuir** — nunca as que dizem tamanho ou
cor. Por isso passam por todos os gates.

| propriedade | original | clone | o que se via |
|---|---|---|---|
| `paint-order` | `stroke` (em todo texto com contorno) | `normal` | **o contorno come a letra**: texto vazado, quase ilegível |
| `mask-composite` | `intersect` (em algumas rotas) | `add` | a máscara não recorta: padrão decorativo aparece onde devia sumir |
| `column-count` | `4` (rodapé) | `auto` | as colunas empilham: **centenas de px a mais de altura de página** |
| padding lateral | 1× no celular | 2× | o dobro do recuo e menos largura de texto em toda página |

🚨 **Nenhuma delas é acusada por rota, metadata, conteúdo, geometria de
elemento ou pelo gate de entrada.** A caixa é a mesma, o texto é o mesmo, a cor
computada é a mesma. Três só aparecem na **conferência visual pareada**; a
quarta, porque a **altura da página** diverge, e mesmo assim é preciso caçar
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

A maior parte dos números e seletores vem de sites Framer, e o resto, de sites
Next.js + Tailwind + tw-animate-css de muitas rotas, que mostram o que só
aparece fora do Framer: a família de defeitos de composição acima, a **classe de animação órfã** (a
classe vem no JSX, o CSS que a implementa não), a **colisão de variáveis entre
lotes** e a captura em lotes. Isso tem duas consequências, e as duas importam:

**O que generaliza:** o método. A escada do diagnóstico, os quatro controles de
medição, as regras de conserto e a triagem de sintoma para classe de defeito
valem em qualquer site — são sobre como medir e como decidir, não sobre o
Framer.

**O que NÃO generaliza:** os números e os seletores. `64px`, `top: 824px`,
`--framer-font-size`, `data-cid`, os limiares de 80 e 360px: tudo isso é do site
em que foi medido. Um clone de Webflow, WordPress ou site feito à mão vai ter outras classes
de defeito, e algumas destas não vão aparecer.

⚠️ **Portanto: ao clonar um site de outra origem, medir de novo do zero.**
Reaproveitar número de um site em outro é exatamente o erro que esta skill
inteira existe para evitar. Se aparecer classe de defeito nova, ela entra em
`armadilhas.md` com a prova, como todas as outras entraram.

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

Na mesma página, no mesmo instante, a linha de base separa as duas culpas:

| | elementos fora do lugar |
|---|---|
| clone COM a camada desta skill | total |
| clone PURO, camada desligada | o que é da captura |
| a diferença | o que a camada **acrescenta** |

Sem esse número, as horas seguintes se gastam perseguindo defeitos **da
camada** achando que são da captura. O que a camada acrescenta costuma ser de
quatro tipos: regra de scroll empurrando a nav, acordeão encolhendo itens,
entrada apagando o posicionamento de base, e um conserto **pior** do que não
fazer nada.

🚨 **Se a camada piora, ela sai antes de qualquer outra coisa.** Não se
investiga divergência em cima de uma camada que está criando divergência.

O método completo — a escada do diagnóstico, a triagem de sintomas e os quatro
controles que validam uma medição — está em
[`referencias/diagnostico.md`](referencias/diagnostico.md).

---

## 🚨 A regra que define esta skill: 100% das rotas

**O modo padrão do ditto não serve, e não é questão de configurar.** Num site
com coleção (blog, projetos), `--mode=multi` entrega menos da metade das rotas,
algumas delas página de erro, e termina em **exit 0 sem avisar nada**.

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
| Molde editável para reuso ("deixa editável", "vira molde", traduzido) | a pasta de moldes que o usuário escolher, um repositório por site, reconstruído à mão ou com a captura padronizada: [`referencias/editavel.md`](referencias/editavel.md) |

O material **não versiona** (regra no `.gitignore` da raiz, conferida com
repositório de teste). Versiona o método: este `SKILL.md`, as `referencias/` e
os `scripts/`.

⚠️ **Workspace em pasta sincronizada (OneDrive, Dropbox, iCloud)?** Um clone
traz `node_modules` e milhares de arquivos, e o sincronizador trava neles. Nesse
caso, troque o `$S\clones` do fluxo por uma pasta fora dela (ex.:
`$HOME\dev\clones\<nome>\`) e use esse caminho no `--out`.

⚠️ **`--out` sempre com caminho ABSOLUTO e já nomeado por nós.** O ditto nomeia
a pasta pelo domínio do meio, então todo site do Framer vira `framer/` e o
próximo sobrescreve o anterior. Detalhe e prova em `armadilhas.md`.

---

## Os instrumentos

Todos em [`scripts/`](scripts/), rodam com `node`, usam o Playwright do ditto.
A lista inteira, o que cada um responde, a ordem de uso e as regras que eles
embutem estão em [`scripts/LEIA-ME.md`](scripts/LEIA-ME.md): diante de qualquer
divergência, o primeiro é o `linha-de-base.mjs` (de quem é a culpa?).

---

## O que esperar — e o que não

**Reproduz bem:** layout, tipografia, cores, imagens e fontes materializadas,
responsivo. Num site Framer típico a altura de página bate **ao pixel**, com
todas as famílias de fonte renderizando.

🚨 **O que o ditto entrega de comportamento é ZERO, e pior: o clone nem recebe
mouse.** Os alvos travam em timeout, nenhum clique responde, o FAQ não abre e a
nav não colapsa.

🚨 **E o clone não navega em si mesmo: os links internos apontam para o site
ORIGINAL** (`href="https://<domínio-do-original>/..."`, aos milhares e em todas as
páginas num site grande). É o defeito que menos parece defeito — o clone abre, renderiza igual,
passa em cobertura, metadata, geometria, conteúdo e no gate de animação, e **no
primeiro clique manda o visitante para fora**. O `NavegacaoClient` não salva,
porque ele só intercepta absoluto do mesmo origin. Conserto:
`corrige-links-absolutos.mjs`, sempre, antes de declarar qualquer coisa pronta.

🚨 **E a captura pode congelar a página no estado ROLADO.** A nav sai colapsada
onde o original em repouso a tem expandida, e o que entra ao rolar já nasce
entrado. Por isso a reconstrução escreve **sempre os dois estados**: escrever só
o rolado não faz nada, porque o clone já nasce rolado.

🚨 **E o ditto destrói toda propriedade CSS customizada do estilo inline** ao
converter para JSX: `--framer-font-size` vira `-FramerFontSize`, que não é
propriedade nenhuma, e o navegador descarta a declaração calado. Atinge todas
as rotas, e um título enorme passa a renderizar com o tamanho padrão do
navegador.

Nada disso aparece em medição de rota, de metadata ou de altura de página.
Aparece no olho, na primeira vez que se abre o clone.

Por isso o fluxo tem `corrige-variaveis-css.mjs`, `corrige-interacao.mjs` e toda
a camada de reconstrução. Depois dela, a home cai de dezenas de elementos fora
do lugar para poucos, todos abaixo de alguns px; os elementos de scroll batem com
o original nos dois estados; e a entrada aplica 100% no build.

🚨 **O ditto fotografa UM estado.** Drawer, modal, menu de celular e carrinho
lateral simplesmente não existem no clone. Abrir um drawer de contato no
original cria dezenas de elementos e centenas de caracteres, e nenhuma
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
   número.** Compensar com margem pode dar contagem menor e deixar um
   desalinhamento visível dentro de cada card; devolver o tamanho do slot que a
   captura colapsou pode dar contagem maior, toda com o mesmo deslocamento
   rígido de poucos px, que ninguém enxerga. **Contagem é bom termômetro e
   péssimo juiz.**

**O caminho padrão é o GSAP**, pela skill `gsap`. Lá os módulos são
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
| [`referencias/de-video.md`](referencias/de-video.md) | o site só existe em vídeo ou imagem — o modo vídeo inteiro, com régua e instrumentos |
| **[`referencias/diagnostico.md`](referencias/diagnostico.md)** | 🚨 **o clone está errado e não se sabe por onde começar** — a escada, a triagem e os controles |
| [`referencias/armadilhas.md`](referencias/armadilhas.md) | algo saiu estranho, ou antes de confiar num resultado |
| [`referencias/comportamento.md`](referencias/comportamento.md) | for reconstruir animação |
| [`referencias/operacao.md`](referencias/operacao.md) | instalar, atualizar, ou a ferramenta parou |
| [`referencias/revisao-de-clone.md`](referencias/revisao-de-clone.md) | antes de dizer pronto ou ao revisar um clone: o núcleo que se cola (o que é pronto, na ordem do trabalho) e o anexo de lições por assunto |
| [`referencias/editavel.md`](referencias/editavel.md) | o clone vira molde editável, em português ou para reuso |
