---
name: prospeccao
description: "Prospecção à mão, um a um, por qualquer canal: monta a operação, a leva, a folha do dia, as voltas e a semana, com o conferidor. Use para leva nova, \"o que mandei hoje\", voltas, respondeu, objeção ou /prospeccao. Não envia nada."
---

# /prospeccao

Abordar, um a um e à mão, quem ainda não te conhece: pelo WhatsApp, pelo direct,
por e-mail, por ligação ou na porta. A skill prepara, registra e confere; **quem
envia é você**, do número ou da conta da operação.

O método que vale para toda operação é o `metodo.md`. O que é de cada operação (a
oferta de entrada, a voz, o canal, as mensagens) mora na pasta dela,
`saidas/prospeccao-<operacao>/` <!-- caminho futuro: nasce no modo operação -->,
com o `MANUAL.md` de manual.

## Os modos

| Pedido | Modo | Arquivo |
|---|---|---|
| "quero começar a prospectar", "monta a operação", primeira vez | operação | `operacao.md` |
| "leva nova", "monta a próxima leva", "acha mais negócios" | leva | `leva.md` |
| "folha do dia", "o que mando hoje", "anota os envios", "respondeu", "voltas" | dia | `dia.md` |
| "como foi a semana", "fecha a semana", "qual abertura ganhou" | semana | `semana.md` |
| "ele respondeu isso, o que digo?", objeção, "quanto custa", proposta | conversa | `conversa.md` |

Pedido sem operação montada vai para o modo operação primeiro. Com mais de uma
operação, pergunte qual, a menos que o pedido já diga.

## Antes de qualquer modo

1. Ler o `_memoria/README.md` e o que ele manda ler em toda sessão.
2. Ler o `_memoria/oferta.md`: a oferta, o nicho, a faixa de preço e a jornada
   comercial vêm de lá. **Sem oferta escrita na memória, a skill para** e diz o
   que gravar e onde (a faixa de preço, ou a decisão de não dizer preço, vai no
   campo "Preço" da seção "Ofertas" do `oferta.md`), e o `/memoria registrar`
   grava; o `operacao.md`, passo 0, traz a pergunta pronta.
3. Ler o `_memoria/prova.md` (o que se pode dizer como credencial) e o
   `_memoria/escrita-publica.md` (a voz do texto que sai), se existirem.
4. Ler o `MANUAL.md` da operação e o `metodo.md` desta skill.

## O conferidor

```
node scripts/prospeccao/conferir.mjs saidas/prospeccao-<operacao> [--hoje AAAA-MM-DD]
```

Reprova a linha quebrada do `envios.csv`, o contato da lista de quem não quer que
volta numa ficha, numa folha ou num envio novo, a palavra que o `metodo.md`
proíbe (ou que o manual soma) dentro de uma mensagem, e o valor em dinheiro fora
da frase de faixa. Lista as voltas e os `quando` que vencem no dia. Roda no fim
de cada modo, e **vermelho não passa**: conserte e rode de novo antes de dizer
pronto. Saída 0 é nada reprovado, 1 é algo reprovado, 2 é uso errado.

O conferidor não julga a voz nem o sinal: a abertura nova é rascunho que você lê
e aprova antes de sair.

## O que esta skill nunca faz

- Enviar, responder ou abrir conversa por você, nem por automação.
- Abordar quem está no `nao-contatar.md` de qualquer operação.
- Prometer resultado, inventar cliente ou caso, ou dizer preço fora da faixa.
- Prospectar pelo número ou pela conta pessoal.
- Fazer trabalho de graça antes do sim para impressionar.
- Fingir ser cliente para medir o atendimento de alguém.

## Depois do sim

O passo entre o sim e o fechamento (a conversa marcada, a visita, o orçamento,
a proposta) é o da jornada comercial do `_memoria/oferta.md`, e a conversa de
venda é o `conversa.md`.

Fechou, o que vem depende do que o cliente é para você:

- **um projeto contínuo**, com entrega, material e conversa próprios ao longo de
  semanas (a consultoria, o site, a gestão de uma conta): quem abre o cliente é
  o `/novo-cliente`, com a pasta dele;
- **um cadastro**, que passa a comprar ou a mandar serviço sem virar um projeto
  à parte (a frota que manda os carros, o café que faz pedido toda semana, o
  paciente que marca): não se abre pasta. O `fechou=sim` na linha dele no
  `envios.csv` da leva é o registro na operação, e o atendimento segue no
  cadastro que o negócio já usa (a planilha, o sistema, a agenda).

Na dúvida, pergunte qual dos dois ele é.
