# HyperFrames

O motor é o CLI `hyperframes@0.8.96`, sempre fixo pelo `npx --yes` (a peça
re-renderiza igual semanas depois). Não há `node_modules`: o `npx` baixa o CLI
na primeira chamada e o guarda no cache.

## Os plugins opcionais

A skill roda sem nenhum dos dois; eles são código de terceiro e rodam na sua
máquina, então leia o repositório antes de instalar.

| Plugin | O que faz | Como instalar (no Claude Code) |
|---|---|---|
| `hyperframes` | as skills oficiais do motor, com a porta `/hyperframes` e os nomes `hyperframes:<nome>` | `/plugin marketplace add heygen-com/hyperframes` e `/plugin install hyperframes@hyperframes` |
| `watch` | lê um vídeo por link ou arquivo e devolve quadros com o tempo e a transcrição; o motor `local` faz tudo na máquina, com `ffmpeg` e `yt-dlp` | `/plugin marketplace add bradautomates/claude-video` e `/plugin install watch@claude-video` |

Plugin novo carrega numa sessão nova; no VS Code, só depois de recarregar a
janela (Ctrl+Shift+P, "Developer: Reload Window"). Subagente pode não
enxergá-los. Sem o `hyperframes`, a mesma documentação sai do CLI:
`npx --yes hyperframes@0.8.96 docs <tema>` (data-attributes, gsap, compositions,
rendering, examples, troubleshooting). Sem o `watch`, a referência se decompõe
com `yt-dlp` e ffmpeg à mão (`metodo.md`). Este arquivo é o que se aprendeu por
cima das skills oficiais, medido.

## A versão

**Subir de versão é decisão do usuário, medida antes.** Nunca `@latest`: o pino
garante que a peça re-renderize igual. Para avaliar uma versão nova `X.Y.Z`
(escolhida pelo número, nas notas de lançamento do repositório
`heygen-com/hyperframes`): numa cópia da peça, `npx --yes hyperframes@X.Y.Z
upgrade --project . --check`, um render de conferência comparado com o atual
(PSNR, seção "Determinismo") e o `teste.mjs`. Só com o ok do usuário troca-se o
pino em todos os arquivos da skill **e** o commit do registro em
`ferramentas/nova-peca.mjs` (o da tag `vX.Y.Z`, por `git ls-remote
https://github.com/heygen-com/hyperframes.git refs/tags/vX.Y.Z`).

Telemetria: `npx --yes hyperframes@0.8.96 telemetry disable`, uma vez por máquina.

## Os comandos, dentro da pasta da peça

| Para | Comando |
|---|---|
| conferir (lint, runtime, leiaute, movimento, contraste) | `npx --yes hyperframes@0.8.96 check` |
| quadros parados | `npx --yes hyperframes@0.8.96 snapshot --at 0,3.5,8 --no-end -o <pasta>` |
| render | `npx --yes hyperframes@0.8.96 render -o <arquivo>.mp4 --quality delivery` |
| prévia no navegador (o usuário abre e mexe) | `npx --yes hyperframes@0.8.96 preview --background`, depois `--stop` |
| ambiente | `npx --yes hyperframes@0.8.96 doctor` (Docker, Kokoro, MusicGen e whisper-cpp aparecem vermelhos e são opcionais) |

## O navegador do render

