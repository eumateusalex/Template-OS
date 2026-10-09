# Spec · [FEATURE]

> Tamanho: [P | M | G] · Modo: [esteira | kit] · [DATA]
>
> Parada 1: [pendente · N perguntas | fechado · dd/mm/aaaa | sem decisão dele | grill · dd/mm/aaaa]

<!--
A linha da Parada 1 diz em que pé a spec está:
  pendente · N perguntas  a spec é rascunho e a seção "Perguntas para o dono" tem N
                          abertas; nenhuma tarefa de código começa assim
  fechado · <data>        o dono respondeu as perguntas (por pergunta estruturada)
  sem decisão dele        a spec foi mostrada e nada nela era do dono decidir
  grill · <data>          tamanho G: o rascunho foi para o /grill, e a sabatina fechou
Em G, quando a spec carrega decisão dele: rascunho, com as perguntas → /grill → spec fechada.

QUAIS SEÇÕES, POR TAMANHO. Seção que não se aplica SAI; não fica vazia nem com
"não se aplica" solto.

  | Seção                  | P   | M   | G   |
  |------------------------|-----|-----|-----|
  | O quê                  | sim | sim | sim |
  | Aceite                 | sim | não (mora em cada história) | não |
  | Histórias              | não | sim | sim |
  | Quem faz o quê         | se há mais de um tipo de pessoa | idem | idem |
  | Telas e caminhos       | se tem tela | se tem tela | se tem tela |
  | Casos de borda         | não | sim | sim |
  | Dados                  | se guarda dado | se guarda dado | sim |
  | Serviços de fora       | se usa | se usa | se usa |
  | Sucesso medido         | não | se há número que decide | sim |
  | Suposições             | se houver | sim | sim |
  | Perguntas para o dono  | se houver | se houver | se houver |
  | Fica de fora           | sim | sim | sim |
  | Os pedidos do dono     | sim | sim | sim |

Resposta que ainda espera o dono: marque o aceite ou a linha com "(espera P3)",
apontando a pergunta. Quando ele responde, a marca sai e o texto vira o que ele
decidiu; com marca sobrando, a spec não está fechada.

O conferidor `specs` (S9) cobra esta forma a partir de SPECS.modeloDesde: a
linha do tamanho, a da Parada 1 num dos quatro estados (fechado e grill com a
data), as seções que o tamanho pede com conteúdo, nenhum texto do modelo
sobrando ([título], <o que ele disse>) e nenhum "(espera P…)" numa spec fechada.
Seção opcional que não se aplica sai inteira.
-->

## O quê

<O que o dono pediu, com as palavras dele quando der. Duas a seis frases: quem usa,
o que muda na vida dessa pessoa, por que agora, e o que alguém precisa PASSAR A
FAZER para o sistema funcionar (ex.: o professor marcar a presença todo dia).>

## Aceite

<!-- Só em P, onde não há histórias. Um critério por linha, que se verifica rodando alguma coisa, sem opinião. -->

- <um critério que se verifica rodando alguma coisa>

## Histórias, por prioridade

<!--
Uma história por coisa que alguém consegue fazer e que entrega valor. Cada
uma vira uma fase do tasks.md, na mesma ordem, e se prova sozinha. A ordem
segue a DOR que o dono contou, não a ordem em que ele falou; quando as duas
diferem, a entrega mínima diz por quê.
A ENTREGA MÍNIMA é a menor combinação de histórias que resolve a dor que ele
contou (às vezes é a H1 sozinha, às vezes H1 + H2): diga quais.
-->

| # | História | Por que nesta ordem |
|---|---|---|
| H1 | [título] | [o valor que ela entrega, ou de que as outras dependem] |
| H2 | [título] | … |

**Entrega mínima:** [H1 + H2], porque [a dor que ele contou só se resolve com as duas].

### H1 · [título]

**Quem e o quê:** [quem] quer [fazer o quê] para [ganhar o quê].

**Aceite:**
- Dado [a situação], quando [a pessoa faz X], então [o que ela vê ou o que o sistema guarda].
- Dado …, quando …, então …

