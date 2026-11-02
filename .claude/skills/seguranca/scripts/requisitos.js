#!/usr/bin/env node
/**
 * requisitos.js — consulta o catálogo de requisitos.
 *
 * É a barreira de contexto da skill: o catálogo nunca é lido inteiro. Filtra-se
 * por família, nível ou perfil detectado, e só o recorte volta.
 *
 * Uso:
 *   node requisitos.js --plano --perfil perfil.json  # O PLANO, antes de agir
 *   node requisitos.js --familia ACC
 *   node requisitos.js --familia ACC --nivel N2
 *   node requisitos.js --perfil perfil.json          # usa as famílias ativas
 *   node requisitos.js --id ACC-04                   # ficha completa de um
 *   node requisitos.js --severidade critica
 *   node requisitos.js --detector auth,banco         # projeto que ainda não existe
 *   node requisitos.js --verificacao A,B             # só o que roda sem autorização
 *   node requisitos.js --checklist --perfil perfil.json
 *   node requisitos.js --cobertura                   # lacunas contra as âncoras
 *   node requisitos.js --principios                  # a régua interna: os dez princípios
 *   node requisitos.js --resumo                      # o que existe no catálogo
 *   node requisitos.js --familias                    # o mapa: o que cada família cobre
 *
 * Modificadores:
 *   --completo   ficha inteira em vez do resumo de uma linha
 *   --json       saída em JSON
 *   --modo       nomeia o plano (auditoria, publicação); só muda o título
 */

'use strict';

const fs = require('fs');
const path = require('path');

const DADOS = path.join(__dirname, '..', 'dados');
const catalogo = JSON.parse(fs.readFileSync(path.join(DADOS, 'requisitos.json'), 'utf8'));
const ancoras = JSON.parse(fs.readFileSync(path.join(DADOS, 'ancoras.json'), 'utf8'));
const principios = JSON.parse(fs.readFileSync(path.join(DADOS, 'principios.json'), 'utf8'));

// Os nomes que o container de itens de uma âncora pode ter em ancoras.json.
// É lista fechada de propósito, e a D9 do verificador cobra que ninguém saia
// dela: âncora com um sétimo nome viraria objeto vazio e passaria MUDA — sem
// aparecer no --cobertura e sem reprovar em lugar nenhum. Mora só aqui: o
// verifica.js a lê daqui, sem cópia.
const CONTAINERES_DE_ANCORA = [
  'itens', 'funcoes', 'grupos', 'temas', 'capitulos_por_assunto', 'assuntos',
];

/** Devolve o mapa de itens de uma âncora, seja qual for o nome do container. */
function itensDaAncora(dados) {
  for (const c of CONTAINERES_DE_ANCORA) {
    if (dados && dados[c]) return dados[c];
  }
  return {};
}

/** As famílias de um item de âncora, nas duas formas que o arquivo aceita. */
function familiasDoItem(valor) {
  return Array.isArray(valor) ? valor : (valor && valor.familias) || [];
}

const ORDEM_NIVEL = { N1: 1, N2: 2, N3: 3 };
const ORDEM_SEV = { critica: 0, alta: 1, media: 2, baixa: 3 };

function args() {
  const a = process.argv.slice(2);
  const o = { flags: new Set() };
  for (let i = 0; i < a.length; i++) {
    if (!a[i].startsWith('--')) continue;
    const chave = a[i].slice(2);
    const prox = a[i + 1];
    if (prox && !prox.startsWith('--')) { o[chave] = prox; i++; }
    else o.flags.add(chave);
  }
  return o;
}

function familiaDe(id) { return id.split('-')[0]; }

function familiasNoCatalogo() {
  return [...new Set(catalogo.requisitos.map(r => familiaDe(r.id)))].sort();
}

