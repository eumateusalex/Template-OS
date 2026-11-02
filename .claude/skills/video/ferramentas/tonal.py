"""A camada tonal da trilha: o drone e o golpe no tom da faixa. Os números moram aqui (DRONE e GOLPE), e o
som-cinematografico.md § 3 aponta para cá.

    python tonal.py drone <saida.wav> (--tom "Lá menor" | --trilha <musica>) --dur <s> [--sobrescrever]
    python tonal.py golpe <saida.wav> (--tom "Lá menor" | --trilha <musica>) [--acento] [--sobrescrever]

O tom vem escrito ou medido na trilha pelo `tom.py` (o mesmo do `medir_audio.py tom`); a trilha mais de
20 cents fora de Lá 440 não serve, porque todo tonal desafina. Os dois sons não têm terça (a tônica, a
quinta e as oitavas), então servem no tom e no relativo.

- drone: a tônica e a quinta, cada uma em duas vozes a ±7 cents, com harmônicos até 2,5 kHz; banda de
  90 Hz a 2,5 kHz; entrada em fade de 4 s e saída de 1 s; −26 LUFS antes do master.
- golpe: a tônica (1,0), a oitava (0,6) e a oitava abaixo (0,2), com a tônica entre 150 e 300 Hz; banda
  de 150 Hz a 2,2 kHz (sem sub); reverb de catedral de 8 s a 55%; −21 LUFS, ou −25 no acento.

Grava WAV de 48 kHz, estéreo, 24 bits, e imprime uma linha JSON com o tom, de onde ele veio, a nota, as
camadas e os LUFS medidos. Nunca sobrescreve sem `--sobrescrever` (mídia fora do git não tem volta).
Pede o Python da mixagem (numpy, scipy, soundfile, soxr, pyloudnorm; o MIXAGEM_PY aponta outro) e, com `--trilha`, o ffmpeg do PATH.
"""
import argparse
import json
import os
import sys
import unicodedata

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy.signal import butter, fftconvolve, sosfiltfilt

AQUI = os.path.dirname(os.path.abspath(__file__))
SR = 48000
# o dono dos números do golpe e do drone (o som-cinematografico.md § 3 aponta para cá)
DRONE = {"banda": (90, 2500), "lufs": -26, "fade": 4.0, "saida": 1.0, "cents": 7, "quinta": 0.7}
GOLPE = {"banda": (150, 2200), "lufs": -21, "lufs_acento": -25, "camadas": ((1, 1.0), (2, 0.6), (0.5, 0.2)),
         "rt60": 8.0, "molhado": 0.55, "seco_s": 4.0}
NOTAS = ["Dó", "Dó#", "Ré", "Ré#", "Mi", "Fá", "Fá#", "Sol", "Sol#", "Lá", "Lá#", "Si"]


class Pedido(Exception):
    pass


def sem_acento(s):
    return "".join(c for c in unicodedata.normalize("NFD", s.lower()) if unicodedata.category(c) != "Mn")


def le_tom(texto):
    partes = texto.strip().rsplit(" ", 1)
    if len(partes) != 2 or partes[1].lower() not in ("menor", "maior"):
        raise Pedido(f'o tom "{texto}" não se lê: escreva a nota e o modo, menor ou maior ("Lá menor", "Dó maior")')
    nomes = [sem_acento(n) for n in NOTAS]
    if sem_acento(partes[0]) not in nomes:
        raise Pedido(f'a nota "{partes[0]}" não existe; as notas são {", ".join(NOTAS)}')
    return nomes.index(sem_acento(partes[0])), partes[1].lower()


def tom_da_trilha(caminho):
    sys.path.insert(0, AQUI)
    from tom import AFINACAO_MAX, mede_faixa
    m = mede_faixa(caminho)
    if abs(m["afinacao_cents"]) > AFINACAO_MAX:
        raise Pedido(f"a trilha está {m['afinacao_cents']:+.0f} cents fora de Lá 440: todo tonal vai desafinar; troque de faixa")
    return m["tonica"], m["modo"], m["avisos"], m["certeza"]


def no_registro(classe, lo, hi):
    f = 440.0 * 2 ** ((classe - 9) / 12)
    while f >= hi:
        f /= 2
    while f < lo:
        f *= 2
    return f


def banda(x, lo, hi):
    sos = np.vstack([butter(4, lo, "highpass", fs=SR, output="sos"), butter(4, hi, "lowpass", fs=SR, output="sos")])
    return sosfiltfilt(sos, x, axis=0)


def no_nivel(x, lufs):
    # o portão absoluto de −70 LUFS deixa entrar mais cauda quando o nível sobe: algumas passadas assentam
    for _ in range(4):
        x = x * 10 ** ((lufs - pyln.Meter(SR).integrated_loudness(x)) / 20)
    return x


