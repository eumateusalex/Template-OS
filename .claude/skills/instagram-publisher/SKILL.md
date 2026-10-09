---
name: instagram-publisher
description: >
  Publica post e carrossel no Instagram a partir de imagens locais (1 a 10),
  além de Reels e story, e devolve o permalink real. Também cuida da conexão:
  diagnostica, renova ou troca o token da Meta e refaz o setup do zero (o modo
  conexão). Use para "publicar no instagram", "postar esse carrossel", "renovar
  token", "configurar instagram", "instagram parou de funcionar", OAuthException
  ou /instagram-publisher.
type: script
version: "2.2.0"
script:
  path: .claude/skills/instagram-publisher/scripts/publish.js
  runtime: node
  invoke: "node {skill_path}/scripts/publish.js --images \"{images}\" --caption \"{caption}\""
env:
  - INSTAGRAM_ACCESS_TOKEN
  - INSTAGRAM_BUSINESS_ID
  - IMGBB_API_KEY
categories: [social-media, publishing, instagram]
---

# Instagram Publisher

O **motor** de publicação do workspace, e roda direto, sem intermediário. Recebe
imagens locais já prontas, hospeda no imgBB, cria os containers e publica via API
do Instagram (fluxo **Login do Instagram**, `graph.instagram.com`).

- **1 imagem** → post simples · **2-10 imagens** → carrossel
- Na cadeia: `/carrossel` cria → **esta skill publica**. A conexão (token,
  setup, conta nova) é o modo [`conexao.md`](conexao.md)

> ## 🔒 Mais de uma conta pode usar este motor, e elas nunca podem se misturar
>
> | Conta | Como chamar | Credenciais |
> |---|---|---|
> | conta principal | sem argumento | `scripts/.env` |
> | `@segunda-conta` | `--conta segunda-conta` | `scripts/.env.segunda-conta` |
>
> Contas de uma mesma pessoa costumam viver na **mesma Central de Contas** da
> Meta, então errar de conta é plausível, não teórico. O nome depois de `.env.`
> é o **username** da conta, sem arroba (um apelido reprova na trava). Antes de subir qualquer imagem, o script exige que **três pontas
> concordem**: o `--conta` pedido, o `INSTAGRAM_BUSINESS_ID` do arquivo, e o que
> a API responde ao vivo pra aquele token. Discordou, ele para antes de tocar no
> imgBB. **Falha de rede na conferência também para** — não saber em qual conta
> se publica é motivo de não publicar.
>
> **Os três scripts de mídia desta pasta**, porque o `publish.js` não é o único:
> ele publica foto e carrossel no feed, o `publish-reels.js` publica Reels e o
> `publish-story.js` publica story (a seção "Os três modos de mídia" abaixo).
>
> ⚠️ **Mexeu no `publish.js`? Rode `node .claude/skills/instagram-publisher/scripts/teste-publish.mjs`.** Ele sobe um
> servidor local que finge ser a Meta, então roda o fluxo inteiro sem chegar
> perto de conta real.
>
> ⚠️ **Se você criar uma automação que publica sozinha** (um cron, um bot), o
> procedimento dela é outro, mas **o motor continua sendo este aqui, um só**:
> tirando o `loadEnv`, que é da conta, todo o `publish.js` é motor, e copiar o
> arquivo fabricaria o bug que se corrige numa cópia e sobrevive na outra.

> **Token renova sozinho, mas com trava.** Só renova depois de ~50 dias da última
> renovação, **não a cada publicação** — assim postar várias vezes no dia não gera
> renovações repetidas no histórico da Meta, e o token nunca morre. O novo token e
> a data (`INSTAGRAM_TOKEN_REFRESHED_AT`) vão pro `scripts/.env`.
>
> 🚨 **"O token nunca morre" só vale enquanto houver publicação.** A renovação
> mora DENTRO do fluxo de publicar, então em conta parada o token envelhece até
> vencer, em silêncio, e a descoberta é o `OAuthException` da próxima tentativa.
> Por isso existe **`--so-renovar`**: confere a conta, aplica a mesma trava de 50
> dias e sai, sem imagem nem legenda; a recusa da Meta sai com erro e o motivo.
> Serve à mão ou num agendador diário (cron), e qualquer conta com `--conta`:
>
> ```bash
> node .claude/skills/instagram-publisher/scripts/publish.js --so-renovar
> ```
>
> ⚠️ **Conta que publica por automação ainda assim precisa dele**, porque a
> automação só publica em dia que tem peça na fila.

## Os três modos de mídia

São **três arquivos separados**, e a separação é de propósito: o `publish.js` é
o caminho mais rodado e pode estar sob automação. Um modo novo enfiado lá dentro
poria o caminho novo em cima do que já funciona.

| Quero publicar | Script | Chamada |
|---|---|---|
| Post ou carrossel (1 a 10 imagens) | `scripts/publish.js` | `node scripts/publish.js --images "a.jpg,b.jpg" --caption "..."` |
| **Story** (1 imagem) | `scripts/publish-story.js` | `node scripts/publish-story.js --image capa.jpg` |
| **Reels** (1 vídeo) | `scripts/publish-reels.js` | `node scripts/publish-reels.js --video peca.mp4 --caption "..."` (vai também para a grade; `--fora-da-grade` o deixa só na aba de Reels, para quem publica junto o carrossel da mesma peça) |

