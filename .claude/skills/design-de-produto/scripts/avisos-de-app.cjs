/**
 * avisos-de-app · as medidas de tela de app que o medir-tela.cjs AVISA e não reprova.
 *
 * Cada uma é um defeito de tela de produto que as outras medidas deixam passar verde: fileira torta,
 * cartão com buraco, número desalinhado, dado de mentira, cor demais, conta que não fecha. Ficam
 * aviso, não reprovação, porque cada limiar é um ponto de partida: calibre-o nas telas que você
 * aprovou antes de transformar algum em trava. Os limiares estão em LIMIARES, com o porquê de cada um.
 *
 * A régua mede o comportamento, não a palavra do CSS: o algarismo tabular é medido pela largura de
 * "0000000000" contra "1111111111" na fonte que a tela usa (tabular-nums numa fonte sem tnum não
 * conta), e o número à esquerda pela posição do texto dentro da célula, não pelo text-align.
 *
 * Os avisos (o id sai na linha "    aviso <id>: ..."; o limiar de cada um em LIMIARES):
 *   fileira-desigual      cartões irmãos lado a lado cujo pé e cuja coluna terminam em alturas diferentes
 *                         (desktop). Irmãos = o mesmo cartão em volta: a moldura do método não esconde a linha
 *   vao-no-cartao         faixa em branco dentro do cartão, entre peças ou até o pé (desktop de 1100 px).
 *                         O rodapé colado ao pé com um total ou uma ação não conta
 *   faixa-sem-uso         o conteúdo para longe da borda direita (desktop de 1100 px)
 *   numero-a-esquerda     metade ou mais das células numéricas com o texto encostado à esquerda e folga
 *                         à direita; célula que o texto preenche não conta (sem folga, não se vê o lado)
 *   algarismo-nao-tabular menos da metade dos números com algarismo de largura fixa, medido na fonte
 *   dado-de-exemplo       lorem, John Doe, Acme, Fulano, "Cliente 1", exemplo.com, e telefone, CPF ou CEP
 *                         com algarismos em sequência ou repetidos (123-4567, 0000-0000)
 *   grafico-arco-iris     matizes demais nos gráficos (SVG de 120 × 60 e o que se marca data-grafico)
 *   cor-demais            parcela da primeira tela em cor forte, medida no PNG
 *   icone-em-quadrado     ícones em quadrado tingido; o tinto pelo croma, porque a saturação HSL do
 *                         #F4F4F8 (o botão redondo neutro do modelo) passa de 0,18
 *   abaixo-da-dobra       menos da metade dos blocos do topo começa na primeira tela (desktop)
 *   lateral-no-celular    a lateral (até 24 px da borda: a emoldurada do método conta) larga no celular
 *   numero-grande-demais  um número em 48 px ou mais
 *   titulo-grande-demais  o h1 acima de 34 px no desktop e de 28 no celular
 *   fato-divergente, soma-nao-fecha, variacao-nao-fecha, variacao-sem-sinal, variacao-sem-base,
 *   dois-nomes-um-horario, assercao-do-cenario   as contas marcadas (abaixo)
 *   estado-ausente        (no medir-tela, com --estados) o ?estado= que mostra a tela cheia
 *
 * As contas (a regra 8 da skill) só se medem onde a tela as marca:
 *   data-fato="nome"          o mesmo fato em dois lugares mostra o mesmo número (ou o mesmo texto)
 *   data-total="nome"         o total mostrado = a soma das partes MOSTRADAS (já arredondadas)
 *   data-parte="nome"         uma parte; data-sinal="-" quando ela subtrai
 *   data-variacao="a>b"       a variação mostrada = fato b − fato a, como aparecem na tela (em % se
 *                             ela tem % e os fatos não); toda variação, marcada com ou sem "a>b",
 *                             leva sinal e nomeia a base na mesma frase
 *   console.assert(...)       a asserção do cenário que falhar na página vira aviso
 * Um horário (HH:MM) com dois nomes de data-fato também avisa: um nome por horário.
 */
'use strict';

