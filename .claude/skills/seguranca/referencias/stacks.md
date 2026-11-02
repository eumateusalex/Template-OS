# Implementação por stack

> Carregado quando o perfil identificou a tecnologia e é preciso saber **onde**
> cada controle se realiza naquele ambiente.
>
> **Isto não cria requisito.** Os requisitos estão em `dados/requisitos.json` e
> são os mesmos para todo mundo. Aqui está apenas onde cada um mora em cada
> stack, porque o mesmo requisito muda completamente de forma.

---

## Como usar

Ler **só a seção do stack detectado**. Cada seção responde três perguntas:

1. Onde mora o controle de acesso ao dado?
2. Onde moram os segredos, e o que vaza para o cliente?
3. Onde moram os cabeçalhos e o limite de requisição?

E traz as **armadilhas específicas** daquele ambiente, que são o motivo real
desta referência existir.

---

## A pergunta que decide tudo: o cliente alcança o banco?

Antes do stack, a arquitetura. É `ARQ-01`, e muda o peso de metade do catálogo:

| Arquitetura | O que muda |
|---|---|
| **Cliente → servidor → banco** | A autorização mora na aplicação. A política no banco é defesa em profundidade: se falhar, ainda há a camada de cima |
| **Cliente → banco** (plataforma com credencial publicável) | **A política no banco É a autorização.** `DAT-01` e `DAT-12` deixam de ser importantes e passam a ser críticos. Tabela criada sem política nasce aberta ao mundo |

> Não é que a segunda arquitetura seja errada: é que ela transfere o controle de
> acesso para um lugar onde é fácil esquecer. A verificação recorrente
> (`DAT-12`) deixa de ser recomendação e vira obrigação.

---

## Plataforma com banco alcançável pelo cliente

Supabase, Firebase, PocketBase, Appwrite e equivalentes.

### Onde mora o controle de acesso

Na **política por linha, no próprio banco**. É o único lugar, porque o cliente
fala direto com a interface de dados.

| Requisito | Onde se realiza |
|---|---|
| `DAT-01` | Ativar a política na tabela. **Migração não ativa sozinha** |
| `DAT-02` | Uma política por operação, nunca uma cobrindo todas |
| `DAT-03` | Alteração declara a condição de leitura **e** a do resultado gravado |
| `DAT-04` | A condição usa a função de identidade da sessão do provedor |
| `ACC-09` | A condição combina organização **e** dono, não só um |
| `FIL-03` | O armazenamento tem política própria, separada da tabela |

### As duas credenciais

| Credencial | Papel declarado | Onde pode estar |
|---|---|---|
| Publicável | anônimo ou usuário autenticado | **No cliente. É pública por desenho** |
| Administrativa | serviço | **Só no servidor. Ela ignora todas as políticas** |

`DAT-05` se verifica decodificando a parte central da credencial que aparece no
navegador e lendo o campo de papel. Fazer isso **localmente**: colar credencial
suspeita num site de terceiro é o oposto do que se quer com um segredo.

### Armadilhas deste ambiente

**A credencial publicável exposta não é a falha.** Ela é pública por desenho, e
existe crítica frequente que confunde as duas coisas. A falha é a política
ausente: sem ela, aquela credencial pública lê e escreve a base inteira.

**Tabela criada por instrução direta, por migração ou por ferramenta geradora
nasce sem política.** É a razão número um de sistema que sobe com a base aberta.
Ativar precisa ser parte do mesmo commit que cria a tabela.

**Política ativa sem nenhuma política escrita bloqueia tudo.** É seguro e quebra
a aplicação, o que leva alguém a desligar em vez de escrever a política. Ativar
e escrever são o mesmo passo.

**Política com condição sempre verdadeira** dá a aparência de proteção com zero
proteção. Vale conferir uma a uma.

**O armazenamento de arquivos tem política separada.** Proteger as tabelas e
deixar o repositório de arquivos aberto é falha comum, e é a que expõe documento
de identificação.

---

## Servidor em JavaScript

