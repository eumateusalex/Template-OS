#!/usr/bin/env node
// fundação: conferido v1 · o ajuste mora no fundacao.json e no portão do projeto
//
// node fundacao/portao/fundacao.mjs [--raiz <dir>] [--fonte <a casa>]
//
// Classe de defeito: o projeto rodando uma fundação que não é a da casa. Dois
// jeitos, os dois silenciosos: alguém editou um arquivo conferido, ou um
// conferidor da fundação existe e nenhuma linha do portão o chama.
//
// 🚨 A SEMENTE NÃO SE CONFERE. Ela é do projeto desde o dia da cópia; acusá-la
// de "diferente" seria a fundação atropelando o trabalho de quem a usa. O que
// este conferidor faz com a semente é AVISAR, e só quando a casa está ao
// alcance e a fonte mudou.
//
// ⚠️ A casa fora de alcance (o projeto clonado noutra máquina, o CI) é NOTA
// impressa, nunca silêncio e nunca vermelho: o projeto roda sem a casa.
//
// Prova: provas/fundacao.mjs

import { join } from 'node:path'
import { existsSync, readFileSync, readdirSync } from 'node:fs'

import { Relatorio } from '../lib/saida.mjs'
import { andar } from '../lib/arquivos.mjs'
import { comoComando, impressao, argumento, acharCasa, MANIFESTO, KIT_NA_CASA } from '../lib/casca.mjs'

/** Onde mora o ajuste que o projeto tentou fazer num arquivo conferido. */
function ondeMoraOAjuste (rel) {
  if (/tokens\.css$|tema-shadcn\.css$|fontes\.css$|\/fontes\//.test(rel)) {
    return 'o ajuste da marca mora em src/styles/ (a marca do projeto); a marca da casa muda no kit de identidade da casa'
  }
  if (/\/(portao|provas|lib)\/|teste-portao\.mjs$/.test(rel)) {
    return 'o ajuste da régua mora no fundacao.json (pisos) e no portão do projeto'
  }
  return 'o ajuste do projeto mora fora de fundacao/, num arquivo seu'
}

function lista (pasta) {
  try { return readdirSync(pasta).filter((f) => f.endsWith('.mjs')).map((f) => f.replace(/\.mjs$/, '')) } catch { return [] }
}

