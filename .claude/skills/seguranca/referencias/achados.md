# Do sinal ao achado — a régua que separa achado de ruído

> Carregado no passo de classificação, em qualquer modo que produza achado:
> auditar e publicar. **Não substitui o campo `teste` da ficha** — decide o que
> fazer com o resultado dele.
>
> O catálogo responde *o que verificar*. As referências de modo respondem *em que
> ordem*. Este arquivo responde a pergunta que sobra e que é onde a auditoria
> costuma morrer: **isto que eu encontrei é mesmo um achado?**

---

## Por que existe

Duas falhas opostas, e as duas destroem a auditoria:

| Falha | Consequência |
|---|---|
| **Reportar o que não é** | Quem recebe confere o primeiro, vê que não procede, e para de conferir. Os achados verdadeiros morrem junto |
| **Não reportar o que é** | A auditoria não serviu para nada, e ainda deu uma sensação falsa de conforto |

A régua abaixo corta a primeira **sem criar a segunda**, porque o que não
sobrevive a ela não é descartado: vira **não verificado**, que é um estado
honesto e continua no relatório.

**Os cinco passos são sequenciais e baratos.** Rodar todos custa menos que
defender um falso positivo numa reunião.

---

## Passo 1 · De onde vem o valor

**É a pergunta mais decisiva do arquivo inteiro.** Padrão perigoso com valor que
o atacante não controla não é vulnerabilidade: é higiene.

| Controlado por quem está do outro lado | Controlado pelo servidor |
|---|---|
| Parâmetro de requisição: consulta, corpo, formulário | Variável de ambiente injetada na implantação |
| Cabeçalho, e cookie sem assinatura | Arquivo de configuração versionado |
| Segmento de caminho e identificador na rota | Constante declarada em código |
| Nome e conteúdo de arquivo enviado | Valor derivado de sessão assinada pelo servidor |
| Mensagem de canal persistente | Resultado de cálculo feito só no servidor |

**A regra:** padrão perigoso **mais** valor da coluna da direita = **não é
achado**. No máximo vira observação de severidade baixa, se houver risco de
alguém mover aquele valor para a coluna da esquerda depois.

### As três armadilhas deste passo

1. **"Veio do banco" não é servidor-controlado.** Dado que o usuário gravou
   ontem e o sistema lê hoje é atacante-controlado com atraso. É exatamente
   assim que nasce a injeção que só dispara na segunda leitura, e é o caso que
   a leitura apressada mais perde.
2. **Configuração que aceita valor de fora deixa de ser configuração.** Se a
   variável de ambiente é preenchida a partir de algo que o usuário informa,
   ela mudou de coluna.
3. **Rastrear até a origem, não até a função anterior.** Parar no primeiro
   parâmetro e concluir "vem de cima" é como não ter rastreado. Ou se chega a
   uma das duas colunas, ou o requisito fica **não verificado**.

---

## Passo 2 · O ambiente já neutraliza isso?

Boa parte do que parece falha já vem resolvido por padrão. **O achado não é o
uso do recurso: é o uso do recurso com o desvio explícito ligado.**

| O padrão do ambiente | Vira achado quando |
|---|---|
| Renderização que escapa a saída sozinha | Alguém pede marcação bruta, ou declara aquele conteúdo confiável |
| Mapeador que parametriza a consulta | Alguém usa a via crua e concatena texto nela |
| Serialização que declara os campos | Alguém devolve o registro inteiro do banco |
| Verificação de sessão aplicada na entrada | Alguém registra a rota fora daquela camada |

**Consequência prática:** procurar pelo nome do recurso perigoso devolve
ocorrências, não achados. Só a combinação com o Passo 1 produz achado.

**Antes de afirmar que o ambiente protege, confirmar que a proteção está ligada
naquele caminho.** Padrão de biblioteca é padrão, não garantia: desligar é uma
linha de configuração, e quase sempre está longe do trecho suspeito.

---

## Passo 3 · Isso roda?

| Não se reporta | Por quê |
|---|---|
| Arquivo de teste | Não vai para produção. Salvo quando o alvo é a segurança da própria esteira |
| Código inalcançável | Nenhuma entrada chega até ele |
| Comentário e texto de documentação | Não executa |
| Semente e exemplo não versionado no pacote final | Não acompanha a entrega |

### A exceção que não se negocia: segredo

**Segredo vale em qualquer um dos quatro.** Em teste, em comentário, em código
morto, em exemplo. O valor vaza pela leitura do arquivo, não pela execução dele
— quem varre repositório não pergunta se aquela linha roda. Ver `SEC-01`, e
`SEC-03` para o mesmo raciocínio aplicado ao histórico.

O mesmo vale para qualquer coisa que **exista** em vez de **executar**: porta
aberta, permissão concedida, cópia de segurança acessível.

---

## Passo 4 · A refutação

**Antes de escrever o achado, tentar derrubá-lo.** Não é formalidade: é o passo
que mais retira ruído, e é o que quase ninguém faz porque, uma vez encontrado, o
achado já parece verdadeiro.

