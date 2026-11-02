# As linguagens de vídeo

O estilo (`estilos.md`) diz quem atende, o formato e a entrega. A **linguagem** diz como a peça se
mexe e soa: o ritmo, o regime do som, a transição, o texto e a cor. Um pedido pode cruzar várias
famílias (comercial, vertical, minimalista, com pessoa falando); a linguagem é a escolha que dá
coerência a esse cruzamento, e cada uma tem faixas medidas.

Os números de cada linguagem moram só em `ferramentas/linguagens.json` (as faixas e o que se mede);
aqui fica o que eles não dizem: quando serve, o que muda nas regras e o que conferir antes de dirigir.
Toda faixa é calibragem: a régua avisa, e a exceção escrita no `plano.json` da peça, com o motivo,
cala o aviso e fica no relatório como aceita. As duas réguas daqui leem o plano pelo `excecoes.mjs`
da `/mograph`: o relevo (`{ "regra": "relevo", "cena": "S03", "motivo": "…" }`) no
`simula_mix.py --contexto`, e as faixas (`{ "regra": "faixas", "trecho": "fecho parado", "motivo": "…" }`)
no `medir_ritmo.py --plano`.

**No `plano.json`**, a peça declara a linguagem (`"linguagem": "spec-ad-locucao"`) e o estilo do
`estilos.md` (`"estilo": "documental"`, ou `"estilo": { "id": "documental", "destaque": … }`); o estilo
sem linguagem traz a dele. Cada linguagem diz no `linguagens.json` quem manda no tempo (`tempo`: `voz`,
`musica` ou `evento`) e o que ela dispensa das réguas da `/mograph` (`dispensa`), e as réguas leem os
dois: onde a voz manda, a cena cai na frase (`"tempo_forte": "voz"`) e a batida da trilha não se cobra.

## 1 · Escolher pela finalidade, não pelo rótulo

A linguagem sai do brief, por seis perguntas. A recomendada vai na prancha da `/mograph` (ou na
mini-entrevista da `/video`, quando não há prancha), e o usuário troca.

| Pergunta | Se a resposta é… | puxa para |
|---|---|---|
| tem pessoa falando? | sim | `falado-com-motion` |
| quem manda no tempo? | a voz (locução) · a música · cada evento da tela | `spec-ad-locucao` · `interface-de-marca`, `promo-denso`, `gancho-curto` · `so-efeitos` |
| o que se mostra? | um produto digital (site, app, sistema) · o lançamento de um produto · um serviço local · uma ideia em texto | `interface-de-marca`, `spec-ad-locucao` · `lancamento-premium` (sem voz), `lancamento-com-locucao` (com voz) · `falado-com-motion`, `spec-ad-locucao` · `tipografia-cinetica` |
| quanto dura? | até 15 s · 15 a 35 s · mais | `gancho-curto`, `spec-ad-locucao` · a maioria · `falado-com-motion`, `tipografia-cinetica` |
| que temperatura? | sóbrio, de todo dia · denso, de lançamento | `sobrio-monocromo`, `minimalista-blueprint` · `promo-denso` |
| para onde vai? | orgânico · anúncio pago | qualquer · a espinha de anúncio do `roteiro.md` da `/mograph` por cima da linguagem |

Duas linguagens podem se somar quando uma dá a imagem e a outra o som (a imagem de
`interface-de-marca` com o som de `so-efeitos`); o plano diz qual faixa vale para quê.

## 2 · As linguagens

Para cada uma: o regime do som e o que ela muda nas regras da `/mograph`. Referência que o usuário
trouxer para a linguagem se mede com o `medir_ritmo.py` antes de dirigir, e o número dela fica ao
lado da faixa no plano.