Next.js, Express, Fastify, NestJS, Hono, SvelteKit, Nuxt e equivalentes.

### Onde mora cada controle

| Requisito | Onde se realiza |
|---|---|
| `ACC-01` `ACC-02` | Verificação no tratamento de cada rota. Middleware ajuda a navegação, **não substitui** a verificação no manipulador, porque a rota de API é chamável direto |
| `ACC-05` | Esquema declarativo em modo estrito. Campo desconhecido derruba a requisição, não é descartado em silêncio |
| `VAL-02` | Camada de mapeamento com parâmetro ligado. **Consulta em texto puro dentro do ORM aceita concatenação do mesmo jeito** |
| `SES-01` | Cookie com as três proteções, definido no servidor |
| `SEC-04` | Prefixo público é embutido literalmente no pacote durante a compilação |
| `NET-05` | Cabeçalhos na configuração do framework ou no servidor web à frente |

### A armadilha do prefixo público

Quando a compilação reclama que a variável está indefinida no cliente, a resposta
correta quase nunca é adicionar o prefixo. **É mover a chamada para o servidor.**

O prefixo faz o valor ser substituído literalmente no arquivo que o navegador
baixa. Não é "meio exposto": é texto no pacote.

### Outras armadilhas

**Componente de cliente vai inteiro para o navegador**, incluindo o que parece
lógica interna. Regra de negócio, preço e verificação de permissão não moram ali.

**Mapa de código em produção** reconstrói a árvore original de pastas e nomes.
Costuma vir desligado por padrão: não ligar sem motivo, e se a ferramenta de
monitoramento precisar, enviar para ela e remover da saída.

**Rota de API é chamável sem passar pela tela.** Toda verificação que existe só
na interface não existe.

---

## Framework com sistema de permissão próprio

Frappe, Django, Laravel, Rails e equivalentes.

### O que muda

Estes frameworks trazem controle de acesso próprio, que **não é** a política por
linha das plataformas de banco. O requisito é o mesmo; o mecanismo é outro.

| Requisito | Onde se realiza |
|---|---|
| `DAT-01` `DAT-02` | Regras de permissão por tipo de documento e por papel, na configuração do framework |
| `ACC-03` | O método de permissão por registro do framework, que decide caso a caso |
| `ACC-01` | Verificação declarada por papel, mais a lógica no ponto de entrada |
| `BIZ-12` | Validação no lado do servidor. **Regra escrita em JavaScript de formulário roda no cliente e se contorna** |
| `LOG-01` | Trilha nativa do framework, quando existir, complementada para as ações que ela não cobre |

### Armadilhas deste ambiente

**Permissão por tipo de documento não é permissão por registro.** Autorizar o
papel a ler um tipo permite ler **todos** os registros daquele tipo. A restrição
por dono exige o mecanismo de permissão por registro, que é um passo separado e
frequentemente esquecido.

**Validação escrita no formulário roda no navegador.** Regra que decide valor,
elegibilidade ou permissão precisa estar no lado do servidor, ou não existe.

**Ambiente restrito de execução de script no servidor** costuma não ter todas as
funções disponíveis. Descobrir isso durante a implementação leva a contornos, e
alguns contornos enfraquecem o controle. Conferir o que está disponível antes de
desenhar a regra.

**Quem pode escrever script de servidor tem poder equivalente a administrador.**
Esse papel entra na conferência de acessos de `PPL-01`.

---

## Site estático

Astro, Hugo, Jekyll, Eleventy e equivalentes, sem servidor de aplicação.

### O que se aplica, e o que não

A maior parte do catálogo **não se aplica**, e dizer isso é parte do trabalho.
Sem autenticação, sem banco e sem servidor, não há autorização, sessão nem
política de acesso a dado.

Restam, e são poucos:

| Requisito | Onde se realiza |
|---|---|
| `SEC-01` `SEC-02` `SEC-03` | Nenhuma credencial no repositório nem no histórico |
| `SEC-04` | Qualquer variável no pacote é pública. Se há chave, ela vazou |
| `SEC-06` | Mapa de código desligado na compilação de produção |
| `NET-01` `NET-02` `NET-05` | **No servidor web à frente**, não no gerador |
| `NET-12` | Listagem de diretório desligada em quem serve o conteúdo |
| `SUP-01` `SUP-02` | Dependências do gerador continuam sendo dependências |

### A armadilha principal

**Os cabeçalhos não moram no projeto.** Quem serve o conteúdo é que os define:
servidor web, plataforma de hospedagem, ou rede de distribuição. Auditar o
repositório e reportar cabeçalho ausente é reportar no lugar errado.

**Formulário que envia para serviço de terceiro** transforma um site estático em
sistema que trata dado pessoal. `CMP-01` e `TPR-01` passam a valer, e o nível
sobe de N1 para N2.

---

## Banco relacional administrado por você

Postgres, MySQL e equivalentes, em servidor próprio.

| Requisito | Onde se realiza |
|---|---|
| `DAT-06` | Conta da aplicação com permissão só nas tabelas necessárias, sem privilégio de estrutura |
| `DAT-07` | Conta separada para migração, usada apenas pela publicação |
| `INT-02` `INT-03` | Chave estrangeira e restrição declaradas no esquema |
| `DAT-08` `CRY-02` | Cifra por coluna, com a chave **fora da instrução** |
| `RES-05` | Índice nas colunas de filtro e ordenação frequentes |
| `BCP-01` `BCP-02` | Cópia agendada e restauração exercitada em ambiente descartável |
| `NET-10` | Serviço escutando em rede privada, com lista explícita de origens autorizadas |

### A armadilha da cifra por coluna

O padrão didático mais comum passa a chave **literalmente dentro da instrução**.
Isso a leva para o registro de consultas do banco, para o histórico do cliente de
linha de comando e para a ferramenta de observabilidade. **A chave passa a ficar
guardada ao lado do dado que ela protege.**

Além disso: coluna cifrada deixa de ser pesquisável e ordenável. É decisão de
projeto, tomada antes, não descoberta depois.

### Outras armadilhas

**Serviço administrado costuma entregar uma conta única com tudo.** Criar a conta
restrita da aplicação é passo manual que quase ninguém faz, e é o que limita o
dano de qualquer injeção.

**Porta do banco exposta na internet** é o achado mais grave e mais simples de
verificar, e é o que `NET-10` cobra. O banco não precisa ser alcançável de fora.

---

## Contêineres e servidor próprio

| Requisito | Onde se realiza |
|---|---|
| `ENV-01` | Pilhas separadas por ambiente, sem credencial compartilhada |
| `ENV-03` | Acesso por chave, sem senha. Lista de chaves autorizadas conferida periodicamente |
| `SUP-06` | Imagem com versão fixada e verificada quanto a falhas conhecidas |
| `NET-06` | Limite de requisição na borda, antes de alcançar a aplicação |
| `NET-10` | Serviço interno escutando em rede privada, e porta publicada conferida de fora |
| `NET-11` | Filtro de tráfego automatizado na borda, com a origem inalcançável por fora dela |
| `MON-05` | Verificação de disponibilidade **de fora** da própria infraestrutura |

### Armadilhas deste ambiente

**Regra de firewall do sistema operacional pode não filtrar porta publicada por
contêiner**, dependendo de como o encaminhamento é feito. O tráfego pode passar
por um caminho que a regra não cobre. Conferir de fora, não pela configuração —
é a forma concreta que `NET-10` assume neste ambiente.

**Contêiner que monta o soquete do serviço de contêineres tem poder equivalente a
administrador da máquina.** Contêiner de aplicação nunca precisa disso. Se
aparecer um novo com esse acesso sem explicação, é incidente.

**Monitoramento que roda dentro da infraestrutura monitorada cai junto com ela.**

**Chave de acesso a mais no arquivo de autorizadas** é o sinal de comprometimento
mais barato de detectar, e quase ninguém confere.

---

## Segredo: os prefixos que valem a busca

