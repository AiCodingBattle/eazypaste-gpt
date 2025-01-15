<template>
  <div class="prompt-builder">
    <div class="header">
      <div class="title-section">
        <h2>Prompt Builder</h2>
        <div class="token-count">
          <span>Approx. Token Count: {{ tokenCount }}</span>
        </div>
      </div>
    </div>

    <div class="user-task">
      <label>User's Task:</label>
      <textarea
        rows="3"
        v-model="internalUserTask"
        @input="onUserTaskChange"
        placeholder="Enter your task description here..."
      ></textarea>
    </div>

    <div class="action-section">
      <button @click="copyPrompt" class="copy-button">
        <span class="icon">📋</span>
        Copy Full Prompt
      </button>
      <div class="tooltip" v-if="showCopiedTooltip">Copied to clipboard!</div>
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
    const showCopiedTooltip = ref(false);

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
      showCopiedTooltip.value = true;
      setTimeout(() => {
        showCopiedTooltip.value = false;
      }, 2000);
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
      showCopiedTooltip,
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
  background-color: #1e1e1e;
  color: #d4d4d4;
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
  color: #fff;
}

.token-count {
  background-color: #2d2d2d;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9em;
  color: #aaa;
}

.user-task {
  margin-bottom: 1.5rem;
}

.user-task label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #fff;
}

.user-task textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #444;
  border-radius: 4px;
  background-color: #2d2d2d;
  color: #d4d4d4;
  font-size: 14px;
  resize: vertical;
}

.user-task textarea:focus {
  outline: none;
  border-color: #007acc;
}

.action-section {
  position: relative;
  display: flex;
  justify-content: center;
  margin: 1rem 0 2rem;
  padding: 1rem 0;
  border-top: 1px solid #444;
  border-bottom: 1px solid #444;
}

.copy-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #2d2d2d;
  color: #fff;
  border: 1px solid #444;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.copy-button:hover {
  background-color: #3d3d3d;
  border-color: #666;
}

.copy-button .icon {
  font-size: 16px;
}

.tooltip {
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #333;
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 12px;
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -10px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

.code-preview {
  margin-top: 1rem;
}

.code-preview h3 {
  margin-bottom: 1rem;
  color: #fff;
}

.file-content {
  margin-bottom: 2rem;
  background-color: #2d2d2d;
  border: 1px solid #444;
  border-radius: 4px;
  overflow: hidden;
}

.file-header {
  padding: 0.75rem;
  background-color: #252525;
  border-bottom: 1px solid #444;
}

.file-header h4 {
  margin: 0;
  color: #fff;
}

.file-path {
  display: block;
  font-size: 12px;
  color: #888;
  margin-top: 0.25rem;
}

.file-content pre {
  margin: 0;
  padding: 1rem;
  overflow-x: auto;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.5;
}

::placeholder {
  color: #666;
}
</style>
  