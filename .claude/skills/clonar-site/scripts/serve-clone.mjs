// serve-clone.mjs — serve o `out/` de um clone buildado, para medir.
//
// Por que não usar `next dev`: o app gerado é `output: "export"`, então o
// artefato real é o `out/` estático. Servir o estático mede o que seria
// publicado, e não paga o custo do dev server.
//
// Por que não usar um servidor de prateleira: aqui o cache vai DESLIGADO na
// origem (`no-store`). Build novo servido na mesma porta com HTML em cache é
// medição mentindo, e é uma mentira que parece bug de código.
//
// Resolução de rota: imita host estático comum — tenta o arquivo exato, depois
// `<rota>.html`, depois `<rota>/index.html`. Responde o header
// `X-Resolvido-Por` dizendo qual das três casou, para a medição saber se a
// rota só existe por causa do fallback.
//
// Uso:
//   RAIZ=<caminho>/app/out PORTA=8080 node serve-clone.mjs

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, resolve, normalize } from "node:path";

const RAIZ = resolve(process.env.RAIZ ?? "./out");
const PORTA = Number(process.env.PORTA ?? 8080);

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

async function arquivo(caminho) {
  try {
    const s = await stat(caminho);
    if (s.isFile()) return caminho;
  } catch {
    /* não existe */
  }
  return null;
}

/** Impede escapar da raiz por `../` no caminho pedido. */
function dentroDaRaiz(alvo) {
  const n = normalize(alvo);
  return n === RAIZ || n.startsWith(RAIZ + (process.platform === "win32" ? "\\" : "/"));
}

const servidor = createServer(async (req, res) => { // servidor-falso: serve a pasta de um clone de site de terceiro, dada por argumento, e não a raiz do workspace
  let pathname = "/";
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    /* caminho malformado cai no default */
  }
  if (pathname.endsWith("/") && pathname.length > 1) pathname = pathname.slice(0, -1);

  const bruto = join(RAIZ, pathname === "/" ? "/index.html" : pathname);
  let alvo = null;
  let modo = null;

  if (dentroDaRaiz(bruto)) {
    if ((alvo = await arquivo(bruto))) modo = "exato";
    else if ((alvo = await arquivo(bruto + ".html"))) modo = "sufixo-html";
    else if ((alvo = await arquivo(join(bruto, "index.html")))) modo = "index-html";
  }

  const cabecalho = {
    // 🚨 sem cache: é isto que impede build velho de ser medido como novo
    "cache-control": "no-store, no-cache, must-revalidate",
    pragma: "no-cache",
  };

  if (!alvo) {
    const pagina404 = await arquivo(join(RAIZ, "404.html"));
    const corpo = pagina404 ? await readFile(pagina404) : Buffer.from("404");
    res.writeHead(404, {
      ...cabecalho,
      "content-type": "text/html; charset=utf-8",
      "x-resolvido-por": "404",
    });
    res.end(corpo);
    return;
  }

  const corpo = await readFile(alvo);
  res.writeHead(200, {
    ...cabecalho,
    "content-type": TIPOS[extname(alvo).toLowerCase()] ?? "application/octet-stream",
    "x-resolvido-por": modo,
  });
  res.end(corpo);
});

// 🚨 Porta ocupada por OUTRO clone é a pior falha possível aqui: o servidor
// novo morre, o antigo continua respondendo 200, e a bateria inteira mede o
// site errado achando que mediu o certo. Medido no site-next: SEIS serve-clone de
// sessões anteriores vivos, um deles servindo outro clone na 8081 — a home
// devolve 200 e as rotas internas 404, e o diagnóstico vai parar no
// roteamento, que está correto.
servidor.on("error", (e) => {
  if (e.code === "EADDRINUSE") {
    console.error(`\n🚨 PORTA ${PORTA} JÁ OCUPADA — provavelmente por um serve-clone de outra sessão.`);
    console.error(`   NÃO MEÇA NADA até resolver: o que responder nessa porta é OUTRO clone.`);
    console.error(`   Windows:  Get-NetTCPConnection -LocalPort ${PORTA} -State Listen | %{ taskkill /PID $_.OwningProcess /T /F }`);
    console.error(`   ou escolha outra porta com PORTA=<n>.\n`);
    process.exit(2);
  }
  throw e;
});

servidor.listen(PORTA, "127.0.0.1", () => {
  console.log(`servindo ${RAIZ}`);
  console.log(`  http://127.0.0.1:${PORTA}`);
  console.log(`  cache desligado (no-store) · fallback .html e /index.html ativos`);
});