O HyperFrames usa um Chrome sem janela que ele baixa em `~/.cache/hyperframes/`.
No Windows esse executável pode ser barrado pelo sistema: o `doctor` diz que ele
não roda (`--version (UNKNOWN)`) e o `check` falha com
`check_runtime_failure: spawn UNKNOWN`. **O conserto é o headless shell do
Playwright**, o mais novo de `%LOCALAPPDATA%\ms-playwright\` (o template já usa o
Playwright em `scripts/`; se a pasta não existir, `npx playwright install
chromium-headless-shell` a cria):

```bash
# Git Bash: o headless shell mais novo
export HYPERFRAMES_BROWSER_PATH="$(ls -d "$LOCALAPPDATA"/ms-playwright/chromium_headless_shell-* | sort -V | tail -1)/chrome-headless-shell-win64/chrome-headless-shell.exe"
```

```powershell
# PowerShell
$hs = Get-ChildItem "$env:LOCALAPPDATA\ms-playwright" -Directory -Filter 'chromium_headless_shell-*' | Sort-Object { [int]($_.Name -split '-')[-1] } | Select-Object -Last 1
$env:HYPERFRAMES_BROWSER_PATH = Join-Path $hs.FullName 'chrome-headless-shell-win64\chrome-headless-shell.exe'
```

Medido: com o headless shell, `check`, `snapshot` e `render` passaram (o render
de 10 s do esqueleto, 300 quadros, e dois renders iguais com PSNR infinito). O
Chrome de desktop (`C:/Program Files/Google/Chrome/Application/chrome.exe`) serve
ao `check` e ao `snapshot`, mas o `render` testa o `--version` antes de começar,
e o Chrome de desktop pode não responder (ETIMEDOUT): não use para render. A
última saída é `npx --yes hyperframes@0.8.96 browser ensure --force`, que baixa o
Chrome do motor de novo.

## Qualidade máxima (anúncio)

Peça que vai para anúncio é recomprimida pela plataforma (o Meta recomprime tudo
o que recebe), e quanto mais informação no arquivo de origem, menos ela estraga.
Para essa entrega, renderize com CRF baixo em vez do `--quality delivery`:

```bash
npx --yes hyperframes@0.8.96 render -o <arquivo>.mp4 --crf 4
```

(Medido no esqueleto: o arquivo dobra, de ~77 para ~147 kbps num quadro quase
parado; numa peça com movimento a diferença é maior.) Para Reel orgânico, o
`--quality delivery` basta. No Remotion, o equivalente é `--crf=4
--x264-preset=slow --image-format=png` no `npm run render`.

## As fontes da marca

O `tokens.css` carrega as fontes por `@import` do Google Fonts: o render precisa
de internet, e uma fonte que o Google mudar muda o vídeo. Para peça que precisa
sair igual meses depois, ponha a woff2 em `.claude/skills/carrossel/marca/fontes/`
e declare com `@font-face` no `tokens.css` (o caminho relativo `fontes/...`
funciona pela junção `_marca`).

## O que o render quadro a quadro cobra

O render pausa a linha do tempo e busca cada quadro fora de ordem. Tudo o que
depende de "o que veio antes" quebra.

1. **Posição por `x`, `y` e `scale`, nunca `left` e `top`.** Propriedade de
   leiaute arredonda para o pixel e engasga no movimento lento. O `check`
   reprova (`gsap_non_transform_motion`). Largura e altura podem animar
   (o morph de cartão em pílula usa).
2. **Medida de leiaute uma vez, fora do `onUpdate`.** `offsetTop`,
   `getTotalLength` e `getBoundingClientRect` dentro de callback dependem da ordem
   da busca (`gsap_callback_dom_measurement`). Meça no carregamento, guarde, e
   meça de novo em `document.fonts.ready` se depender de texto (a quebra de
   linha muda quando a fonte chega). `offset*` ignora transform: some a posição
   final à mão.
3. **Número que sobe mora num objeto, não no texto.** `tl.to(conta, { visitas: 3870 })`
   e um `onUpdate` da linha do tempo que escreve `toLocaleString('pt-BR')`. Animar o
   `innerText` formatado relê "1.240" como 1,24 na segunda subida.
4. **Nada de `Date.now`, `Math.random` nem rede.** O GSAP vem local
   (`_vendor/`, a junção para `.claude/video/html/_vendor/`), não do CDN.

## As armadilhas medidas

| Sintoma | Causa | Regra |
|---|---|---|
| a peça sai em Arial, sem erro | marca por `../`: o servidor entrega o CSS de fora da peça, mas não a fonte que ele pede (404 no log) | marca e GSAP pelas junções `_marca` e `_vendor` dentro da peça (`nova-peca.mjs`); nunca `../` |
| o `check` acusa medida de leiaute num `onUpdate` que não mede nada | o lint lê o corpo de uma arrow sem chaves até a próxima vírgula do script, e engole o ajudante vizinho que mede | ajudante como `function` declarada (o modelo já vem assim) |
| apagar a pasta da peça apaga a marca | `rm -rf` atravessa a junção | só pelo `apagar-peca.mjs` |
| a ilustração sai num retângulo branco que apaga o fundo, só no MP4 | `mix-blend-mode` funciona no `snapshot`, mas o render não o aplica | o PNG recortado pelo `ferramentas/recorta_fundo.py` (só o branco ligado à borda some); **quadro parado não prova o render**: conferir o MP4 no mesmo ponto |
| ponto solto na tela | caminho SVG com `stroke-linecap: round` e comprimento desenhado zero ainda pinta a ponta | esconder o caminho (`visibility`) enquanto o progresso é zero |
| espaço antes do ponto final e sublinhado quebrado entre palavras | título partido palavra por palavra | a pontuação gruda na palavra anterior e o destaque corre contínuo pelas palavras do trecho |
| o `snapshot` sai com fundo cinza e fonte serifada | o `snapshot` e o Studio servem só a raiz da peça | as junções resolvem os dois |
| a frase escondida aparece embaixo da visível | máscara escondendo por `yPercent` (altura da frase) com frases de 2 e 3 linhas | esconder pela altura da MÁSCARA, em px (`fora()` do modelo) |
| o toque do dedo cai fora do botão | coordenada digitada à mão; o botão mudou de lugar | o que acerta um elemento mora dentro dele |
| o dedo some sobre o botão | cor da tinta sobre fundo da tinta | anel claro com contorno escuro, visível nos dois fundos |
| a tela coberta continua "viva" (o `check` acusa texto oculto) | a tela de baixo nunca sai de cena | `tl.set(tela, { autoAlpha: 0 })` quando a de cima termina de cobrir |
| o celular que sai atravessa o painel que cresce | ordem do DOM | `z-index` explícito para quem fica por cima |

## As marcações do `check`, e quando elas são verdade

- Títulos empilhados na mesma máscara: `data-layout-allow-overlap` e
  `data-layout-allow-overflow` na máscara, `data-layout-allow-overlap` e
  `data-layout-allow-occlusion` na frase. São verdade: a frase escondida está
  fora da máscara.
- O aviso `nested_structure_needs_subcomposition` fica: é organização do Studio,
  não defeito de render (o próprio esqueleto o recebe).
- Contraste 1:1 num elemento que está fora da tela naquele instante é falso:
  confira no quadro em que ele aparece.
- Qualquer outro aviso se conserta, ou fica com o motivo escrito no roteiro.

## Determinismo

Medido: o `snapshot` do mesmo instante sai idêntico byte a byte. Dois renders da
mesma peça diferem de leve: na captura em PNG, 9 de 645 quadros tinham até 23
pixels com 1 a 2 níveis de diferença (em 255), todos na borda do texto enquanto
um cartão mudava de escala fracionária. O resto era só o canal alfa, que o MP4
descarta, e o codificador soma um ruído próprio. **A régua é PSNR de 50 dB para
cima entre dois renders** (os medidos deram 53,7 dB no pior quadro):

```bash
ffmpeg -i a.mp4 -i b.mp4 -lavfi "[0:v][1:v]psnr" -f null - 2>&1 | grep -o "PSNR.*"
```
