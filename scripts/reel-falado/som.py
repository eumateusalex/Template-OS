"""O som do Reel falado: voz, efeitos, riser e música em quatro faixas
separadas e medidas, e o master.

  python scripts/reel-falado/som.py <pasta> [--sem-musica]

Na pasta: `cortes.json` (o END), `voz.wav` (do fala.py, já em −14 LUFS) e
`som.json`:
  {"musica": {"arquivo": "musica.wav", "batida": 0.25, "cai": [{"de": 28.2, "ate": 31.2}]} | null,
   "efeitos": [{"arquivo": "pop.wav", "acerto": 3.0, "db": -10}],
   "riser": {"dur": 2.5, "db": -14, "fim": 4.93} | null}
O `reverb` é opcional, no efeito (`{"mix": 0.35, "cauda": 1.8}`) e na voz
(`"reverb_voz": [{"de": 31.2, "ate": 31.8, "mix": 0.3, "cauda": 1.6}]`, a palavra de impacto): a
voz segue seca por padrão (`.claude/skills/video/som.md`), e o trecho pedido ganha uma sala
sintética e fixa (ruído com semente, 20 ms de pré-atraso, `cauda` é o RT60 em segundos) somada ao
seco, com a cauda correndo depois do `ate`. O `mix` é o nível da sala contra o seco, de 0 a 1.
O `cai` é opcional: os trechos sem trilha (a frase de impacto), com corte seco e a
trilha voltando no mesmo ponto da faixa; a `rampa` do trecho (s, até 1) amacia a volta. O `fim` do riser é opcional: sem ele, é o fim da primeira frase no `cortes.json`.

Sai: `stems/voice.wav`, `stems/sfx.wav`, `stems/riser.wav`, `stems/music.wav`, todas
com a duração exata do END, em 48 kHz estéreo, o `master.wav` e o
`relatorio-audio.json` com as medidas de cada faixa (ebur128 do FFmpeg).

A régua: o efeito se posiciona pelo PICO e fica `db` abaixo do pico da voz (clique,
impacto e confirmação −10; passagem −9; tecla −16); o riser acaba em `fim`, a
junção em que o gancho termina; a trilha num nível só em −24 LUFS, primeira batida
no quadro 1, 5 ms de entrada e 800 ms de saída; o master soma sem mexer nos níveis
e só passa no limitador se o pico passar de −1 dBTP.
"""
import argparse
import json
import math
import subprocess
import sys
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

sys.path.insert(0, str(Path(__file__).resolve().parent))
from medida import mede  # noqa: E402

SR = 48000
MUSICA_LUFS = -24.0
ENTRADA, SAIDA = 0.005, 0.8
ESTEREO = -3.01   # a voz mono medida em −14 soma 3 dB quando vira dois canais iguais


class Recusa(Exception):
    pass


def ganho(db):
    return 10 ** (db / 20)


def ler(caminho, canais=2):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(caminho), '-ac', str(canais), '-ar', str(SR), '-f', 'f32le', '-'],
                       capture_output=True)
    if r.returncode != 0:
        raise Recusa(f'não consegui ler {caminho}: {r.stderr.decode("utf-8", "replace")[-300:]}')
    x = np.frombuffer(r.stdout, dtype=np.float32).astype(np.float64)
    return np.stack([x, x], axis=1) if canais == 1 else x.reshape(-1, 2)


def grava(caminho, x):
    Path(caminho).parent.mkdir(parents=True, exist_ok=True)
    wavfile.write(caminho, SR, (np.clip(x, -1, 1) * 32767).astype(np.int16))


def no_tamanho(x, n):
    return np.vstack([x, np.zeros((n - len(x), 2))]) if len(x) < n else x[:n]


def coloca(destino, x, t):
    i = int(round(t * SR))
    if i < 0:
        x, i = x[-i:], 0
    j = min(i + len(x), len(destino))
    if j > i:
        destino[i:j] += x[: j - i]


REVERB_PRE = 0.020
REVERB_CAUDA_MAX, REVERB_MIX_MAX = 6.0, 1.0


def sala(cauda):
    """A resposta de uma sala sintética e fixa: ruído com semente que cai 60 dB em `cauda` s, sem o
    grave abaixo de 150 Hz (a sala que embola a voz) e sem o chiado acima de 8 kHz; energia 1."""
    n = int((REVERB_PRE + cauda) * SR)
    t = np.arange(n) / SR
    ruido = np.random.default_rng(11).standard_normal((n, 2))
    env = np.where(t < REVERB_PRE, 0.0, np.exp(-6.9078 * (t - REVERB_PRE) / cauda))
    x = sosfilt(butter(2, [150, 8000], btype='band', fs=SR, output='sos'), ruido * env[:, None], axis=0)
    return x / np.sqrt((x ** 2).sum(axis=0, keepdims=True))


