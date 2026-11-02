# Viewport, mídia e preferências

O que é da página inteira ou do aparelho: pontos de quebra, altura de tela,
área segura do celular, imagem e vídeo, toque e ponteiro, e as preferências que
a pessoa configurou no sistema.

## Pontos de quebra

### A escala

Uma escala curta, em `rem`, que serve de ponto de partida:

| Nome | Largura | Em px (16px) | O que costuma mudar |
|---|---|---|---|
| `p` | 30rem | 480 | celular deitado, duas colunas de itens pequenos |
| `m` | 48rem | 768 | tablet em pé, lateral aparece |
| `g` | 64rem | 1024 | navegação completa, três colunas |
| `gg` | 80rem | 1280 | largura máxima do conteúdo, respiro maior |

São a mesma escala do Tailwind v4 nos degraus `md` (48rem), `lg` (64rem) e `xl`
(80rem); o `sm` dele é 40rem. Projeto com Tailwind usa a escala dele e acrescenta
degrau no `@theme` (`--breakpoint-xs: 30rem;`), sem inventar outra.

O ponto de quebra real vem do conteúdo: alargar a janela devagar e marcar onde
a linha fica longa demais, onde sobra vazio, onde um item espreme. Se o ponto
cair perto de um degrau da escala, usar o degrau; se não, o componente
provavelmente pede container query, não um degrau novo na página.

### A sintaxe

```css
/* intervalo: lê como matemática, e funciona em todos os navegadores atuais */
@media (width >= 48rem) { ... }
@media (48rem <= width < 64rem) { ... }

/* a forma antiga, equivalente */
@media (min-width: 48rem) { ... }
```

- Mobile-first: as regras base são as estreitas; cada consulta acrescenta com
  `>=`. Consulta de largura máxima só para desfazer algo que só existe no
  estreito.
- `rem` e `em` em media query valem o tamanho de fonte padrão do navegador, não
  o do `html`: o ponto de quebra acompanha a preferência de fonte da pessoa.
- Com o aninhamento do CSS (suportado em todos os navegadores atuais), a consulta
  pode morar dentro da regra do componente:

  ```css
  .menu {
    display: none;
    @media (width >= 64rem) { display: flex; }
  }
  ```

### Ponto de quebra no JavaScript

Quando o script precisa saber (carregar um componente só no desktop, trocar o
comportamento de um carrossel), ler a mesma consulta do CSS com `matchMedia`, e
ouvir a mudança em vez de medir `innerWidth` no `resize`:

```js
const largo = window.matchMedia('(width >= 64rem)');
const aplica = () => document.body.classList.toggle('largo', largo.matches);
largo.addEventListener('change', aplica);
aplica();
```

## Altura de tela

No celular, a barra de endereço aparece e some com a rolagem, e a altura visível
muda. As unidades de viewport têm três versões:

| Unidade | Altura considerada | Uso |
|---|---|---|
| `svh` | a menor (barra visível) | hero, tela cheia que não pode cortar o botão do pé |
| `lvh` | a maior (barra escondida) | fundo decorativo que não pode deixar faixa vazia |
| `dvh` | a atual, muda com a barra | painel de tela cheia, modal, app de uma tela |
| `vh` | no celular, igual a `lvh` | evitar em altura de tela |

O mesmo vale para largura (`svw`, `lvw`, `dvw`) e para os pares lógicos (`svi`,
`svb`...). `dvh` recalcula durante a rolagem: em elemento grande que muda de
altura enquanto a pessoa rola, pode dar salto; aí `svh` é mais estável.

```css
.tela-cheia { min-block-size: 100svh; }
.modal      { max-block-size: 100dvh; }
```

### O teclado virtual

Por padrão, o teclado do celular cobre a página sem mudar a viewport de layout,
e o campo no rodapé fica escondido. Nos navegadores Chromium, a meta viewport
pode pedir que o teclado encolha a página:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, interactive-widget=resizes-content">
```

Onde isso não vale, a API `visualViewport` informa a altura visível real.

## Área segura

Celular com recorte de câmera e cantos arredondados: com `viewport-fit=cover` na
meta viewport, a página ocupa a tela toda e o espaço livre vem de `env()`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

```css
.barra-fixa-do-pe {
  position: fixed;
  inset-inline: 0;
  inset-block-end: 0;
  padding-block-end: max(1rem, env(safe-area-inset-bottom));
  padding-inline: max(1rem, env(safe-area-inset-left)) max(1rem, env(safe-area-inset-right));
}
```

Sem o `viewport-fit=cover`, o navegador já deixa a margem e o `env()` vale zero.

## Imagem

### Resolução certa para cada tela

```html
<img
  src="foto-800.jpg"
  srcset="foto-400.jpg 400w, foto-800.jpg 800w, foto-1200.jpg 1200w, foto-1600.jpg 1600w"
  sizes="(width >= 64rem) 33vw, (width >= 48rem) 50vw, 100vw"
  width="1600" height="1000"
  alt="..."
  loading="lazy" decoding="async">
