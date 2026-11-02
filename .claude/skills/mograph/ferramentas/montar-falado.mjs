// A peça do falado: o modelo da /cortes (a câmera, o punch-in, a legenda, o gancho e o
// fato) com as cenas da /mograph por cima, frase a frase. Um comando só:
//
//   node montar-falado.mjs <pasta>
//
// Antes: os passos 0 a 7 do modo gravação da /cortes na mesma pasta (o corte, a
// legenda, a peca.json e o som), e o plano.json da peça. A montagem:
// 1. roda a montagem da /cortes (a função `montar` de scripts/reel-falado/montar.mjs),
//    que confere a legenda e gera o dados.js; recusa dela é recusa daqui
// 2. preenche o tempo de cada cena pelo corte e confere o plano (erro para a montagem)
// 3. exige o script de toda cena de animação (cenas/<id>.js)
// 4. parte do index.html que a montagem da /cortes acabou de gravar (o modelo com o END, a marca
//    e as curvas), sem copiar o código dele: o que a /mograph soma entra depois do script do
//    modelo, na mesma timeline; a câmera leva a cor da peca.json, pela mesma conta da /cortes
//    (scripts/reel-falado/cor.mjs)
// Nunca rode a montagem da /cortes sozinha depois desta: ela regrava o index.html sem as cenas.
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chamadoDireto } from './principal.mjs';
import { conferirPlano, preencherDoCorte, lerDados, TEMPOS_FALADO } from './plano.mjs';
import { lerFormato } from './regua-direcao.mjs';
import { htmlDasMidias, htmlDoAtras } from './falado-extra.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, '..', '..', '..', '..');
const MODELO = join(RAIZ, '.claude', 'skills', 'cortes', 'reel', 'index.html');
const MONTAR_CORTES = join(RAIZ, 'scripts', 'reel-falado', 'montar.mjs');

export async function montarFalado(pasta, { catalogo }) {
  // o falado depende dos motores da /cortes (scripts/reel-falado/) e do modelo dela neste workspace
  if (!resolve(pasta).toLowerCase().startsWith(RAIZ.toLowerCase()) || !existsSync(MONTAR_CORTES) || !existsSync(MODELO)) {
    throw new Error('o modo falado roda só dentro deste workspace: a peça fica nele, ao lado de scripts/reel-falado/ e do modelo da /cortes (.claude/skills/cortes/reel/)');
  }
  const plano = JSON.parse(readFileSync(join(pasta, 'plano.json'), 'utf8'));
  if (plano.modo !== 'falado') throw new Error(`o plano é do modo ${plano.modo}; a montagem é só do falado`);
  // a cor da câmera (scripts/reel-falado/cor.mjs), a mesma conta da montagem da /cortes: o index.html
  // daqui sai do modelo de novo, e sem ela a câmera perderia a correção e a gradação. O plano é o dono
  // da linguagem, e a peca.json que diz outra reprova antes de a /cortes gravar qualquer coisa
  const { corDaCamera, comCor } = await import(pathToFileURL(join(dirname(MONTAR_CORTES), 'cor.mjs')).href);
  const cor = corDaCamera(JSON.parse(readFileSync(join(pasta, 'peca.json'), 'utf8')), { linguagemDoPlano: plano.linguagem || null });
  if (cor.erros.length) throw new Error(`a cor da câmera não passa:\n${cor.erros.map((e) => `  ${e}`).join('\n')}`);
  const { montar } = await import(pathToFileURL(MONTAR_CORTES).href);
  // a faixa da palavra atrás da cabeça fica ocupada da entrada ao fim da saída (0,3 s): a legenda que
  // cairia ali espera, para as duas nunca dividirem o lugar
  const ocupado = plano.atras ? [[plano.atras.em, plano.atras.ate + 0.3]] : [];
  const ocultas = plano.atras ? [].concat(plano.atras.oculta_frase ?? []) : [];
  const errosCortes = montar(pasta, { ocupado, ocultas, linguagemDoPlano: plano.linguagem || null });
  // os avisos da montagem da /cortes (a calibragem que a exceção da peca.json cala) seguem para quem chamou
  for (const a of errosCortes.avisos || []) console.log(`aviso da /cortes: ${a}`);
  if (errosCortes.length) throw new Error(`a montagem da /cortes recusou:\n${errosCortes.map((e) => `  ${e}`).join('\n')}`);
  // daqui para baixo a montagem da /cortes já gravou o index.html dela, sem as cenas: recusa
  // daqui deixa a peça marcada, para ninguém renderizar o Reel sem motion achando que está pronto
  try {
    return montarCenas(pasta, plano, catalogo, (html) => comCor(html, cor.payload));
  } catch (e) {
    writeFileSync(join(pasta, 'index.html'), '<!-- montagem da /mograph recusada: conserte e rode o montar-falado.mjs de novo -->\n');
    throw e;
  }
}

