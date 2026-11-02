# Identidade visual

> **Este arquivo é um roteador, não a fonte.** A marca mora em `identidade/`,
> num lugar só, e toda superfície (carrossel, guardanapo, vídeo, site, tela de
> produto, imagem gerada, relatório) lê as saídas que o gerador escreve dela.

---

## Onde a marca mora

| O quê | Arquivo |
|---|---|
| **Os números**: cor (primitivas e papéis), fonte, raio, sombra, movimento, estilo de imagem, som, recusas | `identidade/marca.tokens.json` <!-- caminho futuro: o /marca configurar grava --> |
| **O que não é número**: logo e onde assina, voz de narração, estilo de imagem em prosa, exemplos aprovados, recusas visuais | `identidade/marca.md` <!-- caminho futuro: o /marca configurar grava --> |
| Os moldes, com valores de demonstração e sugestão | `identidade/marca.molde.tokens.json`, `identidade/marca.molde.md` |
| O logo e a fonte local | `identidade/logo/`, `identidade/fontes/` |
| As saídas geradas (nunca se editam) | `identidade/gerado/` (CSS da web, `marca.json`, `movimento.js`, `prompt-imagem.md`), `.claude/skills/carrossel/marca/tokens.css`, `.claude/video/src/marca.ts` |
| **Nome, @, voz do texto, público, oferta e CTA** | `_memoria/` (não se copiam para a marca) |

A marca está configurada quando o `marca.tokens.json` existe, passa no esquema e
não tem `"template.estado": "nao-configurado"`. Sem isso, toda superfície para
com a mesma frase: "a marca não está configurada: rode /marca".

---

## Configurar, trocar, conferir

```
/marca              a entrevista que cria a marca
/marca trocar       uma parte ou a marca inteira
/marca conferir     a régua
```

Trocar é editar um arquivo, o `marca.tokens.json`, e rodar:

```bash
node scripts/marca/gerar.mjs
node scripts/marca/conferir.mjs
```

O `conferir` reprova a saída velha, o contraste que nenhum papel resolve, a cor
ou a curva escrita à mão num molde de superfície e a marca que contradiz a
própria recusa.

Dois exemplos de identidade preenchida, só de formato, estão em
`templates/identidade/exemplos/`.

---

## Para qualquer peça

- **Nunca inventar cor.** Precisou de um tom fora dos papéis, ele entra na
  marca como papel novo, nunca como hex no molde de uma skill.
- **O contraste se mede, não se olha**: a regra única está em
  `scripts/marca/derivar.mjs`.
- **O que a marca recusa** está no `recusas` do `marca.tokens.json`; o gosto
  que os kits trazem (pílula, fundo quase branco, sombra difusa) é padrão
  sugerido, e a marca decide.
- **Regra nova de design não se escreve aqui.** Ela entra na skill, junto do
  componente que governa, ou na marca, se é da marca.
