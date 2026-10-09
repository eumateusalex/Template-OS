# Varredura de IA — a marca aparece quando perguntam?

O [citability-score.md](citability-score.md) mede se a página **está pronta** pra
ser citada. Este arquivo mede se ela **está sendo**.

São coisas diferentes, e confundir as duas é o erro que faz a gente comemorar
schema novo enquanto o concorrente continua sendo o citado.

---

## 🚨 Custo: esta varredura é de graça, e vai continuar sendo

Existe API que automatiza isso (DataForSEO, cerca de US$ 0,03 por pergunta). **O padrão é não contratar**: assinatura
nova é decisão do usuário, e o modo manual entrega o mesmo dado.

O que a API compra é **escala e regularidade**, não qualidade do dado. Enquanto
forem 5 perguntas por mês num site, a mão resolve. Se um dia forem 5 sites com 20
perguntas cada, a conta muda, e aí se pergunta ao usuário.

---

## O que se pergunta

⭐ **Perguntas de COMPRADOR, nunca o nome da marca.** Perguntar "o que é a
`<marca>`" mede se a IA conhece o nome, o que não interessa: quem já sabe o nome
vai direto no site. O que vale dinheiro é a pergunta de quem **ainda não conhece
ninguém**.

Montar 5 perguntas, nesta forma:

| Tipo | Molde | Exemplo |
|---|---|---|
| Escolha | melhor `<serviço>` em `<cidade>` | melhor clínica de fisioterapia em Uberlândia |
| Indicação | quem faz `<serviço>` perto de `<bairro/cidade>` | quem instala energia solar em Uberlândia |
| Comparação | `<serviço>` vale a pena? quanto custa? | vale a pena contratar assessoria de imprensa? |
| Problema | tenho `<dor>`, o que eu faço | meu restaurante não aparece no Google |
| Critério | como escolher `<serviço>` | como escolher uma empresa de automação |

**Fixar as 5 na primeira medição e não trocar depois.** Pergunta trocada zera a
série histórica, e a série é o produto: sem ela não dá pra dizer se melhorou.

---

## Onde se pergunta

Quatro superfícies, e elas não respondem igual:

| Onde | Por que importa |
|---|---|
| ChatGPT (com busca) | maior base de usuário |
| Perplexity | é o que mais cita fonte na cara |
| Gemini | e o AI Overview do Google, que aparece pra quem nem pediu IA |
| AI Overview do Google | busca normal, sem login, aba anônima |

⚠️ **Aba anônima, sempre, e sem estar logado.** Resposta personalizada pela conta
não é o que o desconhecido vê, e é justamente o desconhecido que a gente quer
alcançar.

---

## O registro

Grava em `marketing/seo/08-varredura-ia.md` (ou o `<base>` do cliente). **Uma <!-- caminho futuro: a skill grava em marketing/seo/ no primeiro uso -->
linha por pergunta por superfície, por rodada.**

```markdown
# Varredura de IA — <site>

As 5 perguntas estão fixas desde <AAAA-MM-DD>. Trocar pergunta zera a série.

## Rodada <AAAA-MM-DD>

| # | Pergunta | Onde | Apareceu? | Quem apareceu | Fonte que a IA citou |
|---|---|---|---|---|---|
| 1 | melhor <serviço> em <cidade> | ChatGPT | não | Concorrente A, Concorrente B | listamelhores.com.br |
| 1 | melhor <serviço> em <cidade> | Perplexity | sim, 3º | Concorrente A, nós, Concorrente C | nosso /servicos/x |
| 2 | ... | | | | |

**Placar da rodada:** apareceu em 3 de 20 (5 perguntas × 4 superfícies)
**Rodada anterior:** 1 de 20
**Quem mais aparece:** Concorrente A (14 de 20)
**De onde a IA tira a resposta:** 9 de 20 vieram de diretório, não de site próprio
```

⭐ **A coluna "fonte que a IA citou" é a mais valiosa da tabela, e é a que todo
mundo esquece.** Ela responde *por onde entrar*: se em 9 de 20 respostas a IA
citou um diretório de listagem, a próxima tarefa não é mexer no site, é **estar
naquele diretório**. Isso é trabalho de uma tarde, e move mais que um mês de
schema.

---

## Ritmo

**A cada 30 dias**, e não mais que isso. A resposta de IA varia sozinha entre uma
pergunta e outra, então medir toda semana produz serrilha que parece movimento e
não é.

⚠️ **Registrar a data e a superfície sempre.** Sem isso a comparação com a rodada
anterior não é comparação, é lembrança.

🚨 **Uma rodada isolada não conclui nada.** A primeira é linha de base e só. Falar
em "melhorou" exige pelo menos duas rodadas, e de preferência três.

---

## O que fazer com o resultado

| Achado | Próxima tarefa |
|---|---|
| a IA cita diretório, não site | entrar no diretório citado |
| o concorrente aparece sempre, com a página dele | ler a página dele e pontuar no [citability-score.md](citability-score.md) |
| ninguém aparece, resposta genérica | a pergunta ainda não tem dono. É a mais barata de ganhar |
| aparecemos, mas em último | subir o Citability Score da página que ela citou |
| a IA cita uma página nossa errada | a página certa não responde a pergunta. Reescrever a abertura dela |

> 🚨 **"Ninguém aparece" é a melhor notícia da tabela**, e passa despercebida por
> parecer fracasso. Pergunta sem dono é a única que se ganha sem tirar de alguém.
