# Vermelho, verde, refatora: o protocolo por tarefa

> O que acontece dentro de cada tarefa do `tasks.md`, e o que fica de rastro.
> É o princípio I da constituição, em passos.

## O laço

```
teste  →  vermelho.mjs  →  VERMELHO gravado  →  código  →  VERDE  →  refatora  →  VERDE
                                                                                    │
                                                                           se [M]: muta
```

## Passo a passo

### 1 · Escreve o teste

Antes do código. Um teste que passaria com qualquer implementação não serve.

### 2 · Roda o teste pelo `vermelho.mjs`, e ele grava o recibo

```bash
node fabrica/vermelho.mjs --tarefa T012 --teste testes/preco.test.mjs --feature specs/012-o-preco
```

⚠️ O `--tarefa` é o número da tarefa de **código** (a `T012 código:`), que é a
que o S7 cobra, e não o da tarefa de teste que vem antes dela. Vermelho gravado
sob o número do teste o S7 reprova; o conserto honesto é uma linha `vermelho não
visto` apontando para a gravada, porque rodar de novo, com o código já escrito,
dá verde.

Ele roda o `COMANDOS.testarUm` do `stack.mjs`, lê o **relatório de máquina** do
runner (junit do node e do pytest, json do vitest) e escreve no `provas.md`:

```markdown
- T012 · vermelho: AssertionError: expected 6 to equal 0 · testes/preco.test.mjs · vermelho.mjs dd/mm/aaaa 1a2b3c4d
```

| Sai | O que quer dizer | O que fazer |
|---|---|---|
| **0** | vermelho visto e gravado | escreva o código |
| **1** | o teste **passou sem o código** | ele não mede o que diz: conserte o TESTE |
| **2** | uso errado, ou falta `testarUm` no `stack.mjs` | leia a mensagem |
| **4** | o runner não mediu (sem relatório, zero teste) | o comando está errado |

⚠️ **`Cannot find module` conta**, e é o vermelho mais honesto do começo: prova
que o teste falha por ausência do código, não por outra coisa.

🚨 **Linha escrita à mão não vale.** O conferidor `specs` (S7) só aceita a linha
gerada. Quando não houve como ver o vermelho (o teste é de banco e a bancada não
sobe, o código já existia), diga isso:

```markdown
- T012 · vermelho não visto: o teste depende do banco de teste, que não sobe nesta máquina
```

A razão é obrigatória, e o revisor de código conta quantas há.

⚠️ **A prova de um conferidor é a matriz**, não um `node --test`. Para ela,
`--comando "node fabrica/teste-portao.mjs --so <nome> --relatorio {relatorio}"`.

### 3 · Escreve o código mais simples que faz passar

Não o código bonito: o que passa. A beleza é o passo 4.

### 4 · Refatora com o verde na mão

Se o teste ficar vermelho aqui, a refatoração mudou comportamento, e essa é a
informação que você queria.

### 5 · Se a tarefa é `[M]`, muta

As quatro classes onde o verde mente mais caro:

| Classe | Por quê |
|---|---|
| conferidor de portão | um conferidor que não reprova é pior que nenhum |
| regra de segurança | o teste verde vira a prova de que está seguro |
| dinheiro | arredondamento errado só aparece na fatura |
| dado de terceiro | o contrato muda sem avisar |

```bash
node fabrica/mutar.mjs src/dinheiro/preco.ts "Math.round" "Math.floor" \
  --comando "npx vitest run testes/preco.test.ts" \
  --registrar testes/preco.test.ts
```

O registro vai para o **cabeçalho do teste**, e é o único lugar dele: o
conferidor `specs` prova a tarefa `[M]` por ali, e o `mutacoes` confere que o
trecho `"de"` ainda existe e é único.

| Código | O que quer dizer | O que fazer |
|---|---|---|
| **0** | mutação pega: o teste ficou vermelho | registrado; siga |
| **1** | o teste continua verde | o teste não mede esse trecho: conserte o TESTE |
| **2** | trecho não único, inexistente ou troca que não muda nada | escolha um trecho maior |
| **3** | o arquivo não voltou byte a byte | **pare e confira o arquivo antes de continuar** |
| **4** | o runner não mediu nada | o comando está errado, ou zero teste rodou |

⚠️ O `mutar.mjs` recusa arquivo com mudança não comitada: a restauração precisa
de base limpa. Comite antes de mutar.

### 6 · Marca a tarefa

```markdown
- [x] T012 [M] código: `src/dinheiro/preco.ts`
```

## Quando NÃO dá para escrever o teste antes

Existe, e é raro. Escreva na linha da tarefa:

```markdown
- [ ] T020 código: `src/config.ts` · sem teste declarado: arquivo de configuração sem lógica
```

⚠️ **A razão é obrigatória e tem que ter sentido.** E a dispensa vale para as
duas pontas: tarefa sem teste não tem vermelho a registrar.

## O erro que mais aparece

**Escrever o teste e o código juntos, e rodar uma vez só.** O verde que sai daí
não prova nada. O `vermelho.mjs` existe para que o caminho mais curto seja o
honesto: rodar o teste antes custa um comando.
