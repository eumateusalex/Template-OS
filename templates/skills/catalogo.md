# Catálogo de Skills

Skills prontas, de fora ou já incluídas aqui, organizadas pelo que fazem. Use como referência ao criar skills novas ou instale as que fizerem sentido para o seu negócio. Ele não é o inventário do workspace: quem responde o que existe é o `ls` de `.claude/skills/`.

> Skills locais ficam em `.claude/skills/` e funcionam apenas neste projeto.
> Skills globais ficam em `~/.claude/skills/` e funcionam em qualquer projeto.

Cada item abaixo traz um campo **Disponibilidade**, que diz o que você já tem:

- **Incluída** — já está em `.claude/skills/`, é só chamar
- **Oficial da Anthropic** — skill pública do repositório github.com/anthropics/skills; instale pelo marketplace de plugins do Claude Code (`/plugin`) e chame pelo nome
- **Precisa instalar** — não vem junto; peça ao Claude para buscar e instalar

---

## Já instaladas aqui

As quatro abaixo são de apoio: a `responsive-design` e a `humanizer` vêm junto, e a
`react-best-practices` e a `gsap` chegam da fonte oficial pelo `/instalar`
(`node scripts/terceiros/instalar.mjs`). A `responsive-design` e a
`react-best-practices` só servem a quem mexe com código de site: sem isso, dá para
apagar as pastas delas sem quebrar nada. A `gsap` não se apaga se você usa o
`/clonar-site` (ele anima pelo GSAP), e a `humanizer` não se apaga nunca: todo
texto público passa por ela.

### Responsive Design
**O que faz:** Layouts que se adaptam a qualquer tela — container queries, tipografia fluida, CSS Grid.
**Bom para:** Garantir que a landing page funcione bem no celular
**Disponibilidade:** Incluída · chamar com `/responsive-design`

### React Best Practices
**O que faz:** Regras de performance para React e Next.js.
**Bom para:** Revisar ou escrever código React sem armadilhas de performance
**Disponibilidade:** Instalada pelo `/instalar` · chamar com `/react-best-practices`

### GSAP
**O que faz:** As skills oficiais do GSAP em 8 módulos — scroll, timeline, parallax, seção que fixa, texto e SVG animados, React e Next.js, performance.
**Bom para:** Qualquer movimento em site ou landing page
**Disponibilidade:** Instalada pelo `/instalar` · chamar com `/gsap` (uma skill roteadora que abre só o módulo que o pedido precisa, em `.claude/skills/gsap/referencias/`)

### Humanizer
**O que faz:** Tira do texto os padrões de escrita de IA (contraste fabricado, frase que comenta a própria frase, importância inflada) e o deixa na voz da marca.
**Bom para:** Passar um último pente em artigos e legendas antes de publicar
**Disponibilidade:** Incluída · chamar com `humanizer` (todo texto público passa por ela antes de sair)

---

## Escrever copy e textos de venda

### Copy (consciência, clássica, oferta e a escola de página)
**O que faz:** Escreve copy de página, anúncio, e-mail, VSL, carta, manifesto, slogan, guia de voz e campanha pelas quatro escolas, com portão de oferta e de prova e régua por máquina.
**Bom para:** Landing pages, emails de venda, VSLs, manifestos de marca, taglines, posicionamento
**Disponibilidade:** Incluída · chamar com `/copy` (oferta fraca: `/oferta` antes)

---

## Criar interfaces e páginas web

### Frontend Design
**O que faz:** Cria interfaces web completas com design de alta qualidade. Gera código HTML/CSS/React pronto para usar, com visual profissional que foge da estética genérica de IA.
**Bom para:** Landing pages, dashboards, componentes web, páginas de produto
**Disponibilidade:** Oficial da Anthropic · instalar pelo `/plugin` e chamar com `frontend-design`

### Motion
**O que faz:** A skill oficial do Motion (o antigo Framer Motion): animação em React, Vue e JavaScript puro, consultando a documentação oficial antes de escrever o código.
**Bom para:** Movimento em site, landing ou app feitos em React
**Disponibilidade:** Instalada pelo `/instalar` · chamar com `/motion`. O servidor de documentação `motion` já vem no `.mcp.json`, e é grátis. O `motion-plus` e o agente `motion-reviewer` dependem do Motion+, que é pago
⚠️ Não escreva regra sua dentro da pasta da skill: a atualização sobrescreve a pasta inteira.

