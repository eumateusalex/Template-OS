---
name: sanitizacao
description: Sanitiza, organiza e padroniza o workspace, uma pasta ou um repositório (faxina), ou só reconcilia os documentos de contexto com a realidade (check-up). Use para sanitização, faxina, limpeza, organização, "atualiza", "varre o projeto", check-up ou reconciliação do CLAUDE.md, da memória, da marca e dos READMEs.
---

# /sanitizacao: faxina e check-up

Uma skill, dois modos, a mesma régua: o que está escrito descreve o que existe.

| O pedido | Modo | Autonomia |
|---|---|---|
| "sanitiza", "faxina", "limpeza", "organiza", "padroniza", "limpa <alvo>" | **faxina** | roda do início ao fim e volta com o relatório |
| "atualiza", "varre o projeto", "check-up", "o contexto está certo?" | **check-up** | só documento de contexto: lista o que diverge e aplica com o aval do usuário |

As regras de git e de descarte são as do `CLAUDE.md` da raiz; esta skill não as
repete. O que autoriza a autonomia da faxina é que **todo descarte tem volta**:
o rastreado volta pelo git, e o que não está no git passa pela `lixeira/`.

---

## Modo check-up

Compara o que os documentos de contexto afirmam com o estado real do workspace e
propõe a correção, linha a linha. Não apaga nem move nada: só documento.

1. **Rodar as réguas mecânicas:** `node scripts/confere-memoria.mjs` (a
   memória) e `node scripts/confere-contexto.mjs` (o teto do `CLAUDE.md`, o
   diário, o caminho que não existe, a descrição longa de skill).
2. **Conferir à mão o que elas não alcançam:**
   - a estrutura de pastas que o `CLAUDE.md` declara × o `ls` da raiz;
   - as skills e os agentes que o `CLAUDE.md` e o `README.md` citam ×
     `.claude/skills/` e `.claude/agents/` (skill sem menção, menção sem skill,
     descrição que diz outra coisa);
   - todo caminho citado entre crases nos READMEs (os documentos operacionais o
     `confere-contexto` já mede) existe, ou leva `<!-- caminho futuro: <razão> -->`
     na mesma linha;
   - os READMEs que mapeiam pastas (`README.md` da raiz, `scripts/README.md`,
     `clientes/README.md`, `projetos-pessoais/README.md`, `marketing/README.md`,
     `saidas/README.md`) × o que existe nelas;
   - o `identidade/design-guide.md` × onde a marca mora de fato
     (`.claude/skills/carrossel/marca/`);
   - a marca visual, quando já configurada: a logo, a voz de narração e as
     recusas visuais de `.claude/skills/carrossel/marca/marca.md` <!-- caminho futuro: nasce no /carrossel configurar -->
     continuam coerentes com as últimas peças, e ele não repete o que mora na
     `_memoria/` (nome, @, voz, público, oferta, CTA)? ⚠️ **Cor e fonte não se editam
     aqui:** quem é dono dos tokens é o `/carrossel configurar`, que mede o
     contraste antes de gravar. O check-up aponta a divergência e sugere rodar
     a entrevista de novo;
   - os arquivos recentes (últimos 30 dias) em `clientes/<x>/`, `saidas/` e
     `marketing/`: cliente, projeto ou frente que existe no disco e não existe
     no contexto, ou o contrário.
3. **Chamar a `/memoria auditar`** para a `_memoria/` (inclusive a
   auto-memória do Claude), em vez de reimplementar, e trazer o resultado para
   a mesma lista.
4. **Entregar a lista** no formato abaixo e aplicar só com o aval do usuário,
   editando só a linha relevante e mostrando o diff. Mudança na `_memoria/` sai
   pelo `/memoria registrar`, que acha o módulo dono.

