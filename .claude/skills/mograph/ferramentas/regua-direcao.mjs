// As réguas de direção da peça (auditoria.md). Cada uma devolve { erros, avisos }.
//
//   node regua-direcao.mjs zona        <pasta> [--formato <chave do formatos.json>] [--passo 0.1]
//   node regua-direcao.mjs tela        <pasta>            # a peça contra o texto_tela do plano.json
//   node regua-direcao.mjs parado      <render.mp4>       # lê a vírgula do plano.json, se houver
//   node regua-direcao.mjs bordas      <render.mp4>       # a faixa chapada na borda (bordas.mjs)
//   node regua-direcao.mjs som         <pasta>            # o efeito sonoro descolado da imagem (som-do-puro.mjs)
//   node regua-direcao.mjs cor         <render.mp4>       # o vídeo apagado, em tom de cinza (cor.mjs); ou <pasta> --mp4 <render>, como no tudo
//   node regua-direcao.mjs transicoes  <pasta>            # as costuras do plano.json
//   node regua-direcao.mjs curvas      <pasta>            # lê as exceções do plano.json
//   node regua-direcao.mjs recusados   <pasta>
//   node regua-direcao.mjs oficio      <pasta>            # o que a máquina vê do ofício (oficio.md § 5 e o manual)
//   node regua-direcao.mjs cromo       <pasta>            # o que faz o vídeo parecer slide (cromo.mjs)
//   node regua-direcao.mjs estimulo    <pasta>            # no máximo 3 s sem corte nem efeito de som
//   node regua-direcao.mjs manual      <pasta>            # as técnicas e o som do kit (regua-manual.mjs)
//   node regua-direcao.mjs tudo        <pasta> --mp4 <render.mp4> [--formato ...]
//
// zona     a legenda que encosta num objeto da cena por 0,3 s ou mais; e a tinta de cada texto e
//          de cada forma desenhada (o traço do SVG, a imagem, o marcado
//          data-zona="chave") fora da zona segura do destino, com a peça aberta no navegador e a
//          timeline parada a cada 0,1 s; mede a letra e o traço que se veem, cortados pelo
//          overflow e pelo clip-path (data-zona="livre" tira da conta só o desenho decorativo,
//          nunca o texto; o vídeo da câmera não conta)
// tela     o texto de cena que se vê está no texto_tela do plano; cada frase declarada aparece
//          inteira e fica o tempo de leitura (a legenda da /cortes e o data-texto="objeto" não contam)
// parado   o quadro inteiro parado no render (parado.mjs, 10 qps, o grão apagado pela média):
//          acima de 0,75 s fora da vírgula reprova, o fim parado acima de 1,4 s reprova, e mais
//          de uma vírgula sem declarar avisa; a câmera que anda devagar não é parada; a massa
//          (o quadro inteiro quase parado em mais de 60% dos quadros), na peça e em cada cena de
//          animação do plano, avisa
// som      o efeito sonoro descolado da imagem: cada <audio> do index.html contra os instantes que a
//          peça expõe agora; mais de 1 quadro reprova (som-do-puro.mjs, somDescolado). Sem fonte/som.json, não se aplica
// cor      o vídeo apagado: o p90 da saturação dos quadros abaixo de 8 avisa (cor.mjs).
//          Reprova só o que não se mediu
// transicoes  mais de 3 tipos (o morph e a continuidade não contam), dissolver, sentido espelhado ou faltando
//          no corte na curva e no zoom, e ida e volta de sentido em cortes seguidos
// curvas   bounce e elastic, em qualquer grafia, seguem as recusas da marca: recusados, reprovam
//          firme; permitidos, avisam; back.out sem a exceção escrita no plano para aquela cena é aviso
// oficio   a imagem: cada cena de 1 s ou mais tem matéria (foto, vídeo, canvas, ícone 3D, o
//          marcado data-materia) com 3% do quadro ou mais em metade do tempo dela; as curvas:
//          3 ou mais na timeline, e a entrada só por fade (opacidade com subida curta) em menos
//          da metade das entradas; o som do puro: abaixo de 3 tipos de efeito reprova, 3 e 4
//          avisam (o ofício pede 5 a 7 famílias), acima de 8 avisa (manual: comum.mundo.seis-camadas, comum.movimento.variedade, comum.som.familias)
// cromo    o rótulo parado no canto, o contador "02 / 04", o metadado de produção, o rótulo
//          pequeno acima do título e o objeto preso no mesmo lugar em 3 cenas (cromo.mjs); o
//          contador e o kicker seguem as recusas da marca, como o bounce e o elastic
// As recusas saem do `recusas` do identidade/marca.tokens.json (lerMarca); sem marca, as quatro
//          (bounce, elastic, kicker, contador) valem, e a linha de comando avisa
// estimulo o intervalo sem corte de cena, troca de enquadramento, frase nova da voz nem efeito de som
//          que se ouve (o som.json no falado, o <audio> no puro; o inaudível pelo simula_mix.py
//          --contexto; a legenda é fundo): acima de 3 s avisa, acima de 5 s reprova
// A linguagem e o estilo do plano (linguagem.mjs) mudam o que dispensam: o piso de tipos de efeito
//          do oficio (documental, so-efeitos) e o dissolver com causa na transicoes (documental)
// O formato sai do --formato, ou do campo formato do plano, ou do destino (anuncio-reels ou reel).
// Régua que não mediu reprova: não medir não é passar.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chamadoDireto } from './principal.mjs';
import { parado } from './parado.mjs';
import { bordas } from './bordas.mjs';
import { cor, semMundo } from './cor.mjs';
import { conferirSom } from './som-do-puro.mjs';
import { lerDados, preencherDoCorte } from './plano.mjs';
import { cromoDasAmostras, RECUSAS_DO_CROMO } from './cromo.mjs';
import { calibrar, conferirExcecoes } from './excecoes.mjs';
import { perfilDoPlano } from './linguagem.mjs';
import { lerMarca, paradaDe } from '../../../../scripts/marca/marca.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const FORMATOS = join(AQUI, '..', '..', 'video', 'ferramentas', 'formatos.json');
const TRANSICOES_MAX = 3;
// a continuidade (o objeto que nasce de dentro do anterior) é a preferida e não gasta tipo
const NAO_CONTAM = new Set(['morph', 'continuidade']);
const TIPOS_TRANSICAO = ['corte', 'curva', 'zoom-dentro', 'zoom-fora', 'morph', 'continuidade', 'foco', 'flash', 'dissolver'];
const COM_VETOR = ['curva', 'zoom-dentro', 'zoom-fora'];

