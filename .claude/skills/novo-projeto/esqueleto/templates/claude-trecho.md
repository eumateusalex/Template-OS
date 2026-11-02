<!-- O trecho que o instalar.mjs acrescenta ao CLAUDE.md do projeto. Cada bloco
     entre "se: <condições>" e "fim" só entra quando todas as condições valem
     (app, pagina, projeto, casa, tema, sem-tema, base, banco, sem-banco); este
     comentário não entra. Todo caminho e toda variável citados existem no
     projeto daquela trilha (teste-fundacao.mjs, A20). -->
## Fundação

Este projeto foi criado pelo `/novo-projeto`, e roda sem o workspace: tudo que
ele precisa para instalar, buildar, testar e publicar mora aqui dentro.

<!-- se: base -->
- **`fundacao/` é conferido**: o `fundacao/base.css` (foco, toque, campo,
  movimento) e os conferidores. Não se edita; o conferidor `fundacao` reprova
  quem editar.
<!-- fim -->
<!-- se: pagina sem-base -->
- **`fundacao/` é conferido**: os conferidores. Não se edita; o conferidor
  `fundacao` reprova quem editar.
<!-- fim -->
<!-- se: app projeto -->
- **A marca é deste projeto**, e mora em `src/styles/` (`src/styles/tokens.css`,
  `src/styles/fontes.css`, `src/styles/tema-shadcn.css`), com
  `src/styles/marca.css` como a única entrada. Foi gerada da entrevista de
  criação; para trocar, edite ou gere de novo.
<!-- fim -->
<!-- se: pagina projeto -->
- **A marca é deste projeto**, e mora em `src/styles/tokens.css` (as cores em
  canais, a fonte, o raio e o movimento) e `src/styles/fontes.css` (o
  `@font-face`). A página importa os dois no CSS dela. Foi gerada da entrevista
  de criação; para trocar, edite ou gere de novo.
<!-- fim -->
<!-- se: casa -->
- **A marca é a do workspace**, conferida em `fundacao/` (`fundacao/tokens.css`
  e `fundacao/fontes.css`): não se edita aqui, e chega pelo `--atualizar` do
  instalador.
<!-- fim -->
<!-- se: casa tema -->
- O tema do shadcn na marca é o `fundacao/tema-shadcn.css`, conferido também.
<!-- fim -->
<!-- se: pagina projeto tema -->
- O tema do shadcn na marca é o `src/styles/tema-shadcn.css`, que é seu.
<!-- fim -->
<!-- se: app casa -->
- A entrada da marca no layout é o `src/styles/marca.css`.
<!-- fim -->
<!-- se: app banco -->
- **O resto é seu**: configs, layout, estados, a `Secao`, o FAQ, a
  `src/app/vitrine/`, o banco (`src/lib/banco/`) e o proxy, o `Dockerfile`.
  Mude à vontade.
<!-- fim -->
<!-- se: app sem-banco -->
- **O resto é seu**: configs, layout, estados, a `Secao`, o FAQ, a
  `src/app/vitrine/`, o `Dockerfile`. Mude à vontade.
<!-- fim -->
- **No dia a dia**, o comando é `npm run portao`.
<!-- se: pagina -->
- **A página ainda não existe**: ela nasce depois (Astro), pela `/fabrica` ou
  à mão. Até lá o portão pula os passos de código, cada um com a razão; com a
  página, cada passo liga apagando a linha `precisa` dele no `fabrica/stack.mjs`
  (o CI acompanha, porque o workflow só chama o portão).
<!-- fim -->
<!-- se: app -->
- **O texto que o público lê é dado**, em `src/app/(site)/conteudo/`: é lá que
  o conferidor de travessão cobra.
<!-- fim -->
<!-- se: tema -->
- **A cor se pede pelo papel**: `var(--acento)`, `bg-primary`. Nunca hex, nunca
  classe da paleta do Tailwind (o conferidor `marca` cobra, em catraca).
<!-- fim -->
<!-- se: pagina projeto sem-tema -->
- **A cor se pede pelo canal**: `rgb(var(--c-primaria))`, `rgb(var(--c-acento))`.
  Nunca hex (o conferidor `marca` cobra, em catraca).
<!-- fim -->
<!-- se: pagina casa sem-tema -->
- **A cor se pede pelo canal** de `fundacao/tokens.css`. Nunca hex (o
  conferidor `marca` cobra, em catraca).
<!-- fim -->
