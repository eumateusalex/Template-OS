// O kit da /mograph (kit.mjs): resolve o gesto, o objeto 3D e a LUT para o arquivo na raiz de
// material da máquina, e confere que o kit inteiro existe e cobre o manual. Tudo numa skill e numa
// raiz de mentira, montadas aqui: o teste roda em qualquer máquina, até sem o material.
//
//   node --test .claude/skills/mograph/ferramentas/teste-kit.test.mjs
// mutação: .claude/skills/mograph/ferramentas/kit.mjs · "return r && !r.startsWith('..') && !isAbsolute(r) ? abs : null;" → "return r ? abs : null;" · pega
// mutação: .claude/skills/mograph/ferramentas/kit.mjs · "else if (!existsSync(a.abs)) erros.push" → "else if (false) erros.push" · pega
// mutação: .claude/skills/mograph/ferramentas/kit.mjs · "if (!kit.vocabulario.has(g)) erros.push" → "if (false) erros.push" · pega
// mutação: .claude/skills/mograph/ferramentas/kit.mjs · "if (!v.sons?.length && !v.gerado) erros.push" → "if (false) erros.push" · pega
// mutação: .claude/skills/mograph/ferramentas/kit.mjs · "else if (!kit.som.gestos[gesto]) erros.push" → "else if (false) erros.push" · pega
// mutação: .claude/skills/mograph/ferramentas/kit.mjs · "export const raizDoKit = (skill = SKILL) => join(skill, 'material');" → "export const raizDoKit = (skill = SKILL) => join(skill, 'kit');" · pega
// mutação: .claude/skills/mograph/ferramentas/kit.mjs · ".find((s) => /^4 · Os gestos de som/.test(s))" → ".find((s) => /Os gestos de som/.test(s))" · pega
// mutação: .claude/skills/mograph/ferramentas/kit.mjs · "if (typeof rel !== 'string' || !rel || isAbsolute(rel) || /^[a-z]:/i.test(rel)) return null;" → "if (typeof rel !== 'string' || !rel) return null;" · pega
// mutação: .claude/skills/mograph/ferramentas/kit.mjs · "return typeof pacote === 'string' && PACOTE.test(pacote) && existsSync(arq) ? lerJson(arq) : null;" → "return existsSync(arq) ? lerJson(arq) : null;" · pega
// mutação: .claude/skills/mograph/ferramentas/kit.mjs · "if (!existsSync(raiz)) {" → "if (false) {" · pega
// mutação: .claude/skills/mograph/ferramentas/kit.mjs · "if (!contados) erros.push" → "if (false) erros.push" · pega
// mutação: .claude/skills/mograph/ferramentas/kit.mjs · "if (!indiceDoPacote(kit, kit.d3.pacote)) erros.push" → "if (false) erros.push" · pega
// mutação: .claude/skills/mograph/ferramentas/kit.mjs · "if (pac && pac.clara !== true) {" → "if (pac) {" · pega
// mutação: .claude/skills/mograph/ferramentas/kit.mjs · "const pac = tipo === '3d' ? indiceDoPacote(kit, kit.d3.pacote) : null;" → "const pac = indiceDoPacote(kit, kit.d3.pacote);" · pega
// mutação: .claude/skills/mograph/ferramentas/kit.mjs · "if (r.aviso) console.error" → "if (false) console.error" · pega
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerKit, resolver, conferir, raizDoKit, SEM_MATERIAL } from './kit.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const tmp = mkdtempSync(join(tmpdir(), 'kit-'));
const escrever = (arq, txt) => { mkdirSync(dirname(arq), { recursive: true }); writeFileSync(arq, txt); };
const json = (arq, o) => escrever(arq, JSON.stringify(o, null, 1));

const README = `# O manual

## 3 · Antes de Os gestos de som

| \`buzina\` | antes da seção, não é gesto |

## 4 · Os gestos de som

| Gesto | O que acompanha |
|---|---|
| \`tecla\` | a letra |
| \`pop\` | o que nasce |
| \`drone\` | a cama no tom |
| \`silencio\` | a vírgula |

## 5 · O que realiza

| \`clique\` | fora da seção, não é gesto |
`;
const ENTRADA = (id, som) => `### ${id}\n- **estado**: proposta\n- **quando**: x\n- **regra**: y\n- **parâmetros**: —\n- **som**: ${som}\n- **realiza**: \`mao\`\n`;

