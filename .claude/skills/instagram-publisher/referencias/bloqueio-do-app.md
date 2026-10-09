# Bloqueio do app na Meta

> Abrir **só** se a ETAPA 1 do `conexao.md` devolver `OAuthException` code
> **200** com `API access blocked`. Em qualquer outro erro, este arquivo não
> serve.

---

## Como reconhecer

A resposta é `API access blocked` (code 200) **inclusive no endpoint `/me`**, que
é o mais básico que existe. Isso significa que **o token está válido e gerar
outro não resolve** — o que está bloqueado é o *app* do lado da Meta.

🚫 **Não seguir a ETAPA 2 nesse caso.** Gerar token novo é trabalho perdido: a
chamada morre antes de chegar no token.

---

## O que fazer

1. Abrir `https://developers.facebook.com` → **Meus apps** → o app deste workspace
2. Ir na aba **Alertas** — é lá que aparece o motivo do bloqueio e o que a Meta
   está pedindo (revisão pendente, política, verificação de negócio…)
3. Resolver o que estiver listado ali. Só depois disso a API volta
4. Enquanto não destravar: o `/instagram-publisher` **não publica** — a
   publicação é manual, pelo aplicativo ou pelo navegador (o bloqueio é do app,
   não da conta)

---

## O alcance

⚠️ O bloqueio derruba **todas as contas de uma vez** quando elas compartilham o
mesmo app da Meta. Se alguma delas publica sozinha por automação, o sintoma
aparece primeiro lá: falha repetida, todo dia, no mesmo horário.
