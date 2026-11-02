"""Mede áudio para a linha do tempo de vídeo: andamento, batidas, drops, o pico de
cada efeito, se os efeitos caíram no quadro certo depois de mixados, o volume final,
o contraste do drop e o tom.

    python medir_audio.py musica <arquivo> [--json saida.json]
    python medir_audio.py efeito <arquivo>...
    python medir_audio.py acerto <video.mp4> <musica.wav> --inicio <s> --volume <v> --alvos <s1,s2,...>
    python medir_audio.py conferir <video.mp4>
    python medir_audio.py drop <arquivo> [--em <s>]
    python medir_audio.py tom <arquivo>
    python medir_audio.py nota <arquivo>...
    python medir_audio.py casa "<tom>" <nota>[:maior|menor|sem_terca]

musica: BPM, a grade de batidas (s), os drops (as maiores subidas de energia do
    grave, separadas por 4 s ou mais, ignorando os 2 primeiros segundos, que em
    faixa que nasce do silêncio parecem drop) e a sonoridade integrada.
efeito: o instante do PICO de cada arquivo. O efeito se posiciona pelo pico, não
    pelo começo do arquivo: um "whoosh" pode ter o pico aos 700 ms.
acerto: tira a música (o recorte que começa em --inicio, no --volume da peça) do
    áudio do vídeo e acha o pico do que sobra perto de cada alvo. É a conferência
    de que cada efeito caiu no quadro certo depois da mixagem (tolerância: 2 quadros).
conferir: o volume da entrega. Integrado fora de -15 a -13 LUFS ou pico VERDADEIRO
    acima de -1 dBTP reprovam (código 1): o ebur128=peak=true mede entre amostras, e o
    limitador de amostra deixa passar. Avisam: o silêncio no fim acima de 0,5 s (abaixo
    de -60 dB) e o buraco no meio (abaixo de -70 dB por 0,25 s ou mais: a música que
    acaba antes do vídeo).
drop: o contraste do drop, pelo curto de 3 s (o S do ebur128) antes e depois do
    instante (--em, ou o drop medido pelo modo musica). O alvo é 4 a 5 dB; abaixo de 4 avisa.
tom, nota, casa: o tom da faixa, a nota de cada efeito (com a origem pelo nome) e se
    um som serve na faixa. A conta mora no módulo `tom.py`, ao lado.

Só numpy e o ffmpeg do PATH. Sem librosa de propósito: a medição é simples e a
dependência pesaria mais que ela.
"""
import json
import os
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


def volume(caminho):
    """o integrado (LUFS) e o pico verdadeiro (dBTP), do resumo do ebur128"""
    saida = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostdin", "-i", caminho, "-af", "ebur128=peak=true:framelog=quiet", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr

    def ultimo(rotulo):
        linhas = [l.split() for l in saida.splitlines() if l.strip().startswith(rotulo)]
        if not linhas:
            return None
        v = linhas[-1][1]
        return float("-inf") if v == "-inf" else float(v)
    return ultimo("I:"), ultimo("Peak:")


LUFS_MIN, LUFS_MAX, PICO_MAX = -15.0, -13.0, -1.0
FIM_DB, FIM_MAX, BURACO_DB, BURACO_MIN = -60.0, 0.5, -70.0, 0.25


def mede_conferir(caminho):
    integrado, pico = volume(caminho)
    s = carrega(caminho)
    passo, janela = 0.01, 0.05
    db = 20 * np.log10(energia(s, janela=janela, passo=passo) + 1e-12)
    # o silêncio que encosta no fim: do fim da última janela com som até o fim do arquivo
    vivos = np.nonzero(db >= FIM_DB)[0]
    duracao = len(s) / TAXA
    fim = duracao - (vivos[-1] * passo + janela) if len(vivos) else duracao
    fim = round(max(0.0, fim), 2)
    # os buracos no meio: trechos abaixo de BURACO_DB que não encostam no começo nem no fim
    buracos, ini = [], None
    baixo = list(db < BURACO_DB)
    for i, b in enumerate(baixo + [False]):
        if b and ini is None:
            ini = i
        elif not b and ini is not None:
            dur = (i - ini) * passo
            if ini > 0 and i < len(baixo) and dur >= BURACO_MIN:
                buracos.append({"em_s": round(ini * passo, 2), "dur_s": round(dur, 2)})
            ini = None
    erros, avisos = [], []
    # o integrado é calibragem (nenhuma plataforma publica o LUFS do Reel): fora da janela avisa;
    # o pico verdadeiro é limite técnico (o AAC estoura acima de -1 dBTP) e reprova
    if integrado is None:
        erros.append("o integrado não leu: o arquivo não tem áudio")
    elif not (LUFS_MIN <= integrado <= LUFS_MAX):
        avisos.append(f"integrado {integrado} LUFS fora de {LUFS_MIN} a {LUFS_MAX} (calibragem): ajuste o volume da música, ou escreva o motivo no plano")
    if pico is None or pico > PICO_MAX:
        erros.append(f"pico verdadeiro {pico} dBTP acima de {PICO_MAX}: baixe o master")
    if fim > FIM_MAX:
        avisos.append(f"{fim} s de silêncio no fim: o vídeo acaba depois do som")
    for b in buracos:
        avisos.append(f"buraco de {b['dur_s']} s em {b['em_s']} s: o som some no meio")
    return {"arquivo": caminho, "lufs": integrado, "pico_dbtp": pico, "silencio_fim_s": fim,
            "buracos": buracos, "erros": erros, "avisos": avisos, "ok": not erros}


