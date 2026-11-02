// A régua do manual (regua-manual.mjs): a cena cita as técnicas do manual que usa, do formato da peça
// ou de comum/, nenhuma recusada; o componente feito à mão diz por quê; o som da peça vem do kit, por
// gesto, com a tecla na digitação. Num manual e num kit de mentira, montados aqui.
//
//   node --test .claude/skills/mograph/ferramentas/teste-regua-manual.test.mjs
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "t.saber !== 'comum' && t.saber !== saber" → "t.saber !== saber" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "t.estado === 'recusado'" → "t.estado === 'recusada'" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "!propostas.includes(id)" → "true" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "id.startsWith('comum.componentes.') && soMao" → "soMao" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "crases(t.realiza).every((r) => r === 'mao')" → "crases(t.realiza).some((r) => r === 'mao')" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "!String(c.motivo_mao || '').trim()" → "!c.motivo_mao" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "nomes.has(base) || nomes.has(base.replace(/-\d+$/, ''))" → "nomes.has(base)" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "if (!g.sons?.length && g.gerado) return null;" → "if (false) return null;" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "if (e.motivo && String(e.motivo).trim()) return null;" → "if (e.motivo) return null;" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "crases(t.som)[0] === 'tecla'" → "crases(t.som).includes('tecla')" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "!perfil.dispensa.has('tipos-de-efeito')" → "true" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "const fora = origens.find((o) => !g.sons.includes(o));" → "const fora = null;" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "if (e.letras && gesto !== 'tecla')" → "if (false)" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "if (manual.has(id)) throw" → "if (false) throw" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "perfil.erros.filter((e) => e.regra === 'estilo')" → "perfil.erros.filter((e) => e.regra === 'x')" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "if (gesto === SILENCIO) return" → "if (false) return" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "if (!e.letras && !arquivo) return" → "if (false) return" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "Object.hasOwn(kit.gestos, gesto) ? kit.gestos[gesto] : null" → "kit.gestos[gesto]" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "if (e.letras || casaNome(arquivo, origens)) return null;" → "return null;" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "!validos.some((e) => e.letras)" → "!gestos.has('tecla')" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "if (!falado && Number(plano.duracao || 0) >= LONGA_S" → "if (Number(plano.duracao || 0) >= LONGA_S" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "Number(plano.duracao || 0) >= LONGA_S" → "Number(plano.duracao || 0) > LONGA_S" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "if (semSom && falado) avisos.push" → "if (semSom) avisos.push" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "if (!efeitos.length) erros.push" → "if (false) erros.push" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "if (som.efeitos != null && !Array.isArray(som.efeitos))" → "if (false)" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "if (plano.cenas != null && !Array.isArray(plano.cenas)) erros.push" → "if (false) erros.push" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "if (!e || typeof e !== 'object' || Array.isArray(e)) return" → "if (!e) return" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "const validos = efeitos.filter((e) => e && typeof e === 'object');" → "const validos = efeitos;" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "!origens.length || origens.some((o) => typeof o !== 'string' || !o.trim())" → "!origens.length" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "origens.some((o) => typeof o !== 'string' || !o.trim())" → "origens.some((o) => !String(o).trim())" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "else if (!plano.cenas?.length) erros.push" → "else if (false) erros.push" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "export const somAoLado = (pasta) => [join(pasta, 'fonte', 'som.json'), join(pasta, 'som.json')]" → "export const somAoLado = (pasta) => [join(pasta, 'som.json')]" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-direcao.mjs · "if (!(Array.isArray(plano.cenas) ? plano.cenas : []).some((c) => Array.isArray(c?.tecnicas))) {" → "if (false) {" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-direcao.mjs · "n += imprimir('manual', { erros: r.erros.map(regra)" → "n += imprimir('manual', { erros: []" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-direcao.mjs · "'cromo', 'estimulo', 'manual'];" → "'cromo', 'estimulo'];" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-direcao.mjs · "semSom: !som && plano.modo === 'falado'" → "semSom: false" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "const limpo = (src) => String(src).trim().replace(/^\.\//, '').replace(/[?#].*$/, '');" → "const limpo = (src) => String(src).trim();" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "MIDIA.test(s) && !/^(_vendor\/|_marca\/|[a-z]+:)/i.test(s)" → "MIDIA.test(s)" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "MIDIA.test(s) && !/^(_vendor\/|_marca\/|[a-z]+:)/i.test(s)" → "!/^(_vendor\/|_marca\/|[a-z]+:)/i.test(s)" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "...html.matchAll(/url\(\s*["']?([^"')]+?)["']?\s*\)/gi)" → "...[]" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "if (plano.ativos != null && !Array.isArray(plano.ativos)) return" → "if (false) return" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "else if (origem === 'codigo') erros.push" → "else if (false) erros.push" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "else if (!ORIGENS.includes(origem)) erros.push" → "else if (false) erros.push" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "else if (origem === 'efeito' && !String(a.motivo ?? '').trim()) erros.push" → "else if (origem === 'efeito' && !a.motivo) erros.push" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "if (imagens) erros.push(...conferirImagens(plano, imagens));" → "if (imagens) erros.push();" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "else avisos.push('a página (index.html) não foi lida" → "else if (false) avisos.push('a página (index.html) não foi lida" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "imagens: imagensAoLado(dirname(arqPlano)) });" → "imagens: null });" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-direcao.mjs · "imagens: imagensAoLado(pasta) });" → "imagens: null });" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "if (!origem) erros.push" → "if (false) erros.push" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "limpo(a?.arquivo ?? '')" → "limpo(a?.arquivo ?? 'ativos/mesa.png')" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "join(pasta, 'fonte', 'som.json'), join" → "join(pasta, 'nada.json'), join" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "if (pede && c.tipo !== pede) erros.push" → "if (false) erros.push" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "if (pede && c.tipo !== pede)" → "if (pede && c.tipo && c.tipo !== pede)" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · ".find(Boolean) || null" → ".pop() || null" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "c.tipo ? `é do tipo ${c.tipo}` : 'não tem tipo'" → "`é do tipo ${c.tipo}`" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "que entram sinalizadas na entrega para a pessoa ver na aprovação da peça" → "que a pessoa vê na prancha ou no teste de energia antes de a peça seguir" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-manual.mjs · "aprovação da peça: ${propostas" → "aprovação da peça:${propostas" · pega
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerManual, conferirManual, imagensDaPagina } from './regua-manual.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const tmp = mkdtempSync(join(tmpdir(), 'regua-manual-'));
const escrever = (arq, txt) => { mkdirSync(dirname(arq), { recursive: true }); writeFileSync(arq, txt); };
const E = (id, { estado = 'proposta', som = 'nenhum', realiza = '`mao`', regra = 'a regra' } = {}) =>
  `### ${id}\n- **estado**: ${estado}\n- **quando**: x\n- **regra**: ${regra}\n- **parâmetros**: —\n- **som**: ${som}\n- **realiza**: ${realiza}\n\n`;

