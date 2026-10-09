#!/usr/bin/env node
/**
 * Prova que o `gerar-imagem.js` ainda sabe REPROVAR.
 *
 * Rodar depois de mexer no script:
 *   node scripts/teste-gerar-imagem.mjs
 *
 * Sai 0 se tudo passar, 1 se algo reprovar. Não chama a API, não gasta nada:
 * tudo aqui é `--dry-run` e inspeção do corpo do pedido antes de sair da máquina,
 * menos o caso do gerador de vídeo, que roda com o `--confirmo` e a rede bloqueada
 * pela bancada.
 *
 * 🚨 E NÃO FALA COM TERCEIRO. O `--dry-run` resolve o alvo de propósito (é o
 * momento barato de descobrir configuração faltando), e isso pediria o token ao
 * `gcloud` de verdade, com a sua credencial. Aqui ela roda com um `gcloud` FALSO da
 * própria bancada (o gerador o lê de `GCLOUD_PATH`, antes dos caminhos da
 * instalação) e com o projeto de teste no ambiente (o gerador só lê do
 * `scripts/.env` a chave que o ambiente não trouxe). O falso anota cada chamada,
 * e um caso exige que ele tenha sido chamado.
 *
 * Por que existe: o `--ref` aceita até 14 imagens, na ordem da linha de
 * comando. Três coisas podem
 * quebrar em silêncio nesse caminho, e nenhuma delas dá erro na hora:
 *
 *   1. a ORDEM das referências inverter — o prompt cita "a imagem 1" e o modelo
 *      recebe outra. Sai imagem plausível e errada, que é o pior tipo de defeito
 *   2. o MIME sair errado. Rotular como image/png tudo que não é .jpg faz o
 *      .webp subir mentindo
 *   3. o TETO por modelo afrouxar. O 14 é da doc oficial do Gemini (conferida em
 *      08/09/2026); o legacy não tem teto publicado e por isso é conservador
 *
 * Verde que não sabe ficar vermelho não mede nada: por isso metade dos casos
 * aqui EXIGE que o script recuse.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { escreveRelatorio, resumoTap } from './lib/junit.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(RAIZ, 'scripts', 'gerar-imagem.js');

let ok = 0;
let mau = 0;
// cada caso entra no relatório de máquina (junit) que o `--relatorio` escreve
const casos = [];

function checa(nome, condicao) {
  casos.push({ nome, falha: condicao ? null : 'falhou' });
  if (condicao) {
    console.log(`  OK    ${nome}`);
    ok++;
  } else {
    console.log(`  FALHA ${nome}`);
    mau++;
  }
}

// ── Bancada ───────────────────────────────────────────────────

const BANCADA = fs.mkdtempSync(path.join(os.tmpdir(), 'teste-gerar-imagem-'));
const REFS = path.join(BANCADA, 'refs');
fs.mkdirSync(REFS);

// PNGs mínimos com bytes distintos: o conteúdo precisa diferir para a prova de
// ordem significar alguma coisa.
const PNG_MAGICO = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
for (let i = 1; i <= 15; i += 1) {
  const nome = `r${String(i).padStart(2, '0')}.png`;
  fs.writeFileSync(path.join(REFS, nome), Buffer.concat([PNG_MAGICO, Buffer.from(`ref-${i}`)]));
}
fs.writeFileSync(path.join(REFS, 'foto.webp'), Buffer.concat([PNG_MAGICO, Buffer.from('webp')]));
fs.writeFileSync(path.join(REFS, 'nota.txt'), 'não é imagem');

const ref = nome => path.join(REFS, nome);
const SAIDA = path.join(BANCADA, 'saida.png');

// O gcloud falso: devolve um token de mentira e anota a chamada. É um .cmd no
// Windows e um script executável nos outros sistemas, porque o gerador o chama
// por um shell (execSync), como chama o de verdade.
const CHAMADAS = path.join(BANCADA, 'gcloud-chamadas.txt');
const GCLOUD_FALSO = path.join(BANCADA, process.platform === 'win32' ? 'gcloud-falso.cmd' : 'gcloud-falso');
const escreveGcloud = (arquivo, anotacoes, token) => {
  fs.mkdirSync(path.dirname(arquivo), { recursive: true });
  if (process.platform === 'win32') fs.writeFileSync(arquivo, `@echo off\r\necho %*>>"${anotacoes}"\r\necho ${token}\r\n`);
  else fs.writeFileSync(arquivo, `#!/bin/sh\necho "$*" >> '${anotacoes}'\necho ${token}\n`, { mode: 0o755 });
};
escreveGcloud(GCLOUD_FALSO, CHAMADAS, 'token-de-teste');
// 🚨 E o gcloud de VERDADE fora do alcance, e não só detectado depois: o da
// instalação mora no LOCALAPPDATA, que aqui aponta para a bancada, onde uma isca
// anota se foi chamada; e a configuração do gcloud é uma pasta vazia, sem conta
// (com a ordem dos candidatos trocada, a suíte chamaria o gcloud de verdade
// sete vezes antes de reprovar)
const INSTALACAO = path.join(BANCADA, 'appdata');
const ISCA = path.join(BANCADA, 'gcloud-da-instalacao-chamadas.txt');
escreveGcloud(path.join(INSTALACAO, 'Google', 'Cloud SDK', 'google-cloud-sdk', 'bin', process.platform === 'win32' ? 'gcloud.cmd' : 'gcloud'), ISCA, 'token-da-instalacao');
const CONFIG_VAZIA = path.join(BANCADA, 'gcloud-config-vazia');
fs.mkdirSync(CONFIG_VAZIA);
// o gerador também procura o gcloud no PATH, e o PATH desta máquina pode ter o
// de verdade: uma isca na frente do PATH o sombreia, e anota no mesmo arquivo
const NOME_GCLOUD = process.platform === 'win32' ? 'gcloud.cmd' : 'gcloud';
const ISCA_NO_PATH = path.join(BANCADA, 'path-isca');
escreveGcloud(path.join(ISCA_NO_PATH, NOME_GCLOUD), ISCA, 'token-do-path-real');
const PATH_COM_ISCA = `${ISCA_NO_PATH}${path.delimiter}${process.env.PATH || ''}`;
const PROJETO_DE_TESTE = 'projeto-de-teste';
const AMBIENTE = { ...process.env, PATH: PATH_COM_ISCA, GCLOUD_PATH: GCLOUD_FALSO, GOOGLE_CLOUD_PROJECT: PROJETO_DE_TESTE, GEMINI_API_KEY: 'chave-de-teste',
  LOCALAPPDATA: INSTALACAO, CLOUDSDK_CONFIG: CONFIG_VAZIA, CLOUDSDK_CORE_CHECK_GCE_METADATA: 'false' };

// ── Bloco 1 · a linha de comando aceita e recusa o que deve ───

function rodar(...extras) {
  try {
    const saida = execFileSync(process.execPath, [SCRIPT, '--prompt', 'teste', '--saida', SAIDA, '--dry-run', ...extras], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: AMBIENTE,
    });
    return { code: 0, saida };
  } catch (erro) {
    return { code: erro.status ?? 1, saida: `${erro.stdout ?? ''}${erro.stderr ?? ''}` };
  }
}

// o que se exige desta suíte: nada sai da máquina
console.log('Sem terceiro');
const semRef = rodar();
checa('o --dry-run passa com o gcloud falso', semRef.code === 0);
const foiOFalso = fs.existsSync(CHAMADAS) && /auth print-access-token/.test(fs.readFileSync(CHAMADAS, 'utf8')) && !fs.existsSync(ISCA);
checa('quem deu o token foi o gcloud falso da bancada, e não o da instalação', foiOFalso);
checa('o dry-run parou antes de chamar a API', semRef.saida.includes('--dry-run: nada foi gerado e nada foi cobrado.') && !semRef.saida.includes('Gerando...'));
// se não foi o falso que respondeu, para aqui: cada chamada a mais seria ao
// gcloud de verdade (uma regressão custa uma chamada, e não sete)
if (!foiOFalso) {
  console.log('\nFALHA grave: o token não veio do gcloud falso. A suíte para aqui, antes das outras chamadas.');
  escreveRelatorio(process.argv, 'gerar-imagem', casos, { passou: ok, falhou: mau });
  resumoTap(ok, mau);
  fs.rmSync(BANCADA, { recursive: true, force: true });
  process.exit(1);
}
// o .env plantado numa cópia do gerador de dentro da bancada (o RAIZ dele é a
// pasta de cima do script, então ele lê este .env, e nunca o do workspace): o
// ambiente manda sobre o .env, e sem o GCLOUD_PATH no ambiente o do .env vale
const GERADOR_COPIA = path.join(BANCADA, 'scripts', 'gerar-imagem.js');
// a cópia leva junto a fonte do token (scripts/lib/vertex.js), que o gerador pede
// pela raiz dele
const copiaGerador = (destino) => {
  fs.mkdirSync(path.join(path.dirname(destino), 'lib'), { recursive: true });
  fs.copyFileSync(SCRIPT, destino);
  fs.copyFileSync(path.join(RAIZ, 'scripts', 'lib', 'vertex.js'), path.join(path.dirname(destino), 'lib', 'vertex.js'));
};
copiaGerador(GERADOR_COPIA);
const CHAMADAS_ENV = path.join(BANCADA, 'gcloud-do-env-chamadas.txt');
const GCLOUD_DO_ENV = path.join(BANCADA, 'gcloud-do-env', process.platform === 'win32' ? 'gcloud.cmd' : 'gcloud');
escreveGcloud(GCLOUD_DO_ENV, CHAMADAS_ENV, 'token-do-env');
fs.writeFileSync(path.join(BANCADA, 'scripts', '.env'), `GOOGLE_CLOUD_PROJECT=projeto-do-env-plantado\nGCLOUD_PATH=${GCLOUD_DO_ENV}\n`);
const daCopia = (env) => { try { return execFileSync(process.execPath, [GERADOR_COPIA, '--prompt', 'teste', '--saida', SAIDA, '--dry-run'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env }); } catch (e) { return `${e.stdout ?? ''}${e.stderr ?? ''}`; } };
const comEnv = daCopia(AMBIENTE);
checa('o projeto é o do ambiente de teste, e não o do scripts/.env', comEnv.includes(`projeto ${PROJETO_DE_TESTE}`) && !comEnv.includes('projeto-do-env-plantado'));
checa('o GCLOUD_PATH do ambiente manda sobre o do scripts/.env', !fs.existsSync(CHAMADAS_ENV));
const semGcloudNoAmbiente = { ...AMBIENTE }; delete semGcloudNoAmbiente.GCLOUD_PATH;
daCopia(semGcloudNoAmbiente);
checa('o GCLOUD_PATH do scripts/.env vale quando o ambiente não traz o seu (a mensagem de erro manda pôr lá)', fs.existsSync(CHAMADAS_ENV) && !fs.existsSync(ISCA));

// o gcloud do PATH, em qualquer sistema: uma cópia do gerador sem .env, sem
// GCLOUD_PATH, com um gcloud falso na frente do PATH e a isca na instalação
const COPIA_SEM_ENV = path.join(BANCADA, 'so-path', 'scripts', 'gerar-imagem.js');
copiaGerador(COPIA_SEM_ENV);
const CHAMADAS_PATH = path.join(BANCADA, 'gcloud-do-path-chamadas.txt');
const PASTA_DO_PATH = path.join(BANCADA, 'path-falso');
escreveGcloud(path.join(PASTA_DO_PATH, NOME_GCLOUD), CHAMADAS_PATH, 'token-do-path');
const daCopiaSemEnv = (env) => { try { return { code: 0, saida: execFileSync(process.execPath, [COPIA_SEM_ENV, '--prompt', 'teste', '--saida', SAIDA, '--dry-run'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env }) }; } catch (e) { return { code: e.status ?? 1, saida: `${e.stdout ?? ''}${e.stderr ?? ''}` }; } };
const soPath = { ...AMBIENTE, PATH: `${PASTA_DO_PATH}${path.delimiter}${PATH_COM_ISCA}` };
delete soPath.GCLOUD_PATH;
const peloPath = daCopiaSemEnv(soPath);
checa('sem GCLOUD_PATH, o gcloud do PATH dá o token (e vem antes da pasta da instalação)', peloPath.code === 0 && fs.existsSync(CHAMADAS_PATH) && !fs.existsSync(ISCA));
// sem gcloud em lugar nenhum: a recusa diz onde procurou e manda ao guia oficial,
// e não só ao winget. Só se a máquina não tiver o gcloud nos caminhos fixos do
// Windows, que o teste não consegue esconder
const fixosDoWindows = ['C:\\Program Files (x86)\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd', 'C:\\Program Files\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd'];
if (process.platform === 'win32' && fixosDoWindows.some(p => fs.existsSync(p))) {
  console.log('  PULA  sem gcloud em lugar nenhum: esta máquina tem o gcloud em Program Files');
} else {
  const PASTA_VAZIA = path.join(BANCADA, 'path-vazio');
  fs.mkdirSync(PASTA_VAZIA);
  const nenhum = { ...AMBIENTE, PATH: PASTA_VAZIA, LOCALAPPDATA: PASTA_VAZIA };
  delete nenhum.GCLOUD_PATH;
  const semGcloud = daCopiaSemEnv(nenhum);
  checa('sem gcloud em lugar nenhum: recusa dizendo que olhou o PATH e apontando o guia oficial', semGcloud.code !== 0 && /PATH/.test(semGcloud.saida) && /cloud\.google\.com\/sdk/.test(semGcloud.saida) && /macOS/.test(semGcloud.saida));
}
// o gcloud que devolve token vazio para antes do pedido, dizendo o que fazer (a
// fonte única do token, scripts/lib/vertex.js; um Bearer vazio seguiria adiante)
const GCLOUD_VAZIO = path.join(BANCADA, process.platform === 'win32' ? 'gcloud-vazio.cmd' : 'gcloud-vazio');
if (process.platform === 'win32') fs.writeFileSync(GCLOUD_VAZIO, '@echo off\r\necho.\r\n');
else fs.writeFileSync(GCLOUD_VAZIO, '#!/bin/sh\necho\n', { mode: 0o755 });
const roda = (script, extras) => {
  try {
    return { code: 0, saida: execFileSync(process.execPath, [...extras.pre || [], script, ...extras.args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...AMBIENTE, GCLOUD_PATH: GCLOUD_VAZIO } }) };
  } catch (e) { return { code: e.status ?? 1, saida: `${e.stdout ?? ''}${e.stderr ?? ''}` }; }
};
const imagemVazia = roda(SCRIPT, { args: ['--prompt', 'teste', '--saida', SAIDA, '--dry-run'] });
checa('o gcloud que devolve token vazio para o gerar-imagem antes do pedido e diz o que fazer', imagemVazia.code !== 0 && /token vazio/.test(imagemVazia.saida) && /auth login/.test(imagemVazia.saida));
// o gerar-video pede o token pela mesma fonte: com o --confirmo e o token vazio,
// ele para antes do pedido ao Veo (o --dry-run não pede token). A rede fica
// bloqueada pela bancada: se ele seguisse, nada sairia da máquina
const SEM_REDE = path.join(BANCADA, 'sem-rede.cjs');
fs.writeFileSync(SEM_REDE, "globalThis.fetch = async () => { throw new Error('rede bloqueada pela bancada'); };\n");
const videoVazio = roda(path.join(RAIZ, 'scripts', 'gerar-video.js'), { pre: ['--require', SEM_REDE], args: ['--prompt', 'teste', '--saida', path.join(BANCADA, 'v.mp4'), '--confirmo'] });
checa('o gerar-video pede o token pela mesma fonte: token vazio para antes do pedido', videoVazio.code !== 0 && /token vazio/.test(videoVazio.saida) && !/rede bloqueada pela bancada/.test(videoVazio.saida));
console.log('');

const refsAte = n =>
  Array.from({ length: n }, (_, i) => ['--ref', ref(`r${String(i + 1).padStart(2, '0')}.png`)]).flat();

console.log('Linha de comando');
checa('sem ref funciona', rodar().code === 0);
checa('uma ref só funciona', rodar('--ref', ref('r01.png')).code === 0);
checa('14 refs no flash passam (teto exato)', rodar(...refsAte(14)).code === 0);
checa('15 refs no flash são recusadas', rodar(...refsAte(15)).code !== 0);
checa('14 refs no pro passam (teto exato)', rodar('--modelo', 'pro', ...refsAte(14)).code === 0);
checa('15 refs no pro são recusadas', rodar('--modelo', 'pro', ...refsAte(15)).code !== 0);
checa('3 refs no legacy passam (teto exato)', rodar('--modelo', 'legacy', ...refsAte(3)).code === 0);
checa('4 refs no legacy são recusadas', rodar('--modelo', 'legacy', ...refsAte(4)).code !== 0);
checa('arquivo que não é imagem é recusado', rodar('--ref', ref('nota.txt')).code !== 0);
checa('ref inexistente é recusada', rodar('--ref', ref('nao-existe.png')).code !== 0);
checa('.webp é aceito', rodar('--ref', ref('foto.webp')).code === 0);

const recusa = rodar(...refsAte(15));
checa('o erro do teto diz o número e o limite', /15/.test(recusa.saida) && /14/.test(recusa.saida));

// ── Bloco 2 · o corpo do pedido sai como deve ─────────────────
//
// Carrega o script como módulo, trocando a chamada de `main()` por um export.
// É a única forma de olhar o corpo sem mandar nada para a API.

const sonda = path.join(BANCADA, 'sonda.cjs');
fs.writeFileSync(
  sonda,
  fs
    .readFileSync(SCRIPT, 'utf8')
    .replace(/main\(\)\.catch[\s\S]*$/, 'module.exports = { montarCorpo, parseArgs, MAX_REFS, MIME_POR_EXT };')
);
const { montarCorpo, parseArgs, MAX_REFS, MIME_POR_EXT } = createRequire(import.meta.url)(sonda);

const args = parseArgs([
  'node', SCRIPT,
  '--prompt', 'a pessoa da imagem 1 no cenário da imagem 2',
  '--ref', ref('r01.png'),
  '--ref', ref('foto.webp'),
  '--ref', ref('r03.png'),
  '--saida', SAIDA,
]);
const partes = montarCorpo(args).contents[0].parts;
const b64 = nome => fs.readFileSync(ref(nome)).toString('base64');

console.log('\nCorpo do pedido');
checa('3 imagens + 1 texto', partes.length === 4);
checa('o texto é a ÚLTIMA parte', partes[3]?.text === 'a pessoa da imagem 1 no cenário da imagem 2');
checa('as imagens vêm antes do texto', partes.slice(0, 3).every(p => p.inlineData?.data));
checa('ORDEM preservada: 1ª é a 1ª da linha', partes[0]?.inlineData?.data === b64('r01.png'));
checa('ORDEM preservada: 2ª é a 2ª da linha', partes[1]?.inlineData?.data === b64('foto.webp'));
checa('ORDEM preservada: 3ª é a 3ª da linha', partes[2]?.inlineData?.data === b64('r03.png'));
checa('mime do .png', partes[0]?.inlineData?.mimeType === 'image/png');
checa('mime do .webp não mente mais', partes[1]?.inlineData?.mimeType === 'image/webp');
checa('mime do .jpg é image/jpeg', MIME_POR_EXT['.jpg'] === 'image/jpeg');

const soTexto = montarCorpo(parseArgs(['node', SCRIPT, '--prompt', 'sem ref', '--saida', SAIDA]));
checa('sem ref o corpo tem só o texto', soTexto.contents[0].parts.length === 1);

const config = montarCorpo(args).generationConfig;
checa('generationConfig intacto', config.responseModalities[0] === 'IMAGE' && config.imageConfig.aspectRatio === '4:5');

const virgula = parseArgs(['node', SCRIPT, '--prompt', 'p', '--ref', `${ref('r01.png')},${ref('r02.png')}`, '--saida', SAIDA]);
checa('--ref com vírgula vira duas refs', virgula.refs.length === 2);

console.log('\nTetos');
checa('teto do flash é 14 (doc oficial)', MAX_REFS.flash === 14);
checa('teto do pro é 14 (doc oficial)', MAX_REFS.pro === 14);
checa('teto do legacy é conservador', MAX_REFS.legacy === 3);

// ── Bloco 3 · o personagem ────────────────────────────────────
//
// O `--personagem <pasta>` põe as referências da pasta na frente, em ordem de
// nome, e o prompt base antes da cena. Com a ordem trocada sai um personagem
// plausível e errado, sem erro nenhum: o mesmo defeito caro da ordem das refs.
// A pasta aqui é uma fixture neutra da bancada.

console.log('\nPersonagem');
const PERSONAGEM = path.join(BANCADA, 'personagem');
const P_REFS = path.join(PERSONAGEM, 'referencias');
fs.mkdirSync(P_REFS, { recursive: true });
// criadas fora da ordem de nome, de propósito: a ordem tem de vir do nome
for (const nome of ['03-composicao.png', '01-ficha.png', '02-rosto.webp']) {
  fs.writeFileSync(path.join(P_REFS, nome), Buffer.concat([PNG_MAGICO, Buffer.from(`canonica-${nome}`)]));
}
fs.writeFileSync(path.join(P_REFS, 'notas.txt'), 'não é imagem e não entra');
const CANONICAS = ['01-ficha.png', '02-rosto.webp', '03-composicao.png'].map(n => path.join(P_REFS, n));
const BASE = 'CHARACTER: a round orange mascot with a blue cap (image 1 rules, image 2 face, image 3 composition).';
fs.writeFileSync(path.join(PERSONAGEM, 'prompt-base.md'), `${BASE}\n`);

const ler = argv => {
  try { return parseArgs(['node', SCRIPT, ...argv]); } catch (erro) { return { erro: erro.message }; }
};
const comP = ler(['--personagem', PERSONAGEM, '--prompt', 'SCENE: it waves.', '--ref', ref('r01.png'), '--saida', SAIDA]);
checa('--personagem <pasta> é aceito', !comP.erro);
if (!comP.erro) {
  const pp = montarCorpo(comP).contents[0].parts;
  const b64Abs = arquivo => fs.readFileSync(arquivo).toString('base64');
  checa('--personagem: 3 da pasta + a --ref + o texto (o .txt da pasta não entra)', pp.length === 5);
  checa('--personagem: a 1ª é a 01- da pasta', pp[0]?.inlineData?.data === b64Abs(CANONICAS[0]));
  checa('--personagem: a 2ª é a 02- da pasta, com o mime dela', pp[1]?.inlineData?.data === b64Abs(CANONICAS[1]) && pp[1]?.inlineData?.mimeType === 'image/webp');
  checa('--personagem: a 3ª é a 03- da pasta', pp[2]?.inlineData?.data === b64Abs(CANONICAS[2]));
  checa('--personagem: a --ref da linha vem depois das da pasta', pp[3]?.inlineData?.data === b64('r01.png'));
  const texto = pp[4]?.text || '';
  checa('--personagem: o texto começa pelo prompt base', texto.startsWith(BASE));
  checa('--personagem: e termina pela cena escrita no --prompt', texto.trimEnd().endsWith('SCENE: it waves.'));
}
const semCena = ler(['--personagem', PERSONAGEM, '--saida', SAIDA]);
checa('--personagem sem --prompt recusa pedindo a cena', /faltou a cena/.test(semCena.erro || ''));
const depois = ler(['--prompt', 'SCENE: it waves.', '--saida', SAIDA, '--personagem', PERSONAGEM]);
checa('--personagem vale em qualquer posição da linha', !depois.erro && depois.refs?.length === 3 && depois.refs[0] === CANONICAS[0]);
const semP = ler(['--prompt', 'SCENE', '--saida', SAIDA]);
checa('sem --personagem nada muda: nenhuma ref e o prompt cru', semP.refs?.length === 0 && semP.prompt === 'SCENE');
const semPasta = ler(['--personagem', '--prompt', 'x', '--saida', SAIDA]);
checa('--personagem sem a pasta recusa e diz que pede a pasta', /pede a pasta/.test(semPasta.erro || ''));
const inexistente = ler(['--personagem', path.join(BANCADA, 'nao-existe'), '--prompt', 'x', '--saida', SAIDA]);
checa('pasta de personagem inexistente é recusada', /não existe/.test(inexistente.erro || ''));
const SEM_BASE = path.join(BANCADA, 'personagem-sem-base');
fs.mkdirSync(path.join(SEM_BASE, 'referencias'), { recursive: true });
fs.copyFileSync(CANONICAS[0], path.join(SEM_BASE, 'referencias', '01-ficha.png'));
const semBase = ler(['--personagem', SEM_BASE, '--prompt', 'x', '--saida', SAIDA]);
checa('sem o prompt-base.md, recusa dizendo qual arquivo falta', /prompt-base\.md/.test(semBase.erro || ''));
const SEM_REFS = path.join(BANCADA, 'personagem-sem-refs');
fs.mkdirSync(path.join(SEM_REFS, 'referencias'), { recursive: true });
fs.writeFileSync(path.join(SEM_REFS, 'prompt-base.md'), BASE);
const semRefs = ler(['--personagem', SEM_REFS, '--prompt', 'x', '--saida', SAIDA]);
checa('sem imagem em referencias/, recusa dizendo onde falta', /referencias/.test(semRefs.erro || ''));
// as refs da pasta contam no teto do modelo: no legacy (3), a pasta já enche
const tetoP = (() => {
  try {
    execFileSync(process.execPath, [SCRIPT, '--personagem', PERSONAGEM, '--prompt', 'x', '--ref', ref('r01.png'), '--modelo', 'legacy', '--saida', SAIDA, '--dry-run'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: AMBIENTE });
    return 0;
  } catch (e) { return e.status ?? 1; }
})();
checa('as refs do personagem contam no teto do modelo (3 + 1 no legacy é recusado)', tetoP !== 0);
const okP = rodar('--personagem', PERSONAGEM);
checa('--personagem passa no --dry-run de ponta a ponta', okP.code === 0 && okP.saida.includes('01-ficha.png'));

// ── Fecho ─────────────────────────────────────────────────────

fs.rmSync(BANCADA, { recursive: true, force: true });

console.log(`\n${ok + mau} casos · ${ok} passaram · ${mau} reprovaram`);
escreveRelatorio(process.argv, 'gerar-imagem', casos, { passou: ok, falhou: mau });
resumoTap(ok, mau);
process.exit(mau ? 1 : 0);
