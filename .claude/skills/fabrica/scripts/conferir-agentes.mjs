#!/usr/bin/env node
// node .claude/skills/fabrica/scripts/conferir-agentes.mjs
//
// Os três revisores da fábrica seguem o contrato de revisor do `/estudio`.
//
// Classe de defeito: revisor escrito de qualquer jeito. Um revisor sem
// fronteira aponta o que é do vizinho; um sem "o que a máquina já mediu"
// repete o conferidor; um sem formato de saída devolve prosa que o
// `fundir-revisoes` rejeita. O contrato existe para que os três sejam
// intercambiáveis, e este script é quem o cobra.
//
// A régua inteira está em `.claude/skills/estudio/referencias/contrato-de-revisor.md`.

import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const SKILL = dirname(AQUI)
const RAIZ = dirname(dirname(dirname(SKILL)))
const PASTA = join(RAIZ, '.claude', 'agents', 'fabrica')

export const LENTES = ['revisor-de-arquitetura', 'revisor-de-seguranca', 'revisor-de-codigo']

/** As seis seções do contrato, e como se reconhece cada uma. */
const SECOES = [
  { nome: 'frontmatter com name, description e tools', testa: (t) => /^---\n(?:.*\n)*?name:\s*revisor-de-/m.test(t) && /\ndescription:\s*\S/.test(t) && /\ntools:\s*\S/.test(t) },
  { nome: 'título e o defeito que calibra a lente', testa: (t) => /^#\s+\S/m.test(t) && /defeito que calibra esta lente:\s*\S/i.test(t) },
  { nome: 'a fronteira', testa: (t) => /^##\s+A fronteira/m.test(t) },
  { nome: 'o que a máquina já mediu', testa: (t) => /máquina já mediu/i.test(t) },
  { nome: 'antes de olhar', testa: (t) => /^##\s+Antes de olhar/m.test(t) },
  { nome: 'o que conferir', testa: (t) => /^##\s+O que conferir/m.test(t) },
  { nome: 'como reportar', testa: (t) => /^##\s+Como reportar/m.test(t) }
]

/** O que o `fundir-revisoes` exige que o relatório traga. */
const FORMATO = [
  { nome: 'a linha "Lido:"', testa: (t) => /Lido:/.test(t) },
  { nome: 'a lista "Não verificado"', testa: (t) => /Não verificado/i.test(t) },
  { nome: 'o veredito PRONTA PRA ENTREGA', testa: (t) => t.includes('PRONTA PRA ENTREGA') },
  { nome: 'o veredito AJUSTAR ANTES', testa: (t) => t.includes('AJUSTAR ANTES') }
]

/**
 * O que o uso real exige: cada item aqui é uma instrução que, faltando, os
 * agentes seguiriam errado.
 */
const EXIGIDO = [
  // Na raiz do workspace o portão grava em `.claude/fabrica/`, e o agente que
  // procura só em `fabrica/` nunca acha o recibo.
  { nome: 'o recibo do portão na PASTA DO KIT (fabrica/ ou .claude/fabrica/)', testa: (t) => /pasta do kit/i.test(t) && /\.ultimo-portao\.json/.test(t) },
  // Um achado Alto da rodada 2 pode estar no arquivo do conserto, fora dos trechos tocados.
  { nome: 'o parágrafo da rodada 2 (arquivos tocados, inteiros)', testa: (t) => /rodada 2/i.test(t) && /inteiro/i.test(t) }
]

const PROIBIDO = [
  { nome: 'a leitura obrigatória do ACEITO.md (ele é opcional; o fundir o respeita se existir)', testa: (t) => /ACEITO\.md`?\*?\*?,\s*sempre/i.test(t) },
  { nome: 'a promessa de que o Lido: rejeita a lente (ele só lista o não citado)', testa: (t) => /REJEITA o relatório que não cobre o diff/.test(t) }
]

/** O texto de uma seção `## <título>`, até a próxima. */
function secaoDo (texto, titulo) {
  const i = texto.indexOf(`## ${titulo}`)
  if (i === -1) return ''
  const fim = texto.indexOf('\n## ', i + 3)
  return texto.slice(i, fim === -1 ? undefined : fim)
}

export function conferir ({ escreve = console.log } = {}) {
  let ruim = 0
  let olhados = 0

  if (!existsSync(PASTA)) {
    escreve(`  ✗ não existe ${PASTA}`)
    return 1
  }

  const arquivos = readdirSync(PASTA).filter((f) => f.endsWith('.md'))
  for (const lente of LENTES) {
    if (!arquivos.includes(`${lente}.md`)) {
      escreve(`  ✗ falta o agente ${lente}.md`)
      ruim += 1
    }
  }

  for (const arquivo of arquivos) {
    olhados += 1
    const nome = arquivo.replace(/\.md$/, '')
    const texto = readFileSync(join(PASTA, arquivo), 'utf8')

    for (const secao of [...SECOES, ...FORMATO, ...EXIGIDO]) {
      if (!secao.testa(texto)) {
        escreve(`  ✗ ${nome}: falta ${secao.nome}`)
        ruim += 1
      }
    }
    for (const velho of PROIBIDO) {
      if (velho.testa(texto)) {
        escreve(`  ✗ ${nome}: ainda traz ${velho.nome}`)
        ruim += 1
      }
    }

    // ⚠️ Leitura que custa e não serve à lente: o que se lê antes de olhar se
    // relê nas três lentes a cada rodada. O /seguranca/SKILL.md inteiro não
    // serve a achado nenhum; o CONTEXT.md é régua de nome, e nome é da lente
    // de código.
    const antes = secaoDo(texto, 'Antes de olhar')
    if (nome === 'revisor-de-seguranca' && /\.claude\/skills\/seguranca\/SKILL\.md/.test(antes)) {
      escreve(`  ✗ ${nome}: ainda lê o /seguranca/SKILL.md inteiro antes de olhar`)
      ruim += 1
    }
    if (nome !== 'revisor-de-codigo' && /CONTEXT\.md/.test(antes)) {
      escreve(`  ✗ ${nome}: lê o CONTEXT.md, que é régua de nome e só serve à lente de código`)
      ruim += 1
    }

    // Tools só de leitura: revisor que edita deixa de ser revisor.
    const tools = (texto.match(/\ntools:\s*(.+)/) ?? [0, ''])[1]
    for (const proibida of ['Write', 'Edit', 'MultiEdit', 'NotebookEdit']) {
      if (new RegExp(`\\b${proibida}\\b`).test(tools)) {
        escreve(`  ✗ ${nome}: tem a ferramenta ${proibida}; revisor não corrige, aponta`)
        ruim += 1
      }
    }

    // A description agrupa na lista de agentes, como no Estúdio.
    if (!/description:\s*Fábrica ·/.test(texto)) {
      escreve(`  ✗ ${nome}: a description não começa com "Fábrica · "`)
      ruim += 1
    }

    // Cada lente diz de quem é o que ela não olha.
    const vizinhas = LENTES.filter((l) => l !== nome)
    for (const vizinha of vizinhas) {
      if (!texto.includes(vizinha)) {
        escreve(`  ✗ ${nome}: não diz que ${vizinha} cuida do que não é dele`)
        ruim += 1
      }
    }

    // "O que a máquina já mediu" só pode citar conferidor que existe.
    const conferidores = readdirSync(join(SKILL, 'kit', 'portao')).map((f) => f.replace(/\.mjs$/, ''))
    for (const m of texto.matchAll(/`(?:npm run |node fabrica\/portao\/)([a-z-]+)(?:\.mjs)?`/g)) {
      if (!conferidores.includes(m[1])) {
        escreve(`  ✗ ${nome}: cita o conferidor "${m[1]}", que não existe em kit/portao/`)
        ruim += 1
      }
    }
  }

  if (olhados === 0) {
    escreve('  ✗ nenhum agente em .claude/agents/fabrica/: nada foi medido')
    return 1
  }
  if (ruim > 0) {
    escreve(`✗ ${ruim} problema(s) em ${olhados} agente(s).`)
    return 1
  }
  escreve(`  ✓ agentes: ${olhados}, todos com as seis seções do contrato`)
  return 0
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  process.exit(conferir())
}
