---
name: ios-core-design
description: >
  Design system Liquid Glass (iOS 26/27) para projeto web: transforma qualquer
  produto em produto Apple, por RETROFIT de sistema pronto ou PRODUTO NOVO a
  partir de uma ideia. Use quando o usuário
  pedir "estilo iOS", "cara de app Apple", "liquid glass", "vira produto
  Apple", "cria um app/painel nesse estilo do zero", "design system iOS",
  aplicar/instalar o ios-core-design num projeto, construir UI nesse visual,
  ou /ios-core-design.
---

# /ios-core-design — Liquid Glass na web

O visual não se decide na hora: está resolvido nos tokens e nos references.
Esta skill força qualquer output visual a obedecer o iOS Human Interface
Guidelines na versão **atual** (Liquid Glass, iOS 26/27): conteúdo sólido,
cromo de vidro que flutua, cápsula como forma de controle, fallback opaco
automático. Alvo: web — React + Tailwind, com CSS puro como fallback.

**Genérica e auto-contida:** nada aqui referencia um workspace ou projeto
específico. Paleta e tipografia são as oficiais da Apple; o vidro **não tem
spec pública em CSS**, então esses valores vão marcados "tradução web
calibrada" na tabela única de `materials.md` §4 — sem fonte nem calibragem,
vira TODO.

🔖 **Política de carimbo:** todo arquivo gerado carrega a versão vigente da
skill na 1ª linha. O `install.sh` detecta por ela.

## Quando ativar