| Linguagem | O som | O que muda nas regras |
|---|---|---|
| `interface-de-marca` | música contínua, o ritmo da imagem é a coreografia (regime solto); um som por pouso de interface | nenhum corte seco: tudo se transforma (o ícone vira a tela, o círculo nasce do toque); 13 a 18 s; o fecho no logo assenta em até 2 s |
| `spec-ad-locucao` | a voz manda: um arquivo de tempo tirado da voz (o tempo de palavra), lido pela imagem, pelo texto e pelos efeitos; a troca de cena cai no começo da frase, não na batida | o "corte na batida" (`comum.transicao.corte-seco`, no manual da `/mograph`) dá lugar ao "corte no começo da frase"; uma frase a cada 1,6 a 3,8 s; cada verbo com um gesto |
| `promo-denso` | música com batida marcada; as viradas grandes na batida forte | o teto de 3 transições por peça pode subir, com o motivo no plano |
| `lancamento-premium` | sem voz; música contínua, regime solto (o movimento não cai no som além do acaso) | um objeto por plano e um acento de cor; o objeto-ponte (a moeda, o círculo) atravessa as cenas no lugar do corte; dois atos, gatilho e resultado; respiro (perto de 17% de segundos calmos) e o fecho assentando em até 3 s |
| `lancamento-com-locucao` | a locução percorre o produto, de 8 a 12 recursos em 30 a 80 s; regime solto | o fecho pode segurar até 4,7 s com o logo do cliente; o roteiro é o tour, não as três frases da `spec-ad-locucao` |
| `falado-com-motion` | **travado**: o impacto ou o woosh no corte e no pico de movimento, chegando ~2 quadros antes (corte × onset de 0,80 a 0,85 contra o acaso de 0,41 a 0,53) | um objeto concreto por frase (chip ✓/✗, contador, botão, o B-roll no substantivo) antes de qualquer efeito; a cor do destaque tirada do cenário da gravação |
| `gancho-curto` | tudo na batida; o som chega ~64 ms antes do corte | 5 a 15 s em laço; o zoom de soco com desfoque e a palavra que acende entram como técnica da peça |
| `sobrio-monocromo` | cama baixa e respiro | segundos calmos são a linguagem (até 75%): a régua `parado` da `/mograph` aceita o respiro declarado; uma cor de acento só |
| `tipografia-cinetica` | a palavra entra no instante dita; respiro depois do clímax (o movimento cai quase a zero na frase de prova) | o texto é a imagem: a regra do componente com volume em toda cena (`oficio.md` § 4 da `/mograph`) vira opção |
| `minimalista-blueprint` | cama contínua, eventos de traço | a câmera desce por uma folha só; casa com a `/guardanapo` |
| `documental` | a voz manda: a narração em off, uma frase a cada 5,6 a 8,6 s, a trilha baixa por baixo; a batida não se cobra | o estilo `documental` traz esta linguagem; o dissolver volta, com a causa (a troca de cena por fusão); o piso de tipos de efeito e o componente com volume em toda cena não se aplicam; o fecho assenta em até 3 s; a cor de tomada para tomada pode saltar na troca de cena (`cor.md` § 3) |
| `so-efeitos` | sem música: cada evento com o som dele e silêncio de verdade (30 a 61% de silêncio, LRA de 5,9 a 12,3); o som chega depois do pico de movimento (+0,13 a +0,23 s), e não antes, como no regime travado | a cama obrigatória da régua `som` da `/mograph` não se aplica sem a exceção escrita e a aprovação do usuário, ouvindo |

**A vinheta não tem linguagem de ritmo.** Ela é a marca assentando e parando em poucos segundos, e
toda faixa da tabela mede peça com argumento, então qualquer linguagem a reprova no respiro e no fecho
sem que haja defeito. A vinheta herda da linguagem da marca (o campo "Linguagem" do roteiro, ou a da
peça anterior aprovada) a cor, a letra e o regime do som, e não o ritmo: o `medir_ritmo.py` não roda
nela (no `registro.json`, a régua `ritmo` fica `nao-se-aplica`, com o motivo no relatório), e não se
cria linguagem nova para ela. A régua dela é a `parado` da `/mograph` (o movimento resolve antes do
fim e o fim parado fica no teto da régua) e a estrutura do `estilos.md` § 3. O mesmo vale para o
`bumper` e o `laco`.

**Linguagem que ainda não tem faixa medida** (a entrevista longa, o conteúdo educacional longo):
antes da direção, a pesquisa (`.claude/skills/mograph/pesquisa.md`) mede de 2 a 4 referências com o
`medir_ritmo.py` e acrescenta a linguagem ao `linguagens.json` e a esta tabela. Sem isso, a peça segue
sem faixa e o relatório diz que não houve régua de ritmo.

## 3 · Medir

```bash
python -I .claude/skills/video/ferramentas/medir_ritmo.py <mp4> --plano <peça>/plano.json
python -I .claude/skills/video/ferramentas/simula_mix.py <peça> --contexto [--grade <bpm>,<primeira batida>]
```

O `--plano` dá a linguagem, o respiro e a vírgula ao medidor de ritmo (a referência, que não tem plano,
se mede com `--linguagem <id>`); o `--contexto` acha o `plano.json` ao lado do `index.html`. Nos dois,
a exceção escrita no plano sai como `aceito`. O Python é o do workspace, com as bibliotecas do
`scripts/requirements.txt`; outro Python se aponta por `MIXAGEM_PY`.

- **O ritmo** (`medir_ritmo.py`): a fração de segundos calmos, a janela de 2 s mais calma antes do
  fecho, o fecho parado e o resto das faixas da linguagem. O respiro é o do plano (a vírgula antes do
  pico, o respiro depois do clímax). O fecho daqui é o **quase parado** (movimento abaixo do calmo, o
  que a deriva lenta de câmera não salva) e o teto é o da linguagem; o **congelado** (quadro idêntico)
  continua com a régua `parado` da `/mograph` e o teto de 1,4 s dela. Os dois valem juntos.
- **O som dentro da música** (`simula_mix.py --contexto`, antes do render): o relevo de cada efeito
  sobre a cama, pelo papel (impacto acima da cama, woosh na altura dela, clique logo abaixo), e a
  fração dos acertos na batida contra o acaso. Na linguagem de regime travado, o acerto fora da
  batida (ou do começo da frase, quando a voz manda) é defeito; no regime solto, não.
- **A referência pela mesma régua**: o `medir_ritmo.py` mede o vídeo de referência como mede a peça,
  e o crítico compara os dois números lado a lado (`critico.md`).

O defeito típico que as duas réguas acham numa peça que "parece morna": os efeitos perto de 19 dB
abaixo da trilha, os acertos na batida abaixo do acaso, segundos calmos demais e um fecho parado
longo.
