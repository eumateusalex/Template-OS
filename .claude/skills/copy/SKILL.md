---
name: copy
description: Escreve copy de página, anúncio, e-mail, VSL, carta, manifesto, slogan, guia de voz ou campanha pelas quatro escolas (consciência, clássica, oferta e a de página), com portão de oferta e de prova e régua portátil. Use para copy, "escreve a página", "refaz essa copy", anúncio, e-mail de venda, slogan ou /copy. Não faz carrossel.
---

# /copy

Copy boa começa antes do texto: na oferta que vale a pena, na prova que faz
acreditar e no estado de quem vai ler. Esta skill junta quatro escolas que
pensam isso de jeitos diferentes, cada uma no seu arquivo, e escreve no formato
que o pedido pede. Ela entrega o arquivo de copy,
conferido por máquina, e para aí: o HTML, o design e a publicação são outra
etapa.

| Escola | Para que serve | Arquivo |
|---|---|---|
| consciência | ler o leitor e o mercado, e daí a abertura e o corpo | [escolas/consciencia.md](escolas/consciencia.md) |
| clássica | o título, o texto de fato, a prova, a marca | [escolas/classica.md](escolas/classica.md) |
| oferta | a oferta no texto: valor, nome, risco, escassez, isca, gancho, clareza | [escolas/oferta.md](escolas/oferta.md) |
| copy-lp | a página por tipo, o menu de ideias, o arquivo que vai ao design | [escolas/copy-lp.md](escolas/copy-lp.md) |

Quando duas brigam: [conflitos.md](conflitos.md). **A regra do projeto ganha
sempre, e a skill aponta quando a técnica discorda.** O fato do negócio (o que
está medido, a oferta, o cliente) é do projeto e manda. Em técnica de copy,
a skill segue a regra do projeto e, quando uma escola ensina diferente, diz na
entrega: "a escola X ensina Y; recomendo rever a regra Z do projeto".

## Qual módulo

| O pedido | Módulo |
|---|---|
| página de venda, de serviço, de captura, institucional, site, landing | [modulos/pagina.md](modulos/pagina.md) |
| anúncio, e-mail, sequência de e-mails, VSL, carta de venda | [modulos/resposta-direta.md](modulos/resposta-direta.md) |
| manifesto, slogan, guia de voz, campanha, posicionamento | [modulos/marca.md](modulos/marca.md) |

Carrossel fica fora: é o `/carrossel`. Post de rede social também fica fora
desta skill.

## O fluxo

Copie e vá marcando:

```
Copy:
- [ ] 0. As regras do projeto
- [ ] 1. Portão da oferta
- [ ] 2. Portão da prova
- [ ] 3. O diagnóstico
- [ ] 4. A ideia central (o menu)
- [ ] 5. O texto, pelo módulo
- [ ] 6. A régua
- [ ] 7. A revisão, e a entrega
```

As perguntas a quem pediu vão **uma por vez**, com a recomendação na primeira
opção (pela ferramenta de pergunta, quando houver); o que os arquivos do
projeto respondem não se pergunta. O jeito de entrevistar está em
[escolas/copy-lp.md](escolas/copy-lp.md), "A entrevista". **Sem como perguntar**
(um agente rodando sozinho, ou pressa declarada): siga a opção recomendada e
registre cada suposição na entrega, para quem pediu corrigir.

### 0 · As regras do projeto

Leia o `CLAUDE.md` do projeto e o que ele mandar ler (memória, guia de marca,
briefing do cliente). Neste workspace, isso é a `_memoria/`: `empresa.md` (a
oferta, o cliente), `escrita-publica.md` (a voz, o que evitar, a linguagem de
balcão, a linha `**Caixa:**`, o vocabulário próprio e a copy de venda) e
`prova.md` (o que se pode afirmar). Procure o que manda
na copy:

- a voz e a caixa (maiúscula, minúscula), as palavras proibidas;
- o que pode ser afirmado como prova, e a regra para o que ainda não existe;
- o preço: se aparece, e onde;
- se as decisões de texto chegam como menu ou como proposta;
- onde a copy se grava, e se o projeto tem uma régua de copy própria, além da do
  workspace (o `CLAUDE.md` do projeto a nomeia; sem citação, não há) ou um revisor
  de texto.

