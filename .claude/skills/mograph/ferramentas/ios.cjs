// A linguagem do iPhone · os construtores dos componentes .ios-* da interface de celular na peça.
//
// Cada construtor devolve o HTML de UM componente, só estrutura: a fonte, as cores e o desenho vêm
// do CSS das classes .ios-* (na marca da pessoa, em `_marca/`), nunca daqui. Quem leva o HTML à
// página é o ios-vivo.mjs, a partir do fonte/ios.json da peça (manual: comum.componentes.kit-vivo).
//
// Registro: por padrão o componente segue o fundo da cena. `escuro: true` força o escuro, `vidro:
// true` põe o material translúcido (sobre foto).
//
// Emoji: sai no desenho da Apple, como imagem do material (`material/emoji/` da skill, os PNG de
// 160 pixels do iamcal/emoji-data, o maior bitmap que a Apple distribui). O pacote vem pelo
// /instalar e fica fora do git; o emoji que não está lá explode dizendo o comando que o baixa
// (emoji.mjs --baixar). O MOGRAPH_MATERIAL troca a pasta do material, nos testes.

const fs = require('fs');
const path = require('path');
// O hífen que não quebra: o navegador quebra linha depois do hífen, e o número tabular da Inter
// alarga o hífen comum ("follow - up"). O inquebrável (U+2011) desenha igual e não muda com o
// tabular. Só age entre letra e letra ou algarismo, e só fora de tag (o hífen de uma classe fica).
const semQuebraDeHifen = t =>
  (typeof t === 'string' ? t.replace(/(<[^>]*>)|(?<=\p{L})-(?=[\p{L}\p{N}])|(?<=\p{N})-(?=\p{L})/gu, (m, tag) => tag || '‑') : t);
const EMOJI_DIR = path.join(process.env.MOGRAPH_MATERIAL || path.join(__dirname, '..', 'material'), 'emoji');
// o endereço do emoji no HTML que o Node devolve: o ios-vivo.mjs troca pelo caminho da peça
const EMOJI_WEB = '/mograph/material/emoji';
// A expressão pega a sequência inteira (bandeira,
// tom de pele, família com ZWJ, tecla), e não codepoint por codepoint.
const RE_EMOJI = /(?:\p{RI}\p{RI}|\p{Extended_Pictographic}(?:\uFE0F|\u20E3|[\u{1F3FB}-\u{1F3FF}]|\u200D(?:\p{Extended_Pictographic}|[\u{1F3FB}-\u{1F3FF}]))*)/gu;
// O material nomeia o arquivo SEM o seletor de variação (FE0F) na maioria, e COM ele nos símbolos
// antigos (o ❤️ é 2764-fe0f.png). Como o arquivo está no disco, o nome certo se acha na montagem.
// Os nomes possíveis do arquivo, na ordem de tentar: sem o FE0F primeiro, depois com ele (um nome só
// quando o emoji não tem FE0F). O baixador (emoji.mjs) usa a mesma lista
const nomesDoArquivo = (e) => {
  const cps = [...e].map(c => c.codePointAt(0).toString(16));
  const sem = cps.filter(c => c !== 'fe0f').join('-');
  const com = cps.join('-');
  return sem === com ? [sem] : [sem, com];
};
const nomeNoAcervo = (e) => nomesDoArquivo(e).find(n => fs.existsSync(path.join(EMOJI_DIR, `${n}.png`))) || null;
const emoji = t => String(t).replace(RE_EMOJI, e => {
  const nome = nomeNoAcervo(e);
  if (!nome) throw new Error(`o emoji ${e} não está no material (material/emoji/ da /mograph): rode /instalar, ou node .claude/skills/mograph/ferramentas/emoji.mjs --baixar ${e}`);
  return `<img src="${EMOJI_WEB}/${nome}.png" alt="${e}">`;
});

