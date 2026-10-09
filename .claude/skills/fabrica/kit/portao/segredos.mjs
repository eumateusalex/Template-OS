#!/usr/bin/env node
// node fabrica/portao/segredos.mjs [--raiz <dir>] [--historico]
//
// Classe de defeito: segredo real em arquivo que o git carrega. Constituição
// IX. Chave commitada é chave vazada, e o histórico não esquece.
//
// 🚨 Três camadas, e cada uma existe porque a anterior sozinha deixa passar:
//   1. FORMATO reconhecível (`sk-`, `sk_live_`, `ghp_`, `AKIA`, chave privada):
//      em TODO arquivo rastreado que não seja binário, qualquer extensão,
//      qualquer tamanho de linha. Um `server.key` ou um `app.min.js` passariam.
//   2. NOME de segredo com VALOR de cara aleatória: no código (com aspas), no
//      JSON (nome entre aspas), em arquivo de configuração (sem aspas), no
//      valor alternativo de variável de ambiente, e na senha dentro de URL.
//   3. O HISTÓRICO: os formatos da camada 1 nas linhas que algum commit
//      ACRESCENTOU. Chave commitada e apagada no commit seguinte continua
//      vazada (SEC-03 da régua do `/seguranca`). ⚠️ Só com `--historico`: num
//      repositório grande ela custa quase todo o tempo do conferidor (dezenas
//      de MB de `git log -p` e centenas de blobs), e no CI quem varre o histórico é o
//      gitleaks, com `fetch-depth: 0`. O passo `segredos-historico` do
//      `stack.mjs` a roda onde houver `CI` no ambiente.
//   As MENSAGENS de commit e de tag são varridas sempre: o gitleaks não as lê.
// Cada forma se mede plantada contra a régua de
// `.claude/skills/seguranca/referencias/stacks.md`.
//
// 🚨 Ele varre o arquivo INTEIRO, comentário incluído. Chave dentro de `//`
// vaza igual: o git não lê comentário, lê bytes.
//
// 🚨 Sem git, ele REPROVA com "não medido": ausência de medida não é evidência
// de conformidade.
//
// Prova: provas/segredos.mjs

import { join } from 'node:path'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

import { Relatorio } from '../lib/saida.mjs'
import { linhasDe } from '../lib/arquivos.mjs'
import { isento } from '../lib/isencao.mjs'
import { rodar } from '../lib/runner.mjs'
import { comoComando } from '../lib/conferidor.mjs'

const MARCA = 'segredo de exemplo'

/** Formatos que se reconhecem de longe, e que nunca são placeholder. */
export const FORMATOS = [
  { nome: 'chave da OpenAI', re: /\bsk-[A-Za-z0-9_-]{20,}/ },
  { nome: 'chave de pagamento', re: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}/ },
  { nome: 'segredo de webhook', re: /\bwhsec_[A-Za-z0-9]{16,}/ },
  { nome: 'token do GitHub', re: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}/ },
  { nome: 'token do GitHub (novo)', re: /\bgithub_pat_[A-Za-z0-9_]{50,}/ },
  { nome: 'chave da AWS', re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { nome: 'token do Slack', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}/ },
  { nome: 'chave do Google', re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { nome: 'token do npm', re: /\bnpm_[A-Za-z0-9]{36}\b/ },
  // ⚠️ `( BLOCK)?`: a chave privada PGP é `PRIVATE KEY BLOCK`.
  // ⚠️ E `-{4,5} ?` com dígito no tipo: a SSH2 (RFC 4716) abre com QUATRO
  // traços e um espaço, e o tipo tem dígito (`SSH2 ENCRYPTED`).
  // (O cabeçalho não se escreve inteiro aqui: o próprio conferidor o acusa.)
  { nome: 'chave privada', re: /-{4,5} ?BEGIN [A-Z0-9 ]*PRIVATE KEY( BLOCK)? ?-{4,5}/ }
]

/**
 * O nome é de segredo? Ele se parte em PALAVRAS (`OPENAI_API_KEY`,
 * `clientSecret`, `db.password`) e cada palavra se compara inteira.
 *
 * 🚨 Por palavra, e não por pedaço de texto: com `\b` o `_` cola as palavras e
 * `DB_PASSWORD` passa; sem `\b`, `tokenizerModel` vira segredo por conter
 * "token".
 * ⚠️ `key` e `chave` só contam ACOMPANHADAS e fora dos nomes neutros: sozinhas,
 * ou em `CACHE_KEY` e `STORAGE_KEY`, elas são nome de chave de armazenamento.
 * Sem isso, `CHAVE = 'moodboard-fulana-2026-09'` acusaria.
 */
