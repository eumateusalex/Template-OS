# O prompt da faxina completa, para qualquer repositório

Copiar o bloco abaixo inteiro numa sessão aberta na raiz do repositório (ou da
pasta que reúne vários). Ele não depende de nada deste workspace: as réguas, os
comandos e as regras de cada projeto vêm do próprio projeto.

---

```text
Quero uma faxina completa deste repositório (e dos repositórios dentro dele, se
houver): sanitizar (tirar o que morreu), organizar (cada coisa no lugar da
convenção que já vige) e padronizar (a mesma convenção em tudo). O
comportamento observável fica idêntico, a não ser onde eu decidir mudar.
Trabalhe com autonomia do começo ao fim e só me chame em entrevista, para o
que é decisão minha. Nada fica solto: no fim, toda pendência está feita, tem
data agendada, ou é um gesto meu descrito passo a passo.

## Regras que não se quebram
- Credencial nunca se lê nem se imprime: compare por hash, conte linhas, use o
  valor só dentro de um comando que não o mostra. Segredo exposto se troca
  (rotaciona), não se apaga. Antes de revogar uma chave, ache todo serviço que
  a usa: chave "sem leitor" pode ser a mesma que um backup vivo usa.
- Git que reescreve ou descarta (reset --hard, clean, push que força,
  filter-repo, gc) só com o meu aval. Histórico que já está no remoto não se
  reescreve: erro de mensagem se corrige no commit seguinte.
- Commit por caminho, nunca "git add ." nem "-A" sem caminho; um assunto por
  commit; mensagem que diz o que mudou e por quê, com cada fato conferido
  antes de escrever (nunca razão de memória).
- O que não está no git passa por uma lixeira com manifesto antes de sumir; só
  apaga em definitivo o que eu mandar.
- Push que publica (deploy) só com o portão do projeto verde, e depois do push
  a conferência no ar.
- Se este repositório tem CLAUDE.md, README ou regras próprias, elas mandam.
- Ferramenta que você não conhece não roda às cegas: leia o --help ou o
  código antes. Há ferramenta sem --help que altera arquivos no lugar.
- Nada da sua pasta de trabalho entra no repositório sem ser listado arquivo
  a arquivo e passar pelo detector de segredos antes do push.
- Nada fica fora do escopo em silêncio: o que você não fizer, diga com a razão.

## Fase 0 · Blindagem e medida de antes
1. git status de cada repositório (o que já estava sujo é de antes e fica fora
   dos meus commits) e se há outra sessão trabalhando aqui.
2. Os portões de cada projeto rodados antes de mexer, com o resultado anotado
   (vermelho de antes é de antes).
3. O inventário do que é chamado de fora e por isso é intocável sem prova: CI,
   deploy, cron, scripts do package.json, configs que apontam arquivo por
   string, junções e links simbólicos, caminhos montados em runtime.
4. O entorno: o que o repositório espalha fora dele (worktrees, pastas
   temporárias e de trabalho, tarefas agendadas, o servidor, contas de serviço
   como monitoramento e hospedagem, chaves e backups). Ele entra na faxina.
5. A régua de conclusão, escrita antes do primeiro arquivo: uma linha por
   pasta com o comando que prova o padrão dela, e o livro de cobertura da
   fase 1. A faxina só fecha com a régua inteira verde ou com cada vermelho
   decidido por mim.

## Fase 1 · A leitura arquivo por arquivo
Não é amostra: cada pasta, cada subpasta, cada arquivo. Divida em lotes e use
revisores em paralelo (um por área), cada um lendo inteiro o que é dele e
devolvendo achados com caminho e linha, nesta classificação:
- morto (sem consumidor e fora do inventário), duplicado, regenerável;
- documento defasado (cita o que não existe, descreve estado vencido);
- comentário ou documento que narra história ("antes era", "na versão anterior",
  "nasceu de", selo de novo, data de quando mudou): sai a narrativa,
  fica o estado e o porquê, no presente; data só junto do número medido ou em
  registro (ticket, decisão, ADR, migration);
- nome fora do padrão, arquivo fora do lugar, pasta sem propósito escrito;
- caminho citado que não existe;
- risco de segurança (segredo em arquivo, em histórico, em backup sincronizado);
- comportamento errado que só se conserta mudando código.
O livro de cobertura prova que foi tudo: a lista de todos os arquivos (os do
git e os de fora dele que não são dependência instalada nem saída de build),
com a classificação de cada um, inclusive "lido, nada a fazer". A fase só fecha
quando classificados = total, conferido por contagem. Revisor que devolve "li
tudo" sem a lista não conta.
Junte tudo numa triagem: o que é mecânico e você aplica sozinho, e o que é
decisão minha (apagar o que pode ter valor, mudar comportamento, gastar
dinheiro, mexer em produção).

## Fase 2 · A entrevista
Rodadas de até 4 perguntas, cada uma com o contexto em uma frase e a minha
recomendação na primeira opção. Grave cada resposta com a minha frase, e
a decisão vira item da aplicação. Antes de perguntar, meça o que dá para medir
sozinho (às vezes a pendência já está resolvida e não precisa virar pergunta).

## Fase 3 · A aplicação
Por lote: mexer, corrigir todas as referências, rodar o portão, conferir,
commitar. E estas checagens, que são as que mais fazem falta:
- marca de isenção ou declaração que um conferidor exige (por exemplo
  "esqueleto declarado:", "sem teste declarado:") conta igual antes e depois:
  reescrever o comentário não pode tirar a marca;
- teste que se ancora em texto (um comentário, um título) quebra quando o
  texto sai: ancore na função, não no comentário, e prove o teste com o
  defeito plantado;
- registro de mutação ou de prova que cita um trecho de código tem de apontar
  um trecho que existe uma vez só, depois de cada edição no código;
- export cujo único "chamador" era um comentário vira não exportado;
- junção ou link dentro do que vai sair se desfaz antes (rm -rf atravessa a
  junção e apaga o alvo);
- edição de código alvo a alvo, nunca expressão regular em TSX; troca por
  script só como string literal, com a contagem de ocorrências conferida;
- na lista do git add, separe o arquivo apagado (D) e o renomeado (R): add com
  caminho apagado aborta o add inteiro, e o arquivo novo fica fora do commit;
- arquivo editado num servidor se lê de volta depois da edição (fim de linha
  CRLF e espaço fazem a troca não casar sem erro nenhum);
- antes de apagar recurso de serviço externo (projeto, chave, monitor, conta),
  prove que nada o usa: o identificador procurado nos repositórios, nos .env,
  nos arquivos do servidor e no ambiente dos contêineres; e confira em qual
  conta o navegador está antes de clicar.

## Fase 4 · O que muda comportamento
Cada conserto de comportamento é um trabalho pequeno com teste antes: o teste
vermelho visto antes do código, o código mais simples que passa, a mutação que
prova o teste, e uma revisão por outro olhar (arquitetura, código, segurança)
antes de juntar. Se o projeto tem esteira própria de software, ela manda.

## Fase 5 · Portões, CI, deploy e conferência no ar
Em cada repositório: o portão inteiro verde, o commit, o push, o CI verde no
commit (pelo SHA inteiro), e onde o push publica, a conferência no ar (as
páginas, o 404, a saúde, o que mudou de fato servido). Serviço externo que
falha (banco de teste pausado, CI sem cobrança, chave recusada) se diz com a
evidência; o que não depende dele segue, e o que depende vira pendência
descrita. Depois do último commit, mesmo que seja só de documento, o portão
inteiro roda de novo sobre o estado final.

## Fase 6 · A segunda passada e o olhar a frio
Refaça o mapeamento do zero sobre o estado novo (consumidor que saiu levando
import, caminho antigo em config, pasta vazia) e peça a um revisor sem o meu
contexto que confira o repositório e o relatório. Se a segunda passada não achar
nada, diga isso.

## Fase 7 · O relatório e o fim
O relatório diz: o que saiu e por quê, o espaço liberado, as minhas decisões com
a frase, os portões antes e depois, o CI e o deploy de cada repositório, os
erros meus (com o conserto), o nível de verificação de cada afirmação (provado
por teste, por contagem, só lido, inferido) e a lista do que depende de mim. Essa
lista vai para uma última entrevista, e você segue até ela zerar: cada item feito,
agendado com data, ou descrito como gesto meu, passo a passo. Não prometa
100%: diga o que provou, como provou, e o que ficou sem medir.

## Durante o trabalho
Quando eu perguntar como está, responda em três blocos: concluído, em
andamento e falta, com o tempo estimado de cada um. Nunca diga que está pronto
sem a régua rodada; nunca esconda vermelho.
```
