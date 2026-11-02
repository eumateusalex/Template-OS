// O plano da peça: confere, preenche pelo corte, gera a tabela e a página de
// planejamento, e importa o que ele ajustou. A régua é a de roteiro.md, cenas.md e manual/reel/.
//
//   node plano.mjs conferir  <pasta>               # erros e avisos; sai 1 com erro
//   node plano.mjs preencher <pasta>               # falado: de, ate e fala pelo dados.js da /cortes
//   node plano.mjs tabela    <pasta>               # a tabela para o roteiro.md
//   node plano.mjs pagina    <pasta>               # planejamento.html, para ele ajustar
//   node plano.mjs importar  <pasta> <arquivo>     # o plano que ele baixou da página
//
// Na pasta: plano.json; no falado, também o dados.js que a montagem da /cortes gera.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chamadoDireto } from './principal.mjs';
import { conferirExtra } from './plano-extra.mjs';
import { conferirFaladoExtra } from './falado-extra.mjs';
import { calibrar, conferirExcecoes } from './excecoes.mjs';
import { perfilDoPlano } from './linguagem.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
// os destinos da /video: o campo formato do plano é uma chave de lá
const FORMATOS = join(AQUI, '..', '..', 'video', 'ferramentas', 'formatos.json');
const lerFormatos = () => (existsSync(FORMATOS) ? JSON.parse(readFileSync(FORMATOS, 'utf8')) : null);

export const TIPOS = {
  falado: ['legenda', 'legenda-interface', 'meia-tela', 'tela-cheia'],
  puro: ['texto', 'pessoa', 'objeto', 'grafico']
};
export const FUNCOES = ['HOOK', 'PROMISE', 'PROBLEM', 'CONTEXT', 'DEMONSTRATION', 'PROOF', 'EXPLANATION', 'PROCESS',
  'TENSION', 'COMPARISON', 'TRANSFORMATION', 'REVEAL', 'BRAND', 'CTA', 'EMOTION'];
export const CAMERAS = ['PARADA', 'EMPURRA', 'RECUA', 'DESCE', 'SOBE', 'ACOMPANHA', 'REENQUADRA', 'MACRO'];
// o que ele ajusta na página; o tempo das frases vem do corte e não muda por lá
export const EDITAVEIS = ['tipo', 'funcao', 'visual', 'camera', 'motivo', 'texto_tela', 'componente', 'porque', 'nota'];
const COM_ROSTO = new Set(['legenda', 'legenda-interface', 'meia-tela']);
const LEITURA_CPS = 17;
const LEITURA_FOLGA = 0.5;
const LEITURA_PISO = 1.2;
const ROSTO_MAX = 8;
// no falado, a cena de animação gasta a entrada e a saída do falado.js (em quadros): o texto
// dela fica legível só no meio. A fonte é esta; a montagem passa os números ao motor (TEMPOS)
export const TEMPOS_FALADO = { entrada: 14, saida: 10 };
// o desfoque do zoom-dentro: acima de 24 px a tela some numa mancha (o uso comum fica em 15 a 25)
const DESFOQUE_MAX = 24;
// a escala da câmera: até 1,2× é o padrão (manual: comum.camera-e-luz.escala-da-camera); o zoom de ênfase forte vai de 1,5 a 1,8, e
// acima de 2 o rosto vira textura
const ESCALA_PADRAO = 1.2, ESCALA_MAX = 2;

