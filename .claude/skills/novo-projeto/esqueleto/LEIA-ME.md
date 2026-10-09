# O esqueleto do /novo-projeto

A máquina que monta a parte técnica de um projeto pessoal com site ou
aplicação. **Não é skill e não se chama sozinha**: quem a usa é o
`/novo-projeto`, depois da entrevista e do `git init`. Este arquivo é para quem
MANTÉM o esqueleto.

Uma porta só: a criação é o `/novo-projeto`, e a marca de projeto novo sai da
entrevista, e não, por padrão, da marca do workspace. O projeto roda sem a
casa: nada nele aponta para o workspace.

## O que ele instala

| Tipo | O que é | Quem manda |
|---|---|---|
| **conferido** (`fundacao/`) | o `base.css`, os quatro conferidores (`fundacao`, `marca`, `auditar-ui`, `tela`), as provas deles, as libs | o esqueleto: o projeto não edita, e o conferidor `fundacao` reprova sha diferente |
| **marca** (`src/styles/`) | `tokens.css`, `fontes.css` e `src/app/icon.svg` GERADOS das cores e da fonte da entrevista pelo `.claude/skills/novo-projeto/esqueleto/scripts/gerar-marca.mjs`; `tema-shadcn.css` com o mapa dos papéis | o projeto, desde o primeiro dia |
| **semente** (o resto) | configs, layout, estados, `Secao`, FAQ, `Revela`, vitrine, `formato`, banco e proxy com testes, Dockerfile, Playwright | o projeto, desde o dia da cópia: o manifesto guarda só a origem, e versão nova chega como aviso |
| **lock** | o `package-lock.json` da fixture, o mesmo do teste | o projeto: fora do manifesto, porque o `npm install` o reescreve |
| **receita** | o que só um projeto teve até hoje | fica aqui, em `.claude/skills/novo-projeto/esqueleto/referencias/receitas.md` |

A marca do workspace (`--marca casa`) é uma opção do instalador, fora da
entrevista. Ela lê uma marca de web pronta na pasta que o `webDaCasa()` do
`.claude/skills/novo-projeto/esqueleto/scripts/instalar.mjs` aponta
(a pasta identidade/web na raiz do workspace, ou a de `FUNDACAO_MARCA_WEB`), no
formato da marca de exemplo de `fixtures/marca-web/`: `tokens.css`, `fontes.css`, `fontes/` e
`tema-shadcn.css`. **O template não traz essa pasta e nenhuma skill a gera**: a
marca do `/carrossel` é de peça, não de site. Sem a pasta, `--marca casa`
recusa e o caminho é `--marca projeto`; os testes usam a marca de exemplo.

## Como o /novo-projeto o chama

Offline, depois do `git init`:

```bash
node .claude/skills/novo-projeto/esqueleto/scripts/instalar.mjs --alvo projetos-pessoais/<nome> --trilha app [--primaria #hex --fundo #hex --texto #hex] [--fonte sistema|<arquivo>] [--sem-banco]
```

Cor que não passa em 4,5:1 é recusada ANTES de qualquer arquivo, com a cor
mais perto que passa: a pergunta volta para ele. Sem cor nenhuma, a marca nasce
neutra e o cabeçalho do `tokens.css` diz que ela está a definir.

Com rede, dentro do projeto (pelo caminho, nunca com `cd` no comando):

```bash
npm --prefix projetos-pessoais/<nome> install
npm --prefix projetos-pessoais/<nome> exec -- shadcn add --yes --cwd projetos-pessoais/<nome> button input textarea label field alert card separator empty skeleton
node .claude/skills/novo-projeto/esqueleto/scripts/instalar.mjs --pisos projetos-pessoais/<nome>
git -C projetos-pessoais/<nome> add -A
npm --prefix projetos-pessoais/<nome> run portao
```

O `--pisos` mede as catracas com os próprios conferidores: projeto novo nasce
com tamanho 1 (o `field.tsx` do registry), hex 0 e paleta 0.

⚠️ **O `npx playwright install` à mão leva `PLAYWRIGHT_SKIP_BROWSER_GC=1`.**
Sem ele, o Playwright apaga do cache da máquina os navegadores das outras
versões, e o que dependia deles na máquina para de funcionar. O
conferidor `tela` já faz isso sozinho.

Trocar a marca de um projeto já criado:

```bash
node .claude/skills/novo-projeto/esqueleto/scripts/gerar-marca.mjs --alvo projetos-pessoais/<nome> --primaria #hex --fundo #hex --texto #hex [--fonte <arquivo>] --refazer
```

## As opções do instalador

| Opção | Faz |
|---|---|
| `--trilha app` | Next 16, Tailwind 4, shadcn (Base UI), as sementes todas |
| `--trilha pagina` | só a marca e o portão, sem semente de página |
| `--primaria`, `--fundo`, `--texto` | as cores da entrevista, em hex |
| `--fonte sistema\|<arquivo>` | a fonte do sistema, ou um arquivo woff2, ttf ou otf (convertido pelo `fontTools`); `--fonte-negrito` e `--nome-da-fonte` completam |
| `--marca casa` | a marca de web montada à mão na pasta do `webDaCasa()` (ver o topo), conferida em `fundacao/`; sem ela, recusa |
| `--sem-banco` | sem `src/lib/banco/` e sem `src/proxy.ts` |
| `--sem-fabrica --portao <arquivo>` | para projeto que já tem portão: os conferidores entram, o passo no portão é dele |
| `--so tokens,fontes,tema` | só essas partes da marca da casa |
| `--com-base` | o `base.css` também na trilha página |

