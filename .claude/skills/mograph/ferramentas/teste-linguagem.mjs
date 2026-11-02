// O perfil da peça (linguagem.mjs) e as contas do plano que leem a linguagem e o estilo: o tempo
// forte da voz, o respiro depois do pico e a leitura do texto que entra aos poucos.
//   node teste-linguagem.mjs
import { perfilDoPlano, lerLinguagens, lerEstilos } from './linguagem.mjs';
import { conferirPlano } from './plano.mjs';

let testes = 0, falhas = 0;
const ok = (cond, msg) => { testes++; console.log(`${cond ? 'ok  ' : 'FALHA'} ${msg}`); if (!cond) falhas++; };

// os dados de teste: duas linguagens (a voz manda numa, a música na outra) e um estilo
const LING = {
  linguagens: {
    'fala-manda': { tempo: 'voz', dispensa: [] },
    'musica-manda': { tempo: 'musica', dispensa: [] },
    'sem-som': { tempo: 'evento', dispensa: ['tipos-de-efeito'] },
    'doc': { tempo: 'voz', dispensa: [] }
  },
  estilos: { documental: { linguagem: 'doc', dispensa: ['tipos-de-efeito', 'dissolver-com-causa'] } }
};
const ESTILOS = ['motion', 'documental', 'falado-motion'];
const perfil = (p) => perfilDoPlano(p, { linguagens: LING, estilos: ESTILOS });

// ─── 1 · o perfil ───────────────────────────────────────────────────────────
let r = perfil({});
ok(r.linguagem === null && r.estilo === null && r.tempo === null && r.dispensa.size === 0 && r.erros.length === 0, 'sem linguagem nem estilo, o perfil é vazio e sem erro');
r = perfil({ linguagem: 'fala-manda' });
ok(r.linguagem === 'fala-manda' && r.tempo === 'voz', `a linguagem dá o tempo (${r.tempo})`);
r = perfil({ estilo: 'documental' });
ok(r.estilo === 'documental' && r.linguagem === 'doc' && r.tempo === 'voz' && r.dispensa.has('dissolver-com-causa'), 'o estilo documental como texto, sem linguagem, traz a linguagem dele e o que ele dispensa');
r = perfil({ estilo: { id: 'documental', destaque: '--ios-azul', fonte: 'Inter 4' } });
ok(r.estilo === 'documental' && r.linguagem === 'doc' && r.dispensa.has('tipos-de-efeito') && r.erros.length === 0, 'o estilo como objeto lê o id e traz a linguagem e a dispensa dele');
r = perfil({ estilo: { destaque: '--ios-azul' } });
ok(r.estilo === null && r.erros.length === 0, 'o estilo só com o destaque (os planos de hoje) não tem id e não dá erro');
r = perfil({ linguagem: 'sem-som', estilo: 'motion' });
ok(r.dispensa.has('tipos-de-efeito') && !r.dispensa.has('dissolver-com-causa'), 'a dispensa da linguagem vale sem a do estilo');
r = perfil({ linguagem: 'nao-existe' });
ok(r.erros.length === 1 && r.erros[0].regra === 'linguagem' && /fala-manda/.test(r.erros[0].msg) && /musica-manda/.test(r.erros[0].msg), 'a linguagem que não existe dá erro com a lista das que existem');
r = perfil({ estilo: 'cinema-mudo' });
ok(r.erros.length === 1 && r.erros[0].regra === 'estilo' && /documental/.test(r.erros[0].msg), 'o estilo que não existe dá erro com a lista do estilos.md');

