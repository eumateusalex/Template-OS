# Fluxo mobile passo a passo

## O que é

Sequência de 2 a 4 telas para uma tarefa só, publicada lado a lado no mesmo
post. Exemplos: app de assinaturas cancelar assinatura
(legenda que pede nota para a interface e gaba a função sem enfeite), app de cuidado pós-alta onboarding,
app de manutenção predial pedido do inquilino,
app de entregas nova entrega.

## Esqueleto (app de assinaturas, 1 passo)

```
[←]  ▬▬ ▬▬ ▬▬ (barra segmentada coral)                   Step 1 of 3
[h] Cancel in the App Store  20px
    app de meditação · free trial · ends Sat 12 pm
┌ cartão de passos ───────────────────────────────┐
│ ① Open your conta online subscriptions (atual, coral)   │
│   Settings › your name › Subscriptions           │
│   [ ↗ Open Subscriptions ] botão preto           │
│ ② Tap app de meditação, then "Cancel Free Trial"        │
│ ③ Confirm · conta online emails a receipt               │
└─────────────────────────────────────────────────┘
WHAT YOU'LL SEE: prévia da tela de fora
✓ You keep the trial until Sep 12 and nothing is charged.
            (espaço)
[ I've cancelled ]  botão preto largura total
    I got stuck     link sublinhado
```

![](../galeria/04-tipos-de-tela/fluxo-cancelar.jpg)
![care circle](../galeria/04-tipos-de-tela/fluxo-onboarding.jpg)
![](../galeria/04-tipos-de-tela/fluxo-novo-pedido.jpg)

## Hierarquia

1. Onde estou (barra segmentada + "Step 2 of 4").
2. Uma pergunta ou tarefa por tela, em frase ("Who are you caring for?", "How
   urgent is it?", "What brought Eleanor home?").
3. Um único botão primário no pé, largura total; a saída honesta embaixo ("I got
   stuck", "Stop · change nothing").

## Densidade

Muito baixa: 1 pergunta, 3 a 5 opções grandes (≈48-56 px de altura), 1 botão.
Opção selecionada = fundo tint + borda da cor + ✓ (app de cuidado pós-alta menta).

## Como reproduzir

Barra de progresso em segmentos de 4 px de altura com gap 4; opções como cartões
de 56 px com ícone à esquerda; botão primário 52 px de altura, raio total, preto
(ou cor da marca: teal no app de cuidado pós-alta, coral no app de manutenção predial); link secundário 14 px
sublinhado centralizado.