- O projeto pede estética iOS ("cara de app Apple", "liquid glass", "estilo
  iOS nativo")
- O usuário quer **criar um produto novo** nesse visual a partir de uma
  ideia ("monta um painel/app assim do zero")
- O projeto já adotou esta skill como design system (tokens `--ios-*` no CSS)
- Auditoria: "isso está seguindo o padrão iOS?"

**Quando NÃO ativar:** projeto com design system ou identidade de marca
próprios já estabelecidos — esta skill não passa por cima de marca sem
pedido explícito do usuário.

## Os dois caminhos (e os três momentos)

| Momento | O que fazer |
|---|---|
| **Do zero** (ideia no papel) | `references/produto.md` §1: definir as views (2-5) e o inventário como se o sistema existisse → colar o `assets/app-shell-template.html` → conteúdo pelos references → acabamento §3 → passe §4 → ciclos §2 |
| **Meio** (projeto em construção) | Instalar tokens → migrar tela a tela, componente a componente, começando pelo que mais aparece |
| **Retrofit** (sistema pronto) | **É REESTRUTURAÇÃO, não pintura**: `references/rebrand.md` (inventário → chassi → migração → matar o header) e dali pra portaria comum do `produto.md`. Se o header original sobreviveu, não terminou |

## As 10 regras invioláveis

1. **Nenhum alvo de toque menor que 44×44px.** A área clicável conta, não o desenho — padding invisível resolve.
2. **Todo espaçamento sai do grid de 8pt** (4px só como meio-passo). Valores e margens: `foundations.md` §2 — fora do grid, SÓ o que está na lista de exceções registradas de lá.
3. **Cor só via `var(--ios-*)`.** Hex direto em componente é bug, mesmo sendo o hex certo — é a var que resolve light/dark sozinha.
4. **Raio por papel, nunca por gosto — e cantos concêntricos.** Botão é cápsula, sem escape; a tabela de raios e a fórmula concêntrica: `foundations.md` §3.
5. **Sombra é assinatura do vidro.** Cromo flutuante carrega a sombra do material (embutida em `.ios-glass`); conteúdo eleva por cor. A política completa: `foundations.md` §6.
6. **Tipografia fechada nos 11 estilos** da escala Dynamic Type (`typography.md`). **Estilo completo**: quem declara size declara o leading do mesmo estilo. Peso fora de 400 só nos papéis de produto registrados (§4b de lá).
7. **Movimento padronizado** pelas 4 assinaturas de `motion.md` (padrão, entrada, press, hover) — em vidro, o press ilumina. `prefers-reduced-motion` sempre respeitado.
8. **Liquid Glass, não clássico:** cromo flutuante é vidro via `.ios-glass` — Regular por padrão, Clear só sobre mídia e sempre com dimming, nunca misturar os dois, nunca vidro dentro de vidro, `backdrop-filter` nunca escrito em componente, fallback opaco automático (`@supports`, `prefers-reduced-transparency`, `data-glass="solid"`).
9. **Ícone é Phosphor:** peso regular por padrão, fill quando ativo, tamanho acompanhando a fonte ao lado. Escolher pelo mapa SF→Phosphor de `references/icons.md`, nunca de memória.
10. **Não inventar valor.** O que não está em `assets/tokens.css` nem nos references vira `/* TODO */` comentado pro usuário decidir. Valor de vidro sem fonte oficial existe — mas só flagado "tradução web calibrada" e listado em `materials.md` §4. Número chutado é a regra mais quebrada e a mais cara.

## Onde as coisas moram (ler sob demanda, nunca tudo)

| Arquivo | O que responde | Quando ler |
|---|---|---|
| `references/foundations.md` | Filosofia, grid 8pt (+ exceções registradas), margens, raios concêntricos, 44×44, alturas, elevação | Ao abrir qualquer trabalho visual |
| `references/materials.md` | **O vidro**: Regular/Clear, anatomia, tabela de valores calibrados, data-glass, fallbacks | Junto com foundations, sempre que houver cromo |
| `references/typography.md` | Escala de 11 estilos, tracking, stack, licença SF Pro, **papéis de produto (§4b)** | Na primeira peça com texto da sessão |
| `references/color.md` | Paleta light/dark, semântica, labels, fundos, fills, véus, tema, host fixes, tints | Na primeira peça com cor da sessão |
| `references/motion.md` | As 4 assinaturas de movimento, iluminação do vidro, o que pode animar, reduced-motion | Ao animar qualquer coisa |
| `references/writing.md` | Voz e tom (PT-BR), 20 pares ruim→bom | Ao escrever texto de UI |
| `references/icons.md` | Mapa dos 60 SF Symbols → Phosphor, pesos, tamanho | Só na hora de escolher ícone |
| `references/accessibility.md` | Contraste (inclusive sobre vidro), foco, teclado, ARIA por componente | No passo 4 do fluxo, sempre |
| `references/web-translation.md` | O mapa nativo→web e a lista do que NÃO replicar | Quando aparecer padrão nativo sem equivalente óbvio |
| `references/produto.md` | **A produção comum aos dois caminhos**: caminho do zero (§1), ciclos de verificação (§2), acabamento (§3), passe de precisão (§4), portaria de saída | **Em toda entrega** — e é a porta de entrada do produto novo |
| `references/rebrand.md` | **O retrofit**: inventário → chassi → migração → matar o header | Ao receber um sistema PRONTO pra "aplicar a skill" |
| `references/app-shell.md` | O app inteiro: sidebar + toolbar de vidro + tab bar flutuante, réguas do shell, armadilhas de cascata/host | **Ao montar qualquer app com navegação** (não só uma peça) |
| `assets/app-shell-template.html` | O chassi pronto do shell (sidebar/toolbar/tab bar/sheet/tema, com JS) | Base do retrofit E do app novo single-file |
| `assets/phosphor-sprite.svg` | 20 symbols #ph-* prontos pra colar (subset por projeto) | Ao embutir ícones num arquivo único |
| `references/components/<x>.md` | Anatomia, estados e erros do componente `<x>` | **Só quando for construir `<x>`** |
| `assets/tokens.css` | A fonte de verdade dos valores (inclui `.ios-glass`, data-glass, host fixes) | Consultar; duplicar SÓ na cópia deliberada registrada (bloco inline do template) |
| `assets/tokens.json` | Espelho por máquina do `tokens.css` ("mudou um, muda o outro") | Ao consumir os valores por script — não se instala em projeto |
| `assets/tailwind.preset.js` · `assets/tailwind-v4.css` | As utilitárias, no caminho v3 e no v4 | O `install.sh` aplica o certo sozinho |
| `assets/components/<X>.tsx` | Implementação de referência | Base a adaptar, não import |
| `assets/PREVIEW.html` | Todos os componentes em CSS puro, light×dark, com demo de vidro | Validação visual |
| `scripts/install.sh` | Instalador, sempre com `--dry-run` primeiro | Passo 2 do fluxo |

## Fluxo de uso

1. **Fundações** — ler `references/foundations.md` + `references/materials.md`
   + o reference do domínio da tarefa (cor, tipo, movimento). Nada de
   construir antes disso.
2. **Tokens no projeto** — se `--ios-*` não estiver no CSS global, rodar
   `bash scripts/install.sh <projeto> --dry-run`, conferir o resumo e aplicar;
   o commit segue a regra do `CLAUDE.md`. Ele detecta sozinho Tailwind v3, v4 ou sem Tailwind.
   Duas exceções:
   - **arquivo único / `file://`** (painel, protótipo, página mandada por
     mensagem): tokens INLINE no `<style>`, cópia literal do `tokens.css` com
     comentário de origem — `<link>` externo quebra o caso de uso
   - **app com navegação**: ler `references/app-shell.md` ANTES do layout
     macro (decisão desktop×mobile e armadilhas de cascata)
3. **Componente** — ler `references/components/<x>.md`, partir do
   `assets/components/<X>.tsx`, consumir só vars, utilitárias `ios-*` e a
   classe `.ios-glass` pro material. Sem Tailwind no projeto? O CSS puro do
   `PREVIEW.html` é a referência.
4. **Validar** — checklist de `references/accessibility.md` + texto conforme
   `references/writing.md` antes de entregar. Toque <44px, hex solto,
   `backdrop-filter` em componente, vidro dentro de vidro, sombra fora de
   vidro/overlay ou valor inventado = reprova e corrige. **Interação se
   testa CLICANDO no elemento real (`el.click()`), nunca chamando a função
   por trás** (`produto.md` §2.7). Depois do acabamento, rodar o **passe de
   precisão** (`produto.md` §4): gates mecânicos, margens MEDIDAS contra a
   régua, e **dark varrido como página nova** — dropdown aberto incluído.

## O que esta skill NÃO faz

- **Não escolhe marca nem identidade** — ela aplica a linguagem iOS; decidir
  se o produto deve parecer iOS é decisão de quem manda no projeto.
- **Não replica o irreplicável** — refração física real, highlights de
  giroscópio, haptics, wheel picker com física, squircle real. O que não dá,
  está listado com o porquê em `references/web-translation.md`, e a skill
  não finge que dá.
- **Não instala nada sem conferir antes** — `install.sh` sempre com `--dry-run`
  primeiro, e o resumo lido antes de aplicar.
- **Não inventa valor** — regra 10; TODO comentado em vez de chute, e vidro
  calibrado sempre flagado.
- **Commit pela regra do `CLAUDE.md`** — bloco fechado e verificado, stage por
  caminho.
