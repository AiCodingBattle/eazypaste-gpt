<template>
    <div class="prompt-builder">
      <h2>Prompt Builder</h2>
  
      <div class="user-task">
        <label>User’s Task:</label>
        <textarea
          rows="3"
          v-model="internalUserTask"
          @input="onUserTaskChange"
        ></textarea>
      </div>
  
      <div class="code-preview" v-if="selectedFiles.length">
        <h3>Selected Files Preview</h3>
        <div v-for="(fileData, index) in fileContents" :key="index" class="file-content">
          <h4>{{ fileData.fileName }}</h4>
          <pre>{{ fileData.content }}</pre>
        </div>
      </div>
  
      <div class="token-count">
        <p>Approx. Token Count: {{ tokenCount }}</p>
      </div>
  
      <button @click="copyPrompt">Copy Full Prompt</button>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref, watch, onMounted } from 'vue';
  // You can use your own library for token counting. Here's a placeholder.
  
  declare global {
    interface Window {
      electronAPI?: any;
    }
  }
  
  export default defineComponent({
    name: 'PromptBuilder',
    props: {
      selectedFiles: {
        type: Array as () => string[],
        required: true,
      },
      introRules: {
        type: String,
        required: true,
      },
      userTask: {
        type: String,
        required: true,
      },
    },
    emits: ['update:userTask'],
    setup(props, { emit }) {
      const fileContents = ref<{ fileName: string; content: string }[]>([]);
      const internalUserTask = ref(props.userTask);
      const tokenCount = ref(0);
  
      const fetchFileContents = async () => {
        fileContents.value = [];
        for (const filePath of props.selectedFiles) {
          const content = await window.electronAPI.readFile(filePath);
          fileContents.value.push({
            fileName: filePath.split(/[/\\]/).pop() || filePath,
            content,
          });
        }
        updateTokenCount();
      };
  
      const buildPromptString = () => {
        let prompt = '';
        prompt += props.introRules + '\n\n';
        prompt += 'User Task:\n' + internalUserTask.value + '\n\n';
        prompt += 'Code Context:\n';
        fileContents.value.forEach((f) => {
          prompt += `\n=== [${f.fileName}] ===\n`;
          prompt += f.content + '\n';
        });
        return prompt;
      };
  
      const approximateTokens = (text: string) => {
        // Extremely naive approximation: 1 token ≈ 4 chars
        // or you can install "gpt-tokenizer" or similar
        return Math.ceil(text.length / 4);
      };
  
      const updateTokenCount = () => {
        const prompt = buildPromptString();
        tokenCount.value = approximateTokens(prompt);
      };
  
      const copyPrompt = async () => {
        const prompt = buildPromptString();
        // Use Browser Clipboard API
        await navigator.clipboard.writeText(prompt);
        alert('Prompt copied to clipboard!');
      };
  
      const onUserTaskChange = () => {
        emit('update:userTask', internalUserTask.value);
        updateTokenCount();
      };
  
      watch(() => props.selectedFiles, () => {
        fetchFileContents();
      });
  
      watch(() => props.introRules, () => {
        updateTokenCount();
      });
  
      onMounted(() => {
        fetchFileContents();
      });
  
      return {
        fileContents,
        tokenCount,
        internalUserTask,
        copyPrompt,
        onUserTaskChange,
      };
    },
  });
  </script>
  
  <style scoped>
  .prompt-builder {
    flex: 3;
    padding: 1rem;
    overflow-y: auto;
  }
  
  .user-task label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
  }
  
  .code-preview {
    margin-top: 1rem;
  }
  
  .file-content {
    margin-bottom: 1rem;
    background-color: #2b2b2b;
    padding: 1rem;
    border-radius: 4px;
  }
  
  .file-content h4 {
    margin: 0 0 0.5rem 0;
  }
  
  .token-count {
    margin: 1rem 0;
  }
  </style>
  