#!/usr/bin/env node
// node .claude/skills/fabrica/scripts/provar-mutacoes.mjs [--prazo <segundos>]
//
// Lê as linhas `mutação:` dos cabeçalhos dos testes do kit e RODA cada uma,
// exigindo que o teste fique vermelho. É o `--reexecutar` do kit aplicado à
// própria fábrica.
//
// Classe de defeito que ele impede: registro de mutação que cita um trecho que
// não existe mais no fonte, ou que nunca existiu: registro escrito de cabeça
// cita trecho que ninguém escreveu (quatro de seis cabeçalhos, medido).
//
// Prova: ele mesmo, rodando. Um registro velho reprova na hora.

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { mutar, DESFECHO } from '../kit/mutar.mjs'
import { linhasDe } from '../kit/lib/arquivos.mjs'

const AQUI = dirname(fileURLToPath(import.meta.url))
const SKILL = dirname(AQUI)
const KIT = join(SKILL, 'kit')

// Aceita "mutação" e "mutacao": teclado erra acento, e a régua não pode
// depender disso. A mesma tolerância do conferidor `mutacoes` do kit.
const RE_MUTACAO = /muta[çc][ãa]o:\s*(.+?)\s*·\s*"(.*)"\s*→\s*"(.*)"\s*·/u

// 🚨 Uma linha que PARECE registro e não parseia tem que gritar. Sem isto, o
// provador conta só o que enxerga e diz "10 de 10" com 11 no disco, que é
// exatamente o guarda cego: um registro escrito sem cedilha sumiria da
// contagem, e o verde continuaria verde.
const RE_PARECE = /muta[çc][ãa]o\s*:/iu

export function registrosDe (textoDoTeste) {
  const achados = []
  const malformados = []
  for (const linha of linhasDe(textoDoTeste)) {
    // ⚠️ Só o comentário na coluna zero é registro. As provas dos conferidores
    // carregam `// mutação:` DENTRO de string, como dado plantado, e ler
    // aquilo como registro mandaria mutar um `src/a.ts` que não existe.
    if (!/^\/\/\s/.test(linha)) continue
    const m = linha.match(RE_MUTACAO)
    if (m) {
      achados.push({ arquivo: m[1], de: m[2], para: m[3] })
    } else if (RE_PARECE.test(linha) && !/^\s*\/\/\s*[A-ZÀ-Ú]/.test(linha)) {
      malformados.push(linha.trim())
    }
  }
  achados.malformados = malformados
  return achados
}

/**
 * Onde moram os registros, e com que comando cada um se mede.
 * ⚠️ As provas dos conferidores entram: a mutação de um conferidor se
 * registra no cabeçalho da prova dele e se mede pela matriz, que imprime a
 * contagem que o runner sabe ler.
 */
function fontesDeRegistro () {
  const barra = (c) => c.split('\\').join('/')
  const testes = readdirSync(join(KIT, 'testes'))
    .filter((f) => f.startsWith('teste-') && f.endsWith('.mjs'))
    .map((f) => ({ rotulo: f, caminho: join(KIT, 'testes', f), comando: `node --test "${barra(join(KIT, 'testes', f))}"` }))
  const provas = readdirSync(join(KIT, 'provas'))
    .filter((f) => f.endsWith('.mjs'))
    .map((f) => ({
      rotulo: `provas/${f}`,
      caminho: join(KIT, 'provas', f),
      comando: `node "${barra(join(KIT, 'teste-portao.mjs'))}" --so ${f.replace(/\.mjs$/, '')}`
    }))
  // Os testes dos scripts da skill (a bancada): o registro
  // leva `scripts/<arquivo>`, relativo à skill.
  const dosScripts = existsSync(join(SKILL, 'scripts', 'testes'))
    ? readdirSync(join(SKILL, 'scripts', 'testes'))
      .filter((f) => f.startsWith('teste-') && f.endsWith('.mjs'))
      .map((f) => ({ rotulo: `scripts/testes/${f}`, caminho: join(SKILL, 'scripts', 'testes', f), comando: `node --test "${barra(join(SKILL, 'scripts', 'testes', f))}"` }))
    : []
  return [...testes, ...provas, ...dosScripts]
}

/**
 * O `--prazo <segundos>`, ou nada. Qualquer outra forma é erro de uso.
 * @returns {{ prazoMs: number|null } | { erro: string }}
 */
