---
name: grill
description: >
  Sabatina implacável pra afiar um plano, uma decisão ou uma ideia antes de
  escrever qualquer código: perguntas em rodada, cada uma já com a resposta
  recomendada, e o vocabulário e as decisões duras gravados em arquivo no
  momento em que se resolvem. Use quando o usuário disser "grill", "sabatina",
  "me questiona", "me sabatina sobre isso", "fura essa ideia", "estressa esse
  plano", "acha o buraco disso", "isso tá de pé?", ou /grill.
---

# /grill — Sabatina que deixa rastro

> Toda sabatina afia o raciocínio. Esta **grava**: termo que se resolve vira
> linha de glossário na hora, decisão difícil de reverter vira ADR, e o que
> sobrou vira registro de sessão no fechamento. É a diferença entre sair com a
> cabeça arrumada e sair com o projeto arrumado.

**Fluxo:** alvo → declarar onde grava → sabatina, uma rodada por vez → gravar
no instante em que resolve → fechamento nas três camadas.

**Grava por padrão.** O rastro é o ponto da skill, não um extra. Só desliga se
o usuário pedir (ver [Modo sem rastro](#modo-sem-rastro)).

---

## Passo 0 · Achar o alvo e declarar onde grava

**Trava obrigatória. Nenhuma pergunta antes disto.**

### 0a · Qual é o alvo?

| O que o usuário trouxe | A sabatina é sobre |
|---|---|
| Uma ideia ou plano solto | a ideia, e o repositório entra só como contexto |
| Uma mudança num projeto que existe | a mudança, dentro daquele projeto |
| Um projeto sem documento nenhum ("documenta meu repo") | o repositório inteiro, varrendo o código pra achar a linguagem que já está lá |
| Uma decisão isolada ("Supabase ou Postgres cru?") | só aquela decisão e o que ela arrasta |

Não deu pra encaixar: **perguntar, não adivinhar.**

### 0b · Onde os arquivos vão cair?

| Contexto | Raiz de gravação |
|---|---|
| Dentro de `clientes/<nome>/` | a pasta do cliente |
| Dentro de `projetos-pessoais/<nome>/` | a pasta do projeto |
| Qualquer pasta com `.git` própria | a raiz daquele repositório |
| Raiz do workspace, sem projeto alvo | **perguntar antes de escrever qualquer coisa** |

Se existir `CONTEXT-MAP.md` na raiz escolhida, o repositório tem **múltiplos
contextos**: o mapa diz onde cada um vive. Inferir a qual deles o assunto se
refere e, na dúvida, perguntar.

**Três regras que não se quebram:**

- **Nunca gravar fora da raiz declarada.**
- **Nunca cruzar `clientes/` com `projetos-pessoais/`**, nos dois sentidos.
- **A sabatina não comita.** A skill escreve arquivo; o commit segue a regra de
  Git do `CLAUDE.md` da raiz alvo, depois do fechamento.

### 0c · Dizer em voz alta, antes da primeira pergunta

Uma linha, sempre:

> Sabatina sobre **{alvo}**. Glossário vai pra `{raiz}/CONTEXT.md`, ADRs pra
> `{raiz}/docs/adr/`. Fechado?

Isso não é formalidade. É a trava contra o pior modo de falha desta skill: rodar
a entrevista inteira e não gravar nada, sem ninguém perceber.

---

## Passo 1 · Ler antes de perguntar

Antes da primeira pergunta, ler o que já existe na raiz declarada:

- `CONTEXT.md` e `CONTEXT-MAP.md` — a linguagem já acordada
- `docs/adr/` — as decisões já tomadas, pra não retomar nem contradizer
- `CLAUDE.md` e briefing do projeto, quando houver

Serve pra duas coisas: **não perguntar o que já está escrito**, e **confrontar o
que contradiz**. Se ele disser algo que bate de frente com um ADR existente,
isso é a primeira pergunta da sabatina, não uma nota de rodapé.

---

## Passo 2 · A sabatina

O núcleo da skill. Cinco regras, nenhuma opcional.

**1. Pergunta em rodada.** O plano é uma árvore: cada decisão abre as que
dependem dela. A **fronteira** é toda decisão cujos pré-requisitos já estão
resolvidos, o que dá pra perguntar agora sem chutar resposta que ele ainda não
deu. Cada rodada é a fronteira inteira, numa entrevista pelo `AskUserQuestion`
(até 4 perguntas; fronteira maior manda primeiro as que destravam mais). Esperar
as respostas, recalcular a fronteira, próxima rodada. Pergunta cuja resposta
depende de outra ainda aberta na mesma rodada vai para a rodada seguinte.

**2. Toda pergunta vem com a resposta recomendada.** Na entrevista, a
recomendada é a primeira opção, marcada "(Recomendado)", com a razão curta na
descrição; o contra de cada opção vai na descrição dela. Pergunta que não cabe
em opção vai em texto, no mesmo espírito:

> {A pergunta}. Eu iria de **{X}**, porque {razão curta}. O contra é {custo}.

Pergunta sem recomendação devolve o trabalho pra ele. A skill é pra afiar o
raciocínio dele contra o seu, não pra transcrever dúvida.

**3. Fato se busca, decisão se pergunta.** Se a resposta está em arquivo,
código, config, log ou ferramenta, **vá ler**. Só o que depende do julgamento
dele vira pergunta. Perguntar o que dava pra descobrir queima a paciência e a
credibilidade da sabatina. Busca que demora vai para o agente `varredor`
(modelo barato, só leitura) **sem travar a rodada**: só espera a pergunta que depende do
fato; o resto da fronteira sai agora.

**4. Resolver dependência primeiro.** A fronteira já faz isso: o galho que
sustenta os outros sai antes, e pergunta cujo sentido muda conforme outra
resposta nunca vai junto com ela.

**5. Não executar nada** até ele confirmar, com todas as letras, que chegaram ao
entendimento comum. Sabatina não implementa.

### As quatro afiadas

Enquanto pergunta, fazer também:

- **Confrontar contra o glossário.** Termo que conflita com o `CONTEXT.md` se
  aponta na hora: *"teu glossário define 'cliente' como quem contrata; aqui você
  parece querer dizer quem usa. Qual dos dois?"*
- **Afiar linguagem vaga.** Termo impreciso ou sobrecarregado ganha proposta de
  nome canônico: *"você falou 'conta'. É o Cliente ou o Usuário? São coisas
  diferentes e vão virar tabelas diferentes."*
- **Estressar com cenário concreto.** Caso de borda específico, não hipótese
  genérica: *"e se o pagamento cair depois do cancelamento?"* É onde as
  fronteiras entre os conceitos aparecem.
- **Cruzar com o código.** Quando ele afirmar como algo funciona, conferir se o
  código concorda. Contradição achada vai pra mesa na hora.

### Quando parar

A sabatina acaba quando a fronteira esvazia: todo galho da árvore visitado e
nada assumido em silêncio. O que sobra é de **implementação**, não de
**decisão**. "Qual nome de variável" não é sabatina, é código. Chegou aí, fechar.

---

## Passo 3 · Gravar no instante em que resolve

**Não acumular pro final.** Resolveu, grava, avisa. Uma linha de aviso por
gravação:

> ✅ `CONTEXT.md`: **Pedido** definido.

### Termo resolvido → `CONTEXT.md`

Formato em [`referencias/formato-contexto.md`](./referencias/formato-contexto.md).
Carregar **na primeira gravação da sessão**, não antes.

O `CONTEXT.md` é glossário e nada mais: sem detalhe de implementação, sem spec,
sem rascunho. Definir o que a coisa **é**, não o que ela faz.

### Decisão dura → ADR em `docs/adr/`

Formato e critérios em [`referencias/formato-adr.md`](./referencias/formato-adr.md).

Só oferecer ADR quando os **três** forem verdade ao mesmo tempo:

1. **Difícil de reverter** — mudar de ideia depois custa caro
2. **Surpreendente sem contexto** — quem ler daqui a seis meses pensa "por que
   cargas d'água fizeram assim?"
3. **Fruto de trade-off real** — havia alternativa genuína e ela foi rejeitada
   por motivo específico

Faltou um dos três, pula. **Sessão sem nenhum ADR é normal e está certa.** ADR
demais tem o mesmo efeito de ADR nenhum: ninguém lê.

### Criação preguiçosa

Nada se cria adiantado. O `CONTEXT.md` nasce quando o primeiro termo se resolve.
O `docs/adr/` nasce quando o primeiro ADR é aceito. Sessão que não produziu
nenhum dos dois não deixa pasta vazia pra trás.

---

## Passo 4 · Fechamento

O que saiu da sessão se separa em três camadas, e elas **não** têm o mesmo peso:

| O que resolveu | Onde fica |
|---|---|
| Um termo: a palavra que este projeto usa pra uma coisa | `CONTEXT.md`, no instante em que resolveu |
| Uma decisão dura, surpreendente e com trade-off real | Um ADR em `docs/adr/` |
| Todo o resto que vocês combinaram | **Registro da sessão** (abaixo) |

### O registro da sessão

Essa terceira linha é a que se perde: o glossário não é spec, a maioria das
decisões não vira ADR, e o combinado evapora junto com a conversa.

Então, no fechamento, **sempre oferecer**:

> Fechamos {N} termos e {M} ADRs. Sobrou o combinado que não se qualifica pra
> nenhum dos dois. Gravo em `docs/decisoes/AAAA-MM-DD-{assunto}.md`?

Se sim, escrever cru e direto: **o que foi decidido, e a razão em uma frase.**
Sem seção, sem cerimônia, sem prosa. Números, garantias de ordem, valores padrão
e os "nãos" explícitos vão **exatamente como ele disse** — é aí que a precisão
costuma se perder ao virar texto bonito.

### Encerramento

Fechar dizendo o próximo passo concreto, **um só**:

- Mudança pequena o bastante → **implementar agora**
- Mudança grande → **quebrar em etapas** antes de tocar em código
- Documentação de repo → **varrer o resto do código** com o glossário novo na mão

---

## Modo sem rastro

Liga quando ele disser "sabatina rápida", "sem docs", "só me questiona", ou
`/grill --sem-docs`. Também é o fallback automático quando **não há raiz segura
pra gravar** (fora de repositório, ou raiz indefinida no Passo 0b).

Nesse modo: roda o Passo 2 inteiro, não escreve arquivo nenhum, e **avisa na
abertura** que nada vai ser gravado. Nunca cair nesse modo em silêncio.

---

## Deu certo se

- O `CONTEXT.md` mudou **durante** a sessão, termo a termo, não num bolo no fim
- O glossário lê como vocabulário puro, sem detalhe de implementação
- Pergunta que o código respondia foi respondida lendo o código, não perguntada
- Saíram **poucos ou nenhum** ADR, e os que saíram são decisões que dariam raiva
  de ter que rediscutir
- A skill contestou pelo menos uma palavra que ele usou

## Erros que matam a skill

| Erro | Como se manifesta | Correção |
|---|---|---|
| Rodada com pergunta dependente | Pergunta 3 só faz sentido depois da resposta da 1 | Fica para a próxima rodada |
| Uma pergunta por mensagem | Dez idas e voltas pra três decisões independentes | A fronteira inteira na mesma rodada |
| Pergunta sem recomendação | "O que você prefere?" | Sempre com o "eu iria de X porque Y" |
| Perguntar fato | "Que banco vocês usam?" com o schema no repo | Ler o repositório primeiro |
| Gravar no fim | Sessão inteira sem tocar em arquivo | Gravar no instante, avisar cada uma |
| ADR pra tudo | Seis ADRs numa sessão | Os três critérios, juntos, sem exceção |
| Encher o glossário | "Timeout", "Retry", "DTO" no `CONTEXT.md` | Só termo próprio deste domínio |
| Rastro silencioso | Entrevista boa, zero arquivo, ninguém notou | Passo 0c e o aviso a cada gravação |
