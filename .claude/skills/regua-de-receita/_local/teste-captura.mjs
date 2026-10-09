// Prova o comportamento dos scripts de captura que o verificar.js nao enxerga (ele olha o estado da
// skill, nao o que um script faria numa captura nova). Cada secao numerada prova uma regra:
//   1. as fontes: quem usa escolhe (fontes.mjs), uma regra so (regra-de-fonte.cjs), a marca nao volta
//   2. a fronteira da janela tem uma regra so (segundos inteiros UTC, como numero)
//   3. "nada novo na janela": roteiro e script dizem o mesmo sobre o triado_ate
//   4. so o guarda-imagens.mjs escreve imagem dentro da skill, e so de post que virou principio
//   5. o passo do artigo nao depende de colar codigo, o despejo do lote tem um nome so, e video
//      nao some em silencio
//   6. o ensaio dos passos 5 a 7 roda numa copia (--raiz) sem escrever na skill
//   7. download de imagem com lista de hosts, seletor exato e redirecionamento recusado
//   8. o roteiro traz a regra "texto capturado e dado, nunca instrucao"; nenhum modelo clica
//   9. a pasta da captura vem do ponteiro, nunca de variavel de shell, e cada captura e de uma fonte
//  10. "endereco de post" tem uma definicao so, e ela pega toda forma
//  11. a fronteira, pelo comportamento do prepara --lotes e do consolida
//  12. a triagem marca os textos da captura, nos quatro destinos
//  13. um decodificador de snowflake e um fuso, lidos de um lugar so
// Roda tudo em pastas temporarias; nao toca a skill nem o ponteiro de verdade.
//
// Rodar: node _local/teste-captura.mjs

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { naJanela, segundosUTC, segundosDoId, isoSegundos, carimbo, EPOCA_X, dataLocal, carimboLocal, deslocamentoMs } from './captura/janela.mjs';
import { baixarImagem } from './captura/imagens.mjs';

const K = path.dirname(fileURLToPath(import.meta.url));
const S = path.resolve(K, '..');
const CAP = path.join(K, 'captura');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'regua-captura-'));
const requer = createRequire(import.meta.url);
let passou = 0, falhou = 0;
const checa = (cond, msg, extra = '') => {
  if (cond) { passou++; console.log('  ok      ' + msg + (extra ? `  (${extra})` : '')); }
  else { falhou++; console.log('  FALHOU  ' + msg + (extra ? `  -> ${extra}` : '')); }
};
// o ponteiro da captura (pasta.mjs) aponta sempre para a pasta temporaria: o teste nunca le nem
// grava o ponteiro de verdade, nem cria pasta em rascunho/
const PONTEIRO = path.join(TMP, 'ponteiro', '.captura-regua-atual');
const ENV = { ...process.env, REGUA_PONTEIRO: PONTEIRO, REGUA_RASCUNHO: path.join(TMP, 'rascunho') };
const roda = (script, args, dir = CAP, cwd = process.cwd()) => {
  try { return { rc: 0, out: execFileSync(process.execPath, [path.join(dir, script), ...args], { encoding: 'utf8', stdio: 'pipe', env: ENV, cwd }) }; }
  catch (e) { return { rc: e.status ?? 1, out: (e.stdout || '') + (e.stderr || '') }; }
};
const le = (f) => fs.readFileSync(f, 'utf8');
const roteiro = le(path.join(S, 'atualizar.md'));
const TEMAS = fs.readdirSync(path.join(S, 'references')).filter((f) => f.endsWith('.md'));

// a fonte do X que os testes usam, e uma pasta de captura dela (com o fonte.json que o
// `pasta.mjs nova` grava)
const TRIADO = '2026-10-02T23:07:08Z';
const FONTE_X = { nome: 'x-fulano', tipo: 'x', handle: 'fulano', triado_ate: TRIADO };
let nCap = 0;
function captura(fonte = FONTE_X) {
  const p = path.join(TMP, `captura-${++nCap}`);
  fs.mkdirSync(p, { recursive: true });
  const marca = fonte.tipo === 'x' ? 'triado_ate' : 'lido_ate';
  fs.writeFileSync(path.join(p, 'fonte.json'), JSON.stringify({ ...fonte, desde: fonte[marca] }, null, 2));
  return p;
}

// Um esqueleto da skill numa pasta temporaria: os scripts de captura, as duas regras unicas, o
// cobertura.json, o imagens.json, os temas (vazios) e assets/. Os scripts se localizam pela propria
// pasta, entao rodam aqui sem tocar a skill de verdade. `muda` aplica um defeito (prova de mutacao)
// e devolve se o texto mudou mesmo (mutacao que nao aplicou parece teste fraco).
let nEsq = 0;
function esqueleto({ cobertura = null } = {}) {
  const raiz = path.join(TMP, `esqueleto-${++nEsq}`, 'regua-de-receita');
  const k = path.join(raiz, '_local');
  fs.cpSync(CAP, path.join(k, 'captura'), { recursive: true });
  for (const f of ['endereco-de-post.cjs', 'regra-de-fonte.cjs']) fs.copyFileSync(path.join(K, f), path.join(k, f));
  fs.writeFileSync(path.join(k, 'cobertura.json'), JSON.stringify(cobertura || JSON.parse(le(path.join(K, 'cobertura.json'))), null, 2) + '\n');
  fs.writeFileSync(path.join(k, 'imagens.json'), '{}\n');
  fs.mkdirSync(path.join(raiz, 'references'), { recursive: true });
  for (const t of TEMAS) fs.writeFileSync(path.join(raiz, 'references', t), '# tema\n');
  fs.mkdirSync(path.join(raiz, 'assets'), { recursive: true });
  return {
    raiz, k, cap: path.join(k, 'captura'),
    muda(rel, de, para) { const f = path.join(k, rel); const t = le(f); fs.writeFileSync(f, t.replace(de, para)); return le(f) !== t; },
  };
}

