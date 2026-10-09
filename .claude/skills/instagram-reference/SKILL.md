---
name: instagram-reference
description: Pipeline que recebe link(s) de vídeo do Instagram (ou processa a fila de stubs com Status "Novo" no Notion), baixa, transcreve, traduz, classifica e cadastra no Banco de Referências + gera roteiros prontos para gravar nas Ideias de Conteúdo. Use quando o usuário mandar um ou mais links do Instagram pedindo para "transcrever", "processar esse save", "rouba essa ideia", "pega ideia desse conteúdo", ou quando pedir "processa os 'Novo'" da fila.
---

# Pipeline de Referências do Instagram

Ao ser invocado, anuncie: **"Rodando o pipeline de Referências do Instagram."**

Esta é a **ETAPA 2** de um pipeline de duas. A ETAPA 1
(`instagram-saved-scanner`) varre os Salvos e cria stubs (`Status: "Novo"`) no
Banco de Referências. Esta processa tanto esses stubs quanto links avulsos.

**As 5 fases, por vídeo:** entrada (0) → extração (1-3) → análise (4, define o
**modo**) → cadastro (5) → geração (6-7) → fechamento (8-10).

Tudo é automático — **não pedir aprovação por vídeo**. O usuário filtra depois
pelo campo **Potencial**.

## Abrir só quando precisar

| Arquivo | Quando |
|---|---|
| `referencias/templates.md` | Passos 4, 5 e 7: o corpo das páginas e os dois formatos fixos |
| `referencias/quando-falha.md` | Só se o download ou a transcrição der erro |

---

## Setup — leia antes de processar

🚨 **Este pipeline exige montagem prévia** (dois bancos no Notion, dois MCPs e o
yt-dlp). Se for a primeira vez, o passo a passo completo está em
[`marketing/instagram/README.md`](../../../marketing/instagram/README.md).

De `marketing/instagram/config.md`: `notion_banco_referencias_id`,
`notion_ideias_conteudo_id`, `content_path`, `temp_path`.

**Se algum ID ainda estiver com valor de placeholder, pare** e diga exatamente
o que falta:

> "O `marketing/instagram/config.md` ainda está com `<placeholder>`. O passo a
> passo pra criar os bancos no Notion e pegar os IDs está no
> `marketing/instagram/README.md`. Quer que eu te guie por ele agora?"

**Não tente adivinhar valores, e não crie os bancos por conta própria** — banco
no Notion é estrutura do usuário, não do sistema.

Em seguida, leia **obrigatoriamente**:

- `marketing/instagram/editorial-framework.md` — linha editorial, formatos,
  tipos de gancho, CTAs, nicho
- `marketing/instagram/voice-model.md` — tom de voz, estrutura de roteiro,
  exemplos de vídeos que funcionaram
- `_memoria/escrita-publica.md` e `_memoria/empresa.md` — tom geral e contexto

Guiam a classificação (passo 4) e os roteiros (passo 7).

🚨 **Em conflito, quem manda no TOM é sempre o `_memoria/escrita-publica.md`** — o
teste, a régua de ouro e a lista do que evitar. O `voice-model.md` manda só no que
é **específico de roteiro**: estrutura de gancho, ritmo de fala, CTA falado.

> A régua de tom mora num arquivo só. Se o `voice-model.md` repetir uma regra
> de tom, ela sai de lá: com a mesma regra em dois arquivos, quando um é
> corrigido e o outro não, o errado continua mandando.

---

## 0 · Checagem de duplicidade

Antes de baixar, procurar a URL na tabela de
`marketing/instagram/processed-videos.md`:

| Situação | O que fazer |
|---|---|
| URL **não está** na tabela | Referência nova: segue pro passo 1; no passo 5, cria página |
| Está, e a página vinculada tem `Status: "Novo"` | É stub do scanner: segue o pipeline, mas no passo 5 **completa a página existente** (`notion-update-page`) |
| Está, com `Status: "Analisado"` ou `"Virou Ideia"` | **Pula.** Não baixa, não reprocessa. Avisa ("Já processei esse antes ('<título>'), pulando.") e segue |

---

## 1 · Download

```bash
mkdir -p "marketing/instagram/.tmp"
yt-dlp "<URL>" --write-info-json --write-auto-subs --write-subs --sub-langs "en,pt,pt-BR" \
  -o "marketing/instagram/.tmp/%(id)s.%(ext)s"
```

Baixa o vídeo **e** grava os metadados em `<id>.info.json`. Extrair de lá:
`uploader_id` (→ **@ do Criador**, prefixar com `@`) e `description` (caption,
contexto extra do gancho).

⚠️ **Não usar `--dump-json`** — ele não baixa o vídeo. Se o yt-dlp falhar por
exigir login, abrir `referencias/quando-falha.md`.

## 2 · Transcrição

Em ordem de preferência:

1. **Legenda baixada no passo 1** (caminho padrão). Se veio `.vtt`/`.srt` na
   `.tmp/`, ela **é** a transcrição — limpar os timestamps e usar
2. **`scripts/transcrever.py`** — faster-whisper offline, o `.mp4` já está na
   `.tmp/`. GPU quando há (~20x tempo real)
3. **Ferramentas de vídeo do ambiente**, se existirem — servem pro elemento
   visual, não pra transcrição
