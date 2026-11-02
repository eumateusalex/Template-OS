"""O tom da faixa e dos sons com altura: a medida da trilha no tom.

Módulo do `medir_audio.py`, que dá a linha de comando:

    python medir_audio.py tom <arquivo>            # tom, modo, relativo, afinação em cents, o aviso
    python medir_audio.py nota <arquivo>...        # a nota de cada efeito, o quanto tem altura, a origem
    python medir_audio.py casa "<tom>" <nota>[:maior|menor|sem_terca]   # o som serve na faixa?

A regra: uma tonalidade menor e a maior 3 semitons acima têm as mesmas sete notas;
numa faixa menor servem sons menores no tom, maiores no relativo maior e sons sem terça; nunca
o modo oposto na mesma tônica. Afinação acima de ±20 cents desafina todo tonal.

O croma vai de 55 Hz a 2 kHz; o tom sai pela correlação com os perfis de Krumhansl e Kessler,
os 24 tons. Quando o primeiro e o segundo candidato são relativos com diferença abaixo de 0,1,
avisa (o tom e o relativo empatados se conferem no ouvido).
Só numpy e o ffmpeg do PATH, como o `medir_audio.py`.
"""
import re

import numpy as np

from medir_audio import TAXA, carrega

NOTAS = ["Dó", "Dó#", "Ré", "Ré#", "Mi", "Fá", "Fá#", "Sol", "Sol#", "Lá", "Lá#", "Si"]
# Krumhansl e Kessler (1982), tônica no índice 0
MAIOR = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MENOR = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
AFINACAO_MAX = 20


def espectro(s, janela=8192, passo=4096):
    """a magnitude média por bin, das janelas com som (o silêncio não vota)"""
    if len(s) < janela:
        s = np.pad(s, (0, janela - len(s)))
    w = np.hanning(janela)
    quadros = [s[i:i + janela] * w for i in range(0, len(s) - janela + 1, passo)]
    mags = np.abs(np.fft.rfft(np.array(quadros), axis=1))
    energia = mags.sum(axis=1)
    vivos = mags[energia > energia.max() * 0.05] if energia.max() > 0 else mags
    return np.fft.rfftfreq(janela, 1 / TAXA), vivos.mean(axis=0)


def croma(freqs, mag, lo=55.0, hi=2000.0):
    sel = (freqs >= lo) & (freqs <= hi)
    f, m = freqs[sel], mag[sel] ** 2
    midi = 69 + 12 * np.log2(f / 440.0)
    classe = np.round(midi).astype(int) % 12
    c = np.bincount(classe, weights=m, minlength=12)
    return c / c.sum() if c.sum() > 0 else c


def afinacao(freqs, mag, lo=55.0, hi=2000.0):
    """o desvio médio, em cents, dos picos do espectro contra a afinação igual de Lá 440"""
    sel = (freqs >= lo) & (freqs <= hi)
    f, m = freqs[sel], mag[sel]
    picos = [i for i in range(1, len(m) - 1) if m[i] > m[i - 1] and m[i] >= m[i + 1] and m[i] > m.max() * 0.1]
    if not picos:
        return 0.0
    # o pico refinado pela parábola dos três bins, para o cent não ficar preso ao bin
    df = f[1] - f[0]
    fs = []
    for i in picos:
        a, b, c = np.log(m[i - 1] + 1e-12), np.log(m[i] + 1e-12), np.log(m[i + 1] + 1e-12)
        fs.append(f[i] + 0.5 * (a - c) / (a - 2 * b + c) * df)
    fs = np.array(fs)
    midi = 69 + 12 * np.log2(fs / 440.0)
    desvio = (midi - np.round(midi)) * 100
    return float(np.average(desvio, weights=m[picos]))


def tom_do_croma(c):
    notas = []
    for t in range(12):
        for nome, perfil in (("maior", MAIOR), ("menor", MENOR)):
            notas.append((float(np.corrcoef(c, np.roll(perfil, t))[0, 1]), t, nome))
    notas.sort(reverse=True)
    return notas


