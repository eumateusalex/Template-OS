---
name: novo-cliente
description: >
  Cria a pasta de um cliente em `clientes/<nome>/`, com CLAUDE.md, briefing,
  subpastas padrão e Git próprio, depois de uma entrevista curta; com
  diagnóstico ou consultoria contratados, abre também `consultoria/`. Use para
  "novo cliente", "cliente novo", "/novo-cliente", "fechei com [nome]",
  "começar um projeto pra [cliente]" ou para estruturar trabalho de terceiro.
---

# /novo-cliente — Pasta de cliente novo, com contexto isolado

Cada cliente é um projeto de terceiro: nicho, marca e público diferentes dos do
usuário. Esta skill cria a pasta em `clientes/<nome>/` com o esqueleto padrão, a
fronteira de marca embutida e Git próprio desde o primeiro dia.

**Antes de começar, ler `clientes/README.md`.** É lá que moram as quatro regras
da pasta, e esta skill é a aplicação delas.

---

## Passo 1 — Entrevista (7 perguntas)

1. "Qual o nome do cliente?"
2. "Qual o nicho ou ramo de atuação?"
3. "Qual o objetivo principal com esse projeto? (uma frase)"
4. "Quem é o público desse cliente?"
5. "Que serviços estão contratados? (site, identidade visual, redes sociais,
   SEO, Google Meu Negócio, Ads — pode ser mais de um)"
6. "Qual o contato do cliente? (nome de quem decide, WhatsApp ou email)"
7. "Ele contratou diagnóstico ou consultoria?" (sim ou não; com sim, a pasta
   nasce com `consultoria/`, no passo 3)

Se o usuário já tiver dado parte disso antes de rodar a skill, não perguntar de
novo: confirmar e preencher o resto.

Resposta que não vier fica `[a definir]` no arquivo. **Nunca inventar.**

---

## Passo 2 — Nome da pasta

`clientes/<nome-do-cliente>/`, em minúsculas, espaços viram hífen, sem acento
(evita atrito em comando de shell e de git).

Se já existir pasta com esse nome, **parar e perguntar** se é pra continuar nela
ou criar com sufixo. Nunca sobrescrever arquivo existente.

---

## Passo 3 — Esqueleto padrão

Criar sempre a mesma estrutura, seja qual for o nicho ou o serviço contratado:

```
clientes/<nome-do-cliente>/
  CLAUDE.md
  briefing.md
  .gitignore
  identidade-visual/README.md
  site/README.md
  marketing/README.md
  seo-ads/README.md
  saidas/README.md
  dados/README.md
```

⚠️ **Cada subpasta nasce com um README de uma linha, e isso não é enfeite.** O
Git não versiona pasta vazia: sem o README, a estrutura some no primeiro clone e
o esqueleto padrão vira promessa. Uma linha basta:

| Pasta | Linha do README |
|---|---|
| `identidade-visual/` | A marca do cliente: cores, fontes, logo. |
| `site/` | O código do site do cliente. |
| `marketing/` | Redes sociais e conteúdo do cliente. |
| `seo-ads/` | Pesquisa SEO, Google Meu Negócio e campanhas. |
| `saidas/` | Relatórios e documentos entregues ao cliente. |
| `dados/` | Material bruto recebido do cliente. Não versiona. |

`.gitignore` do cliente, próprio e independente do da raiz:

```gitignore
node_modules/
dist/
build/
.env
.env.*
!.env*.example
dados/*
!dados/README.md
.DS_Store
Thumbs.db
```

### Com diagnóstico ou consultoria (pergunta 7 = sim): `consultoria/`

A pasta ganha também `consultoria/`, onde moram o diagnóstico e o
acompanhamento. A árvore, a cópia dos modelos com o nome do cliente e a troca
dos caminhos estão na seção "Abrir a pasta" de
`.claude/skills/consultoria/SKILL.md`, e se seguem de lá, sem copiar a regra
para cá. O método fica no workspace, fora do Git do cliente, de propósito; os
modelos copiados versionam no Git do cliente, e o material cru continua em
`dados/`, que não versiona.

Com a pergunta 7 = não, nada disso entra. Se o cliente contratar depois, a
mesma seção da `/consultoria` abre a pasta.

---

## Passo 4 — `CLAUDE.md` e `briefing.md`

### `CLAUDE.md` do cliente

