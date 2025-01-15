"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld(
  "electronAPI",
  {
    selectFolder: () => electron.ipcRenderer.invoke("select-folder"),
    getStoreData: () => electron.ipcRenderer.invoke("get-store-data"),
    setStoreData: (data) => electron.ipcRenderer.invoke("set-store-data", data),
    getFolderTree: (folderPath, hiddenList) => electron.ipcRenderer.invoke("get-folder-tree", folderPath, hiddenList),
    readFile: (filePath) => electron.ipcRenderer.invoke("read-file", filePath)
  }
);
//# sourceMappingURL=preload.js.map
