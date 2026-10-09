async () => {
  // Percorre a aba "Posts e respostas" ate passar da data, colhendo o CORPO de cada item.
  // A busca do X perde perto de 40% das respostas: esta aba e a fonte
  // completa das respostas. O corpo vem daqui, sem abrir permalink (corte do atualizar.md).
  // O prepara.mjs embrulha este trecho num codigo que navega ate https://x.com/__HANDLE__/with_replies
  // e espera a pagina hidratar; rodar com browser_run_code_unsafe + filename. Se devolver
  // chegouNaData: false, rodar de novo (o X as vezes para de carregar).
  // Despejo: browser_evaluate `() => window.__wr` com filename <pasta>/respostas-lista.json
  const HANDLE = '__HANDLE__';
  // a UNICA regra de fronteira (janela.mjs): segundos inteiros UTC, comparados como numero
  const seg = (iso) => Math.floor(Date.parse(iso) / 1000);
  const DESDE = __DESDE_SEG__;
  const dorme = ms => new Promise(r => setTimeout(r, ms));
  const vistos = new Map();
  // A conta logada traduz sozinha o que nao esta em portugues ("Traduzido do ingles"). O texto
  // que vale e o original: clicar "Mostrar original" so troca a exibicao local (nao publica nada,
  // nao avisa ninguem). Nunca clicar "Avalie esta traducao".
  const desfaz = async () => {
    const alvos = [...document.querySelectorAll('article span')].filter(s => /^(Mostrar original|Show original)$/.test((s.innerText || '').trim()));
    alvos.forEach(s => s.click());
    if (alvos.length) await dorme(900);
    return alvos.length;
  };
  const TRAD = /Mostrar original|Show original/;
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
    const traduzido = TRAD.test(txt);
    const prev = vistos.get(m[2]);
    if (!prev || (prev.traduzido && !traduzido) || (prev.traduzido === traduzido && corpo.length > prev.corpo.length)) vistos.set(m[2], { id: m[2], dt: t.getAttribute('datetime'), respondeA: replyTo ? replyTo[1] : null, corpo, imgs, metricas, cortado, traduzido });
  });
  let maisVelho = Infinity, semNovo = 0, ult = -1;
  for (let i = 0; i < 200 && semNovo < 10; i++) {
    await desfaz(); colher(); window.scrollBy(0, 1800); await dorme(1500);
    const dts = [...vistos.values()].map(v => seg(v.dt)).filter(Number.isFinite);
    if (dts.length) maisVelho = Math.min(...dts);
    if (maisVelho < DESDE) break;
    if (vistos.size === ult) semNovo++; else { semNovo = 0; ult = vistos.size; }
  }
  await desfaz(); colher();
  window.__wr = [...vistos.values()];
  return { itens: window.__wr.length, maisVelho: Number.isFinite(maisVelho) ? new Date(maisVelho * 1000).toISOString() : null, chegouNaData: maisVelho <= DESDE, ainda_traduzidos: window.__wr.filter(x => x.traduzido).length };
}
