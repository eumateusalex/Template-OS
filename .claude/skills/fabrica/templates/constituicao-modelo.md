# Constituição do [PROJETO]

> Instalada pela `/fabrica` em [DATA]. Vale para todo código deste projeto.
>
> 🚨 **Cada princípio carrega a razão que o fez existir, e a razão é uma
> medição.** As razões abaixo descrevem o defeito real que cada princípio
> impede; troque pelas medições deste projeto quando ele tiver as próprias,
> sempre com data.
>
> 🚨 **O núcleo I a X não se remove.** O conferidor `specs` reprova a ausência
> ou a troca de ordem de qualquer um dos dez. MAJOR redefine; nunca apaga.

## Princípios

### I. Teste antes, sempre

- Toda tarefa de código MUST ter a tarefa de teste antes dela, no `tasks.md` e
  na execução.
- O teste MUST nascer vermelho, e o vermelho MUST ir para o `provas.md` da
  feature pelo `node fabrica/vermelho.mjs`, que o lê do relatório de máquina do
  runner. Quando não houve como ver o vermelho, a linha MUST dizer isso:
  `vermelho não visto: <razão>`.
- Nas quatro classes onde o verde pode mentir (conferidor de portão, regra de
  segurança, dinheiro, dado de terceiro), a **mutação** MUST deixar o teste
  vermelho de novo, registrada no cabeçalho do arquivo de teste.
- Nenhuma entrega fecha sem `node fabrica/portao.mjs` inteiro, com o comando
  sozinho na linha.

**Razão:** testes de isolamento entre contas podem passar semanas se pulando em
silêncio, com o portão verde por cima. Teste que nunca foi visto reprovando não
prova nada.

### II. Regra que importa vira código, não prompt

- O que não pode falhar MUST ser conferidor, ferramenta ausente ou decisão
  determinística, nunca instrução ao modelo.
- Regra nova que possa passar verde em silêncio MUST ganhar conferidor em
  `fabrica/portao/`, e o conferidor MUST ter prova plantada em
  `fabrica/provas/` que o vê reprovar.

**Razão:** um agente com o prompt proibindo algo por escrito ainda o faz de vez
em quando. Instrução é pedido; só a máquina garante.

### III. Monolito modular

- Este projeto MUST declarar as camadas em `fabrica/stack.mjs`, com a direção
  permitida de importação.
- Camada MUST NOT importar de quem não está na lista dela, e MUST NOT haver
  ciclo entre camadas.
- A exceção MUST ser declarada na linha do import
  (`// camada declarada: <razão>`), nunca em lista apartada.

**Razão:** conforme o código cresce, ele não cabe no contexto; sem camada
declarada, a arquitetura se perde um `if` de cada vez, e o agente deixa de
entender o projeto.

### IV. Nada nasce ligado

- Capacidade que fala com terceiro, gasta dinheiro ou manda mensagem MUST
  nascer desligada, e ligar MUST ser gesto explícito do dono.
- Nenhuma tarefa de implementação MUST ligar o irreversível.

**Razão:** capacidade que nasce ligada entra em produção sem ninguém ter pedido,
e o que fala com terceiro ou gasta dinheiro não se desfaz.

### V. O estado mora num lugar só

- O estado de uma feature MUST morar só no `tasks.md` dela.
- Documento vivo MUST NOT carregar contagem nem SHA: carrega o **comando** que
  responde, ou o número com a data na mesma unidade de texto.

**Razão:** documento de estado que carrega contagem vence em silêncio, e o
mesmo estado escrito em dois lugares diverge.

### VI. Conferidor que aprova sabe por que aprovou

- Verde medindo zero MUST ser tratado como vermelho: zero teste rodado, zero
  arquivo varrido e zero linha coberta são reprovação.
- "Não consegui medir" MUST ser reprovação, nunca conformidade.
- Passo pulado MUST imprimir a razão, e o portão MUST listar o que não rodou
  quando para.

**Razão:** um auditor que não conseguiu rodar e responde "tudo conforme" é o
verde mais caro que existe: ninguém volta para olhar.

### VII. Decisão de engenharia se escreve antes do código

- O `plan.md` MUST responder o catálogo de decisões de engenharia item a item,
  e "não se aplica: <razão>" é resposta válida.
- Decisão difícil de reverter, surpreendente sem contexto e fruto de trade-off
  real MUST virar ADR em `docs/adr/`.
- O `plan.md` MUST trazer o Constitution Check em **tabela**, uma linha por
  princípio, com `cumpre` / `não se aplica: <razão>` / `viola: <razão>`.
