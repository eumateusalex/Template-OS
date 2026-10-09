#!/usr/bin/env node
// Prova que o `confere-memoria.mjs` ainda sabe REPROVAR.
//
// POR QUE: verde que não sabe ficar vermelho não mede nada. Esta suíte monta
// uma memória de mentira numa pasta descartável, planta um defeito por vez, e
// exige que o verificador o encontre. Cada caso tem o par que prova que ele
// fica quieto quando o defeito não existe.
//
// Uso:  node scripts/teste-confere-memoria.mjs

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { confereMemoria, termosDoReadme, confereInstalacao } from './confere-memoria.mjs';

let passou = 0;
let falhou = 0;

function afirma(nome, condicao, detalhe = '') {
  if (condicao) {
    passou++;
    console.log(`  ok    ${nome}`);
  } else {
    falhou++;
    console.log(`  FALHOU ${nome}${detalhe ? ` · ${detalhe}` : ''}`);
  }
}

const CABECALHO = (dominio) => `# ${dominio}

> **Responsabilidade:** o domínio de teste.
> **Não mora aqui:** nada.
> **Revisado em:** 2026-09-16

## Conteúdo

Uma frase no presente.
`;

// Os termos aposentados de teste são neutros de propósito: o que se prova é o
// mecanismo, e não uma lista de alguém.
const README_BOM = `# Memória

## Os módulos

| Arquivo | Carrega |
|---|---|
| \`empresa.md\` | o negócio |
| \`preferencias.md\` | a voz |

## Regras

O único marcador permitido é \`[REVIEW]\`.

## Termos aposentados

- Plano Antigo — a oferta que saiu
- \`Método Relâmpago\`
- Fulano de Tal · o sócio que saiu
`;

// Monta uma casa de teste e devolve o caminho da raiz.
function casa(ajustes = {}) {
  const raiz = mkdtempSync(join(tmpdir(), 'memoria-teste-'));
  const dir = join(raiz, '_memoria');
  mkdirSync(dir);
  writeFileSync(join(dir, 'README.md'), ajustes.readme ?? README_BOM);
  writeFileSync(join(dir, 'empresa.md'), ajustes.empresa ?? CABECALHO('Empresa'));
  writeFileSync(join(dir, 'preferencias.md'), ajustes.preferencias ?? CABECALHO('Preferências'));
  if (ajustes.extra) {
    for (const [nome, texto] of Object.entries(ajustes.extra)) {
      writeFileSync(join(dir, nome), texto);
    }
  }
  if (ajustes.subpasta) {
    mkdirSync(join(dir, ajustes.subpasta));
    writeFileSync(join(dir, ajustes.subpasta, 'algo.md'), CABECALHO('Algo'));
  }
  if (ajustes.ponteiro) {
    mkdirSync(join(raiz, '.claude'), { recursive: true });
    writeFileSync(join(raiz, '.claude', 'algo.md'), ajustes.ponteiro);
  }
  return raiz;
}

