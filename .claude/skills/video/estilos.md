# Os estilos de vídeo

Todo pedido de vídeo cai num estilo, e o estilo diz quem atende, o formato, a
legenda, o quanto de motion e a estrutura. O estilo se descobre pelo que o usuário
manda e por onde vai rodar; o que varia dentro do estilo é opção da entrevista da
skill dona, nunca estilo novo. **Cada estilo tem a sua estrutura**: a ficha do § 3
diz o arco, o tempo e o que sai, e a peça segue a do estilo dela.
Como a peça se mexe e soa (o ritmo, o regime do som, a transição, o texto, a cor) é a **linguagem**,
escolhida pela finalidade em `linguagens.md`: o estilo diz a entrega, a linguagem diz o filme.

## 1 · Os eixos

| Eixo | Valores |
|---|---|
| material | `GL` gravação longa pronta · `GF` o usuário falando para a câmera, curto, com tomadas · `TX` texto · `NA` nada gravado · `VT` vídeo de terceiro ou link · `BC` imagem de banco ou gerada por IA, com licença conferida |
| formato | `9:16` 1080x1920 · `4:5` 1080x1350 · `1:1` 1080x1080 · `16:9` 1920x1080 |
| duração | bumper até 6 s · vinheta 1,5 a 3 s no Reel, até 8 s fora dele (aula, live, vídeo longo) · curto 15 a 35 s · Reel pela função (`_memoria/marketing.md`, "Formatos"; sem número lá, atenção e conexão 20 a 45 s, autoridade, prova e conversão 60 a 180 s) · Shorts até 180 s · longo 8 a 25 min |
| legenda | `L0` nenhuma · `L1` só a palavra-chave · `L2` a fala inteira, nas duas vozes · `L3` karaokê (só com referência que o usuário trouxe) · `LF` arquivo .srt enviado à plataforma |
| motion | `M0` corte e legenda · `M1` 1 a 4 momentos · `M2` dirigido, frase a frase |
| destino | orgânico (Reels, TikTok, Shorts, YouTube) · anúncio (Meta, Google) |

## 2 · Os estilos

O código do estilo é o começo do nome da pasta de entrega
(`saidas/<estilo>-<tema>-<AAAA-MM-DD>/`) e o campo `estilo` do `registro.json`.

| Código | O que é | Material | Formato | Legenda padrão | Motion | Quem atende |
|---|---|---|---|---|---|---|
| `longo` | o vídeo do YouTube | `GL`, ou `TX` que vira pauta | 16:9 | `LF` | `M1` | sem porta: os cortes saem pela `/cortes` |
| `explica` | explicativo sem rosto | `TX` | 9:16 (ou 16:9) | `L2` no 9:16, `LF` no 16:9 | `M2` | `/mograph` puro (9:16) |
| `corte` | o trecho do longo | `GL` | 9:16 | `L2` | `M0` | `/cortes` |
| `falado` | o usuário falando, edição simples | `GF` | 9:16 | `L2` | `M0` | `/cortes` modo gravação |
| `falado-motion` | o usuário falando com motion por cima | `GF` | 9:16 | `L2` nas cenas com ele, `L1` nas cenas em que a animação toma a tela | `M2` | `/mograph` falado |
| `motion` | motion puro | `NA` ou `TX` | 9:16 | sem voz `L0`; com voz `L1` | `M2` | `/mograph` puro → `/video` |
| `comercial` | o comercial de produto ou de marca de um negócio, feito a partir do site dele, sem rosto | `NA` (o site, os prints e o produto do cliente) | 16:9 e 9:16 da mesma linha do tempo | `L0`, ou `L1` com narração | `M2` | `/mograph` puro |
| `anuncio-meta` | o criativo do Meta | `GF` ou `NA` | 9:16 (+ 4:5, 1:1) | `L1`, o produto e a oferta escritos | `M1` ou `M2` | `/mograph` com `destino: anuncio` |
| `anuncio-google` | o criativo do YouTube Ads | `GF` ou `NA` | 16:9 (+ 9:16) | `L1`; o nome e a oferta antes de 5 s | `M1` ou `M2` | `/mograph` com `destino: anuncio` e o formato `yt-16x9`; falta a régua dos 5 s |
| `bumper` | o anúncio de 6 s | um recorte, ou `NA` | 16:9 | `L1`, uma frase | `M2` | `/video` P; falta a régua dos 180 quadros |
| `vinheta` | abertura ou assinatura | `NA` | o do vídeo que ela abre, ou o que o pedido disser | `L0` | `M2` | `/video` P |
| `laco` | o laço de interface do site | `NA` | o do cartão | `L0` | `M1` | `/video` |
| `documental` | o minidocumentário ou a história narrada: voz em off, imagem de banco ou gerada, motion discreto, cor natural | `BC` (com `TX` de roteiro) | 9:16 e 16:9 da mesma linha do tempo | `L2` no 9:16, `LF` no 16:9 | `M1` | `/mograph` puro, com a cor do material em `cor.md`; a linguagem é a `documental` (`linguagens.md`, § 2), que o `"estilo": "documental"` do `plano.json` traz |

