#!/usr/bin/env node
// Sobe um servidor local para abrir e medir uma página ou peça no navegador.
//
// Ele existe no lugar do `python -m http.server` ou do `npx http-server` na raiz,
// que serviriam o workspace inteiro com o scripts/.env dentro. Este serve só as
// pastas que você passa, no 127.0.0.1, e recusa arquivo com ponto no nome, pasta,
// extensão que uma página não pede e pedido com Host de fora. A guarda é a do
// servidor do render do carrossel (.claude/skills/carrossel/render/servidor.js),
// que tem suíte própria.
//
// Uso:
//   node scripts/servir.mjs --pasta <dir>                 uma pasta, em /<nome-da-pasta>/
//   node scripts/servir.mjs --pasta <dir> --porta 8899    numa porta fixa (padrão: a que o sistema der)
//   node scripts/servir.mjs --raiz . --servir saidas/x,carrosseis   pastas da raiz, cada uma no seu prefixo
//
// A primeira linha é o endereço, com a porta: quem sobe o servidor noutro processo
// lê a porta dali. Ctrl+C derruba.
import { resolve as absoluto, join, basename } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const { sobeServidor } = createRequire(import.meta.url)(join(RAIZ, '.claude', 'skills', 'carrossel', 'render', 'servidor.js'));

const args = process.argv.slice(2);
const valor = (nome) => { const i = args.indexOf(nome); return i >= 0 ? args[i + 1] : undefined; };
const porta = valor('--porta') === undefined ? 0 : Number(valor('--porta'));
if (!Number.isInteger(porta) || porta < 0 || porta > 65535) {
  console.error(`servir: a porta "${valor('--porta')}" não é um número de porta`);
  process.exit(2);
}

let bases;
if (valor('--pasta')) {
  const pasta = absoluto(valor('--pasta'));
  // a raiz inteira serviria clientes/ e o resto; pasta oculta não é página
  if (pasta.toLowerCase() === absoluto(RAIZ).toLowerCase() || basename(pasta).startsWith('.')) {
    console.error(`servir: "${pasta}" não se serve inteira (a raiz do workspace ou uma pasta oculta): passe a pasta da página`);
    process.exit(2);
  }
  bases = [[basename(pasta), pasta]];
} else if (valor('--servir')) {
  const raiz = absoluto(valor('--raiz') || '.');
  bases = valor('--servir').split(',').map((p) => p.trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, '')).filter(Boolean)
    .map((p) => {
      // o mesmo trecho que a guarda recusa no pedido não entra como base
      if (p.split('/').some((s) => !s || s === '..' || s.startsWith('.') || /[\\:\0]/.test(s))) {
        console.error(`servir: a pasta "${p}" tem um trecho que não se serve (vazio, ponto no começo, "..", dois-pontos)`);
        process.exit(2);
      }
      return [p, join(raiz, ...p.split('/'))];
    });
} else {
  console.error('servir: diga o que servir: --pasta <dir>, ou --raiz <dir> --servir <pasta1,pasta2>');
  process.exit(2);
}

try {
  const { porta: aberta } = await sobeServidor({ bases, porta });
  console.log(`http://127.0.0.1:${aberta}`);
  console.log(`  servindo ${bases.map(([p, d]) => `/${p}/ → ${d}`).join(', ')} · Ctrl+C derruba`);
} catch (e) {
  console.error(`servir: não subiu na porta ${porta}: ${e.code || e.message}`);
  process.exit(1);
}
