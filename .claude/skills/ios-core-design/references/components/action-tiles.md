# Action Tiles · composição em CSS puro (sem .tsx)

> A fileira de ações do app **Contatos** (mensagem · ligar ·
> vídeo · mail) — o padrão certo pra "ficha de contato" com ações diretas.
> Substitui o botão largo de rodapé ("Abrir WhatsApp") que é cara de web.

## Anatomia

- Grid de colunas iguais (`repeat(auto-fit,minmax(0,1fr))`, gap 8), logo
  **no topo do corpo** da ficha, antes da lista de fatos.
- Tile: `--ios-bg-grouped-secondary`, raio `--ios-radius-input` (12px —
  o botão é cápsula, e cápsula não serve pra tile: ele é um
  retângulo tocável), altura
  mínima `--ios-h-button` (50px), coluna centrada com ícone de **24px**
  (tamanho fixo de barra, comentado) + rótulo **Caption 1**.
- Cor: o acento do CANAL — azul por padrão; verde para
  mensagem/ligação (Telefone e FaceTime são verdes no iOS).
- Rótulo **minúsculo** ("mensagem", "ligar") — é a caixa do app Contatos;
  decisão registrada, não deslize de title case.
- Press: o padrão universal (scale 0.97 + opacity 0.7).

## Quando usar

- Detalhe de contato/lead/cliente com 2 a 4 ações de canal diretas
- Qualquer "ficha" cujo rodapé estava virando pilha de botões largos

## Quando NÃO usar

- Uma ação primária de fluxo → `Button` filled
- Mais de 4 ações → menu (`ContextMenu`) com `DotsThree`
- Navegação → célula de lista com chevron

## Conteúdo e texto

Rótulo de UMA palavra, minúscula, sem verbo composto ("mensagem", nunca
"Enviar Mensagem" — o tile é o verbo). Telefone liga por `tel:` com o
número já normalizado (só dígitos, DDI na frente).

## Acessibilidade

- Cada tile é `<a>` (tel:, wa.me…) ou `<button>` de verdade; o rótulo
  visível é o nome acessível; ícone `aria-hidden`.
- Tile sem canal disponível (lead sem telefone) **não renderiza** —
  não existe tile desabilitado nesta composição.

## Erros comuns

- Botão largo verde "Abrir WhatsApp" no rodapé → é exatamente o que este
  padrão substitui.
- Logo de marca de terceiro no glifo → `ChatCircle`/`Phone` do sistema;
  a marca aparece no rótulo se precisar, nunca no ícone.
- Tiles com cores variadas "pra diferenciar" → o acento categoriza o
  canal, não decora.
