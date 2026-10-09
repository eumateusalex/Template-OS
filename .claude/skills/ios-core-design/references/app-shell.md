# App shell — sidebar, toolbar e tab bar num app de verdade

> O app inteiro: a decisão sidebar × tab bar, as réguas do shell e as
> armadilhas de cascata e de host. Peças individuais: `components/tab-bar.md`, `components/navigation-bar.md`,
> `components/modal-sheet.md`. Armadilhas de host: `web-translation.md` §8b/8c.

---

## 0 · O rebrand estrutural — de página pra app (LEIA PRIMEIRO em retrofit)

**Aplicar esta skill num app existente NÃO é repintar com tokens.** Página
com header de filtros empilhados continua sendo página, mesmo de vidro. O
que faz "parecer produto Apple" é a ESTRUTURA — e o retrofit começa
reorganizando o que existe no shell deste arquivo:

| O que a página tem | O que vira no app |
|---|---|
| Header com nome + abas + botões | **Toolbar de vidro** (44px, só título da view + busca + ações da tela) |
| Abas de navegação no header | **Sidebar** (desktop) + **tab bar cápsula** (mobile) — mesmos `data-*` |
| Filtros espalhados no header | **Seção "Filtros" da sidebar** (selects de 44 com caret do sprite) |
| Chips/régua de estado | Seção própria da sidebar, com section header em caps |
| Ações globais (conectar, atualizar, config) | **Rodapé da sidebar** (`margin-top:auto`) |
| Nada (tema preso ao sistema) | Seção **"Aparência"**: segmented Auto/Claro/Escuro gravando `data-theme` + localStorage (aplicado ANTES do primeiro paint) |
| Ícones improvisados ou nenhum | **Sprite Phosphor** embutido (`icons.md` §6) |

Regra de bolso: **se depois do retrofit o header original ainda existe, o
retrofit não terminou.** Um retrofit que só troca tokens não convence:
"parece iOS" é o shell, não a pintura.

**O procedimento passo a passo é o `rebrand.md`; o chassi pronto é o
`assets/app-shell-template.html`.** Este arquivo segue sendo a anatomia de
referência do shell (medidas, papéis, armadilhas).

## 1 · O layout macro

**Desktop (≥768px) — shell estilo Mail/Notas:**

```
body (grid: 280px | minmax(0,1fr))
├── aside.side          ← sidebar: navegação + filtros + utilitários
└── div.app (relative)
    ├── .toolbar        ← 44px, absolute no topo, .ios-glass
    └── views           ← rolam POR BAIXO da toolbar (padding-top: --tb-h)
```

**Mobile (<768px):** a navegação vira **tab bar** de 49px no rodapé, e a
**própria sidebar vira o sheet** de filtros (sobe da borda de baixo, spring,
grabber). **Um DOM só para os dois mundos** — nada de duplicar selects ou
contagens; quem precisa existir em dois lugares (badge, item de navegação)
é encontrado por atributo (`[data-v]`, `[data-qn]`), nunca por id repetido.

- A largura da sidebar é **280px** (fonte: leitura do Mail/Ajustes no
  iPadOS; 260–320 é a faixa aceitável).
- O grid do body precisa de `minmax(0,1fr)` na coluna de conteúdo, senão
  conteúdo largo (kanban, tabela) estica a célula.
- `--tb-h` = safe-area-top + 44 (+ 52 quando a toolbar tem segunda linha de
  busca no mobile). ⚠️ **Definir nos DOIS breakpoints**: a base `:root` carrega o valor mobile e a media ≥768 sobrescreve
  pra 44. Definida só dentro de uma media, `calc(var(--tb-h)+16px)` invalida
  no outro mundo e **o shorthand `padding` inteiro da view computa 0 nos
  quatro lados** — conteúdo passa por baixo da toolbar. **View que esconde a
  busca zera os 52** via classe no body (`body.v-relatorio{--tb-h:…44}`), e
  botão que abre um sheet vazio naquela view some.
