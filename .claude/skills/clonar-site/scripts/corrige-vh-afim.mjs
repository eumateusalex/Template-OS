// corrige-vh-afim.mjs — seção cuja altura é AFIM no viewport: h = a + 100vh.
//
// 🚨 Classe da família "valor derivado virou constante" (regra 23),
// medida no framer-2. O corrige-viewport exige RAZÃO
// h/viewport constante e por isso recusa (certo, pelo critério dele) a seção
// que mede 997/1197/1397 nas janelas 700/900/1100: a razão varia, mas a
// INCLINAÇÃO é exatamente 1 — é conteúdo fixo somado a um filho de 100vh que
// a captura congelou nos px da janela dela (aqui, 800).
//
// Medido no framer-2, home: hero 100vh puro + duas seções afins, cada uma
// 100px curta no clone = a cascata inteira de -300px que empurrava tudo.
//
// O que faz, por rota:
//   1. mede os <section> do ORIGINAL em três janelas (700/900/1100) e os do
//      CLONE na janela de referência (900)
//   2. seção com inclinação 1 (±TOL_INCL) nas três janelas E clone divergindo
//      é candidata
//   3. dentro dela, no CLONE, procura o descendente congelado: computed height
//      == altura da captura (a divergência da própria seção); confirma no
//      ORIGINAL que o par (mesma posição relativa e largura) mede janela px
//   4. escreve em geometria.css da rota, dentro de @media (min-width:1024px):
//      [data-cid="X"] { height: 100vh } — só onde o delta EXPLICA o número
//
// O que o faz SE CALAR:
//   - inclinação não é 1 nas três janelas          -> declara, não escreve
//   - contagem de <section> difere entre os lados  -> declara a rota, pula
//   - nenhum descendente congelado explica o delta -> declara, não escreve
//   - par no original não confirma a lei           -> declara, não escreve
//   - mais que MAX_REGRAS na rota                  -> declara, não escreve nada
//
// Uso:
//   ORIGINAL=... CLONE=http://127.0.0.1:8082 APP=<app> ROTAS=<med>/rotas.json \
//   SAIDA=<med>/vh-afim node corrige-vh-afim.mjs
//
// Variáveis:
//   ORIGINAL, CLONE, APP  (obrigatórias)
//   ROTAS      arquivo rotas.json OU lista "/a,/b" (padrão /)
//   SAIDA      pasta de medição (padrão ./vh-afim)
//   TOL        px de tolerância (padrão 4)
//   MAX_REGRAS teto por rota (padrão 6)
//   ESCREVER   0 simula
//   DITTO      raiz do ditto

import { createRequire } from "node:module";
import { writeFileSync, readFileSync, existsSync, mkdirSync, appendFileSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const ORIGINAL = process.env.ORIGINAL, CLONE = process.env.CLONE, APP = process.env.APP;
if (!ORIGINAL || !CLONE || !APP) { console.error("faltam ORIGINAL/CLONE/APP"); process.exit(1); }
const SAIDA = resolve(process.env.SAIDA ?? "./vh-afim");
const TOL = Number(process.env.TOL ?? 4);
const MAX_REGRAS = Number(process.env.MAX_REGRAS ?? 6);
const ESCREVER = process.env.ESCREVER !== "0";
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
mkdirSync(SAIDA, { recursive: true });

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

function carregarRotas() {
  const bruto = process.env.ROTAS ?? "/";
  // ⚠️ existsSync("/") é TRUE no Windows (raiz do disco) — conferir isFile
  if (existsSync(bruto) && statSync(bruto).isFile()) {
    const j = JSON.parse(readFileSync(bruto, "utf8"));
    return (j.rotas ?? j).map((r) => r.rota ?? r).filter((r) => typeof r === "string");
  }
  return bruto.split(",").map((s) => s.trim()).filter(Boolean);
}
const rotas = carregarRotas();

const nav = await chromium.launch();

async function medirSecoes(base, rota, altura) {
  const p = await nav.newPage({ viewport: { width: 1280, height: altura } });
  await p.goto(new URL(rota, base).href, { waitUntil: "load", timeout: 60000 });
  await p.waitForTimeout(1000);
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 35)); }
    scrollTo(0, 0);
  });
  await p.waitForTimeout(700);
  const dados = await p.evaluate((JANELA) =>
    [...document.querySelectorAll("section")].map((el) => {
      const r = el.getBoundingClientRect();
      // descendentes com altura ≈ janela (candidatos a 100vh congelado/vivo)
      const cand = [...el.querySelectorAll("*")]
        .map((d) => {
          const rd = d.getBoundingClientRect();
          return { cid: d.getAttribute("data-cid"), h: Math.round(rd.height * 10) / 10, w: Math.round(rd.width), yRel: Math.round(rd.top - r.top) };
        })
        .filter((d) => Math.abs(d.h - JANELA.alvo) <= JANELA.tol);
      return { h: Math.round(r.height * 10) / 10, cand };
    }),
    { alvo: altura === 0 ? 0 : altura, tol: 6 } // no clone o alvo é a ALTURA CONGELADA, passada depois
  );
  await p.close();
  return dados;
}

