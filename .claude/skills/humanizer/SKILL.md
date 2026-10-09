---
name: humanizer
description: Tira de texto em português os padrões de escrita de IA e o deixa na voz da marca, sem mexer em fato, número, promessa ou intenção. Reescreve, detecta (aponta o trecho e o padrão, sem dizer quem escreveu) ou devolve o texto limpo à skill que chamou. Use antes de publicar legenda, post, página, proposta, email ou qualquer texto público que soe genérico, inflado ou mecânico.
---

# Humanizer

Texto público sai daqui soando como uma pessoa que conhece o assunto falando com
outra. O trabalho é tirar o que denuncia a escrita automática e deixar o resto
quieto: quem lê não deve notar a edição, só que o texto ficou mais direto.

Esta skill é o dono dos padrões. A parte deles que uma expressão regular consegue
ver mora em `scripts/lib/padroes-de-ia.js` e trava as três réguas de texto (os
slides, a legenda e a copy de página); a parte que pede leitura é feita aqui. Os
nomes dos padrões são os mesmos nos dois lugares, para o achado da régua apontar
direto para a seção certa desta skill.

## Antes de tocar no texto

1. **A voz.** Ler `_memoria/escrita-publica.md` inteiro: "A voz", "O que evitar",
   "Linguagem de balcão", a caixa e "Clareza acima de enigma". A linha "O que não
   se corta" diz o que uma revisão bem-intencionada apagaria e não deve.
2. **O alvo.** Texto de cliente ou de projeto com identidade própria segue o
   `CLAUDE.md`, o briefing e o guia de voz daquela pasta, nunca a memória daqui.
3. **A fala real.** Se houver uma mensagem, transcrição ou texto escrito pela
   própria pessoa, o ritmo e as palavras dela mandam sobre qualquer preferência
   desta skill (menos o que o projeto proíbe por escrito).

## O que a edição não muda

Fato, número, data, nome próprio, citação e fonte saem como entraram, com o mesmo
grau de certeza ("pode", "costuma", "sempre" não trocam entre si). Também ficam:
o pedido que o texto faz, a condição e o limite de uma oferta, o termo técnico
que o leitor precisa, e a diferença entre o que é opinião e o que é dado.

Faltou prova para uma afirmação: ela sai, ou volta marcada para conferir. Nunca
se inventa detalhe concreto para a frase ficar mais viva.

## Os padrões

Cada padrão tem nome, sinal e conserto. Na dúvida entre cortar e reescrever,
cortar: a frase que sobra quase sempre já dizia o necessário.

### Os que a régua também vê

Estes travam nas réguas por máquina (as listas de palavras e expressões estão em
`scripts/lib/padroes-de-ia.js`; não copiar para cá). Aqui se resolve o caso que a
expressão não decide.

| Padrão | Sinal | Conserto |
|---|---|---|
| **contraste fabricado** | "não é X, é Y", "não só X, mas Y", e a versão em escada ("não é preço. não é prazo. é confiança.") | afirmar só o Y. **É o único de julgamento na régua:** quando o X é um engano que o leitor de fato comete e o texto existe para desfazê-lo, o contraste é real e fica |
| **falsa revelação** | abertura que promete um segredo ("a verdade é que", "o que ninguém te conta") e entrega uma frase comum | apagar a promessa e começar pelo fato |
| **autoridade vaga** | "estudos mostram", "especialistas dizem", "o mercado entende" sem dizer quem | citar a fonte que se confere ou escrever só o fato |
| **importância inflada** | o texto declara que algo é grande ("fundamental", "divisor de águas", "jornada") em vez de mostrar | trocar pelo fato que faz a coisa ser grande: o número, o prazo, o caso |
| **linguagem corporativa** | verbo de relatório ("potencializar", "otimizar", "impulsionar") e substantivo de apresentação ("ecossistema", "entrega de valor") | o verbo do que acontece no mundo: vende, liga, atende, entrega, demora |
| **frase que comenta a própria frase** | "vale destacar", "isso importa mais do que parece", o gerúndio final que explica o que a frase acabou de dizer ("…, mostrando o cuidado com o cliente") | apagar: se o fato não mostrou o ponto, explicar não resolve |
| **advérbio vazio** | "literalmente", "simplesmente", "basicamente", "de fato" sem mudar o sentido | cortar; fica só se é o jeito de falar documentado na voz |
| **exclamações empilhadas** | "!!" ou exclamação em toda frase | uma, onde há surpresa de verdade, ou nenhuma |

