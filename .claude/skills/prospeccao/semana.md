# Modo semana: fechar a semana e decidir uma coisa

Uma vez por semana, no mesmo dia, olhe o que aconteceu e decida **uma** mudança, ou
nenhuma. O resumo vai para o `semanas.md` da operação, uma seção por semana, no
formato do molde.

## Passo 1: a régua primeiro

```
node scripts/prospeccao/conferir.mjs saidas/prospeccao-<operacao>
```

Com reprova, a contagem sai errada: conserte antes de contar. A agenda que ela
lista entra no resumo como o que fica para a próxima semana.

## Passo 2: o funil, por forma

Conte nos `envios.csv` das levas, só as linhas com `data` desta semana e, para as
etapas seguintes, o que andou nesta semana:

| Etapa | Como contar |
|---|---|
| abordados | linhas com `data` na semana |
| abriu | `abriu=sim` |
| respondeu | `resposta=sim` ou `nao` (o silêncio não conta) |
| pediu a oferta de entrada | `pediu_oferta_de_entrada=sim` |
| conversa feita | `conversa_feita=sim` |
| proposta | `proposta=sim` |
| fechou | `fechou=sim` |
| perdidos | `motivo_perda` preenchido, contado por motivo |
| pediram para parar | `pediu_parar=sim` |

Separe a contagem pela `variante` (A e B). O que saiu antes do teste, ou com outra
forma, fica fora da comparação, com o nome da forma que era.

## Passo 3: ler sem se enganar

- **Menos de 20 envios por forma ou menos de 7 dias de teste: a leitura é
  "cedo"**, e se diz assim. Não troque a forma por uma semana boa ou ruim.
- Compare a etapa que a forma mudou: se A e B só mudam a abertura, olhe "abriu →
  respondeu", não "fechou".
- Mais de uma denúncia, marcação de spam ou pedido de parar irritado na semana é
  sinal de que a abertura incomoda: o `metodo.md` § "Quando algo dá errado" manda
  cortar o teto pela metade e reler a abertura.
- O motivo de perda que se repete é o que a próxima semana ataca: uma objeção
  que o banco responde mal, um sinal que não confere, um nicho fora do perfil.

## Passo 4: decidir uma coisa

Uma só, escrita com o porquê: manter as duas formas, trocar a perdedora por uma
nova (só com leitura que não é "cedo"), ajustar uma resposta do banco, mudar o
teto, parar um nicho. A mudança na mensagem passa por você antes de entrar no
manual.

## Passo 5: o resumo

Copie a seção do molde `.claude/skills/prospeccao/modelos/semanas.md` para o fim do
`semanas.md` da operação e preencha: as datas, o funil por forma, os motivos de
perda, a leitura ("cedo" ou o que os números dizem), a decisão e a agenda da
próxima semana. Rode a régua uma última vez.

## Pronto quando

O resumo está no `semanas.md`, com uma decisão (ou "nenhuma, porque ..."), e o
conferidor sai com 0.
