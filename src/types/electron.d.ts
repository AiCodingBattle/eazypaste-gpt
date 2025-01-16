export {};

declare global {
  interface Window {
    electronAPI: {
      startWatching: (folderPath: string) => Promise<void>;
      stopWatching: () => Promise<void>;
      onFileCreated: (callback: (path: string) => void) => void;
      onFileChanged: (callback: (path: string) => void) => () => void;
      onFileDeleted: (callback: (path: string) => void) => void;
      onDirCreated: (callback: (path: string) => void) => void;
      onDirDeleted: (callback: (path: string) => void) => void;
      removeFileWatchers: () => void;
      getFolderTree: (folderPath: string, hiddenList: string[]) => Promise<any[]>;
      selectFolder: () => Promise<string | null>;
      getStoreData: () => Promise<any>;
      setStoreData: (data: any) => Promise<void>;
      getFolderContents: (folderPath: string, hiddenList: string[]) => Promise<any[]>;
      readFile: (filePath: string) => Promise<string>;
      getRelativePath: (filePath: string, rootPath: string) => Promise<string>;
      getBasename: (filePath: string) => Promise<string>;
      resetToDefaults: () => Promise<boolean>;
      openExternal: (url: string) => Promise<void>;
      getFileContents: (filePath: string) => Promise<string>;
    }
  }
} 