// A lista `ask` do `.claude/settings.json`: o que pergunta antes de rodar, mesmo
// com o resto liberado. Três grupos:
// - o git sem volta, o que nem o reflog nem o remoto trazem de novo (reset --hard,
//   clean, push que força ou apaga no remoto, reescrita do histórico e a limpeza
//   de objetos). O resto do git (rebase, restore, amend, branch -d, stash drop)
//   passa direto: o commitado o reflog traz de volta, e o `restore` e o
//   `checkout --` só descartam o que ainda não foi commitado, de propósito;
// - as formas de rodar um comando por dentro de outro shell (`bash -c`, `cmd /c`,
//   `powershell`, `Invoke-Expression`), que fogem do casamento por prefixo, o
//   alias de git definido na própria linha, e o que apaga a pasta `.git` ou o
//   repositório no GitHub;
// - o que instala código de terceiro na máquina ou liga a conta de uma IA
//   (`npm install -g`, `pip install`, `codex login`, o `--motor gpt`).
// Cada padrão do git vai em todas as formas do comando (Bash e PowerShell, com e
// sem `-C <pasta>`, com opção global antes do subcomando, `git.exe`, caminho
// absoluto), porque o workspace usa `git -C` no lugar de `cd`, e `Bash(git reset *)`
// não pega `git -C . reset`. A opção longa vai pelo prefixo que o git aceita
// abreviado (`--har` é `--hard`).
//
// O que esta lista é: proteção contra o engano, o comando destrutivo pedido sem
// querer. Ela não fecha a injeção decidida: com o terminal liberado, um `node -e`
// faz o mesmo que um `git reset --hard`. O que fecha o remoto de verdade é a
// proteção do `main` no GitHub (o `CLAUDE.md` diz como).
//
// Uso:
//   node scripts/lista-ask.mjs --mostrar
//   node scripts/lista-ask.mjs --simular                 (os comandos que devem e não devem perguntar, no Bash e no PowerShell)
//   node scripts/lista-ask.mjs --aplicar [settings.json] (troca só permissions.ask; o padrão é .claude/settings.json)
// A medição no Claude Code real é o `scripts/mede-ask.sh`.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// Sem espaço antes do `*` final = pega também sem argumento, com a opção colada e
// com a opção abreviada.
const GIT = [
  'reset --ha*', 'reset * --ha*',
  'clean *',
  'filter-branch', 'filter-branch *', 'filter-repo', 'filter-repo *',
  'reflog expire*', 'reflog delete*',
  'prune', 'prune *', 'repack*', 'gc', 'gc *',
  'push --for*', 'push -f', 'push -f *', 'push * --for*', 'push * -f', 'push * -f *',
  'push *+*', 'push --de*', 'push * --de*', 'push * -d *', 'push * :*',
  'push --mi*', 'push * --mi*',
  // a força em opção curta combinada, e o --prune, que apaga no remoto o ramo que sumiu daqui
  'push -fu*', 'push -uf*', 'push * -fu*', 'push * -uf*', 'push --prune*', 'push * --prune*',
];

// As formas de chamar o git antes do subcomando. A opção global (`-c`, `-P`,
// `--no-pager`), o executável com extensão e o caminho absoluto fogem do
// "git <subcomando>", então cada padrão vai também com elas, e o `git --no-pager
// log` sem perigo segue sem perguntar. No PowerShell o Claude Code trata `git` e
// `git.exe` como o mesmo comando e não diferencia maiúscula de minúscula: lá
// `git -C *` já pega `git -c x` e `git -p`.
const FORMAS = {
  Bash: ['git', 'git -C *', 'git -c *', 'git -P', 'git -P *', 'git --*', 'git.exe', 'git.exe -C *', '*/git', '*/git.exe'],
  PowerShell: ['git', 'git -C *', 'git --*', '*/git', '*/git.exe'],
};

