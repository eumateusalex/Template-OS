"""Mede ritmo, som e cor de um vídeo, e o compara com a faixa de uma linguagem.

    python -I medir_ritmo.py <video.mp4> [--json <saida.json>] [--json-saida] [--folha <folha.jpg>]
                             [--linguagem <id>] [--linguagens <arquivo>] [--respiro <de>-<ate>]
                             [--plano <plano.json>] [--tomadas <cortes.json>]

A mesma régua mede a referência e a peça, para as duas se compararem pelos mesmos números: a
duração, os cortes duros (scene > 0,3 do ffmpeg; motion contínuo dá 0, e a troca de cena se acha na
curva de movimento), os onsets do áudio (fluxo espectral), os eventos sonoros por segundo, a fração
em silêncio (abaixo de -45 dBFS), o LUFS integrado, o LRA e o pico verdadeiro, a sincronia corte ×
onset a ±2 quadros contra o acaso, o movimento (diferença média entre quadros a 10 qps, de 0 a 1) por
segundo, o fecho parado (os segundos do fim abaixo do limiar de calmo) e a luminância e a saturação
médias.

Com `--linguagem`, cada número com faixa na linguagem (`linguagens.json`, ao lado, ou o
`--linguagens`) que sai dela vira aviso com o valor e a faixa, e também: a fração de segundos calmos,
a janela de 2 s mais calma fora do respiro declarado (`--respiro 18-19.5`) e o fecho parado acima do
teto da linguagem. As faixas são calibragem medida nas referências: avisam. Com `--plano`, a linguagem
(ou a do estilo), o respiro e a vírgula vêm do `plano.json` da peça, sem repetir na linha de comando,
e a exceção escrita nele (`{ "regra": "faixas", "trecho": "fecho parado", "motivo": "…" }`) cala o
aviso, que sai como aceito, pelo `excecoes.mjs` da /mograph (o `plano_da_peca.py`). Linguagem que não
existe sai 2 com a lista.

Com `--tomadas <cortes.json>` (o do fala.py da /cortes), a luminância e a saturação de cada tomada da
gravação (os clipes seguidos do mesmo take são uma tomada) e o maior salto entre vizinhas; com a
linguagem, o salto acima do `cor_entre_tomadas` dela avisa (a consistência da `cor.md` § 3).

Limites medidos: o detector de corte do ffmpeg mede a mudança contra o movimento de antes, então o
corte que sai de uma textura agitada não aparece (o teste usa um trecho que anda devagar), e o
jump cut no mesmo cenário também não; "cortes" é piso. Monitor filmado dilui o movimento (a sala
parada em volta). O LUFS de vídeo baixado do Instagram é o da plataforma, não o do master.

Pede numpy e o ffmpeg e o ffprobe do PATH.
"""
import json
import os
import re
import subprocess
import sys

import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
# o plano_da_peca.py mora ao lado; rodando com -I, a pasta não entra sozinha no caminho
sys.path.insert(0, AQUI)
LINGUAGENS = os.path.join(AQUI, 'linguagens.json')
FPS_AMOSTRA = 10
CALMO_ABAIXO = 0.004


def roda(args, binario=False):
    r = subprocess.run(args, capture_output=True)
    return r.stdout if binario else r.stdout.decode('utf-8', 'replace') + r.stderr.decode('utf-8', 'replace')


def probe(caminho):
    out = roda(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type,width,height,r_frame_rate:format=duration',
                '-of', 'json', caminho])
    d = json.loads(out[out.index('{'):])
    v = next((s for s in d['streams'] if s['codec_type'] == 'video'), None)
    a = any(s['codec_type'] == 'audio' for s in d['streams'])
    n, m = (v['r_frame_rate'].split('/') if v else ('30', '1'))
    return {'duracao': float(d['format']['duration']), 'fps': round(float(n) / float(m), 3),
            'largura': v and v['width'], 'altura': v and v['height'], 'tem_audio': a}


