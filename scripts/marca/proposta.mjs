#!/usr/bin/env node
// A proposta da marca: `node scripts/marca/proposta.mjs --arquivo <rascunho.tokens.json> [--raiz <pasta>] [--html <saida.html>]`.
//
// Antes de gravar a marca, mostra onde cada cor cai (o texto, os fundos, o
// destaque, o botão do site), com a medida de cada lugar. A cor escolhida que
// não segura texto não some calada: a regra única (derivar.mjs) põe outro papel
// no lugar dela, e a proposta diz qual, e põe ao lado o tom mais perto que
// passa, para a pessoa escolher entre a sua e esse. Com a marca de hoje
// configurada, compara: o que clareou, o que escureceu, e por que um lugar
// mudou de papel ("a principal escureceu e o texto clareou: antes o abismo,
// agora a principal").
//
// Grava a mesma proposta num HTML, com as cores lado a lado, e diz onde. Sai 1
// quando a marca não fecha (o erro traz o hex mais perto que passa), senão 0.
//
// Prova: scripts/marca/teste-proposta.mjs

import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { validar, lerMarca, raizPadrao } from './marca.mjs'
import { derivarMarca, derivarAcento, rumo, razao, hexDe, BRANCO, PRETO, MINIMO, GRANDE, PAPEIS } from './derivar.mjs'

// A folga do site: o conferidor do projeto arredonda em duas casas (derivar.mjs).
const FOLGA = 4.6
const ARTIGO = { principal: 'a principal', claro: 'o claro', acento: 'o acento', apoio: 'o apoio', lavado: 'o lavado', raro: 'o raro', abismo: 'o abismo', ok: 'o ok', ajustado: 'o acento ajustado até passar' }
const medida = (r) => `${r.toFixed(2).replace('.', ',')}:1`
const eClara = (c) => razao(c, PRETO) >= razao(c, BRANCO)
// A luminância relativa sobe com a razão contra o preto: serve para dizer qual é mais clara.
const direcao = (antes, depois) => {
  const a = razao(antes, PRETO)
  const d = razao(depois, PRETO)
  return d < a ? 'mais escura' : d > a ? 'mais clara' : 'outro tom'
}

/** O papel de onde veio uma cor: o primeiro papel com o mesmo hex, ou `ajustado`. */
function papelDe (cor, p, ordem = ['principal', 'acento', 'abismo', 'claro', ...PAPEIS]) {
  return ordem.find((nome) => p[nome] === cor) ?? 'ajustado'
}

/** Os lugares onde cada cor cai, com o papel que os ocupa e a medida contra o fundo de cada um. */
function lugaresDe (d) {
  const p = d.papeis
  const c = d.carrossel
  const acentoDoSite = hexDe(derivarAcento(d.interface, p.acento).acento)
  const lugar = (id, nome, cor, fundo, frente = cor) => ({ id, nome, cor, papel: papelDe(cor, p), fundo, razao: Math.round(razao(frente, fundo) * 100) / 100 })
  return [
    lugar('fundo-claro', 'o fundo claro', p.claro, p.claro, c.textoClaro),
    lugar('texto-no-claro', 'o texto sobre o claro', c.textoClaro, p.claro),
    lugar('fundo-escuro', 'o fundo escuro (slide escuro e fecho)', c.fundoEscuro, c.fundoEscuro, p.claro),
    lugar('destaque-no-claro', 'o destaque no slide claro', c.acentoClaro, p.claro),
    lugar('destaque-no-escuro', 'o destaque no slide escuro', c.acentoEscuro, c.fundoEscuro),
    lugar('destaque-na-foto', 'o destaque sobre foto', c.acentoFoto, c.fundoEscuro),
    lugar('botao-do-site', 'o botão e o link do site', d.interface.primaria, p.claro),
    lugar('acento-do-site', 'o acento do site', acentoDoSite, p.claro)
  ]
}

/**
 * O tom de `nome` mais perto do escolhido que passa `minimo` sobre o claro E
 * que a regra inteira aceita devolvido à marca: só contra o claro, o tom
 * proposto podia reprovar na superfície do site, que se tinge do próprio texto.
 */
function maisPertoQuePassa (cor, nome, alvo, minimo) {
  for (let passo = 1; passo <= 50; passo += 1) {
    const tom = hexDe(rumo(cor[nome], alvo, passo / 50))
    if (razao(tom, cor.claro) >= minimo && !derivarMarca({ ...cor, [nome]: tom }).erros.length) return tom
  }
  return null
}

