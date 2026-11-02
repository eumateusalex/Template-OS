// O leitor de métricas do Instagram, contra uma API de mentira: as credenciais
// (sem --conta, o scripts/.env e a conta que ele declara; com --conta, o
// scripts/.env.<conta>), de quem é o token, o host da API conferido, o resumo
// da conta, a linha de cada post com as taxas, a métrica que a Meta recusa (nos
// dois formatos de erro dela, uma vez só), o fuso do dia do arquivo, o token
// invalidado que sai 3 com o passo a passo da renovação, o token que nunca
// aparece e o código sem caminho de máquina. Nada aqui fala com a Meta.
//
// Rodar: node --test scripts/instagram/insights.test.mjs
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, test } from "node:test"
import { fileURLToPath } from "node:url"

import { ErroDaMeta, arquivoDaConta, credenciais, diaNoFuso, fusoConferido, getDeVerdade, lerInsights, principal, taxas } from "./insights.mjs"

const pastas = []
afterEach(() => {
  for (const p of pastas.splice(0)) rmSync(p, { recursive: true, force: true })
})
const pasta = () => {
  const p = mkdtempSync(join(tmpdir(), "insights-"))
  pastas.push(p)
  return p
}

const TOKEN = "IGAAsegredo123" // gitleaks:allow (token falso do teste)
const CONTA = "conta.exemplo"

/** Uma raiz de mentira com o arquivo de credencial: `null` é o scripts/.env. */
function raizCom(conta, linhas) {
  const raiz = pasta()
  mkdirSync(join(raiz, "scripts"))
  writeFileSync(join(raiz, "scripts", conta ? `.env.${conta}` : ".env"), linhas.join("\n"))
  return raiz
}

test("sem conta é o scripts/.env; com conta, o scripts/.env.<conta>; a fora do formato é recusada", () => {
  assert.equal(arquivoDaConta(null, "R"), join("R", "scripts", ".env"))
  assert.equal(arquivoDaConta(CONTA, "R"), join("R", "scripts", `.env.${CONTA}`))
  for (const ruim of ["", "../x", "a..b", "a/b", "a b", "Maiuscula"])
    assert.throws(() => arquivoDaConta(ruim, "R"), /conta/, String(ruim))
})

test("as credenciais devolvem o token, a conta e a base com o endereço e a versão do arquivo", () => {
  const raiz = raizCom(CONTA, [
    `  INSTAGRAM_ACCESS_TOKEN='${TOKEN}'   # o token`,
    `INSTAGRAM_CONTA=${CONTA}`,
    "OUTRA_CHAVE=nao-vem",
    "META_API_BASE=https://graph.facebook.com/",
    "META_API_VERSION=v99.0",
  ])
  assert.deepEqual(credenciais(CONTA, raiz), { token: TOKEN, conta: CONTA, base: "https://graph.facebook.com/v99.0" })
  assert.throws(() => credenciais("semarquivo", raiz), /não existe/)
})

test("sem --conta, a conta é a que o scripts/.env declara, e sem ela não se lê", () => {
  const raiz = raizCom(null, [`INSTAGRAM_ACCESS_TOKEN=${TOKEN}`, `INSTAGRAM_CONTA=${CONTA}   # o @`])
  assert.deepEqual(credenciais(null, raiz), { token: TOKEN, conta: CONTA, base: "https://graph.instagram.com/v23.0" })
  const semConta = raizCom(null, [`INSTAGRAM_ACCESS_TOKEN=${TOKEN}`, "INSTAGRAM_CONTA=   # o @ desta conta"])
  assert.throws(() => credenciais(null, semConta), /INSTAGRAM_CONTA/)
})

test("a linha do .env se lê como o publicador lê: espaço em volta do =, e sem endereço, o padrão da Graph", () => {
  const raiz = raizCom("outra.conta", [`INSTAGRAM_ACCESS_TOKEN = ${TOKEN}`])
  assert.deepEqual(credenciais("outra.conta", raiz), { token: TOKEN, conta: "outra.conta", base: "https://graph.instagram.com/v23.0" })
})

test("o endereço da API fora dos hosts da Graph é recusado antes de levar o token", () => {
  const raiz = raizCom(CONTA, [`INSTAGRAM_ACCESS_TOKEN=${TOKEN}`, "META_API_BASE=https://evil.test"])
  assert.throws(() => credenciais(CONTA, raiz), /META_API_BASE aponta para https:\/\/evil\.test/)
})

