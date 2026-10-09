# Remotion

Vídeo feito com React. Você escreve componente, o Remotion renderiza quadro a
quadro e exporta MP4, WebM, GIF ou PNG. Versão **{{version}}**.

## Como está montado

Isto aqui é um **plugin do Claude Code**, não uma skill solta. Por isso tudo
cabe numa pasta só.

```
.claude/skills/remotion/
├── .claude-plugin/plugin.json   <- o que faz o Claude reconhecer como plugin
├── README.md                    <- este arquivo
├── CATALOGO.md                  <- o mapa do que dá para fazer
├── LICENSE-remotion.md          <- vem junto do download
├── skills/                      <- as 12 skills
└── templates/                   <- 8 pontos de partida
```

As skills aparecem com o prefixo do plugin: `remotion:remotion-create`,
`remotion:remotion-render`, e assim por diante. Os links entre elas são
caminhos relativos diretos (`../remotion-create/SKILL.md`), sem link simbólico:
valem em qualquer sistema.

A pasta inteira é instalada por `node scripts/terceiros/instalar.mjs --so remotion`,
na versão que o `scripts/terceiros/manifesto.json` fixa, e fica fora do git.
Este README, o `CATALOGO.md` e o `plugin.json` saem dos moldes em
`scripts/terceiros/moldes/remotion/`: mudança neles se faz lá, porque a
próxima instalação reescreve esta pasta.

### 🚨 O link que faz isto funcionar

**Para usar o Remotion, há um passo manual, feito uma vez.**

O Claude Code só carrega plugin a partir de `~/.claude/skills/`, fora do
workspace. A solução é um link do sistema de arquivos: `~/.claude/skills/remotion` <!-- caminho futuro: o link que você cria uma vez -->
aponta para esta pasta. Um lugar só de verdade, sem cópia que apodrece.

O `node scripts/terceiros/instalar.mjs --conferir` diz se o link está de pé e,
se não estiver, imprime o comando exato para o seu sistema, com o caminho do
seu workspace já preenchido.

**Windows** (no PowerShell, e **não** precisa de administrador; o `mklink` pelo Git Bash
quebra nas aspas):

```
New-Item -ItemType Directory -Force "$env:USERPROFILE\.claude\skills" | Out-Null
New-Item -ItemType Junction -Path "$env:USERPROFILE\.claude\skills\remotion" -Target "CAMINHO\DO\SEU\WORKSPACE\.claude\skills\remotion"
```

Para desfazer, use `cmd /c rmdir` no link (nunca `rm -rf`: ele atravessa a junção e
apaga a pasta).

**macOS e Linux** (na raiz do workspace):

```bash
mkdir -p ~/.claude/skills
ln -s "$(pwd)/.claude/skills/remotion" ~/.claude/skills/remotion
```

Depois, reiniciar a sessão do Claude Code. Sem esse link, as 12 skills do
Remotion simplesmente não aparecem, e é assim que quase todo mundo descobre que
esqueceu deste passo.

> **Como conferir:** as skills aparecem com o prefixo do plugin
> (`remotion:remotion-create`). Se você digita `/remotion` e não aparece nada,
> o link não está de pé.

**Antes de montar um vídeo, abrir o [`CATALOGO.md`](CATALOGO.md) e escolher a
técnica de propósito.** Ele é o mapa do que dá para fazer com estas skills.

## As 12 skills

| Skill | Para quê |
|---|---|
| `remotion-best-practices` | roteador, chama a skill certa quando você não sabe qual usar |
| `remotion-create` | cria um projeto ou uma composição nova |
| `remotion-markup` | como escrever a animação: layout, tipografia, timing, efeitos |
| `remotion-studio` | abre o preview visual |
| `remotion-render` | exporta o vídeo ou a imagem |
| `remotion-captions` | legenda: transcrever, exibir, animar |
| `remotion-multimedia` | manipular áudio e vídeo via Mediabunny |
| `remotion-interactivity` | vídeo que responde a interação |
| `remotion-maps` | animação de mapa |
| `remotion-saas` | construir aplicação em cima do Remotion |
| `remotion-docs` | busca na documentação |
| `remotion-upgrade` | atualizar a versão |

## Templates

Ponto de partida e referência de código. Vídeo da sua marca não nasce
de um template copiado: nasce pelo `/video`, numa pasta em
`.claude/video/src/`, que já tem o `node_modules` (um só para todas as
peças). Copiar um template inteiro e rodar `npm install` dentro serve para um
app próprio fora do estúdio (o `next-app-tailwind`, por exemplo).

| Template | O que é |
|---|---|
| `blank` | vazio, começa do zero |
| `helloworld` | o padrão, com exemplos de animação |
| `still` | imagem estática em vez de vídeo, serve para post e carrossel |
| `overlay` | overlay para colocar sobre gravação de tela |
| `stargazer` | vídeo movido a dados, puxa de API |
| `code-hike` | vídeo de código com syntax highlight |
| `next-app-tailwind` | site Next.js com render de vídeo embutido |
| `prompt-to-motion-graphics` | motion graphics gerado por agente de IA |

Os templates pesados (recorder, tiktok, audiogram, three, music-visualization,
prompt-to-video, com 60 MB de mídia de exemplo) não fazem parte da pasta. Se
precisar de algum, ele se baixa à parte.

## Onde as coisas saem

- **Vídeo e imagem renderizados vão para `saidas/`.**
- A peça mora em `.claude/video/src/<peça>/`, pela porta `/video`; peça de
  projeto ou de cliente mora na pasta do dono. Nunca aqui: esta pasta é a
  ferramenta, não a obra.

⚠️ **`.mp4` e `.mov` estão no `.gitignore` da raiz**, de propósito: render de
vídeo é arquivo grande e regenerável. Se você precisar versionar um render
específico, force com `git add -f`.
