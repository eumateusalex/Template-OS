# Arquitetura do catálogo — o contrato de construção

> **Não é referência de operação.** Quem vai auditar, construir, publicar ou
> operar não lê este arquivo: lê o modo correspondente em `referencias/`.
>
> **Este documento é para quem vai MEXER no catálogo.** Ele define as regras que
> impedem o catálogo de precisar ser reestruturado a cada assunto novo. Ler antes
> de adicionar requisito, criar família ou mudar o esquema da ficha.
>
> **As quatro perguntas que ele responde:**
> 1. Como saber se o catálogo está completo? (Parte A e B — as réguas externas)
> 2. Onde um assunto novo se encaixa? (Parte D — as 34 famílias)
> 3. Que campos um requisito precisa ter? (Parte C — o modelo de dados)
> 4. Por que a estrutura é essa e não outra? (Parte E — a arquitetura comentada)
>
> **Verificação por comando:** `node scripts/requisitos.js --cobertura` cruza o
> catálogo com as âncoras e lista o que ficou sem requisito. É a Parte A, Regra 1,
> executável.
>
> **Escopo:** genérico. Aplicável a qualquer organização, sistema ou stack.
> O caso específico entra como perfil de adaptação, nunca na espinha.
>
> Vive dentro da skill porque é o contrato dela: separá-lo do catálogo faz os
> dois divergirem.

---

## Nota de leitura: os 8 volumes e onde cada um está

A estrutura abaixo descreve um playbook em 8 volumes. **O que a skill entrega é o
catálogo de requisitos e os quatro modos de operação** — que correspondem aos
Volumes IV, V e VI, mais a Fundação (Volume I, em `referencias/fundacao.md`).

| Volume | Onde está |
|---|---|
| Volume I · Fundamentos | `referencias/fundacao.md` |
| Volumes II, III · Governança e ciclo | famílias `GOV` `RSK` `AST` `CMP` `TPR` `PPL` `SDL` `THR` `ARQ` do catálogo |
| Volume IV · Controles técnicos | o catálogo inteiro — a contagem sai de `--resumo`, nunca escrita aqui |
| Volume V · Verificação | `referencias/auditar.md` · famílias `VER` `VUL` |
| Volume VI · Operação | `referencias/operar.md` · famílias `MON` `IRP` `BCP` |
| Volume VII · Perfis | `referencias/stacks.md` + os níveis N1/N2/N3 |
| Volume VIII · Adoção | os quatro modos do `SKILL.md` |

**O formato é catálogo, não prosa:** o conteúdo dos volumes está no catálogo
consultável por script, porque prosa de 150 páginas não se filtra por projeto e
não cabe em contexto.

---

## SUMÁRIO

| | Parte | O que estabelece |
|---|---|---|
| **A** | O contrato de construção | O critério de completude e as regras que impedem retrabalho |
| **B** | As âncoras normativas | Os padrões que dão a régua externa |
| **C** | O modelo de dados do playbook | O que é requisito, controle, teste, evidência, risco, exceção |
| **D** | O sistema de identificadores | As famílias e a numeração estável |
| **E** | A arquitetura em 8 volumes | A estrutura completa, comentada |
| **F** | Os perfis de rigor | Como o mesmo playbook serve porte diferente |
| **G** | Tensões e armadilhas | O que atravessa famílias, o erro que o catálogo evita e o que fica fora dele |

---

# PARTE A — O CONTRATO DE CONSTRUÇÃO

Esta parte existe por um motivo: **taxonomia induzida do material disponível
obriga a reestruturar o catálogo a cada leitura nova.** Uma estrutura induzida
nunca está completa — ela está completa *até você olhar de novo*.

As cinco regras abaixo são o contrato. Enquanto forem respeitadas, o playbook
cresce por **adição**, e nunca por reorganização.

### Regra 1 · A completude é medida contra régua externa, não contra o material

O playbook está completo quando **cada controle das âncoras normativas da Parte B
tem um requisito correspondente aqui**, ou uma justificativa escrita de
não-aplicabilidade. A pergunta deixa de ser *"esqueci alguma coisa?"* (que não tem
resposta) e passa a ser *"qual item do padrão X ainda não tem requisito?"* (que
tem resposta binária).

### Regra 2 · Todo requisito tem identificador estável, e o identificador nunca é reciclado

Um requisito é `IDN-07`. Se for eliminado, o número é aposentado, nunca reaproveitado.
Se um assunto novo aparecer, ele recebe o próximo número livre da família.
**Consequência: adicionar conteúdo não renumera nada, não move nada e não invalida
nenhuma referência externa.**

### Regra 3 · Um assunto mora num lugar só; todos os outros apontam

Checklist, prompt, teste e material de treinamento **referenciam por ID** e não
repetem o texto do requisito. Se a regra mudar, muda no requisito e propaga sozinha.
Duplicação de texto é o que produz documento que se contradiz.

### Regra 4 · Estrutura fixa, sem exceção

Todo requisito tem os mesmos campos (Parte C). Todo domínio tem a mesma anatomia.
Uniformidade não é estética: é o que permite ler salteado, gerar checklist
automaticamente e auditar sem reler o documento inteiro.

### Regra 5 · O específico vive em perfil, nunca na espinha

Stack, empresa, setor e caso de uso entram como **perfil de adaptação**
(Volume VII). A espinha permanece genérica. É o que permite o mesmo playbook servir
uma landing page e um sistema financeiro sem virar dois documentos.

O mesmo vale para ferramenta: **o requisito declara o princípio, e o produto
mora em `stacks.md`.** Cofre de segredo, escâner ou biblioteca nomeados na
declaração fazem o requisito envelhecer em meses.

> **O teste do contrato:** se aparecer um assunto novo (uma tecnologia, uma
> regulação, uma classe de ataque), ele deve caber num slot existente recebendo
> um ID novo. **Se ele exigir criar uma parte nova, o contrato falhou** e a falha
> é de arquitetura, não de conteúdo.

---

# PARTE B — AS ÂNCORAS NORMATIVAS

Nove padrões. Cada um responde uma pergunta diferente, e juntos cobrem do
estratégico ao executável. Nenhum sozinho basta, e é por isso que são nove.

> **A contagem não se escreve à mão.** Ela sai de `dados/ancoras.json`, e a
> dimensão 9 do verificador reprova qualquer número divergente em texto: contagem
> escrita à mão continua dizendo "seis" em vários arquivos depois que a sétima
> âncora entra.

