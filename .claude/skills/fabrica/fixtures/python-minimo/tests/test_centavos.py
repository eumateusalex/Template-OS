# mutação: src/compartilhado/centavos.py · "rounding=ROUND_HALF_UP" → "rounding=ROUND_HALF_EVEN" · pega em 09/10/2026

from src.compartilhado.centavos import com_desconto, somar


def test_somar_junta_centavos() -> None:
    assert somar(1050, 299) == 1349


def test_com_desconto_arredonda_meio_para_cima() -> None:
    # 1005 * 10% = 100,5. Meio-para-cima da 101, e o total fica 904.
    # O round() embutido do Python daria 100 aqui, porque ele arredonda
    # para o par: seria 905, e o cliente pagaria um centavo a mais.
    assert com_desconto(1005, 10) == 904
    assert com_desconto(100, 50) == 50
