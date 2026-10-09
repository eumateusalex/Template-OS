# Escrita pública

> **Responsabilidade:** a sua voz e a régua de todo texto que o público vê: tom,
> o que evitar, linguagem de balcão, caixa, clareza, CTA, número e copy de venda.
> **Não mora aqui:** como você quer ser atendido (→ `preferencias.md`), como o
> conteúdo é planejado (→ `marketing.md`), o que se pode afirmar (→
> `prova.md`).
> **Revisado em:** *(o `/instalar` preenche)*

**Este arquivo já vem com um padrão escrito, e ele vale desde o primeiro dia.**
Todas as seções marcadas *(padrão)* são regras que funcionam para quase todo
mundo. **Você pode mudar qualquer uma.** O melhor momento é a entrevista do
`/instalar`, que passa por elas e pergunta o que você mantém; depois, é o
`/memoria registrar`. A voz vem em branco, porque é ela que faz o texto soar
como você, e ninguém consegue adivinhar. Este módulo é o que `/copy`, `/video`,
`/carrossel`, `humanizer` e as demais skills de texto leem antes de escrever.
A marca *(padrão)* no título diz que a seção veio pronta e ninguém mexeu nela;
quando você muda uma regra, a marca sai do título daquela seção, e o resto dela
continua valendo como estava.

---

## A voz

*(a preencher pelo `/instalar`)*

**Como você fala:**

**Uma frase sua, transcrita do jeito que saiu** (vale mais que dez adjetivos):

> *"…"*

**Os eixos que precisam conviver:**

- **`<eixo 1>`**: *(ex.: autoridade, vinda de onde)*
- **`<eixo 2>`**: *(ex.: proximidade, e por quê)*

O ponto de equilíbrio é `<nome do equilíbrio>`. Se soou `<defeito A>`, errou
para o primeiro eixo. Se soou `<defeito B>`, errou para o segundo.

**O registro muda com a situação:** *(qual é o padrão, e quando ele muda)*

**Teste final de qualquer texto:** *(a pergunta que você faz olhando o texto
pronto)*

**O que combina:** `<…>` **O que destoa:** `<…>`
*(o que destoa é estilo; a palavra que você não quer ver escrita vai na lista
"Palavras que o texto público não diz", em "O que evitar", e vira trava)*

**O que não se corta:** `<a coisa que é sua e que uma revisão bem-intencionada
apagaria>`. Quase todo mundo tem uma: a ambição, o humor, a franqueza, a
delicadeza. Escreva a sua aqui, ou ela some no primeiro texto que o Claude
"melhorar".

**Emoji:** *(a definir)*
*Onde entra e quantos. Escreva "nenhum" se você não usa, ou os que você usa (ex.:
"só 👋 e 💪"): a régua da legenda (`scripts/lib/legenda.js`) passa a reprovar
emoji fora da sua escolha. Na arte, solto no texto, costuma destoar.*

---

## O que evitar *(padrão)*

- **Linguagem corporativa**, quando você é uma pessoa e não uma empresa. Nada de
  "nossa equipe", "nossos clientes", "soluções corporativas".
- **Tom de guru.** Promessa de enriquecimento, "mudou minha vida", pregação.
- **Jargão de marketing vazio.** "alavancar" é o pior deles. Na mesma família:
  sinergia, disruptivo, game changer, mindset, destravar.
- **Travessão em texto que o público vê.** Nem `—` nem `–`. É a marca mais
  óbvia de texto de IA. No lugar: ponto, vírgula, dois-pontos ou parênteses.
  Vale em site, carrossel, legenda, email, proposta e página. **Não vale em
  arquivo interno, skill, README ou comentário de código**, e por isso este
  arquivo usa travessão à vontade.
- **Negação partida em duas frases** ("não é X. É Y."). Juntar numa oração só.
- **Denunciar a automação.** "rodando", "no ar", "a esteira", "processa", "entra
  na fila": escrever como a pessoa que faz, não como o sistema que executa.
