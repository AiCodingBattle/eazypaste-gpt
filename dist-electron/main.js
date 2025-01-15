import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import Store from "electron-store";
import fs from "fs";
import fsExtra from "fs-extra";
import { glob } from "glob";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.disableHardwareAcceleration();
app.commandLine.appendSwitch("disable-gpu-cache");
const store = new Store({
  name: "eazypaste-config",
  defaults: {
    lastFolderPath: "",
    hiddenList: [".git", "node_modules", ".env"],
    introRules: "Your default intro/rules text here...",
    selectedFiles: [],
    userTask: ""
  }
});
let mainWindow = null;
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  {
    mainWindow.loadURL("http://localhost:5173");
  }
}
app.whenReady().then(async () => {
  await createWindow();
  app.on("activate", function() {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on("window-all-closed", function() {
  if (process.platform !== "darwin") app.quit();
});
ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"]
  });
  if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
    store.set("lastFolderPath", result.filePaths[0]);
    return result.filePaths[0];
  }
  return null;
});
ipcMain.handle("get-store-data", async () => {
  return {
    lastFolderPath: store.get("lastFolderPath"),
    hiddenList: store.get("hiddenList"),
    introRules: store.get("introRules"),
    selectedFiles: store.get("selectedFiles"),
    userTask: store.get("userTask")
  };
});
ipcMain.handle("set-store-data", async (_, data) => {
  Object.entries(data).forEach(([key, value]) => {
    store.set(key, value);
  });
});
ipcMain.handle("get-folder-tree", async (_, folderPath, hiddenList) => {
  if (!folderPath) return [];
  const result = [];
  try {
    const files = await glob("**/*", {
      cwd: folderPath,
      dot: true,
      // so we can see hidden items, then manually exclude them
      nodir: false
      // include directories
    });
    const filteredFiles = files.filter((f) => {
      return !hiddenList.some((hidden) => f.includes(hidden));
    });
    for (const file of filteredFiles) {
      const parts = file.split(path.sep);
      let currentLevel = result;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const fullPath = path.join(folderPath, parts.slice(0, i + 1).join(path.sep));
        let existing = currentLevel.find((item) => item.name === part);
        if (!existing) {
          let isDir = false;
          try {
            const stats = fs.statSync(fullPath);
            isDir = stats.isDirectory();
          } catch (error) {
            console.error(`Error checking path ${fullPath}:`, error);
            continue;
          }
          existing = {
            name: part,
            path: fullPath,
            children: [],
            isDirectory: isDir,
            type: isDir ? "directory" : "file"
          };
          currentLevel.push(existing);
        }
        currentLevel = existing.children;
      }
    }
    const safeResult = result.map((item) => ({
      name: item.name,
      path: item.path,
      children: item.children,
      isDirectory: item.isDirectory,
      type: item.type
    }));
    return safeResult;
  } catch (error) {
    console.error("Error building folder tree:", error);
    throw new Error("Failed to build folder tree");
  }
});
ipcMain.handle("read-file", async (_, filePath) => {
  try {
    const content = await fsExtra.readFile(filePath, "utf-8");
    return content;
  } catch (error) {
    console.error("Error reading file", filePath, error);
    return "";
  }
});
//# sourceMappingURL=main.js.map
