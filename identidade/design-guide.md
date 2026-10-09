# Identidade visual

> **Este arquivo é um roteador, não a fonte.**
>
> A sua marca mora em **`.claude/skills/carrossel/marca/`**, e só ali. Um lugar
> só, de propósito: marca definida em dois arquivos vira duas marcas na primeira
> vez que alguém atualiza um lado e esquece o outro.

---

## Onde a marca mora

| O quê | Arquivo |
|---|---|
| **As 8 cores e as 3 fontes** | `.claude/skills/carrossel/marca/tokens.css` |
| **Logo e onde assina, voz de narração do vídeo, recusas visuais** | `.claude/skills/carrossel/marca/marca.md` |
| **Nome, @, voz, público, oferta e CTA** | `_memoria/empresa.md` e `_memoria/escrita-publica.md` (não se copiam para a marca) |
| A sua logo | `.claude/skills/carrossel/marca/logo/` |
| Fontes próprias (se houver) | `.claude/skills/carrossel/marca/fontes/` |

⚠️ **Os dois primeiros nascem em branco.** A marca está configurada quando o
`tokens.css` existe sem a linha `ESTADO: nao-configurado`. Antes disso só o
catálogo abre, na paleta de demonstração do molde (`tokens.molde.css`); as skills
visuais param e pedem o `/carrossel configurar`.

---

## Como preencher

```
/carrossel configurar
```

Quatro perguntas (cor principal, outras cores, fontes, logo), uma por vez, "não
sei" aceito em todas; o nome, o @, a voz, o público e a oferta ela lê da
`_memoria/`. Ela deriva cor da sua logo ou do seu site, tem pares de fonte
prontos, mede o contraste e mostra o resultado antes de gravar. Roda uma vez.

**Para trocar depois:** `.claude/skills/carrossel/referencias/trocar-de-marca.md`.
Um arquivo muda, o `marca/tokens.css`. O resto se recalcula.

---

## Onde está o resto do sistema visual

Tudo dentro da skill, que é auto-contida:

| Preciso de | Abrir |
|---|---|
| A biblioteca de componentes | `.claude/skills/carrossel/kit/componentes.css` |
| **O catálogo ao vivo**, com editor de cor | `.claude/skills/carrossel/kit/catalogo.html` |
| Modelo de peça pronto pra duplicar | `.claude/skills/carrossel/kit/modelo-carrossel.html` |
| Composição, ritmo e limites por peça | `.claude/skills/carrossel/referencias/composicao.md` |
| Método editorial | `.claude/skills/carrossel/referencias/metodo.md` |
| Levar a marca pra outra identidade | `.claude/skills/carrossel/referencias/trocar-de-marca.md` |
| As regras que não se quebram | `.claude/skills/carrossel/SKILL.md` |

**O catálogo é o jeito mais rápido de ver a sua marca aplicada:** abra o
`catalogo.html` no navegador. Depois de configurar, ele abre na sua paleta.

---

## Para trabalho visual que não é carrossel

Landing page, apresentação, proposta, e-mail: **as cores e as fontes são as
mesmas**, e saem do mesmo `marca/tokens.css`. Leia os tokens de lá e use.

Três regras da casa valem em qualquer peça, carrossel ou não:

- **Nunca inventar cor.** Precisou de um tom fora dos tokens, parar e perguntar
- **Nunca branco puro** como fundo. O off-white dos tokens existe pra isso
- **A hierarquia é por peso e tamanho, não por cor.** A cor entra pouco, e é
  por isso que ela pesa quando entra

⚠️ **Regra nova de design não se escreve aqui.** Ela entra na skill, junto do
componente que ela governa. Documento solto contradizendo o sistema é o modo
mais comum de um kit apodrecer.

---

## Verificar

```
node .claude/skills/carrossel/scripts/confere.mjs
```

Diz se a estrutura está inteira, se a paleta gravada é válida, se o contraste
passa, se alguém escreveu cor à mão no `componentes.css` e se sobrou caminho de
máquina ou travessão. Rode depois de mexer em qualquer arquivo da skill.