> Vale para qualquer stack. Está aqui, e não em `auditar.md`, porque nomear
> provedor e ferramenta é função desta referência.

Buscar por `chave`, `senha`, `segredo` e `token` devolve centenas de linhas e
quase nenhum segredo: o nome da variável aparece em toda parte, o valor não.
**Buscar pelo formato do valor inverte a proporção** — credencial de provedor
tem prefixo fixo, e prefixo não aparece por acaso.

| Provedor | Formato que identifica o valor |
|---|---|
| Cobrança e pagamento | `sk_live_`, `rk_live_`, `whsec_`, e as variantes de teste `sk_test_` |
| Nuvem de infraestrutura ampla | `AKIA` ou `ASIA` seguidos de 16 maiúsculas |
| Hospedagem de código | `ghp_`, `gho_`, `ghu_`, `ghs_`, `ghr_` seguidos de 36 caracteres |
| Nuvem com chave de interface | `AIza`, e o arquivo de conta de serviço em notação de objeto |
| Mensageria corporativa | `xoxb-`, `xoxa-`, `xoxp-`, `xoxr-`, `xoxs-` |
| Provedores de modelo de linguagem | `sk-` seguido de cadeia longa, com variantes por provedor |
| Chave privada de qualquer origem | o cabeçalho `BEGIN` seguido de `PRIVATE KEY` |

**Ferramentas que já trazem estes padrões prontos**, e que valem mais que
qualquer busca escrita à mão: `gitleaks` (rápido, com integração antes do
commit), `trufflehog` (confirma se a credencial ainda está viva, o que reduz
muito o ruído) e `detect-secrets` (trabalha com arquivo de linha de base, útil
quando já existe passivo a ignorar). Nenhuma é obrigatória: a tabela acima
resolve a passada manual.

**Duas regras ao usar qualquer uma delas:**

1. **Restringir a busca aos arquivos versionados**, e não à pasta inteira. A
   pasta de dependências devolve chaves de exemplo das próprias bibliotecas, e é
   a origem número um de falso positivo nesta verificação.
2. **Buscar no histórico, não só na árvore atual** — é `SEC-03`. Segredo apagado
   no último commit continua em todo clone e em todo desvio do repositório.
   Além do histórico, buscar por um valor específico ao longo do tempo é o que
   revela quando ele entrou.

**Nunca imprimir o valor encontrado.** Nome do arquivo, linha e prefixo provam
que existe. É regra da skill inteira, e vale principalmente aqui.

---

## Dependência: o comando de cada ecossistema

`SUP-01` pede a verificação de falhas conhecidas. O comando muda por ecossistema,
e projeto com mais de uma linguagem precisa de uma passada para cada:

| Ecossistema | Comando |
|---|---|
| Pacotes de JavaScript | `npm audit --omit=dev` |
| Python | `pip-audit`, ou o equivalente da ferramenta de ambiente em uso |
| Go | `govulncheck ./...` |
| Rust | `cargo audit` |
| Ruby | `bundle audit` |
| PHP | `composer audit` |
| Plataforma de execução gerenciada | `dotnet list package --vulnerable` |

**A armadilha que vale por todas:** o modo de correção automática forçada às
vezes **rebaixa** a versão até uma anterior ao aviso, em vez de subir até a que
corrigiu. O aviso some do relatório e a falha continua rodando. Conferir o que
mudou no arquivo de travamento antes de aceitar qualquer correção automática.

Além das falhas com identificador publicado, vale procurar o **aviso próprio do
framework** em uso: quem mantém o framework costuma publicar orientação de
segurança por versão que nunca vira identificador de falha conhecida, e por isso
não aparece em nenhuma das ferramentas acima.

---

## O que fazer quando o stack não está aqui

Os requisitos são os mesmos. Para traduzir, responder as três perguntas do topo:

1. **Onde mora o controle de acesso ao dado?** Se a resposta for "no banco,
   porque o cliente fala direto com ele", aplicar o rigor da primeira seção.
2. **O que vai para o cliente?** Todo mecanismo de compilação tem uma regra sobre
   que variável é embutida no pacote. Descobrir qual é, antes de guardar segredo.
