# HyperFrames

O motor é o CLI `hyperframes@0.8.207`, sempre fixo pelo `npx --yes` (a peça
re-renderiza igual semanas depois). Não há `node_modules`: o `npx` baixa o CLI
na primeira chamada e o guarda no cache.

## Os plugins opcionais

A skill roda sem nenhum dos dois; eles são código de terceiro e rodam na sua
máquina, então leia o repositório antes de instalar.

| Plugin | O que faz | Como instalar (no Claude Code) |
|---|---|---|
| `hyperframes` | as skills oficiais do motor, com a porta `/hyperframes` e os nomes `hyperframes:<nome>` (na 0.8.207 são 7: figma, hyperframes, hyperframes-cli, hyperframes-registry, media-use, remotion-to-hyperframes e slideshow) | `/plugin marketplace add heygen-com/hyperframes` e `/plugin install hyperframes@hyperframes` |
| `watch` | lê um vídeo por link ou arquivo e devolve quadros com o tempo e a transcrição; o motor `local` faz tudo na máquina, com `ffmpeg` e `yt-dlp` | `/plugin marketplace add bradautomates/claude-video` e `/plugin install watch@claude-video` |

Plugin novo carrega numa sessão nova; no VS Code, só depois de recarregar a
janela (Ctrl+Shift+P, "Developer: Reload Window"). Subagente pode não
enxergá-los. Sem o `hyperframes`, a mesma documentação sai do CLI:
`npx --yes hyperframes@0.8.207 docs <tema>` (data-attributes, gsap, compositions,
rendering, examples, troubleshooting). Sem o `watch`, a referência se decompõe
com `yt-dlp` e ffmpeg à mão (`metodo.md`). As regras de animação do motor (as
`rules/` e os `blueprints/`), que saíram do plugin, chegam pelo instalador em
`.claude/skills/mograph/biblioteca/hyperframes-regras/` <!-- caminho futuro: chega pelo instalador (node scripts/terceiros/instalar.mjs --so mograph-hyperframes-regras) -->. Este arquivo é o que
se aprendeu por cima das skills oficiais, medido.

## A versão

**Subir de versão é decisão do usuário, medida antes.** Nunca `@latest`: o pino
garante que a peça re-renderize igual. Para avaliar uma versão nova `X.Y.Z`
(escolhida pelo número, nas notas de lançamento do repositório
`heygen-com/hyperframes`): numa cópia da peça, `npx --yes hyperframes@X.Y.Z
upgrade --project . --check`, um render de conferência comparado com o atual
(o par idêntico, seção "Determinismo") e o `teste.mjs`. Só com o ok do usuário troca-se o
pino em todos os arquivos da skill **e** o commit do registro em
`ferramentas/nova-peca.mjs` (o da tag `vX.Y.Z`, por `git ls-remote
https://github.com/heygen-com/hyperframes.git refs/tags/vX.Y.Z`).

Telemetria: `npx --yes hyperframes@0.8.207 telemetry disable`, uma vez por máquina.

## Os comandos, dentro da pasta da peça

**Onde o render grava** (`<previa>` nos comandos): a conferência da peça deste workspace vai para
`.claude/video/previa/<peça>/` (de dentro da peça, `../../previa/<peça>`), e a da peça de projeto ou
de cliente para `previa/` dentro da pasta dela, que o `.gitignore` da peça ignora. A rodada nova apaga a
de antes: fica só o par que provou o determinismo e o que se entregou. O final vai para
`saidas/<estilo>-<tema>-<data>/` (`estilos.md`), e nunca fica só na prévia.

| Para | Comando |
|---|---|
| conferir (lint, runtime, leiaute, movimento, contraste) | `npx --yes hyperframes@0.8.207 check` |
| quadros parados | `npx --yes hyperframes@0.8.207 snapshot --at 0,3.5,8 --no-end -o <previa>/quadros` |
| render | `npx --yes hyperframes@0.8.207 render -o <previa>/<rodada>-a.mp4 --quality delivery --no-browser-gpu --workers 1` (por software e com um processo: o "Determinismo") |
| prévia no navegador (o usuário abre e mexe) | `npx --yes hyperframes@0.8.207 preview --background`, depois `--stop` |
| editar à mão no Studio (o pacote editável do falado) | `npx --yes hyperframes@0.8.207 preview <pasta-do-pacote>` |
| ambiente | `npx --yes hyperframes@0.8.207 doctor` (Docker, Kokoro e whisper-cpp aparecem vermelhos e são opcionais) |

## O navegador do render