| Âncora | Responde | Papel no playbook |
|---|---|---|
| **NIST CSF 2.0** | *Como uma organização governa segurança?* 6 funções: Governar · Identificar · Proteger · Detectar · Responder · Recuperar | **A espinha do Volume II.** O "Governar" foi adicionado na versão 2.0 e é justamente a parte que os materiais técnicos ignoram |
| **ISO/IEC 27001:2022** (Anexo A) | *Quais controles uma organização precisa ter?* 93 controles em 4 temas: organizacional · pessoas · físico · tecnológico | **Régua de completude organizacional.** É o que transforma "documento de segurança" em "setor de segurança" |
| **NIST SSDF** (SP 800-218) | *Como software nasce seguro?* 4 grupos: preparar a organização · proteger o software · produzir software seguro · responder a vulnerabilidade | **A espinha do Volume III** (ciclo de vida) |
| **OWASP SAMM v2** | *Qual o nível de maturidade do processo?* 5 funções de negócio × 3 práticas, com 3 níveis cada | **A régua de maturidade** do Volume VIII (roadmap de adoção) |
| **OWASP ASVS** | *Quais requisitos técnicos uma aplicação precisa cumprir?* Capítulos por domínio, com 3 níveis de verificação | **A régua de completude técnica do Volume IV.** É o padrão de requisitos de aplicação, e é o mais próximo do que este playbook entrega |
| **OWASP Top 10 2025** | *O que mais quebra na prática, hoje?* | **Índice de priorização.** Edição corrente. Trouxe cadeia de suprimento como categoria própria e o tratamento de condição excepcional como categoria nova |
| **OWASP Top 10 2021** | *A mesma pergunta, na numeração anterior* | **Mantida de propósito.** Boa parte das ferramentas e dos relatórios do mercado ainda fala nesta numeração, e traduzir na hora custa erro |
| **OWASP API Security Top 10** | *O que quebra especificamente em interface de programação?* | **A régua mais próxima da forma da maioria dos alvos.** É dela que vem o requisito de inventário de interface exposta |
| **OWASP Top 10 for LLM** | *O que quebra em aplicação com modelo de linguagem?* | **A régua do domínio mais novo.** A edição 2025 tem 10 itens, medidos item a item (ver B.1) |

**Apoio, sem serem espinha:** CIS Controls v8 (18 controles com 3 grupos de
implementação, útil para o perfil de organização pequena) · STRIDE (procedimento
de modelagem de ameaça) · CVSS (pontuação de severidade) · MITRE ATT&CK
(comportamento de adversário, para detecção) · NIST SP 800-63 (níveis de garantia
de identidade e autenticação).

> **Por que nove e não um:** ISO 27001 diz *o que* ter, não *como* fazer. ASVS diz
> *como* verificar aplicação, mas não fala de governança. SSDF cobre o ciclo, mas
> não os controles. **Um playbook que serve como setor de segurança precisa
> atravessar os três planos** — organizacional, de processo e técnico.

### B.1 · Estado da verificação de completude

Execução do teste da Regra 1: cada âncora, item por item, contra a estrutura.
**É artefato vivo** — reexecutado a cada ciclo, e o resultado vigente fica aqui.

| Âncora | Unidade verificada | Resultado |
|---|---|---|
| **NIST CSF 2.0** | 6 funções | **6/6** · Governar → Vol II · Identificar → `AST` `RSK` · Proteger → `IDN` `SES` `ACC` `DAT` `CRY` `PPL` · Detectar → `MON` · Responder → `IRP` · Recuperar → `BCP` |
| **NIST SSDF** | 4 grupos | **4/4** · Preparar → Vol II + 3.1-3.2 · Proteger o software → `SUP` `SEC` `ENV` · Produzir seguro → Vol III + IV · Responder → `VUL` + Vol VI |
| **OWASP Top 10 2025** | 10 categorias | **10/10** · A10 (condição excepcional) é a categoria nova, coberta por `ARQ-03` |
| **OWASP Top 10 2021** | 10 categorias | **10/10** · nenhuma sem família |
| **OWASP API Security Top 10** | 10 categorias | **10/10** · API9 (inventário de interface) coberto por `ARQ-04` |
| **OWASP Top 10 for LLM 2025** | 10 itens | **10/10** · quatro só se cobrem com `AIA-07` `AIA-08` `AIA-09`. Ver a nota abaixo |
| **OWASP SAMM** | 5 funções de negócio | **5/5** · Governança → Vol II · Projeto → Vol III · Implementação → Vol IV · Verificação → Vol V · Operações → Vol VI |
| **OWASP ASVS** | capítulos por domínio | **14/14 com 2 ressalvas** · integridade do código-fonte e superfície de API pedem escopo explícito, dado em `SUP` e 7.3 |
| **ISO/IEC 27001 Anexo A** | 4 temas | **4/4** · organizacional, pessoas e tecnológico pelas famílias técnicas e de governança; o tema físico pela família `PHY` |

> **O que a medição item a item mostra.** Uma âncora de modelo de linguagem
> escrita por aproximação, com **6 assuntos**, esconde o que a edição de 2025
> tem: são **10 itens**, e **quatro** só se cobrem medindo item a item:
> envenenamento de dado e modelo, vazamento da instrução do sistema, fraqueza de
> vetor e incorporação, e desinformação.
>
> **A regra de método:** âncora escrita por aproximação vira falsa cobertura.
> Com seis itens, o `--cobertura` responde "nenhum item sem cobertura" — certo
> quanto ao que pergunta, e errado quanto ao mundo. Régua incompleta não avisa
> que está incompleta.

#### O que a medição item a item exige do catálogo

Uma lacuna estrutural e cinco de escopo. Todas cabem como adição, **nenhuma
exige reorganizar volume ou parte** — que é o critério do contrato.

| Achado | Âncora | Tratamento |
|---|---|---|
| **Segurança física sem família** | ISO 27001, tema físico | **Nova família `PHY`.** Dispositivo perdido ou roubado, cifra de disco, descarte de mídia, acesso a local, trabalho remoto, equipamento de terceiro. **Notebook roubado com repositório e chave de acesso é incidente físico com consequência digital inteira** |
| **Integridade do próprio código-fonte** | ASVS, capítulo de código malicioso | Escopo de `SUP` ampliado: proteção de ramo, revisão obrigatória, assinatura de commit, quem pode publicar. **A cadeia de suprimento começa no próprio repositório**, não no pacote de terceiro |
| **API como superfície com risco próprio** | ASVS, capítulo de serviço web | Vai para 7.3 (perfil por arquitetura). Introspecção habilitada, consulta profundamente aninhada como negação de serviço, agrupamento de chamadas para burlar limite, documentação exposta, método não previsto |
| **Proteção contra código malicioso** | ISO, tema tecnológico | Escopo de `ENV` ampliado |
| **Dado de produção em ambiente de teste** | ISO, tema tecnológico | Escopo de `ENV` ampliado. **Falha clássica**: a cópia de teste tem o dado real e um décimo do controle |
| **Sincronização de relógio** | ISO, tema tecnológico | Escopo de `LOG` ampliado. **Sem hora confiável, correlação de evento não funciona e a trilha perde valor probatório** |
| **Triagem de candidato e trabalho remoto** | ISO, tema pessoas | Escopo de `PPL` ampliado |

### B.2 · O que ainda se confere

As pendências abertas moram em `dados/ancoras.json`
(`meta.pendencias_de_verificacao`), e o que já está respondido, com fonte e data,
em `meta.resolvidas` do mesmo arquivo; a régua de número, em `numeros.md`.
Enquanto uma pendência estiver aberta, cita-se o assunto, nunca o número.

