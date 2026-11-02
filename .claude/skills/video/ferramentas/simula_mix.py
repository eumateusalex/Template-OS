"""Simula a mixagem do HyperFrames a partir dos <audio> do index.html, antes do render: o pico
verdadeiro, onde ele estoura, quanto o render baixaria e o integrado que sairia.

    python simula_mix.py <pasta da peça | index.html> [--teto -1.0] [--grava mix.wav] [--janelas 8]

Soma cada clipe (data-start, data-duration, data-media-start, data-volume, data-fade-in e
data-fade-out) a 48 kHz, mede o pico verdadeiro (4x sobreamostrado) em janelas de 0,1 s e lista
as piores janelas com os clipes que tocam nelas. O render baixa a peça inteira pelo pior pico,
então um empilhamento só derruba o nível de tudo. O `src` de cada clipe é relativo à pasta do
index.html; a duração da peça é o data-duration do #root.

Sai com código 1 quando o pico verdadeiro passa do teto (o render baixaria a peça), 0 quando não.

    python simula_mix.py <peça> --contexto [--grade <bpm>,<primeira batida s>] [--plano <plano.json>] [--json] [--estrito]

O som dentro da música: separa a cama (clipe com mais de 4 s, ou id/arquivo com cama, trilha,
música, drone, ambiente) dos efeitos e diz, de cada efeito, o papel (pelo id ou arquivo: impacto,
woosh, pop, clique, tecla), o relevo em dB sobre a cama no instante dele e, com a grade da trilha, a
distância em quadros até a batida e até a meia batida, com a fração na batida contra o acaso. Sem
`--grade`, a grade se mede sozinha pelo `medir_audio.py musica` na cama com nome de música (ou na mais
longa), levada ao tempo da peça, e a nota diz de qual clipe. Efeito abaixo do piso do papel avisa; com
`--estrito`, sai 1 quando sobra aviso.
O `plano.json` da peça (ao lado do index.html, ou o `--plano`) entra pelo `plano_da_peca.py`: na
linguagem em que a voz ou o evento manda no tempo, a batida não se cobra; e a exceção escrita
(`{ "regra": "relevo", "cena": "S03", "motivo": "…" }`) cala o aviso daquela cena, que sai como aceito,
pelo `excecoes.mjs` da /mograph.
Na pasta do Reel falado (o `som.py` da /cortes: o index.html só com o master, o `som.json` e os
`stems/`), cada efeito do `som.json` (`efeito-N`, na ordem dele) se mede no `stems/sfx.wav` contra a
trilha, `stems/music.wav`, e a batida não se cobra (a voz manda).
Pede numpy, soundfile, soxr e pyloudnorm (o `scripts/requirements.txt`; o MIXAGEM_PY aponta outro Python).
"""
import json
import os
import re
import sys

import numpy as np
import soundfile as sf
import soxr

# o medir_audio.py mora ao lado (a grade da trilha); rodando com -I, a pasta não entra sozinha no caminho
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
SR = 48000
JANELA = 0.1


def atributo(tag, nome, padrao=None):
    m = re.search(rf'(?<![\w-]){nome}="([^"]*)"', tag)
    return m.group(1) if m else padrao


def le_peca(html):
    """os clipes (<audio>) e a duração do #root"""
    html = re.sub(r'<!--.*?-->', '', html, flags=re.S)  # o navegador não toca o que está comentado
    root = re.search(r'<div\b[^>]*\bid="root"[^>]*>', html)
    if not root or atributo(root.group(0), 'data-duration') is None:
        raise ValueError('o index.html não tem o #root com data-duration')
    clipes = []
    for t in re.findall(r'<audio\b[^>]*>', html):
        clipes.append({
            'id': atributo(t, 'id', '?'), 'src': atributo(t, 'src'),
            'inicio': float(atributo(t, 'data-start', 0)), 'dur': float(atributo(t, 'data-duration')),
            'vol': float(atributo(t, 'data-volume', 1)), 'media': float(atributo(t, 'data-media-start', 0)),
            'fade_in': float(atributo(t, 'data-fade-in', 0)), 'fade_out': float(atributo(t, 'data-fade-out', 0)),
        })
    return clipes, float(atributo(root.group(0), 'data-duration'))


