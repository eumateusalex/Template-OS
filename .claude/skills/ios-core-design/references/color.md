# Cor — paleta de sistema, semântica e tema

> As tabelas light/dark completas, o papel de cada cor e como o theming
> resolve sozinho. A paleta não mudou no Liquid Glass — o que mudou foi o
> que fica POR CIMA dela (o vidro: `materials.md`). Medidas e elevação:
> `foundations.md`. Limiares de contraste e quando a cor falha como sinal:
> `accessibility.md`.

**Regra que não se quebra: cor só via `var(--ios-*)`.** Hex direto em
componente é bug mesmo sendo o hex certo — é a var que faz light/dark
trocarem sozinhos e que permite retematizar depois.

---

## 1 · Acentos de sistema

| Token | Light | Dark | Semântica |
|---|---|---|---|
| `--ios-blue` | `#007AFF` | `#0A84FF` | **A cor interativa.** Link, botão de ação, item selecionado, tint padrão |
| `--ios-green` | `#34C759` | `#30D158` | Sucesso, confirmação, switch ligado |
| `--ios-indigo` | `#5856D6` | `#5E5CE6` | Acento alternativo (categorias, avatares) |
| `--ios-orange` | `#FF9500` | `#FF9F0A` | Atenção, aviso não destrutivo |
| `--ios-pink` | `#FF2D55` | `#FF375F` | Acento alternativo quente |
| `--ios-purple` | `#AF52DE` | `#BF5AF2` | Acento alternativo |
| `--ios-red` | `#FF3B30` | `#FF453A` | **Destrutivo e erro.** Apagar, remover, badge de notificação, validação que falhou |
| `--ios-teal` | `#5AC8FA` | `#64D2FF` | Acento alternativo frio |
| `--ios-yellow` | `#FFCC00` | `#FFD60A` | Destaque, favorito, avaliação |

Regras de uso:

- **Azul é o interativo por padrão.** Se algo é tocável e não é destrutivo,
  é azul. Não pintar botão comum de verde/roxo "pra variar" — variedade de
  acento é pra categorizar conteúdo, não pra decorar controle.
- **Vermelho é reservado.** Só destrutivo e erro. Vermelho decorativo
  desensibiliza o usuário pro vermelho que importa.
- Acento nunca é o único sinal (daltonismo) — sempre acompanha texto, ícone
  ou posição. Detalhe em `accessibility.md`.
- **Sobre vidro, tint só em ação primária.** O vidro pode ser tingido com o
  acento apenas no controle que é A ação da tela; vidro colorido decorativo
  não existe (`materials.md` §5).

**Lavagens de acento — tokens oficiais.** Quando o produto
precisa de chips/realces por estado (atrasado, potencial, sucesso), usar
**`--ios-tint-red` / `--ios-tint-orange` / `--ios-tint-green`** — já vivem
no `tokens.css` §1, ao lado do `--ios-blue-tint`. A receita por trás (não
recriar em projeto — consumir o token): 15% do acento via `color-mix`, com
fallback `--ios-fill-secondary` pra quem não tem `color-mix` — degradação
registrada: o chip fica cinza e só o texto carrega a cor.

O par texto/fundo é sempre acento sobre a própria lavagem (`--ios-red`
sobre `--ios-tint-red`). Isso resolve light e dark de graça, porque o
`color-mix` lê o acento na hora do uso e o acento troca de valor por tema —
os tints não têm (nem precisam de) bloco dark.

## 2 · Cinzas de sistema

| Token | Light | Dark | Uso típico |
|---|---|---|---|
| `--ios-gray` | `#8E8E93` | `#8E8E93` | Texto/ícone desabilitado ou neutro (o único igual nos dois temas) |
| `--ios-gray2` | `#AEAEB2` | `#636366` | Chevron de célula, ícone secundário |
| `--ios-gray3` | `#C7C7CC` | `#48484A` | Borda de controle, grabber de sheet |
| `--ios-gray4` | `#D1D1D6` | `#3A3A3C` | Track de controle desligado |
| `--ios-gray5` | `#E5E5EA` | `#2C2C2E` | Fundo de controle neutro (botão gray) |
| `--ios-gray6` | `#F2F2F7` | `#1C1C1E` | O cinza de fundo (coincide com bg-secondary) |

A escala **clareia no light e escurece no dark em direções opostas** — por
isso nunca se usa "um cinza qualquer": o par certo mantém o mesmo contraste
relativo nos dois temas.

