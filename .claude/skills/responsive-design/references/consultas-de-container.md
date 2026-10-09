# Consultas de container

A media query pergunta o tamanho da tela; a container query pergunta o tamanho
do lugar onde o componente está. Um card que mora na grade, na lateral e num
modal só se acerta nos três com container query.

Consulta de tamanho e as unidades `cq*` funcionam em todos os navegadores atuais
e podem ser a base do layout. Consulta de estilo ainda tem suporte desigual (ver
abaixo) e entra como melhoria.

## Declarar o container

O container é o **pai** do que muda; um elemento não consulta a si mesmo.

```css
.card-moldura {
  container-type: inline-size;
  container-name: card;          /* opcional */
}
/* atalho: container: card / inline-size; */
```

- `inline-size` mede só a largura. É o certo quase sempre.
- `size` mede largura e altura, mas exige que a altura do container não dependa
  do conteúdo (altura fixa ou vinda de fora); sem isso ele colapsa para zero.
- `normal` (o padrão) não serve para consulta de tamanho, só para a de estilo.

Declarar container de tamanho cria contenção de layout: um filho com
`position: fixed` ou `absolute` passa a se posicionar pelo container, e a
largura do container deixa de vir do conteúdo (dentro de flex ou com
`width: fit-content`, ele encolhe a quase nada). Por isso
o container costuma ser uma moldura sem estilo próprio em volta do componente.

## Consultar

```css
.card { display: grid; gap: 0.75rem; }

@container (inline-size >= 28rem) {
  .card { grid-template-columns: 10rem 1fr; align-items: start; }
}

@container card (inline-size >= 40rem) {
  .card__titulo { font-size: 1.5rem; }
}
```

- Sem nome, a consulta vale para o container mais próximo acima do elemento.
- Com nome, vale para o container mais próximo **com aquele nome**: é o jeito de
  um elemento interno consultar a moldura de fora, pulando containers do meio.
- Aceita a sintaxe de intervalo (`20rem <= inline-size < 40rem`), `and`, `or` e
  `not`, como a media query.
- O ponto de quebra do componente é dele, em `rem`, e não precisa coincidir com
  a escala da página.

## Unidades de container

| Unidade | É 1% de |
|---|---|
| `cqi` | largura (eixo inline) do container |
| `cqb` | altura (eixo block) do container |
| `cqw`, `cqh` | largura e altura físicas |
| `cqmin`, `cqmax` | a menor e a maior das duas |

Sem container declarado acima, as unidades caem no tamanho da viewport (como
`svw`/`svh`). Servem para o que deve escalar com o componente, não com a tela:

```css
.card__titulo { font-size: clamp(1.125rem, 0.9rem + 2.5cqi, 1.75rem); }
.card { padding: clamp(0.75rem, 4cqi, 1.5rem); }
```

O `rem` na conta mantém o zoom funcionando (a mesma regra da tipografia fluida
em `tipografia-e-espaco-fluidos.md`).

## Padrões

### O card que se reorganiza

```html
<div class="card-moldura">
  <article class="card">
    <img class="card__foto" src="..." alt="..." width="640" height="400">
    <div class="card__corpo">...</div>
  </article>
</div>
```

```css
.card-moldura { container: card / inline-size; }
.card__foto { inline-size: 100%; aspect-ratio: 16 / 10; object-fit: cover; }

@container card (inline-size >= 30rem) {
  .card { display: grid; grid-template-columns: 40% 1fr; gap: 1rem; }
  .card__foto { aspect-ratio: 1; block-size: 100%; }
}
@container card (inline-size >= 48rem) {
  .card { grid-template-columns: 1fr 1fr; }
  .card__corpo { padding-block: 2rem; }
}
```

O mesmo HTML vira cartão vertical na lateral, horizontal na coluna principal e
destaque no espaço largo.

### A grade inteira como container

O item de uma grade `auto-fit` não sabe a própria largura pela tela. Declarar
cada célula como container resolve: o item se adapta à coluna que recebeu.

```css
.grade > * { container-type: inline-size; }
```

### Ação que vira ícone

Num container estreito, o botão mostra só o ícone; o texto continua no HTML
para o leitor de tela.

```css
@container (inline-size < 22rem) {
  .acao__texto {
    position: absolute; inline-size: 1px; block-size: 1px;
    overflow: hidden; clip-path: inset(50%); white-space: nowrap;
  }
}
```

## Consulta de estilo

Pergunta o valor de uma propriedade personalizada do container:

```css
.secao { --tom: escuro; }

@container style(--tom: escuro) {
  .card { background: var(--superficie-escura); color: var(--texto-claro); }
}
```

Não precisa de `container-type` (todo elemento é container de estilo). O
suporte cobre os motores Chromium e o Safari, e chegou mais tarde ou ainda não
chegou em outros: conferir a tabela de suporte do momento antes de depender
dela, e escrever o estilo base de forma que o componente funcione sem a
consulta. Quando o suporte for incerto, uma classe no pai (`.secao--escura .card`)
faz o mesmo trabalho em qualquer navegador.

## Container e media query juntos

- **Container query:** forma do componente (colunas internas, tamanho do título,
  o que aparece e o que some).
- **Media query:** o que é da página (navegação, colunas da página, margens
  gerais) e o que é do aparelho (toque, movimento reduzido, impressão).

Um componente que usa media query para a própria forma quebra no dia em que é
colocado numa lateral.

## No Tailwind

O Tailwind v4 já traz container query sem plugin:

```html
<div class="@container">
  <article class="grid gap-3 @md:grid-cols-[10rem_1fr] @3xl:gap-6">...</article>
</div>
```

- `@container` declara; `@container/card` dá nome, e `@md/card:` consulta pelo
  nome.
- As variantes são por largura mínima (`@sm:`, `@md:`, `@lg:`...), e `@max-md:`
  consulta largura máxima.
- Tamanho sob medida: `@min-[30rem]:` e `@max-[48rem]:`, ou um tamanho novo em
  `@theme { --container-card: 30rem; }`.
- Unidades de container entram em valor arbitrário: `text-[clamp(1rem,0.9rem+2cqi,1.5rem)]`.

## Fallback

Em navegador sem suporte (versões muito antigas), o CSS dentro do `@container`
é ignorado e fica o estilo base. Por isso o base é o empilhado e legível, e a
consulta acrescenta a forma larga: o componente nunca depende dela para
funcionar.

## O que conferir

- O componente renderizado em três molduras de larguras diferentes na mesma
  página (lateral, coluna, largura total): cada uma na forma certa.
- Nenhum container com `container-type: size` e altura vinda do conteúdo.
- Nenhum componente consultando a si mesmo (a regra no próprio elemento que
  declarou o container não muda nada).
