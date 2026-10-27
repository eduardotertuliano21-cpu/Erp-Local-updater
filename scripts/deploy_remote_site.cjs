const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const compose = `services:
  website:
    image: nginx:alpine
    container_name: clickstorm_systems_site
    restart: unless-stopped
    volumes:
      - /home/eduardo/apps/sites/clickstormsystems:/usr/share/nginx/html:ro
    networks:
      - proxy_default

networks:
  proxy_default:
    external: true
`;

  conn.sftp((err, sftp) => {
    if (err) throw err;
    const stream = sftp.createWriteStream('/home/eduardo/apps/sites/clickstormsystems/docker-compose.yml');
    stream.write(compose);
    stream.end(() => {
      conn.exec('cd /home/eduardo/apps/sites/clickstormsystems && docker compose up -d', (execErr, execStream) => {
        if (execErr) throw execErr;
        execStream.on('close', () => {
          console.log('Container subido com sucesso!');
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
