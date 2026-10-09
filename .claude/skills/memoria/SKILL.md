---
name: memoria
description: >
  Mantém a `_memoria/`: registra um fato no módulo certo substituindo o que
  ficou velho, audita a memória contra o `_memoria/README.md`, e revisa os
  itens `[REVIEW]`. Use para "registra isso", "guarda na memória", "audita a
  memória", "revisa os pendentes", /memoria, e quando o CLAUDE.md mandar
  registrar. Não mexe em `CLAUDE.md` nem em `identidade/` (é o check-up da /sanitizacao).
---

# /memoria: manutenção da memória

A `_memoria/` é o contexto que o Claude carrega para trabalhar com você. Esta
skill existe para ela não degradar por acréscimo, que é como memória vira linha
do tempo que ninguém consegue ler.

**A regra que governa tudo aqui: memória é estado, não diário.**

O contrato inteiro (módulos, roteamento, convenções) está em
`_memoria/README.md`, e é ele que manda. Esta skill executa o contrato, não o
substitui.

---

## Os três modos

O usuário diz qual, ou o pedido deixa claro. Na dúvida entre registrar e
auditar, perguntar.

| O pedido | Modo |
|---|---|
| "registra isso", "guarda na memória", "anota que mudou" | `registrar` |
| "audita a memória", "a memória está certa?", "varre a memória" | `auditar` |
| "revisa os pendentes", "resolve os REVIEW" | `revisar` |

---

## Modo `registrar`

Um fato novo entra na memória. O trabalho é achar o dono dele e **substituir**
o que ficou velho.

### Passo 1: achar o módulo dono

Ler a tabela "Onde entra uma informação nova" do `_memoria/README.md` e
localizar a linha que cobre o fato.

**Nenhuma linha cobre?** Então uma destas três é verdade, nesta ordem de
probabilidade:

1. O fato não é de memória. Regra de comportamento vai para o `CLAUDE.md`,
   cor, fonte e logo para o `/carrossel configurar`, o que um script faz para o
   README da pasta do código (`scripts/README.md`), e detalhe de um projeto ou
   cliente para o `CLAUDE.md` daquele projeto. Encaminhar e parar.
2. O fato é temporário e serve só para a tarefa de agora. Não registrar.
3. É domínio novo de verdade, e aí vale a regra de criação de módulo do README
   (não cabe em nenhuma linha, mais de umas 40 linhas de conteúdo próprio, e o
   README atualizado no mesmo commit). **Isso é raro. Desconfiar.**

### Passo 2: procurar o que o fato substitui

Antes de escrever, ler o módulo inteiro e procurar a frase que o fato novo
torna falsa. **Quase sempre ela existe**, e é ela que sai.

Procurar também nos outros módulos: se o fato aparecer em dois lugares, um
deles é cópia, e cópia não acompanha mudança. O dono fica, o outro aponta.

**O fato aposenta um nome?** (uma oferta que acabou, um produto renomeado.) O
nome entra na seção "Termos aposentados" do `_memoria/README.md`, com o motivo,
e sai de todos os outros módulos. A partir daí o verificador cobra.

### Passo 3: escrever

- **No presente.** Sem "antes era", "desde tal dia", "foi decidido".
- **Data só ao lado de número que envelhece**, no formato
  `(medido em AAAA-MM-DD)`.
- **Sem emoji como estrutura.** Ênfase é negrito.
- **Sem citação da conversa como prova da regra.** A regra se sustenta sozinha.
  A cena que a originou, se for lição técnica, pertence à memória automática do
  Claude, não a esta pasta.
- Travessão é livre aqui, porque é arquivo interno.

### Passo 3b: o fato fecha alguma pendência?

Se ele fecha, **são duas edições, e as duas no mesmo commit**: o fato entra no
módulo dono, e o item correspondente de `_memoria/estrategia.md` é riscado.
Depois disso, reler o "Próximo passo" de lá: ele costuma existir por causa da
pendência que acabou de fechar, e fica mandando fazer o que já foi feito.

### Passo 4: mostrar e conferir

Mostrar o diff da linha que saiu e da que entrou, em uma tela. Depois rodar:

```
node scripts/confere-memoria.mjs
```

---

## Modo `auditar`

Três camadas, e as três rodam. A máquina pega o mecânico, a leitura pega o que
é julgamento.

### Camada 1: a máquina

```
node scripts/confere-memoria.mjs
```

