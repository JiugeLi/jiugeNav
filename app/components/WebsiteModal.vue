<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { Check, FileText, FolderOpen, Globe, ImageIcon, Link as LinkIcon, Loader2, Sparkles } from 'lucide-vue-next';
import Modal from './Modal.vue';
import { apiPost } from '~/utils/api';
import type { Group, Website } from '~/utils/types';

const props = defineProps<{ open: boolean; groups: Group[]; groupId: number; initial?: Website | null }>();
const emit = defineEmits<{ close: []; submit: [data: Partial<Website>] }>();

const form = reactive<Partial<Website>>({});
const analyzing = ref(false);

function reset() {
  const base = props.initial ?? {
    name: '', url: '', description: '', logo_url: '',
    logo_type: 'default', sort_order: 0, group_id: props.groupId,
  };
  Object.assign(form, base);
}

watch(() => [props.open, props.initial, props.groupId], reset, { immediate: true });

async function analyze() {
  if (!form.url) return;
  analyzing.value = true;

  try {
    const meta = await apiPost<{ title: string; description: string; logoUrl: string; url: string }>(
      '/api/websites/analyze',
      { url: form.url },
    );

    form.name = meta.title || form.name;
    form.description = meta.description || form.description;
    form.logo_url = meta.logoUrl || form.logo_url;
    form.url = meta.url || form.url;
    form.logo_type = 'auto';
  } catch (error) {
    console.error('智能识别失败', error);
  } finally {
    analyzing.value = false;
  }
}

function onUrlBlur() {
  // 新增网站且还没填名字时，失焦自动识别
  if (!props.initial && !form.name && form.url) analyze();
}

function submit() {
  emit('submit', { ...form, group_id: form.group_id ?? props.groupId });
}
</script>

<template>
  <Modal :open="open" width="max-w-lg" @close="emit('close')">
    <template #title>
      <Globe v-if="initial" :size="20" class="text-blue-500" />
      <Sparkles v-else :size="20" class="text-blue-500" />
      {{ initial ? '编辑网站' : '添加网站' }}
    </template>

    <form class="p-6 space-y-5" @submit.prevent="submit">
      <div>
        <label class="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
          <LinkIcon :size="16" class="text-slate-400" />
          网址
          <span class="text-slate-400 font-normal text-xs ml-auto">输入网址可自动识别</span>
        </label>
        <div class="flex gap-2">
          <input
            v-model="form.url"
            type="text"
            class="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm placeholder:text-slate-400"
            placeholder="example.com"
            required
            @blur="onUrlBlur"
          >
          <button
            type="button"
            :disabled="analyzing || !form.url"
            class="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 text-sm font-medium whitespace-nowrap"
            @click="analyze"
          >
            <Loader2 v-if="analyzing" :size="18" class="animate-spin" />
            <template v-else><Sparkles :size="16" />智能识别</template>
          </button>
        </div>
      </div>

      <div>
        <label class="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
          <FolderOpen :size="16" class="text-slate-400" />
          分组
        </label>
        <select
          v-model.number="form.group_id"
          class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm bg-white"
        >
          <option v-for="group in groups" :key="group.id" :value="group.id">{{ group.name }}</option>
        </select>
      </div>

      <div class="border-t border-slate-100 pt-4 space-y-4">
        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <Globe :size="16" class="text-slate-400" />
            名称
          </label>
          <input
            v-model="form.name"
            type="text"
            class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm placeholder:text-slate-400"
            placeholder="网站名称"
            required
          >
        </div>

        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <ImageIcon :size="16" class="text-slate-400" />
            图标地址
          </label>
          <div class="flex items-center gap-3">
            <input
              v-model="form.logo_url"
              type="text"
              class="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm placeholder:text-slate-400"
              placeholder="留空则使用站点 favicon"
            >
            <div class="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img v-if="form.logo_url" :src="form.logo_url" alt="" class="w-8 h-8 object-contain">
              <Globe v-else class="text-slate-300" :size="20" />
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <FileText :size="16" class="text-slate-400" />
            描述
          </label>
          <textarea
            v-model="form.description"
            class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm placeholder:text-slate-400 min-h-[80px] resize-none"
            placeholder="选填"
          />
        </div>
      </div>
    </form>

    <template #footer>
      <button type="button" class="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors" @click="emit('close')">
        取消
      </button>
      <button type="button" class="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all flex items-center gap-2" @click="submit">
        <Check :size="16" />
        保存
      </button>
    </template>
  </Modal>
</template>
