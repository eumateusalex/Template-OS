# O kit da fábrica

> Instalado pela `/fabrica`. Este é o maquinário do portão deste projeto.
>
> 🚨 **Nada aqui dentro se edita, menos o `stack.mjs`.** O conferidor `kit`
> compara cada arquivo com o sha256 do `kit.json` e reprova o que foi tocado.
> O ajuste do projeto mora no `stack.mjs`, e só nele.

## Os comandos

```bash
node fabrica/portao.mjs              # o portão inteiro, com TODOS os vermelhos no fim
node fabrica/portao.mjs --listar     # a lista viva de conferidores, e o onde de cada um
node fabrica/portao.mjs --so <nome>  # um conferidor só
node fabrica/portao.mjs --base main  # antes da revisão: a árvore suja conta só no diff da feature
```

E os que não são do portão:

```bash
# antes do código: roda o teste da tarefa, e o vermelho vai sozinho para o provas.md
node fabrica/vermelho.mjs --tarefa T012 --teste <teste> --feature specs/NNN-nome

# nas tarefas [M]: quebra o código de propósito, e registra no cabeçalho do teste
node fabrica/mutar.mjs <arquivo> "<de>" "<para>" --comando "<teste>" --registrar <teste>

# depois das lentes: um veredito, o teto das rodadas, e o revisoes/fusao.json
node fabrica/fundir-revisoes.mjs --feature specs/NNN-nome --base main
```

⚠️ **`teste-portao.mjs` é o teste do PRÓPRIO kit** (cada régua ainda sabe
reprovar?), e ele não roda no portão do projeto: leva 43 s por portão e
nunca reprovou por defeito de projeto. Quem o roda é o teste da fábrica
(`.claude/skills/fabrica/scripts/teste-fabrica.mjs`), na fonte do kit.

## O que é de quem

| Arquivo | Dono | Pode editar? |
|---|---|---|
| `stack.mjs` | o projeto | **sim, é o único** |
| `kit.json` | o instalador | não: é gerado |
| `.ultimo-portao.json` | o portão | não: é gerado a cada execução |
| `.ultimo-teste-fabrica.json` | o teste da fábrica (só na fonte do kit) | não: é gerado no verde |
| todo o resto | o kit, que vem da skill `/fabrica` | não |

## Como acrescentar um conferidor

Três lugares, e o conferidor `estrutura` reprova se faltar qualquer um:

1. **O conferidor**, em `fabrica/portao/<nome>.mjs`, com a linha de uso e a
   linha `Prova: provas/<nome>.mjs` no cabeçalho (as duas que o `estrutura`
   cobra), e a classe de defeito que ele impede.
2. **A prova plantada**, em `fabrica/provas/<nome>.mjs` (o `estrutura` cobra que
   ela exista), com pelo menos **um caso vermelho e um verde**, que o
   `teste-portao.mjs` roda. Só vermelho vira falso positivo; só verde não sabe
   reprovar nada.
3. **A linha em `PASSOS`**, no `stack.mjs`.

O CI roda a mesma lista (`--ci`), então ele nasce nos dois lugares de uma vez.

## Como isentar uma linha

Sempre do mesmo jeito: a marca e a **razão**, na linha ou na de cima.

```js
import { x } from '../app/tela.ts' // camada declarada: o contrato mora na tela
```

| Marca | Conferidor |
|---|---|
| `camada declarada` | `camadas` |
| `silêncio declarado` | `silencio` |
| `tamanho declarado` | `tamanho` |
| `sem teste declarado` | `specs` (S3) |
| `sem spec declarado` | `specs` (S0), no README da raiz, quando o projeto tem código sem nenhuma pasta de feature |
| `número vivo` | `envelhecimento` |
| `segredo de exemplo` | `segredos` |
| `vermelho não visto` | `specs` (S7), no `provas.md`, quando o vermelho não pôde ser visto |

⚠️ **A razão é obrigatória, com pelo menos cinco caracteres.** Sem razão, a
marca não isenta nada. E **nunca existe lista apartada de exceção**: lista de
exceção envelhece sozinha, e ninguém revisa.

## A catraca

Os conferidores que CONTAM (`cobertura`, `camadas`, `silencio`, `tamanho`,
`travessao`, `envelhecimento`) usam os `PISOS` do `stack.mjs`. Eles reprovam
quando o número **piora**, e sugerem descer o piso quando ele melhora.

🚨 **Piso ausente é reprovação**, não verde: sem linha de base não se mede nada.

Projeto que já existe nasce com o número medido no dia, e a data ao lado:

```js
export const PISOS = {
  tamanho: 16 // dd/mm/aaaa, o dia da medição
}
```

É isso que permite adotar o kit num projeto de verdade sem ficar vermelho no
dia um. Conferidor vermelho no dia um é conferidor que alguém desliga.

## Quando o portão fica vermelho

Ele roda a lista INTEIRA e diz todos os vermelhos de uma vez. Só o `testar`
(ou um passo com `para: true`) interrompe, porque o que vem depois lê a saída dele:

```
🔴 VERMELHOS (2): camadas, tamanho
Para repetir só um: node fabrica/portao.mjs --so camadas
```

Cada passo mostra a duração (`✓ passou · 1,8 s`), e o `.ultimo-portao.json`
guarda a duração de cada um.

⚠️ **`SAÍDA MAIOR QUE O BUFFER` também não é lentidão**: é o passo que falou demais.

⚠️ **`MORTO POR TEMPO` não é `REPROVOU`.** O primeiro é o passo sem resposta; o
segundo é o passo dizendo que achou defeito. Confundir os dois leva a
diagnóstico errado.
