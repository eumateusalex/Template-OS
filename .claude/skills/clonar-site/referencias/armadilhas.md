# armadilhas.md

> Só entra aqui o que **foi medido num clone de verdade**, com a prova do
> lado. Nada de bug herdado de outra instalação: upstream conserta coisa, e
> conserto cego vira o próprio bug.
>
> Os sites medidos aparecem por apelido: `site-exemplo` (Framer, 21 rotas, onde
> a base foi medida), `framer-2` a `framer-9` (outros sites Framer),
> `site-landing` (landing pages com tipo fluido), `site-next` (Next.js +
> Tailwind, 232 rotas) e `site-estatico` (feito à mão, servido cru).

🚨 **Se o clone está errado e você não sabe por onde começar, não é aqui que se
entra** — é em [`diagnostico.md`](diagnostico.md), que tem a triagem de sintoma
para classe de defeito. Este arquivo é a prova de cada uma, para consultar
depois de saber o que se procura.

---

## O índice, por natureza do defeito

### 1 · O que a CAPTURA entrega errado

| Armadilha | |
|---|---|
| A pasta de saída vem do domínio do meio, não do subdomínio | 🚨 |
| O colapso de coleção — a falha calada que importa | 🚨 |
| Toda rota herda a metadata da home, inclusive o `canonical` | 🚨 |
| O `::after` decorativo ENGOLE todo clique da seção | 🚨 |
| O gerador marca link de navegação como `pointer-events: none` | 🚨 |
| A captura congela o elemento no estado JÁ ROLADO | 🚨 |
| `data-cid` COLIDE entre rotas | 🚨 |
| O `:hover` vem com valor capturado NO MEIO da animação | ⚠️ |
| O ditto DESTRÓI toda propriedade CSS customizada do estilo inline | 🚨 |
| A captura COLAPSA um slot para 0×0 e tira o conteúdo do fluxo | 🚨 |

### 2 · Quando a MEDIÇÃO mente

| Armadilha | |
|---|---|
| Agregado passa enquanto a página está desmontada | 🚨 |
| Casar elemento por ÍNDICE entre duas fotos da MESMA página | 🚨 |
| Comparar o repouso com a foto ERRADA esconde comportamento inteiro | 🚨 |
| Animação em LAÇO vira falso comportamento de scroll | 🚨 |
| Animação em laço faz um conserto REAL parecer regressão | 🚨 |
| Voltar ao topo COM UM SALTO não é rolar de volta | 🚨 |
| Medir clique sem restaurar o estado contamina TODO o resto | 🚨 |
| Comparar texto por CONJUNTO chama de "ausente" o que é "diferente" | 🚨 |
| `el.click()` dentro do `evaluate` NÃO aciona framework | 🚨 |
| Casar elemento por texto sozinho pega o ancestral errado | ⚠️ |
| Medir o clone DEPOIS de já ter mexido nele contamina a comparação | ⚠️ |
| Badge de plataforma NÃO é conteúdo do site | ⚠️ |
| Ler atributo HTML com `["']` nas duas pontas trunca no apóstrofo | ⚠️ |
| Comparar valor REESCRITO em runtime lê os dois lados em estágios diferentes | 🚨 |
| `grep` no HTML cru não acha marca PARTIDA entre tags | 🚨 |

### 3 · Quando o CONSERTO piora

| Armadilha | |
|---|---|
| Corrigir pode PIORAR, e o instrumento tem que perceber sozinho | 🚨 |
| O arquivo de correção ACUMULA — reescrever do zero apaga o que funcionou | 🚨 |
| Escrever a altura ABSOLUTA do original quebra o que a captura acertou | 🚨 |
| Regra gerada sem `@media` quebra o celular sem aparecer em medição | 🚨 |
| `to { transform: none }` num keyframe APAGA o transform de base | 🚨 |
| `transform: translateY(...)` SOBRESCREVE o translateX que já existia | 🚨 |
| Gerar arquivo GLOBAL numa rota destrói o que outra rota já tinha | 🚨 |
| O minificador do Next INVALIDA `linear()` e mata a animação calado | 🚨 |
| Runtime JS global não pode carregar dado de rota | 🚨 |
| Esconder por JS depois do load pisca; por CSS sem JS deixa em branco | 🚨 |
| Duas camadas escrevendo a MESMA propriedade brigam em silêncio | ⚠️ |
| Escrever o CSS não o LIGA | ⚠️ |
| Mutar `<html>` antes da hidratação REGENERA a árvore e apaga tudo | 🚨 |
| Variável reservada do shell escreve LIXO dentro do arquivo gerado | 🚨 |
| `IntersectionObserver` no trilho de um marquee nunca dispara | ⚠️ |

### 4 · Comportamento

| Armadilha | |
|---|---|
| O que muda ao rolar é de TRÊS tipos, e tratar como um só quebra | 🚨 |
| `pointer-events` herda, mas o filho SOBREPÕE o pai | ⚠️ |
| Não confundir isso com camada de breakpoint duplicada | ⚠️ |

### 5 · Ferramenta, shell e arquivos

| Armadilha | |
|---|---|
| No PowerShell, saída em stderr NÃO é falha | 🚨 |
| A API local é ASSÍNCRONA — `POST` devolve `queued` e volta na hora | 🚨 |
| Edição em lote com `perl -pi` corrompe acento nos instrumentos | 🚨 |
| Abrir o arquivo para escrita ANTES de ter o conteúdo pronto o apaga | 🚨 |
| `--out` aceita caminho com espaço | ⚠️ |
| `\| Out-String` esconde o progresso de comando longo | ⚠️ |
| O harness de validação não se provisiona sozinho | ⚠️ |
| `existsSync(caminho)` não distingue arquivo de pasta | ⚠️ |
| O `dev:api:stable` que a mensagem de erro manda usar NÃO existe | ⚠️ |
| Encerrar a sessão NÃO mata o servidor que ela subiu | ⚠️ |
| Alvo estático e NÃO-minificado: o ditto é o instrumento errado | 🚨 |
| O clone chama servidor de TERCEIRO em runtime, e nenhum gate pega | 🚨 |
| No Git Bash, `ROTAS=/` vira caminho do Windows e a rota some | 🚨 |
| O mesmo conteúdo pode responder em dois caminhos | ⚠️ |

---

## 🚨 A pasta de saída vem do domínio do meio, não do subdomínio

**Verificado executando a função** `siteName()` de `compiler/src/cli.ts`:

```
https://example.com/                ->  example
https://site-exemplo.framer.website/ ->  framer
https://x.framer.app/               ->  framer
https://blog.example.co.uk/         ->  example
```

A função tira `www.`, corta o TLD e pega **o rótulo seguinte**. Todo site
hospedado em plataforma (`framer.website`, `framer.app`, `vercel.app`,
`netlify.app`, `webflow.io`) colapsa no nome da plataforma.

**Consequência:** dois sites do Framer clonados no mesmo `--out` e o segundo
**sobrescreve** o primeiro. Sem aviso.

**O conserto, e é o padrão desta skill:** dar ao `--out` um caminho já nomeado por
nós, e aceitar a pasta interna que o ditto cria.

```bash
--out="<clones>/<nome-que-eu-escolhi>"
# resultado: <clones>/<nome-que-eu-escolhi>/<siteName>/{app,.clone}
```

Isso resolve dois problemas de uma vez: elimina a colisão **e** mantém estável
o caminho entre rodadas, que é o que o modo de reuso de captura precisa.

---

## ⚠️ `--out` aceita caminho com espaço

**Testado** com caminho que tem espaço no meio, que é o caso comum no Windows.
O clone caiu exatamente no destino pedido. Não precisa de gambiarra de caminho
curto.

---

## 🚨 No PowerShell, saída em stderr NÃO é falha

Um clone **bem-sucedido** (exit 0) imprime isto no meio:

```
node.exe :
No linha:1 caractere:1
    + CategoryInfo          : NotSpecified: (:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
```

É o PowerShell embrulhando cada linha de stderr do executável em `ErrorRecord`.
**Não é erro.** O clone terminou em exit 0 e gerou o app.

**Julgar pelo exit code e pelo evento `done`, nunca pela presença desse texto.**
Um `git clone` bem-sucedido produz o mesmo ruído.

---

## ⚠️ `| Out-String` esconde o progresso de comando longo

`npm test | Out-String` e `npm run clone | Out-String` seguram **toda** a saída
até o comando acabar. Durante a execução o arquivo de log fica com **0 bytes**,
e varredura travada fica indistinguível de varredura lenta.

**Deixar a saída fluir** (sem `Out-String`, sem canalizar pro fim) quando o
comando for longo. Filtrar com `Select-String` também segura — filtrar depois,
lendo o arquivo.

---

## ⚠️ O harness de validação não se provisiona sozinho

A suíte imprime `harness npm install failed in C:\dev\ditto\compiler\.harness` e
**pula** o teste de verificação, sem falhar a suíte. Sem esse harness,
`--validate` não roda.

```bash
cd C:\dev\ditto\compiler\.harness && npm install
```

Detalhe: ele falha quando disputa lock do npm com outro processo. Rodar sozinho.

---

## 🚨 O colapso de coleção — a falha calada que importa

**Medido no site-exemplo**, com `--mode=multi` puro:

```
{"event":"sitemap","urls":21,"sitemaps":1}
{"event":"crawl_done","paths":25}
{"event":"plan","discovered":25,"selected":12,"collections":1}
```

**25 rotas descobertas, 12 selecionadas.** O processo termina em exit 0 e não
emite um único erro sobre as 13 que ficaram de fora.

A causa está em `compiler/src/crawl/routeTemplates.ts`: coleção com **3 ou mais
itens** sob o mesmo segmento vira "a listagem mais **um** representante"
(`instances[0]`). Par de 2 itens é reproduzido inteiro. **Não existe flag na CLI
que desligue** — `--max-collection` limita a listagem, não expande a coleção.

🚨 **Por isso o clone nunca se declara completo pela saída do ditto.** Ele se
declara completo pela **lista-mestra**, medida por fora
(`scripts/levanta-rotas.mjs` + `scripts/bateria-cobertura.mjs`).

---

## 🚨 Toda rota herda a metadata da home — inclusive o `canonical`

**Medido no site do exemplo**, nas 21 rotas do clone completo: o ditto declara
metadata **só** em `src/app/layout.tsx`. Nenhuma `page.tsx` exporta a sua.

Resultado, conferido contra o original: **15 das 21 rotas com `<title>`
errado**, todas com o título da home. Os 10 posts e as 4 páginas de projeto
perderam o título próprio.

E o pior nem é o título:

```json
"alternates": { "canonical": "/" }
```

**Todas as 21 rotas declaram ser a home.** Num site publicado isso é o bastante
para o buscador tratar o site inteiro como uma página só. Junto vão a
`description` e o `openGraph`, todos da home.

**Conserto, e ele é obrigatório antes de publicar qualquer clone:**

```bash
ORIGINAL=<url> APP=<pasta>/app ROTAS=<rotas.json> node scripts/corrige-metas.mjs
```

O instrumento colhe título, descrição, canônico e OpenGraph de cada rota **no
original** e escreve `export const metadata` na `page.tsx` correspondente. É
idempotente e pula, com motivo declarado, página que seja client component
(o Next não aceita metadata ali).

---

## ⚠️ Ler atributo HTML com `["']` nas duas pontas trunca no apóstrofo

Erro que o `corrige-metas.mjs` evita. O padrão

```js
content=["']([^"']*)["']     // ERRADO
```

aceita qualquer aspa para abrir e fechar, e o `[^"']*` do meio para no primeiro
apóstrofo **do texto**. A descrição

> Built with Framer's powerful CMS, it combines...

foi gravada como

> Built with Framer

**Sem erro, sem aviso.** O certo é ler até a MESMA aspa que abriu, por
backreference:

```js
content=(["'])((?:(?!\1).)*)\1
```

---

## 🚨 O `::after` decorativo do ditto ENGOLE todo clique da seção

O defeito mais grave achado até aqui, e o mais invisível: a página parece
perfeita e **nada responde ao mouse**.

O ditto gera pseudo-elementos decorativos assim, em `section`, `nav` e afins:

```
after:content-[''] after:block after:absolute after:inset-0
```

**Pseudo-elemento participa do hit-testing.** Com `absolute` e `inset-0`, esse
`::after` cobre a seção inteira e intercepta o ponteiro de tudo que está
dentro. A prova, do log do próprio Playwright:

```
<section id="pricing" class="... after:absolute after:inset-0">
   intercepts pointer events
```

Efeito medido na home do site do exemplo:

| | Original | Clone |
|---|---|---|
| respondem ao hover | 16 | **3** |
| respondem ao clique | 7 | **0** |
| revelam conteúdo (FAQ) | 3 | **0** |
| travaram em timeout | 0 | **17** |

**Conserto** (`scripts/corrige-interacao.mjs`), e ele não muda **nada**
visualmente — o pseudo-elemento continua sendo pintado igual, só para de
interceptar:

```css
[data-cid]::before,
[data-cid]::after { pointer-events: none; }
```

⚠️ **Como este defeito engana:** um screenshot fica perfeito, a geometria bate
ao pixel, o conteúdo bate 21/21. Nenhuma das dimensões visuais acusa. Só medir
**interação com evento real** encontra.

---

## 🚨 O gerador marca link de navegação como `pointer-events: none`

Medido no clone da home: **5 elementos interativos mortos**, entre eles os links
**"Work"** e **"Services"** da navegação — que no **original respondem a hover
normalmente** (2 propriedades mudando em cada).

Sintoma enganoso: o Playwright fica **4 segundos em timeout** e reporta
"Timeout exceeded", quando a verdade é "este elemento nunca vai aceitar
evento". E `elementsFromPoint` **ignora** elemento com `pointer-events: none`,
então a leitura de pilha sozinha não denuncia — quem aparece no topo é um
ancestral vivo, e o teste de contenção passa.

**Detectar** subindo a cadeia do elemento até o `body` procurando
`pointer-events: none`, e **consertar** reativando só o que é interativo:

```css
a[href].pointer-events-none,
button.pointer-events-none,
[role="button"].pointer-events-none { pointer-events: auto; }
```

⚠️ Não reativar em massa: container decorativo com `pointer-events-none`
costuma estar assim de propósito.

---

## 🚨 `transform: translateY(...)` SOBRESCREVE o translateX que já existia

Elemento posicionado costuma carregar um `translateX` de centralização.
Escrever um `translateY` sozinho apaga ele.

Medido no site do exemplo, na barra de contato:

```
original repouso:  matrix(1, 0, 0, 1, -121.359, 100)
original rolado:   matrix(1, 0, 0, 1, -121.359,   0)   <- só o Y muda

CSS errado:        transform: translateY(-71px)
resultado:         matrix(1, 0, 0, 1,        0, -71)   <- perdeu 121px em X
```

A barra desloca 121px na horizontal sem ninguém pedir, e o Y fica errado
junto.

**Guardar e aplicar o `transform` INTEIRO medido**, nos dois estados. Nunca
montar um deslocamento à mão a partir da diferença de posição.

---

## 🚨 Gerar arquivo GLOBAL numa rota destrói o que outra rota já tinha

O defeito mais traiçoeiro da propagação, porque **quebra o que já funcionava**.

O `scroll.js` é único para todas as rotas (mora em `public/`). Rodando na home,
o gerador escreve `LIMIAR = 360`, correto. Rodando nas outras 20, em nenhuma
delas o casamento fecha, e mesmo assim ele **reescreve o arquivo**:

```js
var LIMIAR = ;    // Math.min() de array vazio
```

`Math.min(...[])` devolve `Infinity`, o template sai vazio, e o JS quebrado
**apaga o que funcionava na home**. O `body` para de receber a classe em
TODAS as rotas — inclusive na que estava certa.

**Regra:** gerador que escreve arquivo global **não escreve nada** quando não
tem o que escrever.

```js
if (!casadosOk.length) process.exit(0);          // não toca no arquivo
if (!Number.isFinite(limiar)) process.exit(1);   // valor inválido nunca sai
```

⚠️ **Como isto engana:** cada rota individualmente reporta `0/1 casados`, que
parece só "não achei nada aqui". Ninguém suspeita que um "não achei" possa
apagar o acerto de outra rota. Só aparece ao medir a home de novo e ver a nav
parada.

💡 Sinal barato: depois de propagar, **remedir uma rota que já estava certa**.
Se ela regrediu, o gerador está escrevendo onde não devia.

---

## 🚨 A captura pode congelar o elemento no estado JÁ ROLADO

Medido: a nav do clone **nasce com 233px**, que é a largura do estado colapsado.
No original ela nasce com 550px e colapsa para 233px ao passar de 360px de
scroll.

Consequência: escrever só a regra do estado rolado **não faz nada**, porque o
elemento já está nele. O clone fica permanentemente no estado final.

**Escrever os DOIS estados:** o de repouso na regra base e o rolado na classe.

```css
[data-cid="n4"]{width:550px;transition:width 74ms ...}
body.ditto-rolado [data-cid="n4"]{width:233px}
```

⚠️ Isso vale para qualquer reconstrução de estado, não só scroll: sempre
conferir em que estado a captura congelou antes de decidir o que escrever.

---

## ⚠️ Medir o clone DEPOIS de já ter mexido nele contamina a comparação

Ao regerar o comportamento de scroll, o clone pode ter um conserto anterior
(errado) aplicado. Medi-lo assim faz o gerador concluir que a barra "já
está pronta" e pular ela.

**Antes de remedir para regerar: desfazer o conserto anterior, rebuildar, e só
então medir.** O lado a medir tem que estar no estado natural.

---

## 🚨 `el.click()` dentro do `evaluate` NÃO aciona framework

Errei nisto **depois** de já ter escrito o aviso no `mede-interacao.mjs` — o que
mostra o quanto é fácil escorregar.

Ao medir a duração da transição do acordeão, disparei o clique de dentro do
`page.evaluate`:

```js
el.click();   // ERRADO: MouseEvent sintético
```

O Framer não respondeu, a altura não mudou, e a duração saiu **0ms** em todos
os itens. O instrumento aborta em vez de gerar com número chutado — que é o
comportamento certo, e impede um CSS inventado de entrar no clone.

O certo é armar o gravador por `evaluate` e disparar o clique **do lado do
Playwright**, que produz evento real:

```js
await page.evaluate(() => { /* arma o rAF que grava a altura */ });
await page.click('[data-acord="1"]');   // CERTO: evento real
await page.waitForTimeout(2100);
const d = await page.evaluate(() => window.__acord);
```

Com o evento real, os mesmos itens mediram **82ms, 98ms e 76ms**.

⚠️ E medir a duração **da primeira à última mudança**, não do clique à última:
o atraso até a transição começar não é parte dela.

---

## ⚠️ Casar elemento por texto sozinho pega o ancestral errado

Vários ancestrais começam com o mesmo texto do item, e o primeiro que casa
costuma ser um container grande que **não** muda de altura: a medição de
acordeão clica no lugar errado.

Filtrar também pela **altura medida** (fechada ou aberta, ±3px) identifica o
item certo:

```js
const alvo = candidatos.find((e) => {
  const h = Math.round(e.getBoundingClientRect().height);
  return Math.abs(h - fechada) <= 3 || Math.abs(h - aberta) <= 3;
});
```

---

## ⚠️ `pointer-events` herda, mas o filho SOBREPÕE o pai

Duas vezes errei nisto na mesma sessão, e as duas de formas opostas.

**Erro 1 — o conserto que não pegou.** A marca `pointer-events: none` não estava
no link, estava num **ancestral**:

```
[1] a "Work"          -> pointer-events:none em p
[5] button "Contact"  -> pointer-events:none em div
```

Uma regra como `a.pointer-events-none{pointer-events:auto}` não casa nada,
porque o `<a>` não tem a classe. Os 5 continuaram mortos.

**Erro 2 — o detector que reprovou o próprio conserto.** Corrigida a regra para
`a[href]{pointer-events:auto}`, os links voltaram a funcionar — e o detector
**continuou dizendo "morto"**, porque subia a cadeia até o `body` procurando
`none` e achava no `<p>`.

**A regra do CSS:** `pointer-events` é herdado, mas um **valor explícito no
filho sobrepõe o do pai**. Um `<a>` com `auto` dentro de um `<p>` com `none`
recebe eventos normalmente.

Portanto:
- **consertar** com seletor no interativo (`a[href]`, `button`, `[role=button]`),
  onde quer que esteja a marca
- **detectar** olhando só o `getComputedStyle` do **próprio** elemento

🚨 A lição maior: **instrumento que reprova um conserto correto é tão caro
quanto conserto que não funciona.** Quando o número não mexe depois de uma
correção que deveria funcionar, desconfiar do medidor antes de insistir no
remédio.

