# Materiais — o vidro do Liquid Glass

> O coração da linguagem: os dois materiais, a anatomia do vidro na web, a
> tabela única de valores calibrados e as regras que não se quebram.
> Filosofia e medidas: `foundations.md`. Cores por baixo do vidro: `color.md`.
> Como o vidro se move: `motion.md`. O que a web não replica: `web-translation.md`.

---

## 1 · O que é o material (e o que ele não é)

No Liquid Glass (iOS 26, refinado no iOS 27), o cromo da interface — barras,
controles, overlays — é **vidro que flutua sobre o conteúdo**. O conteúdo
continua sólido e opaco; o que é de vidro é a camada de controle por cima.
Essa separação é a regra número um do sistema:

- **Conteúdo** (texto, cards de informação, listas, mídia) → superfície
  sólida, elevação por cor, como sempre foi.
- **Cromo** (nav bar, tab bar, toolbar, sheet, alerta, popover, menu, botão
  flutuante) → vidro.

Vidro em cima de tudo não é "mais Liquid Glass" — é lama. O sistema vive do
contraste entre um conteúdo firme e um cromo de vidro.

## 2 · Os dois materiais — Regular e Clear

| | **Regular** (`.ios-glass`) | **Clear** (`.ios-glass--clear`) |
|---|---|---|
| Papel | O padrão. Barra, controle, card flutuante, overlay | Exceção: cromo sobre **mídia rica** (foto, vídeo, capa) |
| Adapta ao tema | Sim (light/dark trocam o corpo do vidro) | **Não** — e isso é spec, não bug |
| Legibilidade | Garante sozinho (corpo mais denso + saturação) | **Não garante**: exige a camada de dimming por baixo |
| Camada extra | Nenhuma | `.ios-glass-dim` irmã, cobrindo a mídia |

**Nunca misturar os dois na mesma superfície nem na mesma barra.** A escolha
é por contexto: a tela é de conteúdo comum → Regular; o cromo está flutuando
sobre uma foto/vídeo que precisa atravessar → Clear + dimming.

## 3 · Anatomia do vidro na web

A classe `.ios-glass` (tokens.css §5b) monta o material em quatro camadas:

```
┌─ realce especular ─ inset 0 1px 0 var(--ios-glass-glint)   ← a luz "batendo" no topo
│┌─ borda de luz ──── inset 0 0 0 1px var(--ios-glass-stroke) ← lensing: 1px de luz na borda
││  corpo ─────────── background: var(--ios-glass-bg)         ← o vidro em si
││  fundo filtrado ── backdrop-filter: blur() saturate()      ← o conteúdo atravessando
└└─ flutuação ─────── var(--ios-glass-shadow)                 ← a sombra de quem flutua
```

- O **lensing** nativo (a luz dobrando fisicamente na borda) não existe em
  CSS — a borda de luz + o realce especular são a tradução honesta dele.
  O que decidimos NÃO fingir está em `web-translation.md` §9.
- **Vidro interativo**: controle que É vidro (botão glass, thumb) leva também
  `.ios-glass--interactive` — o press acende o corpo (frosted) e a volta
  assenta em bounce (`motion.md` §2).
- A **sombra é assinatura do vidro** (regra 5): só vidro e overlay têm
  sombra. Conteúdo continua elevando por cor. Sombra em card de conteúdo
  segue proibida.
- **Raio acompanha o papel** (foundations.md §3): barra flutuante e controle
  são cápsula; sheet/alerta usam os raios calibrados.

## 4 · A tabela única de valores calibrados

A Apple não publica o vidro em números de CSS. **Tudo abaixo é "tradução web
calibrada"**: derivação nossa, calibrada visualmente no PREVIEW contra o
aparelho, e honesta sobre isso. Quem quiser recalibrar, mexe no token — os
componentes nem sabem o número.

