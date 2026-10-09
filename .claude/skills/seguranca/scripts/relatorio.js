#!/usr/bin/env node
/**
 * relatorio.js — transforma achados julgados num documento entregável.
 *
 * POR QUE EXISTE: auditoria que termina no terminal é lida uma vez, por uma
 * pessoa, e some com a janela. Não se manda, não se guarda, e principalmente
 * não se compara com a próxima — que é onde estaria metade do valor de auditar.
 *
 * A SEPARAÇÃO QUE SUSTENTA O ARQUIVO: quem julga e quem formata são coisas
 * diferentes. O julgamento inteiro acontece antes e sai num arquivo de dados;
 * este script só desenha, e não tem opinião nenhuma sobre o que é achado.
 *
 *   verificação → achados.json → relatorio.js → um arquivo .html
 *      (julga)      (o dado)      (só desenha)     (a entrega)
 *
 * CLASSE DE SCRIPT: é um script de SAÍDA, não de consulta. Ele escreve, e isso
 * é a função dele. O que ele não faz, e a dimensão 8 do verificador cobra:
 * nenhuma chamada de rede, nenhuma execução de processo, e nenhuma escrita fora
 * do caminho que recebeu.
 *
 * Uso:
 *   node relatorio.js <achados.json> [--perfil perfil.json]
 *                     [--saida <pasta ou arquivo>] [--tema <arquivo.css>]
 *
 * O contrato do achados.json está em referencias/relatorio.md.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const DADOS = path.join(__dirname, '..', 'dados');
const catalogo = JSON.parse(fs.readFileSync(path.join(DADOS, 'requisitos.json'), 'utf8'));
const porId = Object.fromEntries(catalogo.requisitos.map(r => [r.id, r]));

const ORDEM_SEV = { critica: 0, alta: 1, media: 2, baixa: 3 };
const ROTULO_SEV = { critica: 'CRÍTICA', alta: 'ALTA', media: 'MÉDIA', baixa: 'BAIXA' };
const PRAZO_SEV = {
  critica: '24 horas, com contenção imediata',
  alta: '7 dias',
  media: '30 dias',
  baixa: '90 dias ou próxima janela',
};

// ---------------------------------------------------------------------------
// A trava que mais importa: nenhum valor de segredo entra no documento
// ---------------------------------------------------------------------------
// Relatório de auditoria circula por e-mail, entra em pasta compartilhada e às
// vezes vai parar num repositório. Um relatório que documenta uma credencial
// exposta E A TRANSCREVE transforma o achado num vazamento novo.
//
// Os padrões são os mesmos da tabela de prefixos de `stacks.md`, que é onde
// eles moram por contrato. Aqui viram trava.
const PADROES_DE_SEGREDO = [
  { re: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{10,}/, o: 'credencial de cobrança' },
  { re: /\bwhsec_[A-Za-z0-9]{10,}/, o: 'segredo de notificação externa' },
  { re: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/, o: 'credencial de nuvem de infraestrutura' },
  { re: /\bgh[pousr]_[A-Za-z0-9]{30,}/, o: 'credencial de hospedagem de código' },
  { re: /\bAIza[A-Za-z0-9_\-]{30,}/, o: 'chave de interface de nuvem' },
  { re: /\bxox[abprs]-[A-Za-z0-9-]{10,}/, o: 'credencial de mensageria' },
  { re: /\bsk-[A-Za-z0-9_\-]{20,}/, o: 'credencial de provedor de modelo' },
  { re: /-----BEGIN[A-Z ]*PRIVATE KEY-----/, o: 'chave privada' },
  { re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, o: 'token assinado inteiro' },
];

function varrerSegredo(valor, caminho, achados) {
  if (typeof valor === 'string') {
    for (const p of PADROES_DE_SEGREDO) {
      if (p.re.test(valor)) achados.push({ caminho, o: p.o });
    }
  } else if (Array.isArray(valor)) {
    valor.forEach((v, i) => varrerSegredo(v, `${caminho}[${i}]`, achados));
  } else if (valor && typeof valor === 'object') {
    for (const [k, v] of Object.entries(valor)) varrerSegredo(v, `${caminho}.${k}`, achados);
  }
}

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------
function esc(s) {
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function morrer(msg, ...extra) {
  console.error('relatorio.js: ' + msg);
  extra.forEach(l => console.error('  ' + l));
  process.exit(1);
}
function args() {
  const a = process.argv.slice(2);
  const o = { flags: new Set(), livres: [] };
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith('--')) {
      const chave = a[i].slice(2);
      const prox = a[i + 1];
      if (prox && !prox.startsWith('--')) { o[chave] = prox; i++; }
      else o.flags.add(chave);
    } else o.livres.push(a[i]);
  }
  return o;
}

// ---------------------------------------------------------------------------
// Validação do dado de entrada
// ---------------------------------------------------------------------------
const CAMPOS_DE_ACHADO = ['onde', 'prova', 'impacto', 'correcao'];

/**
 * Separa o que é achado do que só parece. Item sem prova ou sem localização
 * não vira achado: vira "não verificado", com o motivo escrito.
 *
 * O relatório sai mesmo assim, de propósito. Script que se recusa a existir por
 * causa de um item faz quem escreveu inventar a prova que falta.
 */
