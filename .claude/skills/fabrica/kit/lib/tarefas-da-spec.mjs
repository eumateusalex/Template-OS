// Ler o `tasks.md` de uma feature: as tarefas, as fases e as marcas.
//
// Classe de defeito que ele impede: conferidor que acusa a coisa errada por
// ler o rastro errado. Guarda que lê errado é pior que guarda que não existe,
// porque ele dá vermelho onde está certo e verde onde está errado.
//
// Prova: testes/teste-tarefas-da-spec.mjs

import { linhasDe } from './arquivos.mjs'

const RE_FASE = /^##\s+(.+?)\s*$/
const RE_TAREFA = /^-\s*\[( |x|X)\]\s+(T\d+)\s*(.*)$/

/** Parece caminho de arquivo: tem barra ou tem extensão conhecida. */
const PARECE_CAMINHO = /[/\\]|\.(ts|tsx|js|jsx|mjs|cjs|py|md|json|ya?ml|toml|sh|html|css|sql)$/i

/**
 * @returns {{ id: string, feito: boolean, mutacao: boolean, paralela: boolean,
 *             texto: string, fase: string, linha: number }[]}
 */
export function lerTarefas (texto) {
  const tarefas = []
  let faseAtual = ''
  const linhas = linhasDe(texto)

  for (let i = 0; i < linhas.length; i += 1) {
    const linha = linhas[i]

    const fase = linha.match(RE_FASE)
    if (fase) {
      faseAtual = fase[1]
      continue
    }

    const m = linha.match(RE_TAREFA)
    if (!m) continue

    const resto = m[3] ?? ''
    tarefas.push({
      id: m[2],
      feito: m[1].toLowerCase() === 'x',
      mutacao: /\[M\]/.test(resto),
      paralela: /\[P\]/.test(resto),
      texto: resto,
      fase: faseAtual,
      linha: i + 1
    })
  }

  return tarefas
}

/** Os caminhos citados entre crases numa linha de tarefa. */
export function caminhosDe (texto) {
  const achados = []
  for (const m of String(texto).matchAll(/`([^`]+)`/g)) {
    const bruto = m[1].trim()
    if (!PARECE_CAMINHO.test(bruto)) continue
    if (/\s/.test(bruto)) continue
    achados.push(bruto)
  }
  return achados
}

/** As tarefas de uma fase, na ordem em que aparecem. */
export function daFase (tarefas, fase) {
  return tarefas.filter((t) => t.fase === fase)
}
