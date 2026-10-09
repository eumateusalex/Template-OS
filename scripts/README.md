# scripts/ — utilitários da casa

Scripts que as skills acionam quando é preciso fazer algo fora do alcance da IA
pura: gerar imagem, transcrever, ler formato fechado.

> ⚠️ **Este arquivo tem que acompanhar a pasta.** Um README que descreve script
> que não existe mais, ou esquece o que foi criado, é documento contradizendo o
> sistema. Mexeu num script, confira esta tabela.

> 🎨 **O render de carrossel não mora aqui.** Ele é da skill, em
> `.claude/skills/carrossel/render/`, junto do kit que ele fotografa. Instalação
> em `.claude/skills/carrossel/render/instalar.md`.

## O que existe hoje

| Script | Quem chama | O que faz |
|---|---|---|
| `gerar-imagem.js` | `/gerar-imagem` | Imagem por IA via **Nano Banana na Vertex AI**. Sem chave de API: autentica pelo login do `gcloud` na máquina. `--dry-run` valida sem gastar. Motor opcional `--motor gpt` (gpt-image-2 do plano ChatGPT, sem custo por imagem, por proxy **não oficial** sobre o `codex login`: veja a skill). `--personagem <pasta>` mantém um personagem recorrente. **Testado só no Windows**: acha o `gcloud` pelo `GCLOUD_PATH`, pelo PATH (qualquer sistema) e pela pasta da instalação do Windows, e as duas suítes rodaram só no Windows 11; no macOS e no Linux o caminho está escrito, mas não foi exercitado |
| `teste-gerar-imagem.mjs` | referência | A suíte do `gerar-imagem.js`. Tudo roda em `--dry-run`, inspecionando o pedido antes de ele sair da máquina, com um `gcloud` falso da bancada e um projeto de teste: não fala com o Google, não usa a sua credencial e não gasta nada. `--relatorio <arquivo>` escreve o relatório de máquina (junit) |
| `teste-gerar-imagem-gpt.mjs` | referência | A suíte do motor GPT. Proxy, CLI e login falsos da bancada: não precisa de `codex login`, não gasta limite e não fala com a OpenAI. `--relatorio <arquivo>` escreve o junit |
| `lib/motor-gpt.js` | `gerar-imagem.js` | O motor GPT: valida, sobe e desce o proxy local `openai-oauth` e monta o pedido. Só carrega com `--motor gpt` |
| `lib/junit.mjs` | as suítes com `--relatorio` | O relatório de máquina (junit) das suítes, numa cópia só. É o que o `vermelho.mjs` da `/fabrica` lê para gravar o teste visto vermelho |
| `gerar-lote.js` | chamada direta | Gera imagem em lote a partir de um JSON de prompts, com 4 tentativas e espera crescente no HTTP 429 da Vertex. `--so-faltantes` torna o lote retomável |
| `gerar-video.js` | chamada direta | Vídeo por IA via **Veo na Vertex AI**, irmão do `gerar-imagem.js`: mesma conta, mesmo projeto, mesma autenticação pelo `gcloud`. Padrão 9:16 (Reels) no modelo `fast`. 🚨 **Gasta muito mais que imagem** (um plano de 8s no modelo bom custa mais que vinte imagens), por isso exige `--dry-run` ou `--confirmo` e se recusa a rodar sem uma das duas. Escolha o plano no barato antes de subir pro `--modelo bom`: a variação entre gerações é grande |
| `para-jpeg.js` | chamada direta, antes de publicar | PNG vira JPEG q92 pelo Chromium que o Playwright já instalou. Existe porque a API de publicação do Instagram aceita JPEG até 8 MB (a especificação da Meta); por isso o render entrega JPEG. O erro 9004/2207052 não é do formato: o `/instagram-publisher` explica e já o trata |
| `previa-pdf.js` | conferência de PDF | Rasteriza as páginas de um PDF em PNG, e com `--contato` monta a folha de miniaturas. Existe porque conferir documento olhando pedaços soltos do HTML esconde o ritmo, as páginas seguidas com a mesma composição e a página com um terço de branco no pé. Quem rasteriza é o **pdf.js**, porque o Chromium headless do Playwright não traz visualizador de PDF. ⚠️ O canvas vai com `alpha:false` e fundo branco: sem isso a cor desmancha |
| `raspar.js` | `/raspar` | Site de terceiro vira markdown limpo, via **API do Firecrawl**. Seis comandos: `creditos` `pagina` `mapa` `site` `extrair` `buscar`. Custo medido, não estimado: `extrair` sai por **5 créditos**, não 1, e `site` multiplica por página (por isso o limite padrão é 10 e acima de 30 exige `--confirmo`). Stdlib pura, sem dependência |
| `confere-memoria.mjs` | `/memoria auditar` · `/sanitizacao` (check-up) · `/instalar` (com `--instalada`) | A conferência mecânica da `_memoria/` contra o contrato do `_memoria/README.md`; com `--instalada`, cobra também o mínimo que a instalação preenche (o nome, o que se vende, o gargalo com a consequência, a data dos módulos escritos) e lista o que ficou pendente: arquivo declarado, sem subpasta, cabeçalho padrão, zero termo aposentado (lidos da seção "Termos aposentados" do próprio README), zero data em texto corrido, zero emoji como estrutura, teto de linhas, e todo ponteiro `_memoria/...` resolvendo. Não julga conteúdo. Sai 1 se algo reprovar |
| `teste-confere-memoria.mjs` | referência | A suíte do `confere-memoria.mjs`, com os defeitos plantados. Rodar depois de mexer na régua |
| `confere-contexto.mjs` | `/sanitizacao` (check-up) | A conferência mecânica do contexto operacional: o teto do `CLAUDE.md`, o marcador de diário (a história mora no `git log`), o caminho entre crases que não existe, a descrição de skill acima do teto da lista da sessão e o termo aposentado. Sai 1 se algo reprovar |
| `teste-confere-contexto.mjs` | referência | A suíte do `confere-contexto.mjs`, com os defeitos plantados |
| `lista-ask.mjs` | quem mexe nas permissões | Gera a lista `ask` do `.claude/settings.json` (o git sem volta, o shell dentro de shell, instalar pacote global e ligar conta de IA). `--simular` prova cada caso que deve e que não deve perguntar; `--aplicar` só grava se a simulação passar |
| `mede-ask.sh` | quem mexe nas permissões | Mede a lista `ask` no Claude Code real, num repositório descartável, pelo Haiku (14 chamadas curtas). O executável é o `claude` do PATH, ou o da variável `CLAUDE_EXE` |
| `transcrever.py` | `/converter`, `/cortes` | Transcreve áudio e vídeo por **faster-whisper, 100% offline**, pelo motor `lib/motor_whisper.py`: placa NVIDIA quando há, CPU quando não (mesmo texto, mais devagar). O arquivo nunca sai da máquina, e é o que torna seguro transcrever call de cliente e reunião. Flags: `--modelo`, `--idioma`, `--saida`, `--dispositivo cpu`, `--json` (tempo por palavra). Precisa do ffmpeg no PATH |
| `lib/motor_whisper.py` | `transcrever.py` | O motor de transcrição: deixa o PyAV de fora (o Smart App Control pode bloqueá-lo), usa a placa quando responde e termina na CPU se ela falhar no meio |
| `cortes.mjs` | `/cortes` | Corta os trechos escolhidos em Reels 1080x1920 com o gancho na fonte da marca (`.claude/skills/carrossel/marca/tokens.css`; `--marca neutra` sem marca), mede a duração pelo ffprobe e grava um quadro de cada. Precisa de ffmpeg/ffprobe e do Playwright desta pasta |
| `reel-falado/` | `/cortes` (modo gravação) | A gravação bruta de alguém falando para a câmera vira Reel: as tomadas (`tomadas.py`, a última de cada frase), o corte da fala no som real (`fala.py`), o som em faixas (`som.py`), o medidor de volume que os dois usam (`medida.py`) e a montagem da peça do HyperFrames na marca da pessoa ou na neutra, com a legenda pela régua e a caixa da memória (`montar.mjs`). Precisa de ffmpeg, numpy e scipy. Provas: os `teste-*.mjs` da pasta |
| `teste-cortes.mjs` · `teste-transcrever.mjs` | referência | As suítes do `/cortes` e da transcrição; rodam sem internet, sem modelo e sem placa |
| `copy/conferir.mjs` | `/copy` | A régua de copy da marca: roda a portátil da `/copy` e soma as regras de `_memoria/escrita-publica.md`, `preferencias.md` e `prova.md`; a caixa minúscula só com `**Caixa:** minúscula`. Uso: `node scripts/copy/conferir.mjs <copy.md> [--caixa minuscula\|normal]`. Prova: `node --test scripts/copy/teste-conferir.mjs` |
| `lib/copy.js` · `lib/caixa.js` · `lib/legenda.js` | `/copy`, `/video`, `/cortes`, `/instagram-publisher` | As listas e a régua do texto público (balcão, jargão menos o vocabulário próprio, proibidas, número com fonte), a caixa lida de `_memoria/escrita-publica.md` e a régua da legenda (até 400 caracteres, 3 a 5 linhas, sem hashtag, até 1 emoji, e reprova o pedido de seguir seco, como "segue lá"). Provas: `teste-copy.mjs` e `teste-legenda.mjs` em `lib/` |
| `lib/padroes-de-ia.js` | `lib/copy.js`, `lib/legenda.js`, `copy/conferir.mjs` | Os padrões de IA que a `humanizer` nomeia e uma expressão consegue ver (contraste fabricado, falsa revelação, autoridade vaga, importância inflada, linguagem corporativa, frase que comenta a própria frase, advérbio vazio, exclamações). Prova: `teste-padroes-de-ia.mjs` em `lib/` |
| `lib/vertex.js` | `gerar-imagem.js`, `gerar-video.js` | O `gcloud` e o token efêmero da Vertex AI, numa cópia só (`GCLOUD_PATH`, PATH, pasta da instalação do Windows; token vazio é erro que diz o conserto). Prova: `teste-vertex.mjs` em `lib/` |
| `oferta/` | `/oferta` | A busca no acervo (`buscar.mjs`), o conferidor da skill (`conferir-skill.mjs`) e o painel do relatório (`relatorio.py`, só stdlib). Provas: `teste-buscar.mjs`, `teste-conferir-skill.mjs`, `teste-relatorio.mjs` |
| `guardanapo/` | `/guardanapo` | A régua e o render do desenho à mão (rough.js + Playwright); testes em `teste-*.mjs` |
| `terceiros/` | `/instalar` · quem depende de uma peça | O instalador das peças de fora (fontes, ícones, bibliotecas e as skills oficiais do GSAP, do Remotion, do Motion e de React), baixadas da fonte oficial com versão fixa para o caminho que o workspace cita, fora do git: `instalar.mjs` (`--listar`, `--conferir`, `--so <peça>`), o `manifesto.json` com a impressão de cada arquivo, os `moldes/` do que organiza a peça e a prova `teste-instalar.mjs`. O README da pasta diz como trocar de versão |
| `biblioteca-anuncios.mjs` · `teste-biblioteca-anuncios.mjs` | agente `estrategista` | Lê a Biblioteca de Anúncios da Meta, sem login e sem token |
| `ler-mind.py` | `/converter` | Lê arquivo `.mind` (mapa mental) e devolve a estrutura em texto. Stdlib pura |
| `guia-geracao-imagem-vertex-ai.md` | referência | A receita completa da Vertex, os erros e o porquê. Ler só quando algo falhar |
| `package.json` · `requirements.txt` | referência | As dependências de Node e de Python, fixadas na versão que funciona. Reinstalar a máquina começa por eles |

