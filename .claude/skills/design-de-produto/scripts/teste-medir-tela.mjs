// Prova o medir-tela.cjs nos dois sentidos, com telas de prova escritas aqui:
//   - a tela limpa (clara e escura) sai 0;
//   - cada tela com UM defeito sai 1 E imprime a linha da medida certa (não basta sair 1: um defeito
//     que derruba outra medida esconderia a morte desta);
//   - cada medida, quebrada numa cópia do medidor, deixa o seu caso passar sem a linha (a mutação é
//     conferida antes: se o trecho não estiver no medidor exatamente uma vez, o teste reprova).
//
// Precisa do Playwright e do Chromium que o medidor acha (o mesmo das maquetes). Leva cerca de 1 a 2 min.
//
// Uso: node .claude/skills/design-de-produto/scripts/teste-medir-tela.mjs

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const MEDIDOR = path.join(AQUI, 'medir-tela.cjs');
// a cópia mutante fica ao lado do original (o medidor acha o Playwright pelo próprio caminho) e sai no fim
const MUTANTE = path.join(AQUI, '_mutante-medir-tela.cjs');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'teste-medir-tela-'));

const pagina = (corpo, fundo = '#ffffff', cor = '#1a1a1a') => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>prova</title>
<style>body{margin:0;padding:24px;font:16px/1.5 system-ui,sans-serif;background:${fundo};color:${cor}}
button{min-height:48px;padding:0 16px;font:inherit}</style></head><body>${corpo}</body></html>`;
const LIMPO = '<main><h1>Fila de pedidos</h1><p>Três pedidos esperando resposta.</p><button>Abrir</button></main>';

// [nome, html, tema, linha esperada (regex de linha inteira), mutação [de, para] que cega a medida]
const DEFEITOS = [
  ['estouro horizontal', pagina(LIMPO + '<div style="width:700px">largo demais</div>'), 'claro',
    /^ {4}estouro: div "largo demais"$/m, ['r.right > pedida + 1 || r.left < -1', 'false']],
  ['alvo de toque abaixo de 44 px', pagina(LIMPO + '<p><a href="#ver" style="display:inline-block;height:20px;line-height:20px">ver tudo</a></p>'), 'claro',
    /^ {4}toque: ver tudo 20px$/m, ['a.efetiva < 44', 'a.efetiva < 0']],
  ['contraste de selo', pagina(LIMPO + '<p><span class="selo" style="display:inline-block;padding:6px 12px;background:#dddddd;color:#c8c8c8">novo</span></p>'), 'claro',
    /^ {4}contraste: novo \d+(\.\d+)?$/m, ['s.c < 4.5', 's.c < 0']],
  ['número quebrado', pagina(LIMPO + '<div style="width:40px">R$ 7.842,16</div>'), 'claro',
    /^ {4}número quebrado: "R\$ 7\.842,16"$/m, ["linhasDe(x.n) > 1).map(x => '\"' + x.t + '\"')", "linhasDe(x.n) > 99).map(x => '\"' + x.t + '\"')"]],
  ['texto sobreposto', pagina(LIMPO + '<div style="position:relative;height:40px"><span style="position:absolute;left:0;top:0">Maria Souza</span><span style="position:absolute;left:12px;top:0">Pediu ajuda</span></div>'), 'claro',
    /^ {4}sobreposto: "Maria Souza" × "Pediu ajuda"$/m, ['if (w > 2 && hh > 4) sobrepostos.push', 'if (false) sobrepostos.push']],
  ['fundo quase preto', pagina(LIMPO, '#050505', '#eeeeee'), 'escuro',
    /^ {4}fundo: .* é mais escuro que #111317; o escuro da skill é o grafite #181A1F/m, ['const fundoEscuroDemais = lf < 0.18 && lf < PISO_DO_ESCURO;', 'const fundoEscuroDemais = false;']],
];

const mede = (medidor, nome, html, tema) => {
  const d = path.join(TMP, nome.replace(/\W+/g, '-'));
  fs.mkdirSync(d, { recursive: true });
  const arq = path.join(d, 'tela.html');
  fs.writeFileSync(arq, html);
  const env = { ...process.env }; delete env.NODE_TEST_CONTEXT;
  const r = spawnSync(process.execPath, [medidor, arq, '--saida', d, '--tema', tema], { encoding: 'utf8', env, timeout: 120000 });
  return { codigo: r.status, saida: (r.stdout || '') + (r.stderr || '') };
};
const resultados = [];
const caso = (nome, ok, visto) => { resultados.push(ok); console.log(`${ok ? 'ok    ' : 'FALHOU'}  ${nome}${ok ? '' : '  -> ' + String(visto).trim().split('\n').slice(-6).join(' | ')}`); };

try {
  // 1. limpo: sai 0, todas as combinações OK
  for (const [nome, html, tema] of [['limpo claro', pagina(LIMPO), 'claro'], ['limpo escuro (grafite)', pagina(LIMPO, '#181A1F', '#eeeeee'), 'escuro']]) {
    const r = mede(MEDIDOR, nome, html, tema);
    const linhas = r.saida.split('\n').filter((l) => /^(OK |REPROVA)/.test(l));
    caso(`${nome}: sai 0 e as duas combinações dão OK`, r.codigo === 0 && linhas.length === 2 && linhas.every((l) => l.startsWith('OK ')), r.saida);
  }
  // 2. cada defeito: sai 1 com a linha da medida certa
  for (const [nome, html, tema, linha] of DEFEITOS) {
    const r = mede(MEDIDOR, nome, html, tema);
    caso(`${nome}: sai 1 com a linha da medida`, r.codigo === 1 && linha.test(r.saida), r.saida);
  }
  // 3. cada medida quebrada no medidor: o caso dela deixa de achar a linha
  const fonte = fs.readFileSync(MEDIDOR, 'utf8');
  for (const [nome, html, tema, linha, [de, para]] of DEFEITOS) {
    const vezes = fonte.split(de).length - 1;
    if (vezes !== 1) { caso(`mutação "${nome}" aplica (o trecho existe 1 vez no medidor)`, false, `achei ${vezes} vez(es): ${de}`); continue; }
    fs.writeFileSync(MUTANTE, fonte.replace(de, () => para));
    const r = mede(MUTANTE, 'mutante-' + nome, html, tema);
    caso(`medida "${nome}" quebrada: o caso perde a linha`, !linha.test(r.saida), r.saida);
  }
} finally {
  fs.rmSync(MUTANTE, { force: true });
  fs.rmSync(TMP, { recursive: true, force: true });
}

const falhas = resultados.filter((x) => !x).length;
console.log(falhas ? `\nFALHOU — ${falhas} de ${resultados.length} casos` : `\nTUDO CERTO — ${resultados.length} casos`);
process.exit(falhas ? 1 : 0);
