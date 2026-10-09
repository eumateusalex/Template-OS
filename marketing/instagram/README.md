# Pipeline de referências do Instagram

Duas skills que transformam o que você salva no Instagram em **roteiros prontos
para gravar**, organizados num banco pesquisável.

| Etapa | Skill | O que faz |
|---|---|---|
| 1 | `/instagram-saved-scanner` | varre as suas coleções de Salvos e enfileira o que ainda não foi processado |
| 2 | `/instagram-reference` | baixa, transcreve, traduz, classifica e escreve os roteiros |

A separação existe por um motivo prático: varrer é barato e rápido, processar é
caro e demorado. Você varre, olha a fila, **escolhe o que vale** e só então
manda processar.

> Também funciona sem a etapa 1: mande um link de vídeo direto pro
> `/instagram-reference` e ele processa na hora.

---

## 🚨 Isto aqui pede montagem antes

É a montagem mais longa do Template OS, porque depende de **coisas que são
suas**: a sua conta, os seus bancos no Notion, a sua
linha editorial.

São 4 passos, uns 20 minutos. Faça uma vez e nunca mais.

Se você não usa Notion, ou não quer montar isso agora, **ignore esta pasta
inteira**. Nada mais no workspace depende dela.

---

## Passo 1 · As ferramentas

| Precisa de | Para quê | Como conferir |
|---|---|---|
| **MCP do Notion** | ler e escrever nos bancos | `/mcp` deve listar o Notion conectado |
| **MCP do Playwright** | navegar nos Salvos (etapa 1) | `/mcp` deve listar o Playwright |
| **yt-dlp** | baixar o vídeo (etapa 2) | `yt-dlp --version` |
| **ffmpeg** | extrair o áudio pra transcrever | `ffmpeg -version` |
| **Python + faster-whisper** | transcrever offline | `pip install -r scripts/requirements.txt` |

**Conectar o Notion.** O Notion é o app de notas e bancos de dados onde o
pipeline guarda as referências e os roteiros; o MCP é a ponte que deixa o
Claude Code ler e escrever nele. A conta é gratuita, em <https://www.notion.so>.
Com a conta criada, rode uma vez no terminal, na raiz do workspace:

```bash
claude mcp add --transport http notion https://mcp.notion.com/mcp
```

Depois, dentro do Claude Code, digite `/mcp`, escolha o Notion e autorize no
navegador. **Não há chave para colar nem para gravar no `scripts/.env`**: a
autorização fica guardada no próprio Claude Code, fora do repositório. Na tela de
autorização, dê acesso às páginas onde os dois bancos vão morar (o passo 2).

**O Playwright** já vem configurado no `.mcp.json` do workspace: `/mcp` deve
listá-lo sem nada a fazer. Ele abre um navegador próprio, e é nele que você entra
na sua conta do Instagram, uma vez (a skill nunca pede a sua senha).

**Instalar o yt-dlp:**

```bash
# Windows (winget)
winget install yt-dlp.yt-dlp
# macOS (homebrew)
brew install yt-dlp ffmpeg
# qualquer sistema, via pip
pip install -U yt-dlp
```

⚠️ **Mantenha o yt-dlp atualizado.** O Instagram muda o site com frequência, e
versão velha para de baixar do nada. Quando falhar, o primeiro palpite é
`yt-dlp -U`.

**Só a etapa 1 precisa do Playwright.** Se você não quiser varrer Salvos e
preferir mandar links na mão, pule esse MCP.

---

## Passo 2 · Os dois bancos no Notion

Crie dois databases. Os nomes das propriedades **têm que bater exatamente** com
o que está abaixo, incluindo acento e maiúscula — as skills escrevem por nome, e
nome errado quebra a escrita sem avisar direito.

### Banco A · "Banco de Referências"

O acervo. Uma linha por vídeo que você processou.

| Propriedade | Tipo | Opções |
|---|---|---|
| `Título` | Title | — |
| `URL do Vídeo` | URL | — |
| `@ do Criador` | Text | — |
| `Transcrição Original` | Text | — |
| `Objetivo` | Select | `Viral` · `Útil` · `Vendas` |
| `Formato de Produção` | Select | *os seus formatos (veja o passo 3)* |
| `Gancho Identificado` | Text | — |
| `Tipo de Gancho` | Select | *os seus tipos (veja o passo 3)* |
| `CTA Identificada` | Text | — |
| `Idioma Original` | Select | `Inglês` · `Português` · `Outro` |
| `Potencial` | Select | `Alto` · `Médio` · `Baixo` |
| `Por que` | Text | — |
| `Status` | Select | `Novo` · `Analisado` · `Virou Ideia` |
| `Coleção Salvos` | Select | *o nome de cada coleção sua de Salvos* |
| `Data` | Date | — |

