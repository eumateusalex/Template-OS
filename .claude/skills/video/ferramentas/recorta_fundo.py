"""Tira o fundo branco de um PNG (ilustração, personagem, ícone) para usar sobre
um fundo com textura no vídeo.

    python recorta_fundo.py <entrada.png> <saida.png>

Ilustração exportada com fundo branco vira, sobre uma textura ou uma cor, um
retângulo branco que apaga o que está atrás. `mix-blend-mode: multiply` resolve
no quadro parado, mas o render do HyperFrames não o aplica (medido): o conserto
é o PNG com transparência.

Só o branco LIGADO À BORDA vira transparente (preenchimento a partir das
bordas); o branco de dentro do desenho (pele, reflexo, o miolo de uma letra)
continua branco, e o fundo não atravessa o desenho. A borda do traço ganha 1 px
de transição para não serrilhar.

Precisa do Pillow (`python -m pip install pillow`).
"""
import sys

from PIL import Image, ImageDraw, ImageFilter

MARCA = (255, 0, 255)


def recorta(entrada, saida, limiar=28):
    im = Image.open(entrada).convert("RGBA")
    rgb = im.convert("RGB")
    w, h = rgb.size
    # sementes em toda a borda, a cada 40 px: pega fundo que as quinas não alcançam
    sementes = [(x, 0) for x in range(0, w, 40)] + [(x, h - 1) for x in range(0, w, 40)]
    sementes += [(0, y) for y in range(0, h, 40)] + [(w - 1, y) for y in range(0, h, 40)]
    for s in sementes:
        r, g, b = rgb.getpixel(s)
        if min(r, g, b) >= 255 - limiar:
            ImageDraw.floodfill(rgb, s, MARCA, thresh=limiar)
    px = rgb.load()
    mascara = Image.new("L", (w, h), 255)
    mp = mascara.load()
    for y in range(h):
        for x in range(w):
            if px[x, y] == MARCA:
                mp[x, y] = 0
    mascara = mascara.filter(ImageFilter.GaussianBlur(0.8))
    im.putalpha(mascara)
    im.save(saida)
    return sum(mascara.histogram()[:128]) / (w * h)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(2)
    print(f"fundo transparente: {recorta(sys.argv[1], sys.argv[2]):.0%} da imagem")
