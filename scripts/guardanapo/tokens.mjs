// Os números do Guardanapo, num lugar só.
//
// A régua mora no guia da skill (`.claude/skills/guardanapo/SKILL.md`). Os
// NÚMEROS dela moram aqui, e o desenho, a conferência e o render leem daqui.
//
// 🚨 As cores NÃO são copiadas à mão: saem da marca de quem instalou
// (`identidade/marca.tokens.json`, lida pelo `scripts/marca/marca.mjs`), pela
// regra única de derivação (`scripts/marca/derivar.mjs`): a mesma conta que dá
// o texto do carrossel e os papéis do site dá as tintas do traço.
//
// Sem marca configurada, a peça para com a frase única ("a marca não está
// configurada: rode /marca"). A paleta NEUTRA abaixo é uma escolha declarada,
// nunca uma queda calada: `GUARDANAPO_MARCA=neutra`.
//
// `GUARDANAPO_MARCA` troca a origem: `neutra`, a pasta de outra raiz com
// `identidade/` (a marca de um cliente, na pasta dele), um `marca.tokens.json`,
// ou um `tokens.css` no formato do carrossel.
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exigirPeca } from '../terceiros/peca.mjs';
import { lerMarca, paradaDe, ARQUIVO } from '../marca/marca.mjs';
import { derivarMarca, razao } from '../marca/derivar.mjs';

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const MARCA_PADRAO = join(RAIZ, ARQUIVO);
// As fontes moram fora do git, em `.claude/skills/guardanapo/fontes/`: o
// `scripts/terceiros/instalar.mjs` as baixa (a peça `guardanapo-fontes`). Sem
// elas, o erro diz o comando que instala.
const pastaDasFontes = () => exigirPeca('guardanapo-fontes', { raiz: RAIZ });

/** A paleta neutra declarada: quase preto, off-white, um cinza e um acento. */
export const NEUTRA = Object.freeze({
  problema: '#1a1a1a', // tecnico: tinta 1, traço, texto, o novo, o problema
  solucao: '#1e3a8a', // tecnico: tinta 2, o lado bom (o acento, fechado)
  contexto: '#64646a', // tecnico: tinta 3, o já mostrado, o contexto (5,6:1 sobre o fundo)
  destaque: '#2563eb', // tecnico: o acento, só no ponto
  fundo: '#faf9f6', // tecnico
  superficie: '#f0f0f1', // tecnico: o chapado do nó
  grupo: '#e4e4e7', // tecnico: o chapado do grupo
});

const CANAIS = { principal: 'dark', claro: 'light', acento: 'accent', apoio: 'support-1', lavado: 'support-2', raro: 'rare', abismo: 'abyss', ok: 'ok' };

/**
 * As tintas do Guardanapo pela regra única, a partir dos papéis da marca:
 *   problema   ← o texto sobre o claro (a principal, ou o abismo quando ela não passa)
 *   solucao    ← o apoio
 *   contexto   ← 62% do texto sobre o claro (o cinza da marca)
 *   destaque   ← o acento, ou o texto quando o acento não passa 3:1 no claro
 *   fundo      ← o claro
 *   superficie ← o lavado
 *   grupo      ← 8% do texto sobre o lavado
 */
export function tintasDaMarca(papeis) {
  const d = derivarMarca(papeis);
  if (d.erros.length) throw new Error(`guardanapo: a marca não fecha o contraste: ${d.erros.join('; ')}`);
  return { cor: d.guardanapo, avisos: d.avisos };
}

/**
 * As cores a partir do texto de um `tokens.css` no formato do carrossel (os
 * oito canais). Canal ausente explode: cor que some calada vira preto no SVG.
 */
function papeisDoCss(css) {
  const papeis = {};
  for (const [papel, nome] of Object.entries(CANAIS)) {
    const m = css.match(new RegExp(`--c-${nome}:\\s*(\\d+),\\s*(\\d+),\\s*(\\d+)`));
    if (!m) throw new Error(`guardanapo: o canal --c-${nome} sumiu do tokens.css da marca`);
    papeis[papel] = '#' + m.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, '0')).join('');
  }
  return papeis;
}
export const coresDaMarca = (css) => tintasDaMarca(papeisDoCss(css)).cor;

