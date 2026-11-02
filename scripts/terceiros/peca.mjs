// O manifesto das peças de terceiro, lido num lugar só.
//
// Cada peça (fonte, ícone, biblioteca, skill oficial de uma ferramenta) é
// baixada da fonte oficial pelo `instalar.mjs` e mora fora do git, no caminho
// que o resto do workspace cita. O `manifesto.json` diz, para cada uma, a
// fonte com versão fixa, o destino e a impressão sha256 de cada arquivo final.
// Quem precisa de uma peça lê daqui: o instalador, o `confere-contexto.mjs`
// (caminho instalado existe por contrato) e os testes que dependem dela.
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve, sep, dirname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

export const AQUI = dirname(fileURLToPath(import.meta.url));
export const RAIZ = resolve(AQUI, '..', '..');
export const MANIFESTO = join(AQUI, 'manifesto.json');
export const COMANDO = 'node scripts/terceiros/instalar.mjs';

const ID = /^[a-z0-9][a-z0-9-]*$/;
// o nome de um asset da Release: um nome só, sem barra, que nunca vira outro caminho
const ASSET = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const SHA = /^[0-9a-f]{64}$/;

/** O caminho relativo que o manifesto aceita: com barra normal, sem `..`, sem raiz. */
function relativoLimpo(p) {
  return typeof p === 'string' && p.length > 0 && !isAbsolute(p) && !p.includes('\\') &&
    !/^[a-zA-Z]:/.test(p) && p.split('/').every((s) => s !== '' && s !== '.' && s !== '..');
}

/** Lê e valida o manifesto: o que não passa aqui nunca chega a escrever no disco. */
export function lerManifesto(arquivo = MANIFESTO) {
  const m = JSON.parse(readFileSync(arquivo, 'utf8'));
  const erros = [];
  if (!Array.isArray(m.pecas)) erros.push('falta a lista "pecas"');
  const ids = new Set();
  const destinos = [];
  for (const p of m.pecas ?? []) {
    const onde = `peça "${p.id}"`;
    if (!ID.test(p.id ?? '')) erros.push(`${onde}: id inválido`);
    if (ids.has(p.id)) erros.push(`${onde}: id repetido`);
    ids.add(p.id);
    if (!relativoLimpo(p.destino)) erros.push(`${onde}: destino "${p.destino}" fora da raiz`);
    destinos.push(p.destino);
    const nomes = new Set();
    const assets = new Set();
    for (const pc of p.pacotes ?? []) {
      if (!ASSET.test(pc.asset ?? '')) erros.push(`${onde}: asset "${pc.asset}" inválido`);
      if (assets.has(pc.asset)) erros.push(`${onde}: asset "${pc.asset}" repetido`);
      assets.add(pc.asset);
      if (!SHA.test(pc.sha256 ?? '')) erros.push(`${onde}: o asset "${pc.asset}" sem impressão sha256 válida`);
      if (!p.fontes?.release) erros.push(`${onde}: tem pacotes, e a peça não declara a fonte "release"`);
    }
    for (const a of p.arquivos ?? []) {
      if (!relativoLimpo(a.para)) erros.push(`${onde}: "${a.para}" sai do destino`);
      if (nomes.has(a.para)) erros.push(`${onde}: "${a.para}" repetido`);
      nomes.add(a.para);
      if (a.fonte !== undefined && !p.fontes?.[a.fonte]) erros.push(`${onde}: "${a.para}" cita a fonte "${a.fonte}", que a peça não declara`);
      if (a.pacote !== undefined && !assets.has(a.pacote)) erros.push(`${onde}: "${a.para}" cita o pacote "${a.pacote}", que a peça não declara`);
      if (a.de === undefined && a.molde === undefined && a.pacote === undefined) erros.push(`${onde}: "${a.para}" sem "de", "molde" nem "pacote"`);
      if (a.pacote !== undefined && !SHA.test(a.sha256 ?? '')) erros.push(`${onde}: "${a.para}" do pacote sem impressão sha256 válida`);
    }
    if (!p.arquivos?.length) erros.push(`${onde}: sem arquivos`);
  }
  // uma peça dentro da outra faria a segunda reescrever o que a primeira confere
  for (const a of destinos) {
    for (const b of destinos) if (a !== b && (b + '/').startsWith(a + '/')) erros.push(`o destino "${b}" fica dentro de "${a}"`);
  }
  if (erros.length) throw new Error(`manifesto inválido (${arquivo}):\n  ${erros.join('\n  ')}`);
  return m;
}

/** O caminho absoluto de um arquivo da peça, recusando o que sairia do destino. */
export function caminhoDe(raiz, peca, para) {
  const base = resolve(raiz, peca.destino);
  const alvo = resolve(base, para);
  if (!resolve(raiz, peca.destino).startsWith(resolve(raiz) + sep) || !alvo.startsWith(base + sep)) {
    throw new Error(`peça "${peca.id}": "${para}" sairia de ${peca.destino}`);
  }
  return alvo;
}

