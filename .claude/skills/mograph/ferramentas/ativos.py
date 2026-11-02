"""Os componentes e os sons do usuário: os índices dos pacotes de material e a cópia para a peça.

    python ativos.py indice --pacote <nome> [--raiz <pasta do pacote>]
    python ativos.py buscar <termo> [--tipo som|musica|3d|imagem]
    python ativos.py trazer <pacote>:<caminho relativo do índice> <pasta da peça> [--largura 720] [--nome <nome>] [--uso organico|anuncio|cliente]
    python ativos.py anotar
    python ativos.py onde                     (a raiz de material desta máquina e os pacotes, em JSON)
    (todos aceitam --indices <pasta>, para gravar e ler os índices fora do acervo, como no teste)

Os pacotes (o material que o usuário comprou, baixou ou recebeu) moram fora do git, numa raiz de
material por máquina, e se declaram no `material.local.json` ao lado deste arquivo (fora do git; o
modelo é o `material.exemplo.json`; o VIDEO_MATERIAL_CONFIG troca o caminho dele, e o VIDEO_MATERIAL
troca só a raiz):

    {"raiz": "<pasta do seu material>",
     "pacotes": {"<nome>": {"raiz": "<pasta do pacote dentro da raiz>",
                            "pastas": {"som": "<pasta dos efeitos>", "musica": ".", "3d": "...", "emoji": "...", "imagem": "..."},
                            "licenca": "<o que a licença do pacote libera, lida no dia>",
                            "clara": false}}}

`pastas` diz onde mora cada tipo dentro do pacote ("." é a pasta do pacote); `clara` diz se o som
entra em anúncio e em peça de cliente. Sem pacote declarado, o índice fica vazio e a busca não acha
nada: a reserva é o Mixkit (`.claude/skills/video/som.md`, "Achar"). Cada pacote ganha um índice em
`acervo/ativos/<pacote>.json`, com o caminho relativo à pasta do pacote, a licença e a medida de cada
arquivo. O índice vazio não se grava (a raiz errada não apaga o índice que existe), e a pasta de cada
tipo se acha sem diferença de caixa, acento ou espaço ("EFEITOS SONOROS" e "efeitos-sonoros" são a
mesma). O `--raiz` aponta a pasta do pacote direto, sem a raiz de material.

O `kit` é o pacote embutido da /mograph: o material que o `/instalar` põe em `material/` dentro da
skill (fora do git), com o índice `acervo/ativos/kit.json` no git. Ele não se declara e não depende
da raiz de material: `trazer kit:<arquivo>` lê de lá, e sem o material instalado a mensagem manda
rodar o `/instalar`. O nome `kit` no material.local.json é ignorado: os pacotes da pessoa usam outro.

indice: anda pela pasta do pacote e mede cada arquivo. Som: duração, o instante do
    pico (o efeito se posiciona pelo pico, `.claude/skills/video/som.md`), o nível do
    pico em dB e a parte da energia abaixo de 150 Hz (som "embolado" no celular passa
    de ~35%). Vídeo 3D: duração, tamanho e se tem transparência (ProRes 4444 com alfa).
    Imagem: tamanho e se tem alfa. O som ganha a nota dominante e o quanto tem altura (`nota`,
    `conc`, pelo `tom.py` da `/video`) e a origem (`origem`: o banco que o nome denuncia, ou o
    próprio pacote).
buscar: o que casa com o termo no caminho (a pasta do pacote já costuma dizer o papel: WOOSH,
    RISER, PLIM, POPS, CLICK...).
anotar: marca no índice que já existe, sem o pacote, a origem de cada som e o que fica fora.
trazer: copia para `<peça>/ativos/`. O item marcado `fora` não se traz. Com `--uso anuncio`
    ou `--uso cliente`, o material de pacote sem licença clara (o som e o 3D) avisa: lá só entra o de
    licença clara.
    O vídeo 3D vira WebM VP9 com alfa na largura pedida (o HyperFrames toca com transparência);
    o som vira WAV 48 kHz (o MP3 traz atraso de codificador); a imagem vai como está. Nunca
    sobrescreve: arquivo que já existe com outro conteúdo ganha nome novo (mídia fora do git não
    tem volta).

O emoji de pessoa real, de personagem de outra marca ou de arma fica fora, e o emoji e a imagem de
clip-art (escudo, troféu, foguete, lâmpada) também: fica o ícone de app real e o objeto que é a ideia.
O 3D entra inteiro, até o de nome de clip-art: o objeto 3D entra quando a frase nomeia a coisa. Só
numpy e o ffmpeg do PATH.
"""
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import unicodedata

