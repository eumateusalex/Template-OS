# Web translation — o mapa nativo → web

> O arquivo mais importante da skill. O iOS é feito em UIKit/SwiftUI; isto
> aqui é o que cada conceito nativo VIRA na web — e, tão importante quanto,
> a lista do que **não se tenta replicar**, com o porquê. A regra geral:
> **traduzir com honestidade, nunca fingir.** Imitação capenga de recurso
> nativo quebra a ilusão mais do que a ausência dele.

---

## 1 · Safe area → `env(safe-area-inset-*)`

O notch, a barra home e os cantos arredondados comem borda de tela. No
nativo o sistema resolve; na web:

```css
/* pré-requisito ABSOLUTO no <head> — sem viewport-fit=cover o env() devolve 0: */
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">

.tab-bar { padding-bottom: env(safe-area-inset-bottom, 0px); } /* = --ios-safe-bottom */
.nav-bar { padding-top: env(safe-area-inset-top, 0px); }
```

- 34px é a referência de hardware (iPhone com Face ID) — é conta de
  planejamento, não valor pra fixar. O `env()` dá o valor real de cada
  aparelho e devolve 0 no desktop, que é o comportamento certo.
- Onde aplicar: barra fixa no rodapé (tab bar), sheet full-height, botão
  flutuante. Conteúdo rolável usa padding normal.

## 2 · Squircle → `border-radius` (e ponto)

O canto do iOS é uma **superelipse** (curvatura contínua, sem emenda entre
reta e curva). O `border-radius` é um arco circular — parecido, não igual.

- **A tradução oficial desta skill é `border-radius` puro.** A diferença é
  perceptível só em raio grande e olhando lado a lado.
- Por que não "consertar": `clip-path`/`mask` com path de superelipse
  quebram `border`, `box-shadow` e o anel de foco, não escalam com o
  conteúdo e custam performance. O remédio estraga mais que a doença.
- `corner-shape: squircle` é CSS emergente que resolveria de verdade.
  TODO: conferir o suporte dos navegadores quando esta skill for revisada;
  enquanto não for baseline, não usar nem como progressive enhancement
  (mudaria a forma entre navegadores — inconsistência pior que o arco).

## 3 · Dynamic Type → px fiéis + escala `rem` opt-in

No iOS o usuário escolhe o tamanho do texto do sistema e TODA interface
acompanha. A web tem um paralelo real e barato: **rem** (acompanha o ajuste
de fonte do navegador).

- **O padrão desta skill é px**, fiel à tabela do briefing (Body 17px etc.).
  O zoom de página (Ctrl +/-) já escala tudo, e o teste de 200% de
  `accessibility.md` cobre o mínimo.
- **Opt-in documentado** pra quem quiser o paralelo completo do Dynamic
  Type: converter os tokens de texto pra `rem` na base 16
  (17px → 1.0625rem) — aí o ajuste de fonte do navegador/OS escala a
  tipografia sem zoom de layout. Se adotar: converter TODOS os tamanhos de
  texto (nunca metade), e manter alturas de barra/linha em px (barra não
  cresce no iOS; quem cresce é o texto dentro dela… até o limite).
- `clamp()` serve pra título de página em viewport largo
  (ex.: `clamp(28px, 4vw, 34px)`) — usar com moderação: o iOS não tem
  tipografia fluida; isso é concessão ao desktop, não fidelidade.

## 4 · O vidro → `.ios-glass` (a tradução mora numa classe)

O material do Liquid Glass — barra, sheet, alerta, popover, menu, toast —
tem UMA tradução web, e ela mora inteira na classe `.ios-glass` do
`tokens.css` §5b: corpo translúcido + `backdrop-filter: blur() saturate()`
+ borda de luz + realce especular + sombra de flutuação. Anatomia, valores
calibrados e regras: `materials.md`.

O que importa saber do lado da técnica:

- **Nunca escrever `backdrop-filter` em componente.** O blur mora num lugar
  só; componente aplica a classe. É o que garante que o fallback opaco, o
  `data-glass` e o `prefers-reduced-transparency` funcionem em tudo de graça.
- `saturate(180%)` é o que dá a "vibrância" (cor do conteúdo atravessa
  viva); só blur fica acinzentado.