const SKILL = join(tmp, 'skill');
escrever(join(SKILL, 'manual', 'README.md'), '# O manual\n');
escrever(join(SKILL, 'manual', 'comum', 'transicao.md'), '# A transição\n\n' + E('comum.transicao.corte-seco', { estado: 'firme', som: '`whoosh-curto`', realiza: '`motor:transicao=corte`' })
  + E('comum.transicao.desfoque-no-corte', { estado: 'recusado', regra: 'o filtro animado diverge entre renders', realiza: '—' }));
escrever(join(SKILL, 'manual', 'comum', 'componentes.md'), '# Os componentes\n\n' + E('comum.componentes.cartao-de-vidro') + E('comum.componentes.kit-vivo', { realiza: '`ios:conversa`; `mao`', som: 'o gesto de cada peça da interface (`notificacao`, `pop`, `tecla`, `clique`)' })
  + E('comum.componentes.busca', { som: '`tecla` por letra; `clique` no envio', realiza: '`ios:busca`' }));
escrever(join(SKILL, 'manual', 'comum', 'mundo.md'), '# O mundo\n\n' + E('comum.mundo.tres-objetos', { estado: 'firme' }));
escrever(join(SKILL, 'manual', 'filme', 'tratamento.md'), '# O tratamento\n\n' + E('filme.tratamento.lut', { realiza: '`kit:lut`' }));
escrever(join(SKILL, 'manual', 'reel', 'legenda.md'), '# A legenda\n\n' + E('reel.legenda.palavra-chave'));
escrever(join(SKILL, 'kit', 'som.json'), JSON.stringify({ versao: 1, gestos: {
  tecla: { sons: ['lab:interface/type/Thock Key.wav', 'lab:interface/type/chiclet.wav'] },
  clique: { sons: ['lab:select/dot.wav'] },
  'whoosh-curto': { sons: ['box:WOOSH/Woosh 1.wav'] },
  pop: { sons: ['lab:pop/bolha.wav', 'lab:pop/Bolha Dupla.wav'] },
  impacto: { sons: ['box:IMPACTO/hit-3.wav'] },
  plim: { sons: ['lab:plim/a.wav'] },
  drone: { gerado: 'o tonal.py', sons: [] },
  silencio: { gerado: 'o som que se tira', sons: [] },
} }));

const PERFIL_FILME = { estilo: 'comercial', saber: 'filme', erros: [], dispensa: new Set() };
const manual = lerManual(SKILL);
const kit = JSON.parse(readFileSync(join(SKILL, 'kit', 'som.json'), 'utf8'));

const cena = (id, x = {}) => ({ id, de: 0, ate: 3, tecnicas: ['comum.transicao.corte-seco', 'comum.mundo.tres-objetos'], ...x });
const efeitos = (...gestos) => gestos.map((g, k) => ({ id: `e${k}`, arquivo: { 'whoosh-curto': 'woosh-1.wav', pop: 'bolha.wav', impacto: 'hit-3.wav', plim: 'a.wav', clique: 'dot.wav', tecla: 'thock-key.wav' }[g], em: k, gesto: g }));
const SOM_CERTO = { efeitos: efeitos('whoosh-curto', 'pop', 'impacto', 'plim', 'clique') };
const plano = (x = {}) => ({ estilo: 'comercial', modo: 'puro', duracao: 12, cenas: [cena('S01'), cena('S02')], ...x });
const rodar = (p, som = SOM_CERTO, o = {}) => conferirManual(p, { manual, kit, perfil: PERFIL_FILME, som, ...o });
const tem = (lista, re) => lista.some((e) => re.test(e));

test('o manual se lê com o formato de cada entrada pela pasta', () => {
  assert.equal(manual.get('comum.transicao.corte-seco').saber, 'comum');
  assert.equal(manual.get('filme.tratamento.lut').saber, 'filme');
  assert.equal(manual.get('reel.legenda.palavra-chave').saber, 'reel');
  assert.equal(manual.get('comum.transicao.desfoque-no-corte').estado, 'recusado');
  assert.equal(manual.get('comum.componentes.kit-vivo').realiza, '`ios:conversa`; `mao`');
  assert.equal(manual.size, 8);
});