export function conferir (raiz, { manifesto, argv = [], env = process.env }, { escreve = console.log } = {}) {
  const r = new Relatorio('fundacao', {
    escreve,
    regra: 'o conferido é da casa e não se edita; a semente é do projeto; todo conferidor tem linha no portão e prova'
  })
  const arquivos = manifesto.arquivos ?? {}
  let olhados = 0

  for (const [rel, entrada] of Object.entries(arquivos)) {
    olhados += 1
    const caminho = join(raiz, rel)
    if (entrada.tipo === 'semente') {
      if (!existsSync(caminho)) r.nota(`${rel}: a semente saiu do projeto (se foi de propósito, tire a linha do ${MANIFESTO})`)
      continue
    }
    if (!existsSync(caminho)) {
      r.achado(rel, 'o manifesto declara este arquivo conferido, e ele não está aqui', 'rode o --atualizar do esqueleto do /novo-projeto, da casa')
      continue
    }
    if (impressao(caminho) !== entrada.sha) {
      r.achado(rel, 'difere do que a fundação instalou: alguém editou um arquivo conferido', `${ondeMoraOAjuste(rel)}; para restaurar, rode o --atualizar do esqueleto do /novo-projeto`)
    }
  }

  // Arquivo a mais dentro de fundacao/ que o manifesto não conhece
  for (const rel of andar(join(raiz, 'fundacao'), { ignorar: [] }).map((x) => `fundacao/${x}`)) {
    if (rel === MANIFESTO || arquivos[rel] !== undefined) continue
    olhados += 1
    r.achado(rel, 'está dentro de fundacao/ e o manifesto não o conhece', 'o que é do projeto mora fora de fundacao/')
  }

  // O pulo de versão declarado
  const fixado = manifesto.fixado
  if (fixado) {
    const razao = String(fixado.razao ?? '').trim()
    if (razao.length < 5) {
      r.achado(MANIFESTO, 'fixado sem razão escrita: pular versão da fundação precisa de motivo', 'escreva em "fixado.razao" por que este projeto fica nesta versão, com a data')
    } else {
      r.nota(`fixado na fundação ${fixado.versao} desde ${fixado.data ?? 'data não dita'}: ${razao}`)
    }
  }

  // Todo conferidor tem linha no portão e prova plantada, nos dois sentidos
  const conferidores = lista(join(raiz, 'fundacao', 'portao'))
  const provas = lista(join(raiz, 'fundacao', 'provas'))
  if (conferidores.length > 0) {
    const portao = manifesto.portao
    if (!portao) {
      r.naoMedido(`o ${MANIFESTO} não diz onde o portão do projeto mora (campo "portao")`)
    } else if (!existsSync(join(raiz, portao))) {
      r.naoMedido(`não achei ${portao}, o portão declarado: sem ele não dá para saber se os conferidores rodam`)
    } else {
      const texto = readFileSync(join(raiz, portao), 'utf8')
      for (const nome of conferidores) {
        olhados += 1
        if (!texto.includes(`fundacao/portao/${nome}.mjs`)) {
          r.achado(`fundacao/portao/${nome}.mjs`, `nenhuma linha em ${portao} chama este conferidor: ele nunca roda`, `acrescente o passo "node fundacao/portao/${nome}.mjs" em ${portao}`)
        }
      }
    }
    for (const nome of conferidores) {
      if (!provas.includes(nome)) r.achado(`fundacao/portao/${nome}.mjs`, 'conferidor sem prova plantada: ninguém sabe se ele ainda reprova', `escreva fundacao/provas/${nome}.mjs com um caso vermelho e um verde`)
    }
    for (const nome of provas) {
      if (!conferidores.includes(nome)) r.achado(`fundacao/provas/${nome}.mjs`, 'prova de um conferidor que não existe', 'apague a prova, ou devolva o conferidor')
    }
  }

  // A versão contra a casa, quando ela está ao alcance
  const apontada = argumento(argv, '--fonte') ?? env.FUNDACAO_FONTE ?? null
  const casa = acharCasa(raiz, { fonte: apontada, env })
  if (!casa && apontada) {
    // A casa foi APONTADA e o kit não está onde esta cópia o procura: a fonte
    // mudou de lugar, e só a versão nova do conferidor sabe o endereço novo.
    r.naoMedido(`a casa apontada (${apontada}) não tem ${KIT_NA_CASA}: a fonte do esqueleto mudou de lugar; rode o --atualizar do esqueleto do /novo-projeto, da casa`)
  } else if (!casa) {
    r.nota('versão não comparável aqui: a casa (a fonte da fundação) não está ao alcance, e o projeto segue sem ela')
  } else {
    try {
      const kit = JSON.parse(readFileSync(join(casa, KIT_NA_CASA), 'utf8'))
      if (kit.versao !== manifesto.versao) {
        r.nota(`este projeto está na fundação ${manifesto.versao}, e a casa em ${kit.versao}: rode o --atualizar do esqueleto do /novo-projeto quando quiser`)
      }
    } catch (erro) {
      r.naoMedido(`não consegui ler ${KIT_NA_CASA} da casa: ${erro.message}`)
    }
    for (const [rel, entrada] of Object.entries(arquivos)) {
      if (!entrada.fonte) continue
      const fonte = join(casa, entrada.fonte)
      if (!existsSync(fonte)) continue
      const agora = impressao(fonte)
      if (entrada.tipo === 'semente' && agora !== entrada.origem) {
        r.nota(`${rel}: há versão nova na fonte (a sua é da ${entrada.versaoOrigem}); o --atualizar a traz se você não a editou, e se editou só mostra o diff`)
      } else if (entrada.tipo !== 'semente' && agora !== entrada.sha) {
        r.nota(`${rel}: o conferido mudou no workspace; rode o --atualizar do esqueleto do /novo-projeto`)
      }
    }
  }

  r.varreu(olhados)
  return r.fechar()
}

comoComando(import.meta.url, (raiz, contexto, opcoes) => conferir(raiz, contexto, opcoes))
