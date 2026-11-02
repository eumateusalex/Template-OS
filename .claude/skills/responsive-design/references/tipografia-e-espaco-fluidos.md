# Tipografia e espaço fluidos

Tamanho fluido cresce em linha reta entre um mínimo e um máximo, sem os saltos
de três ou quatro media queries. A ferramenta é o `clamp(mínimo, preferido,
máximo)`.

## A conta do clamp

Escolher dois pontos: o tamanho na tela estreita e o tamanho na tela larga.

- `t1` = tamanho mínimo, na largura `v1`
- `t2` = tamanho máximo, na largura `v2`

Tudo em `rem` (1rem = 16px no padrão do navegador). Então:

```
inclinação = (t2 - t1) / (v2 - v1)
base       = t1 - inclinação * v1
preferido  = base rem + (inclinação * 100) vw
```

**Exemplo, texto do corpo:** 1rem em 20rem (320px) até 1.25rem em 80rem (1280px).

```
inclinação = 0.25 / 60 = 0.0041667
base       = 1 - 0.0041667 * 20 = 0.9167
font-size: clamp(1rem, 0.9167rem + 0.4167vw, 1.25rem);
```

Conferindo: em 320px, 0.9167rem (14.67px) + 0.4167vw (1.33px) = 16px. Em 1280px,
14.67px + 5.33px = 20px.

**Exemplo, título:** 2rem em 20rem até 3.5rem em 80rem.

```
inclinação = 1.5 / 60 = 0.025
base       = 2 - 0.025 * 20 = 1.5
font-size: clamp(2rem, 1.5rem + 2.5vw, 3.5rem);
```

A mesma conta em JavaScript, para gerar a escala:

```js
const fluido = (t1, t2, v1 = 20, v2 = 80, unidade = 'vw') => {
  const inclinacao = (t2 - t1) / (v2 - v1);
  const base = t1 - inclinacao * v1;
  const r = (n) => +n.toFixed(4);
  return `clamp(${t1}rem, ${r(base)}rem + ${r(inclinacao * 100)}${unidade}, ${t2}rem)`;
};
fluido(1, 1.25);   // clamp(1rem, 0.9167rem + 0.4167vw, 1.25rem)
fluido(2, 3.5);    // clamp(2rem, 1.5rem + 2.5vw, 3.5rem)
```

Trocando `vw` por `cqi`, o mesmo tamanho escala com o container em vez da tela
(ver `consultas-de-container.md`); aí `v1` e `v2` são larguras de container.

## Zoom e acessibilidade

- **Nunca só `vw`.** `font-size: 4vw` não cresce com o zoom do navegador, e o
  texto precisa chegar a 200% sem perder conteúdo. A parte em `rem` do valor
  preferido é o que responde ao zoom.
- **Máximo até cerca de 2,5 vezes o mínimo.** Quanto maior a inclinação, menos o
  zoom pesa no resultado; com o máximo muito acima do mínimo, há larguras em que
  dobrar o zoom não dobra o texto. Para título muito grande, segurar a
  inclinação e aceitar um máximo menor.
- **Mínimo do corpo em 1rem.** Abaixo disso, só para texto de apoio curto
  (legenda de foto, nota), nunca para o parágrafo.
- **Medir:** com o zoom em 200% na largura de 1280, o texto deve ter crescido
  perto do dobro e nada se sobrepor.

## A escala

Definir a escala uma vez, em propriedades, e usar só os nomes:

```css
:root {
  --texto-pp: clamp(0.8125rem, 0.7917rem + 0.1042vw, 0.875rem);
  --texto-p:  clamp(0.875rem, 0.8333rem + 0.2083vw, 1rem);
  --texto-m:  clamp(1rem, 0.9167rem + 0.4167vw, 1.25rem);
  --texto-g:  clamp(1.25rem, 1.0833rem + 0.8333vw, 1.75rem);
  --texto-gg: clamp(1.5rem, 1.1667rem + 1.6667vw, 2.5rem);
  --titulo:   clamp(2rem, 1.5rem + 2.5vw, 3.5rem);
}
```

Dois jeitos de montar os degraus:

- **Por razão:** cada degrau é o anterior vezes uma razão. A razão pode ser
  menor no celular (1.2) e maior no monitor (1.333): o título cresce mais que o
  corpo quando há espaço.
- **À mão:** escolher os pares mínimo e máximo de cada degrau olhando a página
  nas duas pontas. Em sistema pequeno, costuma ser o mais rápido.

A altura de linha cai quando o tamanho sobe: em torno de 1.5 no corpo e de 1.1 a
1.2 no título. Uma regra que acompanha sozinho:
`line-height: calc(0.4rem + 1em)` no corpo dá cerca de 1.4 a 1.5 e encolhe a
proporção no título.

## Espaço fluido

A mesma conta vale para margem, `gap` e `padding`. Uma escala curta basta:

```css
:root {
  --espaco-p:  clamp(0.5rem, 0.4167rem + 0.4167vw, 0.75rem);
  --espaco-m:  clamp(1rem, 0.8333rem + 0.8333vw, 1.5rem);
  --espaco-g:  clamp(1.5rem, 1.1667rem + 1.6667vw, 2.5rem);
  --espaco-xl: clamp(2.5rem, 1.6667rem + 4.1667vw, 5rem);
  --respiro:   clamp(1rem, 0.6667rem + 1.6667vw, 2rem);   /* borda da página */
}
```

O espaço entre seções (`--espaco-xl`) é o que mais precisa variar: grande no
monitor, contido no celular. O espaço dentro do componente (`--espaco-p`) quase
não varia.

## Linha e quebra

- **Comprimento de linha:** `max-inline-size: 65ch` no texto corrido. Título
  pode ir mais largo, entre 20ch e 30ch costuma ler bem.
- **Título equilibrado:** `text-wrap: balance` divide o título em linhas de
  tamanho parecido (vale para até poucas linhas).
- **Parágrafo sem palavra sozinha na última linha:** `text-wrap: pretty`. Suporte
  ainda parcial entre navegadores: é melhoria, sem ele o texto só quebra do jeito
  comum.
- **Palavra longa e URL:** `overflow-wrap: anywhere` no contêiner de texto
  gerado por usuário ou por dado; `hyphens: auto` com o `lang` certo no HTML
  para hifenizar em português.
- **Número em tabela e painel:** `font-variant-numeric: tabular-nums` para os
  algarismos alinharem em coluna.

## Fonte variável

Uma fonte variável carrega um arquivo só para todos os pesos, e o eixo de
largura (`wdth`, quando a fonte tem) deixa o título mais estreito no celular sem
trocar de família:

```css
.titulo { font-variation-settings: "wdth" 100; }
@container (inline-size < 30rem) {
  .titulo { font-variation-settings: "wdth" 85; }
}
```

Conferir no arquivo da fonte quais eixos ela tem antes de usar.
