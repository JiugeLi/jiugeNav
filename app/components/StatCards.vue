<script setup lang="ts">
import { Calendar, Link2, MousePointerClick, Plus } from 'lucide-vue-next';
import type { Stats } from '~/utils/types';

const props = defineProps<{ stats: Stats }>();

const cards = [
  { key: 'totalLinks', label: '总链接数', icon: Link2, color: 'from-blue-500 to-blue-600' },
  { key: 'totalClicks', label: '总点击量', icon: MousePointerClick, color: 'from-emerald-500 to-emerald-600' },
  { key: 'weeklyClicks', label: '本周点击', icon: Calendar, color: 'from-violet-500 to-violet-600' },
  { key: 'newLinksThisWeek', label: '本周新增', icon: Plus, color: 'from-amber-500 to-orange-500' },
] as const;
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
    <div
      v-for="card in cards"
      :key="card.key"
      class="bg-gradient-to-br rounded-2xl p-4 text-white shadow-lg"
      :class="card.color"
    >
      <div class="flex items-center justify-between">
        <div>
          <p class="text-white/80 text-xs font-medium">{{ card.label }}</p>
          <p class="text-2xl font-bold mt-1">{{ props.stats[card.key] }}</p>
        </div>
        <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <component :is="card.icon" :size="20" />
        </div>
      </div>
    </div>
  </div>
</template>
