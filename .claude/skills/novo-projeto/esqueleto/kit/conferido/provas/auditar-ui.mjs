// fundação: conferido v1 · o ajuste mora no projeto, nunca aqui
//
// Provas plantadas do conferidor `auditar-ui`.
//
// Classe de defeito: a camada de UI deixando de ser a do registry. Três
// jeitos: componente editado à mão (e a próxima atualização o atropela), HTML
// cru onde existe componente (o botão de um projeto real copiado de 27 a 35 vezes), e o
// raio da marca sumindo do globals.css (a pílula volta).
//
// ⚠️ A saída do `shadcn add --diff` é PLANTADA (FUNDACAO_DIFF_FALSO), no
// formato real medido no CLI 4.21, para a prova rodar sem rede.
// mutação: .claude/skills/novo-projeto/esqueleto/kit/conferido/portao/auditar-ui.mjs · "if (valor !== esperado) r.achado" → "if (false) r.achado" · pega em 09/10/2026
// mutação: .claude/skills/novo-projeto/esqueleto/kit/conferido/portao/auditar-ui.mjs · "if (isento(original, i, MARCA_NATIVO).isento) continue" → "continue" · pega em 09/10/2026
// mutação: .claude/skills/novo-projeto/esqueleto/kit/conferido/portao/auditar-ui.mjs · "if (!/No changes/.test(bloco) && !soOApelidoDoCn(bloco)) alterados.add(nome)" → "if (false) alterados.add(nome)" · pega em 09/10/2026
// mutação: .claude/skills/novo-projeto/esqueleto/kit/conferido/portao/auditar-ui.mjs · "if (faltando.length) r.naoMedido" → "if (false) r.naoMedido" · pega em 09/10/2026
// mutação: .claude/skills/novo-projeto/esqueleto/kit/conferido/portao/auditar-ui.mjs · "return conteudo === '' || /^import" → "return true || /^import" · pega em 09/10/2026

export const conferidor = 'auditar-ui'

const DEZ = ['button', 'input', 'textarea', 'label', 'field', 'alert', 'card', 'separator', 'empty', 'skeleton']

const GLOBALS = `@import "tailwindcss";
@theme inline {
    --radius-sm: var(--r-sm); /* fundação: raio da marca */
    --radius-md: var(--r-sm); /* fundação: raio da marca */
    --radius-lg: var(--r-sm); /* fundação: raio da marca */
    --radius-xl: var(--r-md); /* fundação: raio da marca */
    --radius-2xl: var(--r-lg); /* fundação: raio da marca */
    --radius-3xl: var(--r-lg); /* fundação: raio da marca */
    --radius-4xl: var(--r-lg); /* fundação: raio da marca */
}
:root {
    --background: oklch(1 0 0);
}
`

const bloco = (nome, corpo = '│ No changes.') => `├ src\\components\\ui\\${nome}.tsx (skip)\n${corpo}\n│\n`
const editado = (nome, menos, mais = null) => `├ src\\components\\ui\\${nome}.tsx (overwrite)\n│ ┌──────────\n│ │ --- a/src\\components\\ui\\${nome}.tsx\n│ │ +++ b/src\\components\\ui\\${nome}.tsx\n│ │ @@ -1,2 +1,2 @@\n│ │ -${menos}\n${mais ? `│ │ +${mais}\n` : ''}│ └──────────\n│\n`
const saida = (blocos) => `┌ shadcn add (dry run)\n│\n${blocos.join('')}└ Run without --dry-run to apply.\n`
const LIMPA = saida(DEZ.map((n) => bloco(n)))

/** O projeto limpo: os dez, o globals com os raios, uma página sem HTML cru. */
function base (ajuda, { diff = LIMPA, globals = GLOBALS, sem = [] } = {}) {
  for (const n of DEZ) if (!sem.includes(n)) ajuda.escreve(`src/components/ui/${n}.tsx`, `export function C () { return null }\n`)
  ajuda.escreve('src/app/globals.css', globals)
  ajuda.escreve('src/app/page.tsx', 'import { Button } from "@/components/ui/button"\nexport default function P () {\n  return <Button>ok</Button>\n}\n')
  ajuda.escreve('diff-falso.txt', diff)
}

const env = (raiz) => ({ FUNDACAO_DIFF_FALSO: `${raiz}/diff-falso.txt` })

