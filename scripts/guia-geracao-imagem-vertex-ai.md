# Guia — Geração de imagem por IA via Vertex AI (Nano Banana)

> A receita completa para ligar geração de imagem por IA neste workspace,
> pagando com crédito de Google Cloud.
>
> **Nenhuma chave, token, ID de projeto ou conta de faturamento entra aqui** —
> tudo isso vive em `scripts/.env`, e o guia manda ler de lá.
>
> ⚠️ **A régua vale inclusive para identificador de conta.** ID de projeto e ID
> de conta de faturamento não são chaves, mas também não pertencem a documento:
> eles se leem com `gcloud`, na hora. Se você preencher este guia com os seus,
> ele deixa de ser seguro para versionar.

> ## Antes de começar
>
> São três coisas, e a ordem importa:
>
> | Passo | Comando | Como saber que deu certo |
> |---|---|---|
> | 1. Instalar a CLI do Google Cloud | `winget install Google.CloudSDK` (Windows) · `brew install google-cloud-sdk` (macOS) | `gcloud --version` responde |
> | 2. Autenticar | `gcloud auth login` | abre o navegador, uma vez só |
> | 3. Apontar o projeto | `GOOGLE_CLOUD_PROJECT=<seu-projeto>` no `scripts/.env` | `--dry-run` roda sem erro |
>
> ⚠️ **O `--dry-run` é o teste barato.** Ele resolve projeto, login e token de
> verdade **sem chamar a API**, então não gasta nada. Rode ele antes da primeira
> geração real.
>
> ⚠️ **Editor aberto não enxerga o gcloud recém-instalado.** O PATH do usuário
> recebe a CLI na instalação, mas um editor que já estava aberto segue com a
> cópia velha em memória, e aba nova de terminal herda dela. Reinicie o editor,
> ou chame pelo caminho completo.
>
> **Como pedir** no dia a dia: a skill `/gerar-imagem`, ou só falar "gera uma
> imagem de X".

---

## 1. O que este guia resolve

Fazer um script gerar imagens por IA (modelos **Nano Banana**, do Google),
pagando com **crédito de Google Cloud**, sem depender de saldo pré-pago
separado e sem colar chave de API em lugar nenhum.

O caminho final é a **Vertex AI autenticada pelo `gcloud`**.

### A correção de conceito mais importante

> **Não existe "o token" pra copiar pro outro projeto.**

A autenticação não usa chave fixa. O `gcloud` guarda o seu login na máquina e
emite um **token de acesso efêmero** (validade de ~1 hora) a cada chamada. O
script pede esse token na hora de gerar a imagem e o descarta em seguida.

Isso é melhor do que chave fixa: nada vaza em commit, nada expira sem aviso, e
revogar acesso é `gcloud auth revoke`. Mas muda o que você precisa levar pro
outro projeto — ver a seção 5.

---

## 2. TL;DR — replicar em outro projeto

Se o outro projeto roda **na mesma máquina e com o mesmo usuário do Windows**,
são três passos:

1. Copiar `scripts/gerar-imagem.js` e `scripts/lib/vertex.js` para o projeto
   novo, na mesma posição (`scripts/` e `scripts/lib/`).
2. Criar/editar o `.env` do projeto novo com:
   ```
   GOOGLE_CLOUD_PROJECT=<copie o valor de scripts/.env>
   ```
3. Rodar:
   ```bash
   node scripts/gerar-imagem.js --prompt "..." --saida caminho/img.png --dry-run
   ```

O `gcloud auth login` é **por máquina e usuário**, não por projeto de código:
feito uma vez, vale para qualquer projeto que rode ali. Não precisa refazer a
cada repositório.

Se for outra máquina ou um servidor, ver a seção 5.

---

## 3. O estudo — por que NÃO usar a Gemini API do AI Studio

Esta seção está aqui para ninguém repetir a investigação.

### Existem três "bolsas de dinheiro" diferentes no Google, e elas não se falam

