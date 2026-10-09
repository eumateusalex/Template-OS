# A revisão da fábrica

> O que muda em relação ao contrato do Estúdio de Design, e o que fica igual.
>
> 🚨 **O contrato é o do Estúdio**, em
> `.claude/skills/estudio/referencias/contrato-de-revisor.md`. Esta página não o
> copia: ela diz as diferenças. Copiar o contrato criaria duas versões, e em
> seis meses elas divergiriam sem ninguém notar.

## As diferenças

| | Estúdio | Fábrica |
|---|---|---|
| prefixo da `description` | `Estúdio · <lente>` | `Fábrica · <lente>` |
| o que a lente olha | peça visual, página, texto que o público lê | código, teste, plano e rastro |
| quantas lentes | as do tipo da peça | **as três em todo tamanho**: mesmo em P aparece gravidade 2 que só a lente de arquitetura vê |
| quem funde | a conversa | **o `fabrica/fundir-revisoes.mjs`**, que dá o veredito, conta o teto e grava `revisoes/fusao.json` |

## A gravidade, adaptada ao código

| Gravidade | O que é | Exemplos |
|---|---|---|
| **1** | comportamento errado, ou porta aberta | cálculo de dinheiro errado, permissão furada, injeção, dado de terceiro exposto, teste que não mede o que diz |
| **2** | regra escrita violada, sem efeito visível hoje | decisão do plano ausente no código, regra de negócio na camada errada, nome fora do `CONTEXT.md` |
| **3** | reparo pequeno | duplicação num terceiro uso recente, razão de isenção fraca, ramo morto |

**`AJUSTAR ANTES`** se sobrou item de gravidade 1 ou 2. **`PRONTA PRA ENTREGA`** se
só 3, ou nada. 🚨 **Achado de segurança é gravidade 1 por padrão.**

## O formato, e o que a máquina confere

Cada achado numa linha, `[arquivo:linha] Gravidade N · o defeito — a régua — o
conserto`, e no fim três seções: `Lido:`, `Não verificado:` e `Veredito:`. O
`fundir-revisoes` também lê o formato que as lentes costumam escrever soltas
(lista numerada, `**ALTO · [local]**`, `Gravidade 1.` no fim).

| Falta | O que acontece |
|---|---|
| o veredito | a lente é **rejeitada** e roda de novo, uma vez |
| `Não verificado` | rejeitada: não medir não é o mesmo que estar certo |
| `GATE VERMELHO` | rejeitada, com a razão "o portão não estava verde"; o veredito vira `AJUSTAR ANTES` |
| arquivo do diff fora do `Lido:` | **não rejeita**: sai como "não citado" na fusão e na entrega |

⚠️ **Por que o `Lido:` não rejeita**: num diff de centenas de arquivos, exigir
a lista rejeitaria a lente a cada rodada, a quase um milhão de tokens de leitura por
vez, por um artefato que prova a lista e não a leitura. Pasta e padrão valem
(`src/modulos/*`).

## Como a /fabrica chama

1. **Commit**, depois `node fabrica/portao.mjs --base <base>`. O recibo do
   portão grava o HEAD; portão antes do commit é recibo fora dele, e a lente
   devolve `GATE VERMELHO`. Com `--base`, a árvore suja conta só no diff da
   feature: o rastro em `specs/<NNN>/` e o trabalho de outra sessão não contam.
2. Uma chamada da ferramenta Agent por lente, **todas na mesma mensagem**.
3. O prompt leva só: o caminho absoluto da raiz e da feature, o `--stat` do diff
   e a base, a hora do portão, e "sua lente é X; Y e Z estão com os outros".
   **Não resuma o código: elas leem.**
4. `node fabrica/fundir-revisoes.mjs --feature specs/<NNN>-<nome> --base <base> --lentes <as do tamanho>`.

## A rodada 2, e o teto

`AJUSTAR ANTES` volta ao conserto e rechama **só as lentes que acharam algo**,
com commit antes. O prompt da rodada 2 leva o relatório anterior e a lista dos
arquivos que o conserto tocou, e a lente lê **esses arquivos inteiros**: o
defeito da rodada 2 costuma estar no arquivo do conserto, fora dos trechos que
ele tocou. O relatório vai em `<lente>-rodada-2.md`.

O `fundir` da rodada 2 leva o **mesmo `--lentes` do tamanho**. A lente que deu
`PRONTA PRA ENTREGA` na rodada 1 e não foi rechamada fica valendo, e sai como
"mantida" na fusão. A que deu `AJUSTAR ANTES`, ou foi rejeitada, e não entregou
o relatório da rodada 2 é rejeitada.

Rodada 2 ainda com `AJUSTAR ANTES`: o `fundir` sai 3, grava `teto: true` e os
achados 1 e 2 abertos. O que sobrou se conserta e passa pela **conferência do
conserto**: a rodada 3, só da lente que pediu, lendo só o diff do conserto, com
`--alem-do-teto "conferência do conserto pós-teto"` (a razão fica gravada). O
que ela ainda achar vai na entrega; não há quarta rodada.

## O custo, com unidade

Uma lente: a mediana medida é 0,9 milhão de tokens de leitura de cache e 3,4
minutos (os números por lente estão na `/fabrica`, em "O custo"). A lente de segurança não lê o `/seguranca` inteiro, e o
`CONTEXT.md` só entra na de código: lido nas três, ele pesaria três vezes por
rodada.

## Quando o agente novo não aparece

Agente recém-criado não entra na lista da sessão em curso.
O fallback: `general-purpose` com "leia `.claude/agents/fabrica/<nome>.md` e siga
à risca; você é só leitura".

## A calibração de uma lente nova

Três defeitos plantados, um por lente, achados **numa rodada**. Lente que não
acha o seu tem a régua reescrita uma vez, e a rodada repete uma vez. Não há
critério de "duas rodadas limpas": ele nunca fecha, porque um revisor bom sempre
acha o próximo caso de uma superfície sem fim.

⚠️ **O `segredos` não entra em laço de revisão.** Achado novo nele vira linha em
"limites conhecidos", não conserto: a superfície das formas de esconder uma
chave não tem fim, e o histórico é do gitleaks no CI.

| O achado | O que se faz |
|---|---|
| cita regra escrita e o projeto a fere | conserta o projeto, ou entra no `ACEITO.md` com data e razão |
| cita regra que não vale ali | reescreve o revisor, com data |
| não cita número nem regra | é gosto: cai, e o revisor ganha a proibição por escrito |
| já é medido por um conferidor | vai para "o que a máquina já mediu" daquele revisor |

🚨 **Nunca mexer no projeto para agradar o revisor, nunca afrouxar a régua para
agradar o projeto.**
