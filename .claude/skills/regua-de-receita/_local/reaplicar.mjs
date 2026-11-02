// Aplica as entradas locais em references/, a partir do manifesto.
//
// O texto de cada entrada mora em entradas/, a lista mora em manifesto.json, e este
// arquivo e so o motor. Ele tambem serve de rede: se references/ for danificado ou
// substituido por uma copia antiga, uma passada reconstroi as entradas.
//
// Idempotente por construcao: rodar duas vezes nao duplica nada, e `--check` exige
// exatamente zero mudanca (e o que prova a idempotencia).
//
// Rodar: node _local/reaplicar.mjs [--escreve|--check]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SKILL = path.resolve(AQUI, '..');
const REFS = path.join(SKILL, 'references');

const ESCREVE = process.argv.includes('--escreve');
const CHECK = process.argv.includes('--check');

const M = JSON.parse(fs.readFileSync(path.join(AQUI, 'manifesto.json'), 'utf8'));

// Ordem canonica dos rotulos (a mesma do metodo.md e do verificar.js). O upsert usa isto para
// inserir na posicao certa, e nao "antes do ultimo", que quebra em bloco sem o rotulo opcional.
const LABELS = ['**Principle.**', '**Apply when.**', '**The move.**', '**Evidence.**',
  '**Visual.**', '**In one line.**'];

const mudancas = [];
const relata = (o, msg) => mudancas.push(`${o}: ${msg}`);
const tituloDe = (b) => b.split('\n')[0].slice(3).trim();

function blocosDe(txt) {
  const partes = txt.split(/\n(?=## )/);
  return { cabeca: partes[0].startsWith('## ') ? '' : partes[0], blocos: partes.filter((b) => b.startsWith('## ')) };
}

// O split em /\n(?=## )/ CONSOME o \n que precede cada "## ". Juntar com '\n' devolve esse
// separador ENTRE blocos, mas nao entre o cabecalho do arquivo e o primeiro bloco: sem o
// '\n' explicito, a reconstrucao sai com um \n a menos e cola o blockquote de abertura no
// primeiro principio. Um unico byte, que so o gabarito byte a byte pega.
function junta(cabeca, blocos) {
  return (cabeca ? cabeca + '\n' : '') + blocos.join('\n');
}

// Preserva o fim de arquivo que o tema usa. Nem todo arquivo de tema termina em quebra de linha,
// e acrescentar um bloco num arquivo assim deixaria uma quebra a mais (ou a menos). Um byte
// invisivel num diff, e o unico jeito de ve-lo e comparar byte a byte.
function preservaFim(original, novo) {
  const fimOriginal = (original.match(/\n*$/) || [''])[0];
  return novo.replace(/\n*$/, fimOriginal);
}

// Principio novo: entra no FIM do tema (a ordem de um tema e a ordem em que os principios
// chegaram; o Quick index do topo e regenerado pelo indexar.mjs). Ja existe um bloco com o mesmo
// titulo: nada a fazer (o titulo e a identidade de um principio).
function insereNovo(entrada, texto) {
  const alvoPath = path.join(REFS, entrada.tema + '.md');
  if (!fs.existsSync(alvoPath)) { relata(entrada.arquivo, `tema ${entrada.tema} nao existe`); return null; }
  const atual = fs.readFileSync(alvoPath, 'utf8');
  const titulo = (texto.match(/^## (.+)$/m) || [, ''])[1].trim();
  if (!titulo) { relata(entrada.arquivo, 'entrada sem titulo (## ...)'); return null; }
  const { cabeca, blocos } = blocosDe(atual);
  if (blocos.some((b) => tituloDe(b) === titulo)) return null;

  // o ultimo bloco ganha a linha em branco que separa blocos, e o novo entra depois dela
  const ult = blocos.length - 1;
  if (ult >= 0) blocos[ult] = blocos[ult].replace(/\n*$/, '\n');
  const saida = junta(cabeca, [...blocos, texto.trim() + '\n']);
  relata(entrada.arquivo, `inserida no fim de ${entrada.tema}`);
  return { caminho: alvoPath, conteudo: preservaFim(atual, saida) };
}

function enriquece(entrada, fragmento) {
  const alvoPath = path.join(REFS, entrada.tema + '.md');
  if (!fs.existsSync(alvoPath)) { relata(entrada.arquivo, `tema ${entrada.tema} nao existe`); return null; }
  const atual = fs.readFileSync(alvoPath, 'utf8');
  const { cabeca, blocos } = blocosDe(atual);

  const i = blocos.findIndex((b) => tituloDe(b) === entrada.alvo);
  if (i < 0) { relata(entrada.arquivo, `alvo "${entrada.alvo}" nao encontrado em ${entrada.tema}`); return null; }

  const fimBloco = (blocos[i].match(/\s*$/) || [''])[0];
  const linhas = blocos[i].replace(/\s+$/, '').split('\n');
  let mexeu = false;
  for (const nova of fragmento.split('\n').map((l) => l.trim()).filter(Boolean)) {
    const rot = LABELS.find((x) => nova.startsWith(x));
    if (!rot) continue;
    const j = linhas.findIndex((l) => l.startsWith(rot));
    if (j >= 0) {
      if (linhas[j] === nova) continue;                    // identica: no-op, idempotencia
      relata(entrada.arquivo, `substitui ${rot} (confira o diff)`);
      linhas[j] = nova;
      mexeu = true;
    } else {
      // insere na posicao canonica: antes do primeiro rotulo que vem depois dele na ordem
      const ordem = LABELS.indexOf(rot);
      let k = linhas.findIndex((l) => {
        const r = LABELS.find((x) => l.startsWith(x));
        return r && LABELS.indexOf(r) > ordem;
      });
      if (k < 0) k = linhas.length;
      linhas.splice(k, 0, nova);
      relata(entrada.arquivo, `acrescenta ${rot} em "${entrada.alvo}"`);
      mexeu = true;
    }
  }
  if (!mexeu) return null;
  blocos[i] = linhas.join('\n') + fimBloco;
  return { caminho: alvoPath, conteudo: preservaFim(atual, junta(cabeca, blocos)) };
}

// ---------- entradas ----------
for (const e of M.entradas) {
  const arq = path.join(AQUI, 'entradas', e.arquivo);
  if (!fs.existsSync(arq)) { relata(e.arquivo, 'arquivo de entrada ausente'); continue; }
  const texto = fs.readFileSync(arq, 'utf8');
  const r = e.modo === 'enriquecer' ? enriquece(e, texto.replace(/^<!--.*-->\s*\n/, '')) : insereNovo(e, texto);
  // grava na hora: a proxima entrada do mesmo tema le o arquivo ja com esta (e, sem --escreve, a
  // simulacao relata cada entrada contra o estado de antes)
  if (r && ESCREVE) fs.writeFileSync(r.caminho, r.conteudo, 'utf8');
}

// ---------- relatorio ----------
console.log(`entradas no manifesto : ${M.entradas.length}`);
console.log(`mudancas              : ${mudancas.length}`);
for (const m of mudancas) console.log('  - ' + m);

if (CHECK) {
  if (mudancas.length === 0) { console.log('\nIDEMPOTENTE — nada a fazer, a skill ja esta reaplicada'); process.exit(0); }
  console.log('\nHA PENDENCIA. Rode: node _local/reaplicar.mjs --escreve');
  process.exit(1);
}

if (!ESCREVE) {
  console.log('\nsimulacao. Rode com --escreve para valer.');
} else if (mudancas.length) {
  console.log('\nProximo passo: bash _local/sincronizar.sh --completo');
}
