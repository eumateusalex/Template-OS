# Trocar de marca

O que este arquivo é: como o kit veste uma marca nova, e por que a troca cabe num arquivo só. Ler no modo configurar, e quando alguém quiser entender o que a entrevista grava.

---

## A promessa

**Um arquivo muda: `marca/tokens.css`.** O bloco 1 (paleta) e o bloco 2 (tipografia). Os blocos 3 e 4 são derivados e se recalculam sozinhos.

O `kit/componentes.css` é 100% `var()`: nenhum valor de cor dentro dele. Se você precisar abrir o `componentes.css` pra trocar de marca, alguém quebrou o contrato e escreveu uma cor solta. O `scripts/confere.mjs` reprova isso.

---

## Passo 1: mapear a paleta por PAPEL, não por cor

É aqui que dá errado. Não mapeie por luminância ("essa é a escura, então vai no `--c-dark`"). Mapeie pelo papel que a cor tem na marca:

| Slot | A pergunta a fazer |
|---|---|
| `--c-dark` | **Qual é a cor principal da marca?** Mesmo que ela seja clara. É ela que manda no fundo escuro e no texto sobre o claro |
| `--c-light` | Qual é o fundo claro? Nunca branco puro: um off-white que puxe pra principal |
| `--c-accent` | Qual é o acento, o que puxa o olho? CTA, régua, palavra em destaque |
| `--c-support-1` | Qual apoia a principal sem competir? |
| `--c-support-2` | Qual é o lavado, pra card e respiro sobre o claro? |
| `--c-rare` | Qual é a de **menor** peso? Entra em no máximo 8% da peça |
| `--c-abyss` | Qual é a mais fechada? Fundo do terminal e do fecho `.abismo`. Nunca preto puro |
| `--c-ok` | Qual sinaliza "concluído"? Só aparece no terminal |

**O erro clássico:** pôr a cor mais escura da paleta no `--c-dark` sem perguntar se ela é a principal. A peça sai inteira na cor errada.

Valores em **canais RGB**, não hex:

```css
--c-dark: 28,28,32;   /* certo */
--c-dark: #1c1c20;    /* errado: quebra todos os rgba() */
```

### Quando a marca tem menos de 8 cores

O normal é a marca ter duas ou três. As outras se derivam da principal, e a entrevista faz isso sozinha:

- **fundo claro**: quase branco, com 2 a 4% da principal misturada (ex.: principal azul dá um off-white levemente frio)
- **apoio 1**: a principal clareada em 20 a 30%
- **apoio 2**: a principal a 8 a 12% sobre o fundo claro
- **acento raro**: um cinza neutro médio, ou um tom fechado de uma segunda cor da marca
- **abismo**: a principal escurecida até 25 a 35% da luminância dela
- **concluído**: a principal clareada até ler sobre o abismo

Regra de ouro na derivação: nenhuma cor nova de verdade. Tudo é a principal em outra intensidade, ou neutro.

### Quando a marca só tem um site ou uma logo

Extrair de lá: a cor de fundo dominante, a cor do texto, a cor dos botões. Botão costuma ser o acento; fundo dominante costuma ser a principal (ou o fundo claro, se o site é claro, e aí a principal é a cor do título). Mostrar as três com os hex antes de gravar e perguntar se bate.

---

## Passo 2: conferir contraste

O par que mais importa é `--c-dark` sobre `--c-light`: ele carrega **todo o texto sobre fundo claro**.

- Mínimo **4,5:1** (AA). O `confere.mjs` reprova abaixo disso.
- Confortável a partir de 7:1.

Se não passar, a cor principal não serve como texto, e isso não é troca de token: é decisão de marca. Duas saídas, e a pessoa escolhe:

1. escurecer a principal só o suficiente pra passar (a marca "puxa" um tom, e vale avisar que a peça vai sair um pouco mais fechada que o site);
2. manter a principal como está no fundo escuro e usar o abismo como cor do texto sobre o claro (aí `--on-light` no bloco 3 passa a apontar pro `--c-abyss`).

---

## Passo 3: trocar a tipografia

Três famílias, três papéis:

- **display**: headline forte e geométrica; carrega quase tudo (título, corpo, lista, botão)
- **serif**: só o trecho de destaque dentro do título, sempre em itálico
- **mono**: tag, kicker, contador, terminal, chip, rótulo técnico. Nunca em corpo de texto

A mescla é a assinatura. Uma sozinha vira genérico: só grotesca parece apresentação de startup; só serifada parece blog de gastronomia; as duas, com a mono de tempero, é marca.

Trocar é mexer em dois lugares do `tokens.css`, os dois no topo do arquivo:

```css
@import url('https://fonts.googleapis.com/css2?family=...&display=swap');

--f-display: 'Nova Display', Arial, sans-serif;
--f-serif:   'Nova Serifada', Georgia, serif;
--f-mono:    'Nova Mono', Consolas, monospace;
```

