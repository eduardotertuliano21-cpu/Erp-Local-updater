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

  const legacyCandidates = [
    path.join(appData, 'clickstorm-erp', 'data'),
    path.join(appData, 'ClickStorm PDV', 'data'),
  ];

  const canonicalSize = getDbSize(canonicalData, 'db_mercado.sqlite');

  // Se houver diretório legado com dados e o canônico estiver vazio ou menor
  for (const leg of legacyCandidates) {
    if (fs.existsSync(leg)) {
      const legSize = getDbSize(leg, 'db_mercado.sqlite');
      if (legSize > canonicalSize) {
        try {
          // Limpa WAL antigos antes de migrar
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

  // Apenas copia templates se NENHUM banco existir no diretório canônico
  const hasDb = fs.readdirSync(canonicalData).some((f) => f.endsWith('.sqlite'));
  if (!hasDb) {
    const templateDir = path.join(appDir, 'data');
    if (fs.existsSync(templateDir)) {
      try {
        for (const f of fs.readdirSync(templateDir)) {
          if (f.endsWith('.sqlite')) {
            fs.copyFileSync(path.join(templateDir, f), path.join(canonicalData, f));
          }
        }
      } catch {}
    }
  }

  return { canonicalUserData, canonicalData };
}

module.exports = { initAndProtectDataDirectory };
