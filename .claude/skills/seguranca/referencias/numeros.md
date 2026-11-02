# Números — a régua do que se cita

> Número que circula em texto de segurança e número que se pode citar são coisas
> diferentes. Este arquivo guarda a régua e a situação dos números que mais
> aparecem.
>
> **Lido quando:** antes de citar estatística ou número de padrão em relatório,
> em requisito ou na conversa com quem recebe a auditoria.

---

## A régua

**Número sem fonte primária não entra.** Número não verificado destrói a
credibilidade de um documento de segurança inteiro, e é exatamente onde texto de
divulgação costuma escorregar.

Número com autor e data também não é automaticamente número usável. **Amostra
dirigida, interesse comercial de quem mede e cadeia de citação são parte do
dado**, e omiti-los é o mesmo que inventar o número — com a agravante de parecer
rigoroso.

**O catálogo não carrega estatística.** Ele declara requisito, e requisito não
precisa de número para valer. Os números abaixo servem para contexto e conversa,
sempre com a ressalva junto e com a fonte primária nomeada no próprio relatório
de quem cita, conferida de novo na edição corrente.

**Consequência legal também fica fora do catálogo.** O teto de sanção previsto
em lei confere com o texto da lei, e mesmo assim não entra: o catálogo declara o
requisito, não a consequência, porque ela muda por jurisdição.

**Limite de plano de plataforma não entra no corpo.** Vai para `stacks.md`, com
a data da conferência, porque muda sem aviso.

---

## Número de padrão

As pendências de verificação das âncoras moram em `dados/ancoras.json`
(`meta.pendencias_de_verificacao`), e o que já está respondido, com a fonte e a
data, em `meta.resolvidas` do mesmo arquivo. **Enquanto uma pendência estiver
aberta, cita-se o assunto, nunca o número** — é a regra 9 do `SKILL.md`.

O que está aberto:

1. **Numeração fina por capítulo do ASVS 5.0.0.** A versão está conferida; a
   numeração dos capítulos não. Por isso o campo de mapeamento usa o assunto, e
   não o número.
2. **Se a régua de interface de programação tem edição posterior a 2023.**
3. **O Anexo A da norma de gestão** está conferido só em fonte secundária,
   porque a norma é paga. É por isso que o mapeamento usa tema, nunca número de
   controle.

O que está respondido consta **com a fonte**, nunca solto.

---

## Os que podem ser citados, com a ressalva junto

| Afirmação | Situação |
|---|---|
| **45% das amostras de código geradas por modelo introduziram falha do Top 10 da OWASP** | **Conferido na fonte primária:** relatório de fornecedor de análise de código, edição 2025, com mais de 100 modelos em quatro linguagens. ⚠️ **A ressalva é parte do número:** são amostras de código num teste controlado, não medição de sistema em produção |
| **98% de 1.072 aplicações feitas com ferramenta geradora tinham ao menos uma falha; 26 passaram limpas** | **Conferido na fonte primária**, com responsável, data e método descritos. ⚠️ **Duas ressalvas que mudam o sentido, e que o texto de divulgação costuma omitir:** a amostra **não é aleatória** (os alvos são achados por busca dirigida, enviesada para algumas plataformas), e **quem publica vende produto de segurança**. Vale como "levantamento de fornecedor sobre amostra dirigida". Nunca como "98% dos sistemas feitos com IA" |

---

## Os que circulam e não se citam

| Afirmação | Por que não entra |
|---|---|
| Percentual de tráfego da internet que não é humano | Série de relatórios reconhecida no setor, com ano, percentual e editor não conferidos na fonte primária |
| Taxa de falha de aplicações feitas com ferramenta geradora | **Suspeita de distorção.** O número que circula parece vir de estudo sobre retorno de projetos corporativos com IA, que é assunto diferente de aplicação que quebra em produção |
| Quantidade de aplicações analisadas e de falhas encontradas em determinado estudo | Sem autor nem data |
| Percentual de aplicações que sobem com a política de acesso a linha desligada | Plausível, sem fonte |
| Postura atual de autoridade reguladora | Afirmação sobre órgão público, a mais sensível de todas: só com fonte oficial |
| Aumento de vulnerabilidade em quem programa com assistente | **Cadeia de fonte secundária:** a atribuição aponta para um texto que cita outro, e nenhum leva ao estudo. Cadeia assim não vira número |
| Volume de segredos vazados em repositório público num ano | Relatório de fornecedor, não conferido na origem |
| Identificador de falha citado como causa de vazamento em massa | O identificador é publicado e verificável, e **não está verificado**. Enquanto não for, cita-se o assunto, não o número |
