# Badge · `Badge.tsx`

> Equivalente nativo: o badge de notificação do app icon/tab bar e o
> contador cinza das listas (Mail).

## Anatomia

- Pílula de **20px** de altura (min-width 20 — vira círculo com 1
  dígito), raio pílula (`--ios-radius-pill`), texto Caption 1 (12px).
  Contagem é pílula SEMPRE — o raio novo de 8px é da tag, não daqui.
- Duas variantes:
  - `red`: `--ios-red` + texto `--ios-on-accent` — notificação, não lido
  - `gray`: `--ios-fill-secondary` + texto `--ios-label-secondary` —
    contagem neutra (itens numa pasta)
- Variante `dot`: círculo de 8px sem número (só "tem novidade").
- Números grandes truncam em "99+".

## Quando usar

- Contagem de não lidos/pendentes ancorada em tab, célula ou ícone
- Contagem neutra à direita de célula de lista (variante gray)
- Novidade sem contagem → `dot`

## Quando NÃO usar

- Rótulo de status com palavra ("Ativo", "Beta") → é uma tag/etiqueta de
  texto, não badge numérico. Não existe variante aqui: quem compuser uma
  usa o raio de badge/tag — `--ios-radius-badge` (8px,
  foundations.md §3) — retangular, nunca pílula
- Chamar atenção pra CTA → badge não é marketing
- Número que não muda nunca → é texto de célula (`value` da `ListRow`)

## Estados

Sem estados — o badge reflete um número. Zero = badge some (nunca "0").

## Conteúdo e texto

Só número (ou nada no `dot`). Truncar em "99+".

## Acessibilidade

- O número sozinho não diz nada: o PAI carrega o contexto —
  `aria-label="3 mensagens não lidas"` no link/célula; o badge visual
  fica `aria-hidden`.
- Contraste do branco sobre vermelho ≈4:1 em texto de 12px — aceito por
  ser informação curta e redundante (ver `accessibility.md` §2); a
  variante gray não tem o problema.

## Erros comuns

- Badge "0" → zero esconde o badge.
- Badge verde/azul/roxo → vermelho é notificação, cinza é contagem;
  acabou.
- Badge com palavra dentro → número ou dot.
- Esquecer o rótulo no pai → o leitor de tela ouve "3" solto.
- Badge de vidro ou com sombra sobre a cápsula da tab bar → o vidro é a
  cápsula; o badge é conteúdo dela, sólido (regra 8).

## Web: limites

Nenhum — composição pura.
