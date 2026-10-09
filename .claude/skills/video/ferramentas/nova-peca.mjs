// Cria a pasta de uma peça do HyperFrames, pronta para escrever o roteiro.
//
//   node .claude/skills/video/ferramentas/nova-peca.mjs <nome>                          peça deste workspace, em .claude/video/html/<nome>/
//   node .claude/skills/video/ferramentas/nova-peca.mjs <nome> --em <pasta>             peça de cliente ou de projeto, na pasta dele, com a marca dele
//   node .claude/skills/video/ferramentas/nova-peca.mjs <nome> --em <pasta> --com-marca peça deste workspace que mora fora do estúdio (um teste em rascunho/)
//
// O que nasce: index.html (o esqueleto com as regras de render), roteiro.md,
// hyperframes.json, ativos/ e as junções: `_vendor` (o GSAP local) sempre, e
// `_marca` (a marca deste workspace) quando a peça é daqui.
//
// 🚨 Peça deste workspace só nasce com a marca fechada. A marca mora em
// `.claude/skills/carrossel/marca/`, e o sinal de que ela está configurada é um
// só, o mesmo de todas as skills visuais: o `tokens.css` existe e não tem a
// linha `ESTADO: nao-configurado` (o `/carrossel configurar` a apaga). Sem isso o
// script recusa: vídeo na paleta de demonstração sai com cara de template, e
// refazer depois custa a peça inteira.
//
// Por que junção e não "../": o snapshot e o Studio do HyperFrames só servem o
// que está dentro da raiz da peça. Por "../" a fonte da marca dá 404 e a peça
// sai em Arial sem erro nenhum. A junção não copia nada: a marca continua sendo
// uma só.
//
// Peça de cliente ou de projeto NÃO recebe a marca deste workspace (a de lá é a
// do dono): recebe só o `_vendor`. E as junções entram no .gitignore da peça,
// porque o git segue junção.
import { existsSync, mkdirSync, writeFileSync, readFileSync, appendFileSync, symlinkSync, realpathSync } from 'node:fs';
import { join, dirname, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exigirPeca } from '../../../../scripts/terceiros/peca.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
export const RAIZ = resolve(AQUI, '../../../..');

// O registro de blocos do HyperFrames (o que `hyperframes add` baixa), fixo no
// commit da tag v0.8.96, a mesma versão do CLI. Nunca a `main`: um bloco que
// mudar lá entraria na peça sem ninguém ver. Confere-se com
// `git ls-remote https://github.com/heygen-com/hyperframes.git refs/tags/v0.8.96`.
// Subir de versão troca o CLI e este commit juntos (hyperframes.md).
export const REGISTRO = 'https://raw.githubusercontent.com/heygen-com/hyperframes/5461e0ab03824f225eb8b3f6921b5474524c744e/registry';

export function caminhos(raiz = RAIZ) {
  const html = join(raiz, '.claude', 'video', 'html');
  return { html, vendor: join(html, '_vendor'), marca: join(raiz, '.claude', 'skills', 'carrossel', 'marca') };
}

/** A marca está fechada quando o tokens.css existe e não traz o marcador do molde. */
export function estadoDaMarca(raiz = RAIZ) {
  const p = join(caminhos(raiz).marca, 'tokens.css');
  if (!existsSync(p)) return { fechada: false, motivo: 'falta .claude/skills/carrossel/marca/tokens.css' };
  if (/ESTADO:\s*nao-configurado/.test(readFileSync(p, 'utf8'))) return { fechada: false, motivo: '.claude/skills/carrossel/marca/tokens.css ainda é o molde (ESTADO: nao-configurado)' };
  return { fechada: true, motivo: '' };
}

