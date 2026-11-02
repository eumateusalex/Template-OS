// A régua das ferramentas da /mograph. Cada caso planta um defeito e confere que
// a régua certa reprova, e só ela; a peça boa passa em tudo. Sem rede.
//
//   node .claude/skills/mograph/ferramentas/teste.mjs
//
// 0. montar-puro.mjs; curvas.js (as 17 vão de 0 a 1, os picos medidos); ativos.py (o 3D
//    recortado em WebM com alfa, o som com o pico, o nome novo); as ferramentas pela junção
// 1. plano.mjs: o plano bom passa; cada defeito (leitura, câmera sem motivo, tipo
//    errado, buraco, componente recusado, interface sem a escolha dele, frase sem
//    cena) reprova sozinho; os avisos de estilo não reprovam; a página e o importar
// 2. regua-direcao.mjs: curvas (e as medidas que passam do ponto), recusados,
//    transições, parado (vídeo sintético; a régua inteira no teste-parado.mjs), zona,
//    tela e ofício (página no navegador)
// 3. biblioteca.mjs: o catálogo da skill passa; estado errado, recusa sem frase,
//    regra e item de registro que não existem reprovam; recusar e indice
// 4. prancha.mjs: 3 direções com uma recomendada passam; 2 direções e nenhuma
//    recomendada reprovam
// 5. montar-falado.mjs: a peça sai do modelo da /cortes com o plano e as cenas;
//    a cena de animação sem script reprova; no navegador, a meia tela põe a
//    câmera no cartão e a tela cheia esconde a câmera e a legenda
// 6. as suítes próprias, as da lista SUITES logo abaixo
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { conferirPlano, preencherDoCorte, tabela, pagina, importar, tempoMinimo } from './plano.mjs';
import { curvas, recusados, transicoes, paradoDoPlano, zona, tela, ledgerDoPlano, somDaPeca, estimulo, eventosDaPeca, recusasDaMarca } from './regua-direcao.mjs';
import { MARCA_A, tokensDe, raizCom, moldeComoMarca } from '../../../../scripts/marca/raiz-de-prova.mjs';
import { MENSAGEM } from '../../../../scripts/marca/marca.mjs';
import { conferirCatalogo, recusar, indice } from './biblioteca.mjs';
import { montarPrancha } from './prancha.mjs';
import { montarFalado } from './montar-falado.mjs';
import { abrirNavegador, faltaPlaywright } from './navegador.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
// as suítes das ferramentas que têm teste próprio (a seção 6 roda cada uma e soma a conta)
const SUITES = ['teste-parado.mjs', 'teste-bordas.mjs', 'teste-cor.mjs', 'teste-cor-sem-mundo.test.mjs', 'teste-curvas.mjs', 'teste-plano-extra.mjs', 'teste-cromo.mjs', 'teste-tela.mjs', 'teste-excecoes.mjs', 'teste-som-do-puro.mjs', 'teste-falado-extra.mjs', 'teste-editavel.mjs', 'teste-ativos.test.mjs', 'teste-linguagem.mjs', 'teste-reguas-linguagem.mjs', 'teste-saber.test.mjs', 'teste-kit.test.mjs', 'teste-regua-manual.test.mjs', 'teste-ios-vivo.test.mjs'];
const CATALOGO = JSON.parse(readFileSync(join(AQUI, '..', 'biblioteca', 'catalogo.json'), 'utf8'));
// o catálogo do template sai sem decisão; a régua dos recusados se prova com uma recusa plantada numa cópia
const CATALOGO_REC = recusar(JSON.parse(JSON.stringify(CATALOGO)), 'pessoa-recortada-do-fundo-real',
  { frase: '<a frase da recusa plantada>', procura: ['remove-background', 'removeBackground', 'rembg'] });
let testes = 0, falhas = 0;

{ const falta = faltaPlaywright(); if (falta) { console.error(falta); process.exit(2); } }
const ok = (cond, msg) => { testes++; console.log(`${cond ? 'ok  ' : 'FALHA'} ${msg}`); if (!cond) falhas++; };
const tmp = mkdtempSync(join(tmpdir(), 'mograph-teste-'));
// o modo falado só roda dentro do workspace: a peça falada do teste nasce em rascunho/ e sai no fim
const RAIZ = join(AQUI, '..', '..', '..', '..');
const tmpRaiz = mkdtempSync(join(RAIZ, 'rascunho', '.mograph-teste-'));
// a limpeza no fim de qualquer saída: com ela só no fim do arquivo, a suíte que caía no meio deixava a
// pasta no rascunho. O catch é a saída que já vai embora: nada a avisar
process.on('exit', () => { for (const p of [tmp, tmpRaiz]) try { rmSync(p, { recursive: true, force: true }); } catch { /* saindo */ } });
const so = (r) => [...new Set(r.erros.map((e) => e.regra))].sort().join(',');

// ─── 0b · o montador do puro ─────────────────────────────────────────────────
// a página do puro sai do modelo dela com tudo embutido: o plano vira window.PLANO, a letra da
// prancha vira window.DIR, e todo script local entra no lugar da tag; o _vendor fica por junção
{
  const { montarPuro } = await import('./montar-puro.mjs');
  const pp = join(tmp, 'puro'); mkdirSync(join(pp, 'fonte'), { recursive: true }); mkdirSync(join(pp, 'ativos'), { recursive: true });
  writeFileSync(join(pp, 'plano.json'), JSON.stringify({ nome: 'p', cenas: [] }));
  writeFileSync(join(pp, 'cena.js'), 'window.CENA_OK = 1; // </script> dentro do código');
  writeFileSync(join(pp, 'ativos', 'colmeia.js'), 'window.COLMEIA = {};');
  writeFileSync(join(pp, 'fonte', 'pagina.html'), '<html><head><script src="_vendor/gsap.min.js"></script><script src="plano.js"></script><script src="direcao.js"></script><script src="ativos/colmeia.js"></script></head><body><script src="cena.js"></script></body></html>');
  montarPuro(pp, { direcao: 'B' });
  const h = readFileSync(join(pp, 'index.html'), 'utf8');
  ok(h.includes('window.PLANO = {"nome":"p"') && h.includes('window.DIR = "B"') && h.includes('window.COLMEIA') && h.includes('window.CENA_OK') && h.includes('<\\/script> dentro') && h.includes('src="_vendor/gsap.min.js"') && !/<script src="(?!_vendor\/|_marca\/)/.test(h),
    'montar-puro: o plano, a letra e os scripts locais entram embutidos, e o _vendor fica por arquivo');
  writeFileSync(join(pp, 'fonte', 'pagina.html'), '<html><body><script src="falta.js"></script></body></html>');
  let erroPuro = ''; try { montarPuro(pp, {}); } catch (e) { erroPuro = e.message; }
  ok(/falta\.js/.test(erroPuro), `montar-puro: o script que não existe reprova com o nome dele (${erroPuro || 'passou'})`);
}

// ─── 0c · as curvas medidas e os ativos ──────────────────────────────────────
// as 17 curvas começam em 0 e terminam em 1; as que passam do ponto passam o que a curva promete
// (a batida 1,11, a mola tarde 1,06, o quique 1,47, o cartão 1,174), e as outras nunca passam nem voltam
{
  const C = (await import('./curvas.js')).default;
  const nomes = Object.keys(C).filter((k) => typeof C[k] === 'function');
  ok(nomes.length === 17 && nomes.every((k) => C[k](0) === 0 && Math.abs(C[k](1) - 1) < 1e-9), `curvas: as 17 vão de 0 a 1 (${nomes.length})`);
  const pico = (f) => Math.max(...Array.from({ length: 1001 }, (_, i) => f(i / 1000)));
  const passam = { batida: 1.11, molaTarde: 1.06, quique: 1.47, cartao: 1.174 };
  ok(Object.entries(passam).every(([k, v]) => Math.abs(pico(C[k]) - v) < 0.02), `curvas: o pico das que passam do ponto bate com o prometido (${Object.keys(passam).map((k) => `${k} ${pico(C[k]).toFixed(3)}`).join(', ')})`);
  const monotonas = nomes.filter((k) => !(k in passam));
  ok(monotonas.every((k) => Array.from({ length: 200 }, (_, i) => C[k]((i + 1) / 200) >= C[k](i / 200) - 1e-12).every(Boolean) && pico(C[k]) <= 1 + 1e-9),
    'curvas: as outras treze só sobem e nunca passam de 1');
  ok(nomes.every((k) => C.quadros[k] > 0), 'curvas: toda curva tem os quadros típicos');
}
{
  // ativos.py: o vídeo com alfa sai recortado pelo objeto e em WebM com transparência; o som sai
  // em WAV com o pico medido; o mesmo pedido não duplica, e o arquivo diferente ganha nome novo
  const raiz = join(tmp, 'pacote'); const peca = join(tmp, 'peca-ativos');
  mkdirSync(join(raiz, 'Animações 3D'), { recursive: true }); mkdirSync(join(raiz, 'EFEITOS SONOROS', 'PLIM'), { recursive: true });
  const mov = join(raiz, 'Animações 3D', 'quadrado.mov');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=black@0.0:s=640x360:d=1,format=rgba', '-f', 'lavfi', '-i', 'color=c=red:s=100x80:d=1',
    '-filter_complex', '[0][1]overlay=x=300:y=150,format=yuva444p10le', '-c:v', 'prores_ks', '-profile:v', '4444', mov]);
  const wav = join(raiz, 'EFEITOS SONOROS', 'PLIM', 'bip.wav');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono', '-f', 'lavfi', '-i', 'sine=f=1000:d=0.1', '-filter_complex', '[0]atrim=0:0.4[s];[s][1]concat=n=2:v=0:a=1,apad=pad_dur=0.5', wav]);
  const py = (...a) => execFileSync('python', ['-I', join(AQUI, 'ativos.py'), ...a, '--raiz', raiz], { encoding: 'utf8' });
  // o 3D do pacote que não é clip-art se traz recortado, em WebM com transparência
  const r3d = spawnSync('python', ['-I', join(AQUI, 'ativos.py'), 'trazer', 'pacote:Animações 3D/quadrado.mov', peca, '--raiz', raiz], { encoding: 'utf8' });
  ok(r3d.status === 0 && existsSync(join(peca, 'ativos', 'quadrado.webm')), `ativos: o 3D do pacote sai em WebM na pasta da peça (${(r3d.stdout + r3d.stderr).trim().slice(0, 90)})`);
  // a conversão com alfa continua, para o 3D que não é do pacote: o recorte pelo objeto, direto
  const { caixa } = JSON.parse(execFileSync('python', ['-I', '-c', `import sys, json; sys.path.insert(0, r'${AQUI}'); import ativos; print(json.dumps({"caixa": ativos.caixa_do_alfa(r'${mov}')}))`], { encoding: 'utf8' }).trim());
  const [cw, ch] = caixa.split(':').map(Number);
  ok(cw < 640 && ch < 360 && cw >= 100 && ch >= 80, `ativos: o recorte pelo alfa acha o objeto (${caixa} de 640x360)`);
  const som = JSON.parse(py('trazer', 'pacote:EFEITOS SONOROS/PLIM/bip.wav', peca).trim());
  ok(som.arquivo === 'ativos/bip.wav' && Math.abs(som.pico_s - 0.4) < 0.05, `ativos: o som sai em WAV com o pico medido (${som.pico_s} s)`);
  const de_novo = JSON.parse(py('trazer', 'pacote:EFEITOS SONOROS/PLIM/bip.wav', peca).trim());
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'sine=f=440:d=0.6', wav]);
  const outro = JSON.parse(py('trazer', 'pacote:EFEITOS SONOROS/PLIM/bip.wav', peca).trim());
  ok(de_novo.arquivo === 'ativos/bip.wav' && outro.arquivo === 'ativos/bip-2.wav', `ativos: o mesmo pedido não duplica, e o arquivo novo ganha nome novo (${de_novo.arquivo}, ${outro.arquivo})`);
  // o 3D de nome de clip-art (escudo, troféu, foguete, lâmpada) também se traz, mesmo fora do índice: o clip-art só fica fora no emoji e na imagem
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', mov, '-c', 'copy', join(raiz, 'Animações 3D', 'Shield_In.mov')]);
  const pyr = (...a) => spawnSync('python', ['-I', join(AQUI, 'ativos.py'), ...a, '--raiz', raiz], { encoding: 'utf8' });
  const escudo = pyr('trazer', 'pacote:Animações 3D/Shield_In.mov', peca);
  ok(escudo.status === 0 && !/fica fora/.test(escudo.stderr) && existsSync(join(peca, 'ativos', 'shield_in.webm')), `ativos: o escudo 3D não fica fora e se traz (${escudo.stderr.trim().slice(0, 70)})`);
  // no anúncio e no cliente, o som do pacote avisa (só licença clara lá); no orgânico, não
  const anuncio = pyr('trazer', 'pacote:EFEITOS SONOROS/PLIM/bip.wav', peca, '--uso', 'anuncio');
  const organico = pyr('trazer', 'pacote:EFEITOS SONOROS/PLIM/bip.wav', peca);
  ok(anuncio.status === 0 && /licença clara/.test(anuncio.stderr) && organico.status === 0 && !/licença clara/.test(organico.stderr), 'ativos: o som do pacote avisa no anúncio e passa calado no orgânico');
  // a marca pelo nome: a origem do som e o fora do emoji e da imagem (o anotar e o indice usam a mesma)
  const marca = (item) => JSON.parse(execFileSync('python', ['-I', '-c', `import sys, json; sys.path.insert(0, ${JSON.stringify(AQUI)}); import ativos; print(json.dumps(ativos.marcar(json.loads(sys.argv[1]))))`, JSON.stringify(item)], { encoding: 'utf8' }));
  const ma = marca({ tipo: 'som', caminho: 'EFEITOS SONOROS/RISER/MA_Riser_01.wav' }), cu = marca({ tipo: '3d', caminho: 'Animações 3D/Cup_In.mov' }), wa = marca({ tipo: '3d', caminho: 'Animações 3D/Social media/Whatsapp.mov' });
  // o 3D do pacote entra inteiro (a taça e o WhatsApp 3D também); o emoji e a imagem de clip-art ficam fora
  const emojiArte = marca({ tipo: 'emoji', caminho: 'Emojis/foguete.png' }), imagemArte = marca({ tipo: 'imagem', caminho: 'Imagens/trofeu.png' }), imagemBoa = marca({ tipo: 'imagem', caminho: 'Imagens/nuvem.png' });
  ok(ma.origem === 'motion-array' && cu.fora === undefined && wa.fora === undefined && /clip-art/.test(emojiArte.fora || '') && /clip-art/.test(imagemArte.fora || '') && imagemBoa.fora === undefined, `ativos: a origem do som pelo nome (${ma.origem}), a taça e o WhatsApp 3D sem fora, o emoji e a imagem de clip-art fora, a outra imagem não`);
}

