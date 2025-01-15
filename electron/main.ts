import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import Store from 'electron-store';
import fs from 'fs';
import fsExtra from 'fs-extra';
import { glob } from 'glob';

// Initialize store for local data
const store = new Store({
  name: 'eazypaste-config',
  defaults: {
    lastFolderPath: '',
    hiddenList: ['.git', 'node_modules', '.env'],
    introRules: 'Your default intro/rules text here...',
    selectedFiles: [] as string[],
    userTask: '',
  },
});

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load your Vite dev server or the built index.html
  if (import.meta.env.MODE === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(async () => {
  await createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Graceful shutdown
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

/* IPC Handlers */

// 1) Open folder dialog
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });

  if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
    store.set('lastFolderPath', result.filePaths[0]);
    return result.filePaths[0];
  }
  return null;
});

// 2) Get stored data
ipcMain.handle('get-store-data', async () => {
  return {
    lastFolderPath: store.get('lastFolderPath'),
    hiddenList: store.get('hiddenList'),
    introRules: store.get('introRules'),
    selectedFiles: store.get('selectedFiles'),
    userTask: store.get('userTask'),
  };
});

// 3) Set store data
ipcMain.handle('set-store-data', async (_, data: any) => {
  // data should be an object containing keys that exist in the store
  Object.entries(data).forEach(([key, value]) => {
    store.set(key, value);
  });
});

// 4) Get folder tree structure (excluding hidden items)
ipcMain.handle('get-folder-tree', async (_, folderPath: string, hiddenList: string[]) => {
  if (!folderPath) return [];
  const result: any[] = [];

  // Use glob or custom recursion to build a tree.
  const files = await glob('**/*', {
    cwd: folderPath,
    dot: true, // so we can see hidden items, then manually exclude them
  });

  const filteredFiles = files.filter((f) => {
    // Exclude any path that starts with or includes hiddenList items
    // For simplicity, let's just check if any hiddenList item is in the path
    return !hiddenList.some((hidden) => f.includes(hidden));
  });

  // Build a nested structure
  filteredFiles.forEach((file) => {
    // Split into parts
    const parts = file.split(path.sep);
    let currentLevel = result;

    for (const part of parts) {
      let existing = currentLevel.find((item) => item.name === part);
      if (!existing) {
        existing = {
          name: part,
          path: path.join(folderPath, parts.slice(0, parts.indexOf(part) + 1).join(path.sep)),
          children: [],
          isDirectory: fs.existsSync(
            path.join(folderPath, parts.slice(0, parts.indexOf(part) + 1).join(path.sep))
          )
            ? fs.lstatSync(
                path.join(folderPath, parts.slice(0, parts.indexOf(part) + 1).join(path.sep))
              ).isDirectory()
            : false,
        };
        currentLevel.push(existing);
      }
      currentLevel = existing.children;
    }
  });

  return result;
});

// 5) Read file content
ipcMain.handle('read-file', async (_, filePath: string) => {
  try {
    const content = await fsExtra.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error('Error reading file', filePath, error);
    return '';
  }
});
