// node scripts/instagram/insights.mjs [--conta <conta>] [--dias 30] [--limite 50] [--fuso <IANA>] [--saida <pasta>] [--json]
//
// O leitor de métricas do Instagram, só leitura, pela Graph API que o
// publicador já usa: o que a conta alcançou no período e, por post, as
// visualizações, o alcance, os salvamentos, os envios, as curtidas, os
// comentários, os seguidores que o post trouxe e as visitas ao perfil, com as
// taxas por alcance. Grava em `dados/insights/<conta>/<AAAA-MM-DD>.json` (fora
// do git) e imprime a tabela. É o dado da `leitura` e da `auditoria` da skill
// `/instagram`.
//
// Sem `--conta`, lê o `scripts/.env`, e a conta é a que ele declara em
// `INSTAGRAM_CONTA`; com `--conta <nome>`, o `scripts/.env.<nome>`, como o
// publicador. Do arquivo só se leem o token, o endereço e a versão da API e a
// conta declarada. O acesso à Graph API tem um dono, o `publish.js` do
// `/instagram-publisher`: daqui se usam o `baseConferida` (só os hosts da
// Graph), o `linhaDoEnv` e o `semToken` dele, sem cópia.
//
// O dia do arquivo é o do fuso: `--fuso`, senão a variável `INSTAGRAM_FUSO`,
// senão o da máquina.
//
// 🚨 De quem é o token se confere nas duas pontas: a conta que o arquivo declara
// e o usuário que a Meta devolve ao vivo têm que ser a conta pedida, ou nada se
// grava. O token nunca aparece na saída.
//
// Os desfechos: 0 leu; 1 a Meta respondeu outro erro; 2 uso errado, conta fora
// do formato, fuso inválido ou token de outra conta; 3 o token está vencido ou
// invalidado (190); 4 a conta ainda não foi conectada (o arquivo de credencial
// não existe), com o caminho do modo conexão do `/instagram-publisher`.
//
// Prova: scripts/instagram/insights.test.mjs
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join, resolve } from "node:path"

import {
  GRAPH_PADRAO,
  HOSTS_DA_GRAPH,
  VERSAO_PADRAO,
  baseConferida,
  linhaDoEnv,
  semToken,
} from "../../.claude/skills/instagram-publisher/scripts/publish.js"

const RAIZ = resolve(import.meta.dirname, "..", "..")

/** As métricas da conta no período (somadas pela própria API). */
const DA_CONTA = ["views", "reach", "accounts_engaged", "total_interactions", "profile_views", "profile_links_taps", "follows_and_unfollows"]

/** As métricas por post; o reel ganha o tempo assistido e a taxa de pulo. */
const DO_POST = ["views", "reach", "saved", "shares", "likes", "comments", "total_interactions", "follows", "profile_visits"]
const DO_REEL = [...DO_POST, "ig_reels_avg_watch_time", "reels_skip_rate"]

const TIPOS = { CAROUSEL_ALBUM: "carrossel", IMAGE: "foto", VIDEO: "vídeo" }
const ID_DE_MIDIA = /^\d{1,30}$/
const FORMATO_DA_CONTA = /^[a-z0-9._]{1,30}$/

/** O erro que a Meta devolveu, com o código dela e a mensagem já sem o token. */
export class ErroDaMeta extends Error {
  constructor(codigo, mensagem) {
    super(mensagem)
    this.codigo = codigo
  }
}

/** O token pertence a outra conta: nada se grava. */
class ContaTrocada extends Error {}

/** O arquivo de credencial não existe: a conta ainda não foi conectada. */
export class ContaNaoConectada extends Error {}

/** O fuso do dia do arquivo: o pedido, o do ambiente ou o da máquina; o inválido é erro. */
export function fusoConferido(pedido, ambiente = process.env) {
  const fuso = pedido || ambiente.INSTAGRAM_FUSO || Intl.DateTimeFormat().resolvedOptions().timeZone
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: fuso })
  } catch {
    throw new Error(`o fuso ${JSON.stringify(fuso)} não existe (use um nome IANA, como America/Sao_Paulo)`)
  }
  return fuso
}

/** O dia AAAA-MM-DD no fuso: o nome do arquivo da leitura. */
export const diaNoFuso = (instante, fuso) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: fuso, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(instante))