// ─── 0 · as ferramentas rodam pela junção ────────────────────────────────────
// A skill também roda chamada por um link (a junção de uma instalação global), e a
// ferramenta chamada assim tem de rodar, não sair com 0 calada. Cada uma, por
// uma junção de verdade, recebe um pedido errado e tem de reprovar e dizer o porquê.
{
  const juncao = join(tmp, 'juncao');
  symlinkSync(AQUI, juncao, 'junction');
  for (const f of ['plano.mjs', 'regua-direcao.mjs', 'biblioteca.mjs', 'prancha.mjs', 'montar-falado.mjs', 'montar-puro.mjs']) {
    const r = spawnSync(process.execPath, [join(juncao, f), 'nada-disso', join(tmp, 'nao-existe')], { encoding: 'utf8' });
    ok(r.status !== 0 && (r.stdout + r.stderr).trim().length > 0, `junção: ${f} chamado pela junção roda e reprova o pedido errado (saída ${r.status})`);
  }
}

// ─── 1 · o plano ─────────────────────────────────────────────────────────────
function puro() {
  return {
    nome: 'teste', modo: 'puro', destino: 'organico', fps: 30, duracao: 12,
    filme: 'o atendimento que demora perde o cliente',
    cenas: [
      { id: 'S01', de: 0, ate: 3, tipo: 'texto', funcao: 'HOOK', mensagem: 'a perda', entende: 'perco cliente', visual: 'a mensagem sem resposta', camera: 'PARADA', motivo: '', texto_tela: 'sem resposta', componente: 'frase-que-sobe-da-linha', texto_inteiro_em: 0.6, saida: 'y-' },
      { id: 'S02', de: 3, ate: 9, tipo: 'objeto', funcao: 'PROBLEM', mensagem: 'a espera', entende: 'ninguém respondeu', visual: 'o relógio', camera: 'EMPURRA', motivo: 'o tempo passando importa', texto_tela: '2 horas', componente: '', saida: 'y-' },
      { id: 'S03', de: 9, ate: 12, tipo: 'grafico', funcao: 'CTA', mensagem: 'a saída', entende: 'tem jeito', visual: 'a resposta chegando', camera: 'PARADA', motivo: '', texto_tela: 'responda em 1 minuto', componente: '', saida: 'z+' }
    ]
  };
}
const ctx = { catalogo: CATALOGO_REC };
let r = conferirPlano(puro(), ctx);
ok(r.erros.length === 0, `plano bom passa (erros: ${so(r) || 'nenhum'})`);
// o conferirPlano soma as contas do plano-extra.mjs (a régua inteira no teste-plano-extra.mjs)
{
  const p = puro(); p.cenas[1].ate = 7; p.cenas[2].de = 7;
  const rx = conferirPlano(p, ctx);
  // o teto do CTA é calibragem (excecoes.mjs): avisa sem a exceção e se cala com ela
  ok(so(rx) === '' && rx.avisos.some((a) => a.regra === 'cta'), `plano-extra: o CTA com 5 s de 12 s avisa pelo conferirPlano, sem reprovar (${so(rx) || 'nenhum'})`);
  const pe = puro(); pe.cenas[1].ate = 7; pe.cenas[2].de = 7; pe.excecoes = [{ regra: 'cta', motivo: 'o convite de três batidas' }];
  const re = conferirPlano(pe, ctx);
  ok(!re.avisos.some((a) => a.regra === 'cta') && re.aceitos.some((a) => a.regra === 'cta'), 'plano-extra: a exceção escrita cala o aviso do CTA e fica como aceita');
  const ps = puro(); ps.excecoes = [{ regra: 'cta' }];
  ok(conferirPlano(ps, ctx).erros.some((e) => e.regra === 'excecoes'), 'plano-extra: a exceção sem motivo reprova pelo conferirPlano');
  const pf = puro(); pf.formato = 'nao-existe';
  ok(so(conferirPlano(pf, ctx)) === 'formato', 'plano-extra: o formato fora do formatos.json da /video reprova pelo conferirPlano');
}

let p = puro(); p.cenas[2].texto_tela = 'responda o seu cliente em um minuto de verdade';
r = conferirPlano(p, ctx);
ok(so(r) === 'leitura', `texto de 46 letras em 3 s reprova só a leitura (${so(r)})`);

p = puro(); p.cenas[1].motivo = '';
r = conferirPlano(p, ctx);
ok(so(r) === 'camera', `câmera que empurra sem motivo reprova só a câmera (${so(r)})`);

p = puro(); p.cenas[0].tipo = 'meia-tela';
r = conferirPlano(p, ctx);
ok(so(r) === 'tipo', `tipo do falado no motion puro reprova só o tipo (${so(r)})`);

p = puro(); p.cenas[1].de = 3.5;
r = conferirPlano(p, ctx);
ok(so(r) === 'soma', `buraco de 0,5 s entre cenas reprova só a soma (${so(r)})`);

p = puro(); p.cenas[1].componente = 'pessoa-recortada-do-fundo-real';
r = conferirPlano(p, ctx);
ok(so(r) === 'componente', `componente recusado reprova só o componente (${so(r)})`);

p = puro(); p.cenas[1].funcao = 'ENFEITE';
r = conferirPlano(p, ctx);
ok(so(r) === 'funcao', `função fora das quinze reprova só a função (${so(r)})`);

// o teto de palavras: 4 com voz; no puro sem voz a tela carrega a frase, e o teto é 8
p = puro(); p.duracao = 12; p.cenas[2].ate = 12; p.cenas[2].texto_tela = 'nenhum deles te avisa quando perde';
const avPal = (x) => conferirPlano(x, ctx).avisos.filter((a) => a.regra === 'palavras').length;
const comVoz = avPal(p); p.voz = false; const semVoz = avPal(p);
p.cenas[2].texto_tela = 'o cliente que manda mensagem de noite não volta'; const semVozLonga = avPal(p);
ok(comVoz === 1 && semVoz === 0 && semVozLonga === 1, `palavras: 6 avisam com voz, passam sem voz, e 9 sem voz avisam (${comVoz}, ${semVoz}, ${semVozLonga})`);

ok(Math.abs(tempoMinimo('no ar em até 24 horas') - (21 / 17 + 0.5)) < 1e-9 && tempoMinimo('oi') === 1.2,
  `tempo de leitura: 21 letras pedem ${tempoMinimo('no ar em até 24 horas').toFixed(3)} s; texto curto tem o piso de 1,2 s`);

const dados = { END: 10, fps: 30, frases: [
  { frase: 1, texto: 'você perde cliente sem perceber', t_de: 0.05, t_ate: 3.0 },
  { frase: 2, texto: 'a mensagem chega às nove da noite', t_de: 3.1, t_ate: 6.4 },
  { frase: 3, texto: 'e ninguém responde até o outro dia', t_de: 6.5, t_ate: 9.2 }
] };
function falado() {
  return {
    nome: 'teste-falado', modo: 'falado', destino: 'organico', fps: 30, filme: 'x', interface_aprovada: false,
    cenas: [
      { id: 'S01', frase: 1, tipo: 'legenda', funcao: 'HOOK', mensagem: 'a', entende: 'a', visual: 'o rosto', camera: 'PARADA', motivo: '', texto_tela: '', componente: '', saida: '' },
      { id: 'S02', frase: 2, tipo: 'meia-tela', funcao: 'PROBLEM', mensagem: 'b', entende: 'b', visual: 'o celular às 21h', camera: 'PARADA', motivo: '', texto_tela: '21h', componente: 'celular-que-chega-e-pousa', saida: 'y-' },
      { id: 'S03', frase: 3, tipo: 'tela-cheia', funcao: 'TENSION', mensagem: 'c', entende: 'c', visual: 'a conversa parada', camera: 'EMPURRA', motivo: 'o silêncio pesa', texto_tela: 'sem resposta', componente: '', saida: 'y-' }
    ]
  };
}
let f = preencherDoCorte(falado(), dados);
ok(f.cenas[1].de === 3.1 && f.cenas[1].ate === 6.5 && f.cenas[2].ate === 10 && f.cenas[0].fala.startsWith('você'),
  `preencher: a cena vai do começo da frase ao começo da seguinte, a última até o fim (S02 ${f.cenas[1].de}–${f.cenas[1].ate}, S03 até ${f.cenas[2].ate})`);
r = conferirPlano(f, { ...ctx, dados });
ok(r.erros.length === 0, `falado bom passa (erros: ${so(r) || 'nenhum'})`);

f = preencherDoCorte(falado(), dados); f.cenas.pop();
r = conferirPlano(f, { ...ctx, dados });
ok(so(r) === 'cobertura', `frase 3 sem cena reprova só a cobertura (${so(r)})`);

f = preencherDoCorte(falado(), dados); f.cenas[1].tipo = 'legenda-interface';
r = conferirPlano(f, { ...ctx, dados });
ok(so(r) === 'interface', `interface sobre a câmera sem a escolha dele reprova (${so(r)})`);
f.interface_aprovada = true;
r = conferirPlano(f, { ...ctx, dados });
ok(r.erros.length === 0, `com "interface_aprovada", a mesma cena passa (${so(r) || 'nenhum'})`);

f = preencherDoCorte(falado(), dados); f.cenas[0].tipo = 'tela-cheia'; f.cenas[0].texto_tela = 'perde cliente';
f.cenas[1].texto_tela = 'a mensagem das nove da noite';
r = conferirPlano(f, { ...ctx, dados });
const av = r.avisos.map((a) => a.regra).sort().join(',');
ok(r.erros.length === 0 && /gancho/.test(av) && /palavras/.test(av),
  `gancho sem o rosto e texto de 6 palavras são avisos, não erros (avisos: ${av}; erros: ${so(r) || 'nenhum'})`);