const exige = (obj, campos, onde) => {
  for (const c of campos)
    if (obj == null || obj[c] === undefined || obj[c] === '') throw new Error(`${onde}: falta "${c}"`);
};
// a lista com o teto da peça: menos não diz, mais passa do quadro (o porquê vai em `porque`)
const naFaixa = (lista, [min, max], onde, oque, porque = '') => {
  if (!Array.isArray(lista) || lista.length < min || lista.length > max)
    throw new Error(`${onde}: ${oque} são de ${min} a ${max} (veio ${Array.isArray(lista) ? lista.length : 'nada'})${porque}`);
  return lista;
};
const raiz = (nome, { escuro, vidro } = {}) => `ios ios-${nome}${escuro ? ' escuro' : ''}${vidro ? ' vidro' : ''}`;
const inicial = nome => String(nome).trim().charAt(0).toUpperCase();
const avatar = (nome, foto) => (foto ? `<img src="${foto}" alt="">` : inicial(nome));

const IC = {
  sinal: '<svg viewBox="0 0 18 11"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="5" y="5" width="3" height="6" rx="1"/><rect x="10" y="2.5" width="3" height="8.5" rx="1"/><rect x="15" y="0" width="3" height="11" rx="1"/></svg>',
  wifi: '<svg viewBox="0 0 16 11"><path d="M8 11 5.6 8.4a3.4 3.4 0 0 1 4.8 0zM2.8 5.6a7.4 7.4 0 0 1 10.4 0l-1.4 1.4a5.4 5.4 0 0 0-7.6 0zM0 2.8a11.4 11.4 0 0 1 16 0l-1.4 1.4a9.4 9.4 0 0 0-13.2 0z"/></svg>',
  bateria: '<svg viewBox="0 0 26 12"><rect x=".5" y=".5" width="22" height="11" rx="3" fill="none" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="19" height="8" rx="1.8"/><rect x="23.5" y="4" width="2" height="4" rx="1" opacity=".4"/></svg>',
  lupa: '<svg viewBox="0 0 16 16"><circle cx="7" cy="7" r="5"/><path d="M11 11l3.5 3.5"/></svg>',
  check: '<svg viewBox="0 0 16 16"><path d="M3 8.5l3.2 3L13 4.5"/></svg>',
  tel: '<svg viewBox="0 0 24 24"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z"/></svg>',
  camera: '<svg viewBox="0 0 24 24"><path d="M3 7h11a2 2 0 0 1 2 2v1.5l4-2.5v8l-4-2.5V15a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z"/></svg>',
  lua: '<svg viewBox="0 0 24 24"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M7 4.5v15l12-7.5z"/></svg>',
  pausa: '<svg viewBox="0 0 24 24"><rect x="6" y="4.5" width="4" height="15" rx="1"/><rect x="14" y="4.5" width="4" height="15" rx="1"/></svg>',
  avanca: '<svg viewBox="0 0 24 24"><path d="M3 5v14l8-7zM12 5v14l8-7z"/></svg>',
  som: '<svg viewBox="0 0 48 48"><path d="M8 19h7l10-8v26l-10-8H8z"/><path d="M31 18a8 8 0 0 1 0 12M35 13a15 15 0 0 1 0 22"/></svg>',
  mudo: '<svg viewBox="0 0 48 48"><path d="M8 19h7l10-8v26l-10-8H8z"/><path d="M32 19l10 10M42 19 32 29"/></svg>',
  sol: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" stroke="currentColor" stroke-width="2"/></svg>',
  cadeado: '<svg viewBox="0 0 16 16"><rect x="3" y="7" width="10" height="8" rx="2"/><path d="M5 7V5a3 3 0 0 1 6 0v2"/></svg>',
  recarrega: '<svg viewBox="0 0 16 16"><path d="M13 8a5 5 0 1 1-1.5-3.6M13 2v3h-3"/></svg>',
  copiar: '<svg viewBox="0 0 20 20"><rect x="6" y="6" width="11" height="11" rx="2"/><path d="M3 13V4a1 1 0 0 1 1-1h9"/></svg>',
  responder: '<svg viewBox="0 0 20 20"><path d="M8 5 3 10l5 5M3 10h9a5 5 0 0 1 5 5"/></svg>',
  editar: '<svg viewBox="0 0 20 20"><path d="M4 16l1-4 8-8 3 3-8 8zM12 5l3 3"/></svg>',
  lixo: '<svg viewBox="0 0 20 20"><path d="M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10"/></svg>',
  encaminhar: '<svg viewBox="0 0 20 20"><path d="M12 5l5 5-5 5M17 10H8a5 5 0 0 0-5 5"/></svg>',
};

