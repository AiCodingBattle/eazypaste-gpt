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

  try {
    // Get all files and directories
    const files = await glob('**/*', {
      cwd: folderPath,
      dot: true,
    });

    // Filter out hidden items
    const filtered = files.filter((f) => {
      return !hiddenList.some((hidden) => f.includes(hidden));
    });

    // Process files in smaller chunks to avoid memory issues
    const result = [];
    const chunkSize = 50;

    for (let i = 0; i < filtered.length; i += chunkSize) {
      const chunk = filtered.slice(i, i + chunkSize);
      
      for (const relPath of chunk) {
        const fullPath = path.join(folderPath, relPath);
        try {
          const stats = await fs.promises.stat(fullPath);
          // Create a minimal object with only the necessary data
          result.push({
            n: path.basename(relPath),          // name
            p: fullPath,                        // path
            d: stats.isDirectory(),             // isDirectory
            r: path.dirname(relPath) === '.' ? '' : path.dirname(relPath) // parent
          });
        } catch (error) {
          console.error(`Error processing path ${fullPath}:`, error);
          continue;
        }
      }
    }

    return result;
  } catch (error) {
    console.error('Error building folder tree:', error);
    throw new Error('Failed to build folder tree');
  }
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