---

## ⚠️ Não confundir isso com camada de breakpoint duplicada

Hipótese **medida como falsa** — fica registrada para ninguém perder tempo com
ela.

Um `<section>` de página inteira no topo da pilha sugere camadas de
breakpoint duplicadas no DOM. Medindo os dois lados:

```
                          clone   original
interativos visíveis        45       48
posições COM duplicata       0        0
camadas grandes com z-index  8        8
```

**Estrutura idêntica, zero duplicatas nos dois lados.** O `<section>` no topo
não era cópia: era o hospedeiro do `::after` decorativo acima.

---

## 🚨 Medir clique sem restaurar o estado contamina TODO o resto

Este erro destrói a medição em silêncio.

O `mede-interacao.mjs` clica em cada alvo para ver o que muda. No
site-exemplo, o alvo `[6]` é o botão **"Contact"**, que abre um drawer lateral.
O drawer **não fecha** com um segundo clique no mesmo botão (fecha no X), então
fica aberto — e a partir dali:

```
[ 7] div   ⚠️ COBERTO por div.framer-QSmo1   ERRO: page.hover: Timeout 5000ms
[ 8] a     ⚠️ COBERTO por div.framer-QSmo1   ERRO: page.hover: Timeout 5000ms
[ 9] button ⚠️ COBERTO por div.framer-QSmo1  ERRO: page.hover: Timeout 5000ms
...
```

**8 alvos seguidos perdidos**, e segue assim até o fim. Pior: cada um
espera 5 segundos por um fracasso garantido.

**Duas defesas, e as duas juntas:**

1. **Ler a pilha ANTES de tentar o hover.** Se o alvo não está no topo em
   `elementsFromPoint`, registrar o motivo e **pular** — não adianta esperar
   timeout de algo impossível.
2. **Recarregar a página depois de todo clique que muda o estado.** Comparar o
   tamanho do texto do body antes e depois; se não voltou, recarregar e
   re-marcar os alvos. Custa uma navegação, e a alternativa é perder a medição
   inteira.

⚠️ **Não confiar no "clica de novo pra fechar".** Muitos overlays abrem por um
elemento e fecham por outro.

---

## 🚨 Comparar texto por CONJUNTO chama de "ausente" o que é "diferente"

O conserto deste erro muda o diagnóstico inteiro.

Juntar o texto de cada lado num `Set` e reportar o que falta dá, nas 21
rotas:

```
texto ausente: "© 2026 Nome do Dono"
```

Parece rodapé perdido. **Não é.** Casando por POSIÇÃO, o que aparece é:

```
y=4883  original: "© 2026 Nome do Dono"
        clone:    "© 2025 Nome do Dono"
```

O rodapé está lá, na mesma coordenada. **O que diverge é o ano.** Como
conjunto, um some e outro sobra, e o defeito real fica invisível.

**Regra:** casar texto por posição PRIMEIRO (mesma coordenada, texto outro =
divergência), e só chamar de ausente o que não tem par de posição nenhum.

⚠️ **Conteúdo por data congela no clone.** O original recalcula o ano; a captura
grava o que estava na hora. Todo clone de site com ano no rodapé nasce com essa
divergência, e ela reaparece a cada virada de ano.

---

## ⚠️ Badge de plataforma NÃO é conteúdo do site

Site em plano grátis de Framer, Wix, Webflow e afins recebe um selo fixo com
link para a plataforma. Medido no site do exemplo, nas 21 rotas:

```
texto:  "Create a free website with Framer, the website builder loved by..."
link:   https://www.framer.com/
posição: fixa no canto (y=861, x=1190)
```

Isso é **propaganda da hospedagem**, não conteúdo do site. Reproduzir num clone
seria carregar publicidade de terceiro numa peça que não é dele.

**Vira residual declarado, nunca defeito a consertar.** O
`compara-conteudo.mjs` tem a lista `RUIDO_PLATAFORMA` e filtra antes de
comparar — sem o filtro, toda rota reprova por um "defeito" que é acerto.

⚠️ Não confundir com o **rodapé real**. Nesse site o copyright do dono
(`© 2026 Nome do Dono`, y=4883, junto de "Pricing", "Blog", "Work") é
conteúdo legítimo, e o badge do Framer é ruído. Os dois apareciam juntos na
lista de faltantes. **Quem separa é a posição:** ruído de plataforma fica em
`position: fixed`, o rodapé fica no fim do documento.

---

## 🚨 `data-cid` COLIDE entre rotas — CSS gerado tem que ser escopado

Verificado no clone daquele site: **`data-cid="n61"` existe nas 21 páginas.**
O contador do gerador reinicia a cada rota.

Consequência real: um `public/entrada.css` ligado no `<head>` do `layout.tsx`
raiz aplica a animação da **home** em **todas as 21 rotas**, animando
elementos que não têm nada a ver.

**O escopo vem de ONDE o CSS é importado**, não do seletor. Gravar o CSS na
pasta da rota e importá-lo na `page.tsx` dela:

```
src/app/entrada.css        <- import "./entrada.css" em src/app/page.tsx
src/app/blog/entrada.css   <- import "./entrada.css" em src/app/blog/page.tsx
```

É o mesmo padrão que o ditto já usa com `ditto.css`. **Provado:** depois de
escopar, `/terms` e `/blog` medem **0 animações** e a home mantém as 12.

⚠️ A lição maior: **seletor gerado tem que ser provado único no escopo onde é
aplicado, nunca presumido.** O `confere-entrada.mjs` acusa cid com mais de uma
ocorrência na mesma rota.

---

## 🚨 O minificador do Next INVALIDA `linear()` e mata a animação calado

Um dos defeitos mais caros, e o mais silencioso.

Molas do Framer chegam pré-amostradas como `linear()` de ~80 pontos. Escrito
assim no fonte:

```css
animation: dittoEntradaBlur 800ms linear(0 0%, 0.0063 1.26%, ...) 0ms both
```

O build sai assim:

```css
animation:dittoEntradaBlur .8s linear(0 0,.0063 1.26%,...) 0s both
```

**O `%` do primeiro stop foi cortado.** `0 0` não é posição válida, a função
inteira fica inválida, e o navegador descarta a **declaração `animation`
inteira**: `getComputedStyle(el).animationName` vira `none`.

Custa **2 dos 12** elementos animados. E não há **nenhum** sinal: build em
exit 0, sem aviso, sem erro de console.

**Conserto:** escrever o primeiro stop **sem posição**. O default já é 0%, e sem
`%` não há o que cortar.

```css
linear(0, 0.0063 1.26%, ...)     /* sobrevive ao minificador */
```

⚠️ Isto só aparece quando o CSS sai de `public/` (copiado verbatim, sem
minificação) para dentro do pipeline do Next. **Mudar de onde o CSS é servido
muda quem o processa** — e o que passava antes pode morrer depois.

🚨 **Por isso `confere-entrada.mjs` existe e é obrigatório:** ele compara o que
o CSS fonte promete com o que o navegador entrega **no build**, e reprova se
alguma regra não aplicou.

---

## ⚠️ O ditto gera `:hover` com valor capturado NO MEIO da animação

Visto no CSS gerado daquele site:

```css
[data-cid=n1318]:hover{filter:blur(4.65735px);opacity:.0685304;...}
```

`blur(4.65px)` com `opacity: 0.068` não é um estado de hover que alguém
projetou — é o elemento **flagrado no meio da animação de entrada** e gravado
como se fosse o estado de hover.

Ou seja: em site animado, os estados de interação que o ditto gera podem estar
**contaminados pelo instante da captura**. Conferir hover contra o original
antes de confiar no que veio.

---

## 🚨 Edição em lote com `perl -pi` corrompe acento nos instrumentos

Um `perl -0pi -e 's/.../.../'` cujo texto de substituição contém um caractere
fora de latin-1 (o `⚠️`) faz o Perl ler os bytes UTF-8 dos arquivos como
latin-1 e regravá-los como UTF-8. Resultado: **dupla codificação em vários
instrumentos de uma vez**.

```
// bateria-cobertura.mjs — o clone está completo?      (antes)
// bateria-cobertura.mjs â o clone estÃ¡ completo?    (depois)
```

O único aviso foi um discreto `Wide character in print at -e line 1`. O código
continuou rodando: o estrago é em comentário e em texto de saída, então **não dá
erro** — só produz console ilegível e arquivo sujo.

**Regra:** editar `.mjs` deste diretório com a ferramenta de edição, um arquivo
por vez. Nada de `perl -pi`, `sed -i` ou substituição em lote em arquivo com
acento.

⚠️ E `iconv -f UTF-8 -t ISO-8859-1` **não** desfaz, se o arquivo tiver ficado
misto (parte dupla, parte correta). A reversão que funciona trata caractere por
caractere: code point ≤ 0xFF volta a ser aquele byte, acima disso preserva os
bytes UTF-8.

---

## ⚠️ `existsSync(caminho)` não distingue arquivo de pasta

Erro cometido em três instrumentos ao mesmo tempo. Eles aceitam `ROTAS=` como
**arquivo JSON** ou como **lista separada por vírgula**, e decidiam assim:

```js
if (existsSync(r)) { /* trata como arquivo */ }
```

Passar `ROTAS="/"` (uma rota, a home) faz `existsSync("/")` devolver **true** —
a raiz do disco existe. O `readFileSync` então estoura com `EISDIR`.

O certo exige ser arquivo:

```js
if (existsSync(r) && statSync(r).isFile()) { ... }
```

---

## 🚨 A API local é ASSÍNCRONA — `POST` devolve `queued` e volta na hora

O `POST /v1/clones` **não** espera o clone. Ele responde
`{"jobId":"...","status":"queued"}` imediatamente e o trabalho segue em segundo
plano.

Consequência medida: disparar o segundo passo logo depois do primeiro bate em

```
BUSY: another clone is already running — wait for it to finish
```

e o primeiro passo se perde. Pior: o reuso de captura exige
`status === "succeeded"`, então nem adianta ter o `jobId`.

**Sempre esperar**, com `GET /v1/clones/<jobId>` até `succeeded`, e só então
buscar o resultado em `GET /v1/clones/<jobId>/result`. É o que o
`scripts/clona-completo.mjs` faz.

---

## ⚠️ O script `dev:api:stable` que a mensagem de erro manda usar NÃO existe

A própria mensagem de `BUSY` acima sugere `npm run dev:api:stable`. **Esse
script não existe** no commit `3860a1a` — conferido nos `scripts` da raiz e do
workspace `@cloner/api`.

O que existe:

| Comando | O que faz |
|---|---|
| `npm run dev:api` | `tsx watch` — hot-reload, que **mata o Playwright** no meio do clone |
| `npm run start --workspace @cloner/api` | `tsx` puro, **sem watch** — é este que se usa |

---

## ⚠️ Encerrar a sessão NÃO mata o servidor que ela subiu

Servidor de API e servidor estático continuaram **escutando** depois do aviso de
encerramento das tarefas de fundo. O sintoma seguinte é confuso: subir o mesmo
serviço de novo falha com exit 1 (porta ocupada) enquanto o `curl` responde 200
— porque quem responde é o processo antigo.

Antes de acusar defeito, conferir quem tem a porta:

```powershell
netstat -ano | Select-String ":8787|:8080"
taskkill /PID <n> /F     # só se realmente precisar derrubar
```

---

## ⚠️ O mesmo conteúdo pode responder em dois caminhos

Ainda nesse site, o crawl descobriu `/projects/axiom` **e** `/axiom` — as
duas formas respondem, o que explica 25 descobertas contra 21 no sitemap.

Ao conferir cobertura, **alias não é rota faltando nem rota sobrando**. Precisa
ser reconhecido como alias, ou a matriz acusa problema onde não tem.

---

## 🚨 Agregado passa enquanto a página está desmontada

`compara-visual.mjs` deu **42/42 medições com Δaltura = 0px** numa home que,
aberta no navegador, estava visivelmente errada: nav 158px fora do lugar, FAQ
146px acima, cards do hero espalhados torto.

Não foi erro do instrumento. Altura de página, marcos de seção e fontes
renderizadas são **agregados**, e agregado não muda quando um elemento anda
para o lado: o que ele perde, o vizinho ganha.

**Regra:** fidelidade visual se mede **elemento a elemento**, com
`compara-geometria.mjs`. O `compara-visual.mjs` continua útil como detector
grosso (altura de página, fonte que não carregou), mas **nunca** como prova de
que ficou idêntico.

Medido no site-exemplo, na mesma home, no mesmo instante:

| instrumento | veredito |
|---|---|
| `compara-visual.mjs` | 42/42, Δaltura 0px — "passou" |
| `compara-geometria.mjs` | **45 elementos fora do lugar** |

---

## 🚨 Casar elemento por ÍNDICE entre duas fotos da MESMA página

Parece seguro: mesma página, mesmo DOM, `querySelectorAll` devolve na ordem do
documento. Não é.

Medido no site-exemplo: entre a foto no topo e a foto depois de rolar, o
**carrossel reordenou os próprios filhos**. Nenhum elemento entrou nem saiu — a
contagem bateu, 1620 dos dois lados — mas a partir daquele ponto todo índice
apontava para o vizinho.

O resultado foi um laudo com cara de verdade: o instrumento concluiu que a
barra "Fale comigo" mudava de `color` para `rgb(0, 0, 238)` (o azul-padrão de
link) e de largura para 490px ao rolar. Estava comparando a barra com um `<a>`
de outro bloco.

**Regra:** carimbar cada elemento UMA vez (`data-dp`) e ler o carimbo nas fotos
seguintes. Elemento sem carimbo entrou no DOM depois e fica de fora — que é o certo,
porque ele não existia no estado de partida.

**Efeito da correção, na mesma página:** os "305 elementos que revelam ao rolar"
viraram **76**, e os 74 recusados por erro de casamento viraram **4**. Os outros
229 eram ruído do índice deslizado.

---

## 🚨 O que muda ao rolar é de TRÊS tipos, e tratar como um só quebra

| tipo | como se reconhece | como se reproduz |
|---|---|---|
| **ALTERNA** | está na janela no topo (ou é `fixed`/`sticky`), dois estados, e **volta** ao repouso | classe no `<body>` por limiar medido |
| **REVELA** | está fora da janela no topo, **ou** muda e não volta | `IntersectionObserver` + estado oculto no CSS |
| **CONTÍNUO** | está na janela e assume 4+ valores ao longo da escada | animação guiada por scroll (`animation-timeline`) |

Errar o tipo produz defeito visível e específico:

- tratar **REVELA** como **ALTERNA**: o elemento **desfaz a entrada** toda vez
  que a página volta ao topo. Medido: os títulos "Latest" e "Projects" ficaram
  com 10px de resíduo e reentravam a cada volta.
- tratar **CONTÍNUO** como **ALTERNA**: o elemento **salta** entre dois valores
  em vez de acompanhar o dedo.
- tratar **ALTERNA** como **REVELA**: a nav nunca colapsa.

🚨 **`fixed`/`sticky` NUNCA é REVELA.** Elemento ancorado na tela não "entra na
tela ao rolar" — ele já está lá. A barra de contato do site-exemplo nasce a
938px numa janela de 900px, e o critério de janela a mandou para o grupo
errado, onde, comparada repouso-contra-repouso, **sumiu do relatório inteiro**.

---

## 🚨 Comparar o repouso com a foto ERRADA esconde comportamento inteiro

Duas fotos servem de destino, e cada tipo pede uma:

- **quem alterna** se vê comparando o repouso com o **fundo da escada** (a
  página rolada e parada lá);
- **quem revela** se vê comparando o repouso com a **página percorrida e de
  volta ao topo**.

Comparar quem alterna contra a página percorrida **não acha nada**: ele já
voltou ao repouso, e a comparação dá zero. A barra de contato some de um
relatório que diz ter varrido 1620 elementos.

---

## 🚨 Animação em LAÇO vira falso comportamento de scroll

Um marquee aparece na escada com `translateX(2278px)` num degrau e `none` no
outro, e o instrumento conclui: "alterna no limiar de 160px". Escrever isso faz
o marquee **saltar 2278px na horizontal** quando o scroll passa de 160.

Ele não mudou por causa do scroll. Mudou porque o tempo passou entre um degrau
e outro.

**O controle é barato e obrigatório:** sem rolar nada, tirar duas fotos
separadas no tempo. O que mudou, mudou por TEMPO, e não entra na conta.
Medido: **30 pares elemento×propriedade** excluídos por este controle numa
página só.

---

## 🚨 Voltar ao topo COM UM SALTO não é a mesma coisa que rolar de volta

`window.scrollTo(0)` vindo do rodapé é **um evento só**. O framework do
original lê direção de scroll e não registra aquilo como "subiu ao topo": a nav
fica colapsada.

Medido: a nav do original ficou em 232.5px depois do salto e em 549.95px depois
de subir em degraus. Com o clone (corretamente) expandido, a comparação acusa
**158.8px de desvio em 6 elementos que estão certos**, e convida a "consertar"
o que já está bom.

**Regra:** o protocolo de assentamento desce em degraus **e sobe em degraus**,
e espera ~1.8s no fim. Estado ambíguo dos dois lados é pior que não medir.

---

## 🚨 `to { transform: none }` num keyframe APAGA o transform de base

O keyframe compartilhado de entrada terminava em `transform: none`. Com
`animation-fill-mode: both`, esse `none` **fica valendo para sempre** — e num
site de construtor o transform de base costuma ser a centralização do elemento.

Medido: `matrix(1,0,0,1,-121.359,100)` virou `matrix(1,0,0,1,0,-71)`, e o
elemento andou 121px na horizontal sem ninguém pedir.

**Conserto:** quando o elemento já tem transform (ou filter), gerar keyframe
PRÓPRIO que **compõe** com a base:

```css
@keyframes dittoEntrada_n1322{
  from{opacity:0;transform:matrix(1,0,0,1,-121.359,100) translateY(20px)}
  to  {opacity:1;transform:matrix(1,0,0,1,-121.359,100)}
}
```

`matrix(...) translateY(20px)` é lista de transform válida e preserva o X.

---

## 🚨 O ditto DESTRÓI toda propriedade CSS customizada do estilo inline

Ao converter HTML em JSX, o ditto camelCasa a chave do objeto de estilo e
**come um dos hífens**:

```
original:  style="--framer-font-size: 296.14px"
clone:     style={{ "-FramerFontSize": "296.14px" }}
```

`-FramerFontSize` não é propriedade CSS nem propriedade customizada (essa
precisa de DOIS hífens). O navegador **descarta a declaração inteira, calado**.

Medido no site-exemplo: o título "JOSEPH" do rodapé renderizou com **12px** onde
o original usa **296.14px** — 259px a menos de altura num bloco de 992px. Não
aparece em contagem de rota, nem de metadata, nem em altura de página (o pai
tem altura fixa). Aparece no olho, imediatamente.

**Alcance: 22 elementos, nas 21 rotas, 155 chaves.** Não é caso de borda.

O conserto (`corrige-variaveis-css.mjs`) tem duas camadas, e a segunda é a que
importa: além de devolver a variável (`--framer-font-size`), escreve **também a
propriedade real** (`fontSize`). Devolver só a variável restaura um valor que
ninguém lê, porque a regra que a consumia morava na folha do construtor, que a
captura não trouxe.

---

## 🚨 Corrigir pode PIORAR, e o instrumento tem que perceber sozinho

Escrever `left: 194.297px` junto com `right: -16px` num elemento de largura
automática determina a largura pelos dois lados e **esmaga a caixa**. Medido: o
elemento saiu de **4.9px** fora do lugar para **160.8px**, com 154px a menos de
largura. O valor estava certo; o efeito, não.

Pior: ele encolheu tanto que **deixou de casar** com o original, e a rodada
seguinte de medição não viu problema nenhum — leu "nada a relatar".

**Duas regras, as duas em `corrige-geometria.mjs`:**

1. Guardar o que foi proposto e, na rodada seguinte, conferir alvo por alvo.
   O que piorou vai para lista negra e nunca mais é proposto.
2. **Sumir do casamento conta como piorar.** É a forma mais perigosa de
   regressão, porque se disfarça de sucesso.

---

## 🚨 O arquivo de correção ACUMULA — reescrever do zero apaga o que funcionou

Uma regra que funcionou **para de ser proposta** na rodada seguinte, porque o
elemento não está mais fora do lugar — justamente por causa dela.

Gerar o CSS só com as propostas da rodada atual apaga tudo que já estava certo:
a correção do `top` da barra de contato, que resolve 100px em 4 elementos,
**some do arquivo** na rodada seguinte.

**Regra:** o estado guarda toda regra viva; o CSS é a união delas menos a lista
negra.

---

