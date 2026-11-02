"""tinta.py — onde está o texto, de que cor e de que peso, medido no pixel.

A "caixa de tinta" de um bloco é o retângulo dos pixels que fogem da cor do fundo
dentro de uma região. Ela não depende de fonte, de DOM nem de seletor: mede igual
o quadro do vídeo e a foto da reconstrução.

  python -I tinta.py moldura  <quadro-cheio.png>
  python -I tinta.py linhas   <quadro.png> <x0> <y0> <x1> <y1>
  python -I tinta.py colunas  <quadro.png> <x0> <y0> <x1> <y1> [vão-mínimo]
  python -I tinta.py medir    <alvos.json> <pasta-original>
  python -I tinta.py cores    <alvos.json> <pasta-original> [<pasta-reconstrucao>]
  python -I tinta.py comparar <alvos.json> <pasta-original> <pasta-reconstrucao>
  python -I tinta.py entrada  <posicoes-mov.json> <pasta-fotos-mov>

alvos.json:
  {
    "largura": 1400, "corte": "1400:876:100:194",
    "blocos": [
      {"nome": "titulo hero L1", "original": "s_2.0.png", "foto": "c1-hero.png",
       "caixa": [30, 520, 640, 612]}
    ],
    "cores": [
      {"nome": "fundo escuro", "original": "s_15.667.png", "foto": "c5-faq.png", "ponto": [100, 100]},
      {"nome": "tinta do titulo", "original": "s_2.0.png", "foto": "c1-hero.png", "caixa": [30, 520, 640, 612]}
    ]
  }

- "largura" é a do corte. A tolerância sai dela: 12 px a 1400, na proporção
  (14 px a 1682). "tolerancia" no arquivo vale mais que a conta.
- "caixa" é a região [x0, y0, x1, y1] onde procurar, nunca a resposta: deixe
  folga em volta do texto, e o canto de cima à esquerda TEM de ser fundo (a cor
  do fundo é lida ali). UMA linha e UM estilo por caixa: `linhas` e `colunas`
  mostram onde cortar e já sugerem a caixa.
- "foto" é o arquivo da reconstrução na mesma posição de rolagem.
- cor com "ponto" lê aquele pixel (fundo e área chapada). Cor de TEXTO vai com
  "caixa": sai a cor dos pixels que mais fogem do fundo. O TOM só vale em texto
  de uns 20 px para cima: o vídeo guarda a cor em meia resolução (yuv420), e no
  traço fino ela vai para o cinza e para a cor do fundo (medido: tinta escura de
  12 px sobre cartão azul lida #5B6C68). Em texto miúdo confie no claro-escuro;
  o tom se lê num texto grande ou numa área chapada da mesma cor.

O limiar de tinta é do bloco: metade do contraste do texto com o fundo, no
quadro original (no máximo 150). Texto cinza-claro, que um limiar fixo deixava
pontilhado, mede certo. O mesmo limiar vale para a foto.

comparar sai 1 quando:
  - um bloco some ou sai mais que a tolerância (FORA);
  - um TÍTULO (linha com 40 px de tinta ou mais) tem massa de tinta mais de 8%
    diferente da do original (PESO FORA). Massa é quantos pixels de tinta a caixa
    tem; cada 100 de peso de fonte muda uns 12%. A largura fecha no espaçamento
    com qualquer peso, então só a massa acusa;
  - um par (original, foto) não tem NENHUM bloco exclusivo: bloco que existe
    igual em outro quadro (navegação, logo) fica verde com a foto da seção errada;
  - a foto não tem a largura do corte, ou não há bloco.
Bloco com "sobre_foto": true (texto claro sobre foto ou fundo que se mexe) mede a
massa só pelos pixels da COR do texto, nos dois lados: a massa comum conta o fundo
junto e chegou a errar o sentido (disse "mais pesada" de um título 28% mais leve).
Texto miúdo só AVISA de 25% para cima (o borrão do vídeo espalha a massa ±20%),
e bloco de contraste baixo não tem a massa julgada (sai "n/c").

cores, com a pasta da reconstrução, compara cada cor que tem "foto" e sai 1 se
alguma diferir mais de 30 (soma dos três canais). Sem a pasta, só lê o vídeo.
Cor de texto de traço fino (menos de 4 px) sai "n/c" e não é julgada: a medida
não aguenta. Se uma cor importa e só existe em texto fino, declare-a como lida
no olho.

entrada confere o que o par de movimento só mostrava ao olho: em cada posição do
posicoes-mov.json, as caixas de "nasce" têm de estar VAZIAS no quadro 0 e com
tinta no último. Texto que já está lá antes de a seção entrar reprova. Posição
sem "nasce" reprova (varredura de rolagem, com "rolarAte", é dispensada). Com
"sobre_foto": true na posição, a tinta é só o que tem a cor do texto (texto claro
sobre foto ou fundo que se mexe).

Imprimem o resumo de máquina na última linha, começando por #.
"""

