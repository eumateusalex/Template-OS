# Produto — do chassi ao "parece Apple" (os dois caminhos terminam aqui)

> A doutrina de PRODUÇÃO da skill: o caminho do zero (§1), os ciclos de
> verificação (§2), o acabamento de produto (§3) e o passe de precisão (§4).
> Vale pros DOIS caminhos de entrada — produto novo a partir de uma ideia E
> retrofit de sistema pronto (`rebrand.md`).

---

## 1 · O caminho do zero (da ideia ao chassi)

Não existe sistema pra inventariar — existe uma ideia. O procedimento:

1. **Definir o produto em views**: quais telas de primeiro nível? (2 a 5 —
   viram `[data-v]` na sidebar e na tab bar; mais que isso é decisão de
   produto, não de layout). Pra cada view, uma frase: o que ela mostra e o
   que o usuário faz nela.
2. **Listar o resto do inventário como se o sistema existisse**
   (`app-shell.md` §0): filtros e controles globais, ações globais,
   overlays (ficha/alerta/toast), tema (vai ter, Auto/Claro/Escuro).
3. **Colar o chassi**: `assets/app-shell-template.html` é o ponto de
   partida single-file — renomear as views demo, ligar as seções
   (`rebrand.md` §2 tem as armadilhas do chassi, que valem aqui também).
   Projeto React/multi-página monta o chassi com os componentes `.tsx`
   (NavigationBar/TabBar/Toolbar/ModalSheet) — ver "Escopo honesto" no fim.
4. **Construir o conteúdo** dentro do shell pelos references de sempre:
   tokens (regra 3), raios concêntricos (`foundations.md` §3), cards
   sólidos (`materials.md` §5 — vidro é cromo), tipografia na escala.
5. **Acabamento (§3) → passe de precisão (§4) → ciclos (§2)** — a mesma
   portaria do retrofit, sem a parte de matar header (nunca houve um).

## 2 · Ciclos de verificação (nunca um só)

Fazer → testar → corrigir, com evidência (screenshot) por ciclo, até zerar:

1. **Desktop (~1400px)**: sidebar + toolbar de vidro + views navegando.
2. **Mobile (~390px)**: tab bar cápsula, `#fbtn` abrindo o sheet de filtros
   (grabber fecha por toque E arrasto), busca na 2ª linha.
3. **Tema**: Auto/Claro/Escuro trocam; reload não pisca (anti-flash).
4. **Sondas mecânicas** (no console do navegador): todo interativo com ≥44
   de área efetiva; `.ios-glass` só no cromo; ZERO `.ios-glass .ios-glass`;
   foco entra no overlay e volta pra origem; Esc fecha; `inert` no fechado.
5. **Console limpo** — warning de acessibilidade é defeito, não ruído.
6. **Domínio intacto** — o que o sistema fazia (ou o que a ideia definiu
   que faria) continua funcionando por inteiro.
7. ⚠️ **Testar CLICANDO nos elementos reais** (`el.click()` no `.srow`, no
   card, no chip — NUNCA chamando a função por trás). Um bind
   morto (`querySelectorAll(".tab")` de uma classe que não existe mais) passa
   por todos os testes que chamam `setView()` direto, e o app trava no
   primeiro clique de verdade. Testar por função é testar a mentira.
