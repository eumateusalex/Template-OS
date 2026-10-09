// A UMA regra de imagem da captura, usada por todo script que baixa, grava ou confere imagem
// (baixa-imagens, grava-quadros, folhas.py lê a extensão que sai daqui, cataloga, confere-biblioteca):
//
// - só se baixa de uma LISTA FECHADA de origens (https, host exato, caminho com o prefixo);
// - redirecionamento é erro (`redirect: 'error'`): a origem tem de ser a que está na lista;
// - a extensão do arquivo sai da ASSINATURA dos bytes, nunca da URL: JPEG (ff d8 ff) -> .jpg,
//   PNG (89 50 4e 47 0d 0a 1a 0a) -> .png; qualquer outra coisa (HTML de erro, vazio) é recusada.

export const ORIGENS = [
  { host: 'pbs.twimg.com', prefixo: '/media/' },               // imagem de post do X
  { host: 'pbs.twimg.com', prefixo: '/amplify_video_thumb/' },  // miniatura de vídeo do X
  { host: 'pbs.twimg.com', prefixo: '/ext_tw_video_thumb/' },   // miniatura de vídeo do X (antiga)
  { host: 'media.licdn.com', prefixo: '/' },                    // imagem do LinkedIn
];

export function origemPermitida(url) {
  let u;
  try { u = new URL(url); } catch { return false; }
  if (u.protocol !== 'https:' || u.username || u.password || u.port) return false;
  return ORIGENS.some((o) => u.hostname === o.host && u.pathname.startsWith(o.prefixo));
}

export function extensaoPelaAssinatura(buf) {
  if (!buf || buf.length < 8) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') return 'png';
  return null;
}

// Baixa UMA imagem pela regra. Devolve { ok, buf, ext } ou { ok: false, motivo }.
// `buscar` é injetável (o teste passa um fetch falso); o padrão é o fetch do Node.
export async function baixar(url, { buscar = fetch, ua } = {}) {
  if (!origemPermitida(url)) return { ok: false, motivo: `origem fora da lista: ${url}` };
  let r;
  try { r = await buscar(url, { redirect: 'error', headers: ua ? { 'User-Agent': ua } : {} }); }
  catch (e) { return { ok: false, motivo: `falha ou redirecionamento: ${e.message || e}` }; }
  if (!r || !r.ok) return { ok: false, motivo: `HTTP ${r ? r.status : '?'}` };
  if (r.redirected) return { ok: false, motivo: 'redirecionamento' };
  const buf = Buffer.from(await r.arrayBuffer());
  const ext = extensaoPelaAssinatura(buf);
  if (!ext) return { ok: false, motivo: 'assinatura não é JPEG nem PNG' };
  return { ok: true, buf, ext };
}

// O arquivo de uma chave da captura (<id>__<n>, <id>__v1-q2...) na pasta, seja .jpg ou .png.
export function arquivoDaChave(fsmod, path, dir, chave) {
  for (const e of ['jpg', 'png']) { const p = path.join(dir, `${chave}.${e}`); if (fsmod.existsSync(p)) return p; }
  return null;
}
