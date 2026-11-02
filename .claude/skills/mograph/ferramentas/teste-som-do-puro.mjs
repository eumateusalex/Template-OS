// A régua do som-do-puro.mjs: a conta das tags sobre um som.json sintético (cada defeito plantado
// reprova com o nome dele) e a peça mínima de ponta a ponta no Chromium de verdade (o modelo com os
// marcadores, os instantes expostos pela página depois de um atraso, WAVs gerados aqui).
//   node teste-som-do-puro.mjs
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { tagsDoSom, escreverEntreMarcadores, somDescolado, conferirSom } from './som-do-puro.mjs';
import { montarPuro } from './montar-puro.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
let testes = 0, falhas = 0;
const ok = (cond, msg) => { testes++; console.log(`${cond ? 'ok  ' : 'FALHA'} ${msg}`); if (!cond) falhas++; };
const attr = (tag, k) => (tag.match(new RegExp(`(?<![\\w-])${k}="([^"]*)"`)) || [])[1];
const doId = (tags, id) => tags.find((t) => attr(t, 'id') === id);

// ─── a conta ─────────────────────────────────────────────────────────────────
const PICOS = { 'clique.wav': 0.1, 'woosh.wav': 0.4, 'tecla-1.wav': 0.01, 'tecla-2.wav': 0.02 };
const DURS = { 'clique.wav': 0.5, 'woosh.wav': 1.0, 'tecla-1.wav': 0.1, 'tecla-2.wav': 0.1 };
const base = { instantes: { abre: 1.0, cubos: [2.0, 2.2, 2.4], digita: 3.0, fim: 4.9 }, duracao: 5, duracaoDe: (a) => DURS[a] };
const som = {
  picos: PICOS,
  trilha: { arquivo: 'musica.wav', media_start: 0.5, vol: 0.7, fade_in: 0.2, fade_out: 1.4, aprovada: '"essa serve" (teste)' },
  efeitos: [
    { id: 'abre', arquivo: 'woosh.wav', em: 'abre', mais: 0.05, vol: 0.2 },
    { id: 'fixo', arquivo: 'clique.wav', em: 0.6, vol: 0.1 },
    { id: 'cubo', arquivo: 'clique.wav', em: 'cubos', vol: 0.5 },
    { id: 'busca', arquivo: 'tecla', em: 'digita', letras: 'ab c', vol: 0.3 },
    { id: 'fim', arquivo: 'woosh.wav', em: 'fim', vol: 0.2 },
  ],
};
const { tags, efeitos } = tagsDoSom(som, base);
const tr = doId(tags, 'trilha');
ok(tr && attr(tr, 'data-papel') === 'trilha' && attr(tr, 'data-duration') === '5' && attr(tr, 'data-media-start') === '0.5' && attr(tr, 'data-fade-out') === '1.4' && attr(tr, 'src') === 'ativos/musica.wav',
  'a trilha sai com a duração da peça, o recorte, o volume e os fades do som.json');
ok(attr(doId(tags, 'sfx-abre'), 'data-start') === '0.65', `o efeito se posiciona pelo pico: 1,0 + 0,05 − 0,4 = 0,65 (${attr(doId(tags, 'sfx-abre'), 'data-start')})`);
ok(attr(doId(tags, 'sfx-fixo'), 'data-start') === '0.5', 'o "em" em número vale como instante em s (0,6 − 0,1 = 0,5)');
const cubos = ['sfx-cubo-0', 'sfx-cubo-1', 'sfx-cubo-2'].map((id) => doId(tags, id));
ok(cubos.every(Boolean) && cubos.map((t) => attr(t, 'data-start')).join(',') === '1.9,2.1,2.3' && cubos.map((t) => attr(t, 'data-volume')).join(',') === '0.5,0.46,0.42',
  `o instante em lista dá um clipe por item, com o volume descendo 8% a cada um (${cubos.map((t) => t && attr(t, 'data-volume')).join(', ')})`);
