---
name: instagram-saved-scanner
description: Varre coleções de "Salvos" do Instagram e registra os posts ainda não cadastrados como itens "Novo" (fila) no Banco de Referências do Notion, prontos para serem processados depois pela skill instagram-reference. Use quando o usuário pedir "varrer os salvos", "ver o que tem de novo nos salvos", "puxar os saves novos da pasta X", "fazer a varredura dos salvos" ou similar.
---

# Varredura dos Salvos do Instagram

Ao ser invocado, anuncie: **"Rodando a varredura dos Salvos do Instagram."**

⚠️ **Ela NÃO baixa, NÃO transcreve e NÃO classifica. Só enfileira.** O
processamento pesado é da etapa 2.

## Visão geral

Esta skill é a ETAPA 1 de um pipeline de 2 etapas:

1. **`instagram-saved-scanner`** (esta skill) — varre as coleções de Salvos pedidas, identifica posts ainda não cadastrados e cria um "stub" (`Status: "Novo"`) no Banco de Referências para cada um. Não baixa, não transcreve, não classifica.
2. **`instagram-reference`** — processa de fato os itens com `Status: "Novo"` (download, transcrição, classificação, geração de roteiro), completando a página existente em vez de criar uma nova.

Isso permite varrer os salvos pra ver o que tem de novo, revisar a fila no Notion (filtrando por `Status = Novo`), e só depois pedir para processar.


## Setup — leia antes de rodar

🚨 **Este pipeline exige montagem prévia** (um banco no Notion, dois MCPs). Se
for a primeira vez, o passo a passo completo está em
[`marketing/instagram/README.md`](../../../marketing/instagram/README.md).

Leia `marketing/instagram/config.md` para obter:

- `instagram_username` — conta do Instagram a varrer
- `notion_banco_referencias_id` — ID do database Banco de Referências
- `content_path` — pasta dos arquivos de contexto (padrão: `marketing/instagram`)

**Se algum campo ainda estiver com o valor de placeholder** (`SEU_USUARIO_AQUI`,
`ID_DO_BANCO_DE_REFERENCIAS_AQUI`), pare e diga exatamente o que falta:

> "O `marketing/instagram/config.md` ainda está com `<placeholder>`. O passo a
> passo pra criar o banco no Notion e pegar o ID está no
> `marketing/instagram/README.md`. Quer que eu te guie por ele agora?"

**Não tente adivinhar valores, e não crie o banco por conta própria** — banco no
Notion é estrutura do usuário, não do sistema.

### Notion — IDs

Use o `notion_banco_referencias_id` lido do `config.md`.

Propriedades relevantes para esta skill: `Título` (title), `URL do Vídeo` (url),
`Status` (select — usar `"Novo"`), `Coleção Salvos` (select — os nomes das
coleções de Salvos do usuário; se ele pedir uma coleção com nome ainda não
cadastrado, adicione a opção via `notion-update-data-source` **antes** de criar
os stubs, senão a escrita falha), `Data` (date).

O esquema completo dos dois bancos está em
[`marketing/instagram/README.md`](../../../marketing/instagram/README.md).

### Login no Instagram

Esta skill usa o **Playwright MCP** para navegar no Instagram.

🚨 **Nunca digitar, pedir ou armazenar a senha do usuário.** Se a sessão não
estiver logada (o snapshot mostra a tela de login), avise e peça para ele logar
**ele mesmo**, na janela do navegador que já está aberta. Só prossiga depois que
ele confirmar.

> **Por que assim:** o login fica na sessão do navegador do Playwright, não no
> repositório e não no chat. Credencial que passa pelo chat vira credencial em
> transcrição, e transcrição é backup.


## Passo a passo

### 1. Identificar as coleções pedidas

Navegue para `https://www.instagram.com/[instagram_username]/saved/` e tire um snapshot. A página lista os links de cada coleção de Salvos.

Encontre o(s) link(s) correspondentes ao(s) nome(s) que o usuário pediu (case-insensitive). Se ele não especificar nenhuma coleção, pergunte quais ele quer (não varra "All posts" nem coleções não relacionadas a conteúdo, a menos que ele peça explicitamente).

### 2. Varrer cada coleção

Para cada coleção identificada:

1. Navegue para a URL da coleção.
2. Tire um snapshot e extraia todos os links `/p/<código>/` ou `/reel/<código>/`, junto com o texto alternativo (alt text/caption) de cada um — isso vira a base do título do stub.
3. Role a página (`browser_evaluate` com `window.scrollTo` ou `Page.Down`) e tire novo snapshot. Repita até não aparecerem links novos (ou até um limite de ~10 iterações para evitar loop infinito em coleções muito grandes — avise o usuário se atingir o limite).
4. Monte a URL completa de cada post: `https://www.instagram.com/p/<código>/`.

### 3. Checar duplicidade

Para cada URL encontrada, verifique se ela já está em `marketing/instagram/processed-videos.md`.

- Se **já estiver** na tabela: pular (já existe página no Notion para essa URL).
- Se **não estiver**: é um post novo, segue pro próximo passo.

### 4. Criar o stub no Notion

Para cada URL nova, extraia um título curto a partir do alt text/caption do post:

- Pegue a primeira frase ou ~80 caracteres do texto, limpando ruído (remova prefixos genéricos tipo "Photo by X on Y. May be...", mantenha a parte que descreve o conteúdo).
- Se não houver nenhum texto útil, use `"Save sem legenda — <código do post>"`.

Crie a página no Banco de Referências (`notion-create-pages`, `parent: {type: "data_source_id", data_source_id: "[notion_banco_referencias_id]"}`) com:

- **Título**: o título extraído acima
- **URL do Vídeo**: a URL do post
- **Status**: `"Novo"`
- **Coleção Salvos**: nome da coleção de onde veio
- **Data**: hoje

Não preencha as demais propriedades — isso é trabalho da `instagram-reference`.

### 5. Registrar no índice local

Para cada stub criado, adicione uma linha em `marketing/instagram/processed-videos.md`:

| Data | Título | URL | Página Notion |
|---|---|---|---|
| <hoje> | <título extraído> | <URL do post> | <link da página criada> |

### 6. Resumo final

Apresente um resumo agrupado por coleção:

**Coleção: [nome]** (N novos)

| Título | URL | Notion |
|---|---|---|
| ... | ... | ... |

Ao final, lembre o usuário que ele pode pedir "processa os 'Novo' da pasta X" (ou "processa tudo que tá novo") para a `instagram-reference` rodar o pipeline completo nesses itens.
