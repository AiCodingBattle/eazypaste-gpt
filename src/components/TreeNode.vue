<template>
  <li>
    <div
      class="node-entry"
      @click.stop="onNodeClick"
      :class="{ 
        directory: node.isDirectory, 
        selected: isSelected,
        expanded: isExpanded 
      }"
    >
      <span v-if="node.isDirectory" class="expand-icon" :class="{ expanded: isExpanded }">
        {{ isExpanded ? '▼' : '▶' }}
      </span>
      <input
        v-if="!node.isDirectory"
        type="checkbox"
        :checked="isSelected"
        @change="toggleFile"
        @click.stop
        class="file-checkbox"
      />
      <span class="node-name" :class="{ 'is-file': !node.isDirectory }">{{ node.name }}</span>
    </div>

    <ul v-if="node.isDirectory" v-show="isExpanded" class="node-children">
      <div v-if="isLoading" class="loading">Loading...</div>
      <template v-else>
        <TreeNode
          v-for="child in children"
          :key="child.path"
          :node="child"
          :selectedFiles="selectedFiles"
          :hiddenList="hiddenList"
          :forceExpanded="forceExpanded"
          @toggle-file="$emit('toggle-file', $event)"
          @expansion-change="$emit('expansion-change', $event)"
        />
      </template>
    </ul>
  </li>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, PropType } from 'vue';

interface TreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  type: 'directory' | 'file';
  children?: TreeNode[];
}

export default defineComponent({
  name: 'TreeNode',
  props: {
    node: {
      type: Object as () => TreeNode,
      required: true,
    },
    selectedFiles: {
      type: Array as () => string[],
      required: true,
    },
    hiddenList: {
      type: Array as () => string[],
      required: true,
    },
    forceExpanded: {
      type: Boolean as PropType<boolean | null>,
      default: null,
    }
  },
  emits: ['toggle-file', 'expansion-change'],
  setup(props, { emit }) {
    const isExpanded = ref(false);
    const isLoading = ref(false);
    const children = ref<TreeNode[]>([]);

    const isSelected = computed(() => {
      return props.selectedFiles.includes(props.node.path);
    });

    const loadFolderContents = async () => {
      if (!props.node.isDirectory) return;
      
      isLoading.value = true;
      try {
        const serializedHiddenList = JSON.parse(JSON.stringify(props.hiddenList));
        const contents = await window.electronAPI.getFolderContents(props.node.path, serializedHiddenList);
        
        if (!Array.isArray(contents)) {
          throw new Error('Invalid folder contents received');
        }
        
        children.value = contents.map(item => ({
          ...item,
          children: []
        }));
      } catch (error) {
        console.error('Error loading folder contents:', error);
        children.value = [];
      } finally {
        isLoading.value = false;
      }
    };

    const toggleFile = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      emit('toggle-file', props.node.path);
    };

    // Watch for forced expansion state changes
    watch(() => props.forceExpanded, async (newValue) => {
      if (newValue !== null) {
        isExpanded.value = newValue;
        if (newValue) {
          // Load contents if they haven't been loaded yet
          if (children.value.length === 0) {
            await loadFolderContents();
          }
          // Emit the current expansion state
          emit('expansion-change', {
            path: props.node.path,
            isExpanded: isExpanded.value
          });
        }
      }
    });

    const onNodeClick = async (event: Event) => {
      event.stopPropagation();
      if (props.node.isDirectory) {
        isExpanded.value = !isExpanded.value;
        if (isExpanded.value && children.value.length === 0) {
          await loadFolderContents();
        }
        // Emit expansion state change
        emit('expansion-change', {
          path: props.node.path,
          isExpanded: isExpanded.value
        });
      } else {
        toggleFile(event);
      }
    };

    // Reset expansion state when node changes
    watch(() => props.node, () => {
      isExpanded.value = false;
      children.value = [];
    });

    return {
      isSelected,
      isExpanded,
      isLoading,
      children,
      toggleFile,
      onNodeClick,
    };
  },
});
</script>

<style scoped>
.node-entry {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  cursor: pointer;
  user-select: none;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
  color: var(--text-secondary);
}

.node-entry:hover {
  background-color: var(--surface-hover);
  color: var(--text);
}

.node-entry.selected {
  background-color: rgba(79, 70, 229, 0.1);
  color: var(--text);
}

.node-entry.directory {
  font-weight: 500;
  color: var(--text);
}

.expand-icon {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--text-secondary);
  transition: transform 0.2s ease;
}

.expand-icon.expanded {
  transform: rotate(0deg);
}

.expand-icon:not(.expanded) {
  transform: rotate(-90deg);
}

.node-name {
  margin-left: 0.5rem;
  font-size: 0.9375rem;
  transition: color 0.2s ease;
}

.node-name.is-file {
  margin-left: 0.5rem;
  opacity: 0.8;
}

.file-checkbox {
  width: 18px;
  height: 18px;
  margin: 0;
  margin-right: 0.5rem;
  cursor: pointer;
  border: 2px solid var(--border);
  border-radius: var(--radius-sm);
  background-color: var(--surface);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  appearance: none;
  -webkit-appearance: none;
}

.file-checkbox:checked {
  background-color: var(--primary);
  border-color: var(--primary);
}

.file-checkbox:checked::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 6px;
  height: 10px;
  border: solid white;
  border-width: 0 2.5px 2.5px 0;
  transform: rotate(45deg) scale(1);
  opacity: 1;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.file-checkbox:not(:checked)::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 6px;
  height: 10px;
  border: solid white;
  border-width: 0 2.5px 2.5px 0;
  transform: rotate(45deg) scale(0);
  opacity: 0;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.file-checkbox:hover {
  border-color: var(--primary);
  background-color: rgba(79, 70, 229, 0.1);
}

.file-checkbox:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
}

.node-children {
  margin-left: 1.25rem;
  list-style: none;
  padding-left: 0;
  position: relative;
}

.node-children::before {
  content: '';
  position: absolute;
  left: -12px;
  top: 0;
  bottom: 0;
  width: 1px;
  background-color: var(--border);
  opacity: 0.5;
}

.loading {
  padding: 0.75rem;
  color: var(--text-secondary);
  font-style: italic;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.loading::before {
  content: '';
  width: 14px;
  height: 14px;
  border: 2px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
