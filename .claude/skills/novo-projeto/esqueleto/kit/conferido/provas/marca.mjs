// fundação: conferido v1 · o ajuste mora no projeto, nunca aqui
//
// Provas plantadas do conferidor `marca`.
//
// Classe de defeito: cor fora da marca chegando à tela. Quatro jeitos: hex
// escrito na página, classe da paleta do Tailwind no lugar do papel, papel do
// shadcn que o tema esqueceu (e a cor do CLI aparece), e par de texto que não
// se lê. É o defeito medido num projeto real: duas fontes de token no
// mesmo projeto, divergindo em silêncio.
// mutação: .claude/skills/novo-projeto/esqueleto/kit/conferido/portao/marca.mjs · "r.catraca('hex fora dos tokens', hexes, pisos.hex)" → "r.catraca('hex fora dos tokens', 0, pisos.hex)" · pega em 09/10/2026
// mutação: .claude/skills/novo-projeto/esqueleto/kit/conferido/portao/marca.mjs · "if (rel === ACENTO || rel.includes('components/ui/')) return" → "if (true) return" · pega em 09/10/2026
// mutação: .claude/skills/novo-projeto/esqueleto/kit/conferido/portao/marca.mjs · "if (doTema.has(nome)) continue" → "if (doTema.has(nome) || true) continue" · pega em 09/10/2026
// mutação: .claude/skills/novo-projeto/esqueleto/kit/conferido/portao/marca.mjs · "if (doProjeto.get(nome) !== valor)" → "if (false)" · pega em 09/10/2026
// mutação: .claude/skills/novo-projeto/esqueleto/kit/conferido/portao/marca.mjs · "if (inicio === -1) return [0, -1]" → "return [0, linhas.length - 1]" · pega em 09/10/2026
// mutação: .claude/skills/novo-projeto/esqueleto/kit/conferido/portao/marca.mjs · "const doProjeto = manifesto.marca?.tipo !== 'casa'" → "const doProjeto = manifesto.marca?.tipo === 'projeto'" · pega em 09/10/2026

export const conferidor = 'marca'

const TOKENS = ':root {\n  --c-ink: 0,0,0;\n  --c-light: 255,255,255;\n  --c-dark: 20,80,160;\n  --c-muted: 110,110,115;\n  --c-claro: 220,220,220;\n  --f-display: \'Marca\', Arial, sans-serif;\n  --r-sm: 8px;\n  --mac-r: #ff5f57;\n}\n'

const GLOBALS = '@import "tailwindcss";\n@theme inline {\n  --font-sans: var(--font-sans);\n  --color-background: var(--background);\n}\n:root {\n  --background: oklch(1 0 0);\n  --foreground: oklch(0.145 0 0);\n  --muted-foreground: oklch(0.556 0 0);\n}\n.dark {\n  --background: oklch(0.145 0 0);\n  --foreground: oklch(0.985 0 0);\n}\n'

// ⚠️ O escuro redefine o cinza de apoio de propósito: sem isso ele herda o do
// claro (#6e6e73), que dá 4,14:1 sobre o preto, e o conferidor reprova.
const TEMA = ':root {\n  --font-sans: var(--f-display);\n  --background: rgb(var(--c-light));\n  --foreground: rgb(var(--c-ink));\n  --muted-foreground: rgb(var(--c-muted));\n}\n.dark {\n  --background: rgb(var(--c-ink));\n  --foreground: rgb(var(--c-light));\n  --muted-foreground: rgb(var(--c-claro));\n}\n'

const PAGINA = 'export default function Pagina () {\n  return <main className="bg-background text-foreground">oi</main>\n}\n'

/** O projeto limpo, na marca da casa. */
function base (ajuda, { tema = TEMA, globals = GLOBALS, tokens = TOKENS } = {}) {
  ajuda.conferido('fundacao/tokens.css', tokens)
  ajuda.conferido('fundacao/tema-shadcn.css', tema)
  ajuda.escreve('src/app/globals.css', globals)
  ajuda.escreve('src/app/page.tsx', PAGINA)
}

