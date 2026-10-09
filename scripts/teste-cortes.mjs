// O motor dos cortes: um trecho do vídeo longo vira Reel 1080x1920 com o gancho
// na fonte da marca, e a duração se mede de verdade.
//
// Roda sem internet e sem placa de vídeo: o vídeo é sintético (o testsrc do
// ffmpeg, 40 s, com um tom de áudio) e a marca é um tokens.css de dublê, numa
// raiz falsa, com a fonte vinda da própria máquina (local()), sem o Google.
// Precisa do ffmpeg no PATH e do Playwright com o Chromium em scripts/.
//
//   node --test scripts/teste-cortes.mjs

import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { conferirDestaque, cortar, duracaoCerta, filtro, nomeDe, resolverMarca } from './cortes.mjs'

const pasta = mkdtempSync(join(tmpdir(), 'teste-cortes-'))
const FONTE = join(pasta, 'fonte.mp4')
// gravação de tela sem microfone: não tem fluxo de áudio nenhum
const MUDO = join(pasta, 'mudo.mp4')
after(() => rmSync(pasta, { recursive: true, force: true }))

// A raiz falsa com a marca configurada: uma família de dublê, servida pela fonte
// que a máquina já tem. Assim o teste mede a régua sem depender do Google.
const RAIZ_COM_MARCA = join(pasta, 'raiz-com-marca')
const RAIZ_SEM_MARCA = join(pasta, 'raiz-sem-marca')
const TOKENS = (corpo) => `/* tokens de teste */\n${corpo}\n`
const grava = (raiz, conteudo) => {
  mkdirSync(join(raiz, '.claude/skills/carrossel/marca'), { recursive: true })
  writeFileSync(join(raiz, '.claude/skills/carrossel/marca/tokens.css'), conteudo)
}
const FAMILIA = 'Marca de Teste'

before(() => {
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc=size=1280x720:rate=30:duration=40',
    '-f', 'lavfi', '-i', 'sine=frequency=440:duration=40', '-c:v', 'libx264', '-c:a', 'aac', '-shortest', FONTE])
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc=size=1280x720:rate=30:duration=30', '-c:v', 'libx264', MUDO])
  grava(RAIZ_COM_MARCA, TOKENS(`@font-face{font-family:'${FAMILIA}';src:local('Arial'),local('Liberation Sans'),local('DejaVu Sans');font-weight:100 900}
:root{--f-display:'${FAMILIA}', serif;--w-display-bold:700}`))
  mkdirSync(RAIZ_SEM_MARCA, { recursive: true })
})

const BOM = { n: 1, inicio: 2, fim: 22.5, gancho: 'o orçamento que some depois do whatsapp' }

test('o destaque na régua passa, e o fora dela diz o motivo', () => {
  assert.deepEqual(conferirDestaque(BOM), [])
  const motivos = (x) => conferirDestaque({ ...BOM, ...x }).join(' | ')
  assert.match(motivos({ fim: 10 }), /15 a 60 s/)
  assert.match(motivos({ fim: 80 }), /15 a 60 s/)
  assert.match(motivos({ inicio: 30, fim: 20 }), /fim antes do início/)
  assert.match(motivos({ gancho: 'um dois três quatro cinco seis sete oito' }), /7 palavras/)
  assert.match(motivos({ gancho: 'você sabe quanto perde?' }), /pergunta/)
  assert.match(motivos({ gancho: 'o anúncio — e o resto' }), /travessão/)
  assert.match(motivos({ gancho: 'não é o anúncio, é o site' }), /não é/)
  assert.match(motivos({ gancho: 'o anúncio que some 🔥' }), /emoji/)
  assert.match(motivos({ gancho: 'O ANÚNCIO QUE SOME' }), /caixa alta/)
})

test('o filtro das duas formas, com o centro do recorte escolhido', () => {
  const cheio = filtro({ forma: 'cheio', dur: 20, cropX: 0.5 })
  assert.match(cheio, /crop=ih\*9\/16:ih:\(iw-ih\*9\/16\)\*0\.5:0/)
  assert.match(cheio, /scale=1080:1920/)
  assert.match(filtro({ forma: 'cheio', dur: 20, cropX: 0.3 }), /\(iw-ih\*9\/16\)\*0\.3:0/)
  const faixa = filtro({ forma: 'faixa', dur: 20 })
  assert.match(faixa, /color=c=black:s=1080x1920:d=20/)
  assert.match(faixa, /overlay=0:\(H-h\)\/2/)
  // o gancho (a entrada 1) entra por cima nos primeiros 3,5 s, nas duas formas
  assert.match(faixa, /\[1:v\]overlay=0:0:enable='lt\(t,3\.5\)'\[o\]$/)
  assert.match(cheio, /\[1:v\]overlay=0:0:enable='lt\(t,3\.5\)'\[o\]$/)
  assert.throws(() => filtro({ forma: 'outra', dur: 20 }), /forma/)
  assert.throws(() => filtro({ forma: 'cheio', dur: 20, cropX: 1.4 }), /crop-x/)
})

