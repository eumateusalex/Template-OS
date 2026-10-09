"""O corte da fala do Reel falado: a escolha das tomadas vira câmera e
voz cortadas como um editor cortaria.

  python scripts/reel-falado/fala.py <fonte> <palavras.json> <tomadas.json> --saida <pasta>
                                     [--audio <microfone.wav>] [--respiro 0.8]

Sai na pasta:
  camera.mp4   a câmera cortada, em pé, 30 fps, sem áudio (deitada sai 9:16 do centro)
  voz.wav      a voz montada, 48 kHz mono, −14 LUFS, pico até −1 dBTP
  cortes.json  clipes, END, palavras no tempo novo, tomadas, trocas, respiro e avisos

Os números: o som real se mede em janelas de 10 ms (fala a −35 dB ou mais; acabou quando há
150 ms abaixo de −32 dB), 40 ms de folga antes da palavra, silêncio acima de 300 ms
vira 120 ms sem deixar pedaço abaixo de 1,5 s (pausa acima de 0,6 s se corta até com pedaço de 0,5 s),
J cut de 50 ms, cauda de 170 ms que não invade a próxima palavra da fonte, e 0,8 s de
respiro depois da última palavra, com o quadro do fim da fala parado.
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import correlate

sys.path.insert(0, str(Path(__file__).resolve().parent))
from medida import mede  # noqa: E402
from tomadas import carregar, conferir  # noqa: E402

FPS = 30
SR = 48000
JANELA = 0.010
FALA_DB, SILENCIO_DB, CORRIDA = -35.0, -32.0, 0.150
# silêncio de até 0,30 s é respiração da fala; pedaço abaixo de 1,5 s vira punch-in em cima de
# punch-in (troca de enquadramento a cada 1 a 1,5 s cansa)
FOLGA, SILENCIO_MAX, SILENCIO_ALVO, PEDACO_MIN = 0.040, 0.300, 0.120, 1.5
# pausa acima de 0,6 s é ar morto: corta-se mesmo deixando pedaço de 0,5 s, e o modelo segura a
# troca de enquadramento
PAUSA_LONGA, PEDACO_MIN_LONGA = 0.6, 0.5
# o respiro congela o quadro do fim da fala: depois dele, quem grava costuma olhar para baixo e
# ir desligar a câmera; a gravação com menos de 0,3 s depois da fala ganha o aviso
RESPIRO, RESPIRO_REAL, FOLGA_DO_AVISO = 0.8, 0.0, 0.3
BUSCA_ANTES = 0.3                 # o Whisper marca o começo até 0,3 s antes do som
J_CUT, CAUDA, SAIDA_FINAL = 0.050, 0.170, 0.150
CORRELACAO_MIN = 0.3


class Recusa(Exception):
    pass


def roda(cmd):
    r = subprocess.run(cmd, capture_output=True)
    if r.returncode != 0:
        raise Recusa(f'{cmd[0]} falhou: {r.stderr.decode("utf-8", "replace")[-600:]}')
    return r.stdout


def ler_audio(caminho, sr=SR):
    bruto = roda(['ffmpeg', '-v', 'error', '-i', str(caminho), '-vn', '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'])
    return np.frombuffer(bruto, dtype=np.float32).astype(np.float64)


def duracao(caminho):
    return float(roda(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(caminho)]))


def niveis(x, sr=SR):
    n = int(JANELA * sr)
    w = len(x) // n
    rms = np.sqrt((x[: w * n].reshape(w, n) ** 2).mean(axis=1))
    return 20 * np.log10(np.maximum(rms, 1e-9))


def inicio_real(db, a, b):
    """A primeira janela com fala entre a e b; sem nenhuma, a."""
    i0, i1 = max(int(round(a / JANELA)), 0), min(int(b / JANELA), len(db) - 1)
    for i in range(i0, i1 + 1):
        if db[i] >= FALA_DB:
            return i * JANELA
    return a


def inicio_depois(db, a, b, cauda_ate):
    """O começo da palavra quando a busca começa na cauda da palavra de antes (outra tomada,
    colada na gravação): o som que já vinha em a é cauda até `cauda_ate`, e o começo é a
    primeira janela com fala depois do primeiro silêncio."""
    i0, i1 = max(int(round(a / JANELA)), 0), min(int(b / JANELA), len(db) - 1)
    i = i0
    while i <= i1 and db[i] >= FALA_DB and i * JANELA < cauda_ate:
        i += 1
    return inicio_real(db, i * JANELA, b)


def fim_real(db, a, b):
    """Depois de a: o fim da última janela com fala antes de 150 ms abaixo de −32 dB (ou de b)."""
    i0, i1 = max(int(round(a / JANELA)), 0), min(int(b / JANELA), len(db))
    ultima, corrida = i0, 0
    for i in range(i0, i1):
        if db[i] >= FALA_DB:
            ultima = i
        if db[i] < SILENCIO_DB:
            corrida += 1
            if corrida * JANELA >= CORRIDA:
                break
        else:
            corrida = 0
    return min((ultima + 1) * JANELA, b)


def sincronizar(camera, microfone):
    """O deslocamento d (tempo do microfone = tempo da câmera + d), por correlação a 16 kHz."""
    a, b = camera[:: SR // 16000], microfone[:: SR // 16000]
    c = correlate(b, a, mode='full', method='fft')
    k = int(np.argmax(c))
    forca = float(c[k] / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-12))
    if forca < CORRELACAO_MIN:
        raise Recusa(f'correlação fraca ({forca:.2f}, mínimo {CORRELACAO_MIN}): o microfone não parece a mesma fala da câmera')
    return (k - (len(a) - 1)) / 16000, forca


def no_tempo_da_camera(microfone, d, n):
    i = int(round(d * SR))
    x = microfone[i:] if i >= 0 else np.concatenate([np.zeros(-i), microfone])
    return np.pad(x, (0, max(0, n - len(x))))[:n]


def planejar(segs, ordem, db, fim_fonte):
    """Os pedaços de fonte de cada frase escolhida, com começo e fim no som real."""
    todas = sorted((w['inicio'], w['fim'], j) for j, s in enumerate(segs) for w in s.get('palavras', []))
    pedacos, inicios = [], {}

    def comeco_da(w, j):
        # a palavra de antes na gravação, de outro segmento: a busca não volta antes do começo
        # dela, e o som que vem dela é cauda até 0,3 s depois do fim que a transcrição marcou
        antes = [(i, f) for i, f, x in todas if x != j and i < w['inicio']]
        if not antes:
            return inicio_real(db, max(0.0, w['inicio'] - BUSCA_ANTES), w['fim'])
        ai, af = max(antes)
        return inicio_depois(db, max(w['inicio'] - BUSCA_ANTES, ai + 0.05), w['fim'], af + BUSCA_ANTES)

    for f in ordem:
        k, esc = f['frase'], f['escolhida']
        ws = segs[esc].get('palavras') or [{'texto': segs[esc]['texto'], 'inicio': segs[esc]['inicio'], 'fim': segs[esc]['fim']}]
        onsets = [comeco_da(ws[0], esc)] + [inicio_real(db, w['inicio'], w['fim']) for w in ws[1:]]
        depois = [(i, f, j) for i, f, j in todas if j != esc and i > ws[-1]['inicio']]
        teto = comeco_da({'inicio': depois[0][0], 'fim': depois[0][1]}, depois[0][2]) if depois else fim_fonte
        fim = fim_real(db, onsets[-1], min(onsets[-1] + (ws[-1]['fim'] - ws[-1]['inicio']) + 0.6, teto))
        comeco = max(0.0, onsets[0] - FOLGA)
        for w, o in zip(ws, onsets):
            inicios[(esc, w['inicio'])] = o
        for a, b, ob in zip(ws, ws[1:], onsets[1:]):
            fa = fim_real(db, inicios[(esc, a['inicio'])], ob)
            corte_a, corte_b = fa + SILENCIO_ALVO / 2, ob - SILENCIO_ALVO / 2
            minimo = PEDACO_MIN_LONGA if ob - fa > PAUSA_LONGA else PEDACO_MIN
            if ob - fa > SILENCIO_MAX and corte_a - comeco >= minimo and fim - corte_b >= minimo:
                pedacos.append({'frase': k, 'escolhida': esc, 'de': comeco, 'ate': corte_a})
                comeco = corte_b
        pedacos.append({'frase': k, 'escolhida': esc, 'de': comeco, 'ate': fim, 'teto': teto})
    # tomadas vizinhas na gravação nunca tocam o mesmo trecho duas vezes
    for a, b in zip(pedacos, pedacos[1:]):
        if a['de'] < b['de'] < a['ate']:
            b['de'] = a['ate']
    q = 0  # o tempo se conta em quadros inteiros: câmera e voz terminam no mesmo quadro
    for p in pedacos:
        n = round((p['ate'] - p['de']) * FPS)
        p['dur'], p['t'] = n / FPS, q / FPS
        p['ate'] = p['de'] + p['dur']
        q += n
    return pedacos, inicios, q


def remapear(segs, pedacos, inicios):
    palavras = []
    for p in pedacos:
        for w in segs[p['escolhida']].get('palavras', []):
            ini = inicios.get((p['escolhida'], w['inicio']), w['inicio'])
            if p['de'] - 0.02 <= ini < p['ate']:
                a = p['t'] + max(0.0, ini - p['de'])
                b = p['t'] + min(p['dur'], max(w['fim'], ini + 0.05) - p['de'])
                palavras.append({'texto': w['texto'], 'inicio': round(a, 3), 'fim': round(max(b, a + 0.05), 3), 'frase': p['frase']})
    return palavras


def montar_voz(fonte, pedacos, end_voz, respiro):
    n_total = int(round((end_voz + respiro) * SR))
    voz = np.zeros(n_total)

    def pedaco(a, b):
        i, j = max(int(round(a * SR)), 0), min(int(round(b * SR)), len(fonte))
        return fonte[i:j].copy() if j > i else np.zeros(0)

    def soma(t, x):
        i = int(round(t * SR))
        if i < 0:
            x, i = x[-i:], 0
        j = min(i + len(x), n_total)
        if j > i:
            voz[i:j] += x[: j - i]

    entrada = np.linspace(0, 1, int(0.005 * SR))
    for k, p in enumerate(pedacos):
        lead = J_CUT if k else 0.0
        x = pedaco(p['de'] - lead, p['ate'])
        x[: len(entrada)] *= entrada[: len(x)]
        soma(p['t'] - lead, x)
        proximo = pedacos[k + 1]['de'] if k + 1 < len(pedacos) else None
        limite = p.get('teto', proximo if proximo and proximo > p['ate'] else p['ate'] + CAUDA)
        fim_cauda = min(p['ate'] + CAUDA, max(limite, p['ate']), len(fonte) / SR)
        cauda = pedaco(p['ate'], fim_cauda)
        if len(cauda) > int(0.01 * SR):
            soma(p['t'] + p['dur'], cauda * np.linspace(1, 0, len(cauda)))
        elif k == len(pedacos) - 1:
            n = int(SAIDA_FINAL * SR)
            fim = int(round(end_voz * SR))
            voz[max(0, fim - n):fim] *= np.linspace(1, 0, min(n, fim))
    return voz


def normalizar(entrada, saida):
    med = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(entrada), '-af', 'loudnorm=I=-14:TP=-1:LRA=11:print_format=json',
                          '-f', 'null', '-'], capture_output=True, text=True, encoding='utf-8', errors='replace').stderr
    j = json.loads(med[med.rfind('{'):med.rfind('}') + 1])
    linear = Path(saida).with_name('voz-linear.wav')
    roda(['ffmpeg', '-v', 'error', '-y', '-i', str(entrada), '-af',
          f"loudnorm=I=-14:TP=-1:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:"
          f"measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true", '-ar', str(SR), '-ac', '1', str(linear)])
    falta = -14.0 - medir(linear)['lufs']
    roda(['ffmpeg', '-v', 'error', '-y', '-i', str(linear), '-af',
          f'volume={max(falta, 0):.2f}dB,alimiter=limit=0.891:attack=3:release=50:level=false', str(saida)])
    linear.unlink()
    return medir(saida)


def medir(caminho):
    m = mede(caminho)
    faltam = [nome for nome, v in (('o loudness', m['lufs']), ('o pico', m['pico_dbtp'])) if v is None]
    if faltam:   # não medir não é passar: sem a medida, a conta da normalização não tem base
        raise Recusa(f"a voz {caminho} não mediu {' nem '.join(faltam)}: o arquivo não tem áudio, é silêncio, ou o FFmpeg falhou")
    return m


def cortar_camera(fonte, pedacos, real, congelado, quadros, saida):
    partes = []
    for i, p in enumerate(pedacos):
        ate = p['ate'] + (real if i == len(pedacos) - 1 else 0)
        partes.append(f"[0:v]trim=start={p['de']:.4f}:end={ate:.4f},setpts=PTS-STARTPTS,fps={FPS},"
                      f"crop=w='if(gt(iw,ih),trunc(ih*9/32)*2,iw)':h=ih,setsar=1[v{i}]")
    cadeia = ';'.join(partes) + ';' + ''.join(f'[v{i}]' for i in range(len(pedacos)))
    cadeia += f'concat=n={len(pedacos)}:v=1:a=0,tpad=stop_mode=clone:stop_duration={congelado + 0.2:.4f}[v]'
    roda(['ffmpeg', '-v', 'error', '-y', '-i', str(fonte), '-filter_complex', cadeia, '-map', '[v]', '-an',
          '-frames:v', str(quadros), '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', '-g', '15',
          '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(saida)])


def cortar(fonte, palavras_json, tomadas_json, saida, audio=None, respiro=RESPIRO):
    segs = carregar(palavras_json)
    if not segs:
        raise Recusa('sem fala: a transcrição não tem segmento nenhum')
    with open(tomadas_json, encoding='utf-8') as f:
        escolha, erros = conferir(segs, json.load(f))
    if erros:
        raise Recusa('a escolha das tomadas não confere:\n' + '\n'.join(erros))
    saida = Path(saida)
    saida.mkdir(parents=True, exist_ok=True)
    fim_fonte = duracao(fonte)
    som = ler_audio(fonte)
    sincronia = None
    if audio:
        d, forca = sincronizar(som, ler_audio(audio))
        som = no_tempo_da_camera(ler_audio(audio), d, len(som))
        sincronia = {'deslocamento': round(d, 4), 'correlacao': round(forca, 3)}
    db = niveis(som)
    pedacos, inicios, q_voz = planejar(segs, escolha['ordem'], db, fim_fonte)
    end_voz = q_voz / FPS

    ultimo = pedacos[-1]
    depois = [w['inicio'] for s in segs for w in s.get('palavras', []) if w['inicio'] >= ultimo['ate']]
    folga = min(fim_fonte - ultimo['ate'] - 1 / FPS, (min(depois) - ultimo['ate'] - 0.05) if depois else 1e9)
    q_real = max(0, int(np.floor(min(respiro, RESPIRO_REAL, folga) * FPS + 1e-9)))
    q_cong = max(0, round(respiro * FPS) - q_real)
    real, congelado = q_real / FPS, q_cong / FPS
    avisos = []
    if folga < FOLGA_DO_AVISO and not depois:
        avisos.append(f'a gravação acaba em cima da última palavra: o último quadro congela por {congelado:.2f} s')
    elif folga < FOLGA_DO_AVISO:
        avisos.append(f'a próxima fala da gravação começa logo depois da última escolhida: o último quadro congela por {congelado:.2f} s')
    END = (q_voz + q_real + q_cong) / FPS

    bruta = saida / 'voz-montada.wav'
    voz = montar_voz(som, pedacos, end_voz, END - end_voz)
    pico = np.abs(voz).max()
    wavfile.write(bruta, SR, (voz / max(pico / 0.98, 1.0) * 32767).astype(np.int16))
    medida = normalizar(bruta, saida / 'voz.wav')
    bruta.unlink()
    cortar_camera(fonte, pedacos, real, congelado, q_voz + q_real + q_cong, saida / 'camera.mp4')

    frases = []
    for f in escolha['ordem']:
        ps = [p for p in pedacos if p['frase'] == f['frase']]
        frases.append({**f, 't_de': ps[0]['t'], 't_ate': round(ps[-1]['t'] + ps[-1]['dur'], 6)})
    cortes = {
        'fonte': str(fonte), 'fps': FPS, 'END': END, 'END_voz': end_voz,
        'respiro': {'real': round(real, 6), 'congelado': round(congelado, 6)}, 'avisos': avisos,
        'clipes': [{k: (round(v, 6) if isinstance(v, float) else v) for k, v in p.items() if k != 'teto'} for p in pedacos],
        'frases': frases, 'palavras': remapear(segs, pedacos, inicios),
        'trocas': escolha['trocas'], 'descartados': escolha['descartados'], 'sincronia': sincronia, 'voz': medida
    }
    (saida / 'cortes.json').write_text(json.dumps(cortes, ensure_ascii=False, indent=1), encoding='utf-8')
    return cortes


def main(argv):
    # o terminal do Windows grava em cp1252 quando a saída vai para arquivo: o JSON sai em UTF-8 sempre
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
    ap = argparse.ArgumentParser(description='o corte da fala do Reel falado')
    ap.add_argument('fonte')
    ap.add_argument('palavras')
    ap.add_argument('tomadas')
    ap.add_argument('--saida', required=True)
    ap.add_argument('--audio')
    ap.add_argument('--respiro', type=float, default=RESPIRO)
    a = ap.parse_args(argv)
    try:
        c = cortar(a.fonte, a.palavras, a.tomadas, a.saida, a.audio, a.respiro)
    except Recusa as e:
        print(str(e), file=sys.stderr)
        return 1
    print(f"END {c['END']:.3f} s ({round(c['END'] * FPS)} quadros), {len(c['clipes'])} pedaços, "
          f"voz {c['voz']['lufs']} LUFS e pico {c['voz']['pico_dbtp']} dBTP")
    for aviso in c['avisos']:
        print(f'aviso: {aviso}')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
