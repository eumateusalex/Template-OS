# /instagram-publisher · conexão e token

O modo de **manutenção** da integração (publicar é o `SKILL.md`). Diagnostica,
renova o token e, se preciso, refaz o setup do zero. **Sempre entrar pela
ETAPA 1** e desviar conforme o resultado.

> **Conta deste modo: a principal, a que estiver declarada em `scripts/.env`.**
> Enquanto o `scripts/.env` não estiver preenchido, começar pela **ETAPA 3**.
>
> ⚠️ **Uma conta por arquivo.** Quem opera mais de um perfil tem um
> `scripts/.env.<nome>` para cada um, e o `publish.js` escolhe com
> `--conta <nome>`. 🚨 **O `<nome>` é o USERNAME da conta**, sem arroba, não um
> apelido: o `--conta` é comparado com o que a API responde ao vivo, então um
> apelido reprova. Para cuidar de outra conta aqui, troque `scripts/.env` por
> `scripts/.env.<nome>` nos comandos abaixo.
>
> Contas diferentes costumam viver na mesma Central de Contas da Meta, e é aí
> que se erra: **nunca** colar num arquivo um token gerado para outra conta. A
> variável `INSTAGRAM_CONTA` existe justamente pra travar isso.

> **Fluxo usado: "API do Instagram com Login do Instagram".** Token `IGAA...`,
> endpoint `graph.instagram.com` — **não** é o fluxo de Página do Facebook
> (token `EAA`, `graph.facebook.com`) e **não** usa Python. A publicação é Node,
> sem dependências. Ajuste em script só via Edit, com aprovação.

## Estado esperado

`scripts/.env` (o git ignora; nunca versionar nem colar em arquivo versionado):

```
INSTAGRAM_CONTA=sua-conta                 # o @ esperado, SEM arroba — 1ª ponta da trava
INSTAGRAM_BUSINESS_ID=17841...            # o `id` da sua conta (BUSINESS/CREATOR) — ver ETAPA 3, passo 4
INSTAGRAM_ACCESS_TOKEN=IGAA...            # ~60 dias; renova sozinho (trava de ~50 dias, não a cada post)
INSTAGRAM_TOKEN_REFRESHED_AT=YYYY-MM-DD   # data da última renovação (o script mantém sozinho)
META_API_BASE=https://graph.instagram.com
META_API_VERSION=v23.0
IMGBB_API_KEY=...                         # hospedagem das imagens (https://api.imgbb.com/)
```

| Variável | O que é | Onde se consegue |
|---|---|---|
| `INSTAGRAM_CONTA` | o username da conta, sem arroba | o perfil no Instagram |
| `INSTAGRAM_BUSINESS_ID` | o `id` da conta na API | a ETAPA 3, passo 4 |
| `INSTAGRAM_ACCESS_TOKEN` | o token de longa duração (`IGAA...`) | o painel do app na Meta (ETAPA 2 ou 3) |
| `IMGBB_API_KEY` | a chave da hospedagem de imagem, grátis | https://api.imgbb.com/ |
| `REELS_MIDIA_DIR`, `REELS_MIDIA_BASE` | só para Reels: a pasta que um servidor seu serve e a URL pública dela | o seu servidor (o `SKILL.md`, "O Reels exige hospedagem própria") |

> ⚠️ **O `INSTAGRAM_CONTA` não é opcional.** Ele é a **1ª ponta da trava das três
> pontas** do `publish.js`: o `--conta` pedido, o ID gravado aqui e o que a API
> responde ao vivo têm que concordar. Sem esta linha o motor publica assim mesmo,
> mas avisa "Conta não declarada" em toda publicação e a trava fica com uma ponta
> só.

---

## ETAPA 1 — Diagnóstico (sempre começar aqui)

```bash
node -e "
const env = Object.fromEntries(require('fs').readFileSync('scripts/.env','utf8').split(/\r?\n/).map(l=>l.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean).map(m=>[m[1],m[2]]));
fetch(\`https://graph.instagram.com/v23.0/me?fields=id,username&access_token=\${env.INSTAGRAM_ACCESS_TOKEN}\`).then(r=>r.json()).then(d=>console.log(JSON.stringify(d)));
"
```

| Resposta | Para onde |
|---|---|
| Retornou `username` | **Conexão OK.** Conferir que o `id` devolvido é o `INSTAGRAM_BUSINESS_ID` do arquivo e encerrar |
| `OAuthException` code **200** `API access blocked` | **Não é o token, e a ETAPA 2 não resolve** → `referencias/bloqueio-do-app.md` |
| `OAuthException` code **190** (ou "Invalid OAuth access token") | Token expirou → **ETAPA 2** |
| `scripts/.env` não existe ou sem as chaves | Máquina nova → **ETAPA 3** |