> **Formato:** a API de publicação do Instagram aceita **JPEG**, até 8 MB (a
> especificação de imagem da Meta), e o `/carrossel` entrega JPEG abaixo de
> 3 MB, com folga. O publicador não barra PNG (a conferência é por
> `content-type`, não por extensão), mas PNG fica fora da especificação:
> converta antes com `node scripts/para-jpeg.js`. O erro 9004/2207052 não é do
> formato: a causa e o tratamento estão na seção "Não foi possível obter a
> mídia deste URI", mais abaixo.

⚠️ **O miolo é o mesmo nos três, e vem importado do `publish.js`**: ler o `.env`,
conferir de quem é a conta, esperar o container, publicar, pegar o permalink e
renovar o token. Em especial a **trava das três pontas** — copiar isso para os
outros dois fabricaria o bug que se corrige numa cópia e sobrevive na outra.

🚨 **O Reels exige hospedagem própria.** A Meta baixa o vídeo de uma URL pública,
e o imgBB não serve vídeo. Sem `REELS_MIDIA_DIR` (a pasta que um servidor seu
serve) e `REELS_MIDIA_BASE` (a URL pública dela) no `scripts/.env`, o
`publish-reels.js` **para na hora e avisa** — de propósito, porque falhar claro
aqui é melhor que um erro genérico da API dez segundos depois.

---

## Quando NÃO usar

- Conteúdo ainda não criado → gerar o carrossel primeiro (`/carrossel`)
- Usuário ainda revisando → só depois do "pode postar" / "aprovado"
- Token expirado ou integração quebrada (`OAuthException`) → o modo conexão (`conexao.md`)

## Pré-requisitos

O `scripts/.env` (não versionado) e cada chave estão no "Estado esperado" do
`conexao.md`. Faltou a `IMGBB_API_KEY`: conta gratuita em https://api.imgbb.com/.
Faltou ou expirou o token do Instagram: o modo conexão (`conexao.md`).

---

## Workflow

### FASE 1 — Preparação

1. **Localizar as imagens.** O padrão é
   `carrosseis/<peça>/instagram/slide-XX.jpg`. Listar ordenado por nome;
   sem imagens, parar e pedir que sejam geradas
2. **Confirmar a ordem** com o usuário — ordem do carrossel = ordem dos arquivos
3. **Montar a legenda** a partir do `legenda.txt` da pasta (máx. 2200 caracteres).
   ⚠️ É o `.txt` que carrega o texto; o `legenda.md`, quando existe, guarda só as
   decisões de copy e **não** é o que se publica
4. **Mostrar resumo e pedir confirmação final** (tema, nº de slides, primeiras
   ~200 chars da legenda). **Só seguir com um "sim" explícito**

### FASE 2 — Publicação (ponto irreversível)

```bash
node .claude/skills/instagram-publisher/scripts/publish.js \
  --images "carrosseis/<peça>/instagram/slide-01.jpg,carrosseis/<peça>/instagram/slide-02.jpg" \
  --caption-file "carrosseis/<peça>/legenda.txt"
```

| Flag | O que faz |
|---|---|
| `--caption-file <arquivo>` | Lê a legenda de um arquivo — **recomendado**, evita escape com legenda longa. O arquivo certo é o `legenda.txt` da peça. Alternativa: `--caption "texto"` |
| `--dry-run` | Roda o fluxo inteiro (upload + containers) **sem publicar**. A conferência de conta roda mesmo assim: ensaio cego não prova nada |
| `--at HH:MM` | Agenda localmente (ver abaixo) |
| `--conta <nome>` | Publica em outra conta, lendo `scripts/.env.<nome>`. **Sem ele, é sempre a conta principal.** O nome do arquivo tem que bater com o `INSTAGRAM_CONTA` de dentro: o nome não pode mentir sobre a conta |

A saída começa confirmando onde vai publicar. **Se essa linha não aparecer, nada
foi ao ar:**

```
🔒 Conferindo a conta (scripts/.env)...
   ✅ publicando em @sua-conta (id 17841...)
```

### FASE 3 — Pós-publicação

- **Sucesso:** capturar o **Post ID**/permalink e registrar na pasta do conteúdo
  (ex.: `publicado.md` com data + post ID), para a peça constar como publicada
> **Conferir a URL é cortesia, não é o gate.** Depois de hospedar, o script dá um
> HEAD em cada imagem antes de chamar a Meta. Se a URL **responde errado** (404,
> content-type que não é imagem), ele para: a mídia não está lá. Mas se o HEAD
> **nem chega a ter resposta** (DNS, conexão recusada, socket cortado), ele
> **avisa e segue**: quem baixa a imagem de verdade é a Meta, de outra rede, e
> o passo do container já espera e repete 8× por causa disso. Parar num soluço
> de rede dá alarme falso de "NÃO foi ao ar" com o post saindo minutos depois,
> com as mesmas URLs.

