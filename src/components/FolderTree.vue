<template>
    <div class="folder-tree">
      <button @click="selectFolder">Select Folder</button>
  
      <div v-if="folderPath">
        <h3>Folder: {{ folderPath }}</h3>
  
        <ul>
          <TreeNode
            v-for="(node, index) in treeData"
            :key="index"
            :node="node"
            :selectedFiles="selectedFiles"
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
    emits: ['update:selectedFiles', 'select-folder'],
    setup(props, { emit }) {
      const treeData = ref<any[]>([]);
  
      const loadTreeData = async () => {
        if (props.folderPath && window.electronAPI) {
          const data = await window.electronAPI.getFolderTree(props.folderPath, props.hiddenList);
          treeData.value = data;
        } else {
          treeData.value = [];
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
  
      const selectFolder = () => {
        emit('select-folder');
      };
  
      return {
        treeData,
        toggleFile,
        selectFolder,
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
  }
  
  .folder-tree ul {
    list-style: none;
    padding-left: 1rem;
  }
  </style>
  