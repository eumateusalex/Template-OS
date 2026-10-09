# /seo-geo-aeo · a campanha do Google Ads

Este módulo monta a campanha inteira em um CSV pronto para importação no Google Ads Editor. O processo vai do briefing diretamente ao CSV, sem a necessidade de montar cada grupo manualmente na interface do Google.

Roda de dois jeitos: **avulso**, quando o pedido é só a campanha ("monta uma
campanha no Google Ads", "CSV pro Google Ads"), a partir do briefing; ou **depois
do passo 6** da Fase 2, consumindo a pesquisa que a skill já gravou.

## Dependências

- **Contexto do negócio:** `_memoria/empresa.md` (produto/serviço, público, região, diferenciais) — **ou**, se for cliente, o `CLAUDE.md` e o `briefing.md` dele
- **Tom de voz:** `_memoria/escrita-publica.md` — **ou** o tom do cliente
- **Pesquisa SEO (se existir):** `<base>/01-pesquisa-demanda.md`, `<base>/06-google-ads.md` — usar como insumo. O `<base>` é o do passo 0 do `SKILL.md`: `marketing/seo/` no negócio próprio, `clientes/<nome>/seo-ads/` em cliente <!-- caminho futuro: a skill grava em marketing/seo/ no primeiro uso -->
- **Outputs vão em:** `<campanhas>/google-ads-<YYYY-MM-DD>/`, onde `<campanhas>` é `marketing/campanhas/` no negócio próprio (a mesma pasta que o `/relatorio-ads` lê) e `clientes/<nome>/seo-ads/campanhas/` em cliente <!-- caminho futuro: nasce na primeira campanha -->

---

## Workflow

### Passo 1 — Briefing

Se o usuário não informou o briefing, perguntar:

1. **Produto/serviço a anunciar?** (1-3 linhas)
2. **Quem é o público?** (perfil, dor que resolve)
3. **Região:** raio em km a partir de qual cidade?
4. **Orçamento diário?** (R$/dia)
5. **Objetivo:** ligações / WhatsApp / formulário / visita?
6. **Site/landing page** existe? URL?

Se já existe `<base>/06-google-ads.md` (o passo 6 da Fase 2 do `SKILL.md`), usar como base — pular as perguntas que já foram respondidas lá.

### Passo 2 — Pesquisa de palavras-chave

Se já existe `<base>/01-pesquisa-demanda.md`, usar o top 10-20 de termos prioritários (intenção transacional + comercial).

Se não existe, gerar:
- 30-50 termos-semente baseados no briefing
- WebSearch para cada grupo: ver concorrência, sazonalidade
- Filtrar pelos de **intenção comercial/transacional** (descartar informacionais)
- Agrupar em **clusters** (ex: "feijoada-buffet", "feijoada-restaurante", "feijoada-evento")

### Passo 3 — Estrutura de campanha

**Padrão recomendado para B2B local:**

```
Campanha 1: <Negócio> — Search Geral
├── Grupo: <Cluster 1>
│   ├── 10-15 keywords (mix de exata e frase — ver o aviso abaixo)
│   ├── 3 RSAs (15 headlines + 4 descriptions cada)
│   └── 10-15 keywords negativas no grupo
├── Grupo: <Cluster 2>
│   └── ...
└── ... (1 grupo por cluster do Passo 2)

Campanha 2: <Negócio> — Local (opcional)
├── Anúncios para Google Maps
└── Segmentação por proximidade

Lista de negativas globais: termos genéricos descartados, marcas concorrentes
```

> 🚨 **"Ampla modificada" NÃO EXISTE MAIS, e pedir isso quebra a importação.**
> O Google incorporou o comportamento dela na correspondência de frase em
> fevereiro de 2021 e, **desde julho de 2021, não é possível criar keyword nessa
> notação** ([documentação oficial](https://support.google.com/google-ads/answer/10286719)).
> Um CSV com `+termo +assim` sobe como frase ou é recusado, e a estrutura que se
> planejou não é a que entra no ar.
>
> **O que usar no lugar:** frase (`"termo assim"`) faz hoje o que a ampla
> modificada fazia. Exata (`[termo assim]`) para os termos premium. Ampla, só sob
> a regra da seção "Regras" no fim deste arquivo.
>
### Passo 4 — Copies (RSAs)

Para cada grupo, gerar 3 RSAs (Responsive Search Ads):

**15 headlines** por anúncio:
- 5 com keyword principal
- 3 com diferenciais concretos (certificações, prazo, garantia)
- 3 com CTA ("Solicite cotação", "Peça pelo WhatsApp", "Fale agora")
- 2 com prova social (anos no mercado, número de clientes)
- 2 com proposta de valor genérica

**4 descriptions** (90 caracteres cada):
- 1 institucional + CTA
- 1 com diferencial técnico + CTA
- 1 com urgência/escassez (se aplicável)
- 1 com prova social + CTA

**Restrições do Google:**
- Headline: 30 caracteres
- Description: 90 caracteres
- Sem emojis, sem caps lock, sem repetição de palavras
- Sem afirmações superlativas não-comprovadas ("o melhor", "número 1") sem fonte

Seguir `_memoria/escrita-publica.md` quanto ao tom.

### Passo 5 — Extensões

Gerar CSVs separados para cada tipo de extensão:

- **Sitelinks** (4-6): "Sobre nós", "Catálogo", "Cases", "WhatsApp", "Localização"
- **Chamadas** (telefone): puxar de `_memoria/empresa.md`
- **Snippets estruturados:** lista de serviços, categorias de produto
- **Preço** (se aplicável): faixas de preço dos serviços principais
- **Promoção** (se aplicável): desconto, condição especial

### Passo 6 — Configurações da campanha

Gerar arquivo `configuracoes.md` com:

- ⭐ **Estratégia de lance: escolher pelo VOLUME DE CONVERSÃO que a conta já tem**,
  nunca por ser o começo da campanha:

  | Conversões por mês | Estratégia |
  |---|---|
  | menos de 30 | **Maximizar cliques, com teto de CPC** |
  | 30 a 50 | Maximizar conversões |
  | mais de 50 | CPA desejado ou ROAS desejado |
  | campanha de marca | CPC manual, pra controlar custo |

  🚨 **Conta nova entra em "Maximizar cliques com teto", não em "Maximizar
  conversões".** Lance inteligente sem histórico de conversão não tem o que
  otimizar. Ele gasta o orçamento aprendendo, e o cliente paga a aula. O teto
  de CPC impede a conta nova de queimar verba no primeiro dia.

- ⭐ **Orçamento diário: no mínimo 10x o CPC médio esperado da campanha.**
  Abaixo disso a campanha não junta clique suficiente por dia pra sair do lugar,
  e o relatório da semana seguinte não tem amostra pra julgar nada. Se o
  orçamento do briefing ficar abaixo desse piso, **dizer isso ao cliente com o
  número na mão** em vez de montar uma campanha que já nasce sem chance.
- **Segmentação geográfica:** raio em km a partir do endereço
- **Idioma:** Português
- **Dispositivos:** ajustes de lance recomendados (mobile +0%, desktop +0%, tablet -20%)
- **Programação:** dias e horários conforme negócio
- **Conversões a configurar:** clique no WhatsApp, envio de formulário, ligação telefônica, tempo no site

### Passo 7 — Gerar os CSVs

Estrutura de pastas final:

```
<campanhas>/google-ads-<YYYY-MM-DD>/
  campanhas.csv          ← linha por campanha
  grupos.csv             ← linha por grupo de anúncio
  keywords.csv           ← keywords + match type
  keywords-negativas.csv ← negativas por grupo + lista global
  anuncios.csv           ← RSAs (headlines + descriptions)
  extensoes-sitelinks.csv
  extensoes-chamadas.csv
  extensoes-snippets.csv
  extensoes-preco.csv (se aplicável)
  configuracoes.md       ← config + checklist de import
  README.md              ← passo a passo para importar no Google Ads Editor
```

**Formato dos CSVs:** seguir o padrão de importação do Google Ads Editor (colunas: Campaign, Ad group, Keyword, Match type, Status, Max CPC, etc.).

### Passo 8 — Resumo + próximos passos

Apresentar ao usuário:

```
✓ Campanha pronta: <campanhas>/google-ads-<YYYY-MM-DD>/

Estrutura:
- <N> campanhas
- <N> grupos de anúncio
- <N> palavras-chave (positivas)
- <N> palavras-chave negativas
- <N> RSAs

Para importar:
1. Abrir Google Ads Editor (desktop)
2. Conta → Importar → CSV
3. Subir campanhas.csv primeiro, depois grupos, keywords, anúncios, extensões
4. Revisar status (tudo "pausado" inicialmente — ativar manualmente)
5. Conferir conversões configuradas no Google Tag Manager
6. Ativar campanha quando estiver tudo OK

Sugestão de orçamento inicial: R$<X>/dia (mínimo 10x o CPC médio esperado)
durante <Y> dias, ou até somar 100 cliques por grupo — o que vier primeiro.
Antes disso não há amostra pra avaliar nada.
```

---

## Regras

- **Nunca inventar dados de CPC.** Se o cliente perguntar quanto vai custar, informar que depende da concorrência real e apresentar uma faixa baseada em WebSearch.
- **Sempre começar pausado.** O cliente revisa e ativa mediante aprovação.
- **Não anunciar para termos informacionais.** "Como fazer X" raramente converte — deixar para o SEO orgânico.
- **Match type:** começar com Phrase Match na maioria dos casos. Exact para termos premium.
  🚨 **Broad NUNCA sem lance inteligente.** Ampla com lance manual ou com "maximizar
  cliques" é o jeito mais rápido de gastar verba em busca irrelevante: sem sinal de
  conversão, o Google amplia sem critério. Ampla só entra depois que a conta passa de
  50 conversões por mês e já roda CPA desejado.
- **Lista de negativas global** é obrigatória — sem ela, o orçamento é desperdiçado em buscas irrelevantes.
- **Conversões antes de tudo.** Sem conversão configurada, o Google não otimiza — relatar essa condição e solicitar a configuração antes da ativação.
- Copies seguem `_memoria/escrita-publica.md` estritamente. Sem jargão de marketing, caso o público não o utilize.
