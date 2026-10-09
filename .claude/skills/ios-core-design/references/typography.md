# Tipografia — a escala Dynamic Type

> Os 11 estilos de texto do sistema, a regra do tracking, a stack de fontes e
> os papéis de cada estilo. Cores de texto (labels): `color.md` §4. Adaptação
> fluida pra web (rem/clamp): `web-translation.md` §3.

---

## 1 · A escala (tamanho Large, o padrão do iOS)

Cada estilo é um conjunto fechado: tamanho, entrelinha, peso e tracking.
**Não se mistura** — não existe "Body um pouco maior" nem "Title2 em bold
porque ficou bonito". Existe o estilo certo pro papel certo.

| Estilo | Tamanho/Entrelinha | Peso | Tracking | Papel |
|---|---|---|---|---|
| Large Title | 34/41 | bold (700) | -0.4px | O título da tela, um por tela, no topo |
| Title 1 | 28/34 | regular | -0.4px | Título de página interna ou de seção maior |
| Title 2 | 22/28 | regular | -0.4px | Subtítulo de página, título de card grande |
| Title 3 | 20/25 | regular | -0.4px | Título de card, de grupo de conteúdo |
| Headline | 17/22 | **semibold (600)** | 0 | Ênfase no tamanho do corpo: título de célula, nome em lista |
| Body | 17/22 | regular | 0 | **O default.** Todo texto corrido |
| Callout | 16/21 | regular | 0 | Texto de apoio um degrau abaixo do Body |
| Subheadline | 15/20 | regular | 0 | Subtítulo de célula, linha secundária |
| Footnote | 13/18 | regular | 0 | Metadado, rodapé de seção, texto legal |
| Caption 1 | 12/16 | regular | 0 | Legenda de imagem, rótulo pequeno |
| Caption 2 | 11/13 | regular | 0 | O menor texto do sistema (timestamp, contador) |

Como consumir:

- **CSS puro:** classes `.ios-text-body`, `.ios-text-headline`… (tokens.css §5)
- **Tailwind:** utilitárias `text-ios-body`, `text-ios-headline`… (peso e
  tracking já embutidos — não repetir `font-bold` por cima)
- **Vars soltas** (quando precisar de só uma propriedade):
  `--ios-text-<estilo>-size/-leading/-weight/-tracking`

---

## 2 · A regra do tracking

**Tamanho ≥ 20px → letter-spacing -0.4px. Abaixo de 20px → 0.**

O motivo: o iOS troca de fonte óptica por tamanho — SF Pro **Text** até 19pt,
SF Pro **Display** de 20pt pra cima, que é mais fechada. Na web, sem as duas
ópticas garantidas, o tracking negativo **simula** a Display nos tamanhos
grandes (Large Title, Title 1–3).

- O valor vive dentro do token de cada estilo. **Nunca aplicar na mão** —
  quem usa `.ios-text-title2`/`text-ios-title2` já leva o tracking certo.
- Não inventar curva fina por tamanho: a regra é binária (≥20 → -0.4, senão 0).

---

## 3 · A stack de fontes

```css
--ios-font-text: -apple-system, "SF Pro Text", "SF Pro Display", "Inter", system-ui, sans-serif;
```

Por que cada membro, nesta ordem:

1. **`-apple-system`** — em qualquer aparelho Apple, resolve pra San
   Francisco de graça, com todas as ópticas e pesos. É o caminho feliz.
2. **`"SF Pro Text"` / `"SF Pro Display"`** — pega a SF instalada localmente
   (máquina de designer, ambiente Apple corporativo).
3. **`"Inter"`** — se o projeto carregar Inter (Google Fonts/self-host), ela
   assume fora da Apple (métrica próxima da SF, desenho neutro). **Tem que
   vir ANTES de `system-ui`**: na ordem inversa o `system-ui` sempre resolve
   (Segoe no Windows) e a Inter fica inalcançável, o que torna o conselho de
   "carregar Inter" um no-op silencioso.
4. **`system-ui`** — a fonte do sistema quando não há Inter carregada (Segoe
   no Windows, Roboto no Android). Nunca fica feio; fica nativo.
5. **`sans-serif`** — o paraquedas.

Receita de carga da Inter (quando o projeto quiser a cara Apple em toda
plataforma): `<link>` do Google Fonts com `wght@400;600;700` e
`display=swap`, mais os dois `preconnect`. Sem internet a página cai na
fonte do sistema sem quebrar — documentar isso no projeto.

### ⚠️ Licença da SF Pro

A San Francisco é licenciada pela Apple **só para uso em plataformas Apple**.

- **Nunca fazer self-host** de SF Pro (.woff2 no servidor, cópia no repo,
  import de CDN de terceiro). Além de violar a licença, esses arquivos
  circulam desatualizados.
- A stack acima pega a SF **de graça e legalmente** onde ela existe, e cai
  com elegância onde não existe. É o desenho correto; não "melhorar".
