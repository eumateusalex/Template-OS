"""A régua do simula_mix.py: peças mínimas (um index.html e WAVs sintéticos) com o defeito plantado.
Sem rede, sem arquivo de fora.

    python -I teste_simula_mix.py

O empilhamento estoura o teto e aponta a janela e os clipes; o pico entre amostras (o que o
limitador de amostra deixa passar) estoura com o pico de amostra abaixo; o data-volume, o
data-media-start e o data-fade-in entram na conta; a linha de comando sai 1 no que estoura.
"""
import os
import shutil
import subprocess
import sys
import tempfile

import numpy as np
import soundfile as sf

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import simula_mix as m  # noqa: E402

sys.stdout.reconfigure(encoding='utf-8')
testes = falhas = 0


def ok(cond, msg):
    global testes, falhas
    testes += 1
    print(('ok   ' if cond else 'FALHA') + ' ' + msg)
    if not cond:
        falhas += 1


SR = 48000
raiz = tempfile.mkdtemp(prefix='simula-mix-')


def db(x):
    return 20 * np.log10(x)


def seno(dur, amp, f=440.0, fase=0.0):
    t = np.arange(int(dur * SR)) / SR
    return amp * np.sin(2 * np.pi * f * t + fase)


def peca(nome, sons, audios, dur=4.0):
    """sons: {arquivo: sinal}; audios: os atributos de cada <audio>"""
    pasta = os.path.join(raiz, nome)
    os.makedirs(os.path.join(pasta, 'ativos'))
    for arq, s in sons.items():
        sf.write(os.path.join(pasta, 'ativos', arq), s, SR, subtype='FLOAT')
    tags = ''.join('<audio ' + ' '.join(f'{k}="{v}"' for k, v in a.items()) + '></audio>\n' for a in audios)
    with open(os.path.join(pasta, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(f'<html><body><div id="root" data-composition-id="main" data-start="0" data-duration="{dur}" data-width="1080" data-height="1920">\n{tags}</div></body></html>')
    return pasta


def clip(id, src, start, dur, **extra):
    return {'id': id, 'class': 'clip', 'data-start': start, 'data-duration': dur, 'src': f'ativos/{src}', **extra}


A6 = 10 ** (-6 / 20)  # um seno a -6 dBFS

# a peça limpa: dois efeitos a -6 dBFS em instantes diferentes
limpa = peca('limpa', {'a.wav': seno(0.5, A6), 'b.wav': seno(0.5, A6, 660)},
             [clip('sfx-a', 'a.wav', 1.0, 0.5), clip('sfx-b', 'b.wav', 2.5, 0.5)])
r = m.simula(limpa)
ok(r['ok'] and abs(r['pico_dbtp'] + 6) <= 0.3 and r['baixa_db'] == 0, f"a peça limpa passa no teto (-6 dBFS, mede {r['pico_dbtp']:.2f} dBTP)")

# o empilhamento: os dois em fase no mesmo instante somam +6 dB e passam do teto de -1
empilha = peca('empilha', {'a.wav': seno(0.5, A6), 'b.wav': seno(0.5, A6)},
               [clip('sfx-a', 'a.wav', 2.0, 0.5), clip('sfx-b', 'b.wav', 2.0, 0.5), clip('sfx-c', 'a.wav', 0.5, 0.3)])
r = m.simula(empilha)
pior = r['piores'][0]
ok(not r['ok'] and abs(r['pico_dbtp']) <= 0.3 and abs(r['baixa_db'] - (r['pico_dbtp'] + 1)) < 1e-9,
   f"o empilhamento de dois a -6 estoura (mede {r['pico_dbtp']:.2f} dBTP; o render baixaria {r['baixa_db']:.2f} dB)")
ok(2.0 <= r['pico_em_s'] < 2.5 and set(pior['tocam']) == {'sfx-a', 'sfx-b'},
   f"a pior janela é a do empilhamento e diz quem toca nela ({r['pico_em_s']} s: {pior['tocam']})")
# o integrado se mede depois da baixa do render: o da mixagem gravada menos a baixa
grava = os.path.join(raiz, 'empilha.wav')
r = m.simula(empilha, grava=grava)
import pyloudnorm  # noqa: E402
x, sr = sf.read(grava, always_2d=True)
cru = pyloudnorm.Meter(sr).integrated_loudness(x)
ok(len(x) == 4 * SR and sr == SR and abs(r['lufs'] - (cru - r['baixa_db'])) <= 0.05,
   f"--grava grava os 4 s da peça e o integrado sai depois da baixa ({r['lufs']:.2f} = {cru:.2f} - {r['baixa_db']:.2f})")

# o pico entre amostras: um seno em 1/4 da taxa a 45 graus tem as amostras a 0,707 do pico
rajada = np.concatenate([np.zeros(SR // 10), seno(0.05, 10 ** (-0.5 / 20), SR / 4, np.pi / 4), np.zeros(SR // 10)])
amostra = db(np.abs(rajada).max())
quente = peca('quente', {'r.wav': rajada}, [clip('sfx-rajada', 'r.wav', 1.0, 0.25)])
r = m.simula(quente)
ok(amostra < -1 and r['pico_dbtp'] > -1 and not r['ok'],
   f"o pico verdadeiro passa do teto com o pico de amostra abaixo (amostra {amostra:.1f} dBFS, verdadeiro {r['pico_dbtp']:.2f} dBTP)")

# o data-volume entra na conta: o mesmo empilhamento a 0,25 desce 12 dB
r = m.simula(peca('volume', {'a.wav': seno(0.5, A6)},
                  [clip('sfx-a', 'a.wav', 2.0, 0.5, **{'data-volume': 0.25}), clip('sfx-b', 'a.wav', 2.0, 0.5, **{'data-volume': 0.25})]))
ok(r['ok'] and abs(r['pico_dbtp'] + 12) <= 0.3, f"o data-volume 0,25 baixa 12 dB ({r['pico_dbtp']:.2f} dBTP)")

# o data-media-start: o arquivo tem 1 s a 0 dBFS e depois -12; o recorte que começa em 1 s fica no -12
dois = np.concatenate([seno(1.0, 1.0), seno(1.0, 10 ** (-12 / 20))])
r = m.simula(peca('media', {'d.wav': dois}, [clip('trilha', 'd.wav', 0, 1.0, **{'data-media-start': 1.0})]))
ok(r['ok'] and abs(r['pico_dbtp'] + 12) <= 0.3, f"o data-media-start pula o trecho alto ({r['pico_dbtp']:.2f} dBTP)")

# o data-fade-in: 1 s de fade num seno a 0 dBFS, a janela do começo fica bem abaixo do fim
r = m.simula(peca('fade', {'f.wav': seno(2.0, 0.9)}, [clip('trilha', 'f.wav', 0, 2.0, **{'data-fade-in': 1.0})]), janelas=40)
por_t = {p['em_s']: p['dbtp'] for p in r['piores']}
ok(por_t[0.0] < por_t[1.5] - 10 and abs(por_t[1.5] - db(0.9)) <= 0.3,
   f"o data-fade-in derruba o começo (0,0 s a {por_t[0.0]:.1f} dBTP, 1,5 s a {por_t[1.5]:.1f})")

# o <audio> dentro de comentário não toca no navegador, e a simulação também o pula
comentado = os.path.join(limpa, 'comentado.html')
with open(os.path.join(limpa, 'index.html'), encoding='utf-8') as f:
    base = f.read()
with open(comentado, 'w', encoding='utf-8') as f:
    f.write(base.replace('</div>', '<!-- o som antigo: <audio id="velho" src="ativos/nao-existe.wav" data-start="2.5" data-duration="0.5"></audio> -->\n</div>'))
try:
    r = m.simula(comentado)
    ok(r['ok'] and abs(r['pico_dbtp'] + 6) <= 0.3, f"o <audio> comentado não entra na mixagem ({r['pico_dbtp']:.2f} dBTP)")
except Exception as e:
    ok(False, f"o <audio> comentado não entra na mixagem (caiu: {type(e).__name__})")

# a peça sem o #root com a duração não segue
sem_root = os.path.join(raiz, 'sem-root.html')
with open(sem_root, 'w', encoding='utf-8') as f:
    f.write('<html><body><audio src="x.wav" data-start="0" data-duration="1"></audio></body></html>')
try:
    m.simula(sem_root)
    erro = ''
except ValueError as e:
    erro = str(e)
ok('#root' in erro, f"sem o #root com data-duration reprova com o motivo ({erro})")

# a linha de comando: 1 no que estoura, 0 no limpo, e aceita o index.html no lugar da pasta
cli = lambda *a: subprocess.run([sys.executable, '-I', os.path.join(AQUI, 'simula_mix.py'), *a], capture_output=True)
r_limpa, r_empilha = cli(os.path.join(limpa, 'index.html')), cli(empilha)
saida = r_empilha.stdout.decode('utf-8')
ok(r_limpa.returncode == 0 and r_empilha.returncode == 1 and 'sfx-a, sfx-b' in saida and 'acima do teto' in saida,
   f"simula_mix.py sai 0 no limpo e 1 no empilhamento, com os clipes da janela ({r_limpa.returncode}, {r_empilha.returncode})")
r_teto = cli(empilha, '--teto', '1.0')
ok(r_teto.returncode == 0, f"--teto 1,0 aceita o mesmo empilhamento ({r_teto.returncode})")

shutil.rmtree(raiz, ignore_errors=True)
print(f'\n# tests {testes}\n# fail {falhas}')
sys.exit(1 if falhas else 0)
