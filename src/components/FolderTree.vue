<template>
    <div class="folder-tree">
      <button @click="onSelectFolder">Select Folder</button>
  
      <div v-if="folderPath">
        <h3>Folder: {{ folderPath }}</h3>
  
        <ul>
          <TreeNode
            v-for="(node, index) in treeData"
            :key="index"
            :node="node"
            :selectedFiles="selectedFiles"
            :hiddenList="hiddenList"
            @toggle-file="toggleFile"
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
  
  // Helper functions for path manipulation
  const joinPaths = (...paths: string[]): string => {
    // Simple path join that handles both Windows and Unix paths
    return paths
      .map((part, i) => {
        if (i === 0) {
          return part.trim().replace(/[\/\\]$/, '');
        } else {
          return part.trim().replace(/(^[\/\\]|[\/\\]$)/g, '');
        }
      })
      .filter(x => x.length)
      .join('/');
  };
  
  const getBasename = (path: string): string => {
    // Get the last part of the path
    return path.split(/[\/\\]/).pop() || path;
  };
  
  const getDirname = (path: string): string => {
    // Get the directory part of the path
    const parts = path.split(/[\/\\]/);
    parts.pop();
    return parts.join('/') || '.';
  };
  
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
  
      const buildTreeFromFlatData = (flatData: any[]) => {
        const root: any[] = [];
        const map = new Map();
  
        // First pass: create all nodes
        flatData.forEach(item => {
          const node = {
            name: item.n,
            path: item.p,
            isDirectory: item.d,
            type: item.d ? 'directory' : 'file',
            children: []
          };
          map.set(item.p, node);
        });
  
        // Second pass: establish parent-child relationships
        flatData.forEach(item => {
          const node = map.get(item.p);
          const parentPath = getDirname(item.p);
          
          if (parentPath !== props.folderPath) {
            const parent = map.get(parentPath);
            if (parent) {
              parent.children.push(node);
            } else {
              root.push(node);
            }
          } else {
            root.push(node);
          }
        });
  
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
          if (!props.folderPath) {
            console.log('No folder path available');
          }
          treeData.value = [];
          return;
        }

        try {
          let flatData;
          
          try {
            const serializedHiddenList = JSON.parse(JSON.stringify(props.hiddenList));
            flatData = await window.electronAPI.getFolderTree(props.folderPath, serializedHiddenList);
            
            if (!flatData) {
              throw new Error('No data received from IPC call');
            }

            if (typeof flatData === 'string') {
              flatData = JSON.parse(flatData);
            }

          } catch (error: unknown) {
            const ipcError = error as Error;
            console.error('IPC communication error:', ipcError);
            throw new Error(`IPC error: ${ipcError.message || 'Unknown IPC error'}`);
          }

          if (!Array.isArray(flatData)) {
            console.error('Received non-array data:', flatData);
            throw new Error('Invalid data format received: not an array');
          }

          try {
            const tree = buildTreeFromFlatData(flatData);
            treeData.value = tree;
          } catch (error: unknown) {
            const buildError = error as Error;
            console.error('Error building tree:', buildError);
            throw new Error(`Tree building error: ${buildError.message || 'Unknown build error'}`);
          }
        } catch (error: unknown) {
          const finalError = error as Error;
          console.error('Error loading tree data:', finalError);
          treeData.value = [];
          emit('error', `Failed to load folder structure: ${finalError.message || 'Unknown error'}`);
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
        console.log('Select folder button clicked');
        if (window.electronAPI) {
          try {
            console.log('Calling electronAPI.selectFolder()');
            const result = await window.electronAPI.selectFolder();
            console.log('selectFolder result:', result);
            if (result) {
              console.log('Emitting select-folder event with path:', result);
              emit('select-folder', result);
            }
          } catch (error) {
            console.error('Error selecting folder:', error);
          }
        } else {
          console.error('electronAPI is not available');
        }
      };
  
      return {
        treeData,
        toggleFile,
        onSelectFolder,
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
  
  .folder-tree button {
    margin-bottom: 1rem;
    padding: 0.5rem 1rem;
    background-color: #2d2d2d;
    color: #fff;
    border: 1px solid #444;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .folder-tree button:hover {
    background-color: #3d3d3d;
  }
  
  .folder-tree ul {
    list-style: none;
    padding-left: 1rem;
  }
  </style>
  