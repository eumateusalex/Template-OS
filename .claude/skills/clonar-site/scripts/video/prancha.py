"""prancha.py — o que o olho confere: original e reconstrução lado a lado.

  python -I prancha.py pares <alvos.json> <pasta-original> <pasta-fotos> <saida>
    um JPG por par (original | reconstrução), tirados dos "blocos" do alvos.json
    (cada par original+foto uma vez só), em tamanho real (clique abre o arquivo),
    com a LUPA de cada bloco medido ampliado; mais <saida>/comparacao.html, a
    página que mostra todos em sequência. Os pares de movimento (mov-*.jpg) que
    já estiverem em <saida> entram na mesma página: rode `movimento` antes.

  python -I prancha.py movimento <video> <CORTE> <t0> <passo-ms> <pasta-fotos> <prefixo> <saida>
    o PAR de movimento: em cima, os quadros do vídeo a partir de t0, um a cada
    passo; embaixo, as fotos <prefixo>-00, -01... do fotografa.mjs MODO=sequencia,
    na mesma ordem. Grava <saida>/mov-<prefixo>.jpg. O passo é o PASSO do
    fotografa (300 por padrão); numa varredura de rolagem o tempo não casa, e o
    par mostra só a ordem dos estados.

  python -I prancha.py sequencia <pasta-fotos> <prefixo> <saida.jpg>
    só as fotos <prefixo>-NN (jpg ou png) numa folha de 4 por linha.

A régua de número (tinta.py comparar) não vê cor, foto, ícone, QUAL texto está
escrito nem movimento. Entrada quebrada passa nela verde: é a folha de
sequência que pega o texto que já está na tela antes de a seção entrar. A prancha existe para isso, e se olha em tamanho real.
"""

import json
import os
import subprocess
import sys
import tempfile

from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")

LADO = 1700  # teto de cada metade do par: até aí ele sai em tamanho real
LUPA = 2  # quanto a lupa amplia cada bloco


def encaixa(arquivo, largura):
    im = Image.open(arquivo).convert("RGB")
    return im.resize((largura, round(im.height * largura / im.width)))


def fotos_de(pasta, prefixo):
    return sorted(f for f in os.listdir(pasta) if f.startswith(prefixo + "-") and f.lower().endswith((".jpg", ".jpeg", ".png")))


def pares(alvos_arq, original, fotos, saida):
    os.makedirs(saida, exist_ok=True)
    vistos = []
    blocos = json.load(open(alvos_arq, encoding="utf-8"))["blocos"]
    for b in blocos:
        par = (b["original"], b["foto"])
        if par not in vistos:
            vistos.append(par)
    linhas = []
    for orig, foto in vistos:
        ao, mo = Image.open(f"{original}/{orig}").convert("RGB"), Image.open(f"{fotos}/{foto}").convert("RGB")
        lado = min(LADO, ao.width)
        a, m = encaixa(f"{original}/{orig}", lado), encaixa(f"{fotos}/{foto}", lado)
        tela = Image.new("RGB", (lado * 2, max(a.height, m.height)), "white")
        tela.paste(a, (0, 0))
        tela.paste(m, (lado, 0))
        nome = os.path.splitext(foto)[0] + ".jpg"
        tela.save(f"{saida}/{nome}", quality=88)
        # a lupa: cada bloco medido deste par, ampliado, original em cima e reconstrução embaixo.
        # Quebra de linha trocada e número 15% menor não aparecem no par inteiro; aqui aparecem.
        recortes = []
        for b in blocos:
            if (b["original"], b["foto"]) != (orig, foto):
                continue
            x0, y0, x1, y1 = b["caixa"]
            w, h = (x1 - x0) * LUPA, (y1 - y0) * LUPA
            tira = Image.new("RGB", (w, h * 2 + 6), "#c00")
            tira.paste(ao.crop((x0, y0, x1, y1)).resize((w, h), Image.LANCZOS), (0, 0))
            tira.paste(mo.crop((x0, y0, x1, y1)).resize((w, h), Image.LANCZOS), (0, h + 6))
            recortes.append(tira)
        lupa = ""
        if recortes:
            largura = max(t.width for t in recortes)
            folha_lupa = Image.new("RGB", (largura, sum(t.height + 14 for t in recortes)), "white")
            y = 0
            for t in recortes:
                folha_lupa.paste(t, (0, y))
                y += t.height + 14
            lupa = "lupa-" + nome
            folha_lupa.save(f"{saida}/{lupa}", quality=90)
        linhas.append(
            f'<figure><figcaption>{nome}</figcaption><a href="{nome}"><img src="{nome}" alt="{nome}"></a></figure>'
            + (f'<details><summary>Lupa de {nome}: cada bloco medido, {LUPA}x (em cima o vídeo, embaixo a reconstrução)</summary><img src="{lupa}" alt="lupa" style="width:auto;max-width:100%"></details>' if lupa else "")
        )
    movimentos = sorted(f for f in os.listdir(saida) if f.startswith("mov-") and f.endswith(".jpg"))
    acima = os.path.dirname(os.path.abspath(saida))
    videos = sorted(f for f in os.listdir(acima) if f.lower().endswith(".mp4"))
    html = (
        '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1"><title>Original e reconstrução</title>'
        "<style>body{margin:0;padding:24px 16px;background:#16171a;color:#e8e8e8;font:15px system-ui,sans-serif}"
        "figure{margin:0 0 32px}figcaption{margin:0 0 6px;color:#9a9a9a}img{width:100%;height:auto;display:block}"
        "h2{font-size:18px;margin:40px 0 12px}details{margin:-20px 0 36px}summary{cursor:pointer;color:#c9d36a;margin-bottom:10px}"
        ".lado{display:grid;grid-template-columns:1fr 1fr;color:#9a9a9a;margin-bottom:12px}</style></head><body>"
        + (f'<h2>O vídeo original</h2><video src="../{videos[0]}" controls muted loop playsinline style="width:100%;max-width:900px;display:block"></video>' if videos else "")
        + "<h2>Em repouso</h2>"
        '<div class="lado"><span>original (vídeo)</span><span>reconstrução</span></div>'
        + "".join(linhas)
        + ("<h2>Movimento: em cima o vídeo, embaixo a reconstrução</h2>" if movimentos else "")
        + "".join(f'<figure><figcaption>{m}</figcaption><img src="{m}" alt="{m}"></figure>' for m in movimentos)
        + "</body></html>"
    )
    open(f"{saida}/comparacao.html", "w", encoding="utf-8").write(html)
    print(f"pares: {len(vistos)} em repouso e {len(movimentos)} de movimento em {saida} (abrir comparacao.html)")