function triar(achados) {
  const validos = [];
  const rebaixados = [];
  for (const a of achados) {
    const faltando = CAMPOS_DE_ACHADO.filter(c => !a[c] || !String(a[c]).trim());
    if (!a.id) {
      rebaixados.push({ id: '(sem identificador)', motivo: 'achado sem identificador de requisito: não há como ligá-lo à ficha' });
    } else if (faltando.includes('prova') || faltando.includes('onde')) {
      rebaixados.push({ id: a.id, motivo: `faltou ${faltando.join(' e ')}: sem evidência, não entra como achado` });
    } else if (faltando.length) {
      rebaixados.push({ id: a.id, motivo: `faltou ${faltando.join(' e ')}` });
    } else if (!ORDEM_SEV.hasOwnProperty(a.severidade)) {
      rebaixados.push({ id: a.id, motivo: `severidade ausente ou desconhecida: "${a.severidade || ''}"` });
    } else {
      validos.push(a);
    }
  }
  validos.sort((x, y) => (ORDEM_SEV[x.severidade] - ORDEM_SEV[y.severidade]) || x.id.localeCompare(y.id));
  return { validos, rebaixados };
}

// ---------------------------------------------------------------------------
// O estilo neutro
// ---------------------------------------------------------------------------
// Neutro de propósito: a skill serve qualquer organização, e por isso não
// carrega a marca de nenhuma. Identidade entra por --tema, de fora.
// Miolo claro porque documento de auditoria se imprime e se anota.
const CSS_NEUTRO = `
:root{
  --papel:#ffffff; --tinta:#1b1f27; --tinta-fraca:#5b6472;
  --linha:#dfe3ea; --fundo-suave:#f5f7fa;
  --destaque:#2f4f7f;
  --critica:#8c1d1d; --alta:#9a4a10; --media:#7a5a10; --baixa:#2b4f7a;
  --forte:#1d6b4b;
  --fonte:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
  --mono:ui-monospace,SFMono-Regular,Consolas,"Liberation Mono",monospace;
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--fundo-suave);color:var(--tinta);
  font-family:var(--fonte);font-size:15px;line-height:1.62}
.folha{max-width:860px;margin:0 auto;background:var(--papel);
  padding:56px 60px 72px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
h1{font-size:26px;line-height:1.22;margin:0 0 6px;letter-spacing:-.01em}
h2{font-size:17px;margin:44px 0 14px;padding-bottom:7px;
  border-bottom:2px solid var(--destaque);letter-spacing:-.005em}
h3{font-size:15px;margin:26px 0 8px}
p{margin:0 0 12px}
a{color:var(--destaque)}
.sub{color:var(--tinta-fraca);font-size:13.5px;margin:0 0 4px}
.capa{border-bottom:1px solid var(--linha);padding-bottom:26px;margin-bottom:8px}
.aviso{background:var(--fundo-suave);border-left:3px solid var(--destaque);
  padding:12px 16px;margin:16px 0;font-size:13.5px;color:var(--tinta-fraca)}
table{width:100%;border-collapse:collapse;margin:14px 0;font-size:13.5px}
th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--linha);
  vertical-align:top}
th{background:var(--fundo-suave);font-weight:600;font-size:12.5px;
  text-transform:uppercase;letter-spacing:.05em;color:var(--tinta-fraca)}
.rolagem{overflow-x:auto}
/* Grade, e não flex: com flex a última caixa esticava sozinha numa linha
   inteira quando o número de caixas não fechava a largura. */
.placar{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin:18px 0 6px}
.placar div{border:1px solid var(--linha);border-radius:6px;
  padding:12px 14px;background:var(--papel);min-width:0}
.placar b{display:block;font-size:26px;line-height:1.1;font-variant-numeric:tabular-nums}
.placar span{font-size:11.5px;text-transform:uppercase;letter-spacing:.06em;
  color:var(--tinta-fraca)}
.achado{border:1px solid var(--linha);border-left-width:4px;border-radius:6px;
  padding:16px 18px;margin:16px 0;break-inside:avoid}
.achado.critica{border-left-color:var(--critica)}
.achado.alta{border-left-color:var(--alta)}
.achado.media{border-left-color:var(--media)}
.achado.baixa{border-left-color:var(--baixa)}
.chapa{display:inline-block;font-size:10.5px;font-weight:700;letter-spacing:.08em;
  padding:2px 8px;border-radius:3px;color:#fff;vertical-align:2px}
.chapa.critica{background:var(--critica)}
.chapa.alta{background:var(--alta)}
.chapa.media{background:var(--media)}
.chapa.baixa{background:var(--baixa)}
.achado h3{margin:10px 0 10px;font-size:15.5px}
.campo{display:grid;grid-template-columns:92px 1fr;gap:4px 14px;
  font-size:13.5px;margin:7px 0}
.campo dt{color:var(--tinta-fraca);font-size:11.5px;text-transform:uppercase;
  letter-spacing:.05em;padding-top:2px}
/* min-width:0 é o que impede a coluna 1fr de estourar o cartão: item de grade
   não encolhe abaixo do conteúdo sem isso, e a prova vazava para fora da borda. */
.campo dd{margin:0;min-width:0}
code,pre{font-family:var(--mono);font-size:12.5px}
code{background:var(--fundo-suave);padding:1px 5px;border-radius:3px;
  word-break:break-word}
/* pre-wrap, e não só overflow: relatório de auditoria se imprime, e o que
   depende de rolagem horizontal simplesmente some do papel. */
pre{background:var(--fundo-suave);border:1px solid var(--linha);border-radius:5px;
  padding:12px 14px;margin:8px 0;line-height:1.5;
  white-space:pre-wrap;overflow-wrap:anywhere;overflow-x:auto}
.forte{border-left:3px solid var(--forte);padding:4px 0 4px 14px;margin:12px 0;
  font-size:13.5px;break-inside:avoid}
.forte b{color:var(--forte)}
.vazio{color:var(--tinta-fraca);font-style:italic}
.rodape{margin-top:52px;padding-top:16px;border-top:1px solid var(--linha);
  font-size:12px;color:var(--tinta-fraca)}
@media (max-width:680px){
  .folha{padding:28px 20px 40px}
  .placar{grid-template-columns:repeat(3,1fr)}
  .campo{grid-template-columns:1fr;gap:2px}
  .campo dt{padding-top:8px}
}
@media (max-width:400px){ .placar{grid-template-columns:repeat(2,1fr)} }
@media print{
  body{background:#fff;font-size:10.5pt}
  .folha{max-width:none;box-shadow:none;padding:0}
  .achado,.forte,tr{break-inside:avoid}
  h2{break-after:avoid}
  @page{size:A4;margin:18mm 16mm}
}
`;

