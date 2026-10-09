// A régua das ferramentas do /video. Roda em ~15 s, sem rede.
//
//   node .claude/skills/video/ferramentas/teste.mjs
//
// Precisa do ffmpeg e do ffprobe no PATH e do Python com numpy e Pillow.
//
// 1. medir_audio.py contra áudio sintético com resposta conhecida (120 e 150 BPM,
//    drop em 6,0 e 9,2 s, efeito com pico em 0,70 s); recorta_fundo.py num PNG
// 2. nova-peca.mjs: peça de cliente recebe SÓ o GSAP; peça deste workspace só nasce
//    com a marca fechada, e recebe a marca pela junção; nada sobrescreve peça
// 3. folhas.mjs num vídeo sintético: a folha, a tira e os quadros de celular saem
// 4. apagar-peca.mjs não atravessa a junção (a marca continua lá) e só aceita peça
// 5. marca-remotion.mjs: traduz o tokens.css certo, recusa marca aberta, e o
//    .claude/video/src/marca.ts do workspace é o que o gerador escreveria
// 6. o .gitignore do estúdio deixa de fora junção, render e node_modules
// 7. falar.mjs contra um dublê local da ElevenLabs (o WAV e o tempo de cada palavra),
//    e a regua-voz.mjs numa narração sintética: a que passa, e cada uma das 9 linhas
//    reprovando sozinha
//
// As peças com marca rodam numa raiz de mentira (pasta temporária com o GSAP e
// uma marca de teste): a régua não depende de a marca do workspace estar feita.
import { execFileSync, spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, existsSync, readFileSync, rmSync, rmdirSync, lstatSync, readdirSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { novaPeca, estadoDaMarca, RAIZ, REGISTRO } from './nova-peca.mjs';
import { lerChaves, apiPermitida } from './falar.mjs';
import { reguaVoz, reguaDaPeca, instante } from './regua-voz.mjs';
import { folhas } from './folhas.mjs';
import { apagarPeca } from './apagar-peca.mjs';
import { lerTokens, gerarMarcaTs, marcaDoWorkspace, destino } from './marca-remotion.mjs';
import { exigirPeca } from '../../../../scripts/terceiros/peca.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
let falhas = 0;
const ok = (cond, msg) => { console.log(`${cond ? 'ok  ' : 'FALHA'} ${msg}`); if (!cond) falhas++; };
const perto = (a, b, tol) => Math.abs(a - b) <= tol;
const tmp = mkdtempSync(join(tmpdir(), 'video-teste-'));
const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args]);
const erroDe = (f) => { try { f(); return ''; } catch (e) { return e.message; } };

// o GSAP de verdade mora fora do git: sem ele instalado, a régua para aqui e diz o comando
try { exigirPeca('gsap-biblioteca'); } catch (e) { console.log(`FALHA ${e.message}`); rmSync(tmp, { recursive: true, force: true }); process.exit(1); }

// a raiz de mentira: o GSAP de verdade e a pasta da marca, que cada caso preenche
const falsa = join(tmp, 'workspace');
const marcaFalsa = join(falsa, '.claude', 'skills', 'carrossel', 'marca');
mkdirSync(join(falsa, '.claude', 'video', 'html', '_vendor'), { recursive: true });
mkdirSync(marcaFalsa, { recursive: true });
for (const f of ['gsap.min.js', 'CustomEase.min.js']) copyFileSync(join(RAIZ, '.claude', 'video', 'html', '_vendor', f), join(falsa, '.claude', 'video', 'html', '_vendor', f));
const TOKENS = `/* tokens de teste */\n@import url('https://fonts.googleapis.com/css2?family=Fonte+Teste:wght@400;700&display=swap');\n:root{\n  --c-dark: 10,20,30;\n  --c-light: 250,249,245;\n  --c-accent: 200,100,0;\n  --c-support-1: 60,60,70;\n  --c-support-2: 230,230,228;\n  --c-rare: 90,90,90;\n  --c-abyss: 5,5,8;\n  --c-ok: 140,190,150;\n  --f-display: 'Fonte Teste', Arial, sans-serif;\n  --f-serif: Georgia, serif;\n  --f-mono: Consolas, monospace;\n  --w-display-bold: 700;\n  --w-display-med: 500;\n  --w-mono-med: 600;\n  --bg-light: rgb(var(--c-light));\n}\n`;

