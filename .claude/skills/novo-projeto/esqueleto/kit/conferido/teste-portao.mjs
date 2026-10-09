#!/usr/bin/env node
// fundação: conferido v1 · o ajuste mora no projeto, nunca aqui
//
// node fundacao/teste-portao.mjs [--so <conferidor>]
//
// A matriz dos conferidores da fundação: para cada um, planta cada defeito
// numa CÓPIA em `os.tmpdir()` e exige o vermelho, e planta o caso limpo e
// exige o verde. É o `teste-portao.mjs` da fábrica, no mundo da fundação: o
// que se planta é o `fundacao/fundacao.json` e os arquivos que ele declara.
//
// 🚨 A lista de provas vem do DISCO, nunca da mão: guarda com lista à mão fica
// cega quando nasce o próximo conferidor.
//
// ⚠️ Além do desfecho, cada caso pode exigir o que a saída DIZ (`cita`) e o
// que ela NÃO diz (`naoCita`). O segundo existe para a semente editada: ela
// tem que passar calada, e "passou" sem olhar o texto não prova o silêncio.

import { readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'

import { criar, apagar } from './lib/temporaria.mjs'
import { rodar } from './lib/runner.mjs'
import { pinta } from './lib/saida.mjs'

const ESTE = fileURLToPath(import.meta.url)
const KIT = dirname(ESTE)

/** O manifesto padrão de um mundo plantado: projeto da trilha app, marca da casa. */
function manifestoPadrao () {
  return {
    versao: '1.0.0',
    data: '2026-09-22',
    trilha: 'app',
    marca: { tipo: 'casa' },
    origem: { caminho: '.claude/skills/novo-projeto/esqueleto', tag: 'fundacao-v1.0.0' },
    portao: 'fabrica/stack.mjs',
    pisos: { hex: 0, paleta: 0 },
    pisosEm: '2026-09-22',
    fixado: null,
    arquivos: {}
  }
}

const sha = (texto) => createHash('sha256').update(Buffer.from(String(texto).split('\r\n').join('\n'), 'utf8')).digest('hex')

/** A ajuda que cada caso recebe para montar o mundo dele. */
function ajudaDe (raiz) {
  const manifesto = manifestoPadrao()
  const ajuda = {
    raiz,
    sha,
    escreve (rel, conteudo) {
      const destino = join(raiz, rel)
      mkdirSync(dirname(destino), { recursive: true })
      writeFileSync(destino, conteudo, 'utf8')
      return destino
    },
    /** Um arquivo conferido: escrito, e declarado no manifesto com o sha dele. */
    conferido (rel, conteudo, fonte = `identidade/${rel}`) {
      ajuda.escreve(rel, conteudo)
      manifesto.arquivos[rel] = { tipo: 'conferido', sha: sha(conteudo), fonte }
    },
    /** Uma semente: escrita, e declarada com o sha de ORIGEM (o do dia da cópia). */
    semente (rel, conteudo, origem = conteudo, fonte = `.claude/skills/novo-projeto/esqueleto/kit/semente/app/${rel}`) {
      ajuda.escreve(rel, conteudo)
      manifesto.arquivos[rel] = { tipo: 'semente', origem: sha(origem), versaoOrigem: '1.0.0', fonte }
    },
    declara (rel, entrada) {
      manifesto.arquivos[rel] = entrada
    },
    ajusta (extra) {
      Object.assign(manifesto, extra)
    },
    semManifesto: false,
    gravar () {
      if (ajuda.semManifesto) return
      ajuda.escreve('fundacao/fundacao.json', `${JSON.stringify(manifesto, null, 2)}\n`)
    }
  }
  return ajuda
}

async function principal () {
  const args = process.argv.slice(2)
  const iSo = args.indexOf('--so')
  const so = iSo !== -1 ? args[iSo + 1] : null

  const pastaProvas = join(KIT, 'provas')
  if (!existsSync(pastaProvas)) {
    console.log('✗ não existe a pasta provas/: nenhuma régua da fundação foi provada.')
    process.exit(1)
    return
  }
  const arquivos = readdirSync(pastaProvas).filter((f) => f.endsWith('.mjs')).sort()
  if (arquivos.length === 0) {
    console.log('✗ nenhuma prova em provas/: guarda sem prova é guarda cego.')
    process.exit(1)
    return
  }

  let total = 0
  let ruins = 0

  for (const arquivo of arquivos) {
    const nome = arquivo.replace(/\.mjs$/, '')
    if (so && so !== nome) continue
    const mod = await import(pathToFileURL(join(pastaProvas, arquivo)).href)
    const casos = mod.casos ?? []
    const alvo = join(KIT, 'portao', `${mod.conferidor ?? nome}.mjs`)
    if (!existsSync(alvo)) {
      console.log(`  ${pinta('✗', 'vermelho')} ${nome}: não existe portao/${mod.conferidor ?? nome}.mjs`)
      ruins += 1
      continue
    }
    if (casos.length === 0) {
      console.log(`  ${pinta('✗', 'vermelho')} ${nome}: nenhum caso plantado`)
      ruins += 1
      continue
    }

    let vermelhos = 0
    let verdes = 0
    for (const caso of casos) {
      total += 1
      const raiz = criar(`fundacao-prova-${nome}-`)
      try {
        const ajuda = ajudaDe(raiz)
        caso.planta(raiz, ajuda)
        ajuda.gravar()
        const extra = (typeof caso.args === 'function' ? caso.args(raiz) : caso.args ?? []).map((a) => `"${String(a).split('\\').join('/')}"`).join(' ')
        const env = { ...process.env, ...(typeof caso.env === 'function' ? caso.env(raiz) : caso.env ?? {}) }
        const r = rodar(`node "${alvo.split('\\').join('/')}" --raiz "${raiz.split('\\').join('/')}" ${extra}`, {
          cwd: KIT,
          tempoMaximo: 60000,
          env
        })
        const deu = r.saiu === 0 ? 'verde' : 'vermelho'
        const problemas = []
        if (deu !== caso.espera) problemas.push(`esperava ${caso.espera}, deu ${deu}`)
        if (caso.cita && !caso.cita.test(r.saida)) problemas.push(`não citou ${caso.cita}`)
        if (caso.naoCita && caso.naoCita.test(r.saida)) problemas.push(`citou ${caso.naoCita}, e devia ficar calado`)
        if (problemas.length) {
          ruins += 1
          console.log(`  ${pinta('✗', 'vermelho')} ${nome} · ${caso.nome}: ${problemas.join('; ')}`)
          console.log(`       ${r.saida.trim().split('\n').slice(-6).join('\n       ')}`)
        }
        if (caso.espera === 'vermelho') vermelhos += 1
        else verdes += 1
      } finally {
        apagar(raiz)
      }
    }

    // 🚨 Régua sem caso VERDE só sabe reprovar; sem caso VERMELHO, não sabe
    // reprovar nada. As duas faltas são defeito.
    if (vermelhos === 0 || verdes === 0) {
      ruins += 1
      console.log(`  ${pinta('✗', 'vermelho')} ${nome}: precisa de pelo menos um caso vermelho E um verde (tem ${vermelhos} e ${verdes})`)
    } else {
      console.log(`  ${pinta('✓', 'verde')} ${nome}: ${vermelhos} vermelho(s), ${verdes} verde(s)`)
    }
  }

  console.log('────────────────────────────────────────')
  if (total === 0) {
    console.log('✗ nenhum caso rodou.')
    process.exit(1)
    return
  }
  if (ruins > 0) {
    console.log(`✗ ${ruins} problema(s) em ${total} caso(s).`)
    process.exit(1)
    return
  }
  console.log(`✅ ${total} caso(s) plantado(s) da fundação, todos com o desfecho esperado.`)
  process.exit(0)
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(ESTE)) {
  principal()
}
