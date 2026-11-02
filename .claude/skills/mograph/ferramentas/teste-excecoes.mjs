// A exceção por peça (excecoes.mjs): a calibragem avisa em vez de reprovar, a exceção escrita no
// plano a cala, e a regra firme (limite técnico) segue reprovando.
//   node teste-excecoes.mjs
import { calibrar, conferirExcecoes } from './excecoes.mjs';

let testes = 0, falhas = 0;
const ok = (cond, msg) => { testes++; console.log(`${cond ? 'ok  ' : 'FALHA'} ${msg}`); if (!cond) falhas++; };

const r = {
  erros: [
    { regra: 'parado', msg: 'S08: 1,2 s parado de 20,0 a 21,2 s' },
    { regra: 'zona', msg: 'S02: o texto sai da zona' },
    { regra: 'oficio', msg: 'S03: sem matéria' },
    { regra: 'oficio', msg: '2 tipos de efeito sonoro', calibragem: true },
    { regra: 'transicao', msg: 'o flash aparece 2 vezes', calibragem: true },
    { regra: 'transicao', msg: 'S04: no falado a transição "rodopio" não existe' }
  ],
  avisos: [{ regra: 'curvas', msg: 'S05: back.out sem o motivo' }]
};

// sem exceção: a calibragem avisa, a regra firme reprova
let c = calibrar(r, { excecoes: [] });
ok(c.erros.length === 3 && c.erros.every((e) => ['zona', 'oficio', 'transicao'].includes(e.regra)), `sem exceção, só a zona, a matéria e o vocabulário do motor reprovam (${c.erros.map((e) => e.regra).join(',')})`);
ok(c.avisos.some((a) => a.regra === 'parado') && c.avisos.some((a) => /efeito sonoro/.test(a.msg)) && c.avisos.some((a) => /flash/.test(a.msg)), 'o parado, o som e o flash viram aviso');
ok(c.aceitos.length === 0, 'nada aceito sem exceção');

// a exceção da cena cala só aquela cena
c = calibrar(r, { excecoes: [{ regra: 'parado', cena: 'S08', motivo: 'o silêncio antes do pico' }] });
ok(!c.avisos.some((a) => a.regra === 'parado') && c.aceitos.some((a) => a.regra === 'parado' && /silêncio/.test(a.motivo)), 'a exceção da S08 cala o parado da S08 e fica como aceita, com o motivo');
c = calibrar(r, { excecoes: [{ regra: 'parado', cena: 'S07', motivo: 'outra cena' }] });
ok(c.avisos.some((a) => a.regra === 'parado'), 'a exceção de outra cena não cala');
c = calibrar(r, { excecoes: [{ regra: 'parado', cena: 'S0', motivo: 'prefixo' }] });
ok(c.avisos.some((a) => a.regra === 'parado'), 'a cena "S0" não casa com a S08 (o id inteiro)');

// a exceção sem motivo não cala, e a conferência a reprova
c = calibrar(r, { excecoes: [{ regra: 'parado', cena: 'S08', motivo: '  ' }] });
ok(c.avisos.some((a) => a.regra === 'parado'), 'a exceção sem motivo não cala');
let e = conferirExcecoes({ excecoes: [{ regra: 'parado', motivo: '' }] });
ok(e.length === 1 && /sem o motivo/.test(e[0].msg), 'a conferência reprova a exceção sem motivo');

// a regra firme não aceita exceção: nem cala, nem passa na conferência
c = calibrar(r, { excecoes: [{ regra: 'zona', motivo: 'quero' }] });
ok(c.erros.some((x) => x.regra === 'zona'), 'a exceção não cala a zona (limite técnico)');
e = conferirExcecoes({ excecoes: [{ regra: 'tela', motivo: 'quero' }, { regra: 'recusados', motivo: 'quero' }] });
ok(e.length === 2 && e.every((x) => /não aceita exceção/.test(x.msg)), 'a conferência reprova exceção para o tempo de leitura e para os recusados');
// a zona do destino sem número oficial é calibragem; a do Reel e a do anúncio, não
c = calibrar({ erros: [{ regra: 'zona', msg: 'o texto em 2,0 s fora da zona de yt-16x9', calibragem: true }], avisos: [] }, { excecoes: [] });
ok(c.erros.length === 0 && c.avisos.length === 1, 'a zona de hipótese (o 16:9) avisa');

// a mista: só a mensagem marcada aceita exceção
c = calibrar(r, { excecoes: [{ regra: 'oficio', motivo: 'peça com som mínimo de propósito' }] });
ok(c.erros.some((x) => x.regra === 'oficio' && /matéria/.test(x.msg)) && c.aceitos.some((x) => /efeito sonoro/.test(x.msg)), 'na régua mista, a exceção cala o som (calibragem) e não a matéria (a recusa do cru)');

// o aviso que já era aviso também se cala, e o trecho restringe
c = calibrar(r, { excecoes: [{ regra: 'curvas', cena: 'S05', motivo: 'o objeto que pousa' }] });
ok(!c.avisos.some((a) => a.regra === 'curvas') && c.aceitos.some((a) => a.regra === 'curvas'), 'o aviso de curva da S05 se cala com a exceção');
c = calibrar(r, { excecoes: [{ regra: 'transicao', trecho: 'flash', motivo: 'um flash por ato' }] });
ok(c.aceitos.some((a) => /flash/.test(a.msg)) && c.erros.some((x) => /rodopio/.test(x.msg)), 'o trecho cala o flash e não o vocabulário do motor');
// a recusa da marca (recusa: true) segue erro numa régua de calibragem, e a exceção não a cala
const recusada = { erros: [{ regra: 'curvas', msg: 'cenas/S05.js: "elastic" é curva que a marca recusa', recusa: true }, { regra: 'cromo', msg: '"Google" acima do título · a marca recusa "kicker"', recusa: true }, { regra: 'cromo', msg: '"Marca" preso em 3 cenas (S01, S02, S03)' }], avisos: [] };
c = calibrar(recusada, { excecoes: [{ regra: 'curvas', cena: 'S05', motivo: 'quero' }, { regra: 'cromo', motivo: 'quero' }] });
ok(c.erros.length === 2 && c.erros.every((x) => x.recusa === true) && c.aceitos.length === 1 && /preso/.test(c.aceitos[0].msg), `a recusa da marca segue erro e a exceção não a cala; o preso (calibragem) se cala (${c.erros.length} erros, ${c.aceitos.length} aceito)`);
c = calibrar(recusada, { excecoes: [] });
ok(c.erros.length === 2 && c.avisos.length === 1, 'sem exceção, a recusa segue erro e o preso vira aviso');
ok(conferirExcecoes({ excecoes: [{ curva: 'back.out', onde: 'S05', motivo: 'x' }, { transicao: 'morph', motivo: 'y' }] }).length === 0, 'as exceções antigas (de curva e de morph) seguem válidas');

console.log(`\n# tests ${testes}\n# fail ${falhas}`);
process.exitCode = falhas ? 1 : 0;
