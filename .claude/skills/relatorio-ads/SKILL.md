---
name: relatorio-ads
description: >
  Gera relatório semanal de anúncios pagos (Google Ads + Meta Ads) a partir dos CSVs
  exportados (ou prints): KPIs contra a régua do nicho, top criativos, alertas
  (queima de orçamento, CTR baixo, conversões caindo) e recomendações para a semana.
  Use quando o usuário pedir "relatório de ads", "relatório de campanha", "como foram os ads",
  "performance da semana", "relatorio meta", "relatorio google ads", ou /relatorio-ads.
---

# /relatorio-ads — Relatório semanal de Google Ads + Meta Ads

Skill que transforma exports brutos das plataformas em relatório executivo que o dono entende sem precisar abrir a interface do Google ou da Meta.

## Dependências

- **Contexto:** `_memoria/empresa.md`, `_memoria/estrategia.md`
- **Tom de voz e linguagem de balcão:** `_memoria/escrita-publica.md`
- **Inputs:** CSVs do Google Ads e/ou Meta Ads Manager. Print também aceito (transcrever). Onde se exporta cada um: "Onde se consegue o export", abaixo
- **Histórico:** `<relatorios>`, a pasta do dono da conta (criar se não existir).
  No negócio próprio é `marketing/campanhas/relatorios/` <!-- caminho futuro: nasce no primeiro relatório -->; em cliente é
  `clientes/<nome>/seo-ads/campanhas/relatorios/`, dentro do repositório do
  cliente, ao lado das campanhas que o `/seo-geo-aeo` (`anuncio.md`) grava ali.
  Dado de anúncio de cliente nunca entra no repositório pessoal, e o histórico de
  um dono nunca serve de comparação para outro.
- ⭐ **Régua absoluta:** [`referencias/benchmarks-br.md`](referencias/benchmarks-br.md)
  — o número está bom **pro mercado**?
- ⭐ **Régua de decisão:** [`referencias/quality-gates.md`](referencias/quality-gates.md)
  — o que fazer com ele, e em que ordem

> 🚨 **As duas réguas se leem ANTES de classificar qualquer métrica.** Sem elas o
> relatório só sabe comparar com a semana anterior, e semana ruim seguida de
> semana ruim vira "estável". Alerta relativo (caiu 30%, subiu 20%) sem alerta
> absoluto não vê o patamar.

---

## Como rodar

O usuário executa o comando e indica os arquivos (colando o caminho ou anexando):

```
/relatorio-ads
dados/google-ads-AAAA-MM-DD.csv
dados/meta-ads-AAAA-MM-DD.csv
```

Ou simplesmente:

```
/relatorio-ads
```

Em seguida, a skill pergunta onde estão os exports da semana.

### Onde se consegue o export

A skill não se conecta às plataformas: ela lê o arquivo que você baixa, então
não pede chave nem senha. Baixe os dois relatórios da semana e largue em
`dados/`:

- **Google Ads** (ads.google.com): **Campanhas**, escolha o período no canto
  superior direito, e o ícone de **download** acima da tabela, em CSV. Para as
  palavras-chave e os termos de pesquisa, o mesmo download nas telas
  **Palavras-chave** e **Termos de pesquisa**.
- **Meta Ads** (o Gerenciador de Anúncios, em business.facebook.com): escolha o
  período, o nível (campanha, conjunto ou anúncio) e **Exportar**, em CSV.

Print da tela também serve: a skill transcreve, e diz no relatório que a fonte
foi um print.

## Workflow

### Passo 0 — Fixar a régua (uma vez por conta)

🚨 **Sem este passo, todo relatório cai calado na tabela geral** e classifica
SaaS B2B com a régua de delivery. Duas informações resolvem, e elas se guardam
pra nunca mais serem perguntadas.

Procurar nesta ordem, e **só perguntar o que não achar**:

| O quê | Onde procurar |
|---|---|
| **Nicho** | `_memoria/empresa.md`, ou `clientes/<nome>/briefing.md` |
| **Meta de CPA ou CPL** | `clientes/<nome>/briefing.md`, ou o relatório anterior em `<relatorios>` (a pasta do mesmo dono) |

Se faltar, perguntar as duas **de uma vez só**, curto:

> "Antes de classificar: qual o nicho e qual a meta de custo por lead ou por
> venda? Sem meta eu uso a faixa do nicho, e digo isso no relatório."

Gravar o que ficou definido no cabeçalho do relatório, num bloco fixo:

```markdown
**Régua desta conta:** nicho <nicho> · meta de CPA R$ <valor>
(fonte: <briefing do cliente | declarado pelo usuário em AAAA-MM-DD | tabela de nicho, sem meta declarada>)
```

⭐ **Assim o relatório seguinte lê a régua do anterior** e não repergunta. É a
mesma ponte que o Passo 2 já usa pra comparar semanas.