3. **Quem serve o conteúdo?** É onde moram os cabeçalhos e o limite de
   requisição, e quase nunca é o repositório da aplicação.

Com essas três respostas, o catálogo inteiro se traduz.

---

## Renderização: os pontos de injeção de cada framework

> `VAL-03` diz que toda saída é escapada conforme o contexto. A declaração é
> certa e não ajuda a procurar. Esta tabela é o que transforma o requisito numa
> passada de trinta segundos: são os nomes que se busca no código.

O escape do framework vem ligado por padrão em todos eles. **O que se procura é
onde alguém o desligou** — porque foi preciso mostrar formatação, e a maneira
mais rápida de conseguir isso é injetar marcação bruta.

| Onde | O que desliga o escape | O que ainda executa |
|---|---|---|
| Biblioteca de componentes com marcação em JavaScript | a propriedade cujo nome já avisa que é perigosa, começando por "dangerously" | `href` e `src` recebendo endereço do usuário |
| Framework com diretivas em atributo | a diretiva que injeta HTML cru, normalmente `v-html` ou nome equivalente | ligação de atributo em `href` |
| Framework com compilação de gabarito | a ligação a `innerHTML` entre colchetes, e o serviço que marca conteúdo como confiável | o mesmo `href` |
| JavaScript sem framework | `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write` | `eval`, `new Function`, temporizador recebendo texto |
| Servidor que monta HTML | o filtro de "não escapar" do motor de gabarito | corpo de e-mail montado por concatenação |

**Os três que não são o ponto óbvio, e vazam mais:**

1. **Endereço controlado pelo usuário em `href` ou `src`.** O escape de HTML não
   olha o conteúdo do atributo, e o esquema `javascript:` executa no clique.
   Aceitar apenas `http`, `https` e `mailto`, por lista, é o que resolve.
2. **Renderização de texto com marcação leve.** Converter para HTML e entregar
   sem sanitizar é o caminho mais comum, porque a biblioteca de conversão não
   sanitiza: ela converte. São dois passos, e quase todo projeto faz um.
3. **Documento gerado para envio**, em e-mail ou relatório. Não passa pelo
   framework, e por isso não herda o escape dele.

**Sobre sanitizar:** existe biblioteca dedicada em todo ecossistema, e ela
trabalha por lista de permitidos. Escrever a própria substituição de caracteres é
o erro clássico — a lista de casos é maior do que parece, e o resultado dá a
impressão de proteção sem a proteção.

**A pergunta que fecha a verificação:** para cada uso encontrado, de onde vem o
conteúdo? Marcação bruta com texto que a própria aplicação escreveu não é
achado. Com texto que alguém digitou, é. É o Passo 1 de `achados.md`.

---

## Varredura: a ferramenta de cada classe, e o que cada uma não pega

> `VER-01` exige uma estratégia de verificação que saiba o que cada técnica
> **não** alcança. Esta é a tabela que responde isso, e é a parte mais
> importante desta seção: ferramenta muda de nome e de dono; o que ela deixa
> passar continua igual.

| Classe | O que pega | **O que NÃO pega** |
|---|---|---|
| **Busca de segredo** | Credencial no código e no histórico, por formato do valor | Segredo sem formato reconhecível. Credencial que vive fora do repositório e vaza por outro caminho |
| **Auditoria de dependência** | Falha publicada com identificador, nas versões declaradas | Falha ainda sem identificador. Código próprio. Dependência fora do arquivo de travamento |
| **Análise estática** | Padrão perigoso no código: concatenação em consulta, marcação bruta, chamada ao sistema, valor embutido | **Autorização ausente.** Falha de lógica de negócio. Tudo que dependa de saber quem é o dono do registro |
| **Análise dinâmica** | O que responde no sistema rodando: cabeçalho, configuração de borda, erro verboso, caminho exposto | O que exige entender o domínio. Vazamento entre contas que parece resposta normal |
| **Teste de duas contas** | Isolamento entre titulares, referência direta a objeto, vazamento entre organizações | O que não tem duas contas para comparar |
| **Leitura por pessoa** | Intenção, invariante, o que está faltando | Escala. Não percorre repositório inteiro sem cansar |