import json
import os
import sys

from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")

LIMIAR = 150  # teto da soma das diferenças RGB para um pixel contar como tinta
PISO = 36  # abaixo disso é ruído de compressão do vídeo
CONTRASTE_BAIXO = 240  # contraste (soma RGB) em que a massa deixa de ser confiável
# Medido com a Inter: cada 100 de peso de fonte muda a massa em uns 12%. Em título
# a medida é estável (os títulos certos ficaram a 2% um do outro); em texto miúdo o
# borrão do vídeo espalha (±20%).
MASSA_GRANDE = 0.08  # linha de texto com 40 px de tinta ou mais: reprova
MASSA_MIUDA = 0.25  # texto miúdo: avisa
COR = 30  # diferença de cor (soma RGB) que reprova
TRACO_GROSSO = 4  # px de traço a partir dos quais a cor de um texto é confiável
JA_ESTAVA = 0.5  # fração da tinta final que não pode estar no quadro 0


def abre(arquivo):
    return Image.open(arquivo).convert("RGB")


def dist(p, q):
    return abs(p[0] - q[0]) + abs(p[1] - q[1]) + abs(p[2] - q[2])


def fundo_e_contraste(im, regiao):
    x0, y0, x1, y1 = regiao
    px = im.load()
    fundo = px[x0 + 2, y0 + 2]
    maior = 0
    for y in range(y0, min(y1, im.height)):
        for x in range(x0, min(x1, im.width)):
            d = dist(px[x, y], fundo)
            if d > maior:
                maior = d
    return fundo, maior


