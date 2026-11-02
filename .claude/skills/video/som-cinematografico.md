# O som cinematográfico

O que separa "efeito sonoro" de "trilha": **tudo no tom**. A música medida dá o
tom, e cada som com altura (o golpe, o drone, o acorde, o riser com nota, o plim)
entra no tom dela ou no relativo. O contraste do drop vem do corte seco, não de um
efeito maior. O som de cada ação, a biblioteca de efeitos e a conferência de
volume moram em `som.md`; este módulo soma a camada tonal e a mixagem com a
voz na frente. A faixa sai pela ordem do `som.md` ("Achar"); música de artista sem
licença não entra.

## 1 · Onde vale

| Peça | O que entra |
|---|---|
| **motion sem voz** | tudo: a faixa com a intro construída, os tonais, os risers, o drop no momento principal |
| **Reel com a pessoa falando** | a voz seca (a sala só na palavra de impacto, quando a peça pede); o golpe tonal no quadro 0 por baixo da primeira palavra; o drone baixo como cama; o golpe de acento em 2 a 3 palavras-chave; o riser e o impacto só na virada; o golpe tonal no CTA. No meio, só a cama |
| **vinheta** | um golpe tonal na assinatura, no tom da faixa do Reel que ela abre |

## 2 · O fluxo

1. **A faixa medida**: `medir_audio.py musica` (BPM, batidas, drops, LUFS) e
   `medir_audio.py tom` (tom, modo, relativo, afinação). Afinação acima de ±20
   cents: troque de faixa (todo tonal vai desafinar). O tom e o relativo
   empatados: confira no ouvido.
2. **O tom dos tonais**: numa faixa menor, sons menores no tom, maiores no
   relativo maior (3 semitons acima) e sons sem terça; nunca um maior na mesma
   tônica de uma menor (as terças brigam). Numa faixa maior, o inverso.
   `medir_audio.py nota <efeitos>` diz a nota de cada efeito, e
   `medir_audio.py casa "<tom>" <nota>:<tipo>` diz se ele serve.
3. **Os tonais sintetizados**: o drone e o golpe saem do `tonal.py`, no tom da faixa e nos números do
   § 3 (o drone com a tônica e a quinta; o golpe com a tônica em duas oitavas e a catedral). Os dois
   não têm terça, e servem no tom e no relativo.

   ```bash
   python -I .claude/skills/video/ferramentas/tonal.py drone <peça>/ativos/drone.wav --trilha <peça>/ativos/musica.wav --dur <s até o drop>
   python -I .claude/skills/video/ferramentas/tonal.py golpe <peça>/ativos/golpe.wav --tom "Lá menor" [--acento]
   ```

   A linha JSON da saída diz o tom usado, de onde veio e os LUFS medidos; a trilha fora da afinação
   sai 1. O `tonal.py` pede o Python da mixagem (numpy, scipy, soundfile, soxr, pyloudnorm, do
   `scripts/requirements.txt`; o `MIXAGEM_PY` aponta outro). Os LUFS são os de antes do master: no `<audio>` o volume fica em 1 e a mixagem acerta pelo
   relevo (`simula_mix.py --contexto`).
4. **O `trilha.json`** da peça, com uma linha por camada: papel, arquivo, `em`
   (quadro), `pico_em` (quadro do pico), nível em LUFS antes do master, filtro, fade.
5. **A montagem** das camadas e a mixagem com a voz na frente (§ 4).
6. **A conferência** (§ 5).

## 3 · Os números de partida

| Camada | Número |
|---|---|
| integrado | −14 LUFS (aceito de −15 a −13) |
| pico | **verdadeiro** abaixo de −1 dBTP (`medir_audio.py conferir`); o limitador de amostra deixa passar (Reel publicado com +0,1 dBTP existe) |
| golpe tonal | os números moram no `tonal.py` (`GOLPE`): a tônica em duas oitavas e a de baixo, a catedral longa, sem sub, o pico no ataque; o acento 4 dB abaixo |
| drone | os números moram no `tonal.py` (`DRONE`): a tônica e a quinta, a entrada em fade; entra aos 2,5 s e vai até o drop |
| acordes | um por compasso, no primeiro tempo e numa palavra forte; a fatia termina 0,06 s depois do começo da seguinte, fade de 0,15 s; −22 LUFS |
| risers | dois, com o pico exato no quadro do drop, subidas de ~5,1 e ~3,7 s; passa-baixas de 5 e 4 kHz; −16 a −17,5 LUFS |
| impacto no drop | passa-altas de 60 Hz (o grave é do bumbo); −20 LUFS |
| drop | tudo da intro corta com fade de 20 a 60 ms; a faixa entra 65 ms antes do bumbo medido; contraste de 4 a 5 dB (o curto de 3 s antes e depois, `medir_audio.py drop`) |
| antes do drop | a cama e os acentos param ~3 s antes; ficam os risers (o arranjo esvazia) |
| intro de vídeo curto | 8 a 13 s antes do drop (240 a 390 quadros a 30 qps) |
| a grade | um compasso a 120 BPM são 60 quadros; a 136 BPM, 53 |
| efeitos de ação | um por coisa que entra, de 5 a 7 famílias, o golpe forte de 1 a 3 vezes (`som.md`) |

