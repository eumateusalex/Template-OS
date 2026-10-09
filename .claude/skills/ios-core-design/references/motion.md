# Movimento — curvas, durações e quando animar

> As assinaturas de movimento do sistema e as regras de aplicação.
> Os keyframes prontos moram no `tailwind.preset.js` / `tailwind-v4.css`
> (`animate-ios-*`); os valores, no `tokens.css`. O vidro que o movimento
> anima: `materials.md`.

---

## 1 · As quatro assinaturas

| Assinatura | Duração | Curva | Onde |
|---|---|---|---|
| **Padrão** | `0.3s` (`--ios-duration`) | `cubic-bezier(0.25, 0.1, 0.25, 1)` (`--ios-ease`) | Toda transição comum: fade, mudança de estado, colapso de barra, entrada de popover |
| **Entrada (spring)** | `0.5s` (`--ios-duration-enter`) | `cubic-bezier(0.32, 0.72, 0, 1)` (`--ios-ease-spring`) | **Só sheets e modais.** Chega rápido e assenta macio — a física de "subir da borda da tela" |
| **Press** | `0.1s` (`--ios-duration-press`) | (a padrão) | Estado pressionado: `scale(0.97)` + `opacity: 0.7` — e, em vidro, a iluminação (§2) |
| **Hover** | `0.15s` (`--ios-duration-hover`) | ease-in-out nativo | Hover de desktop: realce sutil de fundo/vidro. Curto de propósito — hover é dica, não evento |

- A spring é a personalidade do overlay — usada fora dele (num hover, num
  fade) vira tique. **Sheet e modal, e mais nada.**
- O **bounce** (`--ios-ease-bounce`, *tradução web calibrada*) é a curva do
  **vidro interativo**: o assentar elástico de um controle de vidro que
  respondeu ao toque (§2). Fora de superfície de vidro, não existe.
- O press de 0.1s é quase instantâneo de propósito: feedback de toque tem
  que parecer resposta física, não animação. A volta (soltar) pode usar a
  duração padrão.
- Não existe duração longa no sistema. Se algo "precisa" de 1s, é
  storytelling, não interface — está fora desta linguagem.

## 2 · Press state — o toque universal (e a iluminação do vidro)

Todo elemento tocável responde ao press do mesmo jeito:

```css
.elemento:active {
  transform: scale(0.97);
  opacity: 0.7;
  transition: transform 0.1s var(--ios-ease), opacity 0.1s var(--ios-ease);
}
```

- Em Tailwind: `active:scale-[0.97] active:opacity-70 duration-100 ease-ios`
  (o `scale-[0.97]` com valor arbitrário é aceito aqui por ser var do
  sistema documentada — 0.97 é token de comportamento).
- **Superfície de vidro ilumina ao toque.** No nativo, o material acende por
  baixo e o brilho escorre para os vidros vizinhos; a tradução web honesta é
  trocar o corpo pro estado frosted durante o press (o vidro "acende"),
  soltando com a curva bounce. Isso é a classe **`.ios-glass--interactive`**
  (tokens.css §5b) — aplicar junto com `.ios-glass` no controle que É vidro:

```css
/* já pronta no tokens.css — não recriar no componente: */
.ios-glass--interactive:active {
  background: var(--ios-glass-bg-frosted);
  transform: scale(0.97);
  transition: background 0.1s var(--ios-ease), transform 0.1s var(--ios-ease);
}
/* a volta assenta elástica (bounce) — na regra base da classe */
```

  Ela mora no tokens.css (e não em utilitária Tailwind) porque o background
  de `.ios-glass` é CSS sem camada — utilitária em `@layer` não o vence com
  garantia. O brilho escorrendo pros vizinhos NÃO se replica
  (`web-translation.md` §9).
- Células de lista trocam o scale por **fundo** (`--ios-gray5`/fill) — célula
  que encolhe parece cartão. Ver `components/list.md`.
- Este press visual é também a **compensação da ausência de haptics** na
  web — ver `web-translation.md` §5.