console.log('\n=== 1. as fontes: quem usa escolhe, uma regra só, a marca não volta ===');
{
  // devolve o que esta errado (vazio = o fontes.mjs se comporta)
  const provaFontes = (e) => {
    const erros = [];
    const cwd = fs.mkdtempSync(path.join(TMP, 'raiz-'));
    fs.mkdirSync(path.join(cwd, 'dados'), { recursive: true });
    fs.writeFileSync(path.join(cwd, 'dados', 'livro-de-precos.pdf'), 'x');
    const f = (...a) => roda('fontes.mjs', a, e.cap, cwd);
    const cob = () => JSON.parse(le(path.join(e.k, 'cobertura.json')));
    const aceita = (r, nome) => { if (r.rc !== 0) erros.push(`${nome}: recusou (${r.out.trim().slice(0, 80)})`); };
    const recusa = (r, nome) => { if (r.rc === 0 || !/RECUSADO|uso:|precisa/.test(r.out)) erros.push(`${nome}: aceitou`); };
    aceita(f('adiciona', 'x', '@Fulano_1', '--desde', '2026-01-01'), 'x válido');
    const x = cob().fontes.find((z) => z.nome === 'x-fulano-1');
    if (!x || x.handle !== 'Fulano_1' || x.triado_ate !== '2025-12-31T23:59:59Z') erros.push(`x gravado errado: ${JSON.stringify(x)}`);
    recusa(f('adiciona', 'x', 'outro'), 'x sem --desde');
    recusa(f('adiciona', 'x', 'nome com espaço', '--desde', '2026-01-01'), 'handle inválido');
    recusa(f('adiciona', 'x', 'Fulano_1', '--desde', '2026-01-01'), 'nome repetido');
    const postLi = 'https://' + 'www.linkedin.com/' + 'posts/' + 'fulano_slug-activity-7400000000000000017-AbCd';
    recusa(f('adiciona', 'linkedin', postLi), 'linkedin apontando um post');
    aceita(f('adiciona', 'linkedin', 'https://' + 'www.linkedin.com/in/fulano/'), 'linkedin válido');
    recusa(f('adiciona', 'web', 'https://' + 'fixupx.com/fulano/' + 'status/' + '1900000000000000023'), 'web apontando um post do X (por um espelho)');
    recusa(f('adiciona', 'web', 'https://' + 'x.com/fulano'), 'web apontando um perfil do X (tem tipo próprio)');
    aceita(f('adiciona', 'web', 'https://' + 'exemplo.com.br/blog', '--desde', '2026-03-01'), 'web válido');
    recusa(f('adiciona', 'arquivo', 'dados/nao-existe.pdf'), 'arquivo que não existe');
    aceita(f('adiciona', 'arquivo', 'dados/livro-de-precos.pdf'), 'arquivo válido');
    recusa(f('avanca', 'x-fulano-1', '2025-06-01T00:00:00Z'), 'marca do X para trás');
    aceita(f('avanca', 'x-fulano-1', '2026-02-01T10:00:00Z'), 'marca do X para a frente');
    if (cob().fontes.find((z) => z.nome === 'x-fulano-1').triado_ate !== '2026-02-01T10:00:00Z') erros.push('avanca não gravou');
    recusa(f('avanca', 'x-fulano-1', '2026-02-01'), 'marca do X sem a hora');
    aceita(f('avanca', 'web-exemplo-com-br', '2026-03-10'), 'marca da web');
    aceita(f('remove', 'linkedin-fulano'), 'remove');
    const final = cob();
    if (final.fontes.map((z) => z.nome).join() !== 'x-fulano-1,web-exemplo-com-br,arquivo-livro-de-precos') erros.push(`lista final: ${final.fontes.map((z) => z.nome).join()}`);
    const { errosDasFontes } = requer(path.join(e.k, 'regra-de-fonte.cjs'));
    if (errosDasFontes(final.fontes).length) erros.push('o que o fontes.mjs gravou não passa na regra do verificador: ' + errosDasFontes(final.fontes).join('; '));
    return erros;
  };
  const real = provaFontes(esqueleto({ cobertura: { fuso: '-03:00', fontes: [] } }));
  checa(real.length === 0, 'fontes.mjs adiciona (x, linkedin, web, arquivo), valida cada tipo, recusa post no lugar de perfil, nome repetido e marca para trás', real.join('; '));
  const mutantes = {
    'regra sem recusar post na web': ['regra-de-fonte.cjs', "if (enderecosDePost(s).length) return", 'if (false) return'],
    'avanca deixando a marca voltar': ['captura/fontes.mjs', 'if (depois < antes) para(', 'if (false) para('],
  };
  for (const [nome, [rel, de, para]] of Object.entries(mutantes)) {
    const m = esqueleto({ cobertura: { fuso: '-03:00', fontes: [] } });
    checa(m.muda(rel, de, para) && provaFontes(m).length > 0, `mutante "${nome}": a prova das fontes reprova`);
  }
  // uma regra so: o gravador e o verificador importam a mesma; nenhum dos dois escreve a sua
  const importam = ['captura/fontes.mjs', 'verificar.js'].filter((f) => /regra-de-fonte\.cjs/.test(le(path.join(K, f))));
  const propria = ['captura/fontes.mjs', 'verificar.js', 'captura/pasta.mjs'].filter((f) => le(path.join(K, f)).includes('A-Za-z0-9_]{1,15}'));
  checa(importam.length === 2 && propria.length === 0, 'fontes.mjs e verificar.js importam regra-de-fonte.cjs, e nenhum escreve a própria regra de fonte', propria.join(', '));
  checa(/fontes\.mjs adiciona x/.test(roteiro) && /fontes\.mjs avanca/.test(roteiro) && /fontes\.mjs adiciona (?:web|arquivo)/.test(roteiro),
    'o atualizar.md ensina a escolher a fonte (adiciona) e a fechar a janela dela (avanca)');
}

