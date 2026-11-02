"""A régua do esvazia.py: uma trilha sintética de nível constante, esvaziada, e o ganho lido amostra
a amostra. Sem rede, sem arquivo de fora.

    python -I teste_esvazia.py

Antes da rampa e depois do drop o nível não muda; a rampa chega no vazio pedido e é linear em dB
(o meio dela fica na metade dos dB, não na metade da amplitude); no drop volta seco, de uma
amostra para a outra; o pedido errado (drop antes do começo, dB positivo, drop depois do fim) não
grava nada e sai 1.
"""
import os
import shutil
import subprocess
import sys
import tempfile

import numpy as np
import soundfile as sf

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.stdout.reconfigure(encoding='utf-8')
testes = falhas = 0


def ok(cond, msg):
    global testes, falhas
    testes += 1
    print(('ok   ' if cond else 'FALHA') + ' ' + msg)
    if not cond:
        falhas += 1


SR = 44100
pasta = tempfile.mkdtemp(prefix='esvazia-')
cli = lambda *a: subprocess.run([sys.executable, '-I', os.path.join(AQUI, 'esvazia.py'), *map(str, a)], capture_output=True)

# a trilha: 6 s em nível constante, estéreo, com o lado direito na metade (o ganho se lê pela razão)
NIVEL = 0.5
x = np.full((6 * SR, 2), NIVEL)
x[:, 1] *= 0.5
ent, sai = os.path.join(pasta, 'trilha.wav'), os.path.join(pasta, 'esvaziada.wav')
sf.write(ent, x, SR, subtype='FLOAT')
r = cli(ent, sai, 2.0, 4.0, -9)
y, sr = sf.read(sai, always_2d=True)
g = y[:, 0] / NIVEL
gdb = lambda t: 20 * np.log10(g[int(t * SR)])
ok(r.returncode == 0 and sr == SR and y.shape == x.shape and sf.info(sai).subtype == 'PCM_24',
   f"grava na mesma taxa, estéreo, em 24 bits ({r.returncode}, {sr}, {y.shape}, {sf.info(sai).subtype})")
ok(np.allclose(g[:2 * SR], 1, atol=1e-5) and np.allclose(g[4 * SR:], 1, atol=1e-5),
   'antes da rampa e depois do drop o nível não muda')
ok(abs(gdb(4.0 - 1 / SR) + 9) <= 0.05, f"a rampa chega no vazio pedido logo antes do drop ({gdb(4.0 - 1 / SR):.2f} dB, pedido -9)")
ok(abs(gdb(3.0) + 4.5) <= 0.05, f"a rampa é linear em dB: o meio fica em -4,5 dB ({gdb(3.0):.2f})")
ok(abs(gdb(2.5) + 2.25) <= 0.05, f"e o primeiro quarto em -2,25 dB ({gdb(2.5):.2f})")
salto = g[4 * SR] - g[4 * SR - 1]
ok(salto > 0.6, f"no drop volta seco, de uma amostra para a outra (o ganho sobe {salto:.2f} em uma amostra)")
ok(np.allclose(y[:, 1], y[:, 0] * 0.5, atol=1e-5), 'os dois canais levam o mesmo ganho')

# o pedido errado: nada se grava e sai 1 com o motivo
for args, motivo in [((4.0, 2.0, -9), 'antes do drop'), ((2.0, 4.0, 3), 'negativos'), ((2.0, 8.0, -9), 'passa do fim')]:
    errado = os.path.join(pasta, f'errado-{motivo[:5]}.wav')
    r = cli(ent, errado, *args)
    out = r.stdout.decode('utf-8')
    ok(r.returncode == 1 and motivo in out and not os.path.exists(errado), f"{args} reprova sem gravar ({out.strip()})")
ok(cli(ent, sai).returncode == 2, 'sem os cinco argumentos mostra o uso e sai 2')

shutil.rmtree(pasta, ignore_errors=True)
print(f'\n# tests {testes}\n# fail {falhas}')
sys.exit(1 if falhas else 0)
