<script setup lang="ts">
import { ref, watch } from 'vue';
import { Check } from 'lucide-vue-next';
import Modal from './Modal.vue';
import type { Group } from '~/utils/types';

const props = defineProps<{ open: boolean; initial?: Group | null }>();
const emit = defineEmits<{ close: []; submit: [data: Partial<Group>] }>();

const ICONS = [
  '📁', '🏠', '💼', '🔧', '🎮', '🎬', '🎵', '📚',
  '🛒', '💰', '📰', '🔬', '🎨', '✈️', '🍔', '⚽',
  '💻', '📱', '🌐', '🔒', '📧', '📷', '🎯', '⭐',
  '🚀', '💡', '🔥', '❤️', '🌟', '🎁', '🏆', '📌',
];

const name = ref('');
const icon = ref('📁');

watch(
  () => [props.open, props.initial],
  () => {
    name.value = props.initial?.name ?? '';
    icon.value = props.initial?.icon ?? '📁';
  },
  { immediate: true },
);

function submit() {
  emit('submit', { name: name.value, icon: icon.value, sort_order: props.initial?.sort_order ?? 0 });
}
</script>

<template>
  <Modal :open="open" :title="initial ? '编辑分组' : '新建分组'" @close="emit('close')">
    <form class="p-6 space-y-5" @submit.prevent="submit">
      <div>
        <label class="block text-sm font-semibold text-slate-700 mb-2">分组名称</label>
        <input
          v-model="name"
          type="text"
          class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm placeholder:text-slate-400"
          placeholder="例如：开发工具"
          required
          autofocus
        >
      </div>

      <div>
        <label class="block text-sm font-semibold text-slate-700 mb-2">图标</label>
        <div class="grid grid-cols-8 gap-1 max-h-40 overflow-y-auto custom-scrollbar p-2 border border-slate-200 rounded-xl">
          <button
            v-for="option in ICONS"
            :key="option"
            type="button"
            class="w-8 h-8 flex items-center justify-center rounded-lg text-lg transition-colors"
            :class="icon === option ? 'bg-blue-100 ring-1 ring-blue-300' : 'hover:bg-slate-100'"
            @click="icon = option"
          >
            {{ option }}
          </button>
        </div>
      </div>
    </form>

    <template #footer>
      <button type="button" class="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors" @click="emit('close')">
        取消
      </button>
      <button type="submit" class="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all flex items-center gap-2" @click="submit">
        <Check :size="16" />
        保存
      </button>
    </template>
  </Modal>
</template>
