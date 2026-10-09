#!/usr/bin/env python3
"""Le um mapa mental .mind (MindMaster / MindMeister) e imprime a arvore
inteira em markdown, com as notas de cada no.

O .mind e' um zip com um map.json dentro. Este script abre o zip em memoria,
percorre a arvore de nos e devolve markdown indentado. As notas viram citacao
(`>`), os links e as tarefas viram linha propria.

Uso:
    PY="python"   # no Windows, o caminho completo costuma ser ~/AppData/Local/Programs/Python/Python3XX/python.exe
    PYTHONIOENCODING=utf-8 "$PY" scripts/ler-mind.py "caminho/mapa.mind"
    PYTHONIOENCODING=utf-8 "$PY" scripts/ler-mind.py "mapa.mind" >> saida.md

O PYTHONIOENCODING e' obrigatorio no Windows: o console usa cp1252 e engasga
em seta, travessao e afins.

Python em vez de Node porque o zipfile e o json sao biblioteca padrao aqui;
em Node, ler zip exigiria dependencia.
"""
import json
import re
import sys
import zipfile


def limpa(texto):
    """Tira o HTML que o MindMaster guarda dentro de title e note."""
    if not texto:
        return ""
    texto = re.sub(r"<br\s*/?>", "\n", texto)
    texto = re.sub(r"</p>", "\n", texto)
    texto = re.sub(r"<[^>]+>", "", texto)
    for de, para in [("&nbsp;", " "), ("&amp;", "&"), ("&lt;", "<"),
                     ("&gt;", ">"), ("&quot;", '"'), ("&#39;", "'")]:
        texto = texto.replace(de, para)
    return texto.strip()


def anda(no, prof=0):
    ind = "  " * prof
    print(f"{ind}- **{limpa(no.get('title'))}**")

    nota = limpa(no.get("note"))
    if nota:
        for linha in nota.split("\n"):
            if linha.strip():
                print(f"{ind}  > {linha.strip()}")

    if no.get("link"):
        print(f"{ind}  LINK: {no['link']}")
    for link in no.get("links") or []:
        print(f"{ind}  LINK: {link}")

    tarefa = no.get("task") or {}
    if any(tarefa.get(c) for c in ("from", "until", "resource", "effort")):
        print(f"{ind}  TASK: {tarefa}")
    if no.get("icon"):
        print(f"{ind}  ICONE: {no['icon']}")

    for filho in no.get("children") or []:
        anda(filho, prof + 1)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    caminho = sys.argv[1]
    with zipfile.ZipFile(caminho) as z:
        nomes = [n for n in z.namelist() if n.endswith(".json")]
        if not nomes:
            print(f"erro: nenhum .json dentro de {caminho} — "
                  f"conteudo: {z.namelist()}", file=sys.stderr)
            sys.exit(1)
        dados = json.loads(z.read(nomes[0]).decode("utf-8"))

    raiz = dados.get("root") or dados
    anda(raiz)


if __name__ == "__main__":
    main()
