#!/usr/bin/env python3
"""O painel do modo relatório da /oferta.

Lê o relatorio.json, confere cada citação contra o acervo (pelo
`buscar.mjs --conferir-citacoes`, ao lado deste arquivo) e grava dois
arquivos: o painel HTML, que abre sem internet (cores, fonte e logo da marca
embutidas), e o relatorio.md, o gêmeo em texto, na pasta do painel.

Uso:
  python scripts/oferta/relatorio.py <relatorio.json> [-o <painel.html>]
      [--acervo <pasta>] [--tokens <tokens.css>] [--logo <logo.png>]

Sem -o, o painel vai para a pasta do json como
"<assunto> · diagnóstico · <data>.html". Sem --tokens, as cores e a família
vêm da marca do /carrossel; sem --logo, a logo escura da mesma pasta.

Saída: 0 tudo em ordem; 3 o painel foi gravado com aviso (linha com "!":
citação que não confere, link descartado, acervo não conferido, relatório
sem citação), e painel que sai 3 não se entrega; 2 entrada ilegível.
As linhas com "·" informam e não reprovam. Só biblioteca padrão.
"""

import argparse
import base64
import html
import json
import os
import re
import shutil
import subprocess
import sys
import unicodedata
from pathlib import Path

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parent.parent
BUSCAR = AQUI / 'buscar.mjs'
MARCA = RAIZ / '.claude' / 'skills' / 'carrossel' / 'marca'

# A paleta de reserva, por token: o painel nunca fica sem cor.
RESERVA = {'c-dark': (24, 26, 31), 'c-light': (247, 246, 243), 'c-accent': (70, 90, 120)}
FONTE_RESERVA = "'Helvetica Neue', Arial, sans-serif"
CORTE_DA_CITACAO = 480
HTTPS = re.compile(r'https://[^\s"\'<>`]+')

STATUS = {'verified': 'confirmado', 'inferred': 'deduzido', 'missing': 'faltando'}
CONFIANCA = {'high': 'alta', 'medium': 'média', 'low': 'baixa'}
CAIXAS = {'action': 'Ação', 'risk': 'Risco', 'note': 'Nota'}


# ---------------------------------------------------------------- avisos

class Avisos:
    """"!" reprova a entrega (sai 3); "·" só informa."""

    def __init__(self):
        self.graves = 0

    def grave(self, msg):
        self.graves += 1
        print(f'! {msg}', file=sys.stderr)

    @staticmethod
    def nota(msg):
        print(f'· {msg}', file=sys.stderr)


# ---------------------------------------------------------------- leitura tolerante

def objeto(x):
    return isinstance(x, dict)


def lista(x):
    return x if isinstance(x, list) else []


def texto(x):
    if isinstance(x, bool) or x is None:
        return ''
    if isinstance(x, (int, float)):
        return str(x)
    return x.strip() if isinstance(x, str) else ''


def inteiro(x, padrao=None):
    """Só número inteiro de verdade: o resto vira o padrão (nunca entra no HTML cru)."""
    if isinstance(x, bool):
        return padrao
    if isinstance(x, int):
        return x
    if isinstance(x, float) and x.is_integer():
        return int(x)
    if isinstance(x, str) and re.fullmatch(r'\s*-?\d{1,9}\s*', x):
        return int(x)
    return padrao


def paragrafos(x):
    if isinstance(x, list):
        return [texto(p) for p in x if texto(p)]
    return [texto(x)] if texto(x) else []


def slug(s):
    s = unicodedata.normalize('NFD', texto(s)).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def carimbo(segundos):
    h, resto = divmod(segundos, 3600)
    m, s = divmod(resto, 60)
    return f'{h}:{m:02d}:{s:02d}' if h else f'{m}:{s:02d}'


# ---------------------------------------------------------------- HTML seguro

def esc(s):
    return html.escape(texto(s), quote=True)


def inline(s):
    """O texto escapado, com `código`, **negrito** e *itálico*."""
    pedacos = re.split(r'(`[^`\n]+`)', texto(s))
    saida = []
    for p in pedacos:
        if len(p) > 2 and p.startswith('`') and p.endswith('`'):
            saida.append(f'<code>{html.escape(p[1:-1], quote=True)}</code>')
            continue
        e = html.escape(p, quote=True)
        e = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', e)
        e = re.sub(r'(?<![*\w])\*(?!\s)(.+?)(?<!\s)\*(?![*\w])', r'<em>\1</em>', e)
        saida.append(e)
    return ''.join(saida)


# ---------------------------------------------------------------- marca