### Os que só a leitura vê

Nenhuma régua pega estes. Eles são a razão de a skill existir antes da régua.

| Padrão | Sinal | Conserto |
|---|---|---|
| **fragmento de drama** | pedaço solto para fazer suspense ou fechar com efeito: "Resultado? Zero.", "E deu certo." | juntar à frase que informa. A frase curta com uma ideia inteira é linguagem de balcão e fica; o defeito é o fragmento que só cria pausa |
| **dois-pontos de efeito** | dois-pontos que segura uma informação banal para soar como revelação: "O detalhe: chega em dois dias." | frase direta ("chega em dois dias"). O dois-pontos que abre lista, rótulo, citação ou que substitui o travessão continua certo |
| **metáfora ornamental** | imagem que enfeita e não explica: "o motor do seu negócio", "a ponte entre você e o cliente" | o termo literal. Uma imagem concreta que a voz da marca usa pode ficar; uma melhor no lugar da ruim, não |
| **pergunta genérica no fim** | "e você, o que acha?", "já passou por isso?" para puxar comentário | terminar na última frase concreta ou no pedido com motivo (o CTA de `_memoria/escrita-publica.md`) |
| **pergunta retórica na abertura** | "Você já parou para pensar…?" | abrir pela perda, pelo ganho ou pelo fato |
| **resumo no fecho** | o último parágrafo repete o texto ("em resumo", "no fim das contas") | apagar ou trocar pela decisão que a pessoa toma agora |
| **fecho de efeito** | reflexão que soa profunda e cabe em qualquer texto | apagar; o texto acaba na ação. Nunca trocar por outra frase bonita |
| **negação partida** | "não é X. É Y." em duas frases | uma oração só, e de preferência só o Y (é o contraste fabricado com ponto no meio) |
| **ritmo de fábrica** | trio em toda lista, parágrafos do mesmo tamanho, frases com a mesma cadência, "primeiro… além disso… por fim" | variar pelo conteúdo: dois itens quando são dois, um parágrafo longo onde a ideia é longa |
| **anúncio do texto** | introdução que diz o que o texto vai fazer; título-pergunta respondido logo abaixo | começar pelo conteúdo |
| **sinônimo rodando** | a mesma coisa chamada de três jeitos para não repetir ("a plataforma… a ferramenta… o sistema") | escolher a palavra certa e repetir |
| **verbo de ligação inflado** | "atua como", "se configura como", "conta com", "serve como" | "é", "tem" |
| **cautela empilhada** | "pode, em alguns casos, eventualmente ajudar" | um qualificador só, o que for verdade |
| **voz de atendente** | "Claro!", "Ótima pergunta", "Espero que ajude", "Fico à disposição" por reflexo | apagar; o texto começa e termina no assunto |
| **automação à mostra** | o texto fala como o sistema ("processa", "entra na fila", "a esteira roda") | falar como a pessoa que faz o trabalho |
| **frase portátil** | a frase serviria igual para outra empresa, outro produto ou outro assunto | trocar por um detalhe que só este negócio tem, ou cortar |

### Pontuação e forma

O que `_memoria/escrita-publica.md` disser vale por cima desta lista.

- **Travessão** (`—` e `–`) não entra em texto público: ponto, vírgula,
  dois-pontos ou parênteses no lugar.
- **Reticência** só quando a fala realmente fica em suspenso, nunca como respiro.
- **Negrito** marca uma coisa por bloco, não meia frase de cada parágrafo.
- **Lista com marcador** só quando os itens são paralelos; argumento corrido é
  parágrafo.
- **Emoji** segue a escolha registrada na voz; sem escolha, nenhum como
  marcador de item.
- **Caixa** segue a linha `**Caixa:**` de `_memoria/escrita-publica.md`; título
  com Toda Palavra Maiúscula é tradução, não português.

