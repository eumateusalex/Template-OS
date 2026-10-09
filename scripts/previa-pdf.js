// Rasteriza as páginas de um PDF em PNG, pra conferir a DIAGRAMAÇÃO.
//
// Por que existe: documento conferido em pedaços soltos do HTML sai com o
// conteúdo certo e o desenho errado, porque pedaço solto não mostra ritmo: não mostra três
// páginas seguidas com a mesma composição, não mostra viúva no fim da página,
// não mostra a página que ficou com um terço de branco no pé. Isso só aparece
// vendo a PÁGINA, e vendo várias em sequência.
//
// O Chromium do Playwright não abre PDF (o headless shell não traz o
// visualizador), então quem rasteriza é o pdf.js dentro de uma página em
// branco: ele decodifica o PDF e pinta num canvas, que vira PNG.
//
// Uso:
//   node scripts/previa-pdf.js <arquivo.pdf> [--saida pasta] [--paginas 1-12]
//   node scripts/previa-pdf.js <arquivo.pdf> --contato   (folha de contato só)
//
// --contato monta também uma folha de miniaturas em HTML, que é onde o ritmo
// da obra inteira aparece de uma vez. É o mesmo truque de uma folha de contato
// de fotografia: todas as páginas lado a lado, pequenas.

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const args = process.argv.slice(2);
const flag = (nome, padrao) => {
  const i = args.indexOf('--' + nome);
  return i === -1 ? padrao : args[i + 1];
};

const entrada = args.find((a) => !a.startsWith('--') && /\.pdf$/i.test(a));
if (!entrada) {
  console.error('uso: node scripts/previa-pdf.js <arquivo.pdf> [--saida pasta] [--paginas 1-12] [--contato]');
  process.exit(1);
}
const arquivo = path.resolve(entrada);
if (!fs.existsSync(arquivo)) {
  console.error(`\n✗ não achei: ${arquivo}\n`);
  process.exit(1);
}

const saida = path.resolve(flag('saida', path.join(RAIZ, 'rascunho', 'previa-' + path.basename(arquivo, '.pdf'))));
const escala = Number(flag('escala', 1.6));
const comContato = args.includes('--contato');

/** "3" vira [3,3]; "1-12" vira [1,12]; vazio vira tudo. */
function faixa(txt, total) {
  if (!txt) return [1, total];
  const m = String(txt).match(/^(\d+)(?:-(\d+))?$/);
  if (!m) return [1, total];
  return [Number(m[1]), Math.min(Number(m[2] || m[1]), total)];
}

(async () => {
  const { chromium } = require(path.join(RAIZ, 'scripts', 'node_modules', 'playwright'));
  const pdfjsDir = path.join(RAIZ, 'scripts', 'node_modules', 'pdfjs-dist', 'build');
  const lib = fs.readFileSync(path.join(pdfjsDir, 'pdf.min.mjs'), 'utf8');
  const worker = fs.readFileSync(path.join(pdfjsDir, 'pdf.worker.min.mjs'), 'utf8');
  const dados = fs.readFileSync(arquivo).toString('base64');

  fs.mkdirSync(saida, { recursive: true });
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage({ viewport: { width: 1000, height: 1400 } });

  try {
    await pagina.goto('about:blank');
    // O worker vai como blob: sem ele o pdf.js roda em modo degradado e
    // reclama no console a cada página.
    await pagina.addScriptTag({ content: lib, type: 'module' });
    await pagina.evaluate(async (src) => {
      const blob = new Blob([src], { type: 'text/javascript' });
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
    }, worker);

    const total = await pagina.evaluate(async (b64) => {
      const bin = atob(b64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      window.__doc = await window.pdfjsLib.getDocument({ data: arr }).promise;
      return window.__doc.numPages;
    }, dados);

    const [de, ate] = faixa(flag('paginas', null), total);
    console.log(`  ${path.basename(arquivo)}: ${total} páginas, rasterizando ${de} a ${ate}`);

    const nomes = [];
    for (let n = de; n <= ate; n++) {
      const png = await pagina.evaluate(async ({ n, escala }) => {
        const p = await window.__doc.getPage(n);
        const vp = p.getViewport({ scale: escala });
        const cv = document.createElement('canvas');
        cv.width = Math.ceil(vp.width);
        cv.height = Math.ceil(vp.height);
        // ⚠️ alpha:false e branco pintado antes. Sem isso o pdf.js compõe
        // gradiente e imagem sobre um canvas transparente e a cor desmancha:
        // a foto sai magenta na prévia enquanto o PDF está correto. Prévia que mente sobre cor é pior que
        // prévia nenhuma, porque manda consertar o que não está quebrado.
        const ctx = cv.getContext('2d', { alpha: false });
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, cv.width, cv.height);
        await p.render({ canvasContext: ctx, viewport: vp }).promise;
        return cv.toDataURL('image/png');
      }, { n, escala });

      const nome = `p${String(n).padStart(2, '0')}.png`;
      fs.writeFileSync(path.join(saida, nome), Buffer.from(png.split(',')[1], 'base64'));
      nomes.push(nome);
      process.stdout.write(`\r  página ${n}/${ate}   `);
    }
    console.log('');

    if (comContato) {
      const html = `<!doctype html><meta charset="utf-8">
<title>Prévia · ${path.basename(arquivo)}</title>
<style>
  body { margin:0; padding:24px; background:#2b2f36; font:13px/1.4 system-ui, sans-serif; color:#e8eaed; }
  h1 { font-size:15px; font-weight:600; margin:0 0 18px; }
  .g { display:grid; grid-template-columns:repeat(auto-fill,minmax(190px,1fr)); gap:16px; }
  figure { margin:0; }
  img { width:100%; display:block; background:#fff; box-shadow:0 6px 18px rgba(0,0,0,.35); }
  figcaption { margin-top:6px; font-size:11px; color:#9aa0a6; font-variant-numeric:tabular-nums; }
</style>
<h1>${path.basename(arquivo)} · ${total} páginas</h1>
<div class="g">
${nomes.map((f, i) => `<figure><img src="${f}" alt=""><figcaption>${de + i}</figcaption></figure>`).join('\n')}
</div>`;
      fs.writeFileSync(path.join(saida, 'contato.html'), html, 'utf8');
      console.log(`  folha de contato: ${path.relative(RAIZ, path.join(saida, 'contato.html'))}`);
    }
  } finally {
    await navegador.close();
  }

  console.log(`\n✓ ${path.relative(RAIZ, saida)}`);
})();
