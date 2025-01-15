<template>
  <div class="app-container dark-theme">
    <header class="header">
      <h1>EazyPaste</h1>
    </header>
    <div class="main-content">
      <ConfigPanel
        :hiddenList="hiddenList"
        @update:hiddenList="updateHiddenList"
        :introRules="introRules"
        @update:introRules="updateIntroRules"
      />

      <FolderTree
        :folderPath="folderPath"
        :hiddenList="hiddenList"
        @select-folder="selectFolder"
        @update:selectedFiles="updateSelectedFiles"
        :selectedFiles="selectedFiles"
      />

      <PromptBuilder
        :selectedFiles="selectedFiles"
        :introRules="introRules"
        :userTask="userTask"
        @update:userTask="updateUserTask"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import ConfigPanel from './components/ConfigPanel.vue';
import FolderTree from './components/FolderTree.vue';
import PromptBuilder from './components/PromptBuilder.vue';

declare global {
  interface Window {
    electronAPI?: any;
  }
}

export default defineComponent({
  name: 'App',
  components: {
    ConfigPanel,
    FolderTree,
    PromptBuilder,
  },
  setup() {
    const folderPath = ref<string>('');
    const hiddenList = ref<string[]>([]);
    const introRules = ref<string>('');
    const selectedFiles = ref<string[]>([]);
    const userTask = ref<string>('');

    const loadStoreData = async () => {
      if (window.electronAPI) {
        const data = await window.electronAPI.getStoreData();
        folderPath.value = data.lastFolderPath || '';
        hiddenList.value = data.hiddenList || [];
        introRules.value = data.introRules || '';
        selectedFiles.value = data.selectedFiles || [];
        userTask.value = data.userTask || '';
      }
    };

    // Update electron store whenever we change data
    const saveStoreData = async () => {
      await window.electronAPI.setStoreData({
        lastFolderPath: folderPath.value,
        hiddenList: hiddenList.value,
        introRules: introRules.value,
        selectedFiles: selectedFiles.value,
        userTask: userTask.value,
      });
    };

    onMounted(() => {
      loadStoreData();
    });

    // watchers
    const updateHiddenList = async (newList: string[]) => {
      hiddenList.value = newList;
      await saveStoreData();
    };

    const updateIntroRules = async (newRules: string) => {
      introRules.value = newRules;
      await saveStoreData();
    };

    const updateUserTask = async (newTask: string) => {
      userTask.value = newTask;
      await saveStoreData();
    };

    const updateSelectedFiles = async (files: string[]) => {
      selectedFiles.value = files;
      await saveStoreData();
    };

    const selectFolder = async () => {
      if (window.electronAPI) {
        const result = await window.electronAPI.selectFolder();
        if (result) {
          folderPath.value = result;
          selectedFiles.value = [];
          await saveStoreData();
        }
      }
    };

    return {
      folderPath,
      hiddenList,
      introRules,
      selectedFiles,
      userTask,
      updateHiddenList,
      updateIntroRules,
      updateUserTask,
      updateSelectedFiles,
      selectFolder,
    };
  },
});
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.header {
  padding: 1rem;
  border-bottom: 1px solid #444;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Dark theme styling in combination with a global .dark-theme class */
</style>
