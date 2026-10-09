# projetos-pessoais/ — as suas iniciativas

> Aqui mora o que é **seu**: produto, sistema, página, projeto de conteúdo,
> registro de infraestrutura. Não é cliente, não é trabalho pra terceiro.
>
> A pasta segue a mesma arquitetura de `clientes/`, e por um motivo só: **cada
> projeto é uma unidade fechada, com contexto e histórico próprios.** O que muda
> entre as duas é a régua de marca e a régua de isolamento, e as duas diferenças
> estão explicadas abaixo.

## As quatro regras

### 1. Nada de projeto entra no repositório pessoal

O `.gitignore` da raiz exclui `projetos-pessoais/*` por completo. Só este README
versiona.

O motivo é o mesmo de `clientes/`: repositório dentro de repositório se versiona
no dele. Sem a regra, o commit passa, o push passa, e quem clonar recebe uma
pasta vazia. Não dá erro em lugar nenhum.

### 2. Cada projeto é um repositório Git independente

O Git nasce dentro da própria pasta (`projetos-pessoais/<nome>/.git`), **nunca
como submódulo**, e nasce **no dia em que a pasta nasce**.

Não esperar remoto pra inicializar. Repositório local não depende de URL nenhuma,
e é ele que fecha a janela de cópia única.

### 3. Cada projeto tem o guia dele, e é ele que manda ali dentro

Todo projeto nasce com um `CLAUDE.md` próprio, que **sobrescreve a raiz** dentro
da pasta.

**A marca se decide na entrevista do `/novo-projeto`:** uma identidade nova,
uma que já existe, ou neutra até existir. A da casa não entra por padrão, e o
`CLAUDE.md` do projeto diz onde a marca dele mora. Cliente nunca herda a da casa.

### 4. Projetos não se conversam por padrão, mas podem quando você pedir

**Por padrão, cada projeto é uma ilha.** Nada cruza sozinho entre pastas: nem
copy, nem componente, nem base, nem decisão. Trabalhar num projeto é olhar só pra
ele.

⚠️ **Aqui está a diferença mais importante em relação a `clientes/`.** Entre
clientes o cruzamento é **proibido, sempre, sem exceção**. Entre projetos
pessoais ele é **permitido quando você pedir**, porque tudo aqui é seu:
reaproveitar um componente do site num painel, ou uma base de um projeto noutro,
é decisão sua e não fere ninguém.

A régua, então:

- **Não cruzar por iniciativa própria.** Não sugerir "isso aqui parece com aquilo
  lá" sem você abrir o assunto
- **Cruzar quando você pedir**, sem inventar objeção
- **Nunca cruzar com `clientes/`**, em nenhuma direção. A fronteira do cliente
  vale sempre

## Esta pasta não lista projetos

Não existe aqui uma lista de projetos ativos, pelo mesmo motivo de `clientes/`:
lista mantida à mão envelhece e passa a mentir.

Quem responde o que existe é o `ls`. Quem responde o que cada projeto é, é o
`CLAUDE.md` dentro da pasta dele.

## Estrutura de um projeto

O mínimo é fixo, e o resto **nasce do que o projeto é**:

```
projetos-pessoais/<nome-do-projeto>/
  CLAUDE.md      # o guia do projeto. Manda aqui dentro
  briefing.md    # o que é, por que existe, o que entrega, como se sabe que deu certo
  .gitignore     # próprio
  <subpastas>    # só as que as entregas pedirem
```

⚠️ **Não criar subpasta que ninguém pediu.** Diferente de `clientes/`, que tem
esqueleto fixo porque todo cliente é atendido do mesmo jeito, projeto pessoal
tem forma própria: um é sistema com código, outro é um documento só, outro é
registro de infraestrutura. Esqueleto fixo aqui produziria pasta vazia em todo
projeto.

Se uma subpasta for criada, ela nasce com um README de uma linha dizendo o que
guarda. Git não versiona pasta vazia, e sem o README a estrutura some no
primeiro clone.

### O quarto arquivo, quando o projeto cresce: `ESTRUTURA.md`

Quando o projeto passa de um punhado de arquivos, o `CLAUDE.md` começa a inchar
tentando explicar a árvore junto com a regra. **`ESTRUTURA.md` é onde a árvore
mora**, comentada pasta a pasta, dizendo o que versiona e o que não.

Não é obrigatório. Nasce no dia em que alguém precisar dele, e a régua é essa:
**se explicar a árvore está atrapalhando o `CLAUDE.md`, é hora.**

### Nível a mais, quando o projeto tem frentes irmãs

Um projeto pode ter subpastas com `CLAUDE.md` e `briefing.md` próprios (por
exemplo, um projeto de presença digital com uma pasta por rede). **Isso é
permitido**, e a regra é a mesma da raiz: o guia mais fundo ganha do mais raso,
dentro da pasta dele.

⚠️ **Um repositório, não vários.** O nível a mais organiza a pasta, não
multiplica o Git: o `git init` continua sendo um só, na raiz do projeto. Frente
irmã compartilha método, calendário e aprendizado, e três remotos pra isso é
manutenção sem retorno.

O critério pra abrir o nível: **as frentes precisam ser irmãs de verdade**, com
o mesmo objetivo e ritmo diferente. Se uma delas tem objetivo próprio, ela é
outro projeto, não uma subpasta.

### Nome de arquivo e pasta

Kebab-case, sem acento, sem espaço. **É a regra, e ela tem duas exceções
legítimas**, as duas registradas:

1. **Nome próprio de produto de terceiro fica como o produto se chama**
   (ex.: `curso/Nome Do Produto/`), e o `ESTRUTURA.md` do projeto diz por quê:
   aquele nível separa o material como veio do que é seu.
2. **MAIÚSCULA marca arquivo que se lê antes de trabalhar, ou pasta de
   proveniência.** `ESTRUTURA.md`, `INDICE.md`, `RESUMO.md`, `AUDITORIA.md`,
   `TRANSCRICOES/`, `EXTRACOES/`. Elas se destacam no `ls` de propósito.

⚠️ **Antes de "padronizar" um nome que destoa, procurar a justificativa** no
`ESTRUTURA.md` do projeto e nos scripts que leem a pasta: renomear pode quebrar
um script e desfazer uma decisão escrita.

## Criar um projeto novo

Rodar `/novo-projeto`. A skill faz a entrevista curta, monta a pasta, escreve o
`CLAUDE.md` e o `briefing.md`, roda o `git init` e propõe o primeiro commit.
