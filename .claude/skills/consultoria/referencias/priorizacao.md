# A priorização

A metodologia considera problemas, oportunidades, impacto, complexidade,
esforço, investimento, dependências, viabilidade e indicadores, e recomenda
também melhorias que não dependem de IA.

## Antes de pontuar

**Eliminatórios** (o item sai ou espera): o cliente não tem o tempo, o dado ou
a permissão; há risco legal ou de LGPD; depende de um terceiro (agência,
gestor) sem acordo. Melhorar o fornecedor, nunca trocar.

**Entram direto, sem nota:**
- o trilho A ("o cliente resolve sozinho"), que é o presente da devolutiva;
- **instalar a medição**, pré-requisito de todo item sem linha de base.

## A fórmula

**Prioridade = (I × C × V) ÷ E**

| Nota | Escala | O que cada ponto exige |
|---|---|---|
| **I · Impacto** (1 a 5) | a fatia do custo mensal da dor, construído na pergunta de implicação ("quanto isso te custa por mês?"), em R$ ou em horas | 1: menos de 5%; 2: de 5% a 15%; 3: de 15% a 30%; 4: de 30% a 50%; 5: mais de 50%. **Sem a conta à mostra, I fica em no máximo 2** |
| **C · Confiança** (1 a 5) | o **menor** entre a confiança de que o problema existe e a de que ele tem esse tamanho | 1: hipótese sem sinal; 2: hipótese com sinal público indireto; 3: DECLARADO; 4: MEDIDO numa fonte; 5: MEDIDO em duas fontes ou duas rodadas |
| **V · Velocidade de prova** (1 a 3) | quanto tempo até o indicador mexer e ser lido | 3: até 30 dias; 2: de 31 a 90; 1: mais de 90, ou sem como medir |
| **E · Esforço** (1 a 5) | horas totais (suas e do cliente) e o investimento de terceiro | 1: até 4 h e R$ 0; 2: até 12 h; 3: até 24 h; 4: até 40 h ou custo recorrente de terceiro; 5: mais de 40 h |

**Depois de pontuar:**
1. a dependência reordena: o item bloqueado vai para depois de quem o bloqueia;
2. a onda tem no máximo três itens, e cabe nas horas do mês;
3. pelo menos um item com V = 3, porque o cliente precisa ver algo mexer no primeiro mês.

## Exemplo, com três itens de uma clínica fictícia

| Item | I | C | V | E | Nota | Por quê |
|---|---|---|---|---|---|---|
| páginas de bairro redirecionando para outra clínica | 3 | 2 | 3 | 1 | **18** | medido em duas rodadas; o tamanho do tráfego perdido só se mede com o Search Console |
| medir o envio do formulário de orçamento | — | — | — | — | **entra direto** | é instalar a medição (o formulário não carrega tag nenhuma, medido): pré-requisito, e não se pontua |
| rascunho de orçamento por IA | 3 | 2 | 2 | 4 | **3** | "orçamento à mão" é inferido; sobe para 4,5 com o DECLARADO na entrevista |

A IA não passa na frente sem evidência: é o que a fórmula faz.

## Os cinco trilhos

| Trilho | O que é | Onde vira trabalho |
|---|---|---|
| **A · Resolve sozinho** | conserto sem IA que o cliente faz | lista na devolutiva, sem ficha |
| **B · O seu serviço** | o que você vende como serviço (site, SEO, Perfil da Empresa, anúncios, conteúdo) | `oportunidades/NN.md` |
| **C · Implantação de produto** | o software ou sistema que você implanta (CRM, funil, agente de atendimento) | `oportunidades/NN.md` com a ficha de implantação (os passos do onboarding do produto) |
| **D · Processo sem IA** | roteiro, modelo de orçamento, rotina | `oportunidades/NN.md` |
| **E · Educação** | treinar o dono ou o time | `oportunidades/NN.md`, quando houver time |
