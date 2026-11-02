# A entrevista da marca

O que este arquivo é: as perguntas do `/marca configurar`, o que cada resposta
grava no `identidade/marca.tokens.json` e no `identidade/marca.md`, e o caminho <!-- caminho futuro: o /marca configurar grava -->
de quem não sabe responder. Ler só nesse modo.

A entrevista cuida do que é visual e sensorial: cor, fonte, logo, forma,
movimento, imagem e som. Nome, @, voz do texto, público, oferta e CTA moram na
`_memoria/`: a entrevista **lê de lá** e nunca copia para cá. Se a memória está
em branco, dizer em uma frase que o `/instalar` a preenche, e seguir: a marca
visual não espera a memória.

---

## Como conduzir

- **Uma pergunta por vez**, em conversa. Nada de formulário.
- **"Não sei" é resposta válida em todas.** Cada pergunta tem o caminho dela.
- **A proposta vem do material da pessoa**: o logo ou o site atual dão a cor, a
  fonte e o tom. Pergunta aberta só quando não há material.
- Se a pessoa já mandou tudo numa mensagem, confirmar e gravar sem perguntar
  de novo.
- **Mostrar antes de gravar** (passo 7) e só gravar com o "sim".

---

## 1. O material: logo ou site

> Me manda o seu logo (PNG ou SVG) ou o link do seu site. Eu tiro de lá a cor e
> a letra e te mostro uma proposta.

Do site: a cor de fundo dominante, a cor do texto, a cor dos botões e as
famílias de fonte do CSS (o `/raspar` lê o texto; o visual se vê no
navegador). Botão costuma ser o acento; o fundo dominante, a principal ou o
claro. Do logo: as cores dele, e a letra quando é tipográfico.

Grava: o logo em `identidade/logo/` como `logo-clara.png` (para fundo escuro) e
`logo-escura.png` (para fundo claro), e a seção "Logo" do `marca.md` (onde
assina: na capa ou no fecho).

Sem material: seguir para a pergunta 2 pela via aberta. Sem logo: gravar "sem
logo" no `marca.md`; o fecho assina só com o @.

## 2. A cor

> Pelo seu material, a principal é esta (hex), o fundo claro este e o acento
> este. Bate? Quer trocar alguma?

Sem material: "Qual é a cor principal da marca? Pode ser o nome, o hex ou uma
marca que você admira." Sem resposta: propor três direções ("escura e sóbria",
"clara e leve", "forte e quente") e, da escolhida, uma cor concreta com hex.

Grava em `cor.primitiva` (com o nome que a pessoa usa) e aponta os papéis em
`cor.papel` por alias:

| Papel | A pergunta certa |
|---|---|
| `principal` | qual cor manda na marca? Mesmo clara: é ela que pinta o fundo escuro e o texto sobre o claro, quando passa |
| `claro` | qual é o fundo claro? |
| `acento` | o que puxa o olho: botão, destaque, régua |
| `apoio` | o que acompanha a principal sem competir |
| `lavado` | cartão e respiro sobre o claro |
| `raro` | o de menor peso, em pouca área |
| `abismo` | o mais fechado: terminal, fecho escuro, e o texto quando a principal não passa sobre o claro |
| `ok` | o "concluído" |

Marca com duas ou três cores (o normal): as outras saem da principal, sem
cor nova de verdade, e quem faz a conta é o rascunho do passo 7: o apoio é a
principal clareada; o lavado, a principal a 10% sobre o claro; o raro, um
neutro médio; o abismo, a principal escurecida até o claro se ler nele com
folga; o ok, a principal clareada até ler sobre o abismo. A derivada que a
pessoa quiser escolher vai como `--apoio`, `--abismo` etc., e vence a conta.

**O contraste não se negocia no olho**: o `conferir.mjs` mede pela regra única
(`scripts/marca/derivar.mjs`). O texto usa o papel que passa (a principal, ou
o abismo); o acento em texto cai na cor de texto do fundo onde não passa 3:1.
Só reprova o que nenhum papel resolve, e o erro diz o hex mais perto que
passa. A pessoa vê o que a derivação trocou antes de gravar, pela proposta
do passo 7.

Os papéis de interface (`superficie`, `borda`, `texto`, `texto-suave`, `erro`,
`aviso`, `sucesso`) se derivam sozinhos. Só se declaram quando a pessoa quer um
valor dela (um vermelho de erro da marca, por exemplo).

## 3. A letra

> A marca tem fonte? Pelo seu site, é esta. Se não tiver, eu proponho uma.

Grava em `fonte`: `display` (título e corpo), `destaque` (o trecho de destaque
no título) e `mono` (rótulo, tag, terminal), cada um com a família e a origem:
`marca.url` (Google Fonts) ou `marca.arquivo` (`fontes/<arquivo>.woff2`, com o
arquivo em `identidade/fontes/`). O estilo do destaque vai em `marca.estilo`
(`italic` ou `normal`). Os pesos vão em `fonte.peso`. Com a `marca.url`, o
site que o `/novo-projeto` cria baixa a fonte em woff2 uma vez e a serve de
dentro dele.

Marca de uma família só: os três papéis com ela (o destaque pode ser a mesma
família em outro peso ou em itálico). O trio display + serifada + mono do molde
é sugestão, não regra.

Fonte fora do Google Fonts: pedir o arquivo e gravar em `identidade/fontes/`.
Com o arquivo local, o guardanapo e o render offline usam a letra da marca;
sem ele, caem numa neutra, com aviso.

Não sei: oferecer três pares em uma linha cada (editorial, neutro, quente) e
recomendar um pelo que a marca vende (`_memoria/oferta.md`).

## 4. A forma

