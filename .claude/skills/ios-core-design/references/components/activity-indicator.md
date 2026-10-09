# Activity Indicator · `ActivityIndicator.tsx`

> Equivalente nativo: `UIActivityIndicatorView` — o "spinner de raios".

## Anatomia

- 8 raios em roda, opacidades decrescentes (1 → 0.125), girando em
  **passos discretos** (`steps(8)`) — o tique característico do iOS,
  nunca rotação `linear` contínua.
- Cor `--ios-label-tertiary` (o cinza discreto do nativo);
  `currentColor` por dentro, então herda se precisar.
- Tamanhos: **sm** 20px (medium nativo) · **lg** 36px (o large nativo é
  37 — arredondado à grade).
- Duração 0.8s/volta, steps(8) — calibrado no PREVIEW.

## Quando usar

- Espera **indeterminada** curta: carregando conteúdo, enviando algo sem
  progresso mensurável. É a divisão do iOS: indeterminado = spinner,
  determinado = `ProgressBar`.

## Quando NÃO usar

- Progresso mensurável (% download) → `ProgressBar`
- Espera longa previsível → mostrar conteúdo esqueleto ou a % real
- Decorar botão que respondeu rápido (<300ms) → nada; piscar spinner é
  pior que nenhum

## Estados

Um só — girando. Spinner parado não existe: sumiu a espera, some o
spinner.

## Conteúdo e texto

Opcionalmente uma linha de contexto abaixo (Footnote
`--ios-label-secondary`): "Carregando conversas" — sem reticências
dramáticas (`writing.md` §3 par 16).

## Acessibilidade

- Container `role="status"` + `aria-label` ("Carregando") — o SVG é
  `aria-hidden`.
- `role="status"` anuncia educadamente; não usar `alert` pra loading.
- O kill-switch de `prefers-reduced-motion` congela o giro; o
  `role="status"` continua comunicando a espera.

## Erros comuns

- Rotação suave `linear` → `steps(8, end)`; a suave é genérica de web.
- Spinner de borda (`border-top` girando) → é o spinner do Bootstrap,
  não o de raios.
- Spinner gigante centralizado pra tudo → sm inline perto do que carrega.
- Deixar girando pra sempre em erro → erro troca o spinner por mensagem
  com saída.

## Web: limites

- Nenhum estrutural. SVG + animação CSS cobrem 1:1.
