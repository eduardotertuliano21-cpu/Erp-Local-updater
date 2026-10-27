const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const conf = `server {
  listen 80;
  listen [::]:80;
  server_name clickstormsystems.com.br www.clickstormsystems.com.br;

  location / {
    proxy_pass http://clickstorm_systems_site:80;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
`;

  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/home/eduardo/apps/sites/clickstormsystems/nginx_proxy.conf');
    writeStream.write(conf);
    writeStream.end(() => {
      conn.exec('sudo -S cp /home/eduardo/apps/sites/clickstormsystems/nginx_proxy.conf /home/eduardo/apps/proxy/data/nginx/proxy_host/3.conf && docker exec proxy-app-1 nginx -s reload', (execErr, stream) => {
        if (execErr) throw execErr;
        stream.write('2111993@Edu\n');
        stream.on('close', () => {
          console.log('Nginx configurado e recarregado com sucesso!');
          conn.end();
        }).on('data', d => process.stdout.write(d))
          .stderr.on('data', d => process.stderr.write(d));
      });
    });
  });
}).connect({
  host: '192.168.3.123',
  port: 22,
  username: 'eduardo',
  password: '2111993@Edu'
});
