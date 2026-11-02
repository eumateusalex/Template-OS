# Modo briefing · o pedido de uma peça

O briefing é o que a skill de produção recebe para montar a peça: **o que a peça
precisa fazer**, antes de qualquer slide. Ele não escreve a peça; ele decide a
função, a forma e o critério de pronto, com o porquê.

## Entrada

Uma linha da semana (`semana.md`), ou um tema avulso que a pessoa trouxe. Com
tema avulso, a peça ainda precisa caber na semana: diga em que dia e no lugar de
qual peça ela entra.

## O briefing, campo a campo

Os campos tese, pessoa, função e CTA são os que o `roteiro.md` do `/carrossel`
copia no topo. **No carrossel que vende** (função prova ou conversão), o
briefing lê antes a copy de negócio
(`.claude/skills/carrossel/referencias/copy-de-negocio.md`) e já diz em que
slide ficam a dor latente, o desejo e a prova; a semana propõe o gancho sem essa
régua, o briefing o acerta a ela e diz o que trocou.

| Campo | O que diz | A régua |
| --- | --- | --- |
| tese | uma frase: o que a pessoa leva da peça | `escrita-publica.md` |
| pessoa | quem precisa entender, em concreto (a dona da clínica que perde horário vazio, não "empreendedores") e o nível de consciência dela | `marketing.md`, "As duas audiências" e "Jornada de consciência" |
| território e função | um território e uma função | `marketing.md` |
| formato e profundidade | carrossel (qual formato e quantos slides), reel (quantos segundos), post avulso, estilo X | a tabela de profundidade do `semana.md` |
| o que a peça precisa provocar | a métrica que diz se ela funcionou: envio, salvamento, seguidor, visita ao perfil, comentário | a tabela "As funções" do `SKILL.md` |
| gancho | três propostas de capa ou de primeiros segundos, de tipos diferentes (pergunta, número, opinião contrária, cena, erro), cada uma com o tipo | `acervo/reel-e-stories.md`, 3 a 5; `acervo/carrossel-e-legenda.md`, 3; a capa final é do `/carrossel` |
| CTA | o tipo que a função aceita e a frase proposta, com o motivo na mesma frase. **A conversão sem destino conhecido** (link da bio não lido, mensagens sem quem atenda) não tem CTA válido: a peça cai para prova, e o briefing diz isso e a condição para voltar | `escrita-publica.md`, "O CTA"; `marketing.md`, "Função do conteúdo"; o estado da `estrategia.md` |
| fonte | de onde vem cada afirmação verificável e cada número; o fato que a semana marcou "a conferir no briefing" se confere aqui, na fonte primária, com o link e a data. Número que não se achou vira conta de exemplo, declarada como exemplo | `_memoria/prova.md` |
| roteiro de fala (só no reel falado) | as perguntas que a pessoa responde em tópicos, na ordem do reel e com o tempo de cada parte somando a duração da função; o gancho é a primeira. Quando ela mandar os tópicos, a skill lapida e corta, sem escrever do zero | a `humanizer` e a voz da `escrita-publica.md` |
| princípios | de um a três princípios do acervo que sustentam a forma escolhida, com o arquivo e o número | `principios.md` |
| skill | a skill que produz e o comando de partida | a tabela "Qual skill" do `CLAUDE.md` |

## Como escolher a profundidade

1. A regra por formato: a tabela de profundidade do `semana.md`.
2. A pergunta que decide dentro da faixa: **a peça ensina ou atrai?** Peça que
   ensina um passo a passo usa o teto da faixa; peça que só planta um conceito
   usa o piso. **Prova e conversão** seguem o arco da copy de negócio: o número
   de slides é o de papéis que a história precisa; slide sem papel sai.

## O acervo no briefing

Busque pelo assunto da forma, não pelo tema da peça:

```bash
grep -rn -i 'gancho' .claude/skills/instagram/acervo/
grep -rn -i 'capa' .claude/skills/instagram/acervo/
```

Técnica do acervo que a marca recusa não entra no briefing: a marca manda
(`identidade/design-guide.md` e a marca configurada do `/carrossel`). Os
princípios vão no briefing, que é interno; nada deles vai para a peça como
citação.

## Onde grava

Na pasta da peça que a skill de produção vai criar, como `BRIEFING.md`, ou, se a
pasta ainda não existe, no fim do arquivo da semana (`semana.md`, passo 7), numa
seção nova `## Briefing · <dia dd/mm> · <tema>`. Os subtítulos de dentro do
briefing levam o dia (`### O gancho · qui 29/10`), para o segundo briefing da
semana não colidir com o primeiro.

## A entrega

O veredito nos dois sentidos: "está ok" quando todo campo está cheio e nada
depende de condição; "não está ok: <a condição>" quando a peça espera algo da
pessoa (o link, a gravação, o fato a conferir). Depois, o briefing e o comando
de partida, nesta forma: `/carrossel a partir do briefing em <arquivo>, seção
<título>` (no reel, o `/cortes` depois que a pessoa gravar). A peça montada
volta ao `/estudio`, onde o `revisor-de-estrategia` confere se ela cumpre este
briefing.
