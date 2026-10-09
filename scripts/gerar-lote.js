// Gera uma lista de imagens pela Vertex, com retentativa e conversão pra JPEG.
//
// Por que existe: uma série de peças pode precisar de uma centena de imagens.
// Chamar o `gerar-imagem.js` uma a uma custa uma ida e volta por imagem, e a
// Vertex devolve HTTP 429 (cota) com frequência num lote grande. A regra pra
// falha de serviço externo é tentar de novo várias vezes com intervalo, e é
// isso que este arquivo automatiza.
//
// Ele NÃO decide o que gerar. O prompt continua sendo escrito à mão, um por
// imagem, porque prompt genérico devolve imagem de banco de imagem.
//
// Uso:
//   node scripts/gerar-lote.js <lista.json> [--so-faltantes]
//
// A lista é um array de { saida, prompt, formato? }:
//   [{ "saida": "marketing/.../imagens/capa.jpg",
//      "prompt": "...", "formato": "4:5" }]
//
// A saída é declarada em .jpg: o script gera o PNG, converte e apaga o PNG,
// porque a API de publicação do Instagram aceita só JPEG.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const lista = process.argv[2];
const soFaltantes = process.argv.includes('--so-faltantes');

if (!lista) {
  console.error('uso: node scripts/gerar-lote.js <lista.json> [--so-faltantes]');
  process.exit(1);
}

const trabalhos = JSON.parse(fs.readFileSync(lista, 'utf8'));
const TENTATIVAS = 4;

const espera = ms => execFileSync(process.execPath, ['-e', `setTimeout(()=>{}, ${ms})`]);

let feitas = 0, puladas = 0, falhas = [];

for (const [i, t] of trabalhos.entries()) {
  const destino = path.resolve(RAIZ, t.saida);
  const rotulo = `${path.basename(path.dirname(path.dirname(destino)))}/${path.basename(destino)}`;

  if (soFaltantes && fs.existsSync(destino)) {
    console.log(`  pula   ${rotulo} (já existe)`);
    puladas++;
    continue;
  }

  const png = destino.replace(/\.jpg$/i, '.png');
  fs.mkdirSync(path.dirname(destino), { recursive: true });

  let ok = false;
  for (let tentativa = 1; tentativa <= TENTATIVAS && !ok; tentativa++) {
    try {
      const args = ['scripts/gerar-imagem.js', '--prompt', t.prompt, '--saida', png];
      if (t.formato) args.push('--formato', t.formato);
      const saida = execFileSync(process.execPath, args, { cwd: RAIZ, encoding: 'utf8' });
      ok = /OK —/.test(saida);
      if (!ok && tentativa < TENTATIVAS) {
        console.log(`  retry  ${rotulo} (tentativa ${tentativa} não gerou)`);
        espera(8000 * tentativa);
      }
    } catch (e) {
      // 429 de cota é o caso comum, e ele passa com intervalo crescente.
      if (tentativa < TENTATIVAS) {
        console.log(`  retry  ${rotulo} (tentativa ${tentativa} falhou)`);
        espera(8000 * tentativa);
      }
    }
  }

  if (!ok) {
    console.log(`  FALHA  ${rotulo} depois de ${TENTATIVAS} tentativas`);
    falhas.push(t.saida);
    continue;
  }

  execFileSync(process.execPath, ['scripts/para-jpeg.js', png, destino, '--q', '92'], { cwd: RAIZ });
  fs.unlinkSync(png);

  const mb = (fs.statSync(destino).size / 1048576).toFixed(1);
  console.log(`  ok     ${rotulo}  ${mb} MB  (${i + 1}/${trabalhos.length})`);
  feitas++;
}

const custo = (feitas * 0.067).toFixed(2);
console.log(`\n${feitas} gerada(s)${puladas ? `, ${puladas} já existiam` : ''}${falhas.length ? `, ${falhas.length} FALHA(S)` : ''}`);
console.log(`custo aproximado deste lote: US$ ${custo}`);
if (falhas.length) {
  console.log('\nfaltando:');
  for (const f of falhas) console.log('  ' + f);
  process.exit(1);
}
