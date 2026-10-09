// Prova o maquinário de captura sem navegador: a regra da fronteira, o "nada novo", o nome único
// da captura, o guardador do bruto (nunca sobrescreve, troca endereço de post), a saída das imagens
// fora da skill e os quadros de post com mais de um vídeo. Cada caso diz o que esperava e o que viu.
//
// Uso: node .claude/skills/design-de-produto/scripts/teste-captura.mjs

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SKILL = path.resolve(AQUI, '..');
const CAP = path.join(SKILL, '_local', 'captura');
const J = await import(pathToFileURL(path.join(CAP, 'janela.mjs')).href);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'teste-captura-'));
// roda um script do maquinário que mora em <dirCap> (o da skill, ou o de uma cópia com referência de exemplo)
const rodaEm = (dirCap) => (script, args, cwd) => {
  const env = { ...process.env }; delete env.NODE_TEST_CONTEXT;
  const r = spawnSync(process.execPath, [path.join(dirCap, script), ...args], { encoding: 'utf8', env, cwd });
  return { codigo: r.status, saida: (r.stdout || '') + (r.stderr || '') };
};
const roda = rodaEm(CAP);
const pasta = (nome, arquivos) => { const p = path.join(TMP, nome); fs.mkdirSync(p, { recursive: true }); for (const [n, c] of Object.entries(arquivos)) fs.writeFileSync(path.join(p, n), typeof c === 'string' ? c : JSON.stringify(c)); return p; };
const resultados = [];
const lerJSON = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } };
const caso = (nome, ok, visto) => { resultados.push(ok); console.log(`${ok ? 'ok    ' : 'FALHOU'}  ${nome}${ok ? '' : '  -> ' + visto}`); };
// a skill vem sem referência nenhuma: os casos que precisam de uma rodam numa cópia do maquinário
// (_local/captura, escreve-fontes.mjs e o cobertura.json) com a referência de exemplo
const REF_EX = { exemplo: { nome: 'Perfil de exemplo', triado_ate: '2026-10-03T03:00:01Z', ate: null } };
const REF_PASTA = JSON.stringify({ handle: 'exemplo' });
const copiaComReferencia = (nome, extra = {}) => {
  const L = path.join(TMP, nome, '_local');
  fs.mkdirSync(L, { recursive: true });
  fs.cpSync(CAP, path.join(L, 'captura'), { recursive: true });
  fs.copyFileSync(path.join(SKILL, '_local', 'escreve-fontes.mjs'), path.join(L, 'escreve-fontes.mjs'));
  const cob = lerJSON(path.join(SKILL, '_local', 'cobertura.json'));
  fs.writeFileSync(path.join(L, 'cobertura.json'), JSON.stringify({ ...cob, referencias: REF_EX, ...extra }));
  return L;
};

// 1. uma regra de tempo: segundos inteiros UTC, número
{
  const dt = '2026-10-03T03:00:01.000Z';
  caso('snowflake com milissegundos e datetime do X dão o mesmo segundo', J.segDoId('2106217679560355893') === J.seg(dt), `${J.segDoId('2106217679560355893')} x ${J.seg(dt)}`);
  caso('id da captura é o triado_ate compacto', J.idCaptura(J.seg(dt)) === '2026-10-03T030001Z', J.idCaptura(J.seg(dt)));
  caso('duas capturas no mesmo dia têm ids diferentes', J.idCaptura(J.seg('2026-10-03T04:43:16Z')) !== J.idCaptura(J.seg(dt)), 'ids iguais');
}

// 2. fronteira exclusiva no consolida.mjs (post no segundo da fronteira fica fora, com ou sem ms)
{
  const p = pasta('fronteira', {
    'referencia.json': REF_PASTA,
    'enum-busca.json': [
      { id: '900000000000000001', dt: '2026-10-03T03:00:01.000Z', reply: false, imgs: [], videos: [], corpo: ['fronteira'] },
      { id: '900000000000000002', dt: '2026-10-03T03:00:01.700Z', reply: false, imgs: [], videos: [], corpo: ['mesmo segundo com ms'] },
      { id: '900000000000000003', dt: '2026-10-03T03:00:02.000Z', reply: false, imgs: [], videos: [], corpo: ['um segundo depois'] },
    ],
  });
  const r = roda('consolida.mjs', [p, '--desde', '2026-10-03T03:00:01Z']);
  const ids = (lerJSON(path.join(p, 'consolidado.json')) || []).map((x) => x.id);
  caso('consolida: só entra o post estritamente depois da fronteira', ids.length === 1 && ids[0] === '900000000000000003', JSON.stringify(ids) + ' ' + r.saida.slice(-200));
  const c = lerJSON(path.join(p, 'captura.json')) || {};
  caso('consolida grava captura.json com o id e a referência', c.id === '2026-10-03T030002Z' && c.referencia === 'exemplo' && c.triado_ate === '2026-10-03T03:00:02Z' && !c.nada_novo, JSON.stringify(c));
}

