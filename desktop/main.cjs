const { app, BrowserWindow, Menu, shell, ipcMain, nativeImage } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');
const { realizarBackupSnapshotPreUpdate } = require('./backupHelper.cjs');
const { verificarEInstalarNoBoot } = require('./autoUpdaterBoot.cjs');
const { initAndProtectDataDirectory } = require('./dataMigrationHelper.cjs');

// Nome do App e Identificador Windows para o Gerenciador de Tarefas e Notificações
app.name = 'Clickstorm ERP Local';
if (typeof app.setName === 'function') {
  app.setName('Clickstorm ERP Local');
}
if (process.platform === 'win32') {
  app.setAppUserModelId('com.clickstorm.erplocal');
}

// Trava de Instância Única
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// Otimizações de Renderização e Resposta Imediata de Teclado (GPU Rasterization)
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('disable-features', 'Translate,OptimizationHints');
app.commandLine.appendSwitch('disable-pdf-extension');
app.commandLine.appendSwitch('disable-print-preview');
app.commandLine.appendSwitch('js-flags', '--expose-gc');

// Coleta de Lixo (Garbage Collection) Periódica a cada 10 min
setInterval(() => {
  if (typeof global.gc === 'function') {
    try { global.gc(); } catch {}
  }
}, 10 * 60 * 1000);

let mainWindow = null, splashWindow = null, backendProcess = null, autoUpdater = null, appLaunched = false;

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

try {
  autoUpdater = require('electron-updater').autoUpdater;
} catch (err) {
  console.warn('[Desktop] autoUpdater indisponível:', err.message);
}

const PORT = 5000;
const HEALTH_URL = `http://localhost:${PORT}/health`;
const APP_URL = `http://localhost:${PORT}`;

function sendSplashStatus(msg) {
  if (splashWindow && !splashWindow.isDestroyed()) splashWindow.webContents.send('update-status', msg);
}

function sendSplashProgress(pct) {
  if (splashWindow && !splashWindow.isDestroyed()) splashWindow.webContents.send('download-progress', pct);
}

function checkBackendHealth() {
  return new Promise((resolve) => {
    const req = http.get(HEALTH_URL, (res) => resolve(res.statusCode === 200));
    req.on('error', () => resolve(false));
    req.setTimeout(800, () => { req.destroy(); resolve(false); });
  });
}

