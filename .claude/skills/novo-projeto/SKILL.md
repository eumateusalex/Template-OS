---
name: novo-projeto
description: >
  A única porta para criar um projeto em `projetos-pessoais/<nome>/`: entrevista
  (projeto, design, estrutura técnica), a pasta com CLAUDE.md, briefing e Git
  próprio, e, com site ou app, o esqueleto técnico (Next, shadcn, testes,
  portão) na marca da entrevista. Use para "novo projeto", "quero começar X",
  "vou montar um produto/app", "cria o projeto X", ou /novo-projeto. Trabalho
  de terceiro é o /novo-cliente.
---

# /novo-projeto · Iniciativa pessoal, com contexto e histórico próprios

Cria o seu projeto em `projetos-pessoais/<nome>/`. **É a única porta**: não
existe outra skill para "subir a base" de um projeto.

**Antes de começar, ler `projetos-pessoais/README.md`.** É lá que moram as quatro
regras da pasta, e esta skill é a aplicação delas.

> ⚠️ **Isto não é para cliente.** Trabalho de terceiro vai em `clientes/`, pela
> `/novo-cliente`, que tem esqueleto fixo e fronteira de marca fechada. Se o pedido
> citar nome de cliente ou falar em trabalho contratado, **parar e confirmar**
> qual das duas é.

---

## Passo 1 · A entrevista

**Uma pergunta por vez, cada uma com a resposta recomendada**, pelo
`AskUserQuestion` quando houver opções. O que já foi dito na conversa não se
pergunta de novo: confirmar e seguir. Resposta que não vier fica
`[a definir]`. **Nunca inventar.**

🚨 **Ideia crua passa pelo `/grill` antes.** Se as respostas 2 e 3 vierem vagas
("um app de alguma coisa", "quero testar uma ideia"), a sabatina do `/grill`
roda primeiro e a entrevista continua com o que ficou de pé.

### Bloco A · o projeto (sempre)

1. "Qual o nome do projeto?"
2. "O que ele é, em uma frase?"
3. "Por que ele existe? (que problema resolve, ou o que você quer com ele)"
4. "O que ele vai entregar? (site, app, sistema, conteúdo, documento,
   automação; pode ser mais de um)"
5. "Como você vai saber que deu certo?"

### Bloco B · a estrutura de design (só se o público vê alguma coisa)

Só quando a resposta 4 tem algo que o público vê (site, app, página, perfil,
peça). Projeto interno pula este bloco.

6. **"Qual estrutura de design o projeto vai usar?"**
   - **identidade nova, criada agora**: seguem as perguntas 7 e 8
   - **uma que já existe**: você passa os arquivos ou a referência, e as cores e
     a fonte saem dela
   - **ainda não tem**: o projeto nasce neutro (cinzas e a fonte do sistema), e
     a marca fica `[a definir]` até você trazer
   - 🚨 **a marca do workspace não é opção na entrevista.** A do `/carrossel`
     é marca de peça (`tokens.css` de slide), não de site, e nenhuma skill do
     template a converte para a web. O instalador tem `--marca casa`, que só
     funciona com uma marca de web montada à mão em `identidade/web/` (o <!-- caminho futuro: só existe se você a montar -->
     formato está no `esqueleto/LEIA-ME.md`); sem essa pasta ele recusa.
7. "Quais as cores? A principal, a do fundo e a do texto" (hex, ou uma
   referência que eu traduzo em hex e mostro antes de seguir)
8. "Qual a fonte, e qual o tom de voz?" A fonte vem em arquivo (woff2, ttf ou
   otf) ou é a do sistema. O tom recomendado é o seu (`_memoria/escrita-publica.md`).

⚠️ **Cor que não se lê volta para você.** O esqueleto recusa primária ou texto
sem contraste de 4,5:1 com o fundo e devolve a cor mais perto que passa. Essa
sugestão vira pergunta ("fica a sugerida, ou outra?"), nunca troca calada.

### Bloco C · a estrutura técnica (só se tem site ou app)

9. "É app (Next) ou página simples?" Recomendação: app. A página simples
   recebe a marca e o portão, sem semente de página.
10. "Precisa de banco e login?" Se sim, o Supabase vem montado e desligado até
    as chaves existirem; se não, ele não vem.
