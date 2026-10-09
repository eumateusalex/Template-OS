"""Dinheiro em inteiro, nunca em float.

E a area obrigatoria deste fixture: e aqui que o conferidor `mutacoes` cobra
mutacao registrada.

ARMADILHA: o `round()` embutido do Python arredonda PARA O PAR (banker's rounding), e
`round(100.5)` devolve 100, nao 101. O `Math.round` do JavaScript devolve 101.
Escrever a mesma regra nas duas linguagens, sem dizer qual arredondamento se
quer, da dois resultados diferentes para o mesmo pedido.

Para dinheiro, o que se quer quase sempre e o meio-para-cima, e ele se escreve
explicitamente com Decimal. E disso que o teste desta pasta trata.
"""

from decimal import ROUND_HALF_UP, Decimal


def somar(a: int, b: int) -> int:
    """Soma dois valores em centavos."""
    return a + b


def com_desconto(centavos: int, porcento: int) -> int:
    """Aplica uma porcentagem, arredondando meio-para-cima."""
    desconto = (Decimal(centavos) * Decimal(porcento) / Decimal(100)).quantize(
        Decimal("1"), rounding=ROUND_HALF_UP
    )
    return centavos - int(desconto)
