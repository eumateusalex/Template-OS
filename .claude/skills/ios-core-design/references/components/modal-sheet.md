# Modal Sheet · `ModalSheet.tsx`

> Equivalente nativo: `UISheetPresentationController` — no Liquid Glass, um painel de vidro com detents.

## Anatomia

- **Painel de vidro**: `.ios-glass` com `rounded-t-ios-sheet` (20px, SÓ no
  topo — a base encosta na borda, `foundations.md` §3); máx ~640px centrado
  no desktop. O vidro já traz borda de luz, realce e sombra de flutuação
  (`materials.md` §3) — sem sombra nem fundo próprios.
- **Dentro, tudo é conteúdo sólido**: lista, form e card elevam por cor
  (`--ios-bg-grouped-secondary`) — vidro não amostra vidro (`materials.md` §5).
- **Grabber**: pílula de 36×5px em `--ios-gray3`, centrada no topo (8px de
  margem). Tocar nela **alterna o detent** (o fallback acessível do arrasto).
- **Detents**: `medium` = 50dvh · `large` = 92dvh (valores da skill); a troca usa o spring de sheet.
- Header opcional: título Headline centrado + ação de fechar/concluir.
- Corpo rolável com `overscroll-behavior: contain`; arrasto vertical no
  grabber/header (Pointer Events), snap pro detent mais próximo ao soltar —
  puxou além do medium pra baixo, fecha.

## Quando usar

- Tarefa ou conteúdo secundário sem sair da tela: filtros, detalhe, seleção rica.

## Quando NÃO usar

- Decisão de uma frase → `Alert`
- Lista de ações-verbo → `ActionSheet`
- Conteúdo primário do app → é uma tela com rota, não um sheet
- Informação minúscula ancorada num botão → `Popover`

## Estados

| Estado | O que muda |
|---|---|
| fechado | Fora da tela (translateY 100%) |
| medium | 50dvh — a tela de trás segue visível, borrada sob o vidro |
| large | 92dvh — quase tela cheia |
| arrastando | Segue o ponteiro (sem transição); solta → snap com spring |

## Conteúdo e texto

Título curto no header; a ação de saída ("Concluir", "X" com
`aria-label="Fechar"`) mora no header — gesto nunca é o único caminho.

## Acessibilidade

- `<dialog>` com `showModal()`: foco preso, Esc fecha, fundo inerte;
  `aria-labelledby` no título do header.
- Grabber: `<button aria-label="Alternar altura">` — o arrasto é
  enhancement; o TAP no grabber é o caminho de teclado/switch.

## Erros comuns

- Raio nos 4 cantos → `rounded-t-ios-sheet` é só no topo; a base encosta.
- Fundo sólido ou sombra própria no painel → sombra é assinatura do vidro e
  já vem na classe (regra 5); o sólido só existe como fallback automático.
- `.ios-glass` num card/célula lá dentro → vidro dentro de vidro
  (`materials.md` §5); o conteúdo do sheet eleva por cor.
- Esconder o fechar porque "arrasta pra fechar" → botão sempre; `scroll-snap`
  pra detent → é scroll, não altura — a troca é transform + spring.

## Web: limites

- **`backdrop-filter` em painel grande custa caro**: no large o vidro borra
  quase a tela toda a cada repaint (`web-translation.md` §4). Testar em
  aparelho fraco; `data-glass="frosted"` alivia sem sair da linguagem.
- O nativo encolhe a tela de trás (pilha) — parallax está na lista "não
  replicar" (`web-translation.md` §9); o véu escurece, o vidro borra, e pronto.
  E o arrasto não tem a "resistência" do nativo — snap simples por proximidade.