// ---------------------------------------------------------------------------
// Montagem
// ---------------------------------------------------------------------------
function bloco(titulo, corpo) {
  return `<h2>${esc(titulo)}</h2>\n${corpo}`;
}

function montarAchado(a) {
  const req = porId[a.id];
  const titulo = a.titulo || (req && req.titulo) || a.id;
  const linhas = [
    ['Onde', `<code>${esc(a.onde)}</code>`],
    ['Prova', `<pre>${esc(a.prova)}</pre>`],
    ['Impacto', esc(a.impacto)],
    ['Correção', esc(a.correcao)],
  ];
  if (a.testar) linhas.push(['Testar', esc(a.testar)]);
  if (a.condicao) linhas.push(['Condição', esc(a.condicao)]);
  linhas.push(['Prazo', esc(PRAZO_SEV[a.severidade])]);
  return `<div class="achado ${a.severidade}">
  <span class="chapa ${a.severidade}">${ROTULO_SEV[a.severidade]}</span>
  <code>${esc(a.id)}</code>
  <h3>${esc(titulo)}</h3>
  <dl class="campo">${linhas.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('\n    ')}</dl>
</div>`;
}

function montarTarefas(achados) {
  // Texto simples de propósito: entra em qualquer ferramenta de acompanhamento
  // sem tradução. Achado explorável não vira tarefa pública — o aviso está no
  // topo da seção, e é a regra de VUL-01.
  const L = [];
  achados.forEach((a, i) => {
    const req = porId[a.id];
    L.push(`--- TAREFA ${i + 1} ---`);
    L.push(`Título: [Segurança] ${a.titulo || (req && req.titulo) || a.id}`);
    L.push(`Rótulos: seguranca, ${a.severidade}`);
    L.push('');
    L.push(`## O problema`);
    L.push(a.impacto);
    if (a.condicao) L.push(`\nCondição para ser alcançável: ${a.condicao}`);
    L.push('');
    L.push(`## Evidência`);
    L.push(`${a.onde}`);
    L.push('```');
    L.push(a.prova);
    L.push('```');
    L.push('');
    L.push(`## Correção`);
    L.push(a.correcao);
    L.push('');
    L.push(`## Critério de pronto`);
    L.push(`- [ ] ${a.correcao}`);
    L.push(`- [ ] ${a.testar || 'A verificação do requisito ' + a.id + ' passa'}`);
    L.push(`- [ ] Nenhum outro ponto do sistema repete o mesmo padrão`);
    L.push('');
    L.push(`Requisito: ${a.id}${req ? ' · ' + req.titulo : ''}`);
    L.push(`--- FIM TAREFA ${i + 1} ---`);
    L.push('');
  });
  return L.join('\n');
}

