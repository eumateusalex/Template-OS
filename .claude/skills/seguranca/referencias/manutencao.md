# Manutenção da skill, e o vocabulário do relatório

> Abrir só em dois momentos: quando for **mexer na própria skill** (catálogo,
> scripts, referências) ou quando for **escrever relatório** num projeto cujo
> vocabulário pode colidir com o desta skill.
>
> Nada aqui é necessário para operar os quatro modos.

---

## O que esta skill é

Um catálogo de requisitos de segurança medido contra 9 padrões normativos. O
contrato de construção do catálogo está em `arquitetura.md`; a régua do que se
cita em número, em `numeros.md`.

**Genérica por construção:** nada nela pressupõe um projeto, uma empresa ou uma
tecnologia. O caso concreto entra pelo perfil detectado e pelo nível de rigor,
nunca na espinha.

**Ela é um operador**, não um manual para ler: detecta o alvo, seleciona os
requisitos que se aplicam, executa o modo pedido e devolve achado com prova.

**A regra que sustenta a economia:** um site estático ativa 9 requisitos; um
sistema com login, banco, pagamento e modelo de linguagem ativa mais de 100. É o
perfil que decide, não o operador.

**As duas classes de script, e por que a distinção importa.** `perfil.js` e
`requisitos.js` são de **consulta**: leem e imprimem, e não podem escrever,
executar processo nem acessar rede — porque rodam contra projeto de terceiro, e
efeito colateral ali é inaceitável. `relatorio.js` é de **saída**: escrever é a
função dele, e as outras duas proibições continuam valendo. A dimensão 8 cobra
as duas separadamente. Por isso o catálogo se consulta por família,
nível e superfície — sempre via `scripts/`, nunca lido inteiro.

---

## O auto-teste, e as 10 dimensões

```bash
node .claude/skills/seguranca/scripts/verifica.js
```

Sai com erro se qualquer dimensão falhar, então serve como portão. **É o
critério de pronto, e o critério não mora na cabeça de ninguém.**

| Dimensão | O que garante |
|---|---|
| **1** Integridade estrutural | JSON válido, campos obrigatórios, valores de enum, IDs únicos |
| **2** Coerência interna | Dependências existem, nada órfão, catálogo e detector alinhados, toda família alcançável, **vocabulário declarado igual ao usado** |
| **3** Números conferem | Contagem citada na documentação é a contagem real |
| **4** Genericidade | Zero nome próprio, caminho de repositório ou artefato de ferramenta específica |
| **5** Completude normativa | Toda família prevista nas âncoras tem requisito; pendências continuam declaradas |
| **6** Qualidade do conteúdo | Todo teste é executável, toda evidência é específica, todo crítico tem armadilha |
| **7** Comportamento funcional | Os scripts funcionam nos casos de borda e a economia de contexto é real |
| **8** Segurança da skill | Os scripts de **consulta** não escrevem, não executam e não acessam rede; o de **saída** escreve só no caminho recebido e mantém a trava de segredo |
| **9** Âncoras e mapeamento | A contagem de âncoras no texto confere; todo container de âncora é reconhecido; toda chave e todo valor de `mapeamento` existem na âncora correspondente |
| **10** A régua interna | Todo princípio da fundação tem requisito que o sustente, e todo identificador citado existe |

### A regra que encerra o retrabalho

Se aparecer um defeito que o verificador não pegou, **a correção é acrescentar a
dimensão que faltava**, não fazer outra revisão manual. Revisão manual encontra o
que a lente daquele dia enxerga; verificador encontra sempre a mesma coisa, e
cresce.

### Como saber se o verificador é honesto

Injetar um defeito de propósito e confirmar que ele reprova. Verificador que só
passa não prova nada. É por isso que a dimensão 5 tem a checagem estrita: um
item de âncora só conta como coberto quando todas as famílias previstas existem,
e remover uma família inteira reprova.

**As dimensões 9 e 10 são o manual de uso desta regra.** Nenhuma é ideia de
melhoria: cada uma apanha um defeito real que passa por todas as outras.

| Defeito | Como passa sem a dimensão | Quem apanha |
|---|---|---|
| Texto que escreve uma contagem de âncoras diferente da real | Ninguém conta âncoras: a dimensão 3 conta requisitos e famílias, e para aí | **9**, checagem de contagem |
| Âncora com container de nome errado vira objeto vazio | Passa **muda**: não aparece na cobertura e não reprova em lugar nenhum | **9**, container reconhecido |
| `mapeamento` é campo obrigatório | Presença conferida, conteúdo não: valor inventado passa batido | **9**, chave e valor contra a âncora |
| Metade de um princípio sem nenhum requisito | Princípio que não é régua de nada | **10**, a terceira régua de completude |

**O padrão comum aos quatro:** todos são sobre a própria régua, não sobre o
conteúdo medido por ela. Régua que ninguém confere é o ponto cego mais difícil de
enxergar de dentro, porque tudo continua respondendo "aprovado".

### Restrições que o verificador impõe ao próprio `SKILL.md`

Valem para quem for editá-lo, e são causa comum de reprovação:

- **Todo arquivo de `referencias/` precisa ser citado no `SKILL.md`** — o que
  existe e não é citado entra como órfão (dimensão 2)
- **Todo identificador de requisito citado em texto** (três letras maiúsculas,
  hífen, dois dígitos) **precisa existir no catálogo** (2)
- **Contagem grande escrita à mão é conferida contra o real** (3). Por isso
  número de requisito ou de família não se escreve em texto: sai do `--resumo`
- **Nada de nome próprio, domínio, pasta de workspace ou nome de fornecedor de
  hospedagem** fora de `stacks.md` e do campo `implementacao` (4)

### Material novo é gatilho, não fonte

Guia, checklist ou artigo de segurança que chega não se copia para o catálogo.
Ele se relê item a item contra os requisitos escritos, com uma pergunta só:
**o que está aqui e não está no catálogo?** O que sobra entra como requisito
novo numa família que já existe, mapeado às âncoras. Se não couber em nenhuma,
a falha é de arquitetura: é o teste do contrato, na Parte A de `arquitetura.md`.

A investigação que o material provoca costuma achar mais do que ele traz, porque
os achados maiores vêm de **medir** — rodar a skill contra um projeto real,
conferir uma âncora item a item —, não de ler. Antes de aproveitar qualquer
trecho, passar pelas armadilhas da Parte G de `arquitetura.md`, que é onde texto
de divulgação mais erra; a estatística que ele trouxer passa pela régua de
`numeros.md`.

---

## Vocabulário — verificar colisão antes de usar no relatório

Alguns termos desta skill são genéricos o bastante para já significarem outra
coisa no projeto auditado. Antes de usá-los em relatório, conferir:

| Termo da skill | Colisão frequente | Se colidir, usar |
|---|---|---|
| "nível" (N1/N2/N3) | Nível de log, nível de acesso, nível de plano | "perfil de rigor" |
| "token" | Token de design, token de linguagem, unidade de cobrança | "segredo" ou "credencial" |
| "política" | Política de privacidade, política comercial | "política de acesso a linha" |
| "regra" | Regra de negócio, regra de estilo | "requisito", com o identificador |

**Os identificadores não colidem com nada** e são a forma mais segura de
referenciar um requisito em qualquer contexto.
