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

    <div class="intro-rules">
      <label>Intro/Rules Text:</label>
      <textarea
        rows="4"
        :value="introRules"
        @input="onIntroRulesChange($event as InputEvent)"
        placeholder="Enter your intro/rules text here..."
        class="intro-rules-input"
      />
    </div>

    <div class="user-task">
      <div class="field-header">
        <label>User's Task:</label>
        <button @click="clearUserTask" class="clear-button" v-if="internalUserTask">
          <span class="icon">🗑️</span>
          Clear
        </button>
      </div>
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
  emits: ['update:userTask', 'update:introRules'],
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

    const onIntroRulesChange = (event: InputEvent) => {
      const target = event.target as HTMLTextAreaElement;
      emit('update:introRules', target.value);
      updateTokenCount();
    };

    const clearUserTask = () => {
      internalUserTask.value = '';
      emit('update:userTask', '');
      updateTokenCount();
    };

    // Watch for prop changes to update internal state
    watch(() => props.userTask, (newValue) => {
      internalUserTask.value = newValue;
    });

    // Watch for selected files changes
    watch(() => props.selectedFiles, () => {
      fetchFileContents();
    });

    // Watch for file contents changes to update token count
    watch(() => fileContents.value, () => {
      updateTokenCount();
    }, { deep: true });

    // Watch for intro rules changes to update token count
    watch(() => props.introRules, () => {
      updateTokenCount();
    });

    // Initial setup
    onMounted(() => {
      internalUserTask.value = props.userTask;
      fetchFileContents();
    });

    return {
      fileContents,
      tokenCount,
      internalUserTask,
      copyPrompt,
      onUserTaskChange,
      showCopiedTooltip,
      onIntroRulesChange,
      clearUserTask,
    };
  },
});
</script>

<style scoped>
.prompt-builder {
  flex: 3;
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background-color: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border);
  height: calc(100vh - 120px);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}

.title-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  background: linear-gradient(135deg, var(--primary) 0%, #818cf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.token-count {
  background-color: var(--surface-hover);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.intro-rules,
.user-task {
  margin-bottom: 1.5rem;
}

.field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

textarea {
  width: 100%;
  resize: none;
  min-height: 100px;
  font-family: inherit;
  line-height: 1.6;
  padding: 0.75rem;
  background-color: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 0.9375rem;
  transition: all 0.2s ease;
}

textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
}

.clear-button {
  background-color: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border);
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.clear-button:hover {
  color: var(--error);
  border-color: var(--error);
  background-color: rgba(239, 68, 68, 0.1);
}

.action-section {
  position: relative;
  margin-bottom: 2rem;
}

.copy-button {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, var(--primary) 0%, #818cf8 100%);
}

.copy-button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}

.tooltip {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--surface);
  color: var(--text);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border);
  animation: fadeInOut 2s ease-in-out;
}

.code-preview {
  background-color: var(--surface-hover);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  border: 1px solid var(--border);
}

.code-preview h3 {
  margin: 0 0 1.5rem 0;
  color: var(--text);
  font-size: 1.125rem;
  font-weight: 500;
}

.file-content {
  background-color: var(--surface);
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: 1rem;
}

.file-header {
  background-color: var(--surface-hover);
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border);
}

.file-header h4 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--text);
}

.file-path {
  display: block;
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

pre {
  margin: 0;
  padding: 1rem;
  overflow-x: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--text);
}

@keyframes fadeInOut {
  0%, 100% { opacity: 0; }
  10%, 90% { opacity: 1; }
}

/* Responsive design */
@media (max-width: 768px) {
  .prompt-builder {
    height: auto;
    max-height: none;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .title-section {
    flex-direction: column;
    align-items: flex-start;
  }

  .token-count {
    width: 100%;
  }

  textarea {
    min-height: 150px;
  }
}
</style>
  