async function waitForBackend(maxAttempts = 40) {
  for (let i = 0; i < maxAttempts; i++) {
    if (await checkBackendHealth()) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

function startBackend() {
  const appDir = path.join(__dirname, '..');
  const candidates = [
    path.join(process.resourcesPath || '', 'app', 'dist', 'server.js'),
    path.join(appDir, 'backend', 'dist', 'server.js'),
    path.join(appDir, 'dist', 'server.js'),
  ];
  const serverPath = candidates.find((p) => fs.existsSync(p));
  const nodeCandidates = [
    path.join(process.resourcesPath || '', 'app', 'runtime', 'node.exe'),
    path.join(appDir, 'runtime', 'node.exe'),
  ];
  const nodeExe = nodeCandidates.find((p) => fs.existsSync(p)) || 'node';
  if (!serverPath) return;

  const { canonicalUserData, canonicalData } = initAndProtectDataDirectory(app, appDir);
  const logFile = path.join(canonicalUserData, 'backend.log');
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });

  const nodePath = [
    path.join(appDir, 'backend', 'node_modules'),
    path.join(appDir, 'node_modules'),
    process.env.NODE_PATH || '',
  ].filter(Boolean).join(path.delimiter);

  backendProcess = spawn(nodeExe, [serverPath], {
    cwd: path.dirname(serverPath),
    env: { ...process.env, PORT: String(PORT), CLICKSTORM_DATA_DIR: canonicalData, NODE_ENV: 'production', NODE_PATH: nodePath },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  if (backendProcess.stdout) backendProcess.stdout.pipe(logStream);
  if (backendProcess.stderr) backendProcess.stderr.pipe(logStream);
}

function getAppIcon() {
  const candidates = [
    path.join(__dirname, 'icon.ico'),
    path.join(__dirname, '..', 'ERP.ico'),
    path.join(process.resourcesPath || '', '..', 'ERP.ico'),
    path.join(process.resourcesPath || '', '..', 'icon.ico'),
    path.join(process.resourcesPath || '', 'app', 'desktop', 'icon.ico'),
    path.join(process.resourcesPath || '', 'app', 'icon.ico'),
    path.join(__dirname, 'icon.png'),
  ];
  const found = candidates.find((p) => fs.existsSync(p));
  const iconPath = found || path.join(__dirname, 'icon.ico');
  try {
    return nativeImage.createFromPath(iconPath);
  } catch {
    return iconPath;
  }
}

function createSplashWindow() {
  const icon = getAppIcon();
  splashWindow = new BrowserWindow({
    width: 500, height: 320, frame: false, resizable: false, center: true,
    alwaysOnTop: true, title: 'Clickstorm ERP Local', backgroundColor: '#0f172a', icon,
    webPreferences: { preload: path.join(__dirname, 'splashPreload.cjs'), nodeIntegration: false, contextIsolation: true },
  });
  splashWindow.loadFile(path.join(__dirname, 'splash.html')).catch(() => {});
}

function createMainWindow() {
  const windowTitle = `Clickstorm ERP Local v${app.getVersion()} - Sistema Comercial Integrado`;
  const icon = getAppIcon();
  mainWindow = new BrowserWindow({
    width: 1366, height: 768, minWidth: 1024, minHeight: 640,
    title: windowTitle,
    backgroundColor: '#f1f5f9', icon,
    autoHideMenuBar: true, show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), nodeIntegration: false, contextIsolation: true, spellcheck: false },
  });

  Menu.setApplicationMenu(null);
  mainWindow.loadURL(APP_URL).catch(() => {});

  mainWindow.on('page-title-updated', (e) => {
    e.preventDefault();
    mainWindow.setTitle(windowTitle);
  });

  mainWindow.webContents.on('did-fail-load', () => {
    setTimeout(() => { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.loadURL(APP_URL).catch(() => {}); }, 1000);
  });

  mainWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) { splashWindow.close(); splashWindow = null; }
    mainWindow.setTitle(windowTitle);
    try { mainWindow.setIcon(icon); } catch {}
    mainWindow.maximize();
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.control && input.shift && input.key.toLowerCase() === 'i') {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if ((url.startsWith('http:') || url.startsWith('https:')) && !url.includes(`localhost:${PORT}`)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

async function launchApp() {
  if (appLaunched) return;
  appLaunched = true;
  sendSplashStatus('Iniciando serviços locais...');
  if (!(await checkBackendHealth())) startBackend();
  await waitForBackend();
  createMainWindow();
}

function initBootstrapperAndUpdate() {
  verificarEInstalarNoBoot({
    app,
    appVersion: app.getVersion(),
    userDataPath: app.getPath('userData'),
    sendSplashStatus,
    sendSplashProgress,
    onConcluido: () => {
      launchApp();
    },
  });
}

app.whenReady().then(async () => {
  createSplashWindow();
  initBootstrapperAndUpdate();

  ipcMain.handle('get-app-version', () => app.getVersion());

  ipcMain.handle('restart-and-install', async () => {
    try {
      if (autoUpdater) {
        realizarBackupSnapshotPreUpdate(app.getPath('userData'));
        autoUpdater.quitAndInstall(false, true);
        return { sucesso: true };
      }
    } catch {}
    return { sucesso: false };
  });

  ipcMain.handle('check-for-updates', async () => {
    if (autoUpdater) {
      try { return await autoUpdater.checkForUpdates(); } catch {}
    }
    return null;
  });

  ipcMain.handle('executar-instalador-update', async (_e, { caminhoExe, silent = true }) => {
    try {
      if (!caminhoExe || !fs.existsSync(caminhoExe)) return { sucesso: false, erro: 'Instalador ausente' };
      realizarBackupSnapshotPreUpdate(app.getPath('userData'));
      if (backendProcess) { try { backendProcess.kill('SIGKILL'); } catch {} }
      const child = spawn(caminhoExe, silent ? ['/SILENT', '/FORCECLOSEAPPLICATIONS'] : [], { detached: true, stdio: 'ignore' });
      child.unref();
      setTimeout(() => app.exit(0), 600);
      return { sucesso: true };
    } catch (err) {
      return { sucesso: false, erro: err.message };
    }
  });

  ipcMain.handle('exportar-cardapio-pdf', async (_e, { html }) => {
    try {
      const win = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: false, contextIsolation: true } });
      await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
      const pdf = await win.webContents.printToPDF({ printBackground: true, pageSize: 'A4' });
      win.destroy();
      const fp = path.join(app.getPath('desktop'), `Cardapio_${Date.now()}.pdf`);
      fs.writeFileSync(fp, pdf);
      shell.showItemInFolder(fp);
      return { sucesso: true, caminho: fp, mensagem: 'Cardápio salvo na Área de Trabalho com sucesso!' };
    } catch (err) {
      return { sucesso: false, erro: err.message };
    }
  });

  ipcMain.handle('open-external', async (_e, url) => {
    try {
      if (url) await shell.openExternal(url);
      return { sucesso: true };
    } catch (e) {
      return { sucesso: false, erro: e.message };
    }
  });

  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createMainWindow(); });
});

app.on('window-all-closed', () => {
  if (backendProcess) { try { backendProcess.kill(); } catch {} }
  if (process.platform !== 'darwin') app.quit();
});
