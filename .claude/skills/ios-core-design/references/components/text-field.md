# Text Field · `TextField.tsx`

> Equivalente nativo: `UITextField` / SwiftUI `TextField`.

## Anatomia

- Campo: altura 44px (`--ios-touch-min`), raio 12px (`--ios-radius-input`),
  fundo `--ios-fill-tertiary` (o estilo "inset" dos formulários iOS),
  padding horizontal 16px, texto Body.
- **Concentricidade** (`foundations.md` §3): dentro de um card de raio 16,
  o campo de 12 já sai concêntrico de graça enquanto o padding do card for
  até 4px (16 − 4 = 12). Padding maior pede
  `calc(var(--ios-radius-card) - padding)`, parando em 8.
- Rótulo: acima do campo, Subheadline em `--ios-label-secondary`
  (adaptação web — no iOS o rótulo mora na célula; ver "Web: limites").
- Placeholder: `--ios-label-tertiary`.
- Erro: mensagem Footnote em `--ios-red` abaixo do campo + borda
  `--ios-red` de 1px.
- Campo é conteúdo, não cromo: sólido, sem `.ios-glass` e sem sombra
  (regra 5: sombra é assinatura do vidro; conteúdo eleva por cor).

## Quando usar

- Entrada de texto curto de uma linha: nome, email, valor, busca simples
  fora de barra (busca EM barra → `SearchField`).

## Quando NÃO usar

- Texto longo/multilinha → `TextArea`
- Valor de um conjunto fechado → `Picker`
- Data → `DatePicker`

## Estados

| Estado | O que muda |
|---|---|
| default | Fundo fill-tertiary, sem borda |
| focused | Anel global de foco (o campo não muda de cor — o iOS não muda) |
| erro | Borda 1px `--ios-red` + mensagem + `aria-invalid` |
| disabled | `opacity: 0.4` |

## Conteúdo e texto

Rótulo curto sem ponto ("Email"); placeholder é EXEMPLO do formato
("nome@exemplo.com"), nunca instrução nem cópia do rótulo
(`writing.md` §2). Mensagem de erro: o que houve + saída, sem culpa.

## Acessibilidade

- `<input>` com `<label htmlFor>` REAL — placeholder não substitui rótulo.
- Erro: `aria-invalid` + `aria-describedby` apontando pra mensagem.
- `type`/`inputMode`/`autoComplete` corretos (email, tel, numeric…) — é o
  que invoca o teclado certo no aparelho.

## Erros comuns

- Placeholder como rótulo (some ao digitar) → label sempre visível.
- Borda cinza de 1px em volta (web clássica) → o estilo é fundo fill SEM
  borda; borda só no erro.
- Sombra ou vidro no campo → regra 8 ("Liquid Glass, não clássico") é do
  CROMO; controle de formulário fica sólido, elevando por cor.
- Mensagem de erro genérica ("Campo inválido") → dizer o formato esperado.
- Esquecer `inputMode` → teclado errado no celular é atrito real.

## Web: limites

- No iOS nativo o campo vive numa célula de lista com o rótulo à esquerda;
  na web o padrão rótulo-acima é mais robusto (linhas quebram, zoom,
  leitor). Pra réplica fiel de tela de Ajustes, montar o campo DENTRO de
  uma `ListRow` (ver `list.md`).
