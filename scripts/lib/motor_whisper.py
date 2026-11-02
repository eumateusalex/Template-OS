"""O motor de transcricao local: faster-whisper, na placa de video quando ela existe.

Usado pelo `scripts/transcrever.py` (o do /converter e o do /cortes). Tres coisas
que ele resolve:

1. O PyAV fica de fora. O Smart App Control do Windows pode bloquear a DLL dele,
   e o faster-whisper importa o `av` logo na entrada: sem este desvio a
   transcricao nao roda, nem na CPU. O ffmpeg ja entrega o audio pronto
   (16 kHz mono), e o faster-whisper aceita o audio como array, entao o `av`
   nunca e usado de verdade.
2. A placa de video NVIDIA e usada quando responde. Na maquina onde o motor foi
   medido (uma RTX 3050), 120 s de audio levaram 6,5 s na placa contra 59,1 s
   na CPU, com o mesmo texto.
3. Sem placa, ou sem os pacotes da NVIDIA, roda na CPU (int8), mais devagar e
   com o mesmo resultado. Se a placa falha no meio (a DLL do cuBLAS some, por
   exemplo), a transcricao termina na CPU em vez de morrer, e diz que caiu.
"""

import os
import subprocess
import sys
import types
from pathlib import Path

_FALTA_DEPENDENCIA = (
    "o faster-whisper nao esta instalado neste Python: rode "
    "python -m pip install -r scripts/requirements.txt"
)

try:
    import numpy as np  # vem junto com o faster-whisper
except ImportError as _erro:
    raise ModuleNotFoundError(f"{_FALTA_DEPENDENCIA} ({_erro})") from _erro

TAXA = 16000
_SINAIS_DE_PLACA = ("cuda", "cublas", "cudnn", "cufft", "gpu")


def registrar_dlls_nvidia() -> None:
    """Poe as DLLs do cuBLAS e do cuDNN no caminho de busca (so no Windows).

    Os pacotes pip da NVIDIA instalam as DLLs dentro do site-packages, e o
    ctranslate2 nao olha la sozinho: sem isso ele reclama de
    'cublas64_12.dll is not found' mesmo com a placa funcionando.
    """
    if os.name != "nt":
        return
    import sysconfig

    raiz = Path(sysconfig.get_paths()["purelib"]) / "nvidia"
    pastas = [str(p) for p in sorted(raiz.glob("*/bin")) if p.is_dir()] if raiz.is_dir() else []
    if not pastas:
        return
    # O add_dll_directory nao basta: o ctranslate2 carrega o cuBLAS de forma
    # tardia, e nesse caminho o Windows procura no PATH do processo.
    for pasta in pastas:
        try:
            os.add_dll_directory(pasta)
        except OSError as erro:
            print(f"[!] DLL da NVIDIA fora do caminho ({pasta}): {erro}", file=sys.stderr)
    os.environ["PATH"] = os.pathsep.join(pastas + [os.environ.get("PATH", "")])


def escolher_dispositivo(pedido: str) -> tuple[str, str]:
    """Devolve (dispositivo, compute_type). 'auto' tenta a placa e cai pra CPU."""
    if pedido == "cpu":
        return "cpu", "int8"
    registrar_dlls_nvidia()
    try:
        import ctranslate2

        if ctranslate2.get_cuda_device_count() > 0:
            return "cuda", "float16"
    except (ImportError, OSError, RuntimeError) as erro:
        print(f"[!] Placa nao consultada ({erro}).", file=sys.stderr)
    if pedido == "cuda":
        print("[!] Placa pedida mas indisponivel: seguindo na CPU.", file=sys.stderr)
    return "cpu", "int8"


def ler_audio(caminho) -> np.ndarray:
    """Le audio ou video pelo ffmpeg e devolve float32 16 kHz mono, sem PyAV."""
    try:
        r = subprocess.run(
            ["ffmpeg", "-nostdin", "-v", "error", "-i", str(caminho),
             "-vn", "-ac", "1", "-ar", str(TAXA), "-f", "s16le", "-"],
            capture_output=True,
            check=False,
        )
    except FileNotFoundError as erro:
        raise RuntimeError(
            "o ffmpeg nao esta no PATH: instale (no Windows, winget install Gyan.FFmpeg) e abra um terminal novo"
        ) from erro
    if r.returncode != 0:
        raise RuntimeError(f"ffmpeg nao leu {caminho}: {r.stderr.decode(errors='replace').strip()}")
    return np.frombuffer(r.stdout, dtype=np.int16).astype(np.float32) / 32768.0


def _carregar(modelo: str, dispositivo: str, compute_type: str):
    # O `av` falso entra antes do import: o faster-whisper o importa na entrada,
    # e so o usaria para decodificar arquivo, o que aqui e o ffmpeg quem faz.
    sys.modules.setdefault("av", types.ModuleType("av"))
    try:
        from faster_whisper import WhisperModel
    except ImportError as erro:
        raise ModuleNotFoundError(f"{_FALTA_DEPENDENCIA} ({erro})") from erro

    return WhisperModel(
        modelo,
        device=dispositivo,
        compute_type=compute_type,
        cpu_threads=max(1, (os.cpu_count() or 4) - 2),
    )


def _rodar(modelo_carregado, audio, idioma, palavras, opcoes):
    segs, info = modelo_carregado.transcribe(audio, language=idioma, word_timestamps=palavras, **opcoes)
    # A lista se materializa aqui dentro: o gerador e preguicoso, e e na hora
    # de consumir que a placa falha quando falta DLL.
    segmentos = [
        {
            "inicio": float(s.start),
            "fim": float(s.end),
            "texto": (s.text or "").strip(),
            "palavras": [
                {"texto": (w.word or "").strip(), "inicio": float(w.start), "fim": float(w.end)}
                for w in (s.words or [])
                if (w.word or "").strip()
            ],
        }
        for s in segs
    ]
    return segmentos, info


def _falha_de_placa(erro: Exception) -> bool:
    texto = str(erro).lower()
    return any(sinal in texto for sinal in _SINAIS_DE_PLACA)


def transcrever(audio, modelo="large-v3-turbo", idioma=None, dispositivo="auto", palavras=False, **opcoes):
    """Transcreve um caminho de arquivo ou um array float32 16 kHz.

    Devolve {"segmentos", "info", "dispositivo", "compute_type", "caiu_para_cpu"};
    `caiu_para_cpu` e None, ou a mensagem do erro da placa que fez cair.
    """
    if not isinstance(audio, np.ndarray):
        audio = ler_audio(audio)
    disp, compute = escolher_dispositivo(dispositivo)
    caiu = None
    try:
        segmentos, info = _rodar(_carregar(modelo, disp, compute), audio, idioma, palavras, opcoes)
    except (RuntimeError, OSError) as erro:
        if disp == "cpu" or not _falha_de_placa(erro):
            raise
        caiu = str(erro)
        print(f"[!] A placa falhou ({caiu}): terminando na CPU.", file=sys.stderr)
        disp, compute = "cpu", "int8"
        segmentos, info = _rodar(_carregar(modelo, disp, compute), audio, idioma, palavras, opcoes)
    return {"segmentos": segmentos, "info": info, "dispositivo": disp, "compute_type": compute, "caiu_para_cpu": caiu}
