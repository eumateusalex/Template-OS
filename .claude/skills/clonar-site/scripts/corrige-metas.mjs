// corrige-metas.mjs — devolve a cada rota a metadata que ela perdeu.
//
// O defeito, medido no site-exemplo: o ditto declara metadata SÓ no
// `src/app/layout.tsx` raiz. As 21 rotas herdam título, descrição, OpenGraph e
// — o pior — `canonical: "/"`. Ou seja, todo post do blog declara ser a home.
//
// Este instrumento colhe a metadata REAL de cada rota no original e escreve um
// `export const metadata` na `page.tsx` correspondente. É idempotente: rodar
// de novo substitui o bloco em vez de empilhar.
//
// ⚠️ Só roda em página que seja SERVER component. Página com "use client" não
// pode exportar metadata no Next, e é pulada com aviso — nunca em silêncio.
//
// Uso:
//   ORIGINAL=https://site.com APP=<pasta>/app ROTAS=./rotas.json node corrige-metas.mjs
//
// Variáveis:
//   ORIGINAL  URL base do original (obrigatória)
//   APP       raiz do app gerado, a que contém src/app (obrigatória)
//   ROTAS     rotas.json do levanta-rotas.mjs, OU lista separada por vírgula
//   ESCREVER  "0" para só relatar, sem tocar em arquivo (padrão: escreve)

import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const ORIGINAL = process.env.ORIGINAL;
const APP = process.env.APP;
if (!ORIGINAL || !APP) {
  console.error("faltam ORIGINAL e/ou APP");
  process.exit(1);
}
const ESCREVER = process.env.ESCREVER !== "0";
const RAIZ_APP = resolve(APP);

function carregarRotas() {
  const r = process.env.ROTAS;
  if (!r) {
    console.error("falta ROTAS");
    process.exit(1);
  }
  // ⚠️ Tem que ser ARQUIVO, nao so "existe": ROTAS="/" e um caminho que
  // EXISTE (a raiz do disco), e o readFileSync estoura com EISDIR.
  if (existsSync(r) && statSync(r).isFile()) {
    const j = JSON.parse(readFileSync(r, "utf8"));
    return j.rotas.filter((x) => x.status === 200 || x.status === null).map((x) => x.rota);
  }
  return r.split(",").map((s) => s.trim()).filter(Boolean);
}

function pegar(html, re) {
  const m = html.match(re);
  return m ? m[1].replace(/\s+/g, " ").trim() : null;
}

function decodificar(s) {
  if (s === null) return null;
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&#x27;/gi, "'")
    .replace(/&nbsp;/g, " ");
}

// ⚠️ O valor tem que ser lido até a MESMA aspa que abriu, via backreference.
// Aceitar `["']` nas duas pontas e excluir os dois no meio (`[^"']*`) trunca
// em silêncio no primeiro apóstrofo do texto: `Built with Framer's CMS` virava
// `Built with Framer`. O corte não dá erro e a descrição sai pela metade.
const VALOR = `(["'])((?:(?!\\1).)*)\\1`;

function meta(html, chave, tipo = "name") {
  const esc = chave.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // O atributo pode vir antes ou depois do content.
  const a = html.match(new RegExp(`<meta[^>]*${tipo}=["']${esc}["'][^>]*content=${VALOR}`, "i"));
  if (a) return decodificar(a[2].replace(/\s+/g, " ").trim());
  const b = html.match(new RegExp(`<meta[^>]*content=${VALOR}[^>]*${tipo}=["']${esc}["']`, "i"));
  if (b) return decodificar(b[2].replace(/\s+/g, " ").trim());
  return null;
}

// 🚨 A rota vem PERCENT-ENCODED (é assim que ela existe no original), mas a
// pasta no disco tem o caractere literal. Sem decodificar, toda rota com
// acento ou unicode some do casamento e sai como "não foi clonada".
// Medido no framer-7: /blog/...director%E2%80%99s-... existia no disco como
// ...director’s-... e o instrumento declarou a rota inteira como ausente.
function decodificarSegmento(s) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s; // encoding malformado: seguir com o cru, nunca derrubar o instrumento
  }
}

