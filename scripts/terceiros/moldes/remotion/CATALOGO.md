# Catálogo — o que o Remotion faz de verdade

> **O mapa deste workspace, na versão 4.0.516.** Mora na raiz do plugin, fora
> de `skills/` e `templates/`, e sai do molde
> `scripts/terceiros/moldes/remotion/CATALOGO.md`: mudança se faz lá, e trocar
> de versão pede rever este mapa junto.

---

## Por que este arquivo existe

O material está todo aqui: as 12 skills têm 29 arquivos de referência, e o
`remotion-markup/SKILL.md` é um roteador que aponta pra todos eles. O risco não
é falta de informação, é não abrir o material e cair sempre no mesmo punhado de
recursos:

| O que sai por inércia | O que existe e fica de fora |
|---|---|
| `interpolate()` em tudo | `spring()`, que dá peso ao movimento |
| Transição: **só `slide`, com `linearTiming`** | 18 outras transições |
| 4 pacotes instalados | ~20 pacotes disponíveis |
| Zero efeito de pixel | **~58 efeitos** prontos |

Fade e slide são o padrão de quem não escolheu, não uma decisão de direção.

## A regra que sai daqui

**Antes de construir qualquer vídeo, abrir este catálogo e escolher a técnica de
propósito.** Escolher inclui escolher o simples: fade resolve muita coisa. O que
não vale é cair nele por inércia.

Escolhida a técnica, carregar o arquivo de referência dela em
`skills/remotion-markup/` antes de escrever o código. O nome do arquivo está na
última coluna de cada tabela abaixo.

---

## 1 · Movimento base

Como o valor anda no tempo. É a camada que muda a sensação mais que qualquer
efeito.

| Recurso | O que faz | Referência |
|---|---|---|
| `interpolate()` | Valor A → valor B, linear ou com easing | `timing.md` |
| `spring()` | Movimento com massa e amortecimento. **É o que separa "profissional" de "escorregando"** | `timing.md` |
| `Easing.bezier()` / `Easing.spring()` | Curva customizada dentro do `interpolate` | `timing.md` |
| `random()` | Aleatório **determinístico** (mesma seed = mesmo frame). Aleatório comum quebra o render | — |
| `@remotion/noise` `noise2D/3D/4D` | Ruído Perlin: movimento orgânico, tremor de câmera, ondulação | — |
| `@remotion/animation-utils` `interpolateStyles()` | Interpola um **objeto de estilo inteiro** entre keyframes, não valor por valor | — |

⚠️ Vídeo inteiro só com `interpolate()` e quase nenhum `spring()` é o sintoma mais claro da inércia.

## 2 · Cena e sequência

| Recurso | O que faz | Referência |
|---|---|---|
| `<Sequence>` | Corta um trecho no tempo, com `from` e `durationInFrames` | `sequencing.md` |
| `<Series>` | Cenas em fila, sem calcular offset na mão | `sequencing.md` |
| `<TransitionSeries>` | Fila de cenas **com transição no corte** | `transitions.md` |
| `<TransitionSeries.Overlay>` | Efeito **por cima** do corte, sem encurtar a linha do tempo | `transitions.md` |
| `<Loop>` | Repete um trecho | `sequencing.md` |
| `<Freeze>` | Congela num frame | — |
| `calculateMetadata()` | Duração e tamanho decididos **em runtime**, a partir dos dados | `calculate-metadata.md` |

## 3 · Transição entre cenas

19 prontas, e dá pra escrever a sua.

| Família | As opções |
|---|---|
| Dissolver | `fade`, `dissolve`, `none` |
| Deslizar | `slide`, `push-cut`, `swap`, `wipe` |
| Zoom | `zoom-in-out`, `cross-zoom`, `dreamy-zoom`, `zoom-blur` |
| Girar / virar | `flip`, `book-flip` |
| Máscara | `iris`, `clock-wipe` |
| Textura / distorção | `film-burn`, `crosswarp`, `ripple`, `linear-blur` |

