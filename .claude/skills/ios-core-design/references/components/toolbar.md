# Toolbar · `Toolbar.tsx`

> Equivalente nativo: `UIToolbar` — a barra de AÇÕES da tela atual
> (Safari, Mail: responder, arquivar, compor).

## Anatomia

Duas anatomias, escolhidas pela prop `placement` (default `"top"`):

- **Topo** (caso app-shell): vidro Regular (`.ios-glass`) de **largura
  total**, 44px de conteúdo (`--ios-h-navbar`), sticky logo sob a nav
  bar, com o conteúdo rolando por baixo. **Com hairline de scroll-edge**
  (`border-bottom: 1px solid var(--ios-separator)`): a borda de luz do vidro é branca e some sobre fundo
  claro; a linha que separa a barra do conteúdo que a cruza é o separator,
  como o iOS mostra quando algo rola sob a barra (`app-shell.md` §3).
- **Rodapé** (ações da tela): **ilha flutuante** — cápsula `.ios-glass` +
  `rounded-ios-pill` que NÃO encosta nas bordas: `--ios-bar-inset` (12px)
  nas laterais e embaixo, somado à safe area (`--ios-safe-bottom`, exige
  `viewport-fit=cover`). Os botões ficam agrupados DENTRO da cápsula: ela
  é **UM vidro só**; os itens são conteúdo dela, nunca vidro próprio.
- Itens: botões `plain` (ícone Phosphor `1em`+ ou texto azul), 44×44 de
  alvo. A ação primária pode ser texto semibold ("Concluir").

## Quando usar

- Ações que operam NA TELA atual: responder, compartilhar, apagar,
  compor — em especial quando a nav bar já está cheia.
- Topo pra ferramenta persistente do shell; rodapé pra ação no alcance
  do polegar.

## Quando NÃO usar

- Navegar entre seções do app → `TabBar` (a confusão clássica)
- Uma ação primária só, no meio do fluxo → `Button` filled na página
- Ações de um item específico da lista → swipe actions ou `ContextMenu`

## Estados

| Estado | O que muda |
|---|---|
| default | Ícones/texto em `--ios-blue` |
| pressed | `opacity: 0.7` |
| desabilitado (item) | `opacity: 0.4` no item |

## Conteúdo e texto

Ícone com `aria-label` do verbo; texto quando o verbo importa mais que o
símbolo ("Concluir"). Máximo ~4 itens — mais que isso vira menu
(`ellipsis` → `ContextMenu`).

## Acessibilidade

- `role="toolbar"` + `aria-label` ("Ações da mensagem").
- Itens são `<button>`; só ícone → `aria-label` com o verbo.
- Tab entra na barra; ←/→ entre os itens é enhancement bem-vindo.

## Erros comuns

- `.ios-glass` na cápsula E nos botões → vidro dentro de vidro
  (`materials.md` §5); a ilha é um vidro, os botões são conteúdo.
- Toolbar e tab bar juntas no rodapé → escolher uma; duas ilhas de vidro
  disputando a mesma borda não existem no sistema.
- Cápsula colada na borda, sem `--ios-bar-inset` + safe area → é barra
  do iOS clássico; a ilha flutua (e sem a safe area o toque falha no iPhone).
- Hairline ou sombra avulsa na toolbar de topo → a sombra vem COM o
  vidro; fora dele é proibida (regra 5).
- Ação destrutiva no meio das comuns → `Trash` na ponta, em `--ios-red`.

## Web: limites

- Nenhum estrutural — a cápsula é a mesma receita da `TabBar`, sem o
  colapso no scroll (toolbar não encolhe: ação que some não é achada).