Três perguntas, todas obrigatórias:

1. **Existe camada antes desta que impede o cenário?** Proteção de borda,
   camada de entrada, política no próprio banco, verificação declarada fora do
   corpo da rota. Ver a lista dos cinco lugares onde o controle pode morar, em
   `auditar.md`.
2. **O caminho é alcançável por quem eu digo que alcança?** A rota está
   registrada? Exige sessão antes de chegar ali? Está atrás de uma chave de
   ativação desligada?
3. **Consigo escrever a requisição concreta que explora isso?** Método, caminho,
   corpo, e quem está autenticado. **Se não consigo escrever, não sei se
   existe.**

| Resultado | Estado |
|---|---|
| Sobrevive às três | **Achado.** Segue para o relatório com a prova |
| Cai em qualquer uma | **Não é achado.** Registrar o motivo, para não reencontrar o mesmo sinal na próxima passada |
| Não consigo responder uma delas | **Não verificado**, dizendo qual pergunta ficou aberta e o que falta para respondê-la |

### Quem refuta não deveria ser quem achou

Quem encontrou já investiu na hipótese e vai procurar confirmação. Quando não
houver uma segunda pessoa:

- **Refutar num turno separado**, depois de fechar a caça, nunca no mesmo
  impulso em que o sinal apareceu
- **Escrever a refutação**, em vez de fazê-la de cabeça. Refutação pensada e não
  escrita é quase sempre uma concordância disfarçada
- **Quando possível, refutar em sessão limpa**, sem o histórico da caça — mesmo
  argumento do `prompts.md` sobre a ferramenta que escreveu o código

---

## Passo 5 · O corte de confiança

| Confiança | Critério | Destino |
|---|---|---|
| **Alta** | Passo 1 resolvido na coluna esquerda, Passo 2 com desvio confirmado, e a requisição do Passo 4.3 escrita | **Achado no relatório**, com severidade |
| **Média** | O padrão está lá, mas a origem do valor não foi rastreada até o fim | **Não verificado**, com o que falta rastrear |
| **Baixa** | Preocupação teórica, sem caminho descrito | **Fora do relatório.** Se for higiene que vale corrigir, vira nota, não achado |

**Média nunca vira alta por insistência.** Vira alta quando alguém rastreia a
origem. Enquanto ninguém rastreia, "não verificado" é a resposta correta e é
mais útil que um achado que não se sustenta.

---

## A ordem da caça: por ângulo, não por arquivo

Percorrer arquivo por arquivo encontra **o que está escrito**. A maior parte das
falhas de segurança é **o que está faltando**, e ausência não tem arquivo para
aparecer.

Por isso a caça se organiza em passadas independentes, cada uma com uma pergunta
só:

| Ângulo | A pergunta da passada |
|---|---|
| **Fronteira** | Por onde dado de fora entra neste sistema? Listar todas, antes de olhar qualquer uma |
| **Autorização** | Para cada entrada protegida, o que garante que este solicitante pode este recurso? |
| **Identidade e sessão** | Como a identidade é estabelecida, transportada e encerrada? |
| **Lógica e dinheiro** | Que operação muda saldo, plano, papel ou situação, e quem consegue dispará-la? |
| **Segredo e configuração** | O que é secreto, onde vive, e por quantos caminhos vaza? |
| **Recurso e custo** | O que custa caro por chamada, e o que impede a repetição? |
| **Cadeia** | O que roda aqui e não foi escrito aqui? |
| **Modelo e agente** | O que o modelo lê, e o que ele consegue fazer com o que leu? |
| **Falha e exceção** | Quando esta verificação não conseguir concluir, o que acontece? |

**O nono ângulo é o mais novo e o menos percorrido.** Ele existe porque o
princípio de falha segura tem duas metades — nascer fechado, e **continuar
fechado quando quebra** — e a segunda quase nunca é procurada. A passada dele é
curta: achar todo bloco que trata erro dentro de um caminho de autorização,
verificação de assinatura, limite de requisição ou validação de sessão, e
perguntar o que ele devolve. `ARQ-03`.

> **Por que ele passa despercebido:** o bloco que libera em caso de erro quase
> nunca foi escrito de propósito. Ele nasce de um tratamento genérico que devolve
> um valor neutro, e o valor neutro de uma pergunta de permissão é *liberar*.
> Ninguém decidiu isso, e por isso ninguém lembra de conferir.

**Uma passada por vez, sem misturar.** Passada que persegue tudo ao mesmo tempo
encontra o óbvio de cada ângulo e o fundo de nenhum.

**Sobreposição é bom sinal, não retrabalho.** A mesma falha encontrada por dois
ângulos diferentes chega ao Passo 4 mais forte, porque já tem dois caminhos de
exploração descritos.

### Dois ângulos com procedimento escrito

Os outros sete se resolvem com a pergunta. Estes dois erram quando se confia na
leitura, e por isso têm passo a passo.