⚠️ **`Status` é o motor do pipeline**, não é enfeite. `Novo` = enfileirado pelo
scanner. `Analisado` = processado. `Virou Ideia` = já gerou roteiro. A etapa 2
**pula** o que estiver em `Analisado` ou `Virou Ideia`, e é isso que impede
reprocessar (e repagar) o mesmo vídeo.

### Banco B · "Ideias de Conteúdo"

A saída. Um roteiro por linha, pronto pra gravar.

| Propriedade | Tipo | Opções |
|---|---|---|
| `Título da Ideia` | Title | — |
| `Hook` | Text | — |
| `Formato de Produção` | Select | *os mesmos do Banco A* |
| `Objetivo` | Select | `Viral` · `Útil` · `Vendas` |
| `Etapa do Funil` | Select | `Topo` · `Meio` · `Fundo` |
| `CTA Sugerida` | Text | — |
| `Status` | Select | `Ideia` (acrescente os seus: `Gravando`, `Publicado`…) |
| `Referência` | **Relation** → Banco de Referências | — |

⚠️ **A `Referência` é uma relation de verdade**, não texto. É ela que deixa você
abrir um roteiro e ver de qual vídeo ele saiu.

### Pegar os IDs

Abra cada banco no Notion, clique em **Compartilhar → Copiar link**. O ID é o
bloco de 32 caracteres da URL:

```
https://notion.so/seuworkspace/2f1a4b8c9d3e4f5a6b7c8d9e0f1a2b3c?v=...
                              └──────── este pedaço ────────┘
```

**Confira que a conexão enxerga os dois bancos.** Se você os criou depois de
autorizar o MCP, abra cada banco e, no menu `...` → Conexões, acrescente a
conexão do Claude. Sem isso o MCP não enxerga o banco, e o erro que ele devolve
não diz isso com todas as letras.

Os IDs e o seu usuário do Instagram se gravam no `config.md` desta pasta (passo
3). Não são segredo: sem a sua autorização no MCP, um ID sozinho não abre nada.

---

## Passo 3 · Os três arquivos de contexto

| Arquivo | O que é | Vem pronto? |
|---|---|---|
| `config.md` | os IDs e a sua conta | ⬜ preencher |
| `editorial-framework.md` | a sua linha editorial: formatos, ganchos, objetivos | ⬜ preencher |
| `voice-model.md` | como o roteiro soa na sua voz | ⬜ preencher |
| `processed-videos.md` | índice local, evita reprocessar | ✅ vazio, se preenche sozinho |

**O `editorial-framework.md` e o `voice-model.md` são o que separa "roteiro
genérico de IA" de "roteiro que você grava sem reescrever".** Vale a hora que
custam.

> 💡 **Atalho:** peça ao Claude. Com o `_memoria/` já preenchido pelo
> `/instalar`, ele consegue propor uma primeira versão dos dois, e você corrige
> em cima. É mais rápido que encarar a folha em branco.

---

## Passo 4 · A primeira rodada

```
1. /instagram-saved-scanner        varra UMA coleção só, pra testar
2. abra o Notion e confira         os stubs devem estar lá, com Status "Novo"
3. /instagram-reference            processa a fila
4. leia um roteiro inteiro         é aqui que você descobre o que ajustar
```

**O passo 4 não é opcional.** O primeiro roteiro quase sempre revela um ajuste
no `voice-model.md`. Corrigir ali conserta todos os próximos.

---

## Como usar no dia a dia

| Você diz | Acontece |
|---|---|
| "varre os salvos da pasta X" | enfileira o que é novo |
| "o que tem de novo nos salvos?" | mesma coisa |
| "processa os 'Novo'" | roda o pipeline na fila inteira |
| *(cola um link do Instagram)* | processa aquele vídeo direto |
| "rouba essa ideia" | idem |

---

## O que este pipeline NÃO faz

- **Não publica nada.** Ele produz roteiro; publicar é seu (ou do
  `/instagram-publisher`, pra imagem)
- **Não copia vídeo.** Ele extrai **estrutura**: gancho, ritmo, formato, CTA. O
  tema vira o seu. Copiar conteúdo alheio é problema seu, não dele
- **Não guarda o vídeo.** O `.mp4` vive em `.tmp/` durante o processamento e é
  apagado no fim. A pasta `.tmp/` não é versionada

---

## Quando der errado

| Sintoma | Causa provável |
|---|---|
| "config com placeholder" | o passo 3 não foi feito |
| Notion recusa a escrita | a integração não tem acesso ao banco, ou uma opção de `Select` não existe |
| yt-dlp falha pedindo login | conteúdo restrito — ver `.claude/skills/instagram-reference/referencias/quando-falha.md` |
| yt-dlp falha do nada, e funcionava | o Instagram mudou. `yt-dlp -U` |
| Transcrição vazia | vídeo sem fala. É um modo previsto ("Sem fala"), não é erro |
| Roteiro não soa como você | `voice-model.md` raso. É o arquivo que mais dá retorno por linha escrita |