O que o projeto decidiu vale acima de qualquer escola. **A memória ainda em
branco** (o campo Nome de `_memoria/empresa.md` em `*(a definir)*`, sinal de
que o `/instalar` não rodou) e a peça é da marca do próprio workspace: pare
antes do texto e diga isso, porque a oferta, a voz e a prova saem dali e a
skill não as inventa; o conserto é o `/instalar`. Peça de cliente segue com o
briefing do cliente. **Projeto sem regra
própria**: siga as escolas e diga na entrega, numa lista, as regras que faltam
(voz, prova, preço, palavras proibidas), sem inventar nenhuma. Copy que já
existe ("refaz", "melhora"): leia inteira e diga numa frase o que falta nela,
pelos portões abaixo.

**Trabalho para um cliente dentro do projeto** (o projeto é de quem pediu, e a
peça é de um terceiro): valem as regras do cliente (a pasta, o guia, o
briefing dele). A marca do projeto não entra: nem a voz, nem a caixa, nem a
régua da marca. O que o projeto manda para **todo trabalho de terceiro**
continua valendo (por exemplo, uma regra de prova para venda direta). Cliente
sem regra própria: o que falta dele vai na entrega.

### 1 · Portão da oferta

A oferta é o que a pessoa ganha, para quem, em quanto tempo, quanto custa e o
que acontece se não der certo. Copy não conserta oferta fraca (a escola de
oferta: a ordem é mercado, oferta, copy). Ela passa no portão com quatro coisas:

| Peça | Pergunta | Exemplo |
|---|---|---|
| a promessa | o que muda para ele, com número | "pelo menos 7 pontos onde o consultório perde paciente" |
| o prazo | em quanto tempo | "para pôr em prática em 30 dias" |
| o risco | o que ele arrisca, e o que acontece se não servir | "se não achar 7, a análise sai sem custo" |
| a ação | o que o texto pede, uma só | "quero saber onde perco paciente" |

O risco resolvido tem muitas formas: devolver, refazer, cancelar quando quiser,
testar antes. Na oferta de graça, o risco é o tempo da pessoa: diga quanto leva
e que não obriga a nada. Venda pela internet no Brasil tem, por lei, sete dias
de arrependimento (Código de Defesa do Consumidor, art. 49): o texto nunca
promete menos que isso.

Faltou a promessa, o prazo ou o risco, ou a promessa descreve a atividade em
vez do resultado: **a oferta de quem pediu escreve-se mesmo assim**, como veio,
e o que falta vai na entrega com as perguntas que a resolvem e a recomendação de
fortalecer a oferta antes (os temas estão em [escolas/oferta.md](escolas/oferta.md)).
**O fato da oferta vem do projeto, inteiro**: o limite e o motivo dele, o
esforço que ela pede de quem compra (tudo o que a pessoa faz, não só a
conversa), o que ela entrega. Motivo ou fato que o projeto não dá não se
escreve: vai na entrega como pergunta.

Neste workspace, quem audita e fortalece oferta é o `/oferta`: a entrega o
recomenda pelo nome quando faltar promessa, prazo ou risco. Se a regra do
projeto manda parar e fortalecer a oferta antes, pare. Faltou só a ação: proponha a recomendada, a que o projeto
já usa, e registre como suposição. Marca (manifesto, slogan) não tem oferta: o
portão é a crença e o que a marca faz de fato, e ele vai na nota `>` do topo.

### 2 · Portão da prova

Liste o que o texto vai mostrar como prova, cada item com a fonte: o depoimento,
o número, o caso, a demonstração, o dado de mercado. Pela regra de prova do
projeto (e, para cliente, pela do cliente ou a que o projeto dá a todo trabalho
de terceiro). Sem regra nenhuma, **o dado que ainda não existe** (o
depoimento, o número, um fato da operação como prazo ou quantidade, o endereço,
o horário) entra como **provisório plausível**, com nome genérico, e cada um
vai para a lista "trocar antes de publicar"
([escolas/copy-lp.md](escolas/copy-lp.md), "O dado que ainda não existe"). Sem
prova para a promessa, a promessa encolhe até caber.