const t = tabela(preencherDoCorte(falado(), dados));
ok(t.includes('| S02 |') && t.includes('meia-tela') && t.split('\n').length >= 5, 'tabela: uma linha por cena, com o tipo');

const html = pagina(preencherDoCorte(falado(), dados));
ok(html.includes('a mensagem chega às nove da noite') && html.includes('value="tela-cheia"') && html.includes('plano-ajustado.json'),
  'página: cada frase, os tipos para escolher e o botão que baixa o plano');
const ajustado = preencherDoCorte(falado(), dados); ajustado.cenas[1].tipo = 'tela-cheia'; ajustado.cenas[1].de = 99; ajustado.cenas[1].porque = 'ele pediu';
ajustado.cenas[1].ate = 99; ajustado.cenas[1].frase = 3; ajustado.cenas[1].fala = 'X';
const imp = importar(preencherDoCorte(falado(), dados), ajustado);
ok(imp.cenas[1].tipo === 'tela-cheia' && imp.cenas[1].porque === 'ele pediu' && imp.cenas[1].de === 3.1 && imp.cenas[1].ate === 6.5
  && imp.cenas[1].frase === 2 && imp.cenas[1].fala.startsWith('a mensagem'),
  'importar: entra o que ele pode mudar (tipo, porquê); o tempo, a frase e a fala não mudam pela página');
ok(t.split('\n')[3].startsWith('| S02 | 3.1–6.5 s | a mensagem chega'), 'tabela: o tempo e a fala na coluna certa');

f = preencherDoCorte(falado(), dados); f.cenas[0].texto_tela = 'perde cliente';
r = conferirPlano(f, { ...ctx, dados });
ok(so(r) === 'texto_tela', `falado: texto na tela numa cena de legenda reprova, porque não aparece (${so(r)})`);
f = preencherDoCorte(falado(), dados); f.cenas[1].transicao = 'curva'; f.cenas[2].saida = 'x+';
r = conferirPlano(f, { ...ctx, dados });
ok(so(r) === 'transicao', `falado: o plano não promete costura que o motor não faz (${so(r)})`);
// o zoom-dentro (do rosto para a tela cheia) e o flash (um por peça) são costuras do motor
const comTransicoes = () => {
  const t = preencherDoCorte(falado(), dados);
  Object.assign(t.cenas[0], { transicao: 'flash' });
  Object.assign(t.cenas[1], { tipo: 'legenda', texto_tela: '', componente: '', transicao: 'zoom-dentro', saida: 'z+' });
  return t;
};
f = comTransicoes();
r = conferirPlano(f, { ...ctx, dados });
ok(!r.erros.some((e) => e.regra === 'transicao'), `falado: o zoom-dentro do rosto para a tela cheia e um flash passam (${so(r) || 'nenhum'})`);
f = comTransicoes(); Object.assign(f.cenas[1], { tipo: 'tela-cheia', texto_tela: 'x' });
r = conferirPlano(f, { ...ctx, dados });
ok(r.erros.some((e) => e.regra === 'transicao' && /zoom-dentro vai de uma cena com o rosto/.test(e.msg)), `falado: o zoom-dentro que sai de uma tela cheia reprova (${so(r)})`);
f = comTransicoes(); f.cenas[1].transicao = 'flash'; f.cenas[1].saida = 'y-';
r = conferirPlano(f, { ...ctx, dados });
ok(!r.erros.some((e) => /um por peça/.test(e.msg)) && r.avisos.some((a) => a.regra === 'transicao' && /um por peça/.test(a.msg)), `falado: dois flashes na peça avisam, sem reprovar (calibragem: o Nathan usa um por ato) (${so(r)})`);
// a alternância de direção: entre duas telas cheias pelo corte, a de depois entra de lado
const duasCheias = () => {
  const t = preencherDoCorte(falado(), dados);
  Object.assign(t.cenas[1], { tipo: 'tela-cheia', texto_tela: 'nove da noite', componente: '', saida: 'x-' });
  return t;
};
r = conferirPlano(duasCheias(), { ...ctx, dados });
ok(!r.erros.some((e) => e.regra === 'transicao'), `falado: a tela cheia que vai a outra pelo corte sai de lado (x-) (${so(r) || 'nenhum'})`);
f = duasCheias(); f.cenas[1].transicao = 'continuidade';
r = conferirPlano(f, { ...ctx, dados });
ok(r.erros.some((e) => e.regra === 'transicao' && /de lado/.test(e.msg)), `falado: de lado só pelo corte; na continuidade reprova (${so(r)})`);
// o desfoque do zoom-dentro
f = comTransicoes(); f.cenas[1].desfoque = 16;
r = conferirPlano(f, { ...ctx, dados });
ok(!r.erros.some((e) => e.regra === 'transicao'), `falado: o zoom-dentro com 16 px de desfoque passa (${so(r) || 'nenhum'})`);
f = comTransicoes(); f.cenas[1].desfoque = 40;
r = conferirPlano(f, { ...ctx, dados });
ok(r.erros.some((e) => /desfoque do zoom vai de 4 a 24/.test(e.msg)), `falado: o desfoque de 40 px reprova (${so(r)})`);
f = comTransicoes(); f.cenas[0].desfoque = 12;
r = conferirPlano(f, { ...ctx, dados });
ok(r.erros.some((e) => /o desfoque é do zoom-dentro/.test(e.msg)), `falado: o desfoque fora do zoom-dentro reprova (${so(r)})`);
// o zoom de ênfase na câmera do rosto: acima de 1,2× avisa, e a exceção com o motivo cala
const comZoom = (z, extra = {}) => {
  const t = preencherDoCorte(falado(), dados);
  t.cenas[0].zoom = { em: 1.0, escala: 1.4, ancora_y: 1455, volta: 2.5, ...z };
  return Object.assign(t, extra);
};
r = conferirPlano(comZoom({}), { ...ctx, dados });
ok(!r.erros.some((e) => e.regra === 'zoom') && r.avisos.some((a) => a.regra === 'zoom' && /1\.4×/.test(a.msg)), `falado: o zoom de 1,4× avisa, sem reprovar (${so(r) || 'nenhum'})`);
r = conferirPlano(comZoom({}, { excecoes: [{ regra: 'zoom', cena: 'S01', motivo: 'o zoom de ênfase forte, de 1,5 a 1,8' }] }), { ...ctx, dados });
ok(!r.avisos.some((a) => a.regra === 'zoom') && r.aceitos.some((a) => a.regra === 'zoom'), `falado: a exceção com o motivo cala o aviso do zoom (${so(r) || 'nenhum'})`);
r = conferirPlano(comZoom({ escala: 1.15 }), { ...ctx, dados });
ok(!r.erros.some((e) => e.regra === 'zoom') && !r.avisos.some((a) => a.regra === 'zoom'), `falado: o zoom até 1,2× passa calado (${so(r) || 'nenhum'})`);
for (const [z, rx, nome] of [[{ escala: 2.5 }, /escala do zoom/, 'a escala 2,5'], [{ ancora_y: undefined }, /âncora/, 'sem a âncora'], [{ em: 9 }, /fora da cena/, 'fora da cena'], [{ volta: undefined }, /sem a volta/, 'sem a volta antes de uma meia tela']]) {
  r = conferirPlano(comZoom(z), { ...ctx, dados });
  ok(r.erros.some((e) => e.regra === 'zoom' && rx.test(e.msg)), `falado: o zoom ${nome} reprova (${so(r)})`);
}
// o zoom de transição: nasce em 1,5 no quadro do corte e volta em 6 quadros
r = conferirPlano(comZoom({ em: 0.05, escala: 1.5, ancora_y: 900, quadros: 0, volta: 0.05, quadros_volta: 6 }), { ...ctx, dados });
ok(!r.erros.some((e) => e.regra === 'zoom'), `falado: o zoom de transição (quadros 0, a volta no mesmo instante) passa (${so(r) || 'nenhum'})`);
r = conferirPlano(comZoom({ em: 1.0, quadros: 5, volta: 1.1 }), { ...ctx, dados });
ok(r.erros.some((e) => e.regra === 'zoom' && /depois de o zoom chegar/.test(e.msg)), `falado: a volta antes de o zoom chegar reprova (${so(r)})`);
r = conferirPlano(comZoom({ volta: 2.9, quadros_volta: 8 }), { ...ctx, dados });
ok(r.erros.some((e) => e.regra === 'zoom' && /termina dentro da cena/.test(e.msg)), `falado: a volta que passa do fim da cena, antes de uma meia tela, reprova (${so(r)})`);
f = comZoom({ volta: 2.9, quadros_volta: 8 }); f.cenas[1].tipo = 'legenda'; f.cenas[1].texto_tela = ''; f.cenas[1].componente = '';
r = conferirPlano(f, { ...ctx, dados });
ok(!r.erros.some((e) => e.regra === 'zoom'), `falado: a volta que passa do corte para outra cena de rosto cheio passa (${so(r) || 'nenhum'})`);
// dois zooms na cena: o de transição e, depois dele, a aproximação lenta
f = preencherDoCorte(falado(), dados); f.cenas[0].zoom = [{ em: 0.05, escala: 1.5, ancora_y: 900, quadros: 0, volta: 0.05, quadros_volta: 6 }, { em: 1.0, escala: 1.04, ancora_y: 1455, quadros: 18, curva: 'lenta', volta: 1.8 }];
f.excecoes = [{ regra: 'zoom', cena: 'S01', motivo: 'o de transição' }];
r = conferirPlano(f, { ...ctx, dados });
ok(!r.erros.some((e) => e.regra === 'zoom'), `falado: o zoom de transição e a aproximação lenta na mesma cena passam (${so(r) || 'nenhum'})`);
f.cenas[0].zoom[1].em = 0.1;
r = conferirPlano(f, { ...ctx, dados });
ok(r.erros.some((e) => /antes de o anterior acabar/.test(e.msg)), `falado: o segundo zoom antes de o primeiro acabar reprova (${so(r)})`);
f.cenas[0].zoom[1].em = 1.0; f.cenas[0].zoom[1].curva = 'mola';
r = conferirPlano(f, { ...ctx, dados });
ok(r.erros.some((e) => /curva do zoom/.test(e.msg)), `falado: a curva de zoom fora de rapida e lenta reprova (${so(r)})`);
f = preencherDoCorte(falado(), dados); f.cenas[2].zoom = { em: 7, escala: 1.3, ancora_y: 1455 };
r = conferirPlano(f, { ...ctx, dados });
ok(r.erros.some((e) => e.regra === 'zoom' && /tela cheia cobre o rosto/.test(e.msg)), `falado: o zoom numa tela cheia reprova (${so(r)})`);
f = comZoom({ escala: 2.5 }, { excecoes: [{ regra: 'zoom', cena: 'S01', motivo: 'quero' }] });
r = conferirPlano(f, { ...ctx, dados });
ok(r.erros.some((e) => /escala do zoom/.test(e.msg)), `falado: a exceção não cala o limite do zoom (a escala 2,5) (${so(r)})`);
const injetado = preencherDoCorte(falado(), dados); injetado.cenas[0].fala = 'a </script><script>INJETADO()</script> b';
const pgInj = pagina(injetado);
ok((pgInj.match(/<script>/g) || []).length === 1 && !pgInj.includes('INJETADO()</script>'), 'página: o "</script>" num campo não abre outro script');
const fo = falado(); [fo.cenas[0].frase, fo.cenas[2].frase] = [3, 1];
r = conferirPlano(preencherDoCorte(fo, dados), { ...ctx, dados });
ok(so(r) === 'ordem', `cenas fora da ordem das frases reprovam só a ordem (${so(r)})`);
r = conferirPlano(falado(), ctx);
ok(so(r).includes('tempo') && !so(r).includes('leitura'), `falado sem os tempos do corte reprova pelo tempo, não passa calado (${so(r)})`);
f = preencherDoCorte(falado(), dados); f.cenas[1].texto_tela = 'a mensagem das nove'; f.cenas[1].ate = +(f.cenas[1].de + 1.6).toFixed(3);
f.cenas[2].de = f.cenas[1].ate;
r = conferirPlano(f, { ...ctx, dados });
ok(so(r) === 'leitura', `falado: a leitura conta o tempo útil, sem a entrada e a saída da cena (${so(r)})`);

