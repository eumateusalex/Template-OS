"""A régua do confere_posicao.py: um index.html e um "render" sintético (o WAV, e o MP4 feito dele),
com o efeito fora do lugar plantado. Sem rede, sem arquivo de fora.

    python -I teste_confere_posicao.py

O efeito no lugar passa; o deslocado 4 quadros reprova com o erro medido; o riser (quase mudo no
começo) se mede pelo pico; a cascata de cliques iguais a 4 quadros, atrasada 1 quadro pelo
codificador, não pega a cópia vizinha; a trilha fica fora da conta; o MP4 dá o mesmo veredito.
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
import confere_posicao as m  # noqa: E402

sys.stdout.reconfigure(encoding='utf-8')
testes = falhas = 0


def ok(cond, msg):
    global testes, falhas
    testes += 1
    print(('ok   ' if cond else 'FALHA') + ' ' + msg)
    if not cond:
        falhas += 1


SR = 48000
Q = 1 / 30
raiz = tempfile.mkdtemp(prefix='posicao-')
rng = np.random.default_rng(11)

# os sons: um clique (ruído que decai em 50 ms), um woosh (ruído em sino de 0,3 s) e um riser
# (1 s de ruído que sobe e para no pico)
t50, t20, t30, t1 = (np.arange(int(d * SR)) / SR for d in (0.05, 0.2, 0.3, 1.0))
SONS = {
    'clique.wav': rng.standard_normal(len(t50)) * np.exp(-t50 * 80) * 0.5,
    # o cubo: a cauda de 0,2 s passa dos 4 quadros até o próximo
    'cubo.wav': rng.standard_normal(len(t20)) * np.exp(-t20 * 15) * 0.5,
    'woosh.wav': rng.standard_normal(len(t30)) * np.sin(np.pi * t30 / 0.3) ** 2 * 0.4,
    'riser.wav': rng.standard_normal(len(t1)) * (t1 / 1.0) ** 3 * 0.5,
    'musica.wav': rng.standard_normal(SR * 6) * 0.3,
}


def peca(nome, clipes, render, dur=6.0):
    """clipes: (id, arquivo, data-start); render: (arquivo, instante em que entra de fato no render)"""
    pasta = os.path.join(raiz, nome)
    os.makedirs(os.path.join(pasta, 'ativos'))
    for arq, s in SONS.items():
        sf.write(os.path.join(pasta, 'ativos', arq), s, SR, subtype='FLOAT')
    tags = ['<audio id="trilha" class="clip" data-papel="trilha" data-start="0" data-duration="6" src="ativos/musica.wav"></audio>']
    for id, arq, ini in clipes:
        tags.append(f'<audio id="{id}" class="clip" data-start="{ini:.4f}" data-duration="{len(SONS[arq]) / SR}" data-volume="0.5" src="ativos/{arq}"></audio>')
    with open(os.path.join(pasta, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(f'<html><body><div id="root" data-duration="{dur}">\n' + '\n'.join(tags) + '\n</div></body></html>')
    y = rng.standard_normal(int(dur * SR)) * 1e-4  # o chão do render
    for arq, ini in render:
        i = int(round(ini * SR))
        y[i:i + len(SONS[arq])] += SONS[arq] * 0.5
    wav = os.path.join(pasta, 'render.wav')
    sf.write(wav, y, SR, subtype='FLOAT')
    return pasta, wav


def por_id(r):
    return {c['id']: c for c in r}


# no lugar: os três efeitos onde o index.html diz
CERTO = [('sfx-clique', 'clique.wav', 1.0), ('sfx-woosh', 'woosh.wav', 2.0), ('sfx-riser', 'riser.wav', 3.5)]
pasta, wav = peca('certo', CERTO, [(a, s) for _, a, s in CERTO])
r = por_id(m.confere(wav, pasta))
ok(all(c['ok'] and abs(c['erro_ms']) <= 1 for c in r.values()) and len(r) == 3,
   f"os três no lugar passam com erro de até 1 ms ({[c['erro_ms'] for c in r.values()]})")
ok('trilha' not in r, 'a trilha (data-papel="trilha") fica fora da conta: o render se faz sem ela')

# o <audio> dentro de comentário não toca no navegador, e fica fora da conta
with open(os.path.join(pasta, 'index.html'), encoding='utf-8') as f:
    base = f.read()
comentado = os.path.join(pasta, 'comentado.html')
with open(comentado, 'w', encoding='utf-8') as f:
    f.write(base.replace('</div>', '<!-- <audio id="velho" src="ativos/nao-existe.wav" data-start="4" data-duration="0.5"></audio> -->\n</div>', 1))
try:
    r = por_id(m.confere(wav, comentado))
    ok(len(r) == 3 and 'velho' not in r, f"o <audio> comentado fica fora da conta ({sorted(r)})")
except Exception as e:
    ok(False, f"o <audio> comentado fica fora da conta (caiu: {type(e).__name__})")

# o woosh deslocado 4 quadros (133 ms) reprova com o erro medido; os outros seguem no lugar
pasta_fora, wav_fora = peca('fora', CERTO, [('clique.wav', 1.0), ('woosh.wav', 2.0 + 4 * Q), ('riser.wav', 3.5)])
r = por_id(m.confere(wav_fora, pasta_fora))
ok(not r['sfx-woosh']['ok'] and abs(r['sfx-woosh']['erro_quadros'] - 4) <= 0.1,
   f"o woosh 4 quadros depois reprova ({r['sfx-woosh']['erro_quadros']:+.2f} q)")
ok(r['sfx-clique']['ok'] and r['sfx-riser']['ok'], 'o clique e o riser, no lugar, seguem passando')

# o riser adiantado 3 quadros: o começo dele é quase mudo, a conta se faz em volta do pico
pasta_r, wav_r = peca('riser', CERTO, [('clique.wav', 1.0), ('woosh.wav', 2.0), ('riser.wav', 3.5 - 3 * Q)])
r = por_id(m.confere(wav_r, pasta_r))
ok(not r['sfx-riser']['ok'] and abs(r['sfx-riser']['erro_quadros'] + 3) <= 0.1,
   f"o riser 3 quadros antes reprova pelo pico ({r['sfx-riser']['erro_quadros']:+.2f} q)")

# a cascata: seis cubos iguais a cada 4 quadros, a cauda de um sob o começo do outro, todos 1
# quadro atrasados pelo codificador (dentro da tolerância). Sem o raio abaixo da metade da
# distância, a correlação acha o cubo vizinho, mais limpo, e reprova o que está certo
CASCATA = [(f'sfx-cubo-{n}', 'cubo.wav', 1.0 + 4 * n * Q) for n in range(6)]
pasta_c, wav_c = peca('cascata', CASCATA, [(a, s + Q) for _, a, s in CASCATA])
r = m.confere(wav_c, pasta_c)
ok(all(c['ok'] and abs(c['erro_quadros'] - 1) <= 0.1 for c in r),
   f"a cascata a 4 quadros, atrasada 1 quadro, mede +1 q em cada cubo e não pega o vizinho ({[c['erro_quadros'] for c in r]})")

# a linha de comando: 0 no certo, 1 com o woosh fora, e o MP4 (AAC) dá o mesmo veredito
cli = lambda *a: subprocess.run([sys.executable, '-I', os.path.join(AQUI, 'confere_posicao.py'), *a], capture_output=True)
r_certo, r_fora = cli(wav, pasta), cli(wav_fora, os.path.join(pasta_fora, 'index.html'))
ok(r_certo.returncode == 0 and r_fora.returncode == 1 and 'FORA sfx-woosh' in r_fora.stdout.decode('utf-8'),
   f"confere_posicao.py sai 0 no certo e 1 com o woosh fora, e diz qual ({r_certo.returncode}, {r_fora.returncode})")
mp4 = os.path.join(pasta_fora, 'render.mp4')
subprocess.run(['ffmpeg', '-nostdin', '-y', '-v', 'error', '-f', 'lavfi', '-i', 'color=c=black:s=64x64:r=30:d=6', '-i', wav_fora,
                '-c:v', 'libx264', '-c:a', 'aac', '-b:a', '192k', '-shortest', mp4], check=True)
r_mp4 = cli(mp4, pasta_fora)
linhas = r_mp4.stdout.decode('utf-8')
ok(r_mp4.returncode == 1 and 'FORA sfx-woosh' in linhas and 'ok   sfx-clique' in linhas,
   f"o MP4 do render dá o mesmo veredito ({r_mp4.returncode})")
ok(cli(wav, pasta, '--tolerancia', '0.5').returncode == 0 and cli(wav_c, pasta_c, '--tolerancia', '0.5').returncode == 1,
   'a --tolerancia em quadros vale: 0,5 q reprova a cascata atrasada 1 quadro')

shutil.rmtree(raiz, ignore_errors=True)
print(f'\n# tests {testes}\n# fail {falhas}')
sys.exit(1 if falhas else 0)