**Um tom padrão para a marca**: sem outro escolhido pelo usuário (no `marca.md`), o padrão é
Lá menor; a faixa, os tonais e os efeitos com nota ficam nele ou no relativo, Dó maior. A peça que pede outro
tom (a faixa boa que não está em Lá) leva a exceção escrita no plano, com o tom
medido e o motivo, e tudo que tem nota segue o tom dela.

## 4 · A voz na frente

A voz vai seca por padrão. A palavra de impacto pode ganhar uma sala que corre
no silêncio depois dela (o `reverb_voz` do `som.json`, no `scripts/reel-falado/som.py`:
`de`, `ate`, `mix` e `cauda`), e o efeito também (`reverb` no efeito); é escolha da
peça, escrita no plano, nunca em toda frase. A música e os tonais abrem espaço para ela por
prioridade dinâmica em duas bandas, não por volume fixo (no método de referência,
2,5 dB fixos não bastaram: o acorde passou a voz).

- **Corte em 250 Hz**: o médio (acima) dos tonais e da música fica **pelo menos
  10 dB abaixo da voz** enquanto a pessoa fala, com redução de até 12 dB; o grave
  (abaixo) cai no máximo 3 dB, e o peso fica.
- **Tempos**: envelope de 50 ms, ataque de 15 ms, soltura de 300 ms.
- **"Falando"** sai dos tempos das palavras da transcrição (o `palavras.json` da
  `/cortes`), não do volume da voz.
- Os 10 dB são HIPÓTESE (o método usa 5 dB para voz cantada; fala pede mais
  folga): medir em duas peças antes de virar número firme.
- O script (`voz_na_frente.py`) nasce pela `/fabrica`, na primeira peça com
  trilha tonal; até lá, a folga se faz no `data-volume` e se confere no ouvido.

## 5 · A conferência

```bash
python .claude/skills/video/ferramentas/medir_audio.py conferir <mp4>
python .claude/skills/video/ferramentas/medir_audio.py tom <musica.wav>
python .claude/skills/video/ferramentas/medir_audio.py nota ativos/*.wav
python .claude/skills/video/ferramentas/medir_audio.py drop <mp4> --em <s do drop>
python .claude/skills/video/ferramentas/medir_audio.py acerto <mp4> ativos/musica.wav --inicio <s> --volume <v> --alvos <s1,s2,...>
```

- o integrado e o pico verdadeiro dos números de partida (§ 3, acima; o `medir_audio.py conferir` mede os dois).
- Cada som com altura no tom ou no relativo.
- O drop com 4 a 5 dB de contraste; o golpe sem sub (nada abaixo de 150 Hz,
  conferido no ouvido e no filtro do `trilha.json`).
- Cada efeito a até 2 quadros do alvo (`acerto`).
- No falado: o médio da cama 10 dB ou mais abaixo da voz em cada palavra.

## 6 · De onde vêm os sons tonais

| O que | Onde | Licença |
|---|---|---|
| golpe tonal e drone | o `tonal.py` (§ 2, passo 3): síntese própria, o golpe pelas parciais da tônica com a catedral, o drone por dois osciladores na tônica e na quinta a ±7 cents | própria (código do workspace) |
| acordes, frase de cello | o kit de notas soltas de piano e cello da University of Iowa (https://theremin.music.uiowa.edu/MIS.html), que ainda não existe: nasce pela `/fabrica` na primeira peça que pedir | "may be downloaded and used for any projects, without restrictions" (a página do kit; confira no dia) |
| riser, impacto, "fita parando" | Mixkit (tags `riser`, `cinematic`); Sonniss GDC | comercial, sem crédito (Mixkit); comercial, sem crédito, proibido treinar IA (Sonniss) |
| plims com nota | o material do usuário, cada um medido pelo `medir_audio.py nota` (a nota e o quanto tem altura) | a do pacote, anotada no `material.local.json` |

Em anúncio pago e em peça de cliente, valem as fontes de licença clara do `som.md` ("A
biblioteca de efeitos"). O `medir_audio.py nota` diz a `origem` de cada arquivo pelo nome (a lista
das origens está no `som.md`).

## 7 · O som na tela

Quando a peça é sobre som (o "antes e depois" da trilha), as camadas finais se
medem a cada 25 ms (pico em dB levado a 0..1, com −42 dB = 0) num JSON que a cena
lê: cada clipe acende pelo nível real dele, o cursor fica fixo a um terço da
largura, a câmera empurra a cada bumbo depois do drop, e o quadro desfoca um
quadro no drop. O script (`niveis.py`) nasce pela `/fabrica` na primeira peça que
pedir.