import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
INDICES = os.path.join(AQUI, "..", "acervo", "ativos")
CONFIG = os.path.join(AQUI, "material.local.json")
# os pacotes do usuário, lidos do material.local.json (configurar(), abaixo); vazio sem ele
PACOTES = {}
# o pacote embutido: o material do kit, instalado pelo /instalar dentro da skill, com o índice no git
KIT = "kit"
# o MOGRAPH_MATERIAL troca a pasta, nos testes
KIT_MATERIAL = os.environ.get("MOGRAPH_MATERIAL") or os.path.join(AQUI, "..", "material")
KIT_PACOTE = {"raiz": "som", "base": KIT_MATERIAL, "pastas": {"som": "."},
              "licenca": "o kit da /mograph: uso livre nas peças, inclusive anúncio e cliente", "clara": True}
EXT = {"som": (".wav", ".mp3", ".aac", ".m4a"), "musica": (".wav", ".mp3", ".aac", ".m4a", ".flac"), "3d": (".mov", ".mp4", ".webm"), "emoji": (".png", ".webp", ".jpg", ".jpeg"), "imagem": (".png", ".webp", ".jpg", ".jpeg")}
TAXA = 22050
# emoji que é pessoa real, personagem de outra marca ou arma não entra em peça: a marca e a
# imagem são de terceiro, e arma não serve a nenhuma peça
TERCEIROS = ("batman", "biden", "drake", "elon", "walter", "dora", "fortnite", "gadzhi", "jong", "kanye", "ksi", "lebron",
             "marquez", "margot", "mario", "yoshi", "peter-griffin", "pope", "putin", "queen", "shakira", "the-rock", "yoda",
             "porche", "lamborghini", "mcqueen", "transformers", "discord", "tiktok", "hulk", "jesus", "ar-15", "f-15",
             "aero-15", "gun", "sniper", "ghillie", "pen-15")
# o clip-art que deixa o emoji e a imagem genéricos: escudo, troféu (a taça), foguete e lâmpada, em inglês e em português
CLIP_ART = re.compile(r"shield|rocket|lightbulb|(^|/)cup[-_ .]|trophy|trof[eé]u|escudo|foguete|l[aâ]mpada", re.I)
FORA_TERCEIRO = "pessoa real, personagem de terceiro ou arma: não entra em peça"
FORA_CLIP_ART = "clip-art (escudo, troféu, foguete, lâmpada): deixa o emoji e a imagem genéricos; o que faltar se gera pelo /gerar-imagem"
# os tipos com a trava do clip-art: o emoji e a imagem. O 3D entra inteiro, e o som e a música nunca a tiveram
VISUAIS = ("emoji", "imagem")
VIDEO = os.path.join(AQUI, "..", "..", "video", "ferramentas")


def tom():
    """o tom.py da /video (a nota e a origem moram lá: uma fonte só)"""
    if VIDEO not in sys.path:
        sys.path.insert(0, VIDEO)
    import tom as t
    return t


