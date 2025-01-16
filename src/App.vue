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
        v-model:reverseHiddenMode="reverseHiddenMode"
        v-model:searchWords="searchWords"
      />

      <FolderTree
        :folderPath="folderPath"
        :hiddenList="hiddenList"
        :reverseHiddenMode="reverseHiddenMode"
        :searchWords="searchWords"
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
    const reverseHiddenMode = ref<boolean>(false);
    const searchWords = ref<string[]>([]);

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

    onMounted(async () => {
      if (window.electronAPI) {
        try {
          const data = await window.electronAPI.getStoreData();
          hiddenList.value = data.hiddenList;
          introRules.value = data.introRules;
          selectedFiles.value = data.selectedFiles;
          userTask.value = data.userTask;
          reverseHiddenMode.value = data.reverseHiddenMode;
          searchWords.value = data.searchWords;

          if (data.lastFolderPath) {
            folderPath.value = data.lastFolderPath;
          }
        } catch (error) {
          console.error('Error loading stored data:', error);
        }
      }
    });

    // Watch for changes to store them
    watch([hiddenList, introRules, selectedFiles, userTask, reverseHiddenMode, searchWords, folderPath], async () => {
      if (window.electronAPI) {
        try {
          // Ensure data is serializable by creating a clean copy
          const serializedData = {
            hiddenList: JSON.parse(JSON.stringify(hiddenList.value)),
            introRules: String(introRules.value),
            selectedFiles: JSON.parse(JSON.stringify(selectedFiles.value)),
            userTask: String(userTask.value),
            reverseHiddenMode: Boolean(reverseHiddenMode.value),
            searchWords: JSON.parse(JSON.stringify(searchWords.value)),
            lastFolderPath: String(folderPath.value),
          };
          await window.electronAPI.setStoreData(serializedData);
        } catch (error) {
          console.error('Error saving data:', error);
        }
      }
    }, { deep: true });

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
      reverseHiddenMode,
      searchWords,
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
  background-color: var(--background);
}

.header {
  padding: 1rem 1.5rem;
  background-color: var(--surface);
  border-bottom: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.header-links {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  background: linear-gradient(135deg, var(--primary) 0%, #818cf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.discord-link,
.xml-parser-link {
  color: var(--text);
  text-decoration: none;
  font-size: 0.9375rem;
  padding: 0.5rem 1rem;
  background-color: var(--surface-hover);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.discord-link:hover,
.xml-parser-link:hover {
  border-color: var(--primary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  gap: 1rem;
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: var(--surface);
  color: var(--text);
  padding: 0.75rem 1.25rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  z-index: 1000;
  animation: slideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: var(--shadow-lg);
}

@keyframes slideIn {
  from {
    transform: translateX(100%) translateY(-50%);
    opacity: 0;
  }
  to {
    transform: translateX(0) translateY(0);
    opacity: 1;
  }
}

/* Add responsive design */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .header-links {
    flex-direction: column;
    width: 100%;
  }

  .main-content {
    flex-direction: column;
    padding: 1rem 0.5rem;
  }
}
</style>