**A numeração do Top 10 se confere antes de se repetir.** Lista que apresenta o
script injetado no navegador e a requisição forjada entre sítios como categorias
próprias, ao lado de injeção, está errada desde a edição 2021: o primeiro mora
em Injeção, e o segundo deixou de ser categoria separada. O erro faz parecer
cobertura de dez quando são cinco, e as que somem são justamente projeto
inseguro, componente vulnerável, falha de autenticação, falha de registro e
requisição forjada no servidor. No catálogo, as duas continuam como falhas que
se caçam, com a classificação certa em `VAL-03` e `NET-08`.

O que é seguro afirmar sem verificação: as 6 funções do CSF 2.0, os 4 grupos do
SSDF, as 5 funções de negócio do SAMM, as 10 categorias do Top 10 2021, os 3
níveis do ASVS, os 18 controles do CIS v8.

---

# PARTE C — O MODELO DE DADOS DO PLAYBOOK

Um setor de segurança não opera com texto corrido. Opera com **objetos que se
relacionam**. Definir isso formalmente é o que separa playbook de apostila.

## C.1 · As sete entidades

```
      ┌──────────┐        ameaça a        ┌──────────┐
      │  ATIVO   │◄──────────────────────►│  AMEAÇA  │
      └────┬─────┘                        └────┬─────┘
           │ tem                               │ explora
           ▼                                   ▼
      ┌──────────┐                        ┌──────────────┐
      │  RISCO   │◄───────────────────────│VULNERABILIDADE│
      └────┬─────┘                        └──────────────┘
           │ é tratado por
           ▼
      ┌──────────┐  implementado por  ┌──────────┐
      │REQUISITO │───────────────────►│ CONTROLE │
      └────┬─────┘                    └────┬─────┘
           │ verificado por                │ produz
           ▼                               ▼
      ┌──────────┐                    ┌──────────┐
      │  TESTE   │───────────────────►│EVIDÊNCIA │
      └──────────┘                    └──────────┘
                                           ▲
      ┌──────────┐   dispensa formalmente  │
      │ EXCEÇÃO  │─────────────────────────┘
      └──────────┘
```

| Entidade | Definição operacional |
|---|---|
| **Ativo** | O que tem valor e precisa de proteção: dado, sistema, credencial, processo, reputação |
| **Ameaça** | Quem ou o que pode causar dano, e com qual motivação |
| **Vulnerabilidade** | A fraqueza que a ameaça explora |
| **Risco** | Probabilidade × impacto, sobre um ativo específico. **Risco é sempre de alguém** — tem dono |
| **Requisito** | A regra a cumprir. É o objeto central do playbook, e o que tem ID |
| **Controle** | A implementação concreta do requisito num sistema real |
| **Teste** | O procedimento que prova que o controle funciona |
| **Evidência** | O artefato que registra que o teste foi feito e passou |
| **Exceção** | A dispensa formal de um requisito, com dono, prazo e justificativa |

> **A exceção é a entidade que quase todo documento de segurança esquece, e é a
> que faz o playbook sobreviver ao contato com a realidade.** Sem processo de
> exceção, requisito inconveniente é simplesmente ignorado em silêncio, e ninguém
> sabe onde a organização está descoberta. Com ele, o desvio é uma decisão
> assinada, com prazo e responsável.

## C.2 · A ficha do requisito

Todo requisito do playbook tem exatamente estes campos:

```
ID                 família + número sequencial      ex.: ACC-04
TÍTULO             uma linha, imperativa
DECLARAÇÃO         o que deve ser verdade, sem ambiguidade
PROPRIEDADE        qual das cinco do 1.3 este requisito protege
NÍVEL              N1 · N2 · N3   (em qual nível de rigor passa a ser obrigatório)
TIPO               preventivo · detectivo · corretivo
NATUREZA           técnico · administrativo · físico
NÍVEL DE VERIFIC.  A · B · C · D   (quanto custa verificar, e se precisa de autorização)
DETECTORES         quais superfícies o ativam. SEM ISSO ELE NUNCA É SELECIONADO
POR QUÊ            a falha que ele evita, em linguagem de consequência
COMO QUEBRA        o cenário concreto de abuso
IMPLEMENTAÇÃO      por stack, quando aplicável
TESTE              o procedimento de verificação, executável
EVIDÊNCIA          o artefato que comprova
MAPEAMENTO         ASVS · CSF · ISO · SSDF · Top 10
DEPENDE DE         outros IDs que precisam existir antes
ARMADILHAS         o que costuma dar errado na implementação
SEVERIDADE         crítica · alta · média · baixa, se o controle estiver ausente
```

**São 18 campos, todos obrigatórios, e nenhum outro**: `scripts/verifica.js`
reprova a ausência de qualquer um e o campo fora do esquema. Três deles — nível
de verificação, detectores e severidade — são os que fazem do catálogo um
operador: sem detector nada é selecionado, sem nível de verificação não há como
separar o que roda sozinho do que precisa de autorização, e sem severidade não
há ordem de correção.

> **`PROPRIEDADE` não é enfeite.** Ela torna verificável a régua interna (toda
> propriedade tem família, toda família protege alguma propriedade) — sem ela, a
> regra é declaração e não teste.

> **Os campos TESTE e EVIDÊNCIA são o que separa checklist de auditoria.**
> Requisito sem teste é opinião. Teste sem evidência é memória.

## C.3 · A escala de severidade e a de risco

Duas escalas diferentes, e confundi-las é erro comum:

**Severidade** classifica a *falha encontrada*:

| Nível | Critério | SLA de correção sugerido |
|---|---|---|
| **Crítica** | Exposição de dado de terceiro · acesso administrativo · execução remota · comprometimento de credencial em produção | 24 h · com contenção imediata |
| **Alta** | Bypass de autenticação ou autorização · injeção · vazamento entre contas | 7 dias |
| **Média** | Ausência de rate limit · CSRF · log com dado sensível · sessão que não expira | 30 dias |
| **Baixa** | Header ausente · erro verboso · higiene de configuração | 90 dias ou próxima janela |

**Risco** classifica a *exposição da organização*: probabilidade × impacto, sobre
um ativo, com dono nomeado. Uma falha crítica num sistema sem dado real pode ser
risco baixo. Uma falha média no sistema que sustenta o faturamento pode ser risco
alto. **A severidade orienta o prazo; o risco orienta o investimento.**

---

# PARTE D — O SISTEMA DE IDENTIFICADORES

34 famílias, agrupadas pelos volumes. Cada requisito é `FAM-NN`.

> **Nota de completude (ver B.1 e G.1):** as famílias derivam de duas réguas.
> Da **interna**, as cinco propriedades do 1.3 — `INT` e `RES` existem porque
> integridade e disponibilidade são propriedades declaradas que precisam de
> endereço próprio, e sem elas ficariam espalhadas em pedaços dentro de famílias
> de confidencialidade, que é o que acontece em quase todo material de mercado.
> Da **externa**, as âncoras da Parte B — `PHY` existe porque o tema físico da
> ISO 27001 não tinha correspondência.
>
> **A regra de manutenção:** família nova só nasce quando uma das duas réguas
> aponta lacuna. Nunca por intuição de leitura.

