// Os números do Guardanapo, num lugar só.
//
// A régua mora no guia da skill (`.claude/skills/guardanapo/SKILL.md`). Os
// NÚMEROS dela moram aqui, e o desenho, a conferência e o render leem daqui.
//
// 🚨 As cores NÃO são copiadas à mão: saem da marca de quem instalou, pelo
// papel, do `.claude/skills/carrossel/marca/tokens.css` (o arquivo que o
// `/carrossel configurar` grava). Cópia à mão fica na versão velha enquanto a
// marca já é outra; lida daqui, a marca muda e o Guardanapo acompanha.
//
// Sem marca configurada (o `tokens.css` não existe, ou ainda tem a linha
// `ESTADO: nao-configurado`), vale a paleta NEUTRA abaixo: quase preto sobre
// off-white, um cinza e um acento azul. O traço do Guardanapo é escuro sobre
// claro por natureza, então a neutra é uma peça inteira, não um remendo. A skill avisa antes do
// roteiro qual das duas vai valer.
//
// `GUARDANAPO_MARCA` troca a origem: o caminho de outro `tokens.css` (a marca
// de um cliente, na pasta dele) ou `neutra` para forçar a neutra.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exigirPeca } from '../terceiros/peca.mjs';

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const MARCA_PADRAO = join(RAIZ, '.claude/skills/carrossel/marca/tokens.css');
// As fontes moram fora do git, em `.claude/skills/guardanapo/fontes/`: o
// `scripts/terceiros/instalar.mjs` as baixa (a peça `guardanapo-fontes`). Sem
// elas, o erro diz o comando que instala.
const pastaDasFontes = () => exigirPeca('guardanapo-fontes', { raiz: RAIZ });

/** A paleta quando não há marca: quase preto, off-white, um cinza e um acento. */
export const NEUTRA = Object.freeze({
  problema: '#1a1a1a', // tinta 1: traço, texto, o novo, o problema
  solucao: '#1e3a8a', // tinta 2: o lado bom (o acento, fechado)
  contexto: '#64646a', // tinta 3: o já mostrado, o contexto (5,6:1 sobre o fundo)
  destaque: '#2563eb', // o acento, só no ponto
  fundo: '#faf9f6',
  superficie: '#f0f0f1', // o chapado do nó
  grupo: '#e4e4e7', // o chapado do grupo
});

const hex = (rgb) => '#' + rgb.map((n) => Math.round(n).toString(16).padStart(2, '0')).join('');
const mistura = (a, b, t) => a.map((v, i) => v * t + b[i] * (1 - t));

/**
 * As cores do Guardanapo a partir do texto de um `tokens.css` da marca, pelo
 * papel. Canal ausente explode: cor que some calada vira preto no SVG sem
 * ninguém ver.
 *   problema   ← --c-dark (a principal: o texto sobre o claro)
 *   solucao    ← --c-support-1 (o apoio)
 *   contexto   ← 62% da principal sobre o fundo (o cinza da marca, ~5:1)
 *   destaque   ← --c-accent
 *   fundo      ← --c-light
 *   superficie ← --c-support-2 (o lavado do card)
 *   grupo      ← 8% da principal sobre o lavado (um passo mais fechado)
 */
export function coresDaMarca(css) {
  const canal = (nome) => {
    const m = css.match(new RegExp(`--c-${nome}:\\s*(\\d+),\\s*(\\d+),\\s*(\\d+)`));
    if (!m) throw new Error(`guardanapo: o canal --c-${nome} sumiu do tokens.css da marca`);
    return m.slice(1, 4).map(Number);
  };
  const [dark, light, accent, apoio, lavado] = ['dark', 'light', 'accent', 'support-1', 'support-2'].map(canal);
  return {
    problema: hex(dark),
    solucao: hex(apoio),
    contexto: hex(mistura(dark, light, 0.62)),
    destaque: hex(accent),
    fundo: hex(light),
    superficie: hex(lavado),
    grupo: hex(mistura(dark, lavado, 0.08)),
  };
}

/**
 * A paleta que vale: a da marca, se o arquivo existe e foi configurado, ou a
 * neutra. Devolve { origem: 'marca' | 'neutra', arquivo, cor }.
 */
export function lerPaleta(origem = process.env.GUARDANAPO_MARCA || MARCA_PADRAO) {
  if (origem === 'neutra') return { origem: 'neutra', arquivo: null, cor: { ...NEUTRA } };
  if (!existsSync(origem)) {
    // a marca do workspace ainda não existe: a neutra. Um caminho pedido de
    // propósito (a variável) que não existe explode: cair calado na neutra
    // entregaria a peça do cliente nas cores erradas
    if (origem === MARCA_PADRAO) return { origem: 'neutra', arquivo: null, cor: { ...NEUTRA } };
    throw new Error(`guardanapo: a marca pedida em GUARDANAPO_MARCA não existe: ${origem}`);
  }
  const css = readFileSync(origem, 'utf8');
  if (/ESTADO:\s*nao-configurado/.test(css)) return { origem: 'neutra', arquivo: null, cor: { ...NEUTRA } };
  return { origem: 'marca', arquivo: origem, cor: coresDaMarca(css) };
}

// o contraste WCAG entre duas cores em hex
const luminancia = (h) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
export const contraste = (a, b) => {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

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

const paleta = lerPaleta();
const cor = Object.freeze(paleta.cor);

export const T = Object.freeze({
  cor,
  paleta: [...new Set(Object.values(cor))],
  // de onde a cor veio: 'marca' (o tokens.css configurado) ou 'neutra'
  marca: Object.freeze({ origem: paleta.origem, arquivo: paleta.arquivo }),
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
  familia: { mao: 'Excalifont', inter: 'Inter 4' },
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
 * A Inter 4 variável (só a reta), que o instalador põe na pasta das fontes da
 * skill: é a letra de leitura da frase na fonte `hibrida` e da peça `inter`.
 * Fica fixa, e não a fonte da marca, porque a marca carrega fonte pela rede
 * (Google Fonts) e o render mede offline, com a fonte embutida.
 */
export function fontesInter() {
  const pasta = pastaDasFontes();
  return [
    ['inter-variavel-latin.woff2', 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'],
    ['inter-variavel-latin-ext.woff2', 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF'],
  ].map(([nome, faixa]) => ({ arquivo: join(pasta, nome), faixa }));
}
