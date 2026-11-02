# _local/ — o catálogo da galeria da /design-de-produto

| O quê | Onde |
|---|---|
| o que cada imagem da galeria mostra, uma linha por arquivo | `galeria.json` |
| o gerador do índice da galeria (`../biblioteca/galeria/INDICE.md`), a partir do `galeria.json` e dos `.md` que citam cada imagem | `indexa-galeria.mjs` (`--escreve` grava; sem ele, só diz se mudaria) |

Imagem nova na galeria: o arquivo em `../biblioteca/galeria/<seção>/<assunto>-<produto>.jpg`, a linha
dele no `galeria.json` e o índice regerado. A régua da biblioteca e o teste dela ficam em `../scripts/`
(`confere-biblioteca.mjs` e `teste-confere-biblioteca.mjs`). Imagem nunca mora aqui.