// Shell dentro de shell, alias de git na própria linha, e o que apaga o repositório.
const FORA_DO_GIT = {
  Bash: [
    'bash -*c *', 'sh -*c *', 'zsh -*c *',
    'cmd /c *', 'cmd /C *', 'cmd //c *', 'cmd //C *', 'cmd.exe /c *', 'cmd.exe /C *', 'cmd.exe //c *', 'cmd.exe //C *',
    'powershell *', 'powershell.exe *', 'pwsh *', 'pwsh.exe *',
    'git -c *alias.*', 'git * -c *alias.*',
    'gh repo delete*', 'gh repo edit*', 'gh api *DELETE*', 'gh api *delete*',
    'rm *.git*',
  ],
  // sem diferença de maiúscula: `cmd /c` já pega `cmd /C`, e `rm` pega `RM`
  PowerShell: [
    'bash -*c *', 'sh -*c *',
    'cmd /c *', 'cmd //c *', 'cmd.exe /c *', 'cmd.exe //c *',
    'powershell *', 'powershell.exe *', 'pwsh *', 'pwsh.exe *',
    'Invoke-Expression *', 'iex *',
    'git -c *alias.*', 'git * -c *alias.*',
    'gh repo delete*', 'gh repo edit*', 'gh api *delete*',
    'Remove-Item *.git*', 'rm *.git*', 'ri *.git*', 'del *.git*', 'erase *.git*', 'rd *.git*', 'rmdir *.git*',
  ],
};

// Instalar código de terceiro na máquina e ligar a conta de uma IA, com a opção
// em qualquer ordem.
const INSTALAR = [
  'npm -g *', 'npm * -g', 'npm * -g *', 'npm --global *', 'npm * --global', 'npm * --global *',
  'pnpm -g *', 'pnpm * -g', 'pnpm * -g *', 'yarn global *',
  'codex login*',
  'pip* install *', '* -m pip install *', 'uv pip install *', 'uv tool install *',
  '*--motor*gpt*',
];

export function listaAsk () {
  const ask = [];
  for (const ferramenta of ['Bash', 'PowerShell']) {
    for (const p of GIT) for (const f of FORMAS[ferramenta]) ask.push(`${ferramenta}(${f} ${p})`);
    for (const c of FORA_DO_GIT[ferramenta]) ask.push(`${ferramenta}(${c})`);
    for (const c of INSTALAR) ask.push(`${ferramenta}(${c})`);
  }
  return [...new Set(ask)];
}

