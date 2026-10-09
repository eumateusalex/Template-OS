---
name: guardanapo
description: "Monta peça desenhada à mão (o Guardanapo), carrossel, post ou diagrama em traço de rascunho nas cores da sua marca, pela cena.json, a régua e o render medido. Use para \"nesse estilo\", \"desenhado à mão\", \"estilo Excalidraw\", \"guardanapo\" ou /guardanapo."
---

# /guardanapo · a linguagem desenhada à mão

A ideia explicada no guardanapo: traço de rascunho, poucas caixas, setas, uma
anotação e um destaque. É a linguagem irmã do `/carrossel`: a mesma marca, outro
traço, para situações específicas (explicar um fluxo, uma ideia, um framework ou
um produto de um jeito informal e didático). O `/carrossel` não muda por causa
dela.

**A frase que resume:** imperfeição no traço, ordem na composição.

**Por que as regras são estas.** O traço torto diz "isto é um modelo, não a
especificação"; o que impede a peça de parecer amadora é a ordem. Medindo
diagramas desenhados à mão, os claros e os bagunçados se separam por três
números, e não pelo traço nem pela hachura: **quantidade** (o claro tem por
volta de 6 caixas; o bagunçado, o dobro), **tamanho de letra** (no claro, a
letra é o dobro do tamanho relativo) e **cor** (o claro usa uma cor além do
preto; o bagunçado, três ou mais). Daí o teto de nós, a letra grande e uma
tinta de destaque só. E a letra de mão custa espaço: para ler igual à Inter,
ela precisa ser cerca de 1,3 vez maior, o que deixa a frase quase 50% mais
comprida. Por isso o rótulo pede menos palavras, não letra menor.

**Onde não usar:** relatório que é prova, preço, proposta formal e gráfico com
valores. O traço torto custa precisão, e a letra de mão derruba a credibilidade
de número (em teste com leitores, o gráfico em fonte manuscrita foi julgado
menos crível). Ali vale o `/carrossel`.

---

## Passo 0: a marca e a escrita

1. **A cor sai da sua marca**, do `.claude/skills/carrossel/marca/tokens.css` <!-- caminho futuro: o /carrossel configurar grava -->
   (o roteador é o `identidade/design-guide.md`). Se esse arquivo não existe, ou
   ainda tem a linha `ESTADO: nao-configurado`, a marca não está fechada:
   **pare antes do roteiro e diga isso**. Ofereça os dois caminhos: rodar
   `/carrossel configurar` (que grava a marca, uma vez) ou seguir na **paleta
   neutra** do Guardanapo (quase preto sobre um off-white, um cinza e um acento azul).
   Só siga na neutra se o usuário escolher.
2. **O texto segue `_memoria/escrita-publica.md`** (a voz, a linguagem
   de balcão, a clareza, o que evitar). Leia a linha `**Caixa:**` de lá:
   `normal` é a caixa da língua; `minúscula` quer todo título, rótulo,
   anotação e frase em minúsculo, menos nome próprio e sigla. A máquina não
   cobra a caixa: quem cobra é você, ao escrever a cena.
3. **Peça de cliente** usa a marca do cliente: aponte o `tokens.css` dele com
   `GUARDANAPO_MARCA=<caminho do tokens.css>` antes de conferir e renderizar.
   `GUARDANAPO_MARCA=neutra` força a neutra.

O `conferir.mjs` e o `render.mjs` imprimem de onde a cor veio ("cores da marca"
ou "paleta neutra") e avisam a tinta da marca que tem menos de 3:1 sobre o
fundo (um acento amarelo some no traço).

---

## O fluxo

1. **Roteiro.** Uma pergunta por quadro, com os papéis `capa`, `meio`, `ponto`
   e `fecho`. O carrossel tem exatamente um `ponto`, e é nele que a cor de
   destaque entra. O texto segue o passo 0:
   - capa com "você" ou "seu" e a perda dita;
   - uma ideia por frase, até 14 palavras;
   - zero jargão;
   - sem travessão;
   - número só com prova (`_memoria/prova.md`), nunca inventado.