- **A folga é regra:** view = `padding-top: calc(var(--tb-h) + 16px)`. Os
  16px são o respiro entre a borda do vidro e o primeiro conteúdo — sem
  eles, header de coluna/card "cola" na toolbar.

## 2 · A sidebar

- Fundo `--ios-bg-secondary` (tela plana rebaixada; no dark vira grafite
  contra o preto do conteúdo de graça), hairline à direita, `overflow-y:auto`,
  seções separadas por `--ios-section-gap`.
- **A régua de indentação (os números oficiais):** contêiner
  `padding: 16px 12px`; **todo** filho indenta +12 (padding ou margin próprios)
  → **todo texto da sidebar começa a 24px da borda**. Os 12 internos da
  linha existem pro retângulo de seleção sangrar 12 pra cada lado do texto.
  Linha sem ícone alinha com `.ic-vazio` (glifo invisível que reserva a
  caixa + o gap).
- **Título do app** em Title 2 bold no topo (leitura iPadOS de sidebar).
- **Section headers** em Footnote caixa-alta (`section-header.md`).
- **Linha (célula) de sidebar**: 44px mínimo, raio de input (12), ícone de
  20px fixo + rótulo Subheadline + contagem à direita. (Raio de botão não
  serve aqui: botão é cápsula, e célula de navegação não é cápsula.)
- **Ícone de item tintado com o acento** (`--ios-blue`) — é como Mail/
  Ajustes fazem; cinza é cara de web. Linhas com semântica própria
  (atrasado/vence hoje) mantêm o acento semântico (red/orange).
- **Seleção**: fundo `--ios-blue-tint` + texto/ícone azul + semibold.
  O cinza `--ios-gray5` fica reservado pro press (célula não usa scale).
- **Contagem**: badge de 20px (`badge.md`) — cinza neutro por padrão;
  vermelho/laranja SÓ onde a cor é o estado (atrasado, pendente).
- Utilitários de rodapé (conectar fonte de dados, atualizar, aparência)
  moram na última seção com `margin-top:auto` — é onde o Mail põe status
  de conta; a toolbar não é lugar de botão que o app às vezes esconde.

## 3 · A toolbar

- 44px + safe-area-top, `position:absolute` sobre o conteúdo, com
  `.ios-glass` — **este é o vidro legítimo**: conteúdo rola por baixo.
  (Header que nada atravessa é superfície sólida — vidro que não borra nada
  é decoração; `materials.md` §5, "vidro é cromo".)
- **Hairline de scroll-edge POR BAIXO do vidro**:
  `border-bottom:1px solid var(--ios-separator)`. A borda de luz do material
  (`--ios-glass-stroke`) é branca — invisível sobre fundo claro — e **não
  serve de âncora de alinhamento**. Sem o separator, o primeiro conteúdo
  "encosta" na barra a olho nu mesmo com os 16px de respiro medidos, e a
  busca no canto parece desalinhada. É o mesmo fio que o iOS mostra quando
  algo rola sob a barra — e aqui algo SEMPRE rola.
- Conteúdo: **título da view atual** (Headline) + subtítulo Footnote
  secundário (contagem), busca à direita (campo de 36 dentro da faixa de
  44, `search-field.md`), botões plain. Ordem no DOM: **título → botões →
  busca** (título é o âncora esquerdo; ações empurram com `margin-left:auto`).
- ⚠️ **A busca é um `<form>` — zerar `margin-block`**: o UA dá ~17px de margem inferior a todo form; na flex line da
  toolbar isso engorda a barra de 44 pra 61 e o conteúdo (que compensa
  `--tb-h`=44) entra POR BAIXO do vidro. **Sonda: altura real da `.toolbar`
  = 44 + 1 do hairline** — se der mais, tem margem de UA vazando.