- O prefixo `-webkit-` ainda é necessário no Safari — e Safari é
  exatamente onde a peça mais vai parecer iOS. A classe já o carrega.
- **Vidro é cromo** (`materials.md` §5): superfície que não flutua sobre
  conteúdo não recebe a classe. Card de conteúdo, célula, fundo de tela:
  sólidos.
- **Custo de `backdrop-filter` em área grande é real** (sheet full-height
  borra a tela inteira a cada repaint). Em página com sheet grande + muita
  animação atrás, testar em aparelho fraco; o `data-glass="frosted"` (corpo
  mais denso) alivia o pior caso sem sair da linguagem.

## 5 · Haptics → não existe; compensar no visual

O toque físico (Taptic) não tem equivalente web utilizável
(`navigator.vibrate` não funciona no iOS e é grosseiro no Android).

- **A compensação é o press state** (`motion.md` §2): scale 0.97 + opacity
  0.7 em 0.1s. O feedback que a pele não recebe, o olho recebe no mesmo
  instante.
- Ações "de peso" (apagar, confirmar pagamento) compensam com confirmação
  visual explícita (alerta, toast), não com tentativa de vibração.

## 6 · Scroll bounce → `overscroll-behavior`

O rubber-band (conteúdo estica além do fim e volta) é física do compositor
do iOS. Na web, o que se controla é o **overscroll**:

```css
.sheet-body { overscroll-behavior: contain; } /* rolagem não vaza pro fundo */
html { overscroll-behavior-y: none; }         /* mata pull-to-refresh onde atrapalha */
```

- No Safari/iOS o bounce nativo continua existindo por conta da plataforma —
  ótimo: é o bounce verdadeiro, de graça.
- **Não simular bounce em JS** (lista da seção 9).

## 7 · Modal / detents → `<dialog>` + alturas fixas

O sheet nativo (UISheetPresentationController) tem detents (médio/cheio) e
arrasto físico. A tradução:

- `<dialog>` com `showModal()`: véu (`::backdrop`), Esc, foco preso e
  inert do fundo **de graça e acessível**.
- Detents = **classes de altura** (ex.: medium 50%, large 92% — valores no
  `components/modal-sheet.md`) trocadas com a transition spring. Tap no
  grabber alterna; arrastar é enhancement com Pointer Events e snap ao
  soltar.
- `scroll-snap` NÃO serve pra detent (é pra scroll de conteúdo, não pra
  altura de janela).

## 8 · O véu (dimming) → cor, não blur

Overlay escurece o fundo com `var(--ios-scrim)` — véu de COR (40% no claro,
**60% no escuro**: preto a 40% sobre o fundo agrupado dark, que é #000,
não separa nada). O PAINEL do overlay é vidro
(`.ios-glass`); o VÉU atrás dele continua sendo cor. Blur de tela inteira
como véu é o único blur que a linguagem não usa na web: o vidro borra o que
está atrás DELE, não a tela toda (custo de repaint sem função — o véu de
cor já separa).

## 8b · Rolagem por arrasto → dragScroll com mouse

No iPad o dedo rola qualquer superfície; no desktop o mouse não — e a barra
de rolagem do Windows quebra a ilusão. Duas traduções, juntas:

1. **Arrastar-para-rolar** (só `pointerType === "mouse"`; touch já rola
   nativo): pointerdown guarda posição e scroll; um **limiar de 6px**
   separa clique de arrasto; passou do limiar, `setPointerCapture` e aplica
   `scrollLeft/scrollTop`; o clique que termina um arrasto é **engolido
   num listener de click na fase de captura** (senão soltar o arrasto sobre
   um card abre o card). Eixos: horizontal no container, vertical no filho
   rolável sob o cursor.
2. **Scrollbar overlay**: `::-webkit-scrollbar` de 8px (largura E altura),
   thumb `var(--ios-gray3)` em pílula, track transparente, mais
   `scrollbar-width:thin; scrollbar-color:var(--ios-gray3) transparent`
   pro Firefox. 8px não tem token — registrar como decisão.

## 8c · Chrome não é documento

