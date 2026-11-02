// A leitura única da marca: `lerMarca({ raiz })`.
//
// A marca mora em `identidade/marca.tokens.json` (formato W3C DTCG 2025.10:
// `$value`, `$type`, `$description`, grupos, alias `{grupo.token}`). Toda
// superfície que precisa saber se a marca existe chama esta função, e nenhuma
// outra relê o arquivo nem procura marcador por conta própria.
//
// Marca configurada = o arquivo existe, passa no esquema e não tem
// `"$extensions": { "template.estado": "nao-configurado" }` (a marca do molde).
//
// `MARCA_RAIZ` no ambiente aponta outra raiz (os testes e a prova de ponta a
// ponta usam uma pasta temporária).
//
// Prova: scripts/marca/teste-marca.mjs

import { existsSync, readFileSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const ARQUIVO = 'identidade/marca.tokens.json'
export const MOLDE = 'identidade/marca.molde.tokens.json'
export const MENSAGEM = 'a marca não está configurada: rode /marca'

export const raizPadrao = () => (process.env.MARCA_RAIZ ? resolve(process.env.MARCA_RAIZ) : RAIZ)

/**
 * As recusas que as réguas sabem ler. A marca pode ter outras (vão para o
 * `marca.md` em prosa e para quem revisa a peça), desde que no formato de
 * identificador.
 */
export const RECUSAS_CONHECIDAS = Object.freeze({
  bounce: 'curva que passa do fim e volta (quique)',
  elastic: 'curva elástica, que estica além do destino',
  kicker: 'linha pequena acima do título no vídeo e no motion',
  contador: 'contador "02 / 04" no vídeo e no motion',
  pilula: 'botão, chip e campo em pílula (raio total)',
  'branco-puro': 'branco puro (#ffffff) como fundo',
  'sombra-dura': 'sombra sem desfoque',
  'icone-solido': 'ícone preenchido no lugar de traço',
  gradiente: 'fundo em degradê'
})

// ─── o esquema ─────────────────────────────────────────────────────────────

const PAPEIS = ['principal', 'claro', 'acento', 'apoio', 'lavado', 'raro', 'abismo', 'ok']
const PAPEIS_DE_INTERFACE = ['superficie', 'borda', 'texto', 'texto-suave', 'erro', 'aviso', 'sucesso']

/** [caminho, tipo, obrigatório] */
export const ESQUEMA = [
  ...PAPEIS.map((p) => [`cor.papel.${p}`, 'color', true]),
  ...PAPEIS_DE_INTERFACE.map((p) => [`cor.papel.${p}`, 'color', false]),
  ['fonte.display', 'fontFamily', true],
  ['fonte.destaque', 'fontFamily', true],
  ['fonte.mono', 'fontFamily', true],
  ['fonte.peso.forte', 'fontWeight', true],
  ['fonte.peso.medio', 'fontWeight', true],
  ['fonte.peso.mono', 'fontWeight', true],
  ['raio.sm', 'dimension', true],
  ['raio.md', 'dimension', true],
  ['raio.lg', 'dimension', true],
  ['raio.cartao', 'dimension', true],
  ['raio.pilula', 'booleano', true],
  ['sombra.clara', 'shadow', true],
  ['sombra.escura', 'shadow', true],
  ['movimento.curva.principal', 'cubicBezier', true],
  ['movimento.curva.entrada', 'cubicBezier', true],
  ['movimento.curva.saida', 'cubicBezier', true],
  ['movimento.duracao.rapida', 'duration', true],
  ['movimento.duracao.media', 'duration', true],
  ['movimento.duracao.lenta', 'duration', true],
  ['movimento.cascata', 'duration', true],
  ['imagem.estilo', 'texto', true],
  ['imagem.evitar', 'lista', true],
  ['som.voz', 'texto', true],
  ['som.assinatura', 'texto', true],
  ['som.trilha', 'texto', true],
  ['recusas', 'lista', true]
]

const ehToken = (no) => no && typeof no === 'object' && !Array.isArray(no) && '$value' in no
const ALIAS = /^\{([^{}]+)\}$/

/** Acha o nó por caminho com ponto. */
function no (tokens, caminho) {
  let atual = tokens
  for (const parte of caminho.split('.')) {
    if (!atual || typeof atual !== 'object' || !(parte in atual)) return undefined
    atual = atual[parte]
  }
  return atual
}

/** O `$type` que vale para o token: o dele ou o do grupo mais perto. */
function tipoDe (tokens, caminho) {
  const partes = caminho.split('.')
  for (let i = partes.length; i >= 0; i -= 1) {
    const n = i === 0 ? tokens : no(tokens, partes.slice(0, i).join('.'))
    if (n && typeof n === 'object' && typeof n.$type === 'string') return n.$type
  }
  return null
}

/** O valor cru do token, com o alias resolvido (e o alias dentro de objeto composto). */
function valorResolvido (tokens, caminho, erros, visitados = []) {
  if (visitados.includes(caminho)) { erros.push(`alias em ciclo: ${[...visitados, caminho].join(' → ')}`); return undefined }
  const n = no(tokens, caminho)
  if (!ehToken(n)) { erros.push(`${visitados.length ? `o alias de ${visitados.at(-1)} aponta` : 'falta o token'} ${caminho}${visitados.length ? ', que não existe' : ''}`); return undefined }
  const resolve = (v) => {
    if (typeof v === 'string') {
      const m = ALIAS.exec(v.trim())
      if (m) return valorResolvido(tokens, m[1], erros, [...visitados, caminho])
      return v
    }
    if (Array.isArray(v)) return v.map(resolve)
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, resolve(x)]))
    return v
  }
  return resolve(n.$value)
}

