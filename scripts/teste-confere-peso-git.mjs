#!/usr/bin/env node
// Prova que o `confere-peso-git.mjs` ainda sabe REPROVAR.
//
// Monta uma casa de mentira com Git (e um projeto com Git próprio dentro), planta
// um peso por vez e exige que o conferidor o encontre. Cada régua tem o par que
// prova que ela fica quieta quando o peso não existe. O último caso roda contra
// a casa de verdade: ela tem que estar limpa.
//
// Uso:  node scripts/teste-confere-peso-git.mjs
// mutação: scripts/confere-peso-git.mjs · "const FIXTURE = /(^|\/)(testes|fixtures)\//;" → "const FIXTURE = /nunca-casa/;" · pega
// mutação: scripts/confere-peso-git.mjs · "const VIDEO_AUDIO = //.(mp4|m4v|mov|webm|mkv|avi|mp3|m4a|wav|ogg|opus|aac|flac)$/i;" → "const VIDEO_AUDIO = //.(mp4|m4v|mov|webm|mkv|avi|mp3|m4a|wav)$/i;" · pega
// mutação: scripts/confere-peso-git.mjs · "if (tamanho > teto) {" → "if (tamanho > teto * 100) {" · pega
// mutação: scripts/confere-peso-git.mjs · "if (!repos.length) achados.push(" → "if (false) achados.push(" · pega
// mutação: scripts/confere-peso-git.mjs · "if (existsSync(join(p, '.git'))) repos.push(p);" → "if (false) repos.push(p);" · pega
// mutação: scripts/confere-peso-git.mjs · "if (!lstatSync(p).isDirectory()) continue;" → "if (false) continue;" · pega
// mutação: scripts/confere-peso-git.mjs · "const VIDEO_AUDIO = /\.(mp4|m4v|mov|webm|mkv|avi|mp3|m4a|wav|ogg|opus|aac|flac)$/i;" → "const VIDEO_AUDIO = /\.(m4v|mov|webm|mkv|avi|mp3|m4a|wav|ogg|opus|aac|flac)$/i;" · pega
// mutação: scripts/confere-peso-git.mjs · "} else if (ehCasa && SAIDA_DA_CASA.test(f) && MIDIA_DE_SAIDA.test(f)) {" → "} else if (SAIDA_DA_CASA.test(f) && MIDIA_DE_SAIDA.test(f)) {" · pega
// mutação: scripts/confere-peso-git.mjs · "const SAIDA_DA_CASA = /^(saidas|carrosseis)\//;" → "const SAIDA_DA_CASA = /^(saidas)\//;" · pega
// mutação: scripts/confere-peso-git.mjs · "const rastreados = ehRaizDoGit(repo) ? lista(repo, []) : null;" → "const rastreados = lista(repo, []);" · pega
// mutação: scripts/confere-peso-git.mjs · "export const TETO_MB = 6;" → "export const TETO_MB = 600;" · pega
// mutação: scripts/confere-peso-git.mjs · "if (!Number.isFinite(tetoMB) || tetoMB <= 0) {" → "if (false) {" · pega
// mutação: scripts/confere-peso-git.mjs · "const soltos = lista(repo, ['--others', '--exclude-standard']);" → "const soltos = [];" · pega
// mutação: scripts/confere-peso-git.mjs · "if (e.code === 'ENOENT' || e.code === 'ENOTDIR') continue;" → "if (true) continue;" · pega
// mutação: scripts/confere-peso-git.mjs · "if (ehCasa || !VIDEO_DO_SITE.test(f)) return false;" → "if (!VIDEO_DO_SITE.test(f)) return false;" · pega
// mutação: scripts/confere-peso-git.mjs · "<= VIDEO_DO_SITE_MB * 1024 * 1024; } catch" → "<= VIDEO_DO_SITE_MB * 1024 * 1024 * 100; } catch" · pega
// mutação: scripts/confere-peso-git.mjs · "if (!FIXTURE.test(f) && VIDEO_AUDIO.test(f) && !videoDoSite(repo, ehCasa, f)) {" → "if (!FIXTURE.test(f) && VIDEO_AUDIO.test(f)) {" · pega

