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
            :value="inputValue"
            @input="onHiddenListChange($event as InputEvent)"
            @keydown="onInputKeydown($event as KeyboardEvent)"
            placeholder="Type and press Enter or add comma to add items"
            class="hidden-list-input"
          />
          <div class="tags">
            <span v-for="item in props.hiddenList" :key="item" class="tag">
              {{ item }}
              <button @click="removeHiddenItem(item)" class="remove-tag">&times;</button>
            </span>
          </div>
        </div>
        <small class="help-text">Press Enter or add comma to add items, Backspace to remove last item</small>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, computed, ref } from 'vue';
  
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
    },
    emits: ['update:hiddenList', 'update:introRules'],
    setup(props, { emit }) {
      const inputValue = ref('');

      // Convert array to comma-separated string for display
      const hiddenListString = computed(() => {
        return props.hiddenList.join(', ');
      });

      const onHiddenListChange = (event: InputEvent) => {
        const target = event.target as HTMLInputElement;
        inputValue.value = target.value;
        
        // Only update the list when user types a comma or presses Enter
        if (target.value.endsWith(',')) {
          const newItems = target.value
            .split(',')
            .map(v => v.trim())
            .filter(v => v && !props.hiddenList.includes(v));
          
          if (newItems.length > 0) {
            emit('update:hiddenList', [...props.hiddenList, ...newItems]);
          }
          // Clear the input after adding items
          target.value = '';
          inputValue.value = '';
        }
      };

      const onInputKeydown = (event: KeyboardEvent) => {
        const target = event.target as HTMLInputElement;
        
        if (event.key === 'Enter') {
          event.preventDefault();
          if (target.value.trim()) {
            const newItem = target.value.trim();
            if (!props.hiddenList.includes(newItem)) {
              emit('update:hiddenList', [...props.hiddenList, newItem]);
            }
            // Clear the input after adding item
            target.value = '';
            inputValue.value = '';
          }
        } else if (event.key === 'Backspace' && !target.value) {
          // Remove last item when pressing backspace with empty input
          event.preventDefault();
          const newList = [...props.hiddenList];
          newList.pop();
          emit('update:hiddenList', newList);
        }
      };

      const removeHiddenItem = (item: string) => {
        const newList = props.hiddenList.filter(i => i !== item);
        emit('update:hiddenList', newList);
      };

      const onIntroRulesChange = (event: InputEvent) => {
        const target = event.target as HTMLTextAreaElement;
        emit('update:introRules', target.value);
      };

      const resetToDefaults = async () => {
        if (window.electronAPI) {
          try {
            const success = await window.electronAPI.resetToDefaults();
            if (success) {
              // Refresh the data
              const data = await window.electronAPI.getStoreData();
              emit('update:hiddenList', data.hiddenList);
              emit('update:introRules', data.introRules);
            }
          } catch (error) {
            console.error('Error resetting to defaults:', error);
          }
        }
      };

      return {
        props,
        inputValue,
        hiddenListString,
        onHiddenListChange,
        onInputKeydown,
        removeHiddenItem,
        onIntroRulesChange,
        resetToDefaults,
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
  