/** Nível é cumulativo: pedir N2 traz N1 e N2, porque N2 exige tudo de N1. */
function filtrar(opts) {
  let r = catalogo.requisitos;
  if (opts.familia) {
    const fams = opts.familia.split(',').map(f => f.trim().toUpperCase());
    r = r.filter(q => fams.includes(familiaDe(q.id)));
  }
  if (opts.nivel) {
    const teto = ORDEM_NIVEL[opts.nivel.toUpperCase()] || 3;
    r = r.filter(q => ORDEM_NIVEL[q.nivel] <= teto);
  }
  if (opts.severidade) {
    const sevs = opts.severidade.split(',').map(s => s.trim().toLowerCase());
    r = r.filter(q => sevs.includes(q.severidadeSeAusente));
  }
  if (opts.detector) {
    const ds = opts.detector.split(',').map(d => d.trim());
    r = r.filter(q => q.detectores.some(d => ds.includes(d)));
  }
  // Filtro por nível de verificação: permite separar o que roda sem autorização
  // (A e B) do que exige aprovação (C e D). É o que deixa começar a auditoria
  // enquanto o plano é analisado.
  if (opts.verificacao) {
    const nvs = opts.verificacao.split(',').map(v => v.trim().toUpperCase());
    r = r.filter(q => nvs.includes(q.nivelVerificacao));
  }
  return r.sort((a, b) =>
    (ORDEM_SEV[a.severidadeSeAusente] - ORDEM_SEV[b.severidadeSeAusente]) ||
    a.id.localeCompare(b.id));
}

function carregarPerfil(caminho) {
  if (!fs.existsSync(caminho)) {
    console.error(`Perfil não encontrado: ${caminho}`);
    console.error('Gere com: node perfil.js <projeto> --json > perfil.json');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(caminho, 'utf8'));
}

/**
 * Marca requisitos com exceção registrada no projeto. Exceção válida vira
 * registro em vez de achado; exceção vencida volta a ser achado, com a
 * severidade original. É o que impede a auditoria de brigar com decisão
 * consciente já tomada.
 */
function anotarExcecoes(reqs, perfil) {
  if (!perfil || !perfil.excecoes || !perfil.excecoes.itens) return reqs;
  const porId = {};
  perfil.excecoes.itens.forEach(e => { if (e.id) porId[e.id.toUpperCase()] = e; });
  return reqs.map(q => {
    const e = porId[q.id.toUpperCase()];
    if (!e) return q;
    return { ...q, excecao: e };
  });
}

function linhaResumo(q) {
  const sev = q.severidadeSeAusente.toUpperCase().padEnd(8);
  let marca = '';
  if (q.excecao) marca = q.excecao.vencida ? '  [EXCEÇÃO VENCIDA]' : '  [exceção aceita]';
  return `${q.id.padEnd(8)} ${q.nivel}  ${sev} ${q.titulo}${marca}`;
}

function fichaCompleta(q) {
  const L = [];
  L.push('─'.repeat(78));
  L.push(`${q.id} · ${q.titulo}`);
  L.push('─'.repeat(78));
  L.push(`Nível ${q.nivel} · ${q.tipo} · ${q.natureza} · severidade se ausente: ${q.severidadeSeAusente}`);
  L.push(`Protege: ${q.propriedade.join(', ')}`);
  L.push(`Aplica quando: ${q.detectores.join(', ')}`);
  const nv = catalogo.meta.niveis_de_verificacao?.[q.nivelVerificacao];
  L.push(`Verificação nível ${q.nivelVerificacao}: ${nv ? nv.split('.')[0] + '.' : 'ver meta'}`);
  if (q.nivelVerificacao === 'C' || q.nivelVerificacao === 'D') {
    L.push(q.nivelVerificacao === 'D'
      ? '  >>> AÇÃO ATIVA: pode ter efeito real em produção. Exige autorização e ambiente combinado.'
      : '  >>> Cria dado de teste na base. Exige autorização.');
  }
  L.push('');
  L.push('DECLARAÇÃO');
  L.push('  ' + q.declaracao);
  L.push('');
  L.push('POR QUÊ');
  L.push('  ' + q.porque);
  L.push('');
  L.push('COMO QUEBRA');
  L.push('  ' + q.comoQuebra);
  L.push('');
  L.push('IMPLEMENTAÇÃO');
  for (const [ctx, txt] of Object.entries(q.implementacao || {})) {
    L.push(`  [${ctx}] ${txt}`);
  }
  L.push('');
  L.push('COMO TESTAR');
  L.push('  ' + q.teste);
  L.push('');
  L.push('EVIDÊNCIA A GUARDAR');
  L.push('  ' + q.evidencia);
  if (q.armadilhas && q.armadilhas.length) {
    L.push('');
    L.push('ARMADILHAS');
    q.armadilhas.forEach(a => L.push('  · ' + a));
  }
  if (q.dependeDe && q.dependeDe.length) {
    L.push('');
    L.push(`DEPENDE DE: ${q.dependeDe.join(', ')}`);
  }
  const m = Object.entries(q.mapeamento || {}).map(([k, v]) => `${k}=${v}`).join(' · ');
  if (m) { L.push(''); L.push('MAPEAMENTO: ' + m); }
  return L.join('\n');
}

