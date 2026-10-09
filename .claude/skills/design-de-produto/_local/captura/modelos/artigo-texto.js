async (page) => {
  // Texto integral de UM artigo. Gerado pelo `prepara.mjs <pasta> --artigos <ids>` (troca __ID__ e
  // __HANDLE__); rodar com browser_run_code_unsafe + filename <pasta>/artigo-<id>.js. Ele navega
  // sozinho ate o permalink, espera, corta o texto e guarda em window.__artigo; o despejo e
  // browser_evaluate `() => window.__artigo` com filename <pasta>/artigo-<id>.json.
  // A UI logada vem em ingles ou portugues conforme a sessao: os cortes aceitam as duas.
  const ID = '__ID__', HANDLE = '__HANDLE__';
  await page.goto('https://x.com/' + HANDLE + '/status/' + ID, { waitUntil: 'domcontentloaded', timeout: 45000 });
  try { await page.waitForSelector('article', { timeout: 25000 }); } catch (e) {}
  await page.waitForTimeout(3200);
  const r = await page.evaluate((ID) => {
    const t = document.body.innerText || '';
    const ini = ['Conversation', 'Conversa'].map(m => [m, t.indexOf(m)]).find(([, i]) => i > -1);
    let x = ini ? t.slice(ini[1] + ini[0].length) : t;
    for (const fim of ['Want to publish your own Article', 'Quer publicar seu próprio Artigo', 'Quer publicar o seu próprio Artigo']) {
      const k = x.indexOf(fim);
      if (k > -1) { x = x.slice(0, k); break; }
    }
    window.__artigo = { id: ID, tam: x.length, cortado_no_inicio: !!ini, texto: x.trim() };
    return { id: ID, tam: x.length };
  }, ID);
  return r;
}
