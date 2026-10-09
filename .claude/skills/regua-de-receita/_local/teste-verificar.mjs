// Prova que verificar.js ainda sabe REPROVAR.
//
// Verde que nao sabe ficar vermelho nao mede nada. Cada caso aqui estraga uma coisa numa
// COPIA da skill e exige que o verificador reprove PELA CONFERENCIA NOMEADA no caso (sair
// diferente de zero nao basta: um defeito que derruba tres conferencias esconderia a morte de
// uma). Depois, cada conferencia nomeada e neutralizada sozinha numa copia do verificador, e o
// caso dela tem que reprovar: prova de que o caso mede aquela conferencia e nao outra.
//
// Rodar: node _local/teste-verificar.mjs

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SKILL = path.resolve(AQUI, '..');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'regua-teste-'));
const COPIA = path.join(TMP, 'skill');

// --- monta a copia. assets/ vira, para cada imagem, so a ASSINATURA do formato dela (os
// --- primeiros bytes): o verificador confere existencia e assinatura, e copiar os megabytes por caso
// --- deixaria a suite inutilmente lenta. Nunca arquivo vazio: o verificador de producao nao tem
// --- caso especial para o teste (arquivo de 0 byte em assets/ reprova).
const ASSINATURA = {
  '.jpg': Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
  '.png': Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  '.webp': Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP')]),
};
function copiaDir(de, para, { assinatura = false } = {}) {
  fs.mkdirSync(para, { recursive: true });
  for (const e of fs.readdirSync(de, { withFileTypes: true })) {
    const o = path.join(de, e.name), d = path.join(para, e.name);
    if (e.isDirectory()) copiaDir(o, d, { assinatura });
    else if (assinatura && ASSINATURA[path.extname(e.name).toLowerCase()]) fs.writeFileSync(d, ASSINATURA[path.extname(e.name).toLowerCase()]);
    else fs.copyFileSync(o, d);
  }
}
fs.mkdirSync(COPIA, { recursive: true });
for (const item of ['references', '_local']) copiaDir(path.join(SKILL, item), path.join(COPIA, item));
copiaDir(path.join(SKILL, 'assets'), path.join(COPIA, 'assets'), { assinatura: true });
for (const f of ['SKILL.md', 'README.md', 'INDEX.md', 'atualizar.md', 'IMAGENS.md']) fs.copyFileSync(path.join(SKILL, f), path.join(COPIA, f));

const VERIF = path.join(COPIA, '_local', 'verificar.js');
const p = (...x) => path.join(COPIA, ...x);
const URL_POST = 'nenhuma URL de post do X ou do LinkedIn';
const le = (f) => fs.readFileSync(f, 'utf8');
const grava = (f, t) => fs.writeFileSync(f, t, 'utf8');

// roda o verificador da copia; devolve o codigo e as conferencias que FALHARAM (so o texto da
// conferencia, sem o detalhe depois de "  -> ")
function roda(env = process.env) {
  let codigo = 0, saida = '';
  try { saida = execFileSync(process.execPath, [VERIF], { stdio: 'pipe', encoding: 'utf8', env }); }
  catch (e) { codigo = e.status ?? 1; saida = String(e.stdout || '') + String(e.stderr || ''); }
  const falhas = saida.split('\n').filter((l) => l.startsWith('  FALHOU  ')).map((l) => l.slice(10).split('  -> ')[0]);
  return { codigo, falhas };
}

// --- a copia intacta TEM que passar. Se nao passar, a suite nao mede nada. ---
if (roda().codigo !== 0) {
  console.log('ABORTADO: a cópia intacta já reprova. A suíte não teria sentido.');
  try {
    execFileSync(process.execPath, [VERIF], { stdio: 'inherit' });
  } catch {}
  fs.rmSync(TMP, { recursive: true, force: true });
  process.exit(1);
}

// Cada caso NOMEIA a conferencia que tem de falhar (`alvo`: um trecho do texto dela, ou uma lista
// quando o defeito legitimamente derruba mais de uma, e todas tem de aparecer). Sair diferente de
// zero nao basta: um defeito que derruba tres conferencias esconderia a morte de uma delas. As outras
// que tambem falham saem na linha do caso ("também: ..."), para quem le saber o que o defeito toca.
const casos = [];
function caso(nome, alvo, estraga) { casos.push({ nome, alvos: [].concat(alvo), estraga }); }

