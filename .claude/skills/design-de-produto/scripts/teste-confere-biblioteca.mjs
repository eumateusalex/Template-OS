// Prova que o confere-biblioteca.mjs sabe reprovar: copia a skill para uma pasta temporária, confere
// que a cópia limpa passa, planta um defeito por vez, confere que a verificação CERTA falhou e desfaz.
//
// A skill vem sem captura nenhuma: antes dos casos, o teste semeia na cópia uma referência de exemplo
// com duas fontes (uma que entrou na biblioteca pelo mapa de imagens e uma que ficou fora), para as
// verificações de fonte e de cobertura terem o que conferir.
//
// Uso: node .claude/skills/design-de-produto/scripts/teste-confere-biblioteca.mjs

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SKILL = path.resolve(AQUI, '..');
const COPIA = fs.mkdtempSync(path.join(os.tmpdir(), 'confere-biblioteca-'));
fs.cpSync(SKILL, COPIA, { recursive: true });
const C = (...p) => path.join(COPIA, ...p);

// a semente: a referência @exemplo no cobertura.json e duas fontes coerentes com ela
{
  const g = JSON.parse(fs.readFileSync(C('_local', 'galeria.json'), 'utf8'));
  const img = Object.keys(g).find((k) => k.startsWith('06-produtos/') && k.endsWith('.jpg'));
  const cob = JSON.parse(fs.readFileSync(C('_local', 'cobertura.json'), 'utf8'));
  cob.referencias = { exemplo: { nome: 'Perfil de exemplo', triado_ate: '2026-10-03T03:00:01Z', ate: '2026-10-02T12:00:00Z' } };
  fs.writeFileSync(C('_local', 'cobertura.json'), JSON.stringify(cob, null, 2) + '\n');
  const fonte = (id, dt, imagens, usa, rodape) => ['---', `id: ${id}`, 'perfil: @exemplo', 'perfil_nome: "Perfil de exemplo"', `created_at: "${dt}"`, 'kind: post',
    'imagens:', ...imagens.map((x) => `  - "${x}"`), `use_in_skill: ${usa}`, 'captura: "2026-10-03T030001Z"', '---', '# @exemplo', '', 'texto do post', '', '---', '', rodape, ''].join('\n');
  fs.mkdirSync(C('_local', 'fontes', 'posts-x'), { recursive: true });
  fs.writeFileSync(C('_local', 'fontes', 'posts-x', '900000000000000001.md'), fonte('900000000000000001', '2026-10-02T12:00:00.000Z', [`900000000000000001__1 -> galeria/${img}`], true, '**Na biblioteca em:** `biblioteca/06-produtos/README.md`.'));
  fs.writeFileSync(C('_local', 'fontes', 'posts-x', '900000000000000002.md'), fonte('900000000000000002', '2026-10-02T20:00:00.000Z', ['900000000000000002__1 -> imagem não guardada: fora do assunto da skill (foto de carro na rua)'], false, '**Nao destilado.** Triagem: fora do assunto.'));
}
const CONFERE = path.join(AQUI, 'confere-biblioteca.mjs');
const roda = () => {
  const env = { ...process.env }; delete env.NODE_TEST_CONTEXT;
  const r = spawnSync(process.execPath, [CONFERE, '--raiz', COPIA], { encoding: 'utf8', env });
  return { codigo: r.status, saida: r.stdout + r.stderr };
};

// guarda e desfaz
const guardados = new Map(); const criados = [];
const edita = (rel, fn) => { const p = C(rel); if (!guardados.has(p)) guardados.set(p, fs.readFileSync(p)); fs.writeFileSync(p, fn(fs.readFileSync(p, 'utf8'))); };
const cria = (rel, conteudo) => {
  const p = C(rel);
  // pasta que não existia também sai no desfaz (senão contamina o caso seguinte)
  let d = path.dirname(p); const novas = [];
  while (!fs.existsSync(d)) { novas.push(d); d = path.dirname(d); }
  fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, conteudo);
  criados.push(...novas.reverse(), p);
};
const apaga = (rel) => { const p = C(rel); guardados.set(p, fs.readFileSync(p)); fs.rmSync(p); };
const desfaz = () => { for (const [p, b] of guardados) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, b); } guardados.clear(); while (criados.length) fs.rmSync(criados.pop(), { force: true, recursive: true }); };