### Governança e organização
| ID | Família | Cobre |
|---|---|---|
| `GOV` | Governança | Papéis, política, hierarquia documental, comitê, orçamento |
| `RSK` | Gestão de risco | Identificação, análise, tratamento, aceitação, registro |
| `AST` | Ativos e classificação | Inventário, classificação de dado, ciclo de vida do dado |
| `CMP` | Conformidade | LGPD e equivalentes, obrigação contratual, regulatória, auditoria externa |
| `TPR` | Terceiros | Fornecedor, subprocessador, due diligence, cláusula, monitoramento |
| `PPL` | Pessoas | Triagem, admissão, desligamento, conscientização, segregação de deveres, trabalho remoto |
| `PHY` | Segurança física | Dispositivo, cifra de disco, descarte de mídia, acesso a local, equipamento de terceiro |

### Ciclo de desenvolvimento
| ID | Família | Cobre |
|---|---|---|
| `SDL` | Ciclo seguro | Requisito por projeto, portão de release, revisão, definição de pronto |
| `THR` | Modelagem de ameaça | STRIDE, superfície, fronteira de confiança, abuso |
| `ARQ` | Arquitetura | Camadas, fronteira, padrão aprovado, decisão registrada |

### Controles técnicos · o caminho da requisição
| ID | Família | Cobre |
|---|---|---|
| `NET` | Rede e borda | TLS, HSTS, CORS, rate limit, WAF, cabeçalhos, proteção de disponibilidade |
| `IDN` | Identidade | Senha, MFA, federação, OAuth, identidade de máquina |
| `SES` | Sessão | Token, cookie, expiração, revogação, dispositivo |
| `ACC` | Autorização | Papel, dono, tenant, atribuição em massa, privilégio, administração |
| `VAL` | Validação de entrada | Esquema, injeção, sanitização, desserialização, SSRF |
| `BIZ` | Lógica de negócio | Invariantes, valor monetário, cota, corrida, integração assinada |
| `DAT` | Dado: acesso | Acesso em nível de linha, privilégio no banco, repouso, trânsito, retenção |
| `INT` | Dado: integridade | Deleção reversível, integridade referencial, restrição no banco, consistência, reconciliação |
| `FIL` | Arquivos | Upload, tipo, tamanho, autorização de leitura, armazenamento |
| `OUT` | Saída | Campo mínimo, erro, enumeração, vazamento por resposta |
| `LOG` | Registro e trilha | Auditoria, imutabilidade, higiene, correlação, **sincronização de relógio** |

### Controles técnicos · sustentação
| ID | Família | Cobre |
|---|---|---|
| `SEC` | Segredos | Armazenamento, distribuição, rotação, vazamento, varredura |
| `CRY` | Criptografia | Algoritmo, chave, certificado, aleatoriedade, hashing |
| `SUP` | Cadeia de suprimento | Dependência, lockfile, inventário de componentes, imagem, integridade de artefato, **proteção do repositório e do código-fonte** |
| `ENV` | Ambientes | Separação, configuração, implantação, estação de trabalho, ferramenta de IA, código malicioso, **dado usado em teste** |
| `RES` | Resiliência e capacidade | Cota de plataforma, tempo limite, nova tentativa, disjuntor, degradação graciosa, queda de dependência |
| `AIA` | IA e agentes | Injeção de prompt, saída não confiável, dado enviado ao modelo, permissão do agente, custo |
| `CLI` | Superfícies cliente | Desktop, móvel, linha de comando, extensão |

### Verificação e operação
| ID | Família | Cobre |
|---|---|---|
| `VER` | Verificação | Análise estática, dinâmica, composição, infraestrutura, teste manual, pentest |
| `VUL` | Vulnerabilidade | Recebimento, triagem, prazo, correção, divulgação |
| `MON` | Monitoramento | Detecção, alerta, correlação, caça |
| `IRP` | Incidente | Preparação, contenção, erradicação, recuperação, lição, notificação |
| `BCP` | Continuidade | Backup, objetivo de recuperação, teste de restauração, plano de contingência |
| `MET` | Métricas | Indicador, relatório, tendência, painel |

> **Por que famílias e não numeração corrida:** com `1` a `300`, inserir um
> requisito no meio renumera tudo. Com família, `IDN-08` é criado sem tocar em
> nada. **É a Regra 2 do contrato virando estrutura.**

---

# PARTE E — A ARQUITETURA EM 8 VOLUMES

```
┌────────────────────────────────────────────────────────────────────┐
│ VOL I    · FUNDAMENTOS            o que é verdade em todo contexto │
├────────────────────────────────────────────────────────────────────┤
│ VOL II   · GOVERNANÇA             o setor: decidir, priorizar,     │
│                                   responder por                    │
├────────────────────────────────────────────────────────────────────┤
│ VOL III  · CICLO DE VIDA          como o software nasce seguro     │
├────────────────────────────────────────────────────────────────────┤
│ VOL IV   · CONTROLES TÉCNICOS     o núcleo: 20 domínios com IDs    │
├────────────────────────────────────────────────────────────────────┤
│ VOL V    · VERIFICAÇÃO            como se prova que está feito     │
├────────────────────────────────────────────────────────────────────┤
│ VOL VI   · OPERAÇÃO E RESPOSTA    quando falha, e vai falhar       │
├────────────────────────────────────────────────────────────────────┤
│ VOL VII  · PERFIS DE ADAPTAÇÃO    o mesmo playbook em contextos    │
│                                   diferentes                       │
├────────────────────────────────────────────────────────────────────┤
│ VOL VIII · ADOÇÃO                 como sair do zero                │
└────────────────────────────────────────────────────────────────────┘
                              +
                      ANEXOS OPERACIONAIS
```

---

## VOLUME I · FUNDAMENTOS

**Responde:** o que vale em qualquer organização, sistema ou tecnologia.

**Por que abre o playbook:** os volumes seguintes são consequência destes
princípios. Quem entender o Volume I resolve o caso que o playbook não previu.

| Seção | Conteúdo |
|---|---|
| **1.1** | Objetivo, escopo, público, e **o que este playbook não é** |
| **1.2** | Vocabulário: as 9 entidades da Parte C, mais ameaça, superfície, fronteira de confiança |
| **1.3** | **As cinco propriedades:** confidencialidade · integridade · **disponibilidade** · autenticidade · não-repúdio |
| **1.4** | **Os princípios de projeto** (abaixo) |
| **1.5** | Tipos de controle: preventivo/detectivo/corretivo × técnico/administrativo/físico |
| **1.6** | As escalas: severidade × risco (C.3) |
| **1.7** | Por que segurança falha: as causas estruturais, não as técnicas |

### Os princípios (1.4)