def drone(tonica, dur):
    if dur <= DRONE["fade"] + DRONE["saida"]:
        raise Pedido(f"o drone precisa de mais que os {DRONE['fade']:g} s da entrada e o {DRONE['saida']:g} s da saída ({dur:g} s pedidos)")
    lo, hi = DRONE["banda"]
    f0 = no_registro(tonica, lo, 2 * lo)
    t = np.arange(int(round(dur * SR))) / SR
    rng = np.random.default_rng(7)
    x = np.zeros((len(t), 2))
    camadas = [(f0, 1.0), (f0 * 2 ** (7 / 12), DRONE["quinta"])]
    for base, ganho in camadas:
        for lado, cents in enumerate((-DRONE["cents"], DRONE["cents"])):
            f = base * 2 ** (cents / 1200)
            v = sum(np.sin(2 * np.pi * k * f * t + rng.uniform(0, 2 * np.pi)) / k for k in range(1, int(hi // f) + 1))
            x[:, lado] += 0.75 * ganho * v
            x[:, 1 - lado] += 0.25 * ganho * v
    x *= (10 ** (1.5 * np.sin(2 * np.pi * 0.1 * t) / 20))[:, None]  # a cama respira devagar
    x = banda(x, lo, hi)
    env = np.ones(len(t))
    a, b = int(DRONE["fade"] * SR), int(DRONE["saida"] * SR)
    env[:a] = np.sin(np.linspace(0, np.pi / 2, a)) ** 2
    env[-b:] = np.cos(np.linspace(0, np.pi / 2, b)) ** 2
    return no_nivel(x * env[:, None], DRONE["lufs"]), f0, camadas


def golpe(tonica, acento):
    lo, hi = GOLPE["banda"]
    f0 = no_registro(tonica, lo, 2 * lo)
    n = int(GOLPE["seco_s"] * SR)
    t = np.arange(n) / SR
    seco = np.zeros(n)
    camadas = [(f0 * m, g) for m, g in GOLPE["camadas"]]
    for f, g in camadas:
        for k, (amp, tau) in enumerate(((1.0, 1.4), (0.35, 0.8), (0.15, 0.5), (0.08, 0.3)), start=1):
            seco += g * amp * np.exp(-t / tau) * np.sin(2 * np.pi * k * f * t)
    r = int(0.005 * SR)
    seco[:r] *= np.linspace(0, 1, r)
    # o toque: uma batida curta de ruído na banda, acima da nota, para o pico do golpe ser o ataque (a
    # soma das parciais sozinha só chega ao máximo quando entram em fase, uns 0,1 s depois)
    toque = banda(np.random.default_rng(5).standard_normal(n), lo, hi) * np.exp(-t / 0.012)
    seco += 1.6 * np.abs(seco).max() / np.abs(toque).max() * toque
    # a catedral: ruído com o decaimento de 60 dB em rt60, um por canal (descorrelacionados), energia 1
    tr = np.arange(int(GOLPE["rt60"] * SR)) / SR
    rng = np.random.default_rng(11)
    ir = banda(rng.standard_normal((len(tr), 2)) * (10 ** (-3 * tr / GOLPE["rt60"]))[:, None], lo, hi)
    ir /= np.sqrt((ir ** 2).sum(axis=0))
    molhado = np.stack([fftconvolve(seco, ir[:, c]) for c in range(2)], axis=1)
    x = np.zeros_like(molhado)
    x[:n] += (1 - GOLPE["molhado"]) * seco[:, None]
    molhado *= GOLPE["molhado"]
    # o efeito se posiciona pelo pico: sobre a nota longa a catedral acumula e floresce acima do toque,
    # e o golpe entraria adiantado; o molhado fica 3 dB abaixo do ataque seco, e a cauda segue longa
    ataque = (1 - GOLPE["molhado"]) * np.abs(seco[: int(0.06 * SR)]).max()
    teto = ataque * 10 ** (-3 / 20)
    if np.abs(molhado).max() > teto:
        molhado *= teto / np.abs(molhado).max()
    x += molhado
    x = banda(x, lo, hi)
    fim = int(0.5 * SR)
    x[-fim:] *= np.cos(np.linspace(0, np.pi / 2, fim))[:, None] ** 2
    return no_nivel(x, GOLPE["lufs_acento"] if acento else GOLPE["lufs"]), f0, camadas


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    p = argparse.ArgumentParser(description="o drone e o golpe tonal no tom da faixa")
    p.add_argument("tipo", choices=("drone", "golpe"))
    p.add_argument("saida")
    p.add_argument("--tom")
    p.add_argument("--trilha")
    p.add_argument("--dur", type=float)
    p.add_argument("--acento", action="store_true")
    p.add_argument("--sobrescrever", action="store_true")
    a = p.parse_args()
    try:
        if os.path.exists(a.saida) and not a.sobrescrever:
            raise Pedido(f"{a.saida} já existe: mídia fora do git não tem volta; use outro nome ou --sobrescrever")
        if bool(a.tom) == bool(a.trilha):
            raise Pedido("diga o tom com --tom \"Lá menor\" ou a faixa com --trilha <arquivo> (um dos dois)")
        avisos, certeza = [], None
        if a.tom:
            tonica, modo = le_tom(a.tom)
        else:
            tonica, modo, avisos, certeza = tom_da_trilha(a.trilha)
        if a.tipo == "drone":
            if a.dur is None:
                raise Pedido("o drone pede --dur <s> (até o drop)")
            x, f0, camadas = drone(tonica, a.dur)
        else:
            x, f0, camadas = golpe(tonica, a.acento)
    except Pedido as e:
        print(e)
        sys.exit(1)
    if np.abs(x).max() > 0.89:
        x *= 0.89 / np.abs(x).max()
    sf.write(a.saida, x, SR, subtype="PCM_24")
    print(json.dumps({"arquivo": a.saida, "tipo": a.tipo, "tom": f"{NOTAS[tonica]} {modo}", "de": "tom" if a.tom else "trilha",
                      "certeza": certeza, "nota": NOTAS[tonica], "hz": round(f0, 2),
                      "camadas": [{"hz": round(f, 2), "ganho": g} for f, g in camadas],
                      "lufs": round(pyln.Meter(SR).integrated_loudness(x), 2), "dur": round(len(x) / SR, 2), "avisos": avisos},
                     ensure_ascii=False))


if __name__ == "__main__":
    main()
