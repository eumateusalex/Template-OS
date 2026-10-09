// A geometria do Guardanapo: o tamanho de cada elemento, a borda
// onde a seta encosta, a quebra de linha e a semente. Sem SVG aqui: quem
// desenha é o `desenhar.mjs`, e quem confere a sobreposição é o `conferir.mjs`,
// os dois lendo esta mesma geometria.
import { T } from './tokens.mjs';

/** O que conta como nó no teto do formato: pessoa conta, grupo e estrutura não. */
export const NOS = new Set(['no', 'elipse', 'losango', 'folha', 'pessoa']);

const PESSOA = { largura: 140, altura: 272 };
const FOLGA_SETA = 8; // o vão entre a ponta da seta e a borda do nó
const RESPIRO = 32; // o de dentro do nó, de cada lado do texto

/** Semente do rough.js pelo nome: o mesmo nome desenha igual em todo quadro. */
export function semente(nome) {
  let h = 2166136261;
  for (const ch of String(nome)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return (h % 2147483646) + 1;
}

/**
 * A família, o peso, a entrelinha e a régua de largura de um papel de texto.
 * `larguraDe(s, tam)` usa a largura REAL de cada palavra quando o render já a
 * mediu no navegador (`cena.medidasDePalavra`, em px a 100 px, por família e
 * peso); sem a medida, vale a estimativa do guia (o fator por caractere). É a
 * medida que acerta a quebra de linha: a estimativa erra para os dois lados.
 */
export function letra(papel, cena = {}) {
  const fonte = cena.fonte ?? T.fontePadrao;
  const inter = fonte === 'inter' || (fonte === 'hibrida' && papel === 'frase');
  const L = inter
    ? { familia: T.familia.inter, peso: papel === 'titulo' ? 700 : 400, fator: T.largura.inter, entrelinha: T.entrelinha.inter }
    : { familia: T.familia.mao, peso: 400, fator: T.largura.mao, entrelinha: T.entrelinha.mao };
  const medidas = cena.medidasDePalavra?.[`${L.familia}|${L.peso}`];
  L.larguraDe = (s, tam) => {
    const ws = String(s).split(' ');
    if (medidas && medidas[' '] !== undefined && ws.every((w) => medidas[w] !== undefined || w === '')) {
      return ((ws.reduce((a, w) => a + (medidas[w] ?? 0), 0) + (ws.length - 1) * medidas[' ']) * tam) / 100;
    }
    return String(s).length * L.fator * tam;
  };
  L.espaco = (tam) => (medidas && medidas[' '] !== undefined ? (medidas[' '] * tam) / 100 : L.fator * tam);
  return L;
}

/** O tamanho de cada nível na peça: o padrão, ou o que a cena pediu. */
export function tamanhos(cena) {
  const t = cena.tamanhos || {};
  return {
    titulo: t.titulo ?? T.nivel.titulo.padrao,
    rotulo: t.rotulo ?? T.nivel.rotulo.padrao,
    frase: t.frase ?? T.nivel.frase.padrao,
  };
}

/**
 * Quebra o texto na largura, pela estimativa de largura por caractere. A
 * quebra forçada (\n) manda. A palavra maior que a linha fica sozinha nela, e
 * quem pega o transbordo é o render, com a métrica de verdade.
 */
export function quebrar(texto, larguraMax, tamanho, L) {
  const medir = (s) => L.larguraDe(s, tamanho);
  const linhas = [];
  for (const paragrafo of String(texto ?? '').split('\n')) {
    let atual = '';
    for (const palavra of paragrafo.split(/\s+/).filter(Boolean)) {
      const tentativa = atual ? `${atual} ${palavra}` : palavra;
      if (atual && medir(tentativa) > larguraMax) {
        linhas.push(atual);
        atual = palavra;
      } else {
        atual = tentativa;
      }
    }
    linhas.push(atual);
  }
  return linhas;
}

const larguraEstimada = (linhas, tamanho, L) =>
  Math.max(0, ...linhas.map((l) => L.larguraDe(l, tamanho)));

/**
 * As linhas de texto de um elemento que tem rótulo, quebradas na largura de
 * dentro dele. Anotação e texto solto quebram na largura que a cena deu.
 */
export function linhasDe(el, cena) {
  if (!el.texto) return [];
  const tam = tamanhos(cena).rotulo;
  const L = letra('rotulo', cena);
  if (el.tipo === 'anotacao' || el.tipo === 'texto') return quebrar(el.texto, el.largura ?? 420, tam, L);
  if (el.tipo === 'pessoa' || el.tipo === 'grupo') return [String(el.texto)];
  const dentro = (el.largura ?? 360) - 2 * RESPIRO;
  return quebrar(el.texto, el.tipo === 'losango' ? dentro * 0.6 : dentro, tam, L);
}

/** A altura do nó: 48 px mais o maior entre 2,2 vezes o nível 2 e as linhas. */
export function alturaDoNo(nLinhas, rotulo, entrelinha) {
  return 48 + Math.max(2.2 * rotulo, nLinhas * rotulo * entrelinha);
}

/** A caixa { x, y, w, h } de um elemento, por nome, na cena. */
export function caixa(id, cena, visitados = new Set()) {
  const el = cena.elementos[id];
  if (!el) throw new Error(`guardanapo: o elemento "${id}" não existe na cena`);
  const tam = tamanhos(cena).rotulo;
  const Lr = letra('rotulo', cena);
  const { entrelinha } = Lr;
  const linhas = linhasDe(el, cena);
  switch (el.tipo) {
    case 'no':
    case 'folha': {
      const w = el.largura ?? 360;
      return { x: el.x, y: el.y, w, h: el.altura ?? alturaDoNo(Math.max(1, linhas.length), tam, entrelinha) };
    }
    case 'elipse': {
      const w = el.largura ?? 360;
      return { x: el.x, y: el.y, w, h: el.altura ?? Math.round(1.3 * alturaDoNo(Math.max(1, linhas.length), tam, entrelinha)) };
    }
    case 'losango': {
      const w = el.largura ?? 360;
      return { x: el.x, y: el.y, w, h: el.altura ?? Math.max(160, 2 * linhas.length * tam * entrelinha + 48) };
    }
    case 'pessoa':
      return { x: el.x, y: el.y, w: PESSOA.largura, h: PESSOA.altura };
    case 'anotacao':
    case 'texto':
      return { x: el.x, y: el.y, w: larguraEstimada(linhas, tam, Lr), h: linhas.length * tam * entrelinha };
    case 'certo':
      return { x: el.x, y: el.y, w: 48, h: 48 };
    case 'linha': {
      const xs = el.pontos.map((p) => p[0]);
      const ys = el.pontos.map((p) => p[1]);
      return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
    }
    case 'grupo': {
      if (visitados.has(id)) throw new Error(`guardanapo: o grupo "${id}" contém a si mesmo`);
      visitados.add(id);
      const cs = (el.contem || []).map((f) => caixa(f, cena, visitados));
      if (!cs.length) throw new Error(`guardanapo: o grupo "${id}" não contém nada`);
      const x0 = Math.min(...cs.map((c) => c.x)) - RESPIRO;
      const x1 = Math.max(...cs.map((c) => c.x + c.w)) + RESPIRO;
      const y0 = Math.min(...cs.map((c) => c.y)) - RESPIRO - (el.texto ? tam * entrelinha + 8 : 0);
      const y1 = Math.max(...cs.map((c) => c.y + c.h)) + RESPIRO;
      return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    }
    default:
      throw new Error(`guardanapo: o tipo "${el.tipo}" do elemento "${id}" não existe`);
  }
}

export const centro = (c) => [c.x + c.w / 2, c.y + c.h / 2];

/** O ponto da borda da caixa na direção do alvo, com o vão da seta por fora. */
export function borda(c, tipo, alvo) {
  const [cx, cy] = centro(c);
  const dx = alvo[0] - cx;
  const dy = alvo[1] - cy;
  const rx = c.w / 2;
  const ry = c.h / 2;
  if (!dx && !dy) return [cx, cy];
  let t;
  if (tipo === 'elipse') t = 1 / Math.hypot(dx / rx, dy / ry);
  else if (tipo === 'losango') t = 1 / (Math.abs(dx) / rx + Math.abs(dy) / ry);
  else t = Math.min(dx ? rx / Math.abs(dx) : Infinity, dy ? ry / Math.abs(dy) : Infinity);
  const n = Math.hypot(dx, dy);
  return [cx + dx * t + (dx / n) * FOLGA_SETA, cy + dy * t + (dy / n) * FOLGA_SETA];
}

/** Início, fim e (se curva) o ponto de controle de uma seta presa. */
export function pontasDaSeta(el, cena) {
  const de = cena.elementos[el.de];
  const cDe = caixa(el.de, cena);
  const alvoCentro = el.saida ? el.ate : centro(caixa(el.para, cena));
  const inicio = borda(cDe, de.tipo, alvoCentro);
  const fim = el.saida ? el.ate : borda(caixa(el.para, cena), cena.elementos[el.para].tipo, centro(cDe));
  const [mx, my] = [(inicio[0] + fim[0]) / 2, (inicio[1] + fim[1]) / 2];
  const len = Math.hypot(fim[0] - inicio[0], fim[1] - inicio[1]);
  const controle = el.curva
    ? [mx - ((fim[1] - inicio[1]) / len) * el.curva * len, my + ((fim[0] - inicio[0]) / len) * el.curva * len]
    : null;
  return { inicio, fim, controle };
}

/**
 * O estado de cada elemento em cada quadro: um Map de nome para estado.
 *   capa       o que a capa mostra, preto e sem rótulo; não conta como mostrado
 *   novo       o que o quadro mostra pela primeira vez (ou de novo)
 *   mostrado   o que veio de quadro anterior (sai em cinza)
 *   estrutura  funil, eixo, grupo marcado como estrutura: cinza fora da capa
 * A anotação vale só no quadro dela, e por isso não acumula.
 */
export function estados(cena) {
  const acumulado = new Set();
  const estruturaDaCapa = new Set();
  return cena.quadros.map((q) => {
    const m = new Map();
    const mostrar = q.mostrar || [];
    const el = (id) => cena.elementos[id] || {};
    if (q.papel === 'capa') {
      for (const id of mostrar) {
        m.set(id, 'capa');
        if (el(id).estrutura) estruturaDaCapa.add(id);
      }
      return m;
    }
    for (const id of estruturaDaCapa) m.set(id, 'estrutura');
    for (const id of acumulado) {
      if (el(id).tipo === 'anotacao') continue;
      m.set(id, el(id).estrutura ? 'estrutura' : 'mostrado');
    }
    for (const id of mostrar) {
      m.set(id, el(id).estrutura ? 'estrutura' : 'novo');
      acumulado.add(id);
    }
    return m;
  });
}

/**
 * O nome da pessoa, que vai acima da cabeça: o centro da linha e a caixa que ele
 * ocupa. O desenho e a conferência leem daqui, para os dois não divergirem.
 */
export function nomeDaPessoa(c, cena) {
  const tam = tamanhos(cena).rotulo;
  const L = letra('rotulo', cena);
  const yc = c.y - 0.8 * tam;
  const topo = yc - (tam * L.entrelinha) / 2;
  return { x: c.x + c.w / 2, yc, topo };
}

export const RESPIRO_DO_NO = RESPIRO;

/**
 * A área livre para o desenho no quadro: começa abaixo das linhas do título e
 * termina acima das linhas da frase, com a entrelinha da fonte da cena. A
 * conferência e a régua impressa leem daqui, para as duas não divergirem.
 */
export function areaLivre(linhasTitulo, linhasFrase, cena = {}) {
  const tam = tamanhos(cena);
  const piso = linhasTitulo ? T.margem + linhasTitulo * tam.titulo * letra('titulo', cena).entrelinha + T.respiroDaArea : T.margem;
  const teto = linhasFrase
    ? T.quadro.altura - T.margem - linhasFrase * tam.frase * letra('frase', cena).entrelinha - T.respiroDaArea
    : T.quadro.altura - T.margem;
  return { piso, teto };
}
