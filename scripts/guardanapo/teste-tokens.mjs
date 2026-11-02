// Prova da base do Guardanapo: os números do guia moram num objeto só, as
// cores saem da marca de quem instalou (nunca copiadas), pela regra única de
// derivação; sem marca a peça para, a paleta neutra vale só pedida, e as fontes estão instaladas (o `scripts/terceiros/`) e
// íntegras.
//
// Rodar: node --test scripts/guardanapo/teste-tokens.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, writeFileSync, rmSync, mkdirSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  T, RAIZ, MARCA_PADRAO, NEUTRA, coresDaMarca, lerPaleta, exigirMarca, avisosDeContraste, contraste, fontesExcalifont, fontesInter,
} from './tokens.mjs';
import { conferirPeca, pecaDe, exigirPeca } from '../terceiros/peca.mjs';
import { lerMarca, lerMolde, MENSAGEM } from '../marca/marca.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));

// uma marca fictícia, com os oito canais do molde do /carrossel
const MARCA = `/* ESTADO: configurado */
:root{
  --c-dark:        20,60,40;
  --c-light:       250,248,242;
  --c-accent:      200,70,30;
  --c-support-1:   30,90,140;
  --c-support-2:   236,232,222;
  --c-rare:        90,90,90;
  --c-abyss:       10,20,15;
  --c-ok:          140,190,150;
}`;

const arquivo = (texto) => {
  const p = mkdtempSync(join(tmpdir(), 'guardanapo-marca-'));
  writeFileSync(join(p, 'tokens.css'), texto);
  return { caminho: join(p, 'tokens.css'), fora: () => rmSync(p, { recursive: true, force: true }) };
};

// o T e o desenho num processo novo, com a origem da marca pela variável
const noFilho = (origem) => {
  const codigo = `
    const { T } = await import(${JSON.stringify(pathToFileURL(join(AQUI, 'tokens.mjs')).href)});
    const { desenhar } = await import(${JSON.stringify(pathToFileURL(join(AQUI, 'desenhar.mjs')).href)});
    const cena = { formato: 'post', elementos: { a: { tipo: 'no', texto: 'pedido', x: 120, y: 400, largura: 360 } },
      quadros: [{ titulo: 'Onde trava', mostrar: ['a'], destaque: { tipo: 'foco', alvo: 'a' } }] };
    console.log(JSON.stringify({ cor: T.cor, marca: T.marca, svg: desenhar(cena)[0] }));`;
  const env = { ...process.env, GUARDANAPO_MARCA: origem };
  delete env.NODE_TEST_CONTEXT;
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', codigo], { encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
};

// a fonte de leitura e os avisos num processo novo, com a marca de outra raiz
const noFilhoFonte = (origem) => {
  const codigo = `
    const { T, fontesInter } = await import(${JSON.stringify(pathToFileURL(join(AQUI, 'tokens.mjs')).href)});
    console.log(JSON.stringify({ familia: T.familia, marca: T.marca, fontes: fontesInter() }));`;
  const env = { ...process.env, GUARDANAPO_MARCA: origem };
  delete env.NODE_TEST_CONTEXT;
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', codigo], { encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
};

test('com a marca configurada, as cores saem do tokens.css dela, pelo papel', () => {
  const c = coresDaMarca(MARCA);
  assert.equal(c.problema, '#143c28'); // --c-dark
  assert.equal(c.solucao, '#1e5a8c'); // --c-support-1
  assert.equal(c.destaque, '#c8461e'); // --c-accent
  assert.equal(c.fundo, '#faf8f2'); // --c-light
  assert.equal(c.superficie, '#ece8de'); // --c-support-2
  // as duas derivadas: 62% da principal sobre o fundo, 8% sobre o lavado
  assert.equal(c.contexto, '#6b8375');
  assert.equal(c.grupo, '#dbdacf');
});