| Bolsa | O que é | Serve para | Como abastece |
|---|---|---|---|
| **Assinatura Google AI Pro** | Plano de consumidor (~US$ 20/mês) | Só a **interface web** do AI Studio e do app Gemini | Mensalidade |
| **Saldo pré-pago da Gemini API** | Crédito comprado dentro do AI Studio | A API `generativelanguage.googleapis.com` (chave `AIza...`/`AQ...`) | "Buy credits" no AI Studio, mínimo US$ 10 |
| **Cloud Billing** | Faturamento normal do Google Cloud | Vertex AI e todo o resto do GCP | Cartão, boleto, **e créditos promocionais** |

**As três são independentes.** Foi exatamente aqui que a gente se perdeu.

### Os três erros de suposição, na ordem em que aconteceram

**1. "Tenho o plano Pro, então a API deve funcionar."**
Não. A documentação oficial é explícita:

> *"Google AI plan benefits for developer usage apply only within the Google AI
> Studio web interface. Direct use of the Gemini API (such as using API keys or
> external applications) is billed and managed separately."*
> — [ai.google.dev/gemini-api/docs/google-ai-plans](https://ai.google.dev/gemini-api/docs/google-ai-plans)

**2. "Coloquei R$ 50 no Google Cloud, então o saldo resolve."**
Não. Dinheiro em conta do Cloud não abastece o **saldo pré-pago da Gemini API**,
que é comprado noutra tela. A API respondia:

```
429 · "Your prepayment credits are depleted."
```

**3. "Virei Developer Program Premium, os créditos vão cobrir."**
Não, não na Gemini API. Crédito do Developer Program é **crédito de Cloud
Billing**, e a documentação do free trial confirma o recorte:

> *"The $300 credit **can't pay for Gemini API in AI Studio** costs."*
> — [docs.cloud.google.com/free/docs/free-cloud-features](https://docs.cloud.google.com/free/docs/free-cloud-features)

Só que **vale para a Vertex AI** — treino, inferência, embeddings e Gemini.

### A virada

A Vertex AI serve **os mesmos modelos Nano Banana**, mas é cobrada pelo Cloud
Billing normal. Logo, o crédito que já existia na conta funciona lá.

Migrar da Gemini API para a Vertex AI resolveu tudo, sem gastar mais nada.

### Os dois sintomas, que enganam

O mesmo problema aparece de duas formas diferentes, e nenhuma delas diz
"billing errado":

| Onde | Mensagem | O que parece | O que é |
|---|---|---|---|
| Modelos de **imagem** | `429 · limit: 0` no free tier | "acabou minha cota diária" | não existe free tier de imagem; a conta não paga |
| Modelos de **texto** | `429 · prepayment credits are depleted` | "acabou meu crédito do Cloud" | acabou o saldo **pré-pago da Gemini API**, que é outra coisa |

Quando o saldo pré-pago zera, os serviços **param na hora** — não caem para o
free tier. Por isso o erro de imagem lê `limit: 0` em vez de um limite normal.

---

## 4. Arquitetura da solução

```
scripts/gerar-imagem.js
        │
        ├── lê GOOGLE_CLOUD_PROJECT do scripts/.env
        │
        ├── chama:  gcloud auth print-access-token
        │           └── devolve token efêmero (~1h), sem chave em disco
        │
        └── POST https://aiplatform.googleapis.com/v1
                  /projects/<PROJETO>/locations/global
                  /publishers/google/models/<MODELO>:generateContent
            headers: Authorization: Bearer <token>
                     └── cobrado no Cloud Billing → abatido dos créditos
```

### Endpoint e corpo do pedido

```
POST https://aiplatform.googleapis.com/v1/projects/{PROJETO}/locations/global/publishers/google/models/{MODELO}:generateContent
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "contents": [
    { "role": "user", "parts": [ { "text": "seu prompt em inglês" } ] }
  ],
  "generationConfig": {
    "responseModalities": ["IMAGE"],
    "imageConfig": { "aspectRatio": "4:5", "imageSize": "2K" }
  }
}
```

Para **imagem de referência** (image-to-image), inserir antes do texto:

```json
{ "inlineData": { "mimeType": "image/png", "data": "<base64>" } }
```

A ordem importa: o modelo processa as partes em sequência e a instrução textual
precisa poder se referir ao que já viu.

### Resposta

A imagem volta em **base64** em:

```
candidates[0].content.parts[N].inlineData.data
```

Se não houver `inlineData` em nenhuma parte, o motivo está em
`candidates[0].finishReason` ou `promptFeedback.blockReason` — geralmente
bloqueio de política. O script repassa esse motivo em vez de falhar mudo.

### Modelos disponíveis

| Apelido | ID | Quando usar | Custo aprox. (USD/imagem) |
|---|---|---|---|
| Nano Banana 2 | `gemini-3.1-flash-image` | **padrão** — rápido e barato | 1K 0,045 · 2K 0,067 · 4K 0,151 |
| Nano Banana Pro | `gemini-3-pro-image` | só quando precisar de **texto legível** ou diagrama | 1K/2K 0,134 · 4K 0,24 |
| Nano Banana 2 Lite | `gemini-3.1-flash-lite-image` | rascunho, 512px | mais barato |
| Nano Banana (legado) | `gemini-2.5-flash-image` | compatibilidade | 0,039 |

Formatos: `1:1`, `4:5`, `3:2`, `2:3`, `16:9`, `9:16` e outros.
Tamanhos: `1K`, `2K`, `4K` (e 512px só no Lite).

---

## 5. Implantar em outro projeto

### Cenário A — mesma máquina, mesmo usuário do Windows (o mais provável)

**Nada de autenticação a fazer.** O login do `gcloud` é da máquina/usuário, não
do projeto de código.

1. Copiar `scripts/gerar-imagem.js` e `scripts/lib/vertex.js`, na mesma posição.
2. No `.env` do projeto novo:
   ```
   GOOGLE_CLOUD_PROJECT=<copie o valor de scripts/.env>
   ```
3. Garantir que o `.env` está no `.gitignore` do projeto novo.
4. Testar com `--dry-run`, depois gerar uma imagem de verdade.

**Vale reusar o mesmo projeto GCP?** Sim, e é o mais simples: ele já tem a API
ligada e a conta de faturamento com os créditos. Só crie projeto separado se
quiser custos segregados por cliente — nesse caso, ver o cenário C, passo 2.

### Cenário B — outra máquina (outro PC, outro notebook)

1. Instalar a CLI:
   ```powershell
   winget install Google.CloudSDK
   ```
   No Windows, o `gcloud` sai em
   `%LOCALAPPDATA%\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd`.
   **O PATH só enxerga a CLI em terminal aberto depois da instalação** — por
   isso o script procura o executável em caminhos conhecidos em vez de confiar
   no PATH.

2. Autenticar (abre o navegador, uma vez só):
   ```bash
   gcloud auth login
   ```

3. Conferir:
   ```bash
   gcloud auth list
   gcloud billing projects describe <PROJETO>   # billingEnabled deve ser true
   ```

4. Seguir o cenário A.

### Cenário C — projeto GCP novo (custos separados) ou servidor/CI

**Passo 1 — criar o projeto e ligar ao faturamento:**

```bash
gcloud projects create <NOVO-PROJETO>
gcloud billing projects link <NOVO-PROJETO> --billing-account=<ID-DA-CONTA>
gcloud services enable aiplatform.googleapis.com --project=<NOVO-PROJETO>
```

> O `<ID-DA-CONTA>` é o da conta "Minha conta de faturamento", que é a que tem
> os créditos. Projeto não ligado a ela **não** consome crédito e vai bater erro.
> O ID se lê com `gcloud billing accounts list` — ele não fica escrito aqui,
> porque identificador de conta financeira não pertence a documento.

**Passo 2 — se rodar sem pessoa logada** (servidor, cron, GitHub Actions), o
`gcloud auth login` não serve: use conta de serviço.

```bash
gcloud iam service-accounts create gerador-imagem --project=<PROJETO>

gcloud projects add-iam-policy-binding <PROJETO> \
  --member="serviceAccount:gerador-imagem@<PROJETO>.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

gcloud iam service-accounts keys create ~/.config/gcloud/chave-gerador-imagem.json \
  --iam-account=gerador-imagem@<PROJETO>.iam.gserviceaccount.com
```

A chave nasce **fora do repositório**, na pasta de configuração do `gcloud`. Criada
na pasta atual, ela cairia na raiz do workspace, que é onde a sessão abre. Depois,
apontar `GOOGLE_APPLICATION_CREDENTIALS=~/.config/gcloud/chave-gerador-imagem.json`
e trocar o `tokenVertex()` de `scripts/lib/vertex.js` pela biblioteca
`google-auth-library`. A troca alcança os dois usos da fonte: a imagem e o vídeo.

> ⚠️ **Este cenário não foi testado.** Os comandos acima seguem a documentação
> oficial, mas valide antes de confiar. A chave **nunca** entra no git: além de
> ela nascer fora, o `.gitignore` ignora `chave.json`, `*-sa.json` e
> `service-account*.json` para o caso de ela ser criada na raiz por engano.

---

## 6. O script

Arquivo: `scripts/gerar-imagem.js` (CommonJS, sem dependência de pacote: usa o
`fetch` nativo do Node e pede o token ao `scripts/lib/vertex.js`, que vai junto).

```bash
node scripts/gerar-imagem.js \
  --prompt "..." \
  --saida caminho/imagem.png \
  [--modelo flash|pro|legacy] \
  [--formato 4:5] \
  [--tamanho 1K|2K|4K] \
  [--ref referencia.png] \
  [--via vertex|gemini] \
  [--dry-run]
```

Comportamento que vale conhecer:

- **`--dry-run` valida sem gastar.** Ele resolve o alvo — projeto, login do
  `gcloud`, chave — antes de imprimir. É o jeito barato de descobrir que falta
  configuração.
- **Sempre imprime o custo estimado** antes de gerar.
- **4 tentativas** com espera crescente em erro de rede ou 429. Erro 4xx de
  pedido não repete, porque repetir não conserta.
- **`--via gemini`** mantém o caminho antigo (API do AI Studio, com
  `GEMINI_API_KEY`). Hoje ele responde 429 por saldo pré-pago zerado. Só serve
  se alguém recarregar aquele saldo.

### Detalhe de Windows que quebra o script

Desde o Node 20, o Windows recusa `spawn` de arquivo `.cmd` sem shell
(`EINVAL`). Como o `gcloud` no Windows **é** um `.cmd` e o caminho tem espaços,
a chamada precisa ser `execSync` com o caminho entre aspas:

```js
execSync(`"${gcloud}" auth print-access-token`, { encoding: 'utf8' })
```

`execFileSync` falha. Perdemos tempo com isso.

---

## 7. Custos e créditos

### De onde sai o crédito

Duas fontes cobrem geração de imagem na Vertex, e as duas caem no **Cloud
Billing** (não no saldo pré-pago da Gemini API, que é outra bolsa):

| Crédito | O que é | Prazo |
|---|---|---|
| **Free Trial** | crédito de boas-vindas do Google Cloud, ~US$ 300 | costuma ser 90 dias — **confirme o seu** |
| **Developer Program** | benefício mensal de quem assina o Google AI Pro | resgatado em `developers.google.com/program/my-benefits` |

⚠️ **Confira os valores e prazos na sua conta**, em
`console.cloud.google.com/billing` → **Créditos**. Eles mudam por região, por
promoção e por época, e número copiado de documento envelhece.

**Fazendo a conta:** a ~US$ 0,067 por imagem (Nano Banana 2 em 2K), US$ 300 dão
**cerca de 4 mil imagens**.

### Como conferir se o crédito está drenando

`console.cloud.google.com/billing/<CONTA>` → **Créditos**. A coluna
"Porcentagem restante" sai de 100% conforme o uso. O dado de custo do Cloud
demora **algumas horas** para aparecer — não conclua nada no mesmo minuto.

### Regras deste workspace

- **Avisar o custo antes de gerar e gerar uma imagem por vez.**
- Crédito de Free Trial tem prazo curto. Se a validade estiver perto, vale
  antecipar a produção de um banco de imagens da marca em vez de gerar sob
  demanda.

---

## 8. Erros → causa → conserto

| Erro | Causa real | Conserto |
|---|---|---|
| `429 · limit: 0` em modelo de imagem | Geração de imagem **não tem free tier**; a conta não está pagando | Usar Vertex AI com billing ativo |
| `429 · prepayment credits are depleted` | Saldo pré-pago **da Gemini API** zerado (não é o Cloud) | Migrar para Vertex AI, ou comprar créditos no AI Studio |
| `403 · SERVICE_DISABLED` | API não habilitada no projeto | `gcloud services enable aiplatform.googleapis.com --project=<P>` |
| `401 / 403` com token | Token expirado ou login perdido | `gcloud auth login` |
| `EINVAL` ao chamar o gcloud | `spawn` de `.cmd` no Windows | usar `execSync` com o caminho entre aspas |
| `GOOGLE_CLOUD_PROJECT não definido` | falta no `.env` | adicionar a variável |
| Resposta 200 mas sem imagem | bloqueio de política ou prompt recusado | ler `finishReason` / `blockReason` que o script repassa |
| Projeto não consome crédito | projeto não ligado à conta de faturamento certa | `gcloud billing projects link` |

### Comandos de diagnóstico

```bash
gcloud auth list                                   # quem está logado
gcloud billing accounts list                       # contas de faturamento
gcloud projects list                               # projetos
gcloud billing projects describe <PROJETO>         # billingEnabled: true?
gcloud services list --enabled --project=<PROJETO> # aiplatform ligado?
```

---

## 9. Armadilhas registradas (todas custaram tempo real)

1. **"Token" é conceito errado aqui.** Não há chave a copiar; há um login de
   máquina que emite token efêmero. Levar isso pro outro projeto significa
   garantir o `gcloud auth login`, não copiar segredo.

2. **Plano de consumidor ≠ acesso por API.** Vale para Google AI Pro, e vale
   como regra geral: assinatura de interface raramente cobre uso programático.

3. **Crédito promocional não abastece saldo pré-pago.** São sistemas de cobrança
   distintos dentro da mesma empresa.

4. **Dois erros diferentes, um problema só.** `limit: 0` e
   `prepayment credits are depleted` são a mesma causa vista de ângulos
   diferentes.

5. **Projeto ligado à conta de faturamento errada** é silencioso: tudo parece
   configurado e nada consome crédito. Conferir com
   `gcloud billing projects describe`.

6. **Modelo de imagem erra letra.** IA entra como foto, cena ou textura —
   nunca para gerar slide com texto. Tipografia sai do HTML renderizado.

7. **Pedir espaço negativo no prompt**, na região onde o texto vai entrar. Sai
   mais barato que consertar com scrim depois.

8. **Foto escura + scrim forte = fundo chapado.** A imagem some por inteiro e o
   sintoma parece "a foto não carregou".

9. **Regra CSS de fundo precisa vencer a especificidade.** `.slide.dark` (duas
   classes) usa o atalho `background`, que zera `background-image`, e derruba
   uma regra de classe única. Usar `.slide.minha-classe`.

10. **Imagem de post vai pro Instagram em JPEG.** A API de publicação aceita
    JPEG até 8 MB (a especificação da Meta); por isso o render entrega JPEG, e
    a imagem avulsa passa pelo `scripts/para-jpeg.js` (qualidade 92). O erro
    9004/2207052 não é do formato: o `/instagram-publisher` explica e já o
    trata.

---

## 10. Checklist de validação num projeto novo

- [ ] `gcloud auth list` mostra a conta certa
- [ ] `gcloud billing projects describe <P>` retorna `billingEnabled: true`
- [ ] `gcloud services list --enabled` inclui `aiplatform.googleapis.com`
- [ ] `.env` tem `GOOGLE_CLOUD_PROJECT` e está no `.gitignore`
- [ ] `--dry-run` roda sem erro e mostra "Vertex AI · projeto ..."
- [ ] Uma imagem de teste é gerada e salva
- [ ] Em algumas horas, a página de Créditos mostra o consumo

---

## Referências

- [Vertex AI — geração de imagem](https://cloud.google.com/vertex-ai/generative-ai/docs/image/generate-images)
- [Gemini API — modelos de imagem e formato do pedido](https://ai.google.dev/gemini-api/docs/image-generation)
- [Google AI Plans — o que a assinatura cobre](https://ai.google.dev/gemini-api/docs/google-ai-plans)
- [Gemini API — Billing e o modelo prepay](https://ai.google.dev/gemini-api/docs/billing)
- [Google Cloud Free Program — escopo do crédito](https://docs.cloud.google.com/free/docs/free-cloud-features)
- [Developer Program — benefícios e resgate](https://developers.google.com/profile/help/benefits)

Contexto operacional: seção "Ferramentas conectadas" do `CLAUDE.md` e a tabela
de scripts em `scripts/README.md`.
