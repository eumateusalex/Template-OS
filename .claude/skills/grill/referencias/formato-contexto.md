# Formato do CONTEXT.md

> Referência da skill `/grill`. Carregar **na primeira gravação de termo da
> sessão**, não antes.
>
> O `CONTEXT.md` é glossário e nada mais. Define o que cada termo **é**, nunca o
> que ele faz.

---

## Estrutura

```md
# {Nome do Contexto}

{Uma ou duas frases: o que é este contexto e por que ele existe.}

## Linguagem

**Pedido**:
Uma intenção de compra registrada, antes de qualquer cobrança.
_Evitar_: compra, transação

**Nota Fiscal**:
Uma cobrança enviada ao cliente depois da entrega.
_Evitar_: boleto, fatura, pedido de pagamento

**Cliente**:
Uma pessoa ou organização que faz pedidos.
_Evitar_: comprador, conta, usuário
```

---

## As cinco regras

**1. Ter opinião.** Quando existem várias palavras pro mesmo conceito, escolher
a melhor e jogar as outras em `_Evitar_`. Glossário que aceita sinônimo não
resolve nada, só documenta a confusão.

**2. Definição enxuta.** Uma ou duas frases, no máximo. Definir o que a coisa
**é**. Se a definição começou a explicar comportamento, virou spec e saiu do
lugar.

**3. Só termo próprio deste domínio.** Antes de adicionar, a pergunta é: *isto é
um conceito único deste contexto, ou um conceito geral de programação?* Timeout,
retry, DTO, cache, feature flag e tipo de erro **não entram**, por mais que o
projeto use.

**4. Agrupar quando surgir cluster.** Se os termos formam áreas naturais
(Cobrança, Entrega, Acesso), usar subtítulos. Se tudo pertence a uma área
coesa só, lista plana já serve. Não inventar hierarquia antes dela aparecer.

**5. Um termo por vez, no instante em que resolve.** Nunca escrever o glossário
em bloco no fim da sessão.

---

## Contexto único vs. múltiplo

**Contexto único (a maioria dos repositórios):** um `CONTEXT.md` na raiz. Fim.

**Múltiplos contextos:** um `CONTEXT-MAP.md` na raiz lista os contextos, onde
cada um vive e como se relacionam. Cada contexto tem o seu próprio `CONTEXT.md`
e o seu próprio `docs/adr/`; decisão que vale pro sistema inteiro fica no
`docs/adr/` da raiz.

```md
# Mapa de Contextos

## Contextos

- [Pedidos](./src/pedidos/CONTEXT.md) — recebe e acompanha os pedidos
- [Faturamento](./src/faturamento/CONTEXT.md) — gera notas e processa pagamento
- [Expedição](./src/expedicao/CONTEXT.md) — separa no estoque e envia

## Relações

- **Pedidos → Expedição**: Pedidos emite `PedidoRealizado`; Expedição consome pra iniciar a separação
- **Expedição → Faturamento**: Expedição emite `EnvioDespachado`; Faturamento consome pra gerar a nota
- **Pedidos ↔ Faturamento**: compartilham os tipos `ClienteId` e `Dinheiro`
```

### Como a skill decide qual estrutura vale

| O que existe na raiz | Leitura |
|---|---|
| `CONTEXT-MAP.md` | múltiplos contextos: ler o mapa pra achar onde cada um vive |
| Só um `CONTEXT.md` | contexto único |
| Nenhum dos dois | contexto único; criar `CONTEXT.md` na raiz quando o primeiro termo resolver |

Com múltiplos contextos, inferir a qual deles o assunto pertence. **Não estando
claro, perguntar** — termo gravado no contexto errado é pior que termo não
gravado, porque passa a contradizer o vizinho.

---

## Sinais de que o glossário azedou

- Definição com mais de duas frases
- Definição que explica passo a passo
- Termo que qualquer projeto de software teria
- Dois termos definindo a mesma coisa, sem `_Evitar_` entre eles
- Bloco inteiro escrito de uma vez, com data de modificação única