test('canal ausente na marca explode, em vez de virar preto calado', () => {
  assert.throws(() => coresDaMarca(MARCA.replace(/--c-accent:[^;]+;/, '')), /--c-accent sumiu/);
});

// uma marca configurada em JSON, numa raiz de mentira: o molde sem o estado,
// com a principal e o acento trocados
const raizComMarca = ({ principal = '#143c28', acento = '#c8461e', fonte } = {}) => {
  const raiz = mkdtempSync(join(tmpdir(), 'guardanapo-raiz-'));
  const t = structuredClone(lerMolde().tokens);
  delete t.$extensions;
  t.cor.papel.principal = { $value: principal };
  t.cor.papel.acento = { $value: acento };
  if (fonte) t.fonte.display.$extensions = { 'marca.arquivo': fonte };
  const pasta = join(raiz, 'identidade');
  mkdirSync(pasta, { recursive: true });
  writeFileSync(join(pasta, 'marca.tokens.json'), JSON.stringify(t));
  return { raiz, arquivo: join(pasta, 'marca.tokens.json'), fora: () => rmSync(raiz, { recursive: true, force: true }) };
};

test('sem marca configurada a peça para com a frase única; a neutra vale só pedida', () => {
  const vazia = mkdtempSync(join(tmpdir(), 'guardanapo-vazia-'));
  try {
    // a raiz sem identidade/marca.tokens.json: não configurada, e a peça para
    const p = lerPaleta(vazia);
    assert.equal(p.origem, 'nao-configurada');
    assert.match(p.motivo, /falta identidade\/marca\.tokens\.json/);
    assert.throws(() => exigirMarca(p), new RegExp(`${MENSAGEM}.*GUARDANAPO_MARCA=neutra`));
  } finally {
    rmSync(vazia, { recursive: true, force: true });
  }
  // a neutra pedida de propósito não para
  const n = lerPaleta('neutra');
  assert.deepEqual(n.cor, { ...NEUTRA });
  assert.doesNotThrow(() => exigirMarca(n));
  // o caminho pedido de propósito que não existe explode, em vez de cair calado
  assert.throws(() => lerPaleta(join(tmpdir(), 'nao-existe-guardanapo', 'tokens.css')), /GUARDANAPO_MARCA não existe/);
  // o tokens.css gerado no estado não configurado também para
  const molde = arquivo(MARCA.replace('ESTADO: configurado', 'ESTADO: nao-configurado'));
  try {
    assert.equal(lerPaleta(molde.caminho).origem, 'nao-configurada');
  } finally {
    molde.fora();
  }
  // a neutra é quase preto sobre off-white, um cinza e um acento
  assert.equal(NEUTRA.fundo, '#faf9f6');
  assert.equal(NEUTRA.problema, '#1a1a1a');
});

test('a marca em JSON (a pasta de outra raiz ou o arquivo) dá as mesmas tintas que o tokens.css', () => {
  const m = raizComMarca();
  try {
    const pelaPasta = lerPaleta(m.raiz);
    const peloArquivo = lerPaleta(m.arquivo);
    assert.equal(pelaPasta.origem, 'marca');
    assert.deepEqual(pelaPasta.cor, peloArquivo.cor);
    assert.equal(pelaPasta.cor.problema, '#143c28');
    assert.equal(pelaPasta.cor.destaque, '#c8461e');
  } finally {
    m.fora();
  }
});