def ler_marca(caminho, avisos):
    """As cores (r,g,b de 0 a 255) e a família da marca; o que não vale cai na reserva."""
    paleta = dict(RESERVA)
    fonte = FONTE_RESERVA
    if not caminho.is_file():
        avisos.nota(f'não achei os tokens da marca em {caminho}: o painel sai na paleta de reserva')
        return paleta, fonte
    css = caminho.read_text(encoding='utf-8', errors='replace')
    if re.search(r'ESTADO:\s*nao-configurado', css):
        avisos.nota('marca não configurada: o painel sai na paleta de demonstração do molde (o /carrossel configurar troca)')
    for nome in RESERVA:
        m = re.search(r'--' + nome + r'\s*:\s*([^;}]*)', css)
        if not m:
            avisos.nota(f'os tokens não trazem --{nome}: paleta de reserva nesse token')
            continue
        canais = [c.strip() for c in m.group(1).split(',')]
        if len(canais) == 3 and all(re.fullmatch(r'\d{1,3}', c) and int(c) <= 255 for c in canais):
            paleta[nome] = tuple(int(c) for c in canais)
        else:
            avisos.nota(f'--{nome} não é r,g,b de 0 a 255: paleta de reserva nesse token')
    m = re.search(r'--f-display\s*:\s*([^;]*)', css)
    if m:
        valor = m.group(1)
        if '}' in valor:
            antes, depois = valor.split('}', 1)
            valor = antes if not depois.strip() else '\0'
        valor = ' '.join(valor.split())
        if valor and re.fullmatch(r"[\w ,'\"-]+", valor):
            fonte = valor
        else:
            avisos.nota('--f-display com caractere que não é de nome de fonte: família do sistema')
    return paleta, fonte


def ler_logo(caminho):
    if caminho and caminho.is_file() and caminho.suffix.lower() in ('.png', '.jpg', '.jpeg', '.webp'):
        tipo = 'jpeg' if caminho.suffix.lower() in ('.jpg', '.jpeg') else caminho.suffix.lower()[1:]
        return f'data:image/{tipo};base64,' + base64.b64encode(caminho.read_bytes()).decode('ascii')
    return None


# ---------------------------------------------------------------- citações

def evidencias(dados):
    """Cada evidência, na ordem e com o filtro do buscar.mjs --conferir-citacoes."""
    for sec in lista(dados.get('sections')):
        if not objeto(sec):
            continue
        for sub in lista(sec.get('subsections')):
            if not objeto(sub):
                continue
            for ev in lista(sub.get('evidence')):
                if objeto(ev) and (ev.get('quote') or ev.get('file') or ev.get('url')):
                    yield ev


def conferir_no_acervo(entrada, acervo, avisos):
    """O resultado do buscar.mjs --conferir-citacoes, ou None quando não deu para conferir."""
    node = shutil.which('node')
    if not node:
        avisos.grave('não conferi as citações contra o acervo: o node não está instalado')
        return None
    comando = [node, str(BUSCAR), '--conferir-citacoes', str(entrada), '--json']
    if acervo:
        comando += ['--acervo', acervo]
    ambiente = {k: v for k, v in os.environ.items() if k != 'NODE_TEST_CONTEXT'}
    r = subprocess.run(comando, capture_output=True, text=True, encoding='utf-8', errors='replace', env=ambiente)
    try:
        dados = json.loads(r.stdout)
        if not objeto(dados) or not isinstance(dados.get('falhas'), list):
            raise ValueError
        return dados
    except ValueError:
        linhas = [l.strip().lstrip('✗').strip() for l in r.stderr.splitlines() if l.strip()]
        motivo = linhas[0] if linhas else 'a busca não respondeu'
        avisos.grave(f'não conferi as citações contra o acervo ({motivo}); --acervo <pasta> aponta outro lugar')
        return None


def julgar_citacoes(dados, entrada, acervo, avisos):
    """Para cada evidência (pelo id do objeto): o link que pode aparecer, e se foi descartado."""
    evs = list(evidencias(dados))
    descartadas = set()
    for i, ev in enumerate(evs):
        url = texto(ev.get('url'))
        if url and not HTTPS.fullmatch(url):
            avisos.grave(f'link descartado (não é https): {url}')
            descartadas.add(i)
    if not evs:
        avisos.grave('nenhuma citação no relatório: sem fonte do acervo, o painel não se entrega')
    conferencia = conferir_no_acervo(entrada, acervo, avisos)
    reprovadas = set()
    if conferencia:
        for f in conferencia['falhas']:
            i = f.get('indice') if objeto(f) else None
            if not isinstance(i, int):
                continue
            reprovadas.add(i)
            if i in descartadas and 'https' in texto(f.get('motivo')):
                continue
            avisos.grave(f"citação fora do acervo · {texto(f.get('onde'))}: {texto(f.get('motivo'))}")
    julgamento = {}
    for i, ev in enumerate(evs):
        url = texto(ev.get('url'))
        vale = bool(url) and i not in descartadas and i not in reprovadas
        julgamento[id(ev)] = {'link': url if vale else None, 'descartado': bool(url) and not vale}
    return julgamento, conferencia, len(evs)


def legenda(ev):
    """Título · carimbo de uma citação, para o painel e para o .md."""
    inicio = inteiro(ev.get('start_seconds'))
    partes = [texto(ev.get('title')) or texto(ev.get('file')) or 'trecho sem título']
    if inicio is not None and inicio >= 0:
        partes.append(carimbo(inicio))
    return ' · '.join(partes)


# ---------------------------------------------------------------- o painel