def marcar(item):
    """o que se sabe pelo nome: o que fica fora e, no som, de onde ele parece vir"""
    nome = item["caminho"].lower()
    if item["tipo"] == "emoji" and any(p in nome for p in TERCEIROS):
        item["fora"] = FORA_TERCEIRO
    elif item["tipo"] in VISUAIS and CLIP_ART.search(nome):
        item["fora"] = FORA_CLIP_ART
    if item["tipo"] in ("som", "musica"):
        item["origem"] = tom().origem_do_nome(item["caminho"])
    return item


def sondar(caminho):
    saida = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,codec_name,width,height,pix_fmt:format=duration", "-of", "json", caminho],
        capture_output=True, text=True,
    ).stdout
    try:
        return json.loads(saida)
    except json.JSONDecodeError:
        return {}


def carrega(caminho):
    cmd = ["ffmpeg", "-v", "error", "-i", caminho, "-vn", "-ac", "1", "-ar", str(TAXA), "-f", "f32le", "-"]
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype=np.float32)


def mede_som(caminho):
    s = carrega(caminho)
    if len(s) < TAXA * 0.02:
        return {"duracao_s": round(len(s) / TAXA, 3)}
    j, p = int(TAXA * 0.02), int(TAXA * 0.005)
    acum = np.concatenate([[0.0], np.cumsum(s.astype(np.float64) ** 2)])
    ini = np.arange(0, len(s) - j, p)
    env = np.sqrt((acum[ini + j] - acum[ini]) / j)
    espectro = np.abs(np.fft.rfft(s.astype(np.float64))) ** 2
    freqs = np.fft.rfftfreq(len(s), 1 / TAXA)
    total = espectro.sum() or 1.0
    return {
        "duracao_s": round(len(s) / TAXA, 3),
        "pico_s": round(int(np.argmax(env)) * 0.005, 3),
        "pico_db": round(float(20 * np.log10(max(np.abs(s).max(), 1e-9))), 1),
        "grave_pct": round(float(espectro[freqs < 150].sum() / total * 100), 1),
    }


def mede_video(caminho):
    info = sondar(caminho)
    v = next((x for x in info.get("streams", []) if x.get("codec_type") == "video"), {})
    pix = v.get("pix_fmt", "")
    return {
        "duracao_s": round(float(info.get("format", {}).get("duration", 0) or 0), 2),
        "largura": v.get("width"), "altura": v.get("height"),
        "codec": v.get("codec_name"), "alfa": "a" in pix.replace("yuv", "").replace("rgb", "") or pix.startswith(("rgba", "argb", "yuva", "gbra")),
    }


def mede_imagem(caminho):
    info = sondar(caminho)
    v = next((x for x in info.get("streams", []) if x.get("codec_type") == "video"), {})
    pix = v.get("pix_fmt", "")
    return {"largura": v.get("width"), "altura": v.get("height"), "alfa": pix.startswith(("rgba", "ya", "pal8")) or pix.endswith("a")}


def da_origem(item, pacote):
    """a origem pelo nome vale quando o nome denuncia o banco; o resto é do próprio pacote, pelo nome dele"""
    if item.get("origem") == "pacote":
        item["origem"] = pacote
    return item


def slug(texto):
    t = unicodedata.normalize("NFKD", texto)
    t = "".join(c for c in t if not unicodedata.combining(c)).lower()
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")


def pasta_do_tipo(raiz, nome):
    """a pasta do tipo dentro do pacote, sem diferença de caixa, acento ou espaço"""
    if nome == ".":
        return raiz
    alvo = slug(nome)
    for d in sorted(os.listdir(raiz)):
        if os.path.isdir(os.path.join(raiz, d)) and slug(d) == alvo:
            return os.path.join(raiz, d)
    return None


def ler_config():
    conf = os.environ.get("VIDEO_MATERIAL_CONFIG") or CONFIG
    if os.path.isfile(conf):
        with open(conf, encoding="utf-8") as f:
            return json.load(f)
    return {}


