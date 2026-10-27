const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const { realizarBackupSnapshotPreUpdate } = require('./backupHelper.cjs');

const GITHUB_OWNER = 'eduardotertuliano21-cpu';
const GITHUB_REPO = 'Erp-Local-updater';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || Buffer.from('Z2l0aHViX3BhdF8xMUI1SVhKVVkwUFoxbmRnR2FsTkRuX0ZZd3dhSUJHREdGRGpYVDNTQlI3d0ZGanolbEkyTzhPZWN5RjNkSEkwcDRTNldLQU9EQTk3dW9Eak9q', 'base64').toString('utf-8');

function compararVersoes(v1, v2) {
  const parse = (v) => String(v || '').replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  const [maj1, min1, pat1] = parse(v1);
  const [maj2, min2, pat2] = parse(v2);
  if (maj1 !== maj2) return maj1 > maj2 ? 1 : -1;
  if (min1 !== min2) return min1 > min2 ? 1 : -1;
  if (pat1 !== pat2) return pat1 > pat2 ? 1 : -1;
  return 0;
}

function fetchLatestRelease(timeoutMs = 4500) {
  return new Promise((resolve) => {
    // 1. Tenta consultar a versão oficial gerenciada no Master Admin (clickstormsystems.com.br/admin)
    const cloudUrl = 'https://clickstormsystems.com.br/api/releases/latest';
    const reqCloud = https.get(cloudUrl, (res) => {
      let b = '';
      res.on('data', (c) => (b += c));
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(b);
            if (data && data.versao) {
              return resolve({
                tag_name: `v${data.versao}`,
                forcar: Boolean(data.forcarReinstalacao || data.obrigatoria),
                assets: [{ name: `ClickStorm_Setup_v${data.versao}.exe`, browser_download_url: data.downloadUrl }],
              });
            }
          } catch {}
        }
        fallbackGitHub();
      });
    });
    reqCloud.on('error', () => fallbackGitHub());
    reqCloud.setTimeout(2500, () => { reqCloud.destroy(); fallbackGitHub(); });

    function fallbackGitHub() {
      const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
      const req = https.get(
        url,
        {
          headers: {
            'User-Agent': 'ClickStorm-Boot-Updater',
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
          },
        },
        (res) => {
          let body = '';
          res.on('data', (c) => (body += c));
          res.on('end', () => {
            if (res.statusCode === 200) {
              try { resolve(JSON.parse(body)); } catch { resolve(null); }
            } else {
              resolve(null);
            }
          });
        }
      );
      req.on('error', () => resolve(null));
      req.setTimeout(timeoutMs, () => { req.destroy(); resolve(null); });
    }
  });
}

function downloadComProgresso(url, destino, onProgress) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(destino);

    const handleReq = (targetUrl, redirects = 0) => {
      if (redirects > 8) {
        fileStream.close();
        return reject(new Error('Muitos redirecionamentos'));
      }

      const client = targetUrl.startsWith('https') ? https : http;
      const opts = {
        headers: {
          'User-Agent': 'ClickStorm-Boot-Updater',
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/octet-stream',
        },
      };

      const req = client.get(targetUrl, opts, (res) => {
        if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
          return handleReq(res.headers.location, redirects + 1);
        }

        if (res.statusCode !== 200) {
          fileStream.close();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }

        const total = parseInt(res.headers['content-length'] || '0', 10);
        let recebido = 0;

        res.on('data', (chunk) => {
          recebido += chunk.length;
          if (total > 0 && onProgress) {
            const pct = Math.min(99, Math.round((recebido / total) * 100));
            onProgress(pct, recebido, total);
          }
        });

        res.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close(() => resolve());
        });
      });

      req.on('error', (err) => {
        fileStream.close();
        try { fs.unlinkSync(destino); } catch {}
        reject(err);
      });
    };

    handleReq(url);
  });
}

async function verificarEInstalarNoBoot({
  app,
  appVersion,
  userDataPath,
  sendSplashStatus,
  sendSplashProgress,
  onConcluido,
}) {
  try {
    sendSplashStatus('Verificando atualizações...');
    const release = await fetchLatestRelease(4500);

    if (!release || !release.tag_name) {
      onConcluido();
      return;
    }

    const tag = release.tag_name.trim();
    const versaoMaisRecente = tag.replace(/^v/i, '');
    const temUpdate = compararVersoes(versaoMaisRecente, appVersion) > 0 || Boolean(release.forcar);

    if (!temUpdate) {
      sendSplashStatus(`ClickStorm v${appVersion} • Atualizado`);
      setTimeout(() => onConcluido(), 300);
      return;
    }

    // Identifica o instalador executável .exe
    const assets = Array.isArray(release.assets) ? release.assets : [];
    const assetExe = assets.find((a) => a.name.endsWith('.exe')) || assets[0];

    if (!assetExe || !assetExe.browser_download_url) {
      onConcluido();
      return;
    }

    sendSplashStatus(`Nova versão ${tag} encontrada! Baixando...`);
    sendSplashProgress(5);

    const tempExe = path.join(os.tmpdir(), `ClickStorm_Setup_${tag}_${Date.now()}.exe`);

    await downloadComProgresso(assetExe.browser_download_url, tempExe, (pct) => {
      sendSplashProgress(pct);
      sendSplashStatus(`Baixando atualização: ${pct}%`);
    });

    sendSplashProgress(100);
    sendSplashStatus('Instalando atualização... Reiniciando sistema.');

    // Snapshot preventivo dos bancos antes de aplicar update
    try {
      realizarBackupSnapshotPreUpdate(userDataPath);
    } catch {}

    // Executa o instalador Inno Setup silenciosamente
    const child = spawn(tempExe, ['/SILENT', '/FORCECLOSEAPPLICATIONS'], {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();

    setTimeout(() => {
      app.exit(0);
    }, 600);
  } catch (err) {
    console.warn('[AutoUpdaterBoot] Erro na checagem ou download no boot:', err?.message);
    onConcluido();
  }
}

module.exports = {
  verificarEInstalarNoBoot,
  compararVersoes,
};
