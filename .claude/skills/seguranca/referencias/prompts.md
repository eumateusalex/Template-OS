# Prompts de diagnóstico e auditoria adversarial

> Para usar com ferramenta de código que tem acesso ao projeto. Complementam a
> verificação manual, não a substituem.
>
> **A regra que atravessa todos:** pedir diagnóstico primeiro, autorizar mudança
> depois. Ferramenta que diagnostica e corrige no mesmo passo entrega correção
> que ninguém revisou, em cima de diagnóstico que ninguém conferiu.

---

## Por que a ferramenta que escreveu o código não é boa para auditá-lo

Dois motivos, e ambos importam:

1. **Ela tende a concordar.** Pedir "está seguro?" sobre o próprio trabalho puxa
   para a confirmação. É por isso que os prompts abaixo afirmam que há falhas,
   em vez de perguntar se há.
2. **Ela carrega as premissas de quem escreveu.** Se a suposição errada estava no
   pedido original, ela continua na revisão.

**Quando possível, rodar o prompt de segunda opinião numa sessão limpa**, sem o
histórico da construção.

---

## As cinco instruções que fazem qualquer prompt render mais

Valem para os seis prompts abaixo e para qualquer um que se escreva depois. As
quatro primeiras vieram de comparar duas versões de um mesmo prompt de auditoria
que circulou publicamente: a segunda achava muito mais que a primeira, e a
diferença estava toda aqui.

1. **Detectar o stack antes de procurar.** Cada categoria de falha tem um nome
   diferente em cada tecnologia, e prompt que assume uma plataforma devolve "não
   se aplica" em todas as outras. Mandar identificar linguagem, framework, camada
   de acesso a dado, mecanismo de autenticação e arquivos de publicação **antes**
   de abrir a primeira categoria, e traduzir cada uma para o equivalente local.

2. **Exigir arquivo e linha.** "Você tem problema de referência direta a objeto"
   não é achado: é categoria. Achado é o endereço exato. Sem essa instrução, a
   resposta vem em nível de categoria e ninguém consegue conferir nem corrigir.

3. **Percorrer, não amostrar.** Dizer explicitamente para varrer **todos** os
   pontos de entrada, e não uma seleção. Modelo de linguagem tende a exemplificar
   quando a lista é longa, e exemplo lido como cobertura é auditoria falsa.

4. **Mandar registrar o que está correto.** Sem isso, a saída é uma lista de
   defeitos que não prova nada sobre o que foi olhado. É a régua de
   `achados.md`, seção "Ponto forte também precisa de prova".

5. **Pedir a condição de explorabilidade.** Para cada achado: o que precisaria
   ser verdade para alguém alcançar isso? Interruptor ligado, configuração
   específica, papel já obtido? É o Passo 3 de `achados.md` feito na origem, e é
   o que separa achado de padrão perigoso inalcançável.

> **A que não se copia de material de divulgação:** pedir que a ferramenta
> classifique a severidade e já abra a correção. Severidade é decisão de quem
> audita, com a régua da skill; e correção antes de diagnóstico conferido é o que
> a regra do topo deste arquivo proíbe.

---

## Prompt 1 · Diagnóstico geral

Use quando não se sabe por onde começar. É o mais amplo e o menos preciso.

