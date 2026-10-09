#!/usr/bin/env python
"""
Transcreve um arquivo de audio ou video local usando faster-whisper.

Roda 100% offline: o arquivo nao sai da maquina. O ffmpeg extrai o audio,
o faster-whisper transcreve e a saida vira um markdown com timestamps.

Usa a placa de video NVIDIA quando ela responde e cai pra CPU sozinho, pelo
motor em scripts/lib/motor_whisper.py. Sem placa funciona igual, so mais
devagar: na maquina onde foi medido, 2 min de audio levaram 10,2 s numa RTX 3050
contra 63,8 s na CPU, do comando inteiro. Precisa do ffmpeg no PATH.

Uso (com o Python no PATH; se o `python` nao responder, use o caminho completo):
    PY="python"   # no Windows, o caminho completo costuma ser ~/AppData/Local/Programs/Python/Python3XX/python.exe
    "$PY" scripts/transcrever.py "dados/video.mp4"
    "$PY" scripts/transcrever.py "dados/video.mp4" --saida "saidas/transcricao-vsl.md"
    "$PY" scripts/transcrever.py "dados/video.mp4" --modelo large-v3 --idioma pt
    "$PY" scripts/transcrever.py "dados/video.mp4" --dispositivo cpu   # forca CPU

    "$PY" scripts/transcrever.py "dados/video.mp4" --json "rascunho/palavras.json"   # tempo por palavra (o /cortes le)

Modelos (baixam sozinhos na primeira vez, com internet, e ficam no cache do
Hugging Face, fora do projeto, em ~/.cache/huggingface; depois rodam offline):
    tiny · base · small · medium · large-v3-turbo (padrao) · large-v3
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "lib"))
try:
    import motor_whisper  # noqa: E402  (o motor: placa de video quando ha, sem PyAV)
except ModuleNotFoundError as _erro:
    print(f"[x] {_erro}", file=sys.stderr)
    raise SystemExit(1)


def mmss(segundos: float) -> str:
    total = int(segundos)
    return f"{total // 60:02d}:{total % 60:02d}"


def main() -> int:
    p = argparse.ArgumentParser(description="Transcreve audio/video local com faster-whisper.")
    p.add_argument("entrada", help="Caminho do arquivo de audio ou video")
    p.add_argument("--saida", help="Caminho do markdown de saida (padrao: ao lado da entrada)")
    p.add_argument("--modelo", default="large-v3-turbo", help="Modelo Whisper (padrao: large-v3-turbo)")
    p.add_argument("--idioma", default="pt", help="Idioma do audio (padrao: pt). Use 'auto' pra detectar")
    p.add_argument(
        "--dispositivo",
        default="auto",
        choices=["auto", "cuda", "cpu"],
        help="Onde rodar (padrao: auto — usa a GPU se existir, senao CPU)",
    )
    p.add_argument(
        "--json",
        help="Grava tambem os segmentos com as palavras e o tempo de cada uma (o que a skill de cortes le)",
    )
    args = p.parse_args()

    entrada = Path(args.entrada).expanduser().resolve()
    if not entrada.exists():
        print(f"Arquivo nao encontrado: {entrada}", file=sys.stderr)
        return 1

    saida = Path(args.saida).expanduser().resolve() if args.saida else entrada.with_suffix(".md")
    saida.parent.mkdir(parents=True, exist_ok=True)

    try:
        print(f"[1/2] Lendo o audio de {entrada.name}...", flush=True)
        audio = motor_whisper.ler_audio(entrada)

        print(f"[2/2] Transcrevendo com '{args.modelo}' (baixa na primeira vez)...", flush=True)
        r = motor_whisper.transcrever(
            audio,
            modelo=args.modelo,
            idioma=None if args.idioma == "auto" else args.idioma,
            dispositivo=args.dispositivo,
            palavras=bool(args.json),
            beam_size=5,
            vad_filter=True,
            vad_parameters={"min_silence_duration_ms": 500},
        )
    except (ModuleNotFoundError, RuntimeError) as erro:
        # o que falta na maquina (ffmpeg, faster-whisper) sai como uma frase, nao como pilha
        print(f"[x] {erro}", file=sys.stderr)
        return 1
    info, dispositivo, compute_type = r["info"], r["dispositivo"], r["compute_type"]
    queda = f" (a placa falhou e caiu pra CPU: {r['caiu_para_cpu']})" if r["caiu_para_cpu"] else ""

    linhas = [
        f"# Transcricao — {entrada.stem}",
        "",
        f"- Arquivo: `{entrada.name}`",
        f"- Modelo: `{args.modelo}` em `{dispositivo}` ({compute_type}){queda}",
        f"- Idioma detectado: `{info.language}` (confianca {info.language_probability:.2f})",
        f"- Duracao: {mmss(info.duration)}",
        "",
        "---",
        "",
    ]

    total = 0.0
    for seg in r["segmentos"]:
        texto = seg["texto"]
        if not texto:
            continue
        linhas.append(f"**[{mmss(seg['inicio'])}]** {texto}")
        linhas.append("")
        total = seg["fim"]
        print(f"  [{mmss(seg['inicio'])}] {texto}", flush=True)

    linhas.append("---")
    linhas.append("")
    linhas.append(f"_Fim aos {mmss(total)}._")

    saida.write_text("\n".join(linhas), encoding="utf-8")

    if args.json:
        import json

        destino = Path(args.json).expanduser().resolve()
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_text(
            json.dumps(
                {"arquivo": entrada.name, "modelo": args.modelo, "dispositivo": dispositivo, "segmentos": r["segmentos"]},
                ensure_ascii=False,
            ),
            encoding="utf-8",
        )
        print(f"Palavras com o tempo: {destino}")

    print(f"\nPronto: {saida}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