function caminhoDaPage(rota) {
  const rel = rota === "/" ? "" : rota.replace(/^\//, "");
  const partes = rel ? rel.split("/").map(decodificarSegmento) : [];
  return join(RAIZ_APP, "src", "app", ...partes, "page.tsx");
}

const rotas = carregarRotas();
const feitos = [];
const pulados = [];

for (const rota of rotas) {
  const arquivo = caminhoDaPage(rota);
  if (!existsSync(arquivo)) {
    pulados.push({ rota, motivo: "page.tsx não existe (rota não foi clonada?)" });
    continue;
  }

  let html;
  try {
    const r = await fetch(new URL(rota, ORIGINAL).href, { redirect: "follow" });
    html = await r.text();
  } catch (e) {
    pulados.push({ rota, motivo: "não consegui ler o original: " + String(e.message ?? e).slice(0, 120) });
    continue;
  }

  const dados = {
    title: decodificar(pegar(html, /<title[^>]*>([\s\S]*?)<\/title>/i)),
    description: meta(html, "description"),
    canonical: rota,
    ogTitle: meta(html, "og:title", "property") ?? meta(html, "og:title"),
    ogDescription: meta(html, "og:description", "property") ?? meta(html, "og:description"),
    ogImage: meta(html, "og:image", "property") ?? meta(html, "og:image"),
    ogType: meta(html, "og:type", "property") ?? meta(html, "og:type"),
  };

  if (!dados.title) {
    pulados.push({ rota, motivo: "original não tem <title>" });
    continue;
  }

  const fonte = readFileSync(arquivo, "utf8");
  if (/^\s*["']use client["']/m.test(fonte)) {
    pulados.push({ rota, motivo: "page é client component — Next não aceita metadata aqui" });
    continue;
  }

  const objeto = {
    title: dados.title,
    ...(dados.description ? { description: dados.description } : {}),
    alternates: { canonical: dados.canonical },
    ...(dados.ogTitle || dados.ogDescription || dados.ogImage
      ? {
          openGraph: {
            ...(dados.ogTitle ? { title: dados.ogTitle } : {}),
            ...(dados.ogDescription ? { description: dados.ogDescription } : {}),
            ...(dados.ogImage ? { images: [dados.ogImage] } : {}),
            ...(dados.ogType ? { type: dados.ogType } : {}),
            url: dados.canonical,
          },
        }
      : {}),
  };

  // ⚠️ JSON.stringify e concatenação, NUNCA String.replace com o texto no
  // padrão de substituição: `$1`, `$&` e `$'` dentro de uma descrição viram
  // referência de captura e corrompem o arquivo em silêncio.
  const bloco =
    "// metadata colhida do original por scripts/corrige-metas.mjs\n" +
    "export const metadata = " +
    JSON.stringify(objeto, null, 2) +
    ";\n";

  const MARCA_INI = "// metadata colhida do original por scripts/corrige-metas.mjs";
  let novo;
  const jaTem = fonte.indexOf(MARCA_INI);
  if (jaTem !== -1) {
    // Idempotência: troca o bloco anterior inteiro (até o `;` da linha final).
    const depois = fonte.indexOf("\n};\n", jaTem);
    const fim = depois === -1 ? fonte.indexOf("\n", jaTem) : depois + 4;
    novo = fonte.slice(0, jaTem) + bloco + fonte.slice(fim);
  } else {
    // Entrar DEPOIS dos imports e antes do componente.
    const alvo = fonte.search(/^export default function/m);
    if (alvo === -1) {
      pulados.push({ rota, motivo: "não achei `export default function` na page" });
      continue;
    }
    novo = fonte.slice(0, alvo) + bloco + "\n" + fonte.slice(alvo);
  }

  if (ESCREVER) writeFileSync(arquivo, novo, "utf8");
  feitos.push({ rota, titulo: dados.title });
  console.log(`  ${ESCREVER ? "escrito" : "simulado"}  ${rota}\n            ${dados.title}`);
}

console.log(`\nmetadata: ${feitos.length} rota(s) corrigida(s)${ESCREVER ? "" : " (SIMULAÇÃO, nada foi escrito)"}`);
if (pulados.length) {
  console.log(`⚠️ ${pulados.length} pulada(s) — cada uma com motivo, nunca em silêncio:`);
  for (const p of pulados) console.log(`   ${p.rota}: ${p.motivo}`);
}