| # | Princípio | O que justifica |
|---|---|---|
| **1** | **Confiança zero** | Nenhuma operação é confiável por origem. Validação sempre no lado que você controla |
| **2** | **Defesa em profundidade** | Camadas independentes. **É o princípio que explica por que dois controles cobrem a mesma coisa** — sem ele, alguém corta o "redundante" |
| **3** | **Menor privilégio** | O mínimo, pelo menor tempo. Vale para pessoa, conta, token, processo, contêiner e agente |
| **4** | **Falha segura, seguro por padrão** | Quando quebra, fecha. O padrão nega; liberar é ato explícito e registrado |
| **5** | **Separação de responsabilidades** | Quem propõe não aprova; quem aprova não executa. Nenhum ator fecha o ciclo sozinho |
| **6** | **Superfície mínima** | O que não existe não é atacável. Menos rota, menos campo, menos dado guardado, menos permissão |
| **7** | **Mediação completa** | Toda operação passa por verificação. Não existe caminho lateral, nem cache de decisão de acesso |
| **8** | **Projeto aberto** | A segurança vem do controle e da chave, nunca do segredo da implementação |
| **9** | **Assuma comprometimento** | Alguma coisa vai falhar. Projete para detectar e recuperar, não só para impedir |
| **10** | **Aceitabilidade** | Controle que atrapalha demais é contornado. Segurança inviável na prática não é segurança |

> **Ancoragem:** 1 a 8 são leituras modernas dos princípios clássicos de projeto
> seguro, de 1975, que seguem sendo a base canônica. 9 e 10 são
> a contribuição da prática: o 9 é o que sustenta os Volumes V e VI; o 10 é o que
> impede que o playbook produza processo que ninguém segue.

### Por que segurança falha (1.7)

Seção curta e desconfortável, e é o que dá credibilidade ao resto. As causas
estruturais não são técnicas:

- **Funcionar e estar seguro são coisas diferentes**, e só a primeira é visível
- **Quem constrói tem incentivo de entrega**, não de proteção
- **A falha não aparece na tela** — ninguém reclama de um sistema que vaza em silêncio
- **Ferramenta geradora otimiza para agradar**, completando o padrão mais comum que viu
- **Checklist marcado sem entender é pior que nenhum**: produz sensação de cobertura
- **Segurança sem dono é segurança de ninguém**

---

## VOLUME II · GOVERNANÇA — O SETOR

**Responde:** como a segurança se organiza, decide, prioriza e responde por.

**Por que vem antes do técnico:** controle técnico sem governança é lista de
tarefas sem dono, sem prazo e sem critério de aceitação. **É este volume que
transforma o playbook em setor.**

**Âncora:** função Governar do NIST CSF 2.0 + tema organizacional da ISO 27001.

| Seção | Família | Conteúdo |
|---|---|---|
| **2.1** | `GOV` | **Papéis e responsabilidades.** Matriz de responsabilidade: quem executa, quem responde, quem é consultado, quem é informado. Como funciona quando a organização tem uma pessoa só, e como escala |
| **2.2** | `GOV` | **A hierarquia documental:** política (o quê e por quê) → norma (o padrão) → procedimento (o passo a passo) → registro (a evidência). Quem aprova cada nível e com que frequência revisa |
| **2.3** | `AST` | **Inventário de ativos.** O que existe, onde está, quem é dono, qual a criticidade. **Não se protege o que não se sabe que existe** |
| **2.4** | `AST` | **Classificação de dados.** Público · interno · confidencial · restrito. Cada classe define os requisitos que se aplicam. **É o que conecta o dado ao controle** |
| **2.5** | `RSK` | **Gestão de risco.** Identificar → analisar → tratar (mitigar, transferir, evitar, aceitar) → monitorar. O registro de riscos como artefato vivo |
| **2.6** | `RSK` | **Aceitação formal de risco e exceção.** Formulário, dono, prazo, condição de revisão. **A seção que evita que o playbook seja ignorado em silêncio** |
| **2.7** | `CMP` | **Conformidade.** LGPD e equivalentes: base legal, direitos do titular, retenção, transferência internacional, papel de controlador e operador, notificação à autoridade. Obrigação contratual e setorial |
| **2.8** | `TPR` | **Terceiros e fornecedores.** Avaliação antes de contratar, cláusula mínima, subprocessador, monitoramento, saída. **Inclui o provedor de modelo de IA, que é subprocessador de dado** |
| **2.9** | `PPL` | **Pessoas.** Admissão e concessão de acesso · **desligamento e revogação** (o controle mais esquecido e o mais barato) · conscientização · canal de reporte interno |
| **2.10** | `MET` | **Métricas e prestação de contas.** O que medir, para quem reportar, com que frequência. Indicadores que mudam decisão, não que enfeitam painel |
| **2.11** | `PHY` | **Segurança física.** Dispositivo com cifra de disco, bloqueio e remoção remota · descarte de mídia · acesso a local · equipamento de terceiro · trabalho remoto. **Numa operação digital o volume é pequeno, mas não é zero: notebook levado com repositório e chave de acesso é incidente físico com consequência digital inteira** |

---

## VOLUME III · CICLO DE VIDA

**Responde:** como o software nasce seguro, em vez de ser consertado depois.

**Por que aqui:** é a ponte entre governança e controle técnico. Sem ele, o
Volume IV vira lista que alguém consulta quando lembra.

**Âncora:** NIST SSDF + OWASP SAMM.

| Seção | Família | Conteúdo |
|---|---|---|
| **3.1** | `SDL` | **As cinco fases:** governar → desenhar → construir → verificar → operar. Qual família de requisito cada fase consome |
| **3.2** | `SDL` | **Requisitos de segurança por projeto.** Como derivar do perfil de rigor e da classificação de dado. **Nenhuma linha de código antes disto** |
| **3.3** | `THR` | **Modelagem de ameaça.** Procedimento com STRIDE: decompor o sistema, marcar fronteiras de confiança, enumerar ameaça por elemento, decidir tratamento. Com exemplo completo |
| **3.4** | `ARQ` | **Arquitetura de referência.** Camadas, fronteira, onde a decisão de acesso mora, padrão aprovado, registro de decisão de arquitetura |
| **3.5** | `SDL` | **Práticas de codificação e revisão.** O que a revisão de código procura em segurança, e o que ela não pega |
| **3.6** | `SDL` | **Portões de release.** O que **bloqueia** a publicação, por perfil. A definição de pronto que inclui segurança |
| **3.7** | `SDL` | **Construção com ferramenta geradora de código.** O que ela faz bem, o que continua sendo humano, como instruí-la, e por que a mesma ferramenta não deve auditar o próprio código |

---

## VOLUME IV · CONTROLES TÉCNICOS

**Responde:** o que precisa ser verdade em cada ponto do sistema.

**Núcleo do playbook.** As famílias dos dois blocos de controles técnicos da
Parte D, organizadas assim:

### A organização do Bloco A: o caminho da requisição

A ordem dos domínios é **o trajeto de um pedido pelo sistema**. Isso não é escolha
estética: é a ordem em que se constrói, a ordem em que se audita, a ordem em que
se lê um log e a ordem em que se rastreia um incidente. Cada domínio é um ponto de
checagem no caminho, e **um pedido que passou por todos é um pedido verificado**.

