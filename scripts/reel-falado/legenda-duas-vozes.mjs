// O plano da legenda do Reel falado em duas vozes.
// O montar.mjs chama `planejarLegenda` quando o legenda.json tem `frases` e grava o resultado
// no dados.js; o modelo da página (.claude/skills/cortes/reel/index.html) só executa os itens.
// Pura: não abre navegador nem arquivo.
//
// A gramática, medida em legendas de duas vozes:
//   duas vozes   o apoio pequeno (a fala corrida) e a palavra-chave grande; a chave tem 2,0 a 3,6
//                vezes o apoio, mediana 2,5
//   a chave segura a frase: entra no quadro em que é dita e fica até o fim da frase (mediana
//                ~4 s); o apoio entra palavra por palavra, 1 quadro antes da fala ("antecipe os
//                toques": o texto chega até 2 quadros antes da sílaba, nunca depois)
//   o colchete   o apoio de antes da chave fica em cima, o de depois fica embaixo, encostados
//                (centro a centro ~80 px)
//   as entradas  apoio em 8 quadros (y 18 → 0, desfoque 10 → 0, curva pouso); chave em 8 quadros
//                (desfoque 14 → 0, curva esse), na faixa medida de 7 a 9 quadros
//   a saída      a frase sai inteira em 2 quadros e acaba no quadro em que a próxima entra: no
//                lugar único, as duas frases cruzando se embaralham
//   a posição    encostada abaixo do queixo; sem lugar até a base da zona, vai para a faixa acima
//                da cabeça (a faixa de título, y 350 a 600); um lugar só na peça; nunca entre o
//                cabelo e o queixo
// A frase é texto com no máximo uma [chave]: "você está [pagando] o mei errado".

export const Q = 1 / 30
export const PADRAO = {
  apoio_px: 54, razao: 2.5, razao_min: 2.0, largura: 900, ar: 40, entrelinha: 1.25,
  apoio_max: 5, entrada_q: 8, saida_q: 2, antecipa_q: 1, nitida_q: 4, ocupado: [], ocultas: [],
  // a altura da linha da chave na página: o line-height de .texto no modelo (.claude/skills/cortes/reel/index.html).
  // Contar só o corpo (chavePx) punha o apoio de baixo 16 px dentro da chave (o check acusa)
  linha_chave: 1.12
}

const norma = (w) => String(w).toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}%]/gu, '')

// a largura estimada de uma sem serifa, com a Inter de base (média por letra, em em): 0,53 no peso 400 e 0,58 no 800. A conta
// decide a escala antes da página existir; o render é olhado nos quadros parados (passo 8)
export const medirPadrao = (txt, px, peso = 400) => txt.length * px * (peso >= 700 ? 0.58 : 0.53)

export function lerFrase(texto) {
  // "+ resto da fala": a frase continua a anterior; a chave dela segue na tela (a chave segura a frase)
  const continua = /^\s*\+/.test(texto)
  texto = texto.replace(/^\s*\+\s*/, '')
  const out = []
  let dentro = false
  let chaves = 0
  for (const tok of texto.trim().split(/\s+/)) {
    const abre = tok.startsWith('[')
    // a pontuação depois do colchete fica com a palavra ("[bio]." é a chave "bio."), sem o colchete
    const fecha = /\][.,;:!?…]*$/.test(tok)
    if (abre) { dentro = true; chaves++ }
    out.push({ txt: tok.replace(/^\[/, '').replace(/\](?=[.,;:!?…]*$)/, ''), chave: dentro })
    if (fecha) dentro = false
  }
  return { palavras: out, chaves, continua }
}

// as palavras da transcrição em fila (o formato do scripts/transcrever.py --json)
export function filaDePalavras(transcricao) {
  return (transcricao.segmentos || []).flatMap((s) => s.palavras || []).map((p) => ({ n: norma(p.texto), inicio: p.inicio, fim: p.fim }))
}

