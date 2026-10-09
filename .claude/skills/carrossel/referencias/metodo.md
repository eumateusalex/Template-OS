# Método editorial

O que este arquivo é: como se planeja e se escreve um carrossel, do tema até o roteiro. Ler no passo de planejar do modo montar. O desenho não mora aqui: mora em [composicao.md](composicao.md) e no kit.

Quem é a marca, o público e o que ela vende vêm de `_memoria/empresa.md`. A voz, a linguagem de balcão, a clareza e a forma do CTA vêm de `_memoria/escrita-publica.md`; a função de cada peça e o CTA que ela aceita, de `_memoria/marketing.md`. O visual vem de `marca/tokens.css` e `marca/marca.md`. Este arquivo descreve o método, não a marca.

---

## 1. O que toda peça faz

Um carrossel não é resumo: é a **leitura da marca** sobre o assunto. Cada peça:

1. captura atenção sem sensacionalismo;
2. traduz assunto técnico pra linguagem de quem decide;
3. gera valor pro público descrito em `_memoria/empresa.md`;
4. reforça a identidade visual da marca;
5. pede uma ação clara no último slide;
6. separa fatos, interpretações e hipóteses.

**Regra editorial:** todo conteúdo aproxima o tema de um resultado compreensível pra quem decide (custo, receita, produtividade, tempo, controle, risco), na linguagem do público real. Nunca como fornecedor genérico vendendo serviço isolado.

## 2. Tom próprio do formato

A voz da marca está em `_memoria/escrita-publica.md`. O que é próprio de carrossel, em qualquer marca:

- frases curtas e diretas na arte;
- o aprofundamento fica na legenda, não na arte;
- uma ideia forte por slide;
- exemplos e implicações práticas em vez de adjetivos;
- sem emoji na arte (na legenda, o que a régua de `scripts/lib/legenda.js` permitir);
- sem reprodução extensa de conteúdo de terceiros.

Um teste que funciona: se a frase soaria estranha dita em voz alta pela pessoa da marca, está errada.

---

## 3. Fluxo pra fonte externa

Quando a peça nasce de notícia, artigo, vídeo, relatório ou página:

1. **Ler a fonte inteira.** Identificar tese, fatos, números, opiniões, rumores, implicações e data.
2. **Verificar o que é recente.** Preço, lançamento, disponibilidade, benchmark, funcionalidade: procurar fonte primária ou oficial, complementar com fonte independente reconhecida, registrar a data. Não transformar interpretação em fato. Rumor não confirmado que não seja essencial sai.
3. **Definir a leitura da marca.** Responder: por que isso importa pra quem decide? Qual decisão prática cabe aqui? Como afeta custo, receita, produtividade ou risco? Qual erro comum pode ser evitado?
4. **Criar a tese.** Precisa caber em uma frase. Exemplo: "A competição entre modelos beneficia empresas que testam continuamente, não as que escolhem por torcida."
5. **Criar a sequência.** Cada slide cumpre uma função principal.
6. **Propor o CTA.** O tipo sai da função da peça (`_memoria/marketing.md`, "Função do conteúdo"); a forma, da régua de `_memoria/escrita-publica.md` ("O CTA"). Se a pessoa já disse o CTA no pedido, vale o dela.

Quando o material de partida veio da pessoa (um post dela, um print, um exemplo), a informação que está lá entra na peça como está. Não é pra validar, nem corrigir número, nem cortar afirmação por falta de fonte externa. Se algo parecer errado, entrega como está e comenta depois.

---

## 4. Modelos de sequência

Referência, não molde obrigatório. A quantidade de slides sai do conteúdo: **9 é o padrão** de um tema de profundidade média; lista grande ("10 coisas") pede 11 ou 12, um item por slide; peça enxuta desce até 6. Fora dessa faixa, o problema é o recorte do tema, não a contagem.

### O que segura a leitura, em qualquer modelo

- **A capa sai de várias versões.** Escrever um título por objetivo (atenção, curiosidade, identificação, desejo, salvamento, compartilhamento) antes de escolher: a melhor capa raramente é a primeira que veio.
- **O slide 2 é a segunda capa.** O Instagram mostra o post de novo a quem viu a capa e não arrastou, e mostra a partir do slide 2. O título dele prende sozinho, sem abrir com "mas", "por isso", "isso" ou "ele".
- **Notícia vira lição.** O fato, o detalhe humano, o dado e a virada para quem lê ("e é aqui que isso chega no seu negócio").
- **História vive do específico.** O detalhe concreto que ninguém inventaria (a hora, o valor, a frase que alguém disse) é o que faz soar verdade. A história de um erro cabe em três tempos: o que se fez, o que devia acontecer, o que aconteceu.
- **Pedir para seguir leva o motivo.** O que a pessoa ganha seguindo, nunca o "me siga" seco.

### Educativo baseado em fonte: 9 slides

| Slide | Função | Componente sugerido |
|---|---|---|
| 1 | Capa e tensão | Foto sangrando, headline |
| 2 | Contexto do movimento | Lead, card tracejado |
| 3 | Dado principal | Número protagonista ou cards ilustrados |
| 4 | Comparação | Cards, um em foco |
| 5 | Implicação operacional | Imagem cheia ou fluxo horizontal |
| 6 | Erro ou mudança de mentalidade | Palavra grande |
| 7 | Método de decisão | Etapas numeradas ou janela do Mac |
| 8 | Síntese prática | Nota lateral, card tracejado |
| 9 | Fecho | Palavra-gatilho ou as quatro ações |

