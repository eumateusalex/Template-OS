# marketing/ — SEO, campanhas e contexto

O que as skills de busca, anúncio e referência produzem fica aqui.
**Carrossel não:** ele nasce em `carrosseis/`, na raiz. As skills já sabem onde
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
└── instagram/                   contexto do pipeline de referências
    ├── README.md                    ⭐ como montar (Notion, MCPs, yt-dlp)
    ├── config.md                    os IDs dos bancos e a sua conta
    ├── editorial-framework.md       a sua linha editorial
    ├── voice-model.md               como o roteiro soa na sua voz
    ├── processed-videos.md          índice, evita reprocessar
    └── .tmp/                        downloads de passagem (não versionado)
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
- **`/instagram-saved-scanner`** e **`/instagram-reference`** → leem o contexto
  de `instagram/` e escrevem no Notion. **Exigem montagem prévia:** ver
  [`instagram/README.md`](instagram/README.md)

## Versionamento

O texto desta pasta é versionado no Git por meio do `/salvar`: isso permite
comparar a evolução do SEO entre meses, revisar textos anteriores ou recuperar
uma peça depois de uma alteração. Ficam fora a mídia que é saída (vídeo, render)
e `instagram/.tmp/`, que guarda download de passagem.