- **Falha:** o script já tem retry em três pontos — imgBB (4× por imagem),
  container (8× por imagem, esperando o imgBB propagar pro fetcher da Meta) e
  publicação (5× no erro 9007 de carrossel). Falhando ainda assim, relatar o erro
  e perguntar como proceder — **nunca improvisar caminho que envolva commit/push**

> **Sobre tempo:** logo após o upload a Meta às vezes não consegue baixar a
> imagem do imgBB (CDN ainda não propagou). O script espera e repete sozinho, e
> um carrossel pode levar ~1 min a mais na etapa de containers. É normal.

---

## Agendamento (`--at`)

A API do Instagram **não tem agendamento na nuvem**. O `--at` é local: o script
valida tudo na hora, fica rodando e publica quando o horário chega.

- `--at HH:MM` → hoje. `--at "2026-07-20 09:00"` → outra data
- **Exige o PC ligado e o terminal aberto até a hora.** Computador dormiu ou
  terminal fechou, a publicação não acontece
- Tudo é validado **antes** da espera (imagens, legenda, credenciais) — erro
  aparece na hora, não depois de horas. Upload e publicação só rodam na hora
  marcada, então as imagens vão fresquinhas, sem container velho
- Horário já passado: o script **avisa e para**, em vez de esperar 24h à toa
- Para hora marcada sem o PC ligado, o mesmo `publish.js` roda por agendador
  (cron) num servidor, com o `scripts/.env` de lá

## 🚨 "Não foi possível obter a mídia deste URI" (9004 / 2207052)

Esta é a explicação única do erro no workspace; os outros arquivos que o citam
apontam para cá.

**O que a Meta diz:** `Only photo or video can be accepted as media type`, com
`code: 9004`, `error_subcode: 2207052` e `is_transient: false`. A mensagem
engana duas vezes: não é o tipo nem o peso do arquivo, e o erro costuma sumir
sozinho. O que aconteceu é que **a Meta não conseguiu baixar a url naquele
momento**: ela baixa a imagem do imgBB a partir de outra rede, e logo depois do
upload a url pode ainda não ter chegado a todos os servidores do imgBB; às
vezes uma url específica continua sem descer para a Meta por muito tempo.

**O que o motor faz, em três camadas, sem você pedir:**

1. **Espera a propagação** antes do primeiro container (180 s por padrão,
   `IMGBB_PROPAGATION_WAIT_MS`) e confere se cada url já responde como imagem.
2. **Repete na mesma url**: no 9004 (e nos irmãos 2207003, 2207020 e no
   `code 1`), até 8 tentativas, com 6 s de intervalo (`META_RETRY_INTERVAL_MS`).
3. **Re-hospeda num endereço novo** quando as 8 se esgotam, e recomeça, até 3
   rodadas. O imgBB **deduplica por conteúdo** (o mesmo arquivo devolve sempre a
   mesma url), então, para ganhar url nova, o motor acrescenta alguns bytes no
   fim do arquivo, que PNG ignora depois do IEND e JPEG ignora depois do EOI: a
   imagem decodifica igual. A url boa vai para o estado, para uma retomada não
   voltar para a ruim. Você vê no log:

```
↻ 8 tentativas sem sucesso nesta url. Re-hospedando a imagem num endereço novo...
↻ url nova: https://i.ibb.co/...
```

⚠️ **Republicar a peça inteira à mão não ajuda**: pela dedupe, o upload cai na
mesma url e falha igual. Só investigue se as três rodadas estourarem.

⚠️ **Converter para JPEG à mão não é o conserto.** Parece resolver por acidente:
muda os bytes e gera url nova. **Peso também não é a causa**: arquivo pequeno
quebra e arquivo maior publica.

⚠️ **Trocar de hospedagem também não escapa.** O catbox.moe, o candidato óbvio
(grátis, sem conta), deduplica igual. A dedupe é o normal do ramo, e o que
escapa é o padding.

⚠️ **Se aparecer erro que NÃO seja 9004/2207052/2207003/2207020 ou o code 1, ele
para na hora**, sem repetir e sem re-hospedar. Erro de token, de permissão ou de
formato não melhora com insistência.

Mexeu nesta parte: `node .claude/skills/instagram-publisher/scripts/teste-publish.mjs`.

## Restrições

- Imagens: PNG ou JPEG, 1 a 10 por post · Legenda: a API aceita até 2.200
  caracteres, mas a régua do workspace é a de `scripts/lib/legenda.js` (400 por
  padrão, configurável lá)
- Conta Instagram Business/Creator conectada (Login do Instagram)
- Limite da API: 100 publicações por 24h (o `content_publishing_limit` da conta)

## Princípios

1. **Confirmação humana antes de publicar.** Publicar é irreversível — nunca
   pular o passo 4
2. **Falha na publicação → os retries do script, depois parar e relatar.**
   Publicar é a exceção à regra de seguir por outro caminho quando um serviço
   externo falha: desvio que publica é decisão do usuário
3. **Publicar não passa por git.** O post vai ao ar pela API, e nenhum commit,
   push ou deploy faz parte deste fluxo. A regra de git do workspace é a do
   CLAUDE.md
