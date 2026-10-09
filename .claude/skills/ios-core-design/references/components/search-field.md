# Search Field · `SearchField.tsx`

> Equivalente nativo: `UISearchBar` / SwiftUI `.searchable`.

## Anatomia

- Campo de **36px** (medida nativa) em **cápsula** (`rounded-ios-pill`) — a
  busca em cápsula é assinatura do iOS 26; raio retangular de input é o iOS clássico.
  Fica dentro de uma faixa de 44px+ (o alvo da regra 1 é a faixa).
- Fundo `--ios-fill-tertiary`: campo em área de conteúdo NÃO é vidro —
  vidro é cromo (regra 8), e o campo é superfície de entrada.
- Quando a busca mora numa BARRA de vidro (nav/toolbar `.ios-glass`), o
  campo continua fill sobre o vidro — nunca empilhar vidro (regra 8).
- Dentro do campo: `MagnifyingGlass` à esquerda (`--ios-label-secondary`,
  `1em`), placeholder "Buscar" em `--ios-label-tertiary`, e o botão de
  limpar (`XCircle weight="fill"`) que aparece quando há texto.
- Botão **Cancelar** (plain, azul) desliza pra dentro no foco e some no
  cancelamento — opcional (`cancelable`).

## Quando usar

- Filtrar/buscar numa coleção grande: sob a nav bar, no topo de lista.

## Quando NÃO usar

- Campo de formulário comum → `TextField` (esse segue `rounded-ios-input`)
- Meia dúzia de itens visíveis → não precisa de busca
- Busca global do produto inteiro → é uma TELA de busca (com este campo
  no topo)

## Estados

| Estado | O que muda |
|---|---|
| vazio | Lupa + placeholder |
| focado | Anel global; "Cancelar" aparece (se `cancelable`) |
| com texto | Botão de limpar aparece |
| disabled | `opacity: 0.4` |

## Conteúdo e texto

Placeholder: "Buscar" ou "Buscar em [coleção]" — nunca instrução longa.
Cancelar é sempre "Cancelar".

## Acessibilidade

- `<input type="search">` dentro de `<form role="search">`;
  `aria-label="Buscar"` (ou o rótulo do domínio).
- Limpar: `<button aria-label="Limpar busca">`; Esc também limpa (o
  `type="search"` dá isso de graça em vários navegadores, o `.tsx`
  garante).
- O resultado filtrado é anunciado pela região de resultados (fora deste
  componente).

## Erros comuns

- `.ios-glass` no campo → o campo não flutua sobre nada; é fill. Sombra no
  campo idem — sombra é assinatura do vidro (regra 5).
- Lupa como `<img>` decorativa clicável → a lupa é decoração
  (`aria-hidden`); quem foca é o input.
- Botão de limpar só no hover → aparece sempre que há texto (touch não
  tem hover).
- Buscar só no submit quando a coleção é local → filtrar enquanto digita.
- Campo de 44px de altura → o campo nativo é 36 DENTRO de faixa de 44;
  o campo gordo é web.

## Web: limites

- O `type="search"` traz um X nativo em alguns navegadores — o `.tsx`
  o remove via `[&::-webkit-search-cancel-button]:appearance-none` pra
  não duplicar com o botão próprio (que é acessível e consistente).
- O morphing nativo (campo que vira botão de lupa na barra e se expande ao
  toque) não se replica — o campo aqui já nasce expandido, e é o honesto.