// ─── 2 · as réguas de direção ────────────────────────────────────────────────
const peca = join(tmp, 'peca'); mkdirSync(join(peca, 'cenas'), { recursive: true });
writeFileSync(join(peca, 'index.html'), '<script>tl.to(a,{y:0,ease:"expo.out"})</script>');
writeFileSync(join(peca, 'cenas', 'S02.js'), 'tl.to(b,{scale:1,ease:"elastic.out(1,0.3)"})');
r = curvas(peca, { excecoes: [] });
ok(r.erros.length === 1 && /elastic/.test(r.erros[0].msg), `curvas: elastic numa cena reprova (${r.erros.map((e) => e.msg).join('; ')})`);
writeFileSync(join(peca, 'cenas', 'S02.js'), 'tl.to(b,{scale:1,ease:"back.out(1.6)"})');
r = curvas(peca, { excecoes: [] });
ok(r.erros.length === 0 && r.avisos.length === 1, 'curvas: back.out sem motivo é aviso');
r = curvas(peca, { excecoes: [{ curva: 'back.out', onde: 'S02', motivo: 'o celular pousa' }] });
ok(r.erros.length === 0 && r.avisos.length === 0, 'curvas: back.out com o motivo escrito passa');
writeFileSync(join(peca, 'cenas', 'S05.js'), 'tl.to(c,{ease:"back.out(2)"})');
r = curvas(peca, { excecoes: [{ curva: 'back.out', onde: 'S02', motivo: 'o celular pousa' }] });
ok(r.avisos.length === 1 && /S05/.test(r.avisos[0].msg), 'curvas: a exceção da S02 não cobre a S05');
writeFileSync(join(peca, 'cenas', 'S05.js'), '');
writeFileSync(join(peca, 'cenas', 'S06.js'), 'tl.to(c,{scale:1,ease:CURVAS.molaTarde})');
r = curvas(peca, { excecoes: [{ curva: 'back.out', onde: 'S02', motivo: 'o celular pousa' }] });
ok(r.erros.length === 0 && r.avisos.length === 1 && /S06/.test(r.avisos[0].msg) && /molaTarde/.test(r.avisos[0].msg), `curvas: a curva medida que passa do ponto, sem motivo, avisa como o back.out (${r.avisos.map((a) => a.msg).join('; ')})`);
r = curvas(peca, { excecoes: [{ curva: 'back.out', onde: 'S02', motivo: 'o celular pousa' }, { curva: 'molaTarde', onde: 'S06', motivo: 'o selo pousa' }] });
ok(r.avisos.length === 0, 'curvas: com o motivo escrito para a cena, a mola tarde passa');
rmSync(join(peca, 'cenas', 'S06.js'));
rmSync(join(peca, 'cenas', 'S05.js'));
for (const src of ['tl.to(b,{ease:"elastic"})', 'tl.to(b,{ease:"bounce"})', 'tl.to(b,{ease:Elastic.easeOut})', 'CustomBounce.create("x")']) {
  writeFileSync(join(peca, 'cenas', 'S02.js'), src);
  ok(curvas(peca, { excecoes: [] }).erros.length >= 1, `curvas: ${src} reprova`);
}
// as recusas da marca: o bounce e o elastic que ela recusa reprovam firme; os que ela permite só avisam
writeFileSync(join(peca, 'cenas', 'S02.js'), 'tl.to(b,{ease:"elastic.out(1,0.3)"}); tl.to(c,{ease:"bounce.out"})');
r = curvas(peca, { excecoes: [], recusas: ['elastic'] });
ok(r.erros.length === 1 && r.erros[0].recusa === true && /elastic/.test(r.erros[0].msg) && r.avisos.length === 1 && /permite "bounce"/.test(r.avisos[0].msg), `curvas: a marca que recusa só o elastic reprova o elastic e avisa o bounce (${r.erros.map((e) => e.msg).join('; ')} | ${r.avisos.map((a) => a.msg).join('; ')})`);
r = curvas(peca, { excecoes: [], recusas: [] });
ok(r.erros.length === 0 && r.avisos.length === 2, `curvas: a marca sem recusas deixa os dois passarem com aviso (${r.erros.length} erros, ${r.avisos.length} avisos)`);
r = curvas(peca, { excecoes: [] });
ok(r.erros.length === 2 && r.erros.every((e) => e.recusa === true), 'curvas: sem a lista da marca, os dois reprovam firme');
// a lista sai do recusas da marca do workspace; sem marca, as quatro valem e o aviso traz a frase padrão
{
  const t = tokensDe(MARCA_A); t.recusas.$value = ['elastic', 'kicker'];
  const { raiz, fora } = raizCom(t);
  const m = recusasDaMarca({ raiz });
  ok(m.aviso === null && m.curvas.join() === 'elastic,kicker' && m.cromo.includes('kicker') && !m.cromo.includes('contador'), `recusasDaMarca: a lista vem do recusas da marca (${JSON.stringify(m)})`);
  ok(curvas(peca, { excecoes: [], recusas: m.curvas }).erros.length === 1, 'curvas: com as recusas lidas da marca, só o elastic reprova');
  fora();
  for (const [como, tk] of [['faltando', null], ['o molde', moldeComoMarca()]]) {
    const { raiz: r2, fora: f2 } = raizCom(tk);
    const s = recusasDaMarca({ raiz: r2 });
    ok(s.aviso?.includes(MENSAGEM) && s.curvas.join() === 'bounce,elastic' && s.cromo.join() === 'contador,kicker', `recusasDaMarca: com a marca ${como}, as quatro valem e o aviso traz a frase padrão (${s.aviso})`);
    f2();
  }
}
writeFileSync(join(peca, 'cenas', 'S02.js'), '// sem elastic nem bounce aqui, de propósito\n/* nem back */\ntl.to(b,{ease:"expo.out"})');
r = curvas(peca, { excecoes: [] });
ok(r.erros.length === 0 && r.avisos.length === 0, 'curvas: o comentário que cita a regra não reprova');
writeFileSync(join(peca, 'cenas', 'S02.js'), 'tl.to(b,{ease:"back"}); el.style.background = "#fff"');
r = curvas(peca, { excecoes: [] });
ok(r.avisos.length === 1, `curvas: "back" sozinho é back.out e avisa; "background" não (${r.avisos.length} aviso)`);
writeFileSync(join(peca, 'cenas', 'S02.js'), 'tl.to(b,{scale:1,ease:"expo.out"})');

writeFileSync(join(peca, 'cenas', 'S03.js'), '// hyperframes remove-background na gravação');
r = recusados(peca, CATALOGO_REC);
ok(r.erros.length === 1 && /pessoa-recortada/.test(r.erros[0].msg), `recusados: o recorte da pessoa no código reprova (${r.erros.map((e) => e.msg).join('; ')})`);
rmSync(join(peca, 'cenas', 'S03.js'));
ok(recusados(peca, CATALOGO_REC).erros.length === 0, 'recusados: sem o trecho, passa');

const ledger = (tipos) => ({ costuras: tipos.map((tipo, i) => ({ de: `S0${i + 1}`, para: `S0${i + 2}`, t: i + 1, tipo, saida: 'y-', entrada: 'y-' })) });
ok(transicoes(ledger(['corte', 'curva', 'zoom-dentro', 'morph', 'corte'])).erros.length === 0, 'transições: 3 tipos e um morph passam');
ok(transicoes(ledger(['corte', 'curva', 'zoom-dentro', 'zoom-fora'])).erros.length === 1, 'transições: 4 tipos reprovam');
ok(transicoes(ledger(['corte', 'continuidade', 'curva', 'zoom-dentro', 'continuidade'])).erros.length === 0, 'transições: a continuidade não gasta tipo (3 tipos e duas continuidades passam)');
ok(/não existe/.test(transicoes(ledger(['corte', 'continuidadee'])).erros.map((e) => e.msg).join()), 'transições: "continuidadee" reprova como tipo que não existe');
ok(/dissolver/.test(transicoes(ledger(['corte', 'dissolver'])).erros.map((e) => e.msg).join()), 'transições: dissolver reprova');
const esp = ledger(['curva']); esp.costuras[0].entrada = 'y+';
ok(transicoes(esp).erros.length === 1, 'transições: corte na curva com o sentido espelhado reprova (sai y-, entra y+)');
ok(transicoes({ costuras: [{ de: 'S01', para: 'S02', tipo: 'curva', saida: 'y-' }] }).erros.length === 1, 'transições: corte na curva sem a entrada reprova');
const pp = ledger(['curva', 'curva']); pp.costuras[1].saida = 'y+'; pp.costuras[1].entrada = 'y+';
ok(transicoes(pp).avisos.length === 1, 'transições: ida e volta de sentido em dois cortes seguidos é aviso');
const pl = puro(); pl.cenas[0].transicao = 'curva'; pl.cenas[1].transicao = 'zoom-dentro'; pl.cenas[2].entrada = 'z+';
const lg = ledgerDoPlano(pl);
ok(lg.costuras.length === 2 && lg.costuras[0].tipo === 'curva' && lg.costuras[0].entrada === 'y-' && lg.costuras[1].tipo === 'zoom-dentro',
  'transições: as costuras saem do plano (a transição da cena que sai, a entrada da que chega)');

// o som do puro (a E5, calibragem: 5 a 7 famílias, um som por elemento que entra)
{
  const ps = join(tmp, 'som'); mkdirSync(ps, { recursive: true });
  const comSons = (n) => { writeFileSync(join(ps, 'index.html'), `<audio data-papel="trilha" src="t.wav" data-duration="20"></audio>${Array.from({ length: n }, (_, i) => `<audio src="ativos/som${i}-1.wav" data-duration="1"></audio>`).join('')}`); return somDaPeca(ps, { modo: 'puro', duracao: 20 }); };
  let rs = comSons(2);
  ok(rs.erros.length === 1 && /5 a 7/.test(rs.erros[0].msg), `oficio: 2 famílias de som reprovam (${rs.erros.map((e) => e.msg).join('; ')})`);
  rs = comSons(4);
  ok(rs.erros.length === 0 && rs.avisos.length === 1 && /5 a 7/.test(rs.avisos[0].msg), 'oficio: 4 famílias de som avisam (o ofício pede 5 a 7)');
  rs = comSons(6);
  ok(rs.erros.length === 0 && rs.avisos.length === 0, 'oficio: 6 famílias de som passam sem aviso');
  rs = comSons(9);
  ok(rs.erros.length === 0 && rs.avisos.length === 1 && /microanimação/.test(rs.avisos[0].msg), 'oficio: 9 famílias de som avisam (som em toda microanimação)');
}

