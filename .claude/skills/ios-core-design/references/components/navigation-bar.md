# Navigation Bar · `NavigationBar.tsx`

> Equivalente nativo: `UINavigationBar` com `prefersLargeTitles` — no
> Liquid Glass, a barra de vidro do topo (iOS 26+).

## Anatomia

Duas peças que somam os dois estados (96px expandida, 44px colapsada):

1. **Barra compacta** (44px, `--ios-h-navbar`): sticky no topo, de largura
   total, em vidro Regular (`.ios-glass`) — o conteúdo rola POR BAIXO,
   borrado. A classe traz borda de luz, realce e sombra de flutuação
   (`materials.md` §3), **e a barra leva o hairline de scroll-edge**
   (`border-bottom` separator: a borda de luz é branca
   e some sobre fundo claro; a linha entre barra e conteúdo que a cruza é o
   separator, `app-shell.md` §3). Botão de voltar à esquerda (`CaretLeft` +
   rótulo, azul), ações à direita (plain), e o **título central em
   Headline**, só colapsado.
2. **Large title** (52px, completando 96): `<h1>` em Large Title 34/41,
   no FLUXO da página (rola junto com o conteúdo, como no iOS).

O colapso: um `IntersectionObserver` vigia o large title — saiu da
viewport, a barra mostra o título central; voltou, esconde. **Dois estados
discretos** com a transição padrão — sem tracking 1:1 do dedo
(fora de escopo, `web-translation.md`).

## Quando usar

- Toda tela de app: é a âncora de navegação e o lugar do título.
- Large title na raiz de cada seção; tela de detalhe nasce compacta (`large={false}`).

## Quando NÃO usar

- Landing page editorial sem navegação de app → heading normal
- Barra de AÇÕES da tela → `Toolbar`
- Trocar de seção do app → `TabBar`

## Estados

| Estado | O que muda |
|---|---|
| expandida | Large title visível no fluxo; barra de vidro sem título central |
| colapsada | Título central surge (fade 0.3s) — o vidro em si não muda |
| botão pressed | `opacity: 0.7` (padrão plain) |

## Conteúdo e texto

Título é substantivo curto ("Ajustes", "Cartões" — `writing.md` §3 par
19). Botão de voltar mostra o título da tela ANTERIOR quando couber;
senão só o chevron com `aria-label="Voltar"`.

## Acessibilidade

- `<header>` com `<nav>` pros botões; o large title é o `<h1>` da tela.
- O título central colapsado é `aria-hidden` — o `<h1>` continua no DOM,
  sem duplicar o nome da tela pro leitor.
- Botões laterais ≥44px de alvo; só ícone → `aria-label`.

## Erros comuns

- Título central junto do large → um OU outro (mesmo nome, duas vezes).
- Animar a altura da barra → nada de animar layout; os dois estados são
  discretos (`motion.md` §3).
- Recriar o fallback do blur no componente → a classe `.ios-glass` já
  cuida (@supports + prefers-reduced-transparency, `materials.md` §5).
- Hairline ou sombra AVULSA colada na barra → a sombra certa já vem COM
  o vidro, embutida na classe; fora do vidro, sombra é proibida (regra 5).

## Web: limites

- O nativo interpola o título continuamente com o dedo; aqui é binário com
  fade — decisão registrada. `scroll-timeline` faria a interpolação
  contínua; TODO de revisão quando for baseline.
