<script setup lang="ts">
import { ref } from 'vue';
import { Lock } from 'lucide-vue-next';
import Modal from './Modal.vue';
import { apiPost } from '~/utils/api';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const newPassword = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const error = ref('');
const success = ref('');

async function submit() {
  error.value = '';
  success.value = '';

  if (newPassword.value.length < 6) {
    error.value = '密码长度至少 6 位';
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致';
    return;
  }

  loading.value = true;
  try {
    await apiPost('/api/auth/change-password', { newPassword: newPassword.value });
    success.value = '密码修改成功';
    newPassword.value = '';
    confirmPassword.value = '';
    setTimeout(() => emit('close'), 1500);
  } catch (err) {
    error.value = err instanceof Error ? err.message : '密码修改失败';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Modal :open="props.open" @close="emit('close')">
    <template #title><Lock :size="20" class="text-blue-600" />修改管理员密码</template>

    <form class="p-6 space-y-4" @submit.prevent="submit">
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{{ error }}</div>
      <div v-if="success" class="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-600">{{ success }}</div>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">新密码</label>
        <input
          v-model="newPassword"
          type="password"
          minlength="6"
          required
          class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="至少 6 位"
        >
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">确认密码</label>
        <input
          v-model="confirmPassword"
          type="password"
          minlength="6"
          required
          class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="再次输入新密码"
        >
      </div>
    </form>

    <template #footer>
      <button
        type="button"
        class="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        @click="emit('close')"
      >
        取消
      </button>
      <button
        type="button"
        :disabled="loading"
        class="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
        @click="submit"
      >
        {{ loading ? '修改中...' : '确认修改' }}
      </button>
    </template>
  </Modal>
</template>
