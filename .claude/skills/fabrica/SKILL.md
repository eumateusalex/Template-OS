---
name: fabrica
description: >
  A esteira de software do workspace: do pedido à entrega de qualquer coisa com
  código, com spec, teste visto vermelho antes, portão e lentes de revisão.
  Instala um kit portátil no alvo; dois modos (kit, esteira) e três tamanhos
  (P, M, G). Use para "cria uma ferramenta", "constrói um sistema", "quero um
  script que faça X", "passa pela fábrica", ou /fabrica. Não serve para
  conserto de uma linha, documento sem código nem peça visual.
---

# /fabrica — a esteira de software do workspace

Para quando você precisar criar um software, um filtro ou uma ferramenta com
processo bem definido, para não ter erro.

🚨 **O que ela garante é três coisas, e é isso que roda de verdade**: o **kit**
verde no portão, o **recibo** do vermelho gravado por máquina, e as **lentes** no
fim. O resto é o caminho até lá.

🚨 **Esta skill é a orquestradora, na conversa principal.** Subagente não lança
subagente: quem chama as lentes em paralelo é quem conversa com você.

## Modo e tamanho, decididos no passo 0 e ditos numa linha

| Modo | Quando | O que a fábrica faz |
|---|---|---|
| **kit** | o alvo já tem portão e processo próprios (um projeto maduro, com CI e testes) | o processo é o de lá; a fábrica garante o passo `fabrica` verde, o `provas.md` gerado por máquina e as lentes pelo tamanho |
| **esteira** | o alvo não tem processo (a raiz do workspace, projeto novo) | os passos 1 a 8, inteiros |

| | **P** | **M** | **G** |
|---|---|---|---|
| quando | até 3 arquivos de código, nenhum em `AREAS_OBRIGATORIAS`, sem migration, sem dependência nova | o resto | ideia crua, ou mais de 3 dúvidas que só você resolve |
| rastro | `spec.md` curto e `tasks.md`, sem `plan.md` | spec, plano e tarefas | M, com o `/grill` antes da spec |
| portão | inteiro antes da revisão | `--so <passo>` por história; inteiro antes da revisão e da entrega | idem M |
| lentes | as três | as três | as três |
| sessão | uma obra | uma obra, até 3 histórias | uma obra, até 3 histórias |

🚨 **Uma obra por sessão.** A conversa principal é de 82% a 100% do custo de uma
obra, porque cada turno relê o contexto inteiro. Mais de 3 histórias viram duas
obras, e entre uma e outra avise o usuário para digitar `/clear`.

**Quando o alvo tem um portão próprio maior** (a suíte inteira do projeto, um
script que roda tudo), o `fabrica/portao.mjs` (segundos) segue a tabela, e o
portão do projeto roda **inteiro uma vez por obra**, depois do último commit de
código e antes das lentes. Por história, só os passos tocados.

⚠️ **Mudança no próprio kit da fábrica é sempre G**: é conferidor de portão, e um
`stack.mjs` com `CODIGO = ['scripts']` faria o kit contar como P. Em P as lentes
também são as três: mesmo em P aparece gravidade 2 que só a de arquitetura vê.

`AREAS_OBRIGATORIAS` é a lista, no `stack.mjs` do kit no alvo (os parâmetros do
projeto, que nascem de `.claude/skills/fabrica/templates/stack.node.mjs`), das pastas onde
o verde pode mentir caro (dinheiro, segurança, dado de terceiro, conferidor):
ali toda mudança pede mutação registrada.

**Não usar:** conserto de uma linha, documento sem código, peça visual.

## Passo 0 · O alvo e o kit

O alvo é o que você nomeou (`projetos-pessoais/<nome>`, `clientes/<nome>` ou a
raiz do workspace); sem dedução, pergunte. O kit mora em `fabrica/` no alvo. Na
raiz do workspace ele fica fora de vista, na pasta fabrica dentro de .claude
(`--pasta .claude/fabrica` na instalação), e o kit acha sozinho qual dos dois
lugares existe.

```bash
node .claude/skills/fabrica/scripts/instalar.mjs --conferir <alvo>   # sem deriva, siga
node .claude/skills/fabrica/scripts/instalar.mjs --alvo <alvo>       # não existe, instale
```

Divergiu: ou alguém editou o kit no alvo (diga qual arquivo e só então `--forcar`), ou a
fonte do kit mudou: `node .claude/skills/fabrica/scripts/instalar.mjs --atualizar <alvo>`, que só troca a pasta do kit.
**Mudança no kit se ensaia antes, na bancada**, com cópias do commit, sem remoto nem
rede: `.claude/skills/fabrica/scripts/bancada.mjs`, com o `stack.mjs` que vai ser commitado.

