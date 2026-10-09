# Folhas de contato para VER cada imagem da captura antes de nomear (passo 4 do atualizar.md).
#
# Entrada: <pasta>/consolidado.json e <pasta>/imagens/<chave>.jpg (baixa-imagens.mjs e
#          grava-quadros.mjs com --saida <pasta>/imagens).
# Saída:   <pasta>/duplicadas.json  grupos de chaves com a MESMA imagem (a referência reposta); a primeira
#                                    de cada grupo é a que aparece na folha e a que se nomeia
#          <pasta>/folhas/sNN.jpg     seis imagens paradas por folha, com a chave e a legenda do post
#          <pasta>/folhas/vNN.jpg     três vídeos por folha, cada um com miniatura + três quadros
#          <pasta>/folhas/indice.json qual chave está em que posição de cada folha
#
# Uso: python <skill>/_local/captura/folhas.py [<pasta>]
import hashlib, json, os, sys
from PIL import Image, ImageDraw, ImageFont

# a pasta: o 1º argumento, ou o ponteiro gravado pelo prepara.mjs --nova (sem variável de shell)
PONTEIRO = os.path.join('rascunho', 'captura-design-de-produto.txt')
if len(sys.argv) > 1 and not sys.argv[1].startswith('--'):
    pasta = sys.argv[1]
elif os.path.exists(PONTEIRO):
    pasta = open(PONTEIRO, encoding='utf8').read().strip()
else:
    sys.exit('falta a pasta da captura: rode prepara.mjs --nova')
I = os.path.join(pasta, 'imagens')
cons = {x['id']: x for x in json.load(open(os.path.join(pasta, 'consolidado.json'), encoding='utf8'))}
ARQ = {f[:-4]: f for f in os.listdir(I) if f.endswith(('.jpg', '.png'))}  # a extensão veio da assinatura (imagem.mjs)
chaves = sorted(ARQ)
grupos = {}
for k in chaves:
    h = hashlib.md5(open(os.path.join(I, ARQ[k]), 'rb').read()).hexdigest()
    grupos.setdefault(h, []).append(k)
dups = [g for g in grupos.values() if len(g) > 1]
json.dump(dups, open(os.path.join(pasta, 'duplicadas.json'), 'w'), indent=1)
rep = {k: g[0] for g in dups for k in g[1:]}
unicas = [k for k in chaves if k not in rep]
paradas = [k for k in unicas if '__v' not in k]
videos = sorted(set(k.split('-q')[0] for k in unicas if '__v' in k))  # '<id>__v<n>': um por video, todos os videos do post
os.makedirs(os.path.join(pasta, 'folhas'), exist_ok=True)
try:
    fonte = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 22)
except OSError:
    fonte = ImageFont.load_default()

def legenda(k):
    x = cons.get(k.split('__')[0])
    return ((x or {}).get('corpo') or '?').replace('\n', ' ')[:62]

def miniatura(k, W, H):
    im = Image.open(os.path.join(I, ARQ[k])).convert('RGB')
    tam = im.size
    im.thumbnail((W, H))
    return im, tam

indice = []
for s in range(0, len(paradas), 6):
    folha = Image.new('RGB', (2400, 1240), 'white'); d = ImageDraw.Draw(folha)
    for j, k in enumerate(paradas[s:s + 6]):
        cx, cy = (j % 3) * 800, (j // 3) * 620
        im, tam = miniatura(k, 790, 560)
        folha.paste(im, (cx + (800 - im.width) // 2, cy + 4))
        d.rectangle([cx, cy + 566, cx + 800, cy + 620], fill='#ffe9a8')
        d.text((cx + 6, cy + 568), f'[{k}] {tam}', fill='black', font=fonte)
        d.text((cx + 6, cy + 594), legenda(k), fill='black', font=fonte)
    nome = f'folhas/s{s // 6 + 1:02d}.jpg'
    folha.save(os.path.join(pasta, nome), quality=82)
    indice.append([nome, paradas[s:s + 6]])
for s in range(0, len(videos), 3):
    folha = Image.new('RGB', (2400, 1290), 'white'); d = ImageDraw.Draw(folha)
    for r, vid in enumerate(videos[s:s + 3]):
        ks = [vid] + [f'{vid}-q{q}' for q in (1, 2, 3)]
        for j, k in enumerate(ks):
            if k not in ARQ:
                continue
            im, tam = miniatura(k, 596, 380)
            folha.paste(im, (j * 600 + (600 - im.width) // 2, r * 430 + 2))
        d.rectangle([0, r * 430 + 386, 2400, r * 430 + 428], fill='#cde3ff')
        d.text((6, r * 430 + 392), f'[{vid}] vídeo: miniatura | 15% | 50% | 85% :: ' + legenda(ks[0])[:80], fill='black', font=fonte)
    nome = f'folhas/v{s // 3 + 1:02d}.jpg'
    folha.save(os.path.join(pasta, nome), quality=82)
    indice.append([nome, videos[s:s + 3]])
json.dump({'repetidas': rep, 'paradas': paradas, 'videos': videos, 'folhas': indice}, open(os.path.join(pasta, 'folhas', 'indice.json'), 'w'), indent=1)
print(f'{len(chaves)} arquivos, {len(unicas)} unicos ({len(dups)} grupos repetidos), {len(paradas)} imagens paradas e {len(videos)} videos em {len(indice)} folhas')
