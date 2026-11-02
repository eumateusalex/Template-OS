#!/usr/bin/env node
// node fabrica/mutar.mjs <arquivo> "<de>" "<para>" [--comando "<cmd>"] [--registrar <teste>] [--raiz <dir>]
//
// Quebra a implementação de propósito e exige que o teste fique VERMELHO.
// Cobertura prova que o teste passou por ali; só a mutação prova que ele mede.
//
// Classe de defeito que ele impede: teste que nunca foi visto reprovando.
// É o caso de 91 testes de isolamento se pulando em silêncio com o portão verde
// por cima.
//
// 🚨 Cinco desfechos, e o 4 é o que mais pesa: "o runner não mediu". Sem ele, `comando errado` vira "mutação pega", que é o pior verde
// possível — ele afirma que o teste é forte quando ninguém rodou teste nenhum.
//
// 🚨 Troca que quebra a sintaxe do arquivo sai 2 e não se registra: o vermelho
// dela é o módulo que não carrega, e isso não prova que o teste mede o trecho.
//
// 🚨 `split`/`join`, nunca `String.replace`: `$&` e `$1` no texto de troca são
// interpretados pelo replace, e isso cola um arquivo inteiro dentro de si
// mesmo.
//
// Prova: testes/teste-mutar.mjs

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

import { rodar } from './lib/runner.mjs'

export const DESFECHO = {
  PEGA: 0,
  PASSOU: 1,
  TRECHO: 2,
  NAO_VOLTOU: 3,
  NAO_MEDIU: 4
}

const EXPLICA = {
  0: 'mutação pega: o teste ficou vermelho, como tinha que ficar',
  1: 'o teste continua VERDE com a implementação quebrada: ele não mede este trecho',
  2: 'não deu para mutar: o trecho não é único, não existe, ou a troca não mudou nada',
  3: 'o arquivo NÃO voltou byte a byte: confira antes de continuar',
  4: 'o runner não mediu nada: sem teste rodado, não há o que provar'
}

const JS = new Set(['.js', '.mjs', '.cjs'])

/** O Python que confere a sintaxe: o do `.venv` do projeto, ou o do PATH. */
function pythonDe (raiz) {
  const doVenv = [join(raiz, '.venv', 'Scripts', 'python.exe'), join(raiz, '.venv', 'bin', 'python')].find((c) => existsSync(c))
  if (doVenv) return [doVenv]
  for (const nome of ['python', 'python3']) {
    const r = spawnSync(nome, ['--version'], { encoding: 'utf8', timeout: 20000 })
    if (r.status === 0) return [nome]
  }
  return null
}

/**
 * O arquivo mutado ainda é código que o interpretador aceita?
 * `node --check` para JavaScript; para Python, `ast.parse`, que não grava
 * `.pyc` nem suja a árvore. As outras extensões passam sem conferência: o
 * `node --check` aceita `.ts` sem olhar a sintaxe, e conferência que não confere
 * não se finge.
 * @returns {{ ok: true } | { ok: false, codigo: number, mensagem: string, saida?: string }}
 */
export function conferirSintaxe (caminho, raiz = process.cwd()) {
  const ext = extname(caminho).toLowerCase()
  let r
  if (JS.has(ext)) {
    r = spawnSync(process.execPath, ['--check', caminho], { encoding: 'utf8', timeout: 60000 })
  } else if (ext === '.py') {
    const py = pythonDe(raiz)
    if (!py) {
      return { ok: false, codigo: DESFECHO.NAO_MEDIU, mensagem: 'não achei Python para conferir a sintaxe do arquivo mutado: sem isso, um vermelho por erro de sintaxe passaria por mutação pega' }
    }
    const codigo = 'import ast, sys; ast.parse(open(sys.argv[1], encoding="utf-8").read(), sys.argv[1])'
    r = spawnSync(py[0], ['-B', '-c', codigo, caminho], { encoding: 'utf8', timeout: 60000 })
  } else {
    return { ok: true }
  }
  if (r.status === 0) return { ok: true }
  const saida = `${r.stdout ?? ''}${r.stderr ?? ''}`.trim().split('\n').filter((l) => /Error|\^/.test(l)).slice(0, 4).join('\n')
  return {
    ok: false,
    codigo: DESFECHO.TRECHO,
    mensagem: 'a troca quebra a sintaxe do arquivo: o teste ficaria vermelho porque o módulo não carrega, não porque mede o trecho. Nada foi registrado. Escolha uma troca que deixe o código válido e mude o comportamento',
    saida
  }
}

