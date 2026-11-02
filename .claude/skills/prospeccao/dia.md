# Modo dia: a folha, os envios, as respostas e as voltas

O dia tem quatro movimentos, nesta ordem: ver a agenda, montar a folha, anotar o
que saiu e tratar o que voltou. Você pode pedir um só ("anota os envios de
hoje"); o conferidor roda no fim de qualquer um.

## 1. A agenda

```
node scripts/prospeccao/conferir.mjs saidas/prospeccao-<operacao>
```

Antes de qualquer coisa, a régua tem de sair com 0, e a lista dela diz o que vence
hoje:

- **Voltas**: quem abriu e não respondeu. A primeira no dia 7, a segunda (a
  última) no dia 21 e a pelo menos 7 dias da primeira. Antes de cada volta,
  reconfira o sinal: se sumiu, não volte; se mudou, a volta leva o sinal novo.
- **`quando` de hoje ou vencido**: quem respondeu e combinou um dia.
- **Sem `quando`**: quem respondeu e ficou sem dia marcado. Marque um.
- **Avisos**: o teto estourado hoje. Pare de abrir conversa nova nesse número ou
  conta até amanhã.

## 2. A folha do dia

A folha é o que você vai mandar hoje, pronto para copiar. Copie
`.claude/skills/prospeccao/modelos/folha.md` para
`leva-<n>-<nome>/folha-AAAA-MM-DD.md` e monte um bloco por envio, na ordem do
`LEIA.md`, até o teto:

- `## NN · Negócio` (o número e o nome da ficha);
- o `**Contato:**` a tentar, da ficha;
- a mensagem em bloco de citação (`>`), separada como vai sair.

Entram, nesta ordem: as respostas de quem escreveu, os `quando` de hoje, as
voltas e, por último, as aberturas novas até o teto. A volta não conta no teto.
Rode a régua: a folha com palavra proibida, valor fora da faixa ou contato do
`nao-contatar.md` é reprovada antes de você mandar.

## 3. Anotar o que saiu

Uma linha no `envios.csv` da leva por conversa aberta ou tentada, no fim do dia,
com o que você conta (o que saiu, o que não abriu). O cabeçalho é o do molde, o
separador é `;`, e **o `obs` não leva `;`** (use vírgula). São 23 colunas: a
linha nova sai mais certa copiando uma linha anterior e trocando os campos do
que digitando os `;` de cabeça, e a régua diz quando a conta não fecha.

| Campo | O que vai |
|---|---|
| `data` | o dia do primeiro envio, `AAAA-MM-DD` |
| `quem_enviou` | o número ou a conta que enviou |
| `contato`, `ficha`, `negocio`, `segmento` | da ficha (`ficha` é o número, `01`) |
| `variante` | a forma da abertura, `A` ou `B` |
| `abriu` | `sim` se a conversa abriu, `nao` se o contato não existe no canal (no e-mail, o que voltou) |
| `resposta` | `sim`, `nao`, `silencio` ou vazio |
| `pediu_oferta_de_entrada` … `fechou` | `sim`, `nao` ou vazio, conforme anda |
| `pediu_parar` | `sim` se pediu para parar |
| `aviso_do_canal` | a data do aviso de restrição, se houve |
| `tipo_resposta`, `situacao`, `motivo_perda` | o código do `mapa-de-situacoes.md` da operação |
| `quando` | o próximo dia combinado, `AAAA-MM-DD`, ou `encerrada` |
| `volta_1`, `volta_2` | o dia em que cada volta saiu |
| `obs` | o que vale lembrar, curto |

Abriu e não houve resposta: deixe `resposta` vazio ou `silencio`; a régua calcula
as voltas pela `data`. Mandou a volta: preencha `volta_1` ou `volta_2` com o dia.
Não abriu: `abriu=nao`, e tente o próximo contato da ficha em outra linha.

## 4. Tratar o que voltou

Para cada resposta:

1. **Classifique** pelo `mapa-de-situacoes.md` da operação: o tipo de resposta, a
   situação (`Sxx`) e, se perdeu, o motivo (`Mxx`). O mapa diz o que fazer em
   cada uma.
2. **Responda no mesmo dia**, do `objecoes.md` ou da ficha, ajustada ao que ele
   disse. A conversa é o `conversa.md`. A resposta que você monta aqui também é
   rascunho até você aprovar.
3. **Marque o `quando`**: toda conversa respondida e não encerrada tem um dia. Sem
   dia combinado com ele, 7 dias.
4. **Pediu para parar ou se irritou**: a frase de saída do manual, e no mesmo dia
   uma linha no `nao-contatar.md` (data, leva e ficha, negócio, contato, o que
   disse) e `pediu_parar=sim` com `quando=encerrada` no `envios.csv`. O
   conferidor reprova o `descadastro` ou o `irritado` sem `pediu_parar=sim`, e o
   `pediu_parar=sim` sem a linha no `nao-contatar.md`.

## Pronto quando

A folha de hoje saiu, as linhas estão no `envios.csv`, toda resposta tem
classificação e `quando`, quem pediu para parar está no `nao-contatar.md`, e o
conferidor sai com 0.
