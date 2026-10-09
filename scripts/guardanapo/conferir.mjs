// A régua do Guardanapo sobre a cena, sem navegador.
//
// Uso: node scripts/guardanapo/conferir.mjs <pasta com cena.json>
//   sai 0 aprovada, 1 com erro de régua, 2 sem cena.json ou com JSON quebrado;
//   o que depende da largura do texto (linhas, área, margem, sobreposição) sai
//   como aviso estimado, e quem reprova isso é o render, que mede
//      node scripts/guardanapo/conferir.mjs --regua [--fonte hibrida|mao|inter]
//
// O que a construção do `desenhar.mjs` já impede (cor fora da paleta, destaque
// fora do quadro ponto, tracejado fora de `opcional`) aqui vira a porta fechada: o campo
// que tentaria abri-la reprova com o caminho certo. O resto (contagem,
// palavras, faixas, papéis dos quadros, número-prova, travessão, sobreposição,
// margem) é medido. O que só o navegador vê fica no `render.mjs`.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { T, avisosDeContraste } from './tokens.mjs';
import { NOS, letra, tamanhos, quebrar, caixa, pontasDaSeta, estados, nomeDaPessoa, areaLivre } from './geometria.mjs';

const TINTAS = ['problema', 'solucao', 'contexto'];
const FONTES = ['hibrida', 'mao', 'inter'];
const PAPEIS = ['capa', 'meio', 'ponto', 'fecho'];
const DESTAQUES = ['circulo', 'sublinhado', 'foco', 'seta'];
const LADOS = ['acima', 'abaixo', 'direita', 'esquerda'];
const COMUNS = ['tipo', 'tinta', 'estrutura', 'opcional', 'riscado'];
const CAMPOS = {
  no: [...COMUNS, 'texto', 'x', 'y', 'largura', 'altura', 'preenchimento'],
  folha: [...COMUNS, 'texto', 'x', 'y', 'largura', 'altura', 'preenchimento'],
  elipse: [...COMUNS, 'texto', 'x', 'y', 'largura', 'altura', 'preenchimento'],
  losango: [...COMUNS, 'texto', 'x', 'y', 'largura', 'altura', 'preenchimento'],
  pessoa: [...COMUNS, 'texto', 'x', 'y'],
  grupo: [...COMUNS, 'texto', 'contem', 'preenchimento'],
  anotacao: [...COMUNS, 'texto', 'x', 'y', 'largura', 'aponta'],
  texto: [...COMUNS, 'texto', 'x', 'y', 'largura'],
  certo: [...COMUNS, 'x', 'y'],
  seta: [...COMUNS, 'de', 'para', 'curva', 'saida', 'ate', 'rotulo', 'lado'],
  linha: [...COMUNS, 'pontos', 'fino'],
};
const PORTA = {
  cor: 'a cor sai da tinta (problema, solucao, contexto)',
  stroke: 'a cor sai da tinta (problema, solucao, contexto)',
  fill: 'o preenchimento é "chapado" ou "hachura"',
  tracejado: 'o tracejado só sai de "opcional": true',
  strokeStyle: 'o tracejado só sai de "opcional": true',
  rugosidade: 'a rugosidade é a do guia (1), fixa',
};
const NUMERO_PROVA = /\d+(?:[.,]\d+)?\s?%|R\$\s?\d/;
const TRAVESSAO = /[–—]/;
const palavras = (s) => String(s ?? '').split(/\s+/).filter(Boolean).length;
// a borda: o nome vira atributo no SVG, e o número vira coordenada de traço;
// nada que chegue de fora entra cru
const NOME = /^[A-Za-z0-9_-]+$/;
const ehPonto = (p) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite);
// o nome existe na tabela dela mesma, nunca herdado ("constructor", "toString")
const tem = (obj, k) => typeof k === 'string' && Object.hasOwn(obj, k);
const ehObjeto = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const ehListaDeNomes = (x) => Array.isArray(x) && x.every((v) => typeof v === 'string');

// a forma de cada peça da cena, antes de ler campo de qualquer uma
function conferirForma(cena, e) {
  for (const [id, el] of Object.entries(cena.elementos)) {
    if (!ehObjeto(el)) e(`"${id}" não é um objeto`);
    else if (el.contem !== undefined && !ehListaDeNomes(el.contem)) e(`"${id}" tem "contem" que não é lista de nomes`);
  }
  cena.quadros.forEach((q, i) => {
    const onde = `quadro ${i + 1}`;
    if (!ehObjeto(q)) { e(`o ${onde} não é um objeto`); return; }
    for (const campo of ['titulo', 'frase']) {
      if (q[campo] !== undefined && typeof q[campo] !== 'string') e(`o ${onde} tem "${campo}" que não é texto`);
    }
    if (q.mostrar !== undefined && !ehListaDeNomes(q.mostrar)) e(`o ${onde} tem "mostrar" que não é lista de nomes`);
    if (q.destaque !== undefined && !ehObjeto(q.destaque)) e(`o ${onde} tem "destaque" que não é objeto { tipo, alvo }`);
  });
}

