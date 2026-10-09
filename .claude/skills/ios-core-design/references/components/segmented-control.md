# Segmented Control · `SegmentedControl.tsx`

> Equivalente nativo: `UISegmentedControl` / SwiftUI `Picker(.segmented)`.

## Anatomia

- Track: **cápsula** (`rounded-ios-pill` — a forma padrão de controle no
  Liquid Glass, foundations.md §3), fundo `--ios-fill-secondary`, padding
  interno 2px, altura 32px (nativa; área de toque estendida a 44px por
  pseudo-elemento — regra 1). O track é FILL, não vidro.
- Segmentos: larguras iguais (grid), texto Subheadline 15px.
- Thumb (selecionado): **pílula de vidro** — `.ios-glass` + `rounded-ios-pill`,
  deslizando na transição padrão 0.3s. Como o track não é vidro, não há
  vidro sobre vidro (regra 8): o thumb é o único material do controle.
- ⚠️ **Quando o controle mora numa BARRA de vidro** (nav/toolbar `.ios-glass`),
  o thumb de vidro empilharia material (regra 8) — aí ele vira **sólido**:
  `--ios-segment` (o par branco/grafite existe pra isso). Mesmo racional do
  campo de busca em barra de vidro (`search-field.md`).
- Texto: selecionado em `--ios-label` semibold; demais em `--ios-label`.

## Quando usar

- 2 a 5 opções mutuamente exclusivas, todas visíveis ("Dia · Semana · Mês")
- Alternar visão do MESMO conteúdo (filtro, modo de exibição)

## Quando NÃO usar

- Mais de 5 opções (ou rótulos longos) → `Picker`
- Navegar entre seções do app → `TabBar`
- Ligar/desligar uma coisa só → `Switch`
- Ação que executa algo → `Button`

## Estados

| Estado | O que muda |
|---|---|
| selecionado | Thumb de vidro por baixo; texto semibold |
| não selecionado | Sem thumb; texto regular |
| pressed | `opacity: 0.7` no segmento tocado (sem scale — o track não encolhe) |
| disabled | `opacity: 0.4` no controle inteiro |

## Conteúdo e texto

Rótulo curto (1 palavra ideal), sem ponto, title case só se for nome
próprio. Todos os segmentos com o mesmo "peso" de texto — um rótulo
gigante quebra a grade.

## Acessibilidade

- Grupo com `role="radiogroup"` + `aria-label`; cada segmento
  `role="radio"` + `aria-checked` (semântica de escolha exclusiva).
- Grupo é 1 tabstop; setas ←/→ movem a seleção (implementado no `.tsx`).
- Seleção comunicada por `aria-checked` + peso do texto — não só pelo thumb.

## Erros comuns

- Sombra AVULSA no thumb → a sombra vem embutida no vidro do thumb, e
  é o certo: sombra é assinatura do vidro (regra 5). O que segue proibido é
  sombra fora de vidro/overlay — thumb opaco com box-shadow é o iOS clássico.
- `.ios-glass` no track → o vidro é só o thumb; track de vidro criaria
  vidro sobre vidro quando o thumb deslizasse por cima (regra 8).
- Usar como abas de navegação de página inteira → `TabBar`/rotas.
- Segmento com ícone E texto apertados → um ou outro.
- Raio retangular de 10px no track (o do iOS clássico) → track e thumb são pílula.
- Esquecer o teclado (só click) → setas são obrigatórias em radiogroup.

## Web: limites

- O thumb nativo "aperta" os vizinhos no drag; aqui o deslize é a troca de
  `left` com calc() entre posições discretas — fidelidade aceitável,
  documentada (é uma exceção registrada, não um convite a animar layout).
- Altura 32px é a nativa; a área de toque estendida cobre a regra dos 44px.
- O blur do thumb amostra o fill do track + o fundo da tela — em fundo
  muito movimentado, `data-glass="frosted"` resolve (materials.md §6).