8. **Nos dois protocolos**: http E `file://` (fetch de arquivo local não
   existe em file:// — guardar com `location.protocol`).
9. **Gate de primeira impressão**: print lado a lado com a referência de
   qualidade (um app Apple real ou o melhor exemplar que o usuário indicar).
   Se a primeira impressão não segura, os ciclos continuam.

## 3 · Acabamento de produto — a régua do "parece Apple"

Shell certo com conteúdo cru continua parecendo protótipo. Esta fase é
NORMATIVA:

- **Tipografia por papel — a tabela normativa é UMA:** `typography.md` §4b
  (pesos 600/700 por papel, badges com line-height de caixa, caps com
  `var(--ios-tracking-caps)`, estilo completo). Aplicar DALI; papel novo se
  registra LÁ, nunca aqui.
- **Três níveis de texto de verdade** (label/secondary/tertiary) — achatar
  secondary=tertiary mata a profundidade do app inteiro.
- **Press universal 0.1s** (botão/chip/ícone: scale .97 + opacity .7);
  **célula não encolhe** — troca o fundo pra `--ios-gray5`. **Hover só
  atrás de `@media (hover:hover)`**, um tom (`fill-quaternary` /
  `brightness(.97)`).
- **Coluna de kanban não é caixa**: header de seção (swatch redondo + nome
  caps + contagem em pílula) sobre o fundo agrupado; o CARD é a única
  superfície. **O título é o alvo do card inteiro** (button com
  `::before{inset:0}`); ação secundária sobe com z-index.
- **Régua única de indentação na sidebar** (valores em `app-shell.md` §2);
  linha sem ícone alinha com `.ic-vazio` (glifo invisível).
- **Ícone no meio do dado**: estrela na nota, tendência (↑↓) no delta,
  ícone carregando a cor do aviso (a composição `notice.md`), glifo 20px
  com `margin-top:1px` encaixando na primeira linha.
- **Números**: `tabular-nums` global; **zero exibido é "—"**; coluna de
  número com largura mínima e `text-align:right` (chip de dias:
  `min-width:44px` center).
- **Empty state 48/8/4/280**: ícone 48 `label-tertiary` + h4 headline +
  p subheadline ≤280px. Ícone de empty NUNCA é colorido.
- **Escrita**: botão em Title Case ("Conectar Planilha", "Mostrar Mais",
  "Copiar Resumo"), voz impessoal ("Não foi possível copiar"), rótulos de
  tile minúsculos ("mensagem", "ligar" — a composição `action-tiles.md`),
  sem tooltip — `aria-label` ou texto visível.
- **Coluna de leitura**: relatório/lista dentro de `.wrap{max-width:1020px;
  margin:0 auto}`. Separador de lista INDENTADO com o texto (a partir do
  padding), nunca de borda a borda.
- **Controles nativos domados**: select com `appearance:none` + caret do
  sprite; checkbox de opção vira switch 51×31; `select option` com fundo do
  tema (host fix — embutido no tokens.css §4); placeholder
  em `label-tertiary`.

## 4 · Passe de precisão — margens, tipografia fina e dark

O passe que separa "ficou bom" de "não tem nada torto": busca desalinhada
4px, badge estourando a sidebar, conteúdo colado na toolbar no mobile,
dropdown claro no dark. NENHUM desses aparece sem medir — por isso o passe é
mecânico, não de olho.

### 4.1 · Gates de fundação (grep antes de qualquer medição)

Rodar no arquivo e REPROVAR se falhar:

1. `box-sizing:border-box` existe (universal `*,*::before,*::after`) — sem
   ele todo `width:100%` com padding estoura; o tokens.css §4 já o carrega,
   mas arquivo single-file com tokens inline precisa da cópia.
2. `--tb-h` definida FORA de media query (base mobile) E dentro da ≥768.
3. `select option{...}` presente (via tokens ou cópia local).
4. `accent-color` presente no body (via tokens ou cópia local) — checkbox/
   radio/range nativos no azul do sistema (`color.md` §7, host fix 3).
5. Zero `alert(`/`confirm(` — diálogo é o `dialog.al` da linguagem.
6. Zero `style="` inline com `font-size`/`line-height`/`margin` — acabamento
   não mora em atributo.
7. Zero `"..."` em texto de UI — reticências são `…`.

### 4.2 · A régua única de margens

Um só idioma de margem no app inteiro, via `--pad` local
(`--ios-margin` 16 → `--ios-margin-wide` 20 numa media no `:root`):

| Área | Regra |
|---|---|
| Toolbar | `padding:0 var(--pad)` — a MESMA borda das views — e **hairline de scroll-edge** (`border-bottom` separator): a borda de luz do vidro é invisível no claro e não ancora o canto |
| View | `padding: calc(var(--tb-h) + 16px) var(--pad) var(--ios-section-gap)` |
| Sidebar | a régua de indentação de `app-shell.md` §2 (contêiner + filhos) |
| Card/cartão | `--ios-card-padding` (16) |
| Ficha/painel | header `16px var(--pad)`; corpo `16px var(--pad) 24px` |
| Coluna de leitura | `.wrap{max-width:1020px;margin:0 auto;gap:16px}` |
| Fila/lista em cartão | linha `padding:8px 0` — o recuo lateral vem do cartão, nunca dos dois |

Depois de aplicar, **medir** (console): `getComputedStyle` dos paddings das
áreas contra a tabela, `scrollWidth === clientWidth` na sidebar e no body
(estouro horizontal = reprovado), e **a ALTURA REAL das barras**:
`.toolbar` = 44 + 1 do hairline — mais que isso é margem de UA vazando
(`<form>` da busca tem ~17px de margem inferior; zerar com `margin-block:0`).
Medir padding declarado NÃO pega isso: o padding estava certo e a barra
estava 17px mais gorda mesmo assim. Valor fora do grid de 8 só sobrevive se
estiver na lista de exceções registradas (`foundations.md` §2).

### 4.3 · Tipografia fina

- **Estilo completo**: todo `font-size` com o `line-height` do MESMO estilo
  na mesma regra (ícone por font-size não precisa). Texto herdando o 22 do
  Body num Footnote é o defeito mais silencioso do acabamento.
- Pesos e papéis: SÓ o que a tabela de papéis de produto autoriza
  (`typography.md` §4b) — fora dela, 400.
- Caps sempre com `var(--ios-tracking-caps)` — hard-codar tracking é
  regressão.
- Erro de sistema fala a língua do app: `dialog.al` (Headline + Footnote +
  OK Body/600), nunca o `alert()` do navegador.

### 4.4 · Dark é uma página nova

Depois que o light passar: **repetir a varredura visual INTEIRA no dark**
(cada view, cada overlay, o dropdown de cada select aberto, chips, gráfico,
badges). O que conferir de específico:

- `color-scheme` declarado nos temas (chrome do navegador — scrollbar,
  caret, dropdown — segue ele, não as vars; `color.md` §7).
- Chip de estado mantém cor (tint 15% + acento trocam sozinhos via
  `color-mix`; se o chip ficou cinza, o fallback assumiu — registrar).
- Contraste dos pares tint/acento sobre `#1C1C1E` (accessibility.md §2
  manda conferir nos DOIS temas).
- Sheet de vidro sobre conteúdo escuro continua legível.

### 4.5 · A ordem do passe

Gates (4.1) → régua aplicada e MEDIDA (4.2) → tipografia (4.3) → varredura
light → varredura dark (4.4) → prints pareados com a referência (§2.9).
O passe roda DEPOIS do acabamento do §3 — é auditoria, não construção.

## Checklist de saída (a portaria comum dos dois caminhos)

- [ ] Navegação nos dois breakpoints (`[data-v]` na sidebar E na tab bar)
- [ ] Filtros/estado/ações morando na sidebar, por seção
- [ ] Aparência funcionando com localStorage + anti-flash
- [ ] Sheet mobile com inert + grabber (toque e arrasto)
- [ ] Badges `[data-qn]` sincronizados
- [ ] Scrollbar overlay + dragScroll (web-translation §8b)
- [ ] Sprite Phosphor embutido (subset do `assets/phosphor-sprite.svg`)
- [ ] Sondas do §2 zeradas e console limpo (em http E file://)
- [ ] Testado POR CLIQUE nos elementos (§2.7), nunca só por função
- [ ] Acabamento do §3 conferido peça a peça (tipografia/press/ícones/
      zeros/empty/escrita)
- [ ] Gates do §4.1 verdes (box-sizing, --tb-h nos 2 mundos, select option,
      accent-color, zero alert()/inline-style/"...")
- [ ] Margens MEDIDAS contra a régua do §4.2 (e zero estouro horizontal)
- [ ] Dark varrido como página nova (§4.4), dropdown aberto incluído
- [ ] Primeira impressão pareada com a referência (§2.9)

No retrofit, somam-se os itens próprios do `rebrand.md` (header morto,
funcionalidade original intacta).

## Escopo honesto

O template cobre o caso **single-file/estático** (painel, protótipo,
ferramenta interna). Para React/multi-página o PROCEDIMENTO é o mesmo —
nos dois caminhos — com o chassi montado dos componentes `.tsx` da skill
(NavigationBar/TabBar/Toolbar/ModalSheet) em vez do template. O que muda é
a carpintaria, não a doutrina.
