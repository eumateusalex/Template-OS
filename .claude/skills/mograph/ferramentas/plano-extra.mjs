// plano-extra.mjs · as contas do plano que, sem ele, só apareciam no render.
// O conferirPlano do plano.mjs chama o conferirExtra e soma os erros e avisos dele. Cada regra
// diz a fonte.
//
//   importancia  1 a 3 por cena; no máximo 25% das cenas em 3 (ênfase se gasta)
//   cta          as cenas de CTA somam até 25% da duração (manual: comum.estrutura.o-fim)
//   morph        a segunda transformação na mesma peça pede o motivo em "excecoes"
//                ({ "transicao": "morph", "motivo": "..." }): a corrente "X vira Y vira o logo" é o
//                clichê mais gasto do motion; a primeira é livre
//   virgula      a vírgula declarada cai até 1,5 s antes da cena de importância 3 (manual: comum.estrutura.virgula)
//   legenda      o modo L0, L1, L2, L3 ou LF (`estilos.md` § 1 e § 5); o falado nunca é L0 (o feed
//                assiste mudo); L3 avisa (só com a referência do usuário). No falado, por tipo de
//                cena: a cena com a pessoa na tela (legenda, legenda-interface) leva a
//                fala inteira (L2); a tela cheia, em que a animação toma a tela, só a palavra
//                forte (L1). O contrário avisa
//   virgula/respiro  a vírgula antes do pico; o respiro, depois dele, com o motivo
//   tempo_forte  revela, escala, pousa ou acento; o pico (a primeira cena de importância 3) cai
//                num revela ou pousa (o reveal no tempo forte). Onde a voz manda
//                no tempo (o perfil da linguagem.mjs), também "voz", e o pico pode cair nela
//   formato      a chave do formatos.json da /video (a zona sai de lá)
// E o eventosDoPlano: os cortes do plano num arquivo de eventos (<mp4>.events.json).

export const MODOS_LEGENDA = ['L0', 'L1', 'L2', 'L3', 'LF'];
export const TEMPOS_FORTES = ['revela', 'escala', 'pousa', 'acento'];

const dur = (c) => (c.ate ?? 0) - (c.de ?? 0);

