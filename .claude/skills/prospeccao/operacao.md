# Modo operação: montar a operação da primeira vez

Uma operação é um jeito de abordar: uma oferta de entrada, um nicho, um canal,
uma voz. Quem vende duas coisas diferentes, ou para dois nichos que pedem
mensagens diferentes, monta duas operações. A pasta é
`saidas/prospeccao-<operacao>/` <!-- caminho futuro: nasce neste modo -->, com um
nome curto em minúsculas (`prospeccao-padarias`, `prospeccao-clinicas`).

## Passo 0: a oferta está na memória?

Leia o `_memoria/oferta.md`. Precisa ter, escritos:

- o que você vende e para quem (o nicho);
- a faixa de preço, ou a decisão de não dizer preço na conversa (o campo
  "Preço" da seção "Ofertas");
- a jornada comercial: o que acontece depois do sim (a conversa marcada, a
  visita, o orçamento, a proposta).

Faltou um deles: **pare** e diga exatamente o que gravar e onde, numa frase que
a pessoa responde na hora. A do preço, que é a que mais falta:

> Antes de montar a operação, falta uma decisão de preço no `_memoria/oferta.md`
> (o campo "Preço", na seção "Ofertas"): a faixa que você diz quando perguntam
> "quanto custa" (por exemplo, "entre X e Y, conforme ..."), ou "não digo preço
> por mensagem, só na conversa". Qual das duas? Eu gravo pelo `/memoria registrar`.

Com a resposta, grave pelo `/memoria registrar` no `oferta.md`, campo "Preço", e
siga; a frase de faixa do manual (a pergunta 4) sai dela. O mesmo vale para o
que vende, o nicho e a jornada: o campo que falta, o arquivo e a pergunta. A
operação só nasce depois.

## Passo 1: as seis perguntas

Faça uma por vez, e proponha a resposta quando a memória já der a base.

1. **Qual é a oferta de entrada?** O primeiro passo pequeno que a abertura
   oferece (uma avaliação, uma visita, uma amostra, uma conversa de 20 minutos),
   que o dono aceita sem decidir a compra. Vem da jornada do `oferta.md`.
2. **Qual nicho e qual região?** A resposta vira a calibragem: chame o agente
   `estrategista` para calibrar a vertical. Ele grava em
   `saidas/prospeccao-<operacao>/calibragem-<vertical>-<AAAA-MM-DD>/CALIBRAGEM.md` <!-- caminho futuro: o estrategista grava no primeiro uso -->
   e só a calibragem com `estado: aprovada` e os 13 campos preenchidos libera a
   primeira leva.
3. **Por qual canal, de qual número ou conta, e quantas conversas novas por
   dia?** O canal da operação (o `metodo.md` § "O canal" diz o risco de cada
   um), o número ou a conta que envia (**nunca o pessoal**) e o teto diário de
   conversas novas por número ou conta. Sem experiência, comece baixo e suba
   devagar: o teto é escolha, e fica escrito.
4. **O que você responde quando perguntam "quanto custa"?** Uma frase só, com a
   faixa do `oferta.md` ("fica entre X e Y, conforme ..."), ou `*(a definir)*`
   se a decisão é não dizer valor na conversa. É a única frase com valor que o
   conferidor aceita numa mensagem.
5. **O que você pode dizer de credencial, e que garantia você dá?** Só o que o
   `_memoria/prova.md` sustenta. Sem cliente ainda, a credencial é o que você
   sabe fazer e por quê, nunca um caso inventado. A garantia entra na linha "A
   garantia que se dá de fato" do manual só se você a dá de fato, com o prazo e o
   que cobre; se ela ainda não está na memória, o `/memoria registrar` grava no
   `oferta.md` antes. Sem garantia, a linha fica `*(nenhuma)*` e a régua barra a
   palavra.
6. **Como você conta de onde veio o contato, e como sai da conversa?** A frase
   de origem ("vi o carro de vocês aqui no bairro", "achei o seu perfil quando
   procurei ... na região") e a frase de saída para quem não quer
   ("combinado, não te mando mais nada").

## Passo 2: copiar os moldes

Copie de `.claude/skills/prospeccao/modelos/` para a pasta da operação:

| Molde | Vira | O que preencher agora |
|---|---|---|
| `MANUAL.md` | `MANUAL.md` | as seis respostas, a abertura em duas formas (A e B), as voltas |
| `nao-contatar.md` | `nao-contatar.md` | nada: começa com a tabela vazia |
| `objecoes.md` | `objecoes.md` | as respostas na voz da operação, a partir do `conversa.md` |
| `mapa-de-situacoes.md` | `mapa-de-situacoes.md` | nada, ou as classes que o nicho pede a mais |
| `semanas.md` | `semanas.md` | nada: a primeira linha entra no fim da primeira semana |

O `ficha.md`, o `LEIA.md`, o `folha.md` e o `envios.csv` ficam na skill: são
copiados a cada leva, pelo `leva.md`.

A abertura e as respostas são rascunho até você ler e aprovar. Uma mensagem só
entra no manual depois disso.

## Passo 3: a régua

```
node scripts/prospeccao/conferir.mjs saidas/prospeccao-<operacao>
```

Na operação recém-montada, o esperado é "Nada reprovado" e "A agenda de hoje:
nada vence". Se reprovar palavra ou valor, a mensagem do manual ou do banco é que
muda, nunca a lista do `metodo.md`. A palavra que só esta operação não diz entra
no manual, em "O que esta operação não diz".

## Pronto quando

- o `MANUAL.md` tem as seis respostas, a abertura A e B aprovadas e o teto;
- a calibragem do nicho está pedida ao `estrategista` (aprovada, a primeira leva
  pode sair);
- o conferidor sai com 0.