test('o id repetido no manual não se lê calado', () => {
  const dup = join(tmp, 'dup');
  escrever(join(dup, 'manual', 'comum', 'a.md'), E('comum.a.x'));
  escrever(join(dup, 'manual', 'filme', 'b.md'), E('comum.a.x'));
  assert.throws(() => lerManual(dup), /comum\.a\.x.*repetido/);
});

test('a peça certa passa sem erro', () => {
  const r = rodar(plano({ cenas: [cena('S01'), cena('S02', { tecnicas: ['filme.tratamento.lut'] })] }));
  assert.deepEqual(r.erros, []);
});

test('a cena sem técnica, ou com a lista vazia, reprova com o id da cena', () => {
  const r = rodar(plano({ cenas: [cena('S01', { tecnicas: undefined }), cena('S02', { tecnicas: [] })] }));
  assert.ok(tem(r.erros, /S01/) && tem(r.erros, /S02/) && r.erros.length === 2, r.erros.join('\n'));
});

test('o id que não existe, o de outro formato e o recusado reprovam', () => {
  const r = rodar(plano({ cenas: [cena('S01', { tecnicas: ['comum.transicao.nao-existe', 'reel.legenda.palavra-chave', 'comum.transicao.desfoque-no-corte'] })] }));
  assert.ok(tem(r.erros, /nao-existe.*não existe/), r.erros.join('\n'));
  assert.ok(tem(r.erros, /reel\.legenda\.palavra-chave.*reel.*filme/));
  assert.ok(tem(r.erros, /desfoque-no-corte.*recusad.*diverge entre renders/));
  const reel = conferirManual(plano({ estilo: 'motion', cenas: [cena('S01', { tecnicas: ['reel.legenda.palavra-chave', 'filme.tratamento.lut'] })] }), { manual, kit, som: SOM_CERTO, perfil: { estilo: 'motion', saber: 'reel', erros: [], dispensa: new Set() } });
  assert.ok(tem(reel.erros, /filme\.tratamento\.lut.*filme.*reel/) && reel.erros.length === 1, reel.erros.join('\n'));
});

test('as técnicas propostas viram um aviso só, com a lista sem repetir', () => {
  const r = rodar(plano({ cenas: [cena('S01', { tecnicas: ['filme.tratamento.lut', 'comum.transicao.corte-seco'] }), cena('S02', { tecnicas: ['filme.tratamento.lut'] })] }));
  const av = r.avisos.filter((a) => /proposta/.test(a));
  assert.equal(av.length, 1);
  assert.equal(av[0].match(/filme\.tratamento\.lut/g).length, 1);
  assert.ok(!/corte-seco/.test(av[0]), 'a firme não entra no aviso');
});

test('o componente só à mão pede o motivo_mao; o que tem bloco não pede', () => {
  const sem = rodar(plano({ cenas: [cena('S01', { tecnicas: ['comum.componentes.cartao-de-vidro'] })] }));
  assert.ok(tem(sem.erros, /S01.*cartao-de-vidro.*motivo_mao/), sem.erros.join('\n'));
  const branco = rodar(plano({ cenas: [cena('S01', { tecnicas: ['comum.componentes.cartao-de-vidro'], motivo_mao: '   ' })] }));
  assert.equal(branco.erros.length, 1, 'o motivo em branco não é motivo');
  const com = rodar(plano({ cenas: [cena('S01', { tecnicas: ['comum.componentes.cartao-de-vidro'], motivo_mao: 'o vidro da marca não existe no registro' })] }));
  assert.deepEqual(com.erros, []);
  const bloco = rodar(plano({ cenas: [cena('S01', { tecnicas: ['comum.componentes.kit-vivo'] })] }));
  assert.deepEqual(bloco.erros, [], 'o realiza com bloco e mão não pede motivo');
  const outro = rodar(plano({ cenas: [cena('S01', { tecnicas: ['comum.mundo.tres-objetos'] })] }));
  assert.deepEqual(outro.erros, [], 'o que não é componente, só à mão, não pede motivo');
});

test('o efeito sem gesto do kit, ou com arquivo que não é do gesto, reprova; o motivo escrito aceita', () => {
  const r = rodar(plano(), { efeitos: [...SOM_CERTO.efeitos, { id: 'x1', arquivo: 'qualquer.wav', em: 1 }, { id: 'x2', arquivo: 'qualquer.wav', em: 1, gesto: 'buzina' }, { id: 'x3', arquivo: 'bolha.wav', em: 1, gesto: 'impacto' }, { id: 'x4', arquivo: 'outro.wav', em: 2, gesto: 'pop', motivo: 'o estalo da marca, gravado por ele' }, { id: 'x5', arquivo: 'outro.wav', em: 2, gesto: 'pop', motivo: '  ' }] });
  assert.ok(tem(r.erros, /x1.*gesto/) && tem(r.erros, /x2.*buzina/) && tem(r.erros, /x3.*bolha\.wav.*impacto/), r.erros.join('\n'));
  assert.ok(!tem(r.erros, /x4/));
  assert.ok(tem(r.erros, /x5/), 'o motivo em branco não é motivo');
  assert.equal(r.erros.length, 4);
});

test('o nome do arquivo casa com o kit como o ativos.py trazer grava, até com o sufixo de nome novo', () => {
  const r = rodar(plano(), { efeitos: [...SOM_CERTO.efeitos, { id: 't1', arquivo: 'ativos/thock-key.wav', gesto: 'tecla', em: 1 }, { id: 't2', arquivo: 'chiclet-2.wav', gesto: 'tecla', em: 2 }, { id: 'w', arquivo: 'woosh-1-3.wav', gesto: 'whoosh-curto', em: 3 }] });
  assert.deepEqual(r.erros, []);
});