export const casos = [
  {
    nome: 'o projeto limpo na marca da casa passa, e mede o contraste',
    espera: 'verde',
    planta (raiz, ajuda) { base(ajuda) }
  },
  {
    nome: 'hex escrito na página reprova (piso zero)',
    espera: 'vermelho',
    cita: /hex/,
    planta (raiz, ajuda) {
      base(ajuda)
      ajuda.escreve('src/app/page.tsx', 'export default function P () {\n  return <p style={{ color: "#123456" }}>x</p>\n}\n')
    }
  },
  {
    nome: 'hex dentro de comentário não conta',
    espera: 'verde',
    planta (raiz, ajuda) {
      base(ajuda)
      ajuda.escreve('src/app/page.tsx', `// era #004aad antes do redesign\n${PAGINA}`)
    }
  },
  {
    nome: 'hex que já existia no dia da adoção fica na catraca, e passa',
    espera: 'verde',
    planta (raiz, ajuda) {
      base(ajuda)
      ajuda.escreve('src/app/antigo.tsx', 'export const cor = "#abcdef"\n')
      ajuda.ajusta({ pisos: { hex: 1, paleta: 0 } })
    }
  },
  {
    nome: 'classe da paleta do Tailwind fora do acento.ts reprova',
    espera: 'vermelho',
    cita: /paleta/,
    planta (raiz, ajuda) {
      base(ajuda)
      ajuda.escreve('src/app/page.tsx', 'export default function P () {\n  return <p className="text-red-500">x</p>\n}\n')
    }
  },
  {
    nome: 'classe da paleta dentro do acento.ts é permitida',
    espera: 'verde',
    planta (raiz, ajuda) {
      base(ajuda)
      ajuda.escreve('src/lib/acento.ts', 'export const PONTO = "bg-emerald-600 dark:bg-emerald-400"\n')
    }
  },
  {
    nome: 'papel do CLI que o tema esqueceu reprova: a cor do CLI chega à tela',
    espera: 'vermelho',
    cita: /não redefine[\s\S]*--foreground|--foreground[\s\S]*não redefine/,
    planta (raiz, ajuda) {
      base(ajuda, { tema: TEMA.replace('  --foreground: rgb(var(--c-light));\n', '') })
    }
  },
  {
    nome: 'papel sem cobertura isento com "cor do CLI: <razão>" no globals passa',
    espera: 'verde',
    planta (raiz, ajuda) {
      base(ajuda, {
        tema: TEMA.replace('  --foreground: rgb(var(--c-light));\n', ''),
        globals: GLOBALS.replace('  --foreground: oklch(0.985 0 0);', '  --foreground: oklch(0.985 0 0); /* cor do CLI: a v1.1 do shadcn trouxe e a casa ainda não decidiu */')
      })
    }
  },
  {
    // A isenção vale para a linha DO SELETOR que ela marca. Escrita no :root,
    // ela isentaria também o papel esquecido no .dark.
    nome: 'a isenção escrita no claro não cobre o papel esquecido no escuro',
    espera: 'vermelho',
    cita: /não redefine --foreground no escuro/,
    planta (raiz, ajuda) {
      base(ajuda, {
        tema: TEMA.replace('  --foreground: rgb(var(--c-light));\n', ''),
        globals: GLOBALS.replace('  --foreground: oklch(0.145 0 0);', '  --foreground: oklch(0.145 0 0); /* cor do CLI: só o claro fica com o CLI */')
      })
    }
  },
  {
    nome: 'papel do tema com valor fora da régua reprova',
    espera: 'vermelho',
    cita: /fora da régua/,
    planta (raiz, ajuda) {
      base(ajuda, { tema: TEMA.replace('--foreground: rgb(var(--c-ink));', '--foreground: oklch(0.2 0 0);') })
    }
  },
  {
    nome: 'nome da marca declarado também no globals reprova (colisão)',
    espera: 'vermelho',
    cita: /dois/,
    planta (raiz, ajuda) {
      base(ajuda, { globals: GLOBALS.replace(':root {\n', ':root {\n  --c-dark: 1,2,3;\n') })
    }
  },
  {
    nome: 'par de texto abaixo de 4,5:1 reprova, com o par e o número',
    espera: 'vermelho',
    cita: /contraste[\s\S]*--muted-foreground/,
    planta (raiz, ajuda) {
      base(ajuda, { tema: TEMA.replace('--muted-foreground: rgb(var(--c-muted));', '--muted-foreground: rgb(var(--c-claro));') })
    }
  },
  {
    nome: 'marca do projeto sem identidade à parte passa, e diz que não há o que comparar',
    espera: 'verde',
    cita: /identidade à parte/,
    planta (raiz, ajuda) {
      ajuda.semente('src/styles/tokens.css', TOKENS)
      ajuda.semente('src/styles/tema-shadcn.css', TEMA)
      ajuda.escreve('src/app/globals.css', GLOBALS)
      ajuda.escreve('src/app/page.tsx', PAGINA)
      ajuda.ajusta({ marca: { tipo: 'projeto', identidade: null } })
    }
  },
  {
    nome: 'marca do projeto que diverge da identidade dela reprova',
    espera: 'vermelho',
    cita: /--c-dark[\s\S]*diverge|diverge[\s\S]*--c-dark/,
    planta (raiz, ajuda) {
      ajuda.semente('src/styles/tokens.css', TOKENS)
      ajuda.semente('src/styles/tema-shadcn.css', TEMA)
      ajuda.escreve('identidade-visual/tokens.css', TOKENS.replace('--c-dark: 20,80,160;', '--c-dark: 19,48,63;'))
      ajuda.escreve('src/app/globals.css', GLOBALS)
      ajuda.escreve('src/app/page.tsx', PAGINA)
      ajuda.ajusta({ marca: { tipo: 'projeto', identidade: 'identidade-visual/tokens.css' } })
    }
  },
  {
    // Manifesto sem marca declarada é marca do projeto: a da casa só entra
    // quando se pede. Sem este caso, trocar a regra por
    // "=== 'projeto'" passaria calado.
    nome: 'manifesto sem marca declarada lê a marca do projeto, em src/styles/',
    espera: 'verde',
    planta (raiz, ajuda) {
      ajuda.semente('src/styles/tokens.css', TOKENS)
      ajuda.semente('src/styles/tema-shadcn.css', TEMA)
      ajuda.escreve('src/app/globals.css', GLOBALS)
      ajuda.escreve('src/app/page.tsx', PAGINA)
      ajuda.ajusta({ marca: undefined })
    }
  },
  {
    nome: 'sem o arquivo de tokens é NÃO MEDIDO',
    espera: 'vermelho',
    cita: /tokens\.css/,
    planta (raiz, ajuda) {
      ajuda.escreve('src/app/page.tsx', PAGINA)
    }
  },
  {
    nome: 'trilha de página sem tema mede o código e diz que o contraste é do projeto',
    espera: 'verde',
    cita: /sem tema/,
    planta (raiz, ajuda) {
      ajuda.conferido('fundacao/tokens.css', TOKENS)
      ajuda.escreve('src/pages/index.astro', '<main>oi</main>\n')
      ajuda.ajusta({ trilha: 'pagina' })
    }
  }
]
