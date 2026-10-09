# operacao.md — a ferramenta, a máquina e o baseline

Os números daqui são os de uma instalação **rodada de verdade**, não estimados.
Quando um deles não bater na sua máquina, ou a máquina é outra ou o ditto mudou,
e aí é caso de reconferir, não de assumir defeito.

## Onde a ferramenta mora

O ditto.site é open source e se
instala **uma vez, fora deste repositório**. A convenção da skill é:

```
C:\dev\ditto          (Windows)
~/dev/ditto           (macOS e Linux)
```

**Fora de pasta sincronizada por nuvem** (OneDrive, Dropbox, iCloud), de
propósito. A instalação tem ~0,3 GB e cada clone gera um projeto Next inteiro.
Dentro da nuvem isso vira sincronização de `node_modules`, e leitura lenta em
cima.

**Instalou em outra pasta (ou não está no Windows)?** Os scripts da skill leem
a variável de ambiente `DITTO`, com `C:/dev/ditto` como padrão. Aponte-a para a
sua pasta uma vez:

```bash
# Windows (vale para os terminais abertos depois)
setx DITTO "D:\ferramentas\ditto"
# macOS e Linux (no ~/.zshrc ou ~/.bashrc)
export DITTO="$HOME/dev/ditto"
```

Nos comandos desta pasta que dizem `cd C:\dev\ditto`, use a sua pasta.

O Chromium do Playwright **não** fica ali. Fica no local compartilhado do
Playwright:

```
%LOCALAPPDATA%\ms-playwright\
```

## Versões conferidas

| Item | Valor |
|---|---|
| Node | **24.19.0** (o `engines` do ditto pede `>=20`) |
| npm | **11.17.0** |
| Git | 2.55.0.windows.5 |
| ditto | `0.1.0`, commit **`3860a1a`** |
| Clone do repo | **raso** (`--depth 1`) |

⚠️ **Node 24 roda, apesar do `.nvmrc` pedir 22.** O `engines` do projeto exige
`>=20`, e o CI do upstream usa 22. A divergência é conhecida e não deu problema
em nenhum teste. Se um dia der, é o primeiro suspeito.

## Instalação

Requisitos: Node 20 ou mais novo, Git e ~0,3 GB livres. Troque `C:\dev\ditto`
pela sua pasta, se escolheu outra (e aponte o `DITTO` para ela, acima):

```bash
git clone --depth 1 https://github.com/ion-design/ditto.site.git C:\dev\ditto
cd C:\dev\ditto
npm ci                              # exit 0
npx playwright install chromium     # exit 0
cd compiler\.harness && npm install  # ver abaixo, precisa ser à mão
```

Conferir: `npm test` dentro da pasta deve fechar no baseline da seção seguinte.

## O baseline dos testes — 629 de 632

`npm test` fecha com **exit 1** no Windows, e isso é o estado normal.

| | |
|---|---|
| Testes | **632** |
| Passam | **629** |
| Falham | **2** |
| Pulados | Postgres (sem Docker) e, antes do conserto abaixo, o de validação |

### As 2 falhas são separador de caminho do Windows

Nenhuma das duas está no caminho da CLI de clone. **Falha diferente destas duas
é regressão de verdade.**

1. **`compiler/test/runsLayout.test.ts:29`** — a asserção é
   `assert.match(stable2, /example\.com\/latest\/generated\/app$/)`, com barra
   normal. No Windows o caminho vem com contrabarra
   (`...\example.com\latest\generated\app`), e o regex não casa. Defeito do
   teste, não do produto.
2. **`packages/storage/test/local.test.ts:45`** — espera a chave
   `job-1/public/assets/cloned/images/a.png`. No Windows a chave nasce com
   contrabarra. Mesma causa.

   ⚠️ Detalhe que vale guardar: isso significa que a camada de storage gera
   chave com contrabarra no Windows. Irrelevante pra CLI local; **importaria**
   se um dia isso fosse pra S3/R2, onde a chave é literal.

### O harness de validação falha no automático

A suíte imprime `harness npm install failed in C:\dev\ditto\compiler\.harness` e
**pula** o teste de verificação. Conserto, feito e funcionando:

```bash
cd C:\dev\ditto\compiler\.harness && npm install
```

É um mini-projeto Next 15.5.19 + React 19.2.7 que serve pra buildar e conferir
o clone. Sem ele, `--validate` não tem como rodar.

## npm audit: 8 vulnerabilidades, e não se conserta

```json
{"moderate": 6, "high": 2, "total": 8}
```

