---
name: instalar
description: >
  Instala o Template OS na pessoa: baixa as peças de fora, faz a entrevista que
  preenche a memória (os oito módulos de `_memoria/`), passa com ela pelos
  padrões que já vêm escritos, escreve o perfil no CLAUDE.md e encaminha a
  marca visual pro `/carrossel configurar`. Use quando o usuário disser
  "instalar", "/instalar", "começar do zero", "é minha primeira vez aqui", ou
  quando o campo Nome de `_memoria/empresa.md` ainda estiver `*(a definir)*`.
---

# /instalar · a primeira conversa

Esta skill roda **uma vez**. Ela transforma um workspace genérico no workspace
**daquela pessoa**.

O workspace vem com tudo funcionando e nada preenchido sobre o negócio. As skills
sabem produzir carrossel, site, proposta e campanha, mas não sabem para quem.
Esta entrevista responde isso, e a resposta fica gravada nos arquivos que todas
as outras skills leem antes de cada tarefa.

**O mapa da memória é o `_memoria/README.md`.** Ele é o contrato: diz o que cada
um dos oito módulos carrega e onde cada informação entra. Na dúvida sobre onde
gravar uma resposta, é ele quem decide.

---

## Antes de perguntar qualquer coisa

**1. Conferir em que estado o workspace está.** São três casos:

- **Instalado:** existe um commit `instalar:` (`git log --format=%h --grep="^instalar:"`
  devolve algo). Dizer em quem ele está instalado e perguntar:

  > "Este workspace já está instalado, no nome de `<nome>`. O que você quer fazer?
  >
  > - **Atualizar um pedaço** (mudou o foco, o tom, a oferta) → é o `/memoria registrar`
  > - **Reinstalar do zero**: a memória atual fica guardada no histórico e a entrevista recomeça
  > - **Nada, foi engano**"

- **Meia instalação:** sem o commit `instalar:`, mas com algum campo da memória
  já preenchido ou o perfil já escrito (quem parou no Fechamento retoma dele). `node scripts/confere-memoria.mjs --instalada`
  diz o que falta. Dizer em uma linha o que já está gravado e oferecer seguir do
  primeiro bloco que ficou vazio, sem repetir o que já foi respondido.
- **Nova:** a memória ainda é toda molde. Seguir para o passo 3.

**2. Reinstalar só com a escolha dita com todas as letras.** A `_memoria/` é
versionada, e o histórico é a volta: se houver mudança não commitada nela,
commitar antes ("guardei a versão atual"); depois trazer os moldes de volta do
commit **anterior** ao da instalação (`git show <commit>^:_memoria/<arquivo>`, com
o `<commit>` do `git log` acima) e recomeçar.

**3. Baixar as peças de fora, em qualquer dos três casos.** Fontes, ícones,
bibliotecas e as skills de algumas ferramentas não vêm dentro do workspace: elas
se baixam da fonte oficial de cada uma, na versão que o
`scripts/terceiros/manifesto.json` fixa, para o lugar onde as skills as procuram.
Num computador novo, mesmo com o workspace já instalado, é este passo que falta.

- Rodar `node scripts/terceiros/instalar.mjs --conferir`. Tudo com ✓: seguir.
- Faltou alguma: rodar `node scripts/terceiros/instalar.mjs --listar` e **avisar
  antes de baixar**, em uma mensagem curta, o que vem e de onde, na língua dela:
  > "Antes de começar, vou baixar umas peças que o sistema usa: fontes, ícones,
  > bibliotecas e o material de algumas ferramentas, uns `<tamanho>`, dos sites
  > oficiais de cada uma (`<as fontes que o --listar mostrou>`). Fica tudo
  > neste computador."

  Ela não querendo, parar aqui e dizer que as skills que usam essas peças
  (desenho à mão, vídeo, tela de produto) vão pedir este passo quando chegar a vez.
- Rodar `node scripts/terceiros/instalar.mjs` e, no fim, o `--conferir` de novo.
  Vermelho, a saída diz o que fazer: sem internet, repetir o comando que ela
  mostra; a fonte que se recorta aqui pede o Python com o `fonttools`
  (`python -m pip install -r scripts/requirements.txt`). Peça que ficou de fora
  vai para "Pendências" de `_memoria/estrategia.md`, com o comando.
