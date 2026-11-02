#!/usr/bin/env node
// A régua da marca: `node scripts/marca/conferir.mjs [--raiz <pasta>]`.
//
// Reprova (sai 1) quando:
//   1. uma saída gerada está velha: não bate com o que o gerar.mjs escreveria agora;
//   2. a marca (ou o molde) não fecha o contraste pela regra única (derivar.mjs);
//   3. um molde de superfície escreve cor (hex, rgb) ou curva (cubic-bezier) à
//      mão, fora do token. O valor técnico neutro (o chrome da página de
//      revisão, o semáforo da janela, a paleta neutra declarada) leva o
//      marcador `tecnico` num comentário na mesma linha;
//   4. a marca contradiz a própria recusa (curva que quica com `bounce` recusado,
//      branco puro com `branco-puro` recusado, sombra sem desfoque com
//      `sombra-dura` recusado);
//   5. o arquivo da marca existe e tem o esquema quebrado.
//
// Avisa (sem reprovar) quando:
//   6. um projeto de `projetos-pessoais/` foi gerado na marca do workspace e ficou nas
//      cores ou na forma (raios, pílula, destaque, mono) de antes da troca: o
//      tokens.css é dele, e o aviso traz o comando.
//
// Prova: scripts/marca/teste-conferir.mjs

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, resolve, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { lerMarca, lerMolde, raizPadrao, ARQUIVO } from './marca.mjs'
import { derivarMarca } from './derivar.mjs'
import { conferirSaidas } from './gerar.mjs'
import { marcaDoWorkspace, formaDe } from '../../.claude/skills/novo-projeto/esqueleto/scripts/gerar-marca.mjs'

/**
 * Os moldes das superfícies, onde cor e curva só entram por token. Pasta
 * termina em `/` (os arquivos de texto dela, sem descer); arquivo é exato.
 */
export const SUPERFICIES = [
  '.claude/skills/carrossel/kit/',
  '.claude/skills/novo-projeto/esqueleto/scripts/gerar-marca.mjs',
  '.claude/skills/novo-projeto/esqueleto/templates/tema.projeto.css',
  '.claude/skills/novo-projeto/esqueleto/templates/icone.casa.svg',
  'scripts/guardanapo/tokens.mjs',
  'scripts/guardanapo/desenhar.mjs',
  'scripts/guardanapo/render.mjs',
  // o vídeo: a curva vem do movimento.js e do marca.ts, a cor do tokens.css
  '.claude/skills/video/ferramentas/modelo.html',
  '.claude/skills/video/ferramentas/capa.mjs',
  '.claude/video/src/molde/',
  '.claude/skills/mograph/ferramentas/falado.js',
  '.claude/skills/mograph/ferramentas/falado-extra.mjs'
]