```
Aja como revisor de segurança de aplicação. Assuma que este projeto foi
construído rápido, com foco em funcionar, e que controles de segurança foram
deixados para depois.

ANTES DE PROCURAR QUALQUER COISA, identifique o stack: linguagem, framework,
camada de acesso ao banco, mecanismo de autenticação, o que roda no cliente, e
os arquivos de publicação e de esteira. Depois traduza cada categoria abaixo
para o equivalente exato deste stack, e diga qual foi a tradução. Categoria que
não existir aqui, diga que não existe, em vez de forçar achado.

Analise o projeto e me diga, com nome de arquivo e linha:

1. Existe credencial, chave ou segredo em código que vai para o navegador, ou
   em arquivo versionado? O arquivo de ambiente está ignorado pelo versionador,
   e sempre esteve no histórico?
2. Em cada rota que recebe um identificador, o código confirma que aquele
   registro pertence a quem está pedindo, ou basta trocar o número?
3. Toda rota que exige conta está protegida? Existe rota sensível respondendo
   sem autenticação, ou lógica de autenticação invertida?
4. As escritas validam contra esquema em modo estrito, ou um campo extra no
   corpo é gravado? Papel, plano, saldo e situação são alteráveis por rota de
   perfil?
5. As respostas declaram os campos que entregam, ou serializam o registro do
   banco inteiro?
6. Se há banco alcançável pelo cliente: toda tabela com dado de usuário tem
   política ativa, com condição que confere o dono? Existe política que libera
   para todos?

7. Em cada bloco que trata erro dentro de autorização, verificação de
   assinatura, limite de requisição ou validação de sessão: quando a verificação
   não consegue concluir, o código nega ou libera?
8. Existe segredo com valor alternativo embutido, que faça o sistema subir sem a
   variável definida? Há verificação de partida que recuse esses valores?

Percorra TODOS os pontos de entrada e TODOS os manipuladores de rota, um a um.
Não use amostra, e não exemplifique: se a lista for longa, ela é longa.

Para cada achado: arquivo e número da linha, o trecho, o que um atacante
consegue com isso na prática, a correção mais simples que resolve, e a condição
de explorabilidade — o que precisaria ser verdade para alguém alcançar isso.

Registre também o que você verificou e está CORRETO, com a evidência de cada
um. Essa parte prova o que foi olhado, e sem ela não dá para distinguir sistema
bem construído de revisão superficial.

Não altere nada. Só o diagnóstico, ordenado por gravidade. Se não achar nada
numa categoria, diga que não achou, em vez de preencher.
```

---

## Prompt 2 · Segunda opinião, sessão limpa

**O detalhe que faz funcionar é afirmar que existem falhas.** Sem isso, a
tendência é responder que está tudo bem.

```
Você é um auditor de segurança cético. Este código foi escrito com auxílio de
ferramenta geradora e quase certamente tem falhas de segurança.

Assuma que quem escreveu cometeu pelo menos três erros e encontre-os.

Foque em:
- segredo que chega ao navegador ou ao repositório
- banco alcançável sem passar pela aplicação, ou com política ausente
- troca de identificador devolvendo dado de outra pessoa
- rota sensível respondendo sem autenticação
- campo de dinheiro ou de poder (plano, crédito, papel, situação) numa linha
  que o próprio usuário consegue alterar
- valor monetário que chega do cliente em vez de ser calculado no servidor

Para cada falha: onde está, como um atacante exploraria passo a passo, e como
corrigir.

Se depois de procurar você concluir que uma dessas categorias está correta,
diga isso explicitamente e explique o que a torna correta. Não invente achado
para preencher a lista.
```

---

## Prompt 3 · Auto-ataque pela interface

Não pede leitura de código: pede que a ferramenta tente abusar do sistema como
um usuário faria. Pega falha de lógica que a leitura de código não revela.

```
Aja como um usuário mal-intencionado testando este sistema pela interface,
sem privilégio nenhum além de uma conta comum.

Tente e me diga o resultado de cada teste:

1. Existe algum jeito de me dar plano pago, crédito, ou privilégio
   administrativo alterando um dado que eu mesmo consigo editar?
2. Existe alguma tela ou requisição onde, trocando um identificador, volta
   dado que não é meu?
3. Existe alguma ação que custa dinheiro (gerar conteúdo, enviar mensagem,
   chamar serviço pago) que eu consiga repetir sem limite?
4. Existe alguma página, arquivo ou dado que eu alcance sem estar autenticado?
5. Existe operação que, disparada várias vezes ao mesmo tempo, produz efeito
   duplicado — resgatar o mesmo saldo, usar o mesmo cupom, gerar dois pedidos?
6. Consigo enviar um arquivo de tipo não previsto, ou baixar arquivo de outra
   pessoa?

Para cada um: se é falha real, onde no código acontece, e como corrigir.
```

---

## Prompt 4 · Revisão de banco alcançável pelo cliente

Quando o cliente fala direto com o banco, a política deixa de ser defesa em
profundidade e passa a ser a defesa principal. Merece prompt próprio.