// uma skill e uma raiz de material inteiras e certas; cada teste estraga uma cópia
function montar(nome, { som, d3, lut, readme = README, manual } = {}) {
  const skill = join(tmp, nome, 'skill'), raiz = join(tmp, nome, 'material');
  escrever(join(skill, 'manual', 'README.md'), readme);
  escrever(join(skill, 'manual', 'comum', 'som.md'), manual ?? (ENTRADA('comum.som.a', '`tecla`, uma por letra') + '\n' + ENTRADA('comum.som.b', '`pop` no pouso; o `drone` por baixo') + '\n' + ENTRADA('comum.som.c', 'nenhum (`comum.som.a` cobre); o `README.md` diz')));
  json(join(skill, 'acervo', 'ativos', 'lab.json'), { pacote: 'lab', raiz: 'sfx/lab', itens: [] });
  json(join(skill, 'kit', 'som.json'), som ?? { versao: 1, gestos: {
    tecla: { estado: 'proposta', sons: ['lab:digitar/a.wav', 'lab:digitar/b.wav'] },
    pop: { estado: 'proposta', sons: ['lab:pop/p.wav'] },
    drone: { estado: 'firme', gerado: 'o tonal.py', sons: [] },
    silencio: { estado: 'firme', gerado: 'o som que se tira', sons: [] },
  } });
  json(join(skill, 'kit', '3d.json'), d3 ?? { versao: 1, raiz: '_convertido/3d', pacote: 'lab', itens: [
    { id: 'dinheiro/card', tema: 'dinheiro', entra: 'icones/card-in.webm', laco: 'icones/card-loop.webm', variacoes: ['card-in.webm'] },
    { id: 'sinal/check', tema: 'sinal', inteiro: 'check.webm' },
  ] });
  json(join(skill, 'kit', 'lut.json'), lut ?? { versao: 1, itens: [{ id: 'escape-01', arquivo: 'pacote/lut/escape-01.cube' }] });
  for (const f of ['sfx/lab/digitar/a.wav', 'sfx/lab/digitar/b.wav', 'sfx/lab/pop/p.wav', '_convertido/3d/icones/card-in.webm',
    '_convertido/3d/icones/card-loop.webm', '_convertido/3d/card-in.webm', '_convertido/3d/check.webm', 'pacote/lut/escape-01.cube']) escrever(join(raiz, f), 'x');
  return { skill, raiz };
}

const cli = (...a) => spawnSync(process.execPath, [join(AQUI, 'kit.mjs'), ...a], { encoding: 'utf8' });

test('o kit certo confere verde e conta os arquivos', () => {
  const { skill, raiz } = montar('certo');
  const r = conferir(lerKit(skill), raiz);
  assert.deepEqual(r.erros, []);
  assert.equal(r.arquivos, 8);
  const c = cli('conferir', '--skill', skill, '--raiz', raiz);
  assert.equal(c.status, 0, c.stdout + c.stderr);
});

test('o resolver dá o caminho absoluto do gesto, do objeto 3D e da LUT', () => {
  const { skill, raiz } = montar('resolver');
  const kit = lerKit(skill);
  assert.deepEqual(resolver('som:tecla', kit, raiz).arquivos, [join(raiz, 'sfx/lab/digitar/a.wav'), join(raiz, 'sfx/lab/digitar/b.wav')]);
  assert.deepEqual(resolver('3d:dinheiro/card', kit, raiz).arquivos, [join(raiz, '_convertido/3d/icones/card-in.webm'), join(raiz, '_convertido/3d/icones/card-loop.webm')]);
  assert.deepEqual(resolver('lut:escape-01', kit, raiz).arquivos, [join(raiz, 'pacote/lut/escape-01.cube')]);
  const c = cli('resolver', 'som:pop', '--skill', skill, '--raiz', raiz);
  assert.equal(c.status, 0);
  assert.equal(c.stdout.trim(), join(raiz, 'sfx/lab/pop/p.wav'));
});

test('o nome que não existe sai 1 com os parecidos, e o tipo que não existe também', () => {
  const { skill, raiz } = montar('parecido');
  const kit = lerKit(skill);
  const r = resolver('3d:card', kit, raiz);
  assert.match(r.erro, /não existe/);
  assert.deepEqual(r.parecidos, ['dinheiro/card']);
  assert.match(resolver('video:x', kit, raiz).erro, /som, 3d ou lut/);
  assert.match(resolver('som:drone', kit, raiz).erro, /gerado/, 'o gesto gerado não tem arquivo: diz quem o gera');
  const c = cli('resolver', 'som:tec', '--skill', skill, '--raiz', raiz);
  assert.equal(c.status, 1);
  assert.match(c.stderr, /tecla/);
});

