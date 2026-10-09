# Régua de conversão e receita

**231 princípios** operacionais sobre como um produto digital **converte, retém e
monetiza** — landing e CRO, checkout, onboarding, preço, churn, painel, vieses,
disciplina de feature, posicionamento e diferenciação na era da IA.

## Instalação

**Nenhuma.** A skill é mantida aqui, dentro do workspace, sem atualização automática de fora.
O que existe é o kit em [`_local/`](_local/), que gera, verifica e reconstrói tudo, e o roteiro
[`atualizar.md`](atualizar.md), que traz material novo das fontes que você escolher.

## O que tem dentro

O agente carrega só o tema relevante para a pergunta. Cada princípio segue o mesmo formato
— **Principle → Apply when → The move → Evidence → Visual → In one line** — para entregar a
**alavanca nomeada** (efeito isca, Swiss Knife Index, GBB, os 5 níveis de consciência do
mercado, aversão à perda, regra do pico-fim), o movimento concreto e a prova. Cada princípio se
sustenta sozinho: o caso, o número e o passo que ele precisa estão no próprio texto.

| Tema                                                                       | Princípios | Cobre                                                |
| -------------------------------------------------------------------------- | ---------: | ---------------------------------------------------- |
| [Conversion & Landing Pages](references/conversion-and-landing-pages.md)   |         40 | hero/copy, CTAs, social proof, awareness levels, CRO |
| [Checkout & Forms](references/checkout-and-forms.md)                       |          8 | Checkout, cart abandonment, forms, field count, validation, coupon fields, trust microcopy |
| [Onboarding & Activation](references/onboarding-and-activation.md)         |         37 | empty states, aha moment, TTV, activation, trials    |
| [Design Philosophy & Method](references/design-philosophy-and-method.md)   |         15 | filosofia de design, processo e método               |
| [Pricing & Monetization](references/pricing-and-monetization.md)           |         21 | decoy/anchoring, GBB, trial-with-card, upgrades      |
| [Churn & Retention](references/churn-and-retention.md)                     |         18 | cancellation UX, expectation debt, NRR, JTBD         |
| [Dashboards & Data Visualization](references/dashboards-and-data-viz.md)   |         14 | Dashboards, KPIs, insight vs raw data, scan order, grouping, rounding, hierarchy |
| [Behavioral Science Toolkit](references/behavioral-science-toolkit.md)     |         12 | os vieses e alavancas de persuasão transversais      |
| [Product Strategy & Features](references/product-strategy-and-features.md) |         20 | Swiss Knife Index, feature adoption, attention       |
| [Positioning, ICP & GTM](references/positioning-icp-and-gtm.md)            |         17 | ICP, niche, TAM/SAM/SOM, PLG, first customers        |
| [AI-Era Differentiation](references/ai-era-differentiation.md)             |         12 | moats, commoditization, vibe-coding pitfalls         |
| [Metrics & Experimentation](references/metrics-and-experimentation.md)     |         17 | A/B rigor, vanity metrics, churn→LTV math, funnel arithmetic, research method |

O ponto de entrada do agente é o [`SKILL.md`](SKILL.md). O [`INDEX.md`](INDEX.md) lista os
231 princípios numa linha cada — ele existe porque abrir **um** arquivo de tema gordo custa
mais que ler o índice inteiro. As imagens ficam em [`assets/`](assets/), uma pasta por tema, e o
catálogo [`IMAGENS.md`](IMAGENS.md) diz o que cada uma mostra e quais princípios a usam.

## A espinha, em 9 princípios

1. **Neutralidade é omissão** — interface que não direciona prejudica conversão.
2. **Quem fala com todo mundo não convence ninguém** — sem ICP, valor genérico, pior retenção.
3. **Valor primeiro, pedido depois** — a prova precisa chegar antes da dúvida.
4. **Sua promessa é do tamanho da sua prova** — o mercado acredita no que você demonstra.
5. **Igual compete em preço, diferente compete em categoria** — sem contraste, sem margem.
6. **Default é a decisão que você tomou pelo usuário** — o estado inicial define o comportamento da massa.
7. **Retenção se constrói, não se pede** — perda percebida retém mais que benefício prometido.
8. **Expansão nasce do uso** — upgrade no momento do limite, nunca por interrupção.
9. **Preço é filtro** — a precificação define quem entra, quem fica e quem expande.

## Manutenção

Mexeu em qualquer coisa:

```bash
bash .claude/skills/regua-de-receita/_local/sincronizar.sh --completo   # da raiz do workspace
```

Ele regenera o manifesto, aplica as entradas locais, sincroniza os números, regenera o catálogo
das imagens e o índice, e roda as quatro suítes: as conferências de estado, os defeitos plantados
que provam que a régua sabe reprovar, a prova de que o motor reconstrói byte a byte, e o
comportamento dos scripts de captura. Sai não-zero se algo falhar.

Para ampliar: o roteiro completo de atualização (escolher as fontes, capturar, triar, escrever,
fechar) está em [`atualizar.md`](atualizar.md), as fontes e até onde cada uma foi lida em
[`_local/cobertura.json`](_local/cobertura.json), e o método de escrita do princípio em
[`_local/metodo.md`](_local/metodo.md).