function checklist(reqs, perfil) {
  const L = [];
  L.push(`CHECKLIST DE SEGURANÇA${perfil ? ' — ' + path.basename(perfil.projeto) : ''}`);
  if (perfil) {
    L.push(`Nível ${perfil.nivelSugerido} · ${perfil.stacks.join(', ')} · gerado de ${reqs.length} requisitos`);
  }
  L.push('');
  const porFam = {};
  reqs.forEach(q => (porFam[familiaDe(q.id)] ||= []).push(q));
  for (const fam of Object.keys(porFam).sort()) {
    L.push(`## ${fam}`);
    for (const q of porFam[fam]) {
      L.push(`- [ ] ${q.id} · ${q.titulo}`);
      L.push(`      teste: ${q.teste}`);
    }
    L.push('');
  }
  L.push('Cada item é um ID. A regra completa está no catálogo:');
  L.push('  node requisitos.js --id <ID> --completo');
  return L.join('\n');
}

/**
 * Plano de trabalho, apresentado ANTES de qualquer verificação.
 *
 * Existe porque auditoria que começa a agir sem dizer o que vai fazer é
 * auditoria que surpreende: teste de nível D dispara bloqueio de conta real,
 * consome crédito pago e altera estado em produção. Quem responde pelo sistema
 * precisa aprovar antes, sabendo o custo e o alcance.
 */
