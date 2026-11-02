// Põe emoji novo no material da /mograph (`material/emoji/`, fora do git), no desenho da Apple.
//
// O render roda em Chromium, e emoji escrito direto no HTML sai no desenho do sistema (no Windows, o
// da Microsoft). O ios.cjs troca o caractere pela imagem do material; o pacote inteiro vem pelo
// /instalar, e o que faltar se baixa aqui, um a um, da fonte (iamcal/emoji-data, os PNG de 160
// pixels). Só este gesto fala com a rede.
//
//   node emoji.mjs --baixar <emoji> [<emoji>...]
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { chamadoDireto } from './principal.mjs';

const { EMOJI_DIR, RE_EMOJI, nomesDoArquivo } = createRequire(import.meta.url)('./ios.cjs');
const FONTE = (cp) => `https://raw.githubusercontent.com/iamcal/emoji-data/master/img-apple-160/${cp}.png`;
const TENTATIVAS = 3;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// true (está no material), false (a Apple não distribui esse nome: 404, ou o que chegou não é PNG),
// ou lança depois de TENTATIVAS quando a rede ou o servidor falham, com o motivo
export async function baixar(cp, { dir = EMOJI_DIR, buscar = fetch } = {}) {
  const destino = join(dir, `${cp}.png`);
  if (existsSync(destino)) return true;
  let motivo = '';
  for (let i = 1; i <= TENTATIVAS; i++) {
    try {
      const r = await buscar(FONTE(cp));
      if (r.status >= 500) motivo = `o servidor respondeu ${r.status}`;
      else {
        if (!r.ok) return false;
        const buf = Buffer.from(await r.arrayBuffer());
        // um PNG de verdade começa com a assinatura \x89PNG
        if (buf.length < 100 || buf.toString('binary', 1, 4) !== 'PNG') return false;
        mkdirSync(dir, { recursive: true });
        writeFileSync(destino, buf);
        return true;
      }
    } catch (e) { motivo = e.message; }
    if (i < TENTATIVAS) await espera(1000 * i);
  }
  throw new Error(`a rede falhou ${TENTATIVAS} vezes (${motivo})`);
}

async function modoBaixar(args) {
  const pedidos = args.flatMap((a) => [...a.matchAll(RE_EMOJI)].map((m) => m[0]));
  if (!pedidos.length) { console.error('uso: node emoji.mjs --baixar <emoji> [<emoji>...]'); process.exit(2); }
  let falhou = 0;
  for (const seq of pedidos) {
    let ok = null;
    try {
      for (const cand of nomesDoArquivo(seq)) { if (await baixar(cand)) { ok = cand; break; } }
      console.log(ok ? `  ${seq}  ->  material/emoji/${ok}.png` : `  ${seq}  ->  a Apple não distribui esse (sem arquivo)`);
    } catch (e) {
      console.log(`  ${seq}  ->  não baixou: ${e.message}. Rode de novo daqui a pouco`);
    }
    if (!ok) falhou++;
    // a espera entre um pedido e outro, para não martelar o servidor
    await espera(300);
  }
  process.exit(falhou ? 1 : 0);
}

if (chamadoDireto(import.meta.url)) {
  if (process.argv[2] !== '--baixar') { console.error('uso: node emoji.mjs --baixar <emoji> [<emoji>...]'); process.exit(2); }
  modoBaixar(process.argv.slice(3)).catch((e) => { console.error(`ERRO: ${e.message}`); process.exit(1); });
}
