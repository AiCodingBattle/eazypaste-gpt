import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import Store from 'electron-store';
import fsExtra from 'fs-extra';
import { fileURLToPath } from 'url';
import * as chokidar from 'chokidar';
import { readFile } from 'fs/promises';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File watcher instance
let watcher: chokidar.FSWatcher | null = null;

// Function to start watching a folder
function startWatching(folderPath: string, hiddenList: string[]) {
  // Stop any existing watcher
  if (watcher) {
    watcher.close();
  }

  // Initialize watcher with ignore patterns
  watcher = chokidar.watch(folderPath, {
    ignored: (watchPath: string) => hiddenList.some(hidden => watchPath.includes(hidden)),
    persistent: true,
    ignoreInitial: true
  });

  // File events
  watcher
    .on('add', (watchPath: string) => mainWindow?.webContents.send('file-created', watchPath))
    .on('change', (watchPath: string) => mainWindow?.webContents.send('file-changed', watchPath))
    .on('unlink', (watchPath: string) => mainWindow?.webContents.send('file-deleted', watchPath))
    .on('addDir', (watchPath: string) => mainWindow?.webContents.send('dir-created', watchPath))
    .on('unlinkDir', (watchPath: string) => mainWindow?.webContents.send('dir-deleted', watchPath))
    .on('error', (error: unknown) => console.error('Watcher error:', error));
}

// Disable GPU acceleration to avoid cache issues
app.disableHardwareAcceleration();
// Disable GPU cache
app.commandLine.appendSwitch('disable-gpu-cache');

// Default configuration
const defaultConfig = {
  lastFolderPath: '',
  hiddenList: [
    // Development folders and files
    '.git', 
    '.vscode', 
    'dist-electron', 
    'node_modules', 
    'package-lock.json',
    // ESLint files
    '.eslintignore',
    '.eslintrc',
    '.eslintrc.json',
    '.eslintrc.js',
    // Image formats
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.svg',
    '.ico',
    '.webp',
    '.bmp',
    '.tiff',
    '.idx'
  ],
  introRules: `Present a complete plan to solve the problem and implement it in the codebase.

At the end of your response, respond with the following XML section (if applicable).

XML Section:

Do not get lazy. Always output the full code in the XML section.
Enclose this entire section in a markdown codeblock
Include all of the changed files
Specify each file operation with CREATE, UPDATE, or DELETE
For CREATE or UPDATE operations, include the full file code
Include the full file path (relative to the project directory, good: app/page.tsx, bad: /Users/mckaywrigley/Desktop/projects/new-chat-template/app/page.tsx)
Enclose the code with ![CDATA[CODE HERE]]
Use the following XML structure:
<code_changes>
  <changed_files>
    <file>
      <file_operation>__FILE OPERATION HERE__</file_operation>
      <file_path>__FILE PATH HERE__</file_path>
      <file_code><![CDATA[
__FULL FILE CODE HERE__
]]></file_code>
    </file>
    __REMAINING FILES HERE__
  </changed_files>
</code_changes>
Other rules:

DO NOT remove <ai_context> sections. These are to provide you additional context about each file.
If you create a file, add an <ai_context> comment section at the top of the file.
If you update a file make sure its <ai_context> stays up-to-date
DO NOT add comments related to your edits
DO NOT remove my existing comments
We may go back and forth a few times. If we do, remember to continue to output the entirety of the code in an XML section (if applicable).

Take all the time you need.`,
  selectedFiles: [] as string[],
  userTask: '',

  // NEW FIELDS FOR REVERSE HIDDEN MODE
  reverseHiddenMode: false,
  searchWords: [] as string[],
};

// Initialize store for local data
const store = new Store({
  name: 'eazypaste-config',
  defaults: defaultConfig,
});

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load your Vite dev server or the built index.html
  if (import.meta.env.MODE === 'development') {
    mainWindow.loadURL('http://localhost:5100');
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

    reverseHiddenMode: store.get('reverseHiddenMode'),
    searchWords: store.get('searchWords'),
  };
});

// 3) Set store data
ipcMain.handle('set-store-data', async (_, data: any) => {
  // data should be an object containing keys that exist in the store
  Object.entries(data).forEach(([key, value]) => {
    store.set(key, value);
  });
});