2. **A pasta.** A peça mora em `saidas/<assunto>-<data>/` <!-- caminho futuro: a pasta nasce na primeira peça -->
   enquanto o usuário não aprovar a linguagem para publicar.
3. **A `cena.json`** na pasta, no formato abaixo. Dois exemplos que passam na
   régua e no render, para copiar e trocar: `exemplos/orcamento/cena.json`
   (carrossel de 4 quadros) e `exemplos/post-agenda/cena.json` (post).
4. **Conferir:** `node scripts/guardanapo/conferir.mjs <pasta>`. Reprovou?
   A mensagem diz o que consertar. **Aviso** (linha, área, margem,
   sobreposição) é estimado: não conserte ainda, renderize, e o render decide
   com a largura real.
5. **Renderizar:** `node scripts/guardanapo/render.mjs <pasta>`. Ele confere de
   novo, mede no navegador e só grava os `quadro-NN.png` (2160 × 2700) se tudo
   passou, com o `medidas.json` do que o navegador mediu (fontes, nós, linhas
   do título, onde caiu o destaque). `--fonte mao` ou `--fonte inter` com
   `--saida <subpasta>` gera a mesma peça em outra fonte, para comparar.
6. **Olhar cada PNG em resolução real**, com o checklist do olho (abaixo).
   Suíte verde não prova design.
7. **Mostrar ao usuário** só depois do olho. Nada é publicado pela skill.

**O que precisa estar instalado:** as dependências do `scripts/package.json`
(o `roughjs`, que desenha o traço, e o `playwright`, que mede e fotografa) e o
Chromium do Playwright, uma vez; o `scripts/README.md` diz como. Sem eles, o
`render.mjs` para com "Cannot find package". As fontes (Excalifont e Inter) chegam em `fontes/` pelo instalador
(`node scripts/terceiros/instalar.mjs --so guardanapo-fontes`).

---

## A cena.json

```json
{
  "formato": "carrossel",
  "elementos": {
    "n1": { "tipo": "no", "texto": "pedido de orçamento", "x": 160, "y": 430, "largura": 400 },
    "p":  { "tipo": "pessoa", "texto": "cliente", "x": 800, "y": 530 },
    "s0": { "tipo": "seta", "de": "p", "para": "n1", "rotulo": "pede" }
  },
  "quadros": [
    { "papel": "capa", "titulo": "Onde seu orçamento perde o cliente", "mostrar": ["n1", "p", "s0"] },
    { "papel": "ponto", "titulo": "Aqui o cliente esfria", "mostrar": ["n1", "p", "s0"],
      "destaque": { "tipo": "foco", "alvo": "n1" }, "frase": "Uma frase de leitura, fora das caixas." }
  ]
}
```

**Da cena:**

- `formato`: `carrossel` ou `post` (um quadro só, sem papel, e o destaque pode
  entrar nele).
- `fonte`: `mao` (padrão, tudo na letra de mão), `hibrida` (a frase na Inter:
  use quando a frase tem número que é prova) ou `inter`.
- `tamanhos`: opcional, `{ "titulo", "rotulo", "frase" }`. Use o padrão; a
  faixa é só para caber (um `\n` entre duas frases, ou baixar o título, é o
  jeito de tirar palavra sozinha da última linha).

**Os números** (tetos, palavras, tamanhos e faixas, margem, área do desenho)
não se copiam aqui: `node scripts/guardanapo/conferir.mjs --regua` imprime a
régua de hoje, lida do `scripts/guardanapo/tokens.mjs` (`--fonte mao` ou
`--fonte inter` dá a área do desenho naquela fonte).

**Os tipos de elemento** (a posição `x`, `y` é o canto de cima à esquerda, no
quadro do tamanho que a régua imprime):

