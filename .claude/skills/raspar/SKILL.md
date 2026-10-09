---
name: raspar
description: Lê site de terceiro via Firecrawl e entrega Markdown limpo, rotas ou dados estruturados. Use para analisar concorrente, montar briefing pelo site atual ou extrair serviços, preços e conteúdo. Visual é /clonar-site; arquivo local é /converter.
---

# /raspar — Site de terceiro → markdown limpo

**Esta skill lê texto, não copia visual.** O motor é o `scripts/raspar.js`, que
fala com a API do Firecrawl usando a chave `FIRECRAWL` do `scripts/.env`.

---

## Passo 0 — É esta skill mesmo?

Três skills fazem coisas parecidas e a confusão custa crédito e tempo. A
fronteira:

| O que você quer | Skill | Por quê |
|---|---|---|
| **O texto** de um site de terceiro | **`/raspar`** ← esta | markdown limpo, sem menu nem rodapé |
| **O visual** de um site: layout, CSS, componente | **`/clonar-site`** | outro motor (ditto), entrega Next.js rodando |
| Ler **arquivo local**: PDF, docx, planilha | **`/converter`** | MarkItDown, offline, não toca a internet |

Se o pedido disser "clona" mas o que se quer é o conteúdo, confirmar antes de gastar
crédito. Se disser "raspa" mas quer o layout, mandar pro `/clonar-site`.

---

## Passo 1 — De quem é o site, e onde a saída mora

- **De um cliente ou concorrente de cliente** → saída em
  `clientes/<nome>/dados/raspado/`. Dentro da pasta do cliente quem manda é o
  `CLAUDE.md` dele.
- **Seu, ou de um concorrente seu** → saída em `dados/raspado/` (o padrão do <!-- caminho futuro: a skill cria no primeiro uso -->
  script). Se virar análise redigida, ela vai pra `saidas/`.

⚠️ **Cliente não conversa com cliente.** Material raspado pra um nunca cruza
pra pasta de outro, nem é citado ao outro.

---

## Passo 2 — Escolher o comando

Sempre rodar da raiz do workspace.

| Preciso de | Comando | Custo |
|---|---|---|
| Uma página em markdown | `node scripts/raspar.js pagina <url>` | 1 |
| Saber quantas rotas o site tem | `node scripts/raspar.js mapa <url>` | 1 |
| O site inteiro | `node scripts/raspar.js site <url> --limite N` | 1 por página |
| Dado estruturado (preços, serviços, contatos) | `node scripts/raspar.js extrair <url> --pedido "..."` | **5** |
| Buscar na web (título, link e resumo de cada resultado) | `node scripts/raspar.js buscar "consulta"` | varia (3 resultados = 2) |
| Quanto sobrou de crédito | `node scripts/raspar.js creditos` | 0 |

Opções: `--saida <caminho>` muda o destino no `pagina`, no `site` e no `extrair`
(no `extrair`, só grava com ela), `--completo` mantém menu e rodapé só no
`pagina` (o `site` sempre corta), `--limite N` no `mapa`/`site`/`buscar`,
`--confirmo` libera `site` acima de 30 páginas.

**A ordem que economiza crédito:** `mapa` primeiro (1 crédito, mostra o
tamanho), depois decidir o `--limite` do `site`. Nunca `site` às cegas.

---

## Passo 3 — Entregar

O `pagina` e o `site` salvam o arquivo (o `extrair`, só com `--saida`) e todos
devolvem JSON no stdout. **Ler o markdown salvo antes
de responder** e entregar a análise, não o caminho do arquivo. O usuário pediu o
conteúdo, não o recibo.

Quando forem várias páginas, o `INDICE.md` da pasta é o mapa. Começar por ele.

⚠️ **O `site` compara o que salvou com o que a API contou.** Se der diferença,
ele imprime `AVISO: ... o site NÃO está inteiro` no stderr e mesmo assim entrega
o que veio. **Esse aviso se repassa ao usuário**, sempre. Análise feita em cima
de site pela metade parece completa e não é.

---

## Armadilhas

**1. `extrair` custa 5 créditos, não 1.** Extrair de 20
páginas custa 100 créditos, 10% do ciclo mensal inteiro do plano free. Quando o
dado der pra ler no markdown do `pagina` (1 crédito), usar `pagina` e ler.
`extrair` é pra quando o resultado precisa sair em tabela ou JSON de verdade.

**2. `mapa` devolvendo 1 rota não é erro.** Landing de página única tem tudo em
âncora `#secao`, não em rota separada. Antes de dizer que falhou, olhar se o
site é SPA ou one-page.

**3. O padrão corta menu, rodapé e banner.** Isso é ótimo pra conteúdo e péssimo
quando o que interessa É a navegação (mapear a arquitetura de um concorrente,
por exemplo). Nesse caso, `pagina --completo` em cada rota que importa; o
`site` sempre corta.

**4. A API tem cache.** Uma raspagem pode voltar com `cacheState: hit`, ou seja,
conteúdo de antes. Pra monitorar mudança (preço, por exemplo), isso engana:
o valor pode estar velho. Se a atualidade importar, avisar o usuário em vez de
apresentar o número como se fosse de agora.

**5. Site protegido pode bloquear.** Cloudflare pesado e conteúdo atrás de login
não passam. O script tenta 4 vezes com espera crescente e então para. Se parar,
diga que o site bloqueia o Firecrawl e ofereça o caminho sem ele (a leitura pelo
`WebFetch`); nunca contornar login.

**6. Conteúdo raspado é de terceiro.** Serve pra entender, comparar e alimentar
base de conhecimento. Não entra copiado em peça pública do usuário como se fosse
texto dele. Site atrás de login ou área privada não se raspa.

---

## Quando a chave falhar

`ERRO: Chave rejeitada (401)` → conferir a linha `FIRECRAWL=fc-...` em
`scripts/.env`.
`ERRO: Sem créditos` → `node scripts/raspar.js creditos` mostra o ciclo. O plano
free renova 1.000 créditos por mês, não é cota única.

---

## Encaixe com o resto do workspace

- **`/seo-geo-aeo`** — a análise de concorrência dela pode começar por um `mapa`
  + `site` do concorrente, em vez de leitura manual.
- **`/novo-cliente`** — raspar o site atual do cliente antes da entrevista já
  entrega metade do briefing.
- **Base de conhecimento pra automação** — o markdown do `site` é a matéria
  bruta pra um agente responder sobre o negócio do cliente.