CSS = """
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:rgb(var(--c-light));color:rgb(var(--c-dark));font-family:var(--f);font-size:17px;line-height:1.6}
a{color:rgb(var(--c-accent))}
code{font-family:ui-monospace,Consolas,monospace;font-size:.88em;background:rgba(var(--c-dark),.06);padding:.05em .3em;border-radius:4px}
.topo{background:rgb(var(--c-dark));color:rgb(var(--c-light));padding:48px 16px 40px}
.topo .miolo{max-width:1080px;margin:0 auto}
.topo img{height:34px;width:auto;display:block;margin-bottom:28px}
.olho{text-transform:lowercase;letter-spacing:.08em;font-size:.8rem;opacity:.75;margin:0 0 10px}
h1{font-size:clamp(1.9rem,4.6vw,3rem);line-height:1.1;margin:0 0 16px;letter-spacing:-.01em}
.lide{font-size:1.15rem;max-width:62ch;opacity:.9;margin:0 0 22px}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin:0;padding:0;list-style:none}
.chips li{border:1px solid rgba(var(--c-light),.3);border-radius:999px;padding:4px 12px;font-size:.82rem}
.grade{max-width:1080px;margin:0 auto;padding:0 16px;display:grid;grid-template-columns:1fr;gap:32px}
nav.menu{position:sticky;top:0;z-index:2;background:rgb(var(--c-light));border-bottom:1px solid rgba(var(--c-dark),.1);overflow-x:auto;white-space:nowrap;scrollbar-width:none;margin:0 -16px;padding:10px 16px}
nav.menu::-webkit-scrollbar{display:none}
nav.menu a{display:inline-block;margin-right:14px;font-size:.88rem;color:rgb(var(--c-dark));text-decoration:none;opacity:.75}
nav.menu a:hover{opacity:1;color:rgb(var(--c-accent))}
main{min-width:0;padding-bottom:64px}
section{padding-top:36px}
h2{font-size:1.5rem;line-height:1.2;margin:0 0 14px}
h3{font-size:1.15rem;margin:28px 0 8px}
.resumo{font-size:1.05rem;opacity:.85;margin-top:-4px}
.veredito{border-left:4px solid rgb(var(--c-accent));padding:4px 0 4px 18px}
.veredito .manchete{font-size:1.35rem;font-weight:700;line-height:1.3;margin:0 0 12px}
dl.fatos{display:grid;grid-template-columns:max-content 1fr;gap:6px 16px;margin:16px 0 0}
dl.fatos dt{font-weight:700}
dl.fatos dd{margin:0}
.travas{display:grid;gap:14px;grid-template-columns:1fr}
.trava{background:rgba(var(--c-dark),.035);border-radius:12px;padding:18px 18px 16px;position:relative}
.trava .n{font-size:.78rem;letter-spacing:.06em;text-transform:lowercase;opacity:.7}
.trava h3{margin:4px 0 6px}
.trava p{margin:0 0 10px}
.barra{height:6px;border-radius:3px;background:rgba(var(--c-dark),.1);overflow:hidden}
.barra span{display:block;height:100%;background:rgb(var(--c-accent))}
.trava .med{font-size:.85rem;opacity:.75;margin-top:6px}
.numeros{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(180px,1fr))}
.numero{border:1px solid rgba(var(--c-dark),.12);border-radius:12px;padding:14px}
.numero .v{font-size:1.6rem;font-weight:700;line-height:1.1}
.numero .r{font-size:.82rem;opacity:.75;text-transform:lowercase}
.numero p{margin:6px 0 0;font-size:.88rem}
.tabela{overflow-x:auto}
table{border-collapse:collapse;width:100%;font-size:.94rem}
th,td{text-align:left;vertical-align:top;padding:9px 10px;border-bottom:1px solid rgba(var(--c-dark),.1)}
th{font-size:.78rem;text-transform:lowercase;letter-spacing:.05em;opacity:.7;font-weight:600}
.st{display:inline-block;border-radius:999px;padding:1px 10px;font-size:.78rem;white-space:nowrap}
.st-verified{background:rgb(var(--c-accent));color:rgb(var(--c-light))}
.st-inferred{background:rgba(var(--c-dark),.12)}
.st-missing{border:1px dashed rgba(var(--c-dark),.5)}
.rotulo{font-size:.76rem;letter-spacing:.07em;text-transform:lowercase;font-weight:700;opacity:.65;margin:18px 0 6px}
.simples{font-size:1.06rem;font-weight:600;margin:0 0 8px}
figure.ev{margin:10px 0;padding:12px 16px;background:rgba(var(--c-dark),.04);border-radius:10px}
figure.ev blockquote{margin:0 0 6px;font-style:italic}
figure.ev figcaption{font-size:.82rem;opacity:.8;overflow-wrap:anywhere}
.descartado{text-decoration:line-through;opacity:.7}
.leitura{border:1px solid rgba(var(--c-accent),.45);background:rgba(var(--c-accent),.07);border-radius:10px;padding:12px 16px}
.leitura p{margin:0}
.caixa{border-radius:10px;padding:12px 16px;margin-top:14px}
.caixa b{display:block;font-size:.76rem;letter-spacing:.07em;text-transform:lowercase;margin-bottom:2px}
.caixa-action{background:rgb(var(--c-accent));color:rgb(var(--c-light))}
.caixa-risk{border:2px solid rgb(var(--c-dark))}
.caixa-note{background:rgba(var(--c-dark),.06)}
.caixa-outra{background:rgba(128,128,128,.18)}
.fontes li{margin-bottom:10px}
.fontes ul{margin:4px 0 0;padding-left:18px;font-size:.88rem}
.vazio{font-weight:700}
footer{font-size:.8rem;opacity:.6;padding:24px 0 40px}
@media (min-width:960px){
  .grade{grid-template-columns:200px 1fr;gap:48px}
  nav.menu{position:sticky;top:24px;align-self:start;border:0;margin:36px 0 0;padding:0;white-space:normal;overflow:visible;background:transparent}
  nav.menu a{display:block;margin:0 0 8px}
  .travas{grid-template-columns:repeat(3,1fr)}
}
@media print{
  nav.menu{display:none}
  .grade{grid-template-columns:1fr}
  section{break-inside:avoid-page}
}
"""


