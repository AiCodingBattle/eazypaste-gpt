import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import Store from 'electron-store';
import fs from 'fs';
import fsExtra from 'fs-extra';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Disable GPU acceleration to avoid cache issues
app.disableHardwareAcceleration();
// Disable GPU cache
app.commandLine.appendSwitch('disable-gpu-cache');

// Initialize store for local data
const store = new Store({
  name: 'eazypaste-config',
  defaults: {
    lastFolderPath: '',
    hiddenList: ['.git', '.vscode', 'dist-electron', 'node_modules', 'package-lock.json'],
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

  const getFilesRecursively = async (dir: string): Promise<any[]> => {
    const items = await fsExtra.readdir(dir, { withFileTypes: true });
    const result = [];

    for (const item of items) {
      // Skip hidden items
      if (hiddenList.some(hidden => item.name.includes(hidden))) continue;

      const itemPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        // For directories, recursively get contents
        const children = await getFilesRecursively(itemPath);
        // Only add directory if it has visible children or is empty
        result.push({
          n: item.name,
          p: itemPath,
          d: true,
          c: children // Add children directly to the directory node
        });
      } else {
        result.push({
          n: item.name,
          p: itemPath,
          d: false
        });
      }
    }

    return result;
  };

  try {
    return await getFilesRecursively(folderPath);
  } catch (error) {
    console.error('Error reading folder structure:', error);
    return [];
  }
});

// 5) Get folder contents (for dynamic loading)
ipcMain.handle('get-folder-contents', async (_, folderPath: string, hiddenList: string[]) => {
  if (!folderPath) return [];

  try {
    const items = await fsExtra.readdir(folderPath, { withFileTypes: true });
    const contents = [];

    for (const item of items) {
      // Skip hidden items
      if (hiddenList.some(hidden => item.name.includes(hidden))) continue;

      const itemPath = path.join(folderPath, item.name);
      // Ensure we only send serializable data
      contents.push({
        name: String(item.name),
        path: String(itemPath),
        isDirectory: Boolean(item.isDirectory()),
        type: item.isDirectory() ? 'directory' : 'file'
      });
    }

    // Log the data being sent
    console.log('Sending folder contents:', JSON.stringify(contents));
    return contents;
  } catch (error) {
    console.error('Error reading folder contents:', error);
    return [];
  }
});

// 6) Read file content
ipcMain.handle('read-file', async (_, filePath: string) => {
  try {
    const content = await fsExtra.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error('Error reading file', filePath, error);
    return '';
  }
});

// Add path operations handler
ipcMain.handle('get-relative-path', async (_, filePath: string, rootPath: string) => {
  return path.relative(rootPath, filePath);
});

ipcMain.handle('get-basename', async (_, filePath: string) => {
  return path.basename(filePath);
});
