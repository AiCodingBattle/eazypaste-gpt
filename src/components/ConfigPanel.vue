<template>
    <div class="config-panel">
      <h2>Configuration</h2>
      <div class="config-item">
        <label>Hidden Files/Folders (comma separated):</label>
        <input
          type="text"
          :value="hiddenListString"
          @input="onHiddenListChange($event.target.value)"
        />
      </div>
      <div class="config-item">
        <label>Intro/Rules Text:</label>
        <textarea
          rows="5"
          :value="introRules"
          @input="onIntroRulesChange($event.target.value)"
        />
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, computed } from 'vue';
  
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
      // Convert array to comma-separated string
      const hiddenListString = computed(() => {
        return props.hiddenList.join(', ');
      });
  
      const onHiddenListChange = (value: string) => {
        const newList = value
          .split(',')
          .map((v) => v.trim())
          .filter((v) => v);
        emit('update:hiddenList', newList);
      };
  
      const onIntroRulesChange = (value: string) => {
        emit('update:introRules', value);
      };
  
      return {
        hiddenListString,
        onHiddenListChange,
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
  }
  .config-item {
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
  }
  .config-item label {
    margin-bottom: 0.5rem;
    font-weight: bold;
  }
  </style>
  