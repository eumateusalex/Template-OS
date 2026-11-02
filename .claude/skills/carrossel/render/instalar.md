# Instalar o render

O que este arquivo é: o passo a passo pra deixar o render funcionando na sua máquina. Leia uma vez, na instalação; depois só volte aqui se o render parar.

O render transforma cada slide do `carrossel.html` num JPEG de 2160×2700, abaixo de 3 MB, pronto pro Instagram. Ele depende de duas coisas: **Node.js** e **um Chromium** que o Playwright baixa. Sem as duas, a peça existe como HTML, mas não vira imagem.

## 1. Node.js

Precisa da versão 22.7 ou mais nova, e do `npm`, que vem junto no instalador oficial. Confira no terminal:

```
node --version
npm --version
```

Se algum dos dois não responder, baixe em <https://nodejs.org> (a versão LTS) e instale. Vale em Windows, Mac e Linux.

## 2. As dependências

Abra o terminal **na raiz do workspace** (a pasta que tem a `.claude/`). O `--prefix` roda o comando na pasta do render sem sair da raiz:

```
npm --prefix .claude/skills/carrossel/render run instalar
npm --prefix .claude/skills/carrossel/render run checar
```

`instalar` faz duas coisas: instala o Playwright na versão travada pelo `package-lock.json` (`npm ci`, que nunca troca de versão por conta própria) e baixa o Chromium que ele usa (cerca de 150 MB). `checar` abre e fecha o navegador pra provar que está tudo no lugar (sai 0 se sim, 2 se não).

**Onde o Chromium fica.** Por padrão, fora do workspace, no cache do Playwright do seu usuário: `%LOCALAPPDATA%\ms-playwright` no Windows, `~/Library/Caches/ms-playwright` no Mac e `~/.cache/ms-playwright` no Linux. É um download por máquina, compartilhado por todo projeto que use a mesma versão do Playwright. Pra deixar o Chromium dentro do próprio render (porque o cache do usuário não pode ser usado, ou pra apagar tudo junto com a pasta), defina `PLAYWRIGHT_BROWSERS_PATH=0` antes de instalar e mantenha a variável definida sempre que rodar o render. Com `0`, o Playwright guarda o navegador dentro da pasta node_modules do render, que fica fora do Git:

```
# Git Bash, Mac e Linux
export PLAYWRIGHT_BROWSERS_PATH=0
# PowerShell
$env:PLAYWRIGHT_BROWSERS_PATH = "0"
```

A variável também aceita o caminho de uma pasta fora do workspace. Sem ela na hora de rodar, o render procura no cache do usuário e diz que o Chromium não está instalado; e um `npm ci` novo apaga o node_modules junto com o navegador, por isso o `instalar` sempre roda os dois passos.

## 3. Testar

Ainda na raiz do projeto:

```
node .claude/skills/carrossel/render/render-carrossel.js .claude/skills/carrossel/kit/modelo-carrossel.html .claude/skills/carrossel/render/teste-render --demo
```

(o `--demo` renderiza nos valores de demonstração do molde; com a marca configurada pelo `/marca`, sem ele a peça sai na sua marca)

Se saírem nove JPEGs em `.claude/skills/carrossel/render/teste-render/`, está pronto (a pasta pode ser apagada depois; ela já está no `.gitignore`). Pra uma prova mais completa, `npm --prefix .claude/skills/carrossel/render run testar` roda as duas suítes: a do servidor (`teste-servidor.mjs`, sem Chromium), que pede o `scripts/.env` por todo caminho conhecido e confere que ele não sai, e a do render (`teste-render.mjs`), que renderiza o modelo, para sem marca, renderiza com a marca de outra raiz, uma peça com imagem faltando, uma com fonte errada, uma com imagem fora da pasta dela e uma com a capa abaixo do mínimo, e confere a escuta só no 127.0.0.1, a peça fora de projeto e a porta ocupada. Abra um deles: o título tem que ter as letras encostadas, com espaçamento apertado. Se as letras estiverem soltas e parecerem Arial, a fonte não carregou (e o render teria avisado).

## Quando dá errado

**"a marca não está configurada: rode /marca"**: falta o `identidade/marca.tokens.json`, ou ele ainda é o molde, ou o esquema está quebrado (o parêntese diz qual). Rode o `/marca`. Para só provar o kit, `--demo` renderiza nos valores de demonstração.

**"Playwright não encontrado"**: o `npm ci` não rodou dentro de `render/`. Volte ao passo 2.

**"Executable doesn't exist" ou "browser not found"**: o Chromium não foi baixado, ou foi baixado com o `PLAYWRIGHT_BROWSERS_PATH` e a variável não está definida agora (ou o contrário). Defina a variável como na instalação, ou rode `npm --prefix .claude/skills/carrossel/render run instalar` de novo.

**Rede corporativa ou proxy bloqueando o download do Chromium**: o Playwright respeita as variáveis `HTTPS_PROXY` e `HTTP_PROXY`. Se ainda assim não baixar, dá pra apontar a variável `PLAYWRIGHT_BROWSERS_PATH` (passo 2) pra uma pasta onde o Chromium dessa versão do Playwright já foi baixado noutra máquina. A documentação está em <https://playwright.dev/docs/browsers>.

