// Resolve as imagens pendentes dos textos de uma captura, depois de VISTAS. E o unico script de
// captura que escreve imagem dentro da skill.
//
// O escreve-textos.mjs grava cada imagem como "imagem pendente de triagem (`<id>__<n>`)". Este
// script le as decisoes que voce escreveu depois de abrir cada imagem e:
//   - fica: copia <pasta>/imagens/<chave>.<ext> para assets/<tema>/<nome>.<ext> (a extensao lida da
//     assinatura do arquivo, nao da URL nem do nome de trabalho), registra a imagem no catalogo
//     _local/imagens.json (shows, e why quando nenhum principio vai cita-la) e troca a linha do
//     texto pelo caminho novo. So entra imagem de post cuja triagem e `principio`
//     (marca-triagem.mjs): post coberto, sem principio ou fora do assunto nao poe imagem na skill
//   - sai : troca a linha por "imagem não guardada: <motivo> — <descricao>"
//   - --fora <ids>: post fora do assunto (nem foi baixado): todas as pendentes dele saem com
//     "fora do assunto da skill — não baixada (post fora do assunto)"
//
// <pasta>/decisoes-de-imagem.json, um item por imagem vista:
//   { "chave": "2102077564839690371__1", "decisao": "fica", "tema": "pricing-and-monetization",
//     "nome": "ai-render-locked-feature-paywall", "shows": "o que a imagem mostra, numa linha",
//     "why": "so se nenhum principio vai cita-la: por que ela ilustra o tema" }
//   { "chave": "2100528207896224120__1", "decisao": "sai", "descricao": "foto de torrada no café",
//     "motivo": "sem valor de design (foto de comida)" }
//
// Regras: nome em ingles (a lingua dos principios), kebab-case, sem id de post; tema e um dos
// de references/. Cite a imagem no principio pelo caminho novo (`../assets/<tema>/<nome>.<ext>`).
//
// Uso: node <skill>/_local/captura/guarda-imagens.mjs <pasta> [--fora id1,id2] [--escreve]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { argPasta } from './pasta.mjs';
import { extensaoReal, lerCatalogo, gravaCatalogo } from './imagens.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const K = path.resolve(AQUI, '..');
const S = path.resolve(K, '..');
const ASSETS = path.join(S, 'assets');
const ESCREVE = process.argv.includes('--escreve');
const pasta = argPasta(process.argv[2]);   // `@atual` = a captura do ponteiro (pasta.mjs)
if (!pasta || pasta.startsWith('--')) { console.log('uso: guarda-imagens.mjs <pasta | @atual> [--fora id1,id2] [--escreve]'); process.exit(1); }
const iF = process.argv.indexOf('--fora');
const fora = new Set(iF > -1 ? process.argv[iF + 1].split(',').map((s) => s.trim()).filter(Boolean) : []);
const arqDec = path.join(pasta, 'decisoes-de-imagem.json');
const decisoes = fs.existsSync(arqDec) ? JSON.parse(fs.readFileSync(arqDec, 'utf8')) : [];
const temas = fs.readdirSync(path.join(S, 'references')).filter((f) => f.endsWith('.md')).map((f) => f.replace('.md', ''));
const catalogo = lerCatalogo(K);

