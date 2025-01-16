<template>
  <div class="config-panel">
    <div class="config-header">
      <h2>Configuration</h2>
      <button @click="resetToDefaults" class="reset-button">
        <span class="icon">🔄</span>
        Reset to Defaults
      </button>
    </div>

    <div class="config-item">
      <label>Hidden Files/Folders:</label>
      <div class="input-wrapper">
        <input
          type="text"
          v-model="hiddenInput"
          @keydown.enter.prevent="addHiddenItem"
          @keydown.backspace="handleHiddenBackspace"
          placeholder="Type and press Enter to add items"
          class="hidden-list-input"
        />
        <div class="tags">
          <span v-for="item in props.hiddenList" :key="item" class="tag">
            {{ item }}
            <button @click="removeHiddenItem(item)" class="remove-tag">&times;</button>
          </span>
        </div>
      </div>
      <small class="help-text">Press Enter to add items, Backspace to remove last item</small>
    </div>

    <div class="config-item">
      <label>Search Words (Comma/Enter to add):</label>
      <div class="input-wrapper">
        <input
          type="text"
          v-model="searchWordsInput"
          @keydown.enter.prevent="addSearchWord"
          @keydown.backspace="handleSearchWordBackspace"
          placeholder="e.g. product, invoice, etc."
          class="hidden-list-input"
        />
        <div class="tags">
          <span v-for="word in props.searchWords" :key="word" class="tag">
            {{ word }}
            <button @click="removeSearchWord(word)" class="remove-tag">&times;</button>
          </span>
        </div>
      </div>
      <small class="help-text">Add search terms to filter files and folders</small>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'ConfigPanel',
  props: {
    hiddenList: {
      type: Array as () => string[],
      required: true,
    },
    introRules: {
      type: String,
      required: true,
    },
    searchWords: {
      type: Array as () => string[],
      required: true,
    },
  },
  emits: ['update:hiddenList', 'update:introRules', 'update:searchWords'],
  setup(props, { emit }) {
    const hiddenInput = ref('');
    const searchWordsInput = ref('');
    const introRulesInput = ref(props.introRules);

    // Hidden list handlers
    const addHiddenItem = () => {
      if (hiddenInput.value.trim()) {
        emit('update:hiddenList', [...props.hiddenList, hiddenInput.value.trim()]);
        hiddenInput.value = '';
      }
    };

    const removeHiddenItem = (item: string) => {
      emit('update:hiddenList', props.hiddenList.filter(i => i !== item));
    };

    const handleHiddenBackspace = (event: KeyboardEvent) => {
      if (hiddenInput.value === '' && props.hiddenList.length > 0) {
        event.preventDefault();
        const newList = [...props.hiddenList];
        newList.pop();
        emit('update:hiddenList', newList);
      }
    };

    // Search words handlers
    const addSearchWord = () => {
      if (searchWordsInput.value.trim()) {
        emit('update:searchWords', [...props.searchWords, searchWordsInput.value.trim()]);
        searchWordsInput.value = '';
      }
    };

    const removeSearchWord = (word: string) => {
      emit('update:searchWords', props.searchWords.filter(w => w !== word));
    };

    const handleSearchWordBackspace = (event: KeyboardEvent) => {
      if (searchWordsInput.value === '' && props.searchWords.length > 0) {
        event.preventDefault();
        const newList = [...props.searchWords];
        newList.pop();
        emit('update:searchWords', newList);
      }
    };

    // Reset to defaults handler
    const resetToDefaults = async () => {
      if (window.electronAPI) {
        try {
          const success = await window.electronAPI.resetToDefaults();
          if (success) {
            const data = await window.electronAPI.getStoreData();
            emit('update:hiddenList', data.hiddenList);
            emit('update:introRules', data.introRules);
            emit('update:searchWords', data.searchWords);
          }
        } catch (error) {
          console.error('Error resetting to defaults:', error);
        }
      }
    };

    // Intro rules handler
    const updateIntroRules = (event: Event) => {
      const target = event.target as HTMLTextAreaElement;
      emit('update:introRules', target.value);
    };

    return {
      hiddenInput,
      searchWordsInput,
      introRulesInput,
      addHiddenItem,
      removeHiddenItem,
      handleHiddenBackspace,
      addSearchWord,
      removeSearchWord,
      handleSearchWordBackspace,
      updateIntroRules,
      resetToDefaults,
      props,
    };
  },
});
</script>

<style scoped>
.config-panel {
  flex: 1;
  padding: 1.5rem;
  min-width: 300px;
  max-width: 300px;
  overflow-y: auto;
  background-color: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border);
  height: calc(100vh - 120px);
}

.config-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}

h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  background: linear-gradient(135deg, var(--primary) 0%, #818cf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.reset-button {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: var(--surface-hover);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.reset-button:hover {
  border-color: var(--primary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.reset-button .icon {
  font-size: 1rem;
}

.config-item {
  margin-bottom: 2rem;
}

.config-item label {
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 500;
  color: var(--text);
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

input, textarea {
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background-color: var(--surface);
  color: var(--text);
  font-size: 0.9375rem;
  transition: all 0.2s ease;
}

input:focus, textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
}

.hidden-list-input {
  width: 100%;
}

.intro-rules-input {
  width: 100%;
  resize: vertical;
  min-height: 120px;
  line-height: 1.6;
}

.help-text {
  margin-top: 0.5rem;
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background-color: var(--surface-hover);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.tag:hover {
  border-color: var(--primary);
  transform: translateY(-1px);
}

.remove-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.remove-tag:hover {
  color: var(--error);
  transform: scale(1.1);
}

/* Responsive design */
@media (max-width: 768px) {
  .config-panel {
    min-width: 100%;
    max-width: 100%;
    height: auto;
    max-height: none;
  }

  .config-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .reset-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
  