/**
 * @returns {{ codigo: number, mensagem: string, saida?: string }}
 */
export function mutar ({
  arquivo,
  de,
  para,
  comando,
  raiz = process.cwd(),
  conferirGit = true,
  restaurar = true,
  tempoMaximo = 10 * 60 * 1000
}) {
  const caminho = join(raiz, arquivo)

  let original
  try {
    original = readFileSync(caminho, 'utf8')
  } catch (erro) {
    return { codigo: DESFECHO.TRECHO, mensagem: `não consegui ler ${arquivo}: ${erro.message}` }
  }

  if (de === para) {
    return { codigo: DESFECHO.TRECHO, mensagem: 'a troca não mudou nada: "de" é igual a "para"' }
  }

  const partes = original.split(de)
  if (partes.length === 1) {
    return { codigo: DESFECHO.TRECHO, mensagem: `o trecho não existe em ${arquivo}` }
  }
  if (partes.length > 2) {
    return {
      codigo: DESFECHO.TRECHO,
      mensagem: `o trecho aparece ${partes.length - 1} vezes em ${arquivo}: não é único, escolha um trecho maior`
    }
  }

  if (conferirGit) {
    const st = rodar(`git status --porcelain -- "${arquivo}"`, { cwd: raiz, tempoMaximo: 15000 })
    // ⚠️ Arquivo NÃO RASTREADO (`??`) passa: não há nada no git para perder, e a
    // restauração vem do conteúdo lido em memória, não do git. Recusar `??`
    // travaria toda mutação em arquivo recém-escrito, que é justamente quando
    // a régua nova precisa ser provada.
    const sujoRastreado = st.saiu === 0 &&
      st.saida.split('\n').some((l) => l.trim() && !l.startsWith('??'))
    if (sujoRastreado) {
      return {
        codigo: DESFECHO.NAO_MEDIU,
        mensagem: `${arquivo} já está modificado na árvore: comite ou guarde antes, a restauração precisa de base limpa`
      }
    }
  }

  const mutado = partes.join(para)
  if (mutado === original) {
    return { codigo: DESFECHO.TRECHO, mensagem: 'o arquivo não mudou depois da troca' }
  }

  let resultado = { codigo: DESFECHO.NAO_MEDIU, mensagem: EXPLICA[DESFECHO.NAO_MEDIU] }
  try {
    writeFileSync(caminho, mutado, 'utf8')
    if (readFileSync(caminho, 'utf8') !== mutado) {
      return { codigo: DESFECHO.TRECHO, mensagem: 'a mutação não chegou ao disco' }
    }

    // 🚨 Troca que quebra a SINTAXE não prova nada: o teste fica vermelho
    // porque o módulo nem carrega, não porque mede o trecho. Ela não conta
    // como pega e não se registra.
    const sintaxe = conferirSintaxe(caminho, raiz)
    const r = sintaxe.ok ? rodar(comando, { cwd: raiz, tempoMaximo }) : null

    if (!sintaxe.ok) {
      resultado = { codigo: sintaxe.codigo, mensagem: sintaxe.mensagem, saida: sintaxe.saida }
    } else if (!r.testes.conhecido || r.testes.rodaram === 0) {
      const porque = r.testes.conhecido ? '0 teste rodou' : 'não sei ler a saída deste runner'
      resultado = {
        codigo: DESFECHO.NAO_MEDIU,
        mensagem: `o runner não mediu nada (${porque})`,
        saida: r.saida.trim().split('\n').slice(-12).join('\n')
      }
    } else if (r.testes.falharam > 0 || r.saiu !== 0) {
      resultado = { codigo: DESFECHO.PEGA, mensagem: EXPLICA[DESFECHO.PEGA] }
    } else {
      resultado = { codigo: DESFECHO.PASSOU, mensagem: EXPLICA[DESFECHO.PASSOU] }
    }
  } catch (erro) {
    resultado = { codigo: DESFECHO.NAO_MEDIU, mensagem: `não consegui mutar: ${erro.message}` }
  } finally {
    if (restaurar) {
      try {
        writeFileSync(caminho, original, 'utf8')
        if (readFileSync(caminho, 'utf8') !== original) {
          resultado = { codigo: DESFECHO.NAO_VOLTOU, mensagem: EXPLICA[DESFECHO.NAO_VOLTOU] }
        }
      } catch (erro) {
        resultado = { codigo: DESFECHO.NAO_VOLTOU, mensagem: `${EXPLICA[DESFECHO.NAO_VOLTOU]} (${erro.message})` }
      }
    }
  }

  return resultado
}

