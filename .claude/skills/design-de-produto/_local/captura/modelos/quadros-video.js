async (page) => {
  // Quadros-chave dos videos da referencia, sem baixar o MP4: abre o permalink e, para CADA video do post
  // (na ordem em que aparecem, 1, 2...), pausa, salta para 15%, 50% e 85% da duracao e desenha o
  // quadro num canvas no tamanho nativo do video. Gerado pelo `prepara.mjs <pasta> --videos`; rodar
  // com browser_run_code_unsafe + filename. Despejo: browser_evaluate `() => window.__quadros` com
  // filename <pasta>/quadros-NN.json (NN do lote), e depois `grava-quadros.mjs <pasta>` grava em
  // <pasta>/imagens/<id>__v<n>-q<1..3>.jpg -- a mesma chave que o escreve-fontes.mjs promete no
  // arquivo de fonte. So leitura: pausar e saltar o video e exibicao local.
  const IDS = __IDS__;
  const HANDLE = '__HANDLE__';
  const FRACOES = [0.15, 0.5, 0.85];
  const out = [];
  let vaziasSeguidas = 0;
  for (const id of IDS) {
    if (vaziasSeguidas >= 2) { out.push({ id, erro: 'pulado: limite do X' }); continue; }
    await page.waitForTimeout(2500);
    const rec = { id, erro: null, videos: [] };
    try {
      await page.goto('https://x.com/' + HANDLE + '/status/' + id, { waitUntil: 'domcontentloaded', timeout: 45000 });
      try { await page.waitForSelector('article[data-testid="tweet"] video', { timeout: 30000 }); }
      catch (e) {
        const texto = await page.evaluate(() => (document.body.innerText || '').trim().length);
        throw new Error(texto === 0 ? 'VAZIO: pagina sem conteudo (provavel 429)' : 'sem video no post');
      }
      await page.waitForTimeout(2500);
      const r = await page.evaluate(async ({ FRACOES, id }) => {
        // o artigo do post (focal), nao o post respondido acima nem os de baixo
        const arts = [...document.querySelectorAll('article[data-testid="tweet"]')];
        const focal = arts.find((a) => [...a.querySelectorAll('a[href*="/status/"] time')].some((t) => (t.closest('a').getAttribute('href') || '').endsWith('/status/' + id))) || arts[0];
        const quoteBox = [...focal.querySelectorAll('div[role="link"]')].find(d => d.querySelector('[data-testid="User-Name"]'));
        const vids = [...focal.querySelectorAll('video')].filter((v) => !(quoteBox && quoteBox.contains(v)));
        const c = document.createElement('canvas');
        const videos = [];
        for (let n = 0; n < vids.length; n++) {
          const v = vids[n];
          const espera = (ev, ms) => new Promise((ok) => { const t = setTimeout(ok, ms); v.addEventListener(ev, () => { clearTimeout(t); ok(); }, { once: true }); });
          v.scrollIntoView({ block: 'center' });
          if (!(v.duration > 0)) { v.muted = true; try { await v.play(); } catch (e) {} await espera('loadedmetadata', 10000); }
          v.muted = true; v.pause();
          const quadros = [];
          for (const f of FRACOES) {
            v.currentTime = Math.max(0, v.duration * f);
            await espera('seeked', 10000);
            await new Promise((ok) => setTimeout(ok, 400));
            c.width = v.videoWidth; c.height = v.videoHeight;
            c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
            let d = null;
            try { d = c.toDataURL('image/jpeg', 0.92); } catch (e) { return { erro: 'canvas bloqueado: ' + e.message }; }
            quadros.push({ t: Math.round(v.currentTime * 10) / 10, dados: d });
          }
          videos.push({ n: n + 1, duracao: Math.round(v.duration * 10) / 10, largura: v.videoWidth, altura: v.videoHeight, quadros });
        }
        return { videos };
      }, { FRACOES, id });
      Object.assign(rec, r);
    } catch (e) { rec.erro = String(e.message || e).slice(0, 200); }
    vaziasSeguidas = rec.erro && rec.erro.startsWith('VAZIO') ? vaziasSeguidas + 1 : 0;
    out.push(rec);
  }
  await page.evaluate((d) => { window.__quadros = d; }, out);
  return { total: out.length, videos: out.reduce((s, r) => s + (r.videos || []).length, 0), erros: out.filter((r) => r.erro).map((r) => r.id + ':' + r.erro) };
}
