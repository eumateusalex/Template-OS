from src.api.rota import linha_do_total
from src.dominio.pedido import total_do_pedido
from src.infra.memoria import esquecer_tudo, guardar


def test_total_do_pedido_soma_e_aplica_desconto() -> None:
    assert total_do_pedido([{"centavos": 1000}, {"centavos": 500}], 10) == 1350


def test_linha_do_total_escreve_em_reais() -> None:
    assert linha_do_total([{"centavos": 1000}]) == "Total: R$ 9.00"


def test_guardar_acumula() -> None:
    esquecer_tudo()
    assert guardar("a", 100) == 100
    assert guardar("a", 50) == 150
