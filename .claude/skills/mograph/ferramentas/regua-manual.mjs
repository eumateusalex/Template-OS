// A régua do manual: a peça usa o saber e o kit da skill, não só os tem à mão.
//
//   node regua-manual.mjs conferir <plano.json> [--som <som.json>] [--sem-som] [--skill <pasta>]
//
// Cada cena do plano.json cita, no campo `tecnicas`, os ids do manual que usa: o id existe, é do
// formato da peça (o `saber` do perfil, filme ou reel, pelo estilo) ou de comum/, e não é recusado; a
// técnica de tipo (o `motor:tipo=<tipo>` do realiza) só vale na cena desse `tipo`; o proposto avisa,
// numa linha só, e entra sinalizado na entrega. O componente (`comum.componentes.*`) que só
// se faz à mão pede o `motivo_mao` da cena. O som.json da peça (o `fonte/som.json` do som-do-puro, ou
// o som.json do lado do plano, ou o --som) tem efeito, e cada um diz o `gesto` do kit e o arquivo que
// toca, que é um som daquele gesto (o nome como o `ativos.py trazer` grava, com o sufixo de nome novo)
// ou o da `origem`, que diz qual é (o `letras`, de nomes fixos, sempre diz), ou o `motivo` explica; o
// silêncio não é efeito. A técnica que soa a tecla (a cujo campo som começa pela tecla) pede o efeito
// com `letras`; menos de 5 gestos numa peça pura de 10 s ou mais avisa (calibragem: não
// reprova). O --sem-som só vale no falado, em que o som é da /cortes. Cada imagem e vídeo que o
// index.html do lado do plano carrega vem no `ativos` do plano com a origem (o cenário pintado em
// código é recusado); sem a página ainda, avisa.
// Sai 1 com erro e 2 com uso errado ou plano ilegível.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { chamadoDireto } from './principal.mjs';
import { SKILL } from './kit.mjs';
import { perfilDoPlano, lerSaberes, idDoEstilo } from './linguagem.mjs';

