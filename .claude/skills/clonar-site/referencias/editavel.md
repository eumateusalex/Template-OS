# Do clone ao molde editável

O clone do ditto é fiel, mas não se edita: JSX gerado, milhares de `data-cid`,
nenhum texto num arquivo só. Quando o pedido é **molde para reuso** ("deixa
editável", "vira molde", "em português"), ele vai para a pasta de moldes que o
usuário escolher, um repositório por site, na estrutura padrão (anexo "Estrutura,
idioma e publicação" do `revisao-de-clone.md`): pt na raiz, en em `/en`, régua
por papel e publicação com par produção + homologação. Há dois caminhos, e a
escolha é do usuário:

- **Reconstruir à mão:** o clone vira referência medida e o site se escreve de
  novo. Código limpo, mais horas.
- **Padronizar a captura:** o código capturado fica e ganha a estrutura padrão.
  Mais rápido e fiel por construção; o custo é o tamanho congelado da captura
  (abaixo).

## Padronizar a captura

- **Casca e seções:** o que se repete em toda página vira componente em
  `components/casca/` (o rodapé renumerado com prefixo próprio, `rd1…`), e cada
  `<section>` de primeiro nível, um arquivo em `components/secoes/<página>/`.
- **Uma rota por página, nunca `[pagina]` dinâmico:** o `data-cid` se repete
  entre páginas, então cada rota carrega só as folhas dela (o `mapa-css` liga e
  desliga na troca). As rotas de cada idioma se geram no build.
- **Texto:** en e pt no mesmo objeto (`const pt: typeof en`), um arquivo por
  página. Os scripts de comportamento acham os dados pela rota do original
  (`data-rota-en`) e o texto do idioma por uma variável global injetada no layout.
- **O tamanho congelado:** a captura grava em px a caixa que, no Framer, abraça o
  texto (fit content). O pt, mais longo, corta, quebra e vaza: uma captura
  traduzida chega a centenas de casos. A correção é gerada, não à mão: medir no en
  quais caixas abraçam o conteúdo (largura vira `max-content`, altura vira
  `auto`, e o tamanho não muda) e, no pt, soltar só a corrente acima de cada texto
  que corta (o `scripts/medidas-pt.mjs` do projeto clonado). Largura só solta em caixa de uma
  linha de texto visível, senão coluna e título partido em palavras alargam além
  da tela. O que não se resolve soltando: frase mais curta ou folha à mão.
- **A régua do idioma** (uma prova de idioma no `regua/provas/` do projeto)
  compara com o en e mede cinco coisas: texto cortado, transbordando (inline contra
  o bloco de cima), caixa transbordada (o vazamento que cobre o vizinho sem cortar
  texto), quebra (abraçava uma linha no en e quebra no pt) e colisão entre letras.
  Mede a página recém-aberta e depois da rolagem: o cabeçalho do Framer recolhe ao
  descer, e só aberto se vê o menu. Ignora o que está com opacidade 0, com
  reticências, fixo ou grudado e a animação de palavra que troca. O que se aprova
  olhando vai para uma lista com motivo e teto em px.

## A forma (reconstruir à mão)

- Next 16 + `motion/react` + Tailwind 4 (GSAP só onde o original usa).
- Todo texto em `lib/conteudo/<lingua>/`, os dois idiomas cumprindo o mesmo
  tipo (`lib/conteudo/tipos.ts`); `IDIOMA` escolhe no build.
- Uma seção por arquivo em `components/secoes/`, cada uma abrindo com o
  comentário do que o original faz e as medidas dele.
- Tokens e presets de texto no `@theme` (`t-display`, `t-corpo`...), lidos do
  CSS do original.
- `README.md` da peça com a tabela "onde editar" e os limites (licença, envio
  simulado, o que mudou na tradução).

## A língua de prova

O `compara-geometria.mjs` casa elementos **pelo texto**. Traduzido, ele fica
cego. Por isso o inglês do original fica no repositório como língua de prova:
`IDIOMA=en` constrói igual ao original e a régua mede com pares de rota
(`ROTAS="/about=>/sobre"`, sempre com `MSYS_NO_PATHCONV=1` no Git Bash). O
português passa pelo `scripts/video/confere-pagina.mjs`.

## Medir antes de escrever o número

Nenhum número sai de cabeça. De onde cada um sai, no Framer:

| Preciso de | Onde está |
|---|---|
| tamanhos, espaços, colunas | a árvore da página por largura (caixa + CSS que casa) |
| a regra exata (`calc`, `vh`, faixa) | o CSS do HTML, pela classe do `data-framer-name` |
| entradas e efeitos de rolagem | as props `__framer__*` do módulo JS da página |
| a âncora de um efeito | `ref:X` no módulo → o elemento com `ref:X` (`id` = nome da seção) |
| entrada ao carregar | `animate:X` + `initial:Y` no módulo (atraso, duração, curva, `y`) |
| espaço entre blocos de texto corrido | margem computada no navegador (o preset não mostra) |

## Armadilhas da edição

- **Respiro no item flexível muda a divisão das colunas.** Com `flex 3/6/3`, o
  `padding` vai no filho da coluna, nunca na coluna (deriva de 2 a 10 px).
- **Altura fixa do designer.** Quando uma linha mede mais que o conteúdo só
  numa faixa (388 px no tablet, 377 em outra página), procure `height:NNNpx` no
  CSS: é fixo, não se explica pela estrutura. Vira `min-h` naquela faixa.
- **"Placeholder" invisível.** Um espaço que não fecha pode ser um elemento
  vazio de altura fixa entre dois blocos; a árvore com as caixas dos filhos
  mostra.
- **A régua mede o elemento do texto.** Texto em `<strong>` dentro de `<p>`,
  link em linha ou `<p>` dentro de `<li>`/`<blockquote>` mede outra caixa.
  Reproduza a estrutura (é o mesmo desenho) em vez de compensar com margem.
- **A mesma peça muda por página.** Onda do topo, forma da foto, título com ou
  sem quebra: compare a regra de cada página antes de generalizar.
- **Entrada que repete.** Foto de página inteira sai vazia; tire quadros de tela
  rolando (`quadros.mjs` do projeto).
- **Build no meio da medição.** Editar fonte enquanto a régua mede é seguro (o
  servidor já subiu); a régua mede o build antigo. Meça de novo depois.