function montar(d, perfil, css) {
  const { validos, rebaixados } = triar(d.achados || []);
  const conta = s => validos.filter(a => a.severidade === s).length;
  const fortes = d.pontosFortes || [];
  const excecoes = d.excecoes || [];
  const naoVerificado = (d.naoVerificado || []).concat(rebaixados);
  const naoSeAplica = d.naoSeAplica || (perfil && perfil.familiasInativas) || [];
  const projeto = d.projeto || (perfil && path.basename(perfil.projeto || '')) || 'sistema';
  const data = d.data || new Date().toISOString().slice(0, 10);
  const nivel = d.nivel || (perfil && perfil.nivelSugerido) || '';
  const stack = (perfil && perfil.stacks) || d.stack || [];

  const P = [];
  P.push(`<div class="capa">
  <h1>Auditoria de segurança — ${esc(projeto)}</h1>
  <p class="sub">${esc(data)}${nivel ? ' · nível ' + esc(nivel) : ''}${stack.length ? ' · ' + esc(stack.join(', ')) : ''}</p>
  ${d.autorizadoPor ? `<p class="sub">Autorizada por ${esc(d.autorizadoPor)}</p>` : ''}
</div>`);

  P.push(`<div class="placar">
  <div><b style="color:var(--critica)">${conta('critica')}</b><span>críticas</span></div>
  <div><b style="color:var(--alta)">${conta('alta')}</b><span>altas</span></div>
  <div><b style="color:var(--media)">${conta('media')}</b><span>médias</span></div>
  <div><b style="color:var(--baixa)">${conta('baixa')}</b><span>baixas</span></div>
  <div><b style="color:var(--forte)">${fortes.length}</b><span>pontos fortes</span></div>
  <div><b>${naoVerificado.length}</b><span>não verificado</span></div>
</div>`);

  if (d.escopo) P.push(`<div class="aviso"><b>Escopo.</b> ${esc(d.escopo)}</div>`);

  P.push(`<div class="aviso">Esta auditoria prova o que foi verificado, na data em
que foi verificado, e nada além. Ela não afirma que o sistema está seguro, e o
que ficou fora do escopo está listado ao final.</div>`);

  // Achados
  P.push(bloco('Achados', validos.length
    ? validos.map(montarAchado).join('\n')
    : `<p class="vazio">Nenhum achado com evidência nesta execução. Ver a seção de pontos fortes, que registra o que foi verificado, e a de não verificado, que registra o que ficou de fora.</p>`));

  // Pontos fortes — a seção que prova cobertura
  P.push(bloco('Pontos fortes, com evidência', fortes.length
    ? fortes.map(f => `<div class="forte"><b>${esc(f.id)}</b> — ${esc(f.verificado)}<br><span class="sub">${esc(f.evidencia)}</span></div>`).join('\n')
    : `<p class="vazio">Nenhum ponto forte registrado. Seção vazia num sistema que passou em vários requisitos indica julgamento incompleto, não sistema ruim.</p>`));

  // Exceções
  if (excecoes.length) {
    P.push(bloco('Decisões registradas', `<div class="rolagem"><table>
<thead><tr><th>Requisito</th><th>Motivo</th><th>Revisar em</th></tr></thead>
<tbody>${excecoes.map(e => `<tr><td><code>${esc(e.id)}</code></td><td>${esc(e.motivo)}${e.vencida ? ' <b style="color:var(--alta)">[prazo vencido: volta a ser achado]</b>' : ''}</td><td>${esc(e.revisarEm || '—')}</td></tr>`).join('')}</tbody>
</table></div>
<p class="sub">Não são falhas: são decisões conscientes, com dono e prazo. Prazo vencido volta a ser achado, com a severidade original.</p>`));
  }

  // Não verificado — obrigatório
  P.push(bloco('Não verificado, e por quê', naoVerificado.length
    ? `<div class="rolagem"><table><thead><tr><th>Requisito</th><th>Motivo</th></tr></thead>
<tbody>${naoVerificado.map(n => `<tr><td><code>${esc(n.id)}</code></td><td>${esc(n.motivo)}</td></tr>`).join('')}</tbody></table></div>
<p class="sub">Omitir o que não foi testado é mentir por omissão, e é o defeito mais comum de auditoria apressada. Por isso esta seção existe mesmo quando é inconveniente.</p>`
    : `<p class="vazio">Todo requisito aplicável foi verificado.</p>`));

  if (naoSeAplica.length) {
    P.push(bloco('O que não se aplica', `<p>${naoSeAplica.map(f => `<code>${esc(f)}</code>`).join(' · ')}</p>
<p class="sub">Famílias fora do perfil deste sistema. Não foram verificadas porque não há o que verificar.</p>`));
  }

  // Tarefas
  if (validos.length) {
    P.push(bloco('Tarefas, prontas para acompanhar', `<div class="aviso">Achado
    explorável não vira tarefa pública. O que estiver marcado como crítico ou
    alto e for alcançável de fora segue por canal privado até a correção
    entrar.</div>
<pre>${esc(montarTarefas(validos))}</pre>`));
  }

  P.push(`<div class="rodape">
Gerado a partir de <code>achados.json</code> por <code>relatorio.js</code>.
O julgamento é de quem auditou; este documento apenas o apresenta.
Guardar junto do perfil e dos achados permite comparar com a próxima auditoria.
</div>`);

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Auditoria de segurança — ${esc(projeto)}</title>
<style>${css}</style>
</head>
<body><main class="folha">
${P.join('\n\n')}
</main></body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Principal
// ---------------------------------------------------------------------------
function main() {
  const o = args();
  if (!o.livres.length) {
    morrer('falta o arquivo de achados.',
      'node relatorio.js <achados.json> [--perfil perfil.json] [--saida pasta] [--tema arquivo.css]',
      'O contrato do achados.json está em referencias/relatorio.md');
  }
  const entrada = o.livres[0];
  if (!fs.existsSync(entrada)) morrer(`arquivo não encontrado: ${entrada}`);

  let d;
  try { d = JSON.parse(fs.readFileSync(entrada, 'utf8')); }
  catch (e) { morrer(`o arquivo de achados não é JSON válido: ${e.message}`); }
  if (!Array.isArray(d.achados)) {
    morrer('o arquivo precisa ter a lista "achados", mesmo que vazia.',
      'Auditoria sem achado é resultado legítimo, e o documento sai dizendo isso.');
  }

  let perfil = null;
  if (o.perfil) {
    if (!fs.existsSync(o.perfil)) morrer(`perfil não encontrado: ${o.perfil}`);
    perfil = JSON.parse(fs.readFileSync(o.perfil, 'utf8'));
  }

  // A trava de segredo, ANTES de montar qualquer coisa.
  const vazamentos = [];
  varrerSegredo(d, 'achados', vazamentos);
  if (vazamentos.length) {
    morrer('há valor com formato de credencial no arquivo de achados. Nada foi gravado.',
      ...vazamentos.map(v => `${v.caminho} — parece ${v.o}`),
      '',
      'Nome, prefixo e localização provam que o segredo existe. O valor, nunca:',
      'o relatório circula, e transcrever a credencial transforma o achado num',
      'vazamento novo. Limpe os campos acima e rode de novo.');
  }

  let css = CSS_NEUTRO;
  if (o.tema) {
    if (!fs.existsSync(o.tema)) morrer(`tema não encontrado: ${o.tema}`);
    css = CSS_NEUTRO + '\n/* --- tema --- */\n' + fs.readFileSync(o.tema, 'utf8');
  }

  const projeto = d.projeto || (perfil && path.basename(perfil.projeto || '')) || 'sistema';
  const data = d.data || new Date().toISOString().slice(0, 10);
  const nome = `auditoria-${String(projeto).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${data}.html`;

  let destino = o.saida || path.join(path.dirname(entrada), 'docs', 'seguranca');
  if (destino.endsWith('.html')) {
    const pasta = path.dirname(destino);
    if (pasta && !fs.existsSync(pasta)) fs.mkdirSync(pasta, { recursive: true });
  } else {
    if (!fs.existsSync(destino)) fs.mkdirSync(destino, { recursive: true });
    destino = path.join(destino, nome);
  }

  fs.writeFileSync(destino, montar(d, perfil, css), 'utf8');

  const { validos, rebaixados } = triar(d.achados);
  console.log(`Relatório gravado: ${destino}`);
  console.log(`  ${validos.length} achado(s) · ${(d.pontosFortes || []).length} ponto(s) forte(s) · ${((d.naoVerificado || []).length + rebaixados.length)} não verificado(s)`);
  if (rebaixados.length) {
    console.log('');
    console.log('  Itens rebaixados de achado para não verificado, por falta de evidência:');
    rebaixados.forEach(r => console.log(`    ${r.id} — ${r.motivo}`));
  }
  console.log('');
  console.log('  Abre sem servidor. Para PDF, imprimir pelo navegador (A4 já está no estilo).');
}

if (require.main === module) main();
module.exports = { triar, varrerSegredo, PADROES_DE_SEGREDO };
