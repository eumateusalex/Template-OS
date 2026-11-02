// MOLDE do gerar.js de uma peça estilo X. Copiar para a pasta da peça
// (carrosseis/x-<tema>-AAAA-MM-DD/gerar.js), preencher o PERFIL e escrever os
// slides. Depois:
//
//   node .claude/skills/carrossel/render/montar-x.mjs carrosseis/<pasta da peça>
//
// O molde mora na skill, e não numa peça de exemplo, porque peça se apaga e o
// molde precisa durar.
const fs = require('fs');
const path = require('path');

// A raiz do projeto se acha subindo até a pasta que tem .claude/, e não
// contando `..`: a peça pode morar em qualquer profundidade.
let RAIZ = __dirname;
while (!fs.existsSync(path.join(RAIZ, '.claude', 'skills', 'carrossel'))) {
  const acima = path.dirname(RAIZ);
  if (acima === RAIZ) throw new Error(`não achei a raiz do projeto subindo a partir de ${__dirname}`);
  RAIZ = acima;
}
const MODELO = path.join(RAIZ, '.claude', 'skills', 'carrossel', 'x', 'modelo.html');
const SAIDA = path.join(__dirname, 'carrossel.html');

// O caminho da peça visto pelo render, a partir da raiz do projeto. Toda
// imagem da peça se escreve a partir dele.
const P = '/' + path.relative(RAIZ, __dirname).split(path.sep).join('/');

// ─── o perfil: o mesmo em todo slide ──────────────────────────────────────
// nome e @ vêm de _memoria/empresa.md; a foto é a de perfil de verdade,
// quadrada, mínimo 400×400 (por padrão, avatar.jpg na pasta da peça; quem usa
// sempre a mesma pode apontar para um arquivo fixo do projeto, sempre com
// caminho absoluto a partir da raiz). O selo só liga se a conta é verificada.
const PERFIL = {
  nome: 'SEU NOME',
  handle: '@SEU_PERFIL',
  avatar: `${P}/avatar.jpg`,
  selo: false,
};

// O <head> vem do modelo na hora. Nunca copiar o CSS para cá: peça com CSS
// congelado sai com a régua do dia em que foi gerada, e o conferidor reprova.
const head = fs.readFileSync(MODELO, 'utf8')
  .split('</head>')[0]
  .replace('Carrossel estilo X, modelo', '<título da peça>');

const SELO = '<span class="selo"><svg viewBox="0 0 22 22"><circle cx="11" cy="11" r="10"/><path d="M6.5 11.3l3 3 6-6.4" fill="none" stroke="#fff" stroke-width="2.2"/></svg></span>';

const cab = `
  <div class="tw-head">
    <div class="tw-avatar" style="background-image:url('${PERFIL.avatar}')"></div>
    <div class="tw-nome">
      <b${PERFIL.selo ? ' class="com-selo"' : ''}>${PERFIL.nome}${SELO}</b>
      <span>${PERFIL.handle}</span>
    </div>
  </div>`;

// `topo: true` encosta o slide no topo. Slide com imagem quase sempre quer;
// slide curto de texto fica melhor centralizado.
const slide = (blocos, { topo = false, media = '' } = {}) =>
`<section class="slide${topo ? ' topo' : ''}">${cab}

  <div class="tw-body">
${blocos.map((b) => '    <p>' + b + '</p>').join('\n')}
  </div>${media}
</section>`;

// Imagem única: sempre 2:1 (1976×988), inteira no quadro.
const img = (a) => `

  <div class="tw-media">
    <img src="${P}/${a}" alt="">
  </div>`;

// Duas imagens lado a lado, quadradas: rosto e símbolo, ou antes e depois.
const dupla = (a, b) => `

  <div class="tw-media dupla">
    <div><img src="${P}/${a}" alt=""></div>
    <div><img src="${P}/${b}" alt=""></div>
  </div>`;

// Enquanto a imagem não chegou: o slot com id, o que precisa aparecer e o mínimo.
const slot = (id, oque, minimo = 'mín. 1976×988 · 2:1') => `

  <div class="tw-media">
    <div class="slot"><b>${id}</b><span>${oque}</span><i>${minimo}</i></div>
  </div>`;

const slides = [

  // CAPA: a promessa com a perda, o número exato quando é lista, o convite ao
  // swipe fechado com ponto antes do emoji. Leva imagem.
  slide([
    '<a promessa, com o que a pessoa perde>',
    '<o número exato, quando for lista>',
    '<o convite ao swipe>. 👉',
  ], { topo: true, media: dupla('capa-a.jpg', 'capa-b.jpg') }),

  // MIOLO com imagem: só quando existe registro real do que a frase afirma.
  slide([
    '<uma ideia por slide>',
    '<de 2 a 6 blocos; a variação é o ritmo>',
  ], { topo: true, media: slot('IMG 02-A', '<o que precisa aparecer>') }),

  // MIOLO sem imagem: lição abstrata ou fala com o leitor.
  slide([
    '<slide de método não tem rosto, então não leva foto>',
  ]),

  // FECHO: o próximo passo concreto e uma ação colada no tema.
  slide([
    '<o próximo passo concreto, pequeno>',
    '<a chamada, saindo do tema>. 👇',
  ]),

];

fs.writeFileSync(SAIDA, head + '</head>\n<body>\n\n' + slides.join('\n\n') + '\n\n</body>\n</html>\n');
console.log(`carrossel.html gerado: ${slides.length} slides`);
