# Regras de movimento

Valem nos dois motores. A curva do texto e do painel é a da marca: o
`movimento.curva` do `identidade/marca.tokens.json`, que o <!-- caminho futuro: o arquivo da marca nasce no /marca configurar -->
`scripts/marca/gerar.mjs` leva ao `tokens.css` (`--ease-marca`), ao
`movimento.js` (a curva `marca` do GSAP) e ao `marca.ts` do Remotion; sem marca
configurada, a peça não nasce. Cada outro papel tem a sua curva medida (a câmera, o impacto, o selo
que passa e volta, a saída, o mergulho no corte), as 17 de
`.claude/skills/mograph/ferramentas/curvas.js`, com o papel de cada uma em
`.claude/skills/mograph/oficio.md`: **uma curva só para tudo é o movimento chapado**.

## O que tem número

| Regra | Valor |
|---|---|
| chegada | rápida e macia: cada quadro cobre 12 a 19% da distância que falta (é o que a curva da marca faz) |
| duração de um movimento | pelo menos 0,3 s (9 quadros); os grandes, 0,5 a 0,75 s; a entrada de um elemento até ~0,8 s |
| famílias de duração | micro 9 a 12 quadros, padrão 12 a 20, câmera 20 a 45, herói 30 a 75; elementos parecidos dividem a mesma curva e a mesma duração |
| saída | acelera para fora e dura ~75% da entrada |
| cascata entre irmãos | 2 a 4 quadros, e a cascata inteira até ~0,5 s |
| texto parado | pelo menos 8 quadros antes de sair, e o tempo de leitura (`.claude/skills/mograph/roteiro.md`, "As contas") |
| corte e troca de texto | na batida, ou 2 quadros antes; o morph começa ~4 quadros antes da cena |
| pausa | toda espera tem destino, e a única parada total é a vírgula antes do pico (`comum.estrutura.virgula`, em `.claude/skills/mograph/manual/comum/estrutura.md`); o quadro inteiro só para nela e no fim resolvido (os tetos, nela e em `comum.estrutura.o-fim`, e na régua `parado`, `.claude/skills/mograph/ferramentas/parado.mjs`) |
| trecho sem nada novo | o ritmo é o de `comum.estrutura.algo-novo` (`.claude/skills/mograph/manual/comum/estrutura.md`) |
| motion blur | 8 subquadros onde algo anda mais de ~15 px por quadro (4 dá fantasma) |

## O que decide

- **Continuar em vez de fazer fade.** O objeto nasce de dentro ou em volta do
  anterior, ou volta para onde nasceu; quando o objeto é a ideia, ele muda de
  forma (o botão vira a conversa). Fade puro é o padrão de quem não escolheu, e
  a corrente de transformações em toda troca é o padrão do modelo
  (as transições do manual da `/mograph`, `.claude/skills/mograph/manual/comum/transicao.md`).
- **Um movimento principal por vez.** Título, celular, painel e contador entrando
  juntos no mesmo drop disputam o olho; escalonar resolve.
- **Causa antes do efeito.** O que prova a tese acontece sozinho na tela
  (o fio que não chega), e só depois o que distrai (o contador).
- **Um plano novo quando a ideia muda.** Oito segundos no mesmo enquadramento,
  mudando só um número, reprovam na crítica.
- **O quadro 0 é a capa.** Texto legível e algo já entrando: nenhum plano começa parado.
- **Todo movimento responde "o que isso comunica?"** Se a resposta for "nada, é
  bonito", corta.

## Proibidos

Quatro dependem da marca: as curvas `bounce` e `elastic`, o contador de capítulo
("02 / 04") e o rótulo pequeno acima do título (o "Google" em cima de "Não diz se
está aberto", o kicker). Estão no `recusas` sugerido do molde; o que a marca
recusa reprova firme nas réguas `curvas` e `cromo` (nenhuma exceção cala), e o
que ela tira das recusas só avisa. Sem marca, as quatro reprovam.

Título centralizado sobre degradê; tudo entrando em fade; a mola (as curvas que passam do ponto e voltam, o `back.out` e a
`batida`, a `molaTarde` e o `quique` do `curvas.js`) fora do cartão, do selo e do
botão de interface que pousa (a mola é da interface, nunca do
texto, da câmera ou da saída); o título digitado letra a letra (digitar só no
campo do produto); o metadado de produção (BPM, qps, versão) na tela; o elemento
preso no mesmo lugar em toda cena (o marcador volta mudando de lugar, de papel ou
de escala, e inteiro só no fecho); o ícone de clip-art (escudo, troféu, foguete,
lâmpada: fica o ícone do app real e o objeto que é a ideia); **efeito como papel de parede**: brilho
(glow), partícula, degradê, luz e 3D ligados o filme inteiro ou em toda cena
(como **evento** eles entram: com causa, no instante da ação, e
gastos uma vez; a regra está em `.claude/skills/mograph/oficio.md`, "Efeito é
evento"); rótulos e molduras nos cantos; interface inventada de produto real (a
tela de terceiro entra genérica, sem logo nem layout copiado; o ícone real do app,
o do WhatsApp, o do Instagram, entra); sombra difusa decorativa; **pessoa
recortada do fundo real** (a cabeça saltando do cartão, por `remove-background`
ou equivalente: o contorno sai esquisito; gravação
real entra inteira, dentro do cartão ou em tela cheia; recorte só sobre fundo
liso ou chroma). Recusa do usuário (técnica, cor, linguagem) entra no mesmo dia
nesta lista ou, se é da marca, no `recusas` do `identidade/marca.tokens.json` <!-- caminho futuro: o arquivo da marca nasce no /marca configurar -->
(pelo `/marca configurar`), e a peça seguinte já não a usa.

**O texto atrás da cabeça não é a pessoa recortada.** Ele continua no fundo real
dela, e só o contorno da cabeça se recorta para a palavra passar por trás; nada
salta do quadro. A forma é a palavra grande, na fonte de título da marca no peso
mais forte, subindo de trás da cabeça, **uma vez por Reel**, no momento mais forte (o
título de uma parte). A palavra-chave em serifa sem recorte (numa serifa livre,
como a Instrument Serif: a serifa de sistema proprietária não se redistribui) e a pílula
com ícone que pousa ficam como opção do estilo da peça, não como padrão.
