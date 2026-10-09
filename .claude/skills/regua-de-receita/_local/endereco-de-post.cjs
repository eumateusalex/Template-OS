// A UNICA definicao de "endereco de post" da skill. Quem acusa (verificar.js, regra-de-fonte.cjs) e
// quem limpa (captura/escreve-textos.mjs) importam daqui; nenhum outro arquivo escreve a sua propria
// regex. CommonJS de proposito: o verificar.js e CJS, e os .mjs importam CJS sem custo.
//
// Casa, com ou sem https:// e com qualquer subdominio (www., mobile.):
//   permalink do X:     x.com/<perfil>/status/<id>, x.com/i/web/status/<id>, x.com/i/status/<id>,
//                       twitter.com/..., .../statuses/<id>, e o que vem depois (/photo/1, ?s=20);
//                       os espelhos (fixupx.com, vxtwitter.com) tambem
//   LinkedIn:           urn:li:activity|share|ugcPost:<id> (sozinho ou dentro de URL),
//                       linkedin.com/feed/update/<urn>, linkedin.com/posts/<slug>
// NAO casa: perfil (x.com/<perfil>, x.com/<perfil>/settings, linkedin.com/in/<perfil>) nem
// imagem (pbs.twimg.com, media.licdn.com).
//
// O resto do endereco para em espaco, aspas, parenteses, colchetes e na barra invertida (no JSON
// da captura, `\n` e texto: o endereco nao pode engolir a linha seguinte).

'use strict';

const RESTO = String.raw`[\w\-.~%=&+:/?#]*`;
const FONTE = [
  String.raw`(?:https?:\/\/)?(?:[\w-]+\.)*[\w-]*(?:x|twitter)\.com\/(?:i\/web\/|i\/)?\w*\/?status(?:es)?\/\d+(?:[\/?#]` + RESTO + ')?',
  String.raw`(?:https?:\/\/)?(?:[\w-]+\.)*linkedin\.com\/(?:posts|feed\/update)\/[\w\-.~%=&+:/?#]+`,
  String.raw`urn:li:(?:activity|share|ugcPost):\d+`,
].join('|');

// uma regex nova a cada uso (com /g, o lastIndex de uma regex compartilhada vaza entre chamadas)
const linkPost = () => new RegExp(FONTE, 'g');

// o id do post dentro do endereco: o ultimo numero longo (snowflake do X, URN do LinkedIn)
const idDoEndereco = (endereco) => (String(endereco).match(/\d{15,}/g) || []).pop() || '';

const enderecosDePost = (texto) => [...String(texto).matchAll(linkPost())].map((m) => m[0]);

// troca cada endereco por `post <id>` (ou pelo que `troca(id, endereco)` devolver)
const semEnderecoDePost = (texto, troca = (id) => (id ? `post ${id}` : '(endereço de post)')) =>
  String(texto).replace(linkPost(), (m) => troca(idDoEndereco(m), m));

module.exports = { linkPost, idDoEndereco, enderecosDePost, semEnderecoDePost };
