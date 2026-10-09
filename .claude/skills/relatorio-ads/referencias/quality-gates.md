# Quality gates — regras de decisão em tráfego pago

O [benchmarks-br.md](benchmarks-br.md) diz se o número está bom. Este arquivo diz
**o que fazer com ele**, e em que ordem.

---

## A ordem, e ela não se inverte

```
1. Converte?      a campanha gera conversão?
2. É lucrativo?   o CPA ou o ROAS está dentro da meta?
3. É escalável?   tem margem pra crescer (parcela de impressão, orçamento)?
4. É eficiente?   CTR, índice de qualidade e desperdício estão bons?
```

🚨 **Nunca recomendar eficiência (4) antes de resolver lucratividade (2).**
Melhorar o índice de qualidade de uma campanha que não converte é trabalho
bonito num negócio que continua perdendo dinheiro. A recomendação da semana sai
do degrau mais baixo que ainda está quebrado.

---

## Regras de parar

| Regra | Condição | Ação |
|---|---|---|
| **3x** | CPA acima de 3x a meta | pausar |
| **Zero conversão** | gastou mais de 2x o CPA meta sem nenhuma conversão | pausar e revisar |
| **Campanha travada** | 0 impressão por 24h ou mais, com status ativo | investigar orçamento, lance ou reprovação |
| **Frequência tóxica** | prospecção acima de 5,0 ou retargeting acima de 12,0 | pausar ou renovar criativo |
| **CTR morto** | CTR abaixo da metade do benchmark do nicho por 7 dias ou mais | trocar criativo |
| **Orçamento queimando** | mais de 80% do orçamento diário gasto antes das 15h | revisar programação por horário |

⭐ **É daqui que sai o limiar de "queima de orçamento".** Uma régua do tipo
*"gastou mais de R$X com 0 conversões"*, com o X sem definição, é o mesmo que
não ter régua. O limiar certo é **relativo à meta do cliente**, não um valor
fixo:

```
gasto sem conversão > 2 × (CPA meta)          → 🔴 alerta
sem CPA meta declarado: usar o topo da faixa BOM do nicho no benchmarks-br.md
sem nicho identificado: usar CPL R$ 40 (topo do BOM geral) e DIZER isso no relatório
```

---

## Regras de escalar

| Regra | Condição | Ação |
|---|---|---|
| **Escalar devagar** | CPA na meta por 7 dias seguidos | subir orçamento 20 a 30% |
| **Nunca dobrar** | qualquer aumento acima de 30% de uma vez | sai da fase de aprendizado e joga fora o histórico |
| **Fase de aprendizado** | Meta: 50 conversões por semana por conjunto | não editar durante |
| **Duplicar vencedor** | criativo com CTR acima de 2x a média por 7 dias | duplicar em conjunto novo |
| **Ampliar público** | ROAS acima de 2x a meta por 14 dias | testar público mais amplo |

---

## Diagnóstico por sintoma

⭐ **Esta é a tabela que transforma número em recomendação.** O relatório não
serve pra dizer que o CPA subiu: serve pra dizer por quê e o que fazer.

### Meta Ads

| Sintoma | Diagnóstico | Ação |
|---|---|---|
| CPA alto + CTR bom | a página não converte | revisar velocidade, copy e formulário |
| CPA alto + CTR baixo | o criativo não engaja | trocar criativo, testar ângulo novo |
| CPA alto + frequência alta | público saturado | ampliar público ou pausar |
| CPM alto + público pequeno | audiência estreita demais | ampliar segmentação |
| CPM alto + público grande | competição ou sazonalidade | conferir o mês antes de agir |
| Muito clique, pouca conversão | anúncio e página falam coisas diferentes | alinhar a mensagem |
| ROAS caindo devagar | fadiga de criativo ou de público | renovar criativo |

### Google Ads

| Sintoma | Diagnóstico | Ação |
|---|---|---|
| Índice < 5 + CTR baixo | anúncio pouco relevante | reescrever títulos com a keyword principal |
| Índice < 5 + página ruim | página lenta ou irrelevante | otimizar velocidade e relevância |
| Termos de busca irrelevantes | faltam negativas | adicionar negativa exata ou de frase |
| CPA alto em correspondência ampla | ampla sem lance inteligente | 🚨 **nunca usar ampla sem lance inteligente** |
| Parcela de impressão < 20% | orçamento ou lance baixo | subir orçamento ou melhorar o índice |
| Muita conversão na campanha de marca | canibalizando o orgânico | reduzir lance em marca, investir em genérica |

---

## Regras de orçamento

| Regra | Onde | Detalhe |
|---|---|---|
| **Mínimo Meta** | Meta Ads | orçamento diário de pelo menos 5x o CPA meta por conjunto |
| **Mínimo Google** | Google Ads | orçamento diário de pelo menos 10x o CPC médio por campanha |
| **70/20/10** | as duas | 70% no que funciona, 20% escalando, 10% em teste |
| **Teto de teste** | as duas | não gastar mais que 2x o CPA meta testando um criativo |
| **Realocar antes de pedir** | as duas | tirar de campanha ruim antes de pedir verba nova |

---

## Mínimos estatísticos

🚨 **Não classificar nem recomendar sem dado suficiente.** É o erro que mais
parece competência: gráfico bonito em cima de 40 cliques.

| Gasto no mês | Até onde dá pra decidir |
|---|---|
| até R$ 1.000 | só decisão grossa: pausar ou ativar campanha |
| R$ 1.000 a 5.000 | decisão por campanha |
| R$ 5.000 a 25.000 | decisão por conjunto e por criativo |
| acima de R$ 25.000 | decisão granular: horário, dispositivo, posicionamento |

**Piso pra julgar um criativo ou público:** pelo menos 100 cliques **ou** gasto
de 1x o CPA meta. Abaixo disso, o relatório escreve *"amostra insuficiente"* e
não classifica. Dizer que não dá pra saber é resultado; inventar não é.

---

## O que ficou de fora, e por quê

⚠️ **Uma nota única de saúde da conta (0 a 100, letra A a F) fica de fora.** A
fórmula dela pesa o resultado de uma bateria de checagens de auditoria de conta
(pixel, deduplicação, estrutura de conjunto, extensões) que só existe com acesso
de API à conta. O `/relatorio-ads` lê CSV exportado, e não enxerga nada disso.

Trazer a nota sem as checagens produziria um número inventado com cara de
medição, que é exatamente o defeito que esta skill evita. **Quando existir
acesso de API, a nota de saúde volta pra mesa.**