def cortes(caminho, limiar=0.3):
    out = roda(['ffmpeg', '-nostdin', '-hide_banner', '-i', caminho, '-vf',
                f"select='gt(scene,{limiar})',showinfo", '-an', '-f', 'null', '-'])
    return [round(float(t), 3) for t in re.findall(r'pts_time:([0-9.]+)', out)]


def audio_mono(caminho, sr=22050):
    raw = roda(['ffmpeg', '-nostdin', '-v', 'error', '-i', caminho, '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'], True)
    return np.frombuffer(raw, dtype=np.float32), sr


def onsets(sinal, sr, janela=1024, passo=256):
    """os onsets pelo fluxo espectral, com limiar adaptativo e 60 ms entre um e outro; e o silêncio"""
    if len(sinal) < janela:
        return [], 1.0
    n = 1 + (len(sinal) - janela) // passo
    idx = np.arange(janela)[None, :] + passo * np.arange(n)[:, None]
    quadros = sinal[idx] * np.hanning(janela)
    mag = np.log1p(10 * np.abs(np.fft.rfft(quadros, axis=1)))
    fluxo = np.concatenate([[0], np.maximum(np.diff(mag, axis=0), 0).sum(axis=1)])
    k = max(1, int(0.25 * sr / passo))
    pad = np.pad(fluxo, k, mode='edge')
    med = np.array([np.median(pad[i:i + 2 * k + 1]) for i in range(len(fluxo))])
    limiar = med + 1.5 * fluxo.std()
    picos, ultimo, minimo = [], -1e9, int(0.06 * sr / passo)
    for i in range(1, len(fluxo) - 1):
        if fluxo[i] > limiar[i] and fluxo[i] >= fluxo[i - 1] and fluxo[i] >= fluxo[i + 1] and i - ultimo >= minimo:
            # o instante é o começo do quadro em que a energia nova aparece
            picos.append(round((i * passo + janela / 2) / sr, 3))
            ultimo = i
    rms = np.sqrt((quadros ** 2).mean(axis=1) + 1e-12)
    return picos, float((20 * np.log10(rms) < -45).mean())


def loudness(caminho):
    out = roda(['ffmpeg', '-nostdin', '-hide_banner', '-i', caminho, '-af', 'ebur128=peak=true', '-f', 'null', '-'])
    resumo = out[out.rfind('Summary:'):]

    def pega(rot):
        m = re.search(rot + r':\s+(-?[0-9.]+|-inf)', resumo)
        return float(m.group(1)) if m and m.group(1) != '-inf' else None
    return {'I_lufs': pega('I'), 'LRA_lu': pega('LRA'), 'TP_dbfs': pega('Peak')}


def sincronia(cs, os_, tol):
    if not cs or not os_:
        return None
    o = np.array(os_)
    return round(sum(1 for c in cs if np.min(np.abs(o - c)) <= tol) / len(cs), 3)


def acaso(cs, os_, tol, duracao, rodadas=200):
    if not cs or not os_:
        return None
    rng = np.random.default_rng(7)
    o = np.array(os_)
    vals = [np.mean([np.min(np.abs(o - c)) <= tol for c in rng.uniform(0, duracao, len(cs))]) for _ in range(rodadas)]
    return round(float(np.mean(vals)), 3)


