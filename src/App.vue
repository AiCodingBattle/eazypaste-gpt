<template>
  <div class="app-container dark-theme">
    <header class="header">
      <div class="header-content">
        <h1>EazyPaste GPT</h1>
        <div class="header-links">
          <a href="#" 
             @click.prevent="openDiscord" 
             class="discord-link">
            <span class="discord-icon">🎮</span>
            Join AiCodingBattle Discord
          </a>
          <a href="#" 
             @click.prevent="copyXMLParserLink" 
             class="xml-parser-link">
            Use this XML-parser by MckayWrigley to process the output
          </a>
        </div>
      </div>
    </header>
    <div class="toast" v-if="showToast">{{ toastMessage }}</div>
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
    const showToast = ref(false);
    const toastMessage = ref('');

    const showToastMessage = (message: string) => {
      toastMessage.value = message;
      showToast.value = true;
      setTimeout(() => {
        showToast.value = false;
      }, 2000);
    };

    const copyXMLParserLink = async () => {
      const url = 'https://github.com/mckaywrigley/o1-xml-parser';
      await navigator.clipboard.writeText(url);
      showToastMessage('Link copied to clipboard!');
    };

    const openDiscord = async () => {
      try {
        const discordUrl = 'https://discord.gg/TH8V5b5rGR';
        await navigator.clipboard.writeText(discordUrl);
        showToastMessage('Discord invite link copied to clipboard!');
      } catch (error) {
        console.error('Error copying Discord link:', error);
        showToastMessage('Failed to copy Discord link');
      }
    };

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
      copyXMLParserLink,
      openDiscord,
      showToast,
      toastMessage,
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

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.xml-parser-link {
  color: #007acc;
  text-decoration: none;
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
  background-color: rgba(0, 122, 204, 0.1);
  border: 1px solid rgba(0, 122, 204, 0.2);
  border-radius: 4px;
  transition: all 0.2s;
  white-space: nowrap;
}

.xml-parser-link:hover {
  background-color: rgba(0, 122, 204, 0.2);
  border-color: rgba(0, 122, 204, 0.3);
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

.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: #2d2d2d;
  color: #fff;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  border: 1px solid #444;
  z-index: 1000;
  animation: slideIn 0.2s ease-out;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.header-links {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.discord-link {
  color: #5865F2;
  text-decoration: none;
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
  background-color: rgba(88, 101, 242, 0.1);
  border: 1px solid rgba(88, 101, 242, 0.2);
  border-radius: 4px;
  transition: all 0.2s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.discord-link:hover {
  background-color: rgba(88, 101, 242, 0.2);
  border-color: rgba(88, 101, 242, 0.3);
}

.discord-icon {
  font-size: 1.1rem;
}
</style>
