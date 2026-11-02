// O som da peça em motion puro: os <audio> saem do som.json da peça e dos instantes que a própria
// peça expõe (window.__instantes), lidos com a página aberta no Chromium, para o som nunca se
// descolar da imagem. Cada efeito se posiciona pelo pico: data-start = instante + mais − pico.
//
//   node som-do-puro.mjs <pasta da peça> [--som fonte/som.json] [--modelo fonte/pagina.html] [--direcao A]
//
// Monta a peça (o montar-puro.mjs, ao lado), lê window.__instantes e window.PLANO.duracao, escreve
// os <audio> entre os marcadores do modelo (`<!-- som: começo ... -->` e `<!-- som: fim -->`),
// grava os picos em som-picos.json, ao lado do som.json, e monta de novo. A letra da direção, sem
// --direcao, é a que o index.html já tem (senão A).
//
// O som.json: "picos" ({arquivo: pico em s, do medir_audio.py efeito}), "trilha" (arquivo,
// media_start, vol, fade_in, fade_out; opcional) e "efeitos": cada um com id, arquivo, em (o nome de
// um instante do window.__instantes, ou um número em s), mais (o deslocamento em s) e vol (o
// data-volume). O instante que é lista dá um clipe por item, com o volume descendo 8% a cada um;
// "letras" digita uma tecla por letra a cada 2 quadros, alternando tecla-1.wav e tecla-2.wav, e o
// espaço fica mudo. Os arquivos moram em ativos/ da peça.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { montarPuro } from './montar-puro.mjs';
import { abrirNavegador } from './navegador.mjs';
import { chamadoDireto } from './principal.mjs';

const r3 = (x) => +x.toFixed(3);

/** os <audio> da trilha e dos efeitos; duracaoDe(arquivo) dá a duração do arquivo em s */
export function tagsDoSom(som, { instantes, duracao, duracaoDe }) {
  const tags = [], efeitos = [], durs = {};
  const t = som.trilha;
  if (t) tags.push(`<audio id="trilha" class="clip" data-papel="trilha" data-start="0" data-duration="${duracao}" data-media-start="${t.media_start ?? 0}" data-volume="${t.vol ?? 1}" data-fade-in="${t.fade_in ?? 0}" data-fade-out="${t.fade_out ?? 0}" src="ativos/${t.arquivo}"></audio>`);
  function clip(id, arquivo, pico, vol) {
    const p = som.picos?.[arquivo];
    if (p === undefined) throw new Error(`sem o pico de ${arquivo} no som.json`);
    const inicio = r3(pico - p);
    if (inicio < 0) throw new Error(`${id}: o pico em ${r3(pico)} s pede começar antes do zero`);
    if (inicio >= duracao) throw new Error(`${id}: começa depois do fim da peça`);
    durs[arquivo] ??= duracaoDe(arquivo);
    const d = r3(Math.min(durs[arquivo], duracao - inicio));
    tags.push(`<audio id="sfx-${id}" class="clip" data-start="${inicio}" data-duration="${d}" data-volume="${vol}" src="ativos/${arquivo}"></audio>`);
    efeitos.push({ id, arquivo, pico: r3(pico) });
  }
  for (const e of som.efeitos || []) {
    const base = typeof e.em === 'number' ? e.em : instantes[e.em];
    if (base === undefined) throw new Error(`${e.id}: o instante "${e.em}" não existe na peça`);
    if (e.letras) {
      let k = 0;
      [...e.letras].forEach((ch, n) => {
        if (ch === ' ') return;
        clip(`${e.id}-${n}`, k++ % 2 ? 'tecla-2.wav' : 'tecla-1.wav', base + (2 * n) / 30, e.vol);
      });
    } else if (Array.isArray(base)) {
      base.forEach((b, n) => clip(`${e.id}-${n}`, e.arquivo, b + (e.mais || 0), r3(e.vol * (1 - 0.08 * n))));
    } else {
      clip(e.id, e.arquivo, base + (e.mais || 0), e.vol);
    }
  }
  return { tags, efeitos };
}

