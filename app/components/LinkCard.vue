<script setup lang="ts">
import { Edit2, ExternalLink, Trash2 } from 'lucide-vue-next';
import WebsiteLogo from './WebsiteLogo.vue';
import type { Website } from '~/utils/types';

defineProps<{ site: Website; editable?: boolean }>();
const emit = defineEmits<{ open: []; edit: []; remove: [] }>();

function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return url;
  }
}
</script>

<template>
  <div
    class="group ac-link-card flex items-center gap-3.5 px-4 py-3.5 cursor-pointer"
    :title="site.description || site.url"
    @click="emit('open')"
  >
    <div class="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center overflow-hidden bg-surface-2 border border-[#edf1f8]">
      <WebsiteLogo :website="site" />
    </div>

    <div class="min-w-0 flex-1">
      <h3 class="font-bold text-[15px] truncate text-ink group-hover:text-sakura-600 transition-colors">{{ site.name }}</h3>
      <p class="text-[13px] text-ink-mute truncate mt-0.5">{{ hostOf(site.url) }}</p>
    </div>

    <div class="shrink-0 flex items-center">
      <ExternalLink :size="16" class="text-ink-mute" :class="editable ? 'group-hover:hidden' : ''" />
      <div v-if="editable" class="hidden group-hover:flex items-center gap-0.5">
        <button class="p-1.5 rounded-lg text-ink-mute hover:text-sakura-600 hover:bg-sakura-50 transition-colors" title="编辑" @click.stop="emit('edit')">
          <Edit2 :size="14" />
        </button>
        <button class="p-1.5 rounded-lg text-ink-mute hover:text-[#d92d20] hover:bg-[#fef3f2] transition-colors" title="删除" @click.stop="emit('remove')">
          <Trash2 :size="14" />
        </button>
      </div>
    </div>
  </div>
</template>
