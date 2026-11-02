# reel-falado

Os motores do Reel falado: a gravação bruta de quem fala para a câmera, com as repetições, vira o Reel cortado, legendado
e mixado. Quem conduz é a `/cortes` (o modo gravação, `.claude/skills/cortes/gravacao.md`); com motion
por cima, a `/mograph` monta as cenas por cima deste resultado (`ferramentas/montar-falado.mjs`).
Tudo roda da raiz do workspace, com a pasta da peça como argumento.

## A ordem

| Passo | Comando | Entra | Sai |
|---|---|---|---|
| 1 · as tomadas | `python scripts/reel-falado/tomadas.py sugerir <palavras.json>`, depois `conferir <palavras.json> <tomadas.json>` | a transcrição (`scripts/transcrever.py`) | a escolha de cada frase em `tomadas.json` (a última tomada, ou a troca com a razão) |
| 2 · o corte da fala | `python scripts/reel-falado/fala.py <fonte> <palavras.json> <tomadas.json> --saida <pasta> [--audio <microfone.wav>] [--respiro 0.8]` | a gravação e a escolha | `camera.mp4` (em pé, 30 qps), `voz.wav` (−14 LUFS, pico até −1 dBTP) e `cortes.json` |
| 3 · a legenda e a página | `node scripts/reel-falado/montar.mjs <pasta> [--conferir] [--ficha <nome>]` | `cortes.json`, `legenda.json`, `peca.json` e a ficha | `dados.js`, o `index.html` do modelo da `/cortes` e o `RELATORIO.md` da montagem |
| 4 · o som | `python scripts/reel-falado/som.py <pasta> [--sem-musica]` | `cortes.json`, `voz.wav` e `som.json` | as quatro faixas em `stems/`, o `master.wav`, o `master-sem-trilha.wav` e o `relatorio-audio.json` |

Com motion por cima, o passo 3 é o `montar-falado.mjs` da `/mograph`, que roda o `montar.mjs` antes
e põe as cenas: o `montar.mjs` sozinho, depois dele, regrava a página sem as cenas. O render e a
conferência são os da `/video` (`.claude/skills/video/hyperframes.md`).

## O que cada arquivo da peça pede

- **`tomadas.json`**: `{"frases": [{"grupo": [0, 1], "escolhida": 1}], "descartados": [2]}`. Todo
  segmento mora num grupo ou nos descartados; a escolhida fora da última leva a razão em `troca`. A
  frase pode pedir a pausa dramática: `"pausa_depois": 0.6` (até 2 s, no silêncio real que vem depois
  dela; encurta e avisa se a próxima fala da gravação chega antes).
- **`legenda.json`**: `{correcoes, frases}` (as duas vozes, cada frase com no máximo uma `[chave]`) ou
  `{correcoes, blocos}`; as correções trocam palavras da transcrição.
- **`peca.json`**: `{ficha, gancho, capa, capa_quadro, punch, troca_min, fatos, rosto, destino, linguagem, cor}`; a
  `cor` (`{correcao, gradacao}`) é a da câmera, pelo `cor.mjs`: a correção (a família `correction` do
  HyperFrames, medida pelo `media-treatment --analyze`) e a gradação (`true` traz a da `linguagem`, que sem
  ela é `falado-com-motion` e no falado com motion é a do `plano.json`; as rodas escritas trazem as da
  peça; `false` diz que não há look) viram o `data-color-grading` do `<video id="camera">`; sem a
  correção ou sem a decisão do look, a montagem avisa, porque o look é escolha do usuário. O
  `rosto` (cabelo e queixo, em px de 1920, já com o punch) diz onde a legenda cabe. O `excecoes`
  (`[{regra, motivo}]`) cala o que a montagem só avisa: hoje, `destaques-seguidos`; exceção para outra
  regra, ou sem o motivo, reprova.
- **`som.json`**: `{musica: {arquivo, batida, cai: [{de, ate, rampa}]}, efeitos: [{arquivo, acerto, db,
  reverb}], riser, reverb_voz: [{de, ate, mix, cauda}]}`. O efeito se posiciona pelo pico, `db` abaixo
  do pico da voz; o `cai` tira a trilha num trecho e a devolve no mesmo ponto (a `rampa` amacia a
  volta); o `reverb` e o `reverb_voz` somam uma sala sintética e fixa (a voz é seca por padrão).

Os números de cada motor (a folga do corte, o silêncio que vira 120 ms, o respiro, o nível de cada
efeito) estão no cabeçalho dele, com a medida de onde saíram.

## As suítes

```bash
node --test scripts/reel-falado/teste-tomadas.mjs scripts/reel-falado/teste-fala.mjs scripts/reel-falado/teste-legenda.mjs scripts/reel-falado/teste-montar.mjs scripts/reel-falado/teste-modelo.mjs scripts/reel-falado/teste-som.mjs scripts/reel-falado/teste-cor.mjs
```

Cada uma gera a gravação, a transcrição e o som sintéticos que precisa (o `fixtures/` guarda uma
transcrição sintética no formato do `scripts/transcrever.py --json`).