function conferirElementos(cena, e) {
  for (const [id, el] of Object.entries(cena.elementos)) {
    if (!NOME.test(id)) { e(`o nome "${id}" tem caractere fora de letras, números, _ e -`); continue; }
    if (!tem(CAMPOS, el.tipo)) { e(`"${id}" tem o tipo "${el.tipo}", que não existe (${Object.keys(CAMPOS).join(', ')})`); continue; }
    for (const k of Object.keys(el)) {
      if (tem(PORTA, k)) e(`"${id}" tem o campo "${k}": ${PORTA[k]}`);
      else if (!CAMPOS[el.tipo].includes(k)) e(`"${id}" tem o campo "${k}", que o tipo ${el.tipo} não usa`);
    }
    for (const campo of ['largura', 'altura', 'curva']) {
      if (el[campo] !== undefined && !Number.isFinite(el[campo])) e(`"${id}" tem "${campo}" que não é número`);
    }
    if (el.tinta && !TINTAS.includes(el.tinta)) e(`"${id}" tem a tinta "${el.tinta}" (${TINTAS.join(', ')})`);
    if (el.preenchimento && !['chapado', 'hachura'].includes(el.preenchimento)) e(`"${id}" tem o preenchimento "${el.preenchimento}" (chapado ou hachura)`);
    if (el.preenchimento === 'hachura' && el.texto) e(`"${id}" tem hachura com texto: a hachura vai só em forma sem texto`);
    const cita = (campo, alvo) => { if (alvo !== undefined && !tem(cena.elementos, alvo)) e(`"${id}" aponta para "${alvo}", que não existe (${campo})`); };
    if (el.tipo === 'seta') {
      if (!el.de) e(`"${id}" não tem origem ("de")`);
      cita('de', el.de);
      if (el.saida) {
        if (el.ate === undefined) e(`"${id}" é saída sem o ponto "ate"`);
        else if (!ehPonto(el.ate)) e(`"${id}" tem "ate" que não é ponto [x, y]`);
      } else if (!el.para) e(`"${id}" não tem destino: "para", ou "saida" com "ate"`);
      cita('para', el.para);
      if (el.lado !== undefined && !LADOS.includes(el.lado)) e(`"${id}" tem o lado "${el.lado}" (${LADOS.join(', ')})`);
    }
    if (el.tipo === 'anotacao') cita('aponta', el.aponta);
    if (el.tipo === 'grupo') for (const f of el.contem || []) cita('contem', f);
    if (el.tipo === 'linha') {
      if (!(Array.isArray(el.pontos) && el.pontos.length >= 2)) e(`"${id}" é linha sem dois "pontos"`);
      else if (!el.pontos.every(ehPonto)) e(`"${id}" tem ponto que não é número`);
    }
    if (CAMPOS[el.tipo].includes('x') && !(Number.isFinite(el.x) && Number.isFinite(el.y))) e(`"${id}" sem posição "x" e "y"`);
  }
}

