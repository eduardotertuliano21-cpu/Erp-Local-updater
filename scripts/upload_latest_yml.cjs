const fs = require('fs');
const crypto = require('crypto');

const { execSync } = require('child_process');
function getGitHubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    const url = execSync('git config --get remote.origin.url', { encoding: 'utf-8' });
    const m = url.match(/https:\/\/([^@]+)@github\.com/);
    if (m) return m[1];
  } catch {}
  return '';
}
const token = getGitHubToken();
const owner = 'eduardotertuliano21-cpu';
const repo = 'Erp-Local-updater';

async function run() {
  const fileBytes = fs.readFileSync('installer/output/ClickStorm_Setup_v1.0.0.exe');
  const sha512 = crypto.createHash('sha512').update(fileBytes).digest('base64');
  const assetName = 'ClickStorm_Setup_v1.0.0.exe';
  const nowIso = new Date().toISOString();

  const latestYmlText = `version: 1.0.0\r\nfiles:\r\n  - url: ${assetName}\r\n    sha512: ${sha512}\r\n    size: ${fileBytes.length}\r\npath: ${assetName}\r\nsha512: ${sha512}\r\nreleaseDate: '${nowIso}'\r\n`;

  const relRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/tags/v1.0.0`, {
    headers: { Authorization: 'Bearer ' + token, 'User-Agent': 'ClickStorm' }
  });
  const rel = await relRes.json();
  
  const existing = rel.assets ? rel.assets.find(a => a.name === 'latest.yml') : null;
  if (existing) {
    await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/assets/${existing.id}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token, 'User-Agent': 'ClickStorm' }
    });
  }

  const uploadUrl = `https://uploads.github.com/repos/${owner}/${repo}/releases/${rel.id}/assets?name=latest.yml`;
  const upRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'User-Agent': 'ClickStorm',
      'Content-Type': 'application/x-yaml',
      'Content-Length': String(Buffer.byteLength(latestYmlText))
    },
    body: latestYmlText
  });
  console.log('Status upload latest.yml:', upRes.status);
  if (upRes.status === 201) {
    console.log('✅ latest.yml publicado com sucesso no GitHub Release v1.0.0!');
  }
}

run().catch(console.error);
