# Modo Auditar — sistema que já existe

> Carregado quando o pedido é "meu sistema está seguro?", "revisa a segurança",
> "acha vulnerabilidade", "conferir política de acesso", "auditoria".
>
> **Este modo não altera código.** Entrega diagnóstico priorizado, com prova.
> Correção só depois de aprovada, e num passo separado.

---

## Antes de começar: autorização

Testar sistema de terceiro sem autorização é crime na maior parte das
jurisdições. No Brasil, invasão de dispositivo informático é tipificada em lei
específica. **Auditar só:**

- o que é do próprio usuário, ou
- o que ele tem autorização escrita para testar

A autorização precisa declarar **o escopo** (quais sistemas e endereços), **a
janela** (quando pode) e **os métodos permitidos** — especialmente se incluem
verificação de nível D. Autorização verbal não protege ninguém.

Se houver dúvida sobre a titularidade do sistema, **perguntar antes de rodar
qualquer coisa**. Perfil e leitura de arquivo são inofensivos; teste ativo
contra sistema em produção não é.

---

## O procedimento, em 8 passos

### 1 · Perfilar

```bash
node ../scripts/perfil.js <projeto> --json > perfil.json
node ../scripts/perfil.js <projeto>
```

Ler a saída legível e **confirmar as superfícies marcadas como possíveis**. Uma
menção à palavra "webhook" num comentário não prova que existe pagamento.
Perguntar ao usuário em vez de assumir.

Se o perfil detectar superfície que o usuário não reconhece, ou deixar de
detectar algo que ele afirma existir, **o perfil está errado e o resto seria
construído em cima do erro.** Ajustar antes de seguir.

### 2 · Selecionar

```bash
node ../scripts/requisitos.js --perfil perfil.json
```

Isso já vem ordenado por severidade. **Começar pelas críticas.** Se o usuário
tiver pouco tempo, auditar só as críticas já entrega a maior parte do valor.

Abrir a ficha completa **só** dos requisitos que serão de fato verificados:

```bash
node ../scripts/requisitos.js --id DAT-01 --completo
```

### 3 · Ler as exceções

Se existir `.seguranca-excecoes.json` na raiz do projeto, o perfil já o mostrou.
**Requisito com exceção registrada e válida não vira achado.** Vira registro,
com a data de revisão.

Exceção **vencida** (data de revisão no passado) vira achado de novo, com
severidade original, e com a observação de que o prazo passou.

### 4 · Apresentar o plano e PARAR

```bash
node ../scripts/requisitos.js --plano --perfil perfil.json
```

**Este é o passo que separa auditoria de invasão bem-intencionada.** Mostrar ao
usuário o que foi identificado, o que será verificado, por qual método, o que
fica de fora, e o que se precisa dele. Então **esperar**.

Três coisas dependem dessa aprovação e nenhuma delas é reversível por conta
própria:

| Precisa de aprovação | Por quê |
|---|---|
| **Testes de nível C** | Criam conta e dado de teste numa base que pode ser de produção |
| **Testes de nível D** | Disparam bloqueio de conta real, consomem crédito de serviço pago, alteram estado, geram carga |
| **O escopo** | O usuário pode preferir só as críticas, ou excluir uma área que está em migração |

**Enquanto espera, pode rodar A e B.** São leitura e observação, sem efeito, e
já produzem a maior parte dos achados baratos. Chegar com alguns achados
concretos junto do plano ajuda o usuário a decidir se vale ir adiante.

**O que fazer se o usuário disser "pode ir, faz tudo":** confirmar o ambiente
antes de rodar nível D. "Pode ir" contra produção e contra homologação são
decisões diferentes, e quem pediu talvez não tenha pensado nisso.

### 5 · Verificar

Cada ficha traz o campo `teste`. **É o procedimento, e ele é executável.**
Não inventar verificação própria quando a ficha traz uma.

Ordem de custo crescente:

