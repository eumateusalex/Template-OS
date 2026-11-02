"""A régua do tom.py e dos modos tom, nota e casa do medir_audio.py: sinais sintéticos com o
tom plantado, e o defeito de cada um. Sem rede, sem arquivo de fora.

    python -I teste_tom.py
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
import tom  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")

testes = falhas = 0


def ok(cond, msg):
    global testes, falhas
    testes += 1
    print(("ok   " if cond else "FALHA") + " " + msg)
    if not cond:
        falhas += 1


TAXA = 44100
pasta = tempfile.mkdtemp(prefix="tom-")


def nota(midi, dur, cents=0.0):
    f = 440.0 * 2 ** ((midi - 69 + cents / 100) / 12)
    t = np.arange(int(dur * TAXA)) / TAXA
    env = np.minimum(1, t / 0.02) * np.exp(-t * 1.5)
    return sum(np.sin(2 * np.pi * f * k * t) / k for k in range(1, 5)) * env


def grava(nome, sinal):
    caminho = os.path.join(pasta, nome)
    s = (sinal / (np.abs(sinal).max() + 1e-9) * 0.8 * 32767).astype(np.int16)
    with wave.open(caminho, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(TAXA)
        w.writeframes(s.tobytes())
    return caminho


def progressao(acordes, cents=0.0, dur=1.2):
    """acordes como listas de midi; o baixo uma oitava abaixo da fundamental"""
    partes = []
    for ac in acordes:
        partes.append(sum(nota(m, dur, cents) for m in ac) + 0.8 * nota(ac[0] - 12, dur, cents))
    return np.concatenate(partes * 3)


# Lá menor: i iv v i (Am Dm Em Am) e a escala natural por cima
Am, Dm, Em, F, C, G = [57, 60, 64], [62, 65, 69], [64, 67, 71], [53, 57, 60], [48, 52, 55], [55, 59, 62]
la_menor = grava("la-menor.wav", progressao([Am, Dm, Em, Am]))
r = tom.mede_faixa(la_menor)
ok(r["tom"] == "Lá menor", f"faixa em Lá menor (Am Dm Em Am) mede Lá menor ({r['tom']}, certeza {r['certeza']}, segundo {r['segundo']})")
ok(r["relativo"] == "Dó maior", f"o relativo de Lá menor é Dó maior ({r['relativo']})")
ok(abs(r["afinacao_cents"]) <= 10 and not any("cents" in a for a in r["avisos"]), f"afinada: {r['afinacao_cents']} cents, sem aviso")

# Ré maior: I IV V I
D, Gm, A = [62, 66, 69], [55, 59, 62], [57, 61, 64]
re_maior = grava("re-maior.wav", progressao([D, Gm, A, D]))
r = tom.mede_faixa(re_maior)
ok(r["tom"] == "Ré maior", f"faixa em Ré maior (D G A D) mede Ré maior ({r['tom']}, certeza {r['certeza']})")

# o defeito: a mesma faixa 40 cents acima reprova pela afinação
desafinada = grava("desafinada.wav", progressao([Am, Dm, Em, Am], cents=40))
r = tom.mede_faixa(desafinada)
ok(any("cents" in a for a in r["avisos"]) and r["afinacao_cents"] > 20, f"40 cents acima reprova pela afinação ({r['afinacao_cents']} cents)")

# a nota dominante e o quanto o som tem altura: um ping em Mi e um ruído
ping = grava("ping-mi.wav", nota(64, 2.0) + 0.5 * nota(76, 2.0))
n = tom.mede_nota(ping)
ok(n["nota"] == "Mi" and n["conc"] >= 0.7, f"o ping em Mi mede Mi com altura clara ({n['nota']}, conc {n['conc']})")
# o grave (o sub): a 55 Hz um semitom tem 3,3 Hz, e a janela curta (caixas de 5,4 Hz) dava Lá# ao
# sub em Lá e ao em Fá (medido em subs sintetizados)
def sub(midi, dur=1.0):
    f = 440.0 * 2 ** ((midi - 69) / 12)
    t = np.arange(int(dur * TAXA)) / TAXA
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * np.minimum(1, t / 0.01) * np.exp(-t * 3)


for midi, esperado in [(33, "Lá"), (34, "Lá#"), (35, "Si")]:
    n = tom.mede_nota(grava(f"sub-{midi}.wav", sub(midi)))
    ok(n["nota"] == esperado, f"o sub em {esperado} 1 mede {esperado} ({n['nota']}, conc {n['conc']})")
rng = np.random.default_rng(7)
ruido = grava("ruido.wav", rng.standard_normal(TAXA * 2))
n = tom.mede_nota(ruido)
ok(n["conc"] < 0.35, f"o ruído (whoosh) não tem altura (conc {n['conc']})")

# a regra do relativo: numa faixa em Lá menor
LA, DO, MI = 9, 0, 4
ok(tom.serve(LA, "menor", DO, "maior")[0], "Dó maior serve em Lá menor (o relativo)")
ok(tom.serve(LA, "menor", LA, "menor")[0], "Lá menor serve em Lá menor (o tom)")
# o motivo também se cobra: sem a regra da tônica, o som cai no "fora do tom" genérico
ok(not tom.serve(LA, "menor", LA, "maior")[0] and "terças brigam" in tom.serve(LA, "menor", LA, "maior")[1],
   f"Lá maior em Lá menor reprova pelas terças: {tom.serve(LA, 'menor', LA, 'maior')[1]}")
ok(tom.serve(LA, "menor", MI, "sem_terca")[0], "Mi sem terça serve em Lá menor (nota da escala)")
ok(not tom.serve(LA, "menor", 1, "sem_terca")[0], "Dó# sem terça reprova em Lá menor (fora da escala)")

# a origem pelo nome (o aviso para anúncio e cliente)
ok(tom.origem_do_nome("DIGITAL/Interface_Impacts_source_1883092/MA_Equilibrio_InterfaceImpacts_01.wav") == "motion-array", "MA_ e _source_ são Motion Array")
ok(tom.origem_do_nome("RISER/ES_Riser Suction 5 - SFX Producer.mp3") == "epidemic", "ES_ é Epidemic Sound")
ok(tom.origem_do_nome("VARIAVEIS/Microsoft Windows XP Error - Sound Effect (HD)-0lhhrUuw2N8-1.mp3") == "youtube", "o id do YouTube no fim do nome é YouTube")
ok(tom.origem_do_nome("WOOSH/Whoosh.wav") == "pacote", "o resto é do pacote do usuário")

# a linha de comando do medir_audio.py, sob python -I (o módulo do tom se acha ao lado)
def cli(*args):
    r = subprocess.run([sys.executable, "-I", os.path.join(AQUI, "medir_audio.py"), *args], capture_output=True)
    return r.returncode, r.stdout.decode("utf-8")


cod, out = cli("tom", la_menor)
ok(cod == 0 and json.loads(out)["tom"] == "Lá menor", f"medir_audio.py tom mede Lá menor pela linha de comando (código {cod})")
cod, _ = cli("tom", desafinada)
ok(cod == 0, f"medir_audio.py tom avisa a faixa desafinada e sai 0 (calibragem) (código {cod})")
cod, out = cli("casa", "Lá menor", "Lá:maior")
ok(cod == 0 and out.startswith("não serve (aviso)"), f"medir_audio.py casa avisa que Lá maior não serve em Lá menor ({out.strip()})")
cod, out = cli("nota", ping)
ok(cod == 0 and json.loads(out)["nota"] == "Mi" and json.loads(out)["origem"] == "pacote", f"medir_audio.py nota diz a nota e a origem ({out.strip()[-60:]})")

shutil.rmtree(pasta, ignore_errors=True)
print(f"\n# tests {testes}\n# fail {falhas}")
sys.exit(1 if falhas else 0)