/** O tom mais perto que passa, para a principal e o acento que o claro não segura. */
function propostasDe (p, cor) {
  const alvo = eClara(p.claro) ? PRETO : BRANCO
  const propostas = []
  const rp = razao(p.principal, p.claro)
  if (rp < FOLGA) {
    const tom = maisPertoQuePassa(cor, 'principal', alvo, FOLGA)
    if (tom) {
      propostas.push({
        papel: 'principal',
        escolhida: p.principal,
        tom,
        razaoEscolhida: rp,
        razaoTom: razao(tom, p.claro),
        motivo: rp < MINIMO
          ? `a principal ${p.principal} não entra em peça nenhuma: dá ${medida(rp)} sobre o claro ${p.claro}, e o texto, o fundo escuro e o botão do site usam outro papel`
          : `a principal ${p.principal} dá ${medida(rp)} sobre o claro: passa no carrossel, mas fica abaixo da folga de ${medida(FOLGA)} do site, e o botão usa outro papel`
      })
    }
  }
  const ra = razao(p.acento, p.claro)
  if (ra < GRANDE) {
    const tom = maisPertoQuePassa(cor, 'acento', alvo, GRANDE)
    if (tom) {
      propostas.push({
        papel: 'acento',
        escolhida: p.acento,
        tom,
        razaoEscolhida: ra,
        razaoTom: razao(tom, p.claro),
        motivo: `o acento ${p.acento} dá ${medida(ra)} sobre o claro ${p.claro}, abaixo de ${medida(GRANDE)}: o destaque no slide claro usa a cor do texto`
      })
    }
  }
  return propostas
}

/** O que mudou da marca de hoje para a nova: os papéis e os lugares, com a direção. */
function comparacaoDe (antes, depois) {
  const mudou = []
  for (const nome of PAPEIS) {
    const a = antes.papeis[nome]
    const d = depois.papeis[nome]
    if (a !== d) mudou.push({ id: nome, nome, antes: a, depois: d, direcao: direcao(a, d) })
  }
  const lugaresAntes = new Map(lugaresDe(antes).map((l) => [l.id, l]))
  for (const l of lugaresDe(depois)) {
    const a = lugaresAntes.get(l.id)
    if (!a || a.cor === l.cor) continue
    mudou.push({ id: l.id, nome: l.nome, antes: a.cor, depois: l.cor, direcao: direcao(a.cor, l.cor), papelAntes: a.papel, papelDepois: l.papel })
  }
  return mudou
}

/** Os tokens que ainda dizem "Demonstração": o valor do molde, que a pessoa não respondeu. */
function demonstracoes (no, caminho = [], achados = []) {
  for (const [k, v] of Object.entries(no)) {
    if (k === '$description' && /Demonstração:/.test(v)) achados.push(caminho.join('.'))
    else if (v && typeof v === 'object' && !Array.isArray(v)) demonstracoes(v, [...caminho, k], achados)
  }
  return achados
}

/**
 * A proposta de uma marca (`tokens`, o rascunho), comparada com a de hoje
 * (`atual`, opcional). Devolve `{ lugares, propostas, comparacao, erros, avisos }`;
 * com erro, os lugares vêm vazios.
 */
export function proposta ({ tokens, atual = null }) {
  const vazio = { lugares: [], propostas: [], comparacao: [], avisos: [] }
  const v = validar(tokens)
  if (v.erros.length) return { ...vazio, erros: v.erros }
  const d = derivarMarca(v.resolvido.cor.papel)
  if (d.erros.length) return { ...vazio, avisos: d.avisos, erros: d.erros }
  const avisos = [...d.avisos]
  const molde = demonstracoes(tokens)
  if (molde.length) avisos.push(`ainda dizem "Demonstração" (o valor do molde, que a pessoa não respondeu): ${molde.join(', ')}`)
  let comparacao = []
  if (atual) {
    const va = validar(atual)
    const da = va.erros.length ? null : derivarMarca(va.resolvido.cor.papel)
    if (da && !da.erros.length) comparacao = comparacaoDe(da, d)
    else avisos.push('a marca de hoje não fecha: a proposta não se compara com ela')
  }
  const lugares = lugaresDe(d)
  // o abismo só entra quando a principal não segura texto (e no terminal do carrossel): trocado fora disso, não aparece
  if (comparacao.some((c) => c.id === 'abismo') && !lugares.some((l) => l.papel === 'abismo')) {
    avisos.push(`o abismo mudou, mas nenhum dos lugares acima o usa: o texto e o fundo escuro são a principal, que segura texto; o abismo só entra neles quando ela não segura, e no terminal do carrossel. Fundo escuro de outra cor pede outra principal`)
  }
  return { lugares, propostas: propostasDe(d.papeis, v.resolvido.cor.papel), comparacao, erros: [], avisos }
}

