"""O plano.json da peça para as réguas Python (o `simula_mix.py --contexto` e o `medir_ritmo.py`): o
perfil (a linguagem e quem manda no tempo) e a gravidade dos avisos pela exceção escrita.

As duas regras moram na /mograph, uma fonte só: o perfil no `linguagem.mjs` e a exceção no
`excecoes.mjs`, chamados pelo `node`. Sem `node`, a régua mede e diz que a exceção não foi lida.
"""
import json
import os
import shutil
import subprocess

AQUI = os.path.dirname(os.path.abspath(__file__))
MOGRAPH = os.path.join(AQUI, '..', '..', 'mograph', 'ferramentas')


def acha(pasta_ou_arquivo, explicito=None):
    """o caminho do plano: o --plano, ou o plano.json ao lado da peça; None quando não há"""
    if explicito:
        return explicito
    pasta = pasta_ou_arquivo if os.path.isdir(pasta_ou_arquivo) else os.path.dirname(os.path.abspath(pasta_ou_arquivo))
    arq = os.path.join(pasta, 'plano.json')
    return arq if os.path.isfile(arq) else None


def le(arq):
    with open(arq, encoding='utf-8') as f:
        return json.load(f)


def _node(script, args, entrada=None):
    node = shutil.which('node')
    if not node:
        return None, 'sem o node no PATH: a exceção do plano não foi lida'
    r = subprocess.run([node, os.path.join(MOGRAPH, script), *args], input=entrada, capture_output=True,
                       text=True, encoding='utf-8')
    if r.returncode != 0:
        return None, f'o {script} falhou: {(r.stderr or r.stdout).strip().splitlines()[-1:]}'
    return json.loads(r.stdout), None


def perfil(arq):
    """{ linguagem, estilo, tempo, dispensa, erros } pelo linguagem.mjs, ou None e o motivo"""
    return _node('linguagem.mjs', ['perfil', arq])


def cena_em(plano, t):
    """o id da cena do plano no instante t (s da peça), ou None"""
    for c in plano.get('cenas') or []:
        try:
            if float(c['de']) <= t < float(c['ate']):
                return c.get('id')
        except (KeyError, TypeError, ValueError):
            continue
    return None


def calibra(arq, avisos):
    """avisos [{regra, cena, msg}] → (avisos que restam [msg], aceitos [{regra, msg, motivo, fonte}], nota)"""
    r, falha = _node('excecoes.mjs', ['calibrar', arq], json.dumps({'erros': [], 'avisos': avisos}, ensure_ascii=False))
    if r is None:
        return [a['msg'] for a in avisos], [], falha
    aceitos = [{k: a.get(k, '') for k in ('regra', 'msg', 'motivo', 'fonte')} for a in r.get('aceitos', [])]
    return [a['msg'] for a in r.get('avisos', [])], aceitos, None


def respiros(plano):
    """os trechos que o plano declara calmos: o respiro (depois do pico) e a vírgula (0,75 s, antes dele)"""
    out = []
    for r in ([] if plano.get('respiro') is None else
              (plano['respiro'] if isinstance(plano['respiro'], list) else [plano['respiro']])):
        try:
            out.append((float(r['de']), float(r['ate'])))
        except (KeyError, TypeError, ValueError):
            continue
    v = plano.get('virgula')
    if v is not None:
        em = v.get('em') if isinstance(v, dict) else v
        if isinstance(em, (int, float)):
            out.append((float(em), float(em) + 0.75))
    return out
