import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electronAPI',
  {
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    getStoreData: () => ipcRenderer.invoke('get-store-data'),
    setStoreData: (data: any) => ipcRenderer.invoke('set-store-data', data),
    getFolderTree: (folderPath: string, hiddenList: string[]) =>
      ipcRenderer.invoke('get-folder-tree', folderPath, hiddenList),
    readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  }
);