11. "Qual biblioteca de componentes?" Recomendação: **shadcn**, a única que o
    esqueleto monta (os dez componentes base, com o tema da marca). Outra
    biblioteca sai sem essa camada: o projeto a monta por conta própria.

---

## Passo 2 · Nome da pasta

`projetos-pessoais/<nome-do-projeto>/`, em minúsculas, espaços viram hífen, sem
acento (evita atrito em comando de shell e de git).

Se já existir pasta com esse nome, **parar e perguntar** se é pra continuar nela
ou criar com sufixo. Nunca sobrescrever arquivo existente.

---

## Passo 3 · Estrutura

O mínimo é sempre este:

```
projetos-pessoais/<nome-do-projeto>/
  CLAUDE.md
  briefing.md
  .gitignore
```

**As subpastas nascem do que a resposta 4 pediu, e só delas.** Se a resposta foi
"site e conteúdo", nascem `site/` e `conteudo/`. Se foi "é um documento só",
não nasce subpasta nenhuma. Projeto de site ou app na raiz da pasta dispensa a
subpasta `site/`: o esqueleto monta ali mesmo.

⚠️ **Não criar pasta "pra organizar melhor".** Projeto pessoal tem forma própria:
um é sistema com código, outro é um documento, outro é registro de
infraestrutura. Esqueleto fixo aqui só produz pasta vazia.

**Toda subpasta criada nasce com um README de uma linha** dizendo o que guarda.
Git não versiona pasta vazia: sem o README, a estrutura some no primeiro clone.

`.gitignore` do projeto, próprio e independente do da raiz:

```gitignore
node_modules/
dist/
build/
.env
.env.*
!.env*.example
.DS_Store
Thumbs.db
```

Se o projeto tiver material pesado (vídeo, áudio, export), acrescentar a regra
**e escrever o porquê no comentário**, incluindo onde está a fonte original.
Arquivo pesado só fica de fora se for recuperável na fonte.

---

## Passo 4 · `CLAUDE.md` e `briefing.md`

### `CLAUDE.md` do projeto

```markdown
# [Nome do projeto]

> Pasta criada em [data]. **As instruções daqui sobrescrevem as da raiz** dentro
> desta pasta.

## O que é

[resposta 2]

## Por que existe

[resposta 3]

## O que entrega

- [entrega 1]
- [entrega 2]

## Marca

[Identidade nova ou existente, com site ou app:]
A marca é deste projeto e mora em `src/styles/` (`tokens.css`, `fontes.css`,
`tema-shadcn.css`), gerada na criação. As cores e a fonte são as de lá: não se
copiam aqui, para não existirem em dois lugares. [Se ela veio de arquivos que
você trouxe: onde eles estão.] Tom de voz: [resposta 8].

[Identidade nova ou existente, sem código:]
A marca é deste projeto: [as cores e a fonte da resposta 7 e 8]. Tom de voz:
[resposta 8].

[Ainda não tem:]
A marca está **[a definir]**. [Se tem site ou app: o projeto começa neutro, com
cinzas e a fonte do sistema em `src/styles/`, até a identidade existir.]

## Isolamento

Este projeto não se conversa com os outros **por padrão**. Nada cruza sozinho
entre pastas de projeto.

Cruzar é permitido **quando o dono pedir**: tudo aqui é dele, e reaproveitar
o que ele já fez é decisão dele. O que não se faz é cruzar por iniciativa
própria.

⚠️ **Nunca cruzar com `clientes/`, em nenhuma direção.** A fronteira do cliente
vale sempre.

## Onde salvar o que

- Contexto e briefing: na raiz desta pasta
- [uma linha por subpasta criada]

## Específico deste projeto

[Vazio. Preencher com o que valer só para este projeto, conforme aparecer.]
```

### `briefing.md`

```markdown
# Briefing · [Nome do projeto]

- **O que é:** [resposta 2]
- **Por que existe:** [resposta 3]
- **Entregas:** [resposta 4]
- **Como sei que deu certo:** [resposta 5]
- **Estrutura de design:** [identidade nova | existente, em <onde> | a definir]
- **Cores e fonte:** [com site ou app: "em `src/styles/tokens.css`"; sem código: a resposta 7 e 8; ou "a definir"]
- **Estrutura técnica:** [app ou página, com ou sem banco, biblioteca; ou "não se aplica"]
- **Prazos:** [a definir]
- **Começou em:** [data e hora]
```