**Timing separado da aparência:** `linearTiming()` (o mais chapado) ou
`springTiming()`, que dá peso ao corte. Custom: `presentations/custom`.

📄 `transitions.md`

## 4 · Efeito de pixel (~58)

Aplicados via prop `effects={[...]}` em `<Video>`, `<Img>`, `<Solid>`,
`<CanvasImage>`, `<Gif>`, `<HtmlInCanvas>` e nas formas do `@remotion/shapes`.

| Intenção | Efeitos |
|---|---|
| Cor | `brightness`, `contrast`, `saturation`, `vibrance`, `hue`, `tint`, `duotone`, `grayscale`, `invert`, `exposure`, `levels`, `whiteBalance`, `shadowsHighlights`, `colorCorrection` |
| Desfoque | `blur`, `gaussianBlur`, `linearProgressiveBlur`, `radialProgressiveBlur`, `regionBlur`, `zoomBlur` |
| Luz | `glow`, `lightLeak`, `lightTrail`, `shine`, `starburst`, `vignette`, `dropShadow` |
| Textura analógica | `paper`, `burlap`, `flannel`, `speckle`, `roughenEdges`, `scanlines`, `whiteNoise`, `tvSignalOff`, `thermalVision` |
| Trama / meio-tom | `halftone`, `halftoneLinearGradient`, `dotGrid`, `checkerboard`, `gridlines`, `lines`, `rings`, `pattern`, `tile` |
| Pixel | `pixelate`, `linearProgressivePixelate`, `radialProgressivePixelate`, `pixelDissolve` |
| Lente | `barrelDistortion`, `fisheye`, `chromaticAberration`, `cornerPin`, `mirror`, `skew`, `scale`, `uvTranslate`, `xyTranslate` |
| Deformação | `wave`, `waves`, `zigzag`, `noiseDisplacement`, `liquidContours`, `contourLines`, `shrinkwrap`, `emboss`, `venetianBlinds`, `evolve` |
| Recorte | `colorKey`, `outline` |

⚠️ **O que joga contra:** roda em WebGL2 e exige
`Config.setChromiumOpenGlRenderer('angle')` no render. Custa tempo de render, e
efeito empilhado custa mais. Não é decoração de graça.

📄 `effects.md`, `light-leaks.md`

## 5 · Texto

| Recurso | O que faz | Referência |
|---|---|---|
| Marcação e anotação | Marca-texto, círculo, sublinhado, riscado, caixa (`rough-notation`) | `text-highlights.md` |
| `@remotion/layout-utils` `fitText()` | **Calcula o tamanho que cabe na largura.** Fim do texto estourando | `measuring-text.md` |
| `measureText()` | Mede antes de desenhar | `measuring-text.md` |
| Legenda | Transcrever, exibir palavra a palavra, animar | skill `remotion-captions` |
| Fontes | Google Fonts e fonte local | `google-fonts.md`, `local-fonts.md` |
| `rounded-text-box` | Caixa de texto com canto arredondado que acompanha a linha | — |

## 6 · Forma e traço

É o que mais falta nos reels.

| Recurso | O que faz |
|---|---|
| `@remotion/shapes` | SVG pronto e animável: `Circle`, `Rect`, `Triangle`, `Star`, `Polygon`, `Ellipse`, `Heart`, `Pie`, `Arrow`, `Callout`, `Spark` |
| `@remotion/paths` `evolvePath()` | **Desenha a linha na tela**, do início ao fim. É o efeito de traço que se desenha sozinho |
| `interpolatePath()` | Transforma uma forma em outra (morph) |
| `getPointAtLength()` / `getTangentAtLength()` | Move um objeto **ao longo** de um caminho, virado pra direção certa |
| `warpPath()`, `scalePath()`, `reversePath()` | Deforma, escala, inverte |

## 7 · Mídia