/** troca o que está entre os marcadores do som pelas tags, na indentação do marcador */
export function escreverEntreMarcadores(pagina, tags) {
  const ini = pagina.match(/([ \t]*)<!-- som: começo[^>]*-->/);
  const b = pagina.indexOf('<!-- som: fim -->');
  if (!ini || b < ini.index) throw new Error('o modelo da página não tem os marcadores do som (<!-- som: começo --> e <!-- som: fim -->)');
  const a = ini.index + ini[0].length, recuo = ini[1];
  return pagina.slice(0, a) + '\n' + tags.map((t) => recuo + t).join('\n') + '\n' + recuo + pagina.slice(b);
}

/**
 * o som descolado (a régua som do regua-direcao.mjs): cada efeito do index.html contra o lugar que os
 * instantes de agora pedem. A peça montada de novo só pelo montar-puro (que não refaz o som) depois
 * de a marca mudar de tempo deixa o efeito fora da imagem com todas as outras réguas verdes. Mais de
 * 1 quadro de diferença reprova.
 */
export function somDescolado(som, { instantes, duracao, duracaoDe }, html) {
  const erros = [];
  // a trilha de banco genérica soa como música de elevador e tira o ar premium; só os sons dos
  // componentes, sem cama, soa vazio. O som é a cama de fundo mais o som por ação, e a cama só entra
  // com a aprovação do usuário escrita no som.json (trilha.aprovada: a frase dele e a data)
  if (!som.trilha) erros.push({ regra: 'som', msg: 'a peça não tem cama de fundo (trilha no som.json): só os sons dos componentes soa vazio; a cama entra com a aprovação do usuário, ouvindo' });
  else if (!String(som.trilha.aprovada || '').trim()) erros.push({ regra: 'som', msg: `a trilha ${som.trilha.arquivo} não tem a aprovação do usuário (trilha.aprovada no som.json): trilha de banco genérica soa como música de elevador; a cama de fundo entra com a aprovação do usuário, ouvindo` });
  let esperado;
  try { esperado = tagsDoSom(som, { instantes, duracao, duracaoDe }).tags; } catch (e) { return { erros: [{ regra: 'som', msg: `não medida: ${e.message}` }], avisos: [] }; }
  const inicio = (tag) => +(tag.match(/data-start="([^"]*)"/) || [])[1];
  const naPagina = new Map([...html.matchAll(/<audio id="(sfx-[^"]+)"[^>]*>/g)].map((m) => [m[1], inicio(m[0])]));
  for (const tag of esperado) {
    const id = tag.match(/id="([^"]+)"/)[1];
    if (id === 'trilha') continue;
    const quer = inicio(tag), tem = naPagina.get(id);
    if (tem === undefined) erros.push({ regra: 'som', msg: `${id} falta na página: rode o som-do-puro.mjs` });
    else if (Math.abs(tem - quer) > 1 / 30 + 1e-6) erros.push({ regra: 'som', msg: `${id} começa em ${tem} s e a imagem pede ${quer} s (${Math.round((tem - quer) * 30)} quadros): o som foi gerado antes da última mudança de tempo; rode o som-do-puro.mjs` });
    naPagina.delete(id);
  }
  for (const id of naPagina.keys()) erros.push({ regra: 'som', msg: `${id} está na página e não no som.json de agora: rode o som-do-puro.mjs` });
  return { erros, avisos: [] };
}