// ── MENSAGENS ───────────────────────────────────────────────────────────────
// A bolha. `de`: 'rec' (quem chega), 'env' (quem manda) ou 'sms' (a verde).
const bolha = ({ texto, de = 'rec', cauda = false, reacao }) => {
  exige({ texto }, ['texto'], 'ios.bolha()');
  if (!['rec', 'env', 'sms'].includes(de)) throw new Error(`ios.bolha(): de "${de}" não existe. Use: rec, env, sms`);
  const b = `<div class="ios-bolha ${de}${cauda ? ' cauda' : ''}">${emoji(texto)}</div>`;
  return reacao ? `<div class="ios-reacao ${de}">${b}<i>${emoji(reacao)}</i></div>` : b;
};
const digitando = () => '<div class="ios-digitando"><i></i><i></i><i></i></div>';
const audio = ({ duracao = '0:14', de = 'env' } = {}) => {
  const alturas = [6, 10, 16, 12, 20, 8, 14, 22, 10, 16, 8, 12, 18, 10, 6, 12, 16, 8];
  return `<div class="ios ios-audio${de === 'rec' ? ' rec' : ''}">${IC.play}<span class="onda">${alturas.map(h => `<i style="height:calc(var(--p) * ${h})"></i>`).join('')}</span><span>${duracao}</span></div>`;
};

// A conversa em tela cheia. `mensagens`: lista de { texto, de, cauda?, reacao?,
// lido?, digitando? } — `lido` põe o "lido 9:43" embaixo daquela bolha.
const conversa = ({ contato, foto, dia = 'hoje', hora = '9:41', mensagens, entrada = 'iMessage', escuro }) => {
  exige({ contato }, ['contato'], 'ios.conversa()');
  if (!Array.isArray(mensagens) || !mensagens.length) throw new Error('ios.conversa(): "mensagens" precisa de pelo menos uma');
  const corpo = mensagens.map(m => {
    if (m.digitando) return digitando();
    return bolha(m) + (m.lido ? `<div class="ios-lido">${m.lido}</div>` : '');
  }).join('');
  return `<div class="${raiz('tela', { escuro })}">` +
    `<div class="ios-status"><span>${hora}</span><span class="ics">${IC.sinal}${IC.wifi}${IC.bateria}</span></div>` +
    `<div class="ios-cab"><span class="volta"></span><div class="av">${avatar(contato, foto)}</div><small>${contato} ›</small></div>` +
    `<div class="ios-corpo"><div class="ios-dia"><b>${dia}</b> ${hora}</div>${corpo}</div>` +
    `<div class="ios-entrada"><span class="mais">+</span><span class="cx">${entrada}</span></div></div>`;
};

// ── ALERTAS E MENUS ─────────────────────────────────────────────────────────
// `botoes`: um ou dois, { texto, forte?, perigo? }. `campo`: o placeholder do
// campo de texto (o alerta que pede um nome).
const alerta = ({ titulo, texto, botoes, campo, escuro, vidro }) => {
  exige({ titulo }, ['titulo'], 'ios.alerta()');
  if (!Array.isArray(botoes) || botoes.length < 1 || botoes.length > 2) throw new Error('ios.alerta(): "botoes" são um ou dois');
  return `<div class="${raiz('alerta', { escuro, vidro })}"><div class="tx"><b>${titulo}</b>` +
    (texto ? `<p>${texto}</p>` : '') + (campo ? `<div class="campo">${campo}</div>` : '') + '</div>' +
    `<div class="bts${botoes.length === 1 ? ' um' : ''}">${botoes.map(b => {
      const o = typeof b === 'string' ? { texto: b } : b;
      const c = [o.forte && 'forte', o.perigo && 'perigo'].filter(Boolean).join(' ');
      return `<span${c ? ` class="${c}"` : ''}>${o.texto}</span>`;
    }).join('')}</div></div>`;
};
const toast = ({ texto, escuro }) => {
  exige({ texto }, ['texto'], 'ios.toast()');
  return `<div class="${raiz('toast', { escuro })}"><i>${IC.check}</i>${texto}</div>`;
};
const menuEditar = ({ itens = ['recortar', 'copiar', 'colar'] } = {}) =>
  `<div class="ios ios-menu-editar">${itens.map(t => `<span>${t}</span>`).join('')}</div>`;