const LIMIARES = {
  // cartões da mesma linha dividem a borda de baixo: diferença acima de 24 px ou de 12% da altura avisa
  fileira: { minimo: 24, fracao: 0.12 },
  // faixa em branco dentro do cartão acima de 40 px; 64 quando o que vem depois abre seção
  vao: { faixa: 40, antesDeSecao: 64, larguraMinima: 1100 },
  // o conteúdo para a mais de max(120 px, 10%) da borda direita: a tela larga sobra vazia
  faixaSemUso: { px: 120, fracao: 0.1, larguraMinima: 1100 },
  // número em tabela encosta à direita e usa algarismo de largura fixa, para a coluna se ler de cima a baixo
  numeros: { celulas: 6, aEsquerda: 0.5, figuras: 6, tabular: 0.5 },
  // um matiz por gráfico, quatro no máximo na tela: cor demais deixa de dizer qual série importa
  matizes: 4,
  // parcela da primeira tela em cor forte; tela de produto calma fica perto de 3%
  corNaTela: 0.12,
  // ícones em quadrado tingido: mais de três viram enfeite repetido
  iconesEmQuadrado: 3,
  // metade dos blocos começa na primeira tela de desktop: o que importa não fica abaixo da dobra
  dobra: { blocos: 4, fracao: 0.5 },
  // a lateral no celular ocupa no máximo 30% da largura: no celular ela vira menu
  lateralNoCelular: 0.3,
  // nenhum número em 48 px ou mais; título até 34 px no desktop e 28 no celular
  figura: 48,
  titulo: { desktop: 34, celular: 28 },
};