## Passo 1 · A spec

Escreva `specs/<NNN>-<nome>/spec.md` pelo `.claude/skills/fabrica/templates/spec-modelo.md`,
com as seções do tamanho (a tabela está no modelo): em M e G, histórias com aceite "dado,
quando, então", casos de borda e suposições; o que só o dono decide em "Perguntas para o
dono". Em G, o rascunho vai ao `/grill`. **Portão:** `node fabrica/portao.mjs --so specs`
roda só o conferidor `specs` (`fabrica/portao/specs.mjs`), cujas regras se chamam S1 a S9;
a S9 cobra a forma do modelo a partir da feature de número `SPECS.modeloDesde`, declarado
no `stack.mjs` do alvo (projeto novo: `001`).

🛑 **PARADA 1, só quando a spec carrega decisão que é sua.** Aí a pergunta vai
por `AskUserQuestion`, com a recomendação na primeira opção. Sem decisão sua, a
spec é mostrada e o trabalho segue. A linha `Parada 1:` da spec diz o estado, e com
ela `pendente` nenhuma tarefa de código começa.

## Passo 2 · O plano (M e G)

`specs/<NNN>-<nome>/plan.md` pelo `.claude/skills/fabrica/templates/plano-modelo.md`:
o desenho, o contexto técnico, os dados e contratos (quando há dado ou serviço de fora), o
Constitution Check e o catálogo `.claude/skills/fabrica/referencias/decisoes-de-engenharia.md`.
Dúvida que se resolve sem você entra aqui, com a alternativa que perdeu.

**Portão:** `--so specs` verde (a S4 e a S5 conferem o Constitution Check e as decisões
de engenharia do plano).

## Passo 3 · As tarefas

`tasks.md` pelo `.claude/skills/fabrica/templates/tarefas-modelo.md`: em M e G, uma
fase por história, na ordem da prioridade; uma tarefa de teste antes de CADA tarefa de
código, na mesma fase, cobrindo o aceite e os casos de borda; `[M]` no que toca conferidor,
segurança, dinheiro ou dado de terceiro; caminho entre crases. **Portão:** `--so specs`.

## Passo 4 · A construção

Por tarefa, sob `.claude/skills/fabrica/referencias/vermelho-verde-refatora.md`:

```bash
node fabrica/vermelho.mjs --tarefa T012 --teste <teste> --feature specs/<NNN>-<nome>
```

Ele roda o teste ANTES do código, lê o relatório de máquina do runner e grava o
vermelho no `provas.md`. Teste que passa sem o código sai 1: ele não mede. Depois,
o código mais simples que passa, a refatoração, e nas `[M]`:

```bash
node fabrica/mutar.mjs <arquivo> "<de>" "<para>" --comando "<teste>" --registrar <teste>
```

O vermelho roda na raiz, na ordem: o teste, o `vermelho.mjs`, o código. Código
escrito antes do recibo não volta no tempo por cópia limpa: a tarefa leva
`- T0NN · vermelho não visto: <razão>`, e a mutação da `[M]` prova o teste.

### O trabalho braçal vai para um subagente

Mutação em lote, recibo pendente, cópia limpa do commit fora da árvore de
trabalho, portão e a leitura
da saída dele rodam numa chamada da ferramenta Agent (`general-purpose`, `model:
sonnet`), que devolve só o desfecho: o código de saída, as linhas que reprovaram
e o que ela gravou. O prompt leva os comandos exatos e a raiz absoluta. A
conversa principal orquestra, julga e edita; cada turno dela relê o contexto
inteiro, e o do subagente começa curto. As réguas são as mesmas.

## Passo 5 · O portão

`node fabrica/portao.mjs` roda a lista inteira e diz todos os vermelhos; `MORTO
POR TEMPO` e `SAÍDA MAIOR QUE O BUFFER` não são `REPROVOU`. Três vermelhos na
mesma tarefa: pare e relate.

## Passo 6 · A revisão

A ordem é **commit → portão com `--base` → lentes**. O recibo do portão grava o
HEAD, e portão antes do commit deixa o recibo fora dele: a lente devolve
`GATE VERMELHO`. Commit também antes da rodada 2.

