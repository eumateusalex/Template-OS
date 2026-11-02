// falado-extra.mjs · o que o falado soma ao modelo da /cortes além das cenas desenhadas: a mídia
// das cenas (o ícone 3D do pacote, o vídeo que a cena toca), a palavra atrás da cabeça (o
// componente texto-atras-da-pessoa da biblioteca) e a costura sem corte entre duas telas cheias.
// Puro: confere o plano e devolve o HTML que o montar-falado.mjs injeta. O movimento mora no
// falado.js (a palavra) e no script de cada cena (a mídia dela).
//
// A mídia vai no HTML porque o HyperFrames descobre vídeo e áudio lendo a página: o <video> que
// um script cria depois ele não renderiza (medido: a montagem da /cortes já escreve a
// câmera e o som assim). Cada item da cena:
//   { "id": "lupa", "src": "ativos/lupa-entra.webm", "de": 6.9, "ate": 8.9, "x": 640, "y": 560, "w": 300 }
// vira <video id="m-lupa" class="clip midia"> na camada #midias (acima das cenas, abaixo da
// legenda), na posição dada; a cena o move pelo id (só x, y, scale, rotação e opacidade).
//
// A palavra atrás da cabeça (uma vez por Reel, no momento mais forte), na fonte, no peso e na cor
// de texto da marca (--f-display, --w-display-bold e --w-display-med, --on-light do tokens.css).
// No topo do plano:
//   "atras": { "cena": "S08", "dona": "o cliente", "palavra": "embora", "em": 31.3, "ate": 32.5,
//              "topo": 428, "oculta_frase": 30,
//              "recorte": { "src": "ativos/recorte-atras.webm", "de": 30.6, "dur": 2.7 } }
// O recorte é a pessoa sem o fundo (npx hyperframes@0.8.207 remove-background sobre o trecho do
// camera.mp4 que começa em recorte.de), posto por cima da palavra, dentro do mesmo quadro da
// câmera (o punch-in leva os dois juntos). Só o contorno vira máscara: ele continua no fundo real,
// e nada salta do quadro (a pessoa recortada do fundo segue recusada). A frase da legenda que a
// palavra já diz e a que entraria em cima dela (oculta_frase, o número ou a lista de números no
// legenda.json) saem da tela.

export const PALAVRA_MAX = 1;          // a palavra de trás é uma palavra só, grande
const ID = /^[a-z0-9-]+$/;

const num = (x) => typeof x === 'number' && Number.isFinite(x);

