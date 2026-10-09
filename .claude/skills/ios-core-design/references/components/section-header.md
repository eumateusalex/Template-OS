# Section Header · `SectionHeader.tsx`

> Equivalente nativo: o cabeçalho de seção do `UITableView`
> (`titleForHeaderInSection`) e o header de `Section` do SwiftUI.

## Anatomia

- Texto em **Footnote (13px), CAIXA-ALTA**, `--ios-label-secondary`,
  tracking `--ios-tracking-caps` (0.06em — caixa-alta pede respiro).
- Margem: 8px abaixo, 32px acima quando abre uma nova seção
  (`--ios-section-gap` — a seção cuida disso, não o header).
- Alinhado com o TEXTO das células da lista (32px da borda em lista
  inset: 16 de margem + 16 de padding).
- Variante com ação: texto à esquerda + link Subheadline `--ios-blue` à
  direita ("Ver Tudo").

## Quando usar

- Nomear um grupo de células ou um bloco de conteúdo dentro da tela
- Separar assuntos numa tela de Ajustes/formulário

## Quando NÃO usar

- Título da tela → Large Title na `NavigationBar`
- Título de card individual → Headline dentro do `Card`
- Hierarquia editorial de artigo → família Title (`typography.md`)

## Estados

Sem estados — é texto. A ação opcional à direita segue os estados de link
(`plain` button).

## Conteúdo e texto

1 a 3 palavras, sem ponto ("GERAL", "MINHAS LISTAS"). A caixa-alta vem do
CSS (`text-transform`), não do texto digitado — o leitor de tela agradece.

## Acessibilidade

- É um heading REAL (`<h2>`/`<h3>` conforme a hierarquia da página, sem
  pular nível) — a prop `as` controla.
- Caixa-alta via CSS; alguns leitores soletram texto digitado em maiúsculas.

## Erros comuns

- Headline/Title como header de seção → a assinatura do iOS é Footnote
  caixa-alta; título grande no meio da tela é editorial, não seção.
- Header sem os 32px de respiro acima → seções coladas viram sopa.
- Usar `<p>` estilizado → tem que ser heading de verdade pra navegação
  por leitor de tela.

## Web: limites

Nenhum — é dos raros componentes 1:1.
