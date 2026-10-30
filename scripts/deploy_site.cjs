const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const LOCAL_DIST = path.join(__dirname, '..', 'Site', 'dist');
const LOCAL_API = path.join(__dirname, '..', 'master-admin', 'backend');
const REMOTE_PATH = '/home/eduardo/apps/sites/clickstormsystems';
const REMOTE_API = '/home/eduardo/apps/sites/clickstormsystems_api';

console.log('⚡ [Deploy] Compilando React Landing Page em Site/dist...');
execSync('npm run build', { cwd: path.join(__dirname, '..', 'Site'), stdio: 'inherit' });

console.log('⚡ [Deploy] Compilando Frontend ERP Completo para /portal...');
const portalOutDir = path.join(__dirname, '..', 'Site', 'dist', 'portal');
if (!fs.existsSync(portalOutDir)) {
  fs.mkdirSync(portalOutDir, { recursive: true });
}
execSync('npx vite build --base=/portal/ --outDir ../Site/dist/portal --emptyOutDir', {
  cwd: path.join(__dirname, '..', 'frontend'),
  stdio: 'inherit',
  env: { ...process.env, VITE_BASE: '/portal/' },
});

console.log('📡 [Deploy] Conectando via SSH ao servidor 192.168.3.123...');
const conn = new Client();

function execRemote(cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', (d) => { out += d.toString(); });
      stream.stderr.on('data', (d) => { out += d.toString(); });
      stream.on('close', () => resolve(out));
    });
  });
}

async function uploadDir(sftp, localDir, remoteDir) {
  const files = await fs.promises.readdir(localDir);
  for (const file of files) {
    if (file === 'node_modules' || file === 'dist' || file === 'data' || file.startsWith('.')) continue;
    const localFilePath = path.join(localDir, file);
    const remoteFilePath = `${remoteDir}/${file}`.replace(/\\/g, '/');
    const stats = fs.statSync(localFilePath);

    if (stats.isDirectory()) {
      await new Promise((res) => sftp.mkdir(remoteFilePath, () => res()));
      await uploadDir(sftp, localFilePath, remoteFilePath);
    } else {
      await new Promise((res, rej) => {
        sftp.fastPut(localFilePath, remoteFilePath, (e) => {
          if (e) {
            fs.readFile(localFilePath, (readErr, data) => {
              if (readErr) return rej(new Error(`Erro ao ler ${file}: ${readErr.message}`));
              sftp.writeFile(remoteFilePath, data, (writeErr) => {
                if (writeErr) return rej(new Error(`Erro ao escrever ${file}: ${writeErr.message}`));
                console.log(`  ✓ ${file} (fallback)`);
                res();
              });
            });
            return;
          }
          console.log(`  ✓ ${file}`);
          res();
        });
      });
    }
  }
}

conn.on('ready', async () => {
  console.log('🚀 [Deploy] Iniciando envio dos arquivos estáticos e API Master Admin...');
  conn.sftp(async (err, sftp) => {
    if (err) {
      console.error(err);
      conn.end();
      return;
    }
    try {
      await execRemote(`echo '2111993@Edu' | sudo -S chown -R eduardo:eduardo /home/eduardo/apps/sites && mkdir -p ${REMOTE_PATH} ${REMOTE_API}/src ${REMOTE_API}/data`);
      await uploadDir(sftp, LOCAL_DIST, REMOTE_PATH);
      await uploadDir(sftp, LOCAL_API, REMOTE_API);

      const localEnvPath = path.join(LOCAL_API, '.env');
      if (fs.existsSync(localEnvPath)) {
        await new Promise((res, rej) => {
          sftp.fastPut(localEnvPath, `${REMOTE_API}/.env`, (e) => (e ? rej(e) : res()));
        });
        console.log('  ✓ .env com chaves seguras do Stripe enviado ao servidor');
      }

      const nginxConf = [
        'server {',
        '    listen 80;',
        '    server_name localhost;',
        '    root /usr/share/nginx/html;',
        '    index index.html index.htm;',
        '',
        '    location /api/ {',
        '        proxy_pass http://clickstorm_master_api:4000/api/;',
        '        proxy_http_version 1.1;',
        '        proxy_set_header Host $host;',
        '        proxy_set_header X-Real-IP $remote_addr;',
        '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;',
        '        proxy_set_header X-Forwarded-Proto $scheme;',
        '    }',
        '',
        '    location /portal/ {',
        '        try_files $uri $uri/ /portal/index.html;',
        '    }',
        '',
        '    location /portal {',
        '        try_files $uri $uri/ /portal/index.html;',
        '    }',
        '',
        '    location / {',
        '        try_files $uri $uri/ /index.html;',
        '    }',
        '}'
      ].join('\n');

      await new Promise((res, rej) => {
        sftp.writeFile(`${REMOTE_API}/nginx_site.conf`, nginxConf, (e) => (e ? rej(e) : res()));
      });

      console.log('🐳 [Deploy] Configurando container clickstorm_master_api e Nginx...');
      const setupCmd = [
        `docker rm -f clickstorm_master_api >/dev/null 2>&1 || true`,
        `docker run -d --name clickstorm_master_api --restart unless-stopped --network proxy_default --env-file ${REMOTE_API}/.env -v ${REMOTE_API}:/app -w /app node:22-alpine sh -c "npm install && npx tsx src/server.ts"`,
        `docker exec clickstorm_systems_site nginx -s reload`
      ].join(' && ');

      const out = await execRemote(setupCmd);
      console.log(out.trim());
      console.log('✅ [Deploy Concluído]: Site + Rota /admin + API Master Admin ativos em clickstormsystems.com.br!');
    } catch (uploadErr) {
      console.error('❌ [Deploy Erro]:', uploadErr);
      conn.end();
      process.exit(1);
    } finally {
      conn.end();
      process.exit(0);
    }
  });
}).connect({
  host: '192.168.3.123',
  port: 22,
  username: 'eduardo',
  password: '2111993@Edu'
});