test('a fonte de leitura é a da marca quando ela tem arquivo local; sem arquivo, a Inter 4 com aviso', () => {
  const comArquivo = raizComMarca({ fonte: 'fontes/Leitura.ttf' });
  try {
    mkdirSync(join(comArquivo.raiz, 'identidade', 'fontes'), { recursive: true });
    copyFileSync(fontesInter()[0].arquivo, join(comArquivo.raiz, 'identidade', 'fontes', 'Leitura.ttf'));
    const f = noFilhoFonte(comArquivo.raiz);
    assert.equal(f.familia.inter, 'Bricolage Grotesque');
    assert.ok(f.fontes[0].arquivo.endsWith('Leitura.ttf'), f.fontes[0].arquivo);
    assert.doesNotMatch(f.marca.avisos.join(' '), /não tem arquivo local/);
  } finally {
    comArquivo.fora();
  }
  const semArquivo = raizComMarca();
  try {
    const f = noFilhoFonte(semArquivo.raiz);
    assert.equal(f.familia.inter, 'Inter 4');
    assert.match(f.marca.avisos.join(' '), /não tem arquivo local/);
  } finally {
    semArquivo.fora();
  }
});

test('o T de verdade lê a origem certa: a marca pela variável, a neutra sem ela', () => {
  const m = arquivo(MARCA);
  try {
    const comMarca = noFilho(m.caminho);
    assert.deepEqual(comMarca.cor, coresDaMarca(MARCA));
    assert.equal(comMarca.marca.origem, 'marca');
    // e o desenho pinta com ela: o nó na principal, o foco no acento da marca
    assert.match(comMarca.svg, /stroke="#143c28"/);
    assert.match(comMarca.svg, /stroke="#c8461e"/);
    assert.match(comMarca.svg, /fill="#faf8f2"/);
    assert.doesNotMatch(comMarca.svg, new RegExp(NEUTRA.destaque));
  } finally {
    m.fora();
  }
  const neutra = noFilho('neutra');
  assert.deepEqual(neutra.cor, { ...NEUTRA });
  assert.equal(neutra.marca.origem, 'neutra');
  assert.match(neutra.svg, new RegExp(`stroke="${NEUTRA.destaque}"`));
});

test('o T deste processo tem a origem e as cores esperadas, calculadas sem o lerPaleta', () => {
  // o esperado sai da leitura da marca e da regra escrita aqui, e não do lerPaleta
  const pedida = process.env.GUARDANAPO_MARCA;
  if (pedida === 'neutra') {
    assert.equal(T.marca.origem, 'neutra');
    assert.deepEqual({ ...T.cor }, { ...NEUTRA });
    return;
  }
  if (pedida) return; // outra origem pedida: a prova é a do filho, acima
  const m = lerMarca();
  if (!m.configurada) {
    assert.equal(T.marca.origem, 'nao-configurada');
    assert.equal(T.marca.arquivo, null);
    assert.equal(T.marca.motivo, m.motivo);
    // carrega a neutra só para o módulo abrir; a peça para no exigirMarca
    assert.deepEqual({ ...T.cor }, {
      problema: '#1a1a1a', solucao: '#1e3a8a', contexto: '#64646a', destaque: '#2563eb',
      fundo: '#faf9f6', superficie: '#f0f0f1', grupo: '#e4e4e7',
    });
  } else {
    assert.equal(T.marca.origem, 'marca');
    assert.equal(T.marca.arquivo, MARCA_PADRAO);
    const p = m.resolvido.cor.papel;
    assert.equal(T.cor.solucao, p.apoio);
    assert.equal(T.cor.fundo, p.claro);
    assert.equal(T.cor.superficie, p.lavado);
    assert.ok([p.principal, p.abismo].includes(T.cor.problema));
  }
});

