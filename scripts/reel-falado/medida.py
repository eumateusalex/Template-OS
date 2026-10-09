"""O medidor de loudness do Reel falado, usado pelo fala.py e pelo som.py.

`mede(caminho)` roda o ebur128 do FFmpeg e devolve {'lufs', 'pico_dbtp'}: o
loudness integrado (a linha `I:`) e o pico verdadeiro (a linha `Peak:`). A
medida que não sai (arquivo sem áudio, FFmpeg que falhou) ou sai infinita (o
pico −inf do silêncio) volta como None: quem chama recusa, porque não medir
não é passar.
"""
import math
import subprocess


def mede(caminho):
    err = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(caminho), '-af', 'ebur128=peak=true:framelog=quiet', '-f', 'null', '-'],
                         capture_output=True, text=True, encoding='utf-8', errors='replace').stderr
    linhas = [l.strip() for l in err.splitlines()]

    def numero(prefixo):
        v = next((float(l.split()[1]) for l in linhas if l.startswith(prefixo)), None)
        return v if v is not None and math.isfinite(v) else None
    return {'lufs': numero('I:'), 'pico_dbtp': numero('Peak:')}
