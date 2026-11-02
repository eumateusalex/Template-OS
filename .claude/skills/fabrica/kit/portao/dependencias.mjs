#!/usr/bin/env node
// node fabrica/portao/dependencias.mjs [--raiz <dir>] [--auditar]
//
// Classe de defeito: dependência de runtime com licença que contamina, e
// vulnerabilidade conhecida no que vai para produção. Constituição IX e X.
// Dependência troca de licença debaixo do projeto, como o `ua-parser-js` 2.0.
//
// 🚨 A licença se mede OFFLINE, lendo o que já está instalado (o campo
// `license` do package.json de cada pacote, ou o METADATA do dist-info). A
// AUDITORIA precisa de rede, e por isso só roda com `--auditar`: sem rede ela
// vira "não medido", e "não medido" reprova (princípio VI). Um conferidor que
// fica vermelho toda vez que o wi-fi cai é um conferidor que alguém desliga.
//
// ⚠️ Licença AUSENTE reprova. "Licença desconhecida" não é licença boa: é
// alguém decidindo por você, mais tarde.
//
// ⚠️ devDependency não contamina o produto, e fica de fora da conta.
//
// Prova: provas/dependencias.mjs

import { join, dirname } from 'node:path'
import { existsSync, readdirSync } from 'node:fs'

import { Relatorio } from '../lib/saida.mjs'
import { ler } from '../lib/arquivos.mjs'
import { rodar } from '../lib/runner.mjs'
import { comoComando } from '../lib/conferidor.mjs'

/** Licenças que puxam o código junto quando ele vai para o cliente. */
export const CONTAMINAM = [/^AGPL/i, /^SSPL/i, /^GPL-[23]/i, /^CC-BY-NC/i, /^BUSL/i, /^Elastic-2/i]

function contamina (licenca) {
  return CONTAMINAM.some((re) => re.test(String(licenca).trim()))
}

function conferirNode (raiz, r, stack) {
  // ⚠️ O `package.json` nem sempre está na raiz. Num workspace ele costuma
  // morar em `scripts/`, e procurar só na raiz reprovaria por "não achei package.json"
  // num projeto que TEM dependências. O projeto declara onde, e `node_modules`
  // se resolve ao lado dele.
  const relPkg = stack?.PACOTE ?? 'package.json'
  const caminhoPkg = join(raiz, relPkg)
  const pastaPkg = dirname(caminhoPkg)

  if (!existsSync(caminhoPkg)) {
    r.naoMedido(
      `não achei ${relPkg}: declare PACOTE em fabrica/stack.mjs se ele mora noutro lugar, ` +
      'ou pule este passo com razão escrita'
    )
    return 0
  }

  let pkg
  try {
    pkg = JSON.parse(ler(caminhoPkg))
  } catch (erro) {
    r.naoMedido(`package.json ilegível: ${erro.message}`)
    return 0
  }

  const deRuntime = Object.keys(pkg.dependencies ?? {})
  if (deRuntime.length === 0) {
    r.nota('nenhuma dependência de runtime: não há licença a conferir')
    return 1
  }

  let olhados = 0
  for (const nome of deRuntime) {
    const caminho = join(pastaPkg, 'node_modules', nome, 'package.json')
    if (!existsSync(caminho)) {
      r.naoMedido(`${nome} está declarada e não está instalada: rode a instalação antes do portão`)
      continue
    }
    olhados += 1
    let dados
    try {
      dados = JSON.parse(ler(caminho))
    } catch {
      r.naoMedido(`${nome}: package.json do pacote instalado está ilegível`)
      continue
    }
    const licenca = dados.license ?? dados.licenses?.[0]?.type ?? ''
    if (!licenca) {
      r.achado(nome, 'dependência de runtime sem licença declarada', 'licença desconhecida não é licença boa: confirme antes de depender')
    } else if (contamina(licenca)) {
      r.achado(nome, `licença ${licenca} contamina o que vai para o cliente`, 'troque a dependência, ou registre um ADR com a decisão e o risco')
    }
  }
  return olhados
}

