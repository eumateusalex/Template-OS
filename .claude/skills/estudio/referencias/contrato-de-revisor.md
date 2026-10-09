# O contrato de um revisor do Estúdio

Todo revisor em `.claude/agents/estudio/` segue este esqueleto.

---

## As seis seções, nesta ordem

### 1 · Frontmatter

```yaml
---
name: revisor-de-<lente>
description: Estúdio · <lente>. <O que revisa, em uma frase>. Use pelo /estudio; <o que é dos outros> pertence aos revisores próprios.
tools: Read, Grep, Glob, Bash
---
```

- A `description` **começa com `Estúdio · `**: é o que agrupa na lista
  de agentes
- **Tools só de leitura**, mais `Bash` pra rodar gate e medir. Revisor não edita.
  Navegador (`mcp__playwright__*`) só quem precisa; `WebFetch` só quem confere
  fonte

### 2 · Título e por que existe

Duas ou três linhas: o que ele revisa e **o defeito real** que a lente pega, no
presente e sem data. Revisor sem um defeito concreto na frente é revisor sem
calibração.

### 3 · A fronteira

```markdown
## A fronteira

> **Você só aponta o que tem NÚMERO ou REGRA ESCRITA atrás, e cita a regra.**

| É achado seu | Não é achado seu | Quem olha |
|---|---|---|
| exemplo concreto, com número ou regra | exemplo de gosto | ninguém: é gosto |
| exemplo concreto | exemplo da lente vizinha | o nome do revisor vizinho |
```

E logo depois, **"O que a máquina já mediu, e você NÃO repete"**: a lista curta do
que o gate da superfície já cobra.

### 4 · Antes de olhar

- As leituras, em ordem, citando **arquivo e seção** (não número de linha:
  linha envelhece a cada edição)
- **O `ACEITO.md` do alvo**, sempre, com "nada que está lá entra no seu relatório"
- "Quem te chama é o `/estudio`, e ele já rodou o gate. Se foi chamado sozinho,
  rode o gate e **pare se reprovar**"
- O que abrir na tela (PNGs, navegador), e **por que** abrir

### 5 · O que conferir

Seções numeradas. Cada uma:

- uma pergunta que se responde olhando
- a régua citada (arquivo, seção)
- o que **é** achado e o que **não é**, quando a linha for fina

### 6 · Como reportar

```markdown
## Como reportar

Uma lista curta, do mais grave pro menos. Sem introdução, sem elogio.

[alvo] o defeito — a régua ou o número — o conserto concreto

Depois da lista, sempre:

Não verificado: <o que você não conseguiu conferir e por quê>

E uma linha só com o veredito:
- `PRONTA PRA ENTREGA` — nada acima de pequeno reparo
- `AJUSTAR ANTES` — tem achado que quem pediu apontaria

Se você não achou nada, diga em uma linha e pare.
```

---

## As proibições

1. **Não repetir a máquina.** O que o gate mede, o revisor não reaponta
2. **Não invadir a lente vizinha.** O que é de outro revisor está escrito com o
   nome dele, nos dois arquivos
3. **Não corrigir.** O revisor aponta; o conserto é da conversa principal
4. **Não julgar gosto.** Sem número ou regra escrita, não é achado
5. **Não inventar achado.** Nada achado é uma linha
6. **Não confundir "não medi" com "está certo".** O que não foi verificado vai
   na lista, sempre

## Antes de usar um revisor novo

Rodar o `/estudio` com ele na régua (as peças que o dono aprovou e publicou, ou o
catálogo da marca enquanto não houver; o `SKILL.md`, seção "A calibração"). Achado
fora do `ACEITO.md` delas é régua mal escrita: a régua muda, a peça não.
