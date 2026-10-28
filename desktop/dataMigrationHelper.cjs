const fs = require('fs');
const path = require('path');

function getDbSize(dir, dbName) {
  const p = path.join(dir, dbName);
  try {
    return fs.existsSync(p) ? fs.statSync(p).size : 0;
  } catch {
    return 0;
  }
}

function initAndProtectDataDirectory(app, appDir) {
  const appData = app.getPath('appData');
  const canonicalUserData = path.join(appData, 'Clickstorm ERP Local');
  const canonicalData = path.join(canonicalUserData, 'data');

  if (!fs.existsSync(canonicalData)) {
    fs.mkdirSync(canonicalData, { recursive: true });
  }

  // Detectar e unificar arquivos duplicados pelo Windows tipo "db_mercado (2).sqlite"
  try {
    for (const f of fs.readdirSync(canonicalData)) {
      const match = f.match(/^(.+?)\s*\(\d+\)\.sqlite$/);
      if (match) {
        const baseName = match[1] + '.sqlite';
        const dupPath = path.join(canonicalData, f);
        const basePath = path.join(canonicalData, baseName);
        const dupSize = getDbSize(canonicalData, f);
        const baseSize = getDbSize(canonicalData, baseName);
        if (dupSize > baseSize) {
          try { fs.unlinkSync(basePath + '-wal'); } catch {}
          try { fs.unlinkSync(basePath + '-shm'); } catch {}
          fs.copyFileSync(dupPath, basePath);
          console.log(`[DataMigration] Restaurado ${baseName} a partir da cópia ${f} (${dupSize} bytes)`);
        }
      }
    }
  } catch (e) {
    console.warn('[DataMigration] Erro ao unificar duplicatas:', e.message);
  }

  const legacyCandidates = [
    path.join(appData, 'clickstorm-erp', 'data'),
    path.join(appData, 'ClickStorm PDV', 'data'),
  ];

  const canonicalSize = getDbSize(canonicalData, 'db_mercado.sqlite');

  // Migração de diretórios legados SOMENTE se o banco canônico NÃO existir (canonicalSize === 0)
  if (canonicalSize === 0) {
    for (const leg of legacyCandidates) {
      if (fs.existsSync(leg)) {
        const legSize = getDbSize(leg, 'db_mercado.sqlite');
        if (legSize > 0) {
          try {
            for (const f of fs.readdirSync(canonicalData)) {
              if (f.endsWith('-wal') || f.endsWith('-shm')) {
                try { fs.unlinkSync(path.join(canonicalData, f)); } catch {}
              }
            }
            const files = fs.readdirSync(leg);
            for (const f of files) {
              if (f.endsWith('.sqlite')) {
                fs.copyFileSync(path.join(leg, f), path.join(canonicalData, f));
              }
            }
            console.log(`[DataMigration] Migrados bancos com sucesso de ${leg} para ${canonicalData}`);
            break;
          } catch (e) {
            console.error('[DataMigration] Erro ao migrar dados legados:', e.message);
          }
        }
      }
    }
  }

  // Snapshot de segurança diário/boot
  try {
    const backupDir = path.join(canonicalUserData, 'backups_auto', 'boot_snapshot');
    fs.mkdirSync(backupDir, { recursive: true });
    for (const f of fs.readdirSync(canonicalData)) {
      if (f.endsWith('.sqlite')) {
        fs.copyFileSync(path.join(canonicalData, f), path.join(backupDir, f));
      }
    }
  } catch {}

  // Copia templates dos bancos que não existirem no diretório canônico (instalação nova ou banco ausente)
  const templateDir = path.join(appDir, 'data');
  if (fs.existsSync(templateDir)) {
    try {
      for (const f of fs.readdirSync(templateDir)) {
        if (f.endsWith('.sqlite')) {
          const dest = path.join(canonicalData, f);
          const cSize = getDbSize(canonicalData, f);
          if (!fs.existsSync(dest) || cSize === 0) {
            fs.copyFileSync(path.join(templateDir, f), dest);
            console.log(`[DataMigration] Banco inicial ${f} copiado para ${canonicalData}`);
          }
        }
      }
    } catch {}
  }

  return { canonicalUserData, canonicalData };
}

module.exports = { initAndProtectDataDirectory };
