# Date Picker · `DatePicker.tsx`

> Equivalente nativo: `UIDatePicker` no estilo **compacto** (iOS 14+): o
> valor aparece num campo cinza; tocar abre o calendário do sistema.

## Anatomia

- Linha com rótulo à esquerda (Body `--ios-label`) e o VALOR à direita
  num campo compacto: fundo `--ios-fill-tertiary`, raio 12px
  (`--ios-radius-input` — é um input, leva o raio de input), padding
  12px×7px, texto Body.
- Por baixo, `<input type="date">` (ou `time`/`datetime-local`) nativo —
  o calendário/roleta que abre é o do sistema.
- Altura da linha: 44px (`--ios-h-row`).
- Campo de formulário é conteúdo, não cromo: sólido, sem `.ios-glass` e
  sem sombra (regra 5: sombra é assinatura do vidro; conteúdo eleva por
  cor).

## Quando usar

- Escolher data ou hora em formulário/ajustes: vencimento, lembrete,
  aniversário.

## Quando NÃO usar

- Intervalo de datas (ida e volta) → duas linhas, uma por data
- Data que a pessoa digita mais rápido que escolhe (nascimento em
  cadastro longo) → `TextField` com `inputMode="numeric"` e máscara
- Calendário sempre visível (agenda) → é uma tela, não um controle

## Estados

| Estado | O que muda |
|---|---|
| default | Campo fill com a data atual formatada |
| focused | Anel global de foco no campo |
| erro | Mensagem Footnote `--ios-red` abaixo da linha |
| disabled | `opacity: 0.4` |

## Conteúdo e texto

Rótulo curto ("Vencimento"). O formato exibido é o do `locale` do
navegador — não forçar máscara por cima do controle nativo.

## Acessibilidade

- `<input type="date">` NATIVO com `<label htmlFor>` — teclado, leitor e
  o picker do sistema de graça.
- Erro via `aria-describedby` + `aria-invalid`.

## Erros comuns

- Recriar calendário em JS "pra ficar bonito" → o nativo no iOS abre a UI
  da Apple de verdade; a lib de calendário é que destoa (e é dependência
  proibida).
- Esconder o input e mostrar só texto → o input É o controle focável;
  estilizar o próprio input.
- Forçar formato dd/mm/aaaa no visual → o locale resolve; forçar quebra
  em outros países.
- `.ios-glass` no campo → regra 8 ("Liquid Glass, não clássico") é do
  CROMO; controle em área de conteúdo fica sólido.

## Web: limites

- A cara do calendário aberto é do navegador — não se estiliza.
- O wheel picker inline (roleta aberta na tela) está fora de escopo
  (`web-translation.md` §9). TODO registrado: se um dia entrar, será
  variante nova, nunca dependência.
- No desktop, `showPicker()` é chamado no clique quando disponível, pra
  abrir o calendário sem depender do ícone minúsculo do navegador.