## 🚨 Regra gerada sem `@media` quebra o celular sem aparecer em medição nenhuma

`width: 549.953px` medido na nav a 1280px, escrito solto, vale também a 375px.
O clone fica **idêntico no desktop e quebrado no telefone** — a pior
combinação, porque não aparece em nenhuma medição feita numa largura só.

**Regra:** toda regra gerada sai dentro da faixa em que foi medida, nas bordas
que o próprio ditto usa (md=768, lg=1024):

```css
@media (min-width: 1024px) { /* o que foi medido a 1280 */ }
```

E o arquivo se **costura** por marcadores, para a passada do celular não apagar
a do desktop:

```css
/* @ditto-scroll-inicio faixa=(min-width: 1024px) */
...
/* @ditto-scroll-fim faixa=(min-width: 1024px) */
```

⚠️ `:hover` pede mais: `and (hover: hover) and (pointer: fine)`. Sem isso o
estado de hover **gruda no primeiro toque** e só sai quando o dedo toca em
outro lugar.

---

## 🚨 Escrever a altura ABSOLUTA do original quebra o que a captura acertou

Escrever `height: <fechada do original>` no acordeão quebra. Medido: o
original devolve 52px para o item fechado, o clone tem 81px **para o mesmo
item fechado**, e forçar 52px encolhe cinco itens. **O FAQ inteiro sobe
146px** — e a captura tinha acertado o estado inicial sozinha.

O que o original tem de único e confiável é o **DELTA** entre os dois estados.
A altura absoluta vem do clone, do estado que ele já tem, e o outro estado sai
do delta.

E qual estado o clone tem **não se supõe**: compara-se a altura dele com as duas
do original e fica-se com a mais próxima.

💡 O mesmo princípio vale em geral: **o instrumento acrescenta o que falta, não
reescreve o que já está certo.**

---

## ⚠️ Duas camadas escrevendo a MESMA propriedade brigam em silêncio

`entrada.css` e `scroll.css` escrevem os dois `opacity` e `transform`. No mesmo
elemento, quem ganha depende da ordem de import — e a ordem de import não é
decisão de ninguém, é acaso.

**Divisão de território:** a entrada cuida do que anima ao **carregar**; a
revelação por scroll cuida do que anima ao **aparecer na tela**. O
`gera-entrada.mjs` lê o `scroll.css` da rota e cede os cids que ele já
reivindicou.

---

## ⚠️ Escrever o CSS não o LIGA

O Next só inclui no bundle da rota o que a `page.tsx` **daquela rota** importa.
Arquivo solto na pasta não entra em lugar nenhum, e a camada some sem erro em
lugar nenhum.

E o import só pode existir se o arquivo existir: import de arquivo ausente
derruba o build inteiro. Por isso o `liga-css.mjs` cria um arquivo vazio quando
falta, com um comentário dizendo por quê.

💡 E é esse import por rota que resolve a colisão de `data-cid`: como cada rota
importa a SUA folha, o Next gera um bundle de CSS por rota e a regra da home
nunca alcança as outras 20.

---

## 🚨 Runtime JS global não pode carregar dado de rota

Se o `scroll.js` for gerado por rota, a última rota gerada sobrescreve as
outras — o arquivo é um só. A saída é o JS **ler tudo do CSS da rota que está
carregada**:

```css
body { --ditto-limiares: "80 240 360" }   /* quais posições ligam ditto-yNNN */
[data-cid="n212"] { --ditto-revelar: 1 }  /* quem revela ao entrar na tela */
```

O `scroll.js` fica genérico e serve as 21 rotas sem saber o nome de nenhuma.

---

## 🚨 Esconder por JS depois do load pisca; esconder por CSS sem JS deixa em branco

O meio-termo é uma classe posta pelo JS na **primeira linha**, com o `<script>`
no topo do `<body>` e **sem `defer`**:

```js
document.documentElement.classList.add("ditto-js");
```

```css
html.ditto-js [data-cid="n212"]:not(.ditto-revelado){opacity:0;transform:translateY(20px)}
```

- **com JS:** o estado oculto vale já no primeiro quadro — sem pisca, e cobre
  também quem está visível no topo (que esconder por JS depois do load teria
  de pular justamente para não piscar, deixando o topo sem entrada nenhuma).
- **sem JS:** a classe nunca chega e nada fica escondido.

✅ E uma **rede de segurança**: se o `IntersectionObserver` não disparar (aba em
segundo plano ao carregar, elemento de altura zero), tudo aparece depois de 4s.
Conteúdo escondido para sempre é pior que animação perdida.

⚠️ No `prefers-reduced-motion`, desligar animação **sem** devolver o estado
final deixa em tela justamente o estado oculto. E a regra que devolve tem que
mirar **só os alvos de revelação**: um `transform: none !important` em
`[data-cid]` inteiro apaga o translateX de centralização da nav e quebra o
layout de quem pediu menos movimento.

---

## 🚨 Abrir o arquivo para escrita ANTES de ter o conteúdo pronto o apaga

Um script de edição em lote que faz

```python
s = open(p, encoding="utf-8").read()
s = s.replace(velho, novo)
open(p, "w", encoding="utf-8").write(s)   # <- e aqui estoura
```

**trunca o arquivo para zero bytes** se o `write` falhar no meio — o modo `"w"`
esvazia na hora de abrir, antes de escrever coisa nenhuma. Um caractere fora da
faixa faz o encode estourar e um instrumento de 9KB vira um arquivo vazio, sem
nenhuma mensagem dizendo que o arquivo sumiu.

**Regra:** montar o conteúdo INTEIRO em memória, e só então abrir para escrita.
Ou escrever num temporário e renomear. E, para edição de arquivo com acento e
emoji, preferir a ferramenta de edição do próprio agente à substituição por
script: ela falha sem destruir o arquivo.

### E o irmão desse defeito: o escape que corrompe CAMINHO do Windows

Na mesma sessão, um script de edição inseriu no documento a linha

```
cd "$S\clones\$NOME\app"
```

e o que foi parar no arquivo foi `$NOME<BEL>pp`: dentro de uma string comum do
Python, `\a` é **caractere de sino (0x07)**, não barra seguida de "a". O mesmo
vale para `\b`, `\f`, `\v`, `\t` e `\n` — e caminho do Windows é feito de barra
invertida seguida de letra.

O sino não aparece na tela. O documento fica com uma instrução que **não roda**
e ninguém vê por quê.

**Três defesas, nesta ordem:**

1. Para texto com barra invertida, usar string **crua**: `r"..."`.
2. Preferir a ferramenta de edição do agente, que não interpreta escape.
3. **Varrer depois.** Nenhum arquivo de texto desta skill pode conter
   caractere de controle além de tab e quebra de linha — a varredura leva
   segundos e pega a classe inteira de uma vez:

```python
for ch in open(p, encoding="utf-8").read():
    if ord(ch) < 32 and ord(ch) not in (9, 10, 13):
        print("controle", hex(ord(ch)), "em", p)
```

Rodar em toda a skill depois de qualquer edição em massa: a skill inteira tem de dar **zero ocorrências**.

---

## 🚨 A captura COLAPSA um slot para 0×0 e tira o conteúdo dele do fluxo

O card de "post relacionado" do site-exemplo é uma linha simples no original:

```
[ miniatura 64×64 ][ texto 438px ]     total 502px
```

Na captura, o slot da miniatura virou **0×0** — `basis-full` sem largura, com
`aspect-square` aplicado sobre zero — e a imagem passou a ser pintada por cima,
com `position: absolute`.

Duas consequências, as duas medidas nos dois lados:

- o título começava 64px à esquerda, **debaixo da própria miniatura**, com os
  primeiros 64px de cada título ilegíveis;
- a linha do card **perdia altura**, porque quem a sustentava saiu do fluxo.

**Alcance: 6 cards × 10 rotas de post = 60 cards.** Sozinho, respondia por
**207 dos 238** elementos fora do lugar do site inteiro.

**A assinatura é inconfundível, e serve para reconhecer o padrão:**

- vários elementos com **exatamente o mesmo `dx`**, e `dy` pequeno;
- o `dw` deles em **zero** — não mudaram de tamanho, mudaram de lugar;
- o deslocamento **igual à largura de um irmão** que saiu do fluxo;
- e esse irmão medindo **0×0** no clone.

⚠️ **O corretor por cópia de propriedade NÃO acha isto**, e é importante saber
por quê: ele compara valor a valor, e do lado do original o `padding-left` da
coluna de texto é `0px` — igual ao do clone. Não há valor divergente para
copiar. O que existe é uma **diferença de estrutura**, e a correção se
sintetiza a partir da medição, não se copia.

### 🚨 E qual conserto escolher muda o resultado

Duas correções fechavam a horizontal. Medidas as duas, no mesmo arquivo:

| conserto | fora do lugar | como fica o card |
|---|---|---|
| `margin-left: 64px` na coluna de texto | 21 → **9** | horizontal certa, mas a imagem 22px desalinhada do texto **dentro** de cada card — visível |
| `width/height: 64px` no slot da miniatura | 21 → **19** | card internamente correto, e um único deslocamento **uniforme** de 10,2px na lista inteira |

O segundo tem MAIS elementos fora do lugar e é **claramente melhor**: devolve a
estrutura em vez de compensar o sintoma, e o resíduo que sobra é um
deslocamento rígido de 10px que ninguém enxerga. O primeiro tem número melhor e
deixa um defeito que se vê.

💡 **A lição que fica:** contagem de elementos fora do lugar é bom termômetro e
péssimo juiz. Entre dois consertos, ganha o que devolve a ESTRUTURA, não o que
melhora o número.

### E o resíduo era um SEGUNDO defeito de estrutura

Devolvido o slot, sobrou um deslocamento **uniforme de 10,2px** na lista
inteira. Era outra coisa, e a aritmética entrega:

- o contêiner da lista tem **648px**;
- o conteúdo tem **628px** — 6 cards de 88 mais 5 espaços de 20;
- a captura escreveu `justify-content: center`, então os 20px de folga viraram
  **10 em cima e 10 embaixo**;
- o original alinha ao topo, e deixa a folga toda embaixo.

Dez pixels, em dez rotas, em dezoito elementos cada.

⚠️ **Nenhum corretor por cópia de valor acha isso**, porque `justify-content` é
palavra-chave: não há delta numérico para bater com o deslocamento observado. O
que aponta para ele é a **aritmética da caixa** — contêiner menos conteúdo,
dividido por dois. Quando um bloco inteiro está deslocado por metade da folga
do contêiner dele, o suspeito é o alinhamento.


---

## 🚨 Animação em laço faz um conserto REAL parecer regressão

Já está registrado aqui que animação em laço vira falso comportamento de
scroll. O mesmo defeito tem uma segunda cara, pior, no comparador de
geometria: ele **polui a contagem** e mente sobre a direção do trabalho.

Medido no site-exemplo, na MESMA rota, no MESMO build, em duas rodadas
seguidas:

| rodada | "design / build / create" | total da rota |
|---|---|---|
| primeira | dentro da tolerância | 19 |
| segunda | **130,9px** fora | 21 |

Nada mudou entre as duas. O que mudou foi o instante da foto: as três palavras
são um rotador, e a posição delas depende de quando se olha. Somadas ao site
inteiro, essas três palavras por rota deslocaram o total em dezenas de
elementos — e fizeram uma correção que funcionou aparecer como piora.

**O controle é o mesmo, e é barato:** sem tocar em nada, tirar uma segunda foto
depois de ~1,6s. O que mudou de lugar sozinho é laço, sai da conta e vai
declarado à parte.

💡 **A regra geral:** antes de comparar dois lados, medir quanto CADA lado varia
sozinho. Diferença menor que a variação própria do original não é diferença — é
ruído, e tratá-la como defeito leva a "consertar" o que está certo.

---

## O ditto ARREDONDA todo tamanho de fonte fracionário

> Medido no clone de `site-landing`. **Não aparece no
> site-exemplo**, e é exemplo concreto de classe de defeito que muda
> conforme a origem do site.

Site com escala de tipo **fluida** (`clamp()`, `vw`) computa `font-size`
fracionário. Ao converter para Tailwind, o ditto arredonda para o inteiro
acima, e leva o `line-height` junto:

| original | clone |
|---|---|
| 15.5px | 16px |
| 17.5px | 18px |
| 20.48px | 21px |
| line-height 25.575px | 26px |
| line-height 31.744px | 32px |

**O estrago não aparece onde se mexeu.** Meio pixel a mais muda o ponto de
quebra da linha: um parágrafo de 4 linhas vira 5, ganha 33px de altura, e
empurra os 14 elementos abaixo dele. O `compara-geometria` acusa 14 elementos
fora do lugar e **nenhum deles é o culpado** — o culpado é o parágrafo, e ele
aparece na lista com `dy=0` e `dh=+33`.

**A assinatura para reconhecer:** vários elementos com o MESMO `dy` rígido,
`dx=0`, logo abaixo de um elemento que tem `dh` positivo do mesmo tamanho.

**A escala:** 381 elementos com tipografia divergente em 3 rotas. Corrigir isso
levou a geometria de 39 elementos fora do lugar para 28, e o Δaltura de uma
rota de 28px para 1px.

### O controle que autoriza escrever

Escrever px fixo onde o original é fluido é inventar número. Antes de cada
regra, o `corrige-tipografia.mjs` confirma que o valor do original é o MESMO em
várias larguras — ou seja, que a escala **trava** naquela faixa. Medido aqui:

| faixa | trava | ainda fluida |
|---|---|---|
| 1280 / 1440 / 1920 | 363 | 18 |
| 320 / 375 / 430 | 325 | 48 |
| **768 / 1024 / 1280 / 1920** | **227** | **110** |

A terceira linha é a que decide: de 768 pra cima a escala **ainda varia**, então
a faixa correta é `min-width: 1280px`, não `min-width: 768px`. Sem esse
controle, 110 regras teriam sido escritas com valor certo para 1280 e errado
para 800. **Quem não trava sai declarado e não é escrito.**

### 🚨 RESOLVIDO: a folha de CSS importada não entrava na cascata

Durante o conserto, 125 regras da /ai-first no mobile simplesmente não
aplicavam, e o caso foi perseguido até o fim:

- a folha estava carregada, `disabled: false`, sem `media` no `<link>`
- `matchMedia("(max-width: 430px)")` respondia `true`
- a regra estava no CSSOM: `[data-cid="n5"][data-cid]{font-size:13.5px !important}`
- o CDP (`CSS.getMatchedStylesForNode`) **não listava a regra** entre as casadas
- tirando a classe do Tailwind do elemento, o valor caía para o herdado (16px)
  em vez do que a regra pedia (13.5px) — ou seja, a regra não estava perdendo
  disputa de cascata: não entrava nela
- o MESMO texto CSS injetado num `<style>` em tempo de execução aplicava na hora

Descartados por medição: meta viewport (os dois lados têm `width=device-width`,
então autoajuste de texto está desligado), build velho (o `!important` estava no
bundle), folha desabilitada, e aninhamento de `@media` (o CSS buildado é plano,
260 chaves de cada lado).

**A saída não foi entender o empacotador, foi trocar o mecanismo de entrega.**
O `entrega-inline.mjs` põe cada folha gerada num `<style>` dentro de um
`layout.tsx` de rota. Resultado imediato: a tipografia divergente da /ai-first
caiu de 127 para 0 no desktop e de 133 para 2 no mobile.

⚠️ **E o caminho de entrega MUDA O RESULTADO, então ele se escolhe medindo.**
A mesma regra de geometria (`[data-cid="n782"]{top:837.5px}`) mede **3**
elementos fora do lugar quando entregue por `import`, e **24** quando entregue
inline. Por isso o `geometria.css` ficou no import enquanto o resto foi para o
inline. Não há caminho universalmente melhor: há o que a medição aprovar.

⚠️ **Corolário desagradável:** com a entrega por arquivo inerte, uma camada
inteira não faz nada e nenhuma medição acusa — o instrumento que a escreve
pode registrar "melhora" que não existe. Sempre
confirmar que a camada APLICOU (o `confere-entrada.mjs` faz isso para
animação; para o resto, remedir depois do build).

---

## O ditto CONGELA tamanho relativo ao viewport

> Medido no site-landing.

O que no original é `height: 100vh` sai como px fixo, do tamanho da janela em
que o ditto capturou:

| viewport | original | clone |
|---|---|---|
| 700 | 700px | **800px** |
| 900 | 900px | **800px** |
| 1100 | 1100px | **800px** |

🚨 **E o estrago aparece LONGE do culpado.** O overlay era o de um modal
centrado: 100px a menos de contêiner subiram o modal 50px, e o
`compara-geometria` acusou **6 elementos do modal** fora do lugar, nenhum deles
o overlay — que não tem texto e nem entra no casamento.

Uma regra (`height:100vh`) levou a /ai-first de 7 para 1 elemento fora do lugar.
Instrumento: `corrige-viewport.mjs`, que só escreve `Nvh` quando a razão
tamanho/viewport é a MESMA em várias alturas medidas.

---

## O ditto perde a LARGURA de elemento decorativo vazio

Elemento sem texto e sem filhos — um pontinho, uma barra — costuma ter `width` e
`height` no original. O ditto emite só a altura, e sem conteúdo que force
largura a caixa colapsa para zero:

| | original | clone |
|---|---|---|
| `/links` | `width: 5px` | **0px** |
| `/ai-first` | `width: 6px` | **0px** |

O crachá que continha o pontinho ficava 5px mais estreito, e a acusação caía no
PAI. Consertar isso zerou a /links.

⚠️ **Escrever o valor DECLARADO, não o renderizado:** o pontinho pulsa com
`transform: scale`, então a caixa medida (4.36) é menor que a largura real
(5px).

Instrumento: `corrige-caixa-vazia.mjs`. Casa elemento sem texto pelo ANCESTRAL
com texto mais próximo, e só usa índice de filho DENTRO de um par já casado.

---

## O ditto congela margem automática em px

Medido: um `span` alinhado à direita tinha, no clone, a classe `ml-[247.7px]` —
a margem calculada na largura de captura. No original o deslocamento é
`704 - 115.77 = 588.23`, que é `margin-left: auto`. Diferença: 340,5px, exatos.

É a mesma família do congelamento de viewport: **valor derivado virando
constante**. Fica declarado neste clone (o `corrige-geometria.mjs` só procura
causa em ancestral, e esta é no próprio elemento).

---

## Desbloquear interação demais é tão errado quanto de menos

O `corrige-interacao.mjs` revive todo interativo com uma regra larga, porque o
clone nasce sem receber mouse. Ele pode passar do ponto: revive os controles
de um modal FECHADO.

| /ai-first | original | clone (antes) |
|---|---|---|
| alvos mortos | 6 | **0** |

Fidelidade não é "tudo clicável", é "clicável onde o original é". E essa
divergência é das que enganam: nenhuma medição de rota, metadata, conteúdo ou
geometria acusa, porque a caixa está no lugar certo.

Instrumento: `corrige-inercia.mjs`. Procura no original camada com
`pointer-events:none` **e** `opacity:0` (assinatura de camada fechada, não de
decoração) que contenha interativo, e devolve a inércia ao clone. Depois dele,
/ai-first bate exato: 10 alvos, 6 cobertos, 6 mortos dos dois lados.

---

## 🚨 Mutar o `<html>` antes da hidratação REGENERA a árvore e apaga TUDO

> Medido no framer-5. É o defeito mais caro desta skill, e
> o mais silencioso: **a página funciona por três segundos e depois desmonta.**

O `scroll.js` põe `ditto-js` no `<html>` na primeira linha — é o que evita o
pisca do estado oculto. Mas no App Router **o `<html>` pertence ao React**, que
o hidrata. Ele encontra um atributo que não renderizou, declara falha e
**regenera a árvore inteira no cliente**.

A linha do tempo, medida com um carimbo no nó e leituras em pontos fixos:

| instante | classe `ditto-js` | filhos do trilho | nó do ticker |
|---|---|---|---|
| 432ms (`interactive`) | **sim** | 3 | o original |
| 1703ms | **sim** | **12** (o runtime já duplicou) | o original |
| 3533ms (hidratou) | **NÃO** | **3** (voltou) | **outro objeto** |