test("o arquivo que diz ser de outra conta é recusado antes de qualquer pedido", () => {
  const raiz = raizCom(CONTA, [`INSTAGRAM_ACCESS_TOKEN=${TOKEN}`, "INSTAGRAM_CONTA=segunda.conta"])
  assert.throws(() => credenciais(CONTA, raiz), /é da conta segunda\.conta/)
})

test("o pedido de verdade devolve o erro da Meta como ErroDaMeta, sem o token, nem solto", async () => {
  let pedida = ""
  const fetch = async (url) => {
    pedida = String(url)
    return new Response(JSON.stringify({ error: { code: 190, message: `token ${TOKEN} invalidado` } }), { status: 400 })
  }
  const get = getDeVerdade({ token: TOKEN, base: "https://graph.instagram.com/v23.0" }, fetch)
  await assert.rejects(get("me", { fields: "username" }), (e) => e instanceof ErroDaMeta && e.codigo === 190 && !e.message.includes(TOKEN))
  assert.match(pedida, /^https:\/\/graph\.instagram\.com\/v23\.0\/me\?fields=username&access_token=/)
})

test("o dia do arquivo é o do fuso pedido, não o do UTC", () => {
  assert.equal(diaNoFuso(Date.parse("2026-10-22T02:36:00Z"), "America/Sao_Paulo"), "2026-10-21")
  assert.equal(diaNoFuso(Date.parse("2026-10-22T03:01:00Z"), "America/Sao_Paulo"), "2026-10-22")
  assert.equal(diaNoFuso(Date.parse("2026-10-22T02:36:00Z"), "UTC"), "2026-10-22")
})

test("o fuso vem do --fuso, depois do INSTAGRAM_FUSO, depois da máquina; o inválido é recusado", () => {
  assert.equal(fusoConferido("Asia/Tokyo", { INSTAGRAM_FUSO: "UTC" }), "Asia/Tokyo")
  assert.equal(fusoConferido(undefined, { INSTAGRAM_FUSO: "Europe/Lisbon" }), "Europe/Lisbon")
  assert.equal(fusoConferido(undefined, {}), Intl.DateTimeFormat().resolvedOptions().timeZone)
  assert.throws(() => fusoConferido("Marte/Base", {}), /fuso/)
})

test("as taxas são por alcance, em porcentagem com uma casa", () => {
  assert.deepEqual(taxas({ reach: 200, shares: 7, saved: 4, likes: 11, comments: 1 }), { envio: 3.5, salvamento: 2, curtida: 5.5, comentario: 0.5 })
  assert.deepEqual(taxas({ reach: 0, shares: 1 }), { envio: null, salvamento: null, curtida: null, comentario: null })
})

/** A API de mentira: responde pelo caminho, e anota os pedidos. */
function apiDe(respostas) {
  const pedidos = []
  const get = async (caminho, params = {}) => {
    pedidos.push({ caminho, params })
    const r = respostas[caminho]
    const valor = typeof r === "function" ? r(params) : r
    if (valor instanceof ErroDaMeta) throw valor
    if (valor === undefined) throw new Error(`a API de mentira não sabe ${caminho}`)
    return valor
  }
  get.pedidos = pedidos
  return get
}

const total = (nome, v) => ({ name: nome, total_value: { value: v } })
const vida = (nome, v) => ({ name: nome, values: [{ value: v }] })

const API = {
  me: { username: CONTA, followers_count: 828, media_count: 2 },
  "me/insights": { data: [total("views", 139), total("reach", 60), total("profile_views", 9)] },
  "me/media": {
    data: [
      { id: "1", timestamp: "2026-10-20T05:33:35+0000", media_type: "CAROUSEL_ALBUM", media_product_type: "FEED", permalink: "https://exemplo.invalid/p/A/", caption: "a legenda" },
      { id: "2", timestamp: "2026-10-19T05:33:35+0000", media_type: "VIDEO", media_product_type: "REELS", permalink: "https://exemplo.invalid/reel/B/", caption: "" },
    ],
  },
  "1/insights": { data: [vida("views", 300), vida("reach", 200), vida("shares", 7), vida("saved", 4), vida("likes", 11), vida("comments", 1), vida("follows", 3)] },
  "2/insights": { data: [vida("views", 50), vida("reach", 40), vida("ig_reels_avg_watch_time", 12000), vida("reels_skip_rate", 61.2)] },
}
const ler = (get, extra = {}) => lerInsights({ get, conta: CONTA, dias: 7, limite: 10, agora: Date.parse("2026-10-21T12:00:00Z"), ...extra })

