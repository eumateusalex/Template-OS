#!/usr/bin/env node
// node .claude/skills/fabrica/scripts/confere-caracteres.mjs
//
// Classe de defeito: caractere de controle invisível dentro do código.
//
// 🚨 Uma regex escrita por heredoc fica com um BACKSPACE literal (0x08) no
// lugar de `\b`. O arquivo carrega, o teste do módulo passa, e a régua
// silenciosamente deixa de casar. Só aparece quando uma prova plantada espera
// verde e vem vermelho.
//
// É a armadilha "escape em heredoc corrompe regex", e a cura é escrever com
// ferramenta de arquivo, nunca por heredoc. Este
// conferidor é a rede embaixo dela.
//
// 🚨 ELE SÓ ACUSA, NUNCA CONSERTA: um `--limpar` que apaga todo caractere de
// controle come os separadores NUL que são de propósito (quatro, em quatro
// arquivos). Limpeza cega por byte não distingue o acidente da escolha. Quem conserta é
// quem escreveu a linha.

import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const SKILL = dirname(AQUI)

// Tudo abaixo de espaço, menos tab (9), quebra de linha (10) e retorno (13).
const CONTROLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g
const TEXTO = /\.(mjs|js|cjs|ts|md|json|ya?ml|py|txt|sh)$/

function andar (raiz, achados = []) {
  for (const item of readdirSync(raiz, { withFileTypes: true })) {
    const caminho = join(raiz, item.name)
    if (item.isDirectory()) andar(caminho, achados)
    else if (TEXTO.test(item.name)) achados.push(caminho)
  }
  return achados
}

export function conferir (raiz = SKILL, { escreve = console.log } = {}) {
  let sujos = 0
  let olhados = 0

  for (const caminho of andar(raiz)) {
    olhados += 1
    const texto = readFileSync(caminho, 'utf8')
    const encontrados = texto.match(CONTROLE)
    if (!encontrados) continue

    sujos += 1
    const onde = []
    texto.split('\n').forEach((linha, i) => {
      if (CONTROLE.test(linha)) onde.push(i + 1)
      CONTROLE.lastIndex = 0
    })
    const relativo = caminho.replace(`${raiz}\\`, '').replace(`${raiz}/`, '').split('\\').join('/')
    escreve(`  ✗ ${relativo}: ${encontrados.length} caractere(s) de controle, na(s) linha(s) ${onde.join(', ')}`)
  }

  if (olhados === 0) {
    escreve('  ✗ nada foi medido: nenhum arquivo de texto varrido')
    return 1
  }
  if (sujos > 0) {
    escreve(`✗ ${sujos} arquivo(s) com caractere invisível, em ${olhados} varrido(s).`)
    escreve('  Escreva regex com ferramenta de arquivo, nunca por heredoc.')
    escreve('  Conserte à mão: limpeza automática já comeu separador de propósito aqui.')
    return 1
  }
  escreve(`  ✓ caracteres: ${olhados} arquivo(s), nenhum caractere de controle`)
  return 0
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  process.exit(conferir(SKILL))
}
