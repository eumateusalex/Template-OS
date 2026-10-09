// A porta da API local do ditto, escolhida sem derrubar ninguém.
//
// A API lê a porta da variável PORT (packages/api/src/env.ts do ditto). Sem API
// no ambiente, a porta é uma livre que o sistema der; com API numa porta que já
// tem dono (outra sessão, outra ferramenta), quem chamou para e diz como seguir.
// Processo alheio nunca cai por causa de porta: quem sobe a API só derruba o
// filho que ele mesmo subiu.
//
// Prova: teste-api-local.mjs

import { execSync } from 'node:child_process';
import { createServer } from 'node:net';

// Onde um dono pode estar escutando: sem host (o `::` com o IPv4 junto, que é
// como a API do ditto sobe), o 0.0.0.0, o 127.0.0.1 e o ::1. No Windows um
// endereço não enxerga o dono do outro, então a porta só está livre se as
// quatro tentativas conseguirem escutar.
const ENDERECOS = [undefined, '0.0.0.0', '127.0.0.1', '::1'];
// o endereço que a máquina não tem (sem IPv6, por exemplo) não diz nada da porta
const SEM_ENDERECO = new Set(['EADDRNOTAVAIL', 'EAFNOSUPPORT', 'EINVAL']);

/** Escutar na porta, neste endereço, deu certo? Solta na hora. */
function escuta(porta, host) {
  return new Promise((ok) => {
    const s = createServer(); // servidor-falso: só escuta para ver se a porta está livre e solta na hora, não serve nada
    s.once('error', (e) => ok(SEM_ENDERECO.has(e.code) ? 'sem endereço' : 'ocupada'));
    const solta = () => s.close(() => ok('livre'));
    if (host === undefined) s.listen(porta, solta);
    else s.listen(porta, host, solta);
  });
}

/** A porta tem dono em algum dos endereços onde um dono pode escutar? */
export async function portaOcupada(porta) {
  for (const host of ENDERECOS) if ((await escuta(porta, host)) === 'ocupada') return true;
  return false;
}

/** A porta que o sistema der, no endereço em que a API sobe (sem host). */
const pedirAoSistema = () => new Promise((ok, falha) => {
  const s = createServer(); // servidor-falso: pede ao sistema uma porta livre e solta na hora, não serve nada
  s.once('error', falha);
  s.listen(0, () => { const { port } = s.address(); s.close(() => ok(port)); });
});

/**
 * Uma porta livre nos quatro endereços: o sistema dá a porta por um endereço
 * só, e a que já tem dono em outro é recusada.
 * @param {() => Promise<number>} pedir quem pede a porta (a suíte o troca)
 */
export async function portaLivre(pedir = pedirAoSistema) {
  for (let tentativa = 0; tentativa < 20; tentativa++) {
    const porta = await pedir();
    if (!(await portaOcupada(porta))) return porta;
  }
  throw new Error('não achei porta livre em 20 tentativas: a máquina está sem porta para a API');
}

/**
 * A base da API e a porta dela, a partir do ambiente.
 * @param {{ API?: string }} env
 * @returns {Promise<{ api: string, porta: number }>}
 */
export async function escolherApi(env) {
  if (!env.API) {
    const porta = await portaLivre();
    return { api: `http://127.0.0.1:${porta}`, porta };
  }
  // a porta escrita na base, ou a padrão do protocolo
  const url = new URL(env.API);
  const porta = Number(url.port || (url.protocol === 'https:' ? 443 : 80));
  if (await portaOcupada(porta))
    throw new Error(`a porta ${porta} já tem dono (outra sessão ou outra ferramenta), e este script não derruba processo alheio · tire o API= do ambiente para subir numa porta livre, ou passe outra API=`);
  return { api: env.API.replace(/\/+$/, ''), porta };
}

const dorme = (ms) => new Promise((r) => setTimeout(r, ms));
// No Windows o kill() do filho lançado com shell mata só o cmd, e o node fica
// órfão segurando a porta; o taskkill /T mata a árvore daquele pid.
const matarArvore = (pid) => execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });

/**
 * A API do ditto como filho deste processo. `subir` derruba o filho anterior,
 * espera a porta soltar (até `espera` vezes 1 s) e lança o novo com a porta no
 * PORT; se a porta segue com dono, para sem lançar e sem matar ninguém.
 * `derrubar` mata só o filho que `subir` lançou.
 * @param {number} porta
 * @param {{ lancar: (env: object) => { pid: number }, ambiente?: object,
 *   matar?: (pid: number) => void, esperar?: (ms: number) => Promise<void>, espera?: number }} opcoes
 */
export function filhoDaApi(porta, { lancar, ambiente = process.env, matar = matarArvore, esperar = dorme, espera = 15 }) {
  let filho = null;
  function derrubar() {
    if (!filho) return;
    try { matar(filho.pid); } catch { /* já morreu */ }
    filho = null;
  }
  async function subir() {
    derrubar();
    for (let i = 0; i < espera && (await portaOcupada(porta)); i++) await esperar(1000);
    if (await portaOcupada(porta))
      throw new Error(`a porta ${porta} ficou com outro dono entre um lote e outro, e este script não derruba processo alheio · rode de novo: os lotes prontos são pulados`);
    filho = lancar({ ...ambiente, PORT: String(porta) });
    return filho;
  }
  return { subir, derrubar };
}
