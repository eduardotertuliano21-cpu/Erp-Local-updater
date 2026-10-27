const { rcedit } = require('rcedit');
const path = require('path');
const fs = require('fs');

async function patchExe(targetExePath) {
  const rootDir = path.resolve(__dirname, '..');
  const iconPath = path.join(rootDir, 'ERP.ico');
  const exePath = targetExePath
    ? path.resolve(targetExePath)
    : path.join(rootDir, 'node_modules', 'electron', 'dist', 'electron.exe');

  if (!fs.existsSync(exePath)) {
    console.error('[PatchExe] Executável não encontrado:', exePath);
    process.exit(1);
  }

  if (!fs.existsSync(iconPath)) {
    console.error('[PatchExe] Ícone não encontrado:', iconPath);
    process.exit(1);
  }

  console.log(`[PatchExe] Aplicando metadados e ícone ERP.ico em: ${exePath}`);

  try {
    await rcedit(exePath, {
      icon: iconPath,
      'file-version': '1.0.0',
      'product-version': '1.0.0',
      'version-string': {
        FileDescription: 'Clickstorm ERP Local',
        ProductName: 'Clickstorm ERP Local',
        InternalFilename: path.basename(exePath),
        OriginalFilename: path.basename(exePath),
        CompanyName: 'Clickstorm Technologies',
        LegalCopyright: 'Copyright © 2026 Clickstorm Technologies',
        Comments: 'Clickstorm ERP Local - Frente de Caixa e Retaguarda Integrados',
      },
    });
    console.log(`[PatchExe] ✅ Metadados e ícone aplicados com sucesso em: ${exePath}`);
  } catch (err) {
    console.error('[PatchExe] Erro ao aplicar rcedit:', err);
    process.exit(1);
  }
}

const target = process.argv[2];
patchExe(target).catch(console.error);
