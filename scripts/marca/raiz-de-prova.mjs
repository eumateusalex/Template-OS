// Uma raiz de mentira para as provas da marca (scripts/marca/teste-*.mjs):
// o molde configurado com a cor, o raio, a curva e o estilo de imagem de uma
// marca inventada, gravado em <raiz>/identidade/marca.tokens.json.

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { lerMolde } from './marca.mjs'
import { rgbDe } from './derivar.mjs'

// Duas marcas que não dividem nenhum valor que as provas procuram.
export const MARCA_A = Object.freeze({ principal: '#0b4f4a', claro: '#f3eee4', acento: '#a84f17', raio: 20, curva: [0.3, 0.1, 0.3, 1], estilo: 'ilustração chapada, traço limpo, cores da marca' })
export const MARCA_B = Object.freeze({ principal: '#3b1f5c', claro: '#f5f2f8', acento: '#b0306a', raio: 6, curva: [0.5, 0, 0.1, 1], estilo: 'fotografia de produto sobre fundo liso' })

/** Os tokens do molde, sem o estado de molde, com os valores de `m`. */
export function tokensDe (m) {
  const t = structuredClone(lerMolde().tokens)
  delete t.$extensions
  t.cor.papel.principal = { $value: m.principal }
  t.cor.papel.claro = { $value: m.claro }
  t.cor.papel.acento = { $value: m.acento }
  t.raio.md = { $value: { value: m.raio, unit: 'px' } }
  t.movimento.curva.principal = { $value: m.curva }
  t.imagem.estilo = { $value: m.estilo }
  return t
}

/**
 * Uma raiz com `identidade/marca.tokens.json` (objeto vira JSON; texto vai
 * cru; `null` não grava o arquivo). Devolve `{ raiz, fora }`.
 */
export function raizCom (tokens) {
  const raiz = mkdtempSync(join(tmpdir(), 'marca-prova-'))
  if (tokens !== null) {
    mkdirSync(join(raiz, 'identidade'), { recursive: true })
    writeFileSync(join(raiz, 'identidade', 'marca.tokens.json'), typeof tokens === 'string' ? tokens : JSON.stringify(tokens))
  }
  return { raiz, fora: () => rmSync(raiz, { recursive: true, force: true }) }
}

/** O molde copiado como se fosse a marca (com o estado de molde). */
export const moldeComoMarca = () => structuredClone(lerMolde().tokens)

/**
 * As marcas de uma marca num texto gerado, sem espaço e em minúsculas: o hex e
 * os canais da principal, a curva e o estilo de imagem.
 */
export function marcasDe (m) {
  const c = rgbDe(m.principal)
  return [m.principal.toLowerCase(), `${c.r},${c.g},${c.b}`, m.curva.join(','), m.estilo.toLowerCase().replace(/\s+/g, '')]
}
export const semEspaco = (texto) => String(texto).toLowerCase().replace(/\s+/g, '')
