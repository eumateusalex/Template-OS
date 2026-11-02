"""Esvazia a trilha antes do drop: desce o ganho em rampa de dB até o vazio pedido e volta seco no drop.

    python esvazia.py <entrada.wav> <saida.wav> <inicio_s> <drop_s> <db>

Os tempos são os do arquivo da trilha (o tempo do vídeo + o data-media-start dela). O `db` é a
descida no fim da rampa, negativa (-6 é a metade da pressão). A rampa é linear em dB, para a
descida soar linear ao ouvido; no drop o ganho volta a 1 de uma amostra para a outra. É o
"esvazie o arranjo antes" do som.md, para o drop ganhar os 4 a 5 dB de contraste.
Grava em PCM de 24 bits. Pede numpy e soundfile.
"""
import sys

import numpy as np
import soundfile as sf


def ganho(n, sr, inicio, drop, db):
    if not (0 <= inicio < drop):
        raise ValueError(f'o começo da rampa ({inicio} s) precisa vir antes do drop ({drop} s)')
    if db >= 0:
        raise ValueError(f'a descida é em dB negativos ({db} dB não esvazia)')
    a, b = int(inicio * sr), int(drop * sr)
    if b > n:
        raise ValueError(f'o drop ({drop} s) passa do fim da trilha ({n / sr:.2f} s)')
    g = np.ones(n)
    g[a:b] = 10 ** (np.linspace(0, db, b - a) / 20)
    return g


def esvazia(entrada, saida, inicio, drop, db):
    x, sr = sf.read(entrada, always_2d=True)
    x = x * ganho(len(x), sr, inicio, drop, db)[:, None]
    sf.write(saida, x, sr, subtype='PCM_24')


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    args = sys.argv[1:]
    if len(args) != 5:
        print(__doc__)
        sys.exit(2)
    ent, sai = args[0], args[1]
    try:
        ini, drop, db = float(args[2]), float(args[3]), float(args[4])
        esvazia(ent, sai, ini, drop, db)
    except ValueError as e:
        print(e)
        sys.exit(1)
    print(f'esvaziada de {ini:g} a {drop:g} s, até {db:g} dB; no drop volta seco')


if __name__ == '__main__':
    main()
