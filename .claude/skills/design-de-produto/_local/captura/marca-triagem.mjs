// Grava o veredito da triagem dentro do arquivo de fonte, para que o motivo de um post ter (ou não)
// entrado na biblioteca fique ao lado do texto dele, e não só no CHANGELOG.
//
// Entrada: um triagem.json no formato
//   {
//     "relatado_em":     { "<id>": ["biblioteca/08-.../janelas/x.md", ...] },  // post sem imagem (ou
//                         // cuja imagem não basta) que a biblioteca relata: texto, resposta, legenda
//     "coberto":         { "<id>": "<onde a biblioteca já cobre>" },
//     "fora_do_assunto": { "<id>": "<motivo curto>" },  // não é design de tela: política, vida pessoal,
//                         // IA como assunto, promoção solta, notícia
//     "nota":            { "<id>": "<observação>" }      // ex.: legenda fora do assunto num post cuja
//                         // imagem entrou
//   }
// Post com imagem citada pela biblioteca não precisa de linha aqui: o indexa-fontes.mjs acha o uso
// sozinho pelo mapa `imagens:` do cabeçalho.
// Saída: no cabeçalho, `relatado_em: [...]`, `triagem: "..."` e `nota_triagem: "..."`; depois rode o
// indexa-fontes.mjs, que escreve use_in_skill, themes e o rodapé.
//
// Uso: node <skill>/_local/captura/marca-triagem.mjs <triagem.json> [--escreve]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pastaDaCaptura, fonteDoId } from './pasta.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const F = path.resolve(AQUI, '..', 'fontes');
const SKILL = path.resolve(AQUI, '..', '..');
// o triagem.json: o 1º argumento, ou <pasta da captura>/triagem.json
const arq = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(pastaDaCaptura(['', '', '--']), 'triagem.json');
const ESCREVE = process.argv.includes('--escreve');
if (!arq) { console.log('uso: marca-triagem.mjs <triagem.json> [--escreve]'); process.exit(1); }
const T = JSON.parse(fs.readFileSync(arq, 'utf8'));
const aspas = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
const ids = new Set([...Object.keys(T.relatado_em || {}), ...Object.keys(T.coberto || {}), ...Object.keys(T.fora_do_assunto || {}), ...Object.keys(T.nota || {})]);
let marcados = 0; const semArquivo = [], destinoRuim = [];
for (const id of ids) {
  const caminho = fonteDoId(F, id);
  if (!caminho) { semArquivo.push(id); continue; }
  let t = fs.readFileSync(caminho, 'utf8');
  const fim = t.indexOf('\n---\n', 4);
  let fm = t.slice(0, fim); const corpo = t.slice(fim);
  fm = fm.replace(/^(relatado_em|triagem|nota_triagem): .*\n?/gm, '');
  const extra = [];
  const rel = (T.relatado_em || {})[id];
  if (rel) {
    for (const r of rel) if (!fs.existsSync(path.join(SKILL, r))) destinoRuim.push(`${id} -> ${r}`);
    extra.push(`relatado_em: [${rel.map(aspas).join(', ')}]`);
  }
  if ((T.coberto || {})[id]) extra.push(`triagem: ${aspas('coberto por: ' + T.coberto[id])}`);
  if ((T.fora_do_assunto || {})[id]) extra.push(`triagem: ${aspas('fora do assunto da skill: ' + T.fora_do_assunto[id])}`);
  if ((T.nota || {})[id]) extra.push(`nota_triagem: ${aspas(T.nota[id])}`);
  fm = fm.replace(/^use_in_skill: .*$/m, (m) => m + (extra.length ? '\n' + extra.join('\n') : ''));
  const novo = fm + corpo;
  if (novo !== t) { marcados++; if (ESCREVE) fs.writeFileSync(caminho, novo, 'utf8'); }
}
console.log(`${marcados} arquivo(s) ${ESCREVE ? 'marcados' : 'a marcar (simulacao)'}` + (semArquivo.length ? `; sem arquivo: ${semArquivo.join(', ')}` : '') + (destinoRuim.length ? `; destino inexistente: ${destinoRuim.join(', ')}` : ''));
console.log('depois: node <skill>/_local/indexa-fontes.mjs --escreve');
process.exit(semArquivo.length || destinoRuim.length ? 1 : 0);
