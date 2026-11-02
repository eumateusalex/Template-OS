// teste-regras-de-estado.mjs — prova as decisões do gera-interacao (hover) e do serve-clone (cache).
// Rodar: node --test .claude/skills/clonar-site/scripts/teste-regras-de-estado.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { valorDeHoverEntra, faixaDeHover, mediaDeHover, cabecalhoDeCache } from "./regras-de-estado.mjs";

test("hover: o none do sublinhado é o estado (link da página atual perde o sublinhado no hover)", () => {
  assert.equal(valorDeHoverEntra("textDecorationLine", "none"), true);
});

test("hover: o none que apagaria a base do clone continua fora", () => {
  for (const prop of ["transform", "filter", "boxShadow"]) assert.equal(valorDeHoverEntra(prop, "none"), false, prop);
  assert.equal(valorDeHoverEntra("color", ""), false);
  assert.equal(valorDeHoverEntra("color", undefined), false);
  assert.equal(valorDeHoverEntra("color", "rgb(0, 0, 0)"), true);
});

test("hover: sem FAIXA, vale em toda largura (o toque já fica de fora pelo pointer: fine)", () => {
  for (const largura of [375, 800, 1280]) {
    assert.equal(faixaDeHover({}, largura), "", String(largura));
    assert.equal(mediaDeHover(faixaDeHover({}, largura)), "@media (hover: hover) and (pointer: fine)");
  }
});

test("hover: FAIXA dada entra antes do ponteiro", () => {
  const f = faixaDeHover({ FAIXA: "(min-width: 992px)" }, 1280);
  assert.equal(mediaDeHover(f), "@media (min-width: 992px) and (hover: hover) and (pointer: fine)");
});

test("cache: arquivo com hash no nome guarda por um ano; o resto não guarda", () => {
  const imutavel = "public, max-age=31536000, immutable";
  assert.equal(cabecalhoDeCache("/_next/static/chunks/main-abc.js")["cache-control"], imutavel);
  assert.equal(cabecalhoDeCache("/media/3f9a1c2b7d4e.webp")["cache-control"], imutavel);
  for (const p of ["/", "/sobre", "/index.html", "/media/foto.webp", "/_next/image"]) {
    assert.match(cabecalhoDeCache(p)["cache-control"], /no-store/, p);
  }
});
