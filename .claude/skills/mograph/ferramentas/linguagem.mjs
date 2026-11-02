// O perfil da peça: a linguagem (`linguagens.json` da /video) e o estilo (`estilos.md` § 2 da /video)
// que o plano.json declara, e o que eles mudam nas réguas. As réguas recebem o perfil e mudam só o
// que ele dispensa; sem os dois campos, o perfil é vazio e tudo segue como no motion de interface.
//
//   "linguagem": "spec-ad-locucao"
//   "estilo": "documental"   (ou { "id": "documental", "destaque": "--ios-azul", "fonte": "Inter 4" })
//
// O que cada linguagem e cada estilo mudam mora no linguagens.json, uma fonte só: o `tempo` (quem
// manda no tempo da peça: `voz`, `musica` ou `evento`) e a `dispensa` (as regras que ela não cobra:
// `tipos-de-efeito`, o piso de tipos de efeito do ofício; `dissolver-com-causa`, o dissolver com a
// causa escrita na costura). O estilo sem `linguagem` no plano traz a dele.
//
// O `saber` é o formato do manual da /mograph (`filme` ou `reel`): a pasta de entradas que a peça
// pode citar, além de `comum/`. Sai do estilo pela tabela do `manual/README.md` § 1, lida na hora.
// Não se chama `formato`, que no plano.json é o enquadramento do destino (o formatos.json).
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chamadoDireto } from './principal.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const VIDEO = join(AQUI, '..', '..', 'video');
const README_DO_MANUAL = join(AQUI, '..', 'manual', 'README.md');

export const lerLinguagens = () => JSON.parse(readFileSync(join(VIDEO, 'ferramentas', 'linguagens.json'), 'utf8'));

// os ids da tabela "Os estilos" do estilos.md (a primeira coluna, entre crases)
export function lerEstilos() {
  const md = readFileSync(join(VIDEO, 'estilos.md'), 'utf8');
  const secao = md.split(/^## /m).find((s) => /^2 · Os estilos/.test(s)) || '';
  return [...secao.matchAll(/^\| `([a-z0-9-]+)` \|/gm)].map((m) => m[1]);
}

// a tabela "Os formatos" do README do manual: a linha de cada pasta-formato e os estilos dela, entre
// crases; a linha do `comum/` (os dois) não é saber
export function saberesDoReadme(md) {
  const secao = md.split(/^## /m).find((s) => /^1 · Os formatos/.test(s)) || '';
  const saberes = {};
  for (const m of secao.matchAll(/^\| `([a-z]+)\/` \| `([a-z]+)` \|[^|]*\|([^|]*)\|/gm)) {
    for (const e of m[3].matchAll(/`([a-z0-9-]+)`/g)) saberes[e[1]] = m[2];
  }
  return saberes;
}

export const lerSaberes = () => saberesDoReadme(readFileSync(README_DO_MANUAL, 'utf8'));

export const idDoEstilo = (estilo) => (typeof estilo === 'string' ? estilo : estilo?.id) || null;

export function perfilDoPlano(plano, { linguagens = null, estilos = null, saberes = null } = {}) {
  const L = linguagens || lerLinguagens();
  const erros = [];
  const estilo = idDoEstilo(plano?.estilo);
  let cfgEstilo = null;
  if (estilo) {
    const ids = estilos || lerEstilos();
    if (!ids.includes(estilo)) erros.push({ regra: 'estilo', msg: `o estilo "${estilo}" não está no estilos.md da /video (${ids.join(', ')})` });
    else cfgEstilo = L.estilos?.[estilo] || null;
  }
  const linguagem = plano?.linguagem || cfgEstilo?.linguagem || null;
  let cfg = null;
  if (linguagem) {
    cfg = L.linguagens[linguagem] || null;
    if (!cfg) erros.push({ regra: 'linguagem', msg: `a linguagem "${linguagem}" não está no linguagens.json da /video (${Object.keys(L.linguagens).join(', ')})` });
  }
  const dispensa = new Set([...(cfgEstilo?.dispensa || []), ...(cfg?.dispensa || [])]);
  const estiloValido = !erros.some((e) => e.regra === 'estilo');
  const saber = estilo && estiloValido ? (saberes || lerSaberes())[estilo] || null : null;
  return { linguagem: cfg ? linguagem : null, estilo: estiloValido ? estilo : null, saber, tempo: cfg?.tempo || null, dispensa, erros };
}

// a linha de comando, para as réguas Python da /video: node linguagem.mjs perfil <plano.json>
if (chamadoDireto(import.meta.url)) {
  const [cmd, arq] = process.argv.slice(2);
  if (cmd !== 'perfil' || !arq) { console.error('uso: linguagem.mjs perfil <plano.json>'); process.exit(2); }
  const p = perfilDoPlano(JSON.parse(readFileSync(arq, 'utf8')));
  process.stdout.write(JSON.stringify({ ...p, dispensa: [...p.dispensa] }));
}