🚨 **Não rodar `npm audit fix --force`.** Ele só resolve com mudança que quebra,
e nada disso está no caminho que a CLI de clone executa. O número faz parte do
baseline: **8 é o normal**. Número diferente disso depois de um `git pull` é
sinal de que algo mudou, não de que algo quebrou.

## O aviso do esbuild é inofensivo

O `npm ci` imprime:

```
npm warn allow-scripts 3 packages have install scripts not yet covered by allowScripts:
npm warn allow-scripts   esbuild@0.18.20 (postinstall: node install.js)
```

É a política nova do npm 11, que não roda postinstall sem autorização. **Não é
problema aqui:** os binários do esbuild chegam por `optionalDependencies` e
estão presentes (conferido em `node_modules/@esbuild/win32-x64/esbuild.exe`).
Não autorizar scripts por causa desse aviso.

## Comandos do projeto

```
npm run clone          clonar um site (é o que a skill usa)
npm run validate-site  validar um run existente
npm run start --workspace @cloner/api   subir REST + MCP local sem hot-reload (porta 8787)
npm run dev:api        o mesmo com hot-reload: não usar, o tsx watch mata o Playwright
npm run unpack         desempacotar um resultado JSON em projeto
npm test               a suíte inteira
```

## Atualizar a ferramenta

```bash
cd C:\dev\ditto && git pull && npm ci
cd compiler\.harness && npm install
```

Depois de atualizar, **refazer o baseline** rodando `npm test` e comparar com
os números desta página. É a única forma de saber se o upstream mudou algo que
importa para a skill.

⚠️ O clone é raso (`--depth 1`). `git pull` funciona; o que não funciona é
navegar o histórico antigo.

## Sem Docker

- **A skill não precisa de Docker.** Sem ele, o modo com fila (Postgres +
  MinIO) não roda, e a suíte de ciclo de vida de job fica pulada. O modo em
  memória (`npm run start --workspace @cloner/api`) **não precisa de Docker** e
  é o que a skill usa; o `npm run dev:api` não, porque o hot-reload mata o
  Playwright.

---

## O que o clone precisa além do ditto

O ditto entrega o projeto Next; quem faz ele ficar **idêntico** é a camada de
instrumentos desta skill. Ela não instala nada: usa o Playwright que já vem no
`node_modules` do ditto, por `createRequire`.

**Dependências do lado do clone, todas nativas do navegador:**

| Recurso | Onde entra | Se não existir |
|---|---|---|
| `IntersectionObserver` | revelação ao entrar na tela | tudo aparece de uma vez, sem animar |
| `animation-timeline: scroll()` | scrub ligado ao scroll | dentro de `@supports`; o elemento fica no estado da captura |
| `next/navigation` (`useRouter`) | navegação client-side | já vem no projeto que o ditto gera |

⚠️ **Zero biblioteca de animação.** A reconstrução sai inteira em CSS,
`IntersectionObserver` e animação guiada por scroll. GSAP continua disponível
pela skill `/gsap` do workspace para o que essas três não resolvem — sequência
encadeada com passos que se sobrepõem, trajetória por caminho, transição de
layout.

---

## Arquivos que a camada escreve no clone

Saber onde ela mora é o que permite desligá-la inteira para medir a base — o
experimento que separa "defeito da captura" de "defeito da camada", e que mede
que a camada ACRESCENTA 16 dos 45 elementos fora do lugar no site-exemplo.

| Arquivo | Escopo | Quem gera |
|---|---|---|
| `src/app/<rota>/scroll.css` | por rota | `gera-scroll.mjs` |
| `src/app/<rota>/entrada.css` | por rota | `gera-entrada.mjs` |
| `src/app/<rota>/hover.css` | por rota | `gera-interacao.mjs` |
| `src/app/<rota>/geometria.css` | por rota | `corrige-geometria.mjs` |
| `src/app/acordeao.css` | rota com FAQ | `gera-acordeao.mjs` |
| `src/app/interacao.css` | global (layout) | `corrige-interacao.mjs` |
| `public/scroll.js` | global, genérico | `gera-scroll.mjs` |
| `public/acordeao.js` | global | `gera-acordeao.mjs` |
| `public/<estado>.js` | global | `captura-estado.mjs` |
| `src/app/NavegacaoClient.tsx` | global (layout) | escrito à mão, uma vez |

💡 Desligar tudo para medir a base: sobrescrever cada CSS com um comentário e
cada JS com `/* desligado */`, guardando cópia antes. **Não apagar** — o import
continua existindo, e import de arquivo ausente derruba o build.
