// A régua do indice-videos.mjs: o registro bom passa; cada defeito plantado reprova; a lista de
// estilos bate com o estilos.md.
//   node teste-indice-videos.mjs
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { conferirRegistro, lerRegistros, indice, ESTILOS, veredito } from './indice-videos.mjs';

let testes = 0, falhas = 0;
const ok = (cond, msg) => { testes++; console.log(`${cond ? 'ok  ' : 'FALHA'} ${msg}`); if (!cond) falhas++; };
const tmp = mkdtempSync(join(tmpdir(), 'indice-'));
const bom = (estilo, tema, data) => ({ estilo, destino: 'reel', tema, data, duracao_s: 41.2, legenda: 'L1', skill: '/mograph', lufs: -14.1, pico_dbtp: -1.4,
  reguas: { parado: 'verde', zona: 'verde', cromo: 'verde' }, critico: { notas: [8, 9, 8], veredito: 'APROVA' }, arquivos: { final: 'final.mp4', capa: 'capa.png' } });
const peca = (nome, r) => { const p = join(tmp, nome); mkdirSync(p); writeFileSync(join(p, 'final.mp4'), ''); writeFileSync(join(p, 'capa.png'), ''); writeFileSync(join(p, 'RELATORIO.md'), ''); writeFileSync(join(p, 'LEGENDA.md'), ''); writeFileSync(join(p, 'registro.json'), JSON.stringify(r)); return p; };

const p1 = peca('motion-raio-x-2026-10-15', bom('motion', 'raio-x', '2026-10-15'));
ok(conferirRegistro(p1, bom('motion', 'raio-x', '2026-10-15')).length === 0, 'o registro bom passa');
const p2 = peca('falado-motion-site-no-ar-2026-10-16', bom('falado-motion', 'site-no-ar', '2026-10-16'));
ok(conferirRegistro(p2, bom('falado-motion', 'site-no-ar', '2026-10-16')).length === 0, 'o estilo com hífen (falado-motion) se lê inteiro pelo nome da pasta');

let r = bom('motion', 'raio-x', '2026-10-15'); delete r.lufs;
ok(conferirRegistro(p1, r).some((e) => /lufs/.test(e)), 'sem o volume medido reprova');
r = bom('reels', 'raio-x', '2026-10-15');
ok(conferirRegistro(p1, r).some((e) => /não está no mapa/.test(e)), 'estilo fora do mapa reprova');
r = bom('falado', 'raio-x', '2026-10-15');
ok(conferirRegistro(p1, r).some((e) => /a pasta diz "motion"/.test(e)), 'a pasta e o registro com estilos diferentes reprovam');
const p3 = peca('mograph-teste-2026-10-15', bom('motion', 'teste', '2026-10-15'));
ok(conferirRegistro(p3, bom('motion', 'teste', '2026-10-15')).some((e) => /não segue/.test(e)), 'a pasta com o nome antigo (mograph-...) reprova: o nome diz o estilo');
r = bom('motion', 'raio-x', '2026-10-15'); r.arquivos.sem_trilha = 'final-sem-trilha.mp4';
ok(conferirRegistro(p1, r).some((e) => /final-sem-trilha\.mp4/.test(e)), 'arquivo declarado que não está na pasta reprova');
// o relatório e a legenda com o nome certo: sem um deles reprova, e com outra caixa também
const p4 = peca('motion-sem-relatorio-2026-10-15', bom('motion', 'sem-relatorio', '2026-10-15'));
rmSync(join(p4, 'RELATORIO.md'));
ok(conferirRegistro(p4, bom('motion', 'sem-relatorio', '2026-10-15')).some((e) => /falta o RELATORIO\.md/.test(e)), 'a entrega sem o RELATORIO.md reprova');
writeFileSync(join(p4, 'relatorio.md'), '');
ok(conferirRegistro(p4, bom('motion', 'sem-relatorio', '2026-10-15')).some((e) => /outra caixa/.test(e)), 'o relatorio.md em minúscula reprova e diz o nome certo');
rmSync(p4, { recursive: true, force: true });
r = bom('motion', 'raio-x', '2026-10-15'); r.critico.notas = [8, 7, 9];
ok(conferirRegistro(p1, r).some((e) => /abaixo de 8/.test(e)), '"aprova" com nota 7 reprova');
r = bom('motion', 'raio-x', '2026-10-14');
ok(conferirRegistro(p1, r).some((e) => /data da pasta/.test(e)), 'a data do registro diferente da pasta reprova');

const md = indice(lerRegistros(tmp));
const linhas = md.split('\n').slice(2);
ok(linhas.length === 3 && linhas[0].startsWith('| 2026-10-16 | falado-motion'), `o índice lista as 3 pastas com registro, a mais nova primeiro (${linhas.length} linhas)`);
ok(md.includes('`motion-raio-x-2026-10-15/`') && md.includes('verde'), 'cada linha leva a pasta e o estado das réguas');

// a peça P sem post próprio (vinheta, bumper, laço) entrega só o MP4 e o relatório: sem a LEGENDA.md
// ela passa; o Reel sem a LEGENDA.md reprova
for (const [estilo, passa] of [['vinheta', true], ['bumper', true], ['laco', true], ['motion', false]]) {
  const nome = `${estilo}-abertura-2026-10-30`;
  const reg = { ...bom(estilo, 'abertura', '2026-10-30'), legenda: 'L0', arquivos: { final: 'final.mp4' } };
  const p = peca(nome, reg);
  rmSync(join(p, 'LEGENDA.md'));
  const erros = conferirRegistro(p, reg);
  ok(passa ? erros.length === 0 : erros.some((e) => /falta o LEGENDA\.md/.test(e)), `${estilo} sem a LEGENDA.md ${passa ? 'passa (só o MP4)' : 'reprova'}${erros.length && passa ? `: ${erros.join('; ')}` : ''}`);
  rmSync(p, { recursive: true, force: true });
}

// a lista de estilos do código é a do estilos.md (a tabela dos estilos e a das estruturas): um
// estilo novo no documento sem o código, ou o contrário, reprova aqui
const doc = readFileSync(new URL('../estilos.md', import.meta.url), 'utf8');
const codigos = (secao) => [...(doc.split(/^## /m).find((s) => s.startsWith(secao)) || '').matchAll(/^\| `([a-z-]+)` \|/gm)].map((m) => m[1]);
const iguais = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
ok(iguais(codigos('2 ·'), ESTILOS) && iguais(codigos('3 ·'), ESTILOS), `os estilos do código são os do estilos.md, nas duas tabelas (${codigos('2 ·').length} e ${codigos('3 ·').length})`);

// sem registro nenhum, nada foi medido: o resumo não pode dizer verde
ok(!/verde/.test(veredito(0, [])) && /nada a conferir/.test(veredito(0, [])), 'zero registros não diz verde: diz que não há entrega em andamento');
ok(veredito(2, []) === '2 registros: verde' && veredito(2, ['x']) === '2 registros: REPROVA', 'com registro, o resumo é verde ou REPROVA');

rmSync(tmp, { recursive: true, force: true });
console.log(`\n# tests ${testes}\n# fail ${falhas}`);
process.exitCode = falhas ? 1 : 0;