function comCasa(ajustes, fn, opcoes) {
  const raiz = casa(ajustes);
  try {
    return fn(confereMemoria(raiz, opcoes));
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
}

const temErro = (r, trecho) => r.erros.some((e) => e.includes(trecho));

console.log('\nconfere-memoria: os defeitos plantados\n');

// 1. A casa limpa passa. Sem isso, todo o resto é ruído.
comCasa({}, (r) => afirma('memória limpa passa', r.erros.length === 0, r.erros.join(' | ')));

// 2. Subpasta.
comCasa({ subpasta: 'decisoes' }, (r) =>
  afirma('reprova subpasta', temErro(r, 'é subpasta')));
comCasa({}, (r) =>
  afirma('não inventa subpasta onde não há', !temErro(r, 'é subpasta')));

// 3. Módulo não declarado no README.
comCasa({ extra: { 'solto.md': CABECALHO('Solto') } }, (r) =>
  afirma('reprova módulo fora do README', temErro(r, 'não está declarado no README')));

// 4. README prometendo arquivo que não existe.
comCasa({ readme: README_BOM + '\n| `fantasma.md` | nada |\n' }, (r) =>
  afirma('reprova README citando arquivo inexistente', temErro(r, 'que não existe em _memoria/')));

// 5. Cabeçalho incompleto.
comCasa({ empresa: '# Empresa\n\nSem cabeçalho nenhum.\n' }, (r) =>
  afirma('reprova cabeçalho faltando', temErro(r, 'falta a linha')));
comCasa({}, (r) =>
  afirma('aceita cabeçalho completo', !temErro(r, 'falta a linha')));

// 6. Termo aposentado, lido da seção do README.
afirma('lê os três termos da seção do README (com motivo e com crase)',
  JSON.stringify(termosDoReadme(README_BOM)) === JSON.stringify(['Plano Antigo', 'Método Relâmpago', 'Fulano de Tal']),
  JSON.stringify(termosDoReadme(README_BOM)));
comCasa({ empresa: CABECALHO('Empresa') + '\nA porta de entrada é o Plano Antigo.\n' }, (r) =>
  afirma('reprova termo aposentado (Plano Antigo)', temErro(r, 'Plano Antigo')));
comCasa({ empresa: CABECALHO('Empresa') + '\nSociedade com o Fulano de Tal.\n' }, (r) =>
  afirma('reprova contexto encerrado (Fulano de Tal)', temErro(r, 'Fulano de Tal')));
comCasa({ empresa: CABECALHO('Empresa') + '\nO método relâmpago custa caro.\n' }, (r) =>
  afirma('reprova termo aposentado sem ligar para maiúscula (Método Relâmpago)', temErro(r, 'Método Relâmpago')));
comCasa({}, (r) =>
  afirma('não acusa termo aposentado em texto limpo', !temErro(r, 'termos aposentados')));
comCasa({}, (r) =>
  afirma('o README pode listar os termos sem se acusar', !r.erros.some((e) => e.startsWith('README.md'))));
// O módulo cita os DOIS termos: se a lista do parâmetro se somasse à do README
// em vez de substituí-la, o "Plano Antigo" também seria acusado.
comCasa({ empresa: CABECALHO('Empresa') + '\nA Coisa Velha voltou, e o Plano Antigo também.\n' }, (r) =>
  afirma('aceita a lista por parâmetro, no lugar da do README', temErro(r, 'Coisa Velha') && !temErro(r, 'Plano Antigo')),
  { termosAposentados: ['Coisa Velha'] });
// Sem a seção, ou com o título fora do contrato, a régua leria zero termos e
// passaria verde sem medir: isso é erro, não silêncio.
comCasa({ readme: README_BOM.replace(/## Termos aposentados[\s\S]*$/, '') }, (r) =>
  afirma('sem a seção, a régua acusa que não mediu', temErro(r, 'não mediu nada')));
comCasa({ readme: README_BOM.replace('## Termos aposentados', '## Termos Aposentados') }, (r) =>
  afirma('título da seção fora do contrato reprova, em vez de medir zero', temErro(r, 'não mediu nada')));
afirma('lê a seção no meio do arquivo, com espaço no fim do título, e para no próximo ##',
  JSON.stringify(termosDoReadme('## Termos aposentados  \n\n- Alfa — x\n\n## Como manter\n\n- Beta\n')) === '["Alfa"]',
  JSON.stringify(termosDoReadme('## Termos aposentados  \n\n- Alfa — x\n\n## Como manter\n\n- Beta\n')));
// Só a seção da lista fica isenta; o resto do README é varrido.
comCasa({ readme: README_BOM.replace('| o negócio |', '| o Plano Antigo |') }, (r) =>
  afirma('o README, fora da seção, não pode citar termo aposentado', temErro(r, 'README.md: cita "Plano Antigo"')));

// 7. Marcador de diário.
comCasa({ empresa: CABECALHO('Empresa') + '\nIsso vale desde 10/09/2026.\n' }, (r) =>
  afirma('reprova "desde DD/MM/AAAA"', temErro(r, 'marcador(es) de diário')));
comCasa({ empresa: CABECALHO('Empresa') + '\nEra assim até a virada.\n' }, (r) =>
  afirma('reprova "era X até…"', temErro(r, 'marcador(es) de diário')));
comCasa({ empresa: CABECALHO('Empresa') + '\nSão 86 seguidores (medido em 2026-09-06).\n' }, (r) =>
  afirma('aceita "(medido em AAAA-MM-DD)", que é a exceção', !temErro(r, 'marcador(es) de diário'),
    r.erros.join(' | ')));

// O defeito que já escapou uma vez: o texto da memória quebra em ~78 colunas,
// então "em" cai no fim de uma linha e a data na seguinte. Com espaço literal no
// padrão, a régua ficava verde. Estes dois casos existem para isso não voltar.
comCasa({ empresa: CABECALHO('Empresa') + '\nA memória foi reconstruída em\n16/09/2026, e isso conta.\n' }, (r) =>
  afirma('reprova marcador de data PARTIDO por quebra de linha', temErro(r, 'marcador(es) de diário')));
comCasa({ empresa: CABECALHO('Empresa') + '\nEra de um jeito\naté virar outro.\n' }, (r) =>
  afirma('reprova "era X até…" partido por quebra de linha', temErro(r, 'marcador(es) de diário')));

// 8. Emoji estrutural.
comCasa({ empresa: CABECALHO('Empresa') + '\n\u{1F6A8} **Regra importante.**\n' }, (r) =>
  afirma('reprova emoji como estrutura', temErro(r, 'como estrutura')));
comCasa({}, (r) =>
  afirma('não acusa emoji em texto sem emoji', !temErro(r, 'como estrutura')));

// 9. Teto de linhas (é aviso, não erro: o julgamento é de quem lê).
comCasa({ empresa: CABECALHO('Empresa') + '\n'.repeat(300) }, (r) =>
  afirma('avisa no teto de linhas, sem reprovar',
    r.avisos.some((a) => a.includes('acima do teto')) && !temErro(r, 'acima do teto')));

// 10. Ponteiro quebrado.
comCasa({ ponteiro: 'Ver `_memoria/inexistente.md` para detalhes.\n' }, (r) =>
  afirma('reprova ponteiro para arquivo que não existe', temErro(r, 'que não existe')));
comCasa({ ponteiro: 'Ver `_memoria/empresa.md` para detalhes.\n' }, (r) =>
  afirma('aceita ponteiro que resolve', !temErro(r, 'inexistente')));

// 11. README ausente.
{
  const raiz = mkdtempSync(join(tmpdir(), 'memoria-teste-'));
  mkdirSync(join(raiz, '_memoria'));
  writeFileSync(join(raiz, '_memoria', 'empresa.md'), CABECALHO('Empresa'));
  const r = confereMemoria(raiz);
  afirma('reprova memória sem README', temErro(r, 'falta `_memoria/README.md`'));
  rmSync(raiz, { recursive: true, force: true });
}

// 12. Contagem de [REVIEW]: item conta, menção entre crases não.
comCasa({ empresa: CABECALHO('Empresa') + '\n[REVIEW] Decidir isso.\n[REVIEW] E isso.\n' }, (r) =>
  afirma('conta os itens [REVIEW]', r.revisoes['empresa.md'] === 2, JSON.stringify(r.revisoes)));
comCasa({}, (r) =>
  afirma('não conta `[REVIEW]` entre crases, que é a regra falando',
    r.revisoes['README.md'] === 0, JSON.stringify(r.revisoes)));

// 12b. O termo aposentado com a mesma regra do confere-contexto: partido entre
// linhas reprova; colado a outra letra não casa.
comCasa({ empresa: CABECALHO('Empresa') + '\nVende o Plano\nAntigo para todo mundo.\n' }, (r) =>
  afirma('reprova o termo aposentado partido entre duas linhas', temErro(r, '"Plano Antigo"'), r.erros.join(' | ')));
comCasa({ empresa: CABECALHO('Empresa') + '\nO Plano Antigoso é outra coisa.\n' }, (r) =>
  afirma('não casa o termo colado a outra letra', !temErro(r, '"Plano Antigo"'), r.erros.join(' | ')));
comCasa({ empresa: CABECALHO('Empresa') + '\nO SuperPlano Antigo é outra coisa.\n' }, (r) =>
  afirma('não casa o termo com letra colada antes', !temErro(r, '"Plano Antigo"'), r.erros.join(' | ')));

// 13. O molde sem data leva o marcador do /instalar, e passa; outra frase no lugar da data reprova.
comCasa({ empresa: CABECALHO('Empresa').replace('2026-09-16', '*(o `/instalar` preenche)*') }, (r) =>
  afirma('aceita o marcador "o /instalar preenche" no Revisado em', !temErro(r, 'Revisado em'), r.erros.join(' | ')));
comCasa({ empresa: CABECALHO('Empresa').replace('2026-09-16', 'ontem') }, (r) =>
  afirma('reprova "Revisado em" que não é data nem o marcador', temErro(r, 'Revisado em'), r.erros.join(' | ')));

// 14. A instalação (--instalada): o mínimo que o /instalar preenche.
{
  const EMPRESA_MOLDE = CABECALHO('Empresa').replace('2026-09-16', '*(o `/instalar` preenche)*') +
    '\n**Nome:** *(a definir)*\n\n## Tese\n\n**O que você vende:** *(a definir)*\n*Dito como a um amigo.*\n';
  const ESTRATEGIA_MOLDE = CABECALHO('Estratégia').replace('2026-09-16', '*(o `/instalar` preenche)*') +
    '\n## Fase\n\n*(a definir)*\n\n## Gargalo\n\n**O que trava:** *(a definir)*\n*Seja específico.*\n\n**Consequência para o sistema:** *(a definir)*\n\n## Próximo passo\n\n*(a definir)*\n';
  const EMPRESA_CHEIA = CABECALHO('Empresa') + '\n**Nome:** Carla Mendes\n\n## Tese\n\n**O que você vende:** "sessão de fisioterapia"\n';
  const ESTRATEGIA_CHEIA = CABECALHO('Estratégia') +
    '\n## Fase\n\nserviço primeiro\n\n## Gargalo\n\n**O que trava:** "não sei por onde começar"\n\n**Consequência para o sistema:** entregar um passo, nunca um roadmap\n\n## Próximo passo\n\npostar a primeira dica\n';
  const instalada = (empresa, estrategia, fn) => {
    const raiz = casa({ empresa, extra: { 'estrategia.md': estrategia } });
    try { return fn(confereInstalacao(raiz)); } finally { rmSync(raiz, { recursive: true, force: true }); }
  };
  instalada(EMPRESA_MOLDE, ESTRATEGIA_MOLDE, (r) =>
    afirma('--instalada reprova a memória ainda em branco (nome, o que vende, gargalo, consequência, datas)', r.erros.length === 6, r.erros.join(' | ')));
  instalada(EMPRESA_MOLDE, ESTRATEGIA_MOLDE, (r) =>
    afirma('--instalada lista a fase e o próximo passo em branco como pendência',
      r.pendentes.some((p) => p.includes('a fase')) && r.pendentes.some((p) => p.includes('próximo passo')), r.pendentes.join(' | ')));
  {
    const raiz = casa({ empresa: EMPRESA_CHEIA, extra: { 'estrategia.md': ESTRATEGIA_CHEIA, 'escrita-publica.md': CABECALHO('Escrita') + '\n## A voz\n\n*(a preencher pelo `/instalar`)*\n' } });
    try {
      const r = confereInstalacao(raiz);
      afirma('--instalada lista a voz em branco como pendência', r.pendentes.some((p) => p.includes('a voz')), r.pendentes.join(' | '));
      // a opção na linha de comando: com ela, a memória em branco reprova; sem ela, o contrato passa
      const cli = (...a) => spawnSync(process.execPath, [fileURLToPath(new URL('./confere-memoria.mjs', import.meta.url)), '--raiz', raiz, ...a], { encoding: 'utf8' });
      afirma('a linha de comando sem --instalada não cobra a instalação', !/instalação:|pendente:/.test(cli().stdout), cli().stdout);
    } finally { rmSync(raiz, { recursive: true, force: true }); }
    const vazia = casa({ empresa: EMPRESA_MOLDE, extra: { 'estrategia.md': ESTRATEGIA_MOLDE } });
    try {
      const r = spawnSync(process.execPath, [fileURLToPath(new URL('./confere-memoria.mjs', import.meta.url)), '--raiz', vazia, '--instalada'], { encoding: 'utf8' });
      afirma('a linha de comando com --instalada reprova a memória em branco', r.status === 1 && /instalação: empresa\.md: o Nome/.test(r.stdout), r.stdout);
    } finally { rmSync(vazia, { recursive: true, force: true }); }
  }
  instalada(EMPRESA_CHEIA, ESTRATEGIA_CHEIA, (r) =>
    afirma('--instalada passa a memória com o mínimo preenchido e datado', r.erros.length === 0 && r.pendentes.length === 0, [...r.erros, ...r.pendentes].join(' | ')));
  instalada(EMPRESA_CHEIA.replace('Carla Mendes', '*(a definir)*'), ESTRATEGIA_CHEIA, (r) =>
    afirma('--instalada reprova só o Nome em branco', r.erros.length === 1 && r.erros[0].includes('Nome'), r.erros.join(' | ')));
  instalada(EMPRESA_CHEIA, ESTRATEGIA_CHEIA.replace('entregar um passo, nunca um roadmap', '*(a definir)*'), (r) =>
    afirma('--instalada reprova o gargalo sem consequência', r.erros.length === 1 && r.erros[0].includes('Consequência'), r.erros.join(' | ')));
  instalada(EMPRESA_CHEIA, ESTRATEGIA_CHEIA.replace('postar a primeira dica', '*(a definir)*'), (r) =>
    afirma('--instalada diz o próximo passo em branco como pendência, sem reprovar', r.erros.length === 0 && r.pendentes.some((p) => p.includes('próximo passo')), [...r.erros, ...r.pendentes].join(' | ')));
  instalada(EMPRESA_CHEIA.replace('2026-09-16', '*(o `/instalar` preenche)*'), ESTRATEGIA_CHEIA, (r) =>
    afirma('--instalada reprova o módulo escrito sem a data', r.erros.length === 1 && r.erros[0].includes('Revisado em'), r.erros.join(' | ')));
}

// 15. Com Git, "escrito" é o que mudou desde o primeiro commit (o molde do template):
// o módulo mexido sem data reprova, o intocado não, e o campo em branco vira pendência.
{
  const EMPRESA = CABECALHO('Empresa').replace('2026-09-16', '*(o `/instalar` preenche)*') + '\n**Nome:** *(a definir)*\n';
  const PREF = CABECALHO('Preferências').replace('2026-09-16', '*(o `/instalar` preenche)*') + '\n## Tom\n\n*(a definir)*\n';
  const raiz = casa({ empresa: EMPRESA, preferencias: PREF });
  const git = (...a) => spawnSync('git', ['-C', raiz, ...a], { encoding: 'utf8' });
  git('init', '-q'); git('add', '-A'); git('-c', 'user.name=t', '-c', 'user.email=t@exemplo.invalid', 'commit', '-qm', 'molde');
  try {
    const virgem = confereInstalacao(raiz);
    afirma('no molde intocado, nenhum módulo cobra data', !virgem.erros.some((e) => e.includes('Revisado em')), virgem.erros.join(' | '));
    afirma('o campo em branco vira pendência com a conta', virgem.pendentes.some((p) => p === 'preferencias.md: 1 campo(s) ainda em branco'), virgem.pendentes.join(' | '));
    writeFileSync(join(raiz, '_memoria', 'preferencias.md'), PREF.replace('*(a definir)*', 'próximo e direto'));
    const mexido = confereInstalacao(raiz);
    afirma('o módulo mexido sem data reprova, mesmo fora de empresa e estratégia', mexido.erros.some((e) => e === 'preferencias.md: escrito sem a data no "Revisado em"'), mexido.erros.join(' | '));
    afirma('o módulo intocado continua sem cobrar data', !mexido.erros.some((e) => e.startsWith('empresa.md: escrito')), mexido.erros.join(' | '));
  } finally { rmSync(raiz, { recursive: true, force: true }); }
}

console.log(`\n${passou} passou, ${falhou} falhou\n`);
process.exit(falhou ? 1 : 0);
