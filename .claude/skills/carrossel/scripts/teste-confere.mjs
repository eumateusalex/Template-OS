#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// teste-confere · a suíte do verificador
//
// Monta uma skill mínima válida numa pasta temporária, confere que ela passa,
// e depois quebra uma coisa por vez pra provar que cada checagem reprova o que
// promete. Um verificador que ninguém testou é um verificador que pode estar
// passando tudo.
//
// Uso:  node scripts/teste-confere.mjs
// Sai 0 se toda checagem se comportou, 1 se alguma não reprovou (ou reprovou
// o que devia passar).
// ═══════════════════════════════════════════════════════════════════════════

import { mkdirSync, writeFileSync, rmSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const CONFERE = join(AQUI, 'confere.mjs');
const BASE = join(tmpdir(), `confere-teste-${process.pid}`);
const PROIBIDAS = join(BASE, 'proibidas.txt'); // uma expressão por linha, como no uso real

// ─── a skill mínima válida ─────────────────────────────────────────────────

const FTR = (n, total) => {
  const tracos = Array.from({ length: total }, (_, j) => `<i${j < n - 1 ? ' class="feito"' : j === n - 1 ? ' class="agora"' : ''}></i>`).join('');
  return `<div class="ftr"><div class="bar">${tracos}</div><span class="count">${n}/${total}</span>${n < total ? '<span class="chev">›</span>' : ''}</div>`;
};
const SLIDE = (n, total) => `<div class="slide light">\n<div class="body"><h2>Slide ${n}</h2></div>\n${FTR(n, total)}\n</div>`;
const PECA = (total) => `<link rel="stylesheet" href="/.claude/skills/carrossel/marca/tokens.css">\n${Array.from({ length: total }, (_, i) => SLIDE(i + 1, total)).join('\n')}\n`;

const TOKENS_CONFIGURADO = `@import url('https://fonts.googleapis.com/css2?family=Inter&display=swap');
:root{
  --c-dark: 20,40,80;
  --c-light: 242,242,240;
  --c-accent: 200,120,40;
  --c-support-1: 60,90,140;
  --c-support-2: 225,232,245;
  --c-rare: 60,60,60;
  --c-abyss: 8,16,36;
  --c-ok: 140,190,240;
}
`;

function pacoteMinimo(dir) {
  const grava = (rel, conteudo) => {
    const abs = join(dir, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, conteudo);
  };
  grava('SKILL.md', '---\nname: carrossel\ndescription: teste\n---\n# Skill\n');
  grava('README.md', '# Leia\n\nVeja o [método](referencias/metodo.md).\n');
  grava('.gitignore', 'node_modules/\n');
  grava('marca/marca.molde.md', '# Marca\n\nESTADO: nao-configurado\n');
  grava('marca/tokens.molde.css', '/* ESTADO: nao-configurado */\n:root{ --c-dark: 40,40,40; }\n');
  grava('marca/logo/.gitkeep', '');
  grava('marca/fontes/.gitkeep', '');
  grava('kit/componentes.css', '.slide{ color: rgb(var(--c-dark)); }\n/* comentário com #abcdef não conta */\n');
  grava('kit/modelo-carrossel.html', PECA(3));
  grava('kit/catalogo.html', '<link rel="stylesheet" href="../marca/tokens.molde.css">\n<link rel="stylesheet" href="../marca/tokens.css">\n<p>catálogo</p>\n');
  grava('referencias/metodo.md', '# Método\n');
  grava('referencias/composicao.md', '# Composição\n');
  grava('referencias/trocar-de-marca.md', '# Trocar de marca\n');
  grava('referencias/entrevista.md', '# Entrevista\n');
  grava('render/render-carrossel.js', '// render\n');
  grava('render/servidor.js', '// servidor\n');
  grava('render/linha-do-tempo.mjs', '// linha\n');
  grava('render/teste-render.mjs', '// teste\n');
  grava('render/teste-servidor.mjs', '// teste do servidor\n');
  grava('render/package-lock.json', '{}\n');
  grava('render/package.json', '{ "name": "render" }\n');
  grava('render/instalar.md', '# Instalar\n');
  grava('scripts/confere.mjs', '// cópia só pra estrutura\n');
  grava('scripts/teste-confere.mjs', '// idem\n');
}

// ─── a máquina de casos ────────────────────────────────────────────────────

const casos = [];
const caso = (nome, esperaCod, mutacao, avisoEsperado = null) => casos.push({ nome, esperaCod, mutacao, avisoEsperado });

// esperaCod null = tem que passar limpo
caso('skill mínima passa limpa', null, () => {});

caso('G1 · palavra da lista --proibidas vazou', 'G1', (d) => writeFileSync(join(d, 'README.md'), '# Leia\n\nFeito pela Fulana.\n'));
caso('G1 · data de decisão vazou', 'G1', (d) => writeFileSync(join(d, 'referencias/metodo.md'), '# Método\n\nMudou em 01/01/2000.\n'));
caso('G1 · a marca da pessoa não se julga', null, (d) => writeFileSync(join(d, 'marca/marca.md'), '# Marca\n\nESTADO: nao-configurado\n\nNome: Fulana\n'));
caso('G2 · arquivo obrigatório sumiu', 'G2', (d) => unlinkSync(join(d, 'referencias/entrevista.md')));
caso('G2 · o servidor do render sumiu (sem ele o render morre no require)', 'G2', (d) => unlinkSync(join(d, 'render/servidor.js')));
caso('G2 · nome genérico', 'G2', (d) => writeFileSync(join(d, 'referencias/novo.md'), '# x\n'));
caso('G2 · nome que começa com teste mas diz o que é passa', null, (d) => writeFileSync(join(d, 'scripts/teste-algo.mjs'), '// ok\n'));
caso('A3 · marca da pessoa na skill só avisa', null, (d) => writeFileSync(join(d, 'marca/marca.md'), '# Marca\n\nNome: Fulana\n'), 'A3');
caso('G8 · caminho de máquina na marca da pessoa reprova', 'G8', (d) => writeFileSync(join(d, 'marca/tokens.css'), TOKENS_CONFIGURADO + "@font-face{src:url('C:\\\\fontes\\\\x.woff2')}\n"));
caso('G3 · link markdown quebrado', 'G3', (d) => writeFileSync(join(d, 'README.md'), '# Leia\n\n[x](referencias/nao-existe.md)\n'));
caso('G3 · href quebrado', 'G3', (d) => writeFileSync(join(d, 'kit/catalogo.html'), '<link rel="stylesheet" href="../marca/nao-existe.css">\n'));
caso('G3 · caminho da skill resolvido pra dentro dela', 'G3', (d) => writeFileSync(join(d, 'kit/modelo-carrossel.html'), PECA(3).replace('marca/tokens.css', 'marca/sumiu.css')));
caso('G3 · link dentro de bloco de código não conta', null, (d) => writeFileSync(join(d, 'README.md'), '# Leia\n\n```html\n<img src="03a.jpg">\n```\n\nE `outro/caminho.md` em crase.\n'));
caso('G3 · caminho do projeto da pessoa não se confere', null, (d) => writeFileSync(join(d, 'kit/modelo-carrossel.html'), PECA(3).replace('<div class="body">', '<div class="body" style="--img:url(\'/carrosseis/peca/capa.jpg\')">')));
caso('G4 · hex fora de comentário', 'G4', (d) => writeFileSync(join(d, 'kit/componentes.css'), '.slide{ color:#123456; }\n'));
caso('G5 · paleta em hex', 'G5', (d) => writeFileSync(join(d, 'marca/tokens.css'), TOKENS_CONFIGURADO.replace('--c-dark: 20,40,80;', '--c-dark: #142850;')));
caso('G5 · contraste baixo', 'G5', (d) => writeFileSync(join(d, 'marca/tokens.css'), TOKENS_CONFIGURADO.replace('--c-dark: 20,40,80;', '--c-dark: 200,200,200;')));
caso('G5 · sem @import de fonte', 'G5', (d) => writeFileSync(join(d, 'marca/tokens.css'), TOKENS_CONFIGURADO.replace(/@import[^\n]*\n/, '')));
caso('G5 · canal faltando', 'G5', (d) => writeFileSync(join(d, 'marca/tokens.css'), TOKENS_CONFIGURADO.replace(/--c-ok[^\n]*\n/, '')));
caso('G5 · molde em branco não se mede', null, (d) => writeFileSync(join(d, 'marca/tokens.css'), '/* ESTADO: nao-configurado */\n:root{ --c-dark: #000; }\n'));
caso('G5 · paleta configurada válida passa', null, (d) => writeFileSync(join(d, 'marca/tokens.css'), TOKENS_CONFIGURADO));
caso('G5 · acento sem contraste sobre a principal', 'G5', (d) => writeFileSync(join(d, 'marca/tokens.css'), TOKENS_CONFIGURADO.replace('--c-accent: 200,120,40;', '--c-accent: 40,60,100;')));
caso('G5 · acento sem contraste sobre o fundo claro', 'G5', (d) => writeFileSync(join(d, 'marca/tokens.css'), TOKENS_CONFIGURADO.replace('--c-accent: 200,120,40;', '--c-accent: 230,225,210;')));
caso('A2 · acento no limite só avisa', null, (d) => writeFileSync(join(d, 'marca/tokens.css'), TOKENS_CONFIGURADO.replace('--c-accent: 200,120,40;', '--c-accent: 180,110,50;')), 'A2');
caso('G3 · link pra marca/tokens.css ainda inexistente não reprova', null, (d) => {});
caso('G6 · travessão no README', 'G6', (d) => writeFileSync(join(d, 'README.md'), '# Leia\n\nIsto — aquilo.\n'));
caso('G6 · meia-risca também', 'G6', (d) => writeFileSync(join(d, 'referencias/metodo.md'), '# Método\n\nIsto – aquilo.\n'));
caso('G6 · a frase literal da pessoa pode ter travessão', null, (d) => writeFileSync(join(d, 'marca/marca.md'), '# Marca\n\nESTADO: nao-configurado\n\nFrase: eu falo assim — e pronto.\n'));
caso('G6 · travessão em texto de HTML', 'G6', (d) => writeFileSync(join(d, 'kit/catalogo.html'), '<p>Isto — aquilo</p>\n'));
caso('G6 · dentro de comentário HTML não conta', null, (d) => writeFileSync(join(d, 'kit/catalogo.html'), '<!-- isto — aquilo -->\n<p>ok</p>\n'));
caso('G7 · traço a menos', 'G7', (d) => writeFileSync(join(d, 'kit/modelo-carrossel.html'), PECA(3).replace('<i class="feito"></i><i class="feito"></i><i class="agora"></i>', '<i class="feito"></i><i class="agora"></i>')));
caso('G7 · contador errado', 'G7', (d) => writeFileSync(join(d, 'kit/modelo-carrossel.html'), PECA(3).replace('2/3', '3/3')));
caso('G7 · seta no último', 'G7', (d) => writeFileSync(join(d, 'kit/modelo-carrossel.html'), PECA(3).replace('<span class="count">3/3</span>', '<span class="count">3/3</span><span class="chev">›</span>')));
caso('G7 · aceso na posição errada', 'G7', (d) => writeFileSync(join(d, 'kit/modelo-carrossel.html'), PECA(2).replace('<i class="agora"></i><i></i>', '<i></i><i class="agora"></i>')));
caso('G7 · slide comentado não conta', null, (d) => writeFileSync(join(d, 'kit/modelo-carrossel.html'), PECA(3) + '<!--\n' + SLIDE(9, 9) + '\n-->\n'));
caso('G8 · caminho de máquina', 'G8', (d) => writeFileSync(join(d, 'render/instalar.md'), '# Instalar\n\nAbra C:\\Users\\alguem\\projeto\n'));
caso('G8 · /home/ também', 'G8', (d) => writeFileSync(join(d, 'render/instalar.md'), '# Instalar\n\ncd /home/alguem/projeto\n'));
caso('A1 · SKILL.md pesado avisa mas não reprova', null, (d) => writeFileSync(join(d, 'SKILL.md'), '---\nname: carrossel\n---\n' + 'regra '.repeat(3000)), 'A1');

// ─── roda ──────────────────────────────────────────────────────────────────

let falhas = 0;
mkdirSync(BASE, { recursive: true });
writeFileSync(PROIBIDAS, '# uma expressão regular por linha\nfulana\n');

for (const [i, c] of casos.entries()) {
  const dir = join(BASE, `caso-${i}`);
  pacoteMinimo(dir);
  c.mutacao(dir);
  const r = spawnSync(process.execPath, [CONFERE, '--raiz', dir, '--proibidas', PROIBIDAS], { encoding: 'utf8' });
  const saida = r.stdout + r.stderr;
  const temCod = (cod) => new RegExp(`^\\s+${cod} · `, 'm').test(saida);
  let ok;
  if (c.esperaCod === null) ok = r.status === 0 && (!c.avisoEsperado || temCod(c.avisoEsperado));
  else ok = r.status === 1 && temCod(c.esperaCod);
  console.log(`${ok ? '✅' : '❌'} ${c.nome}`);
  if (!ok) {
    falhas++;
    console.log(`     exit ${r.status}; saída:\n${saida.split('\n').map((l) => '     | ' + l).join('\n')}`);
  }
}

rmSync(BASE, { recursive: true, force: true });

console.log(`\n${casos.length} caso(s), ${falhas} falha(s).`);
process.exit(falhas ? 1 : 0);
