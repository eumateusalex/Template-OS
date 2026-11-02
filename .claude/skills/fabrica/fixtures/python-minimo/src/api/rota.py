"""A camada que atende. Pode importar de dominio, infra e compartilhado."""

from src.dominio.pedido import total_do_pedido


def linha_do_total(itens: list[dict[str, int]]) -> str:
    centavos = total_do_pedido(itens, 10)
    return f"Total: R$ {centavos / 100:.2f}"
