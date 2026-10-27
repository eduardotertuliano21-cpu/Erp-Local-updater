const fs = require('fs');
const path = require('path');

function realizarBackupSnapshotPreUpdate(userDataPath) {
  try {
    const dataDir = path.join(userDataPath, 'data');
    if (!fs.existsSync(dataDir)) return { sucesso: false, motivo: 'Diretório data não existe' };

    const backupsDir = path.join(userDataPath, 'backups_auto');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const targetFolder = path.join(backupsDir, `pre_update_${timestamp}`);
    fs.mkdirSync(targetFolder, { recursive: true });

    const files = fs.readdirSync(dataDir);
    let copiedCount = 0;

    for (const file of files) {
      if (file.endsWith('.sqlite') || file.endsWith('.db') || file.endsWith('.sqlite-wal')) {
        const src = path.join(dataDir, file);
        const dst = path.join(targetFolder, file);
        if (fs.statSync(src).isFile()) {
          fs.copyFileSync(src, dst);
          copiedCount++;
        }
      }
    }

    console.log(`[Backup Pre-Update] ${copiedCount} bancos copiados com segurança para ${targetFolder}`);
    return { sucesso: true, destino: targetFolder, arquivos: copiedCount };
  } catch (err) {
    console.error('[Backup Pre-Update Erro]:', err);
    return { sucesso: false, erro: err.message };
  }
}

module.exports = {
  realizarBackupSnapshotPreUpdate,
};
