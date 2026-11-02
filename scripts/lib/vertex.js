'use strict';
// O ACESSO À VERTEX AI: achar o gcloud e pedir o token efêmero, em memória.
//
// A fonte única do workspace para a Vertex: o gerar-imagem.js e o gerar-video.js
// pedem o token aqui. 🚨 O token nunca sai daqui para log nem para mensagem de erro.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// O primeiro `gcloud` que o PATH acha, com os nomes que o sistema executa.
function gcloudNoPath(env = process.env, plataforma = process.platform, existe = fs.existsSync) {
  const nomes = plataforma === 'win32' ? ['gcloud.cmd', 'gcloud.exe', 'gcloud.bat'] : ['gcloud'];
  for (const pasta of (env.PATH || '').split(path.delimiter).filter(Boolean)) {
    for (const nome of nomes) {
      const candidato = path.join(pasta, nome);
      if (existe(candidato)) return candidato;
    }
  }
  return null;
}

// 🚨 O GCLOUD_PATH vem PRIMEIRO, de propósito: o teste-gerar-imagem.mjs aponta
// para um gcloud falso por ele e roda sem a sua credencial. E a lista se monta
// na HORA de achar o gcloud, depois de o script ler o scripts/.env: montada ao
// carregar o módulo, o GCLOUD_PATH do .env (que a mensagem de erro manda usar)
// não valeria. Depois vem o `gcloud` do PATH, em qualquer sistema (é o que o
// terminal rodaria); os caminhos da instalação do Windows ficam por último, para
// o terminal aberto antes da instalação, que ainda não vê o PATH novo.
const gcloudCandidatos = (env = process.env, plataforma = process.platform) => [
  env.GCLOUD_PATH,
  gcloudNoPath(env, plataforma),
  ...(plataforma === 'win32' ? [
    path.join(env.LOCALAPPDATA || '', 'Google', 'Cloud SDK', 'google-cloud-sdk', 'bin', 'gcloud.cmd'),
    'C:\\Program Files (x86)\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd',
    'C:\\Program Files\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd',
  ] : []),
].filter(Boolean);

function acharGcloud(candidatos = gcloudCandidatos(), existe = fs.existsSync) {
  const encontrado = candidatos.find(p => existe(p));
  if (!encontrado) {
    throw new Error(
      'gcloud não encontrado (nem no GCLOUD_PATH, nem no PATH, nem na pasta da instalação do Windows). ' +
      'Instale a CLI do Google Cloud pelo guia oficial, https://cloud.google.com/sdk/docs/install ' +
      '(no Windows, winget install Google.CloudSDK; no macOS, brew install --cask google-cloud-sdk), ' +
      'abra um terminal novo, ou aponte GCLOUD_PATH no scripts/.env para o executável.'
    );
  }
  return encontrado;
}

/** O token da Vertex pelo gcloud. Vazio é erro: um Bearer vazio só falharia lá na
 *  frente, depois de montar e mandar o pedido, com uma mensagem que não diz o conserto. */
function tokenVertex({ gcloud = acharGcloud(), executar = execSync } = {}) {
  const login = `rode "${gcloud}" auth login e tente de novo`;
  let saida;
  try {
    // execSync com o caminho entre aspas, e não execFile: desde o Node 20 o
    // Windows recusa spawnar .cmd sem shell (EINVAL), e o caminho tem espaços.
    saida = executar(`"${gcloud}" auth print-access-token`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (erro) {
    throw new Error(`o gcloud não devolveu token · ${login} (${String(erro.message).split('\n')[0]})`);
  }
  const token = String(saida || '').trim();
  if (!token) throw new Error(`o gcloud devolveu token vazio · ${login}`);
  return token;
}

module.exports = { gcloudNoPath, gcloudCandidatos, acharGcloud, tokenVertex };