- **O link do Remotion**, só se ela vai fazer vídeo animado em código (o segundo
  motor de vídeo). O Claude Code só acha esse motor por um link em
  `~/.claude/skills/remotion` <!-- caminho futuro: o link que ela cria uma vez --> que aponta para
  `.claude/skills/remotion/`, criado uma vez. O `--conferir` diz se ele está de pé
  e imprime o comando do sistema dela, com o caminho já preenchido. Antes de
  oferecer, uma linha: **o Remotion é gratuito para pessoa física e para empresa
  de até 3 pessoas, e pago acima disso.** Com o sim dela, rodar o comando
  impresso (não pede administrador), conforme o sistema:
  - **Windows**, no PowerShell (o `mklink` pelo Git Bash quebra nas aspas):
    `New-Item -ItemType Junction -Path "$env:USERPROFILE\.claude\skills\remotion" -Target "<workspace>\.claude\skills\remotion"`,
    depois de criar a pasta `~/.claude/skills` se ela não existir <!-- caminho futuro: nasce com a primeira skill da pessoa -->. Para desfazer,
    `cmd /c rmdir` no link, nunca `rm -rf` (ele atravessa a junção e apaga a pasta)
  - **macOS e Linux**, no terminal, na raiz do workspace:
    `mkdir -p ~/.claude/skills && ln -s "$(pwd)/.claude/skills/remotion" ~/.claude/skills/remotion`

  Depois, reiniciar o Claude Code: as skills aparecem como `remotion:remotion-create`
  e as irmãs. O resto do que o motor sabe está em `.claude/skills/remotion/README.md`.

**4. Escolher o modo.** Perguntar antes de começar:

> "A entrevista completa leva uns 20 minutos e deixa o sistema afiado. Tem
> também um modo rápido, de 5 perguntas, que já te deixa produzindo hoje. O
> resto vai se preenchendo conforme a gente trabalha.
>
> **Completa** ou **rápida**?"

**Rápida** = as cinco perguntas da seção "O modo rápido", e o resto fica marcado
como pendente. **Completa** = os oito blocos.

---

## Como conduzir

O modo de fazer isto errado é despejar 30 perguntas de uma vez. Ninguém responde,
e quem responde responde raso.

- **Um bloco por vez.** Fazer as perguntas do bloco, esperar, escrever o
  arquivo daquele bloco, **mostrar o que ficou**, e só então seguir
- **Duas ou três perguntas por mensagem**, no máximo
- **Aceitar resposta curta.** Se a pessoa der uma frase, trabalhar com a frase.
  Insistir é o que faz gente abandonar instalação
- **Nunca inventar para preencher.** Campo sem resposta continua
  `*(a definir)*` e vira pendência no fim. Um arquivo com meia verdade é pior
  que um arquivo com metade em branco, porque ninguém sabe qual metade é falsa
- **Como se preenche um molde.** Cada campo `*(a definir)*` recebe a resposta no
  lugar dele, e o itálico de orientação logo embaixo sai junto. Campo que ficou
  sem resposta guarda o `*(a definir)*` e a orientação. Nunca acrescentar um
  parágrafo novo no fim do arquivo
- **Número que não veio dela não entra**, nem na memória nem como exemplo solto no
  meio de uma pergunta. Exemplo só quando marcado ("exemplo:"), nunca sobre o
  negócio dela (horário, preço, produto, quantidade: um exemplo assim contradiz o
  que ela diz depois) e nunca gravado
- **Número que envelhece leva a data da medição.** Seguidores, clientes
  atendidos, faturamento: perguntar "de quando é esse número?". Se é de agora,
  vai com `(medido em <data de hoje>)`; se ela não sabe, a data fica
  `*(a definir)*`
- **O que ela disse fica como ela disse.** "Natal passado" não vira um ano, "vendo
  panetone" não vira "por encomenda": dedução que ela não confirmou não se grava
- **Falar a língua dela.** Nada de termo de quem programa (commit, repositório,
  Git, MCP, Google Cloud, Notion) a menos que ela o tenha trazido. Quando
  precisar dizer, uma frase que explica: "guardei uma versão do que a gente montou"
- **Boas-vindas neutras** (sem "bem-vindo" no masculino) e o primeiro passo em uma
  frase: "vou te fazer umas perguntas, no seu tempo"