def configurar():
    """os pacotes declarados no material.local.json entram no PACOTES"""
    PACOTES.clear()
    for nome, d in (ler_config().get("pacotes") or {}).items():
        PACOTES[nome] = {"raiz": d.get("raiz", nome), "pastas": d.get("pastas") or {"som": "."},
                         "licenca": d.get("licenca", "sem licença anotada"), "clara": bool(d.get("clara", False))}
    PACOTES[KIT] = dict(KIT_PACOTE)


def raiz_material():
    if os.environ.get("VIDEO_MATERIAL"):
        return os.environ["VIDEO_MATERIAL"]
    return ler_config().get("raiz")


def como_configurar(pacote, onde):
    sub = PACOTES[pacote]["raiz"] if pacote in PACOTES else "<pasta do pacote>"
    return (f"o pacote {pacote} não está nesta máquina ({onde}). Declare a raiz de material e o pacote num "
            f"material.local.json ao lado do ativos.py (o modelo é o material.exemplo.json), com o pacote em "
            f"<raiz>/{sub}; a conferência do ambiente da /video (ambiente.mjs) diz o que mais falta")


def raiz_do_pacote(pacote, raiz=None):
    """a pasta do pacote: o --raiz direto, ou a raiz de material + a pasta do pacote; sai explicando se falta"""
    if raiz:
        return raiz
    if pacote == KIT:
        caminho = os.path.join(KIT_MATERIAL, KIT_PACOTE["raiz"])
        if not os.path.isdir(caminho):
            sys.exit(f"o material do kit não está instalado ({os.path.normpath(caminho)}): rode /instalar")
        return caminho
    if pacote not in PACOTES:
        sys.exit(como_configurar(pacote, "não declarado no material.local.json"))
    base = raiz_material()
    if not base:
        sys.exit(como_configurar(pacote, "sem raiz de material configurada"))
    caminho = os.path.join(base, PACOTES[pacote]["raiz"])
    if not os.path.isdir(caminho):
        sys.exit(como_configurar(pacote, f"não existe {caminho}"))
    return caminho


def onde():
    """a raiz de material desta máquina, de onde ela veio, e se a pasta de cada pacote existe (o ambiente.mjs lê)"""
    fonte = "VIDEO_MATERIAL" if os.environ.get("VIDEO_MATERIAL") else (os.environ.get("VIDEO_MATERIAL_CONFIG") or CONFIG)
    base = raiz_material()
    pacotes = {}
    for p, d in PACOTES.items():
        if p == KIT:
            continue
        pasta = os.path.join(base, d["raiz"]) if base else None
        pacotes[p] = {"pasta": pasta, "existe": bool(base) and os.path.isdir(pasta)}
    # o kit mora dentro da skill, fora da raiz de material: fica à parte, para não contar como pacote da pessoa
    kit = os.path.normpath(KIT_MATERIAL)
    return {"raiz": base, "existe": bool(base) and os.path.isdir(base), "fonte": fonte, "config": CONFIG, "pacotes": pacotes,
            "kit": {"pasta": kit, "existe": os.path.isdir(kit)}}


def arquivo_do_indice(pacote, indices=INDICES):
    return os.path.join(indices, f"{pacote}.json")