function plano(reqs, perfil, modo) {
  if (!perfil) {
    return [
      'O plano depende do perfil do alvo. Sem ele não há o que identificar,',
      'nem como dizer o que não se aplica.',
      '',
      'Gere o perfil primeiro:',
      '  node perfil.js <caminho-do-projeto> --json > perfil.json',
      '  node requisitos.js --plano --perfil perfil.json',
    ].join('\n');
  }
  const L = [];
  const nome = path.basename(perfil.projeto);
  const porNivelVerif = { A: [], B: [], C: [], D: [] };
  reqs.forEach(q => porNivelVerif[q.nivelVerificacao || 'A'].push(q));
  const porSev = s => reqs.filter(q => q.severidadeSeAusente === s).length;
  const porFam = {};
  reqs.forEach(q => (porFam[familiaDe(q.id)] ||= []).push(q));

  L.push('='.repeat(72));
  L.push(`PLANO DE ${(modo || 'auditoria').toUpperCase()} — ${nome}`);
  L.push('='.repeat(72));
  L.push('');
  L.push('Nada foi verificado ainda. Isto é o que pretendo fazer.');
  L.push('');

  L.push('1 · O QUE EU IDENTIFIQUEI');
  if (perfil) {
    L.push(`   Stack: ${perfil.stacks.join(', ')}`);
    L.push(`   Arquivos varridos: ${perfil.arquivosVarridos} · dependências lidas: ${perfil.dependenciasLidas}`);
    L.push(`   Nível de rigor sugerido: ${perfil.nivelSugerido} — ${perfil.porqueNivel}`);
    L.push('');
    const conf = Object.entries(perfil.superficies || {}).filter(([, v]) => v.confirmada);
    const poss = Object.entries(perfil.superficies || {}).filter(([, v]) => !v.confirmada);
    L.push('   Superfícies confirmadas (com prova):');
    if (!conf.length) L.push('     nenhuma além do universal');
    conf.forEach(([s, v]) => L.push(`     · ${s} — ${v.provas.map(x => x.tipo + ': ' + x.valor).join(' · ')}`));
    if (poss.length) {
      L.push('');
      L.push('   PRECISO QUE VOCÊ CONFIRME (só menção em conteúdo, pode ser falso positivo):');
      poss.forEach(([s, v]) => L.push(`     ? ${s} — ${v.provas.map(x => x.valor).join(' · ')}`));
    }
  }
  L.push('');

  L.push('2 · O QUE VOU VERIFICAR');
  L.push(`   ${reqs.length} requisitos aplicáveis a este projeto.`);
  L.push(`   Por severidade se ausente:  crítica ${porSev('critica')} · alta ${porSev('alta')} · média ${porSev('media')} · baixa ${porSev('baixa')}`);
  L.push('   Por família:');
  Object.keys(porFam).sort().forEach(f =>
    L.push(`     ${f}  ${String(porFam[f].length).padStart(2)} requisitos`));
  L.push('');

  L.push('3 · COMO VOU VERIFICAR, E O QUE ISSO CUSTA');
  const rot = {
    A: ['Leitura de arquivo e configuração', 'nenhum efeito · não precisa de autorização'],
    B: ['Observação do sistema rodando', 'sem alterar estado · sem efeito colateral'],
    C: ['Contas de teste', 'CRIA DADO DE TESTE na base · precisa de dois usuários'],
    D: ['Ação ativa', 'PODE TER EFEITO REAL: dispara bloqueio, consome recurso pago, altera estado'],
  };
  for (const n of ['A', 'B', 'C', 'D']) {
    const qs = porNivelVerif[n];
    if (!qs.length) continue;
    L.push(`   [${n}] ${rot[n][0]} — ${qs.length} requisitos`);
    L.push(`       ${rot[n][1]}`);
    L.push(`       ${qs.map(q => q.id).join(' ')}`);
  }
  if (porNivelVerif.C.length || porNivelVerif.D.length) {
    L.push('');
    L.push('   >>> Os níveis C e D só rodam com sua autorização explícita.');
    L.push('   >>> Sem ela, esses requisitos ficam como NÃO VERIFICADO no relatório,');
    L.push('   >>> o que é honesto e continua útil — mas não é a mesma coisa que conforme.');
  }
  L.push('');

  L.push('4 · O QUE NÃO VOU VERIFICAR, E POR QUÊ');
  if (perfil) {
    L.push(`   Não se aplica a este projeto (${perfil.familiasInativas.length} famílias):`);
    L.push(`     ${perfil.familiasInativas.join(' · ')}`);
    const semReq = perfil.familiasAtivas.filter(f => !familiasNoCatalogo().includes(f));
    if (semReq.length) {
      L.push('');
      L.push(`   Aplica-se, mas ainda sem requisito escrito nesta fase do catálogo (${semReq.length}):`);
      L.push(`     ${semReq.join(' · ')}`);
      L.push('     Isso é lacuna do catálogo, não do seu sistema. Vai aparecer no relatório.');
    }
  }
  L.push('');

  if (perfil && perfil.excecoes) {
    L.push('5 · DECISÕES JÁ REGISTRADAS QUE VOU RESPEITAR');
    if (!perfil.excecoes.existe) {
      L.push('   Nenhum .seguranca-excecoes.json neste projeto.');
      L.push('   Se algo aqui foi decisão consciente sua, me diga: vira registro, não achado.');
    } else {
      const itens = perfil.excecoes.itens || [];
      const validas = itens.filter(e => !e.vencida);
      const vencidas = itens.filter(e => e.vencida);
      validas.forEach(e => L.push(`   ${e.id} — respeitada até ${e.revisarEm || 'sem prazo'}`));
      vencidas.forEach(e => L.push(`   ${e.id} — PRAZO VENCIDO em ${e.revisarEm}, volta a ser achado`));
    }
    L.push('');
  }

  L.push('6 · O QUE PRECISO DE VOCÊ ANTES DE COMEÇAR');
  const pede = [];
  if (perfil && Object.values(perfil.superficies || {}).some(v => !v.confirmada)) {
    pede.push('confirmar ou descartar as superfícies marcadas com "?" no item 1');
  }
  pede.push('confirmar que este sistema é seu, ou que você tem autorização escrita para testá-lo');
  if (porNivelVerif.C.length) pede.push(`autorizar os ${porNivelVerif.C.length} testes de nível C (contas de teste)`);
  if (porNivelVerif.D.length) pede.push(`autorizar os ${porNivelVerif.D.length} testes de nível D (ação ativa) e dizer em qual ambiente`);
  pede.push('dizer se prefiro começar só pelas críticas ou rodar tudo');
  pede.forEach((x, i) => L.push(`   ${i + 1}. ${x}`));
  L.push('');
  L.push('='.repeat(72));
  L.push('Aprova este plano, ou quer ajustar o escopo?');
  L.push('='.repeat(72));
  return L.join('\n');
}

