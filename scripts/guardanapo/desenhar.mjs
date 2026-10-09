// O desenho do Guardanapo: a cena vira um SVG por quadro, no traço à mão do
// rough.js, com as cores da marca pelo papel.
//
// O estado do elemento no quadro decide a cor: o novo na tinta dele, o já
// mostrado e a estrutura em cinza, a capa em preto sem rótulo. A semente sai
// do nome do elemento, então o desenho não "treme" de um quadro para o outro.
//
// 🚨 A cena não escolhe cor: escolhe a tinta (problema, solucao, contexto). O
// destaque só entra pelo destaque do quadro. É a construção que impede a cor
// fora da paleta, e o `conferir.mjs` mede o resto.
import rough from 'roughjs/bundled/rough.esm.js';
import { T } from './tokens.mjs';
import {
  semente, letra, tamanhos, quebrar, linhasDe, caixa, centro, borda, pontasDaSeta, estados, nomeDaPessoa,
} from './geometria.mjs';

const g = rough.generator();
const f = (n) => +Number(n).toFixed(1);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const CAMADA = { grupo: 0, linha: 1, seta: 3, anotacao: 4, texto: 4 };
const camada = (tipo) => CAMADA[tipo] ?? 2;

function opcoes(id, cor, largura, extra = {}) {
  return { seed: semente(id), roughness: T.rugosidade, bowing: 1, stroke: cor, strokeWidth: largura, preserveVertices: true, ...extra };
}

// o drawable do rough.js em <path>; o tracejado vale só no contorno
function paths(d, marca = '') {
  const o = d.options;
  return g.toPaths(d).map((p, i) => {
    const contorno = p.stroke === o.stroke && p.strokeWidth === o.strokeWidth;
    const dash = o.strokeLineDash && contorno ? ` stroke-dasharray="${o.strokeLineDash.join(' ')}"` : '';
    const m = i === 0 ? marca : '';
    return `<path${m} d="${p.d}" stroke="${p.stroke}" stroke-width="${f(p.strokeWidth)}" fill="${p.fill || 'none'}" stroke-linecap="round" stroke-linejoin="round"${dash}/>`;
  }).join('');
}

