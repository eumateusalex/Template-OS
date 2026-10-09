// A UMA regra de "endereço de post" da skill: quem troca (guarda-bruto.mjs, escreve-fontes.mjs) e quem
// confere (scripts/confere-biblioteca.mjs) importam daqui. A skill nunca guarda endereço de post: o
// cabeçalho da fonte traz o id e o perfil, e o endereço se remonta deles só na hora de abrir o navegador.
//
// Pega, com ou sem https://, com www. ou mobile.:
//   - x.com ou twitter.com seguido de <handle>/, i/web/ ou i/ e de status/<dígitos> ou statuses/<dígitos>
//     (o resto do caminho e a query, como /photo/1 ou ?s=20, saem junto);
//   - a forma encurtada que o X exibe no texto: o mesmo começo cortado em qualquer ponto de "status/…"
//     e terminado em reticência (… ou ...);
//   - post do LinkedIn (o domínio dele seguido de posts/ ou de feed/update/urn:li:).
// Não pega caminho que só começa com "s" (configurações, busca): só status, statuses ou o corte dele.
// O que vem depois para em espaço, aspas, barra invertida, parêntese, colchete ou sinal de menor/maior,
// para a troca funcionar dentro de texto JSON e de Markdown.

const FIM = String.raw`[^\s"'\\()\[\]<>]*`;
const X = String.raw`(?:https?:\/\/)?(?:www\.|mobile\.)?(?:x|twitter)\.com\/(?:i\/web\/|i\/|[A-Za-z0-9_]{1,15}\/)?`;
const INTEIRO = String.raw`status(?:es)?\/\d+` + FIM;
const CORTADO = String.raw`s(?:t(?:a(?:t(?:u(?:s(?:es)?)?)?)?)?)?(?:\/\d*)?(?:…|\.\.\.)`;
const LINKEDIN = String.raw`(?:https?:\/\/)?(?:[a-z]{2,3}\.|www\.)?linkedin\.com\/(?:posts\/|feed\/update\/urn:li:)` + FIM;

export const RE_POST = new RegExp(`${X}(?:${INTEIRO}|${CORTADO})|${LINKEDIN}`, 'gi');
export const TROCA = '(link de post)';

// troca todo endereço de post do texto; devolve o texto novo e quantas trocas fez
export function semEnderecoDePost(texto, por = TROCA) {
  let trocas = 0;
  const t = String(texto ?? '').replace(new RegExp(RE_POST.source, 'gi'), () => { trocas++; return por; });
  return { texto: t, trocas };
}
// os endereços de post que sobraram num texto (para a régua e para a recusa do guarda-bruto)
export const enderecosDePost = (texto) => [...String(texto ?? '').matchAll(new RegExp(RE_POST.source, 'gi'))].map((m) => m[0]);