O HyperFrames usa um Chrome sem janela que ele baixa em `~/.cache/hyperframes/`.
No Windows esse executável pode ser barrado pelo sistema: o `doctor` diz que ele
não roda (`--version (UNKNOWN)`) e o `check` falha com
`check_runtime_failure: spawn UNKNOWN`. **O conserto é o headless shell do
Playwright**, o mais novo de `%LOCALAPPDATA%\ms-playwright\` (o template já usa o
Playwright em `scripts/`; se a pasta não existir, `PLAYWRIGHT_SKIP_BROWSER_GC=1 npx
playwright install chromium-headless-shell` a cria):

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
de 10 s do esqueleto, 300 quadros, e dois renders iguais com PSNR infinito).
**A série que prova o determinismo usa um navegador só**, e o render que se
compara a um entregue usa o mesmo navegador e a mesma `--quality` dele (o log do
render diz os dois: "Browser: cache" ou "Browser: env"). O
Chrome de desktop (`C:/Program Files/Google/Chrome/Application/chrome.exe`) serve
ao `check` e ao `snapshot`, mas o `render` testa o `--version` antes de começar,
e o Chrome de desktop pode não responder (ETIMEDOUT): não use para render. A
última saída é `npx --yes hyperframes@0.8.207 browser ensure --force`, que baixa o
Chrome do motor de novo.

## Qualidade máxima (anúncio)

Peça que vai para anúncio é recomprimida pela plataforma (o Meta recomprime tudo
o que recebe), e quanto mais informação no arquivo de origem, menos ela estraga.
Para essa entrega, renderize com CRF baixo em vez do `--quality delivery`:

```bash
npx --yes hyperframes@0.8.207 render -o <arquivo>.mp4 --crf 4
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
| o render baixa o áudio inteiro ("Audio lowered by 4.9 dB to stay under −1 dBTP") e a peça sai a −18 LUFS, embora a soma dos `<audio>` meça −2 dBTP | o AAC nativo do ffmpeg faz pré-eco nos ataques da trilha (até +9 dB em janelas de 10 ms), e o render codifica uma segunda vez quando a duração do `#root` não fecha em quadro inteiro na saída (31,525 s a 30 qps viram 946 quadros: ele preenche o áudio e recodifica); a correção de pico mede essa segunda geração | a duração do `#root` em segundos inteiros (múltiplo de quadro a 1 e a 30 qps): o passo de preenchimento vira `-c:a copy` e o render não baixa nada. Medido numa peça de 31,5 s: de −18,1 para −13,9 LUFS, −2,4 dBTP. O pico da primeira geração ainda sorteia entre −2,2 e −1,0 dBTP para a mesma soma: deixe 1 dB de folga na trilha. Trilha masterizada alta (pico verdadeiro acima de 0 dBTP no arquivo) passa por limitador antes de entrar |

## As marcações do `check`, e quando elas são verdade

- Títulos empilhados na mesma máscara: `data-layout-allow-overlap` e
  `data-layout-allow-overflow` na máscara, `data-layout-allow-overlap` e
  `data-layout-allow-occlusion` na frase. São verdade: a frase escondida está
  fora da máscara.
- O aviso `nested_structure_needs_subcomposition` fica: é organização do Studio,
  não defeito de render.
- Os avisos da seção Craft (a partir da 0.8.207) são de ofício, e quase sempre verdade: o
  `line_unread` (a frase final com menos de 2 s na tela) é o mesmo defeito do tempo de leitura do
  `roteiro.md` da `/mograph`, e se conserta dando tempo à frase ou cortando a frase, não com o motivo.
- Contraste 1:1 num elemento que está fora da tela naquele instante é falso: confira no quadro em que ele aparece.
- Qualquer outro aviso se conserta, ou fica com o motivo escrito no roteiro.

## Determinismo

**A régua é o par idêntico, dentro da mesma série.** Dois renders seguidos da mesma peça, por
software e com um processo (`render --no-browser-gpu --workers 1`), longe de outra carga, saem com
PSNR infinito entre si; o que se entrega é um deles. A medida é o pior quadro, não a média:

```bash
ffmpeg -i a.mp4 -i b.mp4 -lavfi "[0:v][1:v]psnr" -f null - 2>&1 | grep -o "average:[^ ]* min:[^ ]*"
```

- **Peça sem vidro e sem desfoque:** o par sai idêntico no primeiro par (medido em seis pares, de
  peças faladas e em motion puro).
- **Peça com vidro (`backdrop-filter`) ou desfoque (`filter: blur`) em cena que escala:** os renders
  formam variantes de 1 a 2 níveis de cor, invisíveis (47,4 a 49,9 dB no pior quadro). Renderiza-se em
  série, um de cada vez, até o par idêntico aparecer (já veio no quarto). Sem par depois de cinco, o piso
  é 48,5 dB no pior quadro entre os dois mais próximos, e isso vai escrito no relatório.