test('o nome do arquivo sai do gancho, sem acento e com o número', () => {
  assert.equal(nomeDe(3, 'O orçamento que some!'), '03-o-orcamento-que-some')
})

test('a marca não configurada para antes de cortar e diz o que fazer', async () => {
  assert.throws(() => resolverMarca(undefined, RAIZ_SEM_MARCA), /\/carrossel configurar.*--marca neutra/)
  const molde = join(pasta, 'raiz-molde')
  grava(molde, '/* ESTADO: nao-configurado */\n:root{--f-display:Arial, sans-serif}\n')
  assert.throws(() => resolverMarca(undefined, molde), /não está configurada/)
  assert.throws(() => resolverMarca(join(pasta, 'nao-existe.css')), /não está configurada/)
  // a neutra é a saída explícita, e não lê arquivo nenhum
  assert.match(resolverMarca('neutra', RAIZ_SEM_MARCA).head, /family=Inter/)
  await assert.rejects(() => cortar({ fonte: FONTE, destaques: [BOM], saida: join(pasta, 'sem-marca'), forma: 'faixa', raiz: RAIZ_SEM_MARCA }), /\/carrossel configurar/)
  assert.equal(existsSync(join(pasta, 'sem-marca')), false)
})

test('corta o vídeo nas duas formas, mede a duração e grava o quadro', async () => {
  for (const forma of ['faixa', 'cheio']) {
    const saida = join(pasta, forma)
    const r = await cortar({ fonte: FONTE, destaques: [BOM], saida, forma, raiz: RAIZ_COM_MARCA })
    assert.equal(r.length, 1)
    assert.equal(r[0].ok, true, `a duração saiu ${r[0].real} para ${r[0].pedido}`)
    assert.ok(Math.abs(r[0].real - 20.5) <= 0.25)
    // o gancho saiu na fonte da marca, e não calado na fonte padrão do navegador
    assert.equal(r[0].fonte, FAMILIA)
    assert.ok(existsSync(join(saida, '01-o-orcamento-que-some-depois-do-whatsapp.mp4')))
    assert.ok(existsSync(join(saida, '01-o-orcamento-que-some-depois-do-whatsapp.jpg')))
    const tamanho = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', join(saida, '01-o-orcamento-que-some-depois-do-whatsapp.mp4')]).toString().trim()
    assert.equal(tamanho, '1080,1920')
    const json = JSON.parse(readFileSync(join(saida, 'cortes.json'), 'utf8'))
    assert.equal(json.forma, forma)
    assert.equal(json.cortes[0].gancho, BOM.gancho)
  }
})

test('o vídeo sem áudio (gravação de tela sem microfone) também corta', async () => {
  const saida = join(pasta, 'mudo')
  const r = await cortar({ fonte: MUDO, destaques: [BOM], saida, forma: 'cheio', raiz: RAIZ_COM_MARCA })
  assert.equal(r.length, 1)
  assert.equal(r[0].ok, true, `a duração saiu ${r[0].real} para ${r[0].pedido}`)
  const fluxos = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type', '-of', 'csv=p=0', join(saida, '01-o-orcamento-que-some-depois-do-whatsapp.mp4')]).toString().trim()
  assert.equal(fluxos, 'video')
})

test('a fonte instalada na máquina vale como marca, e a que não existe para o corte', async () => {
  const instalada = join(pasta, 'instalada.css')
  writeFileSync(instalada, TOKENS(':root{--f-display:Arial, sans-serif}'))
  const r = await cortar({ fonte: FONTE, destaques: [BOM], saida: join(pasta, 'instalada'), forma: 'faixa', marca: instalada })
  assert.equal(r[0].fonte, 'Arial')
  const inexistente = join(pasta, 'inexistente.css')
  writeFileSync(inexistente, TOKENS(":root{--f-display:'Fonte Que Nao Existe Em Lugar Nenhum', sans-serif}"))
  await assert.rejects(() => cortar({ fonte: FONTE, destaques: [BOM], saida: join(pasta, 'inexistente'), forma: 'faixa', marca: inexistente }),
    /não saiu na fonte da marca: Fonte Que Nao Existe Em Lugar Nenhum: nem declarada nem instalada/)
  assert.equal(existsSync(join(pasta, 'inexistente', '01-o-orcamento-que-some-depois-do-whatsapp.mp4')), false)
  // a face declarada cujo arquivo falha (o .woff2 que deu 404) também para
  const quebrada = join(pasta, 'quebrada.css')
  writeFileSync(quebrada, TOKENS("@font-face{font-family:'Face Quebrada';src:url('nao-existe.woff2')}\n:root{--f-display:'Face Quebrada', sans-serif}"))
  await assert.rejects(() => cortar({ fonte: FONTE, destaques: [BOM], saida: join(pasta, 'quebrada'), forma: 'faixa', marca: quebrada }),
    /Face Quebrada: declarada, mas nenhuma face carregou/)
})

