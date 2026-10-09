---
name: abrir
description: Abre a sessão de trabalho. Carrega a memória que o _memoria/README.md manda ler, confere o estado vivo do workspace (trabalho sem commit, outras sessões, pendências, lixeira vencendo) e devolve um painel curto do que importa hoje. Use para "abrir", "começar o dia", "bom dia", "/abrir" ou no primeiro turno de uma sessão de trabalho.
---

# /abrir: abertura da sessão

A abertura carrega o contexto e mostra, numa tela, o que o usuário precisa saber
ou decidir antes de escolher o que fazer. Ler não se anuncia: o contexto se usa.

## 1. Carregar a memória pelo contrato

Ler o `_memoria/README.md` e os módulos que ele manda ler **em toda sessão**. A
lista mora lá, e só lá: esta skill não a repete, para não envelhecer quando a
memória mudar. Os módulos de tarefa (conteúdo, copy, venda) ficam para a tarefa
que os pedir.

**Memória em branco** (o campo `**Nome:**` de `_memoria/empresa.md` ainda com
`*(a definir)*`): o workspace ainda não foi instalado. O painel vira uma frase
só, na linguagem de quem nunca viu isto, e para:

> "Este espaço ainda não conhece você. Digite `/instalar` e eu faço umas
> perguntas, no seu tempo. Tem um modo rápido, de cinco."

Outro módulo de sessão vazio (a estratégia, as preferências) vira a primeira
linha do painel, com a oferta de preencher agora pelo `/memoria registrar`, e a
abertura segue: falta de estratégia escrita não trava trabalho.

## 2. Medir o estado vivo

Tudo só leitura, em paralelo:

| O quê | Como |
|---|---|
| onde paramos | `git log --since=yesterday --format="%h %s"` na raiz: o último bloco fechado |
| trabalho sem commit | `git status --short` e `git log @{u}..` na raiz (sem remoto, só o status); nos repositórios de `projetos-pessoais/` e `clientes/`, o que tem mudança ou commit sem push (`git -C <repo> status --short` e `git -C <repo> log @{u}..`) |
| outras sessões | `ListAgents`, a ferramenta do Claude Code que lista as sessões abertas no workspace e em que pasta, quando a sua versão a tiver. Sem ela (versão sem a ferramenta, ou num subagente), `git worktree list` e as conversas de `~/.claude/projects/` mudadas na última hora; a sessão que abriu você não conta como outra |
| o que depende do usuário | as "Pendências" e o "Próximo passo" de `_memoria/estrategia.md`, e os `[REVIEW]` que o `node scripts/confere-memoria.mjs` conta |
| a lixeira | `lixeira/_manifesto.md`: os itens que vencem os 14 dias de quarentena nos próximos 7 (esvaziar é pedido do usuário) |
| as frentes | o "Estado das frentes" de `_memoria/estrategia.md`: só as ativas ou com problema |

Commit sem push num projeto onde push é deploy não é defeito: aparece com o
motivo que a frente diz em `_memoria/estrategia.md` ("Estado das frentes").

## 3. Devolver o painel

Começa pelo veredito, em uma frase, e o resto vai em tabela:

```
<Nome>, <tudo em ordem | N coisas pedem você hoje>.

**Foco:** <o próximo passo da estratégia, uma frase>
**Onde paramos:** <o último bloco, uma frase>

| Pede você | Onde |
|---|---|
| <pendência que depende do usuário> | <arquivo ou comando> |

| Workspace | Estado |
|---|---|
| trabalho sem commit | <o quê, ou "nada"> |
| outras sessões | <quais, ou "nenhuma"> |
| lixeira | <o que vence até DD/MM, ou "nada vence esta semana"> |
| memória | <N [REVIEW], ou "em dia"> |

Por onde começamos?
```

O `<Nome>` é o primeiro nome do campo `**Nome:**` de `_memoria/empresa.md`.

## Regras

- **Cabe numa tela:** só entra linha que pede atenção ou decisão; tabela vazia
  some, e linha "nada a apontar" fica só na tabela do workspace.
- **Não listar os arquivos lidos** nem dizer que leu.
- **Não pergunta nada além do fecho**, a não ser que algo bloqueie o trabalho
  (sessão paralela mexendo no mesmo lugar, módulo de sessão vazio).
- **Marca visual não configurada** não entra no painel (o sinal é o
  `.claude/skills/carrossel/marca/tokens.css` <!-- caminho futuro: nasce no /carrossel configurar -->
  faltar ou ainda ter a linha `ESTADO: nao-configurado`, que o `/carrossel
  configurar` apaga): vira assunto quando uma skill visual for usada, e quem
  avisa é a própria skill.
- **Não executa nada:** a abertura mede e mostra. Esvaziar lixeira e publicar
  são pedido do usuário; o commit fica para o bloco de trabalho.
