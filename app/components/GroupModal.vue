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
  <Modal :open="open" :title="initial ? '✎ 编辑分组' : '✿ 新建分组'" @close="emit('close')">
    <form class="p-6 space-y-5" @submit.prevent="submit">
      <div>
        <label class="ac-label">分组名称</label>
        <input v-model="name" type="text" class="ac-input" placeholder="例如：开发工具" required autofocus>
      </div>

      <div>
        <label class="ac-label">挑个图标</label>
        <div class="grid grid-cols-8 gap-1 max-h-44 overflow-y-auto custom-scrollbar p-2 rounded-2xl border-2 border-sakura-100 bg-sakura-50/60">
          <button
            v-for="option in ICONS"
            :key="option"
            type="button"
            class="w-8 h-8 flex items-center justify-center rounded-xl text-lg transition-all"
            :class="icon === option
              ? 'bg-white ring-2 ring-sakura-300 scale-110 shadow-sm'
              : 'hover:bg-white/90 hover:scale-110'"
            @click="icon = option"
          >
            {{ option }}
          </button>
        </div>
      </div>
    </form>

    <template #footer>
      <button type="button" class="ac-btn ac-btn-ghost px-5 py-2.5 text-sm" @click="emit('close')">
        取消
      </button>
      <button type="submit" class="ac-btn ac-btn-primary px-5 py-2.5 text-sm" @click="submit">
        <Check :size="16" />
        保存
      </button>
    </template>
  </Modal>
</template>