// Roda DENTRO da página (page.evaluate): não pode usar nada de fora dela.
function medirNaPagina(L) {
  const W = innerWidth, H = innerHeight, SY = scrollY, B = document.body;
  const tela = document.createElement('canvas'); tela.width = tela.height = 1;
  const pincel = tela.getContext('2d', { willReadFrequently: true });
  const rgba = (c) => { pincel.clearRect(0, 0, 1, 1); pincel.fillStyle = 'rgba(0,0,0,0)'; pincel.fillStyle = c; pincel.fillRect(0, 0, 1, 1); const d = pincel.getImageData(0, 0, 1, 1).data; return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 }; };
  const lum = (v) => { const f = (x) => { x /= 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(v.r) + 0.7152 * f(v.g) + 0.0722 * f(v.b); };
  const contraste = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const hsl = (v) => { const r = v.r / 255, g = v.g / 255, b = v.b / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b); const l = (mx + mn) / 2; let h = 0, s = 0; if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return { h, s, l }; };
  const visivel = (e) => { if (e.closest('#previa')) return false; if (e.checkVisibility && !e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const fixo = (e) => { for (let p = e; p && p !== B; p = p.parentElement) if (getComputedStyle(p).position === 'fixed') return true; return false; };
  const chao = (el) => { for (let p = el; p; p = p.parentElement) { const v = rgba(getComputedStyle(p).backgroundColor); if (v.a >= 0.9) return v; } return { r: 255, g: 255, b: 255, a: 1 }; };
  const todos = [...B.querySelectorAll('*')].filter((e) => !e.closest('#previa')).slice(0, 12000);

  // a lateral: coluna alta à esquerda, com pelo menos 3 links ou botões. Até 24 px da borda, porque a
  // lateral emoldurada do método (a do painel de licenciamento solar) flutua com margem.
  let lateral = null;
  for (const e of todos) {
    const r = e.getBoundingClientRect();
    if (r.left <= 24 && r.top <= 80 && r.height >= H * 0.7 && r.width >= 48 && r.width <= Math.min(360, W * 0.45) && e.querySelectorAll('a, button').length >= 3 && visivel(e)) { lateral = { w: Math.round(r.width), parcela: r.width / W }; break; }
  }
  const x0 = lateral ? lateral.w : 0;

  // até onde o conteúdo vai à direita: o texto (não a caixa, que vai até a borda), gráficos e controles
  const caixas = [];
  const andaTexto = document.createTreeWalker(B, NodeFilter.SHOW_TEXT); const faixa = document.createRange();
  for (let n = andaTexto.nextNode(); n && caixas.length < 5000; n = andaTexto.nextNode()) {
    const pai = n.parentElement; if (n.nodeValue.trim().length < 2 || !pai || pai.closest('svg') || !visivel(pai) || fixo(pai)) continue;
    faixa.selectNodeContents(n); const r = faixa.getBoundingClientRect(); if (r.width < 2 || r.left < x0 - 1) continue;
    caixas.push(r);
  }
  for (const e of B.querySelectorAll('svg, canvas, img, video, input, select, textarea, button, table')) {
    if ((e.parentElement && e.parentElement.closest('svg')) || !visivel(e) || fixo(e)) continue;
    const r = e.getBoundingClientRect(); if (r.width < 8 || r.height < 8 || r.left < x0 - 1) continue;
    caixas.push(r);
  }
  const direitas = caixas.map((r) => r.right).sort((a, b) => a - b), esquerdas = caixas.map((r) => r.left).sort((a, b) => a - b);
  const canvasUsado = caixas.length ? { esquerda: Math.round(esquerdas[Math.floor(esquerdas.length * 0.02)] - x0), direita: Math.round(W - direitas[Math.floor(direitas.length * 0.98)]) } : null;

  // os cartões: caixa com fundo um degrau acima do chão, borda ou sombra, e texto dentro
  const cartoes = [];
  for (const e of todos) {
    const r = e.getBoundingClientRect(); if (r.width < 140 || r.height < 72 || r.width > W * 0.98) continue;
    if (!visivel(e) || fixo(e)) continue;
    const cs = getComputedStyle(e); const fundo = rgba(cs.backgroundColor), borda = parseFloat(cs.borderTopWidth) || 0;
    const preenchido = fundo.a >= 0.9 && contraste(fundo, chao(e.parentElement || B)) >= 1.04;
    const contornado = borda >= 0.5 && cs.borderTopStyle !== 'none' && rgba(cs.borderTopColor).a > 0.05;
    if (!preenchido && !contornado && cs.boxShadow === 'none') continue;
    if (!(e.innerText || '').trim()) continue;
    cartoes.push({ e, w: r.width, h: r.height, top: r.top + SY, left: r.left, bottom: r.bottom + SY, right: r.right, nome: (e.innerText || '').trim().split('\n')[0].slice(0, 32) });
  }
  const deCartao = new Set(cartoes.map((c) => c.e));
  // o cartão que contém cada um: só cartões irmãos (o mesmo contêiner) dividem uma linha
  for (const c of cartoes) { c.pai = null; for (let a = c.e.parentElement; a && a !== B; a = a.parentElement) if (deCartao.has(a)) { c.pai = a; break; } }
  const fileiras = [];
  if (W >= 640) {
    const abaixo = (p) => cartoes.find((q) => q !== p && q.pai === p.pai && Math.abs(q.left - p.left) <= 4 && Math.abs(q.w - p.w) <= 4 && q.top >= p.bottom - 2 && q.top - p.bottom <= 24);
    const pe = (p) => { let b = p.bottom; for (let q = abaixo(p), n = 0; q && n < 12; q = abaixo(q), n++) b = q.bottom; return b; };
    for (let i = 0; i < cartoes.length; i++) for (let k = i + 1; k < cartoes.length; k++) {
      const a = cartoes[i], b = cartoes[k];
      if (a.pai !== b.pai || Math.abs(a.top - b.top) > 4 || a.w < 200 || b.w < 200 || (a.right > b.left - 4 && b.right > a.left - 4)) continue;
      const cartao = Math.abs(a.bottom - b.bottom), coluna = Math.abs(pe(a) - pe(b)), dif = Math.min(cartao, coluna), alto = Math.max(a.h, b.h);
      if (dif > Math.max(L.fileira.minimo, alto * L.fileira.fracao)) fileiras.push(`"${a.nome}" e "${b.nome}" (no y ${Math.round(a.top)}): o pé dos cartões difere ${Math.round(cartao)}px, o das colunas ${Math.round(coluna)}px`);
    }
  }

  // o vão dentro do cartão: a maior faixa em branco entre as peças de conteúdo, ou da última ao pé
  const vaos = [];
  if (W >= L.vao.larguraMinima) for (const c of cartoes) {
    if (c.e.matches('nav, aside, header, footer, dialog, [role="navigation"], [role="dialog"]') || c.e.querySelector('nav') || (lateral && c.left < lateral.w - 4) || c.h < 120) continue;
    if (cartoes.filter((q) => q.e !== c.e && c.e.contains(q.e)).length >= 2) continue; // moldura de cartões, não cartão
    const cs = getComputedStyle(c.e), cr = c.e.getBoundingClientRect();
    const dentroTopo = cr.top + (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.paddingTop) || 0), dentroPe = cr.bottom - (parseFloat(cs.borderBottomWidth) || 0) - (parseFloat(cs.paddingBottom) || 0);
    const fundo = rgba(cs.backgroundColor), pecas = [];
    const anda = document.createTreeWalker(c.e, NodeFilter.SHOW_TEXT), rg = document.createRange();
    for (let n = anda.nextNode(); n; n = anda.nextNode()) {
      const pai = n.parentElement; if (!n.nodeValue.trim() || !pai || pai.closest('svg') || !visivel(pai)) continue;
      rg.selectNodeContents(n); const r = rg.getBoundingClientRect(); if (!r.height || !r.width) continue;
      const pcs = getComputedStyle(pai), fs = parseFloat(pcs.fontSize), fw = +pcs.fontWeight;
      pecas.push([r.top, r.bottom, !!pai.closest('h1, h2, h3, h4, h5, h6, [role="heading"], summary, legend, caption') || (fw >= 600 && fs >= 14) || (fw >= 500 && fs >= 15), pai]);
    }
    for (const el of c.e.querySelectorAll('*')) {
      if ((el.parentElement && el.parentElement.closest('svg')) || !visivel(el)) continue;
      const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 1) continue;
      if (/^(svg|canvas|img|video|input|select|textarea|button|hr|progress|meter|iframe)$/i.test(el.tagName)) { pecas.push([r.top, r.bottom, false, el]); continue; }
      const ecs = getComputedStyle(el), cor = rgba(ecs.backgroundColor);
      if (cor.a >= 0.1 && (fundo.a < 0.9 || contraste({ ...cor, a: 1 }, fundo) >= 1.03) && r.height >= 2) pecas.push([r.top, r.bottom, false, el]);
      if ((parseFloat(ecs.borderTopWidth) || 0) >= 0.5 && ecs.borderTopStyle !== 'none' && rgba(ecs.borderTopColor).a > 0.05) pecas.push([r.top, r.top + 1, false, el]);
      if ((parseFloat(ecs.borderBottomWidth) || 0) >= 0.5 && ecs.borderBottomStyle !== 'none' && rgba(ecs.borderBottomColor).a > 0.05) pecas.push([r.bottom - 1, r.bottom, false, el]);
    }
    const ys = pecas.filter(([a, b]) => b > dentroTopo - 2 && a < dentroPe + 2).sort((a, b) => a[0] - b[0]);
    if (!ys.length) continue;
    // o pé do cartão esticado pode levar um total ou uma ação: o
    // vão logo acima de um rodapé de até 48 px, colado ao pé, com algarismo ou com link e botão, não conta
    const rodapeComTotal = (de) => {
      const baixo = ys.filter(([t]) => t >= de - 1); if (!baixo.length) return false;
      const topo = Math.min(...baixo.map((p) => p[0])), pe = Math.max(...baixo.map((p) => p[1]));
      if (pe - topo > 48 || dentroPe - pe > 16) return false; // 16: o respiro do próprio rodapé
      return baixo.some(([, , , el]) => el && (el.closest('a, button') || /\d/.test(el.textContent || '')));
    };
    let fim = ys[0][1], maior = 0, onde = 0;
    for (const [a, b] of ys.slice(1)) { const g = a - fim, secao = ys.some(([t, , cab]) => cab && Math.abs(t - a) < 6); if (g > (secao ? L.vao.antesDeSecao : L.vao.faixa) && g > maior && !rodapeComTotal(a)) { maior = g; onde = fim; } fim = Math.max(fim, b); }
    if (dentroPe - fim > L.vao.faixa && dentroPe - fim > maior) { maior = dentroPe - fim; onde = fim; }
    if (maior > L.vao.faixa) vaos.push(`${Math.round(maior)}px em branco em "${c.nome}" (do y ${Math.round(onde + SY)})`);
  }
  const doTopo = cartoes.filter((c) => !c.pai);
  const naPrimeiraTela = doTopo.filter((c) => c.top < H - 48).length;

  // ícone em quadrado tingido: caixa quadrada de 24 a 64 px, fundo com matiz, um ícone e nenhum texto
  let iconesEmQuadrado = 0;
  for (const e of todos) {
    const r = e.getBoundingClientRect(); if (r.width < 24 || r.width > 64 || Math.abs(r.width - r.height) > 4) continue;
    const f = rgba(getComputedStyle(e).backgroundColor); if (f.a < 0.08) continue;
    if (!e.querySelector('svg, i, img, [class*="icon" i], [class*="icone" i]') || (e.innerText || '').trim().length > 2 || !visivel(e)) continue;
    // tinto pelo croma (máx − mín), não pela saturação HSL, que explode perto do branco: o #F4F4F8 do
    // botão redondo do modelo dá s 0,22 e croma 0,016. Neutro (avatar, botão) não conta.
    if ((Math.max(f.r, f.g, f.b) - Math.min(f.r, f.g, f.b)) / 255 * f.a < 0.06) continue;
    iconesEmQuadrado++;
  }

  // números: o que é número inteiro numa peça (valor, contagem, hora), em pt-BR e em inglês
  const ehNumero = (t) => /^[−\-+]?(R\$|US\$|[$€£¥])?\s?\d[\d.,\s]*(%|[kKmMbB]|\s?(ms|s|h|min|mil|mi|bi|GB|MB|kB|x))?$/.test(t);
  const celulas = [...B.querySelectorAll('td, [role="cell"], [role="gridcell"]')].filter((e) => visivel(e) && ehNumero((e.innerText || '').trim()));
  let aEsquerda = 0;
  for (const e of celulas) {
    const cs = getComputedStyle(e), r = e.getBoundingClientRect(); const rg = document.createRange(); rg.selectNodeContents(e); const t = rg.getBoundingClientRect();
    const esq = r.left + (parseFloat(cs.borderLeftWidth) || 0) + (parseFloat(cs.paddingLeft) || 0), dir = r.right - (parseFloat(cs.borderRightWidth) || 0) - (parseFloat(cs.paddingRight) || 0);
    if (t.left - esq <= 2 && dir - t.right > 4) aEsquerda++;
  }
  // tabular pela largura dos algarismos na fonte da peça (cache por estilo)
  const largura = new Map();
  const tabular = (cs) => {
    const chave = [cs.fontFamily, cs.fontSize, cs.fontWeight, cs.fontStyle, cs.fontStretch, cs.fontVariantNumeric, cs.fontFeatureSettings, cs.fontVariationSettings].join('|');
    if (largura.has(chave)) return largura.get(chave);
    const s = document.createElement('span');
    s.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:nowrap;letter-spacing:0';
    for (const p of ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'fontStretch', 'fontVariantNumeric', 'fontFeatureSettings', 'fontVariationSettings']) s.style[p] = cs[p];
    B.appendChild(s); s.textContent = '0000000000'; const a = s.getBoundingClientRect().width; s.textContent = '1111111111'; const b = s.getBoundingClientRect().width; s.remove();
    const ok = Math.abs(a - b) < 0.5; largura.set(chave, ok); return ok;
  };
  const figuras = [];
  for (const e of todos) {
    if (e.children.length || e.closest('svg')) continue; const t = (e.innerText || '').trim(); if (t.length < 2 || !ehNumero(t) || !visivel(e)) continue;
    const cs = getComputedStyle(e); figuras.push({ t: t.slice(0, 16), tamanho: parseFloat(cs.fontSize), tabular: tabular(cs) });
  }

  // matizes dos gráficos: SVG de pelo menos 120 × 60, e gráfico em div marcado (data-grafico ou classe)
  const matizes = new Set();
  const conta = (c) => { if (!c || c === 'none' || c.startsWith('url')) return; const v = rgba(c); if (v.a < 0.3) return; const h = hsl(v); if (h.s < 0.25 || h.l < 0.12 || h.l > 0.92) return; matizes.add(Math.round(h.h / 24) % 15); };
  for (const svg of B.querySelectorAll('svg')) {
    if ((svg.parentElement && svg.parentElement.closest('svg')) || !visivel(svg)) continue; const r = svg.getBoundingClientRect(); if (r.width < 120 || r.height < 60) continue;
    for (const s of svg.querySelectorAll('path, rect, circle, line, polyline, polygon, ellipse')) { const cs = getComputedStyle(s); conta(cs.fill); conta(cs.stroke); }
  }
  for (const g of B.querySelectorAll('[data-grafico], [class]')) {
    if (!g.hasAttribute('data-grafico') && !(typeof g.className === 'string' && /(^|[\s_-])(grafico|chart|graph)([\s_-]|$)/i.test(g.className))) continue;
    if (!visivel(g)) continue; for (const d of g.querySelectorAll('*')) if (!d.closest('svg') && visivel(d)) conta(getComputedStyle(d).backgroundColor);
  }

  // dado de exemplo: o que nenhum produto de verdade mostra
  const texto = B.innerText || '';
  const exemplos = new Set();
  for (const m of texto.match(/\blorem\b|\bipsum\b|\bdolor sit\b|\b(John|Jane) Doe\b|\bAcme( Inc| Corp)?\b|\bexample\.com\b|\bexemplo\.com(\.br)?\b|\bUser Name\b|\bFirstname Lastname\b|\bNome Sobrenome\b|\b123 Main St\b|\bfoo(bar)?\b|\bFulano( de Tal)?\b|\bBeltrano\b|\b[CS]iclano\b|\b(User|Usuário|Usuario|Cliente|Empresa) \d\b|\bteste@teste\b|\bemail@email\b/gi) || []) exemplos.add(m.toLowerCase());
  // telefone, CPF ou CEP com algarismos em sequência (123-4567) ou repetidos (0000-0000)
  for (const m of texto.match(/\(?\d{2,3}\)?\s?\d{4,5}-\d{4}\b|\b\d{3}-\d{4}\b|\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|\b\d{5}-\d{3}\b/g) || []) {
    const d = m.replace(/\D/g, ''); let seq = true, rep = true;
    for (let i = 1; i < d.length; i++) { if (+d[i] !== (+d[i - 1] + 1) % 10) seq = false; if (d[i] !== d[0]) rep = false; }
    if (seq || rep) exemplos.add(m);
  }

  const h1 = [...B.querySelectorAll('h1')].find(visivel);
  const titulo = h1 ? { t: (h1.innerText || '').trim().slice(0, 40), tamanho: parseFloat(getComputedStyle(h1).fontSize) } : null;

  // as contas marcadas pela tela
  const txt = (e) => (e.innerText || e.textContent || '').replace(/\s+/g, ' ').trim();
  const marcas = {
    fatos: [...B.querySelectorAll('[data-fato]')].filter(visivel).map((e) => ({ nome: e.dataset.fato, t: txt(e) })),
    totais: [...B.querySelectorAll('[data-total]')].filter(visivel).map((e) => ({ nome: e.dataset.total, t: txt(e) })),
    partes: [...B.querySelectorAll('[data-parte]')].filter(visivel).map((e) => ({ nome: e.dataset.parte, t: txt(e), sinal: e.dataset.sinal || '+' })),
    variacoes: [...B.querySelectorAll('[data-variacao]')].filter(visivel).map((e) => ({ de: e.dataset.variacao, t: txt(e), frase: (() => { const p = e.parentElement; const tp = p ? txt(p) : ''; return tp.length <= 160 ? tp : txt(e); })() })),
  };

  return { lang: document.documentElement.lang || '', lateral, canvasUsado, fileiras, vaos, blocos: doTopo.length, naPrimeiraTela, iconesEmQuadrado, celulas: celulas.length, aEsquerda, figuras, matizes: matizes.size, exemplos: [...exemplos], titulo, marcas };
}