/** O tipo de um alias é o do token final. */
function tipoFinal (tokens, caminho, visitados = []) {
  const n = no(tokens, caminho)
  if (!ehToken(n) || visitados.includes(caminho)) return null
  const proprio = tipoDe(tokens, caminho)
  if (proprio) return proprio
  const m = typeof n.$value === 'string' && ALIAS.exec(n.$value.trim())
  return m ? tipoFinal(tokens, m[1], [...visitados, caminho]) : null
}

// ─── os tipos ──────────────────────────────────────────────────────────────

const num = (v) => typeof v === 'number' && Number.isFinite(v)

function lerCor (v, onde, erros) {
  if (typeof v === 'string') {
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v.trim())) {
      const h = v.trim().slice(1)
      return { hex: '#' + (h.length === 3 ? h.split('').map((c) => c + c).join('') : h).toLowerCase(), alfa: 1 }
    }
    erros.push(`${onde}: "${v}" não é cor (use o objeto { "colorSpace": "srgb", "components": [...], "hex": "#..." } ou um hex)`)
    return null
  }
  if (!v || typeof v !== 'object' || v.colorSpace !== 'srgb') { erros.push(`${onde}: a cor precisa de "colorSpace": "srgb"`); return null }
  const alfa = v.alpha === undefined ? 1 : v.alpha
  if (!num(alfa) || alfa < 0 || alfa > 1) { erros.push(`${onde}: "alpha" vai de 0 a 1`); return null }
  const comps = v.components
  const temComps = Array.isArray(comps) && comps.length === 3 && comps.every((c) => num(c) && c >= 0 && c <= 1)
  if (comps !== undefined && !temComps) { erros.push(`${onde}: "components" são três números de 0 a 1`); return null }
  let hex = null
  if (v.hex !== undefined) {
    if (!/^#[0-9a-f]{6}$/i.test(v.hex)) { erros.push(`${onde}: "hex" tem que ser #rrggbb`); return null }
    hex = v.hex.toLowerCase()
  }
  if (temComps) {
    const deComps = '#' + comps.map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join('')
    if (hex && hex !== deComps) { erros.push(`${onde}: "components" (${deComps}) e "hex" (${hex}) dizem cores diferentes`); return null }
    hex = hex ?? deComps
  }
  if (!hex) { erros.push(`${onde}: a cor precisa de "components" ou "hex"`); return null }
  return { hex, alfa }
}

function lerDimensao (v, onde, erros) {
  if (!v || typeof v !== 'object' || !num(v.value) || !['px', 'rem'].includes(v.unit)) { erros.push(`${onde}: dimensão é { "value": n, "unit": "px" | "rem" }`); return null }
  if (v.value < 0) { erros.push(`${onde}: dimensão negativa`); return null }
  return v.unit === 'rem' ? v.value * 16 : v.value
}

function lerDuracao (v, onde, erros) {
  if (!v || typeof v !== 'object' || !num(v.value) || !['ms', 's'].includes(v.unit) || v.value < 0) { erros.push(`${onde}: duração é { "value": n, "unit": "ms" | "s" }`); return null }
  return v.unit === 's' ? v.value * 1000 : v.value
}

