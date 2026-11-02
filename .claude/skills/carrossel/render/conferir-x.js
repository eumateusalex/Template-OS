#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// conferir-x · a régua de máquina do carrossel estilo X, antes do render
//
// O carrossel do kit tem o scripts/confere.mjs e a linha do tempo; o estilo X
// não tem nada disso de propósito (imita a interface de um post), então a
// régua dele é outra. O que este conferidor pega, e o olho não pega no JPEG:
//
//   · texto cortado ou vazando pela borda (o erro mais comum do formato)
//   · imagem comida pela caixa (a mídia encolhe e o overflow corta calado)
//   · imagem que não carregou ou não decodifica (o avatar 404 é um círculo cinza)
//   · CSS da peça diferente do modelo (peça velha renderiza com régua velha)
//   · a Inter, ou a fonte de emoji, caindo na fonte do sistema
//   · o nome ou o @ de exemplo do modelo, e o @ trocado entre slides
//   · travessão, slide sem texto, numeração fora de ordem (aviso)
//   · imagem de fundo claro e imagem de baixa resolução (aviso)
//   · emoji de símbolo de interface e palavra-gatilho em caixa alta (aviso)
//
// Quem chama é o render/montar-x.mjs; rodar solto serve para depurar.
//
// Uso:  node render/conferir-x.js <carrossel.html> [--raiz <pasta>] [--handle @conta]
// Sai 0 limpo, 1 com erro na peça, 2 com problema de ambiente. Aviso não derruba.
// A prova: render/teste-x.mjs.
// ═══════════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const { PREFIXO_DA_SKILL, dentro, achaRaiz, basesDaPeca, sobeServidor, TIPOS } = require('./servidor.js');

const SKILL = path.resolve(__dirname, '..');
const MODELO = path.join(SKILL, 'x', 'modelo.html');

// O que o modelo traz de exemplo e a peça não pode levar.
const NOME_DE_EXEMPLO = 'SEU NOME';
const HANDLE_DE_EXEMPLO = '@SEU_PERFIL';

// As duas réguas de imagem são aviso, não erro: print de tela e foto antiga de
// arquivo valem no formato, e quem decide é gente.
//   DENSIDADE_MIN: pixels do arquivo por pixel do JPEG (que sai a 2x). Abaixo de
//     0.75 a imagem sai borrada.
//   LADO_CLARO: luminância média da borda. Acima de 0.85 o contraste com o
//     branco do slide fica abaixo do que o olho lê como borda.
const DENSIDADE_MIN = 0.75;
const LADO_CLARO = 0.85;

// Emoji desenhado como botão de sistema: no meio do texto lê como ícone quebrado.
const EMOJI_DE_INTERFACE = /[\u{1F504}\u{1F500}\u{1F501}\u{23F1}\u{1F517}\u{2699}\u{1F51B}\u{1F519}\u{1F51D}]/u;

const cssNormalizado = (html) => {
  const m = html.match(/<style>([\s\S]*?)<\/style>/);
  return m ? m[1].replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim() : null;
};

/**
 * Confere uma peça estilo X.
 * @param {string} html o carrossel.html da peça
 * @param {{ raiz?: string, handle?: string }} [opcoes]
 *   raiz: a pasta do projeto (achada subindo até o .claude/ quando falta)
 *   handle: o @ que a peça tem de usar; sem ele, o do primeiro slide vale para todos
 * @returns {Promise<{ erros: string[], avisos: string[], slides: number, textos: string[] }>}
 *   `textos`: o texto de cada slide, para quem confere a legenda contra os cards
 */