| Token | Light | Dark | O que é |
|---|---|---|---|
| `--ios-glass-bg` | `rgba(255,255,255,0.55)` | `rgba(28,28,30,0.55)` | Corpo do vidro Regular |
| `--ios-glass-bg-frosted` | `rgba(255,255,255,0.80)` | `rgba(28,28,30,0.80)` | Corpo no estado `frosted` do `data-glass` |
| `--ios-glass-stroke` | `rgba(255,255,255,0.35)` | `rgba(255,255,255,0.15)` | Borda de luz 1px (lensing) |
| `--ios-glass-glint` | `rgba(255,255,255,0.60)` | `rgba(255,255,255,0.25)` | Realce especular do topo |
| `--ios-glass-shadow` | `0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)` | `0 4px 20px rgba(0,0,0,0.35), 0 1px 4px rgba(0,0,0,0.25)` | Sombra de flutuação |
| `--ios-glass-solid` | `#FFFFFF` | `#1C1C1E` | Extremo opaco (fallback e `data-glass="solid"`) |
| `--ios-glass-blur` | 20px | (igual) | Difusão — o iOS 27 difunde mais que o 26; este é o knob |
| `--ios-glass-saturate` | 180% | (igual) | Saturação do que atravessa |
| `--ios-glass-clear-bg` | `rgba(255,255,255,0.12)` | (igual — Clear não adapta) | Corpo do vidro Clear |
| `--ios-glass-dim` | `rgba(0,0,0,0.35)` | (igual) | Dimming obrigatório sob o Clear |
| `--ios-bar-inset` | 12px | (igual) | Margem da barra flutuante até a borda |
| `--ios-radius-alert` | 26px | (igual) | Raio do alerta de vidro |
| `--ios-radius-sheet` | 20px | (igual) | Raio do sheet (só topo) |
| `--ios-ease-bounce` | `cubic-bezier(0.34,1.56,0.64,1)` | (igual) | Bounce do vidro interativo |

Derivação, em uma linha cada: corpo a 55% é o ponto em que cor ainda
atravessa mas texto `--ios-label` segura contraste; stroke/glint caem no dark
porque luz sobre escuro precisa de menos; a sombra dark é mais funda porque
sombra sobre preto some; 20px de blur é o que bate com a barra nativa; o Clear a 12% + dimming 35% reproduz o par "mídia
atravessa / rótulo legível".

## 5 · Regras que não se quebram

1. **Vidro não amostra vidro.** Nunca aninhar `.ios-glass` dentro de
   `.ios-glass` — na web, o `backdrop-filter` de dentro amostra o vidro de
   fora e o resultado é lama dupla. Elementos de vidro vizinhos (botões de
   uma toolbar) entram **num único contêiner de vidro**, não um vidro cada.
2. **Clear nunca anda sozinho.** `.ios-glass--clear` sem `.ios-glass-dim`
   por baixo é ilegível sobre mídia clara — os dois são um par.
3. **Tint só em ação primária.** O vidro pode ser tingido com o acento
   (fundo `--ios-blue-tint` sobre o corpo) só no controle que É a ação
   principal da tela. Tint decorativo não existe.
4. **Vidro é cromo.** Card de conteúdo, célula de lista, fundo de tela:
   sólidos. Se a superfície não flutua sobre conteúdo, ela não é de vidro.
5. **Fallback opaco é obrigatório e automático.** Navegador sem
   `backdrop-filter` e usuário com `prefers-reduced-transparency` recebem
   `--ios-glass-solid` — o extremo opaco do slider do iOS 27. Nenhum
   componente precisa fazer nada: a classe resolve.

## 6 · data-glass — o slider de intensidade do iOS 27

O iOS 27 deu ao usuário um slider de transparência do vidro (de clear a
opaco), resposta às falhas de contraste do iOS 26. A tradução web é o
atributo `data-glass`, em qualquer contêiner (normalmente o `<html>`):

| Estado | O que faz | Quando usar |
|---|---|---|
| *(sem atributo)* | Vidro Regular padrão | O default |
| `data-glass="frosted"` | Corpo sobe pra 80% — vidro fosco, mais legível | Preferência do produto/usuário; fundo muito movimentado |
| `data-glass="solid"` | Extremo opaco, sem blur | Toggle manual de acessibilidade; debug |

Funciona por indireção de var (o atributo troca os ingredientes, a classe
não muda), então dá pra expor como preferência do usuário final com uma
linha de JS.

## 7 · Erros comuns

| Errado | Certo |
|---|---|
| `.ios-glass` dentro de `.ios-glass` | Um contêiner de vidro só; o de dentro vira superfície comum |
| Clear sobre tela de conteúdo comum | Clear é só sobre mídia; o resto é Regular |
| Clear sem dimming | Par obrigatório: `.ios-glass--clear` + `.ios-glass-dim` |
| Card de conteúdo com `.ios-glass` | Vidro é cromo; card de conteúdo eleva por cor |
| `backdrop-filter` escrito no componente | A classe `.ios-glass` — o blur mora num lugar só |
| Vidro tingido de verde/roxo por estética | Tint só em ação primária, com o acento semântico |
| Recriar fallback opaco no componente | A classe já resolve (@supports + prefers-reduced-transparency) |
| Sombra em superfície que não é vidro/overlay | Elevação de conteúdo é cor (regra 5) |