function codigoDaPeca(pasta) {
  const arquivos = [];
  const ver = (dir, fundo) => {
    if (!existsSync(dir)) return;
    for (const n of readdirSync(dir)) {
      if (n.startsWith('_') || n === 'node_modules' || n.startsWith('.')) continue;
      const a = join(dir, n);
      const st = statSync(a);
      if (st.isDirectory()) { if (fundo > 0) ver(a, fundo - 1); }
      else if (/\.(html|js|mjs|css)$/.test(n) && n !== 'dados.js' && n !== 'plano.js') arquivos.push(a);
    }
  };
  ver(pasta, 2);
  return arquivos.map((a) => ({ arquivo: a, texto: readFileSync(a, 'utf8') }));
}

// as recusas que esta régua lê; sem a lista da marca, as duas valem
export const RECUSAS_DAS_CURVAS = Object.freeze(['bounce', 'elastic']);

export function curvas(pasta, { excecoes = [], recusas = RECUSAS_DAS_CURVAS } = {}) {
  const erros = [], avisos = [];
  for (const { arquivo, texto } of codigoDaPeca(pasta)) {
    const nome = arquivo.slice(pasta.length + 1);
    // o comentário que cita a regra não é a curva: tira /* */, <!-- --> e // (sem pegar o http://)
    const codigo = texto.replace(/\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->|(^|[^:])\/\/.*$/gm, '$1');
    for (const m of codigo.matchAll(/\b(custom)?(bounce|elastic)\b/gi)) {
      const id = m[2].toLowerCase();
      if (recusas.includes(id)) erros.push({ regra: 'curvas', msg: `${nome}: "${m[0]}" é curva recusada ("${id}" nas recusas)`, recusa: true });
      else avisos.push({ regra: 'curvas', msg: `${nome}: "${m[0]}" passa do destino; a marca permite "${id}" (fora das recusas): só avisa` });
    }
    // na cena, a exceção vale só para ela (o "onde"); no código comum, qualquer exceção escrita
    const cena = (nome.match(/S\d{2}/) || [])[0];
    const coberta = excecoes.some((e) => e.curva === 'back.out' && e.motivo && (!cena || e.onde === cena));
    // "back" sozinho é o back.out do GSAP 3; "back-end" e "background" não são curva
    if (/\bback\b(?!-)/i.test(codigo) && !coberta) {
      avisos.push({ regra: 'curvas', msg: `${nome}: back.out sem o motivo escrito em "excecoes" do plano.json${cena ? ` para a ${cena}` : ''} (só no cartão, no selo e no botão de interface)` });
    }
    // as curvas medidas que passam do ponto (curvas.js) seguem a mesma regra do back.out
    for (const [, qual] of codigo.matchAll(/\bCURVAS\.(batida|molaTarde|quique|cartao)\b/g)) {
      const ok = excecoes.some((e) => e.curva === qual && e.motivo && (!cena || e.onde === cena));
      if (!ok && !avisos.some((a) => a.msg.includes(`CURVAS.${qual}`) && a.msg.startsWith(nome))) {
        avisos.push({ regra: 'curvas', msg: `${nome}: CURVAS.${qual} passa do ponto e volta; o motivo vai em "excecoes" do plano.json${cena ? ` para a ${cena}` : ''} (só no cartão, no selo e no botão de interface, nunca em texto)` });
      }
    }
  }
  return { erros, avisos };
}

export function recusados(pasta, catalogo) {
  const erros = [];
  const rec = (catalogo.entradas || []).filter((e) => e.estado === 'recusado' && e.procura?.length);
  for (const { arquivo, texto } of codigoDaPeca(pasta)) {
    for (const e of rec) for (const trecho of e.procura) {
      if (texto.includes(trecho)) erros.push({ regra: 'recusados', msg: `${arquivo.slice(pasta.length + 1)}: "${trecho}" é do comportamento ${e.id}, recusado pelo usuário ("${e.recusa?.frase}")` });
    }
  }
  return { erros, avisos: [] };
}

// as costuras saem do plano: a transição de uma cena para a seguinte (o campo "transicao"
// da cena que sai), a saída dela e a entrada da seguinte (sem "entrada", continua a saída)
// a "causa" da cena que sai diz por que a costura é aquela (o dissolver do documental, a ida e volta)
export function ledgerDoPlano(plano) {
  const cs = plano.cenas || [];
  return { costuras: cs.slice(0, -1).map((c, i) => ({ de: c.id, para: cs[i + 1].id, t: cs[i + 1].de, tipo: c.transicao || 'corte',
    saida: c.saida || '', entrada: cs[i + 1].entrada || c.saida || '', causa: String(c.causa || '').trim() })) };
}

// o perfil (linguagem.mjs) que dispensa o "dissolver-com-causa" (o estilo documental: a passagem de
// tempo) aceita o dissolver com a causa escrita; fora dele, o dissolver reprova como sempre
export function transicoes(ledger, { perfil = null } = {}) {
  const erros = [], avisos = [];
  const cs = ledger?.costuras || [];
  const dissolve = perfil?.dispensa?.has('dissolver-com-causa');
  for (const c of cs) {
    if (!TIPOS_TRANSICAO.includes(c.tipo)) erros.push({ regra: 'transicoes', msg: `${c.de}→${c.para}: o tipo "${c.tipo}" não existe (${TIPOS_TRANSICAO.join(', ')})` });
    if (c.tipo === 'dissolver' && dissolve && !c.causa) erros.push({ regra: 'transicoes', msg: `${c.de}→${c.para}: no ${perfil.estilo || perfil.linguagem} o dissolver passa o tempo, com a causa escrita no campo "causa" da ${c.de}` });
    else if (c.tipo === 'dissolver' && !dissolve) erros.push({ regra: 'transicoes', msg: `${c.de}→${c.para}: dissolver não tem portador; o olho perde o fio (manual: comum.transicao.dissolver)` });
    if (COM_VETOR.includes(c.tipo) && (!c.saida || !c.entrada)) {
      erros.push({ regra: 'transicoes', msg: `${c.de}→${c.para}: o ${c.tipo} precisa da saída e da entrada (eixo e sentido), pela lei do vetor` });
    } else if (COM_VETOR.includes(c.tipo) && c.saida !== c.entrada) {
      erros.push({ regra: 'transicoes', msg: `${c.de}→${c.para}: sai ${c.saida} e entra ${c.entrada}; no ${c.tipo} o eixo e o sentido se mantêm` });
    }
  }
  const tipos = new Set(cs.map((c) => c.tipo).filter((t) => !NAO_CONTAM.has(t)));
  if (tipos.size > TRANSICOES_MAX) erros.push({ regra: 'transicoes', msg: `${tipos.size} tipos de transição (${[...tipos].join(', ')}); até ${TRANSICOES_MAX} por peça, repetidos` });
  for (let i = 1; i < cs.length; i++) {
    const a = cs[i - 1].saida, b = cs[i].saida;
    if (a && b && a[0] === b[0] && a[1] !== b[1] && !cs[i].causa) avisos.push({ regra: 'transicoes', msg: `${cs[i - 1].de}→${cs[i].para}: ida e volta de sentido (${a}, depois ${b}) sem causa escrita` });
  }
  return { erros, avisos };
}

