# Toast / Banner · `Toast.tsx`

> Equivalente nativo mais próximo: as cápsulas de confirmação do sistema
> ("AirPods Conectados") — o iOS não tem "toast" oficial; esta é a
> tradução da skill pro padrão, na estética da cápsula.

## Anatomia

- Cápsula de vidro flutuante no TOPO central: `.ios-glass` +
  `rounded-ios-pill`, padding 10px×16px. A sombra vem com o material —
  sombra é assinatura do vidro (regra 5), nada de sombra própria.
- Conteúdo: ícone Phosphor opcional (ex.: `CheckCircle` em
  `--ios-green`, `WarningCircle` em `--ios-red`) + texto Subheadline.
- Entra com `animate-ios-toast-in` (desce do topo, 0.3s), respeita a
  safe area superior, some sozinha (padrão 3s).

## Quando usar

- Confirmação que não pede resposta: "Salvo", "Link copiado",
  "Mensagem enviada".
- Erro leve e recuperável que não trava o fluxo ("Sem conexão. Tentando
  de novo").

## Quando NÃO usar

- Precisa de decisão → `Alert`
- Erro que impede o fluxo → mensagem no lugar do conteúdo, com saída
- Informação permanente → banner fixo é layout de tela, não toast

## Estados

| Estado | O que muda |
|---|---|
| entrando | `animate-ios-toast-in` |
| visível | Parada, sem pulsar |
| saindo | Fade (0.3s) e remove |

## Conteúdo e texto

1 a 3 palavras ("Salvo", "Link copiado" — `writing.md` §3 par 14). Sem
botão dentro na v1 (toast com ação é padrão à parte; se a ação importa,
não era toast).

## Acessibilidade

- Container `role="status"` `aria-live="polite"`; variante de erro usa
  `assertive`.
- A duração mínima de 3s dá tempo de leitura; conteúdo maior que 3
  palavras já pede outro componente.
- Sem interação dentro → não rouba foco nunca.
- Quem pediu menos transparência recebe a cápsula opaca — o fallback da
  classe `.ios-glass` resolve sozinho (`materials.md` §5).

## Erros comuns

- Toast em cima de toast → fila de um: a nova substitui a atual.
- Toast no rodapé estilo Android → a cápsula do iOS desce do TOPO.
- Sombra avulsa na cápsula → o `.ios-glass` já carrega a sombra de
  flutuação (regra 5); somar outra é redundância.
- 8 segundos de texto longo → era alerta ou mensagem de tela.
- Usar pra erro grave → erro grave não pode sumir sozinho.

## Web: limites

- O nativo é material vibrante; aqui é vidro (regra 8, Liquid Glass), com o fallback opaco
  automático cobrindo navegador sem `backdrop-filter`.
- A montagem/fila (portal, provider) fica pro app — o componente é a
  cápsula + temporizador, deliberadamente simples.