import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { conferePesoGit, MIDIA_DE_SAIDA } from './confere-peso-git.mjs';
import { escreveRelatorio, resumoTap } from './lib/junit.mjs';

const RAIZ_DA_CASA = join(dirname(fileURLToPath(import.meta.url)), '..');

let passou = 0;
let falhou = 0;
const casos = [];

function afirma(nome, condicao, detalhe = '') {
  if (condicao) { passou++; casos.push({ nome, falha: null }); console.log(`  ok    ${nome}`); }
  else { falhou++; casos.push({ nome, falha: detalhe || 'reprovou' }); console.log(`  FALHOU ${nome}${detalhe ? ` · ${detalhe}` : ''}`); }
}

const pastas = [];
const git = (cwd, ...a) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd, encoding: 'utf8' });

// rastreados: versionados; soltos: no disco, sem git add; ignore: o .gitignore
function repo(raiz, { rastreados = {}, soltos = {}, ignore = '' } = {}) {
  mkdirSync(raiz, { recursive: true });
  git(raiz, 'init', '-q');
  writeFileSync(join(raiz, '.gitignore'), `projetos-pessoais/\nclientes/\n${ignore}`);
  writeFileSync(join(raiz, 'LEIA-ME.md'), 'texto\n');
  for (const [f, tam] of Object.entries(rastreados)) { mkdirSync(dirname(join(raiz, f)), { recursive: true }); writeFileSync(join(raiz, f), Buffer.alloc(tam, 1)); }
  git(raiz, 'add', '-A', '-f', '.');
  git(raiz, 'commit', '-q', '-m', 'base', '--no-verify');
  for (const [f, tam] of Object.entries(soltos)) { mkdirSync(dirname(join(raiz, f)), { recursive: true }); writeFileSync(join(raiz, f), Buffer.alloc(tam, 1)); }
  return raiz;
}

function casa(opcoes = {}, projeto = null) {
  const raiz = mkdtempSync(join(tmpdir(), 'confere-peso-'));
  pastas.push(raiz);
  repo(raiz, opcoes);
  if (projeto) repo(join(raiz, 'projetos-pessoais', 'x'), projeto);
  return raiz;
}

const MB = 1024 * 1024;
const regras = (r) => r.achados.map((a) => a.regra);
const tem = (r, regra, trecho = '') => r.achados.some((a) => a.regra === regra && `${a.repo} ${a.arquivo} ${a.msg}`.includes(trecho));