## Como reescrever

1. **Dizer o texto em uma frase.** O que quem lê precisa saber ou fazer no fim.
   Tudo que não serve a isso é candidato a corte.
2. **Marcar o intocável** (a seção acima) antes de mexer.
3. **Passar a máquina** sobre o texto, para pegar o que ela vê de uma vez:

   ```bash
   node -e "const {achaPadroes}=require('./scripts/lib/padroes-de-ia.js');for(const h of achaPadroes(require('fs').readFileSync(process.argv[1],'utf8')))console.log((h.julgamento?'[julgamento] ':'')+h.nome+': '+h.trecho+' -> '+h.conserto)" <arquivo.txt>
   ```

   Ela devolve o primeiro trecho de cada padrão; depois de consertar, rodar de
   novo até vir vazio (ou só o contraste que é real).
4. **Ler procurando os padrões de leitura**, um por um, com a tabela aberta.
5. **Consertar na proporção do defeito.** Frase boa fica como está. Um padrão
   numa frase pede trocar a frase, não o parágrafo.
6. **Ler em voz alta.** A frase que ninguém diria no balcão volta para o passo 5.
7. **Conferir contra o original** que nenhum fato, número ou condição mudou.

Naturalidade vem de estrutura mais direta, não de vocabulário mais raro: trocar
palavra comum por sinônimo elegante piora o texto.

### Um exemplo

Antes:

> No cenário atual, é fundamental que a sua loja potencialize o atendimento.
> Metade dos pedidos chega depois das 19h, e a resposta só sai no dia seguinte.
> Não é só responder, mas responder na hora. O resultado? Cliente perdido. E
> você, já pensou nisso?

Achados: importância inflada ("fundamental"), linguagem corporativa
("potencialize"), contraste fabricado ("não é só… mas"), fragmento de drama
("O resultado? Cliente perdido."), pergunta genérica no fim. Os três primeiros a
máquina do passo 3 aponta; os dois últimos, só a leitura.

Depois:

> Metade dos seus pedidos chega depois das 19h, e a resposta só sai no dia
> seguinte. Até lá, o cliente já comprou de quem respondeu na hora.

O único fato do texto estava no meio. A edição o pôs na frente, cortou o que
rodeava e não acrescentou nada que o antes não dizia.

## Os modos

### Reescrita

O pedido é deixar o texto pronto. Entregar só a versão final. Explicar a mudança
apenas se a pessoa pedir ou se uma afirmação saiu por falta de prova (aí dizer
qual).

### Detecção

O pedido é saber se o texto "parece IA", sem reescrever. Entregar uma lista, um
item por achado:

- o trecho entre aspas, como está no texto;
- o nome do padrão, igual ao desta skill;
- o conserto em poucas palavras.

Sem nota, sem porcentagem e sem veredito sobre quem ou o que escreveu: o padrão
nomeado com o trecho é prova que a pessoa confere linha por linha, e um palpite
de "foi IA" não é. Nenhuma linha reescrita. No fim, oferecer a reescrita.

### Dentro de outra skill

Quem chama (`/carrossel`, `/copy`, `/cortes`, `/video`, email, resposta a
avaliação) é dono da forma. Devolver o mesmo texto, nos mesmos campos e no mesmo
tamanho, só limpo: sem acrescentar CTA, informação, título ou formato. Depois
desta passada, a skill dona roda a régua por máquina dela (`scripts/lib/copy.js`,
`scripts/lib/legenda.js` ou `scripts/copy/conferir.mjs`).

## Antes de entregar

- Todo fato, número e condição do original está no texto final, igual?
- Alguma frase só soa importante sem dizer nada que se use?
- A máquina do passo 3 voltou vazia, ou só com o contraste que é real?
- Sobrou fragmento de drama, dois-pontos de efeito, metáfora ornamental ou
  pergunta genérica no fim?
- O fecho é ação ou fato, sem resumo e sem reflexão?
- O texto cumpre `_memoria/escrita-publica.md` (voz, caixa, travessão, CTA)?
- Quem pediu o texto reconheceria a própria voz nele?
- Na detecção: nenhuma linha foi reescrita?