def indice(pacote, raiz, indices=INDICES):
    if pacote not in PACOTES:
        PACOTES[pacote] = {"raiz": pacote, "pastas": {"som": "."}, "licenca": "sem licença anotada", "clara": False}
    raiz = raiz_do_pacote(pacote, raiz)
    if not os.path.isdir(raiz):
        sys.exit(como_configurar(pacote, f"não existe {raiz}"))
    itens = []
    for tipo, nome in PACOTES[pacote]["pastas"].items():
        base = pasta_do_tipo(raiz, nome)
        if base is None:
            print(f"{tipo}: a pasta {nome} não existe no pacote", file=sys.stderr)
            continue
        for dirpath, dirs, nomes in os.walk(base):
            dirs[:] = sorted(d for d in dirs if d != "__MACOSX")  # o lixo do zip do Mac: cópia vazia de cada arquivo
            for n in sorted(nomes):
                if n.startswith("._") or not n.lower().endswith(EXT[tipo]):
                    continue
                a = os.path.join(dirpath, n)
                rel = os.path.relpath(a, raiz).replace("\\", "/")
                try:
                    medida = mede_video(a) if tipo == "3d" else mede_imagem(a) if tipo in ("emoji", "imagem") else mede_som(a)
                except subprocess.CalledProcessError:
                    medida = {"erro": "o ffmpeg não leu"}
                papel = os.path.relpath(dirpath, base).replace("\\", "/")
                item = marcar({"tipo": tipo, "papel": "" if papel == "." else papel, "caminho": rel, **medida})
                da_origem(item, pacote)
                if tipo == "som" and "erro" not in medida:
                    n_ = tom().mede_nota(a)
                    item.update(nota=n_["nota"], conc=n_["conc"])
                itens.append(item)
        print(f"{tipo}: {sum(1 for i in itens if i['tipo'] == tipo)}", file=sys.stderr)
    if not itens:
        sys.exit(f"nenhum arquivo em {raiz}: o índice vazio não se grava, e o de antes fica como está")
    saida = arquivo_do_indice(pacote, indices)
    os.makedirs(os.path.dirname(saida), exist_ok=True)
    with open(saida, "w", encoding="utf-8") as f:
        json.dump({"pacote": pacote, "raiz": PACOTES[pacote]["raiz"], "licenca": PACOTES[pacote]["licenca"],
                   "clara": PACOTES[pacote]["clara"], "itens": itens}, f, ensure_ascii=False, indent=1)
    print(f"{len(itens)} itens em {os.path.normpath(saida)}")


def anotar(indices=INDICES):
    for pacote in pacotes_com_indice(indices):
        saida = arquivo_do_indice(pacote, indices)
        dados = carregar_indice(pacote, indices)
        # a licença e o "clara" têm um dono só, o material.local.json: o índice regravado os copia de lá
        if pacote in PACOTES:
            dados.update(pacote=pacote, raiz=PACOTES[pacote]["raiz"], licenca=PACOTES[pacote]["licenca"], clara=PACOTES[pacote]["clara"])
        for i in dados["itens"]:
            da_origem(marcar(i), pacote)
        with open(saida, "w", encoding="utf-8") as f:
            json.dump(dados, f, ensure_ascii=False, indent=1)
        fora = sum(1 for i in dados["itens"] if i.get("fora") == FORA_CLIP_ART)
        print(f"{pacote}: {len(dados['itens'])} itens anotados; {fora} de clip-art fora")


def pacotes_com_indice(indices=INDICES):
    """os pacotes declarados e os que já têm índice gravado (a busca roda sem o material na máquina)"""
    gravados = sorted(n[:-5] for n in os.listdir(indices) if n.endswith(".json")) if os.path.isdir(indices) else []
    return list(dict.fromkeys([*PACOTES, *gravados]))


def licenca_de(pacote, indices=INDICES):
    if pacote in PACOTES:
        return PACOTES[pacote]["licenca"], PACOTES[pacote]["clara"]
    d = carregar_indice(pacote, indices)
    return d.get("licenca", "sem licença anotada"), bool(d.get("clara", False))


def carregar_indice(pacote, indices=INDICES):
    caminho = arquivo_do_indice(pacote, indices)
    if not os.path.isfile(caminho):
        return {"pacote": pacote, "itens": []}
    with open(caminho, encoding="utf-8") as f:
        return json.load(f)


