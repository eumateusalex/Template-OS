async () => {
  // Percorre a aba "Posts e respostas" ate passar da data, colhendo o CORPO de cada item.
  // A busca do X perde perto de 40% das respostas: esta aba e a fonte
  // completa das respostas. O corpo vem daqui, sem abrir permalink (corte do atualizar.md).
  // O prepara.mjs embrulha este trecho num codigo que navega ate https://x.com/__HANDLE__/with_replies
  // e espera a pagina hidratar; rodar com browser_run_code_unsafe + filename. Se devolver
  // chegouNaData: false, rodar de novo (o X as vezes para de carregar).
  // Despejo: browser_evaluate `() => window.__wr` com filename <pasta>/respostas-lista.json
  // a fronteira: segundos inteiros em UTC comparados como numero (captura/janela.mjs), nunca texto
  const HANDLE = '__HANDLE__', DESDE_S = __DESDE_S__;
  const seg = (iso) => Math.floor(Date.parse(iso) / 1000);
  const dorme = ms => new Promise(r => setTimeout(r, ms));
  const vistos = new Map();
  const colher = () => document.querySelectorAll('article').forEach(a => {
    const t = a.querySelector('a[href*="/status/"] time'); if (!t) return;
    const m = (t.closest('a').getAttribute('href') || '').match(/^\/([^/]+)\/status\/(\d+)/); if (!m) return;
    if (m[1].toLowerCase() !== HANDLE.toLowerCase()) return;
    const txt = a.innerText || '';
    const replyTo = txt.match(/(?:Replying to|Em resposta a)\s+@(\w+)/);
    const corpo = [...a.querySelectorAll('[data-testid="tweetText"]')].map(e => e.innerText).join('\n\n');
    const imgs = [...a.querySelectorAll('img[src^="https://pbs.twimg.com/media/"]')].map(i => i.src);
    const metricas = [...a.querySelectorAll('[role="group"][aria-label]')].map(g => g.getAttribute('aria-label')).pop() || null;
    const cortado = !!a.querySelector('[data-testid="tweet-text-show-more-link"]');
    const prev = vistos.get(m[2]);
    if (!prev || corpo.length > prev.corpo.length) vistos.set(m[2], { id: m[2], dt: t.getAttribute('datetime'), respondeA: replyTo ? replyTo[1] : null, corpo, imgs, metricas, cortado });
  });
  let maisVelho = null, semNovo = 0, ult = -1;
  for (let i = 0; i < 200 && semNovo < 10; i++) {
    colher(); window.scrollBy(0, 1800); await dorme(1500);
    const dts = [...vistos.values()].map(v => v.dt).filter(Boolean).sort((a, b) => seg(a) - seg(b));
    if (dts.length) maisVelho = dts[0];
    if (maisVelho && seg(maisVelho) <= DESDE_S) break;
    if (vistos.size === ult) semNovo++; else { semNovo = 0; ult = vistos.size; }
  }
  colher();
  window.__wr = [...vistos.values()];
  return { itens: window.__wr.length, maisVelho, chegouNaData: !!maisVelho && seg(maisVelho) <= DESDE_S };
}
