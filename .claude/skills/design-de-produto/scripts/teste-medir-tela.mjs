// Prova o medir-tela.cjs e os avisos de app (avisos-de-app.cjs) nos dois sentidos, com telas de prova
// escritas aqui:
//   - as telas limpas (clara, escura, cartão esticado com total no pé, a matriz de estados) saem 0,
//     com todas as combinações OK e "avisos 0";
//   - cada tela com UM defeito que reprova sai 1 E imprime a linha da medida certa (não basta sair 1: um
//     defeito que derruba outra medida esconderia a morte desta);
//   - cada tela com UM defeito de aviso sai 0 (aviso não reprova) E imprime a linha "aviso <id>: ...";
//   - cada medida, quebrada numa cópia do medidor ou do módulo de avisos, deixa o seu caso passar sem a
//     linha (a mutação é conferida antes: se o trecho não estiver no arquivo exatamente uma vez, o teste
//     reprova).
//
// Precisa do Playwright e do Chromium que o medidor acha (o mesmo das maquetes). Roda 3 medições por vez
// e leva cerca de 3 min.
//
// Uso: node .claude/skills/design-de-produto/scripts/teste-medir-tela.mjs

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const MEDIDOR = path.join(AQUI, 'medir-tela.cjs');
const MODULO = path.join(AQUI, 'avisos-de-app.cjs');
// as cópias mutantes ficam ao lado do original (o medidor acha o Playwright pelo próprio caminho) e saem no fim
const mutante = (slug, base) => path.join(AQUI, `_mutante-${slug}-${base}`);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'teste-medir-tela-'));

const CSS_APP = `h1{font-size:24px;line-height:32px;margin:0 0 4px}
.linha{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin:16px 0}
.cartao{border:1px solid rgba(136,136,136,.5);border-radius:12px;padding:16px}.cartao p{margin:0}
.kpi{font-size:28px;line-height:36px}
table{width:100%;border-collapse:collapse;margin:16px 0}th,td{padding:8px;text-align:left;border-bottom:1px solid rgba(136,136,136,.4)}
th.num,td.num{text-align:right;width:120px}@media (max-width:640px){th.num,td.num{width:auto}}
.ferramentas{display:flex;gap:8px}.ferramentas span{display:inline-grid;place-items:center;width:32px;height:32px;border-radius:50%;background:#f4f4f8}
body{font-variant-numeric:tabular-nums}`;
const pagina = (corpo, fundo = '#ffffff', cor = '#1a1a1a', css = '') => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>prova</title>
<style>body{margin:0;padding:24px;font:16px/1.5 system-ui,sans-serif;background:${fundo};color:${cor}}
button{min-height:48px;padding:0 16px;font:inherit}${CSS_APP}${css}</style></head><body>${corpo}</body></html>`;

// A tela limpa: uma tela de app pequena e honesta. Os três botões redondos em #f4f4f8 são o caso que a
// saturação HSL lia como "tingido"; a variação "igual aos 30 dias antes" é a dita em palavras, sem sinal.
const ICONE = '<span><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="5" fill="none" stroke="#555"/></svg></span>';
const PARTES = { a: '<td class="num" data-parte="aberto">R$ 21,68</td>', b: '<td class="num" data-parte="aberto">R$ 8,34</td>', c: '<td class="num" data-parte="aberto" data-sinal="-">−R$ 3,81</td>' };
const LIMPO = `<main>
<h1>Fila de pedidos</h1>
<p>Três pedidos esperando resposta desde as <span data-fato="abertura">09:00</span>.</p>
<div class="ferramentas">${ICONE}${ICONE}${ICONE}</div>
<div class="linha">
 <div class="cartao"><p>Abertos</p><p class="kpi" data-fato="abertos">12</p></div>
 <div class="cartao"><p>Fechados hoje</p><p class="kpi">7</p></div>
 <div class="cartao"><p>Total em aberto</p><p class="kpi" data-total="aberto">R$ 26,21</p></div>