def limiar_do(contraste):
    return max(PISO, min(LIMIAR, contraste // 2))


def tinta(im, regiao, limiar):
    """Caixa de tinta, número de pixels de tinta e as linhas (y) que têm tinta."""
    x0, y0, x1, y1 = regiao
    px = im.load()
    fundo = px[x0 + 2, y0 + 2]
    xs_min, xs_max, n = None, None, 0
    por_linha = {}
    for y in range(y0, min(y1, im.height)):
        c = 0
        for x in range(x0, min(x1, im.width)):
            if dist(px[x, y], fundo) > limiar:
                c += 1
                if xs_min is None or x < xs_min:
                    xs_min = x
                if xs_max is None or x > xs_max:
                    xs_max = x
        if c:
            por_linha[y] = c
            n += c
    if not n:
        return None, 0, {}
    return (xs_min, xs_max, min(por_linha), max(por_linha)), n, por_linha


def sobreposicao(im_a, im_b, regiao, limiar):
    """Que fração da tinta de A cai em pixel que também é tinta em B (1 = o mesmo desenho)."""
    x0, y0, x1, y1 = regiao
    pa, pb = im_a.load(), im_b.load()
    fa, fb = pa[x0 + 2, y0 + 2], pb[x0 + 2, y0 + 2]
    junto = total = 0
    for y in range(y0, min(y1, im_a.height, im_b.height)):
        for x in range(x0, min(x1, im_a.width, im_b.width)):
            if dist(pa[x, y], fa) > limiar:
                total += 1
                if dist(pb[x, y], fb) > limiar:
                    junto += 1
    return junto / total if total else 0


def faixas(por_linha):
    """As linhas de texto: faixas de y com tinta, cortadas também nos vales.

    Com entrelinha apertada o rabo do g encosta no topo da linha de baixo e não
    sobra fileira vazia; aí o corte é na fileira com menos tinta entre dois picos.
    """
    if not por_linha:
        return []
    ys = sorted(por_linha)
    grupos = [[ys[0], ys[0]]]
    for y in ys[1:]:
        if y - grupos[-1][1] <= 1:
            grupos[-1][1] = y
        else:
            grupos.append([y, y])
    alturas = sorted(b - a + 1 for a, b in grupos)
    tipica = alturas[0] if alturas else 0
    saida = []
    for a, b in grupos:
        # faixa bem mais alta que a menor: procura vales (menos de 12% do pico) para cortar
        if tipica and (b - a + 1) > 1.6 * tipica:
            pico = max(por_linha[y] for y in range(a, b + 1))
            inicio = a
            y = a + max(4, tipica // 2)
            while y < b - max(4, tipica // 2):
                if por_linha.get(y, 0) <= 0.12 * pico:
                    saida.append([inicio, y - 1])
                    while y <= b and por_linha.get(y, 0) <= 0.12 * pico:
                        y += 1
                    inicio = y
                    y += max(4, tipica // 2)
                else:
                    y += 1
            saida.append([inicio, b])
        else:
            saida.append([a, b])
    return [g for g in saida if g[1] - g[0] + 1 >= 2]


def cor_da_tinta(im, regiao):
    """A cor dos pixels que mais fogem do fundo: o miolo do traço, sem a borda borrada."""
    fundo, contraste = fundo_e_contraste(im, regiao)
    if contraste < PISO:
        return None
    x0, y0, x1, y1 = regiao
    px = im.load()
    longe = []
    for y in range(y0, min(y1, im.height)):
        for x in range(x0, min(x1, im.width)):
            p = px[x, y]
            if dist(p, fundo) > 0.8 * contraste:
                longe.append(p)
    if not longe:
        return None
    # mediana canal por canal: ordenar a cor inteira ordena só pelo vermelho
    return tuple(sorted(p[i] for p in longe)[len(longe) // 2] for i in range(3))


def massa_da_cor(im, regiao, cor, raio=60):
    """Quantos pixels têm a cor do texto (até `raio` na soma RGB). É a massa do bloco
    "sobre_foto": texto claro sobre foto ou aquarela que se mexe. Lá a massa comum
    conta o fundo junto (tudo que foge do canto de cima) e chegou a dizer "mais
    pesada" de um título que estava 28% mais leve, medido em pixel branco."""
    x0, y0, x1, y1 = regiao
    px = im.load()
    return sum(
        1
        for y in range(y0, min(y1, im.height))
        for x in range(x0, min(x1, im.width))
        if dist(px[x, y], cor) <= raio
    )

def traco(im, regiao):
    """A grossura do traço: a mediana das corridas horizontais de tinta, em px."""
    fundo, contraste = fundo_e_contraste(im, regiao)
    lim = limiar_do(contraste)
    x0, y0, x1, y1 = regiao
    px = im.load()
    corridas = []
    for y in range(y0, min(y1, im.height)):
        n = 0
        for x in range(x0, min(x1, im.width)):
            if dist(px[x, y], fundo) > lim:
                n += 1
            elif n:
                corridas.append(n)
                n = 0
        if n:
            corridas.append(n)
    corridas.sort()
    return corridas[len(corridas) // 2] if corridas else 0


def formata(c):
    return f"{c[0]}-{c[1]} / {c[2]}-{c[3]}" if c else "vazio"


def moldura(arquivo):
    """Onde a página está dentro do quadro: as bordas retas e longas do vídeo."""
    im = abre(arquivo)
    w, h = im.size
    px = im.load()

    def bordas(tam, outro, ler):
        achadas = []
        for i in range(1, tam):
            muda = sum(1 for j in range(0, outro, 3) if dist(ler(i - 1, j), ler(i, j)) > 40)
            fracao = muda / (outro / 3)
            if fracao >= 0.35:
                achadas.append((i, fracao))
        return achadas

    def junta(achadas):
        grupos = []
        for i, f in achadas:
            if grupos and i - grupos[-1][1] <= 2:
                grupos[-1][1] = i
                grupos[-1][2] = max(grupos[-1][2], f)
            else:
                grupos.append([i, i, f])
        return grupos

    cols = junta(bordas(w, h, lambda x, y: px[x, y]))
    lins = junta(bordas(h, w, lambda y, x: px[x, y]))
    mostra = lambda g: "  ".join(f"{a}" + (f"-{b}" if b != a else "") + f" ({f:.0%})" for a, b, f in g) or "nenhuma"
    print(f"quadro {w}x{h}")
    print("bordas verticais (x):   " + mostra(cols))
    print("bordas horizontais (y): " + mostra(lins))
    if len(cols) >= 2:
        x0, x1 = cols[0][1], cols[-1][0]
        largura = (x1 - x0) // 2 * 2  # a página, sem a coluna do fundo
        x0 -= x0 % 2  # para baixo, como o ffmpeg faria
        print(f"largura pela borda de fora: x {x0}, {largura} px (número par)")
    print("O topo da página é a escolha: com barra de navegador falso, é a borda logo ABAIXO dela;")
    print("com cartão de cantos redondos, é a borda de fora. Respiro branco com a mesma folga nos")
    print("lados é PÁGINA (padding), não moldura. Sem borda embaixo, o vídeo corta a página: a")
    print("altura do corte é só onde o vídeo acaba. Corte em número PAR: largura:altura:x:y.")
    print("Página de largura ímpar perde 1 px de um lado em qualquer corte par: tanto faz qual,")
    print("desde que o MESMO corte valha para todos os quadros e para o par de movimento.")


def linhas(arquivo, regiao):
    """As linhas de texto de uma região, com a caixa sugerida de cada uma."""
    im = abre(arquivo)
    x0, y0, x1, y1 = regiao
    _, contraste = fundo_e_contraste(im, regiao)
    lim = limiar_do(contraste)
    _, _, por_linha = tinta(im, regiao, lim)
    achadas = faixas(por_linha)
    if not achadas:
        print("nenhuma linha de tinta na região")
        return
    for n, (a, b) in enumerate(achadas):
        # a caixa sugerida nunca passa do meio do vão até a linha vizinha
        cima = (achadas[n - 1][1] + a) // 2 + 1 if n else max(y0, a - 6)
        baixo = (b + achadas[n + 1][0]) // 2 if n + 1 < len(achadas) else min(y1, b + 7)
        c, _, _ = tinta(im, [x0, a, x1, b + 1], lim)
        cx0 = max(x0, c[0] - 10)
        aviso = ""
        if n and a - achadas[n - 1][1] <= 3:
            aviso = "  (encostada na de cima: o vão tem menos de 3 px, e a caixa corta rabo de letra)"
        print(f"linha {n + 1}: y {a}-{b} (altura {b - a + 1})  x {c[0]}-{c[1]} (largura {c[1] - c[0] + 1})  caixa sugerida [{cx0}, {max(cima, a - 6)}, {min(x1, c[1] + 10)}, {min(baixo, b + 7)}]{aviso}")
    print("Confira a caixa: o canto de cima à esquerda tem de cair no fundo.")


def colunas(arquivo, regiao, vao=14):
    """Os grupos de uma linha separados por vão em x: dois estilos lado a lado, números em fila."""
    im = abre(arquivo)
    x0, y0, x1, y1 = regiao
    px = im.load()
    fundo, contraste = fundo_e_contraste(im, regiao)
    lim = limiar_do(contraste)
    com_tinta = [x for x in range(x0, min(x1, im.width)) if any(dist(px[x, y], fundo) > lim for y in range(y0, min(y1, im.height)))]
    if not com_tinta:
        print("nenhuma tinta na região")
        return
    grupos = [[com_tinta[0], com_tinta[0]]]
    for x in com_tinta[1:]:
        if x - grupos[-1][1] <= vao:
            grupos[-1][1] = x
        else:
            grupos.append([x, x])
    for n, (a, b) in enumerate(grupos):
        esq = (grupos[n - 1][1] + a) // 2 + 1 if n else max(x0, a - 10)
        dire = (b + grupos[n + 1][0]) // 2 if n + 1 < len(grupos) else min(x1, b + 10)
        print(f"grupo {n + 1}: x {a}-{b} (largura {b - a + 1})  caixa sugerida [{esq}, {y0}, {dire}, {y1}]")
    print(f"vão mínimo entre grupos: {vao} px. Confira que o canto de cima à esquerda de cada caixa cai no fundo.")


def entrada(posicoes_arq, fotos):
    """No quadro 0 de cada entrada, o que nasce ainda não pode estar lá."""
    posicoes = json.load(open(posicoes_arq, encoding="utf-8"))
    falhas = provas = 0
    for p in posicoes:
        if "rolarAte" in p:
            print(f"-     {p['nome']}: varredura de rolagem, sem quadro 0 de entrada")
            continue
        quadros = sorted(f for f in os.listdir(fotos) if f.startswith(p["nome"] + "-") and f.lower().endswith((".jpg", ".jpeg", ".png")))
        if len(quadros) < 2:
            print(f"FALHA {p['nome']}: sem a sequência em {fotos}")
            falhas += 1
            continue
        if not p.get("nasce"):
            print(f'FALHA {p["nome"]}: sem "nasce". Declare as caixas do que entra (o título, pelo menos), em px da foto.')
            falhas += 1
            continue
        primeiro, ultimo = abre(f"{fotos}/{quadros[0]}"), abre(f"{fotos}/{quadros[-1]}")
        p0, p1 = primeiro.load(), ultimo.load()
        for caixa in p["nasce"]:
            provas += 1
            _, contraste = fundo_e_contraste(ultimo, caixa)
            lim = limiar_do(contraste)
            c, n, _ = tinta(ultimo, caixa, lim)
            if not n:
                print(f"FALHA {p['nome']} {caixa}: nada nasceu aqui até o último quadro (caixa errada, ou a entrada não aconteceu)")
                falhas += 1
                continue
            x0, y0, x1, y1 = caixa
            fundo = p1[x0 + 2, y0 + 2]
            # "sobre_foto" na posição: a tinta é só o que tem a COR do texto (o fundo que
            # se mexe, como uma aquarela, contava como tinta nos dois quadros e dava 100%)
            cor = cor_da_tinta(ultimo, caixa) if p.get("sobre_foto") else None
            e_tinta = (lambda q: dist(q, cor) <= 60) if cor else (lambda q: dist(q, fundo) > lim)
            ja = total = 0
            for y in range(y0, min(y1, ultimo.height)):
                for x in range(x0, min(x1, ultimo.width)):
                    if e_tinta(p1[x, y]):
                        total += 1
                        if (e_tinta(p0[x, y]) if cor else dist(p0[x, y], p1[x, y]) < 60):
                            ja += 1
            if not total:
                print(f"FALHA {p['nome']} {caixa}: nada da cor do texto no último quadro")
                falhas += 1
                continue
            fracao = ja / total
            ruim = fracao > JA_ESTAVA
            falhas += ruim
            print(f"{'FALHA' if ruim else 'ok   '} {p['nome']} {caixa}: {fracao:.0%} da tinta final já estava no quadro 0" + ("  <-- JÁ ESTAVA LÁ antes de a seção entrar" if ruim else ""))
    print(f"# entradas {provas}  # falhas {falhas}")
    sys.exit(1 if falhas or not provas else 0)


def cores(alvos, original, foto):
    falhas = comparadas = finas = 0
    hexa = lambda v: f"#{v[0]:02X}{v[1]:02X}{v[2]:02X}" if v else "sem tinta"
    for c in alvos.get("cores", []):
        def le(pasta, nome):
            im = abre(f"{pasta}/{nome}")
            return cor_da_tinta(im, c["caixa"]) if "caixa" in c else im.getpixel(tuple(c["ponto"]))

        a = le(original, c["original"])
        # Cor de texto só se julga em traço grosso. Em traço fino a borda suavizada domina:
        # nem o vídeo nem a foto chegam à cor cheia, e cada um erra para um lado.
        fino = "caixa" in c and traco(abre(f"{original}/{c['original']}"), c["caixa"]) < TRACO_GROSSO
        if not foto or "foto" not in c:
            print(f"{c['nome']:30} {hexa(a)}" + ("  (traço fino: claro-escuro confiável, tom não)" if fino else ""))
            continue
        m = le(foto, c["foto"])
        if fino:
            finas += 1
            print(f"{c['nome']:30} {hexa(a):10} {hexa(m):10} n/c  (traço fino: cor não julgada; leia num título ou numa área chapada da mesma cor)")
            continue
        comparadas += 1
        d = dist(a, m) if a and m else 999
        ruim = d > COR
        falhas += ruim
        print(f"{c['nome']:30} {hexa(a):10} {hexa(m):10} dif {d if d < 999 else '-':>3}{'  <-- COR FORA' if ruim else ''}")
    if foto:
        sem = sum(1 for c in alvos.get("cores", []) if "foto" not in c)
        print(f"# cores {comparadas}  # fora {falhas}  # tolerancia {COR}  # traço fino (não julgadas) {finas}" + (f"  # sem foto {sem}" if sem else ""))
        sys.exit(1 if falhas or not comparadas else 0)


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    modo = sys.argv[1]

    if modo == "moldura":
        return moldura(sys.argv[2])
    if modo == "linhas" and len(sys.argv) >= 7:
        return linhas(sys.argv[2], [int(v) for v in sys.argv[3:7]])
    if modo == "colunas" and len(sys.argv) >= 7:
        return colunas(sys.argv[2], [int(v) for v in sys.argv[3:7]], int(sys.argv[7]) if len(sys.argv) > 7 else 14)
    if len(sys.argv) < 4:
        print(__doc__)
        sys.exit(1)
    if modo == "entrada":
        return entrada(sys.argv[2], sys.argv[3])

    alvos = json.load(open(sys.argv[2], encoding="utf-8"))
    original = sys.argv[3]
    cache = {}

    def quadro(pasta, nome):
        if (pasta, nome) not in cache:
            cache[(pasta, nome)] = abre(f"{pasta}/{nome}")
        return cache[(pasta, nome)]

    if modo == "cores":
        return cores(alvos, original, sys.argv[4] if len(sys.argv) > 4 else None)

    blocos = alvos.get("blocos", [])
    if modo == "medir":
        for b in blocos:
            im = quadro(original, b["original"])
            _, contraste = fundo_e_contraste(im, b["caixa"])
            c, _, por_linha = tinta(im, b["caixa"], limiar_do(contraste))
            n = len(faixas(por_linha))
            dim = f"largura {c[1] - c[0] + 1:4}  altura {c[3] - c[2] + 1:3}" if c else ""
            nota = f"  <-- {n} linhas numa caixa: uma por caixa" if n > 1 else ""
            print(f"{b['nome']:28} {formata(c):26} {dim}{nota}")
        return

    if modo != "comparar" or len(sys.argv) < 5:
        print(__doc__)
        sys.exit(1)
    foto = sys.argv[4]
    largura = alvos.get("largura")
    tol = alvos.get("tolerancia", round(12 * largura / 1400) if largura else 12)
    if largura:
        for nome in sorted({b["foto"] for b in blocos}):
            w = quadro(foto, nome).width
            if w != largura:
                print(f"FOTO NA LARGURA ERRADA: {nome} tem {w} px e o corte tem {largura}. Fotografe com QUADRO=<um quadro do vídeo>.")
                sys.exit(1)

    fora = pior = avisos = peso_fora = 0
    originais = sorted({b["original"] for b in blocos})
    exclusivo = {}
    print(f"{'':28}{'original x0-x1 / y0-y1':26}{'reconstrucao':26}{'dif (x0,x1,y0,y1)':20}massa")
    for b in blocos:
        im_o = quadro(original, b["original"])
        _, contraste = fundo_e_contraste(im_o, b["caixa"])
        lim = limiar_do(contraste)
        a, na, linhas_o = tinta(im_o, b["caixa"], lim)
        m, nm, _ = tinta(quadro(foto, b["foto"]), b["caixa"], lim)
        d = tuple(m[i] - a[i] for i in range(4)) if a and m else None
        ruim = d is None or max(abs(v) for v in d) > tol
        if d:
            pior = max(pior, max(abs(v) for v in d))
        fora += ruim
        nota = "  <-- FORA" if ruim else ""
        if b.get("sobre_foto") and d:
            # a massa vira a contagem de pixels da cor do texto, nos dois lados
            cor = cor_da_tinta(im_o, b["caixa"])
            if cor:
                na = massa_da_cor(im_o, b["caixa"], cor)
                nm = massa_da_cor(quadro(foto, b["foto"]), b["caixa"], cor)
        massa = f"{nm / na:.2f}" if d and na else "  - "
        if d and not ruim and na:
            if contraste < CONTRASTE_BAIXO and not b.get("sobre_foto"):
                massa = "n/c "
                nota = "  (contraste baixo: massa não julgada; confira cor e peso no par)"
            else:
                titulo = max((y1 - y0 + 1 for y0, y1 in faixas(linhas_o)), default=0) >= 40
                desvio = abs(nm - na) / na
                lado = "mais leve" if nm < na else "mais pesada"
                if titulo and desvio > MASSA_GRANDE:
                    peso_fora += 1
                    nota = f"  <-- PESO FORA: {lado} que o original (cada 100 de peso são uns 12%)"
                elif not titulo and desvio > MASSA_MIUDA:
                    avisos += 1
                    nota = f"  (aviso: {lado} que o original; texto miúdo, confira no par)"
        print(f"{b['nome']:28}{formata(a):26}{formata(m):26}{str(d) if d else '':20}{massa}{nota}")
        # o bloco é exclusivo do seu quadro se, nos outros quadros, a mesma caixa dá outra coisa.
        # "A mesma coisa" é a mesma caixa de tinta E a mesma tinta nos mesmos pixels: caixa
        # justa sobre uma região cheia (uma foto) dá caixa parecida sem ser o mesmo texto.
        so_dele = a is not None
        for outro in originais:
            if outro == b["original"] or not so_dele:
                continue
            o, no, _ = tinta(quadro(original, outro), b["caixa"], lim)
            if o and max(abs(o[i] - a[i]) for i in range(4)) <= tol and 0.6 <= no / na <= 1.6:
                if sobreposicao(im_o, quadro(original, outro), b["caixa"], lim) >= 0.5:
                    so_dele = False
        par = (b["original"], b["foto"])
        exclusivo[par] = exclusivo.get(par, False) or so_dele

    cegos = [par for par, tem in exclusivo.items() if not tem] if len(originais) > 1 else []
    for orig, ft in cegos:
        print(f"PAR SEM BLOCO EXCLUSIVO: {orig} x {ft}. Todo bloco dele existe igual em outro quadro; a foto da seção errada passaria. Meça um texto que só essa seção tem.")
    print(f"# blocos {len(blocos)}  # fora {fora}  # pior diferenca {pior}px  # tolerancia {tol}px  # peso fora {peso_fora}  # pares cegos {len(cegos)}  # avisos de peso {avisos}")
    sys.exit(1 if fora or peso_fora or cegos or not blocos else 0)


if __name__ == "__main__":
    main()