### H2 · [título]

**Quem e o quê:** …

**Aceite:**
- Dado …, quando …, então …

## Quem faz o quê

<!-- Um tipo de pessoa por linha, uma ação por coluna. "Não" também é resposta. -->

| Ação | [cliente] | [funcionário] | [dono] |
|---|---|---|---|
| [ex.: marcar horário] | sim | não | sim |
| [ex.: ver o faturamento] | não | não | sim |

## Telas e caminhos

<!--
O caminho de cada pessoa, passo a passo, e onde ela usa (celular, computador).
O que é de tela (cabe no celular, funciona no teclado) se prova por teste de
navegador, não de unidade: diga aqui, e a fase da história ganha esse teste.
Componente interativo (modal, menu, abas, accordion, carrossel, select, toast)
puxa os critérios de aceite do Magoo (MCP `magoo`, `get_acceptance_criteria`;
sem o MCP, magoo.cc), e cada cenário de teclado vira teste de navegador.
-->

- **[quem]**, no [celular]: [abre X] → [escolhe Y] → [vê Z].

## Casos de borda

<!--
O que acontece quando dá errado. Percorra a lista e fique com o que se aplica:
vazio, duplicado, muito grande, sem permissão, sessão expirada, dois ao mesmo
tempo, serviço de fora fora do ar ou lento, dado antigo no formato velho, fuso
e virada de dia, desfazer, a ESTREIA (o dado ainda não existe no primeiro dia),
e o dado que depende de alguém registrar (e se não registrarem?). Cada um diz o
que o sistema faz, não só o que pode dar errado.
-->

- **[o caso]:** [o que o sistema faz, e o que a pessoa vê].

## Dados

<!--
O que o sistema guarda. Sem tecnologia: nada de tabela, coluna ou tipo; isso é
do plano. DADO PESSOAL (nome, telefone, e-mail, documento, endereço) se marca na
coluna própria: é ele que pede [M] nas tarefas e cuidado de segurança.
-->

| O que se guarda | O que tem dentro | Dado pessoal? | Liga com | Quem pode ver e mudar |
|---|---|---|---|---|
| [ex.: agendamento] | [data, cliente, serviço, estado] | [sim: telefone] | [cliente, serviço] | [o dono vê todos; o cliente, só os dele] |

## Serviços de fora

<!--
Todo serviço que não é seu: mensagem, pagamento, e-mail, mapa, IA. Custo
recorrente novo é decisão do dono, e vai também para "Perguntas para o dono".
-->

| Serviço | Para quê | Custo | Se cair, o sistema… | Alternativa |
|---|---|---|---|---|
| [ex.: WhatsApp] | [confirmar o horário] | [por conversa / mensal] | [agenda mesmo assim e mostra o aviso] | [e-mail] |

## Sucesso medido

<!--
Um número que diz se funcionou, e como se mede. Sem número inventado. Se hoje
não existe número de partida (o caderno não mede), diga isso, e o primeiro mês
de uso vira a base.
-->

- [o que se mede]: [o número, ou "base: o primeiro mês"], medido por [como].

## Suposições

<!-- O que foi assumido sem ele confirmar. Suposição que muda o que se constrói NÃO fica aqui: vira pergunta. -->

- [o que foi assumido, e por que é seguro assumir]

## Perguntas para o dono

<!--
O que só o dono decide. Cada uma com a recomendação, porque vira pergunta
estruturada na Parada 1 (ou pauta do /grill em G). Enquanto houver aberta, a
linha da Parada 1 é "pendente". Quando o pedido, do jeito que veio, não resolve
a dor que ele contou, isso também vira pergunta, com a sua recomendação.
-->

- **P1 · [o assunto]:** [a pergunta]. Recomendo: [a opção, e por quê].

## Fica de fora

- <o que não entra nesta feature, e por quê>

## Os pedidos do dono, um a um

<!-- Cada pedido numa linha. Pedido que ficou fora vai dito, com o motivo, nunca calado. -->

| Pedido | Onde entrou |
|---|---|
| <o que ele disse> | <H1, aceite N, ou "fora: motivo"> |
