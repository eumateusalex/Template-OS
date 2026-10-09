# Formato de ADR

> Referência da skill `/grill`. Carregar **quando o primeiro ADR da sessão for
> aceito**, não antes.
>
> Um ADR registra **que** uma decisão foi tomada e **por quê**. Nada além disso.

Os ADRs vivem em `docs/adr/`, com numeração sequencial: `0001-slug.md`,
`0002-slug.md`. A pasta se cria **preguiçosamente**, no primeiro ADR.

---

## Os três critérios

**Só oferecer um ADR quando os três forem verdade ao mesmo tempo.**

| # | Critério | O teste |
|---|---|---|
| 1 | **Difícil de reverter** | Mudar de ideia daqui a três meses custa quanto? Se for barato, pula. |
| 2 | **Surpreendente sem contexto** | Alguém lendo o código vai pensar "por que cargas d'água fizeram assim?" Se não vai, ninguém precisa da explicação. |
| 3 | **Trade-off real** | Havia alternativa genuína, e ela foi rejeitada por motivo específico. Se o caminho era óbvio, não há o que registrar. |

Faltou um, **pula sem perguntar**. Não negociar os critérios com o usuário no
meio da sessão: eles existem justamente pra ele não ter que julgar isso trinta
vezes por conversa.

> **Sessão que termina com zero ADR está funcionando.** Uma sabatina sobre uma
> mudança sem vocabulário novo e sem decisão irreversível genuinamente não tem
> nada pra escrever. ADR demais produz o mesmo resultado de ADR nenhum: ninguém
> lê.

---

## Template

```md
# {Título curto da decisão}

{Uma a três frases: qual era o contexto, o que foi decidido, e por quê.}
```

É isso. Um ADR pode ser um parágrafo só. O valor está em registrar **que** a
decisão existiu e **por quê**, não em preencher seção.

### Seções opcionais

Só entram quando agregam de verdade. A maioria dos ADRs não precisa de nenhuma.

| Seção | Quando vale |
|---|---|
| **Status** no frontmatter (`proposto \| aceito \| descontinuado \| substituído por ADR-NNNN`) | quando a decisão for revisitada de fato |
| **Opções consideradas** | quando as alternativas rejeitadas merecem ser lembradas |
| **Consequências** | quando há efeito não óbvio lá na frente que precisa ser sinalizado |

---

## Numeração

Varrer `docs/adr/`, achar o maior número existente, somar um. Slug curto, em
minúsculas, com hífen: `0003-eventos-em-vez-de-http-sincrono.md`.

---

## O que se qualifica

- **Forma arquitetural.** "É monorepo." "O write model é event-sourced e o read
  model é projetado no Postgres."
- **Padrão de integração entre contextos.** "Pedidos e Faturamento conversam por
  evento de domínio, não por HTTP síncrono."
- **Escolha de tecnologia que trava.** Banco, message bus, provedor de auth,
  alvo de deploy. Não toda biblioteca: só as que levariam um trimestre pra
  trocar.
- **Fronteira e escopo.** "Dado de Cliente pertence ao contexto de Cliente; os
  outros referenciam só por ID." Os **nãos** explícitos valem tanto quanto os
  sins.
- **Desvio deliberado do caminho óbvio.** "SQL na mão em vez de ORM, porque X."
  Qualquer coisa em que um leitor razoável assumiria o contrário. É o que impede
  o próximo de "consertar" o que era de propósito.
- **Restrição invisível no código.** "Não pode AWS, por exigência de
  compliance." "Resposta abaixo de 200ms, por contrato com a API do parceiro."
- **Alternativa rejeitada por motivo sutil.** Considerou GraphQL e ficou com
  REST por razão não óbvia? Registra, ou alguém sugere GraphQL de novo em seis
  meses.

## O que não se qualifica

- Escolha de biblioteca pequena, trocável numa tarde
- Convenção de nome, formatação, estilo de código
- Qualquer coisa que já está no `CONTEXT.md` (isso é vocabulário, não decisão)
- O caminho óbvio, tomado por ser óbvio
- Decisão que ainda está em aberto (isso não é ADR, é pergunta da sabatina)
