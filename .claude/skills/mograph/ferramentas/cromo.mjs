// cromo.mjs · o "cromo de página" no vídeo vertical (a régua `cromo` do regua-direcao.mjs).
// Lê as amostras que o `amostrar` do regua-direcao.mjs já tira (a caixa de cada texto e de cada
// forma a cada 0,1 s) e procura o que faz o vídeo parecer slide ou site, com os tamanhos
// medidos pela LARGURA no 9:16 (medir em % da altura, como no 16:9, deixa passar o título de
// ~58 px). Tamanho = altura da caixa do texto (a linha), uma aproximação do corpo.
//
//   canto     texto pequeno (até 4% de W) parado num canto da zona por 1 s ou mais: o nome no
//             canto, o rótulo de cena (regras-de-movimento.md: "rótulos e molduras nos cantos")
//   contador  "02 / 04", "parte 2", "capítulo 3" em texto pequeno: o contador de capítulo
//   metadado  BPM, qps, 1080x1920, v1.2, ©: metadado de produção na tela
//   kicker    linha pequena logo acima de um título com o dobro do tamanho
//   preso     o mesmo texto ou forma, no mesmo lugar e tamanho, em 3 cenas ou mais, parado 0,3 s em
//             cada uma; a câmera que passa por ali num quadro não conta
// A legenda da /cortes e o texto do objeto desenhado (data-texto="objeto") não contam.
// O contador e o kicker seguem as recusas da marca (o `recusas` do identidade/marca.tokens.json,
// que a linha de comando passa): o que a marca recusa reprova firme (`recusa: true`, que nenhuma
// exceção cala); o que ela permite só avisa. Sem a lista, valem as duas recusas.
// O preso é calibragem: a régua o reporta como erro, e a gravidade sai do excecoes.mjs (avisa, e
// a exceção no plano.json o aceita). A opção ({ preso: 'aviso' }) segue para medir peça antiga.

export const PEQUENO = 0.04, TITULO = 0.05, FOLGA_KICKER = 0.06, FICA_S = 0.3;
// as recusas que esta régua lê; sem a lista da marca, as duas valem
export const RECUSAS_DO_CROMO = Object.freeze(['contador', 'kicker']);

const igual = (a, b, tol) => Math.abs(a.top - b.top) <= tol && Math.abs(a.left - b.left) <= tol && Math.abs(a.bottom - b.bottom) <= tol && Math.abs(a.right - b.right) <= tol;