Ela cobra: todo arquivo declarado no README (e o contrário), estrutura plana,
cabeçalho padrão, zero termo aposentado, zero marcador de diário, zero emoji
estrutural, teto de linhas, e todo ponteiro `_memoria/...` do workspace
resolvendo. Ela também imprime quantos `[REVIEW]` estão esperando decisão.

Se ela reprovar, o conserto é do defeito apontado, nunca de afrouxar a régua.
Mexeu no verificador, rodar `node scripts/teste-confere-memoria.mjs`, que prova
que ele ainda sabe reprovar.

### Camada 2: a leitura

Ler os módulos que o README declara e procurar o que a máquina não vê:

1. **Frase que virou passado.** Afirmação que descreve um estado que acabou.
   Conferir contra o workspace real, não contra a lembrança de outra sessão.
2. **Duplicação semântica.** O mesmo conceito explicado em dois módulos com
   palavras diferentes. Um vira dono, o outro aponta.
3. **Módulo perdendo a responsabilidade.** Conteúdo que, pela tabela de
   roteamento, pertence a outro arquivo.
4. **Item que devia estar marcado.** Afirmação que depende de uma decisão do
   usuário e está escrita como se estivesse decidida. Vira `[REVIEW]`.
5. **Verbosidade.** Parágrafo que repete o anterior com outras palavras.

### Camada 3: a auto-memória

A memória automática do Claude (`~/.claude/projects/<workspace>/memory/`, fora
do git) guarda só lição técnica. Ler o `MEMORY.md` dela e cada arquivo, e
procurar:

1. **Repetição do que mora versionado:** preferência do usuário (dono:
   `_memoria/preferencias.md`), regra do workspace (dono: `CLAUDE.md`), regra de
   projeto (dono: o `CLAUDE.md` do projeto). Sai da auto-memória depois que o
   dono tem o texto.
2. **Lição vencida:** caminho, arquivo ou ferramenta que não existe mais.
3. **Diário:** caso narrado com data onde bastava a regra e um exemplo.
4. **Índice:** todo arquivo listado no `MEMORY.md`, e todo link resolvendo.

A auto-memória ainda vazia (workspace novo) não é achado. Os achados entram no
mesmo relatório.

### O relatório

Entregar uma lista curta, no formato:

```
Memória auditada: N pontos.

1. empresa.md — a frase sobre X descreve um estado que acabou (evidência: …)
2. marketing.md + preferencias.md — a régua de CTA está nos dois; dono é …
3. estrategia.md — a linha sobre Y depende de uma decisão sua; marcar [REVIEW]

Aplicar? Dá para aplicar todas, algumas ou nenhuma.
```

**Não aplicar sem o aval do usuário.** Auditar é diagnóstico; a caneta é dele.

---

## Modo `revisar`

Os itens `[REVIEW]` são o que depende de uma decisão do usuário. Eles ficam na
memória, visíveis, até serem resolvidos.

**Um item por vez, cada um já com a resposta recomendada.**

1. Listar quantos são e em que arquivos (`node scripts/confere-memoria.mjs`).
2. Pegar o primeiro. Apresentar: o que está em aberto, por que não dá para
   decidir sozinho, e a recomendação com o motivo em uma frase.
3. Esperar a resposta. Aplicar no módulo: o `[REVIEW]` some e a frase fica
   afirmativa.
4. Próximo.

**Não agrupar as perguntas.** Item resolvido sai do arquivo antes de o próximo
entrar, porque decisão em lote é decisão revisada mal.

**Não decidir pelo usuário** quando a resposta não estiver no workspace.
Inferência fraca que vira fato é exatamente o que produz memória errada, e
memória errada é pior que memória vazia.

---

## O que esta skill não faz

- **Não mexe no `CLAUDE.md`** nem em `identidade/`. Isso é do check-up da
  `/sanitizacao`; a marca visual é do `/carrossel configurar`.
- **Não grava na memória automática do Claude** (`~/.claude/projects/.../memory/`):
  ela tem formato próprio e guarda só lição técnica. Mas a audita (a Camada 3
  do modo `auditar`).
- **Não apaga módulo à mão.** A `_memoria/` é versionada: o que sai, sai por
  `git rm` e volta pelo histórico.
- **O commit segue a regra do `CLAUDE.md`**: um bloco fechado, com os arquivos
  tocados por caminho (o `/salvar` faz).
