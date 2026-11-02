# Modo Publicar — o portão antes de usuário real

> Carregado quando o pedido é "vou subir pra produção", "antes de lançar",
> "revisão antes do deploy", "pode publicar?".
>
> **É uma pausa, não uma auditoria.** Trinta minutos a duas horas, não dias. O
> objetivo é não descobrir depois, da pior forma, algo que estava visível antes.

---

## A diferença entre este modo e auditar

| | **Publicar** | **Auditar** |
|---|---|---|
| Quando | Antes de abrir para usuário real, e a cada mudança relevante depois | Sistema que já roda, com dado real |
| Profundidade | O que quebra o lançamento | Tudo que se aplica |
| Duração | Minutos a poucas horas | Horas a dias |
| Saída | **Libera ou segura**, com lista curta | Diagnóstico completo por severidade |

Se o sistema nunca passou por auditoria e vai receber dado de terceiro pela
primeira vez, **rodar auditar antes**. Este modo pressupõe que os controles
existem e verifica se continuam de pé.

---

## O procedimento

### 1 · Gerar o checklist do projeto

```bash
node ../scripts/perfil.js <projeto> --json > perfil.json
node ../scripts/requisitos.js --checklist --perfil perfil.json
```

O checklist sai **gerado do catálogo**, filtrado pelo que se aplica. Cada item
traz o teste. Não é lista escrita à mão que envelhece.

### 2 · Rodar as verificações de custo zero

Nível A e B, sem autorização especial, e é onde mora a maior parte do valor:

```bash
# Segredo no histórico do repositório, não só nos arquivos atuais.
# Busca por formato, não por nome. Tabela completa de prefixos por provedor em
# `stacks.md`, seção "Segredo: os prefixos que valem a busca".
git log -p --all | grep -nE '(sk_live_|rk_live_|whsec_|AKIA[A-Z0-9]{16}|gh[pousr]_[A-Za-z0-9]{36}|AIza[A-Za-z0-9_-]{35}|xox[baprs]-|BEGIN [A-Z ]*PRIVATE KEY)' | head

# O arquivo de ambiente está mesmo ignorado?
git check-ignore -v .env

# Variáveis públicas declaradas, só nomes (escopo em .env*, não na raiz)
grep -rhoE '^\s*(NEXT_PUBLIC_|VITE_|PUBLIC_|REACT_APP_)[A-Z0-9_]+' .env* 2>/dev/null | sort -u

# Segredo no pacote publicado
grep -rEl '(sk_live|service_role|BEGIN [A-Z ]*PRIVATE KEY)' dist/ build/ .next/ 2>/dev/null

# Dependências com falha conhecida
npm audit --omit=dev 2>/dev/null | tail -20

# Cabeçalhos em produção, inclusive numa resposta de erro
curl -sI https://<dominio> | grep -Ei 'strict-transport|content-security|x-frame|x-content-type|referrer|permissions'
curl -sI https://<dominio>/pagina-que-nao-existe | grep -Ei 'strict-transport|x-frame'

# Modo de depuração e rotas de diagnóstico
curl -s https://<dominio>/.env -o /dev/null -w '%{http_code}\n'

# Pasta pública devolvendo a relação de arquivos
curl -s https://<dominio>/uploads/ | head -5

# Redirecionamento aceitando destino externo
curl -sI 'https://<dominio>/login?next=https://destino-externo.invalid/' | grep -i '^location'
```

### 3 · O teste das duas contas

**É o que separa este modo de uma leitura de configuração**, e o que quase
ninguém faz. Vinte minutos, e é o teste que mais acha coisa.

1. Criar duas contas, A e B. Se houver organizações, criar duas.
2. Gerar dado real de uso em cada uma: registro, arquivo, o que o sistema faz.
3. Autenticado como A, para **cada tipo de recurso**:
   - trocar o identificador na URL pelo recurso de B
   - trocar o identificador na chamada direta, sem passar pela tela
   - tentar baixar o arquivo de B
   - tentar exportar ou gerar relatório que inclua dado de B
4. Chamar cada rota administrativa como A, que é usuário comum.
5. Chamar as rotas protegidas **sem sessão nenhuma**, numa janela anônima.
6. Enviar, numa atualização de perfil, um campo que confere privilégio.

**Qualquer resposta que não seja recusa é bloqueio de lançamento.**

### 4 · A pergunta final

Depois do checklist, uma pergunta resolve o que a lista não pega:

