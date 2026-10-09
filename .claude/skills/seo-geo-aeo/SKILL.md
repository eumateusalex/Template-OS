---
name: seo-geo-aeo
description: >
  Busca em duas fases: audita o site (nota 0-10 em SEO, GEO e AEO) e executa a
  estratégia em 8 passos, do Google Meu Negócio à presença em IAs, com a campanha
  do Google Ads em CSV (o módulo anuncio.md, também avulso). Use para seo, geo,
  aeo, auditar site, "por que meu site não aparece", palavras-chave, google meu
  negócio, campanha ou anúncio do Google Ads, ou URL pedindo diagnóstico de busca.
---

# /seo-geo-aeo — Auditoria + Estratégia (SEO · GEO · AEO)

> Funde duas frentes numa só, na ordem em que geram valor:
>
> 1. **FASE 1 — AUDITORIA** → tira um raio-X do site atual e dá nota (0-10) em
>    SEO, GEO e AEO. Diagnóstico honesto, baseado no que foi realmente lido.
> 2. **FASE 2 — ESTRATÉGIA** → usa os gaps da auditoria para construir e executar
>    o plano completo de crescimento (os 8 passos).
>
> A auditoria é o insumo da estratégia: primeiro se descobre o que está furado,
> depois se prioriza o conserto. Não se pula direto pro plano sem olhar o site.