// os textos: palavras por papel, travessão e número-prova na letra de mão
function conferirTextos(cena, e, { semMedida }) {
  const mao = (papel) => letra(papel, cena).familia === T.familia.mao;
  for (const [id, el] of Object.entries(cena.elementos)) {
    const texto = el.tipo === 'seta' ? el.rotulo : el.texto;
    if (!texto) continue;
    const teto = el.tipo === 'anotacao' ? T.anotacaoPalavras : T.nivel.rotulo.palavras;
    const nome = el.tipo === 'anotacao' ? `anotação "${id}"` : `rótulo de "${id}"`;
    if (palavras(texto) > teto) e(`${nome} tem ${palavras(texto)} palavras (o teto é ${teto})`);
    if (TRAVESSAO.test(texto)) e(`travessão em "${id}": use ponto, vírgula ou dois-pontos`);
    const n = String(texto).match(NUMERO_PROVA);
    if (n && mao('rotulo')) e(`número-prova "${n[0]}" na letra de mão em "${id}": número que é prova vai na frase, na Inter ("fonte": "hibrida" põe a frase nela)`);
  }
  cena.quadros.forEach((q, i) => {
    const onde = `quadro ${i + 1}`;
    if (!q.titulo) { e(`${onde} sem título`); return; }
    if (palavras(q.titulo) > T.nivel.titulo.palavras) e(`título do ${onde} tem ${palavras(q.titulo)} palavras (o teto é ${T.nivel.titulo.palavras})`);
    for (const [papel, s] of [['titulo', q.titulo], ['frase', q.frase]]) {
      if (!s) continue;
      if (TRAVESSAO.test(s)) e(`travessão no ${papel === 'titulo' ? 'título' : 'frase'} do ${onde}: use ponto, vírgula ou dois-pontos`);
      const n = s.match(NUMERO_PROVA);
      if (n && mao(papel)) e(`número-prova "${n[0]}" na letra de mão ${papel === 'titulo' ? 'no título' : 'na frase'} do ${onde}: número que é prova vai na frase, na Inter ("fonte": "hibrida" põe a frase nela)`);
      if (semMedida) continue;
      const L = letra(papel, cena);
      const nl = quebrar(s, T.quadro.largura - 2 * T.margem, tamanhos(cena)[papel], L).length;
      if (nl > 2) e(`${papel === 'titulo' ? 'o título' : 'a frase'} do ${onde} quebra em ${nl} linhas (o teto é 2)`);
    }
  });
}

function conferirQuadros(cena, e) {
  const carrossel = cena.formato === 'carrossel';
  cena.quadros.forEach((q, i) => {
    const onde = `quadro ${i + 1}`;
    for (const id of q.mostrar || []) if (!tem(cena.elementos, id)) e(`${onde} mostra "${id}", que não existe`);
    if (carrossel && !PAPEIS.includes(q.papel)) e(`${onde} tem o papel "${q.papel}" (${PAPEIS.join(', ')})`);
    if (cena.formato === 'post' && q.papel === 'capa') e('o post não tem capa: é um quadro só (papel "ponto", ou sem papel)');
    if (q.papel === 'capa') {
      if (q.frase) e('a capa tem frase: ela é só o título e a estrutura');
      if (q.destaque) e('a capa tem destaque: a cor de destaque fica no quadro ponto');
    }
    const d = q.destaque;
    if (!d) return;
    if (carrossel && !['ponto', 'fecho', 'capa'].includes(q.papel)) e(`${onde} (${q.papel}) tem destaque: a cor de destaque fica no quadro ponto (e no fecho)`);
    if (!DESTAQUES.includes(d.tipo)) e(`o destaque do ${onde} tem o tipo "${d.tipo}" (${DESTAQUES.join(', ')})`);
    if (d.alvo === 'titulo') {
      if (!d.palavra || !String(q.titulo ?? '').toLowerCase().includes(String(d.palavra).toLowerCase())) e(`o destaque do ${onde} aponta a palavra "${d.palavra}", que não está no título`);
    } else if (!tem(cena.elementos, d.alvo)) e(`o destaque do ${onde} aponta "${d.alvo}", que não existe`);
    else if (d.tipo === 'circulo' && NOS.has(cena.elementos[d.alvo].tipo)) e(`o círculo do ${onde} está em volta do nó "${d.alvo}": o círculo é para palavra ou número, e o nó focal é "foco"`);
    if (d.tipo === 'seta' && !ehPonto(d.de)) e(`o destaque seta do ${onde} precisa do ponto "de"`);
  });
  if (carrossel) {
    const pontos = cena.quadros.filter((q) => q.papel === 'ponto').length;
    if (pontos === 0) e('nenhum quadro ponto: o carrossel tem exatamente um, e é nele que a cor de destaque entra');
    if (pontos > 1) e(`${pontos} quadros ponto: o carrossel tem exatamente um`);
  }
}

// a caixa que o elemento ocupa no quadro, com o nome da pessoa por cima dela
function ocupa(id, cena) {
  const el = cena.elementos[id];
  if (el.tipo === 'seta') {
    const { inicio, fim } = pontasDaSeta(el, cena);
    return { x: Math.min(inicio[0], fim[0]), y: Math.min(inicio[1], fim[1]), w: Math.abs(fim[0] - inicio[0]), h: Math.abs(fim[1] - inicio[1]) };
  }
  const c = caixa(id, cena);
  if (el.tipo === 'pessoa' && el.texto) {
    const { topo } = nomeDaPessoa(c, cena);
    return { ...c, y: topo, h: c.y + c.h - topo };
  }
  return c;
}

const cruza = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

