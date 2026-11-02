// A exceção por peça: técnica de profissional que bate com uma calibragem vira exceção por peça,
// e só a recusa do usuário barra.
//
// As réguas medem; quem decide a gravidade é este módulo. O que é CALIBRAGEM (um número ou um
// gosto de uma fonte só, de uma peça só, ou sem fonte) não reprova: avisa. A exceção escrita no
// plano.json da peça cala o aviso e fica no relatório como aceita:
//
//   "excecoes": [{ "regra": "parado", "cena": "S08", "motivo": "o silêncio antes do pico", "fonte": "a referência que pediu a pausa" }]
//
// A `cena` é opcional (sem ela vale para a peça toda) e o `trecho`, também opcional, restringe a
// exceção às mensagens que o contêm. O que é decisão ou recusa do usuário, ou limite técnico medido,
// continua reprovando, e nenhuma exceção cala: a régua marca o erro que vem de uma recusa da
// marca (`recusa: true`: o bounce e o elastic das curvas, o kicker e o contador do cromo).
//
// A lista de cada régua é o inventário das regras da /mograph, régua a régua.

import { readFileSync } from 'node:fs';
import { chamadoDireto } from './principal.mjs';

// as réguas inteiras que são calibragem; o relevo e a batida são do `simula_mix.py --contexto` e as
// faixas do `medir_ritmo.py --linguagem` (a /video), que mandam os avisos para cá pela linha de
// comando: a exceção escrita as cala como cala as daqui
export const CALIBRAGEM = new Set(['parado', 'transicoes', 'curvas', 'cromo', 'estimulo', 'importancia', 'cta', 'morph', 'relevo', 'batida', 'faixas']);
// as réguas que têm parte calibragem e parte regra firme: a mensagem calibrada vem marcada
// (`calibragem: true`) por quem a escreve (a zona: só a do destino sem número oficial, a
// `medida` "prudencia" ou "hipotese" do formatos.json da /video)
export const MISTAS = new Set(['oficio', 'transicao', 'zona', 'zoom']);
export const REGRAS_COM_EXCECAO = new Set([...CALIBRAGEM, ...MISTAS]);

const cobre = (ex, e) => ex.regra === e.regra
  && (!ex.cena || e.cena === ex.cena || new RegExp(`(^|[^A-Za-z0-9])${ex.cena}([^0-9]|$)`).test(e.msg))
  && (!ex.trecho || e.msg.includes(ex.trecho));

// as exceções do plano que valem: com regra e motivo; as outras entradas de `excecoes` (as de
// curva, `{ curva, onde, motivo }`, e a da morph, `{ transicao: 'morph', motivo }`) seguem com quem
// as lê
export function excecoesDoPlano(plano) {
  return (plano?.excecoes || []).filter((x) => x && x.regra);
}

// a conferência das exceções escritas: a regra existe e é calibragem, e o motivo está escrito
export function conferirExcecoes(plano) {
  const erros = [];
  for (const x of excecoesDoPlano(plano)) {
    const onde = `a exceção ${JSON.stringify({ regra: x.regra, cena: x.cena })}`;
    if (!REGRAS_COM_EXCECAO.has(x.regra)) erros.push({ regra: 'excecoes', msg: `${onde}: "${x.regra}" não aceita exceção (é decisão do usuário, limite técnico ou não existe); as que aceitam: ${[...REGRAS_COM_EXCECAO].join(', ')}` });
    if (!String(x.motivo || '').trim()) erros.push({ regra: 'excecoes', msg: `${onde}: sem o motivo; a exceção diz por que a peça sai da regra` });
  }
  return erros;
}

// a gravidade: { erros, avisos } de uma régua vira { erros, avisos, aceitos }
export function calibrar(r, plano) {
  const ex = excecoesDoPlano(plano).filter((x) => String(x.motivo || '').trim());
  const erros = [], avisos = [...(r.avisos || [])], aceitos = [...(r.aceitos || [])];
  for (const e of r.erros || []) {
    const calibragem = e.recusa !== true && (CALIBRAGEM.has(e.regra) || (MISTAS.has(e.regra) && e.calibragem === true));
    if (!calibragem) { erros.push(e); continue; }
    const x = ex.find((y) => cobre(y, e));
    if (x) aceitos.push({ ...e, motivo: x.motivo, fonte: x.fonte || '' });
    else avisos.push({ ...e, msg: `${e.msg} · calibragem: avisa; a exceção no plano.json ({ regra: "${e.regra}", cena, motivo }) a aceita` });
  }
  // o aviso que já era aviso também se cala com a exceção
  const restam = [];
  for (const a of avisos) {
    const calibragem = CALIBRAGEM.has(a.regra) || (MISTAS.has(a.regra) && a.calibragem === true);
    const x = calibragem && ex.find((y) => cobre(y, a));
    if (x) aceitos.push({ ...a, motivo: x.motivo, fonte: x.fonte || '' });
    else restam.push(a);
  }
  return { ...r, erros, avisos: restam, aceitos };
}

// a linha de comando, para as réguas que não são deste processo (as Python da /video):
//   node excecoes.mjs calibrar <plano.json>   # lê { erros, avisos } na entrada; devolve { erros, avisos, aceitos }
//   node excecoes.mjs conferir <plano.json>   # as exceções escritas; sai 1 com erro
if (chamadoDireto(import.meta.url)) {
  const [cmd, arq] = process.argv.slice(2);
  const plano = arq ? JSON.parse(readFileSync(arq, 'utf8')) : null;
  if (cmd === 'calibrar' && plano) {
    process.stdout.write(JSON.stringify(calibrar(JSON.parse(readFileSync(0, 'utf8') || '{}'), plano)));
  } else if (cmd === 'conferir' && plano) {
    const erros = conferirExcecoes(plano);
    for (const e of erros) console.log(`ERRO  [${e.regra}] ${e.msg}`);
    process.exitCode = erros.length ? 1 : 0;
  } else {
    console.error('uso: excecoes.mjs calibrar|conferir <plano.json>');
    process.exitCode = 2;
  }
}
