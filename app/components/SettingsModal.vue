<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { AlertTriangle, Check, Download, Loader2, Lock, Shield, Upload } from 'lucide-vue-next';
import Modal from './Modal.vue';
import { apiGet, apiPost } from '~/utils/api';

const props = defineProps<{ open: boolean; isAdmin?: boolean }>();
const emit = defineEmits<{ close: []; changed: []; changePassword: [] }>();

const router = useRouter();
const loading = ref(false);
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

async function exportData() {
  loading.value = true;
  message.value = null;

  try {
    const data = await apiGet('/api/groups/export');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sololink-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    message.value = { type: 'success', text: '导出成功' };
  } catch (error) {
    console.error('导出失败', error);
    message.value = { type: 'error', text: '导出失败' };
  } finally {
    loading.value = false;
  }
}

async function importData(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  if (!confirm('导入会与现有数据合并，确定继续吗？')) {
    if (fileInput.value) fileInput.value.value = '';
    return;
  }

  loading.value = true;
  message.value = null;

  try {
    const json = JSON.parse(await file.text());
    await apiPost('/api/groups/import', { data: json.data, mode: 'merge' });
    message.value = { type: 'success', text: '导入成功' };
    emit('changed');
    setTimeout(() => emit('close'), 1200);
  } catch (error) {
    console.error('导入失败', error);
    message.value = { type: 'error', text: '导入失败，文件格式不正确' };
  } finally {
    loading.value = false;
    if (fileInput.value) fileInput.value.value = '';
  }
}

function goAdmin() {
  emit('close');
  router.push('/admin');
}
</script>

<template>
  <Modal :open="props.open" title="⚙ 设置与数据" @close="emit('close')">
    <div class="p-6 space-y-6">
      <div
        v-if="message"
        class="p-3 rounded-2xl flex items-center gap-2 text-sm font-semibold border-2"
        :class="message.type === 'success'
          ? 'bg-[#ecfdf3] text-[#067647] border-[#abefc6]'
          : 'bg-[#fef3f2] text-[#d92d20] border-[#fecdc9]'"
      >
        <Check v-if="message.type === 'success'" :size="16" />
        <AlertTriangle v-else :size="16" />
        {{ message.text }}
      </div>

      <div v-if="isAdmin" class="space-y-2.5">
        <h3 class="ac-section-title">✦ 账号安全</h3>

        <button class="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-surface border-2 border-sakura-100 hover:border-sakura-400 transition-colors text-left" style="box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05)" @click="goAdmin">
          <div class="w-10 h-10 rounded-2xl flex items-center justify-center text-sakura-600 shrink-0" style="background-image: linear-gradient(135deg, #EFF4FF, #DFE9FF)">
            <Shield :size="19" />
          </div>
          <div>
            <div class="font-extrabold text-sm text-ink">管理后台</div>
            <div class="text-[11px] font-semibold text-ink-mute">用户、链接、数据管理</div>
          </div>
          <span class="ml-auto text-sakura-400">›</span>
        </button>

        <button
          class="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-surface border-2 border-lumi-100 hover:border-lumi-400 transition-colors text-left"
          style="box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05)"
          @click="emit('close'); emit('changePassword')"
        >
          <div class="w-10 h-10 rounded-2xl flex items-center justify-center text-lumi-600 shrink-0" style="background-image: linear-gradient(135deg, #F4F1FF, #E9E3FF)">
            <Lock :size="19" />
          </div>
          <div>
            <div class="font-extrabold text-sm text-ink">修改密码</div>
            <div class="text-[11px] font-semibold text-ink-mute">更改管理员密码</div>
          </div>
          <span class="ml-auto text-lumi-300">›</span>
        </button>
      </div>

      <div class="space-y-2.5">
        <h3 class="ac-section-title">✧ 数据管理</h3>

        <button
          :disabled="loading"
          class="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-surface border-2 border-sky-100 hover:border-sky-400 transition-colors text-left disabled:opacity-60"
          style="box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05)"
          @click="exportData"
        >
          <div class="w-10 h-10 rounded-2xl flex items-center justify-center text-sky-600 shrink-0" style="background-image: linear-gradient(135deg, #ECFBFD, #D3F5FA)">
            <Download :size="19" />
          </div>
          <div>
            <div class="font-extrabold text-sm text-ink">导出数据</div>
            <div class="text-[11px] font-semibold text-ink-mute">下载 JSON 备份</div>
          </div>
        </button>

        <input ref="fileInput" type="file" accept=".json" class="hidden" @change="importData">
        <button
          :disabled="loading"
          class="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-surface border-2 border-mint-100 hover:border-mint-400 transition-colors text-left disabled:opacity-60"
          style="box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05)"
          @click="fileInput?.click()"
        >
          <div class="w-10 h-10 rounded-2xl flex items-center justify-center text-mint-600 shrink-0" style="background-image: linear-gradient(135deg, #ECFDF7, #D3FBEE)">
            <Loader2 v-if="loading" :size="19" class="animate-spin" />
            <Upload v-else :size="19" />
          </div>
          <div>
            <div class="font-extrabold text-sm text-ink">导入数据</div>
            <div class="text-[11px] font-semibold text-ink-mute">从 JSON 备份恢复</div>
          </div>
        </button>
      </div>

      <p class="text-[11px] font-bold text-center text-ink-mute pt-3 border-t-2 border-sakura-50">
        SoloLink v2.0.0 · Self-hosted
      </p>
    </div>
  </Modal>
</template>
