async () => {
  // Enumera tudo do perfil desde a data, pela busca avancada do X (aba "Mais recentes").
  // O prepara.mjs embrulha este trecho num codigo que ja navega ate a busca; rodar com
  // browser_run_code_unsafe + filename. Guarda em window.__enum e devolve so a contagem.
  // Despejo: browser_evaluate `() => [...window.__enum.values()]` com filename <pasta>/enum-busca.json
  const HANDLE = '__HANDLE__';
  const dorme = ms => new Promise(r => setTimeout(r, ms));
  const vistos = window.__enum || (window.__enum = new Map());
  const colher = () => document.querySelectorAll('article').forEach(a => {
    const time = a.querySelector('time');
    const tl = time && time.closest('a') ? time.closest('a').getAttribute('href') : null;
    if (!tl) return;
    const m = tl.match(/^\/([^/]+)\/status\/(\d+)/); if (!m) return;
    const [, perfil, id] = m;
    if (perfil.toLowerCase() !== HANDLE.toLowerCase()) return;
    const txt = a.innerText || '';
    const reply = /Replying to|Em resposta a/.test(txt);
    const respondeA = reply ? ((txt.match(/(?:Replying to|Em resposta a)\s+@(\w+)/) || [])[1] || null) : null;
    const imgs = [...a.querySelectorAll('img[src^="https://pbs.twimg.com/media/"]')].map(i => i.src);
    const corpo = [...a.querySelectorAll('[data-testid="tweetText"]')].map(e => e.innerText);
    const rec = { id, perfil, dt: time.getAttribute('datetime'), reply, respondeA, imgs, corpo, bruto: txt.replace(/\s+/g, ' ').slice(0, 400) };
    const antes = vistos.get(id);
    if (!antes || rec.bruto.length > antes.bruto.length) vistos.set(id, rec);
  });
  let semNovo = 0, ultimo = -1;
  for (let i = 0; i < 90 && semNovo < 6; i++) {
    colher(); window.scrollBy(0, 1800); await dorme(1500);
    if (vistos.size === ultimo) semNovo++; else { semNovo = 0; ultimo = vistos.size; }
  }
  colher();
  const arr = [...vistos.values()];
  const datas = arr.map(x => x.dt).filter(Boolean).sort((a, b) => Date.parse(a) - Date.parse(b));
  return { total: arr.length, respostas: arr.filter(x => x.reply).length, posts: arr.filter(x => !x.reply).length, mais_antigo: datas[0], mais_novo: datas[datas.length - 1] };
}