| Nível | O que faz | Custo |
|---|---|---|
| **A · Leitura** | Configuração, manifesto, esquema, regra de exclusão do repositório | Nenhum. Sempre fazer |
| **B · Inspeção** | Pacote publicado, cabeçalhos de resposta, variáveis públicas, histórico do repositório | Baixo. Quase sempre fazer |
| **C · Duas contas** | Criar A e B, gerar dado em cada, tentar alcançar o de B autenticado como A | Médio. **É o teste que mais acha coisa e o que quase ninguém faz** |
| **D · Ativo** | Requisição forjada, sequência de tentativas, chamada anônima ao banco | Alto. **Só com autorização explícita e em ambiente combinado** |

**O nível C é o que separa auditoria de leitura de código.** Referência direta a
objeto, falha de isolamento entre organizações e vazamento por resposta só
aparecem com duas contas de verdade.

**A ordem da varredura é por ângulo, não por arquivo.** Uma passada por pergunta
— por onde entra dado de fora, o que garante a autorização, o que custa caro,
o que é secreto — em vez de uma leitura sequencial do repositório. Arquivo por
arquivo encontra o que está escrito; a maior parte das falhas é o que está
faltando, e ausência não tem arquivo. Os nove ângulos estão em `achados.md`.

### 6 · Classificar

**Antes de classificar qualquer coisa como achado, passar pela régua de
`achados.md`.** São cinco passos baratos que respondem a pergunta que decide o
relatório inteiro: *isto que eu encontrei é mesmo um achado?* Os dois primeiros
resolvem a maior parte sozinhos — de onde vem o valor, e se o ambiente já
neutraliza aquele padrão. O quarto, a refutação, é o que quase ninguém faz.

Cada requisito verificado recebe um dos três estados:

| Estado | Quando | Vai para o relatório? |
|---|---|---|
| **Conforme** | O teste passou | Só na contagem |
| **Lacuna** | O teste falhou e não há exceção registrada | **Sim, como achado** |
| **Exceção aceita** | Falhou, mas há decisão registrada e no prazo | Sim, como registro |
| **Não verificado** | Faltou acesso, ambiente ou autorização | **Sim, e é obrigatório dizer** |

**"Não verificado" nunca vira "conforme".** Relatório que omite o que não foi
testado mente por omissão, e é o defeito mais comum em auditoria apressada.

### 7 · Entregar

O relatório no formato abaixo, e depois o passo 8.

### 8 · Gerar o documento

Auditoria que termina no terminal não é entregue: ela é lida uma vez, por uma
pessoa, e some com a janela. O documento é o que se manda, se guarda e se
compara com a auditoria seguinte.

```bash
node .claude/skills/seguranca/scripts/relatorio.js achados.json      --perfil perfil.json --saida docs/seguranca/
```

O contrato do `achados.json`, o que cada campo significa e as travas que o
script impõe estão em `relatorio.md`. Três delas valem saber antes:

- **Achado sem prova não é gravado.** Vira "não verificado", como manda a régua
- **Valor que pareça credencial faz o script recusar gravar**, inteiro. É a
  regra 10 da skill virando código em vez de recomendação
- **A saída é um arquivo só**, que abre sem servidor e imprime em papel pelo
  próprio navegador

O documento sai neutro de marca. Identidade visual entra por `--tema`, de fora
da skill — ela serve qualquer organização, e por isso não carrega a de ninguém.

---

## O formato do relatório

```
AUDITORIA DE SEGURANÇA — <projeto>
<data> · nível <N> · <stack>

RESUMO
  Verificados: <n> de <total> aplicáveis
  Críticos: <n>   Altos: <n>   Médios: <n>   Baixos: <n>
  Exceções registradas: <n>   Não verificados: <n>

ACHADOS, por severidade

[CRÍTICA] <ID> · <título>
  Onde:     <arquivo:linha> ou <endpoint>
  Prova:    <saída do comando, trecho, resposta>
  Impacto:  <o que um atacante consegue, concretamente>
  Correção: <o que fazer, do jeito mais barato que resolve>
  Testar:   <como confirmar que a correção funcionou>

...

PONTOS FORTES, com evidência
  <ID> — <o que foi verificado, e o que a verificação devolveu>
  ...

EXCEÇÕES REGISTRADAS
  <ID> — <motivo> — revisar em <data>

NÃO VERIFICADO, e por quê
  <ID> — <motivo: sem acesso, sem autorização, ambiente indisponível>

O QUE NÃO SE APLICA
  <famílias inativas do perfil, em uma linha>
```

