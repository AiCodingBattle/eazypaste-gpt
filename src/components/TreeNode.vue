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

    <ul v-if="node.children && node.children.length && node.isDirectory" 
        v-show="isExpanded"
        class="node-children">
      <TreeNode
        v-for="(child, idx) in node.children"
        :key="child.path"
        :node="child"
        :selectedFiles="selectedFiles"
        @toggle-file="$emit('toggle-file', $event)"
      />
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
  children: TreeNode[];
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
  },
  emits: ['toggle-file'],
  setup(props, { emit }) {
    const isExpanded = ref(false);

    const isSelected = computed(() => {
      return props.selectedFiles.includes(props.node.path);
    });

    const toggleFile = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      emit('toggle-file', props.node.path);
    };

    const onNodeClick = (event: Event) => {
      event.stopPropagation();
      if (props.node.isDirectory) {
        isExpanded.value = !isExpanded.value;
      } else {
        toggleFile(event);
      }
    };

    // Reset expansion state when node changes
    watch(() => props.node, () => {
      isExpanded.value = false;
    });

    return {
      isSelected,
      isExpanded,
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
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 4px;
  margin: 2px 0;
  transition: all 0.2s;
}

.node-entry:hover {
  background-color: #2a2a2a;
}

.node-entry.directory {
  font-weight: bold;
}

.node-entry.selected {
  background-color: #333;
}

.expand-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 4px;
  transition: transform 0.2s;
  color: #666;
}

.expand-icon.expanded {
  transform: rotate(0deg);
  color: #999;
}

.file-checkbox {
  margin-right: 8px;
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.file-checkbox:checked {
  accent-color: #444;
}

.node-name {
  margin-left: 4px;
  user-select: none;
}

.node-name.is-file {
  color: #ccc;
}

.node-children {
  margin-left: 20px;
  border-left: 1px solid #333;
  padding-left: 8px;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
</style>