- **Forma repetida.** A moral da história no fim e a pergunta obrigatória no fim.
- **Pergunta retórica abrindo o texto, e resumo do que já foi dito.**
- **Contar de onde o material veio.** O que nasce de referência é criação sua; o
  crédito que fica é o da imagem e o da fonte de um número.

**Palavras que o texto público não diz:** *(a definir)*
*As palavras e expressões que você recusa, separadas por vírgula (ex.: milagre,
promoção imperdível). As réguas de texto (a da peça, a da legenda e a da copy de
página) reprovam o texto que as usa.*

A skill `humanizer` cobre essa lista em profundidade, e todo texto público passa
por ela antes de sair.

---

## Linguagem de balcão *(padrão)*

**Vale em tudo que tem texto:** carrossel, vídeo, legenda, título de slide,
site, proposta, email, página.

**A peça fala COM a pessoa sobre o que ela perde ou ganha, não DE um assunto.**
Nas duas superfícies onde ela decide se continua (a capa e a primeira linha da
legenda, ou o título e a primeira frase de uma página), isso é obrigatório:

- **"você" ou "seu"**, sempre
- **a perda ou o ganho dito**, não sugerido: venda, cliente, horário, perde,
  custa, some, ou o número do ganho ("aprovado em 30 dias")
- **uma ideia por frase**, com teto de 14 palavras
- **zero jargão**: "lead" vira o cliente que chamou, "CRM" vira a sua lista,
  "funil" vira etapa da venda, "follow-up" vira voltar a falar

O vocabulário do seu próprio negócio não é jargão. **Liste aqui as palavras suas
que esta régua não deve cortar:** *(a definir)*

**O teste dos 5 segundos:** mostrar a capa e a primeira linha para alguém de
fora e perguntar o que você vende, para quem, e o que a pessoa perde sem isso.

---

## Caixa

**Caixa:** normal

O padrão é a caixa normal da língua: maiúscula no começo da frase e no nome
próprio. Uma marca pode escolher escrever **tudo em minúsculo**, inclusive o
começo da frase, o título e o botão, mantendo a forma original só no nome próprio
(Paula, WhatsApp, Curitiba) e na sigla (IA, GA4). Se for a sua escolha, troque a
linha acima para `**Caixa:** minúscula`: as réguas de texto (`/copy`, legenda)
passam a cobrar isso, e só isso. Com a caixa minúscula, o nome da sua marca, o
seu e o da sua cidade entram na lista do vocabulário (em "Linguagem de balcão"),
**escritos com a maiúscula** (Rafael Elétrica, Campinas): é a maiúscula na lista
que diz à régua que a palavra é nome próprio; palavra do ofício vai em minúsculo. Peça de cliente tem a caixa do
cliente.

---

## Clareza acima de enigma *(padrão)*

**Na dúvida entre a frase bonita e a frase clara, é a clara.**

Quatro defeitos produzem enigma:

1. **Frase de efeito no lugar de informação.** O pior e o mais comum, e o único
   que passa em todas as outras réguas: soa profunda e não diz nada prático. Se
   ela serviria de legenda para qualquer outro assunto, está vazia.
2. **Sujeito oculto.** "Aposenta o notebook" não diz quem aposenta.
3. **Pronome sem dono.** "eles", "ele mesmo", "isso", sem antecedente na tela.
4. **Charada por suspense.** Guardar informação para criar curiosidade. Se a
   frase só faz sentido depois do slide seguinte, ela está errada.

**Os dois testes, e os dois são baratos:**

- **Ler a frase isolada**, sem o resto da peça. Sobrou "quem?", "o quê?" ou "do
  que está falando?", reescrever.
- **Perguntar "e daí?".** A frase manda a pessoa fazer alguma coisa, ou informa
  algo que ela não sabia? Se não faz nem um nem outro, corta.