class Painel:
    def __init__(self, dados, julgamento, conferencia, n_citacoes):
        self.d = dados
        self.julgamento = julgamento
        self.conferencia = conferencia
        self.n_citacoes = n_citacoes
        self.secoes = []   # (id, título, objeto)
        usados = {'diagnostico', 'travas', 'numeros', 'retrato', 'plano', 'metas', 'riscos', 'fontes'}
        for n, sec in enumerate(lista(dados.get('sections')), 1):
            if not objeto(sec):
                continue
            base = slug(sec.get('id')) or slug(sec.get('title')) or f'secao-{n}'
            ident = f'sec-{base}'
            k = 2
            while ident in usados:
                ident = f'sec-{base}-{k}'
                k += 1
            usados.add(ident)
            self.secoes.append((ident, texto(sec.get('title')) or f'Seção {n}', sec, base))

    # -- partes

    def meta(self, chave):
        m = self.d.get('meta')
        return texto(m.get(chave)) if objeto(m) else ''

    def acervo_chip(self):
        c = self.conferencia
        if not c:
            return 'acervo não conferido'
        return f"{inteiro(c.get('trechos'), 0)} trechos &middot; {inteiro(c.get('fontes'), 0)} fontes"

    def travas(self):
        travas = [t for t in lista(self.d.get('constraints')) if objeto(t)]
        ordenadas = sorted(enumerate(travas, 1), key=lambda p: (inteiro(p[1].get('rank'), p[0]), p[0]))
        saida = []
        for posicao, (original, t) in enumerate(ordenadas, 1):
            rank = inteiro(t.get('rank'), original)
            impacto = max(0, min(100, inteiro(t.get('impact'), 0)))
            alvo = None
            meta = slug(t.get('target'))
            for ident, titulo, _sec, base in self.secoes:
                if meta and base == meta:
                    alvo = (ident, titulo)
                    break
            saida.append({'rank': rank, 'titulo': texto(t.get('title')), 'nota': texto(t.get('note')),
                          'impacto': impacto, 'metrica': texto(t.get('metric')), 'alvo': alvo})
        return saida

    def html(self, paleta, fonte, logo):
        d = self.d
        titulo = self.meta('title') or 'diagnóstico do negócio'
        assunto = self.meta('subject')
        partes = []
        add = partes.append
        variaveis = ''.join(f'--{k}:{",".join(str(c) for c in v)};' for k, v in paleta.items())
        add('<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
            f'<title>{esc(assunto or titulo)} · diagnóstico</title>\n'
            f'<style>\n:root{{{variaveis}--f:{fonte};}}\n{CSS}</style>\n</head>\n<body>\n')

        # topo
        add('<header class="topo"><div class="miolo">')
        if logo:
            add(f'<img src="{logo}" alt="">')
        add(f'<p class="olho">{esc(self.meta("eyebrow") or "diagnóstico do negócio")}</p>')
        add(f'<h1>{inline(titulo)}</h1>')
        if self.meta('lede'):
            add(f'<p class="lide">{inline(self.meta("lede"))}</p>')
        chips = [esc(c) for c in (assunto, self.meta('date')) if c] + [self.acervo_chip()]
        add('<ul class="chips">' + ''.join(f'<li>{c}</li>' for c in chips) + '</ul>')
        add('</div></header>\n')

        # menu
        menu = [('diagnostico', 'Diagnóstico'), ('travas', 'As três maiores travas')]
        if any(objeto(m) for m in lista(d.get('metrics'))):
            menu.append(('numeros', 'Números'))
        if any(objeto(s) for s in lista(d.get('snapshot'))):
            menu.append(('retrato', 'Retrato do negócio'))
        menu += [(ident, titulo_sec) for ident, titulo_sec, _s, _b in self.secoes]
        menu += [('plano', 'Plano de ação')]
        if any(objeto(s) for s in lista(d.get('scorecard'))):
            menu.append(('metas', 'Metas e acompanhamento'))
        menu += [('riscos', 'Riscos, suposições e dados que faltam'), ('fontes', 'Fontes')]
        add('<div class="grade"><nav class="menu" aria-label="Seções">')
        add(''.join(f'<a href="#{i}">{esc(r)}</a>' for i, r in menu))
        add('</nav><main>\n')

        # diagnóstico
        v = d.get('verdict') if objeto(d.get('verdict')) else {}
        add('<section id="diagnostico"><h2>Diagnóstico</h2><div class="veredito">')
        if texto(v.get('headline')):
            add(f'<p class="manchete">{inline(v.get("headline"))}</p>')
        for p in paragrafos(v.get('summary')):
            add(f'<p>{inline(p)}</p>')
        add('</div><dl class="fatos">')
        if texto(v.get('constraint')):
            add(f'<dt>Trava principal</dt><dd>{inline(v.get("constraint"))}</dd>')
        confianca = CONFIANCA.get(texto(v.get('confidence')))
        if confianca:
            add(f'<dt>Confiança</dt><dd>{confianca}</dd>')
        add('</dl></section>\n')

        # travas
        add('<section id="travas"><h2>As três maiores travas</h2><div class="travas">')
        for t in self.travas():
            add('<article class="trava">')
            add(f'<div class="n">trava {t["rank"]} &middot; impacto {t["impacto"]}</div>')
            add(f'<h3>{inline(t["titulo"])}</h3>')
            if t['nota']:
                add(f'<p>{inline(t["nota"])}</p>')
            add(f'<div class="barra" aria-hidden="true"><span style="width:{t["impacto"]}%"></span></div>')
            extras = []
            if t['metrica']:
                extras.append(inline(t['metrica']))
            if t['alvo']:
                extras.append(f'<a href="#{t["alvo"][0]}">na seção {esc(t["alvo"][1])}</a>')
            if extras:
                add('<div class="med">' + ' &middot; '.join(extras) + '</div>')
            add('</article>')
        add('</div></section>\n')

        # números
        metricas = [m for m in lista(d.get('metrics')) if objeto(m)]
        if metricas:
            add('<section id="numeros"><h2>Números</h2><div class="numeros">')
            for m in metricas:
                add(f'<div class="numero"><div class="r">{esc(m.get("label"))}</div><div class="v">{esc(m.get("value"))}</div>')
                if texto(m.get('note')):
                    add(f'<p>{inline(m.get("note"))}</p>')
                add('</div>')
            add('</div></section>\n')

        # retrato
        retrato = [s for s in lista(d.get('snapshot')) if objeto(s)]
        if retrato:
            add('<section id="retrato"><h2>Retrato do negócio</h2><div class="tabela"><table>'
                '<thead><tr><th>Campo</th><th>Valor</th><th>Situação</th></tr></thead><tbody>')
            for s in retrato:
                st = texto(s.get('status'))
                selo = f'<span class="st st-{st}">{STATUS[st]}</span>' if st in STATUS else esc(st)
                add(f'<tr><td>{esc(s.get("field"))}</td><td>{inline(s.get("value")) or "&nbsp;"}</td><td>{selo}</td></tr>')
            add('</tbody></table></div></section>\n')

        # seções
        for ident, titulo_sec, sec, _base in self.secoes:
            add(f'<section id="{ident}"><h2>{inline(titulo_sec)}</h2>')
            if texto(sec.get('summary')):
                add(f'<p class="resumo">{inline(sec.get("summary"))}</p>')
            for sub in lista(sec.get('subsections')):
                if not objeto(sub):
                    continue
                ancora = slug(sub.get('id'))
                atributo = f' id="sub-{ancora}"' if ancora else ''
                add(f'<h3{atributo}>{inline(sub.get("title"))}</h3>')
                if texto(sub.get('plain')):
                    add(f'<div class="rotulo">Em palavras simples</div><p class="simples">{inline(sub.get("plain"))}</p>')
                for p in paragrafos(sub.get('body')):
                    add(f'<p>{inline(p)}</p>')
                evs = [ev for ev in lista(sub.get('evidence')) if objeto(ev) and id(ev) in self.julgamento]
                if evs:
                    add('<div class="rotulo">O que o acervo diz</div>')
                    for ev in evs:
                        add(self.citacao_html(ev))
                if texto(sub.get('synthesis')):
                    add(f'<div class="rotulo">Nossa leitura</div><div class="leitura"><p>{inline(sub.get("synthesis"))}</p></div>')
                caixa = sub.get('callout')
                if objeto(caixa) and texto(caixa.get('text')):
                    tipo = texto(caixa.get('type'))
                    classe = tipo if tipo in CAIXAS else 'outra'
                    rotulo = CAIXAS.get(tipo, 'Observação')
                    add(f'<div class="caixa caixa-{classe}"><b>{rotulo}</b>{inline(caixa.get("text"))}</div>')
            add('</section>\n')

        # plano de ação
        acoes = sorted([a for a in lista(d.get('actions')) if objeto(a)], key=lambda a: inteiro(a.get('priority'), 999))
        add('<section id="plano"><h2>Plano de ação</h2>')
        if acoes:
            add('<div class="tabela"><table><thead><tr><th>#</th><th>Ação</th><th>Por quê</th><th>Quem</th><th>Prazo</th></tr></thead><tbody>')
            for n, a in enumerate(acoes, 1):
                add(f'<tr><td>{inteiro(a.get("priority"), n)}</td><td>{inline(a.get("action"))}</td><td>{inline(a.get("why"))}</td>'
                    f'<td>{esc(a.get("owner"))}</td><td>{esc(a.get("due"))}</td></tr>')
            add('</tbody></table></div>')
        else:
            add('<p>Nenhuma ação registrada.</p>')
        add('</section>\n')

        # metas
        metas = [s for s in lista(d.get('scorecard')) if objeto(s)]
        if metas:
            add('<section id="metas"><h2>Metas e acompanhamento</h2><div class="tabela"><table>'
                '<thead><tr><th>Métrica</th><th>Hoje</th><th>Meta</th><th>Quem</th><th>Cadência</th></tr></thead><tbody>')
            for s in metas:
                add(f'<tr><td>{esc(s.get("metric"))}</td><td>{esc(s.get("baseline"))}</td><td>{esc(s.get("target"))}</td>'
                    f'<td>{esc(s.get("owner"))}</td><td>{esc(s.get("cadence"))}</td></tr>')
            add('</tbody></table></div></section>\n')

        # riscos
        add('<section id="riscos"><h2>Riscos, suposições e dados que faltam</h2>')
        suposicoes = paragrafos(d.get('assumptions'))
        faltando = [texto(s.get('field')) for s in retrato if texto(s.get('status')) == 'missing' and texto(s.get('field'))]
        if suposicoes:
            add('<ul>' + ''.join(f'<li>{inline(s)}</li>' for s in suposicoes) + '</ul>')
        if faltando:
            add(f'<p><b>Dados que faltam:</b> {esc(", ".join(faltando))}.</p>')
        if not suposicoes and not faltando:
            add('<p>Nenhuma suposição nem dado faltando foi registrado.</p>')
        add('</section>\n')

        # fontes
        add('<section id="fontes"><h2>Fontes</h2>')
        grupos = self.grupos_de_fontes()
        if not grupos:
            add('<p class="vazio">Este relatório não tem nenhuma citação do acervo: o que está aqui é leitura, sem fonte.</p>')
        else:
            add(f'<p>{self.n_citacoes} {"citação" if self.n_citacoes == 1 else "citações"} de {len(grupos)} '
                f'{"fonte" if len(grupos) == 1 else "fontes"}.</p><ol class="fontes">')
            for titulo_fonte, itens in grupos:
                add(f'<li><b>{esc(titulo_fonte)}</b><ul>')
                for ev, julgado in itens:
                    add(f'<li>{self.referencia_html(ev, julgado)}</li>')
                add('</ul></li>')
            add('</ol>')
        add('</section>\n')

        add('<footer>Leitura interna: o painel cita o acervo de quem o montou, e não se entrega ao cliente.</footer>')
        add('</main></div>\n</body>\n</html>\n')
        return ''.join(partes)

    def grupos_de_fontes(self):
        grupos = {}
        ordem = []
        for ev in evidencias(self.d):
            chave = texto(ev.get('source')) or (texto(ev.get('file')).rsplit('/', 1)[0] if '/' in texto(ev.get('file')) else texto(ev.get('file'))) or texto(ev.get('title'))
            if chave not in grupos:
                grupos[chave] = []
                ordem.append(chave)
            grupos[chave].append((ev, self.julgamento[id(ev)]))
        return [(texto(grupos[c][0][0].get('title')) or c or 'trecho sem título', grupos[c]) for c in ordem]

    def referencia_html(self, ev, julgado):
        rotulo = legenda(ev)
        partes = []
        if julgado['link']:
            partes.append(f'<a href="{esc(julgado["link"])}" rel="noopener noreferrer">{esc(rotulo)}</a>')
        elif julgado['descartado']:
            partes.append(f'<span class="descartado">{esc(rotulo)}</span> (link descartado)')
        else:
            partes.append(esc(rotulo))
        if texto(ev.get('file')):
            partes.append(f'<code>acervo: {esc(ev.get("file"))}</code>')
        if texto(ev.get('published')):
            partes.append(esc(ev.get('published')))
        return ' &middot; '.join(partes)

    def citacao_html(self, ev):
        julgado = self.julgamento[id(ev)]
        frase = texto(ev.get('quote'))
        if len(frase) > CORTE_DA_CITACAO:
            frase = frase[:CORTE_DA_CITACAO].rstrip() + '…'
        corpo = f'<blockquote>“{esc(frase)}”</blockquote>' if frase else ''
        return f'<figure class="ev">{corpo}<figcaption>{self.referencia_html(ev, julgado)}</figcaption></figure>'

    # -- o gêmeo em texto

    def markdown(self):
        d = self.d
        linhas = []
        add = linhas.append
        add(f'# {self.meta("title") or "diagnóstico do negócio"}')
        add('')
        cabeca = [c for c in (self.meta('eyebrow'), self.meta('subject'), self.meta('date')) if c]
        if cabeca:
            add(' · '.join(cabeca))
            add('')
        if self.meta('lede'):
            add(self.meta('lede'))
            add('')
        add('Acervo: ' + self.acervo_chip().replace('&middot;', '·'))
        add('')

        v = d.get('verdict') if objeto(d.get('verdict')) else {}
        add('## Diagnóstico')
        add('')
        if texto(v.get('headline')):
            add(f'**{texto(v.get("headline"))}**')
            add('')
        for p in paragrafos(v.get('summary')):
            add(p)
            add('')
        if texto(v.get('constraint')):
            add(f'- Trava principal: {texto(v.get("constraint"))}')
        if CONFIANCA.get(texto(v.get('confidence'))):
            add(f'- Confiança: {CONFIANCA[texto(v.get("confidence"))]}')
        add('')

        add('## As três maiores travas')
        add('')
        for t in self.travas():
            extra = ' · '.join(x for x in (f'impacto {t["impacto"]}', t['metrica']) if x)
            alvo = f' Seção: {t["alvo"][1]}.' if t['alvo'] else ''
            add(f'{t["rank"]}. **{t["titulo"]}** ({extra}): {t["nota"]}{alvo}')
        add('')

        metricas = [m for m in lista(d.get('metrics')) if objeto(m)]
        if metricas:
            add('## Números')
            add('')
            for m in metricas:
                nota = f' {texto(m.get("note"))}' if texto(m.get('note')) else ''
                add(f'- **{texto(m.get("label"))}:** {texto(m.get("value"))}.{nota}')
            add('')

        retrato = [s for s in lista(d.get('snapshot')) if objeto(s)]
        if retrato:
            add('## Retrato do negócio')
            add('')
            add('| Campo | Valor | Situação |')
            add('|---|---|---|')
            for s in retrato:
                add(f'| {celula(s.get("field"))} | {celula(s.get("value"))} | {STATUS.get(texto(s.get("status")), celula(s.get("status")))} |')
            add('')

        for _ident, titulo_sec, sec, _base in self.secoes:
            add(f'## {titulo_sec}')
            add('')
            if texto(sec.get('summary')):
                add(texto(sec.get('summary')))
                add('')
            for sub in lista(sec.get('subsections')):
                if not objeto(sub):
                    continue
                add(f'### {texto(sub.get("title"))}')
                add('')
                if texto(sub.get('plain')):
                    add(f'Em palavras simples: {texto(sub.get("plain"))}')
                    add('')
                for p in paragrafos(sub.get('body')):
                    add(p)
                    add('')
                evs = [ev for ev in lista(sub.get('evidence')) if objeto(ev) and id(ev) in self.julgamento]
                if evs:
                    add('O que o acervo diz:')
                    add('')
                    for ev in evs:
                        if texto(ev.get('quote')):
                            add(f'> {texto(ev.get("quote"))}')
                            add('>')
                        add(f'> {self.referencia_md(ev)}')
                        add('')
                if texto(sub.get('synthesis')):
                    add(f'Nossa leitura: {texto(sub.get("synthesis"))}')
                    add('')
                caixa = sub.get('callout')
                if objeto(caixa) and texto(caixa.get('text')):
                    add(f'**{CAIXAS.get(texto(caixa.get("type")), "Observação")}:** {texto(caixa.get("text"))}')
                    add('')

        add('## Plano de ação')
        add('')
        acoes = sorted([a for a in lista(d.get('actions')) if objeto(a)], key=lambda a: inteiro(a.get('priority'), 999))
        for n, a in enumerate(acoes, 1):
            quem = ', '.join(x for x in (texto(a.get('owner')), texto(a.get('due'))) if x)
            por = f': {texto(a.get("why"))}' if texto(a.get('why')) else ''
            add(f'{inteiro(a.get("priority"), n)}. **{texto(a.get("action"))}**{f" ({quem})" if quem else ""}{por}')
        if not acoes:
            add('Nenhuma ação registrada.')
        add('')

        metas = [s for s in lista(d.get('scorecard')) if objeto(s)]
        if metas:
            add('## Metas e acompanhamento')
            add('')
            add('| Métrica | Hoje | Meta | Quem | Cadência |')
            add('|---|---|---|---|---|')
            for s in metas:
                add('| ' + ' | '.join(celula(s.get(k)) for k in ('metric', 'baseline', 'target', 'owner', 'cadence')) + ' |')
            add('')

        add('## Riscos, suposições e dados que faltam')
        add('')
        suposicoes = paragrafos(d.get('assumptions'))
        faltando = [texto(s.get('field')) for s in retrato if texto(s.get('status')) == 'missing' and texto(s.get('field'))]
        for s in suposicoes:
            add(f'- {s}')
        if faltando:
            add(f'- Dados que faltam: {", ".join(faltando)}.')
        if not suposicoes and not faltando:
            add('Nenhuma suposição nem dado faltando foi registrado.')
        add('')

        add('## Fontes')
        add('')
        grupos = self.grupos_de_fontes()
        if not grupos:
            add('Este relatório não tem nenhuma citação do acervo: o que está aqui é leitura, sem fonte.')
        for titulo_fonte, itens in grupos:
            add(f'- **{titulo_fonte}**')
            for ev, _julgado in itens:
                add(f'  - {self.referencia_md(ev)}')
        add('')
        return '\n'.join(linhas)

    def referencia_md(self, ev):
        julgado = self.julgamento[id(ev)]
        rotulo = legenda(ev)
        if julgado['link']:
            rotulo = f'[{rotulo}]({julgado["link"]})'
        elif julgado['descartado']:
            rotulo = f'{rotulo} (link descartado)'
        partes = [rotulo]
        if texto(ev.get('file')):
            partes.append(f'acervo: `{texto(ev.get("file"))}`')
        if texto(ev.get('published')):
            partes.append(texto(ev.get('published')))
        return ' · '.join(partes)


