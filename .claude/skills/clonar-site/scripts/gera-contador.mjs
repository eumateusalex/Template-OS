// gera-contador.mjs — devolve ao clone o número que SOBE, e o valor de partida
// que a captura estragou.
//
// Par do mede-contador.mjs. A captura fotografa a página no meio da contagem,
// e o clone nasce com um número qualquer. Pior: o site emite uma variante do
// bloco por breakpoint, e cada uma congela num quadro diferente — medido no
// framer-4, a variante larga trazia 83/1/12/4 e a estreita 80/0/10/3, para os
// mesmos quatro dados. O valor de partida verdadeiro é o do HTML do original
// (80/0/10/3) e o de chegada é o do repouso (120/10/25/15).
//
// O que faz:
//   1. escreve no JSX, para cada data-cid do mapa, o texto de PARTIDA medido —
//      as duas variantes ficam iguais, porque no original elas são iguais;
//   2. escreve public/contador.js: um MAPA por rota (cid, início, fim, duração
//      e a curva medida), um IntersectionObserver por elemento e um rAF que
//      interpola pela curva.
//
// 🚨 Por que o dado vai no JS e não em CSS var: o data-cid reinicia por rota,
// então o mapa é por rota e o runtime carrega o guard. E porque a folha por
// rota deste build passa por entrega-inline; um dado que não disputa nenhuma
// utilitária do Tailwind não precisa entrar naquela fila.
//
// O que o faz SE CALAR:
//   - cid do mapa ausente no JSX          -> declara esse, segue nos outros
//   - contador sem valorFinal medido      -> declara, não anima
//   - nenhum cid casado                   -> não escreve runtime nenhum
//
// Uso:
//   MEDICAO=<contador.json> MAPA=<mapa.json> APP=<app> ROTA=/ node gera-contador.mjs
//
// MAPA: [{ "id":"0", "cids":["n476","n479"] }, ...]  (id = índice do mede-contador)
//
// Variáveis: MEDICAO, MAPA, APP (obrigatórias) · ROTA (padrão /) ·
//   ESCREVER=0 simula

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const MEDICAO = process.env.MEDICAO, MAPA = process.env.MAPA, APP = process.env.APP;
if (!MEDICAO || !MAPA || !APP) { console.error("falta MEDICAO=<json> MAPA=<json> APP=<app>"); process.exit(1); }
const ROTA = process.env.ROTA ?? "/";
const ESCREVER = process.env.ESCREVER !== "0";

const med = JSON.parse(readFileSync(resolve(MEDICAO), "utf8").replace(/^﻿/, ""));
const mapa = JSON.parse(readFileSync(resolve(MAPA), "utf8").replace(/^﻿/, ""));

function arquivoDaRota(rota) {
  if (rota === "/") {
    const grupo = join(APP, "src", "app", "(inicio)", "page.tsx");
    return existsSync(grupo) ? grupo : join(APP, "src", "app", "page.tsx");
  }
  return join(APP, "src", "app", ...rota.split("/").filter(Boolean), "page.tsx");
}

const arquivo = arquivoDaRota(ROTA);
if (!existsSync(arquivo)) { console.error(`página da rota não existe: ${arquivo}`); process.exit(1); }
let jsx = readFileSync(arquivo, "utf8");

const entradas = [];
let trocados = 0, declarados = 0;

for (const item of mapa) {
  const c = med.contadores.find((x) => x.id === String(item.id));
  if (!c) { console.log(`⚠️ id ${item.id} não está na medição — declarado`); declarados++; continue; }
  if (c.valorFinal === undefined || c.valorInicial === undefined) { console.log(`⚠️ id ${item.id} sem valor medido — declarado`); declarados++; continue; }

  for (const cid of item.cids) {
    const marca = `data-cid="${cid}"`;
    const pos = jsx.indexOf(marca);
    if (pos < 0) { console.log(`⚠️ ${cid} não achado no JSX — declarado`); declarados++; continue; }
    // o texto do elemento: entre o fim da tag de abertura e o fecho
    const fimAbertura = jsx.indexOf(">", pos);
    const fecha = jsx.indexOf("</", fimAbertura);
    if (fecha < 0) { console.log(`⚠️ ${cid} sem fecho — declarado`); declarados++; continue; }
    const dentro = jsx.slice(fimAbertura + 1, fecha);
    const atual = dentro.trim();
    if (!/^\d+$/.test(atual)) { console.log(`⚠️ ${cid} não contém só dígitos ("${atual.slice(0, 18)}") — declarado`); declarados++; continue; }
    if (atual !== String(c.valorInicial)) {
      jsx = jsx.slice(0, fimAbertura + 1) + dentro.replace(atual, String(c.valorInicial)) + jsx.slice(fecha);
      console.log(`  ${cid}: partida "${atual}" -> "${c.valorInicial}"  (a captura pegou no meio da contagem)`);
      trocados++;
    }
    entradas.push({ cid, ini: c.valorInicial, fim: c.valorFinal, dur: c.duracaoMs, curva: c.curva });
  }
  console.log(`  id ${item.id}: ${c.valorInicial} → ${c.valorFinal} em ${c.duracaoMs}ms (${item.cids.join(", ")})`);
}

