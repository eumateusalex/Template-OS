# fluxo-completo.md — a receita, na ordem

> Provada ponta a ponta em `https://site-exemplo.framer.website/` (Framer, 21
> rotas, coleção de 10 posts e 4 projetos). Os comandos abaixo
> são os que rodaram, não os que deveriam rodar.

**Resultado que este fluxo entrega:** 21/21 rotas em 200, título de cada rota
batendo com o original, zero rolagem horizontal, zero imagem quebrada, e — na
home, medido elemento a elemento — **45 elementos fora do lugar caindo para 3**,
todos abaixo de 5.1px.

**O mesmo site pelo `--mode=multi` da CLI:** 8/21, sendo 4 delas página de erro.

🚨 **Passos 1 a 7 fecham a COBERTURA. Passos 8 a 12 fecham o "idêntico".** Parar
no passo 7 entrega um clone que passa em toda medição agregada e está
visivelmente desmontado quando se abre no navegador, e é o motivo de metade
desta receita existir.

---

## Antes de tudo, os caminhos que se repetem

```powershell
$S = "$env:CLAUDE_PROJECT_DIR\.claude\skills\clonar-site"
$SITE = "https://exemplo.com/"
$NOME = "exemplo"            # o nome da pasta, escolhido por nós
$C = "$S\clones\$NOME"       # o padrão do SKILL.md, "Onde a saída vai"; em pasta sincronizada, uma fora dela (ex.: C:\dev\clones\$NOME)
$M = "$C\medicoes"
New-Item -ItemType Directory -Force -Path $M | Out-Null
```

---

## Passo 1 — A lista-mestra (o contrato)

```powershell
$env:SITE = $SITE
$env:SAIDA = "$M\rotas.json"
$env:PROF = "3"
node "$S\scripts\levanta-rotas.mjs"
```

Cruza **sitemap** e **varredura de links no navegador**, grava a procedência de
cada rota e o status que o **original** devolve.

**Ler a saída antes de seguir.** Ela avisa:
- rota em uma fonte só (merece segunda olhada)
- rota que falhou na varredura
- ausência de sitemap (a lista passa a vir de uma fonte só)

⚠️ Rota que o original responde com 404 é **fantasma** e não entra no plano. O
`clona-completo.mjs` já filtra por `status`, mas conferir a lista é de graça.

---

## Passo 2 — A API local de pé

O plano all-static **não existe na CLI**. Só pela API.

```powershell
cd C:\dev\ditto
npm run start --workspace @cloner/api
```

⚠️ **Não usar `npm run dev:api`** — ele roda `tsx watch`, e o hot-reload mata o
Playwright no meio do clone. E **`dev:api:stable` não existe**, apesar de a
mensagem de erro do próprio ditto mandar usar.

Deixar esse terminal de pé até o fim do passo 3: o reuso da captura de entrada
vive na memória desse processo.

---

## Passo 3 — Clonar todas as rotas

```powershell
$env:SITE = $SITE
$env:ROTAS = "$M\rotas.json"
$env:SAIDA = "$M\plano"
$env:API = "http://127.0.0.1:8787"
node "$S\scripts\clona-completo.mjs"
```

O script faz o fluxo obrigatório de dois passos e **espera cada job terminar**
(a API é assíncrona; disparar o segundo direto bate em `BUSY`):

1. clone `single` → guarda o `jobId`
2. clone `multi` + `experimentalContentHandoff: "ion-cms-v1"` + o plano
   all-static + aquele `jobId`

No fim ele imprime **as páginas geradas, uma por linha**. Conferir contra a
lista-mestra aqui, antes de gastar build.

💡 Se o passo 1 já rodou e você só quer refazer o 2, passe `JOBID=<uuid>`.

⚠️ Um clone por vez. O guard `BUSY` recusa concorrência.

---

## Passo 4 — Desempacotar

O resultado é um mapa de arquivos JSON, e os binários vêm por URL:

```powershell
$env:DITTO_API_URL = "http://127.0.0.1:8787"     # sem isto, os assets não vêm
cd C:\dev\ditto
npm run unpack -- "$M\plano\clone.json" "$C\app"
```