def celula(x):
    return texto(x).replace('|', '\\|').replace('\n', ' ')


def palavras_de_texto(d):
    """A conta do texto em português (as citações do acervo ficam fora)."""
    pedacos = []
    m = d.get('meta') if objeto(d.get('meta')) else {}
    v = d.get('verdict') if objeto(d.get('verdict')) else {}
    pedacos += [m.get('title'), m.get('lede'), v.get('headline'), v.get('constraint')] + paragrafos(v.get('summary'))
    for t in lista(d.get('constraints')):
        if objeto(t):
            pedacos += [t.get('title'), t.get('note')]
    for sec in lista(d.get('sections')):
        if not objeto(sec):
            continue
        pedacos += [sec.get('title'), sec.get('summary')]
        for sub in lista(sec.get('subsections')):
            if objeto(sub):
                caixa = sub.get('callout') if objeto(sub.get('callout')) else {}
                pedacos += [sub.get('title'), sub.get('plain'), sub.get('synthesis'), caixa.get('text')] + paragrafos(sub.get('body'))
    for a in lista(d.get('actions')):
        if objeto(a):
            pedacos += [a.get('action'), a.get('why')]
    pedacos += paragrafos(d.get('assumptions'))
    return sum(len(texto(p).split()) for p in pedacos)