export function lerPrazo (argv) {
  const i = argv.indexOf('--prazo')
  if (i === -1) return { prazoMs: null }
  const valor = argv[i + 1]
  if (!/^\d+$/.test(valor ?? '')) return { erro: `--prazo pede um número inteiro de segundos, e veio "${valor ?? ''}"` }
  return { prazoMs: Number(valor) * 1000 }
}

/**
 * Cabe mais uma mutação no prazo? A conta usa a MAIOR duração já medida: a
 * decisão é tomada antes de começar, porque parar no meio deixaria a fonte
 * mutada.
 */
export function cabeMaisUma ({ prazoMs, gastoMs, maiorMs }) {
  return prazoMs === null || gastoMs + maiorMs < prazoMs
}

function principal () {
  // 🚨 A raiz vem da POSIÇÃO deste arquivo (.claude/skills/fabrica/scripts),
  // nunca da pasta corrente: chamado de outra árvore, ele procuraria a fonte
  // lá, e o mesmo caminho nas duas árvores seria mutado no lugar errado.
  const raiz = resolve(SKILL, '..', '..', '..')

  // 🚨 O prazo: quem chama tem teto, e o provador morto pelo teto de quem chama
  // seguiria vivo, órfão, mutando a fonte.
  const lido = lerPrazo(process.argv.slice(2))
  if ('erro' in lido) {
    console.log(`✗ ${lido.erro}`)
    console.log('uso: provar-mutacoes.mjs [--prazo <segundos>]')
    process.exit(2)
  }
  const { prazoMs } = lido
  const inicio = Date.now()
  let maiorMs = 0

  const fontes = fontesDeRegistro().map((f) => ({ ...f, registros: registrosDe(readFileSync(f.caminho, 'utf8')) }))
  const previstas = fontes.reduce((soma, f) => soma + f.registros.length, 0)

  let total = 0
  let ruins = 0

  for (const { rotulo: teste, registros, comando } of fontes) {
    for (const linha of registros.malformados ?? []) {
      ruins += 1
      console.log(`  ✗  ${teste}: linha parece registro de mutação e não parseia:`)
      console.log(`       ${linha}`)
      console.log('       formato: mutação: <arquivo> · "<de>" → "<para>" · pega')
    }

    if (registros.length === 0) {
      console.log(`  ·  ${teste}: sem mutação registrada`)
      continue
    }
    for (const reg of registros) {
      if (!cabeMaisUma({ prazoMs, gastoMs: Date.now() - inicio, maiorMs })) {
        console.log('────────────────────────────────────────')
        console.log(`✗ parou no prazo de ${prazoMs / 1000} s: ${total} de ${previstas} mutações medidas; as outras ${previstas - total} não rodaram, e a fonte não ficou mutada.`)
        process.exit(1)
      }
      const comecou = Date.now()
      total += 1
      // o caminho do registro é relativo ao kit (`kit/lib/x.mjs`), ou à skill (`scripts/x.mjs`)
      const arquivo = reg.arquivo.startsWith('kit/') || reg.arquivo.startsWith('scripts/')
        ? join(SKILL, reg.arquivo)
        : join(KIT, reg.arquivo)
      const relativo = arquivo.replace(`${raiz}\\`, '').replace(`${raiz}/`, '').split('\\').join('/')

      const r = mutar({
        arquivo: relativo,
        de: reg.de,
        para: reg.para,
        comando,
        raiz,
        conferirGit: true
      })

      if (r.codigo === DESFECHO.PEGA) {
        console.log(`  ✓  ${teste} → ${reg.arquivo}: mutação pega`)
      } else {
        ruins += 1
        console.log(`  ✗  ${teste} → ${reg.arquivo}: ${r.mensagem}`)
        if (r.saida) console.log(`       ${r.saida.split('\n').slice(-3).join('\n       ')}`)
      }
      maiorMs = Math.max(maiorMs, Date.now() - comecou)
    }
  }

  console.log('────────────────────────────────────────')
  if (total === 0) {
    console.log('✗ nenhuma mutação registrada: nada foi provado.')
    process.exit(1)
  }
  if (ruins > 0) {
    console.log(`✗ ${ruins} de ${total} mutações NÃO foram pegas.`)
    process.exit(1)
  }
  console.log(`✅ ${total} de ${total} mutações pegas.`)
  process.exit(0)
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  principal()
}
