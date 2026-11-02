"""A camada que pensa. Importa de compartilhado, e de mais ninguem."""

from src.compartilhado.centavos import com_desconto, somar


def total_do_pedido(itens: list[dict[str, int]], porcento: int = 0) -> int:
    bruto = 0
    for item in itens:
        bruto = somar(bruto, item["centavos"])
    return com_desconto(bruto, porcento)