def movimento_e_cor(caminho):
    w, h = 96, 170
    raw = roda(['ffmpeg', '-nostdin', '-v', 'error', '-i', caminho, '-vf',
                f'fps={FPS_AMOSTRA},scale={w}:{h}:force_original_aspect_ratio=disable,format=rgb24',
                '-f', 'rawvideo', '-'], True)
    q = np.frombuffer(raw, dtype=np.uint8)
    n = len(q) // (w * h * 3)
    if n < 2:
        return {}
    q = q[: n * w * h * 3].reshape(n, h, w, 3).astype(np.float32) / 255.0
    cinza = q.mean(axis=3)
    dif = np.abs(np.diff(cinza, axis=0)).mean(axis=(1, 2))
    mx, mn = q.max(axis=3), q.min(axis=3)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0).mean(axis=(1, 2))
    por_s = [round(float(dif[i:i + FPS_AMOSTRA].mean()), 4) for i in range(0, len(dif), FPS_AMOSTRA)]
    fim = 0
    for v in dif[::-1]:
        if v >= CALMO_ABAIXO:
            break
        fim += 1
    return {'movimento_medio': round(float(dif.mean()), 4), 'movimento_mediano': round(float(np.median(por_s)), 4),
            'movimento_por_s': por_s, 'fecho_parado_s': round(fim / FPS_AMOSTRA, 1),
            'lum_media': round(float(cinza.mean()), 3), 'sat_media': round(float(sat.mean()), 3),
            '_lum_q': cinza.mean(axis=(1, 2)), '_sat_q': sat}


def tomadas_do_corte(arquivo):
    """os trechos de cada tomada no tempo da peça, pelos clipes do cortes.json do fala.py: os clipes
    seguidos do mesmo take (`escolhida`) são uma tomada só"""
    with open(arquivo, encoding='utf-8') as f:
        clipes = json.load(f)['clipes']
    trechos = []
    for c in clipes:
        de, ate = float(c['t']), float(c['t']) + float(c['dur'])
        if trechos and c.get('escolhida') is not None and trechos[-1]['escolhida'] == c.get('escolhida'):
            trechos[-1]['ate'] = ate
        else:
            trechos.append({'escolhida': c.get('escolhida'), 'de': de, 'ate': ate})
    return trechos


def cor_por_tomada(lum_q, sat_q, trechos):
    """a luminância e a saturação médias de cada tomada (a mesma conta do lum_media e do sat_media) e o
    maior salto entre vizinhas"""
    out = []
    for t in trechos:
        i0, i1 = int(round(t['de'] * FPS_AMOSTRA)), int(round(t['ate'] * FPS_AMOSTRA))
        if i1 <= i0 or i0 >= len(lum_q):
            continue
        out.append({**t, 'de': round(t['de'], 3), 'ate': round(t['ate'], 3),
                    'lum': round(float(lum_q[i0:i1].mean()), 3), 'sat': round(float(sat_q[i0:i1].mean()), 3)})
    saltos = [(abs(b['lum'] - a['lum']), abs(b['sat'] - a['sat'])) for a, b in zip(out, out[1:])]
    return {'tomadas': out, 'salto_lum_max': round(max((s[0] for s in saltos), default=0.0), 3),
            'salto_sat_max': round(max((s[1] for s in saltos), default=0.0), 3)}


def folha(caminho, destino, duracao):
    fps = max(0.5, min(2.0, 36 / max(duracao, 1)))
    roda(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-i', caminho, '-vf',
          f'fps={fps},scale=200:-1,tile=6x6', '-frames:v', '1', '-q:v', '4', destino])


def mede(caminho, tomadas=None):
    p = probe(caminho)
    r = dict(arquivo=caminho, **p)
    cs = cortes(caminho)
    r['cortes'] = cs
    r['cortes_por_s'] = round(len(cs) / p['duracao'], 3)
    r['plano_medio_s'] = round(p['duracao'] / (len(cs) + 1), 2)
    if p['tem_audio']:
        s, sr = audio_mono(caminho)
        os_, sil = onsets(s, sr)
        r['onsets'] = os_
        r['eventos_por_s'] = round(len(os_) / p['duracao'], 3)
        r['fracao_silencio'] = round(sil, 3)
        r.update(loudness(caminho))
        tol = 2 / (p['fps'] or 30)
        r['sincronia_corte_onset'] = sincronia(cs, os_, tol)
        r['sincronia_acaso'] = acaso(cs, os_, tol, p['duracao'])
    r.update(movimento_e_cor(caminho))
    lum_q, sat_q = r.pop('_lum_q', None), r.pop('_sat_q', None)
    if tomadas is not None and lum_q is not None:
        r.update(cor_por_tomada(lum_q, sat_q, tomadas))
    return r