// a régua parado mora no parado.mjs; a vírgula declarada no plano tira o aviso dela
export function paradoDoPlano(mp4, plano, pasta = null) {
  // no falado o tempo de cada cena sai do corte (o mesmo preencherDoCorte da montagem)
  if (plano && plano.modo === 'falado' && pasta && (plano.cenas || []).some((c) => c.de == null)) {
    try { plano = preencherDoCorte(plano, lerDados(pasta)); } catch { /* sem o dados.js, a massa por cena não mede: fica só a da peça */ }
  }
  // a massa de cada cena de animação (as de legenda têm o rosto, que se mexe sempre)
  const cenas = (plano?.cenas || []).filter((c) => c.tipo !== 'legenda' && c.de != null && c.ate != null).map((c) => ({ id: c.id, de: c.de, ate: c.ate }));
  return parado(mp4, { virgulas: plano?.virgula?.em != null ? [plano.virgula.em] : [], cenas });
}

export function lerFormato(nome) {
  const f = JSON.parse(readFileSync(FORMATOS, 'utf8'))[nome];
  if (!f) throw new Error(`o formato "${nome}" não está em ${FORMATOS}`);
  return f;
}

// ─── o amostrador: a peça aberta no navegador, parada em cada instante ───────
// Devolve, por instante, o que se vê: cada nó de texto (a caixa da própria letra, pela Range)
// e cada forma desenhada (o traço do SVG, a imagem, o marcado data-zona="chave"), com a caixa
// cortada pelo recorte dos ancestrais (overflow hidden ou clip, e clip-path), a opacidade
// efetiva e de onde vem: a legenda da /cortes (#legendas, #gancho), o objeto desenhado
// (data-texto="objeto": a interface genérica da cena, que não se lê frase a frase) ou a cena.
// O passo padrão é 0,1 s: com 0,5 s, um título fora da zona por 0,3 s passava entre duas
// amostras.
export async function amostrar(pasta, { navegador, formato = 'reel', instantes = null, passo = 0.1 } = {}) {
  const f = lerFormato(formato);
  const pg = await navegador.newPage({ viewport: { width: f.largura, height: f.altura } });
  try {
    await pg.goto(pathToFileURL(join(pasta, 'index.html')).href);
    let ts = instantes;
    if (!ts) {
      // sem instantes dados, a peça tem de registrar a timeline: sem ela, nada é medido
      const tem = await pg.waitForFunction(() => !!(window.__timelines && window.__timelines.main), null, { timeout: 10000 }).then(() => true, () => false);
      const fim = tem ? await pg.evaluate(() => window.__timelines.main.duration()) : 0;
      if (!(fim > 0)) return { erro: 'a peça não registrou a timeline (window.__timelines.main): nada medido' };
      ts = Array.from({ length: Math.floor(fim / passo) + 1 }, (_, i) => +Math.min(fim - 0.001, i * passo).toFixed(3));
    } else {
      await pg.waitForTimeout(200);
    }
    // a timeline inteira, lida uma vez: a curva, a duração e o "de onde vem" de cada tween
    const tweens = await pg.evaluate(() => {
      const tl = window.__timelines && window.__timelines.main;
      if (!tl || !tl.getChildren) return null;
      const nomes = new Map();
      if (window.CURVAS) for (const [k, v] of Object.entries(window.CURVAS)) if (typeof v === 'function') nomes.set(v, k);
      const fora = new Set(['ease', 'duration', 'delay', 'immediateRender', 'lazy', 'overwrite', 'stagger', 'repeat', 'yoyo', 'repeatDelay',
        'startAt', 'runBackwards', 'data', 'callbackScope', 'id', 'paused', 'reversed', 'keyframes', 'inherit', 'yoyoEase', 'repeatRefresh',
        'clearProps', 'parent', 'force3D', 'transformOrigin', 'svgOrigin']);
      const out = [];
      for (const tw of tl.getChildren(true, true, false)) {
        const v = tw.vars || {};
        const dur = tw.duration();
        const e = v.ease;
        const ease = typeof e === 'function' ? (nomes.get(e) || 'função') : e == null ? 'padrão' : String(e);
        const props = Object.keys(v).filter((k) => !fora.has(k) && !k.startsWith('on'));
        const de = v.runBackwards ? v : v.startAt || null;
        const num = (x) => (x == null || x === '' ? null : parseFloat(x));
        out.push({ ease, dur: +dur.toFixed(3), props,
          deOp: de ? num(de.opacity ?? de.autoAlpha) : null, paraOp: v.runBackwards ? null : num(v.opacity ?? v.autoAlpha),
          deY: de ? num(de.y) : null, deTransforma: !!(de && ['x', 'scale', 'scaleX', 'scaleY', 'rotation', 'xPercent', 'filter', 'clipPath'].some((k) => k in de)) });
      }
      return out;
    }).catch(() => null);
    const amostras = [];
    for (const t of ts) {
      const itens = await pg.evaluate(({ t }) => {
        if (window.__timelines && window.__timelines.main) window.__timelines.main.seek(t, false);
        // o que o elemento herda de cima: some (display, visibility), a opacidade multiplicada,
        // e as marcas: livre (decorativo), objeto (interface desenhada), legenda (da /cortes)
        const estado = (el) => {
          let op = 1, livre = false, objeto = false, legenda = false;
          for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
            const s = getComputedStyle(e);
            if (s.display === 'none' || s.visibility === 'hidden') return null;
            op *= +s.opacity;
            if (e.getAttribute('data-zona') === 'livre') livre = true;
            if (e.getAttribute('data-texto') === 'objeto') objeto = true;
            // a palavra atrás da cabeça é legenda também: tem a régua dela (o tempo de leitura, no falado-extra.mjs)
            if (e.id === 'legendas' || e.id === 'gancho' || e.id === 'atras') legenda = true;
          }
          return op < 0.05 ? null : { op, livre, objeto, legenda };
        };
        // só a tinta que se vê: a caixa cortada pelo recorte de cada ancestral (sem isso a régua
        // reprovava o que ninguém vê: 57 falsos no teste a frio). O inset do clip-path está nas
        // unidades do elemento, então se escala pela transformação dele
        const recortada = (el, r0) => {
          let r = { top: r0.top, bottom: r0.bottom, left: r0.left, right: r0.right };
          const corta = (v) => v === 'hidden' || v === 'clip';
          for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
            const s = getComputedStyle(e);
            const temClip = s.clipPath && s.clipPath !== 'none';
            if (!corta(s.overflowX) && !corta(s.overflowY) && !temClip) continue;
            const c = e.getBoundingClientRect();
            if (corta(s.overflowY)) { r.top = Math.max(r.top, c.top); r.bottom = Math.min(r.bottom, c.bottom); }
            if (corta(s.overflowX)) { r.left = Math.max(r.left, c.left); r.right = Math.min(r.right, c.right); }
            if (temClip) {
              let cr = { top: c.top, right: c.right, bottom: c.bottom, left: c.left };
              const m = s.clipPath.match(/^inset\(([^)]*)\)/);
              if (m) {
                const kx = e.offsetWidth ? c.width / e.offsetWidth : 1, ky = e.offsetHeight ? c.height / e.offsetHeight : 1;
                const v = m[1].split(/\s+round\s+/)[0].trim().split(/\s+/).map(parseFloat);
                const [a, b = a, cc = a, d = b] = v;
                cr = { top: c.top + a * ky, right: c.right - b * kx, bottom: c.bottom - cc * ky, left: c.left + d * kx };
              }
              r = { top: Math.max(r.top, cr.top), bottom: Math.min(r.bottom, cr.bottom), left: Math.max(r.left, cr.left), right: Math.min(r.right, cr.right) };
            }
            if (r.bottom - r.top < 2 || r.right - r.left < 2) return null;
          }
          return r;
        };
        const caixa = (r) => ({ top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right) });
        const itens = [];
        const andar = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        while (andar.nextNode()) {
          const n = andar.currentNode;
          if (!n.textContent.trim() || !n.parentElement || ['SCRIPT', 'STYLE', 'TITLE'].includes(n.parentElement.tagName)) continue;
          const st = estado(n.parentElement);
          if (!st) continue;
          const rg = document.createRange();
          rg.selectNodeContents(n);
          const r0 = rg.getBoundingClientRect();
          if (r0.width < 2 || r0.height < 2) continue;
          const r = recortada(n.parentElement, r0);
          if (r) itens.push({ tipo: 'texto', txt: n.textContent.replace(/\s+/g, ' ').trim(), ...st, r: caixa(r) });
        }
        // as formas: o traço que se desenha (não o svg inteiro, que pode ter a largura do quadro)
        document.querySelectorAll('svg path, svg rect, svg circle, svg ellipse, svg polygon, svg line, img, [data-zona="chave"]').forEach((el) => {
          if (el.closest('defs, clipPath, mask')) return;
          const st = estado(el);
          if (!st || st.livre) return;
          const r0 = el.getBoundingClientRect();
          if (r0.width < 2 || r0.height < 2) return;
          const r = recortada(el, r0);
          // nome legível também num SVG, em que o className não é texto
          if (r) itens.push({ tipo: 'forma', txt: el.id || el.getAttribute('class') || el.tagName.toLowerCase(), ...st, r: caixa(r) });
        });
        // a matéria: o que dá imagem ao quadro (a foto, o vídeo, o canvas do 3D, o marcado
        // data-materia), com a área que se vê; não entra na zona (o chão pode sangrar)
        document.querySelectorAll('img, video, canvas, [data-materia]').forEach((el) => {
          const st = estado(el);
          if (!st) return;
          const r0 = el.getBoundingClientRect();
          if (r0.width < 2 || r0.height < 2) return;
          const r = recortada(el, r0);
          if (!r) return;
          const vw = innerWidth, vh = innerHeight;
          const w = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0)), h = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
          if (w * h > 0) itens.push({ tipo: 'materia', txt: el.id || el.getAttribute('data-materia') || el.tagName.toLowerCase(), ...st, area: (w * h) / (vw * vh), r: caixa(r) });
        });
        return itens;
      }, { t });
      amostras.push({ t, itens });
    }
    return { amostras, passo, formato: f, tweens };
  } finally {
    await pg.close();
  }
}

