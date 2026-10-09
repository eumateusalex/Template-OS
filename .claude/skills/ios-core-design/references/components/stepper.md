# Stepper · `Stepper.tsx`

> Equivalente nativo: `UIStepper` / SwiftUI `Stepper` (Liquid Glass: o
> corpo é cápsula, como todo controle do sistema).

## Anatomia

- Grupo de dois botões (− e +) lado a lado: fundo `--ios-fill-secondary`,
  corpo em **cápsula** (`--ios-radius-pill` — a forma padrão de controle
  no Liquid Glass, `foundations.md` §3), divisor vertical hairline
  `--ios-separator` entre os dois.
- Altura 32px (nativa), largura ~94px; área de toque estendida a 44px
  (regra 1). Ícones `Minus`/`Plus` do Phosphor em `--ios-label`.
- O VALOR não faz parte do controle: mora na célula ao lado (Body).
- Stepper é controle em área de conteúdo — superfície sólida, nunca
  `.ios-glass` (`materials.md` §1), sem sombra (regra 5: sombra é
  assinatura do vidro; conteúdo eleva por cor).

## Quando usar

- Ajuste fino de unidade em unidade, faixa pequena: quantidade de itens,
  número de cópias, pessoas na mesa.

## Quando NÃO usar

- Faixa grande ou salto livre → `Slider` ou `TextField` numérico
- Valor que a pessoa já sabe e quer digitar → `TextField`
- Dois estados → `Switch`

## Estados

| Estado | O que muda |
|---|---|
| default | Fundo fill, ícones label |
| pressed (cada lado) | `opacity: 0.7` no lado tocado |
| no limite (min/max) | O botão do lado saturado desabilita (`opacity: 0.4` no ícone) |
| disabled | `opacity: 0.4` no conjunto |

## Conteúdo e texto

O rótulo e o valor ficam na célula ("Cópias · 3"); o stepper é mudo.
Valor sempre visível — stepper sem número à vista é adivinhação.

## Acessibilidade

- Container `role="group"` + `aria-label` ("Cópias").
- Botões `aria-label="Diminuir"`/`"Aumentar"`.
- O valor atualizado é anunciado por `aria-live="polite"` num texto
  (visível ou `sr-only`) DENTRO do grupo — implementado no `.tsx`.
- No limite, o botão recebe `disabled` real (não só visual).

## Erros comuns

- Raio pequeno no conjunto → a anatomia do iOS clássico; regra 8 ("Liquid Glass, não
  clássico"): controle é cápsula.
- `.ios-glass` no stepper → vidro é cromo; controle de formulário em área
  de conteúdo fica sólido.
- Segurar não acelera e ninguém avisa → o nativo auto-repete; aqui não
  (limite documentado abaixo) — pra faixas grandes, trocar de componente.
- Stepper com o valor escondido → o número fica do lado, sempre.
- Botões separados um do outro → é UM controle com divisor, não dois botões.

## Web: limites

- Sem auto-repeat ao segurar (o nativo acelera) — fora de escopo v1,
  anotado; faixa grande pede outro componente de qualquer jeito.
