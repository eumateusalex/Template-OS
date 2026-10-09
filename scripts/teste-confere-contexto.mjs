#!/usr/bin/env node
// Prova que o `confere-contexto.mjs` sabe REPROVAR.
//
// Monta uma casa de mentira numa pasta descartável, planta um defeito por vez e
// exige que o conferidor o encontre. Cada régua tem o par que prova que ela
// fica quieta quando o defeito não existe.
//
// Uso:  node scripts/teste-confere-contexto.mjs

import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { confereContexto } from './confere-contexto.mjs';

let passou = 0;
let falhou = 0;

function afirma(nome, condicao, detalhe = '') {
  if (condicao) {
    passou++;
    console.log(`  ok    ${nome}`);
  } else {
    falhou++;
    console.log(`  FALHOU ${nome}${detalhe ? ` · ${detalhe}` : ''}`);
  }
}

const LIMPO = {
  'CLAUDE.md': '# Casa\n\nRegra no presente. Ver `scripts/existe.mjs`.\n',
  '_memoria/README.md': '# Memória\n\nO contrato.\n\n## Termos aposentados\n\n- Plano Velho — saiu de linha\n\n## Como manter\n\nAssim.\n',
  '.claude/skills/boa/SKILL.md': '---\nname: boa\ndescription: Faz uma coisa boa. Use quando pedirem.\n---\n\nLê `referencias/guia.md` e roda `scripts/existe.mjs`.\n',
  '.claude/skills/boa/referencias/guia.md': 'guia\n',
  '.claude/agents/estudio/revisor.md': 'Lê `identidade/design-guide.md`.\n',
  'identidade/design-guide.md': 'roteador\n',
  'scripts/existe.mjs': '// lê a pasta e devolve a lista\n',
};

const pastas = [];

function casa(trocas = {}) {
  const raiz = mkdtempSync(join(tmpdir(), 'confere-contexto-'));
  pastas.push(raiz);
  for (const [caminho, texto] of Object.entries({ ...LIMPO, ...trocas })) {
    if (texto === null) continue;
    const alvo = join(raiz, caminho);
    mkdirSync(dirname(alvo), { recursive: true });
    writeFileSync(alvo, texto);
  }
  return raiz;
}

const roda = (trocas, opcoes = {}) => confereContexto(casa(trocas), { casaDoUsuario: join(tmpdir(), 'sem-casa-do-usuario'), ...opcoes });
const regras = (r) => r.achados.map((a) => a.regra);
const tem = (r, regra) => regras(r).includes(regra);

console.log('a casa limpa');
{
  const r = roda();
  afirma('a casa limpa sai sem achado', r.achados.length === 0, JSON.stringify(r.achados));
}

console.log('teto');
{
  afirma('CLAUDE.md acima do teto reprova', tem(roda({}, { teto: 10 }), 'teto'));
  afirma('CLAUDE.md abaixo do teto passa', !tem(roda({}, { teto: 10000 }), 'teto'));
}