/**
 * A licença de um pacote Python, em três formas.
 * ⚠️ Pacote moderno declara `License-Expression:`, não `License:`. Lendo só o
 * campo antigo, pytest, ruff e typing_extensions aparecem como "sem licença
 * declarada", e o conferidor reprova o mundo.
 */
export function licencaPython (meta) {
  const expressao = meta.match(/^License-Expression:\s*(.+)$/m)
  if (expressao) return expressao[1].trim()

  const antiga = meta.match(/^License:\s*(.+)$/m)
  if (antiga && antiga[1].trim() && antiga[1].trim() !== 'UNKNOWN') return antiga[1].trim()

  const classificador = meta.match(/^Classifier:\s*License\s*::.*::\s*(.+)$/m)
  if (classificador) return classificador[1].trim()

  return ''
}

/** As dependências de RUNTIME declaradas, quando o projeto as separa. */
function runtimeDoPython (raiz) {
  for (const arquivo of ['requirements.txt', 'pyproject.toml']) {
    const caminho = join(raiz, arquivo)
    if (!existsSync(caminho)) continue
    const texto = ler(caminho)
    const nomes = arquivo === 'requirements.txt'
      ? texto.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
      : (texto.match(/^\s*dependencies\s*=\s*\[([^\]]*)\]/m) ?? [0, ''])[1].split(',')
    const limpos = nomes
      .map((l) => String(l).replace(/['"]/g, '').split(/[<>=!~\[;]/)[0].trim().toLowerCase())
      .filter(Boolean)
    if (limpos.length > 0) return new Set(limpos)
  }
  return null
}

/**
 * Onde o `.venv` guarda os pacotes, nos dois sistemas.
 *
 * 🚨 No LINUX o caminho tem a VERSÃO do Python no meio
 * (`.venv/lib/python3.12/site-packages`), e no Windows não
 * (`.venv/Lib/site-packages`). Procurando só os dois caminhos sem versão, o
 * conferidor não acha nada no CI Linux e reprova com "não achei o .venv" num
 * runner que acabou de instalar quatro pacotes nele. Defeito que uma máquina
 * Windows, sozinha, nunca mostraria.
 */
function pastasDePacotes (raiz) {
  const bases = [
    join(raiz, '.venv', 'Lib', 'site-packages'),
    join(raiz, '.venv', 'lib', 'site-packages')
  ]
  const lib = join(raiz, '.venv', 'lib')
  if (existsSync(lib)) {
    for (const nome of readdirSync(lib)) {
      if (/^python\d+(\.\d+)*$/i.test(nome)) bases.push(join(lib, nome, 'site-packages'))
    }
  }
  return bases
}

function conferirPython (raiz, r) {
  const base = pastasDePacotes(raiz).find((b) => existsSync(b))
  if (!base) {
    r.naoMedido('não achei o .venv deste projeto: sem ele não dá para ler a licença do que está instalado')
    return 0
  }

  // ⚠️ O `.venv` mistura runtime e desenvolvimento, e só o RUNTIME contamina o
  // que vai para o cliente. O lado Node separa por `devDependencies`; aqui
  // a separação vem do `requirements.txt` ou do `dependencies` do pyproject.
  const runtime = runtimeDoPython(raiz)
  if (!runtime) {
    r.nota('nenhuma dependência de runtime declarada: só o ambiente de desenvolvimento está instalado')
    return 1
  }

  let olhados = 0
  for (const pasta of readdirSync(base)) {
    if (!pasta.endsWith('.dist-info')) continue
    const meta = ler(join(base, pasta, 'METADATA'))
    const nome = (meta.match(/^Name:\s*(.+)$/m) ?? [0, pasta])[1].trim()
    if (!runtime.has(nome.toLowerCase())) continue

    olhados += 1
    const licenca = licencaPython(meta)
    if (!licenca) {
      r.achado(nome, 'pacote de runtime sem licença declarada', 'confirme a licença antes de depender')
    } else if (contamina(licenca)) {
      r.achado(nome, `licença ${licenca} contamina o que vai para o cliente`, 'troque a dependência, ou registre um ADR')
    }
  }

  if (olhados === 0) {
    r.nota(`as ${runtime.size} dependência(s) de runtime declaradas não estão instaladas no .venv`)
    return 1
  }
  return olhados
}

/** O projeto declara alguma dependência de RUNTIME? Só ela vai para o cliente. */
function temRuntime (raiz, stack) {
  if (stack.STACK === 'python') return runtimeDoPython(raiz) !== null
  try {
    const pkg = JSON.parse(ler(join(raiz, stack?.PACOTE ?? 'package.json')))
    return Object.keys(pkg.dependencies ?? {}).length > 0
  } catch {
    return true
  }
}

export function conferir (raiz, stack, { escreve = console.log, auditar = false } = {}) {
  const r = new Relatorio('dependencias', {
    escreve,
    regra: 'constituição IX e X: licença de runtime conferida, e dependência com razão escrita'
  })

  const olhados = stack.STACK === 'python' ? conferirPython(raiz, r) : conferirNode(raiz, r, stack)

  if (auditar && !temRuntime(raiz, stack)) {
    // ⚠️ Zero dependência de runtime vem sem lockfile, e o `npm audit` sem
    // lockfile falha. Não há o que auditar.
    r.nota('auditoria: nenhuma dependência de runtime declarada, nada a auditar')
  } else if (auditar && stack.STACK === 'python') {
    const comando = stack.COMANDOS?.auditar ?? `${stack.PYTHON ?? 'python'} -m pip_audit`
    const saida = rodar(comando, { cwd: raiz, tempoMaximo: 180000 })
    if (saida.saiu !== 0) {
      r.achado('auditoria', `${comando} reprovou`, saida.saida.trim().split('\n').slice(-6).join(' · '))
    } else {
      r.nota(`auditoria limpa (${comando})`)
    }
  } else if (auditar) {
    // 🚨 Um `--auditar` que ninguém passa deixa vulnerabilidade alta que nenhum
    // portão vê: ele precisa de linha em PASSOS. Conta as
    // altas e as críticas do JSON do npm, e compara com `PISOS.auditoria`
    // quando o projeto declarou um teto (catraca, com data e razão); sem teto,
    // qualquer uma reprova. Resposta que não é JSON (sem rede) é não medido.
    const comando = stack.COMANDOS?.auditar ?? 'npm audit --json --omit=dev'
    const onde = dirname(join(raiz, stack?.PACOTE ?? 'package.json'))
    const saida = rodar(comando, { cwd: onde, tempoMaximo: 180000 })
    let graves = null
    try {
      const inicio = saida.saida.indexOf('{')
      const v = JSON.parse(saida.saida.slice(inicio)).metadata?.vulnerabilities ?? null
      if (v) graves = Number(v.high ?? 0) + Number(v.critical ?? 0)
    } catch {
      graves = null
    }
    if (graves === null) {
      r.naoMedido(`a auditoria não respondeu com o relatório do npm (${comando}; sem rede?): ${saida.saida.trim().split('\n').slice(-2).join(' · ')}`)
    } else if (stack.PISOS && stack.PISOS.auditoria !== undefined) {
      if (r.catraca('auditoria (altas e críticas)', graves, stack.PISOS.auditoria)) r.nota(`auditoria: ${graves} alta(s) e crítica(s), dentro do teto de ${stack.PISOS.auditoria}`)
    } else if (graves > 0) {
      r.achado('auditoria', `${graves} vulnerabilidade(s) alta(s) ou crítica(s)`, 'atualize a dependência, ou declare o teto aceito em PISOS.auditoria do stack.mjs, com a data e a razão')
    } else {
      r.nota(`auditoria limpa (${comando})`)
    }
  } else {
    r.nota('auditoria de vulnerabilidade não rodou aqui: precisa de rede. Rode com --auditar, e no CI.')
  }

  r.varreu(olhados)
  return r.fechar()
}

comoComando(import.meta.url, (raiz, stack, opcoes) =>
  conferir(raiz, stack, { ...opcoes, auditar: process.argv.includes('--auditar') })
)