export function planejarLegenda(frases, transcricao, { rosto, formato, ...opcoes } = {}) {
  const o = { ...PADRAO, ...opcoes }
  const medir = o.medir || medirPadrao
  if (!rosto || !(rosto.queixo_y > 0) || !(rosto.cabelo_y >= 0)) throw new Error('falta a faixa do rosto (cabelo_y e queixo_y, depois do punch): sem ela a legenda pode cair na boca')
  if (!formato || !(formato.base > 0) || !(formato.topo >= 0)) throw new Error('falta a zona do destino (topo e base, do formatos.json da /video)')
  const fila = filaDePalavras(transcricao)
  let k = 0
  const lidas = frases.map((texto, i) => {
    const { palavras, chaves, continua } = lerFrase(texto)
    if (chaves > 1) throw new Error(`frase ${i + 1}: ${chaves} chaves; uma por frase ("${texto}")`)
    if (continua && chaves) throw new Error(`frase ${i + 1}: a frase com + continua a chave da anterior e não tem chave própria ("${texto}")`)
    if (continua && i === 0) throw new Error('frase 1: a primeira frase não continua nenhuma (tire o +)')
    for (const p of palavras) {
      while (k < fila.length && !fila[k].n) k++
      if (k >= fila.length || fila[k].n !== norma(p.txt)) throw new Error(`frase ${i + 1}: "${p.txt}" não bate com a fala ("${fila[k] ? fila[k].n : 'fim'}"); declare a correção`)
      p.inicio = fila[k].inicio
      p.fim = fila[k].fim
      k++
    }
    return { texto, palavras, continua }
  })
  // a cabeça de cada cadeia: a frase com chave que as frases com + continuam
  const cabeca = []
  lidas.forEach((f, i) => {
    cabeca[i] = f.continua ? cabeca[i - 1] : i
    if (f.continua && !lerFrase(lidas[cabeca[i]].texto).chaves) throw new Error(`frase ${i + 1}: o + continua a chave da frase ${cabeca[i] + 1}, que não tem chave`)
  })
  const temContinuacao = (i) => !!(lidas[i + 1] && lidas[i + 1].continua)

  // primeira passada: a escala de cada chave e a altura de cada bloco
  const hApoio = Math.round(o.apoio_px * o.entrelinha)
  const blocos = lidas.map((f, i) => {
    const ic = f.palavras.findIndex((p) => p.chave)
    const chave = ic < 0 ? [] : f.palavras.filter((p) => p.chave)
    const antes = ic < 0 ? f.palavras : f.palavras.slice(0, ic)
    const depois = ic < 0 ? [] : f.palavras.slice(ic + chave.length)
    if (antes.length > o.apoio_max || depois.length > o.apoio_max) throw new Error(`frase ${i + 1}: apoio de ${Math.max(antes.length, depois.length)} palavras numa linha; até ${o.apoio_max}: parta a frase`)
    // a escala da chave: a razão pedida, encolhida até caber na largura; abaixo do piso não é chave
    let razao = o.razao
    let chavePx = 0
    if (chave.length) {
      const txt = chave.map((p) => p.txt).join(' ')
      const cabe = (r) => medir(txt, o.apoio_px * r, 800) <= o.largura
      while (!cabe(razao) && razao > o.razao_min) razao = Math.round((razao - 0.05) * 100) / 100
      if (!cabe(razao)) throw new Error(`frase ${i + 1}: a chave "${txt}" não cabe em ${o.largura} px nem com ${o.razao_min}x o apoio; troque a chave por uma palavra mais curta`)
      chavePx = Math.round(o.apoio_px * razao)
    }
    const hChave = Math.round(chavePx * o.linha_chave)
    const altura = f.continua ? 0 : (antes.length ? hApoio : 0) + hChave + (depois.length || temContinuacao(i) ? hApoio : 0)
    // a forma de dois andares: todo o apoio numa linha só, em cima da chave
    const alturaCompacta = f.continua ? 0 : (antes.length || depois.length || temContinuacao(i) ? hApoio : 0) + hChave
    return { f, chave, antes, depois, razao, chavePx, hChave, altura, alturaCompacta }
  })

  // o lugar é um só na peça (a legenda que pula entre o peito e a cabeça cansa): abaixo do queixo
  // se o bloco mais alto couber até a base; senão, acima da cabeça; senão, reprova
  // quando os três andares (apoio em cima, chave, apoio embaixo) não cabem em lugar nenhum, a
  // legenda vira dois: o apoio corre numa linha só, em cima da chave (uma peça medida tinha 207 px acima da
  // cabeça, e a cadeia pedia 254)
  const lugar = (m) => {
    if (rosto.queixo_y + o.ar + m <= formato.base) return { onde: 'peito', topo: rosto.queixo_y + o.ar }
    const tp = Math.max(formato.topo, rosto.cabelo_y - o.ar - m)
    return tp + m <= rosto.cabelo_y - o.ar + 1e-9 ? { onde: 'cabeca', topo: tp } : null
  }
  let compacta = false
  let maior = Math.max(...blocos.map((b) => b.altura))
  let achado = lugar(maior)
  if (!achado) {
    const maiorC = Math.max(...blocos.map((b) => b.alturaCompacta))
    achado = lugar(maiorC)
    if (!achado) throw new Error(`o bloco mais alto (${maior} px; ${maiorC} px em dois andares) não cabe abaixo do queixo (${rosto.queixo_y} a ${formato.base}) nem acima da cabeça (${formato.topo} a ${rosto.cabelo_y}); diminua o punch ou parta a frase`)
    compacta = true
    maior = maiorC
  }
  const { onde, topo } = achado

  // o lugar é um só: nunca duas frases nele ao mesmo tempo. A frase sai no quadro em que a próxima
  // entra; mas a chave fica nítida pelo menos `nitida_q` quadros depois de terminar de entrar, e
  // quando isso não cabe (fala rápida), a próxima espera a saída acabar: um atraso pequeno, medido
  // em `atraso_max`, lê melhor que duas frases embaralhadas (o render mostra as duas)
  const itens = []
  let livre = -Infinity, atrasoMax = 0
  let chaveDaCadeia = null, yBaixo = 0
  blocos.forEach(({ f, chave, antes, depois, razao, chavePx, hChave, altura: alturaCheia, alturaCompacta }, i) => {
    const altura = compacta ? alturaCompacta : alturaCheia
    const prox = lidas[i + 1]
    const ultima = f.palavras[f.palavras.length - 1]
    // e o lugar ocupado por outro elemento (a palavra atrás da cabeça, de `ocupado`) também espera
    // a frase que outro elemento esconde (`ocultas`, a que a palavra de trás já diz) não ocupa o lugar
    const oculta = o.ocultas.includes(i + 1)
    const quando = (t) => { if (oculta) return t; let e = Math.max(t, livre); for (const [a, b] of o.ocupado) if (e >= a - 1e-9 && e < b) e = b; atrasoMax = Math.max(atrasoMax, e - t); return e }
    const entraChave = chave.length ? quando(chave[0].inicio) : null
    const semCruzar = prox ? Math.min(prox.palavras[0].inicio - (o.antecipa_q + o.saida_q) * Q, ultima.fim + 0.6) : ultima.fim + 0.8
    // na cadeia, o piso da chave vale no fim da cadeia, não na troca do apoio
    const segue = temContinuacao(i)
    const sai = Math.max(semCruzar, entraChave === null || segue ? 0 : entraChave + (o.entrada_q + o.nitida_q) * Q,
      quando(f.palavras[0].inicio - o.antecipa_q * Q) + o.entrada_q * Q)
    if (f.continua) {
      // a continuação: as palavras trocam na linha de baixo da cabeça, e a chave dela segue na tela
      f.palavras.forEach((p) => itens.push({ frase: i + 1, voz: 'apoio', txt: p.txt, entra: +quando(p.inicio - o.antecipa_q * Q).toFixed(3), sai: +sai.toFixed(3), y: yBaixo, px: o.apoio_px, linha: compacta ? 'cima' : 'baixo', onde, continua: cabeca[i] + 1 }))
      if (!segue) chaveDaCadeia.sai = +Math.max(sai, chaveDaCadeia.entra + (o.entrada_q + o.nitida_q) * Q).toFixed(3)
      if (!oculta) livre = sai + o.saida_q * Q
      return
    }
    // no peito o bloco encosta em cima (perto do queixo); acima da cabeça, embaixo (perto do cabelo)
    let y = onde === 'peito' ? topo : topo + (maior - altura)
    const apoio = (p, linha) => ({ frase: i + 1, voz: 'apoio', txt: p.txt, entra: +quando(p.inicio - o.antecipa_q * Q).toFixed(3), sai: +sai.toFixed(3), y, px: o.apoio_px, linha, onde })
    const y0 = y
    antes.forEach((p) => itens.push(apoio(p, 'cima')))
    // em dois andares, o apoio de depois da chave vai na mesma linha de cima
    if (compacta) { depois.forEach((p) => itens.push(apoio(p, 'cima'))); if (antes.length || depois.length || segue) y += hApoio }
    else if (antes.length) y += hApoio
    if (chave.length) {
      const ch = { frase: i + 1, voz: 'chave', txt: chave.map((p) => p.txt).join(' '), entra: +entraChave.toFixed(3), sai: +sai.toFixed(3), y, px: chavePx, razao, onde }
      itens.push(ch)
      chaveDaCadeia = ch
      y += hChave
      yBaixo = compacta ? y0 : y
    }
    if (!compacta) depois.forEach((p) => itens.push(apoio(p, 'baixo')))
    if (!oculta) livre = sai + o.saida_q * Q
  })
  return {
    itens,
    atraso_max: +atrasoMax.toFixed(3),
    andares: compacta ? 2 : 3,
    usadas: k,
    entrada: { apoio: { quadros: o.entrada_q, y_de: 18, desfoque_de: 10, curva: 'pouso' }, chave: { quadros: o.entrada_q, desfoque_de: 14, curva: 'esse' } },
    saida: { quadros: o.saida_q, curva: 'saida', cruza: false }
  }
}