if (!entradas.length) { console.log("nenhum cid casado — runtime NÃO escrito."); process.exit(0); }

const runtime = `// Gerado por scripts/gera-contador.mjs — NÃO editar à mão.
// Contador numérico: sobe do valor de PARTIDA ao de REPOUSO quando a seção
// entra na tela. Partida, chegada, duração e curva saem todos do
// mede-contador.mjs rodado no original — nenhum número foi digitado.
(function () {
  var MAPA = ${JSON.stringify({ [ROTA]: entradas })};

  function rota() {
    var p = location.pathname.replace(/\\/+$/, "");
    return p === "" ? "/" : p;
  }

  function interpolar(curva, p) {
    if (!curva || curva.length < 2) return p;
    var n = curva.length - 1;
    var i = Math.min(n - 1, Math.floor(p * n));
    var t = p * n - i;
    return curva[i] + (curva[i + 1] - curva[i]) * t;
  }

  // 🚨 O contador PAUSA fora da tela e RETOMA de onde parou — não corre até o
  // fim em segundo plano, e não recomeça do zero.
  //
  // Medido no original (framer-4): rolando a página inteira de
  // ponta a ponta, os quatro contadores congelam em 87/3/14/6 e ficam nesses
  // números indefinidamente com a seção fora do enquadramento; ao voltar, em
  // 250ms marcam 93/5/18/8 e em 1,5s chegam ao repouso. Ou seja: o tempo que
  // conta é o tempo EM TELA, igualzinho ao laço do marquee.
  //
  // Isto não é enfeite: um contador que corre até o fim escondido deixa o clone
  // marcando 120 enquanto o original marca 87, e como o texto de um contador é
  // o próprio número, os dois nem casam na comparação.
  function animar(el, cfg) {
    var decorrido = 0; // ms acumulados COM O ELEMENTO EM TELA
    var anterior = null;
    var visivel = false;
    var amplitude = cfg.fim - cfg.ini;
    var obs = null;
    if ("IntersectionObserver" in window) {
      obs = new IntersectionObserver(function (es) { visivel = es[es.length - 1].isIntersecting; }, { threshold: 0 });
      obs.observe(el);
    } else {
      visivel = true;
    }
    function passo(t) {
      if (anterior !== null && visivel) decorrido += t - anterior;
      anterior = t;
      var p = cfg.dur > 0 ? Math.min(1, decorrido / cfg.dur) : 1;
      el.textContent = String(Math.round(cfg.ini + amplitude * interpolar(cfg.curva, p)));
      if (p < 1) requestAnimationFrame(passo);
      else {
        el.textContent = String(cfg.fim); // o repouso é exato, nunca arredondado por acaso
        if (obs) obs.disconnect();
      }
    }
    requestAnimationFrame(passo);
  }

  function ligar() {
    var lista = MAPA[rota()];
    if (!lista) return;
    var reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
    for (var i = 0; i < lista.length; i++) {
      (function (cfg) {
        var el = document.querySelector('[data-cid="' + cfg.cid + '"]');
        if (!el) return;
        // idempotência POR ELEMENTO: guard global barraria a 2ª rota inteira
        if (el.getAttribute("data-contador") === "1") return;
        el.setAttribute("data-contador", "1");
        // quem desligou movimento recebe o ESTADO FINAL, nunca o de partida
        if (reduz) { el.textContent = String(cfg.fim); return; }
        // animar() já se governa pela visibilidade: começa parado no valor de
        // partida e só acumula tempo com o elemento em tela
        el.textContent = String(cfg.ini);
        animar(el, cfg);
      })(lista[i]);
    }
  }

  window.__dittoContador = ligar;
  if (document.readyState === "complete") ligar();
  else window.addEventListener("load", ligar);
})();
`;

const destino = join(APP, "public", "contador.js");
if (ESCREVER) {
  writeFileSync(arquivo, jsx);
  writeFileSync(destino, runtime);
}
console.log(`\n${ESCREVER ? "escrito" : "SIMULADO"}: ${trocados} valor(es) de partida corrigido(s), ${entradas.length} contador(es) no runtime, ${declarados} declarado(s).`);
console.log(`-> ${destino}`);
console.log(`⚠️ falta ligar no layout: <script src="/contador.js" defer /> e __dittoContador() no religar da navegação.`);
