async (page) => {
  // Lote de permalinks: texto integral, metricas (aria-label), imagens, citacao, cartao, fio
  // do proprio perfil e o post respondido (contexto). Gerado pelo prepara.mjs; rodar com
  // browser_run_code_unsafe + filename. Despejo: browser_evaluate `() => window.__perma`
  // com filename <pasta>/perma-<lote>.json, onde <lote> e o nome DESTE arquivo sem .js
  // (lote-01.js -> perma-lote-01.json; ids-02.js -> perma-ids-02.json). O retorno traz o nome em
  // `despejo`, e o consolida.mjs le todo perma-*.json da pasta.
  //
  // Falha tem dois tipos, e o remedio e diferente:
  //   - LENTO: o artigo nao apareceu no tempo, mas a pagina tem conteudo -> tenta de novo na
  //     hora com espera maior (o post costuma carregar segundos depois)
  //   - VAZIO: a pagina veio sem nenhum texto -> e o HTTP 429 (limite do X). Duas seguidas e o
  //     lote para, marcando o resto como "pulado: limite do X"; esperar minutos e refazer
  //     com `prepara.mjs <pasta> --ids <os que falharam>`.
  const IDS = __IDS__;
  const LOTE = '__LOTE__';
  const HANDLE = '__HANDLE__';
  const out = [];
  let vaziasSeguidas = 0;
  for (const id of IDS) {
    if (vaziasSeguidas >= 2) { out.push({ id, erro: 'pulado: limite do X' }); continue; }
    await page.waitForTimeout(2500);
    const url = 'https://x.com/' + HANDLE + '/status/' + id;
    let rec = { id, url, erro: null };
    try {
      let achou = false;
      for (const espera of [20000, 45000]) {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        try { await page.waitForSelector('article[data-testid="tweet"]', { timeout: espera }); achou = true; break; }
        catch (e) {
          const texto = await page.evaluate(() => (document.body.innerText || '').trim().length);
          if (texto === 0) throw new Error('VAZIO: pagina sem conteudo (provavel 429)');
        }
      }
      if (!achou) throw new Error('LENTO: o post nao carregou em 20 s nem em 45 s');
      await page.waitForTimeout(1800);
      rec = await page.evaluate(({ id, HANDLE }) => {
        const arts = [...document.querySelectorAll('article[data-testid="tweet"]')];
        const info = (a) => {
          const time = a.querySelector('a[href*="/status/"] time');
          const href = time ? time.closest('a').getAttribute('href') : '';
          const m = href.match(/^\/([^/]+)\/status\/(\d+)/) || [];
          const textos = [...a.querySelectorAll('[data-testid="tweetText"]')];
          const quoteBox = [...a.querySelectorAll('div[role="link"]')].find(d => d.querySelector('[data-testid="User-Name"]'));
          let quote = null;
          if (quoteBox) {
            const qn = quoteBox.querySelector('[data-testid="User-Name"]');
            const qh = ((qn && qn.innerText) || '').match(/@(\w+)/);
            const qt = quoteBox.querySelector('[data-testid="tweetText"]');
            const qimgs = [...quoteBox.querySelectorAll('img[src^="https://pbs.twimg.com/media/"]')].map(i => i.src);
            quote = { perfil: qh ? qh[1] : null, texto: qt ? qt.innerText : '', imgs: qimgs };
          }
          const proprio = textos.filter(t => !(quoteBox && quoteBox.contains(t)));
          const imgs = [...a.querySelectorAll('img[src^="https://pbs.twimg.com/media/"]')].filter(i => !(quoteBox && quoteBox.contains(i))).map(i => i.src);
          const videos = [...a.querySelectorAll('video, img[src^="https://pbs.twimg.com/"][src*="video_thumb"]')].filter(v => !(quoteBox && quoteBox.contains(v))).map(v => v.poster || v.src || '');
          const card = a.querySelector('[data-testid="card.wrapper"]');
          const grupo = [...a.querySelectorAll('[role="group"][aria-label]')].map(g => g.getAttribute('aria-label')).pop() || null;
          const nome = a.querySelector('[data-testid="User-Name"]');
          const handle = ((nome && nome.innerText) || '').match(/@(\w+)/);
          const replyTo = (a.innerText || '').match(/(?:Replying to|Em resposta a)\s+@(\w+)/);
          return { id: m[2] || null, perfil: m[1] || (handle ? handle[1] : null), dt: time ? time.getAttribute('datetime') : null,
            corpo: proprio.map(t => t.innerText).join('\n\n'), imgs, videos, quote,
            card: card ? (card.innerText || '').replace(/\s+/g, ' ').slice(0, 300) : null,
            cardLink: card ? ((card.querySelector('a') || {}).href || null) : null,
            metricas: grupo, respondeA: replyTo ? replyTo[1] : null };
        };
        const todos = arts.map(info);
        const fi = todos.findIndex(t => t.id === id);
        // a views do post focal fica fora do grupo; tenta o texto do focal
        let views = null;
        if (fi > -1) {
          const tx = arts[fi].innerText || '';
          const mv = tx.match(/([\d.,]+\s*(?:mil|mi|K|M)?)\s*(?:Views|Visualizações|visualizações)/);
          if (mv) views = mv[1];
        }
        const focal = fi > -1 ? todos[fi] : null;
        const antes = fi > -1 ? todos.slice(0, fi) : [];
        const depois = fi > -1 ? todos.slice(fi + 1) : todos;
        const fio = [];
        for (const t of depois) { if (t.perfil && t.perfil.toLowerCase() === HANDLE.toLowerCase()) fio.push(t); else break; }
        const outrasDele = depois.filter(t => t.perfil && t.perfil.toLowerCase() === HANDLE.toLowerCase() && !fio.includes(t)).map(t => t.id);
        const artigo = !!document.querySelector('[data-testid="twitterArticleReadView"], [data-testid="longformRichTextComponent"]');
        return { id, url: location.href, focal, views, contexto: antes.map(t => ({ perfil: t.perfil, id: t.id, dt: t.dt, texto: (t.corpo || '').slice(0, 300), imgs: t.imgs })),
          fio, outrasDeleNaConversa: outrasDele, artigo, erro: focal ? null : 'focal nao achado' };
      }, { id, HANDLE });
    } catch (e) { rec.erro = String(e.message || e).slice(0, 200); }
    vaziasSeguidas = rec.erro && rec.erro.startsWith('VAZIO') ? vaziasSeguidas + 1 : 0;
    out.push(rec);
  }
  await page.evaluate((d) => { window.__perma = d; }, out);
  return { lote: LOTE, despejo: 'perma-' + LOTE + '.json', total: out.length, erros: out.filter(r => r.erro).map(r => r.id + ':' + r.erro) };
}