// 3. nada novo: o consolida e o roteiro dizem a mesma coisa (não mexer no triado_ate)
{
  const p = pasta('nada-novo', { 'referencia.json': REF_PASTA, 'enum-busca.json': [{ id: '900000000000000009', dt: '2026-10-01T00:00:00.000Z', reply: false, imgs: [], videos: [], corpo: ['velho'] }] });
  const r = roda('consolida.mjs', [p, '--desde', '2026-10-03T03:00:01Z']);
  const c = lerJSON(path.join(p, 'captura.json')) || {};
  caso('consolida sem nada novo: captura.json nada_novo e triado_ate igual ao de entrada', c.nada_novo === true && c.id === null && c.triado_ate === '2026-10-03T03:00:01Z', JSON.stringify(c));
  caso('consolida sem nada novo manda NAO mexer no cobertura.json', /NAO mexer no cobertura\.json/.test(r.saida), r.saida.slice(-200));
  const roteiro = fs.readFileSync(path.join(SKILL, 'atualizar.md'), 'utf8');
  caso('o roteiro diz a mesma coisa (nada novo: não mexer no triado_ate)', /Nada novo na janela[^\n]*\n?[^\n]*não mexa no `cobertura\.json`/i.test(roteiro), 'frase não achada no atualizar.md');
  const g = roda('guarda-bruto.mjs', [p, '--saida', path.join(TMP, 'bruto-nada')]);
  caso('guarda-bruto recusa captura sem nada novo', g.codigo === 1 && /RECUSADO/.test(g.saida), g.saida);
}

// 4. guarda-bruto: nome da captura, troca endereço de post, nunca sobrescreve
{
  const X = ['x', 'com'].join('.'), ST = ['sta', 'tus'].join('');
  const p = pasta('bruto', {
    'captura.json': { id: '2026-10-03T044316Z', de: '2026-10-03T03:00:01Z', triado_ate: '2026-10-03T04:43:16Z', nada_novo: false },
    'consolidado.json': [{ id: '1', corpo: `ver https://${X}/exemplo/${ST}/2106217679560355893 e ${X}/exemplo/st…` }],
    'descartadas-menos-60.json': ['2'],
  });
  const dest = path.join(TMP, 'bruto-dest');
  const g1 = roda('guarda-bruto.mjs', [p, '--saida', dest]);
  const arq = path.join(dest, 'consolidado-2026-10-03T044316Z.json');
  const t = fs.existsSync(arq) ? fs.readFileSync(arq, 'utf8') : '';
  caso('guarda-bruto grava com o id da captura no nome', g1.codigo === 0 && fs.existsSync(arq) && fs.existsSync(path.join(dest, 'descartadas-menos-60-2026-10-03T044316Z.json')), g1.saida);
  caso('guarda-bruto troca todo endereço de post (inteiro e encurtado)', !new RegExp(`${X.replace('.', '\\.')}/\\w+/s`).test(t) && (t.match(/\(link de post\)/g) || []).length === 2, t);
  fs.writeFileSync(arq, 'MARCA');
  const g2 = roda('guarda-bruto.mjs', [p, '--saida', dest]);
  caso('guarda-bruto nunca sobrescreve', g2.codigo === 1 && fs.readFileSync(arq, 'utf8') === 'MARCA', g2.saida);
}