def carrega_linguagens(arquivo):
    with open(arquivo, encoding='utf-8') as f:
        return json.load(f)['linguagens']


def confere_linguagem(r, ling, respiro=None):
    """os avisos da linguagem: cada faixa, os segundos calmos, a janela calma e o fecho parado. O
    respiro é um trecho (de, ate) ou uma lista deles: o calmo dentro de um respiro declarado não conta"""
    calmo = ling.get('calmo_abaixo', CALMO_ABAIXO)
    por_s = r.get('movimento_por_s', [])
    trechos = [] if respiro is None else ([respiro] if isinstance(respiro, tuple) else list(respiro))
    fora = (lambda t0, t1: any(t0 < b and t1 > a for a, b in trechos))
    segundos = [(i, v) for i, v in enumerate(por_s) if not fora(i, i + 1)]
    r['segundos_calmos_fracao'] = round(sum(v < calmo for _, v in segundos) / len(segundos), 3) if segundos else None
    avisos = []
    refs = ling.get('referencias') or []
    n_refs = ling.get('n_referencias', len(refs))
    nomes = (f": {'; '.join(refs[:3])}{'…' if len(refs) > 3 else ''}") if refs else ''
    origem = (f" (faixa{' provisória' if ling.get('provisoria') else ''}, de {n_refs} referência(s){nomes})") if n_refs else ' (faixa sem referência medida)'
    if not r.get('tem_audio'):
        avisos.append('sem áudio: o som não foi medido, e as faixas de som não se conferem')
    for chave, (lo, hi) in ling.get('faixas', {}).items():
        v = r.get(chave)
        if v is None:
            if r.get('tem_audio') or chave not in ('eventos_por_s', 'fracao_silencio', 'LRA_lu', 'I_lufs'):
                avisos.append(f'{chave}: não medido')
            continue
        if not (lo <= v <= hi):
            avisos.append(f'{chave} = {v} fora da faixa [{lo}, {hi}] da linguagem {ling.get("id") or ling.get("nome", "")}{origem}')
    # o fim resolvido tem régua própria (o fecho parado): a janela calma se procura antes dele
    teto = ling.get('fecho_parado_max_s')
    limite = len(por_s) - (teto or 0)
    janelas = [(i, (por_s[i] + por_s[i + 1]) / 2) for i in range(len(por_s) - 1) if not fora(i, i + 2) and i + 2 <= limite]
    janela = None
    if janelas:
        i, v = min(janelas, key=lambda x: x[1])
        janela = {'de': float(i), 'ate': float(i + 2), 'movimento': round(v, 4)}
        if v < calmo:
            avisos.append(f'janela calma de {i} a {i + 2} s com movimento {v:.4f} (abaixo de {calmo}){origem}: '
                          'o quadro quase parado fora do respiro declarado; declare o respiro no plano ou dê vida ao trecho')
    if teto is not None and r.get('fecho_parado_s', 0) > teto:
        avisos.append(f'fecho parado de {r["fecho_parado_s"]} s, acima do teto de {teto} s da linguagem{origem}: '
                      'o fim resolvido segura pouco, e a leitura do convite acontece com o quadro vivo')
    # a cor entre tomadas (o --tomadas): a vizinha que salta acima da tolerância da linguagem
    if 'tomadas' in r:
        tol = ling.get('cor_entre_tomadas')
        if not tol:
            avisos.append(f'cor entre tomadas: a linguagem {ling.get("id")} está sem tolerância medida; os saltos saem no JSON, sem régua')
        else:
            for a, b in zip(r['tomadas'], r['tomadas'][1:]):
                dl, ds = abs(b['lum'] - a['lum']), abs(b['sat'] - a['sat'])
                if dl > tol['lum'] or ds > tol['sat']:
                    avisos.append(f'a tomada de {b["de"]:.1f} s salta da anterior ({a["de"]:.1f} s): luminância {dl:.3f} e saturação '
                                  f'{ds:.3f}, e a tolerância da linguagem é {tol["lum"]} e {tol["sat"]}{origem}: corrija a tomada que '
                                  'saiu do grupo (a cor.correcao da peca.json), ou escreva a exceção')
    return {'id': ling.get('id'), 'avisos': avisos, 'janela_calma': janela}


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    args = sys.argv[1:]
    if not args or args[0].startswith('--'):
        print(__doc__)
        sys.exit(2)
    valor = lambda n, d=None: args[args.index(n) + 1] if n in args else d
    import plano_da_peca as pp
    arq_plano = valor('--plano')
    plano, nota_plano = (pp.le(arq_plano), None) if arq_plano else ({}, None)
    lid = valor('--linguagem') or plano.get('linguagem')
    if arq_plano and not lid and plano.get('estilo'):
        # o estilo sem linguagem traz a dele: quem sabe é o linguagem.mjs da /mograph
        perfil, nota_plano = pp.perfil(arq_plano)
        lid = (perfil or {}).get('linguagem')
    ling = None
    if lid:
        todas = carrega_linguagens(valor('--linguagens', LINGUAGENS))
        if lid not in todas:
            print(f'linguagem "{lid}" não existe; as que existem: {", ".join(sorted(todas))}', file=sys.stderr)
            sys.exit(2)
        ling = dict(todas[lid], id=lid)
    caminho = args[0]
    tomadas = None
    if '--tomadas' in args:
        arq_t = valor('--tomadas')
        if not arq_t or not os.path.isfile(arq_t):
            print(f'o --tomadas pede o cortes.json do fala.py (os clipes da gravação); não achei {arq_t}', file=sys.stderr)
            sys.exit(2)
        tomadas = tomadas_do_corte(arq_t)
    r = mede(caminho, tomadas)
    if ling:
        rsp = valor('--respiro')
        respiro = [tuple(float(x) for x in rsp.split('-'))] if rsp else pp.respiros(plano)
        r['linguagem'] = confere_linguagem(r, ling, respiro)
        r['linguagem']['aceitos'] = []
        if arq_plano:
            # a exceção escrita no plano (regra "faixas", com o trecho do aviso) cala pelo excecoes.mjs
            jan = r['linguagem']['janela_calma']
            brutos = [{'regra': 'faixas', 'msg': a,
                       'cena': pp.cena_em(plano, jan['de']) if jan and a.startswith('janela calma') else None}
                      for a in r['linguagem']['avisos']]
            r['linguagem']['avisos'], r['linguagem']['aceitos'], falha = pp.calibra(arq_plano, brutos)
            nota_plano = nota_plano or falha
        if nota_plano:
            r['linguagem']['nota'] = nota_plano
    if '--folha' in args:
        folha(caminho, valor('--folha'), r['duracao'])
    if '--json' in args:
        with open(valor('--json'), 'w', encoding='utf-8') as f:
            json.dump(r, f, ensure_ascii=False)
    if '--json-saida' in args:
        print(json.dumps(r, ensure_ascii=False))
        return
    resumo = {k: v for k, v in r.items() if k not in ('cortes', 'onsets', 'movimento_por_s', 'linguagem', 'tomadas')}
    print(json.dumps(resumo, ensure_ascii=False, indent=1))
    if ling:
        print(f'linguagem {ling["id"]}:')
        for a in r['linguagem']['avisos'] or ['dentro da faixa']:
            print(f'  {a}')
        for a in r['linguagem']['aceitos']:
            fonte = f" ({a['fonte']})" if a.get('fonte') else ''
            print(f"  aceito [{a['regra']}] {a['msg']} · a exceção do plano: {a['motivo']}{fonte}")
        if r['linguagem'].get('nota'):
            print(f"  nota: {r['linguagem']['nota']}")


if __name__ == '__main__':
    main()
