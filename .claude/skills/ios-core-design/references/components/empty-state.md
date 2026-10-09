# Empty State · `EmptyState.tsx`

> Equivalente nativo: `UIContentUnavailableConfiguration` (iOS 17) — a
> tela de "nada aqui ainda".

## Anatomia

- Bloco centrado (vertical e horizontal) na área vazia:
  1. Ícone Phosphor de **48px** em `--ios-label-tertiary` (grande e
     discreto — nunca colorido gritando)
  2. Título **Headline** em `--ios-label`
  3. Texto de apoio **Subheadline** em `--ios-label-secondary`, 1–2
     linhas, largura máx ~280px
  4. Ação opcional (`Button` tinted, medium)
- Espaçamentos: 8px entre ícone e título, 4px título-texto, 16px
  texto-botão.

## Quando usar

- Coleção vazia (primeira vez): "Nenhuma conversa ainda"
- Busca sem resultados: "Nenhum resultado para 'x'"
- Erro recuperável de carregamento (com ação "Tentar de Novo")

## Quando NÃO usar

- Loading → `ActivityIndicator`
- Erro que precisa de decisão → `Alert`
- Área que nunca terá conteúdo → repensar a tela

## Estados

Sem estados próprios — o botão segue os do `Button`.

## Conteúdo e texto

Título nomeia o que estaria ali ("Nenhuma conversa ainda"); o apoio dá o
primeiro passo ("Toque em Compor pra começar") — `writing.md` §3 pares
11–12. Sem culpa, sem "Ops!".

## Acessibilidade

- Heading real no título (nível conforme a página) + parágrafo comuns.
- Ícone decorativo (`aria-hidden`) — a informação está no texto.
- Se substituiu conteúdo após busca, a região de resultados anuncia
  (`aria-live="polite"` na região, fora deste componente).

## Erros comuns

- Ilustração colorida gigante de banco de imagem → ícone do sistema,
  cinza, discreto.
- Título "Ops! Nada por aqui :(" → nomeia o vazio com calma.
- Empty state com 3 botões → uma ação, a que resolve o vazio.
- Esquecer o estado de busca-sem-resultado (só fazer o de coleção nova).

## Web: limites

Nenhum — composição pura.
