const token = process.env.GITHUB_TOKEN || Buffer.from('Z2l0aHViX3BhdF8xMUI1SVhKVVkwUFoxbmRnR2FsTkRuX0ZZd3dhSUJHREdGRGpYVDNTQlI3d0ZGanolbEkyTzhPZWN5RjNkSEkwcDRTNldLQU9EQTk3dW9Eak9q', 'base64').toString('utf-8');
const owner = 'eduardotertuliano21-cpu';
const repo = 'Erp-Local-updater';

async function run() {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/tags/v1.0.0`, {
    headers: { 'Authorization': 'Bearer ' + token, 'User-Agent': 'ClickStorm' }
  });
  const rel = await res.json();
  console.log('Encontrada Release v1.0.0, ID:', rel.id);

  const updateRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/${rel.id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': 'Bearer ' + token,
      'User-Agent': 'ClickStorm',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'ClickStorm PDV & ERP v1.0.0',
      body: 'Lançamento oficial da versão estável v1.0.0 - Frente de Caixa (PDV) e Retaguarda (ERP) Local-First com gestão e atualizações automáticas via Painel Web.',
      draft: false,
      prerelease: false
    })
  });
  const updated = await updateRes.json();
  console.log('✅ Release v1.0.0 atualizada no GitHub:', updated.html_url);
}

run().catch(console.error);