// `itens`: { texto, icone? (copiar, responder, editar, lixo, encaminhar), perigo? }
const menu = ({ itens, escuro, vidro }) => {
  if (!Array.isArray(itens) || itens.length < 2) throw new Error('ios.menu(): "itens" precisa de pelo menos dois');
  return `<div class="${raiz('menu', { escuro, vidro })}">${itens.map(i => {
    const o = typeof i === 'string' ? { texto: i } : i;
    if (o.icone && !IC[o.icone]) throw new Error(`ios.menu(): ícone "${o.icone}" não existe`);
    return `<div${o.perigo ? ' class="perigo"' : ''}><span>${o.texto}</span>${o.icone ? IC[o.icone] : ''}</div>`;
  }).join('')}</div>`;
};

// ── CONTROLES ───────────────────────────────────────────────────────────────
// `linhas`: { texto, ligado? (interruptor), valor? (texto cinza à direita) }
const ajustes = ({ linhas, escuro }) => {
  if (!Array.isArray(linhas) || !linhas.length) throw new Error('ios.ajustes(): "linhas" vazio');
  return `<div class="${raiz('ajustes', { escuro })}">${linhas.map(l => {
    exige(l, ['texto'], 'ios.ajustes().linhas');
    const dir = l.valor !== undefined ? `<small>${l.valor}</small>` : `<span class="ios-chave${l.ligado ? ' on' : ''}"></span>`;
    // `destaque: true`: a linha que importa, com o valor no peso e na cor do texto
    return `<div${l.destaque ? ' class="destaque"' : ''}><span>${l.texto}</span>${dir}</div>`;
  }).join('')}</div>`;
};
const busca = ({ texto, cancelar = true, escuro }) => {
  const vazio = !texto;
  return `<div class="${raiz('busca', { escuro })}"><span class="campo${vazio ? ' vazio' : ''}">${IC.lupa}<span class="q">${vazio ? 'buscar' : texto}</span>${vazio ? '' : '<span class="ios-cursor"></span>'}</span>` +
    (cancelar ? '<span class="canc">cancelar</span>' : '') + '</div>';
};
const campo = ({ texto, escuro }) => {
  exige({ texto }, ['texto'], 'ios.campo()');
  return `<div class="${raiz('campo', { escuro })}">${emoji(texto)}<span class="ios-cursor"></span></div>`;
};
const safari = ({ url, escuro }) => {
  exige({ url }, ['url'], 'ios.safari()');
  return `<div class="${raiz('safari', { escuro })}"><span class="aa">AA</span><span class="url">${IC.cadeado.replace('<svg', '<svg style="display:inline-block;vertical-align:-.15em;margin-right:.3em"')}${url}</span>${IC.recarrega}</div>`;
};

// ── SISTEMA ─────────────────────────────────────────────────────────────────
const ilha = ({ nome, rotulo = 'celular', foto }) => {
  exige({ nome }, ['nome'], 'ios.ilha()');
  return `<div class="ios ios-ilha"><div class="av">${avatar(nome, foto)}</div><div class="q"><small>${rotulo}</small><b>${nome}</b></div>` +
    `<span class="bt no">${IC.tel.replace('<svg', '<svg style="transform:rotate(135deg)"')}</span><span class="bt si">${IC.tel}</span></div>`;
};
const foco = ({ titulo = 'não perturbe', estado = 'ativado' } = {}) =>
  `<div class="ios ios-foco"><i>${IC.lua}</i><span><b>${titulo}</b><small>${estado}</small></span></div>`;
// `tipo`: 'volume' ou 'mudo'. `nivel`: 0 a 100 (só no volume)
const hud = ({ tipo = 'volume', nivel = 60, escuro, vidro = true } = {}) => {
  if (!['volume', 'mudo'].includes(tipo)) throw new Error(`ios.hud(): tipo "${tipo}" não existe. Use: volume, mudo`);
  return `<div class="${raiz('hud', { escuro, vidro })}"><small>${tipo === 'mudo' ? 'silencioso' : 'volume'}</small>${tipo === 'mudo' ? IC.mudo : IC.som}` +
    (tipo === 'volume' ? `<span class="nivel" style="--ios-valor:${nivel}%"><i></i></span>` : '') + '</div>';
};

