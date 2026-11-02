# rascunho/ — área momentânea

Esta pasta é onde você **larga coisa para usar na hora**: material de apoio,
referência que achou, print, arquivo baixado, algo que serve para uma tarefa e
acaba com ela.

**É momentânea de propósito.** O que entra aqui se usa e se descarta logo em
seguida. Não é arquivo, não é acervo, não é lugar de guardar.

**Não precisa organizar antes de largar.** Se você tiver que pensar em arrumação
para soltar um arquivo, a pasta perde a função.

## Não versiona

O `.gitignore` da raiz ignora `rascunho/` inteira, menos este README. É área de
trabalho local.

⚠️ **Consequência:** o que ficar aqui existe em cópia única, e some sem deixar
rastro. Coisa que precisa sobreviver **sai daqui** para um lugar versionado antes
de qualquer limpeza.

## Descarte

A regra geral do workspace: o que o git rastreia sai direto (o histórico é a
volta), e o que não está no git passa pela `lixeira/`, com registro no
manifesto. **O `rascunho/` não versiona e é descartável por definição:** o que
está aqui se apaga direto, sem manifesto, como a pasta de prospecção vencida. É
para isso que a pasta existe.

O que **não** vale: apagar do `rascunho/` alguma coisa que só existe ali e ainda
serve para algo. Nesse caso, o passo é tirar da pasta primeiro, não apagar.

## Não é aleatória

Momentânea não quer dizer bagunça sem critério. Quando você deixar algo
aqui, o sistema:

1. **Avalia o conteúdo:** o que é, de onde veio, para que serve
2. **Propõe um lugar melhor** no sistema, se aquilo não for descartável
3. **Espera o ok**, e só então move

**Nunca reorganizar nem esvaziar o `rascunho/` por conta própria.**

## O que NÃO é

- **Não é `dados/`.** Aquela é entrada de material para ler uma vez (CSV,
  export, relatório). Aqui é qualquer coisa, de uso imediato
- **Não é `lixeira/`.** Aquela é descarte em quarentena, com manifesto e
  aprovação. Aqui é material de passagem, que se apaga direto
- **Não é `saidas/`.** Aquela guarda o que o sistema produziu. Aqui é entrada
  bruta

## O que está aqui hoje

**Quem responde é o `ls`.** Este README não afirma conteúdo: afirmação de
conteúdo em README envelhece sozinha.