console.log('caminho');
{
  afirma('caminho que não existe reprova', tem(roda({ 'CLAUDE.md': '# C\n\nVer `scripts/nao-existe.mjs`.\n' }), 'caminho'));
  afirma('caminho relativo à pasta do documento passa', !tem(roda(), 'caminho'));
  afirma('caminho futuro na própria linha passa',
    !tem(roda({ 'CLAUDE.md': '# C\n\nGrava `saidas/x.md` <!-- caminho futuro: nasce no uso -->\n' }), 'caminho'));
  afirma('caminho futuro na linha de cima NÃO isenta',
    tem(roda({ 'CLAUDE.md': '# C\n\n- a <!-- caminho futuro: nasce no uso -->\n- `saidas/y.md`\n' }), 'caminho'));
  afirma('molde com <nome> não se confere', !tem(roda({ 'CLAUDE.md': '# C\n\nVer `clientes/<nome>/CLAUDE.md`.\n' }), 'caminho'));
  afirma('caminho num módulo de primeiro nível da skill se confere',
    tem(roda({ '.claude/skills/boa/modo.md': 'Grava em `saidas/sumiu.md`.\n' }), 'caminho'));
  afirma('o .env e o arquivo pessoal que o Git ignora não reprovam',
    !tem(roda({ 'CLAUDE.md': '# C\n\nA chave mora em `scripts/.env`, e a da conta em `scripts/.env.loja`; a lista em `.claude/skills/seguranca/nomes.local.json`.\n' }), 'caminho'));
  afirma('a pasta que nasce no projeto alvo (docs/adr, docs/decisoes) não reprova',
    !tem(roda({ 'CLAUDE.md': '# C\n\nO /grill grava em `docs/adr/` e em `docs/decisoes/` do projeto.\n' }), 'caminho'));
  afirma('outra pasta de docs/ continua conferida',
    tem(roda({ 'CLAUDE.md': '# C\n\nVer `docs/regras.md`.\n' }), 'caminho'));
  afirma('outro arquivo com nome parecido continua conferido',
    tem(roda({ 'CLAUDE.md': '# C\n\nVer `scripts/.envio.mjs`.\n' }), 'caminho'));
  afirma('caminho na memória também se confere', tem(roda({ '_memoria/empresa.md': '# E\n\nVer `scripts/sumiu.mjs`.\n' }), 'caminho'));
}

console.log('descricao');
{
  const longa = 'x'.repeat(460);
  afirma('descrição acima do teto reprova', tem(roda({ '.claude/skills/boa/SKILL.md': `---\nname: boa\ndescription: ${longa}\n---\n\ncorpo\n` }), 'descricao'));
  afirma('descrição em bloco acima do teto reprova',
    tem(roda({ '.claude/skills/boa/SKILL.md': `---\nname: boa\ndescription: >\n  ${longa}\n---\n\ncorpo\n` }), 'descricao'));
}

console.log('termo');
{
  afirma('termo aposentado num SKILL.md reprova', tem(roda({ '.claude/skills/boa/SKILL.md': '---\nname: boa\ndescription: x\n---\n\nVende o Plano Velho.\n' }), 'termo'));
  afirma('termo aposentado quebrado entre linhas reprova', tem(roda({ 'CLAUDE.md': '# C\n\nO Plano\nVelho.\n' }), 'termo'));
  afirma('termo com a marca na linha de cima passa',
    !tem(roda({ 'CLAUDE.md': '# C\n\n<!-- termo aposentado: a lista do que não se escreve -->\nPlano Velho\n' }), 'termo'));
  afirma('termo dentro de outra palavra não casa', !tem(roda({ 'CLAUDE.md': '# C\n\nO SuperPlano Velhote.\n' }), 'termo'));
  afirma('termo colado a uma letra antes não casa', !tem(roda({ 'CLAUDE.md': '# C\n\nO SuperPlano Velho.\n' }), 'termo'));
  afirma('termo seguido de letra não casa', !tem(roda({ 'CLAUDE.md': '# C\n\nO Plano Velhote.\n' }), 'termo'));
}

console.log('diario');
{
  afirma('"nasceu em" no CLAUDE.md reprova', tem(roda({ 'CLAUDE.md': '# C\n\nA regra nasceu em março.\n' }), 'diario'));
  afirma('"era … até" com mais de 10 palavras no meio não casa',
    !tem(roda({ 'CLAUDE.md': '# C\n\nera ' + 'x '.repeat(11) + 'até ontem.\n' }), 'diario'));
  afirma('"nasceu depois" num SKILL.md reprova',
    tem(roda({ '.claude/skills/boa/SKILL.md': '---\nname: boa\ndescription: x\n---\n\nA regra nasceu depois de um erro.\n' }), 'diario'));
  afirma('"era … até" quebrado entre linhas reprova', tem(roda({ 'CLAUDE.md': '# C\n\nO teto era\n10 até ontem.\n' }), 'diario'));
  afirma('"obra NNN" em comentário de código reprova', tem(roda({ 'scripts/existe.mjs': '// conserto da obra 116\n' }), 'diario'));
  afirma('marcador fora de comentário, no código, não conta',
    !tem(roda({ 'scripts/existe.mjs': "const s = 'nasceu em casa';\n" }), 'diario'));
  afirma('data solta fora do CLAUDE.md não conta (é dado)',
    !tem(roda({ '.claude/skills/boa/referencias/guia.md': 'medido em 01/02/2026\n' }), 'diario'));
  afirma('"em DD/MM/AAAA" no CLAUDE.md reprova', tem(roda({ 'CLAUDE.md': '# C\n\nDecidido em 01/02/2026.\n' }), 'diario'));
  afirma('fixture fica fora do diário',
    !tem(roda({ 'scripts/fixtures/caso.md': 'a regra nasceu em março\n' }), 'diario'));
}

