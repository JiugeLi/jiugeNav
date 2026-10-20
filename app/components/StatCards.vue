<script setup lang="ts">
import { Calendar, Link2, MousePointerClick, Plus } from 'lucide-vue-next';
import type { Stats } from '~/utils/types';

const props = defineProps<{ stats: Stats }>();

const cards = [
  {
    key: 'totalLinks', label: '总链接数', icon: Link2, emoji: '🔗',
    bg: 'linear-gradient(135deg, #ffb3d3 0%, #ff7fb4 55%, #ff9ecb 100%)',
    ring: '#ffd9ea', ink: '#ffffff',
  },
  {
    key: 'totalClicks', label: '总点击量', icon: MousePointerClick, emoji: '💖',
    bg: 'linear-gradient(135deg, #9bf2dd 0%, #5fe0be 55%, #67d6ff 100%)',
    ring: '#c9fbef', ink: '#ffffff',
  },
  {
    key: 'weeklyClicks', label: '本周点击', icon: Calendar, emoji: '✨',
    bg: 'linear-gradient(135deg, #d3c2ff 0%, #a88cff 55%, #c9a6ff 100%)',
    ring: '#e6dcff', ink: '#ffffff',
  },
  {
    key: 'newLinksThisWeek', label: '本周新增', icon: Plus, emoji: '🌱',
    bg: 'linear-gradient(135deg, #ffe3ac 0%, #ffc46b 55%, #ffb0a0 100%)',
    ring: '#fff0d2', ink: '#ffffff',
  },
] as const;
</script>

<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
    <div
      v-for="card in cards"
      :key="card.key"
      class="relative overflow-hidden rounded-3xl p-4 sm:p-5 border-2 border-white/70 transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.02]"
      :style="{ backgroundImage: card.bg, boxShadow: `0 6px 0 -1px ${card.ring}, 0 22px 34px -24px rgba(120, 84, 168, 0.75)` }"
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
        <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/30 border border-white/50 flex items-center justify-center text-white shrink-0">
          <component :is="card.icon" :size="18" />
        </div>
      </div>
    </div>
  </div>
</template>