**Ofício regulado** (saúde, estética, odontologia, direito, contabilidade,
engenharia, finanças, alimento e suplemento, entre outros; a lista não é
fechada): a regra é a do ofício de **quem oferece o serviço**, não a de quem
lê. Sem saber o ofício (médico ou dentista?), some as proibições de todas as
normas possíveis e diga quais supôs. Depoimento, ali, só se a norma permitir.
O conselho de classe ou a agência reguladora tem regra sobre promessa de
resultado, gratuidade, depoimento, nome de produto e antes e depois. Pesquise a
norma em vigor com o link, ajuste o que ela proíbe (mesmo que isso mude a
oferta como veio), e diga na entrega o que mudou e o que o dono confere com
quem responde técnico. Na dúvida, a frase sai.

### 3 · O diagnóstico

Em três linhas, por [escolas/consciencia.md](escolas/consciencia.md), gravadas na
nota `>` do topo do arquivo:

- **a consciência** de quem lê, com o nível e o nome (do "não sabe que tem o
  problema" ao "só falta a condição");
- **a sofisticação** do mercado (quanto ele já ouviu essa promessa);
- **a abertura** que as duas pedem (a oferta, a promessa, o mecanismo, o
  problema, a afirmação forte, a história) e **o desejo dominante**.

### 4 · A ideia central (o menu)

Três ideias centrais de ângulos diferentes, até três conceitos criativos (e a
opção sem conceito), o leitor em uma frase e a combinação recomendada, numa
mensagem só ([escolas/copy-lp.md](escolas/copy-lp.md)). Analogia só quando
explica; cada frase clara sozinha. Quem pediu escolhe; com pressa, vai o bloco
de suposições junto com o menu, que nunca se pula. Slogan e título isolado
pulam o menu: as opções já são o menu.

- **O menu vai na mensagem a quem pediu**, não no arquivo de copy; no arquivo
  fica só a escolha, na nota `>` do topo (na página, no brief do conceito).
- **Projeto que pede proposta em vez de menu**: a recomendada vai como a
  proposta, e as outras como apoio, em uma linha cada.
- **Sequência** (de e-mails, de anúncios): um diagnóstico e um menu para a
  sequência inteira.

### 5 · O texto, pelo módulo

Escreva pelo arquivo do módulo, no formato abaixo. Cada bloco leva
`→ princípio:` dizendo qual regra aplica e de que escola, para quem lê aprender
o porquê. **O texto público não cita as escolas** (nenhum nome de escola nem o
jargão do método, como o nível de consciência ou o estágio de sofisticação, na
peça): o método vira texto do projeto.

### 6 · A régua

A régua portátil, que vale em qualquer projeto (os caminhos são a partir da
raiz do workspace):

```bash
node .claude/skills/copy/regua/conferir.mjs <arquivo>
```

Ela confere a forma (os blocos que o módulo e o tipo pedem), a fonte de cada
número e de cada fala entre aspas no rastro, o provisório que ficou fora da
lista de troca, o marcador esquecido e o nome de escola (ou o jargão do
método) no texto e nas variações para teste. Reprovou:
conserte o texto, nunca a régua. Se o `CLAUDE.md` do projeto nomear uma régua de
copy, ela roda também (se ela já roda esta por dentro, basta ela); a régua da
marca do projeto não roda em trabalho de cliente.

**A régua da marca deste workspace** roda a portátil por dentro e soma as
regras da memória: o título de balcão na página, o jargão (menos o vocabulário
que você listou em `escrita-publica.md`), o travessão, "garantia", "case", os
padrões de IA da `humanizer` que a máquina vê (o "não é X, é Y" entre eles), o gancho do anúncio em 125 caracteres e, só se a linha
`**Caixa:**` de `escrita-publica.md` disser `minúscula`, a caixa toda em
minúsculo. Na peça da marca do workspace, ela substitui a portátil:

```bash
node scripts/copy/conferir.mjs <arquivo>
```

A saída diz a caixa que aplicou. `--caixa minuscula` ou `--caixa normal`
decide por cima da memória. Em trabalho de cliente, roda só a portátil.

O que nenhuma régua mede se confere à mão: o nome inventado fora das aspas, o
número escrito por extenso (escreva em algarismo) e a fala com menos de 20
letras.

**Sem Node no computador:** a régua não roda; diga isso na entrega e confira à
mão pelo checklist do módulo.

### 7 · A revisão, e a entrega

Releia contra o checklist do módulo e passe pelos revisores de texto do
projeto. Neste workspace são dois: a skill `humanizer` (tira o jeito de texto
de IA) e o agente `revisor-de-comunicacao`
(`.claude/agents/estudio/revisor-de-comunicacao.md`, clareza, voz e prova). O
que mudar volta para a régua. Revisor que é skill roda na própria conversa; revisor que é
agente e não deu para rodar (um agente não chama outro) vai na entrega como não
rodado. Onde a técnica de uma escola discordou da regra do projeto, a entrega
diz qual escola, o que ela ensina e qual regra rever. A entrega começa pelo veredito (passa na régua, ou não e
por quê), depois a recomendação (o título, a opção de slogan), e diz o que
depende de quem pediu: a escolha, a prova que falta, a lista de troca e as
regras do projeto que não existem.

## O arquivo

Grave onde o projeto manda. Neste workspace, numa pasta própria em `saidas/`,
com o nome da peça e a data (saidas/copy-pagina-servico-2026-10-02/copy.md);
em trabalho de cliente, na pasta do cliente. Projeto sem regra: na pasta copy
da raiz dele (copy/pagina-servico-2026-10-02.md). O formato é um só
para os três módulos; os exemplos completos estão em [exemplos/](exemplos/). A
nota `>` do topo leva o diagnóstico e a escolha do menu em todo módulo; a nota
para quem vai desenhar e o brief do conceito são só da página.

```markdown
módulo: pagina
tipo: servico

<nota para quem vai desenhar e o brief do conceito, fora do texto>

<!-- texto -->
## topo
**título:** ...
**subtítulo:** ...
**ação:** ...
→ princípio: ...

## oferta
...
<!-- fim do texto -->

## rastro
- "7 pontos": a análise sempre lista pelo menos 7 (a oferta, item 2)
- "a gente não perde mais paciente": provisório, depoimento genérico

## trocar antes de publicar
- "a gente não perde mais paciente": trocar pelo depoimento real
```

- **`módulo:`** é `pagina`, `resposta-direta` ou `marca`; **`tipo:`** é o do
  módulo (a lista em cada arquivo de módulo).
- **O texto que o público lê** fica entre `<!-- texto -->` e
  `<!-- fim do texto -->`. Cada bloco abre com `## <função>` (o que ele faz,
  nunca a forma visual); o rótulo de linha é `**título:**`, `**ação:**`.
- **As linhas que abrem com `→` ou `>` são anotação**: não são texto público.
  Cada anotação cabe numa linha só: a linha seguinte, sem a marca, a régua lê
  como texto.
- **`## rastro`**, depois do texto: a fonte de cada número (em algarismo, com a
  palavra que o segue no texto: "7 pontos", "30 dias") e de cada fala entre
  aspas. O que precisa ser trocado antes de publicar diz "provisório" na linha;
  o que a regra do projeto deixa ir ao ar como exemplo (uma cena com nome
  genérico, por exemplo) diz "exemplo", e não vai para a lista de troca. O
  número de mercado entra com a fonte de fora (o link); a conta feita a partir
  dele diz a conta.
- **`## trocar antes de publicar`**: cada provisório do rastro, com o que entra
  no lugar. Sem provisório, a seção sai.
- **`## variações para teste`**: os títulos e ganchos alternativos, um por
  linha. São texto público, e as réguas conferem.

## As regras que não se dobram

1. **A regra do projeto ganha** de qualquer escola, e a divergência de técnica
   vai na entrega.
2. **Toda prova tem fonte no rastro**, e todo provisório está na lista de troca.
3. **O texto público não cita as escolas** nem o jargão do método.
4. **Uma peça, uma ação.** O resto leva até ela.
5. **A oferta nunca se inventa**: o que falta nela vai na entrega. (O dado
   provisório da prova é outra coisa, e vai na lista de troca.)

## O que esta skill não faz

O HTML, o design, a publicação e a oferta em si (ela só aponta o que falta; a
oferta se monta no `/oferta`). Carrossel é o `/carrossel`; post de rede
social não é desta skill.
