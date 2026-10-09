#!/usr/bin/env node
// fundação: conferido v1 · o ajuste mora no projeto (a tela), nunca aqui
//
// node fundacao/portao/auditar-ui.mjs [--raiz <dir>]
//
// Classe de defeito: a camada de UI deixando de ser a do registry. Três
// jeitos, e os três custam caro:
//   · componente editado à mão em src/components/ui/ (a próxima atualização o
//     atropela, e ninguém sabe o que se perdeu);
//   · HTML cru onde existe componente (num projeto real, a classe do botão principal
//     aparece copiada de 27 a 35 vezes, em 15 a 16 arquivos);
//   · o raio da marca sumindo do globals.css (e a pílula que o kit proíbe volta).
//
// 🚨 A comparação com o registry usa a ferramenta oficial, `shadcn add --diff`,
// e não um comparador nosso: o CLI transforma o componente ao instalar (ícone,
// apelido do `cn`), e um comparador caseiro acusaria a transformação como
// edição. É a lição do `auditar-shadcn.mjs` de um projeto real.
// ⚠️ Precisa de rede. Sem ela, é NÃO MEDIDO, nunca "tudo conforme".
//
// Prova: provas/auditar-ui.mjs

import { join, extname } from 'node:path'
import { existsSync, readFileSync } from 'node:fs'

import { Relatorio } from '../lib/saida.mjs'
import { andar, semComentario, linhasDe } from '../lib/arquivos.mjs'
import { isento } from '../lib/isencao.mjs'
import { rodar } from '../lib/runner.mjs'
import { comoComando } from '../lib/casca.mjs'
import { blocos, declaracoesDe, nomesUsados, hexForaDeComentario } from '../lib/cor.mjs'

export const DEZ = ['button', 'input', 'textarea', 'label', 'field', 'alert', 'card', 'separator', 'empty', 'skeleton']

/**
 * O mapa de raios da marca, medido nas classes que os dez usam:
 * botão, campo, área de texto e aviso usam `rounded-lg`; o esqueleto e o botão
 * pequeno, `rounded-md`; o cartão, `rounded-xl` (o médio). O que é maior vai ao
 * grande. Pílula não existe na marca.
 */
export const RAIOS = {
  '--radius-sm': 'var(--r-sm)',
  '--radius-md': 'var(--r-sm)',
  '--radius-lg': 'var(--r-sm)',
  '--radius-xl': 'var(--r-md)',
  '--radius-2xl': 'var(--r-lg)',
  '--radius-3xl': 'var(--r-lg)',
  '--radius-4xl': 'var(--r-lg)'
}