4. **Manual** — só se os três acima falharem: pedir ao usuário pra colar

Aproveitar o `description` do `.info.json` como contexto do gancho.

**Sem fala alguma** (meme, lifestyle, ação sem narração) → marcar como modo
**"Sem fala"**, que muda os passos 5, 6 e 7.

## 3 · Tradução

Traduzir para português, sem ferramenta externa. Manter tom e adaptar gírias ao
público brasileiro quando fizer sentido.

---

## 4 · Classificação

**Primeiro, determinar o modo** — ele rege os passos 5, 6 e 7:

| Modo | Quando se aplica |
|---|---|
| **Sem fala** | A transcrição veio vazia — o vídeo é só visual/ação |
| **Viral** | A `Coleção Salvos` do stub é uma coleção de virais, **ou** o link foi mandado direto pelo usuário (sem stub) |
| **Padrão** | Qualquer outro caso |

Com base no `editorial-framework.md` e no `voice-model.md`, preencher:

| Campo | Instrução |
|---|---|
| Objetivo | Viral / Útil / Vendas — conforme linha editorial |
| Formato de Produção | Conforme os formatos do `editorial-framework.md` |
| Gancho Identificado | Formato fixo em `referencias/templates.md` |
| Tipo de Gancho | Conforme os tipos do `editorial-framework.md` |
| CTA Identificada | Texto livre; "Nenhuma" se não houver |
| Idioma Original | Inglês / Português / Outro |
| Potencial | Alto / Médio / Baixo — alinhamento com o nicho e replicabilidade |
| Por que | Formato fixo (3 critérios + bônus) em `referencias/templates.md` |

---

## 5 · Cadastro no Banco de Referências

**Stub encontrado no passo 0** → `notion-update-page` na página existente.
**Referência nova** → `notion-create-pages` com
`parent: {type: "data_source_id", data_source_id: "[notion_banco_referencias_id]"}`.

Propriedades: Título · URL do Vídeo · @ do Criador · Transcrição Original ·
Objetivo · Formato de Produção · Gancho Identificado · Tipo de Gancho · CTA
Identificada · Idioma Original · Potencial · Por que · `Status: "Analisado"` ·
Data de hoje.

**O corpo da página está em `referencias/templates.md`** (varia por modo).
Guardar a URL da página criada/atualizada — o passo 7 precisa dela.

---

## 6 · Quantos roteiros

Gerar **sempre, independente do Potencial** — esse campo só serve pro usuário
filtrar depois.

| Modo | Quantidade e tipo |
|---|---|
| **Sem fala** | 1 — conceito visual adaptado ao cenário do usuário, sem inventar falas que o vídeo não tinha |
| **Viral** | 2 — Ideia 1: o mesmo gancho, ritmo e condução do original, num tema do usuário; Ideia 2: a adaptação livre na voz do usuário |

**Roteiro nunca é a fala do original.** A transcrição e a tradução do passo 3
servem para ler e classificar a referência; o roteiro leva a **estrutura** (o
tipo de gancho, o ritmo, a condução, o formato, o tipo de CTA) com o tema, os
exemplos e as frases do usuário. Frase do vídeo de outra pessoa, traduzida ou
não, não entra no roteiro.
| **Padrão** | 3 — Ideia 1: mesmo formato e objetivo do original; Ideias 2 e 3: objetivos diferentes (ex: original Útil → trazer uma Viral e uma Vendas) |

**Tema fora do nicho:** manter estrutura, gancho e condução, mas **trocar o
tema** pelo cenário do usuário (conforme `editorial-framework.md`). Registrar a
adaptação no item 4 (bônus) do "Por que".

## 7 · Roteiros nas Ideias de Conteúdo

Uma página em `[notion_ideias_conteudo_id]` por roteiro, com as propriedades:

Título da Ideia · Hook (resumo curto do gancho principal) · Formato de Produção
· Objetivo (Viral/Útil/Vendas) · Etapa do Funil (Topo/Meio/Fundo) · CTA
Sugerida (resumo curto) · `Status: "Ideia"` · **Referência** (relação apontando
para a página do passo 5).

**O corpo de cada página está em `referencias/templates.md`** — três moldes, um
por modo/tipo.

---

## 8-10 · Fechamento

8. Atualizar a página do Banco de Referências para `Status: "Virou Ideia"`
9. **Só se o passo 5 criou página nova**, acrescentar uma linha em
   `marketing/instagram/processed-videos.md` (Data · Título · URL · Página
   Notion). Stub atualizado já está registrado — não duplicar
10. Remover da `.tmp/` os arquivos daquele vídeo (`.mp4` e `.info.json`). Não
    remover a pasta nem nada fora dela

> Pode remover direto, sem quarentena: `.tmp/` é download regenerável (o vídeo
> continua no Instagram), não trabalho. É a exceção prática da regra "descarte
> via `lixeira/`": material baixado de fora não precisa de quarentena.
>
> Nada no workspace trava deleção de arquivo, então este comando passa direto
> — **e é por isso que a exceção precisa estar escrita**: sem a trava, quem
> decide o que é regenerável é quem lê esta linha.

---

## Múltiplos vídeos

Processar um por um. Ao final, um resumo em tabela:

| Título | Potencial | Nº de roteiros | Link Notion |
|---|---|---|---|
