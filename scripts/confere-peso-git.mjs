#!/usr/bin/env node
// Confere o peso do Git: a casa e cada projeto com Git próprio guardam texto e
// fonte, e a mídia que é saída fica fora (com o backup que você escolher).
//
// As réguas:
//   midia    vídeo ou áudio versionado (o que mora em testes/ ou fixtures/ é
//            fixture de teste e passa; o vídeo que a página de um projeto
//            serve, em public/videos/, .webm ou .mp4 até 1 MB, também passa)
//   saidas   na casa, mídia versionada numa pasta de saída (saidas/ e
//            carrosseis/): render, print, PDF exportado
//   teto     arquivo versionado acima do teto (insumo de skill ou da marca
//            se otimiza antes de entrar)
//   solto    vídeo ou áudio fora do Git e fora do .gitignore: entra no próximo add
// E a que impede o verde medindo zero:
//   leitura  nenhum repositório lido, .git que não é repositório, ou lista que o
//            git não deu
//
// Os projetos são as pastas de projetos-pessoais/ e clientes/ com .git próprio;
// junção aponta para outra pasta e não é projeto.
//
// Uso:  node scripts/confere-peso-git.mjs [--raiz <caminho>] [--teto-mb <n>]
// Sai 1 se algo reprovar.

import { existsSync, readdirSync, lstatSync, statSync } from 'node:fs';
import { join, resolve, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const RAIZ_PADRAO = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
export const TETO_MB = 6;

const VIDEO_AUDIO = /\.(mp4|m4v|mov|webm|mkv|avi|mp3|m4a|wav|ogg|opus|aac|flac)$/i;
export const MIDIA_DE_SAIDA = /\.(png|jpe?g|webp|gif|pdf|mp4|m4v|mov|webm|mkv|avi|mp3|m4a|wav|ogg|opus|aac|flac)$/i;
const FIXTURE = /(^|\/)(testes|fixtures)\//;
// O vídeo que a página de um projeto serve: é insumo do produto, como a imagem
// da página, e a publicação monta o site a partir do Git. Só em projeto (nunca
// na casa), só em public/videos/, só .webm ou .mp4, até 1 MB cada.
const VIDEO_DO_SITE = /^public\/videos\/[^/]+\.(webm|mp4)$/i;
export const VIDEO_DO_SITE_MB = 1;
// as pastas de saída da casa: o que mora nelas é render, print ou PDF exportado
const SAIDA_DA_CASA = /^(saidas|carrosseis)\//;

// O .git é mesmo um repositório? Um .git vazio ou quebrado faria o git subir até
// o repositório do pai e medir o que não é deste projeto.
const ehRaizDoGit = (repo) => {
  const r = spawnSync('git', ['-C', repo, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' });
  return r.status === 0 && resolve(r.stdout.trim()).toLowerCase() === resolve(repo).toLowerCase();
};

const lista = (repo, args) => {
  const r = spawnSync('git', ['-C', repo, 'ls-files', '-z', ...args], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  return r.status === 0 ? r.stdout.split('\0').filter(Boolean) : null;
};

function repositorios(raiz) {
  const repos = [];
  if (existsSync(join(raiz, '.git'))) repos.push(raiz);
  for (const pasta of ['projetos-pessoais', 'clientes']) {
    const dir = join(raiz, pasta);
    if (!existsSync(dir)) continue;
    for (const nome of readdirSync(dir)) {
      const p = join(dir, nome);
      if (!lstatSync(p).isDirectory()) continue; // a junção é link, não pasta: não é projeto
      if (existsSync(join(p, '.git'))) repos.push(p);
    }
  }
  return repos;
}

export function conferePesoGit(raiz = RAIZ_PADRAO, { tetoMB = TETO_MB, stat = statSync } = {}) {
  // o vídeo do site que cabe na exceção (o tamanho que não se lê não cabe)
  const videoDoSite = (repo, ehCasa, f) => {
    if (ehCasa || !VIDEO_DO_SITE.test(f)) return false;
    try { return stat(join(repo, f)).size <= VIDEO_DO_SITE_MB * 1024 * 1024; } catch { return false; }
  };
  const achados = [];
  const repos = repositorios(raiz);
  const teto = tetoMB * 1024 * 1024;
  if (!repos.length) achados.push({ regra: 'leitura', repo: raiz, arquivo: '', msg: 'nenhum repositório lido: verde medindo zero é vermelho' });

  for (const repo of repos) {
    const nome = relative(raiz, repo).split(sep).join('/') || '(a casa)';
    const ehCasa = repo === raiz;
    const rastreados = ehRaizDoGit(repo) ? lista(repo, []) : null;
    if (rastreados === null) { achados.push({ regra: 'leitura', repo: nome, arquivo: '', msg: 'o .git não é um repositório que o git lê, ou ele não listou os arquivos' }); continue; }
    for (const f of rastreados) {
      if (VIDEO_AUDIO.test(f) && !FIXTURE.test(f) && !videoDoSite(repo, ehCasa, f)) {
        const doSite = !ehCasa && VIDEO_DO_SITE.test(f);
        achados.push({ regra: 'midia', repo: nome, arquivo: f, msg: doSite ? `vídeo do site acima de ${VIDEO_DO_SITE_MB} MB: comprima, ou tire do Git` : 'vídeo ou áudio versionado: saída fica fora do Git (git rm --cached e o .gitignore)' });
      } else if (ehCasa && SAIDA_DA_CASA.test(f) && MIDIA_DE_SAIDA.test(f)) {
        achados.push({ regra: 'saidas', repo: nome, arquivo: f, msg: 'mídia versionada numa pasta de saída: o render, o print e o PDF exportado ficam fora do Git' });
      }
      let tamanho = 0;
      try { tamanho = stat(join(repo, f)).size; } catch (e) {
        // apagado do disco e ainda no índice: o próximo commit o tira, e não há peso a medir
        if (e.code === 'ENOENT' || e.code === 'ENOTDIR') continue;
        achados.push({ regra: 'leitura', repo: nome, arquivo: f, msg: `não consegui medir o tamanho (${e.code || e.message})` });
        continue;
      }
      if (tamanho > teto) {
        achados.push({ regra: 'teto', repo: nome, arquivo: f, msg: `${(tamanho / 1024 / 1024).toFixed(1)} MB, acima do teto de ${tetoMB} MB: otimize, ou tire do Git se for saída` });
      }
    }
    const soltos = lista(repo, ['--others', '--exclude-standard']);
    if (soltos === null) { achados.push({ regra: 'leitura', repo: nome, arquivo: '', msg: 'o git não listou os arquivos soltos' }); continue; }
    for (const f of soltos) {
      if (!FIXTURE.test(f) && VIDEO_AUDIO.test(f) && !videoDoSite(repo, ehCasa, f)) {
        achados.push({ regra: 'solto', repo: nome, arquivo: f, msg: 'vídeo ou áudio fora do .gitignore: entra no próximo git add' });
      }
    }
  }
  return { achados, repos: repos.length };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const arg = (n) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : undefined; };
  const raiz = arg('--raiz') ? resolve(arg('--raiz')) : RAIZ_PADRAO;
  const tetoMB = arg('--teto-mb') ? Number(arg('--teto-mb')) : TETO_MB;
  // teto que não é número positivo desligaria a régua calada
  if (!Number.isFinite(tetoMB) || tetoMB <= 0) {
    console.error(`--teto-mb pede um número positivo de MB; veio "${arg('--teto-mb')}"`);
    process.exit(1);
  }
  const { achados, repos } = conferePesoGit(raiz, { tetoMB });
  console.log(`peso do git: ${repos} repositório(s) lido(s)`);
  for (const a of achados) console.log(`  ✗ [${a.regra}] ${a.repo}${a.arquivo ? ` · ${a.arquivo}` : ''} · ${a.msg}`);
  console.log(achados.length ? `\n${achados.length} achado(s)` : '\nOK');
  if (achados.length) process.exit(1);
}
