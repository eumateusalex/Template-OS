# Action Sheet · `ActionSheet.tsx`

> Equivalente nativo: `UIAlertController(.actionSheet)` — no Liquid Glass,
> dois painéis de vidro flutuando sobre a borda inferior.

## Anatomia

- **Flutua, não encosta**: sobe da borda com `--ios-bar-inset` (12px) nas
  laterais e embaixo, somado à safe area (`--ios-safe-bottom`) — a mesma
  geometria da barra flutuante (`foundations.md` §5). Largura máx ~500px
  centrada em tela larga.
- **Dois blocos, cada um UM vidro**: `.ios-glass` + `rounded-ios-sheet`
  (20px nos 4 cantos — o painel flutua inteiro, não é o sheet colado).
  Borda de luz e sombra vêm da classe; sem fundo próprio.
  1. As ações: título/contexto opcional (Footnote `--ios-label-secondary`
     centrado) + células de **56px** com hairline entre elas, Body azul
     centrado; destrutiva em `--ios-red`.
  2. **Cancelar** apartado embaixo, célula única semibold.
- Os botões são CONTEÚDO do vidro — nunca vidro próprio (`materials.md` §5).
- Entrada `animate-ios-sheet-up` (spring 0.5s); véu de cor `--ios-scrim`.

## Quando usar

- Escolher entre 2–6 AÇÕES sobre algo que acabou de ser tocado ("Compartilhar
  / Duplicar / Apagar") — o afastamento do Cancelar protege do toque errado.

## Quando NÃO usar

- Decisão binária parar-tudo → `Alert`
- Conteúdo, formulário, detalhe → `ModalSheet`
- Menu contextual de item em tela grande/desktop → `ContextMenu`
  (o action sheet é o irmão mobile do context menu)

## Estados

Células seguem o pressed padrão (`opacity: 0.7`); sem outros estados.

## Conteúdo e texto

Cada ação é verbo curto ("Duplicar"). O título opcional dá o contexto
("O que fazer com esta foto?") — Footnote, não Headline. Cancelar é
"Cancelar", sempre no bloco separado.

## Acessibilidade

- `<dialog>` com `showModal()`; `aria-labelledby` no título (ou
  `aria-label` quando não houver).
- Esc = cancelar; clique no véu = cancelar.
- Foco inicial na primeira ação não destrutiva.

## Erros comuns

- Blocos colados na borda, sem margem → anatomia do iOS clássico; no Liquid Glass o
  action sheet flutua com `--ios-bar-inset` + safe area.
- Fundo sólido `--ios-bg-grouped-secondary` nos blocos → o bloco é
  `.ios-glass`; o sólido é só o fallback automático da classe.
- `.ios-glass` em cada botão → vidro dentro de vidro (`materials.md` §5);
  o bloco é o vidro, os botões são conteúdo dele.
- Cancelar dentro do bloco de ações → o bloco separado é a assinatura.
- Ícone nas células → o action sheet nativo é texto puro centrado
  (ícone é do context menu).
- 10 ações → seis no máximo; passou disso, é uma tela.
- Destrutiva como primeira da lista → fica por último no bloco de ações.

## Web: limites

- Sem arrasto pra fechar na v1 (o nativo também não arrasta action
  sheet) — véu e Cancelar resolvem.
- Dois vidros irmãos (ações + Cancelar) não violam "vidro não amostra
  vidro": eles são vizinhos sobre o conteúdo, não aninhados.