⚠️ **Relatório de cliente usa o contexto DELE**, nunca o `_memoria/` do workspace:
nicho, meta e tom vêm de `clientes/<nome>/`. Vale a mesma regra de `clientes/` no `CLAUDE.md`.

### Passo 1 — Ler os exports

**Google Ads:** colunas mínimas esperadas — Campanha, Grupo, Impressões, Cliques, CTR, CPC médio, Custo, Conversões, CPA, Conv. rate.

**Meta Ads:** colunas mínimas esperadas — Campanha, Conjunto, Impressões, Alcance, Cliques no link, CTR, CPM, Frequência, Custo, Resultados, Custo por resultado.

Se faltar coluna crítica (Conversões / Resultados), avisar o usuário e prosseguir apenas com os dados de tráfego.

### Passo 2 — Comparar com a semana anterior

Buscar em `<relatorios>` o relatório anterior **do mesmo dono** (o do cliente na pasta do cliente, o do negócio próprio em `marketing/`). Se existir, calcular variação semana vs semana:

- Investimento total
- Cliques / Impressões
- CTR (clique / impressão)
- CPC / CPM
- Conversões totais (Google + Meta)
- CPA (custo / conversão)
- Custo por canal

Se não existir, é a primeira leitura — sinalizar como baseline.

### Passo 3 — Resumo executivo (topo do relatório)

Uma página, leitura de 2 minutos. Estrutura:

```markdown
# Relatório de Ads — semana <DD/MM> a <DD/MM>

**Régua desta conta:** nicho <nicho> · meta de CPA R$ <valor>
(fonte: <briefing | declarado em AAAA-MM-DD | tabela de nicho, sem meta declarada>)

## Resumo executivo

**Investimento:** R$ X.XXX (▼/▲ Y% vs semana anterior)
**Conversões:** N (▼/▲ Y%)
**CPA médio:** R$ X.XX (▼/▲ Y%) · 🟢🔵🟡🔴 vs a régua

**Canais:**
- Google Ads: R$ X.XXX → N conversões (CPA R$ X.XX) 🟢🔵🟡🔴
- Meta Ads:   R$ X.XXX → N conversões (CPA R$ X.XX) 🟢🔵🟡🔴

**Headline da semana:** uma frase sobre o que mais importa (campanha com desempenho excepcional,
criativo de melhor performance, alerta de orçamento, queda inesperada).
```

⭐ **O emoji ao lado do número é o que faz a leitura de 2 minutos funcionar.**
Ele responde "isso é bom?" sem o dono precisar guardar de cabeça qual era a meta.
A faixa vem do [`benchmarks-br.md`](referencias/benchmarks-br.md).

⚠️ **Se a sazonalidade do mês alterou a expectativa, dizer na mesma linha.**
Exemplo: `CPA R$ 62 (▲ 18%) 🟡 — novembro infla o CPM em 30 a 50%, então o
patamar real está mais perto de estável`.

### Passo 4 — Detalhamento por canal

Para cada canal, listar:

**Top 3 campanhas/grupos por performance** (menor CPA, maior conv. rate)
**Bottom 3** (maior CPA, menor conv. rate) — sinalizar para pausar ou ajustar
**Top criativos** (Meta): impressões + CTR + custo por resultado
**Bottom criativos** (Meta): para substituir ou pausar
**Palavras-chave com mais custo e zero conversão** (Google) — virar negativas

### Passo 5 — Alertas automáticos

Varrer os dados e gerar alertas em vermelho/amarelo:

Duas famílias de alerta, e as duas precisam existir. **Alerta relativo** compara
com a semana anterior; **alerta absoluto** compara com o mercado, pela régua do
[`benchmarks-br.md`](referencias/benchmarks-br.md).

**Relativos (movimento):**

| Alerta | Critério |
|---|---|
| 🔴 CTR despencou | CTR caiu mais de 30% vs semana anterior |
| 🟡 CPC subindo | CPC médio subiu mais de 20% vs semana anterior |
| 🟡 Fadiga de criativo | CTR do criativo caiu mais de 20% em 14 dias |
| 🟢 Oportunidade | CTR ou conversão acima da média **e** orçamento limitado → considerar aumentar |

**Absolutos (patamar):**

| Alerta | Critério |
|---|---|
| 🔴 Queima de orçamento | gasto sem conversão acima de **2x o CPA meta** (ver abaixo) |
| 🔴 Regra 3x | CPA acima de 3x a meta → recomendar pausar |
| 🔴 Campanha travada | 0 impressão por 24h ou mais, com status ativo |
| 🔴 Frequência tóxica | prospecção acima de 5,0 **ou** retargeting acima de 12,0 |
| 🟡 Frequência alta | prospecção acima de 3,0 **ou** retargeting acima de 8,0 |
| 🟡 Métrica em ATENÇÃO | qualquer linha na faixa 🟡 da tabela do nicho |
| 🔴 Métrica em CRÍTICO | qualquer linha na faixa 🔴 da tabela do nicho |
| 🟡 Orçamento queimando cedo | mais de 80% do diário gasto antes das 15h |