console.log('leitura');
{
  afirma('sem CLAUDE.md reprova', tem(roda({ 'CLAUDE.md': null }), 'leitura'));
  afirma('sem SKILL.md reprova', tem(roda({ '.claude/skills/boa/SKILL.md': null, '.claude/skills/boa/referencias/guia.md': null }), 'leitura'));
  afirma('sem agente reprova', tem(roda({ '.claude/agents/estudio/revisor.md': null }), 'leitura'));
  afirma('sem código reprova', tem(roda({ 'scripts/existe.mjs': null, 'CLAUDE.md': '# C\n\nRegra.\n', '.claude/skills/boa/SKILL.md': '---\nname: boa\ndescription: x\n---\n\nLê `referencias/guia.md`.\n' }), 'leitura'));
  afirma('sem _memoria reprova', tem(roda({ '_memoria/README.md': null }), 'leitura'));
}

console.log('caminho em ~/ e junção');
{
  const cita = { 'CLAUDE.md': '# C\n\nO link mora em `~/.claude/skills/remotion`.\n' };
  const semCasa = roda(cita);
  afirma('caminho em ~/ numa máquina sem ~/.claude fica como não conferido, sem achado',
    semCasa.naoConferidos.includes('~/.claude/skills/remotion') && !tem(semCasa, 'caminho'), JSON.stringify(semCasa));
  const casaDoUsuario = mkdtempSync(join(tmpdir(), 'casa-do-usuario-'));
  pastas.push(casaDoUsuario);
  mkdirSync(join(casaDoUsuario, '.claude'));
  afirma('caminho em ~/ que falta numa máquina com ~/.claude reprova', tem(roda(cita, { casaDoUsuario }), 'caminho'));
  // a skill que é junção para outro projeto não se confere daqui
  const fora = mkdtempSync(join(tmpdir(), 'projeto-de-fora-'));
  pastas.push(fora);
  writeFileSync(join(fora, 'SKILL.md'), '---\nname: fora\ndescription: x\n---\n\nVer `scripts/so-la.mjs`.\n');
  const raiz = casa();
  symlinkSync(fora, join(raiz, '.claude', 'skills', 'fora'), 'junction');
  const r = confereContexto(raiz, { casaDoUsuario: join(tmpdir(), 'sem-casa-do-usuario') });
  afirma('a skill que é junção para outro projeto fica de fora', !r.achados.some((a) => a.arquivo.includes('fora')), JSON.stringify(r.achados));
}