"Vertical simples" é o `falado` (ou o `corte`). Shorts, TikTok e Stories são
destino, não estilo: o destino puxa a zona do `formatos.json`. O anúncio segue
pela `/mograph`.

## 3 · A estrutura de cada estilo

| Estilo | Duração | O arco | O que sai | Onde a estrutura mora |
|---|---|---|---|---|
| `longo` | 8 a 25 min | capítulos; cartão de capítulo, nome na tela e a prova do que se diz; trilha só na abertura e nas viradas | `final.mp4` 16:9, `.srt`, a miniatura, os capítulos, a lista de 3 a 6 cortes | sem porta |
| `explica` | 45 a 90 s no 9:16 | o orgânico em seis partes, com a voz mandando no tempo | MP4, legenda do post, `.srt` no 16:9 | `.claude/skills/mograph/roteiro.md` |
| `corte` | 15 a 180 s (mira a faixa da função) | o gancho escrito nos 3,5 s, e o trecho que se sustenta sozinho | 2 a 6 MP4, `LEGENDAS.md` ranqueado | `.claude/skills/cortes/SKILL.md` |
| `falado` | fala limpa na faixa da função | a última tomada de cada frase, o punch-in nos cortes, o fato com fonte em tela cheia | `final.mp4`, `final-sem-trilha.mp4`, `capa.png`, `RELATORIO.md` | `.claude/skills/cortes/gravacao.md` |
| `falado-motion` | a faixa da função | um tipo de cena por frase (legenda, legenda com interface, meia tela, tela cheia); o rosto volta a cada 8 s | o do `falado`, mais `brief.md`, `plano.json` e a página de revisão | `.claude/skills/mograph/cenas.md` |
| `motion` | 15 a 60 s | o orgânico em seis partes, ou a peça com partes; a trilha medida antes do plano e o drop no pico | MP4, capa, legenda do post, página de revisão | `.claude/skills/mograph/roteiro.md` |
| `comercial` | 20 a 30 s | o site e o produto lidos antes (o print da página, a identidade); o pensamento do vídeo cena a cena no `plano.json`; a interface, o texto e a marca em código, e o 3D ou a foto que o código não faz por vídeo gerado por baixo (`cenas.md`, "O fundo"); o 16:9 e o 9:16 por duplicação, reposicionados e nunca esticados; o fecho na marca do cliente | os dois MP4, a capa, a página de revisão | a espinha `comercial` do `roteiro.md` da `/mograph` |
| `anuncio-meta` | 25 a 35 s | a espinha de anúncio: o produto dito e escrito até 3 s, a oferta até 8 s e de novo nos últimos 5 s | o 9:16 e, quando pedido, o 4:5 e o 1:1 da mesma linha do tempo | `.claude/skills/mograph/roteiro.md` e `voz.md` |
| `anuncio-google` | pulável: abaixo de 3 min; não pulável: 7 a 15 s | o nome e a oferta antes de 5 s, porque depois disso a pessoa pula | o 16:9, e o 9:16 para o Shorts | a espinha de anúncio do `roteiro.md` da `/mograph` |
| `bumper` | 6,0 s (180 quadros) | uma ideia, uma frase de até ~40 caracteres, e a marca | o 16:9 | `metodo.md`, tamanho P |
| `vinheta` | 1,5 a 3 s antes de um Reel; até 8 s antes de aula, live ou vídeo longo, que a pessoa já escolheu assistir | a marca assentando, no máximo um efeito na assinatura, e o fim parado; sem linguagem de ritmo (`linguagens.md`, "A vinheta não tem linguagem de ritmo") | só o MP4 | `metodo.md`, tamanho P |
| `laco` | o do cartão | o laço sem som, que volta ao quadro 0 sem salto | o MP4 do cartão do site | `.claude/video/README.md` |
| `documental` | 45 a 90 s | a história em três atos (a situação, a virada, o depois), a voz manda no tempo, o respiro na virada; a regra do componente com volume em toda cena e a de um som por ação não se aplicam, e o dissolver com causa volta (as réguas leem o estilo pelo `linguagens.json`, onde mora o que ele dispensa) | os dois MP4, o `.srt`, a página de revisão | o `roteiro.md` da `/mograph` e a `cor.md` |

## 4 · O destino

