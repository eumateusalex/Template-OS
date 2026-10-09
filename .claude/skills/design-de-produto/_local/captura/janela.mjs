// A UMA regra de tempo da captura, usada por todos os scripts (e copiada, igual, nos trechos de
// navegador em modelos/, que não importam módulo):
//
//   todo instante vira SEGUNDOS INTEIROS em UTC (número) e se compara como número, nunca como texto.
//
// - O `datetime` do X vem em segundo inteiro ("2026-10-03T03:00:01.000Z"); o snowflake do id tem
//   milissegundos (03:00:01.096Z). Os dois viram o mesmo segundo: 1759460401.
// - A janela é EXCLUSIVA: entra o que é estritamente mais novo que `triado_ate` (em segundos).
// - O id da captura é o `triado_ate` que ela fecha, compacto: 2026-10-03T030001Z. É único por
//   construção (uma captura com conteúdo novo sempre fecha num segundo mais novo que a anterior) e
//   nomeia tudo o que a captura grava: o bruto, as seções "Captura <id>", o arquivo de janela, a
//   entrada do CHANGELOG e o rótulo do índice da galeria.
// - O decodificador do snowflake mora SÓ aqui (msDoId): nenhum outro arquivo da skill o reescreve.
// - Data de calendário (o dia de um post, o dia de hoje) sai no fuso do dono, lido do campo `fuso`
//   do cobertura.json (±HH:MM; padrão -03:00, Brasília). A janela continua em UTC: o fuso só muda o
//   dia que se escreve, nunca o que entra.

export const msDoId = (id) => Number((BigInt(id) >> 22n) + 1288834974657n);
export const seg = (iso) => Math.floor(Date.parse(iso) / 1000);
export const segDoId = (id) => Math.floor(msDoId(id) / 1000);
export const isoSeg = (s) => new Date(s * 1000).toISOString().replace('.000Z', 'Z');
export const idCaptura = (s) => isoSeg(s).replace(/[-:]/g, '').replace(/^(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
export const naJanela = (iso, desdeSeg) => !!iso && seg(iso) > desdeSeg;
export const RE_ID_CAPTURA = /\d{4}-\d{2}-\d{2}T\d{6}Z/;

export const FUSO_PADRAO = '-03:00';
export const RE_FUSO = /^([+-])(\d{2}):(\d{2})$/;
// o fuso do cobertura.json (objeto já lido); sem o campo, o padrão
export const fusoDe = (cobertura) => (cobertura && cobertura.fuso) || FUSO_PADRAO;
export function minutosDoFuso(fuso = FUSO_PADRAO) {
  const m = RE_FUSO.exec(fuso);
  if (!m || +m[2] > 14 || +m[3] > 59) throw new Error(`fuso fora do padrão ±HH:MM: ${fuso} (cobertura.json, campo fuso)`);
  return (m[1] === '-' ? -1 : 1) * (+m[2] * 60 + +m[3]);
}
// AAAA-MM-DD de um instante (ms) no fuso dado
export const diaNoFuso = (ms, fuso) => new Date(ms + minutosDoFuso(fuso) * 60e3).toISOString().slice(0, 10);
export const diaDoPost = (id, fuso) => diaNoFuso(msDoId(id), fuso);
