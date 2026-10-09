# Notice · composição em CSS puro (sem .tsx)

> Aviso inline é CONTEÚDO, então
> é cartão sólido elevando por cor, nada de vidro (materials.md §1).
> É o que a web resolve com "callout de borda colorida" (Bootstrap/Material)
> e o iOS **não tem nem faria assim**: a tradução correta é um cartão
> agrupado com o ícone carregando a cor.

## Anatomia

- Cartão: `--ios-bg-grouped-secondary`, raio `--ios-radius-card` (16px;
  o token resolve), padding 12×16,
  `display:flex; gap:12px; align-items:flex-start`. Sem sombra: sombra é
  assinatura do vidro, e fora de vidro/overlay é proibida (regra 5).
- Ícone Phosphor de 20px, `flex:none`, **é ele que carrega a cor**:
  `Info` azul (aviso), `Warning` laranja (atenção, o padrão),
  `WarningCircle` vermelho (erro).
- Texto em Subheadline, cor `--ios-label`; `<b>` interno fica semibold
  **na cor do label** — a cor mora só no ícone.

## Quando usar

- Contexto ou diagnóstico no topo de uma tela ("estes números são de dados
  de exemplo…", "há células de data inválidas…")
- Resultado de cálculo que merece destaque editorial dentro de um relatório

## Quando NÃO usar

- Precisa de resposta → `Alert`
- Confirmação passageira → `Toast`
- Erro que impede a tela → mensagem no lugar do conteúdo, com saída

## Erros comuns

- Borda lateral colorida com fundo tintado → é o padrão web que este
  componente substitui; a superfície é neutra, a cor é do ícone.
- Notice de vidro pra "chamar atenção" → vidro é cromo; aviso inline é
  conteúdo da tela (regra 8).
- `<b>` herdando a cor do acento → vira texto rebaixado a decoração.
- Voz de sistema em primeira pessoa ("Li 563 leads…") → impessoal
  (`writing.md`): "Foram lidas…", "Não foi possível…".

## Acessibilidade

Conteúdo estático: sem ARIA especial. Se o notice aparecer em resposta a
uma ação (erro de leitura), a região que o recebe pode ser `aria-live`.
Ícone sempre `aria-hidden` — a mensagem se basta.