⭐ **O limiar de queima de orçamento é relativo à meta, não um valor fixo.** Um
*"gastou mais de R$X"* com o X nunca definido é o mesmo que não ter alerta. A
cascata:

```
1. CPA meta declarado pelo cliente        → limiar = 2 × CPA meta
2. sem meta, nicho conhecido              → limiar = 2 × topo da faixa BOM do nicho
3. sem meta e sem nicho                   → limiar = R$ 80 (2 × R$ 40, topo do BOM geral)
```

**Em qualquer um dos três, dizer no relatório qual régua foi usada.** Alerta que
não declara a régua não dá pra contestar, e o dono precisa poder discordar do
número.

> 🚨 **Antes de abrir alerta, passar pelos dois filtros do
> [`quality-gates.md`](referencias/quality-gates.md):** a amostra dá pra julgar
> (mínimo de 100 cliques ou 1x CPA meta de gasto), e a sazonalidade do mês já foi
> considerada. CPA alto em novembro pode ser novembro, não a campanha.

### Passo 6 — Recomendações pra semana

Lista curta (3-5 itens) de ações concretas:

```markdown
## Para a próxima semana

1. **Pausar** Grupo "X" — gastou R$ 230 sem conversão em 7 dias
2. **Adicionar negativas:** [lista de termos que apareceram nos search terms e não convertem]
3. **Trocar criativo Meta** do conjunto "Y" — frequência 4.2, performance caindo
4. **Aumentar orçamento** da campanha "Z" — CPA R$ 12, abaixo do alvo
5. **Testar** novo RSA com headline "<sugestão baseada em concorrência atual>"
```

### Passo 7 — Salvar

```
<relatorios>/<YYYY-MM-DD>-relatorio.md
```

`<relatorios>` é `marketing/campanhas/relatorios/` no negócio próprio e <!-- caminho futuro: nasce no primeiro relatório -->
`clientes/<nome>/seo-ads/campanhas/relatorios/` em cliente (o commit, no cliente,
vai no repositório dele).

Frontmatter com:
```yaml
---
periodo_inicio: YYYY-MM-DD
periodo_fim: YYYY-MM-DD
investimento_total: 0000.00
conversoes_total: 0
cpa_medio: 00.00
canais: [google-ads, meta-ads]
---
```

Esse frontmatter facilita comparações futuras com scripts e a leitura de longo prazo.

### Passo 8 — Entrega

Mostrar o resumo executivo direto no chat (Passos 3 + 5 + 6) e apontar para o arquivo completo:

> "Relatório completo disponível em `<relatorios>/<data>-relatorio.md`. Deseja que o envio seja feito por email para o cliente?"

Se sim, chamar `/email-profissional` com o resumo executivo + link/anexo.

---

## Regras

- **Nunca inventar números.** Se o export estiver truncado ou ilegível, indicar "dados incompletos" e prosseguir apenas com o que estiver disponível.
- **Comparação é o que importa.** Número solto ("R$ 1.200 essa semana") não significa nada sem o comparativo.
- **Alertas em ordem.** Vermelho primeiro, amarelo depois, verde por último.
- **Recomendações concretas.** "Pausar Grupo X" > "Otimizar campanhas". Nome da campanha, valor, motivo.
- **Linguagem do dono.** Seguir `_memoria/escrita-publica.md`. CPM, CTR, CPA são aceitáveis se o dono já compreende esses termos; caso contrário, traduzir ("custo por mil pessoas que viram", "% de quem clicou", "quanto custou cada cliente").
- ⭐ **Frequência se lê separada por tipo.** Prospecção satura em 3,0 e fica tóxica em 5,0; retargeting só satura em 8,0 e fica tóxico em 12,0. Uma régua única de `1.5–3.0` pra tudo poria **todo retargeting saudável em alerta**, falso positivo que ensina o dono a ignorar a lista.
- ⭐ **A recomendação sai do degrau mais baixo que está quebrado**, na ordem `converte → é lucrativo → é escalável → é eficiente` ([quality-gates.md](referencias/quality-gates.md)). Recomendar melhorar CTR de campanha que não converte é trabalho bonito num negócio perdendo dinheiro.
- 🚨 **Amostra insuficiente é resultado, não lacuna.** Abaixo de 100 cliques ou de 1x o CPA meta em gasto, escrever "amostra insuficiente" e não classificar. Inventar diagnóstico em cima de 40 cliques é o erro que mais parece competência.
- **Declarar a régua.** Toda linha que diz "abaixo do esperado" precisa dizer esperado por quem: meta do cliente, tabela de nicho ou tabela geral.
- **Quando reportar perda:** não amenizar. "A campanha X queimou R$ 200 sem trazer venda" é mais útil que "a campanha X teve performance abaixo do esperado".
