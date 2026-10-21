<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Globe } from 'lucide-vue-next';
import type { Website } from '~/utils/types';

const props = defineProps<{ website: Website }>();
// 0 = 首选图标，1 = Google favicon 兜底，2 = 全部失败显示地球
const attempt = ref(0);

const candidates = computed(() => {
  try {
    const { origin, hostname } = new URL(props.website.url);
    const saved = props.website.logo_url?.trim();
    const isGoogleFavicon = !!saved
      && (saved.includes('google.com/s2/favicons') || saved.includes('gstatic.com/faviconV2'));

    // 没有 logo、指向 Google 图标服务、或不是 https 时，先用站点自身 favicon
    const primary = !saved || isGoogleFavicon || !saved.startsWith('https://') ? `${origin}/favicon.ico` : saved;
    // 很多站点根目录没有 favicon.ico，失败后再走 Google 图标服务
    return [primary, `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`];
  } catch {
    return [];
  }
});

const src = computed(() => candidates.value[attempt.value] ?? null);

watch(candidates, () => { attempt.value = 0; });
</script>

<template>
  <img
    v-if="src"
    :src="src"
    :alt="website.name"
    class="w-7 h-7 object-contain"
    @error="attempt++"
  >
  <Globe v-else class="text-sakura-400" :size="22" />
</template>