- **Mostrar o que ficou em lista curta.** Tabela só se ela pedir: o padrão de
  responder com tabela só vale depois que ela o assinar no Bloco 3
- **Guardar a fala como ela saiu.** As frases que a pessoa usar para descrever
  o próprio negócio vão direto pro arquivo, entre aspas, sem "melhorar"
- **Sem data no meio do texto.** A memória guarda o estado de hoje, não o
  histórico. A data de cada módulo mora no cabeçalho, em `**Revisado em:**`, e
  ela entra quando o módulo é escrito. A única outra data é a do número que
  envelhece

---

## Bloco 1 · Quem é você

**Grava em:** `_memoria/empresa.md` ("Quem é", "Tese", "Mercado e cliente",
"Ofertas" e "As frentes") e `_memoria/marketing.md` ("As duas audiências", da
pergunta 4)

Perguntar, em três ou quatro mensagens:

1. **Como você se apresenta?** Nome ou nome da marca, o @ que você usa, e a cidade
2. **O que você vende, na sua língua?** Sem vocabulário de site. "Do jeito que
   você explicaria pra um amigo no bar"
3. **Você trabalha sozinha ou tem gente com você?** (a forma do gênero segue a
   pessoa; na dúvida, "sozinho ou com gente")
4. **Quem é o seu cliente?** Quem decide a compra e quem paga. E, se você também
   produz conteúdo: **quem te lê é a mesma pessoa que te compra?** (a resposta
   vai para `marketing.md`, "As duas audiências", que é onde ela mora)
5. **Tem alguma coisa que sustenta a sua autoridade?** Anos de profissão,
   formação, um resultado concreto
6. **Que problema o seu cliente tem que ele não resolve sozinho?** → "O problema
   que você resolve"
7. **Quanto tempo de verdade você tem para isto por semana?** Emprego, filhos,
   balcão: é o que vira a "Restrição de tempo" e, lá na frente, a cadência

### O que extrair além da resposta literal

- **Existe uma oferta principal com o resto dentro dela, ou serviços soltos?**
  Isso muda toda proposta e toda página de venda que sair daqui. Se não ficou
  claro, perguntar direto
- **Quantas frentes convivem?** Se conteúdo e serviço têm peso igual, registrar
  isso com todas as letras em "As frentes". Senão o sistema trata conteúdo como
  isca de venda, e o tom sai errado em toda peça
- **O problema que ela resolve**, na língua do cliente dela: se a pergunta 6 não
  trouxe, extrair da resposta 2
- **A vertical:** se a resposta 4 nomeia um nicho (um ofício, um tipo de
  cliente, uma região), ele vai para "A vertical, se existir"; se não nomeia,
  o campo fica como está
- **Posicionamento:** só com as palavras dela. Se ela disse como se diferencia,
  transcrever; se não disse, o campo fica `*(a definir)*`, porque a frase de
  posicionamento escrita pelo Claude soa escrita pelo Claude

Depois de escrever, mostrar o arquivo e perguntar: *"Ficou parecido com você?"*

---

## Bloco 2 · Como você fala

**Grava em:** `_memoria/escrita-publica.md`, seção "A voz", e a linha "Palavras
que o texto público não diz", em "O que evitar"; e `_memoria/empresa.md`,
"Como quer ser percebido" (da pergunta 4)

> **Este é o bloco que mais muda o resultado.** Um sistema que não sabe o seu
> tom escreve corporativo por padrão, e corporativo é o tom que ninguém quer.

1. **Me manda um texto seu.** Qualquer coisa que você já escreveu: um post, um
   áudio transcrito, uma mensagem pra cliente. **Vale mais que qualquer adjetivo**
2. **Tem palavra ou jeito de escrever que te dá agonia ler?** A palavra exata vai
   para "Palavras que o texto público não diz" (as réguas de texto passam a
   reprová-la); o jeito, para "O que destoa"
3. **Emoji: natural ou não é o seu estilo?**
4. **Sério ou próximo?** *(a resposta quase sempre é "os dois". Aí a pergunta
   vira: quando um ganha do outro?)* As duas ou três palavras com que ela se
   descreve aqui vão também para "Como quer ser percebido", cada uma com o que
   quer dizer na prática
5. **O que é seu e uma revisão bem-feita apagaria sem querer?** A ambição, o
   humor, a franqueza, a delicadeza: vai para "O que não se corta"