## 3 · Fundos — plano vs. agrupado

Dois sistemas de fundo, e a tela usa **um ou outro**, nunca os dois:

| Token | Light | Dark | Papel |
|---|---|---|---|
| `--ios-bg` | `#FFFFFF` | `#000000` | Tela plana: fundo do conteúdo |
| `--ios-bg-secondary` | `#F2F2F7` | `#1C1C1E` | Tela plana: área rebaixada (agrupar cards) |
| `--ios-bg-tertiary` | `#FFFFFF` | `#2C2C2E` | Tela plana: superfície sobre a secundária |
| `--ios-bg-grouped` | `#F2F2F7` | `#000000` | Tela agrupada: o fundo da tela |
| `--ios-bg-grouped-secondary` | `#FFFFFF` | `#1C1C1E` | Tela agrupada: a célula/card por cima |

**Regra prática de escolha:**

- A tela é **conteúdo corrido** (leitura, feed, formulário simples)? →
  sistema plano: fundo `--ios-bg`, áreas rebaixadas em `--ios-bg-secondary`.
- A tela é **lista de grupos estilo Ajustes** (inset grouped list)? →
  sistema agrupado: fundo `--ios-bg-grouped`, células em
  `--ios-bg-grouped-secondary`.

No light os dois sistemas coincidem visualmente (cinza F2F2F7 + branco);
**no dark eles divergem** (tela agrupada é preta com células grafite). Usar
o sistema errado só aparece como bug no dark — por isso a regra se decide
pelo TIPO de tela, não pelo que "parece igual" no light.

## 4 · Labels — 4 níveis de texto

| Token | Light | Dark | Uso |
|---|---|---|---|
| `--ios-label` | `rgba(0,0,0,1)` | `rgba(255,255,255,1)` | Texto principal |
| `--ios-label-secondary` | `rgba(0,0,0,0.6)` | `rgba(235,235,245,0.6)` | Subtítulo, descrição, valor de célula |
| `--ios-label-tertiary` | `rgba(0,0,0,0.3)` | `rgba(235,235,245,0.3)` | Placeholder, texto desabilitado |
| `--ios-label-quaternary` | `rgba(0,0,0,0.18)` | `rgba(235,235,245,0.16)` | Marca d'água, separador textual |

- Hierarquia de texto se faz **descendo de nível**, não escolhendo cinza
  avulso da escala do §2.
- Quaternary no dark é **16%**, não 18% — é o valor oficial da Apple e a
  assimetria é proposital (transparência pesa diferente sobre preto).
- Nota de fidelidade registrada: no light, o briefing deste sistema fixa a
  base dos níveis 2–4 em preto puro (`#000` @ 60/30/18) — o UIKit usa
  `#3C3C43` como base, um traço mais azulado. A diferença é sutil;
  **o briefing manda**. No dark os valores são os oficiais (`#EBEBF5`).
- Texto sobre cor cheia (botão filled, badge): branco fixo, não label —
  ver `components/button.md`.

## 5 · Separadores

| Token | Light | Dark | Quando |
|---|---|---|---|
| `--ios-separator` | `rgba(60,60,67,0.36)` | `rgba(84,84,88,0.65)` | O padrão: linha de 1px entre células, borda de barra |
| `--ios-separator-opaque` | `#C6C6C8` | `#38383A` | Quando não pode haver transparência (linha sobre imagem, borda que empilha) |

O separador padrão é translúcido de propósito: ele deixa o fundo respirar.
O opaco existe pros casos em que dois separadores se sobrepõem ou a linha
cruza conteúdo — aí a transparência somaria e escureceria.

## 6 · Fills — preenchimento de controle

| Token | Light | Dark | Uso típico |
|---|---|---|---|
| `--ios-fill` | `rgba(120,120,128,0.20)` | `rgba(120,120,128,0.36)` | Track de switch desligado, botão de fechar circular |
| `--ios-fill-secondary` | `rgba(120,120,128,0.16)` | `rgba(120,120,128,0.32)` | Fundo do segmented control |
| `--ios-fill-tertiary` | `rgba(120,120,128,0.12)` | `rgba(120,120,128,0.24)` | Campo de busca, input preenchido |
| `--ios-fill-quaternary` | `rgba(120,120,128,0.08)` | `rgba(120,120,128,0.18)` | Fundo de área sutil |