// ─── 2 · as fontes de verdade ───────────────────────────────────────────────
const reais = lerLinguagens();
ok(reais.linguagens['spec-ad-locucao']?.tempo === 'voz' && reais.linguagens['interface-de-marca']?.tempo === 'musica' && reais.linguagens['so-efeitos']?.tempo === 'evento', 'o linguagens.json diz quem manda no tempo de cada linguagem');
ok(Object.values(reais.linguagens).every((l) => ['voz', 'musica', 'evento'].includes(l.tempo) && Array.isArray(l.dispensa)), 'toda linguagem tem o tempo e a dispensa');
ok(reais.linguagens['so-efeitos'].dispensa.includes('tipos-de-efeito'), 'o so-efeitos dispensa o piso de tipos de efeito');
ok(reais.estilos?.documental?.dispensa?.includes('dissolver-com-causa') && reais.estilos.documental.dispensa.includes('tipos-de-efeito'), 'o estilo documental dispensa o piso de tipos e aceita o dissolver com causa');
const est = lerEstilos();
ok(est.includes('documental') && est.includes('motion') && est.includes('falado-motion') && est.every((e) => /^[a-z0-9-]+$/.test(e)) && new Set(est).size === est.length && est.length >= 10, `os estilos saem da tabela do estilos.md § 2 (${est.length})`);

// ─── 3 · o plano: o tempo forte da voz ──────────────────────────────────────
const cena = (i, x = {}) => ({ id: `S0${i}`, de: (i - 1) * 4, ate: i * 4, tipo: 'objeto', funcao: 'CONTEXT', camera: 'PARADA', ...x });
const base = (x = {}) => ({ modo: 'puro', destino: 'organico', duracao: 16, fps: 30,
  cenas: [cena(1, { importancia: 1 }), cena(2, { importancia: 2 }), cena(3, { importancia: 3, tempo_forte: 'revela' }), cena(4, { importancia: 1 })], ...x });
const regras = (res) => res.erros.map((e) => `${e.regra}: ${e.msg}`).join(' | ');
const conf = (p) => conferirPlano(p, { linguagens: LING, estilos: ESTILOS });

let p = base({ linguagem: 'fala-manda' });
p.cenas[0].tempo_forte = 'voz';
r = conf(p);
ok(!r.erros.some((e) => e.regra === 'tempo_forte'), `na linguagem em que a voz manda, o tempo forte "voz" passa (${regras(r)})`);
p = base({ linguagem: 'musica-manda' });
p.cenas[0].tempo_forte = 'voz';
r = conf(p);
ok(r.erros.some((e) => e.regra === 'tempo_forte' && /voz/.test(e.msg) && /musica-manda/.test(e.msg)), 'na linguagem em que a música manda, o "voz" reprova e diz a linguagem');
p = base({});
p.cenas[0].tempo_forte = 'voz';
r = conf(p);
ok(r.erros.some((e) => e.regra === 'tempo_forte'), 'sem linguagem, o "voz" reprova (o motion de interface não muda)');
p = base({ linguagem: 'fala-manda' });
p.cenas[2].tempo_forte = 'voz';
p.cenas[0].tempo_forte = 'acento';
r = conf(p);
ok(!r.avisos.some((a) => a.regra === 'tempo_forte'), 'onde a voz manda, o pico com "voz" não avisa');
p = base({ linguagem: 'musica-manda' });
p.cenas[2].tempo_forte = 'acento';
r = conf(p);
ok(r.avisos.some((a) => a.regra === 'tempo_forte'), 'onde a música manda, o pico num acento segue avisando');
p = base({ linguagem: 'nao-existe' });
r = conf(p);
ok(r.erros.some((e) => e.regra === 'linguagem'), 'o conferir do plano reprova a linguagem que não existe');