/**
 * A régua interna: quantos requisitos sustentam cada um dos dez princípios.
 *
 * Existe porque princípio declarado e não medido vira meia verdade: um
 * princípio pode prometer "quando quebra, fecha" sem nenhum requisito que
 * cobre isso — e ninguém vê, se princípio não for régua de nada.
 * Medir por identificador, e não por família, é o que faz a ausência aparecer:
 * "ACC cobre o princípio 4" é verdade e é inútil.
 */
function verPrincipios() {
  const existentes = new Set(catalogo.requisitos.map(r => r.id));
  const L = [];
  L.push('OS DEZ PRINCÍPIOS, E O QUE SUSTENTA CADA UM');
  L.push('');
  L.push('A régua mais funda das três. As outras duas: --cobertura (âncoras');
  L.push('normativas) e as cinco propriedades, conferidas pelo verificador.');
  L.push('');
  const P = principios.principios;
  for (const [chave, dados] of Object.entries(P)) {
    const ids = dados.requisitos || [];
    const faltando = ids.filter(i => !existentes.has(i));
    L.push(`${chave.split('_')[0].padStart(2)} · ${dados.nome}`);
    L.push(`     ${ids.length} requisito(s): ${ids.join(' ')}`);
    if (faltando.length) L.push(`     >>> NÃO EXISTEM NO CATÁLOGO: ${faltando.join(' ')}`);
    if (dados.nota) L.push(`     nota: ${dados.nota}`);
    L.push('');
  }
  const reivindicados = new Set(Object.values(P).flatMap(x => x.requisitos || []));
  const orfaos = catalogo.requisitos.map(r => r.id).filter(i => !reivindicados.has(i));
  L.push(`Requisitos que nenhum princípio reivindica: ${orfaos.length} de ${catalogo.requisitos.length}`);
  if (orfaos.length) {
    L.push('  ' + orfaos.join(' '));
    L.push('  Não é defeito: nem todo requisito nasce de um princípio, e vários');
    L.push('  vêm de obrigação legal ou de operação. Mas vale a leitura.');
  }
  return L.join('\n');
}

/**
 * Cobertura: cruza o catálogo com as âncoras normativas e lista o que ainda não
 * tem requisito. É a Regra 1 do contrato virando comando em vez de promessa.
 */
function cobertura() {
  const existentes = new Set(familiasNoCatalogo());
  const todas = new Set();
  const lacunas = [];

  for (const [padrao, dados] of Object.entries(ancoras)) {
    if (padrao === 'meta') continue;
    const grupos = itensDaAncora(dados);
    for (const [item, valor] of Object.entries(grupos)) {
      const fams = Array.isArray(valor) ? valor : (valor.familias || []);
      fams.forEach(f => todas.add(f));
      const cobertas = fams.filter(f => existentes.has(f));
      if (!cobertas.length) {
        lacunas.push({
          padrao,
          item,
          nome: valor.nome || '',
          familiasPrevistas: fams,
        });
      }
    }
  }

  const L = [];
  L.push('COBERTURA DO CATÁLOGO CONTRA AS ÂNCORAS NORMATIVAS');
  L.push('');
  L.push(`Fase atual do catálogo: ${catalogo.meta.fase}`);
  L.push(`Requisitos escritos: ${catalogo.requisitos.length}`);
  L.push(`Famílias com requisito: ${[...existentes].sort().join(', ')}`);
  L.push(`Famílias previstas na arquitetura mas ainda sem requisito: ${[...todas].filter(f => !existentes.has(f)).sort().join(', ')}`);
  L.push('');
  if (!lacunas.length) {
    L.push('Nenhum item de âncora sem cobertura. O catálogo passou no teste da Regra 1.');
  } else {
    L.push(`ITENS DE ÂNCORA SEM NENHUMA FAMÍLIA COBERTA (${lacunas.length})`);
    L.push('Cada linha exige requisito novo ou justificativa escrita de não-aplicabilidade.');
    L.push('');
    for (const l of lacunas) {
      L.push(`  ${l.padrao.padEnd(18)} ${String(l.item).padEnd(22)} ${l.nome}`);
      L.push(`  ${''.padEnd(18)} previstas: ${l.familiasPrevistas.join(', ') || '—'}`);
    }
  }
  L.push('');
  L.push('Pendências de verificação declaradas em ancoras.json:');
  ancoras.meta.pendencias_de_verificacao.forEach(p => L.push('  · ' + p));
  return L.join('\n');
}