const TOKEN_DA_CASA = /^--(c|f|w|sp|line|on|mac|dur|acento)-|^--(ease-brand|stagger|on-dark|on-light|acento)$/
const CRUS = [
  [/<button[\s>]/, 'use o Button de @/components/ui/button'],
  [/role=["']alert["']/, 'use o Alert de @/components/ui/alert'],
  [/<hr[\s/>]/, 'use o Separator de @/components/ui/separator']
]
const MARCA_NATIVO = 'elemento nativo'
const POR_LOTE = 5 // o CLI mostra cinco arquivos por execução

/**
 * A troca do apelido do `cn` é TRANSFORMAÇÃO do CLI, e não edição (o registry
 * serve `from "cn"`, o projeto escreve `from "@/lib/utils"`). Qualquer outra
 * linha de diferença acusa o componente.
 */
function soOApelidoDoCn (bloco) {
  const mudancas = bloco
    .split('\n')
    .map((linha) => linha.replace(/^.*?│\s*│\s?/, ''))
    .filter((linha) => /^[+-]/.test(linha) && !/^(---|\+\+\+)/.test(linha))
  if (mudancas.length === 0) return false
  return mudancas.every((linha) => {
    const conteudo = linha.slice(1).trim()
    return conteudo === '' || /^import\s*\{\s*cn\s*\}\s*from\s*["'][^"']*["']$/.test(conteudo)
  })
}

/** Lê a saída do `--diff`: que componentes vieram, e quais divergem. */
export function lerDiff (saida, nomes) {
  const conferidos = new Set()
  const alterados = new Set()
  for (const bloco of String(saida).split('├').slice(1)) {
    const caminho = bloco.split('\n')[0].trim()
    const nome = caminho.split(/[\\/]/).pop()?.replace(/\.tsx.*/, '')
    if (!nome || !nomes.includes(nome)) continue
    conferidos.add(nome)
    if (!/No changes/.test(bloco) && !soOApelidoDoCn(bloco)) alterados.add(nome)
  }
  return { conferidos, alterados }
}

/**
 * 🚨 `--no-install`: roda o CLI fixado no lockfile do projeto, nunca o
 * `@latest` do dia. O do dia fica fora do lockfile (nenhuma auditoria o vê)
 * e, quando o formato do `--diff` mudasse, o portão de todo projeto
 * instalado viraria "não medido" sem o projeto ter mudado.
 */
function perguntarAoRegistry (raiz, lote, env) {
  if (env.FUNDACAO_DIFF_FALSO) return readFileSync(env.FUNDACAO_DIFF_FALSO, 'utf8')
  return rodar(`npx --no-install shadcn add ${lote.join(' ')} --diff`, { cwd: raiz, tempoMaximo: 180000 }).saida
}

export function conferir (raiz, { manifesto, env = process.env }, { escreve = console.log } = {}) {
  const r = new Relatorio('auditar-ui', {
    escreve,
    regra: 'src/components/ui/ é o registry sem edição; a tela usa o componente, não o HTML cru; o raio é o da marca'
  })
  let olhados = 0

  // 1 · os dez estão aqui
  const presentes = DEZ.filter((n) => existsSync(join(raiz, 'src/components/ui', `${n}.tsx`)))
  for (const n of DEZ) if (!presentes.includes(n)) r.achado(`src/components/ui/${n}.tsx`, 'um dos dez componentes da fundação não está no projeto', `npm exec -- shadcn add ${n}`)
  olhados += presentes.length

  // 2 · o globals.css: o raio da marca, sem hex, sem token da marca
  const relGlobals = manifesto.globals ?? 'src/app/globals.css'
  if (!existsSync(join(raiz, relGlobals))) {
    r.naoMedido(`não achei ${relGlobals}: sem ele não dá para saber que raio a tela usa`)
  } else {
    olhados += 1
    const globals = readFileSync(join(raiz, relGlobals), 'utf8')
    const doTema = new Map()
    for (const b of blocos(globals)) if (b.seletor.startsWith('@theme')) for (const [k, v] of declaracoesDe(b.corpo)) doTema.set(k, v)
    for (const [nome, esperado] of Object.entries(RAIOS)) {
      const valor = doTema.get(nome)
      if (valor !== esperado) r.achado(relGlobals, `${nome} vale ${valor ?? 'nada'}, e o raio da marca para ele é ${esperado}`, 'devolva a linha do mapa de raios da fundação no @theme inline')
    }
    const hexes = hexForaDeComentario(globals)
    if (hexes.length) r.achado(relGlobals, `${hexes.length} hex fora de comentário (linha ${hexes[0].linha}: ${hexes[0].hex})`, 'a cor mora no tema da marca, nunca no globals.css do CLI')
    const daCasa = [...nomesUsados(globals)].filter((n) => TOKEN_DA_CASA.test(n))
    if (daCasa.length) r.achado(relGlobals, `token da marca no globals.css: ${daCasa.join(', ')}`, 'a marca entra pelo tema-shadcn.css; o globals.css continua sendo o do CLI, mais o mapa de raios')
  }

  // 3 · HTML cru onde existe componente
  for (const pasta of ['src/app', 'src/components']) {
    for (const rel of andar(join(raiz, pasta), { extensoes: ['.tsx', '.jsx'] }).map((x) => `${pasta}/${x}`)) {
      if (rel.includes('components/ui/')) continue
      olhados += 1
      const original = linhasDe(readFileSync(join(raiz, rel), 'utf8'))
      linhasDe(semComentario(original.join('\n'), extname(rel))).forEach((linha, i) => {
        for (const [padrao, conserto] of CRUS) {
          if (!padrao.test(linha)) continue
          if (isento(original, i, MARCA_NATIVO).isento) continue
          r.achado(`${rel}:${i + 1}`, 'HTML cru onde a fundação tem componente', `${conserto}, ou escreva "${MARCA_NATIVO}: <razão>" na linha`)
        }
      })
    }
  }

  // 4 · os componentes ainda são os do registry
  if (presentes.length > 0) {
    const conferidos = new Set()
    const alterados = new Set()
    const perguntar = (lote) => {
      const lido = lerDiff(perguntarAoRegistry(raiz, lote, env), presentes)
      for (const n of lido.conferidos) conferidos.add(n)
      for (const n of lido.alterados) alterados.add(n)
    }
    for (let i = 0; i < presentes.length; i += POR_LOTE) perguntar(presentes.slice(i, i + POR_LOTE))
    // O CLI resolve dependência antes de mostrar, e às vezes o pedido não aparece: um a um.
    for (const n of presentes.filter((x) => !conferidos.has(x))) perguntar([n])
    const faltando = presentes.filter((n) => !conferidos.has(n))
    if (faltando.length) r.naoMedido(`o CLI do shadcn não reportou ${faltando.join(', ')} (${conferidos.size} de ${presentes.length}): sem a resposta dele não dá para dizer que não foram editados`)
    for (const n of alterados) r.achado(`src/components/ui/${n}.tsx`, 'diverge do registry: o componente foi editado à mão', `veja com: npm exec -- shadcn add ${n} --diff; o ajuste mora numa composição sua, fora de ui/`)
  }

  r.varreu(olhados)
  return r.fechar()
}

comoComando(import.meta.url, (raiz, contexto, opcoes) => conferir(raiz, contexto, opcoes))
