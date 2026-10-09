# .claude/video/ · o estúdio de vídeo

Dois motores, uma porta: todo vídeo feito em código entra pela skill `/video`,
que escolhe o motor na entrevista. O trabalho de vídeo da `/video` mora aqui; o
Reel do `/cortes` (modo gravação) monta em `rascunho/`. Fora disso, o único
arquivo de vídeo é **o final, em `saidas/`**. Peça de projeto ou de cliente mora
na pasta do dono e usa o mesmo motor.

| Motor | Onde | Quando |
|---|---|---|
| **HyperFrames** (HTML + GSAP), o principal | `html/<peça>/` | motion design, Reel animado, vinheta, lançamento |
| **Remotion** (React) | `src/<peça>/`, registrada no `src/Root.tsx` | peça que já existe nele, legenda palavra a palavra |

O estúdio vem vazio de propósito: nenhuma peça de exemplo, só o esqueleto e o
molde. 🚨 **Antes da primeira peça, a marca precisa estar fechada**
(`/carrossel configurar`); sem ela, os dois motores recusam.

## HyperFrames

Peça nova: `node .claude/skills/video/ferramentas/nova-peca.mjs <nome>`. Ela
nasce com as junções `_vendor` (o GSAP local, em `html/_vendor/`) e `_marca` (a
marca do workspace, em `.claude/skills/carrossel/marca/`), sem cópia e fora do
git, o esqueleto com as regras de render e o `roteiro.md`. Os comandos rodam
dentro da pasta da peça, com o CLI fixo:

```bash
npx --yes hyperframes@0.8.96 check
npx --yes hyperframes@0.8.96 snapshot --at 0,3.5,8 --no-end -o ../../previa/<peca>-quadros
npx --yes hyperframes@0.8.96 render -o ../../previa/<peca>.mp4 --quality delivery
```

O que o render quadro a quadro cobra, as armadilhas medidas e o conserto do
navegador do render estão em `.claude/skills/video/hyperframes.md`. O áudio de
cada peça fica em `ativos/`, fora do git, e o `ativos.sh` dela o refaz.

🚨 **Peça se apaga só pelo `apagar-peca.mjs`**: `rm -rf` atravessa a junção e
apaga a marca.

## Remotion

Uma vez por máquina: `npm --prefix .claude/video install`. Depois:

```bash
node .claude/skills/video/ferramentas/marca-remotion.mjs     # a marca em src/marca.ts (de novo a cada troca de marca)
npm --prefix .claude/video run studio
npm --prefix .claude/video run still -- Molde previa/molde.png --frame=30
npm --prefix .claude/video run render -- <Composicao> previa/<peca>.mp4
npm --prefix .claude/video run lint
```

Sempre pelo `npm run`, que roda dentro de `.claude/video/`. Chamado da raiz
(`npx --prefix`), o Remotion não acha `package.json` e cria `.remotion/` (um
segundo Chrome) e `.cache/` na raiz do workspace, centenas de megas.

A peça nova começa copiando `src/molde/` para `src/<peca>/` e registrando a
composição no `src/Root.tsx`. Toda composição chama `exigeMarca()` primeiro.
Antes de construir, abrir o `.claude/skills/remotion/CATALOGO.md` e escolher a
técnica de propósito.

Render de conferência vai para `previa/` <!-- caminho futuro: nasce no primeiro render --> (fora do git: se refaz com um comando e
pesa megas); o final vai para `saidas/`. **A `previa/` guarda só a peça em
obra:** quando o final chega a `saidas/`, a prévia dela se apaga.

## Regras que valem aqui

- **Cor e fonte saem da marca**, nunca inventadas. No HyperFrames, o
  `tokens.css` entra pela junção `_marca`; no Remotion, o `src/marca.ts` é a
  tradução gerada dele (não se edita à mão). Tom que falta se pergunta, não se
  deriva
- **Reel feito de carrossel é motion graphics, não slideshow**: o texto entra
  elemento por elemento, na ordem de leitura; dissolver entre slides prontos não
  serve
- **Todo movimento responde "o que isso comunica?"** Se a resposta for "nada, é
  bonito", corta. As regras com número estão em
  `.claude/skills/video/regras-de-movimento.md`
- **A voz é a do usuário, gravada.** Sem gravação, a peça sai sem voz ou, se ele
  pedir, com uma voz artificial da ElevenLabs, no plano gratuito, só para o que
  não se publica (`.claude/skills/video/voz.md`). Nenhuma voz de pessoa real sem
  a autorização dela, e esta skill não faz clonagem de voz
- **Remotion: `node_modules` é um só.** Nunca projeto Remotion novo. O
  HyperFrames não tem `node_modules`
- **Aqui, e não nas pastas dos plugins**: `.claude/skills/remotion/` e o cache
  do plugin do HyperFrames são código de terceiro, que some na atualização
- **O GSAP de `html/_vendor/`** é o 3.14.2, que o instalador traz
  (`node scripts/terceiros/instalar.mjs --so gsap-biblioteca`)