// O que pergunta nas duas ferramentas.
const PERGUNTA_SEMPRE = [
  'git reset --hard', 'git reset --hard HEAD~1', 'git reset HEAD~1 --hard', 'git -C . reset --hard',
  'git -C "C:/a b" reset --hard HEAD~1', 'git -c core.x=y reset --hard', 'git --no-pager reset --hard',
  'git --git-dir=.git reset --hard', 'git.exe reset --hard', 'git -C x -c a=b reset --hard',
  'git.exe -C x reset --hard', 'git reset --har', 'git reset --ha HEAD~1', '/usr/bin/git reset --hard',
  'C:/Program Files/Git/cmd/git.exe reset --hard',
  'git filter-branch', 'git filter-branch --tree-filter x', 'git filter-repo --path x',
  'git reflog expire --all', 'git reflog delete HEAD@{1}', 'git prune', 'git gc', 'git gc --prune=now', 'git repack -ad',
  'git clean -fd', 'git -C x clean -fdx', 'git -c x=y clean -fd',
  'git push --force', 'git push --forc', 'git push -f', 'git push origin main --force', 'git push --force-with-lease',
  'git push origin +main', 'git push origin :velho', 'git push --delete origin x', 'git push --del origin x',
  'git push origin --delete x', 'git push origin -d x', 'git push --mirror', 'git push --mirr',
  'git -C x push -f origin main', 'git -C x push origin +main', 'git --no-pager push -f',
  'git push -fu origin main', 'git push -uf origin main', 'git push origin -fu main', 'git push --prune origin x',
  'git push origin --prune',
  'git -c alias.zz="reset --hard" zz', 'git -C x -c alias.zz="clean -fd" zz',
  'bash -c "git reset --hard"', 'bash -lc "git reset --hard"', 'bash -ec "git clean -fd"', 'sh -c "git clean -fd"',
  'cmd /c git reset --hard', 'cmd //c git reset --hard', 'cmd.exe /c git reset --hard',
  'powershell -c git reset --hard', 'pwsh -c git clean -fd',
  'gh repo delete dono/repo --yes', 'gh api -X DELETE repos/dono/repo', 'rm -rf .git',
  'npm install -g pacote', 'npm i -g pacote', 'npm install pacote -g', 'npm -g install pacote', 'npm add --global pacote',
  'pnpm add -g pacote', 'yarn global add pacote',
  'pip install pacote', 'pip3 install pacote', 'pipx install pacote', 'python -m pip install pacote',
  'python3 -m pip install pacote', 'py -3.12 -m pip install pacote', 'uv pip install pacote', 'uv tool install pacote',
  'codex login', 'node scripts/gerar-imagem.js --motor gpt "um gato"', 'node scripts/gerar-imagem.js --motor "gpt" "um gato"',
  'node scripts/gerar-imagem.js --motor=gpt "um gato"',
];
// O que só o Bash distingue pela caixa (no PowerShell, `cmd /C` já é `cmd /c`).
const PERGUNTA_NO_BASH = ['cmd /C git reset --hard', 'git -P reset --hard'];
// O que só existe no PowerShell.
const PERGUNTA_NO_POWERSHELL = [
  'Invoke-Expression "git reset --hard"', 'iex "git clean -fd"', 'Remove-Item -Recurse -Force .git',
  'rm -r -fo .git', 'ri -r .git', 'del .git', 'rd /s .git', 'CMD /C git reset --hard', 'GIT RESET --HARD',
];

const PASSA_SEMPRE = [
  'git status --short', 'git -C . status', 'git -C x diff --cached --stat', 'git add a.txt',
  'git commit -m "x"', 'git -C x commit -q -m x -- a.txt', 'git push', 'git push origin main',
  'git push -u origin main', 'git push origin HEAD:main', 'git push --follow-tags', 'git log --oneline', 'git switch main',
  'git switch -c novo', 'git checkout main', 'git checkout -b novo', 'git -C x checkout -q --detach abc123',
  'git branch novo', 'git branch -a', 'git stash', 'git stash list', 'git fetch', 'git pull', 'git diff',
  'git show HEAD:a.txt', 'git worktree add --detach C:/dev/obra HEAD', 'git worktree list',
  'git worktree remove C:/dev/obra', 'git worktree prune', 'git remote -v',
  'git remote set-url --push origin SEM-PUSH', 'git remote remove origin', 'git remote add origin x',
  'git archive HEAD', 'git ls-files', 'git rev-parse HEAD', 'git -C x log -1', 'git clone x y', 'git init',
  'git tag v1', 'git merge x', 'git cherry-pick abc', 'git config --get remote.origin.url',
  'git config user.name "Ana"', 'git update-index --cacheinfo 100644,abc,x',
  // O que reescreve ou descarta, mas tem volta pelo reflog ou descarta de propósito: passa.
  'git reset', 'git reset --soft HEAD~1', 'git reset HEAD a.txt', 'git rebase main', 'git -C x rebase -i main',
  'git pull --rebase', 'git restore a.txt', 'git restore --staged a.txt', 'git checkout -- a.txt',
  'git checkout .', 'git checkout -f main', 'git checkout -B main origin/main', 'git switch -f main',
  'git stash drop', 'git stash clear', 'git branch -d x', 'git branch -D x', 'git branch -M novo',
  'git worktree remove --force x', 'git update-ref -d refs/heads/x', 'git commit --amend -m x',
  'git -C x commit --amend --no-edit',
  // A opção global e o executável com extensão só perguntam no comando sem volta.
  'git --no-pager log', 'git -c core.pager=cat log -1', 'git.exe status', 'git --version', '/usr/bin/git status',
  // O dia a dia fora do git.
  'npm install', 'npm ci --prefix scripts', 'npm install --prefix scripts playwright', 'npm run test -- --grep x',
  'pip list', 'pip show scipy', 'node scripts/gerar-imagem.js "um gato"', 'gh pr list', 'gh api repos/dono/repo',
  'rm -rf rascunho/x', 'python scripts/transcrever.py a.mp4', 'bash scripts/mede-ask.sh', 'bash .claude/skills/x/sincronizar.sh --completo',
];
const PASSA_NO_POWERSHELL = ['Get-ChildItem .', 'Remove-Item rascunho/x', 'Start-Process chrome.exe "file:///C:/x.html"'];