### Educativo direto: 6 ou 7 slides

Capa, problema, causa, solução ou método, exemplo prático, síntese, fecho.

### Institucional: 7 slides

Gancho, o que a marca acredita, problema do mercado, como a marca trabalha, benefícios, diferencial, fecho.

### Dor e solução: 8 slides

Dor principal, sintoma visível, custo escondido, causa estrutural, nova abordagem, funcionamento, resultado esperado sem promessa exagerada, fecho.

---

## 5. Os três tipos de CTA

Um CTA por peça. CTAs concorrentes se anulam. Qual tipo cabe sai da função da peça (`_memoria/marketing.md`): peça de atenção pode não ter CTA nenhum. Em qualquer tipo vale a régua de `_memoria/escrita-publica.md` ("O CTA"): o motivo na mesma frase, e promessa por mensagem só com quem atenda do outro lado.

**A · Palavra-chave.** "Comenta MODELOS que eu te mando o checklist." Só quando existe material real pra entregar. Se o material não existe, ele precisa ser criado antes de publicar. No kit é o fecho `.word`.

**B · Engajamento.** Salvar, compartilhar, comentar, seguir, sempre com o motivo na mesma frase ("salva pra conferir antes de assinar o próximo contrato"): sozinhos, eles não são CTA. Pra alcance, autoridade e conversa. No kit é o fecho `.acts`.

**C · Conversão direta.** Quando a peça liga direto no que a marca vende: convidar pra chamar no direct, pedir orçamento, agendar, clicar no link da bio. O texto do convite vem das "Ofertas" de `_memoria/empresa.md`.

**O CTA se propõe, não se pergunta.** Chegar com o CTA já escolhido e com o motivo. A pessoa aprova, troca ou corta. Se a mesma frase servir em outro post, ela está genérica.

---

## 6. Política de evidências

**Sempre:**

- indicar a fonte de número e benchmark;
- registrar a data quando o dado puder mudar;
- dizer "no benchmark analisado" quando for o caso;
- avisar que custo varia por tarefa e configuração;
- diferenciar laboratório de operação real;
- manter os links completos na `legenda.txt`.

**Nunca:**

- tratar rumor como lançamento;
- dizer "é o melhor" sem critério;
- apresentar estimativa como economia garantida;
- copiar parágrafo extenso de terceiro;
- inventar pesquisa, cliente ou resultado;
- esconder limitação relevante.

**Hierarquia das fontes:** 1. documentação ou comunicado oficial · 2. pesquisa ou benchmark com metodologia · 3. veículo ou especialista reconhecido · 4. artigo de opinião · 5. comunidade e rumor, só como contexto identificado.

**Número em conteúdo:** pode, conforme o contexto. O que não pode é inventar. Dado de mercado entra com fonte; contagem concreta ou fato da própria marca entra direto; número que veio no material da pessoa é dado de entrada e se copia.

---

## 7. Checklist de qualidade

### Conteúdo

- [ ] A capa comunica uma ideia central?
- [ ] Cada slide tem uma única função principal?
- [ ] A leitura da marca está clara?
- [ ] Fatos e opiniões estão separados?
- [ ] Todo número tem fonte?
- [ ] O CTA foi proposto e aprovado?
- [ ] A legenda complementa o carrossel em vez de repeti-lo?

### Visual

- [ ] Todos os JPEGs na proporção 4:5?
- [ ] Margens iguais entre slides?
- [ ] O @ no topo de todos os slides?
- [ ] Linha do tempo certa em todo slide, gerada pelo script?
- [ ] Último slide sem seta?
- [ ] Cores só do `tokens.css`?
- [ ] Nenhuma sequência de três slides de texto?
- [ ] Imagens pedidas no `IMAGENS.md`, não buscadas?
- [ ] Fecho em cor cheia, uma só?
- [ ] Nenhum fundo dominado pela cor de acento?
- [ ] Fonte da marca carregada (o render confere)?
- [ ] Nenhum texto cortado?
- [ ] No máximo um terminal, uma janela, uma decoração?

### Publicação

- [ ] `legenda.txt` pronta pra colar (sem markdown, parágrafo em uma linha) e aprovada pela régua de `scripts/lib/legenda.js`?
- [ ] `legenda.md` guarda decisão, e não uma segunda cópia do texto?
- [ ] Nomes, datas e preços atuais?

---

## 8. Lições que valem em qualquer marca

1. Capa enxuta gera mais impacto que lista de tópicos.
2. Número grande exige contexto, fonte e limitação.
3. Comparação mostra critério, não torcida.
4. O terminal transforma método em elemento visual.
5. Alternância claro/escuro cria ritmo, mas não pode ser mecânica.
6. O @ fica no topo pra não competir com a linha do tempo.
7. As dimensões se conferem no JPEG final, não se presumem.
8. Artigo externo pode exigir confirmação independente.
9. Rumor sai quando não for essencial.
10. HTML, roteiro e legenda fazem parte da entrega, não só os JPEGs.

---

## Regra final

Consistência de marca não é repetição de layout. Todas as peças devem parecer feitas pela mesma marca, nunca pelo mesmo molde. A identidade permanece; a composição muda com o tema.

**Estilo aprovado é linguagem, não sequência.** Quando a pessoa aprova o estilo de uma peça, o que fica é a linguagem; a próxima da mesma família muda o roteiro e a dor. Antes de fazer "igual à anterior", perguntar se é o estilo ou o esqueleto que ela quer repetir.
