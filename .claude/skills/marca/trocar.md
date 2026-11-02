# Trocar a marca

O que este arquivo é: como trocar uma parte da marca, ou a marca inteira, e
por que a troca cabe num arquivo só. Ler no `/marca trocar`.

---

## A promessa

**Um arquivo muda, no workspace: `identidade/marca.tokens.json`** (e o `identidade/marca.md` <!-- caminho futuro: o /marca configurar grava -->
para o que não é número). O gerador reescreve todas as saídas, e a régua
reprova a saída que ficou para trás:

```bash
node scripts/marca/gerar.mjs
node scripts/marca/conferir.mjs
```

Os moldes das superfícies (o kit do carrossel, o desenho do guardanapo, o tema
do `/novo-projeto`) não têm cor, fonte nem curva escrita à mão: só token. Se
alguém precisar abrir um deles para trocar de marca, o contrato quebrou, e o
`conferir` aponta a linha.

## O que trocar, e onde

| Quero trocar | Onde |
|---|---|
| uma cor | `node scripts/marca/rascunho.mjs --<papel> <hex>` (refaz as derivadas, abaixo); à mão, `cor.primitiva.<nome>`, e o papel aponta por alias e acompanha |
| o fundo escuro (slide escuro, fecho) | é a `principal`; o `abismo` só entra quando o claro não se lê nela (e no terminal do carrossel). Fundo escuro de outra cor pede outra principal: trocar só o abismo não aparece, e a proposta avisa |
| o papel de uma cor | `cor.papel.<papel>`: o `$value` aponta outra primitiva |
| a letra | `fonte.display`, `fonte.destaque`, `fonte.mono` (família e `$extensions` com `marca.url` ou `marca.arquivo`), `fonte.peso` |
| os cantos | `raio.*`; `raio.pilula` |
| o movimento | `movimento.curva.*` (quatro números), `movimento.duracao.*`, `movimento.cascata` |
| a imagem | `imagem.estilo`, `imagem.evitar` |
| o som | `som.voz`, `som.assinatura`, `som.trilha` |
| o que as réguas barram | `recusas` |
| o logo | o arquivo em `identidade/logo/` |
| a fonte local | o arquivo em `identidade/fontes/` |

## O contraste

Quem decide é a régua, pela regra única (`scripts/marca/derivar.mjs`):

- o texto sobre o claro usa a `principal`; se ela não passa 4,5:1, o `abismo`;
- o fundo escuro usa a `principal`; se o claro não se lê nela, o `abismo`;
- o acento em texto, em cada fundo, cai na cor de texto daquele fundo quando
  não passa 3:1;
- o texto de apoio translúcido do carrossel (o parágrafo, a legenda, o rótulo)
  sobe a opacidade só até passar 4,5:1 sobre cada fundo onde aparece (o rótulo
  pequeno, 3:1), e o aviso diz quanto subiu;
- reprova só o que nenhum papel resolve, com o hex mais perto que passa.

**Cor nova passa pela proposta antes de gravar.** A troca vai primeiro para um
rascunho fora de `identidade/`, que parte da marca de hoje, e a proposta
compara com ela:

```bash
node scripts/marca/rascunho.mjs --principal <hex> --saida <rascunho.tokens.json>
node scripts/marca/proposta.mjs --arquivo <rascunho.tokens.json>
```

O rascunho refaz as cinco derivadas (apoio, lavado, raro, abismo, ok) quando a
principal ou o claro mudam: elas são primitivas próprias, e trocar só a
principal no arquivo as deixaria na cor de antes. Na troca só do acento, elas
ficam. A derivada dada (`--abismo <hex>`) vence a conta.

Ela diz, lugar por lugar, a cor que entra e a que sai, se ficou mais clara ou
mais escura, e quando o lugar trocou de papel. É o que explica o "pedi mais
escuro e o texto clareou": a principal escureceu até segurar texto, e o texto,
que era o abismo, passou a ser ela. A cor que não segura texto vem ao lado do
tom mais perto que passa, e a pessoa escolhe.

## A marca inteira (outra identidade)

1. Rodar a entrevista de novo (`entrevista.md`) com o material novo.
2. Trocar o logo e as fontes locais em `identidade/`.
3. Gerar e conferir.
4. Renderizar uma peça de verdade: o catálogo do carrossel mostra os
   componentes, mas peça real em tamanho de feed é o que prova.

## O site que já foi gerado na marca

O projeto de `projetos-pessoais/` que o `/novo-projeto` criou na marca do
workspace guarda a cópia dele (`src/styles/tokens.css`, `fontes.css` e o
ícone): o arquivo é do projeto, pode ter sido editado, e o gerador da marca não
o reescreve. O `conferir` avisa cada projeto que ficou nas cores ou na forma de
antes (os raios, o botão em pílula, a letra de destaque e a mono, que o site
herda da marca), com o comando que leva a troca:

```bash
node .claude/skills/novo-projeto/esqueleto/scripts/gerar-marca.mjs --alvo projetos-pessoais/<projeto> --refazer
```

O `--refazer` reescreve esses arquivos: o que foi editado à mão neles se perde.

## A marca de um cliente

A marca do cliente mora na pasta dele, no mesmo formato
(`<pasta do cliente>/identidade/marca.tokens.json`). As superfícies leem outra
raiz pela variável `MARCA_RAIZ` (o carrossel e os scripts da marca) ou
`GUARDANAPO_MARCA` (o guardanapo). A marca do workspace não muda.

## Checklist da troca

- [ ] Cor nova passou pelo rascunho e pela proposta (`node scripts/marca/proposta.mjs`), e a pessoa escolheu
- [ ] A troca foi no `marca.tokens.json` ou no `marca.md`, nunca numa saída
- [ ] `node scripts/marca/gerar.mjs` rodado
- [ ] `node scripts/marca/conferir.mjs` limpo, com os avisos mostrados à pessoa
- [ ] Cada projeto que o `conferir` aponta como velho, refeito com o comando do aviso (ou mantido, se a pessoa quiser)
- [ ] Uma peça real renderizada e olhada
