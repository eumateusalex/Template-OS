# Plano · 001-o-total-do-pedido

## Como

Quatro camadas, cada uma importando só do que a de baixo oferece: o dinheiro em
centavos vive em `compartilhado`, o cálculo do total em `dominio`, o texto em
reais na camada que atende e a guarda em memória em `infra`. O desconto
arredonda ao centavo mais próximo; a alternativa, guardar float, perdeu porque o
erro aparece na fatura.

## Contexto técnico

- **Linguagem e versão:** Python 3.12
- **Dependências principais:** nenhuma em produção; pytest e coverage só no desenvolvimento
- **Onde guarda:** só na memória do processo
- **Onde roda:** biblioteca chamada por outro código
- **Metas de desempenho:** nenhuma que decida
- **Escala:** dezenas de itens por pedido

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
| retentativa e fila morta | não se aplica: nada fala com fora | sem chamada que falhe |
| fila ou síncrono | síncrono | cálculo em memória |
| CQRS | não se aplica: um modelo só | sem leitura pesada |
| tempo real | não se aplica: sem atualização ao vivo | cálculo sob demanda |
| paginação | não se aplica: não lista nada | sem lista longa |
| concorrência | não se aplica: memória de um processo | sem disputa |
| migração | não se aplica: não há dado antigo | feature nova |
| fuso e horário | não se aplica: não guarda data | sem hora |
| dinheiro | inteiro em centavos, arredondando ao mais próximo | float erra o centavo, e o erro aparece na fatura |
| autenticação e autorização | não se aplica: sem pessoa nem sessão | biblioteca |
| limite de taxa | não se aplica: nada exposto | sem rota |
| observabilidade | não se aplica: biblioteca sem efeito de fora | nada a registrar |
| backup e restauração | não se aplica: só memória | nada a restaurar |
| desligado por padrão | não se aplica: nada liga | sem capacidade nova |
| dependência nova | nenhuma | pytest e coverage são só de desenvolvimento |
