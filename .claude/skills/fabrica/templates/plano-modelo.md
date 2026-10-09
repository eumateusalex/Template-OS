# Plano · [FEATURE]

> Só em tamanho M e G. Em P não existe plano: a spec e as tarefas bastam, e as
> regras S4 e S5 só valem quando este arquivo existe.

## Como

<O desenho em poucos parágrafos: o que muda, onde, e o que joga contra.
Dúvida resolvida sozinho entra aqui, com a alternativa que perdeu.>

## Contexto técnico

<!-- Uma linha cada. O que ainda não se sabe vira pergunta na spec, não palpite aqui. -->

- **Linguagem e versão:** [ex.: Node 24, TypeScript]
- **Dependências principais:** [ex.: Next 16, Supabase]
- **Onde guarda:** [ex.: Postgres no Supabase, arquivo, nada]
- **Onde roda:** [ex.: navegador no celular, servidor, CLI no Windows]
- **Metas de desempenho:** [ex.: a agenda abre em menos de 1 s no 4G; ou "nenhuma que decida"]
- **Escala:** [ex.: 150 alunos, 3 barbeiros, 10 mil linhas; o número real, não o sonhado]

## Modelo de dados e contratos

<!--
Em G, e em M quando a feature guarda dado ou fala com serviço de fora. É o
desenho TÉCNICO do que a spec descreveu em "Dados" e "Serviços de fora": a
spec diz o que se guarda; aqui se diz como. Sai quando não se aplica.
-->

### Dados

| Entidade | Campos (nome: tipo) | Regras (obrigatório, único, limite) | Liga com | Quem lê e escreve (a regra de acesso) |
|---|---|---|---|---|
| [agendamento] | [inicio: data e hora; estado: marcado, veio, faltou] | [um horário por barbeiro] | [cliente, serviço] | [o dono lê todos; o cliente, os dele] |

**Migração:** [o que muda no que já existe, e como volta se der errado; ou "banco novo"].

### Contratos

<!-- Toda entrada e saída que alguém de fora chama ou que o sistema chama fora: rota, evento, mensagem, webhook. -->

| Contrato | Entrada | Saída | Erros e o que o chamador vê |
|---|---|---|---|
| [POST /agendamentos] | [barbeiro, serviço, horário, telefone] | [o agendamento criado] | [409 se o horário acabou de ser pego] |

## Constitution Check

| Princípio | Estado | Como |
|---|---|---|
| I. Teste antes, sempre | cumpre | |
| II. Regra que importa vira código, não prompt | cumpre | |
| III. Monolito modular | cumpre | |
| IV. Nada nasce ligado | cumpre | |
| V. O estado mora num lugar só | cumpre | |
| VI. Conferidor que aprova sabe por que aprovou | cumpre | |
| VII. Decisão de engenharia se escreve antes do código | cumpre | |
| VIII. Observável por construção | cumpre | |
| IX. Segurança é fronteira | cumpre | |
| X. Simplicidade | cumpre | |

<!--
Só três estados valem, e o conferidor `specs` (S4) reprova qualquer outro:
  cumpre
  não se aplica: <razão>
  viola: <razão>
A régua acha as colunas pelo cabeçalho ("Princípio", "Estado"), e aceita uma
coluna "#" com o número. Princípio próprio do projeto (XI em diante) entra
como linha a mais.
-->

## Decisões de engenharia

<!--
O catálogo inteiro, com o que cada item pergunta, está em
.claude/skills/fabrica/referencias/decisoes-de-engenharia.md.
"não se aplica: <razão>" é resposta completa. Em branco, não (S5).
-->

| Decisão | Resposta | Razão |
|---|---|---|
| cache | | |
| idempotência | | |
| retentativa e fila morta | | |
| fila ou síncrono | | |
| CQRS | | |
| tempo real | | |
| paginação | | |
| concorrência | | |
| migração | | |
| fuso e horário | | |
| dinheiro | | |
| autenticação e autorização | | |
| limite de taxa | | |
| observabilidade | | |
| backup e restauração | | |
| desligado por padrão | | |
| dependência nova | | |