## Manter um projeto instalado

```bash
node .claude/skills/novo-projeto/esqueleto/scripts/instalar.mjs --conferir <projeto>
node .claude/skills/novo-projeto/esqueleto/scripts/instalar.mjs --atualizar <projeto> [--forcar]
```

- `--conferir` roda o conferidor `fundacao` do projeto com a casa como fonte:
  conferido editado reprova, semente com versão nova vira nota.
- `--atualizar` traz os conferidos da versão da casa e as sementes que o
  projeto não tocou. Semente editada fica como está e ganha o `git diff` para
  ele aplicar à mão. Conferido editado recusa, e `--forcar` restaura. A marca
  do projeto nunca é tocada.
- **Nada disso é automático.** O projeto não depende da casa para rodar.

## Mudar o esqueleto

1. Mexeu em `kit/` ou `templates/`: `node .claude/skills/novo-projeto/esqueleto/scripts/gerar-manifesto.mjs`.
2. O teste rápido: `node .claude/skills/novo-projeto/esqueleto/scripts/teste-fundacao.mjs --sem-build`
   e `node .claude/skills/novo-projeto/esqueleto/testes/teste-marca.mjs`.
3. **Release** é o teste INTEIRO, com o bloco B (npm ci, build, portão e tela
   num projeto fora do workspace, ~2 a 10 minutos, com rede):
   ```bash
   node .claude/skills/novo-projeto/esqueleto/scripts/teste-fundacao.mjs
   node .claude/skills/novo-projeto/esqueleto/scripts/gerar-manifesto.mjs --versao X.Y.Z
   ```
   O `--versao` recusa sem a entrada `## vX.Y.Z` no `kit/HISTORICO.md` e sem a
   prova verde sobre o conteúdo de agora. **A tag `fundacao-vX.Y.Z` é o último
   gesto, depois do commit.**
4. **Subiu versão de dependência na semente** (`package.json`): regenere a
   fixture no mesmo gesto. Instale num projeto temporário, rode o `npm install`
   e o `shadcn add` dos dez, e copie de volta o `package-lock.json` para
   `.claude/skills/novo-projeto/esqueleto/fixtures/app-minimo/`. Os dez de
   `src/components/ui/` não moram no git: o instalador das peças de terceiro os
   baixa do registry e confere pela impressão. Regrave as impressões com
   `node scripts/terceiros/instalar.mjs --impressoes --so novo-projeto-shadcn`
   e confira que o resultado é o que o `shadcn add` gravou.
5. **Conferidor novo entra em três lugares**: `kit/conferido/portao/<nome>.mjs`,
   a prova em `kit/conferido/provas/<nome>.mjs` (um caso vermelho e um verde, e
   a mutação no cabeçalho) e o passo nos dois `templates/stack.*.mjs`.

## O que a máquina garante, e o que não

Garante: sha dos conferidos, a marca do projeto sem valor da casa, contraste de
todo par do tema em 4,5:1 (a primária como texto inclusive, e numa grade de 180
paletas), zero hex e zero classe de paleta em catraca, o tema cobrindo todo
papel do CLI, os dez do registry intocados, raio e fonte medidos no navegador,
alvo de toque de 44px, zero violação do axe, conteúdo visível sem JavaScript, e
o projeto sem caminho para a casa.

Não garante: se a página é bonita, se o texto é claro, se a copy é do dono. A
vitrine passa pelo olho e pelo `/estudio` (o `revisor-de-interface`) antes de
ir para o dono, como toda peça visual.

## Armadilhas medidas

- 🚨 **`loading.tsx` na raiz esconde a página inteira**: o HTML estático sai com
  o esqueleto e o conteúdo num `<div hidden>`. Loading mora na rota que busca
  dado. O teste de tela da vitrine reprova a volta dele.
- 🚨 **A primária é texto também**: o `link` do registry a pinta direto no
  fundo. Por isso o gerador recusa primária sem 4,5:1 contra o fundo, e no
  escuro clareia a primária até passar.
- ⚠️ **O Tailwind 4 inlina o raio no build**: o raio entra pelas sete linhas
  `--radius-*` do `globals.css` da semente, nunca pelo tema.
- ⚠️ **ESLint 10 derruba a detecção da versão do React** no plugin do Next: a
  semente declara a versão no `eslint.config.mjs`. Subiu o React, sobe lá.
- ⚠️ **Com `output: "standalone"`, `next start` não é o caminho**: o
  `tela/servir.mjs` serve como o Docker serve.
- 🚨 **O projeto instala o lock que se testou.** A trilha app leva o
  `package-lock.json` de `fixtures/app-minimo/` (lock que o projeto já tem
  fica). Sem ele, o `npm install` resolve as dependências indiretas do dia: o
  `@axe-core/playwright` pede `playwright-core >= 1.0.0`, pode puxar uma versão
  mais nova que a do `@playwright/test`, e o `tipos` e o `build` reprovam. O
  bloco B usa o lock que a instalação trouxe, não uma cópia sua.
- ⚠️ **Projeto que já tinha material antes do esqueleto** (pesquisa, estudo de
  marca, vendor) reprova no `lint` e no `formatar`: a pasta entra no
  `globalIgnores` do `eslint.config.mjs` e no `.prettierignore` do projeto.
- ⚠️ **Trecho de mutação com quebra de linha corrompe o teste** no
  `mutar --registrar` da fábrica: use trecho de uma linha.

As decisões, com o porquê e o que joga contra, estão em
`.claude/skills/novo-projeto/esqueleto/referencias/decisoes.md`.
