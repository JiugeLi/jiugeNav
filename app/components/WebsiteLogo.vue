<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Globe } from 'lucide-vue-next';
import type { Website } from '~/utils/types';

const props = defineProps<{ website: Website }>();
const failed = ref(false);

const src = computed(() => {
  try {
    const origin = new URL(props.website.url).origin;
    const saved = props.website.logo_url?.trim();
    const isGoogleFavicon = !!saved
      && (saved.includes('google.com/s2/favicons') || saved.includes('gstatic.com/faviconV2'));

    // 没有 logo、指向 Google 图标服务、或不是 https 时，统一退化到站点自身 favicon
    return !saved || isGoogleFavicon || !saved.startsWith('https://') ? `${origin}/favicon.ico` : saved;
  } catch {
    return null;
  }
});

watch(src, () => { failed.value = false; });
</script>

<template>
  <img
    v-if="src && !failed"
    :src="src"
    :alt="website.name"
    class="w-10 h-10 object-contain"
    @error="failed = true"
  >
  <Globe v-else class="text-sakura-400" :size="24" />
</template>
