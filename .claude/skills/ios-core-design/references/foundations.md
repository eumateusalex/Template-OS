# Fundações — o Liquid Glass

> O que faz uma interface parecer iOS antes de qualquer componente existir.
> Este arquivo trata de filosofia, grade, medidas, raios, toque e elevação.
> O vidro em si (anatomia, valores, regras): `materials.md`. Cores e tabelas
> de tema: `color.md`. Escala de texto: `typography.md`. Curvas de movimento:
> `motion.md`. Técnica web: `web-translation.md`.

---

## 1 · Que linguagem é essa

Esta skill trava a estética do **Liquid Glass** — o redesign que a Apple
lançou no iOS 26 (2025) e refinou no iOS 27 (2026). Na prática:

- **O conteúdo é sólido; o cromo é vidro.** Texto, listas, cards de
  informação e mídia continuam em superfície opaca, elevando por cor. O que
  flutua por cima — nav bar, tab bar, toolbar, sheet, alerta, popover, menu —
  é vidro: fundo atravessando borrado e saturado, borda de luz, sombra de
  flutuação. A divisão inteira está em `materials.md` §1.
- **Dois vidros, nunca misturados.** Regular é o padrão; Clear só sobre
  mídia, sempre com dimming (`materials.md` §2).
- **O cromo flutua.** Barra não encosta mais na borda da tela: a tab bar é
  uma cápsula com margem própria (`--ios-bar-inset`), a toolbar agrupa os
  botões em ilhas de vidro. O conteúdo passa POR BAIXO — é isso que faz o
  vidro existir.

Os três princípios do HIG que continuam valendo aqui:

1. **Clareza.** O texto é legível em qualquer tamanho, os ícones são precisos,
   os adornos são discretos e a funcionalidade motiva o design. O vidro nunca
   compra beleza ao preço de legibilidade — quando o fundo compromete o
   texto, o material engrossa (é o que o iOS 27 fez no sistema inteiro).
2. **Deferência.** A interface serve o conteúdo, não compete com ele. O vidro
   é a forma extrema disso: o cromo literalmente deixa o conteúdo atravessar.
3. **Profundidade.** Camadas e transições comunicam hierarquia. Uma sheet
   sobe POR CIMA da tela; um popover flutua ancorado em quem o abriu; e a
   sombra de flutuação + o fundo borrado dizem "isto está acima daquilo"
   sem precisar de véu pesado.

**Teste rápido de fidelidade:** se um elemento de CONTEÚDO precisa de sombra
pra parecer elevado, a hierarquia de cor está errada — conserta a cor. Se um
elemento de CROMO está chapado e sem vidro, ele não está na linguagem —
aplica `.ios-glass`.

---

## 2 · A grade de 8pt

Todo espaçamento do sistema é múltiplo de **8px**. O meio-passo de **4px**
existe só para ajuste óptico fino (ex.: espaço entre ícone e texto), nunca
como unidade principal.

| Token | Valor | Uso |
|---|---|---|
| `--ios-margin` | 16px | Margem lateral de layout no mobile |
| `--ios-margin-wide` | 20px | Margem lateral a partir de 768px |
| `--ios-section-gap` | 32px | Espaço vertical entre seções |
| `--ios-card-padding` | 16px | Padding interno de card |

Regras de aplicação:

- **Margem de layout:** 16px nas laterais em telas pequenas; 20px quando a
  viewport tiver **≥768px**. É a margem que alinha nav bar, listas e conteúdo
  numa mesma coluna invisível.
- **Entre seções, 32px.** Uma "seção" é um grupo com título próprio ou uma
  mudança de assunto. Menos que isso cola assuntos diferentes; mais que isso
  quebra a página em ilhas.
- **Dentro de um grupo, 8px ou 16px.** Elementos irmãos ficam a 8; blocos
  relacionados, a 16.
- Valor fora da grade (10px de gap, 18px de margem…) é violação — arredonda
  pro múltiplo mais próximo e segue.

### Exceções REGISTRADAS da grade

Alguns números fora da grade **são spec do iOS ou calibragem medida num
produto** — a auditoria não os reprova, e ninguém os "arredonda":

| Valor | O quê | Fonte |
|---|---|---|
| 49px | Altura da tab bar (`--ios-h-tabbar`) | spec iOS |
| 50px | Altura do botão primário (`--ios-h-button`) | spec iOS |
| 51×31px (thumb 27, offset 2) | Switch | espelho do UISwitch |
| 30px | Círculo de fechar de sheet (`.x`) | spec iOS (30pt) |
| 36×5px | Grabber de sheet | spec iOS |
| `2px 8px` | Padding de chip/pílula Caption 1 (lh 16 fecha a caixa em 20) | calibragem medida |
| 6px | Padding lateral do badge de contagem (20 de altura) | badge.md |
| 10px | Swatch/ponto de legenda | calibragem medida |
| 2px | Padding do track de segmented; gap de rótulo de tab | calibragem medida |
| 96px | Coluna `dt` de ficha (12×8 é grade, registrado pela largura ótica) | padrão de produto |
| 296px / 430px / 1020px | Coluna de kanban / painel lateral ("um iPhone encostado") / coluna de leitura | padrão de produto |

Fora desta lista, a regra de cima vale sem apelação. Valor novo fora da
grade só entra REGISTRADO aqui, com fonte, como a scrollbar de 8px do
web-translation.

---

## 3 · Raios — por papel, e concêntricos

Cada superfície tem o raio do seu papel. Não existe "raio bonito": existe o
raio da função. **A forma padrão de controle no Liquid Glass é a cápsula.**