// Parcela da primeira tela (a altura da janela) fortemente colorida, no PNG decodificado do medidor.
function corNaPrimeiraTela(img, alturaCss, escala) {
  const ate = Math.min(img.height, Math.round(alturaCss * escala)); const passo = 4; let n = 0, total = 0;
  for (let y = 0; y < ate; y += passo) for (let x = 0; x < img.width; x += passo) {
    const i = (y * img.width + x) * 4; const r = img.data[i] / 255, g = img.data[i + 1] / 255, b = img.data[i + 2] / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; const s = mx === mn ? 0 : l > 0.5 ? (mx - mn) / (2 - mx - mn) : (mx - mn) / (mx + mn);
    total++; if (s >= 0.4 && l >= 0.18 && l <= 0.82) n++;
  }
  return total ? n / total : 0;
}

// O primeiro número do texto, lido pela língua da página (pt: 7.842,16; en: 7,842.16), e as casas.
function numeroDe(t, lang) {
  const m = String(t).replace(/−/g, '-').match(/[-+]?\s?\d[\d.,]*/); if (!m) return null;
  let s = m[0].replace(/\s/g, ''); const ingles = /^en/i.test(lang);
  const dec = ingles ? '.' : ',', mil = ingles ? ',' : '.';
  s = s.split(mil).join(''); const casas = s.includes(dec) ? s.length - s.indexOf(dec) - 1 : 0;
  const v = parseFloat(s.replace(dec, '.')); return Number.isFinite(v) ? { v, casas } : null;
}
const numerosDe = (t) => (String(t).match(/\d+([.,:h]\d+)*/g) || []).join(' ');
const igualNaCasa = (a, b, casas) => Math.round(a * 10 ** casas) === Math.round(b * 10 ** casas);

