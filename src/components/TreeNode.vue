<template>
  <li>
    <div
      class="node-entry"
      @click.stop="onNodeClick"
      :class="{ directory: node.isDirectory, selected: isSelected }"
    >
      <span v-if="node.isDirectory">
        ▶
      </span>
      <input
        v-if="!node.isDirectory"
        type="checkbox"
        :checked="isSelected"
        @change.stop="toggleFile"
      />
      <span>{{ node.name }}</span>
    </div>

    <ul v-if="node.children && node.children.length && node.isDirectory">
      <TreeNode
        v-for="(child, idx) in node.children"
        :key="idx"
        :node="child"
        :selectedFiles="selectedFiles"
        @toggle-file="$emit('toggle-file', $event)"
      />
    </ul>
  </li>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';

export default defineComponent({
  name: 'TreeNode',
  props: {
    node: {
      type: Object,
      required: true,
    },
    selectedFiles: {
      type: Array as () => string[],
      required: true,
    },
  },
  emits: ['toggle-file'],
  setup(props, { emit }) {
    const isSelected = computed(() => {
      return props.selectedFiles.includes(props.node.path);
    });

    const toggleFile = () => {
      emit('toggle-file', props.node.path);
    };

    const onNodeClick = () => {
      // If it's a file, toggle selection
      if (!props.node.isDirectory) {
        toggleFile();
      }
      // If it's a directory, we might do expand/collapse logic here if desired
    };

    return {
      isSelected,
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
  cursor: pointer;
}

.node-entry.directory {
  font-weight: bold;
}

.node-entry.selected {
  background-color: #333;
}
</style>