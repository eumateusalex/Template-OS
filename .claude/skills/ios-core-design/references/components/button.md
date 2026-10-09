# Button · `Button.tsx`

> Equivalente nativo: `UIButton` / SwiftUI `Button` + o botão de vidro do Liquid Glass.

## Anatomia

- Container: **cápsula, sempre** (`--ios-radius-button` → pill): forma única,
  sem prop de escape (foundations.md §3).
- Conteúdo: texto, opcional ícone Phosphor à esquerda (gap 4px, `1em`).
- Tamanhos: **small** 32px (toque estendido a 44px por pseudo-elemento) ·
  **medium** 44px (`--ios-touch-min`) · **large** 50px (`--ios-h-button`).
- Fonte: Body 17 (medium/large), Subheadline 15 (small); peso 600, plain regular.

## Quando usar

- Ação explícita com verbo ("Salvar", "Continuar", "Adicionar Cartão")
- `filled` large pra ação primária; `plain` pra ação em barra ou célula
- `glass` pra botão que flutua SOBRE o conteúdo (compor, controle de mapa)

## Quando NÃO usar

- Navegação entre telas dentro de lista → célula com chevron (`list.md`)
- Alternar estado → `Switch` · escolher entre opções → `SegmentedControl`
- Mais de UM `filled` por tela: o segundo vira `tinted`/`gray`
- Precisa de canto reto/denso → não existe nesta linguagem; repense

## Variantes

| Variante | Fundo | Texto | Papel |
|---|---|---|---|
| `filled` | `--ios-blue` | `--ios-on-accent` | A ação principal da tela (uma só) |
| `tinted` | `--ios-blue-tint` | `--ios-blue` | Ação secundária com destaque |
| `gray` | `--ios-fill-secondary` | `--ios-blue` | Ação secundária neutra |
| `plain` | transparente | `--ios-blue` | Ação inline, botão de barra |
| `glass` | `.ios-glass` | `--ios-label` | Cromo flutuante; nunca dentro de outro vidro |

filled/tinted/gray/plain servem ÁREA DE CONTEÚDO; `glass` é cromo (regra 8).
Destrutivo: azul vira `--ios-red` (filled: fundo; demais: texto).

## Estados

| Estado | O que muda |
|---|---|
| pressed (conteúdo) | `scale(0.97)` + `opacity: 0.7` em 0.1s (motion.md §2) |
| pressed (`glass`) | O vidro ILUMINA — corpo em `--ios-glass-bg-frosted` + scale, volta em `--ios-ease-bounce`. Tudo na classe `.ios-glass--interactive` (tokens.css §5b), que o `.tsx` já aplica |
| focused | Anel de 2px `--ios-blue` com offset 2 (global do tokens.css) |
| disabled | `opacity: 0.4` (aproximação — valor nativo não documentado) |

## Conteúdo e texto

Verbo de ação em title case, sem ponto final ("Salvar Alterações") —
regras completas em `writing.md` §2.

## Acessibilidade

- `<button>` nativo sempre (nunca `<div onClick>`); `type="button"` padrão.
- Botão só de ícone → `aria-label` com o verbo ("Fechar", "Compartilhar").
- Contraste branco/azul ≈4.0:1, padrão de plataforma (`accessibility.md` §2);
  no `glass`, `--ios-label` sobre Regular segura sozinho (materials.md §2).

## Erros comuns

- Sombra fora do `glass` → regra 5: sombra é assinatura do vidro; conteúdo
  eleva por cor. A única sombra do botão é a que vem embutida no `glass`.
- `glass` dentro de barra/sheet de vidro → vidro nunca sobre vidro (regra 8);
  dentro de cromo, o botão é plain/tinted.
- Raio retangular de 10px (o do iOS clássico) → botão é cápsula, sem escape.
- `hover:` como estado principal → touch-first; hover é realce sutil (`duration-150`).

## Web: limites

- O `.tinted` nativo é calculado da tint; aqui é `--ios-blue-tint` (~15%) —
  aproximação documentada, validar no PREVIEW.
- A iluminação do `glass` depende do tokens.css importado (classe
  `.ios-glass--interactive`) — sem ele, nem o vidro existe.