function montarCenas(pasta, plano, catalogo, comCorDaCamera = (html) => html) {
  const dados = lerDados(pasta);
  const p = preencherDoCorte(plano, dados);
  const { erros } = conferirPlano(p, { dados, catalogo });
  if (erros.length) throw new Error(`o plano não passa:\n${erros.map((e) => `  [${e.regra}] ${e.msg}`).join('\n')}`);
  const faltam = p.cenas.filter((c) => c.tipo !== 'legenda' && !existsSync(join(pasta, 'cenas', `${c.id}.js`)));
  if (faltam.length) throw new Error(`cena de animação sem script: ${faltam.map((c) => `${c.id} (${c.tipo}) pede cenas/${c.id}.js`).join(', ')}`);
  // a mídia das cenas e o recorte da palavra de trás têm de estar na pasta (o render não avisa)
  const arquivos = [...p.cenas.flatMap((c) => (c.midia || []).map((m) => m.src)), ...(p.atras ? [p.atras.recorte.src] : [])];
  const sem = arquivos.filter((a) => !existsSync(join(pasta, a)));
  if (sem.length) throw new Error(`mídia que não está na pasta: ${sem.join(', ')}`);

  // o index.html que a montagem da /cortes acabou de gravar: o modelo com o END, a marca e a cor
  let html = readFileSync(join(pasta, 'index.html'), 'utf8');
  const aviso = '\n    <!-- Gerado pela /mograph (ferramentas/montar-falado.mjs) sobre o modelo da /cortes: as cenas\n         de cada frase entram depois do script do modelo, na mesma timeline. A pessoa nunca é\n         recortada do fundo; na meia tela ela entra inteira no cartão. -->';
  if (!html.includes('<head>') || !html.includes('</body>') || !/<script src="_vendor\/gsap\.min\.js"><\/script>/.test(html)) {
    throw new Error('o modelo da /cortes mudou: sem <head>, </body> ou o GSAP onde a montagem espera');
  }
  html = html.replace('<head>', `<head>${aviso}`);
  html = comCorDaCamera(html);
  // a mídia das cenas e a palavra de trás entram no HTML, onde o HyperFrames as acha (falado-extra.mjs)
  const camera = /(<video id="camera"[^>]*><\/video>)/;
  if (p.atras && !camera.test(html)) throw new Error('o modelo da /cortes mudou: sem o <video id="camera"> onde a palavra de trás se encaixa');
  if (p.atras) html = html.replace(camera, (v) => `${v}
        ${htmlDoAtras(p)}`);
  const midias = htmlDasMidias(p);
  if (midias) {
    if (!html.includes('<div id="legendas"')) throw new Error('o modelo da /cortes mudou: sem o #legendas, abaixo do qual a mídia das cenas entra');
    html = html.replace('<div id="legendas"', () => `${midias}
      <div id="legendas"`);
  }
  html = html.replace(/(<script src="_vendor\/gsap\.min\.js"><\/script>)/, '$1\n    <script src="_vendor/CustomEase.min.js"></script>');
  // No HyperFrames o script de arquivo no corpo roda fora de ordem em relação ao script
  // embutido do modelo (medido: o motor via o window.DADOS vazio). Então o plano, o comum, as
  // cenas e o motor entram embutidos, depois do script do modelo, na ordem; cada um num
  // <script data-mograph> com o nome do arquivo de onde veio, para o erro dizer onde
  const zona = lerFormato(p.destino === 'anuncio' ? 'anuncio-reels' : 'reel');
  const plano_js = `window.PLANO = ${JSON.stringify(p)};\nwindow.ZONA = ${JSON.stringify(zona)};\nwindow.TEMPOS = ${JSON.stringify(TEMPOS_FALADO)};\nwindow.CENA = function (id, fn) { (window.__cenas = window.__cenas || {})[id] = fn; };\n`;
  const blocos = [['plano', plano_js]];
  if (existsSync(join(pasta, 'cenas', '_comum.js'))) blocos.push(['cenas/_comum.js', readFileSync(join(pasta, 'cenas', '_comum.js'), 'utf8')]);
  // a legenda leva script só quando a peça tem um (a marca que volta, no gancho)
  const comScript = (x) => x.tipo !== 'legenda' || existsSync(join(pasta, 'cenas', `${x.id}.js`));
  for (const c of p.cenas.filter(comScript)) blocos.push([`cenas/${c.id}.js`, readFileSync(join(pasta, 'cenas', `${c.id}.js`), 'utf8')]);
  blocos.push(['mograph-falado.js', readFileSync(join(AQUI, 'falado.js'), 'utf8')]);
  // o "</script" dentro do código fecharia o bloco embutido
  const embute = ([nome, codigo]) => `<script data-mograph="${nome}">\n${codigo.replace(/<\/script/gi, '<\\/script')}\n</script>`;
  html = html.replace('</body>', [...blocos.map(embute), '</body>'].join('\n    '));

  writeFileSync(join(pasta, 'plano.js'), plano_js);
  copyFileSync(join(AQUI, 'falado.js'), join(pasta, 'mograph-falado.js'));
  writeFileSync(join(pasta, 'index.html'), html);
  return { cenas: p.cenas.length, animadas: p.cenas.filter((c) => c.tipo !== 'legenda').length };
}

if (chamadoDireto(import.meta.url)) {
  const pasta = process.argv[2];
  if (!pasta) { console.error('uso: montar-falado.mjs <pasta>'); process.exit(2); }
  const catalogo = JSON.parse(readFileSync(join(AQUI, '..', 'biblioteca', 'catalogo.json'), 'utf8'));
  try {
    const r = await montarFalado(resolve(pasta), { catalogo });
    console.log(`montado: ${r.cenas} cenas, ${r.animadas} com animação. Agora, dentro da pasta: o check, os quadros parados e o render (os comandos do HyperFrames do passo 8 da /cortes, sem a montagem dela; o render por software, com --no-browser-gpu --workers 1, como manda o Determinismo do hyperframes.md da /video)`);
  } catch (e) { console.error(`montagem recusada: ${e.message}`); process.exit(1); }
}
