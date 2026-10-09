---
name: responsive-design
description: Monta e revisa layout responsivo com o CSS que os navegadores suportam hoje - container queries, tipografia e espaço fluidos com clamp, Grid e subgrid, mobile-first, unidades de viewport dinâmicas, imagem responsiva, alvo de toque e movimento reduzido - e mede o resultado em várias larguras. Use para página, landing, componente ou tela que precisa funcionar do celular ao monitor largo, ou para achar o que quebra no celular.
---

# Responsive Design

Layout que funciona em qualquer largura sem uma versão por aparelho. O método é
deixar o conteúdo e o componente decidirem o próprio tamanho, e usar ponto de
quebra só onde o conteúdo realmente quebra.

## Quando usar

- página, landing ou tela nova que precisa servir do celular ao monitor largo;
- componente que vai morar em lugares de larguras diferentes (card na grade, na
  lateral e no modal);
- texto e espaçamento que crescem com a tela sem saltos;
- revisão de algo que "quebra no celular": rolagem lateral, texto miúdo, botão
  pequeno, altura que pula quando a barra do navegador some;
- escala de ponto de quebra e de tamanho para um sistema de design.

## A ordem das decisões

Cada passo resolve o que der antes de chamar o seguinte. A maior parte dos
layouts termina no passo 2.

1. **Fluxo natural.** HTML semântico, bloco ocupando a largura disponível,
   imagem com `max-width: 100%`. Sem largura fixa em pixel no que contém texto.
2. **Layout intrínseco.** Grid com `repeat(auto-fit, minmax(...))`, flex com
   `flex-wrap`, `min()`, `max()` e `clamp()` nas larguras. O layout se rearranja
   sozinho, sem consulta nenhuma.
3. **Fluido.** Tipografia e espaço em `clamp()`, com `rem` na conta para o zoom
   continuar funcionando.
4. **Container query.** Quando a mudança depende do espaço que o componente tem,
   não da tela: o componente vira container e decide a própria forma.
5. **Media query.** Só para o que é da página inteira (navegação principal,
   colunas da página, preferências da pessoa) ou do aparelho (toque, hover,
   movimento reduzido, impressão).

## Regras que valem sempre

- **Mobile-first:** o CSS base é o da tela estreita; as consultas acrescentam
  com `min-width` ou com a sintaxe de intervalo (`width >= 48rem`).
- **Ponto de quebra vem do conteúdo.** Abrir a página, alargar até o layout
  ficar ruim e quebrar ali. Os números de uma escala são ponto de partida, não
  lista de aparelhos.
- **Consulta em `rem` ou `em`**, nunca em `px`: com o zoom do navegador o ponto
  de quebra acompanha o texto.
- **Propriedades lógicas** (`margin-inline`, `padding-block`, `inset-inline-start`)
  em vez de esquerda e direita, para o layout servir a qualquer direção de
  escrita sem reescrever.
- **Altura de tela é `dvh`** (ou `svh` para o que não pode pular); `100vh` no
  celular fica atrás da barra do navegador.
- **Nada passa da largura:** sem rolagem lateral em 320px de largura (o mínimo de
  reflow que a acessibilidade pede). Palavra longa e URL quebram com
  `overflow-wrap: anywhere`; tabela larga rola dentro do próprio contêiner.
- **Alvo de toque com no mínimo 24 por 24 px** de área clicável, e 44 por 44 nos
  controles principais de tela de toque.
- **Movimento respeita `prefers-reduced-motion`:** com `reduce`, o deslocamento,
  o parallax e o zoom saem; a troca de opacidade curta pode ficar.
- **Imagem tem dimensão declarada** (`width` e `height`, ou `aspect-ratio`) para
  não empurrar o conteúdo ao carregar, e `srcset` com `sizes` para o celular não
  baixar a versão do monitor.

## As referências

Abrir só a do assunto do pedido:

| Arquivo | O que cobre |
|---|---|
| `references/layout-e-grid.md` | Grid, subgrid, áreas nomeadas, flex que quebra linha, largura intrínseca, os padrões de página (barra lateral, grade de cards, hero, tabela, navegação) |
| `references/consultas-de-container.md` | container de tamanho, nomes, unidades `cq*`, consulta de estilo, como combinar com media query e com Tailwind |
| `references/tipografia-e-espaco-fluidos.md` | a conta do `clamp()`, escala de tipo e de espaço, zoom e acessibilidade, comprimento de linha, quebra de título |
| `references/viewport-midia-e-preferencias.md` | escala de pontos de quebra, sintaxe de intervalo, `dvh`/`svh`/`lvh`, área segura do celular, imagem e vídeo responsivos, toque e ponteiro, preferências da pessoa, impressão |

## Como provar que está pronto

Abrir a página no navegador do workspace (o Playwright MCP) e medir, não olhar:

1. **Larguras:** 320, 375, 768, 1024, 1280 e 1440 (e a largura real do projeto,
   se o briefing citar uma).
2. **Rolagem lateral:** em cada largura,
   `document.documentElement.scrollWidth <= document.documentElement.clientWidth`.
   Comparar com `clientWidth`, não com `innerWidth`: o celular emulado alarga o
   `innerWidth` quando algo vaza, e a conta passa sem a página caber.
3. **Quem vaza:** se a conta falhar, listar os elementos cujo
   `getBoundingClientRect().right` passa da `clientWidth`.
4. **Toque:** no celular, os controles com área menor que 24 por 24 px.
5. **Zoom:** a 200% na largura de 1280, o texto cresce e nada se sobrepõe.
6. **Movimento:** com `prefers-reduced-motion: reduce` emulado, nada desliza.
7. **Print** de cada largura olhado em tamanho real antes de dizer pronto.

## Erros que mais aparecem

- largura fixa em pixel num contêiner de texto, ou `min-width` grande num filho
  de flex (o item de flex não encolhe abaixo do conteúdo: `min-width: 0`);
- `100vh` no hero do celular;
- tipografia só em `vw`, que não cresce com o zoom;
- imagem sem `aspect-ratio` que pula ao carregar, ou esticada sem `object-fit`;
- menu escondido com `display: none` no celular e sem outro caminho até os links;
- `z-index` alto resolvendo sobreposição em vez de ordem de empilhamento
  (`isolation: isolate` no componente);
- hover como único jeito de mostrar uma ação, sem equivalente no toque.