// o zoom na câmera do rosto ({em, escala, ancora_y, quadros, volta, quadros_volta}), feito pelo falado.js: o
// de ênfase empurra e segura; o de transição nasce grande (quadros 0) e volta
function conferirZoom(c, prox, erro, erros) {
  const z = c.zoom, de = Number(c.de), ate = Number(c.ate), em = Number(z.em), s = Number(z.escala);
  if (c.tipo === 'tela-cheia') return erro('zoom', `${c.id}: o zoom é da câmera do rosto, e a tela cheia cobre o rosto`);
  if (!(s > 1 && s <= ESCALA_MAX)) erro('zoom', `${c.id}: a escala do zoom vai de 1 a ${ESCALA_MAX}, não ${z.escala}`);
  if (!(Number(z.ancora_y) >= 0 && Number(z.ancora_y) <= 1920)) erro('zoom', `${c.id}: o zoom pede a âncora (ancora_y, em px de 1920; o queixo deixa a legenda parada)`);
  if (Number.isFinite(de) && Number.isFinite(ate) && !(em >= de && em < ate)) erro('zoom', `${c.id}: o zoom começa em ${z.em}, fora da cena (${de} a ${ate})`);
  const chega = em + (z.quadros == null ? 5 : Number(z.quadros)) / 30;
  if (!(z.quadros == null || (Number.isInteger(Number(z.quadros)) && Number(z.quadros) >= 0))) erro('zoom', `${c.id}: os quadros do zoom são um inteiro de 0 para cima, não ${z.quadros}`);
  // a volta pode passar do corte quando a cena seguinte também é o rosto cheio (a câmera é a mesma):
  // segurar a escala até o fim da palavra, em vez de soltar num quadro no corte de tomada
  const teto = prox && prox.tipo === 'legenda' && Number.isFinite(Number(prox.ate)) ? Number(prox.ate) : ate;
  if (z.volta != null && !(Number(z.volta) >= chega - 1e-6 && Number(z.volta) + Number(z.quadros_volta ?? 8) / 30 <= teto + 1e-6)) erro('zoom', `${c.id}: a volta do zoom (${z.volta}) começa depois de o zoom chegar e termina dentro da cena (ou da seguinte, quando ela também é o rosto cheio)`);
  if (z.volta == null && prox && prox.tipo !== 'legenda') erro('zoom', `${c.id}: sem a volta, o zoom só desfaz no corte para outra cena de rosto cheio; a ${prox.id} é ${prox.tipo}`);
  if (s > ESCALA_PADRAO) erros.push({ regra: 'zoom', calibragem: true, msg: `${c.id}: a câmera vai a ${s}×, acima do padrão de ${ESCALA_PADRAO}× (manual: comum.camera-e-luz.escala-da-camera); o motivo vai em "excecoes"` });
}
const ENTRADA_SAIDA_FALADO = (TEMPOS_FALADO.entrada + TEMPOS_FALADO.saida) / 30;

// o dados.js que a montagem da /cortes gera (scripts/reel-falado/montar.mjs) é o contrato
// do modo falado: lido num lugar só, com os campos conferidos, para a mudança do formato
// lá falhar alto aqui, e não passar calada
export function lerDados(pasta) {
  const arq = join(pasta, 'dados.js');
  if (!existsSync(arq)) return null;
  const txt = readFileSync(arq, 'utf8').trim();
  if (!txt.startsWith('window.DADOS')) throw new Error('o dados.js da /cortes mudou: não começa com "window.DADOS ="');
  const d = JSON.parse(txt.replace(/^window\.DADOS\s*=\s*/, '').replace(/;\s*$/, ''));
  const falta = [];
  if (!(d.END > 0)) falta.push('END');
  if (!Array.isArray(d.frases) || !d.frases.length) falta.push('frases');
  else for (const k of ['frase', 'texto', 't_de', 't_ate']) if (!d.frases.every((f) => k in f)) falta.push(`frases[].${k}`);
  if (!Array.isArray(d.legendas)) falta.push('legendas');
  if (!d.ficha || !(d.ficha.posicao_y > 0)) falta.push('ficha.posicao_y');
  if (falta.length) throw new Error(`o dados.js da /cortes mudou: falta ${falta.join(', ')} (a /mograph lê esses campos)`);
  return d;
}

// o tempo mínimo de um texto na tela: caracteres ÷ 17 + 0,5 s, nunca abaixo de 1,2 s
export function tempoMinimo(texto) {
  const n = [...String(texto || '').trim()].length;
  return n ? Math.max(LEITURA_PISO, n / LEITURA_CPS + LEITURA_FOLGA) : 0;
}