> Os cantos da marca são retos, levemente arredondados ou bem redondos? Botão
> em pílula (totalmente redondo) combina com você?

Grava: `raio.sm`, `raio.md`, `raio.lg`, `raio.cartao` em px e `raio.pilula`
(`true` ou `false`). Pílula aceita tira `pilula` das `recusas` que o molde sugere
(o `conferir` reprova os dois juntos); pílula recusada fica nelas.
A sombra (`sombra.clara`, `sombra.escura`) segue o molde salvo pedido: duas
difusas, sem borda dura.

## 5. O movimento, a imagem e o som

> Me mostra um vídeo, um site ou um app cujo movimento tem a cara da sua
> marca. Ou me diz em três palavras: calmo, firme, elástico, rápido...

Grava em `movimento`: a curva principal, a de entrada e a de saída
(`cubicBezier`, quatro números), as durações rápida, média e lenta, e a
cascata. Tradução das palavras: "calmo" pede curva longa e suave; "firme",
saída rápida e assentada; "elástico", curva que passa do ponto e volta (o
segundo ou o quarto número fora de 0 a 1), e isso não combina com `bounce` ou
`elastic` nas recusas: o `conferir` reprova a contradição.

> E para imagem: uma referência de foto ou ilustração que é a sua cara?

Grava `imagem.estilo` (a frase que abre todo prompt de imagem, por exemplo
"ilustração chapada, cores da marca, traço limpo") e `imagem.evitar` (a
lista). Em prosa, o estilo vai também no `marca.md`, com a referência.

> Som é opcional: tem voz de narração, assinatura sonora ou estilo de trilha?

Grava `som.voz`, `som.assinatura`, `som.trilha`, ou deixa vazio.

## 6. As recusas, uma a uma

Ler a lista sugerida do molde e perguntar cada uma em linguagem de gente:

| Identificador | A pergunta |
|---|---|
| `bounce`, `elastic` | movimento que quica ou estica passando do ponto? |
| `kicker` | rótulo pequeno em cima do título no vídeo e no motion? (no carrossel ele faz parte do método e fica: dizer isso à pessoa) |
| `contador` | número que conta subindo na tela? |
| `pilula` | já respondida na forma (passo 4): não perguntar de novo |
| `branco-puro` | fundo branco puro (em vez de um quase branco)? |
| `sombra-dura` | sombra com borda seca, sem desfoque? |
| `icone-solido`, `gradiente` | ícone preenchido? degradê? |

"Não quero" entra em `recusas`; "pode" sai da lista; "não sei" fica como o
molde sugere, e a pessoa troca depois pelo `/marca trocar`. Recusa que nenhuma régua
lê (um tema, um tipo de foto) vai em prosa no `marca.md`, "Recusas visuais".

## 7. Mostrar, gravar e conferir

Antes de mostrar, montar o rascunho fora de `identidade/` com as cores da
pessoa (a conta das derivadas é dele) e rodar a proposta. O rascunho só faz as
cores: as outras respostas (a letra, a forma, o movimento, a imagem, o som, as
recusas) se escrevem no JSON dele, nos tokens que cada passo acima diz. A
"Sugestão do molde" que a pessoa confirmou pode ficar.

```bash
node scripts/marca/rascunho.mjs --principal <hex> --claro <hex> --acento <hex> --saida <rascunho.tokens.json>
node scripts/marca/proposta.mjs --arquivo <rascunho.tokens.json>
```

Ela diz onde cada cor cai (o texto, os fundos, o destaque, o botão do site),
com a medida. A cor que não segura texto não some calada: a proposta diz qual
papel entrou no lugar dela e põe ao lado o tom mais perto que passa, e a pessoa
escolhe entre a sua e esse, na página que a proposta grava (o endereço sai no
fim). Gostar da cor que não segura texto não a perde: ela pode ficar como
`apoio` ou `lavado` (`--apoio <hex>`), que não carregam texto. O tom proposto já passa na regra inteira: escolhido, ele volta ao
rascunho (`node scripts/marca/rascunho.mjs --de <rascunho.tokens.json> --principal <tom> --saida <rascunho.tokens.json>`,
que refaz as derivadas) e a proposta roda limpa. Com uma marca já configurada,
ela compara: o que clareou, o que escureceu e por quê ("antes o abismo, agora a
principal"). O aviso "ainda dizem Demonstração" lista o que a pessoa ainda não
respondeu.

Mostrar num bloco só: a proposta, as fontes, o raio, a curva em palavras, a
frase de imagem, o som e as recusas. Com o "sim":

1. o rascunho copiado para `identidade/marca.tokens.json`; <!-- caminho futuro: o /marca configurar grava -->
2. `identidade/marca.md` a partir do `marca.molde.md`; <!-- caminho futuro: o /marca configurar grava -->
3. `node scripts/marca/gerar.mjs` e `node scripts/marca/conferir.mjs`, até
   limpo. Cada erro diz o conserto;
4. o ambiente: `node .claude/skills/carrossel/render/render-carrossel.js --checar`
   (confere só o navegador do render). Se reclamar do Playwright, a entrevista
   termina apontando `.claude/skills/carrossel/render/instalar.md`;
5. a marca vista: `node .claude/skills/carrossel/render/render-carrossel.js --catalogo`
   serve o catálogo do kit já na marca nova; abrir a URL e mostrar à pessoa as
   cores, a letra e os cantos antes de dar por pronto.

## O que a entrevista não faz

- Não inventa cor, fonte, curva ou recusa que a pessoa não aprovou.
- Não grava nome, @, voz do texto, público, oferta nem CTA: são da `_memoria/`.
- Não edita saída gerada nem molde de skill.