/** A linha de registro, no formato que o conferidor `mutacoes` sabe ler. */
export function linhaDeRegistro (arquivo, de, para, quando = new Date()) {
  const data = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(quando)
  return `mutação: ${arquivo} · "${de}" → "${para}" · pega em ${data}`
}

function principal () {
  const args = process.argv.slice(2)
  const livres = []
  let comando = null
  let registrar = null
  // ⚠️ `--raiz` existe porque a pasta corrente não é prova de nada: a sessão
  // que chama pode estar noutra árvore (num worktree, por exemplo).
  let raiz = process.cwd()
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--comando') { comando = args[i + 1]; i += 1; continue }
    if (args[i] === '--registrar') { registrar = args[i + 1]; i += 1; continue }
    if (args[i] === '--raiz') { raiz = resolve(args[i + 1] ?? '.'); i += 1; continue }
    livres.push(args[i])
  }
  const [arquivo, de, para] = livres
  if (!arquivo || de === undefined || para === undefined) {
    console.error('uso: node fabrica/mutar.mjs <arquivo> "<de>" "<para>" [--comando "<cmd>"] [--registrar <teste>] [--raiz <dir>]')
    process.exit(2)
    return
  }
  if (!comando) {
    console.error('✗ falta --comando: sem comando de teste não há o que medir')
    process.exit(4)
    return
  }

  // 🚨 O registro é UMA linha de comentário, e o conferidor `mutacoes` o lê
  // linha a linha. Trecho com quebra de linha escreveria a segunda linha no
  // cabeçalho sem o `//`, e o teste deixaria de compilar. Recusa ANTES de
  // mutar: nada é tocado.
  // U+2028 e U+2029 também encerram um comentário `//` em JS; montados por
  // código, porque escritos crus no fonte eles quebrariam este próprio arquivo.
  const quebras = ['\r', '\n', String.fromCharCode(0x2028), String.fromCharCode(0x2029)]
  if (registrar && quebras.some((q) => `${de}${para}`.includes(q))) {
    console.error('✗ --registrar só aceita trecho de uma linha: o registro é um comentário de uma linha. Escolha uma linha só do trecho, ou rode sem --registrar.')
    process.exit(DESFECHO.TRECHO)
    return
  }

  const r = mutar({ arquivo, de, para, comando, raiz })
  console.log(r.mensagem)
  if (r.saida) console.log(r.saida)

  if (r.codigo === DESFECHO.PEGA && registrar) {
    const linha = linhaDeRegistro(arquivo, de, para)
    registrar = resolve(raiz, registrar)
    const texto = readFileSync(registrar, 'utf8')
    const linhas = texto.split('\n')
    let i = 0
    while (i < linhas.length && (linhas[i].startsWith('//') || linhas[i].startsWith('#') || linhas[i].trim() === '')) {
      if (linhas[i].trim() === '' && i > 0 && !linhas[i + 1]?.startsWith('//') && !linhas[i + 1]?.startsWith('#')) break
      i += 1
    }
    const marca = registrar.endsWith('.py') ? '#' : '//'
    linhas.splice(i, 0, `${marca} ${linha}`)
    writeFileSync(registrar, linhas.join('\n'), 'utf8')
    console.log(`registrado em ${registrar}`)
  }

  process.exit(r.codigo)
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  principal()
}
