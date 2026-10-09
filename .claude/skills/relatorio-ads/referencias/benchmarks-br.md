# Benchmarks de tráfego pago — mercado brasileiro

Régua **absoluta** pra classificar métrica de anúncio: dado o número que veio do
export, ele está bom ou ruim **pro mercado**, não só pra semana passada.

---

## 🚨 De onde são estes números, e o que eles não são

**Nós não medimos nenhum deles.** São médias de mercado publicadas por
WordStream/LocaliQ (16 mil campanhas), MLabs, Reportei e RD Station, na
atualização de abril/2026.

Tratar como **ponto de partida, nunca como veredito**:

- ⭐ **A meta do cliente ganha do benchmark, sempre.** Se ele fecha negócio com
  CPL de R$ 60 e a tabela chama isso de ATENÇÃO, a tabela está errada pra ele.
  O benchmark serve pra quando **não existe** meta declarada
- ⚠️ **Nicho estreita mais que a tabela geral.** Um CPL de R$ 45 é crítico em
  delivery e excelente em SaaS B2B. Sempre descer pra tabela de nicho
- ⚠️ **Conferir a sazonalidade antes de alarmar.** CPA alto em novembro pode ser
  o normal de novembro
- 🚨 **Amostra pequena não classifica.** Ver "Mínimos estatísticos" no
  [quality-gates.md](quality-gates.md). Classificar criativo com 12 cliques é
  inventar diagnóstico

---

## Classificação

| Nível | Marca no relatório | Significado |
|---|---|---|
| EXCELENTE | 🟢 | acima do esperado, candidato a escalar |
| BOM | 🔵 | dentro do esperado, manter |
| ATENÇÃO | 🟡 | abaixo do esperado, entra na lista de ação |
| CRÍTICO | 🔴 | muito abaixo, ação na semana |

---

## Meta Ads

### Geral

| Métrica | 🔴 CRÍTICO | 🟡 ATENÇÃO | 🔵 BOM | 🟢 EXCELENTE |
|---|---|---|---|---|
| CTR (tráfego) | < 0,5% | 0,5 a 0,8% | 0,8 a 1,5% | > 1,5% |
| CTR (leads) | < 1,0% | 1,0 a 2,0% | 2,0 a 3,5% | > 3,5% |
| CTR (vendas) | < 0,8% | 0,8 a 1,5% | 1,5 a 2,5% | > 2,5% |
| CPC (tráfego) | > R$ 3,00 | R$ 1,50 a 3,00 | R$ 0,50 a 1,50 | < R$ 0,50 |
| CPC (leads) | > R$ 8,00 | R$ 4,00 a 8,00 | R$ 1,50 a 4,00 | < R$ 1,50 |
| CPM | > R$ 50,00 | R$ 25,00 a 50,00 | R$ 8,00 a 25,00 | < R$ 8,00 |
| CPL geral | > R$ 80,00 | R$ 40,00 a 80,00 | R$ 15,00 a 40,00 | < R$ 15,00 |
| Taxa de conversão (leads) | < 3% | 3 a 5% | 5 a 10% | > 10% |
| ROAS (e-commerce) | < 1,5 | 1,5 a 2,5 | 2,5 a 4,0 | > 4,0 |
| ROAS (retargeting) | < 2,0 | 2,0 a 3,5 | 3,5 a 5,0 | > 5,0 |

### Frequência

| Tipo | 🟡 ATENÇÃO | 🔴 CRÍTICO |
|---|---|---|
| Prospecção | > 3,0 | > 5,0 |
| Retargeting | > 8,0 | > 12,0 |

> ⚠️ Uma régua única (`freq > 3.0` para tudo) mistura prospecção e
> retargeting. Retargeting com frequência 4 é normal; prospecção
> com 4 é público queimado. **Separar os dois antes de alarmar.**

### Fadiga de criativo

| Sinal | Limiar |
|---|---|
| Queda de CTR em 14 dias | > 20% quer dizer criativo cansado |
| Vida útil média de criativo de topo | 3 a 4 semanas |

---

## Google Ads (Search)

| Métrica | 🔴 CRÍTICO | 🟡 ATENÇÃO | 🔵 BOM | 🟢 EXCELENTE |
|---|---|---|---|---|
| CTR | < 2,0% | 2,0 a 3,5% | 3,5 a 5,0% | > 5,0% |
| CPC | > R$ 10,00 | R$ 5,00 a 10,00 | R$ 1,50 a 5,00 | < R$ 1,50 |
| CPA | > R$ 150,00 | R$ 80,00 a 150,00 | R$ 30,00 a 80,00 | < R$ 30,00 |
| Taxa de conversão | < 2% | 2 a 3,5% | 3,5 a 5,0% | > 5,0% |
| Índice de qualidade | < 4 | 4 a 5 | 6 a 7 | >= 8 |
| Parcela de impressões | < 20% | 20 a 40% | 40 a 70% | > 70% |