**Fronteira — enumerar antes de olhar.** O primeiro artefato da passada é a
**lista completa** dos pontos de entrada, montada antes de examinar qualquer um.
Amostra é o modo mais comum de uma auditoria passar limpo: o que não entrou na
amostra não recebeu verificação e ainda assim sai do relatório como se tivesse
recebido. Se a lista for grande demais para percorrer inteira, isso não vira
amostra — vira escopo declarado, e o que ficou de fora entra como **não
verificado**, com o motivo.

**Autorização — cruzar o cliente com o servidor.** A falha aqui quase nunca está
no que o servidor faz; está no que ele **deixou de fazer** porque o cliente já
tinha feito. O procedimento é um cruzamento, em três passos:

1. **Listar todo controle de papel do lado do cliente** — o menu que só aparece
   para administrador, o botão que some, a rota que redireciona, a condicional
   sobre um campo de papel ou permissão
2. **Para cada um, achar o endereço do servidor** que a ação correspondente
   chama. É o passo que dá trabalho, e é o passo que encontra
3. **Perguntar do servidor, sem passar pelo cliente**, se aquele endereço recusa
   um solicitante sem o papel

**O que faz esse cruzamento render:** cada esconderijo no cliente é uma
**confissão de que existe uma operação privilegiada ali**. A interface está
dizendo onde procurar. Um sistema que esconde sete coisas do usuário comum tem
sete endereços para conferir, e essa lista sai de graça.

⚠️ **Esconder não é proteger, e a recíproca também vale:** endereço que o cliente
nunca mostra continua respondendo para quem souber chamá-lo. A lista do cliente é
o começo da caça, nunca o fim dela.

Os ângulos ordenam a **caça**. A ordem de **prioridade** para tempo curto é
outra, e está em `auditar.md`, na seção dos cinco que concentram o dano.

---

## O que este arquivo não autoriza

**Reduzir ruído não é silenciar.** As quatro coisas que continuam obrigatórias no
relatório, mesmo depois de toda a régua acima:

1. **Tudo que ficou "não verificado"**, com o motivo. Omitir é mentir por
   omissão, e é o defeito mais comum de auditoria apressada
2. **Ausência de achado numa categoria**, dita explicitamente, em vez de
   silêncio. Silêncio se lê como "não olhei" e como "está tudo bem" ao mesmo
   tempo
3. **O escopo que não foi coberto**, seja por falta de acesso, de autorização ou
   de ambiente
4. **O que foi verificado e passou, com a prova.** É a seção de pontos fortes, e
   a regra dela está logo abaixo

---

## Ponto forte também precisa de prova

A régua deste arquivo existe para tirar ruído do relatório. **Ela não autoriza
entregar um relatório que só tem defeito.**

Um relatório de auditoria tem duas obrigações, e a segunda quase sempre se
esquece: dizer o que está errado, e **provar o que foi olhado**. Sem a segunda,
quem lê não tem como distinguir um sistema bem construído de um sistema mal
auditado — os dois produzem o mesmo silêncio.

| ❌ Não serve | ✅ Serve |
|---|---|
| "Sem achados em `ACC`" | "`ACC-03` — os 14 endereços sob `/api` carregam o dono na consulta. Conferidos um a um; lista em anexo" |
| "Autenticação está adequada" | "`IDN-03` — limite de tentativa ativo nas quatro camadas. Medido: a 6ª tentativa em 60s respondeu com recusa" |
| "Não encontrei segredos" | "`SEC-01` e `SEC-03` — busca por formato em 1.410 arquivos versionados e em todo o histórico, sem resultado. Comando e data no anexo" |

**A diferença não é de redação, é de conteúdo.** A primeira coluna é
indistinguível de preguiça: ela sai igual quando se olhou e quando não se olhou.
A segunda registra **o que foi feito**, e por isso pode ser conferida, repetida e
comparada com a auditoria seguinte.

**Três motivos para isso não ser gentileza com o cliente:**

1. **É a prova da cobertura.** É o que separa "auditei e está bom" de "não achei
   nada", que são afirmações muito diferentes
2. **É o que se compara na próxima auditoria.** Ponto forte que sumiu entre uma e
   outra é regressão, e sem o registro anterior ninguém percebe
3. **Protege quem construiu.** Relatório que só lista defeito é lido como
   julgamento e cria resistência à auditoria seguinte, que é o pior resultado
   possível para a segurança do sistema

⚠️ **Ponto forte segue a mesma régua de prova dos achados.** Sem evidência, ele
não vira ponto forte: vira **não verificado**. Escrever "está protegido" sem ter
testado é o mesmo erro do achado sem prova, com o sinal trocado — e é pior, porque
ninguém volta para conferir uma boa notícia.

E a regra que não muda: **achado sem prova não entra no relatório.** A régua
deste arquivo decide o que merece ser investigado até virar prova, nunca o que
pode ser afirmado sem ela.