const naoConfigurada = (motivo) => ({ origem: 'nao-configurada', arquivo: null, motivo, cor: { ...NEUTRA }, avisos: [] });
const daMarca = (m, arquivo) => (m.configurada
  ? { origem: 'marca', arquivo, ...tintasDaMarca(m.resolvido.cor.papel), resolvido: m.resolvido }
  : naoConfigurada(m.motivo));

/**
 * A paleta que vale. Devolve { origem: 'marca' | 'neutra' | 'nao-configurada',
 * arquivo, cor, avisos, motivo }. A `nao-configurada` carrega a neutra só para
 * o módulo carregar: a peça para (`exigirMarca`).
 */
export function lerPaleta(origem = process.env.GUARDANAPO_MARCA) {
  if (origem === 'neutra') return { origem: 'neutra', arquivo: null, cor: { ...NEUTRA }, avisos: [] };
  if (!origem) return daMarca(lerMarca(), MARCA_PADRAO);
  // um caminho pedido de propósito que não existe explode: cair calado
  // entregaria a peça do cliente nas cores erradas
  if (!existsSync(origem)) throw new Error(`guardanapo: a marca pedida em GUARDANAPO_MARCA não existe: ${origem}`);
  if (statSync(origem).isDirectory()) return daMarca(lerMarca({ raiz: resolve(origem) }), join(resolve(origem), ARQUIVO));
  if (origem.endsWith('.json')) return daMarca(lerMarca({ arquivo: origem }), origem);
  const css = readFileSync(origem, 'utf8');
  if (/ESTADO:\s*nao-configurado/.test(css)) return naoConfigurada(`${basename(origem)} ainda está no estado não configurado`);
  return { origem: 'marca', arquivo: origem, ...tintasDaMarca(papeisDoCss(css)) };
}

// o contraste WCAG 2, pela mesma conta da marca
export const contraste = (a, b) => razao(a, b);

/**
 * O que a marca pode ter de ruim para o traço: tinta ou destaque com menos de
 * 3:1 sobre o fundo (o piso de elemento gráfico) some no quadro. Devolve as
 * linhas de aviso; vazio quando está tudo legível.
 */
export function avisosDeContraste(cor) {
  return ['problema', 'solucao', 'contexto', 'destaque']
    .map((papel) => [papel, contraste(cor[papel], cor.fundo)])
    .filter(([, c]) => c < 3)
    .map(([papel, c]) => `a tinta "${papel}" (${cor[papel]}) tem ${c.toFixed(1)}:1 sobre o fundo ${cor.fundo}: abaixo de 3:1 ela some no quadro; ajuste a marca ou use GUARDANAPO_MARCA=neutra`);
}

/** A fonte de leitura da marca, quando há arquivo local: { familia, caminho }. */
function fonteDaMarca(p) {
  const f = p.resolvido?.fonte?.display;
  if (!f?.arquivo) return null;
  const caminho = join(dirname(p.arquivo), f.arquivo); // o arquivo da fonte é relativo a identidade/
  return existsSync(caminho) ? { familia: f.familia, caminho } : null;
}
const avisoDaFonte = (p) => (p.origem === 'marca' && p.resolvido && !fonteDaMarca(p)
  ? ['a fonte da marca não tem arquivo local em identidade/fontes/: o texto corrido sai na Inter 4 (a letra de mão continua a do guardanapo)']
  : []);

const paleta = lerPaleta();
const cor = Object.freeze(paleta.cor);

/** A peça para sem marca: a frase única, ou a neutra pedida de propósito. */
export function exigirMarca(p = paleta) {
  if (p.origem === 'nao-configurada') throw new Error(`${paradaDe(p.motivo)}; para a paleta neutra declarada, GUARDANAPO_MARCA=neutra`);
}