def nome_do_painel(dados, entrada):
    m = dados.get('meta') if objeto(dados.get('meta')) else {}
    assunto = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '', texto(m.get('subject'))).strip() or 'relatorio'
    data = re.sub(r'[^0-9-]', '', texto(m.get('date'))) or 'sem-data'
    return entrada.parent / f'{assunto} · diagnóstico · {data}.html'


def principal(argv=None):
    for fluxo in (sys.stdout, sys.stderr):
        try:
            fluxo.reconfigure(encoding='utf-8')
        except (AttributeError, ValueError):
            pass
    p = argparse.ArgumentParser(description='Gera o painel do modo relatório da /oferta.')
    p.add_argument('entrada', help='o relatorio.json')
    p.add_argument('-o', '--saida', help='o painel HTML (padrão: na pasta do json)')
    p.add_argument('--acervo', help='a pasta do acervo (padrão: a do buscar.mjs)')
    p.add_argument('--tokens', help='o tokens.css da marca')
    p.add_argument('--logo', help='a logo (png, jpg ou webp) embutida no topo')
    a = p.parse_args(argv)

    entrada = Path(a.entrada)
    try:
        dados = json.loads(entrada.read_text(encoding='utf-8-sig'))
    except (OSError, ValueError) as erro:
        print(f'✗ não li o relatório em {entrada}: {erro}', file=sys.stderr)
        return 2
    if not objeto(dados):
        print('✗ o relatorio.json tem que ser um objeto (as chaves meta, verdict, sections...)', file=sys.stderr)
        return 2

    avisos = Avisos()
    tokens = Path(a.tokens) if a.tokens else MARCA / 'tokens.css'
    paleta, fonte = ler_marca(tokens, avisos)
    logo = ler_logo(Path(a.logo) if a.logo else tokens.parent / 'logo' / 'logo-escura.png')

    julgamento, conferencia, n_citacoes = julgar_citacoes(dados, entrada, a.acervo, avisos)
    painel = Painel(dados, julgamento, conferencia, n_citacoes)

    saida = Path(a.saida) if a.saida else nome_do_painel(dados, entrada)
    saida.parent.mkdir(parents=True, exist_ok=True)
    saida.write_text(painel.html(paleta, fonte, logo), encoding='utf-8')
    gemeo = saida.parent / 'relatorio.md'
    gemeo.write_text(painel.markdown(), encoding='utf-8')

    conferidas = n_citacoes - len({f.get('indice') for f in (conferencia or {}).get('falhas', []) if objeto(f) and isinstance(f.get('indice'), int)}) if conferencia else 0
    avisos.nota(f'{n_citacoes} citações no relatório, {conferidas} conferidas contra o acervo')
    avisos.nota(f'{palavras_de_texto(dados)} palavras de texto (a régua: de 2 mil a 6 mil)')
    avisos.nota(f'painel: {saida}')
    avisos.nota(f'texto: {gemeo}')
    return 3 if avisos.graves else 0


if __name__ == '__main__':
    sys.exit(principal())
