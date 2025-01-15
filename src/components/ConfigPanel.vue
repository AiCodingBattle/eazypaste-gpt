<template>
    <div class="config-panel">
      <h2>Configuration</h2>
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
      <div class="config-item">
        <label>Intro/Rules Text:</label>
        <textarea
          rows="5"
          :value="introRules"
          @input="onIntroRulesChange($event as InputEvent)"
          placeholder="Enter your intro/rules text here..."
          class="intro-rules-input"
        />
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

      return {
        props,
        inputValue,
        hiddenListString,
        onHiddenListChange,
        onInputKeydown,
        removeHiddenItem,
        onIntroRulesChange,
      };
    },
  });
  </script>
  
  <style scoped>
  .config-panel {
    flex: 1;
    padding: 1rem;
    border-right: 1px solid #444;
    min-width: 300px;
    max-width: 300px;
    overflow-y: auto;
    background-color: #1e1e1e;
    color: #d4d4d4;
  }

  h2 {
    margin-bottom: 1.5rem;
    color: #fff;
  }

  .config-item {
    margin-bottom: 1.5rem;
    display: flex;
    flex-direction: column;
  }

  .config-item label {
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: #fff;
  }

  .input-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  input, textarea {
    padding: 0.5rem;
    border: 1px solid #444;
    border-radius: 4px;
    background-color: #2d2d2d;
    color: #d4d4d4;
    font-size: 14px;
  }

  input:focus, textarea:focus {
    outline: none;
    border-color: #007acc;
  }

  .hidden-list-input {
    width: 100%;
  }

  .intro-rules-input {
    width: 100%;
    resize: vertical;
    min-height: 100px;
  }

  .help-text {
    margin-top: 0.25rem;
    font-size: 12px;
    color: #888;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.5rem;
    background-color: #2d2d2d;
    border: 1px solid #444;
    border-radius: 4px;
    font-size: 12px;
  }

  .remove-tag {
    margin-left: 0.5rem;
    background: none;
    border: none;
    color: #888;
    cursor: pointer;
    padding: 0 0.25rem;
    font-size: 14px;
  }

  .remove-tag:hover {
    color: #ff5555;
  }

  ::placeholder {
    color: #666;
  }
  </style>
  