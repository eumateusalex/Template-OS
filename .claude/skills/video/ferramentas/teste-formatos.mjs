// A régua do formatos.json e da ficha no destino. Sem rede, sem arquivo de fora da skill.
//   node teste-formatos.mjs
// A ficha de exemplo entra pela fixture (fixtures/ficha-marca.json, as medidas da /cortes).
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { conferirFichaNoDestino, FORMATOS as F } from './ficha-no-destino.mjs';

let testes = 0, falhas = 0;
const ok = (cond, msg) => { testes++; console.log(`${cond ? 'ok  ' : 'FALHA'} ${msg}`); if (!cond) falhas++; };
const campos = ['largura', 'altura', 'topo', 'base', 'lateral', 'origem'];
const fixture = fileURLToPath(new URL('./fixtures/ficha-marca.json', import.meta.url));
const ficha = JSON.parse(readFileSync(fixture, 'utf8'));

ok(['reel', 'anuncio-reels', 'shorts', 'tiktok', 'meta-feed-4x5', 'quadrado-1x1', 'yt-16x9'].every((k) => F[k]), `os 7 destinos existem (${Object.keys(F).join(', ')})`);
ok(Object.values(F).every((f) => campos.every((c) => f[c] !== undefined)), 'todo destino tem os 6 campos que a regua-direcao lê');
ok(Object.values(F).every((f) => f.topo >= 0 && f.topo < f.base && f.base <= f.altura && f.lateral * 2 < f.largura), 'toda zona fica dentro do quadro, com topo acima da base');
ok(Object.values(F).every((f) => ['oficial', 'aproximada', 'prudencia', 'hipotese'].includes(f.medida)) && F['anuncio-reels'].medida === 'oficial', 'toda zona diz de onde vem o número (a do anúncio da Meta é a oficial)');
// a origem que cita um .md cita um que existe na skill: a fonte do número tem que se conferir
const citados = Object.values(F).flatMap((f) => [...String(f.origem).matchAll(/([\w.-]+\.md)\b/g)].map((m) => m[1]));
const faltam = citados.filter((n) => !existsSync(fileURLToPath(new URL(`../${n}`, import.meta.url))));
ok(!faltam.length, `todo .md citado na origem de um destino existe na skill${faltam.length ? ` (faltam: ${faltam.join(', ')})` : ''}`);
const a = F['anuncio-reels'];
ok(a.largura - 2 * a.lateral === 950 && a.base - a.topo === 978, `a área livre do anúncio é 950 x ${a.base - a.topo} px (o Ads Guide: 950 x 979, arredondando 14% e 35%)`);
ok(Math.abs(a.topo - 0.14 * 1920) <= 2 && Math.abs(1920 - a.base - 0.35 * 1920) <= 2, `o anúncio guarda 14% em cima e 35% embaixo (topo ${a.topo})`);
ok(F['yt-16x9'].largura === 1920 && F['yt-16x9'].altura === 1080, 'o 16:9 é deitado (1920 x 1080)');

// a ficha de exemplo cabe no Reel pela altura e não cabe no anúncio
const noReel = conferirFichaNoDestino(ficha, F.reel, { nome: 'marca' });
const noAnuncio = conferirFichaNoDestino(ficha, a, { nome: 'marca' });
ok(!noReel.erros.some((e) => /abaixo|acima/.test(e)), `na altura, a ficha de exemplo cabe no Reel (termina em ~${noReel.fundo} px, base ${F.reel.base})`);
ok(noReel.erros.length === 1 && /largura/.test(noReel.erros[0]), `a largura da ficha de exemplo passa da zona lateral (${noReel.erros[0]})`);
ok(noAnuncio.erros.some((e) => /abaixo da zona/.test(e)), `a ficha de exemplo reprova no anúncio pela altura (${noAnuncio.erros.find((e) => /abaixo/.test(e))})`);
ok(conferirFichaNoDestino({ posicao_y: 1100, tamanho: 74, largura: 900 }, a).erros.length === 0, 'a mesma ficha com o topo em 1100 e 900 px de largura cabe no anúncio');
ok(conferirFichaNoDestino({ posicao_y: 200, tamanho: 74, largura: 900 }, a).erros.some((e) => /acima da zona/.test(e)), 'a ficha que começa acima do topo da zona reprova');
ok(conferirFichaNoDestino({ posicao_y: 1100, tamanho: 74, largura: 900 }, a, { linhas: 2 }).fundo === 1100 + Math.round(74 * 1.15 * 2), 'duas linhas dobram a altura do bloco');

// a linha de comando: sai 1 no anúncio, 0 no formato que cabe, 2 no formato que não existe
const cli = (args) => { try { execFileSync('node', [fileURLToPath(new URL('./ficha-no-destino.mjs', import.meta.url)), ...args], { stdio: 'pipe' }); return 0; } catch (e) { return e.status; } };
ok(cli([fixture, 'anuncio-reels']) === 1 && cli([fixture, 'formato-que-nao-existe']) === 2, 'a linha de comando reprova a ficha de exemplo no anúncio e recusa formato fora do formatos.json');

console.log(`\n# tests ${testes}\n# fail ${falhas}`);
process.exitCode = falhas ? 1 : 0;