console.log('\n=== 2. a fronteira da janela tem uma regra só ===');
{
  checa(!naJanela('2026-10-02T23:07:08.000Z', TRIADO), 'o post da fronteira (mesmo segundo, data do X com .000Z) fica FORA');
  checa(!naJanela('2026-10-02T23:07:08.096Z', TRIADO), 'o post da fronteira com milissegundos (data do snowflake) fica FORA');
  checa(naJanela('2026-10-02T23:07:09.000Z', TRIADO), 'um segundo depois fica DENTRO');
  // um id cujo snowflake cai em 23:07:08.096Z: comparar em milissegundos o poria dentro
  const ms = Date.parse('2026-10-02T23:07:08.096Z');
  const id = ((BigInt(ms) - EPOCA_X) << 22n).toString();
  checa(segundosDoId(id) === segundosUTC(TRIADO), 'segundosDoId trunca o snowflake no segundo', isoSegundos(segundosDoId(id)));
  checa(isoSegundos(segundosUTC('2026-10-02T23:07:08.999Z')) === TRIADO && carimbo(segundosUTC(TRIADO)) === '20261002T230708Z',
    'o triado_ate e o carimbo de nome saem no mesmo formato de segundo inteiro');
  // nenhum script compara a fronteira de outro jeito
  const fontes = ['prepara.mjs', 'consolida.mjs', 'modelos/respostas.js', 'modelos/artigos.js'].map((f) => [f, le(path.join(CAP, f))]);
  const textoIso = fontes.filter(([, t]) => /[<>]=?\s*DESDE\b|DESDE\s*[<>]|'__DESDE__'|Date\.parse\([^)]*\)\s*[<>]/.test(t)).map(([f]) => f);
  checa(textoIso.length === 0, 'nenhum script compara a fronteira como texto ISO ou em milissegundos', textoIso.join(', '));
  const usaRegra = fontes.filter(([f, t]) => f.startsWith('modelos/') ? /DESDE_S/.test(t) && /Math\.floor\(Date\.parse/.test(t) : /janela\.mjs/.test(t)).length;
  checa(usaRegra === fontes.length, 'todos usam a regra única (janela.mjs, ou DESDE_S em segundos nos trechos de navegador)', `${usaRegra}/${fontes.length}`);
  // o prepara entrega aos trechos de navegador o desde ja em segundos, como numero
  const P = captura();
  const r = roda('prepara.mjs', [P]);
  const gerados = ['respostas.js', 'artigos.js'].map((f) => (fs.existsSync(path.join(P, f)) ? le(path.join(P, f)) : ''));
  checa(r.rc === 0 && gerados.every((t) => /DESDE_S = \d{10};/.test(t) && !/__DESDE/.test(t)) && le(path.join(P, 'busca.js')).includes('from%3Afulano'),
    'o prepara.mjs troca __DESDE_S__ pelo número de segundos e o perfil pelo handle da fonte da captura');
  checa(/segundos inteiros em UTC/.test(roteiro) && /Math\.floor\(Number\(\(BigInt\(id\) >> 22n\)/.test(roteiro) && !/new Date\(Number\(\(BigInt\(id\)/.test(roteiro),
    'o roteiro ensina a mesma regra (segundos inteiros, como número)');
}

console.log('\n=== 3. "nada novo na janela": roteiro e scripts dizem a mesma coisa ===');
{
  const P = captura();
  const r = roda('consolida.mjs', [P]);
  const frase = 'nada novo na janela: o triado_ate não muda';
  checa(r.rc === 0 && r.out.includes(frase), 'o consolida.mjs, sem item na janela, diz que o triado_ate não muda', r.out.trim().split('\n').pop());
  checa(roteiro.includes(frase) && /\*\*Nada na janela\*\*[\s\S]{0,200}não muda/.test(roteiro), 'o atualizar.md diz a mesma frase no passo 7');
  checa(!/atualize `triado_ate`/.test(roteiro), 'o roteiro não manda "atualize triado_ate" sem dizer o valor');
}

console.log('\n=== 4. só o guardador escreve imagem dentro da skill, e só de post que virou princípio ===');
{
  // tudo num esqueleto temporario: a "skill" que a guarda protege e a do esqueleto, e a de verdade
  // nunca recebe pasta de teste
  const P = captura();
  fs.writeFileSync(path.join(P, 'imagens.tsv'), '');
  // a guarda, medida pelo comportamento: devolve as recusas que FALTARAM (vazia = guarda inteira)
  const provaGuarda = (e) => {
    const faltou = [];
    const r = roda('baixa-imagens.mjs', [P, '--ids', '1'], e.cap);
    if (!(r.rc === 0 && fs.existsSync(path.join(P, 'imagens')))) faltou.push('não gravou na pasta da captura (controle)');
    const dentro = path.join(e.raiz, 'assets', 'teste-captura');
    const rr = roda('baixa-imagens.mjs', [P, '--ids', '1', '--saida', dentro], e.cap);
    if (!(rr.rc !== 0 && /RECUSADO/.test(rr.out) && !fs.existsSync(dentro))) faltou.push('--saida assets/teste-captura');
    const Pd = path.join(e.raiz, 'assets', 'teste-captura-pasta');
    fs.mkdirSync(Pd, { recursive: true });
    const rp = roda('baixa-imagens.mjs', [Pd, '--ids', '1'], e.cap);
    if (!(rp.rc !== 0 && !fs.existsSync(path.join(Pd, 'imagens')))) faltou.push('pasta de captura dentro da skill');
    return faltou;
  };
  const e = esqueleto();
  const faltou = provaGuarda(e);
  checa(faltou.length === 0, 'o baixa-imagens.mjs grava na pasta da captura e recusa --saida em assets/ e pasta de captura dentro da skill (num esqueleto temporário)', faltou.join('; '));
  const m = esqueleto();
  const aplicou = m.muda('captura/baixa-imagens.mjs', "if (!rel.startsWith('..') && !path.isAbsolute(rel)) {", 'if (false) {');
  checa(aplicou && provaGuarda(m).length >= 2, 'mutante sem a guarda: a prova reprova (e o lixo fica só no esqueleto temporário)');
  const lixo = ['assets/teste-captura', 'assets/teste-captura-pasta'].filter((d) => fs.existsSync(path.join(S, d)));
  checa(lixo.length === 0, 'a skill de verdade não ganhou pasta de teste', lixo.join(', '));
  const escrevem = fs.readdirSync(CAP).filter((f) => f.endsWith('.mjs'))
    .filter((f) => /path\.join\(S,\s*'assets'\)|ASSETS\s*=/.test(le(path.join(CAP, f))));
  checa(escrevem.length === 1 && escrevem[0] === 'guarda-imagens.mjs', 'o único script de captura que aponta assets/ é o guarda-imagens.mjs', escrevem.join(', '));

  // o guardador, ponta a ponta: a imagem de um post que virou principio entra em assets/ e no
  // imagens.json; a de um post so coberto e recusada, e nada se grava
  const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)]);
  const tema = TEMAS[0].replace('.md', '');
  const provaGuardador = (g) => {
    const erros = [];
    const Pg = captura();
    fs.mkdirSync(path.join(Pg, 'textos'), { recursive: true });
    fs.mkdirSync(path.join(Pg, 'imagens'), { recursive: true });
    const texto = (id, triagem) => `---\nid: ${id}\ntriagem: ${triagem}\n---\ncorpo\n\n## Imagens do post\n\n1. imagem pendente de triagem (\`${id}__1\`) — ${'https://'}pbs.twimg.com/media/A\n`;
    fs.writeFileSync(path.join(Pg, 'textos', '111.md'), texto('111', '"princípio: A planted principle"'));
    fs.writeFileSync(path.join(Pg, 'textos', '222.md'), texto('222', '"coberto por: Another principle"'));
    fs.writeFileSync(path.join(Pg, 'imagens', '111__1.jpg'), PNG);   // nome de trabalho .jpg, conteudo PNG
    fs.writeFileSync(path.join(Pg, 'imagens', '222__1.png'), PNG);
    const dec = (lista) => fs.writeFileSync(path.join(Pg, 'decisoes-de-imagem.json'), JSON.stringify(lista));
    dec([{ chave: '111__1', decisao: 'fica', tema, nome: 'planted-chart', shows: 'a planted chart' }]);
    const r1 = roda('guarda-imagens.mjs', [Pg, '--escreve'], g.cap);
    const cat = JSON.parse(le(path.join(g.k, 'imagens.json')));
    if (r1.rc !== 0 || !fs.existsSync(path.join(g.raiz, 'assets', tema, 'planted-chart.png')) || !cat[`${tema}/planted-chart.png`]) erros.push(`a imagem de princípio não entrou (assets e imagens.json): ${r1.out.trim().slice(0, 100)}`);
    if (!le(path.join(Pg, 'textos', '111.md')).includes(`\`assets/${tema}/planted-chart.png\``)) erros.push('o texto não aponta o caminho novo');
    dec([{ chave: '222__1', decisao: 'fica', tema, nome: 'covered-chart', shows: 'x' }]);
    const r2 = roda('guarda-imagens.mjs', [Pg, '--escreve'], g.cap);
    if (r2.rc === 0 || fs.existsSync(path.join(g.raiz, 'assets', tema, 'covered-chart.png')) || JSON.parse(le(path.join(g.k, 'imagens.json')))[`${tema}/covered-chart.png`]) erros.push('a imagem de post só coberto entrou na skill');
    return erros;
  };
  const real = provaGuardador(esqueleto());
  checa(real.length === 0, 'guarda-imagens.mjs põe em assets/ e no imagens.json só a imagem de post com triagem principio (extensão pela assinatura), e recusa a de post coberto', real.join('; '));
  const mg = esqueleto();
  checa(mg.muda('captura/guarda-imagens.mjs', "if (!/^\"princípio: /.test(tri)) {", 'if (false) {') && provaGuardador(mg).length > 0,
    'mutante sem a guarda da triagem: a prova reprova');
}

console.log('\n=== 5. comandos e nomes sem adivinhar (artigo, lote, vídeos) ===');
{
  const P = captura();
  const ids = ['1900000000000000037', '1900000000000000031'];
  const r = roda('prepara.mjs', [P, '--artigos', ids.join(',')]);
  const scripts = ids.map((id) => path.join(P, 'artigos', `artigo-${id}.js`));
  const prontos = scripts.filter((f) => {
    if (!fs.existsSync(f)) return false;
    const t = le(f), id = path.basename(f).match(/\d+/)[0];
    try { new Function('return ' + t); } catch { return false; }   // compila como o run_code_unsafe espera
    return !/__ID__/.test(t) && t.includes(`/status/${id}"`) && t.includes(`window.__artigo = { id: '${id}'`) && /page\.goto/.test(t);
  });
  checa(r.rc === 0 && prontos.length === ids.length, 'o prepara.mjs --artigos gera um script pronto por artigo (id trocado, navega, compila)', `${prontos.length}/${ids.length}`);
  checa(/prepara\.mjs @atual --artigos/.test(roteiro) && /artigos\/artigo-<id>\.js/.test(roteiro),
    'o roteiro manda gerar o script do artigo e rodar com browser_run_code_unsafe, sem colar nem trocar id à mão');
  const L = captura();
  roda('prepara.mjs', [L, '--ids', '1,2,3']);
  const lote = le(path.join(L, 'lotes', 'ids-01.js'));
  checa(/const LOTE = 'ids-01';/.test(lote) && /despejo: 'perma-' \+ LOTE \+ '\.json'/.test(lote),
    'o lote se chama como o arquivo (ids-01) e devolve o nome do despejo (perma-ids-01.json)');
  checa(/perma-<lote>\.json/.test(roteiro) && !/perma-NN\.json/.test(roteiro) && /perma-<lote>\.json/.test(le(path.join(CAP, 'modelos', 'permalink-lote.js'))) && /\^perma-\.\*\\\.json\$/.test(le(path.join(CAP, 'consolida.mjs'))),
    'um nome só para o despejo do lote no roteiro e no script (perma-<lote>.json), e o consolida lê todos');
  const V = captura();
  const capa = (n) => 'https://' + `pbs.twimg.com/ext_tw_video_thumb/${n}/pu/img/a.jpg`;
  fs.writeFileSync(path.join(V, 'consolidado.json'), JSON.stringify([{ id: '9999999999999999992', dt: '2026-10-03T10:00:00.000Z', kind: 'post',
    corpo: 'Post de teste com dois vídeos e um terceiro no fio, para provar que nenhum vídeo some em silêncio.', imgs: [],
    videos: [capa(1), capa(2)],
    fio: [{ id: '9999999999999999993', dt: '2026-10-03T10:01:00.000Z', corpo: 'fio', imgs: [], videos: [capa(3)] }],
    metricas: null, integral: true }]));
  roda('escreve-textos.mjs', ['--consolidado', path.join(V, 'consolidado.json'), '--escreve']);
  const fv = path.join(V, 'textos', '9999999999999999992.md');
  const tv = fs.existsSync(fv) ? le(fv) : '';
  checa(/^videos: 3$/m.test(tv) && (tv.match(/^\d+\. vídeo não guardado/gm) || []).length === 3,
    'post com 2+ vídeos (e vídeo no fio) registra todos, um por linha, no texto da captura', `${(tv.match(/^\d+\. vídeo não guardado/gm) || []).length} linhas`);
  checa(/^triagem: pendente$/m.test(tv) && /^fonte: x-fulano$/m.test(tv) && !fs.existsSync(path.join(S, '_local', 'textos')),
    'o texto nasce na pasta da captura, com a fonte e a triagem pendente (e nada nasce dentro da skill)');
}

console.log('\n=== 6. ensaio dos passos 5 a 7 numa cópia (--raiz), sem escrever na skill ===');
{
  const vigiados = ['INDEX.md', 'IMAGENS.md', 'SKILL.md', 'README.md', '_local/manifesto.json',
    '_local/cobertura.json', '_local/imagens.json', 'references/pricing-and-monetization.md'];
  const foto = () => vigiados.map((f) => le(path.join(S, f))).join('\u0000');
  const antes = foto();
  const copia = path.join(TMP, 'copia', 'regua-de-receita');
  fs.cpSync(S, copia, { recursive: true });
  // um principio novo so na copia, como faria o passo 6
  const ref = path.join(copia, 'references', 'pricing-and-monetization.md');
  fs.writeFileSync(ref, le(ref).replace(/\n(?=## )/, '\n## A principle written only in the dry-run copy\n**Principle.** x\n**Apply when.** x\n**The move.** x\n\n'));
  const bash = (args) => { try { return { rc: 0, out: execFileSync('bash', [path.join(K, 'sincronizar.sh'), ...args], { encoding: 'utf8', stdio: 'pipe' }) }; } catch (e) { return { rc: e.status ?? 1, out: String(e.stdout || '') + String(e.stderr || '') }; } };
  const r1 = bash(['--raiz', copia]);
  checa(/fechando o lote na cópia/.test(r1.out) && le(path.join(copia, 'INDEX.md')).includes('A principle written only in the dry-run copy'),
    'o sincronizar.sh --raiz <cópia> roda os passos na cópia (o índice da cópia ganhou o princípio)');
  checa(foto() === antes, 'a skill de verdade não mudou em nada (índices, catálogo, manifesto, fontes, temas)');
  const vr = (args) => { try { execFileSync(process.execPath, [path.join(K, 'verificar.js'), ...args], { stdio: 'pipe' }); return 0; } catch (e) { return e.status ?? 1; } };
  // a regua aponta para a copia: um defeito so na copia reprova la e nao aqui
  fs.writeFileSync(ref, le(ref).replace(/^\*\*The move\.\*\* x\n/m, ''));
  checa(vr(['--raiz', copia]) !== 0 && vr([]) === 0, 'o verificar.js --raiz <cópia> reprova o defeito da cópia, e a skill de verdade continua verde');
  checa(bash(['--raiz', path.join(TMP, 'nao-existe')]).rc !== 0, '--raiz que não é cópia da skill é recusada');
  checa(/--raiz/.test(roteiro) && /pasta temporária/.test(roteiro), 'o roteiro descreve o ensaio: copiar a skill para uma pasta temporária e fechar com --raiz');
}

console.log('\n=== 7. o download de imagem tem portão: lista de hosts, sem redirecionamento, assinatura ===');
{
  const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)]);
  const HTML = Buffer.from('<!doctype html><html><body>não é imagem</body></html>');
  const H = 'https://';
  const BOM = H + 'pbs.twimg.com/media/AbCdEf?format=jpg&name=orig';
  const LI_BOM = H + 'media.licdn.com/dms/image/v2/abc/feedshare-shrink_800/0?e=1&v=beta';
  const resposta = (buf, extra = {}) => ({ status: 200, ok: true, redirected: false, url: extra.url ?? BOM, arrayBuffer: async () => buf, ...extra });
  // as propriedades do portao; devolve a lista das que FALHARAM (vazia = portao inteiro)
  const provaPortao = async (baixar) => {
    const falhas = [];
    let chamadas = 0, opcoes = null;
    const conta = (r) => async (u, o) => { chamadas++; opcoes = o; if (r instanceof Error) throw r; return r; };
    for (const fora of [H + 'evil.example/media/a.jpg', 'http://' + 'pbs.twimg.com/media/a.jpg', H + 'pbs.twimg.com.evil.example/media/a.jpg',
      H + 'pbs.twimg.com/profile_images/a.jpg', H + 'media.licdn.com/pixel/a.gif', 'file:///etc/passwd']) {
      chamadas = 0;
      const r = await baixar(fora, { fetch: conta(resposta(PNG, { url: fora })) });
      if (r.ok || chamadas !== 0) falhas.push(`host fora da lista aceito: ${fora}`);
    }
    const ok = await baixar(BOM, { fetch: conta(resposta(PNG)) });
    if (!ok.ok || ok.ext !== 'png') falhas.push('imagem boa da lista recusada (controle)');
    if (!opcoes || opcoes.redirect !== 'error') falhas.push(`fetch sem redirect: 'error' (${opcoes && opcoes.redirect})`);
    const li = await baixar(LI_BOM, { fetch: conta(resposta(PNG, { url: LI_BOM })) });
    if (!li.ok) falhas.push('imagem do LinkedIn da lista recusada (controle)');
    if ((await baixar(BOM, { fetch: conta(new TypeError('fetch failed: unexpected redirect')) })).ok) falhas.push('redirecionamento (fetch recusou) aceito');
    if ((await baixar(BOM, { fetch: conta(resposta(PNG, { status: 302, ok: false })) })).ok) falhas.push('resposta 302 aceita');
    if ((await baixar(BOM, { fetch: conta(resposta(PNG, { redirected: true, url: H + 'evil.example/x.png' })) })).ok) falhas.push('resposta redirecionada para fora aceita');
    if ((await baixar(BOM, { fetch: conta(resposta(HTML)) })).ok) falhas.push('assinatura errada (HTML) aceita');
    if ((await baixar(BOM, { fetch: conta(resposta(Buffer.alloc(0))) })).ok) falhas.push('arquivo vazio aceito');
    return falhas;
  };
  const real = await provaPortao(baixarImagem);
  checa(real.length === 0, 'baixarImagem recusa host fora da lista (sem nem chamar a rede), redirecionamento e assinatura errada, e aceita a boa', real.join('; '));
  // prova de mutacao: cada parte do portao, tirada, faz a prova acima reprovar
  const fonte = le(path.join(CAP, 'imagens.mjs'));
  const mutantes = {
    'sem a lista de hosts': ["if (!hostPermitido(url)) return", "if (false) return"],
    "sem redirect: 'error'": ["{ headers, redirect: 'error' }", "{ headers }"],
    'sem recusar resposta redirecionada': ["return { ok: false, motivo: 'redirecionamento recusado' };", ';'],
    'sem a assinatura': ["const ext = buf.length ? extensaoReal(buf) : null;", "const ext = 'jpg';"],
  };
  for (const [nome, [de, para]] of Object.entries(mutantes)) {
    const arq = path.join(TMP, `mutante-${nome.replace(/\W+/g, '-')}.mjs`);
    fs.writeFileSync(arq, fonte.replace(de, para));
    const aplicou = le(arq) !== fonte;
    const { baixarImagem: m } = await import(pathToFileURL(arq).href);
    checa(aplicou && (await provaPortao(m)).length > 0, `mutante "${nome}": a prova do portão reprova`);
  }
  // ponta a ponta: o baixa-imagens.mjs recusa host fora da lista (X e LinkedIn) e nao grava nada
  const P = captura();
  fs.writeFileSync(path.join(P, 'imagens.tsv'), ['111\t1\t' + H + 'evil.example/media/a.jpg', '111\t2\t' + H + 'pbs.twimg.com.evil.example/media/b.jpg'].join('\n') + '\n');
  // o URN montado na hora: este arquivo tambem e varrido pelo verificar.js
  fs.writeFileSync(path.join(P, 'linkedin.json'), JSON.stringify({ posts: [{ urn: 'urn:li:' + 'activity:' + '7480000000000000000', imgs: [H + 'cdn.evil.example/dms/image/c.jpg'] }] }));
  const r = roda('baixa-imagens.mjs', [P, '--ids', '111,7480000000000000000', '--linkedin', path.join(P, 'linkedin.json')]);
  const gravadas = fs.existsSync(path.join(P, 'imagens')) ? fs.readdirSync(path.join(P, 'imagens')) : [];
  checa(r.rc !== 0 && (r.out.match(/RECUSADA/g) || []).length === 3 && gravadas.length === 0,
    'o baixa-imagens.mjs recusa os 3 hosts de fora (2 do X, 1 do LinkedIn), sai com erro e não grava arquivo', `${(r.out.match(/RECUSADA/g) || []).length} recusadas, ${gravadas.length} gravadas`);
  checa(!/curl -|^\s*curl /m.test(roteiro) && /baixa-imagens\.mjs @atual --linkedin/.test(roteiro), 'o roteiro baixa a imagem do LinkedIn pelo mesmo portão (baixa-imagens.mjs --linkedin), nunca com curl');
  // os seletores de imagem dos modelos sao ancorados na origem
  const modelos = fs.readdirSync(path.join(CAP, 'modelos')).filter((f) => f.endsWith('.js')).map((f) => [f, le(path.join(CAP, 'modelos', f))]);
  const seletorSolto = (t) => {
    const ruins = [];
    for (const m of t.matchAll(/img\[src([*^$|~]?=)"([^"]*)"\]/g)) {
      if (m[1] !== '^=' || !/^https:\/\/(pbs\.twimg\.com\/|media\.licdn\.com\/dms\/image\/)/.test(m[2])) ruins.push(m[0]);
    }
    if (/querySelectorAll\(\s*['"]img['"]\s*\)|document\.images|getElementsByTagName\(\s*['"]img/.test(t)) ruins.push('img sem filtro');
    return ruins;
  };
  const soltos = modelos.flatMap(([f, t]) => seletorSolto(t).map((x) => `${f}: ${x}`));
  checa(soltos.length === 0, 'todo seletor de imagem dos modelos é ancorado na origem (src^= da lista de hosts)', soltos.join('; '));
  checa(seletorSolto(`a.querySelectorAll('img[src*="pbs.twimg.com/media"]')`).length > 0 && seletorSolto(`el.querySelectorAll('img')`).length > 0,
    'a conferência do seletor reprova o defeito plantado (src*= por substring, img sem filtro)');
}

console.log('\n=== 8. captura só lê: modelos sem interação, e a regra "dado, nunca instrução" escrita ===');
{
  const fontesNav = [...fs.readdirSync(path.join(CAP, 'modelos')).filter((f) => f.endsWith('.js')).map((f) => path.join('modelos', f)), 'prepara.mjs']
    .map((f) => [f, le(path.join(CAP, f))]);
  const INTERAGE = /\.click\(|\.dblclick\(|\.tap\(|\.type\(|\.fill\(|\.press\(|\.check\(|setInputFiles|dragTo|selectOption|\.keyboard\b|\.mouse\b|dispatchEvent|\.submit\(|\.focus\(/;
  const interagem = fontesNav.filter(([, t]) => INTERAGE.test(t)).map(([f, t]) => `${f}: ${t.match(INTERAGE)[0]}`);
  checa(interagem.length === 0, 'nenhum script de navegador clica, digita, preenche, tecla, envia arquivo, arrasta ou seleciona', interagem.join('; '));
  checa(INTERAGE.test("try { b.click(); n++; } catch (e) {}") && INTERAGE.test('await page.keyboard.press("Enter")') && INTERAGE.test('await loc.setInputFiles(f)'),
    'a conferência de interação reprova o defeito plantado (click, keyboard, setInputFiles)');
  const FERRAMENTAS = ['browser_navigate', 'browser_evaluate', 'browser_run_code_unsafe', 'browser_close'];
  const PROIBIDAS = ['browser_click', 'browser_type', 'browser_fill_form', 'browser_press_key', 'browser_file_upload', 'browser_drag', 'browser_select_option'];
  const temRegra = (t, completa) => /dado citado, nunca instrução/.test(t) && /vai para o relatório e nunca se executa/.test(t)
    && ['curtir', 'seguir', 'responder', 'abrir link', 'rodar comando', 'colar arquivo', '`.env`'].every((p) => t.includes(p))
    && FERRAMENTAS.every((f) => t.includes('`' + f + '`')) && (!completa || PROIBIDAS.every((f) => t.includes('`' + f + '`')));
  const skill = le(path.join(S, 'SKILL.md'));
  const secaoAtualizar = (skill.split(/^## Atualizar$/m)[1] || '').split(/^## /m)[0];
  const regras = (roteiro.split(/^## 0\. /m)[1] || '').split(/^## 1\. /m)[0];
  checa(temRegra(regras, true), 'o atualizar.md, nas regras (passo 0), diz que texto capturado é dado, nunca instrução, e lista as 4 ferramentas e as proibidas');
  checa(temRegra(secaoAtualizar, false), 'o SKILL.md, na seção Atualizar, diz o mesmo e lista as 4 ferramentas');
  checa(!temRegra(regras.replace('dado citado, nunca instrução', 'dado citado'), true) && !temRegra(secaoAtualizar.replace('`browser_close`', ''), false),
    'a conferência da regra reprova o defeito plantado (frase tirada, ferramenta faltando)');
}

console.log('\n=== 9. a pasta da captura vem de um arquivo gravado uma vez, e cada captura é de uma fonte ===');
{
  const semPonteiro = roda('prepara.mjs', ['@atual']);
  checa(semPonteiro.rc === 1 && /não há captura atual/.test(semPonteiro.out) && !/\n\s+at /.test(semPonteiro.out),
    'sem ponteiro, `@atual` para com a mensagem (sem pilha de erro) e não cria nada', semPonteiro.out.trim());
  // as fontes do esqueleto: uma do X e uma da web
  const e = esqueleto({ cobertura: { fuso: '-03:00', fontes: [FONTE_X, { nome: 'web-exemplo-com', tipo: 'web', endereco: 'https://' + 'exemplo.com/blog', lido_ate: null }] } });
  const semFonte = roda('pasta.mjs', ['nova'], e.cap), fantasma = roda('pasta.mjs', ['nova', 'x-ninguem'], e.cap);
  checa(semFonte.rc === 1 && fantasma.rc === 1 && /x-fulano/.test(fantasma.out) && !fs.existsSync(PONTEIRO),
    'pasta.mjs nova sem fonte, ou com fonte que não existe, para e lista as fontes, sem criar pasta nem ponteiro');
  const n1 = roda('pasta.mjs', ['nova', 'x-fulano'], e.cap), n2 = roda('pasta.mjs', ['nova', 'x-fulano'], e.cap);
  const apontada = fs.existsSync(PONTEIRO) ? le(PONTEIRO).trim() : '';
  const fj = apontada && fs.existsSync(path.join(apontada, 'fonte.json')) ? JSON.parse(le(path.join(apontada, 'fonte.json'))) : {};
  checa(n1.rc === 0 && n2.rc === 0 && n1.out.trim() !== n2.out.trim() && apontada.split(path.sep).join('/').endsWith(n2.out.trim())
    && /captura-x-fulano-\d{8}-\d{4}(-\d+)?$/.test(apontada) && fs.existsSync(apontada) && fj.handle === 'fulano' && fj.desde === TRIADO,
  'pasta.mjs nova <fonte> cria a pasta com o nome da fonte, data e hora no fuso da skill, grava o fonte.json (desde = triado_ate) e o ponteiro; duas no mesmo minuto não dividem pasta', `${n1.out.trim()} | ${n2.out.trim()}`);
  const atual = roda('pasta.mjs', [], e.cap);
  checa(atual.rc === 0 && atual.out.trim() === n2.out.trim(), 'pasta.mjs sem argumento imprime a pasta do ponteiro (para o filename do navegador)');
  const cwd = fs.mkdtempSync(path.join(TMP, 'cwd-'));
  const pr = roda('prepara.mjs', ['@atual'], e.cap, cwd);
  checa(pr.rc === 0 && ['busca.js', 'respostas.js', 'artigos.js'].every((f) => fs.existsSync(path.join(apontada, f))) && !fs.existsSync(path.join(cwd, '@atual')),
    'prepara.mjs @atual grava na pasta do ponteiro (e não numa pasta chamada "@atual")');
  const co = roda('consolida.mjs', ['@atual'], e.cap);
  checa(co.rc === 0 && fs.existsSync(path.join(apontada, 'consolidado.json')), 'consolida.mjs @atual lê e grava na pasta do ponteiro');
  const ef = roda('escreve-textos.mjs', ['--consolidado', '@atual/consolidado.json'], e.cap);
  checa(ef.rc === 0, 'escreve-textos.mjs --consolidado @atual/consolidado.json resolve o arquivo dentro da pasta do ponteiro', ef.out.trim().split('\n').pop());
  // todo script de captura que recebe pasta passa pelo ponteiro
  const recebem = ['prepara.mjs', 'consolida.mjs', 'baixa-imagens.mjs', 'guarda-imagens.mjs', 'marca-triagem.mjs'];
  const semArg = recebem.filter((f) => !/argPasta\(process\.argv\[2\]\)/.test(le(path.join(CAP, f))));
  checa(semArg.length === 0 && /argPasta\(process\.argv\[iConsol \+ 1\]\)/.test(le(path.join(CAP, 'escreve-textos.mjs'))),
    'os 5 scripts de captura e o escreve-textos aceitam @atual', semArg.join(', '));
  // a captura de uma fonte que nao e do X: os scripts do X param e dizem o que fazer
  roda('pasta.mjs', ['nova', 'web-exemplo-com'], e.cap);
  const web = roda('prepara.mjs', ['@atual'], e.cap);
  checa(web.rc === 1 && /serve só a fonte do X/.test(web.out), 'prepara.mjs numa captura de fonte web para e aponta o passo do roteiro para o tipo dela', web.out.trim());
  fs.writeFileSync(PONTEIRO, path.join(TMP, 'sumiu') + '\n');
  const quebrado = roda('consolida.mjs', ['@atual']);
  checa(quebrado.rc === 1 && /não existe/.test(quebrado.out), 'ponteiro para pasta que não existe: para e diz, sem criar a pasta', quebrado.out.trim());
  fs.rmSync(PONTEIRO, { force: true });
  // o roteiro: nenhum comando depende de variavel de shell; todo comando e completo
  const semVariavel = (t) => {
    const ruins = [];
    let bloco = false;
    for (const l of t.split('\n')) {
      if (/^\s*```/.test(l)) { bloco = !bloco; continue; }
      if (/^\s*[A-Z][A-Z_]*=/.test(l) && bloco) ruins.push(l.trim());
      if (/\$[A-Z]\b|\$\{[A-Z]|\$\(node -e/.test(l)) ruins.push(l.trim());
      if (bloco && /^\s*node /.test(l) && !/^\s*node (\.claude\/skills\/regua-de-receita\/|<copia>\/)/.test(l)) ruins.push(l.trim());
    }
    return ruins;
  };
  const ruins = semVariavel(roteiro);
  checa(ruins.length === 0 && /pasta\.mjs nova/.test(roteiro) && /`@atual`/.test(roteiro),
    'o atualizar.md não usa variável de shell (S=, P=, $P, $(node -e …)): todo comando é completo, e a pasta vem do pasta.mjs (@atual)', ruins.slice(0, 3).join(' | '));
  checa(semVariavel('```bash\nS=.claude/skills/x\nnode $S/captura/prepara.mjs $P\n```').length >= 2,
    'a conferência do roteiro reprova o defeito plantado (S= e $P num bloco de comando)');
}

console.log('\n=== 10. "endereço de post" tem uma definição só, e ela pega toda forma ===');
{
  // links montados na hora: este arquivo tambem e varrido pelo verificar.js
  const ID = '1900000000000000023', LI = '7400000000000000029';
  const st = 'status' + '/', H = 'https://';
  const FORMAS = {
    'x.com/<perfil>/status': H + 'x.com/fulano/' + st + ID,
    'x.com/i/web/status': H + 'x.com/i/web/' + st + ID,
    'x.com/i/status (sem https)': 'x.com/i/' + st + ID,
    'twitter.com com /photo e ?s=': H + 'twitter.com/fulano/' + st + ID + '/photo/1?s=20',
    'mobile.twitter.com/statuses': H + 'mobile.twitter.com/fulano/' + 'statuses/' + ID,
    'espelho fixupx.com': H + 'fixupx.com/fulano/' + st + ID,
    'linkedin.com/feed/update': H + 'www.linkedin.com/feed/update/' + 'urn:li:' + 'activity:' + LI + '/',
    'linkedin.com/posts': H + 'www.linkedin.com/' + 'posts/' + 'fulano_slug-activity-' + LI + '-AbCd',
    'urn:li:activity sozinho': 'urn:li:' + 'activity:' + LI,
    'urn:li:share': 'urn:li:' + 'share:' + LI,
    'urn:li:ugcPost': 'urn:li:' + 'ugcPost:' + LI,
  };
  const LIVRES = [H + 'x.com/fulano', H + 'x.com/fulano/settings/foo', H + 'www.linkedin.com/in/fulano/',
    H + 'pbs.twimg.com/media/AbCdEf?format=jpg&name=orig', H + 'media.licdn.com/dms/image/v2/abc/feedshare-shrink_800/0'];
  const { enderecosDePost, semEnderecoDePost } = requer('./endereco-de-post.cjs');
  const naoPega = Object.entries(FORMAS).filter(([, u]) => enderecosDePost(`ver ${u} fim`).length !== 1).map(([n]) => n);
  checa(naoPega.length === 0, `a definição pega as ${Object.keys(FORMAS).length} formas (X, /i/web/, twitter.com, espelho, LinkedIn feed/update e posts, URN)`, naoPega.join(', '));
  const falsos = LIVRES.filter((u) => enderecosDePost(u).length);
  checa(falsos.length === 0, 'e não pega perfil nem imagem', falsos.join(', '));
  const NL = String.fromCharCode(92) + 'n';   // a barra invertida + n do JSON, como texto
  const limpo = semEnderecoDePost(JSON.stringify({ corpo: Object.values(FORMAS).join('\n') + '\nfim' }));
  checa(enderecosDePost(limpo).length === 0 && limpo.includes('post ' + ID) && limpo.includes('post ' + LI) && limpo.endsWith(NL + 'fim"}'),
    'a limpeza troca cada forma por "post <id>" sem engolir o texto seguinte (o \\n do JSON)');
  // os consumidores importam a definicao; nenhum outro codigo da skill escreve a propria regex
  const consumidores = { 'verificar.js': /requerOuNada\('\.\/endereco-de-post\.cjs'\)/, 'regra-de-fonte.cjs': /require\('\.\/endereco-de-post\.cjs'\)/, 'captura/escreve-textos.mjs': /from '\.\.\/endereco-de-post\.cjs'/ };
  const naoImportam = Object.entries(consumidores).filter(([f, re]) => !re.test(le(path.join(K, f)))).map(([f]) => f);
  checa(naoImportam.length === 0, 'verificar.js, regra-de-fonte.cjs e escreve-textos.mjs importam endereco-de-post.cjs', naoImportam.join(', '));
  const codigo = [];
  const anda = (d) => { for (const x of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, x.name);
    if (x.isDirectory()) { if (!['entradas', 'modelos'].includes(x.name)) anda(p); }
    else if (/\.(mjs|cjs|js|sh)$/.test(x.name) && !/^teste-/.test(x.name) && x.name !== 'endereco-de-post.cjs') codigo.push(p); } };
  anda(K);
  const REGEX_PROPRIA = /status\(\?:es\)|\\\/status\\\/|urn:li:\(\?:/;
  const proprias = codigo.filter((f) => REGEX_PROPRIA.test(le(f))).map((f) => path.relative(K, f).split(path.sep).join('/'));
  checa(proprias.length === 0 && REGEX_PROPRIA.test(String.raw`/https?:\/\/(?:www\.)?x\.com\/\w+\/status\/(\d+)/`),
    'nenhum outro script da skill tem regex própria de endereço de post (e a conferência pega uma regex de status escrita à mão)', proprias.join(', '));
  // ponta a ponta: o escritor dos textos limpa toda forma
  const Pa = captura();
  const dt = new Date((segundosUTC(TRIADO) + 60) * 1000).toISOString();
  const corpo = 'Post de teste citando outros posts: ' + Object.values(FORMAS).join(' e ') + ' para provar a limpeza.';
  fs.writeFileSync(path.join(Pa, 'consolidado.json'), JSON.stringify([{ id: '9999999999999999995', dt, kind: 'post', corpo, imgs: [], videos: [], fio: [], metricas: null, integral: true }]));
  roda('escreve-textos.mjs', ['--consolidado', path.join(Pa, 'consolidado.json'), '--escreve']);
  const ft = path.join(Pa, 'textos', '9999999999999999995.md');
  const tf = fs.existsSync(ft) ? le(ft) : '';
  checa(tf.length > 0 && enderecosDePost(tf).length === 0 && tf.includes('post ' + ID), 'o escreve-textos.mjs grava o texto sem nenhuma das formas (vira "post <id>")', enderecosDePost(tf).slice(0, 2).join(', '));
}

console.log('\n=== 11. a fronteira da janela, pelo comportamento do prepara --lotes e do consolida ===');
{
  const tri = segundosUTC(TRIADO);
  const iso = (s, ms = 0) => new Date(s * 1000 + ms).toISOString();
  // tres posts originais: na fronteira exata (.000Z), no mesmo segundo com milissegundos (.096Z), um segundo depois
  const itens = [['9000000000000000001', iso(tri)], ['9000000000000000002', iso(tri, 96)], ['9000000000000000003', iso(tri + 1)]]
    .map(([id, dt]) => ({ id, dt, corpo: ['post de teste da fronteira com texto bastante para não cair em nenhum corte de tamanho'], imgs: [], reply: false }));
  // devolve o que esta errado (vazio = os dois respeitam a fronteira)
  const provaFronteira = (cap) => {
    const erros = [];
    const P = captura();
    fs.writeFileSync(path.join(P, 'enum-busca.json'), JSON.stringify(itens));
    const r = roda('prepara.mjs', [P, '--lotes'], cap);
    const lote = path.join(P, 'lotes', 'lote-01.js');
    const ids = fs.existsSync(lote) ? (le(lote).match(/900000000000000000\d/g) || []) : [];
    if (r.rc !== 0 || ids.join() !== '9000000000000000003') erros.push(`prepara --lotes abriu [${ids.join(', ')}]`);
    for (const extra of [[], ['--desde', TRIADO]]) {
      const rc = roda('consolida.mjs', [P, ...extra], cap);
      const cons = fs.existsSync(path.join(P, 'consolidado.json')) ? JSON.parse(le(path.join(P, 'consolidado.json'))).map((x) => x.id) : [];
      if (rc.rc !== 0 || cons.join() !== '9000000000000000003' || !rc.out.includes(isoSegundos(tri + 1))) erros.push(`consolida ${extra.join(' ') || '(padrão)'} ficou com [${cons.join(', ')}]`);
      fs.rmSync(path.join(P, 'consolidado.json'), { force: true });
    }
    return erros;
  };
  const real = provaFronteira(esqueleto().cap);
  checa(real.length === 0, 'o post exatamente na fronteira (.000Z e .096Z) fica FORA do prepara --lotes e do consolida (padrão e --desde); o de um segundo depois entra', real.join('; '));
  const mutantes = {
    'prepara com >= (fronteira inclusiva)': ['captura/prepara.mjs', 'const naJanela = (dt) => dentroDaJanela(dt, DESDE_ISO);', 'const naJanela = (dt) => segundosUTC(dt) >= DESDE_S;'],
    'prepara em milissegundos': ['captura/prepara.mjs', 'const naJanela = (dt) => dentroDaJanela(dt, DESDE_ISO);', 'const naJanela = (dt) => Date.parse(dt) > DESDE_MS;'],
    'consolida com <': ['captura/consolida.mjs', 'segundosUTC(dt) <= DESDE_S', 'segundosUTC(dt) < DESDE_S'],
    'janela.mjs com >=': ['captura/janela.mjs', 'segundosUTC(data) > segundosUTC(triadoAte)', 'segundosUTC(data) >= segundosUTC(triadoAte)'],
  };
  for (const [nome, [rel, de, para]] of Object.entries(mutantes)) {
    const m = esqueleto();
    checa(m.muda(rel, de, para) && provaFronteira(m.cap).length > 0, `mutante "${nome}": a prova da fronteira reprova`);
  }
}

console.log('\n=== 12. a triagem marca os textos da captura, nos quatro destinos ===');
{
  const provaTriagem = (cap) => {
    const erros = [];
    const P = captura();
    fs.mkdirSync(path.join(P, 'textos'), { recursive: true });
    for (const c of ['101', '102', '103', '104', 'artigo-de-blog']) fs.writeFileSync(path.join(P, 'textos', c + '.md'), `---\nid: ${c}\ntriagem: pendente\n---\ncorpo\n`);
    fs.writeFileSync(path.join(P, 'triagem.json'), JSON.stringify({ principio: { 101: 'A new principle', 'artigo-de-blog': 'Another new one' }, coberto: { 102: 'An old principle' }, fora_do_assunto: ['103'], sem_principio: ['104'] }));
    const r = roda('marca-triagem.mjs', [path.join(P, 'triagem.json'), '--escreve'], cap);
    const tri = (c) => (le(path.join(P, 'textos', c + '.md')).match(/^triagem: (.*)$/m) || [, ''])[1];
    if (r.rc !== 0) erros.push('marca-triagem falhou: ' + r.out.trim().slice(0, 80));
    if (tri('101') !== '"princípio: A new principle"' || tri('artigo-de-blog') !== '"princípio: Another new one"') erros.push(`principio: ${tri('101')} / ${tri('artigo-de-blog')}`);
    if (!/^"coberto por: An old principle"$/.test(tri('102'))) erros.push(`coberto: ${tri('102')}`);
    if (!/fora do assunto/.test(tri('103')) || !/sem principio/.test(tri('104'))) erros.push('fora do assunto / sem principio');
    fs.writeFileSync(path.join(P, 'triagem2.json'), JSON.stringify({ destino_inventado: ['101'] }));
    if (roda('marca-triagem.mjs', [path.join(P, 'triagem2.json'), '--escreve'], cap).rc === 0) erros.push('destino desconhecido aceito');
    return erros;
  };
  const real = provaTriagem(esqueleto().cap);
  checa(real.length === 0, 'marca-triagem.mjs marca princípio (por id ou por nome de texto), coberto, fora do assunto e sem princípio, e recusa destino desconhecido', real.join('; '));
  const m = esqueleto();
  checa(m.muda('captura/marca-triagem.mjs', 'motivos.set(c, PREFIXO_PRINCIPIO + titulo);', ';') && provaTriagem(m.cap).length > 0,
    'mutante sem o destino princípio: a prova reprova');
}

console.log('\n=== 13. um decodificador de snowflake e um fuso, lidos de um lugar só ===');
{
  // o numero da epoca do X aparece so no janela.mjs (codigo) e no atualizar.md (a formula ensinada), iguais
  const lugares = [];
  const anda = (d) => { for (const x of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, x.name);
    if (x.isDirectory()) { if (!['assets'].includes(x.name)) anda(p); }
    else if (/\.(mjs|cjs|js|sh|md|json)$/.test(x.name) && x.name !== 'teste-captura.mjs' && le(p).includes(String(EPOCA_X))) lugares.push(path.relative(S, p).split(path.sep).join('/')); } };
  anda(S);
  checa(lugares.sort().join() === ['_local/captura/janela.mjs', 'atualizar.md'].join(), 'a época do snowflake mora só no janela.mjs e na fórmula do atualizar.md', lugares.join(', '));
  checa(/\+ 1288834974657n\)/.test(roteiro) && String(EPOCA_X) === '1288834974657', 'a fórmula do roteiro usa o mesmo número');
  const codigo = ['captura/escreve-textos.mjs', 'captura/pasta.mjs', 'captura/prepara.mjs', 'captura/consolida.mjs', 'captura/fontes.mjs'].filter((f) => /3600e3|3 \* 3600|-03:00/.test(le(path.join(K, f))));
  checa(codigo.length === 0, 'nenhum script fixa o fuso de Brasília (3600e3, -03:00): todos leem o cobertura.json', codigo.join(', '));
  checa(dataLocal(Date.parse('2026-10-03T02:30:00Z'), '-03:00') === '2026-10-02' && dataLocal(Date.parse('2026-10-03T02:30:00Z'), '+00:00') === '2026-10-03'
    && carimboLocal(Date.parse('2026-10-03T20:15:00Z'), '+05:30') === '20261004-0145', 'dataLocal e carimboLocal respeitam o fuso dado (-03:00, +00:00, +05:30)');
  let invalido = false; try { deslocamentoMs('BRT'); } catch { invalido = true; }
  checa(invalido && JSON.parse(le(path.join(K, 'cobertura.json'))).fuso === '-03:00', 'fuso fora do formato ±HH:MM é recusado, e o cobertura.json declara -03:00');
  // o escreve-textos grava a data de captura no fuso do cobertura.json do esqueleto: um fuso cuja
  // data HOJE difere da de Brasilia (+14:00 ou -11:00, conforme a hora), senao o teste nao distingue
  const FUSO = ['+14:00', '-11:00'].find((z) => dataLocal(Date.now(), z) !== dataLocal(Date.now(), '-03:00'));
  const e = esqueleto({ cobertura: { fuso: FUSO, fontes: [FONTE_X] } });
  const Pf = captura();
  fs.writeFileSync(path.join(Pf, 'consolidado.json'), JSON.stringify([{ id: '9999999999999999996', dt: new Date().toISOString(), kind: 'post', corpo: 'Post de teste do fuso, com texto suficiente para virar texto de captura sem corte.', imgs: [], videos: [], fio: [], metricas: null, integral: true }]));
  const antes = dataLocal(Date.now(), FUSO);
  roda('escreve-textos.mjs', ['--consolidado', path.join(Pf, 'consolidado.json'), '--escreve'], e.cap);
  const depois = dataLocal(Date.now(), FUSO);
  const f = path.join(Pf, 'textos', '9999999999999999996.md');
  const datas = fs.existsSync(f) ? (le(f).match(/Capturado em (\d{4}-\d{2}-\d{2})/g) || []) : [];
  checa(datas.length > 0 && datas.every((d) => d.endsWith(antes) || d.endsWith(depois)), `o escreve-textos.mjs grava a data de captura no fuso do cobertura.json (${FUSO} no esqueleto, data diferente da de Brasília)`, datas.join(', '));
}

console.log('\n' + '='.repeat(60));
console.log(falhou === 0 ? `TUDO CERTO — ${passou} conferências de captura, 0 falha` : `REPROVADO — ${falhou} falha(s) em ${passou + falhou}`);
fs.rmSync(TMP, { recursive: true, force: true });
process.exit(falhou === 0 ? 0 : 1);
