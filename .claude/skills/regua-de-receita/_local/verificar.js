// Cinto de seguranca da skill regua-de-receita: confere o estado de tudo o que a skill guarda
// (principios, imagens, indices, entradas locais e as fontes que ela acompanha).
//
// Regra que rege este arquivo: verde que nao sabe ficar vermelho nao mede nada.
// Antes de acrescentar conferencia, pergunte "se o defeito existisse, esta assercao
// falharia?". Numero fixo no codigo envelhece e vira verde mentiroso: contagens saem do
// manifesto, nunca daqui.
//
// A fonte de verdade dos numeros e _local/manifesto.json, gerado por
// gera-manifesto.mjs a partir do estado real.
//
// Rodar: node _local/verificar.js [--raiz <copia>]

const fs = require('fs');
const path = require('path');

// --raiz <copia>: confere OUTRA copia da skill (ensaio dos passos 5 a 7 sem tocar a de verdade).
// Sem a flag, confere a skill onde este arquivo mora.
const iRaiz = process.argv.indexOf('--raiz');
const S = iRaiz > -1 ? path.resolve(process.argv[iRaiz + 1] || '.') : path.resolve(__dirname, '..');  // .../regua-de-receita
const K = path.join(S, '_local');                                                                  // .../_local
if (!fs.existsSync(path.join(K, 'manifesto.json'))) { console.log(`--raiz ${S}: não é uma cópia da skill (falta _local/manifesto.json)`); process.exit(2); }
console.log(`conferindo ${S}`);

const M = JSON.parse(fs.readFileSync(path.join(K, 'manifesto.json'), 'utf8'));

let falhas = 0, avisos = 0, testes = 0;
const ok = (cond, msg, extra = '') => {
  testes++;
  if (!cond) { falhas++; console.log('  FALHOU  ' + msg + (extra ? '  -> ' + extra : '')); }
  else console.log('  ok      ' + msg + (extra ? '  (' + extra + ')' : ''));
};
const aviso = (cond, msg, extra = '') => {
  testes++;
  if (!cond) { avisos++; console.log('  AVISO   ' + msg + (extra ? '  -> ' + extra : '')); }
  else console.log('  ok      ' + msg + (extra ? '  (' + extra + ')' : ''));
};

const lerRefs = () => fs.readdirSync(path.join(S, 'references')).filter(f => f.endsWith('.md'))
  .map(f => ({ nome: f, tema: f.replace('.md', ''), txt: fs.readFileSync(path.join(S, 'references', f), 'utf8') }));
const blocos = txt => txt.split(/\n(?=## )/).filter(b => b.startsWith('## '));
const tituloDe = b => b.split('\n')[0].slice(3).trim();

// Link de post, em qualquer forma em que ele pode aparecer: permalink do X
// (x.com ou twitter.com, inclusive /i/web/status/), atividade do LinkedIn (o urn sozinho
// tambem) e as URLs /posts/ e /feed/update/ dele. Link de PERFIL e de imagem nao casam.
// A definicao e UMA so, em endereco-de-post.cjs (a mesma que o escreve-textos usa para limpar).
// O que e uma fonte valida tambem tem definicao unica: regra-de-fonte.cjs (a mesma do fontes.mjs).
// As duas se carregam sem quebrar: modulo apagado REPROVA pela conferencia que precisa dele (e pela
// do kit), em vez de derrubar o verificador inteiro sem imprimir FALHOU nenhum.
const requerOuNada = (m) => { try { return require(m); } catch { return null; } };
const enderecoDePost = requerOuNada('./endereco-de-post.cjs');
const regraDeFonte = requerOuNada('./regra-de-fonte.cjs');
// TODO arquivo de texto da skill, sem recorte: principio, documento, codigo e testes. So o binario
// fica de fora.
const BINARIO = /\.(?:jpe?g|png|gif|webp|mp4|mov|pdf|ico|zip)$/i;
const todosOsArquivos = (dir = S, acc = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== '.git' && e.name !== 'node_modules') todosOsArquivos(p, acc); }
    else if (!BINARIO.test(e.name)) acc.push(p);
  }
  return acc;
};

