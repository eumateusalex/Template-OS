// fundação: semente v1 · é seu
import type { NextConfig } from "next"

// fundação: banco (início)
import { configDoBanco } from "./src/lib/banco/cookies"

// 🚨 A chave do banco se confere NO BUILD, antes de o Next escrever o
// JavaScript do navegador: a variável NEXT_PUBLIC_ vai para dentro dele, e a
// chave secreta colada ali sairia publicada mesmo que a página desse erro
// depois. Sem as variáveis, nada acontece.
configDoBanco()
// fundação: banco (fim)

/**
 * Os cabeçalhos que não mudam por requisição, em TODA rota, inclusive as
 * estáticas que o proxy não cobre.
 *
 * ⚠️ A CSP não está aqui: ela precisa de um nonce novo por requisição, e
 * `headers()` é estático. Quando o projeto pedir CSP, ela nasce no proxy (a
 * receita está no esqueleto do /novo-projeto, no workspace).
 */
const CABECALHOS = [
  // O navegador não adivinha tipo de arquivo.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // O endereço de dentro não vaza para o site de destino.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // O que o projeto não pede não fica disponível.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Ninguém embute a página num iframe.
  { key: "X-Frame-Options", value: "DENY" },
]

/**
 * HSTS: um ano, com subdomínio, e NUNCA em localhost.
 *
 * 🚨 Em localhost o navegador guarda a regra por um ano e passa a forçar HTTPS
 * em toda porta: outro projeto da máquina para de abrir, sem pista de onde
 * veio. Sem `preload`: sair da lista leva
 * meses, e entrar é decisão do dono do projeto, por domínio.
 *
 * ⚠️ O `\\d` tem as duas barras de propósito. Com uma só, a string do
 * JavaScript come a barra e o padrão vira `localhost(:d+)?`, que só funciona
 * por acaso.
 */
const HSTS = {
  key: "Strict-Transport-Security",
  value: "max-age=31536000; includeSubDomains",
}

const nextConfig: NextConfig = {
  // A imagem do Docker leva só o servidor e o que ele importa.
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:caminho*", headers: CABECALHOS },
      {
        source: "/:caminho*",
        missing: [{ type: "host", value: "localhost(:\\d+)?" }],
        headers: [HSTS],
      },
    ]
  },
}

export default nextConfig