try {
  // 1 · o medidor de áudio
  const a120 = join(tmp, 'a120.wav'), a150 = join(tmp, 'a150.wav'), fx = join(tmp, 'fx.wav');
  ff(['-f', 'lavfi', '-i', "aevalsrc='0.6*sin(2*PI*1000*t)*lt(mod(t-0.25\\,0.5)\\,0.03)+0.8*sin(2*PI*60*t)*gte(t\\,6)':s=22050:d=12", a120]);
  ff(['-f', 'lavfi', '-i', "aevalsrc='0.6*sin(2*PI*1000*t)*lt(mod(t\\,0.4)\\,0.03)+0.8*sin(2*PI*60*t)*gte(t\\,9.2)':s=22050:d=14", a150]);
  ff(['-f', 'lavfi', '-i', "aevalsrc='0.9*sin(2*PI*800*t)*exp(-30*abs(t-0.7))':s=22050:d=1.5", fx]);
  const mede = (modo, arq) => JSON.parse(execFileSync('python', [join(AQUI, 'medir_audio.py'), modo, arq]).toString().trim().split('\n')[0]);
  const m1 = mede('musica', a120), m2 = mede('musica', a150), e1 = mede('efeito', fx);
  ok(perto(m1.bpm, 120, 1) && perto(m1.drop_s, 6.0, 0.1), `120 BPM e drop em 6,0 s (medido ${m1.bpm} e ${m1.drop_s})`);
  ok(perto(m1.primeira_batida_s, 0.25, 0.03), `primeira batida em 0,25 s (medido ${m1.primeira_batida_s})`);
  ok(perto(m2.bpm, 150, 1) && perto(m2.drop_s, 9.2, 0.1), `150 BPM e drop em 9,2 s (medido ${m2.bpm} e ${m2.drop_s})`);
  ok(perto(e1.pico_s, 0.7, 0.04), `pico do efeito em 0,70 s (medido ${e1.pico_s})`);
  // andamento que não cai na grade de 20 ms (o teste do zero achou 130,4 onde era 127,7)
  const a127 = join(tmp, 'a127.wav');
  ff(['-f', 'lavfi', '-i', "aevalsrc='0.6*sin(2*PI*1000*t)*lt(mod(t\\,0.46984)\\,0.03)':s=22050:d=20", a127]);
  const m3 = mede('musica', a127);
  ok(perto(m3.bpm, 127.7, 0.5), `127,7 BPM sem arredondar para a grade (medido ${m3.bpm})`);
  // faixa que nasce do silêncio: a entrada no 0,5 s é a MAIOR subida da faixa e não pode virar o drop
  const silencio = join(tmp, 'silencio.wav');
  ff(['-f', 'lavfi', '-i', "aevalsrc='gte(t\\,0.5)*(0.3*sin(2*PI*1000*t)*lt(mod(t\\,0.5)\\,0.03)+0.6*sin(2*PI*60*t))+0.4*sin(2*PI*60*t)*gte(t\\,8)':s=22050:d=14", silencio]);
  const m4 = mede('musica', silencio);
  ok(perto(m4.drop_s, 8.0, 0.15), `drop em 8,0 s mesmo com a faixa nascendo do silêncio (medido ${m4.drop_s}, lista ${m4.drops_s})`);
  // acerto: um efeito mixado sobre a música, com pico em 3,0 s
  const mus = join(tmp, 'mus.wav'), mix = join(tmp, 'mix.wav');
  const expr = '0.6*sin(2*PI*1000*t)*lt(mod(t\\,0.5)\\,0.03)+0.3*sin(2*PI*80*t)';
  ff(['-f', 'lavfi', '-i', `aevalsrc='${expr}':s=22050:d=6`, mus]);
  ff(['-f', 'lavfi', '-i', `aevalsrc='0.5*(${expr})+0.9*sin(2*PI*700*t)*exp(-40*abs(t-3))':s=22050:d=6`, mix]);
  let saidaAcerto = '';
  try { saidaAcerto = execFileSync('python', [join(AQUI, 'medir_audio.py'), 'acerto', mix, mus, '--inicio', '0', '--volume', '0.5', '--alvos', '3.0']).toString(); } catch (e) { saidaAcerto = String(e.stdout || e); }
  const ac = JSON.parse(saidaAcerto.trim().split('\n')[0]);
  ok(ac.ok && Math.abs(ac.erro_quadros) <= 0.5, `acerto: efeito mixado achado em 3,0 s (erro ${ac.erro_ms} ms)`);

  // 1b · o recorte de fundo: some o branco ligado à borda, fica o branco de dentro
  const png = join(tmp, 'ilustra.png'), recorte = join(tmp, 'ilustra-recorte.png');
  ff(['-f', 'lavfi', '-i', 'color=white:s=200x200', '-vf', 'drawbox=x=50:y=50:w=100:h=100:color=black:t=12', '-frames:v', '1', png]);
  execFileSync('python', [join(AQUI, 'recorta_fundo.py'), png, recorte]);
  const alfa = (x, y) => Number(execFileSync('python', ['-c', `from PIL import Image;print(Image.open(r'${recorte}').split()[3].getpixel((${x},${y})))`]).toString().trim());
  ok(alfa(5, 5) === 0 && alfa(100, 100) === 255 && alfa(56, 100) === 255, `recorte de fundo: o fundo some, o branco de dentro e o traço ficam (quina ${alfa(5, 5)}, dentro ${alfa(100, 100)})`);

  // 2 · peça de cliente ou de projeto: a marca é a do dono
  const fora = join(tmp, 'cliente-x', 'video', 'reel-teste');
  novaPeca('reel-teste', { em: fora, raiz: falsa });
  ok(existsSync(join(fora, '_vendor', 'gsap.min.js')), 'peça de cliente: o GSAP chega pela junção _vendor');
  ok(!existsSync(join(fora, '_marca')), 'peça de cliente: a marca deste workspace NÃO entra');
  const html = readFileSync(join(fora, 'index.html'), 'utf8');
  ok(html.includes('src="_vendor/gsap.min.js"') && !html.includes('_marca/'), 'peça de cliente: o index.html aponta para _vendor e não para a marca daqui');
  ok(!html.includes('{{') && !html.includes('<!--MARCA-->'), 'o modelo não deixa marcador por substituir');
  const aviso = (html.match(/<!-- a marca desta peça[^]*?-->/) || [''])[0];
  const usados = [...new Set([...html.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]))];
  ok(usados.length > 0 && usados.every((t) => aviso.includes(t)), `peça de cliente: o aviso lista todo token que o esqueleto usa (${usados.join(', ')})`);
  const estilo = (html.match(/<style>([^]*?)<\/style>/) || ['', ''])[1];
  ok(!/#[0-9a-f]{3,8}\b|rgba?\(\s*\d/i.test(estilo) && !/var\(--[a-z0-9-]+\s*,/.test(estilo), 'o esqueleto não escreve cor à mão nem tem cor de reserva: tudo sai da marca');
  ok(!html.includes('id="grade"'), 'o esqueleto não impõe textura de fundo (a linguagem é escolha do usuário)');
  const gi = readFileSync(join(fora, '.gitignore'), 'utf8').split(/\r?\n/);
  ok(['_vendor', 'ativos/*.wav', 'snapshots', 'renders'].every((l) => gi.includes(l)), 'peça de cliente: .gitignore cobre a junção, o áudio e os renders');
  const roteiroFora = readFileSync(join(fora, 'roteiro.md'), 'utf8');
  ok(/^\| O filme numa frase \|/m.test(roteiroFora) && /^\| Cena \| Quadros \| Voz \| Texto \|/m.test(roteiroFora),
    'o roteiro nasce com o filme numa frase e a coluna da voz nas batidas (a voz e a tela se conferem no papel, antes do código)');
  ok(/já tem index.html/.test(erroDe(() => novaPeca('reel-teste', { em: fora, raiz: falsa }))), 'recusa sobrescrever peça existente');
} catch (e) {
  ok(false, `erro inesperado: ${e.stack}`);
}