async function conferir(html, opcoes = {}) {
  const HTML = path.resolve(html);
  if (!fs.existsSync(HTML)) throw Object.assign(new Error(`arquivo não encontrado: ${HTML}`), { codigo: 1 });
  const RAIZ = opcoes.raiz ? path.resolve(opcoes.raiz) : achaRaiz(path.dirname(HTML));
  if (!RAIZ && !dentro(HTML, SKILL)) throw Object.assign(new Error('nenhuma pasta de projeto (com .claude/) acima do HTML: passe --raiz'), { codigo: 1 });

  const { chromium } = require('playwright');
  const erros = [];
  const avisos = [];
  const faltando = [];

  const bases = basesDaPeca({ skill: SKILL, raiz: RAIZ, html: HTML });
  const ehImagem = (c) => (TIPOS[path.extname(c).toLowerCase()] || '').startsWith('image/');
  const { servidor } = await sobeServidor({ bases, aoFaltar: (c) => faltando.push(c), quais: ehImagem });
  const url = `http://127.0.0.1:${servidor.address().port}` + (dentro(HTML, SKILL)
    ? `/${PREFIXO_DA_SKILL}/` + path.relative(SKILL, HTML).split(path.sep).join('/')
    : '/' + path.relative(RAIZ, HTML).split(path.sep).join('/'));

  let browser;
  try {
    try {
      browser = await chromium.launch();
    } catch (e) {
      throw Object.assign(new Error(`o Chromium não abriu (${e.message.split('\n')[0]}): render/instalar.md`), { codigo: 2 });
    }
    const page = await browser.newPage({ deviceScaleFactor: 1, viewport: { width: 1080, height: 1350 } });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);

    // ── o CSS é o do modelo? ────────────────────────────────────────────
    const doModelo = fs.existsSync(MODELO) ? cssNormalizado(fs.readFileSync(MODELO, 'utf8')) : null;
    const daPeca = await page.evaluate(() => {
      if (!document.querySelector('meta[name="modelo-x"]')) return undefined;
      const s = document.querySelector('style');
      return s ? s.textContent.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim() : null;
    });
    if (daPeca !== undefined && doModelo && daPeca !== doModelo) {
      erros.push('o CSS da peça está defasado em relação ao x/modelo.html: rodar o gerar.js dela de novo');
    }

    // ── a medição, slide a slide ────────────────────────────────────────
    // Os helpers moram dentro do evaluate: o navegador só recebe o corpo da função.
    const dados = await page.evaluate(async () => {
      const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);

      // o que a moldura mostra: a imagem inteira, ou o quadrado do meio na dupla
      const regiaoVisivel = (im) => {
        const w = im.naturalWidth, h = im.naturalHeight;
        const r = im.getBoundingClientRect();
        if (getComputedStyle(im).objectFit !== 'cover' || !r.width || !r.height) return { sx: 0, sy: 0, sw: w, sh: h };
        const esc = Math.max(r.width / w, r.height / h);
        const sw = r.width / esc, sh = r.height / esc;
        return { sx: (w - sw) / 2, sy: (h - sh) / 2, sw, sh };
      };

      // a luminância média da faixa de 4% de cada borda, lado a lado
      const medeBordas = (im, reg) => {
        const W = Math.min(400, Math.max(8, Math.round(reg.sw)));
        const H = Math.max(1, Math.round(W * reg.sh / reg.sw));
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, W, H);
        ctx.drawImage(im, reg.sx, reg.sy, reg.sw, reg.sh, 0, 0, W, H);
        const d = ctx.getImageData(0, 0, W, H).data;
        const bx = Math.max(1, Math.round(W * 0.04));
        const by = Math.max(1, Math.round(H * 0.04));
        const lados = { topo: [0, 0], baixo: [0, 0], esquerda: [0, 0], direita: [0, 0] };
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            const k = y < by ? 'topo' : y >= H - by ? 'baixo' : x < bx ? 'esquerda' : x >= W - bx ? 'direita' : null;
            if (!k) continue;
            const i = (y * W + x) * 4;
            lados[k][0] += lum(d[i], d[i + 1], d[i + 2]);
            lados[k][1]++;
          }
        }
        let S = 0, N = 0;
        for (const [s, n] of Object.values(lados)) { S += s; N += n; }
        return {
          lados: Object.fromEntries(Object.entries(lados).map(([k, [s, n]]) => [k, s / n])),
          geral: S / N,
        };
      };

      // a fonte desenha mesmo? fonts.load devolve vazio sem @font-face e rejeita com o arquivo falho
      const carrega = async (fam, amostra) => {
        try { return (await document.fonts.load(`40px "${fam}"`, amostra)).length > 0; } catch { return false; }
      };
      const fontes = {
        inter: await carrega('Inter', 'Aáçãêõ 0123'),
        emoji: await carrega('Noto Color Emoji', '\u{1F642}'),
      };

      const slides = await Promise.all([...document.querySelectorAll('.slide')].map(async (s, i) => {
        const avatar = s.querySelector('.tw-avatar');
        const body = s.querySelector('.tw-body');
        const media = s.querySelector('.tw-media');
        const cs = getComputedStyle(s);
        const util = s.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
        const somaFilhos = [...s.children].reduce((t, el) => {
          const m = getComputedStyle(el);
          return t + el.getBoundingClientRect().height + parseFloat(m.marginTop) + parseFloat(m.marginBottom);
        }, 0);
        const rs = s.getBoundingClientRect();
        const bodyRect = body ? body.getBoundingClientRect() : null;
        const mediaRect = media ? media.getBoundingClientRect() : null;

        const midia = await Promise.all([...s.querySelectorAll('.tw-media img')].map(async (im) => {
          const src = im.getAttribute('src') || '';
          const nome = src.startsWith('data:') ? 'imagem embutida' : (src.split('/').pop().split('?')[0] || 'imagem');
          try { await im.decode(); } catch { return { nome, quebrada: true }; }
          if (!im.naturalWidth) return { nome, quebrada: true };
          const reg = regiaoVisivel(im);
          const r = im.getBoundingClientRect();
          return {
            nome,
            quebrada: false,
            natural: [im.naturalWidth, im.naturalHeight],
            larguraJpeg: Math.round(r.width * 2),
            densidade: +(reg.sw / (r.width * 2)).toFixed(2),
            bordas: medeBordas(im, reg),
          };
        }));

        return {
          n: i + 1,
          temHead: !!s.querySelector('.tw-head'),
          temAvatar: !!avatar,
          avatarBg: avatar ? getComputedStyle(avatar).backgroundImage : '',
          nome: (s.querySelector('.tw-nome b')?.textContent || '').trim(),
          handle: (s.querySelector('.tw-nome > span')?.textContent || '').trim(),
          blocos: body ? [...body.querySelectorAll('p')].map((p) => p.textContent.trim()).filter(Boolean) : [],
          bodyCortado: body ? body.scrollHeight > body.clientHeight + 1 : false,
          sobra: Math.round(util - somaFilhos),
          vazaEmbaixo: !!((bodyRect && bodyRect.bottom > rs.bottom - 4) || (mediaRect && mediaRect.bottom > rs.bottom - 4)),
          slotsVazios: s.querySelectorAll('.slot').length,
          // a imagem única mantém a altura dela; se é mais alta que a caixa, o resto não aparece.
          // clientHeight, porque o rect inclui a moldura de 1px
          cortadas: [...s.querySelectorAll('.tw-media:not(.dupla)')].map((cx) => {
            const im = cx.querySelector('img');
            if (!im) return null;
            const alturaImg = im.getBoundingClientRect().height;
            return { falta: Math.round(alturaImg - cx.clientHeight), toda: Math.round(alturaImg) };
          }).filter(Boolean),
          midia,
        };
      }));
      return { fontes, slides };
    });

    const { fontes, slides } = dados;
    if (!slides.length) erros.push('nenhum .slide encontrado: o HTML não é um carrossel');
    if (!fontes.inter) erros.push('a Inter não desenha: a peça sairia na fonte do sistema (confira a conexão com fonts.googleapis.com)');
    const temEmoji = slides.some((s) => s.blocos.some((b) => /\p{Extended_Pictographic}/u.test(b)));
    if (temEmoji && !fontes.emoji) erros.push('a fonte de emoji não carregou: o emoji sairia no desenho do sistema');

    const handleRef = opcoes.handle || slides[0]?.handle || '';
    let numeroEsperado = 1;
    let slotsTotal = 0;

    for (const s of slides) {
      const rot = `slide ${String(s.n).padStart(2, '0')}`;

      if (!s.temHead) erros.push(`${rot}: sem o cabeçalho (avatar, nome e @)`);
      if (!s.temAvatar) erros.push(`${rot}: sem avatar no cabeçalho`);
      else if (!s.avatarBg || s.avatarBg === 'none') erros.push(`${rot}: o avatar não tem imagem; o círculo sai vazio`);

      if (s.nome.includes(NOME_DE_EXEMPLO)) erros.push(`${rot}: o nome ainda é "${NOME_DE_EXEMPLO}", o de exemplo do modelo`);
      if (s.handle === HANDLE_DE_EXEMPLO) erros.push(`${rot}: o @ ainda é ${HANDLE_DE_EXEMPLO}, o de exemplo do modelo`);
      else if (s.handle && handleRef && s.handle !== handleRef) {
        erros.push(opcoes.handle
          ? `${rot}: o @ é "${s.handle}", e a peça pede ${opcoes.handle}`
          : `${rot}: o @ é "${s.handle}", diferente do primeiro slide (${handleRef})`);
      }

      if (s.bodyCortado) erros.push(`${rot}: texto cortado dentro do corpo`);
      if (s.vazaEmbaixo) erros.push(`${rot}: o conteúdo vaza pela borda de baixo`);
      if (s.sobra < 0) erros.push(`${rot}: conteúdo ${Math.abs(s.sobra)}px maior que a caixa: quebrar em dois slides, nunca diminuir a letra`);
      else if (s.sobra < 40) avisos.push(`${rot}: só ${s.sobra}px de folga, colado na borda`);

      for (const c of s.cortadas) {
        if (c.falta > 8) erros.push(`${rot}: a imagem foi cortada em ${c.falta}px de ${c.toda}px: encurtar o texto ou usar a imagem em 2:1`);
      }

      for (const m of s.midia) {
        if (m.quebrada) { erros.push(`${rot}: ${m.nome} não decodifica (arquivo corrompido ou não é imagem)`); continue; }
        if (m.densidade < DENSIDADE_MIN) {
          avisos.push(`${rot}: ${m.nome} tem ${m.natural[0]}×${m.natural[1]}px para ${m.larguraJpeg}px de JPEG (${m.densidade}x): vai sair borrada`);
        }
        const claros = Object.entries(m.bordas.lados).filter(([, L]) => L > LADO_CLARO).map(([k]) => k);
        if (claros.length >= 2 || m.bordas.geral > LADO_CLARO) {
          avisos.push(`${rot}: ${m.nome} com fundo claro (${claros.length ? claros.join(', ') : 'toda a borda'}): se funde no branco do slide`);
        }
      }

      if (!s.blocos.length) erros.push(`${rot}: sem texto no corpo`);
      if (s.blocos.length > 6) avisos.push(`${rot}: ${s.blocos.length} blocos, acima dos 2 a 6 do formato`);

      for (const b of s.blocos) {
        if (/[—–]/.test(b)) erros.push(`${rot}: travessão no texto: "${b.slice(0, 60)}"`);
        if (b.length > 300) avisos.push(`${rot}: bloco de ${b.length} caracteres, longo para o formato`);
        if (EMOJI_DE_INTERFACE.test(b)) avisos.push(`${rot}: emoji de símbolo de interface; no texto ele lê como botão quebrado (use emoji com figura)`);
        const gatilho = b.match(/\bcomenta\s+([^\s.,!?]+)/i);
        if (gatilho && gatilho[1].length >= 2 && /\p{Lu}/u.test(gatilho[1]) && gatilho[1] === gatilho[1].toUpperCase()) {
          avisos.push(`${rot}: palavra-gatilho ${gatilho[1]} em caixa alta: só entra se alguém responde o direct com o que ela promete`);
        }
      }

      // numeração em sequência; no máximo dois dígitos, para o ano não virar item
      const m = s.blocos[0] && s.blocos[0].match(/^(?:passo\s+)?(\d{1,2})\s?[.:\-]\s/i);
      if (m) {
        const n = Number(m[1]);
        if (n !== numeroEsperado) avisos.push(`${rot}: item numerado ${n}, esperava ${numeroEsperado}`);
        numeroEsperado = n + 1;
      }

      slotsTotal += s.slotsVazios;
    }

    for (const c of new Set(faltando)) erros.push(`imagem não carregou: ${c}`);
    if (slotsTotal) avisos.push(`${slotsTotal} slot(s) de imagem ainda vazio(s)`);

    return { erros, avisos, slides: slides.length, textos: slides.map((s) => s.blocos.join('\n')) };
  } finally {
    if (browser) await browser.close();
    servidor.close();
  }
}

module.exports = { conferir, NOME_DE_EXEMPLO, HANDLE_DE_EXEMPLO };

// ─── linha de comando ──────────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);
  const pega = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const html = args.find((a, i) => !a.startsWith('--') && !['--raiz', '--handle'].includes(args[i - 1]));
  if (!html) {
    console.error('uso: node render/conferir-x.js <carrossel.html> [--raiz <pasta>] [--handle @conta]');
    process.exit(1);
  }
  conferir(html, { raiz: pega('--raiz'), handle: pega('--handle') }).then((r) => {
    console.log(`slides: ${r.slides}`);
    for (const a of r.avisos) console.log(`  aviso  ${a}`);
    for (const e of r.erros) console.log(`  ERRO   ${e}`);
    if (r.erros.length) { console.log(`\n${r.erros.length} erro(s).`); process.exit(1); }
    console.log('\nlimpo.');
  }).catch((e) => {
    console.error(e.message);
    process.exit(e.codigo || 2);
  });
}