// o estímulo: no máximo 3 s sem algo novo, o corte de
// cena ou um efeito de som; a legenda contínua é fundo e não conta. Acima de 3 s avisa, acima de 5 reprova
{
  let re = estimulo([1, 2.5, 4], 6);
  ok(re.erros.length === 0 && re.avisos.length === 0, 'estímulo: um evento a cada 1,5 a 2 s passa sem aviso');
  re = estimulo([1, 4.6], 6);
  ok(re.erros.length === 0 && re.avisos.length === 1 && /1,0 a 4,6/.test(re.avisos[0].msg), `estímulo: 3,6 s sem nada novo avisa (${re.avisos.map((a) => a.msg).join('; ')})`);
  re = estimulo([1, 7.2], 8);
  ok(re.erros.length === 1 && /1,0 a 7,2/.test(re.erros[0].msg), `estímulo: 6,2 s sem nada novo reprova (${re.erros.map((e) => e.msg).join('; ')})`);
  re = estimulo([1, 2], 7.5);
  ok(re.erros.length === 1 && /2,0 a 7,5/.test(re.erros[0].msg), 'estímulo: o fim conta (5,5 s do último evento ao fim reprova)');
  re = estimulo([], 4);
  ok(re.erros.length === 1, 'estímulo: sem evento nenhum, a peça de 4 s reprova (não medir não é passar)');
  const pe = join(tmp, 'estimulo'); mkdirSync(pe, { recursive: true });
  writeFileSync(join(pe, 'som.json'), JSON.stringify({ efeitos: [{ arquivo: 'a.wav', acerto: 2.5, db: -10 }, { arquivo: 'b.wav', acerto: 2.52, db: -10 }] }));
  const ev = eventosDaPeca(pe, { modo: 'falado', cenas: [{ id: 'S01', de: 0, ate: 4 }, { id: 'S02', de: 4, ate: 9 }] });
  ok(JSON.stringify(ev) === '[2.5,2.52,4]', `estímulo: no falado os eventos são os efeitos do som.json e os cortes de cena (${JSON.stringify(ev)})`);
  // a troca de enquadramento da /cortes (o punch-in alternado nos cortes da fala, nunca antes do
  // intervalo mínimo) é imagem nova: o corte de 1,8 s cai antes dos 1,5 s e fica seco
  const evc = eventosDaPeca(pe, { modo: 'falado', cenas: [{ id: 'S01', de: 0, ate: 4 }, { id: 'S02', de: 4, ate: 9 }] }, { cortes: [1, 1.8, 3.5], troca_min: 1.5 });
  ok(JSON.stringify(evc) === '[1,2.5,2.52,3.5,4]', `estímulo: no falado a troca de enquadramento da câmera conta, o corte seco não (${JSON.stringify(evc)})`);
  writeFileSync(join(pe, 'index.html'), '<audio data-papel="trilha" src="t.wav" data-start="0" data-duration="20"></audio><audio src="p.wav" data-start="3.2" data-duration="1"></audio>');
  const evp = eventosDaPeca(pe, { modo: 'puro', cenas: [{ id: 'C1', de: 0, ate: 5 }, { id: 'C2', de: 5, ate: 9 }] });
  ok(JSON.stringify(evp) === '[3.2,5]', `estímulo: no puro os eventos são os efeitos do index.html, sem a trilha, e os cortes (${JSON.stringify(evp)})`);
}

const mov = join(tmp, 'mov.mp4'), parado = join(tmp, 'parado.mp4'), deriva = join(tmp, 'deriva.mp4');
const ff = (args) => execFileSync('ffmpeg', ['-nostdin', '-v', 'error', '-y', ...args]);
ff(['-f', 'lavfi', '-i', 'testsrc2=size=270x480:rate=30:duration=8', '-pix_fmt', 'yuv420p', mov]);
// 2 s andando, 5 s congelado no quadro 60, 1 s andando (o select descarta quadro, não repete:
// o congelado se faz com o freezeframes, que precisa de duas entradas)
ff(['-f', 'lavfi', '-i', 'testsrc2=size=270x480:rate=30:duration=8', '-filter_complex', '[0:v]split[a][b];[a][b]freezeframes=first=60:last=209:replace=60', '-pix_fmt', 'yuv420p', parado]);
// a espera com destino: um cartão andando 5 px por segundo sobre fundo claro (uns 3% em 6 s)
ff(['-f', 'lavfi', '-i', 'color=c=0xf5f5f7:s=1080x1920:d=8:r=30', '-f', 'lavfi', '-i', 'color=c=0x0071e3:s=300x300:d=8:r=30',
  '-filter_complex', "[0][1]overlay=x='390+t*5':y='800+t*3'", '-pix_fmt', 'yuv420p', deriva]);
const longo = (r) => Math.max(0, ...(r.trechos || []).map((t) => t.dur));
r = paradoDoPlano(mov, null);
ok(r.erros.length === 0, `parado: vídeo que anda o tempo todo passa (maior trecho parado ${longo(r).toFixed(1)} s)`);
r = paradoDoPlano(parado, null);
ok(r.erros.length === 1 && Math.abs(longo(r) - 5) <= 0.3, `parado: 5 s congelados reprovam (medido ${longo(r).toFixed(1)} s)`);
r = paradoDoPlano(deriva, null);
ok(r.erros.length === 0, `parado: a câmera que anda 3% em 6 s não é quadro parado (maior trecho parado ${longo(r).toFixed(1)} s)`);

