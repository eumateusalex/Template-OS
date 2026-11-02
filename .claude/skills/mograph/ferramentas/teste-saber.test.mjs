// O formato do manual (o `saber` do perfil: filme ou reel) sai do estilo da peça, pela tabela do
// manual/README.md § 1, lida na hora. O nome não é `formato`: esse é o enquadramento do destino.
//
//   node --test .claude/skills/mograph/ferramentas/teste-saber.test.mjs
// mutação: .claude/skills/mograph/ferramentas/linguagem.mjs · "saberes[e[1]] = m[2]" → "saberes[e[1]] = 'filme'" · pega
// mutação: .claude/skills/mograph/ferramentas/linguagem.mjs · "estilo && estiloValido ? (saberes" → "estilo ? (saberes" · pega
// mutação: .claude/skills/mograph/ferramentas/linguagem.mjs · "find((s) => /^1 · Os formatos/.test(s))" → "find((s) => /Os formatos/.test(s))" · pega
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { perfilDoPlano, saberesDoReadme, lerSaberes } from './linguagem.mjs';

const LING = { linguagens: { doc: { tempo: 'voz', dispensa: [] } }, estilos: { documental: { linguagem: 'doc', dispensa: [] } } };
const ESTILOS = ['comercial', 'documental', 'anuncio-google', 'bumper', 'motion', 'explica', 'falado-motion', 'anuncio-meta', 'vinheta', 'novo'];

const README = `# O manual

## 0 · Como ler Os formatos

| \`filme/\` | \`filme\` | antes da seção | \`vinheta\` | não conta |

## 1 · Os formatos

| Pasta | Formato | O que é | Estilos | O saber de origem |
|---|---|---|---|---|
| \`filme/\` | \`filme\` | o comercial | \`comercial\`, \`novo\` | o saber do filme |
| \`reel/\` | \`reel\` | o vertical | \`motion\` | o pacote |
| \`comum/\` | os dois | o que vale | todos | todos |

## 2 · A entrada

| \`filme/\` | \`filme\` | fora da seção | \`vinheta\` | não conta |
`;

test('a tabela do README dá o saber de cada estilo, só na seção 1 (nem antes nem depois), e o comum não é saber', () => {
  const s = saberesDoReadme(README);
  assert.deepEqual(s, { comercial: 'filme', novo: 'filme', motion: 'reel' });
});

test('o README de verdade: os estilos do filme e do reel', () => {
  const s = lerSaberes();
  for (const e of ['comercial', 'documental', 'anuncio-google', 'bumper']) assert.equal(s[e], 'filme', e);
  for (const e of ['motion', 'explica', 'falado-motion', 'anuncio-meta']) assert.equal(s[e], 'reel', e);
  assert.equal(s.vinheta, undefined);
  assert.ok(!('todos' in s));
});

test('o perfil leva o saber do estilo, e nenhum sem estilo ou com estilo fora da tabela', () => {
  const saberes = saberesDoReadme(README);
  const p = (plano) => perfilDoPlano(plano, { linguagens: LING, estilos: ESTILOS, saberes });
  assert.equal(p({ estilo: 'comercial' }).saber, 'filme');
  assert.equal(p({ estilo: { id: 'motion', destaque: '--ios-azul' } }).saber, 'reel');
  assert.equal(p({ estilo: 'novo' }).saber, 'filme', 'o estilo novo escrito no README muda o perfil sem tocar no código');
  assert.equal(p({ estilo: 'vinheta' }).saber, null);
  assert.equal(p({}).saber, null);
  assert.equal(p({ estilo: 'cinema-mudo' }).saber, null, 'o estilo que não existe dá erro e nenhum saber');
  assert.ok(!('formato' in p({ estilo: 'comercial' })), 'o campo não se chama formato');
  const fora = perfilDoPlano({ estilo: 'novo' }, { linguagens: LING, estilos: ['comercial'], saberes });
  assert.equal(fora.erros[0]?.regra, 'estilo');
  assert.equal(fora.saber, null, 'o estilo da tabela do manual que o estilos.md da /video não tem dá erro e nenhum saber');
});