> **Eu colocaria hoje, aqui dentro, o dado real de um cliente meu?**

Se a resposta hesita, o motivo da hesitação é o item que falta na lista.

### 5 · Decidir com o critério, não com o prazo

O critério de `SDL-02`, acordado antes da pressa:

| Achado | Decisão |
|---|---|
| **Crítico** em aberto | **Bloqueia.** Sem negociação |
| **Alto** em aberto | Libera só com aceitação formal de risco, registrada com prazo |
| **Médio e baixo** | Libera, com os itens no plano e prazo definido |
| **Verificação obrigatória não executada** | **Bloqueia**, como se fosse crítico |

**Este critério só funciona se a severidade for confiável.** Achado inflado
bloqueia lançamento à toa e ensina todo mundo a contornar o portão; achado
descartado cedo demais deixa passar o que importa. Antes de atribuir severidade
a qualquer item desta tabela, passar pela régua de `achados.md` — principalmente
o corte de confiança, que decide o que é achado e o que é **não verificado**.
Aqui a diferença entre os dois é decisiva: não verificado **também bloqueia**.

---

## O checklist mínimo, por bloco

Gerado pelo script, mas vale conhecer a espinha:

**Segredos e exposição**
- [ ] `SEC-01` `SEC-02` `SEC-03` — nada de credencial no código nem no histórico
- [ ] `SEC-04` — toda variável pública é pública de propósito
- [ ] `SEC-05` — pacote publicado varrido
- [ ] `SEC-11` — nenhum segredo com valor alternativo embutido, e a aplicação recusa subir com ele
- [ ] `OUT-03` — modo de depuração desligado

**Acesso**
- [ ] `ARQ-03` — o controle que não consegue decidir nega, e não libera
- [ ] `ACC-01` `ACC-03` — o teste das duas contas passou em todo tipo de recurso
- [ ] `ACC-08` — rota administrativa recusa usuário comum, inclusive na chamada direta
- [ ] `ACC-09` — isolamento entre organizações vale também para arquivo e exportação
- [ ] `ACC-05` — campo de privilégio não entra por rota de perfil

**Dado**
- [ ] `DAT-01` `DAT-12` — nenhuma tabela sensível responde sem sessão
- [ ] `DAT-05` — a credencial que ignora política não está no cliente
- [ ] `FIL-03` — arquivo privado exige permissão

**Borda**
- [ ] `NET-01` `NET-02` — canal cifrado e obrigatório
- [ ] `NET-03` — origens autorizadas revisadas, sem localhost em produção
- [ ] `NET-05` — cabeçalhos presentes, inclusive na resposta de erro
- [ ] `NET-06` — limite de requisição ativo
- [ ] `NET-10` — banco e serviços internos não respondem pela rede pública
- [ ] `NET-12` — nenhuma pasta pública devolve relação de arquivos
- [ ] `ARQ-04` — nenhuma versão anterior de interface continua respondendo

**Identidade**
- [ ] `IDN-03` — limite de tentativa em autenticação, recuperação **e** segundo fator
- [ ] `IDN-07` — mensagem genérica nas três telas
- [ ] `SES-01` `SES-03` — sessão em cookie protegido, e sair invalida no servidor
- [ ] `SES-08` — nenhuma credencial viaja em parâmetro de endereço
- [ ] `VAL-08` — o parâmetro de retorno da entrada não leva para fora do sistema

**Depois do lançamento**
- [ ] `BCP-01` `BCP-02` — cópia funcionando **e** restauração já exercitada
- [ ] `MON-01` `MON-02` — alertas configurados, com destino que alguém acompanha
- [ ] `LOG-01` — trilha registrando desde o primeiro dia

---

## Armadilhas deste modo

**Cópia de segurança antes do primeiro dado real.** Dado de cliente entrando num
sistema sem cópia testada é a perda esperando acontecer, e quando acontece é
dado de terceiro. `BCP-02` antes do lançamento, não depois.

**Controle que mora fora do repositório.** Cabeçalhos no servidor web, política
no painel do provedor, limite na borda: nada disso aparece no código. Antes de
reportar ausência, perguntar onde aquela camada é configurada.

**Ausência de saída não é conformidade.** Se `dist/` não existe porque ninguém
compilou, o requisito fica não verificado.

**Publicar não é evento único.** Toda mudança relevante volta por aqui, e é por
isso que `VER-02` existe: o que roda sozinho na esteira continua rodando; o que
depende de alguém lembrar acontece uma vez.