def confere_reverb(r, onde):
    if not isinstance(r, dict):
        raise Recusa(f'{onde}: o reverb é {{"mix", "cauda"}}')
    mix, cauda = r.get('mix'), r.get('cauda')
    if not isinstance(mix, (int, float)) or not 0 < mix <= REVERB_MIX_MAX:
        raise Recusa(f'{onde}: o mix do reverb ({mix}) vai de 0 a {REVERB_MIX_MAX}')
    if not isinstance(cauda, (int, float)) or not 0.1 <= cauda <= REVERB_CAUDA_MAX:
        raise Recusa(f'{onde}: a cauda do reverb ({cauda}) vai de 0,1 a {REVERB_CAUDA_MAX} s')


def molhado(x, r):
    """Só a sala do trecho (sem o seco), no nível `mix` contra o pico do seco, com a cauda inteira."""
    if not len(x) or not np.abs(x).max():
        return np.zeros((0, 2))
    w = fftconvolve(x, sala(r['cauda']), axes=0)
    return w / np.abs(w).max() * np.abs(x).max() * r['mix']


def riser(dur, pico):
    n = int(dur * SR)
    t = np.arange(n) / SR
    ruido = sosfilt(butter(2, [120, 1800], btype='band', fs=SR, output='sos'), np.random.default_rng(7).standard_normal(n))
    grave = np.sin(2 * np.pi * (55 * t + 55 * t ** 2 / (2 * dur)))   # de 55 a 110 Hz
    x = (0.55 * ruido / np.abs(ruido).max() + 0.45 * grave) * (t / dur) ** 2.2
    x[-int(0.02 * SR):] *= np.linspace(1, 0, int(0.02 * SR))       # acaba seco na junção
    x = x / np.abs(x).max() * pico
    return np.stack([x, x], axis=1)


def trilha(pasta, m, n, fps):
    x = ler(pasta / m['arquivo'])
    i0 = int(round((m['batida'] - 1 / fps) * SR))   # a batida cai no quadro 1
    x = np.vstack([np.zeros((-i0, 2)), x]) if i0 < 0 else x[i0:]
    x = no_tamanho(x, n)
    x[: int(ENTRADA * SR)] *= np.linspace(0, 1, int(ENTRADA * SR))[:, None]
    x[-int(SAIDA * SR):] *= np.linspace(1, 0, int(SAIDA * SR))[:, None]
    tmp = pasta / 'stems' / '.trilha-medir.wav'
    grava(tmp, x)
    lufs = mede(tmp)['lufs']
    tmp.unlink()
    # não medir não é passar; o ebur128 dá −70 para o
    # silêncio, o chão dele, e isso também é "não mediu"
    if lufs is None or lufs <= -69.9:
        raise Recusa(f"a trilha {m['arquivo']} não mediu loudness: é silêncio no trecho ou o arquivo não leu")
    x = x * ganho(MUSICA_LUFS - lufs)
    # a trilha que cai (a frase de impacto sem trilha): corta seco no `de` e volta no `ate` no mesmo
    # ponto da faixa, como se seguisse tocando por baixo; o nível é o medido com ela inteira. As
    # bordas levam os 5 ms da entrada, para o corte não estalar
    e = int(ENTRADA * SR)
    for c in m.get('cai', []):
        if not 0 <= c['de'] < c['ate'] <= n / SR:
            raise Recusa(f"o trecho sem trilha {c['de']} a {c['ate']} s está ao contrário ou fora do END ({n / SR:.3f} s)")
        i, f = int(round(c['de'] * SR)), int(round(c['ate'] * SR))
        x[max(0, i - e):i] *= np.linspace(1, 0, i - max(0, i - e))[:, None]
        x[i:f] = 0
        # a "rampa" (s) é a volta macia, quando o corte da volta soa seco; sem ela, os 5 ms
        rampa = c.get('rampa', ENTRADA)
        if not isinstance(rampa, (int, float)) or not ENTRADA <= rampa <= 1.0:
            raise Recusa(f"a rampa da volta da trilha ({rampa}) vai de {ENTRADA} a 1 s")
        r = int(round(rampa * SR))
        x[f:f + r] *= np.linspace(0, 1, len(x[f:f + r]))[:, None]
    return x


def master(pasta, soma, nome):
    """Soma sem mexer nos níveis; o limitador só entra se o pico passar de −1 dBTP."""
    bruto = pasta / f'.{nome}'
    grava(bruto, soma)
    pico = mede(bruto)['pico_dbtp']
    if pico is None:   # não medir não é passar
        bruto.unlink()
        raise Recusa(f'o {nome} não mediu o pico: sem ele, o limite de −1 dBTP não tem garantia')
    limitado = pico > -1.0
    if limitado:
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(bruto), '-af', 'alimiter=limit=0.891:attack=3:release=60:level=false',
                        str(pasta / nome)], check=True)
        bruto.unlink()
    else:
        bruto.replace(pasta / nome)
    return limitado