/** O arquivo de credencial: sem conta, o scripts/.env; o nome fora do formato vira erro, nunca caminho. */
export function arquivoDaConta(conta, raiz = RAIZ) {
  if (conta === null || conta === undefined) return join(raiz, "scripts", ".env")
  if (!FORMATO_DA_CONTA.test(conta) || conta.includes(".."))
    throw new Error(`a conta tem só letras minúsculas, números, ponto e sublinhado: ${JSON.stringify(conta)}`)
  return join(raiz, "scripts", `.env.${conta}`)
}

/**
 * O token, a conta e a base conferida da API, e nada mais do arquivo. A conta
 * que o arquivo declara (`INSTAGRAM_CONTA`), quando declara, tem que ser a
 * pedida; sem conta pedida, ela é obrigatória.
 */
export function credenciais(conta, raiz = RAIZ) {
  const arquivo = arquivoDaConta(conta, raiz)
  const rotulo = conta ? `scripts/.env.${conta}` : "scripts/.env"
  if (!existsSync(arquivo)) throw new ContaNaoConectada(`o arquivo de credencial ${rotulo} não existe`)
  const valores = {}
  for (const linha of readFileSync(arquivo, "utf8").split(/\r?\n/)) {
    const lida = linhaDoEnv(linha)
    if (lida) valores[lida.chave] = lida.valor
  }
  if (!valores.INSTAGRAM_ACCESS_TOKEN) throw new Error(`o ${rotulo} não tem o INSTAGRAM_ACCESS_TOKEN`)
  const declarada = valores.INSTAGRAM_CONTA || null
  if (conta && declarada && declarada !== conta) throw new Error(`o ${rotulo} é da conta ${declarada}, não de ${conta}`)
  if (!conta && !declarada) throw new Error(`o scripts/.env não declara a conta: preencha INSTAGRAM_CONTA com o @ (sem o @)`)
  const daConta = conta ?? declarada
  arquivoDaConta(daConta, raiz) // a declarada também vira nome de pasta: mesmo formato
  const base = baseConferida(valores.META_API_BASE, "META_API_BASE", GRAPH_PADRAO, HOSTS_DA_GRAPH, "o token")
  return { token: valores.INSTAGRAM_ACCESS_TOKEN, conta: daConta, base: `${base}/${valores.META_API_VERSION || VERSAO_PADRAO}` }
}

/** A taxa por alcance, em porcentagem com uma casa; sem alcance, null. */
const porAlcance = (valor, alcance) => (alcance ? Math.round(((valor ?? 0) / alcance) * 1000) / 10 : null)

/** As taxas que a leitura usa: envio, salvamento, curtida e comentário por alcance. */
export function taxas(m) {
  return {
    envio: porAlcance(m.shares, m.reach),
    salvamento: porAlcance(m.saved, m.reach),
    curtida: porAlcance(m.likes, m.reach),
    comentario: porAlcance(m.comments, m.reach),
  }
}

/**
 * As métricas que sobram depois do erro 100 da Meta, nos dois formatos dela:
 * "must be one of the following values: a, b" e "does not support the
 * metrics: a, b.". Null quando a mensagem não diz o que tirar.
 */
