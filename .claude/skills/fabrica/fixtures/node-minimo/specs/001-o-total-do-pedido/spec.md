# Spec · 001-o-total-do-pedido

> Tamanho: M · Modo: kit · 01/01/2000
>
> Parada 1: sem decisão dele

## O quê

Quem monta um pedido soma os itens em centavos e aplica um desconto em
porcentagem, e o valor final não perde nem ganha um centavo por arredondamento.
Quem usa passa a fazer uma coisa só: informar cada item em centavos inteiros, e
a linha do total sai em reais.

## Histórias, por prioridade

| # | História | Por que nesta ordem |
|---|---|---|
| H1 | o dinheiro em centavos | o total do pedido depende da soma e do desconto exatos |
| H2 | o total do pedido | usa o dinheiro da H1 e entrega o valor que a pessoa vê |

**Entrega mínima:** H1 + H2, porque o total só resolve a dor quando soma e desconto estão certos.

### H1 · o dinheiro em centavos

**Quem e o quê:** quem monta o pedido quer somar valores e aplicar desconto sem erro de centavo.

**Aceite:**
- Dado dois valores em centavos, quando se soma, então o resultado é a soma exata.
- Dado um valor e uma porcentagem de desconto, quando se aplica, então o resultado é arredondado para o centavo mais próximo.

### H2 · o total do pedido

**Quem e o quê:** quem monta o pedido quer ver o total já com desconto, em reais.

**Aceite:**
- Dado itens em centavos e um desconto, quando se calcula o total, então ele é a soma dos itens menos o desconto.
- Dado um total, quando a linha do total o escreve, então ele aparece em reais com duas casas.

## Casos de borda

- **Pedido sem itens:** o total é zero, e a linha do total diz R$ 0,00.
- **Desconto que não fecha em centavo inteiro:** arredonda para o centavo mais próximo.
- **Desconto zero:** o total é a soma dos itens.

## Suposições

- Todo valor chega em centavos inteiros: a entrada de fora fica fora desta feature, que é só o cálculo.

## Fica de fora

- Frete e imposto, que mudam o total por regra própria e entram em outra feature.

## Os pedidos do dono

| Pedido | Onde entrou |
|---|---|
| somar os itens em centavos | H1, aceite 1 |
| aplicar desconto em porcentagem sem perder centavo | H1, aceite 2, e H2 |
