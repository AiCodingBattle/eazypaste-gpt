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
          @toggle-file="$emit('toggle-file', $event)"
        />
      </template>
    </ul>
  </li>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch } from 'vue';

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
  },
  emits: ['toggle-file'],
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

    const onNodeClick = async (event: Event) => {
      event.stopPropagation();
      if (props.node.isDirectory) {
        isExpanded.value = !isExpanded.value;
        if (isExpanded.value && children.value.length === 0) {
          await loadFolderContents();
        }
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
  padding: 4px;
  cursor: pointer;
  user-select: none;
}

.node-entry:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.expand-icon {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  margin-right: 4px;
}

.node-name {
  margin-left: 4px;
}

.node-name.is-file {
  margin-left: 24px;
}

.file-checkbox {
  margin-right: 4px;
}

.node-children {
  margin-left: 20px;
  list-style: none;
  padding-left: 0;
}

.loading {
  padding: 4px;
  color: #666;
  font-style: italic;
}
</style>