// Grava o veredito da triagem dentro de cada texto da captura, para que o destino de cada item
// fique ao lado do texto dele (e o guarda-imagens.mjs saiba de qual post a imagem pode entrar).
//
// Os textos moram em <pasta>/textos/<chave>.md (a chave e o id do post, ou o nome que voce deu ao
// texto de uma fonte web ou arquivo). O triagem.json fica na mesma pasta da captura:
//   {
//     "principio":      { "<chave>": "<titulo do principio novo>" },
//     "coberto":        { "<chave>": "<titulo do principio que ja cobre>" },
//     "fora_do_assunto":["<chave>", ...],                 // nao e design, conversao ou receita de produto
//     "sem_principio":  ["<chave>", ...]                  // do assunto, mas anuncio, pergunta, piada, so imagem
//   }
// Saida: a linha `triagem: "..."` no frontmatter do texto (troca o `triagem: pendente`).
//
// Uso: node <skill>/_local/captura/marca-triagem.mjs <pasta>/triagem.json [--escreve]

import fs from 'node:fs';
import path from 'node:path';
import { argPasta } from './pasta.mjs';

const arq = argPasta(process.argv[2]);   // aceita `@atual/triagem.json`
const ESCREVE = process.argv.includes('--escreve');
if (!arq || arq.startsWith('--')) { console.log('uso: marca-triagem.mjs <pasta>/triagem.json [--escreve]'); process.exit(1); }
const T = JSON.parse(fs.readFileSync(arq, 'utf8'));
const TEXTOS = path.join(path.dirname(arq), 'textos');

// o veredito de cada chave; o de principio comeca SEMPRE com "princípio: " (o guarda-imagens le isso)
const PREFIXO_PRINCIPIO = 'princípio: ';
const motivos = new Map();
for (const [c, titulo] of Object.entries(T.principio || {})) motivos.set(c, PREFIXO_PRINCIPIO + titulo);
for (const [c, titulo] of Object.entries(T.coberto || {})) motivos.set(c, `coberto por: ${titulo}`);
for (const c of T.fora_do_assunto || []) motivos.set(c, 'fora do assunto da skill');
for (const c of T.sem_principio || []) motivos.set(c, 'sem principio: anuncio, pergunta, piada, opiniao ou so imagem, sem mecanismo');
const desconhecidos = Object.keys(T).filter((k) => !['principio', 'coberto', 'fora_do_assunto', 'sem_principio'].includes(k));
if (desconhecidos.length) { console.log(`destino desconhecido no triagem.json: ${desconhecidos.join(', ')} (use principio, coberto, fora_do_assunto, sem_principio)`); process.exit(1); }

const aspas = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
let marcados = 0;
const semArquivo = [], semFrontmatter = [];
for (const [chave, motivo] of motivos) {
  const caminho = path.join(TEXTOS, chave + '.md');
  if (!fs.existsSync(caminho)) { semArquivo.push(chave); continue; }
  const t = fs.readFileSync(caminho, 'utf8');
  const fim = t.startsWith('---\n') ? t.indexOf('\n---\n', 4) : -1;
  if (fim < 0) { semFrontmatter.push(chave); continue; }
  let fm = t.slice(0, fim);
  fm = /^triagem: .*$/m.test(fm) ? fm.replace(/^triagem: .*$/m, `triagem: ${aspas(motivo)}`) : fm + `\ntriagem: ${aspas(motivo)}`;
  const novo = fm + t.slice(fim);
  if (novo !== t) { marcados++; if (ESCREVE) fs.writeFileSync(caminho, novo, 'utf8'); }
}
console.log(`${marcados} texto(s) ${ESCREVE ? 'marcados' : 'a marcar (simulacao)'}`
  + (semArquivo.length ? `; sem arquivo em ${TEXTOS}: ${semArquivo.join(', ')}` : '')
  + (semFrontmatter.length ? `; sem frontmatter: ${semFrontmatter.join(', ')}` : ''));
process.exit(semArquivo.length || semFrontmatter.length ? 1 : 0);