function resumo() {
  const L = [];
  L.push(`CATÁLOGO DE REQUISITOS — v${catalogo.meta.versao} (${catalogo.meta.atualizado})`);
  L.push(catalogo.meta.fase);
  L.push('');
  const porFam = {};
  catalogo.requisitos.forEach(q => (porFam[familiaDe(q.id)] ||= []).push(q));
  L.push('FAMÍLIA  QTD  CRÍTICA  ALTA  MÉDIA  BAIXA');
  for (const fam of Object.keys(porFam).sort()) {
    const qs = porFam[fam];
    const c = s => qs.filter(q => q.severidadeSeAusente === s).length;
    L.push(`${fam.padEnd(8)} ${String(qs.length).padStart(3)}  ${String(c('critica')).padStart(7)}  ${String(c('alta')).padStart(4)}  ${String(c('media')).padStart(5)}  ${String(c('baixa')).padStart(5)}`);
  }
  L.push('');
  L.push(`Total: ${catalogo.requisitos.length} requisitos`);
  L.push('');
  L.push('NÍVEIS');
  for (const [n, d] of Object.entries(catalogo.meta.niveis)) L.push(`  ${n} — ${d}`);
  return L.join('\n');
}

/**
 * O mapa do que a skill cobre, por família.
 *
 * POR QUE EXISTE: "o que essa skill sabe?" é a primeira pergunta de quem chega,
 * e antes disso só havia duas respostas ruins — ler o catálogo inteiro (que é
 * justamente o que a skill existe para evitar) ou uma lista escrita à mão numa
 * referência, que envelhece calada. Aqui o mapa é gerado do catálogo, então ele
 * não tem como divergir dele.
 *
 * A coluna ATIVA POR é a que mais informa: diz qual superfície detectada no
 * perfil traz aquela família para o plano. Família que só aparece em `sempre`
 * vale para qualquer projeto, inclusive um site de uma página.
 */
function familias() {
  const { NOMES_FAMILIA, FAMILIAS_POR_SUPERFICIE } = require('./perfil.js');

  const ativaPor = {};
  for (const [sup, fams] of Object.entries(FAMILIAS_POR_SUPERFICIE)) {
    fams.forEach(f => (ativaPor[f] ||= []).push(sup));
  }

  const porFam = {};
  catalogo.requisitos.forEach(q => (porFam[familiaDe(q.id)] ||= []).push(q));

  const L = [];
  L.push(`MAPA DO CATÁLOGO — v${catalogo.meta.versao} (${catalogo.meta.atualizado})`);
  L.push('O que esta skill cobre, por família. Gerado do catálogo, não escrito à mão.');
  L.push('');
  L.push('FAM  NOME                       QTD  N1  N2  N3   ATIVA POR');
  L.push('---  -------------------------  ---  --  --  --   ---------');

  for (const fam of Object.keys(porFam).sort()) {
    const qs = porFam[fam];
    const n = x => String(qs.filter(q => q.nivel === x).length).padStart(2);
    const nome = (NOMES_FAMILIA[fam] || '?').slice(0, 25);
    const gatilhos = (ativaPor[fam] || ['—']).join(', ');
    L.push(
      `${fam.padEnd(4)} ${nome.padEnd(26)} ${String(qs.length).padStart(3)}  ` +
      `${n('N1')}  ${n('N2')}  ${n('N3')}   ${gatilhos}`
    );
  }

  L.push('');
  L.push(`Total: ${catalogo.requisitos.length} requisitos em ${Object.keys(porFam).length} famílias`);
  L.push('');
  L.push('SUPERFÍCIES QUE O PERFIL DETECTA');
  for (const [d, desc] of Object.entries(catalogo.meta.detectores || {})) {
    L.push(`  ${d.padEnd(16)} ${desc}`);
  }
  L.push('');
  L.push('Nível é cumulativo: pedir N2 traz N1 junto, porque N2 exige tudo de N1.');
  L.push('Para o que se aplica a UM projeto: --perfil perfil.json. Este mapa é o universo.');
  return L.join('\n');
}

