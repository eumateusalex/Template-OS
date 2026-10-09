// As imagens da skill: o portao de download, a extensao pela assinatura e o catalogo de metadados.
//
// O catalogo de metadados e _local/imagens.json, uma entrada por imagem guardada em assets/:
//
//   {
//     "pricing-and-monetization/ai-render-locked-feature-paywall.jpg": {
//       "shows": "o que a imagem mostra, numa linha",
//       "why": "por que fica sem nenhum principio citar"      <- so quando nenhum principio a cita
//     }
//   }
//
// O nome do arquivo diz o que a imagem mostra e a pasta e o tema. O catalogo IMAGENS.md da raiz e
// gerado daqui (catalogo.mjs) e das linhas **Visual.** dos principios.
// Usado pelo guarda-imagens.mjs, pelo baixa-imagens.mjs e pelo catalogo.mjs.

import fs from 'node:fs';
import path from 'node:path';

// A extensao sai da ASSINATURA do arquivo (os primeiros bytes), nunca do nome nem da URL: o
// X serve PNG com `format=jpg` no endereco, entao a extensao da URL nao diz o formato.
export function extensaoReal(buf) {
  const b = buf.subarray(0, 12);
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP') return 'webp';
  return null;
}

// Download de imagem com lista FECHADA de origem, sem seguir redirecionamento, e com a assinatura
// conferida: o endereco vem de pagina de terceiro, e nada fora disso entra na pasta da captura.
export const HOSTS_DE_IMAGEM = ['https://pbs.twimg.com/media/', 'https://media.licdn.com/dms/image/'];
export const hostPermitido = (url) => typeof url === 'string' && HOSTS_DE_IMAGEM.some((h) => url.startsWith(h));

// `fetch` injetavel para o teste (teste-captura.mjs) provar cada recusa sem rede
export async function baixarImagem(url, { fetch: buscar = globalThis.fetch, headers = {} } = {}) {
  if (!hostPermitido(url)) return { ok: false, motivo: `host fora da lista (${HOSTS_DE_IMAGEM.join(', ')})` };
  let r;
  try { r = await buscar(url, { headers, redirect: 'error' }); }
  catch (e) { return { ok: false, motivo: `recusado ou sem rede (redirecionamento não se segue): ${String(e.message || e).slice(0, 80)}`, rede: true }; }
  if ((r.status >= 300 && r.status < 400) || r.redirected || (r.url && r.url !== url && !hostPermitido(r.url))) return { ok: false, motivo: 'redirecionamento recusado' };
  if (!r.ok) return { ok: false, motivo: `HTTP ${r.status}`, rede: r.status >= 500 || r.status === 429 };
  const buf = Buffer.from(await r.arrayBuffer());
  const ext = buf.length ? extensaoReal(buf) : null;
  if (!ext) return { ok: false, motivo: 'a assinatura do arquivo não é JPEG, PNG nem WebP' };
  return { ok: true, buf, ext };
}

// o catalogo de metadados, lido e gravado sempre do mesmo jeito: chaves em ordem, 2 espacos, LF
export const lerCatalogo = (k) => {
  const f = path.join(k, 'imagens.json');
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {};
};
export const gravaCatalogo = (k, cat) => {
  const ordenado = Object.fromEntries(Object.keys(cat).sort().map((c) => [c, cat[c]]));
  fs.writeFileSync(path.join(k, 'imagens.json'), JSON.stringify(ordenado, null, 2) + '\n', 'utf8');
};