test("o resumo da conta e uma linha por post, com as taxas e o reel com o tempo assistido", async () => {
  const get = apiDe(API)
  const r = await ler(get)
  assert.equal(r.conta.usuario, CONTA)
  assert.equal(r.conta.seguidores, 828)
  assert.deepEqual(r.conta.metricas, { views: 139, reach: 60, profile_views: 9 })
  assert.equal(r.posts.length, 2)
  assert.equal(r.posts[0].tipo, "carrossel")
  assert.equal(r.posts[0].metricas.follows, 3)
  assert.equal(r.posts[0].taxas.envio, 3.5)
  assert.equal(r.posts[1].tipo, "reel")
  assert.equal(r.posts[1].metricas.reels_skip_rate, 61.2)
  assert.match(get.pedidos.find((p) => p.caminho === "2/insights").params.metric, /ig_reels_avg_watch_time/)
  assert.equal(get.pedidos.find((p) => p.caminho === "me/insights").params.since, String(Date.parse("2026-10-14T12:00:00Z") / 1000))
})

test("o token que a Meta diz ser de outro usuário é recusado antes de ler o resto", async () => {
  const get = apiDe({ ...API, me: { username: "segunda.conta", followers_count: 5, media_count: 60 } })
  await assert.rejects(ler(get), /o token é da conta @segunda\.conta, não de @conta\.exemplo/)
  assert.deepEqual(get.pedidos.map((p) => p.caminho), ["me"])
})

test("o id de mídia fora do formato não vira caminho: o post fica de fora, dito", async () => {
  const get = apiDe({ ...API, "me/media": { data: [{ ...API["me/media"].data[0], id: "../me" }, API["me/media"].data[1]] } })
  const r = await ler(get)
  assert.deepEqual(r.posts.map((p) => p.id), ["2"])
  assert.deepEqual(r.ignorados, ["../me"])
  assert.ok(!get.pedidos.some((p) => p.caminho.includes("..")))
})

test("a métrica que a Meta recusa sai e o pedido volta uma vez, nos dois formatos do erro", async () => {
  for (const mensagem of [
    "metric[3] must be one of the following values: views, reach, likes",
    "Instagram Insights Media API endpoint does not support the metrics: shares, saved, comments, total_interactions, follows, profile_visits. Please refer to the docs",
  ]) {
    let tentativas = 0
    const get = apiDe({
      ...API,
      "1/insights": (params) => {
        tentativas += 1
        if (tentativas === 1) return new ErroDaMeta(100, mensagem)
        assert.doesNotMatch(params.metric, /shares|saved|comments/)
        return { data: [vida("views", 3), vida("reach", 1), vida("likes", 0)] }
      },
    })
    const r = await ler(get)
    assert.equal(tentativas, 2, mensagem)
    assert.deepEqual(r.posts[0].metricas, { views: 3, reach: 1, likes: 0 })
  }
})

test("a segunda recusa, mesmo de outra métrica, não volta: é uma vez só", async () => {
  let tentativas = 0
  const get = apiDe({
    ...API,
    "1/insights": () => {
      tentativas += 1
      return new ErroDaMeta(100, `does not support the metrics: ${tentativas === 1 ? "shares" : "saved"}.`)
    },
  })
  await assert.rejects(ler(get), /does not support the metrics: saved/)
  assert.equal(tentativas, 2)
})

test("o erro que não é de métrica recusada não volta", async () => {
  for (const erro of [new ErroDaMeta(4, "limite de pedidos"), new ErroDaMeta(100, "parâmetro errado, sem lista")]) {
    let tentativas = 0
    const get = apiDe({ ...API, "1/insights": () => ((tentativas += 1), erro) })
    await assert.rejects(ler(get), (e) => e === erro)
    assert.equal(tentativas, 1, erro.message)
  }
})

/** A linha de comando com a API injetada: a raiz, a pasta de saída, o fuso e o get. */
const cli = (argv, raiz, get) =>
  principal(argv, { raiz, saida: join(raiz, "saida"), getPara: () => get, agora: Date.parse("2026-10-22T02:36:00Z"), ambiente: { INSTAGRAM_FUSO: "America/Sao_Paulo" } })

