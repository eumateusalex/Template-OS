# Implementation Plan: o total do pedido

## Constitution Check

| Princípio | Estado | Como |
|---|---|---|
| I. Teste antes, sempre | cumpre | teste antes de cada tarefa de código |
| II. Regra que importa vira código, não prompt | cumpre | o portão confere |
| III. Monolito modular | cumpre | quatro camadas declaradas em stack.mjs |
| IV. Nada nasce ligado | não se aplica: nada fala com fora | guarda só na memória |
| V. O estado mora num lugar só | cumpre | tasks.md |
| VI. Conferidor que aprova sabe por que aprovou | cumpre | relatório do kit |
| VII. Decisão de engenharia se escreve antes do código | cumpre | a seção abaixo |
| VIII. Observável por construção | cumpre | nenhum erro engolido |
| IX. Segurança é fronteira | não se aplica: não recebe entrada de fora | sem borda |
| X. Simplicidade | cumpre | zero dependência |

## Decisões de engenharia

| Decisão | Resposta | Razão |
|---|---|---|
| cache | não se aplica: cada total é calculado uma vez | sem repetição |
| idempotência | não se aplica: não há escrita que possa repetir | função pura |
| dinheiro | inteiro em centavos, arredondando ao mais próximo | float erra o centavo, e o erro aparece na fatura |
| concorrência | não se aplica: memória de um processo | sem disputa |
| observabilidade | não se aplica: biblioteca sem efeito de fora | nada a registrar |
| dependência nova | nenhuma | o Node 24 já traz teste e cobertura |
