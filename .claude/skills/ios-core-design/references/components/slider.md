# Slider · `Slider.tsx`

> Equivalente nativo: `UISlider` / SwiftUI `Slider` — com as anatomias do
> iOS 26: tick marks e preenchimento a partir do centro.

## Anatomia

- Track: 4px de altura, raio pílula. Trecho percorrido em `--ios-blue`,
  restante em `--ios-fill`.
- **Tick marks** (prop `ticks`): pontos de 2px equidistantes, no MESMO
  token do track (`--ios-fill`) — claros sobre o azul, mais escuros no
  resto por acúmulo de alpha *(tradução web calibrada; a Apple não publica
  a cor da marca — nada de inventar cinza novo)*.
- **Preenchimento central** (prop `centered`): o azul parte do MEIO do
  track até o thumb, pra qualquer lado — a anatomia de valor bipolar.
- Thumb: círculo de 28px, `--ios-on-accent` (branco nos dois temas), borda
  hairline `--ios-separator`. Área de toque: 44px de altura total.
- Slider é conteúdo, não cromo: sólido, sem `.ios-glass` (`materials.md`
  §1) e sem sombra (regra 5: sombra é assinatura do vidro; conteúdo eleva
  por cor; sombra fora de vidro/overlay é proibida).

## Quando usar

- Valor contínuo (ou de passos finos) num intervalo visível: volume,
  brilho, preço máximo.
- `centered`: valor bipolar em torno de um neutro — balanço L/R, EQ ±dB,
  velocidade ±.
- `ticks`: pontos notáveis que ajudam a mirar (passos de zoom, paradas de
  velocidade). Poucas marcas — é mira, não régua.

## Quando NÃO usar

- Valores discretos nomeados (P/M/G) → `SegmentedControl`
- Número exato que a pessoa digita (idade, CEP) → `TextField`
- Incremento fino de unidade em unidade → `Stepper`

## Estados

| Estado | O que muda |
|---|---|
| default | Azul do início (ou do centro, com `centered`) até o valor |
| focused | Anel global de foco no thumb |
| disabled | `opacity: 0.4` |

## Conteúdo e texto

Rótulo fora do controle (célula ou label acima). Se o valor exato importa,
mostrar em texto ao lado (Callout, `--ios-label-secondary`).

## Acessibilidade

- `<input type="range">` NATIVO — teclado (setas ±passo, Home/End,
  PageUp/Down) e leitor de tela de graça; `centered` muda só o desenho.
- `aria-label` (ou `<label>`) sempre; `min`/`max`/`step` corretos; texto
  de valor, se houver, ligado com `aria-describedby`.

## Erros comuns

- `<div>` com drag em JS → é um `<input type="range">` estilizado, ponto.
- Slider pra 3 opções → segmented. Valor que importa sem texto → mostrar.
- Track grosso (8px+) → 4px é a assinatura; grosso vira Material.
- `.ios-glass` no slider → regra 8 ("Liquid Glass, não clássico") é do
  CROMO; controle de formulário fica sólido.

## Web: limites

- A estilização de range usa pseudo-elementos com prefixo
  (`::-webkit-slider-thumb`, `::-moz-range-thumb`) — o `.tsx` cobre os
  dois. Trecho e ticks: gradiente inline em runtime com as vars (exceção).
- Sombra do thumb nativo fica de fora (regra 5); a hairline separa.
