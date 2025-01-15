<template>
  <div class="app-container dark-theme">
    <header class="header">
      <h1>EazyPaste GPT</h1>
    </header>
    <div class="main-content">
      <ConfigPanel
        v-model:hiddenList="hiddenList"
        v-model:introRules="introRules"
      />

      <FolderTree
        :folderPath="folderPath"
        :hiddenList="hiddenList"
        v-model:selectedFiles="selectedFiles"
        @select-folder="selectFolder"
      />

      <PromptBuilder
        :selectedFiles="selectedFiles"
        v-model:introRules="introRules"
        v-model:userTask="userTask"
        :rootPath="folderPath"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, watch } from 'vue';
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
        try {
          const data = await window.electronAPI.getStoreData();
          folderPath.value = data.lastFolderPath || '';
          hiddenList.value = data.hiddenList || [];
          introRules.value = data.introRules || '';
          selectedFiles.value = data.selectedFiles || [];
          userTask.value = data.userTask || '';
        } catch (error) {
          console.error('Error loading store data:', error);
        }
      }
    };

    // Update electron store whenever we change data
    const saveStoreData = async () => {
      if (window.electronAPI) {
        try {
          const storeData = {
            lastFolderPath: folderPath.value || '',
            hiddenList: Array.from(hiddenList.value || []),
            introRules: introRules.value || '',
            selectedFiles: Array.from(selectedFiles.value || []),
            userTask: userTask.value || '',
          };
          await window.electronAPI.setStoreData(JSON.parse(JSON.stringify(storeData)));
        } catch (error) {
          console.error('Error saving store data:', error);
        }
      }
    };

    onMounted(() => {
      loadStoreData();
    });

    // Watch for changes and save to store
    watch(
      [hiddenList, introRules, selectedFiles, userTask, folderPath],
      () => {
        saveStoreData();
      },
      { deep: true }
    );

    const selectFolder = async (newPath: string) => {
      console.log('selectFolder called in App.vue with path:', newPath);
      if (window.electronAPI) {
        console.log('Setting folderPath to:', newPath);
        folderPath.value = newPath;
        selectedFiles.value = []; // Reset selected files when changing folders
        console.log('New folderPath value:', folderPath.value);
      } else {
        console.error('electronAPI is not available in App.vue');
      }
    };

    return {
      folderPath,
      hiddenList,
      introRules,
      selectedFiles,
      userTask,
      selectFolder,
    };
  },
});
</script>

<style>
/* Global dark theme styles */
.dark-theme {
  background-color: #1e1e1e;
  color: #ffffff;
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.header {
  padding: 1rem;
  background-color: #2d2d2d;
  border-bottom: 1px solid #444;
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}
</style>