const TEXTO = new Set(['.css', '.html', '.js', '.mjs', '.ts', '.tsx', '.svg'])
const MARCADOR = /(\/\*|\/\/|<!--)\s*tecnico\b/
const VALOR_A_MAO = [
  [/#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?(?:[0-9a-fA-F]{2})?\b(?![\w-])/, 'cor hex'],
  [/\brgba?\(\s*\d/, 'cor rgb'],
  // número (0.2, .2, -0.1), não o espalhamento da curva da marca (Easing.bezier(...MOVIMENTO.curva.principal))
  [/cubic-bezier\(\s*-?\.?\d/, 'curva cubic-bezier'],
  [/Easing\.bezier\(\s*-?\.?\d/, 'curva Easing.bezier']
]

function arquivosDe (raiz, lista) {
  const achados = []
  for (const item of lista) {
    const p = join(raiz, item)
    if (item.endsWith('/')) {
      if (!existsSync(p)) continue
      for (const f of readdirSync(p, { withFileTypes: true })) if (f.isFile() && TEXTO.has(extname(f.name))) achados.push(item + f.name)
    } else if (existsSync(p)) achados.push(item)
  }
  return achados
}

/** As linhas com valor à mão: `[{ arquivo, linha, tipo, trecho }]`. */
export function valoresAMao (raiz, lista = SUPERFICIES) {
  const achados = []
  for (const rel of arquivosDe(raiz, lista)) {
    const linhas = readFileSync(join(raiz, rel), 'utf8').split('\n')
    linhas.forEach((l, i) => {
      if (MARCADOR.test(l)) return
      for (const [re, tipo] of VALOR_A_MAO) {
        const m = re.exec(l)
        if (m) { achados.push({ arquivo: rel, linha: i + 1, tipo, trecho: m[0] }); break }
      }
    })
  }
  return achados
}

/** A marca contra as próprias recusas. */
export function contraRecusas (r) {
  const erros = []
  const recusa = new Set(r.recusas)
  const quica = (c) => c[1] < 0 || c[1] > 1 || c[3] < 0 || c[3] > 1
  for (const [nome, c] of Object.entries(r.movimento.curva)) {
    if (!quica(c)) continue
    if (recusa.has('bounce') || recusa.has('elastic')) erros.push(`movimento.curva.${nome} [${c.join(', ')}] passa do destino e volta, e a marca recusa ${['bounce', 'elastic'].filter((x) => recusa.has(x)).join(' e ')}`)
  }
  if (recusa.has('branco-puro')) {
    for (const papel of ['claro', 'superficie']) if (r.cor.papel[papel] === '#ffffff') erros.push(`cor.papel.${papel} é branco puro, e a marca recusa branco-puro`)
  }
  if (recusa.has('sombra-dura')) {
    for (const nome of ['clara', 'escura']) if (r.sombra[nome].some((s) => s.blur === 0)) erros.push(`sombra.${nome} não tem desfoque, e a marca recusa sombra-dura`)
  }
  return erros
}

/** As pastas onde mora projeto que pode ter nascido na marca do workspace (cliente tem marca própria). */
export const PASTAS_DE_PROJETO = ['projetos-pessoais']
const GERAR_MARCA = '.claude/skills/novo-projeto/esqueleto/scripts/gerar-marca.mjs'
const CABECALHO_DO_PROJETO = /da marca do workspace[^:]*:\s*primária (#[0-9a-f]{6}), fundo (#[0-9a-f]{6}),\s*texto (#[0-9a-f]{6})/i
// O projeto gerado antes da linha da forma não a tem: nele, só as cores se comparam.
const FORMA_DO_PROJETO = /^\s*A forma: (.+)\.$/m

/**
 * Os projetos que nasceram na marca do workspace e ficaram nas cores ou na forma
 * de antes. O `src/styles/tokens.css` é do projeto e não se reescreve calado; as
 * cores de hoje são as que o `marcaDoWorkspace` do gerar-marca daria (a
 * interface derivada), e a forma, a linha que o `formaDe` dele escreveria.
 * `[{ projeto, antes, hoje, forma? }]`, com `projeto` relativo à raiz.
 */
export function projetosVelhos (raiz, hoje, formaDeHoje = null) {
  const velhos = []
  for (const pasta of PASTAS_DE_PROJETO) {
    const p = join(raiz, pasta)
    if (!existsSync(p)) continue
    for (const d of readdirSync(p, { withFileTypes: true })) {
      const arq = join(p, d.name, 'src', 'styles', 'tokens.css')
      if (!d.isDirectory() || !existsSync(arq)) continue
      const cabeca = readFileSync(arq, 'utf8').slice(0, 2000)
      const cab = CABECALHO_DO_PROJETO.exec(cabeca)
      if (!cab) continue
      const antes = { primaria: cab[1], fundo: cab[2], texto: cab[3] }
      const forma = FORMA_DO_PROJETO.exec(cabeca)?.[1]
      const cores = Object.keys(antes).some((k) => antes[k].toLowerCase() !== hoje[k].toLowerCase())
      const daForma = Boolean(formaDeHoje && forma && forma !== formaDeHoje)
      if (cores || daForma) velhos.push({ projeto: `${pasta}/${d.name}`, antes, hoje, cores, ...(daForma ? { forma: { antes: forma, hoje: formaDeHoje } } : {}) })
    }
  }
  return velhos
}

/** A régua inteira, sem imprimir: `{ erros, avisos }`. */
export function conferir ({ raiz = raizPadrao() } = {}) {
  const erros = []
  const avisos = []
  const m = lerMarca({ raiz })
  if (!m.configurada && existsSync(join(raiz, ARQUIVO)) && m.erros) erros.push(`esquema: ${m.motivo}`)
  if (!m.configurada) avisos.push(`a marca não está configurada (${m.motivo}): as saídas estão no estado de demonstração`)

  // 2 · o contraste, da marca e do molde (o molde abre o catálogo e o --demo). Com a marca
  // configurada, o aviso do molde é ruído para quem não mexeu nele: só o erro dele sobe
  const alvos = [['o molde', lerMolde({ raiz }).resolvido]]
  if (m.configurada) alvos.unshift(['a marca', m.resolvido])
  for (const [nome, r] of alvos) {
    const d = derivarMarca(r.cor.papel)
    for (const e of d.erros) erros.push(`contraste (${nome}): ${e}`)
    if (nome === 'o molde' && m.configurada) continue
    for (const a of d.avisos) avisos.push(`contraste (${nome}): ${a}`)
  }

  // 4 · a marca contra as próprias recusas
  if (m.configurada) for (const e of contraRecusas(m.resolvido)) erros.push(`recusa: ${e}`)

  // 6 · o projeto que foi gerado na marca e ficou nas cores de antes: aviso, porque o arquivo é dele
  if (m.configurada) {
    const d = derivarMarca(m.resolvido.cor.papel)
    if (!d.erros.length) {
      let forma = null
      try { forma = formaDe(marcaDoWorkspace({ raiz })) } catch { /* silêncio declarado: a marca que não fecha já reprova no contraste; sem a forma, só as cores se comparam */ }
      for (const v of projetosVelhos(raiz, d.interface, forma)) {
        const ficou = v.cores
          ? `na primária ${v.antes.primaria}, fundo ${v.antes.fundo} e texto ${v.antes.texto} (hoje ${v.hoje.primaria}, ${v.hoje.fundo} e ${v.hoje.texto})`
          : `na forma "${v.forma.antes}" (hoje "${v.forma.hoje}")`
        avisos.push(`o projeto ${v.projeto} foi gerado na marca do workspace e ficou ${ficou}: para levar a troca, node ${GERAR_MARCA} --alvo ${v.projeto} --refazer (o que foi editado à mão no tokens.css dele se perde)`)
      }
    }
  }

  // 1 · a cópia velha
  try {
    for (const v of conferirSaidas({ raiz })) erros.push(`saída velha: ${v.caminho} (${v.motivo}): rode node scripts/marca/gerar.mjs`)
  } catch (e) {
    erros.push(`saída: ${e.message}`)
  }

  // 3 · o valor à mão nos moldes das superfícies
  for (const v of valoresAMao(raiz, SUPERFICIES)) erros.push(`valor à mão: ${v.arquivo}:${v.linha} tem ${v.tipo} (${v.trecho}); use o token da marca, ou marque /* tecnico */ se é neutro de plataforma`)

  return { erros, avisos, configurada: m.configurada }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const i = process.argv.indexOf('--raiz')
  const raiz = i > -1 && process.argv[i + 1] ? resolve(process.argv[i + 1]) : raizPadrao()
  const { erros, avisos, configurada } = conferir({ raiz })
  for (const a of avisos) console.log(`AVISO ${a}`)
  for (const e of erros) console.log(`✗ ${e}`)
  console.log(erros.length ? `RESULTADO: ${erros.length} problema(s) na marca.` : `RESULTADO: a marca está em dia (${configurada ? 'configurada' : 'não configurada'}).`)
  process.exit(erros.length ? 1 : 0)
}

export const AQUI = dirname(fileURLToPath(import.meta.url))
