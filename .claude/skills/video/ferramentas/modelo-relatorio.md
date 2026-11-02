# Relatório · <estilo> · <tema> · <AAAA-MM-DD>

O modelo do `RELATORIO.md` de toda entrega de vídeo. As seções vêm sempre nesta
ordem, para ler qualquer relatório do mesmo jeito. O `registro.json` da mesma pasta
guarda os números em campos fixos e alimenta o índice (`indice-videos.mjs`, ao lado).
Seção que não se aplica fica com "não se aplica" e o motivo, nunca apagada.

## 1 · O pedido

> <o pedido nas palavras do usuário>

## 2 · O que saiu

| Campo | Valor |
|---|---|
| estilo | <código do `estilos.md` da /video> |
| destino e formato | <destino> · <a chave do `formatos.json`> |
| duração | <s> s (<quadros> quadros a 30 qps) |
| legenda | <L0 a L3, LF> · ficha <nome> |
| arquivos | `final.mp4`, `capa.png`, `LEGENDA.md`, `registro.json` |

## 3 · As réguas

| Régua | Resultado | O número |
|---|---|---|
| `plano.mjs conferir` | verde / reprova / não se aplica | <o que mediu> |
| `regua-direcao.mjs zona` | | |
| `regua-direcao.mjs tela` | | |
| `regua-direcao.mjs parado` | | <o maior trecho parado, o fim parado> |
| `regua-direcao.mjs transicoes` | | |
| `regua-direcao.mjs curvas` | | |
| `regua-direcao.mjs recusados` | | |
| `regua-direcao.mjs oficio` | | |
| `check` do HyperFrames | | |
| `medir_audio.py conferir` | | <LUFS integrado>, <dBTP>, <silêncio no fim> |
| `medir_audio.py acerto` | | <o maior desvio, em quadros> |
| `medir_audio.py tom` e `nota` | | <o tom da faixa; os sons fora do tom> |
| `medir_audio.py drop` | | <o contraste, em dB> |
| `regua-voz.mjs` | | <com voz> |
| determinismo | | <PSNR> dB |

Régua que não mediu reprova: não medir não é passar.

## 4 · O crítico

| Rodada | Notas | Veredito | O que mudou |
|---|---|---|---|
| 1 | | | |

## 5 · O que eu decidi

| Decisão | Confiança | Se eu errar |
|---|---|---|

## 6 · O que é do usuário decidir

Cada pergunta com um id (`E1`, `E2`...), o que ela decide, de 2 a 4 opções com a
recomendada primeiro e o porquê. Vazio se nada.

## 7 · Pendências

<o que não deu para medir ou ver, com o comando que falhou>