test('a origem do kit vale no lugar do nome, e o letras (nomes fixos) pede a origem', () => {
  const ok = rodar(plano(), { efeitos: [...SOM_CERTO.efeitos, { id: 'l', letras: 'oi', em: 1, origem: ['lab:interface/type/chiclet.wav', 'lab:interface/type/Thock Key.wav'] }] });
  assert.deepEqual(ok.erros, []);
  const semOrigem = rodar(plano(), { efeitos: [...SOM_CERTO.efeitos, { id: 'l', letras: 'oi', em: 1 }] });
  assert.ok(tem(semOrigem.erros, /\bl\b.*origem/), semOrigem.erros.join('\n'));
  const origemErrada = rodar(plano(), { efeitos: [...SOM_CERTO.efeitos, { id: 'l', letras: 'oi', em: 1, origem: 'lab:pop/bolha.wav' }] });
  assert.ok(tem(origemErrada.erros, /bolha\.wav.*tecla/));
  const letrasOutroGesto = rodar(plano(), { efeitos: [...SOM_CERTO.efeitos, { id: 'l', letras: 'oi', em: 1, gesto: 'pop', origem: 'lab:pop/bolha.wav' }] });
  assert.ok(tem(letrasOutroGesto.erros, /letras.*tecla/));
});

test('o gesto gerado (o drone do tonal.py) aceita qualquer arquivo, mas pede um', () => {
  const r = rodar(plano(), { efeitos: [...SOM_CERTO.efeitos, { id: 'd', arquivo: 'drone-la-menor.wav', gesto: 'drone', em: 0 }] });
  assert.deepEqual(r.erros, []);
  const sem = rodar(plano(), { efeitos: [...SOM_CERTO.efeitos, { id: 'd', gesto: 'drone', em: 0 }, { id: 'p', gesto: 'pop', em: 1, arquivo: '  ' }] });
  assert.ok(tem(sem.erros, /\bd\b.*arquivo/) && tem(sem.erros, /\bp\b.*arquivo/) && sem.erros.length === 2, sem.erros.join('\n'));
});

test('o silêncio não é efeito do som.json: com arquivo ou sem, reprova e diz onde ele mora', () => {
  for (const s of [{ id: 's', gesto: 'silencio', em: 2 }, { id: 's', gesto: 'silencio', em: 2, arquivo: 'bolha.wav' }]) {
    const r = rodar(plano(), { efeitos: [...SOM_CERTO.efeitos, s] });
    assert.ok(tem(r.erros, /\bs\b.*silêncio.*trilha/) && r.erros.length === 1, r.erros.join('\n'));
  }
});

test('com a origem, o arquivo é o da origem: a origem certa não cobre o arquivo de outro gesto', () => {
  const certo = rodar(plano(), { efeitos: [...SOM_CERTO.efeitos, { id: 'o', gesto: 'pop', em: 1, arquivo: 'bolha-dupla-2.wav', origem: 'lab:pop/Bolha Dupla.wav' }] });
  assert.deepEqual(certo.erros, []);
  const troca = rodar(plano(), { efeitos: [...SOM_CERTO.efeitos, { id: 'o', gesto: 'pop', em: 1, arquivo: 'hit-3.wav', origem: 'lab:pop/bolha.wav' }] });
  assert.ok(tem(troca.erros, /\bo\b.*hit-3\.wav.*origem/), troca.erros.join('\n'));
});

test('a origem vazia ou que não é texto não passa: em texto, em lista com texto vazio, em lista vazia, em número', () => {
  for (const origem of ['', [''], [], ['lab:pop/bolha.wav', ''], 0, [0]]) {
    const r = rodar(plano(), { efeitos: [...SOM_CERTO.efeitos, { id: 'v', gesto: 'pop', em: 1, arquivo: 'bolha.wav', origem }] });
    assert.ok(tem(r.erros, /\bv\b tem a origem vazia/) && r.erros.length === 1, `${JSON.stringify(origem)}: ${r.erros.join('\n')}`);
    assert.ok(!tem(r.erros, /letras/), 'o efeito que não digita não leva a mensagem do letras');
  }
});

test('a entrada torta reprova com mensagem, sem quebrar: efeitos e cenas que não são lista, gesto do protótipo', () => {
  const objeto = rodar(plano(), { efeitos: { a: 1 } });
  assert.ok(tem(objeto.erros, /efeitos.*lista/), objeto.erros.join('\n'));
  const solto = rodar(plano(), { efeitos: [...SOM_CERTO.efeitos, null, 5, ['x']] });
  assert.equal(solto.erros.filter((e) => /não é objeto/.test(e)).length, 3, solto.erros.join('\n'));
  for (const gesto of ['constructor', 'toString', '__proto__']) {
    const r = rodar(plano(), { efeitos: [...SOM_CERTO.efeitos, { id: 'g', gesto, em: 1, arquivo: 'a.wav' }] });
    assert.ok(tem(r.erros, new RegExp(`g.*${gesto}.*kit`)), r.erros.join('\n'));
  }
  const cenas = rodar(plano({ cenas: { S01: {} } }));
  assert.ok(tem(cenas.erros, /cenas.*lista/), cenas.erros.join('\n'));
});

test('o plano sem cena, ou com a lista vazia, reprova: medir zero é vermelho', () => {
  for (const cenas of [undefined, []]) assert.ok(tem(rodar(plano({ cenas })).erros, /nenhuma cena/), JSON.stringify(cenas));
});