**"a peça renderizaria na fonte de sistema"**: a fonte do Google não carregou. Ou a máquina está sem internet, ou a URL da fonte na marca (`fonte.*` com `marca.url` no `identidade/marca.tokens.json`) está errada. O render se recusa a gravar nesse estado de propósito: a peça sairia com outra letra e ninguém perceberia.

**"imagem(ns) da peça não vieram"**: o `style="--img:url(...)"` do slide ou o `<img src="...">` aponta pra um arquivo que não está lá, ou que o render não serve (o parêntese ao lado do caminho diz o motivo). O caminho é sempre absoluto a partir da raiz do projeto, no formato `/carrosseis/<peça>/capa.jpg`. Os JPEGs foram gravados mesmo assim, sem a imagem, pra você ver onde falta.

**"AVISO: ... está sem foto"**: a capa (`.cover`) ou a imagem cheia (`.full`) saiu sem a foto, só com o slot. Os JPEGs foram gravados e a saída é 0, porque o rascunho sem foto se aprova assim; antes de publicar, ponha a foto no `--img` do slide e tire o `.slot.fundo`.

**"AVISO: ... abaixo do mínimo"**: a foto tem menos pixels que o mínimo da skill pra aquele lugar (a tabela "Resolução" de `referencias/composicao.md`: capa e imagem cheia 1080×1350, card ilustrado 900×1000, janela 1600×800; figura recortada, o dobro da altura que ocupa; o resto, o tamanho que ocupa no slide). O JPEG sai, mas borrado. Peça a foto maior; esticar a pequena não resolve.

**"JPEG acima de 3 MB"**: a foto de fundo é pesada demais. Reduza a imagem de origem (2160×2700 já é o máximo que faz diferença) e renderize de novo.

**Como saber se o problema é o ambiente ou a peça**: se a mensagem fala em Chromium ou Playwright, é o ambiente; rode `npm run checar` dentro de `render/`. Se fala em fonte, imagem, peso ou proporção, é a peça, e a própria mensagem diz o conserto. (Pra quem lê código de saída: 2 é ambiente, 1 é peça, e o AVISO de foto não muda a saída.)

**"fora das pastas que o render serve"**: o servidor do render (`servidor.js`) serve só a pasta do HTML (com as subpastas dela) e o kit desta skill, e nunca a raiz inteira, onde mora o `scripts/.env`. Imagem noutra pasta entra com `--servir <pasta>`. "Trecho recusado", "o caminho real..." e "extensão que o render não serve" são de propósito: o trecho que começa com ponto, o `..`, a junção ou o link que leva para fora, e o que não é página, estilo, script, imagem, fonte ou vídeo não saem.

**"nenhuma pasta de projeto (com .claude/) acima do HTML"**: o render acha a raiz do projeto subindo a partir do HTML até encontrar a pasta `.claude/`, e para na sua pasta de usuário, que não conta (o Claude Code guarda nela o `.claude/` dele). Se a peça está fora do projeto, passe a raiz na mão: `--raiz <pasta do projeto>`.

**"a porta ... está ocupada"**: outro programa já usa a porta do `--porta`. Rode sem ele (o render pega uma livre) ou com outra. É problema de ambiente: sai 2.

## Os comandos e o que cada um aceita

| Comando | O que faz |
|---|---|
| `node .claude/skills/carrossel/render/render-carrossel.js <html> [pasta de saída]` | um JPEG por slide, em `instagram/` ao lado do HTML por padrão |
| `... render-carrossel.js <html> --demo` | renderiza nos valores de demonstração do molde, sem marca configurada (prova do kit, nunca peça para publicar) |
| `MARCA_RAIZ=<pasta> ... render-carrossel.js <html>` | lê a marca de outra raiz (a de um cliente, com o `identidade/` dele) |
| `... render-carrossel.js --checar` | só confere se o Playwright e o Chromium estão no lugar (sai 0 ou 2) |
| `npm run instalar` · `npm run checar` · `npm run testar` (dentro de `render/`) | instala, confere o ambiente, testa o render |
| `... render-carrossel.js <html> --raiz <pasta>` | diz onde é a raiz do projeto, quando o render não acha a `.claude/` sozinho |
| `... render-carrossel.js --catalogo` | só serve o catálogo e mostra a URL, sem tirar JPEG |
| `... render-carrossel.js <html> --porta 8899` | porta fixa do servidor (por padrão, a primeira livre) |
| `... render-carrossel.js <html> --servir <pasta>` | mais uma pasta da raiz que a peça pode pedir, além da pasta do HTML e do kit (repetível). Pasta com trecho que começa com ponto não entra |
| `node .claude/skills/carrossel/render/linha-do-tempo.mjs <html>` | reescreve a linha do tempo de todo slide |
| `... linha-do-tempo.mjs <html> --conferir` | só diz se a linha está certa (sai 1 se não) |
| `node .claude/skills/carrossel/scripts/confere.mjs [--raiz <pasta>]` | o verificador da skill; aqui o `--raiz` é a pasta da skill (outra cópia dela), não a raiz do projeto como no render |
| `node .claude/skills/carrossel/scripts/teste-confere.mjs` | a prova do verificador: quebra uma coisa por vez e confere que ele reprova |

## Não existe render sem Chromium

Não há plano B de gerar o JPEG sem o navegador. Se o Chromium não puder ser instalado nessa máquina, a saída é rodar o render em outra: a pasta da peça é autocontida e pode ser copiada.