const teclas = tags.filter((t) => /sfx-busca-/.test(t));
ok(teclas.map((t) => attr(t, 'id')).join(',') === 'sfx-busca-0,sfx-busca-1,sfx-busca-3' && teclas.map((t) => attr(t, 'src')).join(',') === 'ativos/tecla-1.wav,ativos/tecla-2.wav,ativos/tecla-1.wav',
  `as letras dão uma tecla por letra, alternando os dois arquivos, e o espaço fica mudo (${teclas.map((t) => attr(t, 'id')).join(', ')})`);
ok(attr(teclas[2], 'data-start') === String(+(3 + 6 / 30 - 0.01).toFixed(3)), `a tecla da letra 3 cai 6 quadros depois do começo, menos o pico (${attr(teclas[2], 'data-start')})`);
ok(attr(doId(tags, 'sfx-fim'), 'data-duration') === '0.5', `o clipe que passa do fim é cortado no fim da peça (4,5 s + 1,0 s vira 0,5 s: ${attr(doId(tags, 'sfx-fim'), 'data-duration')})`);
ok(efeitos.length === tags.length - 1 && efeitos.find((e) => e.id === 'abre').pico === 1.05, 'os picos saem por efeito, no instante em que o pico cai (1,05 s)');

const erroDe = (s, b = base) => { try { tagsDoSom(s, b); return ''; } catch (e) { return e.message; } };
const com = (e) => ({ ...som, efeitos: [e] });
ok(/"sumiu" não existe/.test(erroDe(com({ id: 'x', arquivo: 'clique.wav', em: 'sumiu', vol: 1 }))), 'o instante que a peça não expõe reprova com o nome dele');
ok(/sem o pico de bumbo\.wav/.test(erroDe(com({ id: 'x', arquivo: 'bumbo.wav', em: 'abre', vol: 1 }))), 'o arquivo sem pico no som.json reprova');
ok(/antes do zero/.test(erroDe(com({ id: 'x', arquivo: 'woosh.wav', em: 0.2, vol: 1 }))), 'o pico que pede começar antes do zero reprova');
ok(/depois do fim/.test(erroDe(com({ id: 'x', arquivo: 'clique.wav', em: 5.5, vol: 1 }))), 'o efeito que começa depois do fim reprova');
ok(tagsDoSom({ ...som, trilha: undefined }, base).tags.every((t) => attr(t, 'data-papel') !== 'trilha'), 'sem trilha no som.json, só os efeitos');

const modelo = '<div id="root">\n    <!-- som: começo (gerado) -->\n    <audio id="velho"></audio>\n    <!-- som: fim -->\n    <div id="cena"></div>\n</div>';
const novo = escreverEntreMarcadores(modelo, ['<audio id="a"></audio>', '<audio id="b"></audio>']);
ok(novo === '<div id="root">\n    <!-- som: começo (gerado) -->\n    <audio id="a"></audio>\n    <audio id="b"></audio>\n    <!-- som: fim -->\n    <div id="cena"></div>\n</div>',
  'só o que está entre os marcadores muda, na indentação do marcador');
let erroMarca = ''; try { escreverEntreMarcadores('<div id="root"></div>', []); } catch (e) { erroMarca = e.message; }
ok(/marcadores do som/.test(erroMarca), 'o modelo sem os marcadores reprova');