- Feature de tamanho **P** (até três arquivos de código, nenhum em área
  obrigatória, sem migration nem dependência nova) MAY dispensar o `plan.md`: a
  spec e as tarefas bastam, e o tamanho fica escrito na spec.

**Razão:** se ninguém especifica que quer cache, a IA não faz. Ela não tem visão de
produto. Se ninguém escrever que precisa de cache, de idempotência ou de fila
morta, ela não implementa nenhum dos três. A dispensa de P: numa feature de
produto a tabela paga, e num conserto de três arquivos ela é cerimônia.

### VIII. Observável por construção

- Erro MUST NOT ser engolido: `catch` vazio, `except: pass` e captura que só
  registra sem decidir MUST ter razão declarada na linha.
- Operação que fala com fora MUST deixar rastro com correlação.
- Alerta MUST ter canal declarado.

**Razão:** `catch` vazio sem razão escrita é comum em script que cresceu sem
régua. O defeito que some do log reaparece no telefone de quem usa, e aí já
custou a confiança de alguém.

### IX. Segurança é fronteira

- Entrada vinda de fora MUST ser validada na borda.
- Segredo MUST morar só no ambiente, e MUST NOT aparecer em log nem em erro.
- Permissão MUST ser conferida no servidor, nunca só na tela.
- Dependência MUST ser auditada, e licença de runtime incompatível reprova.

**Razão:** uma consulta sintaticamente perfeita, sem a cláusula da conta, mostra
a quem é membro de duas contas as linhas das duas.

### X. Simplicidade

- Dependência nova MUST trazer a razão escrita no `plan.md`.
- Abstração MUST esperar o terceiro uso.
- Arquivo MUST ter teto de tamanho, com isenção declarada na linha.

**Razão:** orquestração copiada em vez de extraída vira dívida que só aparece
na quarta cópia, quando já custa caro desfazer.

## Específico deste projeto

<!-- Os princípios XI em diante, se houver. Cada um com MUST e **Razão:** datada. -->

## Onde os artefatos moram

| Artefato | Lugar | Papel |
|---|---|---|
| pasta de trabalho da feature | `specs/<NNN>-<nome>/` | spec, plano (M e G), tarefas |
| o recibo da feature | `specs/<NNN>-<nome>/provas.md` | o vermelho de cada tarefa, gravado pelo `vermelho.mjs` |
| a mutação de cada `[M]` | o cabeçalho do arquivo de teste | onde o `mutar.mjs --registrar` escreve |
| os relatórios da revisão | `specs/<NNN>-<nome>/revisoes/<lente>[-rodada-N].md` | o que cada revisor leu e achou |
| a fusão das lentes | `specs/<NNN>-<nome>/revisoes/fusao.json` | o veredito da rodada, o teto e o que ficou aberto |
| o que o dono viu e aceitou | `specs/<NNN>-<nome>/ACEITO.md`, quando existir | não volta em rodada nova |
| glossário | `CONTEXT.md` | o que cada termo **é** |
| decisão cara de reverter | `docs/adr/NNNN-*.md` | com "o que não decide" e "quando reabrir" |
| o resto do combinado | `docs/decisoes/AAAA-MM-DD-*.md` | cru e datado |
| a máquina do portão | `fabrica/` | kit instalado, conferido por sha |
| os parâmetros do projeto | `fabrica/stack.mjs` | o único arquivo de `fabrica/` que é seu |

## Fluxo de trabalho

1. **Spec**, com o tamanho (P, M, G). **Parada do dono** quando a spec carrega decisão que é do dono.
2. **Plano** (M e G), com Constitution Check em tabela e decisões de engenharia respondidas.
3. **Tarefas**, teste antes de cada tarefa de código, `[M]` nas quatro classes.
4. **Construção**: `node fabrica/vermelho.mjs` antes do código, verde, refatora, `node fabrica/mutar.mjs --registrar` nas `[M]`.
5. **Portão** inteiro, verde, e o commit.
6. **Revisão**: arquitetura, segurança e código em todo tamanho, em paralelo, e `node fabrica/fundir-revisoes.mjs`.
7. **Entrega**, com veredito. **Parada do dono.**
8. **Fechar**: ADR se couber, e as decisões.

## Governança

- Esta constituição cede ao `CLAUDE.md` deste projeto em caso de conflito, e se
  emenda no mesmo commit que emendar a regra correspondente lá.
- Versão semântica: MAJOR redefine princípio do núcleo; MINOR acrescenta
  princípio ou seção; PATCH esclarece redação.
- Conflito com a constituição é achado da lente de arquitetura, de gravidade 2
  no mínimo.

**Versão**: 1.0.0 | **Ratificada**: [DATA] | **Última emenda**: [DATA]
