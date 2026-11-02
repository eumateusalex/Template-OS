# Modo leva: montar a próxima leva

Uma leva é um lote de negócios do mesmo nicho, cada um com a sua ficha, que sai ao
longo de alguns dias no ritmo do teto. A pasta é
`saidas/prospeccao-<operacao>/leva-<n>-<nome>/` <!-- caminho futuro: nasce neste modo -->,
com o número em sequência e um nome curto (`leva-1-padarias`, `leva-2-zona-norte`).

## Antes

- A operação existe (o `MANUAL.md` está na pasta). Sem ela, vá ao `operacao.md`.
- **Há uma calibragem aprovada e inteira** (`calibragem-*/CALIBRAGEM.md` com
  `estado: aprovada` numa linha própria, que o `estrategista` grava quando você
  aprova, e os 13 campos dele, cada um numa seção `## N. Campo` preenchida). Sem
  ela, ou com um campo faltando ou vazio, o conferidor reprova a leva: peça ao
  agente `estrategista` a calibragem do nicho, ou o campo que falta, e espere a
  aprovação.
- Leia a calibragem: os sinais que valem para o nicho, o que não é sinal, a
  ordem de abordar, o que a mensagem pode dizer.

## Passo 1: achar os negócios

Busque à mão onde o sinal do seu ramo aparece (a rua, o mapa, a busca, a rede
social, o catálogo do ramo, a vitrine), na região da calibragem. Para cada
candidato:

1. **Confira o `nao-contatar.md`** desta operação e das outras: está lá, não
   entra. O conferidor barra depois, mas a ficha nem deve nascer.
2. **Ache o sinal**: o que se vê de fora, hoje, que mostra que ele precisa do
   que você vende. Ele é do seu ramo, e a calibragem diz quais valem (o
   `metodo.md` § "O sinal, no seu ramo" ensina a escolher, com exemplos de
   ramos diferentes): o carro com o adesivo da empresa rodando no bairro, para
   quem conserta frota; a vitrine vazia à tarde, para quem fornece doce; o site
   que não abre no celular, para quem faz site. Sinal é fato que você viu e
   consegue mostrar; achado é o que você conclui dele. A mensagem leva o sinal,
   nunca o achado como acusação.
3. **Ache o contato**, em ordem: o que tem mais chance de chegar ao dono
   primeiro. Só o contato que é do negócio, conferido na fonte.

Sem sinal conferível, o negócio fica fora da leva. Uma leva de 15 a 30 fichas
dura de uma a duas semanas no ritmo de um teto baixo.

## Passo 2: as fichas

Para cada negócio, copie `.claude/skills/prospeccao/modelos/ficha.md` para
`fichas/NN-nome-curto.md` (`01-padaria-central.md`) e preencha:

- o negócio, o segmento e onde foi achado;
- o `**Contato:**`: os contatos na ordem de tentar, um por linha do parágrafo;
- o sinal, com onde e quando foi visto;
- a abertura desta ficha: a do manual (forma A ou B, alternando pela ordem) com
  o sinal dele, em bloco de citação (`>`).

**Um contato vive numa ficha só.** O mesmo número ou e-mail em duas fichas (desta
leva ou de outra) é reprovado.

## Passo 3: o LEIA e o registro

- Copie `modelos/LEIA.md` para a pasta da leva e preencha: o nicho, a calibragem
  usada, a forma em teste (A × B e o que muda entre elas), a ordem das fichas.
- Copie `modelos/envios.csv` para a pasta da leva. Ele começa só com o cabeçalho;
  cada envio vira uma linha no modo dia.

## Passo 4: a régua

```
node scripts/prospeccao/conferir.mjs saidas/prospeccao-<operacao>
```

O esperado é sair com 0. Palavra proibida ou valor numa abertura: reescreva a
mensagem da ficha. Contato do `nao-contatar.md` ou repetido: tire a ficha.

## Pronto quando

As fichas têm sinal, contato e abertura; o `LEIA.md` diz a forma em teste; o
`envios.csv` tem o cabeçalho do molde; o conferidor sai com 0. Mostre a leva
antes do primeiro envio: as aberturas são rascunho até você aprovar.
