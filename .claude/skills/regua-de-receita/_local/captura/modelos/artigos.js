async () => {
  // Lista os Artigos longos do perfil e separa os NOVOS (mais novos que a janela).
  // O prepara.mjs embrulha este trecho num codigo que navega ate https://x.com/__HANDLE__/articles.
  // A lista e virtual e descarta o que sai da tela: colhe a cada volta.
  // Devolve so a contagem e os ids novos; a lista inteira fica em window.__art.
  // Despejo (se quiser guardar): browser_evaluate `() => window.__art` com filename <pasta>/artigos.json
  // a fronteira: segundos inteiros em UTC comparados como numero (captura/janela.mjs)
  const DESDE_S = __DESDE_S__;
  const seg = (iso) => Math.floor(Date.parse(iso) / 1000);
  const dorme = ms => new Promise(r => setTimeout(r, ms));
  const vistos = new Map();
  const colher = () => document.querySelectorAll('article').forEach(a => {
    const t = a.querySelector('a[href*="/status/"] time'); if (!t) return;
    const m = (t.closest('a').getAttribute('href') || '').match(/\/status\/(\d+)/); if (!m) return;
    if (!vistos.has(m[1])) vistos.set(m[1], { id: m[1], dt: t.getAttribute('datetime'), t: (a.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 200) });
  });
  let semNovo = 0, ult = -1;
  for (let i = 0; i < 20 && semNovo < 4; i++) {
    colher(); window.scrollBy(0, 2200); await dorme(1400);
    if (vistos.size === ult) semNovo++; else { semNovo = 0; ult = vistos.size; }
  }
  colher();
  window.__art = [...vistos.values()];
  const novos = window.__art.filter(x => x.dt && seg(x.dt) > DESDE_S);
  const datas = window.__art.map(x => x.dt).sort();
  return { total: window.__art.length, mais_novo: datas[datas.length - 1], novos: novos.map(x => x.id) };
}