test('o som.json sem nenhum efeito reprova: a peça pura soa', () => {
  for (const som of [{}, { efeitos: [] }]) assert.ok(tem(rodar(plano(), som).erros, /nenhum efeito/));
});

test('a peça que cita a digitação (a tecla é o primeiro gesto do som da técnica) sem o gesto tecla reprova', () => {
  const vivo = plano({ cenas: [cena('S01', { tecnicas: ['comum.componentes.kit-vivo'] })] });
  assert.deepEqual(rodar(vivo).erros, [], 'a tecla numa lista de gestos possíveis não é digitação');
  const p = plano({ cenas: [cena('S01', { tecnicas: ['comum.componentes.busca'] })] });
  assert.ok(tem(rodar(p).erros, /tecla/));
  const umClique = rodar(p, { efeitos: [...SOM_CERTO.efeitos, { id: 't', arquivo: 'chiclet.wav', gesto: 'tecla', em: 1 }] });
  assert.ok(tem(umClique.erros, /letras/), 'uma tecla só não é a tecla por caractere: ' + umClique.erros.join('\n'));
  assert.deepEqual(rodar(p, { efeitos: [...SOM_CERTO.efeitos, { id: 't', letras: 'oi', em: 1, origem: 'lab:interface/type/chiclet.wav' }] }).erros, []);
});

test('menos de 5 gestos numa peça de 10 s ou mais avisa, sem reprovar; a mais curta, a falada, a dispensada e a de 5 gestos não', () => {
  const pouco = { efeitos: efeitos('whoosh-curto', 'pop', 'pop', 'impacto') };
  const r = rodar(plano(), pouco);
  assert.deepEqual(r.erros, []);
  assert.ok(tem(r.avisos, /3 gestos/));
  assert.ok(tem(rodar(plano({ duracao: 10 }), pouco).avisos, /3 gestos/), 'a de 10 s cabe no piso');
  assert.ok(!tem(rodar(plano({ duracao: 9.9 }), pouco).avisos, /gestos/));
  assert.ok(!tem(rodar(plano({ modo: 'falado' }), pouco).avisos, /gestos/), 'no falado o som é da /cortes');
  assert.ok(!tem(rodar(plano(), SOM_CERTO).avisos, /gestos/));
  assert.ok(!tem(rodar(plano(), pouco, { perfil: { ...PERFIL_FILME, dispensa: new Set(['tipos-de-efeito']) } }).avisos, /gestos/));
});

test('sem som.json reprova; o --sem-som só vale no falado (avisa), e no puro reprova', () => {
  assert.ok(tem(rodar(plano(), null).erros, /som não foi conferido/));
  const r = rodar(plano({ modo: 'falado' }), null, { semSom: true });
  assert.deepEqual(r.erros, []);
  assert.ok(tem(r.avisos, /som não foi conferido/));
  const puro = rodar(plano(), null, { semSom: true });
  assert.ok(tem(puro.erros, /--sem-som.*falado/), puro.erros.join('\n'));
});

test('a peça sem formato do manual reprova com os estilos de cada formato, e o erro do perfil passa adiante', () => {
  const r = rodar(plano(), SOM_CERTO, { perfil: { estilo: 'vinheta', saber: null, erros: [], dispensa: new Set() } });
  assert.ok(tem(r.erros, /estilo.*filme: .*comercial.*reel: .*motion/), r.erros.join('\n'));
  const p = rodar(plano(), SOM_CERTO, { perfil: { estilo: null, saber: null, erros: [{ regra: 'estilo', msg: 'o estilo "x" não está no estilos.md' }], dispensa: new Set() } });
  assert.ok(tem(p.erros, /estilos\.md/));
});

const cli = (...a) => spawnSync(process.execPath, [join(AQUI, 'regua-manual.mjs'), ...a], { encoding: 'utf8' });
const direcao = (...a) => spawnSync(process.execPath, [join(AQUI, 'regua-direcao.mjs'), ...a], { encoding: 'utf8' });

test('a régua manual do regua-direcao no falado sem som.json avisa e não reprova; no puro sem som.json, reprova', () => {
  const pasta = join(tmp, 'direcao-falado');
  escrever(join(pasta, 'plano.json'), JSON.stringify({ estilo: 'falado-motion', modo: 'falado', duracao: 30, cenas: [{ id: 'S01', tecnicas: ['comum.transicao.corte-na-curva'] }] }));
  const falado = direcao('manual', pasta);
  assert.equal(falado.status, 0, falado.stdout + falado.stderr);
  assert.match(falado.stdout, /aviso .manual. o som não foi conferido/);
  escrever(join(pasta, 'plano.json'), JSON.stringify({ estilo: 'bumper', modo: 'puro', duracao: 6, cenas: [{ id: 'S01', tecnicas: ['comum.transicao.corte-na-curva'] }] }));
  const puro = direcao('manual', pasta);
  assert.equal(puro.status, 1, puro.stdout + puro.stderr);
  assert.match(puro.stdout, /ERRO {2}.manual. o som não foi conferido/);
});

