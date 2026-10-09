// A UNICA regra de fronteira da janela de captura de uma fonte do X, usada por todos os scripts e
// pelo roteiro:
//
//   um item esta na janela  <=>  segundosUTC(data do item) > segundosUTC(triado_ate)
//
// segundos inteiros em UTC, comparados como NUMERO, nunca como texto. Motivo: o X da a data
// com segundo inteiro (`...:01.000Z`), o snowflake do id da milissegundos (`...:01.096Z`) e o
// triado_ate e gravado sem fracao (`...:01Z`). Comparar texto ISO ou milissegundos poe o post da
// fronteira ora dentro, ora fora; truncar os dois lados no segundo e comparar numero acerta sempre.

import { readFileSync } from 'node:fs';

export const segundosUTC = (data) => {
  const ms = typeof data === 'number' ? data : Date.parse(data);
  if (!Number.isFinite(ms)) throw new Error(`data invalida: ${data}`);
  return Math.floor(ms / 1000);
};

// O UNICO decodificador de snowflake da skill (os scripts de captura e os testes importam daqui; o
// atualizar.md mostra a mesma formula, e o teste-captura.mjs confere que o numero e o mesmo).
// A skill e um pacote INDEPENDENTE: vai inteira para outro workspace e nao importa codigo de
// outra skill.
export const EPOCA_X = 1288834974657n;
export const msDoId = (id) => Number((BigInt(id) >> 22n) + EPOCA_X);
// data de um post do X pelo id (snowflake), ja truncada no segundo
export const segundosDoId = (id) => Math.floor(msDoId(id) / 1000);

// O fuso das datas de calendario (data de captura, carimbo da pasta): o campo
// `fuso` do cobertura.json, padrao -03:00 (Brasilia). A janela NAO usa fuso: e sempre UTC.
export const FUSO_PADRAO = '-03:00';
export function deslocamentoMs(fuso) {
  const m = /^([+-])(\d{2}):(\d{2})$/.exec(String(fuso));
  if (!m) throw new Error(`fuso inválido no cobertura.json: ${fuso} (formato +HH:MM ou -HH:MM)`);
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) * 60000;
}
export function fusoDaSkill() {
  const c = JSON.parse(readFileSync(new URL('../cobertura.json', import.meta.url), 'utf8'));
  return c.fuso || FUSO_PADRAO;
}
// AAAA-MM-DD no fuso dado
export const dataLocal = (ms, fuso) => new Date(ms + deslocamentoMs(fuso)).toISOString().slice(0, 10);
// AAAAMMDD-HHMM no fuso dado (nome da pasta da captura)
export const carimboLocal = (ms, fuso) => new Date(ms + deslocamentoMs(fuso)).toISOString().slice(0, 16).replace(/[-:]/g, '').replace('T', '-');

export const naJanela = (data, triadoAte) => !!data && segundosUTC(data) > segundosUTC(triadoAte);

// o formato em que o triado_ate se grava: ISO em UTC, segundo inteiro, sem fracao
export const isoSegundos = (seg) => new Date(seg * 1000).toISOString().replace('.000Z', 'Z');

// carimbo compacto para nome de arquivo: 20261002T230708Z
export const carimbo = (seg) => isoSegundos(seg).replace(/[-:]/g, '');