const GESTOS_PISO = 5, LONGA_S = 10;
const campo = (bloco, nome) => ((bloco.match(new RegExp(`^- \\*\\*${nome}\\*\\*: (.*)$`, 'm')) || [])[1] || '').trim();
const crases = (txt) => [...txt.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
// o tipo de cena que a técnica pede: o `motor:tipo=<tipo>` do realiza (as quatro reel.cena.* de tipo)
const tipoPedido = (t) => crases(t.realiza).map((r) => (r.match(/^motor:tipo=(.+)$/) || [])[1]).find(Boolean) || null;

// id → { saber (a pasta: comum, filme ou reel), estado, som, realiza, regra }
export function lerManual(skill = SKILL) {
  const manual = new Map();
  const raiz = join(skill, 'manual');
  for (const pasta of readdirSync(raiz)) {
    if (!statSync(join(raiz, pasta)).isDirectory()) continue;
    for (const nome of readdirSync(join(raiz, pasta)).filter((n) => n.endsWith('.md'))) {
      for (const bloco of readFileSync(join(raiz, pasta, nome), 'utf8').split(/^### /m).slice(1)) {
        const id = bloco.split('\n')[0].trim();
        if (manual.has(id)) throw new Error(`o id ${id} está repetido no manual (${pasta}/${nome})`);
        manual.set(id, {
          saber: pasta,
          estado: campo(bloco, 'estado').split(/\s/)[0],
          som: campo(bloco, 'som'),
          realiza: campo(bloco, 'realiza'),
          regra: campo(bloco, 'regra'),
        });
      }
    }
  }
  return manual;
}

// o nome que o `ativos.py trazer` dá à cópia: o nome do arquivo em minúsculas, espaço vira hífen
const nomeTrazido = (caminho) => basename(caminho, extname(caminho)).toLowerCase().replace(/ /g, '-');
// o arquivo é uma das refs do kit (pacote:caminho) pelo nome trazido, com ou sem o sufixo de nome novo
function casaNome(arquivo, refs) {
  const base = nomeTrazido(arquivo);
  const nomes = new Set(refs.map((ref) => nomeTrazido(String(ref).slice(String(ref).indexOf(':') + 1))));
  return nomes.has(base) || nomes.has(base.replace(/-\d+$/, ''));
}
// o silêncio é gesto do vocabulário, mas é o som que se tira: no puro se corta no arquivo da trilha
// (manual: comum.som.silencio-antes-do-pico), e o som-do-puro não tem como tocá-lo
const SILENCIO = 'silencio';

function conferirEfeito(e, kit) {
  if (!e || typeof e !== 'object' || Array.isArray(e)) return `um efeito do som.json não é objeto: ${JSON.stringify(e)}`;
  const gesto = e.gesto || (e.letras ? 'tecla' : null);
  const quem = `o efeito ${e.id ?? '(sem id)'}`;
  if (!gesto) return `${quem} não diz o gesto do kit (o campo gesto: tecla, pop, whoosh-curto…)`;
  if (e.letras && gesto !== 'tecla') return `${quem} tem letras (a digitação) e o gesto "${gesto}": o letras é o gesto tecla`;
  const g = Object.hasOwn(kit.gestos, gesto) ? kit.gestos[gesto] : null;
  if (!g) return `${quem} cita o gesto "${gesto}", que o kit/som.json não tem`;
  if (gesto === SILENCIO) return `${quem} é o silêncio, que não é efeito do som.json: no puro, ele se corta no arquivo da trilha (manual: comum.som.silencio-antes-do-pico)`;
  const arquivo = String(e.arquivo ?? '').trim();
  if (!e.letras && !arquivo) return `${quem} não diz o arquivo que toca`;
  if (!g.sons?.length && g.gerado) return null;
  if (e.motivo && String(e.motivo).trim()) return null;
  if (e.origem != null || e.letras) {
    const origens = [].concat(e.origem ?? []);
    if (!origens.length || origens.some((o) => typeof o !== 'string' || !o.trim())) {
      return e.letras ? `${quem} (letras) grava tecla-1.wav e tecla-2.wav: a origem diz de qual som do gesto tecla do kit eles saíram`
        : `${quem} tem a origem vazia ou que não é texto: ela diz de qual som do gesto ${gesto} no kit o arquivo saiu`;
    }
    const fora = origens.find((o) => !g.sons.includes(o));
    if (fora) return `${quem}: a origem ${fora} não é um som do gesto ${gesto} no kit (ou o motivo explica)`;
    if (e.letras || casaNome(arquivo, origens)) return null;
    return `${quem}: o arquivo ${arquivo} não é o da origem (${origens.join(', ')}): o que toca é o arquivo`;
  }
  if (casaNome(arquivo, g.sons)) return null;
  return `${quem}: o arquivo ${e.arquivo} não é um som do gesto ${gesto} no kit (ou a origem diz qual é, ou o motivo explica)`;
}

// o som da peça ao lado do plano: o fonte/som.json do puro, ou o som.json da pasta
export const somAoLado = (pasta) => [join(pasta, 'fonte', 'som.json'), join(pasta, 'som.json')].find((a) => existsSync(a)) || null;

// A origem de cada imagem (manual: comum.mundo.cenario-pintado-em-codigo):
// a imagem e o vídeo que a página carrega vêm declarados no `ativos` do plano, com a origem. O que é
// da marca e do vendor (`_marca/`, `_vendor/`), da rede ou embutido (`data:`) não se declara, e o áudio tem a régua dele.
const MIDIA = /\.(png|jpe?g|webp|avif|gif|svg|mp4|webm|mov)$/i;
export const ORIGENS = ['foto', 'video', 'gerado', 'kit', 'material', 'produto', 'captura', 'efeito'];
const RECUSA_PINTADO = 'comum.mundo.cenario-pintado-em-codigo';
const limpo = (src) => String(src).trim().replace(/^\.\//, '').replace(/[?#].*$/, '');

// as imagens que a página carrega, lidas como texto: o src="..." e o url(...), sem repetir, em ordem
export function imagensDaPagina(html) {
  const achados = [...html.matchAll(/\bsrc\s*=\s*["']([^"']+)["']/gi), ...html.matchAll(/url\(\s*["']?([^"')]+?)["']?\s*\)/gi)].map((m) => limpo(m[1]));
  return [...new Set(achados.filter((s) => MIDIA.test(s) && !/^(_vendor\/|_marca\/|[a-z]+:)/i.test(s)))].sort();
}

// as imagens do index.html do lado do plano, ou null quando a página ainda não existe (a fase de plano)
export const imagensAoLado = (pasta) => (existsSync(join(pasta, 'index.html')) ? imagensDaPagina(readFileSync(join(pasta, 'index.html'), 'utf8')) : null);

function conferirImagens(plano, imagens) {
  if (plano.ativos != null && !Array.isArray(plano.ativos)) return ['o ativos do plano não é uma lista: cada imagem da página vai como { arquivo, origem }'];
  const declarados = new Map((plano.ativos || []).map((a) => [limpo(a?.arquivo ?? ''), a]));
  const erros = [];
  for (const img of imagens) {
    const a = declarados.get(img);
    const origem = String(a?.origem ?? '').trim();
    if (!origem) erros.push(`a página carrega ${img}, sem origem no ativos do plano (${ORIGENS.join(', ')})`);
    else if (origem === 'codigo') erros.push(`a página carrega ${img}, de origem codigo: o cenário pintado em código é recusado (manual: ${RECUSA_PINTADO})`);
    else if (!ORIGENS.includes(origem)) erros.push(`a página carrega ${img}, de origem "${origem}", fora da lista (${ORIGENS.join(', ')})`);
    else if (origem === 'efeito' && !String(a.motivo ?? '').trim()) erros.push(`a página carrega ${img}, de origem efeito, sem o motivo: a camada sem figura diz o que é (a luz, o grão, a máscara)`);
  }
  return erros;
}

export function conferirManual(plano, { manual = lerManual(), kit, perfil = perfilDoPlano(plano), som = null, semSom = false, saberes = null, imagens = null } = {}) {
  const erros = [], avisos = [];
  const saber = perfil.saber;
  if (!saber) {
    const doEstilo = perfil.erros.filter((e) => e.regra === 'estilo').map((e) => e.msg);
    if (doEstilo.length) erros.push(...doEstilo);
    else {
      const porSaber = {};
      for (const [estilo, s] of Object.entries(saberes || lerSaberes())) (porSaber[s] ||= []).push(estilo);
      const lista = Object.entries(porSaber).map(([s, es]) => `${s}: ${es.join(', ')}`).join('; ');
      const estilo = idDoEstilo(plano.estilo);
      erros.push(`${estilo ? `o estilo "${estilo}" não tem` : 'o plano não diz o estilo, e sem ele a peça não tem'} formato do manual (${lista})`);
    }
  }
  const citadas = [], propostas = [];
  if (plano.cenas != null && !Array.isArray(plano.cenas)) erros.push('as cenas do plano não são uma lista');
  else if (!plano.cenas?.length) erros.push('o plano não tem nenhuma cena: a régua não mediu nada');
  for (const c of Array.isArray(plano.cenas) ? plano.cenas : []) {
    const tecnicas = Array.isArray(c.tecnicas) ? c.tecnicas : [];
    if (!tecnicas.length) { erros.push(`a cena ${c.id} não cita nenhuma técnica do manual (o campo tecnicas, com os ids)`); continue; }
    for (const id of tecnicas) {
      const t = manual.get(id);
      if (!t) { erros.push(`a cena ${c.id} cita ${id}, que não existe no manual`); continue; }
      citadas.push(t);
      if (saber && t.saber !== 'comum' && t.saber !== saber) erros.push(`a cena ${c.id} cita ${id}, do formato ${t.saber}, numa peça ${saber}`);
      if (t.estado === 'recusado') erros.push(`a cena ${c.id} cita ${id}, que é recusado: ${t.regra}`);
      const pede = tipoPedido(t);
      if (pede && c.tipo !== pede) erros.push(`a cena ${c.id} ${c.tipo ? `é do tipo ${c.tipo}` : 'não tem tipo'} e cita ${id}, que só vale na cena de tipo ${pede}`);
      if (t.estado === 'proposta' && !propostas.includes(id)) propostas.push(id);
      const soMao = crases(t.realiza).every((r) => r === 'mao') && crases(t.realiza).length > 0;
      if (id.startsWith('comum.componentes.') && soMao && !String(c.motivo_mao || '').trim()) {
        erros.push(`a cena ${c.id} cita ${id}, que se faz à mão: o motivo_mao da cena diz por que nenhum bloco, kit ou comportamento serve`);
      }
    }
  }
  if (propostas.length) avisos.push(`${propostas.length} técnica(s) proposta(s), que entram sinalizadas na entrega para a pessoa ver na aprovação da peça: ${propostas.join(', ')}`);
  if (imagens) erros.push(...conferirImagens(plano, imagens));
  else avisos.push('a página (index.html) não foi lida: a origem das imagens não se conferiu');

  const falado = plano.modo === 'falado';
  if (!som) {
    if (semSom && falado) avisos.push('o som não foi conferido (--sem-som)');
    else if (semSom) erros.push('o --sem-som só vale no falado, em que o som é da /cortes; no puro o som é da peça (o fonte/som.json)');
    else erros.push('o som não foi conferido: a peça não tem som.json (o fonte/som.json do lado do plano, ou --som; no falado, --sem-som)');
    return { erros, avisos };
  }
  if (som.efeitos != null && !Array.isArray(som.efeitos)) { erros.push('o efeitos do som.json não é uma lista'); return { erros, avisos }; }
  const efeitos = som.efeitos || [];
  if (!efeitos.length) erros.push('o som.json não tem nenhum efeito: a peça soa um gesto do kit em cada coisa que age');
  for (const e of efeitos) {
    const erro = conferirEfeito(e, kit);
    if (erro) erros.push(erro);
  }
  // o efeito que não toca (o silêncio, o sem arquivo) já reprovou acima: os gestos contam os que restam
  const validos = efeitos.filter((e) => e && typeof e === 'object');
  const gestos = new Set(validos.map((e) => e.gesto || (e.letras ? 'tecla' : null)).filter(Boolean));
  // a digitação é a técnica cujo som começa pela tecla (a tecla numa lista de gestos possíveis não é),
  // e soa por caractere: o letras do efeito, nunca uma tecla só
  if (citadas.some((t) => crases(t.som)[0] === 'tecla') && !validos.some((e) => e.letras)) {
    erros.push('a peça cita técnica de digitação (som tecla) e o som.json não tem o efeito com letras: cada letra soa a tecla (manual: comum.som.digitacao)');
  }
  if (!falado && Number(plano.duracao || 0) >= LONGA_S && !perfil.dispensa.has('tipos-de-efeito') && gestos.size < GESTOS_PISO) {
    avisos.push(`${gestos.size} gestos de som numa peça de ${plano.duracao} s; o ofício pede ${GESTOS_PISO} a 7 (manual: comum.som.familias)`);
  }
  return { erros, avisos };
}

if (chamadoDireto(import.meta.url)) {
  const args = process.argv.slice(2);
  const opcao = (nome) => { const i = args.indexOf(nome); return i >= 0 ? args.splice(i, 2)[1] : null; };
  const bandeira = (nome) => { const i = args.indexOf(nome); return i >= 0 ? (args.splice(i, 1), true) : false; };
  const skill = opcao('--skill') || SKILL;
  const arqSom = opcao('--som');
  const semSom = bandeira('--sem-som');
  const [cmd, arqPlano] = args;
  const sair = (msg) => { console.error(msg); process.exit(2); };
  if (cmd !== 'conferir' || !arqPlano) sair('uso: regua-manual.mjs conferir <plano.json> [--som <som.json>] [--sem-som] [--skill <pasta>]');
  const ler = (arq, oque) => {
    if (!existsSync(arq)) sair(`${oque} não existe: ${arq}`);
    try { return JSON.parse(readFileSync(arq, 'utf8')); } catch (e) { return sair(`${oque} não é JSON (${arq}): ${e.message}`); }
  };
  const plano = ler(arqPlano, 'o plano');
  const perto = somAoLado(dirname(arqPlano));
  const som = semSom ? null : arqSom ? ler(arqSom, 'o --som') : perto ? ler(perto, 'o som') : null;
  const kit = JSON.parse(readFileSync(join(skill, 'kit', 'som.json'), 'utf8'));
  const r = conferirManual(plano, { manual: lerManual(skill), kit, som, semSom, imagens: imagensAoLado(dirname(arqPlano)) });
  for (const e of r.erros) console.log(`✗ ${e}`);
  for (const a of r.avisos) console.log(`! ${a}`);
  console.log(`manual: ${Array.isArray(plano.cenas) ? plano.cenas.length : 0} cena(s); ${r.erros.length} erro(s), ${r.avisos.length} aviso(s)`);
  process.exit(r.erros.length ? 1 : 0);
}
