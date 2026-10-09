# Layout e Grid

O layout intrínseco resolve a maior parte do responsivo sem nenhuma consulta: a
grade decide quantas colunas cabem, o flex decide quando quebrar a linha, e as
funções de tamanho seguram os limites.

## Largura de página

Um invólucro que centraliza, respira nas bordas e nunca passa do limite de
leitura:

```css
.pagina {
  width: min(100% - 2 * var(--respiro, 1rem), 72rem);
  margin-inline: auto;
}
```

`min()` escolhe o menor dos dois: no celular, a tela menos o respiro; no
monitor, 72rem. Sem media query.

Para uma página com seções que às vezes vão de ponta a ponta, a grade de três
trilhos resolve com uma regra só:

```css
.trilho {
  --borda: minmax(var(--respiro, 1rem), 1fr);
  display: grid;
  grid-template-columns: var(--borda) min(100% - 2 * var(--respiro, 1rem), 72rem) var(--borda);
}
.trilho > * { grid-column: 2; }
.trilho > .sangra { grid-column: 1 / -1; }
```

Todo filho fica na coluna do meio; o que leva `.sangra` ocupa a largura inteira
(foto, faixa colorida) sem sair do fluxo.

## Grade que decide as colunas

```css
.grade {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
  gap: var(--espaco-m);
}
```

- `minmax(16rem, 1fr)`: cada coluna tem pelo menos 16rem e divide a sobra.
- `min(100%, 16rem)` dentro do `minmax`: num contêiner menor que 16rem a coluna
  encolhe em vez de vazar (sem isso, 320px de tela menos o respiro já transborda).
- `auto-fit` colapsa as colunas vazias e estica os itens; `auto-fill` mantém as
  colunas vazias e os itens com a largura mínima. Grade de cards quase sempre é
  `auto-fit`; galeria que não pode esticar um item sozinho é `auto-fill`.

Para limitar o número máximo de colunas (nunca mais que 4, por exemplo), o
mínimo vira a conta da largura de uma coluna nesse máximo:

```css
.grade-ate-4 {
  --max: 4;
  --gap: 1.5rem;
  --minimo: 14rem;
  display: grid;
  gap: var(--gap);
  grid-template-columns: repeat(auto-fit,
    minmax(max(var(--minimo), (100% - (var(--max) - 1) * var(--gap)) / var(--max)), 1fr));
}
```

## Áreas nomeadas

Quando o desenho muda de forma (não só de número de colunas), as áreas nomeadas
deixam a mudança legível:

```css
.painel {
  display: grid;
  gap: 1rem;
  grid-template-areas:
    "topo"
    "principal"
    "lado"
    "rodape";
}
@media (width >= 64rem) {
  .painel {
    grid-template-columns: 1fr 20rem;
    grid-template-areas:
      "topo      topo"
      "principal lado"
      "rodape    rodape";
  }
}
.painel > header { grid-area: topo; }
.painel > main   { grid-area: principal; }
.painel > aside  { grid-area: lado; }
.painel > footer { grid-area: rodape; }
```

A ordem do HTML continua sendo a de leitura e a do teclado. Reordenar com
`order` ou com área só o que é visual; se a ordem lógica muda, mudar o HTML.

## Subgrid

Cards lado a lado com título, texto e botão alinhados entre si, por mais que o
texto varie. O card ocupa as linhas da grade de fora e herda os trilhos:

```css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: 1.5rem;
}
.card {
  display: grid;
  grid-row: span 3;
  grid-template-rows: subgrid;
  gap: 0.75rem;
}
```

Cada card tem três filhos (título, texto, ação), e a altura de cada um é a do
maior da mesma linha. Subgrid funciona em todos os navegadores atuais; também
vale em colunas (`grid-template-columns: subgrid`) para formulário com rótulos
alinhados.

## Flex que quebra a linha

Grid decide em duas dimensões; flex é melhor quando os itens têm tamanhos
diferentes e o importante é o fluxo.

**Grupo de itens** (etiquetas, botões, links do rodapé):

```css
.grupo { display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; align-items: center; }
```

**Barra lateral que desce quando falta espaço**, sem media query:

```css
.com-lateral { display: flex; flex-wrap: wrap; gap: 2rem; }
.com-lateral > .lateral  { flex-basis: 18rem; flex-grow: 1; }
.com-lateral > .conteudo { flex-basis: 0; flex-grow: 999; min-inline-size: 60%; }
```

O conteúdo come quase toda a sobra; quando ele cairia abaixo de 60% da linha, a
lateral desce para baixo.

**Lado a lado ou empilhado de uma vez** (todos os itens trocam juntos num limite):

```css
.alterna { display: flex; flex-wrap: wrap; gap: 1rem; }
.alterna > * { flex-grow: 1; flex-basis: calc((40rem - 100%) * 999); }
```

Acima de 40rem de contêiner a base fica negativa (vira zero) e os itens dividem a
linha; abaixo, a base fica enorme e cada um ocupa uma linha.

**A armadilha do flex:** item de flex não encolhe abaixo do próprio conteúdo
mínimo. Texto longo, `pre` ou tabela dentro dele empurram a página para o lado.
`min-width: 0` (ou `overflow: hidden` quando cabe) no item resolve.

## Largura intrínseca

- `width: fit-content` encolhe o elemento ao conteúdo, com teto na largura
  disponível.
- `max-inline-size: 65ch` limita a linha de texto corrido a uma leitura
  confortável (entre 45 e 75 caracteres).
- `grid-template-columns: auto 1fr` deixa o rótulo do tamanho dele e o campo com
  o resto.
- `aspect-ratio: 16 / 9` reserva a altura de mídia e de cartão antes do conteúdo
  carregar.

## Padrões de página

### Hero

```css
.hero {
  min-block-size: min(100svh, 48rem);
  display: grid;
  align-content: center;
  padding-block: var(--espaco-xl);
}
```

`svh` não pula quando a barra do navegador some, e o teto de 48rem evita o hero
gigante no monitor alto. Imagem de fundo com `object-fit: cover` e
`object-position` escolhido para o assunto não sair do quadro no celular.

### Tabela

Três saídas, nesta ordem de preferência:

1. **Menos colunas no celular:** esconder as colunas secundárias com container
   query e deixar o detalhe a um toque.
2. **Rolagem dentro do contêiner:**

   ```css
   .tabela-rola { overflow-x: auto; overscroll-behavior-inline: contain; }
   .tabela-rola table { min-inline-size: 40rem; }
   ```

   Com `tabindex="0"` e um rótulo (`role="region"` e `aria-label`) no contêiner,
   para o teclado também rolar.
3. **Linha vira cartão:** cada `td` em bloco, com o rótulo lido de um
   `data-rotulo` e `content: attr(data-rotulo)`. Bom para lista de poucos campos;
   ruim para comparar valores entre linhas.

### Navegação

- Poucos links: o grupo que quebra linha resolve, sem menu escondido.
- Muitos links: botão que abre o menu no celular. Com a lista em `popover` e o
  botão com `popovertarget`, o navegador cuida de abrir, fechar com Esc ou com
  clique fora e de anunciar o estado; com script próprio, o botão leva
  `aria-expanded` e `aria-controls`.
- Ao fechar o menu, o foco volta ao botão que o abriu.
- A navegação do desktop aparece por media query (é da página inteira), não por
  container query.

## Empilhamento

Componente com camadas (selo sobre a foto, menu sobre o conteúdo) cria o próprio
contexto com `isolation: isolate`, e os `z-index` de dentro ficam pequenos (1, 2,
3). `z-index: 9999` é sinal de dois componentes brigando no mesmo contexto.
