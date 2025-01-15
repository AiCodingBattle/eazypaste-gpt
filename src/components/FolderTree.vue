<template>
    <div class="folder-tree">
      <div class="folder-actions">
        <div class="primary-actions">
          <button @click="onSelectFolder" class="action-button">Select Folder</button>
          <button v-if="folderPath" @click="selectAllFiles" class="action-button">
            <span v-if="allFilesSelected">Deselect All Files</span>
            <span v-else>Select All Files</span>
          </button>
        </div>
        <div v-if="folderPath" class="fold-actions">
          <button @click="unfoldAll" class="action-button">Unfold All</button>
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
  import { defineComponent, ref, watch, onMounted, PropType } from 'vue';
  import TreeNode from './TreeNode.vue';
  
  declare global {
    interface Window {
      electronAPI?: any;
    }
  }
  
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
      };

      // Reset expansion state after it's been applied
      watch(expandedState, (newValue) => {
        if (newValue !== null) {
          // Reset after a short delay to allow the change to propagate
          setTimeout(() => {
            expandedState.value = null;
          }, 100);
        }
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
      };
    },
  });
  </script>
  
  <style scoped>
  .folder-tree {
    flex: 2;
    padding: 1rem;
    border-right: 1px solid #444;
    overflow-y: auto;
  }
  
  .folder-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .primary-actions, .fold-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .action-button {
    padding: 0.5rem 1rem;
    background-color: #2d2d2d;
    color: #fff;
    border: 1px solid #444;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 14px;
  }
  
  .action-button:hover {
    background-color: #3d3d3d;
    border-color: #666;
  }
  
  .folder-tree ul {
    list-style: none;
    padding-left: 1rem;
  }

  h3 {
    margin: 1rem 0;
    color: #fff;
  }
  </style>
  