// zona: a tinta de cada texto e de cada forma fora da zona segura do destino. O texto conta
// sempre, mesmo sob data-zona="livre": a marca tira da conta só o desenho decorativo (a
// isenção servia de atalho para pôr título fora da zona)
export function zonaDasAmostras({ amostras, formato: f }, nomeFormato) {
  const erros = [];
  const sai = (r) => r.top < f.topo - 1 || r.bottom > f.base + 1 || r.left < f.lateral - 1 || r.right > f.largura - f.lateral + 1;
  const vistos = new Set();
  for (const { t, itens } of amostras) {
    for (const it of itens) {
      if (it.tipo === 'materia' || !sai(it.r)) continue;
      const nome = `${it.tipo === 'forma' ? 'a forma ' : ''}"${it.txt.slice(0, 40)}"`;
      if (vistos.has(nome)) continue;
      vistos.add(nome);
      erros.push({ regra: 'zona', calibragem: ['prudencia', 'hipotese'].includes(f.medida), msg: `${nome} em ${t.toFixed(2)} s ocupa y ${it.r.top}–${it.r.bottom}, x ${it.r.left}–${it.r.right}: fora da zona de ${nomeFormato} (y ${f.topo}–${f.base}, ${f.lateral} px nos lados)` });
    }
  }
  // a legenda que encosta num objeto da cena: a palavra coberta (ou por cima) de uma imagem, forma
  // ou matéria lê mal nos dois casos (a crítica r5 viu o aro do celular cortando a base da chave da
  // S05, com a zona verde). Ficam de fora a câmera e o recorte da pessoa, que moram atrás da
  // legenda de propósito, e o que é da própria legenda
  const atras = /^(camera|atras-recorte|video$|quadro$)/;
  const cruza = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) >= 4 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) >= 4;
  // a matéria conta mesmo marcada livre (a foto do celular é livre para a zona, e é o objeto que
  // cobria a chave); a forma livre já ficou fora na amostra. Só o contato que dura 0,3 s (3
  // amostras seguidas de 0,1 s) é erro: a cena que sai subindo cruza a legenda por 5 quadros.
  // A matéria que cobre 85% do quadro ou mais é o chão (a placa do mundo, o balcão de uma loja
  // inteira): mora atrás de tudo, como a câmera, e o contraste da legenda contra ela é do ofício
  const CHAO = 0.85;
  const pares = new Set(), seguidas = new Map();
  for (const { t, itens } of amostras) {
    const palavras = itens.filter((it) => it.tipo === 'texto' && it.legenda && it.op >= 0.5);
    const objetos = itens.filter((it) => (it.tipo === 'materia' || (it.tipo === 'forma' && !it.livre)) && !it.legenda && it.op >= 0.5 && !atras.test(it.txt) && !(it.tipo === 'materia' && it.area >= CHAO));
    const agora = new Set();
    for (const p of palavras) for (const o of objetos) {
      if (!cruza(p.r, o.r)) continue;
      const chave = `${p.txt}|${o.txt}`;
      if (agora.has(chave)) continue;
      agora.add(chave);
      seguidas.set(chave, (seguidas.get(chave) || 0) + 1);
      if (seguidas.get(chave) < 3 || pares.has(chave)) continue;
      pares.add(chave);
      erros.push({ regra: 'zona', msg: `a legenda "${p.txt.slice(0, 30)}" encosta em "${o.txt.slice(0, 30)}" por 0,3 s ou mais, até ${t.toFixed(2)} s (a palavra em y ${p.r.top}–${p.r.bottom}, o objeto em y ${o.r.top}–${o.r.bottom}): a legenda e o objeto não dividem o lugar` });
    }
    for (const k of [...seguidas.keys()]) if (!agora.has(k)) seguidas.delete(k);
  }
  return { erros, avisos: [] };
}

