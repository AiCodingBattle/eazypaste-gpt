"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld(
  "electronAPI",
  {
    selectFolder: () => electron.ipcRenderer.invoke("select-folder"),
    getStoreData: () => electron.ipcRenderer.invoke("get-store-data"),
    setStoreData: (data) => electron.ipcRenderer.invoke("set-store-data", data),
    getFolderTree: (folderPath, hiddenList) => electron.ipcRenderer.invoke("get-folder-tree", folderPath, hiddenList),
    getFolderContents: (folderPath, hiddenList) => electron.ipcRenderer.invoke("get-folder-contents", folderPath, hiddenList),
    readFile: (filePath) => electron.ipcRenderer.invoke("read-file", filePath),
    getRelativePath: (filePath, rootPath) => electron.ipcRenderer.invoke("get-relative-path", filePath, rootPath),
    getBasename: (filePath) => electron.ipcRenderer.invoke("get-basename", filePath),
    resetToDefaults: () => electron.ipcRenderer.invoke("reset-to-defaults"),
    openExternal: (url) => electron.shell.openExternal(url),
    startWatching: (folderPath) => electron.ipcRenderer.invoke("start-watching", folderPath),
    stopWatching: () => electron.ipcRenderer.invoke("stop-watching"),
    onFileCreated: (callback) => electron.ipcRenderer.on("file-created", (_, path) => callback(path)),
    onFileChanged: (callback) => {
      const listener = (_, path) => callback(path);
      electron.ipcRenderer.on("file-changed", listener);
      return () => electron.ipcRenderer.removeListener("file-changed", listener);
    },
    onFileDeleted: (callback) => electron.ipcRenderer.on("file-deleted", (_, path) => callback(path)),
    onDirCreated: (callback) => electron.ipcRenderer.on("dir-created", (_, path) => callback(path)),
    onDirDeleted: (callback) => electron.ipcRenderer.on("dir-deleted", (_, path) => callback(path)),
    removeFileWatchers: () => {
      electron.ipcRenderer.removeAllListeners("file-created");
      electron.ipcRenderer.removeAllListeners("file-changed");
      electron.ipcRenderer.removeAllListeners("file-deleted");
      electron.ipcRenderer.removeAllListeners("dir-created");
      electron.ipcRenderer.removeAllListeners("dir-deleted");
    },
    getFileContents: (filePath) => electron.ipcRenderer.invoke("get-file-contents", filePath)
  }
);
//# sourceMappingURL=preload.js.map
