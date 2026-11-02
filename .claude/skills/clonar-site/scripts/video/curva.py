"""curva.py — a curva de entrada de cada elemento, quadro a quadro, medida.

Para cada caixa, em cada quadro: quanto da tinta final já está lá (0 a 1, a "presença")
e quanto o centro de massa da tinta ainda está abaixo do final (em px, a "subida").
Roda igual sobre os quadros do vídeo e sobre os do clone: a mesma tabela dos dois lados
mostra se o ritmo, a ordem e a distância batem, o que antes só o olho via.

Uso:
  python -I "$S/curva.py" <pasta de quadros> <caixas.json> [fps | nome]
  caixas.json: {"fundo": [r, g, b] (opcional), "caixas": {"nome": [x0, y0, x1, y1], ...}}
  Os quadros são PNG em ordem de nome (q_0000.png, q_0001.png...), todos do mesmo tamanho.
Saída: uma linha por caixa com o instante (s) em que a presença passa de 10%, 50% e 90%,
e a subida em px no instante dos 10% — e a tabela inteira, se pedir com DETALHE=1.
"""
import json
import os
import sys

import numpy as np
from PIL import Image

pasta, arq = sys.argv[1], sys.argv[2]
fps = float(sys.argv[3]) if len(sys.argv) > 3 and sys.argv[3] != "nome" else 30
cfg = json.load(open(arq, encoding="utf-8"))
quadros = sorted(f for f in os.listdir(pasta) if f.lower().endswith(".png"))
# fps "nome": o tempo de cada quadro vem do nome (q_<ms>.png, do grava.mjs)
tempos = [int(f[2:-4]) / 1000 for f in quadros] if sys.argv[3:4] == ["nome"] else None
ims = [np.asarray(Image.open(os.path.join(pasta, f)).convert("L")).astype(float) for f in quadros]
ultimo = ims[-1]


def medir(im, caixa, fundo):
    x0, y0, x1, y1 = caixa
    t = np.clip(fundo - im[y0:y1, x0:x1] - 8, 0, None)  # tinta: o quanto é mais escuro que o fundo
    massa = t.sum()
    cy = (t.sum(axis=1) * np.arange(t.shape[0])).sum() / massa if massa > 0 else np.nan
    return massa, cy


for nome, caixa in cfg["caixas"].items():
    x0, y0, x1, y1 = caixa
    fundo = float(np.median(ultimo[y0:y1, x0:x1][ultimo[y0:y1, x0:x1] > np.percentile(ultimo[y0:y1, x0:x1], 60)]))
    final, cy_final = medir(ultimo, caixa, fundo)
    serie = [medir(im, caixa, fundo) for im in ims]
    pres = [m / final if final else 0 for m, _ in serie]
    def quando(frac):
        for i, p in enumerate(pres):
            if p >= frac:
                return tempos[i] if tempos else i / fps
        return None
    t10 = quando(0.1)
    i10 = (tempos.index(t10) if tempos else int(round(t10 * fps))) if t10 is not None else None
    subida = serie[i10][1] - cy_final if i10 is not None and not np.isnan(serie[i10][1]) else float("nan")
    fmt = lambda v: f"{v:5.2f}" if v is not None else "  -  "
    print(f"{nome:<22} 10% {fmt(t10)}  50% {fmt(quando(0.5))}  90% {fmt(quando(0.9))}  subida no 10%: {subida:5.1f} px")
    if os.environ.get("DETALHE"):
        print("   " + " ".join(f"{p:.2f}" for p in pres))
