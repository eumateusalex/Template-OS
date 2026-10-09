// node --test .claude/skills/fabrica/kit/testes/teste-mutar.mjs
//
// Classe de defeito: mutação que não aplicou parecendo teste fraco, e arquivo
// que não voltou: "mutação que não aplicou parece teste fraco" (conferir que o
// arquivo mudou antes de julgar), e tratar qualquer exceção do `execSync` como
// vermelho não distingue "o teste reprovou" de "o runner nem achou o teste".
//
// mutação: kit/mutar.mjs · "if (!r.testes.conhecido || r.testes.rodaram === 0)" → "if (false)" · pega
// mutação: kit/mutar.mjs · "  if (registrar && quebras.some((q) => `${de}${para}`.includes(q))) {" → "  if (false) {" · pega
// mutação: kit/mutar.mjs · "  const quebras = ['\r', '\n', String.fromCharCode(0x2028), String.fromCharCode(0x2029)]" → "  const quebras = ['\r', '\n']" · pega

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { writeFileSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

import { criar, apagar } from '../lib/temporaria.mjs'
import { rodar } from '../lib/runner.mjs'

import { mutar, DESFECHO } from '../mutar.mjs'

// Um "projeto" mínimo: um fonte, e um teste que roda com node --test.
function projeto ({ fonte, teste }) {
  const raiz = criar('fabrica-mutar-')
  writeFileSync(join(raiz, 'fonte.mjs'), fonte)
  writeFileSync(join(raiz, 'teste.mjs'), teste)
  return raiz
}

const FONTE_BOM = 'export function dobro (n) {\n  return n * 2\n}\n'
const TESTE_FORTE = [
  "import { test } from 'node:test'",
  "import assert from 'node:assert/strict'",
  "import { dobro } from './fonte.mjs'",
  "test('dobro', () => { assert.equal(dobro(3), 6) })",
  ''
].join('\n')
const TESTE_FRACO = [
  "import { test } from 'node:test'",
  "import assert from 'node:assert/strict'",
  "import { dobro } from './fonte.mjs'",
  "test('fraco', () => { assert.equal(typeof dobro, 'function') })",
  ''
].join('\n')

const COMANDO = 'node --test teste.mjs'

test('mutação PEGA: o teste fica vermelho e o desfecho é 0', () => {
  const raiz = projeto({ fonte: FONTE_BOM, teste: TESTE_FORTE })
  try {
    const r = mutar({ arquivo: 'fonte.mjs', de: 'n * 2', para: 'n * 3', comando: COMANDO, raiz, conferirGit: false })
    assert.equal(r.codigo, DESFECHO.PEGA)
    assert.equal(r.codigo, 0)
  } finally { apagar(raiz) }
})

test('mutação NÃO pega: o teste continua verde e o desfecho é 1', () => {
  const raiz = projeto({ fonte: FONTE_BOM, teste: TESTE_FRACO })
  try {
    const r = mutar({ arquivo: 'fonte.mjs', de: 'n * 2', para: 'n * 3', comando: COMANDO, raiz, conferirGit: false })
    assert.equal(r.codigo, DESFECHO.PASSOU)
    assert.match(r.mensagem, /não mede/i)
  } finally { apagar(raiz) }
})

test('o arquivo volta byte a byte, mesmo quando a mutação pega', () => {
  const raiz = projeto({ fonte: FONTE_BOM, teste: TESTE_FORTE })
  try {
    mutar({ arquivo: 'fonte.mjs', de: 'n * 2', para: 'n * 3', comando: COMANDO, raiz, conferirGit: false })
    assert.equal(readFileSync(join(raiz, 'fonte.mjs'), 'utf8'), FONTE_BOM)
  } finally { apagar(raiz) }
})

test('o arquivo volta byte a byte mesmo quando o comando estoura', () => {
  const raiz = projeto({ fonte: FONTE_BOM, teste: TESTE_FORTE })
  try {
    mutar({ arquivo: 'fonte.mjs', de: 'n * 2', para: 'n * 3', comando: 'comando-que-nao-existe', raiz, conferirGit: false })
    assert.equal(readFileSync(join(raiz, 'fonte.mjs'), 'utf8'), FONTE_BOM)
  } finally { apagar(raiz) }
})

test('trecho que não existe: desfecho 2, e o arquivo não é tocado', () => {
  const raiz = projeto({ fonte: FONTE_BOM, teste: TESTE_FORTE })
  try {
    const r = mutar({ arquivo: 'fonte.mjs', de: 'n * 99', para: 'n * 3', comando: COMANDO, raiz, conferirGit: false })
    assert.equal(r.codigo, DESFECHO.TRECHO)
    assert.match(r.mensagem, /não (existe|aparece)/i)
    assert.equal(readFileSync(join(raiz, 'fonte.mjs'), 'utf8'), FONTE_BOM)
  } finally { apagar(raiz) }
})

test('trecho que aparece duas vezes: desfecho 2', () => {
  const raiz = projeto({ fonte: 'const a = 1\nconst b = 1\n', teste: TESTE_FORTE })
  try {
    const r = mutar({ arquivo: 'fonte.mjs', de: '= 1', para: '= 2', comando: COMANDO, raiz, conferirGit: false })
    assert.equal(r.codigo, DESFECHO.TRECHO)
    assert.match(r.mensagem, /2 vezes|duas vezes|não é único/i)
  } finally { apagar(raiz) }
})

test('mutação que não muda o arquivo (de igual a para): desfecho 2', () => {
  const raiz = projeto({ fonte: FONTE_BOM, teste: TESTE_FORTE })
  try {
    const r = mutar({ arquivo: 'fonte.mjs', de: 'n * 2', para: 'n * 2', comando: COMANDO, raiz, conferirGit: false })
    assert.equal(r.codigo, DESFECHO.TRECHO)
    assert.match(r.mensagem, /não mudou|igual/i)
  } finally { apagar(raiz) }
})

test('runner que não mediu nada: desfecho 4, NUNCA lido como "pegou"', () => {
  const raiz = projeto({ fonte: FONTE_BOM, teste: TESTE_FORTE })
  try {
    const r = mutar({
      arquivo: 'fonte.mjs', de: 'n * 2', para: 'n * 3',
      comando: 'node -e "console.error(\'faltou o runner\'); process.exit(1)"',
      raiz, conferirGit: false
    })
    assert.equal(r.codigo, DESFECHO.NAO_MEDIU)
    assert.match(r.mensagem, /não (mediu|rodou)/i)
  } finally { apagar(raiz) }
})

test('$ no texto de troca não é interpretado: entra literal', () => {
  const raiz = projeto({ fonte: 'const preco = "10"\n', teste: TESTE_FORTE })
  try {
    mutar({ arquivo: 'fonte.mjs', de: '"10"', para: '"$&$1"', comando: COMANDO, raiz, conferirGit: false, restaurar: false })
    const depois = readFileSync(join(raiz, 'fonte.mjs'), 'utf8')
    assert.ok(depois.includes('"$&$1"'), `o $ tinha que entrar literal, veio: ${depois}`)
  } finally { apagar(raiz) }
})

test('DESFECHO tem os cinco, e são números distintos', () => {
  const valores = Object.values(DESFECHO)
  assert.equal(valores.length, 5)
  assert.equal(new Set(valores).size, 5)
  assert.equal(DESFECHO.PEGA, 0)
})

test('a linha de comando aceita --raiz: muta e registra LÁ, não na pasta de quem chamou', () => {
  // 🚨 Conhecendo só a pasta corrente, o `mutar.mjs` chamado de outra árvore
  // procura o arquivo na árvore principal em vez do worktree da obra, e o mesmo nome de
  // arquivo nas duas árvores seria mutado no lugar errado.
  const raiz = projeto({ fonte: FONTE_BOM, teste: TESTE_FORTE })
  const outro = criar('fabrica-mutar-outro-')
  try {
    const cli = join(dirname(fileURLToPath(import.meta.url)), '..', 'mutar.mjs').split('\\').join('/')
    const r = rodar(
      `node "${cli}" fonte.mjs "n * 2" "n * 3" --comando "node --test teste.mjs" --raiz "${raiz.split('\\').join('/')}" --registrar teste.mjs`,
      { cwd: outro, tempoMaximo: 60000 }
    )
    assert.equal(r.saiu, DESFECHO.PEGA, r.saida)
    assert.match(readFileSync(join(raiz, 'teste.mjs'), 'utf8'), /mutação: fonte\.mjs · "n \* 2" → "n \* 3"/)
    assert.equal(readFileSync(join(raiz, 'fonte.mjs'), 'utf8'), FONTE_BOM, 'o fonte voltou byte a byte')
  } finally { apagar(raiz); apagar(outro) }
})

test('--registrar recusa também o separador de linha do JavaScript (U+2028 e U+2029)', () => {
  // Em JS esses dois também encerram um comentário `//`, e o texto depois
  // deles executaria.
  const raiz = projeto({ fonte: FONTE_BOM, teste: TESTE_FORTE })
  try {
    const cli = join(dirname(fileURLToPath(import.meta.url)), '..', 'mutar.mjs')
    for (const separador of [String.fromCharCode(0x2028), String.fromCharCode(0x2029)]) {
      const r = spawnSync('node', [cli, 'fonte.mjs', `n * 2${separador}`, 'n * 3', '--comando', 'node --test teste.mjs', '--raiz', raiz, '--registrar', 'teste.mjs'], { encoding: 'utf8' })
      assert.equal(r.status, DESFECHO.TRECHO, `${r.stdout}${r.stderr}`)
      // ⚠️ A razão importa: sem ela, "o trecho não existe" também sairia 2, e o
      // teste passaria sem a guarda (medido pelo vermelho.mjs).
      assert.match(`${r.stdout}${r.stderr}`, /uma linha/)
      assert.equal(readFileSync(join(raiz, 'teste.mjs'), 'utf8'), TESTE_FORTE, 'o teste foi tocado')
    }
  } finally { apagar(raiz) }
})

test('--registrar com trecho de DUAS linhas é recusado antes de mutar, e nada é tocado', () => {
  // O registro de um trecho com quebra de linha escreveria a segunda linha no
  // cabeçalho SEM o `//`, e o teste deixaria de compilar. O conferidor `mutacoes`
  // também lê o registro linha a linha, então ele nem seria lido.
  const raiz = projeto({ fonte: FONTE_BOM, teste: TESTE_FORTE })
  try {
    const cli = join(dirname(fileURLToPath(import.meta.url)), '..', 'mutar.mjs')
    // Sem shell: a quebra de linha chega inteira no argumento.
    const r = spawnSync('node', [cli, 'fonte.mjs', '  return n * 2\n}', '  return n * 3\n}', '--comando', 'node --test teste.mjs', '--raiz', raiz, '--registrar', 'teste.mjs'], { encoding: 'utf8' })
    assert.equal(r.status, DESFECHO.TRECHO, `${r.stdout}${r.stderr}`)
    assert.match(`${r.stdout}${r.stderr}`, /uma linha/)
    assert.equal(readFileSync(join(raiz, 'teste.mjs'), 'utf8'), TESTE_FORTE, 'o teste foi tocado')
    assert.equal(readFileSync(join(raiz, 'fonte.mjs'), 'utf8'), FONTE_BOM, 'o fonte foi tocado')
  } finally { apagar(raiz) }
})
