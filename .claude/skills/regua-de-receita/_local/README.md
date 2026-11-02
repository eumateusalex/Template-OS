# _local — o maquinário da skill

Aqui mora tudo que faz a skill funcionar e se provar: o **manifesto**, as **entradas locais**, o
**catálogo das imagens**, os **índices**, o **método de escrita do princípio** e as **três suítes**.

Estado: o `numeros.mjs --check` imprime princípios e temas; o `manifesto.json` guarda a base de
`references/`, as entradas locais, os enriquecimentos e as imagens órfãs esperadas. Nenhum
princípio aponta texto de fora: cada um se sustenta sozinho.

## A skill é mantida aqui

A skill vem pronta, sem esteira que sobrescreva o que está aqui. Princípio novo entra escrito à
mão, pelo [`metodo.md`](metodo.md), como uma entrada em `entradas/`.

## Mapa da pasta

| Caminho | O que é |
|---|---|
| [`metodo.md`](metodo.md) | **A régua de escrita do princípio:** formato, tamanho, quando repartir, roteamento de tema, enriquecimento |
| `manifesto.json` | **A única lista.** A base de `references/`, as entradas locais, as imagens órfãs esperadas e a versão |
| `entradas/` | Um bloco de princípio pronto por arquivo (ou um enriquecimento de um que existe), aplicado pelo `reaplicar.mjs` |
| [`imagens.json`](imagens.json) | **O catálogo de metadados das imagens:** para cada arquivo de `assets/`, o tipo (`tipo`, sempre `"tela"`: gráfico e tabela viram texto na linha `**Visual.**`), o que ele mostra (`shows`) e, se nenhum princípio o cita, por que fica (`why`) |
| [`../IMAGENS.md`](../IMAGENS.md) | **O catálogo legível das imagens**, gerado pelo `catalogo.mjs`: arquivo, o que mostra, quem usa |
| `catalogo.mjs` | Gera o `IMAGENS.md` a partir do `imagens.json` e das linhas `**Visual.**` |
| **`sincronizar.sh`** | **O comando que fecha um lote.** Faz tudo abaixo, na ordem certa |
| `gera-manifesto.mjs` | Regenera o `manifesto.json` a partir do estado real; guarda a versão da skill |
| `reaplicar.mjs` | O motor: insere as entradas novas no fim do tema e aplica os enriquecimentos |
| `indexar.mjs` | Gera o `INDEX.md` da raiz e o `Quick index` dos temas grandes |
| `numeros.mjs` | Sincroniza as contagens do `SKILL.md` e do `README.md` |
| `verificar.js` | As conferências de estado (o total sai na última linha dele; nenhum documento repete o número). Rodar depois de qualquer coisa |
| `teste-verificar.mjs` | Defeitos plantados: prova que o verificador sabe **reprovar**, cada defeito pela conferência que o caso nomeia, e cada conferência nomeada neutralizada sozinha faz o caso dela reprovar |
| `teste-reaplicar.mjs` | Prova que o motor aplica e reconstrói **byte a byte** (planta as suas entradas numa cópia) |

## O ciclo de trabalho

Escreveu, mudou ou apagou alguma coisa:

```bash
bash .claude/skills/regua-de-receita/_local/sincronizar.sh --completo
```

Ele regenera o manifesto, aplica as entradas, sincroniza os números, regenera o catálogo das
imagens e os índices, e roda as três suítes. **Sai não-zero se algo reprovar.**

Para escrever princípio novo, ler [`metodo.md`](metodo.md) primeiro.

## Por que existem três suítes e não uma

`verificar.js` responde "o estado está certo?". Sozinho ele é um verde que ninguém
auditou: se uma conferência morrer, ele continua verde e mais tranquilizador que antes.

`teste-verificar.mjs` responde "a régua sabe ficar vermelha?". Estraga uma coisa por vez
numa cópia e exige reprovação **pela conferência que o caso nomeia** (sair diferente de zero não
basta: um defeito que derruba três conferências esconderia a morte de uma). Depois neutraliza cada
conferência nomeada sozinha, numa cópia do verificador, e exige que o caso dela reprove. Um caso que
passa a aprovar o defeito denuncia a conferência que morreu.

`teste-reaplicar.mjs` responde "o motor aplica e reconstrói?". Planta princípios novos e um
enriquecimento numa cópia, aplica, destrói a adição e exige os arquivos de volta **byte a byte**:
um único `\n` errado na emenda entre o cabeçalho do arquivo e o primeiro princípio já é defeito.

## Detalhes que custam caro

**Verificador que QUEBRA não é verificador que reprova.** Um `TypeError` não imprime
`FALHOU` nenhum, e quem confere por `grep FALHOU` lê isso como aprovação. Conferir pelo
**código de saída**. Pelo mesmo motivo, `cmd | tail` devolve o código do `tail`, e um
`LOTE FECHADO` lido assim sai por cima de falhas.

**A base é um fato, não uma conta.** `gera-manifesto.mjs` guarda quantos princípios
`references/` traz sem vir de uma entrada (`BASE_PRINCIPIOS`). A contagem esperada é essa base mais
as entradas novas; princípio apagado ou colado direto em `references/` sem entrada reprova. Tirar
ou juntar um princípio da base de propósito é mudar esse número no mesmo lote, e dizer no relatório.

**Enriquecer substitui a linha do rótulo.** O modo `enriquecer` troca a linha inteira de um rótulo
que o bloco já tem: para acrescentar sem perder, a entrada traz o texto existente mais o acréscimo.
Rótulo que o bloco ainda não tem entra na posição canônica (Principle, Apply when, The move,
Evidence, Visual, In one line).

**A régua de tamanho está no `metodo.md`** (110–250 palavras, teto 550); o verificador avisa
acima de 250.

**Linha em branco e lista dentro de um bloco são permitidas.** O método autoriza framework em
bullets. O que o verificador cobra são os dois limites do bloco: o título colado no
`**Principle.**`, e o bloco fechando numa linha rotulada (uma lista nunca vem depois do último
rótulo).