const palavras = (t) => String(t || '').trim().split(/\s+/).filter(Boolean).length;

export function conferirPlano(plano, { dados = null, catalogo = null, linguagens = null, estilos = null } = {}) {
  const erros = [], avisos = [];
  const erro = (regra, msg) => erros.push({ regra, msg });
  const aviso = (regra, msg) => avisos.push({ regra, msg });
  if (!TIPOS[plano.modo]) { erro('modo', `modo "${plano.modo}" não existe: falado ou puro`); return { erros, avisos }; }
  if (!['organico', 'anuncio'].includes(plano.destino)) erro('destino', `destino "${plano.destino}" não existe: organico ou anuncio`);
  const cenas = plano.cenas || [];
  if (!cenas.length) { erro('cenas', 'o plano não tem cenas'); return { erros, avisos }; }
  const fps = plano.fps || 30;
  const entradas = new Map((catalogo?.entradas || []).map((e) => [e.id, e]));
  // a linguagem e o estilo da peça (linguagem.mjs): o que eles dispensam muda as contas do plano-extra
  const perfil = perfilDoPlano(plano, { linguagens, estilos });
  erros.push(...perfil.erros);

  cenas.forEach((c, i) => {
    const id = c.id || `cena ${i + 1}`;
    if (c.id !== `S${String(i + 1).padStart(2, '0')}`) erro('id', `${id}: os ids seguem a ordem, S01, S02…; esperado S${String(i + 1).padStart(2, '0')}`);
    if (!TIPOS[plano.modo].includes(c.tipo)) erro('tipo', `${id}: o tipo "${c.tipo}" não é do modo ${plano.modo} (${TIPOS[plano.modo].join(', ')})`);
    if (!FUNCOES.includes(c.funcao)) erro('funcao', `${id}: a função "${c.funcao}" não está entre as quinze de roteiro.md`);
    if (!CAMERAS.includes(c.camera || 'PARADA')) erro('camera', `${id}: a câmera "${c.camera}" não é do vocabulário do manual (comum/camera-e-luz.md)`);
    else if ((c.camera || 'PARADA') !== 'PARADA') {
      if (!String(c.motivo || '').trim()) erro('camera', `${id}: a câmera ${c.camera} não tem motivo; sem motivo, a câmera é PARADA`);
      else if (palavras(c.motivo) > 6) aviso('camera', `${id}: o motivo da câmera tem ${palavras(c.motivo)} palavras; até 6`);
    }
    if (c.saida && !/^[xyz][+-]$/.test(c.saida)) erro('saida', `${id}: a saída "${c.saida}" não é eixo e sentido (x+, x-, y+, y-, z+, z-)`);
    if (c.componente) {
      const e = entradas.get(c.componente);
      if (catalogo && !e) erro('componente', `${id}: o componente "${c.componente}" não está na biblioteca`);
      else if (e?.estado === 'recusado') erro('componente', `${id}: o componente "${c.componente}" foi recusado pelo usuário ("${e.recusa?.frase}")`);
    }
    if (c.tipo === 'legenda-interface' && plano.interface_aprovada !== true) {
      erro('interface', `${id}: a interface sobre a câmera só entra depois que o usuário a vir na prancha e escolher ("interface_aprovada": true, com a frase no brief.md)`);
    }
    const dur = Number(c.ate) - Number(c.de);
    if (!Number.isFinite(dur) || dur <= 0) {
      erro('tempo', `${id}: sem o tempo (de, ate)${plano.modo === 'falado' ? '; rode o preencher, que lê o corte da /cortes' : ''}`);
    } else if (c.texto_tela) {
      const min = tempoMinimo(c.texto_tela);
      const animada = plano.modo === 'falado' && c.tipo !== 'legenda';
      // o texto que entra aos poucos (a letra digitada, a palavra que sobe) só se lê inteiro: a
      // conta vai do instante em que ele completa, o texto_inteiro_em, até o fim da cena
      const inteiro = c.texto_inteiro_em == null ? null : Number(c.texto_inteiro_em);
      if (inteiro == null && entradas.get(c.componente)?.texto_progressivo) {
        erro('leitura', `${id}: o componente ${c.componente} entra o texto aos poucos; diga em texto_inteiro_em o instante (s da peça) em que "${c.texto_tela}" fica inteiro, porque a leitura conta dali`);
      } else if (inteiro != null && !(inteiro >= Number(c.de) && inteiro < Number(c.ate))) {
        erro('leitura', `${id}: o texto_inteiro_em ${c.texto_inteiro_em} cai fora da cena (${c.de} a ${c.ate} s)`);
      } else {
        const util = inteiro != null ? Number(c.ate) - inteiro - (animada ? TEMPOS_FALADO.saida / 30 : 0) : animada ? dur - ENTRADA_SAIDA_FALADO : dur;
        const como = inteiro != null ? ` inteiro (de ${inteiro} s ao fim da cena)` : animada ? ' (sem a entrada e a saída da cena)' : '';
        if (util + 1e-6 < min) erro('leitura', `${id}: "${c.texto_tela}" pede ${min.toFixed(2)} s legível e a cena dá ${util.toFixed(2)} s${como}`);
      }
    }
    // sem voz (só no puro), a tela carrega a frase inteira: o teto sobe, e o tempo de leitura segue cobrando
    const semVoz = plano.modo === 'puro' && plano.voz === false;
    const teto = semVoz ? 8 : 4;
    if (palavras(c.texto_tela) > teto) aviso('palavras', `${id}: o texto da tela tem ${palavras(c.texto_tela)} palavras; ${semVoz ? 'sem voz, até 8 (uma frase curta por tela)' : 'com voz, até 4 (a tela traz a palavra-chave)'}`);
  });

  if (plano.modo === 'puro') {
    if (!(plano.duracao > 0)) erro('soma', 'o motion puro precisa da duração total');
    const tol = 1 / fps;
    if (Math.abs(Number(cenas[0].de)) > tol) erro('soma', `a primeira cena começa em ${cenas[0].de} s, não em 0`);
    for (let i = 1; i < cenas.length; i++) {
      const vao = Number(cenas[i].de) - Number(cenas[i - 1].ate);
      if (Math.abs(vao) > tol) erro('soma', `${cenas[i - 1].id} acaba em ${cenas[i - 1].ate} s e ${cenas[i].id} começa em ${cenas[i].de} s: ${vao > 0 ? 'buraco' : 'sobreposição'}`);
    }
    const ult = cenas[cenas.length - 1];
    if (Math.abs(Number(ult.ate) - plano.duracao) > tol) erro('soma', `a última cena acaba em ${ult.ate} s e a peça tem ${plano.duracao} s`);
  } else {
    for (let i = 1; i < cenas.length; i++) {
      if (!(cenas[i].frase > cenas[i - 1].frase)) erro('ordem', `${cenas[i].id}: a frase ${cenas[i].frase} vem depois da ${cenas[i - 1].frase} no plano, e não no corte; as cenas seguem a ordem das frases`);
    }
    if (dados?.frases) {
      const numeros = cenas.map((c) => c.frase);
      for (const fr of dados.frases) {
        const n = numeros.filter((x) => x === fr.frase).length;
        if (n === 0) erro('cobertura', `a frase ${fr.frase} ("${fr.texto}") não tem cena`);
        if (n > 1) erro('cobertura', `a frase ${fr.frase} tem ${n} cenas; uma por frase`);
      }
      for (const c of cenas) if (!dados.frases.some((fr) => fr.frase === c.frase)) erro('cobertura', `${c.id}: a frase ${c.frase} não existe no corte`);
    }
    // o falado.js faz o corte com a cena subindo, a continuidade entre duas telas cheias (a cena
    // de antes segue desenhando a de depois), o zoom-dentro do rosto para a tela cheia (a câmera
    // mergulha no rosto e a tela cheia nasce do zoom) e o flash de 6 quadros, um por peça, na virada
    // do ato: o plano não promete outra costura
    const FALADO = ['corte', 'continuidade', 'zoom-dentro', 'flash'];
    cenas.forEach((c, i) => {
      if (c.tipo === 'legenda' && String(c.texto_tela || '').trim()) erro('texto_tela', `${c.id}: cena de legenda não tem animação; o texto da tela não aparece (a legenda é a da /cortes)`);
      if (c.transicao && !FALADO.includes(c.transicao)) erro('transicao', `${c.id}: no falado a cena passa por ${FALADO.join(', ')} (o motor das cenas não faz "${c.transicao}")`);
      const prox = cenas[i + 1];
      if (c.transicao === 'zoom-dentro' && (c.tipo === 'tela-cheia' || !prox || prox.tipo !== 'tela-cheia')) erro('transicao', `${c.id}: o zoom-dentro vai de uma cena com o rosto para uma tela cheia`);
      const vetor = c.transicao === 'zoom-dentro' ? 'z+' : 'y-';
      // a alternância de direção: entre duas telas cheias pelo corte, a de depois pode entrar de lado
      // (x- vem da direita, x+ da esquerda); o motor só faz isso aí
      const deLado = /^x[+-]$/.test(c.saida || '') && c.tipo === 'tela-cheia' && prox?.tipo === 'tela-cheia' && (c.transicao || 'corte') === 'corte';
      if (c.saida && c.saida !== vetor && !deLado) erro('transicao', `${c.id}: no falado ${c.transicao === 'zoom-dentro' ? 'o zoom-dentro sai em z+' : 'a cena sai subindo (y-), ou de lado (x- ou x+) quando vai de uma tela cheia a outra pelo corte'}, não ${c.saida}`);
      if (c.desfoque != null) {
        if (c.transicao !== 'zoom-dentro') erro('transicao', `${c.id}: o desfoque é do zoom-dentro (a câmera que mergulha); a cena passa por ${c.transicao || 'corte'}`);
        else if (!(Number(c.desfoque) >= 4 && Number(c.desfoque) <= DESFOQUE_MAX)) erro('transicao', `${c.id}: o desfoque do zoom vai de 4 a ${DESFOQUE_MAX} px, não ${c.desfoque}`);
      }
      if (c.zoom) {
        // mais de um zoom na cena vai em lista, em ordem, um depois de o outro acabar
        let livre = -Infinity;
        for (const z of [].concat(c.zoom)) {
          conferirZoom({ ...c, zoom: z }, prox, erro, erros);
          if (!(Number(z.em) >= livre - 1e-6)) erro('zoom', `${c.id}: o zoom em ${z.em} começa antes de o anterior acabar (${livre.toFixed(3)})`);
          if (z.curva != null && !['rapida', 'lenta'].includes(z.curva)) erro('zoom', `${c.id}: a curva do zoom é "rapida" ou "lenta", não ${z.curva}`);
          livre = z.volta != null ? Number(z.volta) + Number(z.quadros_volta ?? 8) / 30 : Infinity;
        }
      }
    });
    if (cenas.filter((c) => c.transicao === 'flash').length > 1) erros.push({ regra: 'transicao', calibragem: true, msg: `o flash é um por peça (a virada do ato); o plano tem ${cenas.filter((c) => c.transicao === 'flash').length}` });
    if (cenas[0].tipo !== 'legenda') aviso('gancho', `S01 é ${cenas[0].tipo}: o gancho tem o rosto (reel.ritmo.gancho-com-o-rosto, proposta)`);
    // o rosto volta pelo menos a cada 8 s
    let semRosto = 0;
    for (const c of cenas) {
      const dur = Number(c.ate) - Number(c.de);
      semRosto = COM_ROSTO.has(c.tipo) ? 0 : semRosto + (Number.isFinite(dur) ? dur : 0);
      if (semRosto > ROSTO_MAX) { aviso('rosto', `até ${c.id}, ${semRosto.toFixed(1)} s sem o rosto; ele volta pelo menos a cada ${ROSTO_MAX} s (proposta)`); semRosto = 0; }
    }
    for (const c of cenas) if (c.tipo === 'tela-cheia' && !String(c.texto_tela || '').trim()) {
      aviso('tela-cheia', `${c.id}: tela cheia sem texto na tela; a legenda some nela, e quem vê sem som perde a frase`);
    }
  }
  // as contas da importância, do CTA, da segunda transformação, da vírgula, da legenda, do
  // tempo forte e do formato (plano-extra.mjs)
  const extra = conferirExtra(plano, { formatos: lerFormatos(), perfil });
  // no falado: a mídia das cenas, a palavra atrás da cabeça e a continuidade (falado-extra.mjs)
  const fal = plano.modo === 'falado' ? conferirFaladoExtra(plano) : { erros: [], avisos: [] };
  // a gravidade pela exceção da peça (excecoes.mjs), e a conferência das exceções escritas
  const r = calibrar({ erros: [...erros, ...extra.erros, ...fal.erros], avisos: [...avisos, ...extra.avisos, ...fal.avisos] }, plano);
  return { ...r, erros: [...r.erros, ...conferirExcecoes(plano)] };
}

