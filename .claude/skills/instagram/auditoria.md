# Modo auditoria · como o perfil está

Olha o perfil inteiro de uma conta contra a regra da conta e o acervo, e entrega
**o veredito, os três consertos de maior impacto e menor esforço, e o que não
foi medido**. Não troca nada no perfil: foto, bio e destaque quem sobe é a
pessoa, e a frase de topo é dela: a auditoria propõe, ela escreve.

## O que se lê, e como

| O quê | Como | Sem acesso |
| --- | --- | --- |
| nome, bio inteira, site e foto | `node scripts/instagram/insights.mjs --dias 30 --limite 50` (com `--conta <nome>` na conta que não é a principal), as linhas `nome:` e `bio:` da tabela; o `--json` traz a foto em `conta.perfil.foto`. Na auditoria, este comando substitui o da saúde da conta do `SKILL.md` | o perfil público lido no navegador, só lendo; o que não veio é "não medi", e a auditoria se refaz depois da conexão |
| os posts, a cadência real e a mistura de formatos | o mesmo comando | a grade no navegador, só lendo (perfil, posts e bio; nunca story) |
| as métricas | o mesmo comando | "não medi: o token da conta está <estado>", com o passo a passo que a saída 3 imprime |
| os fixados e os destaques | o perfil no navegador, só lendo | "não medi" |
| o que já está pronto para a conta | `carrosseis/` <!-- caminho futuro: nasce na primeira peça do /carrossel --> | não se aplica |
| as escolhas da pessoa sobre o perfil | `SKILL.md`, passo 5 | não se aplica |

## O que se confere

Cada item com a régua da memória e, onde ela não tem régua, o princípio do
acervo (marcado como proposta).

| # | Item | Régua |
| --- | --- | --- |
| 1 | **A bio e o nome** dizem o que faz, para quem e o que a pessoa ganha, e batem com a oferta de hoje | `empresa.md`, `oferta.md`, `escrita-publica.md`; `acervo/perfil-e-posicionamento.md`, 2, 4 e 5 |
| 2 | **A foto** | `acervo/perfil-e-posicionamento.md`, 3 |
| 3 | **Os fixados** fazem o funil: o que é, para quem, o que recebe, a prova | `acervo/perfil-e-posicionamento.md`, 7; o que a `estrategia.md` diz pronto, lido contra a régua de hoje |
| 4 | **A cadência real** nos últimos 30 dias, e a mistura de formatos e funções | `marketing.md`, "Planejamento semanal" |
| 5 | **A grade**: as capas se entendem sozinhas e dizem o assunto | `acervo/perfil-e-posicionamento.md`, 8; `acervo/carrossel-e-legenda.md`, 3 |
| 6 | **As métricas**, pelo modo leitura | `leitura.md` |
| 7 | **O CTA e as mensagens**: o perfil promete algo que ninguém entrega? | `estrategia.md`, "Estado das frentes"; `acervo/conversao-e-cta.md`, 3 |
| 8 | **Pessoal ou empresa**: o perfil soa como quem ele é | `acervo/perfil-e-posicionamento.md`, 18 (os dois lados: a leitura escolhe pelo caso) |

**Antes dos três consertos, as escolhas da pessoa** (`SKILL.md`, passo 5):
conserto que troca o que ela aprovou sai da lista e vai como "a escolha sua que
esta auditoria contraria", com as duas versões lado a lado.

## A conta sem post, e a que não se sabe

**Sem leitor e sem navegador, não se sabe se a grade tem post**: os itens 4, 5 e
6 são "não medi", e a auditoria não presume a conta vazia nem cheia.

Grade vazia, medida, muda a pergunta: a auditoria vira **"o que sobe
primeiro"**. Os itens 5 e 6 saem como "não há o que medir", o item 3 lê as peças
prontas no lugar dos fixados, e a métrica da conta que vem `null` é a Meta sem o
número no período, não zero: "não medi".

## A entrega

Em `saidas/auditoria-instagram-<conta>-<AAAA-MM-DD>/AUDITORIA.md` <!-- caminho futuro: nasce na primeira auditoria -->:

1. o veredito nos dois sentidos (`SKILL.md`, "Como fecha");
2. os três consertos, do maior impacto e menor esforço para o menor, cada um com
   o que muda, a régua ou o princípio, e quem faz (a pessoa, no app; ou uma
   skill);
3. "A escolha sua que esta auditoria contraria", quando houver;
4. a tabela dos oito itens, com o que se viu;
5. "O que não foi medido", sempre.
