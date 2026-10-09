# Avatar · `Avatar.tsx`

> Equivalente nativo: o círculo de contato do Mail/Mensagens/Contatos.

## Anatomia

- Círculo (`--ios-radius-pill`) em três tamanhos na grade de 8:
  **sm** 32px · **md** 40px · **lg** 64px.
- Conteúdo, em ordem de preferência: foto (`<img>` cobrindo o círculo) →
  iniciais (1–2 letras, `--ios-label-secondary` sobre `--ios-fill`) →
  glifo `User` do Phosphor (mesmas cores).
- Sem borda, sem anel, sem indicador de status nesta versão.

## Quando usar

- Representar pessoa ou conta: célula de contato, header de perfil,
  remetente de mensagem.

## Quando NÃO usar

- Logo de empresa/app → quadrado de raio 6-8px (padrão de ícone de app),
  não círculo
- Miniatura de conteúdo (foto de produto) → imagem com `--ios-radius-card`
  (16px — a miniatura acompanha o raio do card sozinha, via token)
- Grupo de pessoas → pilha de avatares é padrão próprio, fora desta versão

## Estados

| Estado | O que muda |
|---|---|
| com foto | Imagem cobre o círculo (`object-cover`) |
| sem foto | Iniciais; sem nome, o glifo `User` |
| clicável (envolvido em botão) | Press padrão do elemento que envolve |

## Conteúdo e texto

Iniciais: primeira letra do primeiro e do último nome ("Ana Ribeiro" →
"MA"), sempre maiúsculas via CSS.

## Acessibilidade

- Foto: `alt` com o nome da pessoa ("Foto de Ana Ribeiro").
- Avatar decorativo (nome escrito ao lado na célula): `alt=""` e
  `aria-hidden` no fallback — não repetir o nome duas vezes pro leitor.

## Erros comuns

- Avatar quadrado "pra variar" → círculo é a semântica de pessoa.
- Cor de fundo aleatória por usuário sem critério → o padrão é `--ios-fill`
  neutro; cor por pessoa só se o produto pedir, e aí documentado.
- Ícone `User` gigante dentro do círculo → o glifo ocupa ~50% do diâmetro.
- Esquecer `object-cover` → foto oval/achatada.

## Web: limites

Nenhum — composição pura.
