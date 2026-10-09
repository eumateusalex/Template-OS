// LinkedIn: so com sessao logada. Rodar em https://www.linkedin.com/in/<perfil>/recent-activity/all/.
// SO LE: nao clica em nada, nem no "ver mais". O corte em 3 linhas do LinkedIn e visual (o texto
// inteiro ja esta no DOM), entao o corpo sai do textContent, que ignora o corte; o innerText
// devolveria so o que esta na tela. Colhe a cada volta (lista virtual).
// O seletor .update-components-text pega so o corpo, sem o cabecalho do cartao.
async () => {
  const dorme = ms => new Promise(r => setTimeout(r, ms));
  const vistos = new Map();
  const colher = () => {
    document.querySelectorAll('div.feed-shared-update-v2, [data-urn*="activity"]').forEach(el => {
      const urn = el.getAttribute('data-urn') || el.querySelector('[data-urn]')?.getAttribute('data-urn') || '';
      if (!urn.includes('activity')) return;
      const corpo = (el.querySelector('.update-components-text, .feed-shared-update-v2__description')?.textContent || '')
        .replace(/\s+/g, ' ').trim();
      if (corpo.length < 80) return;
      // seletor ANCORADO na origem das imagens de post (lista fechada, ver imagens-fonte.mjs):
      // nem foto de perfil, nem pixel de rastreio, nem imagem de outro dominio
      const imgs = [...el.querySelectorAll('img[src^="https://media.licdn.com/dms/image/"]')].map(i => i.src)
        .filter(s => !s.includes('profile-displayphoto'));
      const antes = vistos.get(urn);
      if (!antes || corpo.length > antes.corpo.length) vistos.set(urn, { urn, corpo, imgs });
    });
  };
  for (let i = 0; i < 26; i++) { await dorme(700); colher(); window.scrollBy(0, 2400); await dorme(1500); }
  await dorme(1200); colher();
  const arr = [...vistos.values()];
  return { total: arr.length, posts: arr };
}