const PALAVRAS_DE_SEGREDO = new Set([
  'secret', 'secrets', 'token', 'senha', 'password', 'passwd', 'pwd', 'credential',
  'credentials', 'credencial', 'credenciais', 'segredo', 'auth', 'authorization', 'apikey', 'bearer'
])
/** Palavra que carrega o termo colado nela (`dbpassword`, `clientsecret`). */
const TERMOS_COLADOS = /password|passwd|secret|senha|segredo|credencial|credential/
const CHAVES = new Set(['key', 'chave'])
const NEUTRAS = new Set([
  'cache', 'storage', 'sort', 'primary', 'foreign', 'public', 'map', 'idempotency', 'partition',
  'row', 'react', 'hash', 'lookup', 'local', 'session', 'i18n', 'translation', 'traducao', 'armazenamento'
])

/** A última palavra que faz do nome uma REFERÊNCIA ao segredo. */
const REFERENCIAS = new Set([
  'id', 'ids', 'name', 'nome', 'arn', 'url', 'uri', 'file', 'arquivo', 'path', 'caminho',
  'ttl', 'expiry', 'expires', 'expira', 'validade', 'region', 'regiao', 'type', 'tipo'
])

export function nomeDeSegredo (nome) {
  // ⚠️ Num caminho de propriedade, só o ÚLTIMO pedaço é o nome: `db.password`
  // é senha, `payload._data.key.remoteJid` é um identificador.
  const palavras = nome.split('.').pop().replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  // ⚠️ O nome que APONTA para o segredo guarda uma referência, não o segredo:
  // `secret-id`, `TOKEN_URL`, `PASSWORD_FILE`, `SECRET_ARN`, `TOKEN_TTL`.
  if (REFERENCIAS.has(palavras.at(-1))) return false
  if (palavras.some((p) => PALAVRAS_DE_SEGREDO.has(p) || TERMOS_COLADOS.test(p))) return true
  if (!palavras.some((p) => CHAVES.has(p))) return false
  return palavras.length > 1 && !palavras.some((p) => NEUTRAS.has(p))
}

/**
 * O que é claramente um lugar reservado, e não um valor.
 *
 * 🚨 Só quando o valor INTEIRO é reservado: a palavra reservada, e depois dela
 * um resto SEM DÍGITO; ou o valor todo de `x`, de ponto, ou um marcador
 * fechado. Senão, chave real passa como exemplo: `Myst3ry...` (olhando só o
 * começo), e `Test-2024-Prod!Kx9Q` (pelo separador).
 */
const PLACEHOLDER = /^(<[^>]*>|\{\{[^}]*\}\}|\$\{[^}]*\}|x+|\.+)$|^(todo|fixme|your|my|seu|sua|cole|troque|change|example|exemplo|placeholder|fake|dummy|sample|test|teste|abc123|123456)([-_ .:][^0-9]*)?$/i

/**
 * Arquivo de configuração: nele o valor pode vir SEM aspas.
 * ⚠️ Só nele: em código, valor sem aspas é variável, e ler ali seria falso
 * positivo em todo `TOKEN = settings.TOKEN_V2`.
 */
/**
 * O `Dockerfile` e o `Containerfile` não têm extensão (e aceitam sufixo, como
 * `Dockerfile.prod`), e há o `*.dockerfile`: sem isto, não seriam lidos.
 */
const DOCKER = /(^|\/)(Dockerfile|Containerfile)([._-][\w.-]+)?$|\.(dockerfile|containerfile)$/i

const CONFIGURACAO = new RegExp(`(^|\\/)\\.env[^/]*$|(^|\\/)\\.npmrc$|\\.(ini|cfg|conf|properties|ya?ml|sh|bash|bat|cmd)$|${DOCKER.source}`, 'i')

/**
 * Arquivo que se lê procurando `nome = valor`. Formato se procura em todos.
 * ⚠️ O PowerShell (`.ps1`, `.psm1`) entra aqui e NÃO na configuração: lá o valor
 * sem aspas é variável (`$token = $env:X`), e o `$env:X = "…"` cai na leitura
 * com aspas.
 */