// ─── 4 · o respiro depois do pico ───────────────────────────────────────────
p = base({ linguagem: 'fala-manda', respiro: [{ de: 9, ate: 10.5, motivo: 'o número assenta antes da virada' }] });
r = conf(p);
ok(!r.erros.some((e) => e.regra === 'respiro'), `o respiro depois do pico (S03 em 8 s), com motivo, passa (${regras(r)})`);
p = base({ respiro: { de: 9, ate: 10.5, motivo: 'um só, como objeto' } });
r = conf(p);
ok(!r.erros.some((e) => e.regra === 'respiro'), 'o respiro como objeto único também vale');
p = base({ respiro: [{ de: 5, ate: 6, motivo: 'antes' }] });
r = conf(p);
ok(r.erros.some((e) => e.regra === 'respiro' && /depois do pico/.test(e.msg)), 'o respiro antes do pico reprova (antes do pico é a vírgula)');
p = base({ respiro: [{ de: 15, ate: 17, motivo: 'fora' }] });
r = conf(p);
ok(r.erros.some((e) => e.regra === 'respiro' && /fora da peça/.test(e.msg)), 'o respiro que passa do fim reprova');
p = base({ respiro: [{ de: 10, ate: 9, motivo: 'ao contrário' }] });
r = conf(p);
ok(r.erros.some((e) => e.regra === 'respiro'), 'o respiro com o fim antes do começo reprova');
p = base({ respiro: [{ de: 9, ate: 10 }] });
r = conf(p);
ok(r.erros.some((e) => e.regra === 'respiro' && /motivo/.test(e.msg)), 'o respiro sem motivo reprova');
p = base({ respiro: [{ de: 9, ate: 10, motivo: 'sem pico' }] });
p.cenas[2].importancia = 2;
r = conf(p);
ok(r.erros.some((e) => e.regra === 'respiro' && /importância 3/.test(e.msg)), 'o respiro sem pico no plano reprova e diz o que falta');
p = base({ virgula: { em: 7.5 } });
r = conf(p);
ok(!r.erros.some((e) => e.regra === 'virgula') && !r.avisos.some((a) => a.regra === 'virgula'), 'a vírgula antes do pico segue como hoje');

// ─── 5 · a leitura do texto que entra aos poucos ────────────────────────────
const CAT = { entradas: [{ id: 'busca-digitada', estado: 'aprovado', texto_progressivo: true }, { id: 'cartao', estado: 'aprovado' }] };
p = base({});
Object.assign(p.cenas[1], { texto_tela: 'dentista perto de mim', componente: 'busca-digitada' });
r = conferirPlano(p, { catalogo: CAT, linguagens: LING, estilos: ESTILOS });
ok(r.erros.some((e) => e.regra === 'leitura' && /texto_inteiro_em/.test(e.msg) && /busca-digitada/.test(e.msg)), 'o componente que digita o texto sem o texto_inteiro_em reprova a leitura');
p.cenas[1].texto_inteiro_em = 7.49;
r = conferirPlano(p, { catalogo: CAT, linguagens: LING, estilos: ESTILOS });
ok(r.erros.some((e) => e.regra === 'leitura' && /0[.,]51/.test(e.msg)), `o texto inteiro só nos últimos 0,51 s reprova (pede 1,74 s): ${regras(r)}`);
p.cenas[1].texto_inteiro_em = 5.5;
r = conferirPlano(p, { catalogo: CAT, linguagens: LING, estilos: ESTILOS });
ok(!r.erros.some((e) => e.regra === 'leitura'), 'o texto inteiro aos 5,5 s numa cena até 8 s dá 2,5 s e passa');
p.cenas[1].texto_inteiro_em = 9;
r = conferirPlano(p, { catalogo: CAT, linguagens: LING, estilos: ESTILOS });
ok(r.erros.some((e) => e.regra === 'leitura' && /fora da cena/.test(e.msg)), 'o texto_inteiro_em fora da cena reprova');
p = base({});
Object.assign(p.cenas[1], { texto_tela: 'dentista perto de mim', componente: 'cartao' });
r = conferirPlano(p, { catalogo: CAT, linguagens: LING, estilos: ESTILOS });
ok(!r.erros.some((e) => e.regra === 'leitura'), 'o componente que entra o texto inteiro segue a conta da cena inteira');
const catalogo = JSON.parse((await import('node:fs')).readFileSync(new URL('../biblioteca/catalogo.json', import.meta.url), 'utf8'));
ok(catalogo.entradas.find((e) => e.id === 'busca-que-se-digita')?.texto_progressivo === true, 'no catálogo, a busca que se digita entra o texto aos poucos');

console.log(`\n# tests ${testes}\n# fail ${falhas}`);
process.exitCode = falhas ? 1 : 0;