Uma chamada da ferramenta Agent por lente, **todas na mesma mensagem**, as três
em todo tamanho: `revisor-de-arquitetura`, `revisor-de-codigo` e
`revisor-de-seguranca`. O prompt leva só o caminho absoluto da raiz e
da feature, o `--stat` do diff e a base, a hora do portão, e "sua lente é X".
Não resuma o código: elas leem. Cada relatório vai para
`specs/<NNN>-<nome>/revisoes/<lente>.md` (na rodada 2, `<lente>-rodada-2.md`).

```bash
node fabrica/fundir-revisoes.mjs --feature specs/<NNN>-<nome> --base <base> --lentes arquitetura,codigo,seguranca
```

⚠️ **Quando a obra mexe no próprio kit** e o alvo é a raiz do workspace, o
`portao.mjs` roda a cópia instalada, não a fonte do kit: antes das lentes, o
`teste-fabrica` (`node .claude/skills/fabrica/scripts/teste-fabrica.mjs`, o teste
do próprio kit) também tem que estar verde no HEAD.

Ele dá veredito, grava `revisoes/fusao.json` e conta o teto. `AJUSTAR ANTES`
volta ao passo 4 e rechama só as lentes que acharam algo, na **rodada 2** (o
`--lentes` segue o do tamanho: a que deu PRONTA fica valendo), com o relatório
anterior e os arquivos do conserto lidos inteiros. Rodada 2 ainda com `AJUSTAR
ANTES` sai 3, o teto.

🚨 **O conserto depois do teto não sai sem olhar.** O que sobrou se conserta, se
commita, e passa por uma conferência: só a lente que pediu, lendo só o diff do
conserto, gravada como `<lente>-rodada-3.md` e fundida com
`--alem-do-teto "conferência do conserto pós-teto"`. O que ela ainda achar vai
na entrega; não há quarta rodada. A régua está em
`.claude/skills/fabrica/referencias/revisao-de-codigo.md`.

## Passo 7 · A entrega

🛑 **PARADA 2.** Um bloco, escrito a partir dos artefatos (`.ultimo-portao.json`,
`provas.md`, `fusao.json`):

```
Fábrica · <feature> · <modo> · <tamanho> · <veredito>
Portão:          N de M, <duração>, pulados: <nome (razão)> ou "nenhum"
Vermelhos:       <gerados> gerados, <não vistos> não vistos
Mutações:        <pegas> de <registradas>
Revisão:         rodada <N>, <veredito> · aberto: <achados 1 e 2> · não citado: <n>
Decidi sozinho:  <as escolhas do caminho, e o que joga contra>
Depende de você: <o que só as suas mãos fazem>
```

Aprovado, merge e push seguem a regra do `CLAUDE.md` (em cliente com deploy no
push, avise antes).

## Passo 8 · Fechar

Decisão cara de reverter e com trade-off real vira ADR em `docs/adr/`. Regra de
comportamento nova vai no `CLAUDE.md`; fato novo do negócio, `/memoria registrar`.

## As regras que não se quebram

1. **Duas paradas no máximo**, a spec (só com decisão sua) e a entrega.
2. **O vermelho é visto e gravado por máquina**, ou declarado como não visto,
   com razão. Linha escrita à mão não vale.
3. **Verde medindo zero é vermelho**, e "não consegui medir" reprova.
4. **O kit não se edita no alvo**; o ajuste mora no `stack.mjs`.
5. **Conferidor novo entra em três lugares**: o conferidor, a prova plantada e a
   linha em `PASSOS`.
6. **Piso é catraca**, medido no dia, com a data ao lado.
7. **Isenção é `// <marca>: <razão>` na linha**, nunca lista apartada.
8. **A spec, o plano e as tarefas são da fábrica**, pelos modelos dela: é a única
   ferramenta de spec do workspace.
9. **Teto de duas rodadas de revisão**, contado pelo `fundir-revisoes`, mais a
   conferência do conserto pós-teto.

## O custo, e o resto

Uma lente lê de cache, na mediana, perto de 1 milhão de tokens (a de segurança
lê menos, a de código mais) e leva uns 3 minutos. As lentes são de 6% a 11% do
custo de uma obra, e a conversa principal, de 82% a 100%: o que encarece é a
sessão longa, não a revisão.
Armadilhas: `.claude/skills/fabrica/referencias/armadilhas.md`.

## Limites

A fábrica não faz DAST, revisão por IA no CI, medição de complexidade além do
linter, nem decide por você o que só você pode decidir. O `/seguranca` cobre a
análise dinâmica quando necessária.