export function cromoDasAmostras({ amostras, passo = 0.1, formato: f }, plano = { cenas: [] }, { recusas = RECUSAS_DO_CROMO, preso = 'erro' } = {}) {
  const erros = [], avisos = [];
  const add = (nivel, regra, msg) => (nivel === 'erro' ? erros : avisos).push({ regra, msg });
  // o que a marca recusa reprova firme; o que ela permite avisa
  const pelaMarca = (id, regra, msg) => (recusas.includes(id)
    ? erros.push({ regra, msg: `${msg} · recusa "${id}" (nas recusas)`, recusa: true })
    : avisos.push({ regra, msg: `${msg} · a marca permite "${id}" (fora das recusas): só avisa` }));
  const W = f.largura;
  const pequeno = (it) => it.r.bottom - it.r.top <= PEQUENO * W;
  const conta = (it) => it.tipo === 'texto' && !it.legenda && !it.objeto && it.op >= 0.5;
  const visto = new Set();
  const uma = (chave, fn) => { if (!visto.has(chave)) { visto.add(chave); fn(); } };

  // canto: o mesmo texto pequeno na mesma caixa por 1 s ou mais, num canto da zona
  const canto = (r) => {
    const cx = (r.left + r.right) / 2;
    const lado = cx < 0.25 * W || cx > 0.75 * W;
    const ponta = r.top < f.topo + 0.08 * f.altura || r.bottom > f.base - 0.08 * f.altura;
    return lado && ponta;
  };
  const corridas = new Map();
  for (const { t, itens } of amostras) {
    for (const it of itens.filter(conta)) {
      const txt = it.txt.trim();
      if (pequeno(it) && /^(0?\d|\d\d)\s*[/·|]\s*(0?\d|\d\d)$|^(parte|cap[ií]tulo|cap\.|passo)\s*\d/i.test(txt)) {
        uma(`contador ${txt}`, () => pelaMarca('contador', 'cromo', `"${txt}" aos ${t.toFixed(1)} s é contador de capítulo: o espectador não precisa dele`));
      }
      if (/\b\d+\s?(bpm|fps|qps)\b|\b\d{3,4}\s?[x×]\s?\d{3,4}\b|\bv\d+\.\d+\b|©|\bT\+\d/i.test(txt)) {
        uma(`meta ${txt}`, () => add('erro', 'cromo', `"${txt}" aos ${t.toFixed(1)} s é metadado de produção na tela`));
      }
      if (pequeno(it) && canto(it.r)) {
        const c = corridas.get(txt);
        if (c && igual(c.r, it.r, 4) && Math.abs(t - c.ult - passo) < passo / 2) { c.dur += passo; c.ult = t; }
        else corridas.set(txt, { r: it.r, dur: passo, ult: t, de: t });
        const c2 = corridas.get(txt);
        if (c2.dur >= 1 - 1e-9) uma(`canto ${txt}`, () => add('erro', 'cromo', `"${txt}" fica parado no canto (y ${it.r.top}–${it.r.bottom}, x ${it.r.left}–${it.r.right}) desde ${c2.de.toFixed(1)} s: rótulo de canto é cromo de página`));
      }
    }
    // kicker: uma linha pequena encostada em cima de um título com o dobro do tamanho
    const textos = itens.filter(conta);
    for (const a of textos) for (const b of textos) {
      if (a === b || !pequeno(a)) continue;
      const ha = a.r.bottom - a.r.top, hb = b.r.bottom - b.r.top;
      const encima = b.r.top - a.r.bottom >= -2 && b.r.top - a.r.bottom <= FOLGA_KICKER * W;
      const cruza = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left) > 0;
      if (encima && cruza && hb >= 2 * ha && hb >= TITULO * W) {
        uma(`kicker ${a.txt}`, () => pelaMarca('kicker', 'cromo', `"${a.txt}" (${ha} px) em cima de "${b.txt.slice(0, 30)}" (${hb} px) aos ${t.toFixed(1)} s: o rótulo acima do título é layout de slide`));
      }
    }
  }

  // preso: a mesma caixa (texto ou forma) em 3 cenas ou mais. A cena só conta quando a caixa fica ali
  // por FICA_S seguidos: a câmera que passa pelo enquadramento num quadro amostrado não é "ficar"
  const cenas = plano.cenas || [];
  if (cenas.length >= 3) {
    const onde = [];
    const seguidos = Math.max(1, Math.round(FICA_S / passo));
    amostras.forEach(({ t, itens }, i) => {
      const cena = cenas.find((c) => t >= c.de && t < c.ate);
      if (!cena) return;
      for (const it of itens) {
        if (it.tipo === 'materia' || it.legenda || it.objeto || it.livre || it.op < 0.5) continue;
        let g = onde.find((o) => o.txt === it.txt && igual(o.r, it.r, 8));
        if (!g) onde.push(g = { txt: it.txt, r: it.r, cenas: new Set(), corrida: {} });
        const c = g.corrida[cena.id];
        g.corrida[cena.id] = c && c.ate === i - 1 ? { ate: i, n: c.n + 1 } : { ate: i, n: 1 };
        if (g.corrida[cena.id].n >= seguidos) g.cenas.add(cena.id);
      }
    });
    for (const g of onde) if (g.cenas.size >= 3) {
      uma(`preso ${g.txt}`, () => add(preso, 'cromo', `"${g.txt.slice(0, 30)}" fica no mesmo lugar e tamanho em ${g.cenas.size} cenas (${[...g.cenas].join(', ')}): o objeto preso lê como marcador de página; ele volta mudando de papel, de lugar ou de escala`));
    }
  }
  return { erros, avisos };
}
