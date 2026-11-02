// regras-de-estado.mjs — as decisões puras que o gera-interacao e o serve-clone tomam, num lugar só
// para o teste-regras-de-estado.mjs prová-las sem abrir navegador nem servidor.

// Um valor de hover medido no original entra no CSS do clone?
// 🚨 "none" se descarta nas propriedades em que ele APAGARIA a base do clone (transform, filter,
// box-shadow), mas no sublinhado ele É o estado de hover: o link da página atual vai de `underline`
// para `none`. Descartar ali deixa o link perdendo a cor e mantendo o sublinhado.
export function valorDeHoverEntra(prop, valor) {
  if (valor === undefined || valor === "") return false;
  if (valor === "none" && prop !== "textDecorationLine") return false;
  return true;
}

// A faixa de largura em que o hover vale.
// 🚨 O que protege o toque é o (hover: hover) and (pointer: fine): no celular não existe ponteiro, e
// sem ele a regra gruda o estado de hover no primeiro toque. Faixa de LARGURA por cima disso tira o
// hover de quem tem mouse numa janela estreita (tablet com mouse, janela pela metade), e o original
// costuma ter hover em toda largura. Por padrão, sem faixa. FAIXA= só quando o original de fato muda o
// hover por largura, e aí o varre-hover nas outras larguras é que prova.
export function faixaDeHover(env) {
  return env.FAIXA ?? "";
}

export function mediaDeHover(faixa) {
  return `@media ${faixa ? faixa + " and " : ""}(hover: hover) and (pointer: fine)`;
}

// O cabeçalho de cache que o servidor de medição devolve para um caminho.
// 🚨 Sem cache: é isto que impede build velho de ser medido como novo. A exceção é o arquivo com o
// conteúdo no nome (/_next/static/ e o hash das mídias clonadas): build novo muda o nome, então guardar
// não mente. Sem ela, a navegação pelo clique baixa de novo cada imagem do cabeçalho, e a foto some
// ~600ms a cada troca de página, coisa que host nenhum de verdade faz.
export function cabecalhoDeCache(pathname) {
  const comHash = /^\/_next\/static\//.test(pathname) || /\/[0-9a-f]{10,}\.[a-z0-9]+$/i.test(pathname);
  return comHash
    ? { "cache-control": "public, max-age=31536000, immutable" }
    : { "cache-control": "no-store, no-cache, must-revalidate", pragma: "no-cache" };
}