O `/instagram-publisher` tem os scripts dele dentro da própria skill, mas lê as
credenciais **daqui**: `scripts/.env` e `scripts/.env.<conta>`.

## Pré-requisitos

**Node.js 22.7+** (testado até a v24). A versão importa: o `publish.js` do
instagram-publisher usa ESM num arquivo `.js` sem `package.json` por perto, e
isso só funciona com a detecção de sintaxe do Node moderno.

**Playwright e pdf.js**, pro render e pros scripts que fotografam (`para-jpeg.js`,
`previa-pdf.js` e o medidor do `/design-de-produto`, que acha o Playwright nesta pasta):

```powershell
npm --prefix scripts install
npx --prefix scripts playwright install chromium
```

**gcloud**, pro `gerar-imagem.js`:

```powershell
winget install Google.CloudSDK
gcloud auth login
```

⚠️ **Depois de instalar qualquer um dos dois, reinicie o programa em que o Claude
Code roda** (o terminal, ou o editor inteiro). Abrir uma aba nova não basta: a aba
herda o PATH do programa, e ele herdou o PATH de quando foi aberto.

## O `scripts/.env`

Não versionado (`.env` e `.env.*` estão no `.gitignore`). O que mora nele hoje:

```
INSTAGRAM_CONTA, INSTAGRAM_BUSINESS_ID, INSTAGRAM_ACCESS_TOKEN   → instagram-publisher
IMGBB_API_KEY                                                     → instagram-publisher
META_API_BASE, META_API_VERSION                                   → instagram-publisher
GOOGLE_CLOUD_PROJECT                                              → gerar-imagem · gerar-video
FIRECRAWL                                                         → raspar
ELEVENLABS (opcional)                                             → video
```