test('a régua manual do regua-direcao (a que o tudo roda) confere o plano que cita técnica, no manual e no kit da skill', () => {
  const kitReal = JSON.parse(readFileSync(join(AQUI, '..', 'kit', 'som.json'), 'utf8'));
  const ref = kitReal.gestos['whoosh-curto'].sons[0];
  const arquivo = ref.slice(ref.indexOf(':') + 1).split('/').pop().replace(/\.[^.]+$/, '').toLowerCase().replace(/ /g, '-') + '.wav';
  const pasta = join(tmp, 'direcao');
  const certo = { estilo: 'bumper', modo: 'puro', duracao: 6, cenas: [{ id: 'S01', tecnicas: ['comum.transicao.corte-na-curva'] }] };
  escrever(join(pasta, 'plano.json'), JSON.stringify(certo));
  escrever(join(pasta, 'fonte', 'som.json'), JSON.stringify({ efeitos: [{ id: 'w', gesto: 'whoosh-curto', arquivo, em: 0 }] }));
  const verde = direcao('manual', pasta);
  assert.equal(verde.status, 0, verde.stdout + verde.stderr);
  escrever(join(pasta, 'plano.json'), JSON.stringify({ ...certo, cenas: [{ id: 'S01', tecnicas: ['comum.nao.existe'] }] }));
  const r = direcao('manual', pasta);
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /ERRO {2}\[manual\] .*comum\.nao\.existe/);
  escrever(join(pasta, 'plano.json'), JSON.stringify({ ...certo, cenas: [{ id: 'S01' }] }));
  const antigo = direcao('manual', pasta);
  assert.equal(antigo.status, 0, 'o plano de antes do manual (nenhuma cena com tecnicas) não se aplica');
  assert.match(antigo.stdout, /manual: não se aplica/);
});

test('a página se lê pelo src e pelo url(): com aspas ou sem, ./ e ?v no caminho; a marca, o vendor, o áudio, a rede e o data: ficam fora', () => {
  const html = `<img src="./ativos/a.png?v=2"><img src='ativos/b.webp'><div style="background: url(&quot;x&quot;)"></div>
    <style>.c { background: url("ativos/c.jpg"); } .d { background-image: url(ativos/d.mp4#t=1); }</style>
    <img src="_marca/logo/logo.svg"><script src="_vendor/gsap.min.js"></script><audio src="ativos/som.wav"></audio><img src="https://x.com/y.png">
    <img src="data:image/png;base64,AAAA"><img src="ativos/a.png"><video src="ativos/e.webm"></video><img src="ativos/f.svg">`;
  assert.deepEqual(imagensDaPagina(html), ['ativos/a.png', 'ativos/b.webp', 'ativos/c.jpg', 'ativos/d.mp4', 'ativos/e.webm', 'ativos/f.svg']);
});

test('a imagem da página sem origem, com origem codigo ou fora da lista reprova; a recusa do cenário pintado é citada', () => {
  const comAtivos = (ativos) => rodar(plano({ ativos }), SOM_CERTO, { imagens: ['ativos/mesa.png', 'ativos/foto.jpg'] });
  const sem = comAtivos([{ arquivo: 'ativos/foto.jpg', origem: 'foto' }]);
  assert.ok(tem(sem.erros, /ativos\/mesa\.png, sem origem/), sem.erros.join('\n'));
  assert.ok(!tem(sem.erros, /foto\.jpg/), 'a declarada não reprova');
  const pintada = comAtivos([{ arquivo: 'ativos/mesa.png', origem: 'codigo' }, { arquivo: 'ativos/foto.jpg', origem: 'foto' }]);
  assert.ok(tem(pintada.erros, /ativos\/mesa\.png.*comum\.mundo\.cenario-pintado-em-codigo/), pintada.erros.join('\n'));
  const fora = comAtivos([{ arquivo: 'ativos/mesa.png', origem: 'pintura' }, { arquivo: 'ativos/foto.jpg', origem: 'foto' }]);
  assert.ok(tem(fora.erros, /ativos\/mesa\.png.*pintura/), fora.erros.join('\n'));
  assert.equal(rodar(plano(), SOM_CERTO, { imagens: [] }).erros.length, 0, 'a página sem imagem não pede ativos');
  const torto = rodar(plano({ ativos: { 'ativos/mesa.png': 'foto' } }), SOM_CERTO, { imagens: ['ativos/mesa.png'] });
  assert.ok(tem(torto.erros, /ativos do plano não é uma lista/), torto.erros.join('\n'));
  const itemTorto = rodar(plano({ ativos: ['ativos/mesa.png', null, 7, { origem: 'foto' }] }), SOM_CERTO, { imagens: ['ativos/mesa.png'] });
  assert.ok(tem(itemTorto.erros, /ativos\/mesa\.png, sem origem/), 'o item que não é objeto não declara origem');
});

test('o efeito (a camada sem figura) pede o motivo; as origens da lista passam; a declaração que sobra não reprova', () => {
  const imagens = ['ativos/luz.png', 'ativos/fundo.jpg', 'ativos/aparelho.webp', 'ativos/chao.png'];
  const ativos = (luz) => [luz, { arquivo: 'ativos/fundo.jpg', origem: 'gerado' }, { arquivo: './ativos/aparelho.webp', origem: 'produto' },
    { arquivo: 'ativos/chao.png', origem: 'foto' }, { arquivo: 'ativos/sobrou.png', origem: 'codigo' }];
  const semMotivo = rodar(plano({ ativos: ativos({ arquivo: 'ativos/luz.png', origem: 'efeito', motivo: '  ' }) }), SOM_CERTO, { imagens });
  assert.deepEqual(semMotivo.erros.length, 1, semMotivo.erros.join('\n'));
  assert.match(semMotivo.erros[0], /ativos\/luz\.png.*efeito.*motivo/);
  const comMotivo = rodar(plano({ ativos: ativos({ arquivo: 'ativos/luz.png', origem: 'efeito', motivo: 'a luz do abajur, em multiply, sem figura' }) }), SOM_CERTO, { imagens });
  assert.deepEqual(comMotivo.erros, []);
  for (const origem of ['foto', 'video', 'gerado', 'kit', 'material', 'produto', 'captura']) {
    assert.deepEqual(rodar(plano({ ativos: [{ arquivo: 'ativos/x.png', origem }] }), SOM_CERTO, { imagens: ['ativos/x.png'] }).erros, [], origem);
  }
});

