# Acessibilidade — o passo 4 de todo fluxo

> Checklist transversal que roda ANTES de entregar qualquer peça. O detalhe
> fino de cada componente (teclas, ARIA específico) está no `.md` do próprio
> componente; aqui mora a régua geral e a tabela-resumo dos 28.

---

## 1 · As seis verificações

1. **Contraste** — AA do WCAG: 4.5:1 pra texto normal, 3:1 pra texto grande
   (≥24px, ou ≥18.5px em bold) e pra ícone/borda informativa.
2. **Foco visível** — todo interativo mostra onde o teclado está. Nunca
   `outline: none` sem substituto à altura.
3. **Teclado** — tudo que o toque faz, Tab/Enter/Espaço/Esc/setas fazem.
4. **Cor nunca é o único sinal** — estado sempre acompanha texto, ícone,
   posição ou peso.
5. **Zoom de texto a 200%** sem quebra de layout nem conteúdo cortado.
6. **Movimento reduzido** — coberto pelo kill-switch do `tokens.css` §6;
   animação própria em JS checa `matchMedia` (ver `motion.md` §5).

## 2 · Contraste — os números reais desta paleta

- `--ios-label` sobre `--ios-bg`: preto/branco puro, sempre passa.
- `--ios-label-secondary` (60%): ≈7:1 no light — passa pra texto normal.
- `--ios-label-tertiary` (30%): **falha AA pra texto** (≈2.3:1). Por isso é
  só placeholder/desabilitado — conteúdo que o usuário PRECISA ler não usa
  tertiary. Quaternary nem texto é.
- ⚠️ **A verdade sobre o azul:** `#007AFF` sobre branco ≈ **4.0:1** — passa
  pra texto grande e ícone (3:1), **falha por pouco o AA de texto normal**
  (4.5:1). É o trade-off da própria Apple, que usa assim mesmo. Regra prática
  desta skill: azul em texto está ok em 17px+ (botão, link de célula, ação);
  em texto menor que 17px essencial, preferir `--ios-label` com outro sinal
  de interatividade. No dark o problema some (`#0A84FF` sobre preto ≈ 5.8:1).
  Se o projeto exigir conformidade AA estrita em tudo, registrar a exceção e
  decidir com o dono do projeto — não trocar o azul por conta própria.
- Texto branco sobre acento (botão filled, badge): mesma conta do azul
  (≈4.0:1) — o botão primário usa 17px semibold, borderline aceito como
  padrão de plataforma; badge usa branco sobre vermelho (≈4.0:1) em texto
  de 13px — informação curta e redundante (o número acompanha o item).
- ⚠️ **O azul sobre a lavagem dele mesmo é pior, e no dark NÃO some**. O par que esta skill prescreve pra chip de estado e
  pra item ativo da sidebar é acento cheio sobre a lavagem de 15% do próprio
  acento. Num painel real deu **2.99:1** no chip claro (12px/600) e **3.92:1**
  no escuro, dentro de um cartão `#1C1C1E` — o alívio do dark vale pro azul
  sobre preto puro, não sobre a lavagem em cima de superfície elevada. Laranja
  (8.6:1) e verde (8.8:1) passam folgado no mesmo padrão: o problema é só do
  azul. Saídas, na ordem: `--ios-label` no texto e a lavagem só como fundo;
  acento próprio do projeto no lugar do azul de sistema; ou aceitar como padrão
  de plataforma — mas **registrando a exceção com o dono**, nunca em silêncio.
- ⚠️ **Texto sobre vidro é contraste VARIÁVEL** — o risco número 1 da
  linguagem (foi a falha documentada do iOS 26 que o iOS 27 corrigiu). O
  corpo do Regular a 55% ameniza, mas não garante: sobre conteúdo
  movimentado ou de alto contraste, medir no PIOR caso (o trecho mais
  parecido com a cor do texto passando por baixo). Se falhar:
  `data-glass="frosted"` no contêiner (corpo a 80%) resolve sem sair da
  linguagem. Clear nunca carrega texto essencial sem o dimming — e o
  fallback opaco (`prefers-reduced-transparency`, navegador sem blur) já
  devolve contraste de superfície sólida pra quem precisa.

## 3 · Foco visível — a adaptação web obrigatória

O iOS nativo é touch e não desenha anel de foco; a web tem teclado, então
**anel de foco existe e é assumido**, no padrão do sistema:

```css
:focus-visible {
  outline: 2px solid var(--ios-blue);
  outline-offset: 2px;
}
```

- `:focus-visible`, não `:focus` — toque/clique não mostra anel, teclado sim.
- O anel usa o azul do sistema e NUNCA se remove sem substituto igual ou
  mais visível.
- Overlay (sheet, alerta) prende o foco dentro de si enquanto aberto e
  devolve o foco pra quem abriu ao fechar (o `<dialog>` nativo faz isso de
  graça — ver `web-translation.md` §7).

## 4 · Teclado por família

| Família | Teclas |
|---|---|
| Botões, células, tabs | Tab alcança; Enter/Espaço ativa |
| Segmented, radio, tabs de conteúdo | Setas trocam a seleção dentro do grupo (grupo = 1 tabstop) |
| Switch, checkbox | Espaço alterna |
| Slider, stepper | Setas ±passo; Home/End extremos; PageUp/Down passo maior |
| Campos de texto | Padrão do navegador; Esc limpa busca quando houver botão de limpar |
| Overlays (alerta, sheet, popover, menu) | Esc fecha; Tab circula preso dentro; setas navegam itens de menu |
| Lista com swipe actions | As ações têm alternativa visível em foco/hover (botão revelado) — gesto nunca é o único caminho |

## 5 · Role e ARIA por componente (resumo; detalhe no .md de cada um)

| Componente | Base |
|---|---|
| Button | `<button>` nativo; `aria-label` quando só ícone |
| Segmented Control | `role="tablist"` + `role="tab"` + `aria-selected` (ou radiogroup, ver .md) |
| Switch | `<button role="switch" aria-checked>` |
| Slider | `<input type="range">` nativo |
| Stepper | Grupo com `role="group"` + dois `<button>` + valor em `aria-live="polite"` |
| Text Field / Text Area | `<input>`/`<textarea>` + `<label>` sempre; erro via `aria-describedby` + `aria-invalid` |
| Picker | `<select>` nativo (é o picker acessível da web) |
| Date Picker | `<input type="date">` nativo |
| Search Field | `<input type="search">` + `role="search"` no form |
| List / Row | `<ul>/<li>`; linha clicável é `<a>`/`<button>` por inteiro |
| Section Header | Heading real (`<h2>`/`<h3>`) — hierarquia de heading sem pulo |
| Card | `<article>`/`<section>` com heading próprio |
| Avatar | `<img alt>`; decorativo → `alt=""` |
| Disclosure Group | `<button aria-expanded aria-controls>` no cabeçalho |
| Navigation Bar | `<header>` + `<nav>`; título da tela é o `<h1>` |
| Tab Bar | `<nav aria-label="Principal">` + links/botões `aria-current="page"` |
| Toolbar | `role="toolbar"` + `aria-label` |
| Alert | `<dialog role="alertdialog">` + `aria-labelledby`/`aria-describedby` |
| Action Sheet / Modal Sheet | `<dialog>` + `aria-labelledby`; grabber com `aria-hidden` (decorativo) e alternativa por botão |
| Popover | `<dialog>` ancorado ou `role="dialog"` + foco preso |
| Context Menu | `role="menu"` + `role="menuitem"`; setas navegam, Esc fecha |
| Activity Indicator | `role="status"` + `aria-label="Carregando"` (SVG `aria-hidden`) |
| Progress Bar | `<progress>` nativo ou `role="progressbar"` + `aria-valuenow/min/max` |
| Badge | Número com contexto: `aria-label="3 notificações não lidas"` no pai |
| Toast | Container `role="status"` `aria-live="polite"` (erro: `assertive`) |
| Empty State | Heading + parágrafo comuns — sem ARIA especial |

## 6 · Checklist de entrega (rodar sempre)

1. Contraste conferido nos DOIS temas? (o dark muda as contas)
2. Tab percorre tudo em ordem lógica, com anel visível?
3. Esc fecha o que está aberto? O foco voltou pra quem abriu?
4. Todo ícone-botão tem `aria-label`?
5. Erro de formulário ligado ao campo (`aria-describedby`), não só solto na tela?
6. Estado (selecionado, ligado, atual) existe em ARIA, não só na cor?
7. 200% de zoom de texto: nada quebrou, nada sumiu?
8. Alvo de toque ≥44×44 (regra 1 — vale recontar aqui)?