```markdown
# [Nome do cliente]

> Pasta criada em [data, DD/MM/AAAA]. **As instruções daqui sobrescrevem as da raiz** dentro
> desta pasta.

## Sobre

[resposta 3]

## Nicho

[resposta 2]

## Público

[resposta 4]

## Serviços contratados

- [serviço 1]
- [serviço 2]

## Contato

[resposta 6]

## Fronteira de marca

Este projeto é de um cliente. Identidade visual, tom de voz e público aqui são
os **dele**, nunca os da casa. Cores, fontes e voz vêm do briefing e da
`identidade-visual/` desta pasta.

## Isolamento

**Este cliente não se conversa com nenhum outro.** Nada cruza entre pastas de
cliente: nem copy, nem carrossel, nem palavra-chave, nem base de lead, nem
preço, nem referência visual. Nenhum outro cliente é citado aqui, e este nunca é
citado em outro.

Cada decisão se toma só pelo que serve a este cliente, ignorando o que existe
nas outras pastas.

## Onde salvar o que

- Briefing e contexto: na raiz desta pasta
- Marca do cliente: `identidade-visual/`
- Site: `site/`
- Redes sociais e conteúdo: `marketing/`
- SEO, GMB, Ads: `seo-ads/`
- Relatórios e entregas: `saidas/`
- Material bruto recebido: `dados/`
- Diagnóstico e acompanhamento: `consultoria/`

## A marca do que o usuário entrega

A exceção à fronteira de marca: proposta, devolutiva e relatório do diagnóstico
são do usuário como consultor, e levam a marca dele (a do
`identidade/design-guide.md` da raiz), gravando em `saidas/` desta pasta. Peça,
site e conteúdo do cliente continuam com a marca do cliente.

## Específico deste cliente

[Vazio. Preencher com o que valer só para este cliente, conforme aparecer.]
```

**Com a pergunta 7 = não**, a linha de `consultoria/` em "Onde salvar o que" e a
seção "A marca do que o usuário entrega" saem do `CLAUDE.md`; com sim, entram
como estão.

### `briefing.md`

```markdown
# Briefing — [Nome do cliente]

- **Nicho:** [resposta 2]
- **Objetivo:** [resposta 3]
- **Público:** [resposta 4]
- **Serviços contratados:** [resposta 5]
- **Contato:** [resposta 6]
- **Diagnóstico ou consultoria:** [resposta 7: sim ou não]
- **Prazos:** [a definir]
- **Entrou em:** [data, DD/MM/AAAA]
```

---

## Passo 5 — Git próprio, no mesmo dia

**Rodar `git init` dentro de `clientes/<nome>/` assim que o esqueleto existir.**
É repositório aninhado, e é assim que tem que ser: o `.gitignore` da raiz exclui
`clientes/*`, então nada de cliente entra no repositório pessoal.

Depois do `git init`, **o primeiro commit**, com a mensagem dizendo o que o
cliente é: é ele, e não o `init`, que fecha a janela de cópia única. É o único
commit que vai com `git -C clientes/<nome> add -A`, porque o índice do
repositório novo é só desta criação; antes do commit, o
`git -C clientes/<nome> status --short` lido para ver que nada de `dados/` nem
`.env` entrou. O push espera (ver as Regras).

> **Por que isto é passo e não sugestão:** esperar a URL do GitHub para iniciar
> o Git deixa o cliente em cópia única; repositório local não depende de URL e
> fecha essa janela na hora.

O **remoto** é outra conversa: entra quando o usuário informar a URL daquele
cliente. Até lá o histórico local já protege o trabalho.

---

## Passo 6 — Resumo

```
Pasta criada: clientes/[nome]/

✓ CLAUDE.md — com a fronteira de marca e a regra de isolamento
✓ briefing.md — [N] campos preenchidos, [N] como "a definir"
✓ Esqueleto: identidade-visual/, site/, marketing/, seo-ads/, saidas/, dados/
  (cada uma com README, pra sobreviver a um clone)
✓ .gitignore próprio
✓ consultoria/ com os modelos (só com diagnóstico ou consultoria)
✓ git init e o primeiro commit

Falta: o remoto no GitHub (quando você tiver a URL deste cliente).
```

---

## Regras

- **Esta pasta não mantém lista de clientes.** Não escrever o cliente novo em
  `clientes/README.md` nem no `CLAUDE.md` da raiz. Quem responde o que existe é
  o `ls`; quem responde o que cada cliente é, é o `CLAUDE.md` e o `briefing.md`
  dentro da pasta dele
- **Nunca herdar** a identidade visual nem o tom de voz da casa. A fronteira de
  marca do `CLAUDE.md` do cliente é o que vale dentro de `clientes/<nome>/`
- **`git init` e o primeiro commit, os dois.** O que fecha a janela de cópia
  única é o commit, não o `init`.
  🚨 **O push é que espera:** repositório de cliente vai ao remoto quando o
  esqueleto estiver conferido com o usuário, e onde o push é deploy (site no
  ar), só quando estiver pronto
- **Esqueleto é sempre o mesmo**, mesmo que o cliente só tenha contratado um
  serviço. Pasta extra pode entrar quando a frente pedir; nenhuma pasta padrão
  se pula
- **Nunca inventar resposta.** O que não veio na entrevista fica `[a definir]`
- **Se o cliente já existir**, avisar e perguntar antes de tocar em qualquer
  arquivo