```
   internet
      │
      ▼
   NET · pode entrar?              TLS · CORS · limite · cabeçalho · WAF
      ▼
   IDN · quem é?                   senha · MFA · federação · máquina
      ▼
   SES · a sessão vale?            token · cookie · expiração · revogação
      ▼
   ACC · pode isto, aqui?          papel · dono · tenant · privilégio
      ▼
   VAL · o que mandou presta?      esquema · injeção · SSRF
      ▼
   BIZ · faz sentido no domínio?   invariante · valor · cota · integração
      ▼
   DAT · o que alcança de fato?    linha · privilégio no banco · repouso
      ▼
   INT · o dado sobrevive?         deleção reversível · chave estrangeira ·
                                   restrição · consistência
      ▼
   FIL · e os arquivos?            upload · leitura autorizada · storage
      ▼
   OUT · o que volta?              campo mínimo · erro · enumeração
      ▼
   LOG · o que ficou provado?      trilha · imutabilidade · higiene
```

> **Por que `SES` é separado de `IDN`:** autenticar é um evento; manter sessão é
> um estado. As falhas são diferentes — logout que não invalida, token que não
> expira, sessão que sobrevive à troca de senha. Separar é o que faz cada uma ter
> teste próprio.
>
> **Por que `BIZ` é separado de `VAL`:** validação pergunta se o **formato** é
> aceitável; lógica de negócio pergunta se a **operação** é aceitável. Um pedido
> com valor de um centavo passa em qualquer esquema — o campo é um inteiro
> positivo. **Nenhum validador e nenhuma ferramenta automática pega isso**, porque
> só a organização conhece a própria regra.
>
> **Por que `OUT` é domínio e não detalhe:** a falha aqui é independente de tudo
> que veio antes. Autorização perfeita, acesso em nível de linha correto, e a
> resposta ainda entrega campo que não devia porque alguém serializou o registro
> inteiro. É a falha mais fácil de introduzir sem perceber.
>
> **Por que `INT` é separado de `DAT`:** `DAT` pergunta *quem alcança o dado*;
> `INT` pergunta *se o dado está correto e se sobrevive ao erro*. São propriedades
> diferentes — confidencialidade e integridade — e têm controles diferentes.
> Deleção sem retorno, relacionamento órfão e coluna sem restrição não vazam nada:
> **corrompem.** É a categoria de falha que quase todo material de segurança
> ignora, porque não vira manchete de vazamento.
>
> **Por que `LOG` fecha o bloco:** é o único controle **detectivo** do trajeto.
> Um sistema só com controle preventivo é comprometido em silêncio.

### Bloco B: sustentação

Não estão no caminho da requisição. São as condições para que o Bloco A seja
verdade.

| Família | Responde |
|---|---|
| `SEC` | Onde vivem as credenciais, e o que acontece quando vazam |
| `CRY` | Que algoritmo, que chave, que ciclo de vida |
| `SUP` | O que foi instalado, de onde veio, e se ainda é confiável |
| `ENV` | Onde roda, quão separado está, **e quem tem acesso à máquina que constrói** |
| `RES` | O que acontece quando o recurso acaba ou a dependência cai |
| `AIA` | O que acontece quando parte do sistema é um modelo ou um agente |
| `CLI` | O que muda quando o cliente não é um navegador |

### `RES` · Resiliência e capacidade

Ganha família própria porque **disponibilidade é uma das cinco propriedades do
1.3 e não tinha endereço**. Sem ela, os controles ficam espalhados: limite de
requisição em `NET`, cota em `BIZ`, backup em `BCP`, e ninguém responde pela
pergunta inteira.

- **Cota e limite de plataforma:** conhecer o teto de cada recurso contratado
  (armazenamento, tráfego de saída, invocação, conexão simultânea), monitorar
  consumo e **alertar antes de estourar**, não depois. Serviço que para por cota
  esgotada é indisponibilidade, e **pode ser provocada por terceiro** — quem
  raspa dados consome tráfego de saída até o serviço parar
- **Queda de dependência:** todo serviço externo cai. Tempo limite explícito,
  nova tentativa com espera crescente, disjuntor, e **degradação graciosa** — o
  sistema responde de forma útil em vez de travar
- **Erro de integração tratado:** resposta vazia, malformada, lenta ou com erro
  precisa de caminho previsto. **Vale especialmente para integração com modelo de
  IA**, que falha de formas que a chamada convencional não falha
- **Custo como vetor:** operação cara sem teto é risco financeiro, e o abuso não
  precisa derrubar nada para doer
- **Capacidade:** consulta sem índice em coluna muito consultada degrada com o
  crescimento e **vira vetor de negação de serviço** — uma requisição barata para
  o atacante custa caro para o servidor

### `AIA` · O domínio que os padrões clássicos ainda não cobrem bem

Ganha tratamento próprio porque **é uma classe de risco genuinamente nova**, e
porque nenhum dos padrões da Parte B, exceto o Top 10 de LLM, tem controle maduro
para ela:

- **Injeção de prompt**, direta e indireta: instrução escondida em dado que o
  modelo lê. **Para um sistema que processa conteúdo externo, o dado de entrada é
  código, não texto**
- **A saída do modelo não é confiável:** nunca executar, nunca interpolar em
  consulta ou comando, nunca renderizar sem sanitizar
- **Dado enviado ao modelo:** o quê, para qual provedor, sob qual contrato, com
  qual retenção. **É subprocessamento**, e liga direto em `TPR` e `CMP`
- **Permissão do agente:** de quem ele herda autoridade, com que escopo, e o
  problema do delegado confuso (o agente com mais poder que quem pediu)
- **Custo e cota:** disponibilidade e risco financeiro direto
- **Autonomia e aprovação humana:** onde a ação precisa de segunda assinatura.
  **É o princípio 5 aplicado a software**
- **Trilha das ações do agente:** o que fez, com que dado, sob qual instrução

`AIA` é família do Volume IV enquanto couber num volume. Se passar disso, sai como
corpo próprio e o catálogo aponta para ele, e os identificadores não mudam (Regra 2).

---

## VOLUME V · VERIFICAÇÃO

**Responde:** como se prova que os controles existem e funcionam.

**Por que é volume próprio:** requisito sem verificação é declaração de intenção.
**É este volume que produz a evidência** que se apresenta a cliente, auditor ou
seguradora.

| Seção | Família | Conteúdo |
|---|---|---|
| **5.1** | `VER` | **A estratégia:** o que cada técnica pega e o que ela não pega. Análise estática · dinâmica · de composição · de infraestrutura como código · revisão manual · teste de invasão. **Nenhuma cobre lógica de negócio** |
| **5.2** | `VER` | **O que automatizar e onde.** Verificação em cada envio, em cada publicação, periódica |
| **5.3** | `VER` | **Teste manual essencial:** o de duas contas · o de troca de identificador · o de rota sem sessão · o de resposta ao usuário comum |
| **5.4** | `VER` | **Teste de invasão:** quando contratar, o que exigir no escopo, como ler o relatório, **e por que ele não substitui os controles** |
| **5.5** | `VER` | **Auditoria adversarial com ferramenta de IA:** os prompts, e por que a ferramenta que escreveu o código não deve ser a que audita |
| **5.6** | `VUL` | **Programa de vulnerabilidade:** canal de recebimento, triagem, pontuação, prazo por severidade, correção, verificação, divulgação ao afetado |
| **5.7** | `VER` | **Evidência e trilha de auditoria do próprio programa:** o que se guarda, por quanto tempo, como se apresenta |

