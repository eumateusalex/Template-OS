---
name: salvar
description: >
  Salva o trabalho no GitHub (commit + push), detectando sozinho qual dos repositórios
  aninhados é o alvo. Use quando o usuário disser "salvar", "salva no github", "commit",
  "push", "/salvar" ou pedir backup do trabalho.
---

# /salvar: salvar no GitHub

Uma função só: garantir que o trabalho esteja salvo no GitHub, no repositório
certo.

## 🚨 Antes de tudo: descobrir QUAL repositório

Este workspace **não é um repositório só.** São vários, aninhados, e mandar o
commit pro errado é o modo de falha mais caro daqui.

**Rodar `git rev-parse --show-toplevel` a partir da pasta em que o trabalho
aconteceu.** Ele responde qual repositório manda ali. Nunca assumir a raiz.

| Onde o trabalho aconteceu | Repositório alvo |
|---|---|
| `clientes/<nome>/...` | O daquele cliente, e só ele |
| `projetos-pessoais/<nome>/...` | O daquele projeto, e só ele |
| Qualquer outro lugar | A raiz do workspace |

⚠️ **`clientes/*` e `projetos-pessoais/*` estão no `.gitignore` da raiz, de
propósito.** Se o commit for feito na raiz achando que salvou o cliente, ele
passa, o push passa, e o trabalho do cliente **não foi salvo em lugar nenhum**.
Não dá erro. Confirmar o `--show-toplevel` antes de qualquer `git add`.

⚠️ **Nunca `git add` de um repositório de dentro de outro.** Um por vez, e
sempre pelo caminho (`git -C <repo> ...`), sem `cd`.

## Workflow

### Primeira vez naquela pasta (repositório não inicializado)

Detectar com `git rev-parse --is-inside-work-tree`. Se falhar:

1. **Descobrir o remoto daquela pasta.** Os já conhecidos estão na seção
   "Repositórios" de `_memoria/ferramentas.md`: consultar lá antes de
   perguntar, e registrar lá (pelo `/memoria registrar`) quando o usuário
   responder.

   Pasta que não está na tabela: perguntar se já existe repositório no GitHub
   ou se cria agora. **Sempre privado**, a menos que o usuário diga o contrário.

2. `git init` → `git add <caminhos>` → **ler o `git status` antes do commit** →
   `git commit` → `git branch -M main` → `git remote add origin <URL>` →
   `git push -u origin main`.

   ⚠️ **Ler o `git status` antes do primeiro commit não é formalidade.** É a
   única chance de pegar `node_modules/`, `dist/` ou `.env` entrando por
   `.gitignore` faltando ou errado. Se aparecer arquivo demais, **parar** e
   arrumar o `.gitignore` primeiro. Depois do push é conserto de histórico.

   A exceção ao stage por caminho é o primeiro commit do repositório que o
   `/novo-projeto` ou o `/novo-cliente` acabou de criar: o índice é só dele e o `.gitignore` veio
   do esqueleto, então vai com `git add -A`, depois de ler o `git status`.

3. Se o repositório ainda não existir no GitHub e o `gh` estiver instalado:
   `gh repo create <nome> --private --source=. --push`. Sem o `gh`, o usuário
   cria em github.com/new e volta com a URL.

### Commits seguintes

1. `git status`. Sem mudança, responder "tudo sincronizado" e parar.

2. Escrever a mensagem a partir do que mudou: o que saiu ou entrou e por quê.
   Se o usuário ditou a mensagem, vale a dele; não se pergunta.

3. **Só os caminhos deste trabalho.** Arquivo que outra sessão mexeu não entra:
   com sessões em paralelo no mesmo workspace, o `git status` mostra o trabalho
   delas também, e ele fica de fora.

4. `git add <caminhos>` (stage por caminho, **nunca `git add .` nem `-A`**) →
   `git diff --cached --stat`, **lido como parada**, num comando separado,
   nunca na mesma linha do commit → `git commit -F - -- <caminhos>`, com a
   mensagem pela entrada padrão. O índice é compartilhado entre sessões: o
   commit que leva os caminhos no próprio comando grava só eles, mesmo que outra
   sessão tenha posto algo no índice nesse meio-tempo. Diff muito maior que a
   edição denuncia fim de linha ou mão alheia (`git diff --cached -w --stat`
   separa os dois).

5. A conferência de visibilidade da seção abaixo, se o repositório tem
   `_memoria/`, e a de deploy, se o push publica. Depois, `git push`. Commit de
   outra sessão na frente do seu, ainda sem push, espera por ela: empurrar o
   trabalho dela é decisão dela.

6. Confirmar com o link, extraído de `git remote get-url origin`.

## 🚨 Repositório com a memória: confira se ele é público ANTES do push

A raiz do workspace versiona a `_memoria/`, que é dado do negócio. Antes de
empurrar um repositório que tem `_memoria/` rastreada
(`git ls-files _memoria | head -1` devolve algo), confira a visibilidade pela
máquina, nunca de cabeça:

```bash
gh repo view --json visibility -q .visibility        # PUBLIC, PRIVATE ou INTERNAL
```

Sem o `gh`, a API do GitHub responde sem login só para repositório público:

```bash
curl -s -o /dev/null -w "%{http_code}" https://api.github.com/repos/<dono>/<repo>
# 200 = público; 404 = privado ou inexistente
```

**Público: não empurre.** Diga ao usuário que a memória do negócio dele ficaria
aberta na internet, e ofereça dois caminhos: tornar o repositório privado
(`gh repo edit --visibility private`, que ele confirma) ou criar um repositório
privado novo e trocar o remoto. `git remote -v` sozinho não diz nada sobre isso:
o endereço de um repositório público e o de um privado têm a mesma cara.

## ⚠️ Pasta com deploy automático: o push publica

Se a pasta alvo estiver ligada a um serviço que builda e sobe a cada push
(Vercel, Netlify, Coolify, Cloudflare Pages, uma action de deploy), **o push
não é backup: é publicação**, sem homologação no meio. Trabalho vai para o
remoto quando está pronto, não quando está salvo.

Como reconhecer, antes de empurrar:

- o `CLAUDE.md` daquela pasta diz que ela está em produção
- existe `vercel.json`, `netlify.toml`, `.github/workflows/deploy*` ou similar
- a coluna "Publica no push?" da seção "Repositórios" de
  `_memoria/ferramentas.md` diz que sim

Nesses casos: **ler o `CLAUDE.md` do projeto, rodar o build local antes do
push** (`npm run build` ou o comando que aquele projeto usa) **e avisar o
usuário de que o push publica.** Trabalho que ainda não está pronto fica
commitado e sem push.

## Regras

- As regras de git do workspace (commit e push livres por bloco fechado, push
  que alcança terceiro, o git que pede aprovação) moram no `CLAUDE.md` da raiz;
  dentro de um projeto ou cliente, vale também a regra do `CLAUDE.md` dele
- Nunca `--force` sem o usuário pedir com essas palavras
- Push recusado por divergência: avisar e oferecer `git pull --rebase`. **Nunca
  resolver com force**
- `user.name` e `user.email` não configurados: perguntar e configurar