def mixar(pasta, sem_musica=False):
    pasta = Path(pasta)
    cortes = json.loads((pasta / 'cortes.json').read_text(encoding='utf-8'))
    som = json.loads((pasta / 'som.json').read_text(encoding='utf-8'))
    end, fps = cortes['END'], cortes.get('fps', 30)
    n = int(round(end * SR))
    for e in som.get('efeitos', []):
        if 'reverb' in e:
            confere_reverb(e['reverb'], f"o efeito {e['arquivo']}")
        if e['acerto'] > end:
            raise Recusa(f"o efeito {e['arquivo']} em {e['acerto']} s cai depois do END ({end:.3f} s)")

    # a voz se lê em mono e se duplica aqui: o FFmpeg, ao subir mono para estéreo, já
    # baixa 3 dB, e a conta ficaria dependendo da matriz dele
    voz = no_tamanho(ler(pasta / 'voz.wav', canais=1) * ganho(ESTEREO), n)
    pico_voz = np.abs(voz).max()
    pico_voz_db = 20 * math.log10(max(pico_voz, 1e-9))
    # a sala da palavra de impacto entra depois de medir o pico da voz seca: os efeitos seguem
    # calibrados pela voz como ela é falada
    reverbs = []
    for k, rv in enumerate(som.get('reverb_voz', [])):
        confere_reverb(rv, f'o reverb_voz {k + 1}')
        de, ate = rv.get('de'), rv.get('ate')
        if not isinstance(de, (int, float)) or not isinstance(ate, (int, float)) or not 0 <= de < ate <= end:
            raise Recusa(f'o reverb_voz {k + 1}: o trecho ({de} a {ate}) fica dentro do vídeo, de 0 a {end:.3f} s')
        i, j = int(round(de * SR)), int(round(ate * SR))
        w = molhado(voz[i:j].copy(), rv)
        coloca(voz, w, de)
        reverbs.append({'de': de, 'ate': ate, 'mix': rv['mix'], 'cauda': rv['cauda'],
                        'cauda_ate_s': round(min(end, de + len(w) / SR), 4)})

    sfx, lista = np.zeros((n, 2)), []
    for e in som.get('efeitos', []):
        x = ler(pasta / e['arquivo'])
        pico_i = int(np.argmax(np.abs(x).max(axis=1)))
        x = x / np.abs(x).max() * pico_voz * ganho(e['db'])
        inicio = e['acerto'] - pico_i / SR
        coloca(sfx, x, inicio)
        if 'reverb' in e:
            coloca(sfx, molhado(x, e['reverb']), inicio)
        lista.append({'arquivo': e['arquivo'], 'acerto_s': e['acerto'], 'inicio_s': round(inicio, 4),
                      'quadro': int(round(e['acerto'] * fps)), 'db_abaixo_da_voz': e['db'],
                      **({'reverb': e['reverb']} if 'reverb' in e else {})})

    r = som.get('riser')
    rs = np.zeros((n, 2))
    if r:
        # sem fim, o riser acaba na junção do gancho, lida do dono do tempo (o cortes.json)
        r = {**r, 'fim': r.get('fim', cortes['frases'][0]['t_ate'])}
        coloca(rs, riser(r['dur'], pico_voz * ganho(r.get('db', -14))), r['fim'] - r['dur'])

    m = None if sem_musica else som.get('musica')
    mus = trilha(pasta, m, n, fps) if m else np.zeros((n, 2))

    stems = pasta / 'stems'
    for nome, x in (('voice', voz), ('sfx', sfx), ('riser', rs), ('music', mus)):
        grava(stems / f'{nome}.wav', x)
    limitado = master(pasta, voz + sfx + rs + mus, 'master.wav')
    # com trilha, a versão de fala pura sai junto: trocar o áudio do vídeo pronto
    # custa um remux, e não outro render inteiro
    if m:
        master(pasta, voz + sfx + rs, 'master-sem-trilha.wav')

    relatorio = {
        'END_s': end, 'pico_voz_dbfs': round(pico_voz_db, 2), 'limitador_no_master': limitado, 'efeitos': lista,
        'reverb_voz': reverbs,
        'riser': {'inicio_s': round(r['fim'] - r['dur'], 4), 'fim_s': r['fim']} if r else None,
        'musica': {'arquivo': m['arquivo'], 'batida_s': m['batida']} if m else None,
        'medidas': {k: mede(stems / f'{k}.wav') for k in ('voice', 'sfx', 'riser', 'music')}
    }
    relatorio['medidas']['master'] = mede(pasta / 'master.wav')
    (pasta / 'relatorio-audio.json').write_text(json.dumps(relatorio, ensure_ascii=False, indent=1), encoding='utf-8')
    return relatorio


def main(argv):
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
    ap = argparse.ArgumentParser(description='o som do Reel falado')
    ap.add_argument('pasta')
    ap.add_argument('--sem-musica', action='store_true')
    a = ap.parse_args(argv)
    try:
        rel = mixar(a.pasta, a.sem_musica)
    except Recusa as e:
        print(str(e), file=sys.stderr)
        return 1
    for k, v in rel['medidas'].items():
        print(f"{k:7s} {v['lufs']} LUFS, pico {v['pico_dbtp']} dBTP")
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