---

## VOLUME VI · OPERAÇÃO E RESPOSTA

**Responde:** o que fazer quando falha — e vai falhar (princípio 9).

| Seção | Família | Conteúdo |
|---|---|---|
| **6.1** | `MON` | **Detecção:** o que monitorar, quais sinais importam, como reduzir ruído. Anomalia de erro de autorização, de limite, de volume, de horário |
| **6.2** | `MON` | **Alerta e escalonamento:** quem é acionado, em quanto tempo, por qual canal |
| **6.3** | `IRP` | **Resposta a incidente, as seis fases:** preparação · detecção e análise · contenção · erradicação · recuperação · lições aprendidas |
| **6.4** | `IRP` | **A primeira hora.** Procedimento executável: o que preservar, o que rotacionar, o que desligar, o que **não** fazer (destruir evidência é o erro mais comum) |
| **6.5** | `IRP` | **Comunicação:** interna, com cliente, com titular do dado, com autoridade. Prazos legais e o que a notificação precisa conter |
| **6.6** | `BCP` | **Continuidade:** backup em camadas · objetivo de tempo e de ponto de recuperação · **teste de restauração** — backup nunca testado é esperança, não controle |
| **6.7** | `IRP` | **Pós-incidente:** análise de causa sem caça às bruxas, e como a lição vira requisito novo. **É o laço que realimenta o playbook** |

---

## VOLUME VII · PERFIS DE ADAPTAÇÃO

**Responde:** como o mesmo playbook serve uma landing page e um sistema
financeiro sem virar dois documentos.

**É a Regra 5 do contrato virando volume.** Nada aqui cria requisito novo: os
perfis **selecionam** requisitos existentes e dizem **como** implementá-los.

| Seção | Conteúdo |
|---|---|
| **7.1** | **Perfil por rigor:** N1, N2, N3 (Parte F). Cada requisito já traz seu perfil na ficha |
| **7.2** | **Perfil por porte:** pessoa só · equipe pequena · organização com setor. O que muda é quem faz e com que formalidade, **não o que precisa ser verdade** |
| **7.3** | **Perfil por arquitetura:** aplicação monolítica · serviços · plataforma como serviço com banco exposto ao cliente · estático · **superfície de API** (introspecção habilitada, consulta profundamente aninhada como negação de serviço, agrupamento de chamadas para burlar limite, documentação exposta, método não previsto, confusão de tipo de conteúdo) |
| **7.4** | **Perfil por stack:** a implementação concreta de cada requisito técnico. Uma coluna por stack adotada |
| **7.5** | **Perfil por setor:** o que muda com dado de saúde, financeiro, educacional, de menor de idade |

> **Regra de manutenção:** um perfil novo é uma coluna nova, nunca um capítulo
> novo. Se um perfil exigir requisito que não existe, **o requisito nasce genérico
> no Volume IV** e o perfil apenas o seleciona.

---

## VOLUME VIII · ADOÇÃO

**Responde:** como sair do zero, sem parar de entregar.

**Por que fecha:** playbook que não é adotado é enfeite. Este volume é o que
transforma o catálogo inteiro em trabalho de segunda-feira.

| Seção | Conteúdo |
|---|---|
| **8.1** | **Diagnóstico inicial:** onde a organização está hoje, em uma tarde |
| **8.2** | **A primeira semana:** os requisitos de maior dano e menor esforço. **A ordem de ataque** |
| **8.3** | **As três ondas de maturidade**, ancoradas nos níveis do SAMM: sobreviver → sistematizar → sustentar |
| **8.4** | **Rotinas:** o que é diário, semanal, mensal, trimestral, anual |
| **8.5** | **Como manter o playbook vivo:** quem revisa, com que gatilho, e como incorporar requisito novo sem quebrar o contrato da Parte A |
| **8.6** | **Erros de adoção:** começar pelo mais difícil · comprar ferramenta antes de ter processo · exigir N3 em contexto N1 · marcar checklist sem entender |

---

## ANEXOS OPERACIONAIS

Os anexos **não contêm regra** — só ponteiro, formulário e mapeamento. É a
Regra 3 do contrato.

| Anexo | Conteúdo |
|---|---|
| **A** | **Catálogo completo de requisitos**, por família, com a ficha da Parte C. O coração operável |
| **B** | **Catálogo de falhas:** cada falha conhecida com sinal, verificação, exploração, e o ID que a previne. Ordenado por severidade. **É o índice "por falha"** |
| **C** | **Checklists por momento:** governar · desenhar · construir · publicar · auditar o existente · rotina de operação. **Todo item é um ID.** É o índice "por momento" |
| **D** | **Formulários e modelos:** política · registro de risco · aceite de exceção · relatório de incidente · notificação a titular · cláusula de fornecedor · registro de decisão de arquitetura |
| **E** | **Prompts de auditoria** para ferramenta de IA, por domínio |
| **F** | **Matrizes de mapeamento:** ID × ASVS · CSF · ISO 27001 · SSDF · Top 10 · Top 10 de LLM. **É a prova da Regra 1** |
| **G** | **Implementação por stack:** a tabela do 7.4, expandida |
| **H** | **Casos reais**, cada um mapeado ao requisito que o teria evitado |
| **I** | **Glossário** |
| **J** | **Âncoras e leitura:** os padrões da Parte B e a régua de número (`numeros.md`) |
| **K** | **Limitações declaradas:** o que este playbook não cobre, e por quê |

---

# PARTE F — OS PERFIS DE RIGOR

Resolve a pergunta mais frequente na prática: *quanto de segurança para este caso?*
O rigor muda conforme **quem se machuca se der errado**.

| | **N1 · BÁSICO** | **N2 · PADRÃO** | **N3 · CRÍTICO** |
|---|---|---|---|
| **Quando** | Sem autenticação, ou só dado da própria organização. Site institucional, ferramenta interna, protótipo | **Existe dado de terceiro.** Login, cliente, cadastro, documento. **É o padrão de qualquer sistema em produção com usuário real** | Dado sensível, financeiro ou de saúde · volume alto · terceiros dependem do sistema para operar · obrigação regulatória |
| **Ameaça dominante** | Automatizada e oportunista | + o usuário curioso e o que quer vantagem | + insider, ataque dirigido, fraude |
| **Exige** | Segredo fora do código e do repositório · transporte cifrado · cabeçalhos · dependências auditadas · erro que não vaza estrutura interna · backup | **Tudo de N1 +** autorização em todo ponto de entrada · isolamento por dono e por tenant · validação no servidor · limite de requisição · trilha de ação sensível · classificação de dado · **restauração testada** | **Tudo de N2 +** MFA obrigatório · **trilha imutável** · criptografia em repouso de dado pessoal · segregação de deveres · retenção e descarte definidos · gestão formal de risco e exceção · **teste de invasão antes de abrir** · plano de incidente escrito e ensaiado |
| **Verificação** | Checklist de publicação | **+ teste de duas contas** · auditoria por domínio · verificação automatizada em cada publicação | **+ teste de invasão** · revisão independente · auditoria periódica com evidência |
| **Formalidade** | Nenhuma. Só fazer | Registro do que foi verificado | Documentado, com dono, prazo e evidência arquivada |

