// O relatório de máquina das suítes de scripts/, numa cópia só.
//
// O `--relatorio <arquivo>` de uma suíte escreve o resultado em junit, e é ele
// que o `vermelho.mjs` da fábrica lê para gravar o vermelho por máquina. Fica num
// módulo porque várias suítes o usam: colado em cada uma, envelheceria torto.
//
// Cada caso registrado vira um testcase, com a falha dizendo o que o teste viu.
// Os casos que a suíte conta à mão, fora do registro, entram juntos num
// testcase só, para o total do relatório bater com o resumo da suíte.
//
// Uso, no fim da suíte:
//   escreveRelatorio(process.argv, 'nome-da-suite', casos, { passou, falhou, soltos: n => `os ${n} casos fora do caso()` });
//   resumoTap(passou, falhou);

import { writeFileSync } from 'node:fs';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

/**
 * Escreve o junit no caminho que vem depois de `--relatorio`, se ele veio.
 * @param {string[]} argv o `process.argv` da suíte
 * @param {string} suite o nome da suíte no relatório
 * @param {{ nome: string, falha: string|null }[]} casos os casos registrados
 * @param {{ passou: number, falhou: number, soltos?: (n: number) => string }} contas
 */
export function escreveRelatorio(argv, suite, casos, { passou, falhou, soltos = (n) => `os ${n} casos contados fora do registro` }) {
  const i = argv.indexOf('--relatorio');
  if (i < 0 || !argv[i + 1]) return;
  const nSoltos = passou + falhou - casos.length;
  const soltosFalhos = falhou - casos.filter((c) => c.falha).length;
  const todos = nSoltos > 0 ? [...casos, { nome: soltos(nSoltos), falha: soltosFalhos > 0 ? `${soltosFalhos} falha(s)` : null }] : casos;
  writeFileSync(argv[i + 1], `<testsuites><testsuite name="${esc(suite)}" tests="${todos.length}" failures="${todos.filter((c) => c.falha).length}">` +
    todos.map((c) => `<testcase name="${esc(c.nome)}">${c.falha ? `<failure message="${esc(`${c.nome}: ${c.falha}`)}"/>` : ''}</testcase>`).join('') +
    '</testsuite></testsuites>', 'utf8');
}

/** O resumo no formato TAP, que é o que o `mutar.mjs` da fábrica sabe ler. */
export function resumoTap(passou, falhou) {
  console.log(`# tests ${passou + falhou}\n# fail ${falhou}`);
}
