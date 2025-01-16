import { contextBridge, ipcRenderer, shell } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electronAPI',
  {
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    getStoreData: () => ipcRenderer.invoke('get-store-data'),
    setStoreData: (data: any) => ipcRenderer.invoke('set-store-data', data),
    getFolderTree: (folderPath: string, hiddenList: string[], reverseHiddenMode: boolean, searchWords: string[]) =>
      ipcRenderer.invoke('get-folder-tree', folderPath, hiddenList, reverseHiddenMode, searchWords),
    getFolderContents: (folderPath: string, hiddenList: string[], reverseHiddenMode: boolean, searchWords: string[]) =>
      ipcRenderer.invoke('get-folder-contents', folderPath, hiddenList, reverseHiddenMode, searchWords),
    readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
    getRelativePath: (filePath: string, rootPath: string) =>
      ipcRenderer.invoke('get-relative-path', filePath, rootPath),
    getBasename: (filePath: string) =>
      ipcRenderer.invoke('get-basename', filePath),
    resetToDefaults: () => ipcRenderer.invoke('reset-to-defaults'),
    openExternal: (url: string) => shell.openExternal(url),
    startWatching: (folderPath: string) => ipcRenderer.invoke('start-watching', folderPath),
    stopWatching: () => ipcRenderer.invoke('stop-watching'),
    onFileCreated: (callback: (path: string) => void) => ipcRenderer.on('file-created', (_, path) => callback(path)),
    onFileChanged: (callback: (path: string) => void) => {
      const listener = (_: any, path: string) => callback(path);
      ipcRenderer.on('file-changed', listener);
      return () => ipcRenderer.removeListener('file-changed', listener);
    },
    onFileDeleted: (callback: (path: string) => void) => ipcRenderer.on('file-deleted', (_, path) => callback(path)),
    onDirCreated: (callback: (path: string) => void) => ipcRenderer.on('dir-created', (_, path) => callback(path)),
    onDirDeleted: (callback: (path: string) => void) => ipcRenderer.on('dir-deleted', (_, path) => callback(path)),
    removeFileWatchers: () => {
      ipcRenderer.removeAllListeners('file-created');
      ipcRenderer.removeAllListeners('file-changed');
      ipcRenderer.removeAllListeners('file-deleted');
      ipcRenderer.removeAllListeners('dir-created');
      ipcRenderer.removeAllListeners('dir-deleted');
    },
    getFileContents: (filePath: string) => ipcRenderer.invoke('get-file-contents', filePath),
  }
);