```

- `srcset` com `w` lista os arquivos e as larguras reais deles.
- `sizes` diz quanto da tela a imagem ocupa em cada faixa; o navegador escolhe o
  arquivo por isso e pela densidade da tela. `sizes` errado faz o celular baixar
  a versão do monitor.
- `width` e `height` reservam a proporção antes de carregar (o CSS
  `height: auto` mantém a proporção quando a largura muda).
- `loading="lazy"` só abaixo da dobra. A imagem principal do topo leva
  `fetchpriority="high"` e nunca `lazy`.
- Com `loading="lazy"`, `sizes="auto"` deixa o navegador medir a largura de
  layout sozinho nos navegadores que suportam; os outros ignoram o `auto` e usam
  o resto da lista, então escrever `sizes="auto, (width >= 64rem) 33vw, 100vw"`.

### Recorte diferente por tela e formato moderno

```html
<picture>
  <source media="(width < 48rem)" srcset="hero-retrato.avif" type="image/avif">
  <source media="(width < 48rem)" srcset="hero-retrato.jpg">
  <source srcset="hero-largo.avif" type="image/avif">
  <img src="hero-largo.jpg" alt="..." width="1600" height="900">
</picture>
```

O `picture` com `media` troca o enquadramento (retrato no celular, paisagem no
monitor); com `type`, entrega AVIF ou WebP a quem suporta. O primeiro `source`
que casa vence; o `img` é o padrão e quem leva `alt`, tamanho e classes.

### Imagem no CSS

```css
.capa {
  aspect-ratio: 3 / 2;
  inline-size: 100%;
  object-fit: cover;
  object-position: 50% 30%;
}
```

`object-fit: cover` preenche o quadro sem esticar; `object-position` escolhe o
que fica visível quando o quadro corta. Fundo decorativo pode usar
`image-set()` para trocar resolução e formato.

### Vídeo e incorporação

```css
.video { inline-size: 100%; aspect-ratio: 16 / 9; block-size: auto; }
```

Vale para `video` e para `iframe` incorporado. Vídeo que toca sozinho leva
`muted`, `playsinline` e `poster`, e não toca com `prefers-reduced-motion:
reduce`.

## Toque e ponteiro

```css
@media (hover: hover) and (pointer: fine) {
  .card:hover { translate: 0 -2px; }
}
@media (pointer: coarse) {
  .lista-de-acoes a { padding-block: 0.75rem; }
}
```

- `hover`/`pointer` descrevem o meio principal; `any-hover`/`any-pointer`,
  qualquer meio disponível (tablet com teclado e mouse). Tela de toque nunca
  depende de hover para mostrar ação ou informação.
- **Área clicável:** no mínimo 24 por 24 px, ou espaço livre em volta que
  complete esse tamanho; 44 por 44 nos controles principais de tela de toque.
  A área pode crescer sem mudar o desenho, com `padding` ou com um
  pseudo-elemento:

  ```css
  .icone-botao { position: relative; }
  .icone-botao::after { content: ""; position: absolute; inset: -10px; }
  ```

- Entre dois alvos vizinhos, `gap` suficiente para o dedo não acertar o errado.
- `touch-action: manipulation` em controle que recebe toque repetido evita o
  zoom de toque duplo.
- Campo de formulário com fonte de pelo menos 16px: abaixo disso, o Safari do
  iPhone dá zoom no campo ao focar.

## Preferências da pessoa

### Movimento reduzido

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

A regra global acima é a rede de segurança. O certo, componente por componente,
é trocar e não só apagar: o deslizamento vira troca de opacidade curta, o
parallax fica parado, o carrossel não avança sozinho. Escrito ao contrário fica
mais seguro (o movimento só existe quando a pessoa não pediu menos):

```css
@media (prefers-reduced-motion: no-preference) {
  .entra { animation: sobe 400ms ease-out both; }
}
```

No JavaScript, `matchMedia('(prefers-reduced-motion: reduce)')` antes de
qualquer animação que o script dispara.

### Cor e contraste

- `prefers-color-scheme: dark` para o tema escuro; `color-scheme: light dark` no
  `:root` para a barra de rolagem e os controles nativos acompanharem.
- `prefers-contrast: more` para engrossar borda e escurecer texto secundário.
- `forced-colors: active` (o modo de alto contraste do Windows): o sistema troca
  as cores; borda transparente vira visível, então foco e separação que dependem
  só de sombra ou de fundo precisam de `outline` ou borda real.

### Dados

`prefers-reduced-data` ainda não tem suporte útil; quem quer economizar dados
entra pelo `srcset` bem feito e pelo `loading="lazy"`.

## Impressão

```css
@media print {
  nav, .barra-fixa-do-pe, .botao-de-chat { display: none; }
  body { color: #000; background: #fff; }
  a[href^="http"]::after { content: " (" attr(href) ")"; font-size: 0.85em; }
  h2, h3 { break-after: avoid; }
  img, table, figure { break-inside: avoid; }
}
```

Só para página que alguém imprime ou salva em PDF (proposta, relatório, recibo).

## Medir

As medições de pronto estão no `SKILL.md`. Para diagnóstico rápido no console do
navegador, quem vaza da largura:

```js
const limite = document.documentElement.clientWidth;
[...document.querySelectorAll('body *')]
  .filter((el) => el.getBoundingClientRect().right > limite + 1)
  .map((el) => [el.tagName, el.className, Math.round(el.getBoundingClientRect().right)]);
```

E os alvos pequenos de toque:

```js
[...document.querySelectorAll('a, button, input, select, textarea, [role="button"]')]
  .map((el) => [el, el.getBoundingClientRect()])
  .filter(([, r]) => r.width > 0 && (r.width < 24 || r.height < 24))
  .map(([el, r]) => [el.tagName, el.textContent.trim().slice(0, 30), Math.round(r.width), Math.round(r.height)]);
```
