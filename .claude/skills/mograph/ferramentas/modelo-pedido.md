# O pedido de motion · modelo

> O que o usuário cola numa sessão do Claude Code para pedir um vídeo em motion, na sessão do
> workspace dono da marca (este, um projeto pessoal, um cliente). A `/mograph`
> faz o resto: pesquisa, prancha, plano, montagem, réguas, crítico e a entrega pela
> `/video`. **O que o pedido já diz, a skill não pergunta**; o que ela ainda pergunta é a
> rodada 2 de `.claude/skills/mograph/sabatina.md` (a direção na prancha, os ajustes da
> página de planejamento, a trilha) e o gosto ou negócio que o pedido deixou aberto.
> Vinheta até 3 s e peça P sem direção nova vão direto à `/video`.
>
> Cada linha da tabela espelha o `modelo-brief.md`, para o brief nascer preenchido. O que
> está entre `<` e `>` se troca; linha que não se aplica sai; "você decide" é resposta válida.

## O texto que se cola

```markdown
/mograph

<o pedido nas minhas palavras, em duas ou três frases: o que é, para quem e para quê>

| Campo | Valor |
|---|---|
| Marca e workspace | <quem assina e onde a marca mora: o CLAUDE.md daqui, a marca do /carrossel> |
| O que já está decidido de movimento | <a linguagem de movimento, as réguas e as peças anteriores deste workspace, ou "nada ainda: parte da prancha"> |
| O filme numa frase | <o que fica na cabeça de quem assiste, ou "me propõe duas"> |
| Público e idioma | <quem assiste e em que língua> |
| Objetivo e função | <atenção, conexão, autoridade, prova ou conversão; o que a pessoa faz depois> |
| Modo | <puro (tudo desenhado) · falado com a minha gravação em <arquivo> · falado com o roteiro que você escreve e eu gravo> |
| Estilo | <motion · comercial · explica · anuncio-meta · anuncio-google · bumper, ou "você escolhe"> |
| Destino e formato | <orgânico ou anúncio, e a chave do formatos.json: reel, anuncio-reels, shorts, tiktok, meta-feed-4x5, quadrado-1x1, yt-16x9; mais de um é a mesma linha do tempo reposicionada> |
| Duração | <a faixa em segundos; a ficha do estilo tem a dela, e a trilha medida decide dentro da faixa> |
| Referência | <um link · "pesquisa no meu X" · "você decide"> |
| Anti-referência | <o que não pode parecer, com um ou dois exemplos> |
| Ativos que existem | <gravação, tela real do produto, foto, logo, mascote, fonte; e o que falta> |
| Voz | <sem voz · a minha, gravada · IA com licença comercial, com o custo antes · IA só para eu ver> |
| CTA e o que posso afirmar | <o fecho; o que a memória permite prometer e o que é proibido> |
| Versões | <uma · também em <idioma> · 16:9 e 9:16> |
| Geração por IA | <teto em US$ para imagem ou vídeo gerado, ou "zero"> |
| O que não negociar | <as regras desta peça que valem acima da biblioteca> |
```

## Como preencher, para quem não é especialista

- **Marca e workspace.** A sessão abre na pasta dona da marca: aqui é a marca do
  `/carrossel` (`.claude/skills/carrossel/marca/`); num projeto ou num cliente, o
  `CLAUDE.md` de lá diz onde a marca mora. Sem marca fechada, a
  skill para antes do roteiro.
- **O que já está decidido de movimento.** Se o workspace já tem linguagem de movimento,
  régua ou peça aprovada, aponte: ela manda sobre a biblioteca da skill. Sem nada, a prancha
  decide, e o que ele escolher vira o leque das próximas.
- **O filme numa frase.** Não é o tema, é o que a pessoa leva ("o cliente decide antes de
  chegar"). Na dúvida, "me propõe duas": a skill traz a partir do pedido e da memória.
- **Público e idioma.** A língua muda a voz, a legenda e a régua de texto.
- **Objetivo e função.** Para que a peça existe na semana (`_memoria/marketing.md`).
- **Modo.** A pessoa na tela com motion por cima pede a gravação, que passa pelo `/cortes`;
  sem gravação, é motion puro.
- **Estilo.** A chave de `.claude/skills/video/estilos.md`: fixa a estrutura, a faixa de
  duração e a legenda. "Você escolhe" é válido.
- **Destino e formato.** O lugar onde roda puxa a zona segura
  (`.claude/skills/video/ferramentas/formatos.json`). Dois destinos é uma peça só, na zona
  mais apertada; o 16:9 e os de feed têm a zona como hipótese, conferida a olho.
- **Duração.** A faixa que ele quer. Se a ficha do estilo diz outra, a sabatina mostra os
  dois números com a trilha medida, e ele decide.
- **Referência e anti-referência.** Um link vale mais que um adjetivo. O que não pode parecer
  alimenta o crítico. As recusas de sempre já estão na skill: não precisa repetir.
- **Ativos.** O que existe entra como é; o que falta a skill produz ou pede.
- **Voz.** Peça que vai ao ar com voz de IA precisa de licença comercial; a skill diz o custo
  antes (`.claude/skills/video/voz.md`).
- **CTA e o que posso afirmar.** A memória do workspace (`prova.md`, onde existir) manda
  sobre a promessa; o que ela proíbe não entra nem como cena.
- **Geração por IA.** Imagem ou vídeo gerado custa e tem licença: um teto em dólar, ou zero.
- **O que não negociar.** Regra desta peça que vale acima de tudo: versão de motor, fonte,
  mascote, a decisão de um sócio.

## O que não entra no pedido

Motor, trilha, lista de técnicas, atos com timecode, pesquisa, prancha, "anos de
experiência" e nota de autoavaliação. A skill decide ou pergunta à parte, e pedir no texto
só repete o método com menos precisão; a nota que a própria peça se dá não é régua, porque
o crítico é outro agente (`.claude/skills/mograph/lente-do-critico.md`).

## A entrega

A da `/video`: o MP4 final em `saidas/` (ou onde o `CLAUDE.md` do workspace mandar), o
`brief.md` com as decisões dele, o roteiro e o plano, o relatório com as réguas rodadas e a
prova de determinismo, a página de revisão e o projeto editável. Nada publicado.