O modelo e o catálogo **não** carregam fonte por conta própria: só pelo `@import` do tokens. Um arquivo, uma troca.

Pesos usados: `--w-display-bold: 800`, `--w-display-med: 500`, `--w-mono-med: 600`. Se a família nova não tem esses pesos, ajustar os três tokens (uma display que só vai até 700, por exemplo, precisa de `--w-display-bold: 700`).

**Fonte que não carrega não avisa.** A página renderiza na fonte de sistema e o JPEG sai com outra letra e outra métrica. O render se recusa a gravar nesse estado, e é de propósito.

### Os três pares prontos

Pra quem não sabe que fonte usar, ou não tem fonte de marca. Todos do Google Fonts, gratuitos, com os pesos que o kit usa.

**Par 1 · Editorial** (o de demonstração): geométrica com personalidade, serifada fina, mono técnica. Serve pra tecnologia, negócios, conteúdo de opinião.

```css
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,700;12..96,800&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap');
--f-display: 'Bricolage Grotesque', Arial, sans-serif;
--f-serif:   'Instrument Serif', Georgia, serif;
--f-mono:    'JetBrains Mono', Consolas, monospace;
```

**Par 2 · Neutro**: a grotesca mais discreta que existe, uma serifada de jornal e uma mono limpa. Serve pra saúde, direito, consultoria, qualquer marca que precise soar sóbria.

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&family=Newsreader:ital,opsz,wght@1,6..72,400&family=Roboto+Mono:wght@400;500;600&display=swap');
--f-display: 'Inter', Arial, sans-serif;
--f-serif:   'Newsreader', Georgia, serif;
--f-mono:    'Roboto Mono', Consolas, monospace;
```

**Par 3 · Quente**: uma geométrica arredondada, uma serifada clássica de alto contraste e uma mono de escritório. Serve pra gastronomia, moda, evento, marca pessoal mais calorosa.

```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;800&family=Playfair+Display:ital@1&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
--f-display: 'Outfit', Arial, sans-serif;
--f-serif:   'Playfair Display', Georgia, serif;
--f-mono:    'IBM Plex Mono', Consolas, monospace;
```

Se a marca tem fonte própria que não está no Google Fonts, a saída é hospedar os arquivos `.woff2` dentro de `marca/fontes/` e declarar `@font-face` no topo do `tokens.css` no lugar do `@import`, com caminho `/.claude/skills/carrossel/marca/fontes/...`.

---

## Passo 4: testar no catálogo

Abrir `kit/catalogo.html` no navegador (abre direto, sem servidor). O editor de paleta no topo reescreve os tokens ao vivo: dá pra ver todos os componentes mudando de cor sem renderizar nada, e o bloco embaixo dos seletores mostra os 8 valores prontos pra colar no `tokens.css`. É o jeito mais barato de descobrir que uma combinação não fecha.

## Passo 5: renderizar uma peça de verdade

Catálogo não substitui peça. A primeira peça da marca nova se monta com conteúdo real, se renderiza e se olha em tamanho de feed. Se a headline não tem o tracking apertado da display, a fonte não carregou (e o render já teria avisado).

---

## O que NÃO muda entre marcas

| Item | Por quê |
|---|---|
| Semáforos do Mac (`--mac-r/y/g`) | chrome de sistema, não cor de marca |
| Estrutura dos componentes | é o que faz o kit ser um kit |
| Escala tipográfica | proporção calibrada pro canvas 4:5 |
| Medidas e margens | `--pad-x` e companhia |
| As regras de composição | ver [composicao.md](composicao.md) |

As **regras editoriais**, essas sim, mudam com a marca: tom de voz, tipo de CTA, quantidade de slides. Elas descrevem a pessoa, não o sistema, e moram na `_memoria/` (a voz e a régua do CTA em `escrita-publica.md`, a função da peça em `marketing.md`), nunca no kit.

---

## Checklist da troca

- [ ] Paleta mapeada **por papel**, com a cor principal no `--c-dark`
- [ ] Valores em canais RGB, sem hex
- [ ] Contraste `--c-dark` sobre `--c-light` ≥ 4,5:1
- [ ] `@import` das fontes no topo do `tokens.css`, e as três famílias nos tokens
- [ ] Pesos conferidos (800 / 500 / 600)
- [ ] Marcador `ESTADO: nao-configurado` apagado do `tokens.css` (é o sinal de marca configurada que todas as skills leem)
- [ ] `componentes.css` **não** foi tocado
- [ ] Catálogo aberto e conferido
- [ ] `node .claude/skills/carrossel/scripts/confere.mjs` limpo
- [ ] Uma peça real renderizada e olhada em tamanho de feed