test("a linha de comando grava a leitura no dia do fuso e imprime a tabela", async () => {
  const raiz = raizCom(CONTA, [`INSTAGRAM_ACCESS_TOKEN=${TOKEN}`])
  const [codigo, texto] = await cli(["--conta", CONTA, "--dias", "7"], raiz, apiDe(API))
  assert.equal(codigo, 0, texto)
  assert.match(texto, /@conta\.exemplo · 828 seguidores/)
  assert.match(texto, /\| 2026-10-20 \| carrossel \| 300 \| 200 \| 3\.5 \|/)
  const [arquivo] = readdirSync(join(raiz, "saida", CONTA))
  assert.equal(arquivo, "2026-10-21.json")
  assert.equal(readFileSync(join(raiz, "saida", CONTA, arquivo), "utf8").includes(TOKEN), false)
})

test("sem --conta, lê o scripts/.env e grava na pasta da conta que ele declara", async () => {
  const raiz = raizCom(null, [`INSTAGRAM_ACCESS_TOKEN=${TOKEN}`, `INSTAGRAM_CONTA=${CONTA}`])
  const [codigo, texto] = await cli(["--fuso", "UTC"], raiz, apiDe(API))
  assert.equal(codigo, 0, texto)
  assert.deepEqual(readdirSync(join(raiz, "saida", CONTA)), ["2026-10-22.json"])
})

test("a pasta de saída padrão é a dados/insights/ do workspace, fora do git", async () => {
  const raiz = raizCom(CONTA, [`INSTAGRAM_ACCESS_TOKEN=${TOKEN}`])
  const [codigo, texto] = await principal(["--conta", CONTA], { raiz, getPara: () => apiDe(API), agora: Date.parse("2026-10-21T12:00:00Z"), ambiente: { INSTAGRAM_FUSO: "UTC" } })
  assert.equal(codigo, 0, texto)
  assert.ok(existsSync(join(raiz, "dados", "insights", CONTA, "2026-10-21.json")))
})

test("o token invalidado (190) sai 3 com o passo a passo da renovação daquele arquivo, sem gravar nada", async () => {
  for (const [conta, linhas, args, passo] of [
    [null, [`INSTAGRAM_ACCESS_TOKEN=${TOKEN}`, `INSTAGRAM_CONTA=${CONTA}`], [], /scripts\/\.env\b(?!\.)/],
    [CONTA, [`INSTAGRAM_ACCESS_TOKEN=${TOKEN}`], ["--conta", CONTA], /scripts\/\.env\.conta\.exemplo/],
  ]) {
    const raiz = raizCom(conta, linhas)
    const [codigo, texto] = await cli(args, raiz, apiDe({ ...API, me: new ErroDaMeta(190, "Error validating access token") }))
    assert.equal(codigo, 3, String(conta))
    assert.match(texto, /modo conexão do \/instagram-publisher/)
    assert.match(texto, passo, String(conta))
    assert.equal(existsSync(join(raiz, "saida")), false)
  }
})

test("o token de outra conta sai 2, sem gravar nada", async () => {
  const raiz = raizCom(CONTA, [`INSTAGRAM_ACCESS_TOKEN=${TOKEN}`])
  const [codigo, texto] = await cli(["--conta", CONTA], raiz, apiDe({ ...API, me: { username: "outra" } }))
  assert.equal(codigo, 2)
  assert.match(texto, /é da conta @outra/)
  assert.equal(existsSync(join(raiz, "saida")), false)
})

test("o fuso inválido sai 2 antes de qualquer pedido", async () => {
  const raiz = raizCom(CONTA, [`INSTAGRAM_ACCESS_TOKEN=${TOKEN}`])
  const get = apiDe(API)
  const [codigo, texto] = await cli(["--conta", CONTA, "--fuso", "Marte/Base"], raiz, get)
  assert.equal(codigo, 2)
  assert.match(texto, /fuso/)
  assert.equal(get.pedidos.length, 0)
})

const CLI = fileURLToPath(new URL("./insights.mjs", import.meta.url))
test("a linha de comando com conta fora do formato ou argumento que não existe sai 2, cada uma dizendo a causa", () => {
  for (const [args, causa] of [[["--conta", "../x"], /só letras minúsculas/], [["--nada"], /não existe/]]) {
    const r = spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8" })
    assert.equal(r.status, 2, `${args.join(" ")}: ${r.stderr}`)
    assert.match(r.stderr, /^uso errado/)
    assert.match(r.stderr, causa)
  }
})

