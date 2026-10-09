# Text Area · `TextArea.tsx`

> Equivalente nativo: `UITextView` / SwiftUI `TextEditor`.

## Anatomia

- Campo multilinha: raio 12px (`--ios-radius-input`; a
  utilitária resolve), fundo `--ios-fill-tertiary`, padding 12px×16px,
  texto Body, altura mínima de 3 linhas (~88px), cresce por `rows` ou
  conteúdo. Campo de texto segue retangular: cápsula é a forma dos
  CONTROLES no Liquid Glass, não de área de escrita (foundations.md §3).
- Rótulo acima (Subheadline `--ios-label-secondary`) e erro abaixo
  (Footnote `--ios-red`) — mesmo esqueleto do `TextField`.
- Contador de caracteres (opcional): Caption 1 em `--ios-label-tertiary`,
  alinhado à direita abaixo do campo; vira `--ios-red` quando estoura.

## Quando usar

- Texto livre de mais de uma linha: comentário, descrição, mensagem.

## Quando NÃO usar

- Uma linha só → `TextField`
- Texto com formatação (negrito, lista) → editor rico é outro projeto,
  fora desta linguagem

## Estados

| Estado | O que muda |
|---|---|
| default | Fundo fill-tertiary, sem borda |
| focused | Anel global de foco |
| erro | Borda 1px `--ios-red` + mensagem + `aria-invalid` |
| disabled | `opacity: 0.4` |

## Conteúdo e texto

Placeholder indica o TIPO de conteúdo ("Conte o que aconteceu"), não
instrução de UI. Limite de caracteres visível quando existir.

## Acessibilidade

- `<textarea>` com `<label htmlFor>` real.
- Erro via `aria-describedby` + `aria-invalid`.
- Contador ligado por `aria-describedby` também — leitor de tela precisa
  saber do limite antes de estourar.

## Erros comuns

- `resize` livre do navegador desalinhando o layout → `resize-none` e
  crescer por `rows`; redimensionar é do sistema, não do usuário aqui.
- Campo de vidro ou com sombra pra "destacar" → formulário é conteúdo:
  o fill já é a superfície, e sombra fora de vidro/overlay é proibida
  (regra 5).
- Altura de uma linha que "pula" ao digitar → mínimo de 3 linhas dá a
  affordance de área.
- Placeholder-romance de 3 frases → uma linha.

## Web: limites

- Auto-crescer com o conteúdo (como o Mensagens faz) exige JS de medição;
  v1 usa `rows` fixo — anotado como enhancement possível, não requisito.
