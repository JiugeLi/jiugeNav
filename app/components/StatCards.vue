<script setup lang="ts">
import { Calendar, Link2, MousePointerClick, Plus } from 'lucide-vue-next';
import type { Stats } from '~/utils/types';

const props = defineProps<{ stats: Stats }>();

const cards = [
  {
    key: 'totalLinks', label: '总链接数', icon: Link2, emoji: '🔗',
    bg: 'linear-gradient(135deg, #4f7cff 0%, #3457d8 55%, #7c5cf5 100%)',
    ring: '#1b2250', ink: '#ffffff',
  },
  {
    key: 'totalClicks', label: '总点击量', icon: MousePointerClick, emoji: '💖',
    bg: 'linear-gradient(135deg, #46ddc1 0%, #2ec4a8 55%, #2fb8d8 100%)',
    ring: '#0e2f2c', ink: '#ffffff',
  },
  {
    key: 'weeklyClicks', label: '本周点击', icon: Calendar, emoji: '✨',
    bg: 'linear-gradient(135deg, #9a7dff 0%, #7c5cf5 55%, #6a63ff 100%)',
    ring: '#211a4d', ink: '#ffffff',
  },
  {
    key: 'newLinksThisWeek', label: '本周新增', icon: Plus, emoji: '🌱',
    bg: 'linear-gradient(135deg, #ffc963 0%, #f0992e 55%, #e8734a 100%)',
    ring: '#33260f', ink: '#ffffff',
  },
] as const;
</script>

<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
    <div
      v-for="card in cards"
      :key="card.key"
      class="relative overflow-hidden rounded-3xl p-4 sm:p-5 border-2 border-white/15 transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.02]"
      :style="{ backgroundImage: card.bg, boxShadow: `0 6px 0 -1px ${card.ring}, 0 22px 34px -24px rgba(0, 0, 0, 0.85)` }"
    >
      <div class="absolute inset-0 opacity-40" style="background-image: radial-gradient(rgba(255, 255, 255, 0.95) 1px, transparent 1px); background-size: 14px 14px" />
      <span class="absolute -right-2 -bottom-3 text-5xl opacity-25 select-none">{{ card.emoji }}</span>
      <span class="absolute top-2 right-3 text-white/70 text-xs animate-ac-twinkle">✧</span>

      <div class="relative flex items-start justify-between gap-2">
        <div>
          <p class="text-white/85 text-[11px] sm:text-xs font-bold tracking-wider">{{ card.label }}</p>
          <p class="text-white text-2xl sm:text-3xl font-extrabold mt-1 leading-none" style="text-shadow: 0 2px 0 rgba(120, 40, 80, 0.18)">
            {{ props.stats[card.key] }}
          </p>
        </div>
        <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-white shrink-0">
          <component :is="card.icon" :size="18" />
        </div>
      </div>
    </div>
  </div>
</template>