---

## Passo 5 · Git próprio, no mesmo dia

**Rodar `git init` dentro de `projetos-pessoais/<nome>/` assim que a estrutura
existir.** É repositório aninhado, e é assim que tem que ser: o `.gitignore` da
raiz exclui `projetos-pessoais/*`, então nada de projeto entra no repositório
pessoal.

O **remoto** entra quando você informar a URL. Até lá o histórico local já
protege o trabalho.

---

## Passo 6 · O esqueleto técnico (só se tem site ou app)

Depois do `git init`, e nunca antes: sem `.git` próprio, o instalador acha o
repositório da casa acima e não escreve o workflow do CI. Offline:

```bash
node .claude/skills/novo-projeto/esqueleto/scripts/instalar.mjs --alvo projetos-pessoais/<nome> --trilha app|pagina [--primaria #hex --fundo #hex --texto #hex] [--fonte sistema|<arquivo>] [--sem-banco]
```

- As cores e a fonte são as da entrevista. **Sem elas** (resposta 6 "ainda não
  tem"), o projeto nasce neutro.
- **Recusou uma cor**: nada foi escrito. A sugestão volta para você como
  pergunta, e o comando roda de novo com a sua escolha.
- Resposta 10 "não": `--sem-banco`.

Depois, com rede, dentro do projeto (pelo caminho, nunca com `cd` no comando):

```bash
npm --prefix projetos-pessoais/<nome> install
npm --prefix projetos-pessoais/<nome> exec -- shadcn add --yes --cwd projetos-pessoais/<nome> button input textarea label field alert card separator empty skeleton
node .claude/skills/novo-projeto/esqueleto/scripts/instalar.mjs --pisos projetos-pessoais/<nome>
git -C projetos-pessoais/<nome> add -A
npm --prefix projetos-pessoais/<nome> run portao
```

**Portão verde, e a `/vitrine` aberta no navegador** (Playwright MCP) a 1280 e
a 390, no claro e no escuro, antes de mostrar. É a primeira página que você
vê: os componentes na marca que você escolheu.

O que o esqueleto instala, o que ele garante e como se mantém estão em
`.claude/skills/novo-projeto/esqueleto/LEIA-ME.md`.

---

## Passo 7 · Primeiro commit e resumo

O primeiro commit fecha a criação (commit é livre pela regra do `CLAUDE.md`).
É o único commit que vai com `add -A`, porque o índice do repositório novo é
só desta criação e o `.gitignore` veio do Passo 3:
`git -C projetos-pessoais/<nome> add -A`, o
`git -C projetos-pessoais/<nome> status --short` lido para ver que nada de
`node_modules/` nem `.env` entrou, e o commit, com a mensagem dizendo o que o
projeto é.

```
Projeto criado: projetos-pessoais/[nome]/

✓ CLAUDE.md, com a marca e a régua de isolamento
✓ briefing.md, [N] campos preenchidos, [N] como "a definir"
✓ Subpastas: [lista, ou "nenhuma, o projeto não pediu"]
✓ .gitignore próprio, git init e o primeiro commit
✓ [se tem site ou app] O esqueleto: marca [nova | neutra], portão verde,
  a /vitrine vista a 1280 e a 390

Falta: o remoto no GitHub (quando você tiver a URL deste projeto).
```

---

## Regras

- **Uma porta só.** Criar projeto pessoal é esta skill, do começo ao fim
- **A marca sai da entrevista.** A do workspace só entra com `--marca casa`,
  quando você pedir e tiver montado a marca de web em `identidade/web/` <!-- caminho futuro: só existe se você a montar -->
- **Esta pasta não mantém lista de projetos.** Não escrever o projeto novo em
  `projetos-pessoais/README.md` nem no `CLAUDE.md` da raiz. Quem responde o que
  existe é o `ls`
- **Cliente não entra aqui.** Na dúvida entre projeto e cliente, perguntar
- **Só as subpastas que as entregas pediram.** Nenhuma a mais, e cada uma com
  seu README de uma linha
- **`git init` e o primeiro commit, os dois**: é o commit que fecha a janela de
  cópia única, não o `init`
- **Nunca inventar resposta.** O que não veio fica `[a definir]`
- **Se o projeto já existir**, avisar e perguntar antes de tocar em qualquer
  arquivo