const EXTENSOES_TEXTO = new RegExp(`\\.(ts|tsx|js|jsx|mjs|cjs|py|json|ya?ml|toml|env|ini|cfg|conf|properties|sh|bash|ps1|psm1|bat|cmd|md|txt|html|xml|sql|rb|go|java|php)$|(^|\\/)\\.(env|npmrc)|${DOCKER.source}`, 'i')

/**
 * A forma antiga do `ENV` do Dockerfile, com espaço no lugar do `=`, com o
 * valor entre aspas ou cru (o `=` do base64 incluído) e a barra de continuação.
 * ⚠️ Só o `ENV`: `ARG A B` declara dois argumentos sem valor, e lido assim
 * vira falso positivo. E lida em todo arquivo de texto, porque a linha que
 * começa com `ENV ` fora de um Dockerfile também é o mesmo vazamento.
 */
const ENV_DO_DOCKER = /^\s*ENV\s+([A-Za-z_][\w.-]*)\s+["'`]?([^\s"'`]{8,})["'`]?\s*[`\\]?\s*$/i

/**
 * O `setx` do Windows, que grava a variável de vez e separa nome e valor por
 * espaço. Em qualquer ponto da linha (depois de `@`, `if`, `&`, `call`,
 * `cmd /c`), como o `set`, que a leitura da linha de comando já pega assim.
 */