- **Padding lateral = `--pad`**: a toolbar usa a MESMA margem de
  layout das views (`--pad` = `--ios-margin` 16 → `--ios-margin-wide` 20 em
  ≥768, trocada numa media no `:root`). Toolbar com 16 fixo contra conteúdo
  de 20 desalinha a busca da coluna dos cards em 4px, e isso se vê a olho
  nu.
- O subtítulo **acompanha a view** — atualizar na troca, não deixar a
  contagem de uma tela congelada na outra.

## 4 · Tab bar e sheet (mobile)

- Tab bar por `components/tab-bar.md`: cápsula de vidro FLUTUANTE (49 de
  conteúdo + `--ios-bar-inset` de margem + safe area), ícone 24
  regular→fill, Caption 2, badge no canto do ícone. Itens carregam o mesmo
  `data-*` dos itens da sidebar; o `setView` marca `aria-current="page"`
  nos dois.
- O sheet (a sidebar reposicionada por media query) leva **grabber** de
  36×5 (`modal-sheet.md`): toque fecha, arrastar ~60px pra baixo fecha
  (durante o arrasto, `transition:none` pra seguir o dedo; soltar restaura
  e a própria transition faz o snap). No sheet, título do app e navegação
  somem — a tab bar cobre a navegação e as seções titulam o resto.
- **Sheet fechado é `inert`** (Tab não pode entrar em região invisível), e
  no desktop a sidebar NUNCA é inert — alternar via `matchMedia` com
  listener de `change` pra janela redimensionada.

## 5 · Estados e views

- Troca de view é **instantânea** — iOS não anima troca de tab. O que
  anima é overlay (sheet/alerta) e resposta a gesto.
- Regras `body.v-<view>` escondem o que não se aplica (filtros na view de
  relatório etc.) — e o que se esconde **deixa de agir**: filtro com
  controle invisível numa view não pode continuar filtrando os dados dela.
- Overlays: ficha/detalhe é sheet de baixo no mobile e painel lateral no
  desktop (raio só nos cantos que não encostam); véu `var(--ios-scrim)`;
  foco entra no fechar ao abrir e volta pra origem ao fechar; fechado é
  `inert`, com `role="dialog"`/`aria-modal` quando for modal de verdade.

## 6 · Armadilhas de cascata e de host

1. **Cascata × media query**: `display:none` dentro de `@media` PERDE pra
   regra base de mesma especificidade escrita depois. Regra base primeiro,
   media depois; na ordem inversa a tab bar aparece no desktop e o grabber
   some no mobile.
2. **Seletor de elemento pelado** (`aside{…}`) captura o próximo `<aside>`
   que entrar no markup: uma ficha nova joga a sidebar pra fora da tela. Overlay
   se estiliza por id/classe.
3. **`<svg hidden>` não esconde** (§8c do web-translation): o sprite vira
   item do grid do body e desloca o layout inteiro.
4. **`[hidden]` × display de classe** — idem §8c.
5. **Arquivo único / `file://`**: os tokens entram INLINE no `<style>` como
   cópia literal do `tokens.css`, com comentário dizendo de onde vieram e
   que mudança se faz na fonte e se recopia. `<link>` externo quebra o
   caso de uso (abrir por arquivo, mandar por mensagem).

## 7 · Checklist de shell (antes de entregar)

1. Sidebar 280 / tab bar flutuante (49 + inset + safe area) nos lugares
   certos nos dois breakpoints?
2. Um DOM só — zero id duplicado entre sidebar e tab bar?
3. Toolbar de vidro E conteúdo rolando por baixo dela (e nenhum vidro
   dentro de vidro)?
4. Subtítulo/contagem acompanham a view?
4b. Scrollbar overlay fina + arrastar-para-rolar de mouse aplicados
   (`web-translation.md` §8b)? É o item mais esquecido, e a
   scrollbar do Windows denuncia a página inteira.
5. View que esconde um controle também desliga o efeito dele?
6. Sheets fechados `inert`; foco entra e volta; véu `--ios-scrim`?
7. Grabber fecha por toque E por arrasto?
8. Troca de view sem animação?