def mixa(pasta, clipes, dur):
    mix = np.zeros((int(dur * SR) + SR, 2))
    quem, cache = [], {}
    for c in clipes:
        if c['src'] not in cache:
            x, sr = sf.read(os.path.join(pasta, c['src']), always_2d=True)
            x = x[:, :2] if x.shape[1] >= 2 else np.repeat(x, 2, axis=1)
            cache[c['src']] = soxr.resample(x, sr, SR) if sr != SR else x
        x = cache[c['src']][int(c['media'] * SR):int((c['media'] + c['dur']) * SR)] * c['vol']
        if c['fade_in']:
            n = min(len(x), int(c['fade_in'] * SR))
            x[:n] *= np.linspace(0, 1, n)[:, None]
        if c['fade_out']:
            n = min(len(x), int(c['fade_out'] * SR))
            x[len(x) - n:] *= np.linspace(1, 0, n)[:, None]
        i = int(c['inicio'] * SR)
        x = x[:max(0, len(mix) - i)]
        mix[i:i + len(x)] += x
        quem.append((c['id'], c['inicio'], c['inicio'] + len(x) / SR))
    return mix[:int(dur * SR)], quem


def simula(caminho, teto=-1.0, grava=None, janelas=8):
    arq = os.path.join(caminho, 'index.html') if os.path.isdir(caminho) else caminho
    pasta = os.path.dirname(os.path.abspath(arq))
    with open(arq, encoding='utf-8') as f:
        clipes, dur = le_peca(f.read())
    mix, quem = mixa(pasta, clipes, dur)
    if grava:
        sf.write(grava, mix, SR, subtype='FLOAT')
    # o pico verdadeiro: 4x sobreamostrado, como o ebur128=peak=true do conferir
    up = soxr.resample(mix, SR, SR * 4)
    w = int(JANELA * SR * 4)
    picos = [(round(k * JANELA, 1), float(20 * np.log10(np.abs(up[k * w:(k + 1) * w]).max() + 1e-12))) for k in range(len(up) // w)]
    pior = max(picos, key=lambda p: p[1])
    baixa = max(0.0, pior[1] - teto)
    import pyloudnorm
    lufs = float(pyloudnorm.Meter(SR).integrated_loudness(mix * 10 ** (-baixa / 20)))
    piores = [{'em_s': t, 'dbtp': round(p, 1), 'tocam': [q[0] for q in quem if q[1] <= t + JANELA and q[2] >= t]}
              for t, p in sorted(picos, key=lambda p: -p[1])[:janelas]]
    return {'pico_dbtp': pior[1], 'pico_em_s': pior[0], 'teto_dbtp': teto, 'baixa_db': baixa,
            'lufs': lufs, 'piores': piores, 'ok': baixa == 0}


# --contexto: o som dentro da música. O relevo é o RMS do efeito na janela de 50 ms mais forte dele
# menos o RMS da cama em 300 ms em volta do mesmo instante, cada um renderizado sozinho com o volume
# do clipe. O piso por papel é calibragem (avisa; a exceção escrita no plano.json, regra "relevo", cala
# o aviso por máquina e ele sai como aceito): o impacto se ouve acima
# da cama, o woosh na altura dela, o clique logo abaixo. Uma peça aprovada mediu a mediana em
# -12,9 dB.
# A tecla da digitação é textura: soa baixinha de propósito (o `oficio.md` § 8 da /mograph), mas ainda se ouve.
PISO_DB = {'impacto': 3.0, 'woosh': 0.0, 'pop': -3.0, 'clique': -6.0, 'tecla': -12.0, 'outro': -6.0}
PAPEIS = [('impacto', r'impacto|golpe|hit|boom|carimbo|stamp'), ('woosh', r'woosh|whoosh|swoosh|chicote|riser'),
          ('pop', r'pop|plim|ding|sino'), ('tecla', r'tecla|typing|keyboard|digita'),
          ('clique', r'clique|click|tique|tap|toque')]
CAMA = re.compile(r'cama|trilha|musica|música|drone|ambiente|ambiencia|ambiência|bed|music', re.I)
CAMA_MIN_S = 4.0
MUSICA = re.compile(r'trilha|musica|música|music', re.I)  # a cama que dá a grade, antes do drone e da ambiência
ACERTO = ('impacto', 'woosh', 'pop')  # o que cai na grade; o clique e a tecla seguem a animação
QPS = 30
TOL_Q = 2


def papel(c):
    nome = f"{c['id']} {os.path.basename(c['src'] or '')}".lower()
    return next((p for p, rx in PAPEIS if re.search(rx, nome)), 'outro')


def e_cama(c):
    return c['dur'] > CAMA_MIN_S or bool(CAMA.search(f"{c['id']} {os.path.basename(c['src'] or '')}"))


def grade_da_trilha(pasta, camas):
    """a grade da cama com nome de música (ou, sem ela, da mais longa) pelo medir_audio.py musica, levada para o tempo da peça (o data-start e
    o data-media-start dela); None quando a medida não acha andamento"""
    import medir_audio
    musicais = [x for x in camas if MUSICA.search(f"{x['id']} {os.path.basename(x['src'] or '')}")]
    c = max(musicais or camas, key=lambda x: x['dur'])
    try:
        m = medir_audio.mede_musica(os.path.join(pasta, c['src']))
    except Exception:  # trilha que o ffmpeg não lê ou curta demais: a batida fica sem medida, dita na nota
        return None
    if not m.get('bpm') or m.get('primeira_batida_s') is None:
        return None
    batida = m['batida_s']
    # o período sai do batida_s (4 casas), não do bpm arredondado a 0,1: o erro de arredondamento
    # somaria a cada batida, e numa peça de 3 min a 70 BPM passaria de 2 quadros
    return 60.0 / batida, c['inicio'] + (m['primeira_batida_s'] - c['media']) % batida, c['id']


def rms_db(x):
    return float(20 * np.log10(np.sqrt(np.mean(np.square(x))) + 1e-12)) if len(x) else -240.0


def contexto(caminho, grade=None, plano=None):
    """o --contexto com o plano da peça (o plano.json ao lado, ou o --plano): a linguagem diz quem manda
    no tempo, e a exceção escrita cala o aviso pelo excecoes.mjs da /mograph (plano_da_peca.py)"""
    import plano_da_peca as pp
    arq_plano = pp.acha(caminho, plano)
    dados_plano, perfil, nota_plano = {}, None, None
    if arq_plano:
        dados_plano = pp.le(arq_plano)
        perfil, nota_plano = pp.perfil(arq_plano)
    tempo = (perfil or {}).get('tempo')
    resumo = _mede_contexto(caminho, grade, tempo, (perfil or {}).get('linguagem'))
    brutos = [{'regra': a['regra'], 'cena': pp.cena_em(dados_plano, a['em']), 'msg': a['msg']} for a in resumo['avisos']]
    resumo['aceitos'] = []
    if arq_plano:
        resumo['avisos'], resumo['aceitos'], falha = pp.calibra(arq_plano, brutos)
        nota_plano = nota_plano or falha
    else:
        resumo['avisos'] = [a['msg'] for a in brutos]
    if nota_plano:
        resumo['notas'].append(nota_plano)
    return resumo


def relevo_de(so, cama, tem_cama, i0, i1, ident, p, linhas, avisos, conserto):
    """o relevo do efeito que soa em so[i0:i1]: a janela de 50 ms mais forte contra a cama em 300 ms em
    volta; soma a linha e, abaixo do piso do papel, o aviso"""
    w50, w300 = int(0.05 * SR), int(0.3 * SR)
    trecho = so[i0:i1]
    if len(trecho) < w50:
        k, janela = 0, trecho
    else:
        energia = np.convolve(np.square(trecho), np.ones(w50), mode='valid')
        k = int(np.argmax(energia))
        janela = trecho[k:k + w50]
    centro = i0 + k + len(janela) // 2
    nivel = rms_db(janela)
    fundo = rms_db(cama[max(0, centro - w300 // 2):centro + w300 // 2]) if tem_cama else None
    relevo = round(nivel - fundo, 1) if fundo is not None else None
    linhas.append({'id': ident, 'papel': p, 'em_s': round(centro / SR, 3), 'nivel_db': round(nivel, 1),
                   'relevo_db': relevo, 'piso_db': PISO_DB[p], 'batida_q': None, 'grade_q': None})
    if relevo is not None and relevo < PISO_DB[p]:
        avisos.append({'regra': 'relevo', 'em': centro / SR, 'msg': f"{ident} ({p}) com relevo de {relevo:.1f} dB sobre a cama aos {centro / SR:.2f} s; "
                      f"o piso do papel é {PISO_DB[p]:+.1f} dB (calibragem: 0 dB para impacto e woosh e -6 para clique; "
                      f"o +3 do impacto, o -3 do pop e o -12 da tecla são ponto de partida, sem medida): {conserto}"})


def stems_do_falado(pasta, dur):
    """(trilha, efeitos, itens do som.json) da pasta do Reel falado, em mono a 48 kHz, ou None"""
    arqs = [os.path.join(pasta, 'som.json'), os.path.join(pasta, 'stems', 'music.wav'), os.path.join(pasta, 'stems', 'sfx.wav')]
    if not all(os.path.isfile(a) for a in arqs):
        return None
    with open(arqs[0], encoding='utf-8') as f:
        itens = json.load(f).get('efeitos') or []

    def mono(arq):
        x, sr = sf.read(arq, dtype='float64', always_2d=True)
        x = x.mean(axis=1)
        return soxr.resample(x, sr, SR) if sr != SR else x
    return mono(arqs[1]), mono(arqs[2]), itens


def _mede_contexto(caminho, grade=None, tempo=None, linguagem=None):
    arq = os.path.join(caminho, 'index.html') if os.path.isdir(caminho) else caminho
    pasta = os.path.dirname(os.path.abspath(arq))
    with open(arq, encoding='utf-8') as f:
        clipes, dur = le_peca(f.read())
    camas = [c for c in clipes if e_cama(c)]
    efeitos = [c for c in clipes if not e_cama(c)]
    notas, avisos, linhas = [], [], []
    falado = None if efeitos else stems_do_falado(pasta, dur)
    if falado:
        # a pasta do Reel falado (o som.py da /cortes): o index.html só tem o master, e os efeitos
        # moram no som.json, somados no stems/sfx.wav; a cama é a trilha, stems/music.wav
        cama, sfx, itens = falado
        for k, e in enumerate(itens):
            centro = int(float(e['acerto']) * SR)
            i0, i1 = max(0, centro - int(0.15 * SR)), min(len(sfx), centro + int(0.15 * SR))
            relevo_de(sfx, cama, True, i0, i1, f'efeito-{k + 1}', papel({'id': '', 'src': e.get('arquivo', '')}), linhas, avisos,
                      'suba o db do efeito no som.json ou abaixe a trilha ali')
        notas.append('a pasta do falado: os efeitos do som.json medidos no stems/sfx.wav contra a trilha (stems/music.wav), '
                      'pelo pico de cada um (o id é efeito-N, na ordem do som.json); dois efeitos a menos de 0,3 s se somam na medida')
        camas = [{'id': 'stems/music.wav'}]
    else:
        cama = mixa(pasta, camas, dur)[0].mean(axis=1) if camas else np.zeros(int(dur * SR))
        for c in efeitos:
            so = mixa(pasta, [c], dur)[0].mean(axis=1)
            i0, i1 = int(c['inicio'] * SR), min(len(so), int((c['inicio'] + c['dur']) * SR) + 1)
            relevo_de(so, cama, bool(camas), i0, i1, c['id'], papel(c), linhas, avisos, 'suba o data-volume ou abaixe a cama ali')
    resumo = {'camas': [c['id'] for c in camas], 'efeitos': linhas, 'avisos': avisos, 'notas': notas,
              'na_batida': None, 'na_grade': None, 'acaso_batida': None, 'acaso_grade': None,
              'relevo_mediano_db': None}
    relevos = [l['relevo_db'] for l in linhas if l['relevo_db'] is not None]
    if relevos:
        resumo['relevo_mediano_db'] = round(float(np.median(relevos)), 1)
    if not camas:
        notas.append('sem cama: o relevo é o nível do efeito sozinho, e a batida não se mede')
        return resumo
    if falado:
        notas.append('no Reel falado, a voz manda no tempo: a batida da trilha não se cobra')
        return resumo
    if tempo in ('voz', 'evento'):
        quem = 'a voz manda no tempo (o corte cai no começo da frase)' if tempo == 'voz' else 'cada evento manda no tempo'
        notas.append(f'na linguagem {linguagem}, {quem}: a batida da trilha não se cobra')
        return resumo
    if not grade:
        medida = grade_da_trilha(pasta, camas)
        grade = medida[:2] if medida else None
        if medida:
            notas.append(f'grade medida da trilha "{medida[2]}": {medida[0]:.1f} BPM, a primeira batida aos {medida[1]:.3f} s da peça '
                         '(a cama com nome de música, ou a mais longa; passe --grade para outra)')
        else:
            notas.append('a trilha não deu batida medível (passe --grade bpm,primeira_batida): a batida não se mede')
            return resumo
    bpm, primeira = grade
    batida = 60.0 / bpm
    tol = TOL_Q / QPS
    acertos = [l for l in linhas if l['papel'] in ACERTO]
    for l in acertos:
        rel = (l['em_s'] - primeira) / batida
        l['batida_q'] = round((rel - round(rel)) * batida * QPS, 1)
        meio = rel * 2
        l['grade_q'] = round((meio - round(meio)) * batida / 2 * QPS, 1)
    if acertos:
        resumo['na_batida'] = round(sum(abs(l['batida_q']) <= TOL_Q for l in acertos) / len(acertos), 3)
        resumo['na_grade'] = round(sum(abs(l['grade_q']) <= TOL_Q for l in acertos) / len(acertos), 3)
        resumo['acaso_batida'] = round(min(1.0, 2 * tol / batida), 3)
        resumo['acaso_grade'] = round(min(1.0, 2 * tol / (batida / 2)), 3)
    else:
        notas.append('nenhum efeito de acerto (impacto, woosh, pop): a batida não se mede')
    return resumo


def mostra_contexto(c):
    print(f"camas: {', '.join(c['camas']) or 'nenhuma'}")
    for l in c['efeitos']:
        relevo = 'sem cama' if l['relevo_db'] is None else f"{l['relevo_db']:+.1f} dB (piso {l['piso_db']:+.1f})"
        batida = '' if l['batida_q'] is None else f"  batida {l['batida_q']:+.1f} q, grade {l['grade_q']:+.1f} q"
        print(f"  {l['em_s']:6.2f} s  {l['id']:<24} {l['papel']:<8} relevo {relevo}{batida}")
    if c['relevo_mediano_db'] is not None:
        print(f"relevo mediano: {c['relevo_mediano_db']:+.1f} dB")
    if c['na_batida'] is not None:
        print(f"na batida: {c['na_batida']:.0%} (o acaso: {c['acaso_batida']:.0%}); "
              f"na grade de meia batida: {c['na_grade']:.0%} (o acaso: {c['acaso_grade']:.0%})")
    for n in c['notas']:
        print(f"nota: {n}")
    for a in c['avisos']:
        print(f"aviso: {a}")
    for a in c.get('aceitos', []):
        fonte = f" ({a['fonte']})" if a.get('fonte') else ''
        print(f"aceito [{a['regra']}] {a['msg']} · a exceção do plano: {a['motivo']}{fonte}")


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    args = sys.argv[1:]
    if not args or args[0].startswith('--'):
        print(__doc__)
        sys.exit(2)
    valor = lambda n, d=None: args[args.index(n) + 1] if n in args else d
    if '--contexto' in args:
        grade = valor('--grade')
        grade = tuple(float(v) for v in grade.split(',')) if grade else None
        c = contexto(args[0], grade, valor('--plano'))
        if '--json' in args:
            print(json.dumps({'contexto': c}, ensure_ascii=False))
        else:
            mostra_contexto(c)
        sys.exit(1 if ('--estrito' in args and c['avisos']) else 0)
    r = simula(args[0], float(valor('--teto', -1.0)), valor('--grava'), int(valor('--janelas', 8)))
    print(f"pico verdadeiro {r['pico_dbtp']:.1f} dBTP aos {r['pico_em_s']:.1f} s; o render baixaria {r['baixa_db']:.1f} dB; "
          f"o integrado sairia {r['lufs']:.1f} LUFS")
    for p in r['piores']:
        print(f"  {p['em_s']:5.1f} s  {p['dbtp']:5.1f} dBTP  {', '.join(p['tocam'])}")
    if not r['ok']:
        print(f"acima do teto de {r['teto_dbtp']} dBTP: baixe o data-volume dos clipes da pior janela")
    sys.exit(0 if r['ok'] else 1)


if __name__ == '__main__':
    main()
