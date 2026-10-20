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
    <template #title><CheckCircle :size="18" class="text-mint-500" />链接体检</template>

    <div class="p-6">
      <div v-if="results.length === 0" class="text-center py-8">
        <div class="relative w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 bg-gradient-to-br from-mint-50 to-sky-50 border-2 border-dashed border-mint-200">
          <CheckCircle class="text-mint-400" :size="40" />
          <span class="absolute -top-1 -right-2 text-xl animate-ac-float">✨</span>
        </div>
        <h3 class="text-lg font-extrabold text-ink mb-2">开始全站体检～</h3>
        <p class="text-sm text-ink-soft mb-6 max-w-sm mx-auto leading-relaxed">检测 404、超时等异常情况，检查后可批量清理失效链接</p>
        <button class="ac-btn ac-btn-mint px-6 py-3 text-sm mx-auto" @click="startCheck">
          <CheckCircle :size="17" />
          开始检查
        </button>
      </div>

      <div v-else class="space-y-5">
        <div v-if="checking">
          <div class="flex items-center justify-between mb-2 text-sm">
            <span class="font-bold text-ink">正在检查… ({{ checkedCount }}/{{ total }})</span>
            <span class="font-extrabold text-sakura-600">{{ progress }}%</span>
          </div>
          <div class="w-full rounded-full h-3 overflow-hidden border-2 border-sakura-100 bg-sakura-50">
            <div class="h-full rounded-full transition-all duration-300" style="background-image: linear-gradient(90deg, #ffb3d3, #ff7fb4 50%, #a88cff)" :style="{ width: `${progress}%` }" />
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div class="rounded-2xl p-3 text-center bg-white border-2 border-sakura-100" style="box-shadow: 0 3px 0 #ffeef6">
            <div class="text-xl font-extrabold text-ink">{{ results.length }}</div>
            <div class="text-[11px] font-bold text-ink-mute">总链接数</div>
          </div>
          <div class="rounded-2xl p-3 text-center bg-white border-2 border-mint-100" style="box-shadow: 0 3px 0 #eafbf5">
            <div class="text-xl font-extrabold text-mint-600">{{ okCount }}</div>
            <div class="text-[11px] font-bold text-ink-mute">正常链接</div>
          </div>
          <div class="rounded-2xl p-3 text-center bg-white border-2 border-[#ffd9e2]" style="box-shadow: 0 3px 0 #ffe7ec">
            <div class="text-xl font-extrabold text-[#e0405f]">{{ badLinks.length }}</div>
            <div class="text-[11px] font-bold text-ink-mute">失效链接</div>
          </div>
          <div class="rounded-2xl p-3 text-center bg-white border-2 border-sky-100" style="box-shadow: 0 3px 0 #eaf6ff">
            <div class="text-xl font-extrabold text-sky-600">{{ pendingCount }}</div>
            <div class="text-[11px] font-bold text-ink-mute">待检查</div>
          </div>
        </div>

        <div v-if="!checking && badLinks.length > 0" class="flex items-center justify-between gap-2 bg-sakura-50/70 rounded-2xl p-3 border-2 border-sakura-100">
          <span class="text-sm font-semibold text-ink-soft">
            已选择 <span class="font-extrabold text-[#e0405f]">{{ selectedIds.size }}</span> 个链接待删除
          </span>
          <div class="flex gap-2 shrink-0">
            <button class="ac-btn ac-btn-ghost px-3 py-1.5 text-xs" @click="selectedIds = new Set(badLinks.map((r) => r.id))">
              全选失效
            </button>
            <button class="ac-btn ac-btn-ghost px-3 py-1.5 text-xs" @click="selectedIds = new Set()">
              取消全选
            </button>
          </div>
        </div>

        <div class="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
          <div
            v-for="link in results"
            :key="link.id"
            class="rounded-2xl p-3 flex items-start gap-3 border-2 transition-colors"
            :class="link.status === 'checking' ? 'bg-sky-50 border-sky-100'
              : link.status === 'ok' ? 'bg-mint-50 border-mint-100'
              : selectedIds.has(link.id) ? 'bg-[#ffe7ec] border-[#ffb8c8]' : 'bg-[#fff5f7] border-[#ffd9e2]'"
          >
            <button v-if="isBad(link) && !checking" class="shrink-0 mt-0.5" @click="toggle(link.id)">
              <CheckSquare v-if="selectedIds.has(link.id)" class="text-[#e0405f]" :size="19" />
              <Square v-else class="text-ink-mute" :size="19" />
            </button>

            <Loader2 v-if="link.status === 'checking'" class="text-sky-500 animate-spin shrink-0" :size="19" />
            <CheckCircle v-else-if="link.status === 'ok'" class="text-mint-500 shrink-0" :size="19" />
            <AlertCircle v-else-if="link.status === 'timeout'" class="text-sun-500 shrink-0" :size="19" />
            <XCircle v-else class="text-[#e0405f] shrink-0" :size="19" />

            <div class="flex-1 min-w-0">
              <div class="font-extrabold text-sm text-ink truncate">{{ link.name }}</div>
              <div class="text-xs font-semibold text-ink-mute truncate">{{ link.url }}</div>
              <span v-if="link.status === 'checking'" class="text-[11px] font-bold text-sky-600">检查中…</span>
              <span v-else-if="link.status === 'ok'" class="text-[11px] font-bold text-mint-600">正常 ({{ link.statusCode }})</span>
              <span v-else-if="link.status === 'timeout'" class="text-[11px] font-bold text-sun-600">超时</span>
              <span v-else class="text-[11px] font-bold text-[#e0405f]">错误 ({{ link.statusCode || link.error }})</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template v-if="results.length > 0" #footer>
      <button v-if="checking" class="ac-btn ac-btn-danger px-4 py-2 text-xs mr-auto" @click="stopCheck">
        停止检查
      </button>
      <button v-else class="ac-btn ac-btn-ghost px-4 py-2 text-xs mr-auto" @click="startCheck">
        重新检查
      </button>

      <button
        v-if="selectedIds.size > 0 && !checking"
        :disabled="deleting"
        class="ac-btn ac-btn-danger-solid px-4 py-2 text-xs"
        @click="deleteSelected"
      >
        <Loader2 v-if="deleting" class="animate-spin" :size="15" />
        <Trash2 v-else :size="15" />
        删除选中的 {{ selectedIds.size }} 个
      </button>
    </template>
  </Modal>
</template>