- Se o projeto quiser a mesma cara em toda plataforma: carregar **Inter**
  (open source) e pronto — a stack já a prefere sobre a genérica.
- O instalador desta skill **não baixa fonte nenhuma**, por isso.

---

## 4 · Hierarquia na prática

- **Uma tela, um Large Title.** Ele é o nome da tela, não um recurso de
  ênfase. Título de seção dentro da tela desce pra Title 2/3 ou pro header
  de seção em Footnote caixa-alta (ver `components/section-header.md`).
- **Headline não é um título — é o Body com autoridade.** Mesmo corpo (17),
  peso 600. É o estilo do nome numa célula de lista, da linha principal de
  um card. Título de verdade usa a família Title.
- **Par clássico de célula:** Headline (linha 1) + Subheadline ou Footnote em
  `--ios-label-secondary` (linha 2).
- **Peso é do estilo, não do gosto.** Os pesos do sistema são regular,
  semibold (Headline) e bold (Large Title). Não usar light/thin em texto de
  UI; não engordar estilo regular pra "dar destaque" — destaque se dá com
  hierarquia (estilo maior) ou cor de label (ver `color.md` §4). As únicas
  exceções são os **papéis de produto do §4b** — registrados, com o porquê.
- **Nunca abaixo de 11px.** Caption 2 é o piso do sistema.

---

## 4b · Papéis de produto — as exceções registradas

A escala pura diz "600 só no Headline". Um app de PRODUTO real (o padrão dos
apps da própria Apple: Fitness, Saúde, Notas no iPadOS) engorda alguns papéis
específicos. Esta tabela OFICIALIZA esses papéis. Fora dela, a regra do §4 vale
integralmente: **desvio consciente sem registro aqui é bug**.

| Papel | Estilo base | O que muda | Por quê |
|---|---|---|---|
| Nome do app (sidebar) | Title 2 | peso **700** | É a marca dentro do shell — o único 700 fora do Large Title |
| Número de KPI / stat grande | Title 1 ou Title 3 | peso **600** | Número é o dado-herói do cartão; em 400 ele empata com texto corrido |
| Título de ficha/painel de detalhe | Title 3 | peso **600** | O header do sheet lateral precisa segurar contra o corpo denso da ficha |
| Cabeçalho caixa-alta (`.lbl`, `th`, header de coluna) | Footnote | peso **600** + `--ios-tracking-caps` + uppercase + `label-secondary` | O par 400/caixa-alta some; 600 miúdo e espaçado é o header de seção do sistema |
| Chip / badge / pílula de estado | Caption 1 | peso **600**, `line-height:16px` | Texto mínimo sobre lavagem de 15% precisa do peso pra segurar contraste |
| Badge de contagem (`.cnt`, `.count`) | Caption 1 | peso **600**, `line-height` = **altura da caixa** (20px) | line-height=height é o que centra o número na pílula sem flex |
| Badge da tab bar / rótulo de barra de gráfico | Caption 2 | peso **600** (badge), `line-height:16px` | Mesma lógica de caixa; calibragem medida |
| Estado ATIVO de controle (`.on`, `.sel`) | o do controle | peso **600** | É a leitura de "selecionado" do iOS (segmented, sidebar, chip de filtro) |
| Botão e ação inline (`.btn`, `.more`, `.copy`) | Subheadline/Footnote | peso **600** | Botão de texto do iOS é semibold — 400 parece link morto |

Duas regras acompanham a tabela:

1. **Estilo completo, sempre:** quem declara `font-size` declara o
   `line-height` do MESMO estilo na mesma regra (texto herdando o 22 do Body
   num Footnote de 13 é o defeito mais silencioso do acabamento). Ícone
   dimensionado por `font-size` não precisa — não tem linha de texto.
2. **Tracking de caps é o token** (`--ios-tracking-caps`, em em — escala com
   o corpo). Hard-codar `.06em`/`0.5px` de novo é regressão.

---

## 5 · Erros comuns

| Errado | Certo |
|---|---|
| `font-size: 15px` solto no CSS | `.ios-text-subheadline` / `text-ios-subheadline` |
| Title 2 com `font-weight: 700` pra destacar | Trocar a hierarquia: Title 1, ou Headline se for célula (700 em Title 2 só existe no nome do app — §4b) |
| `font-size` sem `line-height` (herda o 22 do Body) | Estilo completo: size + leading do mesmo estilo, juntos (§4b) |
| `letter-spacing: -0.4px` aplicado à mão num 17px | Tracking só existe dentro dos estilos ≥20px |
| Baixar SF Pro do GitHub e dar `@font-face` | Stack como está; Inter se quiser consistência |
| Texto corrido em Callout "porque coube mais" | Body é o default; Callout é apoio, não economia |
| 4 tamanhos diferentes numa célula | Máximo 2 estilos por célula (principal + secundário) |