export async function zona(pasta, { formato = 'reel', navegador, instantes = null, passo = 0.1 } = {}) {
  const a = await amostrar(pasta, { navegador, formato, instantes, passo });
  if (a.erro) return { erros: [{ regra: 'zona', msg: a.erro }], avisos: [] };
  return zonaDasAmostras(a, formato);
}

// tela: a peça contra o plano. O texto de cena que se vê inteiro (opacidade 0,9 ou mais) tem
// de estar declarado no texto_tela; cada frase declarada (os "·" separam) tem de aparecer
// inteira, e ficar inteira o tempo de leitura dela (roteiro.md, "As contas"). Não contam a
// legenda e o gancho da /cortes (têm régua própria) nem o texto do objeto desenhado
// (data-texto="objeto"). O teste a frio achou o texto a mais, a frase que some antes do
// tempo e o convite invisível passando com tudo verde
export function telaDasAmostras({ amostras, passo }, plano, tempoMinimo) {
  const erros = [];
  const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();
  const frases = [];
  for (const c of plano.cenas || []) for (const x of norm(c.texto_tela).split(' · ').map(norm).filter(Boolean)) frases.push({ id: c.id, txt: x, de: c.de ?? -Infinity, ate: c.ate ?? Infinity });
  // cada pedaço de texto guarda as corridas (o início e quanto durou); a frase só conta as corridas
  // que começam na cena dela: o mesmo pedaço noutra cena ("cliente para." da S09 dentro de "...o
  // cliente para." da S07) não é o tempo dela
  const corridas = new Map();
  const semDono = new Map();
  for (const { t, itens } of amostras) {
    const vistos = new Set(itens.filter((it) => it.tipo === 'texto' && !it.legenda && !it.objeto && it.op >= 0.9).map((it) => it.txt));
    for (const s of vistos) {
      if (!frases.some((f) => f.txt.includes(s)) && !semDono.has(s)) semDono.set(s, t);
      const lista = corridas.get(s) || [];
      const ult = lista[lista.length - 1];
      if (ult && Math.abs(t - ult.fim - passo) < passo / 2) { ult.dur += passo; ult.fim = t; }
      else lista.push({ ini: t, fim: t, dur: passo });
      corridas.set(s, lista);
    }
  }
  const FOLGA = 0.6;   // a frase que entra um pouco antes do corte da cena ainda é dela
  const melhorNa = (s, f) => Math.max(0, ...corridas.get(s).filter((c) => c.ini >= f.de - FOLGA && c.ini < f.ate).map((c) => c.dur));
  for (const [s, t] of semDono) erros.push({ regra: 'tela', msg: `"${s.slice(0, 50)}" aparece aos ${t.toFixed(1)} s e não está no texto_tela de nenhuma cena (texto de interface desenhada vai sob data-texto="objeto")` });
  for (const f of frases) {
    const pedacos = [...corridas.keys()].filter((s) => f.txt.includes(s) && melhorNa(s, f) > 0);
    const visto = norm(pedacos.join(' '));
    const faltam = f.txt.split(' ').filter((w) => !visto.includes(w));
    if (!pedacos.length || faltam.length) {
      erros.push({ regra: 'tela', msg: `${f.id}: "${f.txt}" não aparece inteiro na tela em nenhum instante${pedacos.length ? ` (faltam: ${faltam.join(' ')})` : ''}` });
      continue;
    }
    const tempo = Math.min(...pedacos.map((s) => melhorNa(s, f)));
    const pede = tempoMinimo(f.txt);
    if (tempo + passo / 2 < pede) erros.push({ regra: 'tela', msg: `${f.id}: "${f.txt}" fica inteiro ${tempo.toFixed(1)} s na tela; a leitura pede ${pede.toFixed(1)} s` });
  }
  return { erros, avisos: [] };
}

export async function tela(pasta, plano, { formato = 'reel', navegador, passo = 0.1 } = {}) {
  const { tempoMinimo } = await import('./plano.mjs');
  const a = await amostrar(pasta, { navegador, formato, passo });
  if (a.erro) return { erros: [{ regra: 'tela', msg: a.erro }], avisos: [] };
  return telaDasAmostras(a, plano, tempoMinimo);
}

// ─── o ofício (oficio.md § 5 e o manual): o que a máquina vê do sênior ───────────────────────
// imagem: cada cena com 1 s ou mais tem matéria visível (3% do quadro ou mais) em metade do
// tempo dela. A cena só de texto e forma chapada lê como crua
export function imagemDasAmostras({ amostras }, plano, { areaMin = 0.03, parte = 0.5, respiro = 1 } = {}) {
  const erros = [];
  for (const c of plano.cenas || []) {
    if (c.ate - c.de < respiro) continue;
    const dela = amostras.filter((a) => a.t >= c.de && a.t < c.ate);
    if (!dela.length) continue;
    const com = dela.filter((a) => a.itens.some((it) => it.tipo === 'materia' && it.area >= areaMin)).length;
    if (com / dela.length < parte) erros.push({ regra: 'oficio', msg: `${c.id}: matéria (foto, vídeo, ícone 3D, canvas, data-materia) com ${Math.round(areaMin * 100)}% do quadro em ${Math.round((com / dela.length) * 100)}% do tempo da cena; pede ${Math.round(parte * 100)}% (manual: comum.mundo.seis-camadas)` });
  }
  return { erros, avisos: [] };
}

