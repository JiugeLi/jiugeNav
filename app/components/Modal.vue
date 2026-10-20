<script setup lang="ts">
import { X } from 'lucide-vue-next';

withDefaults(defineProps<{ open: boolean; title?: string; width?: string }>(), {
  title: '',
  width: 'max-w-md',
});

const emit = defineEmits<{ close: [] }>();
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" @click="emit('close')" />

    <div
      class="relative bg-white rounded-2xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      :class="width"
    >
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
        <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
          <slot name="title">{{ title }}</slot>
        </h2>
        <button
          aria-label="关闭"
          class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          @click="emit('close')"
        >
          <X :size="20" />
        </button>
      </div>

      <div class="overflow-y-auto custom-scrollbar">
        <slot />
      </div>

      <div v-if="$slots.footer" class="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 flex-shrink-0">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>