// ── APPS DA APPLE ───────────────────────────────────────────────────────────
// a última palavra colada na anterior (o espaço inquebrável): sem isso, na lista de Lembretes ela fica sozinha na linha ("dia",
// "técnico"). Mora no construtor, e não no preset, para valer em toda chamada. A palavra que
// é tag ou tem tag dentro não se cola: o espaço de dentro de uma tag é atributo.
const colaUltima = s => String(s).replace(/ ([^\s<>]+)$/, ' $1');
// `itens`: { texto, feito?, quando? }
const lembretes = ({ itens, escuro }) => {
  if (!Array.isArray(itens) || !itens.length) throw new Error('ios.lembretes(): "itens" vazio');
  return `<div class="${raiz('lembretes', { escuro })}">${itens.map(i => {
    const o = typeof i === 'string' ? { texto: i } : i;
    return `<div${o.feito ? ' class="feito"' : ''}><span class="c">${o.feito ? IC.check : ''}</span><span>${colaUltima(o.texto)}${o.quando ? `<small>${colaUltima(o.quando)}</small>` : ''}</span></div>`;
  }).join('')}</div>`;
};
const notas = ({ titulo, texto, data, escuro }) => {
  exige({ titulo, texto }, ['titulo', 'texto'], 'ios.notas()');
  return `<div class="${raiz('notas', { escuro })}"><div class="barra"><span>‹ notas</span><span>feito</span></div>` +
    (data ? `<small>${data}</small>` : '') + `<b>${titulo}</b><p>${emoji(texto)}</p></div>`;
};
const evento = ({ titulo, horario, de = '16:00', ate = '17:00', escuro }) => {
  exige({ titulo }, ['titulo'], 'ios.evento()');
  return `<div class="${raiz('evento', { escuro })}"><div class="horas"><span>${de}</span><span>${ate}</span></div>` +
    // "às", e não o travessão
    `<div class="bloco"><b>${titulo}</b><small>${horario || `${de} às ${ate}`}</small></div></div>`;
};
// `dias`: sete números; `hoje`: o índice (0 a 6) do dia marcado
const dias = ({ mes, dias: d, hoje, data, escuro }) => {
  exige({ mes }, ['mes'], 'ios.dias()');
  if (!Array.isArray(d) || d.length !== 7) throw new Error('ios.dias(): "dias" são sete');
  if (!(hoje >= 0 && hoje <= 6)) throw new Error('ios.dias(): "hoje" é o índice do dia, de 0 a 6');
  return `<div class="${raiz('dias', { escuro })}"><div class="mes">‹ ${mes}</div>` +
    `<div class="sem">${['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map(x => `<span>${x}</span>`).join('')}</div>` +
    `<div class="dias-num">${d.map((n, i) => `<span${i === hoje ? ' class="hoje"' : ''}>${n}</span>`).join('')}</div>` +
    (data ? `<div class="data">${data}</div>` : '') + '</div>';
};
const mail = ({ de, assunto, previa, hora = '09:24', novo = true, escuro }) => {
  exige({ de, assunto }, ['de', 'assunto'], 'ios.mail()');
  return `<div class="${raiz('mail', { escuro })}"><span>${novo ? '<i class="novo" style="display:block"></i>' : ''}</span>` +
    `<div><div class="de"><span>${de}</span><small>${hora} ›</small></div><div class="as">${assunto}</div>` +
    (previa ? `<div class="pre">${previa}</div>` : '') + '</div></div>';
};
// `itens`: { hora, rotulo?, ligado? }
const alarmes = ({ itens, escuro }) => {
  if (!Array.isArray(itens) || !itens.length) throw new Error('ios.alarmes(): "itens" vazio');
  return `<div class="${raiz('alarmes', { escuro })}">${itens.map(a => {
    exige(a, ['hora'], 'ios.alarmes().itens');
    return `<div${a.ligado === false ? ' class="off"' : ''}><span><b>${a.hora}</b>${a.rotulo ? `<small>${a.rotulo}</small>` : ''}</span><span class="ios-chave${a.ligado === false ? '' : ' on'}"></span></div>`;
  }).join('')}</div>`;
};
const tocando = ({ titulo, artista, capa, tocando: ativo = true, escuro }) => {
  exige({ titulo }, ['titulo'], 'ios.tocando()');
  return `<div class="${raiz('tocando', { escuro })}"><span class="capa">${capa ? `<img src="${capa}" alt="">` : ''}</span>` +
    `<span class="q"><b>${titulo}</b>${artista ? `<small>${artista}</small>` : ''}</span><span class="ctl">${ativo ? IC.pausa : IC.play}${IC.avanca}</span></div>`;
};
const facetime = ({ nome, rotulo = 'vídeo do FaceTime', foto, escuro, vidro = true }) => {
  exige({ nome }, ['nome'], 'ios.facetime()');
  return `<div class="${raiz('facetime', { escuro, vidro })}"><div class="av">${avatar(nome, foto)}</div><div class="q"><small>${rotulo}</small><b>${nome}</b></div>` +
    `<span class="bt no">${IC.tel.replace('<svg', '<svg style="transform:rotate(135deg)"')}</span><span class="bt si">${IC.camera}</span></div>`;
};
const clima = ({ cidade, graus, resumo = 'ensolarado', maxmin }) => {
  exige({ cidade, graus }, ['cidade', 'graus'], 'ios.clima()');
  return `<div class="ios ios-clima"><b>${cidade}</b><div class="graus">${graus}°</div>${IC.sol}<small>${resumo}${maxmin ? `<br>${maxmin}` : ''}</small></div>`;
};

