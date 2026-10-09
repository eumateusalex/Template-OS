# Popover · `Popover.tsx`

> Equivalente nativo: `UIPopoverPresentationController` — o balão ancorado
> de iPad/desktop.

## Anatomia

- Painel flutuante ancorado no elemento que o abriu: `.ios-glass` +
  `rounded-ios-card` (16px), largura **280px**. O popover é cromo — o
  vidro já traz borda de luz e sombra (`materials.md` §3); sombra própria
  é proibida (regra 5).
- **Seta** de 12px apontando pra âncora: quadrado rotacionado pintado com
  o corpo do vidro, acima ou abaixo — aproximação (ver Web: limites).
- Posição: preferindo abaixo da âncora; sem espaço, acima; sempre
  **clampada** dentro do viewport com 8px de folga.
- Véu quase imperceptível (`--ios-scrim-menu`) — o popover não escurece a
  tela (quem escurece é sheet/alerta); clique fora fecha.

## Quando usar

- Informação ou controles rápidos ancorados num botão, em tela larga:
  filtro pequeno, detalhes de um item, mini-form de 1–2 campos.

## Quando NÃO usar

- Em viewport estreita (<640px) → o padrão do iOS é o popover VIRAR
  sheet no iPhone; a skill segue: use `ModalSheet`/`ActionSheet` no mobile
- Lista de ações-verbo → `ContextMenu`
- Tooltip de texto puro → título nativo/`aria-describedby` resolve

## Estados

| Estado | O que muda |
|---|---|
| aberto | Fade-in 0.3s (`animate-ios-fade-in`) |
| fechado | Removido (dialog fechado) |

## Conteúdo e texto

Conteúdo mínimo e autocontido. Título opcional em Headline; corpo
Subheadline. Não repetir o rótulo do botão-âncora como título.

## Acessibilidade

- `<dialog>` com `showModal()` (foco preso, Esc fecha) posicionado via
  `getBoundingClientRect` da âncora.
- `aria-labelledby`/`aria-label`; ao fechar, o foco VOLTA pra âncora
  (o dialog nativo devolve sozinho).
- O botão-âncora ganha `aria-expanded` + `aria-haspopup="dialog"`.

## Erros comuns

- Popover em cima de popover → um por vez; empilhou, o desenho errou.
- Sombra avulsa ou vidro dentro de vidro → o painel é UM `.ios-glass`;
  o conteúdo dentro dele é superfície comum (regra 8).
- Usar como tooltip de hover → popover abre por CLIQUE; hover não abre
  overlay nesta linguagem.
- Deixar sair da tela perto da borda → o clamp é obrigatório (o `.tsx` cuida).
- Escurecer o fundo → véu é dos overlays de decisão; popover convive com
  a tela.

## Web: limites

- **A seta sobre vidro é aproximação**: pinta só o corpo do vidro
  (`--ios-glass-bg`), sem o backdrop-filter do painel (dois backdrops
  amostrariam a tela duas vezes, com emenda visível) e sem o fallback
  opaco automático da classe. Limitação honesta.
- Reposicionamento em scroll/resize: fecha ao rolar (comportamento
  nativo do iPad) em vez de perseguir a âncora — mais simples e mais fiel.
- CSS Anchor Positioning fará isso declarativo; TODO quando for baseline.