### Como usar o texto que ela mandar

Ler e **extrair, não resumir**:

- as construções que se repetem ("beleza?", "olha só", "então")
- o comprimento médio de frase
- se ela explica antes de pedir, ou vai direto
- **uma frase inteira, transcrita**, que vai pro arquivo como referência viva

Depois, propor os dois eixos, o ponto de equilíbrio e o "teste final" (a pergunta
que se faz olhando um texto pronto pra saber se soa como ela): propor, não
perguntar qual. O marcador `*(a preencher pelo /instalar)*` do topo da seção sai
quando a seção é escrita, e cada marcador `<…>` sai inteiro, com as crases.

**A escolha de emoji vai escrita do jeito que a régua lê:** "nenhum", ou os que
ela usa (ex.: "só ⚡"). A régua da legenda passa a reprovar o resto.

**Se o texto dela promete resposta por mensagem** ("me chama no direct"), anotar:
o Bloco 4 pergunta quem responde.

---

## Bloco 3 · Os padrões que já vêm escritos

**Grava em:** `_memoria/escrita-publica.md`, `_memoria/preferencias.md`,
`_memoria/marketing.md` e `_memoria/prova.md`, só nas seções que ela mudar

Quatro módulos já chegam com regra escrita, marcada *(padrão)*: elas funcionam
para quase todo mundo e valem desde o primeiro dia. **Este bloco não é para
reescrever os padrões. É para ela saber que existem e dizer o que não assina.**

Apresentar em lotes curtos, **uma linha por padrão**, na língua dela:

**Lote 1 · como eu escrevo por você** (`escrita-publica.md`)
- *O que evitar*: linguagem corporativa, tom de guru, jargão de marketing vazio e
  travessão em texto que o público vê
- *Linguagem de balcão*: frase curta, falando com a pessoa, sem jargão
- *Caixa*: normal por padrão. Perguntar uma vez se a marca escreve tudo em
  minúsculo; se sim, a linha vira `**Caixa:** minúscula`, e **o nome da marca, o
  dela e o da cidade entram na lista do vocabulário** (em "Linguagem de balcão"),
  **escritos com a maiúscula**: é a maiúscula na lista que diz à régua que é nome
  próprio (a palavra do ofício vai em minúsculo)
- *Clareza acima de enigma*: frase que se entende sozinha, sem charada
- *O CTA*: chega proposto, e sempre diz o que a pessoa ganha; promessa por
  mensagem só com alguém para atender
- *Número e material de apoio*: número pode, número inventado não; o material
  que você manda entra como está
- *Copy de venda*: a página converte o cliente, não conta a sua história; a
  proposta é enxuta

**Lote 2 · como eu trabalho com você** (`preferencias.md`)
- *Como responder*: curto e direto na solução, o veredito primeiro, status em
  tabela, e sincero sempre, mesmo contra o que você sugeriu
- *Como entregar*: só inteiro e conferido; a forma e o tamanho anunciados antes
  de começar
- *Como decidir junto*: escolha sua vem como pergunta com a recomendação
  primeiro; decisão de texto chega com uma proposta, decisão visual com várias
  opções lado a lado; o que está num arquivo eu leio antes de perguntar
- *Custo e automação*: assinatura nova não é recomendação; gasto por peça vem
  com o custo dito antes

**Lote 3 · o que se pode afirmar** (`prova.md`)
- em venda direta, só o que está medido; em conteúdo, cena ilustrativa sem
  fingir que é resultado; "case" só com cliente real

**Lote 4 · como o conteúdo funciona** (`marketing.md`, só se ela produz
conteúdo): territórios, funções, funil e métricas vêm como sistema pronto.
Dizer que ele existe e que muda depois de algumas semanas de dado, pelo
`/memoria registrar`. Não abrir item por item.

Depois de cada lote: *"Tem alguma dessas que você não assina?"*

- **Se ela recusar ou ajustar uma regra:** reescrever aquele ponto com ela,
  **substituindo** o texto (nunca um "antes era X" ao lado), e tirar a marca
  *(padrão)* do título daquela seção: a marca diz "a seção veio pronta e ninguém
  mexeu", e nesta ela mexeu. O resto da seção continua valendo como estava
- **Se ela aceitar tudo:** nada muda nos arquivos. A marca *(padrão)* continua
  dizendo que a regra veio pronta
