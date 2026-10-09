# O relatório da auditoria

O modelo do relatório completo do passo 0.5 da `/seo-geo-aeo`. O resumo curto
que vai no chat mora na skill.

O relatório completo vai para `<base>/00-auditoria.md` (o `<base>` é o do passo 0 da skill), com esta estrutura:

1. **Resumo executivo** — 3 a 5 frases sobre a posição geral do site: o que é
   forte, o problema mais urgente, a maior oportunidade. Específico deste site.
2. **Tabela de notas** — SEO / GEO / AEO / Combinado (X/30), com o principal
   aprendizado de cada eixo.
3. **Páginas auditadas** — URL · tipo · observação (ex.: "sem H1", "schema rico").
3b. ⭐ **Citability Score** — a tabela de
   [`citability-score.md`](citability-score.md): home e
   páginas que vendem, sete dimensões, média do site. A coluna **"maior buraco"**
   é o que alimenta a matriz de prioridades do item 7.
4. **Análise SEO** — subseções Técnico/On-page, Qualidade de conteúdo, Dados
   estruturados. Cada achado como linha: Sinal · Achado · Status (Bom / Atenção / Faltando).
5. **Análise GEO** — subseções E-E-A-T, Conteúdo para IA, GEO técnico.
6. **Análise AEO** — subseções Snippet, Formatos de resposta, Voz.
7. **Matriz de prioridades** — Prioridade · Problema · Eixo · Esforço · Impacto ·
   ⭐ **falha se**. Prioridade em 🔴 Crítico / 🟠 Alto / 🟡 Médio / 🟢 Ganho rápido.
   A coluna "falha se" é obrigatória e segue a régua da seção "Regras": nomear o
   que se olha, onde e em quanto tempo.
8. **O que já funciona** — forças reais, com evidência do que foi lido.
9. **Glossário** (só na completa) — SEO/GEO/AEO em português simples.

> **Regra de ouro:** ser específico, nunca genérico. Todo achado referencia algo
> realmente lido. Se o title é "Bem-vindo ao nosso site", dizer isso. Se uma página
> está sem H1, dizer qual. Citar o texto real quando ajudar.

**Relatório visual (opcional):** o padrão é o markdown acima. Se o usuário pedir
um PDF/imagem "de entrega", gerar um HTML na identidade da marca e renderizar —
ler as cores e fontes de `identidade/design-guide.md` (ou, se for cliente,
`clientes/<nome>/identidade-visual/`) e usar a infra de render do `/carrossel`
(Playwright + `.claude/skills/carrossel/render/render-carrossel.js`). **Montar cada página do documento como um `.slide`
no HTML — o render tira um PNG por `.slide`.**

Convenções do relatório, independentes da marca:

- Cores da marca vêm do design-guide: fundo principal, cor de destaque e texto
  principal. Nunca inventar paleta nem usar branco puro no fundo
- Cores semânticas das notas (fixas, porque comunicam status e não marca):
  8-10 verde `#16a34a` · 5-7 âmbar `#d97706` · 1-4 vermelho `#dc2626`
- Fontes: as definidas no design-guide (títulos e corpo)
- Assinatura do rodapé: o nome do negócio em `_memoria/empresa.md`
- Se o `design-guide.md` estiver em branco, seguir o padrão editorial descrito
  na skill `/carrossel` em vez de interromper o fluxo