// no clone o candidato tem altura = alturaDaCaptura (desconhecida a priori);
// então a coleta do clone traz TODOS os descendentes com altura entre 500 e
// 1400 e filtra-se depois
async function medirClone(rota) {
  const p = await nav.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(new URL(rota, CLONE).href, { waitUntil: "load", timeout: 60000 });
  await p.waitForTimeout(1000);
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 35)); }
    scrollTo(0, 0);
  });
  await p.waitForTimeout(700);
  const dados = await p.evaluate(() =>
    [...document.querySelectorAll("section")].map((el) => {
      const r = el.getBoundingClientRect();
      const cand = [...el.querySelectorAll("[data-cid]")]
        .map((d) => {
          const rd = d.getBoundingClientRect();
          return { cid: d.getAttribute("data-cid"), h: Math.round(rd.height * 10) / 10, w: Math.round(rd.width), yRel: Math.round(rd.top - r.top) };
        })
        .filter((d) => d.h >= 500 && d.h <= 1400);
      return { h: Math.round(r.height * 10) / 10, cid: el.getAttribute("data-cid"), cand };
    })
  );
  await p.close();
  return dados;
}

const relatorio = [];
let totalRegras = 0;

for (const rota of rotas) {
  const [o700, o900, o1100, c] = [
    await medirSecoes(ORIGINAL, rota, 700),
    await medirSecoes(ORIGINAL, rota, 900),
    await medirSecoes(ORIGINAL, rota, 1100),
    await medirClone(rota),
  ];
  if (o900.length !== c.length) {
    console.log(`⚠️ ${rota}: contagem de <section> difere (orig ${o900.length} × clone ${c.length}) — rota DECLARADA e pulada`);
    relatorio.push({ rota, status: "contagem-diverge" });
    continue;
  }
  const regras = [];
  for (let i = 0; i < o900.length; i++) {
    const dh = c[i].h - o900[i].h;
    if (Math.abs(dh) <= TOL) continue;
    const incl1 = Math.abs(o900[i].h - o700[i].h - 200) <= TOL && Math.abs(o1100[i].h - o900[i].h - 200) <= TOL;
    if (!incl1) {
      relatorio.push({ rota, secao: i, dh, status: "inclinacao-nao-e-1", alturas: [o700[i].h, o900[i].h, o1100[i].h] });
      continue;
    }
    const capturaH = 900 + dh; // ex.: dh=-100 -> congelado em 800
    // o descendente congelado: altura == capturaH no clone; o par no original
    // (mesma largura ±4, mesmo yRel ±30) mede 900 na janela 900 e 700 na 700
    const congelados = c[i].cand.filter((d) => Math.abs(d.h - capturaH) <= 3);
    let escrito = false;
    for (const d of congelados) {
      // yRel a ±120: é DESAMBIGUADOR, não prova — a prova é a lei (h=900 e
      // h=700 nas duas janelas, mesma largura). Rodada iterativa desloca os
      // filhos de um pai já consertado (~50px de justify-center) e ±40 os
      // perdia, travando o conserto da pilha na segunda passada.
      const par900 = o900[i].cand.find((x) => Math.abs(x.w - d.w) <= 4 && Math.abs(x.yRel - d.yRel) <= 120 && Math.abs(x.h - 900) <= 3);
      const par700 = o700[i].cand.find((x) => Math.abs(x.w - d.w) <= 4 && Math.abs(x.h - 700) <= 3);
      if (par900 && par700 && d.cid) {
        regras.push({ secao: i, cid: d.cid, de: d.h, lei: "100vh", dh });
        escrito = true;
        // sem break: widget de página cheia é uma PILHA de irmãos congelados
        // (medido no framer-2: wrappers + 2 IMG + alça, todos em 800) — cada
        // um que passa a lei no par original entra; o teto MAX_REGRAS guarda
      }
    }
    // a PRÓPRIA seção pode ser o congelado (hero 100vh puro: h_clone == capturaH
    // e h_orig == janela nas três medições — medido no framer-2)
    if (!escrito && c[i].cid && Math.abs(c[i].h - capturaH) <= 3 && Math.abs(o900[i].h - 900) <= 3 && Math.abs(o700[i].h - 700) <= 3 && Math.abs(o1100[i].h - 1100) <= 3) {
      regras.push({ secao: i, cid: c[i].cid, de: c[i].h, lei: "100vh (a própria seção)", dh });
      escrito = true;
    }
    // 🚨 A CAIXA DA SEÇÃO também sai congelada (medido: soltar o filho para
    // 100vh não moveu a seção — ela estava fixa em a+800px por conta própria).
    // Seção afim ganha height: calc(a·px + 100vh), com o a MEDIDO (o900 - 900).
    const a = Math.round((o900[i].h - 900) * 10) / 10;
    // a lei da CAIXA é provada pelas três janelas (inclinação 1) por si só —
    // vale mesmo quando nenhum descendente novo casou nesta rodada (medido:
    // seção 7 ficou com o filho já consertado em rodada anterior e a caixa
    // presa, e o calc condicionado a `escrito` nunca chegava nela)
    if (a > 3 && c[i].cid) {
      regras.push({ secao: i, cid: c[i].cid, de: c[i].h, lei: `calc(${a}px + 100vh)`, dh, css: `height: calc(${a}px + 100vh) !important;` });
      escrito = true;
    }
    if (!escrito) relatorio.push({ rota, secao: i, dh, status: "sem-descendente-que-explique", congelados: congelados.map((x) => x.cid) });
  }
  if (regras.length > MAX_REGRAS) {
    console.log(`⚠️ ${rota}: ${regras.length} regras > teto ${MAX_REGRAS} — nada escrito, tudo declarado`);
    relatorio.push({ rota, status: "acima-do-teto", regras });
    continue;
  }
  if (regras.length && ESCREVER) {
    const arq = join(APP, "src", "app", ...rota.split("/").filter(Boolean), "geometria.css");
    const marcador = "/* == corrige-vh-afim == */";
    // !important de propósito: o valor congelado vem de classe utilitária do
    // próprio clone (ex.: h-200 = 800px) com a MESMA especificidade — sem
    // !important a ordem do bundle decide, e ela não é decisão de ninguém
    let atual = existsSync(arq) ? readFileSync(arq, "utf8") : "";
    if (atual.includes(marcador)) {
      // 🚨 O bloco ACUMULA, não se reescreve (lição do corrige-geometria):
      // seção já corrigida não é re-proposta na rodada seguinte, e regenerar o
      // bloco do zero APAGARIA a regra dela — a regressão disfarçada de rodada
      // limpa. Regras antigas entram na união, por cid.
      const ini = atual.indexOf(marcador);
      const fimBloco = atual.indexOf("}\n", atual.indexOf("@media", ini));
      const antigo = atual.slice(ini, fimBloco + 2);
      for (const m of antigo.matchAll(/\[data-cid="([^"]+)"\][^\n]*/g)) {
        const cidVelho = m[1];
        if (!regras.some((r) => r.cid === cidVelho)) regras.push({ cid: cidVelho, herdada: true, linha: m[0] });
      }
      atual = atual.slice(0, atual.lastIndexOf("\n", ini)) + atual.slice(fimBloco + 2);
      writeFileSync(arq, atual);
    }
    const blocoFinal =
      `\n${marcador}\n/* medido em 700/900/1100: seção afim (h = a + 100vh); captura congelou ${900 + (regras.find((r) => !r.herdada)?.dh ?? -100)}px */\n` +
      `@media (min-width: 1024px) {\n` +
      regras.map((r) => r.herdada ? `  ${r.linha}` : `  [data-cid="${r.cid}"] { ${r.css ?? "height: 100vh !important;"} } /* seção ${r.secao}: era ${r.de}px, Δ=${r.dh}px */`).join("\n") +
      `\n}\n`;
    appendFileSync(arq, blocoFinal);
    console.log(`✅ ${rota}: ${regras.length} regra(s) -> ${arq}`);
    totalRegras += regras.length;
    relatorio.push({ rota, status: "escrito", regras });
  } else if (regras.length) {
    console.log(`(simulação) ${rota}: escreveria ${regras.length} regra(s)`);
    relatorio.push({ rota, status: "simulado", regras });
  }
}

writeFileSync(join(SAIDA, "vh-afim.json"), JSON.stringify(relatorio, null, 2));
console.log(`\nTOTAL: ${totalRegras} regra(s) escritas · relatório -> ${join(SAIDA, "vh-afim.json")}`);
await nav.close();
