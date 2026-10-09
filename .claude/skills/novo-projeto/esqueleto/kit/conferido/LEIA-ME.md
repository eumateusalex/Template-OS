# fundacao/

A fundação do projeto: a parte que ele **não edita**. O conferidor `fundacao`
compara cada arquivo com o que foi instalado, e reprova a diferença.

## O que tem aqui

| Arquivo | O que é |
|---|---|
| `base.css` | o que a marca exige de todo componente: foco visível, alvo de toque de 44px no celular, campo com 16px, menos movimento respeitado |
| `portao/` | os conferidores: `fundacao`, `marca`, `auditar-ui`, `tela` |
| `provas/` | um caso vermelho e um verde por conferidor |
| `teste-portao.mjs` | roda as provas |
| `lib/` | o que os conferidores usam; roda sem a fábrica |
| `fundacao.json` | o manifesto. **Este é do projeto**: os pisos da catraca, a marca e o `codigo` (onde o `marca` varre, junto com o `CODIGO` do `fabrica/stack.mjs`: pasta nova entra nos dois) |

## Onde mora a marca

A marca entra por um arquivo só, `src/styles/marca.css`, que o layout importa.

- **Na marca do projeto** (o padrão), ela mora em `src/styles/` e é sua:
  `tokens.css` e `fontes.css` foram gerados das cores e da fonte da entrevista
  de criação, e `tema-shadcn.css` diz qual cor cada papel do shadcn usa.
- **Na marca da casa**, `tokens.css`, `fontes.css` e `tema-shadcn.css` moram
  aqui, conferidos, e chegam pelo `--atualizar`.

## O que é seu

Tudo fora daqui: configs, `src/`, `tela/`, o Dockerfile, o `fabrica/stack.mjs`.

## Comandos

- `npm run portao`: o portão inteiro, e é o de todo dia
- `node fundacao/portao/<nome>.mjs`: um conferidor sozinho
- `node fundacao/teste-portao.mjs`: as provas dos conferidores

O `--conferir` e o `--atualizar` rodam **da casa**
(`node .claude/skills/novo-projeto/esqueleto/scripts/instalar.mjs --atualizar <este projeto>`).
Longe dela, o projeto segue igual: o conferidor `fundacao` só anota que a
versão não é comparável.

## Quando um conferidor reprova

- **conferido editado**: o ajuste mora fora daqui, em `src/styles/` (a marca)
  ou nos pisos do `fundacao.json` (a régua).
- **hex ou classe da paleta**: peça o papel (`var(--acento)`, `bg-primary`), ou
  mova a classe de cor para `src/lib/acento.ts`.
- **papel do CLI sem cor da marca**: declare o papel no tema, ou escreva
  `cor do CLI: <razão>` na linha dele no `globals.css`.
- **contraste**: mude o canal em `src/styles/tokens.css`, ou gere a marca de
  novo com outras cores.
- **HTML cru**: use o componente, ou escreva `elemento nativo: <razão>` na linha.