/** A proposta em texto, para o terminal. */
export function textoDa (p) {
  const linhas = []
  if (p.erros.length) {
    linhas.push('A marca não fecha:')
    for (const e of p.erros) linhas.push(`  ✗ ${e}`)
  }
  if (p.lugares.length) {
    linhas.push('Onde cada cor cai:')
    for (const l of p.lugares) linhas.push(`  ${l.nome}: ${l.cor} (${ARTIGO[l.papel]}), ${medida(l.razao)}`)
  }
  if (p.propostas.length) {
    linhas.push('A escolher (a sua ou a mais perto que passa):')
    for (const x of p.propostas) linhas.push(`  ${x.motivo}. A mais perto que passa é ${x.tom} (${medida(x.razaoTom)}).`)
  }
  if (p.comparacao.length) {
    linhas.push('Comparada com a marca de hoje:')
    for (const c of p.comparacao) {
      const papel = c.papelAntes && c.papelAntes !== c.papelDepois ? ` (antes ${ARTIGO[c.papelAntes]}, agora ${ARTIGO[c.papelDepois]})` : ''
      linhas.push(`  ${c.nome}: ${c.antes} → ${c.depois}, ${c.direcao}${papel}`)
    }
  }
  for (const a of p.avisos) linhas.push(`AVISO ${a}`)
  return linhas.join('\n')
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const amostra = (cor, rotulo) => `<figure><span style="background:${esc(cor)}"></span><figcaption>${esc(rotulo)}<br><code>${esc(cor)}</code></figcaption></figure>`

/** A proposta numa página, com as cores lado a lado. */
export function htmlDa (p) {
  const secoes = []
  if (p.erros.length) secoes.push(`<h2>A marca não fecha</h2><ul>${p.erros.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>`)
  if (p.propostas.length) {
    secoes.push(`<h2>A escolher</h2>${p.propostas.map((x) => `<section><p>${esc(x.motivo)}.</p><div class="par">${amostra(x.escolhida, `a sua (${medida(x.razaoEscolhida)})`)}${amostra(x.tom, `a mais perto que passa (${medida(x.razaoTom)})`)}</div></section>`).join('')}`)
  }
  if (p.lugares.length) {
    secoes.push(`<h2>Onde cada cor cai</h2><table>${p.lugares.map((l) => `<tr><td><span class="ponto" style="background:${esc(l.cor)}"></span></td><td>${esc(l.nome)}</td><td><code>${esc(l.cor)}</code></td><td>${esc(ARTIGO[l.papel])}</td><td>${esc(medida(l.razao))}</td></tr>`).join('')}</table>`)
  }
  if (p.comparacao.length) {
    secoes.push(`<h2>Comparada com a marca de hoje</h2><table>${p.comparacao.map((c) => `<tr><td>${esc(c.nome)}</td><td><span class="ponto" style="background:${esc(c.antes)}"></span> <code>${esc(c.antes)}</code></td><td>→</td><td><span class="ponto" style="background:${esc(c.depois)}"></span> <code>${esc(c.depois)}</code></td><td>${esc(c.direcao)}${c.papelAntes && c.papelAntes !== c.papelDepois ? esc(` (antes ${ARTIGO[c.papelAntes]}, agora ${ARTIGO[c.papelDepois]})`) : ''}</td></tr>`).join('')}</table>`)
  }
  if (p.avisos.length) secoes.push(`<h2>Avisos</h2><ul>${p.avisos.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>`)
  // o chrome da página é neutro: a página mostra as cores da marca, não as veste
  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>A proposta da marca</title>
<style>
body{font:16px/1.5 system-ui,sans-serif;max-width:860px;margin:2rem auto;padding:0 1rem;color:CanvasText;background:Canvas}
table{border-collapse:collapse;width:100%}td{padding:.4rem .6rem;border-bottom:1px solid GrayText}
.ponto{display:inline-block;width:1.2rem;height:1.2rem;border-radius:.25rem;vertical-align:middle;outline:1px solid GrayText}
.par{display:flex;gap:1.5rem}figure{margin:0}figure span{display:block;width:10rem;height:6rem;border-radius:.5rem;outline:1px solid GrayText}
</style></head><body><h1>A proposta da marca</h1>
${secoes.join('\n')}
</body></html>
`
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const arg = (nome) => { const i = process.argv.indexOf(nome); return i > -1 ? process.argv[i + 1] : undefined }
  const arquivo = arg('--arquivo')
  if (!arquivo || process.argv.includes('--help')) {
    console.log('uso: node scripts/marca/proposta.mjs --arquivo <rascunho.tokens.json> [--raiz <pasta>] [--html <saida.html>]')
    process.exit(process.argv.includes('--help') ? 0 : 2)
  }
  const raiz = arg('--raiz') ? resolve(arg('--raiz')) : raizPadrao()
  const html = resolve(arg('--html') ?? join(tmpdir(), 'marca-proposta.html'))
  let tokens
  try { tokens = JSON.parse(readFileSync(resolve(arquivo), 'utf8')) } catch (e) {
    console.log(`✗ o rascunho ${arquivo} não é JSON válido (${e.message})`)
    process.exit(1)
  }
  const hoje = lerMarca({ raiz })
  const p = proposta({ tokens, atual: hoje.configurada ? hoje.tokens : null })
  console.log(textoDa(p))
  writeFileSync(html, htmlDa(p))
  console.log(`\nLado a lado: ${pathToFileURL(html).href}`)
  process.exit(p.erros.length ? 1 : 0)
}