function semAsRecusadas(pedidas, mensagem) {
  const validas = /must be one of the following values: ([^"]+)$/.exec(mensagem)
  if (validas) {
    const lista = new Set(validas[1].split(",").map((s) => s.trim()))
    return pedidas.filter((m) => lista.has(m))
  }
  const recusadas = /does not support the metrics: ([^.]+)\./.exec(mensagem)
  if (!recusadas) return null
  const lista = new Set(recusadas[1].split(",").map((s) => s.trim()))
  return pedidas.filter((m) => !lista.has(m))
}

const valoresDe = (r) => Object.fromEntries((r.data ?? []).map((d) => [d.name, d.total_value?.value ?? d.values?.[0]?.value ?? null]))

/** As métricas de um caminho de insights, tirando uma vez só as que a Meta recusa. */
async function metricas(get, caminho, pedidas, extra = {}) {
  try {
    return valoresDe(await get(caminho, { metric: pedidas.join(","), ...extra }))
  } catch (erro) {
    const sobra = erro instanceof ErroDaMeta && erro.codigo === 100 ? semAsRecusadas(pedidas, erro.message) : null
    if (!sobra?.length || sobra.length === pedidas.length) throw erro
    return valoresDe(await get(caminho, { metric: sobra.join(","), ...extra }))
  }
}

/** A leitura: o resumo da conta nos últimos `dias` e as métricas dos `limite` posts mais novos. */
export async function lerInsights({ get, conta, dias = 30, limite = 50, agora = Date.now() }) {
  const perfil = await get("me", { fields: "username,name,biography,website,profile_picture_url,followers_count,media_count" })
  if (perfil.username !== conta)
    throw new ContaTrocada(`o token é da conta @${perfil.username}, não de @${conta}: o arquivo de credencial está trocado`)
  const ate = Math.floor(agora / 1000)
  const daConta = await metricas(get, "me/insights", DA_CONTA, {
    metric_type: "total_value",
    period: "day",
    since: String(ate - dias * 86400),
    until: String(ate),
  })
  const midias = await get("me/media", { fields: "id,timestamp,media_type,media_product_type,permalink,caption", limit: String(limite) })
  const posts = []
  const ignorados = []
  for (const m of midias.data ?? []) {
    // o id vem da Meta e vira caminho do pedido: só o número entra
    if (!ID_DE_MIDIA.test(String(m.id ?? ""))) {
      ignorados.push(String(m.id))
      continue
    }
    const reel = m.media_product_type === "REELS"
    const daqui = await metricas(get, `${m.id}/insights`, reel ? DO_REEL : DO_POST)
    posts.push({
      id: m.id,
      data: m.timestamp,
      tipo: reel ? "reel" : (TIPOS[m.media_type] ?? m.media_type),
      link: m.permalink,
      legenda: (m.caption ?? "").split("\n")[0].slice(0, 80),
      metricas: daqui,
      taxas: taxas(daqui),
    })
  }
  return {
    conta: {
      usuario: perfil.username,
      // o perfil como o público vê: a auditoria lê daqui, sem navegador
      perfil: { nome: perfil.name ?? null, bio: perfil.biography ?? null, site: perfil.website ?? null, foto: perfil.profile_picture_url ?? null },
      seguidores: perfil.followers_count,
      posts: perfil.media_count,
      dias,
      metricas: daConta,
    },
    posts,
    ignorados,
  }
}

/** O pedido à Graph API; a resposta com erro vira ErroDaMeta sem o token. */
export function getDeVerdade({ token, base }, fetch = globalThis.fetch) {
  return async (caminho, params = {}) => {
    const u = new URL(`${base}/${caminho}`)
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v)
    u.searchParams.set("access_token", token)
    const r = await fetch(u)
    const j = await r.json().catch(() => ({ error: { code: r.status, message: `resposta sem JSON (HTTP ${r.status})` } }))
    if (j.error) throw new ErroDaMeta(j.error.code, semToken(j.error.message, token))
    return j
  }
}

/** O passo a passo da renovação: o mesmo modo conexão, gravando no arquivo daquela conta. */
function comoRenovar(conta) {
  const arquivo = conta ? `scripts/.env.${conta}` : "scripts/.env"
  return [
    "O token desta conta está vencido ou foi invalidado pela Meta. Para renovar (uns 5 minutos):",
    "1. developers.facebook.com → Meus apps → o seu app",
    "2. Instagram → Configuração da API com Login do Instagram",
    "3. Gerar tokens de acesso → Gerar token na linha da conta (faça login se pedir)",
    `4. Grave o token novo pelo modo conexão do /instagram-publisher (.claude/skills/instagram-publisher/conexao.md), no ${arquivo}`,
  ].join("\n")
}

/** A conta sem credencial: não é uso errado, é a conexão que ainda não foi feita. */
function comoConectar(conta, causa) {
  const arquivo = conta ? `scripts/.env.${conta}` : "scripts/.env"
  return [
    `conta não conectada: ${causa}.`,
    "Sem a conexão, nenhuma métrica se lê, e a leitura, a auditoria e a saúde da conta saem como \"não medi\".",
    `Para conectar: o modo conexão do /instagram-publisher (.claude/skills/instagram-publisher/conexao.md), que grava o token no ${arquivo}. Ele pede conta profissional no Instagram e um app na Meta.`,
  ].join("\n")
}

const celula = (v) => (v === null || v === undefined ? "·" : String(v))

function tabela(r, dias, arquivo) {
  return [
    `@${r.conta.usuario} · ${r.conta.seguidores} seguidores · ${r.conta.posts} posts · últimos ${dias} dias: ${Object.entries(r.conta.metricas).map(([k, v]) => `${k} ${v}`).join(", ")}`,
    `nome: ${celula(r.conta.perfil.nome)} · site: ${celula(r.conta.perfil.site)}`,
    `bio: ${celula(r.conta.perfil.bio).replace(/\n/g, " / ")}`,
    "",
    "| data | tipo | views | alcance | envio % | salv. % | curt. % | coment. % | seguidores | visitas | link |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...r.posts.map((p) => `| ${p.data.slice(0, 10)} | ${p.tipo} | ${celula(p.metricas.views)} | ${celula(p.metricas.reach)} | ${celula(p.taxas.envio)} | ${celula(p.taxas.salvamento)} | ${celula(p.taxas.curtida)} | ${celula(p.taxas.comentario)} | ${celula(p.metricas.follows)} | ${celula(p.metricas.profile_visits)} | ${p.link} |`),
    ...(r.ignorados.length ? ["", `ficaram de fora (id fora do formato): ${r.ignorados.join(", ")}`] : []),
    "",
    `gravado em ${arquivo}`,
  ].join("\n")
}

const USO = "Uso: node scripts/instagram/insights.mjs [--conta <conta>] [--dias 30] [--limite 50] [--fuso <IANA>] [--saida <pasta>] [--json]"

/**
 * A linha de comando: devolve [código, texto]. `getPara`, `raiz`, `saida`,
 * `agora` e `ambiente` entram para o teste; de verdade, o pedido à Meta e a
 * pasta `dados/insights/` do workspace.
 */
export async function principal(argv, { raiz = RAIZ, saida, getPara = getDeVerdade, agora = Date.now(), ambiente = process.env } = {}) {
  const o = {}
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--json") o.json = true
    else if (["--conta", "--dias", "--limite", "--fuso", "--saida"].includes(argv[i]) && argv[i + 1] !== undefined) o[argv[i].slice(2)] = argv[++i]
    else return [2, `uso errado: ${argv[i]} não existe. ${USO}`]
  }
  const dias = Number(o.dias ?? 30)
  const limite = Number(o.limite ?? 50)
  let cred, fuso
  try {
    if (!Number.isInteger(dias) || dias < 1 || !Number.isInteger(limite) || limite < 1) throw new Error("--dias e --limite pedem número inteiro")
    fuso = fusoConferido(o.fuso, ambiente)
    cred = credenciais(o.conta ?? null, raiz)
  } catch (erro) {
    if (erro instanceof ContaNaoConectada) return [4, comoConectar(o.conta ?? null, erro.message)]
    return [2, `uso errado: ${erro.message}. ${USO}`]
  }
  try {
    const r = await lerInsights({ get: getPara(cred), conta: cred.conta, dias, limite, agora })
    const pasta = join(o.saida ?? saida ?? join(raiz, "dados", "insights"), cred.conta)
    mkdirSync(pasta, { recursive: true })
    const arquivo = join(pasta, `${diaNoFuso(agora, fuso)}.json`)
    writeFileSync(arquivo, `${JSON.stringify(r, null, 2)}\n`)
    return [0, o.json ? JSON.stringify(r, null, 2) : tabela(r, dias, arquivo)]
  } catch (erro) {
    if (erro instanceof ContaTrocada) return [2, erro.message]
    if (erro instanceof ErroDaMeta && erro.codigo === 190) return [3, `${erro.message}\n\n${comoRenovar(o.conta ?? null)}`]
    return [1, `a Meta respondeu: ${semToken(erro.message, cred.token)}`]
  }
}

/* c8 ignore start */
if (process.argv[1] && import.meta.filename === resolve(process.argv[1])) {
  const [codigo, texto] = await principal(process.argv.slice(2))
  if (codigo === 0) console.log(texto)
  else console.error(texto)
  process.exitCode = codigo
}
/* c8 ignore stop */
