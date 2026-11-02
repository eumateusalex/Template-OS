// A regra única de derivação da marca: cinzas, bordas, texto sobre o claro e
// sobre o escuro, os papéis de interface, e o contraste WCAG 2 medido aqui.
//
// Toda superfície deriva por este arquivo: o gerador (`gerar.mjs`), o
// guardanapo, o `/novo-projeto` (`gerar-marca.mjs`) e a régua (`conferir.mjs`).
// Duas contas divergem, e a que diverge para o lado otimista aprova texto que
// ninguém lê.
//
// A regra do texto: o texto usa o papel que passa. A principal não é forçada a
// escurecer; quando ela não segura texto sobre o claro, o texto vai para o
// abismo, e quando o acento não passa sobre um fundo, o texto de destaque
// daquele fundo usa a cor de texto dele. A régua reprova só o que nenhum papel
// resolve, e diz a cor mais perto que passa.
//
// Prova: scripts/marca/teste-derivar.mjs

export const MINIMO = 4.5 // texto corrido (WCAG 2 AA)
export const GRANDE = 3 // título, traço e elemento gráfico
export const FOTO = 7 // o destaque sobre foto: o fundo real é a foto sob um véu ralo, não o escuro chapado

export const BRANCO = Object.freeze({ r: 255, g: 255, b: 255, a: 1 })
export const PRETO = Object.freeze({ r: 0, g: 0, b: 0, a: 1 })

