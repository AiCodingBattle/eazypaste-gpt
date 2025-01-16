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
  import { defineComponent, ref, watch, onMounted, PropType, onUnmounted } from 'vue';
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
        type: Array as PropType<string[]>,
        required: true,
      },
      selectedFiles: {
        type: Array as PropType<string[]>,
        required: true,
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
          const serializedHiddenList = JSON.parse(JSON.stringify(props.hiddenList));
          const flatData = await window.electronAPI.getFolderTree(props.folderPath, serializedHiddenList);
          
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
      watch([() => props.folderPath, () => props.hiddenList], () => {
        loadTreeData();
      });
  
      onMounted(() => {
        loadTreeData();
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
      const selectAllFiles = () => {
        if (allFilesSelected.value) {
          // Deselect all files
          emit('update:selectedFiles', []);
          allFilesSelected.value = false;
        } else {
          // Select all files
          const allPaths = getAllFilePaths(treeData.value);
          emit('update:selectedFiles', allPaths);
          allFilesSelected.value = true;
        }
      };
  
      // Watch selectedFiles to update allFilesSelected state
      watch(() => props.selectedFiles, (newFiles) => {
        const allPaths = getAllFilePaths(treeData.value);
        allFilesSelected.value = allPaths.length > 0 && 
          allPaths.every(path => newFiles.includes(path));
      });
  
      const unfoldAll = async () => {
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
            // Create a clean copy of hiddenList for IPC
            const serializedHiddenList = JSON.parse(JSON.stringify(props.hiddenList));
            const result = await window.electronAPI.getFolderTree(props.folderPath, serializedHiddenList);
            
            if (!result || !Array.isArray(result)) {
              throw new Error('Invalid data received from IPC call');
            }

            // Process the flat data into a tree structure
            treeData.value = buildTreeFromFlatData(result);
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
            const updatedFiles = [...props.selectedFiles, path];
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
              updatedFiles.splice(index, 0, path);
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
          // Update allFilesSelected state
          const allPaths = getAllFilePaths(treeData.value);
          allFilesSelected.value = allPaths.length > 0 && 
            allPaths.every(p => props.selectedFiles.includes(p));
        } catch (err) {
          console.error('Error handling file deletion:', err);
        }
      };

      const handleDirCreated = async (path: string) => {
        await refreshFolderTree();
        // If all files were selected before, select any files in the new directory
        if (allFilesSelected.value) {
          const newPaths = getAllFilePaths(treeData.value);
          emit('update:selectedFiles', newPaths);
        }
      };

      const handleDirDeleted = async (path: string) => {
        // Remove any selected files that were in the deleted directory
        const updatedFiles = props.selectedFiles.filter(file => !file.startsWith(path));
        if (updatedFiles.length !== props.selectedFiles.length) {
          emit('update:selectedFiles', updatedFiles);
        }
        // Update the tree after updating selected files to prevent UI glitches
        await refreshFolderTree();
        // Update allFilesSelected state
        const allPaths = getAllFilePaths(treeData.value);
        allFilesSelected.value = allPaths.length > 0 && 
          allPaths.every(p => props.selectedFiles.includes(p));
      };

      // Setup file watchers
      const setupFileWatchers = async () => {
        if (props.folderPath) {
          try {
            await window.electronAPI.startWatching(props.folderPath);
            window.electronAPI.onFileCreated(handleFileCreated);
            window.electronAPI.onFileChanged(handleFileChanged);
            window.electronAPI.onFileDeleted(handleFileDeleted);
            window.electronAPI.onDirCreated(handleDirCreated);
            window.electronAPI.onDirDeleted(handleDirDeleted);
          } catch (err) {
            console.error('Error setting up file watchers:', err);
          }
        }
      };

      // Cleanup file watchers
      const cleanupFileWatchers = async () => {
        try {
          await window.electronAPI.stopWatching();
          window.electronAPI.removeFileWatchers();
        } catch (err) {
          console.error('Error cleaning up file watchers:', err);
        }
      };

      // Watch for folder path changes
      watch(() => props.folderPath, async (newPath, oldPath) => {
        if (oldPath) {
          await cleanupFileWatchers();
        }
        if (newPath) {
          await setupFileWatchers();
        }
      });

      // Cleanup on component unmount
      onUnmounted(async () => {
        await cleanupFileWatchers();
      });
  
      return {
        treeData,
        toggleFile,
        onSelectFolder,
        selectAllFiles,
        allFilesSelected,
        unfoldAll,
        foldAll,
        expandedState,
        handleExpansionChange,
        allFolded,
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
  