const navegador = await abrirNavegador();
try {
  const z = join(tmp, 'zona'); mkdirSync(z, { recursive: true });
  const pag = (top) => `<!doctype html><html><body style="margin:0;width:1080px;height:1920px;position:relative">
    <div style="position:absolute;left:100px;top:${top}px;font-size:60px">texto da cena</div>
    <svg data-zona="livre" style="position:absolute;left:0;top:0" width="1080" height="200"><rect width="1080" height="200" fill="#eee"/></svg></body></html>`;
  writeFileSync(join(z, 'index.html'), pag(600));
  r = await zona(z, { formato: 'reel', navegador, instantes: [0] });
  ok(r.erros.length === 0, `zona: texto em y 600 passa; o desenho decorativo marcado como livre não conta (${r.erros.map((e) => e.msg).join('; ') || 'nenhum'})`);
  writeFileSync(join(z, 'index.html'), pag(1600));
  r = await zona(z, { formato: 'reel', navegador, instantes: [0] });
  ok(r.erros.length === 1, `zona: texto em y 1600 (abaixo de 1540) reprova (${r.erros.map((e) => e.msg).join('; ')})`);
  r = await zona(z, { formato: 'anuncio-reels', navegador, instantes: [0] });
  ok(r.erros.length === 1 && /1248/.test(r.erros[0].msg), 'zona: no anúncio a base é 1248');
  writeFileSync(join(z, 'index.html'), '<!doctype html><html><body style="margin:0;width:1080px;height:1920px;position:relative"><div style="position:absolute;top:800px;left:0;width:1080px;text-align:center;font-size:90px">sem resposta</div></body></html>');
  r = await zona(z, { formato: 'reel', navegador, instantes: [0] });
  ok(r.erros.length === 0, `zona: texto centrado num bloco largo passa (mede a letra, não a caixa) (${r.erros.map((e) => e.msg).join('; ') || 'nenhum'})`);
  // o recorte: só conta a tinta que se vê. Uma janela com overflow hidden; o texto fora da zona
  // (acima de 220 ou abaixo de 1540) e escondido pela janela não conta
  const janela = (topo, base, topTexto) => `<!doctype html><html><body style="margin:0;width:1080px;height:1920px;position:relative">
    <div style="position:absolute;left:100px;top:${topo}px;width:800px;height:${base - topo}px;overflow:hidden">
    <div style="position:absolute;left:0;top:${topTexto}px;font-size:60px">dentro da janela</div></div></body></html>`;
  writeFileSync(join(z, 'index.html'), janela(300, 700, -200));   // o texto rolou para y 100, fora da zona: a janela o esconde inteiro
  r = await zona(z, { formato: 'reel', navegador, instantes: [0] });
  const textoEscondido = r.erros.length === 0;
  writeFileSync(join(z, 'index.html'), janela(1300, 1500, 220));   // o texto vai de 1520 a 1590; a janela o corta em 1500, dentro da zona
  r = await zona(z, { formato: 'reel', navegador, instantes: [0] });
  const parteCortada = r.erros.length === 0;
  writeFileSync(join(z, 'index.html'), janela(600, 1700, 950));   // a janela vai até 1700: o texto se vê abaixo de 1540
  r = await zona(z, { formato: 'reel', navegador, instantes: [0] });
  ok(textoEscondido && parteCortada && r.erros.length === 1, `zona: o texto escondido pelo overflow não conta, a parte cortada não conta, e a parte que se vê fora da zona reprova (${textoEscondido}, ${parteCortada}, ${r.erros.length})`);
  // a timeline registrada aos 600 ms, e o texto que só desce para fora da zona depois de 2 s
  writeFileSync(join(z, 'index.html'), `<!doctype html><html><body style="margin:0;width:1080px;height:1920px;position:relative">
    <div id="t" style="position:absolute;left:100px;top:600px;font-size:60px">desce depois</div>
    <script src="gsap.min.js"></script><script>setTimeout(function () { var tl = gsap.timeline({ paused: true });
    tl.set('#t', { top: 1700 }, 2); tl.set({}, {}, 3); window.__timelines = { main: tl }; }, 600);</script></body></html>`);
  const vendorDoEstudio = join(AQUI, '..', '..', '..', 'video', 'html', '_vendor');
  writeFileSync(join(z, 'gsap.min.js'), readFileSync(join(vendorDoEstudio, 'gsap.min.js')));
  r = await zona(z, { formato: 'reel', navegador });
  ok(r.erros.length === 1 && /desce depois/.test(r.erros[0].msg), `zona: a timeline que chega tarde é medida até o fim (${r.erros.map((e) => e.msg).join('; ') || 'nenhum'})`);
  writeFileSync(join(z, 'index.html'), pag(600));
  r = await zona(z, { formato: 'reel', navegador });
  ok(r.erros.length === 1 && /timeline/.test(r.erros[0].msg), 'zona: sem timeline e sem instantes, nada medido reprova');

  // a legenda que encosta num objeto da cena (a crítica r5: o aro do celular cortava a chave, com a
  // zona verde). O objeto conta mesmo marcado livre quando é matéria (a foto do aparelho)
  const capLegenda = (topoObj, livre) => `<!doctype html><html><body style="margin:0;width:1080px;height:1920px;position:relative">
    <div id="legendas"><div style="position:absolute;left:300px;top:380px;font-size:60px">prévia do link</div></div>
    <div data-materia="celular" ${livre ? 'data-zona="livre"' : ''} style="position:absolute;left:250px;top:${topoObj}px;width:560px;height:900px;background:#222"></div></body></html>`;
  writeFileSync(join(z, 'index.html'), capLegenda(420, true));
  r = await zona(z, { formato: 'reel', navegador, instantes: [0, 0.1, 0.2] });
  ok(r.erros.length === 1 && /encosta em "celular"/.test(r.erros[0].msg), `zona: a legenda coberta pelo objeto (mesmo livre) reprova (${r.erros.map((e) => e.msg).join('; ') || 'nenhum'})`);
  writeFileSync(join(z, 'index.html'), capLegenda(520, true));
  r = await zona(z, { formato: 'reel', navegador, instantes: [0, 0.1, 0.2] });
  ok(r.erros.length === 0, `zona: a legenda longe do objeto passa (${r.erros.map((e) => e.msg).join('; ') || 'nenhum'})`);
  writeFileSync(join(z, 'index.html'), capLegenda(420, false));
  r = await zona(z, { formato: 'reel', navegador, instantes: [0, 0.1] });
  ok(r.erros.length === 0, `zona: o contato de 0,2 s (a cena que sai cruzando a legenda) não reprova (${r.erros.map((e) => e.msg).join('; ') || 'nenhum'})`);
  // a placa do mundo (a foto que cobre o quadro inteiro) é o chão, atrás de
  // tudo como a câmera: não é objeto ao lado da legenda. O objeto grande que não cobre o quadro segue contando
  const capPlaca = (larg, alt) => `<!doctype html><html><body style="margin:0;width:1080px;height:1920px;position:relative">
    <div data-materia="placa" style="position:absolute;left:0;top:0;width:${larg}px;height:${alt}px;background:#c9b49a"></div>
    <div id="legendas"><div style="position:absolute;left:300px;top:380px;font-size:60px">prévia do link</div></div></body></html>`;
  writeFileSync(join(z, 'index.html'), capPlaca(1080, 1920));
  r = await zona(z, { formato: 'reel', navegador, instantes: [0, 0.1, 0.2] });
  ok(r.erros.length === 0, `zona: a placa que cobre o quadro inteiro é o chão e não cobre a legenda (${r.erros.map((e) => e.msg).join('; ') || 'nenhum'})`);
  writeFileSync(join(z, 'index.html'), capPlaca(1000, 1500));
  r = await zona(z, { formato: 'reel', navegador, instantes: [0, 0.1, 0.2] });
  ok(r.erros.length === 1 && /encosta em "placa"/.test(r.erros[0].msg), `zona: o objeto de 72% do quadro sob a legenda segue reprovando (${r.erros.map((e) => e.msg).join('; ') || 'nenhum'})`);

  // os defeitos que um teste a frio plantou e passavam verdes
  const quadro = (corpo) => `<!doctype html><html><body style="margin:0;width:1080px;height:1920px;position:relative">${corpo}</body></html>`;
  // o texto sob data-zona="livre" conta: a isenção não serve de atalho para título fora da zona
  writeFileSync(join(z, 'index.html'), quadro('<div data-zona="livre" style="position:absolute;left:100px;top:60px;font-size:60px">título escondido na isenção</div>'));
  r = await zona(z, { formato: 'reel', navegador, instantes: [0] });
  ok(r.erros.length === 1 && /isenção/.test(r.erros[0].msg), `zona: o texto sob data-zona="livre" fora da zona reprova (${r.erros.map((e) => e.msg).join('; ') || 'nenhum'})`);
  // a forma desenhada conta: o cubo de 1000 px passava em tudo; e o SVG sem id marcado chave não derruba a régua
  writeFileSync(join(z, 'index.html'), quadro('<svg style="position:absolute;left:0;top:0" width="1080" height="1920"><path d="M40 100 L1040 100 L1040 1100 L40 1100 Z" fill="#000"/></svg><svg data-zona="chave" style="position:absolute;left:20px;top:1700px" width="100" height="100"><circle cx="50" cy="50" r="40"/></svg>'));
  let quebrou = '';
  try { r = await zona(z, { formato: 'reel', navegador, instantes: [0] }); } catch (e) { quebrou = e.message; }
  ok(!quebrou && r.erros.some((e) => /forma "path"/.test(e.msg)) && r.erros.some((e) => /forma "svg"|forma "circle"/.test(e.msg)),
    `zona: a forma gigante fora da zona reprova, e o SVG sem id marcado chave reprova sem quebrar a régua (${quebrou || r.erros.map((e) => e.msg).join('; ')})`);
  // o clip-path esconde o que corta: o texto em y 160, fora da zona, sob um inset que só deixa ver de 300 para baixo
  const clip = (inset) => quadro(`<div style="position:absolute;left:100px;top:100px;width:800px;height:600px;clip-path:inset(${inset})"><div style="position:absolute;left:0;top:60px;font-size:60px">atrás do recorte</div></div>`);
  writeFileSync(join(z, 'index.html'), clip('200px 0px 0px 0px'));
  r = await zona(z, { formato: 'reel', navegador, instantes: [0] });
  const clipEsconde = r.erros.length === 0;
  writeFileSync(join(z, 'index.html'), clip('0px 0px 0px 0px'));
  r = await zona(z, { formato: 'reel', navegador, instantes: [0] });
  ok(clipEsconde && r.erros.length === 1, `zona: o texto escondido pelo clip-path não conta, e o mesmo texto visível reprova (${clipEsconde}, ${r.erros.length})`);
  // o título fora da zona por 0,3 s, entre duas amostras de 0,5 s: o passo padrão o pega
  writeFileSync(join(z, 'index.html'), quadro(`<div id="t" style="position:absolute;left:100px;top:600px;font-size:60px">sai por um instante</div>
    <script src="gsap.min.js"></script><script>var tl = gsap.timeline({ paused: true });
    tl.set('#t', { top: 60 }, 1.1); tl.set('#t', { top: 600 }, 1.4); tl.set({}, {}, 3); window.__timelines = { main: tl };</script>`));
  r = await zona(z, { formato: 'reel', navegador });
  ok(r.erros.length === 1 && /um instante/.test(r.erros[0].msg), `zona: o título fora da zona por 0,3 s reprova no passo padrão (${r.erros.map((e) => e.msg).join('; ') || 'nenhum'})`);

  // a tela: a peça contra o plano. Três frases declaradas, uma timeline que as mostra
  const planoTela = { cenas: [
    { id: 'S01', de: 0, ate: 3, texto_tela: 'Seu site some' },
    { id: 'S02', de: 3, ate: 6, texto_tela: 'Peça o Diagnóstico · Link na bio' } ] };
  const pecaTela = (extra) => quadro(`<div id="a" style="position:absolute;left:100px;top:600px;font-size:60px">Seu site some</div>
    <div id="b" style="position:absolute;left:100px;top:800px;font-size:60px;opacity:0">Peça o Diagnóstico</div>
    <div id="c" style="position:absolute;left:100px;top:900px;font-size:40px;opacity:0">Link na bio</div>
    <div data-texto="objeto" style="position:absolute;left:100px;top:1100px;font-size:30px">seunegocio.com.br</div>${extra.html || ''}
    <script src="gsap.min.js"></script><script>var tl = gsap.timeline({ paused: true });
    tl.set('#a', { opacity: 0 }, ${extra.saiA || 3}); tl.set('#b', { opacity: 1 }, 3); tl.set('#c', { opacity: ${extra.opC === undefined ? 1 : extra.opC} }, 3.5);
    ${extra.js || ''} tl.set({}, {}, 6); window.__timelines = { main: tl };</script>`);
  const rodaTela = async (extra) => { writeFileSync(join(z, 'index.html'), pecaTela(extra)); return tela(z, planoTela, { formato: 'reel', navegador }); };
  r = await rodaTela({});
  ok(r.erros.length === 0, `tela: as frases declaradas, inteiras o tempo de leitura, e o texto do objeto fora da conta passam (${r.erros.map((e) => e.msg).join('; ') || 'nenhum'})`);
  r = await rodaTela({ html: '<div style="position:absolute;left:100px;top:1200px;font-size:40px">grátis hoje</div>' });
  ok(r.erros.length === 1 && /grátis hoje/.test(r.erros[0].msg), `tela: o texto na tela fora do texto_tela reprova (${r.erros.map((e) => e.msg).join('; ') || 'nenhum'})`);
  r = await rodaTela({ saiA: 0.8 });
  ok(r.erros.length === 1 && /Seu site some/.test(r.erros[0].msg) && /leitura/.test(r.erros[0].msg), `tela: a frase que sai antes do tempo de leitura reprova (${r.erros.map((e) => e.msg).join('; ') || 'nenhum'})`);
  r = await rodaTela({ opC: 0 });
  ok(r.erros.length === 1 && /Link na bio/.test(r.erros[0].msg), `tela: o convite declarado que nunca aparece reprova (${r.erros.map((e) => e.msg).join('; ') || 'nenhum'})`);

  // o ofício: a imagem por cena, as curvas da timeline e o som do puro (oficio.md § 5 e o manual)
  writeFileSync(join(z, 'curvas.js'), readFileSync(join(AQUI, 'curvas.js')));
  const planoOf = { modo: 'puro', duracao: 12, cenas: [{ id: 'S01', de: 0, ate: 6 }, { id: 'S02', de: 6, ate: 12 }, { id: 'S03', de: 12, ate: 12.5 }] };
  // seis movimentos; "variadas" usa três curvas do curvas.js e entra por escala, "chapadas" é tudo fade com subida
  const tlOf = (estilo) => estilo === 'variadas'
    ? `tl.fromTo('#a', { scale: 1.4 }, { scale: 1, duration: 0.4, ease: CURVAS.heroi }, 0.2);
       tl.fromTo('#b', { x: -300 }, { x: 0, duration: 0.33, ease: CURVAS.pouso }, 0.5);
       tl.fromTo('#c', { scale: 0.6 }, { scale: 1, duration: 0.5, ease: CURVAS.molaTarde }, 1);
       tl.fromTo('#a', { y: 0 }, { y: -40, duration: 3, ease: CURVAS.reta }, 2);
       tl.to('#b', { x: 200, duration: 0.43, ease: CURVAS.saida }, 6.5);
       tl.fromTo('#c', { rotation: -6 }, { rotation: 0, duration: 0.3, ease: CURVAS.pouso }, 7);`
    : ['#a', '#b', '#c', '#a', '#b', '#c'].map((s, i) => `tl.fromTo('${s}', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, ${i * 1.5});`).join('\n');
  const pecaOf = ({ estilo = 'variadas', imagem = true, sons = ['whoosh.wav', 'plim.wav', 'impacto.wav'] } = {}) => quadro(`
    <div id="a" style="position:absolute;left:100px;top:600px;font-size:60px">um</div>
    <div id="b" style="position:absolute;left:100px;top:800px;font-size:60px">dois</div>
    <div id="c" style="position:absolute;left:100px;top:1000px;font-size:60px">três</div>
    ${imagem ? '<div data-materia="icone" style="position:absolute;left:300px;top:1100px;width:400px;height:400px;background:#3a6"></div>' : ''}
    <audio data-papel="trilha" src="ativos/musica.wav" data-start="0" data-duration="12"></audio>
    ${sons.map((s, i) => `<audio src="ativos/${s}" data-start="${i + 1}" data-duration="1"></audio>`).join('')}
    <script src="gsap.min.js"></script><script src="curvas.js"></script><script>var tl = gsap.timeline({ paused: true });
    ${tlOf(estilo)} tl.set({}, {}, 12.5); window.__timelines = { main: tl };</script>`);
  const { oficio } = await import('./regua-direcao.mjs');
  const rodaOf = async (o) => { writeFileSync(join(z, 'index.html'), pecaOf(o)); return oficio(z, planoOf, { formato: 'reel', navegador, passo: 0.5 }); };
  r = await rodaOf({});
  ok(r.erros.length === 0, `oficio: matéria em toda cena, três curvas, entradas por movimento e três sons passam (${r.erros.map((e) => e.msg).join('; ') || 'nenhum'})`);
  r = await rodaOf({ imagem: false });
  ok(r.erros.length === 2 && r.erros.every((e) => /matéria/.test(e.msg)) && !r.erros.some((e) => /S03/.test(e.msg)), `oficio: a cena sem matéria reprova, e o respiro de 0,5 s não conta (${r.erros.map((e) => e.msg).join('; ') || 'nenhum'})`);
  r = await rodaOf({ estilo: 'chapadas' });
  ok(r.erros.length === 2 && r.erros.some((e) => /curva\(s\)/.test(e.msg)) && r.erros.some((e) => /só fade/.test(e.msg)), `oficio: uma curva só e tudo entrando em fade reprovam (${r.erros.map((e) => e.msg).join('; ') || 'nenhum'})`);
  r = await rodaOf({ sons: ['toque.wav', 'toque.wav'] });
  ok(r.erros.length === 1 && /tipo\(s\) de efeito/.test(r.erros[0].msg), `oficio: um tipo de efeito sonoro só reprova no puro (${r.erros.map((e) => e.msg).join('; ') || 'nenhum'})`);
  r = await oficio(z, { ...planoOf, modo: 'falado' }, { formato: 'reel', navegador, passo: 0.5 });
  ok(!r.erros.some((e) => /efeito/.test(e.msg)), 'oficio: no falado o som é da /cortes e a conta dos efeitos não se aplica');

  // a página de planejamento, de verdade: ele marca, baixa, e o importar traz
  const arqPagina = join(tmp, 'planejamento.html');
  const base = preencherDoCorte(falado(), dados);
  writeFileSync(arqPagina, pagina(base));
  const ctxDl = await navegador.newContext({ acceptDownloads: true });
  const pgp = await ctxDl.newPage();
  await pgp.goto(pathToFileURL(arqPagina).href);
  await pgp.check('input[name="tipo-S02"][value="tela-cheia"]');
  await pgp.fill('.cena[data-id="S02"] [data-campo="motivo"]', 'o relógio importa');
  const [dl] = await Promise.all([pgp.waitForEvent('download'), pgp.click('#baixar')]);
  await dl.saveAs(join(tmp, 'aj.json'));
  await ctxDl.close();
  const im2 = importar(base, JSON.parse(readFileSync(join(tmp, 'aj.json'), 'utf8')));
  ok(im2.cenas[1].tipo === 'tela-cheia' && im2.cenas[1].motivo === 'o relógio importa' && im2.cenas[1].de === 3.1,
    'página: o que ele marca e escreve volta pelo importar, e o tempo fica');

  // ─── 5 · a montagem do falado: a da /cortes de verdade, e as cenas por cima ──
  const fal = join(tmpRaiz, 'falado'); mkdirSync(join(fal, 'cenas'), { recursive: true });
  const P = (frase, palavras, ini) => palavras.split(' ').map((texto, i) => ({ texto, inicio: +(ini + i * 0.42).toFixed(2), fim: +(ini + i * 0.42 + 0.34).toFixed(2), frase }));
  const palavras = [...P(1, 'você perde cliente sem perceber', 0.1), ...P(2, 'a mensagem chega às nove da noite', 3.2), ...P(3, 'e ninguém responde até o outro dia', 6.6)];
  writeFileSync(join(fal, 'cortes.json'), JSON.stringify({
    fps: 30, END: 10, END_voz: 9.2, respiro: { real: 0.8, congelado: 0 }, avisos: [], sincronia: null, voz: { lufs: -14, pico_dbtp: -1.2 },
    clipes: [{ frase: 1, escolhida: 0, t: 0 }, { frase: 2, escolhida: 1, t: 3.1 }, { frase: 3, escolhida: 2, t: 6.5 }],
    frases: dados.frases.map((f, i) => ({ ...f, escolhida: i, grupo: [i] })), palavras, trocas: [], descartados: [] }));
  writeFileSync(join(fal, 'ficha.json'), JSON.stringify({ fonte: 'Inter 4', peso: 700, tamanho: 124, cor: '#ffffff', contorno: 0, contorno_cor: '#000000',
    sombra: 'none', fundo: 'none', caixa: 'minuscula', posicao_y: 1380, largura: 950, max_palavras: 4, entrada: 'corte',
    destaque: { cor: '#0088ff', italico: false, sublinhado: false, sublinhado_cor: '#ffffff', escala: 1 } }));
  writeFileSync(join(fal, 'legenda.json'), JSON.stringify({ correcoes: {}, blocos: ['você perde', 'cliente', 'sem perceber', 'a mensagem', 'chega', 'às nove', 'da noite', 'e ninguém', 'responde', 'até o outro [dia]'] }));
  writeFileSync(join(fal, 'peca.json'), JSON.stringify({ ficha: 'ficha.json', gancho: 'seu cliente some\nsem aviso', capa: 'o cliente que some às nove da noite', fatos: [], marca: 'neutra' }));
  writeFileSync(join(fal, 'plano.json'), JSON.stringify(falado(), null, 2));
  writeFileSync(join(fal, 'cenas', 'S02.js'), 'CENA("S02", function (el, c) { el.innerHTML = "<div id=\\"rel\\" style=\\"position:absolute;left:0;right:0;top:200px;text-align:center;font-size:80px\\">21h</div>"; });');
  let erroMontar = '';
  const fora = join(tmp, 'fora'); mkdirSync(fora, { recursive: true });
  writeFileSync(join(fora, 'plano.json'), JSON.stringify(falado()));
  try { await montarFalado(fora, { catalogo: CATALOGO }); } catch (e) { erroMontar = e.message; }
  ok(/só dentro deste workspace/.test(erroMontar), `montar: a peça falada fora do workspace é recusada com o motivo (${erroMontar || 'passou'})`);
  erroMontar = '';
  try { await montarFalado(fal, { catalogo: CATALOGO }); } catch (e) { erroMontar = e.message; }
  ok(/S03/.test(erroMontar), `montar: a tela cheia sem cenas/S03.js reprova (${erroMontar || 'passou'})`);
  ok(!readFileSync(join(fal, 'index.html'), 'utf8').includes('id="camera"'), 'montar: a recusa não deixa a peça da /cortes sem as cenas pronta para render');
  writeFileSync(join(fal, 'cenas', 'S03.js'), 'CENA("S03", function (el, c) { el.innerHTML = "<div style=\\"position:absolute;left:0;right:0;top:800px;text-align:center;font-size:90px\\">sem resposta</div>"; });');
  const legBoa = readFileSync(join(fal, 'legenda.json'), 'utf8');
  writeFileSync(join(fal, 'legenda.json'), JSON.stringify({ correcoes: {}, blocos: ['você perde cliente', 'sem perceber'] }));
  erroMontar = '';
  try { await montarFalado(fal, { catalogo: CATALOGO }); } catch (e) { erroMontar = e.message; }
  ok(/\/cortes recusou/.test(erroMontar), `montar: a recusa da montagem da /cortes (legenda faltando) é recusa daqui (${erroMontar.split('\n')[0] || 'passou'})`);
  writeFileSync(join(fal, 'legenda.json'), legBoa);
  writeFileSync(join(fal, 'cenas', '_comum.js'), 'window.COMUM = 1;');
  // a marca do gancho: a S01 é legenda e ganha script, que desenha por cima do rosto
  writeFileSync(join(fal, 'cenas', 'S01.js'), 'CENA("S01", function (el, c) { el.innerHTML = "<div style=\\"position:absolute;left:440px;top:260px;width:200px;height:80px;background:#000\\"></div>"; });');
  await montarFalado(fal, { catalogo: CATALOGO });
  const idx = readFileSync(join(fal, 'index.html'), 'utf8');
  ok(idx.indexOf('cenas/_comum.js') > 0 && idx.indexOf('cenas/_comum.js') < idx.indexOf('cenas/S02.js'), 'montar: o cenas/_comum.js entra antes das cenas');
  ok(idx.includes('id="camera"') && idx.includes('data-mograph="plano"') && idx.includes('data-mograph="cenas/S02.js"') && idx.includes('data-mograph="mograph-falado.js"') && !idx.includes('{{END}}')
    && idx.indexOf('const D = window.DADOS') < idx.indexOf('data-mograph="plano"'),
    'montar: a peça sai do modelo da /cortes, com o plano, as cenas e o motor embutidos depois do script do modelo');
  ok(existsSync(join(fal, 'mograph-falado.js')) && /window\.ZONA = \{[^}]*"base":1540/.test(readFileSync(join(fal, 'plano.js'), 'utf8')),
    'montar: o motor vai para a pasta, e o plano leva a zona do formatos.json');
  // o _vendor da peça: o GSAP e a curva vêm do estúdio
  mkdirSync(join(fal, '_vendor'), { recursive: true });
  for (const v of ['gsap.min.js', 'CustomEase.min.js']) writeFileSync(join(fal, '_vendor', v), readFileSync(join(vendorDoEstudio, v)));
  const pg = await navegador.newPage({ viewport: { width: 1080, height: 1920 } });
  await pg.goto(pathToFileURL(join(fal, 'index.html')).href);
  await pg.waitForFunction(() => !!(window.__timelines && window.__timelines.main), null, { timeout: 10000 });
  const em = async (s) => pg.evaluate((s) => {
    window.__timelines.main.seek(s, false);
    const palco = document.getElementById('palco');
    const vis = (el) => el && getComputedStyle(el).visibility !== 'hidden' && +getComputedStyle(el).opacity > 0.5;
    const cena = (id) => document.querySelector(`[data-cena="${id}"]`);
    // a tinta da legenda visível e o cartão da câmera, na tela: a legenda tem de caber no cartão
    const tinta = [...document.querySelectorAll('#legendas .texto')].filter(vis).map((el) => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); })[0];
    const pr = palco.getBoundingClientRect();
    // quem está na frente no meio da tinta da legenda: ela tem de estar por cima das cenas (o
    // pointer-events das cenas é none, e o elementsFromPoint pula quem o tem: liga-se só aqui)
    let frente = null;
    if (tinta) {
      const st = document.createElement('style'); st.textContent = '* { pointer-events: auto !important }'; document.head.appendChild(st);
      // a pilha no ponto, de cima para baixo: a legenda vem antes de qualquer cena que pinta ali
      const pilha = document.elementsFromPoint((tinta.left + tinta.right) / 2, (tinta.top + tinta.bottom) / 2);
      const iLeg = pilha.findIndex((e) => e.closest('#legendas')), iCena = pilha.findIndex((e) => e.closest('.cena'));
      frente = iLeg >= 0 && (iCena < 0 || iLeg < iCena);
      st.remove();
    }
    return { escala: +gsap.getProperty(palco, 'scale'), brilho: getComputedStyle(palco).filter, s01: vis(cena('S01')), palco: vis(palco), s02: vis(cena('S02')), s03: vis(cena('S03')), leg: vis(document.getElementById('legendas')), fundo: vis(document.getElementById('fundo-cena')),
      frente, tinta: tinta && { esq: Math.round(tinta.left), dir: Math.round(tinta.right) }, cartao: { esq: Math.round(pr.left), dir: Math.round(pr.right) } };
  }, s);
  const a = await em(1.5), b = await em(5.5), c = await em(8.5);
  ok(a.escala > 0.99 && a.palco && !a.s02 && !a.s03, `navegador: na legenda (1,5 s) a câmera em tela cheia e nenhuma cena de animação (${JSON.stringify(a)})`);
  ok(a.s01 && (a.brilho === 'none' || a.brilho === 'brightness(1) blur(0px)') && !b.s01 && idx.includes('data-mograph="cenas/S01.js"'),
    `navegador: a legenda com script mostra a marca por cima do rosto, sem escurecer a câmera, e ela some na frase seguinte (${JSON.stringify({ s01: a.s01, brilho: a.brilho, depois: b.s01 })})`);
  ok(b.escala < 0.8 && b.palco && b.s02 && !b.s03 && b.leg && b.fundo && !a.fundo, `navegador: na meia tela (5,5 s) a câmera no cartão, o fundo da cena atrás e a cena S02 em cima (${JSON.stringify(b)})`);
  ok(b.tinta && b.tinta.esq >= b.cartao.esq && b.tinta.dir <= b.cartao.dir, `navegador: na meia tela (5,5 s) a legenda cabe no cartão da câmera, sem vazar dos lados (${JSON.stringify({ tinta: b.tinta, cartao: b.cartao })})`);
  ok(!c.palco && c.s03 && c.leg && c.frente, `navegador: na tela cheia (8,5 s) a câmera some, a S03 toma o quadro e a legenda fica, por cima da cena (${JSON.stringify(c)})`);
  ok(b.frente, `navegador: na meia tela (5,5 s) a legenda fica por cima da cena e do cartão (${JSON.stringify({ frente: b.frente })})`);
  // a tela cheia nunca dissolve: em todo quadro da entrada e da saída a opacidade dela é 0 ou 1
  // (duas fusões: a cena entrando e saindo pela opacidade)
  const meias = await pg.evaluate(() => {
    const el = document.querySelector('[data-cena="S03"]');
    const out = [];
    for (let f = 0; f <= 12 * 30; f++) {
      window.__timelines.main.seek(f / 30, false);
      const op = +getComputedStyle(el).opacity;
      if (getComputedStyle(el).visibility !== 'hidden' && op > 0.02 && op < 0.98) out.push([+(f / 30).toFixed(2), +op.toFixed(2)]);
    }
    return out;
  });
  ok(meias.length === 0, `navegador: a tela cheia entra e sai por movimento, sem quadro meio transparente (${JSON.stringify(meias.slice(0, 5))})`);
  // a entrada da tela cheia corta seco quando faltam 60 px ou menos: a curva que freia arrastava os
  // últimos 25 a 48 px por 6 quadros, e a cena de antes aparecia numa fresta no alto (a crítica r10)
  const frestas = await pg.evaluate(() => {
    const el = document.querySelector('[data-cena="S03"]');
    const out = [];
    for (let f = 0; f <= 12 * 30; f++) {
      window.__timelines.main.seek(f / 30, false);
      const y = +gsap.getProperty(el, 'y');
      if (getComputedStyle(el).visibility !== 'hidden' && y > 0.5 && y <= 60) out.push([+(f / 30).toFixed(2), Math.round(y)]);
    }
    return out;
  });
  ok(frestas.length === 0, `navegador: a entrada da tela cheia não deixa fresta de 1 a 60 px da cena de antes (${JSON.stringify(frestas.slice(0, 6))})`);
  await pg.close();
  // a mesma peça passa na zona, inteira: a legenda, o gancho e as cenas dentro da faixa do Reel
  r = await zona(fal, { formato: 'reel', navegador });
  ok(r.erros.length === 0, `zona: a peça falada montada passa inteira (${r.erros.map((e) => e.msg).join('; ') || 'nenhum'})`);
  // a volta da tela cheia para a câmera: com a S02 em tela cheia e a S03 na meia tela, a câmera
  // já está no cartão, por baixo, quando a S02 começa a sair (6,17 s); sem isso, branco e preto
  const volta = falado();
  Object.assign(volta.cenas[1], { tipo: 'tela-cheia' });
  Object.assign(volta.cenas[2], { tipo: 'meia-tela', camera: 'PARADA', motivo: '' });
  writeFileSync(join(fal, 'plano.json'), JSON.stringify(volta, null, 2));
  await montarFalado(fal, { catalogo: CATALOGO });
  const pv = await navegador.newPage({ viewport: { width: 1080, height: 1920 } });
  await pv.goto(pathToFileURL(join(fal, 'index.html')).href);
  await pv.waitForFunction(() => !!(window.__timelines && window.__timelines.main), null, { timeout: 10000 });
  const v = await pv.evaluate(() => {
    window.__timelines.main.seek(6.3, false);
    const vis = (el) => el && getComputedStyle(el).visibility !== 'hidden' && +getComputedStyle(el).opacity > 0.5;
    return { palco: vis(document.getElementById('palco')), fundo: vis(document.getElementById('fundo-cena')) };
  });
  ok(v.palco && v.fundo, `navegador: na volta da tela cheia (6,3 s, a S02 saindo) a câmera e o fundo da cena já estão por baixo (${JSON.stringify(v)})`);
  await pv.close();
  // a marca de uma cena de legenda só existe no tempo dela: a da S03 não aparece durante a S01 (a peça
  // 2 v3 abria com a marca da S02 já posta no quadro 0)
  const marca = falado();
  Object.assign(marca.cenas[2], { tipo: 'legenda', camera: 'PARADA', motivo: '', texto_tela: '', componente: '' });
  writeFileSync(join(fal, 'plano.json'), JSON.stringify(marca, null, 2));
  writeFileSync(join(fal, 'cenas', 'S03.js'), 'CENA("S03", function (el, c) { el.innerHTML = "<div style=\\"position:absolute;left:440px;top:1300px;width:200px;height:80px;background:#000\\"></div>"; });');
  await montarFalado(fal, { catalogo: CATALOGO });
  const pm = await navegador.newPage({ viewport: { width: 1080, height: 1920 } });
  await pm.goto(pathToFileURL(join(fal, 'index.html')).href);
  await pm.waitForFunction(() => !!(window.__timelines && window.__timelines.main), null, { timeout: 10000 });
  const mv = await pm.evaluate(() => {
    const vis = (el) => el && getComputedStyle(el).visibility !== 'hidden' && +getComputedStyle(el).opacity > 0.5;
    const s3 = () => vis(document.querySelector('[data-cena="S03"]'));
    window.__timelines.main.seek(0, false); const zero = s3();
    window.__timelines.main.seek(1.5, false); const antes = s3();
    window.__timelines.main.seek(8.5, false); const dela = s3();
    return { zero, antes, dela };
  });
  ok(!mv.zero && !mv.antes && mv.dela, `navegador: a marca da cena de legenda só aparece no tempo dela (${JSON.stringify(mv)})`);
  await pm.close();
  // o zoom-dentro e o flash no navegador: a câmera do rosto mergulha antes do corte (6,5 s), a tela
  // cheia nasce do zoom sem subir, e o véu branco cobre o corte da S01 (3,1 s) e some depois
  const tr = comTransicoes();
  writeFileSync(join(fal, 'plano.json'), JSON.stringify(tr, null, 2));
  writeFileSync(join(fal, 'cenas', 'S03.js'), 'CENA("S03", function (el, c) { el.innerHTML = "<div style=\\"position:absolute;left:0;right:0;top:800px;text-align:center;font-size:90px\\">sem resposta</div>"; });');
  await montarFalado(fal, { catalogo: CATALOGO });
  const pz = await navegador.newPage({ viewport: { width: 1080, height: 1920 } });
  await pz.goto(pathToFileURL(join(fal, 'index.html')).href);
  await pz.waitForFunction(() => !!(window.__timelines && window.__timelines.main), null, { timeout: 10000 });
  const zv = await pz.evaluate(() => {
    const tl = window.__timelines.main, palco = document.getElementById('palco'), s3 = document.querySelector('[data-cena="S03"]'), fl = document.getElementById('flash');
    const op = (el) => getComputedStyle(el).visibility === 'hidden' ? 0 : +getComputedStyle(el).opacity;
    tl.seek(6.5 - 1 / 30, false); const camAntes = +gsap.getProperty(palco, 'scale');
    tl.seek(6.5 + 2 / 30, false); const cenaEsc = +gsap.getProperty(s3, 'scale'), cenaY = +gsap.getProperty(s3, 'y'), cenaVis = op(s3) > 0.5;
    tl.seek(8.5, false); const cenaFim = +gsap.getProperty(s3, 'scale');
    tl.seek(3.1, false); const flashCorte = op(fl);
    tl.seek(3.1 + 4 / 30, false); const flashDepois = op(fl);
    tl.seek(1.5, false); const flashLonge = op(fl);
    return { camAntes: +camAntes.toFixed(3), cenaEsc: +cenaEsc.toFixed(3), cenaY, cenaVis, cenaFim, flashCorte: +flashCorte.toFixed(2), flashDepois, flashLonge };
  });
  ok(zv.camAntes > 1.15 && zv.cenaVis && zv.cenaEsc > 1.05 && zv.cenaY === 0 && zv.cenaFim === 1,
    `navegador: no zoom-dentro a câmera mergulha antes do corte e a tela cheia nasce do zoom, sem subir (${JSON.stringify(zv)})`);
  ok(zv.flashCorte >= 0.8 && zv.flashDepois === 0 && zv.flashLonge === 0, `navegador: o flash cobre o corte e some em 3 quadros (${JSON.stringify(zv)})`);
  await pz.close();
} finally {
  await navegador.close();
}

