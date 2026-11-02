# marketing/: SEO, campanhas e contexto

O que as skills de busca, anúncio e estratégia de Instagram produzem fica aqui.
**Carrossel não:** ele nasce em `carrosseis/`, na raiz. As skills já sabem onde <!-- caminho futuro: a pasta nasce com o primeiro carrossel -->
salvar, então raramente é preciso criar pasta na mão.

## Estrutura padrão

```
marketing/
├── seo/                         saídas do /seo-geo-aeo
│   ├── 00-auditoria.md              diagnóstico do site (SEO · GEO · AEO)
│   ├── 01-pesquisa-demanda.md
│   ├── 02-analise-concorrencia.md
│   ├── 03-google-meu-negocio.md
│   ├── 04-otimizacao-on-page.md
│   ├── 05-estrategia-conteudo.md
│   ├── 06-google-ads.md
│   ├── 07-checklist-monitoramento.md
│   ├── 08-geo-aeo.md
│   └── 08-varredura-ia.md
│
├── campanhas/                   saídas da campanha do /seo-geo-aeo e do /relatorio-ads
│   ├── google-ads-<YYYY-MM-DD>/  CSVs prontos pra importar
│   └── relatorios/               relatórios semanais
│
├── avaliacoes-google/           histórico do /responder-avaliacoes (opcional)
│
└── semanas/                     o plano da semana do /instagram
    └── <AAAA-MM-DD>-<conta>.md      a segunda-feira da semana e o @ da conta
```

## Como funciona

- **`/carrossel`** → **não escreve aqui.** As peças nascem em
  `carrosseis/<tema>-<data>/`, na raiz do projeto, com o roteiro, o HTML, o
  `IMAGENS.md`, os JPEGs e as duas legendas. Ver
  [`.claude/skills/carrossel/SKILL.md`](../.claude/skills/carrossel/SKILL.md)
- **`/seo-geo-aeo`** → grava a auditoria em `seo/00-auditoria.md` e preenche os 8 arquivos numerados em `seo/`
- **`/seo-geo-aeo` (o módulo de anúncio, também avulso)** → cria pasta em `campanhas/google-ads-<data>/` com CSVs
- **`/relatorio-ads`** → cria arquivo em `campanhas/relatorios/<data>-relatorio.md`
- **`/responder-avaliacoes`** → opcionalmente salva histórico em `avaliacoes-google/`
- **`/instagram`** (modo semana) → grava o plano em `semanas/<AAAA-MM-DD>-<conta>.md`:
  as peças da semana, na cota do "Peças por semana" da `_memoria/marketing.md`
  (sem ele, o padrão de lá), com a função, o formato, o gancho e o CTA, e o
  briefing de cada uma sai dali para o `/carrossel`

## Versionamento

O texto desta pasta é versionado no Git por meio do `/salvar`: isso permite
comparar a evolução do SEO entre meses, revisar textos anteriores ou recuperar
uma peça depois de uma alteração. Fica fora a mídia que é saída (vídeo, render).