// ── WIDGETS ─────────────────────────────────────────────────────────────────
// O card de widget: `rotulo` em cima, `grande` (o número) e `texto`; `barra`
// de 0 a 100 põe a barra de progresso. `largo` ocupa as duas colunas.
const widget = ({ rotulo, grande, texto, barra, azul = false, largo = false, escuro }) => {
  exige({ rotulo }, ['rotulo'], 'ios.widget()');
  if (barra !== undefined && !(barra >= 0 && barra <= 100)) throw new Error('ios.widget(): "barra" vai de 0 a 100');
  return `<div class="${raiz('widget', { escuro })}${largo ? ' largo' : ''}"><small>${rotulo}</small>` +
    (grande !== undefined ? `<span class="grande${azul ? ' azul' : ''}">${grande}</span>` : '') +
    (texto ? `<p>${emoji(texto)}</p>` : '') + (barra !== undefined ? `<div class="barra" style="--ios-valor:${barra}%"><i></i></div>` : '') + '</div>';
};
const pilha = ({ nomes, texto, fotos = [] }) => {
  if (!Array.isArray(nomes) || nomes.length < 2) throw new Error('ios.pilha(): "nomes" precisa de pelo menos dois');
  return `<div class="ios ios-pilha"><span class="rostos">${nomes.slice(0, 4).map((n, i) => `<span>${avatar(n, fotos[i])}</span>`).join('')}</span>${texto || ''}</div>`;
};

// ── ARQUIVOS ────────────────────────────────────────────────────────────────
const pasta = ({ nome }) => {
  exige({ nome }, ['nome'], 'ios.pasta()');
  return `<div class="ios ios-pasta"><span class="pasta-forma"></span><span>${nome}</span></div>`;
};
const arquivo = ({ nome, img, selecionado = false }) => {
  exige({ nome }, ['nome'], 'ios.arquivo()');
  return `<div class="ios ios-arquivo${selecionado ? ' selecionado' : ''}"><span class="mini">${img ? `<img src="${img}" alt="">` : ''}</span><span>${nome}</span></div>`;
};

// ── REAÇÕES, RESPOSTA, E-MAIL, CHIPS, PLAYER E DICA ─────────────────────────
// O registro vem da cena, por isso não aceitam `escuro`. A fileira de rostos é o ios.pilha.