const fonteQualquer = () => { const d = C('_local', 'fontes', 'posts-x'); return path.join('_local', 'fontes', 'posts-x', fs.readdirSync(d).find((f) => /-> galeria\//.test(fs.readFileSync(path.join(d, f), 'utf8')))); };
const umaImagem = () => { const g = JSON.parse(fs.readFileSync(C('_local', 'galeria.json'), 'utf8')); return Object.keys(g).find((k) => k.startsWith('06-produtos/') && k.endsWith('.jpg')); };
const X = ['x', 'com'].join('.'), ST = ['sta', 'tus'].join('');
const JPG = fs.readFileSync(C('biblioteca', 'galeria', umaImagem()));
const PNG = Buffer.from('89504e470d0a1a0a', 'hex');

const casos = [
  ['link relativo quebrado', 'todo link relativo dos .md resolve', () => edita('biblioteca/README.md', (t) => t + '\n[sumiu](09-do-generico-ao-produto/nao-existe.md)\n')],
  ['imagem citada que não existe', 'todo caminho de imagem da galeria citado existe', () => edita('biblioteca/06-produtos/clawback.md', (t) => t + '\n![x](../galeria/06-produtos/tela-que-nao-existe-clawback.jpg)\n')],
  // endereços montados em pedaços: o próprio teste não pode carregar endereço de post literal
  ['endereço de post numa fonte', 'nenhum endereço de post em arquivo nenhum da skill', () => edita(fonteQualquer(), (t) => t + `\nhttps://${X}/exemplo/${ST}/2106217679560355893\n`)],
  ['endereço de post encurtado num .md', 'nenhum endereço de post em arquivo nenhum da skill', () => edita('biblioteca/06-produtos/leaseflow.md', (t) => t + `\nver ${X}/exemplo/st… \n`)],
  ['endereço de post no galeria.json', 'nenhum endereço de post em arquivo nenhum da skill', () => edita('_local/galeria.json', (t) => t.replace('"captura"', `"origem": "twitter.com/exemplo/${ST}/1", "captura"`))],
  ['endereço de post na forma i/web/', 'nenhum endereço de post em arquivo nenhum da skill', () => edita('biblioteca/06-produtos/bench.md', (t) => t + `\nhttps://${X}/i/web/${ST}/2106140954025472112\n`)],
  ['endereço de post do twitter com statuses', 'nenhum endereço de post em arquivo nenhum da skill', () => edita('_local/README.md', (t) => t + `\nmobile.${['twitter', 'com'].join('.')}/exemplo/${ST}es/2106140954025472112\n`)],
  ['fuso fora do padrão no cobertura.json', 'cobertura.json coerente com o post mais novo em fontes/', () => edita('_local/cobertura.json', (t) => t.replace(/"fuso": "[^"]+"/, '"fuso": "BRT"'))],
  ['id de post sem arquivo de fonte', 'toda referência local de fonte resolve para um arquivo', () => edita('biblioteca/06-produtos/bench.md', (t) => t + '\n(post 2199999999999999999)\n')],
  ['caminho de fonte que não existe', 'toda referência local de fonte resolve para um arquivo', () => edita('biblioteca/06-produtos/bench.md', (t) => t + '\n`_local/fontes/posts-x/123.md`\n')],
  ['imagem capturada e não vista', 'o mapa de imagens de cada fonte aponta para a galeria ou para o registro de descarte', () => edita(fonteQualquer(), (t) => t.replace(/ -> galeria\/\S+"/, ' -> (a catalogar)"'))],
  ['fonte aponta imagem inexistente', 'o mapa de imagens de cada fonte aponta para a galeria ou para o registro de descarte', () => edita(fonteQualquer(), (t) => t.replace(/ -> galeria\/(\S+)"/, ' -> galeria/06-produtos/nao-existe-mesmo.jpg"'))],
  ['fonte sem veredito de triagem', 'o mapa de imagens de cada fonte aponta para a galeria ou para o registro de descarte', () => edita(fonteQualquer(), (t) => t.replace(/\*\*Na biblioteca em:\*\*.*$/m, '**Nao destilado.** Capturado e ainda sem triagem (ver atualizar.md, passo 5).'))],
  ['use_in_skill true sem rodapé', 'o mapa de imagens de cada fonte aponta para a galeria ou para o registro de descarte', () => edita(fonteQualquer(), (t) => t.replace(/\*\*Na biblioteca em:\*\*.*$/m, 'rodapé apagado'))],
  ['contagem de fichas errada', 'as contagens declaradas batem com o disco', () => edita('biblioteca/README.md', (t) => t.replace(/\((\d+) fichas\)/, (m, n) => `(${Number(n) + 1} fichas)`))],
  ['total do banco de frases errado', 'as contagens declaradas batem com o disco', () => edita('biblioteca/07-microcopy/banco-de-frases.md', (t) => t.replace(/\*\*Total: (\d+) exemplos\.\*\*/, (m, n) => `**Total: ${Number(n) - 1} exemplos.**`))],
  ['contagem de imagens da galeria errada', 'as contagens declaradas batem com o disco', () => edita('biblioteca/README.md', (t) => t.replace(/\((\d+) imagens\)/, (m, n) => `(${Number(n) + 3} imagens)`))],
  ['arquétipos errados no SKILL.md', 'as contagens declaradas batem com o disco', () => edita('SKILL.md', (t) => t.replace(/\((\d+) arquétipos/, '(10 arquétipos'))],
  ['ate depois do post mais novo incluído', 'cobertura.json coerente com o post mais novo em fontes/', () => edita('_local/cobertura.json', (t) => t.replace(/"ate": "[^"]+"/, '"ate": "2099-01-01T00:00:00Z"'))],
  ['triado_ate antes do post mais novo', 'cobertura.json coerente com o post mais novo em fontes/', () => edita('_local/cobertura.json', (t) => t.replace(/"triado_ate": "[^"]+"/, '"triado_ate": "2026-09-22T21:42:00Z"').replace(/"ate": "[^"]+"/, '"ate": "2026-09-22T21:42:00Z"'))],
  ['ate preenchido sem post incluído', 'cobertura.json coerente com o post mais novo em fontes/', () => edita(fonteQualquer(), (t) => t.replace('use_in_skill: true', 'use_in_skill: false'))],
  ['fonte de um perfil que não é referência', 'cobertura.json coerente com o post mais novo em fontes/', () => edita(fonteQualquer(), (t) => t.replace('perfil: @exemplo', 'perfil: @outro'))],
  ['referência sem triado_ate', 'cobertura.json coerente com o post mais novo em fontes/', () => edita('_local/cobertura.json', (t) => t.replace(/"triado_ate": "[^"]+"/, '"triado_ate": "ontem"'))],
  ['cobertura.json sem o mapa de referências', 'cobertura.json coerente com o post mais novo em fontes/', () => edita('_local/cobertura.json', (t) => t.replace('"referencias"', '"referencia_unica"'))],
  ['imagem na galeria fora do índice', 'toda imagem da galeria está no índice e toda entrada do índice existe', () => cria('biblioteca/galeria/06-produtos/tela-sem-indice-produto.jpg', JPG)],
  ['entrada do índice sem arquivo', 'toda imagem da galeria está no índice e toda entrada do índice existe', () => apaga(path.join('biblioteca', 'galeria', umaImagem()))],
  ['INDICE.md editado à mão', 'índice em dia; imagem que nenhum .md cita tem a seção que ilustra', () => edita('biblioteca/galeria/INDICE.md', (t) => t.replace('| Arquivo | O que mostra |', '| Arquivo | O que aparece |'))],
  ['imagem que ninguém cita sem a seção', 'índice em dia; imagem que nenhum .md cita tem a seção que ilustra', () => {
    cria('biblioteca/galeria/07-microcopy/frase-solta-produto.jpg', JPG);
    edita('_local/galeria.json', (t) => t.replace(/^\{/, '{\n "07-microcopy/frase-solta-produto.jpg": {"mostra": "uma frase solta que ninguém cita em lugar nenhum", "captura": "2026-10-03", "posts": [], "fontes": []},'));
    edita('biblioteca/galeria/INDICE.md', (t) => t + '\n| [`frase-solta-produto.jpg`](07-microcopy/frase-solta-produto.jpg) | uma frase solta | ninguém | captura de 03/10/2026 |\n');
  }],
  ['nome com id numérico', 'nome de imagem diz o que ela mostra', () => { cria('biblioteca/galeria/06-produtos/tela-2106217679560355893.jpg', JPG); }],
  ['nome img_', 'nome de imagem diz o que ela mostra', () => { cria('biblioteca/galeria/06-produtos/img_0042.jpg', JPG); }],
  ['nome só número', 'nome de imagem diz o que ela mostra', () => { cria('biblioteca/galeria/06-produtos/0042-1.jpg', JPG); }],
  ['PNG com extensão .jpg', 'nome de imagem diz o que ela mostra', () => { cria('biblioteca/galeria/06-produtos/tela-falsa-produto.jpg', Buffer.concat([PNG, Buffer.alloc(32)])); }],
  ['a mesma imagem em duas pastas', 'uma imagem, uma pasta; imagem só na galeria; extensão igual ao conteúdo em toda a skill', () => {
    const a = umaImagem(); const b = '04-tipos-de-tela/' + path.basename(a);
    cria('biblioteca/galeria/' + b, fs.readFileSync(C('biblioteca', 'galeria', a)));
    edita('_local/galeria.json', (t) => t.replace(/^\{/, `{\n "${b}": {"mostra": "cópia da mesma imagem em outra pasta da galeria", "captura": "2026-10-03T030001Z", "posts": [], "fontes": []},`));
    edita('biblioteca/04-tipos-de-tela/README.md', (t) => t + `\n![copia](../galeria/${b})\n`);
  }],
  ['imagem baixada dentro de _local', 'uma imagem, uma pasta; imagem só na galeria; extensão igual ao conteúdo em toda a skill', () => cria('_local/imagens/2106217679560355893__1.jpg', JPG)],
  ['PNG com .jpg fora da galeria', 'uma imagem, uma pasta; imagem só na galeria; extensão igual ao conteúdo em toda a skill', () => cria('biblioteca/exemplo-de-tela/print-falso.jpg', Buffer.concat([PNG, Buffer.alloc(32)]))],
  ['seção de captura só com o dia', 'toda captura tem nome único (bruto, seções, janela, CHANGELOG, índice, fontes)', () => edita('biblioteca/06-produtos/medspa.md', (t) => t + '\n## Captura de 05/10/2026 (posts de 03/10 a 05/10)\n\ntexto\n')],
  ['seção de captura repetida', 'toda captura tem nome único (bruto, seções, janela, CHANGELOG, índice, fontes)', () => edita('biblioteca/06-produtos/medspa.md', (t) => { const l = '## Captura 2026-10-05T120000Z (posts de 03/10 a 05/10)'; return t + '\n' + l + '\n\ntexto\n\n' + l + '\n\ntexto\n'; })],
  ['arquivo de janela pelo dia', 'toda captura tem nome único (bruto, seções, janela, CHANGELOG, índice, fontes)', () => cria('biblioteca/08-conteudo-e-crescimento/janelas/2026-10-03-a-2026-10-05.md', '# janela\n')],
  ['bruto com o nome do dia', 'toda captura tem nome único (bruto, seções, janela, CHANGELOG, índice, fontes)', () => cria('_local/fontes/_bruto/consolidado-2026-10-05.json', '[]')],
  ['entrada repetida no CHANGELOG', 'toda captura tem nome único (bruto, seções, janela, CHANGELOG, índice, fontes)', () => cria('CHANGELOG.md', '# Registro\n\n## 2026-10-05T120000Z — x\n\ntexto\n\n## 2026-10-05T120000Z — x\n\ntexto\n')],
  ['rótulo de captura pelo dia no galeria.json', 'toda captura tem nome único (bruto, seções, janela, CHANGELOG, índice, fontes)', () => edita('_local/galeria.json', (t) => t.replace(/"captura": "[^"]+"/, '"captura": "2026-10-03"'))],
  ['fonte sem o campo captura', 'toda captura tem nome único (bruto, seções, janela, CHANGELOG, índice, fontes)', () => edita(fonteQualquer(), (t) => t.replace(/^captura: .*\n/m, ''))],
  ['índice de ficha que não soma a tabela', 'o índice das fichas soma as tabelas de posts de cada ficha', () => edita('biblioteca/06-produtos/README.md', (t) => t.replace(/^(\| 9 \| Medspa[^|]*\|[^|]*\| )(\d+)/m, (m, a, n) => a + (Number(n) - 1)))],
  ['post novo na ficha sem atualizar o índice', 'o índice das fichas soma as tabelas de posts de cada ficha', () => edita('biblioteca/06-produtos/medspa.md', (t) => t.replace(/(<!--T:Medspa-->\n\| #[^\n]*\n\|[^\n]*\n)/, (m, a) => `${a}| ${(t.match(/^\| \d+ \|/gm) || []).length + 1} | 176 | 0 | 0,0 | 1 img | Complex MedSpa Ops. One Calm Interface. |\n`))],
  ['tabela de posts com a data no lugar da ordem', 'o índice das fichas soma as tabelas de posts de cada ficha', () => edita('biblioteca/06-produtos/medspa.md', (t) => t.replace(/(<!--T:Medspa-->\n\| #[^\n]*\n\|[^\n]*\n)\| 1 \|/, '$1| 2026-08-23 |'))],
  ['ordem repetida na tabela de posts', 'o índice das fichas soma as tabelas de posts de cada ficha', () => edita('biblioteca/06-produtos/medspa.md', (t) => t.replace(/(<!--T:Medspa-->\n\| #[^\n]*\n\|[^\n]*\n)\| 1 \|/, '$1| 2 |'))],
  ['data de calendário no texto da biblioteca', 'nenhuma data de calendário na biblioteca (só a ordem e o id da captura)', () => edita('biblioteca/06-produtos/medspa.md', (t) => t + '\nA peça mais vista saiu em 2026-09-22.\n')],
];

let ok = 0; const falhas = [];
const base = roda();
if (base.codigo !== 0) { console.log('A CÓPIA LIMPA NÃO PASSA:\n' + base.saida); fs.rmSync(COPIA, { recursive: true, force: true }); process.exit(1); }
for (const [nome, verificacao, planta] of casos) {
  planta();
  const r = roda();
  const linha = r.saida.split('\n').find((l) => l.includes(verificacao)) || '';
  const pegou = r.codigo === 1 && linha.startsWith('FALHOU');
  console.log(`${pegou ? 'reprovou' : 'PASSOU  '}  ${nome}  ->  ${pegou ? linha.replace(/\s+/g, ' ').slice(0, 170) : '(a verificação "' + verificacao + '" não falhou)'}`);
  if (pegou) ok++; else falhas.push(nome);
  desfaz();
}
const depois = roda();
fs.rmSync(COPIA, { recursive: true, force: true });
if (depois.codigo !== 0) { console.log('A CÓPIA NÃO VOLTOU AO LIMPO depois dos casos'); process.exit(1); }
console.log(falhas.length ? `\nFALHOU — ${falhas.length} defeito(s) passaram: ${falhas.join(', ')}` : `\nTUDO CERTO — ${casos.length} defeitos plantados, ${ok} reprovados pelo motivo certo`);
process.exit(falhas.length ? 1 : 0);