test('o arquivo que falta no disco reprova, com o nome', () => {
  const { skill, raiz } = montar('falta');
  rmSync(join(raiz, '_convertido/3d/check.webm'));
  rmSync(join(raiz, 'sfx/lab/pop/p.wav'));
  const r = conferir(lerKit(skill), raiz);
  assert.equal(r.erros.length, 2);
  assert.ok(r.erros.some((e) => /check\.webm/.test(e)) && r.erros.some((e) => /pop\/p\.wav/.test(e)));
  assert.equal(cli('conferir', '--skill', skill, '--raiz', raiz).status, 1);
});

test('a variação do 3D também se confere', () => {
  const { skill, raiz } = montar('variacao');
  rmSync(join(raiz, '_convertido/3d/card-in.webm'));
  assert.ok(conferir(lerKit(skill), raiz).erros.some((e) => /card-in\.webm/.test(e) && /dinheiro\/card/.test(e)));
});

test('o gesto que o manual cita e o kit não tem, ou tem vazio sem ser gerado, reprova', () => {
  const sem = montar('sem-gesto', { som: { versao: 1, gestos: { tecla: { sons: ['lab:digitar/a.wav'] }, drone: { gerado: 'x', sons: [] }, silencio: { gerado: 'y', sons: [] } } } });
  assert.ok(conferir(lerKit(sem.skill), sem.raiz).erros.some((e) => /`pop`/.test(e) && /comum\.som\.b/.test(e)));
  const vazio = montar('gesto-vazio', { som: { versao: 1, gestos: { tecla: { sons: ['lab:digitar/a.wav'] }, pop: { sons: [] }, drone: { gerado: 'x', sons: [] }, silencio: { gerado: 'y', sons: [] } } } });
  assert.ok(conferir(lerKit(vazio.skill), vazio.raiz).erros.some((e) => /`pop`/.test(e) && /nenhum som/.test(e)));
});

test('o gesto fora do vocabulário do README reprova, no kit e no manual', () => {
  const k = montar('fora-do-vocabulario', { som: { versao: 1, gestos: { tecla: { sons: ['lab:digitar/a.wav'] }, pop: { sons: ['lab:pop/p.wav'] }, drone: { gerado: 'x', sons: [] }, silencio: { gerado: 'y', sons: [] }, clique: { sons: ['lab:pop/p.wav'] } } } });
  assert.ok(conferir(lerKit(k.skill), k.raiz).erros.some((e) => /`clique`/.test(e) && /vocabulário/.test(e)), 'a linha de depois da seção 4 não entra no vocabulário');
  const b = montar('antes-do-vocabulario', { som: { versao: 1, gestos: { tecla: { sons: ['lab:digitar/a.wav'] }, pop: { sons: ['lab:pop/p.wav'] }, drone: { gerado: 'x', sons: [] }, silencio: { gerado: 'y', sons: [] }, buzina: { sons: ['lab:pop/p.wav'] } } } });
  assert.ok(conferir(lerKit(b.skill), b.raiz).erros.some((e) => /`buzina`/.test(e) && /vocabulário/.test(e)), 'nem a de antes dela');
  const m = montar('manual-fora', { manual: ENTRADA('comum.som.z', 'o `tilintar` do sino') });
  assert.ok(conferir(lerKit(m.skill), m.raiz).erros.some((e) => /`tilintar`/.test(e) && /comum\.som\.z/.test(e)));
});

test('o caminho que sai da raiz e o pacote desconhecido reprovam sem abrir nada', () => {
  const { skill, raiz } = montar('fuga', {
    som: { versao: 1, gestos: { tecla: { sons: ['lab:../../fora.wav', 'nada:x.wav', '../lab:x.wav', '../ativos/lab:x.wav'] }, pop: { sons: ['lab:pop/p.wav'] }, drone: { gerado: 'x', sons: [] }, silencio: { gerado: 'y', sons: [] } } },
    lut: { versao: 1, itens: [{ id: 'abs', arquivo: 'C:/Windows/win.ini' }, { id: 'barra', arquivo: '/etc/passwd' }, { id: 'unidade', arquivo: 'C:pacote/lut/escape-01.cube' }] }, // exportar-ok: o caminho absoluto de Windows é a prova de fuga da raiz
  });
  escrever(join(tmp, 'fuga', 'fora.wav'), 'existe, mas fora da raiz');
  const r = conferir(lerKit(skill), raiz);
  assert.ok(r.erros.some((e) => /\.\.\/\.\.\/fora\.wav/.test(e) && /fora da raiz/.test(e)), r.erros.join('\n'));
  assert.ok(r.erros.some((e) => /nada:x\.wav/.test(e) && /pacote/.test(e)));
  assert.ok(r.erros.some((e) => /\.\.\/lab:x\.wav/.test(e) && /pacote/.test(e)));
  assert.ok(r.erros.some((e) => /win\.ini/.test(e) && /fora da raiz/.test(e)));
  assert.ok(r.erros.some((e) => /passwd/.test(e) && /fora da raiz/.test(e)));
  assert.match(resolver('lut:abs', lerKit(skill), raiz).erro, /fora da raiz/);
  assert.ok(r.erros.some((e) => /\.\.\/ativos\/lab:x\.wav/.test(e) && /pacote/.test(e)), r.erros.join('\n'));
  assert.match(resolver('lut:unidade', lerKit(skill), raiz).erro, /fora da raiz/);
});