---

## Criar visuais e arte

### Canvas Design
**O que faz:** Cria arte visual em PNG e PDF usando princípios de design. Pôsteres, capas, peças gráficas.
**Bom para:** Capas de e-book, banners, peças visuais, thumbnails
**Disponibilidade:** Oficial da Anthropic · instalar pelo `/plugin` e chamar com `canvas-design`

---

## Trabalhar com documentos

### PDF
**O que faz:** Manipula PDFs: extrai texto e tabelas, cria novos, junta/separa documentos, preenche formulários.
**Bom para:** Extrair dados de contratos, criar relatórios em PDF, preencher formulários
**Disponibilidade:** Oficial da Anthropic · instalar pelo `/plugin` e chamar com `pdf`

### DOCX
**O que faz:** Cria e edita documentos Word com formatação, tracked changes e comentários.
**Bom para:** Propostas formais, contratos, documentos para clientes que pedem Word
**Disponibilidade:** Oficial da Anthropic · instalar pelo `/plugin` e chamar com `docx`

### PPTX
**O que faz:** Cria e edita apresentações PowerPoint com layouts, speaker notes e formatação.
**Bom para:** Apresentações para clientes, decks de vendas, materiais de treinamento
**Disponibilidade:** Oficial da Anthropic · instalar pelo `/plugin` e chamar com `pptx`

### XLSX
**O que faz:** Cria e edita planilhas com fórmulas, formatação e gráficos.
**Bom para:** Relatórios financeiros, dashboards em planilha, análise de dados
**Disponibilidade:** Oficial da Anthropic · instalar pelo `/plugin` e chamar com `xlsx`

---

## Escrever documentos e specs

### Doc Co-Authoring
**O que faz:** Fluxo guiado para coescrever documentos. Realiza uma entrevista, itera rascunhos e valida se o documento funciona para o leitor.
**Bom para:** Propostas técnicas, specs, documentos de decisão, SOPs
**Disponibilidade:** Oficial da Anthropic · instalar pelo `/plugin` e chamar com `doc-coauthoring`

---

## Extrair transcrição de vídeo

### YT Transcript
**O que faz:** Extrai transcrições de vídeos do YouTube usando yt-dlp. Compatível com múltiplos idiomas.
**Bom para:** Criar conteúdo a partir de vídeos (carrosséis, newsletters, posts)
**Precisa de:** yt-dlp instalado (`brew install yt-dlp` no macOS, `winget install yt-dlp.yt-dlp` no Windows)
**Disponibilidade:** Precisa instalar — peça ao Claude: "instala a skill yt-transcript"
**Fonte:** Comunidade

---

## Testar sites e apps

### Webapp Testing
**O que faz:** Testa aplicações web locais usando Playwright. Captura screenshots, verifica funcionalidade e lê logs do navegador.
**Bom para:** Testar landing pages antes de publicar, verificar se tudo funciona em diferentes tamanhos
**Disponibilidade:** Oficial da Anthropic · instalar pelo `/plugin` e chamar com `webapp-testing`

---

## Criar skills novas

### Skill Creator
**O que faz:** Guia para criar skills novas do zero. Ajuda a estruturar, definir triggers e testar.
**Bom para:** Quando você quiser criar uma skill própria do zero, com estrutura e triggers definidos
**Disponibilidade:** Oficial da Anthropic · instalar pelo `/plugin` e chamar com `skill-creator`

---

## Como adicionar skills novas a este catálogo

Se você testou uma skill e deseja adicioná-la aqui para referência futura:

```markdown
### Nome da Skill
**O que faz:** [descrição em uma frase]
**Bom para:** [casos de uso práticos]
**Disponibilidade:** [Incluída / Oficial da Anthropic / Precisa instalar — como obter]
**Precisa de:** [dependência externa, se houver — remover a linha se não houver]
**Fonte:** [de onde veio — Anthropic, criada por você, comunidade]
```
