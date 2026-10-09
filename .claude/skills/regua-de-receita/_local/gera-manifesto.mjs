// Gera _local/manifesto.json a partir do estado REAL da skill.
//
// Existe porque numero escrito a mao e palpite ate alguem medir. O manifesto e a unica
// lista da skill: quantos principios a base de references/ tem, quais entradas locais a skill
// acrescenta, em que tema cada uma mora, e quais imagens ela carrega.
//
// Rodar: node _local/gera-manifesto.mjs [--escreve]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SKILL = path.resolve(AQUI, '..');
const REFS = path.join(SKILL, 'references');
const ENTRADAS = path.join(AQUI, 'entradas');
const ESCREVE = process.argv.includes('--escreve');

// A versao da skill. Sobe a cada lote que traz principio novo (atualizar.md, passo 7): o ultimo
// numero sobe um (1.0.0 -> 1.0.1); mudanca de forma ou de tema sobe o do meio.
const VERSAO = '1.0.0';

// A BASE: os principios que references/ traz sem vir de uma entrada local. E um FATO fixo, nao
// uma conta sobre o estado atual: calcular `principios de agora - entradas` so funciona enquanto
// toda entrada ja esta aplicada, e entrada escrita e ainda nao inserida faria o numero cair e a
// conferencia mirar o alvo errado. Muda so quando alguem tira (ou junta) um principio da base de
// proposito, e o lote diz isso no relatorio.
const BASE_PRINCIPIOS = 231;

const refs = fs
  .readdirSync(REFS)
  .filter((f) => f.endsWith('.md'))
  .map((f) => ({ nome: f, tema: f.replace('.md', ''), txt: fs.readFileSync(path.join(REFS, f), 'utf8') }));

const principiosAgora = refs.reduce((s, r) => s + (r.txt.match(/^## /gm) || []).length, 0);
const IMG = /\.\.\/assets\/([a-z0-9-]+\/[a-z0-9-]+\.(?:jpg|png|webp))/g;

// Cada arquivo de entradas/ e um bloco de principio pronto (ou um enriquecimento de um que existe).
const entradas = (fs.existsSync(ENTRADAS) ? fs.readdirSync(ENTRADAS) : [])
  .filter((f) => f.endsWith('.md'))
  .sort((a, b) => parseInt(a) - parseInt(b))
  .map((arq) => {
    const txt = fs.readFileSync(path.join(ENTRADAS, arq), 'utf8');
    const titulo = (txt.match(/^## (.+)$/m) || [, ''])[1].trim();
    const tema = arq.replace(/^\d+-/, '').replace('.md', '');
    // Os assets saem do ARQUIVO DA ENTRADA, que e a fonte de verdade das linhas Visual: a entrada
    // nova ainda nao esta em references/.
    const assets = [...txt.matchAll(IMG)].map((m) => m[1]);
    // Entrada de ENRIQUECIMENTO: nao tem titulo proprio, so as linhas rotuladas que vao entrar num
    // bloco que ja existe. Ela declara o alvo (o titulo exato do bloco) na primeira linha, porque o
    // alvo nao da para derivar do conteudo -- e escolha editorial de qual bloco enriquecer.
    const decl = txt.match(/^<!--\s*alvo:\s*(.+?)\s*\|\s*tema:\s*(\S+)\s*-->/);
    if (decl) {
      return {
        arquivo: arq,
        tema: decl[2],
        modo: 'enriquecer',
        alvo: decl[1],
        campos: [...txt.matchAll(/^\*\*([A-Za-z ]+)\.\*\*/gm)].map((m) => m[1]),
        assets,
      };
    }
    return { arquivo: arq, tema, modo: 'novo', titulo, assets };
  });

// Imagens em assets/ que nenhum principio cita. O SKILL.md diz DE PROPOSITO que elas
// existem como biblioteca extra, entao orfa nao pode reprovar as cegas -- o manifesto
// declara quais sao esperadas, e so orfa NOVA e inesperada reprova.
// assets/ tem uma pasta por tema: o caminho relativo e o nome da imagem
const listaRec = (d, pre = '') => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }) : [])
  .flatMap((e) => (e.isDirectory() ? listaRec(path.join(d, e.name), pre + e.name + '/') : [pre + e.name]));
const todasImg = listaRec(path.join(SKILL, 'assets'));
const citadas = new Set();
refs.forEach((r) => [...r.txt.matchAll(IMG)].forEach((m) => citadas.add(m[1])));
const orfas = todasImg.filter((i) => !citadas.has(i)).sort();

const manifesto = {
  versao: VERSAO,
  base: {
    principios: BASE_PRINCIPIOS,
    arquivos: refs.length,
    imagens: todasImg.length,
  },
  orfas_esperadas: orfas,
  entradas,
};

console.log(`principios hoje        : ${principiosAgora}`);
console.log(`entradas locais        : ${entradas.length}`);
console.log(`base                   : ${BASE_PRINCIPIOS}`);
console.log(`imagens orfas esperadas: ${orfas.length}`);
console.log(`entradas com asset     : ${entradas.filter((e) => e.assets.length).length}`);
const semTitulo = entradas.filter((e) => e.modo === 'novo' && !e.titulo);
if (semTitulo.length) console.log(`AVISO: ${semTitulo.length} entrada(s) sem título (## ...)`);

if (ESCREVE) {
  fs.writeFileSync(path.join(AQUI, 'manifesto.json'), JSON.stringify(manifesto, null, 2) + '\n', 'utf8');
  console.log('\ngravado _local/manifesto.json');
} else {
  console.log('\nsimulacao. Rode com --escreve para gravar.');
}