<!-- ================================================================
     GLOSSÁRIO RÁPIDO — as três siglas
     SEO  = otimização para buscadores tradicionais (Google, Bing)
     GEO  = otimização para IAs generativas (ChatGPT, Gemini, Perplexity)
     AEO  = otimização para respostas diretas (snippets, "Perguntas
            frequentes", busca por voz)
     ================================================================ -->

---

## Passo 0 — De quem é esse SEO?

**Antes de qualquer coisa**, decidir o alvo:

- **É de um cliente?** (o usuário citou o nome, ou o site auditado é de um
  cliente em `clientes/` — pastas criadas pelo `/novo-cliente`) → tudo grava em
  `clientes/<nome>/seo-ads/`, e o contexto vem do `CLAUDE.md` + `briefing.md`
  **daquele cliente**, não de `_memoria/`. O tom das recomendações é o da marca dele.
- **É do próprio negócio?** (site próprio, perfis próprios) → grava em
  `marketing/seo/`, contexto de `_memoria/`, como sempre. <!-- caminho futuro: a skill grava em marketing/seo/ no primeiro uso -->

Na dúvida, perguntar antes de começar. Chamar o caminho escolhido de
`<base>` daqui pra frente — todos os outputs abaixo são relativos a ele.

---

## Dependências

- **Contexto do negócio:** `_memoria/empresa.md` — **ou**, se for cliente,
  `clientes/<nome>/CLAUDE.md` + `briefing.md`
- **Tom de voz:** `_memoria/escrita-publica.md` — **ou** o tom do cliente
- **Estratégia atual:** `_memoria/estrategia.md` (só quando for do próprio negócio)
- **Identidade visual** (só se gerar relatório visual):
  `identidade/design-guide.md` — **ou**, se for cliente,
  `clientes/<nome>/identidade-visual/`
- **Ferramentas:** WebSearch, WebFetch (nativos)
- ⭐ **Régua de página:** [`referencias/citability-score.md`](referencias/citability-score.md)
  — a página está pronta pra ser citada por uma IA?
- ⭐ **Régua de resultado:** [`referencias/varredura-ia.md`](referencias/varredura-ia.md)
  — a marca aparece quando perguntam? (de graça, no braço)
- **Todos os outputs vão em:** `<base>` — que é `marketing/seo/` (negócio próprio) <!-- caminho futuro: a skill grava em marketing/seo/ no primeiro uso -->
  ou `clientes/<nome>/seo-ads/` (cliente). Onde este documento diz
  `marketing/seo/`, ler como `<base>` <!-- caminho futuro: a skill grava em marketing/seo/ no primeiro uso -->

> **As três réguas desta skill não se misturam.** A nota 0 a 10 mede o **site**,
> o Citability Score mede a **página**, e a varredura mede o **resultado**. A
> primeira diz onde ele está; a segunda escolhe a próxima tarefa; a terceira é a
> única que prova que alguma coisa mudou lá fora.

---

## Como rodar

Três modos, escolhidos pelo que o usuário pedir:

| Comando | O que faz |
|---|---|
| `/seo-geo-aeo` | **Completo:** Fase 1 (auditoria) → Fase 2 (8 passos), em sequência |
| `/seo-geo-aeo auditar [url]` | **Só a Fase 1** — diagnóstico com nota, sem o plano |
| `/seo-geo-aeo passo 3` · `gmb` · `ads` · `geo` | **Só um passo** da Fase 2 |
| `/seo-geo-aeo campanha` | **Só a campanha do Google Ads em CSV**, pelo módulo [`anuncio.md`](anuncio.md), a partir do briefing |

Se o usuário mandar uma URL "seca" pedindo diagnóstico, tratar como `auditar`.
Se pedir só a campanha ("monta uma campanha no Google Ads", "CSV pro Google Ads",
"anúncio no Google"), ir direto ao [`anuncio.md`](anuncio.md): ele roda avulso e usa
a pesquisa da Fase 2 quando ela existir.
Se pedir "plano de seo" sem site pronto para auditar, pode começar direto na Fase 2
(a auditoria fica opcional e é registrada como pendência).

<!-- ================================================================================
     ██  FASE 1 — AUDITORIA  ██
     Diagnóstico do site ATUAL. Só o site do próprio negócio (concorrência é o
     Passo 2, na Fase 2). Nada é marcado como "faltando" sem ter sido verificado.
     ================================================================================ -->

# FASE 1 — AUDITORIA (diagnóstico do site atual)

## Passo 0 — Auditar SEO · GEO · AEO

**Objetivo:** medir o estado atual do site em três eixos, dar uma nota comparável
(0-10) em cada e listar os gaps que a Fase 2 vai atacar.

### 0.1 — Definir o escopo (perguntar antes de buscar)

Antes de buscar qualquer coisa, perguntar:

> "Quer uma **auditoria rápida** (principais problemas + notas — 1 a 2 min) ou uma
> **auditoria completa** (varredura de todas as páginas relevantes — 5 a 10 min)?"

Esperar a resposta. Só pular essa pergunta se o usuário já tiver dito qual quer
("faz uma auditoria completa de...", "auditoria rápida aí").

### 0.2 — Coletar os dados (nunca supor, sempre ler)

> **Princípio:** uma página só pode ser marcada como "faltando" depois de confirmar
> que ela realmente não existe. Não chutar. Ler primeiro.

**Homepage + descoberta da estrutura:**
1. `WebFetch` na URL informada. Prompt: "Retorne o HTML completo desta página,
   incluindo todas as meta tags, schema markup, estrutura de headings, elementos
   de link, menus de navegação e conteúdo do corpo."
2. Extrair da resposta o mapa do site: links de `<nav>`, header e footer; links
   internos. Montar a lista do que existe: Sobre, Equipe, Serviços, Cases/Portfólio,
   Blog, FAQ, Contato, etc.
3. Buscar em paralelo:
   - `{dominio}/robots.txt` — diretrizes de rastreamento + ponteiro do sitemap
   - `{dominio}/sitemap.xml` — confirma páginas que existem mesmo fora do menu

**Rastrear as páginas-chave** (com base no que foi descoberto):
- Sobre / Equipe (E-E-A-T, autoria, credenciais)
- Serviços / O que fazemos (profundidade, cobertura de keyword)
- Cases / Portfólio (prova social, sinais de confiança)
- Blog / Conteúdos (estratégia de conteúdo, potencial de AEO — pegar posts
  individuais, não só o índice)
- Contato (NAP: nome, endereço, telefone — sinais locais)
- FAQ (sinais de AEO)

- **Auditoria rápida:** homepage + até 6 páginas de alto sinal.
- **Auditoria completa:** rastrear todas as páginas relevantes, sem limite fixo.
  Pular só o que não agrega sinal: política de privacidade, termos de uso, login,
  páginas de "obrigado" e paginação de arquivo além da página 2.

**Se o site não carregar:** avisar o usuário, pedir para confirmar que a URL está
pública e oferecer uma auditoria de framework (recomendações gerais) enquanto o
acesso é resolvido. Se uma página secundária falhar, registrar e seguir com o resto.

### 0.3 — Analisar os sinais

Análise sobre o **site inteiro**, não só a home. Nunca marcar um tipo de conteúdo
como "faltando" se ele foi encontrado em outra página durante o rastreio.

<!-- ---------- EIXO 1: SEO ---------- -->
**SEO — busca tradicional:**

*Técnico / on-page:*
- **Title:** presente? 50-60 caracteres? keyword no início? duplicado no site?
- **Meta description:** presente? 150-160 caracteres? tem CTA?
- **Hierarquia de headings:** H1 único e presente? H2/H3 lógicos? sem stuffing?
- **URL:** limpa e legível? com keyword? sem excesso de parâmetros?
- **Canonical:** presente? auto-referente quando deve?
- **Robots meta:** indexável? algum noindex acidental?
- **Viewport / mobile:** meta presente?
- **Alt das imagens:** descritivo e com keyword?
- **Links internos:** presentes? âncora descritiva?
- **Open Graph / Twitter Card:** og:title, og:description, og:image?

*Qualidade de conteúdo:*
- **Volume:** conteúdo substancial (500+ palavras na maioria; 1500+ em pilar)?
- **Keyword:** tema principal claro? termos semânticos relacionados presentes?
- **Frescor:** data de publicação/atualização visível?
- **Legibilidade:** escaneável — subtítulos, parágrafos curtos, bullets?

*Dados estruturados:*
- **Schema:** algum JSON-LD/microdata? tipos detectados (Organization,
  LocalBusiness, Article, Product, FAQ, HowTo, BreadcrumbList)?
- **Validade:** o markup parece sintaticamente correto e completo?

<!-- ---------- EIXO 2: GEO ---------- -->
**GEO — IAs generativas (Perplexity, ChatGPT Search, AI Overviews, Gemini):**
Essas engines premiam clareza, autoridade e riqueza factual.

*E-E-A-T (Experiência, Expertise, Autoridade, Confiança):*
- **Autoria:** autores nomeados com credenciais visíveis?
- **Sobre:** o site explica quem toca, formação, qualificação?
- **Contato:** telefone, endereço, e-mail acessíveis?
- **Confiança:** depoimentos, prêmios, certificações, menções na imprensa?
- **Organization schema:** marca declarada com clareza (nome, logo, URL, redes)?

*Conteúdo para síntese por IA:*
- **Densidade factual:** há fatos, números, dados específicos que a IA possa citar?
- **Afirmação clara:** a proposta de valor aparece direta no topo?
- **Fontes:** o conteúdo cita referências externas confiáveis?
- **Cobertura:** o tema é respondido por completo ou deixa perguntas no ar?
- **Clareza de entidade:** a marca/pessoa/lugar é nomeada de forma consistente?
- **Originalidade:** há ponto de vista próprio, dado original, perspectiva única?

*GEO técnico:*
- **Profundidade de schema:** tipos ricos além do básico (Author, Dataset,
  ClaimReview, SpeakableSpecification)?
- **HTTPS:** site seguro?
- **Rastreabilidade:** sem bloqueio no robots.txt? sem depender só de JS que
  impeça crawlers de IA?
- **`sameAs` / grafo de entidade:** links para perfis sociais a partir do site?

<!-- ---------- EIXO 3: AEO ---------- -->
**AEO — respostas diretas (snippets, "Perguntas frequentes", voz):**
Onde o buscador/assistente precisa extrair UMA resposta direta.

*Elegibilidade a snippet:*
- **Parágrafo-resposta:** a pergunta-chave é respondida em 40-60 palavras logo
  abaixo de um heading em forma de pergunta?
- **Definição:** o tema é definido num "X é..." claro?
- **Listas:** passos numerados ou bullets que virariam list snippet?
- **Tabelas:** comparativos que virariam table snippet?

*Formatos estruturados de resposta:*
- **FAQ schema:** presente? perguntas e respostas bem estruturadas?
- **HowTo schema:** processos passo a passo marcados?
- **Headings em pergunta:** H2/H3 em linguagem natural ("Como funciona X?", "O que é Y?")?
- **Speakable schema:** trechos marcados para voz?

*Prontidão para voz:*
- **Linguagem conversacional:** frasear natural, como a pessoa fala?
- **Cauda longa:** cobre quem/o quê/quando/onde/por quê/como específicos?
- **Sinais locais** (se aplicável): NAP, schema local, menções de localização?

### 0.4 — Dar a nota (rubrica 0-10)

Nota por eixo (SEO, GEO, AEO):
- **1-3:** crítico — o site provavelmente está invisível ou penalizado
- **4-5:** abaixo da média — oportunidades grandes sendo perdidas
- **6-7:** base decente — melhorias pontuais necessárias
- **8-9:** forte — refinamentos menores
- **10:** exemplar — implementação modelo

Calibrar o tom ao achado: se o site está bem, dizer que está — não inventar
problema. Se está ruim, comunicar urgência sem alarmismo.

⭐ **Junto com a nota do site, pontuar as páginas que vendem** pela régua de
[`referencias/citability-score.md`](referencias/citability-score.md): home mais
as páginas de serviço ou produto, sete dimensões de 0, 7 ou 14 pontos, num
total de 0 a 100 por página.

A nota 0 a 10 diz ao dono **onde ele está**. O Citability Score é o que **escolhe
a próxima tarefa** e o que prova avanço na auditoria seguinte, porque é por
página e se move quando alguém mexe. Não somar as duas: elas medem coisas
diferentes, e a tabela de comparação está no fim daquele arquivo.

⚠️ **Não pontuar o site inteiro.** Só a home e as páginas que recebem cliente.
Pontuar tudo gasta a sessão e não muda decisão nenhuma.

**Ser honesto sobre o que NÃO dá para medir por HTML:** Core Web Vitals,
velocidade real, renderização mobile, conteúdo via JS, backlinks e autoridade de
domínio exigem ferramenta externa. Quando surgir, nomear a ferramenta (ex.: "para
Core Web Vitals, rode o PageSpeed Insights em pagespeed.web.dev") em vez de chutar.

### 0.5 — Entregar a auditoria

**No chat, resumo curto** (não despejar o relatório inteiro):

```
## 🔍 [Nome do site] — Auditoria [Rápida/Completa] SEO · GEO · AEO
Páginas analisadas: [contagem]   Data: [data]

| Eixo | Nota | Status |
|---|---|---|
| SEO | X/10 | [Precisa de trabalho / No caminho / Forte] |
| GEO | X/10 | [...] |
| AEO | X/10 | [...] |

Top 3 prioridades: [uma frase cada, específica]
Maior força: [uma frase]
```

**O relatório completo vai para `marketing/seo/00-auditoria.md`**, no modelo de <!-- caminho futuro: a skill grava em marketing/seo/ no primeiro uso -->
[`referencias/relatorio.md`](referencias/relatorio.md): as nove seções, a regra de
ouro e o relatório visual, quando o usuário pedir PDF ou imagem.

<!-- ================================================================================
     ██  FASE 2 — ESTRATÉGIA  ██
     Construção + execução. Cada passo CONSOME a auditoria (00-auditoria.md) e
     ataca os gaps por ordem de prioridade da matriz.
     ================================================================================ -->

# FASE 2 — ESTRATÉGIA (construção + execução)

> **Ponte auditoria → estratégia:** antes de começar, reler `marketing/seo/00-auditoria.md`. <!-- caminho futuro: a skill grava em marketing/seo/ no primeiro uso -->
> A matriz de prioridades da auditoria manda no que atacar primeiro. Se um gap
> crítico apareceu lá (ex.: sem schema, sem página de Serviços, GEO baixo), o passo
> correspondente aqui resolve esse gap primeiro. Se a auditoria não foi rodada,
> registrar como pendência e seguir com o que der.

## Passo 1 — DEMANDA: o que as pessoas buscam nesse nicho?

**Objetivo:** entender se existe demanda real e como as pessoas buscam.

1. Ler `_memoria/empresa.md`: produtos/serviços, região, público, diferenciais.
2. Gerar **30-50 termos-semente** com base em: categorias de produto/serviço;
   intenção (informacional, comercial, transacional); localização (cidade, região,
   estado); uso final / contexto do cliente.
3. Usar **WebSearch** por grupo de termos:
   - `"[termo] site:trends.google.com"` para sazonalidade
   - `"[termo]"` para observar orgânico, ads e maps
   - `"[termo] related searches"` para expandir a lista
4. Classificar cada termo por: **volume** (alto/médio/baixo/micro); **intenção**;
   **dificuldade** (quantos concorrentes fortes); **relevância** (direto/indireto/tangencial).

**Output:** `marketing/seo/01-pesquisa-demanda.md` — tabela classificada, top 10 <!-- caminho futuro: a skill grava este arquivo no passo -->
prioritários (volume + intenção transacional + baixa concorrência), termos sazonais,
termos descartados e por quê.

## Passo 2 — CONCORRÊNCIA: quem aparece nessas buscas?

**Objetivo:** mapear quem domina os resultados e onde estão os gaps.

1. Selecionar os **top 10 termos** do Passo 1.
2. Por termo, com **WebSearch**: top 5 orgânicos (quem são, que tipo de página);
   Maps/Local Pack (quem aparece, nº de avaliações, nota); Google Ads (alguém
   anuncia? qual a copy?).
3. Por concorrente relevante (5-8), com **WebFetch**: estrutura do site; meta
   titles/descriptions das principais; profundidade de conteúdo; schema markup;
   perfil de GMB (completo? fotos? posts? avaliações?).
4. Identificar **gaps** (o que ninguém faz bem), **oportunidades** (termos sem dono),
   **ameaças** (fortes demais para enfrentar de frente) e **benchmark** (padrão mínimo).

**Output:** `marketing/seo/02-analise-concorrencia.md` — tabela de concorrentes, <!-- caminho futuro: a skill grava este arquivo no passo -->
mapa de gaps/oportunidades, recomendação de onde atacar primeiro.

## Passo 3 — GMB: Google Meu Negócio (resultado mais rápido)

**Objetivo:** perfil completo do Google Business Profile para aparecer no Maps e
no Local Pack.

1. Pesquisar como está o perfil atual (buscar o nome da empresa no Google).
2. Montar o documento de tudo a preencher/otimizar:
   - **Básico:** nome (idêntico ao registrado); categoria principal + secundárias;
     endereço, telefone, site; horário; área de atendimento.
   - **Descrição:** 750 caracteres, keywords naturais, tom de `_memoria/escrita-publica.md`.
   - **Atributos e serviços:** serviços relevantes; atributos (entrega, atacado, etc.).
   - **Fotos:** checklist (fachada, interior, produtos, equipe, produção) + specs.
   - **Posts GMB:** 4 iniciais + calendário recorrente.
   - **Avaliações:** como pedir aos clientes atuais; template de resposta — usar
     `/responder-avaliacoes`.
   - **Citações/diretórios:** lista relevante ao nicho; NAP consistente em todas.

**Output:** `marketing/seo/03-google-meu-negocio.md` <!-- caminho futuro: a skill grava este arquivo no passo -->

## Passo 4 — ON-PAGE: otimizar o site (+ correções da auditoria)

**Objetivo:** cada página otimizada para as keywords certas — e os gaps técnicos da
auditoria (Fase 1) resolvidos aqui.

1. Ler a estrutura atual (se `site/` existir; senão, perguntar as páginas).
2. Por página:
   - **Mapa de keywords por página.**
   - **Meta tags:** title (50-60, keyword no início); description (150-160, com CTA);
     H1/H2/H3 sugeridos.
   - **Schema (JSON-LD):** LocalBusiness; Product; **FAQPage** e **HowTo** quando
     couber (isso ataca direto os gaps de AEO da auditoria).
   - **Correções da auditoria:** varrer os itens "Faltando/Atenção" do eixo SEO em
     `00-auditoria.md` e resolver um a um (canonical, alt, Open Graph, headings...).
   - **Checklist técnico:** URLs amigáveis; alt; velocidade; mobile; sitemap.xml,
     robots.txt, canonical, Open Graph.
   - **Links internos:** mapa sugerido.

**Output:** `marketing/seo/04-otimizacao-on-page.md` — tabela página → keyword → <!-- caminho futuro: a skill grava este arquivo no passo -->
title → description → H1; schema JSON-LD pronto para copiar; checklist com status.

## Passo 5 — CONTEÚDO: estratégia de autoridade

**Objetivo:** plano de conteúdo que posicione a empresa como referência.

Com base nos termos informacionais do Passo 1:
- **Evergreen:** 5-10 ideias que respondem dúvidas reais — título otimizado,
  keyword-alvo, estrutura de headings, tamanho estimado.
- **Cluster:** página pilar + satélites apontando para ela + internal linking.
- **Calendário editorial:** prioridade, frequência, formato (post, guia, FAQ, comparativo).
- **Conteúdo local:** páginas de área de atendimento (se fizer sentido).

> **Ponte com AEO:** cada peça já nasce pronta para snippet/voz — resposta direta
> nas primeiras linhas, heading em pergunta, dado concreto. Isso alimenta o Passo 8.

**Output:** `marketing/seo/05-estrategia-conteudo.md` <!-- caminho futuro: a skill grava este arquivo no passo -->

> Cada item dessa lista pode virar um carrossel com o `/carrossel`.

## Passo 6 — GOOGLE ADS: campanhas prontas para executar

**Objetivo:** campanhas baseadas nos dados reais da pesquisa.

1. **Objetivo:** leads (ligação, WhatsApp, formulário) / visitas / alcance local.
2. **Estrutura:**
   - **Search:** grupos por cluster de keyword; por grupo 10-15 keywords, negativas,
     3 RSAs, extensões; orçamento diário, estratégia de lance, geo.
   - **Local** (se aplicável): anúncios no Maps, proximidade.
   - **Display/Remarketing** (opcional): públicos, formatos.
3. **Copies:** tom de `_memoria/escrita-publica.md`; diferenciais concretos; CTAs
   específicos; 15 headlines, 4 descriptions.
4. **Landing page:** o site atual serve ou precisa de página específica?

**Output:** `marketing/seo/06-google-ads.md` — estrutura completa, keywords <!-- caminho futuro: a skill grava este arquivo no passo -->
organizadas, copies prontas, orçamento e configurações.

> O módulo `anuncio.md` consome esse arquivo e gera o CSV para importar no Google Ads
> Editor. Pedido avulso de campanha (sem a pesquisa de busca) vai direto para ele,
> a partir do briefing.

## Passo 7 — MONITORAMENTO: checklist recorrente

**Objetivo:** garantir que o trabalho continue dando resultado.

- **Semanal:** posição nos top 10 termos; responder avaliações no GMB; postar no
  GMB (1x/semana mínimo).
- **Mensal:** métricas de Google Ads (CTR, CPC, conversões, custo/lead) — usar
  `/relatorio-ads`; tráfego orgânico (Search Console); atualizar negativas; publicar
  1-2 conteúdos; verificar citações/diretórios; ⭐ **rodar a varredura de IA**
  ([`referencias/varredura-ia.md`](referencias/varredura-ia.md)) e acrescentar a
  rodada em `08-varredura-ia.md`.
- **Trimestral:** refazer concorrência (Passo 2 resumido); atualizar GMB;
  revisar conteúdo; avaliar novas keywords; **re-rodar a auditoria (Passo 0)** para
  medir a evolução das notas; ⭐ **repontuar o Citability Score** das páginas que
  foram mexidas no trimestre (só delas: página intocada tem a mesma nota).

**Output:** `marketing/seo/07-checklist-monitoramento.md` <!-- caminho futuro: a skill grava este arquivo no passo -->

## Passo 8 — GEO + AEO: aparecer nas IAs e nas respostas diretas

**Objetivo:** fazer as IAs generativas (ChatGPT, Gemini, Perplexity, Copilot) citarem
a empresa, e ganhar snippets/voz no Google.

**Por que importa:** cada vez mais gente pergunta a IAs "qual o melhor fornecedor de
X em Y?" — quem aparece capta lead qualificado sem pagar anúncio.

1. **Auditoria GEO/AEO (usa a Fase 1):** partir das notas GEO e AEO de
   `00-auditoria.md`. Complementar: WebSearch dos top 10 termos em engines de IA;
   verificar se a empresa (ou concorrentes) aparece; mapear quais fontes as IAs citam.
2. **Conteúdo para IA (GEO):** resposta direta nas primeiras linhas; dados concretos
   (números, certificações, endereços, fatos verificáveis); perguntas como H2/H3;
   nada de texto vago.
3. **Formatos de resposta (AEO):** FAQ real do nicho com **FAQPage schema**; processos
   passo a passo com **HowTo schema**; headings em pergunta; parágrafo-resposta de
   40-60 palavras; trechos de voz com **Speakable** quando fizer sentido.
4. **Citações externas:** diretórios, sites de avaliação, guest posts, menções em
   blogs do nicho, aparições em mídia (IAs pesam menção em fonte confiável).
5. **Dados estruturados reforçados:** LocalBusiness, FAQPage, HowTo, Product, Article.
6. ⭐ **Varredura de IA:** o método completo está em
   [`referencias/varredura-ia.md`](referencias/varredura-ia.md), e não se
   improvisa aqui. O resumo: 5 perguntas **de comprador** (nunca o nome da
   marca), fixas pra sempre, rodadas em 4 superfícies, em aba anônima, a cada 30
   dias, com o resultado numa tabela que registra **quem apareceu e qual fonte a
   IA citou**.

   🚨 **A coluna da fonte citada é a saída principal**, e é a que costuma ser
   esquecida: se a IA cita um diretório em vez de site próprio, a próxima tarefa
   é entrar naquele diretório, não mexer no site. É trabalho de uma tarde e move
   mais que um mês de schema.

   ⚠️ **De graça, no braço:** a regra de custo está em `referencias/varredura-ia.md`.

**Output:** `marketing/seo/08-geo-aeo.md` — auditoria, FAQ + schema JSON-LD, lista <!-- caminho futuro: a skill grava este arquivo no passo -->
de ações para aumentar citações.
**Output da varredura:** `marketing/seo/08-varredura-ia.md`, no formato daquele <!-- caminho futuro: a skill grava este arquivo no passo -->
arquivo. Ele é **cumulativo**: cada rodada vira uma seção nova, e as anteriores
não se apagam. Sem série histórica não existe "melhorou".

<!-- ================================================================================
     ORQUESTRAÇÃO + REGRAS
     ================================================================================ -->

---

## Execução

- **Modo completo (`/seo-geo-aeo`):** rodar a **Fase 1** inteira, apresentar o
  resumo da auditoria, e só então seguir para a **Fase 2** (Passos 1-8 em sequência),
  salvando cada output. Entre passos, mostrar um resumo antes de continuar.
- **Modo auditoria (`/seo-geo-aeo auditar`):** rodar só o Passo 0 e parar. Ao final,
  oferecer: "Quer que eu já estruture a estratégia com base nesses gaps?" (Fase 2).
- **Modo passo único (`/seo-geo-aeo passo N`):** rodar só o passo pedido.

Ao finalizar o completo, apresentar **resumo executivo:** top 5 oportunidades;
ações prioritárias; estimativa de investimento em ads; próximos passos.

---

## Regras

- **Auditoria antes de estratégia.** O plano se apoia no diagnóstico — não pular a
  Fase 1 quando houver site para auditar.
- **Nunca supor.** Marcar algo como "faltando" só depois de confirmar que não existe
  em nenhuma página lida. Se achou a página de Equipe em `/equipe`, avaliar a
  qualidade dela — não sugerir "criar equipe".
- **Toda pesquisa é real** (WebSearch/WebFetch). Nunca inventar volume, concorrência,
  CPC ou custo. Quando um dado não puder ser obtido, dizer que é estimativa e explicar
  a lógica.
- **Ser específico, não genérico.** Todo achado referencia algo realmente lido.
- ⭐ **Toda recomendação sai com a falsificabilidade junto.** Uma linha, no
  formato `· falha se: <o que a gente veria se isso não tivesse funcionado>`.
  Ela vale porque SEO demora, e sem dizer de antemão o que contaria como
  fracasso, três meses depois todo mundo declara vitória. Exemplos:

  | Recomendação | · falha se |
  |---|---|
  | publicar FAQ com `FAQPage` schema em /servicos/x | 60 dias e a página não ganhou impressão nova no Search Console para nenhuma pergunta da FAQ |
  | entrar no diretório que a IA cita | 2 rodadas de varredura e a IA continua citando só o diretório, sem nos listar |
  | reescrever a abertura da home com a resposta no topo | o Citability Score da dimensão 2 não sobe, ou sobe e o AI Overview segue citando o concorrente |

  🚨 **"Falha se: não melhorar o SEO" não é falsificabilidade.** Precisa nomear
  **o que se olha**, **onde** e **em quanto tempo**. Se não dá pra escrever isso,
  a recomendação ainda não está pronta pra virar tarefa.
- **Tom de voz:** copies e textos seguem `_memoria/escrita-publica.md` estritamente.
- **Português do Brasil**, como o público busca.
- **Schema em JSON-LD** (padrão Google).
- **Foco comercial/transacional** para negócios B2C/B2B locais.
- **Honestidade sobre limites:** Core Web Vitals, velocidade real, JS, backlinks e
  autoridade de domínio exigem ferramenta externa — nomear a ferramenta, não chutar.