// ─── 3 · a biblioteca ────────────────────────────────────────────────────────
r = conferirCatalogo(CATALOGO);
ok(r.erros.length === 0, `biblioteca: o catálogo da skill passa (${r.erros.map((e) => e.msg).join('; ') || 'nenhum'})`);
// os nomes de "regra:" e "registro:" se conferem contra o HyperFrames instalado (as regras vêm do
// instalador, em biblioteca/hyperframes-regras); sem ele, a conferência real não roda, e a lógica
// se prova com um plugin falso feito dos nomes que o catálogo usa
if (r.avisos.some((a) => /plugin HyperFrames não foi achado/.test(a.msg))) {
  console.log('pula  biblioteca: os nomes do catálogo contra o HyperFrames instalado (falta o plugin ou biblioteca/hyperframes-regras, que o instalador traz)');
}
const nomesDoCatalogo = (pre) => CATALOGO.entradas.flatMap((e) => (e.motor?.hyperframes || []).filter((i) => i.startsWith(pre + ':')).map((i) => i.slice(pre.length + 1)));
const pluginFalso = new Set(nomesDoCatalogo('regra'));
pluginFalso.registro = new Set([...nomesDoCatalogo('registro'), 'rack-focus']);
ok(conferirCatalogo(CATALOGO, { plugin: pluginFalso }).erros.length === 0, 'biblioteca: com o plugin que tem os nomes do catálogo, o catálogo passa');
const cat2 = JSON.parse(JSON.stringify(CATALOGO)); cat2.entradas[0].estado = 'lindo';
ok(conferirCatalogo(cat2).erros.length === 1, 'biblioteca: estado fora da lista reprova');
const cat3 = JSON.parse(JSON.stringify(CATALOGO)); cat3.entradas[1].estado = 'recusado';
ok(conferirCatalogo(cat3).erros.some((e) => /frase/.test(e.msg)), 'biblioteca: recusado sem a frase do usuário reprova');
const cat4 = JSON.parse(JSON.stringify(CATALOGO)); cat4.entradas[0].motor.hyperframes = ['regra:nao-existe-isso'];
ok(conferirCatalogo(cat4, { plugin: pluginFalso }).erros.some((e) => /nao-existe-isso/.test(e.msg)), 'biblioteca: regra do HyperFrames que não existe no plugin reprova');
const cat4b = JSON.parse(JSON.stringify(CATALOGO)); cat4b.entradas[0].motor.hyperframes = ['registro:bloco-que-nao-existe', 'registro:rack-focus', 'ativo:pacote/x'];
const e4b = conferirCatalogo(cat4b, { plugin: pluginFalso }).erros;
ok(e4b.length === 1 && /bloco-que-nao-existe/.test(e4b[0].msg), `biblioteca: item do registro que não existe reprova, o que existe e o ativo passam (${e4b.map((e) => e.msg).join('; ')})`);
const cat5 = recusar(JSON.parse(JSON.stringify(CATALOGO)), 'foco-que-troca', { frase: 'não curti esse desfoque', procura: ['depth-of-field'] });
const e5 = cat5.entradas.find((e) => e.id === 'foco-que-troca');
ok(e5.estado === 'recusado' && e5.recusa.frase === 'não curti esse desfoque' && conferirCatalogo(cat5).erros.length === 0, 'biblioteca: recusar grava o estado, a frase e o trecho, e o catálogo continua válido');
const cat6 = recusar(JSON.parse(JSON.stringify(CATALOGO)), 'foco-que-troca', { frase: 'não' });
ok(conferirCatalogo(cat6).avisos.some((a) => /procura/.test(a.msg)), 'biblioteca: recusado sem o trecho de código avisa que a régua do código não o vê');
const ind = indice(CATALOGO);
ok(CATALOGO.entradas.every((e) => ind.includes(e.id)), 'biblioteca: o índice lista toda entrada');

