"""As tomadas do Reel falado: a pessoa repete a frase até acertar, e fica a
ÚLTIMA tomada completa de cada frase.

  python scripts/reel-falado/tomadas.py sugerir <palavras.json>
  python scripts/reel-falado/tomadas.py conferir <palavras.json> <tomadas.json>

`sugerir` agrupa os segmentos da transcrição (o `palavras.json` do
`scripts/transcrever.py`) que são tomada da mesma frase e sugere a última. Agrupar
repetição por texto é julgamento: a máquina sugere, o agente escreve a escolha.

`conferir` valida a escolha do agente:
  {"frases": [{"grupo": [0, 1], "escolhida": 1}, ...], "descartados": [2]}
Todo segmento mora num grupo ou nos descartados (nada some calado); a escolhida é a
última do grupo, ou leva a razão no campo "troca", que vai para o relatório.
"""
import json
import re
import sys
from difflib import SequenceMatcher

JANELA_S = 90.0          # repetição mais longe que isso é recurso de fala, não tomada
SEMELHANTE = 0.5         # razão de palavras em comum (SequenceMatcher) para ser a mesma frase
CONTIDA = 0.8            # a tomada curta inteira dentro da longa (recomeço)
CONTIDA_MIN_PALAVRAS = 4
SUSPEITA = 0.6           # a última abaixo disso do tamanho da maior sai marcada
COMECO_PALAVRAS = 3      # o começo repetido que marca regravação
RADICAL = 5              # letras comparadas por palavra no começo (site/sites, demora/demoram)
CONECTIVOS = {'e', 'então', 'entao', 'aí', 'ai', 'ok', 'bom', 'tá', 'ta', 'né', 'ne'}
ORDINAIS = {'primeiro', 'primeira', 'segundo', 'segunda', 'terceiro', 'terceira', 'quarto', 'quarta',
            'quinto', 'quinta', 'sexto', 'sexta', 'sétimo', 'sétima', 'oitavo', 'oitava', 'nono', 'nona',
            'décimo', 'décima'}


def palavras_de(texto):
    ws = re.findall(r"[\wÀ-ÿ%]+", texto.lower())
    while ws and ws[0] in CONECTIVOS:
        ws = ws[1:]
    return ws


def ordinal(ws):
    return next((w for w in ws[:2] if w in ORDINAIS), None)


def radical(w, outro):
    k = min(RADICAL, len(w), len(outro))
    return w[:k] == outro[:k]


def mesmo_comeco(a, b):
    """A regravação costuma repetir o começo da frase e mudar o fim ("sites que demoram
    bastante", "sites que demoram demais espanta clientes"): as primeiras palavras
    iguais pelo radical (site e sites, demora e demoram) bastam."""
    n = COMECO_PALAVRAS
    return len(a) >= n and len(b) >= n and all(radical(x, y) for x, y in zip(a[:n], b[:n]))


def mesma_frase(a, b):
    oa, ob = ordinal(a), ordinal(b)
    if oa and ob:
        return oa == ob
    if mesmo_comeco(a, b):
        return True
    m = SequenceMatcher(None, a, b, autojunk=False)
    if m.ratio() >= SEMELHANTE:
        return True
    curta = min(len(a), len(b))
    comuns = sum(bl.size for bl in m.get_matching_blocks())
    return curta >= CONTIDA_MIN_PALAVRAS and comuns / curta >= CONTIDA


def carregar(caminho):
    with open(caminho, encoding='utf-8') as f:
        return json.load(f).get('segmentos', [])


