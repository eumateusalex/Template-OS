# Card · `Card.tsx`

> Equivalente nativo: os cartões do App Store/Fitness — conteúdo agrupado
> numa superfície própria. Não existe "UICard"; é um padrão de composição.

## Anatomia

- Superfície: `--ios-bg-grouped-secondary`, raio `--ios-radius-card`
  (**16px** — `rounded-ios-card` já resolve), padding 16px.
- **Por que o card NÃO é de vidro**: vidro é cromo
  (`materials.md` §5, regra 4) — material do que FLUTUA sobre o conteúdo.
  O card É o conteúdo, a superfície que passa por baixo do vidro; card de
  vidro não tem o que deixar atravessar e mata o contraste que sustenta a
  linguagem. Continua sólido, como no nativo.
- **Sem sombra** — a elevação é o contraste com o fundo
  `--ios-bg-grouped`/`--ios-bg-secondary` da tela. Regra 5: **sombra é
  assinatura do vidro; conteúdo eleva por cor; fora de vidro/overlay,
  sombra é proibida.**
- Aninhado é concêntrico (`foundations.md` §3): raio interno = 16 −
  distância até a borda, parando em 8. Tile a 8px da borda → raio 8,
  `calc(var(--ios-radius-card) - 8px)`.
- Slots opcionais: kicker (Footnote caixa-alta, `--ios-tracking-caps`,
  `--ios-label-secondary`), título (Headline), corpo (Subheadline), mídia
  sangrando o padding no topo (distância zero → mesmo raio do card).

## Quando usar

- Bloco editorial de destaque (artigo, promoção, resumo)
- Agrupar conteúdo relacionado fora do formato de lista
- Card inteiro clicável levando a detalhe

## Quando NÃO usar

- Coleção de itens uniformes → `List` (célula, não card)
- Formulário → `List` estilo Ajustes
- Card dentro de card → hierarquia de cor resolve, não outra caixa

## Estados

| Estado | O que muda |
|---|---|
| default | Superfície chapada |
| pressed (card clicável) | `scale(0.97)` + `opacity: 0.7` — card inteiro é botão |
| focused | Anel global de foco |

## Conteúdo e texto

Kicker curto em caixa-alta (via CSS), título Headline direto, corpo de 1
a 3 linhas. Card clicável não tem botão dentro — o card É o botão.

## Acessibilidade

- Clicável → `<button>`/`<a>` de verdade; o título é o nome acessível.
- Heading interno segue a hierarquia da página (prop `as` do título).
- Imagem informativa com `alt`; decorativa com `alt=""`.

## Erros comuns

- **`.ios-glass` em card de conteúdo** → vidro é cromo; card eleva por
  cor (`materials.md` §5, regra 4).
- `box-shadow` no card → sombra é assinatura do vidro (regra 5); se o
  card "precisa" de sombra, conserta o fundo da tela.
- Card branco sobre tela branca → a tela precisa ser `--ios-bg-secondary`
  ou `--ios-bg-grouped`; a "solução" errada é sombra.
- Borda de 1px em volta → o contraste de cor É a borda.
- Botão dentro de card clicável → interativo aninhado quebra teclado e leitor.

## Web: limites

Nenhum estrutural — é composição pura de tokens.
