// A pasta da captura vem de um ARQUIVO gravado uma vez, nunca de variavel de shell: o Bash de quem
// roda o roteiro nao guarda variavel entre uma chamada e outra, e um nome calculado na hora muda a
// cada minuto. Todo script de captura aceita `@atual` no lugar da pasta.
//
// Uma captura e de UMA fonte (as fontes moram no cobertura.json; captura/fontes.mjs as lista). A
// pasta guarda um retrato da fonte no momento em que nasceu (fonte.json): o tipo, o que a
// identifica e o `desde`, o ponto onde a janela comeca. Os scripts leem a fonte de la.
//
//   node <skill>/_local/captura/pasta.mjs nova <fonte>   cria rascunho/captura-<fonte>-<AAAAMMDD-HHMM no fuso da skill>,
//                                                        grava fonte.json nela, o caminho em
//                                                        rascunho/.captura-regua-atual, e o imprime (use o caminho
//                                                        impresso no `filename` das ferramentas do navegador)
//   node <skill>/_local/captura/pasta.mjs                imprime a pasta da captura atual
//   node <skill>/_local/captura/pasta.mjs ensaio         copia a skill para rascunho/ensaio-regua-<carimbo>/
//                                                        e imprime o caminho da copia (para o --raiz)
//
// O ponteiro mora fora da skill (rascunho/ nao se versiona). REGUA_PONTEIRO e REGUA_RASCUNHO trocam o
// arquivo do ponteiro e a pasta-mae (so para o teste-captura.mjs nao mexer nos de verdade).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { carimboLocal, fusoDaSkill } from './janela.mjs';

const { TIPOS } = createRequire(import.meta.url)('../regra-de-fonte.cjs');
const AQUI = path.dirname(fileURLToPath(import.meta.url));
const K = path.resolve(AQUI, '..');
const SKILL = path.resolve(K, '..');
// a raiz do workspace: a primeira pasta acima da skill com `.git` (vale para a skill e para a copia
// de ensaio em rascunho/, que assim dividem o mesmo ponteiro); sem git, <raiz>/.claude/skills/<skill>
function achaRaiz() {
  for (let d = path.dirname(SKILL); d !== path.dirname(d); d = path.dirname(d)) if (fs.existsSync(path.join(d, '.git'))) return d;
  return path.resolve(SKILL, '..', '..', '..');
}
const RAIZ = achaRaiz();
const RASCUNHO = process.env.REGUA_RASCUNHO || path.join(RAIZ, 'rascunho');
const PONTEIRO = process.env.REGUA_PONTEIRO || path.join(RASCUNHO, '.captura-regua-atual');
const mostra = (p) => { const r = path.relative(RAIZ, p); return (r.startsWith('..') || path.isAbsolute(r) ? p : r).split(path.sep).join('/'); };

// data e hora no fuso da skill (cobertura.json -> fuso; o padrao mora no janela.mjs)
const carimboLocalAgora = () => carimboLocal(Date.now(), fusoDaSkill());

export function pastaAtual() {
  if (!fs.existsSync(PONTEIRO)) throw new Error(`não há captura atual: rode \`node ${path.relative(process.cwd(), path.join(AQUI, 'pasta.mjs'))} nova <fonte>\` primeiro`);
  const p = fs.readFileSync(PONTEIRO, 'utf8').trim();
  if (!p || !fs.existsSync(p)) throw new Error(`o ponteiro ${PONTEIRO} aponta para uma pasta que não existe: ${p}`);
  return p;
}

// `@atual` -> a pasta do ponteiro, `@atual/x.json` -> um arquivo dentro dela; o resto passa como esta
export function resolvePasta(arg) {
  if (typeof arg !== 'string' || !(arg === '@atual' || arg.startsWith('@atual/'))) return arg;
  return path.join(pastaAtual(), arg.slice('@atual'.length));
}
// para os scripts de linha de comando: sem captura atual, a mensagem e saida 1 (sem pilha de erro)
export function argPasta(arg) {
  try { return resolvePasta(arg); } catch (e) { console.log(String(e.message || e)); process.exit(1); }
}

// a fonte de uma captura: o retrato gravado em <pasta>/fonte.json quando a pasta nasceu
export function fonteDaCaptura(pasta) {
  const f = path.join(pasta, 'fonte.json');
  if (!fs.existsSync(f)) throw new Error(`${pasta} não tem fonte.json: a pasta da captura nasce com \`pasta.mjs nova <fonte>\``);
  return JSON.parse(fs.readFileSync(f, 'utf8'));
}
// para os scripts de linha de comando: sem fonte.json, a mensagem e saida 1
export function argFonte(pasta) {
  try { return fonteDaCaptura(pasta); } catch (e) { console.log(String(e.message || e)); process.exit(1); }
}

const ehCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (ehCli) {
  const cmd = process.argv[2];
  try {
    if (cmd === 'nova') {
      const nome = process.argv[3];
      const C = JSON.parse(fs.readFileSync(path.join(K, 'cobertura.json'), 'utf8'));
      const fonte = (C.fontes || []).find((f) => f.nome === nome);
      if (!nome || !fonte) {
        const nomes = (C.fontes || []).map((f) => f.nome);
        throw new Error(`uso: pasta.mjs nova <fonte>. Fontes no cobertura.json: ${nomes.length ? nomes.join(', ') : 'nenhuma (adicione com captura/fontes.mjs adiciona)'}`);
      }
      const base = path.join(RASCUNHO, `captura-${fonte.nome}-${carimboLocalAgora()}`);
      let p = base;
      for (let i = 2; fs.existsSync(p); i++) p = `${base}-${i}`;   // duas no mesmo minuto
      fs.mkdirSync(p, { recursive: true });
      // o retrato da fonte: o `desde` e a marca em vigor AGORA (a janela comeca logo depois dela)
      const def = TIPOS[fonte.tipo];
      fs.writeFileSync(path.join(p, 'fonte.json'), JSON.stringify({ ...fonte, desde: fonte[def.marca] }, null, 2) + '\n', 'utf8');
      fs.mkdirSync(path.dirname(PONTEIRO), { recursive: true });
      fs.writeFileSync(PONTEIRO, p + '\n', 'utf8');
      console.log(mostra(p));
    } else if (cmd === 'ensaio') {
      const destino = path.join(RASCUNHO, `ensaio-regua-${carimboLocalAgora()}`, path.basename(SKILL));
      if (fs.existsSync(destino)) throw new Error(`já existe ${destino}`);
      fs.cpSync(SKILL, destino, { recursive: true });
      console.log(mostra(destino));
    } else if (!cmd) {
      console.log(mostra(pastaAtual()));
    } else { console.log('uso: pasta.mjs [nova <fonte> | ensaio]'); process.exit(2); }
  } catch (e) { console.log(String(e.message || e)); process.exit(1); }
}
