// Provas plantadas do conferidor `segredos`.
//
// Classe de defeito: segredo real em arquivo versionado. Constituição IX.
// A régua tem que separar o valor REAL do placeholder, senão ela reprova todo
// `.env.example` do mundo e alguém a desliga na primeira semana.
// mutação: kit/portao/segredos.mjs · "  if (historico) {" → "  if (true) {" · pega
// mutação: kit/portao/segredos.mjs · "    ...linha.matchAll(COM_ASPAS)," → "    ...[...linha.matchAll(COM_ASPAS)].slice(0, 1)," · pega
// mutação: kit/portao/segredos.mjs · "    ...ALTERNATIVO.flatMap((re) => [...linha.matchAll(re)])" → "    ...ALTERNATIVO.flatMap((re) => [...linha.matchAll(re)].slice(0, 1))" · pega
// mutação: kit/portao/segredos.mjs · "[...linha.matchAll(SENHA_EM_URL)].some(" → "[...linha.matchAll(SENHA_EM_URL)].slice(0, 1).some(" · pega
// mutação: kit/portao/segredos.mjs · "    ...(configuracao ? linha.matchAll(EM_LINHA) : [])," → "    ...[]," · pega
// mutação: kit/portao/segredos.mjs · "    ...paresDentroDeStrings(linha)," → "    ...[]," · pega
// mutação: kit/portao/segredos.mjs · ".replace(/\\(["'])/g, (_, aspa) => aspa).replace(/\\[nrt]/g, ' ')" → ".replace(/\\(["'])/g, (_, aspa) => aspa)" · pega
// mutação: kit/portao/segredos.mjs · "    const conteudo = (m[1] ?? m[2] ?? m[3]).replace(/\\(["'])/g, (_, aspa) => aspa)" → "    const conteudo = (m[1] ?? m[2] ?? m[3])" · pega
// mutação: kit/portao/segredos.mjs · "|`((?:[^`\\\n]|\\.)*)`/g" → "/g" · pega
// mutação: kit/portao/segredos.mjs · "(?:=|:[ \t]*)" → "=" · pega
// mutação: kit/portao/segredos.mjs · "["']?-{0,2}([A-Za-z_][\w.-]*)(?:=" → "["']?([A-Za-z_][\w.-]*)(?:=" · pega
// mutação: kit/portao/segredos.mjs · "(?:(?:bearer|basic|token)[ \t]+)?" → "" · pega
// mutação: kit/portao/segredos.mjs · "(?:bearer|basic|token)" → "bearer" · pega
// mutação: kit/portao/segredos.mjs · "    ...(configuracao ? linha.matchAll(ATRIBUICAO) : [])," → "    ...[]," · pega
// mutação: kit/portao/segredos.mjs · "  if (/\s/.test(v)) return false" → "  if (false) return false" · pega
// mutação: kit/portao/segredos.mjs · "  if (REFERENCIAS.has(palavras.at(-1))) return false" → "  if (false) return false" · pega
// mutação: kit/portao/segredos.mjs · "|sh|bash|bat|cmd)$|${DOCKER.source}" → "|sh|bash)$" · pega
// mutação: kit/portao/segredos.mjs · "|bash|ps1|psm1|bat|cmd|md|" → "|bash|bat|cmd|md|" · pega
// mutação: kit/portao/segredos.mjs · "    ENV_DO_DOCKER.exec(linha)," → "    null," · pega
// mutação: kit/portao/segredos.mjs · "([._-][\w.-]+)?" → "(\.[\w.-]+)?" · pega
// mutação: kit/portao/segredos.mjs · "\.(dockerfile|containerfile)$" → "\.dockerfile$" · pega
// mutação: kit/portao/segredos.mjs · "|bash|bat|cmd)$|" → "|bash|bat)$|" · pega
// mutação: kit/portao/segredos.mjs · "|ps1|psm1|" → "|ps1|" · pega
// mutação: kit/portao/segredos.mjs · "|bash|bat|cmd)$|" → "|bash|bat|cmd|ps1)$|" · pega
// mutação: kit/portao/segredos.mjs · "^\s*ENV\s+" → "^\s*(?:ENV|ARG)\s+" · pega
// mutação: kit/portao/segredos.mjs · "    ...linha.matchAll(SETX)," → "    null," · pega
// mutação: kit/portao/segredos.mjs · "(?:^|[\s&|(@])setx" → "^\s*setx" · pega
// mutação: kit/portao/segredos.mjs · "\s+["'`]?([^\s"'`]{8,})["'`]?\s*[`\\]?\s*$/i" → "\s+([^\s"'`]{8,})\s*[`\\]?\s*$/i" · pega
// mutação: kit/portao/segredos.mjs · "\s*[`\\]?\s*$/i" → "\s*$/i" · pega
// mutação: kit/portao/segredos.mjs · "[`\\]?\s*$/i" → "\\?\s*$/i" · pega
// mutação: kit/portao/segredos.mjs · "|ya?ml|sh|bash|bat|cmd)$|" → "|ya?ml|bat|cmd)$|" · pega

import { rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

import { impressaoDe } from '../lib/impressao.mjs'

/** Planta um arquivo DO KIT: escreve e declara no manifesto com o sha dele. */
function arquivoDoKit (ajuda, pasta, rel, conteudo) {
  const caminho = ajuda.escreve(`${pasta}/${rel}`, conteudo)
  ajuda.escreve(`${pasta}/kit.json`, `${JSON.stringify({ versao: '1.0.0', arquivos: { [rel]: impressaoDe(caminho) } })}\n`)
}

/**
 * Git no mundo plantado, para os casos que precisam de ramo, de merge e de
 * encanamento.
 * ⚠️ `core.protectNTFS=false`: sem ele o Git para Windows recusa um caminho com
 * aspa no índice, e o caso do nome escapado passaria VERDE sem plantar nada.
 */
function git (raiz, ...args) {
  return spawnSync('git', ['-c', 'core.protectNTFS=false', '-c', 'user.name=fabrica', '-c', 'user.email=f@f', ...args], { cwd: raiz, encoding: 'utf8' }).stdout.trim()
}

export const conferidor = 'segredos'

/** Uma chave com formato reconhecível, montada para não ser uma de verdade. */
const SK = `sk-${'A1b2C3d4E5f6G7h8I9j0K1l2M3n4'}`
const REAL = 'Kx9mP2qR7vL4nW8zQ3'

/**
 * 🚨 Toda chave desta prova se MONTA em tempo de execução, e nenhuma aparece
 * inteira no fonte: o `segredos` não isenta o kit, e uma chave literal aqui
 * seria acusada em todo projeto que o instala.
 */
const CHAVE_REAL = ['sk-live-', 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0'].join('')
const PRIVADA = (tipo) => `-----BEGIN ${tipo}PRIVATE ${'KEY-----'}`

export const casos = [
  {
    nome: 'chave real em arquivo versionado',
    stacks: ['node', 'python'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /config\.(ts|py)/,
    planta (raiz, stack, ajuda) {
      const arq = stack === 'python' ? 'src/config.py' : 'src/config.ts'
      ajuda.escreve(arq, `API_KEY = "${CHAVE_REAL}"\n`)
      ajuda.git()
    }
  },
  {
    // 🚨 Uma régua de placeholder que olha só o COMEÇO do valor, sem limite de
    // palavra, deixa `Myst3ry...`, `Test@2024...` e `changeMe!...` passarem
    // como exemplo. É justamente a senha que uma pessoa inventa.
    nome: 'chave real que COMEÇA com palavra de placeholder reprova',
    stacks: ['node', 'python'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /config\.(ts|py)/,
    planta (raiz, stack, ajuda) {
      const arq = stack === 'python' ? 'src/config.py' : 'src/config.ts'
      ajuda.escreve(arq, `API_KEY = "${'Myst3ryR3alK3yZ9xQ2w8'}"\n`)
      ajuda.git()
    }
  },
  {
    // 🚨 O `\b` trata o `_` como parte da palavra, e nome COMPOSTO passaria —
    // `OPENAI_API_KEY`, `DB_PASSWORD`, `clientSecret`, `CAMBIO_CHAVE` (sem a
    // regra, 7 de 9 segredos plantados passam).
    nome: 'nome COMPOSTO de segredo reprova (DB_PASSWORD, clientSecret, CAMBIO_CHAVE)',
    stacks: ['node', 'python'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /DB_PASSWORD[\s\S]*clientSecret[\s\S]*CAMBIO_CHAVE/,
    planta (raiz, stack, ajuda) {
      const arq = stack === 'python' ? 'src/config.py' : 'src/config.ts'
      ajuda.escreve(arq, `DB_PASSWORD = "${REAL}"\nclientSecret = "${'Zt5bH8wN2mQ7rK4pV9'}"\nCAMBIO_CHAVE = "${REAL}"\n`)
      ajuda.git()
    }
  },
  {
    // A senha que uma pessoa inventa, com os separadores que ela mais usa.
    nome: 'palavra de placeholder seguida de resto COM dígito é chave, e reprova',
    stacks: ['node', 'python'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /config\.(ts|py):1[\s\S]*config\.(ts|py):2[\s\S]*config\.(ts|py):3/,
    planta (raiz, stack, ajuda) {
      const arq = stack === 'python' ? 'src/config.py' : 'src/config.ts'
      ajuda.escreve(arq, `API_KEY = "${'Test-2024-Prod!Kx9Q'}"\nSECRET = "${'my-Secr3t-Passw0rd-24'}"\nTOKEN = "${'xxxQ9mZ2kL7pR4tW8vN'}"\n`)
      ajuda.git()
    }
  },
  {
    // 🚨 O formato dotenv não usa aspas, e uma busca por valor que exige aspas
    // deixa um `.env.producao` versionado passar verde.
    nome: '.env versionado SEM aspas reprova',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /\.env\.producao/,
    planta (raiz, stack, ajuda) {
      // ⚠️ Montada em tempo de execução, como toda chave desta prova: literal, o
      // próprio `segredos` a acusaria, porque lê o par dentro de string.
      ajuda.escreve('.env.producao', `export API_KEY=${REAL}Tt\n`)
      ajuda.git()
    }
  },
  {
    // ⚠️ O par que prova que a leitura sem aspas não virou falso positivo:
    // placeholder de `.env.example` passa, e em CÓDIGO valor sem aspas é
    // variável, não segredo.
    nome: '.env.example sem aspas com placeholder passa, e variável sem aspas no código também',
    stacks: ['python'],
    args: ['--historico'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      // ⚠️ Valores que SÓ a régua de placeholder segura: sem ela, os dois
      // primeiros viram "real". Valor mais fraco que estes passaria até com a
      // régua apagada, e o caso não provaria nada.
      ajuda.escreve('.env.example', 'API_KEY=abc123-cole-a-sua-chave-aqui\nDB_PASSWORD=<senha-de-32-caracteres>\nSECRET=${SECRET_DO_COFRE}\n')
      ajuda.escreve('src/config.py', 'API_TOKEN = settings.TOKEN_V2_ABCDEFGH\nSECRET = get_secret_value1234()\n')
      ajuda.git()
    }
  },
  // 🚨 Os nove casos abaixo plantam cada forma, por classe, contra a régua do
  // `/seguranca` (`.claude/skills/seguranca/referencias/stacks.md`).
  {
    nome: 'prefixos de pagamento e de nuvem com nome NEUTRO reprovam (sk_live_, rk_live_, whsec_, ASIA)',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /a\.ts:1[\s\S]*a\.ts:2[\s\S]*a\.ts:3[\s\S]*a\.ts:4/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('src/a.ts', [
        `const STRIPE = "sk_live_${'A1b2C3d4E5f6G7h8I9j0'}"`,
        `const RK = "rk_live_${'A1b2C3d4E5f6G7h8I9j0'}"`,
        `const HOOK = "whsec_${'A1b2C3d4E5f6G7h8I9j0'}"`,
        `const AWS_ID = "ASIA${'ABCDEFGHIJ234567'}"`
      ].join('\n') + '\n')
      ajuda.git()
    }
  },
  {
    nome: 'chave privada em arquivo SEM extensão de texto reprova (server.key, id_rsa)',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /^(?=[\s\S]*server\.key)(?=[\s\S]*id_rsa)(?=[\s\S]*chave\.asc)(?=[\s\S]*tectia\.key)/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('certs/server.key', `${PRIVADA('')}\nMIIE\n`)
      ajuda.escreve('certs/id_rsa', `${PRIVADA('OPENSSH ')}\nb3Bl\n`)
      // A SSH2 (RFC 4716): quatro traços com espaço, e dígito no tipo.
      ajuda.escreve('certs/tectia.key', `---- BEGIN SSH2 ENCRYPTED PRIVATE ${'KEY ----'}\nP2/5\n`)
      // A chave PGP: `PRIVATE KEY BLOCK`.
      ajuda.escreve('certs/chave.asc', `-----BEGIN PGP PRIVATE ${'KEY BLOCK-----'}\nlQOY\n`)
      ajuda.git()
    }
  },
  {
    nome: 'chave em linha LONGA de arquivo minificado reprova',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /app\.min\.js/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('src/app.min.js', `var a="${'x'.repeat(4800)}";var k="${SK}";\n`)
      ajuda.git()
    }
  },
  {
    nome: 'nome com KEY, CHAVE invertida, camelCase e termos em português reprova',
    stacks: ['node', 'python'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /config\.(ts|py):1[\s\S]*:2[\s\S]*:3[\s\S]*:4[\s\S]*:5/,
    planta (raiz, stack, ajuda) {
      const arq = stack === 'python' ? 'src/config.py' : 'src/config.ts'
      ajuda.escreve(arq, [
        `STRIPE_KEY = "${REAL}"`,
        `CHAVE_CAMBIO = "${REAL}"`,
        `cambioChave = "${REAL}"`,
        `SEGREDO_JWT = "${REAL}"`,
        `CREDENCIAL_BANCO = "${REAL}"`
      ].join('\n') + '\n')
      ajuda.git()
    }
  },
  {
    nome: 'nome ENTRE ASPAS, no JSON, reprova (password, client_secret, Authorization)',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /config\.json:2[\s\S]*config\.json:3[\s\S]*config\.json:4/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('config.json', `{\n  "password": "${REAL}",\n  "client_secret": "${REAL}",\n  "Authorization": "Bearer ${REAL}"\n}\n`)
      ajuda.git()
    }
  },
  {
    // 🚨 Um detector que para no PRIMEIRO par `nome: valor` da linha não olha a
    // senha do segundo: num JSON de uma linha, o `"user"` vem antes. O mesmo
    // nas formas alternativas.
    nome: 'a chave no SEGUNDO par da linha reprova (JSON de uma linha e forma alternativa)',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /^(?=[\s\S]*config\.json:1)(?=[\s\S]*a\.ts:1)(?=[\s\S]*b\.py:1)(?=[\s\S]*c\.ts:1)/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('config.json', `{"user": "nome-publico-2026", "password": "${REAL}"}\n`)
      ajuda.escreve('src/c.ts', `const docs = "https://leitor:exemplo@docs.interno/a"; const db = "postgres://app:${'Kx9mP2qR7vL4'}@db.interno/prod"\n`)
      ajuda.escreve('src/a.ts', `const a = process.env.A || "valor-neutro-123"; const k = process.env.API_KEY || "${REAL}"\n`)
      ajuda.escreve('src/b.py', `A = os.environ.get("A", "valor-neutro-123"); K = os.environ.get("API_KEY", "${REAL}")\n`)
      ajuda.git()
    }
  },
  {
    // 🚨 Dois jeitos de o segundo par escapar. Na configuração, o mapa e a
    // lista EM LINHA (o `SEM_ASPAS` pega a linha inteira e só vê um par); e o
    // par DENTRO de uma string, porque o `matchAll` não sobrepõe casamentos e o
    // valor de `"start": "…"` já foi consumido.
    nome: 'o par em mapa ou lista de uma linha, e o par dentro de uma string, reprovam',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /^(?=[\s\S]*config\.yml:2)(?=[\s\S]*compose\.yml:4)(?=[\s\S]*package\.json:2)(?=[\s\S]*env\.json:1)/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('config.yml', `app: prod\ndb: {user: app, password: ${REAL}}\n`)
      ajuda.escreve('compose.yml', `services:\n  api:\n    image: node\n    environment: [DB_PASSWORD=${REAL}]\n`)
      ajuda.escreve('package.json', `{\n  "scripts": { "start": "DB_PASSWORD=${REAL} node server.js" }\n}\n`)
      ajuda.escreve('env.json', `{"env": "API_TOKEN=\\"${REAL}\\""}\n`)
      ajuda.git()
    }
  },
  {
    // 🚨 A mesma classe, "par escrito em texto livre", nas outras formas: a
    // string com CRASE (o jeito comum de montar comando em JS), o par com
    // dois-pontos e `Bearer` (cabeçalho HTTP), a opção de linha de comando, e o
    // `export` do shell sem aspas (o `.sh` se lê como configuração).
    nome: 'o par em texto livre reprova: crase, cabeçalho com Bearer, opção de linha de comando e export do shell',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /^(?=[\s\S]*cmd\.ts:1)(?=[\s\S]*cmd\.ts:2)(?=[\s\S]*http\.ts:1)(?=[\s\S]*http\.ts:2)(?=[\s\S]*banco\.ts:1)(?=[\s\S]*deploy\.sh:2)/,
    planta (raiz, stack, ajuda) {
      const crase = '`'
      ajuda.escreve('src/cmd.ts', [
        `exec(${crase}DB_PASSWORD=${REAL} node server.js${crase})`,
        `const cmd = ${crase}API_TOKEN=${REAL}${crase}`
      ].join('\n') + '\n')
      ajuda.escreve('src/http.ts', [
        `const h = { x: "Authorization: Bearer ${REAL}" }`,
        `run('curl -H "X-Api-Key: ${REAL}" https://api.exemplo.com')`
      ].join('\n') + '\n')
      ajuda.escreve('src/banco.ts', `run("mysql --password=${REAL} -u app")\n`)
      ajuda.escreve('deploy.sh', `#!/bin/sh\nexport DB_PASSWORD=${REAL}\n`)
      ajuda.git()
    }
  },
  {
    // 🚨 Com o `.sh` lido como configuração, a linha de comando SEM ASPAS ainda
    // ficaria calada (o `SEM_ASPAS` só lê a linha que é um par inteira), no
    // shell e no `run:` do Actions; e o cabeçalho vem também como `Basic` e
    // `Token`, não só `Bearer`. Ficam de fora, ditos: o `- run: DB_PASSWORD=… npm test` (o `run:`
    // consome o par) e o `curl -u usuario:senha`.
    nome: 'a linha de comando sem aspas na configuração, e o cabeçalho Basic e Token, reprovam',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /^(?=[\s\S]*sobe\.sh:2)(?=[\s\S]*sobe\.sh:3)(?=[\s\S]*sobe\.sh:4)(?=[\s\S]*sobe\.sh:5)(?=[\s\S]*sobe\.sh:6)(?=[\s\S]*ci\.yml:3)(?=[\s\S]*auth\.ts:1)(?=[\s\S]*auth\.ts:2)/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('sobe.sh', [
        '#!/bin/sh',
        `DB_PASSWORD=${REAL} node server.js`,
        `mysql --password=${REAL} -u app`,
        `docker run -e API_TOKEN=${REAL} app`,
        `readonly DB_SECRET=${REAL}`,
        `export DB_USER=app DB_PASSWORD=${REAL}`
      ].join('\n') + '\n')
      ajuda.escreve('ci.yml', `jobs:\n  a:\n    - run: mysql --password=${REAL}\n`)
      const basico = Buffer.from(`app:${REAL}`).toString('base64')
      ajuda.escreve('src/auth.ts', [
        `const b = { h: "Authorization: Basic ${basico}" }`,
        `const t = { h: "Authorization: Token ${REAL}" }`
      ].join('\n') + '\n')
      ajuda.git()
    }
  },
  {
    // ⚠️ Os falsos positivos que a leitura mais larga traz, medidos num
    // relatório de lente: a prosa ENTRE dois trechos de código de um
    // markdown lida como valor (segredo não tem espaço dentro), e o nome de
    // segredo guardando URL, caminho de arquivo ou ARN, que são endereço e não
    // segredo (a senha dentro da URL tem regra própria, e continua acusando).
    nome: 'prosa entre trechos de código, URL, caminho e ARN não são segredo',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.escreve('NOTAS.md', [
        'Fecharam o `--password=` dentro. Fecharam também as formas listadas na rodada 2 (o `Bearer`).',
        'Acusavam `SECRET_ARN=arn:aws:secretsmanager:us-east-1:123456789012:secret:app-2026`, `TOKEN_URL=https://login.exemplo.com/oauth2/token` e `PASSWORD_FILE=/run/secrets/db_password2`.'
      ].join('\n') + '\n')
      ajuda.escreve('sobe.sh', '#!/bin/sh\nexport TOKEN_URL=https://login.exemplo.com/oauth2/token\nexport PASSWORD_FILE=./segredos/db_password2\nnode app.js --token-file=/caminho/do/token/v2\n')
      // O nome que APONTA para o segredo (termina em id, url, arquivo, caminho,
      // arn, ttl) guarda uma referência, não o segredo.
      ajuda.escreve('busca.sh', '#!/bin/sh\naws secretsmanager get-secret-value --secret-id=prod/db-credentials-v2\nexport TOKEN_TTL=3600segundos2026\nexport SECRET_NAME=app-producao-2026-v3\n')
      ajuda.git()
    }
  },
  {
    // O par do caso acima: a linha de comando com variável neutra e com o
    // segredo lido de fora, o `run:` que usa `secrets.X`, e o cabeçalho neutro.
    nome: 'a linha de comando neutra na configuração passa',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.escreve('sobe.sh', '#!/bin/sh\nNODE_ENV=producao2026abc node server.js\ndocker run -e PORTA=8080 -e DB_PASSWORD="$DB_PASSWORD" app\nmysql --password="$(cat /run/secrets/db)" -u app\n')
      ajuda.escreve('ci.yml', 'jobs:\n  a:\n    - run: npm test -- --reporter=junit2026abc\n    - run: echo ${{ secrets.NPM_TOKEN }}\n')
      ajuda.escreve('src/auth.ts', 'const h = { a: "Accept: application/json; version=2026abc" }\n')
      ajuda.git()
    }
  },
  {
    // 🚨 Três tipos comuns de arquivo que, sem leitura, deixariam a chave colada
    // neles passar calada. O `Dockerfile` (sem extensão, com sufixo e com a
    // extensão `.dockerfile`, e a forma antiga do `ENV` com espaço), o
    // PowerShell e o lote do Windows.
    nome: 'a chave no Dockerfile, no PowerShell e no lote do Windows reprova',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /^(?=[\s\S]*Dockerfile:2)(?=[\s\S]*Dockerfile:3)(?=[\s\S]*Dockerfile:4)(?=[\s\S]*Containerfile\.prod:2)(?=[\s\S]*api\.dockerfile:2)(?=[\s\S]*sobe\.ps1:1)(?=[\s\S]*sobe\.bat:2)(?=[\s\S]*sobe\.cmd:2)/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('Dockerfile', `FROM node:24\nENV API_TOKEN=${REAL}\nENV DB_PASSWORD ${REAL}\nARG CLIENT_SECRET=${REAL}\n`)
      ajuda.escreve('Containerfile.prod', `FROM node:24\nENV NODE_ENV=producao API_TOKEN=${REAL}\n`)
      ajuda.escreve('docker/api.dockerfile', `FROM node:24\nENV API_TOKEN=${REAL}\n`)
      ajuda.escreve('scripts/sobe.ps1', `$env:API_TOKEN = "${REAL}"\n`)
      ajuda.escreve('scripts/sobe.bat', `@echo off\nset API_TOKEN=${REAL}\n`)
      ajuda.escreve('scripts/sobe.cmd', `@echo off\nset "DB_PASSWORD=${REAL}"\n`)
      ajuda.git()
    }
  },
  {
    // 🚨 A forma antiga do `ENV` com aspas, com `=` no valor (base64) e com a
    // barra de continuação; os nomes com traço e sublinhado (`Dockerfile-prod`,
    // `Dockerfile_dev`) e o `.containerfile`; o `setx` do Windows, que separa
    // nome e valor por espaço; o `set` sem aspas num `.cmd`; e o `.psm1`.
    nome: 'a forma antiga do ENV, os nomes de Dockerfile, o setx, o cmd e o psm1 reprovam',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /^(?=[\s\S]*Dockerfile-prod:2)(?=[\s\S]*Dockerfile-prod:3)(?=[\s\S]*Dockerfile-prod:4)(?=[\s\S]*Dockerfile-prod:5)(?=[\s\S]*Dockerfile_dev:2)(?=[\s\S]*api\.containerfile:2)(?=[\s\S]*grava\.cmd:2)(?=[\s\S]*grava\.cmd:3)(?=[\s\S]*grava\.cmd:4)(?=[\s\S]*grava\.ps1:1)(?=[\s\S]*modulo\.psm1:1)/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('Dockerfile-prod', `FROM node:24\nENV API_TOKEN "${REAL}"\nENV DB_PASSWORD '${REAL}'\nENV CLIENT_SECRET ${REAL}==\nENV SESSION_SECRET ${REAL} \\\n    OUTRA=1\n`)
      ajuda.escreve('Dockerfile_dev', `FROM node:24\nENV API_TOKEN=${REAL}\n`)
      ajuda.escreve('docker/api.containerfile', `FROM node:24\nENV API_TOKEN=${REAL}\n`)
      ajuda.escreve('scripts/grava.cmd', `@echo off\nset API_TOKEN=${REAL}\nsetx API_TOKEN ${REAL}\nsetx /M DB_PASSWORD "${REAL}"\n`)
      ajuda.escreve('scripts/grava.ps1', `setx API_TOKEN "${REAL}"\n`)
      ajuda.escreve('scripts/modulo.psm1', `$env:API_TOKEN = "${REAL}"\n`)
      ajuda.git()
    }
  },
  {
    // 🚨 O `setx` depois de `@`, `if`, `&`, `call` e `cmd /c`, que passaria se
    // fosse lido só no começo da linha; a continuação com crase (Dockerfile de
    // contêiner Windows); e a forma antiga do `ENV` fora de um Dockerfile, que
    // o código lê.
    nome: 'o setx no meio da linha, a continuação com crase e o ENV fora do Dockerfile reprovam',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /^(?=[\s\S]*prefixo\.bat:2)(?=[\s\S]*prefixo\.bat:3)(?=[\s\S]*prefixo\.cmd:2)(?=[\s\S]*prefixo\.cmd:3)(?=[\s\S]*prefixo\.ps1:1)(?=[\s\S]*prefixo\.ps1:2)(?=[\s\S]*Dockerfile\.win:3)(?=[\s\S]*NOTAS-DOCKER\.md:3)/,
    planta (raiz, stack, ajuda) {
      const crase = '`'
      ajuda.escreve('scripts/prefixo.bat', `@echo off\n@setx API_TOKEN ${REAL}\nif not defined X setx DB_PASSWORD ${REAL}\n`)
      ajuda.escreve('scripts/prefixo.cmd', `@echo off\necho ok & setx API_TOKEN ${REAL}\ncall setx CLIENT_SECRET ${REAL}\n`)
      ajuda.escreve('scripts/prefixo.ps1', `& setx API_TOKEN "${REAL}"\ncmd /c setx DB_PASSWORD ${REAL}\n`)
      ajuda.escreve('Dockerfile.win', `# escape=${crase}\nFROM mcr.microsoft.com/windows/servercore:ltsc2022\nENV API_TOKEN ${REAL} ${crase}\n    OUTRA=1\n`)
      ajuda.escreve('NOTAS-DOCKER.md', `# Como subir\n\n    ENV API_TOKEN ${REAL}\n`)
      ajuda.git()
    }
  },
  {
    // O par de cada tipo acima: variável neutra, versão, e o segredo lido de fora.
    // ⚠️ O `ARG` duplo (`ARG A B` declara dois, sem valor) não é segredo, e o mapa
    // do PowerShell que lê o ambiente separa texto de configuração: lido como
    // configuração, ele acusaria.
    nome: 'o Dockerfile, o PowerShell e o lote do Windows neutros passam',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.escreve('Dockerfile', 'FROM node:24-alpine3.20\nARG VERSAO=1.2.3-build2026\nENV NODE_ENV=producao2026abc\nENV API_TOKEN=${API_TOKEN}\nENV PATH=/app/node_modules/.bin:$PATH\nRUN --mount=type=secret,id=npm_token npm ci\nARG NPM_TOKEN BUILDKIT_VERSION_2026a\n')
      ajuda.escreve('scripts/sobe.ps1', '$env:PATH = "C:\\ferramentas;$env:PATH"\n$env:API_TOKEN = $segredo\n$token = $env:API_TOKEN\n$cabecalho = @{ Authorization = $env:AUTH_HEADER_V2 }\n')
      ajuda.escreve('scripts/sobe.bat', '@echo off\nset PORTA=8080\nset API_TOKEN=%API_TOKEN%\nset "CAMINHO=C:\\app\\versao2026abc"\nsetx PATH "%PATH%;C:\\ferramentas2026"\nif defined X setx NODE_ENV producao2026abc\n')
      // O `.psm1` também é texto, não configuração: a mesma linha que separa os
      // dois modos no `.ps1`.
      ajuda.escreve('scripts/modulo.psm1', '$cabecalho = @{ Authorization = $env:AUTH_HEADER_V2 }\n')
      ajuda.git()
    }
  },
  {
    // O par de cada forma acima: o cabeçalho neutro, a crase com variável, a
    // porta na URL, o comando que lê o segredo de fora e o PATH do shell.
    nome: 'texto livre neutro passa: cabeçalho, crase com variável, porta e o shell que lê de fora',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      const crase = '`'
      ajuda.escreve('src/cmd.ts', [
        'const h = { c: "Content-Type: application/json; charset=utf-8" }',
        `exec(${crase}node \${arquivo} --saida=relatorio-2026.json${crase})`,
        'const url = "https://exemplo.com:8080/api/v2026"'
      ].join('\n') + '\n')
      ajuda.escreve('deploy.sh', '#!/bin/sh\nexport PATH=$PATH:/usr/local/bin\nDB_PASSWORD=$(cat /run/secrets/db_password)\nexport NODE_ENV=producao2026abc\n')
      ajuda.git()
    }
  },
  {
    // O par do caso acima: string com parâmetros e variáveis NEUTRAS não vira
    // segredo, nem o mapa em linha com nomes neutros.
    nome: 'string com parâmetros neutros e mapa em linha neutro passam',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.escreve('package.json', '{\n  "scripts": { "start": "NODE_ENV=producao2026abc node server.js" },\n  "homepage": "https://exemplo.com/busca?pagina=2&ordem=nome-2026-abc"\n}\n')
      ajuda.escreve('config.yml', 'db: {user: app, host: banco-2026-interno9, porta: 5432}\n')
      // ⚠️ O `\n` escrito dentro da string se desfaz antes: sem isso o valor
      // engoliria o resto da linha, e `velho\nOUTRA=1` viraria chave (é a forma
      // de um teste que monta o .env numa string).
      ajuda.escreve('src/teste.mjs', "const antes = 'INSTAGRAM_ACCESS_TOKEN=velho\\nOUTRA=1\\n'\nconst exemplo = 'API_KEY=abc123-cole-a-sua-chave-aqui\\nSECRET=${SECRET_DO_COFRE}\\n'\n")
      ajuda.git()
    }
  },
  {
    nome: 'linha com dois pares neutros passa',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.escreve('config.json', '{"user": "nome-publico-2026", "cidade": "sao-paulo-2026-sp"}\n')
      ajuda.git()
    }
  },
  {
    nome: 'YAML sem aspas reprova, no mapa e na lista do compose',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /config\.yml[\s\S]*compose\.yml|compose\.yml[\s\S]*config\.yml/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('config.yml', `banco:\n  password: ${REAL}\n`)
      ajuda.escreve('compose.yml', `services:\n  app:\n    environment:\n      - API_KEY=${REAL}\n`)
      ajuda.git()
    }
  },
  {
    nome: 'valor ALTERNATIVO de variável de ambiente reprova, nas três formas',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /^(?=[\s\S]*a\.py:2)(?=[\s\S]*a\.ts:1)(?=[\s\S]*compose\.yml:3)/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('src/a.py', `import os\nCHAVE = os.environ.get("API_KEY", "${REAL}")\n`)
      ajuda.escreve('src/a.ts', `export const k = process.env.API_KEY || "${REAL}"\n`)
      ajuda.escreve('compose.yml', `services:\n  db:\n    image: postgres:\${POSTGRES_PASSWORD:-${REAL}}\n`)
      ajuda.git()
    }
  },
  {
    nome: 'senha dentro de URL reprova',
    stacks: ['node', 'python'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /config\.(ts|py)/,
    planta (raiz, stack, ajuda) {
      const arq = stack === 'python' ? 'src/config.py' : 'src/config.ts'
      ajuda.escreve(arq, `DATABASE_URL = "postgres://app:${'Kx9mP2qR7vL4'}@db.interno/prod"\n`)
      ajuda.git()
    }
  },
  {
    // 🚨 SEC-03 da régua do `/seguranca`: buscar no HISTÓRICO, não só na árvore. A
    // chave commitada e apagada no commit seguinte continua vazada.
    nome: 'chave commitada e APAGADA no commit seguinte reprova pelo histórico',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /hist[oó]rico[\s\S]*src\/a\.ts|src\/a\.ts[\s\S]*hist[oó]rico/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('src/a.ts', `const k = "${SK}"\n`)
      ajuda.git()
      rmSync(join(raiz, 'src', 'a.ts'))
      ajuda.escreve('src/b.ts', 'export const b = 1\n')
      ajuda.git()
    }
  },
  {
    nome: 'histórico: a chave de EXEMPLO declarada na linha de cima passa',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.escreve('src/a.ts', `// segredo de exemplo: chave falsa do teste do parser\nconst k = "${SK}"\n`)
      ajuda.git()
      rmSync(join(raiz, 'src', 'a.ts'))
      ajuda.escreve('src/b.ts', 'export const b = 1\n')
      ajuda.git()
    }
  },
  {
    // ⚠️ O histórico não se reescreve sem aprovação dele. A chave REVOGADA se
    // declara no `stack.mjs`, com a razão, e o conferidor para de acusar.
    nome: 'histórico: chave REVOGADA e declarada no stack.mjs, com arquivo e commit, passa',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.escreve('src/a.ts', `const k = "${SK}"\n`)
      ajuda.git()
      const commit = git(raiz, 'rev-parse', 'HEAD')
      ajuda.ajusta({ SEGREDOS_DO_HISTORICO: [{ arquivo: 'src/a.ts', commit, razao: 'chave revogada no painel em 18/09/2026' }] })
      rmSync(join(raiz, 'src', 'a.ts'))
      ajuda.escreve('src/b.ts', 'export const b = 1\n')
      ajuda.git()
    }
  },
  // 🚨 Os casos abaixo são seis formas de ESCONDER uma chave do próprio
  // conferidor, todas pelas isenções dele.
  {
    nome: 'histórico: declaração com razão CURTA não vale',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /hist[oó]rico[\s\S]*src\/a\.ts/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('src/a.ts', `const k = "${SK}"\n`)
      ajuda.git()
      ajuda.ajusta({ SEGREDOS_DO_HISTORICO: [{ arquivo: 'src/a.ts', commit: git(raiz, 'rev-parse', 'HEAD'), razao: 'ok' }] })
      rmSync(join(raiz, 'src', 'a.ts'))
      ajuda.escreve('src/b.ts', 'export const b = 1\n')
      ajuda.git()
    }
  },
  {
    nome: 'histórico: a declaração de UM commit não esconde a chave nova do mesmo arquivo',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /hist[oó]rico[\s\S]*src\/a\.ts/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('src/a.ts', `const k = "${SK}"\n`)
      ajuda.git()
      ajuda.ajusta({ SEGREDOS_DO_HISTORICO: [{ arquivo: 'src/a.ts', commit: git(raiz, 'rev-parse', 'HEAD'), razao: 'chave falsa de teste' }] })
      rmSync(join(raiz, 'src', 'a.ts'))
      ajuda.git()
      ajuda.escreve('src/a.ts', `const t = "ghp_${'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7'}"\n`)
      ajuda.git()
      rmSync(join(raiz, 'src', 'a.ts'))
      ajuda.git()
    }
  },
  {
    nome: 'chave no stack.mjs do kit reprova: é o arquivo que o PROJETO edita',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /fabrica\/stack\.mjs/,
    planta (raiz, stack, ajuda) {
      // ⚠️ Com um kit de verdade plantado: sem ele, uma régua que isenta o kit
      // também varreria a pasta, e o caso não provaria nada.
      arquivoDoKit(ajuda, 'fabrica', 'provas/segredos.mjs', 'export const a = 1\n')
      ajuda.ajusta({ CHAVE_DE_TESTE_DO_PORTAO: `sk_live_${'A1b2C3d4E5f6G7h8I9j0'}` })
      ajuda.gravarStack()
      ajuda.git()
    }
  },
  {
    nome: 'pasta chamada fabrica com um kit.json FALSO não esconde nada',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /config\/fabrica\/prod\.env/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('config/fabrica/kit.json', '{}\n')
      ajuda.escreve('config/fabrica/prod.env', `TOKEN=ghp_${'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7'}\n`)
      ajuda.git()
    }
  },
  {
    nome: 'histórico: arquivo que só PASSOU pela fabrica/, e não é do kit, se varre',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /hist[oó]rico[\s\S]*fabrica\/prod\.env/,
    planta (raiz, stack, ajuda) {
      arquivoDoKit(ajuda, 'fabrica', 'provas/segredos.mjs', 'export const a = 1\n')
      ajuda.escreve('fabrica/prod.env', `TOKEN=ghp_${'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7'}\n`)
      ajuda.git()
      rmSync(join(raiz, 'fabrica', 'prod.env'))
      ajuda.git()
    }
  },
  {
    nome: 'histórico: chave que entra SÓ na resolução de um merge reprova',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /hist[oó]rico[\s\S]*src\/conflito\.env/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('src/conflito.env', 'TOKEN=base\n')
      ajuda.git()
      const principal = git(raiz, 'rev-parse', '--abbrev-ref', 'HEAD')
      git(raiz, 'checkout', '-q', '-b', 'lado')
      writeFileSync(join(raiz, 'src', 'conflito.env'), 'TOKEN=lado\n')
      git(raiz, 'commit', '-qam', 'lado')
      git(raiz, 'checkout', '-q', principal)
      writeFileSync(join(raiz, 'src', 'conflito.env'), 'TOKEN=principal\n')
      git(raiz, 'commit', '-qam', 'principal')
      git(raiz, 'merge', '-q', 'lado')
      writeFileSync(join(raiz, 'src', 'conflito.env'), `TOKEN=ghp_${'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7'}\n`)
      git(raiz, 'commit', '-qam', 'resolve')
      writeFileSync(join(raiz, 'src', 'conflito.env'), 'TOKEN=limpo\n')
      git(raiz, 'commit', '-qam', 'limpa')
    }
  },
  {
    // O `>` do Windows PowerShell 5.1 grava assim: BOM FF FE e UTF-16LE.
    nome: '.env gravado em UTF-16 reprova, na árvore e no histórico',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /^(?=[\s\S]*\.env\.windows:1)(?=[\s\S]*\.env\.mac:1)(?=[\s\S]*hist[oó]rico[\s\S]*\.env\.antigo)/,
    planta (raiz, stack, ajuda) {
      const utf16 = (t) => Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(t, 'utf16le')])
      writeFileSync(join(raiz, '.env.antigo'), utf16(`TOKEN=sk_live_${'A1b2C3d4E5f6G7h8I9j0'}\n`))
      ajuda.git()
      rmSync(join(raiz, '.env.antigo'))
      writeFileSync(join(raiz, '.env.windows'), utf16(`TOKEN=sk_live_${'A1b2C3d4E5f6G7h8I9j0'}\n`))
      // O big-endian (BOM FE FF), que só este caso alcança.
      writeFileSync(join(raiz, '.env.mac'), Buffer.concat([Buffer.from([0xfe, 0xff]), Buffer.from(`TOKEN=sk_live_${'A1b2C3d4E5f6G7h8I9j0'}\n`, 'utf16le').swap16()]))
      ajuda.git()
    }
  },
  {
    // O par dos casos de nome: chave de cache, de armazenamento, pública, e
    // palavra que só CONTÉM um termo não são segredo.
    nome: 'nome NEUTRO com valor de cara aleatória passa (CACHE_KEY, publicKey, tokenizer)',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.escreve('src/a.ts', [
        'const CACHE_KEY = "perfil-2026-v3-abcdef"', // gitleaks:allow (caso verde: nome neutro)
        'const STORAGE_KEY = "moodboard-fulana-2026-09"',
        'const publicKey = "pk_A1b2C3d4E5f6G7h8I9j0"',
        'const tokenizerModel = "cl100k-base-2024-xyz"',
        'const author = "fulana-2026-autor-9x"',
        'const x = { "payload._data.key.remoteJid": "5511987654321-grupo" }' // gitleaks:allow (caso verde: identificador, não segredo)
      ].join('\n') + '\n')
      ajuda.escreve('supabase/config.toml', 's3_access_key = "env(S3_ACCESS_KEY_2026)"\n')
      ajuda.git()
    }
  },
  {
    nome: 'URL com usuário e senha de EXEMPLO (sem dígito) passa',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      // ⚠️ `senhasecreta`, e não `senha`: com cinco letras a regex da URL nem
      // casa, e o caso passaria sem a regra de dígito.
      ajuda.escreve('src/a.ts', 'const URL_BANCO = "postgres://usuario:senhasecreta@localhost/db"\n')
      ajuda.git()
    }
  },
  {
    nome: 'token do GitHub em arquivo versionado',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /src\/a\.ts/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('src/a.ts', `const t = "ghp_${'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8'}"\n`)
      ajuda.git()
    }
  },
  {
    nome: 'chave privada colada no fonte',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /src\/a\.ts/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('src/a.ts', `const k = \`${PRIVADA('RSA ')}\\nMIIE...\`\n`)
      ajuda.git()
    }
  },
  {
    nome: 'placeholder NÃO é segredo',
    stacks: ['node', 'python'],
    args: ['--historico'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      const arq = stack === 'python' ? 'src/config.py' : 'src/config.ts'
      ajuda.escreve(arq, 'API_KEY = "<cole-aqui-a-sua-chave>"\nSECRET = "your-secret-here"\nTOKEN = "changeme"\n')
      ajuda.git()
    }
  },
  {
    // ⚠️ Os placeholders do caso de cima não têm dígito, e por isso caem na
    // última régua ("letra e número misturados") antes de a de PLACEHOLDER
    // decidir qualquer coisa: com a régua de placeholder desligada, a matriz
    // sem este caso continuaria verde. Este caso só passa por ela.
    nome: 'placeholder com cara de chave (letra, número, comprimento) NÃO é segredo',
    stacks: ['node', 'python'],
    args: ['--historico'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      const arq = stack === 'python' ? 'src/config.py' : 'src/config.ts'
      // ⚠️ O dígito mora na PALAVRA reservada (`abc123`, `123456`), e o resto
      // não tem nenhum: resto com dígito é chave.
      ajuda.escreve(arq, 'API_KEY = "abc123-cole-a-sua-chave-aqui"\nSECRET = "123456_example_key_here"\n')
      ajuda.git()
    }
  },
  {
    nome: 'chave real em arquivo NÃO versionado passa: o git não a carrega',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.escreve('.gitignore', '.env\n')
      ajuda.escreve('src/a.ts', 'export const a = 1\n')
      ajuda.git()
      ajuda.escreve('.env', `API_KEY="${CHAVE_REAL}"\n`)
    }
  },
  {
    nome: 'chave real dentro de COMENTÁRIO ainda é vazamento',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /src\/a\.ts/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('src/a.ts', `// exemplo: API_KEY = "${CHAVE_REAL}"\nexport const a = 1\n`)
      ajuda.git()
    }
  },
  {
    nome: 'isenção declarada com razão passa',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.escreve('src/a.ts', `const t = "${CHAVE_REAL}" // segredo de exemplo: chave revogada, usada no teste do parser\n`)
      ajuda.git()
    }
  },
  {
    nome: 'isenção SEM razão não passa',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /src\/a\.ts/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('src/a.ts', `const t = "${CHAVE_REAL}" // segredo de exemplo:\n`)
      ajuda.git()
    }
  },
  {
    // 🚨 O kit NÃO se isenta, e as provas dele montam a chave falsa em tempo
    // de execução. Este caso prova que a forma
    // que as provas usam passa, e que nada precisou de pulo para isso.
    nome: 'arquivo do kit com a chave MONTADA em tempo de execução passa, sem isenção nenhuma',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.escreve('src/a.ts', 'export const a = 1\n')
      ajuda.escreve('fabrica/provas/segredos.mjs', "const CHAVE = ['sk-live-', 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4'].join('')\n")
      ajuda.git()
    }
  },
  {
    // 🚨 O ataque: um manifesto que declara o sha do PRÓPRIO arquivo com a
    // chave. Com o kit isento pelo manifesto, isso passaria verde no
    // `segredos` e no `kit`.
    nome: 'chave LITERAL num arquivo do kit reprova, mesmo com manifesto que declara o sha dele',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /^(?=[\s\S]*fabrica\/provas\/segredos\.mjs)(?=[\s\S]*config\/fabrica\/prod\.env)/,
    planta (raiz, stack, ajuda) {
      arquivoDoKit(ajuda, 'fabrica', 'provas/segredos.mjs', `const CHAVE = "${CHAVE_REAL}"\n`)
      arquivoDoKit(ajuda, 'config/fabrica', 'prod.env', `TOKEN=ghp_${'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7'}\n`)
      ajuda.git()
    }
  },
  {
    // 🚨 "Pular toda pasta chamada fabrica" é grande demais. Um `src/fabrica/` ou `docs/fabrica/` qualquer
    // ficaria sem varredura de segredo E sem sha, porque o conferidor `kit`
    // cobre `<raiz>/fabrica` e mais nada. O que autoriza o pulo é o MANIFESTO ao
    // lado: sem `kit.json`, aquilo é uma pasta com um nome infeliz.
    nome: 'pasta chamada `fabrica` SEM manifesto NÃO é pulada',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /OpenAI|chave/i,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('src/a.ts', 'export const a = 1\n')
      ajuda.escreve('src/fabrica/util.ts', `const CHAVE = "${CHAVE_REAL}"\n`)
      ajuda.git()
    }
  },
  {
    // 🚨 O segundo ataque: uma chave LITERAL num arquivo do kit aninhado,
    // commitada e desfeita no commit seguinte. No histórico, isentar pelo
    // caminho listado no manifesto isentaria qualquer conteúdo.
    nome: 'histórico: chave num arquivo do kit ANINHADO, desfeita no commit seguinte, reprova',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /hist[oó]rico[\s\S]*trilha\/fabrica\/lib\/lcov\.mjs/,
    planta (raiz, stack, ajuda) {
      arquivoDoKit(ajuda, 'trilha/fabrica', 'lib/lcov.mjs', 'export const a = 1\n')
      ajuda.git()
      ajuda.escreve('trilha/fabrica/lib/lcov.mjs', `// ghp_${'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7'}\nexport const a = 1\n`)
      ajuda.git()
      ajuda.escreve('trilha/fabrica/lib/lcov.mjs', 'export const a = 1\n')
      ajuda.git()
    }
  },
  {
    // 🚨 A terceira classe: binário que não é UTF-16. Um banco SQLite
    // versionado com o token numa tabela, na árvore e no histórico. Com o
    // filtro de mídia decidindo pelo NOME, um UTF-16 chamado `notas.pdf`
    // passaria depois de apagado.
    nome: 'formato reconhecível dentro de BINÁRIO reprova: sqlite, NUL no começo, e UTF-16 com nome de mídia no histórico',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /^(?=[\s\S]*dev\.sqlite3)(?=[\s\S]*colado\.sqlite3)(?=[\s\S]*nulo\.txt)(?=[\s\S]*sem-bom\.txt)(?=[\s\S]*hist[oó]rico[\s\S]*notas\.png)(?=[\s\S]*hist[oó]rico[\s\S]*forcado\.env)(?=[\s\S]*hist[oó]rico[\s\S]*velho\.sqlite3)/,
    planta (raiz, stack, ajuda) {
      const token = `ghp_${'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7'}`
      const utf16 = (t) => Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(t, 'utf16le')])
      const sqlite = Buffer.concat([Buffer.from('SQLite format 3\0'), Buffer.alloc(100), Buffer.from(token), Buffer.alloc(50)])
      // ⚠️ Dois itens em vez de um `notas.pdf`, que provaria coisa diferente em
      // cada máquina: o Git para Windows converte `.pdf` em texto no diff, e o
      // do Linux não. `notas.png` vai sempre pelo blob; `forcado.env`, com o
      // atributo `diff`, vai sempre como texto com NUL.
      ajuda.escreve('.gitattributes', 'forcado.env diff\n')
      writeFileSync(join(raiz, 'notas.png'), utf16(`TOKEN=${token}\n`))
      writeFileSync(join(raiz, 'forcado.env'), utf16(`TOKEN=${token}\n`))
      writeFileSync(join(raiz, 'velho.sqlite3'), sqlite)
      ajuda.git()
      rmSync(join(raiz, 'notas.png'))
      rmSync(join(raiz, 'forcado.env'))
      rmSync(join(raiz, 'velho.sqlite3'))
      // 🚨 O SQLite grava colunas de texto vizinhas sem separador, e o `\b`
      // antes do prefixo não casa.
      writeFileSync(join(raiz, 'colado.sqlite3'), Buffer.concat([Buffer.from('SQLite format 3\0'), Buffer.alloc(40), Buffer.from(`prod${SK}`), Buffer.alloc(20)]))
      writeFileSync(join(raiz, 'sem-bom.txt'), Buffer.from(`TOKEN=${token}\n`, 'utf16le'))
      writeFileSync(join(raiz, 'dev.sqlite3'), Buffer.concat([Buffer.from('SQLite format 3\0'), Buffer.alloc(100), Buffer.from(token), Buffer.alloc(50)]))
      writeFileSync(join(raiz, 'nulo.txt'), Buffer.concat([Buffer.from([0]), Buffer.from(`TOKEN=${token}\n`)]))
      ajuda.git()
    }
  },
  {
    // 🚨 A quarta classe: o git põe entre aspas e ESCAPA o caminho fora do
    // ASCII, e `produção.env` escaparia da leitura do blob no histórico.
    nome: 'histórico: arquivo com ACENTO no nome, em UTF-16, reprova',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /hist[oó]rico[\s\S]*produção\.env/,
    planta (raiz, stack, ajuda) {
      const utf16 = (t) => Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(t, 'utf16le')])
      writeFileSync(join(raiz, 'produção.env'), utf16(`TOKEN=sk_live_${'A1b2C3d4E5f6G7h8I9j0'}\n`))
      ajuda.git()
      rmSync(join(raiz, 'produção.env'))
      ajuda.escreve('src/b.ts', 'export const b = 1\n')
      ajuda.git()
    }
  },
  {
    // 🚨 Com aspa no nome o git ESCAPA o caminho mesmo com
    // `core.quotePath=false`, o `cat-file` por caminho responde `missing`, e o
    // blob sumiria calado. O Windows não cria esse arquivo, e por
    // isso ele entra pelo encanamento do git, direto no índice.
    nome: 'histórico: binário com ASPA no nome, apagado depois, reprova',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /hist[oó]rico[\s\S]*dados\/a/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('src/a.ts', 'export const a = 1\n')
      ajuda.git()
      const conteudo = Buffer.concat([Buffer.from([0]), Buffer.from(`TOKEN=ghp_${'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7'}\n`)])
      const id = spawnSync('git', ['hash-object', '-w', '--stdin'], { cwd: raiz, input: conteudo, encoding: 'utf8' }).stdout.trim()
      git(raiz, 'update-index', '--add', '--cacheinfo', `100644,${id},dados/a"b.db`)
      git(raiz, 'commit', '-qm', 'binario com aspa')
      git(raiz, 'rm', '-q', '--cached', 'dados/a"b.db')
      git(raiz, 'commit', '-qm', 'apaga')
    }
  },
  {
    // 🚨 Com a codificação colada na frente, o limite de palavra antes do
    // prefixo não casa. Na árvore e no histórico.
    nome: 'chave com codificação de URL ou escape de JSON colado na frente reprova',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /^(?=[\s\S]*log\.txt:1)(?=[\s\S]*log\.txt:2)(?=[\s\S]*creds\.json:1)(?=[\s\S]*creds\.json:2)(?=[\s\S]*creds\.json:3)(?=[\s\S]*hist[oó]rico[\s\S]*velho\.json)/,
    planta (raiz, stack, ajuda) {
      const ghp = `ghp_${'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7'}`
      ajuda.escreve('velho.json', `{"x":"linha\\n${ghp}"}\n`)
      ajuda.git()
      rmSync(join(raiz, 'velho.json'))
      ajuda.escreve('log.txt', `auth=Bearer%20${SK}\nnext=%2Fapi%3Ftoken%3D${ghp}\n`)
      // ⚠️ O `=` é como o `encoding/json` do Go escreve o `=`, e o `\t` é o
      // outro escape comum: os dois com prova própria.
      ajuda.escreve('creds.json', `{"creds":"linha\\nAKIA${'ABCDEFGHIJ234567'}"}\n{"b":"x\\u003d${ghp}"}\n{"c":"a\\tAKIA${'ZYXWVUTSRQ765432'}"}\n`)
      ajuda.git()
    }
  },
  {
    // 🚨 A mesma família, em mais três formas.
    // URL codificada DUAS vezes, quoted-printable de e-mail, e escape hexadecimal.
    nome: 'chave em URL codificada duas vezes, em quoted-printable e em escape hexadecimal reprova',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /^(?=[\s\S]*dupla\.txt)(?=[\s\S]*msg\.eml)(?=[\s\S]*hex\.py)/,
    planta (raiz, stack, ajuda) {
      const ghp = `ghp_${'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7'}`
      ajuda.escreve('dupla.txt', `next=%252Fapi%253Ftoken%253D${SK}\n`)
      ajuda.escreve('msg.eml', `<a href=3D"https://x/?t=3D${ghp}">entrar</a>\n`)
      ajuda.escreve('hex.py', `x = b"auth\\x3d${ghp}"\n`)
      ajuda.git()
    }
  },
  {
    // O par: desfazer a codificação não pode transformar palavra comum em chave,
    // nem codificada duas vezes.
    nome: 'texto comum com traço e codificação não vira chave (disk-..., %2Ftask-..., %252Ftask-...)',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.escreve('log.txt', 'https://x.com/disk-usage-monitoring-report-2026-09\nnext=%2Ftask-queue-processor-2026-09-18-abcdef\nvolta=%252Fdisk-usage-monitoring-report-2026-09-abc\n')
      ajuda.git()
    }
  },
  {
    // 🚨 Com o `-- .` o git descarta o commit VAZIO e o merge `--no-ff` de
    // árvore igual, e as mensagens deles passariam.
    nome: 'chave na mensagem de um commit VAZIO e de um merge --no-ff reprova',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /^(?=[\s\S]*\(mensagem\) — chave da OpenAI)(?=[\s\S]*\(mensagem\) — token do GitHub)/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('src/a.ts', 'export const a = 1\n')
      ajuda.git()
      git(raiz, 'commit', '-q', '--allow-empty', '-m', `dispara o CI com ${SK}`)
      const principal = git(raiz, 'rev-parse', '--abbrev-ref', 'HEAD')
      git(raiz, 'checkout', '-q', '-b', 'f')
      ajuda.escreve('src/b.ts', 'export const b = 1\n')
      git(raiz, 'add', '-A')
      git(raiz, 'commit', '-qm', 'feat')
      git(raiz, 'checkout', '-q', principal)
      git(raiz, 'merge', '-q', '--no-ff', 'f', '-m', `merge com ghp_${'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7'}`)
    }
  },
  {
    // 🚨 A MENSAGEM de commit e a de tag anotada vão em todo clone, e o diff
    // não as mostra.
    nome: 'chave numa MENSAGEM de commit ou de tag reprova',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /^(?=[\s\S]*\(mensagem\))(?=[\s\S]*\(tag\))/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('src/a.ts', 'export const a = 1\n')
      ajuda.git()
      ajuda.escreve('src/b.ts', 'export const b = 1\n')
      git(raiz, 'add', '-A')
      git(raiz, 'commit', '-qm', `troca a chave para ${SK}`)
      git(raiz, 'tag', '-a', 'v1', '-m', `chave do deploy ghp_${'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7'}`)
    }
  },
  {
    // 🚨 O `--no-textconv` segura isto, e é este caso que falha sem ele. O `textconv` fica no config LOCAL do mundo
    // plantado, e roda igual no Windows e no Linux.
    nome: 'histórico: textconv local NÃO esconde a chave de um binário apagado',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /hist[oó]rico[\s\S]*oculto\.bin/,
    planta (raiz, stack, ajuda) {
      const utf16 = (t) => Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(t, 'utf16le')])
      ajuda.escreve('src/a.ts', 'export const a = 1\n')
      ajuda.escreve('.gitattributes', 'oculto.bin diff=oculto\n')
      writeFileSync(join(raiz, 'oculto.bin'), utf16(`TOKEN=ghp_${'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7'}\n`))
      ajuda.git()
      git(raiz, 'config', 'diff.oculto.textconv', 'echo vazio')
      git(raiz, 'rm', '-q', 'oculto.bin')
      git(raiz, 'commit', '-qm', 'apaga')
    }
  },
  {
    // O par: a marca de isenção dentro de um
    // blob UTF-16 do histórico vale, como vale na árvore.
    nome: 'histórico: marca de isenção DENTRO de um UTF-16 vale',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      const utf16 = (t) => Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(t, 'utf16le')])
      ajuda.escreve('src/a.ts', 'export const a = 1\n')
      writeFileSync(join(raiz, 'x.png'), utf16(`// segredo de exemplo: chave falsa do teste\nTOKEN=sk_live_${'A1b2C3d4E5f6G7h8I9j0'}\n`))
      ajuda.git()
      rmSync(join(raiz, 'x.png'))
      ajuda.git()
    }
  },
  {
    // O par: sem o comprimento mínimo do commit, uma declaração com
    // `commit: ''` valeria para o arquivo inteiro.
    nome: 'histórico: declaração com commit VAZIO não vale',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /hist[oó]rico[\s\S]*src\/a\.ts/,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ SEGREDOS_DO_HISTORICO: [{ arquivo: 'src/a.ts', commit: '', razao: 'chave falsa de teste' }] })
      ajuda.escreve('src/a.ts', `const k = "${SK}"\n`)
      ajuda.git()
      rmSync(join(raiz, 'src', 'a.ts'))
      ajuda.escreve('src/b.ts', 'export const b = 1\n')
      ajuda.git()
    }
  },
  {
    nome: 'projeto sem git é NÃO MEDIDO, nunca verde',
    stacks: ['node'],
    args: ['--historico'],
    espera: 'vermelho',
    cita: /não medido|git/i,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('src/a.ts', 'export const a = 1\n')
    }
  },
  {
    // 🚨 O histórico fica fora do portão LOCAL: num repositório grande ele custa
    // quase todo o tempo do conferidor, e no CI
    // quem o varre é o gitleaks, com fetch-depth: 0. Sem --historico, a chave
    // apagada num commit antigo não é vista AQUI, e o conferidor diz onde é.
    nome: 'sem --historico: a chave commitada e apagada não é vista aqui (roda no CI)',
    stacks: ['node'],
    espera: 'verde',
    cita: /histórico[\s\S]*não foi varrido aqui/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('src/a.ts', `export const CHAVE = "${CHAVE_REAL}"\n`)
      ajuda.git()
      ajuda.escreve('src/a.ts', 'export const CHAVE = process.env.CHAVE\n')
      ajuda.git()
    }
  },
  {
    nome: 'sem --historico: a chave na ÁRVORE continua reprovando',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /src\/a\.ts/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('src/a.ts', `export const CHAVE = "${CHAVE_REAL}"\n`)
      ajuda.git()
    }
  },
  {
    // ⚠️ A mensagem de commit continua no script sempre: o gitleaks não a lê.
    nome: 'sem --historico: a chave numa MENSAGEM de commit continua reprovando',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /\(mensagem\)/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('src/a.ts', 'export const a = 1\n')
      ajuda.git()
      git(raiz, 'commit', '-q', '--allow-empty', '-m', `troca a chave ${CHAVE_REAL}`)
    }
  }
]