---

## ETAPA 2 — Token expirado (cenário mais comum)

O `publish.js` renova o token sozinho quando ele fica velho (trava de ~50 dias,
`refresh_access_token`), então só se chega aqui depois de **60+ dias sem
publicar e sem rodar o `--so-renovar`** — o refresh não ressuscita token já
morto. Para não voltar aqui, o `--so-renovar` do `SKILL.md` pode rodar num
agendador diário.

Instruir o usuário a gerar um token novo:

1. Abrir `https://developers.facebook.com` → **Meus apps** → o app deste workspace
2. Menu lateral: **Instagram > Configuração da API com Login do Instagram**
3. Na seção **Gerar tokens de acesso**, localizar a conta e clicar em **Gerar
   token** (fazer login no Instagram se pedir)
4. Copiar o token inteiro (começa com `IGAA`) e colar no chat

Ao receber: validar (começa com `IGAA`, 100+ caracteres), atualizar **só a linha
`INSTAGRAM_ACCESS_TOKEN=`** do `scripts/.env` (via Edit, nunca PowerShell), rodar
a ETAPA 1 de novo pra confirmar, e avisar que a renovação automática reassume
dali.

---

## ETAPA 3 — Setup do zero (só máquina ou conta nova)

1. Confirmar: a conta do Instagram é **profissional** (Business/Creator)?
2. `https://developers.facebook.com` → criar app (tipo Business) → adicionar o
   produto **"API do Instagram"** (Instagram API with Instagram Login)
3. Em **Instagram > Configuração da API com Login do Instagram**: adicionar a
   conta como usuária do Instagram do app e **gerar o token** (IGAA)
4. Descobrir o ID: `GET graph.instagram.com/v23.0/me?fields=id,username` →
   **o `id` é o `INSTAGRAM_BUSINESS_ID`**. 🚨 **Não é o `user_id`**, embora o
   nome da variável sugira: o `/me` devolve os dois, e o `publish.js` usa o `id`
   tanto na trava quanto no endpoint `/{id}/media`. Com o `user_id`, a publicação
   para em *"CONTA INCOERENTE"* antes de tocar em imagem nenhuma
5. Criar `scripts/.env` no formato do "Estado esperado" (incluir a
   `IMGBB_API_KEY` — pegar em https://api.imgbb.com/). Conta adicional: o mesmo
   conteúdo em `scripts/.env.<username>`
6. Testar sem publicar:
   `node .claude/skills/instagram-publisher/scripts/publish.js --images <png1>,<png2> --caption "teste" --dry-run`
   (com `--conta <username>` para a conta adicional). A primeira linha da saída
   tem de dizer `publicando em @<a conta certa>`

---

## Diagnóstico de erros

| Erro | Causa | Solução |
|---|---|---|
| `OAuthException` code 200 `API access blocked` | **App bloqueado do lado da Meta** — não é o token. Falha até no `/me` | **Não gerar token novo** → `referencias/bloqueio-do-app.md` |
| `OAuthException` code 190 | Token expirado/inválido | ETAPA 2 |
| `CONTA INCOERENTE` | O `INSTAGRAM_BUSINESS_ID` do arquivo não é o `id` do dono do token (em geral, o `user_id` gravado no lugar) | ETAPA 3, passo 4 |
| `CONTA ERRADA` | O token é de outra conta da mesma Central de Contas | Gerar o token na conta certa (ETAPA 2) |
| code 9004 / subcode 2207052 ao criar container | A Meta não conseguiu baixar a `image_url` naquele momento (não é formato nem peso; a explicação está no `SKILL.md`, seção "Não foi possível obter a mídia deste URI") | O script trata sozinho: espera a propagação, tenta 8× por url e re-hospeda com bytes novos (o imgBB devolve a mesma url para os mesmos bytes) até 3 rodadas; só investigar se as três estourarem |
| code 1 "unknown error" ao criar container | Mesmo caso (Meta não baixou a imagem) | Idem — retry automático |
| code 100 `image_url` | URL não é pública/direta | Usar o próprio script (ele hospeda sozinho no imgBB) |
| code 9007 / subcode 2207027 no publish | Container de carrossel ainda processando | Transitório — o script tenta 5× sozinho |
| Timeout no processamento | Meta lenta | O script espera até 1 min por container; tentar de novo |

**Como publicar** não é assunto deste modo: o comando, as flags e as regras de
hospedagem estão no [`SKILL.md`](SKILL.md), que é a fonte.