def relativo(tonica, modo):
    return ((tonica + 3) % 12, "maior") if modo == "menor" else ((tonica - 3) % 12, "menor")


def mede_faixa(caminho):
    freqs, mag = espectro(carrega(caminho))
    cands = tom_do_croma(croma(freqs, mag))
    (r1, t1, m1), (r2, t2, m2) = cands[0], cands[1]
    cents = afinacao(freqs, mag)
    avisos = []
    if relativo(t1, m1) == (t2, m2) and r1 - r2 < 0.1:
        avisos.append(f"o tom e o relativo estão perto ({NOTAS[t1]} {m1} {r1:.2f}, {NOTAS[t2]} {m2} {r2:.2f}): confira no ouvido")
    if abs(cents) > AFINACAO_MAX:
        avisos.append(f"a faixa está {cents:+.0f} cents fora da afinação de Lá 440: todo tonal vai desafinar; troque de faixa")
    rt, rm = relativo(t1, m1)
    return {"arquivo": caminho, "tom": f"{NOTAS[t1]} {m1}", "tonica": t1, "modo": m1, "relativo": f"{NOTAS[rt]} {rm}",
            "certeza": round(r1, 3), "segundo": f"{NOTAS[t2]} {m2} ({r2:.2f})", "afinacao_cents": round(cents, 1), "avisos": avisos}


def mede_nota(caminho):
    """a nota dominante de um efeito e o quanto ele tem altura (conc: a parte da energia nas duas
    classes mais fortes; 0,17 é ruído, perto de 1 é nota clara)"""
    # a janela longa (caixas de 0,67 Hz) separa os semitons do grave: a 55 Hz um semitom tem 3,3 Hz, e
    # a de 4096 dava Lá# ao sub em Lá e ao em Si. O som curto entra com zeros, que não mudam o croma
    freqs, mag = espectro(carrega(caminho), janela=32768, passo=4096)
    c = croma(freqs, mag)
    ordem = np.argsort(c)[::-1]
    return {"arquivo": caminho, "nota": NOTAS[int(ordem[0])], "classe": int(ordem[0]),
            "conc": round(float(c[ordem[0]] + c[ordem[1]]), 2), "origem": origem_do_nome(caminho)}


def serve(tonica, modo, nota, tipo="sem_terca"):
    """o som de tônica `nota` e do tipo dado (maior, menor, sem_terca) serve na faixa?"""
    escala = [0, 2, 4, 5, 7, 9, 11] if modo == "maior" else [0, 2, 3, 5, 7, 8, 10]
    if (nota - tonica) % 12 not in escala:
        return False, f"{NOTAS[nota]} não é nota da escala de {NOTAS[tonica]} {modo}"
    if tipo == "sem_terca":
        return True, "sem terça, serve em qualquer grau da escala"
    if nota == tonica and tipo != modo:
        return False, f"{NOTAS[nota]} {tipo} na tônica de uma faixa {modo}: as terças brigam"
    rt, rm = relativo(tonica, modo)
    if (nota, tipo) in ((tonica, modo), (rt, rm)):
        return True, "no tom ou no relativo"
    return False, f"{NOTAS[nota]} {tipo} fora do tom e do relativo; use um som sem terça"


def origem_do_nome(nome):
    """de onde o arquivo do pacote parece vir, pelo nome (HIPÓTESE):
    MA_ ou _source_ = Motion Array; ES_ = Epidemic Sound; um id de 11 letras e números do YouTube no
    fim = baixado do YouTube; o resto, do pacote do usuário"""
    base = nome.replace("\\", "/").split("/")[-1]
    if base.startswith("MA_") or "_source_" in base:
        return "motion-array"
    if base.startswith("ES_"):
        return "epidemic"
    m = re.search(r"-([A-Za-z0-9_-]{11})(-\d+)?\.\w+$", base)
    if m and re.search(r"\d", m.group(1)) and re.search(r"[A-Za-z]", m.group(1)):
        return "youtube"
    return "pacote"
