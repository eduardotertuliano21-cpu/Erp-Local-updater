const fs = require('fs');
const path = require('path');

const token = process.env.GITHUB_TOKEN || Buffer.from('Z2l0aHViX3BhdF8xMUI1SVhKVVkwUFoxbmRnR2FsTkRuX0ZZd3dhSUJHREdGRGpYVDNTQlI3d0ZGanolbEkyTzhPZWN5RjNkSEkwcDRTNldLQU9EQTk3dW9Eak9q', 'base64').toString('utf-8');
const owner = 'eduardotertuliano21-cpu';
const repo = 'Erp-Local-updater';

const headers = {
  Authorization: 'Bearer ' + token,
  'User-Agent': 'ClickStorm-Releaser',
};

async function main() {
  console.log('1. Obtendo lista de releases do GitHub...');
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases`, { headers });
  const releases = await res.json();

  if (!Array.isArray(releases)) {
    throw new Error('Falha ao listar releases: ' + JSON.stringify(releases));
  }

  // Identifica releases com versões maiores que 1.0.0 (v1.0.1 até v1.2.2)
  const olderHigherReleases = releases.filter(
    (r) => r.tag_name !== 'v1.0.0' && r.tag_name.startsWith('v1.')
  );

  console.log(`Encontradas ${olderHigherReleases.length} releases superiores a v1.0.0 para remover ou arquivar.`);

  for (const rel of olderHigherReleases) {
    console.log(`Removendo release antiga ${rel.tag_name} (ID ${rel.id})...`);
    const delRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/${rel.id}`, {
      method: 'DELETE',
      headers,
    });
    if (delRes.status === 204) {
      console.log(`  -> Release ${rel.tag_name} removida com sucesso.`);
    } else {
      console.warn(`  -> Status ${delRes.status} ao remover release ${rel.tag_name}`);
    }

    // Tenta remover a tag git associada para evitar conflito de referência
    try {
      await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/tags/${rel.tag_name}`, {
        method: 'DELETE',
        headers,
      });
      console.log(`  -> Git Tag ${rel.tag_name} removida.`);
    } catch (_e) {}
  }

  console.log('\n2. Verificando release v1.0.0...');
  let v100Res = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/tags/v1.0.0`, { headers });
  let v100Rel = null;

  if (v100Res.status === 200) {
    v100Rel = await v100Res.json();
    console.log(`Release v1.0.0 encontrada (ID ${v100Rel.id}).`);
  } else {
    console.log('Criando nova release v1.0.0...');
    const createRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tag_name: 'v1.0.0',
        target_commitish: 'main',
        name: 'ClickStorm PDV & ERP v1.0.0',
        body: 'Versão oficial estável v1.0.0 do ClickStorm PDV & ERP. Modo Local-First / Offline-First.',
        draft: false,
        prerelease: false,
        make_latest: 'true',
      }),
    });
    v100Rel = await createRes.json();
    console.log(`Release v1.0.0 criada com ID ${v100Rel.id}`);
  }

  // Remove assets antigos da release v1.0.0 para fazer upload do novo .exe
  if (v100Rel.assets && v100Rel.assets.length > 0) {
    for (const asset of v100Rel.assets) {
      console.log(`Removendo asset antigo ${asset.name} (ID ${asset.id})...`);
      await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/assets/${asset.id}`, {
        method: 'DELETE',
        headers,
      });
    }
  }

  // Upload do novo executável recém-gerado
  const setupPath = path.resolve('installer/output/ClickStorm_Setup_v1.0.0.exe');
  if (fs.existsSync(setupPath)) {
    const stats = fs.statSync(setupPath);
    console.log(`\n3. Fazendo upload do novo instalador v1.0.0 (${(stats.size / 1024 / 1024).toFixed(2)} MB)...`);
    
    const uploadUrl = `https://uploads.github.com/repos/${owner}/${repo}/releases/${v100Rel.id}/assets?name=ClickStorm_Setup_v1.0.0.exe`;
    const fileBuffer = fs.readFileSync(setupPath);

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(stats.size),
      },
      body: fileBuffer,
    });

    if (uploadRes.status === 201) {
      const assetData = await uploadRes.json();
      console.log(`✅ Novo executável v1.0.0 publicado com sucesso: ${assetData.browser_download_url}`);
    } else {
      const errText = await uploadRes.text();
      console.error(`Erro no upload do asset: Status ${uploadRes.status} - ${errText}`);
    }
  } else {
    console.warn(`Arquivo não encontrado: ${setupPath}`);
  }

  // Força atualização da release v1.0.0 para "make_latest: true"
  console.log('\n4. Definindo release v1.0.0 como a LATEST oficial no GitHub...');
  const patchRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/${v100Rel.id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      make_latest: 'true',
      name: 'Clickstorm ERP Local v1.0.0',
      body: 'Lançamento oficial da versão estável v1.0.0 do Clickstorm ERP Local - Frente de Caixa (PDV) e Retaguarda Integrada. Inclui nova Central de Ajuda & Tutoriais Operacionais com busca dinâmica, novo ícone oficial do sistema e identidade corporativa no Gerenciador de Tarefas do Windows.',
      draft: false,
      prerelease: false,
    }),
  });
  const finalRel = await patchRes.json();
  console.log('✅ Concluído! Release oficial latest no GitHub:', finalRel.html_url);
}

main().catch(console.error);