Sem o `DITTO_API_URL` o unpack escreve os textos e falha em **toda imagem,
SVG e ícone**, dizendo `relative asset URL but no --base-url`.

---

## Passo 5 — Corrigir a metadata (obrigatório)

O ditto declara metadata só no `layout.tsx` raiz, então **toda rota herda a da
home**, `canonical: "/"` incluído.

```powershell
$env:ORIGINAL = $SITE
$env:APP = "$C\app"
$env:ROTAS = "$M\rotas.json"
node "$S\scripts\corrige-metas.mjs"
```

Colhe título, descrição, canônico e OpenGraph de cada rota **no original** e
escreve `export const metadata` na `page.tsx`. Idempotente.

💡 `ESCREVER=0` simula sem tocar em arquivo.

---

## Passo 6 — Buildar e servir

```powershell
cd "$C\app"
npm install
npm run build
```

O app é `output: "export"`, então o artefato é o `out/`. Servir o estático:

```powershell
$env:RAIZ = "$C\app\out"
$env:PORTA = "8081"
node "$S\scripts\serve-clone.mjs"
```

O servidor manda `no-store`, o que elimina a classe inteira de "build velho na
tela", e responde o header `X-Resolvido-Por` dizendo se a rota casou como
arquivo exato, `.html` ou `/index.html`.

⚠️ O export sai **plano** (`terms.html`, não `terms/index.html`), porque
`trailingSlash` não vem ligado. Hosts estáticos comuns tentam o `.html`, então
funciona — mas é bom saber que a rota depende desse fallback.

---

## Passo 7 — Medir, que é o que fecha

```powershell
$env:CLONE = "http://127.0.0.1:8081"
$env:ORIGINAL = $SITE
$env:ROTAS = "$M\rotas.json"
$env:SAIDA = "$M\cobertura"
$env:SHOTS = "1"
node "$S\scripts\bateria-cobertura.mjs"
```

Exit 0 só sai quando **toda rota da lista-mestra responde 200**. Rota não
medida conta como pendência, nunca como aprovação.

E a fidelidade visual:

```powershell
$env:SAIDA = "$M\visual"
$env:LARGURAS = "1280,375"
node "$S\scripts\compara-visual.mjs"
```

Mede os **dois lados no mesmo viewport** e compara altura, marcos, fontes e
contagem de imagens.

---

---

## Passo 8 — Consertar o que a captura destruiu no código

🚨 **Antes de qualquer camada de comportamento**, dois consertos de código que
valem para o clone inteiro e não dependem de medição nenhuma:

```powershell
$env:APP = "$C\app"

# 1. variáveis CSS que o ditto quebrou ao converter para JSX
node "$S\scripts\corrige-variaveis-css.mjs"

# 2. o clone não recebe mouse: ::after decorativo + pointer-events:none
node "$S\scripts\corrige-interacao.mjs"

# 3. garantir que cada rota IMPORTE as folhas da camada
$env:FOLHAS = "geometria.css,scroll.css,entrada.css,hover.css"
node "$S\scripts\liga-css.mjs"
```

**Por que os três, com número:**

1. `-FramerFontSize` não é propriedade CSS. Medido no site-exemplo: **155
   chaves em 21 arquivos**, e o título do rodapé renderizando com 12px onde o
   original usa 296px.
2. Medir um clone bloqueado mede o bloqueio, não o comportamento. Antes disto:
   **17 alvos em timeout, zero resposta a clique**.
3. Escrever o CSS não o liga: o Next só inclui no bundle da rota o que a
   `page.tsx` **daquela rota** importa.

---

## 🚨 Passo 8b — A LINHA DE BASE, antes de escrever qualquer camada

Este passo custa um build e responde a pergunta que decide todo o resto:
**quanto o clone já erra sozinho?**

```powershell
$env:APP = "$C\app"; $env:MED = $M
$env:MODO = "listar";   node "$S\scripts\linha-de-base.mjs"   # o que existe de camada
$env:MODO = "desligar"; node "$S\scripts\linha-de-base.mjs"
cd "$C\app"; npm run build
node "$S\scripts\compara-geometria.mjs"    # ← GUARDAR este número
$env:MODO = "religar";  node "$S\scripts\linha-de-base.mjs"
cd "$C\app"; npm run build
```

