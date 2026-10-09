# vendor · o que a tela precisa para abrir sem internet

Servidos do disco: a tela nunca chama CDN.

| Arquivo | O que é |
|---|---|
| `Geist-Variable.woff2`, `GeistMono-Variable.woff2` | Geist e Geist Mono, variáveis |
| `inter-variavel-latin.woff2`, `inter-variavel-latin-ext.woff2` | Inter 4 variável, subconjuntos latin e latin-ext |
| `lucide.min.js` | os ícones Lucide, UMD |
| `tailwind-browser.js` | Tailwind v4 compilando no navegador (só para maquete de projeto que usa Tailwind) |

Os arquivos de texto ao lado (`*-LICENSE.txt`) vêm junto do download de cada um.

A pasta inteira é instalada por `node scripts/terceiros/instalar.mjs --so design-de-produto-vendor`,
na versão que o `scripts/terceiros/manifesto.json` fixa (a fonte de cada arquivo
está lá), e fica fora do git. Este LEIA-ME sai do molde
`scripts/terceiros/moldes/design-de-produto/LEIA-ME.md`.

Para conferir depois de instalar: `node scripts/terceiros/instalar.mjs --conferir`,
e o medidor de tela numa tela, que reprova se alguma fonte não carregar.