function lerValor (tipo, v, onde, erros) {
  switch (tipo) {
    case 'color': { const c = lerCor(v, onde, erros); return c && c.hex }
    case 'dimension': return lerDimensao(v, onde, erros)
    case 'duration': return lerDuracao(v, onde, erros)
    case 'number': if (!num(v)) erros.push(`${onde}: número`); return num(v) ? v : null
    case 'fontWeight':
      if (!num(v) || v < 1 || v > 1000) { erros.push(`${onde}: peso é um número de 1 a 1000`); return null }
      return v
    case 'fontFamily': {
      const lista = typeof v === 'string' ? [v] : v
      if (!Array.isArray(lista) || !lista.length || !lista.every((s) => typeof s === 'string' && s.trim() && !/[;{}<>"]/.test(s))) {
        erros.push(`${onde}: família é um nome ou uma lista de nomes (sem ; { } < > ")`)
        return null
      }
      return lista.map((s) => s.trim())
    }
    case 'cubicBezier':
      if (!Array.isArray(v) || v.length !== 4 || !v.every(num) || v[0] < 0 || v[0] > 1 || v[2] < 0 || v[2] > 1) {
        erros.push(`${onde}: curva é [x1, y1, x2, y2], com x1 e x2 entre 0 e 1`)
        return null
      }
      return [...v]
    case 'shadow': {
      const camadas = Array.isArray(v) ? v : [v]
      const lidas = camadas.map((s, i) => {
        const aqui = camadas.length > 1 ? `${onde}[${i}]` : onde
        if (!s || typeof s !== 'object') { erros.push(`${aqui}: sombra é { color, offsetX, offsetY, blur, spread }`); return null }
        const cor = lerCor(s.color, `${aqui}.color`, erros)
        const [x, y, blur, spread] = ['offsetX', 'offsetY', 'blur', 'spread'].map((k) => {
          const d = s[k]
          if (d && typeof d === 'object' && num(d.value) && ['px', 'rem'].includes(d.unit)) return d.unit === 'rem' ? d.value * 16 : d.value
          erros.push(`${aqui}.${k}: dimensão`)
          return null
        })
        if (!cor || [x, y, blur, spread].includes(null)) return null
        return { cor: cor.hex, alfa: cor.alfa, x, y, blur, spread, inset: s.inset === true }
      })
      return lidas.includes(null) ? null : lidas
    }
    case 'texto': if (typeof v !== 'string') { erros.push(`${onde}: texto`); return null } return v
    case 'lista':
      if (!Array.isArray(v) || !v.every((s) => typeof s === 'string')) { erros.push(`${onde}: lista de textos`); return null }
      return [...v]
    case 'booleano': if (typeof v !== 'boolean') { erros.push(`${onde}: true ou false`); return null } return v
    default:
      erros.push(`${onde}: tipo "${tipo}" desconhecido`)
      return null
  }
}

/** Põe `valor` em `obj` no caminho com ponto. */
function por (obj, caminho, valor) {
  const partes = caminho.split('.')
  let atual = obj
  for (const p of partes.slice(0, -1)) atual = atual[p] ??= {}
  atual[partes.at(-1)] = valor
}

/** Todo token do arquivo, com o caminho (para validar as primitivas e o espaço). */
function todos (n, prefixo = '', acc = []) {
  for (const [k, v] of Object.entries(n)) {
    if (k.startsWith('$')) continue
    const c = prefixo ? `${prefixo}.${k}` : k
    if (ehToken(v)) acc.push(c)
    else if (v && typeof v === 'object') todos(v, c, acc)
  }
  return acc
}

/**
 * Valida os tokens contra o esquema e devolve `{ erros, resolvido }`. O
 * `resolvido` tem os valores prontos: cor em hex, dimensão em px, duração em
 * ms, família em lista, e a fonte com a origem (`url`, `arquivo`, `estilo`).
 */
export function validar (tokens) {
  const erros = []
  const resolvido = {}
  if (!tokens || typeof tokens !== 'object' || Array.isArray(tokens)) return { erros: ['o arquivo não é um objeto JSON'], resolvido: null }
  const caminhosDoEsquema = new Set(ESQUEMA.map(([c]) => c))
  for (const [caminho, tipo, obrigatorio] of ESQUEMA) {
    const n = no(tokens, caminho)
    if (n === undefined) { if (obrigatorio) erros.push(`falta o token ${caminho}`); continue }
    if (!ehToken(n)) { erros.push(`${caminho} não é token (falta "$value")`); continue }
    const declarado = tipoFinal(tokens, caminho)
    if (declarado && declarado !== tipo) { erros.push(`${caminho} tem "$type": "${declarado}", e o esquema pede "${tipo}"`); continue }
    const cru = valorResolvido(tokens, caminho, erros)
    if (cru === undefined) continue
    const v = lerValor(tipo, cru, caminho, erros)
    if (v === null) continue
    por(resolvido, caminho, v)
  }
  // as famílias levam a origem: Google Fonts (url) ou arquivo em identidade/fontes/
  for (const papel of ['display', 'destaque', 'mono']) {
    const n = no(tokens, `fonte.${papel}`)
    const familia = resolvido.fonte?.[papel]
    if (!ehToken(n) || !familia) continue
    const ext = n.$extensions ?? {}
    const url = ext['marca.url'] ?? null
    const arquivo = ext['marca.arquivo'] ?? null
    const estilo = ext['marca.estilo'] ?? 'normal'
    if (url !== null && !/^https:\/\/fonts\.googleapis\.com\/css2\?[^\s"'()]+$/.test(url)) erros.push(`fonte.${papel}: "marca.url" tem que ser um endereço https://fonts.googleapis.com/css2?...`)
    if (arquivo !== null && !/^fontes\/[\w.-]+\.(woff2|woff|ttf|otf)$/i.test(arquivo)) erros.push(`fonte.${papel}: "marca.arquivo" é fontes/<nome>.woff2 (ou .ttf, .otf), dentro de identidade/`)
    if (!['normal', 'italic'].includes(estilo)) erros.push(`fonte.${papel}: "marca.estilo" é normal ou italic`)
    resolvido.fonte[papel] = { familia, url, arquivo, estilo }
  }
  // as primitivas e a escala de espaço: livres, mas cada uma no tipo
  for (const c of todos(tokens)) {
    if (caminhosDoEsquema.has(c)) continue
    const raiz = c.split('.')[0]
    if (!['cor', 'espaco'].includes(raiz)) { erros.push(`${c}: token fora do esquema (os grupos são cor, fonte, raio, espaco, sombra, movimento, imagem, som, recusas)`); continue }
    const tipo = tipoFinal(tokens, c)
    const esperado = raiz === 'cor' ? 'color' : 'dimension'
    if (tipo !== esperado) { erros.push(`${c} tem "$type": "${tipo}", e o grupo ${raiz} pede "${esperado}"`); continue }
    const cru = valorResolvido(tokens, c, erros)
    if (cru === undefined) continue
    const v = lerValor(esperado, cru, c, erros)
    if (v !== null) por(resolvido, c, v)
  }
  if (!resolvido.espaco || !Object.keys(resolvido.espaco).length) erros.push('falta a escala de espaço (espaco.1, espaco.2, ...)')
  for (const id of resolvido.recusas ?? []) if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) erros.push(`recusas: "${id}" não é identificador (minúsculas, número e hífen)`)
  if (resolvido.imagem && !resolvido.imagem.estilo?.trim()) erros.push('imagem.estilo está vazio: é a frase que abre o prompt de imagem')
  if (resolvido.raio?.pilula === true && (resolvido.recusas ?? []).includes('pilula')) erros.push('raio.pilula é true e "pilula" está nas recusas: escolha um dos dois')
  return { erros, resolvido: erros.length ? null : resolvido }
}

/** Lê e valida um arquivo de tokens; `{ tokens, erros, resolvido, molde }`. */
function lerArquivo (caminho) {
  let tokens
  try { tokens = JSON.parse(readFileSync(caminho, 'utf8')) } catch (e) { return { tokens: null, erros: [`não é JSON válido (${e.message})`], resolvido: null, molde: false } }
  const { erros, resolvido } = validar(tokens)
  const molde = tokens?.$extensions?.['template.estado'] === 'nao-configurado'
  return { tokens, erros, resolvido, molde }
}

/**
 * O estado da marca: `{ configurada, motivo, tokens, resolvido }`. Sem marca
 * configurada, `tokens` e `resolvido` vêm `null` e o `motivo` diz por quê.
 */
export function lerMarca ({ raiz = raizPadrao(), arquivo } = {}) {
  const caminho = arquivo ? resolve(arquivo) : join(raiz, ARQUIVO)
  const rel = arquivo ? caminho : ARQUIVO
  if (!existsSync(caminho)) return { configurada: false, motivo: `falta ${rel}`, tokens: null, resolvido: null }
  const l = lerArquivo(caminho)
  if (l.erros.length) return { configurada: false, motivo: `${rel} tem esquema quebrado: ${l.erros.join('; ')}`, tokens: null, resolvido: null, erros: l.erros }
  if (l.molde) return { configurada: false, motivo: `${rel} ainda é o molde (template.estado: nao-configurado)`, tokens: null, resolvido: null }
  return { configurada: true, motivo: '', tokens: l.tokens, resolvido: l.resolvido }
}

/** O molde (valores de demonstração), validado: o que as saídas usam antes da marca. */
export function lerMolde ({ raiz = raizPadrao() } = {}) {
  let caminho = join(raiz, MOLDE)
  if (!existsSync(caminho)) caminho = join(RAIZ, MOLDE)
  const l = lerArquivo(caminho)
  if (l.erros.length) throw new Error(`o molde ${MOLDE} tem esquema quebrado: ${l.erros.join('; ')}`)
  return { configurada: false, motivo: 'molde', tokens: l.tokens, resolvido: l.resolvido }
}

/** A frase única da parada, com o motivo. */
export const paradaDe = (motivo) => `${MENSAGEM} (${motivo})`

/** O `resolvido` da marca, ou o erro com a frase única. */
export function exigirMarca (opcoes) {
  const m = lerMarca(opcoes)
  if (!m.configurada) throw new Error(paradaDe(m.motivo))
  return m.resolvido
}