export function conferirFaladoExtra(plano) {
  const erros = [];
  const E = (regra, msg) => erros.push({ regra, msg });
  const cenas = plano.cenas || [];
  const fim = plano.duracao || Math.max(0, ...cenas.map((c) => c.ate || 0));

  // a mídia das cenas
  const ids = new Set();
  for (const c of cenas) {
    for (const m of c.midia || []) {
      const quem = `${c.id}: a mídia "${m.id}"`;
      if (!ID.test(String(m.id || ''))) E('midia', `${c.id}: a mídia sem id de letras minúsculas, números e hífen (${JSON.stringify(m.id)})`);
      else if (ids.has(m.id)) E('midia', `${quem} repete o id; um por peça`);
      ids.add(m.id);
      if (!String(m.src || '').match(/\.(webm|mp4|mov)$/)) E('midia', `${quem} não é vídeo (webm, mp4 ou mov): imagem a cena desenha sozinha`);
      if (!num(m.de) || !num(m.ate) || !(m.ate > m.de)) E('midia', `${quem} sem o tempo (de < ate)`);
      else if (m.de < 0 || m.ate > fim + 1e-6) E('midia', `${quem} vai de ${m.de} a ${m.ate} s, fora da peça (0 a ${fim} s)`);
      if (!num(m.x) || !num(m.y) || !(m.w > 0)) E('midia', `${quem} sem a posição (x, y, w em px de 1080 × 1920)`);
    }
  }

  // a palavra atrás da cabeça
  const a = plano.atras;
  if (a != null) {
    const c = cenas.find((x) => x.id === a.cena);
    if (!c) E('atras', `a palavra de trás está na cena "${a.cena}", que não existe`);
    else if (!['legenda', 'legenda-interface'].includes(c.tipo)) E('atras', `${c.id} é ${c.tipo}: a palavra sobe de trás da cabeça da pessoa, então ela está na tela (cena de legenda)`);
    const palavras = String(a.palavra || '').trim().split(/\s+/).filter(Boolean);
    if (palavras.length !== PALAVRA_MAX) E('atras', `a palavra de trás tem ${palavras.length} palavras ("${a.palavra || ''}"); é uma, grande (a dona, pequena, vai em "dona")`);
    // o tempo de leitura (roteiro.md, "As contas"): caracteres ÷ 17 + 0,5 s, nunca menos de 1,2 s
    const leitura = Math.max(1.2, [...String(a.dona || '') + String(a.palavra || '')].length / 17 + 0.5);
    if (!num(a.em) || !num(a.ate) || !(a.ate - a.em + 1e-6 >= leitura)) E('atras', `a palavra de trás precisa de em e ate, com ${leitura.toFixed(2)} s ou mais na tela (o tempo de leitura)`);
    const ocultas = [].concat(a.oculta_frase ?? []);
    if (!ocultas.every((n) => Number.isInteger(n) && n > 0)) E('atras', 'oculta_frase é o número (ou a lista) da frase do legenda.json que a palavra de trás cobre');
    else if (c && !(a.em >= c.de - 1e-6 && a.em < c.ate)) E('atras', `a palavra de trás entra em ${a.em} s, fora da ${c.id} (${c.de} a ${c.ate} s)`);
    const r = a.recorte || {};
    if (!String(r.src || '').match(/\.(webm|mov)$/)) E('atras', 'o recorte da pessoa é um webm ou mov com transparência (npx hyperframes@0.8.207 remove-background)');
    if (!num(r.de) || !(r.dur > 0)) E('atras', 'o recorte precisa de "de" (o segundo do Reel em que o trecho começa) e "dur"');
    else if (num(a.em) && num(a.ate) && (a.em < r.de || a.ate + 0.3 > r.de + r.dur + 1e-6)) {
      E('atras', `o recorte cobre ${r.de} a ${+(r.de + r.dur).toFixed(3)} s, e a palavra fica de ${a.em} a ${a.ate} s mais a saída (0,3 s): fora do recorte, ela passaria na frente da cabeça`);
    }
    if (!num(a.topo) || a.topo < 0) E('atras', 'a palavra de trás precisa do topo (px de 1920), acima da cabeça');
  }

  // a costura sem corte: no falado, só entre duas telas cheias, em que a cena de antes segue
  // desenhando a de depois (o script dela devolve { entrada: false } e cuida da própria saída)
  cenas.forEach((c, i) => {
    if (c.transicao !== 'continuidade') return;
    const prox = cenas[i + 1];
    if (!prox || c.tipo !== 'tela-cheia' || prox.tipo !== 'tela-cheia') E('transicao', `${c.id}: a continuidade no falado é só entre duas telas cheias seguidas (a câmera não está no meio)`);
  });
  return { erros, avisos: [] };
}

const att = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const t3 = (x) => String(+Number(x).toFixed(3));

// a camada da mídia das cenas: acima das cenas (z 30), abaixo da legenda (z 40)
export function htmlDasMidias(plano) {
  const itens = (plano.cenas || []).flatMap((c) => (c.midia || []).map((m) => ({ ...m, cena: c.id })));
  if (!itens.length) return '';
  const tags = itens.map((m, i) => `<video id="m-${att(m.id)}" class="clip midia" data-cena="${att(m.cena)}" src="${att(m.src)}" data-start="${t3(m.de)}" data-duration="${t3(m.ate - m.de)}" data-media-start="${t3(m.media_de || 0)}" data-track-index="${20 + i}" muted playsinline preload="auto" data-layout-allow-overflow data-layout-allow-overlap style="position:absolute;left:${Math.round(m.x)}px;top:${Math.round(m.y)}px;width:${Math.round(m.w)}px;height:auto"></video>`);
  return `<div id="midias" style="position:absolute;left:0;top:0;width:1080px;height:1920px;z-index:35;pointer-events:none" data-layout-allow-overflow>\n        ${tags.join('\n        ')}\n      </div>`;
}

// a palavra e o recorte, dentro do #quadro, depois da câmera: a palavra atrás, a pessoa na frente
export function htmlDoAtras(plano) {
  const a = plano.atras;
  if (!a) return '';
  const r = a.recorte;
  return `<div id="atras" data-layout-allow-overlap data-layout-allow-overflow style="position:absolute;left:0;width:1080px;top:${Math.round(a.topo)}px;text-align:center;font-family:var(--f-display);pointer-events:none"><span class="dona" style="display:block;font-size:54px;font-weight:var(--w-display-med);color:var(--on-light);letter-spacing:-0.01em">${att(a.dona || '')}</span><span class="grande" style="display:block;font-size:${Math.round(a.tamanho || 236)}px;line-height:0.86;font-weight:var(--w-display-bold);color:var(--on-light);letter-spacing:-0.06em">${att(a.palavra)}</span></div>
        <video id="atras-recorte" class="clip" src="${att(r.src)}" data-start="${t3(r.de)}" data-duration="${t3(r.dur)}" data-media-start="0" data-track-index="9" muted playsinline preload="auto" data-layout-allow-overflow style="position:absolute;left:0;top:0;width:1080px;height:1920px;object-fit:cover"></video>`;
}