// A fileira de reações do iMessage: `ativa` é o índice da que está marcada.
const reacoes = ({ emojis, ativa, mais = true }) => {
  if (!Array.isArray(emojis) || !emojis.length || emojis.length > 6) throw new Error('ios.reacoes(): "emojis" são de 1 a 6');
  if (ativa !== undefined && !(Number.isInteger(ativa) && ativa >= 0 && ativa < emojis.length)) throw new Error(`ios.reacoes(): "ativa" é o índice de um dos ${emojis.length} emojis`);
  return `<div class="ios ios-reacoes">${emojis.map((e, i) => (i === ativa ? `<span class="ativa">${emoji(e)}</span>` : emoji(e))).join('')}` +
    (mais ? '<span class="mais">+</span>' : '') + '</div>';
};
// A resposta a uma mensagem citada. `de`: 'env' (quem manda) ou 'rec'.
const resposta = ({ citada, texto, de = 'env' }) => {
  exige({ citada, texto }, ['citada', 'texto'], 'ios.resposta()');
  if (!['env', 'rec'].includes(de)) throw new Error(`ios.resposta(): de "${de}" não existe. Use: env, rec`);
  return `<div class="ios ios-resposta${de === 'env' ? ' env' : ''}"><span class="citada">${emoji(citada)}</span><span class="fio"></span>` +
    `<span class="ios-bolha ${de} cauda">${emoji(texto)}</span></div>`;
};
// O e-mail sendo escrito: a IA redigindo, o dono só aperta enviar.
const mailNovo = ({ para, assunto, texto, cursor = true }) => {
  exige({ para, assunto, texto }, ['para', 'assunto', 'texto'], 'ios.mailNovo()');
  return '<div class="ios ios-mail-novo"><div class="topo"><span>nova mensagem</span><span class="enviar"><svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg></span></div>' +
    `<div class="campo"><span>para:</span>${para}</div><div class="campo"><span>assunto:</span>${assunto}</div>` +
    `<div class="corpo">${emoji(texto)}${cursor ? '<span class="cursor"></span>' : ''}</div></div>`;
};
// Os chips de resultado: 1 a 3, cada um com um emoji da Apple OU a seta.
const chips = ({ itens }) => {
  if (!Array.isArray(itens) || !itens.length || itens.length > 3) throw new Error('ios.chips(): "itens" são de 1 a 3');
  return `<div class="ios ios-chips">${itens.map(i => {
    const o = typeof i === 'string' ? { texto: i } : i;
    exige(o, ['texto'], 'ios.chips().itens');
    if (o.emoji && o.seta) throw new Error('ios.chips(): um chip leva emoji OU seta, não os dois');
    // o hífen inquebrável: o tabular do chip alarga o hífen comum
    return `<span>${o.emoji ? emoji(o.emoji) : ''}${o.seta ? '<b class="seta">↗</b>' : ''}${semQuebraDeHifen(emoji(o.texto))}</span>`;
  }).join('')}</div>`;
};
// O player de áudio em linha. `valor`: 0 a 100, onde o trilho está.
const player = ({ titulo, valor, tempo = '0:00' }) => {
  exige({ titulo }, ['titulo'], 'ios.player()');
  if (!(typeof valor === 'number' && valor >= 0 && valor <= 100)) throw new Error('ios.player(): "valor" vai de 0 a 100');
  return `<div class="ios ios-player" style="--ios-valor:${valor}%">${IC.play}<b>${titulo}</b><span class="trilho"><i></i></span><small>${tempo}</small></div>`;
};
// O "tocando agora" grande, da tela bloqueada.
const tocandoGrande = ({ titulo, artista, capa, rotulo = 'TOCANDO AGORA' }) => {
  exige({ titulo }, ['titulo'], 'ios.tocandoGrande()');
  return `<div class="ios ios-tocando-grande"><span class="capa">${capa ? `<img src="${capa}" alt="">` : ''}</span>` +
    `<div><small>${rotulo}</small><b>${titulo}</b>${artista ? `<span>${artista}</span>` : ''}</div></div>`;
};
// O balão de dica do iOS (o tooltip com a pontinha em cima).
const dica = ({ texto } = {}) => {
  exige({ texto }, ['texto'], 'ios.dica()');
  return `<div class="ios ios-dica">${emoji(texto)}</div>`;
};

// ── AS PEÇAS DA LINGUAGEM APPLE ─────────────────────────────────────────────
// O cabeçalho de seção dos Lembretes e dos Ajustes (o antes e depois), a automação do Atalhos, os
// eventos cancelados do Calendário (a agenda com o buraco) e a grade dos widgets (o painel).

