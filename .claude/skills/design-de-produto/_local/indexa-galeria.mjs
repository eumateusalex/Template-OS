// Gera biblioteca/galeria/INDICE.md a partir de _local/galeria.json e dos .md da biblioteca.
//
// Para cada imagem: o arquivo, o que ela mostra numa linha, a secao que ela ilustra, quem a usa
// (os .md que citam o caminho) e a captura que a trouxe ("base" para as imagens que vêm com a
// skill). O que a imagem mostra e a
// captura moram no galeria.json (o cataloga.mjs escreve as novas); o "usada em" sai da leitura
// dos .md, entao nunca fica velho. O confere-biblioteca.mjs gera de novo em memoria e reprova
// se o INDICE.md gravado for diferente.
//
// Uso: node <skill>/_local/indexa-galeria.mjs [--escreve]   (sem --escreve, so diz se mudaria)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));

export const SECOES = {
  '01-sistema-visual': ['01 · Sistema visual', '01-sistema-visual/README.md'],
  '02-componentes': ['02 · Componentes', '02-componentes/README.md'],
  '03-padroes-de-ia': ['03 · Padrões de IA', '03-padroes-de-ia/README.md'],
  '04-tipos-de-tela': ['04 · Tipos de tela', '04-tipos-de-tela/README.md'],
  '05-apresentacao': ['05 · Apresentação', '05-apresentacao/README.md'],
  '06-produtos': ['06 · Produtos', '06-produtos/README.md'],
  '09-do-generico-ao-produto': ['09 · Do genérico ao produto', '09-do-generico-ao-produto/README.md'],
};

// o rótulo das imagens que vêm com a skill, sem captura
export const BASE = 'base';


// arquivos .md da biblioteca (fora da galeria), relativos a biblioteca/
export function mdsDaBiblioteca(B) {
  const out = [];
  const anda = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== 'galeria') anda(p); } else if (e.name.endsWith('.md')) out.push(path.relative(B, p).split(path.sep).join('/'));
  });
  anda(B);
  return out.sort();
}

// quem cita cada imagem: { '<secao>/<arq>': ['06-produtos/x.md', ...] }
export function citacoes(B) {
  const cit = {};
  for (const rel of mdsDaBiblioteca(B)) {
    const t = fs.readFileSync(path.join(B, rel), 'utf8');
    for (const m of t.matchAll(/galeria\/(\d\d-[a-z0-9-]+\/[a-z0-9-]+\.(?:jpg|png))/g)) {
      (cit[m[1]] = cit[m[1]] || new Set()).add(rel);
    }
  }
  return Object.fromEntries(Object.entries(cit).map(([k, v]) => [k, [...v].sort()]));
}

export function geraIndice(SKILL) {
  const B = path.join(SKILL, 'biblioteca');
  const gal = JSON.parse(fs.readFileSync(path.join(SKILL, '_local', 'galeria.json'), 'utf8'));
  const cit = citacoes(B);
  const porSecao = {};
  for (const [arq, e] of Object.entries(gal)) (porSecao[arq.split('/')[0]] = porSecao[arq.split('/')[0]] || []).push([arq, e]);
  const total = Object.keys(gal).length;
  const novas = Object.values(gal).filter((e) => e.captura !== BASE).length;
  const L = [
    '# Índice da galeria',
    '',
    `Toda imagem da galeria, uma linha cada: **${total} imagens** em ${Object.keys(porSecao).length} seções.`,
    novas ? `${total - novas} vêm com a skill (base) e ${novas} das capturas.` : 'Todas vêm com a skill (base); as capturas acrescentam as delas.',
    '',
    'Gerado por `node .claude/skills/design-de-produto/_local/indexa-galeria.mjs --escreve` a partir de',
    '`_local/galeria.json` (o que a imagem mostra e de que captura veio) e dos `.md` da biblioteca',
    '(quem a usa). Não editar à mão: o `confere-biblioteca.mjs` reprova índice fora de dia.',
    '',
    '**Nome do arquivo:** `<seção>/<assunto>-<produto>.jpg` (`.png` quando o original é PNG), escrito por',
    'quem viu a imagem; nunca o id do post. Vídeo vira `video-<assunto>-<produto>-capa.jpg` e `-quadro-1..3.jpg` (15%, 50% e 85% da',
    'duração). A ligação com o post não depende do nome: o arquivo de fonte da captura (em',
    '`_local/fontes/`) traz o mapa `imagens:` no cabeçalho.',
    '',
    '**Só entra imagem que a skill usa:** tela de produto, componente, padrão de IA, tipo de tela, shot',
    'de apresentação, microcopy ou sistema visual. Foto solta, meme, promoção e print social ficam fora',
    '(registrados no arquivo de fonte como "imagem não guardada").',
    '',
  ];
  for (const sec of Object.keys(porSecao).sort()) {
    const [nome, readme] = SECOES[sec] || [sec, null];
    const itens = porSecao[sec].sort((a, b) => (a[0] < b[0] ? -1 : 1));
    L.push(`## ${nome} — \`${sec}/\` (${itens.length})`);
    L.push('');
    L.push('| Arquivo | O que mostra | Usada em | Captura |');
    L.push('|---|---|---|---|');
    for (const [arq, e] of itens) {
      const usos = (cit[arq] || []).map((r) => `[${r}](../${r})`).join('<br>') || `ilustra a seção${readme ? ` [${nome}](../${readme})` : ''} (nenhum .md cita)`;
      // o rótulo é o id da captura (único: ver captura/janela.mjs), nunca o dia do post: a biblioteca
      // não guarda data de calendário (o dia fica no galeria.json, dado de máquina da captura)
      const cap = e.captura === BASE ? 'base' : `captura ${e.captura}`;
      L.push(`| [\`${arq.split('/')[1]}\`](${arq}) | ${String(e.mostra).replace(/\|/g, '\\|')} | ${usos} | ${cap} |`);
    }
    L.push('');
  }
  return L.join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const SKILL = path.resolve(AQUI, '..');
  const arq = path.join(SKILL, 'biblioteca', 'galeria', 'INDICE.md');
  const novo = geraIndice(SKILL);
  const velho = fs.existsSync(arq) ? fs.readFileSync(arq, 'utf8') : '';
  if (novo === velho) { console.log('galeria/INDICE.md em dia'); process.exit(0); }
  if (process.argv.includes('--escreve')) { fs.writeFileSync(arq, novo, 'utf8'); console.log('galeria/INDICE.md regenerado'); }
  else { console.log('galeria/INDICE.md mudaria (rode com --escreve)'); process.exit(1); }
}
