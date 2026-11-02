#!/usr/bin/env node
// O gerador da marca: lê `identidade/marca.tokens.json` e escreve o que cada
// superfície lê. Os tradutores são gerados, nunca copiados à mão.
//
//   node scripts/marca/gerar.mjs              escreve todas as saídas
//   node scripts/marca/gerar.mjs --conferir   só diz o que está velho (sai 1 se algo estiver)
//
// | Saída                                          | Quem lê                                   |
// |------------------------------------------------|-------------------------------------------|
// | .claude/skills/carrossel/marca/tokens.css      | carrossel, HyperFrames (junção _marca)    |
// | .claude/skills/carrossel/marca/logo/, fontes/  | a cópia do logo e da fonte local          |
// | identidade/gerado/marca.css                    | /novo-projeto, /design-de-produto, SEO    |
// | identidade/gerado/marca.json                   | scripts (guardanapo, relatório, réguas)   |
// | identidade/gerado/movimento.js e .json         | /video, /mograph, Remotion                |
// | .claude/skills/carrossel/marca/movimento.js    | HyperFrames e Reel falado (junção _marca) |
// | .claude/video/src/marca.ts                     | Remotion                                  |
// | identidade/gerado/prompt-imagem.md             | /gerar-imagem                             |
// | identidade/gerado/icone.svg                    | o ícone de aba do site e do app           |
//
// Sem marca configurada, cada saída sai no estado "não configurado": o
// tokens.css nos valores de demonstração do molde, com a linha
// `ESTADO: nao-configurado`; as outras com o aviso, e quem lê para com a
// mesma frase ("a marca não está configurada: rode /marca").
//
// Prova: scripts/marca/teste-gerar.mjs

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { join, dirname, resolve, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { lerMarca, lerMolde, raizPadrao, MENSAGEM, RAIZ } from './marca.mjs'
import { derivarMarca, canaisDe, rgbDe, opacidade } from './derivar.mjs'

export const CABECALHO = 'GERADO por scripts/marca/gerar.mjs a partir de identidade/marca.tokens.json: não edite'
const SKILL_CARROSSEL = '.claude/skills/carrossel'
const PREFIXO_FONTES = `/${SKILL_CARROSSEL}/marca/fontes/`

export const DESTINOS = Object.freeze({
  tokens: `${SKILL_CARROSSEL}/marca/tokens.css`,
  css: 'identidade/gerado/marca.css',
  json: 'identidade/gerado/marca.json',
  movimentoJs: 'identidade/gerado/movimento.js',
  movimentoJson: 'identidade/gerado/movimento.json',
  movimentoMarca: `${SKILL_CARROSSEL}/marca/movimento.js`,
  remotion: '.claude/video/src/marca.ts',
  prompt: 'identidade/gerado/prompt-imagem.md',
  icone: 'identidade/gerado/icone.svg'
})
const COPIAS = { logo: `${SKILL_CARROSSEL}/marca/logo`, fontes: `${SKILL_CARROSSEL}/marca/fontes` }

// ─── formatos ──────────────────────────────────────────────────────────────

const GENERICAS = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-sans-serif', 'ui-serif', 'ui-monospace'])
const pilha = (familia) => familia.map((f) => (GENERICAS.has(f) || /^[A-Za-z-]+$/.test(f) ? f : `'${f}'`)).join(', ')
const bezier = (c) => `cubic-bezier(${c.join(', ')})`
const caminhoGsap = (c) => `M0,0 C${c[0]},${c[1]} ${c[2]},${c[3]} 1,1`
const segundos = (ms) => `${Math.round(ms) / 1000}s`
const rgba = (hex, alfa) => (alfa >= 1 ? `rgb(${canaisDe(hex)})` : `rgba(${canaisDe(hex)},${String(alfa).replace(/^0\./, '.')})`)
const sombraCss = (camadas) => camadas.map((s) => `${s.inset ? 'inset ' : ''}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${rgba(s.cor, s.alfa)}`).join(', ')
const urlsDe = (r) => [...new Set(['display', 'destaque', 'mono'].map((p) => r.fonte[p].url).filter(Boolean))]
const locaisDe = (r) => ['display', 'destaque', 'mono'].map((p) => r.fonte[p]).filter((f) => f.arquivo)

function facesCss (r) {
  const vistos = new Set()
  return locaisDe(r).filter((f) => !vistos.has(f.arquivo) && vistos.add(f.arquivo)).map((f) =>
    `@font-face{font-family:'${f.familia[0]}';src:url('${PREFIXO_FONTES}${basename(f.arquivo)}');font-weight:100 900;font-style:${f.estilo};font-display:swap}`)
}

// ─── o tokens.css do carrossel ─────────────────────────────────────────────

/**
 * O CSS do carrossel com os nomes de variável de sempre (o kit, a junção
 * `_marca` do HyperFrames e o Reel falado leem estes nomes), mais a curva, as
 * durações, o raio e a sombra da marca.
 */
export function cssDoCarrossel (r, { configurada }) {
  const d = derivarMarca(r.cor.papel)
  if (d.erros.length) throw new Error(`gerar: a marca não fecha o contraste: ${d.erros.join('; ')}`)
  const c = r.cor.papel
  const k = d.carrossel
  const ch = (hex) => canaisDe(hex)
  const op = (token) => opacidade(k.alfas[token])
  const pilula = r.raio.pilula
  const estado = configurada
    ? 'A marca configurada de quem usa o workspace.'
    : 'ESTADO: nao-configurado\n   Os valores abaixo são a DEMONSTRAÇÃO do molde (identidade/marca.molde.tokens.json),\n   para o catálogo abrir antes da entrevista. O render do carrossel só usa\n   isto com --demo; o vídeo e o Reel param até a marca existir (rode /marca).'
  const imports = urlsDe(r).map((u) => `@import url('${u}');`).join('\n')
  const faces = facesCss(r).join('\n')
  return `/* ==========================================================================
   ${CABECALHO}
   ==========================================================================
   ${estado}

   Para trocar a marca: /marca trocar (ou edite identidade/marca.tokens.json e
   rode node scripts/marca/gerar.mjs). Os canais RGB soltos (\`${ch(c.acento)}\`) servem
   ao sólido \`rgb(var(--c-accent))\` e à transparência \`rgba(var(--c-accent),.13)\`.
   ========================================================================== */

${imports}${imports && faces ? '\n' : ''}${faces}

:root{

  /* ---- 1. PALETA: os 8 papéis da marca --------------------------------- */
  --c-dark:        ${ch(c.principal)};   /* principal */
  --c-light:       ${ch(c.claro)};   /* claro */
  --c-accent:      ${ch(c.acento)};   /* acento */
  --c-support-1:   ${ch(c.apoio)};   /* apoio */
  --c-support-2:   ${ch(c.lavado)};   /* lavado */
  --c-rare:        ${ch(c.raro)};   /* raro */
  --c-abyss:       ${ch(c.abismo)};   /* abismo */
  --c-ok:          ${ch(c.ok)};   /* ok */

  /* ---- os papéis derivados (scripts/marca/derivar.mjs): o texto usa o
     papel que passa no contraste ------------------------------------------ */
  --c-on-light:     ${ch(k.textoClaro)};   /* texto sobre o claro */
  --c-bg-dark:      ${ch(k.fundoEscuro)};   /* o fundo escuro e o fecho */
  --c-accent-light: ${ch(k.acentoClaro)};   /* destaque em texto no claro */
  --c-accent-dark:  ${ch(k.acentoEscuro)};   /* destaque em texto no escuro */
  --c-accent-photo: ${ch(k.acentoFoto)};   /* destaque em texto sobre foto */

  /* ---- 2. TIPOGRAFIA --------------------------------------------------- */
  --f-display: ${pilha(r.fonte.display.familia)};
  --f-serif:   ${pilha(r.fonte.destaque.familia)};
  --f-mono:    ${pilha(r.fonte.mono.familia)};
  --f-serif-style: ${r.fonte.destaque.estilo};

  --w-display-bold: ${r.fonte.peso.forte};
  --w-display-med:  ${r.fonte.peso.medio};
  --w-mono-med:     ${r.fonte.peso.mono};

  /* ---- 3. CORES RESOLVIDAS --------------------------------------------- */
  --bg-dark:        rgb(var(--c-bg-dark));
  --bg-light:       rgb(var(--c-light));
  --bg-abyss:       rgb(var(--c-abyss));
  --accent:         rgb(var(--c-accent-light));
  --support-1:      rgb(var(--c-support-1));
  --support-2:      rgb(var(--c-support-2));
  --rare:           rgb(var(--c-rare));
  --ok:             rgb(var(--c-ok));

  --on-dark:        rgb(var(--c-light));
  --on-dark-90:     rgba(var(--c-light),${op('on-dark-90')});
  --on-dark-82:     rgba(var(--c-light),${op('on-dark-82')});
  --on-dark-74:     rgba(var(--c-light),${op('on-dark-74')});
  --on-dark-60:     rgba(var(--c-light),${op('on-dark-60')});
  --on-dark-55:     rgba(var(--c-light),${op('on-dark-55')});
  --on-dark-50:     rgba(var(--c-light),${op('on-dark-50')});
  --on-dark-40:     rgba(var(--c-light),${op('on-dark-40')});

  --on-light:       rgb(var(--c-on-light));
  --on-light-82:    rgba(var(--c-on-light),${op('on-light-82')});
  --on-light-72:    rgba(var(--c-on-light),${op('on-light-72')});
  --on-light-66:    rgba(var(--c-on-light),${op('on-light-66')});
  --on-light-50:    rgba(var(--c-on-light),${op('on-light-50')});
  --on-light-45:    rgba(var(--c-on-light),${op('on-light-45')});

  --line-dark:        rgba(var(--c-light),.13);
  --line-dark-soft:   rgba(var(--c-light),.09);
  --line-dark-strong: rgba(var(--c-light),.17);
  --line-light:        rgba(var(--c-on-light),.13);
  --line-light-soft:   rgba(var(--c-on-light),.10);
  --line-light-strong: rgba(var(--c-on-light),.15);

  --accent-line:  rgba(var(--c-accent),.55);
  --accent-ring:  rgba(var(--c-accent),.28);
  --accent-halo:  rgba(var(--c-accent),.50);

  --track-dark:   rgba(var(--c-light),.16);
  --track-light:  rgba(var(--c-on-light),.13);
  --scrim:        rgba(var(--c-bg-dark),.45);
  --veil-bottom:  rgba(var(--c-bg-dark),.55);

  --shadow-dark:  ${sombraCss(r.sombra.escura)};
  --shadow-light: ${sombraCss(r.sombra.clara)};

  --grad-cta:   rgb(var(--c-bg-dark));
  --grad-brand: rgb(var(--c-support-1));

  /* os semáforos da janela do sistema: chrome, não cor de marca */
  --mac-r: #ff5f57; /* tecnico */
  --mac-y: #febc2e; /* tecnico */
  --mac-g: #28c840; /* tecnico */

  --grid-dark:  rgba(var(--c-light),.07);
  --grid-light: rgba(var(--c-on-light),.07);

  /* ---- 4. MOVIMENTO, RAIO E MEDIDAS ------------------------------------ */
  --ease-marca:   ${bezier(r.movimento.curva.principal)};
  --ease-entrada: ${bezier(r.movimento.curva.entrada)};
  --ease-saida:   ${bezier(r.movimento.curva.saida)};
  --dur-rapida:   ${segundos(r.movimento.duracao.rapida)};
  --dur-media:    ${segundos(r.movimento.duracao.media)};
  --dur-lenta:    ${segundos(r.movimento.duracao.lenta)};
  --cascata:      ${segundos(r.movimento.cascata)};

  --r-card:    ${r.raio.lg}px;
  --r-card-lg: ${r.raio.cartao}px;
  --r-button:  ${pilula ? '999px' : `${r.raio.md}px`};
  --r-chip:    ${pilula ? '999px' : `${r.raio.md}px`};
  --r-bar:     ${r.raio.sm}px;

  /* o canvas 4:5 do feed e a escala do kit: medidas técnicas do formato */
  --canvas-w: 1080px;
  --canvas-h: 1350px;
  --pad-x:      90px;
  --pad-top:    84px;
  --pad-bottom: 74px;
  --pad-post:   92px;
  --fs-h1:       82px;  --lh-h1: 1.02;  --ls-h1: -.035em;
  --fs-h1-post:  88px;
  --fs-h1-cta:   76px;
  --fs-h2:       62px;  --lh-h2: 1.05;  --ls-h2: -.03em;
  --fs-lead:     30px;
  --fs-sub:      28px;
  --fs-list:     33px;
  --fs-kicker:   20px;
  --fs-tag:      19px;
  --fs-handle:   21px;
  --fs-count:    18px;
  --fs-term:     25px;
  --fs-num:     280px;
  --fs-btn:      24px;
  --max-h1:   900px;
  --max-h2:   860px;
  --max-sub:  820px;
  --max-body: 840px;
  --max-term: 880px;
  --ls-tag:    .28em;
  --ls-kicker: .28em;
  --ls-count:  .12em;
  --ls-label:  .22em;
}

/* o destaque em texto sobre o fundo escuro (as superfícies de texto claro do kit): o acento, ou o claro quando ele não passa */
.slide.dark, .slide.cta { --accent: rgb(var(--c-accent-dark)); }
/* e sobre foto (as superfícies com --img): o acento só se for claro o bastante para o véu ralo, senão o claro */
.slide.cover, .slide.photo, .slide.full { --accent: rgb(var(--c-accent-photo)); }
`
}

// ─── o marca.css da web ────────────────────────────────────────────────────

const temaShadcn = (raiz) => {
  const p = join(raiz, '.claude/skills/novo-projeto/esqueleto/templates/tema.projeto.css')
  const fonte = existsSync(p) ? p : join(RAIZ, '.claude/skills/novo-projeto/esqueleto/templates/tema.projeto.css')
  return readFileSync(fonte, 'utf8').replace(/^\/\*[\s\S]*?\*\/\s*/, '').trim()
}

export function cssDaWeb (r, raiz) {
  const d = derivarMarca(r.cor.papel)
  const i = d.interface
  const canal = (hex) => canaisDe(hex).split(',').join(', ')
  const linha = (nome, hex) => `  --c-${nome}: ${canal(hex)};`
  const nomes = ['primaria', 'fundo', 'texto', 'primaria-texto', 'superficie', 'superficie-2', 'borda', 'apagado', 'erro', 'aviso', 'sucesso', 'fundo-escuro', 'texto-escuro', 'apagado-escuro', 'primaria-escuro', 'erro-escuro']
  const primariaEscuroTexto = (() => { const c = rgbDe(i['primaria-escuro']); return (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) > 150 ? '#000000' : '#ffffff' })()
  const espacos = Object.entries(r.espaco).map(([k, v]) => `  --espaco-${k}: ${v}px;`).join('\n')
  const imports = urlsDe(r).map((u) => `@import url("${u}");`).join('\n')
  return `/* ${CABECALHO}
   A marca na web: os papéis de interface (scripts/marca/derivar.mjs) e o
   tema do shadcn em variáveis. O /novo-projeto gera o projeto na mesma regra;
   a /design-de-produto e o relatório do /seo-geo-aeo leem daqui. */
${imports ? `\n${imports}\n` : ''}
:root {
  /* os papéis da marca */
${Object.entries(r.cor.papel).map(([k, v]) => `  --cor-${k}: ${v};`).join('\n')}

  /* os papéis de interface, em canais */
${nomes.map((n) => linha(n, i[n])).join('\n')}
  --c-primaria-escuro-texto: ${canal(primariaEscuroTexto)};

  --f-display: ${pilha(r.fonte.display.familia)};
  --f-destaque: ${pilha(r.fonte.destaque.familia)};
  --f-mono: ${pilha(r.fonte.mono.familia)};
  --peso-forte: ${r.fonte.peso.forte};
  --peso-medio: ${r.fonte.peso.medio};
  --peso-mono: ${r.fonte.peso.mono};

  --r-sm: ${r.raio.sm}px;
  --r-md: ${r.raio.md}px;
  --r-lg: ${r.raio.lg}px;
  --r-cartao: ${r.raio.cartao}px;
  --r-botao: ${r.raio.pilula ? '999px' : `${r.raio.md}px`};
${espacos}
  --sombra-clara: ${sombraCss(r.sombra.clara)};
  --sombra-escura: ${sombraCss(r.sombra.escura)};

  --ease-marca: ${bezier(r.movimento.curva.principal)};
  --ease-entrada: ${bezier(r.movimento.curva.entrada)};
  --ease-saida: ${bezier(r.movimento.curva.saida)};
  --dur-rapida: ${segundos(r.movimento.duracao.rapida)};
  --dur-media: ${segundos(r.movimento.duracao.media)};
  --dur-lenta: ${segundos(r.movimento.duracao.lenta)};
  --cascata: ${segundos(r.movimento.cascata)};
}

/* o tema do shadcn, nos papéis acima (o mesmo do /novo-projeto) */
${temaShadcn(raiz)}
`
}

// ─── o movimento ───────────────────────────────────────────────────────────

export function dadosDeMovimento (r) {
  if (!r) return { configurada: false, motivo: MENSAGEM }
  const m = r.movimento
  const por = (f) => Object.fromEntries(Object.entries(m.curva).map(([k, v]) => [k, f(v)]))
  return {
    configurada: true,
    curva: por((v) => v),
    css: por(bezier),
    gsap: por(caminhoGsap),
    duracao: Object.fromEntries(Object.entries(m.duracao).map(([k, v]) => [k, v / 1000])),
    duracaoMs: { ...m.duracao },
    cascata: m.cascata / 1000,
    cascataMs: m.cascata
  }
}

function movimentoJs (dados) {
  return `/* ${CABECALHO}
   O movimento da marca para o navegador (HyperFrames, página) e para o
   Remotion. Script comum, sem export: carregado por <script> ou importado,
   ele põe globalThis.MARCA_MOVIMENTO. Com o GSAP e o CustomEase na página,
   registra as curvas "marca", "marca-entrada" e "marca-saida". */
(function (raiz) {
  var M = ${JSON.stringify(dados, null, 2).split('\n').join('\n  ')};
  M.exigeMarca = function () {
    if (!M.configurada) throw new Error(${JSON.stringify(MENSAGEM)});
  };
  M.registrar = function (gsap, CustomEase) {
    M.exigeMarca();
    gsap.registerPlugin(CustomEase);
    CustomEase.create("marca", M.gsap.principal);
    CustomEase.create("marca-entrada", M.gsap.entrada);
    CustomEase.create("marca-saida", M.gsap.saida);
  };
  raiz.MARCA_MOVIMENTO = M;
  if (M.configurada && raiz.gsap && raiz.CustomEase) M.registrar(raiz.gsap, raiz.CustomEase);
})(typeof globalThis !== "undefined" ? globalThis : this);
`
}

// ─── o Remotion ────────────────────────────────────────────────────────────

// Sem marca, o arquivo tem os mesmos nomes (a peça compila), vazios, e o
// exigeMarca() para com a frase única antes do primeiro quadro.
const MARCA_TS_VAZIA = {
  cor: { principal: '', claro: '', acento: '', apoio: '', lavado: '', raro: '', abismo: '', ok: '' },
  fonte: { display: { familia: [''] }, destaque: { familia: [''] }, mono: { familia: [''] }, peso: { forte: 700, medio: 500, mono: 500 } },
  movimento: { curva: { principal: [0, 0, 1, 1], entrada: [0, 0, 1, 1], saida: [0, 0, 1, 1] }, duracao: { rapida: 0, media: 0, lenta: 0 }, cascata: 0 },
  raio: { sm: 0, md: 0, lg: 0, cartao: 0, pilula: false }
}

export function marcaTs (marca) {
  const r = marca ?? MARCA_TS_VAZIA
  const j = (v) => JSON.stringify(v)
  const c = marca ? r.cor.papel : r.cor
  const pilhaDe = (f) => (marca ? pilha(f.familia) : '')
  const mov = { curva: r.movimento.curva, duracaoMs: { ...r.movimento.duracao }, cascataMs: r.movimento.cascata }
  const familias = marca ? ['display', 'destaque', 'mono'].map((p) => r.fonte[p].familia[0]) : []
  return `// ${CABECALHO}
// ${marca ? 'A marca para o Remotion: toda composição importa daqui e chama exigeMarca() primeiro.' : `ESTADO: nao-configurado. ${MENSAGEM}.`}

import { cancelRender, continueRender, delayRender } from "remotion";

export const MARCA_CONFIGURADA: boolean = ${Boolean(marca)};

/** As 8 cores da marca, pelo papel. */
export const COR = {
  principal: ${j(c.principal)},
  clara: ${j(c.claro)},
  acento: ${j(c.acento)},
  apoio1: ${j(c.apoio)},
  apoio2: ${j(c.lavado)},
  rara: ${j(c.raro)},
  abismo: ${j(c.abismo)},
  ok: ${j(c.ok)},
} as const;

/** As três famílias, com a pilha de reserva. */
export const FONTE = {
  display: ${j(pilhaDe(r.fonte.display))},
  serif: ${j(pilhaDe(r.fonte.destaque))},
  mono: ${j(pilhaDe(r.fonte.mono))},
} as const;

export const PESO = {
  displayForte: ${r.fonte.peso.forte},
  displayMedio: ${r.fonte.peso.medio},
  monoMedio: ${r.fonte.peso.mono},
} as const;

/** A curva (Easing.bezier(...MOVIMENTO.curva.principal)) e as durações da marca, em ms. */
export const MOVIMENTO = {
  curva: ${j(mov.curva)} as Record<"principal" | "entrada" | "saida", [number, number, number, number]>,
  duracaoMs: ${j(mov.duracaoMs)},
  cascataMs: ${mov.cascataMs},
} as const;

export const RAIO = { sm: ${r.raio.sm}, md: ${r.raio.md}, lg: ${r.raio.lg}, cartao: ${r.raio.cartao}, pilula: ${r.raio.pilula} } as const;

const FOLHAS_DE_FONTE: string[] = ${j(marca ? urlsDe(r) : [])};
const FAMILIAS: string[] = ${j([...new Set(familias)])};

export const FPS = 30;

// As fontes chegam pela folha do Google Fonts, e o render espera por elas.
if (typeof document !== "undefined" && FOLHAS_DE_FONTE.length > 0) {
  const espera = delayRender("as fontes da marca");
  Promise.all(
    FOLHAS_DE_FONTE.map(
      (href) =>
        new Promise<void>((pronto, falha) => {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = href;
          link.onload = () => pronto();
          link.onerror = () => falha(new Error("a folha de fonte da marca não carregou: " + href));
          document.head.appendChild(link);
        }),
    ),
  )
    .then(() => Promise.all(FAMILIAS.map((f) => document.fonts.load(PESO.displayForte + ' 64px "' + f + '"'))))
    .then(() => continueRender(espera))
    .catch((e) => cancelRender(e));
}

/** Toda composição chama isto primeiro: sem marca, o vídeo não sai. */
export function exigeMarca(): void {
  if (!MARCA_CONFIGURADA) throw new Error(${j(MENSAGEM)});
}
`
}

// ─── o prompt de imagem ────────────────────────────────────────────────────

function promptImagem (r) {
  if (!r) return `<!-- ${CABECALHO} -->\n\n# O preâmbulo de imagem da marca\n\nESTADO: nao-configurado\n\n${MENSAGEM}. Sem marca, o /gerar-imagem diz isso antes de gerar.\n`
  const c = r.cor.papel
  const evitar = r.imagem.evitar.length ? ` Evitar: ${r.imagem.evitar.join('; ')}.` : ''
  return `<!-- ${CABECALHO} -->

# O preâmbulo de imagem da marca

Abre todo prompt do /gerar-imagem, antes do pedido da peça.

\`\`\`text
${r.imagem.estilo.trim().replace(/\.$/, '')}. Paleta da marca: principal ${c.principal}, claro ${c.claro}, acento ${c.acento}, apoio ${c.apoio}, lavado ${c.lavado}.${evitar}
\`\`\`
`
}

// ─── o json achatado ───────────────────────────────────────────────────────

function marcaJson (r, raiz) {
  if (!r) return JSON.stringify({ $gerado: CABECALHO, configurada: false, motivo: MENSAGEM }, null, 2) + '\n'
  const d = derivarMarca(r.cor.papel)
  const logos = existsSync(join(raiz, 'identidade/logo')) ? readdirSync(join(raiz, 'identidade/logo')).filter((f) => !f.startsWith('.')).sort().map((f) => `identidade/logo/${f}`) : []
  return JSON.stringify({
    $gerado: CABECALHO,
    configurada: true,
    cor: { papel: r.cor.papel, primitiva: r.cor.primitiva ?? {} },
    derivado: { carrossel: d.carrossel, guardanapo: d.guardanapo, interface: d.interface },
    fonte: r.fonte,
    raio: r.raio,
    espaco: r.espaco,
    sombra: r.sombra,
    movimento: dadosDeMovimento(r),
    imagem: r.imagem,
    som: r.som,
    recusas: r.recusas,
    logo: logos
  }, null, 2) + '\n'
}

// ─── as saídas ─────────────────────────────────────────────────────────────

/** O ícone de aba da marca: a primária da interface, com o canto do raio médio (na escala de 32 px). */
export function iconeDaMarca (r) {
  if (!r) return `<!-- ${CABECALHO}. ESTADO: nao-configurado. ${MENSAGEM}. -->\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"/>\n`
  const cor = derivarMarca(r.cor.papel).interface.primaria
  const rx = Math.min(16, Math.max(2, Math.round(r.raio.md * 0.7)))
  return `<!-- ${CABECALHO}. O ícone de aba da marca: o site e o app do /novo-projeto o usam. -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="${rx}" fill="${cor}"/>
</svg>
`
}

/**
 * Todas as saídas, sem escrever: `Map(caminho relativo → string | Buffer)`.
 * Lança quando a marca configurada não fecha o contraste (o conferir mostra).
 */

export function saidas ({ raiz = raizPadrao() } = {}) {
  const m = lerMarca({ raiz })
  const r = m.configurada ? m.resolvido : null
  const demo = lerMolde({ raiz }).resolvido
  const s = new Map()
  s.set(DESTINOS.tokens, cssDoCarrossel(r ?? demo, { configurada: Boolean(r) }))
  s.set(DESTINOS.css, r ? cssDaWeb(r, raiz) : `/* ${CABECALHO}\n   ESTADO: nao-configurado\n   ${MENSAGEM}. */\n`)
  s.set(DESTINOS.json, marcaJson(r, raiz))
  const mov = dadosDeMovimento(r)
  s.set(DESTINOS.movimentoJson, JSON.stringify({ $gerado: CABECALHO, ...mov }, null, 2) + '\n')
  s.set(DESTINOS.movimentoJs, movimentoJs(mov))
  s.set(DESTINOS.movimentoMarca, movimentoJs(mov))
  s.set(DESTINOS.remotion, marcaTs(r))
  s.set(DESTINOS.prompt, promptImagem(r))
  s.set(DESTINOS.icone, iconeDaMarca(r))
  if (r) {
    const pastaLogo = join(raiz, 'identidade/logo')
    if (existsSync(pastaLogo)) for (const f of readdirSync(pastaLogo)) if (!f.startsWith('.')) s.set(`${COPIAS.logo}/${f}`, readFileSync(join(pastaLogo, f)))
    for (const f of locaisDe(r)) {
      const origem = join(raiz, 'identidade', f.arquivo)
      if (!existsSync(origem)) throw new Error(`gerar: a fonte ${f.familia[0]} aponta identidade/${f.arquivo}, que não existe`)
      s.set(`${COPIAS.fontes}/${basename(f.arquivo)}`, readFileSync(origem))
    }
  }
  return s
}

const igual = (a, b) => (Buffer.isBuffer(a) || Buffer.isBuffer(b) ? Buffer.compare(Buffer.from(a), Buffer.from(b)) === 0 : a === b)

/** O que está velho: `[{ caminho, motivo }]` (falta, difere, ou sobra nas pastas copiadas). */
export function conferirSaidas ({ raiz = raizPadrao() } = {}) {
  const s = saidas({ raiz })
  const velhas = []
  for (const [rel, conteudo] of s) {
    const p = join(raiz, rel)
    if (!existsSync(p)) velhas.push({ caminho: rel, motivo: 'falta' })
    else if (!igual(Buffer.isBuffer(conteudo) ? readFileSync(p) : readFileSync(p, 'utf8'), conteudo)) velhas.push({ caminho: rel, motivo: 'difere do que o gerador escreve agora' })
  }
  for (const pasta of Object.values(COPIAS)) {
    const p = join(raiz, pasta)
    if (!existsSync(p)) continue
    for (const f of readdirSync(p)) if (!f.startsWith('.') && !s.has(`${pasta}/${f}`)) velhas.push({ caminho: `${pasta}/${f}`, motivo: 'sobra: não vem da identidade/' })
  }
  return velhas
}

/** Escreve as saídas e apaga a sobra das pastas copiadas. Devolve a lista escrita. */
export function escrever ({ raiz = raizPadrao() } = {}) {
  const s = saidas({ raiz })
  for (const [rel, conteudo] of s) {
    const p = join(raiz, rel)
    mkdirSync(dirname(p), { recursive: true })
    writeFileSync(p, conteudo)
  }
  return [...s.keys()]
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  try {
    const raiz = raizPadrao()
    const m = lerMarca({ raiz })
    if (process.argv.includes('--conferir')) {
      const velhas = conferirSaidas({ raiz })
      for (const v of velhas) console.log(`✗ ${v.caminho}: ${v.motivo}`)
      console.log(velhas.length ? `${velhas.length} saída(s) velha(s): rode node scripts/marca/gerar.mjs` : `as saídas estão em dia (${m.configurada ? 'marca configurada' : 'marca não configurada'})`)
      process.exit(velhas.length ? 1 : 0)
    }
    const escritas = escrever({ raiz })
    const sobra = conferirSaidas({ raiz }).filter((v) => v.motivo.startsWith('sobra'))
    for (const v of sobra) console.log(`AVISO: ${v.caminho} não vem da identidade/ (apague à mão se não for mais da marca)`)
    console.log(`${escritas.length} saída(s) escrita(s) (${m.configurada ? 'marca configurada' : `${MENSAGEM}: ${m.motivo}`})`)
    if (m.erros) process.exit(1)
  } catch (e) {
    console.error(e.message)
    process.exit(1)
  }
}