- O parágrafo de aviso do topo de cada módulo **não se mexe**: ele diz quem lê o
  módulo e como mudar depois, e isso continua valendo
- **Dizer uma vez onde cada coisa mora**, para ela saber onde mudar depois: o jeito
  de conduzir o trabalho fica em `preferencias.md`, a voz e o texto que o público
  lê (balcão, caixa, clareza, CTA, número, venda) em `escrita-publica.md`, o que se
  pode afirmar em `prova.md`. Em uma frase, no fim do bloco

---

## Bloco 4 · Onde você está

**Grava em:** `_memoria/estrategia.md`, e a "Jornada comercial" de
`_memoria/empresa.md`

1. **Em que momento o negócio está?** Uma frase ("começando", "cheio de cliente e
   sem tempo", "quero lançar um produto") → "Fase"
2. **O que precisa acontecer nas próximas semanas?** No máximo três coisas →
   "Prioridades abertas"
3. **O que te trava hoje?** *(a pergunta mais importante da entrevista)* →
   "Gargalo", campo "O que trava"
4. **O que já está no ar?** Site, perfil, canal, automação. **E quem responde as
   mensagens que chegam** (direct, WhatsApp)? → "Estado das frentes"
5. **Tem prazo real em algum lugar?** → "Prazos"
6. **Tem coisa que você já decidiu não fazer agora, ou regra que não quer
   rediscutir toda semana?** ("não pego cliente sem contrato", "loja virtual só
   no ano que vem") → a regra vai para "Princípios"; o que fica para depois, para
   "O que pode esperar"

**Faça as seis; a 4 e a 5 não se pulam.** A 4 diz o que já existe (para o
sistema não propor o que já está no ar) e se há quem atenda o CTA de mensagem; a
5 impede de prometer o que não cabe no prazo. A 6 pode voltar vazia: aí os dois
campos ficam como estão.

Com a 4 e o Bloco 1 em mãos, **propor a "Jornada comercial"** do `empresa.md` em
uma linha (de quem ainda não te conhece até o cliente que paga) e perguntar se é
esse o caminho: propor, não perguntar em branco.

### O gargalo é o que mais importa

A resposta de "o que te trava" **muda o jeito de o sistema te responder pra
sempre**. Traduzir a resposta em consequência prática e escrever no campo
**Consequência para o sistema**, com a tabela de referência que já vem no molde:

| Se ela disser | A consequência é |
|---|---|
| "não sei por onde começar" | entregar **um passo**, nunca um roadmap |
| "não tenho tempo" | entregar **pronto**, não entregar instrução |
| "não gosto do que produzo" | peça sóbria, e **menos decisões por peça** |
| "começo e não termino" | escopo pequeno, uma coisa por vez, fechar antes de abrir |
| "não sei se está bom" | critério de pronto escrito antes de começar |

Se a resposta não couber na tabela, **escrever a consequência com ela**, não
chutar sozinho. A tabela de referência fica no molde: ela serve para mudanças
futuras do gargalo.

---

## Bloco 5 · O seu conteúdo

**Só se ela produz conteúdo.** Se não produz, pular e deixar o `marketing.md`
como está.

**Grava em:** `_memoria/marketing.md`, nos campos `*(a definir)*`

1. **Sobre o que você fala?** Os assuntos do seu mercado e os do seu nicho
2. **Quem te lê?** → "As duas audiências", "Do conteúdo" (se for a mesma pessoa
   que compra, dizer isso)
3. **Onde você publica, e que formato funciona melhor?** → "Onde você publica"
4. **Quantas peças por semana você sustenta de verdade?** Não o ideal: o que cabe
   na semana dela → "Peças por semana"

**Cadência realista ganha de cadência bonita.** Se ela disser um número que não
cabe na "Restrição de tempo" do Bloco 1, mostrar o conflito e perguntar qual dos
dois vale.

---

## Bloco 6 · Vocabulário e prova

**Grava em:** `_memoria/CONTEXT.md`, `_memoria/prova.md` e a lista de vocabulário
do `_memoria/escrita-publica.md`

1. **Tem nome próprio no seu negócio?** Produto, etapa do processo, apelido de
   cliente-tipo, palavra do ofício. Cada um vira um verbete de uma ou duas frases
   no `CONTEXT.md`, dizendo o que a coisa **é**, não o que ela faz, **e entra
   também** na lista "Liste aqui as palavras suas que esta régua não deve cortar"
   da seção "Linguagem de balcão" do `escrita-publica.md`: é o que impede a régua de
   texto de reprovar a palavra do ofício dela. Se ela não tiver nenhum, o
   `CONTEXT.md` fica em branco e cresce com o uso, **mas releia o que ela já
   falou**: palavra do ofício que ela usou entra na lista da régua mesmo sem
   verbete
2. **O que você já entregou e consegue mostrar?** Cliente, resultado, número.
   Vai para "Resultado de cliente", **com a fonte e a data de cada número**
3. **Só se ela ainda não tem cliente para mostrar:** o que você consegue mostrar
   funcionando? Vai para "Prova de competência, medida"

**Número sem fonte não entra no `prova.md`.** Se ela disser "aumentei as vendas
em 30%", perguntar de onde saiu. Sem resposta, a frase fica de fora, e a
pendência diz o que falta medir. Número contado de cabeça entra como
estimativa dela, dito assim, e não serve para venda direta (a régua do
`prova.md`) até ser medido.

---

## Bloco 7 · A marca visual

**Este bloco NÃO se faz aqui.** Quem faz a entrevista de marca é a skill do
carrossel, que é dona dos tokens:

```
/carrossel configurar
```

Ela lê da memória o que esta entrevista acabou de preencher (o nome, o @, a voz,
o público) e faz 4 perguntas visuais: a cor principal, as outras cores, as fontes
e a logo, com "não sei" aceito em todas. Ela
deriva cor da logo ou do site, tem pares de fonte prontos, **mede o contraste**
e mostra o resultado antes de gravar.

**O que fazer aqui:** perguntar se ela quer configurar a marca agora, e
oferecer rodar o `/carrossel configurar` em seguida.

> "Falta a sua marca visual: as cores, as fontes e a logo. Quem cuida disso é
> o `/carrossel configurar`, que faz 4 perguntas e grava tudo num arquivo
> só. Quer rodar agora, ou deixa pra quando você for montar a primeira peça?"

**Nunca escrever em `.claude/skills/carrossel/marca/` por conta própria.**
Aquela pasta é da skill, tem molde e verificador próprios, e escrever ali na
mão pula a medição de contraste.

**Se ela deixar pra depois, dizer o que acontece, sem prometer o que não
existe:** a primeira peça visual (carrossel, vídeo) começa pela entrevista da
marca (4 perguntas), e até lá nenhuma peça visual sai; os cortes de vídeo e o
desenho à mão têm também uma versão neutra, sem a marca, se ela preferir.

---

## Bloco 8 · Ferramentas e ligações

**Grava em:** `_memoria/ferramentas.md` (o que ela usa e o que foi ligado),
`_memoria/estrategia.md` ("Pendências", o que ela quer ligar depois) e as
caixinhas de "Ferramentas conectadas" do `CLAUDE.md`

1. **Que ferramentas você já usa no dia a dia, e para quê?** Agenda, WhatsApp
   Business, planilha, site, sistema de agendamento: cada uma vira uma linha em
   `ferramentas.md`, "No dia a dia" (o nome e para que serve; nunca senha nem
   chave)

Depois, as ligações com o workspace. Nada aqui é obrigatório, e **o workspace
funciona inteiro sem nenhuma delas**. **Oferecer só o que combina com o que ela
disse** (quem vende pão e posta no Instagram: publicar no Instagram e gerar
imagem; as outras numa frase: "tem outras ligações opcionais; quando quiser, é só
pedir"). A tabela abaixo é para você consultar, não para ler para ela:

| Quer… | Precisa de | Como |
|---|---|---|
| Publicar no Instagram direto daqui | conta Business ou Creator + app na Meta | `/instagram-publisher`, no modo conexão |
| Gerar imagem ou vídeo por IA | projeto no Google Cloud com billing | `scripts/guia-geracao-imagem-vertex-ai.md` |
| Ler site de terceiro em texto limpo | chave do Firecrawl (plano free) no `scripts/.env` | `/raspar` |
| Clonar site | Node + Playwright + o ditto instalado fora do repo | `/clonar-site` explica |
| Maquete de tela de produto, medida | Playwright (`npm --prefix scripts install`) | `/design-de-produto` |
| Animação com Motion | vem com as peças de fora (passo 3), em `.claude/skills/motion/` | `templates/skills/catalogo.md` |
| Fazer vídeo animado em código | ffmpeg, Python com numpy e Pillow, o headless shell do Playwright; o segundo motor pede o **link** do passo 3, criado uma vez | `/video` e `.claude/skills/remotion/README.md` |
| Virar Salvos do Instagram em roteiro | 2 bancos no Notion + o conector do Notion + yt-dlp | `marketing/instagram/README.md` |

**Ligar só o que ela pedir agora**, e não pedir credencial que não vai usar hoje.
Credencial mora no `scripts/.env`, nunca na memória nem no chat. Cada ligação
feita ganha uma linha em `ferramentas.md` e a caixinha marcada no `CLAUDE.md`;
**a que ela quer e deixou para depois vai para "Pendências" de `estrategia.md`**,
para a próxima sessão saber.

**Duas merecem um aviso, mas só se tocarem no que ela disse:**

- **Vídeo animado feito em código** (não o vídeo que ela grava): o segundo motor
  de vídeo só aparece depois do link do passo 3. Se ela pulou o link e agora
  quer esse vídeo, voltar àquele item
- **Pipeline de referências**: é a montagem mais longa do workspace. São uns 20 minutos de montagem. Se ela não usa Notion, dizer
  que dá pra ignorar a pasta inteira sem perder nada do resto

---

## O modo rápido

Cinco perguntas, nesta ordem, em duas mensagens:

1. Como você se apresenta? (nome ou marca, e o @) → `empresa.md`, "Quem é"
2. O que você vende, na sua língua? → `empresa.md`, "O que você vende"
3. Quem compra de você? → `empresa.md`, "Quem compra"
4. O que precisa acontecer nas próximas semanas? → `estrategia.md`,
   "Prioridades abertas"
5. O que te trava hoje? → `estrategia.md`, "O que trava", com a consequência da
   tabela do Bloco 4

Os padrões do Bloco 3 ficam como vieram, e o fechamento diz isso. Os outros
blocos viram pendência, com o nome de cada um.

---

## Fechamento

Depois do último bloco, nesta ordem:

**1. Mostrar o que o workspace faz por ela, e propor o próximo passo.** O
README não lista o que vem dentro: é aqui que ela descobre. Em 5 a 8 linhas, o
que este workspace faz **para o negócio dela**, escolhido pelo que ela contou
(quem produz conteúdo vê o carrossel e o vídeo; quem vende serviço vê a proposta,
a copy e a oferta), cada linha com o jeito de pedir em linguagem comum ("faz um
carrossel sobre…"), e não a lista inteira. A lista completa é a tabela "Qual
skill atende cada pedido" do `CLAUDE.md`, e ela pode perguntar "o que dá pra
fazer aqui?" quando quiser. Depois, com base na prioridade e no gargalo, um
passo só: *"Pelo que você me contou, o próximo passo é `<X>`. Faz sentido?"*. O
que ela aceitar vai para "Próximo passo" de `estrategia.md`, antes do commit.

**2. Escrever o perfil no `CLAUDE.md`.** A seção `## Perfil` da raiz é um resumo
de **até 12 linhas** do que foi apurado: quem é, o que vende, as frentes, o tom em
uma linha, o gargalo e a consequência dele. O perfil entra no lugar do aviso e do
`*(a preencher)*` da seção; o aviso "**Primeira vez?** Rode `/instalar`" do topo
do `CLAUDE.md` sai junto. **É resumo, não cópia**: o detalhe mora no
`_memoria/`, e duplicar é o que faz os dois divergirem.

**3. Pôr a data de hoje no `**Revisado em:**`** de cada módulo que foi escrito
(o marcador `*(o /instalar preenche)*` sai). Módulo que ninguém tocou fica com o
marcador.

**4. Preencher a lista de nomes próprios** em
`.claude/skills/seguranca/nomes.local.json`, uma lista JSON com o nome dela e o
da marca (`["Nome", "Marca"]`). Isso faz o verificador da skill de segurança
pegar vazamento de dado pessoal em material que deveria ser genérico. O arquivo é
ignorado pelo git de propósito: se ela quiser pôr nome de cliente ali, é dado de
terceiro, e não vai para o repositório. Conferir rodando
`node .claude/skills/seguranca/scripts/verifica.js`: o veredito deixa de dizer
"nome próprio não verificado".

**5. Conferir pela máquina:**

```
node scripts/confere-memoria.mjs --instalada
node scripts/confere-contexto.mjs
```

O primeiro cobra o contrato do `_memoria/README.md` e o mínimo da instalação (o
nome, o que se vende, o gargalo com a consequência, a data dos módulos escritos),
e lista o que ficou pendente. O segundo cobra, entre outras coisas, o teto de
tamanho do `CLAUDE.md`: perfil longo demais o estoura. **Vermelho se conserta
antes de seguir.**

**6. Dizer o que ficou pendente**, se ficou, sem culpa e com o caminho, na forma
que ela assinou no Bloco 3 (lista ou tabela), e cada item com o que fazer:

> "Ficou faltando: `<itens>`. Nada disso trava nada. Quando você quiser
> preencher, é só me dizer, ou rodar `/memoria registrar`."

**7. Se a marca visual ficou pendente, dizer a consequência**, em uma linha:

> "A sua marca visual ainda não está configurada: a primeira peça começa por ela,
> em 4 perguntas. Quando quiser, é o `/carrossel configurar`."

**8. Guardar no Git.** A instalação fecha com **um commit**:

- se o Git ainda não sabe quem é ela (`git config user.name` ou
  `git config user.email` volta vazio), perguntar o nome e o e-mail que ela quer
  nos registros e gravar só neste workspace (`git config user.name "<nome>"` e
  `git config user.email "<e-mail>"`). Sem e-mail que ela queira usar, gravar um
  que não é endereço de verdade, como `<primeiro-nome>@sem-email.invalid`: o
  registro só precisa de um;
- stage por caminho explícito (`_memoria/` e `CLAUDE.md`), conferir o
  `git diff --cached --stat`, e a mensagem começa com `instalar:`, porque é por
  ela que uma reinstalação acha os moldes.

Dizer que foi feito em uma frase na língua dela ("guardei uma versão do que a
gente montou; se algo der errado, dá para voltar").

**Push não faz parte da instalação.** A `_memoria/` agora tem dado do negócio
dela. Dizer com todas as letras: *"se você ligar este workspace a um repositório
no GitHub, ele tem de ser privado: a sua memória vai junto no push. O `/salvar`
confere isso antes de empurrar."* Se a cópia veio por clone do repositório do
Template OS, o `origin` ainda aponta para ele: trocar pelo dela
(`git remote set-url origin <o endereço do repositório dela>`) antes do primeiro
push. Se veio pelo botão "Use this template", o repositório já é dela.

**Dizer uma vez como o workspace trabalha:** *"Eu trabalho sem pedir licença a
cada passo; só pergunto antes de mexer no Git de um jeito que não tem volta. Se
você preferir que eu pergunte mais, é um ajuste de permissão, e eu te mostro
onde."* (a seção "Permissões" do `CLAUDE.md` diz o risco e como fechar).

**9. Começar pelo próximo passo.** Não perguntar "e agora?": oferecer começar
pelo passo que ela aceitou no item 1.

---

## Regras da skill

- **Uma pergunta que ela já respondeu não se repete.** Se ela contou algo no
  meio de outra resposta, aproveitar e confirmar, em vez de perguntar de novo
- **Mostrar cada arquivo depois de escrever**, antes de seguir. Instalação é
  onde a confiança se ganha ou se perde
- **Registrar é substituir.** Resposta nova entra no lugar do campo, e a frase
  que deixou de ser verdade sai. Memória é estado, não diário
- **Nunca escrever nas skills** durante a instalação. Skill é código do sistema;
  o que é dela mora no `_memoria/`, a marca visual mora na skill do carrossel
  (pelo `/carrossel configurar`), a lista de nomes mora no `nomes.local.json`,
  que o git ignora, e as peças de fora entram só pelo instalador do passo 3
- **O histórico é a volta.** Reinstalação traz os moldes do Git, e a memória
  anterior continua no histórico; nada da `_memoria/` se apaga à mão
- Se ela abandonar no meio, **o que foi escrito fica**. Da próxima vez, esta
  skill detecta a meia instalação e retoma de onde parou, em vez de recomeçar
