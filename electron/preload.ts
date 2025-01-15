import { contextBridge, ipcRenderer, shell } from 'electron';

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
    getFolderContents: (folderPath: string, hiddenList: string[]) =>
      ipcRenderer.invoke('get-folder-contents', folderPath, hiddenList),
    readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
    getRelativePath: (filePath: string, rootPath: string) =>
      ipcRenderer.invoke('get-relative-path', filePath, rootPath),
    getBasename: (filePath: string) =>
      ipcRenderer.invoke('get-basename', filePath),
    resetToDefaults: () => ipcRenderer.invoke('reset-to-defaults'),
    openExternal: (url: string) => shell.openExternal(url),
  }
);
