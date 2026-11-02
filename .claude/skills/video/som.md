# Som

Música e efeitos do **Mixkit**: grátis, uso comercial liberado, sem crédito
obrigatório (a informação oficial, https://mixkit.co/llm-info/; confira no dia).
A origem de cada arquivo vai para a tabela de ativos do `roteiro.md`. Os arquivos
da peça ficam em `ativos/`, em WAV, fora do git, e o `ativos.sh` da peça os refaz
(modelo em `ferramentas/modelo-ativos.sh`).

## Achar

**Primeiro, o material do usuário, pelo índice** (`.claude/skills/mograph/ferramentas/ativos.py`):
os pacotes de música e de efeitos que ele tem (comprados ou baixados), declarados no
`material.local.json` da `/mograph` (fora do git; o modelo é o `material.exemplo.json`), cada um
com a pasta, os papéis e a licença. Sem pacote declarado, o índice fica vazio e a busca vai direto
à reserva. O `trazer` copia o arquivo para `<peça>/ativos/` em WAV. Com `--uso anuncio` ou
`--uso cliente`, o pacote sem licença clara avisa.

```bash
python -I .claude/skills/mograph/ferramentas/ativos.py buscar impacto --tipo som
python -I .claude/skills/mograph/ferramentas/ativos.py buscar "" --tipo musica
python -I .claude/skills/mograph/ferramentas/ativos.py trazer <pacote>:<caminho do arquivo> <peça>
```

**Depois, a reserva no Mixkit**, para o que o material não tem:

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
python .claude/skills/video/ferramentas/medir_audio.py tom <arquivo>      # tom, modo, relativo, afinação em cents
python .claude/skills/video/ferramentas/medir_audio.py nota <arq>...      # a nota de cada efeito, o quanto tem altura, a origem
python .claude/skills/video/ferramentas/medir_audio.py casa "Lá menor" Dó:maior   # o som serve na faixa?
```

**Tudo que tem nota fica no tom.** Todo som com altura (plim, sino, golpe, riser
com nota) entra no tom da faixa ou no relativo; nunca o modo oposto na mesma
tônica (as terças brigam). Faixa fora da afinação de Lá 440 por mais de ±20 cents
desafina todo tonal: troque de faixa. A trilha cinematográfica (os tonais, os
risers, a voz na frente) é o `som-cinematografico.md`.

O `drops_s` traz as três maiores subidas do grave, a 4 s ou mais uma da outra, e
ignora os 2 primeiros segundos (a entrada de uma faixa que nasce do silêncio
parece drop). Escolha o drop que serve à peça, não necessariamente o primeiro.

A faixa se escolhe medindo, e 120 BPM é o mais cômodo (uma batida a cada 15
quadros a 30 fps). É preferência, não regra: um drop no lugar certo vale mais que
a grade limpa. Ouvir é do usuário: a escolha pela medida é a proposta, e ele troca.

**Vinheta de abertura** (1,5 a 3 s) vai sem música própria, porque o Reel já tem
trilha. No máximo um efeito na assinatura (o logo assentando).

## A biblioteca de efeitos

O som segue o movimento: cada coisa que se vê entrar, andar ou bater tem o som
da família certa, de uma biblioteca curta que se conhece de ouvido. Vale em toda
peça, e o que foge dela vai como exceção escrita no plano.

| Família | Para quê | Quantos |
|---|---|---|
| whoosh | o que anda: zoom, corte na curva, câmera, a entrada de bloco | 5 (curto, longo, com textura) |
| clique mecânico | o que encaixa: o número que vira, o botão, o cursor, a tecla da digitação na interface (uma por letra, `oficio.md` § 8 da `/mograph`) | 2 a 3 |
| interface | o toque, o certo, o errado, o destaque, a logo | 3 (clique, sucesso, falha) |
| sci-fi | o que aparece com impacto: a tela que acende, o dado | 2 a 3 |
| riser e impacto | a tensão que sobe e o pico que cai; a surpresa e o final | 2 risers, 2 impactos |
| registradora | o valor, o preço, o dinheiro que entra | 1 |

- **Um som por coisa que entra** (calibragem, que avisa e aceita exceção no plano):
  de 5 a 7 famílias por peça; o que entra em cascata soa baixo (volume de 0,14 a
  0,22); o golpe forte, de 1 a 3 vezes por peça. O que não entra (o brilho que
  decai, a deriva da câmera) fica sem som. A tabela de ofício mora no `oficio.md`
  § 8 da `/mograph`.
- **A palavra-chave da legenda tem o som dela**, no quadro em que entra: um som
  da família interface (o "destaque"). A cama de teclado baixinho sob a legenda
  inteira entra só numa peça de teste, para o usuário ouvir antes de virar regra.
- **Antecipe os toques**: o ataque do som chega de 1 a 3 quadros antes da entrada
  visual; a voz nunca se acelera para caber.
- Os efeitos vêm do material do usuário pelo índice (que já traz o pico de cada um) ou do Mixkit,
  medidos um a um pelo pico (`medir_audio.py efeito`), e a lista com a origem e o pico de cada um
  fica no `ativos.sh` da peça.
- No Reel falado, os efeitos ficam abaixo da voz (10 dB, como manda a `/cortes`).
- **A origem de cada som** vai na tabela de ativos do `roteiro.md`: Mixkit, Sonniss,
  um tonal sintetizado (`tonal.py`) ou o nome do pacote do usuário. O `medir_audio.py nota`
  diz a origem pelo nome quando o arquivo traz o prefixo do banco.
- **Em anúncio pago e em peça de cliente, só som de licença clara**: Mixkit, Sonniss, os
  tonais sintetizados e os pacotes com licença comercial escrita (lida no dia e anotada no
  `material.local.json`). Pacote sem licença clara fica no orgânico, e a decisão de usá-lo
  fora dele é do usuário, com o risco dito (o Instagram pode silenciar o áudio); a origem na
  tabela de ativos deixa achar o arquivo se um dia precisar trocar.
- **Banco de efeitos feito em código** (gerador de SFX que roda local, sem rede) é opcional:
  se o usuário tiver um, o arquivo leva o prefixo do banco no nome, para a origem se ler, e
  passa pela mesma medida de pico e de nota que qualquer efeito. Um sub que desce em
  glissando soa uns 30% acima da nota de pouso: mede-se o corpo com o `nota`, não o pouso.
  O `nota` do `tom.py` lê o grave com janela de 32 768 amostras (a de 4096 erra o sub perto
  de 55 Hz).
- **A saída é a entrada invertida**: a cópia do som de entrada com `areverse` sobe até o
  pico no instante da saída (`ffmpeg -i entra.wav -af "areverse,afade=t=in:d=0.05" sai.wav`;
  o pico vai para `duração − pico` da original, então ele se posiciona pelo pico como
  qualquer efeito). Som invertido longo (um pouso de 2,4 s) se apara pelo começo, para a
  subida não passar de 0,5 s.
- A música fica por baixo da voz, num nível só (no falado, o do `som.py` da
  `/cortes`); o riser acaba no quadro do pico.

## Montar

- **O recorte começa numa batida** (`primeira_batida_s + n × batida_s`), e o
  `data-media-start` escolhe o recorte de modo que o drop caia no momento principal.
- **O efeito se posiciona pelo pico**, não pelo começo do arquivo:
  `data-start = quadro do acerto / 30 − pico_s`. Um whoosh de ar comum tem o pico
  perto dos 0,7 s.
- Fade na música: entrada de 0,2 s, saída de 1,2 a 1,6 s.
- **A trilha que cai** (o falado): o `musica.cai` do `som.json` lista os trechos sem trilha
  (`[{"de": 28.2, "ate": 31.165}]`); o `som.py` corta seco no `de` e a trilha volta no `ate`
  no mesmo ponto da faixa e no mesmo nível. É recurso para a frase de impacto, à mão do
  plano em qualquer peça falada; o usuário ouve com e sem ela e escolhe por peça.
- **O sub no falado**: com a voz a −4 dBTP, o sub a −3 dB do pico da voz passa o pico
  verdadeiro de −1 dBTP, e o limitador de amostra do `som.py` não segura (−0,9 medido).
  O teto medido é −8 dB do pico da voz; whoosh junto do sub, −12.
- **O pico se simula antes do render**: `simula_mix.py <pasta da peça> [--teto -1] [--grava mix.wav]`
  soma os `<audio>` do `index.html` como o HyperFrames (início, recorte, volume, fades), mede o
  pico verdadeiro em janelas de 0,1 s e lista as piores com os clipes que tocam nelas, o quanto
  o render baixaria a peça inteira e o integrado que sairia; sai 1 acima do teto.
- **Esvaziar antes do drop**: `esvazia.py <trilha.wav> <saida.wav> <inicio_s> <drop_s> <db>`
  desce a trilha em rampa de dB até o `db` (negativo) e volta seco no drop; os tempos são os do
  arquivo (o do vídeo + o `data-media-start`). O `simula_mix.py`, o `esvazia.py` e o
  `confere_posicao.py` moram em `ferramentas/` e pedem o Python da mixagem, com numpy, scipy,
  soundfile, soxr e pyloudnorm, só esses cinco, nas versões do `scripts/requirements.txt` (o
  `ambiente.mjs` imprime o comando). Elas rodam com `-I`, que não enxerga o site-packages do
  usuário: pacote instalado lá pede um Python só da mixagem, e o `MIXAGEM_PY` aponta para ele.

## Conferir

**O som dentro da música, antes do render** (`simula_mix.py --contexto`, `linguagens.md` "Medir"):
o relevo de cada efeito sobre a cama, pelo papel, e os acertos na batida contra o acaso. O efeito que
o olho vê e o ouvido não acha (a mediana a 19 dB abaixo da trilha, por exemplo) é defeito: **subir o
efeito ou cavar a cama no instante dele** é o conserto, antes de qualquer render. O regime de
sincronia é o da linguagem (travado na pessoa falando e no gancho; solto na interface com música
contínua), e a fração na batida só reprova no regime travado.

```bash
python -I .claude/skills/video/ferramentas/simula_mix.py <peça> --contexto --grade <bpm>,<primeira batida>
```

```bash
python .claude/skills/video/ferramentas/medir_audio.py conferir <mp4>
python .claude/skills/video/ferramentas/medir_audio.py acerto <mp4> ativos/musica.wav --inicio <data-media-start> --volume <data-volume da música> --alvos <s1,s2,...>
python .claude/skills/video/ferramentas/medir_audio.py drop <mp4> --em <s do drop>
python .claude/skills/video/ferramentas/confere_posicao.py <render sem a trilha> <pasta da peça> [--tolerancia 2]
```

- O `conferir` reprova (código 1) o **pico verdadeiro** acima de −1 dBTP: o
  `ebur128=peak=true` mede o pico entre amostras, que o limitador de amostra deixa
  passar (Reel publicado com +0,1 dBTP existe). O integrado fora de −15 a
  −13 LUFS avisa (calibragem: nenhuma plataforma publica o número do Reel); o
  conserto é o `data-volume` da música (ela é quem pesa), ou o motivo no plano.
- O `conferir` avisa o silêncio no fim acima de 0,5 s e o buraco no meio (abaixo
  de −70 dB por 0,25 s ou mais: a música que acaba antes do vídeo).
- O `acerto` tira a música do áudio do vídeo e acha o pico de cada efeito perto
  do alvo: cada um a até 2 quadros (ele sai com código 1 se algum passar disso).
  O codificador de áudio costuma somar de +20 a +50 ms.
- O `confere_posicao.py` confere a posição de cada efeito por correlação da forma de onda,
  num render feito sem a trilha: onde o `acerto` pega o vizinho (efeitos colados a 4 quadros,
  ou sob a cauda de um som mais alto), ele correlaciona cada clipe num raio abaixo da metade
  da distância até o clipe igual mais próximo, e sai 1 se algum passa da tolerância em quadros.
- O `drop` compara o curto de 3 s antes e depois do drop: o alvo é de 4 a 5 dB, e
  abaixo de 4 avisa.
