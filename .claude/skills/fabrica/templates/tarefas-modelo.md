# Tarefas · [FEATURE]

<!--
O formato que `fabrica/lib/tarefas-da-spec.mjs` lê, e o conferidor `specs` cobra:
  - uma fase por "## ", e o teste vem ANTES do código na MESMA fase (S3); a
    partir de SPECS.modeloDesde, UMA tarefa de teste para CADA tarefa de código
  - uma tarefa por linha: "- [ ] T001 <o que é>", com todo caminho entre crases.
    ⚠️ Arquivo que não é teste, citado entre crases numa tarefa de teste, faz
    dela uma tarefa de código: descreva o que o teste cobre sem crases
  - [M] na tarefa que toca conferidor de portão, segurança, dinheiro ou dado de terceiro.
    "Dado de terceiro" é o que vem ou vai para um serviço de fora (o contrato
    dele muda sem avisar). Dado PESSOAL (telefone, e-mail, documento) entra
    como segurança: também é [M]
  - "sem teste declarado: <razão>" na linha, quando não há teste a escrever
  - tarefa marcada [x] precisa do vermelho no provas.md, gerado pelo vermelho.mjs (S7)

Em M e G, UMA FASE POR HISTÓRIA da spec, na ordem da prioridade: a fase da H1
fecha sozinha (teste, código, portão verde) antes de a da H2 começar, e o
teste de cada fase cobre os "Dado, quando, então" daquela história. O que é de
todas as histórias (a base, os dados) vem numa fase 0, antes. Cada caso de
borda da spec vira um caso no teste da fase que o toca: caso de borda sem teste
é promessa, não comportamento. História com tela ganha um teste de navegador na
fase dela, para o que a spec diz em "Telas e caminhos".

Nenhuma tarefa de código começa com a Parada 1 da spec "pendente" (S9 reprova
a tarefa de código feita com ela pendente).
-->

## Fase 0 · A base (o que todas as histórias usam)

- [ ] T001 teste: `testes/[base].test.mjs`
- [ ] T002 código: `src/[base].mjs`

## Fase 1 · H1 · [título da história 1]

- [ ] T010 teste: `testes/[h1].test.mjs` (os cenários de aceite da H1)
- [ ] T011 código: `src/[h1].mjs`

## Fase 2 · H2 · [título da história 2]

- [ ] T020 teste: `testes/[h2].test.mjs`
- [ ] T021 código: `src/[h2].mjs`