// 5. imagens e quadros: saída padrão na pasta da captura; dentro da skill é recusado
{
  const p = pasta('imgs', { 'imagens.tsv': '' });
  const b1 = roda('baixa-imagens.mjs', [p]);
  caso('baixa-imagens grava por padrão em <pasta>/imagens', b1.codigo === 0 && fs.existsSync(path.join(p, 'imagens')) && !fs.existsSync(path.join(SKILL, '_local', 'imagens')), b1.saida);
  const b2 = roda('baixa-imagens.mjs', [p, '--saida', path.join(SKILL, '_local', 'imagens-teste')]);
  caso('baixa-imagens recusa saída dentro da skill', b2.codigo === 1 && /RECUSADO/.test(b2.saida) && !fs.existsSync(path.join(SKILL, '_local', 'imagens-teste')), b2.saida);
  const jpg = 'data:image/jpeg;base64,' + Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0xd9]).toString('base64');
  const q = (t) => ({ t, dados: jpg });
  const pv = pasta('videos', { 'quadros-01.json': [{ id: '777', erro: null, videos: [{ n: 1, duracao: 10, largura: 16, altura: 9, quadros: [q(1), q(5), q(8)] }, { n: 2, duracao: 20, largura: 16, altura: 9, quadros: [q(3), q(10), q(17)] }] }] });
  const g = roda('grava-quadros.mjs', [pv]);
  const esperados = [1, 2].flatMap((n) => [1, 2, 3].map((k) => `777__v${n}-q${k}.jpg`));
  const faltam = esperados.filter((e) => !fs.existsSync(path.join(pv, 'imagens', e)));
  caso('grava-quadros guarda os quadros de TODOS os vídeos do post', g.codigo === 0 && !faltam.length, faltam.join(', ') + ' ' + g.saida);
  const g2 = roda('grava-quadros.mjs', [pv, '--saida', path.join(SKILL, 'biblioteca', 'galeria', 'teste')]);
  caso('grava-quadros recusa saída dentro da skill', g2.codigo === 1 && !fs.existsSync(path.join(SKILL, 'biblioteca', 'galeria', 'teste')), g2.saida);
}

// 6. os trechos de navegador usam a mesma regra (número, não texto)
{
  const t = ['busca.js', 'respostas.js', 'artigos.js'].map((n) => fs.readFileSync(path.join(CAP, 'modelos', n), 'utf8')).join('\n');
  caso('nenhum trecho de navegador compara instante como texto', !/maisVelho < DESDE\b[^;]*'|< ?'__DESDE__'|'__DESDE__'/.test(t) && /__DESDE_SEG__/.test(t), 'achei comparação por texto ou falta __DESDE_SEG__');
  const art = fs.readFileSync(path.join(CAP, 'modelos', 'artigo-texto.js'), 'utf8');
  caso('o trecho de artigo é gerado com __ID__ e roda por browser_run_code_unsafe', /'__ID__'/.test(art) && /^async \(page\)/.test(art.trim()) && !/<id>'/.test(art), 'artigo-texto.js fora do formato');
}

// 7. download pela regra de imagem.mjs (fetch falso: nada sai para a rede)
{
  const I = await import(pathToFileURL(path.join(CAP, 'imagem.mjs')).href);
  const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46]);
  const PNGB = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
  const resposta = (buf, extra = {}) => ({ ok: true, status: 200, redirected: false, arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length), ...extra });
  let chamadas = 0, opcoes = null;
  const falso = (buf, extra) => async (url, op) => { chamadas++; opcoes = op; return resposta(buf, extra); };
  let r = await I.baixar('https://evil.example.com/media/x.jpg', { buscar: falso(JPEG) });
  caso('download recusa origem fora da lista (sem nem chamar a rede)', !r.ok && /fora da lista/.test(r.motivo) && chamadas === 0, JSON.stringify(r) + ' chamadas=' + chamadas);
  for (const u of ['http://pbs.twimg.com/media/x.jpg', 'https://pbs.twimg.com.evil.com/media/x.jpg', 'https://pbs.twimg.com/profile_images/x.jpg', 'https://user@pbs.twimg.com/media/x.jpg']) {
    r = await I.baixar(u, { buscar: falso(JPEG) });
    caso(`download recusa ${u}`, !r.ok, JSON.stringify(r));
  }
  r = await I.baixar('https://pbs.twimg.com/media/ABC?format=jpg&name=orig', { buscar: falso(JPEG) });
  caso('download pede redirect: "error"', r.ok && opcoes && opcoes.redirect === 'error', JSON.stringify(opcoes));
  r = await I.baixar('https://pbs.twimg.com/media/ABC?format=jpg&name=orig', { buscar: async () => { throw new TypeError('fetch failed: redirect mode is set to error'); } });
  caso('download recusa redirecionamento (o fetch falha com redirect: "error")', !r.ok && /redirecionamento|falha/.test(r.motivo), JSON.stringify(r));
  r = await I.baixar('https://pbs.twimg.com/media/ABC', { buscar: falso(JPEG, { redirected: true }) });
  caso('download recusa resposta marcada como redirecionada', !r.ok && /redirecionamento/.test(r.motivo), JSON.stringify(r));
  r = await I.baixar('https://pbs.twimg.com/media/ABC', { buscar: falso(Buffer.from('<!doctype html><html>erro</html>')) });
  caso('download recusa assinatura que não é JPEG nem PNG', !r.ok && /assinatura/.test(r.motivo), JSON.stringify(r));
  r = await I.baixar('https://media.licdn.com/dms/image/x', { buscar: falso(PNGB) });
  caso('download dá a extensão pela assinatura (PNG -> png)', r.ok && r.ext === 'png', JSON.stringify(r));
  const t = ['busca.js', 'respostas.js', 'permalink-lote.js'].map((n) => fs.readFileSync(path.join(CAP, 'modelos', n), 'utf8')).join('\n');
  caso('os seletores de imagem são ancorados (src^=), nunca substring (src*=)', !/src\*=/.test(t) && /src\^="https:\/\/pbs\.twimg\.com\/media\/"/.test(t), 'achei src*= ou falta src^=');
  const fontesImg = ['baixa-imagens.mjs', 'grava-quadros.mjs', 'cataloga.mjs'].map((n) => fs.readFileSync(path.join(CAP, n), 'utf8'));
  caso('todo script que grava imagem usa a regra de imagem.mjs', fontesImg.every((x) => /from '\.\/imagem\.mjs'/.test(x)) && /extensaoPelaAssinatura/.test(fs.readFileSync(path.join(SKILL, 'scripts', 'confere-biblioteca.mjs'), 'utf8')), 'algum script grava imagem sem imagem.mjs');
}

