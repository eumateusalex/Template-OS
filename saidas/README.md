# saidas/ — o trabalho em andamento

Uma pasta por trabalho que não é peça de marketing: a entrega que ainda não foi
entregue (o relatório, a copy, o vídeo renderizado, o documento que vai ser
enviado, impresso ou anexado) e o estudo que ainda não fechou. Fechado, o
trabalho sai daqui pela regra "Estudo só fecha quando vira peça" do `CLAUDE.md`.

## Como se nomeia

`saidas/<tipo>-<assunto>-<data>/`, e a skill dona diz o nome exato (por exemplo,
a `/copy` grava em `saidas/copy-<peça>-<data>/`). Se uma skill perguntar onde salvar, ela sugere
esta pasta.

Mídia que é saída (vídeo, render, PDF exportado) fica fora do Git: o `.gitignore`
da raiz já cuida das extensões comuns. O texto que explica a entrega (o
`.md` ao lado) versiona.

## Por que separar de `marketing/`?

`marketing/` é o histórico vivo do trabalho de marketing: peças, campanhas, SEO
acumulado. `saidas/` reúne entregas pontuais: o relatório enviado ao cliente, o
estudo que fundamentou uma decisão.
