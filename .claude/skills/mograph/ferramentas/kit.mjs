// O kit da /mograph: a curadoria do material (`kit/som.json`, `kit/3d.json`, `kit/lut.json`) ligada
// ao arquivo de verdade, em `material/` dentro da skill (fora do git; quem põe lá é o /instalar).
//
//   node kit.mjs resolver som:<gesto> | 3d:<id> | lut:<id>   (os caminhos absolutos, um por linha)
//   node kit.mjs conferir                                  (todo arquivo existe e o kit cobre o manual)
//   (os dois aceitam --skill <pasta da skill> e --raiz <raiz do material>, como no teste)
//
// A raiz do kit é própria e não se configura: `<skill>/material`, com `som/`, `3d/` e `lut/`. O
// VIDEO_MATERIAL e o material.local.json são dos pacotes da pessoa (o `ativos.py`) e não mexem
// aqui; só o --raiz troca a raiz, nos testes e na conferência de um material fora do lugar. O som é `pacote:caminho`, com
// a pasta do pacote no índice `acervo/ativos/<pacote>.json`; o 3D é relativo à `raiz` do 3d.json; a LUT,
// à raiz de material. Caminho que sai da raiz (`..`, absoluto) reprova sem que o arquivo se abra.
// O 3d.json diz o `pacote` de onde o 3D veio: o `clara` do índice dele decide o aviso do resolver
// (sem licença clara, o 3D fica no orgânico, fora do anúncio e da peça de cliente, como o som).
//
// O conferir cobra também o vocabulário: os gestos do `manual/README.md` § 4 são os únicos que o kit
// e o campo `som` das entradas do manual podem citar, e todo gesto citado tem som no kit (ou é
// `gerado`, como o drone do tonal.py). Sem o material instalado, ou sem arquivo nenhum no kit, sai 1:
// não medir não é passar.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chamadoDireto } from './principal.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
export const SKILL = join(AQUI, '..');
const TIPOS = ['som', '3d', 'lut'];
const GESTO = /^[a-z]+(?:-[a-z]+)*$/;
const PACOTE = /^[a-z0-9-]+$/;

const lerJson = (arq) => JSON.parse(readFileSync(arq, 'utf8'));

// a raiz do material do kit: a da skill (o /instalar põe lá), ou a que o --raiz pede
export const raizDoKit = (skill = SKILL) => join(skill, 'material');
export const SEM_MATERIAL = 'o material do kit não está instalado: rode /instalar';

// o caminho relativo dentro da raiz, ou null quando ele escapa dela
function dentro(raiz, rel) {
  if (typeof rel !== 'string' || !rel || isAbsolute(rel) || /^[a-z]:/i.test(rel)) return null;
  const abs = resolve(raiz, rel);
  const r = relative(resolve(raiz), abs);
  return r && !r.startsWith('..') && !isAbsolute(r) ? abs : null;
}

