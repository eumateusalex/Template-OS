"""Confere onde cada efeito entrou no render, por correlação da forma de onda (não pelo pico).

    python confere_posicao.py <render sem a trilha (.mp4 ou .wav)> <pasta da peça | index.html> [--tolerancia 2] [--fps 30]

O `medir_audio.py acerto` acha o maior pico perto de cada alvo e, em efeitos colados (a cascata a
4 quadros) ou sob a cauda de um som mais alto, pega o vizinho. Aqui cada clipe do index.html é
correlacionado com o áudio do render num raio de até 0,25 s em volta do data-start; o atraso que
dá a maior correlação normalizada é o erro de posição. O raio fica abaixo da metade da distância
até o clipe igual mais próximo (a tecla a cada 2 quadros, o cubo a cada 4), senão a correlação
acha a cópia vizinha.

Entram todos os <audio> menos o de data-papel="trilha": o render se faz sem ela (a trilha mutada),
para a música não encobrir o efeito. O `src` é relativo à pasta do index.html.
Sai com código 1 se algum passa da tolerância (em quadros). Pede numpy, scipy, soundfile e soxr.
"""
import os
import re
import subprocess
import sys
import tempfile

import numpy as np
import soundfile as sf
import soxr
from scipy import signal

SR = 48000
RAIO_MAX = 0.25
JANELA = 0.4


def atributo(tag, nome, padrao=None):
    m = re.search(rf'(?<![\w-]){nome}="([^"]*)"', tag)
    return m.group(1) if m else padrao


def audio_do_render(caminho):
    if caminho.lower().endswith('.wav'):
        y, sr = sf.read(caminho, always_2d=True)
        y = y.mean(1)
        return soxr.resample(y, sr, SR) if sr != SR else y
    with tempfile.TemporaryDirectory(prefix='posicao-') as d:
        wav = os.path.join(d, 'render.wav')
        subprocess.run(['ffmpeg', '-nostdin', '-y', '-v', 'error', '-i', caminho, '-vn', '-ac', '1', '-ar', str(SR), wav], check=True)
        return sf.read(wav)[0]


def correlaciona(y, x, i0, R):
    """a correlação normalizada de x contra y em cada atraso de -R a +R amostras em volta de i0,
    em todas as amostras (pela FFT): num ruído largo (o chiado de um woosh) a correlação cai a zero
    a uma amostra do ponto, e uma grade mais grossa passa por cima dele. Devolve (a maior, o atraso)."""
    a, b = max(0, i0 - R), min(len(y), i0 + R + len(x))
    seg = y[a:b]
    if len(seg) < len(x):
        return -1.0, 0
    num = signal.correlate(seg, x, mode='valid', method='fft')
    energia = np.concatenate([[0.0], np.cumsum(seg.astype(np.float64) ** 2)])
    norma = np.sqrt(np.maximum(energia[len(x):] - energia[:-len(x)], 0)) * np.linalg.norm(x) + 1e-12
    c = num / norma
    k = int(np.argmax(c))  # o primeiro maior, do atraso mais negativo para o mais positivo
    return float(c[k]), a + k - i0


def confere(render, caminho, tolerancia=2.0, fps=30.0):
    arq = os.path.join(caminho, 'index.html') if os.path.isdir(caminho) else caminho
    pasta = os.path.dirname(os.path.abspath(arq))
    with open(arq, encoding='utf-8') as f:
        html = re.sub(r'<!--.*?-->', '', f.read(), flags=re.S)  # o navegador não toca o que está comentado
        tags = [t for t in re.findall(r'<audio\b[^>]*>', html) if atributo(t, 'data-papel') != 'trilha']
    y = audio_do_render(render)
    inicios = [(atributo(t, 'src'), float(atributo(t, 'data-start', 0))) for t in tags]
    saida = []
    for t in tags:
        ini, d, src = float(atributo(t, 'data-start', 0)), float(atributo(t, 'data-duration')), atributo(t, 'src')
        ms = float(atributo(t, 'data-media-start', 0))
        x, sr = sf.read(os.path.join(pasta, src), always_2d=True)
        x = x.mean(1)
        x = soxr.resample(x, sr, SR) if sr != SR else x
        x = x[int(ms * SR):int((ms + d) * SR)]
        # a janela de 0,4 s em volta do pico do arquivo (o começo de um riser é quase mudo)
        pk = int(np.argmax(np.abs(x)))
        a0 = max(0, min(pk - int(JANELA / 2 * SR), len(x) - int(JANELA * SR)))
        x = x[a0:a0 + int(min(d, JANELA) * SR)]
        vizinho = min([abs(s - ini) for f, s in inicios if f == src and s != ini] or [1.0])
        i0, R = int(ini * SR) + a0, int(min(RAIO_MAX, 0.45 * vizinho) * SR)
        melhor, lag = correlaciona(y, x, i0, R)
        q = lag / SR * fps
        saida.append({'id': atributo(t, 'id', src), 'erro_ms': round(lag / SR * 1000, 1), 'erro_quadros': round(q, 2),
                      'correlacao': round(melhor, 3), 'ok': abs(q) <= tolerancia})
    return saida


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    args = sys.argv[1:]
    if len(args) < 2 or args[0].startswith('--'):
        print(__doc__)
        sys.exit(2)
    valor = lambda n, d: float(args[args.index(n) + 1]) if n in args else d
    tol = valor('--tolerancia', 2.0)
    r = confere(args[0], args[1], tol, valor('--fps', 30.0))
    for c in r:
        print(f"{'ok  ' if c['ok'] else 'FORA'} {c['id']:26s} {c['erro_ms']:+7.1f} ms ({c['erro_quadros']:+5.1f} q)  correlação {c['correlacao']:.2f}")
    fora = sum(not c['ok'] for c in r)
    print(f'\n{fora} fora de {tol:g} quadros')
    sys.exit(1 if fora else 0)


if __name__ == '__main__':
    main()