### Por tipo de campanha

| Tipo | CTR esperado | CPA esperado | ROAS esperado |
|---|---|---|---|
| Search de marca | > 8% | < R$ 15 | > 8,0 |
| Search genérica | 3 a 5% | R$ 30 a 80 | 2,0 a 4,0 |
| Performance Max | 1 a 3% | varia | 2,0 a 5,0 |
| Display | 0,3 a 0,8% | R$ 50 a 150 | 0,5 a 2,0 |
| YouTube | 2 a 5% de VTR | R$ 0,05 a 0,15 por view | não se aplica |

> 🚨 **Search de marca infla a conta inteira.** CTR de 8% e CPA de R$ 12 na
> campanha de marca não são mérito da gestão: é gente que já ia comprar. Separar
> marca de genérica antes de tirar média, ou o relatório mente pra bem.

---

## Landing page (GA4)

| Métrica | 🔴 CRÍTICO | 🟡 ATENÇÃO | 🔵 BOM | 🟢 EXCELENTE |
|---|---|---|---|---|
| Rejeição (página de anúncio) | > 80% | 60 a 80% | 40 a 60% | < 40% |
| Tempo médio na página | < 15s | 15 a 30s | 30 a 60s | > 60s |
| Conversão (sessão para lead) | < 1% | 1 a 3% | 3 a 5% | > 5% |
| Páginas por sessão | < 1,2 | 1,2 a 1,5 | 1,5 a 2,5 | > 2,5 |

---

## Por nicho (Meta Ads)

⭐ **Esta é a tabela que decide.** A geral serve quando o nicho não está aqui.

| Nicho | CPL médio | CTR médio | CPC médio |
|---|---|---|---|
| E-commerce (moda) | R$ 8 a 15 | 1,2 a 1,8% | R$ 0,60 a 1,20 |
| E-commerce (tech) | R$ 15 a 30 | 0,8 a 1,5% | R$ 1,00 a 2,50 |
| Infoproduto | R$ 5 a 15 | 1,5 a 3,0% | R$ 0,40 a 1,00 |
| SaaS B2B | R$ 50 a 150 | 0,5 a 1,2% | R$ 3,00 a 8,00 |
| Serviço local | R$ 15 a 40 | 1,0 a 2,0% | R$ 1,00 a 3,00 |
| Imóveis | R$ 30 a 80 | 0,6 a 1,2% | R$ 2,00 a 5,00 |
| Saúde e estética | R$ 10 a 30 | 1,0 a 2,0% | R$ 0,80 a 2,00 |
| Educação | R$ 8 a 25 | 1,2 a 2,5% | R$ 0,50 a 1,50 |
| Financeiro | R$ 40 a 120 | 0,5 a 1,0% | R$ 3,00 a 10,00 |
| Alimentação e delivery | R$ 5 a 15 | 1,5 a 2,5% | R$ 0,40 a 1,00 |

> **Serviço local** é onde cai o negócio com agenda, inclusive o que tem mais
> de uma unidade.

---

## Sazonalidade brasileira

| Período | Efeito no CPM e CPC | Motivo |
|---|---|---|
| Janeiro | -20 a -30% | menor competição |
| Fevereiro (Carnaval) | -15% | menor investimento |
| Março e abril | estável | retomada |
| Maio (Dia das Mães) | +15 a +25% | pico de e-commerce |
| Junho (Namorados) | +10 a +20% | pico de e-commerce |
| Julho | estável | meio do ano |
| Agosto (Dia dos Pais) | +10 a +15% | pico moderado |
| Setembro e outubro | +5 a +10% | pré Black Friday |
| Novembro (Black Friday) | +30 a +50% | maior pico do ano |
| Dezembro (Natal) | +20 a +35% | segundo maior pico |

🚨 **Aplicar a sazonalidade ANTES de classificar.** Um CPA 30% acima da meta em
novembro pode ser desempenho estável com custo de mídia inflado, e recomendar
"pausar" ali destrói uma campanha que estava certa. Dizer no relatório qual
ajuste foi considerado.

---

## Como usar no relatório

1. Descobrir o **nicho** e a **meta de CPA ou CPL** do cliente. Sem meta, usar a
   tabela de nicho; sem nicho, a geral, e **dizer no relatório qual régua foi
   usada**
2. Conferir se a amostra dá pra julgar (mínimos no [quality-gates.md](quality-gates.md))
3. Ajustar a expectativa pela sazonalidade do mês
4. Classificar cada métrica e marcar com o emoji da faixa
5. Só então abrir alerta

> ⚠️ **Métrica classificada sem régua declarada não vale.** Toda linha do
> relatório que diz "abaixo do esperado" precisa dizer *esperado por quem*: meta
> do cliente, tabela de nicho ou tabela geral.
