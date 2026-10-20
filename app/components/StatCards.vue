<script setup lang="ts">
import { Calendar, Link2, MousePointerClick, Plus } from 'lucide-vue-next';
import type { Stats } from '~/utils/types';

const props = defineProps<{ stats: Stats }>();

const cards = [
  {
    key: 'totalLinks', label: '总链接数', icon: Link2,
    accent: '#4F7CFF', soft: '#EFF4FF',
  },
  {
    key: 'totalClicks', label: '总点击量', icon: MousePointerClick,
    accent: '#17A289', soft: '#ECFDF7',
  },
  {
    key: 'weeklyClicks', label: '本周点击', icon: Calendar,
    accent: '#7C5CF5', soft: '#F4F1FF',
  },
  {
    key: 'newLinksThisWeek', label: '本周新增', icon: Plus,
    accent: '#D98F10', soft: '#FFF8E8',
  },
] as const;
</script>

<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
    <div
      v-for="card in cards"
      :key="card.key"
      class="ac-card p-4 sm:p-5"
    >
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <p class="text-[11px] sm:text-xs font-bold tracking-wider text-ink-mute">{{ card.label }}</p>
          <p class="text-2xl sm:text-3xl font-extrabold mt-1.5 leading-none text-ink">
            {{ props.stats[card.key] }}
          </p>
        </div>
        <div
          class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0"
          :style="{ backgroundColor: card.soft, color: card.accent }"
        >
          <component :is="card.icon" :size="17" />
        </div>
      </div>
    </div>
  </div>
</template>
