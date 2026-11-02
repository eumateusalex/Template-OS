// ambiente.mjs · o que as skills de vídeo (/video, /mograph, /cortes) pedem da máquina, e o que falta.
//
//   node .claude/skills/video/ferramentas/ambiente.mjs
//
// Num computador novo, roda primeiro: cada linha diz ok, FALTA (sai 1) ou aviso (opcional), e cada
// falta vem com o comando ou o passo que a resolve. Confere os programas (ffmpeg, ffprobe, o Python com
// numpy), o Python das ferramentas de mixagem (o MIXAGEM_PY, ou o `python` do PATH, com numpy, scipy,
// soundfile, soxr e pyloudnorm, importados com -I, como as ferramentas rodam), o material do usuário (pelo `ativos.py onde` da /mograph: opcional,
// sem ele a busca vai ao Mixkit), o Playwright de scripts/ e o Chromium dele, e os opcionais (yt-dlp).
// O motor (HyperFrames) roda pelo npx fixo da versão do hyperframes.md e não precisa de instalação; no
// Windows, o navegador do render dele é o headless shell do Playwright (o HYPERFRAMES_BROWSER_PATH).
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, dirname, resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, '../../../..');
const ATIVOS = join(RAIZ, '.claude', 'skills', 'mograph', 'ferramentas', 'ativos.py');
const MIXAGEM_PY = process.env.MIXAGEM_PY || 'python';
// as réguas de tela da /mograph abrem o Chromium pelo Playwright de scripts/ (o navegador.mjs); o
// VIDEO_SCRIPTS troca a pasta, como no teste
const SCRIPTS = process.env.VIDEO_SCRIPTS || join(RAIZ, 'scripts');

const roda = (cmd, args) => spawnSync(cmd, args, { encoding: 'utf8', windowsHide: true });
const existe = (cmd, args = ['-version']) => { const r = roda(cmd, args); return !r.error && r.status === 0; };

// os cinco pacotes da mixagem, com a versão que o scripts/requirements.txt fixa (lida dele, não copiada
// aqui); o resto do requirements (transcrição, conversão, as libs da placa NVIDIA) não entra na mixagem
export const MODULOS_MIX = ['numpy', 'scipy', 'soundfile', 'soxr', 'pyloudnorm'];
export function pacotesFixados(nomes, requirements = join(RAIZ, 'scripts', 'requirements.txt')) {
  let texto = '';
  try { texto = readFileSync(requirements, 'utf8'); } catch { /* sem o arquivo, vai o nome sem versão */ }
  return nomes.map((n) => (texto.match(new RegExp(`^${n}==[^\\s#]+`, 'm')) || [n])[0]);
}

// as ferramentas rodam o Python com -I, que não enxerga o site-packages do usuário (onde o pip deixa o
// pacote quando a pasta do Python não é gravável). Por isso a conferência importa com -I, como elas, e
// separa o caso em que o pacote só existe no site do usuário: ali o pip responde "already satisfied" e
// a ferramenta não acha o pacote, então o conserto é outro Python, não reinstalar
export function situacaoPython(py, modulos, rodar = roda) {
  const tenta = (args) => { const r = rodar(py, args); return !r.error && r.status === 0; };
  if (tenta(['-I', '-c', `import ${modulos.join(', ')}`])) return 'ok';
  if (!tenta(['--version'])) return 'sem-python';
  if (tenta(['-c', `import ${modulos.join(', ')}`])) return 'site-do-usuario';
  return 'falta';
}
export function remedioPython(situacao, py, modulos) {
  const pins = pacotesFixados(modulos).join(' ');
  // o caminho absoluto com barra normal roda no Git Bash do Claude Code e no PowerShell (lá, com & na frente
  // do executável entre aspas); a variável vai para o "env" do settings.local.json, que vale em todo comando
  // das sessões seguintes, porque o export morre com o shell
  const pasta = `${homedir().split('\\').join('/')}/.mixagem`;
  const exe = `${pasta}/Scripts/python.exe`;
  const venv = `python -m venv "${pasta}", depois "${exe}" -m pip install ${pins} (no PowerShell, com & antes do caminho entre aspas), e grave "MIXAGEM_PY": "${exe}" no "env" do .claude/settings.local.json (vale para todo comando a partir da próxima sessão)`;
  if (situacao === 'site-do-usuario') {
    return `${modulos.join(', ')} estão só no site-packages do usuário, que o ${py} -I (como as ferramentas rodam) não enxerga, e reinstalar não muda isso. Crie um Python só da mixagem: ${venv}`;
  }
  if (situacao === 'sem-python') return `winget install Python.Python.3.12, depois python -m pip install ${pins}`;
  return `python -m pip install ${pins} (só estes; o scripts/requirements.txt inteiro traz a transcrição e passa de 2 GB). Se o pip instalar no site do usuário, o -I das ferramentas não o enxerga: ${venv}`;
}

// o headless shell mais novo de %LOCALAPPDATA%\ms-playwright (pelo número da pasta), com barra normal
export function headlessShell(localAppData = process.env.LOCALAPPDATA) {
  const base = localAppData && join(localAppData, 'ms-playwright');
  if (!base || !existsSync(base)) return null;
  const pastas = readdirSync(base).filter((n) => /^chromium_headless_shell-\d+$/.test(n)).sort((a, b) => Number(a.split('-').pop()) - Number(b.split('-').pop()));
  for (const n of pastas.reverse()) {
    const exe = join(base, n, 'chrome-headless-shell-win64', 'chrome-headless-shell.exe');
    if (existsSync(exe)) return exe.split('\\').join('/');
  }
  return null;
}
function remedioNavegador() {
  const exe = headlessShell();
  if (!exe) return `PLAYWRIGHT_SKIP_BROWSER_GC=1 npx --prefix "${SCRIPTS}" playwright install chromium-headless-shell, e rode de novo para ver o caminho a gravar (hyperframes.md, "O navegador do render")`;
  return `grave "HYPERFRAMES_BROWSER_PATH": "${exe}" no "env" do .claude/settings.local.json (vale para todo comando a partir da próxima sessão; hyperframes.md, "O navegador do render")`;
}