try {
  // 2b · peça deste workspace: só com a marca fechada
  const noEstudio = join(falsa, '.claude', 'video', 'html', 'reel-casa');
  const pede = () => erroDe(() => novaPeca('reel-casa', { cwd: falsa, raiz: falsa }));
  let e = pede();
  ok(/não está fechada/.test(e) && /tokens\.css/.test(e) && !existsSync(noEstudio), `sem tokens.css, a peça não nasce (${e.slice(0, 90)}...)`);
  writeFileSync(join(marcaFalsa, 'tokens.css'), '/* ESTADO: nao-configurado */\n' + TOKENS);
  writeFileSync(join(marcaFalsa, 'marca.md'), '# Marca\n\nLogo: sem logo.\n');
  e = pede();
  ok(/não está fechada/.test(e) && !existsSync(noEstudio), 'tokens.css ainda no molde (ESTADO: nao-configurado): a peça não nasce');
  writeFileSync(join(marcaFalsa, 'tokens.css'), TOKENS);
  rmSync(join(marcaFalsa, 'marca.md'));
  ok(estadoDaMarca(falsa).fechada, 'o sinal é só o tokens.css: sem o marcador, a marca está fechada mesmo sem o marca.md');
  writeFileSync(join(marcaFalsa, 'marca.md'), '# Marca\n\nLogo: sem logo.\n');
  const r2 = novaPeca('reel-casa', { cwd: falsa, raiz: falsa });
  ok(r2.pasta === noEstudio && existsSync(join(noEstudio, '_marca', 'tokens.css')) && existsSync(join(noEstudio, '_vendor', 'gsap.min.js')), 'peça deste workspace: nasce no estúdio, com a marca e o GSAP pelas junções');
  ok(lstatSync(join(noEstudio, '_marca')).isSymbolicLink(), 'a junção da marca é link, não pasta copiada');
  ok(readFileSync(join(noEstudio, 'index.html'), 'utf8').includes('href="_marca/tokens.css"'), 'peça deste workspace: o index.html carrega o tokens.css da marca');
  const cli = join(falsa, 'clientes', 'padaria');
  mkdirSync(cli, { recursive: true });
  e = erroDe(() => novaPeca('reel-cliente', { cwd: cli, raiz: falsa }));
  ok(/--em/.test(e) && !existsSync(join(falsa, '.claude', 'video', 'html', 'reel-cliente')), 'de dentro de clientes/, sem --em, recusa em vez de pôr a marca daqui na peça do cliente');
  const rasc = join(falsa, 'rascunho', 'teste-marca');
  novaPeca('teste-marca', { em: rasc, comMarca: true, raiz: falsa });
  ok(existsSync(join(rasc, '_marca', 'tokens.css')) && readFileSync(join(rasc, '.gitignore'), 'utf8').split(/\r?\n/).includes('_marca'), '--com-marca fora do estúdio: a marca chega e a junção fica fora do git');
  ok(/nome/.test(erroDe(() => novaPeca('Nome Ruim', { raiz: falsa }))), 'nome com maiúscula ou espaço é recusado');

  // 3 · as folhas
  const vid = join(tmp, 'v.mp4');
  ff(['-f', 'lavfi', '-i', 'testsrc=size=1080x1920:rate=30:duration=6', '-pix_fmt', 'yuv420p', vid]);
  const saidas = folhas(vid, join(tmp, 'folhas'), { rapidos: [2] });
  ok(saidas.length === 10 && saidas.every((f) => existsSync(f)), `folhas: folha, 1 tira e 8 quadros de celular (${saidas.length} arquivos)`);

  // 4 · apagar a peça não atravessa a junção
  const r4 = apagarPeca(noEstudio, { raiz: falsa });
  ok(r4.removidos.length === 2 && !existsSync(noEstudio), 'apagar-peca: tira as duas junções e apaga a pasta da peça');
  ok(existsSync(join(marcaFalsa, 'tokens.css')) && existsSync(join(falsa, '.claude', 'video', 'html', '_vendor', 'gsap.min.js')), 'depois de apagar a peça, a marca e o GSAP continuam existindo');
  ok(/pasta do workspace/.test(erroDe(() => apagarPeca(join(RAIZ, '.claude', 'skills', 'carrossel', 'marca')))), 'apagar-peca recusa a pasta da marca do workspace');
  ok(/pasta do workspace/.test(erroDe(() => apagarPeca(join(falsa, 'rascunho'), { raiz: falsa }))), 'apagar-peca recusa rascunho/ inteiro');
  const r5 = apagarPeca(join(tmp, 'cliente-x', 'video', 'reel-teste'), { soJuncoes: true });
  ok(r5.removidos.length === 1 && existsSync(join(tmp, 'cliente-x', 'video', 'reel-teste', 'index.html')), 'apagar-peca --so-juncoes: tira a junção e deixa a peça');
  apagarPeca(rasc, { raiz: falsa });
  ok(!existsSync(rasc) && existsSync(join(marcaFalsa, 'tokens.css')), 'apagar a peça de teste em rascunho/ não apaga a marca');

  // a peça pode morar fora do estúdio: o apagador só aceita pasta que é peça
  const repo = join(tmp, 'outro-repo');
  mkdirSync(join(repo, '.git'), { recursive: true });
  writeFileSync(join(repo, 'hyperframes.json'), '{}');
  const eRepo = erroDe(() => apagarPeca(repo));
  ok(/repositório/.test(eRepo) && existsSync(join(repo, '.git')), 'apagar-peca recusa pasta com .git, mesmo com hyperframes.json');
  const semPeca = join(tmp, 'nao-e-peca');
  mkdirSync(semPeca);
  ok(/não é peça/.test(erroDe(() => apagarPeca(semPeca))) && existsSync(semPeca), 'apagar-peca recusa pasta sem hyperframes.json');
  const eFora = erroDe(() => novaPeca('reel-fora', { cwd: repo }));
  ok(/--em/.test(eFora) && !existsSync(join(RAIZ, '.claude', 'video', 'html', 'reel-fora')), 'fora do workspace, nova-peca sem --em recusa em vez de criar no estúdio');

  // chamada por um link (a skill levada para outro lugar): o script tem que rodar,
  // não sair calado; o caminho digitado e o real diferem
  const pelaJuncao = join(tmp, 'skill-pela-juncao');
  symlinkSync(dirname(AQUI), pelaJuncao, 'junction');
  const roda = (script, args) => {
    try { execFileSync('node', [join(pelaJuncao, 'ferramentas', script), ...args], { cwd: repo, stdio: 'pipe' }); return { codigo: 0, erro: '' }; }
    catch (x) { return { codigo: x.status, erro: String(x.stderr) }; }
  };
  const n1 = roda('nova-peca.mjs', ['reel-juncao']);
  ok(n1.codigo === 1 && /--em/.test(n1.erro), `nova-peca por link roda e recusa sem --em (código ${n1.codigo})`);
  const a1 = roda('apagar-peca.mjs', [join(tmp, 'nao-existe')]);
  ok(a1.codigo === 1 && /não existe/.test(a1.erro), `apagar-peca por link roda (código ${a1.codigo})`);
  const f1 = roda('folhas.mjs', []);
  ok(f1.codigo !== 0, `folhas por link roda e cobra os argumentos (código ${f1.codigo})`);

  // 5 · a marca no Remotion
  const t = lerTokens(TOKENS);
  ok(t.cor.principal === '#0a141e' && t.cor.clara === '#faf9f5' && t.cor.acento === '#c86400', `marca-remotion: canais R,G,B viram o hex certo (${t.cor.principal}, ${t.cor.clara}, ${t.cor.acento})`);
  ok(t.fonte.display.startsWith("'Fonte Teste'") && t.familias[0] === 'Fonte Teste' && t.peso.displayForte === 700 && t.folhas.length === 1, 'marca-remotion: as famílias, os pesos e a folha de fonte saem do tokens.css');
  ok(/--c-accent/.test(erroDe(() => lerTokens(TOKENS.replace(/--c-accent[^;]*;/, '')))), 'marca-remotion: cor faltando no tokens.css para com o nome do token');
  const ts = gerarMarcaTs(t);
  ok(ts.includes('MARCA_CONFIGURADA: boolean = true') && ts.includes('"#0a141e"') && ts.includes('fonts.googleapis.com'), 'marca-remotion: o marca.ts gerado leva as cores e a folha de fonte');
  ok(marcaDoWorkspace(join(tmp, 'sem-marca')).dados === null, 'marca-remotion: sem marca fechada não há o que gerar');
  const real = marcaDoWorkspace();
  const atual = existsSync(destino()) ? readFileSync(destino(), 'utf8') : '';
  const esperado = gerarMarcaTs(real.dados);
  if (atual === esperado) ok(true, `o marca.ts do estúdio é o que o gerador escreve (${real.dados ? 'com a marca' : 'marca não configurada'})`);
  else if (real.dados) console.log('AVISO o marca.ts do estúdio está atrás do tokens.css: rode node .claude/skills/video/ferramentas/marca-remotion.mjs antes da próxima peça Remotion');
  else ok(false, 'o marca.ts do estúdio foi editado à mão: refaça pelo gerador');

  // 7 · a voz (falar.mjs, ElevenLabs) contra um dublê local da API: nenhuma rede
  // de fora. Roda pela linha de comando, como a skill manda, para medir o que vai
  // para a tela. O dublê devolve um MP3 de verdade: 1 s de tom entre 0,3 s de
  // silêncio de cada lado, para medir a conversão e o corte das pontas.
  const CHAVE = 'sk-segredo-de-teste-123';
  const VOZ = 'VozDeTeste123';
  const envVoz = join(tmp, 'env-voz');
  writeFileSync(envVoz, `OUTRA_CHAVE=nao-pode-ser-lida\nELEVENLABS="${CHAVE}"\n`);
  const envSem = join(tmp, 'env-sem');
  writeFileSync(envSem, 'OUTRA_CHAVE=nao-pode-ser-lida\n');
  const lidas = lerChaves(envVoz);
  ok(lidas.ELEVENLABS === CHAVE && Object.keys(lidas).length === 1, 'falar: do .env só sai a ELEVENLABS');
  ok(/só aceita endereço local/.test(erroDe(() => apiPermitida('https://outro-servidor.example'))), 'falar: a chave não pode ir para outro servidor');
  const mp3Dublê = join(tmp, 'dubla.mp3');
  ff(['-f', 'lavfi', '-i', "aevalsrc='0.5*sin(2*PI*440*t)*between(t\\,0.3\\,1.3)':s=44100:d=1.6", '-c:a', 'libmp3lame', '-b:a', '128k', mp3Dublê]);
  const pedidos = [];
  const dubla = createServer((req, res) => {
    let corpo = '';
    req.on('data', (c) => { corpo += c; });
    req.on('end', () => {
      const p = { url: req.url, chave: req.headers['xi-api-key'], corpo: JSON.parse(corpo) };
      pedidos.push(p);
      if (p.corpo.text.includes('provoca erro')) { res.writeHead(401); res.end(`chave invalida: ${p.chave}`); return; }
      // o with-timestamps: o MP3 em base64 e um caractere a cada 1/n s dentro do 1 s de tom
      const chars = [...p.corpo.text], passo = 1 / chars.length;
      const alignment = { characters: chars, character_start_times_seconds: chars.map((c, i) => 0.3 + i * passo), character_end_times_seconds: chars.map((c, i) => 0.3 + (i + 1) * passo) };
      res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ audio_base64: readFileSync(mp3Dublê).toString('base64'), alignment }));
    });
  });
  await new Promise((r) => dubla.listen(0, '127.0.0.1', r));
  const api = `http://127.0.0.1:${dubla.address().port}`;
  const fala = (args) => new Promise((r) => {
    const p = spawn('node', [join(AQUI, 'falar.mjs'), ...args]);
    let saida = '';
    p.stdout.on('data', (c) => { saida += c; });
    p.stderr.on('data', (c) => { saida += c; });
    p.on('close', (codigo) => r({ codigo, saida }));
  });
  const pecaVoz = join(tmp, 'peca-voz');
  mkdirSync(pecaVoz);
  const frase = join(tmp, 'frase.txt');
  const FRASE = `Don't "travar": it's O'Brien's café, com acento e "aspas".`;
  writeFileSync(frase, FRASE);
  const base = ['--texto-de', frase, '--peca', pecaVoz, '--voz', VOZ, '--api', api];
  const wav = join(pecaVoz, 'ativos', 'voz.wav');
  const v0 = await fala([...base, '--env', envVoz]);
  ok(v0.codigo === 0 && new RegExp(`${[...FRASE].length} créditos`).test(v0.saida) && pedidos.length === 0 && !existsSync(wav), 'falar sem --confirmo: mostra os créditos e não chama a API');
  const v1 = await fala([...base, '--env', envVoz, '--confirmo']);
  const p1 = pedidos[0] || { corpo: {} };
  const seg = existsSync(wav) ? Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav]).toString().trim()) : 0;
  ok(v1.codigo === 0 && perto(seg, 1.0, 0.1) && !existsSync(join(pecaVoz, 'ativos', 'voz.mp3')), `falar --confirmo: grava o WAV na pasta da peça, sem o silêncio das pontas e sem sobrar o MP3 (${seg} s, código ${v1.codigo})`);
  ok(p1.corpo.text === FRASE, 'falar: fala com apóstrofo, aspas e acento chega inteira à API');
  ok(p1.chave === CHAVE && p1.url.startsWith(`/v1/text-to-speech/${VOZ}/with-timestamps?`) && p1.corpo.model_id === 'eleven_v4' && p1.corpo.language_code === 'pt', 'falar: manda a chave no cabeçalho xi-api-key, a voz no endereço (com o tempo dos caracteres), o modelo e o idioma');
  const arqPal = join(pecaVoz, 'ativos', 'voz.palavras.json');
  const pal = existsSync(arqPal) ? JSON.parse(readFileSync(arqPal, 'utf8')) : [];
  const ditas = FRASE.split(/\s+/);
  ok(pal.length === ditas.length && pal.map((p) => p.palavra).join(' ') === FRASE && pal[0].inicio === 0 && pal.every((p, i) => p.fim > p.inicio && p.fim <= seg + 0.001 && (i === 0 || p.inicio >= pal[i - 1].fim)),
    `falar: grava o tempo de cada palavra ao lado do WAV, do zero no primeiro som até o fim do áudio (${pal.length} de ${ditas.length} palavras)`);
  // o tempo da palavra é o das letras: as aspas e os dois-pontos de '"travar":' não contam
  const passoDub = 1 / [...FRASE].length, ms = (x) => Math.round(x * 1000) / 1000, iT = FRASE.indexOf('travar');
  ok(pal[1] && pal[1].inicio === ms(iT * passoDub) && pal[1].fim === ms((iT + 6) * passoDub),
    `falar: o começo e o fim da palavra vêm da primeira e da última letra, sem a pontuação colada (${JSON.stringify(pal[1])})`);
  const v2 = await fala(['--texto-de', (writeFileSync(join(tmp, 'erro.txt'), 'isto provoca erro'), join(tmp, 'erro.txt')), '--peca', pecaVoz, '--voz', VOZ, '--api', api, '--env', envVoz, '--confirmo']);
  ok(v2.codigo === 1 && /401/.test(v2.saida) && /\*\*\*/.test(v2.saida), 'falar: erro da API aparece com a chave mascarada');
  const v6 = await fala([...base, '--env', envVoz, '--confirmo', '--janela', '0.5', '--saida', 'ativos/longa.wav']);
  const v7 = await fala([...base, '--env', envVoz, '--confirmo', '--janela', '2', '--saida', 'ativos/cabe.wav']);
  ok(v6.codigo === 1 && /janela é de 0.5 s/.test(v6.saida) && v7.codigo === 0, 'falar --janela: recusa a fala que não cabe na batida e aceita a que cabe');
  ok(![v0, v1, v2, v6, v7].some((v) => v.saida.includes(CHAVE)), 'falar: a chave não aparece em nenhuma saída (conta, sucesso, erro, janela)');
  const nPedidos = pedidos.length;
  const v3 = await fala([...base, '--env', envSem, '--confirmo']);
  ok(v3.codigo === 1 && /crie a conta em https:\/\/elevenlabs\.io/.test(v3.saida) && /scripts\/\.env/.test(v3.saida) && pedidos.length === nPedidos, 'falar sem a chave: diz o passo a passo e não chama a API');
  const v4 = await fala([...base, '--saida', '../fora.wav', '--env', envVoz, '--confirmo']);
  const v5 = await fala([...base, '--saida', join(tmp, 'absoluto.wav'), '--env', envVoz, '--confirmo']);
  ok(v4.codigo === 1 && v5.codigo === 1 && /fora da pasta da peça/.test(v4.saida + v5.saida) && !existsSync(join(tmp, 'fora.wav')) && !existsSync(join(tmp, 'absoluto.wav')) && pedidos.length === nPedidos, 'falar: recusa gravar fora da pasta da peça (relativo com .. e absoluto), sem chamar a API');
  const v8 = await fala(['--texto-de', frase, '--peca', pecaVoz, '--voz', '../../x', '--api', api, '--env', envVoz, '--confirmo']);
  ok(v8.codigo === 1 && /--voz/.test(v8.saida) && pedidos.length === nPedidos, 'falar: id de voz que não é só letra e número é recusado (nada entra no endereço)');
  await new Promise((r) => dubla.close(r));

  // 7b · a régua da voz. Uma narração sintética de 25,7 s que passa em tudo (a palavra a cada 0,4 s,
  // 0,31 s entre as falas, "site" em 1,7 s, "24" em 4,5 s, "saiba" em 21,4 s, 140 palavras por minuto),
  // e depois uma mudança por vez, cada uma reprovando só a linha dela
  {
    const enche = (n) => Array.from({ length: n }, (_, i) => `palavra${i}`);
    const falaDe = (ws) => ws.map((w, i) => ({ palavra: w, inicio: +(i * 0.4).toFixed(3), fim: +(i * 0.4 + 0.32).toFixed(3) }));
    const w1 = ['eu', 'faço', 'o', 'seu', 'site,', 'e', 'coloco', 'no', 'ar', 'em', 'até', '24', 'horas.', ...enche(12)];
    const w2 = enche(25);
    const w3 = ['clica', 'em', 'saiba', 'mais:', 'o', 'seu', 'site', 'no', 'ar', 'amanhã.'];
    const base = () => ({
      duracao: 25.7,
      regua: { produto: ['f1', 'site'], oferta: ['f1', '24'], chamada: ['f3', 'saiba'] },
      falas: [{ id: 'f1', em: 3, texto: w1.join(' ') }, { id: 'f2', em: 310, texto: w2.join(' ') }, { id: 'f3', em: 617, texto: w3.join(' ') }],
    });
    const palavras = { f1: falaDe(w1), f2: falaDe(w2), f3: falaDe(w3) };
    const reprovadas = (laudo) => laudo.linhas.filter((l) => !l.ok).map((l) => l.nome).join(', ') || 'nenhuma';
    const v0r = reguaVoz({ narracao: base(), palavras });
    ok(v0r.ok && v0r.linhas.length === 9, `régua da voz: a narração boa passa nas 9 linhas (reprovadas: ${reprovadas(v0r)})`);
    const n1 = base(); n1.falas[1].em = 322; // a segunda fala 0,71 s depois da primeira
    ok(reprovadas(reguaVoz({ narracao: n1, palavras })) === 'pausa entre falas', `régua da voz: 0,7 s entre duas falas reprova só a pausa (${reprovadas(reguaVoz({ narracao: n1, palavras }))})`);
    const w2b = [...enche(9), ...w1.slice(4, 20)]; // as mesmas 25 palavras, com "site" na décima
    const n2 = base(); n2.falas[0].texto = w2b.join(' '); const p2 = { ...palavras, f1: falaDe(w2b) };
    ok(reprovadas(reguaVoz({ narracao: n2, palavras: p2 })) === 'o produto dito', `régua da voz: "site" dito em 3,7 s reprova só o produto (${reprovadas(reguaVoz({ narracao: n2, palavras: p2 }))})`);
    const n3 = base(); n3.regua.chamada = ['f1', 'eu'];
    ok(reprovadas(reguaVoz({ narracao: n3, palavras })) === 'a chamada dita', `régua da voz: a chamada fora dos últimos 5 s reprova só ela (${reprovadas(reguaVoz({ narracao: n3, palavras }))})`);
    const n4 = base(); n4.falas[1].texto = enche(65).join(' '); // 98 palavras em 25,7 s: 230 por minuto
    ok(reprovadas(reguaVoz({ narracao: n4, palavras })) === 'ritmo', `régua da voz: 230 palavras por minuto reprova só o ritmo (${reprovadas(reguaVoz({ narracao: n4, palavras }))})`);
    // a última fala dita depressa (uma palavra a cada 0,2 s): a voz acaba em 22,5 s e a tela fica 3,2 s parada
    const p5 = { ...palavras, f3: w3.map((w, i) => ({ palavra: w, inicio: +(i * 0.2).toFixed(3), fim: +(i * 0.2 + 0.16).toFixed(3) })) };
    ok(reprovadas(reguaVoz({ narracao: base(), palavras: p5 })) === 'tela final depois da voz', `régua da voz: 3,2 s de tela parada no fim reprova só o fecho (${reprovadas(reguaVoz({ narracao: base(), palavras: p5 }))})`);
    // 1,7 s de silêncio no meio da segunda fala, que corre depois para acabar no mesmo lugar
    const p6 = { ...palavras, f2: falaDe(w2).map((p, i) => (i >= 10 ? { ...p, inicio: +(5.6 + (i - 10) * 0.28).toFixed(3), fim: +(5.82 + (i - 10) * 0.28).toFixed(3) } : p)) };
    ok(reprovadas(reguaVoz({ narracao: base(), palavras: p6 })) === 'maior silêncio', `régua da voz: 1,7 s de silêncio no meio da fala reprova só o silêncio (${reprovadas(reguaVoz({ narracao: base(), palavras: p6 }))})`);
    // a pausa se mede do fim do som: a ElevenLabs estica o último caractere além do som. Aqui o fim da
    // última palavra da primeira fala vem esticado 0,4 s, e o áudio dela acaba em 9,7 s: a pausa real
    // até a segunda fala é 0,63 s
    const p9 = { ...palavras, f1: falaDe(w1).map((p, i, l) => (i === l.length - 1 ? { ...p, fim: p.fim + 0.4 } : p)) };
    const soPalavra = reguaVoz({ narracao: base(), palavras: p9 });
    const peloSom = reguaVoz({ narracao: base(), palavras: p9, duracoes: { f1: 9.6, f2: 9.92, f3: 3.92 } });
    ok(soPalavra.ok && reprovadas(peloSom) === 'pausa entre falas',
      `régua da voz: com o fim do som medido, a pausa de 0,63 s que a palavra esticada escondia reprova (sem o som: ${reprovadas(soPalavra)}; com: ${reprovadas(peloSom)})`);
    const n10 = base(); n10.falas[0].em = 18; // a primeira palavra em 0,6 s
    ok(reprovadas(reguaVoz({ narracao: n10, palavras })) === 'abertura', `régua da voz: a voz que começa em 0,6 s reprova só a abertura (${reprovadas(reguaVoz({ narracao: n10, palavras }))})`);
    const n11 = base(); n11.regua.oferta = ['f2', 'palavra0']; // a oferta em 10,3 s
    ok(reprovadas(reguaVoz({ narracao: n11, palavras })) === 'a oferta com número dita', `régua da voz: a oferta dita em 10,3 s reprova só ela (${reprovadas(reguaVoz({ narracao: n11, palavras }))})`);
    // 36 s com a voz até o fim: a segunda fala com 51 palavras, a terceira em 30,9 s; 86 palavras, 143 por minuto
    const w12 = enche(51);
    const n12 = base(); n12.duracao = 36; n12.falas[1].texto = w12.join(' '); n12.falas[2].em = 926;
    const p12 = { ...palavras, f2: falaDe(w12) };
    ok(reprovadas(reguaVoz({ narracao: n12, palavras: p12 })) === 'duração', `régua da voz: 36 s reprova só a duração (${reprovadas(reguaVoz({ narracao: n12, palavras: p12 }))})`);
    const n7 = base(); delete n7.regua;
    ok(reguaVoz({ narracao: n7, palavras }).linhas.length === 4, 'régua da voz: sem "regua" (peça que não é anúncio), só as 4 linhas de toda voz');
    const faltou = erroDe(() => { const n8 = base(); n8.regua.oferta = ['f1', 'trinta']; reguaVoz({ narracao: n8, palavras }); });
    ok(/não está na fala f1/.test(faltou), `régua da voz: palavra que a voz não diz quebra em vez de passar (${faltou || 'passou'})`);
    ok(Math.abs(instante(v0r.tempos, ['f1', 'ate']) - 4.1) < 0.001 && Math.abs(instante(v0r.tempos, ['f3', 'seu']) - (617 / 30 + 2)) < 0.001,
      'régua da voz: acha a palavra sem acento e sem pontuação ("ate" acha "até"), no tempo do vídeo');
    // a pasta da peça: a régua lê o narracao.json e os .palavras.json que o falar.mjs grava
    const pecaRegua = join(tmp, 'peca-regua');
    mkdirSync(join(pecaRegua, 'roteiro'), { recursive: true });
    mkdirSync(join(pecaRegua, 'ativos'), { recursive: true });
    writeFileSync(join(pecaRegua, 'roteiro', 'narracao.json'), JSON.stringify(base()));
    for (const [id, l] of Object.entries(palavras)) writeFileSync(join(pecaRegua, 'ativos', `${id}.palavras.json`), JSON.stringify(l));
    ok(reguaDaPeca(pecaRegua).ok, 'régua da voz: lê a peça pela pasta (roteiro/narracao.json e ativos/<fala>.palavras.json)');
    rmSync(join(pecaRegua, 'ativos', 'f2.palavras.json'));
    ok(/gere a fala pelo falar\.mjs/.test(erroDe(() => reguaDaPeca(pecaRegua))), 'régua da voz: fala sem o tempo das palavras diz como gerar');
  }

  // 8 · o registro de blocos fica fixo num commit, nunca na main que muda
  ok(/\/hyperframes\/[0-9a-f]{40}\/registry$/.test(REGISTRO), 'o hyperframes.json aponta o registro num commit fixo');
  const hfj = JSON.parse(readFileSync(join(tmp, 'cliente-x', 'video', 'reel-teste', 'hyperframes.json'), 'utf8'));
  ok(hfj.registry === REGISTRO, 'a peça nova grava esse registro fixo');
  const textoSkill = ['SKILL.md', 'hyperframes.md', 'metodo.md', 'voz.md', 'som.md', 'critico.md'].map((f) => readFileSync(join(AQUI, '..', f), 'utf8')).join('\n');
  ok(!/hyperframes@latest/.test(textoSkill) &&!/hyperframes\/main\//.test(textoSkill), 'nenhum módulo manda @latest nem a main do HyperFrames');
  const textoVoz = readFileSync(join(AQUI, '..', 'voz.md'), 'utf8');
  ok(!/fish/i.test(textoSkill + readFileSync(join(AQUI, 'falar.mjs'), 'utf8')), 'a voz é a da ElevenLabs: nenhum módulo nem o falar.mjs cita a Fish Audio');
  ok(/sem a autorização dela/.test(textoVoz) && /não faz clonagem de voz/.test(textoVoz) && /nunca lê a legenda/.test(textoVoz) && /só vale para o que não se publica/.test(textoVoz), 'voz.md: voz de pessoa real só com autorização, sem clonagem, a narração não lê a legenda, e o plano gratuito não se publica');
  ok(!/curl[^\n]*(Authorization|xi-api-key)/.test(textoSkill) && /falar\.mjs/.test(readFileSync(join(AQUI, '..', 'voz.md'), 'utf8')), 'voz.md manda usar o falar.mjs, não um curl com a chave');

  // 6 · o .gitignore do estúdio
  const giEstudio = readFileSync(join(RAIZ, '.claude', 'video', '.gitignore'), 'utf8').split(/\r?\n/);
  ok(['node_modules', 'previa', 'html/*/_vendor', 'html/*/_marca', 'html/*/renders', 'html/*/ativos/*.wav'].every((l) => giEstudio.includes(l)), 'o .gitignore do estúdio deixa de fora node_modules, prévia, junções, renders e áudio');
} catch (e) {
  ok(false, `erro inesperado: ${e.stack}`);
} finally {
  // as junções saem primeiro (rmdir não atravessa); só depois a pasta temporária
  const anda = (d) => {
    for (const x of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, x.name);
      if (lstatSync(p).isSymbolicLink()) { try { rmdirSync(p); } catch {} }
      else if (x.isDirectory()) anda(p);
    }
  };
  try { anda(tmp); } catch {}
  const sobrou = (d) => readdirSync(d, { withFileTypes: true }).some((x) => x.isSymbolicLink() || (x.isDirectory() && sobrou(join(d, x.name))));
  if (!sobrou(tmp)) rmSync(tmp, { recursive: true, force: true });
  else console.log(`AVISO: sobrou junção em ${tmp}; não apago para não atravessar`);
}

console.log(falhas ? `\n${falhas} falha(s)` : '\ntudo verde');
process.exit(falhas ? 1 : 0);
