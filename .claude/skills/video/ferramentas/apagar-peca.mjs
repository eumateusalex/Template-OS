// Apaga uma pasta de peça sem atravessar as junções dela.
//
//   node .claude/skills/video/ferramentas/apagar-peca.mjs <pasta>               tira as junções e apaga a pasta
//   node .claude/skills/video/ferramentas/apagar-peca.mjs <pasta> --so-juncoes  só tira as junções (a pasta fica)
//
// Só aceita pasta de peça (com hyperframes.json e sem .git): a peça pode morar
// fora do estúdio (na pasta de um cliente, de um projeto, em rascunho/), e lá a
// lista de pastas protegidas deste workspace não cobre nada.
//
// 🚨 Por que existe: a peça tem junção (`_marca` → a marca do workspace,
// `_vendor` → o GSAP). `rm -rf` e o Explorer ATRAVESSAM a junção e apagam o alvo:
// apagar desse jeito a pasta de uma peça em `rascunho/` apaga o `tokens.css`, a
// logo e as fontes da marca. Aqui a junção sai primeiro, com `rmdir` (que remove
// o link e não entra nele), e a pasta só é apagada quando não sobra link nenhum
// dentro dela.
import { existsSync, lstatSync, readdirSync, rmdirSync, unlinkSync, rmSync, realpathSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const PROTEGIDAS = ['', 'identidade', '.claude', '.claude/video', '.claude/video/html', '.claude/video/html/_vendor',
  '.claude/skills', '.claude/skills/carrossel', '.claude/skills/carrossel/marca', 'rascunho', 'saidas', 'clientes', 'projetos-pessoais'];

/** Os links (junção ou symlink) dentro da pasta, sem entrar neles. */
export function links(pasta) {
  const achados = [];
  const anda = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (lstatSync(p).isSymbolicLink()) achados.push(p);
      else if (e.isDirectory()) anda(p);
    }
  };
  anda(pasta);
  return achados;
}

export function apagarPeca(pasta, { soJuncoes = false, raiz = RAIZ } = {}) {
  const alvo = resolve(pasta);
  if (!existsSync(alvo)) throw new Error(`apagar-peca: ${alvo} não existe`);
  if (PROTEGIDAS.map((p) => resolve(raiz, p)).includes(alvo)) throw new Error(`apagar-peca: ${alvo} é pasta do workspace, não peça; recuso`);
  if (existsSync(join(alvo, '.git'))) throw new Error(`apagar-peca: ${alvo} é um repositório (tem .git), não peça; recuso`);
  if (!existsSync(join(alvo, 'hyperframes.json'))) throw new Error(`apagar-peca: ${alvo} não é peça (falta hyperframes.json); recuso`);
  const removidos = [];
  for (const l of links(alvo)) {
    try { rmdirSync(l); } catch { unlinkSync(l); } // junção e symlink de pasta saem com rmdir; de arquivo, com unlink
    removidos.push(l);
  }
  const sobrou = links(alvo);
  if (sobrou.length) throw new Error(`apagar-peca: sobrou link em ${sobrou.join(', ')}; não apago a pasta`);
  if (!soJuncoes) rmSync(alvo, { recursive: true, force: true });
  return { removidos, apagada: !soJuncoes };
}

// realpath: chamado por um link, o caminho digitado não é o real, e sem isto o
// script saía calado sem fazer nada
if (process.argv[1] && realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))) {
  const [pasta] = process.argv.slice(2);
  if (!pasta) { console.error('uso: node apagar-peca.mjs <pasta> [--so-juncoes]'); process.exit(2); }
  try {
    const r = apagarPeca(pasta, { soJuncoes: process.argv.includes('--so-juncoes') });
    for (const l of r.removidos) console.log(`junção removida: ${l}`);
    console.log(r.apagada ? `pasta apagada: ${resolve(pasta)}` : 'junções removidas; a pasta ficou');
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