Fills são translúcidos **de propósito** (funcionam sobre qualquer fundo do
§3) e têm par dark oficial. É o que se usa DENTRO de controle — não é fundo
de tela nem cor de texto.

## 6b · Véus de overlay

| Token | Light | Dark | Quando |
|---|---|---|---|
| `--ios-scrim` | `rgba(0,0,0,0.4)` | `rgba(0,0,0,0.6)` | O véu padrão atrás de sheet e alerta |
| `--ios-scrim-menu` | `rgba(0,0,0,0.1)` | `rgba(0,0,0,0.25)` | O véu leve do context menu |

O véu é **cor, nunca blur de tela inteira** (`web-translation.md` §8). No
dark ele sobe porque preto a 40% sobre fundo agrupado preto não separa nada.
O corpo do vidro (`--ios-glass-*`) também mora nos blocos de tema, mas quem
explica os ingredientes é a tabela única de `materials.md` §4 — aqui só o
lembrete de que eles trocam com o tema como qualquer cor.

## 7 · Como o tema funciona

O `tokens.css` resolve o dark de dois jeitos, com os mesmos valores:

1. **Automático:** `@media (prefers-color-scheme: dark)` segue o sistema
   operacional do usuário (só não aplica se houver `data-theme="light"`).
2. **Manual:** `data-theme="dark"` ou `data-theme="light"` em qualquer
   elemento — no `<html>` pra página inteira, ou num container pra forçar um
   painel (é assim que o PREVIEW mostra os dois temas lado a lado).

Consequência pro componente: **não existe código de dark mode.** Nenhum
`dark:` do Tailwind, nenhum `if (theme)`. O componente usa a var; a var
troca. Se um componente "precisar" de `dark:`, o desenho está errado —
falta token.

**`color-scheme` é o que doma o NAVEGADOR**: scrollbar, caret, autofill, moldura do dropdown do `<select>`
e os controles de formulário nativos seguem o `color-scheme` do elemento,
não as vars. O tokens.css já declara `light` no bloco claro e `dark` nos
dois gatilhos escuros — **qualquer tema manual novo (outro atributo, outra
classe) precisa declarar o seu**, senão o tema forçado escuro convive com
chrome claro do sistema. É a primeira coisa a conferir quando "o dark ficou
com pedaços claros que o CSS não explica".

**Exceções de host:**

1. `<option>` de `<select>` nativo: o `color-scheme` cuida da moldura, mas a
   COR das opções não herda as vars — com o tema escuro forçado via
   `data-theme`, o dropdown abre claro. O fix
   (`select option{background:var(--ios-bg-grouped-secondary);color:var(--ios-label)}`)
   **mora no tokens.css §4** — não copiar em componente; se o
   projeto não usa o tokens.css inteiro, aí sim colar a regra.
2. Véu de overlay: usar `var(--ios-scrim)` (40% claro / 60% escuro), nunca
   `rgba(0,0,0,.4)` cru — preto a 40% sobre o fundo agrupado dark (#000)
   não separa nada.
3. Checkbox/radio/range **sem** `appearance:none` (os que a skill não
   redesenha): `accent-color:var(--ios-blue)` no body (tokens.css §4) os
   pinta com o azul do sistema nos dois temas.

**Lavagens de estado são tokens**: `--ios-tint-red/orange/green`
(15% do acento via `color-mix`, fallback cinza registrado) ao lado do
`--ios-blue-tint`. Chip de estado = tint no fundo + acento cheio no texto —
e como o `color-mix` resolve o acento na hora do uso, o dark troca sozinho,
sem bloco extra.

## 8 · Erros comuns

| Errado | Certo |
|---|---|
| `#007AFF` escrito no componente | `var(--ios-blue)` / `bg-ios-blue` |
| `dark:bg-black` no Tailwind | `bg-ios-bg` (a var resolve o tema) |
| Cinza da escala (§2) como cor de texto | Label do nível certo (§4) |
| `--ios-bg` de fundo numa tela de lista agrupada | `--ios-bg-grouped` + células `--ios-bg-grouped-secondary` |
| Opacidade na mão pra "clarear" texto (`opacity: .5`) | Descer um nível de label |
| Verde/roxo em botão comum "pra diferenciar" | Azul (interativo padrão); acento é categoria, não decoração |
| Vermelho em destaque não destrutivo | Orange (atenção) ou blue (ação) |
