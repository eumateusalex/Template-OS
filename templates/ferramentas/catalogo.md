# Catálogo de Ferramentas

Referência de APIs, CLIs e conectores que podem ser usados dentro de skills do Claude Code.
Consulte este arquivo antes de criar skills novas para saber o que já está disponível.

---

## Criar visuais (HTML para PNG)

### Playwright CLI
**O que faz:** Renderiza qualquer HTML em imagem PNG (carrosséis, slides, propostas, cards)
**Precisa de conta:** Não, roda localmente
**Como instalar:**
```bash
npx playwright install chromium
```
**Como usar em uma skill:**
```bash
npx playwright screenshot --viewport-size=1080,1350 --full-page "file:///caminho/slide.html" "slide.png"
```
**Tamanhos comuns:**
- Instagram feed: 1080x1350
- Instagram/TikTok story: 1080x1920
- Slide 16:9: 1920x1080
- Card quadrado: 1080x1080

---

## Publicar na web

### Cloudflare Pages API
**O que faz:** Publica arquivos HTML com link público (propostas, landing pages, estudos)
**Precisa de conta:** Sim, Cloudflare (gratuito)
**Configurar:** Salvar `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` no `scripts/.env`
**Quando usar:** Sempre que a skill gerar um HTML que precisa ser compartilhado por link

---

## Publicar em redes sociais

### Post for Me API
**O que faz:** Publica posts no Instagram e TikTok diretamente do Claude Code
**Precisa de conta:** Sim, postforme.dev
**Configurar:** Salvar `POSTFORME_API_KEY` no `scripts/.env`
**Como usar em uma skill:** o script que a skill criar lê a chave com `node --env-file=scripts/.env`
**Quando usar:** publicar no TikTok, ou no Instagram sem um app próprio na Meta (para o Instagram, o workspace já tem o `/instagram-publisher`)

---

## Buscar conteúdo da web

### WebFetch (nativo)
**O que faz:** Lê o conteúdo de qualquer URL e retorna como texto
**Precisa de conta:** Não, já vem no Claude Code
**Quando usar:** Pesquisa de referências, leitura de artigos, busca de dados em sites

### WebSearch (nativo)
**O que faz:** Pesquisa no Google e retorna resultados
**Precisa de conta:** Não, já vem no Claude Code
**Quando usar:** Quando o usuário precisa pesquisar antes de criar conteúdo

### Jina Reader
**O que faz:** Converte qualquer URL em markdown limpo (melhor que WebFetch para artigos longos)
**Precisa de conta:** Não
**Como usar:** Acessar `https://r.jina.ai/{URL}` via WebFetch
**Quando usar:** Extrair texto de artigos, blog posts, páginas com muito HTML

---

## Extrair conteúdo de vídeo

### yt-dlp (CLI)
**O que faz:** Baixa vídeo, áudio e legenda do YouTube e de outras plataformas
**Precisa de conta:** Não, roda localmente
**Como instalar:**
```bash
winget install yt-dlp.yt-dlp      # Windows
brew install yt-dlp        # macOS
```
**Quando usar:** Skills que partem de um vídeo para criar conteúdo (carrossel, newsletter, roteiro)

---

## Gerar imagens com IA

### Gemini (Google AI)
**O que faz:** Gera imagens a partir de texto
**Precisa de conta:** Sim, Google AI Studio (gratuito até certo limite)
**Configurar:** Salvar `GEMINI_API_KEY` no `scripts/.env`
**Quando usar:** o caminho alternativo do `/gerar-imagem` (`--via gemini`); o padrão do workspace é a Vertex AI, pelo login do `gcloud`, sem chave

### OpenAI (gpt-image, pela API)
**O que faz:** Gera imagens a partir de texto
**Precisa de conta:** Sim, OpenAI (pago por uso)
**Configurar:** Salvar `OPENAI_API_KEY` no `scripts/.env`
**Quando usar:** uma skill sua que chame a API oficial. O `--motor gpt` do `/gerar-imagem` é outra coisa: usa o login do ChatGPT por um proxy não oficial

---

## Conectar com plataformas (MCPs)

MCPs são conectores que dão acesso direto a plataformas dentro do Claude Code.
O Claude passa a utilizar esses conectores automaticamente quando fizer sentido.

Para verificar quais MCPs já estão instalados: `claude mcp list`
Para remover um MCP: `claude mcp remove nome-do-mcp`

### Conectores da sua conta do Claude
**O que faz:** Notion, Gmail, Google Agenda, Google Drive, Canva e Figma, entre outros, ligados uma vez na sua conta
**Precisa de conta:** Sim, a de cada serviço
**Como instalar:** em claude.ai, Configurações > Conectores. O que você liga lá aparece também no Claude Code
**Quando usar:** é o caminho mais simples e o mais seguro: o login é oficial de cada serviço, sem pacote de terceiro na sua máquina

### Notion (servidor oficial)
**O que faz:** Acessa páginas e bancos do Notion; é o que o pipeline de referências usa
**Precisa de conta:** Sim, a do Notion (gratuita)
**Como instalar:**
```bash
claude mcp add --transport http notion https://mcp.notion.com/mcp
```
Depois, no Claude Code, `/mcp`, escolher o Notion e autorizar no navegador. Não há chave para colar: a autorização fica no próprio Claude Code. O passo a passo do pipeline está em `marketing/instagram/README.md`
**Quando usar:** skills que leem ou escrevem bancos e páginas do Notion

### Bibliotecas de componentes (HeroUI, Magic UI)
**O que faz:** Servidores de documentação de componentes de interface, para quem constrói tela com essas bibliotecas
**Precisa de conta:** Não
**Como instalar:**
```bash
claude mcp add heroui -- npx -y @heroui/react-mcp@1.1.2
claude mcp add magic-ui -- npx -y @magicuidesign/mcp@2.0.0
```
**Quando usar:** num projeto que usa a biblioteca; nenhuma skill do workspace depende deles

### Facebook Ads (Meta)
**O que faz:** Gerencia campanhas do Meta (Facebook/Instagram Ads)
**Precisa de conta:** Sim, Token Meta Business
**Quando usar:** Skills de gestão de mídia paga, relatórios de performance

### Google Ads
**O que faz:** Acessa e edita campanhas, busca dados de performance
**Precisa de conta:** Sim, credenciais Google Ads
**Quando usar:** Skills de gestão de mídia paga, relatórios de performance

### N8N
**O que faz:** Dispara automações e workflows do N8N
**Precisa de conta:** Sim, instância N8N + API key
**Como instalar:**
```bash
claude mcp add n8n -- npx -y n8n-mcp
```
**Quando usar:** Skills que precisam disparar automações externas

### Supabase
**O que faz:** Banco de dados e backend completo
**Precisa de conta:** Sim, projeto Supabase
**Quando usar:** Skills que precisam guardar dados, autenticação, backend

### Telegram
**O que faz:** Envia e recebe mensagens via bot do Telegram
**Precisa de conta:** Sim, bot token do BotFather
**Quando usar:** Skills de notificação, comunicação automática

---

## Como adicionar ferramentas novas

Se você utiliza uma API ou ferramenta que não está nesta lista, adicione-a aqui seguindo o formato:

```markdown
### Nome da Ferramenta
**O que faz:** [descrição em uma frase]
**Precisa de conta:** [Sim/Não]
**Configurar:** [o que salvar no .env, se aplicável]
**Como usar em uma skill:** [comando ou instrução]
**Quando usar:** [em que tipo de skill faz sentido]
```