| Recurso | Referência |
|---|---|
| Vídeo: cortar, volume, velocidade, loop, pitch | `embedding-videos.md` |
| Áudio: mesmo conjunto | `audio.md` |
| Recorte de área visível | `cropping.md` |
| GIF sincronizado com a timeline | `gifs.md` |
| Imagem: dimensão dinâmica, posicionamento | `images.md` |
| Lottie | `lottie.md` |
| Emoji animado do Google (`@remotion/animated-emoji`) | — |
| Timeline editável no Studio | `video-editing.md` |

## 8 · Áudio

| Recurso | Referência |
|---|---|
| Visualização: barra de espectro, onda, reação ao grave | `audio-visualization.md` |
| Locução por IA (ElevenLabs) | `voiceover.md` |
| Efeito sonoro | `sfx.md` |
| Detecção de silêncio (corte automático) | `silence-detection.md` |

## 9 · Movimento avançado

| Recurso | O que faz |
|---|---|
| `@remotion/motion-blur` `<Trail>` | Rastro: duplica o conteúdo em camadas atrasadas |
| `<CameraMotionBlur>` | Borrão de câmera real. ⚠️ **destrói cor**, manter `samples` baixo |
| `@remotion/three` | 3D via Three.js / React Three Fiber (`3d.md`) |
| `@remotion/skia` | Desenho 2D de alto desempenho |
| `@remotion/rive` | Animação Rive interativa |
| `@remotion/gsap` | **Timeline GSAP dentro do Remotion**, determinística |
| `<HtmlInCanvas>` | Joga HTML no canvas pra aceitar efeito de pixel (`html-in-canvas.md`) |
| Mapa | Rota animada, marcador, sobrevoo (skill `remotion-maps`) |

🅿️ **`@remotion/gsap` exige 4.0.517; o plugin aqui está em 4.0.516.** Pra usar,
sobe a versão primeiro (skill `remotion-upgrade`). O workspace já tem uma skill
`/gsap` de GSAP para web, que é outra coisa: aquela é pra site, esta seria pra
vídeo.

## 10 · Interatividade

Aqui "interativo" tem dois sentidos, e eles não se misturam:

| Sentido | O que é |
|---|---|
| **Editável no Studio** | `<Interactive.Div name="...">` faz o elemento virar clicável, arrastável e com keyframe editável na interface. Fica no vídeo exportado como pixel comum |
| **Player no navegador** | `@remotion/player` embute o vídeo numa página React, reagindo a props, clique e estado. Aí sim é interativo pro usuário final |

📄 skill `remotion-interactivity` (o primeiro), skill `remotion-saas` (o segundo)

---

## Os pacotes

Um projeto novo costuma nascer com `remotion`, `@remotion/cli`,
`@remotion/media`, `@remotion/transitions`, `@remotion/google-fonts` e
`@remotion/tailwind-v4`.

**Instalar quando precisar** (`npx remotion add <pacote>`): `effects`,
`shapes`, `paths`, `noise`, `motion-blur`, `animation-utils`, `layout-utils`,
`animated-emoji`, `light-leaks`, `three`, `skia`, `rive`, `gsap`, `player`.

⚠️ Todo pacote `@remotion/*` precisa ficar **na mesma versão** do `remotion`.

## O que joga contra, na cara

- **Efeito custa render.** WebGL2 empilhado multiplica o tempo. Reels de 30s com
  oito efeitos vira minuto de máquina, e a máquina é a sua
- **Nem toda técnica melhora a peça.** Catálogo grande convida a espalhar
  efeito, e efeito que grita trabalha contra a marca. O tom visual é o da sua
  marca (`identidade/design-guide.md`)
- **Este documento envelhece.** É de 4.0.516, e o Remotion lança rápido (o gsap
  saiu na versão seguinte). Ao trocar de versão, conferir aqui
- **Nada disto resolve roteiro.** Vídeo ruim com 58 efeitos continua ruim