test('o kit sem nenhum arquivo não sai verde: medir zero é vermelho', () => {
  const { skill, raiz } = montar('zero', {
    som: { versao: 1, gestos: { tecla: { gerado: 'x', sons: [] }, pop: { gerado: 'x', sons: [] }, drone: { gerado: 'x', sons: [] }, silencio: { gerado: 'y', sons: [] } } },
    d3: { versao: 1, raiz: '_convertido/3d', pacote: 'lab', itens: [] },
    lut: { versao: 1, itens: [] },
  });
  const r = conferir(lerKit(skill), raiz);
  assert.ok(r.erros.some((e) => /nenhum arquivo/.test(e)), r.erros.join('\n'));
  const c = cli('conferir', '--skill', skill, '--raiz', raiz);
  assert.equal(c.status, 1, c.stdout + c.stderr);
});

test('o 3D diz o pacote, e o resolver avisa quando a licença do pacote não é clara (só no orgânico)', () => {
  const { skill, raiz } = montar('licenca');
  json(join(skill, 'acervo', 'ativos', 'pac.json'), { pacote: 'pac', raiz: 'pac', clara: false, licenca: 'pacote de terceiro; só no orgânico', itens: [] });
  json(join(skill, 'acervo', 'ativos', 'livre.json'), { pacote: 'livre', raiz: 'livre', clara: true, licenca: 'livre', itens: [] });
  const d3 = (pacote) => json(join(skill, 'kit', '3d.json'), { versao: 1, raiz: '_convertido/3d', pacote, itens: [{ id: 'sinal/check', tema: 'sinal', inteiro: 'check.webm' }] });
  d3('pac');
  const r = resolver('3d:sinal/check', lerKit(skill), raiz);
  assert.deepEqual(r.arquivos, [join(raiz, '_convertido/3d/check.webm')]);
  assert.match(r.aviso, /pac.*orgânico.*anúncio/);
  const c = cli('resolver', '3d:sinal/check', '--skill', skill, '--raiz', raiz);
  assert.equal(c.status, 0, c.stdout + c.stderr);
  assert.match(c.stderr, /aviso: .*orgânico/);
  assert.equal(resolver('som:pop', lerKit(skill), raiz).aviso, undefined, 'o som avisa no ativos.py, pelo --uso');
  d3('livre');
  assert.equal(resolver('3d:sinal/check', lerKit(skill), raiz).aviso, undefined);
  d3(undefined);
  assert.ok(conferir(lerKit(skill), raiz).erros.some((e) => /3d\.json.*pacote/.test(e)), 'o 3d.json sem o pacote não sabe a licença');
});

test('sem raiz de material nesta máquina, o conferir sai 1 dizendo que não mediu', () => {
  const { skill } = montar('sem-raiz');
  const c = cli('conferir', '--skill', skill, '--raiz', join(tmp, 'nao-existe'));
  assert.equal(c.status, 1);
  assert.match(c.stdout + c.stderr, /não medi/);
});

test('a raiz do kit é a pasta material/ da skill, sem configuração, e a ausência diz para rodar o /instalar', () => {
  const skill = join(tmp, 'skill-sem-material');
  assert.equal(raizDoKit(skill), join(skill, 'material'));
  // o VIDEO_MATERIAL é dos pacotes da pessoa: não troca a raiz do kit
  const c = spawnSync(process.execPath, [join(AQUI, 'kit.mjs'), 'conferir', '--skill', skill], { encoding: 'utf8', env: { ...process.env, VIDEO_MATERIAL: tmp } });
  assert.equal(c.status, 1);
  assert.ok((c.stdout + c.stderr).includes(SEM_MATERIAL), c.stdout + c.stderr);
  assert.match(SEM_MATERIAL, /rode \/instalar/);
});

test('o uso errado sai 2, com o uso', () => {
  const c = cli('nada-disso');
  assert.equal(c.status, 2);
  assert.match(c.stderr, /uso:/);
  assert.equal(cli('resolver').status, 2);
});
