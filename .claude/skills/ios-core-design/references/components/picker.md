# Picker · `Picker.tsx`

> Equivalente nativo: `UIPickerView` (estilo menu do iOS 14+) /
> SwiftUI `Picker(.menu)`.

## Anatomia

- Campo de 44px, raio 12px (`--ios-radius-input`), fundo
  `--ios-fill-tertiary` — o mesmo corpo do `TextField`.
- Valor atual em Body `--ios-label`; ícone `CaretDown` (Phosphor, `1em`,
  `--ios-label-secondary`) encostado à direita.
- Por baixo é um `<select>` nativo — o navegador entrega o menu (e o iOS
  real entrega a UI de verdade).
- Campo de formulário é conteúdo, não cromo: superfície sólida, sem
  `.ios-glass` e sem sombra (regra 5: sombra é assinatura do vidro;
  conteúdo eleva por cor).

## Quando usar

- Escolher UM valor de uma lista fechada com 5+ opções, ou opções com
  rótulo longo (país, categoria, fuso).

## Quando NÃO usar

- 2 a 5 opções curtas e visíveis → `SegmentedControl`
- Valor livre → `TextField`
- Data/hora → `DatePicker`
- Seleção múltipla → lista com checkmarks (`list.md`)

## Estados

| Estado | O que muda |
|---|---|
| default | Fundo fill, valor atual visível |
| focused | Anel global de foco |
| erro | Borda 1px `--ios-red` + mensagem |
| disabled | `opacity: 0.4` |

## Conteúdo e texto

Rótulo acima (mesmo padrão do TextField). A primeira opção pode ser o
placeholder ("Selecione…") com `value=""` + `disabled` — some depois da
escolha.

## Acessibilidade

- `<select>` NATIVO com `<label htmlFor>`: teclado, leitor e UI de
  plataforma de graça. Não reinventar dropdown em divs.
- Erro via `aria-describedby` + `aria-invalid`.

## Erros comuns

- Dropdown custom em JS pra "ficar igual" → o `<select>` no iOS JÁ abre a
  UI nativa; o custom é que quebra a ilusão.
- Lista de 30 itens sem ordem → alfabética ou por frequência de uso.
- Placeholder que continua selecionável → `disabled` na opção vazia.
- `.ios-glass` no campo → regra 8 ("Liquid Glass, não clássico") é sobre o
  CROMO; controle em área de conteúdo fica sólido.

## Web: limites

- A cara do MENU aberto é do navegador/sistema — não se estiliza (e não
  se tenta: wheel picker está na lista "não replicar" de
  `web-translation.md` §9). O que a skill controla é o campo fechado.
- O `<option>` do menu aberto NÃO herda as vars com tema escuro forçado
  via `data-theme` — precisa da cor explícita no host; a correção (CSS
  global de uma linha) está em `color.md` §7.
