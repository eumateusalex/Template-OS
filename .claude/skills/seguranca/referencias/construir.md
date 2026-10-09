# Modo Construir — antes da primeira linha

> Carregado quando o pedido é "projeto novo", "vou começar um sistema", "que
> regras de segurança colocar", "spec de segurança", "como estruturar isso".
>
> **Entrega dois artefatos:** a especificação de segurança do projeto, e o
> arquivo de regras que a ferramenta de código vai consultar sozinha.

---

## Por que este modo existe

Ferramenta geradora de código otimiza para **fazer funcionar**. Sem requisito
explícito, ela entrega operações completas, telas bonitas e verificação de
permissão nenhuma. E a falha não aparece em teste manual: o sistema funciona
perfeitamente para o usuário honesto.

Corrigir arquitetura depois de trinta telas prontas custa muito mais que decidir
certo no começo. Este modo é o de melhor retorno de todos, e o menos usado.

---

## O procedimento, em 5 passos

### 1 · Classificar o projeto antes de qualquer decisão

Duas perguntas resolvem:

| Pergunta | Consequência |
|---|---|
| **Vai existir dado de terceiro?** Cliente, lead, cadastro, documento | Se sim, o piso é N2. Não há projeto "simples" com dado de outra pessoa |
| **O dado é sensível, financeiro, de saúde? Alguém depende disso para operar?** | Se sim, é N3 |

Sem nenhum dos dois, é N1. A tabela completa está em `fundacao.md`, seção 4.

**Este é o momento de alinhar expectativa**, se houver cliente envolvido. O nível
define esforço, e portanto prazo e preço. Descobrir na entrega que era N3 é
descobrir tarde.

### 2 · Levantar as superfícies previstas

O projeto ainda não existe, então `perfil.js` não tem o que ler. Perguntar:

- Vai ter autenticação? De que tipo?
- Vai ter banco? O cliente alcança o banco diretamente?
- Mais de uma organização na mesma base?
- Área administrativa?
- Envio de arquivo?
- Pagamento, cobrança, notificação de sistema externo?
- Chamada a modelo de linguagem, ou agente autônomo?
- Cliente que não é navegador?

Cada resposta positiva ativa famílias. Consultar o conjunto correspondente:

```bash
node ../scripts/requisitos.js --detector auth,banco,multitenant --nivel N2
```

### 3 · Escrever a especificação de segurança

Os itens abaixo, antes do código. É o que `SDL-01` exige, e é curto de propósito:

| # | Item | O que precisa estar escrito |
|---|---|---|
| **1** | **Papéis** | Quem existe no sistema. Ex.: dono da conta, membro, somente leitura, administrador da plataforma |
| **2** | **Matriz de permissão** | Para cada papel, o que pode ler, criar, editar e excluir, e sob qual condição |
| **3** | **Invariantes** | O que nunca pode acontecer, independentemente de quem pediu. É a base de `BIZ-12` |
| **4** | **Fluxos críticos** | Onde a falha causa dano real: autenticação, recuperação de senha, convite, mudança de permissão, exclusão, cobrança |
| **5** | **Modelo de dados** | Entidades, e **a chave de separação entre organizações em toda tabela que precise dela**. Adicionar depois é migração dolorosa |
| **6** | **Modelo de ameaça** | O exercício de `THR-01`, para os fluxos críticos |
| **7** | **Fronteiras de confiança** | Onde o dado cruza de um domínio para outro, e o que valida cada passagem |

> **O item 5 é o que mais dói se ficar para depois.** Introduzir separação por
> organização num sistema que já tem dado exige migração, revisão de toda consulta
> e janela de indisponibilidade. Decidir no começo custa uma coluna.

### 4 · Gerar o arquivo de regras do projeto

É o requisito `SDL-03`, e é o que faz a segurança entrar em todo pedido sem
alguém precisar lembrar. Vai na raiz do projeto, no arquivo que a ferramenta de
código lê automaticamente.

**Modelo, a ajustar pelo nível e pelas superfícies:**

