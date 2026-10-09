# Progress Bar · `ProgressBar.tsx`

> Equivalente nativo: `UIProgressView` / SwiftUI `ProgressView(value:)`.

## Anatomia

- Track: **4px** de altura, raio pílula, `--ios-fill`.
- Preenchimento: `--ios-blue`, avançando por `transform: scaleX`
  (origem à esquerda) com a transição padrão — nunca animando `width`
  (`motion.md` §3).
- Opcional: rótulo em Footnote acima e % em Footnote
  `--ios-label-secondary` à direita.

## Quando usar

- Progresso **mensurável**: download, upload, etapa X de Y, envio em
  andamento com fração conhecida.

## Quando NÃO usar

- Espera sem medida → `ActivityIndicator` (a divisão do iOS)
- Avaliação/quantidade estática ("80% de bateria" decorativo) → texto
  ou gauge próprio; progress é PROCESSO em andamento
- Passos discretos de um fluxo longo → indicador de etapas é padrão
  próprio (fora desta versão)

## Estados

| Estado | O que muda |
|---|---|
| avançando | `scaleX` cresce com transição padrão |
| completo | Barra cheia — remover/trocar por confirmação logo em seguida |
| indeterminado | NÃO existe aqui: use o spinner |

## Conteúdo e texto

Rótulo diz O QUE progride ("Enviando vídeo"); a % é opcional e
arredondada (sem "73,4%").

## Acessibilidade

- `role="progressbar"` + `aria-valuenow/min/max` + `aria-label`.
- Mudanças grandes podem ser anunciadas pelo texto de % (se visível,
  já serve); não fazer `aria-live` na barra inteira (spam de leitor).

## Erros comuns

- Barra que anda sozinha sem dado real ("fake progress") → mente duas
  vezes: no ritmo e no fim.
- Animar `width` → `scaleX` com `transform-origin: left`.
- Track grosso com listras/gradiente → 4px chapado.
- Voltar pra trás no meio → progresso não regride; recalculou, recomeça
  com contexto.

## Web: limites

- O `<progress>` nativo foi preterido: estilizar cross-browser é pior
  que um `role="progressbar"` com dois divs — semântica preservada via
  ARIA.