| Superfície | Token | Valor |
|---|---|---|
| Botão | `--ios-radius-button` | cápsula (aponta pra pill) |
| Card | `--ios-radius-card` | 16px |
| Input | `--ios-radius-input` | 12px |
| Badge/tag | `--ios-radius-badge` | 8px |
| Alerta | `--ios-radius-alert` | 26px *(tradução web calibrada)* |
| Sheet (só o topo) | `--ios-radius-sheet` | 20px *(tradução web calibrada)* |
| Pílula (barra flutuante, segmented, switch, busca) | `--ios-radius-pill` | 999px |

- **Cantos concêntricos** — a regra nova do sistema: elemento aninhado tem
  `raio interno = raio externo − padding`. Um tile dentro de um card de 16px
  com 8px de padding usa raio 8. Em CSS: `border-radius: calc(var(--ios-radius-card) - 8px)`.
  Canto interno maior que o externo denuncia montagem.
- **Nunca usar raio menor que 8px em superfície tocável** — e a régua de
  concentricidade para em 8 também.
- Sheet arredonda **só os cantos de cima** (`border-radius: 20px 20px 0 0`);
  a base encosta na borda da tela.
- O canto do iOS real é uma superelipse (squircle), que o CSS não desenha —
  a limitação e o que (não) fazer sobre isso estão em `web-translation.md`.

---

## 4 · Alvo de toque — 44×44, sempre

**Nenhum alvo de toque menor que 44×44px** (`--ios-touch-min`). Sem exceção.

- O que conta é a **área clicável**, não o desenho. Um ícone de 22px dentro
  de uma área de 44×44 está certo; o mesmo ícone pelado está errado.
- Padding invisível resolve quase tudo: `min-width/min-height: 44px` no
  elemento interativo, ou área expandida com pseudo-elemento.
- Dois alvos de 44 lado a lado não precisam de vão entre si — o iOS encosta
  células e botões de barra sem folga extra.

---

## 5 · Alturas e geometria de referência

| Elemento | Token | Valor |
|---|---|---|
| Nav bar (compacta) | `--ios-h-navbar` | 44px |
| Nav bar com large title expandido | `--ios-h-navbar-large` | 96px |
| Tab bar (conteúdo da cápsula) | `--ios-h-tabbar` | 49px |
| Margem da barra flutuante | `--ios-bar-inset` | 12px *(tradução web calibrada)* |
| Linha de lista (padrão) | `--ios-h-row` | 44px |
| Linha de lista com subtítulo | `--ios-h-row-large` | 60px |
| Botão primário | `--ios-h-button` | 50px |

- **A tab bar flutua**: é uma cápsula de vidro com `--ios-bar-inset` de
  margem nas laterais e embaixo, somada à **safe area inferior**
  (`--ios-safe-bottom`, que vem de `env(safe-area-inset-bottom)` e exige
  `viewport-fit=cover` — ver `web-translation.md`). A referência de hardware
  da safe area é 34px (iPhone com Face ID).
- No scroll, a tab bar **encolhe** (a cápsula reduz pra caber só o item
  ativo) e volta ao parar — o mecanismo está em `components/tab-bar.md`.
- A nav bar colapsa de 96px para 44px quando o conteúdo rola — ver
  `components/navigation-bar.md`.
- Linha de 44 é a de texto só; entrou subtítulo, vai pra 60. Não existe
  altura intermediária.

---

## 6 · Elevação: cor no conteúdo, vidro no cromo

A política de elevação tem **duas leis, uma por camada**:

- **Conteúdo eleva por cor.** Card de conteúdo é
  `--ios-bg-grouped-secondary` (branco no light) sobre
  `--ios-bg-secondary`/`--ios-bg-grouped`. **Card de conteúdo não tem
  sombra.** Sombra de hover, sombra de foco, sombra "pra dar profundidade"
  em conteúdo — nada disso existe aqui. Quem vem do Material Design vai
  sentir falta; a resposta é sempre a mesma: ajusta a hierarquia de cor.
- **Cromo eleva por vidro.** Barra, sheet, alerta, popover, menu e toast
  flutuam — e quem flutua tem a sombra do material
  (`--ios-glass-shadow`, embutida na classe `.ios-glass`). É a ÚNICA
  sombra do sistema, e ela nunca aparece sozinha: vem sempre colada no
  vidro. Sombra avulsa em superfície sólida continua proibida.

Como as camadas se empilham (light):

```
tela plana:      #FFFFFF (bg)         → conteúdo direto
tela agrupada:   #F2F2F7 (grouped)    → células #FFFFFF por cima
cromo flutuante: vidro (.ios-glass)   → conteúdo atravessa borrado por baixo
overlay:         véu (--ios-scrim)    → painel de vidro por cima
```

O detalhe de qual fundo usar em qual tela está em `color.md` §3; a anatomia
do vidro, em `materials.md` §3.

---

## 7 · Checklist de fundação (antes de desenhar qualquer tela)

1. A margem lateral é 16 (ou 20 em ≥768px)?
2. Todos os espaçamentos são múltiplos de 8 (4 só como ajuste fino)?
3. Todo elemento interativo tem 44×44 de área de toque?
4. Cada raio bate com o papel da superfície (cápsula/16/12/8/26/20) e os
   cantos aninhados são concêntricos?
5. Existe sombra fora de vidro/overlay? (Se sim, remove — conteúdo eleva
   por cor.)
6. O cromo flutuante está de vidro (`.ios-glass`) com conteúdo passando por
   baixo — e nenhum vidro dentro de vidro?
7. As alturas de barra e linha batem com a tabela do §5, com a tab bar
   flutuando com `--ios-bar-inset` + safe area?