export const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

/** O marcador de um pacote instalado: grava a impressão do pacote que deu origem aos arquivos. */
export function caminhoDoMarcador(raiz, peca, asset) {
  return caminhoDe(raiz, peca, `.pacote-${asset}.json`);
}
export function lerMarcador(raiz, peca, asset) {
  try { return JSON.parse(readFileSync(caminhoDoMarcador(raiz, peca, asset), 'utf8')); } catch { return null; }
}

/** O que falta e o que diverge de uma peça instalada, pela impressão de cada arquivo. */
export function conferirPeca(peca, raiz = RAIZ) {
  const faltando = [];
  const divergentes = [];
  for (const a of peca.arquivos) {
    const alvo = caminhoDe(raiz, peca, a.para);
    if (!existsSync(alvo)) { faltando.push(a.para); continue; }
    const veio = sha256(readFileSync(alvo));
    if (veio !== a.sha256) divergentes.push({ para: a.para, esperado: a.sha256, veio });
  }
  // peça de pacote: cada pacote precisa do marcador com a impressão do manifesto
  const semMarcador = (peca.pacotes ?? []).filter((pc) => lerMarcador(raiz, peca, pc.asset)?.sha256 !== pc.sha256).map((pc) => pc.asset);
  return { faltando, divergentes, semMarcador, ok: !faltando.length && !divergentes.length && !semMarcador.length };
}

/** A peça pelo id, com o erro que diz o que existe. */
export function pecaDe(id, manifesto = lerManifesto()) {
  const p = manifesto.pecas.find((x) => x.id === id);
  if (!p) throw new Error(`não há peça "${id}" no manifesto (há: ${manifesto.pecas.map((x) => x.id).join(', ')})`);
  return p;
}

/**
 * Para quem depende de uma peça: devolve o caminho da pasta dela e, se faltar
 * arquivo, para com a mensagem que diz como instalar. Confere só a existência
 * (é rápido); a impressão se confere no `--conferir` e na prova da peça.
 */
export function exigirPeca(id, { raiz = RAIZ, manifesto } = {}) {
  const p = pecaDe(id, manifesto ?? lerManifesto());
  const faltam = p.arquivos.filter((a) => !existsSync(caminhoDe(raiz, p, a.para))).map((a) => a.para);
  if (faltam.length) {
    throw new Error(`falta a peça "${id}" (${p.descricao}): ${faltam.length} de ${p.arquivos.length} arquivo(s) em ${p.destino}, como ${faltam[0]}. ` +
      `Rode \`${COMANDO}\` (ou \`${COMANDO} --so ${id}\`), que baixa da fonte oficial.`);
  }
  return resolve(raiz, p.destino);
}

/**
 * O contrato de uma raiz: as pastas que o instalador ocupa inteiras e cada
 * arquivo que ele grava, com caminho a partir da raiz. Sem manifesto na raiz,
 * não há contrato (null).
 */
export function contratoDe(raiz) {
  const arquivo = join(raiz, 'scripts', 'terceiros', 'manifesto.json');
  if (!existsSync(arquivo)) return null;
  const m = lerManifesto(arquivo);
  const pastas = m.pecas.filter((p) => p.inteira).map((p) => p.destino);
  const arquivos = new Set();
  const moldes = [];
  for (const p of m.pecas) {
    for (const a of p.arquivos) {
      arquivos.add(`${p.destino}/${a.para}`);
      if (a.molde) moldes.push({ instalado: `${p.destino}/${a.para}`, molde: join(raiz, 'scripts', 'terceiros', 'moldes', a.molde) });
    }
  }
  return { pastas, arquivos, moldes };
}

/** Serializa o manifesto com um arquivo por linha: o diff de uma versão nova fica legível. */
export function serializar(m) {
  const recuo = (texto, n) => texto.split('\n').join(`\n${' '.repeat(n)}`);
  const chaves = (o, n) => Object.entries(o).map(([k, v]) => `${' '.repeat(n)}${JSON.stringify(k)}: ${recuo(JSON.stringify(v, null, 2), n)}`);
  const linha = (o) => `{ ${Object.entries(o).map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(', ')} }`;
  const pecas = m.pecas.map(({ arquivos, ...resto }) => [
    '    {',
    [...chaves(resto, 6), `      "arquivos": [\n${arquivos.map((a) => `        ${linha(a)}`).join(',\n')}\n      ]`].join(',\n'),
    '    }',
  ].join('\n'));
  const { pecas: _, ...topo } = m;
  return `{\n${[...chaves(topo, 2), `  "pecas": [\n${pecas.join(',\n')}\n  ]`].join(',\n')}\n}\n`;
}