/** a régua som sobre a peça montada: lê os instantes com a página aberta, sem montar de novo */
export async function conferirSom(pasta, { som = 'fonte/som.json' } = {}) {
  pasta = resolve(pasta);
  const arqSom = join(pasta, som), indice = join(pasta, 'index.html');
  if (!existsSync(arqSom)) return { erros: [], avisos: [], naoSeAplica: 'a peça não tem fonte/som.json' };
  if (!existsSync(indice)) return { erros: [{ regra: 'som', msg: 'não medida: sem o index.html montado' }], avisos: [] };
  const nav = await abrirNavegador();
  let instantes, duracao;
  try {
    const pag = await nav.newPage({ viewport: { width: 1080, height: 1920 } });
    await pag.goto(pathToFileURL(indice).href);
    await pag.waitForFunction(() => !!window.__instantes, null, { timeout: 15000 });
    ({ instantes, duracao } = await pag.evaluate(() => ({ instantes: window.__instantes, duracao: window.PLANO?.duracao ?? Number(document.getElementById('root')?.dataset.duration) })));
  } catch (e) {
    return { erros: [{ regra: 'som', msg: `não medida: a página não expôs window.__instantes (${e.message})` }], avisos: [] };
  } finally {
    await nav.close();
  }
  return somDescolado(JSON.parse(readFileSync(arqSom, 'utf8')), { instantes, duracao, duracaoDe: duracaoDoArquivo(pasta) }, readFileSync(indice, 'utf8'));
}

function duracaoDoArquivo(pasta) {
  return (arquivo) => {
    const arq = join(pasta, 'ativos', arquivo);
    if (!existsSync(arq)) throw new Error(`o som.json pede ${arquivo}, e não há ${arq}`);
    return r3(+execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', arq]).toString());
  };
}

export async function somDoPuro(pasta, { som = 'fonte/som.json', modelo = 'fonte/pagina.html', direcao } = {}) {
  pasta = resolve(pasta);
  const arqSom = join(pasta, som);
  if (!existsSync(arqSom)) throw new Error(`sem o som da peça: ${arqSom}`);
  const indice = join(pasta, 'index.html');
  direcao ??= (existsSync(indice) && readFileSync(indice, 'utf8').match(/window\.DIR = "([^"]*)"/)?.[1]) || 'A';
  montarPuro(pasta, { modelo, direcao });
  const nav = await abrirNavegador();
  let instantes, duracao;
  try {
    const pag = await nav.newPage({ viewport: { width: 1080, height: 1920 } });
    await pag.goto(pathToFileURL(indice).href);
    await pag.waitForFunction(() => !!window.__instantes, null, { timeout: 15000 });
    ({ instantes, duracao } = await pag.evaluate(() => ({ instantes: window.__instantes, duracao: window.PLANO?.duracao ?? Number(document.getElementById('root')?.dataset.duration) })));
  } finally {
    await nav.close();
  }
  if (!(duracao > 0)) throw new Error('a peça não diz a duração (window.PLANO.duracao ou o data-duration do #root)');
  const { tags, efeitos } = tagsDoSom(JSON.parse(readFileSync(arqSom, 'utf8')), { instantes, duracao, duracaoDe: duracaoDoArquivo(pasta) });
  const arqModelo = join(pasta, modelo);
  writeFileSync(arqModelo, escreverEntreMarcadores(readFileSync(arqModelo, 'utf8'), tags));
  const picos = join(dirname(arqSom), 'som-picos.json');
  writeFileSync(picos, JSON.stringify({ duracao, efeitos }, null, 1));
  montarPuro(pasta, { modelo, direcao });
  return { tags, efeitos, picos, direcao };
}

if (chamadoDireto(import.meta.url)) {
  const pasta = process.argv[2];
  const arg = (n) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : undefined; };
  if (!pasta || pasta.startsWith('--')) {
    console.error('uso: som-do-puro.mjs <pasta da peça> [--som fonte/som.json] [--modelo fonte/pagina.html] [--direcao A]');
    process.exitCode = 2;
  } else {
    try {
      const r = await somDoPuro(pasta, { som: arg('som'), modelo: arg('modelo'), direcao: arg('direcao') });
      console.log(`${r.tags.length} <audio> (${r.efeitos.length} efeitos${r.tags.length > r.efeitos.length ? ' e a trilha' : ''}), direção ${r.direcao}; os picos em ${r.picos}`);
    } catch (e) {
      console.error(e.message);
      process.exitCode = 1;
    }
  }
}
