// O acervo de prova dos testes da /oferta: o formato que a skill lê (um
// frontmatter opcional, o título e o texto), numa pasta temporária.
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// O endereço de prova de um trecho: um site de exemplo, com o t= do início.
export const endereco = (ep, inicio) => `https://videos.exemplo.com/${ep}?t=${inicio}`

// url: o endereço do trecho; null grava o trecho sem endereço.
export function trecho ({ ep, titulo, inicio, texto, url }) {
  const link = url === undefined ? endereco(ep, inicio) : url
  return `---
title: "${titulo}"
published: "2026-03-12"
start_seconds: ${inicio}
${link === null ? '' : `url: "${link}"\n`}---

# ${titulo}

${texto}
`
}

// O arquivo de um trecho dentro do acervo: a pasta da gravação e o início.
export const arquivoDe = t => `${t.ep}/${String(t.inicio).padStart(6, '0')}.md`

// crlf: arquivo gravado no Windows traz \r\n.
// soltos: arquivos crus, { 'caminho/no/acervo.txt': 'texto' }, sem frontmatter.
export function montarAcervo (trechos, { crlf = false, soltos = {} } = {}) {
  const raiz = mkdtempSync(join(tmpdir(), 'acervo-'))
  for (const t of trechos) {
    const pasta = join(raiz, t.ep)
    mkdirSync(pasta, { recursive: true })
    const texto = crlf ? trecho(t).replace(/\n/g, '\r\n') : trecho(t)
    writeFileSync(join(raiz, arquivoDe(t)), texto)
  }
  for (const [caminho, texto] of Object.entries(soltos)) {
    mkdirSync(join(raiz, caminho, '..'), { recursive: true })
    writeFileSync(join(raiz, caminho), texto)
  }
  return raiz
}

export const BONS = [
  { ep: 'aaa', titulo: 'Preço pelo fechamento', inicio: 90, texto: 'Se você fecha mais de 80 por cento das conversas, o preço está baixo. O fechamento diz o preço. Suba o preço até o fechamento cair.' },
  { ep: 'bbb', titulo: 'Iscas que funcionam', inicio: 0, texto: 'A isca resolve um problema estreito e revela o próximo. Entregue o que é e por que funciona, e venda a implementação.' },
  { ep: 'ccc', titulo: 'O primeiro vendedor', inicio: 180, texto: 'Ao contratar, olhe o fechamento de cada mês e o funil. Treine com simulação de conversa.' }
]