```
Foram identificados N pontos para atualização:

1. CLAUDE.md — a estrutura de pastas cita <pasta>, que não existe mais
2. scripts/README.md — <script> existe e não tem linha
3. _memoria/estrategia.md — a prioridade "fechar o 1º cliente" já se cumpriu: há 3 pastas em clientes/

Aplico todos, alguns ou nenhum?
```

**Registrar é substituir:** a frase que deixou de ser verdade sai, sem "antes
era X" ao lado. Sem evidência no workspace, não se registra; evidência ambígua
(uma pasta vazia chamada "cliente novo") vira pergunta. Se nada diverge: "Está
tudo coerente, nada a atualizar".

---

## Modo faxina

Sanitiza (tira o que morreu), organiza (põe cada coisa no lugar) e padroniza
(adota a convenção que já vige). Não refatora lógica, não faz upgrade, não
introduz padrão novo: o comportamento observável é idêntico no fim.

### As paradas (as únicas)

1. **Apagar em definitivo** o que não está no git (esvaziar a lixeira): só com
   pedido do usuário, e só o que cumpriu os 14 dias de quarentena.
2. **Descarte sem volta**: conteúdo publicado ou entregue, arquivo que não se
   reconstrói (imagem gerada por IA, gravação, captura manual) e que não está no
   git. Pergunta caso a caso, no fim, junto do relatório.
3. **Superfície pública**: rota, endpoint, env var, chave, nome de tabela ou
   coluna, contrato de retorno, nome de pacote, conta de produção. **Não se
   mexe**; se limpar exigiria tocar nisso, não limpe.
4. **Reestruturação de `_memoria/`, `identidade/` ou `CLAUDE.md`**: é obra
   grande, e o `CLAUDE.md` manda propor e validar antes de editar. Numa rodada
   comum, desses três só se corrige referência quebrada e fato vencido, e a
   `_memoria/` só pela `/memoria`.

Fora disso, decida e siga. Dúvida se resolve com a melhor escolha, registrada no
relatório.

### Regras invioláveis

1. **Escopo é só o alvo nomeado.**
2. **Só descarte o que você PROVOU morto.** Não provou e não está no git → vai
   para a lixeira marcado `⚠️ NÃO PROVADO MORTO`; essa entrada só sai da
   lixeira com o usuário citando o item pelo nome.
3. **Nunca tocar credenciais** (`scripts/.env` e similares) **nem `templates/`**
   (os modelos de que a criação de skills parte: "ninguém cita" é o normal
   deles). Segredo exposto não se apaga sozinho, porque apagar não revoga:
   deixe funcionando, ponha no `.gitignore` o que for local, e registre como
   achado de segurança. Nunca reescrever histórico do git.
4. **Convenção é a maioria vigente do alvo.** Empate, mantenha. Nunca importe
   padrão de fora (nem do workspace para o cliente, nem de um projeto para
   outro).
5. **Unificação sem generalização.** Três ou mais ocorrências idênticas: unifique
   na fonte natural que já existe. Duas parecidas: deixe.
6. **Guarda de recência:** nada modificado nos últimos **7 dias** entra em
   descarte ("verificado, mantido, recente" no relatório). A exceção é resíduo de
   trabalho já fechado que nenhuma sessão ativa toca: esse vai para a lixeira ou
   sai por `git rm`, e o relatório diz que trabalho o gerou.
7. **Travou? Pule, registre como pendência, siga.** Nunca mude arquitetura para
   destravar.
8. **Sem resíduo e sem diário.** Nada de `.old`, `.bak`, `_v2`, `_final`, código
   comentado, import ou dependência sem uso, asset órfão, TODO sem dono.
   Comentário fica quando diz o porquê, a restrição ou o comportamento
   surpreendente; sai quando narra a história do arquivo.
9. **Commit por bloco fechado**, pela regra de git do `CLAUDE.md`: cada lote
   verificado num commit que diz o que saiu e por quê. **Push só se o
   repositório não publica no push**: onde o push é deploy, o push é do usuário.

### Fase 0: alvo, blindagem e pontos cegos