| Destino | `formato` no plano | A zona (topo / base / lados, px) |
|---|---|---|
| Reels orgânico | `reel` | 220 / 1540 / 65 (a conferir num print do aplicativo) |
| anúncio de Reels e Stories da Meta | `anuncio-reels` | 270 / 1248 / 65 (guia oficial de anúncios da plataforma) |
| YouTube Shorts | `shorts` | 270 / 1248 / 65 (sem oficial; a do anúncio, por prudência) |
| TikTok | `tiktok` | 270 / 1248 / 65 (idem) |
| feed do Facebook, 4:5 | `meta-feed-4x5` | margem de 6% (HIPÓTESE) |
| quadrado | `quadrado-1x1` | margem de 6% (HIPÓTESE) |
| YouTube e Google in-stream | `yt-16x9` | margem de 5% (HIPÓTESE) |

Um pedido com dois destinos é uma peça só, com a zona mais apertada dos dois. O
volume é um só para todos: −14 LUFS integrado, pico verdadeiro abaixo de −1 dBTP
(nenhuma plataforma publica LUFS oficial; é alvo de mercado). A ficha de legenda
se confere na zona do destino:

```bash
node .claude/skills/video/ferramentas/ficha-no-destino.mjs <ficha.json> anuncio-reels
```

## 5 · A legenda por estilo

O modo é um campo da peça (`"legenda": "L1"` no `plano.json` ou na `peca.json`),
nunca uma skill. Todas saem da mesma transcrição (`scripts/transcrever.py` →
`palavras.json`) e da mesma lista de correções de nome. As fichas moram na
`/cortes` (`.claude/skills/cortes/reel/legendas/`).

- **A cara da legenda**: duas vozes, sem serifa. A palavra forte com ~2,5 vezes o
  tamanho do resto, na cor de destaque e na fonte do `tokens.css` da marca; o
  resto pequeno e claro. Uma palavra forte por frase (`.claude/skills/cortes/legenda.md`).
- **Quanto de legenda**: a fala inteira quando o usuário está na tela; só a palavra
  forte nas cenas em que a animação toma a tela.

## 6 · A entrevista de abertura

Uma chamada de pergunta, com a recomendada primeiro. **O que o pedido já disse não
se pergunta.** Quatro perguntas decidem o estilo; a quinta existe só no anúncio.

| # | Pergunta | Opções | Decide |
|---|---|---|---|
| 1 | O que você está me mandando? | uma gravação longa pronta · você falando para a câmera · um texto · nada, é do zero | material |
| 2 | Onde vai rodar? | Reels, TikTok ou Shorts · YouTube · anúncio no Meta · anúncio no Google | destino e formato |
| 3 | Quanto de edição? | simples (corte e legenda) · com momentos de motion · motion do começo ao fim | motion |
| 4 | E a legenda? | a padrão do estilo (dita na opção) · a fala inteira · só a palavra-chave · nenhuma | legenda |
| 5 | (anúncio) O que vende, e quantas versões? | a oferta atual da memória · outra · uma versão ou três ganchos | a oferta pela `/copy` e a matriz |

```
gravação longa ─┬─ YouTube ────────────────────────────► longo
                └─ Reels / TikTok / Shorts ────────────► corte
você falando ───┬─ orgânico ─┬─ simples ───────────────► falado
                │            └─ com motion ────────────► falado-motion
                └─ anúncio ────────────────────────────► anuncio-meta / anuncio-google
texto ──────────┬─ YouTube ────────────────────────────► longo (pauta) ou explica 16:9
                └─ vertical ───────────────────────────► explica / motion
do zero ────────┬─ orgânico ───────────────────────────► motion (vinheta se até 3 s)
                └─ anúncio ────────────────────────────► anuncio-* puro / bumper
```

Depois, a skill dona faz a entrevista dela (a mini-entrevista da `/video`, a
sabatina da `/mograph`, o passo 0 da `/cortes`), sem repetir o que esta resolveu.

## 7 · O registro da entrega

Toda entrega de vídeo leva na pasta o `RELATORIO.md` e a `LEGENDA.md` (os nomes são esses, em maiúscula); a `vinheta`, o `bumper` e o `laco`, que não têm post próprio, levam só o `RELATORIO.md`. O relatório segue o modelo de
`ferramentas/modelo-relatorio.md`, e toda entrega leva o `registro.json`, com os campos e a régua de
`ferramentas/indice-videos.mjs`. O índice das peças sai dos registros, nunca à mão:

```bash
node .claude/skills/video/ferramentas/indice-videos.mjs conferir saidas
node .claude/skills/video/ferramentas/indice-videos.mjs indice saidas --md saidas/_videos.md
```

O índice cobre as entregas em andamento em `saidas/`. Quando a peça fecha, o vídeo
final e a capa vão com a fonte da peça (o projeto dela ou a pasta de conteúdo do
workspace), fora do git; a direção que ela fixou entra no leque da `/mograph`
(`.claude/skills/mograph/acervo/direcoes.md`). Sem entrega em andamento, o
`conferir` diz "nada a conferir", e nunca verde.