def folha(quadros, colunas, rotulo=None):
    """Uma grade de quadros já redimensionados, 4 px entre eles."""
    w, h = quadros[0].size
    linhas = -(-len(quadros) // colunas)
    tela = Image.new("RGB", (colunas * (w + 4), linhas * (h + 4)), "black")
    for i, q in enumerate(quadros):
        tela.paste(q, ((i % colunas) * (w + 4), (i // colunas) * (h + 4)))
    return tela


def sequencia(fotos, prefixo, saida):
    arquivos = fotos_de(fotos, prefixo)
    if not arquivos:
        print(f"nenhuma foto {prefixo}-NN (jpg ou png) em {fotos}")
        sys.exit(1)
    folha([encaixa(f"{fotos}/{f}", 500) for f in arquivos], 4).save(saida, quality=85)
    print(f"folha: {len(arquivos)} quadros em {saida}")


def movimento(video, corte, t0, passo, fotos, prefixo, saida):
    arquivos = fotos_de(fotos, prefixo)
    if not arquivos:
        print(f"nenhuma foto {prefixo}-NN (jpg ou png) em {fotos}")
        sys.exit(1)
    os.makedirs(saida, exist_ok=True)
    n = len(arquivos)
    largura = max(250, 2000 // n - 4)
    do_video = []
    with tempfile.TemporaryDirectory() as tmp:
        for i in range(n):
            alvo = os.path.join(tmp, f"v{i:02d}.png")
            t = float(t0) + i * float(passo) / 1000
            r = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", video, "-frames:v", "1", "-vf", f"crop={corte}", alvo])
            if r.returncode or not os.path.exists(alvo):
                print(f"o vídeo acabou antes de {t:.2f}s: par com {i} quadros")
                break
            do_video.append(encaixa(alvo, largura))
    if not do_video:
        sys.exit(1)
    meus = [encaixa(f"{fotos}/{f}", largura) for f in arquivos[: len(do_video)]]
    cima, baixo = folha(do_video, len(do_video)), folha(meus, len(meus))
    tela = Image.new("RGB", (cima.width, cima.height + baixo.height + 8), "#c00")
    tela.paste(cima, (0, 0))
    tela.paste(baixo, (0, cima.height + 8))
    alvo = os.path.join(saida, f"mov-{prefixo}.jpg")
    tela.save(alvo, quality=86)
    print(f"par de movimento: {len(do_video)} quadros (vídeo em cima, de {float(t0):.2f}s, a cada {passo} ms) em {alvo}")


if len(sys.argv) >= 6 and sys.argv[1] == "pares":
    pares(*sys.argv[2:6])
elif len(sys.argv) >= 9 and sys.argv[1] == "movimento":
    movimento(*sys.argv[2:9])
elif len(sys.argv) >= 5 and sys.argv[1] == "sequencia":
    sequencia(*sys.argv[2:5])
else:
    print(__doc__)
    sys.exit(1)