O usuário nomeia o alvo ("roda a sanitização no projeto X", "no workspace
inteiro", "em `marketing/`"):

| Alvo | O que se limpa | Como se prova |
|---|---|---|
| **Raiz do workspace** | conteúdo, drop zone, render, cópia, documento defasado | md5, contagem, grep, entrypoints, os testes e portões que o workspace tiver |
| **Repositório aninhado** (`projetos-pessoais/<x>`, `clientes/<x>`) | tudo acima **+ código**: import morto, dependência órfã, barrel vazio | baseline comparada: build, teste, exports, rotas, o portão dele |
| **Pasta específica** | o que couber nela | o que houver |

⚠️ **Em `clientes/<x>` manda o `CLAUDE.md` do cliente**, e o descarte vai para a
lixeira do próprio repositório dele. Nada de cliente atravessa para o
workspace, nem no sentido contrário.

**Blindagem:** `git status` do alvo (sujo é trabalho legítimo de antes, e fica
fora dos commits desta rodada) e as outras sessões abertas: sessão paralela no
mesmo alvo muda o disco embaixo da medição. A ferramenta que lista as sessões é
o `ListAgents`, quando a sua versão do Claude Code a tiver; sem ela,
`git worktree list` e as conversas de `~/.claude/projects/` mudadas na última
hora.

**Baseline**, no scratchpad da sessão (**nenhuma pasta nova no workspace**):
árvore e tamanho por pasta, `git status --short`, os testes e portões do alvo e
o resultado (vermelho de antes anotado como de antes) e, em código, rotas,
exports, env vars, build e testes. Sem baseline não há prova; alvo sem build
nem teste tem a árvore e a contagem como baseline, e o relatório diz isso.

**Inventário de entrypoints antes de chamar algo de morto.** Busca por
referência não enxerga o que é chamado de fora do código, e "ninguém cita,
ninguém lê" é critério que apaga arquivo vivo. Liste o que é apontado por:

- CI (`.github/workflows/`) e deploy (`Dockerfile`, `docker-compose*`,
  `vercel.json`, `netlify.toml`, painel de deploy)
- agendador: crontab (inclusive de servidor), worker, job, fila, e o script de
  envio para servidor que cita arquivo por caminho
- `package.json` scripts, migrations, seeds, fixtures
- config que aponta arquivo por string (`.mcp.json`, JSON, YAML, `.env*`)
- `.claude/settings.json` e junções (em `.claude/agents/`, `.claude/skills/`,
  `projetos-pessoais/`): o git as segue, a busca não
- import dinâmico, caminho montado em runtime, plugin carregado por pasta

Tudo nesse inventário é intocável na rodada. O que é acessado de um jeito que a
busca estática não vê e não está no git vai para a lixeira, com o motivo
começando por `⚠️ NÃO PROVADO MORTO`.

### Fase 1: primeira passada

**Leia o alvo inteiro antes de editar.** Mapeie: morto, duplicado, fora de
lugar, fora do padrão, documento defasado, segredo exposto.

| Categoria | Critério | Destino |
|---|---|---|
| **Entrypoint** | está no inventário | intocável |
| **Publicado/entregue** | registro externo (post no ar, entrega aceita) | rastreado: `git rm`; fora do git: parada 2 |
| **Rascunho substituído** | nunca publicado, função cumprida por outra versão | `git rm` ou lixeira |
| **Drop zone processada** | arquivo em `dados/` cujo valor já virou artefato | lixeira |
| **Duplicata** | mesmo arquivo em dois lugares sem função distinta (md5) | consolidar; asset replicado por caminho relativo não é duplicata |
| **Temporário** | `*.tmp`, `*.log`, saída de teste, render de conferência | apagar se regenerável; senão lixeira |
| **Regenerável** | saída que um comando refaz | apagar, com o comando no relatório |
| **Código morto** | sem consumidor e fora do inventário | remover |
| **Documento defasado** | cita o que não existe, descreve estado vencido, narra história | corrigir no presente |

**Ordem de cada lote:** mover/remover → corrigir todas as referências → rodar
build, teste e portão → conferir → commit. 🚨 **Conferidor aponta para o alvo
novo antes da mudança:** conferidor que perde o alvo passa a dizer "sem erros"
sem olhar nada. Build quebrado não avança: conserte, ou desfaça o lote e mande o
item para a lixeira como alto risco.

Junto vai o check-up dos documentos do alvo (o modo acima), com uma diferença:
na faxina, correção de documento é edit livre, sem esperar o aval. Documento que
cita saída regenerável aponta o **comando** que a refaz, não o caminho. A
`_memoria/` continua só pela `/memoria`, e só se sinaliza: data vencida ou
pendência resolvida vira item do relatório, nunca descarte.

### Fase 2: segunda passada (obrigatória)

Refaça o mapeamento do zero sobre o alvo reorganizado e procure o que só agora
aparece: consumidor que saiu levando o import, dependência que só servia ao
código removido, caminho antigo em config, teste, CI, cron ou documento, pasta
vazia. **Se não achar nada, diga isso; não invente achado.**

### Fase 3: prova

Compare contra a baseline (árvore, rotas, exports, env vars, build, testes,
contagem) e confirme **zero referência ao caminho antigo**. Divergência não
intencional é bug seu. 🚨 **Declare o nível de verificação**: o que foi provado
por teste, por build, por md5 ou contagem, por leitura, e o que ficou na
inferência. A régua é medir: "135.609 antes, 135.609 depois", "os 4 são byte a
byte idênticos".

### Fase 4: relatório e paradas

Uma rodada de perguntas no fim (AskUserQuestion, uma por decisão): o descarte
sem volta, item a item, e esvaziar a lixeira se houver item vencido.

**Relatório**, sem introdução nem elogio:

1. árvore antes → depois, e espaço liberado
2. removidos, um por linha, com o motivo
3. unificados
4. lixeira: o que entrou e até quando fica
5. achados de segurança
6. build, testes e portões antes × depois
7. o que a segunda passada achou (ou "nada")
8. o nível de verificação alcançado
9. pendências (o que travou e foi pulado) e o que pede decisão do usuário

Se a rodada mudou estrutura ou regra, oferecer a atualização do `CLAUDE.md` ou
da memória.

---

## O manifesto da lixeira

O `lixeira/_manifesto.md` lista **só o que está na lixeira agora** (ele é
versionado, e a história de cada linha fica no `git log` dele). Cada movimento
registra a linha no mesmo passo:

```markdown
| Item | Origem | Data | Motivo |
|---|---|---|---|
| `<AAAA-MM-DD>-<assunto>/` | `caminho/original/` | DD/MM/AAAA | o que é, por que saiu, o que foi conferido, como se refaz. Apagar a partir de DD/MM/AAAA, com aprovação. |
```

- **Mover e registrar no mesmo passo.** Pasta na lixeira sem linha é anomalia.
- **Nome:** `<AAAA-MM-DD>-<assunto>/`, com a estrutura interna de origem.
- **O motivo é denso de propósito:** a prova (md5, contagem), o que não foi
  tocado e por quê, e como se refaz. É ele que permite restaurar com confiança.
- **Apagado em definitivo** ou **restaurado**: a linha sai.

## Checklist da faxina

- [ ] Alvo e escopo respeitados; baseline salva antes da primeira edição
- [ ] Inventário de entrypoints feito ANTES de classificar algo como morto
- [ ] Nada dos últimos 7 dias descartado
- [ ] Todo movimento para a lixeira com a linha no manifesto
- [ ] Conferidor apontado para o alvo novo antes da mudança
- [ ] Segunda passada feita e reportada
- [ ] Prova contra a baseline, com o nível de verificação declarado
- [ ] Zero referência ao caminho antigo; commit por bloco fechado
