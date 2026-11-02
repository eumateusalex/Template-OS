"""A régua dos modos conferir e drop do medir_audio.py: sinais sintéticos com o defeito plantado.
Sem rede, sem arquivo de fora.

    python -I teste_audio.py

conferir: o volume certo passa; o pico verdadeiro acima de -1 dBTP reprova mesmo com o pico de
amostra abaixo (o caso que o limitador de amostra deixa passar); o integrado baixo reprova; o
silêncio no fim e o buraco no meio avisam.
drop: o contraste de 4,5 dB passa; o de 1 dB avisa.
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import wave

import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import medir_audio as m  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
testes = falhas = 0


def ok(cond, msg):
    global testes, falhas
    testes += 1
    print(("ok   " if cond else "FALHA") + " " + msg)
    if not cond:
        falhas += 1


TAXA = 44100
pasta = tempfile.mkdtemp(prefix="audio-")


def grava(nome, sinal):
    caminho = os.path.join(pasta, nome)
    s = np.clip(sinal, -1, 1)
    with wave.open(caminho, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(TAXA)
        w.writeframes((s * 32767).astype(np.int16).tobytes())
    return caminho


def tom(dur, amp, f=440.0):
    t = np.arange(int(dur * TAXA)) / TAXA
    return amp * np.sin(2 * np.pi * f * t)


def silencio(dur):
    return np.zeros(int(dur * TAXA))


# a amplitude que dá -14 LUFS num seno de 440 Hz, medida (o filtro K muda pouco a 440 Hz)
ref = grava("ref.wav", tom(6, 0.1))
i_ref, _ = m.volume(ref)
amp = 0.1 * 10 ** ((-14 - i_ref) / 20)

bom = m.mede_conferir(grava("bom.wav", tom(6, amp)))
ok(bom["ok"] and not bom["avisos"] and -14.5 <= bom["lufs"] <= -13.5, f"o volume certo passa ({bom['lufs']} LUFS, {bom['pico_dbtp']} dBTP)")

# o pico entre amostras: um seno em 1/4 da taxa com fase de 45 graus tem as amostras a 0,707 do pico
t = np.arange(int(0.05 * TAXA)) / TAXA
rajada = 1.1 * np.sin(2 * np.pi * (TAXA / 4) * t + np.pi / 4)
quente = grava("quente.wav", np.concatenate([tom(3, amp), rajada, tom(3, amp)]))
pico_amostra = 20 * np.log10(np.abs(rajada).max())
r = m.mede_conferir(quente)
ok(pico_amostra < -1 and r["pico_dbtp"] > -1 and any("pico verdadeiro" in e for e in r["erros"]),
   f"o pico verdadeiro acima de -1 dBTP reprova com o pico de amostra abaixo (amostra {pico_amostra:.1f} dBFS, verdadeiro {r['pico_dbtp']} dBTP)")

baixo = m.mede_conferir(grava("baixo.wav", tom(6, amp / 4)))
ok(baixo["ok"] and any("integrado" in a for a in baixo["avisos"]), f"o integrado baixo avisa, sem reprovar (calibragem) ({baixo['lufs']} LUFS)")

fim = m.mede_conferir(grava("fim.wav", np.concatenate([tom(5, amp), silencio(1.0)])))
ok(fim["ok"] and abs(fim["silencio_fim_s"] - 1.0) <= 0.1 and any("silêncio no fim" in a for a in fim["avisos"]),
   f"1 s de silêncio no fim avisa ({fim['silencio_fim_s']} s) e não reprova o volume")
curto = m.mede_conferir(grava("fim-curto.wav", np.concatenate([tom(5, amp), silencio(0.3)])))
ok(not any("silêncio no fim" in a for a in curto["avisos"]), f"0,3 s no fim não avisa ({curto['silencio_fim_s']} s)")

buraco = m.mede_conferir(grava("buraco.wav", np.concatenate([tom(3, amp), silencio(0.5), tom(3, amp)])))
ok(len(buraco["buracos"]) == 1 and abs(buraco["buracos"][0]["em_s"] - 3.0) <= 0.1 and abs(buraco["buracos"][0]["dur_s"] - 0.5) <= 0.1,
   f"o buraco de 0,5 s no meio avisa ({buraco['buracos']})")
ok(not bom["buracos"] and not fim["buracos"], "o silêncio do fim não conta como buraco no meio")

# o drop: 6 s num nível, 6 s no outro
d45 = m.mede_drop(grava("drop45.wav", np.concatenate([tom(6, amp), tom(6, amp * 10 ** (4.5 / 20))])), 6.0)
ok(d45["ok"] and abs(d45["contraste_db"] - 4.5) <= 0.3, f"o drop de +4,5 dB passa ({d45['contraste_db']} dB)")
d1 = m.mede_drop(grava("drop1.wav", np.concatenate([tom(6, amp), tom(6, amp * 10 ** (1 / 20))])), 6.0)
ok(not d1["ok"] and abs(d1["contraste_db"] - 1.0) <= 0.3 and d1["avisos"], f"o drop de +1 dB avisa ({d1['contraste_db']} dB)")

# a linha de comando: conferir sai 1 no que reprova e 0 no que passa
saida = lambda *a: subprocess.run([sys.executable, "-I", os.path.join(AQUI, "medir_audio.py"), *a], capture_output=True)
r_bom, r_baixo, r_quente = (saida("conferir", os.path.join(pasta, n)) for n in ("bom.wav", "baixo.wav", "quente.wav"))
ok(r_bom.returncode == 0 and r_baixo.returncode == 0 and r_quente.returncode == 1 and json.loads(r_bom.stdout.decode("utf-8"))["ok"],
   f"medir_audio.py conferir sai 0 no bom e no baixo (o integrado avisa) e 1 no pico verdadeiro ({r_bom.returncode}, {r_baixo.returncode}, {r_quente.returncode})")

shutil.rmtree(pasta, ignore_errors=True)
print(f"\n# tests {testes}\n# fail {falhas}")
sys.exit(1 if falhas else 0)
