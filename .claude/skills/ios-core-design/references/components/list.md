# List / Table View · `List.tsx`

> Equivalente nativo: `UITableView` / SwiftUI `List`. Exporta três peças:
> `List` (container), `ListSection` (grupo com cabeçalho/rodapé) e
> `ListRow` (a célula). É o componente mais usado do sistema — telas de
> Ajustes, listas de conteúdo, formulários.

## Anatomia

**List (container)** — lista é CONTEÚDO, não cromo: superfície sólida que
eleva por cor, nunca `.ios-glass` (materials.md §1). Duas variantes:
- `inset` (padrão): margem lateral 16px, raio `--ios-radius-card` (16px;
  o token resolve), células `--ios-bg-grouped-secondary`
  sobre tela `--ios-bg-grouped`. É o inset grouped de sempre — o Liquid
  Glass manteve a lista sólida de propósito: é ela que passa firme por
  baixo das barras de vidro.
- `plain`: borda a borda, sem raio; pra listas longas de conteúdo
  (contatos, resultados).
- **Concentricidade** (foundations.md §3): a célula NÃO tem raio próprio —
  quem arredonda é o grupo de 16, cortando a primeira e a última célula
  com `overflow:hidden`. Elemento aninhado DENTRO da célula (thumbnail,
  tile) segue a régua raio interno = raio externo − padding, sem descer
  de 8px em superfície tocável.

**ListRow (célula)** — slots, todos opcionais menos o título:
- Ícone à esquerda: quadrado de 28px, raio 6px, fundo de acento
  (`iconBg`), glifo Phosphor branco dentro (o padrão dos Ajustes).
- Título (Body) + subtítulo (Footnote `--ios-label-secondary`).
- À direita: valor em Body `--ios-label-secondary`, e/ou `trailing`
  (Switch, Badge…), e/ou chevron `CaretRight` em `--ios-gray2`.
- Altura: 44px (`--ios-h-row`); com subtítulo 60px (`--ios-h-row-large`).
- Separador: hairline `--ios-separator` alinhado com o TEXTO (indentado
  além do ícone), nunca sob a primeira linha.
- Cabeçalho de seção: Footnote caixa-alta com `--ios-tracking-caps`.

**Swipe actions** — até 2 ações de 76px reveladas pelo arrasto pra
esquerda (Pointer Events); a última pode ser destrutiva (`--ios-red`).
Alternativa acessível: as mesmas ações aparecem quando a linha recebe
foco de teclado (gesto nunca é o único caminho).

## Quando usar

- Qualquer coleção vertical de itens navegáveis ou configuráveis
- Formulário estilo Ajustes (células com controles à direita)
- `inset` pra telas agrupadas; `plain` pra coleções longas

## Quando NÃO usar

- Grade de mídia (fotos, capas) → grid próprio, não é lista
- Conteúdo editorial solto → `Card`
- 2 a 5 opções exclusivas → `SegmentedControl`

## Estados (da célula)

| Estado | O que muda |
|---|---|
| default | Fundo da variante |
| pressed (célula clicável) | Fundo `--ios-gray5` — célula NÃO usa scale (célula que encolhe parece cartão) |
| selecionada (lista de seleção) | `Check` em `--ios-blue` no lugar do chevron |
| swipe aberto | Conteúdo deslocado, ações visíveis |
| disabled | `opacity: 0.4` |

## Conteúdo e texto

Título curto sem ponto; valor à direita é resposta, não frase ("Wi-Fi ·
Casa"). Ação destrutiva de swipe usa o verbo ("Apagar").

## Acessibilidade

- `<ul>/<li>` semânticos; célula clicável envolve o conteúdo num
  `<button>`/`<a>` de largura total (o li nunca é o clicável).
- Célula com Switch: o texto rotula o controle via `aria-labelledby`.
- Swipe: ações são `<button>` reais, focáveis por Tab (revelados em
  `:focus-within`), com `aria-label` quando só ícone.
- Chevron é decorativo (`aria-hidden`) — a semântica é do link/botão.

## Erros comuns

- Card dentro de célula dentro de card → a célula JÁ é a superfície.
- `.ios-glass` na lista ou na célula → vidro é cromo, lista é conteúdo
  (regra 8).
- Sombra na lista → sombra é assinatura do vidro; conteúdo eleva por
  cor, e sombra fora de vidro/overlay é proibida (regra 5).
- Separador de borda a borda → indenta com o texto (56px com ícone, 16px sem).
- Chevron em célula que não navega → chevron promete tela nova.
- Acessório de abertura com largura variável (chip "4d" vs "14d") →
  cada linha começa num x diferente; `min-width` fixo no acessório
  (44px serve) devolve a coluna única que faz lista parecer lista.
- Swipe destrutivo sem alternativa visível → foco de teclado revela.

## Web: limites

- Swipe é a versão simplificada: revela/esconde com snap, sem
  full-swipe-to-delete nem física 1:1 (`web-translation.md` §9).
- Reordenar por arrasto (drag handle) está fora da v1 — anotado.
