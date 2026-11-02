// A cor da câmera do Reel falado: a correção da gravação (a `cor.correcao` da peca.json) e a gradação
// viram o data-color-grading do <video id="camera">, que o HyperFrames aplica no render
// (`.claude/skills/video/cor.md`). A ordem é a da cor.md: primeiro a correção (`adjust`, a família
// correction do motor), depois o look (`wheels`). O look entra só pedido: `"gradacao": true` traz o da
// linguagem (o `gradacao` dela no linguagens.json da /video), um objeto traz o da peça, e `false` diz
// que não há look; sem o campo, a montagem avisa, porque o look é escolha do usuário vendo antes e depois,
// a não ser que o usuário já o tenha aprovado (`gradacao_aprovada` da linguagem): aí entra na peça nova sozinho.
// O look pode ter `adjust` (a temperatura do look), que soma com a correção medida.
//
//   "cor": { "correcao": { "exposure": 0.1, "temperature": -0.05 }, "gradacao": true }
//
// As chaves e as faixas são as do `media-treatment --capability correction` e `--capability wheels`
// do HyperFrames 0.8.207; a correção de cada gravação se mede pelo `media-treatment --analyze`.
// A linguagem é a do plano.json (no falado com motion), a `linguagem` da peca.json, ou a do modo
// gravação, `falado-com-motion`.
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = resolve(fileURLToPath(new URL('.', import.meta.url)), '..', '..')
const LINGUAGENS = join(RAIZ, '.claude', 'skills', 'video', 'ferramentas', 'linguagens.json')
export const LINGUAGEM_PADRAO = 'falado-com-motion'
export const CORRECAO = { exposure: [-2, 2], contrast: [-1, 1], highlights: [-1, 1], shadows: [-1, 1], whites: [-1, 1], blacks: [-1, 1], temperature: [-1, 1], tint: [-1, 1], vibrance: [-1, 1], saturation: [-1, 1] }
const ZONAS = ['shadows', 'midtones', 'highlights']
const RODA = { hue: [0, 360], amount: [0, 1], level: [-1, 1] }

const dentro = (v, [lo, hi]) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi

function conferirCorrecao(c, erros, onde = 'a cor.correcao da peca.json') {
  for (const [k, v] of Object.entries(c)) {
    if (!CORRECAO[k]) erros.push(`${onde} tem "${k}", fora da família correction do motor (${Object.keys(CORRECAO).join(', ')})`)
    else if (!dentro(v, CORRECAO[k])) erros.push(`o ${k} de ${onde} é ${JSON.stringify(v)}; a faixa é ${CORRECAO[k][0]} a ${CORRECAO[k][1]}`)
  }
}

function conferirGradacao(g, onde, erros) {
  for (const k of Object.keys(g)) if (k !== 'wheels' && k !== 'adjust') erros.push(`a gradação ${onde} tem "${k}"; a gradação vai pelas rodas (wheels) e pela temperatura do look (adjust): LUT e o resto pedem a escolha do usuário vendo antes e depois`)
  if (g.adjust) conferirCorrecao(g.adjust, erros, `o adjust da gradação ${onde}`)
  for (const [zona, roda] of Object.entries(g.wheels || {})) {
    if (!ZONAS.includes(zona)) { erros.push(`a gradação ${onde} tem a roda "${zona}" (${ZONAS.join(', ')})`); continue }
    for (const [k, v] of Object.entries(roda || {})) {
      if (!RODA[k]) erros.push(`a roda ${zona} da gradação ${onde} tem "${k}" (${Object.keys(RODA).join(', ')})`)
      else if (!dentro(v, RODA[k]) || (k === 'hue' && v >= 360)) erros.push(`o ${k} da roda ${zona} da gradação ${onde} é ${JSON.stringify(v)}; a faixa é ${RODA[k][0]} a ${RODA[k][1]}`)
    }
  }
}

// { payload, erros, avisos }: o payload é null quando não há nada a aplicar
// No falado com motion, o plano.json é o dono da linguagem (o `linguagemDoPlano`): a peca.json que
// diz outra reprova, para a câmera e as réguas não medirem linguagens diferentes
export function corDaCamera(peca, { linguagens = null, linguagemDoPlano = null } = {}) {
  const L = linguagens || JSON.parse(readFileSync(LINGUAGENS, 'utf8'))
  const erros = [], avisos = []
  if (peca.linguagem && linguagemDoPlano && peca.linguagem !== linguagemDoPlano) {
    erros.push(`a peca.json diz a linguagem "${peca.linguagem}" e o plano.json diz "${linguagemDoPlano}": o plano é o dono; tire a da peca.json ou iguale as duas`)
  }
  const id = linguagemDoPlano || peca.linguagem || LINGUAGEM_PADRAO
  const ling = L.linguagens[id]
  if (!ling) erros.push(`a linguagem "${id}" da peça não está no linguagens.json da /video (${Object.keys(L.linguagens).join(', ')})`)
  const cor = peca.cor || {}
  const correcao = cor.correcao || null
  if (correcao) conferirCorrecao(correcao, erros)
  else avisos.push('a câmera sai sem a correção medida: rode o "npx hyperframes media-treatment --analyze" na gravação e escreva a cor.correcao da peca.json (cor.md, "Correção e gradação")')
  // o look da linguagem é escolha do usuário, vista antes e depois: entra com o pedido escrito, ou sozinho
  // quando o usuário já o aprovou (`gradacao_aprovada` no linguagens.json) e a peça é nova, com a cor medida;
  // a peça antiga, sem `cor`, montada de novo, não muda de cor
  const daLinguagem = cor.gradacao === true || (cor.gradacao === undefined && peca.cor && ling?.gradacao_aprovada)
  const gradacao = daLinguagem ? ling?.gradacao || null : cor.gradacao || null
  if (cor.gradacao === undefined && !daLinguagem) avisos.push(`a câmera sai sem a gradação da linguagem ${id}: ela entra com "gradacao": true na cor da peca.json, depois que o usuário vir o antes e depois e escolher (cor.md, "Por linguagem")`)
  if (gradacao) conferirGradacao(gradacao, daLinguagem ? `da linguagem ${id}` : 'da peca.json', erros)
  if (erros.length) return { payload: null, erros, avisos }
  const payload = { intensity: 1 }
  // o adjust do look soma com a correção da gravação, chave a chave, e fica na faixa do motor
  const adjust = { ...(correcao || {}) }
  for (const [k, v] of Object.entries(gradacao?.adjust || {})) {
    const [lo, hi] = CORRECAO[k]
    adjust[k] = Math.round(Math.min(hi, Math.max(lo, (adjust[k] || 0) + v)) * 1000) / 1000
  }
  if (Object.keys(adjust).length) payload.adjust = adjust
  if (gradacao?.wheels) payload.wheels = gradacao.wheels
  return { payload: Object.keys(payload).length > 1 ? payload : null, erros, avisos }
}

// o atributo no <video id="camera"> do modelo da /cortes, trocando o que já havia
export function comCor(html, payload) {
  if (!payload) return html
  const camera = /<video id="camera"((?:(?!>)[\s\S])*)>/
  if (!camera.test(html)) throw new Error('o modelo da /cortes mudou: sem o <video id="camera"> onde a cor da câmera entra')
  const valor = JSON.stringify(payload).replace(/'/g, '&#39;')
  return html.replace(camera, (_, resto) => `<video id="camera" data-color-grading='${valor}'${resto.replace(/\s*data-color-grading='[^']*'/, '')}>`)
}
