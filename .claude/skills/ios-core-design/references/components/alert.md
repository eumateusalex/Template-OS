# Alert · `Alert.tsx`

> Equivalente nativo: `UIAlertController(.alert)`.

## Anatomia

- **Painel de vidro** centrado de **270px** (largura nativa): `.ios-glass`
  + `rounded-ios-alert` (26px). O vidro é decisão da linguagem (regra 8:
  Liquid Glass, não clássico); o sólido só existe como fallback automático da classe, que também
  traz a borda de luz e a sombra: sem fundo nem sombra próprios.
- Título **Headline centrado** + corpo **Footnote centrado** em
  `--ios-label`, padding 16px/20px.
- Botões separados do corpo e entre si por hairline `--ios-separator`:
  2 botões lado a lado (50/50); 1 ou 3+ empilhados. Altura 44px, Body
  azul; `cancel` em semibold; `destructive` em `--ios-red`.
- Entrada: `animate-ios-alert-in` (scale 1.1→1 + fade, 0.3s). Véu de COR
  via `.ios-dialog::backdrop` (`--ios-scrim`) — nunca blur de tela.

## Quando usar

- Interromper com decisão obrigatória: confirmar destrutivo, erro que
  impede o fluxo, permissão crítica.

## Quando NÃO usar

- Confirmação de rotina que não precisa parar o mundo → `Toast`
- Escolha entre várias ações contextuais → `ActionSheet`
- Conteúdo/formulário → `ModalSheet`
- "Sucesso!" depois de toda ação → não interromper por padrão

## Estados

O alerta em si não tem estados — os botões seguem o pressed padrão (`opacity: 0.7`).

## Conteúdo e texto

Título curto afirmativo ou pergunta direta ("Apagar esta conversa?"); corpo
de UMA frase com a consequência; destrutivo com o verbo ("Apagar"), cancelar
sempre "Cancelar" (`writing.md` §2-3, pares 5-7). Máximo 2–3 botões.

## Acessibilidade

- `<dialog role="alertdialog">` com `showModal()`: foco preso, Esc
  cancela, fundo inerte — tudo nativo.
- `aria-labelledby` no título, `aria-describedby` no corpo.
- O foco inicial cai no botão NÃO destrutivo.
- Esc dispara a ação `cancel` (fechar sem decidir = cancelar).

## Erros comuns

- Anel de foco riscando o alerta: o `showModal()` foca o primeiro botão
  e o `:focus-visible` global desenha o anel colado na hairline. O
  substituto certo é realce de fundo no botão
  (`:focus-visible{outline:0;background:var(--ios-fill-secondary)}`) —
  remover anel sempre exige substituto à altura.
- Painel com fundo sólido → é o iOS clássico; no Liquid Glass o alerta é vidro
  (regra 8) — sólido é fallback da classe, não escolha do componente.
- Alerta com X de fechar no canto → alerta se resolve pelos botões.
- Três frases de corpo → uma frase; contexto extra pertence à tela.
- "Sim"/"Não" como rótulos → o verbo do ato.
- Destrutivo como primeiro botão em destaque → cancelar vem primeiro (ou à
  esquerda); o destrutivo nunca é o caminho de menor resistência.

## Web: limites

- O nativo desenha título e botões em **material vibrante** (vibrancy: o
  label amostra e realça o que está atrás do vidro) — isso não se replica na
  web. Os labels usam as cores normais (`--ios-label`, `--ios-blue`,
  `--ios-red`) sobre o vidro Regular, que garante o contraste (`materials.md` §2).