**A lacuna que atravessa as quatro primeiras linhas, e por isso vale sozinha:**
**nenhuma ferramenta automática encontra falta de autorização.** Ela não é um
padrão perigoso escrito no código; é a ausência de uma verificação que ninguém
escreveu, e não existe assinatura para o que não está lá. Por isso `VER-03` não é
opcional, e por isso relatório apoiado só em varredura automática passa limpo em
sistema que vaza dado de cliente.

**Ferramentas, por classe**, sem promessa de que continuam sendo a melhor:

| Classe | Onde procurar |
|---|---|
| Segredo | `gitleaks`, `trufflehog`, `detect-secrets` — ver a seção de prefixos acima |
| Cofre de segredo | o serviço de segredo do provedor de nuvem em uso, ou o cofre que a organização já opera. O critério é o de `SEC-01` e `SEC-09`: segredo injetado no momento da execução e rotação com ciclo definido, não a marca |
| Dependência | o comando nativo de cada ecossistema, na seção "Dependência: o comando de cada ecossistema" acima |
| Análise estática, multilíngua | motor de regras que roda padrão sobre a árvore de sintaxe. O fork livre do motor mais conhecido publica sob licença de biblioteca livre e exporta no formato comum |
| Análise estática, por linguagem | quase toda linguagem madura tem o analisador dela, mantido pela própria comunidade da linguagem |
| Análise dinâmica | escâner que aponta para o endereço da aplicação e percorre o que responde |

⚠️ **Conferir dono e manutenção antes de recomendar.** Ferramenta troca de
mantenedor: o escâner dinâmico mais citado em material de divulgação **deixou de
ser mantido pela fundação** que lhe deu nome, e hoje está sob uma empresa. Isso
não a torna pior, e torna errado repetir a frase "é da fundação, sem dono
comercial" que circula em texto de divulgação. **Quem afirma governança de
projeto alheio precisa ter conferido na semana em que escreveu.**

**Formato de saída:** as ferramentas sérias exportam num formato comum de
resultado de análise estática. É o que permite juntar a saída de várias num
relatório só, sem tradução à mão.

**A ordem que rende mais numa tarde:** segredo → dependência → análise estática
→ duas contas. As duas primeiras são as mais baratas e as que mais acham; a
última é a que nenhuma das outras substitui.

---

## Configuração: o valor alternativo que vira segredo

> É `SEC-11`, e é a falha que escapa de todas as outras verificações de segredo.

Quase todo mecanismo de configuração tem uma forma de dizer *"use esta variável,
e se ela não existir, use este texto aqui"*. Em composição de contêineres a
sintaxe usa dois-pontos e hífen dentro da expansão; em gráfico de implantação é
um campo de valor padrão; em código é o segundo argumento da função que lê a
variável de ambiente.

**Por que ela escapa de tudo:**

| Verificação | Por que não pega |
|---|---|
| `SEC-01`, segredo no código | O valor não se apresenta como segredo. É alternativa, e parece conveniência |
| Busca por prefixo de provedor | O texto costuma ser `troque`, `mude`, `changeme`, `admin`, `senha123`. Não tem formato |
| Busca de ferramenta | Mesmo motivo: sem formato, sem assinatura |
| Revisão de quem escreveu | Funciona no ambiente de desenvolvimento, e é exatamente para isso que foi escrito |

**Como se procura:** a expansão com valor alternativo, em arquivo de composição,
de implantação e de esteira; e a leitura de variável de ambiente com segundo
argumento, no código.

**A correção, em dois passos, e o segundo é o que importa:**

1. Tirar o valor alternativo. A leitura passa a falhar quando a variável falta
2. **Uma verificação na partida que percorre a lista de segredos obrigatórios e
   encerra o processo quando um deles falta.** Sem o passo 2, o passo 1 vira erro
   em tempo de execução, no meio do pedido de um cliente, e alguém devolve o
   valor alternativo para "consertar"