/** As regras de uma ferramenta como expressões; no PowerShell, sem diferença de maiúscula. */
function regrasDe (ask, ferramenta) {
  const escapa = (x) => x.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  const flags = ferramenta === 'PowerShell' ? 'i' : '';
  return ask.map((r) => r.match(new RegExp(`^${ferramenta}\\((.*)\\)$`))).filter(Boolean)
    .map((m) => ({ regra: m[0], re: new RegExp('^' + m[1].split('*').map(escapa).join('.*') + '$', flags) }));
}

export function simular (ask = listaAsk(), { silencioso = false } = {}) {
  const erros = [];
  const casos = {
    Bash: { pergunta: [...PERGUNTA_SEMPRE, ...PERGUNTA_NO_BASH], passa: PASSA_SEMPRE },
    PowerShell: { pergunta: [...PERGUNTA_SEMPRE, ...PERGUNTA_NO_POWERSHELL], passa: [...PASSA_SEMPRE, ...PASSA_NO_POWERSHELL] },
  };
  let total = 0;
  for (const [ferramenta, { pergunta, passa }] of Object.entries(casos)) {
    const regras = regrasDe(ask, ferramenta);
    // no PowerShell, o Claude Code compara `git.exe` como `git` (medido pelo mede-ask.sh)
    const comoCompara = (c) => (ferramenta === 'PowerShell' ? c.replace(/^git\.exe(?=\s)/i, 'git') : c);
    const pega = (c) => regras.find((r) => r.re.test(comoCompara(c)));
    for (const c of pergunta) { total++; if (!pega(c)) erros.push(`${ferramenta} SOLTO (devia perguntar): ${c}`); }
    for (const c of passa) { total++; const r = pega(c); if (r) erros.push(`${ferramenta} PEGA  (devia passar): ${c}  <- ${r.regra}`); }
  }
  if (!silencioso) {
    for (const e of erros) console.log(e);
    console.log(`${ask.length} regras · ${total} casos (Bash e PowerShell) · ${erros.length} erro(s)`);
  }
  return erros;
}

const ehPrincipal = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (ehPrincipal) {
  const [modo, alvoDado] = process.argv.slice(2);
  const ask = listaAsk();
  if (modo === '--mostrar') console.log(JSON.stringify(ask, null, 2));
  else if (modo === '--simular') process.exit(simular(ask).length ? 1 : 0);
  else if (modo === '--aplicar') {
    if (simular(ask).length) { console.error('a simulação reprovou: nada foi gravado'); process.exit(1); }
    const alvo = alvoDado || fileURLToPath(new URL('../.claude/settings.json', import.meta.url));
    const s = JSON.parse(readFileSync(alvo, 'utf8'));
    const antes = s.permissions?.ask?.length ?? 0;
    s.permissions = { ...s.permissions, ask };
    writeFileSync(alvo, JSON.stringify(s, null, 2) + '\n');
    console.log(`gravado em ${alvo}: ${antes} -> ${ask.length} regras`);
  } else {
    console.error('uso: --mostrar | --simular | --aplicar [settings.json]');
    process.exit(2);
  }
}
