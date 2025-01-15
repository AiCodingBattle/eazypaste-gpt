"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld(
  "electronAPI",
  {
    selectFolder: () => electron.ipcRenderer.invoke("select-folder"),
    getStoreData: () => electron.ipcRenderer.invoke("get-store-data"),
    setStoreData: (data) => electron.ipcRenderer.invoke("set-store-data", data),
    getFolderTree: (folderPath, hiddenList) => electron.ipcRenderer.invoke("get-folder-tree", folderPath, hiddenList),
    readFile: (filePath) => electron.ipcRenderer.invoke("read-file", filePath),
    getRelativePath: (filePath, rootPath) => electron.ipcRenderer.invoke("get-relative-path", filePath, rootPath),
    getBasename: (filePath) => electron.ipcRenderer.invoke("get-basename", filePath)
  }
);
//# sourceMappingURL=preload.js.map
