# Rebrand — o retrofit estrutural de um sistema PRONTO

> O caminho 1 da skill: "aplica a skill nisso" significa TRANSFORMAR o
> sistema, não repintá-lo. A tabela do que vira o quê: `app-shell.md` §0.
> O chassi pronto: `assets/app-shell-template.html`. Depois do chassi, a
> produção é a MESMA dos dois caminhos: **`produto.md`** (§2 ciclos ·
> §3 acabamento · §4 passe de precisão). Um retrofit que só troca tokens não
> basta: produto Apple é o SHELL.

---

## 0 · A régua

Recebeu um sistema pronto ("aplica a skill nisso")? O resultado esperado é o
de um app de Mac/iPadOS: sidebar com o nome do produto, toolbar de vidro,
tab bar no celular, tema próprio, ícones de verdade. **Se ao final o header
original ainda existir, o trabalho não terminou.** Repintar cores e raios
sem reestruturar é o erro nº 1 desta skill.

## 1 · Inventário (antes de tocar em qualquer linha)

Ler o sistema inteiro e preencher a tabela do `app-shell.md` §0 com o que
ELE tem:

- **Views**: quantas telas/abas de primeiro nível? (viram `[data-v]` na
  sidebar + tab bar — 2 a 5; mais que isso é decisão de produto)
- **Filtros e controles globais**: selects, buscas, chips de estado
- **Ações globais**: conectar, atualizar, exportar, configurar
- **Overlays**: fichas/detalhes, alertas, toasts
- **Tema**: o sistema tem controle próprio? (vai ganhar)
- **Dados/JS de domínio**: o que NÃO se toca — listar os ids/funções que a
  fiação nova precisa preservar

## 2 · Chassi

Colar o `assets/app-shell-template.html` como base e ligar o que existe:

1. Renomear as views demo (`[data-v]` + mapa de títulos do `setView`).
2. **Armadilha 1**: o `setView` escreve `style.display` inline além do
   `hidden` — view nova precisa declarar o display dela ali, senão nasce
   `none`.
3. **Armadilha 2**: as media queries do shell vivem no FIM do CSS — regra
   base declarada depois delas vence (mesma especificidade). Não reordenar.
4. Manter os ids do template (`#vtitle`, `#tot`, `#q`, `#fbtn`, `#side`,
   `#grab`, `#tema`, `[data-qn]`) — a fiação do shell depende deles.

## 3 · Migração (a tabela do §0, pedaço a pedaço)

| Do sistema | Pro shell |
|---|---|
| Nome/brand do header | `.appname` da sidebar |
| Abas de navegação | `.srow [data-v]` (sidebar) + `.titem [data-v]` (tab bar) — o `setView` já cuida dos dois |
| Filtros | Seção "Filtros" da sidebar (selwrap de 44 + caret do sprite) |
| Chips/régua de estado | Seção própria com header em caps |
| Busca | Cápsula na toolbar (`#q`); no mobile quebra pra 2ª linha de 52 |
| Ações globais | Rodapé da sidebar (`.sec` com `margin-top:auto`) |
| Contadores duplicados | Padrão `[data-qn]`: um seletor preenche sidebar e tab bar |
| Ficha/detalhe | O sheet do template (dialog + inert + foco) |
| — (não tinha) | Seção "Aparência" (Auto/Claro/Escuro + localStorage + anti-flash) |

O JS de domínio (render, cálculo, dados) fica intacto — a migração muda ONDE
os elementos moram, não os ids que o domínio usa.

## 4 · Matar o header

Apagar o header original e todo CSS órfão dele. É o gate: rodar
`grep -n "header" no arquivo` e justificar cada sobrevivente (o `<header>`
morto não pode ser um deles).

## 5 · Conteúdo

Com o shell de pé, as áreas de conteúdo seguem os references de sempre:
tokens (regra 3), raios concêntricos (§3 do foundations), cards sólidos
(materials §5 — vidro é cromo), tipografia na escala, agora DENTRO da
estrutura certa.

## 6 · Daqui em diante é produção — `produto.md`

O que vem depois do conteúdo NÃO é específico de retrofit e mora em
`produto.md`: **§2 ciclos de verificação** (clique real, http+file://,
sondas, primeira impressão pareada) → **§3 acabamento de produto** →
**§4 passe de precisão** (gates, régua de margens medida, dark como página
nova). Rodar por inteiro, na ordem do §4.5 de lá.

O retrofit acrescenta UMA verificação própria aos ciclos: **funcionalidade
original intacta** — o domínio continua fazendo tudo que fazia antes do
rebrand (é o teste que o caminho do zero não tem).

## Checklist de saída (só o que é do retrofit)

- [ ] Header original morto (e CSS órfão junto) — gate do §4
- [ ] Funcionalidade original intacta (o domínio inteiro re-testado)
- [ ] **A portaria comum do `produto.md` rodada por inteiro** (checklist de
      saída de lá, item a item)