export function confere() {
  const linhas = [];
  const ok = (o) => linhas.push({ estado: 'ok', o });
  const falta = (o, como) => linhas.push({ estado: 'FALTA', o, como });
  const aviso = (o, como) => linhas.push({ estado: 'aviso', o, como });

  for (const p of ['ffmpeg', 'ffprobe']) {
    if (existe(p)) ok(p);
    else falta(p, 'winget install Gyan.FFmpeg (e abra um terminal novo, para o PATH)');
  }
  const sitPy = situacaoPython('python', ['numpy']);
  const py = sitPy === 'ok';
  if (py) ok('python com numpy');
  else falta(sitPy === 'sem-python' ? 'python' : 'python com numpy', remedioPython(sitPy, 'python', ['numpy']));

  const sitMix = situacaoPython(MIXAGEM_PY, MODULOS_MIX);
  if (sitMix === 'ok') ok(`o Python da mixagem (${MIXAGEM_PY})`);
  else falta(`o Python da mixagem (${MIXAGEM_PY})`,
    `${remedioPython(sitMix, MIXAGEM_PY, MODULOS_MIX)} (o simula_mix.py, o esvazia.py, o confere_posicao.py e o tonal.py rodam nele)`);

  if (py && existsSync(ATIVOS)) {
    const r = roda('python', ['-I', ATIVOS, 'onde']);
    let onde = null;
    try { onde = JSON.parse(r.stdout); } catch { /* a saída não é JSON: vira falta com o erro */ }
    if (!onde) falta('o material do usuário', `o ativos.py onde não respondeu: ${(r.stderr || '').trim().slice(0, 160)}`);
    else if (!Object.keys(onde.pacotes || {}).length) {
      aviso('sem material próprio declarado (opcional): a busca de som vai direto ao Mixkit',
        `para usar os seus pacotes, copie o material.exemplo.json para ${onde.config} e declare a raiz e cada pacote`);
    } else if (!onde.raiz || !onde.existe) {
      falta(`a raiz de material (${onde.raiz || 'não configurada'})`,
        `ponha no material.local.json (${onde.config}) a pasta desta máquina onde moram os pacotes declarados, ou o caminho no VIDEO_MATERIAL`);
    } else {
      ok(`a raiz de material (${onde.raiz})`);
      for (const [p, info] of Object.entries(onde.pacotes)) {
        if (info.existe) ok(`o pacote ${p}`);
        else aviso(`o pacote ${p} não está em ${info.pasta}`, 'a busca responde pelo índice; o trazer pede a pasta. Copie o pacote para lá, ou siga sem ele');
      }
    }
  } else {
    // não medir não é passar: sem o python ou sem o ativos.py, o material fica sem conferência, e isso é falta
    falta('o material do usuário', py ? `o ativos.py da /mograph não está em ${ATIVOS}: o material não se conferiu`
      : 'resolva o python com numpy antes: o material se confere pelo ativos.py da /mograph');
  }

  let chromium = null;
  try { ({ chromium } = createRequire(join(SCRIPTS, 'package.json'))('playwright')); } catch { /* sem o npm ci: vira falta */ }
  if (!chromium) falta(`o Playwright de scripts/ (${join(SCRIPTS, 'node_modules')})`, `npm --prefix "${SCRIPTS}" ci (as réguas de tela da /mograph abrem o Chromium por ele)`);
  else if (!existsSync(chromium.executablePath())) falta('o Chromium do Playwright', `PLAYWRIGHT_SKIP_BROWSER_GC=1 npx --prefix "${SCRIPTS}" playwright install chromium`);
  else ok('o Playwright de scripts/ e o Chromium dele');

  // no Windows o Chrome que o HyperFrames baixa pode ser barrado (o check falha com spawn UNKNOWN): o
  // navegador do render é o headless shell mais novo do Playwright, pelo HYPERFRAMES_BROWSER_PATH
  if (process.platform === 'win32') {
    const dado = process.env.HYPERFRAMES_BROWSER_PATH;
    if (dado && existsSync(dado)) ok(`o navegador do render (${dado})`);
    else if (dado) falta(`o navegador do render (o HYPERFRAMES_BROWSER_PATH aponta ${dado}, que não existe)`, remedioNavegador());
    else aviso('o navegador do render: sem o HYPERFRAMES_BROWSER_PATH, o HyperFrames usa o Chrome que ele baixa, que o Windows pode barrar (spawn UNKNOWN no check)', remedioNavegador());
  }

  if (existe('yt-dlp', ['--version'])) ok('yt-dlp');
  else aviso('yt-dlp (a pesquisa baixa a referência por ele)', 'python -m pip install yt-dlp');
  return linhas;
}

function principal() {
  const linhas = confere();
  for (const l of linhas) console.log(`${l.estado} ${l.o}${l.como ? `\n      ${l.como}` : ''}`);
  const faltas = linhas.filter((l) => l.estado === 'FALTA').length;
  console.log(faltas ? `\n${faltas} falta(s): resolva e rode de novo` : '\npronto: a máquina roda as skills de vídeo');
  process.exitCode = faltas ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) principal();