// aplica o defeito, roda, desfaz; devolve o que o verificador disse
function aplica({ estraga }, env) {
  const backup = new Map();
  const salvar = (f) => { if (!backup.has(f)) backup.set(f, fs.existsSync(f) ? fs.readFileSync(f) : null); };
  const api = {
    edita(f, fn) { salvar(f); grava(f, fn(le(f))); },
    apaga(f) { salvar(f); fs.rmSync(f, { force: true }); },
    cria(f, t) { salvar(f); fs.mkdirSync(path.dirname(f), { recursive: true }); grava(f, t); },
    // troca o conteudo de um arquivo BINARIO (imagem): guarda e devolve os bytes, nao texto
    binario(f, buf) { salvar(f); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, buf); },
  };
  let r;
  try { estraga(api); r = roda(env); }
  finally {
    for (const [f, t] of backup) {
      if (t === null) fs.rmSync(f, { force: true });
      else fs.writeFileSync(f, t); // bytes, nao texto: o backup pode ser imagem
    }
  }
  return r;
}
const pegou = (c, r) => r.codigo !== 0 && c.alvos.every((a) => r.falhas.some((f) => f.includes(a)));

// --- o que os casos usam, lido do estado real (numero ou nome fixo aqui envelhece) ---
const TEMAS = fs.readdirSync(p('references')).filter((f) => f.endsWith('.md')).sort();
const blocosDe = (t) => t.split(/\n(?=## )/).filter((b) => b.startsWith('## '));
const META = JSON.parse(le(p('_local', 'imagens.json')));
const M0 = JSON.parse(le(p('_local', 'manifesto.json')));
const ORFA = M0.orfas_esperadas[0];                                    // uma imagem que nenhum principio cita
const CITADA = Object.keys(META).find((f) => !M0.orfas_esperadas.includes(f)); // uma que algum cita
const UM_TEMA = 'checkout-and-forms.md';
const OUTRO_TEMA = 'dashboards-and-data-viz.md';
const temaComQuick = TEMAS.find((f) => le(p('references', f)).includes('quick-index: gerado'));
const editaJson = (f, fn) => (t) => JSON.stringify(fn(JSON.parse(t)), null, 2) + '\n';

// --- estrutura ---
caso('princípio a mais (contagem estourada)', 'princípios (base ', (a) =>
  a.edita(p('references', UM_TEMA), (t) => t.replace(/\n*$/, '') +
    '\n\n## Um princípio inventado\n**Principle.** x\n**Apply when.** x\n**The move.** x\n'));

caso('arquivo de tema a mais', 'arquivos de tema', (a) =>
  a.cria(p('references', 'tema-intruso.md'), '# Intruso\n'));

// --- imagens ---
caso('link de imagem apontando para arquivo que não existe', 'nenhum link de imagem quebrado', (a) =>
  a.edita(p('references', UM_TEMA), (t) =>
    t.replace(/^(\*\*The move\.\*\*.*)$/m, '$1\n**Visual.** inventada — `../assets/checkout-and-forms/nao-existe.jpg`')));

caso('imagem órfã nova e não declarada', 'nenhuma imagem órfã inesperada', (a) =>
  a.binario(p('assets', 'pricing-and-monetization', 'intrusa.jpg'), ASSINATURA['.jpg']));   // JPEG valido: so a orfandade e a falta de metadado reprovam

caso('imagens.json apagado', 'imagens.json existe', (a) => a.apaga(p('_local', 'imagens.json')));

caso('imagem de assets/ sem entrada no imagens.json', 'toda imagem de assets/ está no imagens.json', (a) =>
  a.edita(p('_local', 'imagens.json'), editaJson(0, (m) => { delete m[CITADA]; return m; })));

caso('entrada do imagens.json para imagem que não existe', 'toda imagem do imagens.json existe em assets/', (a) =>
  a.edita(p('_local', 'imagens.json'), editaJson(0, (m) => ({ ...m, 'pricing-and-monetization/fantasma.jpg': { shows: 'x' } }))));

caso('imagem que sumiu do catálogo IMAGENS.md', 'toda imagem de assets/ está no catálogo IMAGENS.md', (a) =>
  a.edita(p('IMAGENS.md'), (t) => t.split('\n').filter((l) => !l.startsWith('| `' + CITADA + '`')).join('\n')));

caso('entrada do catálogo apontando para imagem que não existe', 'toda entrada do catálogo existe', (a) =>
  a.edita(p('IMAGENS.md'), (t) => t.replace(/^(## [a-z-]+ \(\d+\)\n\n\|[^\n]+\n\|[^\n]+\n)/m,
    '$1| `pricing-and-monetization/fantasma.jpg`<br>x | x | x |\n')));

caso('imagem com o id do post no nome (o nome de trabalho <id>__<n>)', 'imagem nomeada pelo que mostra', (a) =>
  a.binario(p('assets', 'conversion-and-landing-pages', '1900000000000000017__1.png'), ASSINATURA['.png']));   // extensao certa: so o nome esta errado

caso('imagem solta na raiz de assets/, fora da pasta do tema', 'imagem nomeada pelo que mostra', (a) =>
  a.binario(p('assets', 'solta.jpg'), ASSINATURA['.jpg']));

caso('imagem com extensão que não bate com o conteúdo (PNG gravado como .jpg)', 'a extensão de toda imagem bate com o conteúdo', (a) => {
  const jpg = Object.keys(META).find((f) => f.endsWith('.jpg'));
  a.binario(p('assets', jpg), ASSINATURA['.png']);
});

caso('imagem truncada (0 byte) em assets/ (sem caso especial para o teste no verificador)', 'a extensão de toda imagem bate com o conteúdo', (a) =>
  a.binario(p('assets', CITADA), Buffer.alloc(0)));

caso('imagem sem dizer o que mostra (shows vazio)', 'toda imagem diz o que mostra', (a) =>
  a.edita(p('_local', 'imagens.json'), editaJson(0, (m) => { m[CITADA] = { ...m[CITADA], shows: ' ' }; return m; })));

caso('imagem que nenhum princípio cita, sem o motivo (why:) para ficar', 'imagem que nenhum princípio cita tem o motivo escrito', (a) =>
  a.edita(p('_local', 'imagens.json'), editaJson(0, (m) => { m[ORFA] = { shows: m[ORFA].shows }; return m; })));

caso('catálogo IMAGENS.md apagado', 'IMAGENS.md existe', (a) => a.apaga(p('IMAGENS.md')));

// --- entradas locais (a skill pode ter zero: o caso planta a sua) ---
const plantaEntrada = (a, { arquivo, tema, titulo, noRef = false, comArquivo = true }) => {
  a.edita(p('_local', 'manifesto.json'), editaJson(0, (m) => ({ ...m, entradas: [...m.entradas, { arquivo, tema, modo: 'novo', titulo, assets: [] }] })));
  if (comArquivo) a.cria(p('_local', 'entradas', arquivo), `## ${titulo}\n**Principle.** x\n**Apply when.** x\n**The move.** x\n`);
  if (noRef) a.edita(p('references', tema + '.md'), (t) => t.replace(/\n*$/, '') + `\n\n## ${titulo}\n**Principle.** x\n**Apply when.** x\n**The move.** x\n`);
};

caso('entrada local que não está em references/', 'presente 1x em churn-and-retention', (a) =>
  plantaEntrada(a, { arquivo: '9001-churn-and-retention.md', tema: 'churn-and-retention', titulo: 'A planted entry missing from the theme' }));

caso('entrada do manifesto cujo arquivo sumiu de entradas/', 'do manifesto existe em entradas/', (a) =>
  plantaEntrada(a, { arquivo: '9002-churn-and-retention.md', tema: 'churn-and-retention', titulo: 'A planted entry without its file', noRef: true, comArquivo: false }));

caso('entrada guardada que o manifesto não lista', 'entradas guardadas', (a) =>
  a.cria(p('_local', 'entradas', '9003-churn-and-retention.md'), '## Solta\n**Principle.** x\n**Apply when.** x\n**The move.** x\n'));

caso('enriquecimento que deixou de aplicar', ': alvo "', (a) => {
  // o alvo e um bloco que NAO tem Evidence: o enriquecimento promete esse rotulo e ele nao esta la
  const t = le(p('references', OUTRO_TEMA));
  const alvo = blocosDe(t).find((b) => !b.includes('**Evidence.**')).split('\n')[0].slice(3).trim();
  a.edita(p('_local', 'manifesto.json'), editaJson(0, (m) => ({ ...m, entradas: [...m.entradas, { arquivo: '9004-dashboards-and-data-viz.md', tema: 'dashboards-and-data-viz', modo: 'enriquecer', alvo, campos: ['Evidence'], assets: [] }] })));
  a.cria(p('_local', 'entradas', '9004-dashboards-and-data-viz.md'), `<!-- alvo: ${alvo} | tema: dashboards-and-data-viz -->\n**Evidence.** x\n`);
});

// --- SKILL.md e README.md ---
caso('seção As imagens removida do SKILL.md', 'seção As imagens presente 1x', (a) =>
  a.edita(p('SKILL.md'), (t) => t.replace('As imagens: abra a tela', 'As imagens: outra coisa')));

caso('SKILL.md sem o link para o catálogo de imagens', 'SKILL.md linka o catálogo de imagens', (a) =>
  a.edita(p('SKILL.md'), (t) => t.split('](IMAGENS.md)').join('](outro.md)')));

caso('contagem do SKILL.md defasada', 'contagem de princípios batida', (a) =>
  // deriva o numero atual: numero fixo aqui envelhece no primeiro lote, o replace vira no-op e o
  // caso passa a "aprovar" o defeito que existe para pegar
  a.edita(p('SKILL.md'), (t) => t.replace(/\*\*\d+ princípios\*\*/, '**999 princípios**')));

caso('name: do SKILL.md diferente da pasta', 'name: regua-de-receita', (a) =>
  a.edita(p('SKILL.md'), (t) => t.replace(/^name: .*$/m, 'name: outro-nome')));

caso('descrição do SKILL.md acima de 450 caracteres', 'descrição do SKILL.md com até 450', (a) =>
  a.edita(p('SKILL.md'), (t) => t.replace(/^(description: '?)/m, '$1' + 'palavra '.repeat(60))));

caso('CRLF no SKILL.md', 'SKILL.md sem CRLF', (a) =>
  a.edita(p('SKILL.md'), (t) => t.replace(/\n/g, '\r\n')));

caso('CRLF no README.md', 'README.md sem CRLF', (a) =>
  a.edita(p('README.md'), (t) => t.replace(/\n/g, '\r\n')));

// --- kit ---
caso('peça do kit apagada (numeros.mjs)', 'existe numeros.mjs', (a) => a.apaga(p('_local', 'numeros.mjs')));
caso('motor do kit apagado (reaplicar.mjs)', 'existe reaplicar.mjs', (a) => a.apaga(p('_local', 'reaplicar.mjs')));
caso('gerador do índice apagado (indexar.mjs)', 'existe indexar.mjs', (a) => a.apaga(p('_local', 'indexar.mjs')));
caso('suíte que prova a reprovação apagada', 'existe teste-verificar.mjs', (a) => a.apaga(p('_local', 'teste-verificar.mjs')));
caso('regra única da fonte apagada (regra-de-fonte.cjs)', ['existe regra-de-fonte.cjs', 'toda fonte do cobertura.json é válida'], (a) => a.apaga(p('_local', 'regra-de-fonte.cjs')));
caso('definição única de endereço de post apagada (endereco-de-post.cjs)', ['existe endereco-de-post.cjs', URL_POST], (a) => a.apaga(p('_local', 'endereco-de-post.cjs')));
caso('roteiro atualizar.md apagado', 'existe atualizar.md', (a) => a.apaga(p('atualizar.md')));
caso('trecho de captura apagado (prepara.mjs)', 'existe captura/prepara.mjs', (a) => a.apaga(p('_local', 'captura', 'prepara.mjs')));
caso('gerenciador das fontes apagado (fontes.mjs)', 'existe captura/fontes.mjs', (a) => a.apaga(p('_local', 'captura', 'fontes.mjs')));

// --- duplicata e índice ---
caso('título de princípio duplicado', 'nenhum título de princípio se repete', (a) => {
  const titulo = (le(p('references', UM_TEMA)).match(/^## (.+)$/m) || [])[1];
  a.edita(p('references', OUTRO_TEMA), (t) => t.replace(/^## .+$/m, '## ' + titulo));
});

caso('INDEX.md apagado', 'existe INDEX.md', (a) => a.apaga(p('INDEX.md')));

caso('INDEX.md defasado: princípio novo que ele não lista', 'todo princípio aparece no índice', (a) =>
  a.edita(p('references', OUTRO_TEMA), (t) => t.replace(/\n*$/, '') +
    '\n\n## Um princípio que o índice não conhece\n**Principle.** x\n**Apply when.** x\n**The move.** x\n'));

caso('INDEX.md lista princípio que não existe mais', 'o índice não lista princípio que não existe', (a) =>
  a.edita(p('INDEX.md'), (t) => t + '\n- **Princípio fantasma que ninguém escreveu** — nunca\n'));

caso('Quick index defasado dentro do tema grande', 'Quick index de ', (a) => {
  // O Quick index usa `### ` de proposito, para ficar invisivel a contagem de principios.
  // Essa invisibilidade e o motivo de ele precisar de conferencia propria: sem ela, o
  // sumario do topo de um arquivo grande envelhece em silencio.
  if (!temaComQuick) return;
  a.edita(p('references', temaComQuick), (t) =>
    t.replace('<!-- /quick-index -->', '- Um titulo que ninguem escreveu\n<!-- /quick-index -->'));
});

// --- forma do principio ---
caso('rótulo obrigatório faltando no bloco', 'todo princípio tem os 3 rótulos obrigatórios', (a) =>
  a.edita(p('references', UM_TEMA), (t) => t.replace(/^\*\*Apply when\.\*\*.*\n/m, '')));

caso('rótulo fora da forma de volta (Source)', 'nenhum rótulo fora da forma', (a) =>
  a.edita(p('references', UM_TEMA), (t) => t.replace(/^(\*\*Apply when\.\*\*.*)$/m, '$1\n**Source.** sobrou de uma versão antiga')));

caso('rótulos fora da ordem canônica', 'rótulos na ordem canônica', (a) =>
  a.edita(p('references', UM_TEMA), (t) => {
    const l = t.split('\n');
    const i = l.findIndex((x) => x.startsWith('**Apply when.**'));
    const j = l.findIndex((x) => x.startsWith('**The move.**'));
    [l[i], l[j]] = [l[j], l[i]];
    return l.join('\n');
  }));

caso('título descolado do **Principle.**', 'título colado no **Principle.**', (a) =>
  a.edita(p('references', UM_TEMA), (t) => t.replace(/^(## .+)\n(\*\*Principle\.\*\*)/m, '$1\n\n$2')));

caso('frase solta depois do último rótulo', 'todo bloco fecha numa linha rotulada', (a) =>
  a.edita(p('references', UM_TEMA), (t) => {
    const partes = t.split(/\n(?=## )/);
    const i = partes.findIndex((b) => b.startsWith('## '));
    partes[i] = partes[i].replace(/\n*$/, '') + '\nUma frase que sobrou fora de qualquer rótulo.\n';
    return partes.join('\n');
  }));

caso('princípio monstruoso (acima de 550 palavras)', 'nenhum princípio acima de 550 palavras', (a) =>
  a.edita(p('references', UM_TEMA), (t) =>
    t.replace(/^\*\*Principle\.\*\*/m, '**Principle.** ' + 'palavra '.repeat(600))));

// --- o principio se sustenta sozinho: nenhum link de post, nenhum texto capturado ---
// Os links plantados abaixo sao MONTADOS em tempo de execucao. O verificador varre todo
// arquivo da skill, este inclusive: um link literal aqui reprovaria a copia intacta.
const LX = (h, id, dom = 'x.com') => 'https://' + dom + '/' + h + '/' + 'status' + '/' + id;
const LLI = (id) => 'https://' + 'www.linkedin.com/feed/update/' + 'urn:li:' + 'activity:' + id + '/';
const LLIP = (slug) => 'https://' + 'www.linkedin.com/' + 'posts' + '/' + slug;
const ID = '1900000000000000023', LI = '7400000000000000017';

caso('link de post do X num princípio', URL_POST, (a) =>
  a.edita(p('references', 'churn-and-retention.md'), (t) =>
    t.replace(/^\*\*Principle\.\*\* /m, `**Principle.** (${LX('fulano', ID)}) `)));

caso('link de post do LinkedIn num princípio', URL_POST, (a) =>
  a.edita(p('references', 'churn-and-retention.md'), (t) =>
    t.replace(/^\*\*Principle\.\*\* /m, `**Principle.** (${LLI('7000000000000000000')}) `)));

caso('URL /posts/ do LinkedIn num princípio', URL_POST, (a) =>
  a.edita(p('references', 'metrics-and-experimentation.md'), (t) =>
    t.replace(/^\*\*Principle\.\*\* /m, `**Principle.** (${LLIP('fulano_slug-activity-' + LI + '-AbCd')}) `)));

caso('link de post no metodo.md', URL_POST, (a) =>
  a.edita(p('_local', 'metodo.md'), (t) => t + `\n${LX('fulano', ID, 'twitter.com')}\n`));

caso('link de post no SKILL.md', URL_POST, (a) =>
  a.edita(p('SKILL.md'), (t) => t + `\nVer ${LX('fulano', ID)}\n`));

caso('link de post no README.md', URL_POST, (a) =>
  a.edita(p('README.md'), (t) => t + `\n${LX('fulano', ID)}\n`));

caso('link de post no imagens.json', URL_POST, (a) =>
  a.edita(p('_local', 'imagens.json'), editaJson(0, (m) => { m[CITADA] = { ...m[CITADA], shows: m[CITADA].shows + ' ' + LX('fulano', ID) }; return m; })));

caso('URL de post no código (um trecho de captura)', URL_POST, (a) =>
  a.edita(p('_local', 'captura', 'consolida.mjs'), (t) => t + `\n// ex.: ${LX('fulano', ID, 'twitter.com')}\n`));

const st = 'status' + '/';
const FORMAS = {
  'x.com/i/web/status': 'https://' + 'x.com/i/web/' + st + ID,
  'x.com/i/status (sem https)': 'x.com/i/' + st + ID,
  'mobile.twitter.com/statuses': 'https://' + 'mobile.twitter.com/fulano/' + 'statuses/' + ID,
  'espelho fixupx.com': 'https://' + 'fixupx.com/fulano/' + st + ID,
  'urn:li:share': 'urn:li:' + 'share:' + LI,
  'urn:li:ugcPost': 'urn:li:' + 'ugcPost:' + LI,
};
for (const [forma, url] of Object.entries(FORMAS)) {
  caso(`endereço de post na forma ${forma}, no atualizar.md`, URL_POST, (a) =>
    a.edita(p('atualizar.md'), (t) => t + `\nVer ${url} para o exemplo.\n`));
}

caso('princípio apontando o texto capturado', 'nenhum princípio aponta texto capturado', (a) =>
  a.edita(p('references', UM_TEMA), (t) =>
    t.replace(/^(\*\*The move\.\*\*.*)$/m, '$1 Full text in `../_local/fontes/posts-x/1900000000000000017.md`.')));

caso('princípio apontando a pasta da captura', 'nenhum princípio aponta texto capturado', (a) =>
  a.edita(p('references', UM_TEMA), (t) =>
    t.replace(/^(\*\*The move\.\*\*.*)$/m, '$1 See `rascunho/captura-x-fulano-20261009-1415/textos/1900000000000000017.md`.')));

// --- as fontes que a skill acompanha ---
caso('cobertura.json apagado', 'cobertura.json existe', (a) => a.apaga(p('_local', 'cobertura.json')));

caso('cobertura.json quebrado', 'cobertura.json é JSON válido', (a) =>
  a.edita(p('_local', 'cobertura.json'), (t) => t.replace('{', '{ isto não é json')));

caso('fuso fora do formato', 'cobertura.fuso no formato', (a) =>
  a.edita(p('_local', 'cobertura.json'), editaJson(0, (c) => ({ ...c, fuso: 'BRT' }))));

const comFontes = (fontes) => (a) => a.edita(p('_local', 'cobertura.json'), editaJson(0, (c) => ({ ...c, fontes })));
const X_OK = { nome: 'x-fulano', tipo: 'x', handle: 'fulano', triado_ate: '2026-01-01T00:00:00Z' };
caso('fonte do X com handle inválido', 'toda fonte do cobertura.json é válida', comFontes([{ ...X_OK, handle: '@ful ano' }]));
caso('fonte do X com triado_ate fora do formato', 'toda fonte do cobertura.json é válida', comFontes([{ ...X_OK, triado_ate: '2026-01-01' }]));
caso('duas fontes com o mesmo nome', 'toda fonte do cobertura.json é válida', comFontes([X_OK, { ...X_OK }]));
caso('fonte de tipo desconhecido', 'toda fonte do cobertura.json é válida', comFontes([{ nome: 'rss-blog', tipo: 'rss', endereco: 'https://' + 'exemplo.com/feed', lido_ate: null }]));
caso('fonte do LinkedIn apontando um post, não o perfil', 'toda fonte do cobertura.json é válida',
  comFontes([{ nome: 'linkedin-fulano', tipo: 'linkedin', perfil: LLIP('fulano_slug-activity-' + LI + '-AbCd'), lido_ate: null }]));
caso('fonte web apontando um post do X', 'toda fonte do cobertura.json é válida',
  comFontes([{ nome: 'web-x', tipo: 'web', endereco: LX('fulano', ID), lido_ate: null }]));
caso('fonte web com lido_ate que não é data', 'toda fonte do cobertura.json é válida',
  comFontes([{ nome: 'web-exemplo-com', tipo: 'web', endereco: 'https://' + 'exemplo.com/blog', lido_ate: '2026-13-40' }]));

// ---------------------------------------------------------------------------------------------
console.log('\n=== a régua sabe reprovar? (cada defeito pela conferência nomeada) ===');
let passou = 0, falhou = 0;
for (const c of casos) {
  const r = aplica(c);
  const outras = r.falhas.filter((f) => !c.alvos.some((a) => f.includes(a)));
  const tambem = outras.length ? `  (também: ${outras.map((f) => process.env.DESCOBRE ? f : f.slice(0, 60)).join(' | ')})` : '';
  if (pegou(c, r)) { passou++; console.log(`  ok      reprova: ${c.nome}  [${c.alvos.join(' + ')}]${tambem}`); }
  else {
    falhou++;
    const faltou = c.alvos.filter((a) => !r.falhas.some((f) => f.includes(a)));
    console.log(`  FALHOU  ${r.codigo === 0 ? 'PASSOU quando devia reprovar' : 'reprovou, mas não pela conferência nomeada'}: ${c.nome}  -> faltou: ${faltou.join(' + ')}${tambem}`);
  }
}

// --- prova de que cada conferencia nomeada e mesmo a que o caso pega: neutraliza UMA por vez numa
// --- copia do verificador (o `ok` dela passa a aprovar so aquela conferencia) e exige que os casos
// --- dela reprovem. Se o caso continuasse verde com a conferencia morta, ele nao a estaria medindo.
// --- O verificador de producao nao tem gancho nenhum: a neutralizacao e uma mutacao so da copia.
console.log('\n=== cada conferência nomeada, neutralizada sozinha, faz o caso dela reprovar ===');
const original = fs.readFileSync(VERIF, 'utf8');
const GANCHO = "const ok = (cond, msg, extra = '') => {";
let neutralizadas = 0, mortasSemAviso = 0;
if (!original.includes(GANCHO)) { mortasSemAviso++; console.log('  FALHOU  o verificar.js não tem mais a forma `const ok = (cond, msg, extra = \'\') => {` que a neutralização muta'); }
else {
  fs.writeFileSync(VERIF, original.replace(GANCHO, GANCHO + "\n  if (process.env.REGUA_NEUTRO && String(msg).includes(process.env.REGUA_NEUTRO)) cond = true;"));
  try {
    for (const alvo of [...new Set(casos.flatMap((c) => c.alvos))]) {
      const env = { ...process.env, REGUA_NEUTRO: alvo };
      const deste = casos.filter((c) => c.alvos.includes(alvo));
      const aindaPega = deste.filter((c) => pegou(c, aplica(c, env)));
      neutralizadas++;
      if (aindaPega.length) { mortasSemAviso++; console.log(`  FALHOU  "${alvo}" neutralizada e o caso continua verde: ${aindaPega.map((c) => c.nome).join(' | ')}`); }
      else console.log(`  ok      "${alvo}" neutralizada: ${deste.length} caso(s) reprovam`);
    }
  } finally { fs.writeFileSync(VERIF, original); }
}

console.log('\n' + '='.repeat(60));
const tudo = falhou === 0 && mortasSemAviso === 0;
console.log(tudo
  ? `TUDO CERTO — ${passou} defeitos plantados, ${passou} reprovados pela conferência nomeada; ${neutralizadas} conferências neutralizadas uma a uma, todas pegas`
  : `REPROVADO — ${falhou} defeito(s) sem a conferência nomeada de ${passou + falhou}; ${mortasSemAviso} conferência(s) neutralizada(s) sem o caso perceber`);
fs.rmSync(TMP, { recursive: true, force: true });
process.exit(tudo ? 0 : 1);