**Regras do relatório:**

1. **Prova em todo achado.** Arquivo e linha, saída de comando, ou resposta
   observada. Achado sem prova sai do relatório, ou vira "não verificado".
2. **Impacto em linguagem de consequência**, não de categoria. "Qualquer pessoa
   lê a base de clientes sem estar logada" comunica; "falha de controle de
   acesso" não.
3. **Correção pelo caminho mais barato que resolve.** Se ligar uma opção
   resolve, não propor refatoração.
4. **Nunca imprimir valor de segredo.** Nem no achado, nem na prova. Nome,
   prefixo e localização bastam.
5. **Não listar o inaplicável** como se fosse conquista. Uma linha basta.
6. **Ponto forte com prova, ou não entra.** A seção existe para provar cobertura,
   e "está adequado" não prova nada: registrar o que foi testado e o que a
   verificação devolveu. Sem evidência, aquilo é **não verificado**, não é ponto
   forte. A régua está em `achados.md`, na seção "Ponto forte também precisa de
   prova".

> **Por que a seção de pontos fortes não é gentileza.** Relatório sem ela é
> indistinguível de relatório de quem não olhou: os dois produzem silêncio nas
> mesmas categorias. Ela é também o que se compara na auditoria seguinte —
> controle que existia e sumiu é regressão, e sem o registro anterior ninguém
> percebe.

---

## Os cinco que concentram o dano

Se o tempo for curto, esta é a ordem. Cruza probabilidade com impacto, usando o
modelo de ameaça da `fundacao.md`.

| Ordem | Onde | Por quê | Custo de corrigir |
|---|---|---|---|
| **1** | **`SEC` — segredo no repositório ou no pacote** | Rotina automatizada acha em segundos e não escolhe alvo. Dá acesso direto e contorna todo o resto | **Minutos**, mais rotação |
| **2** | **`DAT` — banco aberto**, e `NET-10` quando a porta responde pela rede pública | Vaza a base inteira de uma vez, sem passar pela aplicação. É o incidente que vira notícia | **Horas** |
| **3** | **`IDN` — sem limite de tentativa** | Força bruta de graça vira tomada de conta. E quase todo mundo protege só a tela de entrada, esquecendo recuperação e segundo fator | Horas |
| **4** | **`ACC` — referência direta e isolamento** | Vaza dado de cliente para cliente. O custo de reputação é maior que o técnico | Dias |
| **5** | **`BIZ` — dinheiro e notificação externa** | Prejuízo financeiro silencioso. Plano liberado sem pagamento, crédito duplicado, custo sem teto | Dias |

**A ordem de ataque numa tarde:** 1 → 2 → 3 → 4 → 5. Os dois primeiros são os de
maior dano com menor esforço, e são justamente os que o atacante automatizado
explora sozinho.

---

## Verificações que valem em quase todo projeto

Baratas, de nível A e B, e que pegam muito:

