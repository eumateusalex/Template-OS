# Switch · `Switch.tsx`

> Equivalente nativo: `UISwitch` / SwiftUI `Toggle`.

## Anatomia

- Track: 51×31px (medida nativa, inalterada no Liquid Glass), raio pílula.
  Desligado: `--ios-fill`; ligado: `--ios-green`.
- Thumb: círculo de 27px, `--ios-on-accent` (branco nos dois temas, como o
  nativo), desliza 20px na transição padrão 0.3s.
- O switch é **controle de conteúdo**, não cromo: superfície opaca, sem
  vidro e sem sombra — sombra é assinatura do vidro (regra 5).
- Área de toque: o track tem 31px de altura — pseudo-elemento estende a
  44px (regra 1).

## Quando usar

- Ligar/desligar UMA configuração com efeito imediato ("Notificações",
  "Modo Escuro") — quase sempre à direita de uma célula de lista.

## Quando NÃO usar

- Escolha entre mais de dois valores → `SegmentedControl`/`Picker`
- Ação que precisa de confirmação pra valer → `Button` (+ alerta)
- Seleção múltipla de itens numa lista → checkmark de seleção (`list.md`)

## Estados

| Estado | O que muda |
|---|---|
| ligado | Track `--ios-green`, thumb à direita |
| desligado | Track `--ios-fill`, thumb à esquerda |
| pressed | Sem scale e sem bounce — o deslize na assinatura padrão É o feedback |
| disabled | `opacity: 0.4` |

## Conteúdo e texto

O rótulo é o substantivo do que liga: "Notificações", nunca "Ativar
notificações?" (`writing.md` §3, par 20). O switch já comunica o estado —
não escrever "ligado/desligado" ao lado.

## Acessibilidade

- `<button role="switch" aria-checked>` — Espaço/Enter alternam.
- Sempre com rótulo: `aria-label` próprio ou `aria-labelledby` apontando
  pro texto da célula.
- Estado não é só cor: `aria-checked` + posição do thumb são o sinal
  redundante; verde/cinza é reforço.

## Erros comuns

- Sombra ou vidro no thumb → switch não é cromo; sombra fora de
  vidro/overlay é proibida (regra 5). O thumb de vidro é do
  `SegmentedControl` — aqui o branco opaco É o nativo.
- Deslize com `--ios-ease-bounce` → bounce é assinatura do vidro
  interativo (motion.md §1); o switch desliza na assinatura padrão.
- Switch pra ação ("Enviar relatório") → switch é ESTADO, não comando.
- Confirmar com alerta depois de ligar → se precisa confirmar, era botão.
- Azul no track ligado → o nativo é verde; azul é interativo de toque.
- Redesenhar em outro tamanho → 51×31 é a assinatura visual; não escala.

## Web: limites

- O thumb nativo estica (~+4px) enquanto pressionado e tem uma sombra
  sutil — os dois ficam de fora: o esticão não compensa o custo, e a
  sombra pertence ao vidro (regra 5), não a um controle de conteúdo.
  O deslize + cor cobrem o feedback.
- 27px de thumb e 20px de curso derivam da medida nativa 51×31 (2px de
  folga por lado).
