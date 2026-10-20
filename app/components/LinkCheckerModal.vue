<script setup lang="ts">
import { computed, ref } from 'vue';
import { AlertCircle, CheckCircle, CheckSquare, Loader2, Square, Trash2, XCircle } from 'lucide-vue-next';
import Modal from './Modal.vue';
import { apiDelete, apiGet } from '~/utils/api';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: []; changed: [] }>();

interface CheckResult {
  id: number;
  name: string;
  url: string;
  status: 'checking' | 'ok' | 'error' | 'timeout';
  statusCode?: number;
  error?: string;
}

interface BatchResponse {
  total: number;
  batchIndex: number;
  batchSize: number;
  isLastBatch: boolean;
  results: CheckResult[];
  progress: number;
}

const checking = ref(false);
const deleting = ref(false);
const results = ref<CheckResult[]>([]);
const checkedCount = ref(0);
const total = ref(0);
const progress = ref(0);
const selectedIds = ref<Set<number>>(new Set());
let controller: AbortController | null = null;

const isBad = (result: CheckResult) => result.status !== 'ok' && result.status !== 'checking';
const badLinks = computed(() => results.value.filter(isBad));
const okCount = computed(() => results.value.filter((r) => r.status === 'ok').length);
const pendingCount = computed(() => results.value.filter((r) => r.status === 'checking').length);

async function startCheck() {
  controller = new AbortController();
  const signal = controller.signal;

  results.value = [];
  selectedIds.value = new Set();
  progress.value = 0;
  checkedCount.value = 0;
  checking.value = true;

  try {
    let batchIndex = 0;
    let collected: CheckResult[] = [];

    while (!signal.aborted) {
      const batch = await apiGet<BatchResponse>(`/api/websites/check?batch=${batchIndex}`, signal);

      if (batchIndex === 0) {
        total.value = batch.total;
        // 先占位，避免结果区在第一批返回前空白
        collected = Array.from({ length: batch.total }, (_, i) => ({
          id: -1 - i, name: '检查中...', url: '', status: 'checking' as const,
        }));
      }

      batch.results.forEach((result, index) => {
        collected[batch.batchSize * batchIndex + index] = result;
      });

      results.value = [...collected];
      checkedCount.value = Math.min((batchIndex + 1) * batch.batchSize, batch.total);
      progress.value = batch.progress;

      if (batch.isLastBatch) break;
      batchIndex++;
    }

    if (!signal.aborted) {
      selectedIds.value = new Set(collected.filter(isBad).map((r) => r.id));
    }
  } catch (error) {
    if ((error as Error)?.name !== 'AbortError') {
      console.error('链接检查失败', error);
      alert('链接检查失败，请稍后重试');
    }
  } finally {
    checking.value = false;
  }
}

function stopCheck() {
  controller?.abort();
  checking.value = false;
}

function toggle(id: number) {
  const next = new Set(selectedIds.value);
  next.has(id) ? next.delete(id) : next.add(id);
  selectedIds.value = next;
}

async function deleteSelected() {
  if (selectedIds.value.size === 0) return;
  if (!confirm(`确定删除选中的 ${selectedIds.value.size} 个链接吗？`)) return;

  deleting.value = true;
  const ids = Array.from(selectedIds.value);

  try {
    await apiDelete(`/api/websites/check?ids=${ids.join(',')}`);
    alert(`已删除 ${ids.length} 个链接`);
    emit('changed');
    emit('close');
  } catch (error) {
    console.error('删除失败', error);
    alert('删除失败，请稍后重试');
  } finally {
    deleting.value = false;
  }
}

function close() {
  stopCheck();
  emit('close');
}
</script>