```bash
# Segredo no histórico do repositório, não só nos arquivos atuais.
# Busca por NOME acha o rótulo e devolve ruído; busca por FORMATO acha o valor.
# A tabela de prefixos por provedor, e as ferramentas que já os trazem, está em
# `stacks.md`, seção "Segredo: os prefixos que valem a busca".
git log -p --all | grep -nE '(sk_live_|rk_live_|whsec_|AKIA[A-Z0-9]{16}|gh[pousr]_[A-Za-z0-9]{36}|AIza[A-Za-z0-9_-]{35}|xox[baprs]-|BEGIN [A-Z ]*PRIVATE KEY)' | head

# Quando entrou um valor específico já conhecido (sem imprimir o valor)
git log -S'<trecho-do-segredo>' --oneline | head

# O arquivo de ambiente está mesmo ignorado?
git check-ignore -v .env

# Variáveis públicas declaradas (só nomes)
grep -rhoE '^\s*(NEXT_PUBLIC_|VITE_|PUBLIC_|REACT_APP_)[A-Z0-9_]+' .env* 2>/dev/null | sort -u

# Segredo no pacote publicado
grep -rEl '(sk_live|api[_-]?key|service_role|BEGIN [A-Z ]*PRIVATE KEY)' dist/ build/ .next/ 2>/dev/null

# Dependências com falha conhecida. Este é o comando de UM ecossistema:
# projeto com mais de uma linguagem precisa de uma passada por ecossistema, e a
# tabela dos outros está em `stacks.md`, seção "Dependência: o comando de cada
# ecossistema" — junto da armadilha do conserto automático que rebaixa a versão.
npm audit --omit=dev 2>/dev/null | tail -20

# Cabeçalhos de resposta em produção
curl -sI https://<dominio> | grep -Ei 'strict-transport|content-security|x-frame|x-content-type|referrer|permissions-policy'

# Pasta pública devolvendo a relação de arquivos
curl -s https://<dominio>/uploads/ | head -5

# Redirecionamento aceitando destino externo
curl -sI 'https://<dominio>/login?next=https://destino-externo.invalid/' | grep -i '^location'
```

**Para banco alcançável pelo cliente**, o teste decisivo é a chamada anônima:
com a credencial publicável e sem sessão, pedir a tabela mais sensível. Voltou
linha, o achado é crítico e é agora. **Só rodar contra sistema próprio ou
autorizado.**

### As três armadilhas destas verificações

1. **Excluir `node_modules`, `dist` e `.git` de toda busca por texto.** Uma
   busca por prefixo de variável pública sem exclusão devolve dezenas de nomes
   internos de bibliotecas e nenhum do projeto. Achado que morre na primeira
   conferência queima a credibilidade do relatório inteiro. Usar `.env*` e `src/`
   como escopo, não a raiz.
2. **Ausência de saída não é prova de conformidade.** Se `dist/` não existe
   porque ninguém compilou localmente, o requisito do mapa de código fica
   **não verificado**, não conforme. A diferença importa.
3. **Controle pode morar fora do repositório auditado.** Cabeçalhos servidos
   pelo servidor web, política aplicada no painel do provedor, limite de
   requisição na borda: nada disso aparece no código. Antes de reportar
   ausência, perguntar onde aquela camada é configurada. Ver a seção abaixo.

---

## Antes de reportar ausência: onde mais o controle pode estar

Reportar como falha o que já está resolvido queima a credibilidade do relatório
inteiro. Conferir estes cinco lugares:

| O controle pode morar em | Exemplos |
|---|---|
| Servidor web ou camada de borda | Cabeçalhos, limite de requisição, proteção contra tráfego automatizado |
| Painel do provedor de infraestrutura | Regra de rede, cópia de segurança, alerta, acesso administrativo |
| Documentação própria do projeto | Procedimento de incidente, política de dado pessoal, plano de continuidade |
| Automação do ambiente de desenvolvimento | Trava de comando destrutivo, aprovação obrigatória antes de publicar |
| Contrato com terceiro | Compromisso de tratamento de dado, prazo de notificação |

**Quando o controle existe em outro lugar, apontar para lá e não reescrever a
regra.** Duas fontes da verdade sobre a mesma regra é como uma delas fica errada
sem ninguém perceber.

Na primeira execução num projeto, **perguntar quais assuntos já têm dono** e
registrar. Vira parte do perfil, e evita que a próxima auditoria repita a
pergunta.

---

## Depois do relatório

1. **Perguntar o que corrigir primeiro.** A ordem de severidade é sugestão; a
   decisão é de quem responde pelo sistema.
2. **Correção é passo separado**, com aprovação explícita. Nunca no mesmo turno
   do diagnóstico.
3. **Falha que se repete vira requisito**, não bilhete. Se algo apareceu e o
   catálogo não previa, é caso de requisito novo — ver `arquitetura.md`.
4. **Sugerir registrar as exceções.** Todo "isso a gente decidiu deixar assim"
   que aparecer na conversa deve virar entrada em `.seguranca-excecoes.json`,
   senão a próxima auditoria reporta de novo.
5. **Avisar sobre o material único.** O relatório só existe onde foi gravado.
