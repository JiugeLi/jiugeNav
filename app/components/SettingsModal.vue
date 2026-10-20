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
  <Modal :open="props.open" title="设置与数据" @close="emit('close')">
    <div class="p-6 space-y-6">
      <div
        v-if="message"
        class="p-3 rounded-lg flex items-center gap-2 text-sm border"
        :class="message.type === 'success'
          ? 'bg-green-50 text-green-700 border-green-100'
          : 'bg-red-50 text-red-700 border-red-100'"
      >
        <Check v-if="message.type === 'success'" :size="16" />
        <AlertTriangle v-else :size="16" />
        {{ message.text }}
      </div>

      <div v-if="isAdmin" class="space-y-3">
        <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider">账号安全</h3>

        <button class="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all" @click="goAdmin">
          <div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-red-600">
            <Shield :size="20" />
          </div>
          <div class="text-left">
            <div class="font-medium text-slate-900">管理后台</div>
            <div class="text-xs text-slate-500">用户、链接、数据管理</div>
          </div>
        </button>

        <button
          class="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
          @click="emit('close'); emit('changePassword')"
        >
          <div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-purple-600">
            <Lock :size="20" />
          </div>
          <div class="text-left">
            <div class="font-medium text-slate-900">修改密码</div>
            <div class="text-xs text-slate-500">更改管理员密码</div>
          </div>
        </button>
      </div>

      <div class="space-y-3">
        <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wider">数据管理</h3>

        <button
          :disabled="loading"
          class="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all disabled:opacity-60"
          @click="exportData"
        >
          <div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-blue-600">
            <Download :size="20" />
          </div>
          <div class="text-left">
            <div class="font-medium text-slate-900">导出数据</div>
            <div class="text-xs text-slate-500">下载 JSON 备份</div>
          </div>
        </button>

        <input ref="fileInput" type="file" accept=".json" class="hidden" @change="importData">
        <button
          :disabled="loading"
          class="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all disabled:opacity-60"
          @click="fileInput?.click()"
        >
          <div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-indigo-600">
            <Loader2 v-if="loading" :size="20" class="animate-spin" />
            <Upload v-else :size="20" />
          </div>
          <div class="text-left">
            <div class="font-medium text-slate-900">导入数据</div>
            <div class="text-xs text-slate-500">从 JSON 备份恢复</div>
          </div>
        </button>
      </div>

      <p class="text-xs text-slate-400 text-center pt-2 border-t border-slate-100">SoloLink v2.0.0</p>
    </div>
  </Modal>
</template>
