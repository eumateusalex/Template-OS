// A régua do capa.mjs, no Chromium de verdade, sobre uma peça mínima gerada aqui: o #root de
// 1080x1920, uma bola azul que a timeline move (a timeline imita a do HyperFrames: seek(t)) e a
// camada de título vermelha por último. Cada caso planta um defeito e confere que a capa pega.
//   node teste-capa.mjs
import { mkdtempSync, writeFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { capas, recorteDaGrade, opcoes } from './capa.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
let testes = 0, falhas = 0;
const ok = (cond, msg) => { testes++; console.log(`${cond ? 'ok  ' : 'FALHA'} ${msg}`); if (!cond) falhas++; };
const tmp = mkdtempSync(join(tmpdir(), 'capa-teste-'));

// a peça: a bola desce 100 px por segundo; o título vermelho é a última camada; o "outro" é verde
writeFileSync(join(tmp, 'index.html'), `<!doctype html><html><head><meta charset="utf-8"><style>
  :root{--on-light:rgb(90, 10, 20);--f-display:'Fonte Da Marca', serif;--w-display-bold:650}
  html,body{margin:0;background:#fff} #root{position:relative;width:1080px;height:1920px;overflow:hidden;background:#fff}
  .grad{color:#0071e3}
</style></head><body>
<div id="root" data-composition-id="main" data-start="0" data-duration="6" data-width="1080" data-height="1920">
  <audio id="trilha" src="x.wav" data-start="0" data-duration="6"></audio>
</div>
<script>
  const root = document.getElementById('root');
  root.insertAdjacentHTML('beforeend', '<div id="bola" style="position:absolute;left:490px;top:200px;width:100px;height:100px;border-radius:50%;background:#0000ff"></div>');
  root.insertAdjacentHTML('beforeend', '<div id="outro" style="position:absolute;left:0;top:1500px;width:1080px;height:100px;background:#00ff00"></div>');
  root.insertAdjacentHTML('beforeend', '<div id="titulo" style="position:absolute;left:0;top:1100px;width:1080px;height:200px;background:#ff0000"></div>');
  window.__timelines = { main: { seek(t) { document.getElementById('bola').style.top = (200 + t * 100) + 'px'; } } };
</script></body></html>`);

// os pixels de um PNG, lidos num canvas do mesmo Chromium
const { chromium } = createRequire(join(AQUI, '..', '..', '..', '..', 'scripts', 'package.json'))('playwright');
const nav = await chromium.launch({ headless: true });
const leitor = await nav.newPage();
async function pixels(png, pontos) {
  return leitor.evaluate(async ({ src, pontos }) => {
    const img = new Image(); img.src = src; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const em = ([x, y]) => [...g.getImageData(x, y, 1, 1).data.slice(0, 3)];
    // os escuros de um retângulo (a tinta da frase)
    const escuros = ([x, y, w, h]) => { const d = g.getImageData(x, y, w, h).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] < 150) n++; return n; };
    return { w: img.width, h: img.height, cor: pontos.cor.map(em), escuros: (pontos.escuros || []).map(escuros) };
  }, { src: `data:image/png;base64,${readFileSync(png).toString('base64')}`, pontos });
}
const perto = (a, b) => a.every((v, i) => Math.abs(v - b[i]) <= 12);
const AZUL = [0, 0, 255], VERMELHO = [255, 0, 0], VERDE = [0, 255, 0], BRANCO = [255, 255, 255];
const FRASE = 'Seu cliente parou <span class="grad">antes de comprar.</span>';

// 1 · o instante, a camada de título escondida e a frase no topo e no tamanho pedidos
let r = await capas(tmp, join(tmp, 'capa.png'), { em: 3, texto: FRASE, topo: 760, tamanho: 120 });
let p = await pixels(r.arquivos[0], { cor: [[540, 550], [540, 250], [540, 1200], [540, 1550]], escuros: [[132, 760, 840, 260], [132, 1100, 840, 400]] });
ok(p.w === 1080 && p.h === 1920 && r.arquivos[0] === join(tmp, 'capa.png'), `a capa sai no tamanho do #root, 1080x1920 (${p.w}x${p.h})`);
ok(perto(p.cor[0], AZUL) && perto(p.cor[1], BRANCO), `parada no instante: aos 3 s a bola está em 500 px, não nos 200 do começo (${p.cor[0]} / ${p.cor[1]})`);
ok(!perto(p.cor[2], VERMELHO) && perto(p.cor[2], BRANCO), `a última camada do #root (o título vermelho) some (${p.cor[2]})`);
ok(perto(p.cor[3], VERDE), `a camada que não é a última fica (${p.cor[3]})`);
ok(p.escuros[0] > 5000 && p.escuros[1] === 0, `a frase entra entre o topo de 760 px e o tamanho de 120 px, e não abaixo dele (${p.escuros[0]} e ${p.escuros[1]} pixels escuros)`);
ok(r.caixas[0].cor === 'rgb(90, 10, 20)' && /Fonte Da Marca/.test(r.caixas[0].fonte) && r.caixas[0].peso === '650', `a frase sai na cor, na fonte e no peso da marca (--on-light, --f-display, --w-display-bold), sem cor à mão (${r.caixas[0].cor}, ${r.caixas[0].fonte}, ${r.caixas[0].peso})`);
r = await capas(tmp, join(tmp, 'capa-cor.png'), { em: 3, texto: FRASE, topo: 760, tamanho: 120, cor: 'rgb(0, 120, 0)' });
ok(r.caixas[0].cor === 'rgb(0, 120, 0)', `--cor troca a cor da frase só nesta capa (${r.caixas[0].cor})`);
r = await capas(tmp, join(tmp, 'capa.png'), { em: 3, texto: FRASE, topo: 760, tamanho: 120 });
ok(r.erros.length === 0 && Math.abs(r.caixas[0].topo - 760) <= 10, `a frase cabe no recorte 3:4 e não reprova (caixa em ${Math.round(r.caixas[0].topo)} a ${Math.round(r.caixas[0].base)} px)`);

