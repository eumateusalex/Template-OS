# Context Menu · `ContextMenu.tsx`

> Equivalente nativo: `UIContextMenuInteraction` (long-press) e o menu de
> clique-direito do iPadOS/macOS.

## Anatomia

- Painel de **250px** (medida nativa): `.ios-glass` + `rounded-ios-card`
  (16px). O menu é cromo flutuando sobre a tela — o vidro já carrega borda
  de luz e sombra de flutuação (`materials.md` §3); sombra própria é
  proibida (regra 5).
- Itens de **44px**: rótulo Body à ESQUERDA + ícone Phosphor à DIREITA
  (a assinatura do menu iOS — ícone à esquerda é web), hairline entre
  itens; destrutivo em `--ios-red`; separador de GRUPO mais grosso
  (8px de `--ios-fill-quaternary`).
- Abre por **clique-direito** (desktop) ou **long-press ~500ms** (touch),
  no ponto do gesto, clampado no viewport.
- Véu leve: `.ios-dialog--menu::backdrop` → `--ios-scrim-menu`. Sem o zoom-blur nativo (Web: limites).

## Quando usar

- Ações secundárias sobre UM item (arquivo, mensagem, card): renomear,
  duplicar, compartilhar, apagar.

## Quando NÃO usar

- Ação primária do item → o toque normal faz; menu é o secundário
- Mobile como único caminho → long-press é invisível; garanta as mesmas
  ações num `ellipsis` visível ou swipe (`list.md`)
- Navegação → menu não navega seção; é ação contextual

## Estados

| Estado | O que muda |
|---|---|
| aberto | Fade-in 0.3s no ponto do gesto |
| item focado (teclado) | Fundo `--ios-gray5` |
| item pressed | `opacity: 0.7` |

## Conteúdo e texto

Verbo curto por item ("Renomear…", com reticências quando abre outra
etapa). Destrutivo por último, depois do separador de grupo. Máximo ~7
itens.

## Acessibilidade

- `role="menu"` + `role="menuitem"`; setas ↑/↓ navegam (roving focus),
  Enter ativa, Esc fecha (dialog nativo).
- O gatilho visível (`ellipsis`) tem `aria-haspopup="menu"` +
  `aria-expanded`.
- Long-press NUNCA é o único caminho — o `.tsx` expõe `openAt` pra ligar
  num botão visível.

## Erros comuns

- Ícone à esquerda do rótulo → no iOS o ícone fica à direita.
- Sombra avulsa no painel → o `.ios-glass` já a carrega (regra 5).
- Menu com 15 itens e submenus → 7 no máximo, sem submenu na v1.
- Abrir no hover → abre por gesto explícito (clique/press).
- Esquecer o clamp → menu aberto na borda direita não pode vazar.

## Web: limites

- Sem o zoom-blur nem o "levantamento" do item nativo: a rejeição hoje é
  só custo web — exige snapshot da tela inteira (`web-translation.md` §9).
- Long-press disputa com o menu de contexto do navegador em alguns
  ambientes touch; o `.tsx` chama `preventDefault` no `contextmenu`
  do alvo enquanto o menu próprio estiver armado.