function main() {
  const o = args();

  if (o.flags.has('resumo')) return console.log(resumo());
  if (o.flags.has('familias')) return console.log(familias());
  if (o.flags.has('cobertura')) return console.log(cobertura());
  if (o.flags.has('principios')) return console.log(verPrincipios());

  if (o.id) {
    const q = catalogo.requisitos.find(x => x.id.toUpperCase() === o.id.toUpperCase());
    if (!q) {
      console.error(`Requisito ${o.id} não existe no catálogo.`);
      console.error(`Famílias disponíveis: ${familiasNoCatalogo().join(', ')}`);
      process.exit(1);
    }
    return console.log(o.flags.has('json') ? JSON.stringify(q, null, 2) : fichaCompleta(q));
  }

  let perfil = null;
  if (o.perfil) {
    perfil = carregarPerfil(o.perfil);
    if (!o.familia) o.familia = perfil.familiasAtivas.join(',');
    if (!o.nivel) o.nivel = perfil.nivelSugerido;
    // Filtro duplo: a família precisa estar ativa E o requisito precisa se
    // aplicar a alguma superfície presente. Sem isso, ativar a família "dado"
    // por causa de um banco traz também o requisito de cartão de crédito num
    // projeto que não cobra nada.
    if (!o.detector) {
      const presentes = Object.keys(perfil.superficies || {});
      o.detector = ['sempre', ...presentes].join(',');
    }
  }

  const reqs = anotarExcecoes(filtrar(o), perfil);

  if (o.flags.has('json')) return console.log(JSON.stringify(reqs, null, 2));
  if (o.flags.has('plano')) return console.log(plano(reqs, perfil, o.modo));
  if (o.flags.has('checklist')) return console.log(checklist(reqs, perfil));

  if (!reqs.length) {
    console.log('Nenhum requisito bate com o filtro.');
    console.log(`Famílias no catálogo hoje: ${familiasNoCatalogo().join(', ')}`);
    if (perfil) {
      const semReq = perfil.familiasAtivas.filter(f => !familiasNoCatalogo().includes(f));
      if (semReq.length) console.log(`Ativas no perfil e ainda sem requisito escrito: ${semReq.join(', ')}`);
    }
    return;
  }

  if (o.flags.has('completo')) {
    return console.log(reqs.map(fichaCompleta).join('\n\n'));
  }

  const L = [];
  if (perfil) {
    L.push(`${reqs.length} requisitos aplicáveis a ${path.basename(perfil.projeto)} (nível ${perfil.nivelSugerido})`);
    const semReq = perfil.familiasAtivas.filter(f => !familiasNoCatalogo().includes(f));
    if (semReq.length) {
      L.push(`Famílias ativas ainda sem requisito escrito nesta fase: ${semReq.join(', ')}`);
    }
    L.push('');
  }
  L.push('ID       NÍV SEVERIDADE TÍTULO');
  reqs.forEach(q => L.push(linhaResumo(q)));
  L.push('');
  L.push('Ficha completa: node requisitos.js --id <ID> --completo');
  console.log(L.join('\n'));
}

if (require.main === module) main();
module.exports = {
  filtrar, catalogo, ancoras, principios,
  CONTAINERES_DE_ANCORA, itensDaAncora, familiasDoItem,
};