function retRedondo({ x, y, w, h }) {
  const r = Math.min(T.raio, w / 4, h / 4);
  return `M ${x + r} ${y} L ${x + w - r} ${y} Q ${x + w} ${y} ${x + w} ${y + r} L ${x + w} ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} `
    + `L ${x + r} ${y + h} Q ${x} ${y + h} ${x} ${y + h - r} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;
}

function preenchimento(el, largura) {
  if (el.preenchimento === 'chapado') return { fill: el.tipo === 'grupo' ? T.cor.grupo : T.cor.superficie, fillStyle: 'solid' };
  if (el.preenchimento === 'hachura') {
    return { fill: T.cor.contexto, fillStyle: 'hachure', hachureGap: 4 * largura, fillWeight: largura / 2, hachureAngle: -41 };
  }
  return {};
}

/** O contorno de um elemento com forma, na cor e na espessura pedidas. */
export function forma(id, el, c, cor, largura) {
  const o = opcoes(id, cor, largura, preenchimento(el, largura));
  if (el.opcional) Object.assign(o, { strokeLineDash: [8, 8 + largura], disableMultiStroke: true });
  const [cx, cy] = centro(c);
  switch (el.tipo) {
    case 'no':
    case 'grupo':
      return paths(g.path(retRedondo(c), o));
    case 'folha':
      return paths(g.rectangle(c.x, c.y, c.w, c.h, o));
    case 'elipse':
      return paths(g.ellipse(cx, cy, c.w, c.h, { ...o, curveFitting: 1 }));
    case 'losango':
      return paths(g.polygon([[cx, c.y], [c.x + c.w, cy], [cx, c.y + c.h], [c.x, cy]], o));
    case 'pessoa': {
      const m = c.x + c.w / 2;
      return [
        paths(g.ellipse(m, c.y + 32, 52, 60, o)),
        paths(g.linearPath([[m, c.y + 62], [m, c.y + 180]], o)),
        paths(g.linearPath([[m - 50, c.y + 150], [m, c.y + 100], [m + 50, c.y + 150]], o)),
        paths(g.linearPath([[m - 40, c.y + c.h], [m, c.y + 180], [m + 40, c.y + c.h]], o)),
      ].join('');
    }
    default:
      return '';
  }
}

/** Um bloco de texto, centrado na vertical em yc, uma <tspan> por linha. */
function texto(linhas, x, yc, tam, L, cor, ancora, marca = '') {
  const lh = tam * L.entrelinha;
  const y0 = yc - (linhas.length * lh) / 2 + lh / 2;
  const tspans = linhas.map((l, i) => `<tspan x="${f(x)}" y="${f(y0 + i * lh)}">${esc(l)}</tspan>`).join('');
  // a família vai entre aspas: "Inter 4" sem aspas é nome inválido em CSS (a
  // palavra começa com número), e o navegador cai calado na fonte padrão
  return `<text${marca} font-family="'${L.familia}'" font-size="${tam}" font-weight="${L.peso}" fill="${cor}" `
    + `text-anchor="${ancora}" dominant-baseline="central">${tspans}</text>`;
}

// o risco por cima de cada linha: é ele, e não a cor, que diz "errado"
function risco(id, linhas, x, yc, tam, L, ancora) {
  const lh = tam * L.entrelinha;
  const y0 = yc - (linhas.length * lh) / 2 + lh / 2;
  return linhas.map((l, i) => {
    const w = L.larguraDe(l, tam);
    const x0 = ancora === 'middle' ? x - w / 2 : x;
    return paths(g.line(x0 - 8, y0 + i * lh, x0 + w + 8, y0 + i * lh, opcoes(`${id}:risco:${i}`, T.cor.contexto, T.traco.base)));
  }).join('');
}

function ponta(id, de, fim, cor) {
  const ang = Math.atan2(fim[1] - de[1], fim[0] - de[0]);
  const len = 5 * T.traco.base;
  const lado = (s) => [fim[0] - len * Math.cos(ang + s * 0.5), fim[1] - len * Math.sin(ang + s * 0.5)];
  return paths(g.linearPath([lado(1), fim, lado(-1)], opcoes(`${id}:ponta`, cor, T.traco.base)), ' data-ponta');
}

function corDe(el, estado) {
  if (estado === 'capa') return T.cor.problema;
  if (estado === 'estrutura' || estado === 'mostrado' || el.riscado) return T.cor.contexto;
  return T.cor[el.tinta ?? (el.tipo === 'certo' ? 'solucao' : 'problema')];
}

/** Um elemento no quadro, num <g> com o nome dele. */
function elemento(id, cena, estado, tam) {
  const el = cena.elementos[id];
  const cor = corDe(el, estado);
  const comTexto = estado !== 'capa';
  const Lr = letra('rotulo', cena);
  const base = T.traco.base;
  if (el.tipo === 'seta') {
    const { inicio, fim, controle } = pontasDaSeta(el, cena);
    const o = opcoes(id, cor, base);
    if (el.opcional) Object.assign(o, { strokeLineDash: [8, 8 + base], disableMultiStroke: true });
    const corpo = controle ? g.curve([inicio, controle, fim], o) : g.line(...inicio, ...fim, o);
    let rot = '';
    if (el.rotulo && comTexto) {
      // o rótulo vai por fora da curva: acima do ponto mais alto da seta
      // deitada, à direita do ponto mais à direita da seta em pé
      const pts = [inicio, fim, ...(controle ? [controle] : [])];
      const mx = (inicio[0] + fim[0]) / 2;
      const my = (inicio[1] + fim[1]) / 2;
      const deitada = Math.abs(fim[0] - inicio[0]) >= Math.abs(fim[1] - inicio[1]);
      // o lado pedido na cena manda; sem ele, acima na deitada e à direita na em pé
      const lado = el.lado ?? (deitada ? 'acima' : 'direita');
      const ys = pts.map((p) => p[1]);
      const xs = pts.map((p) => p[0]);
      rot = {
        acima: () => texto([el.rotulo], mx, Math.min(...ys) - 0.75 * tam.rotulo, tam.rotulo, Lr, cor, 'middle'),
        abaixo: () => texto([el.rotulo], mx, Math.max(...ys) + 0.75 * tam.rotulo, tam.rotulo, Lr, cor, 'middle'),
        direita: () => texto([el.rotulo], Math.max(...xs) + 16, my, tam.rotulo, Lr, cor, 'start'),
        esquerda: () => texto([el.rotulo], Math.min(...xs) - 16, my, tam.rotulo, Lr, cor, 'end'),
      }[lado]();
    }
    const cab = `<g data-id="${esc(id)}" data-tipo="seta" data-inicio="${f(inicio[0])},${f(inicio[1])}" data-fim="${f(fim[0])},${f(fim[1])}">`;
    return `${cab}${paths(corpo)}${ponta(id, controle ?? inicio, fim, cor)}${rot}</g>`;
  }
  if (el.tipo === 'linha') {
    const larg = el.fino ? T.traco.fino : base;
    return `<g data-id="${esc(id)}" data-tipo="linha">${paths(g.linearPath(el.pontos, opcoes(id, cor, larg)))}</g>`;
  }
  const c = caixa(id, cena);
  const cx = `${f(c.x)},${f(c.y)},${f(c.x + c.w)},${f(c.y + c.h)}`;
  const cab = `<g data-id="${esc(id)}" data-tipo="${el.tipo}" data-caixa="${cx}">`;
  const linhas = linhasDe(el, cena);
  if (el.tipo === 'anotacao' || el.tipo === 'texto') {
    const yc = c.y + c.h / 2;
    let seta = '';
    if (el.aponta && comTexto) {
      const alvo = caixa(el.aponta, cena);
      const [ax, ay] = centro(alvo);
      const saida = ax > c.x + c.w ? [c.x + c.w + 12, yc] : ax < c.x ? [c.x - 12, yc] : [c.x + c.w / 2, ay > yc ? c.y + c.h + 8 : c.y - 8];
      const fim = borda(alvo, cena.elementos[el.aponta].tipo, saida);
      const len = Math.hypot(fim[0] - saida[0], fim[1] - saida[1]);
      const ctrl = [(saida[0] + fim[0]) / 2 - ((fim[1] - saida[1]) / len) * 0.2 * len, (saida[1] + fim[1]) / 2 + ((fim[0] - saida[0]) / len) * 0.2 * len];
      seta = paths(g.curve([saida, ctrl, fim], opcoes(`${id}:seta`, cor, base))) + ponta(id, ctrl, fim, cor);
    }
    const corpo = comTexto ? texto(linhas, c.x, yc, tam.rotulo, Lr, cor, 'start') + (el.riscado ? risco(id, linhas, c.x, yc, tam.rotulo, Lr, 'start') : '') : '';
    return `${cab}${corpo}${seta}</g>`;
  }
  if (el.tipo === 'certo') {
    return `${cab}${paths(g.linearPath([[c.x, c.y + 26], [c.x + 18, c.y + 44], [c.x + 48, c.y + 4]], opcoes(id, cor, base)))}</g>`;
  }
  const contorno = el.tipo === 'grupo' ? T.cor.contexto : cor;
  let desenho = forma(id, el, c, contorno, el.tipo === 'grupo' ? T.traco.fino : base);
  if (comTexto && el.texto) {
    if (el.tipo === 'grupo') {
      desenho += texto(linhas, c.x + 24, c.y + 24 + (tam.rotulo * Lr.entrelinha) / 2, tam.rotulo, Lr, cor, 'start');
    } else if (el.tipo === 'pessoa') {
      const nome = nomeDaPessoa(c, cena);
      desenho += texto(linhas, nome.x, nome.yc, tam.rotulo, Lr, cor, 'middle');
    } else {
      const [mx, my] = centro(c);
      desenho += texto(linhas, mx, my, tam.rotulo, Lr, cor, 'middle');
      if (el.riscado) desenho += risco(id, linhas, mx, my, tam.rotulo, Lr, 'middle');
    }
  }
  return `${cab}${desenho}</g>`;
}

/** A caixa do alvo de um destaque: um elemento, uma seta, ou uma palavra do título. */
function caixaDoAlvo(d, cena, q, tam, metricas) {
  if (d.alvo === 'titulo') {
    const chave = `titulo:${d.palavra}`;
    if (metricas[chave]) return metricas[chave];
    const L = letra('titulo', cena);
    const linhas = quebrar(q.titulo, T.quadro.largura - 2 * T.margem, tam.titulo, L);
    const lh = tam.titulo * L.entrelinha;
    const li = Math.max(0, linhas.findIndex((l) => l.toLowerCase().includes(String(d.palavra).toLowerCase())));
    const ci = Math.max(0, linhas[li].toLowerCase().indexOf(String(d.palavra).toLowerCase()));
    const yc = T.margem + lh * (li + 0.5);
    const antes = linhas[li].slice(0, ci);
    const x0 = T.margem + (antes ? L.larguraDe(antes.trimEnd(), tam.titulo) + L.espaco(tam.titulo) : 0);
    return { x: x0, y: yc - tam.titulo / 2, w: L.larguraDe(String(d.palavra), tam.titulo), h: tam.titulo };
  }
  if (metricas[`texto:${d.alvo}`] && d.tipo === 'sublinhado') return metricas[`texto:${d.alvo}`];
  const el = cena.elementos[d.alvo];
  if (el?.tipo === 'seta') {
    const { inicio, fim } = pontasDaSeta(el, cena);
    return { x: Math.min(inicio[0], fim[0]), y: Math.min(inicio[1], fim[1]), w: Math.abs(fim[0] - inicio[0]), h: Math.abs(fim[1] - inicio[1]) };
  }
  return caixa(d.alvo, cena);
}

/** O destaque do quadro, sempre na cor de destaque e no traço de destaque. */
function destaque(d, cena, q, tam, metricas) {
  const cor = T.cor.destaque;
  const w = T.traco.destaque;
  const o = opcoes(`destaque:${d.alvo}`, cor, w);
  const c = caixaDoAlvo(d, cena, q, tam, metricas);
  const [cx, cy] = centro(c);
  let desenho = '';
  if (d.tipo === 'circulo') {
    const rx = c.w / 2 + 28;
    const ry = c.h / 2 + 28;
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const t = -0.6 + (i / 40) * 2 * Math.PI * 1.04;
      const k = 1 + 0.06 * (i / 40);
      pts.push([cx + rx * k * Math.cos(t), cy + ry * k * Math.sin(t)]);
    }
    desenho = paths(g.curve(pts, o));
  } else if (d.tipo === 'sublinhado') {
    const y = c.y + c.h + 6;
    desenho = paths(g.curve([[c.x - 4, y], [cx, y + 5], [c.x + c.w + 4, y - 2]], o));
  } else if (d.tipo === 'foco') {
    desenho = forma(d.alvo, cena.elementos[d.alvo], c, cor, w);
  } else if (d.tipo === 'seta') {
    const fim = borda(c, cena.elementos[d.alvo]?.tipo, d.de);
    const len = Math.hypot(fim[0] - d.de[0], fim[1] - d.de[1]);
    const ctrl = [(d.de[0] + fim[0]) / 2 - ((fim[1] - d.de[1]) / len) * 0.2 * len, (d.de[1] + fim[1]) / 2 + ((fim[0] - d.de[0]) / len) * 0.2 * len];
    desenho = paths(g.curve([d.de, ctrl, fim], o)) + ponta(`destaque:${d.alvo}`, ctrl, fim, cor);
  }
  return `<g data-id="destaque" data-tipo="${d.tipo}" data-alvo="${esc(d.alvo)}">${desenho}</g>`;
}

function tituloEFrase(q, cena, tam) {
  const largura = T.quadro.largura - 2 * T.margem;
  let s = '';
  if (q.titulo) {
    const L = letra('titulo', cena);
    const linhas = quebrar(q.titulo, largura, tam.titulo, L);
    const lh = tam.titulo * L.entrelinha;
    s += texto(linhas, T.margem, T.margem + (linhas.length * lh) / 2, tam.titulo, L, T.cor.problema, 'start', ' data-papel="titulo"');
  }
  if (q.frase) {
    const L = letra('frase', cena);
    const linhas = quebrar(q.frase, largura, tam.frase, L);
    const lh = tam.frase * L.entrelinha;
    const base = T.quadro.altura - T.margem;
    s += texto(linhas, T.margem, base - (linhas.length * lh) / 2, tam.frase, L, T.cor.problema, 'start', ' data-papel="frase"');
  }
  return s;
}

/**
 * A cena em SVG, um por quadro. `metricas` (opcional) traz a posição medida
 * no navegador das palavras que o destaque aponta; sem ela, vale a estimativa.
 */
export function desenhar(cenaDada, { metricas = {} } = {}) {
  const cena = metricas.palavras ? { ...cenaDada, medidasDePalavra: metricas.palavras } : cenaDada;
  const tam = tamanhos(cena);
  const est = estados(cena);
  const ordem = Object.keys(cena.elementos);
  return cena.quadros.map((q, i) => {
    const ids = [...est[i].keys()].sort((a, b) => camada(cena.elementos[a]?.tipo) - camada(cena.elementos[b]?.tipo) || ordem.indexOf(a) - ordem.indexOf(b));
    const partes = [`<rect width="${T.quadro.largura}" height="${T.quadro.altura}" fill="${T.cor.fundo}"/>`];
    for (const id of ids) partes.push(elemento(id, cena, est[i].get(id), tam));
    if (q.destaque) partes.push(destaque(q.destaque, cena, q, tam, metricas));
    partes.push(tituloEFrase(q, cena, tam));
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${T.quadro.largura}" height="${T.quadro.altura}" viewBox="0 0 ${T.quadro.largura} ${T.quadro.altura}">${partes.join('')}</svg>`;
  });
}

