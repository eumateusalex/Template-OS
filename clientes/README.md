# clientes/ — projetos de terceiros

> **Fronteira: tudo dentro desta pasta é do cliente.** Marca, tom de voz,
> público, cores, nunca a identidade da casa. A identidade da raiz e o
> tom de voz do `_memoria/escrita-publica.md` **não se aplicam aqui dentro**. Cada
> cliente define os dele, no `CLAUDE.md` e no `briefing.md` da própria pasta.

## As quatro regras que não se negociam

### 1. Nada de cliente entra no repositório pessoal

O `.gitignore` da raiz exclui `clientes/*` por completo. Só este README
versiona. Nenhum arquivo de cliente vai para o repositório pessoal, nem por
engano.

### 2. Cada cliente é um repositório Git independente

O Git nasce dentro da própria pasta do cliente (`clientes/<nome>/.git`),
**nunca como submódulo**. Repositório dentro de repositório se versiona no dele.

**O `git init` acontece no dia em que a pasta nasce, sem esperar remoto.**
Repositório local não depende de URL nenhuma, e é ele que fecha a janela de
cópia única. O push é que espera: sobe para o GitHub quando você informar a
URL **daquele cliente especificamente**.

> ⚠️ **Inicializa cedo, publica quando der.** Segurar o `git init` até a URL do
> remoto chegar deixa o trabalho em cópia única justamente nos primeiros dias,
> que é quando ele mais muda. Mesma regra do [`CLAUDE.md`](../CLAUDE.md) e do
> [`projetos-pessoais/README.md`](../projetos-pessoais/README.md).

### 3. Cada cliente tem o guia dele, e é ele que manda aqui dentro

Todo cliente nasce com um `CLAUDE.md` próprio. Ele **sobrescreve a raiz** dentro
da pasta: marca, tom, público e regra de trabalho daquele cliente vêm de lá, não
das preferências pessoais do dono do workspace.

Antes de trabalhar em qualquer coisa de um cliente, ler o `CLAUDE.md` e o
`briefing.md` dele.

### 4. Clientes não se conversam

**Cada cliente é uma ilha.** Nada cruza entre pastas: nem copy, nem carrossel,
nem palavra-chave, nem base de lead, nem preço, nem referência visual. Um
cliente **nunca é citado para o outro**, e nenhuma decisão de um entra como
argumento na estratégia de outro.

Cada estratégia se decide só pelo que serve àquele cliente, ignorando o que
existe nas outras pastas.

**Mesmo nicho na mesma região é normal e não é problema.** Nicho repetido nunca
é motivo para recusar ou segurar cliente novo, e não pede decisão a cada
entrada. O que sustenta isso é exatamente o isolamento acima: ele é a razão de
dois concorrentes poderem ser atendidos ao mesmo tempo sem conflito.

## O método aprende sem o cliente

O que uma consultoria ensina sobre o método (um passo que faltou, uma pergunta
melhor, um teto de horas errado) volta para a skill em
`.claude/skills/consultoria/`, **escrito sem o nome e sem nenhum dado do
cliente**. É o único caminho de algo sair desta pasta, e sai como regra, nunca
como exemplo daquele cliente.

## Esta pasta não lista clientes

Não existe aqui uma lista de quem são os clientes ativos. **É decisão, não
esquecimento.** Lista mantida à mão em dois lugares envelhece, e passa a
afirmar o que já não é verdade sem ninguém perceber.

Quem responde o que existe é o `ls`. Quem responde o que cada cliente é, é o
`CLAUDE.md` e o `briefing.md` dentro da pasta dele.

## Estrutura completa de cada cliente

Cada cliente tem a estrutura inteira dentro da própria pasta, e não depende de
nada de fora:

```
clientes/<nome-do-cliente>/
  CLAUDE.md            # o guia do cliente. Manda aqui dentro, sobrescreve a raiz
  briefing.md          # nicho, objetivo, contato, serviços contratados, prazos
  identidade-visual/   # a marca do CLIENTE (cores, fontes, logo)
  site/                # o código do site, quando houver
  marketing/           # redes sociais e conteúdo do cliente
  seo-ads/             # pesquisa SEO, GMB, campanhas
  saidas/              # relatórios e documentos entregues ao cliente
  dados/               # material bruto recebido do cliente
  consultoria/         # só com diagnóstico ou consultoria contratados (a /consultoria)
  .gitignore           # próprio (node_modules, .env, dados/*, build)
```

Todo cliente nasce com a mesma forma, mesmo com pastas vazias no começo: facilita
achar as coisas depois, seja qual for o nicho. **Pasta extra pode entrar** quando
a frente do cliente pedir. A estrutura acima é o mínimo, não o teto.

## Criar um cliente novo

1. Criar a pasta e a estrutura acima
2. Escrever o `CLAUDE.md` e o `briefing.md` a partir de uma entrevista curta:
   nicho, objetivo, público, serviços contratados, contato
3. `git init` dentro da pasta do cliente, com `.gitignore` próprio, **no mesmo
   dia, sem esperar a URL do remoto**
4. Primeiro commit no mesmo dia. Trabalho de cliente em cópia única é o risco
   que mais custa aqui
5. Push quando você trouxer a URL daquele cliente

## Salvar o trabalho de um cliente

De dentro da pasta do cliente, rodar o `/salvar`. Ele precisa detectar
que o contexto é `clientes/<nome>/` e apontar os comandos git para **aquele**
repositório, nunca para o da raiz. Na primeira vez, pedir a URL do repositório
daquele cliente.
