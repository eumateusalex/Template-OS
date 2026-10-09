# Voz

**A padrão é a voz do usuário, gravada.** Quando não houver gravação, a peça sai
sem voz (texto na tela, música e efeitos) ou com uma **voz artificial da
ElevenLabs**, pela chave de API, no plano gratuito.

## A voz de outra pessoa

- **Nenhuma voz de pessoa real entra sem a autorização dela.** Nem imitada, nem
  "parecida com". A voz artificial é uma das vozes que o próprio serviço oferece.
- **Esta skill não faz clonagem de voz**, nem a da própria pessoa.

## A narração

- **A voz e a tela falam da mesma coisa no mesmo instante, e a narração
  nunca lê a legenda.** A tela traz a palavra-chave e o número, com até umas 5 palavras por
  linha; a voz diz a frase inteira sobre o que a tela mostra naquele segundo. Ler
  a copy em voz alta duplica a informação, e a voz que fala de uma coisa enquanto
  a tela mostra outra (o preço, com o prazo na tela) quebra a peça. Por isso **a
  tela se prende à palavra dita**: o `falar.mjs` grava, ao lado do WAV, o
  `<fala>.palavras.json` com o começo e o fim de cada palavra (o endpoint
  `with-timestamps` da ElevenLabs), e cada palavra-chave entra uns 3 quadros
  antes da palavra; a página quebra se a palavra não estiver na fala. Na voz
  gravada, o tempo de cada palavra vem do `scripts/transcrever.py`.
- **No anúncio, a voz diz o que se vende, e sem buraco.** A palavra do produto
  até os 3 s, a oferta com número até os 8 s (e de novo no fim), a chamada ("clica
  em saiba mais") dita e escrita no fecho, e menos de 0,6 s entre duas falas:
  intervalo longo faz quem assiste acelerar o vídeo ou sair. A trava é a
  `ferramentas/regua-voz.mjs`, que lê o `roteiro/narracao.json` da peça <!-- caminho futuro: nasce em cada peça com voz --> (cada
  fala com o quadro em que entra) e os `ativos/<fala>.palavras.json`; rode-a antes
  do render, e verde:

  ```bash
  node .claude/skills/video/ferramentas/regua-voz.mjs <pasta da peça>
  ```
- **O tempo de cada fala se mede antes do render.** Cada fala tem a janela da
  batida dela (de onde começa até a próxima), a cerca de 14 caracteres por
  segundo. O `falar.mjs --janela <s>` mede o áudio gerado e recusa a fala que não
  couber: encurta-se o texto, ou redistribui-se a folga das batidas vizinhas.
  As janelas ficam no roteiro, ao lado das batidas, e a duração do vídeo sai do
  fim da última fala. O ritmo se acerta no texto: o `eleven_v4` ignora a
  velocidade pedida pela API.
- **A música desce sob a voz** (para 35%, com rampa de 5 quadros).
- **A régua da pronúncia é o ouvido do usuário.** Transcrever a fala e conferir o
  texto não prova nada: a transcrição adivinha a palavra pelo sentido e dá
  100% para voz que pronuncia errado. Ele ouve uma fala antes da peça inteira.

## A ElevenLabs

Plano e preço mudam: **confirme na página do serviço** antes de prometer
qualquer um dos limites abaixo.

- **O plano gratuito só vale para o que não se publica.** Ele proíbe uso
  comercial e pede o crédito da ElevenLabs: a peça que vai ser publicada para
  divulgar um trabalho ou um produto se narra de novo num caminho liberado (a voz
  gravada do usuário, ou um plano pago, decisão dele). Diga isso antes de gerar.
- **Créditos:** um por caractere; o gratuito trazia 10 mil por mês. O `falar.mjs`
  mostra a conta antes de chamar.
- **A chave:** `ELEVENLABS` no `scripts/.env`. Sem ela, o script não chama a API
  e devolve o passo a passo (criar a conta em https://elevenlabs.io, gerar a
  chave no painel, colar no `scripts/.env`).
- **O modelo** é o `eleven_v4`, com `language_code: "pt"` (o padrão do script).
- **As vozes:** a API do plano gratuito só libera as vozes padrão do serviço (de
  origem inglesa); as vozes da biblioteca respondem "Free users cannot use library
  voices via the API". O usuário escolhe de ouvido, com uma frase do roteiro, e
  **registra a escolha (nome e id) e as recusas no `marca/marca.md`**: a voz faz
  parte da marca, e a peça seguinte não pergunta de novo. <!-- caminho futuro: o marca.md nasce no /carrossel configurar -->
- **Siglas:** teste a pronúncia de toda sigla. Escrever com pontos ("I.A." em vez
  de "IA") fez as vozes padrão dizerem em português.

**A chamada é sempre pelo script**, nunca por `curl` nem por `source`/`cat` do
`scripts/.env` (isso poria todas as chaves do workspace na conversa, e o
`-d '...'` do shell quebra na primeira frase com apóstrofo). O script lê só a
`ELEVENLABS`, nunca imprime a chave, recebe a fala por arquivo e só grava dentro
da pasta da peça, em WAV de 48 kHz sem o silêncio das pontas, com o
`.palavras.json` ao lado:

```bash
# 1. cada fala num arquivo da peça (pode ter apóstrofo, aspas e acento)
# 2. a conta de créditos, sem chamar nada:
node .claude/skills/video/ferramentas/falar.mjs --texto-de <peca>/falas/f1.txt --peca <peca> --voz <id> --janela <s>
# 3. depois de dizer a conta e o limite do plano ao usuário, gerar:
node .claude/skills/video/ferramentas/falar.mjs --texto-de <peca>/falas/f1.txt --peca <peca> --voz <id> --janela <s> --saida ativos/f1.wav --confirmo
```

A forma da API (endereço `with-timestamps`, cabeçalho `xi-api-key`, `model_id`,
`language_code`, `output_format`) é a que o `falar.mjs` usa: se a ElevenLabs
mudar, o conserto é no `falar.mjs`, com o teste dele.

## A voz gravada

Arquivo WAV que o usuário grava e larga em `dados/`. Transcrever com o
`scripts/transcrever.py` (offline, com a placa de vídeo se houver) para ter o
tempo de cada palavra, e amarrar o texto na tela às palavras. Tratar com
`loudnorm` junto da mixagem. As mesmas regras da narração valem: a fala conta a
história, e o tempo se mede antes do render.

O WAV entra como `<audio class="clip">` no HyperFrames (ou `<Audio>` no
Remotion), e a música desce sob ele (ducking; a skill `hyperframes-audio` do
plugin faz, se instalado).