def sugerir(segs):
    grupos = []  # [{'indices': [...], 'ws': [palavras de cada um]}]
    for i, s in enumerate(segs):
        ws = palavras_de(s['texto'])
        candidatos = [g for g in grupos if s['inicio'] - segs[g['indices'][-1]]['inicio'] <= JANELA_S
                      and any(mesma_frase(ws, outro) for outro in g['ws'])]
        if candidatos:
            g = candidatos[-1]
            g['indices'].append(i)
            g['ws'].append(ws)
        else:
            grupos.append({'indices': [i], 'ws': [ws]})
    saida = []
    for g in grupos:
        sugerida = g['indices'][-1]
        maior = max(len(w) for w in g['ws'])
        suspeitas = [sugerida] if len(g['ws'][-1]) < SUSPEITA * maior else []
        saida.append({
            'indices': g['indices'], 'sugerida': sugerida, 'suspeitas': suspeitas,
            'tomadas': [{'i': i, 'inicio': segs[i]['inicio'], 'fim': segs[i]['fim'], 'texto': segs[i]['texto']}
                        for i in g['indices']]
        })
    saida.sort(key=lambda g: g['sugerida'])
    return {'grupos': saida}


def conferir(segs, escolha):
    erros, onde = [], {}
    n = len(segs)
    frases = escolha.get('frases', [])
    if not frases:
        erros.append('nenhuma frase escolhida')

    def marca(i, lugar):
        if not isinstance(i, int) or not 0 <= i < n:
            erros.append(f'{lugar}: o índice {i} não existe (a transcrição tem {n} segmentos, de 0 a {n - 1})')
            return
        if i in onde:
            erros.append(f'o segmento {i} aparece em mais de um lugar ({onde[i]} e {lugar})')
        onde.setdefault(i, lugar)

    ordem, trocas = [], []
    for k, f in enumerate(frases, 1):
        grupo, esc = f.get('grupo', []), f.get('escolhida')
        for i in grupo:
            marca(i, f'frase {k}')
        if esc not in grupo:
            erros.append(f'frase {k}: a escolhida ({esc}) não está no grupo {grupo}')
            continue
        validos = [i for i in grupo if isinstance(i, int) and 0 <= i < n]
        ultima = max(validos) if validos else esc
        if esc != ultima:
            razao = (f.get('troca') or '').strip()
            if not razao:
                erros.append(f'frase {k}: a escolhida ({esc}) não é a última do grupo ({ultima}); '
                             'a troca precisa da razão no campo "troca"')
            else:
                trocas.append({'frase': k, 'escolhida': esc, 'ultima': ultima,
                               'descartada': segs[ultima]['texto'], 'razao': razao})
        if 0 <= esc < n:
            s = segs[esc]
            ordem.append({'frase': k, 'escolhida': esc, 'grupo': grupo,
                          'inicio': s['inicio'], 'fim': s['fim'], 'texto': s['texto']})
    for i in escolha.get('descartados', []):
        marca(i, 'descartados')
    for i in range(n):
        if i not in onde:
            erros.append(f'o segmento {i} ("{segs[i]["texto"][:60]}") não está em grupo nem nos descartados')
    descartados = [{'i': i, 'texto': segs[i]['texto']} for i in escolha.get('descartados', [])
                   if isinstance(i, int) and 0 <= i < n]
    return {'ordem': ordem, 'trocas': trocas, 'descartados': descartados}, erros


def main(argv):
    # o terminal do Windows grava em cp1252 quando a saída vai para arquivo: o JSON sai em UTF-8 sempre
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
    if len(argv) < 3 or argv[1] not in ('sugerir', 'conferir') or (argv[1] == 'conferir' and len(argv) < 4):
        print(__doc__, file=sys.stderr)
        return 2
    segs = carregar(argv[2])
    if not segs:
        print('sem fala: a transcrição não tem segmento nenhum', file=sys.stderr)
        return 1
    if argv[1] == 'sugerir':
        print(json.dumps(sugerir(segs), ensure_ascii=False, indent=1))
        return 0
    with open(argv[3], encoding='utf-8') as f:
        escolha = json.load(f)
    resultado, erros = conferir(segs, escolha)
    if erros:
        print('\n'.join(erros), file=sys.stderr)
        return 1
    print(json.dumps(resultado, ensure_ascii=False, indent=1))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