function conferirGeometria(cena, est, e) {
  const tam = tamanhos(cena);
  const larg = T.quadro.largura - 2 * T.margem;
  const ordem = Object.keys(cena.elementos);
  est.forEach((m, i) => {
    const q = cena.quadros[i];
    const onde = `quadro ${i + 1}`;
    const linhas = (papel) => (q[papel] ? quebrar(q[papel], larg, tam[papel], letra(papel, cena)).length : 0);
    const { piso, teto } = areaLivre(linhas('titulo'), linhas('frase'), cena);
    const ids = [...m.keys()].sort((a, b) => ordem.indexOf(a) - ordem.indexOf(b));
    const caixas = new Map(ids.map((id) => [id, ocupa(id, cena)]));
    for (const [id, c] of caixas) {
      if (c.x < T.margem - 0.5 || c.x + c.w > T.quadro.largura - T.margem + 0.5 || c.y + c.h > T.quadro.altura - T.margem + 0.5) {
        e(`"${id}" passa da margem de ${T.margem} px no ${onde}`);
      } else if (c.y < piso) e(`"${id}" encosta no título do ${onde}: o desenho começa em ${Math.round(c.y)} e a área livre começa em ${Math.ceil(piso)}`);
      else if (c.y + c.h > teto) e(`"${id}" encosta na frase do ${onde}: o desenho termina em ${Math.round(c.y + c.h)} e a área livre termina em ${Math.floor(teto)}`);
    }
    const solidos = ids.filter((id) => NOS.has(cena.elementos[id].tipo) || ['anotacao', 'texto'].includes(cena.elementos[id].tipo));
    for (let a = 0; a < solidos.length; a++) {
      for (let b = a + 1; b < solidos.length; b++) {
        if (cruza(caixas.get(solidos[a]), caixas.get(solidos[b]))) e(`"${solidos[a]}" e "${solidos[b]}" se sobrepõem no ${onde}`);
      }
    }
  });
}

/**
 * A régua sobre a cena: { erros, medidas }. Nunca lança: todo problema vira linha.
 * `semMedida`: pula o que depende da largura do texto (as linhas do título e da
 * frase, a área livre, a margem e a sobreposição). O render usa assim antes de
 * medir, e roda a régua inteira de novo com a largura real de cada palavra.
 */
export function conferir(cena, { semMedida = false } = {}) {
  const erros = [];
  const e = (m) => erros.push(m);
  if (!ehObjeto(cena)) return { erros: ['a cena não é um objeto'], medidas: null };
  if (!tem(T.teto, cena.formato)) e(`o formato "${cena.formato}" não existe (${Object.keys(T.teto).join(', ')})`);
  if (cena.fonte && !FONTES.includes(cena.fonte)) e(`a fonte "${cena.fonte}" não existe (${FONTES.join(', ')})`);
  if (cena.tamanhos !== undefined && !ehObjeto(cena.tamanhos)) e('"tamanhos" não é um objeto { titulo, rotulo, frase }');
  if (!ehObjeto(cena.elementos)) e('a cena não tem "elementos"');
  if (!Array.isArray(cena.quadros) || !cena.quadros.length) e('a cena não tem quadros');
  if (erros.length) return { erros, medidas: null };
  conferirForma(cena, e);
  if (erros.length) return { erros, medidas: null };
  if (cena.formato === 'post' && cena.quadros.length !== 1) e(`o post tem ${cena.quadros.length} quadros: é um só`);
  const tam = tamanhos(cena);
  for (const nivel of ['titulo', 'rotulo', 'frase']) {
    const { min, max } = T.nivel[nivel];
    if (!Number.isFinite(tam[nivel])) e(`o tamanho ${nivel} não é número`);
    else if (tam[nivel] < min || tam[nivel] > max) e(`nível ${nivel} em ${tam[nivel]} px: a faixa é ${min} a ${max}`);
  }
  conferirElementos(cena, e);
  conferirQuadros(cena, e);
  conferirTextos(cena, e, { semMedida });
  if (erros.length) return { erros, medidas: null };
  const est = estados(cena);
  const nos = est.map((m) => [...m.keys()].filter((id) => NOS.has(cena.elementos[id].tipo)).length);
  const tetoNos = T.teto[cena.formato];
  nos.forEach((n, i) => {
    const q = cena.quadros[i];
    if (n > tetoNos) e(`quadro ${i + 1}${q.papel ? ` (${q.papel})` : ''}: ${n} nós, e o teto do ${cena.formato} é ${tetoNos}`);
  });
  if (!semMedida) conferirGeometria(cena, est, e);
  return { erros, medidas: { quadros: cena.quadros.length, nos, niveis: tam } };
}