export const T = Object.freeze({
  cor,
  paleta: [...new Set(Object.values(cor))],
  // de onde a cor veio: 'marca', 'neutra' (pedida) ou 'nao-configurada' (a peça para)
  marca: Object.freeze({ origem: paleta.origem, arquivo: paleta.arquivo, motivo: paleta.motivo ?? '', avisos: Object.freeze([...(paleta.avisos ?? []), ...avisoDaFonte(paleta)]) }),
  quadro: { largura: 1080, altura: 1350 },
  margem: 80,
  // o espaço entre o título (ou a frase) e o desenho
  respiroDaArea: 16,
  rugosidade: 1,
  traco: { base: 4, destaque: 7, fino: 2 },
  raio: 32,
  // os três níveis de letra: o padrão, a faixa que só serve para caber, e o
  // teto de palavras (a anotação usa o nível 2 com teto próprio)
  nivel: {
    titulo: { padrao: 80, min: 72, max: 96, palavras: 6 },
    rotulo: { padrao: 40, min: 36, max: 44, palavras: 4 },
    frase: { padrao: 32, min: 30, max: 32 },
  },
  anotacaoPalavras: 10,
  entrelinha: { mao: 1.25, inter: 1.4 },
  // largura média por caractere, com espaço, medida no navegador a 100 px
  largura: { mao: 0.5, inter: 0.45 },
  // o teto de nós por cena; pessoa conta, grupo e estrutura não
  teto: { carrossel: 6, post: 5, slide: 8, coluna: 8 },
  // a letra de mão é a linguagem do guardanapo; a de leitura é a da marca
  // quando ela tem arquivo local (o render mede offline), senão a Inter 4
  familia: { mao: 'Excalifont', inter: fonteDaMarca(paleta)?.familia[0] ?? 'Inter 4' },
  // a fonte da peça quando a cena não pede outra: só letra de mão
  fontePadrao: 'mao',
});

/** Os quatro subconjuntos latinos da Excalifont, com a faixa de cada um. */
export function fontesExcalifont() {
  const pasta = pastaDasFontes();
  return [
    ['excalifont-latin.woff2', 'U+20-7e,U+a0-a3,U+a5-a6,U+a8-ab,U+ad-b1,U+b4,U+b6-b8,U+ba-ff,U+131,U+152-153,U+2bc,U+2c6,U+2da,U+2dc,U+304,U+308,U+2013-2014,U+2018-201a,U+201c-201e,U+2020,U+2022,U+2024-2026,U+2030,U+2039-203a,U+20ac,U+2122,U+2212'],
    ['excalifont-latin-ext.woff2', 'U+100-130,U+132-137,U+139-149,U+14c-151,U+154-17e,U+192,U+1fc-1ff,U+218-21b,U+237,U+1e80-1e85,U+1ef2-1ef3,U+2113'],
    ['excalifont-diacriticos.woff2', 'U+2c7,U+2d8-2d9,U+2db,U+2dd,U+302,U+306-307,U+30a-30c,U+326-328,U+212e,U+2211,U+fb01-fb02'],
    ['excalifont-acentos-combinados.woff2', 'U+300-301,U+303'],
  ].map(([nome, faixa]) => ({ arquivo: join(pasta, nome), faixa }));
}

/**
 * A letra de leitura da frase na fonte `hibrida` e da peça `inter`: a fonte da
 * marca quando ela tem arquivo em `identidade/fontes/` (o render mede offline,
 * com a fonte embutida), senão a Inter 4 variável (só a reta), que o
 * instalador põe na pasta das fontes da skill.
 */
export function fontesInter() {
  const daMarca = fonteDaMarca(paleta);
  if (daMarca) return [{ arquivo: daMarca.caminho, faixa: 'U+0000-FFFF' }];
  const pasta = pastaDasFontes();
  return [
    ['inter-variavel-latin.woff2', 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'],
    ['inter-variavel-latin-ext.woff2', 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF'],
  ].map(([nome, faixa]) => ({ arquivo: join(pasta, nome), faixa }));
}
