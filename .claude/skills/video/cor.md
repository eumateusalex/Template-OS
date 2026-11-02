# A cor do material real

Vale para o que entra filmado ou fotografado: a gravação do usuário, a foto, o plano de banco, o vídeo
gerado. O que é desenhado em código já nasce na cor da marca do workspace e não passa por aqui.

**Correção e gradação são coisas diferentes, e nessa ordem.** A correção deixa cada tomada certa e
igual às vizinhas: exposição, balanço de branco, contraste, a pele com a cor de pele. A gradação dá o
look, e quem escolhe o look é a linguagem da peça (`linguagens.md`), não o gosto do dia. Saturação a
mais não substitui direção de arte, e o "cinematográfico" escuro não serve a toda peça.

## 1 · No motor

O HyperFrames (a versão do `hyperframes.md`) trata a cor no próprio elemento: o
`data-color-grading` no `<video>` ou na `<img>`, com presets, LUT, exposição e intensidade, aplicado
pelo comando e conferido no render como o resto da peça. O `--grading` recebe o JSON em linha, não o
caminho de um arquivo (o caminho dá "Could not parse --grading JSON", medido na 0.8.207); no Windows ele vai pelo Bash, entre aspas simples, porque o PowerShell come as aspas:

```bash
npx --yes hyperframes@<versão> media-use resolve --type grade --intent "warm daylight" --project . --json
npx --yes hyperframes@<versão> media-treatment --project . --file index.html --selector '#tomada-3' --grading '{"intensity":1,"adjust":{"temperature":-0.03}}' --dry-run --json
npx --yes hyperframes@<versão> media-treatment --project . --file index.html --selector '#tomada-3' --grading '{"intensity":1,"adjust":{"temperature":-0.03}}' --apply --json
```

No Reel falado, a montagem faz isso sozinha pela `cor` da `peca.json` (`scripts/reel-falado/cor.mjs`):
a correção medida da gravação e a gradação da linguagem, no `<video id="camera">`. A gradação entra
sozinha na peça nova (com a `cor` medida) quando o usuário já aprovou o look da linguagem
(`gradacao_aprovada` no `linguagens.json`); sem a aprovação, só com `"gradacao": true`. O
`"gradacao": false` desliga, e a peça antiga, sem `cor`, montada de novo, não muda de cor. O `adjust`
do look (a temperatura) soma com a correção de cada gravação.

O motor separa as duas coisas do mesmo jeito: a família `correction` (exposição, contraste,
temperatura, a cor que puxa) é a correção, a `grading` é o look
(`media-treatment --capabilities --json` lista as famílias e as faixas, conferido na 0.8.207).
O guia completo (os controles, as faixas, a ordem de processamento, o `grade-compare` para ver uma
LUT renderizada) é o `references/grading.md` da skill `media-use` do plugin HyperFrames. Nunca abrir
um `.cube` no contexto: são dezenas de milhares de números sem sinal legível.

## 2 · Por linguagem

| Linguagem | A correção | A gradação |
|---|---|---|
| `falado-com-motion` | a pele igual em todas as tomadas; o branco da parede como referência | **o look sugerido é o "quente inteiro"**: as três rodas no quente (sombra a 30°, meio a 35°, luz a 40°) e a temperatura do look somada à correção (os números no `gradacao` da linguagem, no `linguagens.json`). A alternativa é o frio contido (sombra fria, luz quente). Ele entra só depois que o usuário vê o antes e depois na própria gravação e aprova (`gradacao_aprovada`). A cor do destaque do texto pode sair do cenário |
| documental e narrativa | as tomadas de bancos diferentes igualadas antes de qualquer look | natural, uma LUT leve no máximo, a mesma em todas; nada de teal e laranja sem motivo |
| `interface-de-marca`, `spec-ad-locucao`, `promo-denso` | a foto ou o plano de banco no tom da cena | a cor do mundo fica viva (`comum.mundo.cor-do-mundo-viva`, em `.claude/skills/mograph/manual/comum/mundo.md`) |

## 3 · Conferir

- **Consistência entre tomadas**: `medir_ritmo.py <mp4> --tomadas <cortes.json> --linguagem <id>` dá a
  luminância e a saturação de cada tomada e avisa a vizinha que salta acima do `cor_entre_tomadas` da
  linguagem (o `linguagens.json` diz de onde veio cada número). No `documental`, 0,27 de luminância e
  0,32 de saturação, o p90 das referências: ali o salto grande é troca de cena, e a régua acha a tomada
  fora do grupo. No `falado-com-motion`, 0,05 e 0,05: a mesma pessoa na mesma sala salta pouco (0,022
  e 0,029 numa gravação medida), e a tomada que passa disso pegou outra luz. As duas são provisórias.
- **Antes e depois lado a lado**: a folha de quadros da tomada crua ao lado da tratada, olhada em
  360 px de largura; a pele e o branco conferidos no olho, porque a máquina não sabe o que é pele.
- **As recusas do usuário valem aqui**: as recusas visuais do `marca.md` da marca e a foto
  dessaturada para casar com a marca (`comum.mundo.cor-do-mundo-viva`) reprovam no olho do
  crítico.
