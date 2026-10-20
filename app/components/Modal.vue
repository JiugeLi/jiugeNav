<script setup lang="ts">
import { Sparkles, X } from 'lucide-vue-next';

withDefaults(defineProps<{ open: boolean; title?: string; width?: string }>(), {
  title: '',
  width: 'max-w-md',
});

const emit = defineEmits<{ close: [] }>();
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-[#2b1b3d]/30 backdrop-blur-md" @click="emit('close')" />

    <div
      class="relative w-full flex flex-col max-h-[90vh] overflow-hidden animate-ac-pop rounded-[28px] bg-white border-2 border-sakura-200"
      style="box-shadow: 0 8px 0 -2px #ffe1ef, 0 34px 70px -30px rgba(120, 84, 168, 0.6)"
      :class="width"
    >
      <!-- 顶部彩条 -->
      <div class="h-1.5 w-full bg-gradient-to-r from-sakura-300 via-lumi-300 to-sky-300" />

      <div class="px-6 py-4 flex items-center justify-between gap-3 flex-shrink-0 bg-gradient-to-br from-sakura-50 to-lumi-50/70">
        <h2 class="text-base font-extrabold text-ink flex items-center gap-2">
          <slot name="title">
            <Sparkles :size="18" class="text-sakura-500" />
            {{ title }}
          </slot>
        </h2>
        <button
          aria-label="关闭"
          class="p-2 rounded-full text-ink-soft bg-white/80 border border-sakura-100 hover:text-sakura-600 hover:border-sakura-300 hover:rotate-90 transition-all duration-200"
          @click="emit('close')"
        >
          <X :size="18" />
        </button>
      </div>

      <div class="ac-divider" />

      <div class="overflow-y-auto custom-scrollbar">
        <slot />
      </div>

      <div v-if="$slots.footer" class="px-6 py-4 bg-sakura-50/60 border-t-2 border-sakura-100 flex justify-end items-center gap-3 flex-shrink-0">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>