const SETX = /(?:^|[\s&|(@])setx\s+(?:\/[A-Za-z]+\s+)*([A-Za-z_][\w.-]*)\s+["']?([^\s"'&|)]{8,})["']?/gi

/**
 * As formas de `nome` e `valor` numa linha. Cada uma devolve [nome, valor].
 * 🚨 O nome pode vir entre aspas: `"password": "…"` no JSON escaparia.
 * ⚠️ Globais, porque a linha se percorre INTEIRA (`matchAll`); o `SEM_ASPAS`
 * pega a linha toda e casa uma vez só.
 */
const COM_ASPAS = /(["'`]?)([A-Za-z_][A-Za-z0-9_.-]*)\1\s*[:=]\s*["'`]([^"'`\n]{8,})["'`]/g
const SEM_ASPAS = /^\s*(?:-\s+)?(?:export\s+)?["']?([A-Za-z_][A-Za-z0-9_.-]*)["']?\s*[:=]\s*([^\s"'`#]{8,})\s*(?:#.*)?$/
const ALTERNATIVO = [
  /(?:environ\.get|getenv)\(\s*["']([A-Za-z0-9_]+)["']\s*,\s*["'`]([^"'`]{8,})["'`]/g,
  /process\.env\.([A-Za-z0-9_]+)\s*(?:\|\||\?\?)\s*["'`]([^"'`]{8,})["'`]/g,
  /\$\{([A-Za-z0-9_]+):?-([^}\s]{8,})\}/g
]
const SENHA_EM_URL = /[a-z][a-z0-9+.-]*:\/\/[^\s:@/"'`]+:([^\s@/"'`]{6,})@/gi

/**
 * 🚨 Os dois jeitos de o segundo par escapar:
 * - na configuração, o mapa e a lista EM LINHA (`db: {user: app, password: …}`,
 *   `environment: [DB_PASSWORD=…]`): o `SEM_ASPAS` pega a linha inteira e só
 *   vê um par. `EM_LINHA` lê o par depois de `{`, `[` ou `,`
 * - o par DENTRO de uma string (`"start": "DB_PASSWORD=… node"`): o `matchAll`
 *   não sobrepõe casamentos, e o valor de fora já foi consumido. Cada string da
 *   linha, com a aspa escapada desfeita, passa pela `ATRIBUICAO`
 * 🚨 E a classe inteira, "par escrito em texto livre": a string com CRASE, o
 * par com dois-pontos e `Bearer` (cabeçalho HTTP), a opção de linha de comando
 * (`--password=…`), e o `export` do shell (o `.sh` é configuração). A `ATRIBUICAO` aceita o nome entre aspas porque, dentro de
 * uma string de aspa simples, o cabeçalho vem entre aspas duplas.
 */
const EM_LINHA = /[{[,]\s*["']?([A-Za-z_][\w.-]*)["']?\s*[:=]\s*([^\s,}\]"'`#]{8,})/g
const STRING = /"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\\n]|\\.)*)`/g
const ATRIBUICAO = /(?:^|[\s;&(])["']?-{0,2}([A-Za-z_][\w.-]*)(?:=|:[ \t]*)["']?(?:(?:bearer|basic|token)[ \t]+)?([^\s"'`;&)]{8,})/gi

/** Os pares `NOME=valor`, `Nome: valor` e `--nome=valor` que moram dentro das strings da linha. */
function paresDentroDeStrings (linha) {
  return [...linha.matchAll(STRING)].flatMap((m) => {
    // ⚠️ O `\n`, o `\r` e o `\t` escritos no código viram espaço: sem isso o
    // valor engoliria o resto da linha (`velho\nOUTRA=1` viraria chave).
    const conteudo = (m[1] ?? m[2] ?? m[3]).replace(/\\(["'])/g, (_, aspa) => aspa).replace(/\\[nrt]/g, ' ')
    return [...conteudo.matchAll(ATRIBUICAO)]
  })
}

/**
 * Arquivo binário lido como texto vira ruído.
 * ⚠️ A regex se monta com `new RegExp` e barra dobrada de propósito: escrever
 * o intervalo direto na literal põe CARACTERE DE CONTROLE no fonte, e é
 * exatamente assim que um backspace entra aqui.
 */
const BINARIO = new RegExp('[\\u0000-\\u0008]')

/**
 * 🚨 NADA se isenta por pasta, nem o próprio kit. Isentar o kit, pela pasta ou
 * pelo manifesto, abre a forma de esconder uma chave por ali: uma pasta com um
 * `kit.json` falso, o `stack.mjs` que o projeto edita, ou um manifesto que
 * declara o sha do próprio arquivo com a chave. A isenção serviria às provas
 * plantadas, e a causa se trata nelas: a prova MONTA a chave falsa em tempo de
 * execução, e nenhuma aparece inteira no fonte.
 */

/**
 * O texto de um arquivo, ou nada se ele é binário.
 * 🚨 Com o BOM de UTF-16 ele se DECODIFICA antes: é o que o `>` do Windows
 * PowerShell 5.1 grava, e o NUL do UTF-16 o faria passar por binário.
 * @param {Buffer} bytes
 */
function textoDe (bytes) {
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) return bytes.subarray(2).toString('utf16le')
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) return Buffer.from(bytes.subarray(2)).swap16().toString('utf16le')
  const texto = bytes.toString('utf8')
  return BINARIO.test(texto.slice(0, 4096)) ? null : texto
}

/**
 * Os formatos reconhecíveis nos BYTES de um binário, byte por byte e sem os
 * NUL (o UTF-16 sem BOM). Só os formatos: nome e valor não se leem em binário.
 * 🚨 Um `dev.sqlite3` versionado com o token numa tabela passaria, na árvore e
 * no histórico, se o filtro de mídia decidisse pelo NOME do arquivo.
 * @param {Buffer} bytes
 * @returns {string[]} os nomes dos formatos achados
 */
function formatosEmBinario (bytes) {
  const cru = bytes.toString('latin1')
  const semNul = cru.split(String.fromCharCode(0)).join('')
  return FORMATOS_EM_BINARIO.filter((f) => f.re.test(cru) || f.re.test(semNul)).map((f) => f.nome)
}

/**
 * Os mesmos formatos, SEM o limite de palavra.
 * 🚨 O SQLite grava colunas de texto vizinhas sem separador (`prodsk-...`), e
 * o `\b` antes do prefixo não casa (medido com um banco de verdade).
 */
const FORMATOS_EM_BINARIO = FORMATOS.map((f) => ({ nome: f.nome, re: new RegExp(f.re.source.split('\\b').join('')) }))

function pareceReal (valor) {
  const v = valor.trim().replace(/^bearer\s+/i, '')
  if (v.length < 16) return false
  if (PLACEHOLDER.test(v)) return false
  if (/^\$\{?[A-Z_]+\}?$/.test(v)) return false
  // ⚠️ Referência ao ambiente não é valor: `process.env.X`, `env(X)` (a forma
  // do `config.toml` do Supabase),
  // `%X%` e `$X`.
  if (/^(process\.env|os\.environ|import\.meta\.env|env\()|^%[A-Za-z0-9_]+%$|^\$[A-Za-z_][A-Za-z0-9_]*$/.test(v)) return false
  // ⚠️ Segredo não tem espaço dentro: com espaço, é prosa lida entre dois
  // trechos de código de um markdown. (URL, caminho e ARN guardados em `TOKEN_URL`,
  // `PASSWORD_FILE` e `SECRET_ARN` saem pelo nome: ver `REFERENCIAS`.)
  if (/\s/.test(v)) return false
  if (new Set(v.replace(/[^A-Za-z0-9]/g, '')).size <= 3) return false
  // precisa ter cara de aleatório: letra e número misturados
  return /[A-Za-z]/.test(v) && /[0-9]/.test(v)
}

/** A senha de uma URL é mais curta que uma chave: basta não ser exemplo. */
function pareceSenha (valor) {
  return valor.length >= 8 && !PLACEHOLDER.test(valor) && /[A-Za-z]/.test(valor) && /[0-9]/.test(valor)
}

/** O formato reconhecível na linha, ou nada. */
function formatoDa (linha) {
  return formatoCru(linha) ?? formatoCru(desfeita(linha))
}

function formatoCru (linha) {
  return FORMATOS.find((f) => f.re.test(linha))?.nome ?? null
}

/**
 * A linha com a codificação DESFEITA: `%XX` de URL decodificado, e os escapes
 * de JSON (`\n`, `\t`, `\r`, `\uXXXX`) trocados por espaço.
 * 🚨 Com a codificação colada na frente (`%20sk-...`, `%3Dghp_...`,
 * `\nAKIA...`), o limite de palavra antes do prefixo não casa, e a chave
 * inteira passaria. Tirar
 * o `\b` do texto não serve: `disk-usage-...` e `task-...` virariam chave.
 */
function desfeita (linha) {
  // ⚠️ O `%XX` se desfaz ATÉ PARAR de mudar: a URL codificada duas vezes
  // (`%253D`) deixaria `%3D` colado no prefixo. E entram o `\xHH` (escape
  // hexadecimal), o `=HH` (quoted-printable, de e-mail) e os escapes `\b` e `\f`
  // do JSON.
  let texto = linha
  for (let i = 0; i < 5; i += 1) {
    const proximo = texto.replace(/%([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    if (proximo === texto) break
    texto = proximo
  }
  return texto
    .replace(/\\(?:[nrtbf]|u[0-9A-Fa-f]{4}|x[0-9A-Fa-f]{2})/g, ' ')
    .replace(/=[0-9A-F]{2}/g, ' ')
}

/** O `nome = valor` de segredo na linha, ou nada. Só em linha de texto normal. */
function valorDa (linha, configuracao) {
  // 🚨 TODOS os pares da linha, não o primeiro: num JSON de uma linha o
  // `"user"` vem antes, e a senha do segundo par passaria.
  const pares = [
    ...linha.matchAll(COM_ASPAS),
    configuracao ? SEM_ASPAS.exec(linha) : null,
    ENV_DO_DOCKER.exec(linha),
    ...linha.matchAll(SETX),
    ...(configuracao ? linha.matchAll(EM_LINHA) : []),
    // Na configuração, a linha de comando vem SEM aspas (`DB_PASSWORD=… node`,
    // `mysql --password=…`, o `run:` do Actions): a linha inteira passa pela
    // mesma leitura da string.
    ...(configuracao ? linha.matchAll(ATRIBUICAO) : []),
    ...paresDentroDeStrings(linha),
    ...ALTERNATIVO.flatMap((re) => [...linha.matchAll(re)])
  ]
  for (const m of pares) {
    if (!m) continue
    const [nome, valor] = m.length === 4 ? [m[2], m[3]] : [m[1], m[2]]
    if (nomeDeSegredo(nome) && pareceReal(valor)) return `valor real em ${nome}`
  }
  const url = [...linha.matchAll(SENHA_EM_URL)].some((m) => pareceSenha(m[1]))
  return url ? 'senha dentro de URL' : null
}

/**
 * O detector inteiro sobre uma linha solta: o formato conhecido, com a
 * codificação desfeita, e o `nome = valor` de segredo. Quem o usa é o
 * `vermelho.mjs`, antes de gravar no recibo, que é versionado. Devolve o NOME
 * do que achou, nunca o valor.
 */
export function segredoNaLinha (linha) {
  return formatoDa(linha) ?? valorDa(linha, false)
}

/** Camadas 1 e 2 sobre um arquivo da árvore. */
function varrerArquivo (r, arquivo, texto) {
  const lerValor = EXTENSOES_TEXTO.test(arquivo)
  const configuracao = CONFIGURACAO.test(arquivo)
  const linhas = linhasDe(texto)
  for (let i = 0; i < linhas.length; i += 1) {
    const linha = linhas[i]
    const achado = formatoDa(linha) ?? (lerValor && linha.length <= 4000 ? valorDa(linha, configuracao) : null)
    if (!achado || isento(linhas, i, MARCA).isento) continue
    r.achado(`${arquivo}:${i + 1}`, `${achado} em arquivo versionado`, 'tire do código, ponha no ambiente, e REVOGUE a chave: o histórico do git não esquece')
  }
}

/**
 * A declaração cobre ESTE achado? Arquivo e commit, os dois, e razão escrita.
 * 🚨 Declaração só por arquivo liberaria o arquivo para sempre: uma chave nova
 * no mesmo arquivo, meses depois, passaria calada.
 */
function declarado (declarados, arquivo, commit) {
  return declarados.some((x) => x.arquivo === arquivo &&
    typeof x.commit === 'string' && x.commit.length >= 7 && commit.startsWith(x.commit) &&
    String(x.razao ?? '').trim().length >= 5)
}


/**
 * Os blobs, em bytes, de uma vez só: um `git cat-file --batch`, e não um
 * processo por arquivo, pedidos pelo ID do blob, e não por `<commit>:<caminho>`.
 * 🚨 Pelo id porque o caminho escapado (nome com aspa, barra ou controle) não
 * volta ao `cat-file`, e o blob sumiria calado.
 * @returns {{ blobs: Map<string, Buffer>, falhou: boolean }}
 */
function blobsDe (raiz, ids) {
  const blobs = new Map()
  if (ids.length === 0) return { blobs, falhou: false }
  const r = spawnSync('git', ['cat-file', '--batch'], { cwd: raiz, input: `${ids.join('\n')}\n`, maxBuffer: 1024 * 1024 * 1024 })
  if (r.status !== 0 || !r.stdout) return { blobs, falhou: true }
  let pos = 0
  for (const id of ids) {
    const fim = r.stdout.indexOf(10, pos)
    if (fim === -1) break
    const cabecalho = r.stdout.subarray(pos, fim).toString('utf8').split(' ')
    pos = fim + 1
    if (cabecalho[1] !== 'blob') continue
    const tamanho = Number(cabecalho[2])
    blobs.set(id, r.stdout.subarray(pos, pos + tamanho))
    pos += tamanho + 1
  }
  return { blobs, falhou: false }
}

/**
 * O caminho de uma linha `+++` ou `Binary files`, com ou sem aspas.
 * 🚨 O git põe entre aspas e ESCAPA o caminho fora do ASCII (`core.quotePath`),
 * e `produção.env` escaparia da regex. Com `core.quotePath=false` o acento vem cru; a aspa ainda
 * aparece para nome com aspa ou quebra de linha, e por isso é aceita aqui.
 */
function caminhoDo (texto) {
  const m = /^"?b\/(.*?)"?$/.exec(texto.trim())
  return m ? m[1] : null
}

/**
 * Camada 3: os formatos nas linhas que algum commit ACRESCENTOU, e nos BYTES de
 * todo blob que o git chamou de binário.
 * ⚠️ A isenção vale no histórico como vale na árvore: a marca na mesma linha
 * ou na de cima, dentro do mesmo trecho do diff. E a chave já REVOGADA (ou que
 * nunca foi real) se declara no `stack.mjs`, em `SEGREDOS_DO_HISTORICO`, com
 * arquivo, commit e razão: o histórico não se reescreve sem aprovação.
 * ⚠️ `-m` mostra o diff dos commits de MERGE: a chave que entra só na
 * resolução de um conflito não apareceria em lugar nenhum.
 */
/**
 * Quem acusa um achado do histórico (commit, arquivo), uma vez por arquivo e
 * formato, e respeitando o que o `stack.mjs` declarou em SEGREDOS_DO_HISTORICO.
 */
function acusadorDoHistorico (r, stack) {
  const declarados = stack.SEGREDOS_DO_HISTORICO ?? []
  const vistos = new Set()
  return (commit, arquivo, achado) => {
    if (vistos.has(`${arquivo}|${achado}`) || declarado(declarados, arquivo, commit)) return
    vistos.add(`${arquivo}|${achado}`)
    r.achado(`histórico ${commit.slice(0, 7)} ${arquivo}`, `${achado} num commit, mesmo que não esteja mais na árvore`, 'REVOGUE a chave; depois declare em SEGREDOS_DO_HISTORICO do stack.mjs, com arquivo, commit e razão')
  }
}

function varrerHistorico (r, raiz, stack) {
  // ⚠️ Só a subárvore do alvo, e com o caminho a partir DELE: a trilha Python
  // de um projeto pode morar em `python/`, e o git entrega `python/fabrica/...`.
  const prefixo = rodar('git rev-parse --show-prefix', { cwd: raiz, tempoMaximo: 20000 }).saida.trim()
  // ⚠️ `--no-textconv`: o Git para Windows converte `.pdf` e `.doc` em texto no
  // diff (`astextplain`), e o do Linux não, e o mesmo histórico se lia de dois
  // jeitos. `--full-index` traz o id inteiro do blob. O histórico passa dos 64 MB
  // do buffer padrão num repositório grande, e buffer estourado sai
  // como "não medido": o teto é o mesmo do `cat-file` mais abaixo.
  const log = rodar('git -c core.quotePath=false log --all -p -m --no-color --no-ext-diff --no-textconv --full-index --format=commit%x20%H -- .', { cwd: raiz, tempoMaximo: 180000, maxBuffer: 1024 * 1024 * 1024 })
  if (log.saiu !== 0) {
    r.naoMedido('o git não entregou o histórico: sem ele, a chave apagada num commit antigo continua invisível')
    return
  }
  const acusa = acusadorDoHistorico(r, stack)
  const binarios = []
  let commit = ''
  let arquivo = ''
  let blobDepois = ''
  let trecho = []
  for (const linha of log.saida.split('\n')) {
    if (linha.startsWith('commit ')) { commit = linha.slice(7).trim(); continue }
    if (linha.startsWith('diff --git ')) { blobDepois = ''; continue }
    const indice = /^index [0-9a-f]+\.\.([0-9a-f]+)/.exec(linha)
    if (indice) { blobDepois = indice[1]; continue }
    if (linha.startsWith('+++ ')) { arquivo = (caminhoDo(linha.slice(4)) ?? '').slice(prefixo.length); trecho = []; continue }
    const binario = /^Binary files .* and (\S.*) differ$/.exec(linha)
    if (binario) {
      if (blobDepois && !/^0+$/.test(blobDepois)) binarios.push({ commit, id: blobDepois, arquivo: (caminhoDo(binario[1]) ?? binario[1]).slice(prefixo.length) })
      continue
    }
    if (linha.startsWith('@@')) { trecho = []; continue }
    if (!/^[+ ]/.test(linha)) continue
    trecho.push(linha.slice(1))
    if (!linha.startsWith('+')) continue
    // ⚠️ Sem os NUL: nem todo UTF-16 o git chama de binário, e ele pode vir
    // aqui como texto, com um NUL entre cada letra.
    const achado = formatoDa(linha) ?? formatoDa(linha.split(String.fromCharCode(0)).join(''))
    if (!achado || isento(trecho, trecho.length - 1, MARCA).isento) continue
    acusa(commit, arquivo, achado)
  }
  // 🚨 Blob pedido e não entregue é NÃO MEDIDO, nunca `continue` calado: ausência
  // de medida não é evidência de conformidade.
  // ⚠️ SEM prova plantada, e isso é declarado: o `git log -p` já lê o blob para
  // saber se é binário, então o blob que falta derruba o log antes, no outro
  // "não medido" daqui de cima. Este ramo cobre só uma corrida entre as duas
  // chamadas ao git (um `gc` no meio).
  const { blobs, falhou } = blobsDe(raiz, binarios.map((b) => b.id))
  const faltaram = binarios.filter((b) => !blobs.has(b.id))
  if (falhou || faltaram.length > 0) {
    r.naoMedido(`o git não entregou ${falhou ? 'os blobs binários' : `${faltaram.length} blob(s) binário(s)`} do histórico: sem eles, a chave dentro de um binário apagado fica invisível`)
  }
  for (const { commit: c, id, arquivo: a } of binarios) {
    const bytes = blobs.get(id)
    if (!bytes) continue
    for (const achado of achadosEmBytes(bytes)) acusa(c, a, achado)
  }
  varrerMensagens(r, raiz, acusa)
}

/**
 * As MENSAGENS de commit e de tag anotada: vão em todo clone, e só saem
 * reescrevendo o histórico.
 * 🚨 `git commit -m "troca chave sk-..."` passaria com o log imprimindo só o
 * hash. O achado sai
 * com o arquivo reservado `(mensagem)` ou `(tag)`, e se declara igual.
 * ⚠️ `spawnSync` direto, sem shell: no `cmd` do Windows `%(...)` é variável.
 */
function varrerMensagens (r, raiz, acusa) {
  const pedidos = [
    // ⚠️ `--full-history --sparse`: com o `-- .` o git DESCARTA o commit vazio e
    // o merge `--no-ff` de árvore igual à de um pai, e as mensagens deles nunca
    // chegariam aqui.
    { onde: '(mensagem)', args: ['log', '--all', '--full-history', '--sparse', '--format=%H%x00%B%x00', '--', '.'] },
    { onde: '(tag)', args: ['for-each-ref', 'refs/tags', '--format=%(objectname)%00%(contents)%00'] }
  ]
  for (const { onde, args } of pedidos) {
    const s = spawnSync('git', args, { cwd: raiz, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
    if (s.status !== 0) {
      r.naoMedido(`o git não entregou as mensagens ${onde}: a chave escrita numa mensagem fica invisível`)
      continue
    }
    const partes = s.stdout.split(String.fromCharCode(0))
    for (let i = 0; i + 1 < partes.length; i += 2) {
      const id = partes[i].trim()
      for (const linha of partes[i + 1].split('\n')) {
        const achado = formatoDa(linha)
        if (achado) acusa(id, onde, achado)
      }
    }
  }
}

/** Os achados de um arquivo que não é texto simples: UTF-16 decodificado, ou os bytes crus. */
function achadosEmBytes (bytes) {
  const texto = textoDe(bytes)
  if (texto === null) return formatosEmBinario(bytes)
  const linhas = linhasDe(texto)
  return linhas.map((linha, i) => (isento(linhas, i, MARCA).isento ? null : formatoDa(linha))).filter(Boolean)
}

export function conferir (raiz, stack, { escreve = console.log, historico = false } = {}) {
  const r = new Relatorio('segredos', {
    escreve,
    regra: 'constituição IX: segredo mora só no ambiente'
  })

  const lista = rodar('git ls-files -z', { cwd: raiz, tempoMaximo: 30000 })
  if (lista.saiu !== 0) {
    r.naoMedido('o git não respondeu aqui: sem saber o que é versionado, não dá para dizer o que vazou')
    return r.fechar()
  }

  const rastreados = lista.saida.split('\0').map((f) => f.trim()).filter(Boolean)
  let olhados = 0
  for (const arquivo of rastreados) {
    let bytes = null
    try { bytes = readFileSync(join(raiz, arquivo)) } catch { bytes = null }
    if (!bytes) continue
    olhados += 1
    const texto = textoDe(bytes)
    if (texto !== null) { varrerArquivo(r, arquivo, texto); continue }
    for (const achado of formatosEmBinario(bytes)) {
      r.achado(`${arquivo} (binário)`, `${achado} em arquivo versionado`, 'tire do repositório, e REVOGUE a chave: o histórico do git não esquece')
    }
  }
  if (historico) {
    varrerHistorico(r, raiz, stack)
  } else {
    // ⚠️ As mensagens de commit e de tag continuam aqui sempre: são baratas
    // (décimos de segundo) e o gitleaks não as lê.
    varrerMensagens(r, raiz, acusadorDoHistorico(r, stack))
    r.nota('o histórico (a chave commitada e apagada) não foi varrido aqui: ele roda com --historico, e no CI pelo gitleaks')
  }

  r.varreu(olhados)
  return r.fechar()
}

comoComando(import.meta.url, (raiz, stack, opcoes) =>
  conferir(raiz, stack, { ...opcoes, historico: process.argv.includes('--historico') })
)