<template>
  <Modal :open="props.open" width="max-w-3xl" @close="close">
    <template #title><CheckCircle :size="20" class="text-blue-600" />链接检查器</template>

    <div class="p-6">
      <div v-if="results.length === 0" class="text-center py-10">
        <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle class="text-slate-400" :size="40" />
        </div>
        <h3 class="text-lg font-semibold text-slate-900 mb-2">开始检查链接</h3>
        <p class="text-slate-500 mb-6">检测 404、超时等异常情况，检查后可批量清理失效链接</p>
        <button class="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all shadow-md mx-auto" @click="startCheck">
          <CheckCircle :size="18" />
          开始检查
        </button>
      </div>

      <div v-else class="space-y-5">
        <div v-if="checking">
          <div class="flex items-center justify-between mb-2 text-sm">
            <span class="font-medium text-slate-700">正在检查... ({{ checkedCount }}/{{ total }})</span>
            <span class="font-medium text-blue-600">{{ progress }}%</span>
          </div>
          <div class="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div class="bg-blue-600 h-2 transition-all duration-300" :style="{ width: `${progress}%` }" />
          </div>
        </div>

        <div class="grid grid-cols-4 gap-3">
          <div class="rounded-xl p-3 text-center bg-slate-50">
            <div class="text-xl font-bold text-slate-900">{{ results.length }}</div>
            <div class="text-xs text-slate-500">总链接数</div>
          </div>
          <div class="rounded-xl p-3 text-center bg-green-50">
            <div class="text-xl font-bold text-green-600">{{ okCount }}</div>
            <div class="text-xs text-slate-500">正常链接</div>
          </div>
          <div class="rounded-xl p-3 text-center bg-red-50">
            <div class="text-xl font-bold text-red-600">{{ badLinks.length }}</div>
            <div class="text-xs text-slate-500">失效链接</div>
          </div>
          <div class="rounded-xl p-3 text-center bg-blue-50">
            <div class="text-xl font-bold text-blue-600">{{ pendingCount }}</div>
            <div class="text-xs text-slate-500">待检查</div>
          </div>
        </div>

        <div v-if="!checking && badLinks.length > 0" class="flex items-center justify-between bg-slate-50 rounded-xl p-3">
          <span class="text-sm text-slate-600">
            已选择 <span class="font-bold text-red-600">{{ selectedIds.size }}</span> 个链接待删除
          </span>
          <div class="flex gap-2">
            <button class="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" @click="selectedIds = new Set(badLinks.map((r) => r.id))">
              全选失效链接
            </button>
            <button class="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors" @click="selectedIds = new Set()">
              取消全选
            </button>
          </div>
        </div>

        <div class="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
          <div
            v-for="link in results"
            :key="link.id"
            class="rounded-xl p-3 flex items-start gap-3 border"
            :class="link.status === 'checking' ? 'bg-blue-50 border-blue-100'
              : link.status === 'ok' ? 'bg-green-50 border-green-100'
              : selectedIds.has(link.id) ? 'bg-red-100 border-red-300' : 'bg-red-50 border-red-100'"
          >
            <button v-if="isBad(link) && !checking" class="flex-shrink-0 mt-0.5" @click="toggle(link.id)">
              <CheckSquare v-if="selectedIds.has(link.id)" class="text-red-600" :size="20" />
              <Square v-else class="text-slate-400" :size="20" />
            </button>

            <Loader2 v-if="link.status === 'checking'" class="text-blue-500 animate-spin" :size="20" />
            <CheckCircle v-else-if="link.status === 'ok'" class="text-green-500" :size="20" />
            <AlertCircle v-else-if="link.status === 'timeout'" class="text-orange-500" :size="20" />
            <XCircle v-else class="text-red-500" :size="20" />

            <div class="flex-1 min-w-0">
              <div class="font-medium text-slate-900 truncate">{{ link.name }}</div>
              <div class="text-sm text-slate-500 truncate">{{ link.url }}</div>
              <span v-if="link.status === 'checking'" class="text-blue-600 text-xs">检查中...</span>
              <span v-else-if="link.status === 'ok'" class="text-green-600 text-xs">正常 ({{ link.statusCode }})</span>
              <span v-else-if="link.status === 'timeout'" class="text-orange-600 text-xs">超时</span>
              <span v-else class="text-red-600 text-xs">错误 ({{ link.statusCode || link.error }})</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template v-if="results.length > 0" #footer>
      <button v-if="checking" class="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mr-auto" @click="stopCheck">
        停止检查
      </button>
      <button v-else class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors mr-auto" @click="startCheck">
        重新检查
      </button>

      <button
        v-if="selectedIds.size > 0 && !checking"
        :disabled="deleting"
        class="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        @click="deleteSelected"
      >
        <Loader2 v-if="deleting" class="animate-spin" :size="18" />
        <Trash2 v-else :size="18" />
        删除选中的 {{ selectedIds.size }} 个链接
      </button>
    </template>
  </Modal>
</template>