// ─── a régua som: o efeito descolado da imagem  ──────
const pag = (ts) => `<div id="root">${ts.join('')}</div>`;
let d = somDescolado(som, base, pag(tags));
ok(d.erros.length === 0, `as tags da conta de agora passam (${d.erros.map((e) => e.msg).join(' | ') || 'nenhum erro'})`);
const velhos = tagsDoSom(som, { ...base, instantes: { ...base.instantes, fim: 4.2 } }).tags;
d = somDescolado(som, base, pag(velhos));
ok(d.erros.length === 1 && /sfx-fim começa em .*(-21 quadros)/.test(d.erros[0].msg), `o instante que mudou depois do som reprova com o id e os quadros (${d.erros.map((e) => e.msg).join(' | ')})`);
d = somDescolado(som, { ...base, instantes: { ...base.instantes, fim: 4.9 + 1 / 30 } }, pag(tags));
ok(d.erros.length === 0, '1 quadro de diferença ainda passa (o arredondamento do r3)');
d = somDescolado(som, base, pag(tags.filter((t) => !t.includes('sfx-abre'))));
ok(d.erros.length === 1 && /sfx-abre falta/.test(d.erros[0].msg), 'o efeito que sumiu da página reprova');
d = somDescolado(som, base, pag([...tags, '<audio id="sfx-orfao" data-start="1"></audio>']));
ok(d.erros.length === 1 && /sfx-orfao está na página/.test(d.erros[0].msg), 'o efeito que saiu do som.json e ficou na página reprova');
d = somDescolado(som, { ...base, instantes: {} }, pag(tags));
ok(d.erros.length === 1 && /não medida/.test(d.erros[0].msg), 'sem os instantes, não mediu e reprova');
// a trilha sem a aprovação do usuário reprova, e a peça sem cama de fundo também
d = somDescolado({ ...som, trilha: { ...som.trilha, aprovada: undefined } }, base, pag(tags));
ok(d.erros.length === 1 && /não tem a aprovação do usuário/.test(d.erros[0].msg), `a trilha sem a aprovação do usuário reprova (${d.erros.map((e) => e.msg).join(' | ').slice(0, 90)})`);
d = somDescolado({ ...som, trilha: { ...som.trilha, aprovada: '   ' } }, base, pag(tags));
ok(d.erros.length === 1, 'a aprovação em branco não vale');
d = somDescolado({ ...som, trilha: undefined }, base, pag(tags.filter((t) => !t.includes('id="trilha"'))));
ok(d.erros.length === 1 && /não tem cama de fundo/.test(d.erros[0].msg), `sem trilha (só os sons dos componentes), reprova (${d.erros.map((e) => e.msg).join(' | ').slice(0, 90) || 'nenhum erro'})`);
d = somDescolado(som, base, pag(tags));
ok(d.erros.length === 0, `com a cama aprovada e os efeitos no lugar, passa (${d.erros.map((e) => e.msg).join(' | ') || 'nenhum erro'})`);

