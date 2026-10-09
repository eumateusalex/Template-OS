# O método

É um plano de direção criativa de vídeo em 14 estados, numa ordem fixa e
dimensionado por tamanho. A regra-mãe: **código não decide
direção, executa uma direção já pensada.** A ordem de prioridade também é fixa:
mensagem, clareza, verdade, narrativa, marca, composição, ritmo, movimento,
polimento, e só então a facilidade de programar.

## Os estados, por tamanho

| # | Estado | P | M | G | O que sai |
|---|---|---|---|---|---|
| 1 | Entrevista e manifesto | sim | sim | sim | o manifesto no `roteiro.md`, aberto pelo filme numa frase |
| 2 | Inventário do que existe (marca, produto real, gravação) | sim | sim | sim | a tabela de ativos, com a origem de cada um |
| 3 | Referência decomposta | — | se houver | sim | `SPEC.md`: quadros extraídos com ffmpeg, cortes pela diferença entre quadros, cor tirada do pixel, tempo medido. "A gramática da referência, nunca o conteúdo". Referência por link: o `/watch` (plugin opcional, motor `local`, nada sai da máquina) baixa, extrai os quadros por cena e a legenda; sem ele, `yt-dlp` e ffmpeg à mão |
| 4 | Três direções em 3 a 5 cenas | — | — | sim | o usuário escolhe vendo lado a lado (decisão visual é dele) |
| 5 | Batidas e contas | curto | sim | sim | a tabela de cenas em quadros, com a fala (quando há voz) e "o que o espectador entende", e as contas de tempo, espaço e história (SKILL.md, seção 0, ponto 5); com narração, a janela de cada fala e o tempo medido pelo `falar.mjs --janela` |
| 6 | Som escolhido e medido | se houver | sim | sim | BPM, recorte e drop (`som.md`) |
| 7 | Quadros parados | sim | sim | sim | a folha do `snapshot`, olhada antes de animar o resto |
| 8 | Animatic | — | — | sim | render de conferência só com os cortes e o som |
| 9 | Construção | sim | sim | sim | a peça inteira existe antes de polir qualquer cena |
| 10 | Conferência do motor | sim | sim | sim | `check` sem erro |
| 11 | Render e medidas | sim | sim | sim | quadros, duração, volume, efeitos no quadro; anúncio em qualidade máxima (`--crf 4`, `hyperframes.md`) |
| 12 | Crítico (e comunicação em M e G) | sim | sim | sim | notas ≥ 8 (`critico.md`) |
| 13 | Determinismo | — | sim | sim | PSNR ≥ 50 dB entre dois renders |
| 14 | Entrega | sim | sim | sim | `saidas/<peça>/` com MP4, capa, legenda e a página de revisão |

Na primeira peça do workspace, ou quando a linguagem é nova, o estado 4 roda
mesmo em P e M, como prancha de direções (SKILL.md, seção 0).

O que se pula fica escrito em "Decisões" do roteiro: o estado, o motivo e o que
se perde.

## As regras que atravessam tudo

- **Não ilustrar a palavra, ilustrar a ideia.** "O anúncio não vê o clique" vira
  um fio que sai da mensagem e não chega ao contador; ilustrar a palavra seria um
  ícone de olho fechado.
- **Material real antes de tudo:** produto real, ativo da marca (`_marca/logo/`),
  foto do próprio negócio, e só então construir ou gerar. Nunca inventar tela de
  produto real, número medido ou recurso.
- **Afirmação com base.** Cada frase que afirma algo aponta a fonte no roteiro;
  número de cena (ilustrativo) é permitido em conteúdo, e em venda direta só o
  medido (`_memoria/prova.md`).
- **Nota de diretor, não de programador.** O pedido de mudança diz o problema e
  o resultado esperado, com o quadro ("S03: o contador rouba o olho do fio;
  começar no 270"), nunca "deixa mais dinâmico".
