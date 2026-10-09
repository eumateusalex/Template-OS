# Som

Música e efeitos do **Mixkit**: grátis, uso comercial liberado, sem crédito
obrigatório (a informação oficial, https://mixkit.co/llm-info/; confira no dia).
A origem de cada arquivo vai para a tabela de ativos do `roteiro.md`. Os arquivos
da peça ficam em `ativos/`, em WAV, fora do git, e o `ativos.sh` da peça os refaz
(modelo em `ferramentas/modelo-ativos.sh`).

## Achar

- Música: `https://mixkit.co/free-stock-music/tag/<tag>/`. O endereço de cada
  faixa está na página (`https://assets.mixkit.co/music/<id>/<id>.mp3`), junto com
  nome e autor no JSON da página.
- Efeito: `https://mixkit.co/free-sound-effects/<tag>/` (click, pop, whoosh,
  notification). O arquivo é `https://assets.mixkit.co/active_storage/sfx/<id>/<id>-preview.mp3`.
- Converter para WAV (o MP3 carrega atraso de codificador no começo).

## Medir

```bash
python .claude/skills/video/ferramentas/medir_audio.py musica <arquivo>   # BPM, primeira batida, drops, LUFS
python .claude/skills/video/ferramentas/medir_audio.py efeito <arq>...    # o pico de cada efeito
```

O `drops_s` traz as três maiores subidas do grave, a 4 s ou mais uma da outra, e
ignora os 2 primeiros segundos (a entrada de uma faixa que nasce do silêncio
parece drop). Escolha o drop que serve à peça, não necessariamente o primeiro.

A faixa se escolhe medindo, e 120 BPM é o mais cômodo (uma batida a cada 15
quadros a 30 fps). É preferência, não regra: um drop no lugar certo vale mais que
a grade limpa. Ouvir é do usuário: a escolha pela medida é a proposta, e ele troca.

**Vinheta de abertura** (1,5 a 3 s) vai sem música própria, porque o Reel já tem
trilha. No máximo um efeito na assinatura (o logo assentando).

## Montar

- **O recorte começa numa batida** (`primeira_batida_s + n × batida_s`), e o
  `data-media-start` escolhe o recorte de modo que o drop caia no momento principal.
- **O efeito se posiciona pelo pico**, não pelo começo do arquivo:
  `data-start = quadro do acerto / 30 − pico_s`. Um "whoosh" pode ter o pico aos 0,70 s.
- Poucos efeitos, só onde há ação (toque, mensagem, queda, saída); nunca em toda
  microanimação.
- Fade na música: entrada de 0,2 s, saída de 1,2 a 1,6 s.

## Conferir

```bash
ffmpeg -hide_banner -i <mp4> -af ebur128=peak=true:framelog=quiet -f null - 2>&1 | grep -E "I:|Peak:"
python .claude/skills/video/ferramentas/medir_audio.py acerto <mp4> ativos/musica.wav --inicio <data-media-start> --volume <data-volume da música> --alvos <s1,s2,...>
```

- Integrado entre −15 e −13 LUFS, pico abaixo de −1 dB. Fora disso, ajustar o
  `data-volume` da música (ela é quem pesa) e renderizar de novo.
- O `acerto` tira a música do áudio do vídeo e acha o pico de cada efeito perto
  do alvo: cada um a até 2 quadros (ele sai com código 1 se algum passar disso).
  O codificador de áudio costuma atrasar de 20 a 50 ms, dentro da tolerância.