// 2 · --esconde tira a camada pedida, e a última fica
r = await capas(tmp, join(tmp, 'esconde.png'), { em: 0, texto: FRASE, esconde: '#outro' });
p = await pixels(r.arquivos[0], { cor: [[540, 1200], [540, 1550]] });
ok(perto(p.cor[0], VERMELHO) && perto(p.cor[1], BRANCO), `--esconde "#outro" tira o verde e deixa o título (${p.cor[0]} / ${p.cor[1]})`);
let erro = '';
try { await capas(tmp, join(tmp, 'nada.png'), { em: 0, texto: FRASE, esconde: '#nao-existe' }); } catch (e) { erro = e.message; }
ok(/nao-existe/.test(erro), `o seletor que não casa reprova com o nome dele (${erro})`);

// 3 · a frase fora do recorte 3:4 da grade reprova: em cima, embaixo e pela largura
const g = recorteDaGrade(1080, 1920);
ok(g.topo === 240 && g.base === 1680, `o recorte 3:4 do 1080x1920 vai de 240 a 1680 px (${g.topo} a ${g.base})`);
r = await capas(tmp, join(tmp, 'alta.png'), { em: 0, texto: FRASE, topo: 120 });
ok(r.erros.length === 1 && /recorte 3:4/.test(r.erros[0]), `a frase com o topo em 120 px reprova pelo recorte da grade (${r.erros[0]})`);
r = await capas(tmp, join(tmp, 'baixa.png'), { em: 0, texto: FRASE, topo: 1500 });
ok(r.erros.length === 1 && /recorte 3:4/.test(r.erros[0]), `a frase que desce até depois de 1680 px reprova (${r.erros[0]})`);
r = await capas(tmp, join(tmp, 'larga.png'), { em: 0, texto: 'Inconstitucionalissimamente', topo: 800, tamanho: 120, largura: 2000 });
ok(r.erros.some((e) => /largura do quadro/.test(e)), `a palavra que passa da largura do quadro reprova (${r.erros.join(' | ')})`);

// 4 · três capas e a folha: uma por instante, com o recorte marcado
r = await capas(tmp, join(tmp, 'opcao.png'), { em: '1,2,3', texto: FRASE, topo: '700,760,820' });
ok(r.arquivos.length === 3 && r.arquivos.every(existsSync) && r.arquivos[2].endsWith('opcao-3.png') && r.folha.endsWith('opcao-folha.png') && existsSync(r.folha),
  `--em 1,2,3 dá opcao-1, -2 e -3 e a opcao-folha (${r.arquivos.length} capas)`);
ok(r.caixas.every((c, i) => Math.abs(c.topo - [700, 760, 820][i]) <= 10), `cada capa leva o topo da posição dela (${r.caixas.map((c) => Math.round(c.topo)).join(', ')})`);
p = await pixels(r.arquivos[0], { cor: [[540, 350]] });
const q = await pixels(r.arquivos[2], { cor: [[540, 550]] });
ok(perto(p.cor[0], AZUL) && perto(q.cor[0], AZUL), 'cada capa para no instante dela (a bola em 300 px no 1 s e em 500 px nos 3 s)');
// a folha: 3 x 360 px + as margens; fora do recorte escurece, dentro fica o quadro (branco)
p = await pixels(r.folha, { cor: [[24 + 180, 24 + 40], [24 + 60, 24 + 120], [24 + 180, 24 + 600]] });
ok(p.w === 24 + 3 * 384 && p.cor[0].every((v) => v < 140) && perto(p.cor[1], BRANCO) && p.cor[2].every((v) => v < 140),
  `a folha põe as 3 lado a lado (${p.w} px) e escurece o que a grade corta (${p.cor[0]} fora, ${p.cor[1]} dentro, ${p.cor[2]} fora)`);
let erroLista = '';
try { opcoes({ em: '1,2,3', topo: '700,760' }); } catch (e) { erroLista = e.message; }
ok(/--topo tem 2 valores/.test(erroLista), `listas de tamanhos diferentes reprovam (${erroLista})`);

// 5 · a linha de comando: 0 na capa boa, 1 na que sai da grade, 2 sem o --texto
const cli = (...a) => { try { execFileSync(process.execPath, [join(AQUI, 'capa.mjs'), ...a], { stdio: 'pipe' }); return 0; } catch (e) { return e.status; } };
ok(cli(join(tmp, 'index.html'), join(tmp, 'cli.png'), '--em', '2', '--texto', FRASE) === 0 && existsSync(join(tmp, 'cli.png')), 'capa.mjs sai 0 na capa boa e grava o PNG');
ok(cli(tmp, join(tmp, 'cli-alta.png'), '--em', '2', '--texto', FRASE, '--topo', '100') === 1, 'capa.mjs sai 1 na frase fora da grade');
ok(cli(tmp, join(tmp, 'cli-sem.png'), '--em', '2') === 2, 'capa.mjs sai 2 sem o --texto');

await nav.close();
rmSync(tmp, { recursive: true, force: true });
console.log(`\n# tests ${testes}\n# fail ${falhas}`);
process.exitCode = falhas ? 1 : 0;