// ─── de ponta a ponta, no Chromium ───────────────────────────────────────────
const tmp = mkdtempSync(join(tmpdir(), 'som-do-puro-'));
mkdirSync(join(tmp, 'fonte')); mkdirSync(join(tmp, 'ativos'));
// um WAV PCM de 16 bits, mono, de `dur` s
const wav = (dur, sr = 8000) => {
  const n = Math.round(dur * sr), b = Buffer.alloc(44 + 2 * n);
  b.write('RIFF', 0); b.writeUInt32LE(36 + 2 * n, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(sr, 24); b.writeUInt32LE(2 * sr, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(2 * n, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(8000 * Math.sin(i / 3)), 44 + 2 * i);
  return b;
};
for (const [a, d] of Object.entries({ 'musica.wav': 6, 'clique.wav': 0.5, 'woosh.wav': 1.0, 'tecla-1.wav': 0.1, 'tecla-2.wav': 0.1 })) writeFileSync(join(tmp, 'ativos', a), wav(d));
writeFileSync(join(tmp, 'plano.json'), JSON.stringify({ nome: 'teste', duracao: 5, cenas: [] }));
// a peça expõe os instantes 200 ms depois de carregar: a ferramenta espera por eles
writeFileSync(join(tmp, 'cena.js'), 'setTimeout(() => { window.__instantes = { abre: 1.0, cubos: [2.0, 2.2, 2.4], digita: 3.0, fim: 4.9 }; }, 200);');
const PAGINA = '<!doctype html><html><head><script src="plano.js"></script><script src="direcao.js"></script></head><body>\n  <div id="root" data-composition-id="main" data-duration="5">\n      <!-- som: começo -->\n      <!-- som: fim -->\n  </div>\n  <script src="cena.js"></script>\n</body></html>';
writeFileSync(join(tmp, 'fonte', 'pagina.html'), PAGINA);
writeFileSync(join(tmp, 'fonte', 'som.json'), JSON.stringify(som));
const roda = (...a) => spawnSync(process.execPath, [join(AQUI, 'som-do-puro.mjs'), tmp, ...a], { encoding: 'utf8', timeout: 60000 });

let r = roda('--direcao', 'B');
const pagina = readFileSync(join(tmp, 'fonte', 'pagina.html'), 'utf8');
const indice = readFileSync(join(tmp, 'index.html'), 'utf8');
const audios = pagina.match(/<audio\b[^>]*>/g) || [];
ok(r.status === 0 && audios.length === tags.length, `a peça mínima ganha os ${tags.length} <audio> no modelo (código ${r.status}${r.stderr ? ': ' + r.stderr.trim() : ''})`);
ok(attr(doId(audios, 'sfx-abre') || '', 'data-start') === '0.65' && attr(doId(audios, 'sfx-fim') || '', 'data-duration') === '0.5',
  'os instantes lidos da página e as durações medidas pelo ffprobe dão as mesmas tags da conta');
ok((indice.match(/<audio\b/g) || []).length === tags.length && indice.includes('window.DIR = "B"') && indice.includes('window.PLANO = {"nome":"teste"'),
  'o index.html sai montado de novo, pelo montar-puro.mjs ao lado, com o som, a letra e o plano');
const picos = existsSync(join(tmp, 'fonte', 'som-picos.json')) ? JSON.parse(readFileSync(join(tmp, 'fonte', 'som-picos.json'), 'utf8')) : {};
ok(picos.duracao === 5 && picos.efeitos?.length === efeitos.length, 'os picos ficam em som-picos.json, ao lado do som.json');
r = roda();
ok(r.status === 0 && readFileSync(join(tmp, 'fonte', 'pagina.html'), 'utf8') === pagina && readFileSync(join(tmp, 'index.html'), 'utf8').includes('window.DIR = "B"'),
  'rodar de novo, sem --direcao, dá o mesmo modelo e mantém a letra que o index.html tinha');
writeFileSync(join(tmp, 'fonte', 'som.json'), JSON.stringify(com({ id: 'x', arquivo: 'clique.wav', em: 'sumiu', vol: 1 })));
r = roda();
ok(r.status === 1 && /"sumiu" não existe/.test(r.stderr) && readFileSync(join(tmp, 'fonte', 'pagina.html'), 'utf8') === pagina,
  `o instante que não existe sai 1 e não toca no modelo (${r.stderr.trim()})`);
ok(spawnSync(process.execPath, [join(AQUI, 'som-do-puro.mjs')], { encoding: 'utf8' }).status === 2, 'sem a pasta mostra o uso e sai 2');
// a régua som na peça de verdade: o som gerado passa; o instante muda e só o montar-puro roda, reprova
writeFileSync(join(tmp, 'fonte', 'som.json'), JSON.stringify(som));
r = roda();
let c = await conferirSom(tmp);
ok(r.status === 0 && c.erros.length === 0, `a peça com o som gerado agora passa na régua som (${c.erros.map((e) => e.msg).join(' | ') || 'nenhum erro'})`);
writeFileSync(join(tmp, 'cena.js'), 'setTimeout(() => { window.__instantes = { abre: 1.7, cubos: [2.0, 2.2, 2.4], digita: 3.0, fim: 4.9 }; }, 200);');
montarPuro(tmp);
c = await conferirSom(tmp);
ok(c.erros.length === 1 && /sfx-abre/.test(c.erros[0].msg), `mudou o instante e só montou de novo: a régua som reprova (${c.erros.map((e) => e.msg).join(' | ')})`);
rmSync(join(tmp, 'fonte', 'som.json'));
c = await conferirSom(tmp);
ok(c.naoSeAplica && c.erros.length === 0, 'peça sem som.json: não se aplica');

rmSync(tmp, { recursive: true, force: true });
console.log(`\n# tests ${testes}\n# fail ${falhas}`);
process.exitCode = falhas ? 1 : 0;
