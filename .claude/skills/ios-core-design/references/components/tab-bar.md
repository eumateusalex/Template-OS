# Tab Bar · `TabBar.tsx`

> Equivalente nativo: `UITabBar` / SwiftUI `TabView` (Liquid Glass: a
> cápsula flutuante do iOS 26+).

## Anatomia

- **Cápsula de vidro flutuante** no rodapé: NÃO encosta nas bordas — flutua
  com `--ios-bar-inset` (12px) nas laterais e embaixo, somado à safe area
  (`--ios-safe-bottom` — exige `viewport-fit=cover`, ver
  `web-translation.md` §1).
- Corpo: `.ios-glass` + `rounded-ios-pill`. O vidro já traz borda de luz,
  realce e sombra de flutuação — sem borda hairline (a barra colada com
  hairline é a linguagem do iOS clássico).
- Altura de conteúdo: 49px (`--ios-h-tabbar`).
- 2 a 5 itens: ícone Phosphor de **24px** (derivado da grade de 8 — o glifo
  nativo é ~25pt) sobre rótulo **Caption 2 (11px)**.
- Ativo: `--ios-blue` com ícone `weight="fill"`. Inativo: `--ios-gray`
  com `regular` — o par regular/fill é a assinatura (ver `icons.md` §2).
- **Encolhe no scroll** (opcional, fiel ao nativo): rolando pra baixo, a
  cápsula reduz pro item ativo; rolando pra cima (ou parando), volta. Os
  itens saem/entram por opacity entre dois estados discretos — a largura
  não se anima (`motion.md` §3).

## Quando usar

- Navegação de primeiro nível do app: as 2–5 áreas principais, visíveis
  em toda tela raiz.

## Quando NÃO usar

- Filtrar/alternar conteúdo DENTRO de uma tela → `SegmentedControl`
- Ações da tela (compor, apagar) → `Toolbar`
- Mais de 5 destinos → repensar a arquitetura (o iOS usa "Mais…" — má
  ideia também na web)

## Estados

| Estado | O que muda |
|---|---|
| ativo | Azul + fill + `aria-current="page"` |
| inativo | Cinza + regular |
| pressed | `opacity: 0.7` no item |
| colapsada | Só o item ativo visível na cápsula; expande ao rolar pra cima |
| badge | Ver `badge.md` — ancorado no canto do ícone |

## Conteúdo e texto

Rótulo de UMA palavra ("Início", "Busca", "Perfil"), sempre visível —
tab só de ícone é adivinhação. Sem ponto, sem title case forçado.

## Acessibilidade

- `<nav aria-label="Principal">` com links (rotas) — tab de navegação de
  página é LINK, não button; `aria-current="page"` marca o ativo.
- Estado ativo não é só cor: fill + `aria-current` são os sinais
  redundantes.
- Alvo de cada item ≥44px de altura (os 49 da cápsula cobrem).
- Colapso respeita `prefers-reduced-motion` (sem transição; o estado ainda
  troca) — e colapsada, os itens escondidos saem do foco de teclado.

## Erros comuns

- Barra colada na borda, de largura total, com hairline → é a anatomia
  do iOS clássico; a cápsula flutua com `--ios-bar-inset` + safe area.
- Esquecer a safe area no cálculo do bottom → em iPhone a cápsula encosta
  no gesto de home e os toques falham.
- `.ios-glass` na barra E nos itens → vidro dentro de vidro
  (`materials.md` §5); a cápsula é UM vidro, os itens são conteúdo dela.
- Ícone ativo apenas mudando de cor → o peso `fill` é metade do sinal.
- Tab bar que SOME ao rolar → o nativo encolhe pro item ativo, não
  desaparece; sumir é padrão de outro sistema.
- Usar pra ações ("Sair") → tab NAVEGA; ação é `Toolbar`/`Button`.

## Web: limites

- Em viewport desktop larga a cápsula centrada segura melhor que a barra
  antiga, mas a partir de ~768px a navegação lateral/topo continua sendo a
  leitura mais natural (decisão de produto, fora da skill — ver
  `app-shell.md`).
- O morphing nativo da cápsula (largura fluida, física de gel) não se
  replica: a tradução é a troca discreta expandida ↔ colapsada com
  opacity — honesta e suficiente.
