# As armadilhas medidas

> O que quebra a fábrica, e a cura. Mora fora do `SKILL.md` porque não guia
> nenhum passo.

⚠️ **`node --check` não valida módulo ES.** Conferir é carregar o módulo.

⚠️ **No Windows, apagar arquivo com handle aberto deixa a exclusão pendente**
(inclusive no passo morto por tempo). Use `kit/lib/temporaria.mjs`, que espera
drenar e grita quando não consegue.

🚨 **`NODE_TEST_CONTEXT` vaza para o processo filho**: um `node --test` dentro de
outro emite stdout VAZIO e sai 0. O `kit/lib/runner.mjs` limpa a variável.

🚨 **Regex escrita por heredoc corrompe**, e a ferramenta de arquivo também grava
`̀` como o caractere cru. Intervalo de caractere se monta com
`new RegExp` e barra dobrada, e depois roda
`node .claude/skills/fabrica/scripts/confere-caracteres.mjs`.

🚨 **Limpeza automática de byte quebra código de propósito.** O conferidor de
caracteres só acusa.

⚠️ **`--test-reporter-destination` não cria a pasta** e sai com código 7. Com o
repórter `lcov` sozinho, o stdout fica vazio e a mutação não conta teste: use
dois repórteres.

⚠️ **O junit do node não traz o erro de carga do arquivo**: quando o módulo não
existe, ele diz só "test failed". O `vermelho.mjs` pega o erro na saída do
processo.

⚠️ **O vitest diz `numTotalTests: 0` quando o arquivo nem carrega**: a suíte que
falhou sem asserção conta como falha no `vermelho.mjs`.

⚠️ **`round()` do Python arredonda para o PAR** (`round(100.5)` é 100). Em
dinheiro, `Decimal` com `ROUND_HALF_UP`.

⚠️ **Script que usa a pasta corrente como raiz muta a árvore errada** quando a
sessão está noutra (num worktree, por exemplo). O `mutar.mjs` tem `--raiz`, e o
`provar-mutacoes.mjs` acha a raiz pela própria posição.

⚠️ **Duas sessões rodando a autoprova da fábrica (o `teste-fabrica`) ao mesmo
tempo dão vermelho falso**, porque o C2 muta a fonte
do kit no lugar. E **copiar o kit enquanto o C2 roda leva a mutação junto**: a
cópia sai com uma condição trocada (um `if (true)`, por exemplo), e só o C1 e o
C2 da cópia acusam. A mutação da fonte só roda no CI, num worktree ou com
`--com-mutacoes` pedido à mão, e nada se copia da árvore enquanto ela roda.

⚠️ **Valor novo plantado em `provas/segredos.mjs` quebra o varredor de segredos
de quem isenta os exemplos do kit por arquivo e sha256** (um conferidor de
segredos próprio do projeto, ou a lista de isenção do gitleaks): cada valor novo
das provas o deixa vermelho até a lista de lá ser atualizada. Ao atualizar o kit
num projeto assim, diga sempre se as provas do `segredos` ganharam valor novo.

⚠️ **O provador de mutações inteiro leva dezenas de minutos no Windows** (perto
de 25 para uma centena de mutações; as da bancada, ~50 s cada). Morto no meio de uma
mutação, o `finally` que restaura o arquivo não roda a tempo: o C4 testa o
arquivo mutado, e o D11 o acha modificado no fim. No Windows o processo filho
pode sobreviver à morte do pai, terminar e restaurar depois, então o arquivo
parece limpo quando se vai olhar. Por isso o provador recebe `--prazo` e **para
entre uma mutação e outra**, antes de começar uma que não caberia, sem deixar a
fonte mutada; o C2 dá a ele 40 minutos dentro de um teto de 45. Se mesmo assim o
teto estourar, o C2 diz que foi **morto por tempo** em vez de parecer mutação
escapada. Vermelho assim se repete uma vez com a máquina livre antes de virar
diagnóstico.

⚠️ **Numa obra feita num worktree, as lentes rodam com o texto da árvore
principal**: o Claude Code carrega o agente de onde a sessão abriu, e os
revisores mudados no worktree só valem depois do merge. Se a obra muda os
revisores, a rodada que importa é a de depois do merge, ou o prompt manda ler o
arquivo novo do worktree.

⚠️ **Na raiz do workspace, o portão roda a cópia instalada do kit, e não a fonte**: defeito
plantado na fonte passa pelo portão verde. O que exercita a fonte é o
`teste-fabrica`, e o conferidor `kit` acusa a fonte que mudou sem refazer o
manifesto dela.