// os gestos da tabela "Os gestos de som" do README do manual
function vocabulario(readme) {
  const secao = readme.split(/^## /m).find((s) => /^4 · Os gestos de som/.test(s)) || '';
  return new Set([...secao.matchAll(/^\| `([a-z-]+)` \|/gm)].map((m) => m[1]));
}

// o gesto que cada entrada do manual cita no campo `som`: o nome entre crases que parece gesto
function gestosDoManual(pasta) {
  const citados = [];
  const andar = (d) => {
    for (const nome of readdirSync(d)) {
      const arq = join(d, nome);
      if (statSync(arq).isDirectory()) andar(arq);
      else if (nome.endsWith('.md')) {
        for (const bloco of readFileSync(arq, 'utf8').split(/^### /m).slice(1)) {
          const id = bloco.split('\n')[0].trim();
          const som = (bloco.match(/^- \*\*som\*\*: (.*)$/m) || [])[1] || '';
          for (const m of som.matchAll(/`([^`]+)`/g)) if (GESTO.test(m[1])) citados.push({ id, gesto: m[1] });
        }
      }
    }
  };
  andar(pasta);
  return citados;
}

export function lerKit(skill = SKILL) {
  const kit = join(skill, 'kit');
  return {
    skill,
    som: lerJson(join(kit, 'som.json')),
    d3: lerJson(join(kit, '3d.json')),
    lut: lerJson(join(kit, 'lut.json')),
    vocabulario: vocabulario(readFileSync(join(skill, 'manual', 'README.md'), 'utf8')),
    citados: gestosDoManual(join(skill, 'manual')),
  };
}

// o índice do pacote em acervo/ativos/, ou null quando o nome não é de pacote ou não tem índice
export function indiceDoPacote(kit, pacote) {
  const arq = join(kit.skill, 'acervo', 'ativos', `${pacote}.json`);
  return typeof pacote === 'string' && PACOTE.test(pacote) && existsSync(arq) ? lerJson(arq) : null;
}

// cada arquivo do kit: { dono (o que o cita), ref (como está no kit), abs ou erro }
function arquivoDoSom(kit, raiz, ref) {
  const i = ref.indexOf(':');
  const pacote = i > 0 ? ref.slice(0, i) : '';
  const indice = indiceDoPacote(kit, pacote);
  if (!indice) return { erro: `o pacote "${pacote}" não tem índice em acervo/ativos/` };
  const pasta = dentro(raiz, indice.raiz);
  const abs = pasta && dentro(pasta, ref.slice(i + 1));
  return abs ? { abs } : { erro: 'o caminho sai da raiz de material (fora da raiz)' };
}

// a variação (o mesmo objeto noutra pasta do pacote) se confere, mas o resolver não a entrega
export function arquivos(kit, raiz, tipo, nome, { variacoes = true } = {}) {
  if (tipo === 'som') return (kit.som.gestos[nome]?.sons || []).map((ref) => ({ ref, ...arquivoDoSom(kit, raiz, ref) }));
  if (tipo === '3d') {
    const it = kit.d3.itens.find((i) => i.id === nome);
    const base = dentro(raiz, kit.d3.raiz);
    return ['entra', 'laco', 'inteiro', ...(variacoes ? ['variacoes'] : [])].flatMap((k) => [].concat(it?.[k] ?? []))
      .map((ref) => { const abs = base && dentro(base, ref); return abs ? { ref, abs } : { ref, erro: 'o caminho sai da raiz de material (fora da raiz)' }; });
  }
  const it = kit.lut.itens.find((i) => i.id === nome);
  if (!it) return [];
  const abs = dentro(raiz, it.arquivo);
  return [abs ? { ref: it.arquivo, abs } : { ref: it.arquivo, erro: 'o caminho sai da raiz de material (fora da raiz)' }];
}

const nomes = (kit, tipo) => (tipo === 'som' ? Object.keys(kit.som.gestos) : (tipo === '3d' ? kit.d3 : kit.lut).itens.map((i) => i.id));

export function resolver(ref, kit, raiz) {
  const i = ref.indexOf(':');
  const tipo = ref.slice(0, i), nome = ref.slice(i + 1);
  if (i < 0 || !TIPOS.includes(tipo)) return { erro: `"${ref}": o tipo é som, 3d ou lut (som:tecla, 3d:dinheiro/card, lut:escape-01-s)` };
  if (!nomes(kit, tipo).includes(nome)) {
    const parecidos = nomes(kit, tipo).filter((n) => n.includes(nome) || nome.includes(n)).slice(0, 5);
    return { erro: `"${ref}" não existe no kit`, parecidos };
  }
  if (tipo === 'som' && !kit.som.gestos[nome].sons?.length && kit.som.gestos[nome].gerado) return { erro: `o gesto "${nome}" não tem arquivo: é gerado (${kit.som.gestos[nome].gerado})` };
  const lista = arquivos(kit, raiz, tipo, nome, { variacoes: false });
  const ruim = lista.find((a) => a.erro);
  if (ruim) return { erro: `${ref} → ${ruim.ref}: ${ruim.erro}` };
  const pac = tipo === '3d' ? indiceDoPacote(kit, kit.d3.pacote) : null;
  if (pac && pac.clara !== true) {
    return { arquivos: lista.map((a) => a.abs), aviso: `o 3D é do pacote ${kit.d3.pacote} (${pac.licenca || 'sem licença escrita'}): só no orgânico; em anúncio e em peça de cliente, não entra` };
  }
  return { arquivos: lista.map((a) => a.abs) };
}

export function conferir(kit, raiz) {
  const erros = [];
  let contados = 0;
  for (const tipo of TIPOS) {
    for (const nome of nomes(kit, tipo)) {
      for (const a of arquivos(kit, raiz, tipo, nome)) {
        contados++;
        if (a.erro) erros.push(`${tipo}:${nome} → ${a.ref}: ${a.erro}`);
        else if (!existsSync(a.abs)) erros.push(`${tipo}:${nome} → ${a.ref}: não existe em ${a.abs}`);
      }
    }
  }
  if (!contados) erros.push('o kit não tem nenhum arquivo: medir zero não é passar');
  if (!indiceDoPacote(kit, kit.d3.pacote)) erros.push(`o kit/3d.json não diz o pacote com índice em acervo/ativos/ ("${kit.d3.pacote ?? ''}"): sem ele, a licença do 3D não se sabe`);
  for (const [g, v] of Object.entries(kit.som.gestos)) {
    if (!kit.vocabulario.has(g)) erros.push(`o gesto \`${g}\` do kit/som.json não está no vocabulário do manual/README.md § 4`);
    if (!v.sons?.length && !v.gerado) erros.push(`o gesto \`${g}\` não tem nenhum som no kit e não é gerado`);
  }
  for (const { id, gesto } of kit.citados) {
    if (!kit.vocabulario.has(gesto)) erros.push(`${id} cita o gesto \`${gesto}\`, que o vocabulário do manual/README.md § 4 não tem`);
    else if (!kit.som.gestos[gesto]) erros.push(`${id} cita o gesto \`${gesto}\`, que o kit/som.json não tem`);
  }
  return { erros, arquivos: contados };
}

if (chamadoDireto(import.meta.url)) {
  const args = process.argv.slice(2);
  const opcao = (nome) => { const i = args.indexOf(nome); return i >= 0 ? args.splice(i, 2)[1] : null; };
  const skill = opcao('--skill') || SKILL;
  const raiz = opcao('--raiz') || raizDoKit(skill);
  const [cmd, ref] = args;
  if (!['resolver', 'conferir'].includes(cmd) || (cmd === 'resolver' && !ref)) {
    console.error('uso: kit.mjs resolver som:<gesto>|3d:<id>|lut:<id> | kit.mjs conferir   [--skill <pasta>] [--raiz <raiz de material>]');
    process.exit(2);
  }
  if (!existsSync(raiz)) {
    console.error(`não medi: ${SEM_MATERIAL} (${raiz} não existe)`);
    process.exit(1);
  }
  const kit = lerKit(skill);
  if (cmd === 'resolver') {
    const r = resolver(ref, kit, raiz);
    if (r.erro) {
      console.error(r.erro + (r.parecidos?.length ? `; parecidos: ${r.parecidos.join(', ')}` : ''));
      process.exit(1);
    }
    if (r.aviso) console.error(`aviso: ${r.aviso}`);
    console.log(r.arquivos.join('\n'));
  } else {
    const r = conferir(kit, raiz);
    for (const e of r.erros) console.log(`✗ ${e}`);
    console.log(`kit: ${r.arquivos} arquivo(s) conferido(s) em ${raiz}; ${r.erros.length} erro(s)`);
    process.exit(r.erros.length ? 1 : 0);
  }
}