// 8. a pasta da captura vem de um ponteiro, não de variável de shell
{
  const raiz = path.join(TMP, 'raiz'); fs.mkdirSync(raiz);
  const rodaR = rodaEm(path.join(copiaComReferencia('ponteiro'), 'captura'));
  const sem = rodaR('prepara.mjs', ['--nova'], raiz);
  caso('prepara.mjs --nova sem --ref para e diz o que fazer', sem.codigo === 1 && /--ref <handle>/.test(sem.saida) && !fs.existsSync(path.join(raiz, 'rascunho')), sem.saida);
  const fora = rodaR('prepara.mjs', ['--nova', '--ref', 'outro'], raiz);
  caso('prepara.mjs --nova recusa referência fora do cobertura.json', fora.codigo === 1 && /referencias/.test(fora.saida) && !fs.existsSync(path.join(raiz, 'rascunho')), fora.saida);
  const n = rodaR('prepara.mjs', ['--nova', '--ref', 'exemplo'], raiz);
  const ponteiro = path.join(raiz, 'rascunho', 'captura-design-de-produto.txt');
  const p = fs.existsSync(ponteiro) ? fs.readFileSync(ponteiro, 'utf8').trim() : '';
  caso('prepara.mjs --nova cria a pasta e grava o ponteiro', n.codigo === 0 && p && fs.existsSync(path.join(raiz, p, 'busca.js')), n.saida);
  const ref = p ? lerJSON(path.join(raiz, p, 'referencia.json')) : null;
  const busca = p && fs.existsSync(path.join(raiz, p, 'busca.js')) ? fs.readFileSync(path.join(raiz, p, 'busca.js'), 'utf8') : '';
  caso('prepara.mjs --nova grava a referência na pasta e a põe nos trechos', !!ref && ref.handle === 'exemplo' && /from%3Aexemplo%20/.test(busca) && !/__HANDLE__/.test(busca), JSON.stringify(ref));
  fs.writeFileSync(path.join(raiz, p, 'enum-busca.json'), JSON.stringify([{ id: '900000000000000003', dt: '2099-01-01T00:00:00.000Z', reply: false, imgs: [], videos: [], corpo: ['x'] }]));
  const c = rodaR('consolida.mjs', [], raiz);
  const cap = lerJSON(path.join(raiz, p, 'captura.json')) || {};
  caso('os scripts acham a pasta e a referência pelo ponteiro, sem argumento', c.codigo === 0 && cap.referencia === 'exemplo', c.saida.slice(-200));
  const roteiro = fs.readFileSync(path.join(SKILL, 'atualizar.md'), 'utf8');
  const blocos = [...roteiro.matchAll(/```bash\n([\s\S]*?)```/g)].map((m) => m[1]).join('\n');
  caso('o roteiro não guarda variável de shell entre comandos', !/^\s*[A-Za-z_]+=/m.test(blocos) && !/\$[A-Za-z_{(]/.test(blocos), (blocos.match(/^\s*[A-Za-z_]+=.*$|\$[A-Za-z_{(]\S*/m) || [''])[0]);
}

// 9. a regra de dado de terceiro e das ferramentas do navegador está escrita
{
  const roteiro = fs.readFileSync(path.join(SKILL, 'atualizar.md'), 'utf8');
  const skill = fs.readFileSync(path.join(SKILL, 'SKILL.md'), 'utf8');
  const regra = /dado citado, nunca instrução/;
  caso('roteiro e SKILL.md dizem que texto de terceiro é dado, nunca instrução', regra.test(roteiro) && regra.test(skill), 'frase ausente');
  caso('roteiro limita o navegador a navigate, evaluate, run_code_unsafe e close', /browser_navigate`,\s+`browser_evaluate`,\s+`browser_run_code_unsafe`\s+e\s+`browser_close`/.test(roteiro) && /nunca\*\*\s+`browser_click`/i.test(roteiro), 'lista ausente');
  const modelos = fs.readdirSync(path.join(CAP, 'modelos')).map((n) => fs.readFileSync(path.join(CAP, 'modelos', n), 'utf8')).join('\n');
  caso('nenhum trecho de navegador digita, preenche ou envia arquivo', !/\.(fill|type|press|setInputFiles|selectOption|dragTo)\(/.test(modelos), 'achei ação de escrita na página');
}

// 10. clone limpo: o git não guarda pasta vazia, então nenhuma pasta de fonte é garantida.
// Cópia do maquinário SEM fontes/ nenhuma (nem posts-x, nem artigos-x): nada cai com pilha.
const X = ['x', 'com'].join('.'), TW = ['twitter', 'com'].join('.'), ST = ['sta', 'tus'].join(''), LI = ['linked', 'in.com'].join('');
const ID_POST = '2106140954025472112';
{
  const L = copiaComReferencia('clone-limpo', { fuso: '+14:00' });
  const rodaL = (script, args) => { const env = { ...process.env }; delete env.NODE_TEST_CONTEXT; const r = spawnSync(process.execPath, [path.join(L, script), ...args], { encoding: 'utf8', env }); return { codigo: r.status, saida: (r.stdout || '') + (r.stderr || '') }; };
  const semPilha = (r) => !/ENOENT|\n\s+at /.test(r.saida);
  const p = pasta('limpa', { 'referencia.json': REF_PASTA, 'enum-busca.json': [{ id: '900000000000000003', dt: '2099-01-01T00:00:00.000Z', reply: false, imgs: [], videos: [], corpo: ['post novo'] }], 'triagem.json': {} });
  const c = rodaL(path.join('captura', 'consolida.mjs'), [p]);
  caso('clone limpo: consolida roda sem nenhuma pasta de fonte', c.codigo === 0 && semPilha(c) && (lerJSON(path.join(p, 'consolidado.json')) || []).length === 1, c.saida.slice(-300));
  const l = rodaL(path.join('captura', 'prepara.mjs'), [p, '--lotes']);
  caso('clone limpo: prepara --lotes roda sem nenhuma pasta de fonte', l.codigo === 0 && semPilha(l), l.saida.slice(-300));
  const m = rodaL(path.join('captura', 'marca-triagem.mjs'), [path.join(p, 'triagem.json')]);
  caso('clone limpo: marca-triagem roda sem nenhuma pasta de fonte', semPilha(m), m.saida.slice(-300));
  // escreve-fontes: cria a pasta que falta, troca endereço de post pela regra única e data no fuso do cobertura.json
  fs.writeFileSync(path.join(p, 'consolidado.json'), JSON.stringify([{ id: '900000000000000003', kind: 'post', dt: '2099-01-01T00:00:00.000Z', corpo: `veja https://${X}/i/web/${ST}/${ID_POST} e ${TW}/exemplo/${ST}/${ID_POST}?s=20 e ${X}/exemplo/st…`, imgs: [], videos: [] }]));
  const e = rodaL('escreve-fontes.mjs', ['--consolidado', path.join(p, 'consolidado.json'), '--escreve']);
  const arq = path.join(L, 'fontes', 'posts-x', '900000000000000003.md');
  const t = fs.existsSync(arq) ? fs.readFileSync(arq, 'utf8') : '';
  caso('clone limpo: escreve-fontes cria posts-x/ e grava a fonte', e.codigo === 0 && semPilha(e) && !!t, e.saida.slice(-300));
  caso('escreve-fontes troca i/web/, twitter.com e a forma encurtada', (t.match(/\(link de post\)/g) || []).length === 3 && !t.includes(ID_POST), t.split('\n').find((x) => x.startsWith('veja')) || '(sem corpo)');
  caso('escreve-fontes põe a referência da captura no cabeçalho', /^perfil: @exemplo$/m.test(t) && /^perfil_nome: "Perfil de exemplo"$/m.test(t), (t.match(/^perfil.*$/gm) || ['(sem perfil)']).join(' | '));
  caso('escreve-fontes escreve o dia no fuso do cobertura.json', t.includes(`Capturado em ${J.diaNoFuso(Date.now(), '+14:00')}`), (t.match(/Capturado em \S+/) || ['(nada)'])[0]);
}

// 11. endereço de post: UMA regra (endereco.mjs) para quem troca e para quem confere
{
  const E = await import(pathToFileURL(path.join(CAP, 'endereco.mjs')).href);
  const posts = [
    `https://${X}/exemplo/${ST}/${ID_POST}`,
    `https://${X}/i/web/${ST}/${ID_POST}`,
    `${X}/i/${ST}/${ID_POST}`,
    `https://${TW}/exemplo/${ST}/${ID_POST}/photo/1?s=20`,
    `mobile.${TW}/exemplo/${ST}es/${ID_POST}`,
    `https://www.${X}/exemplo/${ST}/${ID_POST}`,
    `${X}/exemplo/st…`,
    `${X}/exemplo/${ST}/2106…`,
    `https://www.${LI}/posts/fulano_exemplo-activity-7462481974180499456-abcd`,
    `${LI}/feed/update/urn:li:activity:7462481974180499456`,
  ];
  const naoPosts = [`https://${X}/exemplo`, `https://${X}/exemplo/settings/foo`, `https://${X}/search?q=${ST}`, `https://${X}/exemplo/media`];
  const pegou = posts.filter((u) => E.enderecosDePost(`antes ${u} depois`).length === 1);
  caso('endereco.mjs pega toda forma de endereço de post', pegou.length === posts.length, posts.filter((u) => !pegou.includes(u)).join(' | '));
  const falso = naoPosts.filter((u) => E.enderecosDePost(u).length);
  caso('endereco.mjs não pega perfil, configuração, busca nem aba', !falso.length, falso.join(' | '));
  const { texto, trocas } = E.semEnderecoDePost(`{"corpo":"a ${posts[1]} b ${posts[3]}"}`);
  caso('a troca preserva o JSON em volta (para na aspa)', trocas === 2 && JSON.parse(texto).corpo === 'a (link de post) b (link de post)', texto);
  // guarda-bruto com todas as formas
  const p = pasta('bruto-formas', {
    'captura.json': { id: '2026-10-03T050000Z', de: '2026-10-03T03:00:01Z', triado_ate: '2026-10-03T05:00:00Z', nada_novo: false },
    'consolidado.json': [{ id: '1', corpo: posts.join(' e ') + ' e ' + naoPosts.join(' e ') }],
    'descartadas-menos-60.json': [],
  });
  const dest = path.join(TMP, 'bruto-formas-dest');
  const g = roda('guarda-bruto.mjs', [p, '--saida', dest]);
  const t = fs.existsSync(path.join(dest, 'consolidado-2026-10-03T050000Z.json')) ? fs.readFileSync(path.join(dest, 'consolidado-2026-10-03T050000Z.json'), 'utf8') : '';
  caso('guarda-bruto troca toda forma e deixa perfil e configuração', g.codigo === 0 && !E.enderecosDePost(t).length && (t.match(/\(link de post\)/g) || []).length === posts.length && naoPosts.every((u) => t.includes(u)), g.saida + ' ' + t.slice(0, 300));
  const usam = { 'guarda-bruto.mjs': path.join(CAP, 'guarda-bruto.mjs'), 'escreve-fontes.mjs': path.join(SKILL, '_local', 'escreve-fontes.mjs'), 'confere-biblioteca.mjs': path.join(SKILL, 'scripts', 'confere-biblioteca.mjs') };
  const semModulo = Object.entries(usam).filter(([, f]) => { const s = fs.readFileSync(f, 'utf8'); return !/endereco\.mjs/.test(s) || /\(\?:x\|twitter\)\\\.com/.test(s); }).map(([n]) => n);
  caso('quem troca e quem confere importam endereco.mjs, sem regex própria', !semModulo.length, semModulo.join(', '));
}

// 12. snowflake e fuso: uma implementação só, no janela.mjs
{
  const EPOCA = ['1288834', '974657'].join('');
  const todos = [];
  const anda = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (!['vendor', 'node_modules', 'fontes', 'galeria'].includes(e.name)) anda(p); } else if (/\.(mjs|cjs|js|py|md)$/.test(e.name)) todos.push(p); } };
  anda(SKILL);
  const comEpoca = todos.filter((p) => fs.readFileSync(p, 'utf8').includes(EPOCA)).map((p) => path.relative(SKILL, p).split(path.sep).join('/'));
  caso('o decodificador do snowflake mora só no janela.mjs', comEpoca.length === 1 && comEpoca[0] === '_local/captura/janela.mjs', comEpoca.join(', '));
  // padrão montado por pedaços, para este arquivo não se acusar
  const RE_FUSO_FIXO = new RegExp(['36', '00e3|\\* ?36', '00 ?\\* ?1000|getTimezone', 'Offset'].join(''));
  // só código: a documentação pode citar o fuso fixo
  const fusoFixo = todos.filter((p) => /\.(mjs|cjs|js|py)$/.test(p) && RE_FUSO_FIXO.test(fs.readFileSync(p, 'utf8'))).map((p) => path.relative(SKILL, p).split(path.sep).join('/'));
  caso('nenhum script tem fuso escrito à mão', !fusoFixo.length, fusoFixo.join(', '));
  // 2026-10-03T02:30:00Z: em Brasília ainda é dia 2; em UTC já é dia 3
  const id = ((BigInt(Date.parse('2026-10-03T02:30:00Z')) - BigInt(EPOCA)) << 22n).toString();
  caso('o dia do post segue o fuso (-03:00 dá dia 2, +00:00 dá dia 3)', J.diaDoPost(id, '-03:00') === '2026-10-02' && J.diaDoPost(id, '+00:00') === '2026-10-03', `${J.diaDoPost(id, '-03:00')} ${J.diaDoPost(id, '+00:00')}`);
  caso('sem campo fuso vale -03:00', J.fusoDe({}) === '-03:00' && J.fusoDe({ fuso: '+01:00' }) === '+01:00', J.fusoDe({}));
  let recusou = false; try { J.minutosDoFuso('BRT'); } catch { recusou = true; }
  caso('fuso fora do padrão ±HH:MM é recusado', recusou, 'aceitou "BRT"');
  const roteiro = fs.readFileSync(path.join(SKILL, 'atualizar.md'), 'utf8');
  caso('o roteiro diz o campo fuso e o padrão -03:00', /`fuso`/.test(roteiro) && /-03:00/.test(roteiro), 'roteiro sem o campo fuso');
}

fs.rmSync(TMP, { recursive: true, force: true });
const falhas = resultados.filter((x) => !x).length;
console.log(falhas ? `\nFALHOU — ${falhas} de ${resultados.length} casos` : `\nTUDO CERTO — ${resultados.length} casos`);
process.exit(falhas ? 1 : 0);