function avisosDe(m, { largura, corDaTela = null, assercoes = [] }) {
  const L = LIMIARES, out = [], add = (id, texto) => out.push({ id, texto });
  const fmt = (x, casas) => { const s = x.toFixed(casas); return /^en/i.test(m.lang) ? s : s.replace('.', ','); };
  const celular = largura < 640;
  for (const f of m.fileiras.slice(0, 4)) add('fileira-desigual', `cartões lado a lado com o pé desalinhado: ${f}`);
  for (const v of m.vaos.slice(0, 4)) add('vao-no-cartao', v);
  const c = m.canvasUsado;
  if (largura >= L.faixaSemUso.larguraMinima && c && c.direita > Math.max(L.faixaSemUso.px, largura * L.faixaSemUso.fracao) && c.direita > c.esquerda + 80) add('faixa-sem-uso', `o conteúdo para ${c.direita}px antes da borda direita e começa ${c.esquerda}px depois da lateral`);
  if (m.celulas >= L.numeros.celulas && m.aEsquerda / m.celulas >= L.numeros.aEsquerda) add('numero-a-esquerda', `${m.aEsquerda} de ${m.celulas} células numéricas alinhadas à esquerda (número vai à direita)`);
  const tab = m.figuras.filter((f) => f.tabular).length;
  if (m.figuras.length >= L.numeros.figuras && tab / m.figuras.length < L.numeros.tabular) add('algarismo-nao-tabular', `só ${tab} de ${m.figuras.length} números em algarismo de largura fixa (medido na fonte), ex.: ${m.figuras.filter((f) => !f.tabular).slice(0, 3).map((f) => '"' + f.t + '"').join(', ')}`);
  if (m.exemplos.length) add('dado-de-exemplo', `dado de exemplo na tela: ${m.exemplos.slice(0, 6).join(', ')}`);
  if (m.matizes > L.matizes) add('grafico-arco-iris', `os gráficos usam ${m.matizes} matizes (um por gráfico, ${L.matizes} no máximo na tela)`);
  if (corDaTela !== null && corDaTela > L.corNaTela) add('cor-demais', `${Math.round(corDaTela * 100)}% da primeira tela é cor forte (cor vai no dado, no estado e na ação)`);
  if (m.iconesEmQuadrado >= L.iconesEmQuadrado) add('icone-em-quadrado', `${m.iconesEmQuadrado} ícones em quadrado tingido`);
  if (!celular && largura >= 1100 && m.blocos >= L.dobra.blocos && m.naPrimeiraTela / m.blocos < L.dobra.fracao) add('abaixo-da-dobra', `só ${m.naPrimeiraTela} de ${m.blocos} blocos começam na primeira tela`);
  if (celular && m.lateral && m.lateral.parcela > L.lateralNoCelular) add('lateral-no-celular', `a lateral ocupa ${Math.round(m.lateral.parcela * 100)}% da largura no celular`);
  const maior = m.figuras.reduce((a, f) => Math.max(a, f.tamanho), 0);
  if (maior >= L.figura) add('numero-grande-demais', `um número em ${Math.round(maior)}px (tela de app vai de 16 a 40)`);
  if (m.titulo && m.titulo.tamanho > (celular ? L.titulo.celular : L.titulo.desktop)) add('titulo-grande-demais', `o h1 tem ${Math.round(m.titulo.tamanho)}px ("${m.titulo.t}")`);

  // as contas marcadas
  const { fatos, totais, partes, variacoes } = m.marcas;
  const porNome = new Map();
  for (const f of fatos) { if (!porNome.has(f.nome)) porNome.set(f.nome, []); porNome.get(f.nome).push(f.t); }
  for (const [nome, ts] of porNome) {
    const nucleos = new Set(ts.map((t) => numerosDe(t) || t.toLowerCase()));
    if (nucleos.size > 1) add('fato-divergente', `o fato "${nome}" aparece com valores diferentes: ${[...new Set(ts)].map((t) => '"' + t + '"').join(' × ')}`);
  }
  const nomesDaHora = new Map();
  for (const f of fatos) for (const h of f.t.match(/\b\d{1,2}[:h]\d{2}\b/g) || []) { const k = h.replace('h', ':').padStart(5, '0'); if (!nomesDaHora.has(k)) nomesDaHora.set(k, new Set()); nomesDaHora.get(k).add(f.nome); }
  for (const [h, nomes] of nomesDaHora) if (nomes.size > 1) add('dois-nomes-um-horario', `${h} tem ${nomes.size} nomes: ${[...nomes].join(', ')}`);
  for (const t of totais) {
    const ps = partes.filter((p) => p.nome === t.nome).map((p) => ({ ...numeroDe(p.t, m.lang), sinal: p.sinal })).filter((p) => p.v !== undefined);
    const tv = numeroDe(t.t, m.lang); if (!tv || !ps.length) continue;
    const casas = Math.max(tv.casas, ...ps.map((p) => p.casas)); const soma = ps.reduce((a, p) => a + (p.sinal === '-' ? -Math.abs(p.v) : p.v), 0);
    if (!igualNaCasa(soma, tv.v, casas)) add('soma-nao-fecha', `o total "${t.nome}" mostra ${t.t}, e as ${ps.length} partes mostradas somam ${fmt(soma, casas)}`);
  }
  const valorDoFato = (nome) => { const f = fatos.find((x) => x.nome === nome); return f ? { ...numeroDe(f.t, m.lang), pct: f.t.includes('%') } : null; };
  for (const v of variacoes) {
    const n = numeroDe(v.t, m.lang);
    // a variação que começa pelo número leva sinal; a dita em palavras ("igual aos 30 dias antes") não
    if (n && n.v !== 0 && /^(R\$|US\$|[$€£¥])?\s?\d/.test(v.t) && !/[+\-−]\s?(R\$|US\$|[$€£¥])?\s?\d/.test(v.t)) add('variacao-sem-sinal', `a variação "${v.t}" não tem sinal`);
    if (!/\b(vs\.?|versus|que|contra|desde|sobre|ante|antes|depois|anterior|passad[oa]s?|últim[oa]s?|em relação|comparad[oa])\b/i.test(v.frase)) add('variacao-sem-base', `a variação "${v.t}" não diz a base na mesma frase ("sobre ontem", "vs. setembro")`);
    const [a, b] = (v.de || '').split('>');
    if (n && a && b) {
      const va = valorDoFato(a), vb = valorDoFato(b); if (!va || !vb || va.v === undefined || vb.v === undefined) continue;
      const pct = v.t.includes('%') && !vb.pct, esperado = pct ? ((vb.v - va.v) / va.v) * 100 : vb.v - va.v;
      const mostrado = /-|−/.test(v.t) ? -Math.abs(n.v) : Math.abs(n.v);
      if (!igualNaCasa(esperado, mostrado, n.casas)) add('variacao-nao-fecha', `a variação "${v.t}" devia ser ${esperado >= 0 ? '+' : ''}${fmt(esperado, n.casas)}${pct ? '%' : ''} (${b} − ${a}, como mostrados)`);
    }
  }
  for (const a of assercoes.slice(0, 4)) add('assercao-do-cenario', a);
  return out;
}

const contasMarcadas = (m) => m.marcas.fatos.length + m.marcas.totais.length + m.marcas.variacoes.length;

module.exports = { LIMIARES, medirNaPagina, corNaPrimeiraTela, avisosDe, contasMarcadas, numeroDe };
