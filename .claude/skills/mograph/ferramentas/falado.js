// O motor das cenas do falado (cenas.md). Roda na peça depois do script do modelo da
// /cortes, na mesma timeline, com os dados dela e o plano. Tudo pelo `window`
// (window.__timelines.main, window.DADOS, window.PLANO): no HyperFrames cada script roda
// isolado, e as variáveis do script do modelo (tl, D, q) não chegam aqui (medido no check).
// A montagem (montar-falado.mjs) copia este arquivo para a peça como mograph-falado.js:
// para mudar, mude aqui e monte de novo.
//
// - a câmera ganha um palco (#palco) em volta do quadro do punch-in; o palco muda de
//   enquadramento por cena: tela cheia, escurecida (legenda + interface), no cartão de
//   baixo (meia tela) ou fora (tela cheia de animação)
// - cada cena de animação tem um contêiner (.cena[data-cena]) na região do tipo dela, e o
//   script da cena (cenas/<id>.js, registrado com CENA(id, fn)) desenha dentro dele e põe
//   os movimentos na timeline, em tempo absoluto (c.de + …)
// - a pessoa nunca é recortada do fundo: na meia tela ela entra inteira no cartão
// Ajudantes como function, não arrow: o lint do check do HyperFrames lê mal a arrow sem chaves.
(function () {
  var P = window.PLANO;
  var FUNCOES = window.__cenas || {};
  if (!P || !P.cenas) return;
  var D = window.DADOS;
  var tl = window.__timelines && window.__timelines.main;
  if (!D || !tl) throw new Error('mograph-falado: sem window.DADOS ou window.__timelines.main: o script do modelo da /cortes tem de rodar antes');
  function q(n) { return n / D.fps; }
  var EST = P.estilo || {};
  var Z = window.ZONA;
  if (!Z) throw new Error('mograph-falado: sem window.ZONA no plano.js (a zona vem do formatos.json da /video): monte de novo pelo montar-falado.mjs');
  // a curva é a da marca: o movimento.js (gerado de identidade/marca.tokens.json, pela junção
  // _marca) já registrou "marca"; sem ele, o --ease-marca do tokens.css que o modelo carrega;
  // na marca neutra declarada, uma reserva neutra
  var ease = 'power3.out';
  var M = window.MARCA_MOVIMENTO;
  if (M && M.configurada && window.CustomEase) { M.registrar(gsap, CustomEase); ease = 'marca'; }
  else {
    var cb = getComputedStyle(document.documentElement).getPropertyValue('--ease-marca').match(/cubic-bezier\(([^)]+)\)/);
    if (window.CustomEase && cb) {
      var n = cb[1].split(',').map(Number);
      CustomEase.create('marca', 'M0,0 C' + n[0] + ',' + n[1] + ' ' + n[2] + ',' + n[3] + ' 1,1');
      ease = 'marca';
    }
  }
  var TEMPOS = window.TEMPOS;
  if (!TEMPOS) throw new Error('mograph-falado: sem window.TEMPOS no plano.js: monte de novo pelo montar-falado.mjs');
  var T = q(TEMPOS.entrada);   // a troca de enquadramento e a entrada da cena
  var root = document.getElementById('root');
  var quadro = document.getElementById('quadro');
  var legendas = document.getElementById('legendas');
  var F = D.ficha;

  // o palco em volta da câmera: o punch-in continua no #quadro, o enquadramento é do palco
  var palco = document.createElement('div');
  palco.id = 'palco';
  palco.style.cssText = 'position:absolute;left:0;top:0;width:1080px;height:1920px;transform-origin:0 0;overflow:hidden';
  palco.setAttribute('data-layout-allow-overflow', '');
  quadro.parentNode.insertBefore(palco, quadro);
  palco.appendChild(quadro);
  // o fundo da cena atrás do cartão da meia tela: a cor da direção (estilo.fundo), no quadro
  // inteiro; sem ele, o preto do modelo aparece em volta do cartão e a cena vira uma faixa solta
  var fundoCena = document.createElement('div');
  fundoCena.id = 'fundo-cena';
  fundoCena.style.cssText = 'position:absolute;left:0;top:0;width:1080px;height:1920px;background:' + (EST.fundo || 'var(--bg-dark)');
  palco.parentNode.insertBefore(fundoCena, palco);
  gsap.set(fundoCena, { autoAlpha: 0 });

  // o flash de câmera (a transição "flash", uma por peça na virada do ato): um véu branco por cima
  // de tudo, 3 quadros antes do corte e 3 depois
  var flash = document.createElement('div');
  flash.id = 'flash';
  flash.style.cssText = 'position:absolute;left:0;top:0;width:1080px;height:1920px;background:#fff;z-index:60;pointer-events:none'; // tecnico: o flash de câmera é luz branca, não cor da marca
  flash.setAttribute('data-zona', 'livre');
  root.appendChild(flash);
  gsap.set(flash, { autoAlpha: 0 });

  var cenasEl = document.createElement('div');
  cenasEl.id = 'cenas';
  cenasEl.style.cssText = 'position:absolute;left:0;top:0;width:1080px;height:1920px;z-index:30;pointer-events:none';
  root.appendChild(cenasEl);

  // as regiões saem da zona segura do destino (formatos.json da /video, via plano.js): a meia
  // tela usa a metade de cima da zona, o cartão da câmera e a interface a metade de baixo
  var MEIO = Math.round((Z.topo + Z.base) / 2);
  // o cartão da meia tela: a câmera inteira, em escala, com o rosto no centro do cartão
  var CARTAO = { topo: MEIO + 20, base: Z.base, raio: 40 };
  var S = EST.cartao_escala || 0.75;
  var ROSTO = EST.rosto_y || 864;             // o centro do rosto na gravação, em px de 1920
  var ty = (CARTAO.topo + CARTAO.base) / 2 - S * ROSTO;
  var tx = (1080 - 1080 * S) / 2;
  var corteTopo = Math.max(0, (CARTAO.topo - ty) / S);
  var corteBase = Math.max(0, 1920 - (CARTAO.base - ty) / S);
  var LAYOUT = {
    cheio:  { scale: 1, x: 0, y: 0, clipPath: 'inset(0px 0px 0px 0px round 0px)', filter: 'brightness(1) blur(0px)' },
    fundo:  { scale: 1, x: 0, y: 0, clipPath: 'inset(0px 0px 0px 0px round 0px)', filter: 'brightness(0.45) blur(12px)' },
    cartao: { scale: S, x: tx, y: ty, clipPath: 'inset(' + corteTopo.toFixed(1) + 'px 0px ' + corteBase.toFixed(1) + 'px 0px round ' + (CARTAO.raio / S).toFixed(1) + 'px)', filter: 'brightness(1) blur(0px)' }
  };
  function layoutDe(tipo) {
    if (tipo === 'legenda-interface') return 'fundo';
    if (tipo === 'meia-tela') return 'cartao';
    if (tipo === 'tela-cheia') return null;
    return 'cheio';
  }
  // a região de cada tipo: a meia tela em cima, a interface na metade de baixo
  var REGIAO = {
    'meia-tela':         { left: 0, top: Z.topo, width: 1080, height: MEIO - 20 - Z.topo },
    'legenda-interface': { left: 0, top: MEIO + 20, width: 1080, height: Z.base - MEIO - 20 },
    'tela-cheia':        { left: 0, top: 0, width: 1080, height: 1920 },
    'legenda':           { left: 0, top: 0, width: 1080, height: 1920 }
  };
  // a legenda sobe acima da interface; na tela cheia ela some (o texto da cena carrega a frase)
  var LEG_SOBE = (MEIO - 160) - F.posicao_y;
  // no cartão a legenda encolhe junto com a câmera: o bloco mais largo que a ficha deixa (a
  // largura dela, nunca além da zona) cabe no cartão com 40 px de folga de cada lado. Sem
  // isso, a legenda de tela cheia vaza do cartão (medido: 844 px de tinta num cartão de 810)
  var LEG_LARG = Math.min(F.largura || 1080, 1080 - 2 * Z.lateral);
  var LEG_CARTAO = Math.min(1, (1080 * S - 80) / LEG_LARG);
  var LEG_MEIO = F.posicao_y + Math.round((F.tamanho || 80) * 0.56);
  gsap.set(legendas, { transformOrigin: '540px ' + LEG_MEIO + 'px' });
  // a escala faz da legenda um contexto de empilhamento próprio, no nível zero: sem posição e
  // camada dela, as cenas (z 30) a cobrem na tela cheia. Ela ocupa o quadro inteiro, em cima
  legendas.style.cssText += ';position:absolute;left:0;top:0;width:1080px;height:1920px;z-index:40;pointer-events:none';

  // a legenda por tipo de cena (reel.legenda.por-tipo-de-cena): com a pessoa na tela, a fala
  // inteira (L2); quando a animação toma a tela, só a palavra forte (L1). Nas duas vozes, a linha de
  // apoio da frase que entra numa cena L1 não aparece; a chave fica. O modo vem da cena, do topo do
  // plano ou do tipo (tela cheia e meia tela, L1)
  var duas = D.duasVozes;
  function modoDe(c) { return c.legenda || ((c.tipo === 'tela-cheia' || c.tipo === 'meia-tela') ? 'L1' : (P.legenda || 'L2')); }
  function linhasDaFrase(n) { return legendas.querySelectorAll('.texto[data-frase="' + n + '"]'); }
  // as linhas da legenda que ainda se veem no instante t: no ar, ou saindo (a saída dura até 8 quadros)
  function linhasNoAr(t) {
    if (!D.duasVozes) return [];
    var nums = {};
    D.duasVozes.itens.forEach(function (it) { if (it.entra <= t && it.sai > t - q(8)) nums[it.frase] = true; });
    return [].concat.apply([], Object.keys(nums).map(function (n) { return [].slice.call(linhasDaFrase(n)); }));
  }
  var elDe = {};
  if (duas) {
    var entraDe = {};
    duas.itens.forEach(function (it) { entraDe[it.frase] = Math.min(entraDe[it.frase] === undefined ? 1e9 : entraDe[it.frase], it.entra); });
    Object.keys(entraDe).forEach(function (n) {
      var c = P.cenas.filter(function (x) { return entraDe[n] >= x.de - q(2) && entraDe[n] < x.ate - q(2); })[0];
      if (!c || modoDe(c) !== 'L1') return;
      linhasDaFrase(n).forEach(function (ln) { if (ln.getAttribute('data-voz') === 'apoio') ln.style.display = 'none'; });
    });
  }

  // a palavra atrás da cabeça (o texto-atras-da-pessoa, falado-extra.mjs): a palavra sobe de trás
  // da cabeça, a pessoa sem o fundo fica por cima dela no mesmo quadro, e a câmera dá um soco
  var A = P.atras;
  if (A) {
    var atras = document.getElementById('atras');
    var recorte = document.getElementById('atras-recorte');
    if (!atras || !recorte) throw new Error('mograph-falado: o plano tem "atras" e a página não tem a palavra ou o recorte: monte de novo pelo montar-falado.mjs');
    var C = window.CURVAS;
    if (!C) throw new Error('mograph-falado: sem o curvas.js da /mograph (a montagem da /cortes o copia)');
    // o soco: um invólucro entre o palco e o quadro, para não brigar com o punch-in do quadro
    var soco = document.createElement('div');
    soco.id = 'soco';
    soco.style.cssText = 'position:absolute;left:0;top:0;width:1080px;height:1920px;transform-origin:540px 900px';
    soco.setAttribute('data-layout-allow-overflow', '');
    palco.insertBefore(soco, quadro);
    soco.appendChild(quadro);
    var grande = atras.querySelector('.grande'), dona = atras.querySelector('.dona');
    // o recorte só se vê com a palavra: fora dela, a câmera inteira é a de sempre
    gsap.set([grande, dona, recorte], { autoAlpha: 0 });
    tl.set(recorte, { autoAlpha: 1 }, A.em - q(1));
    tl.set(recorte, { autoAlpha: 0 }, A.ate + q(10));
    tl.fromTo(grande, { autoAlpha: 0, y: 150, scale: 0.94, filter: 'blur(10px)' }, { autoAlpha: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: q(13), ease: C.heroi, immediateRender: false }, A.em);
    tl.fromTo(dona, { autoAlpha: 0, x: -80 }, { autoAlpha: 1, x: 0, duration: q(10), ease: C.pouso, immediateRender: false }, A.em + q(3));
    tl.fromTo(soco, { scale: 1 }, { scale: 1.05, duration: q(11), ease: C.heroi, immediateRender: false }, A.em);
    // a saída: a palavra afunda de volta atrás da cabeça, mais curta que a entrada
    tl.to(grande, { autoAlpha: 0, y: 170, duration: q(9), ease: C.saida }, A.ate);
    tl.to(dona, { autoAlpha: 0, duration: q(6), ease: C.saida }, A.ate);
    tl.to(soco, { scale: 1, duration: q(12), ease: C.deslize }, A.ate);
    // a frase que a palavra já diz, e a que entraria por cima dela, saem da legenda
    [].concat(A.oculta_frase || []).forEach(function (n) { linhasDaFrase(n).forEach(function (ln) { ln.style.display = 'none'; }); });
  }

  gsap.set(palco, LAYOUT.cheio);
  var anterior = 'cheio';
  // a entrada da tela cheia. Pelo corte, sobe 230 px já opaca e corta seco quando faltam 60 px (a
  // curva que freia deixava uma fresta da cena de antes, a crítica r10). Pelo zoom-dentro (a cena de
  // antes declara "transicao": "zoom-dentro"), nasce cobrindo o quadro, vinda de 1,22, enquanto a
  // câmera do rosto acelera para dentro do corte: o movimento continua de um lado ao outro
  var ZOOM_ENTRA = 1.22, ZOOM_SAI = 1.35;
  function porZoom(i) { var ant = P.cenas[i - 1]; return !!(ant && ant.transicao === 'zoom-dentro'); }
  // o desfoque do zoom-dentro (o "desfoque" da cena de antes, em px): o rosto borra enquanto mergulha
  // e a tela cheia nasce borrada e assenta em 8 quadros; o par de renders é a prova (hyperframes.md)
  function desfoqueDoZoom(i) { var ant = P.cenas[i - 1]; return ant && ant.transicao === 'zoom-dentro' ? Number(ant.desfoque) || 0 : 0; }
  function entraTelaCheia(el, c, i) {
    tl.set(el, { autoAlpha: 1 }, c.de);
    var curva = gsap.parseEase(ease);
    if (porZoom(i)) {
      tl.fromTo(el, { scale: ZOOM_ENTRA, y: 0, transformOrigin: '50% 47%' }, { scale: 1, duration: T, ease: curva, immediateRender: false, force3D: false }, c.de);
      var borra = desfoqueDoZoom(i);
      if (borra) {
        tl.fromTo(el, { filter: 'blur(' + borra + 'px)' }, { filter: 'blur(0px)', duration: q(8), ease: 'power2.out', immediateRender: false }, c.de);
        tl.set(el, { filter: 'none' }, c.de + q(8));
      }
      return;
    }
    // o eixo da entrada é a saída da cena de antes: "y-" (o padrão) entra subindo; "x-" entra da
    // direita para a esquerda e "x+" da esquerda para a direita (a alternância de direção entre telas
    // cheias seguidas), no mesmo corte na curva
    var ant = P.cenas[i - 1], eixo = ant && /^x[+-]$/.test(ant.saida || '') ? 'x' : 'y';
    var desloca = eixo === 'x' && ant.saida === 'x+' ? -230 : 230;
    var entra = function (p) { var v = curva(p); return Math.abs(desloca) * (1 - v) <= 60 ? 1 : v; };
    var de = {}, ate = { duration: T, ease: entra, immediateRender: false, force3D: false, snap: eixo };
    de[eixo] = desloca; ate[eixo] = 0;
    tl.fromTo(el, de, ate, c.de);
  }
  // o zoom na câmera do rosto (o "zoom" da cena: {em, escala, ancora_y, quadros, volta, quadros_volta}): o
  // de ênfase empurra em "quadros" e segura; o de transição nasce grande ("quadros": 0) e volta ao
  // enquadramento em "quadros_volta" a partir da "volta". A âncora é o ponto que fica parado na tela
  // a curva do zoom: "rapida" (o padrão) no de ênfase, "lenta" na aproximação que respira
  var CURVA_ZOOM = { rapida: 'power3.out', lenta: 'power2.inOut' };
  function zoomDaCena(c, prox) {
    [].concat(c.zoom || []).forEach(function (z) {
      var s = Number(z.escala), ax = z.ancora_x == null ? 540 : Number(z.ancora_x), ay = Number(z.ancora_y);
      // quadros 0: a câmera já está no zoom no quadro do em (o zoom de transição, que nasce grande e volta)
      var vai = { scale: s, x: ax * (1 - s), y: ay * (1 - s) }, quadros = z.quadros == null ? 5 : Number(z.quadros);
      if (quadros === 0) tl.set(palco, vai, Number(z.em));
      else tl.to(palco, Object.assign(vai, { duration: q(quadros), ease: CURVA_ZOOM[z.curva || 'rapida'] }), Number(z.em));
      if (z.volta != null) tl.to(palco, { scale: 1, x: 0, y: 0, duration: q(z.quadros_volta || 8), ease: 'power2.inOut' }, Number(z.volta));
      else if (prox) tl.set(palco, { scale: 1, x: 0, y: 0 }, c.ate);
    });
  }

  P.cenas.forEach(function (c, i) {
    var lay = layoutDe(c.tipo);
    var ini = Math.max(0, c.de - q(4));
    if (i === 0 && lay && lay !== 'cheio') { gsap.set(palco, LAYOUT[lay]); anterior = lay; }
    // a volta da tela cheia: a câmera já está no lugar, por baixo, quando a cena de antes começa a
    // sair; sem isso a cena some sobre o preto do modelo (medido: meio segundo de branco e cinza)
    var volta = anterior === null ? Math.max(0, c.de - q(TEMPOS.saida) - q(1)) : ini;
    if (lay === null) {
      // tela cheia: a cena cobre o quadro subindo; a câmera sai quando a cena já cobriu. A legenda
      // fica, no tamanho cheio: sem ela, quem assiste sem som perde a frase (o crítico mediu 39%
      // da fala de uma peça sem legenda)
      tl.to(palco, { autoAlpha: 0, duration: q(2) }, c.de + T);
      tl.to(legendas, { y: 0, scale: 1, duration: T, ease: ease }, ini);
      // no zoom-dentro a câmera do rosto mergulha no centro do rosto (540, 900) nos 6 quadros antes do
      // corte, acelerando; a volta do rosto depois repõe o enquadramento cheio (LAYOUT.cheio)
      if (porZoom(i)) {
        var mergulho = { scale: ZOOM_SAI, x: 540 * (1 - ZOOM_SAI), y: 900 * (1 - ZOOM_SAI), duration: q(6), ease: 'power2.in' };
        if (desfoqueDoZoom(i)) {
          mergulho.filter = 'brightness(1) blur(' + desfoqueDoZoom(i) + 'px)';
          // o quadro inteiro é a câmera: a legenda no ar e a marca da cena que sai borram junto nos 3
          // últimos quadros (a crítica da peça de teste: nítidas sobre o rosto borrado, liam como foco
          // raso). Só os elementos que acabam no corte: o filtro nos contêineres de todas as legendas e
          // cenas fazia a S04 seguinte divergir entre renders (54 quadros a 49 dB, medido duas vezes)
          var somem = [].slice.call(linhasNoAr(c.de)).concat(elDe[P.cenas[i - 1].id] ? [elDe[P.cenas[i - 1].id]] : []);
          if (somem.length) {
            tl.fromTo(somem, { filter: 'blur(0px)' }, { filter: 'blur(' + Math.round(desfoqueDoZoom(i) / 2) + 'px)', duration: q(3), ease: 'power2.in', immediateRender: false }, c.de - q(3));
            tl.set(somem, { filter: 'none' }, c.de);
          }
        }
        tl.to(palco, mergulho, c.de - q(6));
      }
    } else {
      if (anterior === null) {
        tl.set(palco, LAYOUT[lay], volta);
        tl.set(palco, { autoAlpha: 1 }, volta);
      } else if (lay !== anterior) {
        tl.to(palco, Object.assign({ duration: T, ease: ease }, LAYOUT[lay]), ini);
      }
      tl.to(legendas, { y: lay === 'fundo' ? LEG_SOBE : 0, scale: lay === 'cartao' ? LEG_CARTAO : 1, duration: T, ease: ease }, ini);
    }
    if (lay !== null) zoomDaCena(c, P.cenas[i + 1]);
    if (c.transicao === 'flash') {
      tl.fromTo(flash, { autoAlpha: 0 }, { autoAlpha: 0.85, duration: q(3), ease: 'power2.in', immediateRender: false }, c.ate - q(3));
      tl.to(flash, { autoAlpha: 0, duration: q(3), ease: 'power2.out' }, c.ate);
    }
    // o fundo da cena aparece com o cartão e some quando a câmera volta à tela cheia
    tl.set(fundoCena, { autoAlpha: lay === 'cartao' ? 1 : 0 }, lay === 'cartao' ? volta : c.de + T);
    anterior = lay;

    // a legenda só ganha contêiner quando a peça tem script para ela: a marca sem texto que
    // volta (manual, comum.componentes.elemento-que-volta), no quadro inteiro, por cima do rosto
    if (c.tipo === 'legenda' && !FUNCOES[c.id]) return;
    var r = REGIAO[c.tipo];
    var el = document.createElement('div');
    el.className = 'cena';
    el.setAttribute('data-cena', c.id);
    el.style.cssText = 'position:absolute;overflow:hidden;left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px';
    cenasEl.appendChild(el);
    elDe[c.id] = el;
    gsap.set(el, { autoAlpha: 0 });
    var opcoes = (FUNCOES[c.id] && FUNCOES[c.id](el, c, { tl: tl, q: q, ease: ease, D: D, P: P, entra: function (e) { entraTelaCheia(e, c, i); } })) || {};
    // na legenda a marca entra peça por peça, pelo script dela: o contêiner não sobe por cima do rosto
    // (a saída também é dele; no fim da frase o contêiner some, para nada vazar na cena seguinte)
    // a marca da cena só existe no tempo dela: visível desde o quadro 0, a da S02 aparecia em cima da
    // S01
    if (c.tipo === 'legenda') { gsap.set(el, { autoAlpha: c.de <= 0 ? 1 : 0 }); if (c.de > 0) tl.set(el, { autoAlpha: 1 }, c.de); tl.set(el, { autoAlpha: 0 }, c.ate); }
    else if (opcoes.entrada !== false) {
      // a corrente do vertical é para cima: a cena entra subindo e sai subindo
      var sobe = c.tipo === 'tela-cheia' ? 230 : 40;
      // em pixel inteiro e sem a camada 3D: a cena que sai com y fracionário e opacidade mudando
      // saía diferente de um render para outro no 4º quadro da saída (46 dB no pior quadro, medido
      // em dois renders por software); o determinismo da /video pede 50
      if (c.tipo === 'tela-cheia') {
        // a tela cheia não dissolve (dissolver não tem portador, manual: comum.transicao.dissolver): entra subindo já
        // opaca, por cima do que estava; se a próxima também é tela cheia, esta fica parada e é
        // coberta (o empurrão), e some quando a outra terminou de cobrir; se a próxima é o rosto,
        // sai subindo e corta no meio do movimento (senão a crítica vê duas fusões)
        var prox = P.cenas[i + 1];
        entraTelaCheia(el, c, i);
        if (prox && prox.tipo === 'tela-cheia') tl.set(el, { autoAlpha: 0 }, prox.de + T);
        else if (c.transicao === 'flash') tl.set(el, { autoAlpha: 0 }, c.ate);
        else {
          tl.to(el, { y: -sobe, duration: q(TEMPOS.saida), ease: 'power4.in', force3D: false, snap: 'y' }, Math.max(c.de + T, c.ate - q(TEMPOS.saida)));
          tl.set(el, { autoAlpha: 0 }, c.ate);
        }
      } else {
        tl.fromTo(el, { autoAlpha: 0, y: sobe }, { autoAlpha: 1, y: 0, duration: T, ease: ease, immediateRender: false, force3D: false, snap: 'y' }, c.de);
        tl.to(el, { autoAlpha: 0, y: -sobe, duration: q(TEMPOS.saida), ease: 'power4.in', force3D: false, snap: 'y' }, Math.max(c.de + T, c.ate - q(TEMPOS.saida)));
      }
    }
  });
})();