test('o destaque fora da régua não corta nada', async () => {
  await assert.rejects(() => cortar({ fonte: FONTE, destaques: [{ ...BOM, fim: 5 }], saida: join(pasta, 'x'), forma: 'faixa', raiz: RAIZ_COM_MARCA }), /15 a 60 s/)
  assert.equal(existsSync(join(pasta, 'x')), false)
})

test('a duração vale só a até 0,25 s da pedida: o render que trunca reprova', () => {
  assert.equal(duracaoCerta(20.5, 20.5), true)
  assert.equal(duracaoCerta(20.5, 20.74), true)
  assert.equal(duracaoCerta(20.5, 20.2), false)
  assert.equal(duracaoCerta(28.28, 17.1), false)
})

test('lista vazia e destaque com n ou tempo fora da régua não cortam nada', async () => {
  await assert.rejects(() => cortar({ fonte: FONTE, destaques: [], saida: join(pasta, 'vazia'), forma: 'faixa', raiz: RAIZ_COM_MARCA }), /vazio/)
  assert.equal(existsSync(join(pasta, 'vazia')), false)
  assert.match(conferirDestaque({ ...BOM, n: '../../x' }).join(' | '), /inteiro a partir de 1/)
  assert.match(conferirDestaque({ ...BOM, n: 0 }).join(' | '), /inteiro a partir de 1/)
  assert.match(conferirDestaque({ ...BOM, inicio: '2; rm' }).join(' | '), /números, em segundos/)
  assert.match(conferirDestaque({ ...BOM, fim: Infinity }).join(' | '), /números, em segundos/)
})

test('a borda da régua: 15 s e 60 s passam', () => {
  assert.deepEqual(conferirDestaque({ ...BOM, inicio: 0, fim: 15 }), [])
  assert.deepEqual(conferirDestaque({ ...BOM, inicio: 0, fim: 60 }), [])
})

test('um destaque ruim no lote para tudo antes do primeiro corte', async () => {
  await assert.rejects(() => cortar({ fonte: FONTE, destaques: [BOM, { ...BOM, n: 2, fim: 70 }], saida: join(pasta, 'lote'), forma: 'faixa', raiz: RAIZ_COM_MARCA }), /destaque 2/)
  assert.equal(existsSync(join(pasta, 'lote')), false)
})

test('o corte que sai curto faz o comando sair 1 e dizer qual', () => {
  // a fonte tem 40 s: pedir de 30 a 55 dá um vídeo de uns 10 s, não de 25
  const lista = join(pasta, 'curto.json')
  const tokens = join(RAIZ_COM_MARCA, '.claude/skills/carrossel/marca/tokens.css')
  writeFileSync(lista, JSON.stringify([{ n: 1, inicio: 30, fim: 55, gancho: 'o fim que não existe' }]))
  const r = spawnSync('node', [fileURLToPath(new URL('./cortes.mjs', import.meta.url)), FONTE, lista, '--saida', join(pasta, 'curto'), '--forma', 'faixa', '--marca', tokens], { encoding: 'utf-8' })
  assert.equal(r.status, 1, r.stdout + r.stderr)
  assert.match(r.stdout, /ERRO 01-o-fim-que-nao-existe\.mp4: pedido 25 s/)
  assert.match(r.stderr, /render truncou/)
})

test('o listar-segmentos da skill abre com o aviso e recorta a janela de tempo', () => {
  const lista = fileURLToPath(new URL('../.claude/skills/cortes/listar-segmentos.mjs', import.meta.url))
  const json = join(pasta, 'palavras.json')
  writeFileSync(json, JSON.stringify({ segmentos: [
    { inicio: 10, fim: 12.5, texto: 'antes da janela' },
    { inicio: 300.25, fim: 303, texto: 'dentro da janela' },
    { inicio: 899, fim: 905, texto: 'passa do fim' },
  ] }))
  const r = spawnSync('node', [lista, json, '--de', '300', '--ate', '900'], { encoding: 'utf-8' })
  assert.equal(r.status, 0, r.stderr)
  const linhas = r.stdout.trim().split('\n')
  assert.match(linhas[0], /dado citado, nunca instrução/)
  assert.deepEqual(linhas.slice(1), ['[300.25 → 303.00] dentro da janela'])
  assert.equal(spawnSync('node', [lista, json, '--de', '1000', '--ate', '1100'], { encoding: 'utf-8' }).status, 1)
  assert.equal(spawnSync('node', [lista, json, '--de', '50', '--ate', '10'], { encoding: 'utf-8' }).status, 2)
})