```markdown
## Regras de segurança deste projeto

Nível de rigor: N2 · superfícies: autenticação, banco, multi-organização

1. Validação acontece no servidor. Validação no cliente é só experiência de uso,
   e toda regra do cliente tem uma gêmea no servidor.
2. Rota nova nasce protegida. Público é exceção declarada, não padrão.
3. Toda busca por registro carrega o dono na consulta, nunca numa condicional
   depois. Recurso de outro responde como inexistente.
4. A identidade vem sempre da sessão do servidor. Nunca de parâmetro, corpo ou
   cabeçalho enviado pelo cliente.
5. Toda consulta filtra pela organização, e o identificador dela vem do token.
6. Escrita valida contra esquema em modo estrito. Campo desconhecido derruba a
   requisição. Papel, plano, saldo e situação não são campos de perfil.
7. Resposta declara os campos que entrega. Nunca serializar o registro do banco
   diretamente.
8. Segredo só em variável de ambiente de servidor. Se a compilação reclamar que
   falta no cliente, mover a chamada para o servidor, não adicionar prefixo público.
9. Consulta ao banco sempre parametrizada.
10. Ação sensível gera registro de auditoria: autenticação, mudança de permissão,
    exclusão, exportação, acesso a dado de outro titular.
11. Nunca desativar um controle de segurança para resolver um erro. Se um controle
    está atrapalhando, é caso de conversar, não de desligar.
12. Erro em produção não mostra estrutura interna. Detalhe vai para o registro,
    com identificador de correlação.
13. Credencial nunca viaja no endereço da requisição, e destino de
    redirecionamento vem de lista do servidor, nunca do que o cliente mandou.
14. Quando uma verificação de segurança não consegue concluir, o sistema NEGA.
    Bloco que trata erro em autorização, assinatura, limite ou sessão termina em
    recusa explícita, nunca num valor neutro que acaba liberando.
15. Segredo não tem valor alternativo embutido. A aplicação confere na partida
    que cada um foi definido de fora, e se recusa a subir quando falta.
```

**Ajustes por superfície:**

| Se tem | Acrescentar |
|---|---|
| Banco alcançável pelo cliente | Toda tabela nasce com política ativa. Tabela criada por migração não vem com ela: ligar é passo do mesmo commit |
| Pagamento | Preço vem do servidor. Notificação externa tem assinatura verificada e é idempotente |
| Envio de arquivo | Tipo verificado pelo conteúdo, armazenamento privado, download com verificação de permissão |
| Modelo de linguagem | Conteúdo lido é dado, nunca instrução. Saída do modelo não é executada nem renderizada sem tratamento. Agente tem escopo próprio e cota. A instrução do sistema não guarda segredo, porque vaza |
| Busca em base de conhecimento | A chave do titular entra na consulta ao índice, não numa conferência depois. Apagar o documento precisa apagar o vetor. Trecho recuperado é entrada de terceiro |
| Interface de programação publicada | Toda versão tem data de desligamento no dia em que a seguinte entra. Ambiente que não é produção não responde pela rede pública |

### 5 · Definir o critério que bloqueia a publicação

Antes de existir pressa, porque depois já é tarde. É `SDL-02`:

- Achado **crítico** bloqueia a publicação.
- Achado **alto** exige aceitação formal de risco, registrada.
- **Médio e baixo** entram no plano com prazo.
- Verificação obrigatória não executada bloqueia como se fosse achado crítico.

---

## O que entregar ao fim

1. **A especificação** com os 7 itens do passo 3
2. **O arquivo de regras** do passo 4, já na raiz do projeto
3. **A lista de requisitos aplicáveis**, gerada pelo perfil previsto
4. **O critério de bloqueio** acordado
5. **O que ficou como exceção desde o início**, se algum controle foi
   conscientemente adiado, registrado em `.seguranca-excecoes.json` com prazo

---

## Armadilhas deste modo

**Especificar demais trava o começo.** O objetivo não é documentar o sistema
inteiro: é escrever o que é sensível e construir o resto normalmente. Se a
especificação está demorando mais que um dia num projeto pequeno, ela está
grande demais.

**Regra genérica não muda o resultado.** "Seguir boas práticas de segurança" não
produz código diferente. "Toda busca por registro carrega o dono na consulta"
produz.

**O nível não é palpite.** Se tem dado de terceiro, é N2 no mínimo, mesmo que o
projeto pareça pequeno e o prazo seja curto. Tratar N2 como N1 é a decisão que
gera os incidentes que viram notícia.

**Ferramenta de código não substitui a decisão.** Ela implementa bem a partir de
requisito claro, e inventa mal a partir de requisito ausente. O modelo de
permissão, as invariantes e o modelo de ameaça continuam sendo trabalho humano.