// Os rotulos de um principio, na ordem canonica (a mesma do metodo.md e do reaplicar.mjs).
const LABELS = ['**Principle.**', '**Apply when.**', '**The move.**', '**Evidence.**', '**Visual.**', '**In one line.**'];
const OBRIG = ['**Principle.**', '**Apply when.**', '**The move.**'];
const ROTULO = /^\*\*[A-Z][A-Za-z ]*\.\*\*/;

console.log('\n=== 1. ESTRUTURA DA SKILL ===');
const refs = lerRefs();
const heads = refs.reduce((s, r) => s + (r.txt.match(/^## /gm) || []).length, 0);
const esperado = M.base.principios + M.entradas.filter(e => e.modo === 'novo').length;
ok(refs.length === M.base.arquivos, `${M.base.arquivos} arquivos de tema`, refs.length);
ok(heads === esperado, `${esperado} princípios (base ${M.base.principios} + ${esperado - M.base.principios} de entradas locais)`, heads);

console.log('\n=== 2. IMAGENS (o nome diz o que mostra, a pasta é o tema, o catálogo diz o que mostram) ===');
// Imagem se chama pelo que mostra e mora em assets/<tema>/. O que ela mostra (e, se nenhum
// principio a cita, por que fica) mora em _local/imagens.json, e o IMAGENS.md e gerado dali
// (catalogo.mjs). So fica imagem que serve a skill: citada por um principio, ou com o motivo escrito.
const listaRec = (dir) => {
  const r = [];
  const anda = (d, pre) => { if (!fs.existsSync(d)) return; for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.isDirectory()) anda(path.join(d, e.name), pre + e.name + '/'); else r.push(pre + e.name); } };
  anda(dir, '');
  return r;
};
const temImg = new Set(listaRec(path.join(S, 'assets')));
const citImg = new Set();
refs.forEach(r => [...r.txt.matchAll(/\.\.\/assets\/([^\s`)]+\.(?:jpg|png|webp))/g)].forEach(m => citImg.add(m[1])));
const quebradas = [...citImg].filter(i => !temImg.has(i));
ok(quebradas.length === 0, 'nenhum link de imagem quebrado', quebradas.join(', ') || citImg.size + ' citadas de ' + temImg.size);

const orfas = [...temImg].filter(i => !citImg.has(i)).sort();
const inesperadas = orfas.filter(i => !M.orfas_esperadas.includes(i));
ok(inesperadas.length === 0, 'nenhuma imagem órfã inesperada', inesperadas.join(', ') || orfas.length + ' órfãs declaradas');

let meta = {};
const metaPath = path.join(K, 'imagens.json');
ok(fs.existsSync(metaPath), 'imagens.json existe (o que cada imagem mostra)');
if (fs.existsSync(metaPath)) {
  try { meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')); }
  catch (e) { ok(false, 'imagens.json é JSON válido', e.message); }
}
const catalogo = fs.existsSync(path.join(S, 'IMAGENS.md')) ? fs.readFileSync(path.join(S, 'IMAGENS.md'), 'utf8') : '';
const noCatalogo = new Set([...catalogo.matchAll(/^\| `([^`]+)`/gm)].map(m => m[1]));
const temas = refs.map(r => r.tema);

ok(fs.existsSync(path.join(S, 'IMAGENS.md')), 'IMAGENS.md existe (o catálogo das imagens)');
const semMeta = [...temImg].filter(f => !meta[f]);
ok(semMeta.length === 0, 'toda imagem de assets/ está no imagens.json', semMeta.slice(0, 3).join(', ') || temImg.size + ' arquivos');
const metaSemArquivo = Object.keys(meta).filter(f => !temImg.has(f));
ok(metaSemArquivo.length === 0, 'toda imagem do imagens.json existe em assets/', metaSemArquivo.slice(0, 3).join(', ') || Object.keys(meta).length + ' declaradas');
const foraDoCatalogo = [...temImg].filter(f => !noCatalogo.has(f));
ok(foraDoCatalogo.length === 0, 'toda imagem de assets/ está no catálogo IMAGENS.md', foraDoCatalogo.slice(0, 3).join(', ') || temImg.size + ' arquivos');
const catalogoSemArquivo = [...noCatalogo].filter(f => !temImg.has(f));
ok(catalogoSemArquivo.length === 0, 'toda entrada do catálogo existe', catalogoSemArquivo.slice(0, 3).join(', ') || noCatalogo.size + ' entradas');
const nomeRuim = [...temImg].filter(f => {
  const [tema, base, ...resto] = f.split('/');
  return resto.length || !base || !temas.includes(tema) || !/^[a-z0-9]+(?:-[a-z0-9]+)*\.(?:jpg|png|webp)$/.test(base) || /\d{6,}/.test(f) || /__/.test(f);
});
ok(nomeRuim.length === 0, 'imagem nomeada pelo que mostra, em <tema>/, sem id de post no nome', nomeRuim.slice(0, 3).join(', '));
// a extensao bate com o conteudo, lido pela assinatura (os primeiros bytes), nunca pelo nome:
// o X serve PNG com format=jpg na URL, entao a extensao da URL nao diz o formato
const assinatura = (buf) => {
  const b = buf.subarray(0, 12);
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP') return 'webp';
  return null;
};
const extErrada = [];
for (const f of temImg) {
  const real = assinatura(fs.readFileSync(path.join(S, 'assets', f)));
  if (real !== path.extname(f).slice(1)) extErrada.push('assets/' + f + ' é ' + (real || 'formato desconhecido'));
}
ok(extErrada.length === 0, 'a extensão de toda imagem bate com o conteúdo (assinatura do arquivo)', extErrada.slice(0, 3).join(', ') || temImg.size + ' arquivos');
const semShows = Object.entries(meta).filter(([, d]) => !d || typeof d.shows !== 'string' || !d.shows.trim()).map(([f]) => f);
ok(semShows.length === 0, 'toda imagem diz o que mostra (shows:)', semShows.slice(0, 3).join(', '));
const semMotivo = [...temImg].filter(f => !citImg.has(f) && !(meta[f] && meta[f].why));
ok(semMotivo.length === 0, 'imagem que nenhum princípio cita tem o motivo escrito (why:) ou não fica', semMotivo.slice(0, 3).join(', '));

console.log('\n=== 3. ENTRADAS LOCAIS ESTÃO NA SKILL ===');
// Confere pelo TITULO, que e a identidade real de um principio.
const novas = M.entradas.filter(x => x.modo === 'novo');
if (!novas.length) console.log('  (nenhuma entrada local de princípio novo)');
for (const e of novas) {
  const r = refs.find(x => x.nome === e.tema + '.md');
  if (!r) { ok(false, `${e.arquivo}: tema ${e.tema} não existe`); continue; }
  // entrada apagada REPROVA (com nome), em vez de quebrar o verificador com ENOENT: verificador
  // que quebra nao imprime FALHOU, e o teste-verificar so aceita a conferencia nomeada
  const arqEntrada = path.join(K, 'entradas', e.arquivo);
  if (!fs.existsSync(arqEntrada)) { ok(false, `entrada ${e.arquivo} do manifesto existe em entradas/`); continue; }
  const titulo = (fs.readFileSync(arqEntrada, 'utf8').match(/^## (.+)$/m) || [, ''])[1].trim();
  const n = (r.txt.match(/^## (.+)$/gm) || []).filter(l => l.slice(3).trim() === titulo).length;
  const curto = titulo.length > 46 ? titulo.slice(0, 43) + '…' : titulo;
  ok(n === 1, `"${curto}" presente 1x em ${e.tema}`, n + 'x');
}

console.log('\n=== 4. SKILL.md e README.md ===');
const skillMd = fs.readFileSync(path.join(S, 'SKILL.md'), 'utf8');
const readMe = fs.readFileSync(path.join(S, 'README.md'), 'utf8');
ok((skillMd.match(/As imagens: abra a tela/g) || []).length === 1, 'seção As imagens presente 1x');
ok(skillMd.includes('](IMAGENS.md)'), 'SKILL.md linka o catálogo de imagens IMAGENS.md');
ok(skillMd.includes(`**${heads} princípios**`), `contagem de princípios batida (${heads})`,
  skillMd.includes(`**${heads} princípios**`) ? '' : 'rodar _local/numeros.mjs --escreve');
ok(/^name: regua-de-receita$/m.test(skillMd.split('\n---')[0]), 'SKILL.md com name: regua-de-receita (o nome da pasta)');
const descricao = (skillMd.split('\n---')[0].match(/^description: (.+)$/m) || [, ''])[1].replace(/^'|'$/g, '');
ok(descricao.length > 0 && descricao.length <= 450, 'descrição do SKILL.md com até 450 caracteres', descricao.length + ' caracteres');
ok(!skillMd.includes('\r'), 'SKILL.md sem CRLF');
ok(!readMe.includes('\r'), 'README.md sem CRLF');

console.log('\n=== 5. KIT ===');
['README.md', 'manifesto.json', 'cobertura.json', 'imagens.json',
  'gera-manifesto.mjs', 'reaplicar.mjs', 'indexar.mjs', 'catalogo.mjs', 'sincronizar.sh', 'numeros.mjs', 'metodo.md',
  'endereco-de-post.cjs', 'regra-de-fonte.cjs',
  'teste-verificar.mjs', 'teste-reaplicar.mjs', 'teste-captura.mjs']
  .forEach(f => ok(fs.existsSync(path.join(K, f)), 'existe ' + f));
const dirEntradas = path.join(K, 'entradas');
const nEntradas = fs.existsSync(dirEntradas) ? fs.readdirSync(dirEntradas).filter(f => f.endsWith('.md')).length : 0;
ok(nEntradas === M.entradas.length, `${M.entradas.length} entradas guardadas`, nEntradas);
['atualizar.md', 'INDEX.md'].forEach(f => ok(fs.existsSync(path.join(S, f)), 'existe ' + f));
['fontes.mjs', 'pasta.mjs', 'janela.mjs', 'prepara.mjs', 'consolida.mjs', 'escreve-textos.mjs', 'marca-triagem.mjs',
  'baixa-imagens.mjs', 'guarda-imagens.mjs', 'imagens.mjs', 'modelos/busca.js', 'modelos/respostas.js', 'modelos/permalink-lote.js']
  .forEach(f => ok(fs.existsSync(path.join(K, 'captura', f)), 'existe captura/' + f));

console.log('\n=== 6. ENRIQUECIMENTOS ===');
// Entrada de enriquecimento e invisivel na contagem de principios, entao precisa da sua
// propria conferencia: o alvo tem que existir, e os rotulos que ela promete tem que estar
// no bloco. Sem isso, um enriquecimento que deixou de aplicar passa despercebido.
const enriq = M.entradas.filter(x => x.modo === 'enriquecer');
if (!enriq.length) console.log('  (nenhuma entrada local de enriquecimento)');
for (const e of enriq) {
  const r = refs.find(x => x.nome === e.tema + '.md');
  const bloco = r && blocos(r.txt).find(b => tituloDe(b) === e.alvo);
  const campos = (e.campos || []).map(c => `**${c}.**`);
  const faltando = bloco ? campos.filter(c => !bloco.includes(c)) : campos;
  ok(!!bloco && faltando.length === 0, `enriquecimento ${e.arquivo}: alvo "${e.alvo}" em ${e.tema}`,
    !bloco ? 'alvo nao encontrado' : 'sem ' + faltando.join(', '));
}

console.log('\n=== 7. DUPLICATA ===');
const titulos = [];
refs.forEach(r => (r.txt.match(/^## (.+)$/gm) || []).forEach(t => titulos.push(t.slice(3).trim().toLowerCase())));
const repetidos = titulos.filter((t, i) => titulos.indexOf(t) !== i);
ok(repetidos.length === 0, 'nenhum título de princípio se repete', [...new Set(repetidos)].slice(0, 3).join(' | '));

console.log('\n=== 8. ÍNDICE DE ROTEAMENTO ===');
const idxPath = path.join(S, 'INDEX.md');
if (!fs.existsSync(idxPath)) {
  ok(false, 'INDEX.md existe', 'rodar node _local/indexar.mjs --escreve');
} else {
  const idx = fs.readFileSync(idxPath, 'utf8');
  // Titulo que entra em references/ e nao aparece no indice fica invisivel para quem le
  // pelo indice -- que e o caminho que o SKILL.md manda usar.
  const noIdx = new Set([...idx.matchAll(/^- \*\*(.+?)\*\*/gm)].map(m => m[1].trim()));
  const noRef = [];
  refs.forEach(r => (r.txt.match(/^## (.+)$/gm) || []).forEach(t => noRef.push(t.slice(3).trim())));
  const faltando = noRef.filter(t => !noIdx.has(t));
  const sobrando = [...noIdx].filter(t => !noRef.includes(t));
  ok(faltando.length === 0, 'todo princípio aparece no índice', faltando.slice(0, 2).join(' | ') || noRef.length + ' conferidos');
  ok(sobrando.length === 0, 'o índice não lista princípio que não existe', sobrando.slice(0, 2).join(' | '));
  ok(!idx.includes('\r'), 'INDEX.md sem CRLF');
}

// O Quick index dentro de um tema grande usa `### ` de proposito, para ficar invisivel a
// contagem de principios e ao split do reaplicar. O preco dessa invisibilidade
// e que ele tambem fica invisivel a toda conferencia -- entao precisa da sua propria, ou
// defasa em silencio.
for (const r of refs) {
  if (!r.txt.includes('quick-index: gerado')) continue;
  const bloco = (r.txt.match(/<!-- quick-index[\s\S]*?<!-- \/quick-index -->/) || [''])[0];
  const listados = [...bloco.matchAll(/^- (.+)$/gm)].map(m => m[1].trim());
  const reais = (r.txt.match(/^## (.+)$/gm) || []).map(l => l.slice(3).trim());
  const sobra = listados.filter(t => !reais.includes(t));
  const falta = reais.filter(t => !listados.includes(t));
  ok(sobra.length === 0 && falta.length === 0, `Quick index de ${r.tema} em dia`,
    sobra.length ? 'lista o inexistente: ' + sobra[0].slice(0, 40)
      : falta.length ? 'não lista: ' + falta[0].slice(0, 40) : `${listados.length} títulos`);
}

console.log('\n=== 9. FORMA DO PRINCÍPIO ===');
let semObrig = 0, foraDeOrdem = 0, tituloSolto = 0, fimSolto = 0, rotuloEstranho = 0, gordos = 0, enormes = 0;
const exemplos = { semObrig: [], fimSolto: [], rotuloEstranho: [] };
for (const r of refs) {
  for (const b of blocos(r.txt)) {
    const linhas = b.split('\n').filter(l => l.trim());
    const rotulados = linhas.filter(l => ROTULO.test(l));
    const rot = rotulados.map(l => LABELS.find(x => l.startsWith(x)));
    // rotulo fora da lista (um **Source.** ou **Voice.** de volta, um rotulo inventado) nao e forma da skill
    if (rot.some(x => !x)) { rotuloEstranho++; exemplos.rotuloEstranho.push(tituloDe(b)); }
    const conhecidos = rot.filter(Boolean);
    if (!OBRIG.every(o => conhecidos.includes(o))) { semObrig++; exemplos.semObrig.push(tituloDe(b)); }
    const pos = conhecidos.map(x => LABELS.indexOf(x));
    if (pos.some((v, i) => i > 0 && v <= pos[i - 1])) foraDeOrdem++;

    // Nao se proibe linha em branco nem lista DENTRO do bloco: o metodo.md autoriza framework em
    // bullets. O que importa de verdade sao os dois limites do bloco:
    const cru = b.split('\n');
    if (!(cru[1] || '').startsWith('**Principle.**')) tituloSolto++;                       // titulo colado no Principle
    if (!ROTULO.test(linhas[linhas.length - 1] || '')) { fimSolto++; exemplos.fimSolto.push(tituloDe(b)); } // fecha numa linha rotulada

    const palavras = b.split(/\s+/).length;
    // A regua de tamanho e a do metodo.md: 110-250 palavras (aviso acima), teto 550 (erro).
    if (palavras > 550) enormes++;
    else if (palavras > 250) gordos++;
  }
}
ok(semObrig === 0, 'todo princípio tem os 3 rótulos obrigatórios', semObrig + ' incompletos ' + exemplos.semObrig.slice(0, 2).join(' | '));
ok(rotuloEstranho === 0, 'nenhum rótulo fora da forma (Principle, Apply when, The move, Evidence, Visual, In one line)', rotuloEstranho + ' ' + exemplos.rotuloEstranho.slice(0, 2).join(' | '));
ok(foraDeOrdem === 0, 'rótulos na ordem canônica, sem repetir', foraDeOrdem + ' fora de ordem');
ok(tituloSolto === 0, 'título colado no **Principle.**', tituloSolto + ' soltos');
ok(fimSolto === 0, 'todo bloco fecha numa linha rotulada', fimSolto + ' ' + exemplos.fimSolto.slice(0, 2).join(' | '));
ok(enormes === 0, 'nenhum princípio acima de 550 palavras', enormes + ' enormes');
aviso(gordos === 0, 'princípios acima de 250 palavras (aviso, não erro)', gordos + ' gordos');

console.log('\n=== 10. O PRINCÍPIO SE SUSTENTA SOZINHO: NENHUM LINK DE POST, NENHUM TEXTO CAPTURADO ===');
// A skill nao cita post por URL nem guarda o texto capturado: o que importa da fonte entra no
// principio, a imagem mora em assets/, e o texto da captura fica na pasta da captura, fora da
// skill. NENHUM link de post passa, e nao existe lista de excecao. Cada conferencia abaixo tem
// defeito plantado no teste-verificar.mjs.
{
  // (a) link de post em NENHUM arquivo da skill: principio, documento, codigo, teste. O
  // teste-verificar.mjs monta os links que planta em tempo de execucao justamente para nao carregar
  // nenhum no proprio texto.
  const arquivos = todosOsArquivos();
  const comLink = [];
  if (enderecoDePost) for (const f of arquivos) for (const m of fs.readFileSync(f, 'utf8').matchAll(enderecoDePost.linkPost()))
    comLink.push(path.relative(S, f).replace(/\\/g, '/') + ': ' + m[0]);
  ok(!!enderecoDePost && comLink.length === 0, `nenhuma URL de post do X ou do LinkedIn em arquivo nenhum da skill (${arquivos.length} arquivos de texto)`,
    enderecoDePost ? comLink.slice(0, 3).join(', ') : 'endereco-de-post.cjs ausente: sem a definição, nada se confere');

  // (b) nenhum principio aponta texto capturado: a captura mora em rascunho/, e um caminho para ela
  // dentro de um principio seria uma fonte que some quando a pasta da captura for apagada
  const PARA_CAPTURA = /(?:_local\/fontes\/|rascunho\/captura-|\/textos\/\d{6,}\.md)/;
  const apontam = [];
  for (const r of refs) for (const b of blocos(r.txt)) if (PARA_CAPTURA.test(b)) apontam.push(r.tema + ': ' + tituloDe(b).slice(0, 40));
  ok(apontam.length === 0, 'nenhum princípio aponta texto capturado (o princípio se sustenta sozinho)', apontam.slice(0, 3).join(' | '));
}

console.log('\n=== 11. AS FONTES QUE A SKILL ACOMPANHA (cobertura.json) ===');
// O cobertura.json e o que o roteiro de atualizacao le primeiro: o fuso das datas de calendario e
// a lista das fontes escolhidas, cada uma com ate onde ja foi lida. A regra do que e uma fonte
// valida mora em regra-de-fonte.cjs (a mesma que o fontes.mjs usa para gravar).
{
  const cp = path.join(K, 'cobertura.json');
  let c = null;
  if (!fs.existsSync(cp)) ok(false, 'cobertura.json existe');
  else {
    try { c = JSON.parse(fs.readFileSync(cp, 'utf8')); } catch (e) { ok(false, 'cobertura.json é JSON válido', e.message); }
  }
  if (c) {
    ok(/^[+-]\d{2}:\d{2}$/.test(String(c.fuso)), 'cobertura.fuso no formato ±HH:MM', String(c.fuso));
    const erros = regraDeFonte ? regraDeFonte.errosDasFontes(c.fontes) : ['regra-de-fonte.cjs ausente: sem a regra, nada se confere'];
    ok(erros.length === 0, 'toda fonte do cobertura.json é válida (tipo, endereço, marca de leitura, nome único)',
      erros.slice(0, 2).join(' | ') || (c.fontes || []).length + ' fonte(s)');
  }
}

console.log('\n' + '='.repeat(60));
const resumo = `${testes} verificações, ${falhas} falha(s)` + (avisos ? `, ${avisos} aviso(s)` : '');
console.log(falhas === 0 ? `TUDO CERTO — ${resumo}` : `REPROVADO — ${resumo}`);
process.exit(falhas === 0 ? 0 : 1);
