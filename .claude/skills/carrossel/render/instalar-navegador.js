// Baixa o Chromium do Playwright para o render, sem apagar o navegador de outras versões do
// Playwright na máquina: o cache é um só (%LOCALAPPDATA%\ms-playwright), e o `playwright install`
// sem PLAYWRIGHT_SKIP_BROWSER_GC=1 limpa dele o que não é desta versão. A variável vai por aqui
// porque o script do npm roda no cmd.exe no Windows, onde o prefixo VAR=1 do Bash não existe.
//
//   npm --prefix .claude/skills/carrossel/render run instalar   (o npm ci, e depois este arquivo)
const { spawnSync } = require('node:child_process');

const ambiente = (env = process.env) => ({ ...env, PLAYWRIGHT_SKIP_BROWSER_GC: '1' });

if (require.main === module) {
  const r = spawnSync('npx playwright install chromium', { stdio: 'inherit', shell: true, cwd: __dirname, env: ambiente() });
  process.exit(r.status ?? 1);
}

module.exports = { ambiente };
