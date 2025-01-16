<template>
    <div class="folder-tree">
      <div class="folder-actions">
        <div class="primary-actions">
          <button @click="onSelectFolder" class="action-button">Select Folder</button>
          <button 
            v-if="folderPath" 
            @click="selectAllFiles" 
            class="action-button"
            :class="{ 'primary-bg': selectedFiles.length === 0 }"
          >
            <span v-if="allFilesSelected">Deselect All Files</span>
            <span v-else>Select All Files</span>
          </button>
        </div>
        <div v-if="folderPath" class="fold-actions">
          <button 
            @click="unfoldAll" 
            class="action-button"
            :class="{ 'primary-bg': allFolded }"
          >Unfold All</button>
          <button @click="foldAll" class="action-button">Fold All</button>
        </div>
      </div>
  
      <div v-if="folderPath">
        <h3>Folder: {{ folderPath }}</h3>
  
        <ul>
          <TreeNode
            v-for="(node, index) in treeData"
            :key="index"
            :node="node"
            :selectedFiles="selectedFiles"
            :hiddenList="hiddenList"
            :forceExpanded="expandedState"
            @toggle-file="toggleFile"
            @expansion-change="handleExpansionChange"
          />
        </ul>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref, watch, onMounted, onUnmounted } from 'vue';
  import TreeNode from './TreeNode.vue';
  import { store } from '../store';
  
  export default defineComponent({
    name: 'FolderTree',
    components: {
      TreeNode,
    },
    props: {
      folderPath: {
        type: String,
        required: true,
      },
      hiddenList: {
        type: Array as () => string[],
        required: true,
      },
      selectedFiles: {
        type: Array as () => string[],
        required: true,
      },
      reverseHiddenMode: {
        type: Boolean,
        required: false,
        default: false,
      },
      searchWords: {
        type: Array as () => string[],
        required: false,
        default: () => [],
      },
    },
    emits: ['update:selectedFiles', 'select-folder', 'error'],
    setup(props, { emit }) {
      const treeData = ref<any[]>([]);
      const allFilesSelected = ref(false);
      const expandedState = ref<boolean | null>(null);
      const expansionStates = ref<Map<string, boolean>>(new Map());
      const allFolded = ref(true);
      const loading = ref(false);
      const error = ref<string | null>(null);
  
      const buildTreeFromFlatData = (flatData: any[]) => {
        // Convert flat data to tree structure
        const processNode = (node: any): any => {
          return {
            name: node.n,
            path: node.p,
            isDirectory: node.d,
            type: node.d ? 'directory' : 'file',
            children: node.c ? node.c.map(processNode) : []
          };
        };

        // Process root level nodes
        const root = flatData.map(processNode);

        // Sort nodes (directories first, then alphabetically)
        const sortNodes = (nodes: any[]) => {
          nodes.sort((a, b) => {
            if (a.isDirectory === b.isDirectory) {
              return a.name.localeCompare(b.name);
            }
            return a.isDirectory ? -1 : 1;
          });
          nodes.forEach(node => {
            if (node.children && node.children.length > 0) {
              sortNodes(node.children);
            }
          });
        };
  
        sortNodes(root);
        return root;
      };
  
      const loadTreeData = async () => {
        if (!props.folderPath || !window.electronAPI) {
          treeData.value = [];
          return;
        }

        try {
          // Ensure all data is serializable
          const serializedHiddenList = JSON.parse(JSON.stringify(props.hiddenList));
          const serializedSearchWords = JSON.parse(JSON.stringify(props.searchWords));
          const flatData = await window.electronAPI.getFolderTree(
            String(props.folderPath), 
            serializedHiddenList,
            Boolean(props.reverseHiddenMode),
            serializedSearchWords
          );
          
          if (!flatData || !Array.isArray(flatData)) {
            throw new Error('Invalid data received from IPC call');
          }

          treeData.value = buildTreeFromFlatData(flatData);
        } catch (error) {
          console.error('Error loading tree data:', error);
          treeData.value = [];
          emit('error', `Failed to load folder structure: ${error}`);
        }
      };

      // Watch for changes to folderPath or hiddenList
      watch(
        [
          () => props.folderPath,
          () => props.hiddenList,
          () => props.reverseHiddenMode,
          () => props.searchWords,
        ],
        async (newValues, oldValues) => {
          if (props.folderPath) {
            // Force immediate update when search words or reverse mode changes
            if (
              JSON.stringify(newValues[3]) !== JSON.stringify(oldValues[3]) || // searchWords changed
              newValues[2] !== oldValues[2] // reverseHiddenMode changed
            ) {
              await loadTreeData();
              // If we're in reverse mode and search words changed, refresh expanded nodes
              if (props.reverseHiddenMode) {
                await unfoldAll();
              }
            } else {
              await loadTreeData();
            }
          }
        },
        { deep: true }
      );
  
      onMounted(() => {
        loadTreeData();
        setupWatchers();
      });

      // Cleanup watchers when component is unmounted
      onUnmounted(() => {
        cleanupWatchers();
      });

      // Setup watchers for file changes
      const setupWatchers = async () => {
        if (window.electronAPI && props.folderPath) {
          try {
            // Start watching the folder
            await window.electronAPI.startWatching(props.folderPath);
            
            // Setup event listeners
            window.electronAPI.onFileCreated(handleFileCreated);
            window.electronAPI.onFileDeleted(handleFileDeleted);
            const removeFileChangeListener = window.electronAPI.onFileChanged(handleFileChanged);
            window.electronAPI.onDirCreated(handleDirCreated);
            window.electronAPI.onDirDeleted(handleDirDeleted);

            // Store cleanup function
            cleanupFunction = () => {
              if (window.electronAPI) {
                window.electronAPI.stopWatching();
                window.electronAPI.removeFileWatchers();
                if (removeFileChangeListener) {
                  removeFileChangeListener();
                }
              }
            };
          } catch (error) {
            console.error('Error setting up file watchers:', error);
          }
        }
      };

      // Cleanup watchers
      const cleanupWatchers = () => {
        if (cleanupFunction) {
          cleanupFunction();
          cleanupFunction = null;
        }
      };

      // Watch for folder path changes to reset watchers
      watch(() => props.folderPath, async (newPath, oldPath) => {
        if (oldPath) {
          cleanupWatchers();
        }
        if (newPath) {
          await setupWatchers();
        }
      });

      const toggleFile = (filePath: string) => {
        const current = [...props.selectedFiles];
        if (current.includes(filePath)) {
          // Remove
          const index = current.indexOf(filePath);
          if (index !== -1) {
            current.splice(index, 1);
          }
        } else {
          // Add
          current.push(filePath);
        }
        emit('update:selectedFiles', current);
      };
  
      const onSelectFolder = async () => {
        if (window.electronAPI) {
          try {
            const result = await window.electronAPI.selectFolder();
            if (result) {
              emit('select-folder', result);
            }
          } catch (error) {
            console.error('Error selecting folder:', error);
          }
        }
      };
  
      // Function to recursively get all file paths from tree
      const getAllFilePaths = (nodes: any[]): string[] => {
        let paths: string[] = [];
        for (const node of nodes) {
          if (!node.isDirectory) {
            paths.push(node.path);
          }
          if (node.children && node.children.length > 0) {
            paths = paths.concat(getAllFilePaths(node.children));
          }
        }
        return paths;
      };
  
      // Select/Deselect all files
      const selectAllFiles = async () => {
        if (allFilesSelected.value) {
          // Deselect all files
          emit('update:selectedFiles', []);
          allFilesSelected.value = false;
        } else {
          try {
            // Get the current visible files based on filters
            const serializedHiddenList = JSON.parse(JSON.stringify(props.hiddenList));
            const serializedSearchWords = JSON.parse(JSON.stringify(props.searchWords));
            const flatData = await window.electronAPI.getFolderTree(
              String(props.folderPath), 
              serializedHiddenList,
              Boolean(props.reverseHiddenMode),
              serializedSearchWords
            );
            
            if (!flatData || !Array.isArray(flatData)) {
              throw new Error('Invalid data received from IPC call');
            }

            const currentTreeData = buildTreeFromFlatData(flatData);
            const allPaths = getAllFilePaths(currentTreeData);
            emit('update:selectedFiles', allPaths);
            allFilesSelected.value = true;
          } catch (error) {
            console.error('Error selecting all files:', error);
            emit('error', 'Failed to select all files');
          }
        }
      };
  
      // Watch selectedFiles to update allFilesSelected state
      watch(() => props.selectedFiles, async (newFiles) => {
        try {
          // Get the current visible files based on filters
          const serializedHiddenList = JSON.parse(JSON.stringify(props.hiddenList));
          const serializedSearchWords = JSON.parse(JSON.stringify(props.searchWords));
          const flatData = await window.electronAPI.getFolderTree(
            String(props.folderPath), 
            serializedHiddenList,
            Boolean(props.reverseHiddenMode),
            serializedSearchWords
          );
          
          if (!flatData || !Array.isArray(flatData)) {
            throw new Error('Invalid data received from IPC call');
          }

          const currentTreeData = buildTreeFromFlatData(flatData);
          const allPaths = getAllFilePaths(currentTreeData);
          allFilesSelected.value = allPaths.length > 0 && 
            allPaths.every(path => newFiles.includes(path));
        } catch (error) {
          console.error('Error updating allFilesSelected state:', error);
        }
      });
  
      const unfoldAll = async () => {
        // First set expanded state to trigger initial expansion
        expandedState.value = true;
        // Wait for initial expansion and content loading
        await new Promise(resolve => setTimeout(resolve, 100));
        // Set it again to ensure newly loaded content is also expanded
        expandedState.value = null;
        expandedState.value = true;
      };

      const foldAll = () => {
        expandedState.value = false;
      };

      const handleExpansionChange = (data: { path: string, isExpanded: boolean }) => {
        expansionStates.value.set(data.path, data.isExpanded);
        // Update allFolded state
        allFolded.value = Array.from(expansionStates.value.values()).every(state => !state);
      };

      // Reset expansion state after it's been applied
      watch(expandedState, (newValue) => {
        if (newValue !== null) {
          // Reset after a short delay to allow the change to propagate
          setTimeout(() => {
            expandedState.value = null;
            // Update allFolded state when using fold/unfold all
            allFolded.value = !newValue;
          }, 100);
        }
      });
  
      // Function to refresh the folder tree
      const refreshFolderTree = async () => {
        if (props.folderPath) {
          try {
            loading.value = true;
            // Create a clean copy of hiddenList and searchWords for IPC
            const serializedHiddenList = JSON.parse(JSON.stringify(props.hiddenList));
            const serializedSearchWords = JSON.parse(JSON.stringify(props.searchWords));
            const result = await window.electronAPI.getFolderTree(
              String(props.folderPath), 
              serializedHiddenList,
              Boolean(props.reverseHiddenMode),
              serializedSearchWords
            );
            
            if (!result || !Array.isArray(result)) {
              throw new Error('Invalid data received from IPC call');
            }

            // Process the flat data into a tree structure
            treeData.value = buildTreeFromFlatData(result);

            // Also refresh folder contents
            const contents = await window.electronAPI.getFolderContents(
              String(props.folderPath),
              serializedHiddenList,
              Boolean(props.reverseHiddenMode),
              serializedSearchWords
            );

            if (!contents || !Array.isArray(contents)) {
              throw new Error('Invalid contents data received from IPC call');
            }

          } catch (err) {
            console.error('Error refreshing folder tree:', err);
            error.value = 'Failed to refresh folder tree';
          } finally {
            loading.value = false;
          }
        }
      };

      // Function to handle file system changes
      const handleFileCreated = async (path: string) => {
        try {
          await refreshFolderTree();
          // If all files were selected before, select the new file too
          if (allFilesSelected.value) {
            const updatedFiles = [...props.selectedFiles, String(path)];
            emit('update:selectedFiles', updatedFiles);
          }
        } catch (err) {
          console.error('Error handling file creation:', err);
        }
      };

      const handleFileChanged = async (path: string) => {
        try {
          await refreshFolderTree();
          // If the changed file is in the selected files, emit an update to refresh its content
          if (props.selectedFiles.includes(path)) {
            const updatedFiles = [...props.selectedFiles];
            // Remove and re-add the file to trigger a content refresh
            const index = updatedFiles.indexOf(path);
            if (index !== -1) {
              updatedFiles.splice(index, 1);
              updatedFiles.splice(index, 0, String(path));
              emit('update:selectedFiles', updatedFiles);
            }
          }
        } catch (err) {
          console.error('Error handling file change:', err);
        }
      };

      const handleFileDeleted = async (path: string) => {
        try {
          // If the deleted file is in the selected files, remove it
          if (props.selectedFiles.includes(path)) {
            const updatedFiles = props.selectedFiles.filter(file => file !== path);
            emit('update:selectedFiles', updatedFiles);
          }
          // Update the tree after updating selected files to prevent UI glitches
          await refreshFolderTree();
        } catch (err) {
          console.error('Error handling file deletion:', err);
        }
      };

      const handleDirCreated = async () => {
        await refreshFolderTree();
      };

      const handleDirDeleted = async () => {
        await refreshFolderTree();
      };

      let cleanupFunction: (() => void) | null = null;

      return {
        treeData,
        onSelectFolder,
        toggleFile,
        selectAllFiles,
        allFilesSelected,
        unfoldAll,
        foldAll,
        expandedState,
        allFolded,
        handleExpansionChange,
        loading,
        error,
      };
    },
  });
  </script>
  
  <style scoped>
  .folder-tree {
    flex: 2;
    padding: 1.5rem;
    background-color: var(--surface);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    overflow-y: auto;
    height: calc(100vh - 120px);
    border: 1px solid var(--border);
  }
  
  .folder-actions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .primary-actions,
  .fold-actions {
    display: flex;
    gap: 0.75rem;
  }

  .action-button {
    flex: 1;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 0.9375rem;
    background-color: var(--surface-hover);
    color: var(--text);
    border: 1px solid var(--border);
  }

  .action-button.primary-bg {
    background-color: var(--primary);
    color: white;
    border: none;
  }

  .action-button:not(.primary-bg):hover {
    border-color: var(--primary);
    background-color: var(--surface-hover);
    color: var(--text);
  }

  .action-button.primary-bg:hover {
    background-color: var(--primary-hover);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  h3 {
    font-size: 1rem;
    font-weight: 500;
    color: var(--text-secondary);
    margin: 0 0 1rem 0;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--border);
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  /* Add smooth transitions */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .folder-tree {
      height: auto;
      max-height: 50vh;
    }

    .folder-actions {
      flex-direction: column;
    }

    .primary-actions,
    .fold-actions {
      flex-direction: column;
    }

    .action-button {
      width: 100%;
    }
  }
  </style>