// curvas da timeline: 3 ou mais curvas (a linear da deriva não conta) e a entrada só por fade
// (opacidade, com subida de até 60 px e nada mais) em menos da metade das entradas
export function curvasDaTimeline(tweens, { minimo = 3, fadeMax = 0.5 } = {}) {
  if (!tweens) return { erros: [{ regra: 'oficio', msg: 'a timeline não foi lida (window.__timelines.main): curvas não medidas' }], avisos: [] };
  const erros = [], avisos = [];
  const movem = tweens.filter((w) => w.dur >= 0.15 && w.props.length);
  const lineares = new Set(['none', 'linear', 'reta', 'power0', 'power0.none']);
  const curvasUsadas = new Set(movem.map((w) => (w.ease === 'padrão' ? 'power1.out' : w.ease)).filter((e) => !lineares.has(e)));
  if (movem.length >= 6 && curvasUsadas.size < minimo) erros.push({ regra: 'oficio', calibragem: true, msg: `${curvasUsadas.size} curva(s) na peça (${[...curvasUsadas].join(', ') || 'nenhuma'}); o ofício pede ${minimo} ou mais, uma por papel (ferramentas/curvas.js)` });
  const opac = (w) => w.props.some((k) => k === 'opacity' || k === 'autoAlpha');
  const soFade = (w) => opac(w) && w.props.every((k) => ['opacity', 'autoAlpha', 'y', 'yPercent'].includes(k)) && !w.deTransforma && (w.deY == null || Math.abs(w.deY) <= 60);
  const entra = (w) => w.deOp === 0 || w.paraOp === 1 || w.deY != null || w.deTransforma;
  const entradas = movem.filter(entra);
  const fades = entradas.filter((w) => soFade(w) && (w.deOp === 0 || w.paraOp === 1));
  if (entradas.length >= 4 && fades.length / entradas.length >= fadeMax) erros.push({ regra: 'oficio', calibragem: true, msg: `${fades.length} de ${entradas.length} entradas são só fade com subida curta; entrar por movimento (de maior, de fora), cada papel com a sua curva (manual: comum.movimento.entra-por-movimento)` });
  const pares = new Map();
  for (const w of movem) { const k = `${w.ease} ${w.dur}`; pares.set(k, (pares.get(k) || 0) + 1); }
  const [maisK, maisN] = [...pares.entries()].sort((a, b) => b[1] - a[1])[0] || ['', 0];
  if (movem.length >= 10 && maisN / movem.length > 0.4) avisos.push({ regra: 'oficio', msg: `${maisN} de ${movem.length} movimentos com a mesma curva e duração (${maisK} s): uma curva e uma duração em tudo é o movimento chapado` });
  return { erros, avisos };
}