App não deixa selecionar o próprio chrome: `user-select:none` em barra,
sidebar, tab bar, chips, cabeçalhos e botões — **mantendo selecionável o
DADO** (células de ficha, tabelas, observações: telefone precisa ser
copiável). E dois comportamentos de host que mordem:

- `[hidden]` perde de qualquer `display` de classe → pôr
  `[hidden]{display:none!important}` no reset (as views que alternam por
  JS devem manter `hidden` e `style.display` alinhados).
- O atributo `hidden` **não se aplica a `<svg>`** (não é elemento HTML):
  sprite `<svg hidden>` vira caixa — e num body grid, vira ITEM DO GRID,
  deslocando o layout inteiro. Sprite leva `style="display:none"`.

## 9 · O que NÃO tentar replicar (e por quê)

| Recurso nativo | Por que não |
|---|---|
| **Refração física real (lensing)** | A luz dobrando na borda do vidro é shader do compositor. Em CSS, filtro SVG de displacement até imita — mas custa performance, quebra em Safari e denuncia a cópia. A tradução honesta é borda de luz + realce especular (`materials.md` §3); displacement fica como experimento avançado, nunca padrão |
| **Brilho que responde ao movimento do aparelho** | Os highlights do vidro nativo acompanham o giroscópio. DeviceOrientation na web pede permissão, drena bateria e vira gimmick — o glint estático já conta a história |
| **Vidro amostrando vidro** | O nativo compõe vidros em grupo; na web o `backdrop-filter` de dentro amostra o de fora e vira lama dupla. Vizinhos entram num contêiner de vidro só (`materials.md` §5) |
| **Rubber-band 1:1 em JS** | Física do compositor; em JS vira scroll-jacking com jank. O Safari já dá o real de graça |
| **Wheel picker com física** (roleta de Date Picker) | Exige lib de física de gesto (proibido) e nunca fica igual; o nativo `<input type="date">`/`<select>` é acessível e o iOS o renderiza como wheel de verdade |
| **Zoom-blur do context menu** (fundo desfoca e o item salta) | Na web custa um snapshot da tela inteira. O menu de vidro com véu leve (`--ios-scrim-menu`) já entrega a hierarquia |
| **Blur progressivo / scroll edge effect** (intensidade varia com o scroll) | `backdrop-filter` não anima intensidade sem repintar tudo; o ganho não paga o jank. O vidro com corpo fixo já resolve a legibilidade da borda |
| **Parallax de ícone/fundo** | Motion sickness, custo de scroll listener, e o próprio iOS o aposentou em quase tudo |
| **Dynamic Island / Live Activity** | Hardware + sistema; qualquer imitação web é cosplay |
| **Transição de navegação com gesto de borda** (swipe-back interativo) | O navegador é dono do gesto de voltar; roubar a borda quebra a navegação real |
| **Haptics** | §5 — compensação visual |
| **SF Symbols por cópia** | Licença (ver `typography.md` §3 pro mesmo problema na fonte); Phosphor é o equivalente adotado |

## 10 · Resumo de bolso

| Nativo | Web |
|---|---|
| Safe area | `env(safe-area-inset-*)` + `viewport-fit=cover` |
| Squircle | `border-radius` (TODO: `corner-shape` quando baseline) |
| Dynamic Type | px fiéis; `rem` opt-in documentado |
| Liquid Glass (Regular/Clear) | Classe `.ios-glass` / `.ios-glass--clear` + `.ios-glass-dim` — nunca `backdrop-filter` solto (`materials.md`) |
| Lensing / highlights | Borda de luz 1px + glint estático; refração real e giroscópio não se replicam |
| Slider de intensidade (iOS 27) | `data-glass="regular\|frosted\|solid"` + fallbacks automáticos |
| Haptics | Press state visual (em vidro: iluminação, `motion.md` §2) |
| Scroll bounce | `overscroll-behavior` (+ bounce real do Safari) |
| Sheet + detents | `<dialog>` + classes de altura + spring |
| Dimming | Véu de cor `var(--ios-scrim)` (40/60), nunca blur de tela |
| Rolagem do dedo | dragScroll de mouse (limiar 6px, clique engolido na captura) |
| Scrollbar do sistema | Overlay fina: 8px, thumb gray3 em pílula, track transparente |
| Chrome de app | `user-select:none` no chrome; o dado continua selecionável |