export function conferirExtra(plano, { formatos = null, perfil = null } = {}) {
  const erros = [], avisos = [];
  const cenas = plano.cenas || [];
  const E = (regra, msg) => erros.push({ regra, msg });
  const A = (regra, msg) => avisos.push({ regra, msg });

  // importância
  const comImp = cenas.filter((c) => c.importancia != null);
  for (const c of comImp) if (![1, 2, 3].includes(c.importancia)) E('importancia', `${c.id}: importância ${c.importancia}; vai de 1 a 3`);
  if (cenas.length && !comImp.length) A('importancia', 'nenhuma cena com importância: o herói e o pico não estão escritos no plano');
  const tres = cenas.filter((c) => c.importancia === 3);
  if (cenas.length && tres.length > Math.max(1, Math.floor(cenas.length * 0.25))) {
    E('importancia', `${tres.length} de ${cenas.length} cenas em 3 (${tres.map((c) => c.id).join(', ')}); no máximo 25%: ênfase em tudo não destaca nada`);
  }

  // CTA
  const duracao = plano.duracao || (cenas.length ? Math.max(...cenas.map((c) => c.ate || 0)) : 0);
  const cta = cenas.filter((c) => c.funcao === 'CTA').reduce((s, c) => s + dur(c), 0);
  if (duracao > 0 && cta > duracao * 0.25 + 1e-9) E('cta', `o CTA ocupa ${cta.toFixed(1)} s de ${duracao.toFixed(1)} s (${Math.round((cta / duracao) * 100)}%); até 25%`);

  // morph
  const morphs = cenas.filter((c) => c.transicao === 'morph');
  const comMotivo = (plano.excecoes || []).some((e) => e.transicao === 'morph' && e.motivo);
  if (morphs.length >= 2 && !comMotivo) E('morph', `${morphs.length} transformações (${morphs.map((c) => c.id).join(', ')}); a segunda pede o motivo em "excecoes": a corrente de transformações é o clichê mais gasto do motion`);

  // vírgula
  if (plano.virgula != null) {
    const v = typeof plano.virgula === 'object' ? plano.virgula.em : plano.virgula;
    const pico = tres[0];
    if (!(v >= 0 && v <= duracao)) E('virgula', `a vírgula em ${v} s cai fora da peça (0 a ${duracao} s)`);
    else if (pico && !(v <= pico.de + 1e-9 && pico.de - v <= 1.5)) A('virgula', `a vírgula em ${v} s não cai até 1,5 s antes do pico (${pico.id}, ${pico.de} s)`);
  }

  // respiro: o trecho calmo depois do clímax (DePX9XMgDXx, De60aBQxVfK: o movimento cai depois da
  // frase de prova), que a vírgula antes do pico não cobre; um ou mais, cada um com o motivo
  for (const r of plano.respiro == null ? [] : [].concat(plano.respiro)) {
    const de = Number(r?.de), ate = Number(r?.ate), pico = tres[0];
    const onde = `o respiro de ${r?.de} a ${r?.ate} s`;
    if (!(de >= 0 && ate > de)) E('respiro', `${onde}: o de e o ate são segundos da peça, com o ate depois do de`);
    else if (ate > duracao + 1e-9) E('respiro', `${onde} cai fora da peça (0 a ${duracao} s)`);
    else if (!pico) E('respiro', `${onde}: o respiro vem depois do pico, e o plano não tem cena de importância 3`);
    else if (de + 1e-9 < pico.de) E('respiro', `${onde}: o respiro vem depois do pico (${pico.id}, ${pico.de} s); antes do pico é a vírgula`);
    if (!String(r?.motivo || '').trim()) E('respiro', `${onde}: sem o motivo; o respiro diz o que o espectador digere ali`);
  }

  // legenda
  const modo = plano.legenda;
  if (modo != null && !MODOS_LEGENDA.includes(modo)) E('legenda', `o modo de legenda "${modo}" não existe (${MODOS_LEGENDA.join(', ')})`);
  for (const c of cenas) if (c.legenda != null && !MODOS_LEGENDA.includes(c.legenda)) E('legenda', `${c.id}: o modo de legenda "${c.legenda}" não existe`);
  if (plano.modo === 'falado') {
    const sem = cenas.filter((c) => (c.legenda ?? modo) === 'L0');
    if (sem.length) E('legenda', `falado sem legenda em ${sem.map((c) => c.id).join(', ')}: o feed assiste mudo; L1 é o mínimo`);
  }
  if (modo === 'L3' || cenas.some((c) => c.legenda === 'L3')) A('legenda', 'L3 (karaokê) só com a referência do usuário: é a legenda que mais grita');
  if (plano.modo === 'falado') {
    for (const c of cenas) {
      const m = c.legenda ?? modo;
      if (['legenda', 'legenda-interface'].includes(c.tipo) && m === 'L1') A('legenda', `${c.id}: a pessoa está na tela e a legenda mostra só a palavra forte; com ela na tela, a fala inteira (L2)`);
      if (c.tipo === 'tela-cheia' && ['L2', 'L3'].includes(m)) A('legenda', `${c.id}: a animação toma a tela e a legenda repete a frase inteira; nela, só a palavra forte (L1)`);
    }
  }

  // tempo forte: onde a voz manda no tempo (o `tempo` da linguagem), a cena pode cair na frase da
  // voz, "voz", em vez de num tempo forte da trilha; onde a música manda, o "voz" é erro
  const vozManda = perfil?.tempo === 'voz';
  for (const c of cenas) {
    if (c.tempo_forte === 'voz' && !vozManda) E('tempo_forte', `${c.id}: "voz" vale onde a voz manda no tempo, e a linguagem ${perfil?.linguagem ? `${perfil.linguagem} é de ${perfil.tempo}` : 'não está no plano'} (o campo linguagem, linguagens.md)`);
    else if (c.tempo_forte != null && c.tempo_forte !== 'voz' && !TEMPOS_FORTES.includes(c.tempo_forte)) E('tempo_forte', `${c.id}: "${c.tempo_forte}" não é tempo forte (${TEMPOS_FORTES.join(', ')}${vozManda ? ', voz' : ''})`);
  }
  const picoNaVoz = vozManda && tres[0]?.tempo_forte === 'voz';
  if (tres[0] && cenas.some((c) => c.tempo_forte) && !picoNaVoz && !['revela', 'pousa'].includes(tres[0].tempo_forte)) {
    A('tempo_forte', `o pico (${tres[0].id}) não cai num tempo forte de revelação ou pouso`);
  }

  // formato
  if (plano.formato != null && formatos && !Object.hasOwn(formatos, plano.formato)) {
    E('formato', `o formato "${plano.formato}" não está no formatos.json (${Object.keys(formatos).join(', ')})`);
  }
  return { erros, avisos };
}

// os cortes do plano para a leitura do render e para o posicionamento do som: um evento por cena, no "de"
export function eventosDoPlano(plano) {
  return (plano.cenas || []).slice(1).map((c) => ({ t: c.de, type: 'cut', label: c.id }));
}
