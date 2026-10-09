# Disclosure Group · `DisclosureGroup.tsx`

> Equivalente nativo: SwiftUI `DisclosureGroup` / a célula expansível dos
> Ajustes.

## Anatomia

- Cabeçalho: linha de 44px (`--ios-h-row`) com título em Body e chevron
  `CaretRight` em `--ios-gray2` à direita, que **rotaciona 90°** quando
  aberto (transição padrão 0.3s).
- Conteúdo: revelado abaixo, com a única animação de layout tolerada do
  sistema (`grid-template-rows 0fr→1fr` — exceção documentada em
  `motion.md` §3).
- Sem fundo, raio ou sombra próprios: herda a superfície onde está
  (célula de lista, card de 16px) — é CONTEÚDO, nunca ganha `.ios-glass`
  (regra 8), e sombra fora de vidro/overlay é proibida (regra 5).

## Quando usar

- Detalhe opcional que pouparia rolagem: "Opções avançadas", FAQ,
  descrição longa recolhida.

## Quando NÃO usar

- Navegar pra outra tela → célula com chevron (que NÃO rotaciona)
- Esconder a ação principal da tela → conteúdo essencial não se recolhe
- Vários painéis onde só um abre por vez (acordeão exclusivo) → composição
  própria; o DisclosureGroup é independente

## Estados

| Estado | O que muda |
|---|---|
| fechado | Chevron a 0°, conteúdo oculto |
| aberto | Chevron a 90°, conteúdo revelado |
| pressed (cabeçalho) | Fundo `--ios-gray5` (padrão de célula) |
| disabled | `opacity: 0.4` |

## Conteúdo e texto

Título curto que nomeia o QUE será revelado ("Opções Avançadas"), sem
"clique para ver".

## Acessibilidade

- Cabeçalho é `<button aria-expanded aria-controls>`; o conteúdo tem `id`
  correspondente.
- Enter/Espaço alternam; o estado vem de `aria-expanded`, não do chevron
  (que é `aria-hidden`).
- Conteúdo fechado fica com `hidden`/inerte de fato — não apenas invisível
  (senão o Tab entra no que não se vê). O `.tsx` cuida com `inert`.

## Erros comuns

- Chevron pra baixo no estado fechado → o iOS fecha pra DIREITA e abre
  girando pra baixo; começar pra baixo é padrão de web.
- Animar `height` na mão em JS → `grid-template-rows` com transition faz
  o mesmo sem medir nada.
- Conteúdo fechado ainda focável → `inert`/`hidden` resolve.
- Embrulhar o grupo em vidro pra "destacar" a revelação → conteúdo eleva
  por cor; vidro é cromo (regra 8).

## Web: limites

- `<details>/<summary>` nativo foi preterido: não anima a abertura e o
  estilo do marker varia por navegador. A versão button+grid dá o
  controle todo mantendo a semântica via ARIA.