test('a paleta permitida é só a da origem', () => {
  assert.deepEqual(new Set(T.paleta), new Set(Object.values(T.cor)));
  for (const c of T.paleta) assert.match(c, /^#[0-9a-f]{6}$/);
});

test('o acento que some no fundo: o destaque cai na cor do texto, com aviso; o aviso de contraste segue de rede', () => {
  assert.deepEqual(avisosDeContraste(NEUTRA), []);
  assert.deepEqual(avisosDeContraste(coresDaMarca(MARCA)), []);
  // o amarelo dá menos de 3:1 no claro: pela regra única, o destaque usa o texto
  const css = MARCA.replace(/--c-accent:[^;]+;/, '--c-accent: 250,220,60;');
  const amarela = coresDaMarca(css);
  assert.equal(amarela.destaque, amarela.problema);
  assert.deepEqual(avisosDeContraste(amarela), []);
  const m = arquivo(css);
  try {
    assert.match(lerPaleta(m.caminho).avisos.join(' '), /o acento dá 1,\d+:1 sobre o claro: o destaque em texto no slide claro usa a cor de texto/);
  } finally {
    m.fora();
  }
  // a rede: uma tinta abaixo de 3:1 que chegue ao T ainda avisa
  const a = avisosDeContraste({ ...NEUTRA, destaque: '#fadc3c' });
  assert.equal(a.length, 1);
  assert.match(a[0], /a tinta "destaque" \(#fadc3c\) tem 1\.\d:1 sobre o fundo/);
  assert.ok(Math.abs(contraste('#000000', '#ffffff') - 21) < 0.01);
});

test('os números do guia: traço, níveis, faixas, tetos, margem', () => {
  assert.deepEqual(T.traco, { base: 4, destaque: 7, fino: 2 });
  assert.deepEqual(T.nivel.titulo, { padrao: 80, min: 72, max: 96, palavras: 6 });
  assert.deepEqual(T.nivel.rotulo, { padrao: 40, min: 36, max: 44, palavras: 4 });
  assert.deepEqual(T.nivel.frase, { padrao: 32, min: 30, max: 32 });
  assert.equal(T.anotacaoPalavras, 10);
  assert.deepEqual(T.teto, { carrossel: 6, post: 5, slide: 8, coluna: 8 });
  assert.equal(T.margem, 80);
  assert.deepEqual(T.quadro, { largura: 1080, altura: 1350 });
  assert.equal(T.rugosidade, 1);
});

// As fontes moram fora do git: o `scripts/terceiros/instalar.mjs` as baixa da
// fonte oficial (a peça guardanapo-fontes), com o texto que vem junto de cada
// uma, e o manifesto guarda a impressão de cada arquivo.
test('as fontes estão instaladas e íntegras, arquivo por arquivo', () => {
  const { faltando, divergentes } = conferirPeca(pecaDe('guardanapo-fontes'), RAIZ);
  assert.ok(!faltando.length && !divergentes.length,
    `a peça guardanapo-fontes não está inteira (falta: ${faltando.join(', ') || 'nada'}; diverge: ${divergentes.map((d) => d.para).join(', ') || 'nada'}): ` +
    'rode `node scripts/terceiros/instalar.mjs --so guardanapo-fontes`');
});

test('a Excalifont: os quatro subconjuntos latinos, cada um com a faixa', () => {
  const f = fontesExcalifont();
  assert.equal(f.length, 4);
  for (const { arquivo: a, faixa } of f) {
    assert.ok(existsSync(a), a);
    assert.equal(readFileSync(a).subarray(0, 4).toString('latin1'), 'wOF2');
    assert.match(faixa, /^U\+/);
  }
});

test('a Inter 4 mora na pasta da skill, latin e latin-ext', () => {
  const f = fontesInter();
  assert.equal(f.length, 2);
  for (const { arquivo: a, faixa } of f) {
    assert.ok(a.startsWith(join(RAIZ, '.claude/skills/guardanapo/fontes')), a);
    assert.ok(existsSync(a), a);
    assert.equal(readFileSync(a).subarray(0, 4).toString('latin1'), 'wOF2');
    assert.match(faixa, /^U\+/);
  }
});

test('sem as fontes instaladas, o erro diz o comando que as instala', () => {
  assert.throws(() => exigirPeca('guardanapo-fontes', { raiz: mkdtempSync(join(tmpdir(), 'guardanapo-sem-fontes-')) }),
    /falta a peça "guardanapo-fontes"[\s\S]*node scripts\/terceiros\/instalar\.mjs/);
});