/** De onde a cor da peça vem: a marca configurada, ou a paleta neutra. */
export function origemDaPaleta() {
  return T.marca.origem === 'marca'
    ? `cores da marca: ${T.marca.arquivo}`
    : 'cores da paleta neutra (a marca não está configurada: /carrossel configurar a grava)';
}

/** Lê a cena da pasta. Lança Error com `codigo` 2 quando a entrada está quebrada. */
export function lerCena(pasta) {
  const arquivo = join(pasta, 'cena.json');
  const falha = (msg) => Object.assign(new Error(msg), { codigo: 2 });
  if (!existsSync(arquivo)) throw falha(`não achei ${arquivo}`);
  try {
    return JSON.parse(readFileSync(arquivo, 'utf8'));
  } catch (err) {
    throw falha(`a cena.json não é JSON válido: ${err.message}`);
  }
}

/**
 * A régua em texto, lida do tokens.mjs: é o que a skill manda consultar, sem
 * copiar número. A área do desenho sai da mesma conta que a conferência usa,
 * na fonte pedida.
 */
export function reguaEmTexto({ fonte } = {}) {
  const n = T.nivel;
  const cena = { fonte };
  const piso = (l) => Math.ceil(areaLivre(l, 0, cena).piso);
  const teto = (l) => Math.floor(areaLivre(0, l, cena).teto);
  return [
    `nós por quadro: carrossel até ${T.teto.carrossel}, post até ${T.teto.post}, slide e coluna até ${T.teto.slide} (pessoa conta; grupo, estrutura e anotação não)`,
    `palavras: título até ${n.titulo.palavras} (até 2 linhas), rótulo até ${n.rotulo.palavras}, anotação até ${T.anotacaoPalavras}`,
    `letra: título ${n.titulo.padrao} px (faixa ${n.titulo.min} a ${n.titulo.max}), rótulo ${n.rotulo.padrao} (${n.rotulo.min} a ${n.rotulo.max}), frase ${n.frase.padrao} (${n.frase.min} a ${n.frase.max})`,
    `quadro: ${T.quadro.largura} × ${T.quadro.altura}, margem ${T.margem} px`,
    `área do desenho (fonte ${fonte ?? T.fontePadrao}, tamanho padrão): começa em y ${piso(1)} com título de 1 linha e ${piso(2)} com 2; termina em y ${teto(1)} com frase de 1 linha e ${teto(2)} com 2, e em ${teto(0)} sem frase (o render confere com a quebra real)`,
    `traço: ${T.traco.base} px, destaque ${T.traco.destaque}, fino ${T.traco.fino}; rugosidade ${T.rugosidade}; raio do nó ${T.raio}`,
  ].join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href && process.argv[2] === '--regua') {
  const i = process.argv.indexOf('--fonte');
  const fonte = i > 0 ? process.argv[i + 1] : undefined;
  if (fonte !== undefined && !FONTES.includes(fonte)) {
    console.error(`🔴 a fonte "${fonte}" não existe (${FONTES.join(', ')})`);
    process.exit(2);
  }
  console.log(reguaEmTexto({ fonte }));
  process.exit(0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const pasta = process.argv[2];
  if (!pasta) {
    console.error('uso: node scripts/guardanapo/conferir.mjs <pasta com cena.json>');
    process.exit(2);
  }
  let cena;
  try {
    cena = lerCena(pasta);
  } catch (err) {
    console.error(`🔴 ${err.message}`);
    process.exit(err.codigo ?? 2);
  }
  // reprova só o que não depende da largura do texto; a linha, a área, a margem
  // e a sobreposição aqui são estimadas, e quem decide é o render, que mede
  const { erros, medidas } = conferir(cena, { semMedida: true });
  if (erros.length) {
    console.log(`🔴 a cena reprovou em ${erros.length} ponto(s):`);
    for (const x of erros) console.log(`  - ${x}`);
    process.exit(1);
  }
  const avisos = conferir(cena).erros;
  const { titulo, rotulo, frase } = medidas.niveis;
  console.log(`✅ aprovada: ${medidas.quadros} quadro${medidas.quadros === 1 ? '' : 's'}, nós por quadro [${medidas.nos.join(', ')}], níveis ${titulo}/${rotulo}/${frase} px`);
  console.log(`   ${origemDaPaleta()}`);
  for (const x of avisosDeContraste(T.cor)) console.log(`⚠️ ${x}`);
  if (avisos.length) {
    console.log(`⚠️ aviso em ${avisos.length} ponto(s), estimado; o render decide com a largura real:`);
    for (const x of avisos) console.log(`  - ${x}`);
  } else console.log('   (a largura do texto aqui é estimada; o render confere tudo de novo com a largura real)');
}
