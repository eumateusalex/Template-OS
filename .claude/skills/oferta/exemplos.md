# Exemplos de entrada e saída

Um exemplo por modo, no molde do `SKILL.md`. Os negócios, os números e os
arquivos do acervo são fictícios: na resposta de verdade, a citação sai do
`--json` da busca no seu acervo, com o endereço quando o trecho traz
(`[título · m:ss](endereço) (acervo: <arquivo>)`).

## Auditoria

**Entrada:** "/oferta auditoria: cliente com agência de tráfego para clínicas
odontológicas, R$ 1.500/mês fixo, sem contrato, fecha 6 de cada 10 calls, o
cliente fica 4 meses em média, o dono vende e gerencia tudo e diz que não
consegue pegar mais clientes."

**Saída:**

**Veredito:** a oferta não está ok: a agência está travada por capacidade, não
por falta de cliente; o preço está baixo para quem fecha 60%, e o cliente sai
rápido demais.

**O que se sabe**
| Item | Valor |
|---|---|
| Preço | R$ 1.500/mês, sem contrato (confirmado) |
| Fechamento | 60% (confirmado) |
| Saída por mês | cerca de 25% (deduzido: quem fica 4 meses) |
| Margem, horas por conta, custo por cliente | faltando |

**As 3 travas, em ordem de impacto**
1. **O preço baixo lota a agenda do dono**
   - O que o método diz: fechando de 50% a 60%, o preço tende a estar de 1,5 a 2 vezes abaixo (metodo/numeros.md); preço alto traz cliente que aplica mais e sobra margem para contratar (metodo/oferta.md) · (acervo: precos/aula-fechamento-000090.md)
   - Minha leitura: na divisa, vale a faixa conservadora: de R$ 2.250 a R$ 3.000.
2. **O dono é o teto da entrega**
   - O que o método diz: quando o dono faz tudo, a trava é o tempo dele (metodo/escala.md).
   - Minha leitura: a R$ 1.500, um gestor contratado come quase todo o lucro da conta; o primeiro número a medir é a margem por conta.
3. **Vender de novo a mesma vaga**
   - O que o método diz: compromisso longo com saída se não houver progresso, a taxa perdoada (metodo/monetizacao.md) · (acervo: agencias/contrato-anual-000270.md)
   - Minha leitura: com 25% saindo por mês, ele repõe clientes só para não cair.

**O menor próximo passo:** as próximas 10 calls saem a R$ 2.500, sem mexer nos
clientes atuais; se fechar 4 ou 5, o preço novo para em pé.

## Conselho

**Entrada:** "tenho uma clínica de fisioterapia. devia cobrar a avaliação ou dar de graça?"

**Saída:**

De graça, como isca, mas vendida pelo resultado e não pelo nome "avaliação":
"em 40 minutos você sai sabendo o que trava a sua volta à corrida e com o plano
das próximas 8 semanas", fechando com três saídas (você faz sozinho em casa,
procura outro profissional, ou faz com a gente).

**O que o método diz:** a isca que revela o problema e quanto ele custa é um dos três tipos de isca (metodo/aquisicao.md); diagnóstico grátis se vende por resultado, não pelo nome "auditoria" (metodo/oferta.md) · (acervo: iscas/diagnostico-gratis-000180.md)
**Minha leitura:** se a jornada comercial em `_memoria/empresa.md` já começa por
uma conversa grátis, o fluxo fica; o que muda é o nome e as três saídas no fim.

## Comecar

**Entrada:** "/oferta tenho uma padaria e vou começar a vender café da manhã para empresas"

**Saída (a primeira pergunta, por AskUserQuestion):**

"Qual é o sonho que quem contrata (em geral o RH) compra?"
- **Um café da manhã que a equipe comenta, sem trabalho nenhum para o RH** (recomendado: é a dor que aparece quando o pedido atrasa ou falta item)
- Gastar menos por pessoa
- Ter um fornecedor que nunca atrasa

Depois de cada resposta, a próxima pergunta do checklist, até o arquivo montado
em `saidas/cafe-empresas-<data>/oferta.md`. <!-- caminho futuro: a skill grava no primeiro uso -->

## Relatório

**Entrada:** "/oferta relatorio da clínica da minha cliente" com os dados.

**Saída:** a tabela do fato para quem pediu confirmar, depois o
`relatorio.json`, o painel HTML e o `relatorio.md` em
`saidas/oferta-<assunto>-<data>/`, pelo [relatorio.md](relatorio.md). O <!-- caminho futuro: a skill grava no primeiro uso -->
gerador confere cada citação no acervo e só sai 0 com todas em ordem.