try {
  const limpa = conferePesoGit(casa());
  afirma('a casa limpa passa', limpa.achados.length === 0, JSON.stringify(limpa.achados));
  afirma('a casa limpa leu um repositório', limpa.repos === 1, `leu ${limpa.repos}`);

  // ── vídeo e áudio versionados ───────────────────────────────────────────
  const video = conferePesoGit(casa({ rastreados: { 'pecas/reel.mp4': 10 } }));
  afirma('vídeo versionado reprova, com o caminho', tem(video, 'midia', 'pecas/reel.mp4'), JSON.stringify(video.achados));
  const audio = conferePesoGit(casa({ rastreados: { 'pecas/voz.MP3': 10 } }));
  afirma('áudio versionado reprova, sem olhar a caixa da extensão', tem(audio, 'midia', 'voz.MP3'), JSON.stringify(audio.achados));
  const outras = conferePesoGit(casa({ rastreados: { 'a/voz.ogg': 10, 'a/aula.m4v': 10, 'a/musica.flac': 10, 'a/nota.aac': 10, 'a/fala.opus': 10 } }));
  afirma('ogg, m4v, flac, aac e opus versionados reprovam', ['voz.ogg', 'aula.m4v', 'musica.flac', 'nota.aac', 'fala.opus'].every((f) => tem(outras, 'midia', f)), JSON.stringify(outras.achados));
  const fixture = conferePesoGit(casa({ rastreados: { 'scripts/testes/fala.wav': 10, 'kit/fixtures/a.mp4': 10 } }));
  afirma('o fixture em testes/ ou fixtures/ passa', !regras(fixture).includes('midia'), JSON.stringify(fixture.achados));

  // ── mídia em saidas/ ────────────────────────────────────────────────────
  const saidas = conferePesoGit(casa({ rastreados: { 'saidas/estudo/slide-01.png': 10, 'saidas/estudo/guia.pdf': 10 } }));
  afirma('imagem versionada em saidas reprova', tem(saidas, 'saidas', 'slide-01.png'), JSON.stringify(saidas.achados));
  afirma('PDF versionado em saidas reprova', tem(saidas, 'saidas', 'guia.pdf'), JSON.stringify(saidas.achados));
  const texto = conferePesoGit(casa({ rastreados: { 'saidas/estudo/README.md': 10, 'kit/ativos/foto.png': 10 } }));
  afirma('texto em saidas e imagem de insumo fora dela passam', texto.achados.length === 0, JSON.stringify(texto.achados));

  // ── o teto de tamanho ───────────────────────────────────────────────────
  const grande = conferePesoGit(casa({ rastreados: { 'kit/ativos/enorme.png': 2 * MB } }), { tetoMB: 1 });
  afirma('arquivo acima do teto reprova', tem(grande, 'teto', 'enorme.png'), JSON.stringify(grande.achados));
  const noTeto = conferePesoGit(casa({ rastreados: { 'kit/ativos/no-teto.png': MB } }), { tetoMB: 1 });
  afirma('arquivo com exatamente o teto passa', !regras(noTeto).includes('teto'), JSON.stringify(noTeto.achados));

  // ── o solto que entra no próximo add ────────────────────────────────────
  const solto = conferePesoGit(casa({ soltos: { 'pecas/novo.mov': 10 } }));
  afirma('vídeo solto e não ignorado reprova', tem(solto, 'solto', 'novo.mov'), JSON.stringify(solto.achados));
  const ignorado = conferePesoGit(casa({ soltos: { 'pecas/novo.mov': 10 }, ignore: '*.mov\n' }));
  afirma('vídeo solto e ignorado passa', !regras(ignorado).includes('solto'), JSON.stringify(ignorado.achados));

  // ── o projeto com Git próprio ───────────────────────────────────────────
  const comProjeto = conferePesoGit(casa({}, { rastreados: { 'demo.webm': 10 } }));
  afirma('o projeto com Git próprio é conferido', tem(comProjeto, 'midia', 'demo.webm') && comProjeto.repos === 2, JSON.stringify(comProjeto));
  afirma('o achado do projeto diz o repositório', comProjeto.achados.some((a) => a.repo.includes('projetos-pessoais/x')), JSON.stringify(comProjeto.achados));
  const raizJ = casa();
  const fora = mkdtempSync(join(tmpdir(), 'confere-peso-fora-'));
  pastas.push(fora);
  repo(fora, { rastreados: { 'alheio.mp4': 10 } });
  mkdirSync(join(raizJ, 'projetos-pessoais'), { recursive: true });
  symlinkSync(fora, join(raizJ, 'projetos-pessoais', 'juncao'), 'junction');
  const juncao = conferePesoGit(raizJ);
  afirma('junção para outra pasta não é projeto', !tem(juncao, 'midia', 'alheio.mp4') && juncao.repos === 1, JSON.stringify(juncao));

  // ── o projeto quebrado e a mídia fora do índice ─────────────────────────
  const quebrado = casa();
  mkdirSync(join(quebrado, 'projetos-pessoais', 'x', '.git'), { recursive: true });
  writeFileSync(join(quebrado, 'projetos-pessoais', 'x', 'reel.mp4'), Buffer.alloc(10, 1));
  const rQuebrado = conferePesoGit(quebrado);
  afirma('.git que não é repositório reprova, e não lê o Git do pai', tem(rQuebrado, 'leitura', 'projetos-pessoais/x'), JSON.stringify(rQuebrado));
  const padrao = conferePesoGit(casa({ rastreados: { 'kit/ativos/acima.png': 6 * MB + 1 } }));
  afirma('o teto padrão é 6 MB', tem(padrao, 'teto', 'acima.png'), JSON.stringify(padrao.achados));
  const noPadrao = conferePesoGit(casa({ rastreados: { 'kit/ativos/no-padrao.png': 6 * MB } }));
  afirma('arquivo com exatamente 6 MB passa no teto padrão', !regras(noPadrao).includes('teto'), JSON.stringify(noPadrao.achados));
  // o tamanho que não se mede: só "o arquivo sumiu do disco" é pulado
  const semPermissao = conferePesoGit(casa({ rastreados: { 'kit/ativos/travado.png': 10 } }), { stat: () => { throw Object.assign(new Error('negado'), { code: 'EACCES' }); } });
  afirma('erro ao medir o tamanho que não é arquivo sumido reprova como leitura', tem(semPermissao, 'leitura', 'travado.png'), JSON.stringify(semPermissao.achados));
  const sumiu = conferePesoGit(casa({ rastreados: { 'kit/ativos/sumiu.png': 10 } }), { stat: () => { throw Object.assign(new Error('não existe'), { code: 'ENOENT' }); } });
  afirma('arquivo que sumiu do disco não reprova', !regras(sumiu).includes('leitura'), JSON.stringify(sumiu.achados));
  const projSaidas =conferePesoGit(casa({}, { rastreados: { 'saidas/print.png': 10 } }));
  afirma('saidas/ de projeto não é a régua da casa', !regras(projSaidas).includes('saidas'), JSON.stringify(projSaidas.achados));
  const fixtureSolto = conferePesoGit(casa({ soltos: { 'scripts/testes/nova.wav': 10 } }));
  afirma('fixture solto em testes/ passa', !regras(fixtureSolto).includes('solto'), JSON.stringify(fixtureSolto.achados));
  const marketing = conferePesoGit(casa({ rastreados: { 'carrosseis/carrossel-dica/peca/instagram/slide-01.jpg': 10 } }));
  afirma('imagem versionada em carrosseis reprova (a saída da peça)', tem(marketing, 'saidas', 'slide-01.jpg'), JSON.stringify(marketing.achados));
  const tetoRuim = spawnSync(process.execPath, [fileURLToPath(new URL('./confere-peso-git.mjs', import.meta.url)), '--teto-mb', 'abc'], { encoding: 'utf8' });
  afirma('o --teto-mb que não é número positivo reprova antes de medir', tetoRuim.status === 1 && /teto/.test(tetoRuim.stdout + tetoRuim.stderr) && !/repositório\(s\) lido/.test(tetoRuim.stdout), (tetoRuim.stdout + tetoRuim.stderr).slice(0, 200));

  // ── o vídeo que a página de um projeto serve ────────────────────────────
  // a exceção escrita: em public/videos/ de um projeto, .webm ou .mp4, até 1 MB, porque a publicação monta o site do Git
  const videoDoSite = conferePesoGit(casa({}, { rastreados: { 'public/videos/vivo.webm': MB / 2, 'public/videos/vivo.mp4': MB } }));
  afirma('o vídeo do site do projeto, até 1 MB, passa', !regras(videoDoSite).includes('midia'), JSON.stringify(videoDoSite.achados));
  const videoGrande = conferePesoGit(casa({}, { rastreados: { 'public/videos/grande.mp4': MB + 1 } }));
  afirma('o vídeo do site acima de 1 MB reprova', tem(videoGrande, 'midia', 'grande.mp4'), JSON.stringify(videoGrande.achados));
  const videoNaCasa = conferePesoGit(casa({ rastreados: { 'public/videos/vivo.webm': 10 } }));
  afirma('na casa, public/videos não é exceção', tem(videoNaCasa, 'midia', 'public/videos/vivo.webm'), JSON.stringify(videoNaCasa.achados));
  const videoForaDaPasta = conferePesoGit(casa({}, { rastreados: { 'public/outra/vivo.webm': 10, 'public/videos/sub/vivo.webm': 10, 'public/videos/voz.mp3': 10 } }));
  afirma('fora de public/videos, em subpasta ou áudio, reprova', ['public/outra/vivo.webm', 'public/videos/sub/vivo.webm', 'public/videos/voz.mp3'].every((f) => tem(videoForaDaPasta, 'midia', f)), JSON.stringify(videoForaDaPasta.achados));
  const videoDoSiteSolto = conferePesoGit(casa({}, { soltos: { 'public/videos/novo.webm': 10 } }));
  afirma('o vídeo do site ainda sem add não é solto', !regras(videoDoSiteSolto).includes('solto'), JSON.stringify(videoDoSiteSolto.achados));
  const videoGrandeSolto = conferePesoGit(casa({}, { soltos: { 'public/videos/grande.webm': MB + 1 } }));
  afirma('o vídeo do site acima de 1 MB e sem add é solto', tem(videoGrandeSolto, 'solto', 'grande.webm'), JSON.stringify(videoGrandeSolto.achados));

  // ── verde medindo zero ──────────────────────────────────────────────────
  const semGit = mkdtempSync(join(tmpdir(), 'confere-peso-sem-git-'));
  pastas.push(semGit);
  const zero = conferePesoGit(semGit);
  afirma('sem repositório nenhum reprova', tem(zero, 'leitura'), JSON.stringify(zero.achados));

  // ── o .gitignore da casa tira de carrosseis/ toda mídia que o gate reprova ──
  // A extensão sai da régua do próprio gate (MIDIA_DE_SAIDA): a foto que a
  // pessoa traz para a pasta da peça não pode aparecer no git status.
  const extensoes = MIDIA_DE_SAIDA.source.match(/\(([^)]+)\)/)[1].split('|')
    .flatMap((e) => (e.includes('?') ? [e.replace(/.\?/, ''), e.replace('?', '')] : [e]));
  const amostras = extensoes.flatMap((e) => [`carrosseis/peca-2026-01-01/foto.${e}`, `carrosseis/peca-2026-01-01/instagram/FOTO.${e.toUpperCase()}`]);
  const ignoradoNaCasa = (f) => git(RAIZ_DA_CASA, 'check-ignore', '-q', '--no-index', f).status === 0;
  const versionaveis = amostras.filter((f) => !ignoradoNaCasa(f));
  afirma(`o .gitignore ignora em carrosseis/ as ${extensoes.length} extensões de mídia do gate, em minúscula e maiúscula`, extensoes.length >= 10 && versionaveis.length === 0, versionaveis.join(', '));
  const textoDaPeca = ['carrossel.html', 'roteiro.md', 'IMAGENS.md', 'legenda.txt', 'legenda.md'].map((f) => `carrosseis/peca-2026-01-01/${f}`).filter(ignoradoNaCasa);
  afirma('o HTML, o roteiro, o IMAGENS.md e a legenda da peça seguem versionados', textoDaPeca.length === 0, textoDaPeca.join(', '));

  // ── a casa de verdade está limpa ────────────────────────────────────────
  const real = conferePesoGit();
  afirma('a casa de hoje passa', real.achados.length === 0, real.achados.slice(0, 5).map((a) => `${a.repo} ${a.arquivo} ${a.msg}`).join(' | '));
  afirma('a casa de hoje leu ao menos a raiz', real.repos >= 1, `leu ${real.repos}`);
} finally {
  for (const p of pastas) rmSync(p, { recursive: true, force: true });
}

escreveRelatorio(process.argv, 'confere-peso-git', casos, { passou, falhou });
resumoTap(passou, falhou);
if (falhou) process.exit(1);
