---
name: marca
description: "Configura, troca e confere a marca visual (cor, fonte, logo, raio, movimento, imagem, som e recusas) em identidade/, de onde toda peça sai. Use para \"configurar a marca\", \"trocar a marca\", \"minhas cores\", \"conferir a marca\" ou /marca."
---

# /marca

A marca de quem usa o workspace mora em **um lugar só**, a pasta `identidade/`,
e toda superfície sai dela: carrossel, guardanapo, vídeo, site do
`/novo-projeto`, tela de produto, imagem gerada e relatório. Nenhuma skill
escreve cor, fonte ou curva à mão: elas leem as saídas que o gerador escreve a
partir da marca.

| Arquivo | O quê | Quem escreve |
|---|---|---|
| `identidade/marca.tokens.json` <!-- caminho futuro: o /marca configurar grava --> | os números: cor (primitivas e papéis), fonte, raio, espaço, sombra, movimento, estilo de imagem, som, recusas. Formato W3C Design Tokens (DTCG) | esta skill, pela entrevista |
| `identidade/marca.md` <!-- caminho futuro: o /marca configurar grava --> | o que não é número: o uso do logo, a voz de narração, o estilo de imagem em prosa, a referência de som, os exemplos aprovados e as recusas visuais | esta skill; as skills de peça gravam recusa e voz nele |
| `identidade/logo/`, `identidade/fontes/` | o logo e a fonte local | esta skill, com o arquivo que a pessoa manda |
| `identidade/gerado/`, `.claude/skills/carrossel/marca/tokens.css`, `.claude/video/src/marca.ts` | as saídas: CSS da web e do carrossel, `marca.json`, `movimento.js` e `.json`, o `marca.ts` do Remotion, o `prompt-imagem.md` | só o `scripts/marca/gerar.mjs`. Nunca se editam |

Os moldes `identidade/marca.molde.tokens.json` e `identidade/marca.molde.md`
trazem valores de **demonstração** e de **sugestão**, marcados um a um. Eles
nunca se editam: a marca nasce como cópia deles.

**Marca configurada** = o `marca.tokens.json` existe, passa no esquema e não
tem `"template.estado": "nao-configurado"`. Sem isso, toda superfície para com
a mesma frase: "a marca não está configurada: rode /marca".

## Como rodar

| Comando | O que faz |
|---|---|
| `/marca` ou `/marca configurar` | A entrevista curta que cria a marca (`entrevista.md`) |
| `/marca trocar` | Troca uma parte da marca (a cor, a fonte, o movimento, uma recusa) ou a marca inteira (`trocar.md`) |
| `/marca conferir` | Roda a régua e diz o que está velho, sem contraste ou escrito à mão |

## Configurar

1. Ler `entrevista.md` e seguir: uma pergunta por vez, "não sei" sempre tem
   caminho, a proposta sai do logo ou do site atual.
2. **Mostrar antes de gravar**, pelo rascunho e pela proposta (o passo 7 da
   entrevista): onde cada cor cai, com a medida, o tom mais perto que passa ao
   lado da cor que não segura texto, as fontes, o raio, a curva, a frase de
   imagem e as recusas confirmadas. Só grava com o "sim".
3. Copiar o rascunho para `identidade/marca.tokens.json` (ele já sai sem o <!-- caminho futuro: o /marca configurar grava -->
   `template.estado` e sem a "Demonstração" das cores; a proposta lista o que
   ainda diz "Demonstração"). Copiar o `marca.molde.md` para
   `identidade/marca.md` e preencher. <!-- caminho futuro: o /marca configurar grava -->
4. Rodar, nesta ordem, e só dizer pronto com os dois limpos:

```bash
node scripts/marca/gerar.mjs
node scripts/marca/conferir.mjs
```

5. Fechar com o próximo passo em uma linha: "Marca configurada. Me manda um
   tema que eu monto a primeira peça."

## Trocar

Ler `trocar.md`. Troca num lugar só: edita o `marca.tokens.json` (ou o
`marca.md`), roda o `gerar.mjs` e o `conferir.mjs`. Nunca se edita uma saída
gerada: o `conferir` reprova a cópia que não bate com a marca.

## Conferir

```bash
node scripts/marca/conferir.mjs
```

Reprova: saída gerada velha, contraste que nenhum papel resolve, cor ou curva
escrita à mão num molde de superfície, marca que contradiz a própria recusa
(curva que quica com `bounce` recusado, por exemplo) e esquema quebrado. Cada
linha diz o arquivo e o conserto.

## As recusas

A lista `recusas` do `marca.tokens.json` é o que as réguas barram. Os
identificadores que alguma régua lê estão em `scripts/marca/marca.mjs`
(`RECUSAS_CONHECIDAS`): `bounce`, `elastic`, `kicker`, `contador`, `pilula`,
`branco-puro`, `sombra-dura`, `icone-solido`, `gradiente`. O molde sugere
alguns; a entrevista pergunta um a um, e a pessoa confirma ou apaga. Recusa que
nenhuma régua lê mora em prosa no `marca.md`, seção "Recusas visuais".

Quando uma peça ouve uma recusa nova ("não quero mais isso"), quem ouviu grava
na hora: no `recusas` se é um identificador conhecido, senão no `marca.md`.

## O que esta skill não faz

- Não guarda nome, @, voz do texto, público nem oferta: eles moram na
  `_memoria/`.
- Não muda o kit de nenhuma skill: se uma superfície precisa de cor nova, ela
  ganha um papel na marca, nunca um hex no molde dela.
- Não inventa cor, fonte ou curva que a pessoa não aprovou.