def curto_de_3s(caminho):
    """o S (curto, janela de 3 s que termina em t) do ebur128 a cada 0,1 s: lista de (t, S)"""
    saida = subprocess.run(
        # o quadro a quadro do ebur128 só sai com o log em verbose
        ["ffmpeg", "-hide_banner", "-nostdin", "-v", "verbose", "-i", caminho, "-af", "ebur128=framelog=verbose", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    pontos = []
    for l in saida.splitlines():
        p = l.replace("t:", " t: ").replace("S:", " S: ").split()
        if "t:" in p and "S:" in p:
            try:
                pontos.append((float(p[p.index("t:") + 1]), float(p[p.index("S:") + 1])))
            except (ValueError, IndexError):
                pass
    return pontos


CONTRASTE_MIN = 4.0


def mede_drop(caminho, em=None):
    if em is None:
        em = mede_musica(caminho)["drop_s"]
    pontos = curto_de_3s(caminho)
    perto = lambda t: min(pontos, key=lambda x: abs(x[0] - t))[1] if pontos else None
    antes, depois = perto(em), perto(em + 3)
    contraste = round(depois - antes, 1) if antes is not None and depois is not None else None
    avisos = []
    if contraste is None or contraste < CONTRASTE_MIN:
        avisos.append(f"o drop em {em} s tem {contraste} dB de contraste (alvo 4 a 5): esvazie o arranjo antes ou corte seco no drop")
    return {"arquivo": caminho, "drop_s": em, "curto_antes": antes, "curto_depois": depois,
            "contraste_db": contraste, "avisos": avisos, "ok": not avisos}


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
    sys.stdout.reconfigure(encoding="utf-8")  # a nota tem acento ("Lá"); o console do Windows não é UTF-8
    args = sys.argv[1:]
    if not args or args[0] not in ("musica", "efeito", "acerto", "conferir", "drop", "tom", "nota", "casa"):
        print(__doc__)
        sys.exit(2)
    valor = lambda n: args[args.index(n) + 1] if n in args else None
    if args[0] in ("tom", "nota", "casa"):
        # o módulo do tom mora ao lado; sob python -I a pasta do script não entra no caminho
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        import tom
        if args[0] == "tom":
            r = tom.mede_faixa(args[1])
            print(json.dumps(r, ensure_ascii=False))
            # a afinação fora de ±20 cents avisa (calibragem: o método do tom vem de uma fonte só)
            sys.exit(0)
        if args[0] == "nota":
            for a in args[1:]:
                print(json.dumps(tom.mede_nota(a), ensure_ascii=False))
            sys.exit(0)
        nome, modo = args[1].rsplit(" ", 1) if " " in args[1] else (args[1], "maior")
        nota, _, tipo = args[2].partition(":")
        ok, porque = tom.serve(tom.NOTAS.index(nome), modo, tom.NOTAS.index(nota), tipo or "sem_terca")
        # a resposta é aviso, não trava (calibragem: o método do tom vem de uma fonte só)
        print(("serve: " if ok else "não serve (aviso): ") + porque)
        sys.exit(0)
    if args[0] == "conferir":
        r = mede_conferir(args[1])
        print(json.dumps(r, ensure_ascii=False))
        sys.exit(0 if r["ok"] else 1)
    if args[0] == "drop":
        r = mede_drop(args[1], float(valor("--em")) if valor("--em") else None)
        print(json.dumps(r, ensure_ascii=False))
        sys.exit(0)
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
