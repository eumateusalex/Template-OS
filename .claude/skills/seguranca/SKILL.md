---
name: seguranca
description: >
  Segurança de sistemas, aplicações e código, em quatro modos: auditar o que já
  existe, construir seguro desde o zero, liberar antes de publicar, e operar
  depois no ar. Use quando o usuário pedir
  "auditar segurança", "meu sistema está seguro", "revisar antes de publicar",
  "conferir RLS", "achar vulnerabilidade", "checklist de segurança", "LGPD",
  "vazou uma chave", "revisão de segurança", "pentest", "hardening", ou
  /seguranca.
---

# /seguranca — Segurança de sistemas, aplicações e código

> Genérica de propósito: serve qualquer projeto, stack ou organização. O
> específico entra por perfil, nunca na espinha. Ela é um **operador**, não um
> manual: detecta o alvo, seleciona o que se aplica, executa e devolve achado
> com prova.

**Fluxo:** modo → perfil → **plano aprovado** → verificar → **refutar** →
classificar → entregar por severidade, com evidência.

---

## O que esta skill cobre

**O mapa vivo sai por comando, e nunca se escreve à mão:**

```bash
node .claude/skills/seguranca/scripts/requisitos.js --familias
```

Ele devolve cada família com o nome, quantos requisitos tem, a distribuição por
nível e **qual superfície a ativa** — que é o que decide se ela aparece no
plano de um projeto ou não.

As famílias se agrupam em seis eixos. Serve para saber onde procurar, não para
substituir o comando:

| Eixo | Famílias |
|---|---|
| **Quem entra, e o que pode** | `IDN` identidade · `SES` sessão · `ACC` autorização |
| **O que entra, e o que sai** | `VAL` validação · `FIL` arquivos · `OUT` saída e erro · `NET` rede e borda |
| **O dado** | `DAT` acesso · `INT` integridade · `CRY` criptografia · `SEC` segredos |
| **O sistema em si** | `ARQ` arquitetura · `BIZ` lógica de negócio · `AIA` IA e agentes · `CLI` superfícies cliente · `ENV` ambientes · `RES` resiliência · `SUP` cadeia de suprimento |
| **Saber que aconteceu** | `LOG` registro · `MON` monitoramento · `IRP` incidente · `BCP` continuidade · `VER` verificação · `VUL` vulnerabilidade |
| **Quem responde** | `GOV` governança · `RSK` risco · `AST` ativos · `CMP` conformidade · `TPR` terceiros · `PPL` pessoas · `PHY` físico · `SDL` ciclo seguro · `THR` ameaça · `MET` métricas |

**A economia que sustenta tudo:** um site de uma página ativa um punhado de
requisitos; um sistema com login, banco, pagamento e modelo de linguagem ativa
mais de cem. Quem decide é o perfil detectado, nunca quem opera.

### As três réguas de completude

O catálogo não se declara completo: ele é **medido**, contra três réguas
externas a ele. É o que impede a skill de crescer só naquilo que quem escreve
já conhece.

| Régua | Responde | Comando |
|---|---|---|
| **As cinco propriedades** | O que se protege | conferida pelo verificador |
| **As âncoras normativas** | Contra que lista se mede | `--cobertura` |
| **Os dez princípios** | Por que cada controle existe | `--principios` |

A terceira fecha a lacuna que as duas primeiras deixam: princípio que nenhum
requisito cobra fica só no papel, e o `--principios` cobra cada um. **Régua que
ninguém mede é promessa.**

---

## Passo 0a · Que momento é esse?

Antes de abrir qualquer arquivo, identificar o modo. Cada um carrega **a
referência dele**, nunca todas.

**A única que se soma a essas quatro é `achados.md`**, e só nos dois modos que
produzem achado — auditar e publicar. Ela entra no passo de classificar, não
antes: carregar a régua antes de existir o que classificar é gasto de contexto
sem retorno.

