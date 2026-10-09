#!/usr/bin/env node
/**
 * medir-tela · renderiza uma tela HTML nas quatro combinações (desktop 1440 e
 * celular 390, claro e escuro) e mede o que o olho erra.
 *
 *   node medir-tela.cjs <tela.html> [--saida <pasta>] [--prefixo nome] [--query "&x=1"]
 *
 * Mede, em cada combinação:
 *   · requisições para a internet (tem que ser 0: a tela abre do disco)
 *   · estouro horizontal, contra a largura PEDIDA (1440 ou 390), nunca contra a
 *     largura que a página decidiu ter. Medir contra a página dá verde num
 *     defeito real: uma fila com texto que não quebra leva a página a 498 px
 *     numa tela de 390, e a medida contra a página passa.
 *   · alvo de toque no celular: botão, link, [data-alvo] e .alvo* com menos de
 *     44 px de altura efetiva (conta a área ::after, que é a técnica certa)
 *   · contraste de cada selo ([data-selo], .selo, .badge ou classe com "etiqueta"), medido no PIXEL:
 *     fundo = cor mais frequente da caixa, texto = pixel mais distante dele
 *   · se a fonte de cada família declarada carregou de verdade
 *   · conteúdo que sai do próprio cartão (filho visível além da borda do pai)
 *   · texto sobre texto, recortado pelos ancestrais com overflow (o texto que a
 *     reticência esconde não conta, nem o que mora num <details> fechado)
 *   · caixa sobre caixa: selo, botão ou pílula por cima de outra caixa ou de texto
 *   · coluna de texto colapsada: elemento com reticência mais estreito que 96 px
 *   · tudo isso só no que está visível (checkVisibility)
 *   · página escura com fundo quase preto: mais escuro que #111317 reprova, em qualquer
 *     combinação em que a página saia escura. O escuro da skill é o grafite, fundo #181A1F
 *     (regra 16), porque o quase preto do original fica escuro demais. Projeto com escuro próprio
 *     (um produto de fundo #0A0A0A, por exemplo) passa --escuro-do-projeto, e aí só informa
 *   · número quebrado: texto curto com algarismo (valor, hora, espera) partido em duas
 *     linhas ("R$ / 7.842,16", "2 h / 12")
 *   · botão com o conteúdo maior que ele (o ícone encostado ou passando da borda)
 *   · no celular, texto espremido: mais de 3 linhas numa coluna com menos de 160 px
 *   As três últimas pegam defeitos que o olho vê com o resto do medidor verde.
 *
 * Cada medida responde a um defeito que passa verde sem ela, e cada uma é provada
 * nos dois sentidos: reprova a versão com o defeito, aprova a corrigida.
 *
 * O tema escuro é pedido pela query ?tema=escuro, e ?limpo esconde a barrinha de
 * prévia. Quando claro e escuro são DOIS arquivos (os modelos da skill são assim),
 * meça cada um só no tema dele: --tema claro no arquivo claro, --tema escuro no escuro.
 * Sem --tema, se a combinação "escura" sair igual à clara, o relatório diz isso em vez
 * de fingir que o escuro foi medido.
 *
 * Sai com código 1 se qualquer medida reprovar. Nada de "passou" por omissão.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

function acharPlaywright() {
  const candidatos = [];
  const npx = path.join(os.homedir(), 'AppData', 'Local', 'npm-cache', '_npx');
  if (fs.existsSync(npx)) for (const d of fs.readdirSync(npx)) candidatos.push(path.join(npx, d, 'node_modules', 'playwright'));
  candidatos.push(path.resolve(__dirname, '../../../../scripts/node_modules/playwright'));
  for (const c of candidatos) if (fs.existsSync(path.join(c, 'package.json'))) {
    // o decodificador de PNG vem junto do playwright-core, no mesmo node_modules
    let PNG = null;
    try { PNG = require(path.join(c, '..', 'playwright-core', 'lib', 'utilsBundle.js')).PNG; } catch {}
    return { ...require(c), PNG };
  }
  throw new Error('playwright não encontrado (procurei no cache do npx e em scripts/node_modules)');
}
function acharChromium() {
  const base = path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright');
  const dirs = fs.existsSync(base) ? fs.readdirSync(base).filter(d => /^chromium-\d+$/.test(d)).sort((a, b) => +b.split('-')[1] - +a.split('-')[1]) : [];
  for (const d of dirs) { const exe = path.join(base, d, 'chrome-win64', 'chrome.exe'); if (fs.existsSync(exe)) return exe; }
  return undefined; // deixa o playwright usar o dele
}
function contrasteDoSelo(png, caixa, escala, PNG) {
  const img = PNG.sync.read(png);
  const L = (r, g, b) => { const f = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const x0 = Math.round((caixa.x + 4) * escala), x1 = Math.round((caixa.x + caixa.w - 4) * escala);
  const y0 = Math.round((caixa.y + 3) * escala), y1 = Math.round((caixa.y + caixa.h - 3) * escala);
  if (x1 <= x0 || y1 <= y0) return null;
  const conta = new Map(), px = [];
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const i = (y * img.width + x) * 4; const k = `${img.data[i]},${img.data[i + 1]},${img.data[i + 2]}`;
    conta.set(k, (conta.get(k) || 0) + 1); px.push([img.data[i], img.data[i + 1], img.data[i + 2]]);
  }
  const fundo = [...conta.entries()].sort((a, b) => b[1] - a[1])[0][0].split(',').map(Number);
  const Lf = L(...fundo); let melhor = 1;
  for (const p of px) { const Lt = L(...p); const c = (Math.max(Lf, Lt) + 0.05) / (Math.min(Lf, Lt) + 0.05); if (c > melhor) melhor = c; }
  return +melhor.toFixed(2);
}

(async () => {
  const args = process.argv.slice(2);
  const tela = args.find(a => !a.startsWith('--'));
  if (!tela) { console.error('uso: node medir-tela.cjs <tela.html> [--saida pasta] [--prefixo nome] [--tema claro|escuro] [--query "&x=1"] [--escuro-do-projeto]'); process.exit(2); }
  const arq = path.resolve(tela);
  const saida = path.resolve(args.includes('--saida') ? args[args.indexOf('--saida') + 1] : path.dirname(arq));
  const prefixo = args.includes('--prefixo') ? args[args.indexOf('--prefixo') + 1] : path.basename(arq, '.html');
  // --query acrescenta parâmetros à url (ex.: "&degrau=2" mede uma variação da tela)
  const extra = args.includes('--query') ? args[args.indexOf('--query') + 1] : '';
  const escuroDoProjeto = args.includes('--escuro-do-projeto');
  // o piso do escuro: luminância do #111317. Abaixo disso é o quase preto que a regra 16 deixa de fora
  const lum = (r, g, b) => { const f = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const PISO_DO_ESCURO = lum(0x11, 0x13, 0x17);
  const { chromium, PNG } = acharPlaywright();
  const b = await chromium.launch({ executablePath: acharChromium() });
  // --tema claro|escuro mede só as duas combinações daquele tema (claro e escuro em dois arquivos)
  const tema = args.includes('--tema') ? args[args.indexOf('--tema') + 1] : '';
  if (tema && !['claro', 'escuro'].includes(tema)) { console.error('--tema aceita claro ou escuro'); process.exit(2); }
  const casos = [['desktop-claro', 1440, ''], ['desktop-escuro', 1440, '&tema=escuro'], ['celular-claro', 390, ''], ['celular-escuro', 390, '&tema=escuro']]
    .filter(([nome]) => !tema || nome.endsWith(tema));
  const fundoDoClaro = {};
  let reprovou = false; const relatorio = {};
  for (const [nome, w, q] of casos) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2, offline: true, hasTouch: w < 640, isMobile: w < 640 });
    const page = await ctx.newPage(); const externos = [];
    page.on('request', r => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:')) externos.push(r.url()); });
    await page.goto('file:///' + arq.replace(/\\/g, '/') + '?limpo' + q + extra);
    await page.waitForTimeout(1200);
    const m = await page.evaluate(async (pedida) => {
      await document.fonts.ready;
      const doc = document.documentElement.scrollWidth;
      const estouro = [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.right > pedida + 1 || r.left < -1); })
        .map(e => e.tagName.toLowerCase() + ' "' + (e.textContent || '').trim().slice(0, 30) + '"').slice(0, 8);
      const alvos = [...document.querySelectorAll('button, a[href], [data-alvo], .alvo, .alvo-texto, summary')].filter(e => e.getBoundingClientRect().height)
        .map(e => { const r = e.getBoundingClientRect(); const a = getComputedStyle(e, '::after'); const t = parseFloat(a.top), bo = parseFloat(a.bottom); const efetiva = a.content !== 'none' && a.position === 'absolute' && (t < 0 || bo < 0) ? r.height - Math.min(t, 0) - Math.min(bo, 0) : r.height; /* o ::after só é área de toque quando PASSA da borda; bolinha de aviso dentro do botão não conta */ return { t: (e.textContent || '').trim().slice(0, 24), efetiva: Math.round(efetiva) }; });
      const visivel = e => (e.checkVisibility ? e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) : true);
      const selos = [...document.querySelectorAll('[data-selo], .selo, .badge, [class*="etiqueta"]')].filter(visivel).map(e => { const r = e.getBoundingClientRect(); return { t: e.textContent.trim().slice(0, 24), x: r.x, y: r.y + scrollY, w: r.width, h: r.height }; }).filter(s => s.w > 8);
      // conteúdo saindo do cartão: o elemento passa da borda do fundo mais próximo que o contém.
      // Pega a coluna que sai 30 px do painel com o teste de página verde.
      const temFundo = el => { const c = getComputedStyle(el).backgroundColor; return c && c !== 'transparent' && !/rgba\(0, 0, 0, 0\)/.test(c); };
      const foraDoCartao = [];
      for (const e of document.querySelectorAll('body *')) {
        if (getComputedStyle(e).position === 'fixed' || e.closest('#previa') || !visivel(e)) continue;
        const r = e.getBoundingClientRect(); if (!r.width || !r.height) continue;
        let p = e.parentElement; while (p && p !== document.body && !temFundo(p)) p = p.parentElement;
        if (!p || p === document.body || p === document.documentElement) continue;
        const q = p.getBoundingClientRect();
        if (r.right > q.right + 1 || r.left < q.left - 1 || r.bottom > q.bottom + 1) foraDoCartao.push(e.tagName.toLowerCase() + ' "' + (e.textContent || '').trim().slice(0, 24) + '" sai de ' + p.tagName.toLowerCase() + '.' + (typeof p.className === 'string' ? p.className.split(' ')[0] : ''));
      }
      // texto sobreposto: dois textos que se cobrem na tela. Pega o nome do contato que passa
      // por baixo do selo da coluna ao lado, que nenhuma outra medida vê.
      const textos = [];
      for (const e of document.querySelectorAll('body *')) {
        if (e.closest('#previa') || !visivel(e)) continue;
        for (const n of e.childNodes) {
          if (n.nodeType !== 3 || !n.textContent.trim()) continue;
          const rg = document.createRange(); rg.selectNodeContents(n);
          // o que está escondido por overflow (reticências, recorte) não conta: recorta pela caixa que esconde
          let clip = e; while (clip && clip !== document.body && getComputedStyle(clip).overflow === 'visible') clip = clip.parentElement;
          const c = clip && clip !== document.body ? clip.getBoundingClientRect() : null;
          for (const r0 of rg.getClientRects()) {
            const r = c ? { left: Math.max(r0.left, c.left), right: Math.min(r0.right, c.right), top: Math.max(r0.top, c.top), bottom: Math.min(r0.bottom, c.bottom) } : r0;
            if (r.right - r.left > 2 && r.bottom - r.top > 2) textos.push({ e, r, t: n.textContent.trim().slice(0, 20) });
          }
        }
      }
      const sobrepostos = [];
      for (let i = 0; i < textos.length; i++) for (let j = i + 1; j < textos.length; j++) {
        const a = textos[i], b = textos[j]; if (a.e === b.e) continue;
        const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left), hh = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
        if (w > 2 && hh > 4) sobrepostos.push(`"${a.t}" × "${b.t}"`);
      }
      // caixa sobre caixa: selo, pílula ou botão cobrindo outro, ou cobrindo texto de fora dele.
      // No celular um selo ("34 min") pode cobrir o fim de um texto ("Pediu uma pessoa") sem que a
      // checagem de texto veja, porque os dois textos não se tocam; a CAIXA é que cobre.
      const caixas = [...document.querySelectorAll('[data-selo], .selo, .badge, button, [class*="etiqueta"], [class*="pilula"], .risco')]
        .filter(e => visivel(e) && !e.closest('#previa')).map(e => ({ e, r: e.getBoundingClientRect(), t: (e.textContent || '').trim().slice(0, 18) }))
        .filter(x => x.r.width > 4 && x.r.height > 4);
      const cobre = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2;
      for (let i = 0; i < caixas.length; i++) {
        for (let j = i + 1; j < caixas.length; j++) {
          const a = caixas[i], b = caixas[j];
          if (a.e.contains(b.e) || b.e.contains(a.e)) continue;
          if (cobre(a.r, b.r)) sobrepostos.push(`caixa "${a.t}" × caixa "${b.t}"`);
        }
        for (const tx of textos) if (!caixas[i].e.contains(tx.e) && !tx.e.contains(caixas[i].e) && cobre(caixas[i].r, tx.r)) sobrepostos.push(`caixa "${caixas[i].t}" × texto "${tx.t}"`);
      }
      // coluna de texto colapsada: texto cortado com reticências numa caixa estreita demais para
      // ser lido ("Co…"): no celular o nome do contato vira "Co…" e as outras medidas
      // passam. Coluna de texto nunca colapsa.
      const colapsadas = [...document.querySelectorAll('body *')].filter(e => visivel(e) && getComputedStyle(e).textOverflow === 'ellipsis')
        .filter(e => { const w = e.getBoundingClientRect().width; return (e.textContent || '').trim().length > 12 && w < 96 && e.scrollWidth > e.clientWidth; })
        .map(e => '"' + (e.textContent || '').trim().slice(0, 24) + '" em ' + Math.round(e.getBoundingClientRect().width) + 'px');
      const familias = [...new Set([...document.querySelectorAll('body *')].map(e => getComputedStyle(e).fontFamily.split(',')[0].replace(/["']/g, '').trim()))];
      const semFonte = familias.filter(f => !/^(system-ui|ui-|sans-serif|serif|monospace)/.test(f) && !document.fonts.check(`16px "${f}"`));
      // a cor de fundo da página: a do body, ou a do html se o body for transparente
      const corDoFundo = [document.body, document.documentElement].map(e => getComputedStyle(e).backgroundColor).find(c => !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) || 'rgb(255, 255, 255)';
      // o computado pode vir em oklch, lab ou rgb: um pixel de canvas converte qualquer um para rgb
      const tela1 = document.createElement('canvas'); tela1.width = tela1.height = 1;
      const pincel = tela1.getContext('2d'); pincel.fillStyle = corDoFundo; pincel.fillRect(0, 0, 1, 1);
      const [fr, fg, fb] = pincel.getImageData(0, 0, 1, 1).data;
      const fundoDaPagina = { css: corDoFundo, rgb: [fr, fg, fb] };
      // linhas que um nó de texto ocupa na tela (topos distintos, com folga de 4 px)
      const linhasDe = n => { const rg = document.createRange(); rg.selectNodeContents(n); const topos = []; for (const r of rg.getClientRects()) if (r.width > 1 && !topos.some(t => Math.abs(t - r.top) < 4)) topos.push(r.top); return topos.length; };
      const nosDeTexto = [];
      for (const e of document.querySelectorAll('body *')) {
        if (e.closest('#previa') || !visivel(e)) continue;
        for (const n of e.childNodes) if (n.nodeType === 3 && n.textContent.trim()) nosDeTexto.push({ e, n, t: n.textContent.trim() });
      }
      // rótulo quebrado: texto curto que é o conteúdo INTEIRO de uma peça (não um pedaço de frase
      // corrida) partido em duas linhas. Com algarismo, até 20 caracteres ("R$ / 7.842,16",
      // "2 h / 12"); sem algarismo, até 12, e só em célula, selo ou pílula ("sem / prazo").
      // Sem esta medida as duas formas passam verdes, e são visíveis a 1:1.
      const pecaInteira = x => { const e = x.e; if ((e.textContent || '').trim() !== x.t) return false; if (getComputedStyle(e).display !== 'inline') return true; const p = e.parentElement; return !!p && (p.textContent || '').trim().length <= 40; };
      const celula = e => !!e.closest('td, th, [data-selo], .selo, .badge, [class*="pilula"], [class*="etiqueta"]');
      const numerosQuebrados = nosDeTexto.filter(x => pecaInteira(x) && (x.t.length <= 20 && /\d/.test(x.t) || x.t.length <= 12 && celula(x.e)) && linhasDe(x.n) > 1).map(x => '"' + x.t + '"');
      // botão com o conteúdo maior que ele: um filho real (elemento ou texto) passando da borda.
      // Não usa scrollWidth: a área de toque ::after, que é a técnica certa, também o aumenta.
      const botoesEstourados = [];
      for (const e of document.querySelectorAll('button, [role="button"], a[class*="botao"], [class*="controle"]')) {
        if (!visivel(e) || e.closest('#previa')) continue;
        const r = e.getBoundingClientRect(); if (!r.width) continue;
        const cs = getComputedStyle(e); const esq = r.left + parseFloat(cs.borderLeftWidth), dir = r.right - parseFloat(cs.borderRightWidth);
        let maior = 0;
        for (const n of e.childNodes) {
          const rects = n.nodeType === 1 ? [n.getBoundingClientRect()] : n.nodeType === 3 && n.textContent.trim() ? (() => { const rg = document.createRange(); rg.selectNodeContents(n); return [...rg.getClientRects()]; })() : [];
          for (const c of rects) if (c.width) maior = Math.max(maior, c.right - dir, esq - c.left);
        }
        if (maior > 1) botoesEstourados.push('"' + (e.textContent || '').trim().slice(0, 24) + '" passa ' + Math.round(maior) + 'px da borda');
      }
      // texto espremido no celular: mais de 3 linhas numa coluna com menos de 160 px
      const espremidos = pedida < 640 ? nosDeTexto.filter(x => x.t.length > 30 && x.e.getBoundingClientRect().width < 160 && linhasDe(x.n) > 3)
        .map(x => '"' + x.t.slice(0, 24) + '" em ' + Math.round(x.e.getBoundingClientRect().width) + 'px, ' + linhasDe(x.n) + ' linhas') : [];
      return { fundoDaPagina, doc, estouro, alvos, selos, semFonte, foraDoCartao: foraDoCartao.slice(0, 8), foraTotal: foraDoCartao.length, sobrepostos: sobrepostos.slice(0, 8), sobreTotal: sobrepostos.length, colapsadas, numerosQuebrados, botoesEstourados, espremidos };
    }, w);
    const png = await page.screenshot({ path: path.join(saida, `${prefixo}-${nome}.png`), fullPage: true });
    const pequenos = w < 640 ? m.alvos.filter(a => a.efetiva < 44) : [];
    const contrastes = PNG ? m.selos.map(s => ({ t: s.t, c: contrasteDoSelo(png, s, 2, PNG) })).filter(s => s.c !== null) : [];
    const fracos = contrastes.filter(s => s.c < 4.5);
    // a página saiu escura? (vale para arquivo só escuro medido sem ?tema, e para o ?tema=escuro)
    const lf = lum(...m.fundoDaPagina.rgb);
    const fundoEscuroDemais = lf < 0.18 && lf < PISO_DO_ESCURO;
    const pretoReprova = fundoEscuroDemais && !escuroDoProjeto;
    // o "escuro" que saiu igual ao claro não é escuro medido: a tela não responde a ?tema=escuro
    if (!q) fundoDoClaro[w] = m.fundoDaPagina.css;
    const igualAoClaro = !!q && fundoDoClaro[w] === m.fundoDaPagina.css;
    const r = { requisicoesExternas: externos.length, larguraDoDocumento: m.doc, larguraPedida: w, estouro: m.estouro, alvosAbaixoDe44: pequenos, selosAbaixoDe45: fracos, menorContraste: contrastes.length ? Math.min(...contrastes.map(s => s.c)) : null, fontesQueNaoCarregaram: m.semFonte, foraDoCartao: m.foraDoCartao, textoSobreposto: m.sobrepostos, colunaColapsada: m.colapsadas, numeroQuebrado: m.numerosQuebrados, botaoEstourado: m.botoesEstourados, textoEspremido: m.espremidos, fundoDaPagina: m.fundoDaPagina, fundoQuasePreto: fundoEscuroDemais, escuroIgualAoClaro: igualAoClaro };
    const ok = !externos.length && m.doc <= w && !m.estouro.length && !pequenos.length && !fracos.length && !m.semFonte.length && !m.foraTotal && !m.sobreTotal && !m.colapsadas.length && !pretoReprova && !m.numerosQuebrados.length && !m.botoesEstourados.length && !m.espremidos.length;
    if (!ok) reprovou = true;
    relatorio[nome] = r;
    console.log(`${ok ? 'OK ' : 'REPROVA'} ${nome}${igualAoClaro ? ' (IGUAL AO CLARO: esta tela não tem escuro; meça o arquivo escuro com --tema escuro)' : ''}: externos ${externos.length} · largura ${m.doc}/${w} · estouro ${m.estouro.length} · toque<44 ${pequenos.length} · contraste mín ${r.menorContraste ?? 'sem selo'} · fonte faltando ${m.semFonte.length} · fora do cartão ${m.foraTotal} · texto sobreposto ${m.sobreTotal} · coluna colapsada ${m.colapsadas.length} · número quebrado ${m.numerosQuebrados.length} · botão estourado ${m.botoesEstourados.length} · texto espremido ${m.espremidos.length}${fundoEscuroDemais ? (escuroDoProjeto ? ' · fundo quase preto (escuro do projeto, só informa)' : ' · FUNDO QUASE PRETO') : ''}`);
    for (const x of m.numerosQuebrados) console.log('    número quebrado:', x);
    for (const x of m.botoesEstourados) console.log('    botão estourado:', x);
    for (const x of m.espremidos) console.log('    texto espremido:', x);
    if (pretoReprova) console.log('    fundo:', m.fundoDaPagina.css, 'rgb(' + m.fundoDaPagina.rgb.join(', ') + ')', 'é mais escuro que #111317; o escuro da skill é o grafite #181A1F (regra 16)');
    for (const x of m.colapsadas) console.log("    colapsada:", x);
    for (const x of m.sobrepostos) console.log("    sobreposto:", x);
    for (const x of m.foraDoCartao) console.log("    fora do cartão:", x);
    for (const x of m.estouro) console.log('    estouro:', x);
    for (const x of pequenos) console.log('    toque:', x.t, x.efetiva + 'px');
    for (const x of fracos) console.log('    contraste:', x.t, x.c);
    for (const x of m.semFonte) console.log('    fonte:', x);
    await ctx.close();
  }
  await b.close();
  if (!PNG) console.log('aviso: não achei o decodificador de PNG do playwright; o contraste NÃO foi medido');
  fs.writeFileSync(path.join(saida, `${prefixo}-medidas.json`), JSON.stringify(relatorio, null, 1));
  process.exit(reprovou || !PNG ? 1 : 0);
})().catch(e => { console.error('ERRO', e); process.exit(1); });