const TEXTOS = path.join(pasta, 'textos');
const arquivos = fs.existsSync(TEXTOS) ? fs.readdirSync(TEXTOS).filter((a) => a.endsWith('.md')).map((a) => path.join(TEXTOS, a)) : [];
const textos = new Map(arquivos.map((f) => [f, fs.readFileSync(f, 'utf8')]));
const PEND = /^(\d+)\. imagem pendente de triagem \(`([^`]+)`\)(?: — (\S+))?\s*$/;
const triagemDe = (t) => { const fm = t.startsWith('---\n') ? t.slice(0, t.indexOf('\n---\n', 4)) : ''; return (fm.match(/^triagem: (.*)$/m) || [, 'pendente'])[1]; };
const naoGuardada = (descricao, motivo) => `imagem não guardada: ${motivo} — ${descricao}`;

// nada se grava ate o fim: com qualquer erro, nem imagem, nem catalogo, nem texto
const erros = [], copias = [], feito = { ficam: 0, saem: 0, fora: 0, ja: 0 };
const mexe = (arq, fn) => textos.set(arq, fn(textos.get(arq)));
const trocaPendente = (t, chave, nova) => t.split('\n').map((l) => { const m = l.match(PEND); return m && m[2] === chave ? `${m[1]}. ${nova}${m[3] ? ' — ' + m[3] : ''}` : l; }).join('\n');

for (const d of decisoes) {
  const arq = arquivos.find((f) => textos.get(f).split('\n').some((l) => (l.match(PEND) || [])[2] === d.chave));
  if (!arq) {
    // rodar de novo nao e erro: a decisao ja aplicada aparece no catalogo ou no texto
    const jaFeita = d.decisao === 'fica'
      ? Object.keys(catalogo).some((f) => f.replace(/\.[a-z]+$/, '') === `${d.tema}/${d.nome}`)
      : arquivos.some((f) => textos.get(f).includes(naoGuardada(d.descricao, d.motivo)));
    if (jaFeita) { feito.ja++; continue; }
    erros.push(`${d.chave}: nenhum texto da captura tem essa imagem pendente`); continue;
  }
  if (d.decisao === 'fica') {
    const tri = triagemDe(textos.get(arq));
    if (!/^"princípio: /.test(tri)) { erros.push(`${d.chave}: o post não virou princípio (triagem: ${tri}); só imagem de post com destino principio entra na skill`); continue; }
    if (!temas.includes(d.tema)) { erros.push(`${d.chave}: tema "${d.tema}" não é um dos de references/`); continue; }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(d.nome || '') || /\d{6,}/.test(d.nome)) { erros.push(`${d.chave}: nome "${d.nome}" fora do padrão (kebab-case, diz o que mostra, sem id)`); continue; }
    if (!d.shows) { erros.push(`${d.chave}: falta "shows" (o que a imagem mostra)`); continue; }
    // o arquivo de trabalho e <chave>.<qualquer extensao>; a extensao final sai da ASSINATURA
    // do arquivo (primeiros bytes), nunca do nome nem da URL
    const dirImg = path.join(pasta, 'imagens');
    const achado = fs.existsSync(dirImg) ? fs.readdirSync(dirImg).find((f) => f.startsWith(d.chave + '.')) : null;
    if (!achado) { erros.push(`${d.chave}: arquivo ${d.chave}.* não existe em ${dirImg} (baixa-imagens.mjs)`); continue; }
    const de = path.join(dirImg, achado);
    const ext = extensaoReal(fs.readFileSync(de));
    if (!ext) { erros.push(`${d.chave}: formato desconhecido (nem JPEG, PNG ou WebP pela assinatura)`); continue; }
    const rel = `${d.tema}/${d.nome}.${ext}`, para = path.join(ASSETS, rel);
    if (fs.existsSync(para) || catalogo[rel]) { erros.push(`${d.chave}: já existe ${rel} em assets/; escolha outro nome`); continue; }
    copias.push([de, para]);
    catalogo[rel] = d.why ? { shows: d.shows, why: d.why } : { shows: d.shows };
    mexe(arq, (t) => trocaPendente(t, d.chave, `\`assets/${rel}\``));
    feito.ficam++;
  } else if (d.decisao === 'sai') {
    if (!d.descricao || !d.motivo) { erros.push(`${d.chave}: imagem que sai precisa de "descricao" (5 palavras) e "motivo"`); continue; }
    mexe(arq, (t) => trocaPendente(t, d.chave, naoGuardada(d.descricao, d.motivo)));
    feito.saem++;
  } else erros.push(`${d.chave}: decisao "${d.decisao}" (use fica ou sai)`);
}

for (const id of fora) {
  const arq = arquivos.find((f) => path.basename(f) === id + '.md');
  if (!arq) { erros.push(`--fora ${id}: texto não existe em ${TEXTOS}`); continue; }
  mexe(arq, (t) => t.split('\n').map((l) => {
    const m = l.match(PEND); if (!m) return l;
    feito.fora++;
    return `${m[1]}. ${naoGuardada('não baixada (post fora do assunto)', 'fora do assunto da skill')}${m[3] ? ' — ' + m[3] : ''}`;
  }).join('\n'));
}

const restam = arquivos.filter((f) => textos.get(f).split('\n').some((l) => PEND.test(l))).map((f) => path.basename(f));
erros.forEach((e) => console.log('ERRO', e));
if (ESCREVE && !erros.length) {
  for (const [de, para] of copias) { fs.mkdirSync(path.dirname(para), { recursive: true }); fs.copyFileSync(de, para); }
  for (const [f, t] of textos) if (t !== fs.readFileSync(f, 'utf8')) fs.writeFileSync(f, t, 'utf8');
  if (feito.ficam) gravaCatalogo(K, catalogo);
}
console.log(feito, `${restam.length} texto(s) ainda com imagem pendente`, ESCREVE ? (erros.length ? '(nada gravado: corrija os erros)' : '(gravado)') : '(simulacao)');
restam.slice(0, 10).forEach((r) => console.log('  pendente:', r));
process.exit(erros.length ? 1 : 0);