/** `#rgb` ou `#rrggbb` em `{ r, g, b, a }`; aceita o objeto de volta. */
export function rgbDe (cor) {
  if (cor && typeof cor === 'object') return { r: cor.r, g: cor.g, b: cor.b, a: cor.a ?? 1 }
  const h = String(cor).trim().replace(/^#/, '')
  const cheio = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  if (!/^[0-9a-f]{6}$/i.test(cheio)) throw new Error(`derivar: "${cor}" não é uma cor hex`)
  return { r: parseInt(cheio.slice(0, 2), 16), g: parseInt(cheio.slice(2, 4), 16), b: parseInt(cheio.slice(4, 6), 16), a: 1 }
}

export const hexDe = (c) => {
  const { r, g, b } = rgbDe(c)
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`
}

export const canaisDe = (c) => {
  const { r, g, b } = rgbDe(c)
  return `${r},${g},${b}`
}

function luminancia (c) {
  const { r, g, b } = rgbDe(c)
  const f = (v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

/** A razão de contraste da WCAG 2, de 1 a 21. */
export function razao (a, b) {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x)
  return (claro + 0.05) / (escuro + 0.05)
}

/** A cor da frente composta sobre o fundo (o fundo é tratado como opaco). */
export function sobre (frente, fundo) {
  const f = rgbDe(frente)
  const b = rgbDe(fundo)
  const m = (x, y) => Math.round(x * f.a + y * (1 - f.a))
  return { r: m(f.r, b.r), g: m(f.g, b.g), b: m(f.b, b.b), a: 1 }
}

/** Anda de `a` para `b` a fração `t` (0 é `a`, 1 é `b`). */
export function rumo (a, b, t) {
  const x = rgbDe(a)
  const y = rgbDe(b)
  return { r: Math.round(x.r + (y.r - x.r) * t), g: Math.round(x.g + (y.g - x.g) * t), b: Math.round(x.b + (y.b - x.b) * t), a: 1 }
}

/** `t` de `a` sobre `b` (a tinta sobre o papel), em hex. */
export const tinta = (a, b, t) => {
  const x = rgbDe(a)
  const y = rgbDe(b)
  return hexDe({ r: x.r * t + y.r * (1 - t), g: x.g * t + y.g * (1 - t), b: x.b * t + y.b * (1 - t) })
}

const eClara = (c) => razao(c, PRETO) >= razao(c, BRANCO)
const texto2 = (n) => String(Math.round(n * 100) / 100).replace('.', ',')
export const melhorTextoSobre = (c) => (razao(c, BRANCO) >= razao(c, PRETO) ? BRANCO : PRETO)

/** Leva `cor` na direção de `alvo`, o mínimo possível, até passar contra todos os fundos. */
export function ajustar (cor, alvo, fundos, minimo = MINIMO) {
  for (let passo = 0; passo <= 50; passo += 1) {
    const c = rumo(cor, alvo, passo / 50)
    if (fundos.every((f) => razao(c, f) >= minimo)) return c
  }
  return null
}

// ─── a interface (site, app, tela de produto) ──────────────────────────────

// A folga das cores DERIVADAS: o conferidor do projeto arredonda em duas casas.
const FOLGA = 4.6
const ERRO_CLARO = { r: 198, g: 40, b: 40, a: 1 }
const ERRO_ESCURO = { r: 239, g: 83, b: 80, a: 1 }
const AVISO_CLARO = { r: 180, g: 83, b: 9, a: 1 }
const AVISO_ESCURO = { r: 251, g: 191, b: 36, a: 1 }

/**
 * O vermelho de erro como os componentes do registry o PINTAM, que é mais que o
 * par do tema: a 100% e a 90% sobre o fundo, e o texto sobre o próprio vermelho
 * tingido (o botão destrutivo).
 */
function ajustarErro (base, alvo, fundos, tintas) {
  const seLe = (c, f) => razao(c, f) >= FOLGA && razao(sobre({ ...c, a: 0.9 }, f), f) >= FOLGA &&
    tintas.every((t) => razao(c, sobre({ ...c, a: t }, f)) >= FOLGA)
  for (let passo = 0; passo <= 50; passo += 1) {
    const c = rumo(base, alvo, passo / 50)
    if (fundos.every((f) => seLe(c, f))) return c
  }
  return null
}

/**
 * Os papéis de interface, no claro e no escuro, a partir de três cores
 * (primária, fundo, texto). Recusa o que foi escolhido e não se lê, com a cor
 * mais perto que passa; o que a conta deriva, ela ajusta sozinha até passar.
 * Devolve `{ ok, cores, erros }`, com as cores em `{ r, g, b, a }`.
 */
export function derivarInterface ({ primaria, fundo, texto }) {
  const erros = []
  primaria = rgbDe(primaria)
  fundo = rgbDe(fundo)
  texto = rgbDe(texto)
  const direcao = eClara(fundo) ? PRETO : BRANCO
  const superficie = rumo(fundo, texto, 0.035)
  const superficie2 = rumo(fundo, texto, 0.07)
  if ([fundo, superficie2].some((f) => razao(texto, f) < MINIMO)) {
    const sugestao = ajustar(texto, direcao, [fundo, superficie2], FOLGA)
    erros.push(`o texto ${hexDe(texto)} dá ${texto2(razao(texto, fundo))}:1 sobre o fundo ${hexDe(fundo)}, e o mínimo é 4,5:1 com folga para as superfícies: a mais perto que passa é ${hexDe(sugestao ?? direcao)}`)
  }
  if (razao(primaria, fundo) < MINIMO) {
    const sugestao = ajustar(primaria, direcao, [fundo], FOLGA)
    erros.push(`a primária ${hexDe(primaria)} dá ${texto2(razao(primaria, fundo))}:1 sobre o fundo ${hexDe(fundo)}, e o link e o botão pedem 4,5:1: a mais perto que passa é ${hexDe(sugestao ?? direcao)}`)
  }
  if (erros.length) return { ok: false, erros }

  const [maisEscura, maisClara] = razao(fundo, PRETO) <= razao(texto, PRETO) ? [fundo, texto] : [texto, fundo]
  const fundoEscuro = razao(maisEscura, PRETO) > 1.3 ? rumo(maisEscura, PRETO, 0.6) : maisEscura
  const claroBase = razao(maisClara, BRANCO) > 1.12 ? rumo(maisClara, BRANCO, 0.7) : maisClara
  const textoEscuro = ajustar(claroBase, BRANCO, [fundoEscuro, sobre({ ...claroBase, a: 0.1 }, fundoEscuro)], FOLGA) ?? BRANCO
  const cartaoEscuro = sobre({ ...textoEscuro, a: 0.06 }, fundoEscuro)
  const claro = eClara(fundo)

  return {
    ok: true,
    erros,
    cores: {
      primaria,
      fundo,
      texto,
      'primaria-texto': melhorTextoSobre(primaria),
      superficie,
      'superficie-2': superficie2,
      borda: rumo(fundo, texto, 0.16),
      apagado: ajustar(rumo(fundo, texto, 0.5), texto, [fundo, superficie], FOLGA) ?? texto,
      erro: ajustarErro(claro ? ERRO_CLARO : ERRO_ESCURO, direcao, [fundo, superficie], claro ? [0.1, 0.2] : [0.2, 0.3]) ?? direcao,
      'fundo-escuro': fundoEscuro,
      'texto-escuro': textoEscuro,
      'apagado-escuro': ajustar(rumo(fundoEscuro, textoEscuro, 0.55), textoEscuro, [fundoEscuro, cartaoEscuro], FOLGA) ?? textoEscuro,
      'primaria-escuro': ajustar(primaria, BRANCO, [fundoEscuro, cartaoEscuro], FOLGA) ?? BRANCO,
      'erro-escuro': ajustarErro(ERRO_ESCURO, BRANCO, [fundoEscuro, cartaoEscuro], [0.2, 0.3]) ?? BRANCO
    }
  }
}

/**
 * O acento da interface (a palavra, o link, o traço), a partir das cores de
 * `derivarInterface`. Sem acento, ele é a primária. Com acento, ele vale como
 * veio quando se lê sobre o fundo e a superfície; senão, o acento mais perto
 * que passa (o mesmo tom, mais escuro ou mais claro), e só quando nem isso
 * existe, a primária: o texto usa o papel que passa. No escuro, o acento anda
 * para o branco até passar, como a primária.
 * Devolve `{ acento, 'acento-texto', 'acento-escuro', 'acento-escuro-texto', avisos }`.
 */
export function derivarAcento (cores, acento) {
  const avisos = []
  const fundo = rgbDe(cores.fundo)
  const fundos = [fundo, rgbDe(cores.superficie)]
  const fundoEscuro = rgbDe(cores['fundo-escuro'])
  const fundosEscuros = [fundoEscuro, sobre({ ...rgbDe(cores['texto-escuro']), a: 0.06 }, fundoEscuro)]
  let claro = rgbDe(cores.primaria)
  let escuro = rgbDe(cores['primaria-escuro'])
  if (acento) {
    const dado = rgbDe(acento)
    const ajustado = fundos.every((f) => razao(dado, f) >= FOLGA) ? dado : ajustar(dado, eClara(fundo) ? PRETO : BRANCO, fundos, FOLGA)
    // a régua é a das cores derivadas: 4,6:1 (a folga sobre os 4,5:1) no fundo e na superfície
    const medidas = () => `dá ${texto2(razao(dado, fundos[0]))}:1 sobre o fundo ${hexDe(fundos[0])} e ${texto2(razao(dado, fundos[1]))}:1 sobre a superfície ${hexDe(fundos[1])}`
    if (ajustado && ajustado !== dado) avisos.push(`o acento ${hexDe(dado)} ${medidas()}, abaixo da folga de ${texto2(FOLGA)}:1: no site, o texto em acento usa ${hexDe(ajustado)}, o mesmo tom ${eClara(fundo) ? 'escurecido' : 'clareado'} até passar (${texto2(razao(ajustado, fundos[0]))}:1 sobre o fundo e ${texto2(razao(ajustado, fundos[1]))}:1 sobre a superfície)`)
    if (!ajustado) avisos.push(`o acento ${hexDe(dado)} ${medidas()}, e nenhum tom dele passa a folga de ${texto2(FOLGA)}:1: no site, o acento usa a primária`)
    if (ajustado) {
      claro = ajustado
      escuro = ajustar(dado, BRANCO, fundosEscuros, FOLGA) ?? escuro
    }
  }
  return { acento: claro, 'acento-texto': melhorTextoSobre(claro), 'acento-escuro': escuro, 'acento-escuro-texto': melhorTextoSobre(escuro), avisos }
}

// ─── a marca inteira ───────────────────────────────────────────────────────

export const PAPEIS = ['principal', 'claro', 'acento', 'apoio', 'lavado', 'raro', 'abismo', 'ok']
/**
 * O texto translúcido do kit do carrossel: `token: [opacidade do desenho, mínimo]`. O texto corrido
 * pede 4,5:1; o rótulo pequeno (o @, a contagem, o título da janela), 3:1.
 */
export const TEXTO_TRANSLUCIDO = Object.freeze({
  'on-dark-90': [0.9, MINIMO],
  'on-dark-82': [0.82, MINIMO],
  'on-dark-74': [0.74, MINIMO],
  'on-dark-60': [0.6, MINIMO],
  'on-dark-55': [0.55, MINIMO],
  'on-dark-50': [0.5, MINIMO],
  'on-dark-40': [0.4, GRANDE],
  'on-light-82': [0.82, MINIMO],
  'on-light-72': [0.72, MINIMO],
  'on-light-66': [0.66, MINIMO],
  'on-light-50': [0.5, GRANDE],
  'on-light-45': [0.45, GRANDE]
})

/** A opacidade do CSS (`.72`), com duas casas. */
export const opacidade = (a) => a.toFixed(2).replace(/^0/, '')

/**
 * A menor opacidade, a partir da do desenho e de centésimo em centésimo, em que `frente` passa
 * `minimo` sobre todos os `fundos`. Devolve `{ alfa, ok }`; `ok` falso é que nem opaca passa.
 */
export function opacidadeQuePassa (frente, fundos, desenho, minimo) {
  const passa = (a) => fundos.every((f) => razao(sobre({ ...rgbDe(frente), a }, f), f) >= minimo)
  let c = Math.round(desenho * 100)
  while (c < 100 && !passa(c / 100)) c++
  return { alfa: c / 100, ok: passa(c / 100) }
}

export const PAPEIS_DE_INTERFACE =['superficie', 'borda', 'texto', 'texto-suave', 'erro', 'aviso', 'sucesso']

/**
 * Tudo o que se deriva dos papéis de cor da marca (hex): o texto e os fundos do
 * carrossel, as tintas do guardanapo, os papéis de interface e os pares
 * medidos. Devolve `{ papeis, carrossel, guardanapo, interface, pares, erros, avisos }`.
 */
export function derivarMarca (cor) {
  const erros = []
  const avisos = []
  const pares = []
  const p = {}
  for (const nome of PAPEIS) {
    if (!cor[nome]) erros.push(`falta o papel de cor "${nome}"`)
    else p[nome] = hexDe(cor[nome])
  }
  if (erros.length) return { papeis: p, erros, avisos, pares }
  const mede = (nome, frente, fundo, minimo) => {
    const r = razao(frente, fundo)
    pares.push({ par: nome, frente: hexDe(frente), fundo: hexDe(fundo), razao: Math.round(r * 100) / 100, minimo, ok: r >= minimo })
    return r >= minimo
  }
  const direcaoDe = (fundo) => (eClara(fundo) ? PRETO : BRANCO)

  // o texto sobre o claro: a principal, ou o abismo quando ela não passa
  let textoClaro = null
  if (mede('principal sobre o claro', p.principal, p.claro, MINIMO)) textoClaro = p.principal
  else if (mede('abismo sobre o claro (texto)', p.abismo, p.claro, MINIMO)) {
    textoClaro = p.abismo
    avisos.push(`a principal ${p.principal} dá ${texto2(razao(p.principal, p.claro))}:1 sobre o claro: o texto sobre o claro usa o abismo ${p.abismo}`)
  } else {
    erros.push(`nem a principal ${p.principal} nem o abismo ${p.abismo} passam 4,5:1 sobre o claro ${p.claro}: a principal mais perto que passa é ${hexDe(ajustar(p.principal, direcaoDe(p.claro), [p.claro]) ?? direcaoDe(p.claro))}`)
  }

  // o fundo escuro (slide escuro, fecho): a principal, ou o abismo quando o claro não se lê nela
  let fundoEscuro = null
  if (mede('claro sobre a principal', p.claro, p.principal, MINIMO)) fundoEscuro = p.principal
  else if (mede('claro sobre o abismo (fundo)', p.claro, p.abismo, MINIMO)) {
    fundoEscuro = p.abismo
    avisos.push(`o claro dá ${texto2(razao(p.claro, p.principal))}:1 sobre a principal: o fundo escuro usa o abismo ${p.abismo}`)
  } else {
    erros.push(`o claro ${p.claro} não passa 4,5:1 nem sobre a principal ${p.principal} nem sobre o abismo ${p.abismo}: o abismo mais perto que passa é ${hexDe(ajustar(p.abismo, PRETO, [p.claro]) ?? PRETO)}`)
  }
  if (!mede('claro sobre o abismo', p.claro, p.abismo, MINIMO) && fundoEscuro !== p.abismo && !erros.length) {
    erros.push(`o claro ${p.claro} dá ${texto2(razao(p.claro, p.abismo))}:1 sobre o abismo ${p.abismo} (o terminal e o fecho fechado): o abismo mais perto que passa é ${hexDe(ajustar(p.abismo, PRETO, [p.claro]) ?? PRETO)}`)
  }

  // o acento como texto: em cada fundo, o acento se passa 3:1, senão a cor de texto daquele fundo
  let acentoClaro = p.acento
  let acentoEscuro = p.acento
  if (textoClaro && fundoEscuro) {
    const noClaro = mede('acento sobre o claro', p.acento, p.claro, GRANDE)
    const noEscuro = mede('acento sobre o fundo escuro', p.acento, fundoEscuro, GRANDE)
    if (!noClaro && !noEscuro) {
      erros.push(`o acento ${p.acento} não passa 3:1 nem sobre o claro (${texto2(razao(p.acento, p.claro))}:1) nem sobre o fundo escuro (${texto2(razao(p.acento, fundoEscuro))}:1): o acento mais perto que passa no claro é ${hexDe(ajustar(p.acento, direcaoDe(p.claro), [p.claro], GRANDE) ?? textoClaro)}`)
    } else {
      if (!noClaro) {
        acentoClaro = textoClaro
        avisos.push(`o acento dá ${texto2(razao(p.acento, p.claro))}:1 sobre o claro: o destaque em texto no slide claro usa a cor de texto ${textoClaro}`)
      } else if (razao(p.acento, p.claro) < MINIMO) avisos.push(`o acento dá ${texto2(razao(p.acento, p.claro))}:1 sobre o claro: passa em título, fica no limite no texto pequeno`)
      if (!noEscuro) {
        acentoEscuro = p.claro
        avisos.push(`o acento dá ${texto2(razao(p.acento, fundoEscuro))}:1 sobre o fundo escuro: o destaque em texto no slide escuro usa o claro ${p.claro}`)
      } else if (razao(p.acento, fundoEscuro) < MINIMO) avisos.push(`o acento dá ${texto2(razao(p.acento, fundoEscuro))}:1 sobre o fundo escuro: passa em título, fica no limite no texto pequeno`)
    }
  }
  if (erros.length) return { papeis: p, erros, avisos, pares }

  // a capa, a foto e a imagem cheia: atrás do texto está a foto, e onde o título começa o véu da
  // capa é ralo (0,14 a 0,55). Numa foto clara o fundo real fica num cinza médio, onde só um tom
  // claro se lê: o acento só fica se passar FOTO sobre o escuro chapado, senão o destaque é o claro
  let acentoFoto = acentoEscuro
  if (acentoEscuro !== p.claro && razao(acentoEscuro, fundoEscuro) < FOTO) {
    acentoFoto = p.claro
    avisos.push(`o acento dá ${texto2(razao(acentoEscuro, fundoEscuro))}:1 sobre o fundo escuro, abaixo dos ${texto2(FOTO)}:1 que a foto pede (o véu é ralo onde o título começa): na capa, na foto e na imagem cheia o destaque em texto usa o claro ${p.claro}`)
  }

  // o texto translúcido do carrossel: o kit pinta o texto de apoio com a cor de texto do fundo em
  // opacidade, e a cor que passa opaca pode cair abaixo do mínimo translúcida. Cada token sobe só até
  // passar sobre todo fundo onde aparece (o claro e o cartão lavado; o fundo escuro e o abismo)
  const alfas = {}
  const subidos = []
  for (const [token, [desenho, minimo]] of Object.entries(TEXTO_TRANSLUCIDO)) {
    const escuro = token.startsWith('on-dark')
    const r = opacidadeQuePassa(escuro ? p.claro : textoClaro, escuro ? [fundoEscuro, p.abismo] : [p.claro, p.lavado], desenho, minimo)
    alfas[token] = r.alfa
    if (!r.ok) avisos.push(`o texto --${token} não passa ${texto2(minimo)}:1 nem opaco sobre ${escuro ? `o fundo escuro ${fundoEscuro} e o abismo ${p.abismo}` : `o claro ${p.claro} e o lavado ${p.lavado}`}`)
    else if (r.alfa > desenho) subidos.push(`${token} ${opacidade(desenho)} → ${opacidade(r.alfa)}`)
  }
  if (subidos.length) avisos.push(`o texto de apoio do carrossel sobe de opacidade para passar o contraste: ${subidos.join(', ')}`)

  const carrossel = { textoClaro, fundoEscuro, textoEscuro: p.claro, acentoClaro, acentoEscuro, acentoFoto, alfas }

  // as tintas do traço desenhado à mão: escuro sobre claro
  const guardanapo = {
    problema: textoClaro,
    solucao: p.apoio,
    contexto: tinta(textoClaro, p.claro, 0.62),
    destaque: acentoClaro,
    fundo: p.claro,
    superficie: p.lavado,
    grupo: tinta(textoClaro, p.lavado, 0.08)
  }

  // a interface: a principal como primária quando ela segura texto, senão o papel que passa
  const primaria = razao(p.principal, p.claro) >= FOLGA ? p.principal : (razao(p.acento, p.claro) >= FOLGA ? p.acento : textoClaro)
  const textoDaInterface = cor.texto ? hexDe(cor.texto) : textoClaro
  const base = derivarInterface({ primaria, fundo: p.claro, texto: textoDaInterface })
  if (!base.ok) return { papeis: p, erros: base.erros, avisos, pares }
  const i = Object.fromEntries(Object.entries(base.cores).map(([k, v]) => [k, hexDe(v)]))
  const claro = eClara(p.claro)
  const sucesso = ajustar(p.ok, direcaoDe(p.claro), [p.claro, i.superficie], FOLGA) ?? textoClaro
  const aviso = ajustar(claro ? AVISO_CLARO : AVISO_ESCURO, direcaoDe(p.claro), [p.claro, i.superficie], FOLGA) ?? textoClaro
  const interfaceDerivada = {
    ...i,
    'texto-suave': i.apagado,
    sucesso: hexDe(sucesso),
    aviso: hexDe(aviso)
  }
  // o papel de interface declarado na marca vence o derivado, e se mede igual
  const declarados = { superficie: 'superficie', borda: 'borda', 'texto-suave': 'texto-suave', erro: 'erro', aviso: 'aviso', sucesso: 'sucesso' }
  for (const [nome, chave] of Object.entries(declarados)) {
    if (!cor[nome]) continue
    interfaceDerivada[chave] = hexDe(cor[nome])
    if (nome === 'texto-suave') interfaceDerivada.apagado = interfaceDerivada[chave]
    if (nome !== 'superficie' && nome !== 'borda') mede(`${nome} sobre o claro`, cor[nome], p.claro, MINIMO)
  }
  if (cor.superficie) mede('texto sobre a superfície', textoDaInterface, cor.superficie, MINIMO)
  for (const r of pares.filter((x) => !x.ok && / sobre o claro$| sobre a superfície$/.test(x.par) && x.par !== 'principal sobre o claro' && !x.par.startsWith('acento'))) {
    erros.push(`o papel declarado (${r.par}) dá ${texto2(r.razao)}:1 e o mínimo é 4,5:1`)
  }

  return { papeis: p, carrossel, guardanapo, interface: interfaceDerivada, pares, erros, avisos }
}