Ou seja: a camada inteira de comportamento é montada e depois **desfeita**, sem
erro nenhum no console em produção (o React minifica a mensagem para o código
#418). O servidor de desenvolvimento dá o texto completo, e o diff aponta o
atributo exato:

```
<html lang="en"
-   className="ditto-js"
```

**O conserto é `suppressHydrationWarning`** no `<html>` **e** no `<body>` — os
dois elementos que os runtimes marcam. É a mesma marca que o `next-themes`
exige, e pelo mesmo motivo. Depois dela o erro cai da variante fatal
("this tree will be regenerated") para a inócua ("won't be patched up"), e as
mutações sobrevivem.

⚠️ **E `suppressHydrationWarning` NÃO cobre os descendentes.** Ele vale só para
o elemento em que está. Por isso todo runtime que muta o DOM (duplicar filhos,
trocar texto, pôr classe em elemento comum) tem de rodar **depois** da
hidratação — num efeito de componente cliente, nunca no evento `load`. Medido:
o `load` disparou aos 452ms e a hidratação só terminou aos 3,5s.

💡 O par disso é a dimensão 7: esse mesmo componente cliente religa os runtimes
a cada troca de rota, que é o que impede a segunda página de nascer morta.

---

## 🚨 Variável reservada do shell escreve LIXO dentro do arquivo gerado

Este erro **quebra o CSS sem quebrar o build**.

No PowerShell, `$home` é variável automática (o diretório do usuário) e é
**somente leitura**. Uma linha assim:

```powershell
$home = @"...bloco de CSS..."@        # falha, e a mensagem passa batida
Add-Content -Path $arquivo -Value $home
```

falha na atribuição e **grava o valor antigo** — `C:\Users\<você>` — no meio do
arquivo. O resultado:

```css
}
C:\Users\<você>

/* Alvos do runtime ... */
@media (min-width: 1024px) { ... }
```

O parser de CSS engasga e **descarta a regra seguinte**, calado. Medido: das
duas marcações escritas no fonte, **só uma sobreviveu ao build**, e o acordeão
da home ficou morto — enquanto o do FAQ, escrito pelo mesmo caminho mas sem o
lixo, funcionava perfeitamente.

**Três defesas:**

1. Não usar `$home`, `$input`, `$args`, `$error`, `$host`, `$pwd` como nome de
   variável no PowerShell. Prefira nomes do domínio (`$bloco`, `$regras`).
2. **Conferir o BUILD, não o fonte.** O fonte tinha as duas marcações; o bundle
   tinha uma. Só quem lê o CSS buildado vê isso.
3. Varrer a camada por lixo de shell depois de escrever em lote:
   `C:\\Users`, `System.Object`, `System.String` não aparecem em CSS legítimo.

---

## ⚠️ `IntersectionObserver` no trilho de um marquee nunca dispara

Pausar animação fora da tela é certo e barato — mas **observar o elemento
errado deixa a animação pausada para sempre**, e o sintoma engana: os filhos
duplicam, a animação existe em `getAnimations()`, e nada anda.

A causa é que o `IntersectionObserver` cruza os **dois eixos**, e o trilho de um
marquee vive deslocado para fora da janela na horizontal. Medido no framer-5:
o trilho está em `x=-3660` com 1220 de largura, ou seja, termina em `-2440` —
nunca intersecta, por mais que a seção esteja visível na tela.

**Observar o ancestral visível**, subindo do trilho até achar quem cruza a
janela na horizontal:

```js
var vigiado = ul;
for (var g = 0; g < 6 && vigiado.parentElement; g++) {
  var cx = vigiado.getBoundingClientRect();
  if (cx.right > 0 && cx.left < innerWidth) break;
  vigiado = vigiado.parentElement;
}
```

⚠️ **E o passo do loop se mede ANTES de duplicar os filhos.** Medir depois, por
`offsetLeft`, deu **zero** neste site: os `<li>` têm largura 0 e quem carrega o
conteúdo é o filho interno (medido: `li w=0`, `inner w=1220`). O `scrollWidth`
do trilho antes da duplicação é o ciclo, e é o número certo.

---

# Armadilhas do framer-3

## O ditto SANITIZA slug com percent-encoding e parênteses

Medido: 6 dos 14 slugs do blog saíram do clone com outra grafia —
`%E2%80%99` virou `-E2-80-99` e os parênteses sumiram
(`...-(before-it-becomes-a-crisis)` virou `...-before-it-becomes-a-crisis`).
O `corrige-metas.mjs` acusou: "page.tsx não existe (rota não foi clonada?)"
em 6 rotas que FORAM clonadas — com outro nome.

Conserto que funcionou: renomear a pasta da rota para o slug DECODIFICADO
(o App Router casa URL percent-encoded com nome decodificado de pasta;
apóstrofo tipográfico e aspas curvas valem em nome de pasta no Windows) e
reescrever os hrefs internos (76 neste site) para a forma do sitemap do
original. Parêntese em MEIO de segmento não vira route group — só segmento
inteiramente `(assim)`.

---

## Altura MISTA h = a + b·viewport congelada no viewport de captura

A classe do site-landing (100vh virando px) tem uma irmã que o modo padrão do
`corrige-viewport.mjs` recusa CERTO e por isso ninguém conserta: altura que é
função afim do viewport, não proporção pura. Medido na home do framer-3:

    seção de features   h = 492 + 5,25·viewport   (6 alturas, 600→1100, reta exata)
    seção sticky-scrub  h = 1290,6 + 0,5·viewport
    cards internos      h = 1,00·viewport cada · camada absoluta 4,00·viewport

O clone congelou tudo a viewport 800 → no gate (900) a página perdia 575px e
271 elementos saíam do lugar. Daí o modo `AJUSTE=linear` (opt-in): aceita a
reta pelos extremos com TODO ponto do meio dentro de TOL, escreve
`calc(a·px + (100b)vh)`, e recusa |b| < 0.02 como fixo.

Três sub-armadilhas medidas na aplicação:

1. **A âncora pode subir pro nível errado.** Na home a regra do neto (432px)
   caiu no filho e o neto ficou sem regra — 60px de degrau interno. Nas
   home-alt a mesma família saiu certa. Conferir o EMPILHAMENTO depois.
2. **Section com overflow-clip engole o crescimento do filho.** Regra no div
   interno (n936) sem regra na section (n935, h congelada) = 152 elementos
   a −50px. A regra tem que subir até quem clipa.
3. **Contêiner flex justify-center esconde o resto.** Os 4 cards congelados
   (4×800=3200) dentro do contêiner já corrigido (3825) centralizavam com
   212,5px de folga em cada ponta. Devolver 100vh a cada card zera a folga
   sozinho — não escrever offset.

---

## Carrossel/fileira MUTILADA: o slide fora do viewport não existe no DOM

O ditto fotografa um instante: dos 4 depoimentos da home sobraram 2, dos 8
cards do time do /about sobraram 5, e a seção sticky-scrub da `/` perdeu o
slide inteiro "Master your cash flow" (no /home-alt ele existe — cada rota
congela num instante diferente). Nenhuma medição de rota/metadata/altura
acusa: o slide ausente não desloca ninguém.

Instrumento: `gera-slides.mjs` — censo no original, clonagem do slide-modelo
do PRÓPRIO clone (as classes utilitárias certas já estão nele), textos,
imagens (baixadas) e diffs de estilo devolvidos por medição. Três armadilhas
DENTRO do conserto, todas batidas:

1. **No clone o trilho pode ter UM filho só** — que é o defeito. Heurística
   de "2+ irmãos parecidos" não acha o trilho no lado doente: sobe-se o
   número de níveis MEDIDO no original.
2. **Parar no primeiro nível que parece trilho** casa par nome/cargo em vez
   do card: fica-se com o nível MAIS ALTO que ainda parece trilho, com teto
   de 85% do viewport pra não "casar" as seções da página.
3. **O slide-modelo do clone pode estar DUPLICADO por breakpoint** (16/2
   textos/imgs onde o original tem 8/1): aplicar por módulo, e declarar os
   diffs de estilo fora (índice de nó não sobrevive à duplicação).

---

## A porta de servir é DISPUTADA — medir sem verificar identidade mede outro site

Entre duas rodadas de gate, outra sessão de clonagem pode tomar a 8081 e
servir OUTRO template. O gate devolve catástrofe plausível: home com 2081
elementos "só no clone", rotas em branco (altura 900), Δaltura −16033 — tudo
medido com competência contra o servidor errado, e a rodada se perde caçando
regressão fantasma.

Regra: **antes de toda rodada de medição, conferir a identidade do servidor**
(título da raiz batendo com o site), e servir em porta incomum. Célula de
medição sem verificação de identidade não é medição.

---

## Playwright: `viewportSize` em newPage() é IGNORADO calado

`browser.newPage({ viewportSize: {...} })` não é a opção certa (o nome é
`viewport`) e o Playwright não avisa: a página abre no default 1280×720 e
toda a medição sai calibrada num viewport que ninguém pediu. Medido: duas
sondas "provaram" que o original media 16112 enquanto o instrumento (com
`newContext({ viewport })`, correto) media 17147 — e o instrumento estava
certo. Horas de caça à divergência de protocolo que era um typo silencioso.

---

## Botão hover-swap congelado no MEIO do hover

Classe recorrente no Framer: botão cujo texto desliza numa janela de clip no
hover. A captura pega o quadro do meio e o repouso do clone nasce errado:

    CTA da nav      original em repouso 32×32 · clone congelou 56px (dx 63px no texto)
    CTA grande      original em repouso 56×56 · clone congelou 34,5% do wrapper
    botões do about janela de clip 24px · clone congelou aberto (dx −56/−25)

Hover medido por rAF no original: 32→134,5px em ~740ms com mola, volta
~700ms com outra curva — as duas viram `linear()` com os pontos amostrados.
Entregar por `<style>` JSX ou public/ (o minificador de CSS invalida
`linear()` sem erro — lição antiga que continua valendo).

---

## Select-Object -First em pipeline do PowerShell MATA o instrumento no meio

`node compara-geometria.mjs | Select-String ... | Select-Object -First 30`
encerra o pipeline quando enche a cota e derruba o processo (exit 255): as
últimas rotas não são medidas e o JSON não é gravado — parecendo defeito do
instrumento. Usar `-Last`, ou capturar tudo numa variável e filtrar depois.

---

# Site Framer nº 2 — framer-2

Site Framer de 39 rotas (clínica odontológica), com os números todos remedidos
do zero, como manda a regra. Classe de defeito e bug de gerador que o
site-exemplo não mostra:

## Seção AFIM no viewport: `h = a + 100vh`, e o `corrige-viewport` recusa (com razão)

Nova face da família "valor derivado virou constante". O `corrige-viewport`
exige razão tamanho/viewport CONSTANTE e por isso recusa a seção que mede
997/1197/1397px nas janelas 700/900/1100: a razão varia. Mas a INCLINAÇÃO é
exatamente 1 — é conteúdo fixo (`a`) somado a um filho de `100vh` que a captura
congelou nos px da janela dela (aqui, 800). Medido na home: hero `100vh` puro
mais duas seções afins, cada uma 100px curta = a cascata de **−300px** que
empurrava a home inteira (222 elementos fora do lugar → 26). O
`corrige-vh-afim.mjs` mede as três janelas, escreve `100vh` no filho congelado E
`calc(a·px + 100vh)` na caixa da seção (as duas congelam), com `!important`
(a classe utilitária do clone, ex.: `h-200`, tem a mesma especificidade).
🚨 **`existsSync("/")` é TRUE no Windows** (raiz do disco): `carregarRotas` de
`ROTAS="/"` precisa de `statSync().isFile()` ou lê um diretório.

## Nome de global com HÍFEN quebra a hidratação de TODAS as rotas

O `captura-estado.mjs` montava `window.__ditto${NOME}` sem sanear: `NOME`
"menu-mobile" virou `window.__dittoMenu-mobile = ...`, e hífen é SUBTRAÇÃO em JS
(`Invalid left-hand side in assignment`). O `<script>` mora no `layout.tsx`
GLOBAL, então o erro derrubava a hidratação do Next em **toda** rota — React
error #418, e por tabela os carrosséis e o marquee ficavam mudos. O sintoma
(#418, movimento morto) não aponta nada para o nome do global; só o
`node --check` de cada JS do `out/` achou. Sanear `NOME` para camelCase antes de
interpolar em identificador. **Regra geral: todo JS gerado passa por
`node --check` antes de confiar no build** — o Next empacota sem reclamar.

## Guard global "roda uma vez" mata o 2º arquivo quando há UM por rota

O runtime do carrossel abria com `if (window.__dittoCarrossel) return`. Servia
quando era um arquivo só; com um arquivo POR ROTA no layout, o 1º script setava
a flag e o 2º retornava antes de registrar (`__dittoCarrosselFns` ficava em 1 em
vez de 2, e o carrossel da 2ª rota nunca montava). Sem erro nenhum. A
idempotência real vem do `data-carrossel` por trilho e do registro na lista —
guard global de arquivo-único é veneno para runtime multi-arquivo.

## IntersectionObserver no trilho TRANSLADADO dá interseção zero

Marquee/ticker cujo trilho tem `translateX(-1276px)`: o box do trilho sai
inteiro da janela e é recortado pelo `overflow:hidden` do pai — o
`IntersectionObserver` observando o TRILHO reporta `isIntersecting:false` mesmo
com os cards à vista, e o laço de animação nunca liga (ticker mudo). Observar o
PAI recortador, que fica no fluxo. Medido: foi a causa de o ticker de preços do
service ficar parado enquanto a home (trilho sem translate grande) andava.

## Ticker: velocidade e período MEDIDOS, e reparo por conjunto saudável

Três lições encadeadas, todas do ticker de preços do service:
1. **Velocidade por trilho, via CSS var medida** (`--ditto-marquee-vel`), nunca
   global: a home anda 75px/s e o service 69,8px/s (medianas rAF).
2. **Período por assinatura de CONTEÚDO, não largura**: todos os 8 cards do
   ticker medem 296px — o detector por largura casa período 1 e erra. Assinar
   por texto+src. E teto do período em `len-2` (não `len/2`): a captura derruba
   item de cauda e o trilho tem menos de 2 períodos inteiros.
3. **A captura MUTILA o meio da sequência** (medido: original A,B,C,D×2; clone
   A,C',D,A,B,C,D — buraco no meio e um título comido). Reconstruir o loop a
   partir do CONJUNTO SAUDÁVEL que o próprio clone contém — e entre as janelas
   candidatas, vencer a de MAIOR texto total: distinção de assinaturas não prova
   saúde, porque a janela que começa no item mutilado também é "distinta".

## Carrossel manual: a captura fotografa UM slide e a virtualização importa

O carrossel de depoimentos não anda sozinho (medido: 35s parado, nada mexe) — é
manual, por setas. A captura materializa só os slides perto da janela (12→3) e
materializar TODOS piora a geometria (99 "só no clone" na home). O runtime imita
a virtualização do original: nasce com os slots e preenche ±2 do corrente. E a
mola/passo das setas saem medidos clicando os controles no original
(`captura-slides.mjs` estendido com guarda de rota + registro aditivo, porque
cid reinicia por rota).

## `DERIVA_MS` de 1,6s não enxerga laço de cadência lenta

O controle de deriva do `compara-geometria` amostra ~1,6s por padrão. Marquee
que pisa a cada 4–6s fica parado dentro dessa janela e passa por estático — e aí
seus itens entram como "fora do lugar" quando a foto pega outra fase. Medir
geometria de página com trilho contínuo pede `DERIVA_MS=8000`.

## Ícone via `<use href="#id">` referenciando símbolo que o ditto NÃO materializa

A face mais traiçoeira do "ditto não traz comportamento", porque é ESTÁTICA e
mesmo assim escapa de toda medição. O Framer desenha ícones (setas de botão,
checks) como `<svg><use href="#id"></svg>`, e injeta por JS um sprite oculto no
`<body>` com os `<svg id="id">` de verdade. A captura traz os `<use>` e NÃO o
sprite: o id fica órfão e o ícone renderiza VAZIO. Medido no framer-2: 18
`<use>` em 2 ids (as setas ↗ dos botões), todas invisíveis. Nenhuma medição de
rota/metadata/conteúdo/geometria acusa — o `<use>` ocupa a caixa certa (21×21,
28×28, opacity 1, visible, mesma posição do original), só não desenha. Só um
screenshot RECORTADO do controle, comparado lado a lado, ou contar `<use>`
órfãos (`!document.getElementById(id)`) encontra. O `recupera-simbolos-svg.mjs`
copia cada `<svg id>` do original para um sprite oculto no `layout.tsx` (conserto
global: os ids são os mesmos em todas as rotas). O stroke usa `var(--x, rgb(0,0,0))`
com fallback preto, então desenha mesmo sem as vars do Framer.

🚨 **A régua de "idêntico" tem um teto que a geometria não vê: o CONTEÚDO do
ícone.** Caixa no lugar, opacity 1, visible — e vazio. Ao final, screenshot
recortado de cada tipo de controle (botão primário, botão de menu, card).

## Botão de menu (hambúrguer) com width:0 — a caixa colapsada de novo

O `<button name="Open & Closd">` do menu saiu da captura com `width:0`; as 3
linhas do hambúrguer (`position:absolute`) ficavam ancoradas num box de largura
zero e sumiam (as linhas EXISTEM, com cor e tamanho certos — engana a sonda que
só olha se o elemento está no DOM). Medido no original: 44×44. Conserto por
`button[name="Open & Closd"]{width:44px}` no CSS GLOBAL: o `name` é estável
entre rotas, enquanto o `data-cid` reinicia — regra por cid precisaria de 39
cópias. Vale a pena procurar `name`/`aria-label`/`data-framer-name` como
seletor estável antes de cair no cid.

## 🚨 O hero `100vh` do Framer sai congelado em px, com breakpoints inventados

Medido no framer-8. A seção de hero do Framer é
`height: 100vh`. O ditto congela isso na altura da janela em que capturou
(`h-200` = 800px) e ainda FABRICA variantes responsivas que não existem no
original: `md:max-lg:h-[...]`, `2xl:h-270` (1080px) — medi 869/800/800/1080 num
hero que no original é `100vh` liso em toda largura. Como isso está no TOPO da
página, os 100px que faltam cascateiam para TUDO abaixo: 705 elementos fora do
lugar, 682 deles um único hero curto por página (home + /about + 8 projetos).

🚨 **A prova que desconfunde:** medir a altura do elemento variando a ALTURA da
viewport com a largura fixa. Se acompanha (700→700, 900→900, 1000→1000), é
`100vh`. Medir só variando a largura ENGANA: com a viewport travada em 900, o
hero dá 900 em toda largura e parece `height:900px` fixo — foi o erro que
cometi antes de variar a altura. O instrumento é o `corrige-viewport.mjs`
(feito pra "100vh congelado em px"); ele acha 1 âncora por página. A IMAGEM
dentro do hero congela junto e precisa da mesma regra (o corrige-viewport
ancora por texto, e imagem não tem — estender à mão pelo cid da img).

## 🚨 Regra que disputa com utilitária do Tailwind não aplica, por import ou inline

O `entrega-inline.mjs` já documenta que uma regra no bundle servido, com
`!important`, seletor casando (`el.matches`=true), folha carregada, NÃO aplica.
No framer-8 isso se repetiu em TRÊS camadas independentes — viewport,
tipografia, hover — e de forma NÃO determinística: a mesma regra aplicava numa
rota e não na outra, ou aplicava 7 de 18 hovers. `CSS.getMatchedStylesForNode`
(CDP) mostra quem ganha: a classe do Tailwind, elemento a elemento (a seção "A
disputa com utilitária do Tailwind é POR ELEMENTO, não por folha").
**Conclusão operacional:** a propriedade que o elemento já tem por classe do
Tailwind se entrega como CLASSE (`aplica-altura-classe`,
`aplica-tipografia-classe`); o resto vai pelo caminho que a medição aprovar,
import (`liga-css`) ou inline (`entrega-inline`), remedindo depois do build. O
inline da HOME (que usa o layout raiz, e o entrega-inline se recusa a
sobrescrever, corretamente) vai no `<style>` do próprio `page.tsx`, que
renderiza só naquela rota (sem vazar data-cid entre rotas).

## 🚨 O runtime de scroll (reveal) fica no public/ mas NÃO linkado no layout

O `gera-scroll.mjs` escreve `public/scroll.js` e o `scroll.css`, mas NÃO liga o
`<script>` no layout — isso é passo à parte (o passo 9 do fluxo). Sem o link:
`html.ditto-js` nunca entra, o estado oculto gateado por essa classe nunca
ativa, e os elementos nascem VISÍVEIS. A geometria PASSA (elemento no lugar
final, visível), o console fica limpo, e a animação simplesmente não acontece —
o defeito mais fácil de não perceber. Diagnóstico: na página servida,
`scripts não-chunk carregados = []`, `html.className = ""`. Conserto:
`<script src="/scroll.js" />` no TOPO do `<body>`, SEM defer (roda antes do
paint). Mesma pegadinha para `menu.js` e `marquee.js` (esses podem ser `defer`).

## ⚠️ mede-carrossel é cego a marquee que está fora da janela

O `mede-carrossel.mjs` amostra com a página PARADA. Um marquee de logos abaixo
da dobra fica fora da janela e (em Framer) pausa — o instrumento declara "nada
a medir" e some com uma animação real. No framer-8 a fila de logos é um
marquee infinito (~10px/s) que o mede-carrossel não viu. Quem pega é o
`gera-marquee.mjs`, que ROLA até cada trilho antes de amostrar. Checagem rápida
à mão: rolar até o trilho e amostrar o transform por alguns segundos; se anda, é
marquee. O runtime do marquee é autoral por clone (como o `lacos.js` do framer-3):
duplica os itens do trilho pra loop contínuo, marca as cópias `aria-hidden`
(senão viram "só no clone" na geometria), e inicia no `window.load` + 2×rAF —
no `DOMContentLoaded` o trilho abaixo da dobra ainda pode ter `scrollWidth` 0 e
o loop de duplicação sai cedo.

## ⚠️ Corrigir tipografia em TODA rota regride o texto longo

O arredondamento de fonte do ditto afeta o site inteiro (1205 elementos no
framer-8), mas só bate no gate de geometria onde o texto é longo e acumula
(os 2 legais, 4-6px). Aplicar o `corrige-tipografia` em TODAS as rotas CONSERTOU
os legais (17→0) e QUEBROU os blogs (0→~103): o line-height corrigido muda o
ponto de quebra de linha do texto longo e desloca as seções seguintes. Total
foi de 40 para 138. **Aplicar a tipografia SÓ nas rotas onde o gate acusa**, não
por princípio. "Camada que piora sai" vale mesmo quando a camada está "correta".

## ⚠️ Matar processo por porta atinge as sessões IRMÃS

A máquina roda várias sessões clonando em paralelo. Uma API ocupada na 8787
parece órfã e pode ser de outra sessão, no meio do clone dela: derrubá-la
quebra o trabalho alheio. **Nunca matar processo por porta.** Subir a própria
API/servidor em porta própria (`PORT=8847`, `PORTA=8151`) e, antes de usar,
conferir que o dono do listener é um PID que a própria sessão criou. A porta
própria é convenção da frota, e uma irmã pode já ter tomado a escolhida.

# Site Framer nº 4 — framer-4

## 🚨 O `gera-entrada` REALIMENTA a própria animação e o desvio se EMPILHA

O instrumento lê o `transform` e o `filter` de base do elemento no clone para
compor o keyframe (existe por causa do defeito "`to { transform: none }` APAGA o
transform de base", acima). Só que com `animation-fill-mode: both` **o estado
final da animação É o estilo computado**. Rodar o instrumento uma segunda vez
sobre um clone que já tem `entrada.css` faz ele ler o próprio `to{}` da rodada
anterior como se fosse base, e gravar `translateY` em cima de `translateY`.

Medido em `/projects`: o clone puro tinha **2 elementos fora do lugar**; depois
da segunda passada foram **42**, todos com o mesmo `dy=+15,5px` — exatamente o
`translateY(20px)` da rodada anterior, parado no estado final. O JSX do elemento
(`n95`) não tem transform nenhum, e o original em repouso mede
`transform: none`: a matriz `matrix(1,0,0,1,0,15.7573)` nasceu inteira dentro do
`entrada.css`. Nas páginas de projeto o mesmo defeito rendeu `dy≈+10px`.

**O sintoma que denuncia:** desvio de mesmo valor, só em `dy`, atingindo em
bloco os elementos que a entrada anima — e um número de geometria que PIORA
depois de uma rodada de conserto que "não tocou em geometria".

**O conserto** está no `gera-entrada.mjs`: antes de ler caixa e base, desligar a
animação de todos os `[data-cid]` por estilo inline (`el.style.animation =
"none"`), forçar o reflow, medir, e restaurar o valor salvo em seguida. Estilo
inline vence a regra da folha, então isso neutraliza qualquer `entrada.css`
anterior sem precisar apagar arquivo. Corrige duas leituras de uma vez: o
transform de base **e** a caixa usada no casamento, que também vinha deslocada.

⚠️ Isso vale para qualquer instrumento que leia estilo computado do clone para
escrever CSS no clone. A regra geral: **medir sempre com a própria camada
desligada** — é a mesma ideia da `linha-de-base.mjs`, aplicada por elemento.

## 🚨 Clone servindo NADA passa no gate com "0 fora do lugar em 0 casados"

Se o `serve-clone.mjs` morre no meio de uma bateria, o
`compara-geometria.mjs` segue medindo as 27 rotas contra `ERR_CONNECTION_REFUSED`,
casa **zero** elemento em cada uma, e portanto acha **zero** fora do lugar —
`process.exit(totalFora === 0 ? 0 : 2)` devolve **exit 0**. O gate mais
importante da skill aprova um clone que não existe.

O sinal está na saída, mas só para quem lê: `casados=0`, `só no original=637`
e `altura clone=900` (a altura da janela, que é o tamanho da página de erro).

**Conserto no instrumento:** antes do `exit`, recusar toda rota com `pares === 0`
e sair com **código 3**, listando as rotas mudas. Medição inválida nunca é
aprovação. Vale a pena repetir a regra em qualquer gate novo: **um comparador
precisa falhar quando não conseguiu comparar**, e não só quando encontrou
diferença.

⚠️ E a causa de fundo: o servidor do clone cai (ou é derrubado por uma sessão
irmã) sem avisar ninguém. Conferir o servidor ANTES de cada bateria longa, e
usar porta própria cujo dono seja um PID desta sessão.

## 🚨 Regra que DISPUTA com utilitária do Tailwind não entra na cascata

É a explicação do "falha de um jeito que não se explica neste build" do
`entrega-inline.mjs`: **o que decide não é a entrega, é se a propriedade
disputa com uma classe do Tailwind.**

Medido no framer-4, no hero da home (`n92`, `100vh` congelado em 800px). A
regra `[data-cid="n92"][data-cid]{height:100vh !important}` foi entregue das
DUAS formas — como arquivo importado e como `<style>` inline no layout da rota
— e nas duas:

- estava no bundle/HTML servido, com `!important`;
- a `@media (min-width: 1024px)` casava (`matchMedia` deu true);
- a folha estava viva e parseada (a regra aparecia em `sheet.cssRules`);
- o seletor casava (`el.matches('[data-cid="n92"][data-cid]')` deu **true**);
- e a altura computada continuava **800px**.

O `CSS.getMatchedStylesForNode` do CDP deu o veredito: para `height`, o
navegador lista **uma** declaração casando com o elemento — a `.h-200` do
Tailwind, dentro de `@layer utilities`. A nossa não aparece na lista. Não é
disputa de cascata perdida: a regra não entra na disputa.

**O contraste que fecha o diagnóstico, no mesmo clone e na mesma entrega:** a
regra de largura do `corrige-largura-secao` (`width:100%`, sem `!important`)
aplicou de primeira e derrubou 9 rotas de ~30 elementos fora do lugar para 2.
Ela não competia com utilitária nenhuma — a largura era o que **faltava** no
elemento. Quem perde é só quem tenta sobrescrever uma classe que já está lá.

**O conserto: entregar como CLASSE, não como regra.** O clone já é construído
com Tailwind, então a altura medida vira `lg:h-[96vh]` no `className` do
próprio elemento: nasce dentro de `@layer utilities`, na mesma disputa, e a
variante mais específica ganha. É o `aplica-altura-classe.mjs`, que lê o
`viewport.css` escrito pelo `corrige-viewport` e o traduz para classe. Medido:
o hero foi de 800px para 900px no primeiro build.

⚠️ A classe antiga **não se remove**: ela continua valendo abaixo de 1024px,
onde a captura mobile já estava certa. Entra `lg:` na frente, e só.

⚠️ Consequência para instrumento novo: antes de escrever regra CSS para uma
propriedade, perguntar **se o elemento já tem classe do Tailwind para ela**. Se
tiver, a entrega é por classe. Se não tiver, o CSS gerado funciona.

## 🚨 A home não tem layout próprio — e por isso ficava de fora da entrega inline

`src/app/layout.tsx` é o layout RAIZ: vale para todas as rotas. O
`entrega-inline.mjs` recusava a home (certo: não é arquivo dele), e embutir o
CSS dela ali vazaria os valores para as outras rotas — e `data-cid` COLIDE
entre rotas, então o `n92` da home viraria o `n92` do /studio.

A saída é o **grupo de rotas** do App Router: `src/app/(inicio)/` serve `/` sem
mudar a URL e aceita um `layout.tsx` só dela. O instrumento cria o grupo
e move para dentro dele a `page.tsx` e as folhas da home, uma vez só; nas
rodadas seguintes o grupo já existe e nada se move. Quem depender do caminho da
home (como o `aplica-altura-classe.mjs`) precisa procurar no grupo primeiro.

⚠️ **E TODO instrumento que escreve folha por rota precisa saber do grupo.** Um
gerador que não sabe dele escreve em `src/app/entrada.css`: recria o arquivo,
ninguém o importa, e a correção parece feita — o `10000ms` que se acabou de
excluir segue vivo na página.

## 🚨 A cadeia de alturas congeladas: cada conserto revela o próximo

No framer-4 a home perdia 200px e o /expertise 96px, e o defeito não era um: era
uma FILA de contêineres travados, um dentro do outro, cada um escondendo o
seguinte. Na home, em ordem de descoberta:

1. o hero (`100vh` congelado em 800px);
2. a seção de depoimentos (`100vh` congelado em 800px);
3. o bloco que contém os depoimentos (`h-[11299.5px]`);
4. o `<main>` e o embrulho da página (`h-[12099.5px]`, `h-[864.7rem]`).

**Por que a fila só se enxerga um elo por vez:** enquanto o conteúdo estava
errado do mesmo jeito que o contêiner, o número FECHAVA. Devolver 100px à seção
é o que faz o conteúdo passar do que o `<main>` travado comporta — e só então o
rodapé sobe e o defeito aparece. Consertar o de fora primeiro também não
resolve: `height:auto` no `<main>` reproduz a altura errada enquanto o de
dentro continua curto.

**Três consequências para o método:**

- **medir de novo depois de CADA conserto**, mesmo que o conserto pareça local;
- a prova de `height:auto` tem de ser **CONJUNTA** na cadeia inteira: soltar um
  nível por vez mede errado, porque o ancestral travado corta o resultado do
  filho recém-solto;
- a unidade varia (`px` num nível, `rem` no outro). Reconhecer só `px` fez o
  instrumento passar direto pelo /studio dizendo "nada a fazer".

O sintoma que denuncia a cadeia: **todas as seções batem de altura e a página
não bate**. Se cada seção mede igual nos dois lados e o total diverge, quem não
bate é o contêiner delas.

## 🚨 O trilho do carrossel vem com o `translateX` do instante da captura

O carrossel de depoimentos da home sai com
`transform-[matrix(1,0,0,1,-6400,0)]` na `<ul>` do trilho — o deslocamento em
que o Framer estava no milissegundo da foto. Resultado: a seção inteira, de
900px e largura cheia, aparecia **VAZIA** no clone, com o único slide
sobrevivente parado em `x=-5120`, fora da tela. Foto de fundo, citação, autora,
setas e pontos: tudo existia no DOM, tudo fora do enquadramento.

Nenhuma medição acusou. Rotas, metadata e conteúdo passaram (o texto ESTÁ na
página); a geometria acusou só 3 elementos "fora do lugar" com `dx=-5120`, que
é fácil confundir com resíduo de animação em laço. **Quem viu foi o olho, na
foto lado a lado.**

O conserto é medido, não chutado: o original em repouso mostra o slide que o
clone tem; os slides medem 1280px; o slide sobrevivente é o 2º dos 3 filhos,
logo o trilho tem de ficar em `-1280` para trazê-lo ao enquadramento. E o
envoltório do trilho estava com `h-200` (800px) dentro de uma seção de 900 —
mesma família da cadeia de alturas.

⚠️ **Lição de método:** ao terminar as dimensões medidas, ABRIR o clone e o
original lado a lado nas seções de altura cheia. Seção que ficou vazia é
invisível para todo gate que conta elemento, porque o elemento está lá.

---

# framer-3: o que só aparece medindo o que foi dado como pronto

> Todas aparecem só ao medir o que foi dado como pronto sem medição. As quatro
> primeiras são invisíveis para os gates de rota, metadata, conteúdo e geometria.

## 🚨 Interceptar o clique e o router não navegar deixa o link MORTO

O componente de navegação client-side cancela o clique e chama `router.push`.
No export estático do Next, o push **não navega** em rota cujo slug tem
caractere não-ASCII: a pasta no disco tem o caractere literal e o href vem
percent-encoded, então a rota não casa no manifesto. Não há erro, não há
pedido de payload, não há nada.

Resultado medido no framer-3: clicar em QUALQUER link interno do clone não faz
absolutamente nada — URL parada, título parado, conteúdo parado. E o clone
passa por pronto se a dimensão 7 não é medida (o instrumento é o
`mede-navegacao.mjs`).

Dois consertos, e o segundo é o que importa:
1. decodificar o pathname antes do push (a forma literal é a do manifesto);
2. **TRAVA**: agendar, ANTES do push, um `setTimeout` de 700ms que compara o
   pathname e cai para `location.href` se nada mudou. Interceptar sem garantir
   chegada é pior do que não interceptar.

⚠️ E o fallback tem que ser agendado **antes** da chamada: agendado depois, o
`router.push` lança, e o timeout nunca chega a existir.

## 🚨 A hidratação do React APAGA a classe que gateia a revelação

`scroll.js` põe `html.ditto-js` no parse, e é ela que autoriza o CSS a esconder
quem revela no scroll. Medido: a classe existe em t=0 e **some por volta de
400ms**, quando o React reconcilia o `<html>`.

Sem a classe, nada é ocultado: os 146 alvos da home nasciam visíveis e a
animação de revelação **simplesmente não tocava**. Nenhum gate acusa — rota,
metadata, conteúdo, geometria e até o `confere-entrada` passam, porque a
animação de ENTRADA é outra camada.

Conserto: um `MutationObserver` no `documentElement` que devolve a classe no
mesmo quadro em que ela some.

## 🚨 Rede de segurança que revela TUDO mata a própria revelação

A rede existia para nada ficar oculto para sempre, e revelava todos os alvos
aos 4s. Enquanto a hidratação apagava a classe acima, isso não aparecia (nada
era ocultado). Com a classe viva, o defeito veio à tona: os 146 alvos da home
apareciam juntos aos 4s e, dali em diante, rolar não animava mais nada.

Conserto: a rede passa a resgatar só o que **já deveria estar visível** (topo
acima da borda inferior da janela) e segue vigiando o resto. Medido depois:
aos 7s sem rolar, 143 alvos seguem ocultos e revelam ao rolar — igual ao
original.

## 🚨 Laço de trilho PAUSA fora da janela — e sem isso ele acumula

Medido nas três homes, sem rolar: entre t=1s e t=5s o ticker de faturas fica
cravado em `translateY(-16px)` e o stepper em `translateX(-744px)`, enquanto a
faixa do hero (essa visível) anda 100px. O original pausa o que está fora da
tela.

Reconstruir o laço rodando SEMPRE, a partir do quadro que a captura congelou,
custa **25 elementos a 328px do lugar** na home — porque o protocolo de
medição leva ~13s e o laço andava o tempo todo (25px/s × 13s ≈ 325px).

Com pausa + repouso medido no original, o mesmo bloco caiu para 16-19px.

⚠️ E o número SUBIU quando o conserto entrou, porque antes os elementos
estavam em movimento e o **controle de deriva os excluía da conta**. Contagem
menor por exclusão não é fidelidade maior: é defeito escondido.

## 🚨 O piso de ruído se MEDE, comparando o original com ele mesmo

Antes de atribuir contagem a "fase de animação", meça: `ORIGINAL=<site>
CLONE=<o mesmo site>` no `compara-geometria`. Medido no framer-3: **11 elementos
a 375 e 1 a 1280 na home; ZERO no /about e nos posts**.

Ou seja, os ~120 da home nunca foram fase — eram defeito real, e tinham sido
reportados como fase. Sem esse controle, escreve-se "residual de animação" em
cima de trabalho não feito.

## 🚨 O defeito do botão hover-swap tem variante POR BREAKPOINT

Corrigir o repouso do botão só na `@media` do desktop deixa a variante mobile
congelada no meio do hover. Medido a 375: o rótulo 49px fora do lugar em
TODAS as 23 rotas, invisível para o agregado de altura (que dava Δ=0).

Repouso medido a 375, botão a botão: nav 56x56, CTA grande 40x40, hero 40x40,
janela de clip 24x21 (esta última errada nos DOIS viewports). Depois da
correção: 412 → 262 elementos fora do lugar, com oito rotas em zero.

## Crase dentro de template literal derruba o build

Comentário CSS com `palavra` entre crases dentro de `<style>{`...`}</style>`
fecha a string e quebra o JSX. Falha barulhenta (build exit 1), mas custa uma
rodada.

---

# framer-5

## 🚨 Runtime global sem guarda de rota não só falha: ele DESTRÓI conteúdo

A regra "runtime JS global não pode carregar dado de rota" está acima. Aqui, o
tamanho do estrago quando o runtime **escreve** no DOM.

O `contador.js` do framer-5 trazia `CIDS = ["n120","n130","n140","n150"]` e os
procurava no documento inteiro, sem olhar em que rota estava. Como `data-cid`
COLIDE entre rotas, esses quatro cids existem também em `/contact`, `/service`,
`/terms`, `/blog` e nos 6 posts — e lá eles são outra coisa. O runtime fazia
`el.textContent = String(n)`, que **apaga a subárvore inteira** do elemento.

O que isso custou, tudo medido no build entregue:

| Rota | O que o contador comeu |
|---|---|
| `/contact` | telefone `(209) 555-0104` → `934515299`; endereço → número |
| `/service` | o `03` do carrossel → `1` |
| `/terms` | o rodapé inteiro: 17 textos e 5 links sumiram (14 textos onde o original tem 32) |
| `/blog` | um CARD inteiro (link, imagem e título) — a grade caiu de 6 para 5 |
| 6 posts | o card de "posts relacionados" virou `6450456` |

🚨 **E o dano se disfarça de outro defeito.** O card comido no `/blog` fazia a
grade se reorganizar, e a geometria acusava `dx=+416,7px` em três elementos —
que foram investigados como "troca de coluna", uma pista real apontando para a
causa errada. O `compara-conteudo` acusava "texto faltando", sugerindo captura
incompleta. Nenhum dos dois sintomas menciona contador.

A aritmética é o que fecha o diagnóstico: `(209) 555-0104` tem os dígitos
`2095550104`, e `934515299` é **44,6% do caminho** até ele — o contador
fotografado em voo. Quando um texto vira um número que é uma FRAÇÃO exata dos
dígitos do texto original, procure o runtime que anima números.

**Conserto:** o alvo se declara no CSS DA ROTA (`--ditto-contador: 1`), que o
Next já isola por bundle, e o runtime vira genérico — igual a `--ditto-acordeao`
e `--ditto-ticker-vel`. ⚠️ E o marcador fica **fora de `@media`**: marcador de
alvo não é regra visual de uma largura, e prendê-lo a `(min-width:1024px)`
mataria o comportamento no celular sem aparecer em medição nenhuma.

**Auditoria que vale para todo clone:** varrer `public/*.js` procurando lista de
cid dentro do runtime. Guarda por rota (`location.pathname`), guarda de conjunto
completo (todos os alvos presentes) e guarda por nó são as três que o
`servicos.js` tinha e o `contador.js` não.

## A disputa com utilitária do Tailwind é POR ELEMENTO, não por folha

Medido com resolução no framer-5: **a folha está viva, e quem perde é a
declaração, elemento a elemento.**

Prova, numa única regra de `line-height:25.6px!important` que lista 16 cids:

- `n86` → aplicou (25,6px, exatamente o original)
- `n77`, `n83`, `n119`, `n120`, `n125` → não aplicaram (26px)

Mesma folha, mesma `@media`, mesma declaração, mesmo `!important`. A diferença
está no ELEMENTO: quem tem a utilitária `leading-[1.625rem]` no `className`
perde; quem não tem, ganha. Confirmado por `CSS.getMatchedStylesForNode` (CDP),
que lista só as classes do Tailwind, e pelo experimento de tirar a classe do
elemento — o valor cai para o herdado (24px), nunca para os 25,6px da regra.

**Conserto certo: trocar a CLASSE, não reforçar o seletor.** O
`aplica-tipografia-classe.mjs` escreve `xl:leading-[25.6px]` no próprio JSX, e
uma utilitária não perde para outra utilitária. Dobrar o seletor
(`[data-cid][data-cid]`), subir a especificidade ou empilhar `!important` não
resolve — foi tudo tentado, e o `entrega-inline` sozinho consertou 1 de 6.

⚠️ **Escolher a FAIXA da classe pela medição, não pelo hábito.** O padrão do
instrumento é `lg:` (≥1024px), mas a medição de tipografia trava em 1280px
(confirmada em 1440 e 1920). Usar `lg:` estende a correção para uma faixa onde
o original é FLUIDO e escreve valor errado entre 1024 e 1280. Aqui foi `xl:`.

## 🚨 CSS Nesting quebra todo varredor de CSSOM que não o conhece

Um varredor de folhas que faz `if (regra.cssRules) { descer(); continue; }`
para separar `@media` de regra comum **pula TODAS as regras comuns**: com
CSS Nesting, `CSSStyleRule` também expõe `.cssRules` — uma lista vazia, que é
truthy. O varredor desce numa lista vazia e nunca chega a testar o seletor.

Sintoma: o instrumento diz **"0 regras casam"** numa página cheia delas, e a
célula vazia parece aprovação ("nenhuma regra conflitante!"). O diagnóstico
aponta para "a folha não carregou", que é falso.

**Grupo se reconhece pela AUSÊNCIA de `selectorText`**, nunca pela presença de
`cssRules`:

```js
if (!rr.selectorText) { if (rr.cssRules) descer(rr.cssRules); continue; }
```

## Seletor de atributo: o arquivo vem SEM aspas, o CSSOM devolve COM

O minificador do Next serve `[data-cid=n77]`; o CSSOM reserializa a mesma regra
como `[data-cid="n77"]`. Quem grepa o CSS buildado procurando `data-cid="n77"`
não acha nada e conclui que a regra não foi gerada; quem varre o CSSOM
procurando `data-cid=n77` (sem aspas) também não acha. Os dois falsos negativos
aconteceram na mesma investigação, com a regra presente o tempo todo.

Quando a pergunta é "esta regra casa com este elemento?", não compare texto de
seletor: pergunte ao navegador com `el.matches(regra.selectorText)`, que é imune
à forma.

## 🚨 CUSTOM PROPERTY É HERDADA — e o runtime genérico trata a subárvore como alvo

A doutrina desta skill manda o runtime global achar seus alvos por marcador no CSS
da rota (`--ditto-ticker-vel`, `--ditto-acordeao`, `--ditto-revelar`,
`--ditto-contador`). O que faltava dizer: **custom property herda por padrão**.
O CSS declara o marcador SÓ no trilho, mas todo descendente devolve o mesmo
valor em `getComputedStyle` — e o runtime encontra alvos onde não há nenhum.

Medido na home do framer-5, no ticker:

| | original | clone (antes) |
|---|---|---|
| trilhos | 1 | **7** (o marcado + 6 descendentes) |
| nós por item | 259 | **652** |
| textos únicos | 3 | 6, com texto repetido DENTRO do nó |

O sintoma visível era texto duplicado dentro do próprio elemento —
`"thethethethe milemilemil"`, `"Marcus OkoyeMarcus Okoye"` — porque cada nível
aninhado foi duplicado por cima do anterior. Na geometria: **5464 elementos "só
no clone" e 1019 "fora do lugar"**, todos na faixa do letreiro, com `dw=dh=0` e
`dx` de até 5905px (tamanho certo, posição errada = casamento cruzado entre
cópias). 🚨 **O HTML buildado estava LIMPO**: a corrupção era 100% de runtime, e
nenhum gate de build acusaria.

**Conserto de raiz, declarativo** — registrar todo marcador como não herdável:

```css
@property --ditto-ticker-vel { syntax: "<number>"; inherits: false; initial-value: 0 }
```

E o cinto, no runtime, para quando o registro não pegar: só o alvo MAIS EXTERNO
vale — `candidatos.filter(el => nenhum ancestral está em candidatos)`.

⚠️ Vale para TODOS os marcadores, não só o do ticker: `--ditto-revelar` herdado
transforma todo descendente de um alvo revelado em alvo também.

## 🚨 A MESMA rota mede diferente sozinha e dentro de um lote de 20

Medido no framer-5, na home, com o mesmo build e o mesmo instrumento:

| | pares | fora | colhidos no ORIGINAL |
|---|---|---|---|
| `ROTAS=/` (sozinha, 3 rodadas) | **659** | 549–553 | **1144** |
| `ROTAS=rotas.json` (20 rotas) | **71** | 4 | **83** |

O lado que encolhe é o **ORIGINAL**: 1144 elementos colhidos sozinho contra 83
no lote. A home tem um letreiro com centenas de `<span>` de uma letra cada, e
quando ela é a primeira de vinte navegações em sequência esse bloco não chega a
renderizar antes da colheita. O clone, servido do disco local, colhe quase o
mesmo nos dois casos — e é essa ASSIMETRIA que denuncia.

🚨 **E o resultado degenerado parece ÓTIMO**: "4 elementos fora do lugar" foi o
melhor número da rodada inteira, e era medição vazia. Célula quase vazia não é
aprovação, e número que MELHORA muito de repente merece a mesma desconfiança
que número que piora.

**Como reconhecer:** `pares` despencando entre rodadas, ou `soNoOriginal` muito
menor que o normal. **O controle:** medir a rota suspeita SOZINHA e comparar o
total colhido (`pares + soNoOriginal`) com o piso de ruído daquela rota — no
framer-5 o piso casou 1144, que é exatamente o que a medição isolada colhe.

## Velocidade de laço se mede em REGIME, nunca nos primeiros segundos

Medido nos primeiros segundos, o `--ditto-ticker-vel` do framer-5 sai
192,3 px/s, **37% lento**. A mesma sonda, no mesmo trilho do mesmo original, devolve:

| janela | velocidade |
|---|---|
| 5s | 245,9 px/s |
| 12s | 305,6 px/s |
| 24s | **306,5 px/s** |

O trilho ACELERA na partida, e quanto mais curta a janela, mais devagar ele
parece. Medir a segunda metade de uma janela longa (aqui, 24s) e confirmar por
**deslocamento total**, que é a medida menos ruidosa: −7361px e −7360px em duas
rodadas de 24,0s, contra um desvio relativo por janelas de 0,65 — sinal de que a
média instantânea oscila e a acumulada não.

⚠️ E o inverso também engana: o clone media `cv=0.001` (perfeitamente constante,
porque é WAAPI com `easing: linear`) enquanto o original media `cv=0.65`. Curva
suspeita de ser "certa demais" é sinal de reconstrução, não de fidelidade.

## O ditto perde `font-variant-numeric`, e número tabular vira proporcional

Com `tabular-nums`, todo dígito tem a MESMA largura: no original do framer-5,
"300", "100" e "620" medem 66px cravados (3 × 22px). Sem a propriedade, a
largura depende de QUAIS dígitos são — o clone media 67,8px em "300" e 59,4px
em "100".

O sintoma no `compara-geometria` foram os dois últimos elementos teimosos do
`/about`: `dw=-6.6` no "100" e `dx=-6.6` no "+" ao lado, que só estava sendo
empurrado. Assinatura: **um elemento estreito demais e o vizinho deslocado
exatamente a mesma distância**.

⚠️ Corrigir SÓ onde o original declara: o "+" vizinho tem `numeric: normal` nos
dois lados. E há um motivo funcional além da fidelidade — número que ANIMA
precisa de dígito de largura fixa, senão a caixa pula a cada quadro da contagem.

## 🚨 `<style>` no layout de uma rota-PAI vaza para todas as rotas-filhas

O `entrega-inline.mjs` já cuida de não pôr o CSS no layout RAIZ, exatamente
porque `data-cid` colide entre rotas. Mas o App Router aninha: em
`/projects/browncrit`, a cadeia é `app/layout` → `app/projects/layout` →
`app/projects/browncrit/layout` → `page`. **O `<style>` de `/projects` vale
dentro de `/projects/browncrit`** — e ali o mesmo cid é outro elemento.

Medido: `[data-cid="n304"]` é "Contact" em `/projects` (entrelinha 18,2px) e
"[ MELBOURNE ]" em `/projects/browncrit` (27,2px). O layout do pai impôs 18,2px
ao filho. O sintoma no `compara-geometria` foi **`dh=-9` em `n304` e `dh=+9` em
`n320`, nas 5 rotas de projeto** — dois elementos com os valores TROCADOS entre
si, que é a assinatura de colisão de cid, não de tipografia errada. Os arquivos
fonte das duas rotas estavam CERTOS, cada um com o seu valor; quem errou foi a
entrega.

**Como reconhecer:** valor de A aparecendo em B e o de B em A, com os arquivos
fonte corretos. Se o CSS gerado tem comentário por regra (`/* Contact */` ×
`/* [ MELBOURNE ] */`), a troca salta aos olhos.

**Conserto:** a correção que pode ir por CLASSE deve ir por classe — a classe
mora no elemento e não tem como vazar para outra rota. Aqui, tirar
`tipografia.css` do `FOLHAS=` do entrega-inline (a tipografia já ia por
`aplica-tipografia-classe`) fez as 234 regras restantes serem só hover e
estrutura. ⚠️ **Rota-pai com folha que NÃO pode virar classe continua sendo
risco**: ou o CSS dela desce para as filhas, ou se aceita que só valha por
import. Preferir sempre classe para propriedade que o Tailwind gera.

## Transição de PÁGINA: medir exige o coletor armado ANTES do clique

A dimensão 7 media o MECANISMO (documento novo × client-side) e esperava 2600ms
depois do clique para ler qualquer coisa — tempo em que qualquer fade já
terminou. O `inventario-movimento` nunca navega. Resultado: a cara da troca de
rota era ponto cego completo, e um clone podia cortar seco onde o original
dissolve sem nenhum gate acusar.

O `mede-transicao-pagina.mjs` mede assim: em navegação client-side o documento
PERSISTE, então um `evaluate` iniciado antes do clique continua rodando durante
a troca. Uma marca plantada por `addInitScript` distingue documento novo (aí não
há curva, há flash, e isso se declara em vez de inventar). ⚠️ Não se guarda
referência de nó — o React destrói a árvore: cada quadro reidentifica os filhos
por marca incremental, e o quadro em que uma marca some e outra nasce é o swap.

**No framer-5 o veredito foi "não tem":** 3 saltos, todos client-side, URL
trocando em 76–138ms, zero transição visual. **Reproduzir isso fielmente é NÃO
escrever transição nenhuma** — e isso é um número no relatório, não uma
suposição de quem não olhou.

---

# Site Framer nº 4 — framer-4: trilho, contador e caixa por proporção

Os 92 elementos fora do lugar e 169 "só no original" que sobram no framer-4
depois de fechar as dimensões têm causa. O que segue vale para qualquer site
com trilho, contador ou caixa dimensionada por proporção.

## 🚨 `uls[0]`: o instrumento clica um carrossel e mede OUTRO

Escolher o trilho como o primeiro `<ul>` do documento com pai
`overflow:hidden` e transform próprio erra: no framer-4 o primeiro é o
**marquee de logos** (45 itens, y=8842); o carrossel de depoimentos vem 440px
abaixo (y≈9283). Com as setas achadas por `aria-label` a menos de 900px — e
440 < 900 —, o instrumento clica as setas do carrossel enquanto lê o transform
do marquee.

O que sai disso: `passo=75.1px` (a deriva do laço no intervalo entre dois
cliques, não um passo de slide — o passo real é 1280px), dois "slides" que são
logos SVG com texto vazio, e um runtime de 8916 bytes inteiro de mentira.
**Nenhum guard pega:** o passo é maior que o mínimo de 10px e o ciclo
"fecha" com 2 slides distintos.

**O teste que pega, e que é obrigatório: AUTONOMIA.** Trilho que anda
sozinho com a página parada é marquee, não carrossel manual, e sai da disputa.
⚠️ o teste tem de rolar até cada candidato antes de amostrar — o Framer pausa
laço fora da janela, e medir do topo declara "parado" justamente o marquee que
se quer desqualificar. O instrumento imprime a escolha:

```
candidato [0] y=8842 itens=45 setas=par a 522px · ANDA SOZINHO (marquee)
candidato [1] y=8934 itens=20 setas=par a 430px · parado
trilho escolhido: [1]
```

## O original NÃO virtualiza esvaziando: ele esconde com `visibility`

Hipótese errada: "o construtor virtualiza, só os slides
perto da janela têm conteúdo". Medido: os **20 itens estão completos no DOM**,
com citação, nome, cargo, avatar e imagem de fundo. O que muda é a
`visibility` — `hidden` no PRIMEIRO FILHO de cada item fora da janela corrente
±1, com o item em `display:contents`.

Reconstruir os 20 slides sem reproduzir a ocultação deixou os 20 visíveis de uma
vez: **85 elementos "só no clone" — 17 slides × 5 elementos, na conta exata.**
Uma sonda que não filtra `display`/`visibility` não vê isso e confirma a
hipótese errada; a que filtra mostra 3 slides visíveis contra 20 no DOM.

## Largura de item copiada do molde: o vizinho paga

Ao clonar um item como molde, as larguras FIXAS que ele carrega são do item que
a captura pegou. A coluna de nome/cargo do depoimento é dimensionada por
conteúdo no original — 276,5 / 175,2 / 211,5 / 183,2 / 246,5px, uma por pessoa.
Com todas em 276,5 o texto não muda de lugar sozinho, mas o bloco fica mais
largo e o **avatar anda meia diferença para a esquerda** (dx=−50,6 para uma
coluna 101,3px larga demais). Conserto: medir a caixa de CADA descendente do
item no original, em ordem de documento, e reescrever as classes de largura e
altura por índice — com guard de contagem, porque casar por índice quando as
estruturas diferem é pior que não mexer.

## 🚨 Caixa que nasce em ZERO porque o conteúdo é absoluto

Classe de defeito com quatro aparições no mesmo site, e a mais barata de
consertar depois de reconhecida. O ditto emite invólucro que declara só
proporção (`aspect-[3.39583/1]`) ou só altura (`h-5 block relative`), e cujo
único filho é `absolute`. Filho absoluto não empurra caixa: o invólucro fica com
`width: 0px`, a imagem dentro é `w-full`, e some. **Não fica um buraco óbvio na
tela — fica um risco de 3px**, e a geometria acusa o vizinho errado.

Onde apareceu: 7 dos 8 logos do marquee da home; o logo de 112×16 do topo de
**todas as 27 rotas** (que a geometria reportava como "só no original", porque no
clone ele tinha largura zero); a imagem do herói; e a assinatura da seção de
contato. Total: **82 caixas**.

De onde vem o número, sem consultar o original: **da proporção que a própria
imagem declara mais a altura que o invólucro já tem.** `aspect-[auto_140/20]`
com altura 20 dá 140; `aspect-[auto_101/111]` com altura 35 dá 31,85. É a conta
que o navegador faria se a caixa não tivesse colapsado.

⚠️ **Proporção é do RECORTE, não da caixa.** Quando a largura que ela dá quase
preenche o pai, a caixa foi feita para preencher: o herói tem `object-cover` com
proporção 1,406 e altura 900 (=1265px) dentro de um pai de 1280 — escrever 1265
deixaria uma faixa de 15px de fundo aparecendo. A regra é comparar os dois
números, ambos medidos: menos de 3% de diferença, `w-full`.

⚠️ **Colapso CIRCULAR.** Exigir que o pai esteja são ("se ele também
colapsou, quem se conserta é ele") deixa passar o caso em que o invólucro tem
`basis-full` (flex-basis 100% do pai) e o pai encolhe para o conteúdo: **cada
um esperando a medida do outro, os dois em zero.** O instrumento pularia o
filho por causa do pai e o pai por causa da regra dos filhos absolutos. Quem quebra o círculo é o elemento **mais interno que não é
absoluto** e tem altura própria, porque é ele que carrega a proporção. Elemento
`absolute` com `left` e `right` definidos fica de fora: a largura dele vem do
ancestral posicionado, e dar-lhe largura própria seria trocar o efeito pela
causa.

## 🚨 O transform capturado de um trilho em laço é FASE, não repouso

A foto pega o trilho no meio da volta. A galeria do /studio sai com
`transform-[matrix(1,0,0,1,138.67,0)]` — 138px que não são posição nenhuma, são
o instante do obturador. O runtime do marquee parte desse x0 e o mantém para
sempre: **os 30 itens ficam 155,4px fora do lugar o tempo todo, com a
velocidade certa e a fase errada.**

A fase de repouso **não se mede na página assentada** (lá o trilho já andou), e
sim **logo depois do load**. Medido nos três trilhos do framer-4: os dois de
prêmios começam em 0 nos dois lados e derivam ~11px (jitter de tempo visível); a
galeria começava em 0 no original e 136 no clone, e essa diferença explicava
sozinha 155 dos 155,4px. Zerada a fase, o desvio sumiu.

## 🚨 O controle de laço tem de valer também para imagem

O detector de deriva do `compara-geometria` guarda a chave `tipo|texto`, e para
imagem o texto é a caixa (`122x36`). O desvio, porém, carrega um texto
ENFEITADO para o relatório (`img 122x36 <arquivo>`). Comparar por ele faz
`laco.has(d.texto)` dar falso sempre: **o controle de laço vale para texto e
vira letra morta para imagem.** No framer-4: 45 logos de um marquee
reconstruído e rodando entram inteiros na conta, um por um. Conserto: guardar
no desvio a chave CRUA e comparar por ela. Efeito: `/` de 62 para 17 desvios,
`/studio` de 78 para 3.

## Laço que PAUSA fora da janela não deriva entre duas fotos do mesmo lugar

O detector tirava a segunda foto depois de esperar, sem sair do lugar. Como o
Framer pausa todo trilho fora da tela, os três marquees ficavam parados nas duas
fotos e eram declarados ESTÁTICOS. Conserto: entre as fotos, **visitar a página**
(rolar por faixas) e **voltar ao MESMO y** — o parallax volta ao lugar e só o que
depende do tempo se mexeu.

## Fase de laço se DESCONTA, não se perdoa em bloco

Tirar os itens de um trilho da conta esconde defeito: um logo trocado de lugar
DENTRO do trilho sairia impune junto com a fase. O desconto separa as duas
coisas — mediana do dx por trilho (agrupado por faixa de y, porque uma página
tem vários), subtraída de cada item. Medido: 15 logos com dx entre −18,6 e
−18,2, ou seja, **arranjo perfeito e relógio diferente**. O que sobra depois do
desconto continua na conta, e a fase vai impressa no relatório.

## 🚨 CONTADOR: o texto é a IDENTIDADE, e um número que sobe não tem par

O comparador casa elementos de texto pelo conteúdo. Um contador quebra isso de
três formas ao mesmo tempo:

1. **não casa** — o clone marca 120 e o original 87, e os dois viram "só no
   original"/"só no clone";
2. **rouba par alheio** — o contador do original congelou em `3`, e a página tem
   outro `3` (o item 3 da lista "Our Process") 5295px abaixo. Casaram. O desvio
   de 5295px não era de ninguém: o item da lista estava certo e o contador não
   tinha par;
3. **arrasta o vizinho** — o sufixo `+` começa onde o número termina, e 80 e 120
   não medem igual (dx de 3 a 6px, sem defeito nenhum por trás).

Três consertos, todos no comparador: **teto de distância para casar texto**
(imagem sempre teve um, texto não tinha — um par a meia página não é um par);
**texto instável** (o que muda entre as duas fotos sai da conta, declarado); e
**posição instável**, porque o conjunto de textos não basta — `3` existe nas duas
fotos por causa do homônimo legítimo, e quem denuncia é o LUGAR: mesmo elemento,
mesma posição, outro texto.

⚠️ Esperar mais não resolve: com 5 segundos depois do assentamento o original
ainda mostrava 88 e 6.

## 🚨 O contador PAUSA fora da tela e RETOMA de onde parou

Medido no original, e é a razão do parágrafo acima. Rolando a página de ponta a
ponta, os quatro contadores **congelam em 87/3/14/6 e ficam ali
indefinidamente**. Ao voltar à tela: 93/5/18/8 em 250ms, repouso em 1,5s. Ou
seja, o tempo que conta é o tempo EM TELA — igual ao laço do marquee, e nada a
ver com "dispara uma vez e corre até o fim".

Um clone que corre até o fim escondido marca 120 enquanto o original marca 87, e
como o texto do contador é o próprio número, **os dois nem casam na comparação**.
O runtime certo acumula o tempo decorrido só com o elemento visível.

⚠️ E o valor de PARTIDA não é zero: é o que está no HTML do original (80/0/10/3
no framer-4). Quem denuncia a captura no meio da contagem sem medir nada é o site
responsivo emitindo DUAS variantes do mesmo bloco com números DIFERENTES entre si
(83/1/12/4 na larga contra 80/0/10/3 na estreita) — dois valores para o mesmo
dado só acontecem se o dado estava mudando quando a foto saiu. A variante oculta
fica no valor de partida porque nunca entrou em tela.

## `align-items:center` também encolhe `div`, não só `section`

O `corrige-largura-secao` trata `section`. A mesma armadilha aparece num
`div`: a linha do bloco "Our Process" mede 984,9px onde o original tem 1216, e
como ela usa `justify-between`, a diferença de 231px se reparte igualmente nos
dois lados — **+115,5px na coluna de texto e −115,6px na imagem**, 10 elementos
acusados por um defeito só, dois níveis acima. `width:100%` provado no navegador
devolveu 1280@0 e 1216@32, os números exatos do original.

Sintoma que denuncia: desvios de mesmo módulo e sinais opostos dentro de um
container `justify-between`. O culpado não está entre os acusados.

## Tipografia: 0,08px de fonte mudam a contagem de LINHAS

O parágrafo "Every structure distilled…" media 70,5px de altura no original e 48
no clone, com a MESMA largura (256,5px) e o mesmo texto. Fonte do original:
18,08px/23,504px. Do clone: 18px/24px. Com a fonte um fio maior, o texto quebra
em 3 linhas onde o clone cabe em 2 — e a geometria reporta `dh=−22,5` num
parágrafo que parece idêntico. `mede-tipografia` + `aplica-tipografia-classe`
acharam 286 elementos no /studio e 344 na home.

## `gera-marquee` também precisa saber do grupo `(inicio)`

A mesma armadilha do `gera-entrada` e do `entrega-inline`: escrever a
velocidade medida em `src/app/scroll.css` quando a home mora em
`src/app/(inicio)/`. Ninguém importa aquele arquivo, e a correção
parece feita sem nunca chegar à tela. **Todo instrumento que escreve folha por
rota tem de procurar o grupo PRIMEIRO.**


## 🚨 TRANSFORM LIGADO À ROLAGEM: o defeito que NENHUM gate enxerga

O defeito mais caro do framer-4, e o que mais ensina sobre o método.

O framer-4 tem elementos cujo transform muda conforme eles atravessam a janela:
um cartão que entra torto 9° e 200px baixo e vai **endireitando** até ficar reto,
e dois blocos que entram com escala 0.7 e 1.2 e assentam em 1.01. No clone,
nenhum deles se mexe: a captura os congela no estado de PARTIDA, e ali ficam.

**Por que nenhum gate acusa, e este é o ponto:** o `compara-geometria` assenta a
página e volta ao TOPO antes de fotografar. No topo, o elemento ainda não entrou
na janela — então o original está exatamente no mesmo estado inicial em que a
captura congelou o clone. Os dois batem. A geometria dá **zero elemento fora do
lugar**, com razão, e o defeito só existe para quem rola até lá.

Assim o cartão da seção de contato fica permanentemente torto em **27
rotas** com o clone marcando 8.977 elementos casados e 0 fora do lugar.

O que denuncia: comparar o transform de cada elemento **no topo** com o transform
dele **quando entra na janela**, nos dois lados. No framer-4 deu 35 elementos que
mudam no original contra **0 no clone**.

### O guard que separa o joio: rolagem × relógio × acaso

Dos 35, apenas 3 eram scroll. Os outros 32 são uma camada decorativa de textura
(opacidade 3%) cujo transform **salta sozinho, de forma errática, com a página
parada** — medido em 5 segundos sem tocar em nada: `(288,18) → (0,270) →
(72,630) → (−240,180) → (−120,−180) → (−307,36)`. Não é laço regular nem
parallax: é aleatório, e o original **não repete o mesmo estado duas vezes**.
Isso não se reconstrói por medição, e vai declarado como residual.

O teste que separa: duas leituras **sem rolar nada**. O que muda com a página
parada anda pelo relógio (ou pelo acaso) e não é scrub.

⚠️ **Assentar ANTES de julgar.** O parallax do Framer tem inércia: depois de uma
rolagem ele continua deslizando por mais de um segundo. Com 90ms de espera, o
teste de laço pega o rastro do deslizamento e declara "anda sozinho" — **33
dos 35 elementos são acusados de laço**, e o instrumento não reconstrói
nenhum. Com 1,4s de assentamento, a conta vira 3 scrub e 32 laço, e os 3 são
os certos.

### Como se reconstrói

A saída é uma **tabela medida** (posição do topo na janela → matriz completa),
nunca uma fórmula: o instrumento não supõe linearidade, e o runtime interpola
entre as amostras travando nas pontas. No framer-4 a curva era linear —
`ângulo = −9° × clamp((topo − 131)/922, 0, 1)`, batendo em todos os pontos — mas
isso é conclusão da medição, não premissa dela.

⚠️ `transform: none` é a matriz IDENTIDADE, não uma amostra inválida. O cartão
termina a curva exatamente em `none`; descartar esse ponto tirava justamente o
estado de CHEGADA da tabela.

⚠️ **Dois runtimes não podem escrever a mesma propriedade.** Marquee e carrossel
já escrevem `transform` a cada quadro nos trilhos deles. O pareamento descarta
quem estiver em laço ou marcado com `data-marquee`/`data-carrossel` — senão os
dois brigam quadro a quadro e o resultado não é de ninguém.


---

# A fase de ACABAMENTO — cinco defeitos que passam por todos os gates

> Medidos no framer-2. Todos aparecem DEPOIS de as 7 dimensões fecharem,
> e nenhum deles é acusado por rota, metadata, conteúdo ou geometria.

## Mutar o DOM antes da hidratação do NÓ que se muta (React #418)

Runtime que reconstrói trilho (`innerHTML`) antes de o React hidratar aquele nó
gera mismatch de markup. Esperar "algum nó" hidratar NÃO basta: o React hidrata
progressivamente e um trilho no fim da página ainda não foi processado quando o
primeiro filho do body já tem `__reactFiber$` — medido, a MESMA rota alternava
entre erro e limpo entre cargas (é corrida, e corrida se prova com repetição:
18 cargas). O certo é esperar a chave `__reactFiber$`/`__reactProps$` aparecer
**no próprio elemento** que será mutado, com teto de tempo para não travar num
documento sem React. Depois: 0/18 cargas com erro, runtime agindo em 18/18 —
"limpo" sem provar que o runtime agiu é falso positivo.

## Altura do wrapper RAIZ congelada: o rodapé fica inalcançável

O ditto grava a altura do wrapper raiz em px com `overflow: clip`. Enquanto o
clone erra as alturas internas, o número fecha. No instante em que uma correção
DEVOLVE altura (o `corrige-vh-afim` pondo 100vh em 3 seções, +300px), o conteúdo
cresce, o wrapper não acompanha, e o excedente é CORTADO. Medido: rodapé em
docY=12501 num documento que rolava até 12491 — os links do rodapé eram
**inalcançáveis para quem usa o site**, e a geometria não acusava nada (a caixa
do rodapé estava na posição certa). O sintoma que denuncia é indireto: alvos do
rodapé dando TIMEOUT de hover no Playwright (13 no clone × 1 no original),
porque ele não consegue rolar até eles. `corrige-altura-raiz.mjs`.

🚨 **Correção que funciona cria defeito novo em quem depende do tamanho antigo.**
Depois de devolver qualquer altura, remedir o `scrollHeight` contra o fundo real
do conteúdo.

## Gatilho de estado: `closest()` devolve o filho, não o container

O menu do framer-2 é um `<div data-cid="n14">` com um `<button data-cid="n15">`
dentro. O clique cai no button, e `closest("a,button,…,[data-cid=n14]")` devolve
o BUTTON (o mais próximo), cujo cid não está na lista de gatilhos — o menu nunca
abria, sem erro em lugar nenhum, com o script carregado e `abrir()` funcionando
quando chamado à mão. Procurar CADA cid com `closest('[data-cid="x"]')` **antes**
do casamento por texto resolve, e casa clique em qualquer descendente.

## Slot de ícone: o conteúdo colapsa e o irmão é quem sai do lugar

Wrapper interno do slot sai da captura com 0×0; com `padding:12px` e
`box-sizing:border-box`, o slot fica 24px onde o original tem 48px (12+24+12).
Num flex `justify-content:center` de altura fixa, os 24px que faltam empurram o
ícone 12px para baixo e o texto 12px para cima — e o `compara-geometria` acusa
o TEXTO, que está perfeito. `/technology` tinha 21 elementos "fora do lugar",
**nenhum deles o culpado**. Regra: `div[class*="basis-full"]:has(img){min-width:24px;min-height:24px}`
→ 21 vira 0.

⚠️ **`:has(> img)` é filho direto e falhou**: a imagem estava dois níveis abaixo
(`n319 > n320 > img`). A regra estava no CSS do build, o instrumento confirmava
presença, e mesmo assim era inerte. Variante do "escrevi mas não aplicou": não
por sintaxe inválida, por seletor que não casa.

## Runtime global com estado por rota: o segundo apaga o primeiro

Dois casos no mesmo site:
- **acordeão**: `acordeao.js` embutia a lista de itens e uma `ROTA_MEDIDA`.
  Gerar o acordeão do `/faq` depois do da home deixou a home SEM runtime: o FAQ
  não abria, e o item que nasce aberto no original nascia fechado (os 4 itens
  seguintes 55px acima). O conserto é pôr o alvo no CSS DA ROTA
  (`--ditto-acordeao: 1|2`) e deixar o JS genérico.
- **carrossel**: guard `if (window.__dittoCarrossel) return` no topo servia
  quando havia um arquivo; com um arquivo POR ROTA, o segundo script retornava
  antes de se registrar. A idempotência real vem do `data-carrossel` por trilho.

## E o fallback silencioso, que é o pior de todos

`const dur = durMedida || 400` — a medição de duração falhou (o cabeçalho do CSS
saiu com "duração medida: 0ms") e as **39 rotas** ficaram revelando conteúdo em
400ms onde o original revela em **1050ms**: 2,6× mais rápido, visível a olho, e
NENHUM gate acusou, porque a regra aplica — só está errada. Gate prova que o
navegador obedeceu, não que o número é o certo. Quando a medição falhar, gritar
e exigir `DUR_FALLBACK` medido; nunca cair num número inventado calado.

🚨 **Só se descobre comparando a MEDIÇÃO dos dois lados**, não olhando o clone:
`getAnimations()` no original (1050ms, 106 keyframes) contra o clone (400ms).

## 0,2px de line-height viram 18px na tela (e o culpado não é quem se mexe)

O caso mais fino do framer-2, e o que melhor mostra por que a régua é
"diferença NENHUMA" e não "diferença visível".

O `corrige-tipografia` cobre o font-size arredondado quando a escala de tipo
TRAVA. Aqui o font-size batia (16px = 16px) e mesmo assim o **line-height** saiu
arredondado: `21.76px` → `22px`. Sozinho, invisível.

O container era `flex-direction: column` **com `flex-wrap: wrap`** e altura fixa
de 56.6px:

    original   21.8 + 12 (gap) + 22.8 = 56.6  → cabe → EMPILHA
    clone      22.0 + 12 (gap) + 22.8 = 56.8  → NÃO cabe → WRAP

Os 0,24px estouram a altura, o wrap dispara, e o segundo bloco quebra para uma
**nova coluna**: label e valor ficam lado a lado em vez de empilhados, 18px fora
do lugar. O `compara-geometria` acusa os TEXTOS — e nenhum deles é o culpado.

Perseguir isso pediu descer a árvore inteira: os blocos batiam no nível 3, o
`display:flex`/`direction:column` batia, o `position` batia, e só a soma das
alturas contra a altura do pai revelou o wrap. `corrige-line-height.mjs` mede o
line-height computado dos dois lados por casamento de texto e devolve o valor do
original — em **ratio sem unidade** quando o font-size coincide, para a regra
sobreviver a mudança de tamanho. Medido: 1464 regras em 39 rotas;
/patients-stories caiu de 6 para 1 elemento fora do lugar.

🚨 **Fração perdida não é ruído: é uma bomba-relógio de layout.** Ela só cobra
onde cruza um limite (um wrap, uma quebra de linha, um `max-height`), e aí o
efeito é dezenas de vezes maior que a causa.

---

# framer-3: line-height, trilho e a largura única

## 🚨 O ditto congela LINE-HEIGHT SEM UNIDADE em px arredondado

A causa mais cara do framer-3, e a que se esconde atrás de uma recusa CORRETA de
outro instrumento.

O original define `line-height` como razão (sem unidade). O navegador resolve
razão x font-size em cada largura; o ditto grava o valor RESOLVIDO, arredondado:

    largura   font-size   original (1.4)   clone
      1280       36          50.4px        50px
      1440       32          44.8px        50px
      1920       32          44.8px        45px
       375       28          39.2px        39px

Meio pixel por linha nao se ve num elemento. Somado ao longo de um artigo vira
deriva CRESCENTE: medido -4px no comeco e -7px no fim do mesmo post, e 34px no
FAQ da home.

🚨 O `corrige-tipografia.mjs` RECUSA escrever em 69 de 83 elementos, dizendo
"ainda fluida: valor fixo seria chute". Ele esta certo, e a leitura errada
seria a do operador: a recusa nao significa "nao tem conserto", significa que a
resposta nao e um VALOR, e uma RAZAO. Confirmado em 135 elementos: a razao
lh/fs do original e constante em TODAS as larguras (1.2, 1.25, 1.4, 1.45, 1.5,
1.65, 1.75 - numeros de design system).

Instrumento: `corrige-line-height-razao.mjs`. Escreve a razao, sem @media de
proposito (razao vale em qualquer largura; px por faixa acertaria so nos pontos
medidos). Resultado: payment-terms 47 -> 2, how-to-spot 18 -> 1.

## 🚨 Trilho de carrossel MUTILADO e fora de fase na captura

O carrossel de despesas tem 12 itens no original (3 unicos x 4) e veio com 6
na home e 8 nas outras duas, comecando em item errado. Isso produz desvio
horizontal nos itens E derruba o casamento no gate (item sem par vira "so no
original"). Conserto: clonar os nos que ja existem no DOM, na ordem medida.

## 🚨 Laco de trilho: CSS animation + play-state nao acompanha rAF

Alternar `animation-play-state` reproduz a PAUSA, mas nao da controle sobre
quanto andou em cada quadro, e o erro acumula: resiudo sistematico de 16-19px
em ~20 elementos ao longo de um protocolo de ~13s.

O original anima por rAF, integrando posicao quadro a quadro. Reproduzir com
`gsap.ticker` (integracao por quadro) e timeline com a curva medida como funcao
de easing zera essa classe. GSAP core (MIT) vai verbatim em `public/`, fora do
minificador, e o runtime se cala se `window.gsap` nao existir.

⚠️ E medir se o laco PAUSA ou RESETA fora da janela: aqui ele PAUSA (ao voltar
ao topo o stepper ficou onde parou, em -1240, e nao no repouso -744).

## 🚨 Instrumento novo herda as armadilhas dos antigos — leia-as ANTES

Um instrumento novo tende a repetir, em uma tacada, licoes que esta pasta ja
documenta para outros instrumentos. As duas que o `corrige-line-height-razao.mjs`
precisou:

1. **O arquivo tem que ACUMULAR.** Elemento corrigido para de divergir e para
   de ser proposto; reescrever o arquivo so com as propostas da rodada atual
   APAGA as regras que funcionaram, num vaivem sem fim.
2. **Especificidade tem que EMPATAR.** O `corrige-tipografia.mjs` escreve
   line-height com `[data-cid=X][data-cid]`. Um seletor simples com !important
   PERDE em silencio para ele.

## 🚨 Clicar por COORDENADA em pagina animada gera falso negativo

Numa pagina com laco vivo e revelacao, a caixa lida por `evaluate` fica
obsoleta entre a leitura e o clique: o ponteiro cai fora do link e o
instrumento reporta "nao chegou" numa navegacao que FUNCIONA. Medido: o
original (parado) passava 4/4 e o clone (animado) falhava no salto 1, com sonda
direta provando que a URL mudava normalmente.

Clicar por locator do Playwright, que espera acionabilidade. E com `:visible`
obrigatorio: o ditto emite gemeos por breakpoint com o MESMO href, e o
`.first()` cru pega o gemeo oculto, que nunca fica acionavel.

## 🚨 Gemeo por breakpoint quebra casamento por (tag + texto)

O ditto emite o mesmo conteudo duas vezes, um por faixa, com o outro em
display:none. Descartar chave repetida - o reflexo seguro - deixou o FAQ
INTEIRO sem conserto (dois h5 com o mesmo texto). A saida correta: agrupar por
chave e escrever quando TODOS os candidatos do original concordam no valor,
aplicando a regra a todos os gemeos.

## Altura herdada: h-full sobe a cadeia inteira

Corrigir a altura do elemento folha nao adianta quando ele tem `h-full`: quem
manda e o ancestral. No FAQ, o h5 recebeu line-height certo e continuou com 31px
porque quatro niveis acima estavam travados. E nos cards de feature, o card tem
h-full e o PAI dele e que veio com 656px congelados (avo mede 704) - devolver
`height:100%` ao pai restaura a estrutura sem cravar pixel.

## 🚨 O CLONE FECHA NUMA LARGURA SÓ: o celular é outra frente inteira

Medido no framer-4, e é a lição mais desconfortável da skill.

Depois de fechar **27 rotas com 8.977 elementos casados e ZERO fora do lugar a
1280px**, a mesma medição a **375px** devolve centenas de elementos fora do
lugar. Não é regressão: o clone **não tinha sido medido nessa largura**. Todo
o método — geometria, tipografia, alturas, trilhos — roda a 1280 por padrão, e
o gate final também. O que não se mede, não fecha.

### Por que passa despercebido

Os instrumentos medem a 1280 por padrão (alguns sem como trocar; a lista está
no SKILL.md, "Uma LARGURA fechada não é o clone fechado"), e o `checkup.mjs`
imprime a largura no cabeçalho da matriz — mas a matriz sai verde. Uma matriz
verde numa largura só parece uma matriz verde.

### O que NÃO explicava (testado e descartado)

Vale registrar os becos, porque cada um parecia óbvio:

1. **Altura de janela congelada.** `max-md:h-203` é 812px e `md:max-lg:h-256` é
   1024px — exatamente as janelas em que a captura mediu. Trocar as 48
   ocorrências por `h-[100vh]` **corrigiu o herói** (que passou a medir 900 numa
   janela de 900, como o original) e mexeu o total de 1007 para 998. Certo, e
   quase irrelevante.
2. **Classes da skill sem prefixo.** As larguras que o `corrige-caixa-colapsada` e
   o `reconstroi-trilho` escrevem saem sem prefixo de breakpoint e portanto
   valem no celular. Testado tirando `width:100%` do contêiner do herói no
   navegador: a altura da página não mudou 1px. Não era isso.
3. **Tipografia.** 369 elementos divergentes na home a 375px — o mesmo tipo de
   defeito que, no desktop, mudava a contagem de linhas de um parágrafo.
   Aplicada com `FAIXA=max-md`: o total ficou em 453. Não era isso.

### A leitura correta

A divergência do celular é **estrutural**, não de acabamento: a altura da página
difere em 176px na home, e centenas de elementos vêm deslocados em bloco pelo
mesmo valor — a assinatura de contêineres mais curtos, dois deles empilhados
(−90 e depois −176). Fechar isso pede o ciclo inteiro rodado a 375px, com os
mesmos instrumentos e a mesma disciplina do desktop, e não um remendo.

### A regra que fica

**Uma largura fechada não é o clone fechado.** O relatório final tem de dizer em
QUE largura a matriz fechou, e declarar as outras como não medidas — que é
diferente de declará-las boas. Célula vazia é trabalho não feito também quando a
célula inteira é um breakpoint.

⚠️ E o corolário para quem for fechar o celular depois: a escala tipográfica do
Framer é **fluida** no celular (o valor muda entre 375 e 414), então
`aplica-tipografia-classe` com um valor fixo em `max-md:` é chute fora da
largura medida — o próprio `mede-tipografia` avisa isso com "ainda FLUIDA", e
ali o aviso vale.


---

# site-next — Next.js + Tailwind

Primeiro alvo fora do Framer. 232 rotas, site de marketing pesado em animação.
Tudo abaixo foi MEDIDO aqui; onde o número vale só para este alvo, está dito.

## A família que nenhum gate pega: propriedades de COMPOSIÇÃO

O ditto materializa quase todo o estilo computado e some com as propriedades
que dizem **como combinar** ou **como distribuir**. A caixa fica igual, o texto
igual, a cor igual — e o resultado, errado.

### `paint-order` (39 de 39 elementos)

| | original | clone |
|---|---|---|
| elementos com `-webkit-text-stroke` | 39 | 39 |
| `paint-order: stroke` | **39** | **0** |

Conferido em 5 rotas: /pricing (37/37), /customers (37/37), /careers (37/37),
/platform/workflows (39/39), home (39/39). O site-next usa `stroke` em **100%**.

`stroke` pinta o contorno primeiro e o preenchimento por cima; `normal` faz o
contrário, e 1,3px de contorno num texto de 13px **come o interior das letras**.
A faixa preta do topo do clone estava ilegível.

⚠️ Em alvo Tailwind isso chega como classe utilitária arbitrária no JSX
(`[-webkit-text-stroke:1.3px_var(--color-022)]`, **8622 usos**) e **zero** vezes
nos `.css` — varrer folha por folha conclui que não há nada a fazer. O conserto
é por seletor de atributo, porque a classe carrega o nome da propriedade:

```css
[class*="-webkit-text-stroke"] { paint-order: stroke }
```

### `mask-composite` (seletivo por rota)

| rota | original | clone |
|---|---|---|
| /platform/workflows | intersect **9**, add 1 | add 10 |
| /customers | intersect **2**, add 6 | add 8 |
| /pricing, /careers, home | só `add` | igual (ok) |

`intersect` faz a camada de desvanecimento **recortar** as outras; `add` faz
somarem, e a camada opaca vence. Em /customers, o topo do herói — branco liso
no original — vinha coberto por uma grade de pontos.

🚨 **É seletivo:** home, pricing e careers estão corretos. Medir só a home
concluiria "sem defeito". Corrigido em **83 regras** por 38 rotas.

### `column-count` (rodapé, todas as rotas)

Sintoma: altura de página divergindo — /pricing e /customers **+740px**, home
+539px, /careers +533px.

A caça foi por âncoras: herói com delta **0**, rodapé começando no **mesmo**
`y=4446`, e o rodapé com a **mesma altura** (685px) nos dois — o que parecia
contradizer o delta. A medição fina resolveu: as colunas do rodapé têm **205px**
no original e **820px** no clone, e empilham.

| | original | clone |
|---|---|---|
| `column-count` do contêiner | **4** | **auto** |

### Padding lateral duplicado no celular (375px)

| | original | clone |
|---|---|---|
| largura dominante de bloco de texto | 327px (×15) | **279px (×22)** |
| `<h1>` do herói | **2 linhas** | **3 linhas** |

Diferença constante de **48px = 2 × 24px**: `px-6` materializado no container de
página E no filho que já o tinha. **Não aparece em 1280px** — só medindo no
celular.

## A regra que essas quatro impõem

**A conferência visual pareada é GATE, não enfeite.** Três das quatro só
apareceram no olho; a quarta, porque a altura da página divergiu. Nenhuma passou
por rota, metadata, conteúdo, geometria de elemento ou gate de entrada.

E **Δaltura de página é o farol barato**: quando divergir, caçar o excesso por
âncoras (topo, meio, rodapé) antes de qualquer outra coisa.

## Animação: a classe vem, o CSS não

| | original | clone |
|---|---|---|
| `motion-safe:animate-in` etc. no markup | presentes | **presentes** |
| `@keyframes` no CSS | **30** | **0** |
| regras `animate-in`, `fade-in`, `slide-in-*` | definidas | **0** |

Pior que a ausência simples: a classe FICA no JSX, então quem revisa o código
conclui que a entrada está implementada. Nenhuma medição acusa.

O conserto é reproduzir o CSS **do próprio original** (30 `@keyframes`, os 10
easings que ele sobrescreve do Tailwind, as variantes `motion-safe:`/`data-*`, e
os `@property` de ângulo — sem estes o gradiente cônico não anima, porque tipo
não registrado não interpola).

⚠️ Dois detalhes que mudam o resultado: (a) os elementos com
`motion-safe:animate-in` da home **não** usam `motion-safe:ease-out`, então
`--tw-ease` fica indefinido e a curva efetiva é a keyword `ease` — aplicar
`ease-out` deixa diferente; (b) `--tw-enter-*` não têm `@property`, logo
**herdam** — é comportamento do tw-animate-css a replicar, não bug a corrigir.

## `0.xxx` vira `1.xxx` no `<style>` inline

Medido no SVG do radar: `opacity: 0.11` virou `opacity:1.11` em **12
declarações**. Como opacidade maior que 1 é limitada a 1, os anéis ficavam
sólidos e a pulsação morria, sem erro no build.

**Varrer sempre `opacity:1.[0-9]` depois de clonar:** valor maior que 1 em
opacidade é defeito de conversão, nunca intenção.

## Menu suspenso: o conteúdo do painel fechado não vem

`compara-conteudo` deu **0/231 rotas batendo**, sempre com os mesmos ~40 textos
e **13 links** ausentes. Investigado item a item: no original existem no DOM com
caixa 0×0 (painel fechado); no clone estão **ausentes do DOM**.

É perda de conteúdo e de link — todo o `/platform/*`, `/apps`, `/help/*`,
`/contact/sales` sumia do HTML de **todas** as páginas. Conserto: devolver os
itens (texto + href) num bloco sem área, no layout.

⚠️ E o gatilho é **hover**, não clique: medido, o hover leva `aria-expanded` a
`true` e o **clique FECHA**. O `captura-estado.mjs` só clicava — daí a variável
`ACAO=hover`. Mesmo assim não havia estado a injetar: os "10 elementos novos"
que ele capturou eram **ruído da demo em laço**, com zero itens de menu. Foram
descartados em vez de injetados.

## `networkidle` nunca dispara em site com conexão viva

`compara-conteudo` reprovou **todas** as rotas com `Timeout 60000ms ... waiting
until "networkidle"`. O site-next mantém conexão aberta (analytics), então a rede
nunca fica ociosa. **31 instrumentos da skill usam `networkidle`.**

Corrigidos os que este clone usa (`compara-conteudo`, `compara-geometria`,
`mede-interacao`, `compara-visual`, `captura-estado`, `levanta-rotas`):
variável `ESPERA`/`NAVEGA` (padrão segue `networkidle`, para não mudar alvo
nenhum) e um tempo de assentamento, senão mede a página antes de renderizar.

## Site grande: a API in-memory morre, e a captura vira lotes

Job de 231 rotas derrubou a API ~25 min depois de `running`, sem stack (máquina
com 15,9 GB, 0,2–0,9 GB livres). Daí o `clona-em-lotes.mjs`. Cinco causas
distintas de morte, cada uma com conserto próprio:

1. job in-memory grande demais → lotes pequenos, API reciclada por lote;
2. **assets binários são URLs servidas pela API in-memory** → o `unpack` roda
   DENTRO da sessão do lote, antes de derrubar a API;
3. tarefa de background morta por timeout do harness → driver desacoplado, log
   em arquivo;
4. reusar API sobrevivente de tentativa anterior → 404 (store de outro processo)
   ou BUSY; o `clona-em-lotes.mjs` sobe a API dele numa porta livre (sem
   `API=` no ambiente), para se a porta pedida tiver dono e só derruba o filho
   que ele mesmo subiu: **nunca matar processo por porta**;
5. BOM do PowerShell 5.1 em `Out-File -Encoding utf8` quebra o `JSON.parse`.

## Colisão de variáveis entre lotes (consequência de fatiar)

| | número |
|---|---|
| nomes comuns entre lote 1 e lote 3 | 236 |
| **mesmo nome, VALOR diferente** | **94** |

O ditto numera as cores por ordem de descoberta **dentro da captura**, e cada
lote descobre em ordem diferente: `--clr-11` é uma cor no lote 1 e outra no lote
3. Juntar ficando com um `globals.css` só pinta 11/12 do site com as cores
erradas, e **geometria mede caixa, não cor** — nada acusa.

Renomear por lote não serve: as variáveis alimentam o `@theme` do Tailwind, que
gera as classes (1990 usos de `bg-*`, 4900 de `text-*`, 943 de `border-*`).
O conserto (`escopa-variaveis-por-rota.mjs`) mantém o nome e escopa o valor:
união dos nomes no `globals.css` + bloco `[data-rota="<slug>"]` no CSS da rota.
Funciona porque custom property que referencia outra resolve **no ponto de uso**.

Achado mais grave da junção: faltavam **86 aliases de tema** e **62
`@font-face`** — sem eles, 86 classes utilitárias não existiriam e 62 fontes não
carregariam, em rotas que passariam por toda medição de rota e conteúdo.

⚠️ E a fusão é **arquivo a arquivo, nunca pasta a pasta**: as rotas de uma mesma
seção caem em lotes diferentes (o `/blog` do site-next cai partido entre os lotes
1 e 2), e copiar a pasta inteira do primeiro perderia metade das rotas, calado.

## Servidor de OUTRA sessão respondendo na porta

Uma bateria reprova com dezenas de 404 em rotas cujo HTML **existe no disco e
o Node lê sem erro**. Causa: **seis `serve-clone.mjs` de sessões anteriores
vivos**, um deles servindo outro clone na 8081. O servidor novo morre com
`EADDRINUSE` num log que ninguém olha.

O padrão que denuncia: `/` devolve 200 `exato` e `/blog` 200 `sufixo-html`,
enquanto `/pricing` dá 404 — é outro clone, com outras rotas. O
`serve-clone.mjs` falha com mensagem explícita e `exit 2`.

**Antes de qualquer bateria, conferir quem é o dono da porta.** Não basta a
porta responder 200.

## Duas falhas de gate que se dissolvem na investigação

Antes de "consertar" uma falha de gate, descobrir se há o que consertar:

- **`/templates` : 0/1.** A pasta não tem `page.tsx` — é só diretório com
  subpastas de rota. O `gera-entrada` escreve um CSS que nenhuma página
  importa: **arquivo órfão** contando como promessa não cumprida.
- **`/experts` : sem resultado.** O inventário mede **0 elementos animados** no
  original: a rota não tem animação de entrada. Arquivo só com cabeçalho.

Nenhum é defeito de animação: os dois arquivos saem.

## `\n` literal dentro do `d=` do SVG — o caminho não desenha

| | original | clone |
|---|---|---|
| erros de `<path>` no console | **0** | **5** |

```
Error: <path> attribute d: Expected path command, "…999999999999 138\n…"
```

O ditto preserva a quebra de linha do HTML de origem como a sequência LITERAL
`\` + `n` dentro da string JSX. Em SVG, quebra de linha real é separador
válido; `\n` não é, e o parser aborta.

🚨 Nenhuma medição da skill acusa: rota responde, título bate, conteúdo bate,
geometria do elemento é a mesma (o `<svg>` ocupa o espaço), animação aplica.
Falha só o desenho DENTRO do SVG.

Conserto: `corrige-svg-path.mjs`. **Regra que fica: ler o CONSOLE do navegador é
gate barato**, e pega o que medição de DOM não pega.

## Links internos absolutos — o clone manda o visitante embora

| | número |
|---|---|
| `href="https://<domínio-do-original>/..."` no JSX | **8655** |
| páginas afetadas | **233** |

O ditto materializa link interno como URL absoluta para o site ORIGINAL. O
clone abre, renderiza igual, passa em cobertura, metadata, geometria, conteúdo
e no gate de animação — e **no primeiro clique manda o visitante para fora**.

🚨 O `NavegacaoClient` não salva: ele intercepta absoluto só quando o origin
bate com o da página, e `https://<domínio-do-original>` nunca bate com `127.0.0.1:8081`.

Conserto: `corrige-links-absolutos.mjs`. As menções que sobram (canônico, OG,
JSON-LD) ficam de propósito — metadata aponta para o original.

## A camada pode PIORAR a geometria: bloco oculto com caixa 1×1

Ao devolver conteúdo que a captura perdeu (itens de menu, itens de lista), a
receita clássica de "visually hidden" (1×1 com `clip`) faz o
`compara-geometria` acusar os elementos como "só no CLONE" — a correção de
conteúdo vira divergência de geometria.

No original esses itens têm caixa **0×0**. Reproduzir exatamente isso:
`width: 0; height: 0; overflow: hidden`. Presente no DOM (conta como conteúdo e
como link), sem caixa (não entra em comparação de geometria).

**A régua é o original, não a convenção de acessibilidade que parece boa.**

## `clip-path` com data URI truncada

`clipPath: url("data:image/gif")` — a captura cortou a data URI no meio. A URL
é inválida, o navegador ignora o clip e loga `ERR_INVALID_URL`.

Medido no site-next: o original tem **só** `inset(50%)` naquele elemento; o
clip-path truncado não existe lá. Ou seja, é lixo da conversão, não estilo
perdido — remover é o certo, e o visual não muda (URL inválida não aplica clip
nenhum).

**Varrer `data:image/[a-z]*"` sem `;base64,`** depois de clonar.

## Nem todo erro de console é defeito do clone

Antes de caçar um erro, medir os DOIS lados. No site-next:

| rota | erros no original | erros no clone |
|---|---|---|
| `/careers` | 9 | 1 |
| `/platform/workflows` | 3 | **1 — o mesmo do original** |

O erro que sobrou no clone (`<svg> attribute preserveAspectRatio: "true"`) é
**bug do próprio site-next**, reproduzido fielmente. Consertá-lo seria afastar o
clone do original.

---

## 🚨 Alvo estático e NÃO-minificado: o ditto é o instrumento errado

Medido no `site-estatico`, alvo que não é aplicação compilada: quatro
arquivos servidos crus num host estático.

| O que o ditto foi feito pra vencer | O que este alvo é |
|---|---|
| Bundle React/Next minificado | `index.html` · `styles.css` · `script.js` · `config.js` |
| Tailwind, utilitária gerada | CSS à mão: 445 regras, 34 `@keyframes`, tokens em `:root` |
| Fonte inacessível, só o DOM renderizado | **Fonte original, com os comentários do autor em português** |

Rodar o ditto aqui seria reconstruir por aproximação o que dá pra **baixar
exato** — e destruiria os comentários, que num alvo desses são metade do valor
do clone.

**O teste de triagem, antes de subir a API:**

```bash
curl -s https://alvo.com/ | grep -oE '<script[^>]*src="[^"]*"'
```

| O que aparece | Diagnóstico |
|---|---|
| `/_next/static/chunks/<hash>.js`, `/assets/index-<hash>.js` | aplicação compilada → **ditto** |
| `script.js?v=<hash>`, `main.js`, `app.js` | site à mão → **baixar o fonte** |

Confirma-se com `curl -s .../script.js \| head -40`: se tiver bloco de
comentário humano, é fonte, não build.

**O ganho que compensa o desvio:** com o fonte em mãos, a fidelidade deixa de
ser estimada por geometria e passa a ser **provada por md5**. Segunda coleta
independente, hash arquivo a arquivo — fechou 40/40. Nenhum clone por ditto
consegue esse gate, e ele é mais forte que as sete dimensões juntas.

O resto da régua continua valendo igual: cobertura, geometria nas duas larguras,
console pareado, conferência visual. Muda o motor de captura, não o método.

---

## 🚨 O clone chama servidor de TERCEIRO em runtime, e nenhum gate pega

Medido no `site-estatico`. O site tinha três coisas armadas:

| O quê | Onde | O que acontecia |
|---|---|---|
| `POST https://api.crm-terceiro.com.br/api/lead` | `script.js:678` | cada teste vira **lead falso no CRM de terceiro** |
| `fbq('init','<id-do-pixel>')` + `<noscript>` beacon | `index.html` | evento nosso no Business Manager deles |
| `wa.me/55119…` | `config.js` | mensagem de teste no celular deles |

**Nenhum dos sete gates acusa isso, e o gate de link interno também não.** As
rotas respondem, a metadata bate, a geometria fecha em zero, o conteúdo confere,
o console fica limpo, e não há `href` vazando — porque a requisição **não está
no HTML**: ela só acontece depois de um formulário preenchido até o fim.

O gate de link interno procura link. Isto não é link, é `fetch` em runtime.

**O gate que pega:** interceptar `page.on("request")`, percorrer o fluxo até o
fim, e reprovar por host. Escrito em
`scripts/gate-vazamento.mjs`:

```
CLONE=http://127.0.0.1:8082 PROIBIDOS=dominio1,dominio2 node gate-vazamento.mjs
```

Sai com código ≠ 0 se qualquer host proibido for tocado. Fechou com **0
requisições** e o formulário percorrido nos 11 passos até o envio.

🚨 **Percurso parcial não fecha este gate.** Um caminhador que para na terceira
pergunta dá "0 proibidos" — mas o `fetch` mora no ÚLTIMO passo, então esse zero
não vale nada. O instrumento declara `chegou ao envio: SIM/NÃO`, e sem o SIM o
resultado é célula vazia.

**Por que o caminhador para:** clicar "na primeira opção visível" pega o card
que está SAINDO da transição. Em formulário com transição entre telas, dois
cards coexistem por alguns ms. Usar o teclado (Enter, e A/B/C pra escolha) evita
a disputa inteira.

---

## 🚨 Comparar valor REESCRITO em runtime lê os dois lados em estágios diferentes

A `bateria-cobertura` acusou título divergente num clone **byte a byte
IDÊNTICO** (md5 conferido, 40/40):

| | título lido |
|---|---|
| original | `Desenvolvemos seu site & criamos seus anúncios no Google \| Marca IA` |
| clone | `Descubra o site ideal para a sua empresa \| Marca IA` |

O `<title>` estático do HTML é o primeiro. O `script.js`, na linha 310,
**reescreve `document.title`** para o segundo. O clone é servido em localhost e
o JS roda antes da leitura; o original vem pela rede e ainda não tinha rodado.

**A diferença medida era a latência da rede, não o clone.** E o sintoma engana
duas vezes: o clone aparece como o lado ERRADO, quando na verdade estava
*adiantado*.

Vale pra todo campo que o JS pode reescrever: `document.title`, texto de marca
aplicado de um `config`, ano do rodapé, contador, qualquer coisa que venha de
`init()`.

**O conserto** é ancorar os dois lados no mesmo ponto do ciclo de vida — mesmo
`waitUntil` e mesmo assentamento nos dois. Está em
`scripts/confere-pareado.mjs` (`ASSENTA=3500`),
que além do título compara contagem de elementos, imagens quebradas, altura,
animações vivas, SVGs, fonte, fundo e console. Com ele: título idêntico, 995
elementos dos dois lados, 97 animações vivas dos dois lados.

---

## 🚨 `grep` no HTML cru não acha marca PARTIDA entre tags

Ao sanitizar a identidade do `site-estatico`, o `grep` por nome de
cliente deu **zero resíduo** — e a marca continuava visível na tela.

A wordmark estava partida por tag, para estilizar uma sílaba:

```html
<b>Mar<i class="or">ca</i>X</b>        <!-- lê-se "MarcaX" -->
<span>Marca <em>IA</em></span>         <!-- lê-se "Marca IA" -->
<b>Mar<em>ca</em>X</b>                 <!-- a MESMA marca, outra tag -->
```

Cobrir uma variante não cobre as outras: aqui a mesma marca aparecia partida com
`<em>` num lugar e com `<i class="or">` em outro.

**A auditoria tem que rodar no texto que o usuário VÊ**, com as tags removidas
antes:

```bash
sed -e 's/<[^>]*>//g' index.html | sed 's/&nbsp;/ /g' > texto-puro.txt
grep -oiF "MarcaX" texto-puro.txt | wc -l
```

Só com isso os resíduos apareceram. Serve para qualquer varredura de conteúdo
por texto, não só sanitização.

---

## 🚨 No Git Bash, `ROTAS=/` vira caminho do Windows e a rota some

O `bateria-cobertura.mjs` já documenta que `ROTAS="/"` é um diretório que
EXISTE e faz o `readFileSync` estourar com `EISDIR`. **No Git Bash o sintoma é
outro, e pior: não estoura.**

O MSYS converte `/` em `C:/Program Files/Git/` antes do Node ver. Aí
`existsSync` dá true, `isFile()` dá false, e o carregador cai no
`split(",")` — tratando o caminho inteiro como se fosse **uma rota**:

```
| Rota                     | HTTP |
| C:/Program Files/Git/    |    0 |
responderam 200: 0/1
```

Falha calada que parece defeito do clone.

⚠️ **`MSYS_NO_PATHCONV=1` não resolve**: ele desliga a conversão para tudo, e aí
o próprio caminho `/c/Users/...` do script não é mais traduzido —
`Cannot find module 'C:\c\Users\...'`.

**O conserto** é gerar a `rotas.json` de verdade com o `levanta-rotas.mjs` e
passar o arquivo. Em site de rota única também: a lista-mestra é o contrato, e
gerá-la custa um comando.
