// Converte PNG em JPEG usando o Chromium que o Playwright já instalou.
//
// Por que existe: a API de publicação do Instagram aceita JPEG até 8 MB (a
// especificação da Meta), e as capas que o Nano Banana devolve saem em PNG de
// 1856×2304, com 5 a 6 MB. Em JPEG q92 elas entram na especificação com folga.
// O erro 9004/2207052 não é do formato: o `/instagram-publisher` explica e já
// o trata.
//
// A máquina não tem ImageMagick nem sharp, e instalar dependência nova pra
// isso seria desproporcional: o Chromium já está aqui por causa do render, e
// canvas.toDataURL('image/jpeg', q) resolve com o que existe.
//
// Uso:
//   node scripts/para-jpeg.js <entrada.png> [saida.jpg] [--q 92] [--apagar]
//   node scripts/para-jpeg.js <pasta/> [--q 92] [--apagar]
//
// --apagar remove o PNG de origem depois de converter com sucesso.
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const flag = (nome, padrao) => {
  const i = args.indexOf('--' + nome);
  return i === -1 ? padrao : args[i + 1];
};
const qualidade = Number(flag('q', 92)) / 100;
const apagar = args.includes('--apagar');
const posicionais = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--q');

const entrada = posicionais[0];
if (!entrada) {
  console.error('uso: node scripts/para-jpeg.js <arquivo.png|pasta> [saida.jpg] [--q 92] [--apagar]');
  process.exit(1);
}

// Monta a lista de trabalhos antes de subir o navegador: se não há nada pra
// fazer, não faz sentido pagar o custo de abrir o Chromium.
const trabalhos = [];
if (fs.statSync(entrada).isDirectory()) {
  for (const f of fs.readdirSync(entrada)) {
    if (!/\.png$/i.test(f)) continue;
    trabalhos.push({ de: path.join(entrada, f), para: path.join(entrada, f.replace(/\.png$/i, '.jpg')) });
  }
} else {
  trabalhos.push({ de: entrada, para: posicionais[1] || entrada.replace(/\.png$/i, '.jpg') });
}

if (!trabalhos.length) {
  console.log('nenhum PNG encontrado.');
  process.exit(0);
}

(async () => {
  const { chromium } = require('playwright');
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage();
  let falhas = 0;

  for (const t of trabalhos) {
    const bytesAntes = fs.statSync(t.de).size;

    // O PNG entra como data URL e sai como JPEG pelo canvas. Passar o base64
    // como argumento do evaluate evita montar um HTML gigante por string.
    const base64 = fs.readFileSync(t.de).toString('base64');
    const resultado = await pagina.evaluate(async ([dados, q]) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + dados;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d');
      // JPEG não tem alfa: sem um fundo pintado, transparência vira preto.
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0);
      return { url: c.toDataURL('image/jpeg', q), w: img.naturalWidth, h: img.naturalHeight };
    }, [base64, qualidade]);

    const buffer = Buffer.from(resultado.url.split(',')[1], 'base64');
    fs.writeFileSync(t.para, buffer);

    const mbAntes = (bytesAntes / 1048576).toFixed(1);
    const mbDepois = (buffer.length / 1048576).toFixed(1);
    const passaNaMeta = buffer.length < 4 * 1024 * 1024;
    if (!passaNaMeta) falhas++;

    console.log(
      `${path.basename(t.para)}  ${resultado.w}x${resultado.h}  ` +
      `${mbAntes} MB -> ${mbDepois} MB  ` +
      (passaNaMeta ? 'ok' : 'AINDA ACIMA DE 4 MB (a folga sob o teto de 8 MB da Meta), baixe o --q')
    );

    if (apagar && passaNaMeta) fs.unlinkSync(t.de);
  }

  await navegador.close();
  process.exit(falhas ? 1 : 0);
})();