```
Revise a configuração de acesso ao banco deste projeto.

Para cada tabela, me diga:
1. A política por linha está ativa?
2. Quais operações têm política declarada: leitura, criação, alteração, exclusão?
3. A condição de cada política usa a identidade da sessão do servidor, ou
   compara com um valor que o cliente envia?
4. A política de alteração declara tanto a condição de leitura quanto a do
   resultado gravado? Sem as duas, o usuário consegue transferir o registro
   para outro dono.
5. Existe política com condição sempre verdadeira?
6. A credencial que ignora as políticas aparece em algum código que vai para
   o navegador?
7. Em sistema com várias organizações: a condição confere organização E dono,
   ou só um dos dois?

Depois, me diga quais tabelas guardam dado pessoal e qual o risco atual de cada
uma. Não altere nada ainda.
```

---

## Prompt 5 · Revisão de agente ou integração com modelo

Nenhuma ferramenta genérica cobre isso hoje.

```
Revise a segurança da integração com modelo de linguagem neste projeto.

1. Que conteúdo externo o modelo lê — mensagem de usuário, documento, página
   buscada, resultado de ferramenta? Esse conteúdo está separado das instruções
   do sistema, ou é concatenado com elas?
2. A saída do modelo é executada, usada para montar consulta ou comando, ou
   renderizada como marcação? Se sim, passa por validação antes?
3. Com qual identidade o agente age? Ele tem credencial própria, ou usa a de
   uma pessoa? A permissão dele é maior que a de quem solicita a ação?
4. Existe teto de chamadas e de custo por período? Onde ele é verificado: no
   servidor, ou no código que o próprio agente executa?
5. Que dado sai desta aplicação para o provedor do modelo? Ele é minimizado
   antes de sair?
6. As ações do agente ficam registradas com a instrução que as gerou?
7. Alguma ação irreversível é executada sem confirmação humana?

Para cada ponto frágil: o cenário de abuso concreto e a correção.
```

---

## Prompt 6 · Regras permanentes do projeto

Não é diagnóstico: gera o arquivo que faz a segurança entrar em todo pedido
seguinte sem alguém repetir. É o requisito `SDL-03`.

```
Com base neste projeto, escreva o bloco de regras de segurança que deve entrar
no arquivo de instruções permanentes do repositório.

As regras precisam ser específicas e verificáveis, não genéricas. "Seguir boas
práticas" não muda o código gerado; "toda busca por registro carrega o dono na
consulta" muda.

Cubra: validação no servidor, verificação de propriedade antes de responder,
origem da identidade, esquema estrito na escrita, campos que a resposta entrega,
onde vivem os segredos, consulta parametrizada, e o que sempre é auditado.

Acrescente as regras específicas das superfícies que este projeto tem.

Máximo de quinze linhas. Elas entram em todo pedido, então precisam ser curtas.
```

---

## Como ler o que a ferramenta devolver

**Nada do que sai daqui é achado ainda.** É sinal. O que separa sinal de achado
está em `achados.md`, e vale integralmente para a saída destes prompts: de onde
vem o valor, se o ambiente já neutraliza aquele padrão, se aquilo roda, a
refutação, e o corte de confiança.

**A saída de ferramenta merece a régua mais que qualquer outra fonte**, por dois
motivos que só existem aqui:

1. **Ela responde no formato de achado mesmo quando não achou nada.** Título,
   severidade, arquivo e correção saem formatados de qualquer jeito, e o formato
   convence sozinho. Sinal humano vem com dúvida embutida; este não vem.
2. **Ela cita arquivo e linha sem que isso seja prova.** Localização plausível é
   o falso positivo mais caro, porque parece exatamente com a prova que o
   relatório exige. Abrir o arquivo e conferir é obrigatório, sempre.

Duas regras específicas desta fonte, que não estão na régua geral:

**Correção é passo separado.** Diagnóstico aprovado primeiro, correção depois,
com revisão do que mudou. E cada correção precisa ser reverificada pelo mesmo
teste que demonstrou a falha, conforme `VUL-03`.

**A mesma falha costuma existir em mais de um lugar.** Encontrada numa rota,
procurar o padrão nas outras: é a diferença entre corrigir o caso e corrigir o
sistema. A ferramenta costuma reportar a primeira ocorrência e parar.