// ─── 4 · a prancha ───────────────────────────────────────────────────────────
const dir = join(tmp, 'direcoes');
const direcao = (l, rec) => {
  mkdirSync(join(dir, l), { recursive: true });
  writeFileSync(join(dir, l, 'meta.json'), JSON.stringify({ nome: `direção ${l}`, texto: 'o que ela é', critica: 'o que joga contra', recomendada: rec }));
  ff(['-f', 'lavfi', '-i', 'color=c=white:s=108x192', '-frames:v', '1', join(dir, l, '1-gancho.png')]);
};
direcao('A', true); direcao('B', false);
let erroPr = ''; try { montarPrancha(dir); } catch (e) { erroPr = e.message; }
ok(/3 a 5/.test(erroPr), `prancha: 2 direções reprovam (${erroPr || 'passou'})`);
direcao('C', false);
montarPrancha(dir);
const pr = readFileSync(join(dir, 'index.html'), 'utf8');
ok((pr.match(/class="direcao/g) || []).length === 3 && pr.includes('recomendada') && pr.includes('A/1-gancho.png'), 'prancha: 3 direções, a recomendada marcada, os quadros de cada uma');
writeFileSync(join(dir, 'A', 'meta.json'), JSON.stringify({ nome: 'a', texto: 'b', critica: 'c', recomendada: false }));
erroPr = ''; try { montarPrancha(dir); } catch (e) { erroPr = e.message; }
ok(/recomendada/.test(erroPr), `prancha: nenhuma recomendada reprova (${erroPr || 'passou'})`);

// ─── 6 · as suítes de cada ferramenta ────────────────────────────────────────
// cada uma roda sozinha e imprime # tests e # fail; aqui somam na conta. A suíte que cai sem
// imprimir a conta, ou sai com erro, é falha: não medir não é passar
SUITES.push('teste-navegador.test.mjs');
for (const s of SUITES) {
  // o prazo por suíte: a que trava (a de bordas já travou com a conta impressa)
  // vira falha com o nome dela em 10 min, em vez de segurar a /mograph até o tudo.sh matar
  // a suíte do node:test (.test.mjs) imprime a conta pelo relatório TAP
  const r = spawnSync(process.execPath, [...(s.endsWith('.test.mjs') ? ['--test-reporter=tap'] : []), join(AQUI, s)], { encoding: 'utf8', maxBuffer: 1 << 26, timeout: 600000 });
  if (r.error && r.error.code === 'ETIMEDOUT') console.log(`FALHA ${s}: passou de 10 min (travou); a saída até ali: ${(r.stdout || '').trim().split('\n').slice(-2).join(' | ')}`);
  const t = +((r.stdout || '').match(/# tests (\d+)/) || [])[1] || 0;
  const f = +((r.stdout || '').match(/# fail (\d+)/) || [])[1] || 0;
  for (const l of (r.stdout || '').split('\n')) if (l.startsWith('FALHA')) console.log(`      ${s}: ${l}`);
  const caiu = !t || (r.status !== 0 && !f);
  testes += t + (caiu ? 1 : 0); falhas += f + (caiu ? 1 : 0);
  console.log(`${f || caiu ? 'FALHA' : 'ok  '} ${s}: ${t} casos, ${f} falhas${caiu ? ` (caiu: saída ${r.status}; ${(r.stderr || '').trim().split('\n').pop()})` : ''}`);
}

console.log(`\n# tests ${testes}\n# fail ${falhas}`);
process.exit(falhas ? 1 : 0);
