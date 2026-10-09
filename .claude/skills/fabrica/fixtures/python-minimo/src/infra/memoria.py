"""A camada que fala com fora. Aqui, so memoria: fixture nao depende de banco."""

from src.compartilhado.centavos import somar

_guardados: dict[str, int] = {}


def guardar(chave: str, centavos: int) -> int:
    _guardados[chave] = somar(_guardados.get(chave, 0), centavos)
    return _guardados[chave]


def esquecer_tudo() -> None:
    _guardados.clear()