test("a conta sem o arquivo de credencial sai 4, como conta não conectada, apontando o modo conexão", () => {
  const r = spawnSync(process.execPath, [CLI, "--conta", "nao.existe.nunca"], { encoding: "utf8" })
  assert.equal(r.status, 4, r.stderr)
  assert.match(r.stderr, /^conta não conectada: o arquivo de credencial scripts\/\.env\.nao\.existe\.nunca não existe/)
  assert.match(r.stderr, /modo conexão do \/instagram-publisher/)
  assert.match(r.stderr, /grava o token no scripts\/\.env\.nao\.existe\.nunca/)
  assert.doesNotMatch(r.stderr, /uso errado|Uso:/)
})

test("sem --conta e sem o scripts/.env, sai 4 e aponta o scripts/.env, sem pedir nada à Meta", async () => {
  const raiz = pasta()
  const get = apiDe(API)
  const [codigo, texto] = await cli([], raiz, get)
  assert.equal(codigo, 4, texto)
  assert.match(texto, /^conta não conectada: o arquivo de credencial scripts\/\.env não existe/)
  assert.match(texto, /grava o token no scripts\/\.env\./)
  assert.equal(get.pedidos.length, 0)
})

test("a recusa de uma métrica que nem foi pedida não repete o mesmo pedido", async () => {
  let tentativas = 0
  const get = apiDe({ ...API, "1/insights": () => ((tentativas += 1), new ErroDaMeta(100, "does not support the metrics: impressions.")) })
  await assert.rejects(ler(get), /impressions/)
  assert.equal(tentativas, 1)
})

test("o outro erro da Meta sai 1 dizendo o erro, sem o token e sem gravar nada", async () => {
  const raiz = raizCom(CONTA, [`INSTAGRAM_ACCESS_TOKEN=${TOKEN}`])
  const [codigo, texto] = await cli(["--conta", CONTA], raiz, apiDe({ ...API, "me/insights": new ErroDaMeta(4, `limite de pedidos para o token ${TOKEN}`) }))
  assert.equal(codigo, 1)
  assert.match(texto, /a Meta respondeu: limite de pedidos/)
  assert.equal(texto.includes(TOKEN), false)
  assert.doesNotMatch(texto, /renovar/)
  assert.equal(existsSync(join(raiz, "saida")), false)
})

test("a recusa com lista, mas com um código que não é 100, não volta", async () => {
  let tentativas = 0
  const get = apiDe({ ...API, "1/insights": () => ((tentativas += 1), new ErroDaMeta(10, "does not support the metrics: shares.")) })
  await assert.rejects(ler(get), /shares/)
  assert.equal(tentativas, 1)
})

test("a taxa arredonda para uma casa", () => {
  assert.equal(taxas({ reach: 3, shares: 2 }).envio, 66.7)
})

test("o --limite chega ao pedido dos posts", async () => {
  const raiz = raizCom(CONTA, [`INSTAGRAM_ACCESS_TOKEN=${TOKEN}`])
  const get = apiDe(API)
  const [codigo] = await cli(["--conta", CONTA, "--limite", "7"], raiz, get)
  assert.equal(codigo, 0)
  assert.equal(get.pedidos.find((p) => p.caminho === "me/media").params.limit, "7")
})

test("o perfil vem inteiro da API: nome, bio, site e foto, sem depender do navegador", async () => {
  const get = apiDe({ ...API, me: { ...API.me, name: "Conta Exemplo", biography: "linha 1\nlinha 2", website: "https://exemplo.invalid", profile_picture_url: "https://exemplo.invalid/x.jpg" } })
  const r = await ler(get)
  assert.deepEqual(r.conta.perfil, { nome: "Conta Exemplo", bio: "linha 1\nlinha 2", site: "https://exemplo.invalid", foto: "https://exemplo.invalid/x.jpg" })
  assert.match(get.pedidos[0].params.fields, /biography/)
})

test("o código não carrega caminho de máquina nem fuso fixo", () => {
  const codigo = readFileSync(CLI, "utf8")
  assert.doesNotMatch(codigo, /\b[A-Za-z]:[\\/]/, "caminho de disco")
  assert.doesNotMatch(codigo, /\/(Users|home)\//, "pasta de usuário")
  assert.doesNotMatch(codigo, /timeZone:\s*["']/, "fuso escrito no código")
})
