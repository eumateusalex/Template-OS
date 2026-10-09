"""Mede áudio para a linha do tempo de vídeo: andamento, batidas, drops, o pico de
cada efeito, e se os efeitos caíram no quadro certo depois de mixados.

    python medir_audio.py musica <arquivo> [--json saida.json]
    python medir_audio.py efeito <arquivo>...
    python medir_audio.py acerto <video.mp4> <musica.wav> --inicio <s> --volume <v> --alvos <s1,s2,...>

musica: BPM, a grade de batidas (s), os drops (as maiores subidas de energia do
    grave, separadas por 4 s ou mais, ignorando os 2 primeiros segundos, que em
    faixa que nasce do silêncio parecem drop) e a sonoridade integrada.
efeito: o instante do PICO de cada arquivo. O efeito se posiciona pelo pico, não
    pelo começo do arquivo: um "whoosh" pode ter o pico aos 700 ms.
acerto: tira a música (o recorte que começa em --inicio, no --volume da peça) do
    áudio do vídeo e acha o pico do que sobra perto de cada alvo. É a conferência
    de que cada efeito caiu no quadro certo depois da mixagem (tolerância: 2 quadros).

Só numpy e o ffmpeg do PATH. Sem librosa de propósito: a medição é simples e a
dependência pesaria mais que ela.
"""
import json
import subprocess
import sys

import numpy as np

TAXA = 22050


def carrega(caminho, inicio=None, duracao=None):
    cmd = ["ffmpeg", "-v", "error"]
    if inicio is not None:
        cmd += ["-ss", str(inicio)]
    if duracao is not None:
        cmd += ["-t", str(duracao)]
    cmd += ["-i", caminho, "-vn", "-ac", "1", "-ar", str(TAXA), "-f", "f32le", "-"]
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype=np.float32)


def energia(sinal, janela=0.02, passo=0.005, grave=False):
    """RMS em janelas de `janela` s, a cada `passo` s (soma acumulada: rápido e exato)."""
    if grave:
        k = int(TAXA * 0.005)  # passa-baixa barato: média móvel de ~5 ms tira o agudo
        sinal = np.convolve(sinal, np.ones(k) / k, mode="same")
    j, p = int(TAXA * janela), int(TAXA * passo)
    acum = np.concatenate([[0.0], np.cumsum(sinal.astype(np.float64) ** 2)])
    inicios = np.arange(0, len(sinal) - j, p)
    return np.sqrt((acum[inicios + j] - acum[inicios]) / j)


def lufs(caminho):
    saida = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", caminho, "-af", "ebur128=framelog=quiet", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    linhas = [l for l in saida.splitlines() if l.strip().startswith("I:")]
    return float(linhas[-1].split()[1]) if linhas else None


def pico_refinado(ac, i):
    """Interpolação parabólica em volta do máximo: tira o degrau do passo da grade."""
    if 0 < i < len(ac) - 1:
        a, b, c = ac[i - 1], ac[i], ac[i + 1]
        den = a - 2 * b + c
        if den != 0:
            return i + 0.5 * (a - c) / den
    return float(i)


def mede_musica(caminho):
    s = carrega(caminho)
    passo = 0.005
    env = energia(s, passo=passo)
    onset = np.maximum(0, np.diff(env, prepend=env[0]))
    onset = onset - onset.mean()
    ac = np.correlate(onset, onset, mode="full")[len(onset) - 1:]
    lags = np.arange(len(ac)) * passo
    faixa = np.nonzero((lags >= 60 / 180) & (lags <= 60 / 70))[0]
    i = faixa[int(np.argmax(ac[faixa]))]
    lag = pico_refinado(ac, i) * passo
    # fase: o deslocamento que mais soma onset na grade (grade em float, sem acumular erro)
    n_fases = int(round(lag / passo))
    def soma_na_grade(f):
        n = int((len(onset) - f) * passo / lag)
        idx = np.round(f + np.arange(n) * lag / passo).astype(int)
        return onset[np.clip(idx, 0, len(onset) - 1)].sum()
    fase = max(range(n_fases), key=soma_na_grade)
    batidas = [round(fase * passo + k * lag, 3) for k in range(int((len(onset) * passo - fase * passo) / lag))]
    # drops: subidas do grave suavizado em 1 s; o degrau fica no meio das janelas comparadas
    passo_d = 0.02
    grave = energia(s, passo=passo_d, grave=True)
    k = int(1 / passo_d)
    suave = np.convolve(grave, np.ones(k) / k, mode="same")
    subida = suave[k:] - suave[:-k]
    tempo = (np.arange(len(subida)) + k // 2) * passo_d
    ordem = np.argsort(subida)[::-1]
    drops = []
    for j in ordem:
        t = tempo[j]
        if t < 2 or subida[j] <= 0:
            continue
        if all(abs(t - d) >= 4 for d in drops):
            drops.append(round(float(t), 2))
        if len(drops) == 3:
            break
    return {
        "arquivo": caminho,
        "duracao_s": round(len(s) / TAXA, 2),
        "bpm": round(60 / lag, 1),
        "batida_s": round(lag, 4),
        "primeira_batida_s": batidas[0] if batidas else None,
        "drop_s": drops[0] if drops else None,
        "drops_s": drops,
        "lufs": lufs(caminho),
        "batidas_s": batidas,
    }


def mede_efeito(caminho):
    s = carrega(caminho)
    env = energia(s, passo=0.005)
    return {"arquivo": caminho, "duracao_s": round(len(s) / TAXA, 3), "pico_s": round(int(np.argmax(env)) * 0.005, 3)}


def mede_acerto(video, musica, inicio, volume, alvos):
    mix = carrega(video)
    mus = carrega(musica, inicio=inicio, duracao=len(mix) / TAXA) * volume
    n = min(len(mix), len(mus))
    resto = mix[:n] - mus[:n]
    env = energia(resto, janela=0.01, passo=0.005)
    saida = []
    for alvo in alvos:
        i0, i1 = int(max(0, alvo - 0.4) / 0.005), int((alvo + 0.4) / 0.005)
        t = (i0 + int(np.argmax(env[i0:i1]))) * 0.005
        erro = t - alvo
        saida.append({"alvo_s": alvo, "pico_s": round(t, 3), "erro_ms": round(erro * 1000), "erro_quadros": round(erro * 30, 1), "ok": abs(erro * 30) <= 2})
    return saida


def main():
    args = sys.argv[1:]
    if not args or args[0] not in ("musica", "efeito", "acerto"):
        print(__doc__)
        sys.exit(2)
    valor = lambda n: args[args.index(n) + 1] if n in args else None
    if args[0] == "acerto":
        if len(args) < 3 or not valor("--alvos"):
            print(__doc__)
            sys.exit(2)
        r = mede_acerto(args[1], args[2], float(valor("--inicio") or 0), float(valor("--volume") or 1),
                        [float(x) for x in valor("--alvos").split(",")])
        for linha in r:
            print(json.dumps(linha, ensure_ascii=False))
        sys.exit(0 if all(l["ok"] for l in r) else 1)
    modo = args[0]
    destino = valor("--json")
    arquivos = [a for a in args[1:] if not a.startswith("--") and a != destino]
    resultado = [mede_musica(a) if modo == "musica" else mede_efeito(a) for a in arquivos]
    if destino:
        with open(destino, "w", encoding="utf8") as f:
            json.dump(resultado[0] if len(resultado) == 1 else resultado, f, ensure_ascii=False, indent=1)
    for r in resultado:
        print(json.dumps({k: v for k, v in r.items() if k != "batidas_s"}, ensure_ascii=False))


if __name__ == "__main__":
    main()
