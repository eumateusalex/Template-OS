// A UNICA definicao de "fonte" da skill: o que cada tipo de fonte guarda no cobertura.json e como
// se valida. Quem grava (captura/fontes.mjs) e quem confere (verificar.js) importam daqui; nenhum
// outro arquivo escreve a sua propria regra. CommonJS de proposito: o verificar.js e CJS, e os .mjs
// importam CJS sem custo.
//
// Uma fonte e o lugar que a pessoa escolheu acompanhar. Quatro tipos:
//   x         um perfil do X           { nome, tipo: "x", handle, triado_ate }   triado_ate: ISO UTC, segundo inteiro
//   linkedin  um perfil do LinkedIn    { nome, tipo: "linkedin", perfil, lido_ate }
//   web       um site, blog ou boletim { nome, tipo: "web", endereco, lido_ate }
//   arquivo   um arquivo local         { nome, tipo: "arquivo", caminho, lido_ate }   caminho relativo a raiz do workspace
// `triado_ate` (X) e `lido_ate` (os outros, AAAA-MM-DD) dizem ate onde a fonte ja foi lida e julgada:
// a proxima captura dela comeca dali. `lido_ate: null` = nada lido ainda.

'use strict';

const { enderecosDePost } = require('./endereco-de-post.cjs');

const ISO_SEGUNDO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const DIA = /^\d{4}-\d{2}-\d{2}$/;
const NOME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const dataValida = (s) => typeof s === 'string' && Number.isFinite(Date.parse(s.length === 10 ? s + 'T00:00:00Z' : s))
  && (s.length === 10 ? new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s : true);

const TIPOS = {
  x: {
    campo: 'handle', marca: 'triado_ate',
    valida: (v) => /^[A-Za-z0-9_]{1,15}$/.test(String(v)) || 'handle do X: de 1 a 15 letras, números ou _ (sem @)',
    marcaValida: (m) => (typeof m === 'string' && ISO_SEGUNDO.test(m) && dataValida(m)) || 'triado_ate: instante ISO em UTC, segundo inteiro (AAAA-MM-DDTHH:MM:SSZ)',
  },
  linkedin: {
    campo: 'perfil', marca: 'lido_ate',
    valida: (v) => /^https:\/\/www\.linkedin\.com\/in\/[A-Za-z0-9_%-]+\/?$/.test(String(v)) || 'perfil do LinkedIn: o endereço do perfil (linkedin.com/in/<perfil>/), nunca de um post',
  },
  web: {
    campo: 'endereco', marca: 'lido_ate',
    valida: (v) => {
      const s = String(v);
      if (!/^https?:\/\/[^\s/]+\.[^\s]*$/.test(s)) return 'endereço web: começa com http:// ou https:// e tem um domínio';
      if (enderecosDePost(s).length) return 'endereço web: é o endereço de UM post; a fonte é o perfil (tipo x ou linkedin)';
      if (/^https?:\/\/(?:[\w-]+\.)*(?:x|twitter|linkedin)\.com(?:\/|$)/.test(s)) return 'endereço web: X e LinkedIn têm tipo próprio (x, linkedin)';
      return true;
    },
  },
  arquivo: {
    campo: 'caminho', marca: 'lido_ate',
    valida: (v) => {
      const s = String(v || '');
      if (!s.trim()) return 'caminho do arquivo: vazio';
      if (/^(?:[A-Za-z]:)?[\\/]/.test(s) || s.split(/[\\/]/).includes('..')) return 'caminho do arquivo: relativo à raiz do workspace, sem ".."';
      return true;
    },
  },
};
for (const t of ['linkedin', 'web', 'arquivo']) {
  TIPOS[t].marcaValida = (m) => m === null || (typeof m === 'string' && DIA.test(m) && dataValida(m)) || 'lido_ate: null (nada lido) ou AAAA-MM-DD';
}

// o nome que a fonte ganha ao ser adicionada: <tipo>-<o que a identifica, em kebab-case>
const kebab = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/, '');
function nomeDaFonte(tipo, valor) {
  const v = String(valor);
  if (tipo === 'x') return 'x-' + kebab(v);
  if (tipo === 'linkedin') return 'linkedin-' + kebab((v.match(/\/in\/([^/]+)/) || [, v])[1]);
  if (tipo === 'web') return 'web-' + kebab(v.replace(/^https?:\/\/(?:www\.)?/, '').replace(/[/?#].*$/, ''));
  if (tipo === 'arquivo') return 'arquivo-' + kebab(v.split(/[\\/]/).pop().replace(/\.[^.]+$/, ''));
  return '';
}

// os erros de UMA fonte (lista vazia = valida)
function errosDaFonte(f) {
  if (!f || typeof f !== 'object' || Array.isArray(f)) return ['fonte não é um objeto'];
  const def = TIPOS[f.tipo];
  if (!def) return [`${f.nome || '?'}: tipo "${f.tipo}" desconhecido (use ${Object.keys(TIPOS).join(', ')})`];
  const erros = [];
  const quem = f.nome || '?';
  if (!NOME.test(String(f.nome || ''))) erros.push(`${quem}: nome em kebab-case (letras minúsculas, números e hífen)`);
  const v = def.valida(f[def.campo]);
  if (v !== true) erros.push(`${quem}: ${v}`);
  const m = def.marcaValida(f[def.marca]);
  if (m !== true) erros.push(`${quem}: ${m}`);
  const sobra = Object.keys(f).filter((k) => !['nome', 'tipo', def.campo, def.marca].includes(k));
  if (sobra.length) erros.push(`${quem}: campo(s) a mais: ${sobra.join(', ')}`);
  return erros;
}

// os erros da LISTA: cada fonte, mais nome repetido
function errosDasFontes(lista) {
  if (!Array.isArray(lista)) return ['"fontes" não é uma lista'];
  const erros = lista.flatMap(errosDaFonte);
  const nomes = lista.map((f) => f && f.nome);
  const repetidos = [...new Set(nomes.filter((n, i) => n && nomes.indexOf(n) !== i))];
  if (repetidos.length) erros.push(`nome de fonte repetido: ${repetidos.join(', ')}`);
  return erros;
}

module.exports = { TIPOS, nomeDaFonte, errosDaFonte, errosDasFontes, ISO_SEGUNDO, DIA };
