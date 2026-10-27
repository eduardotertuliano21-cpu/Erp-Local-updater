const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('splashBridge', {
  onUpdateStatus: (callback) => {
    ipcRenderer.on('update-status', (_event, msg) => callback(msg));
  },
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (_event, pct) => callback(pct));
  },
});
