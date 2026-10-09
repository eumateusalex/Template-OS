# scripts/terceiros/ · as peças que se baixam na instalação

Fontes, ícones, bibliotecas e as skills oficiais de algumas ferramentas não
moram no git: o instalador as baixa da fonte oficial, com versão fixa, para o
caminho que o resto do workspace cita. Depois de instalado, tudo fica na
organização de sempre (mesmos caminhos, mesmos nomes), e o `.gitignore` da raiz
ignora cada destino.

| Arquivo | O que é |
|---|---|
| `instalar.mjs` | o instalador: baixa, monta e confere cada peça |
| `manifesto.json` | a fonte única: para cada peça, a fonte com versão fixa, o destino e a impressão sha256 de cada arquivo final |
| `peca.mjs` | lê o manifesto para quem depende dele: o instalador, o `scripts/confere-contexto.mjs` e os testes que precisam de uma peça (`exigirPeca`) |
| `moldes/` | o que organiza uma peça aqui (o roteador do GSAP, o README e o catálogo do Remotion, o LEIA-ME do vendor, o topo do sprite de ícones): o instalador grava a partir deles |
| `teste-instalar.mjs` | a prova (abaixo) |

## Como usar

```bash
node scripts/terceiros/instalar.mjs --listar     # o que será instalado e de onde
node scripts/terceiros/instalar.mjs              # instala o que falta ou diverge
node scripts/terceiros/instalar.mjs --so remotion
node scripts/terceiros/instalar.mjs --conferir   # o que falta ou diverge, sem baixar
```

- **Idempotente.** Arquivo com a impressão certa não se baixa de novo; rodar
  duas vezes não muda nada.
- **Uma peça muda inteira ou não muda.** O instalador monta todos os arquivos
  dela na memória, confere a impressão de cada um e só então grava. Se um
  arquivo não bate, nada daquela peça muda, e a saída diz qual veio diferente.
- **Rede.** Erro de rede e resposta 5xx repetem três vezes, com intervalo de 2,
  5 e 10 s; o 404 não repete (a versão fixada sumiu da fonte). Se continuar, a
  saída diz a peça e o comando para tentar de novo.
- **Grava só dentro do destino de cada peça.** O manifesto que tenta sair dele
  (caminho com `..`, absoluto, ou uma peça dentro da outra) é recusado antes de
  qualquer escrita.
- **O link do Remotion.** O plugin do Remotion só aparece com o link
  `~/.claude/skills/remotion` apontando para `.claude/skills/remotion/` <!-- caminho futuro: o link que cada pessoa cria uma vez -->;
  o instalador e o `--conferir` dizem se ele está de pé e imprimem o comando do
  seu sistema, com o caminho preenchido.

## O que cada peça pede

Só Node. A exceção é a Inter 4 variável (no `/guardanapo` e no vendor do
`/design-de-produto`): ela chega em dois subconjuntos (latin e latin-ext), e o
recorte se faz aqui, pelo Python com o `fonttools` e o `brotli` nas versões que
o manifesto fixa (estão no `scripts/requirements.txt`). Versão diferente
recorta outro byte, e a impressão não bate: o instalador confere a versão antes
e diz o `pip install` que falta.

## Como se monta um arquivo

Cada linha de `arquivos` diz o `para` (dentro do destino) e de onde vem:

| Campo | O que faz |
|---|---|
| `de` | o caminho na fonte (no pacote do npm, sem a pasta `package/`; no repositório, a partir da raiz) |
| `fonte` | qual das `fontes` da peça, quando ela tem mais de uma |
| `json` | pega um campo do JSON baixado (`files.0.content`) |
| `trecho` | do primeiro texto ao segundo (o segundo fica de fora) |
| `subconjunto` | recorta a fonte nas faixas `unicodes`, com as `opcoes` do `fontTools.subset` |
| `trocas` | pares `[antes, depois]` aplicados no fim, como o CLI da ferramenta faria (o nome da skill, o link entre arquivos, o apelido do import) |
| `molde` | o arquivo de `moldes/`; com `dados`, os `{{campo}}` se preenchem do JSON da fonte, e com `simbolos` o `{{simbolos}}` vira um `<symbol>` por ícone |
| `sha256` · `bytes` | a impressão e o tamanho do arquivo final |

## Trocar de versão

1. Mude a versão (`versao` ou `ref`) da fonte no `manifesto.json`. Arquivo novo
   ou que saiu na fonte entra ou sai da lista `arquivos` à mão.
2. `node scripts/terceiros/instalar.mjs --impressoes --so <peça>` baixa e
   regrava a impressão de cada arquivo, sem gravar nos destinos.
3. Leia o diff do manifesto, rode `node scripts/terceiros/instalar.mjs --so <peça>`
   e as suítes de quem usa a peça.

Molde mudou: rode o passo 2 também, porque a impressão do arquivo final muda
junto.

## A prova

```bash
node scripts/terceiros/teste-instalar.mjs                  # com internet
node scripts/terceiros/teste-instalar.mjs --sem-rede       # só a parte sem internet
node scripts/terceiros/teste-instalar.mjs --antes <pasta>  # mais o byte a byte contra uma cópia antiga
```

A parte sem internet usa um manifesto de mentira e um servidor local: a rede
que falha e volta, a que não volta, o 404, a impressão errada, o caminho que sai
do destino, a idempotência, o `--conferir` acusando arquivo faltando e
divergente, o `--listar`, o contrato que o `scripts/confere-contexto.mjs` lê e o
`.gitignore` cobrindo cada destino. A parte com internet instala o manifesto de
verdade numa pasta temporária, confere cada impressão, estraga um arquivo e
apaga outro, e vê o `--conferir` acusar e a reinstalação consertar.

Quem depende de uma peça chama `exigirPeca('<id>')` (de `peca.mjs`): sem a peça,
o erro diz qual falta e o comando que a instala, em vez de um ENOENT.
