# Provas · [FEATURE]

> O recibo desta feature: o vermelho de cada tarefa de código, gravado pelo
> `vermelho.mjs` antes de o código existir.
>
> 🚨 **Este arquivo não é estado.** O estado mora no `tasks.md`. E a mutação das
> tarefas `[M]` mora no cabeçalho do teste, não aqui.

As linhas se escrevem sozinhas:

```bash
node fabrica/vermelho.mjs --tarefa T012 --teste <teste> --feature specs/<NNN>-<nome>
```

```
- T012 · vermelho: <a falha, do relatório do runner> · <teste> · vermelho.mjs <data> <impressão>
```

⚠️ **Linha escrita à mão não vale** (o conferidor `specs` a recusa). Quando não
houve como ver o vermelho, diga isso, com a razão:

```
- T012 · vermelho não visto: <por que ninguém pôde ver o vermelho>
```

---

## O que esta feature achou, e que não estava previsto

<!--
Defeito, armadilha ou surpresa que apareceu no caminho, com a cura.
É a parte que mais vale daqui a seis meses. Se não houve nenhum, escreva
"nada fora do previsto" e siga: a seção vazia é que não serve.
-->
