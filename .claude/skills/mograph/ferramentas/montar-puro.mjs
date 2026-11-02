// O montador da peça em motion puro (cenas.md, "No motion puro"): escreve o index.html da
// peça a partir do modelo dela, com tudo embutido. No HyperFrames o registro da timeline
// precisa estar num script da página (o check não o vê em arquivo), e o script de arquivo no
// corpo roda fora de ordem; a marca e o GSAP ficam por arquivo, pelas junções _marca e _vendor.
//
//   node montar-puro.mjs <pasta> [--modelo fonte/pagina.html] [--direcao A]
//
// No modelo, cada <script src="..."> local vira o conteúdo do arquivo (relativo à pasta), e
// dois nomes são especiais: plano.js vira window.PLANO (do plano.json) e direcao.js vira
// window.DIR (a letra da prancha). O que começa por _vendor/ ou _marca/ fica como está. Com fonte/ios.json, o
// ativos/ios.js (o kit vivo) é gerado de novo antes, pelo ios-vivo.mjs.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { chamadoDireto } from './principal.mjs';

export function montarPuro(pasta, { modelo = 'fonte/pagina.html', direcao = 'A' } = {}) {
  const arqModelo = join(pasta, modelo);
  if (!existsSync(arqModelo)) throw new Error(`sem o modelo da página: ${arqModelo}`);
  // a interface de celular do kit vivo: com fonte/ios.json, o ativos/ios.js sai de novo antes de embutir
  // (o ios-vivo só carrega quando a peça usa)
  if (existsSync(join(pasta, 'fonte', 'ios.json'))) createRequire(import.meta.url)('./ios-vivo.mjs').gerarIos(pasta);
  const embute = (nome, codigo) => `<script data-arquivo="${nome}">\n${codigo.replace(/<\/script/gi, '<\\/script')}\n</script>`;
  const html = readFileSync(arqModelo, 'utf8').replace(/<script src="([^"]+)"><\/script>/g, (tag, src) => {
    if (src.startsWith('_vendor/') || src.startsWith('_marca/')) return tag;
    if (src === 'plano.js') {
      const arq = join(pasta, 'plano.json');
      if (!existsSync(arq)) throw new Error(`o modelo pede o plano, e não há ${arq}`);
      return embute('plano.json', `window.PLANO = ${JSON.stringify(JSON.parse(readFileSync(arq, 'utf8')))};`);
    }
    if (src === 'direcao.js') return embute('direcao', `window.DIR = ${JSON.stringify(direcao)};`);
    const arq = join(pasta, src);
    if (!existsSync(arq)) throw new Error(`o modelo pede ${src}, e o arquivo não existe na pasta da peça`);
    return embute(src, readFileSync(arq, 'utf8'));
  });
  writeFileSync(join(pasta, 'index.html'), html);
  return join(pasta, 'index.html');
}

if (chamadoDireto(import.meta.url)) {
  const pasta = process.argv[2];
  const arg = (n) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : undefined; };
  if (!pasta || pasta.startsWith('--')) { console.error('uso: montar-puro.mjs <pasta> [--modelo fonte/pagina.html] [--direcao A]'); process.exit(2); }
  try {
    const saida = montarPuro(resolve(pasta), { modelo: arg('modelo'), direcao: arg('direcao') });
    console.log(`montado: ${saida}. Agora, dentro da pasta: o check, os quadros parados e o render (o render por software, com --no-browser-gpu --workers 1)`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
