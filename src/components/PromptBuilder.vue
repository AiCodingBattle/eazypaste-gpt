<template>
  <div class="prompt-builder">
    <div class="header">
      <div class="title-section">
        <h2>Prompt Builder</h2>
        <div class="token-count">
          <span>Approx. Token Count: {{ tokenCount }}</span>
        </div>
      </div>
      <button @click="copyPrompt" class="copy-button">Copy Full Prompt</button>
    </div>

    <div class="user-task">
      <label>User's Task:</label>
      <textarea
        rows="3"
        v-model="internalUserTask"
        @input="onUserTaskChange"
      ></textarea>
    </div>

    <div class="code-preview" v-if="selectedFiles.length">
      <h3>Selected Files Preview</h3>
      <div v-for="(fileData, index) in fileContents" :key="index" class="file-content">
        <div class="file-header">
          <h4>{{ fileData.fileName }}</h4>
          <span class="file-path">{{ fileData.relativePath }}</span>
        </div>
        <pre>{{ fileData.content }}</pre>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, onMounted } from 'vue';

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
    rootPath: {
      type: String,
      required: true,
    },
  },
  emits: ['update:userTask'],
  setup(props, { emit }) {
    const fileContents = ref<{ fileName: string; content: string; relativePath: string }[]>([]);
    const internalUserTask = ref(props.userTask);
    const tokenCount = ref(0);

    const getRelativePath = async (filePath: string) => {
      if (!window.electronAPI) return filePath;
      return await window.electronAPI.getRelativePath(filePath, props.rootPath);
    };

    const getBasename = async (filePath: string) => {
      if (!window.electronAPI) return filePath;
      return await window.electronAPI.getBasename(filePath);
    };

    const fetchFileContents = async () => {
      if (!window.electronAPI) return;
      
      fileContents.value = [];
      for (const filePath of props.selectedFiles) {
        const [content, fileName, relativePath] = await Promise.all([
          window.electronAPI.readFile(filePath),
          getBasename(filePath),
          getRelativePath(filePath),
        ]);
        
        fileContents.value.push({
          fileName,
          relativePath,
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
      fileContents.value.forEach((f, index) => {
        if (index > 0) prompt += '\n------\n';
        prompt += `File: ${f.relativePath}\n`;
        prompt += f.content + '\n';
      });
      return prompt;
    };

    const approximateTokens = (text: string) => {
      return Math.ceil(text.length / 4);
    };

    const updateTokenCount = () => {
      const prompt = buildPromptString();
      tokenCount.value = approximateTokens(prompt);
    };

    const copyPrompt = async () => {
      const prompt = buildPromptString();
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
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #444;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header h2 {
  margin: 0;
}

.token-count {
  background-color: #2b2b2b;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9em;
  color: #aaa;
}

.copy-button {
  padding: 0.5rem 1rem;
  background-color: #2b2b2b;
  color: #fff;
  border: 1px solid #444;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.copy-button:hover {
  background-color: #333;
}

.user-task {
  margin-bottom: 1.5rem;
}

.user-task label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.user-task textarea {
  width: 100%;
  background-color: #2b2b2b;
  color: #fff;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 0.5rem;
  resize: vertical;
}

.code-preview {
  margin-top: 1rem;
  flex: 1;
  overflow-y: auto;
}

.file-content {
  margin-bottom: 1rem;
  background-color: #2b2b2b;
  padding: 1rem;
  border-radius: 4px;
}

.file-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.file-header h4 {
  margin: 0;
  margin-right: 1rem;
}

.file-path {
  color: #888;
  font-size: 0.9em;
  font-family: monospace;
}

pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
  