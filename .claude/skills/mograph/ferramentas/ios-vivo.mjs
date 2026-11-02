// O kit vivo (comum.componentes.kit-vivo): a interface de celular da peça em motion sai dos construtores
// do ios.cjs, que rodam no Node, e chega à página, que roda no navegador.
// A peça declara cada pedaço em fonte/ios.json e esta ferramenta grava ativos/ios.js:
//
//   fonte/ios.json   { "<id>": { "construtor": "mail", "args": { "de": "Marina", "assunto": "..." } } }
//   ativos/ios.js    window.IOS = { "<id>": "<html que o ios.mail devolve>" };   (a página usa el.innerHTML = IOS.caixa)
//
// O argumento que traz um objeto com `construtor` dentro monta primeiro, e entra como o HTML dele (o `widgets`
// recebe `pecas` que são `widget`). O emoji do Node aponta para o material da skill, que a página da peça
// não alcança: cada emoji usado se copia para ativos/emoji/ da peça, e o HTML aponta para lá. O
// montar-puro chama esta geração antes de embutir. O estilo das classes .ios-* (o ios.css, ao lado) vai
// embutido no ativos/ios.js, num <style> que a página ganha ao carregar.
// Erro: sai 1 com o id, e nada se grava (o emoji e o arquivo novo só entram no fim).
//
//   node ios-vivo.mjs <pasta-da-peça>
import { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync, rmSync, copyFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chamadoDireto } from './principal.mjs';

const IOS = createRequire(import.meta.url)('./ios.cjs');
// funções do ios.js que ajudam os construtores e não devolvem um componente
const AJUDANTES = new Set(['naFaixa', 'nomeNoAcervo', 'nomesDoArquivo']);
export const EMOJI_NA_PAGINA = 'ativos/emoji';
export const CSS_DO_IOS = fileURLToPath(new URL('./ios.css', import.meta.url));
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const PRIMEIRA_LINHA = '// Este arquivo é gerado pelo ios-vivo.mjs a partir do fonte/ios.json e não se edita à mão: edite o ios.json e rode o ios-vivo.mjs.';

const construtores = () => Object.keys(IOS).filter((k) => typeof IOS[k] === 'function' && !AJUDANTES.has(k)).sort();

// o erro que já diz onde aconteceu: sobe pelos construtores de fora sem ganhar o prefixo de novo
class ErroComLugar extends Error {}

// monta a entrada { construtor, args }; o que traz `construtor` dentro dos args monta antes
function montar(entrada, onde) {
  if (entrada === null || typeof entrada !== 'object' || Array.isArray(entrada) || typeof entrada.construtor !== 'string') {
    throw new ErroComLugar(`${onde}: precisa ser { "construtor": "<nome>", "args": { ... } }`);
  }
  const nome = entrada.construtor;
  const existem = `construtores que existem: ${construtores().join(', ')}`;
  if (AJUDANTES.has(nome)) throw new ErroComLugar(`${onde}: "${nome}" é ajudante do ios.js, e não monta componente; ${existem}`);
  // só o que o ios.js exporta: o constructor e o toString, que todo objeto herda, não são construtores
  if (!Object.hasOwn(IOS, nome) || typeof IOS[nome] !== 'function') throw new ErroComLugar(`${onde}: o construtor "${nome}" não existe no ios.js; ${existem}`);
  try {
    return IOS[nome](dentro(entrada.args, onde));
  } catch (e) {
    if (e instanceof ErroComLugar) throw e;
    throw new ErroComLugar(`${onde}: ${e.message}`);
  }
}
function dentro(v, onde) {
  if (Array.isArray(v)) return v.map((x, i) => dentro(x, `${onde}[${i}]`));
  if (v === null || typeof v !== 'object') return v;
  if (typeof v.construtor === 'string') return montar(v, onde);
  return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, dentro(x, `${onde}.${k}`)]));
}

// A peça solta que é parte de uma conversa (a bolha, o digitando) não traz a classe `ios`, e as variáveis
// do estilo (--p, --bolha, --tx) só existem dentro dela: no topo da página, ela ganha o invólucro. O que
// não é componente .ios-* (o emoji, que é texto com <img>) passa como está.
const CLASSES_DA_RAIZ = /^\s*<[a-z][\w-]*\b[^>]*?\bclass="([^"]*)"/;
export const comIos = (html) => {
  const classes = (CLASSES_DA_RAIZ.exec(html)?.[1] ?? '').split(/\s+/);
  const solta = classes.some((c) => c.startsWith('ios-')) && !classes.includes('ios');
  return solta ? `<div class="ios">${html}</div>` : html;
};

export function gerarIos(pasta) {
  const arqJson = join(pasta, 'fonte', 'ios.json');
  if (!existsSync(arqJson)) throw new Error(`sem o fonte/ios.json da peça: ${arqJson}`);
  let decl;
  try {
    decl = JSON.parse(readFileSync(arqJson, 'utf8'));
  } catch (e) {
    throw new Error(`${arqJson} não é JSON: ${e.message}`);
  }
  if (decl === null || typeof decl !== 'object' || Array.isArray(decl)) throw new Error(`${arqJson}: precisa ser um objeto { "<id>": { "construtor": ..., "args": ... } }`);
  const html = {};
  for (const [id, entrada] of Object.entries(decl)) {
    if (!KEBAB.test(id)) throw new Error(`${arqJson}: o id "${id}" não é kebab (letras minúsculas e números, separados por hífen)`);
    html[id] = comIos(montar(entrada, id));
  }
  // os emojis que o HTML usa, do material para a peça
  const web = `${IOS.EMOJI_WEB}/`;
  const usados = new Set(Object.values(html).flatMap((h) => [...h.split(web).slice(1)].map((r) => r.slice(0, r.indexOf('.png') + 4))));
  for (const id of Object.keys(html)) html[id] = html[id].split(IOS.EMOJI_WEB).join(EMOJI_NA_PAGINA);
  if (usados.size) mkdirSync(join(pasta, EMOJI_NA_PAGINA), { recursive: true });
  for (const arq of usados) copyFileSync(join(IOS.EMOJI_DIR, arq), join(pasta, EMOJI_NA_PAGINA, arq));
  const saida = join(pasta, 'ativos', 'ios.js');
  const temporario = `${saida}.${process.pid}.tmp`;
  mkdirSync(dirname(saida), { recursive: true });
  try {
    // o estilo das classes .ios-* vai junto, num <style> que a página ganha ao carregar o ios.js
    const css = readFileSync(CSS_DO_IOS, 'utf8');
    writeFileSync(temporario, `${PRIMEIRA_LINHA}\nwindow.IOS = ${JSON.stringify(html)};\n` +
      `(() => { if (document.getElementById('ios-css')) return; const s = document.createElement('style'); s.id = 'ios-css'; s.textContent = ${JSON.stringify(css)}; document.head.appendChild(s); })();\n`);
    renameSync(temporario, saida);
  } finally {
    rmSync(temporario, { force: true });
  }
  return saida;
}

if (chamadoDireto(import.meta.url)) {
  const pasta = process.argv[2];
  if (!pasta || pasta.startsWith('--')) { console.error('uso: ios-vivo.mjs <pasta-da-peça>'); process.exit(2); }
  try {
    console.log(`gerado: ${gerarIos(resolve(pasta))}`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