**Na primeira passada não há camada nenhuma**, então o número sai direto: é a
fidelidade que a captura entrega sozinha. Guardar.

**Depois de cada rodada de reconstrução, comparar contra ele.** Medido no
site-exemplo: 29 na base, 45 com a camada — a camada tinha **acrescentado 16
defeitos**, e nenhuma medição anterior tinha percebido.

🚨 **Camada que piora sai antes de qualquer outra coisa.** Não se investiga
divergência em cima de uma camada que está criando divergência.

⚠️ O `desligar` recusa rodar se já existir cópia de segurança — rodar duas
vezes gravaria os placeholders por cima da camada de verdade.

---

## Passo 9 — Reconstruir o comportamento, em PASSADAS

🚨 **A ordem importa, e o número de builds também.** Cada instrumento mede o
clone servido; medir antes de buildar a camada anterior lê o estado velho. Mas
buildar por rota custa 10 minutos só de build. A saída são duas passadas:

```powershell
$env:ORIGINAL = $SITE
$env:CLONE = "http://127.0.0.1:8081"
$env:APP = "$C\app"
$env:ROTAS = "$M\rotas.json"
$env:MED = $M

# FASE 1 — scroll + entrada em todas as rotas (dependem do clone CRU)
$env:FASE = "1"
node "$S\scripts\propaga-comportamento.mjs"
# 🚨 ligar o runtime: <script src="/scroll.js" /> no topo do <body> do layout.tsx,
#    sem defer. O gera-scroll escreve o arquivo e não o liga, e sem ele a
#    revelação não acontece (o mede-revelacao.mjs acusa)

cd "$C\app"; npm run build

# FASE 2 — geometria estática (depende do clone JÁ com comportamento)
$env:FASE = "2"
node "$S\scripts\propaga-comportamento.mjs"

cd "$C\app"; npm run build
```

Salva progresso a cada rota: interromper não custa o trabalho inteiro.

⚠️ **Hover e acordeão pedem passo próprio**, porque dependem de uma medição de
interação no original (`mede-interacao.mjs`), que é cara. Rodar nas rotas que
tiverem FAQ ou hover que importe:

```powershell
$env:SITE = $SITE; $env:SAIDA = "$M\interacao-original\$NOME"
node "$S\scripts\mede-interacao.mjs"   # o que responde a hover e clique no original
$env:MED = "$M\interacao-original\$NOME\interacao.json"
# 🚨 a CURVA do hover, antes de gerar: sem ela o :hover sai INSTANTÂNEO
$env:ALVOS = $env:MED; $env:SAIDA = "$M\hover-curva\$NOME"; $env:MAX_CURVA = "6"
node "$S\scripts\mede-hover-curva.mjs"

$env:CURVA = "$M\hover-curva\$NOME\hover-curva.json"
node "$S\scripts\gera-interacao.mjs"   # hover, agora COM transição medida
node "$S\scripts\gera-acordeao.mjs"    # FAQ
```

⚠️ **Sem `CURVA=`, o `gera-interacao` escreve troca de estado instantânea**, e
isso quase nunca é fiel: no framer-5 o original tinha 48 alvos com hover e o
clone reproduzia 4, nenhum com transição. O amostrador é barato porque agrupa
por ASSINATURA — 48 alvos costumam ser 5 ou 6 curvas distintas.

E duas medições que só existem no ORIGINAL, uma vez por site:

```powershell
node "$S\scripts\mede-transicao-pagina.mjs"  # a rota troca com fade? (nos DOIS lados)
node "$S\scripts\mede-rotacao.mjs"           # o que gira em laço × o que está parado
```

⚠️ Se a medição de duração falhar numa rota, passar `DUR_FALLBACK` com uma
duração **medida em outra rota do mesmo site**. Continua sendo medição. O que é
proibido é inventar número: sem medição própria nem fallback medido, o
instrumento aborta de propósito.

---

## Passo 10 — Buildar e passar TODOS os gates

Nada do passo 9 está provado até o build passar e os gates fecharem:

```powershell
cd "$C\app"; npm run build

cd "$S\scripts"
node bateria-cobertura.mjs    # toda rota responde, título bate
node confere-entrada-todas.mjs  # 🚨 cada regra de animação aplicou no BUILD, em todas as rotas
node compara-conteudo.mjs     # texto, imagens, links
node compara-geometria.mjs    # 🚨 CADA elemento no lugar — é este que decide
node mede-interacao.mjs       # hover e clique respondem
```

🚨 **O `compara-geometria.mjs` é o que decide se ficou idêntico.** O
`compara-visual.mjs` deu 42/42 com Δaltura 0px numa página visivelmente
desmontada: altura e fontes são agregados, e agregado não muda quando um
elemento anda para o lado. Ele segue útil como detector grosso, nunca como
prova.

🚨 **O `confere-entrada.mjs` é o gate que ninguém pode pular.** Escrever a regra
não garante que ela sobreviva ao build: o minificador já invalidou um
`linear()` e matou 2 de 12 animações sem erro nenhum em lugar nenhum.

💡 **O ciclo é fechado.** O `corrige-geometria.mjs` só descobre que uma correção
piorou na rodada SEGUINTE, comparando com o que guardou. Rodar duas vezes, com
build no meio, não é desperdício: é o mecanismo.

---

## Passo 11 — Os dois estados que a captura não alcança

🚨 **O ditto fotografa UM estado.** Duas coisas ficam de fora por definição, e
nenhuma medição de rota, metadata, conteúdo ou geometria acusa a falta.

**a) O que só nasce depois de um clique** — drawer, modal, menu de celular:

```powershell
$env:ORIGINAL = $SITE
$env:APP = "$C\app"
$env:GATILHO = 'button:has-text("Contact")'
$env:TEXTO_GATILHO = "Contact|Get quote|Get Started"
$env:NOME = "drawer"
node "$S\scripts\captura-estado.mjs"
```

Medido no site-exemplo: o clique em "Contact" cria **76 elementos** e 342
caracteres. Entra no clone como overlay escondido, com o estilo computado de
cada nó inline — e a imagem de dentro dele **baixada**, não linkada da origem.

Falta ligar: `<script src="/drawer.js" defer />` no `layout.tsx`.

**b) A navegação client-side.** Medido: o original troca de página sem
recarregar o documento; o clone recarregava tudo, com flash branco e a animação
de entrada reexecutando a cada clique. O conserto é um componente cliente no
layout que intercepta o clique — não trocar `<a>` por `next/link` em 21
arquivos de 460KB de JSX gerado.

⚠️ E aí o efeito colateral que quase passa batido: sem documento novo, os
`<script>` do layout rodam **uma vez só**, e da segunda rota em diante nada de
scroll nem de acordeão. Por isso os runtimes expõem `window.__dittoLigar()` e
`window.__dittoAcordeao()`, são idempotentes, e o componente os chama a cada
troca de rota.

---

## Passo 12 — O check-up, e só então o relatório

```powershell
$env:ORIGINAL = $SITE
$env:CLONE = "http://127.0.0.1:8081"
$env:APP = "$C\app"
$env:ROTAS = "$M\rotas.json"
$env:MED = $M
node "$S\scripts\checkup.mjs"
```

Uma linha por rota, uma coluna por dimensão. 🚨 **Célula vazia é pendência,
nunca aprovação** — e o instrumento sai com código diferente de zero enquanto
houver célula vazia ou elemento fora do lugar.

---

## O relatório final

Fechar sempre dizendo, com número:

- **cobertura**: quantas das quantas responderam 200
- **o que foi consertado** automaticamente (metadata, e o que mais tiver
  aparecido)
- **o que a captura perdeu** e não foi reconstruído
- **o que ficou residual**, nomeado

🚨 Nunca reportar "clonado com sucesso" sem a linha de cobertura. Foi
exatamente esse silêncio que fez o modo padrão parecer completo entregando
menos da metade.

---

## Quando o site for pequeno

Site de página única, sem coleção, o `--mode=single` da CLI resolve e é bem mais
rápido:

```powershell
cd C:\dev\ditto
npm run clone -- $SITE --out="$C"
```

⚠️ Mesmo aí, **levantar a lista-mestra antes**. "É uma página só" é suposição
até o `levanta-rotas.mjs` dizer que é.