test('a recusa do cenário pintado mora no manual da skill, recusada: citá-la numa cena reprova', () => {
  const real = lerManual();
  assert.equal(real.get('comum.mundo.cenario-pintado-em-codigo')?.estado, 'recusado', 'a recusa do cenário pintado mora no manual');
  const citou = conferirManual({ estilo: 'bumper', modo: 'puro', duracao: 6, cenas: [{ id: 'S01', tecnicas: ['comum.mundo.cenario-pintado-em-codigo'] }] },
    { manual: real, kit, perfil: PERFIL_FILME, som: SOM_CERTO, imagens: [] });
  assert.ok(tem(citou.erros, /S01 cita comum\.mundo\.cenario-pintado-em-codigo, que é recusado/), citou.erros.join('\n'));
});

test('sem a página lida, a origem das imagens avisa e não reprova', () => {
  const r = rodar(plano(), SOM_CERTO);
  assert.deepEqual(r.erros, []);
  assert.ok(tem(r.avisos, /index\.html.*imagens não se conferiu/), r.avisos.join('\n'));
  assert.ok(!tem(rodar(plano(), SOM_CERTO, { imagens: [] }).avisos, /imagens/), 'com a página lida, não avisa');
});

test('a régua manual do regua-direcao lê o index.html da peça: a imagem sem origem reprova', () => {
  const kitReal = JSON.parse(readFileSync(join(AQUI, '..', 'kit', 'som.json'), 'utf8'));
  const ref = kitReal.gestos['whoosh-curto'].sons[0];
  const arquivo = ref.slice(ref.indexOf(':') + 1).split('/').pop().replace(/\.[^.]+$/, '').toLowerCase().replace(/ /g, '-') + '.wav';
  const pasta = join(tmp, 'direcao-imagens');
  const certo = { estilo: 'bumper', modo: 'puro', duracao: 6, cenas: [{ id: 'S01', tecnicas: ['comum.transicao.corte-na-curva'] }] };
  escrever(join(pasta, 'plano.json'), JSON.stringify(certo));
  escrever(join(pasta, 'fonte', 'som.json'), JSON.stringify({ efeitos: [{ id: 'w', gesto: 'whoosh-curto', arquivo, em: 0 }] }));
  escrever(join(pasta, 'index.html'), '<img id="mesa" src="ativos/mesa-v6.png" alt="">');
  const r = direcao('manual', pasta);
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /ERRO {2}\[manual\] .*ativos\/mesa-v6\.png/);
  escrever(join(pasta, 'plano.json'), JSON.stringify({ ...certo, ativos: [{ arquivo: 'ativos/mesa-v6.png', origem: 'foto' }] }));
  const verde = direcao('manual', pasta);
  assert.equal(verde.status, 0, verde.stdout + verde.stderr);
});

test('a linha de comando: verde sai 0, vermelho sai 1, plano ilegível e uso errado saem 2', () => {
  const pasta = join(tmp, 'peca');
  escrever(join(pasta, 'plano.json'), JSON.stringify(plano()));
  escrever(join(pasta, 'som.json'), JSON.stringify(SOM_CERTO));
  const verde = cli('conferir', join(pasta, 'plano.json'), '--skill', SKILL);
  assert.equal(verde.status, 0, verde.stdout + verde.stderr);
  escrever(join(pasta, 'outro.json'), JSON.stringify({ efeitos: [] }));
  const vazio = cli('conferir', join(pasta, 'plano.json'), '--skill', SKILL, '--som', join(pasta, 'outro.json'));
  assert.equal(vazio.status, 1, 'o som sem efeito reprova');
  assert.match(vazio.stdout, /nenhum efeito/);
  escrever(join(pasta, 'ruim.json'), JSON.stringify(plano({ cenas: [cena('S01', { tecnicas: [] })] })));
  const r = cli('conferir', join(pasta, 'ruim.json'), '--skill', SKILL);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /S01/);
  escrever(join(pasta, 'quebrado.json'), '{ isto não é json');
  assert.equal(cli('conferir', join(pasta, 'quebrado.json'), '--skill', SKILL).status, 2);
  assert.equal(cli('conferir', join(pasta, 'nao-existe.json'), '--skill', SKILL).status, 2);
  assert.equal(cli('nada').status, 2);
  const sem = cli('conferir', join(pasta, 'plano.json'), '--skill', SKILL, '--som', join(pasta, 'nao-tem.json'));
  assert.equal(sem.status, 2, 'o --som que não existe é uso errado');
  const solta = join(tmp, 'solta');
  escrever(join(solta, 'plano.json'), JSON.stringify(plano()));
  const semSom = cli('conferir', join(solta, 'plano.json'), '--skill', SKILL);
  assert.equal(semSom.status, 1, 'sem som.json ao lado e sem --sem-som reprova');
  assert.equal(cli('conferir', join(solta, 'plano.json'), '--skill', SKILL, '--sem-som').status, 1, 'no puro o --sem-som reprova');
  escrever(join(solta, 'falado.json'), JSON.stringify(plano({ modo: 'falado' })));
  assert.equal(cli('conferir', join(solta, 'falado.json'), '--skill', SKILL, '--sem-som').status, 0);
  escrever(join(solta, 'fonte', 'som.json'), JSON.stringify({ efeitos: [{ id: 'w', arquivo: 'ruim.wav', gesto: 'whoosh-curto', em: 0 }] }));
  const fonte = cli('conferir', join(solta, 'plano.json'), '--skill', SKILL);
  assert.equal(fonte.status, 1, 'o fonte/som.json do lado do plano (o do som-do-puro) se lê sozinho');
  assert.match(fonte.stdout, /ruim\.wav/);
  escrever(join(pasta, 'index.html'), '<img src="ativos/caneca.png">');
  const pagina = cli('conferir', join(pasta, 'plano.json'), '--skill', SKILL);
  assert.equal(pagina.status, 1, 'o index.html do lado do plano se lê sozinho');
  assert.match(pagina.stdout, /ativos\/caneca\.png/);
});