// falado: cada cena vai do começo da frase dela ao começo da frase seguinte; a última, até o fim
export function preencherDoCorte(plano, dados) {
  const frases = [...dados.frases].sort((a, b) => a.t_de - b.t_de);
  const p = JSON.parse(JSON.stringify(plano));
  for (const c of p.cenas) {
    const i = frases.findIndex((fr) => fr.frase === c.frase);
    if (i < 0) continue;
    c.de = i === 0 ? 0 : +frases[i].t_de.toFixed(3);
    c.ate = i + 1 < frases.length ? +frases[i + 1].t_de.toFixed(3) : +Number(dados.END).toFixed(3);
    c.fala = frases[i].texto;
  }
  p.duracao = +Number(dados.END).toFixed(3);
  return p;
}

const celula = (v) => String(v ?? '').replace(/\|/g, '/').replace(/\n/g, ' ');

export function tabela(plano) {
  const L = ['| Cena | Tempo | Fala | Tipo | Função | O que se vê | Câmera | Texto na tela | Componente | O que o espectador entende |',
    '|---|---|---|---|---|---|---|---|---|---|'];
  for (const c of plano.cenas) {
    const tempo = Number.isFinite(+c.de) && Number.isFinite(+c.ate) ? `${(+c.de).toFixed(1)}–${(+c.ate).toFixed(1)} s` : '';
    const cam = (c.camera || 'PARADA') + (c.motivo ? ` (${c.motivo})` : '');
    L.push(`| ${c.id} | ${tempo} | ${celula(c.fala)} | ${c.tipo} | ${c.funcao} | ${celula(c.visual)} | ${celula(cam)} | ${celula(c.texto_tela)} | ${celula(c.componente)} | ${celula(c.entende)} |`);
  }
  return L.join('\n') + '\n';
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function pagina(plano, { catalogo = null } = {}) {
  const tipos = TIPOS[plano.modo] || [];
  const nomes = { 'legenda': 'só legenda', 'legenda-interface': 'legenda + interface', 'meia-tela': 'meia tela', 'tela-cheia': 'tela cheia',
    'texto': 'texto no centro', 'pessoa': 'pessoa no centro', 'objeto': 'objeto no centro', 'grafico': 'gráfico no centro' };
  const comps = (catalogo?.entradas || []).filter((e) => e.estado !== 'recusado').map((e) => e.id);
  const linhas = plano.cenas.map((c) => `
    <section class="cena" data-id="${esc(c.id)}">
      <div class="fala"><span class="id">${esc(c.id)}</span><span class="t">${Number.isFinite(+c.de) ? (+c.de).toFixed(1) + ' s' : ''}</span>
        <p>${esc(c.fala || c.mensagem)}</p><p class="entende">entende: ${esc(c.entende)}</p></div>
      <div class="plano">
        <div class="tipos">${tipos.map((t) => `<label><input type="radio" name="tipo-${esc(c.id)}" value="${t}"${c.tipo === t ? ' checked' : ''}> ${nomes[t] || t}</label>`).join('')}</div>
        <label>o que se vê <textarea data-campo="visual">${esc(c.visual)}</textarea></label>
        <div class="dupla"><label>câmera <select data-campo="camera">${CAMERAS.map((k) => `<option${(c.camera || 'PARADA') === k ? ' selected' : ''}>${k}</option>`).join('')}</select></label>
        <label>motivo <input data-campo="motivo" value="${esc(c.motivo)}"></label></div>
        <div class="dupla"><label>texto na tela <input data-campo="texto_tela" value="${esc(c.texto_tela)}"></label>
        <label>componente <input data-campo="componente" list="comps" value="${esc(c.componente)}"></label></div>
        <label>por quê <input data-campo="porque" value="${esc(c.porque)}"></label>
        <label>nota sua <input data-campo="nota" value="${esc(c.nota)}" placeholder="o que mudar nesta frase"></label>
      </div>
    </section>`).join('\n');
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Planejamento · ${esc(plano.nome)}</title>
<style>
  :root { --tinta:#111; --fundo:#fff; --linha:#e5e5e5; --cinza:#6e6e73; --acao:#0071e3; }
  * { box-sizing:border-box } body { margin:0; font:15px/1.45 -apple-system, "Inter", system-ui, sans-serif; color:var(--tinta); background:var(--fundo) }
  header { position:sticky; top:0; background:#fff; border-bottom:1px solid var(--linha); padding:16px 24px; display:flex; gap:16px; align-items:center; justify-content:space-between; z-index:2 }
  h1 { font-size:18px; margin:0 } header p { margin:2px 0 0; color:var(--cinza) }
  button { font:inherit; background:var(--acao); color:#fff; border:0; border-radius:980px; padding:10px 18px; cursor:pointer }
  main { max-width:1180px; margin:0 auto; padding:16px 24px 80px }
  .cena { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1.3fr); gap:24px; padding:20px 0; border-bottom:1px solid var(--linha) }
  .fala p { margin:6px 0; font-size:17px } .fala .entende { color:var(--cinza); font-size:14px }
  .id { font-weight:700; margin-right:8px } .t { color:var(--cinza) }
  .plano label { display:block; color:var(--cinza); font-size:13px; margin:8px 0 0 }
  .plano textarea, .plano input:not([type]), .plano select { display:block; width:100%; font:inherit; color:var(--tinta); border:1px solid var(--linha); border-radius:8px; padding:8px; margin-top:4px }
  .tipos { display:flex; flex-wrap:wrap; gap:6px 14px } .tipos label { color:var(--tinta); font-size:14px; margin:0 }
  .dupla { display:grid; grid-template-columns:1fr 1fr; gap:12px }
  @media (max-width:760px) { .cena { grid-template-columns:minmax(0,1fr) } .dupla { grid-template-columns:1fr } header { flex-direction:column; align-items:flex-start } }
</style></head>
<body>
<header><div><h1>${esc(plano.nome)} · o plano de cada frase</h1><p>${esc(plano.filme)}. Mude o que quiser e baixe o plano.</p></div>
<button id="baixar">baixar plano-ajustado.json</button></header>
<main>${linhas}</main>
<datalist id="comps">${comps.map((c) => `<option value="${esc(c)}">`).join('')}</datalist>
<script>
const PLANO = ${JSON.stringify(plano).replace(/</g, '\\u003c').split(String.fromCharCode(0x2028)).join('\\u2028').split(String.fromCharCode(0x2029)).join('\\u2029')};
document.getElementById('baixar').addEventListener('click', function () {
  const p = JSON.parse(JSON.stringify(PLANO));
  document.querySelectorAll('.cena').forEach(function (s) {
    const c = p.cenas.find(function (x) { return x.id === s.dataset.id; });
    const t = s.querySelector('input[type=radio]:checked'); if (t) c.tipo = t.value;
    s.querySelectorAll('[data-campo]').forEach(function (el) { c[el.dataset.campo] = el.value; });
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' }));
  a.download = 'plano-ajustado.json'; a.click();
});
</script></body></html>
`;
}

// entra só o que ele pode mudar; o tempo das frases e os ids ficam
export function importar(plano, ajustado) {
  const p = JSON.parse(JSON.stringify(plano));
  for (const c of p.cenas) {
    const a = (ajustado.cenas || []).find((x) => x.id === c.id);
    if (!a) continue;
    for (const k of EDITAVEIS) if (a[k] !== undefined) c[k] = a[k];
  }
  return p;
}

// ─── a linha de comando ──────────────────────────────────────────────────────
function lerCatalogo() {
  return JSON.parse(readFileSync(join(AQUI, '..', 'biblioteca', 'catalogo.json'), 'utf8'));
}

if (chamadoDireto(import.meta.url)) {
  const [cmd, pasta, extra] = process.argv.slice(2);
  if (!cmd || !pasta) { console.error('uso: plano.mjs conferir|preencher|tabela|pagina|importar <pasta> [arquivo]'); process.exit(2); }
  const arqPlano = join(pasta, 'plano.json');
  const plano = JSON.parse(readFileSync(arqPlano, 'utf8'));
  const catalogo = lerCatalogo();
  if (cmd === 'conferir') {
    const dados = plano.modo === 'falado' ? lerDados(pasta) : null;
    if (plano.modo === 'falado' && !dados) {
      console.log('ERRO  [cobertura] sem o dados.js da /cortes: as frases e os tempos não foram conferidos (rode a montagem da /cortes)');
      process.exitCode = 1;
    }
    const { erros, avisos, aceitos = [] } = conferirPlano(plano.modo === 'falado' && dados ? preencherDoCorte(plano, dados) : plano, { dados, catalogo });
    for (const e of erros) console.log(`ERRO  [${e.regra}] ${e.msg}`);
    for (const a of avisos) console.log(`aviso [${a.regra}] ${a.msg}`);
    for (const a of aceitos) console.log(`aceito [${a.regra}] ${a.msg} · a exceção do plano: ${a.motivo}${a.fonte ? ` (${a.fonte})` : ''}`);
    console.log(erros.length ? `\nplano reprovado: ${erros.length} erro(s)` : `\nplano ${process.exitCode ? 'sem a cobertura' : 'verde'} (${avisos.length} aviso(s))`);
    if (erros.length) process.exitCode = 1;
  } else if (cmd === 'preencher') {
    const dados = lerDados(pasta);
    if (!dados) { console.error('sem o dados.js: rode antes a montagem da /cortes (scripts/reel-falado/montar.mjs)'); process.exit(1); }
    writeFileSync(arqPlano, JSON.stringify(preencherDoCorte(plano, dados), null, 2) + '\n');
    console.log('preenchido: de, ate e fala de cada cena pelo corte');
  } else if (cmd === 'tabela') {
    process.stdout.write(tabela(plano));
  } else if (cmd === 'pagina') {
    writeFileSync(join(pasta, 'planejamento.html'), pagina(plano, { catalogo }));
    console.log(`página: ${join(pasta, 'planejamento.html')}`);
  } else if (cmd === 'importar') {
    if (!extra) { console.error('falta o arquivo que ele baixou'); process.exit(2); }
    const novo = importar(plano, JSON.parse(readFileSync(extra, 'utf8')));
    writeFileSync(arqPlano, JSON.stringify(novo, null, 2) + '\n');
    console.log('importado: o que ele mudou entrou no plano.json; rode o conferir');
  } else {
    console.error(`comando "${cmd}" não existe`); process.exit(2);
  }
}