> **Uso duplo:** internamente, define o esforço. Externamente, **é a justificativa
> de escopo e de preço** numa proposta, e protege dos dois erros simétricos —
> prometer N3 cobrando N1, e travar um projeto N1 exigindo controle de N3.
>
> **Ancoragem:** a lógica de três níveis é a do OWASP ASVS.

---

# PARTE G — TENSÕES E ARMADILHAS

O que não cabe numa família só: a régua que liga propriedade a família, a
tensão entre dois requisitos certos, os erros que texto de segurança mais repete
e o que fica fora do catálogo de propósito. **Nada aqui é requisito novo** —
cada item aponta para os identificadores onde a regra mora (Regra 3).

### G.1 · As cinco propriedades e a família de cada

**Toda propriedade do 1.3 tem família própria, e toda família mapeia para pelo
menos uma âncora da Parte B.** É a régua interna do catálogo: assunto novo que
não cabe aponta para uma lacuna **verificável contra régua**, em vez de depender
de alguém reler tudo e ter uma ideia.

| Propriedade | Família responsável |
|---|---|
| Confidencialidade | `DAT` `ACC` `OUT` `SEC` `CRY` |
| **Integridade** | **`INT`** `VAL` `BIZ` `SUP` |
| **Disponibilidade** | **`RES`** `NET` `BCP` |
| Autenticidade | `IDN` `SES` `CRY` |
| Não-repúdio | `LOG` |

Integridade e disponibilidade têm `INT` e `RES` porque, sem endereço próprio,
ficam espalhadas em pedaços dentro de famílias de confidencialidade.

### G.2 · Exclusão reversível **contra** direito de exclusão

Duas regras que circulam juntas se contradizem: *"nunca apague dado
permanentemente, use exclusão reversível"* e *"quando o titular pede exclusão,
eliminar ou anonimizar; desativar a conta não basta"*.

**As duas estão certas, e o conflito é real.** Marcar como excluído resolve o
erro operacional e **viola** o direito do titular, porque o dado continua lá. É
a armadilha que produz sistema que parece conforme e não é.

| Situação | Comportamento correto |
|---|---|
| Erro operacional (apagou sem querer) | Marcação reversível, com janela de retenção declarada e restauração possível |
| Fim de vínculo comercial | Marcação reversível durante o prazo de obrigação legal de guarda |
| **Pedido de exclusão do titular** | **Eliminação efetiva ou anonimização irreversível**, dentro do prazo legal, **inclusive nas cópias**: réplicas, cópias de segurança, índices de busca, cache, registros e planilhas exportadas |
| Obrigação legal de guarda (fiscal, contábil) | Retenção do mínimo exigido, isolado e com acesso restrito, com o restante eliminado |

**A parte que quase todo sistema erra:** a exclusão precisa alcançar a **cópia
de segurança**. Dado eliminado da tabela e vivo na cópia de ontem não foi
eliminado. O caminho usual é declarar a janela de rotação das cópias na política
de privacidade, com procedimento de supressão na restauração.

Os dois requisitos se referenciam: `INT-01` para o caso operacional, com o aviso
explícito de que não satisfaz o direito, e `INT-05` para o caso legal. A tensão
liga três famílias — `INT`, `CMP` e `BCP` — e só aparece quando integridade,
conformidade e continuidade estão no mesmo catálogo. **É argumento para o
playbook ser único e não três.**

### G.3 · Os erros que o catálogo evita

Erros que texto de segurança repete com frequência. Copiar material sem passar
por esta tabela propaga o erro junto.

| Erro | O que o catálogo diz | Onde mora |
|---|---|---|
| **Top 10 numerado errado**: script injetado no navegador e requisição forjada entre sítios como categorias próprias | Desde 2021 o primeiro mora em Injeção e o segundo não é categoria separada. As duas continuam como falhas que se caçam, com a classificação certa | B.2 · `VAL-03` `NET-08` |
| **Regra dogmática de assinatura de token**: *"sempre assimétrica, nunca simétrica"* | O critério é quantos serviços precisam verificar sem poder emitir. A regra que de fato protege é **nunca simétrica com segredo fraco, curto ou versionado** | `IDN-09` |
| **Produto no lugar de princípio**: indicar o cofre de segredo de um fornecedor | O princípio vai no requisito; a ferramenta, em `stacks.md`. Recomendação de produto envelhece em meses | Regra 5 · `SEC-01` `SEC-09` |
| **Chave literal na instrução de cifra por coluna** | Funciona e é didático, e leva a chave para o registro de consultas do banco, para o histórico do cliente de linha de comando e, conforme a configuração, para a ferramenta de observabilidade: a chave passa a morar ao lado do dado que protege. Esse desenho protege contra vazamento de cópia, pouco contra quem já está na instância, e tira da coluna a busca e a ordenação. **O problema real é gerenciar a chave**, não cifrar | `CRY-02` `DAT-08` |
| **Governança de projeto alheio afirmada sem conferir**: "é de uma fundação, sem dono comercial" | Ferramenta troca de mantenedor. **Quem afirma governança de projeto alheio precisa ter conferido na semana em que escreve** | `stacks.md`, ferramentas por classe |
| **Estatística sem fonte primária** | Número sem fonte primária não entra, e amostra dirigida, interesse comercial de quem mede e cadeia de citação são parte do dado | `numeros.md` |

### G.4 · O que fica fora do catálogo

**Decisão de arquitetura, custo e gestão de projeto sem efeito em segurança:**
limite de conexão, custo em escala, dependência de fornecedor, versionamento de
migração, organização do trabalho por marcos e critério de pronto. A parte que
tem efeito em segurança mora em `RES-01`, `TPR-02` e `SDL-02`. **Catálogo de
segurança que opina sobre o resto perde a régua.**

**Estatística e consequência legal:** ficam em `numeros.md`, com a ressalva
junto. **Limite de plano de plataforma:** em `stacks.md`, com a data da
conferência, porque muda sem aviso.

> **Onde material novo raramente ajuda.** Texto de segurança de mercado se
> concentra nos controles técnicos do caminho da requisição, que é o que vira
> manchete. Governança, risco, terceiros, pessoas, verificação, resposta a
> incidente, continuidade, IA e agentes quase nunca aparecem nele: a completude
> dessas famílias se mede pelas âncoras, nunca pelo que se leu.

---

> **Este documento é a planta baixa e o contrato.** Enquanto as cinco regras da
> Parte A forem respeitadas, o playbook cresce por adição. Se em algum momento
> uma mudança exigir reorganizar a estrutura, a causa estará numa das cinco
> regras — e é lá que se corrige.
