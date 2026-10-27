const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopBridge', {
  isDesktop: true,
  platform: process.platform,
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  restartAndInstall: () => ipcRenderer.invoke('restart-and-install'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  onUpdateAvailable: (callback) => {
    const fn = (_event, info) => callback(info);
    ipcRenderer.on('update-available', fn);
    return () => ipcRenderer.removeListener('update-available', fn);
  },
  onUpdateDownloaded: (callback) => {
    const fn = (_event, info) => callback(info);
    ipcRenderer.on('update-downloaded', fn);
    return () => ipcRenderer.removeListener('update-downloaded', fn);
  },
  onDownloadProgress: (callback) => {
    const fn = (_event, prog) => callback(prog);
    ipcRenderer.on('download-progress', fn);
    return () => ipcRenderer.removeListener('download-progress', fn);
  },
  exportarCardapioPdf: (payload) => ipcRenderer.invoke('exportar-cardapio-pdf', payload),
  executarInstaladorUpdate: (payload) => ipcRenderer.invoke('executar-instalador-update', payload),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
});
