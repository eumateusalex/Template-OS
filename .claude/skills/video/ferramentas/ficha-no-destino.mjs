// ficha-no-destino.mjs · a ficha de legenda cabe na zona do destino?
//
//   node ficha-no-destino.mjs <ficha.json> <formato> [--linhas 2]
//
// O formato é a chave do formatos.json (reel, anuncio-reels, shorts, tiktok, meta-feed-4x5,
// quadrado-1x1, yt-16x9). O bloco vai do posicao_y (o topo) até o topo mais as linhas: uma
// linha ocupa ~1,15 x o tamanho (a /cortes mede ~85 px para 74 px, cortes/legenda.md).
// A ficha de exemplo (topo 1330, 74 px) termina perto de 1415, e o anúncio de Reels acaba em 1248:
// no anúncio a interface cobre a legenda. Sai 1 se a ficha não couber.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const FORMATOS = JSON.parse(readFileSync(new URL('./formatos.json', import.meta.url), 'utf8'));

export function conferirFichaNoDestino(ficha, formato, { linhas = 1, nome = 'a ficha' } = {}) {
  const fundo = ficha.posicao_y + Math.round(ficha.tamanho * 1.15 * linhas);
  const livre = formato.largura - 2 * formato.lateral;
  const erros = [];
  if (ficha.posicao_y < formato.topo) erros.push(`${nome} começa em ${ficha.posicao_y} px, acima da zona (${formato.topo})`);
  if (fundo > formato.base) erros.push(`${nome} termina em ~${fundo} px, abaixo da zona (${formato.base}): a interface cobre a legenda`);
  if (ficha.largura > livre) erros.push(`${nome} tem ${ficha.largura} px de largura; a zona tem ${livre}`);
  return { erros, fundo };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [arq, chave] = process.argv.slice(2);
  const i = process.argv.indexOf('--linhas');
  if (!arq || !chave) { console.error('uso: ficha-no-destino.mjs <ficha.json> <formato> [--linhas n]'); process.exit(2); }
  if (!FORMATOS[chave]) { console.error(`o formato "${chave}" não está no formatos.json (${Object.keys(FORMATOS).join(', ')})`); process.exit(2); }
  const ficha = JSON.parse(readFileSync(arq, 'utf8'));
  const r = conferirFichaNoDestino(ficha, FORMATOS[chave], { linhas: i > 0 ? Number(process.argv[i + 1]) : 1, nome: ficha.nome || 'a ficha' });
  r.erros.forEach((e) => console.log(`ERRO  ${e}`));
  console.log(`${chave}: o bloco termina em ~${r.fundo} px · ${r.erros.length ? 'REPROVA' : 'verde'}`);
  process.exitCode = r.erros.length ? 1 : 0;
}
