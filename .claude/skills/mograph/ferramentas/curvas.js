/* curvas.js · as curvas medidas, para o GSAP de uma peça HyperFrames.
 *
 * As 12 primeiras são as famílias clássicas de easing (potência, exponencial, mola amortecida)
 * com parâmetros redondos, escolhidos pelo papel de cada uma. As 4 de interface
 * (`rapida`, `camera`, `voo`, `queda`) são bezier medidas em motion de interface. A `cartao` é a
 * mola de interface (f 2,6 Hz, d 10), a única: só no cartão, selo ou botão que sai do aparelho,
 * nunca no texto, na câmera ou na saída.
 * Cada uma vai direto no `ease` do GSAP:
 *   tl.to(el, { y: 0, duration: CURVAS.quadros.pouso / 30, ease: CURVAS.pouso }, t)
 * `f(0) = 0` e `f(1) = 1` em todas; as de mola passam do alvo e voltam.
 * Script comum: carrega depois do GSAP e antes das cenas (o montar-puro o embute).
 */
(function (raiz) {
  'use strict';
  var potenciaSai = function (p) { return function (t) { return 1 - Math.pow(1 - t, p); }; };
  var potenciaEntra = function (p) { return function (t) { return Math.pow(t, p); }; };
  var expoSai = function (k) { var d = 1 - Math.exp(-k); return function (t) { return (1 - Math.exp(-k * t)) / d; }; };
  var rampaSeca = function (w, tau) {
    var n = w * (1 - Math.exp(-1 / tau)) + (1 - w);
    return function (t) { return (w * (1 - Math.exp(-t / tau)) + (1 - w) * t) / n; };
  };
  var passaEVolta = function (A, ta, td) {
    var f = function (t) { return (1 + A * Math.exp(-t / td)) * (1 - Math.exp(-t / ta)); }, n = f(1);
    return function (t) { return f(t) / n; };
  };
  var mola = function (c, om) {
    var f = function (t) { return 1 - Math.exp(-c * t) * (Math.cos(om * t) + (c / om) * Math.sin(om * t)); }, n = f(1);
    return function (t) { return f(t) / n; };
  };
  // a mola de interface: 1 - e^(-d·s)·cos(2π·f·s), com s em segundos numa duração fixa (o
  // impulso de saída é o que a faz passar 17,4% aos 0,159 s e assentar a 2% aos 0,39 s)
  var molaFixa = function (f, d, dur) {
    var w = 2 * Math.PI * f, g = function (t) { var s = t * dur; return 1 - Math.exp(-d * s) * Math.cos(w * s); }, n = g(1);
    return function (t) { return g(t) / n; };
  };
  var esse = function (p) { return function (t) { var a = Math.pow(t, p), b = Math.pow(1 - t, p); return a / (a + b); }; };
  // a bezier cúbica do CSS (0,0)-(x1,y1)-(x2,y2)-(1,1): acha o s em que x(s) = t por bisseção
  // (40 passos dão erro abaixo de 1e-12) e devolve y(s). Pura de t: serve ao render por busca
  var bezier = function (x1, y1, x2, y2) {
    var b = function (s, p1, p2) { var u = 1 - s; return 3 * u * u * s * p1 + 3 * u * s * s * p2 + s * s * s; };
    return function (t) {
      var lo = 0, hi = 1, s = t;
      for (var i = 0; i < 40; i++) { s = (lo + hi) / 2; if (b(s, x1, x2) < t) lo = s; else hi = s; }
      return b(s, y1, y2);
    };
  };
  var guarda = function (f) { return function (t) { return t <= 0 ? 0 : t >= 1 ? 1 : f(t); }; };

  var CURVAS = {
    // chegada
    batida: guarda(passaEVolta(1.5, 0.2, 0.25)),   // bate no alvo e passa de leve (1,11 em t≈0,34): o impacto
    molaTarde: guarda(mola(3.5, 4.5)),             // passa pouco e tarde (1,06 em t≈0,70): o selo, o ícone
    quique: guarda(mola(1.25, 5)),                 // passa muito (1,47): uma vez por filme, se tanto
    heroi: guarda(rampaSeca(0.9, 0.1)),            // 58% do caminho no primeiro décimo: a entrada do protagonista
    pouso: guarda(expoSai(4)),                     // desacelera firme: texto e painel, a curva de trabalho
    chicote: guarda(potenciaSai(3)),               // movimento grande que freia forte (a cúbica de saída): câmera, chicote
    deslize: guarda(potenciaSai(2)),               // saída suave para movimento médio (a quadrática)
    // meio
    reta: guarda(function (t) { return t; }),      // linear: deriva, contador, fade de luz
    esse: guarda(esse(2)),                         // S simétrico: opacidade e desfoque
    // saída
    arranque: guarda(potenciaEntra(2)),            // acelera manso (a quadrática de entrada)
    saida: guarda(potenciaEntra(3)),               // a curva de quem sai (a cúbica)
    mergulho: guarda(potenciaEntra(4)),            // acelera forte para dentro do corte (a quártica)
    // interface (as bezier medidas em motion de interface)
    rapida: guarda(bezier(0.10, 0, 0, 1)),         // "fast start": metade do caminho em 16% do tempo; o aparelho que entra, o que volta para a tela
    camera: guarda(bezier(0.86, 0, 0.07, 1)),      // quase parada nas pontas, 9,6x a velocidade média no meio: reenquadrar e o push de tela
    voo: guarda(bezier(0.72, 0, 0.17, 1)),         // o cartão que voa até o lugar dele
    queda: guarda(bezier(0.55, 0, 0.95, 0.5)),     // gravidade: acelera até o fim (o que cai na lixeira)
    cartao: guarda(molaFixa(2.6, 10, 0.5)),        // a mola do cartão de interface (1,17 aos 0,16 s): em 15 q; noutra duração o tempo muda
  };
  // a duração sugerida de cada uma, em quadros a 30 qps (ponto de partida: a peça ajusta)
  CURVAS.quadros = { batida: 10, molaTarde: 15, quique: 22, heroi: 11, pouso: 12, chicote: 7, deslize: 10, reta: 9, esse: 9, arranque: 9, saida: 13, mergulho: 17,
    rapida: 14, camera: 20, voo: 18, queda: 8, cartao: 15 };

  raiz.CURVAS = CURVAS;
  if (typeof module !== 'undefined' && module.exports) module.exports = CURVAS;
})(typeof window !== 'undefined' ? window : globalThis);