// Helper function to check if a file/folder matches the search
async function matchesSearchCriteria(
  entryName: string,
  entryPath: string,
  searchWords: string[],
  isDirectory: boolean
) {
  // If no search words are provided, everything matches
  if (!searchWords || searchWords.length === 0) {
    return true;
  }

  // Clean and prepare search words once
  const cleanedSearchWords = searchWords
    .map(word => word.toLowerCase().trim())
    .filter(word => word.length > 0);

  if (cleanedSearchWords.length === 0) {
    return true;
  }

  // Check if the entry name contains any of the search words
  const lowerEntryName = entryName.toLowerCase();
  for (const word of cleanedSearchWords) {
    if (lowerEntryName.includes(word)) {
      return true;
    }
  }

  // For directories, we'll check during tree traversal
  if (isDirectory) {
    return false;
  }

  // For files, check content only if necessary
  try {
    // Only read text files
    const ext = path.extname(entryPath).toLowerCase();
    const textFileExts = ['.txt', '.md', '.js', '.ts', '.jsx', '.tsx', '.vue', '.css', '.scss', '.html', '.json', '.yml', '.yaml', '.xml', '.csv'];
    
    if (!textFileExts.includes(ext)) {
      return false;
    }

    const content = await fsExtra.readFile(entryPath, 'utf-8');
    const lowerContent = content.toLowerCase();
    
    return cleanedSearchWords.some(word => lowerContent.includes(word));
  } catch (err) {
    console.error(`Error checking file ${entryPath}:`, err);
    return false;
  }
}

// 4) Get folder tree structure
ipcMain.handle('get-folder-tree', async (_, folderPath: string, hiddenList: string[], reverseHiddenMode: boolean, searchWords: string[]) => {
  if (!folderPath) return [];

  const getFilesRecursively = async (dir: string): Promise<any[]> => {
    const items = await fsExtra.readdir(dir, { withFileTypes: true });
    const result = [];

    // Process all directories first to build the tree structure
    for (const item of items) {
      if (!item.isDirectory()) continue;

      const itemPath = path.join(dir, item.name);
      const isHiddenByList = hiddenList.some(hidden => item.name.includes(hidden));

      // Skip hidden directories
      if (isHiddenByList) {
        continue;
      }

      // Get children first
      const children = await getFilesRecursively(itemPath);
      
      // Check if directory matches search criteria
      const dirMatches = await matchesSearchCriteria(item.name, itemPath, searchWords, true);
      
      // Include directory if it matches or has matching children
      if (dirMatches || children.length > 0) {
        result.push({
          n: item.name,
          p: itemPath,
          d: true,
          c: children
        });
      }
    }

    // Then process all files
    for (const item of items) {
      if (item.isDirectory()) continue;

      const itemPath = path.join(dir, item.name);
      const isHiddenByList = hiddenList.some(hidden => item.name.includes(hidden));

      // Skip hidden files
      if (isHiddenByList) {
        continue;
      }

      // Check if file matches search criteria
      const matches = await matchesSearchCriteria(item.name, itemPath, searchWords, false);
      if (matches) {
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
    const result = await getFilesRecursively(folderPath);
    return result;
  } catch (error) {
    console.error('Error reading folder structure:', error);
    return [];
  }
});

// 5) Get folder contents (for dynamic loading)
ipcMain.handle('get-folder-contents', async (_, folderPath: string, hiddenList: string[], reverseHiddenMode: boolean, searchWords: string[]) => {
  if (!folderPath) return [];

  try {
    const items = await fsExtra.readdir(folderPath, { withFileTypes: true });
    const contents = [];

    for (const item of items) {
      const itemPath = path.join(folderPath, item.name);
      const isHiddenByList = hiddenList.some(hidden => item.name.includes(hidden));

      // Skip hidden items
      if (isHiddenByList) {
        continue;
      }

      // Check if item matches search criteria
      const matches = await matchesSearchCriteria(item.name, itemPath, searchWords, item.isDirectory());
      if (matches) {
        contents.push({
          name: String(item.name),
          path: String(itemPath),
          isDirectory: Boolean(item.isDirectory()),
          type: item.isDirectory() ? 'directory' : 'file'
        });
      }
    }

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

// Add reset handler
ipcMain.handle('reset-to-defaults', async () => {
  try {
    // Reset each value to its default
    Object.entries(defaultConfig).forEach(([key, value]) => {
      store.set(key, value);
    });
    return true;
  } catch (error) {
    console.error('Error resetting to defaults:', error);
    return false;
  }
});

// IPC handler for starting file watching
ipcMain.handle('start-watching', async (_, folderPath: string) => {
  const hiddenList = store.get('hiddenList') as string[];
  startWatching(folderPath, hiddenList);
  return true;
});

// IPC handler for stopping file watching
ipcMain.handle('stop-watching', async () => {
  if (watcher) {
    await watcher.close();
    watcher = null;
  }
  return true;
});

// Add this IPC handler with the other handlers
ipcMain.handle('get-file-contents', async (_event, filePath: string) => {
  try {
    const content = await readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error('Error reading file:', error);
    throw error;
  }
});