- **O par se exige na mesma série, nunca contra um render de outro dia:** a mesma peça, o mesmo
  `index.html` e as mesmas opções, renderizada horas depois, não bate nenhum quadro (0,5 a 0,8 nível de
  média, o vídeo da câmera decodificado de novo). Para provar que um conserto mexeu só onde devia, a
  medida é a diferença por faixa do quadro, não o PSNR inteiro.

O que faz o render divergir, e o conserto medido de cada um:

| Causa | O conserto |
|---|---|
| elemento com `filter` andando em posição fracionária, ou filtrado (`blur(0px)`) num palco que escala | `snap: 'x,y'` no que tem filtro e `filter: 'none'` assim que o foco termina |
| filtro animado num contêiner que segura cenas que vêm depois (o de todas as legendas, o de todas as cenas): mesmo voltando a `none`, a cena que escala mais tarde diverge (na peça de teste das técnicas, 54 quadros a 49 dB numa cena 6 s depois, em dois pares) | o filtro só nos elementos que acabam no corte (as linhas da legenda no ar, a cena que sai): o par volta a sair idêntico |
| entrada ou saída com `y` fracionário e opacidade mudando juntos | `snap: 'y'` e `force3D: false` no tween (num Reel falado, de 46 dB para os 1084 quadros idênticos) |
| render pela placa ou com vários processos e câmera que escala um contêiner | o render por software com um processo (pela placa, 41 a 49 dB) |
| render em paralelo com outras opções | o render em série, sozinho |

O áudio também varia: as mesmas fontes saem em AAC diferente a −43 dB de um render para outro
(inaudível), então o áudio aprovado se leva para o vídeo novo com `-map 0:v -map 1:a -c copy`. O
`snapshot` do mesmo instante sai idêntico byte a byte. O render determinístico do próprio HyperFrames
(`--docker`) pede o Docker, que é opcional. O caminho do `psnr=stats_file=` vai relativo (o
dois-pontos de `C:` quebra o filtro).

## O Studio e o pacote editável

O editor depois do render é o Studio do HyperFrames, aberto pelo `preview` dentro da
pasta do pacote (no Windows não há o app de desktop; a doc dele fala de Mac e Linux).
O pacote sai do `editavel.mjs` da `/mograph` (o cabeçalho dele diz o que muda na peça). Ele leva uma
cópia da marca do dia, para abrir sem o workspace: é foto, não acompanha a marca, e se gera de novo quando
a marca muda. Medido no pacote de uma peça falada:

- **A prévia toca a edição inteira**: a legenda, as cenas e o som. Página que toca só
  câmera, voz e trilha não é o pacote: é outra coisa.
- **Aparar e recuperar**: arrastar a borda do clip muda o `data-start`, o
  `data-duration` e o `data-media-start` juntos, e puxar de volta traz o que foi
  cortado enquanto a mídia tem o trecho. Por isso o pacote aponta para a gravação
  inteira: o trecho 2 voltou 0,52 s para dentro do corte.
- **Vínculo**: clips com o mesmo `data-link` andam juntos só se a janela for
  idêntica (início, duração e ponto no original). Com o J-cut da voz à parte, a voz
  ficou parada. O `data-timeline-label` dá nome ao clip na timeline.
- **Variáveis**: a declarada no `<html>` (`data-composition-variables`) vira um
  controle no painel Variables, aplicada como `--<id>` na raiz; "Set default"
  grava no HTML. Num elemento que o motor anima, o estilo inline vence a folha
  (`top`, `translate`): a variável age por uma propriedade que ninguém toca
  (a legenda usa `margin-top`).
- **O que ele grava**: no `index.html` (um `data-hf-id` em cada elemento) e as
  pastas `.hyperframes/`, `.thumbnails/` e `.transcode-cache/` na pasta. Por isso
  edita-se o pacote, nunca a peça.
- **O `data-media-start` pega o quadro de baixo**: o trim do corte começa no primeiro
  quadro a partir do ponto, e o motor, no anterior. O pacote alinha o ponto ao quadro
  que o corte usou (medido: um quadro de diferença em toda a câmera).
- **Versão**: o pino é o 0.8.207; contra a 0.8.181, as mesmas peças deram par idêntico nas duas
  versões, entre elas 54 a 56 dB de média (pior quadro 46 a 50), loudness e pico iguais e o resíduo
  do áudio a −46 dBFS. Mexer no áudio pelo Studio cala a composição sem linha do tempo; o pacote tem a
  do GSAP e não sofre disso.
- **Não testado**: mudar o texto da legenda pelo Studio (ela nasce do `dados.js`, e o
  painel Code o abre) e o Export de dentro do Studio.