| Tipo | Campos | É |
|---|---|---|
| `no` | `texto`, `x`, `y`, `largura`, `altura`* | a coisa, a etapa (canto redondo) |
| `folha` | idem | tabela, arquivo (canto reto) |
| `elipse` | idem | a pessoa ou o resultado, o nó de ciclo |
| `losango` | idem | a decisão |
| `pessoa` | `texto` (o nome, que vai acima), `x`, `y` | quem faz; ocupa a altura de dois nós |
| `seta` | `de`, `para` (ou `saida: true` com `ate: [x, y]`), `curva`*, `rotulo`*, `lado`* | a relação; presa na borda dos dois |
| `linha` | `pontos: [[x, y], ...]`, `fino`* | estrutura (funil, eixo) ou traço solto |
| `grupo` | `texto`, `contem: [nomes]` | contorno cinza em volta do que pertence junto; não conta como nó |
| `anotacao` | `texto`, `x`, `y`, `largura`*, `aponta`* | a voz de quem explica, com seta curva se `aponta` |
| `texto` | `texto`, `x`, `y`, `largura`* | rótulo solto |
| `certo` | `x`, `y` | ✓ desenhado |

\* opcional. O nome de cada elemento é só letras, números, `_` e `-`.
`altura` sai sozinha do texto; `lado` do rótulo é `acima`,
`abaixo`, `direita` ou `esquerda` (sem ele, acima na seta deitada e à direita
na em pé).

**Em qualquer elemento**, os campos do significado:

- `tinta`: `problema` (a cor principal da marca, o padrão), `solucao` (a cor de
  apoio, o lado bom) ou `contexto` (o cinza da marca).
- `estrutura: true`: na tinta principal na capa e cinza depois, e não conta
  como nó.
- `opcional: true`: tracejado, o único jeito de tracejar.
- `riscado: true`: o risco diz "errado", e o elemento fica cinza. Errado se
  mostra riscado, nunca em vermelho: quem diz "errado" é o gesto, não a cor.
- `preenchimento`: `chapado` (a superfície clara) ou `hachura` (só em forma
  sem texto).

**Cor não se escolhe:** campo `cor`, `tracejado` ou `rugosidade` reprova, com
o caminho certo na mensagem. As cores saem da marca pelo papel:

| Papel | Da marca (`tokens.css`) | Na neutra |
|---|---|---|
| `problema` (traço e texto) | `--c-dark`, a principal | quase preto |
| `solucao` (o lado bom) | `--c-support-1`, o apoio | azul fechado |
| `contexto` (o já mostrado, o grupo) | a principal a 62% sobre o fundo | cinza |
| destaque (só no ponto) | `--c-accent` | azul |
| fundo | `--c-light` | off-white (nunca branco puro) |
| superfície (o chapado) | `--c-support-2` | cinza claro |

**Os quadros:**

- `papel`, `titulo` (obrigatório), `frase` (opcional, nunca na capa),
  `mostrar` (o que entra de novo neste quadro) e `destaque` (no máximo um).
- **O quadro cresce sozinho.** O que veio de antes sai em cinza, o novo sai
  na tinta dele, a anotação e o destaque do quadro anterior saem.
- **A capa** mostra as formas sem rótulo, na tinta principal, e não conta como
  "já mostrado".
- **As posições são fixas na peça inteira**: o desenho cresce, mas não muda de
  lugar. Componha pelo quadro mais cheio; os primeiros ficam com o pé vazio,
  e uma anotação presa ao nó novo ocupa esse pé quando ele pesar.
- **Quantos quadros:** capa, 1 ou 2 de meio, o ponto e o fecho. Duas etapas
  que formam uma ideia só dividem o quadro.
- **O destaque:**
  - `foco` (o contorno na cor de destaque) é o do nó;
  - `circulo` é só para palavra ou número (um `texto`, uma `anotacao`, ou
    `"titulo"` com `"palavra"`), e em volta de nó ele reprova;
  - `sublinhado` vai sob a palavra do título;
  - `seta` pede `de: [x, y]`.
  A cor de destaque só entra no quadro `ponto` (e, se precisar, no `fecho`).
  Numa história de causa e efeito, o destaque vai no efeito que o título nomeia.

---

## A régua

