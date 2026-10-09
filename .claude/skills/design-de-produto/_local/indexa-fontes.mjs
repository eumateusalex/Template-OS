// Fecha o elo fonte -> biblioteca em cada arquivo de fonte: onde o post entrou.
//
// Para cada arquivo em _local/fontes/: os usos são os .md da biblioteca que citam alguma
// imagem do mapa `imagens:` do cabeçalho, mais os listados em `relatado_em:` (marca-triagem.mjs).
//   - com uso: use_in_skill: true, themes: [seções], rodapé "**Na biblioteca em:** <arquivos>"
//   - sem uso e com `triagem:` (coberto / fora do assunto): use_in_skill: false e rodapé com o motivo
//   - sem uso e sem triagem: rodapé "ainda sem triagem" (o confere-biblioteca.mjs reprova)
//
// Uso: node <skill>/_local/indexa-fontes.mjs [--escreve]   (sem --escreve, só conta)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { arquivosDeFonte } from './captura/pasta.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SKILL = path.resolve(AQUI, '..');
const B = path.join(SKILL, 'biblioteca');
const { citacoes } = await import(pathToFileURL(path.join(AQUI, 'indexa-galeria.mjs')).href);
const ESCREVE = process.argv.includes('--escreve');
const cit = citacoes(B);
const conta = { com_uso: 0, sem_uso_com_motivo: 0, sem_triagem: 0, mudaram: 0 };
// toda fonte de toda pasta de fonte que existe (pasta.mjs: num clone limpo, pasta vazia não existe)
for (const { caminho: p } of arquivosDeFonte(path.join(AQUI, 'fontes'))) {
  const t0 = fs.readFileSync(p, 'utf8');
  const fim = t0.indexOf('\n---\n', 4);
  let fm = t0.slice(0, fim); let corpo = t0.slice(fim);
  const imgs = [...fm.matchAll(/^  - "\S+ -> galeria\/(\S+)"$/gm)].map((m) => m[1]);
  const rel = (() => { const m = fm.match(/^relatado_em: \[(.*)\]$/m); return m ? [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]) : []; })();
  const usos = new Set(rel.map((r) => r.replace(/^biblioteca\//, '')));
  for (const i of imgs) for (const u of cit[i] || []) usos.add(u);
  const lista = [...usos].sort();
  const triagem = (fm.match(/^triagem: "(.*)"$/m) || [])[1];
  let rodape;
  if (lista.length) {
    conta.com_uso++;
    fm = fm.replace(/^use_in_skill: .*$/m, 'use_in_skill: true');
    const secoes = [...new Set(lista.map((u) => u.split('/')[0]))].sort();
    fm = fm.replace(/^themes: .*$/m, `themes: [${secoes.map((s) => `"${s}"`).join(', ')}]`);
    rodape = `**Na biblioteca em:** ${lista.map((u) => `\`biblioteca/${u}\``).join(', ')}.`;
  } else if (triagem) {
    conta.sem_uso_com_motivo++;
    fm = fm.replace(/^use_in_skill: .*$/m, 'use_in_skill: false').replace(/^themes: .*$/m, 'themes: []');
    rodape = `**Nao destilado.** Triagem: ${triagem}.`;
  } else {
    conta.sem_triagem++;
    rodape = '**Nao destilado.** Capturado e ainda sem triagem (ver atualizar.md, passo 5).';
  }
  corpo = corpo.replace(/\*\*(?:Na biblioteca em:|Nao destilado\.)\*\*[\s\S]*$/, rodape + '\n');
  const novo = fm + corpo;
  if (novo !== t0) { conta.mudaram++; if (ESCREVE) fs.writeFileSync(p, novo, 'utf8'); }
}
console.log(conta, ESCREVE ? '(gravado)' : '(simulacao)');
process.exit(0);