// som do puro: os efeitos (todo <audio> que não é a trilha) somam 5 a 7 tipos, um som por
// elemento que entra (calibragem): abaixo de 3, 3 e 4, e acima de 8 avisam. No falado o som é da /cortes, e esta conta
// não se aplica
// O piso e o "pede" não cobram onde o perfil da peça dispensa os "tipos-de-efeito" (o estilo
// documental, a linguagem so-efeitos: o linguagens.json)
export function somDaPeca(pasta, plano, { minimo = 3, pede = 5, maximo = 8, perfil = null } = {}) {
  if (plano?.modo === 'falado') return { erros: [], avisos: [] };
  const dispensa = (perfil || perfilDoPlano(plano || {})).dispensa.has('tipos-de-efeito');
  const html = existsSync(join(pasta, 'index.html')) ? readFileSync(join(pasta, 'index.html'), 'utf8') : '';
  const audios = [...html.matchAll(/<audio\b[^>]*>/gi)].map((m) => ({ tag: m[0], src: (m[0].match(/\ssrc="([^"]+)"/) || [])[1] || '', dur: +((m[0].match(/data-duration="([\d.]+)"/) || [])[1] || 0) }));
  if (!audios.length) return { erros: [{ regra: 'oficio', msg: 'a peça não tem <audio>: o som não foi feito (manual: comum.som.um-por-acao)' }], avisos: [] };
  const trilha = audios.find((a) => /data-papel="trilha"/.test(a.tag)) || audios.reduce((a, b) => (b.dur > a.dur ? b : a));
  const tipos = new Set(audios.filter((a) => a !== trilha).map((a) => a.src.replace(/-\d+(?=\.\w+$)/, '')));
  const erros = [], avisos = [];
  const longa = (plano?.duracao || 0) >= 10 && !dispensa;
  if (longa && tipos.size < minimo) erros.push({ regra: 'oficio', calibragem: true, msg: `${tipos.size} tipo(s) de efeito sonoro; o piso é ${minimo}, e o ofício pede ${pede} a 7 famílias, um som por elemento que entra (manual: comum.som.familias)` });
  else if (longa && tipos.size < pede) avisos.push({ regra: 'oficio', msg: `${tipos.size} tipos de efeito sonoro; o ofício pede ${pede} a 7 famílias, um som por elemento que entra (manual: comum.som.familias)` });
  if (tipos.size > maximo) avisos.push({ regra: 'oficio', msg: `${tipos.size} tipos de efeito: som em toda microanimação atrapalha` });
  return { erros, avisos };
}

// o estímulo ("no máximo 3 s sem algo novo"; nos Reels que retêm, 0,26 a 0,44 viradas fortes por
// segundo). O evento é o corte de cena do plano e cada efeito de
// som; a legenda contínua é fundo e não conta. A frase nova da voz também é algo novo: no puro, o
// começo de cada cena com fala e o `frases` do plano ([{ de }], o tempo da voz); no falado, as frases
// do corte. O efeito que o simula_mix.py --contexto mede abaixo do piso do papel (os `inaudiveis`,
// pelo id do <audio> no puro e por efeito-N, a ordem do som.json, no falado) não se ouve e não conta.
// O intervalo, do começo ao fim da peça, acima de 3 s avisa e acima de 5 s reprova
export const ESTIMULO_AVISO = 3, ESTIMULO_MAX = 5;
// no falado, a troca de enquadramento da câmera também é imagem nova: a mesma regra do punch-in do
// modelo da /cortes (.claude/skills/cortes/reel/index.html: alterna nos cortes da fala, e o corte que
// cai antes do troca_min fica seco), lida do dados.js
export function trocasDaCamera(dados) {
  const out = [];
  let ultima = -1e9;
  for (const c of dados?.cortes || []) { if (c - ultima < dados.troca_min) continue; ultima = c; out.push(c); }
  return out;
}
export function eventosDaPeca(pasta, plano, dados = null, { inaudiveis = new Set() } = {}) {
  const cortes = (plano?.cenas || []).map((c) => c.de).filter((t) => t > 0);
  let sons = [], falas = [];
  if (plano?.modo === 'falado') {
    cortes.push(...trocasDaCamera(dados));
    falas = (dados?.frases || []).map((f) => f.t_de);
    const s = existsSync(join(pasta, 'som.json')) ? JSON.parse(readFileSync(join(pasta, 'som.json'), 'utf8')) : {};
    sons = (s.efeitos || []).filter((e, k) => !inaudiveis.has(`efeito-${k + 1}`)).map((e) => e.acerto);
  } else {
    falas = [...(plano?.cenas || []).filter((c) => String(c.fala || '').trim()).map((c) => c.de), ...(plano?.frases || []).map((f) => f.de)];
    const html = existsSync(join(pasta, 'index.html')) ? readFileSync(join(pasta, 'index.html'), 'utf8') : '';
    sons = [...html.matchAll(/<audio\b[^>]*>/gi)].map((m) => m[0]).filter((t) => !/data-papel="trilha"/.test(t))
      .filter((t) => !inaudiveis.has((t.match(/\sid="([^"]+)"/) || [])[1]))
      .map((t) => +((t.match(/data-start="([\d.]+)"/) || [])[1] ?? NaN)).filter((t) => Number.isFinite(t));
  }
  return [...new Set([...cortes, ...falas.map(Number).filter((t) => Number.isFinite(t) && t > 0), ...sons])].sort((a, b) => a - b);
}

// os efeitos que a mixagem mede abaixo do piso do papel, pelo simula_mix.py --contexto da /video, no
// Python da mixagem (MIXAGEM_PY, ou o python do sistema); sem as bibliotecas, a medida não roda e quem chama avisa
export function inaudiveisDaPeca(pasta) {
  const py = process.env.MIXAGEM_PY || 'python';
  const simula = join(AQUI, '..', '..', 'video', 'ferramentas', 'simula_mix.py');
  // a conferência importa com -I, como o simula_mix.py roda: pacote só no site do usuário não passa aqui para quebrar adiante
  if (spawnSync(py, ['-I', '-c', 'import numpy, scipy, soundfile'], { encoding: 'utf8' }).status !== 0) return { medido: false, motivo: `sem o Python da mixagem (${py}, com numpy, scipy e soundfile; o MIXAGEM_PY troca o executável)`, ids: new Set() };
  try {
    const r = JSON.parse(execFileSync(py, ['-I', simula, pasta, '--contexto', '--json'], { encoding: 'utf8', maxBuffer: 1 << 26 }));
    return { medido: true, ids: new Set((r.contexto?.efeitos || []).filter((e) => e.relevo_db != null && e.relevo_db < e.piso_db).map((e) => e.id)) };
  } catch (e) {
    return { medido: false, motivo: `o simula_mix.py --contexto não mediu (${String(e.message).split('\n')[0]})`, ids: new Set() };
  }
}
export function estimulo(eventos, duracao) {
  const erros = [], avisos = [];
  // nenhum evento é a régua que não achou o som nem os cortes: não medir não é passar
  if (!eventos.length) return { erros: [{ regra: 'estimulo', msg: 'nenhum corte nem efeito de som achado (o plano.json, o som.json ou o index.html); nada medido' }], avisos };
  const marcos = [0, ...eventos.filter((t) => t > 0 && t < duracao), duracao];
  const br = (v) => v.toFixed(1).replace('.', ',');
  for (let i = 1; i < marcos.length; i++) {
    const vao = marcos[i] - marcos[i - 1];
    const msg = `${br(vao)} s sem nada novo, de ${br(marcos[i - 1])} a ${br(marcos[i])} s (nem corte, nem troca de enquadramento, nem frase nova da voz, nem efeito de som que se ouve); no máximo ${ESTIMULO_AVISO} s`;
    if (vao > ESTIMULO_MAX) erros.push({ regra: 'estimulo', msg });
    else if (vao > ESTIMULO_AVISO) avisos.push({ regra: 'estimulo', msg });
  }
  return { erros, avisos };
}

export function oficioDasAmostras(a, plano, pasta) {
  const partes = [imagemDasAmostras(a, plano), curvasDaTimeline(a.tweens), somDaPeca(pasta, plano)];
  return { erros: partes.flatMap((x) => x.erros), avisos: partes.flatMap((x) => x.avisos) };
}

export async function oficio(pasta, plano, { formato = 'reel', navegador, passo = 0.1 } = {}) {
  const a = await amostrar(pasta, { navegador, formato, passo });
  if (a.erro) return { erros: [{ regra: 'oficio', msg: a.erro }], avisos: [] };
  return oficioDasAmostras(a, plano, pasta);
}

// ─── a linha de comando ──────────────────────────────────────────────────────
function arg(nome, padrao = null) {
  const i = process.argv.indexOf(`--${nome}`);
  return i > 0 ? process.argv[i + 1] : padrao;
}
// as recusas da marca para as curvas e o cromo; sem marca, as quatro valem e o aviso diz por quê
export function recusasDaMarca({ raiz } = {}) {
  const m = lerMarca(raiz ? { raiz } : {});
  if (!m.configurada) return { curvas: RECUSAS_DAS_CURVAS, cromo: RECUSAS_DO_CROMO, aviso: `${paradaDe(m.motivo)}; até lá, bounce, elastic, kicker e contador reprovam` };
  const lista = m.resolvido?.recusas ?? [];
  return { curvas: lista, cromo: lista, aviso: null };
}

// a gravidade sai do excecoes.mjs: a calibragem avisa, e a exceção escrita no plano a cala
let PLANO_DA_PECA = null;
function imprimir(nome, r0) {
  const r = calibrar(r0, PLANO_DA_PECA);
  for (const e of r.erros) console.log(`ERRO  [${e.regra}] ${e.msg}`);
  for (const a of r.avisos || []) console.log(`aviso [${a.regra}] ${a.msg}`);
  for (const a of r.aceitos || []) console.log(`aceito [${a.regra}] ${a.msg} · a exceção do plano: ${a.motivo}${a.fonte ? ` (${a.fonte})` : ''}`);
  console.log(`${nome}: ${r.erros.length ? 'REPROVA' : 'verde'}`);
  return r.erros.length;
}

if (chamadoDireto(import.meta.url)) {
  const [cmd, alvo] = process.argv.slice(2);
  if (!cmd || !alvo) { console.error('uso: regua-direcao.mjs zona|tela|parado|bordas|som|cor|transicoes|curvas|recusados|oficio|cromo|estimulo|manual|tudo <pasta ou mp4>'); process.exit(2); }
  const pasta = resolve(alvo);
  const plano = existsSync(join(pasta, 'plano.json')) ? JSON.parse(readFileSync(join(pasta, 'plano.json'), 'utf8')) : null;
  PLANO_DA_PECA = plano;
  const RECUSAS = recusasDaMarca();
  if (RECUSAS.aviso) console.log(`aviso [marca] ${RECUSAS.aviso}`);
  const formato = arg('formato', plano?.formato || (plano?.destino === 'anuncio' ? 'anuncio-reels' : 'reel'));
  const catalogo = JSON.parse(readFileSync(join(AQUI, '..', 'biblioteca', 'catalogo.json'), 'utf8'));
  let n = 0;
  const naoMedida = (qual, por) => { console.log(`ERRO  [${qual}] não medida: ${por}`); n++; };
  // a zona e a tela dividem a mesma amostragem da peça
  let amostras = null;
  const amostrada = async () => {
    if (!amostras) {
      const { abrirNavegador } = await import('./navegador.mjs');
      const nav = await abrirNavegador();
      try { amostras = await amostrar(pasta, { navegador: nav, formato, passo: +arg('passo', 0.1) }); } finally { await nav.close(); }
    }
    return amostras;
  };
  const rodar = async (qual) => {
    if (qual === 'zona') {
      const a = await amostrada();
      n += imprimir('zona', a.erro ? { erros: [{ regra: 'zona', msg: a.erro }] } : zonaDasAmostras(a, formato));
    } else if (qual === 'tela') {
      if (!plano) return naoMedida('tela', 'sem plano.json na pasta');
      const { tempoMinimo } = await import('./plano.mjs');
      const a = await amostrada();
      n += imprimir('tela', a.erro ? { erros: [{ regra: 'tela', msg: a.erro }] } : telaDasAmostras(a, plano, tempoMinimo));
    } else if (qual === 'bordas') {
      const mp4 = cmd === 'bordas' ? pasta : arg('mp4');
      if (!mp4) return naoMedida('bordas', 'falta o --mp4 do render');
      n += imprimir('bordas', bordas(mp4));
    } else if (qual === 'som') {
      const r = await conferirSom(pasta);
      if (r.naoSeAplica) console.log(`som: não se aplica (${r.naoSeAplica})`);
      else n += imprimir('som', r);
    } else if (qual === 'cor') {
      const mp4 = cmd === 'cor' && !arg('mp4') ? pasta : arg('mp4');
      if (!mp4) return naoMedida('cor', 'falta o --mp4 do render');
      // o plano da pasta, ou, com o mp4 no lugar da pasta, o que está ao lado dele
      const planoDaCor = plano || (existsSync(join(dirname(resolve(mp4)), 'plano.json')) ? JSON.parse(readFileSync(join(dirname(resolve(mp4)), 'plano.json'), 'utf8')) : null);
      const sm = semMundo(planoDaCor);
      if (sm) console.log(`cor: não se aplica (${sm})`);
      else n += imprimir('cor', cor(mp4));
    } else if (qual === 'parado') {
      const mp4 = cmd === 'parado' ? pasta : arg('mp4');
      if (!mp4) return naoMedida('parado', 'falta o --mp4 do render');
      const r = paradoDoPlano(mp4, plano, cmd === 'parado' ? null : pasta);
      n += imprimir(`parado (${(r.trechos || []).length} trechos de 0,6 s ou mais)`, r);
    } else if (qual === 'transicoes') {
      // uma fonte só: as costuras saem do plano.json
      if (!plano) return naoMedida('transicoes', 'sem plano.json na pasta');
      const l = ledgerDoPlano(plano);
      n += imprimir('transicoes', transicoes(l, { perfil: perfilDoPlano(plano) }));
    } else if (qual === 'curvas') {
      n += imprimir('curvas', curvas(pasta, { excecoes: plano?.excecoes || [], recusas: RECUSAS.curvas }));
    } else if (qual === 'recusados') {
      n += imprimir('recusados', recusados(pasta, catalogo));
    } else if (qual === 'oficio') {
      if (!plano) return naoMedida('oficio', 'sem plano.json na pasta');
      const a = await amostrada();
      n += imprimir('oficio', a.erro ? { erros: [{ regra: 'oficio', msg: a.erro }] } : oficioDasAmostras(a, plano, pasta));
    } else if (qual === 'estimulo') {
      if (!plano) return naoMedida('estimulo', 'sem plano.json na pasta');
      // no falado o tempo das cenas e o fim saem do corte (o mesmo preencherDoCorte da montagem)
      let p = plano, dur = plano.duracao;
      if (plano.modo === 'falado') {
        try { p = preencherDoCorte(plano, lerDados(pasta)); dur = JSON.parse(readFileSync(join(pasta, 'cortes.json'), 'utf8')).END; } catch (e) { return naoMedida('estimulo', `o corte não leu (${e.message})`); }
      }
      if (!(dur > 0)) return naoMedida('estimulo', 'a duração da peça não leu');
      const ouvido = inaudiveisDaPeca(pasta);
      const r = estimulo(eventosDaPeca(pasta, p, plano.modo === 'falado' ? lerDados(pasta) : null, { inaudiveis: ouvido.ids }), dur);
      if (!ouvido.medido) r.avisos.push({ regra: 'estimulo', msg: `a audibilidade dos efeitos não foi medida: ${ouvido.motivo}; todo efeito contou como estímulo` });
      else if (ouvido.ids.size) console.log(`estimulo: fora da conta, inaudíveis pelo --contexto: ${[...ouvido.ids].join(', ')}`);
      n += imprimir('estimulo', r);
    } else if (qual === 'manual') {
      if (!plano) return naoMedida('manual', 'sem plano.json na pasta');
      // a peça de antes do manual não cita técnica em cena nenhuma: a régua não se aplica a ela
      if (!(Array.isArray(plano.cenas) ? plano.cenas : []).some((c) => Array.isArray(c?.tecnicas))) {
        return console.log('manual: não se aplica (nenhuma cena cita técnica do manual: a peça é de antes dele)');
      }
      const { conferirManual, lerManual, somAoLado, imagensAoLado } = await import('./regua-manual.mjs');
      const arqSom = somAoLado(pasta);
      let som = null;
      if (arqSom) { try { som = JSON.parse(readFileSync(arqSom, 'utf8')); } catch (e) { return naoMedida('manual', `o som.json não é JSON (${e.message})`); } }
      const kit = JSON.parse(readFileSync(join(AQUI, '..', 'kit', 'som.json'), 'utf8'));
      const r = conferirManual(plano, { manual: lerManual(), kit, som, semSom: !som && plano.modo === 'falado', imagens: imagensAoLado(pasta) });
      const regra = (msg) => ({ regra: 'manual', msg });
      n += imprimir('manual', { erros: r.erros.map(regra), avisos: r.avisos.map(regra) });
    } else if (qual === 'cromo') {
      const a = await amostrada();
      n += imprimir('cromo', a.erro ? { erros: [{ regra: 'cromo', msg: a.erro }] } : cromoDasAmostras(a, plano || { cenas: [] }, { recusas: RECUSAS.cromo }));
    }
  };
  const todas = ['zona', 'tela', 'parado', 'bordas', 'som', 'cor', 'transicoes', 'curvas', 'recusados', 'oficio', 'cromo', 'estimulo', 'manual'];
  if (cmd === 'tudo') {
    if (plano) n += imprimir('excecoes', { erros: conferirExcecoes(plano), avisos: [] });
    for (const q of todas) await rodar(q);
  }
  else if (todas.includes(cmd)) await rodar(cmd);
  else { console.error(`comando "${cmd}" não existe`); process.exit(2); }
  process.exitCode = n ? 1 : 0;
}