## 3 · O que pode animar

**`transform`, `opacity` e — em vidro — o corpo do material. Só.**

- Entrada/saída de overlay: `translateY` (sheet), `opacity` (véu, alerta),
  `scale` sutil — o alerta entra assentando de **1.1 → 1.0** com fade na
  duração padrão (`animate-ios-alert-in`; o valor nativo não é documentado,
  esta é a decisão registrada do sistema).
- **Morphing de barra**: a tab bar encolhe no scroll (cápsula reduz pro item
  ativo) animando `transform`/`opacity` dos itens entre dois estados
  discretos — nunca animando `width` da cápsula em si além do que o
  transform dá. Ver `components/tab-bar.md`.
- Colapso da nav bar: altura NÃO se anima — anima-se opacity/transform dos
  títulos entre dois estados discretos (ver `components/navigation-bar.md`).
- `background` de vidro (regular ↔ frosted) anima no press e no hover — é a
  exceção de propriedade que o material trouxe, sempre nas durações do §1.
- **Nunca animar layout**: width, height, top/left, margin, font-size. Além
  de custar performance (reflow), movimento de layout é exatamente a cara
  de web que esta linguagem evita. Precisou "crescer"? `transform: scale`.
  Precisou "abrir"? `grid-template-rows` com transition é a única exceção
  tolerada (Disclosure Group), documentada no componente.
- **Nunca animar `backdrop-filter`** — repaint da área inteira a cada frame.
  A intensidade do vidro muda por estado (`data-glass`), não por animação.

## 4 · Quando animar (e quando não)

Anima-se **mudança de contexto e resposta a gesto**:

- Overlay entrando/saindo (sheet sobe, alerta surge, popover aparece)
- Estado trocando sob o dedo (press iluminando o vidro, switch deslizando,
  segmented movendo a seleção, tab bar encolhendo no scroll)
- Conteúdo que o usuário acabou de criar/remover entrando/saindo de lista

**Não se anima decoração:** nada de fade-in de página inteira, stagger de
cards no scroll, parallax, ícone pulsando pra chamar atenção. O Liquid
Glass é vivo no TOQUE e quieto no resto — o movimento existe pra explicar
causa e efeito, não pra dar vida à tela. Na dúvida: não anima.

## 5 · prefers-reduced-motion — inegociável

Quem pediu menos movimento no sistema operacional recebe menos movimento.

- O `tokens.css` §6 já traz o kill-switch global (toda animação/transição
  cai pra 0.01ms). Importou os tokens, está coberto.
- Componente com animação própria em JS (sheet arrastável, tab bar que
  encolhe no scroll) deve checar antes de animar:

```js
const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// reduz === true → aplicar o estado final direto, sem transição
```

- Reduzir movimento **não é remover feedback**: o press state pode virar só
  a troca de fundo (sem scale nem bounce), o sheet pode aparecer sem
  deslizar — o usuário ainda precisa ver que algo respondeu.
- Movimento reduzido e transparência reduzida são pedidos independentes:
  um corta animação, o outro congela o vidro em opaco (`materials.md` §5).

## 6 · Erros comuns

| Errado | Certo |
|---|---|
| `transition: all 0.3s` | Propriedade explícita: `transition: transform 0.3s var(--ios-ease)` |
| Spring em hover de card | Spring é só de sheet/modal; hover usa a assinatura de 0.15s |
| Bounce em elemento que não é vidro | `--ios-ease-bounce` é a assinatura do vidro interativo |
| `ease-in-out` genérico em transição comum | `var(--ios-ease)` — a curva do sistema |
| Animar `height` do sheet entre detents | `transform: translateY` entre posições |
| Animar `backdrop-filter` ou o blur do vidro | Estado troca o corpo (`background`); blur não anima |
| Fade-in de página inteira ao carregar | Página aparece pronta; movimento é pra interação |
| Spinner girando com `linear` | `steps(8)` — o tique discreto do indicador do iOS |
| Ignorar reduced-motion na animação JS | Checar `matchMedia` e pular pro estado final |