def buscar(termo, tipo=None, indices=INDICES):
    t = termo.lower()
    for pacote in pacotes_com_indice(indices):
        licenca, clara = licenca_de(pacote, indices)
        for i in carregar_indice(pacote, indices)["itens"]:
            if (not tipo or i["tipo"] == tipo or (tipo == "imagem" and i["tipo"] == "emoji")) and t in i["caminho"].lower():
                extra = (f"pico {i.get('pico_s')} s, grave {i.get('grave_pct')}%" if i["tipo"] in ("som", "musica")
                         else f"{i.get('largura')}x{i.get('altura')}{' alfa' if i.get('alfa') else ''}")
                fora = f"  FORA: {i['fora']}" if i.get("fora") else ""
                licenca = f"  [{'licença clara' if clara else 'só no orgânico'}: {licenca}]"
                print(f"{pacote:12} {i['tipo']:6} {pacote}:{i['caminho']}  ({i.get('duracao_s', '')} s, {extra}){fora}{licenca}")


def resumo(caminho):
    h = hashlib.sha1()
    with open(caminho, "rb") as f:
        for bloco in iter(lambda: f.read(1 << 20), b""):
            h.update(bloco)
    return h.hexdigest()


def caixa_do_alfa(origem, folga=0.06):
    """O retângulo que contém o objeto em todo o clipe (a união do alfa), com folga, em "w:h:x:y".

    O ícone 3D do pacote ocupa um quarto do quadro 1920x1080; sem o recorte, o WebM carrega
    três quartos de vazio e o tamanho na peça vira conta de cabeça.
    """
    info = mede_video(origem)
    W, H = info["largura"], info["altura"]
    w, h = 480, max(2, round(480 * H / W / 2) * 2)
    cmd = ["ffmpeg", "-v", "error", "-i", origem, "-vf", f"fps=6,scale={w}:{h},format=rgba,alphaextract", "-f", "rawvideo", "-pix_fmt", "gray", "-"]
    bruto = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype=np.uint8)
    if bruto.size < w * h:
        return None
    quadros = bruto[: bruto.size // (w * h) * w * h].reshape(-1, h, w)
    uniao = (quadros > 12).any(axis=0)
    ys, xs = np.nonzero(uniao)
    if not len(xs):
        return None
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    fx, fy = (x1 - x0) * folga, (y1 - y0) * folga
    x0, x1 = max(0, x0 - fx), min(w, x1 + fx)
    y0, y1 = max(0, y0 - fy), min(h, y1 + fy)
    k = W / w
    par = lambda v: int(round(v * k / 2) * 2)
    return f"{par(x1 - x0)}:{par(y1 - y0)}:{par(x0)}:{par(y0)}"


def destino_livre(pasta, nome, ext):
    """O nome pedido, ou -2, -3... quando já existe outro arquivo com esse nome."""
    alvo = os.path.join(pasta, nome + ext)
    k = 2
    while os.path.exists(alvo):
        alvo = os.path.join(pasta, f"{nome}-{k}{ext}")
        k += 1
    return alvo


def trazer(ref, peca, largura=720, nome=None, raiz=None, uso="organico", indices=INDICES):
    if ":" not in ref:
        sys.exit(f"trazer <pacote>:<caminho>: falta o pacote em {ref}")
    pacote, rel = ref.split(":", 1)
    origem = os.path.join(raiz_do_pacote(pacote, raiz), rel)
    if not os.path.isfile(origem):
        sys.exit(f"não achei {origem}")
    item = next((i for i in carregar_indice(pacote, indices)["itens"] if i["caminho"] == rel), None)
    # o tipo do arquivo fora do índice sai da extensão e da pasta do pacote (a do emoji), e o nome
    # decide o fora mesmo assim: o arquivo novo também passa pela trava (o emoji de pessoa real, sempre)
    pasta_emoji = PACOTES.get(pacote, {}).get("pastas", {}).get("emoji")
    do_emoji = bool(pasta_emoji) and slug(rel.split("/")[0]) == slug(pasta_emoji)
    pela_ext = "som" if rel.lower().endswith(EXT["som"]) else "3d" if rel.lower().endswith(EXT["3d"]) else "emoji" if do_emoji else "imagem"
    marca = marcar(dict(item or {"tipo": pela_ext, "caminho": rel}))
    if marca.get("fora"):
        sys.exit(f"{rel} fica fora: {marca['fora']}")
    licenca, clara = licenca_de(pacote, indices)
    if uso in ("anuncio", "cliente") and not clara:
        de_onde = f"origem: {marca['origem']}; " if marca.get("origem") else ""
        print(f"aviso: {rel} é do pacote {pacote} ({de_onde}{licenca}); no {uso}, "
              "só material de licença clara (Mixkit, Sonniss, o kit, pacote com licença comercial escrita): este pacote, o som e o 3D, fica no orgânico", file=sys.stderr)
    tipo = item["tipo"] if item else pela_ext
    pasta = os.path.join(peca, "ativos")
    os.makedirs(pasta, exist_ok=True)
    base = nome or os.path.splitext(os.path.basename(rel))[0].lower().replace(" ", "-")
    ext = {"som": ".wav", "musica": ".wav", "3d": ".webm"}.get(tipo, os.path.splitext(rel)[1].lower())
    tmp = os.path.join(pasta, f".tmp-{base}{ext}")
    if tipo == "3d":
        corte = caixa_do_alfa(origem) if (item or {}).get("alfa", True) else None
        filtro = (f"crop={corte},") if corte else ""
        cmd = ["ffmpeg", "-v", "error", "-y", "-i", origem, "-vf", f"{filtro}scale={largura}:-2", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "30", "-an", tmp]
    elif tipo in ("som", "musica"):
        cmd = ["ffmpeg", "-v", "error", "-y", "-i", origem, "-ar", "48000", "-ac", "2", tmp]
    else:
        shutil.copyfile(origem, tmp)
        cmd = None
    if cmd:
        subprocess.run(cmd, check=True)
    pedido = os.path.join(pasta, base + ext)
    if os.path.exists(pedido) and resumo(pedido) == resumo(tmp):
        os.remove(tmp)
        alvo = pedido
    else:
        alvo = destino_livre(pasta, base, ext)
        os.replace(tmp, alvo)
    medida = mede_som(alvo) if tipo in ("som", "musica") else {}
    print(json.dumps({"arquivo": os.path.relpath(alvo, peca).replace("\\", "/"), "pacote": pacote, "origem": rel, **medida}, ensure_ascii=False))


def main():
    # o console do Windows não é UTF-8: sem isto, o caminho com acento sai quebrado e não se copia de volta
    for s in (sys.stdout, sys.stderr):
        s.reconfigure(encoding="utf-8")
    a = sys.argv[1:]
    if not a or a[0] not in ("indice", "buscar", "trazer", "anotar", "onde"):
        sys.exit(__doc__)
    if a[0] == "onde":
        print(json.dumps(onde(), ensure_ascii=False))
        return

    def opcao(nome, padrao=None):
        if nome in a:
            i = a.index(nome)
            v = a[i + 1]
            del a[i:i + 2]
            return v
        return padrao

    raiz = opcao("--raiz")
    indices = opcao("--indices", INDICES)
    if a[0] == "indice":
        pacote = opcao("--pacote")
        if not pacote:
            sys.exit(f"indice --pacote <nome>: os declarados são {', '.join(PACOTES) or 'nenhum (veja o material.exemplo.json)'}")
        indice(pacote, raiz, indices)
    elif a[0] == "anotar":
        anotar(indices)
    elif a[0] == "buscar":
        tipo = opcao("--tipo")
        if len(a) < 2:
            sys.exit("buscar <termo>")
        buscar(a[1], tipo, indices)
    else:
        largura = int(opcao("--largura", "720"))
        nome = opcao("--nome")
        uso = opcao("--uso", "organico")
        if uso not in ("organico", "anuncio", "cliente"):
            sys.exit(f"--uso {uso}: organico, anuncio ou cliente")
        if len(a) < 3:
            sys.exit("trazer <pacote>:<caminho relativo> <pasta da peça>")
        trazer(a[1], a[2], largura, nome, raiz, uso, indices)


configurar()

if __name__ == "__main__":
    main()