export const casos = [
  {
    nome: 'a camada de UI intacta passa',
    espera: 'verde',
    env,
    planta (raiz, ajuda) { base(ajuda) }
  },
  {
    nome: 'componente dos dez que falta reprova',
    espera: 'vermelho',
    cita: /field/,
    env,
    planta (raiz, ajuda) { base(ajuda, { sem: ['field'], diff: saida(DEZ.filter((n) => n !== 'field').map((n) => bloco(n))) }) }
  },
  {
    nome: 'o raio do CLI no lugar do raio da marca reprova',
    espera: 'vermelho',
    cita: /--radius-lg[\s\S]*raio/,
    env,
    planta (raiz, ajuda) { base(ajuda, { globals: GLOBALS.replace('--radius-lg: var(--r-sm);', '--radius-lg: var(--radius);') }) }
  },
  {
    nome: 'hex no globals.css reprova',
    espera: 'vermelho',
    cita: /hex/,
    env,
    planta (raiz, ajuda) { base(ajuda, { globals: GLOBALS.replace('--background: oklch(1 0 0);', '--background: #ffffff;') }) }
  },
  {
    nome: 'token da marca escrito no globals.css reprova: a marca mora no tema',
    espera: 'vermelho',
    cita: /token da marca/,
    env,
    planta (raiz, ajuda) { base(ajuda, { globals: GLOBALS.replace('--background: oklch(1 0 0);', '--background: rgb(var(--c-light));') }) }
  },
  {
    nome: 'botão cru na tela reprova',
    espera: 'vermelho',
    cita: /page\.tsx:3[\s\S]*Button/,
    env,
    planta (raiz, ajuda) {
      base(ajuda)
      ajuda.escreve('src/app/page.tsx', 'export default function P () {\n  return (\n    <button className="bg-primary rounded-lg px-4">ok</button>\n  )\n}\n')
    }
  },
  {
    nome: 'botão nativo com a razão escrita passa',
    espera: 'verde',
    env,
    planta (raiz, ajuda) {
      base(ajuda)
      ajuda.escreve('src/app/page.tsx', 'export default function P () {\n  // elemento nativo: o summary do details não aceita Button dentro\n  return <button type="button">ok</button>\n}\n')
    }
  },
  {
    nome: 'role="alert" cru reprova',
    espera: 'vermelho',
    cita: /Alert/,
    env,
    planta (raiz, ajuda) {
      base(ajuda)
      ajuda.escreve('src/app/erro.tsx', 'export const E = () => <p role="alert">falhou</p>\n')
    }
  },
  {
    nome: 'botão cru DENTRO de components/ui é do registry, e não conta',
    espera: 'verde',
    env,
    planta (raiz, ajuda) {
      base(ajuda)
      ajuda.escreve('src/components/ui/button.tsx', 'export const B = () => <button />\n')
    }
  },
  {
    nome: 'componente que diverge do registry reprova',
    espera: 'vermelho',
    cita: /separator/,
    env,
    planta (raiz, ajuda) { base(ajuda, { diff: saida(DEZ.map((n) => (n === 'separator' ? editado(n, '// editado') : bloco(n)))) }) }
  },
  {
    nome: 'a única diferença sendo o apelido do cn não é edição',
    espera: 'verde',
    env,
    planta (raiz, ajuda) { base(ajuda, { diff: saida(DEZ.map((n) => (n === 'card' ? editado(n, 'import { cn } from "@/lib/utils"', 'import { cn } from "cn"') : bloco(n)))) }) }
  },
  {
    nome: 'o CLI que não reportou todos os componentes é NÃO MEDIDO',
    espera: 'vermelho',
    cita: /não reportou|não medido/,
    env,
    planta (raiz, ajuda) { base(ajuda, { diff: saida(DEZ.slice(0, 7).map((n) => bloco(n))) }) }
  },
  {
    nome: 'sem o globals.css é NÃO MEDIDO',
    espera: 'vermelho',
    cita: /não medido[\s\S]*nao-existe\.css/,
    env,
    planta (raiz, ajuda) {
      base(ajuda)
      ajuda.escreve('src/app/globals.css', '')
      ajuda.ajusta({ globals: 'src/app/nao-existe.css' })
    }
  }
]