// O ícone de app do passo: a imagem que a peça traz (`icone`, o caminho na peça), senão a inicial
// do app num quadrado.
const icApp = (p) => (p.icone ? `<img class="ic" src="${p.icone}" alt="">` : `<span class="ic">${inicial(p.app)}</span>`);

// O cabeçalho de seção, em negrito, como o dos Lembretes: o "antes" e o "depois" sobre cada lista.
const secao = ({ texto } = {}) => {
  exige({ texto }, ['texto'], 'ios.secao()');
  return `<div class="${raiz('secao', {})}">${texto}</div>`;
};

// A automação do Atalhos: o gatilho (`quando`) em destaque, de uma a três ações (`fazer`) e a
// chave de executar sem perguntar. Cada passo é { app, titulo, texto, icone? }. Com quatro, ela passa
// da altura do quadro: a sequência longa vai nas ações do Atalhos
const ACOES_DA_AUTOMACAO = [1, 3];
const passoDaAutomacao = (p, onde) => {
  exige(p, ['app', 'titulo'], onde);
  return `${icApp(p)}<div><b>${p.titulo}</b>${p.texto ? `<small>${p.texto}</small>` : ''}</div>`;
};
const automacao = ({ quando, fazer, imediato = true } = {}) => {
  if (!quando) throw new Error('ios.automacao(): falta "quando", o gatilho da automação');
  naFaixa(fazer, ACOES_DA_AUTOMACAO, 'ios.automacao()', 'as ações de "fazer"', ': com mais, a automação passa da altura do quadro, e a sequência longa vai nas ações do Atalhos');
  return `<div class="${raiz('automacao', {})}"><small class="sec">quando</small>` +
    `<div class="quando">${passoDaAutomacao(quando, 'ios.automacao().quando')}</div><small class="sec">fazer</small>` +
    fazer.map((p, i) => `<div class="acao">${passoDaAutomacao(p, `ios.automacao().fazer[${i}]`)}</div>`).join('') +
    `<div class="rodape"><span>executar imediatamente</span><span class="ios-chave${imediato ? ' on' : ''}"></span></div></div>`;
};

// Os eventos cancelados do Calendário: a hora, o título riscado e o motivo no vermelho do sistema.
// É a agenda com o buraco à vista, junto da faixa da semana (ios.dias).
const CANCELADOS = [1, 4];
const cancelados = ({ itens } = {}) => {
  naFaixa(itens, CANCELADOS, 'ios.cancelados()', '"itens"');
  return `<div class="${raiz('cancelados', {})}">` + itens.map((it, i) => {
    exige(it, ['hora', 'titulo', 'motivo'], `ios.cancelados().itens[${i}]`);
    return `<div><span class="h">${it.hora}</span><s>${it.titulo}</s><small>${it.motivo}</small></div>`;
  }).join('') + '</div>';
};

// A grade dos widgets, em duas colunas, como na tela de início; o widget `largo` ocupa a linha.
const WIDGETS = [2, 4];
const widgets = ({ pecas } = {}) => {
  naFaixa(pecas, WIDGETS, 'ios.widgets()', 'os widgets de "pecas"');
  pecas.forEach((p, i) => {
    if (typeof p !== 'string' || !/class="ios ios-widget\b/.test(p)) throw new Error(`ios.widgets(): a peça ${i + 1} não é um ios.widget`);
  });
  return `<div class="ios ios-widgets">${pecas.join('')}</div>`;
};

module.exports = {
  bolha, digitando, audio, conversa, alerta, toast, menuEditar, menu, ajustes, busca, campo, safari,
  ilha, foco, hud, lembretes, notas, evento, dias, mail, alarmes, tocando, facetime, clima, widget, pilha, pasta, arquivo,
  reacoes, resposta, mailNovo, chips, player, tocandoGrande, dica,
  // as peças da linguagem Apple
  secao, automacao, cancelados, widgets,
  emoji,
  // a guarda de faixa
  naFaixa,
};
// a expressão de uma sequência de emoji e o nome do arquivo, que o emoji.mjs também usa: uma cópia só
module.exports.RE_EMOJI = RE_EMOJI;
module.exports.EMOJI_DIR = EMOJI_DIR;
module.exports.EMOJI_WEB = EMOJI_WEB;
module.exports.nomeNoAcervo = nomeNoAcervo;
module.exports.nomesDoArquivo = nomesDoArquivo;
