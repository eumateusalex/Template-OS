async () => {
  // Texto integral de UM artigo longo. NAO rode este modelo direto: o `prepara.mjs <pasta> --artigos
  // <ids>` gera <pasta>/artigos/artigo-<id>.js, ja com o id trocado e embrulhado num codigo que navega
  // ate o post e espera a pagina. Rode o gerado com browser_run_code_unsafe + filename (e ele que
  // carrega codigo de arquivo; o browser_evaluate nao carrega). O resultado fica em window.__artigo;
  // despeje com browser_evaluate `() => window.__artigo` + filename <pasta>/artigo-<id>.json.
  // A UI logada vem em ingles ou portugues conforme a sessao: os cortes aceitam as duas.
  await new Promise(r => setTimeout(r, 3200));
  const t = document.body.innerText || '';
  const ini = ['Conversation', 'Conversa'].map(m => [m, t.indexOf(m)]).find(([, i]) => i > -1);
  let x = ini ? t.slice(ini[1] + ini[0].length) : t;
  for (const fim of ['Want to publish your own Article', 'Quer publicar seu próprio Artigo', 'Quer publicar o seu próprio Artigo']) {
    const k = x.indexOf(fim);
    if (k > -1) { x = x.slice(0, k); break; }
  }
  window.__artigo = { id: '__ID__', tam: x.length, cortado_no_inicio: !!ini, texto: x.trim() };
  return { id: '__ID__', tam: x.length, cortado_no_inicio: !!ini, despejo: 'artigo-__ID__.json' };
}
