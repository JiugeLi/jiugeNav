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
      <Sparkles :size="18" class="text-sakura-500" />
      {{ initial ? '✎ 编辑网站' : '◆ 添加网站' }}
    </template>

    <form class="p-6 space-y-5" @submit.prevent="submit">
      <div>
        <label class="ac-label">
          <LinkIcon :size="14" />
          网址
          <span class="ml-auto normal-case tracking-normal font-semibold text-[11px] text-ink-mute">输入后自动识别</span>
        </label>
        <div class="flex gap-2">
          <input
            v-model="form.url"
            type="text"
            class="ac-input flex-1"
            placeholder="example.com"
            required
            @blur="onUrlBlur"
          >
          <button
            type="button"
            :disabled="analyzing || !form.url"
            class="ac-btn ac-btn-lumi px-4 py-2 text-sm shrink-0"
            @click="analyze"
          >
            <Loader2 v-if="analyzing" :size="16" class="animate-spin" />
            <template v-else><Sparkles :size="15" />识别</template>
          </button>
        </div>
      </div>

      <div>
        <label class="ac-label"><FolderOpen :size="14" />分组</label>
        <select v-model.number="form.group_id" class="ac-input appearance-none cursor-pointer">
          <option v-for="group in groups" :key="group.id" :value="group.id">{{ group.icon }} {{ group.name }}</option>
        </select>
      </div>

      <div class="rounded-3xl border-2 border-sakura-100 bg-sakura-50/50 p-4 space-y-4">
        <div>
          <label class="ac-label"><Globe :size="14" />名称</label>
          <input v-model="form.name" type="text" class="ac-input" placeholder="网站名称" required>
        </div>

        <div>
          <label class="ac-label"><ImageIcon :size="14" />图标地址</label>
          <div class="flex items-center gap-3">
            <input v-model="form.logo_url" type="text" class="ac-input flex-1" placeholder="留空则使用站点 favicon">
            <div class="w-12 h-12 rounded-2xl bg-surface border-2 border-sakura-100 flex items-center justify-center overflow-hidden shrink-0">
              <img v-if="form.logo_url" :src="form.logo_url" alt="" class="w-8 h-8 object-contain">
              <Globe v-else class="text-sakura-400" :size="20" />
            </div>
          </div>
        </div>

        <div>
          <label class="ac-label"><FileText :size="14" />描述</label>
          <textarea
            v-model="form.description"
            class="ac-input min-h-[80px] resize-none"
            placeholder="写点什么吧～（选填）"
          />
        </div>
      </div>
    </form>

    <template #footer>
      <button type="button" class="ac-btn ac-btn-ghost px-5 py-2.5 text-sm" @click="emit('close')">
        取消
      </button>
      <button type="button" class="ac-btn ac-btn-primary px-5 py-2.5 text-sm" @click="submit">
        <Check :size="16" />
        保存
      </button>
    </template>
  </Modal>
</template>
