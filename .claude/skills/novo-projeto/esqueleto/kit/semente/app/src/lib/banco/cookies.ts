// fundação: semente v1 · é seu
// Onde o banco mora e com que marcas o cookie de sessão sai. Um lugar só,
// porque servidor, navegador e proxy precisam das MESMAS respostas.

export type ConfigDoBanco = { url: string; chave: string }

/**
 * O Supabase está ligado? Só quando as duas variáveis existem.
 *
 * 🚨 Nada nasce ligado: sem elas o projeto builda, sobe e mostra a tela; só
 * não há sessão. E a leitura é LITERAL (`process.env.NEXT_PUBLIC_...`) de
 * propósito: é assim que o Next acha a variável para escrevê-la no JavaScript
 * do navegador. Ler por nome montado (`env[nome]`) funciona no servidor e
 * chega vazio no navegador.
 */
export function configDoBanco(
  url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
): ConfigDoBanco | null {
  if (!url || !chave) return null
  if (!ehPublicavel(chave)) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY tem que ser a chave publicável (sb_publishable_...): ela vai para o navegador"
    )
  }
  return { url, chave }
}

/**
 * 🚨 A chave vai para o JavaScript do navegador. A secreta (`sb_secret_`) ou o
 * JWT antigo de `service_role` ali passam por cima de toda a RLS, então o
 * projeto recusa com erro em vez de ligar calado. O JWT antigo de `anon` continua aceito.
 */
function ehPublicavel(chave: string): boolean {
  if (chave.startsWith("sb_publishable_")) return true
  const corpo = chave.split(".")[1]
  if (!corpo) return false
  try {
    return (
      JSON.parse(atob(corpo.replace(/-/g, "+").replace(/_/g, "/"))).role ===
      "anon"
    )
  } catch {
    // silêncio declarado: texto que não é JWT não é chave publicável, e a resposta é "não"
    return false
  }
}

/**
 * As marcas do cookie de sessão.
 *
 * 🚨 O padrão do `@supabase/ssr` é SEM `secure`, e o Next não acrescenta a
 * marca sozinho: em produção o cookie com o token sairia sem ela. Aqui ela
 * sai do endereço do site, não de
 * `NODE_ENV`, porque a prova local roda build de produção em http://localhost.
 * Ela só cai em http na PRÓPRIA MÁQUINA (localhost, 127.0.0.1): http com
 * domínio de verdade é engano de configuração, e engano fecha. Sem endereço,
 * assume HTTPS.
 *
 * ⚠️ `httpOnly` fica falso: o cliente do navegador precisa ler o token.
 */
export function opcoesDeCookie(site = process.env.NEXT_PUBLIC_SITE_URL) {
  return {
    path: "/",
    sameSite: "lax" as const,
    secure: !naPropriaMaquina(site),
  }
}

function naPropriaMaquina(site: string | undefined): boolean {
  if (!site?.startsWith("http://")) return false
  try {
    return ["localhost", "127.0.0.1"].includes(new URL(site).hostname)
  } catch {
    // silêncio declarado: endereço ilegível não é a própria máquina, e o cookie fica com secure
    return false
  }
}