</div>
<table><thead><tr><th>Cliente</th><th class="num">Itens</th><th class="num">Valor</th></tr></thead><tbody>
<tr><td>Maria Souza</td><td class="num">3</td>${PARTES.a}</tr>
<tr><td>Diego Moura</td><td class="num">2</td>${PARTES.b}</tr>
<tr><td>Renata Paiva (devolução)</td><td class="num">1</td>${PARTES.c}</tr>
</tbody></table>
<p>Abertos agora: <span data-fato="abertos">12</span>. Ontem <span data-fato="ontem">R$ 5,22</span>, hoje <span data-fato="hoje">R$ 5,28</span>.</p>
<p><span data-variacao="ontem>hoje">+R$ 0,06 sobre ontem</span></p>
<p><span data-variacao>igual aos 30 dias antes</span></p>
<svg width="100%" height="120" viewBox="0 0 600 120" preserveAspectRatio="none" aria-hidden="true"><line x1="0" y1="119" x2="600" y2="119" stroke="#e5e5e5"/><rect x="40" y="50" width="60" height="69" fill="#2563eb"/><rect x="160" y="30" width="60" height="89" fill="#2563eb"/><rect x="280" y="70" width="60" height="49" fill="#2563eb"/></svg>
<p>Atendimento (11) 98431-2207</p>
<button>Abrir</button>
</main>
<script>console.assert(Math.round((21.68 + 8.34 - 3.81) * 100) === 2621, 'as partes fecham o total');</script>`;
const troca = (de, para) => { if (LIMPO.split(de).length !== 2) throw new Error('a prova não tem o trecho: ' + de); return LIMPO.replace(de, () => para); };
const depoisDoTitulo = (html) => troca('<h1>Fila de pedidos</h1>', '<h1>Fila de pedidos</h1>' + html);
const CARTAO_ESTICADO = (pe) => `<div class="cartao" style="min-height:260px;display:flex;flex-direction:column;justify-content:space-between;margin-top:16px"><p>Resumo do dia</p><p>${pe}</p></div>`;
const ESTADOS = (comErro) => `<script>
const estado = new URLSearchParams(location.search).get('estado'); const m = document.querySelector('main');
if (estado === 'vazio') m.querySelector('table').outerHTML = '<p>Nenhum pedido em aberto agora.</p>';
if (estado === 'zero') m.querySelectorAll('.kpi').forEach((k) => { k.textContent = '0'; });
if (estado === 'carregando') m.querySelectorAll('.kpi, td').forEach((k) => { k.innerHTML = '<span style="display:inline-block;width:48px;height:16px;background:#ddd"></span>'; });
${comErro ? "if (estado === 'erro') m.querySelector('table').outerHTML = '<p>Não deu para carregar os pedidos. Último dado bom às 09:14. <button>Tentar de novo</button></p>';" : ''}
</script>`;
const ARCO_IRIS = '<svg width="320" height="100" viewBox="0 0 320 100">' + ['#e11d48', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#6366f1', '#d946ef'].map((c, i) => `<rect x="${i * 44}" y="20" width="36" height="80" fill="${c}"/>`).join('') + '</svg>';
const QUADRADO = '<span style="display:inline-grid;place-items:center;width:32px;height:32px;border-radius:8px;background:#dbeafe"><svg width="16" height="16"><circle cx="8" cy="8" r="6" fill="#2563eb"/></svg></span>';

// limpos: [nome, html, tema, argumentos]
const LIMPOS = [
  ['limpo claro', pagina(LIMPO), 'claro', []],
  ['limpo escuro (grafite)', pagina(LIMPO, '#181A1F', '#eeeeee'), 'escuro', []],
  ['cartão esticado com o total no pé', pagina(LIMPO + CARTAO_ESTICADO('As 3 partes somam R$ 26,21')), 'claro', []],
  ['matriz de estados completa', pagina(LIMPO + ESTADOS(true)), 'claro', ['--estados']],
];

// [nome, html, tema, linha esperada (regex de linha inteira), mutação [de, para] ou null, opções]
// opções: aviso (sai 0 com a linha), arquivo ('modulo' ou o medidor), args (do medidor)
const A = { aviso: true, arquivo: 'modulo' };
const DEFEITOS = [
  ['estouro horizontal', pagina(LIMPO + '<div style="width:700px">largo demais</div>'), 'claro',
    /^ {4}estouro: div "largo demais"$/m, ['r.right > pedida + 1 || r.left < -1', 'false']],
  ['alvo de toque abaixo de 44 px', pagina(LIMPO + '<p><a href="#ver" style="display:inline-block;height:20px;line-height:20px">ver tudo</a></p>'), 'claro',
    /^ {4}toque: ver tudo 20px$/m, ['a.efetiva < 44', 'a.efetiva < 0']],
  ['contraste de selo', pagina(LIMPO + '<p><span class="selo" style="display:inline-block;padding:6px 12px;background:#dddddd;color:#c8c8c8">novo</span></p>'), 'claro',
    /^ {4}contraste: novo \d+(\.\d+)?$/m, ['s.c < 4.5', 's.c < 0']],
  ['número quebrado', pagina(LIMPO + '<div style="width:40px">R$ 7.842,16</div>'), 'claro',
    /^ {4}número quebrado: "R\$ 7\.842,16"$/m, ["linhasDe(x.n) > 1).map(x => '\"' + x.t + '\"')", "linhasDe(x.n) > 99).map(x => '\"' + x.t + '\"')"]],
  ['texto sobreposto', pagina(LIMPO + '<div style="position:relative;height:40px"><span style="position:absolute;left:0;top:0">Maria Souza</span><span style="position:absolute;left:12px;top:0">Pediu ajuda</span></div>'), 'claro',
    /^ {4}sobreposto: "Maria Souza" × "Pediu ajuda"$/m, ['if (w > 2 && hh > 4) sobrepostos.push', 'if (false) sobrepostos.push']],
  ['fundo quase preto', pagina(LIMPO, '#050505', '#eeeeee'), 'escuro',
    /^ {4}fundo: .* é mais escuro que #111317; o escuro da skill é o grafite #181A1F/m, ['const fundoEscuroDemais = lf < 0.18 && lf < PISO_DO_ESCURO;', 'const fundoEscuroDemais = false;']],

  // os avisos de tela de app
  ['fileira de cartões desigual', pagina(LIMPO + '<div class="linha" style="align-items:start"><div class="cartao"><p>Entrada</p><p>uma linha</p></div><div class="cartao"><p>Saída</p><p>linha</p><p>linha</p><p>linha</p><p>linha</p></div></div>'), 'claro',
    /^ {4}aviso fileira-desigual: cartões lado a lado com o pé desalinhado: "Entrada" e "Saída" .*$/m, ['if (dif > Math.max(L.fileira.minimo, alto * L.fileira.fracao)) fileiras.push(', 'if (false) fileiras.push('], A],
  ['vão em branco no cartão', pagina(LIMPO + '<div class="cartao" style="min-height:260px;margin-top:16px"><p>Resumo do dia</p><p>Nada pendente.</p></div>'), 'claro',
    /^ {4}aviso vao-no-cartao: \d+px em branco em "Resumo do dia" .*$/m, ['if (maior > L.vao.faixa) vaos.push(', 'if (false) vaos.push('], A],
  ['pé do cartão esticado sem total nem ação', pagina(LIMPO + CARTAO_ESTICADO('Nada mais para hoje.')), 'claro',
    /^ {4}aviso vao-no-cartao: \d+px em branco em "Resumo do dia" .*$/m, ["return baixo.some(([, , , el]) => el && (el.closest('a, button') || /\\d/.test(el.textContent || '')));", 'return true;'], A],
  ['faixa sem uso à direita', pagina('<div style="max-width:900px">' + LIMPO + '</div>'), 'claro',
    /^ {4}aviso faixa-sem-uso: o conteúdo para \d+px antes da borda direita .*$/m, ['c.direita > Math.max(L.faixaSemUso.px, largura * L.faixaSemUso.fracao)', 'false'], A],
  ['número à esquerda na tabela', pagina(LIMPO, '#ffffff', '#1a1a1a', 'th.num,td.num{text-align:left}'), 'claro',
    /^ {4}aviso numero-a-esquerda: 6 de 6 células numéricas alinhadas à esquerda .*$/m, ['if (t.left - esq <= 2 && dir - t.right > 4) aEsquerda++;', 'if (false) aEsquerda++;'], A],
  // Georgia com tabular-nums DECLARADO continua proporcional: a régua que lesse o CSS passaria
  ['algarismo proporcional com tabular-nums declarado', pagina(LIMPO, '#ffffff', '#1a1a1a', 'body,.kpi,td{font-family:Georgia,serif;font-variant-numeric:tabular-nums}'), 'claro',
    /^ {4}aviso algarismo-nao-tabular: só 0 de \d+ números em algarismo de largura fixa .*$/m, ['const ok = Math.abs(a - b) < 0.5;', 'const ok = true;'], A],
  ['dado de exemplo: John Doe', pagina(troca('Maria Souza', 'John Doe')), 'claro',
    /^ {4}aviso dado-de-exemplo: dado de exemplo na tela: john doe$/m, ['if (m.exemplos.length) add(', 'if (false) add('], A],
  ['dado de exemplo: Lorem', pagina(LIMPO + '<p>Lorem ipsum dolor sit amet.</p>'), 'claro',
    /^ {4}aviso dado-de-exemplo: dado de exemplo na tela: lorem, ipsum, dolor sit$/m, null, A],
  ['dado de exemplo: telefone 123-4567', pagina(LIMPO + '<p>Ligue 123-4567</p>'), 'claro',
    /^ {4}aviso dado-de-exemplo: dado de exemplo na tela: 123-4567$/m, ['if (seq || rep) exemplos.add(m);', 'if (false) exemplos.add(m);'], A],
  ['gráfico arco-íris', pagina(LIMPO + ARCO_IRIS), 'claro',
    /^ {4}aviso grafico-arco-iris: os gráficos usam \d+ matizes .*$/m, ['matizes.add(Math.round(h.h / 24) % 15);', 'matizes.add(0);'], A],
  ['cor demais na primeira tela', pagina(depoisDoTitulo('<div style="height:420px;background:#2563eb;color:#fff">Campanha</div>')), 'claro',
    /^ {4}aviso cor-demais: \d+% da primeira tela é cor forte .*$/m, ['if (s >= 0.4 && l >= 0.18 && l <= 0.82) n++;', 'if (false) n++;'], A],
  ['ícone em quadrado tingido', pagina(LIMPO + `<div class="ferramentas">${QUADRADO}${QUADRADO}${QUADRADO}</div>`), 'claro',
    /^ {4}aviso icone-em-quadrado: 3 ícones em quadrado tingido$/m, ['/ 255 * f.a < 0.06) continue;', '/ 255 * f.a < 9) continue;'], A],
  ['blocos abaixo da dobra', pagina(troca('<div class="linha">', '<div style="height:900px"></div><div class="linha"><div class="cartao"><p>Parados</p><p class="kpi">4</p></div>')), 'claro',
    /^ {4}aviso abaixo-da-dobra: só 0 de 4 blocos começam na primeira tela$/m, ['m.naPrimeiraTela / m.blocos < L.dobra.fracao', 'false'], A],
  ['lateral no celular', pagina('<div style="display:flex;gap:16px"><nav style="width:160px;min-height:100vh;flex:none"><a href="#a" style="display:block;min-height:48px">Início</a><a href="#b" style="display:block;min-height:48px">Pedidos</a><a href="#c" style="display:block;min-height:48px">Ajustes</a></nav><main style="flex:1;min-width:0"><h1>Pedidos</h1><p>Três esperando.</p></main></div>'), 'claro',
    /^ {4}aviso lateral-no-celular: a lateral ocupa 41% da largura no celular$/m, ['m.lateral.parcela > L.lateralNoCelular', 'false'], A],
  ['número grande demais', pagina(LIMPO, '#ffffff', '#1a1a1a', '.kpi{font-size:52px;line-height:60px}'), 'claro',
    /^ {4}aviso numero-grande-demais: um número em 52px .*$/m, ['if (maior >= L.figura) add(', 'if (false) add('], A],
  ['título grande demais', pagina(LIMPO, '#ffffff', '#1a1a1a', 'h1{font-size:40px;line-height:48px}'), 'claro',
    /^ {4}aviso titulo-grande-demais: o h1 tem 40px \("Fila de pedidos"\)$/m, ['m.titulo.tamanho > (celular ? L.titulo.celular : L.titulo.desktop)', 'false'], A],

  // as contas que a tela marca (R2)
  ['fato mostrado duas vezes com valores diferentes', pagina(troca('Abertos agora: <span data-fato="abertos">12</span>', 'Abertos agora: <span data-fato="abertos">13</span>')), 'claro',
    /^ {4}aviso fato-divergente: o fato "abertos" aparece com valores diferentes: "12" × "13"$/m, ['if (nucleos.size > 1) add(', 'if (false) add('], A],
  ['total que não é a soma dos arredondados', pagina(troca('data-total="aberto">R$ 26,21', 'data-total="aberto">R$ 26,22')), 'claro',
    /^ {4}aviso soma-nao-fecha: o total "aberto" mostra R\$ 26,22, e as 3 partes mostradas somam 26,21$/m, ['if (!igualNaCasa(soma, tv.v, casas)) add(', 'if (false) add('], A],
  ['variação que não é a diferença dos mostrados', pagina(troca('+R$ 0,06 sobre ontem', '+R$ 0,07 sobre ontem')), 'claro',
    /^ {4}aviso variacao-nao-fecha: a variação "\+R\$ 0,07 sobre ontem" devia ser \+0,06 \(hoje − ontem, como mostrados\)$/m, ['if (!igualNaCasa(esperado, mostrado, n.casas)) add(', 'if (false) add('], A],
  ['variação sem a base', pagina(troca('+R$ 0,06 sobre ontem', '+R$ 0,06')), 'claro',
    /^ {4}aviso variacao-sem-base: a variação "\+R\$ 0,06" não diz a base na mesma frase .*$/m, ['if (!/\\b(vs\\.?|versus|que|', 'if (false && !/\\b(vs\\.?|versus|que|'], A],
  ['variação sem sinal', pagina(troca('+R$ 0,06 sobre ontem', 'R$ 0,06 sobre ontem')), 'claro',
    /^ {4}aviso variacao-sem-sinal: a variação "R\$ 0,06 sobre ontem" não tem sinal$/m, ['if (n && n.v !== 0 && /^(R', 'if (false && /^(R'], A],
  ['um horário com dois nomes', pagina(LIMPO + '<p>O caixa abre às <span data-fato="caixa">09:00</span>.</p>'), 'claro',
    /^ {4}aviso dois-nomes-um-horario: 09:00 tem 2 nomes: abertura, caixa$/m, ["if (nomes.size > 1) add('dois-nomes", "if (false) add('dois-nomes"], A],
  ['asserção do cenário que falha', pagina(troca('=== 2621', '=== 2622')), 'claro',
    /^ {4}aviso assercao-do-cenario: .*as partes fecham o total$/m, ["if (msg.type() === 'assert')", 'if (false)'], { aviso: true }],
  // a matriz de estados (R3)
  ['matriz de estados sem o erro', pagina(LIMPO + ESTADOS(false)), 'claro',
    /^ {4}aviso estado-ausente: \?estado=erro mostra a tela cheia: falta o estado erro$/m, ['if (await page.evaluate(() => document.body.innerText) === cheio)', 'if (false)'], { aviso: true, args: ['--estados'] }],
];

const mede = (medidor, nome, html, tema, args = []) => new Promise((resolve) => {
  const d = path.join(TMP, nome.replace(/\W+/g, '-'));
  fs.mkdirSync(d, { recursive: true });
  const arq = path.join(d, 'tela.html');
  fs.writeFileSync(arq, html);
  const env = { ...process.env }; delete env.NODE_TEST_CONTEXT;
  const filho = spawn(process.execPath, [medidor, arq, '--saida', d, '--tema', tema, ...args], { env });
  let saida = ''; filho.stdout.on('data', (b) => { saida += b; }); filho.stderr.on('data', (b) => { saida += b; });
  const prazo = setTimeout(() => { saida += '\n(passou do prazo de 120 s)'; filho.kill(); }, 120000);
  filho.on('close', (codigo) => { clearTimeout(prazo); resolve({ codigo, saida }); });
});
// roda as tarefas de 3 em 3 e devolve os resultados na ordem
const emLotes = async (tarefas, n = 3) => { const out = new Array(tarefas.length); let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < tarefas.length) { const k = i++; out[k] = await tarefas[k](); } })); return out; };

const resultados = [];
const caso = (nome, ok, visto) => { resultados.push(ok); console.log(`${ok ? 'ok    ' : 'FALHOU'}  ${nome}${ok ? '' : '  -> ' + String(visto).trim().split('\n').slice(-6).join(' | ')}`); };
const linhasDeCombinacao = (s) => s.split('\n').filter((l) => /^(OK |REPROVA)/.test(l));
const slug = (s) => s.normalize('NFD').replace(/[^\w]+/g, '-').toLowerCase();

try {
  const fonteMedidor = fs.readFileSync(MEDIDOR, 'utf8'), fonteModulo = fs.readFileSync(MODULO, 'utf8');
  const REQUIRE = "'avisos-de-app.cjs'";
  if (fonteMedidor.split(REQUIRE).length !== 2) throw new Error('o medidor não carrega o módulo de avisos por ' + REQUIRE + ' exatamente uma vez');

  // 1. limpos: saem 0, todas as combinações OK e sem aviso
  const limpos = await emLotes(LIMPOS.map(([nome, html, tema, args]) => () => mede(MEDIDOR, nome, html, tema, args)));
  LIMPOS.forEach(([nome], k) => {
    const r = limpos[k], linhas = linhasDeCombinacao(r.saida);
    caso(`${nome}: sai 0, as duas combinações dão OK e nenhum aviso`, r.codigo === 0 && linhas.length === 2 && linhas.every((l) => l.startsWith('OK ') && / · avisos 0 /.test(l)), r.saida);
  });

  // 2. cada defeito: a linha da medida certa; os que reprovam saem 1, os avisos saem 0 e sem REPROVA
  const defeitos = await emLotes(DEFEITOS.map(([nome, html, tema, , , op = {}]) => () => mede(MEDIDOR, nome, html, tema, op.args)));
  DEFEITOS.forEach(([nome, , , linha, , op = {}], k) => {
    const r = defeitos[k];
    const codigoCerto = op.aviso ? r.codigo === 0 && !/^REPROVA/m.test(r.saida) : r.codigo === 1;
    caso(`${nome}: ${op.aviso ? 'sai 0 com a linha do aviso' : 'sai 1 com a linha da medida'}`, codigoCerto && linha.test(r.saida), r.saida);
  });

  // 3. cada medida quebrada (no medidor ou no módulo): o caso dela deixa de achar a linha
  const comMutacao = DEFEITOS.filter(([, , , , mut]) => mut);
  const preparos = comMutacao.map(([nome, html, tema, linha, [de, para], op = {}]) => {
    const fonte = op.arquivo === 'modulo' ? fonteModulo : fonteMedidor;
    const vezes = fonte.split(de).length - 1;
    if (vezes !== 1) return { nome, erro: `achei ${vezes} vez(es) em ${op.arquivo === 'modulo' ? 'avisos-de-app.cjs' : 'medir-tela.cjs'}: ${de}` };
    const s = slug(nome), medidorMutante = mutante(s, 'medir-tela.cjs');
    if (op.arquivo === 'modulo') {
      fs.writeFileSync(mutante(s, 'avisos-de-app.cjs'), fonte.replace(de, () => para));
      fs.writeFileSync(medidorMutante, fonteMedidor.replace(REQUIRE, () => `'_mutante-${s}-avisos-de-app.cjs'`));
    } else fs.writeFileSync(medidorMutante, fonte.replace(de, () => para));
    return { nome, html, tema, linha, medidorMutante, args: op.args };
  });
  const mutados = await emLotes(preparos.map((p) => () => (p.erro ? Promise.resolve(null) : mede(p.medidorMutante, 'mutante-' + p.nome, p.html, p.tema, p.args))));
  preparos.forEach((p, k) => {
    if (p.erro) return caso(`mutação "${p.nome}" aplica (o trecho existe 1 vez)`, false, p.erro);
    // o mutante tem que rodar até o fim (as duas combinações impressas): um mutante que quebra o
    // medidor também "perde a linha", e isso não prova nada sobre a medida
    caso(`medida "${p.nome}" quebrada: o caso perde a linha`, linhasDeCombinacao(mutados[k].saida).length === 2 && !p.linha.test(mutados[k].saida), mutados[k].saida);
  });
} finally {
  for (const f of fs.readdirSync(AQUI)) if (f.startsWith('_mutante-')) fs.rmSync(path.join(AQUI, f), { force: true });
  fs.rmSync(TMP, { recursive: true, force: true });
}

const falhas = resultados.filter((x) => !x).length;
console.log(falhas ? `\nFALHOU — ${falhas} de ${resultados.length} casos` : `\nTUDO CERTO — ${resultados.length} casos`);
console.log(`# tests ${resultados.length}\n# fail ${falhas}`);
process.exit(falhas ? 1 : 0);