Isso vale para o título de cada slide, não só para a capa. **O fecho é onde a
frase de efeito mais aparece**, porque é onde dá vontade de terminar bonito: o
fecho é ação concreta que a pessoa faz hoje, nunca reflexão.

**O fecho mostra o valor de quem assina no problema da peça.** A última frase
liga o que a peça mostrou ao que você resolve, para criar percepção de valor.
Não serve a frase de posicionamento solta, que cabe em qualquer peça, nem a ação
que manda a pessoa resolver com um terceiro ("pergunte a quem cuida do anúncio"):
ela confunde e entrega o valor a outro.

| Enigma | O que devia estar escrito |
|---|---|
| "A parte difícil nunca foi digitar." | "Continua sendo você que decide o que construir." |
| "Antes de trocar de ferramenta, pergunte onde seu trabalho roda." | "Antes de comprar a novidade, veja onde você perde tempo hoje." |
| "O que eles dizem que é." | "O que a empresa promete." |

---

## O CTA *(padrão)*

**O CTA chega proposto, com o motivo da escolha.** O tipo que a função da peça
aceita está em `marketing.md`; a promessa concreta sai do tema da peça, e você
aprova, troca ou corta. Se você já disse o CTA no pedido, vale o seu.

**Todo CTA carrega o motivo na mesma frase**: o que a pessoa ganha, deixa de
perder ou passa a receber ("se você quer X, faz Y"). "Segue", "curte", "salva
esse post", "comenta aqui" e "marca alguém" sozinhos não são CTA. **Se o CTA
serviria em qualquer outra peça, está genérico.**

**CTA que promete algo por mensagem exige quem atenda** do outro lado: uma
resposta automática ligada, ou você respondendo à mão (o estado de cada rede
está em `estrategia.md`). Sem isso, a peça não promete nada, porque oferecer
sem entregar queima a conta.

---

## Número e material de apoio *(padrão)*

**Pode usar número. O que não pode é inventar número que o sistema produz.**

- Dado de mercado entra com fonte levantada e mostrada antes
- A fonte se mostra uma vez, e pequena, no rodapé ou na legenda
- Fato seu, contagem concreta ou faixa declarada como exemplo entram direto
- Na dúvida entre travar e checar, checar

**Material de exemplo é para copiar.** A informação do carrossel, post ou print
que você trouxer entra na peça como está, sem validar nem cortar por falta de
fonte externa. Se algo parecer errado, entregar como está e comentar depois.

**Antes de escrever, abrir todas as imagens que você mandou**: slide não lido
vira slide inventado.

**A sua fala na hora ganha do texto redigido depois.** O que você fala de um
assunto na conversa se guarda e se usa como está, em toda peça onde a sua voz é
o produto.

---

## Copy de venda *(padrão)*

Em página, landing ou material de captação, o foco é **converter o cliente, não
contar a sua história**. A técnica (título, prova, oferta, gancho) é da `/copy`;
aqui ficam as regras da sua marca.

- **Headline persuade, não se apresenta**
- Contador e número virados para o benefício do cliente, não para a biografia
- Currículo e prova de confiança são coisas diferentes: a sua experiência entra
  como prova de que o trabalho é bem feito, nunca como argumento de venda sozinho
- **Toda oferta diz o que acontece se não der certo**, na forma "se não X em Y,
  Z". Na oferta de graça, o que a pessoa arrisca é o tempo: o texto diz quanto
  leva e que não obriga a nada
- **Proposta é enxuta**: o que se entrega, como se paga e a condição daquela
  proposta
- **No anúncio pago, o gancho cabe nos primeiros 125 caracteres**, que é o que a
  Meta mostra antes do "ver mais"; o corpo não tem teto fixo, e corta o que não
  trabalha
- **Nome de cliente se copia da fonte** (o briefing ou a mensagem dele), acento
  inclusive, nunca da memória

