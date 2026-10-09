// Traduz a marca do workspace para o Remotion: lê o tokens.css e escreve o
// .claude/video/src/marca.ts.
//
//   node .claude/skills/video/ferramentas/marca-remotion.mjs            escreve o marca.ts
//   node .claude/skills/video/ferramentas/marca-remotion.mjs --conferir  só diz se o marca.ts está em dia (sai 1 se não)
//
// Por que um gerador e não o marca.ts escrito à mão: a marca mora num lugar só
// (`.claude/skills/carrossel/marca/tokens.css`). Cópia à mão não acompanha a
// troca de marca, e um canal RGB traduzido errado para hex só aparece no vídeo
// pronto. Rodar de novo depois de trocar a marca refaz o arquivo inteiro.
//
// Recusa quando a marca não está fechada: sem o tokens.css, ou com a linha
// `ESTADO: nao-configurado`. O marca.ts que vem no template é o mesmo gerador
// rodado sem marca (MARCA_CONFIGURADA = false), e a peça que chama
// `exigeMarca()` para com a instrução.
import { existsSync, readFileSync, writeFileSync, realpathSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RAIZ, caminhos, estadoDaMarca } from './nova-peca.mjs';

export const PAPEIS = { principal: 'dark', clara: 'light', acento: 'accent', apoio1: 'support-1', apoio2: 'support-2', rara: 'rare', abismo: 'abyss', ok: 'ok' };
const hex = (n) => Number(n).toString(16).padStart(2, '0');

/** Lê do tokens.css as 8 cores, as 3 famílias, os 3 pesos e as folhas de fonte. */
export function lerTokens(texto) {
  const cor = {};
  for (const [papel, token] of Object.entries(PAPEIS)) {
    const m = texto.match(new RegExp(`--c-${token}:\\s*(\\d{1,3})\\s*,\\s*(\\d{1,3})\\s*,\\s*(\\d{1,3})\\s*;`));
    if (!m) throw new Error(`marca-remotion: o tokens.css não tem --c-${token} em canais R,G,B`);
    if ([m[1], m[2], m[3]].some((v) => Number(v) > 255)) throw new Error(`marca-remotion: --c-${token} tem canal acima de 255`);
    cor[papel] = `#${hex(m[1])}${hex(m[2])}${hex(m[3])}`;
  }
  const fonte = {};
  for (const [papel, token] of [['display', 'display'], ['serif', 'serif'], ['mono', 'mono']]) {
    const m = texto.match(new RegExp(`--f-${token}:\\s*([^;]+);`));
    if (!m) throw new Error(`marca-remotion: o tokens.css não tem --f-${token}`);
    fonte[papel] = m[1].trim();
  }
  const peso = {};
  for (const [papel, token] of [['displayForte', 'display-bold'], ['displayMedio', 'display-med'], ['monoMedio', 'mono-med']]) {
    const m = texto.match(new RegExp(`--w-${token}:\\s*(\\d{3})\\s*;`));
    peso[papel] = m ? Number(m[1]) : null;
    if (!m) throw new Error(`marca-remotion: o tokens.css não tem --w-${token}`);
  }
  const folhas = [...texto.matchAll(/@import\s+url\(\s*['"]?([^'")]+)['"]?\s*\)/g)].map((m) => m[1]);
  const familias = Object.values(fonte).map((pilha) => pilha.split(',')[0].trim().replace(/^['"]|['"]$/g, ''));
  const fonteLocal = /@font-face/.test(texto);
  return { cor, fonte, peso, folhas, familias, fonteLocal };
}

/** O marca.ts inteiro. Sem dados, a versão "marca não configurada". */
export function gerarMarcaTs(d) {
  const j = (v) => JSON.stringify(v);
  const vazio = !d;
  const cor = vazio ? Object.fromEntries(Object.keys(PAPEIS).map((k) => [k, ''])) : d.cor;
  const fonte = vazio ? { display: '', serif: '', mono: '' } : d.fonte;
  const peso = vazio ? { displayForte: 700, displayMedio: 500, monoMedio: 500 } : d.peso;
  const linhasCor = Object.entries(cor).map(([k, v]) => `  ${k}: ${j(v)}, // --c-${PAPEIS[k]}`).join('\n');
  return `// GERADO por .claude/skills/video/ferramentas/marca-remotion.mjs a partir de
// .claude/skills/carrossel/marca/tokens.css. Não edite à mão: mude o tokens.css
// (o /carrossel configurar é o dono dele) e rode o gerador de novo.

import { cancelRender, continueRender, delayRender } from "remotion";

export const MARCA_CONFIGURADA: boolean = ${!vazio};

/** As 8 cores da marca, pelo papel (o mesmo do tokens.css). */
export const COR = {
${linhasCor}
} as const;

/** As três famílias, com a pilha de reserva do tokens.css. */
export const FONTE = {
  display: ${j(fonte.display)},
  serif: ${j(fonte.serif)},
  mono: ${j(fonte.mono)},
} as const;

export const PESO = {
  displayForte: ${peso.displayForte},
  displayMedio: ${peso.displayMedio},
  monoMedio: ${peso.monoMedio},
} as const;

const FOLHAS_DE_FONTE: string[] = ${j(vazio ? [] : d.folhas)};
const FAMILIAS: string[] = ${j(vazio ? [] : d.familias)};

export const FPS = 30;

// As fontes chegam pela mesma folha que o tokens.css importa, e o render espera
// por elas: sem isso o primeiro quadro sai na fonte do sistema.
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

/** Toda composição chama isto primeiro: sem marca fechada, o vídeo não sai. */
export function exigeMarca(): void {
  if (!MARCA_CONFIGURADA) {
    throw new Error(
      "A marca deste workspace ainda não está fechada. Rode /carrossel configurar e depois node .claude/skills/video/ferramentas/marca-remotion.mjs",
    );
  }
}
`;
}

export function marcaDoWorkspace(raiz = RAIZ) {
  const m = estadoDaMarca(raiz);
  if (!m.fechada) return { dados: null, motivo: m.motivo };
  return { dados: lerTokens(readFileSync(join(caminhos(raiz).marca, 'tokens.css'), 'utf8')), motivo: '' };
}

export const destino = (raiz = RAIZ) => join(raiz, '.claude', 'video', 'src', 'marca.ts');

if (process.argv[1] && realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))) {
  try {
    const { dados, motivo } = marcaDoWorkspace();
    const esperado = gerarMarcaTs(dados);
    const atual = existsSync(destino()) ? readFileSync(destino(), 'utf8') : '';
    if (process.argv.includes('--conferir')) {
      if (atual === esperado) { console.log(`marca.ts em dia (${dados ? 'com a marca' : 'marca não configurada'})`); process.exit(0); }
      console.error('marca.ts desatualizado: rode node .claude/skills/video/ferramentas/marca-remotion.mjs');
      process.exit(1);
    }
    if (!dados) { console.error(`marca-remotion: a marca não está fechada (${motivo}). Rode /carrossel configurar antes`); process.exit(1); }
    writeFileSync(destino(), esperado);
    console.log(`marca.ts escrito: ${Object.entries(dados.cor).map(([k, v]) => `${k} ${v}`).join(', ')}`);
    if (dados.fonteLocal) console.log('AVISO: o tokens.css tem @font-face local. O Remotion só serve o que está em .claude/video/public/: copie a woff2 para lá e carregue com staticFile() na peça');
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