**Os números moram em `scripts/guardanapo/tokens.mjs`, e quem cobra é a
máquina.** Para compor, `node scripts/guardanapo/conferir.mjs --regua`. As
regras, sem número:

| O quê | Regra |
|---|---|
| Nós por quadro | o bom é 3 a 5; pessoa conta, grupo, estrutura e anotação não |
| Palavras | título curto (até 2 linhas), rótulo curtíssimo, anotação até uma frase |
| Letra | tudo na Excalifont; a frase na Inter só com `"fonte": "hibrida"` |
| Número que é prova | na frase, com a fonte `hibrida`; nunca na letra de mão |
| Cor | as três tintas da marca e o destaque só no ponto; nenhuma outra |
| Área do desenho | entre o título e a frase, com um respiro; a mensagem de "encosta" diz onde ela começa e termina |
| Frase | fica presa no pé do quadro e quebra sozinha |
| Largura da forma | quando o texto não cabe, a mensagem diz a largura que caberia; a elipse e o losango pedem mais que o nó, porque o texto fica mais para dentro |
| Ritmo | nós alinhados por borda ou centro, espaço repetido, uma quebra só (no ponto) |

**Essência** (sem isso não é Guardanapo): traço de duas passadas, formas
primitivas, tinta escura sobre fundo claro, destaque só no ponto, setas presas,
poucos nós alinhados, letra grande, letra de mão nos rótulos.

**Evitar:** mais nós que o teto, texto miúdo, várias ideias na mesma cena,
arco-íris de cor, hachura atrás de texto, parágrafo em caixa, gráfico de
valores à mão, círculo perfeito, sombra, gradiente, emoji, e a interface, o
roxo, o logo ou o nome do Excalidraw (a marca e o logo são deles: a peça nunca
diz que é Excalidraw).

---

## O que a máquina mede, e o que é do olho

**A máquina** (`conferir.mjs` antes, `render.mjs` no navegador) reprova:

- teto de nós, palavras, faixas de letra, papéis dos quadros, post com capa;
- título ou frase em mais de 2 linhas, rótulo em 3 linhas ou mais, palavra
  sozinha na última linha do título, da frase ou da anotação (a quebra é a
  real, com a largura de cada palavra medida no navegador);
- nome de elemento fora do formato, e número que não é número;
- círculo em volta de nó;
- destaque fora do ponto, tracejado e cor fora da porta;
- nome citado que não existe, travessão, número-prova na mão;
- nós sobrepostos, desenho fora da margem ou em cima do título ou da frase;
- fonte que não carregou;
- texto que passa da caixa, texto encostado em nó, texto cruzado por seta;
- destaque que cruza texto.

E avisa (sem reprovar) a tinta da marca com menos de 3:1 sobre o fundo.

**O olho** confere, em cada PNG:

1. A pergunta do quadro se entende sem o quadro seguinte?
2. O destaque está no ponto da peça, e só lá?
3. O vazio está agrupado em volta do desenho, e não espalhado?
4. A peça é sóbria? Peça que grita perde a confiança de quem lê.
5. O texto passa na régua de balcão (você, a perda, sem jargão) e na caixa
   da `escrita-publica.md`?
6. Algum quadro ficou pobre (um desenho pequeno perdido no branco)? Duas
   etapas que formam uma ideia só podem dividir o quadro.
7. A peça mostra um exemplo concreto, ou só promete? ("orçamento sem
   resposta" mostra; "onde você perde cliente" só promete.)
8. Seta chegando num nó com destaque? Use `foco`: o círculo seria cortado
   pela seta.

---

## Os padrões da skill

- **A fonte:** só letra de mão, o padrão da máquina; a `hibrida` só na peça
  com número que é prova.
- **O ponto do carrossel:** o contorno na cor de destaque no nó (`foco`);
  `sublinhado` e `circulo` ficam para palavra ou número.
- **O @, a assinatura e a numeração:** não entram no carrossel por padrão. O
  desenho é a peça; se a sua marca pedir assinatura, decida depois de ver no
  feed.