export function novaPeca(nome, { em, comMarca, cwd = process.cwd(), raiz = RAIZ } = {}) {
  if (!nome || !/^[a-z0-9][a-z0-9-]*$/.test(nome)) throw new Error(`nova-peca: nome "${nome}" inválido (minúsculas, números e hífen)`);
  const { html, vendor, marca } = caminhos(raiz);
  const rel = relative(raiz, resolve(cwd));
  const dentro = !rel.startsWith('..') && !isAbsolute(rel);
  if (!em && !dentro) throw new Error('nova-peca: fora deste workspace a peça mora na pasta do dono; diga onde com --em <pasta>');
  // dentro de clientes/ ou projetos-pessoais/ a marca é a do dono, nunca a deste workspace
  if (!em && /^(clientes|projetos-pessoais)([\\/]|$)/.test(rel)) throw new Error('nova-peca: peça de cliente ou de projeto mora na pasta dele, com a marca dele; diga onde com --em <pasta> (o CLAUDE.md de lá diz a pasta)');
  const pasta = em ? resolve(em) : join(html, nome);
  const daqui = !em || Boolean(comMarca);
  if (existsSync(join(pasta, 'index.html'))) throw new Error(`nova-peca: ${pasta} já tem index.html; não sobrescrevo peça`);
  // o GSAP local mora fora do git: o instalador das peças de terceiro o baixa
  try { exigirPeca('gsap-biblioteca', { raiz }); } catch (e) { throw new Error(`nova-peca: ${e.message}`); }
  if (daqui) {
    const m = estadoDaMarca(raiz);
    if (!m.fechada) throw new Error(`nova-peca: a marca deste workspace não está fechada (${m.motivo}). Rode /carrossel configurar antes: vídeo sem marca sai com cara de template`);
  }
  mkdirSync(join(pasta, 'ativos'), { recursive: true });

  const juncoes = [[join(pasta, '_vendor'), vendor]];
  if (daqui) juncoes.push([join(pasta, '_marca'), marca]);
  for (const [link, alvo] of juncoes) if (!existsSync(link)) symlinkSync(alvo, link, 'junction');

  const cabeca = daqui
    ? '    <link rel="stylesheet" href="_marca/tokens.css" />\n'
    : '    <!-- a marca desta peça é a do dono (o CLAUDE.md dele): defina no :root, AQUI, os tokens que o esqueleto usa (--bg-light, --on-light, --f-display e --w-display-bold) e a fonte com @font-face, com o arquivo dentro da pasta. Sem isso a peça sai sem cor e em fonte do sistema -->\n';
  const modelo = readFileSync(join(AQUI, 'modelo.html'), 'utf8')
    .replace('<!--MARCA-->\n', cabeca)
    .replaceAll('{{NOME}}', nome);
  writeFileSync(join(pasta, 'index.html'), modelo);
  writeFileSync(join(pasta, 'hyperframes.json'), JSON.stringify({
    $schema: 'https://hyperframes.heygen.com/schema/hyperframes.json',
    registry: REGISTRO,
    paths: { blocks: 'blocos', components: 'blocos/componentes', assets: 'ativos' },
    media: { autoProxy: true },
  }, null, 2) + '\n');
  if (!existsSync(join(pasta, 'roteiro.md'))) {
    writeFileSync(join(pasta, 'roteiro.md'), readFileSync(join(AQUI, 'modelo-roteiro.md'), 'utf8').replaceAll('{{NOME}}', nome));
  }
  // o .gitignore: no estúdio o de .claude/video/ já cobre (html/*/_vendor,
  // html/*/_marca, ativos/*.wav); fora dele, a peça ganha o seu
  if (em) {
    const gi = join(pasta, '.gitignore');
    const linhas = ['_vendor', ...(daqui ? ['_marca'] : []), 'ativos/*.wav', 'snapshots', 'renders'];
    const atual = existsSync(gi) ? readFileSync(gi, 'utf8') : '';
    const faltam = linhas.filter((l) => !atual.split(/\r?\n/).includes(l));
    if (faltam.length) appendFileSync(gi, (atual && !atual.endsWith('\n') ? '\n' : '') + faltam.join('\n') + '\n');
  }
  return { pasta, juncoes, daqui };
}

// realpath: chamado por um link (a skill levada para ~/.claude/skills, por
// exemplo), o caminho digitado não é o real, e sem isto o script saía calado
if (process.argv[1] && realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))) {
  const args = process.argv.slice(2);
  const valor = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
  try {
    const r = novaPeca(args[0], { em: valor('--em'), comMarca: args.includes('--com-marca') });
    const mostra = (p) => { const rel = relative(RAIZ, p); return rel && !rel.startsWith('..') && !isAbsolute(rel) ? rel : p; };
    console.log(`peça criada: ${mostra(r.pasta)}`);
    for (const [link, alvo] of r.juncoes) console.log(`junção: ${mostra(link)} → ${mostra(alvo)}`);
    console.log(r.daqui ? 'marca: a deste workspace, pela junção _marca' : 'marca: a do dono, definida no index.html (o aviso lá diz quais tokens)');
    console.log('🚨 para apagar esta peça: node .claude/skills/video/ferramentas/apagar-peca.mjs <pasta> (rm -rf atravessa a junção e apaga o alvo)');
    console.log('próximo: preencher roteiro.md, depois o index.html; conferir com `npx --yes hyperframes@0.8.96 check` dentro da pasta');
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