console.log('peça de terceiro (o contrato do manifesto)');
{
  // o manifesto de mentira: uma skill instalada inteira (com o roteador saindo
  // de molde) e um arquivo solto dentro de uma pasta que é da casa
  const manifesto = JSON.stringify({
    python: {},
    pecas: [
      { id: 'terceira', descricao: 'x', destino: '.claude/skills/terceira', inteira: true, fontes: { f: { url: 'https://exemplo/' } },
        arquivos: [{ para: 'SKILL.md', molde: 'terceira/SKILL.md', sha256: '0' }, { para: 'referencias/guia.md', de: 'guia.md', sha256: '0' }] },
      { id: 'icone', descricao: 'x', destino: '.claude/skills/boa/assets', inteira: false, fontes: { f: { url: 'https://exemplo/' } },
        arquivos: [{ para: 'icone.svg', de: 'icone.svg', sha256: '0' }] },
      { id: 'plugin', descricao: 'x', destino: '.claude/skills/boa/plugin', inteira: true, fontes: { f: { url: 'https://exemplo/' } },
        arquivos: [{ para: 'SKILL.md', de: 'SKILL.md', sha256: '0' }] },
    ],
  });
  const ROTEADOR = '---\nname: terceira\ndescription: Roteia. Use quando pedirem.\n---\n\nLê `referencias/guia.md`.\n';
  const comContrato = (trocas = {}) => roda({ 'scripts/terceiros/manifesto.json': manifesto, 'scripts/terceiros/moldes/terceira/SKILL.md': ROTEADOR, ...trocas });
  const cita = (c) => ({ 'CLAUDE.md': `# C\n\nVer \`${c}\`.\n` });
  const limpo = comContrato();
  afirma('com o contrato e nada instalado, a casa sai limpa', limpo.achados.length === 0, JSON.stringify(limpo.achados));
  afirma('arquivo que o instalador grava existe por contrato', !tem(comContrato(cita('.claude/skills/terceira/referencias/guia.md')), 'caminho'));
  afirma('a pasta que ele grava, e a que o caminho dele atravessa, também',
    !tem(comContrato(cita('.claude/skills/terceira/')), 'caminho') && !tem(comContrato(cita('.claude/skills/terceira/referencias/')), 'caminho'));
  afirma('o arquivo solto numa pasta da casa também', !tem(comContrato(cita('.claude/skills/boa/assets/icone.svg')), 'caminho'));
  afirma('arquivo que o manifesto não lista, dentro da pasta instalada, reprova',
    tem(comContrato(cita('.claude/skills/terceira/referencias/outro.md')), 'caminho'));
  afirma('sem o manifesto, o mesmo caminho reprova', tem(roda(cita('.claude/skills/terceira/referencias/guia.md')), 'caminho'));
  afirma('o que está instalado fica fora do diário',
    !tem(comContrato({ '.claude/skills/terceira/referencias/guia.md': 'a regra nasceu em março\n' }), 'diario'));
  afirma('o molde é da casa: diário no molde reprova',
    tem(comContrato({ 'scripts/terceiros/moldes/terceira/SKILL.md': `${ROTEADOR}\nA regra nasceu em março.\n` }), 'diario'));
  afirma('pasta com nome de peça (motion) que o manifesto não instala continua no diário',
    tem(comContrato({ '.claude/skills/boa/motion/nota.md': 'a regra nasceu em março\n' }), 'diario'));
  const pelaPorta = comContrato({ 'scripts/terceiros/moldes/terceira/SKILL.md': `---\nname: terceira\ndescription: ${'x'.repeat(460)}\n---\n\nRoda \`scripts/sumiu.mjs\`.\n` });
  afirma('o roteador que sai de molde se confere no molde, com o nome de onde vai morar',
    pelaPorta.achados.some((a) => a.regra === 'caminho' && a.arquivo === '.claude/skills/terceira/SKILL.md') &&
    pelaPorta.achados.some((a) => a.regra === 'descricao' && a.arquivo === '.claude/skills/terceira/SKILL.md'), JSON.stringify(pelaPorta.achados));
  afirma('o instalado no disco não se lê no lugar do molde',
    !tem(comContrato({ '.claude/skills/terceira/SKILL.md': '---\nname: terceira\ndescription: x\n---\n\nVer `scripts/sumiu.mjs`.\n' }), 'caminho'));
  afirma('o módulo que veio da fonte, instalado, não é documento da casa',
    !tem(comContrato({ '.claude/skills/terceira/modulo.md': 'Grava em `saidas/sumiu.md`.\n' }), 'caminho'));
  afirma('nem a pasta instalada dentro de uma skill da casa',
    !tem(comContrato({ '.claude/skills/boa/plugin/SKILL.md': `---\nname: p\ndescription: ${'x'.repeat(460)}\n---\n` }), 'descricao'));
}

for (const p of pastas) rmSync(p, { recursive: true, force: true });
console.log(`\n# tests ${passou + falhou}\n# pass ${passou}\n# fail ${falhou}`);
console.log(`${passou} passou, ${falhou} falhou`);
if (falhou) process.exit(1);
