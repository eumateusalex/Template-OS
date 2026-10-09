// A pasta da captura sem variável de shell (o Bash do Claude Code não guarda variável entre chamadas).
//
// `prepara.mjs --nova --ref <handle>` cria a pasta `rascunho/captura-<handle>-<AAAA-MM-DDTHHMMZ>/` e grava o caminho
// dela, uma vez, no arquivo-ponteiro `rascunho/captura-design-de-produto.txt` (relativo à raiz do
// workspace, de onde todo comando roda). Daí em diante todo script acha a pasta sozinho: o primeiro
// argumento é a pasta só se for passado (ensaio, teste); senão vale o ponteiro.

import fs from 'node:fs';
import path from 'node:path';

export const PONTEIRO = path.join('rascunho', 'captura-design-de-produto.txt');

export function pastaDaCaptura(argv = process.argv) {
  const a = argv[2];
  if (a && !a.startsWith('--')) return a;
  if (!fs.existsSync(PONTEIRO)) { console.log(`falta a pasta da captura: rode antes \`node .claude/skills/design-de-produto/_local/captura/prepara.mjs --nova --ref <handle>\` (grava ${PONTEIRO})`); process.exit(1); }
  const p = fs.readFileSync(PONTEIRO, 'utf8').trim();
  if (!p || !fs.existsSync(p)) { console.log(`o ponteiro ${PONTEIRO} aponta ${p || '(vazio)'}, que não existe: rode prepara.mjs --nova --ref <handle>`); process.exit(1); }
  return p;
}

// As pastas de fonte da skill, numa lista só. Nenhuma é garantida: o git não guarda pasta vazia, então
// num clone limpo `artigos-x/` (e qualquer outra ainda sem arquivo) não existe. Quem lê fonte passa
// por aqui e tolera a ausência.
export const PASTAS_DE_FONTE = ['posts-x', 'respostas-x', 'artigos-x'];
// [{ pasta, arquivo, caminho }] de cada .md de fonte que existe em <dirFontes>/<pasta>/
export function arquivosDeFonte(dirFontes, pastas = PASTAS_DE_FONTE) {
  const out = [];
  for (const p of pastas) {
    const d = path.join(dirFontes, p);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d).filter((x) => x.endsWith('.md')).sort()) out.push({ pasta: p, arquivo: f, caminho: path.join(d, f) });
  }
  return out;
}
// os ids que já têm arquivo de fonte
export const idsComFonte = (dirFontes) => new Set(arquivosDeFonte(dirFontes).map((x) => x.arquivo.replace(/\.md$/, '')));
// o arquivo de fonte de um id, em qualquer pasta (ou null)
export const fonteDoId = (dirFontes, id) => PASTAS_DE_FONTE.map((p) => path.join(dirFontes, p, id + '.md')).find((c) => fs.existsSync(c)) || null;

export function novaPasta(handle) {
  const agora = new Date().toISOString().slice(0, 16).replace(/:/g, '') + 'Z';
  const p = path.join('rascunho', `captura-${handle}-${agora}`).split(path.sep).join('/');
  fs.mkdirSync(p, { recursive: true });
  fs.mkdirSync(path.dirname(PONTEIRO), { recursive: true });
  fs.writeFileSync(PONTEIRO, p + '\n');
  return p;
}
