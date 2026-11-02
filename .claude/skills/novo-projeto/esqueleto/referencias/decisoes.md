# As decisões da fundação

O porquê de cada escolha, e o que joga contra. As catorze primeiras são de
produto (o que o esqueleto é e o que ele promete ao dono do workspace); as
outras são de desenho, tomadas na construção e medidas.

⚠️ As decisões 3, 6, 10 e 11, e as de desenho sobre a primária no escuro e os
raios 8/14/20, valem para a **marca do workspace** (`--marca casa`). A marca do
projeto, que é o padrão (decisão 13), sai do `gerar-marca.mjs`.

## As decisões de produto

| # | Decisão | Escolha |
|---|---|---|
| 1 | Trilha de página (Astro) | só tokens, fontes e portão; a semente Astro nasce com o primeiro site que pedir |
| 2 | Onde se prova num projeto real | num projeto de prova, com fotos antes e depois; projeto que já existe recebe o plano sem ser tocado |
| 3 | Onde moram os valores web da marca do workspace | na pasta web da identidade do workspace, lida pelo `webDaCasa()` do instalador |
| 4 | Sementes além do núcleo | Dockerfile do Next, Prettier com ESLint 10, Playwright com axe, Supabase como arquivo |
| 5 | Projeto de calibração no GitHub | sim, privado, com o custo do CI medido |
| 6 | Papéis do shadcn sem par na marca | gráfico com cinco tons da paleta; superfície no escuro com branco a 6% |
| 7 | Escala de texto e layout | semente do projeto (`src/styles/escala.css`), que o projeto ajusta |
| 8 | Independência | cada projeto tem a própria estrutura e roda sem a casa |
| 9 | "Aparecer ao rolar" | IntersectionObserver e CSS, lendo os tempos da marca; Motion e GSAP ficam para as cenas de landing |
| 10 | Raio do cartão | 14px (`--r-md`) |
| 11 | Vermelho de erro no claro | `#d70015` (`--c-erro`); no escuro, um vermelho mais claro que passa em 4,5:1 |
| 12 | Uma porta só | não existe skill de fundação: a máquina é o esqueleto do `/novo-projeto`, e a criação é uma entrevista completa (com o `/grill` quando a ideia está crua) |
| 13 | A marca de projeto novo | sai da entrevista (*"qual estrutura de design o projeto vai usar?"*); a do workspace só entra com `--marca casa`, quando o dono pede |
| 14 | A fábrica | o kit e o portão dela entram na criação; a esteira (spec, plano, tarefas) vem depois, com o projeto criado, pela `/fabrica` |

## As de desenho

| Decisão | Escolha | Por quê | O que joga contra |
|---|---|---|---|
| A marca do projeto é gerada | três cores e uma fonte viram `src/styles/tokens.css`, `fontes.css` e o ícone; o resto se deriva | o projeto nasce com a identidade dele, e a conta de contraste é a mesma do conferidor | derivar é escolher pelo dono o tom da superfície e da borda; ele troca editando o arquivo |
| A cor do dono nunca se ajusta calada | primária ou texto sem 4,5:1 são recusados, com a cor mais perto que passa | a cor é dele; ajuste silencioso é decidir por ele | a entrevista pode ter uma volta a mais |
| Canais com nome de papel | `--c-primaria`, `--c-fundo`, `--c-texto` | um canal com nome de cor ("azul") numa primária vermelha mentiria no nome | a marca do workspace e a do projeto têm nomes diferentes |
| Padrões neutros | cinzas, fonte do sistema, raios 6/10/16, a curva padrão do CSS | projeto sem identidade ainda não pode nascer com a do workspace | a marca neutra é sóbria de propósito |
| Distribuição | cópia com manifesto de sha, com dois tipos de arquivo (conferido e semente) | é o molde que a `/fabrica` já provou; monorepo e pacote npm ferem a regra de independência | o sinal "projeto atrás" só nasce de dentro da casa |
| Tokens web | lidos da pasta web da identidade, com lista branca de nomes | cópia espelhada seria dois lugares para a mesma regra | quem mexe na identidade roda o gerador dela |
| Nomes | só nomes que nem o shadcn nem o Tailwind declaram | `--accent` do shadcn é hover; numa marca, "acento" é a cor de destaque | quem quer o destaque da marca pede `--acento` |
| Tema do shadcn | todo papel do CLI redefinido, no claro e no escuro | o oklch do CLI nunca chega à tela | papel novo de uma versão futura do CLI fica na cor do CLI até a minor seguinte |
| Primária no escuro | uma cor clara da paleta com texto preto | o `link` do registry pinta a primária como texto; uma primária escura dá menos de 4,5:1 sobre o preto (o axe da vitrine reprova) | o botão principal muda de cara entre claro e escuro |
| Raio | as sete linhas `--radius-*` do `globals.css` apontando para 8, 14 e 20 | o Tailwind 4 inlina o raio no build | o `auditar-ui` confere o mapa contra as classes dos dez |
| Fonte | `@font-face` servida pelo projeto, com uma substituta casada na métrica logo depois na pilha | fonte com arquivo próprio não vem do Google; a substituta evita a linha pular quando a fonte chega | sem `next/font` e sem pré-carregamento na v1 |
| Sem `loading.tsx` na raiz | o esqueleto mora na rota que busca dado | na raiz ele manda o conteúdo estático num `<div hidden>` revelado por script (medido) | rota lenta sem loading próprio não mostra esqueleto |
| Matriz de provas fora do portão do projeto | as provas da fundação rodam no workspace, como as da fábrica | elas testam o kit, não o projeto | o projeto longe da casa não re-prova o kit |
| Navegador | a instalação roda com `PLAYWRIGHT_SKIP_BROWSER_GC=1` | o GC do Playwright apaga do cache da máquina o Chromium de outra versão, e o que dependia dele para | o cache da máquina cresce uma versão por projeto |
| LF no projeto inteiro | `* text=auto eol=lf` no `.gitattributes` | o Prettier da semente exige LF e o Windows com autocrlf clona em CRLF | nenhum |
| O CLI do shadcn | em `devDependencies` da semente, versão fixa | o CLI só roda na mão e o `shadcn/tailwind.css` só o build lê; em `dependencies`, o `npm audit --omit=dev` do portão contaria o fecho dele (o `braces` sem conserto). O `npx` na hora não serve: o `globals.css` importa o CSS do pacote | as altas do CLI continuam no `npm audit` completo até sair o `braces` consertado |
| Indentação | as sementes respeitam o teto de 5 níveis, com componentes pequenos | o piso de tamanho de um projeto novo nasce 1, só o `field.tsx` do registry | mais funções pequenas por arquivo |

## Fora da v1, e o gatilho de cada um

| Tentação | Gatilho |
|---|---|
| Monorepo ou pacote npm | segunda máquina ou segunda pessoa buildando sem a casa |
| Registry shadcn do workspace | terceiro projeto React na marca do workspace |
| Design system de landing (hero, prova, preço, rodapé) | o primeiro site que pedir as seções |
| App shell, tabela, formulário com zod, toast, CSP com nonce | a primeira tela que pedir (ver as receitas) |
| Semente Astro; uma linguagem de app para iPhone | o primeiro site em Astro; a primeira tela de iPhone |
| JSON de tokens no padrão DTCG | terceiro consumidor que não lê CSS |