**A armadilha:** verificação de partida que apenas registra um aviso não protege.
O processo sobe, atende, e o aviso fica num registro que ninguém lê. Ela precisa
impedir a subida.

---

## Chave de terceiro: o intermediário no servidor

> É a implementação de `SEC-04`, e a resposta à pergunta que aparece toda vez que
> a compilação reclama de uma variável indefinida no cliente.

Toda integração entrega uma credencial, e a tentação é chamar o serviço
diretamente do navegador ou do aplicativo, porque é menos código. **Não existe
jeito de esconder credencial no que se entrega ao cliente:** o pacote compilado é
texto que qualquer pessoa abre, e adicionar o prefixo público só faz o compilador
parar de reclamar.

**O padrão que resolve:** o cliente nunca fala com o serviço de terceiro. Ele
fala com um endereço da própria aplicação, e o servidor guarda a credencial e faz
a chamada externa.

Três coisas que esse endereço próprio precisa ter, e que quase sempre faltam
quando ele nasce às pressas:

1. **Autorização.** Sem isso, a credencial deixou de estar exposta e o serviço
   pago continua aberto: qualquer pessoa gasta a cota pelo endereço novo
2. **Teto por solicitante** — `NET-06`, e `AIA-05` quando o terceiro é provedor
   de modelo
3. **Nenhuma repetição da resposta bruta.** Devolver ao cliente exatamente o que
   o terceiro respondeu costuma vazar campo que ele não precisava ver, e é
   `OUT-01`

**A exceção legítima:** credencial publicável por desenho, que a plataforma
entrega justamente para viver no cliente. Ela é pública de propósito, e não é
violação. O que nunca pode aparecer é a administrativa. Ver `DAT-05`.

---

## Busca aumentada por recuperação: onde mora o isolamento

> É `AIA-08`, e é a falha mais provável em sistema que usa modelo de linguagem
> sobre documento de mais de um cliente.

**Busca por proximidade não entende dono.** Ela devolve o trecho mais parecido,
de quem quer que seja. Num índice compartilhado, o documento de um cliente
aparece na resposta dada a outro, e a conversa parece perfeitamente normal — não
há erro, não há alerta, e a resposta até faz sentido.

**Onde o filtro precisa estar:** dentro da consulta ao índice, junto da busca por
proximidade, e nunca numa conferência depois de recuperar. É o mesmo raciocínio
de `ACC-03`, e aqui a diferença é ainda mais grave: filtrar depois não só permite
o vazamento como **piora a resposta**, porque os trechos de outro titular já
ocuparam as vagas dos que seriam devolvidos.

| Decisão | Quando escolher |
|---|---|
| Índice separado por organização | Poucas organizações, ou dado sensível. É o isolamento mais forte, e o mais caro de operar |
| Índice único com chave de titular no filtro | Muitas organizações. Exige que o filtro esteja em **toda** consulta, sem exceção |
| Índice único sem filtro | Nunca, quando existe mais de um titular |

**Três coisas que se esquecem, nesta ordem de frequência:**

1. **Apagar o documento não apaga o vetor.** A exclusão a pedido do titular
   precisa alcançar o índice, e ele quase nunca está na lista de lugares que a
   rotina de exclusão percorre. Ver `INT-05`
2. **O trecho recuperado chega colado nas instruções**, e por isso instrução
   escondida dentro de um documento que alguém enviou chega ao modelo com a mesma
   autoridade do texto do sistema. É injeção indireta, e é `AIA-01`
3. **A citação da fonte vaza mesmo quando o texto não vaza.** Devolver o nome do
   arquivo de origem já entrega que ele existe, e para quem

**Como se testa, e é barato:** duas organizações de teste, um documento distinto
em cada, e uma pergunta feita de uma delas por conteúdo que só existe na outra.
Se aparecer qualquer coisa da outra, na resposta ou entre os trechos recuperados,
é achado crítico.
