// A marca no Remotion: o `.claude/video/src/marca.ts`.
//
//   node .claude/skills/video/ferramentas/marca-remotion.mjs            escreve as saídas da marca (o marca.ts entre elas)
//   node .claude/skills/video/ferramentas/marca-remotion.mjs --conferir  só diz se o marca.ts está em dia (sai 1 se não)
//
// A marca mora em `identidade/marca.tokens.json` (o /marca configurar grava), e
// quem escreve o marca.ts é o gerador único, `scripts/marca/gerar.mjs`, com as
// cores, as famílias, os pesos, a curva e as durações da marca. Este script é o
// atalho da /video para ele: lê o estado pela `lerMarca` (a leitura única) e,
// com a marca configurada, roda o gerador inteiro, para nenhuma saída ficar
// para trás.
//
// Sem marca configurada, para com a frase única ("a marca não está
// configurada: rode /marca"). O marca.ts que vem no template é o gerador rodado
// sem marca (MARCA_CONFIGURADA = false), e a composição que chama
// `exigeMarca()` para com a mesma frase.
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerMarca, paradaDe, raizPadrao } from '../../../../scripts/marca/marca.mjs';
import { saidas, escrever, DESTINOS } from '../../../../scripts/marca/gerar.mjs';

export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');

export const destino = (raiz = raizPadrao()) => join(raiz, DESTINOS.remotion);

/** O marca.ts que o gerador escreveria agora para esta raiz. */
export const marcaTsEsperado = ({ raiz = raizPadrao() } = {}) => saidas({ raiz }).get(DESTINOS.remotion);

/** O estado da marca para o Remotion: `{ resolvido, motivo }` (resolvido `null` sem marca). */
export function marcaDoWorkspace({ raiz = raizPadrao() } = {}) {
  const m = lerMarca({ raiz });
  return { resolvido: m.configurada ? m.resolvido : null, motivo: m.motivo };
}

/** Confere o marca.ts: `{ emDia, configurada }`. */
export function conferirMarcaTs({ raiz = raizPadrao() } = {}) {
  const atual = existsSync(destino(raiz)) ? readFileSync(destino(raiz), 'utf8') : '';
  return { emDia: atual === marcaTsEsperado({ raiz }), configurada: Boolean(marcaDoWorkspace({ raiz }).resolvido) };
}

/** Escreve as saídas da marca; sem marca, lança com a frase única. */
export function escreverMarcaTs({ raiz = raizPadrao() } = {}) {
  const { resolvido, motivo } = marcaDoWorkspace({ raiz });
  if (!resolvido) throw new Error(`marca-remotion: ${paradaDe(motivo)}`);
  escrever({ raiz });
  return resolvido;
}

if (process.argv[1] && realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))) {
  try {
    if (process.argv.includes('--conferir')) {
      const r = conferirMarcaTs();
      if (r.emDia) { console.log(`marca.ts em dia (${r.configurada ? 'com a marca' : 'marca não configurada'})`); process.exit(0); }
      console.error('marca.ts desatualizado: rode node scripts/marca/gerar.mjs');
      process.exit(1);
    }
    const r = escreverMarcaTs();
    console.log(`marca.ts escrito: principal ${r.cor.papel.principal}, claro ${r.cor.papel.claro}, acento ${r.cor.papel.acento}; curva [${r.movimento.curva.principal.join(', ')}]`);
    if (['display', 'destaque', 'mono'].some((p) => r.fonte[p].arquivo)) console.log('AVISO: a marca tem fonte em arquivo local. O Remotion só serve o que está em .claude/video/public/: copie o arquivo para lá e carregue com staticFile() na peça');
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