// o tipo de cena: a técnica cujo realiza traz `motor:tipo=<tipo>` só vale na cena desse tipo
const CENAS = join(tmp, 'cenas');
escrever(join(CENAS, 'manual', 'reel', 'cena.md'), '# A cena\n\n' + E('reel.cena.legenda', { estado: 'firme', realiza: '`motor:tipo=legenda`' })
  + E('reel.cena.meia-tela', { estado: 'firme', realiza: '`motor:tipo=meia-tela`' })
  + E('reel.cena.tela-cheia', { estado: 'firme', realiza: '`motor:tipo=tela-cheia`; `motor:texto_tela`' })
  + E('reel.cena.tipo-por-frase', { estado: 'firme', realiza: '`motor:tipo`' })
  + E('reel.cena.zoom-de-enfase', { estado: 'firme', realiza: '`motor:zoom`' }));
const PERFIL_FALADO = { estilo: 'falado-motion', saber: 'reel', erros: [], dispensa: new Set() };
const falado = (cenas, m = lerManual(CENAS)) => conferirManual({ estilo: 'falado-motion', modo: 'falado', duracao: 20, cenas }, { manual: m, kit, perfil: PERFIL_FALADO, semSom: true, imagens: [] });
const doTipo = (erros) => erros.filter((e) => /só vale na cena de tipo/.test(e));

test('a técnica de tipo só vale na cena do tipo: a legenda com a tela cheia reprova, e a cena sem tipo também', () => {
  const errado = falado([{ id: 'S01', tipo: 'legenda', tecnicas: ['reel.cena.tela-cheia'] }]);
  assert.deepEqual(errado.erros, ['a cena S01 é do tipo legenda e cita reel.cena.tela-cheia, que só vale na cena de tipo tela-cheia']);
  const certo = falado([{ id: 'S01', tipo: 'meia-tela', tecnicas: ['reel.cena.meia-tela', 'reel.cena.zoom-de-enfase'] }, { id: 'S02', tipo: 'tela-cheia', tecnicas: ['reel.cena.tela-cheia'] }]);
  assert.deepEqual(certo.erros, []);
  const semTipo = falado([{ id: 'S03', tecnicas: ['reel.cena.legenda'] }]);
  assert.deepEqual(semTipo.erros, ['a cena S03 não tem tipo e cita reel.cena.legenda, que só vale na cena de tipo legenda']);
});

test('o motor:tipo sem o = e a técnica sem ele não pedem tipo nenhum', () => {
  const r = falado([{ id: 'S01', tipo: 'qualquer', tecnicas: ['reel.cena.tipo-por-frase', 'reel.cena.zoom-de-enfase'] }]);
  assert.deepEqual(r.erros, []);
});

// as quatro de tipo e as duas de ritmo que dizem a cena: o gancho e o fecho do falado são legenda
const PEDEM_TIPO = { 'reel.cena.legenda': 'legenda', 'reel.cena.legenda-interface': 'legenda-interface', 'reel.cena.meia-tela': 'meia-tela',
  'reel.cena.tela-cheia': 'tela-cheia', 'reel.ritmo.gancho-com-o-rosto': 'legenda', 'reel.ritmo.fecho-do-falado': 'legenda' };
test('no manual de verdade, as quatro de tipo pedem o tipo do nome, o gancho e o fecho pedem a legenda, e nenhuma outra pede tipo', () => {
  const real = lerManual();
  for (const [id, tipo] of Object.entries(PEDEM_TIPO)) {
    assert.ok(real.has(id), `${id} existe no manual`);
    assert.deepEqual(doTipo(falado([{ id: 'S01', tipo, tecnicas: [id] }], real).erros), [], `${id} vale na cena ${tipo}`);
    assert.deepEqual(doTipo(falado([{ id: 'S01', tipo: 'outro', tecnicas: [id] }], real).erros), [`a cena S01 é do tipo outro e cita ${id}, que só vale na cena de tipo ${tipo}`]);
  }
  const pedem = [...real.keys()].filter((id) => doTipo(falado([{ id: 'S01', tipo: 'outro', tecnicas: [id] }], real).erros).length);
  assert.deepEqual(pedem.sort(), Object.keys(PEDEM_TIPO).sort());
});

test('a técnica proposta entra sinalizada: o aviso diz que a pessoa a vê na aprovação da peça', () => {
  const r = rodar(plano({ cenas: [cena('S01', { tecnicas: ['filme.tratamento.lut'] })] }));
  const av = r.avisos.filter((a) => /proposta/.test(a));
  assert.equal(av.length, 1);
  assert.equal(av[0], '1 técnica(s) proposta(s), que entram sinalizadas na entrega para a pessoa ver na aprovação da peça: filme.tratamento.lut');
});