**Variáveis de terminal, que NÃO se lêem do `.env`** (o script lê o ambiente; no PowerShell,
`$env:NOME = "..."`; no Git Bash, `export NOME=...`): `GPT_PROXY_URL` e `CODEX_HOME` (o
`gerar-imagem --motor gpt`, opcionais) e `OFERTA_ACERVO` (a pasta do acervo do `/oferta`).

> O nome da chave do Firecrawl é `FIRECRAWL`, sem sufixo, e é assim de
> propósito. O `raspar.js` também aceita `FIRECRAWL_API_KEY`, que é o nome da
> documentação oficial, para quem copiar um exemplo de fora e colar aqui.

> 🚨 **Este arquivo tem token real: nunca sirva a raiz do projeto.** Um
> `npx http-server .` entrega o `scripts/.env` a quem pedir: sem argumento, para
> a rede inteira; com o `-a 127.0.0.1`, ainda pelo nome, pelo nome curto do
> Windows e por `%2eenv`. Para ver ou fotografar uma peça, use o render do
> `/carrossel` (passo 5): o servidor dele (`render/servidor.js`) serve só a
> pasta da peça e o kit, no 127.0.0.1, e recusa o nome que começa com ponto, a
> extensão que a peça não pede, o pedido de outro site e o `Host` de fora.

Nunca colar chave dentro de um script nem em arquivo de memória.