| Modo | Gatilhos típicos | Carrega |
|---|---|---|
| **Auditar** | "meu sistema está seguro?", "revisa a segurança", "acha vulnerabilidade", "conferir RLS", "auditoria" | `referencias/auditar.md` |
| **Construir** | "projeto novo", "vou começar um sistema", "que regras de segurança colocar", "spec de segurança" | `referencias/construir.md` |
| **Publicar** | "vou subir pra produção", "antes de lançar", "revisão antes do deploy", "pode publicar?" | `referencias/publicar.md` |
| **Operar** | "como monitorar", "vazou uma chave", "acho que fui invadido", "o que fazer agora" | `referencias/operar.md` |

Não encaixa em nenhum: perguntar, não adivinhar. Encaixa em dois ("vou publicar
e quero auditar antes"): rodar auditar → publicar.

🚨 **Incidente em andamento tem precedência sobre tudo.** Credencial vazada,
acesso indevido em curso, dado exposto agora → direto para
`referencias/operar.md`, seção da primeira hora.

---

## Passo 0b · Qual é o alvo?

Sem isso a skill vira manual genérico e cara. **Sempre rodar antes de opinar:**

```bash
node .claude/skills/seguranca/scripts/perfil.js <projeto>            # legível
node .claude/skills/seguranca/scripts/perfil.js <projeto> --json > perfil.json
```

Devolve: stack · superfícies presentes, com a prova de cada · nível sugerido ·
famílias ativas · o que não se aplica · variáveis de ambiente por nome ·
exceções registradas.

**Ler o campo `confirmada` de cada superfície.** Superfície sustentada só por
menção em conteúdo entra como *possível*: confirmar com o usuário antes de
tratar como certa. Melhor perguntar que gastar contexto com o que não existe.

---

## Passo 1 · Apresentar o plano e esperar aprovação

**Trava obrigatória. Nenhuma verificação começa antes disto.**

```bash
node .claude/skills/seguranca/scripts/requisitos.js --plano --perfil perfil.json
```

O plano já responde, antes de qualquer ação: o que foi identificado · o que será
verificado e por qual método · **o que custa** · o que fica de fora · decisões já
registradas · o que se precisa do usuário.

### Os quatro níveis de verificação

| Nível | O que faz | Efeito | Autorização? |
|---|---|---|---|
| **A** | Lê arquivo, configuração, histórico do repositório | Nenhum | Não |
| **B** | Observa o sistema rodando: requisição de leitura, cabeçalho, pacote publicado | Nenhum | Não |
| **C** | Usa contas de teste, gera dado de teste | **Cria registro na base** | **Sim** |
| **D** | Requisição forjada, tentativa de violação, consumo de recurso | **Efeito real em produção**: bloqueio de conta, crédito pago, estado alterado | **Sim, e dizer o ambiente** |

**A e B podem rodar junto com o levantamento** — são inofensivos e produzem a
maior parte dos achados baratos. Chegar com alguns achados concretos junto do
plano ajuda quem decide.

```bash
node .claude/skills/seguranca/scripts/requisitos.js --verificacao A,B --perfil perfil.json
```

**C e D só depois de aprovação explícita.** Sem ela, esses requisitos ficam como
**não verificado** no relatório — o que é honesto e continua útil, mas não é
conforme, e o relatório precisa dizer isso.

**Escopo que cresce volta para aprovação.** Apareceu superfície que o perfil não
pegou? Voltar ao 0b, refazer o perfil, reapresentar o plano.

---

## Onde as coisas moram

| O quê | Onde | Abrir quando |
|---|---|---|
| **Os requisitos (a única fonte)** | `dados/requisitos.json` | Nunca direto: só por script |
| Réguas de completude | `dados/ancoras.json` · `dados/principios.json` | Só via `--cobertura` e `--principios` |
| Detector de superfície · consulta · auto-teste | `scripts/perfil.js` · `scripts/requisitos.js` · `scripts/verifica.js` | Sempre, no passo certo |
| Gerador do documento | `scripts/relatorio.js` | Ao entregar. É a única classe de script que escreve |
| Procedimento de cada modo | `referencias/auditar.md` · `construir.md` · `publicar.md` · `operar.md` | Depois de identificar o modo |
| **A régua que separa achado de ruído** | `referencias/achados.md` | **No passo de classificar, em auditar e publicar.** Cinco passos: de onde vem o valor · o ambiente já neutraliza · isso roda · a refutação · o corte de confiança. Traz também os nove ângulos da caça |
| Onde cada controle mora em cada tecnologia | `referencias/stacks.md` | Só a seção do stack detectado, e só quando a implementação concreta importar. A primeira pergunta dela é a que mais muda o resto: **o cliente alcança o banco diretamente?** Guarda também as duas tabelas que valem para qualquer stack: **os prefixos de credencial** que fazem a busca por segredo funcionar, e **o comando de auditoria de dependência de cada ecossistema** |
| Princípios, propriedades, níveis | `referencias/fundacao.md` | Modelagem de ameaça, ou dúvida sobre o que é nível N1/N2/N3 |
| Prompts de diagnóstico e auditoria adversarial | `referencias/prompts.md` | Quando a verificação manual empacou |
| **O documento de entrega** | `referencias/relatorio.md` | **No passo 8 de auditar**, ao gerar o relatório. Traz o contrato do `achados.json` e as três travas do gerador |
| Modelo do arquivo de exceções | `referencias/exemplo-excecoes.json` | Ao propor registrar a primeira exceção. **Duas grafias de campo são aceitas**, e a não-canônica gera aviso |
| Manutenção da skill e vocabulário do relatório | `referencias/manutencao.md` | Ao **mexer** na skill, ou se o projeto auditado usar "nível"/"token"/"política" com outro sentido |
| **Contrato de construção do catálogo** | `referencias/arquitetura.md` | Só para escrever requisito novo |
| A régua de número e os números citáveis | `referencias/numeros.md` | Antes de citar estatística ou número de padrão em relatório. Número sem fonte primária não entra, e a ressalva vai junto |

---

## Como consultar o catálogo

```bash
node .claude/skills/seguranca/scripts/requisitos.js --plano --perfil perfil.json  # O PLANO, antes de agir
node .claude/skills/seguranca/scripts/requisitos.js --familias                    # o mapa: o que cada família cobre
node .claude/skills/seguranca/scripts/requisitos.js --resumo                      # o que existe hoje
node .claude/skills/seguranca/scripts/requisitos.js --perfil perfil.json          # o que se aplica ao alvo
node .claude/skills/seguranca/scripts/requisitos.js --familia ACC --nivel N2      # por família e nível
node .claude/skills/seguranca/scripts/requisitos.js --severidade critica          # só o que mata
node .claude/skills/seguranca/scripts/requisitos.js --detector auth,banco         # projeto que ainda não existe
node .claude/skills/seguranca/scripts/requisitos.js --verificacao A,B --perfil perfil.json   # só o inofensivo
node .claude/skills/seguranca/scripts/requisitos.js --id ACC-03 --completo        # a ficha inteira de um
node .claude/skills/seguranca/scripts/requisitos.js --checklist --perfil perfil.json
node .claude/skills/seguranca/scripts/requisitos.js --cobertura                   # lacunas contra as âncoras
node .claude/skills/seguranca/scripts/requisitos.js --principios                  # a régua interna: os dez princípios
```

**Ordem de leitura:** o resumo filtrado primeiro; a ficha completa só dos que
serão de fato verificados. Cada ficha traz declaração, por quê, como quebra,
implementação, **teste** e **evidência**.

---

## Os três estados

Auditoria que só distingue "tem" e "não tem" vira ruído no primeiro uso.

| Estado | Significado | Como reportar |
|---|---|---|
| **Conforme** | O controle existe e o teste passa | Silêncio, ou evidência se pedida |
| **Lacuna** | Não existe, e ninguém decidiu nada a respeito | **Achado**, com severidade e correção |
| **Exceção aceita** | Não existe **porque alguém decidiu**, com motivo e prazo | **Registro**, não achado. Revisita na data |

A exceção mora em `.seguranca-excecoes.json`, na raiz do projeto auditado — o
perfil já a lê, e o modelo do arquivo está em `referencias/exemplo-excecoes.json`.
Exceção com data de revisão vencida volta a ser achado.

**Reportar como falha algo que já foi decidido conscientemente destrói a
credibilidade da auditoria inteira.** Se o projeto não tem o arquivo e o usuário
disser que algo foi decisão, propor registrar ali.

---

## Régua de severidade

Usada em todos os modos. Orienta **prazo**, não investimento (isso é risco).

| Severidade | Critério | Prazo sugerido |
|---|---|---|
| **Crítica** | Dado de terceiro exposto · acesso administrativo · execução remota · credencial de produção comprometida | 24h, com contenção imediata |
| **Alta** | Contorno de autenticação ou autorização · injeção · vazamento entre contas | 7 dias |
| **Média** | Sem limite de requisição · CSRF · registro com dado sensível · sessão que não expira | 30 dias |
| **Baixa** | Cabeçalho ausente · erro verboso · higiene de configuração | 90 dias ou próxima janela |

---

## As regras que não se quebram

1. **O catálogo inteiro nunca se carrega.** Consulta filtrada, sempre. Ler
   `requisitos.json` direto com Read anula a razão de a skill existir.
2. **Perfil antes de opinião.** Sem `perfil.js`, qualquer recomendação é
   genérica e provavelmente errada para o alvo.
3. **Plano antes de agir, e aprovação antes de qualquer teste de nível C ou D.**
   Verificação ativa sem aviso prévio pode bloquear conta real, consumir crédito
   pago e alterar produção.
4. **Achado precisa de prova.** Arquivo, linha, saída de comando. Sem prova é
   achismo, e achismo em segurança gasta o crédito de quem avisa.
5. **Todo achado é refutado antes de virar relatório.** Padrão perigoso com
   valor que o atacante não controla não é vulnerabilidade. As três perguntas de
   refutação estão em `referencias/achados.md`, e quem não as responde escreve
   "não verificado" — nunca "conforme" e nunca um achado. **Reportar o que não
   procede queima a credibilidade dos achados verdadeiros no mesmo relatório.**
6. **Segurança roda no maior esforço de raciocínio disponível.** Verificação
   apressada acha o óbvio de cada categoria e o fundo de nenhuma, e o custo do
   erro aqui não é retrabalho: é dado de terceiro exposto. Se o ambiente permite
   escolher a profundidade, escolher a maior antes de começar.
7. **Decisão registrada não é falha.** Ler `.seguranca-excecoes.json` antes de
   reportar.
8. **Diagnóstico antes de correção, sempre.** Entregar o diagnóstico priorizado
   e esperar aprovação. Nunca alterar código de segurança por conta própria.
9. **Nenhum número de padrão sem conferência.** As pendências estão em
   `dados/ancoras.json`. Enquanto não conferidas, citar o assunto, não o número.
10. **Nunca imprimir valor de segredo.** Nem em achado, nem em evidência, nem em
   exemplo. Nome e prefixo bastam para provar que existe.
11. **O que não se aplica não se menciona.** O perfil já disse quais famílias
   estão fora. Encher relatório com o inaplicável é o oposto de ser assertivo.
12. **Ponto forte também precisa de prova.** Relatório que só lista defeito é
   indistinguível de relatório de quem não olhou: os dois produzem o mesmo
   silêncio. Registrar o que foi verificado e passou, **com a evidência** —
   sem ela, aquilo é "não verificado", não é ponto forte.
13. **Antes de reportar ausência, conferir se o controle mora fora do
    repositório** — servidor web, painel do provedor, contrato, automação do
    ambiente. A lista dos cinco lugares está em `referencias/auditar.md`.

---

## O que esta skill NÃO faz

- **Teste de invasão contra sistema sem autorização escrita.** Auditar exige ser
  o dono, ou ter permissão documentada
- **Correção automática de código.** Diagnóstico primeiro; correção aprovada
  depois, num passo separado
- **Prometer que o sistema está seguro.** Auditoria prova o que foi verificado,
  na data em que foi verificado, e nada além
- **Substituir teste de invasão profissional**, nem revisão de dependência linha
  a linha

---

## Antes e depois de mexer na própria skill

```bash
node .claude/skills/seguranca/scripts/verifica.js
```

**É o critério de pronto, e ele sai com erro se qualquer dimensão falhar.** As 10
dimensões, as restrições que ele impõe ao próprio `SKILL.md` e a regra que
encerra o retrabalho estão em `referencias/manutencao.md`.
